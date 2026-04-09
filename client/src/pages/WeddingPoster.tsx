import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';


const API = import.meta.env.VITE_API_URL;

type Track = 'PHOTO' | 'AI';
type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'film';
type Layout = 'CLASSIC' | 'MODERN' | 'BOLD' | 'MINIMAL';

interface Concept {
  id: string;
  label: string;
  sub: string;
}

interface ConceptMap {
  spring: Concept[];
  summer: Concept[];
  autumn: Concept[];
  winter: Concept[];
    film: Concept[];
}

const SEASON_META: Record<Season, { label: string; color: string; bg: string }> = {
  spring: { label: '봄', color: '#D4A0B0', bg: 'rgba(212,160,176,0.08)' },
  summer: { label: '여름', color: '#6B9E78', bg: 'rgba(107,158,120,0.08)' },
  autumn: { label: '가을', color: '#C4855C', bg: 'rgba(196,133,92,0.08)' },
  winter: { label: '겨울', color: '#8E9AAF', bg: 'rgba(142,154,175,0.08)' },
    film: { label: '필름', color: '#B8860B', bg: 'rgba(184,134,11,0.08)' },
};


const FONT_OPTIONS = [
  { id: 'script_elegant', label: 'Great Vibes', sample: 'Eternal Tides', family: "'Great Vibes', cursive" },
  { id: 'script_sacramento', label: 'Sacramento', sample: 'Eternal Tides', family: "'Sacramento', cursive" },
  { id: 'script_pinyon', label: 'Pinyon Script', sample: 'Eternal Tides', family: "'Pinyon Script', cursive" },
  { id: 'serif_classic', label: 'Playfair Display', sample: 'Eternal Tides', family: "'Playfair Display', serif" },
  { id: 'sans_modern', label: 'Montserrat', sample: 'Eternal Tides', family: "'Montserrat', sans-serif" },
  { id: 'calligraphy_kr', label: '마포꽃섬', family: "'MapoFlowerIsland', serif", sample: '영원한 물결' },
  { id: 'museum_classic', label: '국립박물관 클래식', family: "'MuseumClassic', serif", sample: '영원한 물결' },
];

