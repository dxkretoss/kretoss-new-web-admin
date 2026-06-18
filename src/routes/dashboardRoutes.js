const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.post('/visit', dashboardController.recordVisit);
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
