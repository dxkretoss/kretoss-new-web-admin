const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceId: {
    type: String, // To map the custom '01', '02' id they use in frontend
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  desc: {
    type: String,
  },
  tags: {
    type: [String],
    default: [],
  },
  image: {
    type: String, // Path to webp image
  },
  icon: {
    type: String, // Path to webp icon
  }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
