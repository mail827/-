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

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      const wait = (attempt + 1) * 30000;
      console.log('Claude rate limit hit, waiting ' + wait + 'ms...');
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      const err = await res.text();
      throw new Error('Claude API error: ' + err);
    }
    const data = await res.json() as any;
    const textBlocks = (data.content || []).filter((b: any) => b.type === 'text');
    return textBlocks.map((b: any) => b.text).join('\n') || '';
  }
  throw new Error('Claude API rate limit exceeded after 3 retries');
}

type MarketingCard = { type: string; title: string; content: string; sourceProduct?: string };

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

  const normalizeType = (type: string) => {
    if (type === 'shortform') return 'shortform_script';
    if (type === 'pain') return 'painpoint';
    return type;
  };

  const limitByType = (type: string) => {
    if (type === 'shortform_script' || type === 'scenario') return 900;
    if (type === 'longform') return 700;
    return 280;
  };

  const toText = (v: any) => (v == null ? '' : String(v).trim());
  const asBeats = (v: any) => (Array.isArray(v) ? v.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 5) : []);
  const normalizeSourceProduct = (v: any): string => {
    const s = toText(v).toLowerCase();
    if (['ai_snap', 'wedding_cinema', 'wedding_poster', 'invitation', 'mixed'].includes(s)) return s;
    return 'mixed';
  };

  return rawParsed
    .map((item: any) => {
      const normalizedType = normalizeType(toText(item?.type));
      const hook = toText(item?.hook);
      const subHook = toText(item?.subHook);
      const beats = asBeats(item?.beats);
      const caption = toText(item?.caption);
      const pov = toText(item?.pov);
      const cta = toText(item?.cta);
      const toneTag = toText(item?.toneTag || item?.tone || item?.tag);
      const sourceProduct = normalizeSourceProduct(item?.sourceProduct);
      const hasScriptShape = hook || subHook || beats.length || caption || pov || cta || toneTag;

      const contentFromShape = [
        toneTag ? `[톤] ${toneTag}` : '',
        hook ? `[HOOK] ${hook}` : '',
        subHook ? `[SUB] ${subHook}` : '',
        beats.length ? `[BEATS]\n${beats.map((b, i) => `${i + 1}. ${b}`).join('\n')}` : '',
        caption ? `[CAPTION] ${caption}` : '',
        pov ? `[POV] ${pov}` : '',
        cta ? `[CTA] ${cta}` : '',
      ].filter(Boolean).join('\n');

      const plainContent =
        typeof item?.content === 'string'
          ? item.content.trim()
          : Array.isArray(item?.content)
            ? item.content.map((v: any) => String(v)).join('\n').trim()
            : item?.content != null
              ? String(item.content).trim()
              : '';

      return {
        type: normalizedType,
        title: toText(item?.title) || (hook ? hook.slice(0, 30) : ''),
        content: hasScriptShape ? contentFromShape : plainContent,
        sourceProduct,
      };
    })
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
    const parsed = normalizeInsightItems(JSON.parse(cleaned)).slice(0, 10);
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
    const weekId = (req.body?.weekId as string) || getWeekId(0);
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
- 총 회원: ${totalUsers}명 (이번 주 신규: ${newUsers}명)

[판매 우선순위 - 절대 고정]
1. AI스냅 (최우선)
2. 웨딩시네마
3. 웨딩포스터
4. 청첩장 (보조 연결만)

[VIP/리피터 현황]
${topBuyerDetails.length > 0 ? topBuyerDetails.map((b: any) => '- ' + b.name + ': ' + b.packCount + '팩 구매, 총 ' + b.totalSpent.toLocaleString() + '원, 컨셉: ' + b.concepts.join('/') ).join('\n') : '리피터 없음'}

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
  {
    "type": "shortform_script",
    "title": "string",
    "hook": "string",
    "subHook": "string",
    "beats": ["string", "string", "string"],
    "caption": "string",
    "pov": "string",
    "cta": "string",
    "toneTag": "분노유발형|비교형|POV형|은근약올림형|가성비반전형"
  }
]

[출력 규칙 - 반드시 준수]
1) JSON 배열만 반환 (배열 앞뒤 설명문 금지)
2) 코드블록/백틱/마크다운 금지
3) 항목은 정확히 10개
4) type 허용값: trend, painpoint, devlog, hook, longform, shortform_script, scenario
5) 각 title은 40자 이하
6) hook는 15자 이내
7) subHook는 22자 이내
8) beats는 3~5개, 각 beat는 한 줄 자막형 짧은 문장
9) caption/pov/cta는 각 1문장
10) 문자열 내부 줄바꿈은 escaped newline(\\n)만 허용
11) 금지어: 최적화, 솔루션, 니즈 충족, 트렌드에 부합, 혁신, 프리미엄 경험, 완벽한 선택, 고객 만족, 브랜드 가치
12) 금지 스타일: 블로그 글투, 보도자료 말투, 과도한 설명형 문장
8) 잘 모르면 빈 배열 [] 반환

