import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Loader2, Download, RefreshCw, Gift, Search, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

interface IdPhotoItem {
  id: string;
  originalUrl: string;
  resultUrl?: string;
  faceAnalysis?: any;
  status: string;
  amount: number;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export default function AdminIdPhoto() {
  const token = localStorage.getItem('token');
  const [photos, setPhotos] = useState<IdPhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [giftTarget, setGiftTarget] = useState<string | null>(null);
  const [giftEmail, setGiftEmail] = useState('');
  const [search, setSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchList = async () => {
    try {
      const res = await fetch(`${API}/id-photo/admin/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  const handleGenerate = async (file: File) => {
    if (!token) return;
    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const upRes = await fetch(`${API}/upload/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const upData = await upRes.json();
      if (!upData.url) throw new Error('업로드 실패');

      const genRes = await fetch(`${API}/id-photo/admin/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: upData.url })
      });
      const genData = await genRes.json();
      if (!genData.success) throw new Error(genData.error);

      setPollingId(genData.idPhotoId);
      startPolling(genData.idPhotoId);
      fetchList();
    } catch (e: any) {
      alert(e.message || '생성 실패');
    } finally { setGenerating(false); }
  };

  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let count = 0;
    pollRef.current = setInterval(async () => {
      count++;
      if (count > 60) { if (pollRef.current) clearInterval(pollRef.current); setPollingId(null); return; }
      try {
        const res = await fetch(`${API}/id-photo/status/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          if (pollRef.current) clearInterval(pollRef.current);
          setPollingId(null);
          fetchList();
        }
      } catch {}
    }, 3000);
  };

  const [giftPhone, setGiftPhone] = useState('');

  const handleGift = async () => {
    if (!giftTarget || (!giftEmail && !giftPhone)) return;
    try {
      const res = await fetch(`${API}/id-photo/admin/gift`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPhotoId: giftTarget, toEmail: giftEmail || undefined, toPhone: giftPhone || undefined })
      });
      const data = await res.json();
      if (data.success) alert('선물 완료');
      setGiftTarget(null);
      setGiftEmail('');
      setGiftPhone('');
    } catch { alert('선물 실패'); }
  };

  const filtered = photos.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.user?.name?.toLowerCase().includes(q) || p.user?.email?.toLowerCase().includes(q) || p.status.toLowerCase().includes(q);
  });

  const statusColor = (s: string) => {
    if (s === 'COMPLETED') return 'text-emerald-600 bg-emerald-50';
    if (s === 'GENERATING') return 'text-amber-600 bg-amber-50';
    if (s === 'FAILED') return 'text-red-600 bg-red-50';
    return 'text-stone-600 bg-stone-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">AI ID 포트레이트</h1>
          <p className="text-sm text-stone-500 mt-1">결제 없이 직접 생성 / 선물하기</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchList()} className="p-2 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
            <RefreshCw className="w-4 h-4 text-stone-600" />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={generating || !!pollingId}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {generating || pollingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {pollingId ? '생성 중...' : '사진 업로드 → 생성'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleGenerate(e.target.files[0])} />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 이메일, 상태로 검색"
          className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
        />
      </div>

      <div className="text-xs text-stone-500">총 {filtered.length}건</div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-stone-400 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-stone-400 text-sm">데이터 없음</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="aspect-[3/4] bg-stone-100 relative">
                {p.status === 'COMPLETED' && p.resultUrl ? (
                  <img src={p.resultUrl} alt="" className="w-full h-full object-cover" />
                ) : p.originalUrl ? (
                  <img src={p.originalUrl} alt="" className="w-full h-full object-cover opacity-50" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-stone-300" />
                  </div>
                )}
                <span className={`absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor(p.status)}`}>
                  {p.status}
                </span>
              </div>
              <div className="p-3 space-y-2">
                <div>
                  <p className="text-xs font-medium text-stone-800 truncate">{p.user?.name || '관리자'}</p>
                  <p className="text-[10px] text-stone-400 truncate">{p.user?.email}</p>
                </div>
                <p className="text-[10px] text-stone-400">{new Date(p.createdAt).toLocaleDateString('ko-KR')}</p>
                {p.status === 'COMPLETED' && p.resultUrl && (
                  <div className="flex gap-1">
                    <a href={p.resultUrl} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-700">
                      <Download className="w-3 h-3" /> 다운
                    </a>
                    <button onClick={() => { setGiftTarget(p.id); setGiftEmail(''); }} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] bg-stone-900 text-white rounded-lg hover:bg-stone-800">
                      <Gift className="w-3 h-3" /> 선물
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {giftTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setGiftTarget(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-stone-900">선물하기</p>
              <button onClick={() => setGiftTarget(null)}><X className="w-4 h-4 text-stone-400" /></button>
            </div>
            <input
              value={giftEmail}
              onChange={(e) => setGiftEmail(e.target.value)}
              placeholder="받는 사람 이메일"
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
            <input
              value={giftPhone}
              onChange={(e) => setGiftPhone(e.target.value)}
              placeholder="받는 사람 전화번호 (알림톡)"
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
            <button onClick={handleGift} disabled={!giftEmail && !giftPhone} className="w-full py-2.5 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 disabled:opacity-50">
              선물 보내기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
