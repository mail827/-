import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = Router();
const prisma = new PrismaClient();

const MOODS = ['anxious', 'angry', 'tired', 'sad', 'overwhelmed', 'okay'];

function isAdmin(user: any) {
  return user?.role === 'ADMIN';
}

function resolveMemberName(user: any) {
  const email = String(user?.email || '').toLowerCase();
  if (email.includes('gah') || email.includes('naver')) return '가현';
  return '다겸';
}

function buildSupportReply({
  mood,
  memoryNote,
  lastUserMessage,
}: {
  mood?: string;
  memoryNote?: string;
  lastUserMessage: string;
}) {
  const safety = /(자해|죽고 싶|죽고싶|해치고 싶|해치고싶|극단적)/.test(lastUserMessage);
  if (safety) {
    return '지금 많이 힘든 상태로 보여요. 혼자 버티지 말고 주변 신뢰 가능한 사람이나 지역 정신건강상담전화(1393) 같은 즉시 도움 채널에 바로 연결해 주세요.';
  }
  const moodLead: Record<string, string> = {
    anxious: '불안이 크게 올라온 하루였네요.',
    angry: '화가 쌓이면 몸이 먼저 지치죠.',
    tired: '지금은 에너지가 바닥난 느낌이네요.',
    sad: '마음이 가라앉는 날이었군요.',
    overwhelmed: '한 번에 너무 많은 걸 떠안은 상태예요.',
    okay: '지금 상태를 잘 관찰하고 계세요.',
  };
  const lead = moodLead[mood || 'okay'] || '오늘 감정을 솔직하게 꺼내주셔서 고마워요.';
  const memory = memoryNote ? `이전 맥락에서 ${memoryNote}가 반복되었어요. ` : '';
  return `${lead} ${memory}지금 메시지에서 핵심은 "${lastUserMessage.slice(0, 40)}"로 보여요. 오늘 할 수 있는 작은 행동 1가지는 10분 산책 또는 물 한 잔 마시고 호흡 6회입니다.`;
}

async function ensureSeedUsers() {
  await prisma.$executeRaw`INSERT INTO "CounselingUser" ("id","name","role","createdAt","updatedAt")
    SELECT 'gahyun','가현','member',NOW(),NOW()
    WHERE NOT EXISTS (SELECT 1 FROM "CounselingUser" WHERE "id"='gahyun')`;
  await prisma.$executeRaw`INSERT INTO "CounselingUser" ("id","name","role","createdAt","updatedAt")
    SELECT 'dakyum','다겸','member',NOW(),NOW()
    WHERE NOT EXISTS (SELECT 1 FROM "CounselingUser" WHERE "id"='dakyum')`;
}

