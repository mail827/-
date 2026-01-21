import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const showcases = await prisma.themeShowcase.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });
    res.json(showcases);
  } catch (error) {
    console.error('Theme showcase error:', error);
    res.status(500).json({ error: 'Failed to fetch theme showcases' });
  }
});

router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const showcases = await prisma.themeShowcase.findMany({
      orderBy: { order: 'asc' }
    });
    res.json(showcases);
  } catch (error) {
    console.error('Admin theme showcase error:', error);
    res.status(500).json({ error: 'Failed to fetch theme showcases' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { theme, title, description, sampleData, order, isActive } = req.body;
    const showcase = await prisma.themeShowcase.create({
      data: {
        theme,
        title,
        description,
        sampleData: sampleData || {},
        order: order || 0,
        isActive: isActive ?? true
      }
    });
    res.json(showcase);
  } catch (error) {
    console.error('Create showcase error:', error);
    res.status(500).json({ error: 'Failed to create theme showcase' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { theme, title, description, sampleData, order, isActive } = req.body;
    const showcase = await prisma.themeShowcase.update({
      where: { id },
      data: {
        theme,
        title,
        description,
        sampleData: sampleData || {},
        order,
        isActive
      }
    });
    res.json(showcase);
  } catch (error) {
    console.error('Update showcase error:', error);
    res.status(500).json({ error: 'Failed to update theme showcase' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.themeShowcase.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete showcase error:', error);
    res.status(500).json({ error: 'Failed to delete theme showcase' });
  }
});

export default router;
