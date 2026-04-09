import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const CLAUDE_KEY = process.env.CLAUDE_API_KEY || '';

const adminOnly = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' });
  next();
};

const ownerOnly = (req: any, res: any, next: any) => {
  const OWNERS = ['oicrcutie@gmail.com','gah7186@naver.com','lovegah2010@daum.net','gah7186@gmail.com'];
  if (!OWNERS.includes(req.user?.email)) return res.status(403).json({ error: 'owner only' });
  next();
};

function getWeekId(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  const day = d.getDay();
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (day === 0 ? 6 : day - 1));
  const jan1 = new Date(monday.getFullYear(), 0, 1);
  const diff = Math.floor((monday.getTime() - jan1.getTime()) / 86400000);
  const weekNum = Math.floor(diff / 7) + 1;
  return monday.getFullYear() + '-W' + String(weekNum).padStart(2, '0');
}

function getWeekDates(weekId: string): string[] {
  const [yearStr, wStr] = weekId.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  const jan1 = new Date(year, 0, 1);
  const jan1Day = jan1.getDay();
  const mondayOffset = jan1Day <= 1 ? 1 - jan1Day : 8 - jan1Day;
  const w1Monday = new Date(year, 0, 1 + mondayOffset);
  const monday = new Date(w1Monday.getTime() + (week - 1) * 7 * 86400000);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getTime() + i * 86400000);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

