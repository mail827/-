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

아래 5가지를 JSON 배열로 반환해. 반드시 순수 JSON만 반환. 백틱, 설명, 서론 절대 없이 [ 로 시작해서 ] 로 끝내라.

[
  {
    "type": "trend",
    "title": "이번 주 웨딩 업계 핫이슈",
    "content": "최근 웨딩 업계에서 화제인 트렌드 3-4가지. 각 트렌드가 '청첩장 작업실'에 어떤 기회인지 연결. 예비신부들이 실제 커뮤니티에서 관심 갖는 것들 위주로."
  },
  {
    "type": "pain",
    "title": "예비신부 빡침 포인트",
    "content": "예비신부들이 커뮤니티에서 분노/짜증/한탄하는 포인트 3-4가지. 스튜디오 추가금, 뻔한 청첩장, 비싼 식전영상 등. 각 빡침포인트를 '청첩장 작업실'이 어떻게 해결해주는지 가현이가 콘텐츠로 쓸 수 있게 구체적으로. 톤은 공감+약간의 독설."
  },
  {
    "type": "devlog",
    "title": "개발자의 피땀눈물",
    "content": "위 [다겸 이번 주 완료 업무] 목록을 기반으로 개발 비하인드 스토리를 직접 창작해라. 수동 로그가 없어도 완료된 태스크 제목만으로 충분히 스토리를 만들 수 있다. 예: posterOverlay v2면 '얼굴 감지 좌표 0.01 차이로 타이틀이 눈 위에 걸리는 버그를 3일 밤새 잡았다' 같은 식. 각 완료 태스크에서 2-3개 골라 '30초만에 쓰는 기능, 만드는 데 72시간' 톤으로. 절대 '로그를 기록해주세요' 같은 안내 금지. 무조건 창작해서 채워라. 가현이가 숏폼/블로그 소재로 바로 쓸 수 있게."
  },
  {
    "type": "guide",
    "title": "가현의 이번 주 콘텐츠 가이드",
    "content": "위 분석을 종합해서 가현이에게 주는 구체적 행동 지침. 숏폼 2-3개 + 롱폼 1개 제안. 각각에 POV 스타일 후킹 멘트, 자막 흐름, 해시태그 포함. 알고리즘 잘 타는 구조로. 예시: 'POV: 스튜디오 추가금 200만원 맞고 멘탈 나간 예신'."
  },
  {
    "type": "script",
    "title": "숏폼 대본 (바로 촬영 가능)",
    "content": "이번 주 트렌드와 빡침포인트를 반영한 숏폼 대본 3개. 각 대본은 25초 기준, 초 단위 타임라인으로 작성. 우리 서비스별(AI스냅/웨딩시네마/웨딩포스터/청첩장) 하나씩 다른 제품 홍보. 대본 포맷 예시:\n\n[대본1: 웨딩포스터 - 능지 상승형]\n0-3초: (한심한 표정) 아직도 스튜디오 사진 한 장에 10만원?\n3-8초: 내 친구는 9,900원으로 톡 프사 도배함\n8-15초: AI 포스터인데 보정까지 갓벽\n15-20초: 남들 추가금 파티할 때 우린 치킨 사먹자\n20-25초: 링크는 프로필에. 돈 버리는 예신한테 공유해줘\n\n이런 식으로 3개. 버전명 붙이기(능지 상승형, 웅장 반전, 공감 폭발 등). 각 대본에 촬영 팁(표정, 소품, BGM 추천)도 한줄씩. MZ 말투 필수, 뻔한 광고 톤 절대 금지."
  }
]

[형식 규칙 - 반드시 지켜라]
- 이모지 절대 금지 (이모티콘, 유니코드 이모지 전부 금지)
- 마크다운 문법 금지 (**, ##, - 등 금지)
- 번호 매기기는 1. 2. 3. 이런 식으로 평문
- 줄바꿈은 \n 사용
- 각 content 안에서 소제목이 필요하면 [소제목] 대괄호 사용

[중요 규칙]
- 반드시 web_search 도구로 '예비신부 불만', '웨딩 추가금', '청첩장 후기', '웨딩스냅 가격', 'AI 웨딩' 등을 실제 검색해서 최신 트렌드와 빡침포인트를 수집해라
- 검색 결과 기반으로 실제 커뮤니티(더웨딩, 웨딩의여신, 네이버카페 등)의 리얼한 톤으로
- 뻔한 마케팅 용어 금지. MZ세대가 실제로 쓰는 말투로
- 숫자와 구체적 예시 필수
- 각 content는 최소 300자 이상으로 풍성하게
- 다겸 작업로그가 없으면 devlog는 "이번 주 로그를 기록해주세요" 안내로 대체`;

    const researchPrompt = `너는 웨딩 업계 리서치 전문가야. 아래 주제들을 web_search로 검색해서 최신 정보를 수집해줘.

1. 2026년 웨딩 업계 최신 트렌드 (AI웨딩, 디지털청첩장, 가격투명화 등)
2. 예비신부들의 불만/빡침포인트 (스드메 추가금, 비싼 식전영상, 뻔한 청첩장 등)
3. 웨딩 커뮤니티(더웨딩, 웨딩의여신, 네이버카페)에서 화제인 주제
4. AI 웨딩스냅, AI 청첩장 관련 최신 동향

각 주제별로 구체적 수치, 사례, 커뮤니티 반응을 정리해줘. 자유로운 텍스트로.`;

    const research = await callClaude(researchPrompt, 3000, true);

    const finalPrompt = prompt + `

[AI 웹 리서치 결과]
${research}

위 리서치 결과와 내부 데이터를 종합하여 순수 JSON 배열만 반환해라.
반드시 [ 로 시작해서 ] 로 끝내라. 서론, 설명, 백틱 절대 금지.`;

    const raw = await callClaude(finalPrompt, 4000, false);

    let parsed: any[];
    try {
      let cleaned = raw;
      cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
      const jsonStart = cleaned.search(/\[\s*\{\s*"type"/);
      if (jsonStart === -1) throw new Error('no JSON array found');
      const lastBracket = cleaned.lastIndexOf(']');
      if (lastBracket <= jsonStart) throw new Error('no closing bracket');
      cleaned = cleaned.substring(jsonStart, lastBracket + 1);
      cleaned = cleaned.replace(/[\x00-\x1f]/g, (ch) => {
        if (ch === '\n') return '\\n';
        if (ch === '\r') return '';
        if (ch === '\t') return '\\t';
        return '';
      });
      parsed = JSON.parse(cleaned);
    } catch (parseErr: any) {
      console.error('JSON parse error:', parseErr.message);
      console.error('raw substring (first 500):', raw?.substring(0, 500));
      await prisma.marketingInsight.create({
        data: { weekId, type: 'error', title: 'AI 파싱 실패: ' + (parseErr.message || ''), content: raw.substring(0, 3000) },
      });
      return res.json({ ok: true, raw: true });
    }

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

    res.json({ ok: true, count: saved.length });
  } catch (e: any) {
    console.error('marketing generate error:', e);
    res.status(500).json({ error: e.message || 'failed' });
  }
});

export { router as marketingRouter };
