import { useState, useEffect } from 'react';
import { Loader2, Download, RefreshCw, X, Film } from 'lucide-react';

interface PreweddingOrder {
  id: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  status: string;
  photos: string[];
  outputUrl: string | null;
  totalDuration: number | null;
  totalCost: number | null;
  amount: number;
  orderId: string;
  paidAt: string | null;
  errorMsg: string | null;
  createdAt: string;
  user?: { email: string; name: string };
}

const API = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem('token');

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기', color: '#999' },
  ANALYZING: { label: '분석 중', color: '#f59e0b' },
  GENERATING: { label: '생성 중', color: '#3b82f6' },
  ASSEMBLING: { label: '조립 중', color: '#8b5cf6' },
  DONE: { label: '완성', color: '#22c55e' },
  FAILED: { label: '실패', color: '#ef4444' },
};

export default function AdminPreweddingVideos() {
  const [orders, setOrders] = useState<PreweddingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PreweddingOrder | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/prewedding-video/admin/list`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setOrders(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-800">식전영상 주문</h2>
          <p className="text-sm text-stone-400 mt-1">{orders.length}건</p>
        </div>
        <button onClick={fetchOrders} className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50">
          <RefreshCw size={16} className="text-stone-500" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-stone-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Film size={32} className="mx-auto text-stone-300 mb-3" />
          <p className="text-sm text-stone-400">아직 주문이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const st = STATUS_MAP[o.status] || STATUS_MAP.PENDING;
            return (
              <div key={o.id} onClick={() => setSelectedOrder(o)} className="bg-white rounded-xl border border-stone-200 p-4 cursor-pointer hover:border-stone-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-800">{o.groomName} & {o.brideName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.color + '15', color: st.color }}>{st.label}</span>
                  </div>
                  <span className="text-xs text-stone-400">{formatDate(o.createdAt)}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-stone-400">
                  <span>{o.user?.email || '-'}</span>
                  <span>{o.photos?.length || 0}장</span>
                  <span>{(o.amount || 0).toLocaleString()}원</span>
                  {o.totalCost && <span>원가 ${o.totalCost.toFixed(2)}</span>}
                  {o.paidAt && <span>결제 완료</span>}
                </div>
                {o.errorMsg && <p className="text-xs text-red-400 mt-2">{o.errorMsg}</p>}
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-800">{selectedOrder.groomName} & {selectedOrder.brideName}</h3>
              <button onClick={() => setSelectedOrder(null)}><X size={18} className="text-stone-400" /></button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-stone-400">상태</span><span className="font-medium" style={{ color: (STATUS_MAP[selectedOrder.status] || STATUS_MAP.PENDING).color }}>{(STATUS_MAP[selectedOrder.status] || STATUS_MAP.PENDING).label}</span></div>
              <div className="flex justify-between"><span className="text-stone-400">주문번호</span><span className="font-mono text-xs">{selectedOrder.orderId}</span></div>
              <div className="flex justify-between"><span className="text-stone-400">결제금액</span><span>{selectedOrder.amount.toLocaleString()}원</span></div>
              {selectedOrder.totalCost && <div className="flex justify-between"><span className="text-stone-400">원가</span><span>${selectedOrder.totalCost.toFixed(2)}</span></div>}
              {selectedOrder.weddingDate && <div className="flex justify-between"><span className="text-stone-400">결혼일</span><span>{selectedOrder.weddingDate}</span></div>}
              <div className="flex justify-between"><span className="text-stone-400">사진</span><span>{selectedOrder.photos?.length || 0}장</span></div>
              {selectedOrder.totalDuration && <div className="flex justify-between"><span className="text-stone-400">영상 길이</span><span>{selectedOrder.totalDuration}초</span></div>}
            </div>

            {selectedOrder.photos && selectedOrder.photos.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-stone-400 mb-2">업로드 사진</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedOrder.photos as string[]).map((url, i) => (
                    <img key={i} src={url} className="w-14 h-18 rounded-lg object-cover" />
                  ))}
                </div>
              </div>
            )}

            {selectedOrder.outputUrl && (
              <div className="mt-4">
                <p className="text-xs text-stone-400 mb-2">완성 영상</p>
                <video src={selectedOrder.outputUrl} controls playsInline className="w-full rounded-lg" />
                <a href={selectedOrder.outputUrl} download className="mt-2 flex items-center justify-center gap-2 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium">
                  <Download size={14} /> 다운로드
                </a>
              </div>
            )}

            {selectedOrder.errorMsg && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-500">{selectedOrder.errorMsg}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
