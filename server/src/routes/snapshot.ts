import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

function generateVersion() {
  return crypto.randomBytes(4).toString('hex');
}

router.post('/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      include: { galleries: true }
    });
    
    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }
    
    const version = generateVersion();
    const { id, userId, createdAt, updatedAt, snapshots, ...weddingData } = wedding as any;
    
    const snapshot = await prisma.weddingSnapshot.create({
      data: {
        weddingId,
        version,
        data: weddingData
      }
    });
    
    res.json({ version: snapshot.version, sharedAt: snapshot.sharedAt });
  } catch (error) {
    console.error('Snapshot create error:', error);
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

router.get('/:slug/:version', async (req, res) => {
  try {
    const { slug, version } = req.params;
    
    const snapshot = await prisma.weddingSnapshot.findUnique({
      where: { version },
      include: { wedding: { select: { slug: true } } }
    });
    
    if (!snapshot || snapshot.wedding.slug !== slug) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    
    res.json(snapshot.data);
  } catch (error) {
    console.error('Snapshot get error:', error);
    res.status(500).json({ error: 'Failed to get snapshot' });
  }
});

export const snapshotRouter = router;
