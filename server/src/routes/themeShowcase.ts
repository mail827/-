import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const ADMIN_EMAILS = ['oicrcutie@gmail.com', 'gah7186@naver.com'];

const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);

router.get('/', async (req, res) => {
  try {
    const showcases = await prisma.themeShowcase.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });
    res.json(showcases);
  } catch (error) {
    console.error('Theme showcase fetch error:', error);
    res.status(500).json({ error: '테마 쇼케이스를 불러오는데 실패했습니다' });
  }
});

router.get('/admin/all', authMiddleware, async (req: any, res) => {
  try {
    if (!isAdmin(req.user?.email || '')) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }
    const showcases = await prisma.themeShowcase.findMany({
      orderBy: { order: 'asc' }
    });
    res.json(showcases);
  } catch (error) {
    console.error('Admin theme showcase fetch error:', error);
    res.status(500).json({ error: '테마 쇼케이스를 불러오는데 실패했습니다' });
  }
});

router.post('/', authMiddleware, async (req: any, res) => {
  try {
    if (!isAdmin(req.user?.email || '')) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }
    const { theme, title, description, sampleData, order, isActive } = req.body;
    const showcase = await prisma.themeShowcase.create({
      data: { theme, title, description, sampleData, order: order || 0, isActive: isActive ?? true }
    });
    res.json(showcase);
  } catch (error) {
    console.error('Theme showcase create error:', error);
    res.status(500).json({ error: '테마 쇼케이스 생성에 실패했습니다' });
  }
});

router.put('/:id', authMiddleware, async (req: any, res) => {
  try {
    if (!isAdmin(req.user?.email || '')) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }
    const { id } = req.params;
    const { theme, title, description, sampleData, order, isActive } = req.body;
    const showcase = await prisma.themeShowcase.update({
      where: { id },
      data: { theme, title, description, sampleData, order, isActive }
    });
    res.json(showcase);
  } catch (error) {
    console.error('Theme showcase update error:', error);
    res.status(500).json({ error: '테마 쇼케이스 수정에 실패했습니다' });
  }
});

router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    if (!isAdmin(req.user?.email || '')) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }
    const { id } = req.params;
    await prisma.themeShowcase.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Theme showcase delete error:', error);
    res.status(500).json({ error: '테마 쇼케이스 삭제에 실패했습니다' });
  }
});

router.put('/reorder', authMiddleware, async (req: any, res) => {
  try {
    if (!isAdmin(req.user?.email || '')) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }
    const { items } = req.body;
    await Promise.all(
      items.map((item: { id: string; order: number }) =>
        prisma.themeShowcase.update({ where: { id: item.id }, data: { order: item.order } })
      )
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Theme showcase reorder error:', error);
    res.status(500).json({ error: '순서 변경에 실패했습니다' });
  }
});

export default router;
