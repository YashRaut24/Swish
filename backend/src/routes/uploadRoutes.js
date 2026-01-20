import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import httpStatus from 'http-status';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });


const ensureCloudinaryConfigured = () => {
  if (!cloudinary.config().cloud_name) {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      console.log('✓ Cloudinary configured successfully');
    } else {
      console.error('✗ Cloudinary environment variables missing!');
      throw new Error('Upload service not configured');
    }
  }
};


const uploadToCloudinary = (buffer, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          resource_type: resourceType === 'video' ? 'video' : 'image',
          folder: 'swish',
          quality: 'auto',
          fetch_format: 'auto'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    } catch (error) {
      console.error('Error creating upload stream:', error);
      reject(error);
    }
  });
};

router.post('/uploads', authMiddleware, upload.array('files'), async (req, res) => {
  try {
    
    ensureCloudinaryConfigured();
    
    console.log('Upload request received:', {
      filesCount: req.files?.length || 0,
      cloudinaryConfigured: !!cloudinary.config().cloud_name
    });

    const files = req.files || [];
    if (files.length === 0) {
      console.log('No files in request');
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'No files uploaded' });
    }

    const uploadPromises = files.map(async (file) => {
      console.log('Uploading file:', { name: file.originalname, size: file.size, type: file.mimetype });
      const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';
      const result = await uploadToCloudinary(file.buffer, resourceType);
      console.log('Upload successful:', result.secure_url);
      return {
        url: result.secure_url,
        type: resourceType,
        publicId: result.public_id,
      };
    });

    const media = await Promise.all(uploadPromises);
    console.log('All uploads completed:', media.length);
    return sendSuccess(res, { status: 201, data: { media } });
  } catch (err) {
    console.error('Upload error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: `Failed to upload files: ${err.message}` });
  }
});

export default router;
