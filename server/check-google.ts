import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { provider: 'GOOGLE' }
  });
  console.log(JSON.stringify(users, null, 2));
}

main();
