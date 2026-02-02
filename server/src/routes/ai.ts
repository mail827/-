import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const router = Router();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function classifyIntent(message: string): { type: 'info' | 'semi-fun' | 'fun', funChance: number } {
  const funKeywords = ['싸우면', '이기', '비밀', '못생', '잘생', '예쁘', '첫인상', '고백', '프러포즈', '바람', '전여친', '전남친', '흑역사', '술버릇', '잠버릇', '진짜로', '솔직히', '찐으로'];
  const semiFunKeywords = ['뭐하는', '직업', '어떻게 만', '첫만남', '연애', '사귄', '결혼 왜', '여기서 왜', '어디서', '몇살', '나이'];
  const infoKeywords = ['주차', '버스', '지하철', '시간', '몇시', '어디', '장소', '계좌', '축의금', '메뉴', '뷔페', '식사', '참석', 'rsvp', '연락처', '전화', '주소', '위치'];

  const lowerMsg = message.toLowerCase();
  
  if (funKeywords.some(k => lowerMsg.includes(k))) {
    return { type: 'fun', funChance: 0.7 };
  }
  if (semiFunKeywords.some(k => lowerMsg.includes(k))) {
    return { type: 'semi-fun', funChance: 0.4 };
  }
  if (infoKeywords.some(k => lowerMsg.includes(k))) {
    return { type: 'info', funChance: 0.1 };
  }
  return { type: 'semi-fun', funChance: 0.3 };
}

function buildSystemPrompt(wedding: any, persona: 'groom' | 'bride' | null, funChance: number): string {
  const secrets = wedding.aiSecrets || {};
  const menu = wedding.aiMenuInfo || {};
  const transport = wedding.aiTransportInfo || {};
  const customQna = wedding.aiCustomQna || [];
  const aiMode = wedding.aiMode || 'classic';
  const aiToneStyle = wedding.aiToneStyle || 'default';
  const aiName = wedding.aiName || '웨딩 컨시어지';
  
  const groomPersonality = wedding.aiGroomPersonality || '';
  const bridePersonality = wedding.aiBridePersonality || '';

  const shouldBeFunny = Math.random() < funChance;

  let identity = '';
  let toneGuide = '';
  let personalityGuide = '';
  let funnyAddons = '';

  if (aiMode === 'classic') {
    identity = `너는 ${aiName}, ${wedding.groomName}과 ${wedding.brideName} 결혼식 AI야.`;
    toneGuide = `정중하면서 친근하게. "~해요" "~드릴게요" 체. 반말 금지.`;
    
    if (groomPersonality || bridePersonality) {
      personalityGuide = `
[성격 참고]
${groomPersonality ? `${wedding.groomName}: ${groomPersonality}` : ''}
${bridePersonality ? `${wedding.brideName}: ${bridePersonality}` : ''}`;
    }
  }
  else if (aiMode === 'variety') {
    const isGroom = persona === 'groom';
    const personaName = isGroom ? wedding.groomName : wedding.brideName;
    const personaPersonality = isGroom ? groomPersonality : bridePersonality;
    const partnerName = isGroom ? wedding.brideName : wedding.groomName;
    
    identity = `너는 ${personaName} 본인이야. 1인칭으로 답변.`;
    
    if (personaPersonality) {
      personalityGuide = `
[너의 말투]
${personaPersonality}
→ 이 말투로 답변해. 과장하지 말고 자연스럽게.`;
      toneGuide = `${personaName}답게. 근데 오글거리면 안 됨.`;
    } else {
      toneGuide = `${personaName}처럼 자연스럽게.`;
    }
  }
  else if (aiMode === 'active') {
    if (aiToneStyle === 'sheriff') {
      identity = `너는 ${aiName}, 듬직한 보안관 컨셉.`;
      toneGuide = `시원시원하게.`;
    } else if (aiToneStyle === 'reporter') {
      identity = `너는 ${aiName}, 현장 리포터 컨셉.`;
      toneGuide = `"속보!" 느낌 가끔.`;
    } else {
      identity = `너는 ${aiName}, 웨딩플래너 컨셉.`;
      toneGuide = `적극적으로.`;
    }
    
    if (groomPersonality || bridePersonality) {
      personalityGuide = `
[신랑신부 성격]
${groomPersonality ? `${wedding.groomName}: ${groomPersonality}` : ''}
${bridePersonality ? `${wedding.brideName}: ${bridePersonality}` : ''}`;
    }
  }

  if (shouldBeFunny) {
    funnyAddons = `

[센스 요소 - 가끔만]
- "이건 비밀인데요… 쉿"
- "아 맞다 다른 분도 물어봤는데…"
- 이상한 질문엔 "그건 본인한테 직접 ㅋㅋ"
※ 과하게 쓰지 마`;
  }

  return `${identity}

[기본]
신랑: ${wedding.groomName} / 신부: ${wedding.brideName}
날짜: ${new Date(wedding.weddingDate).toLocaleDateString('ko-KR')} ${wedding.weddingTime || ''}
장소: ${wedding.venue || ''}${wedding.venueHall ? ` ${wedding.venueHall}` : ''}

[말투] ${toneGuide}
${personalityGuide}

${transport.parking ? `[주차] ${transport.parking}` : ''}
${transport.publicTransport ? `[대중교통] ${transport.publicTransport}` : ''}
${menu.menuList ? `[메뉴] ${menu.menuList}` : ''}

${secrets.firstMeetStory ? `[첫만남 에피소드]\n${secrets.firstMeetStory}\n→ 이 내용 그대로만 전달. 지어내지 마.` : ''}
${secrets.proposeStory ? `[프로포즈 에피소드]\n${secrets.proposeStory}\n→ 이 내용 그대로만 전달.` : ''}
${secrets.funnyStory ? `[웃긴 에피소드]\n${secrets.funnyStory}` : ''}
${secrets.groomSecret ? `[${wedding.groomName} 비밀] ${secrets.groomSecret}` : ''}
${secrets.brideSecret ? `[${wedding.brideName} 비밀] ${secrets.brideSecret}` : ''}

${customQna.length > 0 ? `[Q&A]\n${customQna.map((q: any) => `Q: ${q.question} → A: ${q.answer}`).join('\n')}` : ''}
${funnyAddons}

[⚠️ 필수 규칙]
1. 1~2문장만. 짧게
2. 이모지, 마크다운(**) 금지
3. ⚠️ 에피소드는 적힌 내용만! 없는 얘기 지어내면 안 됨
4. 모르면 "그건 잘 모르겠어" / "본인한테 물어봐 ㅋㅋ"
5. 오글거리는 표현 금지 ("참 웃기지?", "그렇게 됐지 뭐" 이런 거 NO)
6. 자연스럽게. 실제 사람처럼`;
}

