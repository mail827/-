import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const adminOnly = (req: AuthRequest, res: Response, next: Function) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다' });
  }
  next();
};

router.get('/', async (req, res) => {
  try {
    const guides = await prisma.guide.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
    });
    res.json(guides);
  } catch (error) {
    console.error('Guide fetch error:', error);
    res.status(500).json({ error: '가이드 조회 실패' });
  }
});

router.get('/admin', authMiddleware, adminOnly, async (req, res) => {
  try {
    const guides = await prisma.guide.findMany({
      orderBy: { order: 'asc' },
    });
    res.json(guides);
  } catch (error) {
    console.error('Guide fetch error:', error);
    res.status(500).json({ error: '가이드 조회 실패' });
  }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { title, description, videoUrl, category, order, isPublished } = req.body;
  
  try {
    const guide = await prisma.guide.create({
      data: {
        title,
        description,
        videoUrl,
        category: category || 'GENERAL',
        order: order || 0,
        isPublished: isPublished ?? true,
      },
    });
    res.status(201).json(guide);
  } catch (error) {
    console.error('Guide create error:', error);
    res.status(500).json({ error: '가이드 생성 실패' });
  }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { title, description, videoUrl, category, order, isPublished } = req.body;
  
  try {
    const guide = await prisma.guide.update({
      where: { id },
      data: { title, description, videoUrl, category, order, isPublished },
    });
    res.json(guide);
  } catch (error) {
    console.error('Guide update error:', error);
    res.status(500).json({ error: '가이드 수정 실패' });
  }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params;
  
  try {
    await prisma.guide.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Guide delete error:', error);
    res.status(500).json({ error: '가이드 삭제 실패' });
  }
});

export const guideRouter = router;
