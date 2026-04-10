const { sendVerificationSms, verifyOtp } = require('../services/smsService');

// POST /api/sms/send-otp  |  POST /api/sms/send-verification
const sendVerification = async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, message: 'phone is required' });
    }

    const digits = String(phone).replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
        return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    const result = await sendVerificationSms(phone);

    if (!result.success) {
        return res.status(502).json({ success: false, message: 'Could not send OTP. Try again.' });
    }

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
};

// POST /api/sms/verify-otp
const verifyOtpHandler = async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ success: false, message: 'phone and otp are required' });
    }

    const result = verifyOtp(phone, String(otp));

    if (!result.valid) {
        return res.status(400).json({ success: false, message: result.reason || 'Invalid OTP' });
    }

    return res.status(200).json({ success: true, message: 'OTP verified successfully' });
};

module.exports = { sendVerification, verifyOtpHandler };
