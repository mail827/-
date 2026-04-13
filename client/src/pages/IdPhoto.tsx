import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Camera, ChevronRight, ArrowLeft, Loader2, X, Check } from 'lucide-react';

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

export default function IdPhoto() {
  const nav = useNavigate();
  const token = localStorage.getItem('token');
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'analyzing' | 'ready' | 'paying'>('upload');
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [idPhotoId, setIdPhotoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!token) { sessionStorage.setItem('afterLogin', '/id-photo'); nav('/?login=pair'); return; }
    if (!file.type.startsWith('image/')) { setError('이미지 파일만 가능합니다'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('10MB 이하의 파일만 가능합니다'); return; }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    setStep('analyzing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const upRes = await fetch(`${API}/upload/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const upData = await upRes.json();
      if (!upData.url) throw new Error('업로드 실패');

      const analyzeRes = await fetch(`${API}/id-photo/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: upData.url })
      });
      const analyzeData = await analyzeRes.json();

      if (!analyzeData.success) {
        setError(analyzeData.message || '사진 분석에 실패했습니다');
        setStep('upload');
        return;
      }

      setAnalysis({ ...analyzeData.analysis, _originalUrl: analyzeData.idPhoto.originalUrl });
      setIdPhotoId(analyzeData.idPhoto.id);
      setStep('ready');
    } catch (e: any) {
      setError(e.message || '오류가 발생했습니다');
      setStep('upload');
    }
  }, [token, nav]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const isAdmin = (() => { try { const t = token; if (!t) return false; const p = JSON.parse(atob(t.split('.')[1])); return p.role === 'ADMIN'; } catch { return false; } })();

  const handlePayment = async () => {
    if (!token || !idPhotoId) return;
    setStep('paying');

    try {
      if (isAdmin) {
        const res = await fetch(`${API}/id-photo/admin/generate`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: analysis?._originalUrl || '' })
        });
        const data = await res.json();
        if (data.success) {
          window.location.href = `/id-photo/callback?idPhotoId=${data.idPhotoId}`;
        } else {
          setError(data.error || '생성 실패');
          setStep('ready');
        }
        return;
      }

      const reqRes = await fetch(`${API}/id-photo/payment/request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPhotoId })
      });
      const reqData = await reqRes.json();

      const TossPayments = await loadTossV1();
      const toss = TossPayments(reqData.clientKey);

      await toss.requestPayment('카드', {
        amount: reqData.amount,
        orderId: reqData.orderId,
        orderName: reqData.orderName,
        successUrl: `${window.location.origin}/id-photo/callback`,
        failUrl: `${window.location.origin}/id-photo?fail=true`,
      });
    } catch (e: any) {
      if (e?.code === 'USER_CANCEL') { setStep('ready'); return; }
      setError('결제 중 오류가 발생했습니다');
      setStep('ready');
    }
  };

  const reset = () => {
    setStep('upload');
    setPreview(null);
    setAnalysis(null);
    setIdPhotoId(null);
    setError(null);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Camera className="w-12 h-12 text-stone-400 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-stone-800 text-lg font-medium mb-2">로그인이 필요합니다</p>
          <p className="text-stone-500 text-sm mb-6">AI ID 포트레이트를 만들려면 먼저 로그인해주세요</p>
          <button onClick={() => { sessionStorage.setItem('afterLogin', '/id-photo'); nav('/?login=pair'); }} className="px-6 py-3 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 transition-colors">로그인</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => step === 'upload' ? nav(-1) : reset()} className="flex items-center gap-1 text-stone-600 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm">{step === 'upload' ? '뒤로' : '다시 찍기'}</span>
          </button>
          <span className="text-sm font-medium text-stone-900 tracking-tight">AI ID 포트레이트</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={() => setError(null)} className="text-xs text-red-500 mt-1 underline">닫기</button>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-stone-900 mb-2 tracking-tight">AI ID 포트레이트</h1>
              <p className="text-stone-500 text-sm">셀카 한 장으로 정합도 높은 정면 사진을 만들어보세요</p>
            </div>
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${dragOver ? 'border-stone-900 bg-stone-100' : 'border-stone-300 hover:border-stone-400 hover:bg-stone-100/50'}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Upload className="w-10 h-10 text-stone-400 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-stone-700 font-medium mb-1">사진을 끌어다 놓거나 클릭하세요</p>
              <p className="text-stone-400 text-xs">JPG, PNG / 10MB 이하 / 정면 얼굴 사진</p>
            </div>
            <div className="mt-8 p-5 bg-white border border-stone-200 rounded-xl">
              <p className="text-sm font-medium text-stone-800 mb-3">이렇게 만들어져요</p>
              <div className="space-y-2">
                {['AI가 얼굴 특징을 정밀 분석', 'AI가 정면 스튜디오 조명으로 자동 변환', 'AI 스냅에 바로 사용 가능한 고정합도 사진'].map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" strokeWidth={2} />
                    <span className="text-xs text-stone-600">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-xs text-stone-400 mt-4">1장 1,000원</p>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20">
            {preview && (
              <div className="w-32 h-40 rounded-xl overflow-hidden mb-6 shadow-lg">
                <img src={preview} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <Loader2 className="w-8 h-8 text-stone-400 animate-spin mb-4" strokeWidth={1.5} />
            <p className="text-stone-700 font-medium">얼굴을 분석하고 있어요</p>
            <p className="text-stone-400 text-xs mt-1">잠시만 기다려주세요</p>
          </div>
        )}

        {step === 'ready' && analysis && (
          <div>
            <div className="flex gap-5 mb-8">
              {preview && (
                <div className="w-28 h-36 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 mb-3">분석 완료</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
                    <span className="text-xs text-stone-600">{analysis.gender === 'male' ? '남성' : '여성'} / {analysis.age_range}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
                    <span className="text-xs text-stone-600">{analysis.hair}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
                    <span className="text-xs text-stone-600">{analysis.glasses ? '안경 착용' : '안경 미착용'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-white border border-stone-200 rounded-xl mb-6">
              <p className="text-sm font-medium text-stone-800 mb-2">정면 스튜디오 포트레이트로 변환됩니다</p>
              <p className="text-xs text-stone-500 leading-relaxed">균일한 조명, 깔끔한 배경, 얼굴 특징 최대 보존. AI 스냅 생성 시 정합도가 올라갑니다.</p>
            </div>

            <button
              onClick={handlePayment}
              className="w-full py-4 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
            >
              <span>{isAdmin ? '관리자 무료 생성' : '1,000원 결제하고 생성하기'}</span>
              <ChevronRight className="w-4 h-4" strokeWidth={2} />
            </button>
            <p className="text-center text-xs text-stone-400 mt-3">결제 후 30초 내에 AI가 사진을 생성합니다</p>
          </div>
        )}

        {step === 'paying' && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-stone-400 animate-spin mb-4" strokeWidth={1.5} />
            <p className="text-stone-700 font-medium">결제창으로 이동 중</p>
          </div>
        )}
      </main>

      <footer className="max-w-lg mx-auto px-4 pb-8 text-center">
        <a href="/" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">Made by 청첩장 작업실 ›</a>
      </footer>
    </div>
  );
}
