import { useEffect, useMemo, useState } from 'react';
import { API, getHeaders } from './shared';

type CUser = { id: string; name: string; role: 'admin' | 'member' };
type Session = { id: string; title: string; mood?: string; summary?: string; updatedAt: string; memoryNote?: string };
type Msg = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string };

const QUICK = ['지금 좀 답답해요', '일 때문에 예민해요', '관계 때문에 지쳐요', '그냥 털어놓고 싶어요', '오늘 너무 무기력해요'];
const MOODS = ['anxious', 'angry', 'tired', 'sad', 'overwhelmed', 'okay'];

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

  const fetchUsers = async () => {
    const r = await fetch(`${API}/admin/counseling/users`, { headers });
    const data = await r.json();
    setUsers(data);
    if (!activeUserId && data[0]) setActiveUserId(data[0].id);
  };
  const fetchSessions = async (userId: string) => {
    const r = await fetch(`${API}/admin/counseling/sessions?userId=${userId}`, { headers });
    const data = await r.json();
    setSessions(data);
  };
  const openSession = async (id: string) => {
    const r = await fetch(`${API}/admin/counseling/sessions/${id}/messages`, { headers });
    const data = await r.json();
    setActiveSession(data.session);
    setMessages(data.messages || []);
    setMood(data.session?.mood || 'okay');
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { if (activeUserId) fetchSessions(activeUserId); }, [activeUserId]);

  const createSession = async () => {
    const r = await fetch(`${API}/admin/counseling/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId: activeUserId, mood, title: '오늘 상담' }),
    });
    const s = await r.json();
    await fetchSessions(activeUserId);
    openSession(s.id);
  };

  const send = async (text?: string) => {
    if (!activeSession) return;
    const content = (text || input).trim();
    if (!content) return;
    setLoading(true);
    setInput('');
    await fetch(`${API}/admin/counseling/sessions/${activeSession.id}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content }),
    });
    await openSession(activeSession.id);
    setLoading(false);
  };

  const stressKeywords = useMemo(() => {
    const text = messages.filter((m) => m.role === 'user').map((m) => m.content).join(' ');
    const seeds = ['불안', '압박', '피곤', '돈', '관계', '무기력', '예민'];
    return seeds.filter((k) => text.includes(k));
  }, [messages]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 space-y-3">
        <div className="bg-white rounded-xl border p-3">
          <p className="text-xs text-stone-500 mb-2">사용자</p>
          <div className="flex gap-2">
            {users.map((u) => (
              <button key={u.id} onClick={() => setActiveUserId(u.id)} className={`px-3 py-1.5 text-xs rounded-lg ${activeUserId === u.id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>{u.name}</button>
            ))}
          </div>
          <button onClick={createSession} className="mt-3 w-full text-xs py-2 rounded-lg bg-stone-900 text-white">새 상담 시작</button>
        </div>
        <div className="bg-white rounded-xl border p-3">
          <p className="text-xs text-stone-500 mb-2">상담 로그</p>
          <div className="space-y-2 max-h-[420px] overflow-auto">
            {sessions.map((s) => (
              <button key={s.id} onClick={() => openSession(s.id)} className={`w-full text-left p-2 rounded-lg border ${activeSession?.id === s.id ? 'border-stone-800 bg-stone-50' : 'border-stone-200'}`}>
                <p className="text-xs font-semibold text-stone-700">{s.title}</p>
                <p className="text-[11px] text-stone-500 mt-1">{s.summary || '요약 없음'}</p>
                <p className="text-[10px] text-stone-400 mt-1">{new Date(s.updatedAt).toLocaleString('ko-KR')}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-6 bg-white rounded-xl border p-4 flex flex-col">
        <p className="text-sm font-semibold text-stone-700 mb-3">상담심리 대화</p>
        <div className="flex-1 space-y-2 overflow-auto min-h-[480px]">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${m.role === 'user' ? 'ml-auto bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'}`}>
              {m.content}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="마음 상태를 편하게 적어보세요" />
          <button onClick={() => send()} disabled={loading} className="px-4 rounded-lg bg-stone-900 text-white text-sm">{loading ? '응답 중...' : '보내기'}</button>
        </div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {QUICK.map((q) => <button key={q} onClick={() => send(q)} className="text-xs px-2 py-1 bg-stone-100 rounded-lg">{q}</button>)}
        </div>
      </div>

      <div className="col-span-3 space-y-3">
        <div className="bg-white rounded-xl border p-3">
          <p className="text-xs text-stone-500 mb-2">오늘 감정</p>
          <div className="grid grid-cols-2 gap-2">
            {MOODS.map((m) => (
              <button key={m} onClick={() => setMood(m)} className={`text-xs px-2 py-1 rounded ${mood === m ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>{m}</button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-3">
          <p className="text-xs text-stone-500 mb-2">최근 요약</p>
          <p className="text-sm text-stone-700">{activeSession?.summary || '아직 요약이 없습니다.'}</p>
        </div>
        <div className="bg-white rounded-xl border p-3">
          <p className="text-xs text-stone-500 mb-2">스트레스 키워드</p>
          <div className="flex gap-2 flex-wrap">{stressKeywords.map((k) => <span key={k} className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700">{k}</span>)}</div>
        </div>
      </div>
    </div>
  );
}
