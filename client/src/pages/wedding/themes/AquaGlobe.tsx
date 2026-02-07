import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, ChevronDown, Share2, Copy, Check, ExternalLink, Music, VolumeX } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, ShareModal, formatDate, formatTime, getDday, type ThemeProps } from './shared';
import { applyPhotoFilter } from './shared/themeConfig';

function AquaGlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const fishRef = useRef<{
    x: number; y: number; vx: number; vy: number;
    size: number; phase: number; tailPhase: number;
    color: [number, number, number]; turnTimer: number;
  }[]>([]);
  const bubblesRef = useRef<{
    x: number; y: number; size: number; speed: number;
    wobble: number; wobbleSpeed: number; opacity: number;
  }[]>([]);
  const dustRef = useRef<{
    x: number; y: number; size: number; vx: number; vy: number; opacity: number; phase: number;
  }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvas.parentElement;
      W = parent ? parent.clientWidth : window.innerWidth;
      H = parent ? parent.clientHeight : window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    if (fishRef.current.length === 0) {
      const colors: [number, number, number][] = [
        [255, 140, 66], [255, 165, 80], [255, 120, 50], [240, 155, 90],
      ];
      for (let i = 0; i < 4; i++) {
        fishRef.current.push({
          x: Math.random() * W * 0.6 + W * 0.2,
          y: Math.random() * H * 0.5 + H * 0.2,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.3,
          size: 18 + Math.random() * 14,
          phase: Math.random() * Math.PI * 2,
          tailPhase: Math.random() * Math.PI * 2,
          color: colors[i % colors.length],
          turnTimer: 200 + Math.random() * 300,
        });
      }
    }

    if (bubblesRef.current.length === 0) {
      for (let i = 0; i < 25; i++) {
        bubblesRef.current.push({
          x: Math.random() * W,
          y: H + Math.random() * H,
          size: Math.random() * 6 + 2,
          speed: Math.random() * 0.5 + 0.2,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.02 + 0.005,
          opacity: Math.random() * 0.3 + 0.1,
        });
      }
    }

    if (dustRef.current.length === 0) {
      for (let i = 0; i < 40; i++) {
        dustRef.current.push({
          x: Math.random() * W,
          y: Math.random() * H,
          size: Math.random() * 2 + 0.5,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.1,
          opacity: Math.random() * 0.25 + 0.05,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    let raf: number;

    const drawFish = (fish: typeof fishRef.current[0], t: number) => {
      const { x, y, size, color, tailPhase } = fish;
      const dir = fish.vx >= 0 ? 1 : -1;
      const bodyWave = Math.sin(t * 2 + fish.phase) * 2;

      ctx.save();
      ctx.translate(x, y + bodyWave);
      ctx.scale(dir, 1);

      const tailSwing = Math.sin(t * 3 + tailPhase) * 0.4;

      ctx.beginPath();
      ctx.moveTo(size * 0.9, 0);
      ctx.bezierCurveTo(size * 0.6, -size * 0.35, size * 0.1, -size * 0.4, -size * 0.3, -size * 0.15);
      ctx.bezierCurveTo(-size * 0.5, -size * 0.05, -size * 0.5, size * 0.05, -size * 0.3, size * 0.15);
      ctx.bezierCurveTo(size * 0.1, size * 0.4, size * 0.6, size * 0.35, size * 0.9, 0);
      ctx.closePath();

      const bodyGrad = ctx.createLinearGradient(-size * 0.3, -size * 0.3, size * 0.5, size * 0.3);
      bodyGrad.addColorStop(0, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',0.9)');
      bodyGrad.addColorStop(0.5, 'rgba(' + Math.min(255, color[0] + 30) + ',' + Math.min(255, color[1] + 40) + ',' + Math.min(255, color[2] + 20) + ',0.85)');
      bodyGrad.addColorStop(1, 'rgba(' + color[0] + ',' + (color[1] - 20) + ',' + (color[2] - 20) + ',0.8)');
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(size * 0.3, -size * 0.15);
      ctx.bezierCurveTo(size * 0.5, -size * 0.25, size * 0.6, -size * 0.15, size * 0.5, -size * 0.05);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fill();

      ctx.save();
      ctx.translate(-size * 0.35, 0);
      ctx.rotate(tailSwing);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-size * 0.2, -size * 0.25, -size * 0.5, -size * 0.35, -size * 0.55, -size * 0.2);
      ctx.bezierCurveTo(-size * 0.35, -size * 0.05, -size * 0.35, size * 0.05, -size * 0.55, size * 0.2);
      ctx.bezierCurveTo(-size * 0.5, size * 0.35, -size * 0.2, size * 0.25, 0, 0);
      ctx.closePath();

      const tailGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.5);
      tailGrad.addColorStop(0, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',0.7)');
      tailGrad.addColorStop(1, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',0.2)');
      ctx.fillStyle = tailGrad;
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(size * 0.45, -size * 0.08, size * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20,40,60,0.7)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.46, -size * 0.09, size * 0.02, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(size * 0.15, -size * 0.3);
      ctx.bezierCurveTo(size * 0.1, -size * 0.55, size * 0.25, -size * 0.6, size * 0.3, -size * 0.4);
      const finAlpha = (Math.sin(t * 2.5 + fish.phase) * 0.5 + 0.5) * 0.3 + 0.1;
      ctx.fillStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + finAlpha + ')';
      ctx.fill();

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
        for (let x = -w; x <= w; x += 2) {
          const wave = Math.sin(x * 0.05 + t * 0.8 + i) * 8 + Math.sin(x * 0.03 - t * 0.5) * 5;
          if (x === -w) ctx.moveTo(cx + x, cy + wave);
          else ctx.lineTo(cx + x, cy + wave);
        }
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.06 + Math.sin(t * 0.3 + i) * 0.02) + ')';
        ctx.lineWidth = 15 + i * 5;
        ctx.stroke();
      }

      const prismCount = 3;
      for (let i = 0; i < prismCount; i++) {
        const px = W * (0.2 + i * 0.3) + Math.sin(t * 0.1 + i * 2) * 50;
        const py = H * 0.15 + Math.sin(t * 0.15 + i) * 30;
        const prismSize = 80 + Math.sin(t * 0.2 + i) * 20;
        const prismAlpha = (Math.sin(t * 0.3 + i * 1.5) * 0.5 + 0.5) * 0.04;

        const colors = [
          'rgba(255,100,100,' + prismAlpha + ')',
          'rgba(255,200,100,' + prismAlpha + ')',
          'rgba(100,255,100,' + prismAlpha + ')',
          'rgba(100,200,255,' + prismAlpha + ')',
          'rgba(200,100,255,' + prismAlpha + ')',
        ];
        colors.forEach((col, j) => {
          const angle = t * 0.2 + j * 1.2 + i;
          const rx = px + Math.cos(angle) * prismSize * 0.3;
          const ry = py + Math.sin(angle) * prismSize * 0.2;
          const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, prismSize);
          grad.addColorStop(0, col);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(rx - prismSize, ry - prismSize, prismSize * 2, prismSize * 2);
        });
      }

      dustRef.current.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        d.phase += 0.01;
        if (d.x < -10) d.x = W + 10;
        if (d.x > W + 10) d.x = -10;
        if (d.y < -10) d.y = H + 10;
        if (d.y > H + 10) d.y = -10;
        const a = d.opacity * (Math.sin(d.phase) * 0.5 + 0.5);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
        ctx.fill();
      });

      bubblesRef.current.forEach((b) => {
        b.y -= b.speed;
        b.wobble += b.wobbleSpeed;
        const wx = Math.sin(b.wobble) * 8;
        if (b.y < -20) {
          b.y = H + 20;
          b.x = Math.random() * W;
        }

        const bx = b.x + wx;
        ctx.beginPath();
        ctx.arc(bx, b.y, b.size, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,' + (b.opacity + 0.1) + ')';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        const bubGrad = ctx.createRadialGradient(bx - b.size * 0.3, b.y - b.size * 0.3, 0, bx, b.y, b.size);
        bubGrad.addColorStop(0, 'rgba(255,255,255,' + (b.opacity * 0.6) + ')');
        bubGrad.addColorStop(0.7, 'rgba(200,230,255,' + (b.opacity * 0.1) + ')');
        bubGrad.addColorStop(1, 'rgba(180,220,255,0)');
        ctx.fillStyle = bubGrad;
        ctx.fill();

        const prismAngle = t * 0.5 + b.wobble;
        const highlightX = bx + Math.cos(prismAngle) * b.size * 0.4;
        const highlightY = b.y + Math.sin(prismAngle) * b.size * 0.3;
        ctx.beginPath();
        ctx.arc(highlightX, highlightY, b.size * 0.2, 0, Math.PI * 2);
        const hue = ((t * 30 + b.x) % 360);
        ctx.fillStyle = 'hsla(' + hue + ',80%,80%,' + (b.opacity * 0.4) + ')';
        ctx.fill();
      });

      fishRef.current.forEach((fish) => {
        fish.phase += 0.015;
        fish.tailPhase += 0.04;
        fish.turnTimer--;

        if (fish.turnTimer <= 0) {
          fish.vx += (Math.random() - 0.5) * 0.4;
          fish.vy += (Math.random() - 0.5) * 0.2;
          fish.turnTimer = 150 + Math.random() * 250;
        }

        const margin = 60;
        if (fish.x < margin) fish.vx += 0.02;
        if (fish.x > W - margin) fish.vx -= 0.02;
        if (fish.y < margin) fish.vy += 0.015;
        if (fish.y > H - margin) fish.vy -= 0.015;

        const maxVx = 0.9, maxVy = 0.4;
        fish.vx = Math.max(-maxVx, Math.min(maxVx, fish.vx));
        fish.vy = Math.max(-maxVy, Math.min(maxVy, fish.vy));

        fish.x += fish.vx;
        fish.y += fish.vy;

        drawFish(fish, t);
      });

      const lightBeams = 4;
      for (let i = 0; i < lightBeams; i++) {
        const bx = W * (0.15 + i * 0.25) + Math.sin(t * 0.1 + i) * 40;
        const angle = -0.15 + Math.sin(t * 0.08 + i * 1.5) * 0.05;
        const beamW = 40 + Math.sin(t * 0.2 + i) * 10;
        const alpha = 0.02 + Math.sin(t * 0.15 + i * 2) * 0.01;

        ctx.save();
        ctx.translate(bx, 0);
        ctx.rotate(angle);
        const beamGrad = ctx.createLinearGradient(0, 0, 0, H);
        beamGrad.addColorStop(0, 'rgba(255,255,220,' + alpha + ')');
        beamGrad.addColorStop(0.5, 'rgba(255,255,220,' + (alpha * 0.5) + ')');
        beamGrad.addColorStop(1, 'rgba(255,255,220,0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(-beamW / 2, 0, beamW, H);
        ctx.restore();
      }

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

const c = {
  bg: '#E8F4FD',
  card: 'rgba(255, 255, 255, 0.45)',
  cardBorder: 'rgba(255, 255, 255, 0.6)',
  text: '#2C5F7C',
  textSoft: 'rgba(44, 95, 124, 0.6)',
  textFaint: 'rgba(44, 95, 124, 0.35)',
  accent: 'rgba(100, 180, 220, 0.2)',
  warm: '#FF8C42',
};

const f = { fontFamily: "'TaebaekMilkyWay', sans-serif" };

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: 'easeOut' } },
};

function AccordionSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4 rounded-2xl overflow-hidden" style={{ background: c.card, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid ' + c.cardBorder }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-6 py-5 text-left transition-all duration-300">
        <span className="text-sm tracking-widest" style={{ ...f, color: c.text }}>{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={18} style={{ color: c.textSoft }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: 'easeInOut' }}>
            <div className="px-6 pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function galleryThumbUrl(url: string) {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', '/upload/w_600,c_fill,q_auto,f_auto/');
}

export default function AquaGlobe({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading }: ThemeProps) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [localGuestbooks, setLocalGuestbooks] = useState(guestbooks);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { setLocalGuestbooks(guestbooks); }, [guestbooks]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = "@font-face { font-family: 'TaebaekMilkyWay'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2310@1.0/TAEBAEKmilkyway.woff2') format('woff2'); font-weight: normal; font-display: swap; }";
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    if (wedding.bgMusicUrl) {
      bgmRef.current = new Audio(wedding.bgMusicUrl);
      bgmRef.current.loop = true;
    }
    return () => { bgmRef.current?.pause(); };
  }, [wedding.bgMusicUrl]);

  const toggleBgm = () => {
    if (!bgmRef.current) return;
    if (bgmPlaying) { bgmRef.current.pause(); } else { bgmRef.current.play(); }
    setBgmPlaying(!bgmPlaying);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleGuestbookDelete = (id: string) => {
    setLocalGuestbooks((prev) => (prev || []).filter((g) => g.id !== id));
  };

  const dday = getDday(wedding.weddingDate);
  const galleries = wedding.galleries?.filter((g: any) => g.mediaUrl) || [];
  
  

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: c.bg }}>
      <AquaGlobeCanvas />

      {wedding.bgMusicUrl && (
        <button onClick={toggleBgm} className="fixed top-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300" style={{ background: c.card, backdropFilter: 'blur(12px)', border: '1px solid ' + c.cardBorder }}>
          {bgmPlaying ? <Music size={16} style={{ color: c.text }} /> : <VolumeX size={16} style={{ color: c.textSoft }} />}
        </button>
      )}

      <section className="relative min-h-screen flex flex-col items-center justify-end pb-20 px-6" style={{ zIndex: 1 }}>
        {wedding.heroMedia && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }} className="mb-10 w-full max-w-md">
            <div className="relative rounded-3xl overflow-hidden" style={{ border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 20px 60px rgba(44,95,124,0.15)' }}>
              {wedding.heroMediaType === 'VIDEO' ? (
                <video src={wedding.heroMedia} autoPlay muted loop playsInline className="w-full aspect-[3/4] object-cover" />
              ) : (
                <img src={applyPhotoFilter(wedding.heroMedia, 'AQUA_GLOBE')} alt="" className="w-full aspect-[3/4] object-cover" />
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(232,244,253,0.6) 100%)' }} />
            </div>
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }} className="text-center">
          <h1 className="text-3xl mb-3" style={{ ...f, color: c.text, letterSpacing: '0.15em' }}>
            {wedding.groomName} <span className="text-lg mx-3" style={{ color: c.textSoft }}>&</span> {wedding.brideName}
          </h1>
          <p className="text-sm tracking-widest" style={{ ...f, color: c.textSoft }}>{formatDate(wedding.weddingDate)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }} className="mt-10">
          <ChevronDown size={20} style={{ color: c.textFaint }} className="animate-bounce" />
        </motion.div>
      </section>

      {wedding.greeting && (
        <section className="py-28 px-8 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-lg mx-auto text-center">
            <p className="text-[0.75rem] tracking-[0.3em] mb-12" style={{ ...f, color: c.textFaint }}>INVITATION</p>
            <p className="text-sm leading-[2.4] whitespace-pre-line" style={{ ...f, color: c.text }}>{wedding.greeting}</p>
            {wedding.showParents && (
              <div className="mt-12 text-xs leading-loose" style={{ ...f, color: c.textSoft }}>
                {wedding.groomFatherName || wedding.groomMotherName ? (
                  <p>{[wedding.groomFatherName, wedding.groomMotherName].filter(Boolean).join(' · ')}의 아들 {wedding.groomName}</p>
                ) : null}
                {wedding.brideFatherName || wedding.brideMotherName ? (
                  <p>{[wedding.brideFatherName, wedding.brideMotherName].filter(Boolean).join(' · ')}의 딸 {wedding.brideName}</p>
                ) : null}
              </div>
            )}
          </motion.div>
        </section>
      )}

      {galleries.length > 0 && (
        <section id="gallery-section" className="py-28 px-4 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <p className="text-center text-[0.75rem] mb-16 tracking-[0.3em]" style={{ ...f, color: c.textFaint }}>GALLERY</p>
            <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
              {galleries.map((item: any, i: number) => {
                const isWide = galleries.length % 2 !== 0 && i === galleries.length - 1;
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.8 }} onClick={() => setGalleryIndex(i)} className={`cursor-pointer group relative ${isWide ? 'col-span-2' : ''}`}>
                    <div className="relative overflow-hidden" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.7)', padding: '3px' }}>
                      <div className="overflow-hidden" style={{ borderRadius: '17px' }}>
                        {item.mediaType === 'VIDEO' ? (
                          <video src={item.mediaUrl} className={`w-full ${isWide ? 'aspect-[2/1]' : 'aspect-square'} object-cover transition-all duration-1000 group-hover:scale-[1.03]`} muted />
                        ) : (
                          <img src={galleryThumbUrl(item.mediaUrl)} alt="" loading="lazy" className={`w-full ${isWide ? 'aspect-[2/1]' : 'aspect-square'} object-cover transition-all duration-1000 group-hover:scale-[1.03]`} />
                        )}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500" style={{ background: 'radial-gradient(circle, rgba(255,180,100,0.08) 0%, transparent 70%)' }} />
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

      {dday !== null && (
        <section className="py-20 px-8 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-sm mx-auto text-center">
            <div className="py-8 px-6 rounded-3xl" style={{ background: c.card, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid ' + c.cardBorder }}>
              <p className="text-xs tracking-widest mb-4" style={{ ...f, color: c.textFaint }}>
                {dday === 'D-Day' ? 'TODAY' : dday.startsWith('D-') ? 'D-DAY' : 'CELEBRATED'}
              </p>
              <p className="text-4xl" style={{ ...f, color: c.warm }}>
                {dday}
              </p>
            </div>
          </motion.div>
        </section>
      )}

      <section id="venue-section" className="py-28 px-8 relative" style={{ zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-lg mx-auto text-center">
          <p className="text-[0.75rem] tracking-[0.3em] mb-12" style={{ ...f, color: c.textFaint }}>LOCATION</p>
          <div className="py-10 px-6 rounded-3xl" style={{ background: c.card, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid ' + c.cardBorder }}>
            <p className="text-lg mb-2" style={{ ...f, color: c.text }}>{wedding.venue}</p>
            {wedding.venueHall && <p className="text-sm mb-1" style={{ ...f, color: c.textSoft }}>{wedding.venueHall}</p>}
            <p className="text-sm mb-8" style={{ ...f, color: c.textSoft }}>{formatDate(wedding.weddingDate)} {formatTime(wedding.weddingTime)}</p>
            {wedding.venueAddress && <p className="text-xs mb-8" style={{ ...f, color: c.textFaint }}>{wedding.venueAddress}</p>}
            <div className="flex gap-3 justify-center">
              {wedding.venueNaverMap && (
                <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-3 rounded-full text-xs transition-all duration-300 hover:opacity-80" style={{ ...f, background: 'rgba(44,95,124,0.08)', color: c.text, border: '1px solid rgba(44,95,124,0.1)' }}>
                  <MapPin size={14} /> 지도 보기
                </a>
              )}
              {wedding.venueKakaoMap && (
                <a href={wedding.venueNaverMap || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-3 rounded-full text-xs transition-all duration-300 hover:opacity-80" style={{ ...f, background: 'rgba(44,95,124,0.08)', color: c.text, border: '1px solid rgba(44,95,124,0.1)' }}>
                  <ExternalLink size={14} /> 네비게이션
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section id="account-section" className="py-28 px-8 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-lg mx-auto">
            <p className="text-center text-[0.75rem] tracking-[0.3em] mb-12" style={{ ...f, color: c.textFaint }}>CELEBRATION</p>
            {wedding.groomAccount && (
              <AccordionSection title="신랑측 축의금">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs" style={{ ...f, color: c.textSoft }}>{wedding.groomBank}</p>
                    <p className="text-sm" style={{ ...f, color: c.text }}>{wedding.groomAccount}</p>
                    <p className="text-xs mt-0.5" style={{ ...f, color: c.textFaint }}>{wedding.groomAccountHolder}</p>
                  </div>
                  <button onClick={() => handleCopy(wedding.groomAccount || '', 'groom')} className="px-4 py-2 rounded-full text-xs transition-all duration-300" style={{ ...f, background: 'rgba(44,95,124,0.06)', color: c.text, border: '1px solid rgba(44,95,124,0.1)' }}>
                    {copiedAccount === 'groom' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </AccordionSection>
            )}
            {wedding.brideAccount && (
              <AccordionSection title="신부측 축의금">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs" style={{ ...f, color: c.textSoft }}>{wedding.brideBank}</p>
                    <p className="text-sm" style={{ ...f, color: c.text }}>{wedding.brideAccount}</p>
                    <p className="text-xs mt-0.5" style={{ ...f, color: c.textFaint }}>{wedding.brideAccountHolder}</p>
                  </div>
                  <button onClick={() => handleCopy(wedding.brideAccount || '', 'bride')} className="px-4 py-2 rounded-full text-xs transition-all duration-300" style={{ ...f, background: 'rgba(44,95,124,0.06)', color: c.text, border: '1px solid rgba(44,95,124,0.1)' }}>
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
          <AccordionSection title="참석 여부" defaultOpen>
            <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="glass" />
          </AccordionSection>
        </motion.div>
      </section>

      <section id="guestbook-section" className="py-28 px-8 relative" style={{ zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-lg mx-auto">
          <p className="text-center text-[0.75rem] tracking-[0.3em] mb-12" style={{ ...f, color: c.textFaint }}>MESSAGE</p>
          <AccordionSection title="마음을 남겨주세요" defaultOpen>
            <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="glass" />
          </AccordionSection>
          {(localGuestbooks || []).length > 0 && (
            <GuestbookList guestbooks={localGuestbooks || []} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="glass" />
          )}
        </motion.div>
      </section>

      {(wedding.groomPhone || wedding.bridePhone) && (
        <section className="py-20 px-8 relative" style={{ zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-sm mx-auto">
            <p className="text-center text-[0.75rem] tracking-[0.3em] mb-10" style={{ ...f, color: c.textFaint }}>CONTACT</p>
            <div className="flex justify-center gap-8">
              {wedding.groomPhone && (
                <a href={`tel:${wedding.groomPhone}`} className="flex flex-col items-center gap-3 group">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105" style={{ background: c.card, backdropFilter: 'blur(12px)', border: '1px solid ' + c.cardBorder }}>
                    <Phone size={18} style={{ color: c.text }} />
                  </div>
                  <span className="text-xs" style={{ ...f, color: c.textSoft }}>신랑</span>
                </a>
              )}
              {wedding.bridePhone && (
                <a href={`tel:${wedding.bridePhone}`} className="flex flex-col items-center gap-3 group">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105" style={{ background: c.card, backdropFilter: 'blur(12px)', border: '1px solid ' + c.cardBorder }}>
                    <Phone size={18} style={{ color: c.text }} />
                  </div>
                  <span className="text-xs" style={{ ...f, color: c.textSoft }}>신부</span>
                </a>
              )}
            </div>
          </motion.div>
        </section>
      )}

      <section className="py-16 px-8 relative" style={{ zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-lg mx-auto">
          {wedding.closingMessage && (
            <p className="text-center text-sm leading-[2.2] mb-12 whitespace-pre-line" style={{ ...f, color: c.textSoft }}>{wedding.closingMessage}</p>
          )}
          <button onClick={() => setShowShare(true)} className="w-full py-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:opacity-80" style={{ ...f, color: c.text, background: c.card, backdropFilter: 'blur(16px)', border: '1px solid ' + c.cardBorder }}>
            <Share2 size={16} /> 공유하기
          </button>
        </motion.div>
      </section>

      <footer className="py-10 text-center relative" style={{ zIndex: 1 }}>
        <p className="text-[0.65rem] tracking-wider" style={{ ...f, color: c.textFaint }}>Made by 청첩장 작업실 ›</p>
      </footer>

      <AnimatePresence>
        {galleryIndex !== null && (
          <GalleryModal galleries={galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="AQUA_GLOBE" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShare && <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} onShare={() => {}} variant="glass" weddingId={wedding.id} />}
      </AnimatePresence>
    </div>
  );
}
