import { useState, useEffect } from 'react';
import { Image, RefreshCw, Download, Eye, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

interface PosterOrder {
  id: string;
  track: string;
  status: string;
  amount: number;
  orderId: string;
  groomNameKr: string | null;
  brideNameKr: string | null;
  fontId: string;
  layout: string;
  conceptId: string | null;
  finalPosterUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

interface Stats { total: number; paid: number; done: number; failed: number; revenue: number; }

export default function AdminPoster() {
  const [orders, setOrders] = useState<PosterOrder[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, paid: 0, done: 0, failed: 0, revenue: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [tab, setTab] = useState<'orders' | 'gifts'>('orders');
  const [gifts, setGifts] = useState<any[]>([]);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftTrack, setGiftTrack] = useState<'PHOTO' | 'AI'>('PHOTO');
  const [giftEmail, setGiftEmail] = useState('');
  const [giftPhone, setGiftPhone] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const limit = 20;

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
      const q = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) q.set('status', statusFilter);
      const res = await fetch(`${API_BASE}/admin/poster/orders?${q}`, { headers });
      const data = await res.json();
      setOrders(data.orders || data);
      setTotal(data.total || data.length);
    } catch {}
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/poster/stats`, { headers });
      setStats(await res.json());
    } catch {}
  };

  const retry = async (orderId: string) => {
    try {
      await fetch(`${API_BASE}/admin/poster/retry`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      load();
    } catch {}
  };

  const loadGifts = async () => {
    try { const res = await fetch(`${API_BASE}/admin/poster/gifts`, { headers }); setGifts(await res.json()); } catch {}
  };

  const createGift = async () => {
    try {
      await fetch(`${API_BASE}/admin/poster/gift`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ track: giftTrack, toEmail: giftEmail || null, toPhone: giftPhone || null, message: giftMessage || null, isFree: true }) });
      setShowGiftModal(false); setGiftEmail(''); setGiftPhone(''); setGiftMessage(''); loadGifts();
    } catch {}
  };

  useEffect(() => { load(); loadStats(); loadGifts(); }, [page, statusFilter]);

  const statusColor: Record<string, string> = {
    PENDING: '#A8A8A0', PAID: '#6B9E78', GENERATING: '#D4A0B0',
    COMPOSITING: '#C4855C', DONE: '#2C8C6B', FAILED: '#C0392B',
  };
  const statusLabel: Record<string, string> = {
    PENDING: '\uB300\uAE30', PAID: '\uACB0\uC81C', GENERATING: '\uC0DD\uC131\uC911',
    COMPOSITING: '\uD569\uC131\uC911', DONE: '\uC644\uB8CC', FAILED: '\uC2E4\uD328',
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-800 mb-5 flex items-center gap-2">
        <Image size={20} />
        <span>{'\uC6E8\uB529\uD3EC\uC2A4\uD130 \uAD00\uB9AC'}</span>
      </h2>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('orders')} className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${tab === 'orders' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200'}`}>{'\uC8FC\uBB38'}</button>
        <button onClick={() => setTab('gifts')} className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${tab === 'gifts' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200'}`}>{'\uC120\uBB3C'}</button>
      </div>

      {tab === 'gifts' ? (
        <div>
          <button onClick={() => setShowGiftModal(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-800 text-white rounded-lg text-xs font-medium mb-4">
            <Plus size={14} />{'\uC120\uBB3C \uCF54\uB4DC \uC0DD\uC131'}
          </button>
          <div className="space-y-3 md:space-y-0">
            <div className="hidden md:block bg-white rounded-xl border border-stone-200 overflow-x-auto">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    {['\uCF54\uB4DC','\uD2B8\uB799','\uBC1B\uB294 \uC0AC\uB78C','\uBA54\uC2DC\uC9C0','\uC0AC\uC6A9','\uB9CC\uB8CC','\uC0DD\uC131\uC77C'].map(h =>
                      <th key={h} className="px-3 py-2.5 text-left font-medium text-stone-400 text-[11px]">{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {gifts.map(g => (
                    <tr key={g.id} className="border-b border-stone-100">
                      <td className="px-3 py-2.5 font-mono font-semibold text-[11px]">{g.code}</td>
                      <td className="px-3 py-2.5">{g.track}</td>
                      <td className="px-3 py-2.5">{g.toEmail || g.toPhone || '-'}</td>
                      <td className="px-3 py-2.5 text-stone-400">{g.message || '-'}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium text-white ${g.isRedeemed ? 'bg-green-600' : 'bg-stone-400'}`}>
                          {g.isRedeemed ? '\uC0AC\uC6A9\uB428' : '\uBBF8\uC0AC\uC6A9'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-stone-400">{new Date(g.expiresAt).toLocaleDateString('ko')}</td>
                      <td className="px-3 py-2.5 text-[11px] text-stone-400">{new Date(g.createdAt).toLocaleDateString('ko')}</td>
                    </tr>
                  ))}
                  {gifts.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-stone-300">{'\uC120\uBB3C \uCF54\uB4DC \uC5C6\uC74C'}</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {gifts.map(g => (
                <div key={g.id} className="bg-white rounded-xl border border-stone-200 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-xs">{g.code}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium text-white ${g.isRedeemed ? 'bg-green-600' : 'bg-stone-400'}`}>
                      {g.isRedeemed ? '\uC0AC\uC6A9\uB428' : '\uBBF8\uC0AC\uC6A9'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">{'\uD2B8\uB799'}</span>
                    <span className="text-stone-700">{g.track}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">{'\uBC1B\uB294 \uC0AC\uB78C'}</span>
                    <span className="text-stone-700">{g.toEmail || g.toPhone || '-'}</span>
                  </div>
                  <div className="text-[11px] text-stone-400">{new Date(g.createdAt).toLocaleDateString('ko')}</div>
                </div>
              ))}
              {gifts.length === 0 && <div className="py-10 text-center text-stone-300 text-sm">{'\uC120\uBB3C \uCF54\uB4DC \uC5C6\uC74C'}</div>}
            </div>
          </div>
          {showGiftModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
              <div className="bg-white rounded-2xl p-6 w-[400px] max-w-[90vw]">
                <h3 className="text-base font-semibold mb-5">{'\uD3EC\uC2A4\uD130 \uC120\uBB3C \uCF54\uB4DC \uC0DD\uC131'}</h3>
                <div className="mb-3">
                  <label className="text-[11px] text-stone-400 block mb-1">{'\uD2B8\uB799'}</label>
                  <div className="flex gap-2">
                    {(['PHOTO','AI'] as const).map(t =>
                      <button key={t} onClick={() => setGiftTrack(t)} className={`flex-1 py-2 rounded-lg text-xs border ${giftTrack === t ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200'}`}>{t}</button>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-[11px] text-stone-400 block mb-1">{'\uC774\uBA54\uC77C'}</label>
                  <input value={giftEmail} onChange={e => setGiftEmail(e.target.value)} placeholder={'\uC120\uD0DD\uC0AC\uD56D'} className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-xs outline-none focus:border-stone-400" />
                </div>
                <div className="mb-3">
                  <label className="text-[11px] text-stone-400 block mb-1">{'\uC804\uD654\uBC88\uD638'}</label>
                  <input value={giftPhone} onChange={e => setGiftPhone(e.target.value)} placeholder={'\uC120\uD0DD\uC0AC\uD56D'} className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-xs outline-none focus:border-stone-400" />
                </div>
                <div className="mb-5">
                  <label className="text-[11px] text-stone-400 block mb-1">{'\uBA54\uC2DC\uC9C0'}</label>
                  <input value={giftMessage} onChange={e => setGiftMessage(e.target.value)} placeholder={'\uC120\uD0DD\uC0AC\uD56D'} className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-xs outline-none focus:border-stone-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowGiftModal(false)} className="flex-1 py-3 rounded-lg border border-stone-200 text-stone-500 text-xs">{'\uCDE8\uC18C'}</button>
                  <button onClick={createGift} className="flex-1 py-3 rounded-lg bg-stone-800 text-white text-xs font-medium">{'\uC0DD\uC131'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
      <>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 mb-6">
          {[
            { label: '\uC804\uCCB4', value: stats.total, color: '#2C2C2A' },
            { label: '\uACB0\uC81C', value: stats.paid, color: '#6B9E78' },
            { label: '\uC644\uB8CC', value: stats.done, color: '#2C8C6B' },
            { label: '\uC2E4\uD328', value: stats.failed, color: '#C0392B' },
            { label: '\uB9E4\uCD9C', value: `${stats.revenue.toLocaleString()}\uC6D0`, color: '#2C2C2A' },
          ].map(s => (
            <div key={s.label} className="p-3 md:p-4 bg-stone-50 rounded-xl border border-stone-200 text-center">
              <p className="text-[10px] md:text-[11px] text-stone-400 mb-1">{s.label}</p>
              <p className="text-base md:text-xl font-semibold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          {['', 'PENDING', 'PAID', 'GENERATING', 'DONE', 'FAILED'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-[11px] border whitespace-nowrap ${statusFilter === s ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200'}`}>
              {s ? (statusLabel[s] || s) : '\uC804\uCCB4'}
            </button>
          ))}
        </div>

        <div className="hidden md:block bg-white rounded-xl border border-stone-200 overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                {['\uC8FC\uBB38\uBC88\uD638','\uD2B8\uB799','\uC774\uB984','\uD3F0\uD2B8','\uAE08\uC561','\uC0C1\uD0DC','\uC77C\uC2DC',''].map(h =>
                  <th key={h} className="px-3 py-2.5 text-left font-medium text-stone-400 text-[11px]">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-stone-100">
                  <td className="px-3 py-2.5 font-mono text-[11px]">{o.orderId.slice(-10)}</td>
                  <td className="px-3 py-2.5">{o.track}</td>
                  <td className="px-3 py-2.5">{[o.groomNameKr, o.brideNameKr].filter(Boolean).join(' & ')}</td>
                  <td className="px-3 py-2.5 text-[11px]">{o.fontId.replace(/script_|serif_|sans_/g, '')}</td>
                  <td className="px-3 py-2.5">{o.amount.toLocaleString()}{'\uC6D0'}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium text-white" style={{ background: statusColor[o.status] || '#999' }}>
                      {statusLabel[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-stone-400">{new Date(o.createdAt).toLocaleDateString('ko')}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      {o.finalPosterUrl && (
                        <>
                          <button onClick={() => setPreview(o.finalPosterUrl)} className="p-1 text-stone-500 hover:text-stone-800"><Eye size={14} /></button>
                          <a href={o.finalPosterUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-stone-500 hover:text-stone-800"><Download size={14} /></a>
                        </>
                      )}
                      {o.status === 'FAILED' && (
                        <button onClick={() => retry(o.orderId)} className="p-1 text-red-500 hover:text-red-700"><RefreshCw size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-stone-300">{'\uC8FC\uBB38 \uC5C6\uC74C'}</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {o.thumbnailUrl && <img src={o.thumbnailUrl} alt="" className="w-10 h-14 rounded object-cover" />}
                  <div>
                    <p className="text-sm font-medium text-stone-800">{[o.groomNameKr, o.brideNameKr].filter(Boolean).join(' & ') || '-'}</p>
                    <p className="text-[11px] text-stone-400 font-mono">{o.orderId.slice(-10)}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium text-white" style={{ background: statusColor[o.status] || '#999' }}>
                  {statusLabel[o.status] || o.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] mb-2">
                <div><span className="text-stone-400">{'\uD2B8\uB799'}</span> <span className="text-stone-700 ml-1">{o.track}</span></div>
                <div><span className="text-stone-400">{'\uAE08\uC561'}</span> <span className="text-stone-700 ml-1">{o.amount.toLocaleString()}{'\uC6D0'}</span></div>
                <div><span className="text-stone-400">{'\uC77C\uC2DC'}</span> <span className="text-stone-700 ml-1">{new Date(o.createdAt).toLocaleDateString('ko')}</span></div>
              </div>
              <div className="flex gap-2">
                {o.finalPosterUrl && (
                  <>
                    <button onClick={() => setPreview(o.finalPosterUrl)} className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-600 text-[11px] flex items-center justify-center gap-1"><Eye size={12} />{'\uBCF4\uAE30'}</button>
                    <a href={o.finalPosterUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-600 text-[11px] flex items-center justify-center gap-1"><Download size={12} />{'\uB2E4\uC6B4\uB85C\uB4DC'}</a>
                  </>
                )}
                {o.status === 'FAILED' && (
                  <button onClick={() => retry(o.orderId)} className="flex-1 py-2 rounded-lg border border-red-200 text-red-500 text-[11px] flex items-center justify-center gap-1"><RefreshCw size={12} />{'\uC7AC\uC2DC\uB3C4'}</button>
                )}
              </div>
            </div>
          ))}
          {orders.length === 0 && <div className="py-10 text-center text-stone-300 text-sm">{'\uC8FC\uBB38 \uC5C6\uC74C'}</div>}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 disabled:text-stone-200 text-stone-500"><ChevronLeft size={16} /></button>
            <span className="text-xs text-stone-400">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 disabled:text-stone-200 text-stone-500"><ChevronRight size={16} /></button>
          </div>
        )}
      </>
      )}

      {preview && (
        <div onClick={() => setPreview(null)} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] cursor-pointer">
          <img src={preview} alt="" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}
    </div>
  );
}
