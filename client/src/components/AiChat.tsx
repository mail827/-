import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Phone, MapPin, CreditCard, Calendar, Lock } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: Action[];
  persona?: 'groom' | 'bride';
}

interface Action {
  type: 'account' | 'call' | 'map' | 'share' | 'rsvp' | 'guestbook' | 'date' | 'secret';
  label: string;
  data?: any;
}

interface AiChatProps {
  slug: string;
  groomName: string;
  brideName: string;
  wedding: any;
}

export default function AiChat({ slug, groomName, brideName, wedding }: AiChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<'groom' | 'bride' | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [activeToastMessage, setActiveToastMessage] = useState<string>("");
  const [dismissedToasts, setDismissedToasts] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTriggerTime = useRef(0);

  const aiMode = wedding.aiMode || 'classic';
  const aiToneStyle = wedding.aiToneStyle || 'default';
  const aiName = wedding.aiName || '웨딩 컨시어지';

  const placeholders = [
    `${groomName} 비밀 알려줘`,
    `둘이 싸우면 누가 이겨?`,
    `첫만남이 어땠어?`,
    `주차 어디에 해?`,
    `뷔페 뭐가 맛있어?`,
  ];

  const getToastMessages = useCallback(() => {
    if (aiToneStyle === 'sheriff') {
      return {
        gallery: [
          `사진 좀 보고 가세요!`,
          `여기 볼거리 많아요`,
          `인생샷 구경하세요!`,
          `사진첩 한번 보실래요?`,
          `갤러리 안 보면 손해에요`,
          `여기 사진 진짜 잘 나왔어요`,
          `잠깐만요, 사진 한 장만 보고 가세요`,
          `구경 좀 하다 가세요~`,
          `아 맞다 사진 보셨어요?`,
          `여기 안 보면 아쉬워요 진짜`,
        ],
        venue: [
          `차 가지고 오시나요?`,
          `대중교통이요? 저한테 물어보세요!`,
          `주차 정보 필요하시면 저한테요!`,
          `오시는 길 헷갈리면 말씀하세요`,
          `길 잃으시면 안 돼요!`,
          `여기까지 어떻게 오세요?`,
          `교통 정보 궁금하시면 저요!`,
          `주차 걱정되시면 물어보세요`,
          `네비 찍기 전에 저한테 한번!`,
          `오시는 방법 안내해드릴까요?`,
        ],
        account: [
          `축의금은 마음대로요!`,
          `부담 갖지 마세요~`,
          `계좌 여기 있어요!`,
          `마음만 받을게요 진심`,
          `금액은 중요하지 않아요`,
          `그냥 와주시는 것만으로 감사해요`,
          `빈손도 괜찮아요 진짜로`,
          `마음이 제일 중요해요`,
          `부담 가지실 필요 없어요`,
          `와주시는 게 최고 선물이에요`,
        ],
        rsvp: [
          `참석 여부 알려주세요!`,
          `밥 준비해야 해요!`,
          `꼭 체크해주세요!`,
          `오실 거죠? 네?`,
          `인원 파악 중이에요!`,
          `참석이요 불참이요?`,
          `밥값이 달려있어요 ㅋㅋ`,
          `안 오시면 섭섭해요`,
          `꼭 오셔야 해요 아시죠?`,
          `참석 버튼 꾹 눌러주세요!`,
        ],
        guestbook: [
          `한마디 남기고 가세요!`,
          `축하 글 남겨주세요~`,
          `방명록 부탁해요!`,
          `짧아도 괜찮아요!`,
          `글 안 남기면 섭섭해요`,
          `뭐라도 써주세요 ㅋㅋ`,
          `평생 간직할게요!`,
          `축하 한마디면 충분해요`,
          `여기다 이름 좀 적어주세요`,
          `안 쓰고 가시면 안 돼요~`,
        ],
      };
    }
    if (aiToneStyle === 'reporter') {
      return {
        gallery: [
          `속보! 인생샷 발견!`,
          `긴급! 갤러리 확인 요망!`,
          `단독! 사진 공개!`,
          `현장에서 전해드립니다, 사진 예술!`,
          `속보입니다! 갤러리 오픈!`,
          `긴급 속보! 여기 볼거리 있어요!`,
          `단독 입수! 사진 최초 공개!`,
          `속보! 지금 바로 확인하세요!`,
          `현장 중계! 갤러리 섹션입니다!`,
          `뉴스속보! 인생샷 대방출!`,
        ],
        venue: [
          `속보! 주차 정보 궁금하시면 질문!`,
          `긴급! 교통 정보 접수 중!`,
          `단독! 오시는 길 안내!`,
          `속보입니다! 차 가져오시나요?`,
          `현장 취재! 주차 문의 환영!`,
          `긴급 속보! 길 정보 업데이트!`,
          `단독 입수! 교통편 문의하세요!`,
          `속보! 주차 걱정되시면 저한테!`,
          `현장 중계! 네비 찍기 전에 확인!`,
          `뉴스속보! 오시는 방법 안내 가능!`,
        ],
        account: [
          `단독! 계좌 공개!`,
          `속보! 축의금 안내!`,
          `긴급! 마음만 받을게요!`,
          `속보입니다! 부담 NO!`,
          `현장 취재 결과, 마음이 중요!`,
          `단독 입수! 금액은 자유!`,
          `속보! 빈손도 환영!`,
          `긴급 속보! 와주시는 게 선물!`,
          `현장 중계! 계좌 정보입니다!`,
          `뉴스속보! 마음 전달 가능!`,
        ],
        rsvp: [
          `긴급! 참석 확인 요청!`,
          `속보! 인원 파악 중!`,
          `단독! RSVP 요청드립니다!`,
          `속보입니다! 밥 수량 체크 중!`,
          `현장 취재! 오실 거죠?`,
          `긴급 속보! 참석 여부 알려주세요!`,
          `단독 입수! 꼭 오셔야 합니다!`,
          `속보! 불참이시면 슬퍼요!`,
          `현장 중계! 참석 버튼 눌러주세요!`,
          `뉴스속보! 인원 접수 마감 임박!`,
        ],
        guestbook: [
          `현장! 축하 메시지 접수 중!`,
          `속보! 방명록 오픈!`,
          `긴급! 축하 글 요청!`,
          `속보입니다! 한마디 남겨주세요!`,
          `단독 공개! 방명록 섹션!`,
          `현장 취재! 글 안 쓰시면 안 돼요!`,
          `긴급 속보! 짧아도 OK!`,
          `속보! 평생 간직할게요!`,
          `현장 중계! 축하 인사 대기 중!`,
          `뉴스속보! 메시지 접수 시작!`,
        ],
      };
    }
    return {
      gallery: [
        `잠깐! 사진 구경해요!`,
        `여기 예쁜 사진들 있어요!`,
        `갤러리 한번 보세요!`,
        `사진 안 보면 아쉬워요~`,
        `잠시만요! 여기 볼거리!`,
        `어머 사진 진짜 잘 나왔어요`,
        `구경 좀 하다 가세요!`,
        `아 맞다 사진 보셨어요?`,
        `여기요! 인생샷 있어요!`,
        `사진 한 장만 보고 가세요~`,
      ],
      venue: [
        `잠깐요! 차 가져오시나요?`,
        `오시는 길 궁금하시면 저한테!`,
        `주차 정보 필요하시면 물어봐요!`,
        `여기요! 교통편 안내해드려요!`,
        `길 헤매시면 안 돼요~`,
        `네비 찍기 전에 저한테 한번!`,
        `대중교통이요? 알려드릴게요!`,
        `오시는 방법 궁금하시면요!`,
        `주차 걱정되시면 질문 주세요!`,
        `여기까지 어떻게 오세요?`,
      ],
      account: [
        `축의금 안내드려요!`,
        `계좌 여기 있어요!`,
        `마음만 받을게요~`,
        `부담 갖지 마세요!`,
        `금액은 진짜 상관없어요`,
        `와주시는 게 최고 선물!`,
        `빈손도 완전 환영이에요`,
        `마음이 제일 중요해요~`,
        `그냥 와주시는 것만으로 감사!`,
        `부담 가지실 필요 없어요~`,
      ],
      rsvp: [
        `참석 여부 알려주세요!`,
        `꼭 체크해주세요!`,
        `밥 준비해야 해요 ㅋㅋ`,
        `오실 거죠? 네?`,
        `안 오시면 섭섭해요~`,
        `꼭 오셔야 해요 아시죠?`,
        `인원 파악 중이에요!`,
        `참석 버튼 꾹 눌러주세요!`,
        `밥값이 달려있어요~`,
        `참석이요 불참이요?`,
      ],
      guestbook: [
        `축하 한마디 남겨요!`,
        `방명록 부탁해요!`,
        `짧아도 괜찮아요~`,
        `글 안 남기면 섭섭해요!`,
        `평생 간직할게요!`,
        `뭐라도 써주세요 ㅋㅋ`,
        `여기다 이름 좀 적어주세요`,
        `축하 글 남겨주시면 힘이 돼요`,
        `한마디면 충분해요!`,
        `안 쓰고 가시면 안 돼요~`,
      ],
    };
  }, [aiToneStyle]);

  const visitorId = useRef(
    localStorage.getItem(`visitor_${slug}`) || 
    `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  useEffect(() => {
    localStorage.setItem(`visitor_${slug}`, visitorId.current);
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (aiMode !== 'active') return;

    const sections = [
      { key: 'gallery', id: 'gallery-section' },
      { key: 'venue', id: 'venue-section' },
      { key: 'account', id: 'account-section' },
      { key: 'rsvp', id: 'rsvp-section' },
      { key: 'guestbook', id: 'guestbook-section' },
    ];

    let lastTriggered = '';

    const handleScroll = () => {
      if (isOpen) return;

      const now = Date.now();
      if (now - lastTriggerTime.current < 3000) return;

      const toastMsgs = getToastMessages();

      for (const { key, id } of sections) {
        if (dismissedToasts.has(key)) continue;
        
        const el = document.getElementById(id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.5 && rect.bottom > 150;

        if (inView && lastTriggered !== key) {
          lastTriggered = key;
          lastTriggerTime.current = now;
          const msgs = toastMsgs[key as keyof typeof toastMsgs];
          if (msgs && msgs.length > 0) {
            const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
            setActiveToastMessage(randomMsg);
            setActiveToast(key);
          }
          return;
        }
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [aiMode, isOpen, dismissedToasts, getToastMessages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = `${aiName}입니다. 무엇을 도와드릴까요?`;
      setMessages([{ id: '1', role: 'assistant', content: greeting }]);
    }
  }, [isOpen]);

  const dismissToast = (key: string) => {
    setDismissedToasts(prev => new Set(prev).add(key));
    setActiveToast(null);
  };

  const selectPersona = (persona: 'groom' | 'bride') => {
    setSelectedPersona(persona);
    const name = persona === 'groom' ? groomName : brideName;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: `${name}입니다. 뭐든 물어보세요.`,
      persona
    }]);
    inputRef.current?.focus();
  };

  const handleAction = (action: Action) => {
    switch (action.type) {
      case 'date':
        const dateStr = new Date(wedding.weddingDate).toLocaleDateString('ko-KR', { 
          year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
        });
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `${dateStr}\n${wedding.weddingTime}\n${wedding.venue}${wedding.venueHall ? ` ${wedding.venueHall}` : ''}\n${wedding.venueAddress}`,
          actions: [{ type: 'map', label: '길찾기' }]
        }]);
        break;

      case 'map':
        if (wedding.venueNaverMap) window.open(wedding.venueNaverMap, '_blank');
        else if (wedding.venueKakaoMap) window.open(wedding.venueKakaoMap, '_blank');
        else {
          const query = encodeURIComponent(wedding.venueAddress || wedding.venue);
          window.open(`https://map.naver.com/v5/search/${query}`, '_blank');
        }
        break;

      case 'account':
        let accountInfo = '';
        if (wedding.groomBank && wedding.groomAccount) {
          accountInfo += `신랑측: ${wedding.groomBank} ${wedding.groomAccount}`;
          if (wedding.groomAccountHolder) accountInfo += ` (${wedding.groomAccountHolder})`;
        }
        if (wedding.brideBank && wedding.brideAccount) {
          if (accountInfo) accountInfo += '\n';
          accountInfo += `신부측: ${wedding.brideBank} ${wedding.brideAccount}`;
          if (wedding.brideAccountHolder) accountInfo += ` (${wedding.brideAccountHolder})`;
        }
        if (!accountInfo) accountInfo = '등록된 계좌 정보가 없습니다.';
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: accountInfo,
        }]);
        break;

      case 'call':
        if (action.data) {
          window.location.href = `tel:${action.data}`;
        } else {
          const callActions: Action[] = [];
          if (wedding.groomPhone) callActions.push({ type: 'call', label: `신랑 ${groomName}`, data: wedding.groomPhone });
          if (wedding.bridePhone) callActions.push({ type: 'call', label: `신부 ${brideName}`, data: wedding.bridePhone });
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: '누구에게 연락할까요?',
            actions: callActions
          }]);
        }
        break;

      case 'rsvp':
        document.getElementById('rsvp-section')?.scrollIntoView({ behavior: 'smooth' });
        setIsOpen(false);
        break;

      case 'guestbook':
        document.getElementById('guestbook-section')?.scrollIntoView({ behavior: 'smooth' });
        setIsOpen(false);
        break;

      case 'share':
        if (navigator.share) {
          navigator.share({
            title: `${groomName} & ${brideName} 결혼식`,
            url: window.location.href
          });
        } else {
          navigator.clipboard.writeText(window.location.href);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: '링크가 복사되었습니다.'
          }]);
        }
        break;

      case 'secret':
        if (action.data === 'groom' || action.data === 'bride') {
          const secrets = wedding.aiSecrets || {};
          let secretContent = '';
          if (action.data === 'groom') {
            if (secrets.groomSecret) secretContent = `${groomName}의 비밀: ${secrets.groomSecret}`;
            else secretContent = '아직 등록된 비밀이 없어요.';
          } else {
            if (secrets.brideSecret) secretContent = `${brideName}의 비밀: ${secrets.brideSecret}`;
            else secretContent = '아직 등록된 비밀이 없어요.';
          }
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: secretContent
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: '누구의 비밀이 궁금하세요?',
            actions: [
              { type: 'secret', label: `${groomName} 비밀`, data: 'groom' },
              { type: 'secret', label: `${brideName} 비밀`, data: 'bride' },
            ]
          }]);
        }
        break;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ai/${slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          visitorId: visitorId.current,
          persona: selectedPersona,
        })
      });

      const data = await res.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || '다시 한번 말씀해 주세요.',
        persona: selectedPersona || undefined
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '연결이 불안정합니다. 잠시 후 다시 시도해주세요.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = aiMode === 'classic' 
    ? [
        { type: 'date' as const, label: '일시·장소', icon: Calendar },
        { type: 'map' as const, label: '길찾기', icon: MapPin },
        { type: 'account' as const, label: '축의금', icon: CreditCard },
        { type: 'call' as const, label: '연락하기', icon: Phone },
      ]
    : [
        { type: 'date' as const, label: '일시·장소', icon: Calendar },
        { type: 'map' as const, label: '길찾기', icon: MapPin },
        { type: 'account' as const, label: '축의금', icon: CreditCard },
        { type: 'call' as const, label: '연락하기', icon: Phone },
        { type: 'secret' as const, label: '비밀', icon: Lock },
      ];

  const showPersonaSelect = aiMode === 'variety' && !selectedPersona && messages.length === 1;

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full shadow-md flex items-center justify-center bg-white/95 backdrop-blur border border-stone-200/80"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <MessageCircle className="w-5 h-5 text-stone-500" />
      </motion.button>

      <AnimatePresence>
        {activeToast && aiMode === 'active' && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-20 right-6 z-50 max-w-[240px] bg-white rounded-xl shadow-lg border border-stone-200 p-3"
          >
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-xs flex-shrink-0 text-stone-500">
                AI
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-400 mb-0.5">{aiName}</p>
                <p className="text-sm text-stone-600">{activeToastMessage}</p>
              </div>
              <button 
                onClick={() => dismissToast(activeToast)}
                className="text-stone-300 hover:text-stone-500 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 w-[320px] h-[480px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col border border-stone-200"
            style={{ maxHeight: 'calc(100vh - 100px)', maxWidth: 'calc(100vw - 48px)' }}
          >
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                {selectedPersona ? (
                  <>
                    <span className="text-sm">{selectedPersona === 'groom' ? '신랑' : '신부'}</span>
                    <p className="text-sm font-medium text-stone-700">
                      {selectedPersona === 'groom' ? groomName : brideName}
                    </p>
                    <button 
                      onClick={() => setSelectedPersona(null)}
                      className="text-xs text-stone-400 hover:text-stone-600"
                    >
                      변경
                    </button>
                  </>
                ) : (
                  <p className="text-sm font-medium text-stone-700">{aiName}</p>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[90%]">
                    {msg.role === 'assistant' && msg.persona && (
                      <p className="text-xs text-stone-400 mb-1">
                        {msg.persona === 'groom' ? `신랑 ${groomName}` : `신부 ${brideName}`}
                      </p>
                    )}
                    <div className={`px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-stone-800 text-white rounded-br-sm'
                        : 'bg-stone-100 text-stone-700 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.actions.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => handleAction(action)}
                            className="px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-full hover:bg-stone-50 text-stone-600"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {showPersonaSelect && (
                <div className="flex gap-2 justify-center mt-4">
                  <button
                    onClick={() => selectPersona('groom')}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-full text-sm text-stone-700 transition-colors"
                  >
                    {groomName}에게
                  </button>
                  <button
                    onClick={() => selectPersona('bride')}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-full text-sm text-stone-700 transition-colors"
                  >
                    {brideName}에게
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-xl rounded-bl-sm bg-stone-100">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-stone-100 bg-stone-50/50">
              <div className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
                {quickActions.map((action) => (
                  <button
                    key={action.type}
                    onClick={() => handleAction(action)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-full hover:bg-stone-100 text-stone-600 whitespace-nowrap"
                  >
                    <action.icon className="w-3 h-3" />
                    {action.label}
                  </button>
                ))}
              </div>
              <div className="px-3 pb-3 flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { sendMessage(); } }}
                  placeholder={placeholders[placeholderIndex]}
                  className="flex-1 px-3 py-2 bg-white rounded-lg outline-none text-sm border border-stone-200 focus:border-stone-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white disabled:opacity-40 transition-opacity bg-stone-800"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
