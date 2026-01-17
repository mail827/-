import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { sendSummaryNotification, sendReminderNotification, sendCustomNotification } from '../utils/solapi.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/summary/:weddingId', authMiddleware, async (req: Request, res: Response) => {
  const { weddingId } = req.params;

  try {
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { groomName: true, brideName: true, groomPhone: true, bridePhone: true, slug: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    }

    const rsvps = await prisma.rsvp.findMany({ where: { weddingId } });
    const stats = {
      totalGuests: rsvps.length,
      attending: rsvps.filter(r => r.attending).length,
      notAttending: rsvps.filter(r => !r.attending).length,
      totalPersons: rsvps.filter(r => r.attending).reduce((sum, r) => sum + r.guestCount, 0),
    };

    const weddingUrl = `https://weddingshop.cloud/w/${wedding.slug}/rsvp`;

    const recipients: string[] = [];
    if (wedding.groomPhone) recipients.push(wedding.groomPhone);
    if (wedding.bridePhone && wedding.bridePhone !== wedding.groomPhone) recipients.push(wedding.bridePhone);

    for (const to of recipients) {
      await sendSummaryNotification({
        to,
        groomName: wedding.groomName,
        brideName: wedding.brideName,
        weddingUrl,
        ...stats,
      });
    }

    res.json({ success: true, sentTo: recipients.length });
  } catch (error) {
    console.error('Summary notification error:', error);
    res.status(500).json({ error: '발송 실패' });
  }
});

router.post('/reminder/:weddingId', authMiddleware, async (req: Request, res: Response) => {
  const { weddingId } = req.params;

  try {
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { groomName: true, brideName: true, groomPhone: true, bridePhone: true, weddingDate: true, slug: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weddingDay = new Date(wedding.weddingDate);
    weddingDay.setHours(0, 0, 0, 0);
    const dDay = Math.ceil((weddingDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const weddingDateStr = weddingDay.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });

    const recipients: string[] = [];
    if (wedding.groomPhone) recipients.push(wedding.groomPhone);
    if (wedding.bridePhone && wedding.bridePhone !== wedding.groomPhone) recipients.push(wedding.bridePhone);

    for (const to of recipients) {
      await sendReminderNotification({
        to,
        groomName: wedding.groomName,
        brideName: wedding.brideName,
        dDay,
        weddingDate: weddingDateStr,
        weddingUrl: `https://weddingshop.cloud/w/${wedding.slug}`,
      });
    }

    res.json({ success: true, sentTo: recipients.length, dDay });
  } catch (error) {
    console.error('Reminder notification error:', error);
    res.status(500).json({ error: '발송 실패' });
  }
});

router.post('/custom/:weddingId', authMiddleware, async (req: Request, res: Response) => {
  const { weddingId } = req.params;
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: '메시지를 입력해주세요' });
  }

  try {
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { groomName: true, brideName: true, groomPhone: true, bridePhone: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    }

    const recipients: string[] = [];
    if (wedding.groomPhone) recipients.push(wedding.groomPhone);
    if (wedding.bridePhone && wedding.bridePhone !== wedding.groomPhone) recipients.push(wedding.bridePhone);

    for (const to of recipients) {
      await sendCustomNotification({
        to,
        groomName: wedding.groomName,
        brideName: wedding.brideName,
        message: message.trim(),
      });
    }

    res.json({ success: true, sentTo: recipients.length });
  } catch (error) {
    console.error('Custom notification error:', error);
    res.status(500).json({ error: '발송 실패' });
  }
});

export const notificationRouter = router;
