const express = require('express');
const router = express.Router();
const { getMenu, updateMenu } = require('../controllers/hireUsMenuController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// Public route to get the menu configuration
router.get('/', getMenu);

// Protected route to update the menu configuration
router.post('/', protect, upload.any(), updateMenu);

module.exports = router;
