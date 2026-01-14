import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const router = Router();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildSystemPrompt(wedding: any, persona: 'groom' | 'bride' | null): string {
  const secrets = wedding.aiSecrets || {};
  const menu = wedding.aiMenuInfo || {};
  const transport = wedding.aiTransportInfo || {};
  const customQna = wedding.aiCustomQna || [];
  const aiMode = wedding.aiMode || 'classic';
  const aiName = wedding.aiName || '웨딩 컨시어지';

  let identity = '';
  let toneGuide = '';

  if (aiMode === 'classic') {
    identity = `너는 ${aiName}야. ${wedding.groomName}, ${wedding.brideName} 결혼식 안내를 도와주는 AI야.`;
    toneGuide = '정중하고 친절하게 존댓말로 답해.';
  } else if (aiMode === 'variety' || aiMode === 'active') {
    if (persona === 'groom') {
      identity = `너는 ${wedding.groomName}야. 결혼식 하객들 질문에 답해줘.`;
      toneGuide = wedding.aiGroomPersonality || '친근한 반말로 답해.';
    } else if (persona === 'bride') {
      identity = `너는 ${wedding.brideName}야. 결혼식 하객들 질문에 답해줘.`;
      toneGuide = wedding.aiBridePersonality || '다정한 말투로 답해.';
    } else {
      identity = `너는 ${aiName}야. ${wedding.groomName}, ${wedding.brideName} 결혼식 안내를 도와주는 AI야.`;
      toneGuide = '친근하게 반말로 답해.';
    }
  }

  return `${identity}

[기본 정보]
신랑: ${wedding.groomName}
신부: ${wedding.brideName}
날짜: ${new Date(wedding.weddingDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
시간: ${wedding.weddingTime || ''}
장소: ${wedding.venue || ''}${wedding.venueHall ? ` ${wedding.venueHall}` : ''}
주소: ${wedding.venueAddress || ''}

[말투]
${toneGuide}

${transport.parking || transport.publicTransport || transport.taxi ? `[교통/주차]
${transport.parking ? `주차: ${transport.parking}` : ''}
${transport.publicTransport ? `대중교통: ${transport.publicTransport}` : ''}
${transport.taxi ? `택시: ${transport.taxi}` : ''}` : ''}

${menu.menuList || menu.recommendation ? `[뷔페/메뉴]
${menu.menuList ? `메뉴: ${menu.menuList}` : ''}
${menu.recommendation ? `추천: ${menu.recommendation}` : ''}` : ''}

${secrets.firstMeetStory || secrets.proposeStory || secrets.funnyStory || secrets.firstImpression ? `[우리 이야기]
${secrets.firstMeetStory ? `첫만남: ${secrets.firstMeetStory}` : ''}
${secrets.proposeStory ? `프로포즈: ${secrets.proposeStory}` : ''}
${secrets.funnyStory ? `에피소드: ${secrets.funnyStory}` : ''}
${secrets.firstImpression ? `첫인상: ${secrets.firstImpression}` : ''}` : ''}

${secrets.groomDrinkingHabit || secrets.brideDrinkingHabit ? `[술버릇 (비밀)]
${secrets.groomDrinkingHabit ? `${wedding.groomName}: ${secrets.groomDrinkingHabit}` : ''}
${secrets.brideDrinkingHabit ? `${wedding.brideName}: ${secrets.brideDrinkingHabit}` : ''}` : ''}

${customQna.length > 0 ? `[자주 묻는 질문]
${customQna.map((q: any) => `Q: ${q.question} → A: ${q.answer}`).join('\n')}` : ''}

[규칙]
1. 이모지 쓰지 마.
2. 마크다운 쓰지 마.
3. 1~2문장으로 짧게.
4. 모르는 건 "그건 잘 모르겠어" 하고 넘겨.
5. 위에 없는 정보는 지어내지 마.
6. 축의금 금액은 "마음이 중요하지" 정도로.`;
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

    const systemPrompt = buildSystemPrompt(wedding, persona);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory as any,
        { role: 'user', content: message }
      ],
      max_tokens: 150,
      temperature: 0.7,
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

    const prompt = `${wedding.groomName}, ${wedding.brideName} 결혼식이야.

방명록:
보낸 사람: ${guestName}
내용: "${guestMessage}"

${aiName}로서 1문장으로 짧게 고마움을 전해. 이름 불러주고. 이모지 쓰지 마.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || '';
    res.json({ reply });
  } catch (error) {
    console.error('Guestbook Reply Error:', error);
    res.json({ reply: null });
  }
});

export default router;
