const sendSms = async (to, message) => {
    console.log(`[SMS] To: ${to} | Message: ${message}`);
    return { success: true, provider: 'mock-sms', messageId: `sms_${Date.now()}` };
};

const sendEmergencySms = sendSms;

module.exports = { sendSms, sendEmergencySms };
