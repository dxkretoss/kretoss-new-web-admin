const express = require('express');
const router = express.Router();
const { authUser, seedAdmin } = require('../controllers/authController');

router.post('/login', authUser);
router.post('/seed', seedAdmin);

module.exports = router;
