// =============================================
// Tickets Routes
// =============================================

const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const { protect } = require('../middleware/auth');

// ---- GET /api/tickets/:registrationId ----
router.get('/:registrationId', protect, async (req, res) => {
  try {
    const registration = await Registration.findOne({
      registrationId: req.params.registrationId
    })
      .populate('event', 'title startDate endDate location coverImage slug organizer')
      .populate('user', 'name email');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Only owner or admin
    if (registration.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (registration.paymentStatus !== 'completed') {
      return res.status(400).json({ success: false, message: 'Ticket not yet confirmed - payment pending' });
    }

    res.json({
      success: true,
      data: {
        registrationId: registration.registrationId,
        attendeeInfo: registration.attendeeInfo,
        ticketType: registration.ticketType,
        qrCode: registration.qrCode,
        event: registration.event,
        checkedIn: registration.checkedIn,
        checkedInAt: registration.checkedInAt,
        paidAt: registration.paidAt,
        totalAmount: registration.totalAmount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
  }
});

module.exports = router;
