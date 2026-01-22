import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, X, Gift } from 'lucide-react';

const THEMES = [
  { id: 'ROMANTIC_CLASSIC', name: '로맨틱 클래식', desc: '우아하고 클래식한 분위기', color: 'from-stone-100 to-stone-200' },
  { id: 'MODERN_MINIMAL', name: '모던 미니멀', desc: '깔끔하고 세련된 디자인', color: 'from-stone-100 to-gray-100' },
  { id: 'BOHEMIAN_DREAM', name: '보헤미안 드림', desc: '자유롭고 낭만적인 감성', color: 'from-amber-100 to-orange-100' },
  { id: 'LUXURY_GOLD', name: '럭셔리 골드', desc: '고급스러운 골드 테마', color: 'from-yellow-100 to-amber-100' },
  { id: 'POETIC_LOVE', name: '포에틱 러브', desc: '시집 느낌의 문학적 감성', color: 'from-purple-100 to-violet-50' },
  { id: 'SENIOR_SIMPLE', name: '어르신용 심플', desc: '큰 글씨, 심플한 구성', color: 'from-blue-50 to-sky-100' },
  { id: 'FOREST_GARDEN', name: '포레스트 가든', desc: '자연 속 싱그러운 느낌', color: 'from-green-100 to-emerald-100' },
  { id: 'OCEAN_BREEZE', name: '오션 브리즈', desc: '시원한 바다 느낌', color: 'from-cyan-100 to-blue-100' },
  { id: 'GLASS_BUBBLE', name: '글라스 버블', desc: '투명하고 몽환적인 감성', color: 'from-violet-100 to-purple-100' },
  { id: 'SPRING_BREEZE', name: '봄바람', desc: '따뜻하고 포근한 봄 느낌', color: 'from-pink-100 to-rose-100' },
  { id: 'GALLERY_MIRIM_1', name: 'Gallery 美林-1', desc: '따뜻한 세피아 종이 질감', color: 'from-amber-50 to-yellow-100' },
  { id: 'GALLERY_MIRIM_2', name: 'Gallery 美林-2', desc: '청량한 다크 필름 톤', color: 'from-slate-200 to-zinc-300' },
  { id: 'LUNA_HALFMOON', name: 'Luna Halfmoon', desc: '순백의 고요한 물결', color: 'from-slate-50 to-blue-50' },
  { id: 'PEARL_DRIFT', name: 'Pearl Drift', desc: '심해 속 떠다니는 진주', color: 'from-gray-900 to-slate-800' },
];

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

const STEPS_WITH_PAYMENT = ['패키지 선택', '테마 선택', '기본 정보', '예식 정보', '계좌 정보', '결제'];
const STEPS_WITHOUT_PAYMENT = ['테마 선택', '기본 정보', '예식 정보', '계좌 정보', '확인'];

declare global {
  interface Window {
    TossPayments?: any;
  }
}

