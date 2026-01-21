import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Send, Check, Package, Mail, Phone, RotateCcw } from 'lucide-react';

declare global {
  interface Window {
    Kakao?: any;
  }
}

interface PackageOption {
  id: string;
  name: string;
  price: number;
}

interface GiftHistory {
  id: string;
  code: string;
  toEmail: string | null;
  toPhone: string | null;
  package: { name: string };
  isRedeemed: boolean;
  createdAt: string;
}

export default function AdminGift() {
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPkg, setSelectedPkg] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ code: string; sentVia: string[] } | null>(null);
  const [history, setHistory] = useState<GiftHistory[]>([]);

  useEffect(() => {
    fetchPackages();
    fetchHistory();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/payment/packages`);
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
        if (data.length > 0) setSelectedPkg(data[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch packages:', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/gifts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Failed to fetch gift history:', e);
    }
  };

  const handleSend = async () => {
    if ((!email && !phone) || !selectedPkg) {
      alert('이메일 또는 전화번호를 입력해주세요');
      return;
    }

    setLoading(true);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/gift/free`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: email || undefined,
          phone: phone || undefined,
          packageId: selectedPkg,
          message: message || undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess({ code: data.code, sentVia: data.sentVia || [] });
        setEmail('');
        setPhone('');
        setMessage('');
        fetchHistory();
      } else {
        alert(data.error || '발송 실패');
      }
    } catch (e) {
      console.error('Gift send error:', e);
      alert('발송 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (giftId: string, type: 'email' | 'kakao') => {
    setResending(`${giftId}-${type}`);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/gift/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ giftId, type })
      });

      if (res.ok) {
        alert(`${type === 'email' ? '이메일' : '카카오톡'} 재발송 완료!`);
      } else {
        const data = await res.json();
        alert(data.error || '재발송 실패');
      }
    } catch (e) {
      console.error('Resend error:', e);
      alert('재발송 중 오류가 발생했습니다');
    } finally {
      setResending(null);
    }
  };

  const shareKakao = (code: string) => {
    if (!window.Kakao) return;
    
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: "🎁 청첩장 선물이 도착했어요!",
        description: message || "청첩장 작업실에서 드리는 선물입니다",
        imageUrl: "https://weddingshop.cloud/og-image.png",
        link: {
          mobileWebUrl: `https://weddingshop.cloud/gift/redeem?code=${code}`,
          webUrl: `https://weddingshop.cloud/gift/redeem?code=${code}`
        }
      },
      buttons: [
        {
          title: "선물 받기",
          link: {
            mobileWebUrl: `https://weddingshop.cloud/gift/redeem?code=${code}`,
            webUrl: `https://weddingshop.cloud/gift/redeem?code=${code}`
          }
        }
      ]
    });
  };

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-800">무료 선물 부여</h1>
        <p className="text-stone-500 mt-1 text-sm sm:text-base">고객에게 무료로 패키지를 선물합니다</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Gift className="w-5 h-5 text-pink-500" />
            <h2 className="font-medium text-stone-800">새 선물 보내기</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                받는 분 이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                받는 분 전화번호
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
              <p className="text-xs text-stone-400 mt-1">* 전화번호 입력 시 카카오톡 알림 발송</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                패키지 선택 *
              </label>
              <select
                value={selectedPkg}
                onChange={(e) => setSelectedPkg(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800 bg-white"
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.price.toLocaleString()}원)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                메시지 (선택)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="청첩장 작업실에서 드리는 선물입니다!"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">선물 발송 완료!</span>
                </div>
                <p className="text-sm text-green-600 mb-1">
                  코드: <span className="font-mono font-bold">{success.code}</span>
                </p>
                {success.sentVia.length > 0 && (
                  <p className="text-xs text-green-500 mb-3">
                    발송: {success.sentVia.join(', ')}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => shareKakao(success.code)}
                    className="flex-1 py-2 bg-[#FEE500] text-stone-800 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                  >
                    카카오톡 공유
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(success.code)}
                    className="flex-1 py-2 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium"
                  >
                    코드 복사
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={loading || (!email && !phone) || !selectedPkg}
              className="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  무료 선물 보내기
                </>
              )}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-stone-500" />
            <h2 className="font-medium text-stone-800">발송 내역</h2>
          </div>

          {history.length === 0 ? (
            <p className="text-stone-400 text-center py-8">아직 발송 내역이 없습니다</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {history.map((gift) => (
                <div
                  key={gift.id}
                  className="p-3 bg-stone-50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex flex-col">
                      {gift.toEmail && (
                        <span className="text-sm text-stone-700 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {gift.toEmail}
                        </span>
                      )}
                      {gift.toPhone && (
                        <span className="text-sm text-stone-700 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {gift.toPhone}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      gift.isRedeemed 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {gift.isRedeemed ? '사용됨' : '미사용'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{gift.package.name}</span>
                    <span>{new Date(gift.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <p className="text-xs font-mono text-stone-400 mt-1">{gift.code}</p>
                  
                  {!gift.isRedeemed && (
                    <div className="flex gap-2 mt-2">
                      {gift.toEmail && (
                        <button
                          onClick={() => handleResend(gift.id, 'email')}
                          disabled={resending === `${gift.id}-email`}
                          className="flex-1 py-1.5 text-xs bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <RotateCcw className={`w-3 h-3 ${resending === `${gift.id}-email` ? 'animate-spin' : ''}`} />
                          이메일 재발송
                        </button>
                      )}
                      {gift.toPhone && (
                        <button
                          onClick={() => handleResend(gift.id, 'kakao')}
                          disabled={resending === `${gift.id}-kakao`}
                          className="flex-1 py-1.5 text-xs bg-[#FEE500] text-stone-700 rounded-lg hover:bg-[#FDD800] transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <RotateCcw className={`w-3 h-3 ${resending === `${gift.id}-kakao` ? 'animate-spin' : ''}`} />
                          카톡 재발송
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
