import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle } from 'lucide-react';
import { at } from '../utils/appI18n';
import { useLocaleStore } from '../store/useLocaleStore';

interface ChatAction {
  label: string;
  action: string;
  url?: string;
  style?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: ChatAction[];
}

interface Props {
  isLoggedIn?: boolean;
  userEmail?: string;
  userName?: string;
}

export default function ChatWidget({ isLoggedIn = false, userEmail = "", userName = "" }: Props) {
  const { locale: cl } = useLocaleStore();
  const [visitorId] = useState(() => {
    const stored = localStorage.getItem("chatVisitorId");
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem("chatVisitorId", id);
    return id;
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: at('chatBotGreeting', cl).replace(/\\n/g, '\n') }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', type: 'general', message: '' });
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message,
        actions: data.actions 
      }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: at('chatError', cl) }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-stone-800 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-stone-900 transition-colors z-40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-6 h-6" />
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
              className="fixed inset-x-0 bottom-0 h-[85vh] md:inset-auto md:bottom-24 md:right-6 md:w-[380px] md:h-[520px] bg-white md:rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden rounded-t-3xl"
            >
              <div className="p-4 bg-stone-800 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg">💕</div>
                  <div>
                    <p className="font-medium">{at('chatBotName', cl)}</p>
                    <p className="text-xs text-stone-400">{at('chatBotSub', cl)}</p>
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
                      if (confirm(at('chatLoginRequired', cl))) {
                        window.location.href = '/dashboard';
                      }
                    } else {
                      setInquiryForm(prev => ({ ...prev, name: userName, email: userEmail }));
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
                    onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                    placeholder={at('chatInputPh', cl)}
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
                <h3 className="text-xl font-bold text-stone-800 mb-2">{at('inquirySuccess', cl)}</h3>
                <p className="text-stone-500">{at('inquirySuccessDesc', cl)}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-stone-800">{at('inquiryTitle', cl)}</h3>
                  <button onClick={() => setShowInquiryForm(false)} className="p-2 hover:bg-stone-100 rounded-full">
                    <X className="w-5 h-5 text-stone-500" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">{at('inquiryName', cl)}</label>
                    <input
                      type="text"
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                      placeholder="홍길동"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">{at('inquiryEmail', cl)}</label>
                    <input
                      type="email"
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                      placeholder="example@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">{at('inquiryPhone', cl)}</label>
                    <input
                      type="tel"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                      placeholder="010-1234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">{at('inquiryType', cl)}</label>
                    <select
                      value={inquiryForm.type}
                      onChange={(e) => setInquiryForm({...inquiryForm, type: e.target.value})}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                    >
                      <option value="general">{at('inquiryTypeGeneral', cl)}</option>
                      <option value="custom">{at('inquiryTypeCustom', cl)}</option>
                      <option value="video">{at('inquiryTypeVideo', cl)}</option>
                      <option value="payment">{at('inquiryTypePayment', cl)}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">{at('inquiryContent', cl)}</label>
                    <textarea
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800 h-32 resize-none"
                      placeholder={at('inquiryContentPh', cl)}
                    />
                  </div>
                  <button
                    onClick={submitInquiry}
                    disabled={inquirySending || !inquiryForm.name || !inquiryForm.email || !inquiryForm.message}
                    className="w-full py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inquirySending ? at('inquirySending', cl) : at('inquirySubmit', cl)}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
}
