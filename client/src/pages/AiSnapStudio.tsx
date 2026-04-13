import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Camera, X, Download, Loader2, User, Users, ArrowRight, ArrowLeft, Package, CreditCard, Gift, RefreshCw } from 'lucide-react';
import { at } from '../utils/appI18n';
import { useLocaleStore } from '../store/useLocaleStore';

const API = import.meta.env.VITE_API_URL;
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const ADD_TIERS = [
  { id: 'add-1', snaps: 1, price: 2900, label: '1장' },
  { id: 'add-3', snaps: 3, price: 6900, label: '3장' },
  { id: 'add-5', snaps: 5, price: 9900, label: '5장' },
  { id: 'add-10', snaps: 10, price: 16900, label: '10장' },
];

function loadTossV1(): Promise<any> {
  return new Promise((resolve) => {
    if ((window as any).TossPayments) { resolve((window as any).TossPayments); return; }
    const s = document.createElement('script');
    s.src = 'https://js.tosspayments.com/v1/payment';
    s.onload = () => resolve((window as any).TossPayments);
    document.body.appendChild(s);
  });
}

type ShotMode = 'groom' | 'bride' | 'couple';


interface Tier { id: string; snaps: number; price: number; label: string }
interface Concept { id: string; label: string; category: string }

const CONCEPT_LABELS: Record<string, string> = {
  studio_classic: '스튜디오 클래식', studio_gallery: '갤러리', studio_fog: '포그', studio_mocha: '모카', studio_sage: '세이지',
  hanbok_wonsam: '궁중 혼례', hanbok_dangui: '당의 한복', hanbok_modern: '모던 한복', hanbok_saeguk: '사극풍', hanbok_flower: '꽃한복',
  spring_letter: '봄의 편지', summer_rain: '소나기', autumn_film: '가을 필름', winter_zhivago: '겨울 지바고',
  lovesick: '러브시크', silver_thread: '실버스레드', summer_tape: '서머테이프', rouge_clue: '루즈클루', in_the_mood: '화양연화', summer_film: '썸머필름', lily_choucho: '릴리슈슈',
  cherry_blossom: '벚꽃', forest_wedding: '숲속 웨딩', castle_garden: '유럽 궁전', cathedral: '성당', watercolor: '수채화', rose_garden: '장미정원',
  rainy_day: '비오는 날', grass_rain: '풀밭', eternal_blue: '블루', water_memory: '물의 기억', blue_hour: '블루아워',
  black_swan: '블랙스완', velvet_rouge: '벨벳루즈', heart_editorial: '에디토리얼', magazine_cover: '매거진커버', city_night: '시티나이트',
  vintage_film: '빈티지 필름', vintage_record: '빈티지 레코드', vintage_tungsten: '빈티지 텅스텐', retro_hongkong: '레트로 홍콩',
  cruise_sunset: '크루즈 선셋', cruise_bluesky: '크루즈 블루스카이',
  iphone_selfie: '셀카 스냅', iphone_mirror: '거울 셀카',
  aao: '에에올',
};

const CATEGORY_ORDER = [
  { key: 'STUDIO', label: '\uc2a4\ud29c\ub514\uc624', ids: ['studio_classic', 'studio_gallery', 'studio_fog', 'studio_mocha', 'studio_sage'] },
  { key: 'HANBOK', label: '\ud55c\ubcf5', ids: ['hanbok_wonsam', 'hanbok_dangui', 'hanbok_modern', 'hanbok_saeguk', 'hanbok_flower'] },
  { key: 'FOUR_SEASONS', label: '\uc0ac\uacc4 \uc2dc\ub9ac\uc988', ids: ['spring_letter', 'summer_rain', 'autumn_film', 'winter_zhivago'] },
  { key: 'FILM', label: '\ud544\ub984 \ub0b4\ub7ec\ud2f0\ube0c', ids: ['lovesick', 'silver_thread', 'summer_tape', 'rouge_clue', 'in_the_mood', 'summer_film', 'lily_choucho'] },
  { key: 'CLASSIC', label: '\ud074\ub798\uc2dd \ub85c\ub9e8\uc2a4', ids: ['cherry_blossom', 'forest_wedding', 'castle_garden', 'cathedral', 'watercolor', 'rose_garden'] },
  { key: 'MOOD', label: '\ubb34\ub4dc \uc2dc\ub124\ub9c8', ids: ['rainy_day', 'grass_rain', 'eternal_blue', 'water_memory', 'blue_hour'] },
  { key: 'DARK', label: '\ub2e4\ud06c/\uc5d0\ub514\ud1a0\ub9ac\uc5bc', ids: ['black_swan', 'velvet_rouge', 'heart_editorial', 'magazine_cover', 'city_night'] },
  { key: 'VINTAGE', label: '\ube48\ud2f0\uc9c0', ids: ['vintage_film', 'vintage_record', 'vintage_tungsten', 'retro_hongkong'] },
  { key: 'CRUISE', label: '\ud06c\ub8e8\uc988', ids: ['cruise_sunset', 'cruise_bluesky'] },
  { key: 'SELFIE', label: '\uc140\uce74', ids: ['iphone_selfie', 'iphone_mirror'] },
  { key: 'SPECIAL', label: '\uc2a4\ud398\uc15c', ids: ['aao'] },
];
interface Snap { id: string; status: string; resultUrl?: string; concept: string; mode?: string; createdAt: string; retryStatus?: string; retryResultUrl?: string }
interface Pack { id: string; tier: string; totalSnaps: number; usedSnaps: number; concept: string; category: string; mode: string; status: string; inputUrls: string[]; snaps: Snap[] }

