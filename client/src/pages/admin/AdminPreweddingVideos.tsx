import { useState, useEffect, useRef } from 'react';
import { Loader2, Download, RefreshCw, X, Film, Sparkles, Upload, Check, AlertCircle, RotateCcw, Ban } from 'lucide-react';

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
  scenes: any[] | null;
  clipUrls: string[] | null;
  subtitles: string[] | null;
  photoAnalysis: any[] | null;
  createdAt: string;
  user?: { email: string; name: string };
}

const API = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem('token');

const STATUS_FLOW = ['PENDING', 'ANALYZING', 'GENERATING', 'ASSEMBLING', 'DONE'];
const STATUS_MAP: Record<string, { label: string; color: string; progress: number; desc: string }> = {
  PENDING: { label: '대기', color: '#a8a29e', progress: 0, desc: '결제 대기 중' },
  ANALYZING: { label: '분석 중', color: '#f59e0b', progress: 20, desc: '사진을 분석하고 자막을 생성하고 있어요' },
  GENERATING: { label: '영상 생성 중', color: '#3b82f6', progress: 55, desc: '각 씬을 영상으로 만들고 있어요' },
  ASSEMBLING: { label: '조립 중', color: '#8b5cf6', progress: 85, desc: '클립을 합치고 BGM을 입히고 있어요' },
  DONE: { label: '완성', color: '#22c55e', progress: 100, desc: '영상이 완성되었습니다' },
  FAILED: { label: '실패', color: '#ef4444', progress: 0, desc: '생성 중 오류가 발생했습니다' },
};

const ACTIVE_STATUSES = ['ANALYZING', 'GENERATING', 'ASSEMBLING'];