async function callClaude(prompt: string, maxTokens = 4000, useSearch = false): Promise<string> {
  if (!CLAUDE_KEY) throw new Error('CLAUDE_API_KEY not set');
  const body: any = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  };
  if (useSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${err}`);
  }
  const data = await res.json() as any;
  const textBlocks = (data.content || []).filter((b: any) => b.type === 'text');
  return textBlocks.map((b: any) => b.text).join('\n') || '';
}

type MarketingCard = { type: string; title: string; content: string };

function stripCodeFence(input: string): string {
  return String(input || '')
    .replace(/^\uFEFF/, '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
}

function extractJsonArrayBlock(input: string): string {
  const cleaned = stripCodeFence(input);
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
    throw new Error('no JSON array found');
  }
  return cleaned.substring(firstBracket, lastBracket + 1);
}

function normalizeInsightItems(rawParsed: any): MarketingCard[] {
  if (!Array.isArray(rawParsed)) throw new Error('response is not array');

  const limitByType = (type: string) => {
    if (type === 'shortform' || type === 'longform' || type === 'scenario') return 520;
    return 280;
  };

  return rawParsed
    .map((item: any) => ({
      type: typeof item?.type === 'string' ? item.type.trim() : '',
      title: typeof item?.title === 'string' ? item.title.trim() : '',
      content:
        typeof item?.content === 'string'
          ? item.content.trim()
          : Array.isArray(item?.content)
            ? item.content.map((v: any) => String(v)).join('\n').trim()
            : item?.content != null
              ? String(item.content).trim()
              : '',
    }))
    .map((item) => ({
      ...item,
      content: item.content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').slice(0, limitByType(item.type)),
    }))
    .filter((item) => item.type && item.title && item.content);
}

function fallbackCards(): MarketingCard[] {
  return [
    {
      type: 'error',
      title: '인사이트 생성 실패',
      content: '응답 형식이 깨졌습니다. 잠시 후 다시 시도해주세요.',
    },
  ];
}

function safeParseMarketingCards(raw: string): { cards: MarketingCard[]; parseFailed: boolean } {
  const fencedCleaned = stripCodeFence(raw);

  try {
    const cleaned = extractJsonArrayBlock(fencedCleaned);
    const parsed = normalizeInsightItems(JSON.parse(cleaned)).slice(0, 6);
    if (!parsed.length) throw new Error('empty insights after normalization');
    return { cards: parsed, parseFailed: false };
  } catch (error: any) {
    console.error('Marketing AI parse failed', {
      error: error?.message || String(error),
      rawPreview: String(raw || '').slice(0, 300),
      cleanedPreview: fencedCleaned.slice(0, 300),
      cleanedLength: fencedCleaned.length,
    });
    return { cards: fallbackCards(), parseFailed: true };
  }
}

router.get('/insights', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { weekId } = req.query;
    if (!weekId) return res.status(400).json({ error: 'weekId required' });
    const insights = await prisma.marketingInsight.findMany({
      where: { weekId: String(weekId) },
      orderBy: { createdAt: 'desc' },
    });
    res.json(insights);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.delete('/insights/:id', authMiddleware, adminOnly, ownerOnly, async (req, res) => {
  try {
    await prisma.marketingInsight.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.post('/generate', authMiddleware, adminOnly, ownerOnly, async (req, res) => {
  try {
    const weekId = getWeekId(0);
    const weekDates = getWeekDates(weekId);
    const startDate = weekDates[0];
    const endDate = weekDates[6];

    const [tasks, logs, recentOrders, recentSnaps, recentVideos, totalUsers, newUsers, topBuyers] = await Promise.all([
      prisma.teamTask.findMany({
        where: { weekId },
        orderBy: [{ assignee: 'asc' }, { sortOrder: 'asc' }],
      }),
      prisma.teamLog.findMany({
        where: { date: { in: weekDates } },
        orderBy: { date: 'asc' },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59Z') }, status: 'PAID' },
        select: { id: true, packageId: true, amount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.snapPack.findMany({
        where: { createdAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59Z') } },
        select: { id: true, tier: true, concept: true, status: true, amount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.preweddingVideo.findMany({
        where: { createdAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59Z') } },
        select: { id: true, status: true, mode: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59Z') } },
      }),
      prisma.snapPack.groupBy({
        by: ['userId'],
        _count: { id: true },
        _sum: { amount: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    const dakyumLogs = logs.filter(l => l.userName === '다겸');
    const gahyunLogs = logs.filter(l => l.userName === '가현');

    const dakyumTasks = tasks.filter((t: any) => t.assignee === 'dakyum');
    const gahyunTasks = tasks.filter((t: any) => t.assignee === 'gahyun');
    const dakyumDone = dakyumTasks.filter((t: any) => t.target ? t.done >= t.target : t.checked);
    const gahyunDone = gahyunTasks.filter((t: any) => t.target ? t.done >= t.target : t.checked);

    const topBuyerDetails = await Promise.all(
      topBuyers.filter((b: any) => b._count.id >= 2).map(async (b: any) => {
        const user = await prisma.user.findUnique({ where: { id: b.userId }, select: { name: true, email: true } });
        const packs = await prisma.snapPack.findMany({
          where: { userId: b.userId },
          select: { concept: true, tier: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });
        return {
          name: user?.name || user?.email?.split('@')[0] || 'unknown',
          packCount: b._count.id,
          totalSpent: b._sum.amount || 0,
          concepts: packs.map((p: any) => p.concept),
        };
      })
    );

    const orderSummary = {
      total: recentOrders.length,
      revenue: recentOrders.reduce((s, o) => s + o.amount, 0),
      byType: recentOrders.reduce((acc: any, o) => { acc[o.packageId] = (acc[o.packageId] || 0) + 1; return acc; }, {}),
    };

    const snapSummary = {
      total: recentSnaps.length,
      revenue: recentSnaps.reduce((s, o) => s + o.amount, 0),
      byTier: recentSnaps.reduce((acc: any, s) => { acc[s.tier] = (acc[s.tier] || 0) + 1; return acc; }, {}),
      topConcepts: recentSnaps.reduce((acc: any, s) => { acc[s.concept] = (acc[s.concept] || 0) + 1; return acc; }, {}),
    };

    const videoSummary = {
      total: recentVideos.length,
      byMode: recentVideos.reduce((acc: any, v) => { acc[v.mode] = (acc[v.mode] || 0) + 1; return acc; }, {}),
    };

    const serviceSpec = `
[청첩장 작업실 현재 서비스]
- Standard 9,900원: 27테마+종이청첩장+QR+RSVP+축의금+방명록+갤러리+배경음악+D-Day
- Premium 29,900원: Standard+AI컨시어지+AI웨딩스냅 47컨셉+하객포토부스
- AI스냅 단품: 3장 5,900 / 5장 9,900 / 10장 14,900 / 20장 24,900원
- 웨딩시네마: photo 29,000 / selfie 39,000원
- 웨딩포스터: 41컨셉
- 영구아카이브: 9,900원
- 웨딩포스터: AI생성 5,000원 / 사진업로드 3,000원 (41컨셉)
`;

    const prompt = `너는 '청첩장 작업실(weddingshop.cloud)'의 마케팅 전략 AI야.
브랜드명은 WEDDING ENGINE. stone 미니멀 톤. 2인 팀(다겸=개발자, 가현=마케팅/영상).
${serviceSpec}

[회원 현황]
- 총 회원: \${totalUsers}명 (이번 주 신규: \${newUsers}명)

[VIP/리피터 현황]
\${topBuyerDetails.length > 0 ? topBuyerDetails.map((b: any) => '- ' + b.name + ': ' + b.packCount + '팩 구매, 총 ' + b.totalSpent.toLocaleString() + '원, 컨셉: ' + b.concepts.join('/') ).join('\n') : '리피터 없음'}

[이번 주 실적 데이터 (${startDate} ~ ${endDate})]
- 청첩장 주문: ${orderSummary.total}건, 매출 ${orderSummary.revenue.toLocaleString()}원, 타입별: ${JSON.stringify(orderSummary.byType)}
- AI스냅: ${snapSummary.total}건, 매출 ${snapSummary.revenue.toLocaleString()}원, 티어별: ${JSON.stringify(snapSummary.byTier)}, 인기 컨셉: ${JSON.stringify(snapSummary.topConcepts)}
- 웨딩시네마: ${videoSummary.total}건, 모드별: ${JSON.stringify(videoSummary.byMode)}

[다겸 이번 주 완료 업무 (자동 수집)]
총 ${dakyumTasks.length}개 중 ${dakyumDone.length}개 완료 (${dakyumTasks.length > 0 ? Math.round(dakyumDone.length / dakyumTasks.length * 100) : 0}%)
${dakyumDone.map((t: any) => '- [' + t.category + '] ' + t.title).join('\n') || '완료 항목 없음'}

[다겸 수동 로그]
${dakyumLogs.map(l => `${l.date}: ${l.content}`).join('\n') || '없음'}

[가현 이번 주 완료 업무 (자동 수집)]
총 ${gahyunTasks.length}개 중 ${gahyunDone.length}개 완료 (${gahyunTasks.length > 0 ? Math.round(gahyunDone.length / gahyunTasks.length * 100) : 0}%)
${gahyunDone.map((t: any) => '- [' + t.category + '] ' + t.title).join('\n') || '완료 항목 없음'}

[가현 수동 로그]
${gahyunLogs.map(l => `${l.date}: ${l.content}`).join('\n') || '없음'}

반환 형식은 아래 JSON 배열 하나만 허용한다. 이 외 모든 텍스트는 금지.
[
  { "type": "trend", "title": "string", "content": "string" }
]

[출력 규칙 - 반드시 준수]
1) JSON 배열만 반환 (배열 앞뒤 설명문 금지)
2) 코드블록/백틱/마크다운 금지
3) 항목은 최대 6개
4) type 허용값: trend, painpoint, devlog, hook, shortform, longform, scenario
5) 각 title은 40자 이하
6) content 길이 제한:
   - trend, painpoint, devlog, hook: 280자 이하
   - shortform, longform, scenario: 520자 이하
