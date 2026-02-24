import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Loader2, X, Copy } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function AiSnapGiftCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    confirmPayment();
  }, []);

  const confirmPayment = async () => {
    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amount = params.get('amount');
    const tier = params.get('tier');
    const toPhone = params.get('toPhone');
    const toEmail = params.get('toEmail');
    const message = params.get('message');

    if (!paymentKey || !orderId || !amount || !tier) {
      setErrorMsg('결제 정보가 올바르지 않아요');
      setStatus('error');
      return;
    }

    try {
      const res = await fetch(`${API}/snap-gift/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount),
          tier,
          toEmail: toEmail || undefined,
          toPhone: toPhone || undefined,
          message: message || undefined,
        }),
      });
      const data = await res.json();
      if (data.code) {
        setCode(data.code);
        setStatus('success');
      } else {
        setErrorMsg(data.error || '결제 확인 실패');
        setStatus('error');
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했어요');
      setStatus('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-stone-200 sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <a href="/" className="font-serif text-xl text-stone-800">청첩장 작업실</a>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-16">
        {status === 'loading' && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 text-stone-400 animate-spin mx-auto mb-4" />
            <p className="text-sm text-stone-500">결제를 확인하고 있어요...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-stone-800 mb-2">선물 전송 완료!</h2>
              <p className="text-sm text-stone-500">
                {params.get('toPhone') ? '문자로' : '이메일로'} 선물 코드가 전송됐어요
              </p>
            </div>

            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5">
              <p className="text-xs text-stone-400 mb-2">선물 코드</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-mono font-bold tracking-wider text-stone-800">{code}</span>
                <button onClick={handleCopy}
                  className="p-2 rounded-lg bg-stone-200 hover:bg-stone-300 transition-all">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-stone-600" />}
                </button>
              </div>
              {copied && <p className="text-xs text-green-600 mt-2">복사됨!</p>}
            </div>

            <p className="text-xs text-stone-400">
              받는 분이 코드를 입력하면 AI 웨딩 화보를 만들 수 있어요
            </p>

            <div className="flex gap-3 pt-4">
              <button onClick={() => navigate('/ai-snap/gift')}
                className="flex-1 py-3 rounded-xl border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 transition-all">
                한 번 더 선물하기
              </button>
              <button onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-900 transition-all">
                대시보드로
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-stone-800 mb-2">결제 실패</h2>
              <p className="text-sm text-stone-500">{errorMsg}</p>
            </div>
            <button onClick={() => navigate('/ai-snap/gift')}
              className="px-8 py-3 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-900 transition-all">
              다시 시도하기
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
