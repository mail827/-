import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { sendGiftEmail } from '../utils/email.js';
import { sendGiftNotification } from '../utils/solapi.js';

const router = Router();
const prisma = new PrismaClient();
const TOSS_SECRET = process.env.TOSS_SECRET_KEY;

const TIERS: Record<string, { snaps: number; price: number; label: string }> = {
  'snap-3': { snaps: 3, price: 5900, label: '3장 세트' },
  'snap-5': { snaps: 5, price: 9900, label: '5장 세트' },
  'snap-10': { snaps: 10, price: 14900, label: '10장 세트' },
  'snap-20': { snaps: 20, price: 24900, label: '20장 세트' },
};

function generateCode(): string {
  return 'SNAP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

router.post('/create', authMiddleware, async (req: any, res) => {
  try {
    const { tier, toEmail, toPhone, message } = req.body;
    const userId = req.user.id;
    const tierInfo = TIERS[tier];
    if (!tierInfo) return res.status(400).json({ error: '잘못된 티어' });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const gift = await prisma.snapGift.create({
      data: { code, tier, fromUserId: userId, toEmail, toPhone, message, expiresAt },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const senderName = user?.name || '익명';

    if (toEmail) {
      await sendGiftEmail(toEmail, senderName, `AI 웨딩스냅 ${tierInfo.label}`, code, message || '');
    }

    if (toPhone) {
      sendGiftNotification({
        to: toPhone, groomName: '', brideName: '', senderName,
        giftName: `AI 웨딩스냅 ${tierInfo.label}`, message: message || '',
        link: `https://weddingshop.cloud/ai-snap/redeem?code=${code}`,
      }).catch(err => console.error('스냅 선물 알림 실패:', err));
    }

    res.json({ gift, code });
  } catch (error) {
    console.error('SnapGift create error:', error);
    res.status(500).json({ error: '선물 생성 실패' });
  }
});

router.post('/admin/create-free', authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user?.role !== 'ADMIN') return res.status(403).json({ error: '관리자만 가능' });

    const { tier, toEmail, toPhone, message, customCode } = req.body;
    const tierInfo = TIERS[tier];
    if (!tierInfo) return res.status(400).json({ error: '잘못된 티어' });

    const code = customCode || generateCode();
    const existing = await prisma.snapGift.findUnique({ where: { code } });
    if (existing) return res.status(400).json({ error: '이미 존재하는 코드' });

    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const gift = await prisma.snapGift.create({
      data: { code, tier, fromUserId: req.user.id, toEmail, toPhone, message, isFree: true, expiresAt },
    });

    if (toEmail) {
      await sendGiftEmail(toEmail, '청첩장 작업실', `AI 웨딩스냅 ${tierInfo.label} (무료)`, code, message || '');
    }

    if (toPhone) {
      sendGiftNotification({
        to: toPhone, groomName: '', brideName: '', senderName: '청첩장 작업실',
        giftName: `AI 웨딩스냅 ${tierInfo.label}`, message: message || '',
        link: `https://weddingshop.cloud/ai-snap/redeem?code=${code}`,
      }).catch(err => console.error('스냅 선물 알림 실패:', err));
    }

    res.json({ gift, code });
  } catch (error) {
    console.error('SnapGift admin create error:', error);
    res.status(500).json({ error: '선물 생성 실패' });
  }
});

router.post('/payment/confirm', authMiddleware, async (req: any, res) => {
  try {
    const { paymentKey, orderId, amount, tier, toEmail, toPhone, message } = req.body;
    const userId = req.user.id;
    const tierInfo = TIERS[tier];
    if (!tierInfo || tierInfo.price !== amount) return res.status(400).json({ error: '금액 불일치' });

    const encoded = Buffer.from(`${TOSS_SECRET}:`).toString('base64');
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: { Authorization: `Basic ${encoded}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const tossData = await tossRes.json();
    if (!tossRes.ok) return res.status(400).json({ error: tossData.message || '결제 실패' });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const gift = await prisma.snapGift.create({
      data: { code, tier, fromUserId: userId, toEmail, toPhone, message, expiresAt },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const senderName = user?.name || '익명';

    if (toEmail) {
      await sendGiftEmail(toEmail, senderName, `AI 웨딩스냅 ${tierInfo.label}`, code, message || '');
    }

    if (toPhone) {
      sendGiftNotification({
        to: toPhone, groomName: '', brideName: '', senderName,
        giftName: `AI 웨딩스냅 ${tierInfo.label}`, message: message || '',
        link: `https://weddingshop.cloud/ai-snap/redeem?code=${code}`,
      }).catch(err => console.error('스냅 선물 알림 실패:', err));
    }

    res.json({ gift, code });
  } catch (error) {
    console.error('SnapGift payment error:', error);
    res.status(500).json({ error: '결제 실패' });
  }
});

router.post('/redeem', authMiddleware, async (req: any, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    const gift = await prisma.snapGift.findUnique({ where: { code } });
    if (!gift) return res.status(404).json({ error: '유효하지 않은 코드입니다' });
    if (gift.isRedeemed) return res.status(400).json({ error: '이미 사용된 코드입니다' });
    if (new Date() > gift.expiresAt) return res.status(400).json({ error: '만료된 코드입니다' });

    const tierInfo = TIERS[gift.tier];
    if (!tierInfo) return res.status(400).json({ error: '잘못된 티어' });

    const orderId = `SNAPGIFT_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const pack = await prisma.snapPack.create({
      data: {
        userId, tier: gift.tier, totalSnaps: tierInfo.snaps, concept: '',
        category: 'studio', mode: 'groom', inputUrls: [],
        amount: gift.isFree ? 0 : tierInfo.price, orderId, status: 'PAID',
        paidAt: new Date(),
      },
    });

    await prisma.snapGift.update({
      where: { id: gift.id },
      data: { isRedeemed: true, toUserId: userId, redeemedAt: new Date() },
    });

    res.json({ success: true, packId: pack.id, tier: gift.tier, label: tierInfo.label });
  } catch (error) {
    console.error('SnapGift redeem error:', error);
    res.status(500).json({ error: '코드 사용 실패' });
  }
});

router.get('/admin/list', authMiddleware, async (req: any, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user?.role !== 'ADMIN') return res.status(403).json({ error: '관리자만' });
  const gifts = await prisma.snapGift.findMany({
    include: { fromUser: { select: { name: true, email: true } }, toUser: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(gifts);
});

router.get('/check/:code', async (req, res) => {
  const gift = await prisma.snapGift.findUnique({ where: { code: req.params.code } });
  if (!gift) return res.status(404).json({ error: '유효하지 않은 코드' });
  const tierInfo = TIERS[gift.tier];
  res.json({
    valid: !gift.isRedeemed && new Date() <= gift.expiresAt,
    isRedeemed: gift.isRedeemed,
    expired: new Date() > gift.expiresAt,
    tier: gift.tier,
    label: tierInfo?.label,
    snaps: tierInfo?.snaps,
    isFree: gift.isFree,
  });
});

export default router;
