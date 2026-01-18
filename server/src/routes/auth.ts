import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
  res.json(user);
});

router.post('/admin/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  
  if (!adminEmails.includes(email)) {
    return res.status(401).json({ error: '관리자 권한이 없습니다' });
  }
  
  let validPassword = false;
  if (email === 'oicrcutie@gmail.com' && password === process.env.ADMIN_PASSWORD_DAKYUM) {
    validPassword = true;
  } else if (email === 'gah7186@naver.com' && password === process.env.ADMIN_PASSWORD_GAHYUN) {
    validPassword = true;
  }
  
  if (!validPassword) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다' });
  }
  
  let user = await prisma.user.findFirst({ where: { email } });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: email === 'oicrcutie@gmail.com' ? '다겸' : '가현',
        provider: 'KAKAO',
        providerId: email,
        role: 'ADMIN',
      },
    });
  } else if (user.role !== 'ADMIN') {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });
  }
  
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  
  res.json({ token, user });
});

export const authRouter = router;

router.get('/user/inquiries', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  
  const inquiries = await prisma.inquiry.findMany({
    where: { email: user.email },
    orderBy: { createdAt: 'desc' },
  });
  
  res.json(inquiries);
});

router.get('/user/weddings', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  
  try {
    const weddings = await prisma.wedding.findMany({
      where: { userId: user.id },
      include: {
        order: {
          include: {
            package: { select: { name: true } }
          }
        },
        reviews: {
          where: { userId: user.id },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(weddings.map(w => ({
      id: w.id,
      groomName: w.groomName,
      brideName: w.brideName,
      weddingDate: w.weddingDate,
      packageName: w.order?.package?.name || null,
      canReview: new Date(w.weddingDate) < new Date(),
      hasReview: w.reviews.length > 0,
      review: w.reviews[0] || null
    })));
  } catch (error) {
    console.error('Get user weddings error:', error);
    res.status(500).json({ error: '청첩장 목록 조회 실패' });
  }
});

router.post('/user/review', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { weddingId, rating, content } = req.body;
  
  if (!weddingId || !rating) {
    return res.status(400).json({ error: '필수 항목을 입력해주세요' });
  }
  
  try {
    const wedding = await prisma.wedding.findFirst({
      where: { id: weddingId, userId: user.id }
    });
    
    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    }
    
    if (new Date(wedding.weddingDate) > new Date()) {
      return res.status(400).json({ error: '결혼식 이후에 리뷰를 작성할 수 있습니다' });
    }
    
    const existing = await prisma.review.findFirst({
      where: { weddingId, userId: user.id }
    });
    
    if (existing) {
      const updated = await prisma.review.update({
        where: { id: existing.id },
        data: { rating, content, isPublic: true }
      });
      return res.json(updated);
    }
    
    const review = await prisma.review.create({
      data: {
        weddingId,
        userId: user.id,
        rating,
        content,
        source: 'PURCHASE',
        isPublic: true
      }
    });
    
    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: '리뷰 작성 실패' });
  }
});
