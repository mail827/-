import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendReminderNotification } from './solapi.js';

const prisma = new PrismaClient();

function getDDay(weddingDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const wedding = new Date(weddingDate);
  wedding.setHours(0, 0, 0, 0);
  const diff = wedding.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function sendReminders() {
  console.log('[Scheduler] 리마인더 체크 시작:', new Date().toISOString());
  
  try {
    const weddings = await prisma.wedding.findMany({
      where: {
        isPublished: true,
        isArchived: false,
        notificationEnabled: true,
        weddingDate: { gte: new Date() }
      }
    });

    for (const wedding of weddings) {
      const dDay = getDDay(wedding.weddingDate);
      const sentDays = wedding.reminderSentDays ? wedding.reminderSentDays.split(',') : [];
      const dayKey = `d${dDay}`;
      
      if (sentDays.includes(dayKey)) continue;
      
      let shouldSend = false;
      if (dDay === 7 && wedding.reminderD7) shouldSend = true;
      if (dDay === 3 && wedding.reminderD3) shouldSend = true;
      if (dDay === 1 && wedding.reminderD1) shouldSend = true;
      
      if (!shouldSend) continue;
      
      const weddingUrl = `https://weddingshop.cloud/w/${wedding.slug}`;
      const weddingDateStr = formatDate(wedding.weddingDate);
      
      const phones = [wedding.groomPhone, wedding.bridePhone].filter(Boolean) as string[];
      
      for (const phone of phones) {
        await sendReminderNotification({
          to: phone,
          groomName: wedding.groomName,
          brideName: wedding.brideName,
          dDay,
          weddingDate: weddingDateStr,
          weddingUrl
        });
      }
      
      sentDays.push(dayKey);
      await prisma.wedding.update({
        where: { id: wedding.id },
        data: { reminderSentDays: sentDays.join(',') }
      });
      
      console.log(`[Scheduler] D-${dDay} 리마인더 발송 완료: ${wedding.groomName}♥${wedding.brideName}`);
    }
    
    console.log('[Scheduler] 리마인더 체크 완료');
  } catch (error) {
    console.error('[Scheduler] 리마인더 발송 에러:', error);
  }
}

export function startScheduler() {
  cron.schedule('0 9 * * *', sendReminders, {
    timezone: 'Asia/Seoul'
  });
  console.log('[Scheduler] D-Day 리마인더 스케줄러 시작 (매일 09:00 KST)');
}

export { sendReminders };
