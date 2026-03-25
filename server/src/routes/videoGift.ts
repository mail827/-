import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { sendGiftEmail } from '../utils/email.js';
import { sendGiftNotification } from '../utils/solapi.js';

const router = Router();
const prisma = new PrismaClient();
const TOSS_SECRET = process.env.TOSS_SECRET_KEY;

const TIERS: Record<string, { amount: number; label: string }> = {
  basic: { amount: 29000, label: '식전영상 Basic' },
  premium: { amount: 49000, label: '식전영상 Premium' },
};

function generateCode(): string {
  return 'VID-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

router.post('/payment/confirm', authMiddleware, async (req: any, res) => {
  const { paymentKey, orderId, amount, tier, toEmail, toPhone, message } = req.body;
  const tierInfo = TIERS[tier];
  if (!tierInfo) return res.status(400).json({ error: 'invalid tier' });
  if (tierInfo.amount !== amount) return res.status(400).json({ error: 'amount mismatch' });

  try {
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(TOSS_SECRET + ':').toString('base64'),
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    if (!tossRes.ok) {
      const err = await tossRes.json();
      return res.status(400).json({ error: err.message || 'payment failed' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    await prisma.videoGift.create({
      data: {
        code,
        tier,
        fromUserId: req.user.id,
        toEmail: toEmail || null,
        toPhone: toPhone || null,
        message: message || null,
        paymentKey,
        orderId,
        amount,
        expiresAt,
      },
    });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const senderName = user?.name || '익명';

    if (toEmail) {
      await sendGiftEmail(toEmail, senderName, '식전영상 ' + tierInfo.label, code, message || '');
    }

    if (toPhone) {
      sendGiftNotification({
        to: toPhone, groomName: '', brideName: '', senderName,
        giftName: '식전영상 ' + tierInfo.label, message: message || '',
        link: 'https://weddingshop.cloud/prewedding-video?gift=' + code,
      }).catch(err => console.error('VideoGift notification error:', err));
    }

    res.json({ code });
  } catch (e: any) {
    console.error('VideoGift confirm error:', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/redeem', authMiddleware, async (req: any, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code required' });

  try {
    const gift = await prisma.videoGift.findUnique({ where: { code } });
    if (!gift) return res.status(404).json({ error: 'invalid code' });
    if (gift.isRedeemed) return res.status(400).json({ error: 'already redeemed' });
    if (new Date() > gift.expiresAt) return res.status(400).json({ error: 'expired' });

    await prisma.videoGift.update({
      where: { code },
      data: { isRedeemed: true, redeemedAt: new Date(), toUserId: req.user.id },
    });

    res.json({ success: true, tier: gift.tier });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/check/:code', async (req, res) => {
  try {
    const gift = await prisma.videoGift.findUnique({ where: { code: req.params.code } });
    if (!gift) return res.status(404).json({ error: 'not found' });
    res.json({
      tier: gift.tier,
      isRedeemed: gift.isRedeemed,
      expired: new Date() > gift.expiresAt,
    });
  } catch {
    res.status(500).json({ error: 'check failed' });
  }
});

router.get('/my', authMiddleware, async (req: any, res) => {
  try {
    const sent = await prisma.videoGift.findMany({
      where: { fromUserId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    const received = await prisma.videoGift.findMany({
      where: { toUserId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ sent, received });
  } catch {
    res.status(500).json({ error: 'fetch failed' });
  }
});


router.get('/admin/list', authMiddleware, async (req: any, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' });
  try {
    const gifts = await prisma.videoGift.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { name: true, email: true } },
        toUser: { select: { name: true, email: true } },
      },
    });
    res.json(gifts);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/create-free', authMiddleware, async (req: any, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' });

  const { tier, toEmail, toPhone, message, customCode } = req.body;
  const tierInfo = TIERS[tier];
  if (!tierInfo) return res.status(400).json({ error: 'invalid tier' });

  const code = customCode || generateCode();
  const existing = await prisma.videoGift.findUnique({ where: { code } });
  if (existing) return res.status(400).json({ error: 'code already exists' });

  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  try {
    const gift = await prisma.videoGift.create({
      data: {
        code,
        tier,
        fromUserId: req.user.id,
        toEmail: toEmail || null,
        toPhone: toPhone || null,
        message: message || null,
        isFree: true,
        amount: 0,
        expiresAt,
      },
    });

    if (toEmail) {
      await sendGiftEmail(toEmail, '청첩장 작업실', '식전영상 ' + tierInfo.label, code, message || '');
    }

    if (toPhone) {
      sendGiftNotification({
        to: toPhone, groomName: '', brideName: '', senderName: '청첩장 작업실',
        giftName: '식전영상 ' + tierInfo.label, message: message || '',
        link: 'https://weddingshop.cloud/prewedding-video?gift=' + code,
      }).catch(err => console.error('Free video gift notification error:', err));
    }

    res.json({ gift, code });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
