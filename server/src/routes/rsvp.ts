import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { sendRsvpNotification } from '../utils/solapi.js';
import ExcelJS from 'exceljs';

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

router.get('/wedding/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const rsvps = await prisma.rsvp.findMany({
    where: { weddingId: id },
    orderBy: { createdAt: 'desc' },
  });
  
  res.json({ rsvps });
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
        rsvpNotification: true,
      },
    });

    if (wedding?.notificationEnabled && wedding?.rsvpNotification) {
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

router.get('/download/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { password } = req.query;

  try {
    const wedding = await prisma.wedding.findUnique({
      where: { slug },
      select: { id: true, groomName: true, brideName: true, groomPhone: true }
    });

    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    }

    const last4 = wedding.groomPhone?.slice(-4);
    if (password !== last4) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다' });
    }

    const rsvps = await prisma.rsvp.findMany({
      where: { weddingId: wedding.id },
      orderBy: { createdAt: 'desc' }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('참석현황');

    sheet.columns = [
      { header: '구분', key: 'side', width: 10 },
      { header: '이름', key: 'name', width: 15 },
      { header: '연락처', key: 'phone', width: 15 },
      { header: '참석여부', key: 'attending', width: 10 },
      { header: '참석인원', key: 'guestCount', width: 10 },
      { header: '식사인원', key: 'mealCount', width: 10 },
      { header: '메시지', key: 'message', width: 30 },
      { header: '등록일시', key: 'createdAt', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }
    };

    rsvps.forEach(rsvp => {
      sheet.addRow({
        side: rsvp.side === 'GROOM' ? '신랑측' : '신부측',
        name: rsvp.name,
        phone: rsvp.phone || '',
        attending: rsvp.attending ? '참석' : '불참',
        guestCount: rsvp.guestCount,
        mealCount: rsvp.mealCount,
        message: rsvp.message || '',
        createdAt: new Date(rsvp.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      });
    });

    const date = new Date().toISOString().split('T')[0];
    const filename = `rsvp_${date}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel Download Error:', error);
    res.status(500).json({ error: '다운로드 실패' });
  }
});

export const rsvpRouter = router;
