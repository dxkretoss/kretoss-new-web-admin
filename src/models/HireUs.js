const mongoose = require('mongoose');

const hireUsSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  icon: { type: String },
  gigTitle: { type: String },
  
  seller: {
    name: { type: String },
    title: { type: String },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    ordersInQueue: { type: Number, default: 0 },
    avatar: { type: String }
  },
  
  images: [{ type: String }],
  
  fixedCostDesc: [{ type: String }],
  hourlyDesc: [{ type: String }],
  
  aboutGig: {
    title: { type: String, default: 'About This Service' },
    paragraphs: [{ type: String }],
    whyChooseUs: {
      title: { type: String, default: 'Why Choose Kretoss Technology?' },
      list: [{ type: String }]
    },
    services: {
      title: { type: String, default: 'Services:' },
      list: [{ type: String }]
    },
    note: { type: String }
  },
  
  reviews: [{
    id: { type: Number },
    name: { type: String },
    avatar: { type: String },
    country: { type: String },
    rating: { type: Number },
    date: { type: String },
    comment: { type: String },
    price: { type: String },
    duration: { type: String },
    helpful: {
      yes: { type: Number, default: 0 },
      no: { type: Number, default: 0 }
    }
  }],
  
  faqs: [{
    question: { type: String },
    answer: { type: String }
  }],
  
  tags: [{ type: String }],
  
  portfolio: [{
    image: { type: String },
    title: { type: String },
    date: { type: String },
    description: { type: String },
    tags: [{ type: String }],
    cost: { type: String },
    duration: { type: String },
    timeline: { type: String },
    country: { type: String },
    techStack: { type: String },
    category: { type: String },
    link: { type: String },
    slug: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('HireUs', hireUsSchema);
