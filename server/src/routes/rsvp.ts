import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { sendRsvpNotification } from '../utils/solapi.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/verify/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { password } = req.body;

  try {
    const wedding = await prisma.wedding.findUnique({
      where: { slug },
      select: { 
        id: true,
        groomName: true, 
        brideName: true,
        groomPhone: true,
        weddingDate: true,
      },
    });

    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    }

    const groomPhoneLast4 = wedding.groomPhone?.slice(-4) || '';
    if (password !== groomPhoneLast4) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다' });
    }

    const rsvps = await prisma.rsvp.findMany({
      where: { weddingId: wedding.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        phone: true,
        name: true,
        side: true,
        attending: true,
        guestCount: true,
        mealCount: true,
        message: true,
        createdAt: true,
      },
    });

    const stats = {
      total: rsvps.length,
      attending: rsvps.filter(r => r.attending).length,
      notAttending: rsvps.filter(r => !r.attending).length,
      totalGuests: rsvps.filter(r => r.attending).reduce((sum, r) => sum + r.guestCount, 0),
      totalMeals: rsvps.filter(r => r.attending).reduce((sum, r) => sum + r.mealCount, 0),
    };

    res.json({ 
      wedding: {
        groomName: wedding.groomName,
        brideName: wedding.brideName,
        weddingDate: wedding.weddingDate,
      },
      rsvps, 
      stats 
    });
  } catch (error) {
    console.error('RSVP verify error:', error);
    res.status(500).json({ error: 'RSVP 조회 실패' });
  }
});

router.get('/:weddingId', authMiddleware, async (req: Request, res: Response) => {
  const { weddingId } = req.params;
  
  const rsvps = await prisma.rsvp.findMany({
    where: { weddingId },
    orderBy: { createdAt: 'desc' },
  });
  
  const stats = {
    total: rsvps.length,
    attending: rsvps.filter(r => r.attending).length,
    notAttending: rsvps.filter(r => !r.attending).length,
    totalGuests: rsvps.filter(r => r.attending).reduce((sum, r) => sum + r.guestCount, 0),
    totalMeals: rsvps.filter(r => r.attending).reduce((sum, r) => sum + r.mealCount, 0),
  };
  
  res.json({ rsvps, stats });
});

router.post('/', async (req: Request, res: Response) => {
  const { weddingId, name, phone, side, attending, guestCount, mealCount, message } = req.body;
  
  try {
    const rsvp = await prisma.rsvp.create({
      data: {
        weddingId,
        name,
        phone,
        side: side || 'GROOM',
        attending,
        guestCount: guestCount || 1,
        mealCount: mealCount || 0,
        message,
      },
    });

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { 
        groomName: true, 
        brideName: true, 
        groomPhone: true,
        bridePhone: true,
        slug: true,
        notificationEnabled: true,
      },
    });

    if (wedding?.notificationEnabled) {
      const weddingUrl = `https://weddingshop.cloud/w/${wedding.slug}/rsvp`;
      
      if (wedding.groomPhone) {
        sendRsvpNotification({
          to: wedding.groomPhone,
          groomName: wedding.groomName,
          brideName: wedding.brideName,
          guestName: name,
          attending,
          guestCount: guestCount || 1,
          weddingUrl,
        });
      }
      
      if (wedding.bridePhone && wedding.bridePhone !== wedding.groomPhone) {
        sendRsvpNotification({
          to: wedding.bridePhone,
          groomName: wedding.groomName,
          brideName: wedding.brideName,
          guestName: name,
          attending,
          guestCount: guestCount || 1,
          weddingUrl,
        });
      }
    }
    
    res.status(201).json(rsvp);
  } catch (error) {
    console.error('RSVP create error:', error);
    res.status(500).json({ error: 'RSVP 등록 실패' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  
  await prisma.rsvp.delete({ where: { id } });
  res.json({ success: true });
});

export const rsvpRouter = router;
