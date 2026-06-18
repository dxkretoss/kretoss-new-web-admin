const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const upload = require('../middlewares/upload');

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon', maxCount: 1 }
]);

router.post('/', uploadFields, serviceController.createService);
router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);
router.put('/:id', uploadFields, serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

module.exports = router;
