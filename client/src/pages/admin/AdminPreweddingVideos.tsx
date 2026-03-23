import { useState, useEffect } from 'react';
import { Loader2, Download, RefreshCw, X, Film, Sparkles, Upload } from 'lucide-react';

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
  const [showFree, setShowFree] = useState(false);
  const [freeForm, setFreeForm] = useState({ groomName: '', brideName: '', weddingDate: '', metStory: '', metDate: '' });
  const [freePhotos, setFreePhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [freeFont, setFreeFont] = useState('BMJUA_ttf');
  const [freeBgm, setFreeBgm] = useState<any>(null);
  const [freeBgms, setFreeBgms] = useState<any[]>([]);
  const [freeFonts, setFreeFonts] = useState<any[]>([]);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', 'wedding_guide');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dgtxjgdit'}/image/upload`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.secure_url) setFreePhotos(prev => [...prev, data.secure_url]);
    setUploading(false);
  };

  const startFree = async () => {
    if (!freeForm.groomName || !freeForm.brideName || freePhotos.length < 3) return alert('이름 + 사진 3장 이상');
    setGenerating(true);
    try {
      const res = await fetch(`${API}/prewedding-video/admin/free-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...freeForm, photos: freePhotos, fontId: freeFont, bgmUrl: freeBgm?.url || '' }),
      });
      const data = await res.json();
      if (data.success) { alert('생성 시작! 목록에서 확인하세요.'); setShowFree(false); setFreeForm({ groomName: '', brideName: '', weddingDate: '', metStory: '', metDate: '' }); setFreePhotos([]); fetchOrders(); }
      else alert(data.error || '실패');
    } catch { alert('실패'); }
    setGenerating(false);
  };

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

  useEffect(() => {
    fetchOrders();
    fetch(`${API}/prewedding-video/config`).then(r => r.json()).then(d => {
      setFreeFonts(d.fonts);
      d.fonts.forEach((f: any) => {
        const style = document.createElement('style');
        style.textContent = `@font-face { font-family: '${f.id}'; src: url('/fonts/${f.file}'); font-display: swap; }`;
        document.head.appendChild(style);
      });
    });
    fetch(`${API}/prewedding-video/bgm`).then(r => r.json()).then(d => { setFreeBgms(d); if (d.length) setFreeBgm(d[0]); });
  }, []);

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
        <button onClick={() => setShowFree(true)} className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-900">
          <Sparkles size={14} /> 무료 생성
        </button>
      </div>

      {showFree && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-800">무료 생성 (관리자)</h3>
            <button onClick={() => setShowFree(false)} className="p-1 hover:bg-stone-100 rounded-lg"><X size={18} className="text-stone-400" /></button>
          </div>

          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">커플 정보</p>
            <div className="grid grid-cols-2 gap-3">
              <input value={freeForm.groomName} onChange={e => setFreeForm(p => ({ ...p, groomName: e.target.value }))} placeholder="신랑 이름" className="px-4 py-2.5 rounded-lg border border-stone-200 text-sm focus:border-stone-400 outline-none" />
              <input value={freeForm.brideName} onChange={e => setFreeForm(p => ({ ...p, brideName: e.target.value }))} placeholder="신부 이름" className="px-4 py-2.5 rounded-lg border border-stone-200 text-sm focus:border-stone-400 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs text-stone-400 mb-1 block">결혼식 날짜</label>
                <input type="date" value={freeForm.weddingDate} onChange={e => setFreeForm(p => ({ ...p, weddingDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-stone-200 text-sm focus:border-stone-400 outline-none" />
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">처음 만난 날 (선택)</label>
                <input type="date" value={freeForm.metDate || ''} onChange={e => setFreeForm(p => ({ ...p, metDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-stone-200 text-sm focus:border-stone-400 outline-none" />
              </div>
            </div>
            <textarea value={freeForm.metStory} onChange={e => setFreeForm(p => ({ ...p, metStory: e.target.value }))} placeholder="우리의 이야기 힌트 (선택) — AI가 자막을 생성할 때 참고합니다" rows={2} className="w-full mt-3 px-4 py-2.5 rounded-lg border border-stone-200 text-sm resize-none focus:border-stone-400 outline-none" />
          </div>

          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">사진 ({freePhotos.length}/8)</p>
            <div className="grid grid-cols-4 gap-2">
              {freePhotos.map((url, i) => (
                <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-stone-100">
                  <img src={url} className="w-full h-full object-cover" />
                  <button onClick={() => setFreePhotos(p => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80"><X size={10} className="text-white" /></button>
                </div>
              ))}
              {freePhotos.length < 8 && (
                <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-stone-200 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors">
                  {uploading ? <Loader2 size={18} className="animate-spin text-stone-400" /> : <Upload size={18} className="text-stone-400" />}
                  <span className="text-[10px] text-stone-300 mt-1">업로드</span>
                  <input type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(uploadPhoto); }} />
                </label>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">글꼴</p>
            <div className="grid grid-cols-3 gap-2">
              {freeFonts.map(f => (
                <button key={f.id} onClick={() => setFreeFont(f.id)} className={`p-3 rounded-lg border text-left transition-all ${freeFont === f.id ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}`}>
                  <p className="text-[10px] text-stone-400">{f.name}</p>
                  <p style={{ fontFamily: `'${f.id}', sans-serif`, fontSize: 14 }} className="text-stone-800 mt-0.5">{f.id === 'GreatVibes-Regular' ? 'Love Story' : '사랑해요'}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">배경음악</p>
            {freeBgms.length === 0 ? (
              <p className="text-xs text-stone-300">관리자 BGM에서 식전영상 카테고리로 등록하세요</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {freeBgms.map(b => (
                  <button key={b.id} onClick={() => setFreeBgm(b)} className={`p-3 rounded-lg border text-left transition-all ${freeBgm?.id === b.id ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}`}>
                    <p className="text-sm font-medium text-stone-800 truncate">{b.title}</p>
                    <p className="text-[10px] text-stone-400">{b.artist}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={startFree} disabled={generating || freePhotos.length < 3 || !freeForm.groomName || !freeForm.brideName} className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm font-semibold disabled:opacity-30 flex items-center justify-center gap-2 hover:bg-stone-900 transition-colors">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generating ? '생성 중... (약 8분 소요)' : '무료 생성 시작'}
          </button>
          <p className="text-[10px] text-stone-300 text-center">Kling + Seedance 하이브리드 엔진 · fal.ai 크레딧 소모됩니다</p>
        </div>
      )}

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
