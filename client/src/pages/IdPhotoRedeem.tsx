import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Gift, Upload, Camera, ArrowLeft, X, Check } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function IdPhotoRedeem() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = localStorage.getItem('token');
  const fileRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState(params.get('code') || '');
  const [step, setStep] = useState<'code' | 'upload' | 'generating' | 'done' | 'error'>('code');
  
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (params.get('code')) checkCode(params.get('code') as string);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const checkCode = async (c: string) => {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`${API}/id-photo/gift/check?code=${c}`);
      const data = await res.json();
      if (data.valid) { setStep('upload'); }
      else { setError(data.error || '유효하지 않은 코드'); }
    } catch { setError('확인 실패'); }
    finally { setChecking(false); }
  };

  const handleFile = async (file: File) => {
    if (!token) { sessionStorage.setItem('afterLogin', `/id-photo/redeem?code=${code}`); nav('/?login=pair'); return; }
    setStep('generating');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const upRes = await fetch(`${API}/upload/image`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      const upData = await upRes.json();
      if (!upData.url) throw new Error('업로드 실패');

      const redeemRes = await fetch(`${API}/id-photo/gift/redeem`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, imageUrl: upData.url })
      });
      const redeemData = await redeemRes.json();
      if (!redeemData.success) throw new Error(redeemData.error);

      startPolling(redeemData.idPhotoId);
    } catch (e: any) { setError(e.message); setStep('error'); }
  };

  const startPolling = (id: string) => {
    let count = 0;
    pollRef.current = setInterval(async () => {
      count++;
      if (count > 60) { if (pollRef.current) clearInterval(pollRef.current); setError('시간 초과'); setStep('error'); return; }
      try {
        const res = await fetch(`${API}/id-photo/status/${id}?t=${Date.now()}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.status === 'COMPLETED' && data.resultUrl) {
          if (pollRef.current) clearInterval(pollRef.current);
          setResultUrl(data.resultUrl);
          setStep('done');
        } else if (data.status === 'FAILED') {
          if (pollRef.current) clearInterval(pollRef.current);
          setError('생성 실패'); setStep('error');
        }
      } catch {}
    }, 3000);
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `ai-id-portrait-${Date.now()}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { window.open(resultUrl, '_blank'); }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => nav('/')} className="flex items-center gap-1 text-stone-600 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm">홈</span>
          </button>
          <span className="text-sm font-medium text-stone-900 tracking-tight">AI ID 포트레이트</span>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        {step === 'code' && (
          <div className="text-center">
            <Gift className="w-12 h-12 text-stone-400 mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="text-xl font-semibold text-stone-900 mb-2">사용권 코드 입력</h1>
            <p className="text-stone-500 text-sm mb-8">선물 받은 코드를 입력해주세요</p>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <input
              value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="IDPH-XXXXXXXX"
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-stone-400 mb-4"
            />
            <button onClick={() => checkCode(code)} disabled={!code || checking}
              className="w-full py-3 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 disabled:opacity-50">
              {checking ? '확인 중...' : '코드 확인'}
            </button>
          </div>
        )}

        {step === 'upload' && (
          <div className="text-center">
            <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="text-xl font-semibold text-stone-900 mb-2">사용권이 확인되었어요</h1>
            <p className="text-stone-500 text-sm mb-8">사진을 업로드하면 AI가 정면 포트레이트를 만들어드려요</p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-stone-300 rounded-2xl p-12 cursor-pointer hover:border-stone-400 hover:bg-stone-100/50 transition-all"
            >
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Upload className="w-10 h-10 text-stone-400 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-stone-700 font-medium mb-1">사진을 선택해주세요</p>
              <p className="text-stone-400 text-xs">정면 얼굴 사진 권장</p>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="text-center py-10">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-2 border-stone-200 rounded-full" />
              <div className="absolute inset-0 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
              <Camera className="absolute inset-0 m-auto w-8 h-8 text-stone-500" strokeWidth={1.5} />
            </div>
            <p className="text-stone-800 font-medium text-lg">AI 포트레이트를 만들고 있어요</p>
            <div className="mt-6 flex justify-center gap-1">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-stone-300 rounded-full animate-pulse" style={{animationDelay:`${i*300}ms`}} />)}
            </div>
          </div>
        )}

        {step === 'done' && resultUrl && (
          <div className="text-center">
            <div className="w-48 h-64 mx-auto rounded-xl overflow-hidden shadow-xl mb-6 border border-stone-200">
              <img src={resultUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <p className="text-stone-800 font-medium text-lg mb-6">완성되었어요</p>
            <button onClick={handleDownload} className="w-full py-4 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800">다운로드</button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center">
            <X className="w-12 h-12 text-stone-400 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-stone-800 font-medium mb-2">오류가 발생했어요</p>
            <p className="text-stone-500 text-sm mb-6">{error}</p>
            <button onClick={() => { setStep('code'); setError(null); }} className="px-6 py-3 bg-stone-900 text-white text-sm rounded-xl">다시 시도</button>
          </div>
        )}
      </main>
      <footer className="max-w-lg mx-auto px-4 pb-8 text-center">
        <a href="/" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">Made by 청첩장 작업실 ›</a>
      </footer>
    </div>
  );
}
