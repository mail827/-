import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = Router();
const prisma = new PrismaClient();

const MOODS = ['anxious', 'angry', 'tired', 'sad', 'overwhelmed', 'okay'] as const;

function isAdmin(user: any) {
  return user?.role === 'ADMIN';
}

function resolveMemberName(user: any) {
  const email = String(user?.email || '').toLowerCase();
  if (email.includes('gah') || email.includes('naver')) return '가현';
  return '다겸';
}

function isSafetyRisk(text: string) {
  return /(자해|죽고 싶|죽고싶|해치고 싶|해치고싶|극단적)/.test(text);
}

const COUNSELING_FAIL_MESSAGE = '상담 응답 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.';
let cachedModelIds: string[] | null = null;
let cachedModelTs = 0;

async function callClaudeCounsel({
  mood,
  memoryNote,
  recentMessages,
  lastUserMessage,
}: {
  mood?: string;
  memoryNote?: string;
  recentMessages: Array<{ role: string; content: string }>;
  lastUserMessage: string;
}): Promise<{ text: string; model: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  const client = apiKey ? { apiKey } : null;
  if (!client) return null;

  if (isSafetyRisk(lastUserMessage)) {
    return {
      text: '지금 많이 힘든 상태로 보여요. 혼자 버티지 말고 주변 신뢰 가능한 사람이나 지역 정신건강상담전화(1393) 같은 즉시 도움 채널에 바로 연결해 주세요.',
      model: 'safety-guard',
    };
  }

  const system = [
    '당신은 한국어 상담 코치입니다.',
    '의료 진단/질환 단정/약물 조언은 절대 하지 마세요.',
    '공감 1~2문장 + 현실적인 작은 행동 제안 1문장으로 답하세요.',
    '너무 딱딱한 말투를 피하고 따뜻한 한국어로 답하세요.',
    `현재 mood: ${mood || 'okay'}`,
    `memoryNote: ${memoryNote || ''}`,
  ].join('\n');

  const transcript = recentMessages
    .slice(-8)
    .map((m) => `${m.role === 'assistant' ? '상담사' : '내담자'}: ${m.content}`)
    .join('\n');

  const userPrompt = [
    '아래 대화를 참고해서 최신 메시지에 이어서 답변해 주세요.',
    transcript || '(이전 대화 없음)',
    `최신 사용자 메시지: ${lastUserMessage}`,
  ].join('\n\n');

  const getModelCandidates = async () => {
    const now = Date.now();
    if (cachedModelIds && now - cachedModelTs < 60_000) return cachedModelIds;

    const fallback = [
      process.env.CLAUDE_MODEL,
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-haiku-20241022',
    ].filter((v, i, arr): v is string => !!v && arr.indexOf(v) === i);

    try {
      const modelRes = await fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey!,
          'anthropic-version': '2023-06-01',
        },
      });
      if (!modelRes.ok) {
        cachedModelIds = fallback;
        cachedModelTs = now;
        return fallback;
      }
      const modelJson: any = await modelRes.json();
      const ids = Array.isArray(modelJson?.data)
        ? modelJson.data.map((m: any) => String(m?.id || '')).filter(Boolean)
        : [];
      const prioritized = ids
        .filter((id: string) => /claude|sonnet|haiku|opus/i.test(id))
        .slice(0, 8);
      const merged = [...fallback, ...prioritized].filter((v, i, arr) => arr.indexOf(v) === i);
      cachedModelIds = merged;
      cachedModelTs = now;
      return merged;
    } catch {
      cachedModelIds = fallback;
      cachedModelTs = now;
      return fallback;
    }
  };

  const modelCandidates = await getModelCandidates();

  for (const model of modelCandidates) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 300,
          temperature: 0.5,
          system,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      const data: any = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error('[counseling] claude error', { model, status: response.status, body: data });
        continue;
      }

      const text = Array.isArray(data?.content)
        ? data.content
            .filter((block: any) => block?.type === 'text')
            .map((block: any) => String(block?.text || ''))
            .join('\n')
            .trim()
        : '';

      if (text) return { text, model };
    } catch (error: any) {
      console.error('[counseling] claude fetch failed', { model, error: error?.message || String(error) });
    }
  }

  return null;
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
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'failed' });
  }
});

router.get('/sessions', authMiddleware, async (req: any, res) => {
  try {
    const requestedUserId = String(req.query.userId || '');
    const mine = resolveMemberName(req.user) === '가현' ? 'gahyun' : 'dakyum';
    const userId = isAdmin(req.user) ? (requestedUserId || mine) : mine;

    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "CounselingSession"
      WHERE "userId" = ${userId}
      ORDER BY "updatedAt" DESC
    `;
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'failed' });
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
      VALUES (${id},${userId},${title},CAST(${mood} AS "CounselingMood"),NOW(),NOW())
    `;

    const rows = await prisma.$queryRaw<any[]>`SELECT * FROM "CounselingSession" WHERE "id" = ${id}`;
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'failed' });
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
      SELECT * FROM "CounselingMessage"
      WHERE "sessionId" = ${req.params.id}
      ORDER BY "createdAt" ASC
    `;

    res.json({ session, messages: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'failed' });
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

    const recent = await prisma.$queryRaw<any[]>`
      SELECT "role","content" FROM "CounselingMessage"
      WHERE "sessionId" = ${req.params.id}
      ORDER BY "createdAt" DESC
      LIMIT 8
    `;

    const memoryNote = String(session.memoryNote || '');
    const claudeResult = await callClaudeCounsel({
      mood: session.mood,
      memoryNote,
      recentMessages: [...recent].reverse(),
      lastUserMessage: content,
    });

    if (!claudeResult) {
      return res.status(502).json({
        error: COUNSELING_FAIL_MESSAGE,
        code: 'COUNSELING_MODEL_UNAVAILABLE',
      });
    }

    const assistantText = claudeResult.text;

    await prisma.$executeRaw`
      INSERT INTO "CounselingMessage" ("id","sessionId","role","content","createdAt")
      VALUES (${`msg_u_${randomUUID()}`},${req.params.id},'user',${content},NOW())
    `;

    await prisma.$executeRaw`
      INSERT INTO "CounselingMessage" ("id","sessionId","role","content","createdAt")
      VALUES (${`msg_a_${randomUUID()}`},${req.params.id},'assistant',${assistantText},NOW())
    `;

    const summary = assistantText.length > 48 ? `${assistantText.slice(0, 48)}...` : assistantText;
    await prisma.$executeRaw`
      UPDATE "CounselingSession"
      SET "summary" = ${summary}, "updatedAt" = NOW()
      WHERE "id" = ${req.params.id}
    `;

    res.json({ ok: true, reply: assistantText, provider: 'claude', model: claudeResult.model });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'failed' });
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
      UPDATE "CounselingSession"
      SET "memoryNote" = ${note}, "updatedAt" = NOW()
      WHERE "id" = ${req.params.id}
    `;

    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'failed' });
  }
});

export { router as counselingRouter };
