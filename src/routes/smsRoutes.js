const express = require('express');
const router = express.Router();
const { sendVerification, verifyOtpHandler } = require('../controllers/sms.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// In-memory rate limit: 1 OTP per phone per 30s
// Timestamp is recorded only after a successful send (via res.locals flag)
const _otpRateMap = new Map();
const OTP_WINDOW_MS = 30000;

function otpRateLimit(req, res, next) {
    const phone = String((req.body && req.body.phone) || '').replace(/\D/g, '');
    if (!phone) return next();
    const last = _otpRateMap.get(phone) || 0;
    const elapsed = Date.now() - last;
    if (elapsed < OTP_WINDOW_MS) {
        const wait = Math.ceil((OTP_WINDOW_MS - elapsed) / 1000);
        return res.status(429).json({
            success: false,
            message: `Please wait ${wait}s before requesting another OTP.`,
            retry_after: wait,
        });
    }
    // Record now — prevents burst; cleared on provider failure via cleanup below
    _otpRateMap.set(phone, Date.now());
    res.locals._otpPhone = phone; // pass to cleanup
    next();
}

// If SMS provider failed, remove the rate-limit entry so user can retry immediately
function otpRateLimitCleanup(_req, res, next) {
    const _json = res.json.bind(res);
    res.json = function (body) {
        if (body && !body.success && res.locals._otpPhone) {
            _otpRateMap.delete(res.locals._otpPhone);
        }
        return _json(body);
    };
    next();
}

// Public — used before login/registration
router.post('/send-otp', otpRateLimitCleanup, otpRateLimit, sendVerification);

// Public — verify OTP sent via send-otp
router.post('/verify-otp', verifyOtpHandler);

// Protected — authenticated use (kept for post-login flows)
router.post('/send-verification', verifyToken, sendVerification);

module.exports = router;
