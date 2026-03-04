import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const adminMiddleware = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다' });
  }
  next();
};

const getTossAuth = () => {
  const secretKey = process.env.TOSS_SECRET_KEY!;
  return `Basic ${Buffer.from(secretKey + ':').toString('base64')}`;
};

async function fetchTossTransactions(startDate: string, endDate: string) {
  const auth = getTossAuth();
  const url = `https://api.tosspayments.com/v1/transactions?startDate=${startDate}&endDate=${endDate}&limit=5000`;
  const res = await fetch(url, {
    headers: { Authorization: auth },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Toss API error: ${res.status}`);
  }
  return res.json();
}

async function fetchTossSettlements(startDate: string, endDate: string) {
  const auth = getTossAuth();
  let page = 1;
  let allSettlements: any[] = [];
  let hasMore = true;

  while (hasMore) {
    const url = `https://api.tosspayments.com/v1/settlements?startDate=${startDate}&endDate=${endDate}&page=${page}&size=5000`;
    const res = await fetch(url, {
      headers: { Authorization: auth },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Toss settlements error: ${res.status}`);
    }
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      allSettlements = allSettlements.concat(data);
      if (data.length < 5000) hasMore = false;
      else page++;
    } else {
      hasMore = false;
    }
  }
  return allSettlements;
}

async function fetchTossPayment(paymentKey: string) {
  const auth = getTossAuth();
  const res = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
    headers: { Authorization: auth },
  });
  if (!res.ok) return null;
  return res.json();
}

router.get('/reconcile', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate, endDate 필수' });
    }

    const start = `${startDate}T00:00:00`;
    const end = `${endDate}T23:59:59`;

    const [tossTransactions, dbOrders, dbSnapPacks] = await Promise.all([
      fetchTossTransactions(start, end),
      prisma.order.findMany({
        where: {
          createdAt: { gte: new Date(start), lte: new Date(end) },
        },
        include: { package: true, user: { select: { name: true, email: true } } },
      }),
      prisma.snapPack.findMany({
        where: {
          createdAt: { gte: new Date(start), lte: new Date(end) },
        },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    const dbOrderMap = new Map<string, any>();
    for (const o of dbOrders) {
      dbOrderMap.set(o.orderId, o);
      if (o.paymentKey) dbOrderMap.set(o.paymentKey, o);
    }

    const dbSnapMap = new Map<string, any>();
    for (const s of dbSnapPacks) {
      dbSnapMap.set(s.orderId, s);
      if (s.paymentKey) dbSnapMap.set(s.paymentKey, s);
    }

    const tossOnly: any[] = [];
    const mismatched: any[] = [];
    const matched: any[] = [];
    let tossTotalAmount = 0;

    const tossItems = Array.isArray(tossTransactions) ? tossTransactions : [];

    for (const tx of tossItems) {
      if (tx.status !== 'DONE') continue;
      tossTotalAmount += tx.balanceAmount || tx.amount || 0;

      const dbOrder = dbOrderMap.get(tx.orderId) || dbOrderMap.get(tx.paymentKey);
      const dbSnap = dbSnapMap.get(tx.orderId) || dbSnapMap.get(tx.paymentKey);
      const dbRecord = dbOrder || dbSnap;
      const recordType = dbOrder ? 'order' : dbSnap ? 'snapPack' : null;

      if (!dbRecord) {
        tossOnly.push({
          paymentKey: tx.paymentKey,
          orderId: tx.orderId,
          amount: tx.amount,
          method: tx.method,
          approvedAt: tx.approvedAt,
          orderName: tx.orderName,
          status: 'DB_MISSING',
        });
        continue;
      }

      if (dbRecord.status !== 'PAID') {
        mismatched.push({
          paymentKey: tx.paymentKey,
          orderId: tx.orderId,
          tossAmount: tx.amount,
          dbAmount: dbRecord.amount,
          dbStatus: dbRecord.status,
          tossStatus: tx.status,
          recordType,
          recordId: dbRecord.id,
          userName: dbRecord.user?.name || dbRecord.user?.email || '-',
          packageName: dbRecord.package?.name || dbRecord.tier || '-',
          approvedAt: tx.approvedAt,
        });
        continue;
      }

      matched.push({
        paymentKey: tx.paymentKey,
        orderId: tx.orderId,
        amount: tx.amount,
        recordType,
      });
    }

    const dbPaidOrders = dbOrders.filter(o => o.status === 'PAID');
    const dbPaidSnaps = dbSnapPacks.filter(s => s.status === 'PAID');
    const dbTotalAmount = dbPaidOrders.reduce((sum, o) => sum + o.amount, 0) + dbPaidSnaps.reduce((sum, s) => sum + s.amount, 0);

    const tossPaymentKeys = new Set(tossItems.filter(t => t.status === 'DONE').map((t: any) => t.paymentKey));
    const dbOnlyOrders = dbPaidOrders.filter(o => o.paymentKey && !tossPaymentKeys.has(o.paymentKey));
    const dbOnlySnaps = dbPaidSnaps.filter(s => s.paymentKey && !tossPaymentKeys.has(s.paymentKey));

    res.json({
      summary: {
        tossTotal: tossTotalAmount,
        dbTotal: dbTotalAmount,
        difference: tossTotalAmount - dbTotalAmount,
        tossCount: tossItems.filter((t: any) => t.status === 'DONE').length,
        dbPaidCount: dbPaidOrders.length + dbPaidSnaps.length,
        matchedCount: matched.length,
        mismatchedCount: mismatched.length,
        tossOnlyCount: tossOnly.length,
      },
      mismatched,
      tossOnly,
      dbOnly: [
        ...dbOnlyOrders.map(o => ({ type: 'order', id: o.id, orderId: o.orderId, amount: o.amount, paymentKey: o.paymentKey })),
        ...dbOnlySnaps.map(s => ({ type: 'snapPack', id: s.id, orderId: s.orderId, amount: s.amount, paymentKey: s.paymentKey })),
      ],
    });
  } catch (error: any) {
    console.error('Reconcile error:', error);
    res.status(500).json({ error: error.message || '정산 대사 실패' });
  }
});

router.post('/sync', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { paymentKey, recordType, recordId } = req.body;
    if (!paymentKey) return res.status(400).json({ error: 'paymentKey 필수' });

    const tossPayment = await fetchTossPayment(paymentKey);
    if (!tossPayment || tossPayment.status !== 'DONE') {
      return res.status(400).json({ error: '토스에서 결제 완료 상태가 아닙니다' });
    }

    if (recordType === 'order' && recordId) {
      const updated = await prisma.order.update({
        where: { id: recordId },
        data: {
          status: 'PAID',
          paymentKey,
          paidAt: new Date(tossPayment.approvedAt),
        },
        include: { package: true },
      });
      return res.json({ success: true, type: 'order', record: updated });
    }

    if (recordType === 'snapPack' && recordId) {
      const updated = await prisma.snapPack.update({
        where: { id: recordId },
        data: {
          status: 'PAID',
          paymentKey,
          paidAt: new Date(tossPayment.approvedAt),
        },
      });
      return res.json({ success: true, type: 'snapPack', record: updated });
    }

    const order = await prisma.order.findUnique({ where: { orderId: tossPayment.orderId } });
    if (order) {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentKey,
          paidAt: new Date(tossPayment.approvedAt),
        },
        include: { package: true },
      });
      return res.json({ success: true, type: 'order', record: updated });
    }

    const snap = await prisma.snapPack.findUnique({ where: { orderId: tossPayment.orderId } });
    if (snap) {
      const updated = await prisma.snapPack.update({
        where: { id: snap.id },
        data: {
          status: 'PAID',
          paymentKey,
          paidAt: new Date(tossPayment.approvedAt),
        },
      });
      return res.json({ success: true, type: 'snapPack', record: updated });
    }

    return res.status(404).json({ error: 'DB에서 해당 주문을 찾을 수 없습니다' });
  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message || '동기화 실패' });
  }
});

router.get('/toss-summary', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate, endDate 필수' });
    }
    const [settlements, transactions] = await Promise.all([
      fetchTossSettlements(startDate as string, endDate as string),
      fetchTossTransactions(startDate as string, endDate as string),
    ]);
    let totalAmount = 0;
    let totalFee = 0;
    let totalPayoutAmount = 0;
    let settledCount = 0;
    const byMethod: Record<string, { count: number; amount: number; fee: number }> = {};
    for (const s of settlements) {
      totalAmount += s.totalAmount || 0;
      const fee = (s.fees || []).reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
      totalFee += fee;
      totalPayoutAmount += s.payOutAmount || 0;
      settledCount++;
      const method = s.method || 'unknown';
      if (!byMethod[method]) byMethod[method] = { count: 0, amount: 0, fee: 0 };
      byMethod[method].count++;
      byMethod[method].amount += s.totalAmount || 0;
      byMethod[method].fee += fee;
    }
    let txTotalAmount = 0;
    let txTotalFee = 0;
    let txCount = 0;
    for (const tx of transactions) {
      if (tx.status !== 'DONE') continue;
      txTotalAmount += tx.amount || 0;
      txTotalFee += tx.fee?.total || 0;
      txCount++;
    }
    res.json({
      totalAmount,
      totalFee,
      totalPayoutAmount,
      settledCount,
      byMethod,
      settlements: settlements.slice(0, 100),
      tx: {
        totalAmount: txTotalAmount,
        totalFee: txTotalFee,
        count: txCount,
        netAmount: txTotalAmount - txTotalFee,
      },
    });
  } catch (error: any) {
    console.error('Toss summary error:', error);
    res.status(500).json({ error: error.message || '토스 정산 조회 실패' });
  }
});

export const settlementRouter = router;
