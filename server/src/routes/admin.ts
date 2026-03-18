import { Router } from 'express';
import crypto from "crypto";
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { sendInquiryReply, sendGiftEmail } from '../utils/email.js';
import { sendGiftNotification } from '../utils/solapi.js';

const router = Router();
const prisma = new PrismaClient();

const adminMiddleware = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다' });
  }
  next();
};

router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      _count: { select: { weddings: true, orders: true } },
      weddings: { select: { id: true, expiresAt: true } },
      snapPacks: { select: { id: true, totalSnaps: true, usedSnaps: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const enriched = users.map(u => {
    const archiveCount = u.weddings.filter((w: any) => w.expiresAt === null).length;
    const totalSnaps = u.snapPacks?.reduce((sum: number, p: any) => sum + (p.totalSnaps - p.usedSnaps), 0) || 0;
    const { weddings: _w, snapPacks: _s, ...rest } = u as any;
    return { ...rest, archiveCount, snapRemaining: totalSnaps };
  });
  res.json(enriched);
});

router.post('/users/:id/grant-archive', authMiddleware, adminMiddleware, async (req, res) => {
  const { id: userId } = req.params;
  const { weddingId } = req.body;
  try {
    if (weddingId) {
      await prisma.wedding.update({ where: { id: weddingId }, data: { expiresAt: null } });
      return res.json({ success: true, message: '해당 청첩장 영구 아카이브 적용' });
    }
    const weddings = await prisma.wedding.findMany({ where: { userId } });
    if (weddings.length === 0) return res.status(400).json({ error: '청첩장이 없습니다' });
    await prisma.wedding.updateMany({ where: { userId }, data: { expiresAt: null } });
    res.json({ success: true, message: `${weddings.length}개 청첩장 영구 아카이브 적용` });
  } catch (e) {
    console.error('Grant archive error:', e);
    res.status(500).json({ error: '영구 아카이브 적용 실패' });
  }
});

router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: '회원 삭제 실패' });
  }
});

router.get('/orders', authMiddleware, adminMiddleware, async (req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      package: true,
      wedding: { select: { id: true, slug: true, groomName: true, brideName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

router.delete('/orders/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    await prisma.order.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: '주문 삭제 실패' });
  }
});

router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  const [usersCount, weddingsCount, ordersCount, paidOrdersCount] = await Promise.all([
    prisma.user.count(),
    prisma.wedding.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PAID' } }),
  ]);
  
  const [orderRevenue, snapRevenue] = await Promise.all([
    prisma.order.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.snapPack.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    }),
  ]);
  const revenue = (orderRevenue._sum.amount || 0) + (snapRevenue._sum.amount || 0);
  
  res.json({
    users: usersCount,
    weddings: weddingsCount,
    orders: ordersCount,
    paidOrders: paidOrdersCount,
    revenue,
  });
});

router.get('/inquiries', authMiddleware, adminMiddleware, async (req, res) => {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(inquiries);
});

router.put('/inquiries/:id/reply', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;
  
  try {
    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: { reply, status: 'REPLIED', repliedAt: new Date() },
    });
    
    await sendInquiryReply(inquiry.email, inquiry.name, inquiry.message, reply);
    
    res.json(inquiry);
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ error: '답변 저장 실패' });
  }
});

router.put('/inquiries/:id/close', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
    res.json(inquiry);
  } catch (error) {
    res.status(500).json({ error: '상태 변경 실패' });
  }
});

router.delete('/inquiries/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    await prisma.inquiry.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '문의 삭제 실패' });
  }
});

router.get('/contents', authMiddleware, adminMiddleware, async (req, res) => {
  const contents = await prisma.siteContent.findMany({
    orderBy: { key: 'asc' },
  });
  res.json(contents);
});

router.get('/contents/:key', async (req, res) => {
  const { key } = req.params;
  const content = await prisma.siteContent.findUnique({
    where: { key },
  });
  res.json(content);
});

router.put('/contents/:key', authMiddleware, adminMiddleware, async (req, res) => {
  const { key } = req.params;
  const { title, content } = req.body;
  
  const updated = await prisma.siteContent.upsert({
    where: { key },
    update: { title, content },
    create: { key, title, content },
  });
  
  res.json(updated);
});

