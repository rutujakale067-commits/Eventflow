// =============================================
// Payment Model
// =============================================

const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  
  // Gateway details
  gateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'free'],
    required: true
  },
  
  // Razorpay specific
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },
  
  // Stripe specific
  stripePaymentIntentId: { type: String, default: '' },
  stripeChargeId: { type: String, default: '' },
  
  // Amounts (in smallest currency unit for international, paise for INR)
  amount: { type: Number, required: true },         // in base units (paise/cents)
  amountInRupees: { type: Number, required: true }, // human-readable
  currency: { type: String, default: 'INR' },
  
  status: {
    type: String,
    enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
    default: 'created'
  },
  
  // Refund
  refundId: { type: String, default: '' },
  refundedAt: Date,
  refundAmount: { type: Number, default: 0 },
  
  // Raw webhook response for audit
  gatewayResponse: { type: mongoose.Schema.Types.Mixed },
  
  paidAt: Date,
  failureReason: { type: String, default: '' }
}, {
  timestamps: true
});

PaymentSchema.index({ registration: 1 });
PaymentSchema.index({ user: 1 });
PaymentSchema.index({ razorpayOrderId: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);