export default function AiSnapStudioPage() {
  const { locale: pl } = useLocaleStore();
  const [params] = useSearchParams();
  const token = localStorage.getItem('token');
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(true);

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);

  const [selectedTier, setSelectedTier] = useState('');
  const [category, setCategory] = useState<string>('studio');
  const [selectedConcept, setSelectedConcept] = useState('');
  const [groomPhoto, setGroomPhoto] = useState('');
  const [bridePhoto, setBridePhoto] = useState('');
  const [couplePhoto, setCouplePhoto] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<{valid:boolean;discountType:string;discountValue:number;name:string}|null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [activePack, setActivePack] = useState<Pack | null>(null);
  const [myPacks, setMyPacks] = useState<Pack[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, setPollingId] = useState<string | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval>>();
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const [viewSnap, setViewSnap] = useState<Snap | null>(null);
  const retryPollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const retrying = activePack?.snaps?.filter((s: Snap) => s.retryStatus === 'generating') || [];
    if (retrying.length === 0) { clearInterval(retryPollRef.current); return; }
    retryPollRef.current = setInterval(async () => {
      for (const s of retrying) {
        try {
          const res = await fetch(API + '/ai-snap/status/' + s.id, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
          const updated = await res.json();
          if (updated.retryStatus === 'done' || updated.retryStatus === 'failed') {
            if (activePack) {
              const up = { ...activePack, snaps: activePack.snaps.map((p: Snap) => p.id === s.id ? { ...p, retryStatus: updated.retryStatus, retryResultUrl: updated.retryResultUrl } : p) };
              setActivePack(up);
            }
            if (viewSnap?.id === s.id) setViewSnap((v: Snap | null) => v ? { ...v, retryStatus: updated.retryStatus, retryResultUrl: updated.retryResultUrl } : v);
          }
        } catch {}
      }
    }, 5000);
    return () => clearInterval(retryPollRef.current);
  }, [activePack?.snaps?.filter((s: Snap) => s.retryStatus === 'generating').length]);
  const [retrying, setRetrying] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareView, setCompareView] = useState<'original' | 'new'>('original');

  const [setupPackId, setSetupPackId] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [shotMode, setShotMode] = useState<ShotMode | null>(null);
  const [showAddSnaps, setShowAddSnaps] = useState(false);
  const [addTier, setAddTier] = useState('add-3');
  const [addPaying, setAddPaying] = useState(false);

  useEffect(() => {
    if (!token) { setChecking(false); return; }
    Promise.all([
      fetch(`${API}/snap-pack/tiers`).then(r => r.json()),
      fetch(`${API}/snap-pack/concepts`).then(r => r.json()),
      fetch(`${API}/snap-pack/my-packs`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([t, c, p]) => {
      setTiers(t);
      const allC = [...(c.studio || []), ...(c.cinematic || [])];
      setConcepts(allC);
      if (!Array.isArray(p) || p.length === 0) {
        setStep(1);
        return;
      }
      setMyPacks(p);

      const targetPackId = params.get('packId');
      const emptyPack = targetPackId
        ? p.find((pk: Pack) => pk.id === targetPackId && (!pk.concept || pk.concept === ''))
        : p.find((pk: Pack) => !pk.concept || pk.concept === '');

      if (emptyPack) {
        setSetupPackId(emptyPack.id);
        setSelectedTier(emptyPack.tier);
        setStep(1);
      } else {
        const targetPack = targetPackId ? p.find((pk: Pack) => pk.id === targetPackId) : null;
        if (targetPack) setActivePack(targetPack);
        setStep(10);
      }
    }).catch(() => setStep(1)).finally(() => setChecking(false));
  }, [token]);

  useEffect(() => {
    return () => { clearInterval(progressRef.current); clearInterval(pollRef.current); };
  }, []);

  const uploadPhoto = async (file: File, type: 'groom' | 'bride' | 'couple') => {
    setUploading(type);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (type === 'groom') setGroomPhoto(data.secure_url);      else if (type === 'couple') setCouplePhoto(data.secure_url);
      else setBridePhoto(data.secure_url);
    } catch {}
    setUploading(null);
  };

  const handleLogin = (provider: 'google' | 'kakao') => {
    localStorage.setItem('redirectAfterLogin', '/ai-snap/studio');
    window.location.href = `${API}/oauth/${provider}`;
  };

  const handleSetup = async () => {
    if (!setupPackId || !selectedConcept || !groomPhoto || !bridePhoto) return;
    setSetupLoading(true);
    try {
      const res = await fetch(`${API}/snap-pack/pack/${setupPackId}/setup`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ concept: selectedConcept, category, mode: 'mix', imageUrls: [groomPhoto, bridePhoto, ...(couplePhoto ? [couplePhoto] : [])] }),
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
        return;
      }
      const data = await res.json();
      if (data.error) {
        setSetupLoading(false);
        return;
      }
      setActivePack(data);
      setMyPacks(prev => prev.map(p => p.id === data.id ? data : p));
      setSetupPackId(null);
      setStep(10);
    } catch {}
    setSetupLoading(false);
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponChecking(true);
    setCouponError('');
    setCouponResult(null);
    try {
      const res = await fetch(`${API}/coupon/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponResult({ valid: true, discountType: data.coupon.discountType, discountValue: data.coupon.discountValue, name: data.coupon.name });
      } else {
        setCouponError(data.error || '유효하지 않은 코드입니다');
      }
    } catch {
      setCouponError('확인 중 오류가 발생했습니다');
    }
    setCouponChecking(false);
  };

  const handlePayment = async () => {
    if (!selectedTier || !selectedConcept || !groomPhoto || !bridePhoto) return;
    try {
      const orderRes = await fetch(`${API}/snap-pack/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier: selectedTier, concept: selectedConcept, category, mode: 'mix', imageUrls: [groomPhoto, bridePhoto, ...(couplePhoto ? [couplePhoto] : [])], couponCode: couponResult?.valid ? couponCode.trim().toUpperCase() : undefined }),
      });
      const order = await orderRes.json();
      if (!order.orderId) return;

      const keyRes = await fetch(`${API}/snap-pack/toss-client-key`);
      const { clientKey } = await keyRes.json();
      const TossPayments = await loadTossV1();
      const tp = TossPayments(clientKey);
      await tp.requestPayment('카드', {
        amount: order.amount,
        orderId: order.orderId,
        orderName: `AI 웨딩스냅 ${tiers.find(t => t.id === selectedTier)?.label}`,
        successUrl: `${window.location.origin}/ai-snap/studio/callback?packId=${order.packId}`,
        failUrl: `${window.location.origin}/ai-snap/studio?error=payment_failed`,
      });
    } catch {}
  };

  const handleAddSnaps = async () => {
    if (!activePack || addPaying) return;
    setAddPaying(true);
    try {
      const orderRes = await fetch(`${API}/snap-pack/add-snaps/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packId: activePack.id, addTier }),
      });
      const order = await orderRes.json();
      if (!order.orderId) { setAddPaying(false); return; }
      const TossPayments = await loadTossV1();
      const tp = TossPayments(order.clientKey);
      await tp.requestPayment('카드', {
        amount: order.amount,
        orderId: order.orderId,
        orderName: `AI 웨딩스냅 추가 생성`,
        successUrl: `${window.location.origin}/ai-snap/studio/add-callback?packId=${activePack.id}&addTier=${addTier}`,
        failUrl: `${window.location.origin}/ai-snap/studio?packId=${activePack.id}&error=add_failed`,
      });
    } catch {}
    setAddPaying(false);
  };

  const loadPack = async (packId: string) => {
    const res = await fetch(`${API}/snap-pack/pack/${packId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setActivePack(data);
    return data;
  };

  const generateSnap = async (chosenMode: ShotMode) => {
    if (!activePack || generating) return;
    setShotMode(chosenMode);
    setGenerating(true);
    setProgress(0);
    progressRef.current = setInterval(() => setProgress(p => p >= 92 ? 92 : p + Math.random() * 8), 800);

    try {
      const res = await fetch(`${API}/snap-pack/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packId: activePack.id, mode: chosenMode }),
      });
      const data = await res.json();
      if (data.error) {
        clearInterval(progressRef.current);
        setGenerating(false);
        setShotMode(null);
        await loadPack(activePack.id);
        return;
      }
      setPollingId(data.snapId);
      pollRef.current = setInterval(async () => {
        const snapRes = await fetch(`${API}/snap-pack/snap/${data.snapId}`, { headers: { Authorization: `Bearer ${token}` } });
        const snap = await snapRes.json();
        if (snap.status === 'done' || snap.status === 'failed') {
          clearInterval(pollRef.current);
          clearInterval(progressRef.current);
          setProgress(snap.status === 'done' ? 100 : 0);          if (snap.status === 'failed') { await fetch(`${API}/snap-pack/snap/${data.snapId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); }
          setPollingId(null);
          setGenerating(false);
          setShotMode(null);
          await loadPack(activePack.id);
        }
      }, 3000);
    } catch {
      clearInterval(progressRef.current);
      setGenerating(false);
      setShotMode(null);
    }
  };

  if (checking) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-6 h-6 text-stone-400 animate-spin" /></div>;
  }

  const isSetupMode = !!setupPackId;
  const setupTier = isSetupMode ? tiers.find(t => t.id === selectedTier) : null;

  const stepMap = isSetupMode
    ? [1, 2, 3, 4]
    : [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-stone-200 sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><a href="/dashboard" className="text-[13px] text-stone-400 hover:text-stone-700 transition-colors">&larr; {at('dashboard', pl)}</a><a href="/" className="text-[15px] font-semibold text-stone-800">청첩장 작업실</a></div>
          {step >= 1 && step <= 7 && (
            <div className="flex items-center gap-1.5">
              {stepMap.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i < (isSetupMode ? [1,2,3,7].indexOf(step) + 1 : [1,2,3,4,5].indexOf(step) + 1) ? 'w-5 bg-stone-800' : 'w-2 bg-stone-200'}`} />
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center py-16 space-y-8">
              <div>
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-stone-800 to-stone-600 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-7 h-7 text-amber-300" />
                </div>
                <h1 className="text-xl font-semibold text-stone-800 mb-2">{at('studioTitle', pl)}</h1>
                <p className="text-sm text-stone-500">{at('studioDesc', pl)}</p>
              </div>
              <div className="space-y-3 max-w-xs mx-auto">
                <button onClick={() => handleLogin('kakao')} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-lg hover:opacity-90 transition-all" style={{ background: '#FEE500' }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.722 1.755 5.108 4.396 6.462-.148.536-.954 3.442-.984 3.66 0 0-.02.163.086.226.105.063.23.03.23.03.303-.042 3.514-2.313 4.07-2.707.717.1 1.457.153 2.202.153 5.523 0 10-3.463 10-7.824C22 6.463 17.523 3 12 3" fill="#3C1E1E"/></svg>
                  <span className="text-sm font-medium" style={{ color: '#3C1E1E' }}>{at('snapKakaoLogin', pl)}</span>
                </button>
                <button onClick={() => handleLogin('google')} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-stone-200 rounded-lg hover:border-stone-400 transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <span className="text-sm font-medium text-stone-700">{at('snapGoogleLogin', pl)}</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-400">{at('studioSignupNote', pl)}</p>
            </motion.div>
          )}

          {step === 1 && (
            <Step title={at('studioUploadTitle', pl)} sub={at('studioUploadSub', pl)}>
              {isSetupMode && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 mb-4">
                  <Gift className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-800">{at('studioSetupGift', pl)} <span className="font-semibold">{setupTier?.label}</span> {at('studioSetupMsg', pl)}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <UploadCard label={at('groom', pl)} photo={groomPhoto} uploading={uploading === 'groom'} onUpload={f => uploadPhoto(f, 'groom')} onClear={() => setGroomPhoto('')} />
                <UploadCard label={at('bride', pl)} photo={bridePhoto} uploading={uploading === 'bride'} onUpload={f => uploadPhoto(f, 'bride')} onClear={() => setBridePhoto('')} />
              </div>
              <div className="mt-3"><UploadCard label={at('coupleLabel', pl)} photo={couplePhoto} uploading={uploading === 'couple'} onUpload={f => uploadPhoto(f, 'couple')} onClear={() => setCouplePhoto('')} /></div><p className="text-center text-[11px] text-stone-400 pt-2">{at('studioUploadNote', pl)}</p><p className="text-center text-[11px] text-amber-600 font-medium">{at('studioUploadBonus', pl)}</p>
              <div className="flex gap-3 pt-4">
                {!isSetupMode && myPacks.length > 0 && (
                  <button onClick={() => { const rp = myPacks.find(p => p.concept && p.concept !== ''); if (rp) { setActivePack(rp); setStep(10); } }}
                    className="px-6 py-3 rounded-lg border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> {at('studioMyPortfolioBtn', pl)}
                  </button>
                )}
                <button onClick={() => setStep(3)} disabled={!groomPhoto || !bridePhoto}
                  className="flex-1 px-8 py-3 rounded-lg bg-stone-800 text-white text-sm font-medium disabled:opacity-30 hover:bg-stone-900 transition-all flex items-center gap-1 justify-center">
                  다음 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Step>
          )}



          {step === 3 && (
            <Step title={at('studioConceptTitle', pl)} sub={at('studioConceptSub', pl)}>
              <div className="space-y-6">
                {CATEGORY_ORDER.map(cat => {
                  const catConcepts = cat.ids.map(id => concepts.find(c => c.id === id)).filter(Boolean) as Concept[];
                  if (catConcepts.length === 0) return null;
                  return (
                    <div key={cat.key}>
                      <p className="text-xs font-medium text-stone-400 tracking-widest uppercase mb-2">{cat.label}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {catConcepts.map(c => (
                          <button key={c.id} onClick={() => { setSelectedConcept(c.id); setCategory(c.category); }}
                            className={`rounded-lg py-3.5 px-4 text-left transition-all border-2 ${selectedConcept === c.id ? 'border-stone-800 bg-stone-800' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                            <p className={`text-sm font-semibold ${selectedConcept === c.id ? 'text-white' : 'text-stone-800'}`}>{c.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <NavButtons
                onBack={() => setStep(1)}
                onNext={() => setStep(isSetupMode ? 7 : 4)}
                disabled={!selectedConcept}
                nextLabel={isSetupMode ? at('studioConfirmSetup', pl) : at('next', pl)}
              />
            </Step>
          )}

          {step === 4 && !isSetupMode && (
            <Step title={at('studioPkgTitle', pl)} sub={at('studioPkgSub', pl)}>
              <div className="space-y-3">
                {tiers.map(t => {
                  const perSnap = Math.round(t.price / t.snaps);
                  return (
                    <button key={t.id} onClick={() => setSelectedTier(t.id)}
                      className={`w-full flex items-center justify-between p-5 rounded-lg border-2 transition-all ${selectedTier === t.id ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedTier === t.id ? 'bg-stone-800' : 'bg-stone-100'}`}>
                          <Package className={`w-5 h-5 ${selectedTier === t.id ? 'text-white' : 'text-stone-400'}`} />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-stone-800">{t.label}</p>
                          <p className="text-xs text-stone-400">장당 {perSnap.toLocaleString()}원</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-light text-stone-800">{t.price.toLocaleString()}<span className="text-xs text-stone-400">원</span></p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <NavButtons onBack={() => setStep(3)} onNext={() => setStep(5)} disabled={!selectedTier} nextLabel={at('reviewPayment', pl)} />
            </Step>
          )}

          {step === 5 && !isSetupMode && (
            <Step title={at('studioOrderTitle', pl)} sub={at('studioOrderSub', pl)}>
              {(() => {
                const t = tiers.find(t => t.id === selectedTier);
                const allC = concepts;
                const c = allC.find(c => c.id === selectedConcept);
                const originalPrice = t?.price || 0;
                const discountedPrice = couponResult?.valid
                  ? couponResult.discountType === 'PERCENT'
                    ? Math.round(originalPrice * (1 - couponResult.discountValue / 100))
                    : Math.max(0, originalPrice - couponResult.discountValue)
                  : originalPrice;
                const saved = originalPrice - discountedPrice;
                return (
                  <div className="space-y-6">
                    <div className="bg-stone-50 rounded-lg border border-stone-200 p-5 space-y-3">
                      <Row label={at('studioCategory', pl)} value={category === 'studio' ? at('studioType', pl) : at('cinematicType', pl)} />
                      <Row label={at('studioConceptLabel', pl)} value={c?.label || ''} />
                      <Row label={at('studioShotsLabel', pl)} value={`${t?.snaps}장`} />
                      <Row label={at('studioModeLabel', pl)} value={at('studioModeDesc', pl)} />
                      <div className="border-t border-stone-200 pt-3">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="text"
                            placeholder={at('studioDiscountCode', pl)}
                            value={couponCode}
                            onChange={e => { setCouponCode(e.target.value); setCouponResult(null); setCouponError(''); }}
                            className="flex-1 px-4 py-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-stone-400 bg-white"
                          />
                          <button
                            onClick={validateCoupon}
                            disabled={couponChecking || !couponCode.trim()}
                            className="px-5 py-3 rounded-lg bg-stone-800 text-white text-sm font-medium disabled:opacity-40 hover:bg-stone-900 transition-all shrink-0">
                            {couponChecking ? '...' : '적용'}
                          </button>
                        </div>
                        {couponError && <p className="text-xs text-red-500 mb-2">{couponError}</p>}
                        {couponResult?.valid && (
                          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 mb-3">
                            <span className="text-xs text-emerald-700 font-medium">{couponResult.name} {at('studioApplied', pl)}</span>
                            <span className="text-xs text-emerald-600 font-semibold">-{saved.toLocaleString()}원</span>
                          </div>
                        )}
                        <div className="flex justify-between items-end">
                          <span className="font-semibold text-stone-800">{at('studioPayAmount', pl)}</span>
                          <div className="text-right">
                            {couponResult?.valid && (
                              <p className="text-xs text-stone-400 line-through">{originalPrice.toLocaleString()}원</p>
                            )}
                            <span className="text-xl font-light text-stone-800">{discountedPrice.toLocaleString()}<span className="text-xs text-stone-400">원</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={handlePayment}
                      className="w-full py-4 rounded-lg bg-stone-800 text-white font-medium flex items-center justify-center gap-2 hover:bg-stone-900 transition-all">
                      <CreditCard className="w-5 h-5" /> 결제하기
                    </button>
                  </div>
                );
              })()}
            </Step>
          )}

          {step === 7 && isSetupMode && (
            <Step title={at('studioSetupTitle', pl)} sub={at('studioSetupSub', pl)}>
              {(() => {
                const allC = concepts;
                const c = allC.find(c => c.id === selectedConcept);
                return (
                  <div className="space-y-6">
                    <div className="bg-stone-50 rounded-lg border border-stone-200 p-5 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Gift className="w-4 h-4 text-amber-600" />
                        <span className="text-xs text-amber-600 font-semibold">{at('giftPackageLabel', pl)}</span>
                      </div>
                      <Row label={at('studioCategory', pl)} value={category === 'studio' ? at('studioType', pl) : at('cinematicType', pl)} />
                      <Row label={at('studioConceptLabel', pl)} value={c?.label || ''} />
                      <Row label={at('studioShotsLabel', pl)} value={`${setupTier?.snaps || ''}장`} />
                      <Row label={at('studioModeLabel', pl)} value={at('studioModeDesc', pl)} />
                      <div className="border-t border-stone-200 pt-3 flex justify-between">
                        <span className="font-semibold text-stone-800">{at('studioPayAmount', pl)}</span>
                        <span className="text-xl font-light text-green-600">0<span className="text-xs text-stone-400">원 (선물)</span></span>
                      </div>
                    </div>
                    <button onClick={handleSetup} disabled={setupLoading}
                      className="w-full py-4 rounded-lg bg-stone-800 text-white font-medium flex items-center justify-center gap-2 hover:bg-stone-900 transition-all disabled:opacity-50">
                      {setupLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      화보 시작하기
                    </button>
                  </div>
                );
              })()}
            </Step>
          )}

          {step === 10 && activePack && (
            <motion.div key="studio" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-stone-800">{at('studioMyPortraits', pl)}</h2>
                  <p className="text-xs text-stone-400 mt-1">{CONCEPT_LABELS[activePack.concept] || activePack.concept} · {activePack.usedSnaps}/{activePack.totalSnaps}장</p><p className="text-[10px] text-stone-300 mt-0.5">{at('studioAiNote', pl)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => { setSelectedTier(''); setSelectedConcept(''); setCategory('studio'); setGroomPhoto(''); setBridePhoto(''); setCouponCode(''); setCouponResult(null); setCouponError(''); setStep(1); }}
                    className="px-3 py-1.5 bg-stone-800 text-white rounded-full text-xs font-medium hover:bg-stone-900 transition-all flex items-center gap-1">
                    <Package className="w-3 h-3" /> 새 패키지
                  </button>
                  <div className="px-3 py-1.5 bg-stone-100 rounded-full text-xs text-stone-600">
                    {activePack.totalSnaps - activePack.usedSnaps}장 남음
                  </div>
                </div>
              </div>
              {myPacks.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {myPacks.filter(p => p.concept && p.concept !== '').map(p => (
                    <button key={p.id} onClick={() => setActivePack(p)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs border transition-all ${activePack.id === p.id ? 'border-stone-800 bg-stone-800 text-white' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                      {CONCEPT_LABELS[p.concept] || p.concept} · {p.usedSnaps}/{p.totalSnaps}
                    </button>
                  ))}
                </div>
              )}

              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-stone-800 rounded-full transition-all" style={{ width: `${(activePack.usedSnaps / activePack.totalSnaps) * 100}%` }} />
              </div>

              <div className="bg-stone-50 rounded-lg border border-stone-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-medium text-stone-600">{at('studioRegistered', pl)}</p>
                  <p className="text-[10px] text-stone-400">{at('studioClickReplace', pl)}</p>
                </div>
                <div className="flex gap-3">
                  {(activePack.inputUrls as string[]).map((url, idx) => (
                    <label key={idx} className="relative cursor-pointer group">
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const fd = new FormData(); fd.append("file", file); fd.append("upload_preset", UPLOAD_PRESET);
                        try {
                          const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
                          const d = await r.json(); if (!d.secure_url) return;
                          const token = localStorage.getItem("token");
                          const res = await fetch(`${import.meta.env.VITE_API_URL}/snap-pack/pack/${activePack.id}/photos`, {
                            method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ index: idx, url: d.secure_url }),
                          });
                          if (res.ok) {
                            const updated = await res.json();
                            setActivePack({ ...activePack, inputUrls: updated.inputUrls });
                            setMyPacks(prev => prev.map(p => p.id === activePack.id ? { ...p, inputUrls: updated.inputUrls } : p));
                          }
                        } catch (err) { console.error(err); }
                      }} />
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-stone-200 group-hover:border-stone-400 transition-all">
                        <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 40 40%27%3E%3Crect fill=%27%23f5f5f4%27 width=%2740%27 height=%2740%27/%3E%3Ctext x=%2720%27 y=%2722%27 text-anchor=%27middle%27 fill=%27%23a8a29e%27 font-size=%2710%27%3E!%3C/text%3E%3C/svg%3E"; }} />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg flex items-center justify-center transition-all">
                        <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <p className="text-[9px] text-stone-400 text-center mt-1">{idx === 0 ? at('groom', pl) : idx === 1 ? at('bride', pl) : at('couple', pl)}</p>
                    </label>
                  ))}
                </div>
              </div>

              {generating && (
                <div className="bg-stone-50 rounded-lg border border-stone-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">
                        {shotMode === 'couple' ? at('couple', pl) : shotMode === 'groom' ? at('groom', pl) : at('bride', pl)} {at('studioCreatingMode', pl)}
                      </p>
                      <p className="text-xs text-stone-400">{at('studioTimeNote', pl)}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-stone-800 rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-stone-400 mt-2 text-right">{Math.round(progress)}%</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {activePack.snaps.filter((s: any) => s.status !== 'failed').map((snap, i) => (
                  <div key={snap.id} className="rounded-lg overflow-hidden border border-stone-200">
                    {snap.status === 'done' && snap.resultUrl ? (
                      <div className="relative group">
                        <img src={snap.resultUrl} alt={`Shot ${i + 1}`} className="w-full aspect-square object-cover cursor-pointer" onClick={() => setViewSnap(snap)} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center pointer-events-none">
                          <div className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full transition-all">
                            <Download className="w-5 h-5 text-stone-800" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-black/50 rounded-full text-[10px] text-white">#{i + 1}</span>
                          {snap.mode && (
                            <span className="px-2 py-0.5 bg-black/50 rounded-full text-[10px] text-white">
                              {snap.mode === 'couple' ? at('couple', pl) : snap.mode === 'groom' ? at('groom', pl) : at('bride', pl)}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : snap.status === 'processing' ? (
                      <div className="aspect-square bg-stone-50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                      </div>
                    ) : (
                      <div onClick={() => { if (generating) return; generateSnap((snap.mode as ShotMode) || 'bride'); }} className="aspect-square bg-stone-50 flex items-center justify-center cursor-pointer hover:bg-stone-100 transition-colors">
                        {generating ? <Loader2 className="w-5 h-5 text-stone-400 animate-spin" /> : <><RefreshCw className="w-5 h-5 text-stone-400" /><span className="text-[10px] text-stone-400">{at('studioTapRegenerate', pl)}</span></>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {activePack.usedSnaps < activePack.totalSnaps && !generating && (
                <div className="space-y-3">
                  <p className="text-sm text-stone-500 text-center">{at('studioSelectNext', pl)}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => generateSnap('groom')}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-stone-200 hover:border-stone-800 hover:bg-stone-50 transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 group-hover:bg-stone-800 flex items-center justify-center transition-colors">
                        <User className="w-5 h-5 text-stone-500 group-hover:text-white transition-colors" />
                      </div>
                      <span className="text-xs font-semibold text-stone-700">{at('groom', pl)}</span>
                    </button>
                    <button onClick={() => generateSnap('bride')}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-stone-200 hover:border-stone-800 hover:bg-stone-50 transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 group-hover:bg-stone-800 flex items-center justify-center transition-colors">
                        <User className="w-5 h-5 text-stone-500 group-hover:text-white transition-colors" />
                      </div>
                      <span className="text-xs font-semibold text-stone-700">{at('bride', pl)}</span>
                    </button>
                    <button onClick={() => generateSnap('couple')}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-stone-200 hover:border-stone-800 hover:bg-stone-50 transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 group-hover:bg-stone-800 flex items-center justify-center transition-colors">
                        <Users className="w-5 h-5 text-stone-500 group-hover:text-white transition-colors" />
                      </div>
                      <span className="text-xs font-semibold text-stone-700">{at('couple', pl)}</span>
                    </button>
                  </div>
                  <p className="text-center text-[11px] text-stone-400">{activePack.totalSnaps - activePack.usedSnaps} {at('snapRemaining', pl)}</p>
                </div>
              )}

              {activePack.usedSnaps >= activePack.totalSnaps && !generating && (
                <div className="bg-stone-50 rounded-lg border border-stone-200 p-6 text-center">
                  <p className="text-sm font-semibold text-stone-800 mb-2">{at('studioAllDone', pl)}</p>
                  {!showAddSnaps ? (
                    <>
                      <p className="text-xs text-stone-400 mb-4">{at('studioAddMore', pl)}</p>
                      <button onClick={() => setShowAddSnaps(true)} className="px-6 py-2.5 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-900 transition-all">
                        추가 생성하기
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-4 gap-2">
                        {ADD_TIERS.map(t => (
                          <button key={t.id} onClick={() => setAddTier(t.id)}
                            className={`p-3 rounded-lg border-2 transition-all ${addTier === t.id ? 'border-stone-800 bg-stone-800 text-white' : 'border-stone-200 hover:border-stone-300'}`}>
                            <p className={`text-sm font-semibold ${addTier === t.id ? 'text-white' : 'text-stone-800'}`}>{t.label}</p>
                            <p className={`text-xs ${addTier === t.id ? 'text-white/60' : 'text-stone-400'}`}>{t.price.toLocaleString()}원</p>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowAddSnaps(false)} className="flex-1 py-2.5 border border-stone-200 text-stone-500 rounded-lg text-sm hover:bg-stone-50">{at('cancel', pl)}</button>
                        <button onClick={handleAddSnaps} disabled={addPaying}
                          className="flex-1 py-2.5 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-900 disabled:opacity-50 flex items-center justify-center gap-1.5">
                          {addPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          결제하기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {myPacks.length > 1 && (
                <div className="pt-4 border-t border-stone-100">
                  <p className="text-xs text-stone-400 mb-3">{at('studioMyPacks', pl)}</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {myPacks.filter(p => p.concept && p.concept !== '').map(p => (
                      <button key={p.id} onClick={() => setActivePack(p)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs transition-all ${p.id === activePack?.id ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                        {CONCEPT_LABELS[p.concept] || p.concept} · {p.usedSnaps}/{p.totalSnaps}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 10 && !activePack && myPacks.length > 0 && (() => {
            const readyPack = myPacks.find(p => p.concept && p.concept !== '');
            if (readyPack) { setActivePack(readyPack); }
            return null;
          })()}
        </AnimatePresence>

      {viewSnap?.resultUrl && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => { setViewSnap(null); setCompareMode(false); setCompareView('original'); }}>
          <button onClick={() => { setViewSnap(null); setCompareMode(false); setCompareView('original'); }} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10">
            <X className="w-6 h-6" />
          </button>

          {compareMode && viewSnap.retryResultUrl ? (
            <div className="flex flex-col items-center gap-4 w-full max-w-lg px-4" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="flex gap-1 bg-white/10 backdrop-blur-md rounded-full p-1 w-full max-w-xs">
                <button onClick={() => setCompareView('original')} className={'flex-1 py-2.5 rounded-full text-xs font-medium transition-all ' + (compareView === 'original' ? 'bg-white text-stone-900' : 'text-white/60 hover:text-white')}>
                  원래 버전
                </button>
                <button onClick={() => setCompareView('new')} className={'flex-1 py-2.5 rounded-full text-xs font-medium transition-all ' + (compareView === 'new' ? 'bg-white text-stone-900' : 'text-white/60 hover:text-white')}>
                  새 버전
                </button>
              </div>
              <img src={compareView === 'original' ? viewSnap.resultUrl : viewSnap.retryResultUrl} alt="" className="max-w-full max-h-[55vh] sm:max-h-[65vh] object-contain rounded-xl" />
              <div className="w-full max-w-xs space-y-2">
                <button onClick={async () => {
                  await fetch(API + '/ai-snap/' + viewSnap.id + '/select', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') }, body: JSON.stringify({ version: 'retry' }) });
                  if (activePack) { const up = { ...activePack, snaps: activePack.snaps.map((s: Snap) => s.id === viewSnap.id ? { ...s, resultUrl: viewSnap.retryResultUrl } : s) }; setActivePack(up); }
                  setViewSnap({ ...viewSnap, resultUrl: viewSnap.retryResultUrl! });
                  setCompareMode(false);
                }} className="w-full py-3 bg-white text-stone-900 rounded-full text-sm font-medium hover:bg-stone-100 transition-all">
                  새 버전으로 변경
                </button>
                <button onClick={async () => {
                  await fetch(API + '/ai-snap/' + viewSnap.id + '/select', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') }, body: JSON.stringify({ version: 'original' }) });
                  setCompareMode(false);
                }} className="w-full py-3 bg-white/10 text-white/70 rounded-full text-sm font-medium hover:bg-white/20 transition-all">
                  원래 버전 유지
                </button>
              </div>
            </div>
          ) : (
            <>
              <img src={viewSnap.resultUrl} alt="" className="max-w-full max-h-[70vh] sm:max-h-[85vh] object-contain rounded-xl" onClick={(e: React.MouseEvent) => e.stopPropagation()} />
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 flex flex-col items-center gap-2">
                {viewSnap.retryStatus === 'done' && viewSnap.retryResultUrl ? (
                  <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); setCompareMode(true); setCompareView('new'); }}
                    className="w-full py-3 bg-white text-stone-900 rounded-full text-sm font-medium hover:bg-stone-100 transition-all text-center">
                    새로운 버전이 준비됐어요
                  </button>
                ) : viewSnap.retryStatus === 'generating' ? (
                  <div className="w-full py-3 bg-white/10 backdrop-blur-md text-white/80 rounded-full text-sm text-center flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />새 버전 생성중...
                  </div>
                ) : !viewSnap.retryStatus ? (
                  <button onClick={async (e: React.MouseEvent) => {
                    e.stopPropagation(); setRetrying(true);
                    try {
                      await fetch(API + '/ai-snap/' + viewSnap.id + '/retry', { method: 'POST', headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
                      if (activePack) { const up = { ...activePack, snaps: activePack.snaps.map((s: Snap) => s.id === viewSnap.id ? { ...s, retryStatus: 'generating' } : s) }; setActivePack(up); }
                      setViewSnap({ ...viewSnap, retryStatus: 'generating' });
                    } catch {} setRetrying(false);
                  }} disabled={retrying}
                    className="w-full py-3 bg-white/10 backdrop-blur-md text-white/80 rounded-full text-sm hover:bg-white/20 transition-all text-center flex items-center justify-center gap-2">
                    {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {retrying ? '요청중...' : '마음에 안 들어요'}
                  </button>
                ) : null}
                <div className="flex gap-2 w-full">
                  <span className="px-3 py-2 bg-white/10 backdrop-blur-md text-white/60 text-xs rounded-full">
                    #{(activePack?.snaps.findIndex((s: Snap) => s.id === viewSnap.id) ?? 0) + 1} {viewSnap.mode === 'couple' ? at('couple', pl) : viewSnap.mode === 'groom' ? at('groom', pl) : at('bride', pl)}
                  </span>
                  <a href={viewSnap.resultUrl} download target="_blank" onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    className="flex-1 py-2 bg-white text-stone-900 rounded-full text-xs font-medium hover:bg-stone-100 transition-all text-center flex items-center justify-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />저장
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      </main>
    </div>
  );
}

function Step({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-stone-800 mb-2">{title}</h2>
        <p className="text-sm text-stone-500">{sub}</p>
      </div>
      {children}
    </motion.div>
  );
}

function NavButtons({ onBack, onNext, disabled, nextLabel }: { onBack: () => void; onNext: () => void; disabled: boolean; nextLabel?: string }) {
  const { locale: pl } = useLocaleStore();
  const label = nextLabel || at('next', pl);
  return (
    <div className="flex gap-3 pt-4">
      <button onClick={onBack} className="px-6 py-3 rounded-lg border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> {at('prev', pl)}
      </button>
      <button onClick={onNext} disabled={disabled}
        className="flex-1 py-3 rounded-lg bg-stone-800 text-white text-sm font-medium disabled:opacity-30 hover:bg-stone-900 transition-all flex items-center justify-center gap-1">
        {label} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-stone-400">{label}</span>
      <span className="text-stone-800 font-medium">{value}</span>
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
