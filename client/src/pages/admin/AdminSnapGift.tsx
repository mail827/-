import { useState, useEffect } from 'react';
import { Gift, Plus, Copy, Check, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const TIERS = [
  { id: 'snap-3', label: '3장 세트', price: 5900 },
  { id: 'snap-5', label: '5장 세트', price: 9900 },
  { id: 'snap-10', label: '10장 세트', price: 14900 },
  { id: 'snap-20', label: '20장 세트', price: 24900 },
];

export default function AdminSnapGift() {
  const token = localStorage.getItem('token');
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tier: 'snap-10', toEmail: '', toPhone: '', message: '', customCode: '' });
  const [copied, setCopied] = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => { loadGifts(); }, []);

  const loadGifts = async () => {
    const res = await fetch(`${API}/snap-gift/admin/list`, { headers });
    if (res.ok) setGifts(await res.json());
    setLoading(false);
  };

  const createFree = async () => {
    setCreating(true);
    const res = await fetch(`${API}/snap-gift/admin/create-free`, {
      method: 'POST', headers,
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.code) {
      await loadGifts();
      setShowForm(false);
      setForm({ tier: 'snap-10', toEmail: '', toPhone: '', message: '', customCode: '' });
      copyCode(data.code);
    }
    setCreating(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-stone-400 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-800">AI 스냅 선물 관리</h2>
          <p className="text-sm text-stone-400 mt-1">무료 선물 코드를 발급하고 관리합니다</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-xl text-sm hover:bg-stone-900 transition-all">
          <Plus className="w-4 h-4" /> 무료 발급
        </button>
      </div>

      {showForm && (
        <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6 space-y-4">
          <div>
            <label className="text-xs text-stone-500 mb-1 block">티어</label>
            <div className="grid grid-cols-4 gap-2">
              {TIERS.map(t => (
                <button key={t.id} onClick={() => setForm({ ...form, tier: t.id })}
                  className={`py-2 rounded-xl text-sm transition-all ${form.tier === t.id ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">이메일 (선택)</label>
              <input value={form.toEmail} onChange={e => setForm({ ...form, toEmail: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400" placeholder="receiver@email.com" />
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">전화번호 (선택)</label>
              <input value={form.toPhone} onChange={e => setForm({ ...form, toPhone: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400" placeholder="010-0000-0000" />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">커스텀 코드 (선택, 비워두면 랜덤)</label>
            <input value={form.customCode} onChange={e => setForm({ ...form, customCode: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:border-stone-400" placeholder="SNAP-XXXXXXXX" />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">메시지 (선택)</label>
            <input value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400" placeholder="축하 메시지..." />
          </div>
          <button onClick={createFree} disabled={creating}
            className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-900 disabled:opacity-50 flex items-center justify-center gap-2">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
            무료 선물 코드 발급
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">코드</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">티어</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">받는 사람</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">유형</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">상태</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">날짜</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {gifts.map(g => {
              const tier = TIERS.find(t => t.id === g.tier);
              return (
                <tr key={g.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{g.code}</td>
                  <td className="px-4 py-3">{tier?.label || g.tier}</td>
                  <td className="px-4 py-3 text-stone-500">{g.toEmail || g.toPhone || g.toUser?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${g.isFree ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
                      {g.isFree ? '무료' : '유료'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${g.isRedeemed ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'}`}>
                      {g.isRedeemed ? '사용됨' : '미사용'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{new Date(g.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => copyCode(g.code)} className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors">
                      {copied === g.code ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                    </button>
                  </td>
                </tr>
              );
            })}
            {gifts.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-stone-400">아직 발급된 선물이 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
