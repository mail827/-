import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

export default function ArchiveSuccess() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    const confirm = async () => {
      const paymentKey = params.get('paymentKey');
      const orderId = params.get('orderId');
      const amount = Number(params.get('amount'));
      const weddingId = params.get('weddingId');

      if (!paymentKey || !orderId || !amount || !weddingId) {
        setStatus('error');
        return;
      }

      try {
        const res = await fetch(API + '/public/archive/payment-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount, weddingId }),
        });
        if (res.ok) setStatus('done');
        else setStatus('error');
      } catch {
        setStatus('error');
      }
    };
    confirm();
  }, [params]);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e5e5e5', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#888', fontSize: 14 }}>결제 확인 중...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>결제 처리 중 오류가 발생했어요</p>
        <p style={{ fontSize: 14, color: '#888' }}>고객센터로 문의해주세요</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 20 }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
      </div>
      <p style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>영구 아카이브 전환 완료</p>
      <p style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 1.6 }}>이제 청첩장이 영원히 보존됩니다</p>
      <button onClick={() => window.history.back()} style={{ marginTop: 8, padding: '14px 32px', background: '#1a1a1a', color: '#fff', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>청첩장으로 돌아가기</button>
    </div>
  );
}
