import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Send, MessageCircle } from 'lucide-react';

declare global {
  interface Window {
    Kakao?: any;
  }
}

interface Package {
  id: string;
  name: string;
  price: number;
  description: string;
}

export default function GiftSend() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [toEmail, setToEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ code: string } | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/payment/packages`);
      if (res.ok) {
        const data = await res.json();
        setPackages(data.filter((p: Package) => p.price > 0));
      }
    } catch (e) {
      console.error('Failed to fetch packages:', e);
    }
  };

  const handleSend = async () => {
    if (!selectedPkg) return;

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = `${import.meta.env.VITE_API_URL}/oauth/kakao`;
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/gift/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          packageId: selectedPkg,
          toEmail: toEmail || undefined,
          message: message || undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess({ code: data.code });
      }
    } catch (e) {
      console.error('Gift send error:', e);
    } finally {
      setLoading(false);
    }
  };

  const shareKakao = () => {
    if (!success || !window.Kakao) return;

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '🎁 청첩장 선물이 도착했어요!',
        description: message || '소중한 분을 위한 청첩장 선물입니다',
        imageUrl: 'https://weddingshop.cloud/gift-card.png',
        link: {
          mobileWebUrl: `https://weddingshop.cloud/gift/redeem?code=${success.code}`,
          webUrl: `https://weddingshop.cloud/gift/redeem?code=${success.code}`
        }
      },
      buttons: [
        {
          title: '선물 받기',
          link: {
            mobileWebUrl: `https://weddingshop.cloud/gift/redeem?code=${success.code}`,
            webUrl: `https://weddingshop.cloud/gift/redeem?code=${success.code}`
          }
        }
      ]
    });
  };

  const copyCode = () => {
    if (success) {
      navigator.clipboard.writeText(success.code);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl"
        >
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-stone-800" />
          </div>
          <h1 className="text-2xl font-medium text-stone-800 mb-2">선물 준비 완료!</h1>
          <p className="text-stone-500 mb-6">아래 방법으로 선물을 전달해주세요</p>

          <div className="bg-stone-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-stone-400 mb-1">선물 코드</p>
            <p className="text-xl font-mono font-bold tracking-widest">{success.code}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={shareKakao}
              className="py-3 bg-[#FEE500] text-stone-800 rounded-xl flex items-center justify-center gap-2 text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              카카오톡 공유
            </button>
            <button
              onClick={copyCode}
              className="py-3 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium"
            >
              코드 복사
            </button>
          </div>

          <p className="text-xs text-stone-400">
            코드는 90일간 유효합니다
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Gift className="w-8 h-8 text-stone-800" />
          </div>
          <h1 className="text-2xl font-medium text-stone-800 mb-2">청첩장 선물하기</h1>
          <p className="text-stone-500">소중한 분에게 청첩장을 선물하세요</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <p className="text-sm font-medium text-stone-700 mb-3">패키지 선택</p>
          <div className="space-y-2">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPkg === pkg.id
                    ? 'border-stone-800 bg-stone-50'
                    : 'border-stone-200 hover:border-stone-300'
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

        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <p className="text-sm font-medium text-stone-700 mb-3">받는 분 이메일 (선택)</p>
          <input
            type="email"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
          <p className="text-xs text-stone-400 mt-2">입력하시면 이메일로도 선물 코드가 전송됩니다</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <p className="text-sm font-medium text-stone-700 mb-3">메시지 (선택)</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="축하 메시지를 적어주세요"
            className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!selectedPkg || loading}
          className="w-full py-4 bg-stone-500 text-white rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              선물하기
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
