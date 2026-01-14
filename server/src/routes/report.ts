import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const reportToken = await prisma.reportToken.findUnique({
      where: { token },
      include: { wedding: true }
    });

    if (!reportToken) {
      return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });
    }

    if (new Date() > reportToken.expiresAt) {
      return res.status(410).json({ error: '리포트 링크가 만료되었습니다' });
    }

    const weddingId = reportToken.weddingId;

    const chats = await prisma.aiChat.findMany({
      where: { weddingId },
      orderBy: { createdAt: 'desc' }
    });

    const userChats = chats.filter(c => c.role === 'USER');
    const uniqueVisitors = new Set(chats.map(c => c.visitorId)).size;

    const questionCounts: Record<string, number> = {};
    userChats.forEach(chat => {
      const q = chat.content.slice(0, 50);
      questionCounts[q] = (questionCounts[q] || 0) + 1;
    });

    const topQuestions = Object.entries(questionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([question, count]) => ({ question, count }));

    const funnyKeywords = ['술', '비밀', '연애', '첫키스', '프로포즈', '몇번', '바람', '전여친', '전남친', '썸', 'ㅋㅋ', '진짜', '실화'];
    const funnyQuestions = userChats
      .filter(c => funnyKeywords.some(k => c.content.includes(k)))
      .slice(0, 10)
      .map(c => c.content);

    res.json({
      groomName: reportToken.wedding.groomName,
      brideName: reportToken.wedding.brideName,
      weddingDate: reportToken.wedding.weddingDate,
      totalChats: chats.length,
      uniqueVisitors,
      topQuestions,
      funnyQuestions,
      recentChats: chats.slice(0, 30),
      expiresAt: reportToken.expiresAt
    });
  } catch (error) {
    console.error('Report Error:', error);
    res.status(500).json({ error: '리포트 조회 실패' });
  }
});


router.post('/:token/review', async (req, res) => {
  try {
    const { token } = req.params;
    const { rating, review } = req.body;

    const reportToken = await prisma.reportToken.findUnique({
      where: { token },
      include: { wedding: true }
    });

    if (!reportToken) {
      return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });
    }

    await prisma.review.create({
      data: {
        weddingId: reportToken.weddingId,
        rating,
        content: review || '',
        source: 'AI_REPORT',
        isPublic: true
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Review Error:', error);
    res.status(500).json({ error: '후기 저장 실패' });
  }
});

router.post('/:token/send-email', async (req, res) => {
  try {
    const { token } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: '이메일 주소를 입력해주세요' });
    }

    const reportToken = await prisma.reportToken.findUnique({
      where: { token },
      include: { wedding: true }
    });

    if (!reportToken) {
      return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });
    }

    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const reportUrl = `https://weddingshop.cloud/report/${token}`;
    const { groomName, brideName } = reportToken.wedding;

    await transporter.sendMail({
      from: `"청첩장 작업실" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `💌 ${groomName}❤️${brideName}님의 AI 리포트가 도착했어요!`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">AI 리포트가 도착했어요! 💌</h1>
            <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">${groomName} ❤️ ${brideName}</p>
          </div>
          <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 16px 16px;">
            <p style="color: #374151; line-height: 1.6; margin-bottom: 24px;">
              하객들이 AI에게 몰래 물어본 질문들이 궁금하지 않으세요?<br>
              어떤 질문들이 오갔는지 확인해보세요!
            </p>
            <a href="${reportUrl}" style="display: inline-block; background: #1f2937; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
              리포트 확인하기 →
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
              * 이 링크는 24시간 동안 유효합니다.
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            청첩장 작업실 | weddingshop.cloud
          </p>
        </div>
      `
    });

    res.json({ success: true, message: '이메일이 발송되었습니다' });
  } catch (error) {
    console.error('Email Send Error:', error);
    res.status(500).json({ error: '이메일 발송 실패' });
  }
});

export default router;
