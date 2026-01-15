import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 모든 청첩장 목록
  const weddings = await prisma.wedding.findMany({
    select: { id: true, groomName: true, brideName: true, slug: true }
  });
  console.log('청첩장 목록:', weddings);
  
  // 각 청첩장별 AI 대화 개수
  for (const w of weddings) {
    const count = await prisma.aiChat.count({ where: { weddingId: w.id } });
    console.log(`${w.groomName} & ${w.brideName} (${w.slug}): ${count}개 대화`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
