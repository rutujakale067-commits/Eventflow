// =============================================
// FILE: /backend/models/Event.js
// CHANGES:
//   • location.mapLink — Google Maps / any URL
//   • location.coordinates — lat/lng for map pin
//   • location.fullAddress — single-line human address
//   • ticketTypes[].currency default kept as INR
//   • NEW virtual: lowestPrice
// All existing fields preserved unchanged.
// =============================================

const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 5000
  },
  shortDescription: {
    type: String,
    maxlength: 300,
    default: ''
  },
  category: {
    type: String,
    enum: ['Technology', 'Music', 'Sports', 'Business', 'Arts', 'Food', 'Health', 'Education', 'Other'],
    default: 'Other'
  },
  tags: [{ type: String, trim: true }],

  // ─── Location (ENHANCED) ───────────────────────────────────────────────────
  location: {
    venue:       { type: String, required: true },
    address:     { type: String, default: '' },
    city:        { type: String, required: true },
    state:       { type: String, default: '' },
    country:     { type: String, default: 'India' },
    isOnline:    { type: Boolean, default: false },
    onlineLink:  { type: String, default: '' },

    // NEW: optional Google Maps / Apple Maps deep-link
    mapLink:     { type: String, default: '' },

    // NEW: lat/lng for optional map embed
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    },

    // NEW: human-readable single-line address (auto-composed or admin-supplied)
    fullAddress: { type: String, default: '' }
  },

  // ─── Dates ────────────────────────────────────────────────────────────────
  startDate:            { type: Date, required: true },
  endDate:              { type: Date, required: true },
  registrationDeadline: { type: Date },

  // ─── Tickets & Pricing (unchanged) ────────────────────────────────────────
  ticketTypes: [{
    name:        { type: String, required: true },
    price:       { type: Number, required: true, min: 0 },
    currency:    { type: String, default: 'INR' },
    totalSeats:  { type: Number, required: true },
    soldSeats:   { type: Number, default: 0 },
    description: { type: String, default: '' },
    isActive:    { type: Boolean, default: true }
  }],

  // ─── Media ────────────────────────────────────────────────────────────────
  coverImage: { type: String, default: '' },
  images:     [{ type: String }],

  // ─── Organizer ────────────────────────────────────────────────────────────
  organizer:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizerName: { type: String, default: '' },

  // ─── Stats ────────────────────────────────────────────────────────────────
  totalRegistrations: { type: Number, default: 0 },
  maxCapacity:        { type: Number, required: true },

  // ─── Status ───────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  isFeatured: { type: Boolean, default: false },

  // ─── Display ──────────────────────────────────────────────────────────────
  highlights: [{ type: String }],
  agenda: [{ time: String, title: String, speaker: String }],
  speakers: [{ name: String, bio: String, avatar: String, title: String }]
}, {
  timestamps: true
});

// ─── Auto-generate slug ───────────────────────────────────────────────────────
EventSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36);
  }

  // NEW: auto-compose fullAddress if not supplied
  if (!this.location.fullAddress && !this.location.isOnline) {
    const parts = [
      this.location.venue,
      this.location.address,
      this.location.city,
      this.location.state,
      this.location.country
    ].filter(Boolean);
    this.location.fullAddress = parts.join(', ');
  }

  next();
});

// ─── Virtuals ─────────────────────────────────────────────────────────────────
EventSchema.virtual('availableSeats').get(function () {
  return this.maxCapacity - this.totalRegistrations;
});

EventSchema.virtual('isRegistrationOpen').get(function () {
  const now = new Date();
  const deadline = this.registrationDeadline || this.startDate;
  return this.status === 'published' && now < deadline && this.availableSeats > 0;
});

// NEW: convenience virtual — cheapest active ticket price
EventSchema.virtual('lowestPrice').get(function () {
  const active = (this.ticketTypes || []).filter(t => t.isActive);
  if (!active.length) return 0;
  return Math.min(...active.map(t => t.price));
});

EventSchema.set('toJSON', { virtuals: true });
EventSchema.set('toObject', { virtuals: true });

// ─── Indexes ──────────────────────────────────────────────────────────────────
EventSchema.index({ title: 'text', description: 'text', tags: 'text' });
EventSchema.index({ status: 1, startDate: 1 });
EventSchema.index({ category: 1 });

module.exports = mongoose.model('Event', EventSchema);
