const Career = require('../models/Career');

// Create a new Career
exports.createCareer = async (req, res) => {
  try {
    const careerData = { ...req.body };
    if (req.file) {
      careerData.image = `/uploads/${req.file.filename}`;
    }
    ['responsibilities', 'requirements', 'niceToHave'].forEach(field => {
      if (typeof careerData[field] === 'string') {
        try { careerData[field] = JSON.parse(careerData[field]); } catch(e) {}
      }
    });
    const career = new Career(careerData);
    await career.save();
    res.status(201).json({ success: true, data: career });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all Careers
exports.getCareers = async (req, res) => {
  try {
    const careers = await Career.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: careers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single Career by ID
exports.getCareerById = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) {
      return res.status(404).json({ success: false, message: 'Career not found' });
    }
    res.status(200).json({ success: true, data: career });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a Career
exports.updateCareer = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }
    ['responsibilities', 'requirements', 'niceToHave'].forEach(field => {
      if (typeof updateData[field] === 'string') {
        try { updateData[field] = JSON.parse(updateData[field]); } catch(e) {}
      }
    });
    const career = await Career.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after', runValidators: true });
    if (!career) {
      return res.status(404).json({ success: false, message: 'Career not found' });
    }
    res.status(200).json({ success: true, data: career });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a Career
exports.deleteCareer = async (req, res) => {
  try {
    const career = await Career.findByIdAndDelete(req.params.id);
    if (!career) {
      return res.status(404).json({ success: false, message: 'Career not found' });
    }
    res.status(200).json({ success: true, message: 'Career deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
