import { useEffect, useMemo, useRef, useState } from 'react';
import { API, getHeaders } from './shared';

type CUser = { id: string; name: string; role: 'admin' | 'member' };
type Session = { id: string; title: string; mood?: string; summary?: string; updatedAt: string; memoryNote?: string };
type Msg = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string };

const QUICK = ['지금 좀 답답해요', '일 때문에 예민해요', '관계 때문에 지쳐요', '그냥 털어놓고 싶어요', '오늘 너무 무기력해요'];
const MOODS = ['anxious', 'angry', 'tired', 'sad', 'overwhelmed', 'okay'];

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
  const [modelFailed, setModelFailed] = useState(false);

  const [typedById, setTypedById] = useState<Record<string, string>>({});
  const [typingId, setTypingId] = useState<string | null>(null);
  const animatedIdsRef = useRef<Set<string>>(new Set());
  const typingTimerRef = useRef<number | null>(null);

  const clearTypingTimer = () => {
    if (typingTimerRef.current) {
      window.clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  };

  const fetchUsers = async () => {
    const r = await fetch(`${API}/admin/counseling/users`, { headers });
    const data = await safeJson(r);
    if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

    const list = Array.isArray(data) ? data : [];
    setUsers(list);
    if (!activeUserId && list[0]?.id) setActiveUserId(list[0].id);
  };

  const fetchSessions = async (userId: string) => {
    if (!userId) return;

    const r = await fetch(`${API}/admin/counseling/sessions?userId=${encodeURIComponent(userId)}`, { headers });
    const data = await safeJson(r);
    if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

    setSessions(Array.isArray(data) ? data : []);
  };

  const openSession = async (id?: string) => {
    if (!id) return;

    const r = await fetch(`${API}/admin/counseling/sessions/${id}/messages`, { headers });
    const data = await safeJson(r);
    if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

    setActiveSession(data.session || null);
    setMessages(Array.isArray(data.messages) ? data.messages : []);
    setMood(data.session?.mood || 'okay');
  };

  const createSession = async () => {
    if (!activeUserId) throw new Error('사용자를 먼저 선택해 주세요.');

    const r = await fetch(`${API}/admin/counseling/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId: activeUserId, mood, title: '오늘 상담' }),
    });
    const s = await safeJson(r);
    if (!r.ok) throw new Error(s?.error || `HTTP ${r.status}`);
    if (!s?.id) throw new Error('세션 생성 실패(id 없음)');

    await fetchSessions(activeUserId);
    await openSession(s.id);

    return s.id as string;
  };

  const ensureSession = async (): Promise<string> => {
    if (activeSession?.id) return activeSession.id;
    return createSession();
  };

  useEffect(() => {
    fetchUsers().catch((e: any) => setError(e?.message || '사용자 조회 실패'));
    return () => clearTypingTimer();
  }, []);

  useEffect(() => {
    if (!activeUserId) return;
    fetchSessions(activeUserId).catch((e: any) => setError(e?.message || '세션 조회 실패'));
  }, [activeUserId]);

  useEffect(() => {
    const assistantMsgs = messages.filter((m) => m.role === 'assistant');
    const last = assistantMsgs[assistantMsgs.length - 1];
    if (!last) return;
    if (animatedIdsRef.current.has(last.id)) return;

    clearTypingTimer();
    setTypingId(last.id);
    setTypedById((prev) => ({ ...prev, [last.id]: '' }));

    let i = 0;
    const full = last.content;
    typingTimerRef.current = window.setInterval(() => {
      i += 1;
      setTypedById((prev) => ({ ...prev, [last.id]: full.slice(0, i) }));
      if (i >= full.length) {
        clearTypingTimer();
        animatedIdsRef.current.add(last.id);
        setTypingId(null);
      }
    }, 16);

    return () => clearTypingTimer();
  }, [messages]);

  const onCreateSessionClick = async () => {
    try {
      setModelFailed(false);
      setError('');
      await createSession();
    } catch (e: any) {
      setError(e?.message || '세션 생성 실패');
    }
  };

  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content) return;

    try {
      setLoading(true);
      setError('');
      setModelFailed(false);

      const sessionId = await ensureSession();
      setInput('');

      const r = await fetch(`${API}/admin/counseling/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content }),
      });
      const data = await safeJson(r);
      if (!r.ok) {
        if (data?.code === 'COUNSELING_MODEL_UNAVAILABLE' || r.status === 502) {
          setModelFailed(true);
          setActiveSession((prev) => (prev ? { ...prev, summary: undefined } : prev));
          throw new Error('상담 응답 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
        throw new Error(data?.error || `HTTP ${r.status}`);
      }

      await openSession(sessionId);
    } catch (e: any) {
      setError(e?.message || '메시지 전송 실패');
    } finally {
      setLoading(false);
    }
  };

  const stressKeywords = useMemo(() => {
    if (modelFailed) return [];
    const text = messages.filter((m) => m.role === 'user').map((m) => m.content).join(' ');
    const seeds = ['불안', '압박', '피곤', '돈', '관계', '무기력', '예민'];
    return seeds.filter((k) => text.includes(k));
  }, [messages, modelFailed]);

  return (
    <div className="space-y-3">
      {!!error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-3 space-y-3">
          <div className="bg-white rounded-xl border p-3">
            <p className="text-xs text-stone-500 mb-2">사용자</p>
            <div className="flex gap-2 flex-wrap">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setActiveUserId(u.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg ${activeUserId === u.id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
                >
                  {u.name}
                </button>
              ))}
            </div>
            <button onClick={onCreateSessionClick} className="mt-3 w-full text-xs py-2 rounded-lg bg-stone-900 text-white">
              새 상담 시작
            </button>
          </div>

          <div className="bg-white rounded-xl border p-3">
            <p className="text-xs text-stone-500 mb-2">상담 로그</p>
            <div className="space-y-2 max-h-[300px] xl:max-h-[420px] overflow-auto">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openSession(s.id)}
                  className={`w-full text-left p-2 rounded-lg border ${activeSession?.id === s.id ? 'border-stone-800 bg-stone-50' : 'border-stone-200'}`}
                >
                  <p className="text-xs font-semibold text-stone-700">{s.title}</p>
                  <p className="text-[11px] text-stone-500 mt-1">{s.summary || '요약 없음'}</p>
                  <p className="text-[10px] text-stone-400 mt-1">{new Date(s.updatedAt).toLocaleString('ko-KR')}</p>
                </button>
              ))}
              {sessions.length === 0 && <p className="text-xs text-stone-400">아직 상담 세션이 없습니다.</p>}
            </div>
          </div>
        </div>

        <div className="xl:col-span-6 bg-white rounded-xl border p-4 flex flex-col">
          <p className="text-sm font-semibold text-stone-700 mb-3">상담심리 대화</p>

          <div className="flex-1 space-y-3 overflow-auto min-h-[320px] xl:min-h-[480px]">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              const typed = typedById[m.id];
              const content = isUser ? m.content : (typed ?? m.content);
              const isTypingThis = !isUser && typingId === m.id;

              return (
                <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={[
                      'w-fit max-w-[88%] md:max-w-[80%]',
                      'px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words',
                      isUser ? 'bg-stone-900 text-white rounded-br-md' : 'bg-stone-100 text-stone-800 rounded-bl-md',
                    ].join(' ')}
                  >
                    {content}
                    {isTypingThis && <span className="inline-block w-2 ml-0.5 animate-pulse">|</span>}
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && <p className="text-xs text-stone-400">메시지가 없습니다. 바로 보내면 세션이 자동 생성됩니다.</p>}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="flex-1 border rounded-xl px-3 py-2 text-sm"
              placeholder="마음 상태를 편하게 적어보세요"
            />
            <button onClick={() => send()} disabled={loading} className="px-4 rounded-xl bg-stone-900 text-white text-sm disabled:opacity-50">
              {loading ? '응답 중...' : '보내기'}
            </button>
          </div>

          <div className="mt-2 flex gap-2 flex-wrap">
            {QUICK.map((q) => (
              <button key={q} onClick={() => send(q)} className="text-xs px-2.5 py-1.5 bg-stone-100 rounded-lg">
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-3 space-y-3">
          <div className="bg-white rounded-xl border p-3">
            <p className="text-xs text-stone-500 mb-2">오늘 감정</p>
            <div className="grid grid-cols-2 gap-2">
              {MOODS.map((m) => (
                <button key={m} onClick={() => setMood(m)} className={`text-xs px-2 py-1 rounded ${mood === m ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-3">
            <p className="text-xs text-stone-500 mb-2">최근 요약</p>
            <p className="text-sm text-stone-700">
              {modelFailed ? '상담 응답 생성 실패로 요약을 표시할 수 없습니다.' : (activeSession?.summary || '아직 요약이 없습니다.')}
            </p>
          </div>

          <div className="bg-white rounded-xl border p-3">
            <p className="text-xs text-stone-500 mb-2">스트레스 키워드</p>
            <div className="flex gap-2 flex-wrap">
              {stressKeywords.map((k) => <span key={k} className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700">{k}</span>)}
              {stressKeywords.length === 0 && <span className="text-xs text-stone-400">아직 없음</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
