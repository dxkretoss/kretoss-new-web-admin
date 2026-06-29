const mongoose = require('mongoose');

const hireUsMenuSchema = new mongoose.Schema({
  categories: [{
    title: { type: String, required: true },
    items: [{
      name: { type: String, required: true },
      icon: { type: String }, // URL or path
      link: { type: String, required: true }
    }]
  }],
  bottomLinks: [{
    name: { type: String, required: true },
    link: { type: String, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('HireUsMenu', hireUsMenuSchema);
