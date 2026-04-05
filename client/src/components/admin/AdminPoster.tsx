import { useState, useEffect } from 'react';
import { Image, RefreshCw, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

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
  const limit = 20;

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
      const q = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) q.set('status', statusFilter);
      const res = await fetch(`${API}/admin/poster/orders?${q}`, { headers });
      const data = await res.json();
      setOrders(data.orders || data);
      setTotal(data.total || data.length);
    } catch {}
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API}/admin/poster/stats`, { headers });
      setStats(await res.json());
    } catch {}
  };

  const retry = async (orderId: string) => {
    try {
      await fetch(`${API}/admin/poster/retry`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      load();
    } catch {}
  };

  useEffect(() => { load(); loadStats(); }, [page, statusFilter]);

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
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

      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'pointer' }}>
          <img src={preview} alt="" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
