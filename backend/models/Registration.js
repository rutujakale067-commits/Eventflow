// =============================================
// Registration Model
// =============================================

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const RegistrationSchema = new mongoose.Schema({
  registrationId: {
    type: String,
    default: () => 'REG-' + uuidv4().split('-')[0].toUpperCase(),
    unique: true
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
  
  // Ticket Details
  ticketType: {
    name: String,
    price: Number,
    currency: { type: String, default: 'INR' }
  },
  quantity: { type: Number, default: 1 },
  totalAmount: { type: Number, required: true },
  
  // Attendee Info (can differ from account holder)
  attendeeInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    organization: { type: String, default: '' },
    dietary: { type: String, default: '' },
    tshirtSize: { type: String, default: '' }
  },
  
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: { type: String, default: '' }, // razorpay/stripe payment id
  paymentOrderId: { type: String, default: '' },
  paymentMethod: { type: String, default: '' },
  paidAt: Date,
  
  // QR Code
  qrCode: { type: String, default: '' },   // base64 QR image
  qrCodeData: { type: String, default: '' }, // raw data encoded in QR
  
  // Check-in
  checkedIn: { type: Boolean, default: false },
  checkedInAt: Date,
  checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'cancelled', 'waitlisted'],
    default: 'active'
  },
  
  // Email
  confirmationEmailSent: { type: Boolean, default: false },
  
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

// Indexes
RegistrationSchema.index({ user: 1, event: 1 });
RegistrationSchema.index({ registrationId: 1 });
RegistrationSchema.index({ paymentStatus: 1 });
RegistrationSchema.index({ event: 1, paymentStatus: 1 });

module.exports = mongoose.model('Registration', RegistrationSchema);
