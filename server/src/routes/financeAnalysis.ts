import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const adminOnly = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' });
  next();
};

const CATEGORY_MAP: Array<{ key: RegExp; category: string }> = [
  { key: /(월세|rent)/i, category: '월세' },
  { key: /(카드|card)/i, category: '카드' },
  { key: /(교통|taxi|지하철|버스)/i, category: '교통' },
  { key: /(사업|광고|마케팅|tool|saas)/i, category: '사업' },
  { key: /(식비|밥|커피|배달)/i, category: '식비' },
];

const parseAmount = (s: string) => {
  const n = Number(String(s).replace(/[,원\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

function parseFinanceInput(input: string) {
  const incomeMatches = [...input.matchAll(/(수입|매출|income)[^\d]*([\d,]+)\s*원?/gi)];
  const expenseMatches = [...input.matchAll(/([가-힣a-zA-Z]+)[^\d]{0,6}([\d,]+)\s*원?/g)];
  const income = incomeMatches.reduce((sum, m) => sum + parseAmount(m[2]), 0);
  const expenses: Array<{ category: string; amount: number }> = [];
  expenseMatches.forEach((m) => {
    const name = m[1];
    if (/(수입|매출|income)/i.test(name)) return;
    const amount = parseAmount(m[2]);
    if (!amount) return;
    const found = CATEGORY_MAP.find((c) => c.key.test(name));
    expenses.push({ category: found?.category || name, amount });
  });
  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
  const expenseTotal = Object.values(byCategory).reduce((a, b) => a + b, 0);
  return {
    income,
    expenses: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
    totalExpense: expenseTotal,
    net: income - expenseTotal,
  };
}

router.post('/parse', authMiddleware, adminOnly, async (req, res) => {
  try {
    const text = String(req.body.text || '');
    const month = String(req.body.month || new Date().toISOString().slice(0, 7));
    const parsed = parseFinanceInput(text);
    res.json({ month, ...parsed });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

router.post('/sessions', authMiddleware, adminOnly, async (req: any, res) => {
  try {
    const text = String(req.body.text || '');
    const month = String(req.body.month || new Date().toISOString().slice(0, 7));
    const parsed = parseFinanceInput(text);
    const id = 'fin_' + Date.now();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "FinanceSession" ("id","ownerUserId","month","rawInput","income","totalExpense","net","expensesJson","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,NOW(),NOW())`,
      id,
      req.user.id,
      month,
      text,
      parsed.income,
      parsed.totalExpense,
      parsed.net,
      JSON.stringify(parsed.expenses)
    );
    res.json({ id, month, ...parsed });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

router.get('/sessions', authMiddleware, adminOnly, async (_req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "FinanceSession" ORDER BY "updatedAt" DESC LIMIT 30`);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

export { router as financeAnalysisRouter };
