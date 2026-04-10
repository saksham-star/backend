const { Notification } = require('../models');
const { Op } = require('sequelize');
const { sendSms } = require('../services/smsService');

const VALID_TYPES = ['sms', 'call', 'email', 'push', 'socket'];
const VALID_RECIPIENT_TYPES = ['user', 'family', 'driver', 'hospital', 'police'];
const VALID_STATUSES = ['pending', 'sent', 'failed', 'delivered'];

const createNotification = async (req, res) => {
    try {
        const { incident_id, type, recipient_type, recipient_name, recipient_contact, message, status } = req.body;

        if (!type || !recipient_type || !recipient_contact) {
            return res.status(400).json({ success: false, message: 'type, recipient_type and recipient_contact are required' });
        }

        if (!VALID_TYPES.includes(type)) {
            return res.status(400).json({ success: false, message: `Invalid type. Allowed: ${VALID_TYPES.join(', ')}` });
        }

        if (!VALID_RECIPIENT_TYPES.includes(recipient_type)) {
            return res.status(400).json({ success: false, message: `Invalid recipient_type. Allowed: ${VALID_RECIPIENT_TYPES.join(', ')}` });
        }

        if (status && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}` });
        }

        const notification = await Notification.create({
            incident_id: incident_id || null,
            type,
            recipient_type,
            recipient_name: recipient_name || null,
            recipient_contact,
            message: message || null,
            status: status || 'pending',
        });

        return res.status(201).json({ success: true, message: 'Notification log created', data: notification });
    } catch (error) {
        console.error('createNotification:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const listNotifications = async (req, res) => {
    try {
        const { incident_id, type, recipient_type, status, page = 1, limit = 10 } = req.query;
        const where = {};

        if (incident_id) where.incident_id = incident_id;
        if (type) where.type = type;
        if (recipient_type) where.recipient_type = recipient_type;
        if (status) where.status = status;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Notification.findAndCountAll({
            where,
            order: [['sent_at', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        return res.status(200).json({
            success: true,
            message: 'Notifications fetched',
            data: rows,
            pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) },
        });
    } catch (error) {
        console.error('listNotifications:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        return res.status(200).json({ success: true, message: 'Notification fetched', data: notification });
    } catch (error) {
        console.error('getNotificationById:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateNotificationStatus = async (req, res) => {
    try {
        const { status, error_message } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'status is required' });
        }

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}` });
        }

        const notification = await Notification.findByPk(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        const updates = { status };
        if (error_message !== undefined) updates.error_message = error_message;

        await notification.update(updates);

        return res.status(200).json({ success: true, message: 'Status updated', data: { id: notification.id, status: notification.status } });
    } catch (error) {
        console.error('updateNotificationStatus:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const sendSmsNotification = async (req, res) => {
    try {
        const { to, message, incident_id, recipient_name, recipient_type } = req.body;

        if (!to || !message) {
            return res.status(400).json({ success: false, message: 'to and message are required' });
        }

        const result = await sendSms(to, message);

        const notification = await Notification.create({
            incident_id: incident_id || null,
            type: 'sms',
            recipient_type: recipient_type || 'user',
            recipient_name: recipient_name || null,
            recipient_contact: to,
            message,
            status: result.success ? 'sent' : 'failed',
            error_message: result.error || null,
        });

        return res.status(200).json({
            success: true,
            message: result.success ? 'SMS sent successfully' : 'SMS failed',
            data: { notification, sms: result },
        });
    } catch (error) {
        console.error('sendSmsNotification:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { createNotification, listNotifications, getNotificationById, updateNotificationStatus, sendSmsNotification };
