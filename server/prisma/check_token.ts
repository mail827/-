import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Nick & Judy 청첩장의 리포트 토큰 확인
  const tokens = await prisma.reportToken.findMany({
    where: { weddingId: 'cmkalu6d500055wmu0l0pzjn8' },
    include: { wedding: { select: { groomName: true, brideName: true } } }
  });
  console.log('리포트 토큰:', JSON.stringify(tokens, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
