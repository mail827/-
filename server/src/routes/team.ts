import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const adminMiddleware = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' });
  next();
};

const ownerOnly = (req: any, res: any, next: any) => {
  const OWNERS = ['oicrcutie@gmail.com','gah7186@naver.com','lovegah2010@daum.net','gah7186@gmail.com']; if (!OWNERS.includes(req.user?.email)) return res.status(403).json({ error: 'owner only' });
  next();
};

router.get('/tasks', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { weekId } = req.query;
    if (!weekId) return res.status(400).json({ error: 'weekId required' });
    const tasks = await prisma.teamTask.findMany({
      where: { weekId: String(weekId) },
      orderBy: [{ assignee: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.post('/tasks', authMiddleware, adminMiddleware, ownerOnly, async (req, res) => {
  try {
    const { weekId, assignee, category, title, target, sortOrder } = req.body;
    const task = await prisma.teamTask.create({
      data: { weekId, assignee, category, title, target: target || null, sortOrder: sortOrder || 0 },
    });
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.patch('/tasks/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { checked, done, title, category, target } = req.body;
    const data: any = {};
    if (typeof checked === 'boolean') data.checked = checked;
    if (typeof done === 'number') data.done = done;
    if (typeof title === 'string') data.title = title;
    if (typeof category === 'string') data.category = category;
    if (typeof target === 'number') data.target = target;
    const task = await prisma.teamTask.update({ where: { id }, data });
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.delete('/tasks/:id', authMiddleware, adminMiddleware, ownerOnly, async (req, res) => {
  try {
    await prisma.teamTask.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.post('/tasks/copy-week', authMiddleware, adminMiddleware, ownerOnly, async (req, res) => {
  try {
    const { fromWeekId, toWeekId } = req.body;
    if (!fromWeekId || !toWeekId) return res.status(400).json({ error: 'weekIds required' });
    const existing = await prisma.teamTask.findMany({ where: { weekId: toWeekId } });
    if (existing.length > 0) return res.status(400).json({ error: 'target week already has tasks' });
    const source = await prisma.teamTask.findMany({ where: { weekId: fromWeekId } });
    if (source.length === 0) return res.status(404).json({ error: 'no tasks in source week' });
    const created = await Promise.all(
      source.map((t) =>
        prisma.teamTask.create({
          data: { weekId: toWeekId, assignee: t.assignee, category: t.category, title: t.title, target: t.target, sortOrder: t.sortOrder },
        })
      )
    );
    res.json(created);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.get('/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { date, weekId } = req.query;
    if (weekId) {
      const logs = await prisma.teamLog.findMany({
        where: { date: { startsWith: '' } },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      });
      const year = parseInt(String(weekId).split('-W')[0]);
      const week = parseInt(String(weekId).split('-W')[1]);
      const jan1 = new Date(year, 0, 1);
      const startDay = new Date(jan1.getTime() + ((week - 1) * 7 - jan1.getDay() + 1) * 86400000);
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDay.getTime() + i * 86400000);
        dates.push(d.toISOString().split('T')[0]);
      }
      const filtered = logs.filter((l) => dates.includes(l.date));
      return res.json(filtered);
    }
    if (!date) return res.status(400).json({ error: 'date or weekId required' });
    const logList = await prisma.teamLog.findMany({
      where: { date: String(date) },
      orderBy: { createdAt: 'asc' },
    });
    res.json(logList);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.post('/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { date, content, note } = req.body;
    const user = (req as any).user;
    const userName = user.email === 'oicrcutie@gmail.com' ? '다겸' : '가현';
    const log = await prisma.teamLog.create({
      data: { userId: user.id, userName, date, content, note: note || null },
    });
    res.json(log);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.delete('/logs/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.teamLog.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.get('/notices', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const notices = await prisma.teamNotice.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
    res.json(notices);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.post('/notices', authMiddleware, adminMiddleware, ownerOnly, async (req, res) => {
  try {
    const { content } = req.body;
    const notice = await prisma.teamNotice.create({ data: { content } });
    res.json(notice);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.delete('/notices/:id', authMiddleware, adminMiddleware, ownerOnly, async (req, res) => {
  try {
    await prisma.teamNotice.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.get('/focus', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { weekId } = req.query;
    if (!weekId) return res.status(400).json({ error: 'weekId required' });
    const items = await prisma.teamFocus.findMany({
      where: { weekId: String(weekId) },
      orderBy: { priority: 'asc' },
    });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.post('/focus', authMiddleware, adminMiddleware, ownerOnly, async (req, res) => {
  try {
    const { weekId, priority, title, assignee, deadline } = req.body;
    const item = await prisma.teamFocus.create({
      data: { weekId, priority: priority || 0, title, assignee, deadline: deadline || null },
    });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.patch('/focus/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { done, title, assignee, deadline, priority } = req.body;
    const data: any = {};
    if (typeof done === 'boolean') data.done = done;
    if (typeof title === 'string') data.title = title;
    if (typeof assignee === 'string') data.assignee = assignee;
    if (typeof deadline === 'string') data.deadline = deadline;
    if (typeof priority === 'number') data.priority = priority;
    const item = await prisma.teamFocus.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.delete('/focus/:id', authMiddleware, adminMiddleware, ownerOnly, async (req, res) => {
  try {
    await prisma.teamFocus.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.get('/monthly/summary', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month required' });
    const m = String(month);
    const year = parseInt(m.split('-')[0]);
    const mon = parseInt(m.split('-')[1]);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 0);
    const startWeek = getWeekId(startDate);
    const endWeek = getWeekId(endDate);
    const allTasks = await prisma.teamTask.findMany({
      where: { weekId: { gte: startWeek, lte: endWeek } },
    });
    const calcRate = (list: any[]) => {
      if (list.length === 0) return 0;
      const done = list.filter((t: any) => (t.target ? t.done >= t.target : t.checked)).length;
      return Math.round((done / list.length) * 100);
    };
    const gahyunTasks = allTasks.filter((t) => t.assignee === 'gahyun');
    const dakyumTasks = allTasks.filter((t) => t.assignee === 'dakyum');
    const gahyunByCategory: Record<string, number> = {};
    const dakyumByCategory: Record<string, number> = {};
    const cats = ['sns', 'blog', 'viral', 'cs', 'dev', 'marketing', 'ai', 'biz'];
    cats.forEach((c) => {
      const gc = gahyunTasks.filter((t) => t.category === c);
      if (gc.length > 0) gahyunByCategory[c] = calcRate(gc);
      const dc = dakyumTasks.filter((t) => t.category === c);
      if (dc.length > 0) dakyumByCategory[c] = calcRate(dc);
    });
    const metrics = await prisma.teamMetric.findMany({ where: { month: m } });
    const reviews = await prisma.teamReview.findMany({ where: { month: m } });
    res.json({
      gahyunRate: calcRate(gahyunTasks),
      dakyumRate: calcRate(dakyumTasks),
      gahyunByCategory,
      dakyumByCategory,
      gahyunTotal: gahyunTasks.length,
      dakyumTotal: dakyumTasks.length,
      metrics: metrics.reduce((acc: any, m: any) => { acc[m.key] = m.value; return acc; }, {}),
      reviews: reviews.reduce((acc: any, r: any) => { acc[r.field] = r.content; return acc; }, {}),
    });
  } catch (e) {
    console.error('monthly summary error:', e);
    res.status(500).json({ error: 'failed' });
  }
});

router.post('/metrics', authMiddleware, adminMiddleware, ownerOnly, async (req, res) => {
  try {
    const { month, key, value } = req.body;
    const metric = await prisma.teamMetric.upsert({
      where: { month_key: { month, key } },
      update: { value },
      create: { month, key, value },
    });
    res.json(metric);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.post('/reviews', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { month, field, content } = req.body;
    const review = await prisma.teamReview.upsert({
      where: { month_field: { month, field } },
      update: { content },
      create: { month, field, content },
    });
    res.json(review);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

function getWeekId(d: Date): string {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000) + 1;
  const weekNum = Math.ceil((dayOfYear + jan1.getDay()) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export { router as teamRouter };

router.get('/expenses', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month required' });
    const m = String(month);
    const expenses = await prisma.teamExpense.findMany({
      where: { date: { startsWith: m } },
      orderBy: { date: 'desc' },
    });
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    res.json({ expenses, total, byCategory });
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.post('/expenses', authMiddleware, adminMiddleware, ownerOnly, async (req, res) => {
  try {
    const { date, title, category, amount, memo } = req.body;
    const expense = await prisma.teamExpense.create({
      data: { date, title, category, amount, memo: memo || null },
    });
    res.json(expense);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.delete('/expenses/:id', authMiddleware, adminMiddleware, ownerOnly, async (req, res) => {
  try {
    await prisma.teamExpense.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});
