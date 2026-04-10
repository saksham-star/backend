const express = require('express');
const router = express.Router();
const { sendVerification, verifyOtpHandler } = require('../controllers/sms.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/send-otp', sendVerification);
router.post('/verify-otp', verifyOtpHandler);
router.post('/send-verification', verifyToken, sendVerification);

module.exports = router;
