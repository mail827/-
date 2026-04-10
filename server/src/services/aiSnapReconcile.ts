import { PrismaClient } from '@prisma/client';
import { uploadFromUrlToR2 } from '../utils/r2.js';

const FAL_API_KEY = process.env.FAL_API_KEY;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

const RECONCILE_BACKOFF_MS = 30_000;
const DEFAULT_STUCK_AFTER_POLLS = 30;

const isR2Url = (url?: string | null): boolean => {
  if (!url || !R2_PUBLIC_URL) return false;
  return url.startsWith(R2_PUBLIC_URL);
};

const plusMs = (ms: number): Date => new Date(Date.now() + ms);

const parseFalRequestId = (value?: string | null): string | null => {
  if (!value) return null;
  const match = value.match(/\/requests\/([^/]+)/);
  return match?.[1] || null;
};

const falFetch = async (url: string, opts?: RequestInit): Promise<any> => {
  if (!FAL_API_KEY) throw new Error('FAL_API_KEY is not set');
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${FAL_API_KEY}`,
      ...opts?.headers,
    },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`fal.ai error (${res.status}): ${text.slice(0, 300)}`);
  }
};

const getFalImageUrl = (result: any): string | null => {
  return result?.images?.[0]?.url || result?.output?.images?.[0]?.url || result?.image?.url || result?.output?.image?.url || null;
};

export interface ReconcileOptions {
  reason?: string;
  force?: boolean;
  stuckAfterPolls?: number;
}

export interface ReconcileResult {
  snapId: string;
  status: 'done' | 'processing' | 'failed' | 'stuck' | 'skipped';
  message: string;
}

const markFailed = async (prisma: PrismaClient, id: string, status: 'failed' | 'stuck', errorMessage: string): Promise<ReconcileResult> => {
  await prisma.aiSnap.update({
    where: { id },
    data: {
      status,
      errorMsg: errorMessage.slice(0, 500),
      errorMessage: errorMessage.slice(0, 500),
      providerStatus: status === 'failed' ? 'FAILED' : 'STUCK',
      reconcileAfter: null,
    },
  });
  return { snapId: id, status, message: errorMessage };
};

const uploadProviderImage = async (prisma: PrismaClient, snap: any): Promise<ReconcileResult> => {
  const providerResultUrl = snap.providerResultUrl as string;
  if (!providerResultUrl) {
    return markFailed(prisma, snap.id, 'failed', 'providerResultUrl is missing');
  }

  if (snap.resultUrl && isR2Url(snap.resultUrl)) {
    await prisma.aiSnap.update({
      where: { id: snap.id },
      data: {
        status: 'done',
        errorMessage: null,
        errorMsg: null,
        providerStatus: 'COMPLETED',
        reconcileAfter: null,
      },
    });
    return { snapId: snap.id, status: 'done', message: 'already uploaded to R2' };
  }

  const uploaded = await uploadFromUrlToR2(providerResultUrl, 'ai-snap/reconciled');
  await prisma.aiSnap.update({
    where: { id: snap.id },
    data: {
      status: 'done',
      resultUrl: uploaded.url,
      errorMessage: null,
      errorMsg: null,
      providerStatus: 'COMPLETED',
      reconcileAfter: null,
      statusUrl: null,
      responseUrl: null,
    },
  });
  return { snapId: snap.id, status: 'done', message: 'uploaded to R2' };
};

export async function reconcileAiSnapById(
  prisma: PrismaClient,
  snapId: string,
  options?: ReconcileOptions
): Promise<ReconcileResult> {
  const snap = await prisma.aiSnap.findUnique({ where: { id: snapId } });
  if (!snap) {
    return { snapId, status: 'skipped', message: 'snap not found' };
  }

  const stuckAfterPolls = options?.stuckAfterPolls ?? DEFAULT_STUCK_AFTER_POLLS;

  if (!options?.force && snap.status === 'done' && snap.resultUrl) {
    return { snapId: snap.id, status: 'skipped', message: 'already done' };
  }

  if (snap.providerResultUrl) {
    return uploadProviderImage(prisma, snap);
  }

  const statusUrl = snap.statusUrl as string | null;
  const responseUrl = snap.responseUrl as string | null;
  if (!statusUrl || !responseUrl) {
    return markFailed(prisma, snap.id, 'stuck', 'Missing statusUrl/responseUrl');
  }

  const nextPollCount = (snap.pollCount || 0) + 1;
  const requestId = snap.falRequestId || parseFalRequestId(statusUrl) || parseFalRequestId(responseUrl);

  await prisma.aiSnap.update({
    where: { id: snap.id },
    data: {
      falRequestId: requestId,
      pollCount: nextPollCount,
      lastPolledAt: new Date(),
      reconcileAfter: plusMs(RECONCILE_BACKOFF_MS),
      status: snap.status === 'uploading' ? 'uploading' : 'processing',
      errorMessage: null,
      errorMsg: null,
    },
  });

  let statusPayload: any;
  try {
    statusPayload = await falFetch(statusUrl);
  } catch (error) {
    const message = (error as Error).message.slice(0, 500);
    await prisma.aiSnap.update({
      where: { id: snap.id },
      data: {
        errorMessage: message,
        errorMsg: message,
        reconcileAfter: plusMs(RECONCILE_BACKOFF_MS),
      },
    });
    if (nextPollCount >= stuckAfterPolls) {
      return markFailed(prisma, snap.id, 'stuck', `poll retries exceeded: ${message}`);
    }
    return { snapId: snap.id, status: 'processing', message };
  }

  const providerStatus = (statusPayload?.status || 'UNKNOWN') as string;
  await prisma.aiSnap.update({
    where: { id: snap.id },
    data: {
      providerStatus,
      reconcileAfter: providerStatus === 'COMPLETED' ? plusMs(1_000) : plusMs(RECONCILE_BACKOFF_MS),
      status: providerStatus === 'IN_QUEUE' ? 'queued' : 'processing',
    },
  });

  if (providerStatus === 'FAILED' || providerStatus === 'CANCELLED') {
    return markFailed(prisma, snap.id, 'failed', statusPayload?.error || 'fal generation failed');
  }

  if (providerStatus !== 'COMPLETED') {
    if (nextPollCount >= stuckAfterPolls) {
      return markFailed(prisma, snap.id, 'stuck', `poll retries exceeded with status ${providerStatus}`);
    }
    return { snapId: snap.id, status: 'processing', message: providerStatus };
  }

  let responsePayload: any;
  try {
    responsePayload = await falFetch(responseUrl);
  } catch (error) {
    const message = (error as Error).message.slice(0, 500);
    if (nextPollCount >= stuckAfterPolls) {
      return markFailed(prisma, snap.id, 'stuck', `response fetch retries exceeded: ${message}`);
    }
    await prisma.aiSnap.update({
      where: { id: snap.id },
      data: {
        errorMessage: message,
        errorMsg: message,
        reconcileAfter: plusMs(RECONCILE_BACKOFF_MS),
      },
    });
    return { snapId: snap.id, status: 'processing', message };
  }

  if (responsePayload?.detail) {
    const detailMessage = typeof responsePayload.detail === 'string'
      ? responsePayload.detail
      : JSON.stringify(responsePayload.detail).slice(0, 500);
    if (nextPollCount >= stuckAfterPolls) {
      return markFailed(prisma, snap.id, 'stuck', `response detail error: ${detailMessage}`);
    }
    await prisma.aiSnap.update({
      where: { id: snap.id },
      data: {
        errorMessage: detailMessage,
        errorMsg: detailMessage,
        reconcileAfter: plusMs(RECONCILE_BACKOFF_MS),
      },
    });
    return { snapId: snap.id, status: 'processing', message: detailMessage };
  }

  const providerResultUrl = getFalImageUrl(responsePayload);
  if (!providerResultUrl) {
    return markFailed(prisma, snap.id, 'failed', 'No provider result image URL');
  }

  await prisma.aiSnap.update({
    where: { id: snap.id },
    data: {
      status: 'uploading',
      providerStatus: 'COMPLETED',
      providerResultUrl,
      reconcileAfter: plusMs(1_000),
    },
  });

  return uploadProviderImage(prisma, { ...snap, providerResultUrl });
}

export async function reconcileStuckAiSnaps(
  prisma: PrismaClient,
  limit = 20,
  options?: ReconcileOptions
): Promise<ReconcileResult[]> {
  const snaps = await prisma.aiSnap.findMany({
    where: {
      status: { in: ['queued', 'processing', 'uploading', 'stuck'] },
      OR: [
        { reconcileAfter: null },
        { reconcileAfter: { lte: new Date() } },
      ],
      createdAt: { lte: new Date(Date.now() - 60_000) },
    },
    orderBy: [
      { reconcileAfter: 'asc' },
      { createdAt: 'asc' },
    ],
    take: limit,
  });

  const results: ReconcileResult[] = [];
  for (const snap of snaps) {
    try {
      const result = await reconcileAiSnapById(prisma, snap.id, options);
      results.push(result);
      console.log('[ai-snap-reconcile]', result.snapId, result.status, '-', result.message);
    } catch (error) {
      const message = (error as Error).message.slice(0, 500);
      await markFailed(prisma, snap.id, 'stuck', message);
      results.push({ snapId: snap.id, status: 'stuck', message });
      console.error('[ai-snap-reconcile] error:', snap.id, message);
    }
  }

  return results;
}
