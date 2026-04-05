// =============================================
// FILE: /backend/middleware/auth.js
// CHANGES: JWT now embeds role, new role-based
//          middleware helpers added
// =============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Protect routes — require valid JWT ──────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login to continue.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// ─── Admin only ───────────────────────────────────────────────────────────────
exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }
  next();
};

// ─── NEW: Authorise specific roles (variadic) ────────────────────────────────
// Usage: router.get('/route', protect, authorise('admin', 'organiser'), handler)
exports.authorise = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user?.role}' is not permitted to access this resource.`
    });
  }
  next();
};

// ─── Optional auth (does not fail if no token) ───────────────────────────────
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch (e) { /* ignore */ }
  next();
};

// ─── Generate JWT — NOW EMBEDS role in payload ───────────────────────────────
// CHANGE: added role to token so frontend can read it without an extra request
exports.generateToken = (userId, role = 'user') => {
  return jwt.sign(
    { id: userId, role },          // ← NEW: role embedded
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};
