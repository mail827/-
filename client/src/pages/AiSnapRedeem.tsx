import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, Gift, Loader2, Check, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function AiSnapRedeem() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [code, setCode] = useState(params.get('code') || '');
  const [checking, setChecking] = useState(false);
  const [info, setInfo] = useState<any>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (code && code.startsWith('SNAP-')) checkCode(code);
  }, []);

  const checkCode = async (c: string) => {
    setChecking(true);
    setInfo(null);
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/snap-gift/check/${c}`);
      const data = await res.json();
      if (res.ok) setInfo(data);
      else setErrorMsg(data.error || '코드 확인 실패');
    } catch { setErrorMsg('코드 확인 실패'); }
    setChecking(false);
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleRedeem = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      localStorage.setItem('redirectAfterLogin', `/ai-snap/redeem?code=${code}`);
      navigate('/');
      return;
    }
    setRedeeming(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/snap-gift/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (res.status === 401) {
        clearAuth();
        setErrorMsg('로그인이 만료됐어요. 다시 로그인해주세요.');
        setRedeeming(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setResult('success');
        setTimeout(() => navigate(`/ai-snap/studio?packId=${data.packId}`), 2000);
      } else {
        setErrorMsg(data.error || '사용 실패');
        setResult('error');
      }
    } catch {
      setResult('error');
      setErrorMsg('네트워크 오류가 발생했어요');
    }
    setRedeeming(false);
  };

  const handleLogin = (provider: 'google' | 'kakao') => {
    localStorage.setItem('redirectAfterLogin', `/ai-snap/redeem?code=${code}`);
    window.location.href = `${API}/oauth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-stone-200 sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <a href="/" className="font-serif text-xl text-stone-800">청첩장 작업실</a>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-600 flex items-center justify-center mx-auto mb-6">
            <Gift className="w-7 h-7 text-amber-300" />
          </div>
          <h1 className="font-serif text-2xl text-stone-800 mb-2">AI 웨딩스냅 선물</h1>
          <p className="text-sm text-stone-500">선물받은 코드를 입력하세요</p>
        </div>

        {result === 'success' ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-semibold text-stone-800 mb-1">선물이 등록됐어요!</p>
            <p className="text-sm text-stone-400">스튜디오로 이동합니다...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase().trim()); setErrorMsg(''); setInfo(null); }}
                  placeholder="SNAP-XXXXXXXX"
                  className="flex-1 px-4 py-3.5 border-2 border-stone-200 rounded-xl text-center text-lg tracking-wider font-mono focus:outline-none focus:border-stone-800 transition-all"
                />
                <button onClick={() => checkCode(code)} disabled={!code || checking}
                  className="px-5 py-3.5 bg-stone-800 text-white rounded-xl text-sm font-medium disabled:opacity-30 hover:bg-stone-900 transition-all">
                  {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : '확인'}
                </button>
              </div>
            </div>

            {info && (
              <div className={`rounded-2xl border p-5 ${info.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                {info.valid ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <Check className="w-5 h-5" />
                      <span className="font-semibold">사용 가능한 코드</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">패키지</span>
                      <span className="text-stone-800 font-medium">{info.label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">생성 장수</span>
                      <span className="text-stone-800 font-medium">{info.snaps}장</span>
                    </div>
                    {info.isFree && (
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">유형</span>
                        <span className="text-amber-600 font-medium">무료 선물</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-700">
                    <X className="w-5 h-5" />
                    <span className="font-semibold">{info.isRedeemed ? '이미 사용된 코드' : info.expired ? '만료된 코드' : '사용 불가'}</span>
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <p className="text-sm text-red-500 text-center">{errorMsg}</p>
            )}

            {info?.valid && !token && (
              <div className="space-y-3">
                <p className="text-sm text-stone-500 text-center">선물을 받으려면 로그인이 필요해요</p>
                <button onClick={() => handleLogin('kakao')}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl" style={{ background: '#FEE500' }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.722 1.755 5.108 4.396 6.462-.148.536-.954 3.442-.984 3.66 0 0-.02.163.086.226.105.063.23.03.23.03.303-.042 3.514-2.313 4.07-2.707.717.1 1.457.153 2.202.153 5.523 0 10-3.463 10-7.824C22 6.463 17.523 3 12 3" fill="#3C1E1E"/></svg>
                  <span className="text-sm font-medium" style={{ color: '#3C1E1E' }}>카카오로 시작하기</span>
                </button>
                <button onClick={() => handleLogin('google')}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-stone-200 rounded-2xl hover:border-stone-400 transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <span className="text-sm font-medium text-stone-700">Google로 시작하기</span>
                </button>
              </div>
            )}

            {info?.valid && token && (
              <button onClick={handleRedeem} disabled={redeeming}
                className="w-full py-4 rounded-2xl bg-stone-800 text-white font-medium flex items-center justify-center gap-2 hover:bg-stone-900 transition-all disabled:opacity-50">
                {redeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                선물 받기
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
