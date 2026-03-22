import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const TIERS: Record<string, { credits: number; price: number; label: string }> = {
  'booth-10': { credits: 10, price: 2900, label: '10장' },
  'booth-30': { credits: 30, price: 6900, label: '30장' },
  'booth-50': { credits: 50, price: 9900, label: '50장' },
  'booth-100': { credits: 100, price: 14900, label: '100장' },
};

router.get('/tiers', (_req, res) => {
  res.json(TIERS);
});

router.get('/status/:weddingId', authMiddleware, async (req: any, res) => {
  try {
    const wedding = await prisma.wedding.findUnique({
      where: { id: req.params.weddingId },
      select: { id: true, userId: true, boothCredits: true },
    });
    if (!wedding) return res.status(404).json({ error: 'Not found' });
    if (wedding.userId !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const orders = await prisma.boothCreditOrder.findMany({
      where: { weddingId: wedding.id, status: 'PAID' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json({ credits: wedding.boothCredits, orders });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/order', authMiddleware, async (req: any, res) => {
  try {
    const { weddingId, tier } = req.body;
    const tierInfo = TIERS[tier];
    if (!tierInfo) return res.status(400).json({ error: 'Invalid tier' });

    const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
    if (!wedding) return res.status(404).json({ error: 'Not found' });
    if (wedding.userId !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const orderId = `BOOTH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const order = await prisma.boothCreditOrder.create({
      data: {
        weddingId,
        userId: req.user.id,
        tier,
        credits: tierInfo.credits,
        amount: tierInfo.price,
        orderId,
        status: 'PENDING',
      },
    });

    res.json({ order, clientKey: process.env.TOSS_CLIENT_KEY });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/confirm', authMiddleware, async (req: any, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;

    const order = await prisma.boothCreditOrder.findUnique({ where: { orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.amount !== amount) return res.status(400).json({ error: 'Amount mismatch' });

    const secretKey = process.env.TOSS_SECRET_KEY!;
    const authHeader = Buffer.from(secretKey + ':').toString('base64');

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${authHeader}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      return res.status(400).json({ error: tossData.message || 'Payment failed' });
    }

    const [updatedOrder] = await prisma.$transaction([
      prisma.boothCreditOrder.update({
        where: { orderId },
        data: { status: 'PAID', paymentKey, paidAt: new Date() },
      }),
      prisma.wedding.update({
        where: { id: order.weddingId },
        data: { boothCredits: { increment: order.credits } },
      }),
    ]);

    res.json({ success: true, order: updatedOrder });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
