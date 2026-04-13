import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Send, Plus, MessageCircle } from 'lucide-react';
import { API, getHeaders } from './shared';

type CUser = { id: string; name: string; role: 'admin' | 'member' };
type Session = { id: string; title: string; mood?: string; summary?: string; updatedAt: string; memoryNote?: string };
type Msg = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string };

const QUICK = [
  { text: '지금 좀 답답해요', emoji: '😤' },
  { text: '일 때문에 예민해요', emoji: '😣' },
  { text: '관계 때문에 지쳐요', emoji: '😔' },
  { text: '그냥 털어놓고 싶어요', emoji: '💭' },
  { text: '오늘 너무 무기력해요', emoji: '😶' },
];

const MOODS: Array<{ id: string; label: string; emoji: string }> = [
  { id: 'anxious', label: '불안', emoji: '😰' },
  { id: 'angry', label: '화남', emoji: '😠' },
  { id: 'tired', label: '피곤', emoji: '😩' },
  { id: 'sad', label: '슬픔', emoji: '😢' },
  { id: 'overwhelmed', label: '벅참', emoji: '🤯' },
  { id: 'okay', label: '괜찮아', emoji: '🙂' },
];

async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  const text = await res.text();
  throw new Error(text.slice(0, 180) || `HTTP ${res.status}`);
}

