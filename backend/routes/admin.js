// =============================================
// FILE: /backend/routes/admin.js
// CHANGES:
//   • /dashboard — 6 new aggregations for charts
//   • NEW GET /api/admin/analytics/registrations-per-event
//   • NEW GET /api/admin/analytics/revenue-over-time
//   • NEW GET /api/admin/analytics/popular-events
//   • NEW GET /api/admin/analytics/user-growth
//   • All existing routes PRESERVED unchanged
// =============================================

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const { protect, adminOnly } = require('../middleware/auth');
const { stringify } = require('csv-stringify/sync');

router.use(protect, adminOnly);

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers, totalEvents, totalRegistrations, totalRevenueAgg,
      recentRegistrations, recentEvents,
      monthlyRevenue,
      // NEW aggregations
      registrationsPerEvent,
      topEvents,
      userGrowth
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Event.countDocuments(),
      Registration.countDocuments({ paymentStatus: 'completed' }),
      Payment.aggregate([
        { $match: { status: 'captured' } },
        { $group: { _id: null, total: { $sum: '$amountInRupees' } } }
      ]),
      Registration.find({ paymentStatus: 'completed' })
        .sort('-createdAt').limit(5)
        .populate('user', 'name email')
        .populate('event', 'title startDate'),
      Event.find().sort('-createdAt').limit(5),

      // Monthly revenue (existing)
      Payment.aggregate([
        { $match: { status: 'captured', paidAt: { $exists: true } } },
        { $group: { _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } }, revenue: { $sum: '$amountInRupees' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),

      // NEW: top 8 events by registrations
      Registration.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: '$event', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
        { $unwind: '$event' },
        { $project: { eventTitle: '$event.title', count: 1, revenue: 1 } }
      ]),

      // NEW: top 5 popular events (same as above but for chart)
      Event.find({ status: 'published' })
        .sort('-totalRegistrations')
        .limit(5)
        .select('title totalRegistrations maxCapacity'),

      // NEW: user sign-up growth (last 6 months)
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalEvents,
          totalRegistrations,
          totalRevenue: totalRevenueAgg[0]?.total || 0
        },
        recentRegistrations,
        recentEvents,
        monthlyRevenue,
        // NEW chart data
        registrationsPerEvent,
        topEvents,
        userGrowth
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Dashboard fetch failed' });
  }
});

// ─── NEW: GET /api/admin/analytics/registrations-per-event ───────────────────
router.get('/analytics/registrations-per-event', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const data = await Registration.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: '$event', registrations: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { registrations: -1 } },
      { $limit: parseInt(limit) },
      { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
      {
        $project: {
          _id: 0,
          eventId: '$_id',
          eventTitle: '$event.title',
          category: '$event.category',
          registrations: 1,
          revenue: 1,
          maxCapacity: '$event.maxCapacity',
          fillRate: {
            $round: [{
              $multiply: [
                { $divide: ['$registrations', { $max: ['$event.maxCapacity', 1] }] },
                100
              ]
            }, 1]
          }
        }
      }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Analytics fetch failed' });
  }
});

