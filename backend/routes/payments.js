// =============================================
// FILE: /backend/routes/payments.js
// CHANGES:
//   • Import sendRegistrationNotifications
//   • Call it after QR generation in:
//       - razorpay/verify
//       - stripe/webhook
//       - /free
//   All other logic is UNCHANGED.
// =============================================

const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');
const { generateQRCode } = require('../utils/qrcode');
const { sendRegistrationConfirmation } = require('../utils/email');

// NEW import ──────────────────────────────────────────────────────────────────
const { sendRegistrationNotifications } = require('../utils/notifications');

// ─── Helper: fire all post-payment side-effects ───────────────────────────────
// Keeps the three payment handlers DRY
const triggerPostPaymentActions = (registration, event) => {
  // Email (existing, unchanged)
  sendRegistrationConfirmation({
    to: registration.attendeeInfo.email,
    name: registration.attendeeInfo.name,
    event,
    registration,
    qrCode: registration.qrCode
  }).catch(console.error);

  // NEW: SMS + WhatsApp
  sendRegistrationNotifications({
    phone: registration.attendeeInfo.phone || registration.user?.phone,
    registration,
    event
  }).catch(console.error);
};

// ========== RAZORPAY =========================================================

router.post('/razorpay/create-order', protect, async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const { registrationId } = req.body;
    const registration = await Registration.findById(registrationId).populate('event');

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (registration.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    const amountInPaise = Math.round(registration.totalAmount * 100);
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: registration.registrationId,
      notes: {
        registrationId: registration.registrationId,
        eventId: registration.event._id.toString(),
        userId: req.user._id.toString()
      }
    });

    await Payment.create({
      registration: registration._id,
      user: req.user._id,
      event: registration.event._id,
      gateway: 'razorpay',
      razorpayOrderId: order.id,
      amount: amountInPaise,
      amountInRupees: registration.totalAmount,
      currency: 'INR',
      status: 'created'
    });

    registration.paymentOrderId = order.id;
    await registration.save();

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        registrationId: registration.registrationId,
        eventName: registration.event.title,
        userName: req.user.name,
        userEmail: req.user.email
      }
    });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ success: false, message: 'Payment initialization failed' });
  }
});

router.post('/razorpay/verify', protect, async (req, res) => {
  try {
    const crypto = require('crypto');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ success: false, message: 'Payment verification failed - invalid signature' });

    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, status: 'captured', paidAt: new Date() },
      { new: true }
    );

    const registration = await Registration.findOne({ registrationId })
      .populate('event')
      .populate('user', 'name email phone');   // NEW: also populate phone

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    const { qrCodeImage, qrCodeData } = await generateQRCode({
      registrationId: registration.registrationId,
      userId: registration.user._id.toString(),
      eventId: registration.event._id.toString()
    });

    registration.paymentStatus = 'completed';
    registration.paymentId = razorpay_payment_id;
    registration.paymentMethod = 'razorpay';
    registration.paidAt = new Date();
    registration.qrCode = qrCodeImage;
    registration.qrCodeData = qrCodeData;
    await registration.save();

    await Event.findByIdAndUpdate(registration.event._id, { $inc: { totalRegistrations: 1 } });

    // CHANGED: single helper fires email + SMS + WhatsApp
    triggerPostPaymentActions(registration, registration.event);

    res.json({
      success: true,
      message: 'Payment successful! Your ticket has been confirmed.',
      data: {
        registrationId: registration.registrationId,
        qrCode: qrCodeImage,
        event: {
          title: registration.event.title,
          startDate: registration.event.startDate,
          location: registration.event.location
        }
      }
    });
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ success: false, message: 'Payment verification error' });
  }
});

// ========== STRIPE ===========================================================

router.post('/stripe/create-intent', protect, async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { registrationId } = req.body;
    const registration = await Registration.findById(registrationId).populate('event');
    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    const amountInCents = Math.round(registration.totalAmount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'inr',
      metadata: { registrationId: registration.registrationId, userId: req.user._id.toString() }
    });

    await Payment.create({
      registration: registration._id,
      user: req.user._id,
      event: registration.event._id,
      gateway: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      amount: amountInCents,
      amountInRupees: registration.totalAmount,
      currency: 'INR',
      status: 'created'
    });

    res.json({ success: true, data: { clientSecret: paymentIntent.client_secret, publishableKey: process.env.STRIPE_PUBLISHABLE_KEY } });
  } catch (err) {
    console.error('Stripe intent error:', err);
    res.status(500).json({ success: false, message: 'Stripe payment init failed' });
  }
});

router.post('/stripe/webhook', async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const { registrationId } = pi.metadata;

      const registration = await Registration.findOne({ registrationId })
        .populate('event')
        .populate('user', 'name email phone');  // NEW: phone

      if (registration && registration.paymentStatus !== 'completed') {
        const { qrCodeImage, qrCodeData } = await generateQRCode({
          registrationId: registration.registrationId,
          userId: registration.user._id.toString(),
          eventId: registration.event._id.toString()
        });

        registration.paymentStatus = 'completed';
        registration.paymentId = pi.id;
        registration.paymentMethod = 'stripe';
        registration.paidAt = new Date();
        registration.qrCode = qrCodeImage;
        registration.qrCodeData = qrCodeData;
        await registration.save();

        await Event.findByIdAndUpdate(registration.event._id, { $inc: { totalRegistrations: 1 } });
        await Payment.findOneAndUpdate({ stripePaymentIntentId: pi.id }, { status: 'captured', paidAt: new Date() });

        // CHANGED: single helper
        triggerPostPaymentActions(registration, registration.event);
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    res.status(400).json({ message: err.message });
  }
});

// ─── Free events ─────────────────────────────────────────────────────────────
router.post('/free', protect, async (req, res) => {
  try {
    const { registrationId } = req.body;
    const registration = await Registration.findById(registrationId)
      .populate('event')
      .populate('user', 'name email phone');  // NEW: phone

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (registration.totalAmount > 0) return res.status(400).json({ success: false, message: 'This event is not free' });

    const { qrCodeImage, qrCodeData } = await generateQRCode({
      registrationId: registration.registrationId,
      userId: registration.user._id.toString(),
      eventId: registration.event._id.toString()
    });

    registration.paymentStatus = 'completed';
    registration.paymentMethod = 'free';
    registration.paidAt = new Date();
    registration.qrCode = qrCodeImage;
    registration.qrCodeData = qrCodeData;
    await registration.save();

    await Event.findByIdAndUpdate(registration.event._id, { $inc: { totalRegistrations: 1 } });

    // CHANGED: single helper
    triggerPostPaymentActions(registration, registration.event);

    res.json({
      success: true,
      message: 'Registration confirmed!',
      data: { registrationId: registration.registrationId, qrCode: qrCodeImage }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

module.exports = router;
