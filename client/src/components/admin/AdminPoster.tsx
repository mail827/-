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

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#2C2C2A', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Image size={20} />웨딩포스터 관리
      </h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('orders')} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid', borderColor: tab === 'orders' ? '#2C2C2A' : '#E8E5E0', background: tab === 'orders' ? '#2C2C2A' : '#fff', color: tab === 'orders' ? '#fff' : '#666', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>주문</button>
        <button onClick={() => setTab('gifts')} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid', borderColor: tab === 'gifts' ? '#2C2C2A' : '#E8E5E0', background: tab === 'gifts' ? '#2C2C2A' : '#fff', color: tab === 'gifts' ? '#fff' : '#666', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>선물</button>
      </div>

      {tab === 'gifts' ? (
        <div>
          <button onClick={() => setShowGiftModal(true)} style={{ padding: '10px 20px', background: '#2C2C2A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} />선물 코드 생성</button>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E5E0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid #E8E5E0', background: '#FAFAF8' }}>
                {['코드','트랙','받는 사람','메시지','사용','만료','생성일'].map(h=><th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#999', fontSize: 11 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {gifts.map(g=>(
                  <tr key={g.id} style={{ borderBottom: '1px solid #F0EEEB' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{g.code}</td>
                    <td style={{ padding: '10px 12px' }}>{g.track}</td>
                    <td style={{ padding: '10px 12px' }}>{g.toEmail || '-'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#999' }}>{g.message || '-'}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, color: '#fff', background: g.isRedeemed ? '#6B9E78' : '#A8A8A0' }}>{g.isRedeemed ? '사용됨' : '미사용'}</span></td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: '#999' }}>{new Date(g.expiresAt).toLocaleDateString('ko')}</td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: '#999' }}>{new Date(g.createdAt).toLocaleDateString('ko')}</td>
                  </tr>
                ))}
                {gifts.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#ccc' }}>선물 코드 없음</td></tr>}
              </tbody>
            </table>
          </div>
          {showGiftModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 400, maxWidth: '90vw' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>포스터 선물 코드 생성</h3>
                <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, color: '#999', display: 'block', marginBottom: 4 }}>트랙</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['PHOTO','AI'] as const).map(t=><button key={t} onClick={()=>setGiftTrack(t)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid', borderColor: giftTrack===t ? '#2C2C2A' : '#E8E5E0', background: giftTrack===t ? '#2C2C2A' : '#fff', color: giftTrack===t ? '#fff' : '#666', fontSize: 13, cursor: 'pointer' }}>{t}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, color: '#999', display: 'block', marginBottom: 4 }}>받는 사람 이메일</label>
                  <input value={giftEmail} onChange={e=>setGiftEmail(e.target.value)} placeholder="선택사항" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8E5E0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, color: '#999', display: 'block', marginBottom: 4 }}>받는 사람 전화번호</label>
                  <input value={giftPhone} onChange={e=>setGiftPhone(e.target.value)} placeholder="선택사항" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8E5E0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 20 }}><label style={{ fontSize: 12, color: '#999', display: 'block', marginBottom: 4 }}>메시지</label>
                  <input value={giftMessage} onChange={e=>setGiftMessage(e.target.value)} placeholder="선택사항" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8E5E0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={()=>setShowGiftModal(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #E8E5E0', background: '#fff', color: '#666', fontSize: 13, cursor: 'pointer' }}>취소</button>
                  <button onClick={createGift} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#2C2C2A', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>생성</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
      <><div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: '전체', value: stats.total, color: '#2C2C2A' },
          { label: '결제완료', value: stats.paid, color: '#6B9E78' },
          { label: '완료', value: stats.done, color: '#2C8C6B' },
          { label: '실패', value: stats.failed, color: '#C0392B' },
          { label: '매출', value: `${stats.revenue.toLocaleString()}원`, color: '#2C2C2A' },
        ].map((s) => (
          <div key={s.label} style={{ padding: '16px 12px', background: '#FAFAF8', borderRadius: 10, border: '1px solid #E8E5E0', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#A8A8A0', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', 'PENDING', 'PAID', 'GENERATING', 'DONE', 'FAILED'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid', borderColor: statusFilter === s ? '#2C2C2A' : '#E8E5E0', background: statusFilter === s ? '#2C2C2A' : '#fff', color: statusFilter === s ? '#fff' : '#666', fontSize: 12, cursor: 'pointer' }}>
            {s || '전체'}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E5E0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E8E5E0', background: '#FAFAF8' }}>
              {['주문번호', '트랙', '이름', '폰트', '레이아웃', '금액', '상태', '일시', ''].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#999', fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #F0EEEB' }}>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11 }}>{o.orderId.slice(-10)}</td>
                <td style={{ padding: '10px 12px' }}>{o.track}</td>
                <td style={{ padding: '10px 12px' }}>{[o.groomNameKr, o.brideNameKr].filter(Boolean).join(' & ')}</td>
                <td style={{ padding: '10px 12px', fontSize: 11 }}>{o.fontId}</td>
                <td style={{ padding: '10px 12px', fontSize: 11 }}>{o.layout}</td>
                <td style={{ padding: '10px 12px' }}>{o.amount.toLocaleString()}원</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, color: '#fff', background: statusColor[o.status] || '#999' }}>{o.status}</span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 11, color: '#999' }}>{new Date(o.createdAt).toLocaleDateString('ko')}</td>
                <td style={{ padding: '10px 12px', display: 'flex', gap: 4 }}>
                  {o.finalPosterUrl && (
                    <>
                      <button onClick={() => setPreview(o.finalPosterUrl)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><Eye size={14} /></button>
                      <a href={o.finalPosterUrl} target="_blank" rel="noopener noreferrer" style={{ padding: 4, color: '#666' }}><Download size={14} /></a>
                    </>
                  )}
                  {o.status === 'FAILED' && (
                    <button onClick={() => retry(o.orderId)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#C0392B' }}><RefreshCw size={14} /></button>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#ccc' }}>주문 없음</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: page <= 1 ? '#ddd' : '#666' }}><ChevronLeft size={16} /></button>
          <span style={{ fontSize: 12, color: '#999' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: page >= totalPages ? '#ddd' : '#666' }}><ChevronRight size={16} /></button>
        </div>
      )}

      </>)}

      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'pointer' }}>
          <img src={preview} alt="" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
