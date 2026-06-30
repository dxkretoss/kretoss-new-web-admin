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
    const data = { ...req.body };
    const { category, slug } = data;
    
    // Parse JSON arrays and objects
    const jsonFields = [
      'tags', 'techStack', 'appLinks', 'overviewDescriptions', 'coreCapabilities', 
      'challengeCards', 'processSteps', 'resultsCheckpoints', 'resultsCards'
    ];
    
    jsonFields.forEach(field => {
      if (data[field] && typeof data[field] === 'string') {
        try {
          data[field] = JSON.parse(data[field]);
        } catch (e) {
          // If parsing fails, fall back to the original string or an array depending on the field
        }
      }
    });

    // Process Thumbnail
    if (req.files && req.files['thumbnailImage'] && req.files['thumbnailImage'][0]) {
      const file = req.files['thumbnailImage'][0];
      data.thumbnailImage = await processAndSaveImage(file.buffer, file.originalname, category, slug, 'thumb-');
    }

    // Process Feedback Image
    if (req.files && req.files['feedbackImage'] && req.files['feedbackImage'][0]) {
      const file = req.files['feedbackImage'][0];
      data.feedbackImage = await processAndSaveImage(file.buffer, file.originalname, category, slug, 'feedback-');
    }

    // Process Main Images
    let imagesPaths = [];
    if (req.files && req.files['images']) {
      for (let file of req.files['images']) {
        const imagePath = await processAndSaveImage(file.buffer, file.originalname, category, slug, 'img-');
        imagesPaths.push(imagePath);
      }
      data.images = imagesPaths;
    }

    const portfolio = new Portfolio(data);

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
    const category = updateData.category || portfolio.category;
    const slug = updateData.slug || portfolio.slug;
    
    // Parse JSON arrays and objects
    const jsonFields = [
      'tags', 'techStack', 'appLinks', 'overviewDescriptions', 'coreCapabilities', 
      'challengeCards', 'processSteps', 'resultsCheckpoints', 'resultsCards'
    ];
    
    jsonFields.forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (e) {
          // ignore parsing error
        }
      }
    });

    // Process new Thumbnail if uploaded
    if (req.files && req.files['thumbnailImage'] && req.files['thumbnailImage'][0]) {
      const file = req.files['thumbnailImage'][0];
      updateData.thumbnailImage = await processAndSaveImage(file.buffer, file.originalname, category, slug, 'thumb-');
    }

    // Process new Feedback Image if uploaded
    if (req.files && req.files['feedbackImage'] && req.files['feedbackImage'][0]) {
      const file = req.files['feedbackImage'][0];
      updateData.feedbackImage = await processAndSaveImage(file.buffer, file.originalname, category, slug, 'feedback-');
    }

    // Process new Images if uploaded
    if (req.files && req.files['images'] && req.files['images'].length > 0) {
      let imagesPaths = [];
      for (let file of req.files['images']) {
        const imagePath = await processAndSaveImage(file.buffer, file.originalname, category, slug, 'img-');
        imagesPaths.push(imagePath);
      }
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
