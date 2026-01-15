import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.aiChat.count();
  console.log('총 AiChat 개수:', count);
  
  const recent = await prisma.aiChat.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { wedding: { select: { groomName: true, brideName: true } } }
  });
  console.log('최근 대화:', JSON.stringify(recent, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
