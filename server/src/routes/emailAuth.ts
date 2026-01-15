import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const router = Router();
const prisma = new PrismaClient();

const verificationCodes = new Map<string, { code: string; expiresAt: Date }>();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: '유효한 이메일을 입력해주세요' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    verificationCodes.set(email, { code, expiresAt });

    await transporter.sendMail({
      from: `"청첩장 작업실" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '[청첩장 작업실] 로그인 인증번호',
      html: `
        <div style="max-width: 400px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, sans-serif;">
          <h2 style="color: #1c1917; margin-bottom: 24px; font-size: 20px;">청첩장 작업실 로그인</h2>
          <p style="color: #57534e; margin-bottom: 32px; line-height: 1.6;">
            아래 인증번호를 입력해주세요.<br/>
            인증번호는 10분간 유효합니다.
          </p>
          <div style="background: #f5f5f4; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1c1917;">${code}</span>
          </div>
          <p style="color: #a8a29e; font-size: 12px;">
            본인이 요청하지 않았다면 이 메일을 무시해주세요.
          </p>
        </div>
      `,
    });

    res.json({ success: true, message: '인증번호가 발송되었습니다' });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ error: '인증번호 발송에 실패했습니다' });
  }
});

router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const stored = verificationCodes.get(email);
    
    if (!stored) {
      return res.status(400).json({ error: '인증번호를 먼저 요청해주세요' });
    }

    if (new Date() > stored.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: '인증번호가 만료되었습니다' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ error: '인증번호가 일치하지 않습니다' });
    }

    verificationCodes.delete(email);

    let user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          provider: 'EMAIL',
          providerId: email,
          role: 'CUSTOMER',
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: '인증에 실패했습니다' });
  }
});

export const emailAuthRouter = router;
