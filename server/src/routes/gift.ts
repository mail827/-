import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { sendGiftEmail } from '../utils/email.js';

const router = Router();
const prisma = new PrismaClient();

function generateGiftCode(): string {
  return 'GIFT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

router.post('/create', authMiddleware, async (req: any, res) => {
  try {
    const { packageId, toEmail, message } = req.body;
    const userId = req.user.id;

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return res.status(404).json({ error: '패키지를 찾을 수 없습니다' });
    }

    const code = generateGiftCode();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const gift = await prisma.gift.create({
      data: {
        code,
        packageId,
        fromUserId: userId,
        toEmail,
        message,
        expiresAt
      },
      include: { package: true, fromUser: true }
    });

    if (toEmail) {
      await sendGiftEmail(toEmail, gift.fromUser?.name || '익명', pkg.name, code, message);
    }

    res.json({ gift, code });
  } catch (error) {
    console.error('Gift create error:', error);
    res.status(500).json({ error: '선물 생성 실패' });
  }
});

router.post('/redeem', authMiddleware, async (req: any, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    const gift = await prisma.gift.findUnique({
      where: { code },
      include: { package: true }
    });

    if (!gift) {
      return res.status(404).json({ error: '유효하지 않은 코드입니다' });
    }

    if (gift.isRedeemed) {
      return res.status(400).json({ error: '이미 사용된 코드입니다' });
    }

    if (new Date() > gift.expiresAt) {
      return res.status(400).json({ error: '만료된 코드입니다' });
    }

    await prisma.gift.update({
      where: { id: gift.id },
      data: {
        toUserId: userId,
        redeemedAt: new Date()
      }
    });

    res.json({ success: true, packageName: gift.package.name, giftId: gift.id });
  } catch (error) {
    console.error('Gift redeem error:', error);
    res.status(500).json({ error: '코드 사용 실패' });
  }
});

router.get('/my', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const sent = await prisma.gift.findMany({
      where: { fromUserId: userId },
      include: { package: true, toUser: true },
      orderBy: { createdAt: 'desc' }
    });

    const received = await prisma.gift.findMany({
      where: {
        OR: [
          { toUserId: userId },
          { toEmail: req.user.email }
        ]
      },
      include: { package: true, fromUser: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ sent, received });
  } catch (error) {
    console.error('Gift list error:', error);
    res.status(500).json({ error: '선물 목록 조회 실패' });
  }
});

router.post('/payment/request', authMiddleware, async (req: any, res) => {
  try {
    const { packageId, toEmail, message } = req.body;

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return res.status(404).json({ error: '패키지를 찾을 수 없습니다' });
    }

    const orderId = `GIFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      clientKey: process.env.TOSS_CLIENT_KEY,
      orderId,
      amount: pkg.price,
      orderName: `[선물] ${pkg.name}`,
      packageId,
      toEmail,
      message
    });
  } catch (error) {
    console.error('Gift payment request error:', error);
    res.status(500).json({ error: '결제 요청 실패' });
  }
});

router.post('/payment/confirm', authMiddleware, async (req: any, res) => {
  try {
    const { paymentKey, orderId, amount, packageId, toEmail, message } = req.body;
    const userId = req.user.id;

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return res.status(404).json({ error: '패키지를 찾을 수 없습니다' });
    }

    if (pkg.price !== amount) {
      return res.status(400).json({ error: '금액이 일치하지 않습니다' });
    }

    const secretKey = process.env.TOSS_SECRET_KEY!;
    const authHeader = Buffer.from(secretKey + ':').toString('base64');

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      console.error('Toss gift confirm error:', tossData);
      return res.status(400).json({ error: tossData.message || '결제 승인 실패' });
    }

    const code = 'GIFT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const gift = await prisma.gift.create({
      data: {
        code,
        packageId,
        fromUserId: userId,
        toEmail,
        message,
        expiresAt
      },
      include: { package: true, fromUser: true }
    });

    if (toEmail) {
      await sendGiftEmail(toEmail, gift.fromUser?.name || '익명', pkg.name, code, message);
    }

    res.json({ gift, code });
  } catch (error) {
    console.error('Gift payment confirm error:', error);
    res.status(500).json({ error: '결제 승인 실패' });
  }
});

export default router;
