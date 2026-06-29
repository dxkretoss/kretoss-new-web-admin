const express = require('express');
const router = express.Router();
const {
  getAllHireUs,
  getHireUsBySlug,
  createHireUs,
  updateHireUs,
  deleteHireUs
} = require('../controllers/hireUsController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// Public routes
router.get('/', getAllHireUs);
router.get('/:slug', getHireUsBySlug);

// Protected routes (Admin only)
router.post('/', protect, upload.any(), createHireUs);
router.put('/:id', protect, upload.any(), updateHireUs);
router.delete('/:id', protect, deleteHireUs);

module.exports = router;
