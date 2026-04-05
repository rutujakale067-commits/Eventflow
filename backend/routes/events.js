// =============================================
// Events Routes
// =============================================

const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

// ---- GET /api/events — list + search ----
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1, limit = 12, search, category, city,
      status = 'published', sort = '-startDate', featured
    } = req.query;

    const query = { status };

    if (search) {
      query.$text = { $search: search };
    }
    if (category) query.category = category;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (featured === 'true') query.isFeatured = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, total] = await Promise.all([
      Event.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('organizer', 'name avatar'),
      Event.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

// ---- GET /api/events/featured ----
router.get('/featured', async (req, res) => {
  try {
    const events = await Event.find({ status: 'published', isFeatured: true })
      .sort('-startDate')
      .limit(6)
      .populate('organizer', 'name avatar');
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch featured events' });
  }
});

// ---- GET /api/events/categories ----
router.get('/categories', async (req, res) => {
  try {
    const categories = await Event.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// ---- GET /api/events/:id ----
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await Event.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { slug: req.params.id }
      ]
    }).populate('organizer', 'name avatar email');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Don't expose draft events to non-admins
    if (event.status === 'draft' && req.user?.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, data: event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
});

// ---- POST /api/events — admin create ----
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      organizer: req.user._id,
      organizerName: req.user.name
    });
    res.status(201).json({ success: true, data: event, message: 'Event created successfully' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ---- PUT /api/events/:id — admin update ----
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event, message: 'Event updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ---- DELETE /api/events/:id — admin delete ----
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

module.exports = router;
