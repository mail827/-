import { Router } from 'express';
import crypto from "crypto";
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/:id/ai-report', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const wedding = await prisma.wedding.findFirst({
      where: { id, userId }
    });

    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    }

    const chats = await prisma.aiChat.findMany({
      where: { weddingId: id },
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
      totalChats: chats.length,
      uniqueVisitors,
      topQuestions,
      funnyQuestions,
      recentChats: chats.slice(0, 50)
    });
  } catch (error) {
    console.error('AI Report Error:', error);
    res.status(500).json({ error: 'AI 리포트 조회 실패' });
  }
});

export default router;

router.post('/:id/generate-report-link', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const wedding = await prisma.wedding.findFirst({
      where: { id, userId }
    });

    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.reportToken.create({
      data: {
        weddingId: id,
        token,
        expiresAt
      }
    });

    res.json({ 
      token,
      url: `${process.env.CLIENT_URL || 'https://weddingshop.cloud'}/report/${token}`,
      expiresAt 
    });
  } catch (error) {
    console.error('Generate Report Link Error:', error);
    res.status(500).json({ error: '리포트 링크 생성 실패' });
  }
});
