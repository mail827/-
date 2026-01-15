import { useState, useRef, useEffect } from 'react';
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

  const aiMode = wedding.aiMode || 'classic';
  const aiToneStyle = wedding.aiToneStyle || 'default';
  const aiName = wedding.aiName || '웨딩 컨시어지';

  const placeholders = [
    `${groomName} 술버릇이 뭐야?`,
    `둘이 싸우면 누가 이겨?`,
    `첫만남이 어땠어?`,
    `주차 어디에 해?`,
    `뷔페 뭐가 맛있어?`,
  ];

  const getToastMessages = (): Record<string, { section: string; messages: string[] }> => {
    // 액티브 모드 스타일별 메시지
    if (aiToneStyle === 'sheriff') {
      return {
        gallery: { section: "gallery-section", messages: [
          `사진 구경 좀 하고 가세요!`,
          `여기 볼거리가 있어요`,
        ]},
        venue: { section: "venue-section", messages: wedding.aiTransportInfo?.parking 
          ? [`주차장 안내해드릴게요! ${wedding.aiTransportInfo.parking}`]
          : [`길 잃으면 안 돼요! 지도 확인하세요`]
        },
        account: { section: "account-section", messages: [
          `축의금 계좌는 여기 있어요!`,
          `부담 갖지 말고 형편대로 하세요`,
        ]},
        rsvp: { section: "rsvp-section", messages: [
          `참석 여부 꼭 알려주세요!`,
          `밥 준비해야 하니까 미리 알려주세요`,
        ]},
        guestbook: { section: "guestbook-section", messages: [
          `축하 인사 한마디 남기고 가세요!`,
          `방명록에 이름 좀 적어주세요`,
        ]},
      };
    }
    if (aiToneStyle === 'reporter') {
      return {
        gallery: { section: "gallery-section", messages: [
          `속보! 갤러리에서 인생샷 발견됐습니다!`,
          `현장에서 전해드립니다, 사진이 예술입니다!`,
        ]},
        venue: { section: "venue-section", messages: wedding.aiTransportInfo?.parking 
          ? [`긴급 속보! 주차 정보 입수했습니다! ${wedding.aiTransportInfo.parking}`]
          : [`실시간 교통 정보! 지도 확인하세요!`]
        },
        account: { section: "account-section", messages: [
          `단독 입수! 축의금 계좌 정보입니다!`,
          `현장 취재 결과, 마음이 제일 중요하답니다!`,
        ]},
        rsvp: { section: "rsvp-section", messages: [
          `긴급 요청! 참석 여부 알려주세요!`,
          `속보입니다! 밥 수량 파악 중입니다!`,
        ]},
        guestbook: { section: "guestbook-section", messages: [
          `현장 중계! 축하 메시지 접수 중입니다!`,
          `독점 공개! 방명록 섹션입니다!`,
        ]},
      };
    }
    // planner (default for active)
    return {
      gallery: { section: "gallery-section", messages: [
        `잠시만요! 사진 한번 구경해보실래요?`,
        `여기 예쁜 사진들 준비해뒀어요!`,
      ]},
      venue: { section: "venue-section", messages: wedding.aiTransportInfo?.parking 
        ? [`잠깐요! 주차 정보 알려드릴게요! ${wedding.aiTransportInfo.parking}`]
        : [`여기요! 오시는 길 헤매시면 안 돼요!`]
      },
      account: { section: "account-section", messages: [
        `축의금 계좌 안내해드릴게요!`,
        `마음만 받을게요, 근데 계좌는 여기요!`,
      ]},
      rsvp: { section: "rsvp-section", messages: [
        `잠시만요! 참석 여부 좀 알려주세요!`,
        `밥 준비해야 해서요, 꼭 체크해주세요!`,
      ]},
      guestbook: { section: "guestbook-section", messages: [
        `여기요! 축하 한마디 남겨주실래요?`,
        `짧아도 괜찮아요, 평생 간직할게요!`,
      ]},
    };
  };

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
    if (aiMode !== "active") return;

    const toastMessages = getToastMessages();

    const handleScroll = () => {
      for (const key of Object.keys(toastMessages)) {
        if (dismissedToasts.has(key)) continue;
        const config = toastMessages[key];
        if (!config || config.messages.length === 0) continue;
        
        const el = document.getElementById(config.section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * (key === "guestbook" ? 0.8 : 0.6) && rect.bottom > window.innerHeight * 0.2) {
            if (activeToast !== key) {
              const randomMsg = config.messages[Math.floor(Math.random() * config.messages.length)];
              setActiveToastMessage(randomMsg);
              setActiveToast(key);
            }
            return;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [aiMode, dismissedToasts, activeToast, wedding]);

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
            if (secrets.groomDrinkingHabit) secretContent = `${groomName}의 술버릇: ${secrets.groomDrinkingHabit}`;
            else secretContent = '아직 등록된 비밀이 없어요.';
          } else {
            if (secrets.brideDrinkingHabit) secretContent = `${brideName}의 술버릇: ${secrets.brideDrinkingHabit}`;
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
            className="fixed bottom-20 right-6 z-50 max-w-[260px] bg-white rounded-xl shadow-lg border border-stone-200 p-3"
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
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
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
