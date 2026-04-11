/**
 * Fast2SMS service
 *
 * Two sending modes depending on env config:
 *
 * ── DLT mode (production India) ───────────────────────────────────────────────
 *   route=dlt, message=<integer Message_ID>, variables_values=val1|val2
 *   Requires: DLT-approved Sender ID + pre-approved message template on Fast2SMS.
 *
 * ── Quick/OTP mode (development / sandbox) ────────────────────────────────────
 *   route=q,  message=<plain text string>
 *   Works in Fast2SMS sandbox accounts but blocked by carriers in production.
 *
 * Set FAST2SMS_USE_DLT=true in .env to switch to DLT mode.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip everything except digits, keep last 10 for Indian numbers */
function normalizePhone(phone) {
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 13 && digits.startsWith('091')) return digits.slice(3);
    return digits.slice(-10);
}

function _normalizeNumbers(numbers) {
    return (Array.isArray(numbers) ? numbers : String(numbers).split(','))
        .map((n) => normalizePhone(n.trim()))
        .filter((n) => n.length === 10)
        .join(',');
}

// OTP store: normalizedPhone → { otp, expiresAt }
const _otpStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function _generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

// ---------------------------------------------------------------------------
// Core sender
// ---------------------------------------------------------------------------

/**
 * _callFast2SMS — low-level fetch wrapper.
 *
 * body fields expected by caller:
 *   DLT  → { route:'dlt',  sender_id, message:<int>, variables_values, numbers }
 *   Quick → { route:'q',   sender_id, message:<string>, numbers }
 */
async function _callFast2SMS(body) {
    const key = process.env.FAST2SMS_API_KEY;
    const url = process.env.FAST2SMS_URL || 'https://www.fast2sms.com/dev/bulkV2';

    if (!key) {
        console.warn('[SMS] FAST2SMS_API_KEY not set — skipping send');
        return { success: false, error: 'SMS service not configured' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
        console.log(`[SMS] → route:${body.route} | sender_id:${body.sender_id} | to:${body.numbers} | msg/id:${String(body.message).substring(0, 80)}${body.variables_values ? ' | vars:' + body.variables_values : ''}`);

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                authorization: key,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ flash: 0, schedule_time: '', ...body }),
            signal: controller.signal,
        });
        clearTimeout(timer);

        const data = await res.json().catch(() => ({}));
        console.log('[SMS] ← Fast2SMS response:', JSON.stringify(data));

        if (!res.ok || data.return === false) {
            const reason = Array.isArray(data.message)
                ? data.message.join(', ')
                : (data.message || `HTTP ${res.status}`);
            console.error('[SMS] ✗ Failed:', reason);
            return { success: false, error: reason };
        }

        console.log('[SMS] ✓ Sent successfully | request_id:', data.request_id);
        return { success: true, data };
    } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
            console.error('[SMS] ✗ Request timed out (10s)');
            return { success: false, error: 'SMS request timed out' };
        }
        console.error('[SMS] ✗ Unexpected error:', err.message);
        return { success: false, error: err.message || 'SMS send failed' };
    }
}

// ---------------------------------------------------------------------------
// DLT sender
// ---------------------------------------------------------------------------

/**
 * sendDltSms — uses route=dlt with a pre-approved Message_ID template.
 *
 * @param {object} opts
 * @param {string|string[]} opts.numbers   - phone number(s)
 * @param {number|string}   opts.messageId - integer Message_ID from Fast2SMS DLT Manager
 * @param {string}          opts.variables - pipe-separated values for {#var#} placeholders
 *                                           e.g. "Rahul|City General|1042"
 */
const sendDltSms = async ({ numbers, messageId, variables }) => {
    const senderId = process.env.FAST2SMS_SENDER_ID;
    if (!senderId) {
        console.error('[SMS] FAST2SMS_SENDER_ID not set — required for DLT route');
        return { success: false, error: 'FAST2SMS_SENDER_ID not configured' };
    }
    if (!messageId) {
        console.error('[SMS] messageId is required for DLT SMS');
        return { success: false, error: 'DLT message template ID not provided' };
    }

    const normalizedNums = _normalizeNumbers(numbers);
    if (!normalizedNums) {
        console.warn('[SMS] No valid 10-digit numbers. Input:', numbers);
        return { success: false, error: 'No valid phone numbers provided' };
    }

    const body = {
        route: 'dlt',
        sender_id: senderId,
        message: parseInt(messageId, 10),   // MUST be integer
        variables_values: variables || '',
        numbers: normalizedNums,
    };

    return _callFast2SMS(body);
};

