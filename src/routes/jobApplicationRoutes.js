const express = require('express');
const router = express.Router();
const jobApplicationController = require('../controllers/jobApplicationController');
const uploadDoc = require('../middlewares/uploadDoc');

router.post('/', uploadDoc.single('resume'), jobApplicationController.createJobApplication);
router.get('/', jobApplicationController.getJobApplications);
router.delete('/:id', jobApplicationController.deleteJobApplication);

module.exports = router;
