import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const THEME_META = [
  { id: 'ROMANTIC_CLASSIC', name: '로맨틱 클래식', mood: '우아하고 따뜻한 클래식', colors: '로즈핑크·아이보리·골드', vibe: '실내웨딩홀, 봄가을, 전통' },
  { id: 'MODERN_MINIMAL', name: '모던 미니멀', mood: '깔끔하고 세련된 모노톤', colors: '블랙·화이트·그레이', vibe: '스튜디오, 도시, 모던' },
  { id: 'BOHEMIAN_DREAM', name: '보헤미안 드림', mood: '자유롭고 낭만적 자연감성', colors: '세이지그린·테라코타·아이보리', vibe: '야외, 가든, 자연인' },
  { id: 'LUXURY_GOLD', name: '럭셔리 골드', mood: '고급스러운 다크골드', colors: '블랙·골드·샴페인', vibe: '호텔, 럭셔리, 격식' },
  { id: 'POETIC_LOVE', name: '포에틱 러브', mood: '시적이고 문학적 감성', colors: '라벤더·바이올렛·화이트', vibe: '감성적, 섬세한' },
  { id: 'SENIOR_SIMPLE', name: '어르신용 심플', mood: '큰글씨 심플 네이비', colors: '네이비·아이보리', vibe: '부모님세대, 심플' },
  { id: 'FOREST_GARDEN', name: '포레스트 가든', mood: '숲속 싱그러운 자연', colors: '포레스트그린·민트·화이트', vibe: '가든, 숲, 봄여름' },
  { id: 'OCEAN_BREEZE', name: '오션 브리즈', mood: '시원한 바다하늘', colors: '스카이블루·화이트·샌드', vibe: '해변, 여름' },
  { id: 'GLASS_BUBBLE', name: '글라스 버블', mood: '투명하고 몽환적', colors: '바이올렛·라벤더', vibe: '몽환적, 판타지' },
  { id: 'SPRING_BREEZE', name: '봄바람', mood: '따뜻하고 포근한 봄', colors: '핑크·로즈·화이트', vibe: '봄, 벚꽃, 따뜻한' },
  { id: 'GALLERY_MIRIM_1', name: 'Gallery 美林-1', mood: '갤러리 모노크롬', colors: '블랙·화이트', vibe: '아트갤러리, 사진중심' },
  { id: 'GALLERY_MIRIM_2', name: 'Gallery 美林-2', mood: '세피아 필름톤', colors: '세피아·다크그레이·골드', vibe: '필름감성, 빈티지' },
  { id: 'LUNA_HALFMOON', name: 'Luna Halfmoon', mood: '순백의 고요한 물결', colors: '아이스블루·화이트·실버', vibe: '미니멀, 청순' },
  { id: 'PEARL_DRIFT', name: 'Pearl Drift', mood: '심해속 진주 다크', colors: '블랙·아이스블루', vibe: '다크모드, 고급' },
  { id: 'NIGHT_SEA', name: '밤바다', mood: '별쏟아지는 밤바다', colors: '미드나잇블루·딥블루', vibe: '밤웨딩, 별, 로맨틱다크' },
  { id: 'AQUA_GLOBE', name: '아쿠아 글로브', mood: '청량한 수중세계', colors: '아쿠아·오렌지·화이트', vibe: '여름, 열대, 생동감' },
  { id: 'BOTANICAL_CLASSIC', name: '보태니컬 클래식', mood: '올리브그린 보태니컬', colors: '올리브·크림·그린', vibe: '보태니컬, 라인아트' },
  { id: 'HEART_MINIMAL', name: '하트 미니멀', mood: '워피치 하트', colors: '피치·코랄·크림', vibe: '귀여운, 캐주얼' },
  { id: 'WAVE_BORDER', name: '웨이브 보더', mood: '웜브라운 물결', colors: '브라운·골드·크림', vibe: '따뜻한, 가을' },
  { id: 'CRUISE_DAY', name: '크루즈 데이', mood: '스카이블루 캘리그라피', colors: '스카이블루·화이트·네이비', vibe: '크루즈, 여행, 바다낮' },
  { id: 'CRUISE_SUNSET', name: '크루즈 선셋', mood: '골든선셋 다크', colors: '골드·블랙·앰버', vibe: '석양, 럭셔리' },
  { id: 'VOYAGE_BLUE', name: '보야지 블루', mood: 'Voyage of Love 네이비', colors: '네이비·크림·올리브', vibe: '항해, 클래식' },
  { id: 'EDITORIAL', name: '에디토리얼', mood: '다크 매거진', colors: '블랙·화이트', vibe: '매거진, 패션, 다크' },
  { id: 'EDITORIAL_WHITE', name: '에디토리얼 화이트', mood: '화이트 매거진', colors: '화이트·블랙', vibe: '매거진, 밝은' },
  { id: 'EDITORIAL_GREEN', name: '에디토리얼 그린', mood: '숲 매거진', colors: '포레스트그린·세이지·크림', vibe: '매거진, 숲' },
  { id: 'EDITORIAL_BLUE', name: '에디토리얼 블루', mood: '미드나잇블루 매거진', colors: '네이비·화이트', vibe: '매거진, 시크' },
  { id: 'EDITORIAL_BROWN', name: '에디토리얼 브라운', mood: '웜베이지 매거진', colors: '브라운·베이지·골드', vibe: '매거진, 빈티지' },
];

