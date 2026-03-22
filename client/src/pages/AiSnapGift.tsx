import { useState } from 'react';
import { Gift, ArrowRight, ArrowLeft, Phone, Mail, MessageSquare, CreditCard, Loader2 } from 'lucide-react';
import { at } from '../utils/appI18n';
import { useLocaleStore } from '../store/useLocaleStore';

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

interface Tier { id: string; snaps: number; price: number; label: string }

const TIERS: Tier[] = [
  { id: 'snap-3', snaps: 3, price: 5900, label: '3장 세트' },
  { id: 'snap-5', snaps: 5, price: 9900, label: '5장 세트' },
  { id: 'snap-10', snaps: 10, price: 14900, label: '10장 세트' },
  { id: 'snap-20', snaps: 20, price: 24900, label: '20장 세트' },
];

type SendMethod = 'phone' | 'email';

export default function AiSnapGift() {
  const { locale: gl } = useLocaleStore();
  const token = localStorage.getItem('token');
  const [step, setStep] = useState(token ? 1 : 0);

  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [sendMethod, setSendMethod] = useState<SendMethod>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [paying, setPaying] = useState(false);

  const handleLogin = (provider: 'google' | 'kakao') => {
    localStorage.setItem('redirectAfterLogin', '/ai-snap/gift');
    window.location.href = `${API}/oauth/${provider}`;
  };

  const formatPhone = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
  };

  const isRecipientValid = () => {
    if (sendMethod === 'phone') return phone.replace(/\D/g, '').length >= 10;
    return email.includes('@') && email.includes('.');
  };

  const handlePayment = async () => {
    if (!selectedTier || !isRecipientValid()) return;
    setPaying(true);

    try {
      const orderId = `SNAPGIFT_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const params = new URLSearchParams({
        tier: selectedTier.id,
        ...(sendMethod === 'phone' ? { toPhone: phone.replace(/\D/g, '') } : { toEmail: email }),
        ...(message ? { message } : {}),
      });

      const keyRes = await fetch(`${API}/snap-pack/toss-client-key`);
      const { clientKey } = await keyRes.json();
      const TossPayments = await loadTossV1();
      const tp = TossPayments(clientKey);
      await tp.requestPayment('카드', {
        amount: selectedTier.price,
        orderId,
        orderName: `AI 웨딩스냅 선물 (${selectedTier.label})`,
        successUrl: `${window.location.origin}/ai-snap/gift/callback?${params.toString()}`,
        failUrl: `${window.location.origin}/ai-snap/gift?error=payment_failed`,
      });
    } catch {}
    setPaying(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-stone-200 sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="font-serif text-xl text-stone-800">청첩장 작업실</a>
          {step >= 1 && step <= 3 && (
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1 rounded-full transition-all ${s <= step ? 'w-5 bg-stone-800' : 'w-2 bg-stone-200'}`} />
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {step === 0 && (
          <div className="text-center py-16 space-y-8">
            <div>
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-6">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <h1 className="font-serif text-2xl text-stone-800 mb-2">{at('giftTitle', gl)}</h1>
              <p className="text-sm text-stone-500">{at('giftDesc', gl)}</p>
            </div>
            <div className="space-y-3 max-w-xs mx-auto">
              <button onClick={() => handleLogin('kakao')} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-lg hover:opacity-90 transition-all" style={{ background: '#FEE500' }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.722 1.755 5.108 4.396 6.462-.148.536-.954 3.442-.984 3.66 0 0-.02.163.086.226.105.063.23.03.23.03.303-.042 3.514-2.313 4.07-2.707.717.1 1.457.153 2.202.153 5.523 0 10-3.463 10-7.824C22 6.463 17.523 3 12 3" fill="#3C1E1E"/></svg>
                <span className="text-sm font-medium" style={{ color: '#3C1E1E' }}>{at('snapKakaoLogin', gl)}</span>
              </button>
              <button onClick={() => handleLogin('google')} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-stone-200 rounded-lg hover:border-stone-400 transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span className="text-sm font-medium text-stone-700">{at('snapGoogleLogin', gl)}</span>
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="font-serif text-2xl text-stone-800 mb-2">{at('giftSelectPkg', gl)}</h2>
              <p className="text-sm text-stone-500">{at('giftSelectPkgDesc', gl)}</p>
            </div>
            <div className="space-y-3">
              {TIERS.map(t => {
                const perSnap = Math.round(t.price / t.snaps);
                const selected = selectedTier?.id === t.id;
                return (
                  <button key={t.id} onClick={() => setSelectedTier(t)}
                    className={`w-full flex items-center justify-between p-5 rounded-lg border-2 transition-all ${selected ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? 'bg-stone-800' : 'bg-stone-100'}`}>
                        <Gift className={`w-5 h-5 ${selected ? 'text-white' : 'text-stone-400'}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-stone-800">{t.label}</p>
                        <p className="text-xs text-stone-400">장당 {perSnap.toLocaleString()}원</p>
                      </div>
                    </div>
                    <p className="text-lg font-light text-stone-800">{t.price.toLocaleString()}<span className="text-xs text-stone-400">원</span></p>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setStep(2)} disabled={!selectedTier}
                className="px-8 py-3 rounded-lg bg-stone-800 text-white text-sm font-medium disabled:opacity-30 hover:bg-stone-900 transition-all flex items-center gap-1">
                다음 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="font-serif text-2xl text-stone-800 mb-2">{at('giftRecipient', gl)}</h2>
              <p className="text-sm text-stone-500">{at('giftRecipientDesc', gl)}</p>
            </div>

            <div className="flex bg-stone-100 rounded-lg p-1">
              <button onClick={() => setSendMethod('phone')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${sendMethod === 'phone' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}>
                <Phone className="w-4 h-4" /> 전화번호
              </button>
              <button onClick={() => setSendMethod('email')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${sendMethod === 'email' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}>
                <Mail className="w-4 h-4" /> 이메일
              </button>
            </div>

            {sendMethod === 'phone' ? (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">{at('giftPhone', gl)}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-3.5 border-2 border-stone-200 rounded-lg text-center text-lg tracking-wider focus:outline-none focus:border-stone-800 transition-all"
                />
                <p className="text-[11px] text-stone-400 mt-2 text-center">{at('giftPhoneNote', gl)}</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">{at('giftEmail', gl)}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="friend@email.com"
                  className="w-full px-4 py-3.5 border-2 border-stone-200 rounded-lg text-center text-lg focus:outline-none focus:border-stone-800 transition-all"
                />
                <p className="text-[11px] text-stone-400 mt-2 text-center">{at('giftEmailNote', gl)}</p>
              </div>
            )}

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-stone-700 mb-2">
                <MessageSquare className="w-4 h-4" /> 메시지 <span className="text-stone-400 font-normal">(선택)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="결혼 축하해! 예쁜 화보 만들어봐 :)"
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-800 transition-all resize-none"
              />
              <p className="text-[11px] text-stone-400 text-right mt-1">{message.length}/200</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-3 rounded-lg border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> 이전
              </button>
              <button onClick={() => setStep(3)} disabled={!isRecipientValid()}
                className="flex-1 py-3 rounded-lg bg-stone-800 text-white text-sm font-medium disabled:opacity-30 hover:bg-stone-900 transition-all flex items-center justify-center gap-1">
                결제 확인 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && selectedTier && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="font-serif text-2xl text-stone-800 mb-2">{at('giftConfirmTitle', gl)}</h2>
              <p className="text-sm text-stone-500">{at('giftConfirmDesc', gl)}</p>
            </div>

            <div className="bg-stone-50 rounded-lg border border-stone-200 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-600 font-semibold">{at('giftContent', gl)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">{at('packageLabel', gl)}</span>
                <span className="text-stone-800 font-medium">{selectedTier.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">{at('giftSnapCount', gl)}</span>
                <span className="text-stone-800 font-medium">{selectedTier.snaps}장</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">{at('giftRecipientLabel', gl)}</span>
                <span className="text-stone-800 font-medium">{sendMethod === 'phone' ? phone : email}</span>
              </div>
              {message && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">{at('giftMessage', gl)}</span>
                  <span className="text-stone-800 font-medium text-right max-w-[60%] break-words">{message}</span>
                </div>
              )}
              <div className="border-t border-stone-200 pt-3 flex justify-between">
                <span className="font-semibold text-stone-800">{at('paymentAmount', gl)}</span>
                <span className="text-xl font-light text-stone-800">{selectedTier.price.toLocaleString()}<span className="text-xs text-stone-400">원</span></span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-3 rounded-lg border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> 이전
              </button>
              <button onClick={handlePayment} disabled={paying}
                className="flex-1 py-4 rounded-lg bg-stone-800 text-white font-medium flex items-center justify-center gap-2 hover:bg-stone-900 transition-all disabled:opacity-50">
                {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                결제하기
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
