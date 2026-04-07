import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Search, Trash2, ExternalLink, Loader2, Image,
  Zap, RefreshCw, Camera, X, Download, Users, User, ChevronDown
} from 'lucide-react';

interface AiSnapItem {
  id: string;
  concept: string;
  engine: string;
  status: string;
  resultUrl?: string;
  errorMsg?: string;
  createdAt: string;
  wedding?: { id: string; slug: string; groomName: string; brideName: string; } | null;
  user?: { id: string; name: string; email: string };
}

interface Stats { total: number; done: number; failed: number; generating: number; }

const CONCEPTS = [
  { id: 'studio_classic', label: '스튜디오 클래식' },
  { id: 'studio_gallery', label: '갤러리' },
  { id: 'studio_fog', label: '포그' },
  { id: 'studio_mocha', label: '모카' },
  { id: 'studio_sage', label: '세이지' },
  { id: 'hanbok_wonsam', label: '궁중 혼례' },
  { id: 'hanbok_dangui', label: '당의 한복' },
  { id: 'hanbok_modern', label: '모던 한복' },
  { id: 'hanbok_saeguk', label: '사극풍' },
  { id: 'hanbok_flower', label: '꽃한복' },
  { id: 'spring_letter', label: '봄: 러브레터' },
  { id: 'summer_rain', label: '여름: 소나기' },
  { id: 'autumn_film', label: '가을: 필름' },
  { id: 'winter_zhivago', label: '겨울: 지바고' },
  { id: 'cherry_blossom', label: '벚꽃' },
  { id: 'forest_wedding', label: '숲속 웨딩' },
  { id: 'castle_garden', label: '유럽 궁전' },
  { id: 'cathedral', label: '성당 웨딩' },
  { id: 'watercolor', label: '수채화' },
  { id: 'rose_garden', label: '장미 정원' },
  { id: 'rainy_day', label: '비오는 날' },
  { id: 'grass_rain', label: '풀밭' },
  { id: 'eternal_blue', label: '블루' },
  { id: 'water_memory', label: '물의 기억' },
  { id: 'blue_hour', label: '블루아워' },
  { id: 'black_swan', label: '블랙스완' },
  { id: 'velvet_rouge', label: '벨벳 루즈' },
  { id: 'heart_editorial', label: '하이 에디토리얼' },
  { id: 'magazine_cover', label: '매거진 커버' },
  { id: 'city_night', label: '시티 나이트' },
  { id: 'vintage_film', label: '빈티지 필름' },
  { id: 'vintage_record', label: '빈티지 레코드' },
  { id: 'vintage_tungsten', label: '빈티지 텅스텐' },
  { id: 'retro_hongkong', label: '레트로 홍콩' },
  { id: 'cruise_sunset', label: '크루즈 선셋' },
  { id: 'cruise_bluesky', label: '크루즈 블루스카이' },
  { id: 'iphone_selfie', label: '셀카 스냅' },
  { id: 'iphone_mirror', label: '거울 셀카' },
  { id: 'aao', label: '에에올' },
  { id: 'lovesick', label: '러브시크' },
  { id: 'silver_thread', label: '실버스레드' },
  { id: 'summer_tape', label: '서머 테이프' },
  { id: 'rouge_clue', label: '루즈 클루' },
];

const CONCEPT_MAP = Object.fromEntries(CONCEPTS.map(c => [c.id, c.label]));

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  done: { label: '완료', cls: 'bg-emerald-100 text-emerald-700' },
  failed: { label: '실패', cls: 'bg-red-100 text-red-600' },
  generating: { label: '생성중', cls: 'bg-amber-100 text-amber-700' },
  processing: { label: '대기중', cls: 'bg-stone-100 text-stone-600' },
};

