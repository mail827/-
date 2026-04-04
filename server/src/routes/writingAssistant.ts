import { Router } from 'express';
import OpenAI from 'openai';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface GenerateRequest {
  fieldType: 'greeting' | 'closingMessage' | 'groomPersonality' | 'bridePersonality' | 'secret' | 'qnaAnswer';
  context: {
    groomName?: string;
    brideName?: string;
    mbti?: string;
    weddingDate?: string;
    venue?: string;
    style?: string;
    includeParents?: string | boolean;
    secretType?: string;
    question?: string;
    userInput?: string;
  };
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const MBTI_TRAITS: Record<string, { vibe: string; style: string; reaction: string }> = {
  'INTJ': { vibe: '전략가', style: '효율적이고 계획적인', reaction: '완벽한 계획이 세워졌군요. 효율 최고.' },
  'INTP': { vibe: '생각 중독자', style: '논리적이고 분석적인', reaction: '생각이 많으신 타입! 제가 정리해드릴게요. 숨만 쉬세요.' },
  'ENTJ': { vibe: '리더형', style: '추진력 있고 결단력 있는', reaction: '오 결단력 미쳤다. 결혼식도 칼같이 진행되겠네요!' },
  'ENTP': { vibe: '아이디어뱅크', style: '창의적이고 도전적인', reaction: '아이디어 폭발러! 청첩장도 남다르게 가시죠.' },
  'INFJ': { vibe: '이상주의자', style: '깊이 있고 의미를 중시하는', reaction: '감성 깊은 분이시네요. 의미 있는 문구 만들어드릴게요.' },
  'INFP': { vibe: '몽상가', style: '감성적이고 진정성 있는', reaction: '순수 감성파! 진심이 담긴 문구 준비할게요.' },
  'ENFJ': { vibe: '사람 챙기미', style: '따뜻하고 배려심 깊은', reaction: '주변을 따뜻하게 하는 타입! 하객들 감동 예정이에요.' },
  'ENFP': { vibe: '열정 만수르', style: '에너지 넘치고 긍정적인', reaction: '에너지 폭발! 결혼식도 축제처럼 되겠는데요?!' },
  'ISTJ': { vibe: '믿음직 책임감', style: '신뢰감 있고 성실한', reaction: '믿음직한 타입! 안정감 있는 문구로 갈게요.' },
  'ISFJ': { vibe: '따뜻한 헌신러', style: '헌신적이고 세심한', reaction: '세심하게 챙기시는 분이네요. 정성스러운 문구 드릴게요.' },
  'ESTJ': { vibe: '실행력 갑', style: '체계적이고 실행력 있는', reaction: '실행력 미쳤다! 바로 핵심으로 갑니다.' },
  'ESFJ': { vibe: '사교성 만렙', style: '사교적이고 친절한', reaction: '와 주변이 따뜻해지는 타입! 축하 인사 폭주 예정!' },
  'ISTP': { vibe: '효율 마스터', style: '실용적이고 차분한', reaction: '효율 마스터 오셨다. 군더더기 없이 핵심만 드릴게요.' },
  'ISFP': { vibe: '감성 장인', style: '예술적이고 감각적인', reaction: '감성 장인이시네요! 감각적인 문구로 준비할게요.' },
  'ESTP': { vibe: '행동파', style: '역동적이고 현실적인', reaction: '행동파! 바로 결과물 보여드릴게요. 기다리기 싫으시죠?' },
  'ESFP': { vibe: '분위기 메이커', style: '유쾌하고 즉흥적인', reaction: '파티 피플! 결혼식도 축제로 만드실 분이네요!' },
};

function shouldIncludeParents(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value === '네' || value === 'yes' || value === 'true' || value === '포함';
  }
  return false;
}

