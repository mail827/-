import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function BoothCreditSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirm = async () => {
      try {
        const paymentKey = searchParams.get('paymentKey');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');
        const weddingId = searchParams.get('weddingId');

        if (!paymentKey || !orderId || !amount) throw new Error('Missing params');

        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/booth-credit/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Payment failed');
        }

        setStatus('success');
        setMessage('Credit added');
        setTimeout(() => navigate(weddingId ? `/edit/${weddingId}` : '/dashboard'), 2000);
      } catch (e: any) {
        setStatus('error');
        setMessage(e.message);
      }
    };
    confirm();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#fefefe] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-stone-400 mx-auto mb-4 animate-spin" />
            <p className="text-stone-600">Processing...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-stone-800 mb-2">Credit added</h2>
            <p className="text-stone-600">{message}</p>
            <p className="text-sm text-stone-400 mt-4">Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-stone-800 mb-2">Error</h2>
            <p className="text-stone-600 mb-4">{message}</p>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900">Dashboard</button>
          </>
        )}
      </div>
    </div>
  );
}
