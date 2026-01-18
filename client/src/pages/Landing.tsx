import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MessageCircle, X, Send, Sparkles, Mail, Loader2 } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  features: string[];
}

interface ChatAction { type: 'button' | 'link'; label: string; action: string; url?: string; style?: 'primary' | 'secondary' | 'kakao'; }

interface ChatMessage {
  role: 'user' | 'assistant';
  actions?: ChatAction[];
  content: string;
}

export default function Landing() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [reviews, setReviews] = useState<{id: string; rating: number; content: string; source: string; groomName: string; brideName: string; packageName: string | null; createdAt: string}[]>([]);
  const [guides, setGuides] = useState<{id: string; title: string; description: string | null; videoUrl: string; category: string}[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<{id: string; title: string; description: string | null; videoUrl: string; category: string} | null>(null);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [emailStep, setEmailStep] = useState<'email' | 'code' | 'password' | 'setPassword'>('email');
  const [passwordInput, setPasswordInput] = useState('');
  const [_isNewUser, setIsNewUser] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const isLoggedIn = !!localStorage.getItem('token');
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', type: 'general', message: '' });
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '안녕하세요! 청첩장 작업실 웨딩이예요 💕\n\n결혼 준비하시나요? 축하드려요!\n궁금한 거 있으시면 편하게 물어보세요~' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [visitorId] = useState(() => localStorage.getItem('visitorId') || `visitor_${Date.now()}`);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('visitorId', visitorId);
    fetchPackages();
    fetchReviews();
    fetchGuides();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (chatOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [chatOpen]);

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/payment/packages`);
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch (e) {
      console.error('Failed to fetch packages:', e);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/public/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (e) {
      console.error("Failed to fetch reviews:", e);
    }
  };


  const fetchGuides = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/guide`);
      if (res.ok) {
        const data = await res.json();
        setGuides(data);
      }
    } catch (e) {
      console.error("Failed to fetch guides:", e);
    }
  };
  const submitInquiry = async () => {
    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.message) return;
    setInquirySending(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/public/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryForm),
      });
      if (res.ok) {
        setInquirySuccess(true);
        setInquiryForm({ name: '', email: '', phone: '', type: 'general', message: '' });
        setTimeout(() => {
          setShowInquiryForm(false);
          setInquirySuccess(false);
        }, 2000);
      }
    } catch (e) {
      console.error('Inquiry error:', e);
    } finally {
      setInquirySending(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, visitorId }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.message, actions: data.actions }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '죄송해요, 잠시 문제가 생겼어요. 다시 시도해주세요!' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleLogin = (provider: 'kakao' | 'google') => {
    window.location.href = `${import.meta.env.VITE_API_URL}/oauth/${provider}`;
  };

  const handleCheckEmail = async () => {
    if (!emailInput || !emailInput.includes('@')) { setEmailError('유효한 이메일을 입력해주세요'); return; }
    setEmailLoading(true); setEmailError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/email-auth/check-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailInput }) });
      const data = await res.json();
      if (data.exists && data.hasPassword) { setIsNewUser(false); setEmailStep('password'); }
      else { setIsNewUser(true); await handleSendCode(); }
    } catch { setEmailError('네트워크 오류가 발생했습니다'); } finally { setEmailLoading(false); }
  };

  const handleSendCode = async () => {
    setEmailLoading(true); setEmailError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/email-auth/send-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailInput }) });
      if (res.ok) { setEmailStep('code'); } else { const data = await res.json(); setEmailError(data.error || '발송 실패'); }
    } catch { setEmailError('네트워크 오류'); } finally { setEmailLoading(false); }
  };

  const handleVerifyCode = async () => {
    if (codeInput.length !== 6) { setEmailError('6자리 인증번호를 입력해주세요'); return; }
    setEmailLoading(true); setEmailError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/email-auth/verify-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailInput, code: codeInput }) });
      const data = await res.json();
      if (res.ok && data.verified) { setEmailStep('setPassword'); } else { setEmailError(data.error || '인증 실패'); }
    } catch { setEmailError('네트워크 오류'); } finally { setEmailLoading(false); }
  };

  const handleEmailLogin = async () => {
    if (!passwordInput) { setEmailError('비밀번호를 입력해주세요'); return; }
    setEmailLoading(true); setEmailError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/email-auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailInput, password: passwordInput }) });
      const data = await res.json();
      if (res.ok) { localStorage.setItem('token', data.token); window.location.href = '/dashboard'; } else { setEmailError(data.error || '로그인 실패'); }
    } catch { setEmailError('네트워크 오류'); } finally { setEmailLoading(false); }
  };

  const handleRegister = async () => {
    if (!passwordInput || passwordInput.length < 6) { setEmailError('비밀번호는 6자 이상이어야 합니다'); return; }
    setEmailLoading(true); setEmailError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/email-auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailInput, password: passwordInput }) });
      const data = await res.json();
      if (res.ok) { localStorage.setItem('token', data.token); window.location.href = '/dashboard'; } else { setEmailError(data.error || '회원가입 실패'); }
    } catch { setEmailError('네트워크 오류'); } finally { setEmailLoading(false); }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#fefefe]">
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1920')] bg-cover bg-center opacity-[0.07]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative text-center max-w-2xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full mb-8 border border-stone-200"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-stone-600">AI 컨시어지 탑재</span>
          </motion.div>
          
          <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-stone-800 mb-6 leading-tight">
            언제까지 <span className="text-rose-400">3초 보고 닫히는</span><br />
            링크를 보내시겠습니까?
          </h1>
          
          <p className="text-lg text-stone-500 mb-2">
            아름다운 영상 위로,
          </p>
          <p className="text-lg text-stone-700 mb-12">
            똑똑한 비서가 마중 나갈게요.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => scrollToSection("reviews")}
              className="px-8 py-4 bg-stone-800 text-white rounded-full text-sm tracking-wide hover:bg-stone-700 transition-all flex items-center justify-center gap-2"
            >
              <span>고객 후기 보기</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </motion.button>
            
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLogin("kakao")}
              className="px-8 py-4 bg-[#FEE500] text-stone-800 rounded-full text-sm tracking-wide hover:shadow-lg transition-all flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.8 5.108 4.514 6.467-.144.521-.926 3.354-.964 3.587 0 0-.02.167.088.231.108.064.235.015.235.015.31-.044 3.592-2.34 4.158-2.74.639.092 1.3.14 1.969.14 5.523 0 10-3.463 10-7.7C22 6.463 17.523 3 12 3z"/>
              </svg>
              카카오로 시작하기
            </motion.button>
            
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLogin("google")}
              className="px-8 py-4 bg-white border border-stone-200 text-stone-700 rounded-full text-sm tracking-wide hover:shadow-lg transition-all flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 시작하기
            </motion.button>
          </div>
          
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            onClick={() => setShowEmailLogin(true)}
            className="mt-4 text-stone-400 hover:text-stone-600 text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <Mail className="w-4 h-4" />
            이메일로 시작하기
          </motion.button>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-8 text-stone-400 text-sm"
          >
            3분 만에 완성되는 시네마틱 AI 청첩장
          </motion.p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-stone-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </motion.div>
        </motion.div>
      </section>

      <section id="features" className="py-32 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="text-sm tracking-[0.2em] text-stone-400 mb-4">WHY US</p>
            <h2 className="font-serif text-3xl text-stone-800">왜 청첩장 작업실인가요?</h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: '✨', title: '감각적인 디자인', desc: '트렌디하면서도 클래식한\n8가지 테마' },
              { icon: '⚡', title: '빠른 제작', desc: 'Lite는 5분 만에\n즉시 발행 가능' },
              { icon: '👴🏻', title: '어르신 배려', desc: '큰 글씨와 심플한 구성의\n어르신용 테마' },
              { icon: '💌', title: '간편한 공유', desc: '카카오톡, 문자, 인스타그램\n한 번에 공유' },
              { icon: '📊', title: 'RSVP 관리', desc: '참석 여부를\n한눈에 확인' },
              { icon: '🤖', title: 'AI 컨시어지', desc: '하객과 대화하는\n살아있는 청첩장' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl mb-6">{item.icon}</div>
                <h3 className="text-lg text-stone-800 mb-3">{item.title}</h3>
                <p className="text-stone-500 text-sm whitespace-pre-line leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews" className="py-32 px-4 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm tracking-[0.2em] text-stone-400 mb-4">REVIEWS</p>
            <h2 className="font-serif text-3xl text-stone-800 mb-4">고객님들의 후기</h2>
            <p className="text-stone-500">실제 사용하신 분들의 생생한 이야기</p>
          </motion.div>
          
{reviews.length > 0 ? (
  <div className="relative">
    <div 
      className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 -mx-4 px-4"
      style={{ scrollBehavior: 'smooth' }}
    >
      {reviews.map((review, i) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="min-w-[240px] max-w-[240px] bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex-shrink-0 snap-start"
        >
          <div className="flex gap-0.5 mb-2">
            {[...Array(5)].map((_, j) => (
              <svg key={j} className={`w-3 h-3 ${j < review.rating ? "text-yellow-400 fill-yellow-400" : "text-stone-200"}`} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
  {review.packageName && (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-600">
      {review.packageName}
    </span>
  )}
  {review.source === 'AI_REPORT' && (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-violet-50 text-violet-600">
      AI 리포트
    </span>
  )}
</div>
          <p className="text-stone-700 text-xs leading-relaxed mb-3 line-clamp-3">{review.content || "정말 만족스러웠어요!"}</p>
          <div className="flex items-center justify-between text-[10px] text-stone-400">
            <span>{review.groomName} & {review.brideName}</span>
            <span>{new Date(review.createdAt).toLocaleDateString("ko-KR")}</span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
) : (
  <div className="text-center py-12">
    <p className="text-stone-400">아직 등록된 후기가 없습니다</p>
  </div>
)}
        </div>
      </section>

      {guides.length > 0 && (
        <section id="how-to-use" className="py-32 px-4 bg-stone-50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-4">이용 방법</h2>
              <p className="text-stone-500">청첩장 작업실, 이렇게 사용하세요</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide, index) => (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedGuide(guide)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="aspect-video bg-stone-100 relative overflow-hidden">
                    <video
                      src={guide.videoUrl}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      muted
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-stone-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-stone-800 mb-2">{guide.title}</h3>
                    {guide.description && (
                      <p className="text-sm text-stone-500">{guide.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 가이드 영상 모달 */}
      <AnimatePresence>
        {selectedGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedGuide(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-stone-100">
                <h3 className="font-semibold text-stone-800">{selectedGuide.title}</h3>
                <button
                  onClick={() => setSelectedGuide(null)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              <div className="flex-1 bg-black flex items-center justify-center">
                <video
                  src={selectedGuide.videoUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh]"
                />
              </div>
              {selectedGuide.description && (
                <div className="p-4 border-t border-stone-100">
                  <p className="text-sm text-stone-500">{selectedGuide.description}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section id="pricing" className="py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="text-sm tracking-[0.2em] text-stone-400 mb-4">PRICING</p>
            <h2 className="font-serif text-3xl text-stone-800">요금 안내</h2>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {packages.map((pkg, idx) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`relative bg-white rounded-2xl p-5 border transition-all hover:shadow-xl ${
                  pkg.slug === 'ai-reception' 
                    ? 'border-stone-800 shadow-lg' 
                    : pkg.slug === 'basic-video' 
                      ? 'border-stone-800 shadow-lg' 
                      : 'border-stone-200'
                }`}
              >
                {pkg.slug === 'ai-reception' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-stone-800 text-white text-xs rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> NEW
                  </div>
                )}
                {pkg.slug === 'basic-video' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-stone-800 text-white text-xs rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 추천
                  </div>
                )}
                
                <h3 className="text-lg font-medium text-stone-800 mb-1">{pkg.name}</h3>
                <p className="text-xs text-stone-500 mb-4 h-8">{pkg.description}</p>
                
                <div className="mb-4">
                  <span className="text-2xl font-light text-stone-800">
                    {pkg.price.toLocaleString()}
                  </span>
                  <span className="text-stone-400 text-xs">원</span>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {pkg.features.slice(0, 6).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-stone-600">
                      <Check className="w-3.5 h-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {pkg.features.length > 6 && (
                    <li className="text-xs text-stone-400 pl-5">+{pkg.features.length - 6}개 더</li>
                  )}
                </ul>
                
                <button
                  onClick={() => setShowLoginModal(true)}
                  className={`w-full py-2.5 rounded-full text-sm transition-all ${
                    pkg.slug === 'ai-reception'
                      ? 'bg-stone-800 text-white hover:bg-stone-900'
                      : pkg.slug === 'basic-video'
                        ? 'bg-stone-800 text-white hover:bg-stone-900'
                        : 'border border-stone-300 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  시작하기
                </button>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 md:p-12"
          >
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-sm tracking-[0.2em] text-stone-500 mb-4">CUSTOM SERVICE</p>
              <h3 className="font-serif text-2xl md:text-3xl text-white mb-6">
                당신이 원하는 청첩장 + 시네마틱 영상
              </h3>
              <p className="text-stone-400 mb-8 leading-relaxed">
                세상에 단 하나뿐인 청첩장을 만들어 드립니다<br />
                전담 매니저가 1:1로 함께합니다
              </p>
              
              <div className="flex flex-col items-center gap-6">
                
                <a
                  href="https://www.instagram.com/weddingstudiolab/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-10 py-4 bg-white text-stone-800 hover:bg-stone-100 rounded-full text-sm hover:opacity-90 transition-all inline-flex items-center justify-center gap-3 font-medium"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  문의하기 @weddingstudiolab
                </a>
                <div className="bg-white rounded-2xl p-4 inline-block">
                  <img src="/qr-instagram.png" alt="Instagram QR" className="w-32 h-32" />
                </div>
                <p className="text-stone-500 text-sm">QR 코드를 스캔하여 인스타그램으로 문의하세요</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-stone-100 relative bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="font-serif text-xl text-stone-800 mb-4">청첩장 작업실</p>
            <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
              <a href="/notice" className="text-stone-500 hover:text-stone-800 transition-colors">공지사항</a>
              <a href="/faq" className="text-stone-500 hover:text-stone-800 transition-colors">자주 묻는 질문</a>
              <a href="/terms" className="text-stone-500 hover:text-stone-800 transition-colors">이용약관</a>
              <a href="/privacy" className="text-stone-500 hover:text-stone-800 transition-colors">개인정보처리방침</a>
              <a href="/refund-policy" className="text-stone-500 hover:text-stone-800 transition-colors">환불정책</a>
            </div>
          </div>
          <div className="border-t border-stone-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-400">
              <div className="space-y-1">
                <p><span className="text-stone-500">상호</span> 이다겸</p>
                <p><span className="text-stone-500">대표</span> 이다겸</p>
                <p><span className="text-stone-500">사업자등록번호</span> 413-03-96815</p>
              </div>
              <div className="space-y-1">
                <p><span className="text-stone-500">주소</span> 부산광역시 부산진구 전포대로 224번길 22</p>
                <p><span className="text-stone-500">연락처</span> 010-2768-3187</p>
                <p><span className="text-stone-500">이메일</span> mail@weddingshop.cloud</p>
                <p><span className="text-stone-500">통신판매업신고</span> 제2026-부산진-0007741호</p>
              </div>
            </div>
            <p className="text-center text-xs text-stone-300 mt-6">Made with love by 청첩장 작업실</p>
          </div>
        </div>
      </footer>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-stone-800 text-white rounded-full shadow-lg flex items-center justify-center z-50 md:w-auto md:px-6 md:gap-2"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden md:inline text-sm">상담하기</span>
      </motion.button>

      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              id="chat-modal" className="fixed inset-0 h-[100dvh] md:inset-auto md:h-[520px] md:bottom-24 md:right-6 md:w-[380px] md:h-[520px] bg-white md:rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden rounded-t-3xl"
            >
              <div className="p-4 bg-stone-800 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg">💕</div>
                  <div>
                    <p className="font-medium">웨딩이</p>
                    <p className="text-xs text-stone-400">청첩장 상담 AI</p>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%]">
                      <div className={`p-4 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                        msg.role === "user"
                          ? "bg-stone-800 text-white rounded-br-sm"
                          : "bg-stone-100 text-stone-700 rounded-bl-sm"
                      }`}>
                        {msg.content}
                      </div>
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.actions.map((act, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                if (act.action === "external") window.open(act.url, "_blank");
                                else if (act.action === "navigate") window.location.href = act.url || "/";
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                act.style === "primary" ? "bg-stone-800 text-white hover:bg-stone-900" :
                                act.style === "kakao" ? "bg-[#FEE500] text-[#191919] hover:bg-[#FDD800]" :
                                "bg-white text-stone-700 border border-stone-300 hover:bg-stone-50"
                              }`}
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-stone-100 p-4 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <div className="p-4 border-t border-stone-100 shrink-0">
                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      if (confirm('로그인이 필요한 서비스입니다. 로그인 하시겠습니까?')) {
                        window.location.href = '/dashboard';
                      }
                    } else {
                      setShowInquiryForm(true);
                    }
                  }}
                  className="w-full mb-3 py-2 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                >
                  💬 1:1 문의하기
                </button>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onFocus={() => window.scrollTo(0, 0)}
                    onKeyPress={(e) => e.key === "Enter" && sendChat()}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 px-4 py-3 bg-stone-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                  <button
                    onClick={sendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="w-12 h-12 bg-stone-800 text-white rounded-full flex items-center justify-center hover:bg-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-medium text-stone-800 mb-2 text-center">로그인</h3>
            <p className="text-sm text-stone-500 mb-6 text-center">청첩장 제작을 시작해보세요</p>
            <div className="space-y-3">
              <button
                onClick={() => { setShowLoginModal(false); handleLogin('kakao'); }}
                className="w-full py-3 bg-[#FEE500] text-[#3C1E1E] rounded-xl font-medium flex items-center justify-center gap-2 hover:brightness-95 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.3 4.54 6.7-.2.74-.73 2.64-.84 3.05-.13.5.18.5.39.36.16-.1 2.59-1.76 3.63-2.47.74.1 1.5.16 2.28.16 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/></svg>
                카카오로 시작하기
              </button>
              <button
                onClick={() => { setShowLoginModal(false); handleLogin('google'); }}
                className="w-full py-3 bg-white border border-stone-200 text-stone-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-stone-50 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google로 시작하기
              </button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-stone-400">또는</span></div>
              </div>
              <button
                onClick={() => { setShowLoginModal(false); setShowEmailLogin(true); }}
                className="w-full py-3 border border-stone-300 text-stone-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-stone-50 transition"
              >
                <Mail className="w-5 h-5" />
                이메일로 시작하기
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmailLogin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowEmailLogin(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-6 relative"
          >
            <button onClick={() => { setShowEmailLogin(false); setEmailStep('email'); setEmailInput(''); setCodeInput(''); setPasswordInput(''); setEmailError(''); }} className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="w-6 h-6 text-stone-600" /></div>
              <h3 className="text-xl font-medium text-stone-800">{emailStep === 'setPassword' ? '비밀번호 설정' : emailStep === 'password' ? '로그인' : '이메일로 시작하기'}</h3>
              <p className="text-sm text-stone-500 mt-1">{emailStep === 'email' ? '이메일을 입력해주세요' : emailStep === 'code' ? '인증번호를 입력해주세요' : emailStep === 'password' ? '비밀번호를 입력해주세요' : '사용할 비밀번호를 설정해주세요'}</p>
            </div>
            {emailStep === 'email' && (
              <div className="space-y-4">
                <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="이메일 주소" className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm" onKeyPress={(e) => e.key === 'Enter' && handleCheckEmail()} />
                {emailError && <p className="text-sm text-rose-500">{emailError}</p>}
                <button onClick={handleCheckEmail} disabled={emailLoading} className="w-full py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-900 disabled:opacity-50 flex items-center justify-center gap-2">{emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}계속하기</button>
              </div>
            )}
            {emailStep === 'password' && (
              <div className="space-y-4">
                <p className="text-sm text-stone-500 text-center mb-2">{emailInput}</p>
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="비밀번호" className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm" onKeyPress={(e) => e.key === 'Enter' && handleEmailLogin()} />
                {emailError && <p className="text-sm text-rose-500">{emailError}</p>}
                <button onClick={handleEmailLogin} disabled={emailLoading} className="w-full py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-900 disabled:opacity-50 flex items-center justify-center gap-2">{emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}로그인</button>
                <button onClick={() => { setEmailStep('email'); setPasswordInput(''); setEmailError(''); }} className="w-full py-2 text-sm text-stone-500 hover:text-stone-700">다른 이메일로 변경</button>
              </div>
            )}
            {emailStep === 'code' && (
              <div className="space-y-4">
                <p className="text-sm text-stone-500 text-center mb-2">{emailInput}</p>
                <input type="text" value={codeInput} onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="인증번호 6자리" className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm text-center text-2xl tracking-[0.5em]" onKeyPress={(e) => e.key === 'Enter' && handleVerifyCode()} />
                {emailError && <p className="text-sm text-rose-500 text-center">{emailError}</p>}
                <button onClick={handleVerifyCode} disabled={emailLoading || codeInput.length !== 6} className="w-full py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-900 disabled:opacity-50 flex items-center justify-center gap-2">{emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}확인</button>
                <button onClick={handleSendCode} disabled={emailLoading} className="w-full py-2 text-sm text-stone-500 hover:text-stone-700">인증번호 다시 받기</button>
              </div>
            )}
            {emailStep === 'setPassword' && (
              <div className="space-y-4">
                <p className="text-sm text-stone-500 text-center mb-2">{emailInput}</p>
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="비밀번호 (6자 이상)" className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm" onKeyPress={(e) => e.key === 'Enter' && handleRegister()} />
                {emailError && <p className="text-sm text-rose-500">{emailError}</p>}
                <button onClick={handleRegister} disabled={emailLoading || passwordInput.length < 6} className="w-full py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-900 disabled:opacity-50 flex items-center justify-center gap-2">{emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}회원가입 완료</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
      {showInquiryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            {inquirySuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">문의가 접수되었습니다</h3>
                <p className="text-stone-500">빠른 시일 내에 답변 드릴게요!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-stone-800">1:1 문의</h3>
                  <button onClick={() => setShowInquiryForm(false)} className="p-2 hover:bg-stone-100 rounded-full">
                    <X className="w-5 h-5 text-stone-500" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">이름 *</label>
                    <input
                      type="text"
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                      placeholder="홍길동"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">이메일 *</label>
                    <input
                      type="email"
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                      placeholder="example@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">연락처</label>
                    <input
                      type="tel"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                      placeholder="010-1234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">문의 유형</label>
                    <select
                      value={inquiryForm.type}
                      onChange={(e) => setInquiryForm({...inquiryForm, type: e.target.value})}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                    >
                      <option value="general">일반 문의</option>
                      <option value="custom">커스텀 청첩장</option>
                      <option value="video">영상 문의</option>
                      <option value="payment">결제 문의</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">문의 내용 *</label>
                    <textarea
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800 h-32 resize-none"
                      placeholder="문의하실 내용을 자세히 적어주세요"
                    />
                  </div>
                  <button
                    onClick={submitInquiry}
                    disabled={inquirySending || !inquiryForm.name || !inquiryForm.email || !inquiryForm.message}
                    className="w-full py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inquirySending ? '전송 중...' : '문의하기'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
