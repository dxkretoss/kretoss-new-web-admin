const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Custom web', 'Mobile app', 'Shopify'],
  },
  timeline: {
    type: String,
  },
  country: {
    type: String,
  },
  link: {
    type: String,
  },
  appLinks: {
    android: { type: String },
    ios: { type: String }
  },
  client: {
    type: String,
  },
  tags: {
    type: [String],
    default: [],
  },
  techStack: {
    type: [String],
    default: [],
  },
  description: {
    type: String,
  },
  purpose: {
    type: String,
  },
  challenge: {
    type: String,
  },
  solution: {
    type: String,
  },
  keyFeatures: {
    type: String,
  },
  thumbnailImage: {
    type: String, // Path to the uploaded WebP image
  },
  images: {
    type: [String], // Array of paths to uploaded WebP images
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