router.post('/recommend-theme', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: '이미지가 필요합니다' });

  try {
    const themeList = THEME_META.map(t => `${t.id}: ${t.name} (${t.mood}, ${t.colors}, ${t.vibe})`).join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `웨딩 청첩장 테마 추천 전문가. 사진 분석 후 가장 어울리는 테마 3개 추천.

테마 목록:
${themeList}

반드시 JSON 배열만 응답하라. 사과문구, 설명, 마크다운 절대 금지. 이미지를 분석할 수 없어도 색감/분위기를 최대한 추정하여 JSON으로 응답하라:
[
  { "themeId": "ID", "reason": "추천이유 1~2문장 한국어", "matchScore": 95 },
  { "themeId": "ID", "reason": "추천이유", "matchScore": 88 },
  { "themeId": "ID", "reason": "추천이유", "matchScore": 82 }
]

분석 기준: 색감/톤→컬러매칭, 분위기→무드매칭, 장소/배경→바이브매칭, 커플스타일→스타일매칭

중요: EDITORIAL 계열 5종(EDITORIAL, EDITORIAL_WHITE, EDITORIAL_GREEN, EDITORIAL_BLUE, EDITORIAL_BROWN)은 매거진/패션/스튜디오 촬영뿐 아니라 세련되고 모던한 사진이면 적극 추천하라. 특히 스튜디오 촬영, 도시 배경, 모노톤/무채색 의상, 감각적 구도의 사진에는 에디토리얼 계열을 우선 고려하라. 각 에디토리얼 색상(블랙/화이트/그린/블루/브라운)은 사진의 색온도와 매칭하라.`
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
            { type: 'text', text: '이 웨딩 사진에 어울리는 청첩장 테마 3개를 추천해주세요.' }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content || '';
    const cleaned = text.replace(/```json|```/g, '').trim();

    let recommendations;
    try {
      recommendations = JSON.parse(cleaned);
    } catch {
      console.error('GPT response not JSON:', text.substring(0, 200));
      const fallback = [
        { themeId: 'EDITORIAL_WHITE', reason: '깔끔하고 세련된 분위기에 잘 어울려요', matchScore: 90 },
        { themeId: 'MODERN_MINIMAL', reason: '모던하고 미니멀한 감성이 돋보여요', matchScore: 85 },
        { themeId: 'ROMANTIC_CLASSIC', reason: '우아하고 클래식한 느낌이에요', matchScore: 80 },
      ];
      const enriched = fallback.map(rec => {
        const meta = THEME_META.find(t => t.id === rec.themeId);
        return { ...rec, name: meta?.name || rec.themeId, mood: meta?.mood || '', colors: meta?.colors || '' };
      });
      return res.json({ recommendations: enriched });
    }

    const enriched = recommendations.map((rec: any) => {
      const meta = THEME_META.find(t => t.id === rec.themeId);
      return { ...rec, name: meta?.name || rec.themeId, mood: meta?.mood || '', colors: meta?.colors || '' };
    });

    res.json({ recommendations: enriched });
  } catch (error: any) {
    console.error('Theme recommend error:', error?.message || error);
    const fallback = [
      { themeId: 'EDITORIAL_WHITE', reason: '깔끔하고 세련된 분위기에 잘 어울려요', matchScore: 90 },
      { themeId: 'MODERN_MINIMAL', reason: '모던하고 미니멀한 감성이 돋보여요', matchScore: 85 },
      { themeId: 'ROMANTIC_CLASSIC', reason: '우아하고 클래식한 느낌이에요', matchScore: 80 },
    ];
    const THEME_META_LOCAL = THEME_META;
    const enriched = fallback.map(rec => {
      const meta = THEME_META_LOCAL.find(t => t.id === rec.themeId);
      return { ...rec, name: meta?.name || rec.themeId, mood: meta?.mood || '', colors: meta?.colors || '' };
    });
    res.json({ recommendations: enriched, isFallback: true });
  }
});

router.post('/generate-greeting', async (req, res) => {
  const { groomName, brideName, weddingDate, tone } = req.body;
  if (!groomName || !brideName) return res.status(400).json({ error: '이름이 필요합니다' });

  const toneGuide: Record<string, string> = {
    formal: '격식 있고 정중한 어투. 어르신도 자연스럽게 읽을 수 있는.',
    casual: '친근하고 편안한 말투. 친구에게 말하듯.',
    romantic: '로맨틱하고 감성적. 시적이고 아름다운 표현.',
    witty: '유머러스하고 센스있는. 미소가 지어지는.',
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `한국 웨딩 청첩장 인사말 작성 전문가.
${toneGuide[tone] || toneGuide.formal}

규칙:
- greetingTitle: 6~12자
- greeting: 4~6줄, \\n으로 줄바꿈
- "소중한 분들을 모시고" 같은 진부한 표현 금지
- 신랑/신부 이름 자연스럽게 녹이기
- JSON만 응답: { "greetingTitle": "제목", "greeting": "본문" }`
        },
        {
          role: 'user',
          content: `신랑: ${groomName}, 신부: ${brideName}${weddingDate ? `, 예식일: ${weddingDate}` : ''}`
        }
      ],
      max_tokens: 300,
      temperature: 0.85,
    });

    const text = response.choices[0]?.message?.content || '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);
    res.json(result);
  } catch (error: any) {
    console.error('Greeting generate error:', error);
    res.status(500).json({ error: '인사말 생성 중 오류가 발생했습니다' });
  }
});

export const aiCreateRouter = router;
