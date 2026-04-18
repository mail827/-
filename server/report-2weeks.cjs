require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function wake(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      await p.$queryRaw`SELECT 1`;
      console.log('[DB] awake');
      return;
    } catch (e) {
      console.log('[DB] wake retry', i + 1, '/', retries, '- waiting 5s...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  throw new Error('DB wake timeout');
}

const EXCLUDE_EMAILS = [
  'oicrcutie@gmail.com',
  'hae051198@naver.com',
  'gah7186@naver.com',
  'mail@weddingshop.cloud',
];

const START = new Date('2026-04-03T00:00:00+09:00');
const END = new Date('2026-04-17T23:59:59+09:00');

function won(n) { return (n || 0).toLocaleString('ko-KR') + '원'; }
function pct(a, b) { return b > 0 ? ((a / b) * 100).toFixed(1) + '%' : '0%'; }

(async () => {
  await wake();

  const excludedUsers = await p.user.findMany({
    where: { email: { in: EXCLUDE_EMAILS } },
    select: { id: true, email: true },
  });
  const excludedIds = excludedUsers.map(u => u.id);

  console.log('========================================');
  console.log('웨딩 엔진 2주 리포트');
  console.log('기간:', START.toISOString().slice(0, 10), '~', END.toISOString().slice(0, 10));
  console.log('제외 내부계정:', excludedUsers.map(u => u.email).join(', '));
  console.log('========================================\n');

  const users = await p.user.findMany({
    where: { createdAt: { gte: START, lte: END } },
    select: { id: true, email: true, createdAt: true, provider: true },
  });
  const externalUsers = users.filter(u => !excludedIds.includes(u.id));

  console.log('【 신규 가입자 】');
  console.log('총 신규 가입:', externalUsers.length, '명');
  const byProvider = {};
  externalUsers.forEach(u => {
    const s = u.provider || 'email';
    byProvider[s] = (byProvider[s] || 0) + 1;
  });
  Object.entries(byProvider).sort((a, b) => b[1] - a[1]).forEach(([src, cnt]) => {
    console.log('  -', src, ':', cnt, '명');
  });
  console.log('');

  const orders = await p.order.findMany({
    where: {
      status: 'PAID',
      paidAt: { gte: START, lte: END },
      userId: { notIn: excludedIds },
    },
  });

  const snaps = await p.snapPack.findMany({
    where: {
      status: 'PAID',
      paidAt: { gte: START, lte: END },
      userId: { notIn: excludedIds },
    },
  });

  const videos = await p.preweddingVideo.findMany({
    where: {
      paidAt: { gte: START, lte: END },
      userId: { notIn: excludedIds },
      amount: { gt: 0 },
    },
  });

  let posters = [];
  try {
    posters = await p.weddingPoster.findMany({
      where: {
        status: 'PAID',
        paidAt: { gte: START, lte: END },
        userId: { notIn: excludedIds },
      },
    });
  } catch (e) {
    console.log('(weddingPoster 모델 없음 - 스킵)');
  }

  const orderRev = orders.reduce((s, o) => s + (o.amount || 0), 0);
  const snapRev = snaps.reduce((s, o) => s + (o.amount || 0), 0);
  const videoRev = videos.reduce((s, o) => s + (o.amount || 0), 0);
  const posterRev = posters.reduce((s, o) => s + (o.amount || 0), 0);
  const totalRev = orderRev + snapRev + videoRev + posterRev;

  console.log('【 매출 요약 】');
  console.log('총 매출:', won(totalRev));
  console.log('  - 청첩장 패키지:', won(orderRev), '(' + orders.length + '건)');
  console.log('  - AI 스냅팩:', won(snapRev), '(' + snaps.length + '건)');
  console.log('  - 웨딩시네마:', won(videoRev), '(' + videos.length + '건)');
  console.log('  - 웨딩포스터:', won(posterRev), '(' + posters.length + '건)');
  console.log('총 주문:', orders.length + snaps.length + videos.length + posters.length, '건');
  console.log('');

  console.log('【 청첩장 패키지 세부 】');
  const byTier = {};
  const byTierCnt = {};
  orders.forEach(o => {
    const t = o.tier || 'UNKNOWN';
    byTier[t] = (byTier[t] || 0) + (o.amount || 0);
    byTierCnt[t] = (byTierCnt[t] || 0) + 1;
  });
  Object.entries(byTier).forEach(([t, amt]) => {
    console.log('  -', t, ':', byTierCnt[t], '건,', won(amt));
  });
  console.log('');

  console.log('【 AI 스냅팩 세부 】');
  const bySize = {};
  snaps.forEach(s => {
    const k = (s.count || 0) + '장';
    if (!bySize[k]) bySize[k] = { cnt: 0, rev: 0 };
    bySize[k].cnt++;
    bySize[k].rev += s.amount || 0;
  });
  Object.entries(bySize).sort((a, b) => b[1].rev - a[1].rev).forEach(([k, v]) => {
    console.log('  -', k, ':', v.cnt, '건,', won(v.rev));
  });
  console.log('');

  console.log('【 웨딩시네마 세부 】');
  const byMode = {};
  videos.forEach(v => {
    const k = v.mode || 'photo';
    if (!byMode[k]) byMode[k] = { cnt: 0, rev: 0 };
    byMode[k].cnt++;
    byMode[k].rev += v.amount || 0;
  });
  Object.entries(byMode).forEach(([k, v]) => {
    console.log('  -', k, ':', v.cnt, '건,', won(v.rev));
  });
  console.log('');

  const allPaid = [
    ...orders.map(o => ({ code: o.couponCode, amount: o.amount, type: '청첩장' })),
    ...snaps.map(s => ({ code: s.couponCode, amount: s.amount, type: '스냅' })),
    ...videos.map(v => ({ code: v.couponCode, amount: v.amount, type: '시네마' })),
    ...posters.map(p => ({ code: p.couponCode, amount: p.amount, type: '포스터' })),
  ];
  const byCoupon = {};
  allPaid.forEach(o => {
    if (!o.code) return;
    const c = o.code.toUpperCase();
    if (!byCoupon[c]) byCoupon[c] = { cnt: 0, rev: 0, items: {} };
    byCoupon[c].cnt++;
    byCoupon[c].rev += o.amount || 0;
    byCoupon[c].items[o.type] = (byCoupon[c].items[o.type] || 0) + 1;
  });

  console.log('【 제휴/쿠폰 코드별 매출 】');
  if (Object.keys(byCoupon).length === 0) {
    console.log('  (쿠폰 사용 없음)');
  } else {
    Object.entries(byCoupon).sort((a, b) => b[1].rev - a[1].rev).forEach(([code, v]) => {
      const items = Object.entries(v.items).map(([t, c]) => t + ' ' + c).join(', ');
      console.log('  -', code, ':', v.cnt, '건,', won(v.rev), '(' + items + ')');
    });
  }
  console.log('');

  const buyerIds = new Set([
    ...orders.map(o => o.userId),
    ...snaps.map(s => s.userId),
    ...videos.map(v => v.userId),
    ...posters.map(p => p.userId),
  ]);
  console.log('【 핵심 지표 】');
  console.log('구매 전환 유저:', buyerIds.size, '명');
  console.log('신규가입 중 구매:', externalUsers.filter(u => buyerIds.has(u.id)).length, '명');
  console.log('신규 전환율:', pct(externalUsers.filter(u => buyerIds.has(u.id)).length, externalUsers.length));
  console.log('객단가:', won(buyerIds.size > 0 ? Math.round(totalRev / buyerIds.size) : 0));
  console.log('');

  const byDate = {};
  [...orders, ...snaps, ...videos, ...posters].forEach(o => {
    const d = (o.paidAt || o.createdAt).toISOString().slice(0, 10);
    if (!byDate[d]) byDate[d] = { cnt: 0, rev: 0 };
    byDate[d].cnt++;
    byDate[d].rev += o.amount || 0;
  });
  console.log('【 일별 매출 】');
  Object.entries(byDate).sort().forEach(([d, v]) => {
    console.log('  ', d, ':', v.cnt, '건,', won(v.rev));
  });

  await p.$disconnect();
})().catch(async e => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
