const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HYEONI_USER_ID = 'cmm2oq1kl0000tkbfttjlto06';

(async () => {
  console.log('=== Step 1: 현이 stuck 스냅 조회 ===');
  const hyeoniStuck = await prisma.aiSnap.findMany({
    where: {
      snapPack: { userId: HYEONI_USER_ID },
      retryStatus: 'generating',
    },
    select: {
      id: true,
      snapPackId: true,
      concept: true,
      retryStatus: true,
      retryResultUrl: true,
      createdAt: true,
    },
  });

  console.log(`현이 stuck 개수: ${hyeoniStuck.length}`);
  hyeoniStuck.forEach(s => {
    console.log(`  id=${s.id} concept=${s.concept} packId=${s.snapPackId} createdAt=${s.createdAt.toISOString()}`);
  });

  console.log('\n=== Step 2: 전체 stuck 스캔 ===');
  const allStuck = await prisma.aiSnap.findMany({
    where: { retryStatus: 'generating' },
    select: {
      id: true,
      snapPackId: true,
      retryStatus: true,
      createdAt: true,
      snapPack: { select: { userId: true, user: { select: { email: true, name: true } } } },
    },
  });

  console.log(`전체 stuck 개수: ${allStuck.length}`);
  const byUser = {};
  allStuck.forEach(s => {
    if (!s.snapPack) return;
    const key = `${s.snapPack.user.name} (${s.snapPack.user.email})`;
    byUser[key] = (byUser[key] || 0) + 1;
  });
  Object.entries(byUser).forEach(([k, v]) => console.log(`  ${k}: ${v}개`));

  console.log('\n=== Step 3: 실행할 쿼리 미리보기 ===');
  console.log(`UPDATE AiSnap SET retryStatus=NULL WHERE retryStatus='generating'`);
  console.log(`대상: ${allStuck.length}개 row`);

  if (process.argv[2] !== '--execute') {
    console.log('\n실행하려면: node reset_stuck_snaps.cjs --execute');
    await prisma.$disconnect();
    return;
  }

  console.log('\n=== EXECUTE 모드 — 10초 뒤 실행, Ctrl+C로 취소 ===');
  await new Promise(r => setTimeout(r, 10000));

  const result = await prisma.aiSnap.updateMany({
    where: { retryStatus: 'generating' },
    data: { retryStatus: null },
  });

  console.log(`\n✓ 완료: ${result.count}개 해제`);
  await prisma.$disconnect();
})();
