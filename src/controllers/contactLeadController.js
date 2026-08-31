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

// Get all Contact Leads with pagination
exports.getContactLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const query = {};
    if (req.query.search) {
      query.$or = [
        { fullName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { companyName: { $regex: req.query.search, $options: 'i' } },
        { service: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (!isNaN(page) && !isNaN(limit)) {
      const skip = (page - 1) * limit;
      const total = await ContactLead.countDocuments(query);
      const leads = await ContactLead.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        success: true,
        data: leads,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page,
        limit
      });
    }

    const leads = await ContactLead.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: leads, total: leads.length });
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
