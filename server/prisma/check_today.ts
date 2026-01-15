import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 오늘 날짜 기준 대화 확인
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayChats = await prisma.aiChat.findMany({
    where: { createdAt: { gte: today } },
    orderBy: { createdAt: 'desc' },
    include: { wedding: { select: { groomName: true, brideName: true, slug: true } } }
  });
  
  console.log('오늘 대화 개수:', todayChats.length);
  console.log('오늘 대화:', JSON.stringify(todayChats, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
