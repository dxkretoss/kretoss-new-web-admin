const HireUs = require('../models/HireUs');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');

const processAndSaveImage = async (fileBuffer, originalName, slug, prefix = '') => {
  try {
    const uploadDir = `upload/hireuse/${slug}`;
    const fullDirPath = path.join(process.cwd(), uploadDir);

    await fs.mkdir(fullDirPath, { recursive: true });

    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "-");
    const filename = `${prefix}${sanitizedName}-${timestamp}.webp`;
    const outputPath = path.join(fullDirPath, filename);

    // Resize max 1920px width and convert to webp at 80% quality
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

const parseFormData = (body) => {
  const parsed = { ...body };
  // Updated fields: removed metadata, plans, hourly, skills. Added faqs.
  const jsonFields = ['seller', 'aboutGig', 'reviews', 'portfolio', 'tags', 'images', 'faqs'];
  
  for (const field of jsonFields) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch (e) {
        console.warn(`Failed to parse field: ${field}`);
      }
    }
  }
  return parsed;
};

// Process dynamically named files from upload.any()
const processDynamicFiles = async (reqFiles, parsedBody, slug) => {
  if (!reqFiles || !Array.isArray(reqFiles)) return;

  const uploadedImages = [];

  for (const file of reqFiles) {
    const fieldname = file.fieldname;
    
    if (fieldname === 'icon') {
      parsedBody.icon = await processAndSaveImage(file.buffer, file.originalname, slug, 'icon-');
    } else if (fieldname === 'seller_avatar') {
      if (!parsedBody.seller) parsedBody.seller = {};
      parsedBody.seller.avatar = await processAndSaveImage(file.buffer, file.originalname, slug, 'seller-');
    } else if (fieldname === 'images') {
      // Main images
      const imgPath = await processAndSaveImage(file.buffer, file.originalname, slug, 'main-');
      uploadedImages.push(imgPath);
    } else if (fieldname.startsWith('portfolio_image_')) {
      // Format: portfolio_image_0
      const index = parseInt(fieldname.split('_')[2], 10);
      if (parsedBody.portfolio && parsedBody.portfolio[index]) {
        parsedBody.portfolio[index].image = await processAndSaveImage(file.buffer, file.originalname, slug, `portfolio-${index}-`);
      }
    } else if (fieldname.startsWith('review_avatar_')) {
      // Format: review_avatar_0
      const index = parseInt(fieldname.split('_')[2], 10);
      if (parsedBody.reviews && parsedBody.reviews[index]) {
        parsedBody.reviews[index].avatar = await processAndSaveImage(file.buffer, file.originalname, slug, `review-${index}-`);
      }
    }
  }

  if (uploadedImages.length > 0) {
    parsedBody.images = [...(parsedBody.images || []), ...uploadedImages];
  }
};

// Get all HireUs entries
exports.getAllHireUs = async (req, res) => {
  try {
    const hireUsList = await HireUs.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: hireUsList.length, data: hireUsList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single HireUs entry by slug
exports.getHireUsBySlug = async (req, res) => {
  try {
    const hireUs = await HireUs.findOne({ slug: req.params.slug });
    if (!hireUs) {
      return res.status(404).json({ success: false, message: 'Hire Us entry not found' });
    }
    res.status(200).json({ success: true, data: hireUs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new HireUs entry
exports.createHireUs = async (req, res) => {
  try {
    const parsedBody = parseFormData(req.body);
    
    const existing = await HireUs.findOne({ slug: parsedBody.slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Hire Us with this slug already exists' });
    }

    await processDynamicFiles(req.files, parsedBody, parsedBody.slug);
    
    const hireUs = await HireUs.create(parsedBody);
    res.status(201).json({ success: true, data: hireUs });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update HireUs entry
exports.updateHireUs = async (req, res) => {
  try {
    let hireUs = await HireUs.findById(req.params.id);
    if (!hireUs) {
      return res.status(404).json({ success: false, message: 'Hire Us entry not found' });
    }
    
    const parsedBody = parseFormData(req.body);
    
    // Check slug uniqueness if slug is changed
    if (parsedBody.slug && parsedBody.slug !== hireUs.slug) {
      const existing = await HireUs.findOne({ slug: parsedBody.slug });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Slug already in use' });
      }
    }
    
    await processDynamicFiles(req.files, parsedBody, parsedBody.slug || hireUs.slug);
    
    hireUs = await HireUs.findByIdAndUpdate(req.params.id, parsedBody, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({ success: true, data: hireUs });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete HireUs entry
exports.deleteHireUs = async (req, res) => {
  try {
    const hireUs = await HireUs.findById(req.params.id);
    if (!hireUs) {
      return res.status(404).json({ success: false, message: 'Hire Us entry not found' });
    }
    
    await hireUs.deleteOne();
    res.status(200).json({ success: true, message: 'Hire Us entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
