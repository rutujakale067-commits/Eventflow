// =============================================
// FILE: /backend/utils/notifications.js   (NEW FILE)
// PURPOSE: SMS & WhatsApp notifications via Twilio
// Triggered after successful payment / registration
// =============================================

const twilio = require('twilio');

// ─── Lazy-init Twilio client ──────────────────────────────────────────────────
let _client = null;
const getClient = () => {
  if (_client) return _client;
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured');
  }
  _client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return _client;
};

// ─── Normalise phone number to E.164 ─────────────────────────────────────────
const normalisePhone = (phone) => {
  if (!phone) return null;
  let p = phone.replace(/\D/g, '');            // strip non-digits
  if (p.startsWith('0')) p = p.slice(1);       // remove leading 0
  if (!p.startsWith('91') && p.length === 10)  // assume India if 10 digits
    p = '91' + p;
  if (!p.startsWith('+')) p = '+' + p;
  return p.length >= 10 ? p : null;
};

// ─── Format event date ────────────────────────────────────────────────────────
const fmtDate = (d) =>
  new Date(d).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });

// ─── Build message body ───────────────────────────────────────────────────────
const buildMessage = ({ registration, event }) => {
  const locationStr = event.location?.isOnline
    ? `Online — ${event.location?.onlineLink || 'link will be shared'}`
    : `${event.location?.venue}, ${event.location?.city}`;

  const amountStr = registration.totalAmount === 0
    ? 'FREE'
    : `₹${registration.totalAmount.toLocaleString('en-IN')}`;

  return (
    `🎟️ *EventFlow — Booking Confirmed!*\n\n` +
    `Hi ${registration.attendeeInfo?.name},\n` +
    `Your ticket for *${event.title}* is confirmed!\n\n` +
    `📅 Date: ${fmtDate(event.startDate)}\n` +
    `📍 Venue: ${locationStr}\n` +
    `🎫 Ticket: ${registration.ticketType?.name}\n` +
    `💰 Amount: ${amountStr}\n` +
    `🔖 Booking ID: ${registration.registrationId}\n\n` +
    `Your QR ticket has been sent to ${registration.attendeeInfo?.email}.\n` +
    `Show it at the venue entrance. See you there! 🎉`
  );
};

// ─── Send SMS ─────────────────────────────────────────────────────────────────
/**
 * @param {object} params
 * @param {string} params.to          - Phone number (any format, India assumed if 10 digits)
 * @param {object} params.registration
 * @param {object} params.event
 * @returns {Promise<boolean>}
 */
exports.sendSMS = async ({ to, registration, event }) => {
  const phone = normalisePhone(to);
  if (!phone) {
    console.warn('[Notifications] Skipping SMS — invalid phone number:', to);
    return false;
  }

  try {
    const client = getClient();
    const body = buildMessage({ registration, event });

    const msg = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log(`[Notifications] SMS sent → ${phone} | SID: ${msg.sid}`);
    return true;
  } catch (err) {
    console.error('[Notifications] SMS error:', err.message);
    return false;
  }
};

// ─── Send WhatsApp ────────────────────────────────────────────────────────────
/**
 * Uses Twilio WhatsApp Sandbox or Business API
 * Sandbox from-number format:  whatsapp:+14155238886
 * Set TWILIO_WHATSAPP_FROM in .env
 *
 * @param {object} params
 * @param {string} params.to          - Phone number
 * @param {object} params.registration
 * @param {object} params.event
 * @returns {Promise<boolean>}
 */
exports.sendWhatsApp = async ({ to, registration, event }) => {
  const phone = normalisePhone(to);
  if (!phone) {
    console.warn('[Notifications] Skipping WhatsApp — invalid phone:', to);
    return false;
  }

  try {
    const client = getClient();
    const body = buildMessage({ registration, event });

    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    const msg = await client.messages.create({
      body,
      from: fromNumber,
      to: `whatsapp:${phone}`
    });

    console.log(`[Notifications] WhatsApp sent → ${phone} | SID: ${msg.sid}`);
    return true;
  } catch (err) {
    console.error('[Notifications] WhatsApp error:', err.message);
    return false;
  }
};

// ─── Send all enabled notifications ──────────────────────────────────────────
/**
 * Fires SMS + WhatsApp depending on env flags.
 * Non-blocking — call with .catch(console.error) from payment routes.
 *
 * @param {object} params
 * @param {string} params.phone        - Attendee phone
 * @param {object} params.registration - Mongoose registration doc
 * @param {object} params.event        - Mongoose event doc
 */
exports.sendRegistrationNotifications = async ({ phone, registration, event }) => {
  const promises = [];

  if (process.env.TWILIO_SMS_ENABLED === 'true' && phone) {
    promises.push(exports.sendSMS({ to: phone, registration, event }));
  }

  if (process.env.TWILIO_WHATSAPP_ENABLED === 'true' && phone) {
    promises.push(exports.sendWhatsApp({ to: phone, registration, event }));
  }

  if (promises.length) {
    const results = await Promise.allSettled(promises);
    results.forEach((r, i) => {
      if (r.status === 'rejected')
        console.error(`[Notifications] Channel ${i} failed:`, r.reason);
    });
  }
};
