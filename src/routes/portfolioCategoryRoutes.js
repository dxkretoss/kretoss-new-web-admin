const express = require('express');
const router = express.Router();
const portfolioCategoryController = require('../controllers/portfolioCategoryController');

router.get('/', portfolioCategoryController.getCategories);
router.post('/', portfolioCategoryController.createCategory);
router.put('/reorder', portfolioCategoryController.reorderCategories);
router.delete('/:id', portfolioCategoryController.deleteCategory);

module.exports = router;
