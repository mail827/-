import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
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
