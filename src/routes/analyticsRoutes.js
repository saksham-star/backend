const express = require('express');
const router = express.Router();
const { getDashboard, getIncidentsTrend, getResponseTimeByHospital, getIncidentTypes, getAmbulanceUtilization, getHospitalBeds } = require('../controllers/analytics.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/dashboard', verifyToken, getDashboard);
router.get('/incidents-trend', verifyToken, getIncidentsTrend);
router.get('/response-time-by-hospital', verifyToken, getResponseTimeByHospital);
router.get('/incident-types', verifyToken, getIncidentTypes);
router.get('/ambulance-utilization', verifyToken, getAmbulanceUtilization);
router.get('/hospital-beds', verifyToken, getHospitalBeds);

module.exports = router;
