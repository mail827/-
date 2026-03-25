import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Gift, Plus, X, Check, Copy, Film } from 'lucide-react';

interface VideoGiftItem {
  id: string;
  code: string;
  tier: string;
  toEmail: string | null;
  toPhone: string | null;
  message: string | null;
  isFree: boolean;
  isRedeemed: boolean;
  redeemedAt: string | null;
  amount: number;
  expiresAt: string;
  createdAt: string;
  fromUser?: { name: string; email: string } | null;
  toUser?: { name: string; email: string } | null;
}

const API = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem('token');

const TIER_LABELS: Record<string, string> = { basic: 'Basic', premium: 'Premium' };

export default function AdminVideoGifts() {
  const [gifts, setGifts] = useState<VideoGiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ tier: 'basic', toEmail: '', toPhone: '', message: '', customCode: '' });
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchGifts = async () => {
    setLoading(true);
    try {
      const res = await fetch(API + '/video-gift/admin/list', {
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      if (res.ok) setGifts(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchGifts(); }, []);

  const createFree = async () => {
    setCreating(true);
    try {
      const res = await fetch(API + '/video-gift/admin/create-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({
          tier: form.tier,
          toEmail: form.toEmail || undefined,
          toPhone: form.toPhone || undefined,
          message: form.message || undefined,
          customCode: form.customCode || undefined,
        }),
      });
      const data = await res.json();
      if (data.code) {
        alert('생성 완료: ' + data.code);
        setShowCreate(false);
        setForm({ tier: 'basic', toEmail: '', toPhone: '', message: '', customCode: '' });
        fetchGifts();
      } else alert(data.error || '실패');
    } catch { alert('실패'); }
    setCreating(false);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-800">식전영상 선물</h2>
          <p className="text-sm text-stone-400 mt-1">{gifts.length}건</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchGifts} className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50">
            <RefreshCw size={16} className="text-stone-500" />
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-900">
            <Plus size={14} /> 무료 선물 생성
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-800">무료 선물 코드 생성</h3>
            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-stone-100 rounded-lg"><X size={18} className="text-stone-400" /></button>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">패키지</p>
            <div className="flex gap-2">
              {(['basic', 'premium'] as const).map(t => (
                <button key={t} onClick={() => setForm(p => ({ ...p, tier: t }))} className={'flex-1 p-3 rounded-lg border text-center transition-all ' + (form.tier === t ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300')}>
                  <p className="text-sm font-medium text-stone-800">{TIER_LABELS[t]}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.toPhone} onChange={e => setForm(p => ({ ...p, toPhone: e.target.value }))} placeholder="받는 사람 번호 (선택)" className="px-4 py-2.5 rounded-lg border border-stone-200 text-sm focus:border-stone-400 outline-none" />
            <input value={form.toEmail} onChange={e => setForm(p => ({ ...p, toEmail: e.target.value }))} placeholder="받는 사람 이메일 (선택)" className="px-4 py-2.5 rounded-lg border border-stone-200 text-sm focus:border-stone-400 outline-none" />
          </div>
          <input value={form.customCode} onChange={e => setForm(p => ({ ...p, customCode: e.target.value.toUpperCase() }))} placeholder="커스텀 코드 (선택, 비우면 자동 생성)" className="w-full px-4 py-2.5 rounded-lg border border-stone-200 text-sm focus:border-stone-400 outline-none font-mono" />
          <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="메시지 (선택)" rows={2} className="w-full px-4 py-2.5 rounded-lg border border-stone-200 text-sm resize-none focus:border-stone-400 outline-none" />
          <button onClick={createFree} disabled={creating} className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm font-semibold disabled:opacity-30 flex items-center justify-center gap-2 hover:bg-stone-900">
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
            {creating ? '생성 중...' : '무료 코드 생성'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-stone-400" />
        </div>
      ) : gifts.length === 0 ? (
        <div className="text-center py-16">
          <Film size={32} className="mx-auto text-stone-300 mb-3" />
          <p className="text-sm text-stone-400">아직 선물이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gifts.map(g => (
            <div key={g.id} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-semibold text-stone-800">{g.code}</span>
                  <button onClick={() => copyCode(g.code, g.id)} className="p-1 hover:bg-stone-100 rounded">
                    {copiedId === g.id ? <Check size={12} className="text-green-600" /> : <Copy size={12} className="text-stone-400" />}
                  </button>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: g.isRedeemed ? '#dcfce715' : '#f59e0b15', color: g.isRedeemed ? '#16a34a' : '#f59e0b' }}>
                    {g.isRedeemed ? '사용됨' : '미사용'}
                  </span>
                  {g.isFree && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 font-medium">무료</span>}
                </div>
                <span className="text-xs text-stone-400">{formatDate(g.createdAt)}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-stone-400">
                <span>{TIER_LABELS[g.tier] || g.tier}</span>
                <span>{g.amount.toLocaleString()}원</span>
                {g.fromUser && <span>보낸: {g.fromUser.name}</span>}
                {g.toPhone && <span>받는: {g.toPhone}</span>}
                {g.toEmail && <span>받는: {g.toEmail}</span>}
                {g.toUser && <span>사용: {g.toUser.name}</span>}
                {g.redeemedAt && <span>사용일: {formatDate(g.redeemedAt)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