export default function WeddingPoster() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [track, setTrack] = useState<Track | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState<Season>('spring');
  const [concepts, setConcepts] = useState<ConceptMap | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [groomFace, setGroomFace] = useState<File | null>(null);
  const [brideFace, setBrideFace] = useState<File | null>(null);
  const [groomFacePreview, setGroomFacePreview] = useState('');
  const [brideFacePreview, setBrideFacePreview] = useState('');
  const groomFaceRef = useRef<HTMLInputElement>(null);
  const brideFaceRef = useRef<HTMLInputElement>(null);

  const [groomNameKr, setGroomNameKr] = useState('');
  const [brideNameKr, setBrideNameKr] = useState('');
  const [groomNameEn, setGroomNameEn] = useState('');
  const [brideNameEn, setBrideNameEn] = useState('');
  const [titleText, setTitleText] = useState('');
  const [tagline, setTagline] = useState('');
  const [dateText, setDateText] = useState('');
  const [venueText, setVenueText] = useState('');

  const [fontId, setFontId] = useState('script_elegant');
  const [couponCode, setCouponCode] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<{title:string;tagline:string}[]>([]);

  const suggestWithAI = async () => {
    setSuggesting(true);
    setSuggestions([]);
    try {
      const r = await fetch(API + '/poster/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groomName: groomNameEn || groomNameKr, brideName: brideNameEn || brideNameKr }),
      });
      const d = await r.json();
      if (d.suggestions) setSuggestions(d.suggestions);
    } catch {}
    setSuggesting(false);
  };
  const [giftCode, setGiftCode] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [searchParams] = useSearchParams();

  const [orderStatus, setOrderStatus] = useState<'idle' | 'confirming' | 'generating' | 'done' | 'failed'>('idle');
  const [finalPosterUrl, setFinalPosterUrl] = useState('');

  useEffect(() => {
    const g = searchParams.get('gift');
    if (g) { setGiftCode(g); setIsGift(true); }
  }, [searchParams]);

  useEffect(() => {
    const oid = searchParams.get('orderId');
    const pk = searchParams.get('paymentKey');
    const amt = searchParams.get('amount');
    if (!oid || !pk) return;
    if (orderStatus !== 'idle') return;
    setOrderStatus('confirming');
    (async () => {
      try {
        const cRes = await fetch(`${API}/poster/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey: pk, orderId: oid, amount: Number(amt) }),
        });
        const cData = await cRes.json();
        if (!cData.success) { setOrderStatus('failed'); return; }
        setOrderStatus('generating');
        await fetch(`${API}/poster/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: oid }),
        });
        for (let i = 0; i < 120; i++) {
          await new Promise(r => setTimeout(r, 3000));
          const sRes = await fetch(`${API}/poster/status/${oid}`);
          const sData = await sRes.json();
          if (sData.status === 'DONE') {
            setFinalPosterUrl(sData.posterUrl);
            setOrderStatus('done');
            return;
          }
          if (sData.status === 'FAILED') { setOrderStatus('failed'); return; }
        }
        setOrderStatus('failed');
      } catch { setOrderStatus('failed'); }
    })();
  }, [searchParams, orderStatus]);
  const [layout] = useState<Layout>('CLASSIC');

  const [loading, setLoading] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const cv = previewRef.current;
      if (!cv) return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const W = 540, H = 720;
      cv.width = W; cv.height = H;

      const spaced = (text: string, n: number) => text.split('').join('\u2009'.repeat(n));
      const font = FONT_OPTIONS.find(fo => fo.id === fontId);
      const ff = font ? font.family.split(',')[0].replace(/'/g, '') : 'serif';
      const gName = groomNameEn || groomNameKr || 'Groom';
      const bName = brideNameEn || brideNameKr || 'Bride';
      const title = titleText || 'Eternal Tides';
      const tag = tagline || 'Some journeys never end';
      const info = [dateText || '2026. 06. 15', venueText].filter(Boolean).join('  \u00b7  ');
      const nameDisplay = gName + '  &  ' + bName;

      const drawBg = (bgImg?: HTMLImageElement) => {
        ctx.clearRect(0, 0, W, H);
        if (bgImg) {
          const s = Math.max(W / bgImg.width, H / bgImg.height);
          const sw = bgImg.width * s, sh = bgImg.height * s;
          ctx.drawImage(bgImg, (W - sw) / 2, (H - sh) / 2, sw, sh);
        } else {
          const bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, '#3d3835');
          bg.addColorStop(0.35, '#2e2a27');
          bg.addColorStop(0.65, '#252220');
          bg.addColorStop(1, '#1c1a18');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = 'rgba(255,255,255,0.008)';
          for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
        }
        const topV = ctx.createLinearGradient(0, 0, 0, H * 0.45);
        topV.addColorStop(0, 'rgba(0,0,0,0.5)');
        topV.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = topV;
        ctx.fillRect(0, 0, W, H * 0.45);
        const botV = ctx.createLinearGradient(0, H * 0.65, 0, H);
        botV.addColorStop(0, 'rgba(0,0,0,0)');
        botV.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = botV;
        ctx.fillRect(0, H * 0.65, W, H * 0.35);
      };

      const drawText = () => {
        ctx.textBaseline = 'middle';
        const shadow = (text: string, x: number, y: number, alpha: number) => {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.shadowColor = 'rgba(0,0,0,0.7)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 2;
          ctx.fillText(text, x, y);
          ctx.restore();
        };
        ctx.fillStyle = '#fff';
        if (layout === 'CLASSIC') {
          ctx.textAlign = 'center';
          ctx.font = '500 11px "Montserrat", sans-serif';
          shadow(spaced(nameDisplay.toUpperCase(), 3), W / 2, 62, 0.45);
          ctx.font = '300 52px "' + ff + '", Georgia, serif';
          shadow(title, W / 2, H * 0.44, 0.95);
          ctx.font = '300 13px "Montserrat", sans-serif';
          shadow(tag, W / 2, H * 0.44 + 40, 0.5);
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.fillRect(W / 2 - 20, H * 0.44 + 58, 40, 0.5);
          ctx.fillStyle = '#fff';
          ctx.font = '300 10px "Montserrat", sans-serif';
          shadow(info.toUpperCase(), W / 2, H - 44, 0.4);
        } else if (layout === 'MODERN') {
          ctx.textAlign = 'left';
          const lx = 32;
          ctx.font = '300 10px "Montserrat", sans-serif';
          shadow(spaced(nameDisplay.toUpperCase(), 2), lx, H - 160, 0.4);
          ctx.font = '300 42px "' + ff + '", Georgia, serif';
          shadow(title, lx, H - 108, 0.95);
          ctx.font = '300 11px "Montserrat", sans-serif';
          shadow(tag, lx, H - 70, 0.45);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(lx, H - 56, 30, 0.5);
          ctx.fillStyle = '#fff';
          ctx.font = '300 10px "Montserrat", sans-serif';
          shadow(info, lx, H - 38, 0.35);
        } else if (layout === 'BOLD') {
          ctx.textAlign = 'center';
          ctx.font = '300 72px "' + ff + '", Georgia, serif';
          shadow(title, W / 2, H * 0.42, 0.95);
          ctx.font = '300 12px "Montserrat", sans-serif';
          shadow(nameDisplay, W / 2, H * 0.42 + 50, 0.4);
          ctx.font = '300 10px "Montserrat", sans-serif';
          shadow(info.toUpperCase(), W / 2, H * 0.42 + 74, 0.35);
        } else {
          ctx.textAlign = 'center';
          ctx.font = '300 11px "Montserrat", sans-serif';
          const minLine = [gName + ' & ' + bName, title, dateText || '2026. 06. 15'].filter(Boolean).join('  \u00b7  ');
          shadow(minLine, W / 2, H - 32, 0.5);
        }
      };

      const drawWatermark = () => {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.font = '600 14px "Montserrat", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(W / 2, H / 2);
        ctx.rotate(-Math.PI / 6);
        for (let row = -7; row < 8; row++) {
          for (let col = -5; col < 6; col++) {
            ctx.fillText('WEDDING ENGINE', col * 160, row * 40);
          }
        }
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.font = '300 42px "Montserrat", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PREVIEW', W / 2, H / 2);
        ctx.restore();
      };

      const render = (bgImg?: HTMLImageElement) => {
        drawBg(bgImg);
        drawText();
        drawWatermark();
      };

      if (photoPreview && track === 'PHOTO') {
        const img = new Image();
        img.onload = () => render(img);
        img.onerror = () => render();
        img.src = photoPreview;
      } else {
        render();
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [step, photoPreview, track, groomNameKr, brideNameKr, groomNameEn, brideNameEn, titleText, tagline, dateText, venueText, fontId, layout]);


  const loadConcepts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/poster/concepts`);
      const data = await res.json();
      setConcepts(data);
    } catch (e) {}
  }, []);

  const handleTrackSelect = (t: Track) => {
    setTrack(t);
    if (t === 'AI' && !concepts) loadConcepts();
    setStep(1);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>, who: 'groom' | 'bride') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (who === 'groom') setGroomFace(file);
    else setBrideFace(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (who === 'groom') setGroomFacePreview(reader.result as string);
      else setBrideFacePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOrder = async () => {
    if (!track) return;
    setLoading(true);
    try {
      const authToken = localStorage.getItem('token');
      const res = await fetch(`${API}/poster/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({
          track,
          groomNameKr, groomNameEn,
          brideNameKr, brideNameEn,
          titleText, tagline, dateText, venueText,
          fontId, layout,
          conceptId: track === 'AI' ? selectedConcept : undefined,
          couponCode: couponCode || undefined,
          giftCode: giftCode || undefined,
          isAdmin: !!localStorage.getItem('token') || undefined,
        }),
      });
      const data = await res.json();

      if (track === 'PHOTO' && photoFile) {
        const formData = new FormData();
        formData.append('image', photoFile);
        formData.append('orderId', data.orderId);
        await fetch(`${API}/poster/upload`, { method: 'POST', body: formData });
      }

      if (track === 'AI' && (groomFace || brideFace)) {
        const fd = new FormData();
        if (groomFace) fd.append('faces', groomFace);
        if (brideFace) fd.append('faces', brideFace);
        fd.append('orderId', data.orderId);
        const ufRes = await fetch(`${API}/poster/upload-faces`, { method: 'POST', body: fd });
        const ufData = await ufRes.json();
        console.log('upload-faces result:', ufData);
        if (!ufData.success) throw new Error('Face upload failed');
      }

      if (data.amount === 0) {
        await fetch(`${API}/poster/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey: 'FREE', orderId: data.orderId, amount: 0 }),
        });
        window.location.href = `/poster/success?orderId=${data.orderId}&paymentKey=FREE&amount=0`;
        return;
      }

      const keyRes = await fetch(`${API}/snap-pack/toss-client-key`);
      const { clientKey } = await keyRes.json();

      const TossPayments = await new Promise<any>((resolve, reject) => {
        if ((window as any).TossPayments) { resolve((window as any).TossPayments); return; }
        const s = document.createElement('script');
        s.src = 'https://js.tosspayments.com/v1/payment';
        s.onload = () => resolve((window as any).TossPayments);
        s.onerror = () => reject(new Error('Toss SDK load failed'));
        document.head.appendChild(s);
      });
      const tp = TossPayments(clientKey);
      await tp.requestPayment('카드', {
        amount: data.amount,
        orderId: data.orderId,
        orderName: `웨딩포스터 ${track === 'PHOTO' ? '(사진)' : '(AI)'}`,
        successUrl: `${window.location.origin}/poster/success`,
        failUrl: `${window.location.origin}/poster/fail`,
      });
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const price = track === 'PHOTO' ? 3000 : 5000;

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFAF8' }}>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Sacramento&family=Pinyon+Script&family=Playfair+Display:wght@400;600&family=Montserrat:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        @font-face { font-family: 'MapoFlowerIsland'; src: url('/fonts/MapoFlowerIsland.ttf') format('truetype'); }
        @font-face { font-family: 'MuseumClassic'; src: url('/fonts/국립박물관문화재단클래식M.ttf') format('truetype'); }
      `}</style>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '60px 20px 120px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#A8A8A0', textDecoration: 'none', marginBottom: 24 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          돌아가기
        </Link>

        <header style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 11, letterSpacing: 4, color: '#A8A8A0', textTransform: 'uppercase', marginBottom: 8 }}>Wedding Engine</p>
          <h1 style={{ fontSize: 28, fontWeight: 300, color: '#2C2C2A', letterSpacing: -0.5, margin: 0 }}>Wedding Poster</h1>
          <p style={{ fontSize: 14, color: '#8A8A82', marginTop: 8, lineHeight: 1.6 }}>당신의 이야기를 한 장의 영화 포스터로</p>
        {isGift && (
          <div style={{ marginTop: 16, padding: '14px 20px', borderRadius: 10, background: 'rgba(107,158,120,0.08)', border: '1px solid rgba(107,158,120,0.2)' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#2C8C6B', margin: 0 }}>선물받은 이용권이 적용되었어요</p>
            <p style={{ fontSize: 12, color: '#6B9E78', margin: '4px 0 0' }}>무료로 웨딩포스터를 만들어보세요</p>
          </div>
        )}
        </header>

        {step === 0 && (
          <div>
            <p style={{ fontSize: 13, color: '#6B6B63', marginBottom: 20, textAlign: 'center' }}>어떤 방식으로 만들까요?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => handleTrackSelect('PHOTO')}
                style={{
                  padding: '28px 24px', border: '1px solid #E5E5E0', borderRadius: 12,
                  background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#C4C4BC')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E5E0')}
              >
                <p style={{ fontSize: 16, fontWeight: 500, color: '#2C2C2A', margin: '0 0 6px' }}>웨딩사진이 있어요</p>
                <p style={{ fontSize: 13, color: '#8A8A82', margin: '0 0 12px' }}>내 사진 위에 타이포그래피를 얹어드려요</p>
                <p style={{ fontSize: 20, fontWeight: 500, color: '#2C2C2A', margin: 0 }}>3,000<span style={{ fontSize: 13, fontWeight: 400, color: '#A8A8A0' }}>원</span></p>
              </button>
              <button
                onClick={() => handleTrackSelect('AI')}
                style={{
                  padding: '28px 24px', border: '1px solid #E5E5E0', borderRadius: 12,
                  background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#C4C4BC')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E5E0')}
              >
                <p style={{ fontSize: 16, fontWeight: 500, color: '#2C2C2A', margin: '0 0 6px' }}>AI가 만들어줘요</p>
                <p style={{ fontSize: 13, color: '#8A8A82', margin: '0 0 12px' }}>얼굴 사진만으로 시네마틱 포스터를 생성해요</p>
                <p style={{ fontSize: 20, fontWeight: 500, color: '#2C2C2A', margin: 0 }}>5,000<span style={{ fontSize: 13, fontWeight: 400, color: '#A8A8A0' }}>원</span></p>
              </button>
            </div>
          </div>
        )}

        {step === 1 && track === 'PHOTO' && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#2C2C2A', marginBottom: 16 }}>웨딩사진 업로드</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            {photoPreview ? (
              <div style={{ position: 'relative', marginBottom: 24 }}>
                <img src={photoPreview} alt="" style={{ width: '100%', borderRadius: 12, aspectRatio: '3/4', objectFit: 'cover' }} />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 32, height: 32, borderRadius: 16, border: 'none',
                    background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer', fontSize: 16,
                  }}
                >x</button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%', aspectRatio: '3/4', border: '2px dashed #D4D4CC',
                  borderRadius: 12, background: '#fff', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, marginBottom: 24,
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A8A8A0" strokeWidth="1.5"><path d="M12 16V4M12 4l-4 4M12 4l4 4M4 20h16"/></svg>
                <p style={{ fontSize: 14, color: '#8A8A82', margin: 0 }}>3:4 세로 사진을 권장해요</p>
              </button>
            )}
            <button
              onClick={() => setStep(2)}
              disabled={!photoFile}
              style={{
                width: '100%', padding: '16px', border: 'none', borderRadius: 10,
                background: photoFile ? '#2C2C2A' : '#E5E5E0',
                color: photoFile ? '#fff' : '#A8A8A0',
                fontSize: 15, fontWeight: 500, cursor: photoFile ? 'pointer' : 'default',
              }}
            >다음</button>
          </div>
        )}

        {step === 1 && track === 'AI' && concepts && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#2C2C2A', marginBottom: 16 }}>컨셉 선택</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {(Object.keys(SEASON_META) as Season[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSeason(s)}
                  style={{
                    flex: 1, padding: '10px 0', border: activeSeason === s ? `1.5px solid ${SEASON_META[s].color}` : '1px solid #E5E5E0',
                    borderRadius: 8, background: activeSeason === s ? SEASON_META[s].bg : '#fff',
                    color: activeSeason === s ? SEASON_META[s].color : '#8A8A82',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >{SEASON_META[s].label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {concepts[activeSeason]?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedConcept(c.id)}
                  style={{
                    padding: '20px', border: selectedConcept === c.id ? `1.5px solid ${SEASON_META[activeSeason].color}` : '1px solid #E5E5E0',
                    borderRadius: 10, background: selectedConcept === c.id ? SEASON_META[activeSeason].bg : '#fff',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  }}
                >
                  <p style={{ fontSize: 15, fontWeight: 500, color: '#2C2C2A', margin: '0 0 4px' }}>{c.label}</p>
                  <p style={{ fontSize: 13, color: '#8A8A82', margin: 0 }}>{c.sub}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedConcept}
              style={{
                width: '100%', padding: '16px', border: 'none', borderRadius: 10,
                background: selectedConcept ? '#2C2C2A' : '#E5E5E0',
                color: selectedConcept ? '#fff' : '#A8A8A0',
                fontSize: 15, fontWeight: 500, cursor: selectedConcept ? 'pointer' : 'default',
              }}
            >다음</button>
          </div>
        )}


        {step === 2 && track === 'AI' && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#2C2C2A', marginBottom: 8 }}>얼굴 사진 업로드</p>
            <p style={{ fontSize: 13, color: '#8A8A82', marginBottom: 20, lineHeight: 1.6 }}>정면 사진을 올려주세요. 모자나 선글라스는 피해주세요.</p>
            <input ref={groomFaceRef} type="file" accept="image/*" onChange={(e) => handleFaceUpload(e, 'groom')} style={{ display: 'none' }} />
            <input ref={brideFaceRef} type="file" accept="image/*" onChange={(e) => handleFaceUpload(e, 'bride')} style={{ display: 'none' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { label: '신랑', ref: groomFaceRef, preview: groomFacePreview, clear: () => { setGroomFace(null); setGroomFacePreview(''); } },
                { label: '신부', ref: brideFaceRef, preview: brideFacePreview, clear: () => { setBrideFace(null); setBrideFacePreview(''); } },
              ].map(({ label, ref, preview, clear }) => (
                <div key={label}>
                  <p style={{ fontSize: 12, color: '#8A8A82', marginBottom: 6 }}>{label}</p>
                  {preview ? (
                    <div style={{ position: 'relative' }}>
                      <img src={preview} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10 }} />
                      <button onClick={clear} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
                    </div>
                  ) : (
                    <button onClick={() => ref.current?.click()} style={{ width: '100%', aspectRatio: '1', border: '2px dashed #D4D4CC', borderRadius: 10, background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A8A8A0" strokeWidth="1.5"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3.1-6.5 7-6.5s7 3 7 6.5"/></svg>
                      <span style={{ fontSize: 12, color: '#A8A8A0' }}>{label}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(3)}
              disabled={!groomFace && !brideFace}
              style={{
                width: '100%', padding: '16px', border: 'none', borderRadius: 10,
                background: (groomFace || brideFace) ? '#2C2C2A' : '#E5E5E0',
                color: (groomFace || brideFace) ? '#fff' : '#A8A8A0',
                fontSize: 15, fontWeight: 500, cursor: (groomFace || brideFace) ? 'pointer' : 'default',
              }}
            >다음</button>
          </div>
        )}

        {((step === 2 && track === 'PHOTO') || (step === 3 && track === 'AI')) && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#2C2C2A', marginBottom: 20 }}>포스터 정보 입력</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#8A8A82', marginBottom: 4, display: 'block' }}>신랑 이름 (한글)</label>
                  <input value={groomNameKr} onChange={(e) => setGroomNameKr(e.target.value)} placeholder="허지훈"
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #E5E5E0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8A8A82', marginBottom: 4, display: 'block' }}>신부 이름 (한글)</label>
                  <input value={brideNameKr} onChange={(e) => setBrideNameKr(e.target.value)} placeholder="맹혜주"
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #E5E5E0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#8A8A82', marginBottom: 4, display: 'block' }}>신랑 이름 (영문)</label>
                  <input value={groomNameEn} onChange={(e) => setGroomNameEn(e.target.value)} placeholder="Jihoon Heo"
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #E5E5E0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8A8A82', marginBottom: 4, display: 'block' }}>신부 이름 (영문)</label>
                  <input value={brideNameEn} onChange={(e) => setBrideNameEn(e.target.value)} placeholder="Hyeju Maeng"
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #E5E5E0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, color: '#8A8A82' }}>타이틀 텍스트</label>
                  <button onClick={suggestWithAI} disabled={suggesting} style={{ fontSize: 11, color: '#B8860B', background: 'none', border: '1px solid #E5E0D8', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', opacity: suggesting ? 0.5 : 1 }}>
                    {suggesting ? 'AI 생성중...' : 'AI 추천'}
                  </button>
                </div>
                {suggestions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => { setTitleText(s.title); setTagline(s.tagline); setSuggestions([]); }}
                        style={{ textAlign: 'left', padding: '10px 12px', border: '1px solid #E8E5E0', borderRadius: 8, background: 'rgba(184,134,11,0.04)', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <p style={{ fontSize: 13, color: '#2C2C2A', margin: '0 0 2px', fontWeight: 500 }}>{s.title}</p>
                        <p style={{ fontSize: 11, color: '#8A8A82', margin: 0, fontStyle: 'italic' }}>{s.tagline}</p>
                      </button>
                    ))}
                  </div>
                )}
                <textarea value={titleText} onChange={(e) => setTitleText(e.target.value)} placeholder={"Eternal Tides\n(줄바꿈 가능)"} rows={2}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #E5E5E0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#8A8A82', marginBottom: 4, display: 'block' }}>태그라인</label>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Some journeys never end"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #E5E5E0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#8A8A82', marginBottom: 4, display: 'block' }}>날짜</label>
                  <input value={dateText} onChange={(e) => setDateText(e.target.value)} placeholder="2026. 03. 22 SUN"
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #E5E5E0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8A8A82', marginBottom: 4, display: 'block' }}>장소</label>
                  <input value={venueText} onChange={(e) => setVenueText(e.target.value)} placeholder="그랜드블랑 퀸덤홀 7F"
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #E5E5E0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep(track === 'AI' ? 4 : 3)}
              disabled={!groomNameKr && !groomNameEn}
              style={{
                width: '100%', padding: '16px', border: 'none', borderRadius: 10, marginTop: 24,
                background: (groomNameKr || groomNameEn) ? '#2C2C2A' : '#E5E5E0',
                color: (groomNameKr || groomNameEn) ? '#fff' : '#A8A8A0',
                fontSize: 15, fontWeight: 500, cursor: (groomNameKr || groomNameEn) ? 'pointer' : 'default',
              }}
            >다음</button>
          </div>
        )}

        {((step === 3 && track === 'PHOTO') || (step === 4 && track === 'AI')) && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#2C2C2A', marginBottom: 16 }}>글씨체 선택</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontId(f.id)}
                  style={{
                    padding: '18px 20px', border: fontId === f.id ? '1.5px solid #2C2C2A' : '1px solid #E5E5E0',
                    borderRadius: 10, background: fontId === f.id ? 'rgba(44,44,42,0.03)' : '#fff',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  }}
                >
                  <p style={{ fontSize: 13, color: '#8A8A82', margin: '0 0 4px' }}>{f.label}</p>
                  <p style={{ fontSize: 22, color: '#2C2C2A', margin: 0, fontWeight: 300, fontFamily: f.family }}>{f.sample}</p>
                </button>
              ))}
            </div>




            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#8A8A82', marginBottom: 10 }}>미리보기</p>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E5E0', background: '#1a1816' }}>
                <canvas ref={previewRef} style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: '3/4' }} />
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E5E5E0', borderRadius: 12, padding: '20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, color: '#6B6B63' }}>상품</span>
                <span style={{ fontSize: 14, color: '#2C2C2A' }}>웨딩포스터 ({track === 'PHOTO' ? '사진' : 'AI'})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#6B6B63' }}>결제 금액</span>
                <span style={{ fontSize: 18, fontWeight: 500, color: '#2C2C2A' }}>{price.toLocaleString()}원</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#A8A8A0', marginBottom: 4, display: 'block' }}>선물코드</label>
                <input value={giftCode} onChange={e => setGiftCode(e.target.value)} placeholder="PG-XXXXXXXX" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8E5E0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#A8A8A0', marginBottom: 4, display: 'block' }}>할인코드</label>
                <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="선택사항" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8E5E0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <button
              onClick={handleOrder}
              disabled={loading}
              style={{
                width: '100%', padding: '16px', border: 'none', borderRadius: 10,
                background: loading ? '#A8A8A0' : '#2C2C2A', color: '#fff',
                fontSize: 15, fontWeight: 500, cursor: loading ? 'default' : 'pointer',
              }}
            >{loading ? '처리 중...' : !!localStorage.getItem('token') ? '관리자 생성' : `${price.toLocaleString()}원 결제하기`}</button>
          </div>
        )}

        {step > 0 && orderStatus === 'idle' && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              display: 'block', margin: '20px auto 0', padding: '10px 20px',
              border: 'none', background: 'transparent', color: '#A8A8A0',
              fontSize: 13, cursor: 'pointer',
            }}
          >이전으로</button>
        )}

        {orderStatus === 'confirming' && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ width: 40, height: 40, border: '2px solid #E5E5E0', borderTopColor: '#2C2C2A', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 15, color: '#2C2C2A', fontWeight: 500 }}>결제 확인 중</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {orderStatus === 'generating' && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ width: 40, height: 40, border: '2px solid #E5E5E0', borderTopColor: '#2C2C2A', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 15, color: '#2C2C2A', fontWeight: 500, marginBottom: 8 }}>포스터를 만들고 있어요</p>
            <p style={{ fontSize: 13, color: '#8A8A82' }}>AI 트랙은 최대 3분 정도 걸려요</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {orderStatus === 'done' && finalPosterUrl && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 11, letterSpacing: 4, color: '#A8A8A0', textTransform: 'uppercase', marginBottom: 12 }}>Complete</p>
            <p style={{ fontSize: 20, fontWeight: 300, color: '#2C2C2A', marginBottom: 24 }}>포스터가 완성되었어요</p>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E5E0', marginBottom: 24 }}>
              <img src={finalPosterUrl} alt="Wedding Poster" style={{ width: '100%', display: 'block' }} />
            </div>
            <a href={finalPosterUrl} download style={{ display: 'inline-block', padding: '16px 40px', background: '#2C2C2A', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>다운로드</a>
            <Link to="/" style={{ display: 'block', marginTop: 16, fontSize: 13, color: '#A8A8A0', textDecoration: 'none' }}>홈으로</Link>
          </div>
        )}

        {orderStatus === 'failed' && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p style={{ fontSize: 20, fontWeight: 300, color: '#2C2C2A', marginBottom: 8 }}>문제가 발생했어요</p>
            <p style={{ fontSize: 13, color: '#8A8A82', marginBottom: 24 }}>다시 시도하거나 문의해주세요</p>
            <Link to="/poster" style={{ display: 'inline-block', padding: '14px 32px', background: '#2C2C2A', color: '#fff', borderRadius: 10, fontSize: 14, textDecoration: 'none' }}>다시 시도</Link>
          </div>
        )}

      </div>
    </div>
  );
}