export default function TabCounseling() {
  const headers = getHeaders();
  const [users, setUsers] = useState<CUser[]>([]);
  const [activeUserId, setActiveUserId] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [mood, setMood] = useState('okay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [typedById, setTypedById] = useState<Record<string, string>>({});
  const [typingId, setTypingId] = useState<string | null>(null);
  const animatedIdsRef = useRef<Set<string>>(new Set());
  const typingTimerRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const clearTypingTimer = () => {
    if (typingTimerRef.current) { window.clearInterval(typingTimerRef.current); typingTimerRef.current = null; }
  };

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const fetchUsers = async () => {
    const r = await fetch(`${API}/admin/counseling/users`, { headers });
    const data = await safeJson(r);
    if (!r.ok) throw new Error(data?.error);
    const list = Array.isArray(data) ? data : [];
    setUsers(list);
    if (!activeUserId && list[0]?.id) setActiveUserId(list[0].id);
  };

  const fetchSessions = async (userId: string) => {
    if (!userId) return;
    const r = await fetch(`${API}/admin/counseling/sessions?userId=${encodeURIComponent(userId)}`, { headers });
    const data = await safeJson(r);
    if (!r.ok) throw new Error(data?.error);
    setSessions(Array.isArray(data) ? data : []);
  };

  const openSession = async (id?: string) => {
    if (!id) return;
    const r = await fetch(`${API}/admin/counseling/sessions/${id}/messages`, { headers });
    const data = await safeJson(r);
    if (!r.ok) throw new Error(data?.error);
    setActiveSession(data.session || null);
    setMessages(Array.isArray(data.messages) ? data.messages : []);
    setMood(data.session?.mood || 'okay');
    scrollToBottom();
  };

  const createSession = async () => {
    if (!activeUserId) throw new Error('사용자를 먼저 선택해 주세요.');
    const r = await fetch(`${API}/admin/counseling/sessions`, {
      method: 'POST', headers,
      body: JSON.stringify({ userId: activeUserId, mood, title: new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) + ' 상담' }),
    });
    const s = await safeJson(r);
    if (!r.ok) throw new Error(s?.error);
    await fetchSessions(activeUserId);
    await openSession(s.id);
    return s.id as string;
  };

  const ensureSession = async (): Promise<string> => {
    if (activeSession?.id) return activeSession.id;
    return createSession();
  };

  useEffect(() => { fetchUsers().catch((e: any) => setError(e?.message || '')); return () => clearTypingTimer(); }, []);
  useEffect(() => { if (activeUserId) fetchSessions(activeUserId).catch(() => {}); }, [activeUserId]);

  useEffect(() => {
    const assistantMsgs = messages.filter((m) => m.role === 'assistant');
    const last = assistantMsgs[assistantMsgs.length - 1];
    if (!last || animatedIdsRef.current.has(last.id)) return;
    clearTypingTimer();
    setTypingId(last.id);
    setTypedById((prev) => ({ ...prev, [last.id]: '' }));
    let i = 0;
    const full = last.content;
    typingTimerRef.current = window.setInterval(() => {
      i += 2;
      setTypedById((prev) => ({ ...prev, [last.id]: full.slice(0, i) }));
      if (i >= full.length) { clearTypingTimer(); animatedIdsRef.current.add(last.id); setTypingId(null); }
    }, 12);
    scrollToBottom();
    return () => clearTypingTimer();
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    try {
      setLoading(true);
      setError('');
      const sessionId = await ensureSession();
      setInput('');
      const r = await fetch(`${API}/admin/counseling/sessions/${sessionId}/messages`, {
        method: 'POST', headers, body: JSON.stringify({ content }),
      });
      const data = await safeJson(r);
      if (!r.ok) throw new Error(data?.error || '응답 실패');
      await openSession(sessionId);
    } catch (e: any) {
      setError(e?.message || '전송 실패');
    } finally {
      setLoading(false);
    }
  };

  const stressKeywords = useMemo(() => {
    const text = messages.filter((m) => m.role === 'user').map((m) => m.content).join(' ');
    const seeds = ['불안', '압박', '피곤', '돈', '관계', '무기력', '예민', '스트레스', '답답', '지침', '화남'];
    return seeds.filter((k) => text.includes(k));
  }, [messages]);

  const moodInfo = MOODS.find(m => m.id === mood) || MOODS[5];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-4 h-4 text-stone-500" />
          <span className="text-[10px] tracking-[0.15em] text-stone-400 font-medium">MENTAL CARE</span>
        </div>
        <p className="text-[12px] text-stone-400">마음이 힘들 때, 여기서 잠깐 쉬어가세요</p>
      </div>

      {!!error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-[13px] text-rose-700">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-3 space-y-3">
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="text-[10px] tracking-[0.1em] text-stone-400 mb-3">사용자</p>
            <div className="flex gap-2 flex-wrap">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setActiveUserId(u.id)}
                  className={`px-3 py-1.5 text-[12px] rounded-lg transition-all ${
                    activeUserId === u.id ? 'bg-stone-900 text-white font-medium' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {u.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => createSession().catch((e: any) => setError(e?.message || ''))}
              className="mt-3 w-full text-[12px] py-2.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800 flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              새 상담 시작
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="text-[10px] tracking-[0.1em] text-stone-400 mb-3">오늘 감정</p>
            <div className="grid grid-cols-3 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={`text-center py-2 rounded-lg transition-all ${
                    mood === m.id ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-base block">{m.emoji}</span>
                  <span className="text-[10px] mt-0.5 block">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="text-[10px] tracking-[0.1em] text-stone-400 mb-3">상담 기록</p>
            <div className="space-y-2 max-h-[280px] overflow-auto">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openSession(s.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    activeSession?.id === s.id
                      ? 'border-2 border-stone-800 bg-stone-50'
                      : 'border border-stone-100 hover:border-stone-300'
                  }`}
                >
                  <p className="text-[12px] font-semibold text-stone-700">{s.title}</p>
                  <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">{s.summary || '아직 대화가 없어요'}</p>
                  <p className="text-[10px] text-stone-300 mt-1.5">
                    {new Date(s.updatedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))}
              {sessions.length === 0 && <p className="text-[12px] text-stone-300 text-center py-4">아직 상담 기록이 없어요</p>}
            </div>
          </div>
        </div>

        <div className="xl:col-span-6 bg-white rounded-xl border border-stone-200 flex flex-col" style={{ minHeight: 520 }}>
          <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-stone-400" />
              <span className="text-[13px] font-semibold text-stone-700">
                {activeSession?.title || '새 대화를 시작해보세요'}
              </span>
            </div>
            <span className="text-base">{moodInfo.emoji}</span>
          </div>

          <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Heart className="w-8 h-8 text-stone-200 mb-3" />
                <p className="text-[13px] text-stone-400">편하게 이야기해주세요</p>
                <p className="text-[11px] text-stone-300 mt-1">아래 바로가기를 눌러도 좋아요</p>
              </div>
            )}
            {messages.map((m) => {
              const isUser = m.role === 'user';
              const typed = typedById[m.id];
              const content = isUser ? m.content : (typed ?? m.content);
              const isTypingThis = !isUser && typingId === m.id;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                      isUser
                        ? 'bg-stone-900 text-white rounded-2xl rounded-br-md'
                        : 'bg-stone-50 border border-stone-100 text-stone-700 rounded-2xl rounded-bl-md'
                    }`}
                  >
                    {content}
                    {isTypingThis && <span className="inline-block w-1.5 h-4 ml-0.5 bg-stone-400 animate-pulse rounded-sm" />}
                  </div>
                </motion.div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-stone-50 border border-stone-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5">
                    {[0, 150, 300].map(delay => (
                      <span key={delay} className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-5 py-3 border-t border-stone-100">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {QUICK.map((q) => (
                <button
                  key={q.text}
                  onClick={() => send(q.text)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-full text-[11px] text-stone-500 hover:bg-stone-100 whitespace-nowrap flex-shrink-0 disabled:opacity-40"
                >
                  <span>{q.emoji}</span>
                  {q.text}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                className="flex-1 border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-stone-400 placeholder:text-stone-300"
                placeholder="마음 상태를 편하게 적어보세요"
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="px-4 rounded-xl bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-3">
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="text-[10px] tracking-[0.1em] text-stone-400 mb-3">최근 요약</p>
            <p className="text-[13px] text-stone-600 leading-relaxed">
              {activeSession?.summary || '대화가 시작되면 요약이 여기에 나타나요'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="text-[10px] tracking-[0.1em] text-stone-400 mb-3">감지된 키워드</p>
            <div className="flex gap-2 flex-wrap">
              {stressKeywords.map((k) => (
                <span key={k} className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{k}</span>
              ))}
              {stressKeywords.length === 0 && <span className="text-[12px] text-stone-300">아직 감지된 키워드가 없어요</span>}
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl border border-stone-100 p-4">
            <p className="text-[10px] tracking-[0.1em] text-stone-400 mb-2">안내</p>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              이 상담은 AI 기반 코칭입니다. 의료 진단이나 치료를 대체하지 않습니다. 긴급한 경우 정신건강상담전화 1393으로 연락해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
