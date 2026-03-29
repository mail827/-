import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Camera, X, Loader2, User, Users, ArrowRight } from 'lucide-react';
import { at } from '../utils/appI18n';
import { useLocaleStore } from '../store/useLocaleStore';

const CONCEPTS = [
  { id: 'studio_classic', label: '스튜디오 클래식', sub: '정석 웨딩 화보' },
  { id: 'studio_gallery', label: '갤러리', sub: '화이트 아치 스튜디오' },
  { id: 'studio_fog', label: '포그', sub: '린넨 드레이프 스튜디오' },
  { id: 'studio_mocha', label: '모카', sub: '다크 스포트라이트' },
  { id: 'studio_sage', label: '세이지', sub: '세이지그린 에디토리얼' },
  { id: 'outdoor_garden', label: '야외 가든', sub: '꽃과 자연빛' },
  { id: 'beach_sunset', label: '해변 선셋', sub: '노을빛 해변' },
  { id: 'hanbok_wonsam', label: '궁중 혼례', sub: '화려한 궁중 예복' },
  { id: 'rose_garden', label: '장미 정원', sub: '로코코 장미 살롱' },
  { id: 'grass_rain', label: '풀밭', sub: '비 내리는 필름 감성' },
  { id: 'eternal_blue', label: '블루', sub: '겨울 바다 멜랑콜리' },
  { id: 'heart_editorial', label: '하이 에디토리얼', sub: '건축적 하이패션' },
  { id: 'hanbok_dangui', label: '당의 한복', sub: '단아한 정원 화보' },
  { id: 'hanbok_modern', label: '모던 한복', sub: '현대적 한옥 감성' },
  { id: 'hanbok_saeguk', label: '사극풍', sub: '왕과 왕비 컨셉' },
  { id: 'hanbok_flower', label: '꽃한복', sub: '봄꽃 한옥마당' },
  { id: 'city_night', label: '시티 나이트', sub: '도시 야경' },
  { id: 'cherry_blossom', label: '벚꽃', sub: '벚꽃잎 흩날림' },
  { id: 'forest_wedding', label: '숲속 웨딩', sub: '숲속 빛내림' },
  { id: 'castle_garden', label: '유럽 궁전', sub: '궁전 웨딩' },
  { id: 'cathedral', label: '성당 웨딩', sub: '스테인드글라스' },
  { id: 'watercolor', label: '수채화', sub: '파스텔 수채화' },
  { id: 'magazine_cover', label: '매거진 커버', sub: '하이패션 화보' },
  { id: 'rainy_day', label: '비오는 날', sub: '감성 빗속' },
  { id: 'autumn_leaves', label: '가을 단풍', sub: '단풍길 로맨스' },
  { id: 'winter_snow', label: '겨울 눈', sub: '눈 내리는 날' },
  { id: 'vintage_film', label: '빈티지 필름', sub: '필름 감성' },
  { id: 'iphone_selfie', label: '셀카 스냅', sub: 'iPhone 감성' },
  { id: 'iphone_mirror', label: '거울 셀카', sub: '미러 셀카' },
  { id: 'cruise_sunset', label: '크루즈 선셋', sub: '노을빛 크루즈' },
  { id: 'cruise_bluesky', label: '크루즈 블루', sub: '푸른 바다 크루즈' },
  { id: 'vintage_record', label: '빈티지 레코드', sub: '레코드샵 빈티지' },
  { id: 'retro_hongkong', label: '레트로 홍콩', sub: '홍콩 야시장 무드' },
  { id: 'black_swan', label: '블랙스완', sub: '다크 시네마틱' },
  { id: 'blue_hour', label: '블루아워', sub: '트와일라잇 로맨스' },
  { id: 'water_memory', label: '물의 기억', sub: '수중 시네마틱' },
  { id: 'velvet_rouge', label: '벨벳 루즈', sub: '다크 로맨스' },
];

type Mode = 'groom' | 'bride' | 'couple';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const API = import.meta.env.VITE_API_URL;

