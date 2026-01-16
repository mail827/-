import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/wedding/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const guestbooks = await prisma.guestbook.findMany({
    where: { weddingId: id },
    orderBy: { createdAt: 'desc' },
  });
  
  res.json({ guestbooks });
});

router.get('/:weddingId', async (req: Request, res: Response) => {
  const { weddingId } = req.params;
  
  const guestbooks = await prisma.guestbook.findMany({
    where: { weddingId, isHidden: false },
    orderBy: { createdAt: 'desc' },
  });
  
  res.json(guestbooks);
});

router.post('/', async (req: Request, res: Response) => {
  const { weddingId, name, password, message } = req.body;
  
  try {
    const guestbook = await prisma.guestbook.create({
      data: { weddingId, name, password, message },
    });
    
    res.status(201).json(guestbook);
  } catch (error) {
    console.error('Guestbook create error:', error);
    res.status(500).json({ error: '방명록 등록 실패' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;
  
  const guestbook = await prisma.guestbook.findUnique({ where: { id } });
  if (!guestbook) return res.status(404).json({ error: '방명록을 찾을 수 없습니다' });
  if (guestbook.password !== password) return res.status(403).json({ error: '비밀번호가 일치하지 않습니다' });
  
  await prisma.guestbook.delete({ where: { id } });
  res.json({ success: true });
});

router.patch('/:id/hide', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  
  await prisma.guestbook.update({
    where: { id },
    data: { isHidden: true },
  });
  
  res.json({ success: true });
});

export const guestbookRouter = router;
