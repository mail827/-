import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/:slug/upload', upload.single('photo'), async (req, res) => {
  try {
    const { slug } = req.params;
    const { guestName, message } = req.body;
    const wedding = await prisma.wedding.findUnique({ where: { slug } });
    if (!wedding) return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    if (!wedding.guestPhotoEnabled) return res.status(403).json({ error: '하객 포토 업로드가 비활성화되어 있습니다' });
    if (!req.file) return res.status(400).json({ error: '사진을 선택해주세요' });

    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: `wedding/${slug}/guest-photos`, transformation: [{ width: 1200, quality: 'auto' }] },
        (err, r) => err ? reject(err) : resolve(r)
      ).end(req.file!.buffer);
    });

    const photo = await prisma.guestPhoto.create({
      data: { weddingId: wedding.id, guestName: guestName || '익명', imageUrl: result.secure_url, publicId: result.public_id, message, mediaType: 'IMAGE' },
    });
    res.json(photo);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:slug/upload-video', async (req, res) => {
  try {
    const { slug } = req.params;
    const { guestName, message, videoUrl, publicId } = req.body;
    const wedding = await prisma.wedding.findUnique({ where: { slug } });
    if (!wedding) return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    if (!wedding.guestPhotoEnabled) return res.status(403).json({ error: '업로드가 비활성화되어 있습니다' });
    if (!videoUrl) return res.status(400).json({ error: '영상 URL이 필요합니다' });

    const photo = await prisma.guestPhoto.create({
      data: {
        weddingId: wedding.id,
        guestName: guestName || '익명',
        imageUrl: videoUrl,
        publicId: publicId || null,
        message,
        mediaType: 'VIDEO'
      },
    });
    res.json(photo);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:slug', async (req, res) => {
  const wedding = await prisma.wedding.findUnique({ where: { slug: req.params.slug } });
  if (!wedding) return res.status(404).json({ error: '없음' });
  const photos = await prisma.guestPhoto.findMany({
    where: { weddingId: wedding.id, approved: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(photos);
});

router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    const photo = await prisma.guestPhoto.findUnique({ where: { id: req.params.id }, include: { wedding: true } });
    if (!photo) return res.status(404).json({ error: '없음' });
    if (photo.wedding.userId !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ error: '권한 없음' });
    if (photo.publicId) {
      if (photo.mediaType === 'VIDEO') {
        await cloudinary.uploader.destroy(photo.publicId, { resource_type: 'video' });
      } else {
        await cloudinary.uploader.destroy(photo.publicId);
      }
    }
    await prisma.guestPhoto.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