export default function AiSnapFree() {
  const { locale: fl } = useLocaleStore();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode>('groom');
  const [groomPhoto, setGroomPhoto] = useState('');
  const [bridePhoto, setBridePhoto] = useState('');
  const [couplePhoto, setCouplePhoto] = useState('');
  const [concept, setConcept] = useState('studio_classic');
  const [uploading, setUploading] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval>>();
  const [resultUrl, setResultUrl] = useState('');
  const [, setAlreadyUsed] = useState(false);
  const [, setSnapId] = useState('');
  const [, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [samples, setSamples] = useState<{ id: string; concept: string; mode: string; imageUrl: string }[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setStep(1);
      return;
    }
    setIsLoggedIn(true);
    fetch(`${API}/ai-snap/free/check`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.used && !d.isAdmin) {
          setAlreadyUsed(true);
          setStep(5);
        } else {
          const saved = localStorage.getItem('pendingSnapState');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.mode) setMode(parsed.mode);
              if (parsed.concept) setConcept(parsed.concept);
              if (parsed.groomPhoto) setGroomPhoto(parsed.groomPhoto);
              if (parsed.bridePhoto) setBridePhoto(parsed.bridePhoto);
              if (parsed.couplePhoto) setCouplePhoto(parsed.couplePhoto);
              localStorage.removeItem('pendingSnapState');
              setStep(parsed.step || 3);
            } catch (e) { setStep(1); }
          } else {
            setStep(1);
          }
        }
      })
      .catch(() => setStep(1))
      .finally(() => setChecking(false));
  }, [token]);

  useEffect(() => {
    fetch(`${API}/admin/snap-samples`).then(r => r.json()).then(setSamples).catch(() => {});
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

  const canProceed = () => {
    if (mode === 'couple') return !!couplePhoto;
    if (mode === 'groom') return !!groomPhoto;
    return !!bridePhoto;
  };

  const getUrls = () => {
    if (mode === 'couple') return [couplePhoto];
    if (mode === 'groom') return [groomPhoto];
    return [bridePhoto];
  };

  const generate = async () => {
    if (!canProceed()) return;
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      localStorage.setItem('pendingSnapState', JSON.stringify({ mode, concept, groomPhoto, bridePhoto, couplePhoto, step: 3 }));
      localStorage.setItem('returnTo', '/ai-snap');
      window.location.href = '/?login=true';
      return;
    }
    setGenerating(true);
    setStep(4);
    setProgress(0);
    progressRef.current = setInterval(() => setProgress(p => p >= 92 ? 92 : p + Math.random() * 8), 800);
    try {
      const res = await fetch(`${API}/ai-snap/free/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
        body: JSON.stringify({ concept, imageUrls: getUrls(), mode }),
      });
      const data = await res.json();
      if (data.used) {
        setAlreadyUsed(true);
        setStep(5);
        setGenerating(false);
        return;
      }
      if (data.status === 'done' && data.resultUrl) {
        clearInterval(progressRef.current);
        setProgress(100);
        setResultUrl(data.resultUrl);
        setGenerating(false);
      } else if (data.statusUrl) {
        if (data.snapId) setSnapId(data.snapId);
        pollRef.current = setInterval(async () => {
          try {
            const sid = data.snapId || '';
            const pRes = await fetch(`${API}/ai-snap/free/poll?statusUrl=${encodeURIComponent(data.statusUrl)}&responseUrl=${encodeURIComponent(data.responseUrl)}&snapId=${sid}`);
            const pData = await pRes.json();
            if (pData.status === 'done') {
              clearInterval(pollRef.current);
              clearInterval(progressRef.current);
              setProgress(100);
              setResultUrl(pData.resultUrl);
              setGenerating(false);
            } else if (pData.status === 'failed') {
              clearInterval(pollRef.current);
              clearInterval(progressRef.current);
              setProgress(0);
              setGenerating(false);
              setStep(3);
            }
          } catch {}
        }, 3000);
      } else {
        setGenerating(false);
        setStep(3);
      }
    } catch {
      setGenerating(false);
      setStep(3);
    }
  };

  const handleLogin = (provider: 'google' | 'kakao') => {
    localStorage.setItem('redirectAfterLogin', '/ai-snap');
    window.location.href = `${API}/oauth/${provider}`;
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-stone-200 sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><a href="/dashboard" className="text-[13px] text-stone-400 hover:text-stone-700 transition-colors">&larr; {at('dashboard', fl)}</a><a href="/" className="text-[15px] font-semibold text-stone-800">청첩장 작업실</a></div>
          {step >= 1 && step <= 4 && (
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`h-1 rounded-full transition-all ${s <= step ? 'w-6 bg-stone-800' : 'w-3 bg-stone-200'}`} />
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center py-12 space-y-8">
              <div>
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-stone-800 to-stone-600 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-7 h-7 text-amber-300" />
                </div>
                <h1 className="text-xl font-semibold text-stone-800 mb-2">{at('snapFreeTitle', fl)}</h1>
                <p className="text-sm text-stone-500 mb-1">{at('snapFreeDesc', fl)}</p>
                <p className="text-xs text-stone-400">{at('snapFreeTrial1', fl)}</p>
              </div>
              <div className="space-y-3 w-full max-w-xs mx-auto">
                <button onClick={() => handleLogin('kakao')}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-lg transition-all hover:opacity-90"
                  style={{ background: '#FEE500' }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.722 1.755 5.108 4.396 6.462-.148.536-.954 3.442-.984 3.66 0 0-.02.163.086.226.105.063.23.03.23.03.303-.042 3.514-2.313 4.07-2.707.717.1 1.457.153 2.202.153 5.523 0 10-3.463 10-7.824C22 6.463 17.523 3 12 3" fill="#3C1E1E"/></svg>
                  <span className="text-sm font-medium" style={{ color: '#3C1E1E' }}>{at('snapKakaoLogin', fl)}</span>
                </button>
                <button onClick={() => handleLogin('google')}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-stone-200 rounded-lg hover:border-stone-400 transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <span className="text-sm font-medium text-stone-700">{at('snapGoogleLogin', fl)}</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-400">{at('snapLoginNote', fl)}</p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full text-xs text-stone-500 mb-6">
                  <Sparkles className="w-3 h-3" /> 무료 체험 1장
                </div>
                <h1 className="text-xl font-semibold text-stone-800 mb-2">{at('snapFreeTitle', fl)}</h1>
                <p className="text-sm text-stone-500">{at('snapSelectMode', fl)}</p>
              </div>
              <div className="space-y-3">
                {([
                  { m: 'groom' as Mode, icon: User, label: at('snapModeGroom', fl), desc: at('snapGroomSoloDesc', fl) },
                  { m: 'bride' as Mode, icon: User, label: at('snapModeBride', fl), desc: at('snapBrideSoloDesc', fl) },
                  { m: 'couple' as Mode, icon: Users, label: at('snapModeCouple', fl), desc: at('snapCoupleSoloDesc', fl) },
                ]).map(item => (
                  <button key={item.m} onClick={() => { setMode(item.m); setStep(2); }}
                    className="w-full flex items-center gap-4 p-5 rounded-lg border-2 border-stone-200 hover:border-stone-800 transition-all text-left group">
                    <div className="w-12 h-12 rounded-lg bg-stone-100 group-hover:bg-stone-800 flex items-center justify-center transition-colors">
                      <item.icon className="w-5 h-5 text-stone-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-stone-800">{item.label}</p>
                      <p className="text-xs text-stone-400">{item.desc}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-stone-800 transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-stone-800 mb-2">{at('snapUploadTitle', fl)}</h2>
                <p className="text-sm text-stone-500">{mode === 'couple' ? at('snapUploadCoupleDesc', fl) : at('snapUploadSoloDesc', fl)}</p>
              </div>
              <div className="grid gap-4 grid-cols-1 max-w-[200px] mx-auto">
                {mode === 'couple' && (
                  <UploadCard label={at('snapModeCouple', fl)} photo={couplePhoto} uploading={uploading === 'couple'}
                    onUpload={f => uploadPhoto(f, 'couple')} onClear={() => setCouplePhoto('')} />
                )}
                {mode === 'groom' && (
                  <UploadCard label={at('groom', fl)} photo={groomPhoto} uploading={uploading === 'groom'}
                    onUpload={f => uploadPhoto(f, 'groom')} onClear={() => setGroomPhoto('')} />
                )}
                {mode === 'bride' && (
                  <UploadCard label={at('bride', fl)} photo={bridePhoto} uploading={uploading === 'bride'}
                    onUpload={f => uploadPhoto(f, 'bride')} onClear={() => setBridePhoto('')} />
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-3 rounded-lg border border-stone-200 text-sm text-stone-500 hover:bg-stone-50">{at('prev', fl)}</button>
                <button onClick={() => canProceed() && setStep(3)} disabled={!canProceed()}
                  className="flex-1 py-3 rounded-lg bg-stone-800 text-white text-sm font-medium disabled:opacity-30 hover:bg-stone-900 transition-all">{at('next', fl)}</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-stone-800 mb-2">{at('snapConceptTitle', fl)}</h2>
                <p className="text-sm text-stone-500">{at('snapConceptSub', fl)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CONCEPTS.map(c => (
                  <button key={c.id} onClick={() => setConcept(c.id)}
                    className={`rounded-lg py-3.5 px-4 text-left transition-all border-2 ${concept === c.id ? 'border-stone-800 bg-stone-800' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                    <p className={`text-sm font-semibold ${concept === c.id ? 'text-white' : 'text-stone-800'}`}>{c.label}</p>
                    <p className={`text-[11px] ${concept === c.id ? 'text-white/60' : 'text-stone-400'}`}>{c.sub}</p>
                  </button>
                ))}
              </div>
              {samples.filter(s => s.concept === concept).length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-stone-400 text-center">{at('snapSampleHint', fl)}</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                    {samples.filter(s => s.concept === concept).map(s => (
                      <div key={s.id} className="flex-shrink-0 w-28 aspect-[3/4] rounded-lg overflow-hidden border border-stone-100">
                        <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="px-6 py-3 rounded-lg border border-stone-200 text-sm text-stone-500 hover:bg-stone-50">{at('prev', fl)}</button>
                <button onClick={generate}
                  className="flex-1 py-3 rounded-lg bg-stone-800 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-stone-900 transition-all">
                  <Sparkles className="w-4 h-4" /> 웨딩 화보 생성하기
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              {generating ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-7 h-7 text-stone-600 animate-spin" />
                  </div>
                  <h2 className="text-lg font-semibold text-stone-800 mb-2">{at('snapAiCreating', fl)}</h2>
                  <p className="text-sm text-stone-400 mb-6">{at('snapAiTime', fl)}</p>
                  <div className="max-w-xs mx-auto">
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-stone-800 rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-stone-400 mt-2">{Math.round(progress)}%</p>
                  </div>
                </div>
              ) : resultUrl ? (
                <div className="text-center">
                  <div className="rounded-lg overflow-hidden border border-stone-200 mb-6">
                    <img src={resultUrl} alt="AI Wedding Snap" className="w-full" />
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 mb-6">
                    <Sparkles className="w-3.5 h-3.5" />
                    무료 체험 이미지에는 워터마크가 포함돼요
                  </div>
                  <UpgradeCard />
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-stone-500 text-sm">{at('snapFailedRetry', fl)}</p>
                  <button onClick={() => setStep(3)} className="mt-4 px-6 py-2 bg-stone-800 text-white rounded-lg text-sm">{at('aiRetry', fl)}</button>
                </div>
              )}
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12 space-y-6">
              <div className="w-16 h-16 rounded-lg bg-stone-100 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7 text-stone-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-800 mb-2">{at('snapFreeUsed', fl)}</h2>
                <p className="text-sm text-stone-400">{at('snapFreeUsedDesc', fl)}</p>
              </div>
              <UpgradeCard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function UpgradeCard() {
  const { locale: fl } = useLocaleStore();
  return (
    <div className="bg-stone-50 rounded-lg border border-stone-200 p-6 text-center">
      <p className="text-sm font-semibold text-stone-800 mb-2">{at('snapUpgradeTitle', fl)}</p>
      <p className="text-xs text-stone-400 mb-5">{at('snapUpgradeDesc', fl)}</p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <a href="/#pricing" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-lg text-xs font-medium hover:bg-stone-900">
          요금제 보기 <ArrowRight className="w-3.5 h-3.5" />
        </a>
        <a href="/" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-stone-200 text-stone-600 rounded-lg text-xs hover:bg-stone-50">
          홈으로
        </a>
      </div>
    </div>
  );
}

function UploadCard({ label, photo, uploading, onUpload, onClear }: {
  label: string; photo: string; uploading: boolean; onUpload: (f: File) => void; onClear: () => void;
}) {
  return photo ? (
    <div className="relative aspect-square rounded-lg overflow-hidden border border-stone-200">
      <img src={photo} alt={label} className="w-full h-full object-cover" />
      <button onClick={onClear} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"><X className="w-4 h-4" /></button>
      <div className="absolute bottom-0 inset-x-0 py-2 bg-gradient-to-t from-black/50 text-center"><span className="text-xs text-white font-medium">{label}</span></div>
    </div>
  ) : (
    <label className={`aspect-square rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer hover:border-stone-400 transition-all ${uploading ? 'opacity-50' : ''}`}>
      {uploading ? <Loader2 className="w-8 h-8 text-stone-400 animate-spin" /> : (
        <>
          <Camera className="w-8 h-8 text-stone-400 mb-2" />
          <span className="text-sm font-medium text-stone-500">{label}</span>
          <span className="text-[11px] text-stone-400 mt-1">Face visible</span>
        </>
      )}
      <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} className="hidden" disabled={uploading} />
    </label>
  );
}
