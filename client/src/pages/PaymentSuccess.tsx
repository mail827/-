import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('결제 확인 중...');

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const paymentKey = searchParams.get('paymentKey');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');
        const weddingData = searchParams.get('weddingData');

        if (!paymentKey || !orderId || !amount) {
          throw new Error('결제 정보가 없습니다');
        }

        const token = localStorage.getItem('token');

        const confirmRes = await fetch(`${import.meta.env.VITE_API_URL}/payment/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });

        if (!confirmRes.ok) {
          const err = await confirmRes.json();
          throw new Error(err.error || '결제 승인 실패');
        }

        if (weddingData) {
          const formData = JSON.parse(decodeURIComponent(weddingData));
          
          const weddingRes = await fetch(`${import.meta.env.VITE_API_URL}/weddings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          });

          if (!weddingRes.ok) {
            throw new Error('청첩장 생성 실패');
          }

          const wedding = await weddingRes.json();
          
          setStatus('success');
          setMessage('결제 완료! 청첩장이 생성되었습니다.');
          
          setTimeout(() => {
            navigate(`/edit/${wedding.id}`);
          }, 2000);
        } else {
          setStatus('success');
          setMessage('결제가 완료되었습니다.');
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } catch (error: any) {
        console.error('Payment error:', error);
        setStatus('error');
        setMessage(error.message || '결제 처리 중 오류가 발생했습니다');
      }
    };

    confirmPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#fefefe] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-stone-400 mx-auto mb-4 animate-spin" />
            <p className="text-stone-600">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-stone-800 mb-2">결제 완료!</h2>
            <p className="text-stone-600">{message}</p>
            <p className="text-sm text-stone-400 mt-4">잠시 후 이동합니다...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-stone-800 mb-2">오류 발생</h2>
            <p className="text-stone-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900"
            >
              대시보드로 이동
            </button>
          </>
        )}
      </div>
    </div>
  );
}
