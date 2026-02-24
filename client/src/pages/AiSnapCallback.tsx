import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Check, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function AiSnapCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amount = params.get('amount');
    
    if (!paymentKey || !orderId || !amount) {
      setStatus('error');
      return;
    }

    fetch(`${API}/snap-pack/confirm-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setTimeout(() => navigate('/ai-snap/studio'), 1500);
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [params, navigate, token]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-stone-400 animate-spin mx-auto mb-4" />
            <p className="text-stone-600">결제를 확인하고 있어요...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-stone-800 font-semibold">결제 완료!</p>
            <p className="text-sm text-stone-400 mt-1">스튜디오로 이동합니다...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <X className="w-7 h-7 text-red-600" />
            </div>
            <p className="text-stone-800 font-semibold">결제에 실패했어요</p>
            <button onClick={() => navigate('/ai-snap/studio')} className="mt-4 px-6 py-2 bg-stone-800 text-white rounded-xl text-sm">돌아가기</button>
          </>
        )}
      </div>
    </div>
  );
}
