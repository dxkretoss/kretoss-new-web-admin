const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const upload = require('../middlewares/upload');

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 }
]);

router.post('/', uploadFields, reviewController.createReview);
router.get('/', reviewController.getReviews);
router.get('/:id', reviewController.getReviewById);
router.put('/:id', uploadFields, reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
