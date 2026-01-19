import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

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

export default router;
