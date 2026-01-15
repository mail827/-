import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { sendRsvpNotification } from '../utils/solapi.js';

const router = Router();
const prisma = new PrismaClient();

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
      const weddingUrl = `https://weddingshop.cloud/w/${wedding.slug}`;
      
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