type Mode = 'couple' | 'groom' | 'bride';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function AdminAiSnap() {
  const [snaps, setSnaps] = useState<AiSnapItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [showGen, setShowGen] = useState(true);

  const [mode, setMode] = useState<Mode>('groom');
  const [concept, setConcept] = useState('studio_classic');
  const [groomPhoto, setGroomPhoto] = useState('');
  const [bridePhoto, setBridePhoto] = useState('');
  const [couplePhoto, setCouplePhoto] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const stepRef = useRef<ReturnType<typeof setInterval>>();
  const GEN_STEPS = ['AI가 컨셉을 분석하고 있어요', '이미지를 생성하고 있어요', '얼굴을 정밀 보정 중이에요', '고화질로 변환하고 있어요', '거의 다 됐어요'];
  const [results, setResults] = useState<{ id: string; url: string; concept: string; mode: string }[]>([]);
  const pollRef = useRef<ReturnType<typeof setTimeout>>();

  const token = localStorage.getItem('token');

  const api = (path: string, opts?: RequestInit) =>
    fetch(`${import.meta.env.VITE_API_URL}/ai-snap/admin${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts?.headers },
    });

  const load = async () => {
    setLoading(true);
    try {
      const [snapRes, statsRes] = await Promise.all([api('/list'), api('/stats')]);
      const snapData = await snapRes.json();
      const statsData = await statsRes.json();
      if (Array.isArray(snapData)) setSnaps(snapData);
      if (statsData.total !== undefined) setStats(statsData);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    if (stepRef.current) clearInterval(stepRef.current);
  }, []);

  const uploadPhoto = async (file: File, type: 'groom' | 'bride' | 'couple') => {
    setUploading(type);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (type === 'groom') setGroomPhoto(data.secure_url);
      else if (type === 'bride') setBridePhoto(data.secure_url);
      else setCouplePhoto(data.secure_url);
    } catch {}
    setUploading(null);
  };

  const getUrls = () => {
    if (mode === 'couple') return [couplePhoto];
    if (mode === 'groom') return [groomPhoto];
    return [bridePhoto];
  };

  const canGen = () => {
    if (generating) return false;
    if (mode === 'couple') return !!couplePhoto;
    if (mode === 'groom') return !!groomPhoto;
    return !!bridePhoto;
  };

  const generate = async () => {
    if (!canGen()) return;
    if (pollRef.current) clearTimeout(pollRef.current);
    if (stepRef.current) clearInterval(stepRef.current);
    setGenerating(true);
    setGenStep(0);
    stepRef.current = setInterval(() => setGenStep(prev => Math.min(prev + 1, 4)), 5000);
    try {
      const res = await api('/quick-generate', {
        method: 'POST',
        body: JSON.stringify({ concept, imageUrls: getUrls(), mode }),
      });
      const data = await res.json();
      if (data.status === 'done' && data.resultUrl) {
        setResults(prev => [{ id: Date.now().toString(), url: data.resultUrl, concept, mode }, ...prev]);
        setGenerating(false);
        clearInterval(stepRef.current);
        return;
      }
      if (data.statusUrl) {
        let pollCount = 0;
        const MAX_POLLS = 60;
        const poll = async () => {
          pollCount++;
          if (pollCount > MAX_POLLS) {
            setGenerating(false);
            clearInterval(stepRef.current);
            return;
          }
          try {
            const pRes = await api(`/poll?statusUrl=${encodeURIComponent(data.statusUrl)}&responseUrl=${encodeURIComponent(data.responseUrl)}&mode=${encodeURIComponent(mode)}&imageUrls=${encodeURIComponent(JSON.stringify(getUrls()))}&_t=${Date.now()}`);
            const pData = await pRes.json();
            if (pData.status === 'done' && pData.resultUrl) {
              setResults(prev => [{ id: Date.now().toString(), url: pData.resultUrl, concept, mode }, ...prev]);
              setGenerating(false);
              clearInterval(stepRef.current);
            } else if (pData.status === 'failed') {
              setGenerating(false);
              clearInterval(stepRef.current);
            } else {
              pollRef.current = setTimeout(poll, 3000);
            }
          } catch {
            setGenerating(false);
            clearInterval(stepRef.current);
          }
        };
        pollRef.current = setTimeout(poll, 3000);
      }
    } catch {
      setGenerating(false);
      clearInterval(stepRef.current);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await api(`/${id}`, { method: 'DELETE' });
    setSnaps(prev => prev.filter(s => s.id !== id));
  };

  const filtered = snaps.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.wedding?.groomName || "").toLowerCase().includes(q)
      || (s.wedding?.brideName || "").toLowerCase().includes(q)
      || (s.wedding?.slug || "").toLowerCase().includes(q)
      || (s.user?.name || "").toLowerCase().includes(q)
      || (s.user?.email || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-800 to-stone-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900">AI 웨딩스냅</h1>
            <p className="text-sm text-stone-400">빠른 생성 및 전체 관리</p>
          </div>
        </div>
        <button onClick={load} className="p-2 hover:bg-stone-100 rounded-lg">
          <RefreshCw className={`w-5 h-5 text-stone-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <button onClick={() => setShowGen(v => !v)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-stone-800">빠른 생성</span>
            <span className="text-xs text-stone-400">관리자 전용, 무제한</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${showGen ? 'rotate-180' : ''}`} />
        </button>

        {showGen && (
          <div className="px-5 pb-5 border-t border-stone-100 pt-4 space-y-4">
            <div className="flex gap-2">
              {(['groom', 'bride', 'couple'] as Mode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${mode === m ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
                  {m === 'couple' ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  {m === 'groom' ? '신랑' : m === 'bride' ? '신부' : '커플'}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              {mode === 'couple' && (
                <MiniUpload label="커플 사진" photo={couplePhoto} uploading={uploading === 'couple'}
                  onUpload={f => uploadPhoto(f, 'couple')} onClear={() => setCouplePhoto('')} />
              )}
              {(mode === 'groom' || mode === 'bride') && (
                <MiniUpload label={mode === 'groom' ? '신랑' : '신부'} photo={mode === 'groom' ? groomPhoto : bridePhoto} uploading={uploading === (mode === 'groom' ? 'groom' : 'bride')}
                  onUpload={f => uploadPhoto(f, mode)} onClear={() => mode === 'groom' ? setGroomPhoto('') : setBridePhoto('')} />
              )}
            </div>
            {mode === 'couple' && <p className="text-xs text-stone-400">둘이 함께 찍은 사진을 올려주세요</p>}

            <select value={concept} onChange={e => setConcept(e.target.value)}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-300">
              {CONCEPTS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>

            <button onClick={generate} disabled={!canGen()}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-30"
              style={{ background: canGen() ? '#1c1917' : '#d6d3d1' }}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? GEN_STEPS[genStep] : '생성하기'}
            </button>

            {results.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {results.map((r) => (
                  <div key={r.id} className="relative group">
                    <div onClick={() => setViewUrl(r.url)} className="aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-stone-200 hover:border-stone-400 transition-all">
                      <img src={r.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[9px] bg-black/50 text-white rounded-md backdrop-blur-sm">
                      {CONCEPT_MAP[r.concept]}
                    </span>
                    <a href={r.url} download target="_blank"
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-md text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                      <Download className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="전체" value={stats.total} icon={Image} />
          <StatCard label="완료" value={stats.done} icon={Sparkles} color="text-emerald-600" />
          <StatCard label="생성중" value={stats.generating} icon={Loader2} color="text-amber-600" />
          <StatCard label="실패" value={stats.failed} icon={Zap} color="text-red-500" />
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="이름, 슬러그로 검색..." className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-stone-400 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-stone-400 text-sm">생성된 AI 웨딩스냅이 없습니다</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(snap => {
            const st = STATUS_STYLES[snap.status] || STATUS_STYLES.processing;
            return (
              <div key={snap.id} className="bg-white rounded-xl border border-stone-200 p-3 flex items-center gap-3">
                {snap.resultUrl ? (
                  <div onClick={() => setViewUrl(snap.resultUrl!)} className="w-14 h-[72px] rounded-lg overflow-hidden cursor-pointer border border-stone-200 hover:border-stone-400 flex-shrink-0">
                    <img src={snap.resultUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-[72px] rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0"><Image className="w-4 h-4 text-stone-300" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-stone-800 truncate">
                      {snap.wedding ? `${snap.wedding.groomName} & ${snap.wedding.brideName}` : 'AI스냅 단독'}
                    </p>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${st.cls}`}>{st.label}</span>
                  </div>
                  <p className="text-xs text-stone-500">{snap.user?.name || snap.user?.email || '알수없음'}</p>
                  <p className="text-xs text-stone-500">{CONCEPT_MAP[snap.concept] || snap.concept}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">{new Date(snap.createdAt).toLocaleString('ko-KR')}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {snap.resultUrl && (
                    <a href={snap.resultUrl} target="_blank" className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4 text-stone-400" />
                    </a>
                  )}
                  <button onClick={() => handleDelete(snap.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewUrl && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewUrl(null)}>
          <button onClick={() => setViewUrl(null)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
          <img src={viewUrl} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
          <a href={viewUrl} download target="_blank" onClick={e => e.stopPropagation()}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 bg-white text-stone-900 rounded-full text-xs font-medium hover:bg-stone-100">
            <Download className="w-3.5 h-3.5" /> 저장
          </a>
        </div>
      )}
    </div>
  );
}

