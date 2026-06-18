const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const upload = require('../middlewares/upload');

// Middleware to handle both single thumbnail and multiple images
const uploadFields = upload.fields([
  { name: 'thumbnailImage', maxCount: 1 },
  { name: 'images', maxCount: 10 } // Allowing up to 10 images at once
]);

router.post('/', uploadFields, portfolioController.createPortfolio);
router.get('/', portfolioController.getPortfolios);
router.get('/:id', portfolioController.getPortfolioById);
router.put('/:id', uploadFields, portfolioController.updatePortfolio);
router.delete('/:id', portfolioController.deletePortfolio);

module.exports = router;