[콘텐츠 가이드]
- 첫 1초 멈춤용 자막부터 시작 (설명 금지, 시비/비교 중심)
- 예비신부 감정 키워드 반드시 반영: 스드메 추가금 빡침, 가격 불신, 비교심리, 돈 아까움, 뻔한 청첩장 질림
- 최소 30% 비교형, 최소 30% POV형, 최소 30% 분노/억울함 기반
- 아래 카피 계열을 반드시 최소 1개씩 포함:
  - "이거 나만 빡치나" 계열
  - "아직도 그렇게 해?" 계열
  - "비싸게 했는데 안 예쁘면 더 빡침" 계열

[강제 포함 섹션]
- trend 1개
- painpoint 1개
- devlog 1개
- hook 2개
- longform 1개
- shortform_script 3개
- scenario 1개
- shortform_script는 20~25초 흐름
- scenario는 장면 전환이 보이게 beats 구성

[타입별 결과물 성격 - 반드시 분리]
1) trend (인사이트 카드)
   - content는 시장 변화 요약형 (AI스냅/웨딩시네마/웨딩포스터 우선)
   - 형식: [핵심변화] / [왜 뜨는지] / [이번주 기회]
   - 카피 톤 금지, 분석 톤으로 작성
   - sourceProduct 필수

2) painpoint (인사이트 카드)
   - content는 커뮤니티 불만 분석형 (스튜디오 추가금/식전영상 준비 귀찮음/사진 활용도 낮음 우선)
   - 형식: [빡침상황] / [돈 새는 지점] / [해결 실마리]
   - 분노 감정은 담되 숏폼 대본처럼 쓰지 말 것
   - sourceProduct 필수

3) devlog (인사이트 카드)
   - content는 제작 비하인드 분석형 (AI스냅 QC/얼굴 유지/시네마 품질/포스터 신상품 우선)
   - 형식: [이번주 삽질] / [배운점] / [콘텐츠화 포인트]
   - 개발 회고 톤 유지
   - sourceProduct 필수

4) hook (실행 카드)
   - content는 즉시 사용 가능한 후킹 문구 묶음 (청첩장보다 AI스냅/시네마/포스터 중심)
   - 형식: [HOOK 1] [HOOK 2] [HOOK 3] [HOOK 4] [HOOK 5]
   - 각 hook는 15자 이내 짧은 자막형
   - sourceProduct 필수

5) shortform_script (실행 카드)
   - hook/subHook/beats/caption/pov/cta/toneTag 구조 필수
   - 20~25초 릴스 타임라인 전개
   - 3개 중 최소 2개는 ai_snap, 1개는 wedding_cinema 권장
   - sourceProduct 필수

6) longform (구조화된 기획안 카드)
   - content는 장문 대본이 아니라 기획안 구조로 작성
   - 형식: [기획목표] / [타깃] / [목차 3개] / [핵심메시지] / [썸네일카피]
   - 주제는 예산형 웨딩/식전영상 대체재/AI 웨딩 후기형/스드메 추가금 피로감 중심
   - sourceProduct 필수

7) scenario (실행 카드)
   - hook/subHook/beats/caption/pov/cta/toneTag 구조 필수
   - beats는 장면 단위(컷 전환)로 작성
   - 예신 반응형 상황극으로 작성
   - sourceProduct 필수

[sourceProduct 규칙]
- 반드시 각 카드에 sourceProduct 포함
- 허용값: ai_snap | wedding_cinema | wedding_poster | invitation | mixed
- 우선 비중: ai_snap > wedding_cinema > wedding_poster > invitation`;

    const researchPrompt = `너는 웨딩 업계 리서치 전문가야. 아래 주제들을 web_search로 검색해서 최신 정보를 수집해줘.

1. 2026년 웨딩 업계 최신 트렌드 (AI웨딩, 디지털청첩장, 가격투명화 등)
2. 예비신부들의 불만/빡침포인트 (스드메 추가금, 비싼 식전영상, 뻔한 청첩장 등)
3. 웨딩 커뮤니티(더웨딩, 웨딩의여신, 네이버카페)에서 화제인 주제
4. AI 웨딩스냅, AI 청첩장 관련 최신 동향

각 주제별로 구체적 수치, 사례, 커뮤니티 반응을 정리해줘. 자유로운 텍스트로.`;

    const research = await callClaude(researchPrompt, 3000, true);
    await sleep(15000);

    const finalPrompt = prompt + `

[AI 웹 리서치 결과]
${research}

