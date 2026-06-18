const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  location: {
    type: String,
  },
  type: {
    type: String,
    enum: ['Full-Time', 'Part-Time', 'Contract'],
    default: 'Full-Time'
  },
  category: {
    type: String,
  },
  experience: {
    type: String,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  responsibilities: {
    type: [String],
    default: [],
  },
  requirements: {
    type: [String],
    default: [],
  },
  niceToHave: {
    type: [String],
    default: [],
  }
}, { timestamps: true });

module.exports = mongoose.model('Career', careerSchema);
