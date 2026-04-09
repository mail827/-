import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

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
  await prisma.$executeRawUnsafe(`INSERT INTO "CounselingUser" ("id","name","role","createdAt","updatedAt")
    SELECT 'gahyun','가현','member',NOW(),NOW()
    WHERE NOT EXISTS (SELECT 1 FROM "CounselingUser" WHERE "id"='gahyun')`);
  await prisma.$executeRawUnsafe(`INSERT INTO "CounselingUser" ("id","name","role","createdAt","updatedAt")
    SELECT 'dakyum','다겸','member',NOW(),NOW()
    WHERE NOT EXISTS (SELECT 1 FROM "CounselingUser" WHERE "id"='dakyum')`);
}

router.get('/users', authMiddleware, async (req: any, res) => {
  try {
    await ensureSeedUsers();
    if (isAdmin(req.user)) {
      const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "CounselingUser" ORDER BY "createdAt" ASC`);
      return res.json(rows);
    }
    const mine = resolveMemberName(req.user) === '가현' ? 'gahyun' : 'dakyum';
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "CounselingUser" WHERE "id" = $1`, mine);
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
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "CounselingSession" WHERE "userId" = $1 ORDER BY "updatedAt" DESC`,
      userId
    );
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
    const id = 'cs_' + Date.now();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CounselingSession" ("id","userId","title","mood","createdAt","updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW())`,
      id,
      userId,
      title,
      mood
    );
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "CounselingSession" WHERE "id" = $1`, id);
    res.json((rows as any[])[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

router.get('/sessions/:id/messages', authMiddleware, async (req: any, res) => {
  try {
    const sessionRows = (await prisma.$queryRawUnsafe(`SELECT * FROM "CounselingSession" WHERE "id" = $1`, req.params.id)) as any[];
    const session = sessionRows[0];
    if (!session) return res.status(404).json({ error: 'not found' });
    const mine = resolveMemberName(req.user) === '가현' ? 'gahyun' : 'dakyum';
    if (!isAdmin(req.user) && session.userId !== mine) return res.status(403).json({ error: 'forbidden' });
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "CounselingMessage" WHERE "sessionId" = $1 ORDER BY "createdAt" ASC`,
      req.params.id
    );
    res.json({ session, messages: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

router.post('/sessions/:id/messages', authMiddleware, async (req: any, res) => {
  try {
    const content = String(req.body.content || '').trim();
    if (!content) return res.status(400).json({ error: 'content required' });
    const sessionRows = (await prisma.$queryRawUnsafe(`SELECT * FROM "CounselingSession" WHERE "id" = $1`, req.params.id)) as any[];
    const session = sessionRows[0];
    if (!session) return res.status(404).json({ error: 'not found' });
    const mine = resolveMemberName(req.user) === '가현' ? 'gahyun' : 'dakyum';
    if (!isAdmin(req.user) && session.userId !== mine) return res.status(403).json({ error: 'forbidden' });

    const userMsgId = 'msg_u_' + Date.now();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CounselingMessage" ("id","sessionId","role","content","createdAt") VALUES ($1,$2,'user',$3,NOW())`,
      userMsgId,
      req.params.id,
      content
    );

    const recent = (await prisma.$queryRawUnsafe(
      `SELECT "role","content" FROM "CounselingMessage" WHERE "sessionId" = $1 ORDER BY "createdAt" DESC LIMIT 8`,
      req.params.id
    )) as any[];
    const memoryNote = String(session.memoryNote || '');
    const assistantText = buildSupportReply({ mood: session.mood, memoryNote, lastUserMessage: content });

    const aiMsgId = 'msg_a_' + Date.now();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CounselingMessage" ("id","sessionId","role","content","createdAt") VALUES ($1,$2,'assistant',$3,NOW())`,
      aiMsgId,
      req.params.id,
      assistantText
    );
    const summary = content.length > 28 ? content.slice(0, 28) + '...' : content;
    await prisma.$executeRawUnsafe(
      `UPDATE "CounselingSession" SET "summary" = $2, "updatedAt" = NOW() WHERE "id" = $1`,
      req.params.id,
      summary
    );
    res.json({ ok: true, reply: assistantText, recentCount: recent.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

router.patch('/sessions/:id/memory', authMiddleware, async (req: any, res) => {
  try {
    const note = String(req.body.memoryNote || '').trim();
    await prisma.$executeRawUnsafe(
      `UPDATE "CounselingSession" SET "memoryNote" = $2, "updatedAt" = NOW() WHERE "id" = $1`,
      req.params.id,
      note
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

export { router as counselingRouter };
