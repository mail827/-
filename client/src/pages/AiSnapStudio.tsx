import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Camera, X, Download, Loader2, User, Users, ArrowRight, ArrowLeft, Package, Image, CreditCard } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

type Mode = 'groom' | 'bride' | 'couple';
type Category = 'studio' | 'cinematic';

interface Tier { id: string; snaps: number; price: number; label: string }
interface Concept { id: string; label: string; category: string }
interface Snap { id: string; status: string; resultUrl?: string; concept: string; createdAt: string }
interface Pack { id: string; tier: string; totalSnaps: number; usedSnaps: number; concept: string; category: string; mode: string; status: string; snaps: Snap[] }

export default function AiSnapStudioPage() {
  const token = localStorage.getItem('token');
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(true);

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [concepts, setConcepts] = useState<{ studio: Concept[]; cinematic: Concept[] }>({ studio: [], cinematic: [] });

  const [selectedTier, setSelectedTier] = useState('');
  const [category, setCategory] = useState<Category>('studio');
  const [selectedConcept, setSelectedConcept] = useState('');
  const [mode, setMode] = useState<Mode>('groom');
  const [groomPhoto, setGroomPhoto] = useState('');
  const [bridePhoto, setBridePhoto] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);

  const [activePack, setActivePack] = useState<Pack | null>(null);
  const [myPacks, setMyPacks] = useState<Pack[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, setPollingId] = useState<string | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval>>();
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!token) { setChecking(false); return; }
    Promise.all([
      fetch(`${API}/snap-pack/tiers`).then(r => r.json()),
      fetch(`${API}/snap-pack/concepts`).then(r => r.json()),
      fetch(`${API}/snap-pack/my-packs`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([t, c, p]) => {
      setTiers(t);
      setConcepts(c);
      if (Array.isArray(p) && p.length > 0) {
        setMyPacks(p);
        setStep(10);
      } else {
        setStep(1);
      }
    }).catch(() => setStep(1)).finally(() => setChecking(false));
  }, [token]);

  useEffect(() => {
    return () => { clearInterval(progressRef.current); clearInterval(pollRef.current); };
  }, []);

  const uploadPhoto = async (file: File, type: 'groom' | 'bride') => {
    setUploading(type);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (type === 'groom') setGroomPhoto(data.secure_url);
      else setBridePhoto(data.secure_url);
    } catch {}
    setUploading(null);
  };

  const getUrls = () => {
    if (mode === 'couple') return [groomPhoto, bridePhoto];
    if (mode === 'groom') return [groomPhoto];
    return [bridePhoto];
  };

  const canPhoto = () => {
    if (mode === 'couple') return !!groomPhoto && !!bridePhoto;
    if (mode === 'groom') return !!groomPhoto;
    return !!bridePhoto;
  };

  const handleLogin = (provider: 'google' | 'kakao') => {
    localStorage.setItem('redirectAfterLogin', '/ai-snap/studio');
    window.location.href = `${API}/oauth/${provider}`;
  };

  const handlePayment = async () => {
    if (!selectedTier || !selectedConcept) return;
    try {
      const orderRes = await fetch(`${API}/snap-pack/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier: selectedTier, concept: selectedConcept, category, mode, imageUrls: getUrls() }),
      });
      const order = await orderRes.json();
      if (!order.orderId) return;

      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
      const tp = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tp.payment({ customerKey: `user_${Date.now()}` });

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: order.amount },
        orderId: order.orderId,
        orderName: `AI 웨딩스냅 ${tiers.find(t => t.id === selectedTier)?.label}`,
        successUrl: `${window.location.origin}/ai-snap/studio/callback?packId=${order.packId}`,
        failUrl: `${window.location.origin}/ai-snap/studio?error=payment_failed`,
      });
    } catch {}
  };

  const loadPack = async (packId: string) => {
    const res = await fetch(`${API}/snap-pack/pack/${packId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setActivePack(data);
    return data;
  };

  const generateSnap = async () => {
    if (!activePack || generating) return;
    setGenerating(true);
    setProgress(0);
    progressRef.current = setInterval(() => setProgress(p => p >= 92 ? 92 : p + Math.random() * 8), 800);

    try {
      const res = await fetch(`${API}/snap-pack/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packId: activePack.id }),
      });
      const data = await res.json();
      if (data.error) {
        clearInterval(progressRef.current);
        setGenerating(false);
        return;
      }
      setPollingId(data.snapId);
      pollRef.current = setInterval(async () => {
        const snapRes = await fetch(`${API}/snap-pack/snap/${data.snapId}`, { headers: { Authorization: `Bearer ${token}` } });
        const snap = await snapRes.json();
        if (snap.status === 'done' || snap.status === 'failed') {
          clearInterval(pollRef.current);
          clearInterval(progressRef.current);
          setProgress(snap.status === 'done' ? 100 : 0);
          setPollingId(null);
          setGenerating(false);
          await loadPack(activePack.id);
        }
      }, 3000);
    } catch {
      clearInterval(progressRef.current);
      setGenerating(false);
    }
  };

  if (checking) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-6 h-6 text-stone-400 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-stone-200 sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="font-serif text-xl text-stone-800">청첩장 작업실</a>
          {step >= 1 && step <= 6 && (
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map(s => (
                <div key={s} className={`h-1 rounded-full transition-all ${s <= step ? 'w-5 bg-stone-800' : 'w-2 bg-stone-200'}`} />
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-600 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-7 h-7 text-amber-300" />
                </div>
                <h1 className="font-serif text-2xl text-stone-800 mb-2">AI 웨딩 화보 스튜디오</h1>
                <p className="text-sm text-stone-500">사진으로 프로 웨딩 화보 세트를 만들어보세요</p>
              </div>
              <div className="space-y-3 max-w-xs mx-auto">
                <button onClick={() => handleLogin('kakao')} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl hover:opacity-90 transition-all" style={{ background: '#FEE500' }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.722 1.755 5.108 4.396 6.462-.148.536-.954 3.442-.984 3.66 0 0-.02.163.086.226.105.063.23.03.23.03.303-.042 3.514-2.313 4.07-2.707.717.1 1.457.153 2.202.153 5.523 0 10-3.463 10-7.824C22 6.463 17.523 3 12 3" fill="#3C1E1E"/></svg>
                  <span className="text-sm font-medium" style={{ color: '#3C1E1E' }}>카카오로 시작하기</span>
                </button>
                <button onClick={() => handleLogin('google')} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-stone-200 rounded-2xl hover:border-stone-400 transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <span className="text-sm font-medium text-stone-700">Google로 시작하기</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-400">3초면 가입 완료</p>
            </motion.div>
          )}

          {step === 1 && (
            <Step title="촬영 모드 선택" sub="누구의 화보를 만들까요?" onBack={() => {}}>
              <div className="space-y-3">
                {([
                  { m: 'groom' as Mode, icon: User, label: '신랑 단독', desc: '신랑 사진 1장으로 화보 세트' },
                  { m: 'bride' as Mode, icon: User, label: '신부 단독', desc: '신부 사진 1장으로 화보 세트' },
                  { m: 'couple' as Mode, icon: Users, label: '커플 화보', desc: '신랑 + 신부 사진으로 커플 화보 세트' },
                ]).map(item => (
                  <button key={item.m} onClick={() => { setMode(item.m); setStep(2); }}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-stone-200 hover:border-stone-800 transition-all text-left group">
                    <div className="w-12 h-12 rounded-xl bg-stone-100 group-hover:bg-stone-800 flex items-center justify-center transition-colors">
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
            </Step>
          )}

          {step === 2 && (
            <Step title="사진 업로드" sub="정면 얼굴이 잘 보이는 사진이 좋아요" onBack={() => setStep(1)}>
              <div className={`grid gap-4 ${mode === 'couple' ? 'grid-cols-2' : 'grid-cols-1 max-w-[200px] mx-auto'}`}>
                {(mode === 'couple' || mode === 'groom') && (
                  <UploadCard label="신랑" photo={groomPhoto} uploading={uploading === 'groom'} onUpload={f => uploadPhoto(f, 'groom')} onClear={() => setGroomPhoto('')} />
                )}
                {(mode === 'couple' || mode === 'bride') && (
                  <UploadCard label="신부" photo={bridePhoto} uploading={uploading === 'bride'} onUpload={f => uploadPhoto(f, 'bride')} onClear={() => setBridePhoto('')} />
                )}
              </div>
              <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} disabled={!canPhoto()} />
            </Step>
          )}

          {step === 3 && (
            <Step title="카테고리 선택" sub="원하는 촬영 스타일을 골라주세요" onBack={() => setStep(2)}>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { c: 'studio' as Category, label: '스튜디오', desc: '깨끗하고 정적인 웨딩 화보', icon: Image },
                  { c: 'cinematic' as Category, label: '시네마틱', desc: '영화 같은 드라마틱 화보', icon: Sparkles },
                ]).map(item => (
                  <button key={item.c} onClick={() => { setCategory(item.c); setStep(4); }}
                    className={`p-6 rounded-2xl border-2 text-center transition-all hover:shadow-lg ${category === item.c ? 'border-stone-800 bg-stone-800' : 'border-stone-200 hover:border-stone-400'}`}>
                    <item.icon className={`w-8 h-8 mx-auto mb-3 ${category === item.c ? 'text-amber-300' : 'text-stone-400'}`} />
                    <p className={`font-semibold mb-1 ${category === item.c ? 'text-white' : 'text-stone-800'}`}>{item.label}</p>
                    <p className={`text-xs ${category === item.c ? 'text-white/60' : 'text-stone-400'}`}>{item.desc}</p>
                  </button>
                ))}
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step title="컨셉 선택" sub="세트 내 모든 사진이 이 컨셉으로 촬영돼요" onBack={() => setStep(3)}>
              <div className="grid grid-cols-2 gap-2">
                {(category === 'studio' ? concepts.studio : concepts.cinematic).map(c => (
                  <button key={c.id} onClick={() => setSelectedConcept(c.id)}
                    className={`rounded-2xl py-3.5 px-4 text-left transition-all border-2 ${selectedConcept === c.id ? 'border-stone-800 bg-stone-800' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                    <p className={`text-sm font-semibold ${selectedConcept === c.id ? 'text-white' : 'text-stone-800'}`}>{c.label}</p>
                  </button>
                ))}
              </div>
              <NavButtons onBack={() => setStep(3)} onNext={() => setStep(5)} disabled={!selectedConcept} />
            </Step>
          )}

          {step === 5 && (
            <Step title="패키지 선택" sub="장수가 많을수록 장당 가격이 저렴해요" onBack={() => setStep(4)}>
              <div className="space-y-3">
                {tiers.map(t => {
                  const perSnap = Math.round(t.price / t.snaps);
                  return (
                    <button key={t.id} onClick={() => setSelectedTier(t.id)}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${selectedTier === t.id ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedTier === t.id ? 'bg-stone-800' : 'bg-stone-100'}`}>
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
              <NavButtons onBack={() => setStep(4)} onNext={() => setStep(6)} disabled={!selectedTier} nextLabel="결제 확인" />
            </Step>
          )}

          {step === 6 && (
            <Step title="주문 확인" sub="결제 후 바로 화보 생성이 시작돼요" onBack={() => setStep(5)}>
              {(() => {
                const t = tiers.find(t => t.id === selectedTier);
                const allC = [...concepts.studio, ...concepts.cinematic];
                const c = allC.find(c => c.id === selectedConcept);
                return (
                  <div className="space-y-6">
                    <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5 space-y-3">
                      <Row label="모드" value={mode === 'couple' ? '커플' : mode === 'groom' ? '신랑' : '신부'} />
                      <Row label="카테고리" value={category === 'studio' ? '스튜디오' : '시네마틱'} />
                      <Row label="컨셉" value={c?.label || ''} />
                      <Row label="장수" value={`${t?.snaps}장`} />
                      <div className="border-t border-stone-200 pt-3 flex justify-between">
                        <span className="font-semibold text-stone-800">결제 금액</span>
                        <span className="text-xl font-light text-stone-800">{t?.price.toLocaleString()}<span className="text-xs text-stone-400">원</span></span>
                      </div>
                    </div>
                    <button onClick={handlePayment}
                      className="w-full py-4 rounded-2xl bg-stone-800 text-white font-medium flex items-center justify-center gap-2 hover:bg-stone-900 transition-all">
                      <CreditCard className="w-5 h-5" /> 결제하기
                    </button>
                  </div>
                );
              })()}
            </Step>
          )}

          {step === 10 && activePack && (
            <motion.div key="studio" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl text-stone-800">내 웨딩 화보</h2>
                  <p className="text-xs text-stone-400 mt-1">{activePack.concept} · {activePack.usedSnaps}/{activePack.totalSnaps}장</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 bg-stone-100 rounded-full text-xs text-stone-600">
                    {activePack.totalSnaps - activePack.usedSnaps}장 남음
                  </div>
                </div>
              </div>

              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-stone-800 rounded-full transition-all" style={{ width: `${(activePack.usedSnaps / activePack.totalSnaps) * 100}%` }} />
              </div>

              {generating && (
                <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">화보를 촬영하고 있어요</p>
                      <p className="text-xs text-stone-400">30초~1분 소요</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-stone-800 rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-stone-400 mt-2 text-right">{Math.round(progress)}%</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {activePack.snaps.map((snap, i) => (
                  <div key={snap.id} className="rounded-2xl overflow-hidden border border-stone-200">
                    {snap.status === 'done' && snap.resultUrl ? (
                      <div className="relative group">
                        <img src={snap.resultUrl} alt={`Shot ${i + 1}`} className="w-full aspect-square object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <a href={snap.resultUrl} download target="_blank"
                            className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full transition-all">
                            <Download className="w-5 h-5 text-stone-800" />
                          </a>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded-full text-[10px] text-white">#{i + 1}</div>
                      </div>
                    ) : snap.status === 'processing' ? (
                      <div className="aspect-square bg-stone-50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="aspect-square bg-stone-50 flex items-center justify-center">
                        <X className="w-6 h-6 text-red-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {activePack.usedSnaps < activePack.totalSnaps && !generating && (
                <button onClick={generateSnap}
                  className="w-full py-4 rounded-2xl bg-stone-800 text-white font-medium flex items-center justify-center gap-2 hover:bg-stone-900 transition-all">
                  <Sparkles className="w-5 h-5" /> 다음 컷 촬영하기 ({activePack.totalSnaps - activePack.usedSnaps}장 남음)
                </button>
              )}

              {activePack.usedSnaps >= activePack.totalSnaps && !generating && (
                <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6 text-center">
                  <p className="text-sm font-semibold text-stone-800 mb-2">모든 촬영이 완료됐어요!</p>
                  <p className="text-xs text-stone-400 mb-4">추가 촬영이 필요하다면 장당 1,500원에 추가할 수 있어요</p>
                  <button className="px-6 py-2.5 bg-stone-800 text-white rounded-xl text-sm hover:bg-stone-900 transition-all">
                    추가 촬영하기
                  </button>
                </div>
              )}

              {myPacks.length > 1 && (
                <div className="pt-4 border-t border-stone-100">
                  <p className="text-xs text-stone-400 mb-3">내 화보 팩</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {myPacks.map(p => (
                      <button key={p.id} onClick={() => { setActivePack(p); }}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs transition-all ${p.id === activePack?.id ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                        {p.concept} · {p.usedSnaps}/{p.totalSnaps}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 10 && !activePack && myPacks.length > 0 && (() => { setActivePack(myPacks[0]); return null; })()}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Step({ title, sub, children }: { title: string; sub: string; onBack?: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="text-center">
        <h2 className="font-serif text-2xl text-stone-800 mb-2">{title}</h2>
        <p className="text-sm text-stone-500">{sub}</p>
      </div>
      {children}
    </motion.div>
  );
}

function NavButtons({ onBack, onNext, disabled, nextLabel = '다음' }: { onBack: () => void; onNext: () => void; disabled: boolean; nextLabel?: string }) {
  return (
    <div className="flex gap-3 pt-4">
      <button onClick={onBack} className="px-6 py-3 rounded-xl border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> 이전
      </button>
      <button onClick={onNext} disabled={disabled}
        className="flex-1 py-3 rounded-xl bg-stone-800 text-white text-sm font-medium disabled:opacity-30 hover:bg-stone-900 transition-all flex items-center justify-center gap-1">
        {nextLabel} <ArrowRight className="w-4 h-4" />
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
    <div className="relative aspect-square rounded-2xl overflow-hidden border border-stone-200">
      <img src={photo} alt={label} className="w-full h-full object-cover" />
      <button onClick={onClear} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"><X className="w-4 h-4" /></button>
      <div className="absolute bottom-0 inset-x-0 py-2 bg-gradient-to-t from-black/50 text-center"><span className="text-xs text-white font-medium">{label}</span></div>
    </div>
  ) : (
    <label className={`aspect-square rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer hover:border-stone-400 transition-all ${uploading ? 'opacity-50' : ''}`}>
      {uploading ? <Loader2 className="w-8 h-8 text-stone-400 animate-spin" /> : (
        <>
          <Camera className="w-8 h-8 text-stone-400 mb-2" />
          <span className="text-sm font-medium text-stone-500">{label} 사진</span>
          <span className="text-[11px] text-stone-400 mt-1">얼굴이 잘 보이게</span>
        </>
      )}
      <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} className="hidden" disabled={uploading} />
    </label>
  );
}
