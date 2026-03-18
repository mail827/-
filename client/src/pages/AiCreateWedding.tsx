import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, X, Gift, Upload, Sparkles, RefreshCw, Eye } from 'lucide-react';
import KakaoAddressInput from '../components/KakaoAddressInput';
import { THEME_COLORS } from '../types';

interface ThemeRecommendation {
  themeId: string;
  name: string;
  mood: string;
  colors: string;
  reason: string;
  matchScore: number;
}

interface Package {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  features: string[];
}

interface AvailableOrder {
  id: string;
  orderId: string;
  package: Package;
  type?: string;
}

declare global {
  interface Window {
    TossPayments?: any;
  }
}

const TONES = [
  { id: 'formal', label: '격식', desc: '정중하고 어른스러운' },
  { id: 'casual', label: '캐주얼', desc: '친근하고 편안한' },
  { id: 'romantic', label: '로맨틱', desc: '감성적이고 시적인' },
  { id: 'witty', label: '위트', desc: '센스있고 유머러스한' },
];

export default function AiCreateWedding() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const [step, setStep] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [availableOrder, setAvailableOrder] = useState<AvailableOrder | null>(null);
  const [giftId, setGiftId] = useState<string | null>(null);
  const [checkingOrder, setCheckingOrder] = useState(true);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'failed'>('idle');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<ThemeRecommendation[]>([]);
  const [analyzeError, setAnalyzeError] = useState('');

  const [tone, setTone] = useState('formal');
  const [generatingGreeting, setGeneratingGreeting] = useState(false);

  const [formData, setFormData] = useState({
    theme: '',
    groomName: '',
    groomNameEn: '',
    groomPhone: '',
    brideName: '',
    brideNameEn: '',
    bridePhone: '',
    groomFatherName: '',
    groomMotherName: '',
    brideFatherName: '',
    brideMotherName: '',
    showParents: true,
    greetingTitle: '',
    greeting: '',
    weddingDate: '',
    weddingTime: '',
    venue: '',
    venueHall: '',
    venueAddress: '',
    venuePhone: '',
    groomBank: '',
    groomAccount: '',
    groomAccountHolder: '',
    brideBank: '',
    brideAccount: '',
    brideAccountHolder: '',
    groomFatherBank: '',
    groomFatherAccount: '',
    groomFatherAccountHolder: '',
    groomMotherBank: '',
    groomMotherAccount: '',
    groomMotherAccountHolder: '',
    brideFatherBank: '',
    brideFatherAccount: '',
    brideFatherAccountHolder: '',
    brideMotherBank: '',
    brideMotherAccount: '',
    brideMotherAccountHolder: '',
  });

  const isGiftFlow = !!availableOrder;
  const STEPS = isGiftFlow
    ? ['AI 테마 추천', '기본 정보', '예식 정보', '계좌 정보', '확인']
    : ['AI 테마 추천', '기본 정보', '예식 정보', '계좌 정보', '패키지 선택', '결제'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try { setUser(JSON.parse(atob(token.split('.')[1]))); } catch {}
    }
    const saved = localStorage.getItem('pendingAiCreateForm');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.formData) setFormData(prev => ({ ...prev, ...p.formData }));
        if (p.selectedPackageId) setSelectedPackageId(p.selectedPackageId);
        if (p.step !== undefined) setStep(p.step);
        localStorage.removeItem('pendingAiCreateForm');
      } catch {}
    }
  }, []);

  useEffect(() => {
    fetchPackages();
    checkAvailableOrder();
    loadTossScript();
  }, []);

  const loadTossScript = () => {
    if (document.querySelector('script[src*="tosspayments"]')) return;
    const s = document.createElement('script');
    s.src = 'https://js.tosspayments.com/v1/payment';
    s.async = true;
    document.head.appendChild(s);
  };

  const checkAvailableOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setCheckingOrder(false); return; }
    try {
      const res = await fetch(`${API}/payment/available-order`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.availableOrder) {
          setAvailableOrder(data.availableOrder);
          setSelectedPackageId(data.availableOrder.package.id);
          if (data.type === 'gift' && data.giftId) setGiftId(data.giftId);
        }
      }
    } catch {} finally { setCheckingOrder(false); }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${API}/payment/packages`);
      const data = await res.json();
      setPackages(data);
      if (data.length > 0 && !selectedPackageId) setSelectedPackageId(data[0].id);
    } catch {}
  };

  const updateForm = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  const currentPackage = availableOrder?.package || packages.find(p => p.id === selectedPackageId);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'wedding_guide');
    fd.append('folder', 'ai-create');
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: fd }
    );
    if (!res.ok) throw new Error('업로드 실패');
    const data = await res.json();
    return data.secure_url;
  };

  const handlePhotoSelect = useCallback(async (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRecommendations([]);
    setAnalyzeError('');
    setFormData(prev => ({ ...prev, theme: '' }));

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setPhotoUrl(url);
      setUploading(false);

      setAnalyzing(true);
      const res = await fetch(`${API}/ai-create/recommend-theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      });
      if (!res.ok) throw new Error('분석 실패');
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (e: any) {
      setAnalyzeError(e.message || '분석 중 오류');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  }, [API]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handlePhotoSelect(file);
  }, [handlePhotoSelect]);

  const handleGenerateGreeting = async () => {
    if (!formData.groomName || !formData.brideName) return;
    setGeneratingGreeting(true);
    try {
      const res = await fetch(`${API}/ai-create/generate-greeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groomName: formData.groomName,
          brideName: formData.brideName,
          weddingDate: formData.weddingDate,
          tone,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        greetingTitle: data.greetingTitle || prev.greetingTitle,
        greeting: data.greeting || prev.greeting,
      }));
    } catch {
      alert('인사말 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setGeneratingGreeting(false);
    }
  };

  const handlePreview = () => {
    localStorage.setItem('previewWeddingData', JSON.stringify({
      ...formData,
      heroMedia: photoUrl || undefined,
      weddingDate: formData.weddingDate || new Date().toISOString().split('T')[0],
      weddingTime: formData.weddingTime || '12:00',
      groomName: formData.groomName || '신랑',
      brideName: formData.brideName || '신부',
      venue: formData.venue || '예식장',
      venueAddress: formData.venueAddress || '',
      greeting: formData.greeting || '저희 결혼합니다.',
      greetingTitle: formData.greetingTitle || '저희 결혼합니다',
    }));
    window.open('/w/preview', '_blank');
  };

  const handleCreateWedding = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('pendingAiCreateForm', JSON.stringify({ formData, selectedPackageId, step }));
      localStorage.setItem('returnTo', '/ai-create'); localStorage.setItem('redirectAfterLogin', '/ai-create');
      window.location.href = '/?login=true';
      return;
    }
    try {
      const body: any = { ...formData, heroMedia: photoUrl || undefined };
      if (giftId) body.giftId = giftId;
      else if (availableOrder) body.orderId = availableOrder.id;

      const res = await fetch(`${API}/weddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const wedding = await res.json();
        navigate(`/edit/${wedding.id}`);
      } else {
        const err = await res.json();
        alert(err.error || '생성에 실패했습니다');
      }
    } catch { alert('생성에 실패했습니다'); }
  };

  const handlePayment = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('pendingAiCreateForm', JSON.stringify({ formData, selectedPackageId, step }));
      localStorage.setItem('returnTo', '/ai-create'); localStorage.setItem('redirectAfterLogin', '/ai-create');
      window.location.href = '/?login=true';
      return;
    }
    setShowPaymentModal(true);
    setPaymentStatus('processing');
    try {
      const orderRes = await fetch(`${API}/payment/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: selectedPackageId, couponCode: appliedCoupon?.code }),
      });
      if (!orderRes.ok) throw new Error((await orderRes.json()).error || '주문 실패');
      const { order, clientKey } = await orderRes.json();
      if (!window.TossPayments) throw new Error('결제 모듈 로딩 실패');
      const toss = window.TossPayments(clientKey);
      const wd = encodeURIComponent(JSON.stringify({ ...formData, heroMedia: photoUrl || undefined }));
      await toss.requestPayment('카드', {
        amount: order.amount,
        orderId: order.orderId,
        orderName: order.package.name,
        customerName: user?.name || '고객',
        successUrl: `${window.location.origin}/payment/success?weddingData=${wd}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (e: any) {
      if (e.code === 'USER_CANCEL' || e.message?.includes('취소')) {
        setPaymentStatus('idle');
        setShowPaymentModal(false);
      } else {
        setPaymentStatus('failed');
      }
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch(`${API}/coupon/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setCouponError(data.error || '쿠폰 확인 실패'); setAppliedCoupon(null); }
      else { setAppliedCoupon(data.coupon); setCouponError(''); }
    } catch { setCouponError('네트워크 오류'); }
    finally { setCouponLoading(false); }
  };

  const getDiscountedPrice = () => {
    if (!currentPackage || !appliedCoupon) return currentPackage?.price || 0;
    if (appliedCoupon.discountType === 'PERCENT') return Math.floor(currentPackage.price * (100 - appliedCoupon.discountValue) / 100);
    return Math.max(0, currentPackage.price - appliedCoupon.discountValue);
  };

  const canNext = () => {
    switch (step) {
      case 0: return !!formData.theme;
      case 1: return !!formData.groomName && !!formData.brideName;
      case 2: return !!formData.weddingDate && !!formData.weddingTime && !!formData.venue && !!formData.venueAddress;
      case 3: return true;
      case 4: return isGiftFlow ? true : !!selectedPackageId;
      default: return true;
    }
  };

  const handleNext = () => { if (step < STEPS.length - 1) setStep(step + 1); };
  const handleBack = () => { if (step > 0) setStep(step - 1); else navigate(-1); };
  const isLastStep = step === STEPS.length - 1;

  if (checkingOrder) {
    return (
      <div className="min-h-screen bg-[#fefefe] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefefe]">
      <header className="border-b border-stone-200 sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-2 text-stone-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-stone-400" />
            <span className="text-[15px] font-semibold text-stone-800">AI 자동 제작</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {isGiftFlow && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-emerald-800">선물받은 패키지로 제작</p>
              <p className="text-sm text-emerald-600">{currentPackage?.name}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i <= step ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-500'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 sm:w-8 h-0.5 mx-0.5 ${i < step ? 'bg-stone-800' : 'bg-stone-200'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-stone-600 mt-2">{STEPS[step]}</p>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-32">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-semibold text-stone-800">사진 한 장으로 시작하세요</h2>
                  <p className="text-sm text-stone-500 mt-1">AI가 사진을 분석해서 어울리는 테마를 추천합니다</p>
                </div>

                {!photoPreview ? (
                  <label
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    className="block border-2 border-dashed border-stone-300 rounded-2xl p-12 text-center cursor-pointer hover:border-stone-400 transition-colors"
                  >
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }} />
                    <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-2xl flex items-center justify-center">
                      <Upload className="w-7 h-7 text-stone-400" />
                    </div>
                    <p className="text-stone-600 font-medium">대표 사진을 올려주세요</p>
                    <p className="text-xs text-stone-400 mt-2">웨딩 촬영 사진, 커플 사진 등</p>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-stone-100">
                      <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                      {(uploading || analyzing) && (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
                          <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                          <p className="text-white text-sm font-medium">
                            {uploading ? '사진 업로드 중...' : 'AI가 분석하고 있어요...'}
                          </p>
                        </div>
                      )}
                      {!uploading && !analyzing && (
                        <button
                          onClick={() => { setPhotoFile(null); setPhotoPreview(''); setPhotoUrl(''); setRecommendations([]); setFormData(prev => ({ ...prev, theme: '' })); }}
                          className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>

                    {analyzeError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-red-600">{analyzeError}</p>
                        <button onClick={() => { if (photoFile) handlePhotoSelect(photoFile); }} className="mt-2 text-sm text-red-700 underline">다시 시도</button>
                      </div>
                    )}

                    {recommendations.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <p className="text-sm font-medium text-stone-600 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          AI 추천 테마
                        </p>
                        {recommendations.map((rec, i) => {
                          const colors = THEME_COLORS[rec.themeId as keyof typeof THEME_COLORS];
                          return (
                            <motion.button
                              key={rec.themeId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              onClick={() => updateForm('theme', rec.themeId)}
                              className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                                formData.theme === rec.themeId
                                  ? 'border-stone-800 bg-stone-50 shadow-sm'
                                  : 'border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex gap-1 shrink-0 mt-0.5">
                                  {colors && [colors.primary, colors.accent, colors.bg].map((c, ci) => (
                                    <div key={ci} className="w-5 h-5 rounded-full border border-stone-200" style={{ background: c }} />
                                  ))}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-stone-800">{rec.name}</h3>
                                    <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">{rec.matchScore}%</span>
                                  </div>
                                  <p className="text-xs text-stone-500 mt-1">{rec.reason}</p>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-stone-800 mb-6">기본 정보를 입력해주세요</h2>
                <Section title="신랑 정보">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="이름 *" value={formData.groomName} onChange={v => updateForm('groomName', v)} />
                    <Input label="영문 이름" value={formData.groomNameEn} onChange={v => updateForm('groomNameEn', v)} />
                  </div>
                  <Input label="연락처" value={formData.groomPhone} onChange={v => updateForm('groomPhone', v)} placeholder="010-0000-0000" />
                </Section>
                <Section title="신부 정보">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="이름 *" value={formData.brideName} onChange={v => updateForm('brideName', v)} />
                    <Input label="영문 이름" value={formData.brideNameEn} onChange={v => updateForm('brideNameEn', v)} />
                  </div>
                  <Input label="연락처" value={formData.bridePhone} onChange={v => updateForm('bridePhone', v)} placeholder="010-0000-0000" />
                </Section>
                <Section title="부모님 정보">
                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input type="checkbox" checked={formData.showParents} onChange={e => updateForm('showParents', e.target.checked)} className="w-5 h-5 rounded" />
                    <span className="text-stone-600">부모님 성함 표시</span>
                  </label>
                  {formData.showParents && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-stone-600">신랑측</p>
                        <Input label="아버지" value={formData.groomFatherName} onChange={v => updateForm('groomFatherName', v)} />
                        <Input label="어머니" value={formData.groomMotherName} onChange={v => updateForm('groomMotherName', v)} />
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-stone-600">신부측</p>
                        <Input label="아버지" value={formData.brideFatherName} onChange={v => updateForm('brideFatherName', v)} />
                        <Input label="어머니" value={formData.brideMotherName} onChange={v => updateForm('brideMotherName', v)} />
                      </div>
                    </div>
                  )}
                </Section>
                <Section title="인사말">
                  <div className="flex gap-2 mb-3">
                    {TONES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTone(t.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          tone === t.id ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerateGreeting}
                    disabled={generatingGreeting || !formData.groomName || !formData.brideName}
                    className="w-full mb-4 py-3 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 flex items-center justify-center gap-2 hover:bg-stone-50 disabled:opacity-50 transition-colors"
                  >
                    {generatingGreeting ? (
                      <><div className="w-4 h-4 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" /> AI가 작성하는 중...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> AI로 인사말 작성하기</>
                    )}
                  </button>
                  <Input label="제목" value={formData.greetingTitle} onChange={v => updateForm('greetingTitle', v)} placeholder="저희 결혼합니다" />
                  <textarea
                    value={formData.greeting}
                    onChange={e => updateForm('greeting', e.target.value)}
                    rows={5}
                    placeholder="인사말을 입력하거나 AI로 자동 작성해보세요"
                    className="w-full mt-3 px-4 py-3 border border-stone-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                  {formData.greeting && (
                    <button onClick={handleGenerateGreeting} disabled={generatingGreeting} className="mt-2 text-xs text-stone-500 flex items-center gap-1 hover:text-stone-700">
                      <RefreshCw className="w-3 h-3" /> 다시 생성
                    </button>
                  )}
                </Section>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-stone-800 mb-6">예식 정보를 입력해주세요</h2>
                <Section title="예식 일시">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-stone-600 mb-2">날짜 *</label>
                      <input type="date" value={formData.weddingDate} onChange={e => updateForm('weddingDate', e.target.value)} className="w-full px-4 py-3 border border-stone-200 rounded-lg text-sm appearance-none bg-white" style={{ colorScheme: "light" }} />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-600 mb-2">시간 *</label>
                      <div className="flex gap-2">
                        <select
                          value={formData.weddingTime ? (parseInt(formData.weddingTime.split(':')[0]) >= 12 ? 'PM' : 'AM') : ''}
                          onChange={e => {
                            const period = e.target.value;
                            const parts = formData.weddingTime ? formData.weddingTime.split(':') : ['12', '00'];
                            let h = parseInt(parts[0]) || 12;
                            if (period === 'AM') h = h >= 12 ? h - 12 : h;
                            if (period === 'PM') h = h < 12 ? h + 12 : h;
                            updateForm('weddingTime', String(h).padStart(2, '0') + ':' + (parts[1] || '00'));
                          }}
                          className="flex-1 px-3 py-3 border border-stone-200 rounded-lg text-center appearance-none bg-white"
                        >
                          <option value="">-</option>
                          <option value="AM">오전</option>
                          <option value="PM">오후</option>
                        </select>
                        <select
                          value={formData.weddingTime ? (() => { const h = parseInt(formData.weddingTime.split(':')[0]); return h === 0 ? '12' : h > 12 ? String(h - 12) : String(h); })() : ''}
                          onChange={e => {
                            const parts = formData.weddingTime ? formData.weddingTime.split(':') : ['12', '00'];
                            const isPM = parseInt(parts[0]) >= 12;
                            let h = parseInt(e.target.value);
                            if (isPM && h !== 12) h += 12;
                            if (!isPM && h === 12) h = 0;
                            updateForm('weddingTime', String(h).padStart(2, '0') + ':' + (parts[1] || '00'));
                          }}
                          className="flex-1 px-3 py-3 border border-stone-200 rounded-lg text-center appearance-none bg-white"
                        >
                          <option value="">시</option>
                          {[12,1,2,3,4,5,6,7,8,9,10,11].map(h => <option key={h} value={String(h)}>{h}시</option>)}
                        </select>
                        <select
                          value={formData.weddingTime ? formData.weddingTime.split(':')[1] || '00' : ''}
                          onChange={e => {
                            const parts = formData.weddingTime ? formData.weddingTime.split(':') : ['12', '00'];
                            updateForm('weddingTime', parts[0] + ':' + e.target.value);
                          }}
                          className="flex-1 px-3 py-3 border border-stone-200 rounded-lg text-center appearance-none bg-white"
                        >
                          <option value="">분</option>
                          {['00','10','20','30','40','50'].map(m => <option key={m} value={m}>{m}분</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </Section>
                <Section title="예식장 정보">
                  <Input label="예식장명 *" value={formData.venue} onChange={v => updateForm('venue', v)} />
                  <Input label="홀 이름" value={formData.venueHall} onChange={v => updateForm('venueHall', v)} />
                  <KakaoAddressInput value={formData.venueAddress} onChange={v => updateForm('venueAddress', v)} label="주소 *" />
                  <Input label="연락처" value={formData.venuePhone} onChange={v => updateForm('venuePhone', v)} />
                </Section>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-stone-800 mb-6">계좌 정보를 입력해주세요</h2>
                <p className="text-sm text-stone-500 -mt-4 mb-6">나중에 수정할 수 있어요</p>
                <Section title="신랑 계좌">
                  <div className="space-y-3">
                    <BankSelect label="은행" value={formData.groomBank} onChange={v => updateForm('groomBank', v)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="계좌번호" value={formData.groomAccount} onChange={v => updateForm('groomAccount', v)} />
                      <Input label="예금주" value={formData.groomAccountHolder} onChange={v => updateForm('groomAccountHolder', v)} />
                    </div>
                  </div>
                </Section>
                <Section title="신부 계좌">
                  <div className="space-y-3">
                    <BankSelect label="은행" value={formData.brideBank} onChange={v => updateForm('brideBank', v)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="계좌번호" value={formData.brideAccount} onChange={v => updateForm('brideAccount', v)} />
                      <Input label="예금주" value={formData.brideAccountHolder} onChange={v => updateForm('brideAccountHolder', v)} />
                    </div>
                  </div>
                </Section>
              </div>
            )}

            {!isGiftFlow && step === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-stone-800 mb-6">패키지를 선택해주세요</h2>
                {packages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`w-full p-6 rounded-lg border-2 text-left transition-all ${
                      selectedPackageId === pkg.id ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-stone-800">{pkg.name}</h3>
                        <p className="text-sm text-stone-500">{pkg.description}</p>
                      </div>
                      <p className="text-xl font-bold text-stone-800">{pkg.price.toLocaleString()}원</p>
                    </div>
                    <ul className="mt-4 space-y-1">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="text-sm text-stone-600 flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />{f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            )}

            {((isGiftFlow && step === 4) || (!isGiftFlow && step === 5)) && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-stone-800 mb-6">{isGiftFlow ? '정보 확인' : '결제 정보 확인'}</h2>
                <div className="bg-stone-50 rounded-lg p-6 space-y-4">
                  {photoPreview && (
                    <div className="w-full h-40 rounded-lg overflow-hidden mb-2">
                      <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <button onClick={handlePreview} className="w-full py-4 mb-4 border-2 border-stone-800 rounded-xl font-medium text-stone-800 flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors">
                    <Eye className="w-5 h-5" />
                    내 청첩장 미리보기
                  </button>
                  <Row label="선택 테마" value={formData.theme ? (recommendations.find(r => r.themeId === formData.theme)?.name || formData.theme) : '-'} />
                  <Row label="신랑 · 신부" value={`${formData.groomName} · ${formData.brideName}`} />
                  <Row label="예식일" value={formData.weddingDate || '-'} />
                  <Row label="예식장" value={formData.venue || '-'} />
                  {!isGiftFlow && (
                    <>
                      <div className="border-t border-stone-200 my-2" />
                      <Row label="패키지" value={currentPackage?.name || '-'} />
                      <div className="mb-4">
                        <label className="text-sm text-stone-600 mb-2 block">쿠폰 코드</label>
                        <div className="flex gap-2">
                          <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="쿠폰 코드 입력" className="flex-1 px-4 py-2 border border-stone-200 rounded-lg text-sm" />
                          <button onClick={validateCoupon} disabled={couponLoading || !couponCode.trim()} className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm disabled:opacity-50">
                            {couponLoading ? '확인중...' : '적용'}
                          </button>
                        </div>
                        {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                        {appliedCoupon && (
                          <div className="mt-2 p-2 bg-emerald-50 rounded-lg flex justify-between items-center">
                            <span className="text-sm text-emerald-700">{appliedCoupon.name} ({appliedCoupon.discountValue}% 할인)</span>
                            <button onClick={() => setAppliedCoupon(null)} className="text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-medium text-stone-800">결제 금액</span>
                        <span className="text-2xl font-bold text-stone-800">
                          {appliedCoupon ? getDiscountedPrice().toLocaleString() : currentPackage?.price.toLocaleString()}원
                        </span>
                      </div>
                    </>
                  )}
                  {isGiftFlow && (
                    <>
                      <div className="border-t border-stone-200 my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-emerald-700">선물 패키지</span>
                        <span className="text-lg font-bold text-emerald-700">무료</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {!isLastStep && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button onClick={handleBack} className="flex-1 py-4 border border-stone-300 rounded-lg font-medium text-stone-600 hover:bg-stone-50">이전</button>
            <button onClick={handleNext} disabled={!canNext()} className="flex-1 py-4 bg-stone-800 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              다음 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isLastStep && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button onClick={handleBack} className="flex-1 py-4 border border-stone-300 rounded-lg font-medium text-stone-600 hover:bg-stone-50">이전</button>
            {isGiftFlow ? (
              <button onClick={handleCreateWedding} className="flex-1 py-4 bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-emerald-700">
                <Gift className="w-5 h-5" /> 청첩장 만들기
              </button>
            ) : user?.role === 'ADMIN' ? (
              <button onClick={handleCreateWedding} className="flex-1 py-4 bg-stone-800 text-white rounded-lg font-medium">무료로 생성하기</button>
            ) : (
              <button onClick={handlePayment} className="flex-1 py-4 bg-stone-800 text-white rounded-lg font-medium">
                {appliedCoupon ? getDiscountedPrice().toLocaleString() : currentPackage?.price.toLocaleString()}원 결제하기
              </button>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
              {paymentStatus === 'processing' && (
                <>
                  <div className="w-16 h-16 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium text-stone-800">결제 진행 중...</p>
                  <p className="text-sm text-stone-500 mt-2">잠시만 기다려주세요</p>
                </>
              )}
              {paymentStatus === 'failed' && (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-lg font-medium text-stone-800">결제 실패</p>
                  <p className="text-sm text-stone-500 mt-2">다시 시도해주세요</p>
                  <button onClick={() => { setShowPaymentModal(false); setPaymentStatus('idle'); }} className="mt-6 w-full py-3 bg-stone-800 text-white rounded-lg">닫기</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


const POPULAR_BANKS = [
  { name: 'KB국민', bg: '#FFB300', text: '#fff' },
  { name: '신한', bg: '#0046FF', text: '#fff' },
  { name: '하나', bg: '#009B8D', text: '#fff' },
  { name: '우리', bg: '#0066B3', text: '#fff' },
  { name: 'NH농협', bg: '#00AB4E', text: '#fff' },
  { name: 'IBK기업', bg: '#0066B3', text: '#fff' },
  { name: '카카오뱅크', bg: '#FEE500', text: '#3A1D1D' },
  { name: '토스뱅크', bg: '#0064FF', text: '#fff' },
  { name: 'SC제일', bg: '#009A44', text: '#fff' },
  { name: '새마을', bg: '#0066CC', text: '#fff' },
  { name: '우체국', bg: '#EF4123', text: '#fff' },
  { name: '수협', bg: '#0072CE', text: '#fff' },
];

function BankSelect({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm text-stone-600 mb-1.5">{label}</label>
      <style>{'.bank-scroll::-webkit-scrollbar{display:none}'}</style>
      <div className="bank-scroll flex gap-1.5 mb-2 overflow-x-auto pb-0.5" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {POPULAR_BANKS.map(b => {
          const selected = value === b.name;
          return (
            <button
              key={b.name}
              type="button"
              onClick={() => onChange(b.name)}
              className="shrink-0 transition-all"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                background: selected ? b.bg : '#f5f5f4',
                color: selected ? b.text : '#78716c',
                border: selected ? `1.5px solid ${b.bg}` : '1.5px solid transparent',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: selected ? b.text : b.bg, flexShrink: 0 }} />
              {b.name}
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="기타 은행 직접 입력"
        className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300 text-sm"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5">
      <h3 className="font-medium text-stone-800 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm text-stone-600 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-stone-600">{label}</span>
      <span className="font-semibold text-stone-800">{value}</span>
    </div>
  );
}
