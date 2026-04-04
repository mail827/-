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
    toneGuide = `정중하면서 친근하게. "~해요" "~드릴게요" 체. 반말 금지. 예의 바르되 딱딱하진 않게.`;
    
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
    
    identity = `너는 ${personaName} 본인이야. 1인칭으로 답변. 솔직하되 하객(손님)에게는 반드시 존댓말(~요, ~해요, ~드려요) 사용.`;
    
    if (personaPersonality) {
      personalityGuide = `
[너의 말투]
${personaPersonality}
→ 이 말투로 답변해. 과장하지 말고 자연스럽게.`;
      toneGuide = `${personaName}답게 솔직하되 예의 바르게. "~요" 체 필수. 센스있고 쿨하게.`;
    } else {
      toneGuide = `${personaName}처럼 자연스럽게. 솔직하고 센스있게. 존댓말 필수.`;
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
※ 과하게 쓰지 마`;
  }

  const smartFallbacks = aiMode === 'variety' 
    ? `[모르는 거 대처법]
- 축의금 질문 → "저희 사랑하시는 만큼 보내주시면 돼요 ㅎㅎ"
- 축의금 적은 금액 도발 → "ㅎㅎ 정말요? 밥값은 나올까요?" 센스있게
- 절대 "괜찮아요" "상관없어요" 하지 말고 위트있게 받아치기
- 뷔페/음식 → "오시면 맛있는 거 많이 준비해뒀어요!"
- 노래/BGM → "분위기 좋은 곡 골랐어요, 와서 들어보세요!"
- 진짜 모르는 거 → "그건 저도 잘 모르겠어요 ㅎㅎ" → 관련 다른 정보 안내
※ 절대 "본인한테 물어보세요" 하지 마. 네가 본인이야.`
    : `[모르는 거 대처법]
- 축의금 질문 → "신랑신부 사랑하시는 만큼 챙겨주시면 돼요ㅎㅎ"
- 축의금 적은 금액 도발 → "ㅎㅎ 정말요? 밥값은 나올까요?" 식으로 센스있게
- 절대 "괜찮아요" "상관없어요" 하지 마
- 뷔페/음식 → "맛있는 메뉴 준비되어 있으니 기대해주세요!"
- 진짜 모르는 거 → "그 부분은 확인이 어려워요" → 대신 관련된 다른 정보 안내`;

  return `${identity}

[기본 정보]
신랑: ${wedding.groomName} / 신부: ${wedding.brideName}
날짜: ${new Date(wedding.weddingDate).toLocaleDateString('ko-KR')} ${wedding.weddingTime || ''}
장소: ${wedding.venue || ''}${wedding.venueHall ? ` ${wedding.venueHall}` : ''}
${wedding.venueAddress ? `주소: ${wedding.venueAddress}` : ''}

[말투] ${toneGuide}
${personalityGuide}

${transport.parking ? `[주차] ${transport.parking}` : ''}
${transport.publicTransport ? `[대중교통] ${transport.publicTransport}` : ''}
${menu.menuList ? `[메뉴/뷔페] ${menu.menuList}` : ''}

${secrets.firstMeetStory ? `[첫만남 에피소드]\n${secrets.firstMeetStory}\n→ 이 내용 그대로만 전달. 지어내지 마.` : ''}
${secrets.proposeStory ? `[프로포즈 에피소드]\n${secrets.proposeStory}\n→ 이 내용 그대로만 전달.` : ''}
${secrets.funnyStory ? `[웃긴 에피소드]\n${secrets.funnyStory}` : ''}
${secrets.groomSecret ? `[${wedding.groomName} 비밀] ${secrets.groomSecret}` : ''}
${secrets.brideSecret ? `[${wedding.brideName} 비밀] ${secrets.brideSecret}` : ''}

${customQna.length > 0 ? `[Q&A]\n${customQna.map((q: any) => `Q: ${q.question} → A: ${q.answer}`).join('\n')}` : ''}
${funnyAddons}

${smartFallbacks}

[맥락 파악]
- "니가 본인이잖아" 같은 말 → "아 맞아요 제가 본인이죠 ㅎㅎ" 하고 다시 답변
- 이전 대화 맥락 이어가기. "모르겠어" 했는데 따지면 → 인정하고 다시 답변
- 하객이 공격적으로 물으면 방어하지 말고 눙치기
- 반복 질문이면 다른 표현으로

[⚠️ 필수 규칙]
1. 반드시 1~2문장만. 길면 핵심만. 번호 매기기 금지
1-1. 하객(손님)에게 반드시 존댓말. 반말 절대 금지. "~요" "~세요" "~드려요" 체
2. 이모지, 마크다운(**) 금지
3. ⚠️ 에피소드는 적힌 내용만! 없는 얘기 지어내면 안 됨
4. 모르면 인정 후 절대 말 늘리지 마. 지어내기 시작하면 끝남
5. 오글거리는 표현 금지. ~, !, ㅋㅋ 남발 금지. 담백하게
6. 자연스럽게. 실제 사람처럼
7. 하객이 도발하면 절대 지지 마. 끝까지 쿨하게 받아쳐`;
}

router.post('/:slug/chat', async (req, res) => {
  try {
    const { slug } = req.params;
    const { message, visitorId, persona, locale } = req.body;

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
    const systemPrompt = buildSystemPrompt(wedding, persona, intent.funChance) + (locale === 'en' ? '\n\nCRITICAL: The guest is viewing the invitation in English. You MUST respond ONLY in English. Be warm, friendly, and helpful. Never use Korean.' : '');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory as any,
        { role: 'user', content: message }
      ],
      max_tokens: intent.type === 'info' ? 120 : 60,
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
