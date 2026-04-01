import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/validate', async (req: Request, res: Response) => {
  const { code } = req.body;

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return res.status(404).json({ error: '존재하지 않는 쿠폰입니다' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ error: '비활성화된 쿠폰입니다' });
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({ error: '만료된 쿠폰입니다' });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: '사용 한도를 초과한 쿠폰입니다' });
    }

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      }
    });
  } catch (error) {
    console.error('Coupon validate error:', error);
    res.status(500).json({ error: '쿠폰 확인 실패' });
  }
});

router.post('/use', async (req: Request, res: Response) => {
  const { code } = req.body;

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ error: '유효하지 않은 쿠폰입니다' });
    }

    await prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: { usedCount: { increment: 1 } }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Coupon use error:', error);
    res.status(500).json({ error: '쿠폰 사용 처리 실패' });
  }
});

router.get('/admin', authMiddleware, async (req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: '쿠폰 목록 조회 실패' });
  }
});

router.post('/admin', authMiddleware, async (req: Request, res: Response) => {
  const { code, name, discountType, discountValue, maxUses, expiresAt, category } = req.body;

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        name,
        discountType: discountType || 'PERCENT',
        discountValue,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        category: category || 'ALL'
      }
    });
    res.status(201).json(coupon);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: '이미 존재하는 쿠폰 코드입니다' });
    }
    res.status(500).json({ error: '쿠폰 생성 실패' });
  }
});

router.delete('/admin/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.coupon.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '쿠폰 삭제 실패' });
  }
});

router.patch('/admin/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const coupon = await prisma.coupon.update({
      where: { id },
      data: { isActive }
    });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: '쿠폰 수정 실패' });
  }
});


export const couponRouter = router;
router.get('/admin/settlement', authMiddleware, async (req: Request, res: Response) => {
  const { startDate, endDate, couponCode } = req.query;

  try {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const orderWhere: any = { status: 'PAID', couponCode: couponCode ? (couponCode as string) : { not: null } };
    if (startDate || endDate) orderWhere.paidAt = dateFilter;

    const orders = await prisma.order.findMany({
      where: orderWhere,
      include: { package: true, user: true },
      orderBy: { paidAt: 'desc' },
    });

    const cinemaWhere: any = { status: { not: 'PENDING' }, couponCode: couponCode ? (couponCode as string) : { not: null } };
    if (startDate || endDate) cinemaWhere.paidAt = dateFilter;

    const cinemaOrders = await prisma.preweddingVideo.findMany({
      where: cinemaWhere,
      include: { user: true },
      orderBy: { paidAt: 'desc' },
    });

    const summary: Record<string, { code: string; count: number; totalPaid: number; commission: number; net: number; orders: any[] }> = {};

    for (const o of orders) {
      const code = o.couponCode!;
      if (!summary[code]) summary[code] = { code, count: 0, totalPaid: 0, commission: 0, net: 0, orders: [] };
      summary[code].count++;
      summary[code].totalPaid += o.amount;
      const comm = Math.floor(o.amount * 0.1);
      summary[code].commission += comm;
      summary[code].net += o.amount - comm;
      summary[code].orders.push({ id: o.id, orderId: o.orderId, amount: o.amount, packageName: o.package.name, userName: o.user.name, userEmail: o.user.email, paidAt: o.paidAt, type: 'package' });
    }

    for (const v of cinemaOrders) {
      const code = v.couponCode!;
      if (!summary[code]) summary[code] = { code, count: 0, totalPaid: 0, commission: 0, net: 0, orders: [] };
      summary[code].count++;
      summary[code].totalPaid += v.amount;
      const comm = Math.floor(v.amount * 0.1);
      summary[code].commission += comm;
      summary[code].net += v.amount - comm;
      const modeLabel = v.mode === 'selfie' ? 'AI 화보팩 + 웨딩시네마' : '웨딩시네마';
      summary[code].orders.push({ id: v.id, orderId: v.orderId, amount: v.amount, packageName: modeLabel, userName: v.user.name, userEmail: v.user.email, paidAt: v.paidAt, type: 'cinema' });
    }

    const allAmounts = [...orders.map(o => o.amount), ...cinemaOrders.map(v => v.amount)];
    const totals = {
      totalOrders: allAmounts.length,
      totalPaid: allAmounts.reduce((s, a) => s + a, 0),
      totalCommission: allAmounts.reduce((s, a) => s + Math.floor(a * 0.1), 0),
      totalNet: allAmounts.reduce((s, a) => s + (a - Math.floor(a * 0.1)), 0),
    };

    res.json({ summary: Object.values(summary), totals });
  } catch (error) {
    console.error('Settlement error:', error);
    res.status(500).json({ error: '정산 데이터 조회 실패' });
  }
});
