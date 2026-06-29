const HireUsMenu = require('../models/HireUsMenu');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');

const processAndSaveImage = async (fileBuffer, originalName, prefix = '') => {
  try {
    const uploadDir = 'upload/hireusemenu';
    const fullDirPath = path.join(process.cwd(), uploadDir);

    await fs.mkdir(fullDirPath, { recursive: true });

    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "-");
    const filename = `${prefix}${sanitizedName}-${timestamp}.webp`;
    const outputPath = path.join(fullDirPath, filename);

    // Resize max 1920px width and convert to webp at 80% quality
    await sharp(fileBuffer)
      .resize({ width: 120, withoutEnlargement: true }) // Icons don't need to be huge
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
  const jsonFields = ['categories', 'bottomLinks'];
  
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
// Field format for nested array: category_0_item_1_icon
const processDynamicFiles = async (reqFiles, parsedBody) => {
  if (!reqFiles || !Array.isArray(reqFiles)) return;

  for (const file of reqFiles) {
    const fieldname = file.fieldname;
    
    if (fieldname.startsWith('category_')) {
      // Format: category_0_item_1_icon
      const parts = fieldname.split('_');
      if (parts.length >= 5 && parts[0] === 'category' && parts[2] === 'item' && parts[4] === 'icon') {
        const cIndex = parseInt(parts[1], 10);
        const iIndex = parseInt(parts[3], 10);
        
        if (parsedBody.categories && parsedBody.categories[cIndex] && parsedBody.categories[cIndex].items && parsedBody.categories[cIndex].items[iIndex]) {
          parsedBody.categories[cIndex].items[iIndex].icon = await processAndSaveImage(file.buffer, file.originalname, `cat-${cIndex}-item-${iIndex}-`);
        }
      }
    }
  }
};

// Get the menu (singleton)
exports.getMenu = async (req, res) => {
  try {
    let menu = await HireUsMenu.findOne();
    if (!menu) {
      // Create empty singleton if it doesn't exist
      menu = await HireUsMenu.create({ categories: [], bottomLinks: [] });
    }
    res.status(200).json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update the menu (singleton)
exports.updateMenu = async (req, res) => {
  try {
    let menu = await HireUsMenu.findOne();
    if (!menu) {
      menu = await HireUsMenu.create({ categories: [], bottomLinks: [] });
    }
    
    const parsedBody = parseFormData(req.body);
    await processDynamicFiles(req.files, parsedBody);
    
    menu.categories = parsedBody.categories || [];
    menu.bottomLinks = parsedBody.bottomLinks || [];
    
    await menu.save();
    
    res.status(200).json({ success: true, data: menu });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
