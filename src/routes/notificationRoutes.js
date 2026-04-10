const express = require('express');
const router = express.Router();
const { createNotification, listNotifications, getNotificationById, updateNotificationStatus, sendSmsNotification } = require('../controllers/notification.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/send-sms', verifyToken, sendSmsNotification);
router.post('/', verifyToken, createNotification);
router.get('/', verifyToken, listNotifications);
router.get('/:id', verifyToken, getNotificationById);
router.put('/:id/status', verifyToken, updateNotificationStatus);

module.exports = router;