// ---------------------------------------------------------------------------
// Quick sender (sandbox / development only — no DLT needed)
// ---------------------------------------------------------------------------

/**
 * sendQuickSms — uses route=q with plain-text message.
 * Works in Fast2SMS sandbox accounts; blocked by carriers in production India.
 */
const sendQuickSms = async ({ numbers, message }) => {
    const senderId = process.env.FAST2SMS_SENDER_ID || 'FSTSMS';

    const normalizedNums = _normalizeNumbers(numbers);
    if (!normalizedNums) {
        console.warn('[SMS] No valid 10-digit numbers. Input:', numbers);
        return { success: false, error: 'No valid phone numbers provided' };
    }

    return _callFast2SMS({
        route: 'q',
        sender_id: senderId,
        message: String(message),
        numbers: normalizedNums,
    });
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * sendEmergencySms
 *
 * Sends an emergency/SOS alert.
 * DLT mode  → uses FAST2SMS_EMERGENCY_TEMPLATE_ID with {#var#} substitution.
 * Quick mode → sends plain-text message (sandbox/dev only).
 *
 * Template to register on Fast2SMS DLT Manager:
 *   "ALERT: {#var#} ne SOS bheja hai. Ambulance dispatch ho gayi.
 *    Hospital: {#var#}. Case #{#var#}. Please call karo."
 *
 * @param {string}  to         - comma-separated 10-digit numbers
 * @param {string}  message    - fallback plain-text (used in quick mode)
 * @param {object}  [vars]     - { name, hospital, caseId } for DLT template variables
 */
const sendEmergencySms = async (to, message, vars = {}) => {
    const useDlt = process.env.FAST2SMS_USE_DLT === 'true';

    if (useDlt) {
        const templateId = process.env.FAST2SMS_EMERGENCY_TEMPLATE_ID;
        if (!templateId) {
            console.error('[SMS] FAST2SMS_EMERGENCY_TEMPLATE_ID not set — cannot send DLT emergency SMS');
            return { success: false, error: 'Emergency SMS template ID not configured' };
        }
        // variables_values: pipe-separated in same order as {#var#} in template
        // Template: "ALERT: {#var#} ne SOS bheja hai. Ambulance dispatch. Hospital: {#var#}. Case #{#var#}."
        const variables = [
            vars.name     || 'User',
            vars.hospital || 'Nearest Hospital',
            vars.caseId   || '',
        ].join('|');

        return sendDltSms({ numbers: to, messageId: templateId, variables });
    }

    // Quick mode (sandbox / dev)
    return sendQuickSms({ numbers: to, message });
};

/**
 * sendVerificationSms
 *
 * Generates a 6-digit OTP and sends it via Fast2SMS.
 * DLT mode  → uses FAST2SMS_OTP_TEMPLATE_ID
 * Quick mode → sends plain-text OTP message (sandbox/dev)
 *
 * Template to register on Fast2SMS DLT Manager:
 *   "Your OTP is {#var#}. Do not share it. Valid for 5 minutes. - RescueNow"
 */
const sendVerificationSms = async (phone) => {
    const normalized = normalizePhone(phone);
    if (normalized.length !== 10) {
        console.warn('[SMS][OTP] Invalid phone after normalize:', phone, '->', normalized);
        return { success: false, error: 'Invalid phone number' };
    }

    const otp = _generateOtp();
    _otpStore.set(normalized, { otp, expiresAt: Date.now() + OTP_TTL_MS });
    console.log(`[SMS][OTP] Generated OTP ${otp} for ${normalized}`);

    const useDlt = process.env.FAST2SMS_USE_DLT === 'true';
    let result;

    if (useDlt) {
        const templateId = process.env.FAST2SMS_OTP_TEMPLATE_ID;
        if (!templateId) {
            console.error('[SMS] FAST2SMS_OTP_TEMPLATE_ID not set — cannot send DLT OTP');
            _otpStore.delete(normalized);
            return { success: false, error: 'OTP SMS template ID not configured' };
        }
        result = await sendDltSms({ numbers: normalized, messageId: templateId, variables: otp });
    } else {
        result = await sendQuickSms({
            numbers: normalized,
            message: `Your OTP is ${otp}. Do not share it. Valid for 5 minutes.`,
        });
    }

    if (!result.success) {
        _otpStore.delete(normalized);
    }

    return result;
};

/**
 * verifyOtp — one-time use, auto-deletes on success or expiry.
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

module.exports = {
    sendDltSms,
    sendQuickSms,
    sendEmergencySms,
    sendVerificationSms,
    verifyOtp,
    // legacy alias
    sendSms: sendQuickSms,
};
