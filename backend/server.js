// =============================================
// EventFlow - Main Server Entry Point
// =============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ---- Security Middleware ----
app.use(helmet());
app.use(morgan('dev'));

// ---- Rate Limiting ----
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ---- CORS ----
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ---- Body Parsers ----
// Stripe webhooks need raw body
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---- MongoDB Connection ----
mongoose.connect("mongodb://127.0.0.1:27017/eventflow", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ MongoDB Error:', err.message);
  process.exit(1);
});
// ---- Routes ----
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/events',       require('./routes/events'));
app.use('/api/registrations',require('./routes/registrations'));
app.use('/api/payments',     require('./routes/payments'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/tickets',      require('./routes/tickets'));

// ---- Health Check ----
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ---- 404 Handler ----
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 EventFlow Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
