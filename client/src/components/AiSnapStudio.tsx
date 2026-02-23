import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Camera, X, Download,
  Loader2, Trash2
} from 'lucide-react';

interface Concept {
  id: string;
  label: string;
}

interface AiSnap {
  id: string;
  concept: string;
  engine: string;
  status: string;
  resultUrl?: string;
  errorMsg?: string;
  createdAt: string;
}

interface Props {
  weddingId: string;
}

const CONCEPT_COLORS: Record<string, string> = {
  studio_classic: 'from-stone-800 to-stone-600',
  outdoor_garden: 'from-emerald-700 to-emerald-500',
  beach_sunset: 'from-amber-600 to-orange-400',
  hanbok_traditional: 'from-red-700 to-rose-500',
  city_night: 'from-indigo-800 to-violet-600',
  cherry_blossom: 'from-pink-500 to-pink-300',
  fairytale: 'from-purple-600 to-fuchsia-400',
  watercolor: 'from-cyan-500 to-teal-300',
};

const ENGINE_OPTIONS = [
  { id: 'nano-banana', label: 'Nano Banana Pro', desc: '얼굴 합성 + 장면 생성' },
  { id: 'dreamina', label: 'Dreamina 3.1', desc: '시네마틱 컨셉 생성' },
];

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function AiSnapStudio({ weddingId }: Props) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string>('');
  const [engine, setEngine] = useState('nano-banana');
  const [groomPhoto, setGroomPhoto] = useState<string>('');
  const [bridePhoto, setBridePhoto] = useState<string>('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [snaps, setSnaps] = useState<AiSnap[]>([]);
  const [viewSnap, setViewSnap] = useState<AiSnap | null>(null);
  const token = localStorage.getItem('token');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const api = (path: string, opts?: RequestInit) =>
    fetch(`${import.meta.env.VITE_API_URL}/ai-snap${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts?.headers },
    });

  useEffect(() => {
    api('/concepts').then(r => r.json()).then(setConcepts);
    api(`/list/${weddingId}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setSnaps(d); });
  }, [weddingId]);

  useEffect(() => {
    if (!pollingId) return;
    intervalRef.current = setInterval(async () => {
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
        if (snap.status === 'failed') {
          alert('생성 실패: ' + (snap.errorMsg || '알 수 없는 오류'));
        }
      }
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [pollingId]);

  const uploadPhoto = async (file: File, type: 'groom' | 'bride') => {
    setUploading(type);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (type === 'groom') setGroomPhoto(data.secure_url);
      else setBridePhoto(data.secure_url);
    } catch (err) {
      console.error('Upload error:', err);
    }
    setUploading(null);
  };

  const handleGenerate = async () => {
    if (!groomPhoto || !bridePhoto || !selectedConcept) return;
    setGenerating(true);
    try {
      const res = await api('/generate', {
        method: 'POST',
        body: JSON.stringify({
          weddingId,
          concept: selectedConcept,
          imageUrls: [groomPhoto, bridePhoto],
          engine,
        }),
      });
      const data = await res.json();
      if (data.id) {
        setPollingId(data.id);
        setSnaps(prev => [{ ...data, concept: selectedConcept, engine, createdAt: new Date().toISOString() }, ...prev]);
      }
    } catch (err) {
      console.error('Generate error:', err);
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api(`/${id}`, { method: 'DELETE' });
    setSnaps(prev => prev.filter(s => s.id !== id));
  };

  const canGenerate = groomPhoto && bridePhoto && selectedConcept && !generating;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-stone-900">AI 웨딩스냅</h3>
        </div>
        <p className="text-sm text-stone-500">커플 사진 2장으로 AI가 웨딩 촬영 컨셉 사진을 만들어드려요</p>
      </div>

      <div>
        <p className="text-sm font-medium text-stone-700 mb-3">1. 커플 사진 업로드</p>
        <div className="grid grid-cols-2 gap-4">
          <PhotoUpload
            label="신랑"
            photo={groomPhoto}
            uploading={uploading === 'groom'}
            onUpload={(f) => uploadPhoto(f, 'groom')}
            onClear={() => setGroomPhoto('')}
          />
          <PhotoUpload
            label="신부"
            photo={bridePhoto}
            uploading={uploading === 'bride'}
            onUpload={(f) => uploadPhoto(f, 'bride')}
            onClear={() => setBridePhoto('')}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-stone-700 mb-3">2. 웨딩 컨셉 선택</p>
        <div className="grid grid-cols-4 gap-2">
          {concepts.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedConcept(c.id)}
              className={`relative overflow-hidden rounded-xl p-3 text-center transition-all ${
                selectedConcept === c.id
                  ? 'ring-2 ring-stone-800 scale-[1.02]'
                  : 'ring-1 ring-stone-200 hover:ring-stone-300'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${CONCEPT_COLORS[c.id] || 'from-stone-600 to-stone-400'} ${selectedConcept === c.id ? 'opacity-100' : 'opacity-60'}`} />
              <span className="relative text-xs font-medium text-white drop-shadow-sm">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-stone-700 mb-3">3. AI 엔진 선택</p>
        <div className="flex gap-2">
          {ENGINE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setEngine(opt.id)}
              className={`flex-1 p-3 rounded-xl text-left transition-all ${
                engine === opt.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className={`text-xs mt-0.5 ${engine === opt.id ? 'text-stone-300' : 'text-stone-400'}`}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full py-4 rounded-2xl text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-40"
        style={{ background: canGenerate ? 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)' : '#d4d4d4' }}
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>AI가 열심히 그리는 중...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>웨딩스냅 생성하기</span>
          </>
        )}
      </button>

      {generating && (
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-amber-50 text-amber-700 rounded-xl text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            보통 30초~1분 정도 소요돼요. 잠시만 기다려주세요.
          </div>
        </div>
      )}

      {snaps.length > 0 && (
        <div>
          <p className="text-sm font-medium text-stone-700 mb-3">생성된 웨딩스냅</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {snaps.map((snap) => (
              <div key={snap.id} className="relative group">
                {snap.status === 'done' && snap.resultUrl ? (
                  <div
                    onClick={() => setViewSnap(snap)}
                    className="aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-stone-200 hover:border-stone-400 transition-all"
                  >
                    <img src={snap.resultUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : snap.status === 'processing' ? (
                  <div className="aspect-[3/4] rounded-xl border border-stone-200 flex flex-col items-center justify-center bg-stone-50">
                    <Loader2 className="w-6 h-6 text-stone-400 animate-spin mb-2" />
                    <p className="text-xs text-stone-400">생성 중...</p>
                  </div>
                ) : (
                  <div className="aspect-[3/4] rounded-xl border border-red-200 flex flex-col items-center justify-center bg-red-50">
                    <X className="w-6 h-6 text-red-400 mb-2" />
                    <p className="text-xs text-red-400">실패</p>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${
                    snap.engine === 'dreamina' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {snap.engine === 'dreamina' ? 'Dreamina' : 'NanoBanana'}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(snap.id); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {viewSnap?.resultUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setViewSnap(null)}
          >
            <button onClick={() => setViewSnap(null)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <img src={viewSnap.resultUrl} alt="" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            <a
              href={viewSnap.resultUrl}
              download
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-6 right-6 flex items-center gap-2 px-5 py-2.5 bg-white text-stone-900 rounded-xl text-sm font-medium hover:bg-stone-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              다운로드
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PhotoUpload({ label, photo, uploading, onUpload, onClear }: {
  label: string;
  photo: string;
  uploading: boolean;
  onUpload: (f: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative">
      {photo ? (
        <div className="aspect-square rounded-xl overflow-hidden border border-stone-200 relative">
          <img src={photo} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="absolute bottom-0 inset-x-0 py-1.5 bg-black/40 text-center">
            <span className="text-xs text-white font-medium">{label}</span>
          </div>
        </div>
      ) : (
        <label className={`aspect-square rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer hover:border-stone-400 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? (
            <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
          ) : (
            <>
              <Camera className="w-8 h-8 text-stone-400 mb-2" />
              <span className="text-xs text-stone-500">{label} 사진</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}
