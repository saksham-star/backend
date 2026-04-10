const express = require('express');
const router = express.Router();
const { listHospitals, getHospitalById, getNearestHospitals, updateBeds } = require('../controllers/hospital.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', listHospitals);
router.get('/nearest', getNearestHospitals);
router.get('/:id', getHospitalById);
router.put('/:id/beds', verifyToken, updateBeds);

module.exports = router;
