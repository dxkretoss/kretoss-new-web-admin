const mongoose = require('mongoose');

const contactLeadSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  service: {
    type: String,
  },
  budget: {
    type: String,
  },
  projectDetails: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('ContactLead', contactLeadSchema);
