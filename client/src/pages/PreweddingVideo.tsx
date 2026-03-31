import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, Play, Check, Loader2, ArrowRight, ArrowLeft, X, Clock, Sparkles, Film, Gift, Camera } from 'lucide-react';

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

const MODE_PRICING: Record<string, { amount: number; label: string; desc: string }> = {
  photo: { amount: 29000, label: '29,000', desc: 'AI 식전영상' },
  selfie: { amount: 39000, label: '39,000', desc: 'AI 화보팩 + 식전영상' },
};

export default function PreweddingVideo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const giftCode = searchParams.get('gift') || '';
  const [mode, setMode] = useState<'select' | 'create' | 'gift'>(searchParams.get('gift') ? 'create' : 'select');
  const [giftVerified, setGiftVerified] = useState(false);
  
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  
  const [metStory, setMetStory] = useState('');
  const [videoMode, setVideoMode] = useState<'photo' | 'selfie'>('photo');
  const [selectedConcept, setSelectedConcept] = useState('studio_classic');
  const [selfieConcepts, setSelfieConcepts] = useState<{id:string,name:string}[]>([]);
  const [venueName, setVenueName] = useState('');
  const [groomFather, setGroomFather] = useState('');
  const [groomMother, setGroomMother] = useState('');
  const [brideFather, setBrideFather] = useState('');
  const [brideMother, setBrideMother] = useState('');
  const [endingMessage, setEndingMessage] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [friendsList, setFriendsList] = useState('');
  const [specialThanks, setSpecialThanks] = useState('');
  const [creditTextColor, setCreditTextColor] = useState('#ffffff');
  
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [selectedFont, setSelectedFont] = useState('BMJUA_ttf');
  const [subtitleStyles, setSubtitleStyles] = useState<any[]>([]);
  const [selectedSubStyle, setSelectedSubStyle] = useState('poetic');
  const [bgms, setBgms] = useState<BgmOption[]>([]);
  const [selectedBgm, setSelectedBgm] = useState<BgmOption | null>(null);
  const [playingBgm, setPlayingBgm] = useState<string | null>(null);
  const [audioRef] = useState(new Audio());
  const [processing, setProcessing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [videoEngine, setVideoEngine] = useState<'seedance15'|'kling'>('seedance15');
  const [videoOrder, setVideoOrder] = useState<VideoOrder | null>(null);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try { const t = localStorage.getItem('token'); if (t) { const p = JSON.parse(atob(t.split('.')[1])); if (p.role === 'ADMIN') setIsAdmin(true); } } catch {}
    try {
      const saved = localStorage.getItem('pvFormData');
      if (saved) {
        const d = JSON.parse(saved);
        localStorage.removeItem('pvFormData');
        if (d.groomName) setGroomName(d.groomName);
        if (d.brideName) setBrideName(d.brideName);
        if (d.weddingDate) setWeddingDate(d.weddingDate);
        if (d.photos?.length) setPhotos(d.photos);
        if (d.videoMode) setVideoMode(d.videoMode);
        if (d.selectedConcept) setSelectedConcept(d.selectedConcept);
        if (d.selectedFont) setSelectedFont(d.selectedFont);
        if (d.selectedSubStyle) setSelectedSubStyle(d.selectedSubStyle);
        if (d.selectedBgm) setSelectedBgm(d.selectedBgm);
        if (d.venueName) setVenueName(d.venueName);
        if (d.groomFather) setGroomFather(d.groomFather);
        if (d.groomMother) setGroomMother(d.groomMother);
        if (d.brideFather) setBrideFather(d.brideFather);
        if (d.brideMother) setBrideMother(d.brideMother);
        if (d.endingMessage) setEndingMessage(d.endingMessage);
        if (d.familyMembers) setFamilyMembers(d.familyMembers);
        if (d.friendsList) setFriendsList(d.friendsList);
        if (d.specialThanks) setSpecialThanks(d.specialThanks);
        if (d.creditTextColor) setCreditTextColor(d.creditTextColor);
        if (d.metStory) setMetStory(d.metStory);
        if (d.step != null) { setMode('create'); setStep(d.step); }
      }
    } catch {}
    fetch(`${API}/prewedding-video/config`).then(r => r.json()).then(d => {
      setFonts(d.fonts);
      if (d.subtitleStyles) setSubtitleStyles(d.subtitleStyles);
      if (d.selfieConcepts) setSelfieConcepts(d.selfieConcepts);

    });
    fetch(`${API}/prewedding-video/bgm`).then(r => r.json()).then(d => { setBgms(d); });
    return () => { audioRef.pause(); if (pollInterval) clearInterval(pollInterval); };
  }, []);

  useEffect(() => {
    if (step < 2 || !fonts.length) return;
    fonts.forEach((f: FontOption) => {
      if (document.querySelector(`style[data-font="${f.id}"]`)) return;
      const style = document.createElement('style');
      style.setAttribute('data-font', f.id);
      style.textContent = `@font-face { font-family: '${f.id}'; src: url('/fonts/${f.file}') format('woff2'); font-display: swap; }`;
      document.head.appendChild(style);
    });
  }, [step, fonts]);

  useEffect(() => {
    if (giftCode && !giftVerified) {
      fetch(`${API}/video-gift/check/${giftCode}`)
        .then(r => r.json())
        .then(data => {
          if (data.tier && !data.isRedeemed && !data.expired) {
            setGiftVerified(true);
            
            setVideoMode(data.tier === 'selfie' ? 'selfie' : 'photo');
            setMode('create');
            setStep(0);
          } else if (data.isRedeemed) {
            setMode('create');
            setStep(0);
          } else {
            alert(data.expired ? '만료된 코드입니다' : '유효하지 않은 코드');
            setMode('select');
          }
        })
        .catch(() => setMode('select'));
    }
  }, []);


  const uploadPhoto = useCallback(async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'wedding_guide');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
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

  const loadTossScript = () => {
    return new Promise<void>((resolve) => {
      if (document.querySelector('script[src*="tosspayments"]')) return resolve();
      const script = document.createElement('script');
      script.src = 'https://js.tosspayments.com/v1/payment';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  };

  const startAdminFree = async () => {
    const token = localStorage.getItem('token');
    if (!token) { alert('로그인이 필요합니다'); return; }
    setProcessing(true);
    try {
      const res = await fetch(`${API}/prewedding-video/admin/free-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          groomName, brideName, weddingDate, metStory,
          photos, bgmUrl: selectedBgm?.url || '', fontId: selectedFont,
          subtitleStyle: selectedSubStyle, videoEngine,
          venueName, groomFather, groomMother, brideFather, brideMother, endingMessage, familyMembers, friendsList, specialThanks, creditTextColor,
          mode: videoMode, selfieConcepts: videoMode === 'selfie' ? [selectedConcept] : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVideoOrder({ id: data.videoId, status: 'ANALYZING' });
        setStep(5);
        startPolling(data.videoId);
      } else { alert(data.error || '실패'); }
    } catch { alert('실패'); }
    setProcessing(false);
  };

  const startPayment = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setShowLogin(true); return; }

    if (giftVerified && giftCode) {
      setProcessing(true);
      try {
        const res = await fetch(`${API}/prewedding-video/create-with-gift`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            groomName, brideName, weddingDate, metStory,
            photos, bgmId: selectedBgm?.id, bgmUrl: selectedBgm?.url,
            fontId: selectedFont, subtitleStyle: selectedSubStyle, giftCode,
            venueName, groomFather, groomMother, brideFather, brideMother, endingMessage, familyMembers, friendsList, specialThanks, creditTextColor,
            mode: videoMode, selfieConcepts: videoMode === 'selfie' ? [selectedConcept] : undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setVideoOrder({ id: data.videoId, status: 'ANALYZING' });
          setStep(5);
          startPolling(data.videoId);
        } else {
          alert(data.error || '실패');
        }
      } catch { alert('실패'); }
      setProcessing(false);
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`${API}/prewedding-video/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          groomName, brideName, weddingDate, metStory,
          photos, bgmId: selectedBgm?.id, bgmUrl: selectedBgm?.url, subtitleStyle: selectedSubStyle,
          fontId: selectedFont, tier: videoMode,
          venueName, groomFather, groomMother, brideFather, brideMother, endingMessage, familyMembers, friendsList, specialThanks, creditTextColor,
          mode: videoMode, selfieConcepts: videoMode === 'selfie' ? [selectedConcept] : undefined,
        }),
      });
      const order = await res.json();

      await loadTossScript();
      const clientKey = order.clientKey;
      const tossPayments = (window as any).TossPayments(clientKey);

      await tossPayments.requestPayment('카드', {
        amount: order.amount,
        orderId: order.orderId,
        orderName: order.label,
        customerName: `${groomName} & ${brideName}`,
        successUrl: `${window.location.origin}/prewedding-video/success?orderId=${order.orderId}`,
        failUrl: `${window.location.origin}/prewedding-video/fail`,
      });
    } catch (e: any) {
      console.error('Payment error:', e);
      if (e.code !== 'USER_CANCEL') alert('결제 오류가 발생했습니다');
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

  const maxPhotos = videoMode === 'selfie' ? 3 : 8;
  const minPhotos = videoMode === 'selfie' ? 1 : 3;

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F7', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 100px' }}>

        {mode === 'select' && (
          <div style={{ paddingTop: 12 }}>
            <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', marginBottom: 20, color: '#78716c', fontSize: 13 }}>
              <ArrowLeft size={16} />
              <span>돌아가기</span>
            </button>

            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <p style={{ fontSize: 10, letterSpacing: 4, color: '#b8b5b0', marginBottom: 14, textTransform: 'uppercase', fontWeight: 500 }}>Pre-Wedding Video</p>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: '#1a1a1a', marginBottom: 10, letterSpacing: -1, fontWeight: 300 }}>식전영상</h1>
              <p style={{ fontSize: 13, color: '#a8a29e', lineHeight: 1.8, letterSpacing: 0.3 }}>웨딩 사진이 영상이 되는 순간</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e5e0', overflow: 'hidden', marginBottom: 14 }}>
              <button onClick={() => { setMode('create'); setStep(0); }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '22px 20px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={20} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 3, letterSpacing: -0.3 }}>직접 만들기</p>
                  <p style={{ fontSize: 12, color: '#a8a29e', lineHeight: 1.4 }}>사진만 올리면 영상이 완성돼요</p>
                </div>
                <ArrowRight size={16} color="#d6d3d1" />
              </button>
              <div style={{ height: 1, background: '#f0ede8', margin: '0 20px' }} />
              <button onClick={() => navigate('/prewedding-video/gift')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '22px 20px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f5f3f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Gift size={20} color="#78716c" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 3, letterSpacing: -0.3 }}>선물하기</p>
                  <p style={{ fontSize: 12, color: '#a8a29e', lineHeight: 1.4 }}>소중한 분에게 식전영상을 선물하세요</p>
                </div>
                <ArrowRight size={16} color="#d6d3d1" />
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e5e0', padding: '22px 20px', marginBottom: 14 }}>
              <p style={{ fontSize: 10, letterSpacing: 3, color: '#b8b5b0', marginBottom: 18, textTransform: 'uppercase', fontWeight: 500 }}>How it works</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  ['01', '사진 업로드', '커플 + 솔로 사진 3~8장'],
                  ['02', 'AI 분석 & 생성', 'AI가 구성하고 영상화'],
                  ['03', '자막 & BGM', '감성 자막 + 배경음악 자동 합성'],
                  ['04', '다운로드', '완성된 영상을 바로 받아보세요'],
                ].map(([num, title, desc]) => (
                  <div key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: '#f5f3f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 600, color: '#a8a29e', fontFamily: "'Cormorant Garamond', serif" }}>{num}</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 2, letterSpacing: -0.2 }}>{title}</p>
                      <p style={{ fontSize: 11, color: '#a8a29e', lineHeight: 1.5 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid #e8e5e0', padding: '18px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 300, color: '#1a1a1a', fontFamily: "'Cormorant Garamond', serif", letterSpacing: -0.5 }}>29,000</p>
                <p style={{ fontSize: 10, color: '#a8a29e', marginTop: 6, letterSpacing: 0.5 }}>웨딩사진 모드</p>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid #e8e5e0', padding: '18px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 300, color: '#1a1a1a', fontFamily: "'Cormorant Garamond', serif", letterSpacing: -0.5 }}>39,000</p>
                <p style={{ fontSize: 10, color: '#a8a29e', marginTop: 6, letterSpacing: 0.5 }}>AI 화보팩 모드</p>
              </div>
            </div>
          </div>
        )}

        {mode === 'create' && (
        <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, paddingTop: 16 }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : setMode('select')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
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
            <p style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 6, letterSpacing: -0.5 }}>이미 화보촬영을 하셨나요?</p>
            <p style={{ fontSize: 13, color: '#a8a29e', marginBottom: 28, lineHeight: 1.6 }}>웨딩 사진이 없어도 AI가 화보를 만들어드려요</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <button onClick={() => { setVideoMode('photo'); setPhotos([]); }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '22px 20px', borderRadius: 14, border: videoMode === 'photo' ? '2px solid #1a1a1a' : '1px solid #E8E5E0', background: videoMode === 'photo' ? '#FAFAF8' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: videoMode === 'photo' ? '#1a1a1a' : '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  <Film size={20} color={videoMode === 'photo' ? '#fff' : '#a8a29e'} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 3 }}>네, 사진이 있어요</p>
                  <p style={{ fontSize: 12, color: '#a8a29e', lineHeight: 1.4 }}>웨딩 스냅 사진 3~8장으로 영상 생성</p>
                </div>
                <span style={{ fontSize: 18, fontWeight: 300, color: '#d6d3d1', fontFamily: 'serif' }}>29,000</span>
              </button>

              <button onClick={() => { setVideoMode('selfie'); setPhotos([]); }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '22px 20px', borderRadius: 14, border: videoMode === 'selfie' ? '2px solid #1a1a1a' : '1px solid #E8E5E0', background: videoMode === 'selfie' ? '#FAFAF8' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: videoMode === 'selfie' ? '#1a1a1a' : '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  <Camera size={20} color={videoMode === 'selfie' ? '#fff' : '#a8a29e'} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 3 }}>아니요, AI 화보 먼저 만들래요</p>
                  <p style={{ fontSize: 12, color: '#a8a29e', lineHeight: 1.4 }}>셀카 1~3장으로 AI 화보 + 영상 자동 생성</p>
                </div>
                <span style={{ fontSize: 18, fontWeight: 300, color: '#d6d3d1', fontFamily: 'serif' }}>39,000</span>
              </button>
            </div>

            {videoMode === 'selfie' && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 10 }}>화보 컨셉</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {selfieConcepts.map(c => (
                    <button key={c.id} onClick={() => setSelectedConcept(c.id)} style={{ padding: '10px 6px', borderRadius: 8, border: selectedConcept === c.id ? '2px solid #1a1a1a' : '1px solid #E0DDD8', background: selectedConcept === c.id ? '#F5F3F0' : '#fff', cursor: 'pointer', fontSize: 11, fontWeight: selectedConcept === c.id ? 600 : 400, color: selectedConcept === c.id ? '#1a1a1a' : '#999', textAlign: 'center', lineHeight: 1.3 }}>
                    {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {videoMode === 'selfie' ? (
              <div>
                <div style={{ background: '#F5F3F0', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#78716c', marginBottom: 6 }}>좋은 결과를 위한 팁</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p style={{ fontSize: 11, color: '#a8a29e', lineHeight: 1.5 }}>{'•'} 증명사진처럼 정면을 바라보는 사진이 가장 좋아요</p>
                    <p style={{ fontSize: 11, color: '#a8a29e', lineHeight: 1.5 }}>{'•'} 마스크, 선글라스, 모자 등은 피해주세요</p>
                    <p style={{ fontSize: 11, color: '#a8a29e', lineHeight: 1.5 }}>{'•'} 고화질 사진일수록 결과가 좋아요</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
                  {['신랑 사진', '신부 사진', '함께 찍은 사진'].map((label, i) => (
                    <div key={i}>
                      {photos[i] ? (
                        <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 12, overflow: 'hidden', border: '1px solid #E0DDD8' }}>
                          <img src={photos[i]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={() => setPhotos(p => { const n = [...p]; n.splice(i, 1); return n; })} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={14} color="#fff" />
                          </button>
                        </div>
                      ) : (
                        <label style={{ aspectRatio: '3/4', borderRadius: 12, border: '2px dashed #D5D0C8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff' }}>
                          {uploading ? <Loader2 size={20} className="animate-spin" color="#999" /> : <Upload size={20} color="#999" />}
                          <span style={{ fontSize: 11, color: '#bbb', marginTop: 6, textAlign: 'center', lineHeight: 1.3, padding: '0 4px' }}>{label}</span>
                          {i === 2 && <span style={{ fontSize: 10, color: '#d6d3d1', marginTop: 2 }}>(선택)</span>}
                          <input type="file" accept="image/*" hidden onChange={e => { if (e.target.files?.[0]) uploadPhoto(e.target.files[0]); }} />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>커플 사진 + 솔로 사진 {maxPhotos}장까지</p>
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
              </div>
            )}

            <button onClick={() => setStep(1)} disabled={photos.length < minPhotos} style={{ width: '100%', padding: '14px 0', borderRadius: 8, border: 'none', background: photos.length >= minPhotos ? '#1a1a1a' : '#E8E5E0', color: photos.length >= minPhotos ? '#fff' : '#bbb', fontSize: 14, fontWeight: 500, cursor: photos.length >= minPhotos ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              다음 <ArrowRight size={16} />
            </button>
          </div>
        )}
        {step === 1 && (
          <div>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 16, textAlign: 'center' }}>영상 엔딩에 이렇게 표시돼요</p>
            <div style={{ background: '#0a0a0a', borderRadius: 16, padding: '48px 24px 36px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', pointerEvents: 'none' }} />

              <div style={{ textAlign: 'center', fontFamily: "'DXMSUBTITLESM', sans-serif" }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
                  <input value={groomName} onChange={e => setGroomName(e.target.value)} placeholder="신랑" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 26, fontWeight: 400, textAlign: 'right', width: 110, padding: '4px 0', outline: 'none', fontFamily: 'inherit' }} />
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: 300 }}>&</span>
                  <input value={brideName} onChange={e => setBrideName(e.target.value)} placeholder="신부" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 26, fontWeight: 400, textAlign: 'left', width: 110, padding: '4px 0', outline: 'none', fontFamily: 'inherit' }} />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <input type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: weddingDate ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', fontSize: 14, textAlign: 'center', padding: '4px 0', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' }} />
                </div>

                <input value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="예식장 이름" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', width: '80%', padding: '4px 0', outline: 'none', fontFamily: 'inherit', marginBottom: 24, display: 'block', margin: '0 auto 24px' }} />

                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 8, letterSpacing: 1 }}>PARENTS <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>(선택)</span></p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 2 }}>{groomName || '신랑'} 측</p>
                    <input value={groomFather} onChange={e => setGroomFather(e.target.value)} placeholder="아버지" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', width: 80, padding: '3px 0', outline: 'none', fontFamily: 'inherit' }} />
                    <input value={groomMother} onChange={e => setGroomMother(e.target.value)} placeholder="어머니" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', width: 80, padding: '3px 0', outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 2 }}>{brideName || '신부'} 측</p>
                    <input value={brideFather} onChange={e => setBrideFather(e.target.value)} placeholder="아버지" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', width: 80, padding: '3px 0', outline: 'none', fontFamily: 'inherit' }} />
                    <input value={brideMother} onChange={e => setBrideMother(e.target.value)} placeholder="어머니" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', width: 80, padding: '3px 0', outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                </div>

                <textarea value={endingMessage} onChange={e => setEndingMessage(e.target.value)} placeholder="오늘, 우리의 영원이 시작됩니다" rows={2} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center', width: '90%', padding: '4px 0', outline: 'none', fontFamily: 'inherit', fontStyle: 'italic', letterSpacing: 0.5, resize: 'none', lineHeight: 1.8 }} />

                <div style={{ marginTop: 20, textAlign: 'center' }}>
                  {(groomFather || groomMother || brideFather || brideMother) && (
                    <div style={{ marginBottom: 8 }}>
                      {groomFather && <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{groomName}의 아버지  {groomFather}</p>}
                      {groomMother && <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{groomName}의 어머니  {groomMother}</p>}
                      {brideFather && <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{brideName}의 아버지  {brideFather}</p>}
                      {brideMother && <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{brideName}의 어머니  {brideMother}</p>}
                    </div>
                  )}
                  {familyMembers && <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', whiteSpace: 'pre-line' }}>{familyMembers}</p>}
                  {friendsList && <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', whiteSpace: 'pre-line', marginTop: 4 }}>{friendsList}</p>}
                  {specialThanks && <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', whiteSpace: 'pre-line', marginTop: 4 }}>{specialThanks}</p>}
                </div>
                <div style={{ marginTop: 16, overflow: 'hidden', height: 20 }}>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, letterSpacing: 2, animation: 'creditRoll 3s ease-in-out infinite', transform: 'translateY(20px)' }}>Made by 청첩장 작업실</p>
                </div>
                <style>{'@keyframes creditRoll { 0% { transform: translateY(24px); opacity: 0; } 30% { transform: translateY(0); opacity: 1; } 70% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-24px); opacity: 0; } }'}</style>
              </div>
            </div>


            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E5E0', padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Family</p>
                <span style={{ fontSize: 11, color: '#bbb' }}>우리의 안정적인 울타리</span>
              </div>
              <textarea value={familyMembers} onChange={e => setFamilyMembers(e.target.value)} placeholder={'\ud55c \uc904\uc5d0 \ud55c \uc0ac\ub78c\uc529 \uc785\ub825\ud574\uc8fc\uc138\uc694'} rows={3} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #E8E5E0', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit', color: '#1a1a1a', boxSizing: 'border-box' }} />
              <p style={{ fontSize: 11, color: '#ccc', marginTop: 6 }}>{'\uc5d4\ud130\ub85c \uc904\ubc14\uafc8 \uac00\ub2a5'}</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E5E0', padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Friends</p>
                <span style={{ fontSize: 11, color: '#bbb' }}>{'\ub098\uc758 \uae30\uc5b5\uc744 \ub098\ub208 \ud2b9\ubcc4\ud55c \uc774\ub4e4'}</span>
              </div>
              <textarea value={friendsList} onChange={e => setFriendsList(e.target.value)} placeholder={'\ud55c \uc904\uc5d0 \ud55c \uc0ac\ub78c\uc529 \uc785\ub825\ud574\uc8fc\uc138\uc694'} rows={3} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #E8E5E0', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit', color: '#1a1a1a', boxSizing: 'border-box' }} />
              <p style={{ fontSize: 11, color: '#ccc', marginTop: 6 }}>{'\uc5d4\ud130\ub85c \uc904\ubc14\uafc8 \uac00\ub2a5'}</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E5E0', padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Special Thanks</p>
              </div>
              <textarea value={specialThanks} onChange={e => setSpecialThanks(e.target.value)} placeholder={'\ud55c \uc904\uc5d0 \ud55c \uc0ac\ub78c\uc529 \uc785\ub825\ud574\uc8fc\uc138\uc694'} rows={3} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #E8E5E0', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit', color: '#1a1a1a', boxSizing: 'border-box' }} />
              <p style={{ fontSize: 11, color: '#ccc', marginTop: 6 }}>{'\uc5d4\ud130\ub85c \uc904\ubc14\uafc8 \uac00\ub2a5'}</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E5E0', padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{'\ud06c\ub808\ub527 \uae00\uc528 \uc0c9\uc0c1'}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {[{ c: '#ffffff', n: 'White' }, { c: '#d4af37', n: 'Gold' }, { c: '#f5f0e8', n: 'Cream' }, { c: '#e8b4b8', n: 'Rose' }, { c: '#b4cce8', n: 'Ice' }].map(p => (
                  <button key={p.c} onClick={() => setCreditTextColor(p.c)} style={{ width: 32, height: 32, borderRadius: '50%', background: p.c, border: creditTextColor === p.c ? '3px solid #1a1a1a' : '1px solid #ddd', cursor: 'pointer', boxShadow: creditTextColor === p.c ? '0 0 0 2px #fff, 0 0 0 4px #1a1a1a' : 'none' }} />
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="color" value={creditTextColor} onChange={e => setCreditTextColor(e.target.value)} style={{ width: 32, height: 32, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 4 }} />
                  <span style={{ fontSize: 11, color: '#999' }}>{'\uc9c1\uc811 \uc120\ud0dd'}</span>
                </label>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E5E0', padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>우리의 이야기</p>
                <span style={{ fontSize: 11, color: '#bbb' }}>(선택)</span>
              </div>
              <textarea value={metStory} onChange={e => setMetStory(e.target.value)} placeholder="예: 제주도에서 우연히 만났어요, 5년 연애 끝에..." rows={2} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #E8E5E0', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit', color: '#1a1a1a', boxSizing: 'border-box' }} />
              <p style={{ fontSize: 11, color: '#ccc', marginTop: 6 }}>AI가 이 힌트로 자막을 만들어요</p>
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
                  <p style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>{f.name}</p>
                  <p style={{ fontSize: 18, color: '#1a1a1a', fontFamily: `'${f.id}', sans-serif` }}>{f.id === 'GreatVibes-Regular' ? 'The day we first met' : '처음 만난 그 날부터'}</p>
                </button>
              ))}
            </div>

            <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginTop: 28, marginBottom: 12 }}>자막 스타일</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
              {subtitleStyles.map(s => (
                <button key={s.id} onClick={() => setSelectedSubStyle(s.id)} style={{ padding: '14px 12px', borderRadius: 10, border: selectedSubStyle === s.id ? '2px solid #1a1a1a' : '1px solid #E0DDD8', background: selectedSubStyle === s.id ? '#F5F3F0' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{s.name}</p>
                  <p style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{s.desc}</p>
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
                <span style={{ fontSize: 13, color: '#888' }}>결혼식</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{weddingDate || '-'}</span>
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

            {!isAdmin && (
              <div style={{ background: '#F5F3F0', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#78716c' }}>{MODE_PRICING[videoMode]?.desc}</span>
                <span style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', fontFamily: 'serif' }}>{MODE_PRICING[videoMode]?.label}<span style={{ fontSize: 13, fontWeight: 400 }}>원</span></span>
              </div>
            )}

            {isAdmin && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ background: '#F5F3F0', borderRadius: 12, padding: '12px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#78716c' }}>ADMIN 무료 생성</span>
                  <span style={{ fontSize: 11, color: '#a8a29e' }}>원가 ~${videoMode === 'selfie' ? '0.60' : '0.04'}</span>
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#78716c', marginBottom: 8 }}>영상 엔진</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ id: 'seedance15' as const, name: 'SD 1.5 Pro', cost: '$0.005' }, { id: 'kling' as const, name: 'Kling 3.0', cost: '$0.55' }].map(e => (
                    <button key={e.id} onClick={() => setVideoEngine(e.id)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: videoEngine === e.id ? '2px solid #1a1a1a' : '1px solid #E0DDD8', background: videoEngine === e.id ? '#F5F3F0' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{e.name}</p>
                      <p style={{ fontSize: 11, color: '#a8a29e' }}>{e.cost}/clip</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={isAdmin ? startAdminFree : startPayment} disabled={processing} style={{ width: '100%', padding: '16px 0', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {processing ? <Loader2 size={18} className="animate-spin" /> : null}
              {processing ? '처리 중...' : isAdmin ? '무료 생성 시작' : giftVerified ? '선물 코드로 시작하기' : `${MODE_PRICING[videoMode]?.label}원 결제하기`}
            </button>
          </div>
        )}

        </div>
        )}

        {mode === 'create' && step === 5 && videoOrder && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            {videoOrder.status === 'DONE' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 28, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Check size={28} color="#fff" />
                </div>
                <p style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>완성</p>
                <p style={{ fontSize: 12, color: '#bbb', marginBottom: 24 }}>{videoOrder.totalDuration ? Math.round(videoOrder.totalDuration) + '초' : ''}</p>

                {videoOrder.outputUrl && (
                  <video src={videoOrder.outputUrl} controls playsInline style={{ width: '100%', borderRadius: 12, marginBottom: 20 }} />
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button id="saveBtn" onClick={async () => {
                    if (!videoOrder.outputUrl) return;
                    const btn = document.getElementById('saveBtn');
                    if (btn) { btn.textContent = '준비 중...'; btn.setAttribute('disabled', 'true'); }
                    try {
                      const res = await fetch(videoOrder.outputUrl);
                      const blob = await res.blob();
                      const fileName = groomName + '_' + brideName + '_prewedding.mp4';
                      const file = new File([blob], fileName, { type: 'video/mp4' });
                      if (/iPhone|iPad|Android/i.test(navigator.userAgent) && navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({ files: [file] });
                      } else {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }
                    } catch (e: any) {
                      if (e.name !== 'AbortError') window.open(videoOrder.outputUrl!, '_blank');
                    } finally {
                      if (btn) { btn.removeAttribute('disabled'); btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> 저장'; }
                    }
                  }} style={{ flex: 1, minWidth: 140, padding: '13px 0', borderRadius: 10, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ArrowRight size={14} style={{ transform: 'rotate(90deg)' }} /> 저장
                  </button>
                  <button id="shareBtn" onClick={async () => {
                    if (!videoOrder.outputUrl) return;
                    const btn = document.getElementById('shareBtn');
                    if (btn) { btn.textContent = '준비 중...'; btn.setAttribute('disabled', 'true'); }
                    try {
                      const res = await fetch(videoOrder.outputUrl);
                      const blob = await res.blob();
                      const file = new File([blob], groomName + '_' + brideName + '.mp4', { type: 'video/mp4' });
                      if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({ files: [file] });
                      } else if (navigator.share) {
                        await navigator.share({ title: groomName + ' & ' + brideName, url: videoOrder.outputUrl });
                      } else {
                        await navigator.clipboard.writeText(videoOrder.outputUrl);
                        alert('링크가 복사됐어요');
                      }
                    } catch (e: any) {
                      if (e.name !== 'AbortError') {
                        try { await navigator.clipboard.writeText(videoOrder.outputUrl!); alert('링크가 복사됐어요'); } catch {}
                      }
                    } finally {
                      if (btn) { btn.textContent = ''; btn.removeAttribute('disabled'); btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg> 공유'; }
                    }
                  }} style={{ flex: 1, minWidth: 140, padding: '13px 0', borderRadius: 10, border: '1px solid #E0DDD8', background: '#fff', color: '#1a1a1a', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Upload size={14} /> 공유
                  </button>
                </div>
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
                <p style={{ fontSize: 13, color: '#999', marginBottom: 32 }}>약 3~5분 소요됩니다</p>

                <div style={{ width: '100%', height: 4, background: '#E8E5E0', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${STATUS_LABELS[videoOrder.status]?.progress || 10}%`, height: '100%', background: '#1a1a1a', borderRadius: 2, transition: 'width 1s ease' }} />
                </div>
                <p style={{ fontSize: 12, color: '#bbb', marginTop: 12 }}>이 페이지를 닫아도 괜찮아요. 대시보드에서 확인할 수 있어요.</p>
              </div>
            )}
          </div>
        )}
      </div>

        {showLogin && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowLogin(false)} />
            <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 380, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <button onClick={() => setShowLogin(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#bbb' }}><X size={20} /></button>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 6, textAlign: 'center' }}>로그인</h3>
              <p style={{ fontSize: 13, color: '#999', marginBottom: 24, textAlign: 'center' }}>결제를 위해 로그인이 필요해요</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => { const formData = { groomName, brideName, weddingDate, photos, videoMode, selectedConcept, selectedFont, selectedSubStyle, selectedBgm, venueName, groomFather, groomMother, brideFather, brideMother, endingMessage, familyMembers, friendsList, specialThanks, creditTextColor, metStory, step }; localStorage.setItem('pvFormData', JSON.stringify(formData)); localStorage.setItem('redirectAfterLogin', '/prewedding-video'); window.location.href = `${API}/oauth/kakao`; }} style={{ width: '100%', padding: '13px 0', background: '#FEE500', color: '#3C1E1E', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.3 4.54 6.7-.2.74-.73 2.64-.84 3.05-.13.5.18.5.39.36.16-.1 2.59-1.76 3.63-2.47.74.1 1.5.16 2.28.16 5.52 0 10-3.58 10-8s-4.48-8-10-8z" /></svg>
                  카카오로 시작하기
                </button>
                <button onClick={() => { const formData = { groomName, brideName, weddingDate, photos, videoMode, selectedConcept, selectedFont, selectedSubStyle, selectedBgm, venueName, groomFather, groomMother, brideFather, brideMother, endingMessage, familyMembers, friendsList, specialThanks, creditTextColor, metStory, step }; localStorage.setItem('pvFormData', JSON.stringify(formData)); localStorage.setItem('redirectAfterLogin', '/prewedding-video'); window.location.href = `${API}/oauth/google`; }} style={{ width: '100%', padding: '13px 0', background: '#fff', color: '#555', borderRadius: 10, border: '1px solid #E0DDD8', fontWeight: 500, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Google로 시작하기
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
