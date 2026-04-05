import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const where = status ? { status: status as any } : {};
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [orders, total] = await Promise.all([
      prisma.posterOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.posterOrder.count({ where }),
    ]);

    res.json({ orders, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, paid, done, failed, revenue] = await Promise.all([
      prisma.posterOrder.count(),
      prisma.posterOrder.count({ where: { status: 'PAID' } }),
      prisma.posterOrder.count({ where: { status: 'DONE' } }),
      prisma.posterOrder.count({ where: { status: 'FAILED' } }),
      prisma.posterOrder.aggregate({ where: { status: 'DONE' }, _sum: { amount: true } }),
    ]);
    res.json({ total, paid, done, failed, revenue: revenue._sum.amount || 0 });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id/retry', async (req: Request, res: Response) => {
  try {
    const order = await prisma.posterOrder.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (order.status !== 'FAILED') return res.status(400).json({ error: 'Only FAILED orders can be retried' });

    await prisma.posterOrder.update({
      where: { id: req.params.id },
      data: { status: 'PAID' },
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
