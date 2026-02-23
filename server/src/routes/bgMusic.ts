import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/public', async (_req, res) => {
  try {
    const musics = await prisma.bgMusic.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });
    res.json(musics);
  } catch (error) {
    console.error('BgMusic list error:', error);
    res.status(500).json({ error: '음원 목록 조회 오류' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'ADMIN') return res.status(403).json({ error: '관리자만 접근 가능' });
  try {
    const musics = await prisma.bgMusic.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });
    res.json(musics);
  } catch (error) {
    res.status(500).json({ error: '음원 목록 조회 오류' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'ADMIN') return res.status(403).json({ error: '관리자만 접근 가능' });
  try {
    const { title, artist, category, url, duration, order } = req.body;
    const music = await prisma.bgMusic.create({
      data: { title, artist: artist || '', category: category || 'romantic', url, duration: duration || 0, order: order || 0 },
    });
    res.status(201).json(music);
  } catch (error) {
    console.error('BgMusic create error:', error);
    res.status(500).json({ error: '음원 등록 오류' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'ADMIN') return res.status(403).json({ error: '관리자만 접근 가능' });
  try {
    const { id } = req.params;
    const { title, artist, category, url, duration, order, isActive } = req.body;
    const music = await prisma.bgMusic.update({
      where: { id },
      data: { title, artist, category, url, duration, order, isActive },
    });
    res.json(music);
  } catch (error) {
    res.status(500).json({ error: '음원 수정 오류' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'ADMIN') return res.status(403).json({ error: '관리자만 접근 가능' });
  try {
    await prisma.bgMusic.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '음원 삭제 오류' });
  }
});

export default router;
