import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

const generateCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

router.post('/invite/:weddingId', authMiddleware, async (req: Request, res: Response) => {
  const { weddingId } = req.params;
  const user = (req as any).user;

  try {
    const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
    if (!wedding) return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    if (wedding.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: '소유자만 초대할 수 있습니다' });
    }
    if (wedding.pairUserId) {
      return res.status(400).json({ error: '이미 공동 편집자가 연결되어 있습니다' });
    }

    await prisma.pairInvite.updateMany({
      where: { weddingId, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    });

    const invite = await prisma.pairInvite.create({
      data: {
        weddingId,
        code: generateCode(),
        invitedBy: user.id,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    res.json({ code: invite.code, expiresAt: invite.expiresAt });
  } catch (error) {
    console.error('Pair invite error:', error);
    res.status(500).json({ error: '초대 코드 생성 실패' });
  }
});

router.get('/status/:weddingId', authMiddleware, async (req: Request, res: Response) => {
  const { weddingId } = req.params;
  const user = (req as any).user;

  try {
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      include: {
        pairUser: { select: { id: true, name: true, email: true, profileImage: true } },
        user: { select: { id: true, name: true, email: true, profileImage: true } },
      },
    });
    if (!wedding) return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    if (wedding.userId !== user.id && wedding.pairUserId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: '접근 권한이 없습니다' });
    }

    const pendingInvite = await prisma.pairInvite.findFirst({
      where: { weddingId, status: 'PENDING', expiresAt: { gt: new Date() } },
    });

    res.json({
      paired: !!wedding.pairUserId,
      pairUser: wedding.pairUserId === user.id ? wedding.user : wedding.pairUser,
      isOwner: wedding.userId === user.id || user.role === 'ADMIN',
      pendingInvite: pendingInvite
        ? { code: pendingInvite.code, expiresAt: pendingInvite.expiresAt }
        : null,
    });
  } catch (error) {
    console.error('Pair status error:', error);
    res.status(500).json({ error: '상태 조회 실패' });
  }
});

router.get('/info/:code', async (req: Request, res: Response) => {
  const { code } = req.params;

  try {
    const invite = await prisma.pairInvite.findUnique({
      where: { code },
      include: {
        wedding: { select: { groomName: true, brideName: true, weddingDate: true, venue: true } },
      },
    });

    if (!invite) return res.status(404).json({ error: '유효하지 않은 초대 코드입니다' });
    if (invite.status !== 'PENDING') return res.status(400).json({ error: '이미 처리된 초대입니다' });
    if (invite.expiresAt < new Date()) return res.status(400).json({ error: '만료된 초대입니다' });

    res.json({
      groomName: invite.wedding.groomName,
      brideName: invite.wedding.brideName,
      weddingDate: invite.wedding.weddingDate,
      venue: invite.wedding.venue,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('Pair info error:', error);
    res.status(500).json({ error: '초대 정보 조회 실패' });
  }
});

router.post('/accept/:code', authMiddleware, async (req: Request, res: Response) => {
  const { code } = req.params;
  const user = (req as any).user;

  try {
    const invite = await prisma.pairInvite.findUnique({
      where: { code },
      include: { wedding: true },
    });

    if (!invite) return res.status(404).json({ error: '유효하지 않은 초대 코드입니다' });
    if (invite.status !== 'PENDING') return res.status(400).json({ error: '이미 처리된 초대입니다' });
    if (invite.expiresAt < new Date()) {
      await prisma.pairInvite.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } });
      return res.status(400).json({ error: '만료된 초대입니다' });
    }
    if (invite.invitedBy === user.id) {
      return res.status(400).json({ error: '본인이 보낸 초대는 수락할 수 없습니다' });
    }
    if (invite.wedding.pairUserId) {
      return res.status(400).json({ error: '이미 공동 편집자가 연결되어 있습니다' });
    }

    await prisma.$transaction([
      prisma.wedding.update({
        where: { id: invite.weddingId },
        data: { pairUserId: user.id },
      }),
      prisma.pairInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED', acceptedBy: user.id },
      }),
    ]);

    res.json({
      success: true,
      weddingId: invite.weddingId,
      slug: invite.wedding.slug,
      groomName: invite.wedding.groomName,
      brideName: invite.wedding.brideName,
    });
  } catch (error) {
    console.error('Pair accept error:', error);
    res.status(500).json({ error: '초대 수락 실패' });
  }
});

router.delete('/:weddingId', authMiddleware, async (req: Request, res: Response) => {
  const { weddingId } = req.params;
  const user = (req as any).user;

  try {
    const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
    if (!wedding) return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    if (wedding.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: '소유자만 해제할 수 있습니다' });
    }
    if (!wedding.pairUserId) {
      return res.status(400).json({ error: '연결된 공동 편집자가 없습니다' });
    }

    await prisma.wedding.update({
      where: { id: weddingId },
      data: { pairUserId: null },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Pair remove error:', error);
    res.status(500).json({ error: 'Pair 해제 실패' });
  }
});

router.delete('/invite/:weddingId', authMiddleware, async (req: Request, res: Response) => {
  const { weddingId } = req.params;
  const user = (req as any).user;

  try {
    const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
    if (!wedding) return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    if (wedding.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: '소유자만 취소할 수 있습니다' });
    }

    await prisma.pairInvite.updateMany({
      where: { weddingId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Pair invite cancel error:', error);
    res.status(500).json({ error: '초대 취소 실패' });
  }
});

export const pairRouter = router;
