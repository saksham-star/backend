const express = require('express');
const router = express.Router();
const { getUserById, updateUser, getUserIncidents } = require('../controllers/user.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/:id', verifyToken, getUserById);
router.put('/:id', verifyToken, updateUser);
router.get('/:id/incidents', verifyToken, getUserIncidents);

module.exports = router;