router.get('/users', authMiddleware, async (req: any, res) => {
  try {
    await ensureSeedUsers();
    if (isAdmin(req.user)) {
      const rows = await prisma.$queryRaw<any[]>`SELECT * FROM "CounselingUser" ORDER BY "createdAt" ASC`;
      return res.json(rows);
    }
    const mine = resolveMemberName(req.user) === '가현' ? 'gahyun' : 'dakyum';
    const rows = await prisma.$queryRaw<any[]>`SELECT * FROM "CounselingUser" WHERE "id" = ${mine}`;
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

router.get('/sessions', authMiddleware, async (req: any, res) => {
  try {
    const requestedUserId = String(req.query.userId || '');
    const mine = resolveMemberName(req.user) === '가현' ? 'gahyun' : 'dakyum';
    const userId = isAdmin(req.user) ? (requestedUserId || mine) : mine;
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "CounselingSession" WHERE "userId" = ${userId} ORDER BY "updatedAt" DESC
    `;
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

router.post('/sessions', authMiddleware, async (req: any, res) => {
  try {
    const mine = resolveMemberName(req.user) === '가현' ? 'gahyun' : 'dakyum';
    const requestedUserId = String(req.body.userId || mine);
    const userId = isAdmin(req.user) ? requestedUserId : mine;
    const mood = MOODS.includes(req.body.mood) ? req.body.mood : 'okay';
    const title = req.body.title || '새 상담';
    await ensureSeedUsers();
    const id = `cs_${randomUUID()}`;
    await prisma.$executeRaw`
      INSERT INTO "CounselingSession" ("id","userId","title","mood","createdAt","updatedAt")
      VALUES (${id},${userId},${title},${mood},NOW(),NOW())
    `;
    const rows = await prisma.$queryRaw<any[]>`SELECT * FROM "CounselingSession" WHERE "id" = ${id}`;
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

router.get('/sessions/:id/messages', authMiddleware, async (req: any, res) => {
  try {
    const sessionRows = await prisma.$queryRaw<any[]>`SELECT * FROM "CounselingSession" WHERE "id" = ${req.params.id}`;
    const session = sessionRows[0];
    if (!session) return res.status(404).json({ error: 'not found' });
    const mine = resolveMemberName(req.user) === '가현' ? 'gahyun' : 'dakyum';
    if (!isAdmin(req.user) && session.userId !== mine) return res.status(403).json({ error: 'forbidden' });
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "CounselingMessage" WHERE "sessionId" = ${req.params.id} ORDER BY "createdAt" ASC
    `;
    res.json({ session, messages: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

router.post('/sessions/:id/messages', authMiddleware, async (req: any, res) => {
  try {
    const content = String(req.body.content || '').trim();
    if (!content) return res.status(400).json({ error: 'content required' });
    const sessionRows = await prisma.$queryRaw<any[]>`SELECT * FROM "CounselingSession" WHERE "id" = ${req.params.id}`;
    const session = sessionRows[0];
    if (!session) return res.status(404).json({ error: 'not found' });
    const mine = resolveMemberName(req.user) === '가현' ? 'gahyun' : 'dakyum';
    if (!isAdmin(req.user) && session.userId !== mine) return res.status(403).json({ error: 'forbidden' });

    await prisma.$executeRaw`
      INSERT INTO "CounselingMessage" ("id","sessionId","role","content","createdAt")
      VALUES (${`msg_u_${randomUUID()}`},${req.params.id},'user',${content},NOW())
    `;

    const recent = await prisma.$queryRaw<any[]>`
      SELECT "role","content" FROM "CounselingMessage"
      WHERE "sessionId" = ${req.params.id}
      ORDER BY "createdAt" DESC
      LIMIT 8
    `;
    const memoryNote = String(session.memoryNote || '');
    const assistantText = buildSupportReply({ mood: session.mood, memoryNote, lastUserMessage: content });

    await prisma.$executeRaw`
      INSERT INTO "CounselingMessage" ("id","sessionId","role","content","createdAt")
      VALUES (${`msg_a_${randomUUID()}`},${req.params.id},'assistant',${assistantText},NOW())
    `;
    const summary = content.length > 28 ? content.slice(0, 28) + '...' : content;
    await prisma.$executeRaw`
      UPDATE "CounselingSession" SET "summary" = ${summary}, "updatedAt" = NOW() WHERE "id" = ${req.params.id}
    `;
    res.json({ ok: true, reply: assistantText, recentCount: recent.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

router.patch('/sessions/:id/memory', authMiddleware, async (req: any, res) => {
  try {
    const sessionRows = await prisma.$queryRaw<any[]>`SELECT * FROM "CounselingSession" WHERE "id" = ${req.params.id}`;
    const session = sessionRows[0];
    if (!session) return res.status(404).json({ error: 'not found' });
    const mine = resolveMemberName(req.user) === '가현' ? 'gahyun' : 'dakyum';
    if (!isAdmin(req.user) && session.userId !== mine) return res.status(403).json({ error: 'forbidden' });
    const note = String(req.body.memoryNote || '').trim();
    await prisma.$executeRaw`
      UPDATE "CounselingSession" SET "memoryNote" = ${note}, "updatedAt" = NOW() WHERE "id" = ${req.params.id}
    `;
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

export { router as counselingRouter };
