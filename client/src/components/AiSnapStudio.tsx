import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Camera, X, Download,
  Loader2, Trash2, ChevronRight, Image, Users, User, Zap, ImagePlus
} from 'lucide-react';

interface Concept { id: string; label: string; }
interface AiSnap {
  id: string; concept: string; engine: string;
  status: string; resultUrl?: string; errorMsg?: string; createdAt: string;
}
interface Quota { max: number; used: number; remaining: number; isAdmin: boolean; packageSlug: string; extraPrice?: number; }
interface GalleryItem { id: string; mediaUrl: string; mediaType: string; }
interface Props { weddingId: string; }

const CONCEPT_META: Record<string, { emoji: string; sub: string }> = {
  studio_classic: { emoji: 'S', sub: '정석 웨딩 화보' },
  outdoor_garden: { emoji: 'G', sub: '꽃과 자연빛' },
  beach_sunset: { emoji: 'B', sub: '노을빛 해변' },
  hanbok_traditional: { emoji: 'H', sub: '한복 전통' },
  hanbok_wonsam: { emoji: 'H', sub: '궁중 혼례' },
  hanbok_dangui: { emoji: 'H', sub: '당의 한복' },
  hanbok_modern: { emoji: 'H', sub: '모던 한복' },
  hanbok_saeguk: { emoji: 'H', sub: '사극풍' },
  hanbok_flower: { emoji: 'H', sub: '꽃한복' },
  city_night: { emoji: 'N', sub: '도시 야경' },
  cherry_blossom: { emoji: 'C', sub: '벚꽃잎 흩날림' },
  forest_wedding: { emoji: 'F', sub: '숲속 빛내림' },
  castle_garden: { emoji: 'K', sub: '유럽 고성' },
  cathedral: { emoji: 'T', sub: '성당 스테인드글라스' },
  watercolor: { emoji: 'W', sub: '파스텔 수채화' },
  magazine_cover: { emoji: 'M', sub: '하이패션 화보' },
  rainy_day: { emoji: 'R', sub: '감성 빗속' },
  autumn_leaves: { emoji: 'A', sub: '단풍길 로맨스' },
  winter_snow: { emoji: 'I', sub: '눈 내리는 날' },
  vintage_film: { emoji: 'V', sub: '필름 감성' },
  cruise_sunset: { emoji: 'S', sub: '선셋 요트' },
  iphone_selfie: { emoji: 'P', sub: '힙한 셀카' },
  iphone_mirror: { emoji: 'P', sub: '거울 플래시' },
  cruise_bluesky: { emoji: 'B', sub: '청명한 바다' },
  vintage_record: { emoji: 'V', sub: '레코드샵 레트로' },
  retro_hongkong: { emoji: 'H', sub: '홍콩 야시장' },
};

type Mode = 'couple' | 'groom' | 'bride';
const MODE_CONFIG = {
  couple: { label: '커플 화보', icon: Users, desc: '둘이 함께' },
  groom: { label: '신랑 단독', icon: User, desc: '신랑만' },
  bride: { label: '신부 단독', icon: User, desc: '신부만' },
};

