const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  appliedFor: {
    type: String,
  },
  experience: {
    type: String,
  },
  currentSalary: {
    type: String,
  },
  expectedSalary: {
    type: String,
  },
  linkedinUrl: {
    type: String,
  },
  resume: {
    type: String, // Path to the uploaded document
  }
}, { timestamps: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