위 리서치 결과와 내부 데이터를 종합하여 JSON 배열만 반환.
배열 외 텍스트를 절대 출력하지 마라.`;

    const raw = await callClaude(finalPrompt, 3600, false);
    const { cards: parsed, parseFailed } = safeParseMarketingCards(raw);

    await prisma.marketingInsight.deleteMany({ where: { weekId } });

    const saved = await Promise.all(
      parsed.slice(0, 10).map((item: any) =>
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
              sourceProduct: item.sourceProduct || 'mixed',
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


function safeParseThreadCards(raw: string): { cards: any[]; parseFailed: boolean } {
  try {
    const cleaned = extractJsonArrayBlock(stripCodeFence(raw));
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || !parsed.length) throw new Error('empty');
    const valid = parsed.slice(0, 5).map((item: any) => ({
      category: ['rage','comparison','pov','story','event'].includes(item.category) ? item.category : 'story',
      title: String(item.title || '').slice(0, 60),
      content: String(item.content || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').slice(0, 800),
      heatLevel: [1,2,3].includes(item.heatLevel) ? item.heatLevel : 1,
      platform: ['threads','instagram','cafe','blog'].includes(item.platform) ? item.platform : 'threads',
    })).filter((item: any) => item.title && item.content);
    return { cards: valid, parseFailed: false };
  } catch (e: any) {
    console.error('Thread parse failed:', e?.message, raw?.slice(0, 200));
    return { cards: [], parseFailed: true };
  }
}


router.get('/threads', authMiddleware, adminOnly, async (req, res) => {
  try {
    const threads = await prisma.marketingInsight.findMany({
      where: { type: { in: ['thread_rage','thread_comparison','thread_pov','thread_story','thread_event'] } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json(threads.map((t: any) => {
      const meta = (t.metadata as any) || {};
      return {
        id: t.id,
        category: t.type.replace('thread_', ''),
        title: t.title,
        content: t.content,
        heatLevel: meta.heatLevel || 1,
        platform: meta.platform || 'threads',
        metadata: meta,
        createdAt: t.createdAt,
      };
    }));
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.delete('/threads/:id', authMiddleware, adminOnly, ownerOnly, async (req, res) => {
  try {
    await prisma.marketingInsight.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

router.post('/threads/generate', authMiddleware, adminOnly, ownerOnly, async (req, res) => {
  try {
    const topic = req.body?.topic || '';

    const serviceSpec = `[청첩장 작업실 실제 서비스 - 이것 외에는 존재하지 않음]

1. AI웨딩스냅 (디지털 다운로드)
- 셀카 2장 업로드 → AI가 47개 컨셉 중 선택한 스타일로 웨딩 화보 생성
- 컨셉 예시: summer_film(교복), lily_choucho(릴리슈슈 교복), nocturnal_animals(블랙 에디토리얼), santorini_linen(지중해 본화이트), age_of_innocence(순수의 시대 오페라), cathedral(성당), hanbok_wonsam(원삼), velvet_rouge, black_swan, castle_garden, cherry_blossom 등
- 가격: 3장 5,900원 / 5장 9,900원 / 10장 14,900원 / 20장 24,900원
- 결과물: PNG 디지털 파일, 사이트에서 바로 다운로드 (실물 배송 없음)

2. 웨딩시네마 (구 식전영상)
- 사진 3장 업로드해서 영상 만들기(photo 29,000원) / 셀카만으로 AI 글래머 스냅 먼저 생성 후 영상화(selfie 39,000원)
- Seedance 1.5 Pro I2V로 10장 샷 연결한 식전영상 MP4 제공
- 결과물: MP4 다운로드 (디지털)

3. 웨딩포스터 (디지털 다운로드)
- 41개 컨셉 중 선택
- AI 생성 5,000원 / 사진 업로드 편집 3,000원
- 결과물: 고해상도 이미지 파일 (실물 인쇄/배송 없음)

4. 모바일청첩장
- Standard 9,900원: 27개 테마 + 종이청첩장 PDF + QR카드 + RSVP + 축의금 + 방명록 + 갤러리 + 배경음악 + D-Day
- Premium 29,900원: Standard 전체 + AI컨시어지(웨딩이) + AI웨딩스냅 47컨셉 + 하객 AI 포토부스

5. 영구아카이브 9,900원 (결혼식 이후 청첩장을 영구 보관)

[현재 진행중인 실제 제휴 쿠폰 - 이것 외에는 없음]
- FOREVER20 (포에버웨딩 제휴, 20% 할인)
- ZOOMIN20 (웨딩줌인 제휴, 20% 할인)
- WEABLE30 (위에이블 제휴, 30% 할인)

[공식 채널]
- 사이트: weddingshop.cloud
- 인스타: @weddingstudiolab
- 카톡 채널: pf.kakao.com/_xkaQxon`;

    const FORBIDDEN_RULES = `[절대 창작 금지 - 위반 시 실패]
