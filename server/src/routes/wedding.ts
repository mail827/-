import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const canAccess = (user: any, wedding: any) =>
  user.role === 'ADMIN' || wedding.userId === user.id || wedding.pairUserId === user.id;

const isOwner = (user: any, wedding: any) =>
  user.role === 'ADMIN' || wedding.userId === user.id;

router.get('/', authMiddleware, async (req, res) => {
  const user = (req as any).user;

  const where =
    user.role === 'ADMIN'
      ? {}
      : { OR: [{ userId: user.id }, { pairUserId: user.id }] };

  const weddings = await prisma.wedding.findMany({
    where,
    include: {
      _count: { select: { rsvps: true, guestbooks: true, galleries: true } },
      pairUser: { select: { id: true, name: true, email: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(weddings);
});

router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  const wedding = await prisma.wedding.findUnique({
    where: { id },
    include: { galleries: { orderBy: { order: 'asc' } } },
  });

  if (!wedding) return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
  if (!canAccess(user, wedding)) {
    return res.status(403).json({ error: '접근 권한이 없습니다' });
  }

  res.json(wedding);
});

router.post('/', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const { orderId: orderIdFromClient, giftId, ...data } = req.body;

  try {
    const slug = `${data.groomName}-${data.brideName}-${Date.now().toString(36)}`.toLowerCase();

    if (giftId) {
      const gift = await prisma.gift.findFirst({
        where: {
          id: giftId,
          toUserId: user.id,
          isRedeemed: false,
        },
        include: { package: true },
      });

      if (!gift) {
        return res.status(400).json({ error: '유효한 선물을 찾을 수 없습니다' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId: user.id,
            packageId: gift.packageId,
            amount: 0,
            status: 'PAID',
            orderId: `GIFT-${gift.code}-${Date.now()}`,
            paidAt: new Date(),
          },
        });

        const wedding = await tx.wedding.create({
          data: {
            ...data,
            userId: user.id,
            slug,
            weddingDate: new Date(data.weddingDate),
            orderId: order.id,
            aiEnabled: gift.package?.slug === 'premium' || gift.package?.slug === 'ai-reception' || gift.package?.slug === 'basic-video',
            expiresAt: new Date(new Date(data.weddingDate).getTime() + 90 * 24 * 60 * 60 * 1000),
          },
        });

        await tx.gift.update({
          where: { id: gift.id },
          data: { isRedeemed: true },
        });

        return wedding;
      });

      return res.status(201).json(result);
    }

    if (orderIdFromClient) {
      const order = await prisma.order.findFirst({
        include: { package: true },
        where: {
          OR: [{ id: orderIdFromClient }, { orderId: orderIdFromClient }],
          userId: user.id,
          status: 'PAID',
          wedding: null,
        },
      });

      if (!order) {
        return res.status(400).json({ error: '유효한 주문을 찾을 수 없습니다' });
      }

      const wedding = await prisma.wedding.create({
        data: {
          ...data,
          userId: user.id,
          slug,
          weddingDate: new Date(data.weddingDate),
          orderId: order.id,
          aiEnabled: order.package?.slug === 'premium' || order.package?.slug === 'ai-reception' || order.package?.slug === 'basic-video',
          expiresAt: new Date(new Date(data.weddingDate).getTime() + 90 * 24 * 60 * 60 * 1000),
        },
      });

      return res.status(201).json(wedding);
    }

    const giftCode = req.body.giftCode;
    if (giftCode) {
      const gift = await prisma.gift.findFirst({
        where: { code: giftCode, isRedeemed: true, toUserId: user.id },
        include: { package: true },
      });
      if (!gift) return res.status(400).json({ error: '유효하지 않은 선물 코드입니다' });
      const wedding = await prisma.wedding.create({
        data: {
          ...data, userId: user.id, slug,
          weddingDate: new Date(data.weddingDate),
          expiresAt: new Date(new Date(data.weddingDate).getTime() + 90 * 24 * 60 * 60 * 1000),
        },
      });
      return res.status(201).json(wedding);
    }

    if (user.role !== 'ADMIN') {
      return res.status(400).json({ error: '유효한 주문 또는 선물 코드가 필요합니다' });
    }

    const wedding = await prisma.wedding.create({
      data: {
        ...data,
        userId: user.id,
        slug,
        weddingDate: new Date(data.weddingDate),
        expiresAt: new Date(new Date(data.weddingDate).getTime() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json(wedding);
  } catch (error) {
    console.error('Wedding creation error:', error);
    res.status(500).json({ error: '청첩장 생성 중 오류가 발생했습니다' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  const data = req.body;

  const existing = await prisma.wedding.findUnique({
    where: { id },
    include: { order: { include: { package: true } } },
  });
  if (!existing) return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
  if (!canAccess(user, existing)) {
    return res.status(403).json({ error: '접근 권한이 없습니다' });
  }

  if (user.role !== 'ADMIN' && existing.order?.package) {
    const maxEdits = existing.order.package.maxEdits;
    if (maxEdits !== -1 && existing.editCount >= maxEdits) {
      return res.status(403).json({
        error: `수정 횟수(${maxEdits}회) 초과. 추가 수정은 문의해주세요.`,
        editCount: existing.editCount,
        maxEdits,
      });
    }
  }

  const {
    id: _id,
    createdAt,
    updatedAt,
    galleries,
    _count,
    userId,
    orderId,
    editCount,
    pairUserId,
    ...updateData
  } = data;

  try {
    const wedding = await prisma.wedding.update({
      where: { id },
      data: {
        ...updateData,
        weddingDate: updateData.weddingDate ? new Date(updateData.weddingDate) : undefined,
        expiresAt: updateData.expiresAt ? new Date(updateData.expiresAt) : undefined,
        editCount: user.role !== 'ADMIN' ? { increment: 1 } : undefined,
      },
    });

    res.json(wedding);
  } catch (error) {
    console.error('Wedding update error:', error);
    res.status(500).json({ error: '청첩장 수정 중 오류가 발생했습니다' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  const existing = await prisma.wedding.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
  if (!isOwner(user, existing)) {
    return res.status(403).json({ error: '소유자만 삭제할 수 있습니다' });
  }

  await prisma.wedding.delete({ where: { id } });
  res.json({ success: true });
});

router.post('/:id/gallery', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  const { mediaUrl, mediaType, caption } = req.body;

  const wedding = await prisma.wedding.findUnique({ where: { id } });
  if (!wedding) return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
  if (!canAccess(user, wedding)) {
    return res.status(403).json({ error: '접근 권한이 없습니다' });
  }

  const lastGallery = await prisma.gallery.findFirst({
    where: { weddingId: id },
    orderBy: { order: 'desc' },
  });

  const gallery = await prisma.gallery.create({
    data: {
      weddingId: id,
      mediaUrl,
      mediaType: mediaType || 'IMAGE',
      caption,
      order: (lastGallery?.order || 0) + 1,
    },
  });

  res.status(201).json(gallery);
});

router.delete('/:id/gallery/:galleryId', authMiddleware, async (req, res) => {
  const { id, galleryId } = req.params;
  const user = (req as any).user;

  const wedding = await prisma.wedding.findUnique({ where: { id } });
  if (!wedding) return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
  if (!canAccess(user, wedding)) {
    return res.status(403).json({ error: '접근 권한이 없습니다' });
  }

  await prisma.gallery.delete({ where: { id: galleryId } });
  res.json({ success: true });
});

export const weddingRouter = router;

router.get('/:id/rsvp', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const wedding = await prisma.wedding.findUnique({
      where: { id },
      select: { userId: true, pairUserId: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    }

    if (!canAccess(user, wedding)) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const rsvps = await prisma.rsvp.findMany({
      where: { weddingId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(rsvps);
  } catch (error) {
    console.error('RSVP fetch error:', error);
    res.status(500).json({ error: 'RSVP 조회 실패' });
  }
});

router.delete('/:slug/guestbook/:id', async (req, res) => {
  try {
    const { slug, id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: '비밀번호를 입력해주세요' });
    }

    const wedding = await prisma.wedding.findUnique({ where: { slug } });
    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    }

    const guestbook = await prisma.guestbook.findFirst({
      where: { id, weddingId: wedding.id },
    });

    if (!guestbook) {
      return res.status(404).json({ error: '방명록을 찾을 수 없습니다' });
    }

    if (guestbook.password !== password) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다' });
    }

    await prisma.guestbook.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Guestbook delete error:', error);
    res.status(500).json({ error: '방명록 삭제 실패' });
  }
});
