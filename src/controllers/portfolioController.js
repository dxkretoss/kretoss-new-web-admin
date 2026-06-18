const Portfolio = require('../models/Portfolio');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');

// Helper to determine the directory for saving images
const getUploadDir = (category, slug) => {
  let dir = 'upload/';
  if (category === 'Custom web') {
    dir += 'custom-web';
  } else if (category === 'Shopify') {
    dir += 'shopify';
  } else if (category === 'Mobile app') {
    dir += `mobile-app/${slug}`;
  } else {
    dir += 'others';
  }
  return dir;
};

// Helper to process and save a single image using Sharp
const processAndSaveImage = async (fileBuffer, originalName, category, slug, prefix = '') => {
  try {
    const uploadDir = getUploadDir(category, slug);
    const fullDirPath = path.join(process.cwd(), uploadDir);

    // Ensure the directory exists
    await fs.mkdir(fullDirPath, { recursive: true });

    // Create a unique filename for the webp image
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "-");
    const filename = `${prefix}${sanitizedName}-${timestamp}.webp`;
    const outputPath = path.join(fullDirPath, filename);

    // Process image with Sharp
    // 1. Resize if width is larger than 1920px to prevent massive resolutions
    // 2. Convert to webp with 80% quality (greatly reduces size, maintains visual quality)
    await sharp(fileBuffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 }) 
      .toFile(outputPath);

    // Return the relative path to be saved in the database
    return `/${uploadDir}/${filename}`;
  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error('Image processing failed');
  }
};

// Create a new Portfolio
exports.createPortfolio = async (req, res) => {
  try {
    const { title, slug, category, timeline, country, link, client, description, purpose, challenge, solution, keyFeatures } = req.body;
    
    // Arrays might come as strings if sent via FormData, so we parse them if necessary
    let tags = [];
    let techStack = [];
    if (req.body.tags) {
      tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags || '[]');
    }
    if (req.body.techStack) {
      techStack = Array.isArray(req.body.techStack) ? req.body.techStack : JSON.parse(req.body.techStack || '[]');
    }
    
    let appLinks = { android: '', ios: '' };
    if (req.body.appLinks) {
      appLinks = typeof req.body.appLinks === 'string' ? JSON.parse(req.body.appLinks) : req.body.appLinks;
    }

    // Process Thumbnail
    let thumbnailImagePath = '';
    if (req.files && req.files['thumbnailImage'] && req.files['thumbnailImage'][0]) {
      const file = req.files['thumbnailImage'][0];
      thumbnailImagePath = await processAndSaveImage(file.buffer, file.originalname, category, slug, 'thumb-');
    }

    // Process Main Images
    let imagesPaths = [];
    if (req.files && req.files['images']) {
      for (let file of req.files['images']) {
        const imagePath = await processAndSaveImage(file.buffer, file.originalname, category, slug, 'img-');
        imagesPaths.push(imagePath);
      }
    }

    const portfolio = new Portfolio({
      title, slug, category, timeline, country, link, client,
      tags, techStack, description, purpose, challenge, solution, keyFeatures,
      appLinks,
      thumbnailImage: thumbnailImagePath,
      images: imagesPaths
    });

    await portfolio.save();
    res.status(201).json({ success: true, data: portfolio });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all Portfolios
exports.getPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: portfolios });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single Portfolio by ID
exports.getPortfolioById = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    res.status(200).json({ success: true, data: portfolio });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a Portfolio
exports.updatePortfolio = async (req, res) => {
  try {
    const portfolioId = req.params.id;
    let portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    // Extract fields
    const updateData = { ...req.body };
    if (req.body.tags) {
      updateData.tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags || '[]');
    }
    if (req.body.techStack) {
      updateData.techStack = Array.isArray(req.body.techStack) ? req.body.techStack : JSON.parse(req.body.techStack || '[]');
    }
    if (req.body.appLinks) {
      updateData.appLinks = typeof req.body.appLinks === 'string' ? JSON.parse(req.body.appLinks) : req.body.appLinks;
    }

    const category = updateData.category || portfolio.category;
    const slug = updateData.slug || portfolio.slug;

    // Process new Thumbnail if uploaded
    if (req.files && req.files['thumbnailImage'] && req.files['thumbnailImage'][0]) {
      const file = req.files['thumbnailImage'][0];
      updateData.thumbnailImage = await processAndSaveImage(file.buffer, file.originalname, category, slug, 'thumb-');
      // Optionally: Delete old thumbnail from disk here
    }

    // Process new Images if uploaded
    if (req.files && req.files['images'] && req.files['images'].length > 0) {
      let imagesPaths = [];
      for (let file of req.files['images']) {
        const imagePath = await processAndSaveImage(file.buffer, file.originalname, category, slug, 'img-');
        imagesPaths.push(imagePath);
      }
      // If we are replacing all images, or appending. Assuming replacement for simplicity, or we can handle it via frontend logic.
      // Usually, frontend would send an array of existing images to keep + new files. 
      // For this API, let's append new images to existing ones.
      updateData.images = [...portfolio.images, ...imagesPaths];
    }

    portfolio = await Portfolio.findByIdAndUpdate(portfolioId, updateData, { returnDocument: 'after', runValidators: true });
    
    res.status(200).json({ success: true, data: portfolio });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a Portfolio
exports.deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    // Remove images from filesystem
    const filesToDelete = [];
    if (portfolio.thumbnailImage) filesToDelete.push(portfolio.thumbnailImage);
    if (portfolio.images && portfolio.images.length > 0) {
      filesToDelete.push(...portfolio.images);
    }

    for (let filePath of filesToDelete) {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        await fs.unlink(fullPath);
      } catch (err) {
        console.warn(`Could not delete file: ${filePath}`);
      }
    }

    await portfolio.deleteOne();
    res.status(200).json({ success: true, message: 'Portfolio deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
