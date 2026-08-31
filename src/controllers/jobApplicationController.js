const JobApplication = require('../models/JobApplication');
const path = require('path');
const fs = require('fs/promises');

// Create a new Job Application
exports.createJobApplication = async (req, res) => {
  try {
    const { fullName, email, phone, appliedFor, experience, currentSalary, expectedSalary, linkedinUrl } = req.body;
    
    let resumePath = '';
    if (req.file) {
      // multer disk storage saved it directly, we just store the relative path for serving
      resumePath = `/upload/resume/${req.file.filename}`;
    }

    const jobApp = new JobApplication({
      fullName, email, phone, appliedFor, experience, currentSalary, expectedSalary, linkedinUrl,
      resume: resumePath
    });

    await jobApp.save();
    res.status(201).json({ success: true, data: jobApp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all Job Applications with pagination
exports.getJobApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const query = {};
    if (req.query.role && req.query.role !== 'All') {
      query.appliedFor = req.query.role;
    }
    if (req.query.search) {
      query.$or = [
        { fullName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
        { appliedFor: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    let sortObj = { createdAt: -1 };
    if (req.query.sortBy === 'oldest') sortObj = { createdAt: 1 };

    if (!isNaN(page) && !isNaN(limit)) {
      const skip = (page - 1) * limit;
      const total = await JobApplication.countDocuments(query);
      const apps = await JobApplication.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        success: true,
        data: apps,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page,
        limit
      });
    }

    const apps = await JobApplication.find(query).sort(sortObj);
    res.status(200).json({ success: true, data: apps, total: apps.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a Job Application
exports.deleteJobApplication = async (req, res) => {
  try {
    const jobApp = await JobApplication.findById(req.params.id);
    if (!jobApp) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (jobApp.resume) {
      try {
        const fullPath = path.join(process.cwd(), jobApp.resume);
        await fs.unlink(fullPath);
      } catch (err) {
        console.warn(`Could not delete file: ${jobApp.resume}`);
      }
    }

    await jobApp.deleteOne();
    res.status(200).json({ success: true, message: 'Application deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
