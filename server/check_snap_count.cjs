const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INTERNAL_EMAILS = ['hae051198@naver.com', 'oicrcutie@gmail.com'];

(async () => {
  const internalUserIds = (await prisma.user.findMany({
    where: { email: { in: INTERNAL_EMAILS } },
    select: { id: true }
  })).map(u => u.id);

  const totalAll = await prisma.aiSnap.count({
    where: { resultUrl: { not: null } }
  });
  const totalExternal = await prisma.aiSnap.count({
    where: {
      resultUrl: { not: null },
      userId: { notIn: internalUserIds }
    }
  });
  const totalUsersAll = await prisma.aiSnap.groupBy({
    by: ['userId'],
    where: { resultUrl: { not: null }, userId: { not: null } }
  }).then(r => r.length);
  const totalUsersExternal = await prisma.aiSnap.groupBy({
    by: ['userId'],
    where: { resultUrl: { not: null }, userId: { notIn: internalUserIds } }
  }).then(r => r.length);

  console.log('=== 실제 완성 스냅 통계 ===');
  console.log(`전체: ${totalAll}장 / ${totalUsersAll}명`);
  console.log(`내부 제외: ${totalExternal}장 / ${totalUsersExternal}명`);
  
  await prisma.$disconnect();
})();
