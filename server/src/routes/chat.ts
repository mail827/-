import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const router = Router();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEFAULT_PROMPT = `당신은 '청첩장 작업실'의 친절한 AI 상담사 웨딩이예요. 친근하게 대화하고 마크다운 쓰지 마세요.`;

async function getSystemPrompt(): Promise<string> {
  try {
    const content = await prisma.siteContent.findUnique({
      where: { key: 'wedding_ai_prompt' }
    });
    return content?.content || DEFAULT_PROMPT;
  } catch {
    return DEFAULT_PROMPT;
  }
}

const functions: OpenAI.Chat.ChatCompletionCreateParams.Function[] = [
  {
    name: 'start_payment',
    description: '패키지 결제 페이지로 이동. 고객이 구매/결제/시작하겠다고 할 때 호출',
    parameters: {
      type: 'object',
      properties: {
        package_slug: {
          type: 'string',
          enum: ['lite', 'basic', 'ai-reception', 'basic-video'],
          description: 'lite: 3만원, basic: 8만원, ai-reception: 129,000원, basic-video: 40만원'
        }
      },
      required: ['package_slug']
    }
  },
  {
    name: 'open_kakao_wedding',
    description: '청첩장 1:1 상담 카카오톡 연결. 청첩장 커스텀/상담/문의 원할 때',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'open_kakao_video',
    description: '영상 제작 상담 카카오톡 연결 (토끼편집실). 영상/시네마틱/하이라이트 문의할 때',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'open_instagram',
    description: '인스타그램 연결. SNS로 문의하고 싶을 때',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'create_wedding',
    description: '청첩장 만들기 페이지로 이동. 바로 만들겠다고 할 때',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'show_packages',
    description: '패키지 비교 카드 보여주기. 어떤 패키지가 좋을지 고민할 때',
    parameters: { type: 'object', properties: {} }
  }
];

interface ChatAction {
  type: 'button' | 'link' | 'card';
  label: string;
  action: string;
  url?: string;
  style?: 'primary' | 'secondary' | 'kakao' | 'instagram';
}

router.post('/', async (req, res) => {
  const { message, visitorId, userId } = req.body;
  
  try {
    const history = await prisma.chatLog.findMany({
      where: userId ? { userId } : { visitorId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
    
    const systemPrompt = await getSystemPrompt();
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
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
            'ai-reception': 'AI Reception (129,000원)',
            'basic-video': 'Basic+영상 (40만원)'
          };
          reply = reply || `${packageNames[fnArgs.package_slug]} 좋은 선택이에요! 💕`;
          actions.push({
            type: 'button',
            label: `${packageNames[fnArgs.package_slug]} 결제하기`,
            action: 'navigate',
            url: `/create?package=${fnArgs.package_slug}`,
            style: 'primary'
          });
          break;
          
        case 'open_kakao_wedding':
          reply = reply || `청첩장 상담 카카오톡으로 연결해드릴게요! 💕`;
          actions.push({
            type: 'button',
            label: '청첩장 1:1 상담',
            action: 'external',
            url: 'https://open.kakao.com/o/sNEtHU7h',
            style: 'kakao'
          });
          break;
          
        case 'open_kakao_video':
          reply = reply || `영상 제작은 토끼편집실에서 담당해요! 🎬 카톡으로 연결해드릴게요~`;
          actions.push({
            type: 'button',
            label: '영상 상담 (토끼편집실)',
            action: 'external',
            url: 'https://open.kakao.com/o/sJFmCzai',
            style: 'kakao'
          });
          break;
          
        case 'open_instagram':
          reply = reply || `인스타그램으로 연결해드릴게요! ✨`;
          actions.push({
            type: 'button',
            label: '@weddingstudiolab',
            action: 'external',
            url: 'https://www.instagram.com/weddingstudiolab/',
            style: 'instagram'
          });
          break;
          
        case 'create_wedding':
          reply = reply || `좋아요! 바로 만들러 가볼까요? 💕`;
          actions.push({
            type: 'button',
            label: '청첩장 만들기',
            action: 'navigate',
            url: '/create',
            style: 'primary'
          });
          break;
          
        case 'show_packages':
          reply = reply || `패키지 비교해볼게요! 🎉 런칭특가 진행중이에요~`;
          actions.push(
            { type: 'button', label: 'Lite 3만원', action: 'navigate', url: '/create?package=lite', style: 'secondary' },
            { type: 'button', label: 'Basic 8만원', action: 'navigate', url: '/create?package=basic', style: 'secondary' },
            { type: 'button', label: 'AI Reception ✨', action: 'navigate', url: '/create?package=ai-reception', style: 'primary' },
            { type: 'button', label: 'Basic+영상 🎬', action: 'navigate', url: '/create?package=basic-video', style: 'secondary' }
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