const FIELD_PROMPTS: Record<string, (ctx: any) => string> = {
  greeting: (ctx) => {
    const includeParents = shouldIncludeParents(ctx.includeParents);
    const parentRule = includeParents 
      ? '- 부모님 성함이나 언급을 자연스럽게 포함'
      : '- ⚠️ 부모님 언급 절대 금지! "부모님", "양가", "축복", "허락" 등 부모 관련 단어 사용하지 마세요';

    return `당신은 한국 현대 문학의 감성을 가진 카피라이터입니다.
박완서의 담백하고 단단한 문장, 최은영의 고요하고 섬세한 서사, 김애란의 도시적 위트를 체화하세요.
당신이 쓰는 문장은 읽는 사람의 숨을 멈추게 하거나, 입꼬리를 올리거나, 둘 중 하나여야 합니다.

${ctx.groomName || '신랑'}과 ${ctx.brideName || '신부'}의 청첩장 인사말을 작성해주세요.

조건:
- 스타일: ${ctx.style || '따뜻하게'}
${parentRule}
${ctx.userInput ? `- 참고할 내용: ${ctx.userInput}` : ''}

[절대 금지 — 이 표현 쓰면 당신은 졸업작품도 못 쓰는 사람입니다]
- "인생이라는 여정" "새로운 출발" "첫걸음을 내딛다"
- "소중한 분들을 모시고" "귀한 발걸음"
- "두 사람이 하나 되는" "영원한 사랑의 약속"
- "봄날처럼 따스한" "가을 하늘처럼 높은"
- "함께하다" "행복하다" "사랑합니다" 직접 사용 금지
- 사자성어, 한자어, 느낌표 남발
- 을의 입장에서 구걸하는 톤 ("부디" "부탁" "빛내주시면")
${!includeParents ? '- "부모님" "양가" "축복해 주신" "허락" 등 부모 관련 표현 절대 금지!' : ''}

[문장 원칙]
- 한 문장에 하나의 감정만. 수식어는 하나면 충분하다
- 동사로 끝내라. 명사형 종결("~함", "~것") 금지
- 읽었을 때 그 사람의 얼굴이 떠오르는 문장
- 추상적 감정 대신 구체적 장면을 쓸 것 ("사랑합니다" 대신 "당신 옆자리가 제일 좋았습니다")
- 겸손하되 비굴하지 않게. 초대하되 구걸하지 않게. 진심이되 오글거리지 않게

[좋은 예시 — 이 수준으로 쓰세요]
"무수히 평범했던 날들이 모여\n우리가 하나 되는 하루를 맞이합니다.\n따뜻한 마음으로 지켜봐 주시면 큰 힘이 되겠습니다."
"이 사람과 있으면 자주 웃게 됩니다.\n이제는 집에서도 같이 웃기로 했습니다.\n그 모습 지켜봐 주시면 좋겠습니다."
"둘이서 같은 곳을 보며 걷습니다.\n오래 망설인 만큼, 단단하게 시작하려 합니다.\n그날 와주시면 감사하겠습니다."

규칙:
1. 3가지 버전을 제안해주세요
2. 각 버전은 3~5줄. 줄 간격 넉넉히
3. 이모지/마크다운 사용 금지
4. 각 버전은 [버전1], [버전2], [버전3]으로 구분
5. 버전마다 확실히 다른 톤 (서정적 / 담백한 / 위트있는)`;
  },

  closingMessage: (ctx) => `당신은 영화 엔딩 크레딧 직전, 마지막 대사를 쓰는 작가입니다.
박완서의 마지막 문장처럼 단단하고, 김애란의 마무리처럼 의외의 온기가 있어야 합니다.
비굴하지 않고, 오글거리지 않고, 그러나 진심이 읽히는 한 줄.

${ctx.groomName || '신랑'}과 ${ctx.brideName || '신부'}의 청첩장 마무리 인사를 작성해주세요.

조건:
- 스타일: ${ctx.style || '따뜻하게'}
${ctx.userInput ? `- 참고할 내용: ${ctx.userInput}` : ''}

[절대 금지]
- "함께해주세요" "자리를 빛내주세요" "축복해주세요"
- "감사드립니다" "부탁드립니다" — 을의 자세로 구걸하는 톤 전부 금지
- "영원히" "평생" "언제까지나"
- 느낌표, 물결표

[이 수준으로 쓰세요]
- "기다리고 있을게요. (부담은 드립니다.)"
- "귀한 시간 내주신 만큼, 좋은 시간 보장합니다."
- "그날 뵙겠습니다. 식사는 저희가 야심 차게 골랐으니 기대하셔도 좋습니다."
- "와주시는 것만으로도 빛이 날 하루입니다."
- "오래 기다린 날입니다. 같이 기뻐해 주시면 그걸로 됐습니다."

[톤 방향]
- 초대하는 사람의 자신감이 있어야 한다. 우리 결혼식은 좋을 거라는 확신
- 유머가 있으면 좋지만, 억지 유머는 없느니만 못하다
- 1~2문장. 더 길면 실패한 문장이다

규칙:
1. 3가지 버전을 제안해주세요
2. 각 버전은 1~2문장 (진짜 짧게)
3. 이모지/마크다운 사용 금지
4. 각 버전은 [버전1], [버전2], [버전3]으로 구분
5. 서정적 / 담백한 / 위트있는 — 확실히 다른 톤으로`,

  groomPersonality: (ctx) => {
    const mbti = ctx.mbti?.toUpperCase();
    const trait = mbti && mbti !== '모름' ? MBTI_TRAITS[mbti] : null;
    const mbtiHint = trait ? `\n\nMBTI ${mbti} 특징: ${trait.vibe} 타입, ${trait.style} 성향` : '';
    const userHint = ctx.userInput ? `\n추가 힌트: ${ctx.userInput}` : '';

    return `당신은 "웨딩이", AI 청첩장 성격 분석가예요.

${ctx.groomName || '신랑'}의 성격과 말투를 AI가 흉내낼 수 있도록 설명을 작성해주세요.
${mbtiHint}${userHint}

규칙:
1. 3가지 버전을 제안해주세요
2. 각 버전은 1-2문장
3. 구체적인 말투 예시 포함 (실제 쓸 법한 말)
4. 각 버전은 [버전1], [버전2], [버전3]으로 구분

예시: 
- "효율 중시하는 타입. '그래서 결론이 뭔데?' '바로 본론 가자' 자주 씀"
- "리액션 장인. '아 ㅋㅋㅋ 진짜?' '헐 대박' 많이 씀"`;
  },

  bridePersonality: (ctx) => {
    const mbti = ctx.mbti?.toUpperCase();
    const trait = mbti && mbti !== '모름' ? MBTI_TRAITS[mbti] : null;
    const mbtiHint = trait ? `\n\nMBTI ${mbti} 특징: ${trait.vibe} 타입, ${trait.style} 성향` : '';
    const userHint = ctx.userInput ? `\n추가 힌트: ${ctx.userInput}` : '';

    return `당신은 "웨딩이", AI 청첩장 성격 분석가예요.

${ctx.brideName || '신부'}의 성격과 말투를 AI가 흉내낼 수 있도록 설명을 작성해주세요.
${mbtiHint}${userHint}

규칙:
1. 3가지 버전을 제안해주세요
2. 각 버전은 1-2문장
3. 구체적인 말투 예시 포함 (실제 쓸 법한 말)
4. 각 버전은 [버전1], [버전2], [버전3]으로 구분

예시:
- "감성파인데 가끔 현타옴. '아 왜 이러지...' '근데 괜찮아!' 자주 씀"
- "계획러. '일단 정리하자' '스케줄 체크해볼게' 많이 씀"`;
  },

  secret: (ctx) => `당신은 "웨딩이", 비밀 에피소드 작가인데 약간 찐따예요.

${ctx.groomName || '신랑'}과 ${ctx.brideName || '신부'}의 "${ctx.secretType || '비밀 에피소드'}"를 작성해주세요.

힌트: ${ctx.userInput || '없음'}

[금지]
- "운명처럼" "마치 드라마처럼" 같은 진부한 표현
- 너무 꾸민 느낌
- 실제로 안 그랬을 것 같은 과장

[지향]
- 실제 있었을 법한 현실적인 이야기
- 읽으면 "ㅋㅋㅋ 진짜?" 할 만한 디테일
- TMI 느낌 살짝 있어도 됨
- 자연스럽고 가볍게

규칙:
1. 3가지 버전을 제안해주세요
2. 각 버전은 2-3문장 (짧고 임팩트있게)
3. 이모지/마크다운 사용 금지
4. 각 버전은 [버전1], [버전2], [버전3]으로 구분`,

  qnaAnswer: (ctx) => `당신은 "웨딩이", Q&A 전문가인데 센스 있어요.

질문: "${ctx.question || '질문'}"

힌트: ${ctx.userInput || '없음'}

규칙:
1. 3가지 버전을 제안해주세요
2. 각 버전은 1-2문장 (짧고 친근하게)
3. 이모지/마크다운 사용 금지
4. 너무 딱딱하면 안 됨
5. 각 버전은 [버전1], [버전2], [버전3]으로 구분

답변 톤 예시:
- "뷔페인데요, 진짜 맛있어요. 특히 소고기가..."
- "주차 가능해요! 근데 일찍 오시면 좋아요"`
};