function MiniUpload({ label, photo, uploading, onUpload, onClear }: {
  label: string; photo: string; uploading: boolean; onUpload: (f: File) => void; onClear: () => void;
}) {
  return photo ? (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-200 flex-shrink-0">
      <img src={photo} alt={label} className="w-full h-full object-cover" />
      <button onClick={onClear} className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white"><X className="w-3 h-3" /></button>
      <div className="absolute bottom-0 inset-x-0 py-0.5 bg-black/40 text-center"><span className="text-[9px] text-white">{label}</span></div>
    </div>
  ) : (
    <label className={`w-20 h-20 rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer hover:border-stone-400 flex-shrink-0 ${uploading ? 'opacity-50' : ''}`}>
      {uploading ? <Loader2 className="w-4 h-4 text-stone-400 animate-spin" /> : (
        <>
          <Camera className="w-4 h-4 text-stone-400 mb-0.5" />
          <span className="text-[10px] text-stone-500">{label}</span>
        </>
      )}
      <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} className="hidden" disabled={uploading} />
    </label>
  );
}

function StatCard({ label, value, icon: Icon, color = 'text-stone-800' }: { label: string; value: number; icon: any; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-3">
      <Icon className={`w-5 h-5 ${color}`} />
      <div>
        <p className="text-xs text-stone-400">{label}</p>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}
