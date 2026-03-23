import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Play, Check, Loader2, ArrowRight, ArrowLeft, X, Clock, Sparkles, Film } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

interface FontOption {
  id: string;
  name: string;
  file: string;
}

interface BgmOption {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
}

interface VideoOrder {
  id: string;
  status: string;
  outputUrl?: string;
  totalDuration?: number;
  errorMsg?: string;
  scenes?: any[];
}

const TIERS = [
  { id: 'basic', name: 'Basic', price: 29000, label: '29,000원', desc: '사진 5장 · 30초 영상 · BGM 1곡' },
  { id: 'premium', name: 'Premium', price: 49000, label: '49,000원', desc: '사진 8장 · 45초 영상 · BGM 선택 · 자막 커스텀' },
];

export default function PreweddingVideo() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [metStory, setMetStory] = useState('');
  const [selectedTier, setSelectedTier] = useState('basic');
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [selectedFont, setSelectedFont] = useState('BMJUA_ttf');
  const [bgms, setBgms] = useState<BgmOption[]>([]);
  const [selectedBgm, setSelectedBgm] = useState<BgmOption | null>(null);
  const [playingBgm, setPlayingBgm] = useState<string | null>(null);
  const [audioRef] = useState(new Audio());
  const [processing, setProcessing] = useState(false);
  const [videoOrder, setVideoOrder] = useState<VideoOrder | null>(null);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${API}/prewedding-video/config`).then(r => r.json()).then(d => setFonts(d.fonts));
    fetch(`${API}/prewedding-video/bgm`).then(r => r.json()).then(d => { setBgms(d); if (d.length) setSelectedBgm(d[0]); });
    return () => { audioRef.pause(); if (pollInterval) clearInterval(pollInterval); };
  }, []);

  const uploadPhoto = useCallback(async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', 'wedding_unsigned');
    const res = await fetch('https://api.cloudinary.com/v1_1/duzlquvxj/image/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setPhotos(prev => [...prev, data.secure_url]);
    setUploading(false);
  }, []);

  const removePhoto = (idx: number) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const playBgm = (bgm: BgmOption) => {
    if (playingBgm === bgm.id) { audioRef.pause(); setPlayingBgm(null); return; }
    audioRef.src = bgm.url;
    audioRef.volume = 0.3;
    audioRef.play();
    setPlayingBgm(bgm.id);
  };

  const startPayment = async () => {
    const token = localStorage.getItem('token');
    if (!token) { alert('로그인이 필요합니다'); return; }

    setProcessing(true);
    try {
      const res = await fetch(`${API}/prewedding-video/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          groomName, brideName, weddingDate, metStory,
          photos, bgmId: selectedBgm?.id, bgmUrl: selectedBgm?.url,
          fontId: selectedFont, tier: selectedTier,
        }),
      });
      const order = await res.json();

      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
      const toss = await loadTossPayments(import.meta.env.VITE_TOSS_CLIENT_KEY);
      const payment = toss.payment({ customerKey: `PV-${Date.now()}` });
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: order.amount },
        orderId: order.orderId,
        orderName: order.label,
        successUrl: `${window.location.origin}/prewedding-video/success`,
        failUrl: `${window.location.origin}/prewedding-video/fail`,
      });
    } catch (e: any) {
      console.error('Payment error:', e);
      alert('결제 오류가 발생했습니다');
    }
    setProcessing(false);
  };

  // @ts-ignore
  const confirmPayment = useCallback(async (orderId: string, paymentKey: string, amount: number) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/prewedding-video/payment/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ orderId, paymentKey, amount }),
    });
    const data = await res.json();
    if (data.success) {
      setVideoOrder({ id: data.videoId, status: 'ANALYZING' });
      setStep(5);
      startPolling(data.videoId);
    }
  }, []);

  const startPolling = (videoId: string) => {
    const token = localStorage.getItem('token');
    const interval = setInterval(async () => {
      const res = await fetch(`${API}/prewedding-video/poll/${videoId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setVideoOrder(prev => prev ? { ...prev, ...data } : data);
      if (data.status === 'DONE' || data.status === 'FAILED') clearInterval(interval);
    }, 5000);
    setPollInterval(interval);
  };

  const STATUS_LABELS: Record<string, { label: string; icon: any; progress: number }> = {
    ANALYZING: { label: '사진 분석 중', icon: Sparkles, progress: 15 },
    GENERATING: { label: '영상 생성 중', icon: Film, progress: 50 },
    ASSEMBLING: { label: '영상 조립 중', icon: Clock, progress: 85 },
    DONE: { label: '완성', icon: Check, progress: 100 },
    FAILED: { label: '생성 실패', icon: X, progress: 0 },
  };

  const maxPhotos = selectedTier === 'premium' ? 8 : 5;

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F7', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 100px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, paddingTop: 16 }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <ArrowLeft size={20} color="#1a1a1a" />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', letterSpacing: -0.5 }}>식전영상</h1>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? '#1a1a1a' : '#E8E5E0', transition: 'background 0.3s' }} />
          ))}
        </div>

        {step === 0 && (
          <div>
            <p style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 8, letterSpacing: -0.5 }}>사진을 올려주세요</p>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>커플 사진 + 솔로 사진 {maxPhotos}장까지</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
              {photos.map((url, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 12, overflow: 'hidden' }}>
                  <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} color="#fff" />
                  </button>
                </div>
              ))}

              {photos.length < maxPhotos && (
                <label style={{ aspectRatio: '3/4', borderRadius: 12, border: '2px dashed #D5D0C8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff' }}>
                  {uploading ? <Loader2 size={24} className="animate-spin" color="#999" /> : <Upload size={24} color="#999" />}
                  <span style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>{photos.length}/{maxPhotos}</span>
                  <input type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(uploadPhoto); }} />
                </label>
              )}
            </div>

            <button onClick={() => setStep(1)} disabled={photos.length < 3} style={{ width: '100%', padding: '14px 0', borderRadius: 8, border: 'none', background: photos.length >= 3 ? '#1a1a1a' : '#E8E5E0', color: photos.length >= 3 ? '#fff' : '#bbb', fontSize: 14, fontWeight: 500, cursor: photos.length >= 3 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              다음 <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <p style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>커플 정보</p>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>영상에 표시될 이름과 날짜</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <input value={groomName} onChange={e => setGroomName(e.target.value)} placeholder="신랑 이름" style={{ padding: '14px 16px', borderRadius: 8, border: '1px solid #E0DDD8', fontSize: 14, outline: 'none' }} />
              <input value={brideName} onChange={e => setBrideName(e.target.value)} placeholder="신부 이름" style={{ padding: '14px 16px', borderRadius: 8, border: '1px solid #E0DDD8', fontSize: 14, outline: 'none' }} />
              <input type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} style={{ padding: '14px 16px', borderRadius: 8, border: '1px solid #E0DDD8', fontSize: 14, outline: 'none', color: weddingDate ? '#1a1a1a' : '#bbb' }} />
              <textarea value={metStory} onChange={e => setMetStory(e.target.value)} placeholder="우리의 이야기 힌트 (선택)&#10;예: 제주도에서 우연히 만났어요, 5년 연애 끝에..." rows={3} style={{ padding: '14px 16px', borderRadius: 8, border: '1px solid #E0DDD8', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
            </div>

            <button onClick={() => setStep(2)} disabled={!groomName || !brideName} style={{ width: '100%', padding: '14px 0', borderRadius: 8, border: 'none', background: groomName && brideName ? '#1a1a1a' : '#E8E5E0', color: groomName && brideName ? '#fff' : '#bbb', fontSize: 14, fontWeight: 500, cursor: groomName && brideName ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              다음 <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>글꼴 선택</p>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>자막에 사용할 글꼴</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, maxHeight: 400, overflowY: 'auto' }}>
              {fonts.map(f => (
                <button key={f.id} onClick={() => setSelectedFont(f.id)} style={{ padding: '16px', borderRadius: 10, border: selectedFont === f.id ? '2px solid #1a1a1a' : '1px solid #E0DDD8', background: selectedFont === f.id ? '#F5F3F0' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{f.name}</p>
                  <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>처음 만난 그 날부터</p>
                </button>
              ))}
            </div>

            <button onClick={() => setStep(3)} style={{ width: '100%', padding: '14px 0', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              다음 <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <p style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>배경음악 선택</p>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>영상에 깔릴 음악</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, maxHeight: 400, overflowY: 'auto' }}>
              {bgms.map(b => (
                <div key={b.id} onClick={() => setSelectedBgm(b)} style={{ padding: '14px 16px', borderRadius: 10, border: selectedBgm?.id === b.id ? '2px solid #1a1a1a' : '1px solid #E0DDD8', background: selectedBgm?.id === b.id ? '#F5F3F0' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{b.title}</p>
                    <p style={{ fontSize: 12, color: '#999' }}>{b.artist}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); playBgm(b); }} style={{ width: 36, height: 36, borderRadius: 18, background: playingBgm === b.id ? '#1a1a1a' : '#F0EDE8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {playingBgm === b.id ? <span style={{ width: 8, height: 8, background: '#fff', borderRadius: 2 }} /> : <Play size={14} color="#1a1a1a" fill="#1a1a1a" />}
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => { audioRef.pause(); setPlayingBgm(null); setStep(4); }} style={{ width: '100%', padding: '14px 0', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              다음 <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 4 && (
          <div>
            <p style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>주문 확인</p>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>모든 정보를 확인해주세요</p>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E5E0', padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#888' }}>커플</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{groomName} & {brideName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#888' }}>사진</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{photos.length}장</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#888' }}>글꼴</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{fonts.find(f => f.id === selectedFont)?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#888' }}>배경음악</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{selectedBgm?.title}</span>
              </div>
              {metStory && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: '#FAF9F7', borderRadius: 8 }}>
                  <p style={{ fontSize: 12, color: '#888' }}>우리의 이야기</p>
                  <p style={{ fontSize: 13, color: '#1a1a1a', marginTop: 4 }}>{metStory}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {TIERS.map(t => (
                <button key={t.id} onClick={() => setSelectedTier(t.id)} style={{ flex: 1, padding: '16px 12px', borderRadius: 10, border: selectedTier === t.id ? '2px solid #1a1a1a' : '1px solid #E0DDD8', background: selectedTier === t.id ? '#F5F3F0' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{t.name}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginTop: 4 }}>{t.label}</p>
                  <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{t.desc}</p>
                </button>
              ))}
            </div>

            <button onClick={startPayment} disabled={processing} style={{ width: '100%', padding: '16px 0', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {processing ? <Loader2 size={18} className="animate-spin" /> : null}
              {processing ? '처리 중...' : `${TIERS.find(t => t.id === selectedTier)?.label} 결제하기`}
            </button>
          </div>
        )}

        {step === 5 && videoOrder && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            {videoOrder.status === 'DONE' ? (
              <div>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Check size={32} color="#fff" />
                </div>
                <p style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>영상이 완성됐어요</p>
                <p style={{ fontSize: 13, color: '#999', marginBottom: 32 }}>{videoOrder.totalDuration}초</p>

                {videoOrder.outputUrl && (
                  <video src={videoOrder.outputUrl} controls playsInline style={{ width: '100%', maxWidth: 360, borderRadius: 12, marginBottom: 24 }} />
                )}

                <a href={videoOrder.outputUrl} download style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 8, background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                  다운로드
                </a>
              </div>
            ) : videoOrder.status === 'FAILED' ? (
              <div>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <X size={32} color="#cc0000" />
                </div>
                <p style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>생성에 실패했어요</p>
                <p style={{ fontSize: 13, color: '#999' }}>{videoOrder.errorMsg || '다시 시도해 주세요'}</p>
              </div>
            ) : (
              <div>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Loader2 size={28} color="#1a1a1a" className="animate-spin" />
                </div>
                <p style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
                  {STATUS_LABELS[videoOrder.status]?.label || '준비 중'}
                </p>
                <p style={{ fontSize: 13, color: '#999', marginBottom: 32 }}>약 8~10분 소요됩니다</p>

                <div style={{ width: '100%', height: 4, background: '#E8E5E0', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${STATUS_LABELS[videoOrder.status]?.progress || 10}%`, height: '100%', background: '#1a1a1a', borderRadius: 2, transition: 'width 1s ease' }} />
                </div>
                <p style={{ fontSize: 12, color: '#bbb', marginTop: 12 }}>이 페이지를 닫아도 괜찮아요. 완성되면 알려드릴게요.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