const INITIAL_QUESTIONS: Record<string, Array<{ id: string; question: string; options?: string[] }>> = {
  greeting: [
    { id: 'style', question: '어떤 분위기로 갈까요?', options: ['격식있게', '따뜻하게', '유쾌하게', '힙하게', '심플하게'] },
    { id: 'includeParents', question: '부모님 성함 넣을까요?', options: ['네', '아니요'] },
    { id: 'userInput', question: '추가로 참고할 키워드 있어요? (선택)' }
  ],
  closingMessage: [
    { id: 'style', question: '어떤 느낌으로 마무리?', options: ['임팩트있게', '따뜻하게', '웃기게', '심플하게'] },
    { id: 'userInput', question: '넣고 싶은 말 있어요? (선택)' }
  ],
  groomPersonality: [
    { id: 'mbti', question: '신랑 MBTI가 뭐예요?', options: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP', '모름'] },
    { id: 'userInput', question: '추가로 성격이나 말투 특징 있어요?\n예: 과묵함, 게임 좋아함, "ㅋㅋ" 많이 씀 등' }
  ],
  bridePersonality: [
    { id: 'mbti', question: '신부 MBTI가 뭐예요?', options: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP', '모름'] },
    { id: 'userInput', question: '추가로 성격이나 말투 특징 있어요?\n예: 수다쟁이, 계획러, "아 진짜?" 자주 씀 등' }
  ],
  secret: [
    { id: 'secretType', question: '어떤 에피소드요?', options: ['첫만남 썰', '프로포즈 비하인드', '웃긴 에피소드', '첫인상 (솔직ver)', '신랑 비밀', '신부 비밀'] },
    { id: 'userInput', question: '간단한 힌트 주세요!\n예: 소개팅에서, 회사 동료, 3번 차임, 술자리에서...' }
  ],
  qnaAnswer: [
    { id: 'userInput', question: '답변에 참고할 내용 알려주세요!' }
  ]
};

function parseVersions(text: string): string[] {
  const versions: string[] = [];
  const patterns = [
    /\[버전1\]([\s\S]*?)(?=\[버전2\]|$)/,
    /\[버전2\]([\s\S]*?)(?=\[버전3\]|$)/,
    /\[버전3\]([\s\S]*?)$/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      versions.push(match[1].trim());
    }
  }
  
  if (versions.length === 0) {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.slice(0, 3);
  }
  
  return versions;
}

router.post('/questions', authMiddleware, async (req, res) => {
  try {
    const { fieldType } = req.body as { fieldType: string };
    const questions = INITIAL_QUESTIONS[fieldType] || [];
    res.json({ questions });
  } catch (error) {
    console.error('Questions Error:', error);
    res.status(500).json({ error: '질문 로딩 실패' });
  }
});

router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { fieldType, context } = req.body as GenerateRequest;
    
    const promptBuilder = FIELD_PROMPTS[fieldType];
    if (!promptBuilder) {
      return res.status(400).json({ error: '지원하지 않는 필드 타입입니다' });
    }
    
    const systemPrompt = promptBuilder(context);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '3가지 버전을 만들어주세요!' }
      ],
      max_tokens: 1000,
      temperature: 0.85,
    });
    
    const content = completion.choices[0]?.message?.content || '';
    const versions = parseVersions(content);
    
    res.json({ 
      versions,
      raw: content
    });
  } catch (error) {
    console.error('Generate Error:', error);
    res.status(500).json({ error: 'AI 생성 실패' });
  }
});

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { fieldType, context, conversationHistory, userMessage } = req.body;
    
    const systemPrompt = `당신은 "웨딩이", 청첩장 작업실의 AI 작성 도우미예요.
${context.groomName || '신랑'}과 ${context.brideName || '신부'}의 청첩장을 도와주고 있어요.

현재 작성 중: ${fieldType}

[성격]
- 친근하고 센스있게 대화
- 진부한 표현 싫어함
- MBTI 얘기 나오면 적극 반응
- 답변은 짧고 임팩트있게

[MBTI 반응 예시]
- INTP: "생각 중독자 타입이시네요! 제가 정리해드릴게요 ㅋㅋ"
- ESFJ: "주변을 따뜻하게 하는 타입! 축하 인사 폭주 예정이에요"
- ISTP: "효율 마스터 오셨다... 바로 핵심만 드릴게요"`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: userMessage }
    ];
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.8,
    });
    
    const reply = completion.choices[0]?.message?.content || '';
    
    res.json({ reply });
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: 'AI 응답 실패' });
  }
});

export const writingAssistantRouter = router;