// ─── NEW: GET /api/admin/analytics/revenue-over-time ─────────────────────────
router.get('/analytics/revenue-over-time', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const since = new Date();
    since.setMonth(since.getMonth() - parseInt(months));

    const data = await Payment.aggregate([
      { $match: { status: 'captured', paidAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
          revenue: { $sum: '$amountInRupees' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Analytics fetch failed' });
  }
});

// ─── NEW: GET /api/admin/analytics/popular-events ────────────────────────────
router.get('/analytics/popular-events', async (req, res) => {
  try {
    const data = await Event.find({ status: { $in: ['published', 'completed'] } })
      .sort('-totalRegistrations')
      .limit(10)
      .select('title category totalRegistrations maxCapacity startDate coverImage');

    const enriched = data.map(e => ({
      ...e.toObject(),
      fillRate: Math.round((e.totalRegistrations / Math.max(e.maxCapacity, 1)) * 100)
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Analytics fetch failed' });
  }
});

// ─── NEW: GET /api/admin/analytics/user-growth ───────────────────────────────
router.get('/analytics/user-growth', async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const since = new Date();
    since.setMonth(since.getMonth() - parseInt(months));

    const data = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, newUsers: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Analytics fetch failed' });
  }
});

// ─── GET /api/admin/users (unchanged) ─────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];
    const [users, total] = await Promise.all([
      User.find(query).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit)),
      User.countDocuments(query)
    ]);
    res.json({ success: true, data: users, pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// ─── GET /api/admin/registrations (unchanged) ─────────────────────────────────
router.get('/registrations', async (req, res) => {
  try {
    const { page = 1, limit = 20, eventId, paymentStatus, search } = req.query;
    const query = {};
    if (eventId) query.event = eventId;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) query.$or = [
      { registrationId: new RegExp(search, 'i') },
      { 'attendeeInfo.name': new RegExp(search, 'i') },
      { 'attendeeInfo.email': new RegExp(search, 'i') }
    ];
    const [registrations, total] = await Promise.all([
      Registration.find(query).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit))
        .populate('user', 'name email').populate('event', 'title startDate'),
      Registration.countDocuments(query)
    ]);
    res.json({ success: true, data: registrations, pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
  }
});

// ─── GET /api/admin/payments (unchanged) ──────────────────────────────────────
router.get('/payments', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [payments, total] = await Promise.all([
      Payment.find().sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit))
        .populate('user', 'name email').populate('event', 'title'),
      Payment.countDocuments()
    ]);
    res.json({ success: true, data: payments, pagination: { page: parseInt(page), total } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

// ─── GET /api/admin/export/registrations (unchanged) ─────────────────────────
router.get('/export/registrations', async (req, res) => {
  try {
    const { eventId } = req.query;
    const query = { paymentStatus: 'completed' };
    if (eventId) query.event = eventId;

    const registrations = await Registration.find(query)
      .populate('user', 'name email phone')
      .populate('event', 'title startDate').lean();

    const rows = registrations.map(r => ({
      'Registration ID': r.registrationId,
      'Attendee Name': r.attendeeInfo?.name,
      'Attendee Email': r.attendeeInfo?.email,
      'Attendee Phone': r.attendeeInfo?.phone,
      'Organization': r.attendeeInfo?.organization,
      'Event': r.event?.title,
      'Event Date': r.event?.startDate ? new Date(r.event.startDate).toLocaleDateString() : '',
      'Ticket Type': r.ticketType?.name,
      'Quantity': r.quantity,
      'Amount (₹)': r.totalAmount,
      'Payment Status': r.paymentStatus,
      'Payment Method': r.paymentMethod,
      'Checked In': r.checkedIn ? 'Yes' : 'No',
      'Check-in Time': r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : '',
      'Registered At': new Date(r.createdAt).toLocaleString()
    }));

    const csv = stringify(rows, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="registrations-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

// ─── POST /api/admin/checkin (unchanged) ─────────────────────────────────────
router.post('/checkin', async (req, res) => {
  try {
    const { qrData } = req.body;
    let parsedQR;
    try { parsedQR = JSON.parse(qrData); }
    catch { return res.status(400).json({ success: false, message: 'Invalid QR code format' }); }

    const registration = await Registration.findOne({ registrationId: parsedQR.registrationId })
      .populate('event', 'title startDate location')
      .populate('user', 'name email');

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (registration.paymentStatus !== 'completed')
      return res.status(400).json({ success: false, message: 'Payment not completed for this ticket' });

    if (registration.checkedIn) {
      return res.status(400).json({
        success: false,
        message: `Already checked in at ${new Date(registration.checkedInAt).toLocaleString()}`,
        data: { alreadyCheckedIn: true, checkedInAt: registration.checkedInAt }
      });
    }

    const { validateQRCode } = require('../utils/qrcode');
    const validation = validateQRCode(qrData, registration.registrationId);
    if (!validation.isValid)
      return res.status(400).json({ success: false, message: 'Invalid QR code - ' + validation.reason });

    registration.checkedIn = true;
    registration.checkedInAt = new Date();
    registration.checkedInBy = req.user._id;
    await registration.save();

    res.json({
      success: true,
      message: '✅ Check-in successful!',
      data: {
        attendeeName: registration.attendeeInfo.name,
        event: registration.event.title,
        ticketType: registration.ticketType.name,
        checkedInAt: registration.checkedInAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Check-in failed' });
  }
});

// ─── PATCH /api/admin/users/:id/role (unchanged) ─────────────────────────────
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

module.exports = router;
