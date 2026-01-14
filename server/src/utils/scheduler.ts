import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendReportEmail } from './email.js';

const prisma = new PrismaClient();

export function startScheduler() {
  cron.schedule('0 10 * * *', async () => {
    console.log('[Scheduler] D+1 리포트 발송 체크 시작...');
    
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weddings = await prisma.wedding.findMany({
        where: {
          weddingDate: {
            gte: yesterday,
            lt: today
          },
          aiEnabled: true
        },
        include: {
          user: true
        }
      });

      console.log(`[Scheduler] ${weddings.length}개 결혼식 발견`);

      for (const wedding of weddings) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.reportToken.create({
          data: {
            weddingId: wedding.id,
            token,
            expiresAt
          }
        });

        const chats = await prisma.aiChat.findMany({
          where: { weddingId: wedding.id },
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
          .slice(0, 5)
          .map(([question, count]) => ({ question, count }));

        const funnyKeywords = ['술', '비밀', '연애', '첫키스', '프로포즈', '몇번', '바람', '전여친', '전남친', '썸', 'ㅋㅋ', '진짜', '실화'];
        const funnyQuestions = userChats
          .filter(c => funnyKeywords.some(k => c.content.includes(k)))
          .slice(0, 5)
          .map(c => c.content);

        const reportUrl = `${process.env.CLIENT_URL || 'https://weddingshop.cloud'}/report/${token}`;

        if (wedding.user.email) {
          await sendReportEmail(
            wedding.user.email,
            wedding.groomName,
            wedding.brideName,
            reportUrl,
            {
              totalChats: chats.length,
              uniqueVisitors,
              topQuestions,
              funnyQuestions
            }
          );
          console.log(`[Scheduler] 리포트 발송 완료: ${wedding.groomName} ♥ ${wedding.brideName}`);
        }
      }
    } catch (error) {
      console.error('[Scheduler] 리포트 발송 에러:', error);
    }
  });

  console.log('[Scheduler] D+1 리포트 스케줄러 시작됨 (매일 오전 10시)');
}
