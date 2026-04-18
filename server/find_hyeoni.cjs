const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: '현이' } },
        { name: { contains: '현' } },
        { email: { contains: 'hyeon' } },
      ]
    },
    select: { id: true, email: true, name: true, createdAt: true }
  });
  console.log('매칭 유저:');
  users.forEach(u => console.log(`  ${u.id} | ${u.email} | ${u.name} | ${u.createdAt.toISOString()}`));
  console.log('\n총', users.length, '명');
  await prisma.$disconnect();
})();
