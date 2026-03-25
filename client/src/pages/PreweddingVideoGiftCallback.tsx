import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Loader2, X, Copy } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function PreweddingVideoGiftCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { confirmPayment(); }, []);

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
      const res = await fetch(API + '/video-gift/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          paymentKey, orderId, amount: Number(amount), tier,
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
    <div style={{ minHeight: '100vh', background: '#FAF9F7', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <header style={{ borderBottom: '1px solid #E8E5E0', position: 'sticky', top: 0, zIndex: 40, background: 'rgba(250,249,247,0.8)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 512, margin: '0 auto', padding: '16px' }}>
          <a href="/" style={{ fontFamily: 'serif', fontSize: 20, color: '#1a1a1a', textDecoration: 'none' }}>청첩장 작업실</a>
        </div>
      </header>

      <main style={{ maxWidth: 420, margin: '0 auto', padding: '64px 16px' }}>
        {status === 'loading' && (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <Loader2 size={40} className="animate-spin" color="#a8a29e" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: 14, color: '#999' }}>결제를 확인하고 있어요...</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={32} color="#16a34a" />
            </div>
            <h2 style={{ fontFamily: 'serif', fontSize: 24, color: '#1a1a1a', marginBottom: 8 }}>선물 전송 완료!</h2>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 32 }}>
              {params.get('toPhone') ? '문자로' : '이메일로'} 선물 코드가 전송됐어요
            </p>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E5E0', padding: 24, marginBottom: 32 }}>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>선물 코드</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2, color: '#1a1a1a' }}>{code}</span>
                <button onClick={handleCopy} style={{ padding: 8, borderRadius: 8, background: '#F0EDE8', border: 'none', cursor: 'pointer' }}>
                  {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} color="#57534e" />}
                </button>
              </div>
              {copied && <p style={{ fontSize: 12, color: '#16a34a', marginTop: 8 }}>복사됨!</p>}
            </div>

            <p style={{ fontSize: 12, color: '#bbb', marginBottom: 32 }}>
              받는 분이 코드를 입력하면 식전영상을 만들 수 있어요
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => navigate('/prewedding-video/gift')} style={{ flex: 1, padding: '14px', borderRadius: 8, border: '1px solid #E0DDD8', background: '#fff', color: '#57534e', fontSize: 14, cursor: 'pointer' }}>
                한 번 더 선물
              </button>
              <button onClick={() => navigate('/dashboard')} style={{ flex: 1, padding: '14px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                대시보드로
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <X size={32} color="#dc2626" />
            </div>
            <h2 style={{ fontFamily: 'serif', fontSize: 24, color: '#1a1a1a', marginBottom: 8 }}>결제 실패</h2>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 32 }}>{errorMsg}</p>
            <button onClick={() => navigate('/prewedding-video/gift')} style={{ padding: '14px 32px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              다시 시도
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
