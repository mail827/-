import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { reconcileAiSnapById } from '../server/src/services/aiSnapReconcile.ts';

dotenv.config({ path: 'server/.env' });
dotenv.config();

const prisma = new PrismaClient();

const snapId = process.argv[2];

async function main() {
  if (!snapId) {
    throw new Error('Usage: tsx scripts/reconcile-ai-snap.ts <aiSnapId>');
  }

  const result = await reconcileAiSnapById(prisma, snapId, { reason: 'script-manual', force: true });
  console.log('[reconcile-ai-snap]', JSON.stringify(result));
}

main()
  .catch((error) => {
    console.error('[reconcile-ai-snap] failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
