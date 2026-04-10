import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { reconcileStuckAiSnaps } from '../server/src/services/aiSnapReconcile.ts';

dotenv.config({ path: 'server/.env' });
dotenv.config();

const prisma = new PrismaClient();

const limitArg = process.argv[2];
const limit = limitArg ? Number(limitArg) : 20;

async function main() {
  if (Number.isNaN(limit) || limit <= 0) {
    throw new Error('Usage: tsx scripts/reconcile-stuck-ai-snaps.ts [limit]');
  }

  const results = await reconcileStuckAiSnaps(prisma, limit, { reason: 'script-batch', force: false });
  const summary = {
    processed: results.length,
    done: results.filter((r) => r.status === 'done').length,
    failed: results.filter((r) => r.status === 'failed').length,
    stuck: results.filter((r) => r.status === 'stuck').length,
    processing: results.filter((r) => r.status === 'processing').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
  };

  console.log('[reconcile-stuck-ai-snaps] summary', JSON.stringify(summary));
}

main()
  .catch((error) => {
    console.error('[reconcile-stuck-ai-snaps] failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
