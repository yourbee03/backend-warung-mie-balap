import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { ResponseHelper } from '../utils/response';
import { Request, Response } from 'express';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dagrqqtj9',
  api_key: process.env.CLOUDINARY_API_KEY || '589539731739177',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'FJRUkYEPWwMlxTs8cQ2Qixz22yQ',
});

const memoryStorage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024,
};

export const uploadSingle = multer({
  storage: memoryStorage,
  fileFilter,
  limits,
}).single('image');

export const uploadMultiple = multer({
  storage: memoryStorage,
  fileFilter,
  limits,
}).array('images', 5);

export const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `warung-mie-balap/${folder}`, transformation: [{ width: 800, height: 800, crop: 'limit' }] },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
    stream.end(buffer);
  });
};

export const handleMulterError = (err: any, req: Request, res: Response, next: any): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      ResponseHelper.badRequest(res, 'File size too large. Maximum size is 5MB');
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      ResponseHelper.badRequest(res, 'Too many files');
      return;
    }
  }
  if (err.message === 'Only image files are allowed') {
    ResponseHelper.badRequest(res, err.message);
    return;
  }
  next(err);
};