router.post('/gift/free', authMiddleware, adminMiddleware, async (req: any, res) => {
  try {
    const { email, phone, packageId, message } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: '이메일 또는 전화번호를 입력해주세요' });
    }

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return res.status(404).json({ error: '패키지를 찾을 수 없습니다' });
    }

    const code = 'GIFT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const giftMessage = message || '청첩장 작업실에서 드리는 선물입니다!';

    const gift = await prisma.gift.create({
      data: {
        code,
        packageId,
        toEmail: email || null,
        toPhone: phone || null,
        message: giftMessage,
        expiresAt
      }
    });

    const results: string[] = [];

    if (email) {
      await sendGiftEmail(email, '청첩장 작업실', pkg.name, code, giftMessage);
      results.push('이메일');
    }

    if (phone) {
      await sendGiftNotification({
        to: phone,
        groomName: '청첩장 작업실',
        brideName: '',
        senderName: '청첩장 작업실',
        giftName: pkg.name,
        message: giftMessage,
        link: `https://weddingshop.cloud/gift?code=${code}`,
      });
      results.push('카카오톡');
    }

    res.json({ gift, code, sentVia: results });
  } catch (error) {
    console.error('Admin gift error:', error);
    res.status(500).json({ error: '선물 생성 실패' });
  }
});

router.post('/gift/resend', authMiddleware, adminMiddleware, async (req: any, res) => {
  try {
    const { giftId, type } = req.body;

    const gift = await prisma.gift.findUnique({
      where: { id: giftId },
      include: { package: true }
    });

    if (!gift) {
      return res.status(404).json({ error: '선물을 찾을 수 없습니다' });
    }

    const giftMessage = gift.message || '청첩장 작업실에서 드리는 선물입니다!';

    if (type === 'email' && gift.toEmail) {
      await sendGiftEmail(gift.toEmail, '청첩장 작업실', gift.package.name, gift.code, giftMessage);
      return res.json({ success: true, type: 'email' });
    }

    if (type === 'kakao' && gift.toPhone) {
      await sendGiftNotification({
        to: gift.toPhone,
        groomName: '청첩장 작업실',
        brideName: '',
        senderName: '청첩장 작업실',
        giftName: gift.package.name,
        message: giftMessage,
        link: `https://weddingshop.cloud/gift?code=${gift.code}`,
      });
      return res.json({ success: true, type: 'kakao' });
    }

    res.status(400).json({ error: '발송할 수 없습니다' });
  } catch (error) {
    console.error('Gift resend error:', error);
    res.status(500).json({ error: '재발송 실패' });
  }
});

router.get('/gifts', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const gifts = await prisma.gift.findMany({
      where: { fromUserId: null },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(gifts);
  } catch (error) {
    console.error('Gift list error:', error);
    res.status(500).json({ error: '선물 목록 조회 실패' });
  }
});

router.get('/reviews', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        wedding: {
          select: { groomName: true, brideName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    console.error('Admin reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.patch('/reviews/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    
    const review = await prisma.review.update({
      where: { id },
      data: { isPublic }
    });
    res.json(review);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

router.delete('/reviews/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.review.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

router.put('/packages/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, features, isActive, sortOrder } = req.body;
    
    const updated = await prisma.package.update({
      where: { id },
      data: { name, price, description, features, isActive, sortOrder }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

router.get('/snap-samples', async (_req, res) => {
  const samples = await prisma.aiSnapSample.findMany({
    where: { isActive: true },
    orderBy: [{ concept: 'asc' }, { sortOrder: 'asc' }],
  });
  res.json(samples);
});

router.post('/snap-samples', authMiddleware, adminMiddleware, async (req, res) => {
  const { concept, mode, imageUrl, sortOrder } = req.body;
  const sample = await prisma.aiSnapSample.create({
    data: { concept, mode: mode || 'couple', imageUrl, sortOrder: sortOrder || 0 },
  });
  res.json(sample);
});

router.delete('/snap-samples/:id', authMiddleware, adminMiddleware, async (req, res) => {
  await prisma.aiSnapSample.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});


router.get('/wedding-lifecycle', authMiddleware, adminMiddleware, async (req: any, res) => {
  try {
    const weddings = await prisma.wedding.findMany({
      select: {
        id: true, slug: true, groomName: true, brideName: true,
        weddingDate: true, expiresAt: true, createdAt: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { weddingDate: 'asc' },
    });
    res.json(weddings);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export const adminRouter = router;
