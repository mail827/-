import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateDurations() {
  await prisma.package.update({
    where: { slug: 'lite' },
    data: { durationDays: 30 }
  });
  
  await prisma.package.update({
    where: { slug: 'basic' },
    data: { durationDays: 90 }
  });
  
  await prisma.package.update({
    where: { slug: 'ai-reception' },
    data: { durationDays: 90 }
  });
  
  await prisma.package.update({
    where: { slug: 'basic-video' },
    data: { durationDays: 90 }
  });
  
  console.log('✅ 패키지 유효기간 업데이트 완료!');
  process.exit(0);
}

updateDurations();
