const express = require('express');
const router = express.Router();

const {
    registerUser,
    loginUser,
    registerHospitalAdmin,
    loginHospitalAdmin,
    registerAmbulanceDriver,
    loginAmbulanceDriver,
    getMyProfile,
} = require('../controllers/auth.controller');

const { verifyToken } = require('../middlewares/auth.middleware');

// User
router.post('/register/user', registerUser);
router.post('/login/user', loginUser);

// Hospital Admin
router.post('/register/hospital', registerHospitalAdmin);
router.post('/login/hospital', loginHospitalAdmin);

// Ambulance Driver
router.post('/register/driver', registerAmbulanceDriver);
router.post('/login/driver', loginAmbulanceDriver);

// Common
router.get('/me', verifyToken, getMyProfile);

module.exports = router;