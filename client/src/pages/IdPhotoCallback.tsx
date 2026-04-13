import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Download, Loader2, RefreshCw, ArrowLeft, AlertCircle, Camera } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function IdPhotoCallback() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = localStorage.getItem('token');

  const [status, setStatus] = useState<'confirming' | 'generating' | 'completed' | 'failed'>('confirming');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confirmed = useRef(false);

  useEffect(() => {
    if (confirmed.current) return;
    confirmed.current = true;

    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amount = Number(params.get('amount'));
    const adminIdPhotoId = params.get('idPhotoId');

    if (adminIdPhotoId) {
      setStatus('generating');
      startPolling(adminIdPhotoId);
      return;
    }

    if (!paymentKey || !orderId || !amount || !token) {
      setError('결제 정보가 올바르지 않습니다');
      setStatus('failed');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API}/id-photo/payment/confirm`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount })
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.error || '결제 확인 실패');
          setStatus('failed');
          return;
        }

        setStatus('generating');
        startPolling(data.idPhotoId);
      } catch (e: any) {
        setError(e.message || '오류 발생');
        setStatus('failed');
      }
    })();

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startPolling = (idPhotoId: string) => {
    let count = 0;
    pollRef.current = setInterval(async () => {
      count++;
      if (count > 60) {
        if (pollRef.current) clearInterval(pollRef.current);
        setError('생성 시간이 초과되었습니다. 잠시 후 마이페이지에서 확인해주세요.');
        setStatus('failed');
        return;
      }

      try {
        const res = await fetch(`${API}/id-photo/status/${idPhotoId}?t=${Date.now()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.status === 'COMPLETED' && data.resultUrl) {
          if (pollRef.current) clearInterval(pollRef.current);
          setResultUrl(data.resultUrl);
          setStatus('completed');
        } else if (data.status === 'FAILED') {
          if (pollRef.current) clearInterval(pollRef.current);
          setError('사진 생성에 실패했습니다');
          setStatus('failed');
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
      a.href = url;
      a.download = `ai-id-photo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(resultUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="sticky top-0 z-10 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => nav('/id-photo')} className="flex items-center gap-1 text-stone-600 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm">새로 만들기</span>
          </button>
          <span className="text-sm font-medium text-stone-900 tracking-tight">AI ID 포트레이트</span>
          <div className="w-20" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full text-center">

          {status === 'confirming' && (
            <div>
              <Loader2 className="w-10 h-10 text-stone-400 animate-spin mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-stone-800 font-medium">결제를 확인하고 있어요</p>
              <p className="text-stone-400 text-xs mt-1">잠시만 기다려주세요</p>
            </div>
          )}

          {status === 'generating' && (
            <div>
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-2 border-stone-200 rounded-full" />
                <div className="absolute inset-0 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                <Camera className="absolute inset-0 m-auto w-8 h-8 text-stone-500" strokeWidth={1.5} />
              </div>
              <p className="text-stone-800 font-medium text-lg">AI 포트레이트를 만들고 있어요</p>
              <p className="text-stone-400 text-sm mt-2">AI가 정면 포트레이트를 생성 중입니다</p>
              <div className="mt-6 flex justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-stone-300 rounded-full animate-pulse" style={{ animationDelay: `${i * 300}ms` }} />
                ))}
              </div>
            </div>
          )}

          {status === 'completed' && resultUrl && (
            <div>
              <div className="w-48 h-64 mx-auto rounded-xl overflow-hidden shadow-xl mb-6 border border-stone-200">
                <img src={resultUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="text-stone-800 font-medium text-lg mb-1">AI 포트레이트가 완성되었어요</p>
              <p className="text-stone-400 text-sm mb-6">고화질 이미지를 다운로드하세요</p>
              <button
                onClick={handleDownload}
                className="w-full py-4 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" strokeWidth={1.5} />
                <span>다운로드</span>
              </button>
              <button
                onClick={() => nav('/id-photo')}
                className="w-full mt-3 py-3 text-stone-600 text-sm font-medium hover:text-stone-900 transition-colors flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                <span>다른 사진 만들기</span>
              </button>
            </div>
          )}

          {status === 'failed' && (
            <div>
              <AlertCircle className="w-12 h-12 text-stone-400 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-stone-800 font-medium text-lg mb-1">문제가 발생했어요</p>
              <p className="text-stone-500 text-sm mb-6">{error || '알 수 없는 오류'}</p>
              <button
                onClick={() => nav('/id-photo')}
                className="px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors"
              >
                다시 시도하기
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-lg mx-auto px-4 pb-8 text-center">
        <a href="/" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">Made by 청첩장 작업실 ›</a>
      </footer>
    </div>
  );
}
