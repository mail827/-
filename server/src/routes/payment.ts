import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { sendPaymentNotification } from '../utils/solapi.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/packages', async (req, res) => {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(packages);
});

router.get('/available-order', authMiddleware, async (req, res) => {
  const userId = (req as any).user.id;
  
  try {
    const availableOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: 'PAID',
        wedding: null,
      },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
    });
    
    if (availableOrder) {
      return res.json({ availableOrder, type: 'order' });
    }
    
    const availableGift = await prisma.gift.findFirst({
      where: {
        toUserId: userId,
        isRedeemed: false,
        expiresAt: { gt: new Date() },
      },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
    });
    
    if (availableGift) {
      return res.json({ 
        availableOrder: {
          id: availableGift.id,
          orderId: `GIFT-${availableGift.code}`,
          package: availableGift.package,
          type: 'gift'
        },
        type: 'gift',
        giftId: availableGift.id
      });
    }
    
    res.json({ availableOrder: null });
  } catch (error) {
    console.error('Available order check error:', error);
    res.status(500).json({ error: '주문 확인 중 오류가 발생했습니다' });
  }
});

router.post('/order', authMiddleware, async (req, res) => {
  const { packageId, couponCode } = req.body;
  const userId = (req as any).user.id;
  
  try {
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) return res.status(404).json({ error: '패키지를 찾을 수 없습니다' });

    let finalAmount = pkg.price;
    let appliedCouponId = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (coupon && coupon.isActive) {
        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
          return res.status(400).json({ error: '만료된 쿠폰입니다' });
        }
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
          return res.status(400).json({ error: '사용 한도 초과' });
        }
        if (coupon.category !== 'ALL' && coupon.category !== 'PACKAGE') {
          return res.status(400).json({ error: '이 쿠폰은 패키지 결제에 사용할 수 없습니다' });
        }
        if (coupon.discountType === 'PERCENT') {
          finalAmount = Math.floor(pkg.price * (100 - coupon.discountValue) / 100);
        } else {
          finalAmount = Math.max(0, pkg.price - coupon.discountValue);
        }
        appliedCouponId = coupon.id;
        await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      }
    }
    
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const order = await prisma.order.create({
      data: {
        userId,
        packageId,
        amount: finalAmount,
        orderId,
        status: 'PENDING',
        couponCode: couponCode || null,
      },
      include: { package: true },
    });
    
    res.json({ 
      order,
      clientKey: process.env.TOSS_CLIENT_KEY,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: '주문 생성 중 오류가 발생했습니다' });
  }
});

router.post('/retry', authMiddleware, async (req, res) => {
  const { orderId } = req.body;
  const userId = (req as any).user.id;
  
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: 'PENDING',
      },
      include: { package: true },
    });
    
    if (!order) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    }
    
    const newOrderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { orderId: newOrderId },
      include: { package: true },
    });
    
    res.json({ 
      order: updatedOrder, 
      clientKey: process.env.TOSS_CLIENT_KEY,
    });
  } catch (error) {
    console.error('Payment retry error:', error);
    res.status(500).json({ error: '결제 재시도 중 오류가 발생했습니다' });
  }
});

router.post('/confirm', authMiddleware, async (req, res) => {
  const { paymentKey, orderId, amount } = req.body;
  
  try {
    const order = await prisma.order.findUnique({ where: { orderId } });
    if (!order) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    if (order.amount !== amount) return res.status(400).json({ error: '금액이 일치하지 않습니다' });
    
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
      console.error('Toss confirm error:', tossData);
      return res.status(400).json({ error: tossData.message || '결제 승인 실패' });
    }
    
    const updatedOrder = await prisma.order.update({
      where: { orderId },
      data: {
        status: 'PAID',
        paymentKey,
        paidAt: new Date(),
      },
      include: { package: true, user: true },
    });

    if (updatedOrder.user?.phone) {
      sendPaymentNotification({
        to: updatedOrder.user.phone,
        customerName: updatedOrder.user.name || '고객',
        productName: updatedOrder.package.name,
        amount: updatedOrder.amount,
        link: 'https://weddingshop.cloud/dashboard',
      }).catch(err => console.error('결제 알림 발송 실패:', err));
    }
    
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Payment confirm error:', error);
    res.status(500).json({ error: '결제 승인 중 오류가 발생했습니다' });
  }
});

router.get('/orders', authMiddleware, async (req, res) => {
  const userId = (req as any).user.id;
  
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { package: true, wedding: true },
    orderBy: { createdAt: 'desc' },
  });
  
  res.json(orders);
});

router.delete('/orders/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = (req as any).user.id;
  
  try {
    const order = await prisma.order.findFirst({
      where: { id, userId, status: 'PENDING' },
    });
    
    if (!order) {
      return res.status(404).json({ error: '삭제할 수 있는 주문이 없습니다' });
    }
    
    await prisma.order.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Order delete error:', error);
    res.status(500).json({ error: '주문 삭제 실패' });
  }
});

export const paymentRouter = router;
