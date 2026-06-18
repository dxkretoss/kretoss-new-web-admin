const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true, // Only unique IPs are saved
  }
}, { timestamps: true });

module.exports = mongoose.model('Visitor', visitorSchema);
