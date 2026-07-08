require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Routes
const portfolioRoutes = require('./src/routes/portfolioRoutes');
const careerRoutes = require('./src/routes/careerRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const contactLeadRoutes = require('./src/routes/contactLeadRoutes');
const jobApplicationRoutes = require('./src/routes/jobApplicationRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const hireUsRoutes = require('./src/routes/hireUsRoutes');
const hireUsMenuRoutes = require('./src/routes/hireUsMenuRoutes');
const portfolioCategoryRoutes = require('./src/routes/portfolioCategoryRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/contact-leads', contactLeadRoutes);
app.use('/api/job-applications', jobApplicationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hire-us', hireUsRoutes);
app.use('/api/hire-us-menu', hireUsMenuRoutes);
app.use('/api/portfolio-categories', portfolioCategoryRoutes);
app.use('/api/reviews', reviewRoutes);

// Serve uploaded static images
const path = require('path');
app.use('/upload', express.static(path.join(__dirname, 'upload')));

// Health check route
app.get('/api/status', (req, res) => {
  res.json({ status: 'API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
