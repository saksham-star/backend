// Normalize to 10-digit Indian number (Fast2SMS expects digits only, no country code)
function normalizePhone(phone) {
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 13 && digits.startsWith('091')) return digits.slice(3);
    return digits.slice(-10); // take last 10 digits as best effort
}

// OTP store: normalizedPhone → { otp, expiresAt }
const _otpStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function _generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Core Fast2SMS sender.
 * Supports two call styles (backward compat with existing callers):
 *   sendSms({ numbers, message })   — object style
 *   sendSms('9876543210', 'text')   — legacy positional style
 * numbers: 10-digit string, comma-separated string, or array
 */
const sendSms = async (numbersOrOptions, messageLegacy) => {
    let numbers, message;
    if (numbersOrOptions && typeof numbersOrOptions === 'object' && !Array.isArray(numbersOrOptions)) {
        ({ numbers, message } = numbersOrOptions);
    } else {
        numbers = numbersOrOptions;
        message = messageLegacy;
    }

    const key   = process.env.FAST2SMS_API_KEY;
    const url   = process.env.FAST2SMS_URL   || 'https://www.fast2sms.com/dev/bulkV2';
    const route = process.env.FAST2SMS_ROUTE || 'q';

    if (!key) {
        console.warn('[SMS] FAST2SMS_API_KEY not set — skipping SMS');
        return { success: false, error: 'SMS service not configured' };
    }

    // Normalize: accept array or comma-separated string
    const normalizedNums = (Array.isArray(numbers) ? numbers : String(numbers).split(','))
        .map((n) => normalizePhone(n.trim()))
        .filter((n) => n.length === 10)
        .join(',');

    if (!normalizedNums) {
        return { success: false, error: 'No valid phone numbers provided' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'authorization': key,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                route,
                message: String(message),
                schedule_time: '',
                flash: 0,
                numbers: normalizedNums,
            }),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.return === false) {
            console.error('[SMS] Fast2SMS error:', data.message || res.status);
            return { success: false, error: 'SMS send failed' };
        }

        return { success: true, data };
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            console.error('[SMS] Request timed out');
            return { success: false, error: 'SMS request timed out' };
        }
        console.error('[SMS] Unexpected error:', err.message);
        return { success: false, error: 'SMS send failed' };
    }
};

/**
 * Generate, store, and send a 6-digit OTP via Fast2SMS.
 */
const sendVerificationSms = async (phone) => {
    const normalized = normalizePhone(phone);
    if (normalized.length !== 10) {
        return { success: false, error: 'Invalid phone number' };
    }

    const otp = _generateOtp();
    _otpStore.set(normalized, { otp, expiresAt: Date.now() + OTP_TTL_MS });

    const message = `Your OTP is ${otp}. Do not share it. Valid for 5 minutes.`;
    const result = await sendSms({ numbers: normalized, message });

    if (!result.success) {
        _otpStore.delete(normalized); // allow immediate retry
    }

    return result;
};

/**
 * Verify a 6-digit OTP. One-time use; auto-deletes on success or expiry.
 * Returns { valid: boolean, reason?: string }
 */
const verifyOtp = (phone, otp) => {
    const normalized = normalizePhone(phone);
    const entry = _otpStore.get(normalized);

    if (!entry) return { valid: false, reason: 'OTP not found or expired' };

    if (Date.now() > entry.expiresAt) {
        _otpStore.delete(normalized);
        return { valid: false, reason: 'OTP expired' };
    }

    if (String(entry.otp) !== String(otp)) {
        return { valid: false, reason: 'Incorrect OTP' };
    }

    _otpStore.delete(normalized);
    return { valid: true };
};

/**
 * Emergency/SOS SMS — `to` may be comma-separated for batch.
 * Backward-compatible signature kept for existing callers.
 */
const sendEmergencySms = (to, message) => sendSms({ numbers: to, message });

module.exports = { sendSms, sendEmergencySms, sendVerificationSms, verifyOtp };
