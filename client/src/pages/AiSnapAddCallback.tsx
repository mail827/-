import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Check, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function AiSnapAddCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => { confirm(); }, []);

  const confirm = async () => {
    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amount = params.get('amount');
    const packId = params.get('packId');
    const addTier = params.get('addTier');
    if (!paymentKey || !orderId || !amount || !packId || !addTier) { setStatus('error'); return; }
    try {
      const res = await fetch(`${API}/snap-pack/add-snaps/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), packId, addTier }),
      });
      if (res.ok) { setStatus('success'); setTimeout(() => navigate(`/ai-snap/studio?packId=${packId}`), 1500); }
      else setStatus('error');
    } catch { setStatus('error'); }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      {status === 'loading' && <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />}
      {status === 'success' && (
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><Check className="w-7 h-7 text-green-600" /></div>
          <p className="text-sm text-stone-800 font-semibold">추가 생성 완료!</p>
          <p className="text-xs text-stone-400 mt-1">스튜디오로 이동 중...</p>
        </div>
      )}
      {status === 'error' && (
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><X className="w-7 h-7 text-red-500" /></div>
          <p className="text-sm text-stone-800 font-semibold">결제 실패</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-stone-800 text-white rounded-xl text-sm">돌아가기</button>
        </div>
      )}
    </div>
  );
}
