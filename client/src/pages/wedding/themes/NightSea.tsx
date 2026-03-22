import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, getDday, formatDateLocale, formatTimeLocale, getCalendarData, type ThemeProps } from './shared';


function HeroDustCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    let W = parent.clientWidth;
    let H = parent.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particles: { x: number; y: number; size: number; opacity: number; speed: number; drift: number; phase: number; twinkleSpeed: number }[] = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 1.8 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.15 + 0.05,
        drift: (Math.random() - 0.5) * 0.1,
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
      });
    }

    let raf: number;
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t++;
      for (const p of particles) {
        p.y -= p.speed;
        p.x += Math.sin(t * 0.01 + p.phase) * p.drift;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        const twinkle = 0.4 + Math.sin(t * p.twinkleSpeed + p.phase) * 0.6;
        const alpha = p.opacity * Math.max(0, twinkle);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 220, 255,' + alpha + ')';
        ctx.fill();
        if (p.size > 1.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(180, 210, 255,' + (alpha * 0.12) + ')';
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => {
      if (!parent) return;
      W = parent.clientWidth;
      H = parent.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }} />;
}

function NightSeaPreviewBg() {
  return (
    <div className="absolute inset-0" style={{ zIndex: 0 }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #070B14 0%, #0a1e32 15%, #0d2844 40%, #0f3a5e 70%, #1a5276 85%, #2a7da8 100%)' }} />
      {[...Array(50)].map((_,i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: (i * 31 % 100) + '%',
          top: (i * 17 % 55) + '%',
          width: i % 5 === 0 ? 2 : 1,
          height: i % 5 === 0 ? 2 : 1,
          background: 'rgba(255,255,255,' + (0.15 + ((i * 7) % 50) / 100) + ')',
          animation: 'twinkle ' + (2 + i % 3) + 's ease-in-out infinite',
          animationDelay: (i * 0.3) + 's',
        }} />
      ))}
      <div className="absolute" style={{ top: '6%', right: '18%', width: 40, height: 40, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,220,0.12) 0%,transparent 70%)', boxShadow: '0 0 30px rgba(255,255,200,0.06)' }} />
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '22%' }}>
        <svg viewBox="0 0 400 80" preserveAspectRatio="none" className="absolute w-full" style={{ bottom: 40, height: 40, opacity: 0.25 }}><path d="M0,40 Q50,20 100,40 T200,40 T300,40 T400,40 V80 H0Z" fill="rgba(42,125,168,0.5)"><animate attributeName="d" dur="6s" repeatCount="indefinite" values="M0,40 Q50,20 100,40 T200,40 T300,40 T400,40 V80 H0Z;M0,42 Q50,25 100,38 T200,42 T300,38 T400,42 V80 H0Z;M0,40 Q50,20 100,40 T200,40 T300,40 T400,40 V80 H0Z" /></path></svg>
        <svg viewBox="0 0 400 80" preserveAspectRatio="none" className="absolute w-full" style={{ bottom: 15, height: 40, opacity: 0.35 }}><path d="M0,45 Q60,25 120,45 T240,45 T360,40 T400,45 V80 H0Z" fill="rgba(26,82,118,0.6)"><animate attributeName="d" dur="5s" repeatCount="indefinite" values="M0,45 Q60,25 120,45 T240,45 T360,40 T400,45 V80 H0Z;M0,43 Q60,30 120,43 T240,47 T360,42 T400,43 V80 H0Z;M0,45 Q60,25 120,45 T240,45 T360,40 T400,45 V80 H0Z" /></path></svg>
        <svg viewBox="0 0 400 80" preserveAspectRatio="none" className="absolute w-full" style={{ bottom: 0, height: 30, opacity: 0.5 }}><path d="M0,50 Q40,35 80,50 T160,50 T240,48 T320,50 T400,50 V80 H0Z" fill="rgba(10,30,50,0.8)"><animate attributeName="d" dur="4s" repeatCount="indefinite" values="M0,50 Q40,35 80,50 T160,50 T240,48 T320,50 T400,50 V80 H0Z;M0,48 Q40,38 80,48 T160,52 T240,46 T320,52 T400,48 V80 H0Z;M0,50 Q40,35 80,50 T160,50 T240,48 T320,50 T400,50 V80 H0Z" /></path></svg>
      </div>
      <style>{`@keyframes twinkle { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}

function NightSeaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const starsRef = useRef<{ x: number; y: number; s: number; o: number; p: number; sp: number }[]>([]);
  const shootingRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; tail: [number, number][] }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SCALE = 4;
    let W = 0, H = 0, dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (starsRef.current.length === 0) {
        const stars = [];
        for (let i = 0; i < 200; i++) {
          stars.push({
            x: Math.random() * W * SCALE - W * (SCALE - 1) / 2,
            y: Math.random() * H * 0.72,
            s: Math.random() * 1.8 + 0.3,
            o: Math.random() * 0.6 + 0.2,
            p: Math.random() * Math.PI * 2,
            sp: Math.random() * 0.008 + 0.002,
          });
        }
        starsRef.current = stars;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const noise = (x: number, y: number, t: number) => {
      const n1 = Math.sin(x * 0.003 + t * 0.4) * Math.cos(y * 0.005 + t * 0.3);
      const n2 = Math.sin(x * 0.007 - t * 0.2) * Math.sin(y * 0.003 + t * 0.5);
      const n3 = Math.cos(x * 0.002 + y * 0.004 + t * 0.15);
      const n4 = Math.sin(x * 0.0015 + t * 0.08) * Math.cos(y * 0.002 - t * 0.12);
      return (n1 + n2 + n3 + n4) * 0.25;
    };

    let raf: number;
    const draw = () => {
      frameRef.current++;
      const t = frameRef.current * 0.012;
      ctx.clearRect(0, 0, W, H);

      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.85);
      skyGrad.addColorStop(0, '#020810');
      skyGrad.addColorStop(0.3, '#040E1A');
      skyGrad.addColorStop(0.6, '#071828');
      skyGrad.addColorStop(1, '#0A1E32');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      starsRef.current.forEach((star) => {
        star.p += star.sp;
        const tw = (Math.sin(star.p) * 0.5 + 0.5);
        const alpha = star.o * tw;
        if (alpha < 0.05) return;
        const sx = ((star.x % (W * SCALE)) + W * SCALE) % (W * SCALE) - W * (SCALE - 1) / 2;
        if (sx < -10 || sx > W + 10 || star.y < -10) return;
        ctx.beginPath();
        ctx.arc(sx, star.y, star.s * (0.6 + tw * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180,200,230,' + alpha + ')';
        ctx.fill();
        if (star.s > 1.2 && tw > 0.7) {
          ctx.beginPath();
          ctx.arc(sx, star.y, star.s * 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(150,185,230,' + (alpha * 0.08) + ')';
          ctx.fill();
        }
      });

      const moonX = W * 0.78;
      const moonY = H * 0.12;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 120);
      moonGlow.addColorStop(0, 'rgba(200,215,240,0.06)');
      moonGlow.addColorStop(0.5, 'rgba(160,185,220,0.02)');
      moonGlow.addColorStop(1, 'rgba(100,140,180,0)');
      ctx.fillStyle = moonGlow;
      ctx.fillRect(moonX - 120, moonY - 120, 240, 240);
      ctx.beginPath();
      ctx.arc(moonX, moonY, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(210,225,245,0.3)';
      ctx.fill();

      if (Math.random() < 0.008) {
        const startX = Math.random() * W * 0.8 + W * 0.1;
        const startY = Math.random() * H * 0.25;
        const angle = Math.PI * 0.6 + Math.random() * 0.4;
        const speed = 1.2 + Math.random() * 1.5;
        shootingRef.current.push({
          x: startX, y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 80 + Math.random() * 60,
          size: 1.2 + Math.random() * 1,
          tail: [],
        });
      }

      shootingRef.current = shootingRef.current.filter((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        s.tail.push([s.x, s.y]);
        if (s.tail.length > 25) s.tail.shift();

        const progress = s.life / s.maxLife;
        const fadeIn = Math.min(s.life / 10, 1);
        const fadeOut = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
        const alpha = fadeIn * fadeOut;

        if (s.tail.length > 1) {
          for (let j = 1; j < s.tail.length; j++) {
            const tailAlpha = (j / s.tail.length) * alpha * 0.5;
            const tailSize = s.size * (j / s.tail.length) * 0.6;
            ctx.beginPath();
            ctx.arc(s.tail[j][0], s.tail[j][1], Math.max(0.1, tailSize), 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200,220,255,' + tailAlpha + ')';
            ctx.fill();
          }
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0.1, s.size * alpha), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220,235,255,' + alpha * 0.9 + ')';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180,210,255,' + alpha * 0.12 + ')';
        ctx.fill();

        return s.life < s.maxLife;
      });

      const waveBase = H * 0.78;
      const extL = -W * (SCALE - 1) / 2;
      const extR = W + W * (SCALE - 1) / 2;

      const layers = [
        { yOff: 0, amp: 35, color: [8, 30, 58], alpha: 0.95, speed: 0.3 },
        { yOff: 12, amp: 28, color: [12, 42, 75], alpha: 0.85, speed: 0.45 },
        { yOff: 28, amp: 22, color: [18, 55, 90], alpha: 0.75, speed: 0.6 },
        { yOff: 42, amp: 18, color: [22, 65, 105], alpha: 0.65, speed: 0.8 },
        { yOff: 55, amp: 14, color: [28, 78, 120], alpha: 0.55, speed: 1.0 },
        { yOff: 68, amp: 10, color: [35, 90, 135], alpha: 0.45, speed: 1.3 },
      ];

      layers.forEach((layer) => {
        ctx.beginPath();
        let first = true;
        for (let x = extL; x <= extR; x += 2) {
          const n = noise(x, layer.yOff, t * layer.speed);
          const swell = Math.sin(x * 0.001 + t * 0.15) * layer.amp * 0.5;
          const y = waveBase + layer.yOff + n * layer.amp + swell;
          const cx = (x - extL) / (extR - extL) * W;
          if (first) { ctx.moveTo(cx, y); first = false; } else { ctx.lineTo(cx, y); }
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();

        const r = layer.color[0], g = layer.color[1], b = layer.color[2];
        const hueShift = Math.sin(t * 0.2 + layer.yOff * 0.01) * 8;
        ctx.fillStyle = 'rgba(' + Math.round(r + hueShift) + ',' + Math.round(g + hueShift * 0.5) + ',' + Math.round(b + hueShift * 0.3) + ',' + layer.alpha + ')';
        ctx.fill();
      });

      const crestY = waveBase;
      for (let x = extL; x <= extR; x += 3) {
        const n = noise(x, 0, t * 0.3);
        const y = crestY + n * 35;
        const cx = (x - extL) / (extR - extL) * W;
        const foamN = noise(x * 3, 100, t * 2);
        if (foamN > 0.15) {
          const foamAlpha = (foamN - 0.15) * 0.6;
          ctx.beginPath();
          ctx.arc(cx, y, 1.5 + foamN * 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(180,215,245,' + Math.min(foamAlpha, 0.25) + ')';
          ctx.fill();
        }
      }

      const shimmerCount = 15;
      for (let i = 0; i < shimmerCount; i++) {
        const phase = t * 0.4 + i * 2.094;
        const sx = (Math.sin(phase * 0.7 + i * 1.3) * 0.5 + 0.5) * W;
        const sy = waveBase + 10 + Math.sin(phase) * 12 + i * 4;
        const sa = (Math.sin(phase * 1.5) * 0.5 + 0.5) * 0.3;
        if (sa < 0.03) continue;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(160,210,250,' + sa + ')';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(140,200,250,' + (sa * 0.15) + ')';
        ctx.fill();
      }

      const depthGrad = ctx.createLinearGradient(0, H * 0.88, 0, H);
      depthGrad.addColorStop(0, 'rgba(4,14,26,0)');
      depthGrad.addColorStop(1, 'rgba(4,14,26,0.95)');
      ctx.fillStyle = depthGrad;
      ctx.fillRect(0, H * 0.88, W, H * 0.12);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

export default function NightSea({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot, locale, isPreview }: ThemeProps & { isPreview?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [openAccount, setOpenAccount] = useState<string | null>(null);
  const [openRsvp, setOpenRsvp] = useState(false);
  const [openGuestbook, setOpenGuestbook] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [localGuestbooks, setLocalGuestbooks] = useState(guestbooks || []);

  useEffect(() => { setLocalGuestbooks(guestbooks || []); }, [guestbooks]);
  const handleGuestbookDelete = (id: string) => { setLocalGuestbooks(prev => prev.filter(g => g.id !== id)); };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'ZenSerif';
        src: url('/fonts/ZEN-SERIF-TTF-Regular.woff2') format('woff2'),
             url('/fonts/ZEN-SERIF-TTF-Regular.woff') format('woff');
        font-weight: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    if (wedding.bgMusicAutoPlay && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [wedding.bgMusicAutoPlay]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleShare = async (type: 'kakao' | 'instagram' | 'sms', version?: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = version ? `${baseUrl}?v=${version}` : baseUrl;
    const title = `${wedding.groomName} & ${wedding.brideName}`;
    if (type === 'kakao' && window.Kakao) {
      window.Kakao.Share.sendDefault({ objectType: 'feed', content: { title, description: formatDateLocale(wedding.weddingDate, 'full', locale), imageUrl: wedding.ogCoverType === 'envelope' ? ({"black_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/7_errq8w.png", "white_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "navy_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/1_zdaupp.png", "black_silver": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "olive_ribbon_a": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/3_wdfeio.png", "olive_ribbon_b": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png", "pink_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/5_pzmfwy.png", "white_bow": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/11_o3gnaj.png", "white_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "black_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "pink_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551604/6_akrfek.png", "olive_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png"}[wedding.envelopeStyle || 'black_ribbon'] || wedding.heroMedia || '') : (wedding.heroMedia || ''), link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }] });
    } else if (type === 'instagram') {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.');
    } else if (type === 'sms') {
      window.location.href = `sms:?&body=${encodeURIComponent(`${title}\n${url}`)}`;
    }
    setShowShareModal(false);
  };

  const calendarData = getCalendarData(wedding.weddingDate);
  const galleries = wedding.galleries || [];
  const f = { fontFamily: "'ZenSerif', 'Noto Serif KR', serif" };
  const c = {
    bg: '#070B14',
    card: 'rgba(12, 22, 45, 0.5)',
    text: '#B8CCE0',
    textSoft: 'rgba(160, 190, 220, 0.6)',
    textFaint: 'rgba(140, 170, 200, 0.35)',
    border: 'rgba(100, 160, 220, 0.1)',
    accent: 'rgba(100, 180, 240, 0.15)',
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: 'easeOut' } }
  };

  const AccordionSection = ({ title, isOpen, onToggle, children }: { title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) => (
    <div style={{ background: c.card, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${c.border}`, borderRadius: '16px' }}>
      <button onClick={onToggle} className="w-full px-7 py-6 flex items-center justify-between">
        <span className="text-[0.85rem] tracking-wider" style={{ ...f, color: c.text }}>{title}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} style={{ color: c.textFaint }} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: 'easeInOut' }} className="overflow-hidden">
            <div className="px-7 pb-7" style={{ borderTop: `1px solid ${c.border}` }}>
              <div className="pt-6">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen relative" style={{ background: c.bg }}>
      {isPreview ? <NightSeaPreviewBg /> : <NightSeaCanvas />}
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(7, 11, 20, 0.8)', backdropFilter: 'blur(10px)', border: `1px solid ${c.border}` }}>
          {isPlaying ? <Volume2 className="w-4 h-4" style={{ color: c.text }} /> : <VolumeX className="w-4 h-4" style={{ color: c.textFaint }} />}
        </button>
      )}

      <section className="min-h-screen flex flex-col justify-center items-center px-6 relative" style={{ zIndex: 1 }}>
        {wedding.heroMedia && (
          <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 2 } } }} className="w-full max-w-md">
            <div className="relative" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 0 80px rgba(42, 125, 168, 0.15), 0 0 40px rgba(15, 58, 94, 0.2)' }}>
              <div className="absolute inset-0 rounded-[12px] pointer-events-none" style={{ zIndex: 3, border: '1px solid transparent', background: 'linear-gradient(180deg, rgba(160,210,255,0.15) 0%, rgba(42,125,168,0.25) 60%, rgba(26,82,118,0.4) 85%, rgba(10,30,50,0.6) 100%) border-box', WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
              <div className="absolute bottom-0 left-0 right-0 h-[25%] pointer-events-none" style={{ zIndex: 3, background: 'linear-gradient(0deg, rgba(10,30,50,0.5) 0%, rgba(13,40,68,0.2) 40%, transparent 100%)' }} />
              <div className="aspect-[3/4] overflow-hidden">
                {wedding.heroMediaType === 'VIDEO' ? (
                  <video src={heroUrl(wedding.heroMedia)} autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: 'saturate(0.8) brightness(0.9) contrast(1.05)' }} />
                ) : (
                  <img src={heroUrl(wedding.heroMedia)} alt="" className="w-full h-full object-cover" style={{ filter: 'saturate(0.8) brightness(0.9) contrast(1.05)' }} />
                )}
              </div>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7, 11, 20, 0.1) 0%, transparent 30%, transparent 55%, rgba(7, 11, 20, 0.85) 100%)' }} />
              <HeroDustCanvas />
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <div className="flex items-center justify-center gap-6 mb-4">
                  <span className="text-[1.5rem]" style={{ ...f, color: '#E0EAF4' }}>{wedding.groomName}</span>
                  <span className="text-[0.85rem]" style={{ color: 'rgba(160, 190, 220, 0.4)' }}>&</span>
                  <span className="text-[1.5rem]" style={{ ...f, color: '#E0EAF4' }}>{wedding.brideName}</span>
                </div>
                <p className="text-[0.72rem] tracking-[0.2em]" style={{ ...f, color: 'rgba(180, 200, 224, 0.6)' }}>{formatDateLocale(wedding.weddingDate, 'dots', locale)}</p>
                {wedding.showDday && <p className="mt-3 text-[0.62rem] tracking-widest" style={{ ...f, color: 'rgba(140, 170, 200, 0.4)' }}>{getDday(wedding.weddingDate)}</p>}
              </div>
            </div>
          </motion.div>
        )}
        {!wedding.heroMedia && (
          <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 2 } } }} className="text-center">
            <div className="flex items-center justify-center gap-6 mb-6">
              <span className="text-[2rem]" style={{ ...f, color: '#E0EAF4' }}>{wedding.groomName}</span>
              <span className="text-[1rem]" style={{ color: 'rgba(160, 190, 220, 0.4)' }}>&</span>
              <span className="text-[2rem]" style={{ ...f, color: '#E0EAF4' }}>{wedding.brideName}</span>
            </div>
            <p className="text-[0.8rem] tracking-[0.2em]" style={{ ...f, color: 'rgba(180, 200, 224, 0.6)' }}>{formatDateLocale(wedding.weddingDate, 'dots', locale)}</p>
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="absolute bottom-10">
          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: 'rgba(160, 190, 220, 0.3)' }} />
        </motion.div>
      </section>

      {wedding.greeting && (
        <section className="py-28 px-8 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeIn} className="max-w-md mx-auto text-center">
            {wedding.greetingTitle && <p className="text-[1rem] mb-10" style={{ ...f, color: c.text }}>{wedding.greetingTitle}</p>}
            <p className="text-[0.82rem] leading-[2.6] whitespace-pre-line" style={{ ...f, color: c.textSoft }}>{wedding.greeting}</p>
            {wedding.showParents && (
              <div className="mt-14 pt-10" style={{ borderTop: `1px solid ${c.border}` }}>
                <div className="space-y-3.5" style={f}>
                  <p className="text-[0.72rem]" style={{ color: c.textSoft }}>
                    <span style={{ color: c.textFaint }}>{wedding.groomFatherName} · {wedding.groomMotherName}</span>
                    <span className="mx-3" style={{ color: 'rgba(140, 170, 200, 0.2)' }}>{locale === 'en' ? 'Son of' : '의 아들'}</span>
                    <span style={{ color: c.text }}>{wedding.groomName}</span>
                  </p>
                  <p className="text-[0.72rem]" style={{ color: c.textSoft }}>
                    <span style={{ color: c.textFaint }}>{wedding.brideFatherName} · {wedding.brideMotherName}</span>
                    <span className="mx-3" style={{ color: 'rgba(140, 170, 200, 0.2)' }}>{locale === 'en' ? 'Daughter of' : '의 딸'}</span>
                    <span style={{ color: c.text }}>{wedding.brideName}</span>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {galleries.length > 0 && (
        <section id="gallery-section" className="py-28 px-4 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <p className="text-center text-[0.8rem] mb-16 tracking-[0.3em]" style={{ ...f, color: c.textFaint }}>GALLERY</p>
            <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
              {galleries.map((item, i) => {
                const isWide = galleries.length % 2 !== 0 && i === galleries.length - 1;
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 1, ease: 'easeOut' }} onClick={() => setGalleryIndex(i)} className={`cursor-pointer group relative ${isWide ? 'col-span-2' : ''}`} style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="relative overflow-hidden" style={{ background: 'rgba(12,22,45,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(100,160,220,0.12)', borderRadius: '12px', padding: '3px' }}>
                      <div className="relative overflow-hidden" style={{ borderRadius: '9px' }}>
                        {item.mediaType === 'VIDEO' ? (
                          <video src={item.mediaUrl} className={`w-full ${isWide ? 'aspect-[2/1]' : 'aspect-square'} object-cover transition-all duration-1000 group-hover:scale-[1.04]`} muted style={{ filter: 'saturate(0.85) brightness(0.88) contrast(1.08)' }} />
                        ) : (
                          <img src={galleryThumbUrl(item.mediaUrl)} alt="" loading="lazy" className={`w-full ${isWide ? 'aspect-[2/1]' : 'aspect-square'} object-cover transition-all duration-1000 group-hover:scale-[1.04]`} style={{ filter: 'saturate(0.85) brightness(0.88) contrast(1.08)' }} />
                        )}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(100,180,255,0.12) 0%, rgba(80,140,220,0.04) 50%, transparent 80%)' }} />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700" style={{ boxShadow: 'inset 0 0 30px rgba(100,170,240,0.08)' }} />
                      </div>
                    </div>
                    <div className="absolute -inset-[1px] opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, rgba(100,180,255,0.15) 0%, transparent 40%, transparent 60%, rgba(80,150,240,0.1) 100%)', zIndex: -1, filter: 'blur(4px)' }} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>
      )}

      {wedding.loveStoryVideo && (
        <section className="py-28 px-8 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-lg mx-auto">
            <div className="aspect-video overflow-hidden" style={{ borderRadius: '8px', border: `1px solid ${c.border}`, background: c.card }}>
              <video src={wedding.loveStoryVideo} controls playsInline className="w-full h-full object-cover" />
            </div>
          </motion.div>
        </section>
      )}

      <section className="py-28 px-8 relative" style={{ zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-sm mx-auto">
          <p className="text-center text-[0.8rem] mb-10 tracking-[0.3em]" style={{ ...f, color: c.textFaint }}>{calendarData.year}. {String(calendarData.month).padStart(2, '0')}</p>
          <div className="p-6" style={{ background: c.card, backdropFilter: 'blur(20px)', borderRadius: '16px', border: `1px solid ${c.border}` }}>
            <div className="grid grid-cols-7 text-center text-[0.6rem] mb-4" style={f}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className="py-2.5 tracking-widest" style={{ color: i === 0 ? 'rgba(160, 190, 220, 0.6)' : c.textFaint }}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center text-[0.75rem]" style={f}>
              {calendarData.weeks.flat().map((day, i) => (
                <span key={i} className="py-2.5 flex items-center justify-center" style={{
                  color: day === calendarData.targetDay ? c.bg : day ? c.textSoft : 'transparent',
                  background: day === calendarData.targetDay ? c.text : 'transparent',
                  borderRadius: '50%',
                  width: day === calendarData.targetDay ? '2rem' : 'auto',
                  height: day === calendarData.targetDay ? '2rem' : 'auto',
                  margin: day === calendarData.targetDay ? '0 auto' : '0',
                }}>{day || ''}</span>
              ))}
            </div>
          </div>
          <div className="mt-10 text-center">
            <p className="text-[0.8rem]" style={{ ...f, color: c.text }}>{formatDateLocale(wedding.weddingDate, 'full', locale)}</p>
            {wedding.weddingTime && <p className="text-[0.68rem] mt-2" style={{ ...f, color: c.textSoft }}>{formatTimeLocale(wedding.weddingTime, locale)}</p>}
          </div>
        </motion.div>
      </section>

      <section id="venue-section" className="py-28 px-8 relative" style={{ zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-md mx-auto text-center">
          <p className="text-[0.8rem] mb-12 tracking-[0.3em]" style={{ ...f, color: c.textFaint }}>LOCATION</p>
          <div className="mb-8">
            <p className="text-[0.9rem]" style={{ ...f, color: c.text }}>{wedding.venue}</p>
            {wedding.venueHall && <p className="text-[0.78rem] mt-2" style={{ ...f, color: c.textSoft }}>{wedding.venueHall}</p>}
            {wedding.venueAddress && <p className="text-[0.68rem] mt-3" style={{ ...f, color: c.textFaint }}>{wedding.venueAddress}</p>}
          </div>
          {wedding.venueAddress && (
            <div className="aspect-[4/3] mb-8 overflow-hidden" style={{ borderRadius: '12px', border: `1px solid ${c.border}` }}>
              <KakaoMap address={wedding.venueAddress} mapAddress={(wedding as any).mapAddress} mapVenue={(wedding as any).mapVenue} locale={locale} className="w-full h-full" />
            </div>
          )}
          <div className="flex justify-center gap-3">
            {wedding.venueNaverMap && <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="px-6 py-3 text-[0.65rem] tracking-wider transition-all hover:scale-[1.02]" style={{ ...f, color: c.textSoft, background: c.accent, border: `1px solid ${c.border}`, borderRadius: '8px' }}>네이버지도</a>}
            {wedding.venueKakaoMap && <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="px-6 py-3 text-[0.65rem] tracking-wider transition-all hover:scale-[1.02]" style={{ ...f, color: c.textSoft, background: c.accent, border: `1px solid ${c.border}`, borderRadius: '8px' }}>{locale === 'en' ? 'Kakao Map' : '카카오맵'}</a>}
          </div>
          {wedding.venuePhone && <a href={`tel:${wedding.venuePhone}`} className="flex items-center justify-center gap-2 mt-8 text-[0.68rem]" style={{ ...f, color: c.textSoft }}><Phone className="w-3.5 h-3.5" /> {wedding.venuePhone}</a>}
        </motion.div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section id="account-section" className="py-28 px-8 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-md mx-auto">
            <p className="text-[0.8rem] text-center mb-12 tracking-[0.3em]" style={{ ...f, color: c.textFaint }}>GIFT</p>
            <div className="space-y-3">
              {wedding.groomAccount && (
                <AccordionSection title="신랑측" isOpen={openAccount === 'groom'} onToggle={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')}>
                  <div className="flex items-center justify-between">
                    <div style={f}>
                      <p className="text-[0.62rem]" style={{ color: c.textFaint }}>{wedding.groomBank}</p>
                      <p className="text-[0.8rem] mt-1" style={{ color: c.text }}>{wedding.groomAccount}</p>
                      <p className="text-[0.62rem] mt-1" style={{ color: c.textSoft }}>{wedding.groomAccountHolder}</p>
                    </div>
                    <button onClick={() => copyToClipboard(`${wedding.groomBank} ${wedding.groomAccount}`, 'groom')} className="p-3 transition-all" style={{ background: c.accent, borderRadius: '8px' }}>
                      {copiedAccount === 'groom' ? <Check className="w-4 h-4" style={{ color: c.text }} /> : <Copy className="w-4 h-4" style={{ color: c.textFaint }} />}
                    </button>
                  </div>
                </AccordionSection>
              )}
              {wedding.brideAccount && (
                <AccordionSection title="신부측" isOpen={openAccount === 'bride'} onToggle={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')}>
                  <div className="flex items-center justify-between">
                    <div style={f}>
                      <p className="text-[0.62rem]" style={{ color: c.textFaint }}>{wedding.brideBank}</p>
                      <p className="text-[0.8rem] mt-1" style={{ color: c.text }}>{wedding.brideAccount}</p>
                      <p className="text-[0.62rem] mt-1" style={{ color: c.textSoft }}>{wedding.brideAccountHolder}</p>
                    </div>
                    <button onClick={() => copyToClipboard(`${wedding.brideBank} ${wedding.brideAccount}`, 'bride')} className="p-3 transition-all" style={{ background: c.accent, borderRadius: '8px' }}>
                      {copiedAccount === 'bride' ? <Check className="w-4 h-4" style={{ color: c.text }} /> : <Copy className="w-4 h-4" style={{ color: c.textFaint }} />}
                    </button>
                  </div>
                </AccordionSection>
              )}
            </div>
            {(wedding.tossLink || wedding.kakaoPayLink) && (
              <div className="flex justify-center gap-3 mt-8">
                {wedding.tossLink && <a href={wedding.tossLink} target="_blank" rel="noopener noreferrer" className="px-8 py-3 text-[0.65rem] text-white tracking-wider" style={{ background: '#0064FF', borderRadius: '8px' }}>{locale === 'en' ? 'Toss' : '토스'}</a>}
                {wedding.kakaoPayLink && <a href={wedding.kakaoPayLink} target="_blank" rel="noopener noreferrer" className="px-8 py-3 text-[0.65rem] tracking-wider" style={{ background: '#FEE500', color: '#3C1E1E', borderRadius: '8px' }}>{locale === 'en' ? 'KakaoPay' : '카카오페이'}</a>}
              </div>
            )}
          </motion.div>
        </section>
      )}

      <section id="rsvp-section" className="py-28 px-8 relative" style={{ zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-md mx-auto">
          <p className="text-[0.8rem] text-center mb-12 tracking-[0.3em]" style={{ ...f, color: c.textFaint }}>RSVP</p>
          <AccordionSection title="참석 여부 알려주기" isOpen={openRsvp} onToggle={() => setOpenRsvp(!openRsvp)}>
            <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="pearl" locale={locale} />
          </AccordionSection>
        </motion.div>
      </section>

      <section id="guestbook-section" className="py-28 px-8 relative" style={{ zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-md mx-auto">
          <p className="text-[0.8rem] text-center mb-12 tracking-[0.3em]" style={{ ...f, color: c.textFaint }}>MESSAGE</p>
          <AccordionSection title="마음을 남겨주세요" isOpen={openGuestbook} onToggle={() => setOpenGuestbook(!openGuestbook)}>
            <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="night-sea" locale={locale} />
          </AccordionSection>
          {localGuestbooks.length > 0 && (
            <div className="mt-6 p-6" style={{ background: c.card, backdropFilter: 'blur(20px)', borderRadius: '16px', border: `1px solid ${c.border}` }}>
              <GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="night-sea" locale={locale} />
            </div>
          )}
        </motion.div>
      </section>

      {guestPhotoSlot}
      <section className="py-20 px-8 relative" style={{ zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-md mx-auto">
          {wedding.closingMessage && (
            <p className="text-center text-[0.82rem] leading-[2.4] whitespace-pre-line mb-14" style={{ ...f, color: c.textSoft }}>{wedding.closingMessage}</p>
          )}
          <div className="flex justify-center gap-12 mb-12">
            {wedding.groomPhone && (
              <a href={`tel:${wedding.groomPhone}`} className="text-center group">
                <div className="w-14 h-14 flex items-center justify-center mb-3 transition-all group-hover:scale-105" style={{ background: c.accent, border: `1px solid ${c.border}`, borderRadius: '12px' }}>
                  <Phone className="w-5 h-5" style={{ color: c.textSoft }} />
                </div>
                <p className="text-[0.62rem] tracking-wider" style={{ ...f, color: c.textFaint }}>신랑</p>
              </a>
            )}
            {wedding.bridePhone && (
              <a href={`tel:${wedding.bridePhone}`} className="text-center group">
                <div className="w-14 h-14 flex items-center justify-center mb-3 transition-all group-hover:scale-105" style={{ background: c.accent, border: `1px solid ${c.border}`, borderRadius: '12px' }}>
                  <Phone className="w-5 h-5" style={{ color: c.textSoft }} />
                </div>
                <p className="text-[0.62rem] tracking-wider" style={{ ...f, color: c.textFaint }}>신부</p>
              </a>
            )}
          </div>
          <button onClick={() => setShowShareModal(true)} className="w-full py-4 text-[0.72rem] tracking-wider flex items-center justify-center gap-3 transition-all hover:scale-[1.01]" style={{ ...f, color: c.textSoft, background: c.accent, border: `1px solid ${c.border}`, borderRadius: '12px' }}>
            <Share2 className="w-4 h-4" /> 공유하기
          </button>
        </motion.div>
      </section>

      <footer className="py-12 text-center relative" style={{ zIndex: 1 }}>
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-[0.5rem] tracking-[0.25em] hover:opacity-70 transition-opacity" style={{ ...f, color: 'rgba(140, 170, 200, 0.2)' }}>
          Made by Wedding Studio Lab ›
        </a>
      </footer>

      {galleryIndex !== null && galleries.length > 0 && <GalleryModal galleries={galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="NIGHT_SEA" usePhotoFilter={wedding.usePhotoFilter ?? true} />}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="dark" />
    </div>
  );
}

declare global { interface Window { Kakao?: any; } }