export default function AdminPreweddingVideos() {
  const [orders, setOrders] = useState<PreweddingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PreweddingOrder | null>(null);
  const [showFree, setShowFree] = useState(false);
  const [freeForm, setFreeForm] = useState({ groomName: '', brideName: '', weddingDate: '', metStory: '', metDate: '' });
  const [freePhotos, setFreePhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [freeMode, setFreeMode] = useState<'photo'|'selfie'>('photo');
  const [selfieConcepts, setSelfieConcepts] = useState<{id:string,name:string}[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string>('studio_classic');
  const [freeFont, setFreeFont] = useState('BMJUA_ttf');
  const [freeVenue, setFreeVenue] = useState('');
  const [freeGroomFather, setFreeGroomFather] = useState('');
  const [freeGroomMother, setFreeGroomMother] = useState('');
  const [freeBrideFather, setFreeBrideFather] = useState('');
  const [freeBrideMother, setFreeBrideMother] = useState('');
  const [freeEndingMessage, setFreeEndingMessage] = useState('');
  const [playingBgm, setPlayingBgm] = useState<string | null>(null);
  const [audioRef] = useState(new Audio());
  const [freeSubStyle, setFreeSubStyle] = useState('poetic');
  const [freeEngine, setFreeEngine] = useState<'seedance15'|'kling'|'seedance2'|'seedance2-fast'>('seedance15');
  const [subStyles, setSubStyles] = useState<any[]>([]);
  const [freeBgm, setFreeBgm] = useState<any>(null);
  const [freeBgms, setFreeBgms] = useState<any[]>([]);
  const [freeFonts, setFreeFonts] = useState<any[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedRef = useRef<string | null>(null);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', 'wedding_guide');
    const res = await fetch('https://api.cloudinary.com/v1_1/' + (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dgtxjgdit') + '/image/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.secure_url) setFreePhotos(prev => [...prev, data.secure_url]);
    setUploading(false);
  };

  const startFree = async () => {
    const minPhotos = freeMode === 'selfie' ? 1 : 3;
    if (!freeForm.groomName || !freeForm.brideName || freePhotos.length < minPhotos) return alert(freeMode === 'selfie' ? '이름 + 셀카 1장 이상' : '이름 + 사진 3장 이상');
    setGenerating(true);
    try {
      const res = await fetch(API + '/prewedding-video/admin/free-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ ...freeForm, photos: freePhotos, fontId: freeFont, subtitleStyle: freeSubStyle, bgmUrl: freeBgm?.url || '', venueName: freeVenue, groomFather: freeGroomFather, groomMother: freeGroomMother, brideFather: freeBrideFather, brideMother: freeBrideMother, endingMessage: freeEndingMessage, mode: freeMode, selfieConcepts: freeMode === 'selfie' ? [selectedConcept] : undefined, videoEngine: freeEngine }),
      });
      const data = await res.json();
      if (data.success) {
        setShowFree(false);
        setFreeForm({ groomName: '', brideName: '', weddingDate: '', metStory: '', metDate: '' });
        setFreePhotos([]);
        setFreeVenue(''); setFreeGroomFather(''); setFreeGroomMother(''); setFreeBrideFather(''); setFreeBrideMother('');
        fetchOrders();
      } else alert(data.error || '실패');
    } catch { alert('실패'); }
    setGenerating(false);
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(API + '/prewedding-video/admin/list', {
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      const data = await res.json();
      setOrders(data);
      if (selectedRef.current) {
        const updated = data.find((o: PreweddingOrder) => o.id === selectedRef.current);
        if (updated) setSelectedOrder(updated);
      }
    } catch {}
    setLoading(false);
  };

  const cancelOrder = async (id: string) => {
    if (!confirm('이 주문을 취소하시겠습니까?')) return;
    try {
      await fetch(API + '/prewedding-video/admin/cancel/' + id, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      fetchOrders();
      setSelectedOrder(null);
    } catch {}
  };


  const resumeOrder = async (id: string) => {
    if (!confirm('기존 클립으로 FFmpeg 조립만 재시도합니까?')) return;
    try {
      await fetch(API + '/prewedding-video/admin/resume/' + id, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      fetchOrders();
      setSelectedOrder(null);
    } catch {}
  };

  const retryOrder = async (id: string) => {
    if (!confirm('처음부터 다시 생성하시겠습니까?')) return;
    try {
      await fetch(API + '/prewedding-video/admin/retry/' + id, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      fetchOrders();
      setSelectedOrder(null);
    } catch {}
  };

  useEffect(() => {
    fetchOrders();
    fetch(API + '/prewedding-video/config').then(r => r.json()).then((d: any) => { if (d.selfieConcepts) { setSelfieConcepts(d.selfieConcepts); setSelectedConcept(d.selfieConcepts[0]?.id || 'studio_classic'); }
      setFreeFonts(d.fonts);
      if (d.subtitleStyles) setSubStyles(d.subtitleStyles);
      d.fonts.forEach((f: any) => {
        const style = document.createElement('style');
        style.textContent = "@font-face { font-family: '" + f.id + "'; src: url('/fonts/" + f.file + "'); font-display: swap; }";
        document.head.appendChild(style);
      });
    });
    fetch(API + '/prewedding-video/bgm').then(r => r.json()).then(d => { setFreeBgms(d); });
  }, []);

  useEffect(() => {
    const hasActive = orders.some(o => ACTIVE_STATUSES.includes(o.status));
    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(fetchOrders, 8000);
    } else if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [orders]);

  useEffect(() => {
    selectedRef.current = selectedOrder?.id || null;
  }, [selectedOrder]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const elapsed = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return '방금 전';
    if (m < 60) return m + '분 전';
    return Math.floor(m / 60) + '시간 ' + (m % 60) + '분 전';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-800">식전영상 주문</h2>
          <p className="text-sm text-stone-400 mt-1">{orders.length}건{orders.some(o => ACTIVE_STATUSES.includes(o.status)) ? ' \u00b7 자동 갱신 중' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchOrders} className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors">
            <RefreshCw size={16} className="text-stone-500" />
          </button>
          <button onClick={() => setShowFree(true)} className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-900 transition-colors">
            <Sparkles size={14} /> 무료 생성
          </button>
        </div>
      </div>

      {showFree && (<>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setFreeMode('photo')} className={'px-4 py-2 rounded-lg text-sm font-medium transition-colors ' + (freeMode === 'photo' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500')}>
            웨딩사진 모드
          </button>
          <button onClick={() => setFreeMode('selfie')} className={'px-4 py-2 rounded-lg text-sm font-medium transition-colors ' + (freeMode === 'selfie' ? 'bg-stone-800 text-white ring-1 ring-stone-300' : 'bg-stone-100 text-stone-500')}>
            셀카 화보 모드
          </button>
        </div>
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
            <textarea value={freeForm.metStory} onChange={e => setFreeForm(p => ({ ...p, metStory: e.target.value }))} placeholder="우리의 이야기 힌트 (선택)" rows={2} className="w-full mt-3 px-4 py-2.5 rounded-lg border border-stone-200 text-sm resize-none focus:border-stone-400 outline-none" />
          </div>
          <div>
            {freeMode === 'selfie' ? (<>
              <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">셀카 업로드</p>
              <p className="text-[11px] text-stone-400 mb-3">신랑 셀카, 신부 셀카를 각각 올려주세요. 커플 셀카는 선택입니다.</p>
              <div className="grid grid-cols-3 gap-3">
                {['신랑 셀카', '신부 셀카', '커플 셀카 (선택)'].map((label, i) => (
                  <div key={i}>
                    {freePhotos[i] ? (
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-stone-200">
                        <img src={freePhotos[i]} className="w-full h-full object-cover" />
                        <button onClick={() => setFreePhotos(p => { const n = [...p]; n.splice(i, 1); return n; })} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80"><X size={10} className="text-white" /></button>
                      </div>
                    ) : (
                      <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-stone-200 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors">
                        {uploading ? <Loader2 size={16} className="animate-spin text-stone-400" /> : <Upload size={16} className="text-stone-400" />}
                        <span className="text-[10px] text-stone-400 mt-1 text-center px-1">{label}</span>
                        <input type="file" accept="image/*" hidden onChange={e => { if (e.target.files?.[0]) uploadPhoto(e.target.files[0]); }} />
                      </label>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">화보 컨셉 (1개 선택)</p>
                <div className="grid grid-cols-4 gap-2">
                  {selfieConcepts.map(c => {
                    const on = selectedConcept === c.id;
                    return <button key={c.id} onClick={() => setSelectedConcept(c.id)} className={'px-3 py-2 rounded-lg border text-xs font-medium transition-all ' + (on ? 'border-stone-800 bg-stone-800 text-white' : 'border-stone-200 text-stone-500 hover:border-stone-300')}>{c.name}</button>;
                  })}
                </div>
              </div>
            </>) : (<>
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
            </>)}
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">예식장 / 부모님 (엔딩 크레딧)</p>
            <input value={freeVenue} onChange={e => setFreeVenue(e.target.value)} placeholder="예식장 (예: 더채플하우스 3층)" className="w-full px-4 py-2.5 rounded-lg border border-stone-200 text-sm focus:border-stone-400 outline-none mb-2" />
            <div className="grid grid-cols-2 gap-2">
              <input value={freeGroomFather} onChange={e => setFreeGroomFather(e.target.value)} placeholder="신랑 아버지" className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-stone-400 outline-none" />
              <input value={freeGroomMother} onChange={e => setFreeGroomMother(e.target.value)} placeholder="신랑 어머니" className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-stone-400 outline-none" />
              <input value={freeBrideFather} onChange={e => setFreeBrideFather(e.target.value)} placeholder="신부 아버지" className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-stone-400 outline-none" />
              <input value={freeBrideMother} onChange={e => setFreeBrideMother(e.target.value)} placeholder="신부 어머니" className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-stone-400 outline-none" />
            </div>
            <input value={freeEndingMessage} onChange={e => setFreeEndingMessage(e.target.value)} placeholder="엔딩 메시지 (예: 오늘, 우리의 영원이 시작됩니다)" className="w-full mt-2 px-4 py-2.5 rounded-lg border border-stone-200 text-sm focus:border-stone-400 outline-none" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">글꼴</p>
            <div className="grid grid-cols-3 gap-2">
              {freeFonts.map(f => {
                const isActive = freeFont === f.id;
                return (
                  <button key={f.id} onClick={() => setFreeFont(f.id)} className={'p-3 rounded-lg border text-left transition-all ' + (isActive ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300')}>
                    <p className="text-[10px] text-stone-400">{f.name}</p>
                    <p style={{ fontFamily: "'" + f.id + "', sans-serif", fontSize: 14 }} className="text-stone-800 mt-0.5">{f.id === 'GreatVibes-Regular' ? 'Love Story' : '사랑해요'}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">배경음악</p>
            {freeBgms.length === 0 ? (
              <p className="text-xs text-stone-300">관리자 BGM에서 식전영상 카테고리로 등록하세요</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {freeBgms.map(b => {
                  const isActive = freeBgm?.id === b.id;
                  return (
                    <button key={b.id} onClick={() => setFreeBgm(b)} className={'p-3 rounded-lg border text-left transition-all relative ' + (isActive ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300')}>
                      <p className="text-sm font-medium text-stone-800 truncate">{b.title}</p>
                      <p className="text-[10px] text-stone-400">{b.artist}</p>
                      <span onClick={(e) => { e.stopPropagation(); if (playingBgm === b.id) { audioRef.pause(); setPlayingBgm(null); } else { audioRef.src = b.url; audioRef.volume = 0.3; audioRef.play(); setPlayingBgm(b.id); } }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center hover:bg-stone-300 text-[10px]">{playingBgm === b.id ? '||' : '▶'}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">자막 스타일</p>
            <div className="grid grid-cols-2 gap-2">
              {subStyles.map(s => {
                const isActive = freeSubStyle === s.id;
                return (
                  <button key={s.id} onClick={() => setFreeSubStyle(s.id)} className={'p-3 rounded-lg border text-left transition-all ' + (isActive ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300')}>
                    <p className="text-sm font-medium text-stone-800">{s.name}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{s.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">영상 엔진</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'seedance15' as const, name: 'SD 1.5 Pro', desc: '기본 엔진', cost: '~$0.005/clip' },
                { id: 'kling' as const, name: 'Kling 3.0', desc: '실험용', cost: '~$0.55/clip' },
              ]).map(e => {
                const isActive = freeEngine === e.id;
                return (
                  <button key={e.id} onClick={() => setFreeEngine(e.id)} className={'p-3 rounded-lg border text-left transition-all ' + (isActive ? e.id.startsWith('seedance') ? 'border-violet-600 bg-violet-50' : 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300')}>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-stone-800">{e.name}</p>
                      {e.id.startsWith('seedance') && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 font-semibold">NEW</span>}
                    </div>
                    <p className="text-[10px] text-stone-400 mt-0.5">{e.desc} {e.cost}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <button onClick={startFree} disabled={generating || freePhotos.length < (freeMode === 'selfie' ? 1 : 3) || !freeForm.groomName || !freeForm.brideName} className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm font-semibold disabled:opacity-30 flex items-center justify-center gap-2 hover:bg-stone-900 transition-colors">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generating ? '생성 중... (약 ' + (freeEngine === 'kling' ? '8' : '3') + '분)' : '무료 생성 시작'}
          </button>
          <p className="text-[10px] text-stone-300 text-center"></p>
        </div>
      </>)}

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
            const isActive = ACTIVE_STATUSES.includes(o.status);
            return (
              <div key={o.id} onClick={() => setSelectedOrder(o)} className="bg-white rounded-xl border border-stone-200 p-4 cursor-pointer hover:border-stone-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-800">{o.groomName} & {o.brideName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: st.color + '15', color: st.color }}>
                      {isActive && <Loader2 size={10} className="animate-spin" />}
                      {o.status === 'DONE' && <Check size={10} />}
                      {o.status === 'FAILED' && <AlertCircle size={10} />}
                      {st.label}
                    </span>
                  </div>
                  <span className="text-xs text-stone-400">{isActive ? elapsed(o.createdAt) : formatDate(o.createdAt)}</span>
                </div>
                {isActive && (
                  <div className="mb-2">
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: st.progress + '%', background: st.color }} />
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: st.color }}>{st.desc}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-stone-400">
                  <span>{o.user?.email || '-'}</span>
                  <span>{o.photos?.length || 0}장</span>
                  <span>{(o.amount || 0).toLocaleString()}원</span>
                  {o.totalCost != null && <span>원가 ${o.totalCost.toFixed(2)}</span>}
                  {o.paidAt && <span>결제 완료</span>}
                </div>
                {o.errorMsg && <p className="text-xs text-red-400 mt-2 truncate">{o.errorMsg}</p>}
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-stone-800 text-lg">{selectedOrder.groomName} & {selectedOrder.brideName}</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-stone-100 rounded-lg"><X size={18} className="text-stone-400" /></button>
            </div>

            {ACTIVE_STATUSES.includes(selectedOrder.status) && (
              <div className="mb-6 p-4 rounded-xl" style={{ background: (STATUS_MAP[selectedOrder.status]?.color || '#999') + '08' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 size={16} className="animate-spin" style={{ color: STATUS_MAP[selectedOrder.status]?.color }} />
                  <span className="text-sm font-semibold" style={{ color: STATUS_MAP[selectedOrder.status]?.color }}>{STATUS_MAP[selectedOrder.status]?.label}</span>
                  <span className="text-xs text-stone-400 ml-auto">{elapsed(selectedOrder.createdAt)}</span>
                </div>
                <div className="flex gap-1 mb-2">
                  {STATUS_FLOW.slice(1, -1).map((s, i) => {
                    const currentIdx = STATUS_FLOW.indexOf(selectedOrder.status);
                    const stepIdx = i + 1;
                    const isDone = stepIdx < currentIdx;
                    const isCurrent = stepIdx === currentIdx;
                    return (
                      <div key={s} className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#e7e5e4' }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{
                          width: isDone ? '100%' : isCurrent ? '60%' : '0%',
                          background: STATUS_MAP[s]?.color || '#999',
                        }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>분석</span>
                  <span>생성</span>
                  <span>조립</span>
                </div>
                <p className="text-xs text-stone-500 mt-3">{STATUS_MAP[selectedOrder.status]?.desc}</p>
                <button onClick={() => cancelOrder(selectedOrder.id)} className="mt-4 flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                  <Ban size={14} /> 생성 취소
                </button>
              </div>
            )}

            {selectedOrder.status === 'DONE' && selectedOrder.outputUrl && (
              <div className="mb-6">
                <video src={selectedOrder.outputUrl} controls playsInline className="w-full rounded-xl" style={{ maxHeight: 400 }} />
                <a href={selectedOrder.outputUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-900 transition-colors">
                  <Download size={14} /> 다운로드
                </a>
              </div>
            )}

            {selectedOrder.status === 'FAILED' && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={14} className="text-red-400" />
                  <span className="text-sm font-medium text-red-500">생성 실패</span>
                </div>
                <p className="text-xs text-red-400 mb-3">{selectedOrder.errorMsg}</p>
                <div className="flex gap-2">
                  <button onClick={() => retryOrder(selectedOrder.id)} className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-900 transition-colors">
                    <RotateCcw size={14} /> 다시 생성
                  </button>
                  <button onClick={() => resumeOrder(selectedOrder.id)} className="flex items-center gap-2 px-4 py-2 border border-stone-800 text-stone-800 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors">
                    <RotateCcw size={14} /> 조립만 재시도
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-stone-400">상태</span><span className="font-medium" style={{ color: (STATUS_MAP[selectedOrder.status] || STATUS_MAP.PENDING).color }}>{(STATUS_MAP[selectedOrder.status] || STATUS_MAP.PENDING).label}</span></div>
              <div className="flex justify-between"><span className="text-stone-400">주문번호</span><span className="font-mono text-xs">{selectedOrder.orderId}</span></div>
              <div className="flex justify-between"><span className="text-stone-400">결제금액</span><span>{selectedOrder.amount.toLocaleString()}원</span></div>
              {selectedOrder.totalCost != null && <div className="flex justify-between"><span className="text-stone-400">원가</span><span>{'$' + selectedOrder.totalCost.toFixed(2)}</span></div>}
              {selectedOrder.weddingDate && <div className="flex justify-between"><span className="text-stone-400">결혼일</span><span>{selectedOrder.weddingDate}</span></div>}
              <div className="flex justify-between"><span className="text-stone-400">사진</span><span>{selectedOrder.photos?.length || 0}장</span></div>
              {selectedOrder.totalDuration != null && <div className="flex justify-between"><span className="text-stone-400">영상 길이</span><span>{selectedOrder.totalDuration.toFixed(1)}초</span></div>}
              <div className="flex justify-between"><span className="text-stone-400">생성 시각</span><span>{formatDate(selectedOrder.createdAt)}</span></div>
            </div>

            {selectedOrder.photos && selectedOrder.photos.length > 0 && (
              <div className="mt-5">
                <p className="text-xs text-stone-400 mb-2">업로드 사진</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedOrder.photos as string[]).map((url, i) => (
                    <img key={i} src={url} className="w-16 h-20 rounded-lg object-cover border border-stone-100" />
                  ))}
                </div>
              </div>
            )}

            {selectedOrder.subtitles && (selectedOrder.subtitles as string[]).length > 0 && (
              <div className="mt-5">
                <p className="text-xs text-stone-400 mb-2">생성된 자막</p>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedOrder.subtitles as string[]).map((s, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">{s || '(무음)'}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
