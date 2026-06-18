const ContactLead = require('../models/ContactLead');

// Create a new Contact Lead
exports.createContactLead = async (req, res) => {
  try {
    const contactLead = new ContactLead(req.body);
    await contactLead.save();
    res.status(201).json({ success: true, data: contactLead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all Contact Leads
exports.getContactLeads = async (req, res) => {
  try {
    const leads = await ContactLead.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a Contact Lead (Bonus functionality)
exports.deleteContactLead = async (req, res) => {
  try {
    const lead = await ContactLead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    res.status(200).json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
