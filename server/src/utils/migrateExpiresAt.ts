import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExpiresAt() {
  const weddings = await prisma.wedding.findMany({
    where: { expiresAt: null },
    include: { order: { include: { package: true } } }
  });
  
  console.log(`${weddings.length}개 청첩장 마이그레이션 시작...`);
  
  for (const wedding of weddings) {
    const durationDays = wedding.order?.package?.durationDays || 365;
    const createdAt = wedding.createdAt;
    const expiresAt = new Date(createdAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
    
    await prisma.wedding.update({
      where: { id: wedding.id },
      data: { expiresAt }
    });
    
    console.log(`- ${wedding.groomName}♥${wedding.brideName}: ${expiresAt.toLocaleDateString('ko-KR')} 만료`);
  }
  
  console.log('✅ 마이그레이션 완료!');
  process.exit(0);
}

migrateExpiresAt();
