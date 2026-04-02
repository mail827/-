const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({
  where: { email: 'jdms4860@naver.com' },
  include: {
    _count: { select: { weddings: true, orders: true } },
    snapPacks: { select: { totalSnaps: true, usedSnaps: true, status: true, amount: true } },
    orders: { select: { id: true, status: true, amount: true } },
  },
}).then(u => {
  if (!u) return console.log('NOT FOUND');
  console.log('email:', u.email);
  console.log('_count:', JSON.stringify(u._count));
  console.log('snapPacks:', JSON.stringify(u.snapPacks));
  console.log('orders:', JSON.stringify(u.orders));
  prisma.$disconnect();
}).catch(e => { console.error(e); prisma.$disconnect(); });