1. 없는 이벤트/챌린지/공모전 언급 금지 (예: "챌린지 참여", "공모전", "이벤트 응모", "인증샷 올리면")
2. 없는 배송/실물 언급 금지 (모든 제품은 디지털 다운로드)
3. 없는 할인/프로모션 언급 금지 (진행중인 쿠폰은 위 3개뿐)
4. 없는 컨셉명/테마명 창작 금지 ("School Romance", "Retro Tender" 같은 한글도 영어도 아닌 이름 창작 X)
5. 없는 증정품/사은품 언급 금지 ("할인권 증정", "무료 리터칭" 등)
6. 없는 기한/마감 언급 금지 (이달 말, 선착순 등)
7. "청첩장 작업실이 미친 짓을 했다" 같은 가짜 뉴스톤 금지
8. 실제 가격 외에 다른 가격 언급 금지
9. 언급 가능한 것만 언급: 위 [실제 서비스] 목록에 있는 것만

컨셉 이름을 사용할 때는 반드시 위 예시에서 나온 것만: summer_film, lily_choucho, nocturnal_animals, santorini_linen, age_of_innocence, cathedral, hanbok_wonsam, velvet_rouge, black_swan, castle_garden, cherry_blossom
가격을 언급할 때는 반드시 위에 명시된 금액만 사용`;

    const researchPrompt = `너는 웨딩 커뮤니티 리서치 전문가야. 아래 주제를 web_search로 검색해서 최신 반응을 수집해:
1. 스레드에서 예비신부들이 빡치는 웨딩 이슈
2. 인스타 웨딩 계정 중 바이럴 된 포스트 패턴
3. 웨딩카페(더웨딩/웨딩의여신)에서 논쟁중인 주제
4. AI 웨딩 관련 최신 반응
${topic ? '5. 추가 주제: ' + topic : ''}
각 주제별 구체적 사례와 반응 정리해줘.`;

    const research = await callClaude(researchPrompt, 2000, true);
    await sleep(15000);

    const generatePrompt = `너는 '청첩장 작업실(@weddingstudiolab)'의 스레드/인스타 바이럴 글 기획 AI야.
개발자 다겸이 직접 만든 2인 스타트업. 톤은 솔직하고 약간 시비조, MZ 말투.

${serviceSpec}

${FORBIDDEN_RULES}

[웹 리서치 결과 - 참고만 할 것, 여기 나온 제품/서비스를 우리 것이라고 착각하지 말 것]
${research}

[출력 규칙]
1) JSON 배열만 반환 (배열 앞뒤 텍스트 금지)
2) 코드블록/백틱 금지
3) 항목 정확히 5개
4) 각 항목 구조:
{
  "category": "rage|comparison|pov|story|event",
  "title": "글 제목 (30자 이하)",
  "content": "본문 (줄바꿈은 \\n, 200자~500자)",
  "heatLevel": 1~3,
  "platform": "threads|instagram|cafe"
}

[카테고리별 톤]
- rage: "이거 나만 빡치나?" 계열. 스드메 추가금/뻔한 청첩장/비싼 식전영상
- comparison: "아직도 그렇게 해?" 계열. 가격/퀄리티 비교
- pov: "POV: ~한 예신" 계열. 상황극 몰입형
- story: 개발자 비하인드/만든 과정/실패담. 진정성 있게
- event: 이벤트/할인/체험단. 액션 유도형

[필수 규칙]
- 5개 중 rage 1개, comparison 1개, pov 1개는 반드시 포함
- 나머지 2개는 story 또는 event
- heatLevel 3(FIRE)은 최대 1개
- 금지어: 혁신, 솔루션, 니즈, 프리미엄 경험, 완벽한 선택
- 블로그 글투/보도자료 말투 절대 금지
- 실제 복붙해서 바로 올릴 수 있는 완성된 글로 작성
- content에 해시태그 3~5개 포함 (마지막 줄에)
- 청첩장 작업실 검색 유도 CTA 자연스럽게 포함
${topic ? '\n[지정 주제 반영]\n' + topic + '를 반드시 1개 이상 글에 녹여줘' : ''}`;

    const raw = await callClaude(generatePrompt, 3000, false);
    const { cards, parseFailed } = safeParseThreadCards(raw);

    const saved = await Promise.all(
      cards.map((item: any) =>
        prisma.marketingInsight.create({
          data: {
            weekId: getWeekId(0),
            type: 'thread_' + item.category,
            title: item.title,
            content: item.content,
            metadata: {
              heatLevel: item.heatLevel || 1,
              platform: item.platform || 'threads',
              generatedAt: new Date().toISOString(),
            },
          },
        })
      )
    );

    res.json({ ok: true, count: saved.length, parseFailed });
  } catch (e: any) {
    console.error('thread generate error:', e);
    res.status(500).json({ error: e.message || 'failed' });
  }
});

export { router as marketingRouter };
