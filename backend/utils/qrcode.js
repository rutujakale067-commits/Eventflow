// =============================================
// QR Code Utility
// =============================================

const QRCode = require('qrcode');

/**
 * Generate a QR code as base64 data URL
 * @param {object} data - data to encode
 * @returns {string} base64 data URL
 */
exports.generateQRCode = async (data) => {
  try {
    const qrData = JSON.stringify({
      registrationId: data.registrationId,
      userId: data.userId,
      eventId: data.eventId,
      timestamp: Date.now(),
      checksum: Buffer.from(`${data.registrationId}:${data.userId}:${data.eventId}`).toString('base64')
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff'
      },
      width: 400
    });

    return { qrCodeImage: qrCodeDataURL, qrCodeData: qrData };
  } catch (err) {
    console.error('QR generation error:', err);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Validate QR code data
 * @param {string} qrData - JSON string from QR scan
 * @param {string} registrationId - expected registration ID
 * @returns {object} validation result
 */
exports.validateQRCode = (qrData, registrationId) => {
  try {
    const parsed = JSON.parse(qrData);
    
    const expectedChecksum = Buffer.from(
      `${parsed.registrationId}:${parsed.userId}:${parsed.eventId}`
    ).toString('base64');

    const isValid =
      parsed.registrationId === registrationId &&
      parsed.checksum === expectedChecksum;

    return {
      isValid,
      data: parsed,
      reason: isValid ? 'Valid ticket' : 'Checksum mismatch - possible forgery'
    };
  } catch (err) {
    return { isValid: false, reason: 'Invalid QR data format' };
  }
};
