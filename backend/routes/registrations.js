// =============================================
// Registration Routes
// =============================================

const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

// ---- POST /api/registrations — register for event ----
router.post('/', protect, async (req, res) => {
  try {
    const { eventId, ticketTypeName, quantity = 1, attendeeInfo } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!event.isRegistrationOpen) {
      return res.status(400).json({ success: false, message: 'Registration is closed for this event' });
    }

    // Find ticket type
    const ticketType = event.ticketTypes.find(t => t.name === ticketTypeName && t.isActive);
    if (!ticketType) return res.status(400).json({ success: false, message: 'Invalid ticket type' });

    const availableSeats = ticketType.totalSeats - ticketType.soldSeats;
    if (availableSeats < quantity) {
      return res.status(400).json({ success: false, message: `Only ${availableSeats} seats left for this ticket type` });
    }

    // Check duplicate registration
    const existing = await Registration.findOne({
      user: req.user._id,
      event: eventId,
      paymentStatus: { $in: ['pending', 'completed'] },
      status: 'active'
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }

    const totalAmount = ticketType.price * quantity;

    const registration = await Registration.create({
      user: req.user._id,
      event: eventId,
      ticketType: { name: ticketType.name, price: ticketType.price, currency: ticketType.currency },
      quantity,
      totalAmount,
      attendeeInfo: {
        name: attendeeInfo?.name || req.user.name,
        email: attendeeInfo?.email || req.user.email,
        phone: attendeeInfo?.phone || req.user.phone || '',
        organization: attendeeInfo?.organization || '',
        dietary: attendeeInfo?.dietary || '',
        tshirtSize: attendeeInfo?.tshirtSize || ''
      }
    });

    // Reserve seats
    await Event.findOneAndUpdate(
      { _id: eventId, 'ticketTypes.name': ticketTypeName },
      { $inc: { 'ticketTypes.$.soldSeats': quantity } }
    );

    res.status(201).json({
      success: true,
      message: totalAmount === 0 ? 'Registered! Confirm your free ticket.' : 'Registration created. Complete payment to confirm.',
      data: {
        _id: registration._id,
        registrationId: registration.registrationId,
        totalAmount,
        isFree: totalAmount === 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- GET /api/registrations/my — user's registrations ----
router.get('/my', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [registrations, total] = await Promise.all([
      Registration.find({ user: req.user._id })
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .populate('event', 'title coverImage startDate endDate location status slug'),
      Registration.countDocuments({ user: req.user._id })
    ]);

    res.json({
      success: true,
      data: registrations,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
  }
});

// ---- GET /api/registrations/:id — single registration ----
router.get('/:id', protect, async (req, res) => {
  try {
    const registration = await Registration.findOne({
      $or: [{ _id: req.params.id }, { registrationId: req.params.id }]
    }).populate('event', 'title coverImage startDate endDate location slug organizer')
      .populate('user', 'name email');

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    // Only the user or admin can see it
    if (registration.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, data: registration });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch registration' });
  }
});

// ---- DELETE /api/registrations/:id — cancel ----
router.delete('/:id', protect, async (req, res) => {
  try {
    const registration = await Registration.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('event');

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    if (registration.paymentStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Paid registrations cannot be cancelled. Contact support.' });
    }

    registration.status = 'cancelled';
    await registration.save();

    // Release seats
    await Event.findOneAndUpdate(
      { _id: registration.event._id, 'ticketTypes.name': registration.ticketType.name },
      { $inc: { 'ticketTypes.$.soldSeats': -registration.quantity } }
    );

    res.json({ success: true, message: 'Registration cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Cancellation failed' });
  }
});

module.exports = router;
