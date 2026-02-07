import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ChevronDown, Share2, Copy, Check, Music, VolumeX } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, type ThemeProps } from './shared';
import { applyPhotoFilter } from './shared/themeConfig';

function AquaGlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const fishRef = useRef<{ x: number; y: number; vx: number; vy: number; size: number; phase: number; tailPhase: number; color: [number, number, number]; turnTimer: number }[]>([]);
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

    if (fishRef.current.length === 0) {
      const cols: [number, number, number][] = [[255, 130, 50], [255, 160, 75], [240, 110, 40], [255, 145, 85]];
      for (let i = 0; i < 4; i++) {
        fishRef.current.push({ x: Math.random() * W * 0.6 + W * 0.2, y: Math.random() * H * 0.5 + H * 0.2, vx: (Math.random() - 0.5) * 1.0, vy: (Math.random() - 0.5) * 0.3, size: 36 + Math.random() * 20, phase: Math.random() * Math.PI * 2, tailPhase: Math.random() * Math.PI * 2, color: cols[i % 4], turnTimer: 200 + Math.random() * 300 });
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
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
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
      tailGrad.addColorStop(1, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',0.15)');
      ctx.fillStyle = tailGrad;
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(size * 0.45, -size * 0.08, size * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20,40,60,0.7)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.46, -size * 0.09, size * 0.02, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(size * 0.15, -size * 0.3);
      ctx.bezierCurveTo(size * 0.1, -size * 0.55, size * 0.25, -size * 0.6, size * 0.3, -size * 0.4);
      ctx.fillStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + ((Math.sin(t * 2.5 + fish.phase) * 0.5 + 0.5) * 0.3 + 0.1) + ')';
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
  text: '#2C5F7C',
  textSoft: 'rgba(44, 95, 124, 0.6)',
  textFaint: 'rgba(44, 95, 124, 0.35)',
  card: 'rgba(255, 255, 255, 0.45)',
  cardBorder: 'rgba(255, 255, 255, 0.6)',
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

export default function AquaGlobe({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading }: ThemeProps) {
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
      <AquaGlobeCanvas />
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300" style={{ background: c.card, backdropFilter: 'blur(12px)', border: '1px solid ' + c.cardBorder }}>
          {musicOn ? <Music size={16} style={{ color: c.text }} /> : <VolumeX size={16} style={{ color: c.textSoft }} />}
        </button>
      )}

      <section className="min-h-screen flex flex-col justify-center items-center px-6 relative" style={{ zIndex: 1 }}>
        {wedding.heroMedia && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5 }} className="mb-10 w-full max-w-md">
            <div className="relative rounded-3xl overflow-hidden" style={{ border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 20px 60px rgba(44,95,124,0.15)' }}>
              {wedding.heroMediaType === 'VIDEO' ? (
                <video src={wedding.heroMedia} autoPlay muted loop playsInline className="w-full aspect-[3/4] object-cover" />
              ) : (
                <img src={applyPhotoFilter(wedding.heroMedia, 'AQUA_GLOBE')} alt="" className="w-full aspect-[3/4] object-cover" />
              )}
            </div>
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }} className="text-center">
          <h1 className="text-3xl mb-3" style={{ ...f, color: c.text, letterSpacing: '0.15em' }}>
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
            <p className="text-[0.75rem] tracking-[0.3em] mb-12" style={{ ...f, color: c.textFaint }}>INVITATION</p>
            {wedding.greetingTitle && <p className="text-base mb-10" style={{ ...f, color: c.text }}>{wedding.greetingTitle}</p>}
            <p className="text-sm leading-[2.4] whitespace-pre-line" style={{ ...f, color: c.text }}>{wedding.greeting}</p>
            {wedding.showParents && (
              <div className="mt-12 text-xs leading-loose" style={{ ...f, color: c.textSoft }}>
                <p><span style={{ color: c.textFaint }}>{wedding.groomFatherName} · {wedding.groomMotherName}</span>의 아들 <span style={{ color: c.text }}>{wedding.groomName}</span></p>
                <p><span style={{ color: c.textFaint }}>{wedding.brideFatherName} · {wedding.brideMotherName}</span>의 딸 <span style={{ color: c.text }}>{wedding.brideName}</span></p>
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
                  <span className="text-xs" style={{ ...f, color: c.textSoft }}>신랑</span>
                </a>
              )}
              {wedding.bridePhone && (
                <a href={`tel:${wedding.bridePhone}`} className="flex flex-col items-center gap-3 group">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-105" style={{ background: c.card, backdropFilter: 'blur(12px)', border: '1px solid ' + c.cardBorder }}>
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
          {wedding.closingMessage && <p className="text-center text-sm leading-[2.2] mb-12 whitespace-pre-line" style={{ ...f, color: c.textSoft }}>{wedding.closingMessage}</p>}
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
