const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const upload = require('../middlewares/upload');

router.post('/', upload.single('image'), careerController.createCareer);
router.get('/', careerController.getCareers);
router.get('/:id', careerController.getCareerById);
router.put('/:id', upload.single('image'), careerController.updateCareer);
router.delete('/:id', careerController.deleteCareer);

module.exports = router;
