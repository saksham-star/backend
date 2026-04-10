const express = require('express');
const router = express.Router();
const { listAmbulances, getAmbulanceById, updateStatus, updateLocation, getNearestAmbulances } = require('../controllers/ambulance.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', listAmbulances);
router.get('/nearest', getNearestAmbulances);
router.get('/:id', getAmbulanceById);
router.put('/:id/status', verifyToken, updateStatus);
router.put('/:id/location', verifyToken, updateLocation);

module.exports = router;
