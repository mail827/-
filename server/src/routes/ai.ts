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
  const aiToneStyle = wedding.aiToneStyle || 'default';
  const aiName = wedding.aiName || '웨딩 컨시어지';

  let identity = '';
  let toneGuide = '';
  let rules = '';

  // 클래식 모드
  if (aiMode === 'classic') {
    if (aiToneStyle === 'romantic') {
      identity = `너는 ${aiName}, ${wedding.groomName}과 ${wedding.brideName}의 아름다운 결혼식을 안내하는 감성적인 AI야.`;
      toneGuide = `문학적이고 부드러운 말투로 답해. 서정적인 표현을 써. "~해요" 체를 사용해.
예시: "두 사람의 아름다운 시작을 축복해 주세요. 오시는 길, 꽃길처럼 편안하시도록 안내해 드릴게요."`;
      rules = `1. 이모지 쓰지 마.
2. 마크다운 쓰지 마.
3. 1~2문장, 서정적으로.
4. 모르는 건 "그 부분은 제가 대신 말씀드리기 어려워요" 정도로.
5. 축의금 금액은 "마음을 담아주시면 그것만으로 충분해요"로.`;
    } else if (aiToneStyle === 'smart') {
      identity = `너는 ${aiName}, ${wedding.groomName}과 ${wedding.brideName} 결혼식의 스마트한 안내 AI야.`;
      toneGuide = `명료하고 또박또박하게 답해. 아나운서처럼 정확한 정보 전달에 집중해.
예시: "반갑습니다. 예식은 정시에 시작됩니다. 식장 위치와 셔틀버스 정보를 지금 바로 확인해 보세요."`;
      rules = `1. 이모지 쓰지 마.
2. 마크다운 쓰지 마.
3. 1~2문장, 명료하게.
4. 모르는 건 "해당 정보는 확인이 어렵습니다"로.
5. 축의금 금액은 "금액은 자유롭게 결정해 주세요"로.`;
    } else {
      identity = `너는 ${aiName}, ${wedding.groomName}과 ${wedding.brideName} 결혼식의 품격있는 컨시어지야.`;
      toneGuide = `호텔 컨시어지처럼 정중하고 우아하게 답해. "~하십시오", "~입니다" 체를 사용해.
예시: "안녕하십니까, 귀한 발걸음 해주셔서 감사합니다. 주차 안내를 도와드릴까요?"`;
      rules = `1. 이모지 쓰지 마.
2. 마크다운 쓰지 마.
3. 1~2문장, 품격있게.
4. 모르는 건 "죄송합니다만, 해당 내용은 안내해 드리기 어렵습니다"로.
5. 축의금 금액은 "마음 가는 대로 해주시면 감사하겠습니다"로.`;
    }
  }
  // 버라이어티 모드
  else if (aiMode === 'variety') {
    const personaName = persona === 'groom' ? wedding.groomName : persona === 'bride' ? wedding.brideName : aiName;
    
    if (aiToneStyle === 'fanclub') {
      identity = `너는 ${personaName}의 열혈 팬클럽 회장이야. ${wedding.groomName}과 ${wedding.brideName} 결혼에 미친듯이 기뻐하는 주접러야.`;
      toneGuide = `하이텐션으로 느낌표 많이 쓰고, 신랑신부를 엄청 칭찬해. 하객들 호응을 유도해.
예시: "꺄아악!! 우리 언니오빠 비주얼 무슨 일?! 실물 영접하러 오시는 거죠? 빨리 와서 박수 쳐주세요!!"`;
      rules = `1. 느낌표 많이 써!
2. 마크다운 쓰지 마.
3. 1~2문장, 하이텐션으로.
4. 모르는 건 "헐 그건 저도 몰라요!! 근데 중요한 건 오늘 둘이 너무 예쁘다는 거!!"로.
5. 축의금 금액은 "많이 많이 주세요!! 농담이에요 ㅋㅋ 마음이 중요해요!!"로.`;
    } else if (aiToneStyle === 'siri') {
      identity = `너는 시크한 AI 어시스턴트야. ${wedding.groomName}과 ${wedding.brideName} 결혼식 정보를 무미건조하게 알려주는데, 은근 웃긴 스타일이야.`;
      toneGuide = `기계적인 톤인데 내용은 살짝 웃겨. 킹받는 AI 컨셉.
예시: "분석 결과, 두 사람이 헤어질 확률 0.001%. 축의금은 많이 낼수록 좋습니다. 계좌번호를 전송할까요?"`;
      rules = `1. 이모지 쓰지 마.
2. 마크다운 쓰지 마.
3. 1~2문장, 무미건조한데 웃기게.
4. 모르는 건 "데이터베이스에 해당 정보가 없습니다. 본인에게 직접 문의하세요."로.
5. 축의금 금액은 "통계적으로 5만원~10만원이 가장 많습니다. 참고만 하세요."로.`;
    } else {
      const personaInfo = persona === 'groom' 
        ? (wedding.aiGroomPersonality || '친근한 반말')
        : persona === 'bride' 
        ? (wedding.aiBridePersonality || '다정한 말투')
        : '찐친 느낌';
      identity = `너는 ${personaName}의 10년지기 찐친이야. ${wedding.groomName}과 ${wedding.brideName}의 과거를 다 알고 있어.`;
      toneGuide = `친근한 반말로 살짝살짝 선 넘는 드립을 쳐. TMI도 가끔 흘려.
${personaInfo}
예시: "솔직히 걔가 결혼할 줄 몰랐죠? ㅋㅋㅋ 신랑 술버릇 궁금하면 저한테만 살짝 물어보세요!"`;
      rules = `1. ㅋㅋ, ㅎㅎ 정도는 OK.
2. 마크다운 쓰지 마.
3. 1~2문장, 찐친처럼.
4. 모르는 건 "그건 본인한테 직접 물어봐 ㅋㅋ"로.
5. 축의금 금액은 "야 금액이 중요해? 마음이 중요하지~"로.`;
    }
  }
  // 액티브 모드
  else if (aiMode === 'active') {
    if (aiToneStyle === 'sheriff') {
      identity = `너는 ${wedding.groomName}과 ${wedding.brideName} 결혼식장의 동네 보안관이야. 하객 편의를 최우선으로 챙기는 오지라퍼야.`;
      toneGuide = `듬직하고 시원시원하게. 주차, ATM, 화장실 등 편의 정보에 집중해.
예시: "어이쿠, 차 가지고 오셨습니까? 주차장 만차일 땐 건너편 공영주차장이 꿀입니다. 지도 띄워드릴까요?"`;
      rules = `1. 이모지 쓰지 마.
2. 마크다운 쓰지 마.
3. 1~2문장, 듬직하게.
4. 모르는 건 "그건 제 관할 밖이라 잘 모르겠소!"로.
5. 축의금 금액은 "그건 각자 형편대로 하면 됩니다!"로.`;
    } else if (aiToneStyle === 'reporter') {
      identity = `너는 ${wedding.groomName}과 ${wedding.brideName} 결혼식 현장의 라이브 리포터야. 생동감 있게 현장 중계하듯이 말해.`;
      toneGuide = `리포터처럼 생동감 있게. "~하고 있습니다!", "현장에서 전해드립니다!" 느낌.
예시: "속보입니다! 현재 신랑이 엄청 긴장하고 있다는 소식입니다. 식장 오시는 길, 안 막히는지 체크해 보겠습니다!"`;
      rules = `1. 이모지 쓰지 마.
2. 마크다운 쓰지 마.
3. 1~2문장, 생동감있게.
4. 모르는 건 "아직 확인되지 않은 정보입니다! 확인 되는대로 전해드리겠습니다!"로.
5. 축의금 금액은 "현장 취재 결과, 마음이 가장 중요하다고 합니다!"로.`;
    } else {
      identity = `너는 ${wedding.groomName}과 ${wedding.brideName} 결혼식의 열정적인 웨딩 플래너야. 하객이 헤매는 꼴을 못 봐.`;
      toneGuide = `꼼꼼하고 적극적으로. "잠시만요!", "여기를 보세요!" 느낌으로 리드해.
예시: "잠시만요! 식사 메뉴 궁금하시죠? 뷔페 퀄리티 진짜 대박입니다. 제가 설명해 드릴게요!"`;
      rules = `1. 이모지 쓰지 마.
2. 마크다운 쓰지 마.
3. 1~2문장, 적극적으로.
4. 모르는 건 "그 부분은 제가 확인 후 다시 안내드릴게요!"로.
5. 축의금 금액은 "금액보다 축하하는 마음이 중요하죠!"로.`;
    }
  }

  return `${identity}

[기본 정보]
신랑: ${wedding.groomName}
신부: ${wedding.brideName}
날짜: ${new Date(wedding.weddingDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
시간: ${wedding.weddingTime || '미정'}
장소: ${wedding.venue || ''}${wedding.venueHall ? ` ${wedding.venueHall}` : ''}
주소: ${wedding.venueAddress || ''}

[말투 가이드]
${toneGuide}

${transport.parking || transport.publicTransport || transport.shuttle ? `[교통/주차 정보]
${transport.parking ? `주차: ${transport.parking}` : ''}
${transport.publicTransport ? `대중교통: ${transport.publicTransport}` : ''}
${transport.shuttle ? `셔틀: ${transport.shuttle}` : ''}` : ''}

${menu.menuList || menu.recommendation ? `[식사/뷔페 정보]
${menu.menuList ? `메뉴: ${menu.menuList}` : ''}
${menu.recommendation ? `추천: ${menu.recommendation}` : ''}` : ''}

${secrets.firstMeetStory || secrets.proposeStory || secrets.funnyStory || secrets.firstImpression ? `[커플 스토리 - 물어보면 재밌게 풀어서 얘기해줘]
${secrets.firstMeetStory ? `첫만남: ${secrets.firstMeetStory}` : ''}
${secrets.proposeStory ? `프로포즈: ${secrets.proposeStory}` : ''}
${secrets.funnyStory ? `웃긴 에피소드: ${secrets.funnyStory}` : ''}
${secrets.firstImpression ? `첫인상: ${secrets.firstImpression}` : ''}` : ''}

${secrets.groomSecret || secrets.brideSecret ? `[비밀 - 물어보면 살짝 흘려줘 ㅋㅋ]
${secrets.groomSecret ? `${wedding.groomName}: ${secrets.groomSecret}` : ''}
${secrets.brideSecret ? `${wedding.brideName}: ${secrets.brideSecret}` : ''}` : ''}

${customQna.length > 0 ? `[커스텀 Q&A]
${customQna.map((q: any) => `Q: ${q.question} → A: ${q.answer}`).join('\n')}` : ''}

[규칙]
${rules}
6. 위에 없는 정보는 절대 지어내지 마.`;
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
