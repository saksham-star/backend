const express = require('express');
const router = express.Router();
const { getUserById, updateUser, getUserIncidents, getEmergencyContacts, saveEmergencyContacts } = require('../controllers/user.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/:id', verifyToken, getUserById);
router.put('/:id', verifyToken, updateUser);
router.get('/:id/incidents', verifyToken, getUserIncidents);
router.get('/:id/emergency-contacts', verifyToken, getEmergencyContacts);
router.put('/:id/emergency-contacts', verifyToken, saveEmergencyContacts);

module.exports = router;
