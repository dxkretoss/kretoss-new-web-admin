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

  thumbnailImage: {
    type: String, // Path to the uploaded WebP image
  },
  images: {
    type: [String], // Array of paths to uploaded WebP images
    default: [],
  },

  // Overview Fields
  overviewTitle: { type: String, default: 'About the Project' },
  overviewDescriptions: { type: [String], default: [] },
  coreCapabilities: { type: [String], default: [] },

  // Challenge Fields
  challengeTitle: { type: String, default: 'What Problem Were We Solving?' },
  challengeQuote: { type: String },
  challengeDescription: { type: String },
  challengeCards: [{
    number: String,
    title: String,
    description: String
  }],

  // Process Fields
  processTitle: { type: String, default: 'How We Built the Solution' },
  processDescription: { type: String },
  processSteps: [{
    stepNumber: String,
    title: String,
    description: String
  }],

  // Results & Impact Fields
  resultsTitle: { type: String },
  resultsDescription: { type: String },
  resultsCheckpoints: { type: [String], default: [] },
  resultsCards: [{
    value: String,
    title: String,
    description: String
  }],

  // Client Feedback Fields
  feedbackImage: { type: String },
  feedbackName: { type: String },
  feedbackRole: { type: String },
  feedbackRating: { type: Number },
  feedbackDate: { type: String },
  feedbackDescription: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
