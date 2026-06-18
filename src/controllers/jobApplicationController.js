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

// Get all Job Applications
exports.getJobApplications = async (req, res) => {
  try {
    const apps = await JobApplication.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: apps });
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
