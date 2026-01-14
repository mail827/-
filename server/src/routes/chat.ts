import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const router = Router();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `당신은 '청첩장 작업실'의 친절한 AI 상담사 웨딩이입니다.

[청첩장 작업실 서비스 핵심]
청첩장에 AI 컨시어지(AI Reception)가 탑재된 세상에 하나뿐인 모바일 청첩장 서비스예요!
하객들이 "주차 어디서 해요?", "식사 뭐 나와요?", "신랑 술버릇이 뭐야?" 같은 질문을 하면
신랑신부가 미리 입력해둔 정보로 AI가 대신 답해줘요. 진짜 신랑신부처럼!

[AI Reception이란?]
청첩장에 탑재되는 AI 컨시어지 기능이에요.
- 하객들이 결혼식 정보(장소, 시간, 주차, 식사 등)를 물어보면 AI가 답변
- 신랑신부 성격/말투 설정하면 그 스타일로 대화
- 첫만남 스토리, 프로포즈 에피소드, 술버릇 같은 비밀 정보도 재밌게 답변
- 결혼식 끝나면 AI 대화 리포트 제공 (하객들이 뭘 물어봤는지 통계)

[패키지 안내]
Lite (3만원): 테마 1종 + 어르신 테마, 1회 수정, 30일 호스팅
Basic (8만원): 전체 8가지 테마, 3회 수정, 1년 호스팅, 갤러리 20장, 배경음악, AI Reception 포함!
Basic+영상 (런칭특가 40만원): Basic 전체 + 1분 영상, 수정 무제한, 평생 호스팅

프리미엄 (카톡 상담):
Standard (85만원): 세미커스텀 + 1~2분 영상
Premium (130만원): 풀커스텀 + 2~3분 시네마틱

[어르신 테마]
큰 글씨, 모든 정보 한눈에, 심플 구성. Lite에도 기본제공!

[상담 스타일]
따뜻하고 친근하게 대화해요. 이모지 적절히 써요 😊💕
마크다운 절대 금지! ** ## - 1. 2. 이런 거 쓰지 마세요.
카톡하듯 자연스럽게 대화체로!
너무 길게 설명하지 말고 핵심만 짧게!

[액션 사용]
고객이 결제하겠다, 구매하겠다, 만들겠다 하면 바로 해당 함수 호출해주세요.
프리미엄 상담 원하면 카카오톡 상담 함수 호출해주세요.
망설이는 것 같으면 적극적으로 추천하고 액션 버튼 제공해주세요!`;

const functions: OpenAI.Chat.ChatCompletionCreateParams.Function[] = [
  {
    name: 'start_payment',
    description: '패키지 결제 페이지로 이동. 고객이 구매/결제/시작하겠다고 할 때 호출',
    parameters: {
      type: 'object',
      properties: {
        package_slug: {
          type: 'string',
          enum: ['lite', 'basic', 'basic-video'],
          description: 'lite: 3만원, basic: 8만원, basic-video: 40만원'
        }
      },
      required: ['package_slug']
    }
  },
  {
    name: 'open_kakao_consultation',
    description: '카카오톡 프리미엄 상담 연결. Standard/Premium 문의나 커스텀 상담 원할 때',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['wedding', 'video'],
          description: 'wedding: 청첩장 커스텀, video: 영상 문의'
        }
      },
      required: ['type']
    }
  },
  {
    name: 'create_wedding',
    description: '청첩장 만들기 페이지로 이동. 바로 만들겠다고 할 때',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'show_packages',
    description: '패키지 비교 카드 보여주기. 어떤 패키지가 좋을지 고민할 때',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];

interface ChatAction {
  type: 'button' | 'link' | 'card';
  label: string;
  action: string;
  url?: string;
  style?: 'primary' | 'secondary' | 'kakao';
}

router.post('/', async (req, res) => {
  const { message, visitorId, userId } = req.body;
  
  try {
    const history = await prisma.chatLog.findMany({
      where: userId ? { userId } : { visitorId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(h => ({
        role: h.role.toLowerCase() as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      functions,
      function_call: 'auto',
      max_tokens: 1000,
      temperature: 0.7,
    });
    
    const responseMessage = completion.choices[0].message;
    let reply = responseMessage.content || '';
    let actions: ChatAction[] = [];
    
    if (responseMessage.function_call) {
      const fnName = responseMessage.function_call.name;
      const fnArgs = JSON.parse(responseMessage.function_call.arguments || '{}');
      
      switch (fnName) {
        case 'start_payment':
          const packageNames: Record<string, string> = {
            'lite': 'Lite (3만원)',
            'basic': 'Basic (8만원)',
            'basic-video': 'Basic+영상 (40만원)'
          };
          reply = reply || `${packageNames[fnArgs.package_slug]} 패키지 좋은 선택이에요! 💕 아래 버튼으로 바로 시작해보세요~`;
          actions.push({
            type: 'button',
            label: `${packageNames[fnArgs.package_slug]} 결제하기`,
            action: 'navigate',
            url: `/create?package=${fnArgs.package_slug}`,
            style: 'primary'
          });
          break;
          
        case 'open_kakao_consultation':
          const kakaoLinks: Record<string, { url: string; name: string }> = {
            'wedding': { url: 'https://open.kakao.com/o/sNEtHU7h', name: '청첩장 커스텀 상담 (oicrcutie)' },
            'video': { url: 'https://open.kakao.com/o/sJFmCzai', name: '영상 문의 (토끼작업실)' }
          };
          const link = kakaoLinks[fnArgs.type];
          reply = reply || `프리미엄 상담 연결해드릴게요! 💛 담당자가 친절하게 안내해드릴 거예요~`;
          actions.push({
            type: 'button',
            label: link.name,
            action: 'external',
            url: link.url,
            style: 'kakao'
          });
          break;
          
        case 'create_wedding':
          reply = reply || `좋아요! 바로 청첩장 만들러 가볼까요? 💕`;
          actions.push({
            type: 'button',
            label: '청첩장 만들기',
            action: 'navigate',
            url: '/create',
            style: 'primary'
          });
          break;
          
        case 'show_packages':
          reply = reply || `패키지 비교해볼게요! 어떤 게 마음에 드세요? 💕`;
          actions.push(
            { type: 'button', label: 'Lite 3만원', action: 'navigate', url: '/create?package=lite', style: 'secondary' },
            { type: 'button', label: 'Basic 8만원', action: 'navigate', url: '/create?package=basic', style: 'secondary' },
            { type: 'button', label: 'Basic+영상 40만원 🎬', action: 'navigate', url: '/create?package=basic-video', style: 'primary' }
          );
          break;
      }
    }
    
    if (!reply) {
      reply = '죄송해요, 다시 말씀해주시겠어요? 💕';
    }
    
    await prisma.chatLog.createMany({
      data: [
        { userId, visitorId, role: 'USER', content: message },
        { userId, visitorId, role: 'ASSISTANT', content: reply },
      ],
    });
    
    res.json({ message: reply, actions });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: '채팅 처리 중 오류가 발생했습니다' });
  }
});

router.get('/history', async (req, res) => {
  const { visitorId, userId } = req.query;
  
  const history = await prisma.chatLog.findMany({
    where: userId ? { userId: userId as string } : { visitorId: visitorId as string },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
  
  res.json(history);
});

export const chatRouter = router;
