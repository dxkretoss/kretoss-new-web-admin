const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(process.cwd(), 'upload/resume');
// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "-");
    const ext = path.extname(file.originalname);
    cb(null, `resume-${sanitizedName}-${timestamp}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only PDF
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF documents are allowed!'), false);
  }
};

const uploadDoc = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for resumes
  },
  fileFilter: fileFilter,
});

module.exports = uploadDoc;
