const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  console.log(`\n========== 금주 실적 (${weekAgo.toLocaleDateString('ko-KR')} ~ ${now.toLocaleDateString('ko-KR')}) ==========\n`);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: weekAgo } },
    include: { package: true, user: true },
    orderBy: { createdAt: 'desc' }
  });
  const paidOrders = orders.filter(o => o.status === 'PAID');
  console.log(`[청첩장 주문] 전체: ${orders.length}건 / 결제완료: ${paidOrders.length}건`);
  console.log(`  매출: ${paidOrders.reduce((s, o) => s + o.amount, 0).toLocaleString()}원`);
  paidOrders.forEach(o => {
    console.log(`  - ${o.package.name} | ${o.amount.toLocaleString()}원 | ${o.user.name || o.user.email} | ${o.couponCode || '-'} | ${o.createdAt.toLocaleDateString('ko-KR')}`);
  });

  console.log('');
  const packs = await prisma.snapPack.findMany({
    where: { createdAt: { gte: weekAgo } },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  const paidPacks = packs.filter(p => p.status === 'PAID');
  console.log(`[AI 스냅팩] 전체: ${packs.length}건 / 결제완료: ${paidPacks.length}건`);
  console.log(`  매출: ${paidPacks.reduce((s, p) => s + p.amount, 0).toLocaleString()}원`);
  paidPacks.forEach(p => {
    console.log(`  - ${p.tier}(${p.totalSnaps}장) | ${p.concept} | ${p.mode} | ${p.amount.toLocaleString()}원 | ${p.user.name || p.user.email} | ${p.couponCode || '-'} | ${p.createdAt.toLocaleDateString('ko-KR')}`);
  });

  console.log('');
  const freeSnaps = await prisma.aiSnap.findMany({
    where: { isFree: true, createdAt: { gte: weekAgo } },
    orderBy: { createdAt: 'desc' }
  });
  const freeCompleted = freeSnaps.filter(s => s.status === 'completed');
  console.log(`[무료 스냅] 전체: ${freeSnaps.length}건 / 완료: ${freeCompleted.length}건`);
  const conceptCount = {};
  freeSnaps.forEach(s => { conceptCount[s.concept] = (conceptCount[s.concept] || 0) + 1; });
  Object.entries(conceptCount).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    console.log(`  - ${c}: ${n}건`);
  });

  console.log('');
  const cinema = await prisma.preweddingVideo.findMany({
    where: { createdAt: { gte: weekAgo } },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`[웨딩시네마] 전체: ${cinema.length}건`);
  cinema.forEach(v => {
    console.log(`  - ${v.groomName}&${v.brideName} | ${v.mode} | ${v.templateId} | ${v.status} | ${v.user.name || v.user.email} | ${v.createdAt.toLocaleDateString('ko-KR')}`);
  });

  console.log('');
  const totalRevenue = paidOrders.reduce((s, o) => s + o.amount, 0) + paidPacks.reduce((s, p) => s + p.amount, 0);
  console.log(`========== 금주 총 매출: ${totalRevenue.toLocaleString()}원 ==========`);

  console.log('');
  const totalSnaps = await prisma.aiSnap.count({ where: { createdAt: { gte: weekAgo } } });
  const todaySnaps = await prisma.aiSnap.count({ where: { createdAt: { gte: todayStart } } });
  console.log(`[스냅 생성량] 금주: ${totalSnaps}건 / 오늘: ${todaySnaps}건`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
