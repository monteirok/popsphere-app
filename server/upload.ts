import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Create upload directories if they don't exist
const uploadDirs = ['uploads', 'uploads/profile', 'uploads/collectibles', 'uploads/banners'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Set up storage configuration for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads';
    
    // Determine the upload path based on the route
    if (req.path.includes('/profile')) {
      uploadPath = 'uploads/profile';
    } else if (req.path.includes('/collectibles')) {
      uploadPath = 'uploads/collectibles';
    } else if (req.path.includes('/banner')) {
      uploadPath = 'uploads/banners';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with the original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter to validate file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only jpeg, jpg, and png files
  const allowedFileTypes = /jpeg|jpg|png/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  
  cb(new Error('Only .png, .jpg, and .jpeg files are allowed'));
};

// Set up multer with our configurations
// Set a reasonable file size limit (3MB)
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB in bytes
  }
});

// Error handling middleware for multer errors
export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum file size is 3MB.'
      });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
};

// Helper function to get file URL
export const getFileUrl = (req: Request, filename: string): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/${filename}`;
};