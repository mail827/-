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
    weddingDate?: string;
    venue?: string;
    style?: string;
    includeParents?: boolean;
    secretType?: string;
    question?: string;
    userInput?: string;
  };
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const FIELD_PROMPTS: Record<string, (ctx: any) => string> = {
  greeting: (ctx) => `당신은 "웨딩이", 청첩장 작업실의 감성 카피라이터예요.

${ctx.groomName || '신랑'}과 ${ctx.brideName || '신부'}의 청첩장 인사말을 작성해주세요.

조건:
- 스타일: ${ctx.style || '따뜻하게'}
- 부모님 언급: ${ctx.includeParents ? '포함' : '생략'}
${ctx.userInput ? `- 참고할 내용: ${ctx.userInput}` : ''}

규칙:
1. 3가지 버전을 제안해주세요
2. 각 버전은 3-5문장
3. 이모지 사용 금지
4. 마크다운 사용 금지
5. 너무 진부한 표현 피하기
6. 각 버전은 [버전1], [버전2], [버전3]으로 구분

감성적이면서도 읽기 편한 인사말을 만들어주세요.`,

  closingMessage: (ctx) => `당신은 "웨딩이", 청첩장 작업실의 감성 카피라이터예요.

${ctx.groomName || '신랑'}과 ${ctx.brideName || '신부'}의 청첩장 마무리 인사를 작성해주세요.

조건:
- 스타일: ${ctx.style || '따뜻하게'}
${ctx.userInput ? `- 참고할 내용: ${ctx.userInput}` : ''}

규칙:
1. 3가지 버전을 제안해주세요
2. 각 버전은 1-2문장 (짧게!)
3. 이모지 사용 금지
4. 마크다운 사용 금지
5. 각 버전은 [버전1], [버전2], [버전3]으로 구분

짧고 여운이 남는 마무리 인사를 만들어주세요.`,

  groomPersonality: (ctx) => `당신은 "웨딩이", AI 청첩장 전문가예요.

${ctx.groomName || '신랑'}의 성격과 말투를 AI가 흉내낼 수 있도록 설명을 작성해주세요.

${ctx.userInput ? `힌트: ${ctx.userInput}` : ''}

규칙:
1. 3가지 버전을 제안해주세요
2. 각 버전은 1-2문장
3. 구체적인 말투 예시 포함
4. 각 버전은 [버전1], [버전2], [버전3]으로 구분

예시: "장난기 많고 유머러스함. '야 ㅋㅋ', '아 진짜?' 같은 리액션 자주 씀"`,

  bridePersonality: (ctx) => `당신은 "웨딩이", AI 청첩장 전문가예요.

${ctx.brideName || '신부'}의 성격과 말투를 AI가 흉내낼 수 있도록 설명을 작성해주세요.

${ctx.userInput ? `힌트: ${ctx.userInput}` : ''}

규칙:
1. 3가지 버전을 제안해주세요
2. 각 버전은 1-2문장
3. 구체적인 말투 예시 포함
4. 각 버전은 [버전1], [버전2], [버전3]으로 구분

예시: "다정하고 따뜻한 성격. '고마워~', '괜찮아?' 같은 표현 자주 씀"`,

  secret: (ctx) => `당신은 "웨딩이", 청첩장 AI 비밀 에피소드 작가예요.

${ctx.groomName || '신랑'}과 ${ctx.brideName || '신부'}의 "${ctx.secretType || '비밀 에피소드'}"를 재밌게 작성해주세요.

${ctx.userInput ? `힌트: ${ctx.userInput}` : ''}

규칙:
1. 3가지 버전을 제안해주세요
2. 각 버전은 2-3문장
3. 재밌고 귀여운 톤
4. 이모지 사용 금지
5. 각 버전은 [버전1], [버전2], [버전3]으로 구분

하객들이 "ㅋㅋㅋ" 할 수 있는 귀여운 에피소드로 만들어주세요.`,

  qnaAnswer: (ctx) => `당신은 "웨딩이", 청첩장 AI Q&A 전문가예요.

질문: "${ctx.question || '질문'}"

이 질문에 대한 답변을 작성해주세요.

${ctx.userInput ? `힌트: ${ctx.userInput}` : ''}

규칙:
1. 3가지 버전을 제안해주세요
2. 각 버전은 1-2문장
3. 친근하면서도 도움되는 톤
4. 이모지 사용 금지
5. 각 버전은 [버전1], [버전2], [버전3]으로 구분`
};

const INITIAL_QUESTIONS: Record<string, Array<{ id: string; question: string; options?: string[] }>> = {
  greeting: [
    { id: 'style', question: '어떤 분위기의 인사말을 원하세요?', options: ['격식있게', '따뜻하게', '유쾌하게', '감성적으로'] },
    { id: 'includeParents', question: '부모님 성함을 포함할까요?', options: ['네, 포함해주세요', '아니요, 생략할게요'] },
    { id: 'userInput', question: '혹시 참고하고 싶은 문구나 키워드가 있나요? (선택)' }
  ],
  closingMessage: [
    { id: 'style', question: '어떤 느낌으로 마무리할까요?', options: ['짧고 임팩트있게', '따뜻하게', '유머러스하게', '감성적으로'] },
    { id: 'userInput', question: '추가로 넣고 싶은 말이 있나요? (선택)' }
  ],
  groomPersonality: [
    { id: 'userInput', question: '신랑의 성격이나 말투 특징을 알려주세요!\n예: MBTI, 자주 쓰는 말, 성격 등' }
  ],
  bridePersonality: [
    { id: 'userInput', question: '신부의 성격이나 말투 특징을 알려주세요!\n예: MBTI, 자주 쓰는 말, 성격 등' }
  ],
  secret: [
    { id: 'secretType', question: '어떤 에피소드를 작성할까요?', options: ['첫만남 이야기', '프로포즈 비하인드', '웃긴 에피소드', '서로의 첫인상', '신랑의 비밀', '신부의 비밀'] },
    { id: 'userInput', question: '간단한 힌트를 주세요!\n예: 소개팅에서 만남, 3번 차임, 술자리에서... 등' }
  ],
  qnaAnswer: [
    { id: 'userInput', question: '답변에 참고할 내용을 알려주세요!' }
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
      temperature: 0.8,
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

현재 작성 중인 필드: ${fieldType}

친근하고 따뜻하게 대화하면서 필요한 정보를 수집하고, 최종적으로 멋진 문구를 만들어주세요.
답변은 짧고 친근하게. 이모지는 가끔만.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: userMessage }
    ];
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });
    
    const reply = completion.choices[0]?.message?.content || '';
    
    res.json({ reply });
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: 'AI 응답 실패' });
  }
});

export const writingAssistantRouter = router;