const PACKAGE_NAMES: Record<string, string> = {
  free: '무료 체험',
  lite: 'Lite',
  basic: 'Basic',
  'ai-reception': 'AI Reception',
  'basic-video': 'Basic+영상',
  admin: '관리자',
};

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function AiSnapStudio({ weddingId }: Props) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState('');
  const [mode, setMode] = useState<Mode>('couple');
  const [groomPhoto, setGroomPhoto] = useState('');
  const [bridePhoto, setBridePhoto] = useState('');
  const [couplePhoto, setCouplePhoto] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [snaps, setSnaps] = useState<AiSnap[]>([]);
  const [viewSnap, setViewSnap] = useState<AiSnap | null>(null);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval>>();
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryItem[]>([]);
  const [pickFor, setPickFor] = useState<'groom' | 'bride' | 'couple' | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const token = localStorage.getItem('token');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const api = (path: string, opts?: RequestInit) =>
    fetch(`${import.meta.env.VITE_API_URL}/ai-snap${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts?.headers },
    });

  useEffect(() => {
    api('/concepts').then(r => r.json()).then(setConcepts).catch(() => {});
    api(`/list/${weddingId}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setSnaps(d); }).catch(() => {});
    api(`/quota/${weddingId}`).then(r => r.json()).then(setQuota).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL}/weddings/${weddingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      if (d.galleries) setGalleryPhotos(d.galleries.filter((g: any) => g.mediaType === 'IMAGE'));
    }).catch(() => {});
  }, [weddingId]);

  useEffect(() => {
    if (!pollingId) return;
    intervalRef.current = setInterval(async () => {
      try {
        const res = await api(`/status/${pollingId}`);
        const snap = await res.json();
        if (snap.status === 'done' || snap.status === 'failed') {
          clearInterval(intervalRef.current);
          setPollingId(null);
          setGenerating(false);
          setSnaps(prev => {
            const exists = prev.find(s => s.id === snap.id);
            if (exists) return prev.map(s => s.id === snap.id ? snap : s);
            return [snap, ...prev];
          });
        }
      } catch {}
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [pollingId]);

  const uploadPhoto = async (file: File, type: 'groom' | 'bride' | 'couple') => {
    setUploading(type);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (type === 'groom') setGroomPhoto(data.secure_url);
      else if (type === 'bride') setBridePhoto(data.secure_url);
      else setCouplePhoto(data.secure_url);
    } catch {}
    setUploading(null);
  };

  const getImageUrls = (): string[] => {
    if (mode === 'couple') return [couplePhoto];
    if (mode === 'groom') return [groomPhoto];
    return [bridePhoto];
  };

  const canGenerate = () => {
    if (!selectedConcept || generating) return false;
    if (mode === 'couple') return !!couplePhoto;
    if (mode === 'groom') return !!groomPhoto;
    return !!bridePhoto;
  };

  const isQuotaExhausted = quota && !quota.isAdmin && quota.remaining <= 0;

  const handleGenerate = async () => {
    if (!canGenerate() || isQuotaExhausted) return;
    setGenerating(true);
    setProgress(0);
    progressRef.current = setInterval(() => setProgress(p => p >= 92 ? 92 : p + Math.random() * 8), 800);
    try {
      const res = await api('/generate', {
        method: 'POST',
        body: JSON.stringify({ weddingId, concept: selectedConcept, imageUrls: getImageUrls(), mode }),
      });
      const data = await res.json();
      if (data.error) {
        setGenerating(false);
        if (data.quota) setQuota(data.quota);
        return;
      }
      if (data.id) {
        setPollingId(data.id);
        if (data.quota) setQuota(data.quota);
        setSnaps(prev => [{ ...data, concept: selectedConcept, engine: 'nano-banana-pro', createdAt: new Date().toISOString() }, ...prev]);
      }
    } catch {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api(`/${id}`, { method: 'DELETE' });
    setSnaps(prev => prev.filter(s => s.id !== id));
    api(`/quota/${weddingId}`).then(r => r.json()).then(setQuota).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL}/weddings/${weddingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      if (d.galleries) setGalleryPhotos(d.galleries.filter((g: any) => g.mediaType === 'IMAGE'));
    }).catch(() => {});
  };

  const needsGroom = mode === 'groom';
  const needsBride = mode === 'bride';
  const needsCouple = mode === 'couple';

  return (
    <div className="space-y-8">
      <p className="text-xs text-stone-400">사진으로 다양한 컨셉의 웨딩 화보를 만들어보세요</p>

      {quota && (
        <div className={`rounded-2xl border p-4 flex items-center justify-between ${isQuotaExhausted ? 'border-red-200 bg-red-50/50' : 'border-stone-200 bg-stone-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isQuotaExhausted ? 'bg-red-100' : 'bg-stone-200'}`}>
              <Zap className={`w-4 h-4 ${isQuotaExhausted ? 'text-red-500' : 'text-stone-600'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">
                {PACKAGE_NAMES[quota.packageSlug] || quota.packageSlug}
              </p>
              <p className="text-xs text-stone-400">
                {quota.isAdmin ? '무제한 생성' : `${quota.used}/${quota.max}장 사용`}
              </p>
            </div>
          </div>
          {!quota.isAdmin && (
            <div className="text-right">
              {quota.remaining > 0 ? (
                <span className="text-sm font-bold text-stone-800">{quota.remaining}장 남음</span>
              ) : (
                <span className="text-sm font-bold text-red-500">소진 완료</span>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <StepLabel num={1} text="모드 선택" sub="커플 또는 단독을 선택하세요" />
        <div className="grid grid-cols-3 gap-2 mt-3">
          {(Object.keys(MODE_CONFIG) as Mode[]).map(m => {
            const cfg = MODE_CONFIG[m];
            const Icon = cfg.icon;
            const sel = mode === m;
            return (
              <button key={m} onClick={() => setMode(m)}
                className={`py-3 px-2 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${sel ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}`}>
                <Icon className={`w-5 h-5 ${sel ? 'text-stone-800' : 'text-stone-400'}`} />
                <span className={`text-xs font-semibold ${sel ? 'text-stone-800' : 'text-stone-500'}`}>{cfg.label}</span>
                <span className="text-[10px] text-stone-400">{cfg.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <StepLabel num={2} text="사진 업로드" sub={mode === 'couple' ? '둘이 함께 찍은 사진 1장' : '정면 얼굴이 잘 보이는 사진이 좋아요'} />
        <div className="grid gap-3 mt-3 grid-cols-1 max-w-[200px]">
          {needsCouple && <PhotoUpload label="커플 사진" photo={couplePhoto} uploading={uploading === 'couple'} onUpload={f => uploadPhoto(f, 'couple')} onClear={() => setCouplePhoto('')} onGalleryPick={() => setPickFor('couple')} hasGallery={galleryPhotos.length > 0} />}
          {needsGroom && <PhotoUpload label="신랑" photo={groomPhoto} uploading={uploading === 'groom'} onUpload={f => uploadPhoto(f, 'groom')} onClear={() => setGroomPhoto('')} onGalleryPick={() => setPickFor('groom')} hasGallery={galleryPhotos.length > 0} />}
          {needsBride && <PhotoUpload label="신부" photo={bridePhoto} uploading={uploading === 'bride'} onUpload={f => uploadPhoto(f, 'bride')} onClear={() => setBridePhoto('')} onGalleryPick={() => setPickFor('bride')} hasGallery={galleryPhotos.length > 0} />}
        </div>
      </div>

      <div>
        <StepLabel num={3} text="웨딩 컨셉" sub="원하는 분위기를 골라주세요" />
        <div className="grid grid-cols-2 gap-2 mt-3">
          {concepts.map(c => {
            const meta = CONCEPT_META[c.id] || { emoji: '?', sub: '' };
            const sel = selectedConcept === c.id;
            return (
              <button key={c.id} onClick={() => setSelectedConcept(c.id)}
                className={`rounded-2xl py-3.5 px-4 text-left transition-all duration-200 border-2 ${sel ? 'border-stone-800 bg-stone-800' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${sel ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                    {meta.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${sel ? 'text-white' : 'text-stone-800'}`}>{c.label}</p>
                    <p className={`text-[11px] truncate ${sel ? 'text-white/60' : 'text-stone-400'}`}>{meta.sub}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isQuotaExhausted ? (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-5 text-center">
          <p className="text-sm font-semibold text-red-600">생성 가능 횟수를 모두 사용했어요</p>
          <p className="text-xs text-red-400 mt-1">패키지를 업그레이드하면 더 많은 웨딩스냅을 만들 수 있어요</p>
        </div>
      ) : generating ? (
        <div className="rounded-2xl bg-stone-50 border border-stone-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">AI가 웨딩스냅을 만들고 있어요</p>
              <p className="text-xs text-stone-400 mt-0.5">보통 30초~1분 정도 소요돼요</p>
            </div>
          </div>
          <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div className="h-full bg-stone-800 rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-stone-400 mt-2 text-right">{Math.round(progress)}%</p>
        </div>
      ) : (
        <button onClick={handleGenerate} disabled={!canGenerate()}
          className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-30 active:scale-[0.98]"
          style={{ background: canGenerate() ? 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)' : '#d6d3d1' }}>
          <Sparkles className="w-5 h-5" />
          <span>웨딩스냅 생성하기</span>
          {quota && !quota.isAdmin && <span className="text-xs opacity-60 ml-1">({quota.remaining}장 남음)</span>}
          <ChevronRight className="w-4 h-4 opacity-60" />
        </button>
      )}

      {snaps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Image className="w-4 h-4 text-stone-500" />
            <p className="text-sm font-semibold text-stone-700">생성된 웨딩스냅</p>
            <span className="text-xs text-stone-400 ml-auto">{snaps.filter(s => s.status === 'done').length}장</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {snaps.map(snap => (
              <div key={snap.id} className="relative group">
                {snap.status === 'done' && snap.resultUrl ? (
                  <div onClick={() => setViewSnap(snap)} className="aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border border-stone-200 hover:border-stone-400 transition-all hover:shadow-lg">
                    <img src={snap.resultUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ) : snap.status === 'failed' ? (
                  <div className="aspect-[3/4] rounded-2xl border border-red-100 flex flex-col items-center justify-center bg-red-50/50">
                    <X className="w-5 h-5 text-red-300 mb-1" />
                    <p className="text-[11px] text-red-400">생성 실패</p>
                  </div>
                ) : (
                  <div className="aspect-[3/4] rounded-2xl border border-stone-200 flex flex-col items-center justify-center bg-stone-50/50">
                    <Loader2 className="w-5 h-5 text-stone-400 animate-spin mb-2" />
                    <p className="text-[11px] text-stone-400">생성 중...</p>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-black/40 text-white backdrop-blur-sm">
                    {concepts.find(c => c.id === snap.concept)?.label || snap.concept}
                  </span>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDelete(snap.id); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full text-white/80 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm hover:bg-black/60">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {pickFor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setPickFor(null)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-stone-100 px-5 py-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-800">갤러리에서 {pickFor === 'groom' ? '신랑' : pickFor === 'bride' ? '신부' : '커플'} 사진 선택</p>
                <button onClick={() => setPickFor(null)} className="p-1 hover:bg-stone-100 rounded-lg">
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-3 gap-2 overflow-y-auto max-h-[60vh]">
                {galleryPhotos.map(g => (
                  <button key={g.id} onClick={() => {
                    if (pickFor === 'groom') setGroomPhoto(g.mediaUrl);
                    else if (pickFor === 'bride') setBridePhoto(g.mediaUrl);
                    else setCouplePhoto(g.mediaUrl);
                    setPickFor(null);
                  }} className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-stone-800 transition-all">
                    <img src={g.mediaUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewSnap?.resultUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewSnap(null)}>
            <button onClick={() => setViewSnap(null)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10">
              <X className="w-6 h-6" />
            </button>
            <img src={viewSnap.resultUrl} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md text-white/80 text-xs rounded-full">
                {concepts.find(c => c.id === viewSnap.concept)?.label || viewSnap.concept}
              </span>
              <a href={viewSnap.resultUrl} download target="_blank" onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-stone-900 rounded-full text-xs font-medium hover:bg-stone-100 transition-colors">
                <Download className="w-3.5 h-3.5" />
                저장
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepLabel({ num, text, sub }: { num: number; text: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-6 h-6 rounded-full bg-stone-800 flex items-center justify-center">
        <span className="text-[11px] font-bold text-white">{num}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-stone-800">{text}</p>
        <p className="text-[11px] text-stone-400">{sub}</p>
      </div>
    </div>
  );
}

function PhotoUpload({ label, photo, uploading, onUpload, onClear, onGalleryPick, hasGallery }: {
  label: string; photo: string; uploading: boolean; onUpload: (f: File) => void; onClear: () => void; onGalleryPick?: () => void; hasGallery?: boolean;
}) {
  return (
    <div className="relative">
      {photo ? (
        <div className="aspect-square rounded-2xl overflow-hidden border border-stone-200 relative group">
          <img src={photo} alt={label} className="w-full h-full object-cover" />
          <button onClick={onClear} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-0 inset-x-0 py-2 bg-gradient-to-t from-black/50 to-transparent text-center">
            <span className="text-xs text-white font-medium">{label}</span>
          </div>
        </div>
      ) : (
        <label className={`aspect-square rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer hover:border-stone-400 hover:bg-stone-50 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? (
            <Loader2 className="w-7 h-7 text-stone-400 animate-spin" />
          ) : (
            <>
              <Camera className="w-7 h-7 text-stone-400 mb-2" />
              <span className="text-xs font-medium text-stone-500">{label} 사진</span>
              <span className="text-[10px] text-stone-400 mt-0.5 mb-3">얼굴이 잘 보이게</span>
              <div className="flex flex-col gap-1.5 w-full px-2" onClick={e => e.stopPropagation()}>
                <label className="flex items-center justify-center gap-1 px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg transition-colors cursor-pointer">
                  <Camera className="w-3 h-3" />
                  <span className="text-[10px] font-medium">사진 업로드</span>
                  <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} className="hidden" disabled={uploading} />
                </label>
                {hasGallery && onGalleryPick && (
                  <button type="button" onClick={onGalleryPick}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors">
                    <ImagePlus className="w-3 h-3 text-stone-500" />
                    <span className="text-[10px] font-medium text-stone-500">갤러리에서 선택</span>
                  </button>
                )}
              </div>
            </>
          )}
        </label>
      )}
    </div>
  );
}
