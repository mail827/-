import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Send, Check, ArrowLeft, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

declare global {
  interface Window {
    Kakao?: any;
    TossPayments?: any;
  }
}

interface PackageOption {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface GiftItem {
  id: string;
  code: string;
  toEmail?: string;
  toPhone?: string;
  package: { name: string };
  isRedeemed: boolean;
  redeemedAt?: string;
  createdAt: string;
}

export default function MyGifts() {
  const [searchParams] = useSearchParams();
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [selectedPkg, setSelectedPkg] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [toPhone, setToPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [sent, setSent] = useState<GiftItem[]>([]);
  const [received, setReceived] = useState<GiftItem[]>([]);
  const [tab, setTab] = useState<'send' | 'sent' | 'received'>('send');

  useEffect(() => {
    fetchPackages();
    fetchMyGifts();
    loadTossScript();
    handlePaymentResult();
  }, []);

  const loadTossScript = () => {
    if (document.querySelector('script[src*="tosspayments"]')) return;
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.async = true;
    document.head.appendChild(script);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToPhone(formatPhone(e.target.value));
  };

  const handlePaymentResult = async () => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const packageId = searchParams.get('packageId');
    const giftToEmail = searchParams.get('toEmail');
    const giftToPhone = searchParams.get('toPhone');
    const giftMessage = searchParams.get('message');

    if (paymentKey && orderId && amount && packageId) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const confirmRes = await fetch(`${import.meta.env.VITE_API_URL}/gift/payment/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            packageId,
            toEmail: giftToEmail || undefined,
            toPhone: giftToPhone || undefined,
            message: giftMessage ? decodeURIComponent(giftMessage) : undefined
          })
        });

        const confirmData = await confirmRes.json();

        if (confirmRes.ok) {
          setSuccess(confirmData.code);
          fetchMyGifts();
          window.history.replaceState({}, '', '/my/gifts');
        } else {
          alert(confirmData.error || '결제 승인 실패');
        }
      } catch (e) {
        alert('결제 승인 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/payment/packages`);
      if (res.ok) {
        const data = await res.json();
        const paidPackages = data.filter((p: PackageOption) => p.price > 0);
        setPackages(paidPackages);
        if (paidPackages.length > 0) setSelectedPkg(paidPackages[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch packages:', e);
    }
  };

  const fetchMyGifts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/gift/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSent(data.sent);
        setReceived(data.received);
      }
    } catch (e) {
      console.error('Failed to fetch gifts:', e);
    }
  };

  const handleSend = async () => {
    if (!selectedPkg) return;

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = `${import.meta.env.VITE_API_URL}/oauth/kakao`;
      return;
    }

