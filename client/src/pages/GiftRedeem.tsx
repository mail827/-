import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Check, Sparkles, AlertCircle, Wand2, PenTool } from 'lucide-react';

export default function GiftRedeem() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ packageName: string } | null>(null);
  const [autoRedeemTriggered, setAutoRedeemTriggered] = useState(false);

  useEffect(() => {
    if (code && code.startsWith('SNAP-')) {
      navigate('/ai-snap/redeem?code=' + code, { replace: true });
    }
  }, [code, navigate]);

  const handleRedeem = useCallback(async (giftCode: string) => {
    if (!giftCode.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('pendingGiftCode', giftCode);
      localStorage.setItem('redirectAfterLogin', '/gift/redeem');
      window.location.href = `${import.meta.env.VITE_API_URL}/oauth/kakao`;
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/gift/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: giftCode.trim().toUpperCase() })
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.setItem('pendingGiftCode', giftCode);
        localStorage.setItem('redirectAfterLogin', '/gift/redeem');
        window.location.href = `${import.meta.env.VITE_API_URL}/oauth/kakao`;
        return;
      }

      if (!res.ok) {
        setError(data.error || '선물 사용에 실패했습니다');
      } else {
        setSuccess({ packageName: data.packageName });
      }
    } catch (e) {
      console.error('Gift redeem error:', e);
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const pendingCode = localStorage.getItem('pendingGiftCode');
    const token = localStorage.getItem('token');

    if (pendingCode && token && !autoRedeemTriggered) {
      setCode(pendingCode);
      localStorage.removeItem('pendingGiftCode');
      localStorage.removeItem('redirectAfterLogin');
      setAutoRedeemTriggered(true);
      setTimeout(() => handleRedeem(pendingCode), 500);
    }
  }, [handleRedeem, autoRedeemTriggered]);

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-medium text-stone-800 mb-2">선물 사용 완료!</h1>
          <p className="text-stone-500 mb-8">
            <span className="font-semibold text-stone-800">{success.packageName}</span> 패키지가<br />
            계정에 추가되었습니다
          </p>

          <p className="text-sm text-stone-400 mb-4">어떤 방식으로 청첩장을 만드시겠어요?</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/ai-create')}
              className="relative group p-5 rounded-xl border-2 border-stone-200 hover:border-stone-800 transition-all duration-200 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-stone-900 flex items-center justify-center mb-3">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-stone-800 mb-1">AI 자동 제작</p>
              <p className="text-[11px] text-stone-400 leading-snug">사진 한 장이면 끝,<br/>AI가 알아서 완성</p>
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-medium text-white bg-stone-800 px-1.5 py-0.5 rounded">NEW</span>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/create')}
              className="group p-5 rounded-xl border-2 border-stone-200 hover:border-stone-400 transition-all duration-200 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center mb-3">
                <PenTool className="w-5 h-5 text-stone-600" />
              </div>
              <p className="text-sm font-semibold text-stone-800 mb-1">직접 만들기</p>
              <p className="text-[11px] text-stone-400 leading-snug">테마 선택부터<br/>하나하나 직접 설정</p>
            </motion.button>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 text-stone-400 hover:text-stone-600 transition-colors text-sm"
          >
            나중에 만들기
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-stone-100 to-stone-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-10 h-10 text-stone-700" />
          </div>
          <h1 className="text-2xl font-medium text-stone-800 mb-2">선물 받기</h1>
          <p className="text-stone-500">선물 코드를 입력해주세요</p>
        </div>

        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="GIFT-XXXXXXXX"
          className="w-full px-4 py-4 border border-stone-200 rounded-xl text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent mb-4"
          disabled={loading}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </motion.div>
        )}

        <button
          onClick={() => handleRedeem(code)}
          disabled={loading || !code.trim()}
          className="w-full py-4 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              선물 사용하기
            </>
          )}
        </button>

        {!localStorage.getItem('token') && (
          <p className="text-sm text-stone-400 text-center mt-4">
            로그인이 필요합니다. 버튼을 누르면 로그인 후 자동으로 선물이 사용됩니다.
          </p>
        )}

        <div className="mt-6 pt-6 border-t border-stone-100">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 text-stone-500 hover:text-stone-700 transition-colors text-sm"
          >
            ← 홈으로 돌아가기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
