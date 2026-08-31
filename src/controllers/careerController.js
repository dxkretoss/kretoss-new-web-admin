const Career = require('../models/Career');
const sharp = require('sharp');
const path = require('path');
const fsp = require('fs/promises');

const getUploadDir = () => {
  return 'upload/career';
};

const processAndSaveImage = async (fileBuffer, originalName, prefix = '') => {
  try {
    const uploadDir = getUploadDir();
    const fullDirPath = path.join(process.cwd(), uploadDir);

    await fsp.mkdir(fullDirPath, { recursive: true });

    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${prefix}${sanitizedName}-${timestamp}.webp`;
    const outputPath = path.join(fullDirPath, filename);

    await sharp(fileBuffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 }) 
      .toFile(outputPath);

    return `/${uploadDir}/${filename}`;
  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error('Image processing failed');
  }
};

// Create a new Career
exports.createCareer = async (req, res) => {
  try {
    const careerData = { ...req.body };
    if (req.file) {
      careerData.image = await processAndSaveImage(req.file.buffer, req.file.originalname, 'career-');
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

// Get all Careers with pagination
exports.getCareers = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { location: { $regex: req.query.search, $options: 'i' } },
        { category: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (!isNaN(page) && !isNaN(limit)) {
      const skip = (page - 1) * limit;
      const total = await Career.countDocuments(query);
      const careers = await Career.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        success: true,
        data: careers,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page,
        limit
      });
    }

    // Fallback if page/limit not passed
    const careers = await Career.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: careers, total: careers.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single Career by ID or Slug
exports.getCareerById = async (req, res) => {
  try {
    const { id } = req.params;
    let career = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      career = await Career.findById(id);
    }
    if (!career) {
      career = await Career.findOne({ slug: id });
    }
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
      updateData.image = await processAndSaveImage(req.file.buffer, req.file.originalname, 'career-');
    }
    ['responsibilities', 'requirements', 'niceToHave'].forEach(field => {
      if (typeof updateData[field] === 'string') {
        try { updateData[field] = JSON.parse(updateData[field]); } catch(e) {}
      }
    });

    let career = null;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      career = await Career.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after', runValidators: true });
    } else {
      career = await Career.findOneAndUpdate({ slug: req.params.id }, updateData, { returnDocument: 'after', runValidators: true });
    }

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
    let career = null;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      career = await Career.findByIdAndDelete(req.params.id);
    } else {
      career = await Career.findOneAndDelete({ slug: req.params.id });
    }

    if (!career) {
      return res.status(404).json({ success: false, message: 'Career not found' });
    }
    res.status(200).json({ success: true, message: 'Career deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
