const multer = require('multer');

// Store files in memory so we can pass them to Sharp for processing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Allow up to 50MB before processing
  },
  fileFilter: fileFilter,
});

module.exports = upload;
