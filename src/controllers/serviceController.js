const Service = require('../models/Service');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');

const getUploadDir = () => {
  return 'upload/service';
};

const processAndSaveImage = async (fileBuffer, originalName, prefix = '') => {
  try {
    const uploadDir = getUploadDir();
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

// Create a new Service
exports.createService = async (req, res) => {
  try {
    const { id, title, slug, desc, hireUsLink } = req.body;
    
    let tags = [];
    if (req.body.tags) {
      tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags || '[]');
    }

    let imagePath = '';
    if (req.files && req.files['image'] && req.files['image'][0]) {
      const file = req.files['image'][0];
      imagePath = await processAndSaveImage(file.buffer, file.originalname, 'main-');
    }

    let iconPath = '';
    if (req.files && req.files['icon'] && req.files['icon'][0]) {
      const file = req.files['icon'][0];
      iconPath = await processAndSaveImage(file.buffer, file.originalname, 'icon-');
    }

    const service = new Service({
      serviceId: id, // Mapping frontend 'id' to 'serviceId'
      title, slug, desc, hireUsLink, tags,
      image: imagePath,
      icon: iconPath
    });

    await service.save();
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all Services with pagination
exports.getServices = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const query = {};
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { desc: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (!isNaN(page) && !isNaN(limit)) {
      const skip = (page - 1) * limit;
      const total = await Service.countDocuments(query);
      const services = await Service.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const formattedServices = services.map(s => {
        const obj = s.toObject();
        obj.id = obj.serviceId;
        return obj;
      });

      return res.status(200).json({
        success: true,
        data: formattedServices,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page,
        limit
      });
    }

    const services = await Service.find(query).sort({ createdAt: -1 });
    const formattedServices = services.map(s => {
      const obj = s.toObject();
      obj.id = obj.serviceId;
      return obj;
    });
    res.status(200).json({ success: true, data: formattedServices, total: formattedServices.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single Service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    const obj = service.toObject();
    obj.id = obj.serviceId;
    res.status(200).json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a Service
exports.updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const updateData = { ...req.body };
    if (updateData.id) {
      updateData.serviceId = updateData.id;
    }

    if (req.body.tags) {
      updateData.tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags || '[]');
    }

    if (req.files && req.files['image'] && req.files['image'][0]) {
      const file = req.files['image'][0];
      updateData.image = await processAndSaveImage(file.buffer, file.originalname, 'main-');
    }

    if (req.files && req.files['icon'] && req.files['icon'][0]) {
      const file = req.files['icon'][0];
      updateData.icon = await processAndSaveImage(file.buffer, file.originalname, 'icon-');
    }

    service = await Service.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after', runValidators: true });
    
    const obj = service.toObject();
    obj.id = obj.serviceId;
    res.status(200).json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a Service
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const filesToDelete = [];
    if (service.image) filesToDelete.push(service.image);
    if (service.icon) filesToDelete.push(service.icon);

    for (let filePath of filesToDelete) {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        await fs.unlink(fullPath);
      } catch (err) {
        console.warn(`Could not delete file: ${filePath}`);
      }
    }

    await service.deleteOne();
    res.status(200).json({ success: true, message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
