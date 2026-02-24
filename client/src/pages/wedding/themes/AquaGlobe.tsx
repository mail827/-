import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ChevronDown, Share2, Copy, Check, Music, VolumeX } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, Section, formatDate, formatTime, getDday, type ThemeProps } from './shared';
import { applyPhotoFilter } from './shared/themeConfig';

function AquaHeroDustCanvas() {
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
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2;

    const particles: { x: number; y: number; size: number; opacity: number; speed: number; drift: number; phase: number }[] = [];
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * R * 0.85;
      particles.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        size: Math.random() * 2.5 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 0.2 + 0.08,
        drift: (Math.random() - 0.5) * 0.15,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let raf: number;
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t++;
      for (const p of particles) {
        p.y -= p.speed;
        p.x += Math.sin(t * 0.008 + p.phase) * p.drift;
        const dx = p.x - cx, dy = p.y - cy;
        if (Math.sqrt(dx * dx + dy * dy) > R * 0.9 || p.y < cy - R) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * R * 0.6;
          p.x = cx + Math.cos(angle) * dist;
          p.y = cy + R * 0.8;
        }
        const distFromCenter = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
        const edgeFade = Math.max(0, 1 - distFromCenter / (R * 0.9));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255,' + (p.opacity * edgeFade) + ')';
        ctx.fill();
        if (p.size > 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(200, 235, 255,' + (p.opacity * edgeFade * 0.15) + ')';
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="absolute inset-0 pointer-events-none rounded-full" style={{ zIndex: 4 }} />;
}

function AquaGlobePreviewBg() {
  return (
    <div className="fixed inset-0" style={{ zIndex: 0 }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #a8d8eb 0%, #c4e5f5 15%, #d6effa 30%, #e4f4fc 50%, #f0f9fe 70%, #fff 100%)' }} />
      <div className="absolute" style={{ top: 0, left: 0, right: 0, height: '15%', background: 'linear-gradient(180deg, rgba(168,216,235,0.3) 0%, transparent 100%)' }} />
      {[...Array(12)].map((_,i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: (12 + i * 17 % 76) + '%',
          top: (10 + i * 13 % 45) + '%',
          width: 5 + (i % 3) * 3,
          height: 5 + (i % 3) * 3,
          background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(200,230,245,0.2) 60%, transparent 100%)',
          border: '1px solid rgba(255,255,255,0.35)',
          animation: 'floatBubble ' + (5 + i % 4) + 's ease-in-out infinite',
          animationDelay: (i * 0.4) + 's',
        }} />
      ))}
      <svg viewBox="0 0 512 512" className="absolute" style={{ top: '20%', left: '50%', transform: 'translateX(-50%)', width: 60, opacity: 0.85, animation: 'swimFish 8s ease-in-out infinite' }}>
        <g><path style={{fill:'#FFD77D'}} d="M0,239.563h64c70.82-42.841,136.393-54.907,136.393-54.907C121.705,185.705,53.508,202.842,0,239.563z"/><path style={{fill:'#FFD77D'}} d="M360.918,147.235c-4.546-4.546-33.574-41.967-83.934-41.967c0,0-11.192,16.787,8.393,33.574L360.918,147.235z"/></g>
        <path style={{fill:'#FFB455'}} d="M360.918,130.448c-58.754,0-142.689,50.361-142.689,50.361c-83.934,0-175.562,57.354-210.885,93.377c0,0,50.01-17.836,84.984-17.836c34.098,0,57.303,10.93,67.148,25.18c19.934,28.852,17.535,90.358-0.7,125.202c0,0,58.754-29.726,58.754-100.022c0-35.818,5.676-88.424,20.517-98.776c25.112,29.832,73.259,73.596,139.658,73.596C478.426,281.53,512,214.383,512,214.383S453.246,130.448,360.918,130.448z"/>
        <circle style={{fill:'#464655'}} cx="453.246" cy="197.593" r="12.59"/>
        <path style={{fill:'#FF9646'}} d="M320.773,270.346c-34.697-13.296-9.167-65.055-43.79-81.144c-17.021-7.909-33.574,8.393-38.937,18.732C254.488,228.805,278.975,254.328,320.773,270.346z"/>
      </svg>
      <style>{`
        @keyframes floatBubble { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes swimFish { 0%,100% { transform: translateX(-50%) translateY(0); } 25% { transform: translateX(-45%) translateY(-8px); } 75% { transform: translateX(-55%) translateY(5px); } }
      `}</style>
    </div>
  );
}

function AquaGlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const fishRef = useRef<{ x: number; y: number; vx: number; vy: number; size: number; phase: number; tailPhase: number; color: [number, number, number]; turnTimer: number; trail: { x: number; y: number; life: number; size: number; opacity: number; vx: number; vy: number }[] }[]>([]);
  const fishImgRef = useRef<HTMLImageElement | null>(null);
  const fishImgFlipRef = useRef<HTMLImageElement | null>(null);
  const fishImgLoaded = useRef(false);
  const bubblesRef = useRef<{ x: number; y: number; size: number; speed: number; wobble: number; wobbleSpeed: number; opacity: number }[]>([]);
  const dustRef = useRef<{ x: number; y: number; size: number; vx: number; vy: number; opacity: number; phase: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = 0, H = 0, dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    if (!fishImgRef.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        fishImgRef.current = img;
        const flipCanvas = document.createElement('canvas');
        flipCanvas.width = 512;
        flipCanvas.height = 512;
        const flipCtx = flipCanvas.getContext('2d');
        if (flipCtx) {
          flipCtx.translate(512, 0);
          flipCtx.scale(-1, 1);
          flipCtx.drawImage(img, 0, 0, 512, 512);
        }
        const flipImg = new Image();
        flipImg.onload = () => {
          fishImgFlipRef.current = flipImg;
          fishImgLoaded.current = true;
        };
        flipImg.src = flipCanvas.toDataURL();
      };
      img.src = '/goldfish.svg';
      fishImgRef.current = img;
    }

    if (fishRef.current.length === 0) {
      const cols: [number, number, number][] = [[255, 130, 50], [255, 160, 75], [240, 110, 40], [255, 145, 85]];
      for (let i = 0; i < 4; i++) {
        fishRef.current.push({ x: Math.random() * W * 0.6 + W * 0.2, y: Math.random() * H * 0.5 + H * 0.2, vx: (Math.random() - 0.5) * 1.0, vy: (Math.random() - 0.5) * 0.3, size: 36 + Math.random() * 20, phase: Math.random() * Math.PI * 2, tailPhase: Math.random() * Math.PI * 2, color: cols[i % 4], turnTimer: 200 + Math.random() * 300, trail: [] });
      }
    }
    if (bubblesRef.current.length === 0) {
      for (let i = 0; i < 14; i++) bubblesRef.current.push({ x: Math.random() * W, y: H + Math.random() * H, size: Math.random() * 10 + 4, speed: Math.random() * 0.5 + 0.2, wobble: Math.random() * Math.PI * 2, wobbleSpeed: Math.random() * 0.02 + 0.005, opacity: Math.random() * 0.5 + 0.3 });
    }
    if (dustRef.current.length === 0) {
      for (let i = 0; i < 18; i++) dustRef.current.push({ x: Math.random() * W, y: Math.random() * H, size: Math.random() * 2.5 + 0.8, vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.08, opacity: Math.random() * 0.35 + 0.1, phase: Math.random() * Math.PI * 2 });
    }

    let raf: number;

    const drawFish = (fish: typeof fishRef.current[0], t: number) => {
      const { x, y, size } = fish;
      const dir = fish.vx >= 0 ? 1 : -1;
      const bodyWave = Math.sin(t * 2 + fish.phase) * 2;
      if (!fishImgLoaded.current) return;
      const img = dir === 1 ? fishImgRef.current : fishImgFlipRef.current;
      if (!img) return;

      if (frameRef.current % 3 === 0) {
        const tailX = x + (dir === 1 ? -size * 0.6 : size * 0.6);
        const tailY = y + bodyWave + Math.sin(t * 3 + fish.tailPhase) * size * 0.15;
        for (let i = 0; i < 2; i++) {
          fish.trail.push({
            x: tailX + (Math.random() - 0.5) * size * 0.4,
            y: tailY + (Math.random() - 0.5) * size * 0.3,
            life: 1,
            size: Math.random() * 2.5 + 1,
            opacity: Math.random() * 0.4 + 0.2,
            vx: -dir * (Math.random() * 0.3 + 0.1),
            vy: (Math.random() - 0.5) * 0.15,
          });
        }
      }

      fish.trail = fish.trail.filter(p => {
        p.life -= 0.015;
        p.x += p.vx;
        p.y += p.vy + Math.sin(t * 2 + p.x * 0.05) * 0.05;
        p.size *= 0.995;
        if (p.life <= 0) return false;
        const a = p.opacity * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 200, 150, ' + a + ')';
        ctx.fill();
        if (p.size > 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 180, 120, ' + (a * 0.15) + ')';
          ctx.fill();
        }
        return true;
      });

      const tilt = Math.sin(t * 1.5 + fish.phase) * 0.08;
      ctx.save();
      ctx.translate(x, y + bodyWave);
      ctx.rotate(tilt + fish.vy * 0.3);
      ctx.drawImage(img, -size * 1.1, -size * 0.8, size * 2.2, size * 1.6);
      ctx.restore();
    };

    const draw = () => {
      frameRef.current++;
      const t = frameRef.current * 0.015;
      ctx.clearRect(0, 0, W, H);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#D6EFFA');
      bgGrad.addColorStop(0.3, '#E0F3FC');
      bgGrad.addColorStop(0.6, '#C4E5F5');
      bgGrad.addColorStop(1, '#A8D8EB');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < 5; i++) {
        const cx = W * (0.15 + i * 0.2) + Math.sin(t * 0.3 + i) * 30;
        const cy = 40 + Math.sin(t * 0.2 + i * 1.5) * 15;
        const w = 120 + Math.sin(t * 0.15 + i * 2) * 30;
        ctx.beginPath();
        for (let x = -w; x <= w; x += 4) {
          const wave = Math.sin(x * 0.05 + t * 0.8 + i) * 8 + Math.sin(x * 0.03 - t * 0.5) * 5;
          if (x === -w) ctx.moveTo(cx + x, cy + wave);
          else ctx.lineTo(cx + x, cy + wave);
        }
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.15 + Math.sin(t * 0.3 + i) * 0.05) + ')';
        ctx.lineWidth = 15 + i * 5;
        ctx.stroke();
      }

      for (let i = 0; i < 3; i++) {
        const px = W * (0.2 + i * 0.3) + Math.sin(t * 0.1 + i * 2) * 50;
        const py = H * 0.15 + Math.sin(t * 0.15 + i) * 30;
        const ps = 80 + Math.sin(t * 0.2 + i) * 20;
        const pa = (Math.sin(t * 0.3 + i * 1.5) * 0.5 + 0.5) * 0.1;
        ['rgba(255,100,100,', 'rgba(255,200,100,', 'rgba(100,255,100,', 'rgba(100,200,255,', 'rgba(200,100,255,'].forEach((col, j) => {
          const angle = t * 0.2 + j * 1.2 + i;
          const rx = px + Math.cos(angle) * ps * 0.3;
          const ry = py + Math.sin(angle) * ps * 0.2;
          const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, ps);
          grad.addColorStop(0, col + pa + ')');
          grad.addColorStop(1, col + '0)');
          ctx.fillStyle = grad;
          ctx.fillRect(rx - ps, ry - ps, ps * 2, ps * 2);
        });
      }

      dustRef.current.forEach((d) => {
        d.x += d.vx; d.y += d.vy; d.phase += 0.01;
        if (d.x < -10) d.x = W + 10; if (d.x > W + 10) d.x = -10;
        if (d.y < -10) d.y = H + 10; if (d.y > H + 10) d.y = -10;
        const a = d.opacity * (Math.sin(d.phase) * 0.5 + 0.5);
        ctx.beginPath(); ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + a + ')'; ctx.fill();
      });

      bubblesRef.current.forEach((b) => {
        b.y -= b.speed; b.wobble += b.wobbleSpeed;
        if (b.y < -20) { b.y = H + 20; b.x = Math.random() * W; }
        const bx = b.x + Math.sin(b.wobble) * 8;
        ctx.beginPath(); ctx.arc(bx, b.y, b.size, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,' + (b.opacity + 0.15) + ')';
        ctx.lineWidth = 0.8; ctx.stroke();
        const bg = ctx.createRadialGradient(bx - b.size * 0.3, b.y - b.size * 0.3, 0, bx, b.y, b.size);
        bg.addColorStop(0, 'rgba(255,255,255,' + (b.opacity * 0.5) + ')');
        bg.addColorStop(0.7, 'rgba(200,230,255,' + (b.opacity * 0.15) + ')');
        bg.addColorStop(1, 'rgba(180,220,255,0)');
        ctx.fillStyle = bg; ctx.fill();
        const hue = ((t * 30 + b.x) % 360);
        ctx.beginPath(); ctx.arc(bx + Math.cos(t * 0.5 + b.wobble) * b.size * 0.4, b.y + Math.sin(t * 0.5 + b.wobble) * b.size * 0.3, b.size * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + hue + ',80%,80%,' + (b.opacity * 0.4) + ')'; ctx.fill();
      });

      fishRef.current.forEach((fish) => {
        fish.phase += 0.015; fish.tailPhase += 0.04; fish.turnTimer--;
        if (fish.turnTimer <= 0) { fish.vx += (Math.random() - 0.5) * 0.4; fish.vy += (Math.random() - 0.5) * 0.2; fish.turnTimer = 150 + Math.random() * 250; }
        if (fish.x < 60) fish.vx += 0.02; if (fish.x > W - 60) fish.vx -= 0.02;
        if (fish.y < 60) fish.vy += 0.015; if (fish.y > H - 60) fish.vy -= 0.015;
        fish.vx = Math.max(-0.9, Math.min(0.9, fish.vx));
        fish.vy = Math.max(-0.4, Math.min(0.4, fish.vy));
        fish.x += fish.vx; fish.y += fish.vy;
        drawFish(fish, t);
      });

      for (let i = 0; i < 4; i++) {
        const bx = W * (0.15 + i * 0.25) + Math.sin(t * 0.1 + i) * 40;
        const a = 0.06 + Math.sin(t * 0.15 + i * 2) * 0.03;
        const bw = 40 + Math.sin(t * 0.2 + i) * 10;
        ctx.save(); ctx.translate(bx, 0); ctx.rotate(-0.15 + Math.sin(t * 0.08 + i * 1.5) * 0.05);
        const lg = ctx.createLinearGradient(0, 0, 0, H);
        lg.addColorStop(0, 'rgba(255,255,220,' + a + ')');
        lg.addColorStop(0.5, 'rgba(255,255,220,' + (a * 0.5) + ')');
        lg.addColorStop(1, 'rgba(255,255,220,0)');
        ctx.fillStyle = lg; ctx.fillRect(-bw / 2, 0, bw, H);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

const c = {
  text: '#1E4D6B',
  textSoft: 'rgba(30, 77, 107, 0.65)',
  textFaint: 'rgba(44, 95, 124, 0.35)',
  card: 'rgba(255, 255, 255, 0.55)',
  cardBorder: 'rgba(255, 255, 255, 0.65)',
  warm: '#FF8C42',
};
const f = { fontFamily: "'TaebaekMilkyWay', sans-serif" };
const fadeIn = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: 'easeOut' } } };

