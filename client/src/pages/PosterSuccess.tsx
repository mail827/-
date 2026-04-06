import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Download, Loader, XCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function PosterSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const paymentKey = params.get('paymentKey');
  const amount = params.get('amount');

  const [phase, setPhase] = useState<'confirming' | 'generating' | 'done' | 'error'>('confirming');
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId || !paymentKey || !amount) { setPhase('error'); setError('결제 정보가 없습니다.'); return; }
    (async () => {
      try {
        const confirmRes = await fetch(`${API}/poster/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });
        const confirmData = await confirmRes.json();
        if (!confirmRes.ok) throw new Error(confirmData.error || '결제 승인 실패');
        setPhase('generating');
        await fetch(`${API}/poster/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          try {
            const statusRes = await fetch(`${API}/poster/status/${orderId}`);
            const statusData = await statusRes.json();
            if (statusData.status === 'DONE') {
              clearInterval(poll);
              setPosterUrl(statusData.posterUrl);
              setPhase('done');
            } else if (statusData.status === 'FAILED') {
              clearInterval(poll);
              setPhase('error');
              setError('포스터 생성에 실패했습니다.');
            }
          } catch {}
          if (attempts > 60) { clearInterval(poll); setPhase('error'); setError('시간 초과'); }
        }, 3000);
      } catch (e: any) {
        setPhase('error');
        setError(e.message);
      }
    })();
  }, [orderId, paymentKey, amount]);

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 440, width: '100%', padding: '40px 20px', textAlign: 'center' }}>
        {phase === 'confirming' && (
          <div>
            <Loader size={40} style={{ color: '#A8A8A0', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 18, fontWeight: 500, color: '#2C2C2A' }}>결제 승인 중...</p>
            <p style={{ fontSize: 13, color: '#A8A8A0', marginTop: 8 }}>잠시만 기다려주세요</p>
          </div>
        )}
        {phase === 'generating' && (
          <div>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
              <svg viewBox="0 0 80 80" style={{ animation: 'spin 2s linear infinite' }}>
                <circle cx="40" cy="40" r="36" fill="none" stroke="#E8E5E0" strokeWidth="3" />
                <circle cx="40" cy="40" r="36" fill="none" stroke="#2C2C2A" strokeWidth="3" strokeDasharray="60 170" strokeLinecap="round" />
              </svg>
            </div>
            <p style={{ fontSize: 18, fontWeight: 500, color: '#2C2C2A' }}>포스터를 만들고 있어요</p>
            <p style={{ fontSize: 13, color: '#A8A8A0', marginTop: 8, lineHeight: 1.6 }}>타이포그래피를 입히는 중입니다</p>
          </div>
        )}
        {phase === 'done' && posterUrl && (
          <div>
            <CheckCircle size={40} style={{ color: '#6B9E78', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 20, fontWeight: 500, color: '#2C2C2A', marginBottom: 24 }}>포스터가 완성됐어요</p>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E8E5E0', marginBottom: 24 }}>
              <img src={posterUrl} alt="Wedding Poster" style={{ width: '100%', display: 'block' }} />
            </div>
            <a href={posterUrl} download target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: '#2C2C2A', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>
              <Download size={16} />
              원본 다운로드
            </a>
            <div style={{ marginTop: 16 }}>
              <Link to="/" style={{ fontSize: 13, color: '#A8A8A0', textDecoration: 'none' }}>
                홈으로
              </Link>
            </div>
          </div>
        )}
        {phase === 'error' && (
          <div>
            <XCircle size={40} style={{ color: '#C4855C', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 18, fontWeight: 500, color: '#2C2C2A', marginBottom: 8 }}>문제가 발생했어요</p>
            <p style={{ fontSize: 13, color: '#A8A8A0', lineHeight: 1.6 }}>{error}</p>
            <div style={{ marginTop: 24 }}>
              <Link to="/poster" style={{ display: 'inline-block', padding: '12px 28px', background: '#2C2C2A', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14 }}>
                다시 시도
              </Link>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
