import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth';

const router = Router();

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post('/', authenticate, upload.array('files'), (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    const uploadedFiles = files.map((file) => ({
      id: file.filename, // Using filename as ID for simplicity
      name: file.originalname,
      type: file.mimetype,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date().toISOString(),
    }));

    res.status(200).json(uploadedFiles);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Error uploading files' });
  }
});

export default router;