function AccordionSection({ title, children, isOpen, onToggle }: { title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="mb-4 rounded-2xl overflow-hidden" style={{ background: c.card, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid ' + c.cardBorder }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-5 text-left transition-all duration-300">
        <span className="text-sm tracking-widest" style={{ ...f, color: c.text }}>{title}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}><ChevronDown size={18} style={{ color: c.textSoft }} /></motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: 'easeInOut' }}>
            <div className="px-6 pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AquaGlobe({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot, isPreview }: ThemeProps & { isPreview?: boolean }) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>('rsvp');
  const [localGuestbooks, setLocalGuestbooks] = useState(guestbooks || []);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicOn, setMusicOn] = useState(false);

  useEffect(() => { setLocalGuestbooks(guestbooks || []); }, [guestbooks]);
  const handleGuestbookDelete = (id: string) => { setLocalGuestbooks(prev => prev.filter(g => g.id !== id)); };

  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = "@font-face{font-family:'TaebaekMilkyWay';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2310@1.0/TAEBAEKmilkyway.woff2') format('woff2');font-weight:normal;font-display:swap;}";
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  useEffect(() => {
    if (wedding.bgMusicAutoPlay && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [wedding.bgMusicAutoPlay]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicOn) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
    setMusicOn(!musicOn);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleShare = async (type: 'kakao' | 'instagram' | 'sms', version?: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = version ? `${baseUrl}?v=${version}` : baseUrl;
    const title = `${wedding.groomName} & ${wedding.brideName}`;
    if (type === 'kakao' && window.Kakao?.Share) {
      window.Kakao.Share.sendDefault({ objectType: 'feed', content: { title, description: formatDate(wedding.weddingDate, 'korean'), imageUrl: wedding.heroMedia || '', link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }] });
    } else if (type === 'instagram') {
      await navigator.clipboard.writeText(url);
      window.open('https://www.instagram.com/', '_blank');
    } else if (type === 'sms') {
      window.location.href = `sms:?body=${encodeURIComponent(title + ' ' + url)}`;
    }
    setShowShareModal(false);
  };

  const galleries = wedding.galleries || [];
  const dday = getDday(wedding.weddingDate);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'transparent' }}>
      {isPreview ? <AquaGlobePreviewBg /> : <AquaGlobeCanvas />}
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300" style={{ background: c.card, backdropFilter: 'blur(12px)', border: '1px solid ' + c.cardBorder }}>
          {musicOn ? <Music size={16} style={{ color: c.text }} /> : <VolumeX size={16} style={{ color: c.textSoft }} />}
        </button>
      )}

      <section className="min-h-screen flex flex-col justify-center items-center px-6 relative" style={{ zIndex: 1 }}>
        {wedding.heroMedia && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.8, ease: 'easeOut' }} className="mb-10 w-[75vw] max-w-[320px]">
            <div className="relative rounded-full overflow-hidden aspect-square" style={{ border: '2px solid rgba(255,255,255,0.45)', boxShadow: '0 0 80px rgba(168,216,235,0.25), 0 0 40px rgba(44,95,124,0.15), inset 0 0 60px rgba(168,216,235,0.1)' }}>
              {wedding.heroMediaType === 'VIDEO' ? (
                <video src={wedding.heroMedia} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={applyPhotoFilter(wedding.heroMedia, 'AQUA_GLOBE')} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 20%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 30%, transparent 60%)', zIndex: 2 }} />
              <div className="absolute inset-0 pointer-events-none rounded-full" style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 60%, rgba(168,216,235,0.08) 100%)', zIndex: 2 }} />
              <div className="absolute pointer-events-none" style={{ top: '12%', left: '18%', width: '25%', height: '12%', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', filter: 'blur(8px)', transform: 'rotate(-20deg)', zIndex: 3 }} />
              <div className="absolute pointer-events-none" style={{ top: '20%', left: '28%', width: '8%', height: '5%', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', filter: 'blur(4px)', transform: 'rotate(-15deg)', zIndex: 3 }} />
              <AquaHeroDustCanvas />
            </div>
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }} className="text-center">
          <h1 className="text-3xl mb-3 font-medium" style={{ ...f, color: c.text, letterSpacing: '0.15em' }}>
            {wedding.groomName} <span className="text-lg mx-3" style={{ color: c.textSoft }}>&</span> {wedding.brideName}
          </h1>
          <p className="text-sm tracking-widest" style={{ ...f, color: c.textSoft }}>{formatDate(wedding.weddingDate)}</p>
          {wedding.showDday && <p className="mt-3 text-xs tracking-widest" style={{ ...f, color: c.textFaint }}>{dday}</p>}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mt-10">
          <ChevronDown size={20} style={{ color: c.textFaint }} className="animate-bounce" />
        </motion.div>
      </section>

      {wedding.greeting && (
        <section className="py-28 px-8 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-lg mx-auto text-center">
            <div className="py-10 px-8 rounded-3xl" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.5)' }}>
              <p className="text-[0.75rem] tracking-[0.3em] mb-12" style={{ ...f, color: c.textFaint }}>INVITATION</p>
              {wedding.greetingTitle && <p className="text-base mb-10 font-medium" style={{ ...f, color: c.text }}>{wedding.greetingTitle}</p>}
              <p className="text-sm leading-[2.4] whitespace-pre-line" style={{ ...f, color: c.text }}>{wedding.greeting}</p>
            {wedding.showParents && (
              <div className="mt-12 text-xs leading-loose" style={{ ...f, color: c.textSoft }}>
                <p><span style={{ color: c.textFaint }}>{wedding.groomFatherName} · {wedding.groomMotherName}</span>의 아들 <span style={{ color: c.text }}>{wedding.groomName}</span></p>
                <p><span style={{ color: c.textFaint }}>{wedding.brideFatherName} · {wedding.brideMotherName}</span>의 딸 <span style={{ color: c.text }}>{wedding.brideName}</span></p>
              </div>
            )}
            </div>
          </motion.div>
        </section>
      )}

      {galleries.length > 0 && (
        <section id="gallery-section" className="py-28 px-4 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <p className="text-center text-[0.75rem] mb-16 tracking-[0.3em]" style={{ ...f, color: c.textFaint }}>GALLERY</p>
            <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
              {galleries.map((item, i) => {
                const isWide = galleries.length % 2 !== 0 && i === galleries.length - 1;
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} onClick={() => setGalleryIndex(i)} className={`cursor-pointer group ${isWide ? 'col-span-2' : ''}`}>
                    <div className="overflow-hidden" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.7)', padding: '3px' }}>
                      <div className="overflow-hidden" style={{ borderRadius: '17px' }}>
                        {item.mediaType === 'VIDEO' ? (
                          <video src={item.mediaUrl} className={`w-full ${isWide ? 'aspect-[2/1]' : 'aspect-square'} object-cover transition-transform duration-700 group-hover:scale-[1.03]`} muted />
                        ) : (
                          <img src={item.mediaUrl.includes('/upload/') ? item.mediaUrl.replace('/upload/', '/upload/w_600,c_fill,q_auto,f_auto/') : item.mediaUrl} alt="" loading="lazy" className={`w-full ${isWide ? 'aspect-[2/1]' : 'aspect-square'} object-cover transition-transform duration-700 group-hover:scale-[1.03]`} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>
      )}

      {wedding.loveStoryVideo && (
        <section className="py-28 px-4 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-lg mx-auto">
            <p className="text-center text-[0.75rem] mb-12 tracking-[0.3em]" style={{ ...f, color: c.textFaint }}>OUR STORY</p>
            <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 10px 40px rgba(44,95,124,0.1)' }}>
              <video src={wedding.loveStoryVideo} controls playsInline className="w-full aspect-video object-cover" />
            </div>
          </motion.div>
        </section>
      )}

      <section id="venue-section" className="py-28 px-8 relative" style={{ zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-lg mx-auto text-center">
          <p className="text-[0.75rem] tracking-[0.3em] mb-12" style={{ ...f, color: c.textFaint }}>LOCATION</p>
          <div className="py-10 px-6 rounded-3xl" style={{ background: c.card, backdropFilter: 'blur(20px)', border: '1px solid ' + c.cardBorder }}>
            <p className="text-sm" style={{ ...f, color: c.text }}>{formatDate(wedding.weddingDate, 'korean')}</p>
            {wedding.weddingTime && <p className="text-xs mt-2" style={{ ...f, color: c.textSoft }}>{formatTime(wedding.weddingTime)}</p>}
            <div className="my-8 h-px" style={{ background: 'rgba(44,95,124,0.08)' }} />
            <p className="text-lg mb-2" style={{ ...f, color: c.text }}>{wedding.venue}</p>
            {wedding.venueHall && <p className="text-sm mt-2" style={{ ...f, color: c.textSoft }}>{wedding.venueHall}</p>}
            {wedding.venueAddress && <p className="text-xs mt-3 mb-8" style={{ ...f, color: c.textFaint }}>{wedding.venueAddress}</p>}
            {wedding.venueAddress && (
              <div className="rounded-2xl overflow-hidden mb-6" style={{ height: 200 }}>
                <KakaoMap address={wedding.venueAddress} className="w-full h-full" />
              </div>
            )}
            <div className="flex gap-3 justify-center">
              {wedding.venueNaverMap && <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-full text-xs transition-all hover:opacity-80" style={{ ...f, background: 'rgba(44,95,124,0.08)', color: c.text, border: '1px solid rgba(44,95,124,0.1)' }}>네이버지도</a>}
              {wedding.venueKakaoMap && <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-full text-xs transition-all hover:opacity-80" style={{ ...f, background: 'rgba(44,95,124,0.08)', color: c.text, border: '1px solid rgba(44,95,124,0.1)' }}>카카오맵</a>}
            </div>
          </div>
        </motion.div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section id="account-section" className="py-28 px-8 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-lg mx-auto">
            <p className="text-center text-[0.75rem] tracking-[0.3em] mb-12" style={{ ...f, color: c.textFaint }}>CELEBRATION</p>
            {wedding.groomAccount && (
              <AccordionSection title="신랑측 축의금" isOpen={openSection === 'groomAcc'} onToggle={() => setOpenSection(openSection === 'groomAcc' ? null : 'groomAcc')}>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs" style={{ ...f, color: c.textSoft }}>{wedding.groomBank}</p>
                    <p className="text-sm mt-1" style={{ ...f, color: c.text }}>{wedding.groomAccount}</p>
                    <p className="text-xs mt-1" style={{ ...f, color: c.textFaint }}>{wedding.groomAccountHolder}</p>
                  </div>
                  <button onClick={() => handleCopy(wedding.groomAccount || '', 'groom')} className="px-4 py-2 rounded-full text-xs" style={{ background: 'rgba(44,95,124,0.06)', color: c.text, border: '1px solid rgba(44,95,124,0.1)' }}>
                    {copiedAccount === 'groom' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </AccordionSection>
            )}
            {wedding.brideAccount && (
              <AccordionSection title="신부측 축의금" isOpen={openSection === 'brideAcc'} onToggle={() => setOpenSection(openSection === 'brideAcc' ? null : 'brideAcc')}>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs" style={{ ...f, color: c.textSoft }}>{wedding.brideBank}</p>
                    <p className="text-sm mt-1" style={{ ...f, color: c.text }}>{wedding.brideAccount}</p>
                    <p className="text-xs mt-1" style={{ ...f, color: c.textFaint }}>{wedding.brideAccountHolder}</p>
                  </div>
                  <button onClick={() => handleCopy(wedding.brideAccount || '', 'bride')} className="px-4 py-2 rounded-full text-xs" style={{ background: 'rgba(44,95,124,0.06)', color: c.text, border: '1px solid rgba(44,95,124,0.1)' }}>
                    {copiedAccount === 'bride' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </AccordionSection>
            )}
          </motion.div>
        </section>
      )}

      <section id="rsvp-section" className="py-28 px-8 relative" style={{ zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-lg mx-auto">
          <AccordionSection title="참석 여부" isOpen={openSection === 'rsvp'} onToggle={() => setOpenSection(openSection === 'rsvp' ? null : 'rsvp')}>
            <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="glass" />
          </AccordionSection>
        </motion.div>
      </section>

      <section id="guestbook-section" className="py-28 px-8 relative" style={{ zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-lg mx-auto">
          <p className="text-center text-[0.75rem] tracking-[0.3em] mb-12" style={{ ...f, color: c.textFaint }}>MESSAGE</p>
          <AccordionSection title="마음을 남겨주세요" isOpen={openSection === 'guestbook'} onToggle={() => setOpenSection(openSection === 'guestbook' ? null : 'guestbook')}>
            <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="glass" />
          </AccordionSection>
          {localGuestbooks.length > 0 && (
            <GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="glass" />
          )}
        </motion.div>
      </section>

      {guestPhotoSlot && (
        <Section id="guest-gallery-section">
          {guestPhotoSlot}
        </Section>
      )}

      {(wedding.groomPhone || wedding.bridePhone) && (
        <section className="py-20 px-8 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-sm mx-auto">
            <p className="text-center text-[0.75rem] tracking-[0.3em] mb-10" style={{ ...f, color: c.textFaint }}>CONTACT</p>
            <div className="flex justify-center gap-8">
              {wedding.groomPhone && (
                <a href={`tel:${wedding.groomPhone}`} className="flex flex-col items-center gap-3 group">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-105" style={{ background: c.card, backdropFilter: 'blur(12px)', border: '1px solid ' + c.cardBorder }}>
                    <Phone size={18} style={{ color: c.text }} />
                  </div>
                  <span className="text-xs font-medium" style={{ ...f, color: c.textSoft }}>신랑</span>
                </a>
              )}
              {wedding.bridePhone && (
                <a href={`tel:${wedding.bridePhone}`} className="flex flex-col items-center gap-3 group">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-105" style={{ background: c.card, backdropFilter: 'blur(12px)', border: '1px solid ' + c.cardBorder }}>
                    <Phone size={18} style={{ color: c.text }} />
                  </div>
                  <span className="text-xs font-medium" style={{ ...f, color: c.textSoft }}>신부</span>
                </a>
              )}
            </div>
          </motion.div>
        </section>
      )}

      <section className="py-16 px-8 relative" style={{ zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-lg mx-auto">
          {wedding.closingMessage && <div className="py-8 px-6 rounded-3xl mb-12" style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)' }}><p className="text-center text-sm leading-[2.2] whitespace-pre-line" style={{ ...f, color: c.textSoft }}>{wedding.closingMessage}</p></div>}
          <button onClick={() => setShowShareModal(true)} className="w-full py-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80" style={{ ...f, color: c.text, background: c.card, backdropFilter: 'blur(16px)', border: '1px solid ' + c.cardBorder }}>
            <Share2 size={16} /> 공유하기
          </button>
        </motion.div>
      </section>

      <footer className="py-10 text-center relative" style={{ zIndex: 1 }}>
        <p className="text-[0.65rem] tracking-wider" style={{ ...f, color: c.textFaint }}>Made by 청첩장 작업실 ›</p>
      </footer>

      {galleryIndex !== null && galleries.length > 0 && <GalleryModal galleries={galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="AQUA_GLOBE" usePhotoFilter={wedding.usePhotoFilter ?? true} />}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="light" />
    </div>
  );
}
