import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const adminOnly = (req: AuthRequest, res: Response, next: Function) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: '관리자 권한이 필요합니다' });
  next();
};

router.get('/', async (_req, res) => {
  try {
    const videos = await prisma.highlightVideo.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
    });
    res.json(videos);
  } catch (error) {
    console.error('HighlightVideo fetch error:', error);
    res.status(500).json({ error: '영상 조회 실패' });
  }
});

router.get('/admin', authMiddleware, adminOnly, async (_req, res) => {
  try {
    const videos = await prisma.highlightVideo.findMany({ orderBy: { order: 'asc' } });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: '영상 조회 실패' });
  }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { title, description, videoUrl, thumbnailUrl, duration, order, isPublished } = req.body;
  try {
    const video = await prisma.highlightVideo.create({
      data: { title, description, videoUrl, thumbnailUrl, duration, order: order || 0, isPublished: isPublished ?? true },
    });
    res.status(201).json(video);
  } catch (error) {
    console.error('HighlightVideo create error:', error);
    res.status(500).json({ error: '영상 생성 실패' });
  }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { title, description, videoUrl, thumbnailUrl, duration, order, isPublished } = req.body;
  try {
    const video = await prisma.highlightVideo.update({
      where: { id },
      data: { title, description, videoUrl, thumbnailUrl, duration, order, isPublished },
    });
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: '영상 수정 실패' });
  }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.highlightVideo.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '영상 삭제 실패' });
  }
});

export const highlightVideoRouter = router;
