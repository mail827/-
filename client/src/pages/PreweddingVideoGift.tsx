import { useState } from 'react';
import { Gift, ArrowRight, Film, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

function loadTossV1(): Promise<any> {
  return new Promise((resolve) => {
    if ((window as any).TossPayments) { resolve((window as any).TossPayments); return; }
    const s = document.createElement('script');
    s.src = 'https://js.tosspayments.com/v1/payment';
    s.onload = () => resolve((window as any).TossPayments);
    document.body.appendChild(s);
  });
}

interface Tier { id: string; price: number; label: string; desc: string }

const TIERS: Tier[] = [
  { id: 'photo', price: 29000, label: '29,000원', desc: '웨딩사진 모드' },
  { id: 'selfie', price: 39000, label: '39,000원', desc: 'AI 화보팩 + 식전영상' },
];

type SendMethod = 'phone' | 'email';

export default function PreweddingVideoGift() {
  const token = localStorage.getItem('token');
  const [step, setStep] = useState(token ? 1 : 0);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [sendMethod, setSendMethod] = useState<SendMethod>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [paying, setPaying] = useState(false);

  const handleLogin = (provider: 'google' | 'kakao') => {
    localStorage.setItem('redirectAfterLogin', '/prewedding-video/gift');
    window.location.href = API + '/oauth/' + provider;
  };

  const formatPhone = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return nums.slice(0, 3) + '-' + nums.slice(3);
    return nums.slice(0, 3) + '-' + nums.slice(3, 7) + '-' + nums.slice(7);
  };

  const isRecipientValid = () => {
    if (sendMethod === 'phone') return phone.replace(/\D/g, '').length >= 10;
    return email.includes('@') && email.includes('.');
  };

  const handlePayment = async () => {
    if (!selectedTier || !isRecipientValid()) return;
    setPaying(true);
    try {
      const orderId = 'VIDGIFT_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      const params = new URLSearchParams({
        tier: selectedTier.id,
        ...(sendMethod === 'phone' ? { toPhone: phone.replace(/\D/g, '') } : { toEmail: email }),
        ...(message ? { message } : {}),
      });
      const keyRes = await fetch(API + '/snap-pack/toss-client-key');
      const { clientKey } = await keyRes.json();
      const TossPayments = await loadTossV1();
      const tp = TossPayments(clientKey);
      await tp.requestPayment('\uCE74\uB4DC', {
        amount: selectedTier.price,
        orderId,
        orderName: '\uC2DD\uC804\uC601\uC0C1 \uC120\uBB3C (' + selectedTier.desc.split('\xb7')[0].trim() + ')',
        successUrl: window.location.origin + '/prewedding-video/gift/callback?' + params.toString(),
        failUrl: window.location.origin + '/prewedding-video/gift?error=payment_failed',
      });
    } catch {}
    setPaying(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F7', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <header style={{ borderBottom: '1px solid #E8E5E0', position: 'sticky', top: 0, zIndex: 40, background: 'rgba(250,249,247,0.8)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 512, margin: '0 auto', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontFamily: 'serif', fontSize: 20, color: '#1a1a1a', textDecoration: 'none' }}>청첩장 작업실</a>
          {step >= 1 && step <= 3 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ height: 4, borderRadius: 2, transition: 'all 0.3s', width: s <= step ? 20 : 8, background: s <= step ? '#1a1a1a' : '#E0DDD8' }} />
              ))}
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px' }}>
        {step === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #78716c, #57534e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Gift size={28} color="#fff" />
            </div>
            <h1 style={{ fontFamily: 'serif', fontSize: 24, color: '#1a1a1a', marginBottom: 8 }}>식전영상 선물하기</h1>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 32 }}>소중한 분에게 특별한 식전영상을 선물하세요</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
              <button onClick={() => handleLogin('kakao')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px 24px', borderRadius: 8, background: '#FEE500', border: 'none', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.722 1.755 5.108 4.396 6.462-.148.536-.954 3.442-.984 3.66 0 0-.02.163.086.226.105.063.23.03.23.03.303-.042 3.514-2.313 4.07-2.707.717.1 1.457.153 2.202.153 5.523 0 10-3.463 10-7.824C22 6.463 17.523 3 12 3" fill="#3C1E1E"/></svg>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#3C1E1E' }}>카카오로 시작</span>
              </button>
              <button onClick={() => handleLogin('google')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px 24px', borderRadius: 8, background: '#fff', border: '2px solid #E0DDD8', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#57534e' }}>Google로 시작</span>
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'serif', fontSize: 22, color: '#1a1a1a', marginBottom: 8 }}>패키지 선택</h2>
              <p style={{ fontSize: 13, color: '#999' }}>선물할 식전영상 패키지를 골라주세요</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {TIERS.map(t => (
                <button key={t.id} onClick={() => setSelectedTier(t)} style={{ padding: '20px', borderRadius: 12, border: selectedTier?.id === t.id ? '2px solid #1a1a1a' : '1px solid #E0DDD8', background: selectedTier?.id === t.id ? '#F5F3F0' : '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{t.desc.split('\xb7')[0].trim()}</p>
                    <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{t.desc.split('\xb7').slice(1).join('\xb7').trim()}</p>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{t.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => selectedTier && setStep(2)} disabled={!selectedTier} style={{ width: '100%', padding: '14px 0', borderRadius: 8, border: 'none', background: selectedTier ? '#1a1a1a' : '#E8E5E0', color: selectedTier ? '#fff' : '#bbb', fontSize: 14, fontWeight: 500, cursor: selectedTier ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              다음 <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'serif', fontSize: 22, color: '#1a1a1a', marginBottom: 8 }}>받는 분 정보</h2>
              <p style={{ fontSize: 13, color: '#999' }}>선물 코드를 보낼 연락처를 입력해주세요</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {([['phone', '휴대폰'], ['email', '이메일']] as const).map(([m, label]) => (
                <button key={m} onClick={() => setSendMethod(m)} style={{ flex: 1, padding: '12px', borderRadius: 8, border: sendMethod === m ? '2px solid #1a1a1a' : '1px solid #E0DDD8', background: sendMethod === m ? '#F5F3F0' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
                  {label}
                </button>
              ))}
            </div>

            {sendMethod === 'phone' ? (
              <input value={phone} onChange={e => setPhone(formatPhone(e.target.value))} placeholder="010-0000-0000" style={{ width: '100%', padding: '14px 16px', borderRadius: 8, border: '1px solid #E0DDD8', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            ) : (
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" type="email" style={{ width: '100%', padding: '14px 16px', borderRadius: 8, border: '1px solid #E0DDD8', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            )}

            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="축하 메시지 (선택)" rows={3} style={{ width: '100%', padding: '14px 16px', borderRadius: 8, border: '1px solid #E0DDD8', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', marginTop: 12, boxSizing: 'border-box' }} />

            <button onClick={() => isRecipientValid() && setStep(3)} disabled={!isRecipientValid()} style={{ width: '100%', padding: '14px 0', borderRadius: 8, border: 'none', background: isRecipientValid() ? '#1a1a1a' : '#E8E5E0', color: isRecipientValid() ? '#fff' : '#bbb', fontSize: 14, fontWeight: 500, cursor: isRecipientValid() ? 'pointer' : 'default', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              다음 <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 3 && selectedTier && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'serif', fontSize: 22, color: '#1a1a1a', marginBottom: 8 }}>선물 확인</h2>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E5E0', padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Film size={20} color="#57534e" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>식전영상 {selectedTier.desc.split('\xb7')[0].trim()}</p>
                  <p style={{ fontSize: 12, color: '#999' }}>{selectedTier.desc.split('\xb7').slice(1).join('\xb7').trim()}</p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #F0EDE8', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#888' }}>받는 분</span>
                  <span style={{ fontSize: 13, color: '#1a1a1a' }}>{sendMethod === 'phone' ? phone : email}</span>
                </div>
                {message && (
                  <div style={{ padding: '10px 12px', background: '#FAF9F7', borderRadius: 8, marginTop: 8 }}>
                    <p style={{ fontSize: 12, color: '#888' }}>메시지</p>
                    <p style={{ fontSize: 13, color: '#1a1a1a', marginTop: 2 }}>{message}</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={handlePayment} disabled={paying} style={{ width: '100%', padding: '16px 0', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {paying ? <Loader2 size={18} className="animate-spin" /> : <Gift size={18} />}
              {paying ? '처리 중...' : selectedTier.label + ' 결제하기'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
