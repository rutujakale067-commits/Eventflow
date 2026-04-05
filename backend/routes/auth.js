// =============================================
// FILE: /backend/routes/auth.js
// CHANGES:
//   • generateToken(id, role) — role now in JWT
//   • Login response includes role + permissions
//   • New GET /api/auth/permissions endpoint
// =============================================

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/email');

// ─── Helper: build safe user response object ─────────────────────────────────
const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,          // ← always expose role
  avatar: user.avatar,
  phone: user.phone,
  isVerified: user.isVerified
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { name, email, password, phone } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // NEW: allow first user to self-register as admin via env flag (useful for seeding)
    const isFirstUser = (await User.countDocuments()) === 0;
    const role = isFirstUser ? 'admin' : 'user';

    const user = await User.create({ name, email, password, phone: phone || '', role });

    // CHANGE: pass role into token
    const token = generateToken(user._id, user.role);

    sendWelcomeEmail({ to: user.email, name: user.name }).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: safeUser(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // CHANGE: role embedded in token
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: safeUser(req.user) });
});

// ─── NEW: GET /api/auth/permissions ──────────────────────────────────────────
// Returns granular UI permissions based on role so frontend can gate features
router.get('/permissions', protect, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  res.json({
    success: true,
    role: req.user.role,
    permissions: {
      // Events
      viewEvents: true,
      viewEventDetails: true,
      createEvent: isAdmin,
      editEvent: isAdmin,
      deleteEvent: isAdmin,
      // Registrations
      registerForEvent: !isAdmin,
      viewOwnRegistrations: true,
      viewAllRegistrations: isAdmin,
      // Payments
      makePayment: !isAdmin,
      viewAllPayments: isAdmin,
      // Users
      viewAllUsers: isAdmin,
      changeUserRole: isAdmin,
      // Analytics
      viewAnalytics: isAdmin,
      exportData: isAdmin,
      // Check-in
      checkInAttendees: isAdmin
    }
  });
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Profile update failed' });
  }
});

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password change failed' });
  }
});

module.exports = router;
