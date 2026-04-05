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


router.post('/gift', async (req: Request, res: Response) => {
  try {
    const { track, toEmail, toPhone, message, isFree } = req.body;
    const code = 'PG-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const gift = await prisma.posterGift.create({
      data: {
        code,
        track: track || 'PHOTO',
        fromAdmin: isFree !== false,
        toEmail: toEmail || null,
        toPhone: toPhone || null,
        message: message || null,
        expiresAt,
      },
    });

    if (gift.toPhone) {
      import('../utils/solapi.js').then(({ sendCustomNotification }) => {
        sendCustomNotification({
          to: gift.toPhone!,
          groomName: '',
          brideName: '',
          message: `[\uccad\ucca9\uc7a5 \uc791\uc5c5\uc2e4] \uc6e8\ub529\ud3ec\uc2a4\ud130 \uc120\ubb3c\uc774 \ub3c4\ucc29\ud588\uc5b4\uc694!\n\ucf54\ub4dc: ${gift.code}\nweddingshop.cloud/poster \uc5d0\uc11c \uc0ac\uc6a9\ud574\uc8fc\uc138\uc694.`,
        }).catch(() => {});
      }).catch(() => {});
    }
    res.json({ success: true, gift });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/gifts', async (_req: Request, res: Response) => {
  try {
    const gifts = await prisma.posterGift.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    res.json(gifts);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, paid, done, failed] = await Promise.all([
      prisma.posterOrder.count(),
      prisma.posterOrder.count({ where: { status: 'PAID' } }),
      prisma.posterOrder.count({ where: { status: 'DONE' } }),
      prisma.posterOrder.count({ where: { status: 'FAILED' } }),
    ]);
    const agg = await prisma.posterOrder.aggregate({ _sum: { amount: true }, where: { status: { in: ['PAID', 'DONE', 'GENERATING', 'COMPOSITING'] } } });
    res.json({ total, paid, done, failed, revenue: agg._sum.amount || 0 });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/retry', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    await prisma.posterOrder.update({ where: { orderId }, data: { status: 'PAID' as const } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