    if (!window.TossPayments) {
      alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/gift/payment/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          packageId: selectedPkg,
          toEmail: toEmail || undefined,
          toPhone: toPhone.replace(/-/g, '') || undefined,
          message: message || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '결제 요청 실패');
        setLoading(false);
        return;
      }

      const tossPayments = window.TossPayments(data.clientKey);
      
      let successUrl = `${window.location.origin}/my/gifts?packageId=${selectedPkg}`;
      if (toEmail) successUrl += `&toEmail=${encodeURIComponent(toEmail)}`;
      if (toPhone) successUrl += `&toPhone=${encodeURIComponent(toPhone.replace(/-/g, ''))}`;
      if (message) successUrl += `&message=${encodeURIComponent(message)}`;

      await tossPayments.requestPayment('카드', {
        amount: data.amount,
        orderId: data.orderId,
        orderName: data.orderName,
        successUrl,
        failUrl: `${window.location.origin}/my/gifts`,
      });

    } catch (e: any) {
      console.error('Gift send error:', e);
      if (!e.message?.includes('취소')) {
        alert('결제 중 오류가 발생했습니다');
      }
      setLoading(false);
    }
  };

  const shareKakao = (code: string) => {
    if (!window.Kakao) return;

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '🎁 청첩장 선물이 도착했어요!',
        description: message || '소중한 분을 위한 청첩장 선물입니다',
        imageUrl: 'https://weddingshop.cloud/og-image.png',
        link: {
          mobileWebUrl: `https://weddingshop.cloud/gift/redeem?code=${code}`,
          webUrl: `https://weddingshop.cloud/gift/redeem?code=${code}`
        }
      },
      buttons: [
        {
          title: '선물 받기',
          link: {
            mobileWebUrl: `https://weddingshop.cloud/gift/redeem?code=${code}`,
            webUrl: `https://weddingshop.cloud/gift/redeem?code=${code}`
          }
        }
      ]
    });
  };

  const selectedPackage = packages.find(p => p.id === selectedPkg);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/my" className="text-stone-500 hover:text-stone-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-medium text-stone-800">청첩장 선물하기</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {[
            { key: 'send', label: '선물하기' },
            { key: 'sent', label: '보낸 선물' },
            { key: 'received', label: '받은 선물' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-stone-800 text-white'
                  : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'send' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-stone-600" />
                <span className="font-medium text-stone-800">패키지 선택</span>
              </div>
              <div className="space-y-2">
                {packages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPkg === pkg.id
                        ? 'border-stone-800 bg-stone-50'
                        : 'border-stone-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-stone-800">{pkg.name}</span>
                      <span className="text-stone-800 font-bold">{pkg.price.toLocaleString()}원</span>
                    </div>
                    <p className="text-sm text-stone-500 mt-1">{pkg.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <label className="block text-sm font-medium text-stone-700 mb-3">
                받는 분 연락처 (선택)
              </label>
              <p className="text-xs text-stone-400 mb-4">입력하시면 선물 코드가 자동 발송됩니다</p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">이메일</label>
                  <input
                    type="email"
                    value={toEmail}
                    onChange={e => setToEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">휴대폰 (카카오 알림톡)</label>
                  <input
                    type="tel"
                    value={toPhone}
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                메시지 (선택)
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="축하 메시지를 적어주세요"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-stone-500"
              />
            </div>

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 text-green-700 mb-3">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">선물 준비 완료!</span>
                </div>
                <div className="bg-white rounded-lg p-3 mb-4 text-center">
                  <p className="text-xs text-stone-400 mb-1">선물 코드</p>
                  <p className="text-xl font-mono font-bold tracking-widest">{success}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => shareKakao(success)}
                    className="py-3 bg-[#FEE500] text-stone-800 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    카카오톡 공유
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(success)}
                    className="py-3 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium"
                  >
                    코드 복사
                  </button>
                </div>
                <p className="text-xs text-stone-400 text-center mt-3">코드는 90일간 유효합니다</p>
              </motion.div>
            )}

            <button
              onClick={handleSend}
              disabled={loading || !selectedPkg}
              className="w-full py-4 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {selectedPackage?.price.toLocaleString()}원 결제하고 선물하기
                </>
              )}
            </button>
          </motion.div>
        )}

        {tab === 'sent' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {sent.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                아직 보낸 선물이 없습니다
              </div>
            ) : (
              sent.map(gift => (
                <div key={gift.id} className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-stone-800">{gift.package.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      gift.isRedeemed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {gift.isRedeemed ? '사용됨' : '미사용'}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 mb-1">
                    {gift.toEmail || gift.toPhone || '직접 전달'}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-stone-400">{gift.code}</p>
                    <p className="text-xs text-stone-400">
                      {new Date(gift.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  {!gift.isRedeemed && (
                    <button
                      onClick={() => shareKakao(gift.code)}
                      className="w-full mt-3 py-2 bg-[#FEE500] text-stone-800 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      카카오톡으로 다시 보내기
                    </button>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {tab === 'received' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {received.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                아직 받은 선물이 없습니다
              </div>
            ) : (
              received.map(gift => (
                <div key={gift.id} className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-stone-800">{gift.package.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${gift.isRedeemed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {gift.isRedeemed ? "사용완료" : "미사용"}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    {gift.isRedeemed && gift.redeemedAt ? `${new Date(gift.redeemedAt).toLocaleDateString("ko-KR")}에 사용` : `${new Date(gift.createdAt).toLocaleDateString("ko-KR")}에 받음`}
                  </p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
