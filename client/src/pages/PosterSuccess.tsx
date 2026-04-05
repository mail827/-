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
    if (!orderId || !paymentKey || !amount) { setPhase('error'); setError('\uacb0\uc81c \uc815\ubcf4\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.'); return; }
    (async () => {
      try {
        const confirmRes = await fetch(`${API}/poster/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });
        const confirmData = await confirmRes.json();
        if (!confirmRes.ok) throw new Error(confirmData.error || '\uacb0\uc81c \uc2b9\uc778 \uc2e4\ud328');
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
              setError('\ud3ec\uc2a4\ud130 \uc0dd\uc131\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.');
            }
          } catch {}
          if (attempts > 60) { clearInterval(poll); setPhase('error'); setError('\uc2dc\uac04 \ucd08\uacfc'); }
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
            <p style={{ fontSize: 18, fontWeight: 500, color: '#2C2C2A' }}>\uacb0\uc81c \uc2b9\uc778 \uc911...</p>
            <p style={{ fontSize: 13, color: '#A8A8A0', marginTop: 8 }}>\uc7a0\uc2dc\ub9cc \uae30\ub2e4\ub824\uc8fc\uc138\uc694</p>
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
            <p style={{ fontSize: 18, fontWeight: 500, color: '#2C2C2A' }}>\ud3ec\uc2a4\ud130\ub97c \ub9cc\ub4e4\uace0 \uc788\uc5b4\uc694</p>
            <p style={{ fontSize: 13, color: '#A8A8A0', marginTop: 8, lineHeight: 1.6 }}>\ud0c0\uc774\ud3ec\uadf8\ub798\ud53c\ub97c \uc785\ud788\ub294 \uc911\uc785\ub2c8\ub2e4</p>
          </div>
        )}
        {phase === 'done' && posterUrl && (
          <div>
            <CheckCircle size={40} style={{ color: '#6B9E78', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 20, fontWeight: 500, color: '#2C2C2A', marginBottom: 24 }}>\ud3ec\uc2a4\ud130\uac00 \uc644\uc131\ub410\uc5b4\uc694</p>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E8E5E0', marginBottom: 24 }}>
              <img src={posterUrl} alt="Wedding Poster" style={{ width: '100%', display: 'block' }} />
            </div>
            <a href={posterUrl} download target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: '#2C2C2A', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>
              <Download size={16} />
              \uc6d0\ubcf8 \ub2e4\uc6b4\ub85c\ub4dc
            </a>
            <div style={{ marginTop: 16 }}>
              <Link to="/" style={{ fontSize: 13, color: '#A8A8A0', textDecoration: 'none' }}>
                \ud648\uc73c\ub85c
              </Link>
            </div>
          </div>
        )}
        {phase === 'error' && (
          <div>
            <XCircle size={40} style={{ color: '#C4855C', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 18, fontWeight: 500, color: '#2C2C2A', marginBottom: 8 }}>\ubb38\uc81c\uac00 \ubc1c\uc0dd\ud588\uc5b4\uc694</p>
            <p style={{ fontSize: 13, color: '#A8A8A0', lineHeight: 1.6 }}>{error}</p>
            <div style={{ marginTop: 24 }}>
              <Link to="/poster" style={{ display: 'inline-block', padding: '12px 28px', background: '#2C2C2A', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14 }}>
                \ub2e4\uc2dc \uc2dc\ub3c4
              </Link>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