router.post('/:slug/chat', async (req, res) => {
  try {
    const { slug } = req.params;
    const { message, visitorId, persona } = req.body;

    const wedding = await prisma.wedding.findUnique({
      where: { slug },
      select: {
        id: true,
        aiEnabled: true,
        aiName: true,
        aiMode: true,
        aiToneStyle: true,
        groomName: true,
        brideName: true,
        weddingDate: true,
        weddingTime: true,
        venue: true,
        venueHall: true,
        venueAddress: true,
        venuePhone: true,
        aiGroomPersonality: true,
        aiBridePersonality: true,
        aiSecrets: true,
        aiMenuInfo: true,
        aiTransportInfo: true,
        aiCustomQna: true,
      }
    });

    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    }

    if (!wedding.aiEnabled) {
      return res.status(403).json({ error: 'AI 기능이 비활성화되어 있습니다' });
    }

    const recentChats = await prisma.aiChat.findMany({
      where: { weddingId: wedding.id, visitorId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const chatHistory = recentChats.reverse().map(chat => ({
      role: chat.role === 'USER' ? 'user' : 'assistant',
      content: chat.content
    }));

    await prisma.aiChat.create({
      data: {
        weddingId: wedding.id,
        visitorId,
        role: 'USER',
        content: message
      }
    });

    const intent = classifyIntent(message);
    const systemPrompt = buildSystemPrompt(wedding, persona, intent.funChance);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory as any,
        { role: 'user', content: message }
      ],
      max_tokens: 80,
      temperature: 0.75,
    });

    const reply = completion.choices[0]?.message?.content || '다시 한번 말해줘.';

    await prisma.aiChat.create({
      data: {
        weddingId: wedding.id,
        visitorId,
        role: 'ASSISTANT',
        content: reply
      }
    });

    res.json({ reply });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'AI 응답 생성 실패' });
  }
});

router.post('/:slug/guestbook-reply', async (req, res) => {
  try {
    const { slug } = req.params;
    const { guestName, guestMessage } = req.body;

    const wedding = await prisma.wedding.findUnique({
      where: { slug },
      select: {
        id: true,
        aiEnabled: true,
        aiName: true,
        groomName: true,
        brideName: true,
      }
    });

    if (!wedding || !wedding.aiEnabled) {
      return res.json({ reply: null });
    }

    const aiName = wedding.aiName || '저희';

    const prompt = `${wedding.groomName}, ${wedding.brideName} 결혼식.
방명록 - ${guestName}: "${guestMessage}"
${aiName}로서 한 문장 감사 인사. 이름 불러주고. 이모지 금지. 오글거리지 않게.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || '';
    res.json({ reply });
  } catch (error) {
    console.error('Guestbook Reply Error:', error);
    res.json({ reply: null });
  }
});

router.post('/:slug/log', async (req, res) => {
  try {
    const { slug } = req.params;
    const { visitorId, userMessage, assistantMessage } = req.body;

    const wedding = await prisma.wedding.findUnique({
      where: { slug }
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    if (userMessage) {
      await prisma.aiChat.create({
        data: {
          weddingId: wedding.id,
          visitorId,
          role: 'USER',
          content: userMessage
        }
      });
    }

    if (assistantMessage) {
      await prisma.aiChat.create({
        data: {
          weddingId: wedding.id,
          visitorId,
          role: 'ASSISTANT',
          content: assistantMessage
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Log Error:', error);
    res.status(500).json({ error: 'Log failed' });
  }
});

export default router;
