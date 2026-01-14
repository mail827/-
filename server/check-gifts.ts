import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const gifts = await prisma.gift.findMany({
    include: { fromUser: true, toUser: true, package: true }
  });
  console.log(JSON.stringify(gifts, null, 2));
}

main();
