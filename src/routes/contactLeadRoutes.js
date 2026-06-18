const express = require('express');
const router = express.Router();
const contactLeadController = require('../controllers/contactLeadController');

router.post('/', contactLeadController.createContactLead);
router.get('/', contactLeadController.getContactLeads);
router.delete('/:id', contactLeadController.deleteContactLead);

module.exports = router;
