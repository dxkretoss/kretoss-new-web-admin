const Review = require('../models/Review');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');

const getUploadDir = () => {
  return 'upload/reviews';
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

// Create a new Review
exports.createReview = async (req, res) => {
  try {
    const { review, reviewerName, rating } = req.body;
    
    let imagePath = '';
    if (req.files && req.files['image'] && req.files['image'][0]) {
      const file = req.files['image'][0];
      imagePath = await processAndSaveImage(file.buffer, file.originalname, 'review-');
    }

    const newReview = new Review({
      review, 
      reviewerName, 
      rating: parseFloat(rating),
      image: imagePath
    });

    await newReview.save();
    res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all Reviews
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    const formattedReviews = reviews.map(r => {
      const obj = r.toObject();
      obj.id = obj._id;
      return obj;
    });
    res.status(200).json({ success: true, data: formattedReviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single Review by ID
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    const obj = review.toObject();
    obj.id = obj._id;
    res.status(200).json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a Review
exports.updateReview = async (req, res) => {
  try {
    let reviewItem = await Review.findById(req.params.id);

    if (!reviewItem) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const updateData = { ...req.body };
    if (updateData.rating) {
        updateData.rating = parseFloat(updateData.rating);
    }

    if (req.files && req.files['image'] && req.files['image'][0]) {
      const file = req.files['image'][0];
      updateData.image = await processAndSaveImage(file.buffer, file.originalname, 'review-');
    }

    reviewItem = await Review.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after', runValidators: true });
    
    const obj = reviewItem.toObject();
    obj.id = obj._id;
    res.status(200).json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a Review
exports.deleteReview = async (req, res) => {
  try {
    const reviewItem = await Review.findById(req.params.id);
    if (!reviewItem) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (reviewItem.image) {
      try {
        const fullPath = path.join(process.cwd(), reviewItem.image);
        await fs.unlink(fullPath);
      } catch (err) {
        console.warn(`Could not delete file: ${reviewItem.image}`);
      }
    }

    await reviewItem.deleteOne();
    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