export default function CreateWedding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [availableOrder, setAvailableOrder] = useState<AvailableOrder | null>(null);
  const [giftId, setGiftId] = useState<string | null>(null);
  const [checkingOrder, setCheckingOrder] = useState(true);
  
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  
  const [formData, setFormData] = useState({
    theme: 'ROMANTIC_CLASSIC',
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
    greetingTitle: '저희 결혼합니다',
    greeting: '서로 다른 두 사람이 만나\n사랑으로 하나가 되려 합니다.\n\n저희의 새로운 시작을\n함께 축복해 주세요.',
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

  const STEPS = availableOrder ? STEPS_WITHOUT_PAYMENT : STEPS_WITH_PAYMENT;
  const isGiftFlow = !!availableOrder;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    fetchPackages();
    checkAvailableOrder();
    loadTossScript();
  }, []);

  const loadTossScript = () => {
    if (document.querySelector('script[src*="tosspayments"]')) return;
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.async = true;
    document.head.appendChild(script);
  };

  const checkAvailableOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCheckingOrder(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/payment/available-order`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.availableOrder) {
          setAvailableOrder(data.availableOrder);
          setSelectedPackageId(data.availableOrder.package.id);
          if (data.type === 'gift' && data.giftId) {
            setGiftId(data.giftId);
          }
        }
      }
    } catch (e) {
      console.error('Failed to check available order:', e);
    } finally {
      setCheckingOrder(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/payment/packages`);
      const data = await res.json();
      setPackages(data);
      if (data.length > 0 && !selectedPackageId) setSelectedPackageId(data[0].id);
    } catch (e) {
      console.error('Failed to fetch packages:', e);
    }
  };

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const currentPackage = availableOrder?.package || packages.find(p => p.id === selectedPackageId);

  const handleCreateWedding = async () => {
    try {
      const token = localStorage.getItem('token');
      const body: any = { ...formData };
      
      if (giftId) {
        body.giftId = giftId;
      } else if (availableOrder) {
        body.orderId = availableOrder.id;
      }
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/weddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        const wedding = await res.json();
        navigate(`/edit/${wedding.id}`);
      } else {
        const err = await res.json();
        alert(err.error || '청첩장 생성에 실패했습니다');
      }
    } catch (error) {
      console.error('Create error:', error);
      alert('청첩장 생성에 실패했습니다');
    }
  };

  const handleAdminCreate = async () => {
    await handleCreateWedding();
  };

  const handlePayment = async () => {
    setShowPaymentModal(true);
    setPaymentStatus('processing');
    
    try {
      const token = localStorage.getItem('token');
      
      const orderRes = await fetch(`${import.meta.env.VITE_API_URL}/payment/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId: selectedPackageId }),
      });
      
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || '주문 생성 실패');
      }
      
      const { order, clientKey } = await orderRes.json();
      
      if (!window.TossPayments) {
        throw new Error('결제 모듈 로딩 실패');
      }
      
      const tossPayments = window.TossPayments(clientKey);
      const weddingDataParam = encodeURIComponent(JSON.stringify(formData));
      
      await tossPayments.requestPayment('카드', {
        amount: order.amount,
        orderId: order.orderId,
        orderName: order.package.name,
        customerName: user?.name || '고객',
        successUrl: `${window.location.origin}/payment/success?weddingData=${weddingDataParam}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
      
    } catch (error: any) {
      console.error('Payment error:', error);
      if (error.code === 'USER_CANCEL' || error.message?.includes('취소')) {
        setPaymentStatus('idle');
        setShowPaymentModal(false);
      } else {
        setPaymentStatus('failed');
      }
    }
  };

  const canNext = () => {
    if (isGiftFlow) {
      switch (step) {
        case 0: return !!formData.theme;
        case 1: return !!formData.groomName && !!formData.brideName;
        case 2: return !!formData.weddingDate && !!formData.weddingTime && !!formData.venue && !!formData.venueAddress;
        case 3: return true;
        default: return true;
      }
    } else {
      switch (step) {
        case 0: return !!selectedPackageId;
        case 1: return !!formData.theme;
        case 2: return !!formData.groomName && !!formData.brideName;
        case 3: return !!formData.weddingDate && !!formData.weddingTime && !!formData.venue && !!formData.venueAddress;
        case 4: return true;
        default: return true;
      }
    }
  };

  const handleNext = () => { if (step < STEPS.length - 1) setStep(step + 1); };
  const handleBack = () => { if (step > 0) setStep(step - 1); else navigate('/dashboard'); };

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
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-2 text-stone-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-serif text-lg text-stone-800">청첩장 만들기</span>
          <div className="w-10" />
        </div>
      </header>

      {isGiftFlow && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-emerald-800">선물받은 패키지로 제작</p>
              <p className="text-sm text-emerald-600">{currentPackage?.name} · 결제 없이 바로 제작</p>
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
                <div className={`w-6 sm:w-12 h-0.5 mx-1 ${i < step ? 'bg-stone-800' : 'bg-stone-200'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-stone-600 mt-2">{STEPS[step]}</p>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {!isGiftFlow && step === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-serif text-stone-800 mb-6">패키지를 선택해주세요</h2>
                {packages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
                      selectedPackageId === pkg.id ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-stone-800">{pkg.name}</h3>
                        <p className="text-sm text-stone-500">{pkg.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-stone-800">{pkg.price.toLocaleString()}원</p>
                        {pkg.slug === 'basic-video' && <span className="text-xs text-rose-500 font-medium">런칭특가</span>}
                      </div>
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

            {((isGiftFlow && step === 0) || (!isGiftFlow && step === 1)) && (
              <div className="space-y-4">
                <h2 className="text-xl font-serif text-stone-800 mb-6">테마를 선택해주세요</h2>
                <div className="grid grid-cols-2 gap-4">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => updateForm('theme', theme.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        formData.theme === theme.id ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className={`w-full h-20 rounded-xl bg-gradient-to-br ${theme.color} mb-3`} />
                      <h3 className="font-medium text-stone-800">{theme.name}</h3>
                      <p className="text-xs text-stone-500 mt-1">{theme.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {((isGiftFlow && step === 1) || (!isGiftFlow && step === 2)) && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif text-stone-800 mb-6">기본 정보를 입력해주세요</h2>
                <Section title="신랑 정보">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="이름 *" value={formData.groomName} onChange={v => updateForm('groomName', v)} />
                    <Input label="영문 이름" value={formData.groomNameEn} onChange={v => updateForm('groomNameEn', v)} />
                  </div>
                  <Input label="연락처" value={formData.groomPhone} onChange={v => updateForm('groomPhone', v)} placeholder="010-0000-0000" />
                </Section>
                <Section title="신부 정보">
                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-2 gap-4">
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
                  <Input label="제목" value={formData.greetingTitle} onChange={v => updateForm('greetingTitle', v)} />
                  <textarea value={formData.greeting} onChange={e => updateForm('greeting', e.target.value)} rows={4} className="w-full mt-3 px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                </Section>
              </div>
            )}

            {((isGiftFlow && step === 2) || (!isGiftFlow && step === 3)) && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif text-stone-800 mb-6">예식 정보를 입력해주세요</h2>
                <Section title="예식 일시">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-stone-600 mb-2">날짜 *</label>
                      <input type="date" value={formData.weddingDate} onChange={e => updateForm('weddingDate', e.target.value)} className="w-full px-4 py-3 border border-stone-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-600 mb-2">시간 *</label>
                      <input type="time" value={formData.weddingTime} onChange={e => updateForm('weddingTime', e.target.value)} className="w-full px-4 py-3 border border-stone-200 rounded-xl" />
                    </div>
                  </div>
                </Section>
                <Section title="예식장 정보">
                  <Input label="예식장명 *" value={formData.venue} onChange={v => updateForm('venue', v)} />
                  <Input label="홀 이름" value={formData.venueHall} onChange={v => updateForm('venueHall', v)} />
                  <Input label="주소 *" value={formData.venueAddress} onChange={v => updateForm('venueAddress', v)} />
                  <Input label="연락처" value={formData.venuePhone} onChange={v => updateForm('venuePhone', v)} />
                </Section>
              </div>
            )}

            {((isGiftFlow && step === 3) || (!isGiftFlow && step === 4)) && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif text-stone-800 mb-6">계좌 정보를 입력해주세요</h2>
                <p className="text-sm text-stone-500 -mt-4 mb-6">* 나중에 수정할 수 있어요</p>
                <Section title="신랑 계좌">
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="은행" value={formData.groomBank} onChange={v => updateForm('groomBank', v)} />
                    <Input label="계좌번호" value={formData.groomAccount} onChange={v => updateForm('groomAccount', v)} />
                    <Input label="예금주" value={formData.groomAccountHolder} onChange={v => updateForm('groomAccountHolder', v)} />
                  </div>
                </Section>
                <Section title="신부 계좌">
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="은행" value={formData.brideBank} onChange={v => updateForm('brideBank', v)} />
                    <Input label="계좌번호" value={formData.brideAccount} onChange={v => updateForm('brideAccount', v)} />
                    <Input label="예금주" value={formData.brideAccountHolder} onChange={v => updateForm('brideAccountHolder', v)} />
                  </div>
                </Section>
              </div>
            )}

            {((isGiftFlow && step === 4) || (!isGiftFlow && step === 5)) && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif text-stone-800 mb-6">{isGiftFlow ? '정보 확인' : '결제 정보 확인'}</h2>
                <div className="bg-stone-50 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-stone-600">선택 패키지</span>
                    <span className="font-semibold text-stone-800">{currentPackage?.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-stone-600">신랑 · 신부</span>
                    <span className="font-semibold text-stone-800">{formData.groomName} · {formData.brideName}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-stone-600">예식일</span>
                    <span className="font-semibold text-stone-800">{formData.weddingDate}</span>
                  </div>
                  {!isGiftFlow && (
                    <>
                      <div className="border-t border-stone-200 my-4" />
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-stone-800">결제 금액</span>
                        <span className="text-2xl font-bold text-stone-800">{currentPackage?.price.toLocaleString()}원</span>
                      </div>
                    </>
                  )}
                  {isGiftFlow && (
                    <>
                      <div className="border-t border-stone-200 my-4" />
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-emerald-700">🎁 선물 패키지</span>
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
            <button onClick={handleBack} className="flex-1 py-4 border border-stone-300 rounded-xl font-medium text-stone-600 hover:bg-stone-50">이전</button>
            <button onClick={handleNext} disabled={!canNext()} className="flex-1 py-4 bg-stone-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              다음 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isLastStep && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button onClick={handleBack} className="flex-1 py-4 border border-stone-300 rounded-xl font-medium text-stone-600 hover:bg-stone-50">이전</button>
            {isGiftFlow ? (
              <button onClick={handleCreateWedding} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-emerald-700">
                <Gift className="w-5 h-5" />
                청첩장 만들기
              </button>
            ) : user?.role === 'ADMIN' ? (
              <button onClick={handleAdminCreate} className="flex-1 py-4 bg-stone-800 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                무료로 생성하기
              </button>
            ) : (
              <button onClick={handlePayment} className="flex-1 py-4 bg-stone-800 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                {currentPackage?.price.toLocaleString()}원 결제하기
              </button>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl p-6 max-w-sm w-full">
              {paymentStatus === 'processing' && (
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium text-stone-800">결제 진행 중...</p>
                  <p className="text-sm text-stone-500 mt-2">잠시만 기다려주세요</p>
                </div>
              )}
              {paymentStatus === 'failed' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-lg font-medium text-stone-800">결제 실패</p>
                  <p className="text-sm text-stone-500 mt-2">다시 시도해주세요</p>
                  <button onClick={() => { setShowPaymentModal(false); setPaymentStatus('idle'); }} className="mt-6 w-full py-3 bg-stone-800 text-white rounded-xl">닫기</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <h3 className="font-medium text-stone-800 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm text-stone-600 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300" />
    </div>
  );
}
