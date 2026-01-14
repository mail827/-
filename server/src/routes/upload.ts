import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { authMiddleware } from '../middleware/auth.js';

export const uploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

// 통합 업로드 - 파일 타입 자동 감지
uploadRouter.post('/', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다' });
    }

    const mimeType = req.file.mimetype;
    let resourceType: 'image' | 'video' = 'image';
    let folder = 'general';

    if (mimeType.startsWith('video/')) {
      resourceType = 'video';
      folder = 'videos';
    } else if (mimeType.startsWith('audio/')) {
      resourceType = 'video'; // Cloudinary는 audio를 video로 처리
      folder = 'music';
    } else if (mimeType.startsWith('image/')) {
      resourceType = 'image';
      folder = 'images';
    }

    const result = await uploadToCloudinary(req.file.buffer, folder, resourceType);

    res.json({ url: result.url, publicId: result.publicId });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: '파일 업로드 중 오류가 발생했습니다' });
  }
});

uploadRouter.post('/image', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다' });
    }

    const folder = req.body.folder || 'general';
    const result = await uploadToCloudinary(req.file.buffer, folder, 'image');

    res.json({ url: result.url, publicId: result.publicId });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: '이미지 업로드 중 오류가 발생했습니다' });
  }
});

uploadRouter.post('/video', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다' });
    }

    const folder = req.body.folder || 'videos';
    const result = await uploadToCloudinary(req.file.buffer, folder, 'video');

    res.json({ url: result.url, publicId: result.publicId });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ error: '영상 업로드 중 오류가 발생했습니다' });
  }
});

uploadRouter.post('/audio', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'music', 'video');

    res.json({ url: result.url, publicId: result.publicId });
  } catch (error) {
    console.error('Upload audio error:', error);
    res.status(500).json({ error: '오디오 업로드 중 오류가 발생했습니다' });
  }
});

uploadRouter.delete('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { publicId, resourceType } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: 'publicId가 필요합니다' });
    }

    await deleteFromCloudinary(publicId, resourceType || 'image');

    res.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: '파일 삭제 중 오류가 발생했습니다' });
  }
});
