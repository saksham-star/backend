const express = require('express');
const router = express.Router();
const {
    triggerSOS,
    getActiveIncidents,
    getIncidentById,
    updateIncidentStatus,
    cancelIncident,
    listIncidents,
} = require('../controllers/incident.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/sos', verifyToken, triggerSOS);
router.get('/active', verifyToken, getActiveIncidents);
router.get('/', verifyToken, listIncidents);
router.get('/:id', verifyToken, getIncidentById);
router.put('/:id/status', verifyToken, updateIncidentStatus);
router.post('/:id/cancel', verifyToken, cancelIncident);

module.exports = router;
