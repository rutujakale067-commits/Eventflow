// =============================================
// Email Utility - Nodemailer
// =============================================

const nodemailer = require('nodemailer');

const createTransport = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// ---- Registration Confirmation Email ----
exports.sendRegistrationConfirmation = async ({ to, name, event, registration, qrCode }) => {
  try {
    const transporter = createTransport();
    const eventDate = new Date(event.startDate).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const eventTime = new Date(event.startDate).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'EventFlow <noreply@eventflow.com>',
      to,
      subject: `🎟️ Ticket Confirmed - ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f5;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">EventFlow</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Your ticket is confirmed! 🎉</p>
            </div>
            
            <!-- Content -->
            <div style="padding:32px;">
              <p style="color:#374151;font-size:16px;margin:0 0 24px;">Hi <strong>${name}</strong>,</p>
              <p style="color:#6b7280;font-size:15px;margin:0 0 32px;">
                You're all set for <strong>${event.title}</strong>. Here are your event details:
              </p>
              
              <!-- Event Card -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:24px;">
                <h2 style="color:#111827;margin:0 0 16px;font-size:20px;">${event.title}</h2>
                <div style="display:grid;gap:8px;">
                  <div style="color:#6b7280;font-size:14px;">📅 <strong>Date:</strong> ${eventDate}</div>
                  <div style="color:#6b7280;font-size:14px;">🕐 <strong>Time:</strong> ${eventTime}</div>
                  <div style="color:#6b7280;font-size:14px;">📍 <strong>Venue:</strong> ${event.location?.venue}, ${event.location?.city}</div>
                  <div style="color:#6b7280;font-size:14px;">🎫 <strong>Booking ID:</strong> ${registration.registrationId}</div>
                  <div style="color:#6b7280;font-size:14px;">💳 <strong>Amount Paid:</strong> ₹${registration.totalAmount}</div>
                </div>
              </div>
              
              <!-- QR Code -->
              ${qrCode ? `
              <div style="text-align:center;margin:32px 0;">
                <p style="color:#374151;font-weight:600;margin-bottom:16px;">Your Entry QR Code</p>
                <img src="${qrCode}" alt="QR Code" style="width:200px;height:200px;border:4px solid #e5e7eb;border-radius:12px;"/>
                <p style="color:#9ca3af;font-size:13px;margin-top:12px;">Show this at the event entrance</p>
              </div>` : ''}
              
              <p style="color:#6b7280;font-size:14px;margin-top:32px;">
                See you there! If you have any questions, reply to this email.<br><br>
                <strong>Team EventFlow</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} EventFlow. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    return true;
  } catch (err) {
    console.error('Email send error:', err.message);
    return false;
  }
};

// ---- Welcome Email ----
exports.sendWelcomeEmail = async ({ to, name }) => {
  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: '👋 Welcome to EventFlow!',
      html: `
        <div style="max-width:500px;margin:40px auto;font-family:'Segoe UI',Arial,sans-serif;text-align:center;padding:40px;">
          <h1 style="color:#6366f1;">Welcome, ${name}! 🎉</h1>
          <p style="color:#6b7280;">Your EventFlow account is ready. Discover amazing events and get started today.</p>
          <a href="${process.env.FRONTEND_URL}" style="display:inline-block;background:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Explore Events</a>
        </div>
      `
    });
    return true;
  } catch (err) {
    console.error('Welcome email error:', err.message);
    return false;
  }
};

// ---- Password Reset Email ----
exports.sendPasswordReset = async ({ to, name, resetUrl }) => {
  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: '🔐 Reset Your EventFlow Password',
      html: `
        <div style="max-width:500px;margin:40px auto;font-family:'Segoe UI',Arial,sans-serif;padding:40px;">
          <h2 style="color:#111827;">Hi ${name},</h2>
          <p style="color:#6b7280;">Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
          <p style="color:#9ca3af;font-size:13px;margin-top:24px;">If you didn't request this, ignore this email.</p>
        </div>
      `
    });
    return true;
  } catch (err) {
    console.error('Reset email error:', err.message);
    return false;
  }
};