7) 문자열 내부 줄바꿈은 반드시 escaped newline(\\n)으로만 표현
8) 잘 모르면 빈 배열 [] 반환

[콘텐츠 가이드]
- 이번 주 트렌드/빡침포인트/개발로그/콘텐츠 후킹 아이디어를 중심으로 요약
- 가현이를 위한 숏폼/롱폼/시나리오를 반드시 포함해서 최대 6개 카드 구성
- 숏폼/시나리오는 0-3초, 3-8초 형태의 타임라인 포함
- POV 스타일 후킹 문장 반드시 포함
- 광고 문구보다 실제 실행 가능한 문장 위주

[강제 포함 섹션]
- painpoint: 예비신부 부정 감정(추가금, 뻔한 디자인, 돈 아까움) 기반
- devlog: 다겸 작업을 '피땀눈물' 콘텐츠로 재가공
- shortform: 20~25초 숏폼 대본 1개 이상
- longform: 블로그/릴스 확장용 롱폼 기획 1개 이상
- scenario: 바로 촬영 가능한 장면별 시나리오 1개 이상`;

    const researchPrompt = `너는 웨딩 업계 리서치 전문가야. 아래 주제들을 web_search로 검색해서 최신 정보를 수집해줘.

1. 2026년 웨딩 업계 최신 트렌드 (AI웨딩, 디지털청첩장, 가격투명화 등)
2. 예비신부들의 불만/빡침포인트 (스드메 추가금, 비싼 식전영상, 뻔한 청첩장 등)
3. 웨딩 커뮤니티(더웨딩, 웨딩의여신, 네이버카페)에서 화제인 주제
4. AI 웨딩스냅, AI 청첩장 관련 최신 동향

각 주제별 구체적 수치, 사례, 커뮤니티 반응을 정리해줘. 자유로운 텍스트로.`;

    const research = await callClaude(researchPrompt, 3000, true);

    const finalPrompt = prompt + `

[AI 웹 리서치 결과]
${research}

위 리서치 결과와 내부 데이터를 종합하여 JSON 배열만 반환.
배열 외 텍스트를 절대 출력하지 마라.`;

    const raw = await callClaude(finalPrompt, 2600, false);
    const { cards: parsed, parseFailed } = safeParseMarketingCards(raw);

    await prisma.marketingInsight.deleteMany({ where: { weekId } });

    const saved = await Promise.all(
      parsed.map((item: any) =>
        prisma.marketingInsight.create({
          data: {
            weekId,
            type: item.type,
            title: item.title,
            content: item.content,
            metadata: {
              orderSummary,
              snapSummary,
              videoSummary,
              generatedAt: new Date().toISOString(),
            },
          },
        })
      )
    );

    res.json({ ok: true, count: saved.length, parseFailed });
  } catch (e: any) {
    console.error('marketing generate error:', e);
    res.status(500).json({ error: e.message || 'failed' });
  }
});

export { router as marketingRouter };
