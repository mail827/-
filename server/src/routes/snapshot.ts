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
    const { label } = req.body || {};

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      include: { galleries: true }
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    const version = generateVersion();
    const { userId, createdAt, updatedAt, snapshots, ...weddingData } = wedding as any;

    const snapshot = await prisma.weddingSnapshot.create({
      data: {
        weddingId,
        version,
        label: label || null,
        data: weddingData
      }
    });

    res.json({ version: snapshot.version, label: snapshot.label, sharedAt: snapshot.sharedAt });
  } catch (error) {
    console.error('Snapshot create error:', error);
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

router.get('/list/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;

    const snapshots = await prisma.weddingSnapshot.findMany({
      where: { weddingId },
      select: {
        id: true,
        version: true,
        label: true,
        viewCount: true,
        sharedAt: true,
        createdAt: true,
        wedding: { select: { slug: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(snapshots);
  } catch (error) {
    console.error('Snapshot list error:', error);
    res.status(500).json({ error: 'Failed to list snapshots' });
  }
});

router.patch('/:id/label', async (req, res) => {
  try {
    const { id } = req.params;
    const { label } = req.body;

    const snapshot = await prisma.weddingSnapshot.update({
      where: { id },
      data: { label: label || null }
    });

    res.json({ id: snapshot.id, label: snapshot.label });
  } catch (error) {
    console.error('Snapshot label update error:', error);
    res.status(500).json({ error: 'Failed to update label' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.weddingSnapshot.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Snapshot delete error:', error);
    res.status(500).json({ error: 'Failed to delete snapshot' });
  }
});

router.delete('/bulk/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const result = await prisma.weddingSnapshot.deleteMany({
      where: { weddingId }
    });
    res.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error('Snapshot bulk delete error:', error);
    res.status(500).json({ error: 'Failed to bulk delete snapshots' });
  }
});

router.post('/view/:version', async (req, res) => {
  try {
    const { version } = req.params;
    await prisma.weddingSnapshot.update({
      where: { version },
      data: { viewCount: { increment: 1 } }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: 'Snapshot not found' });
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

    await prisma.weddingSnapshot.update({
      where: { version },
      data: { viewCount: { increment: 1 } }
    });

    res.json(snapshot.data);
  } catch (error) {
    console.error('Snapshot get error:', error);
    res.status(500).json({ error: 'Failed to get snapshot' });
  }
});

export const snapshotRouter = router;
