import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';

interface QRCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  wedding: {
    slug: string;
    groomName: string;
    brideName: string;
    weddingDate: string;
    weddingTime: string;
    theme: string;
    venueName?: string;
    venueHall?: string;
  };
}

const CARD_SIZES = [
  { id: 'namecard', label: '명함 사이즈', w: 1050, h: 600, ratio: '90×50mm' },
  { id: 'postcard', label: '엽서 사이즈', w: 1050, h: 1500, ratio: '100×148mm' },
];

const THEME_FONTS: Record<string, { name: string; css: string }> = {
  ROMANTIC_CLASSIC: {
    name: 'Aritaburi',
    css: "@font-face{font-family:'Aritaburi';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_one@1.0/Arita-buri-SemiBold.woff') format('woff');font-weight:normal;font-display:swap;}"
  },
  BOHEMIAN_DREAM: { name: 'Nanum Myeongjo', css: '' },
  LUXURY_GOLD: { name: 'Playfair Display', css: '' },
  POETIC_LOVE: {
    name: 'NostalgicMyoeunHeullim',
    css: "@font-face{font-family:'NostalgicMyoeunHeullim';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-1@1.0/Griun_MyoeunHeullim-Rg.woff2') format('woff2');font-weight:normal;font-display:swap;}"
  },
  GLASS_BUBBLE: {
    name: 'ChangwonDangamRounded',
    css: "@font-face{font-family:'ChangwonDangamRounded';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2511-1@1.0/ChangwonDangamRound-Regular.woff2') format('woff2');font-weight:normal;font-display:swap;}"
  },
  SPRING_BREEZE: {
    name: 'HsBombaram',
    css: "@font-face{font-family:'HsBombaram';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_one@1.0/HSBombaram.woff') format('woff');font-weight:normal;font-display:swap;}"
  },
  GALLERY_MIRIM_1: {
    name: 'MapoFlowerIsland',
    css: "@font-face{font-family:'MapoFlowerIsland';src:url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/MapoFlowerIslandA.woff') format('woff');font-weight:normal;font-display:swap;}"
  },
  GALLERY_MIRIM_2: {
    name: 'KyoboHandwriting2020ParkDoYeon',
    css: "@font-face{font-family:'KyoboHandwriting2020ParkDoYeon';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2112@1.0/KyoboHandwriting2020A.woff') format('woff');font-weight:normal;font-display:swap;}"
  },
  LUNA_HALFMOON: {
    name: 'MapoDacapo',
    css: "@font-face{font-family:'MapoDacapo';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/MapoDacapoA.woff') format('woff');font-weight:normal;font-display:swap;}"
  },
  PEARL_DRIFT: {
    name: 'MapoDacapo',
    css: "@font-face{font-family:'MapoDacapo';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/MapoDacapoA.woff') format('woff');font-weight:normal;font-display:swap;}"
  },
  NIGHT_SEA: {
    name: 'ZenSerif',
    css: "@font-face{font-family:'ZenSerif';src:url('/fonts/ZEN-SERIF-TTF-Regular.woff2') format('woff2'),url('/fonts/ZEN-SERIF-TTF-Regular.woff') format('woff');font-weight:normal;font-display:swap;}"
  },
  AQUA_GLOBE: {
    name: 'TaebaekMilkyWay',
    css: "@font-face{font-family:'TaebaekMilkyWay';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2310@1.0/TAEBAEKmilkyway.woff2') format('woff2');font-weight:normal;font-display:swap;}"
  },
};

async function loadFonts(theme: string) {
  if (!document.getElementById('qr-card-fonts')) {
    const link = document.createElement('link');
    link.id = 'qr-card-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;600&family=Nanum+Myeongjo:wght@400;700&family=Playfair+Display:wght@400;600&display=swap';
    document.head.appendChild(link);
  }
  const themeFont = THEME_FONTS[theme];
  if (themeFont && themeFont.css && !document.getElementById('qr-theme-font')) {
    const s = document.createElement('style');
    s.id = 'qr-theme-font';
    s.textContent = themeFont.css;
    document.head.appendChild(s);
  }
  const targets: string[] = ['Noto Serif KR'];
  if (themeFont) targets.push(themeFont.name);
  const checks = targets.map(name =>
    Promise.race([
      document.fonts.load('600 40px "' + name + '"'),
      new Promise(r => setTimeout(r, 2000))
    ])
  );
  await Promise.all(checks);
  await document.fonts.ready;
}

type ThemeDesign = {
  fontSerif?: string;
  bg: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  accent: string;
  text: string;
  textSub: string;
  qrFg: string;
  qrBg: string;
  label: string;
  ornament: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
};

const THEME_DESIGNS: Record<string, ThemeDesign> = {
  ROMANTIC_CLASSIC: {
    fontSerif: "'Aritaburi', serif",
    bg: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#FDF9F7'); g.addColorStop(0.5, '#FAF0ED'); g.addColorStop(1, '#F5E6E0');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(212,165,165,0.03)';
      for (let i = 0; i < w; i += 6) for (let j = 0; j < h; j += 6) {
        if ((i + j) % 12 === 0) ctx.fillRect(i, j, 2, 2);
      }
    },
    accent: '#D4A5A5', text: '#5D4E4E', textSub: '#9A8A8A', qrFg: '#5D4E4E', qrBg: '#FDF9F7',
    label: '로맨틱 클래식',
    ornament: (ctx, w, h) => {
      ctx.strokeStyle = '#D4A5A5'; ctx.lineWidth = 1.5;
      const m = 28, r = 8;
      ctx.beginPath();
      ctx.moveTo(m + r, m); ctx.lineTo(w - m - r, m); ctx.arcTo(w - m, m, w - m, m + r, r);
      ctx.lineTo(w - m, h - m - r); ctx.arcTo(w - m, h - m, w - m - r, h - m, r);
      ctx.lineTo(m + r, h - m); ctx.arcTo(m, h - m, m, h - m - r, r);
      ctx.lineTo(m, m + r); ctx.arcTo(m, m, m + r, m, r); ctx.stroke();
      ctx.strokeStyle = 'rgba(212,165,165,0.4)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(m + 10, m + 10); ctx.lineTo(w - m - 10, m + 10); ctx.lineTo(w - m - 10, h - m - 10); ctx.lineTo(m + 10, h - m - 10); ctx.closePath(); ctx.stroke();
      const drawRose = (cx: number, cy: number, s: number) => {
        ctx.save(); ctx.translate(cx, cy);
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = `rgba(212,165,165,${0.08 + i * 0.03})`;
          ctx.beginPath(); ctx.ellipse(0, 0, s * (1 - i * 0.12), s * 0.55 * (1 - i * 0.12), (i * Math.PI) / 4.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = 'rgba(212,165,165,0.35)';
        ctx.beginPath(); ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      };
      drawRose(m + 8, m + 8, 20); drawRose(w - m - 8, m + 8, 20);
      drawRose(m + 8, h - m - 8, 20); drawRose(w - m - 8, h - m - 8, 20);
    },
  },
  MODERN_MINIMAL: {
    fontSerif: "'Pretendard', sans-serif",
    bg: (ctx, w, h) => {
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.008)';
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    },
    accent: '#1A1A1A', text: '#1A1A1A', textSub: '#888888', qrFg: '#1A1A1A', qrBg: '#FFFFFF',
    label: '모던 미니멀',
    ornament: (ctx, w, h) => {
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(30, 28, 50, 1.5); ctx.fillRect(30, 28, 1.5, 50);
      ctx.fillRect(w - 80, 28, 50, 1.5); ctx.fillRect(w - 31.5, 28, 1.5, 50);
      ctx.fillRect(30, h - 29.5, 50, 1.5); ctx.fillRect(30, h - 78, 1.5, 50);
      ctx.fillRect(w - 80, h - 29.5, 50, 1.5); ctx.fillRect(w - 31.5, h - 78, 1.5, 50);
    },
  },
  BOHEMIAN_DREAM: {
    fontSerif: "'Nanum Myeongjo', serif",
    bg: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#FAF6F1'); g.addColorStop(0.5, '#F8F0E8'); g.addColorStop(1, '#F5EDE4');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    accent: '#C9A87C', text: '#5C4A32', textSub: '#9A8B7A', qrFg: '#5C4A32', qrBg: '#FAF6F1',
    label: '보헤미안 드림',
    ornament: (ctx, w, h) => {
      const drawLeaf = (cx: number, cy: number, a: number, s: number) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
        ctx.fillStyle = 'rgba(201,168,124,0.06)';
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(s * 0.3, -s * 0.5, s * 0.7, -s * 0.5, s, 0);
        ctx.bezierCurveTo(s * 0.7, s * 0.5, s * 0.3, s * 0.5, 0, 0); ctx.fill();
        ctx.strokeStyle = 'rgba(201,168,124,0.15)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s, 0); ctx.stroke();
        ctx.restore();
      };
      for (let i = 0; i < 5; i++) {
        drawLeaf(8, h * 0.2 + i * (h * 0.15), -0.3 + i * 0.12, 28);
        drawLeaf(w - 8, h * 0.2 + i * (h * 0.15), Math.PI + 0.3 - i * 0.12, 28);
      }
    },
  },
  LUXURY_GOLD: {
    fontSerif: "'Playfair Display', serif",
    bg: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0D0D0D'); g.addColorStop(0.5, '#111111'); g.addColorStop(1, '#0A0A0A');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(212,175,55,0.02)';
      for (let i = 0; i < w; i += 8) for (let j = 0; j < h; j += 8) {
        if ((i + j) % 16 === 0) ctx.fillRect(i, j, 3, 3);
      }
    },
    accent: '#D4AF37', text: '#D4AF37', textSub: '#8B7355', qrFg: '#D4AF37', qrBg: '#0D0D0D',
    label: '럭셔리 골드',
    ornament: (ctx, w, h) => {
      ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 1.5;
      const m = 22;
      ctx.beginPath(); ctx.moveTo(m + 20, m); ctx.lineTo(w - m - 20, m); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m + 20, h - m); ctx.lineTo(w - m - 20, h - m); ctx.stroke();
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(m + 20, m + 4); ctx.lineTo(w - m - 20, m + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m + 20, h - m - 4); ctx.lineTo(w - m - 20, h - m - 4); ctx.stroke();
      const drawDiamond = (cx: number, cy: number, s: number) => {
        ctx.save(); ctx.translate(cx, cy);
        ctx.strokeStyle = 'rgba(212,175,55,0.7)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.6, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.6, 0); ctx.closePath(); ctx.stroke();
        ctx.fillStyle = 'rgba(212,175,55,0.08)'; ctx.fill();
        ctx.restore();
      };
      drawDiamond(m + 8, m + 2, 10); drawDiamond(w - m - 8, m + 2, 10);
      drawDiamond(m + 8, h - m - 2, 10); drawDiamond(w - m - 8, h - m - 2, 10);
    },
  },
  POETIC_LOVE: {
    fontSerif: "'NostalgicMyoeunHeullim', 'Nanum Myeongjo', serif",
    bg: (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      g.addColorStop(0, '#FDFCFE'); g.addColorStop(1, '#F5F0FA');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    accent: '#B8A0C8', text: '#4A4055', textSub: '#8A7A95', qrFg: '#4A4055', qrBg: '#FDFCFE',
    label: '포에틱 러브',
    ornament: (ctx, w, h) => {
      for (let i = 0; i < 15; i++) {
        const x = 15 + ((i * 73) % (w - 30)), y = 12 + ((i * 97) % (h - 24)), r = 1.5 + (i % 4) * 1.5;
        ctx.fillStyle = `rgba(184,160,200,${0.06 + (i % 3) * 0.04})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(184,160,200,0.15)'; ctx.lineWidth = 0.8; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(w - 32, 32); ctx.lineTo(w - 32, h - 32); ctx.lineTo(32, h - 32); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    },
  },
  SENIOR_SIMPLE: {
    fontSerif: "'Pretendard', sans-serif",
    bg: (ctx, w, h) => { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h); },
    accent: '#5C5C5C', text: '#333333', textSub: '#777777', qrFg: '#333333', qrBg: '#FFFFFF',
    label: '어르신용 심플',
    ornament: (ctx, w, h) => {
      ctx.strokeStyle = '#CCCCCC'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(28, 18); ctx.lineTo(w - 28, 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28, h - 18); ctx.lineTo(w - 28, h - 18); ctx.stroke();
      ctx.strokeStyle = '#E0E0E0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(28, 24); ctx.lineTo(w - 28, 24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28, h - 24); ctx.lineTo(w - 28, h - 24); ctx.stroke();
    },
  },
  FOREST_GARDEN: {
    fontSerif: "'Pretendard', sans-serif",
    bg: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#F9FBF8'); g.addColorStop(1, '#EFF5EC');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    accent: '#5C6B54', text: '#3A4A3A', textSub: '#6B7B6B', qrFg: '#3A4A3A', qrBg: '#F9FBF8',
    label: '포레스트 가든',
    ornament: (ctx, w, h) => {
      const drawLeaf = (cx: number, cy: number, a: number, s: number, o: number) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
        ctx.fillStyle = `rgba(92,107,84,${o})`;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(s * 0.4, -s * 0.6, s, -s * 0.3, s, 0);
        ctx.bezierCurveTo(s, s * 0.3, s * 0.4, s * 0.6, 0, 0); ctx.fill();
        ctx.strokeStyle = `rgba(92,107,84,${o + 0.05})`; ctx.lineWidth = 0.4;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.9, 0); ctx.stroke();
        ctx.restore();
      };
      for (let i = 0; i < 5; i++) {
        drawLeaf(6, 18 + i * (h * 0.18), -0.2 + i * 0.1, 26, 0.06 + i * 0.01);
        drawLeaf(w - 6, 18 + i * (h * 0.18), Math.PI + 0.2 - i * 0.1, 26, 0.06 + i * 0.01);
      }
    },
  },
  OCEAN_BREEZE: {
    fontSerif: "'Pretendard', sans-serif",
    bg: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#F0F8FC'); g.addColorStop(0.6, '#E4F1F8'); g.addColorStop(1, '#D8EBF4');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    accent: '#5B8FA8', text: '#2C4A5A', textSub: '#6A8A9A', qrFg: '#2C4A5A', qrBg: '#F0F8FC',
    label: '오션 브리즈',
    ornament: (ctx, w, h) => {
      ctx.strokeStyle = 'rgba(91,143,168,0.12)'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const y = h - 18 - i * 10 + Math.sin(x * 0.018 + i * 0.8) * 5;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
  },
  GLASS_BUBBLE: {
    fontSerif: "'ChangwonDangamRounded', sans-serif",
    bg: (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      g.addColorStop(0, '#FAFAFF'); g.addColorStop(1, '#F0EEF8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    accent: '#A89ED0', text: '#4A4560', textSub: '#8A85A0', qrFg: '#4A4560', qrBg: '#FAFAFF',
    label: '글라스 버블',
    ornament: (ctx, w, h) => {
      for (let i = 0; i < 16; i++) {
        const cx = 25 + ((i * 67) % (w - 50)), cy = 18 + ((i * 89) % (h - 36)), r = 4 + (i % 5) * 3;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(168,158,208,${0.08 + (i % 4) * 0.03})`; ctx.lineWidth = 0.7; ctx.stroke();
        const hl = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        hl.addColorStop(0, `rgba(255,255,255,${0.1 + (i % 3) * 0.05})`);
        hl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hl; ctx.fill();
      }
    },
  },
  SPRING_BREEZE: {
    fontSerif: "'HsBombaram', serif",
    bg: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#FFFAFC'); g.addColorStop(0.5, '#FEF5F9'); g.addColorStop(1, '#FCF0F5');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    accent: '#E8B4C8', text: '#5A4550', textSub: '#9A8590', qrFg: '#5A4550', qrBg: '#FFFAFC',
    label: '봄바람',
    ornament: (ctx, w, h) => {
      const drawPetal = (cx: number, cy: number, a: number, s: number, o: number) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
        ctx.fillStyle = `rgba(232,180,200,${o})`;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(s * 0.3, -s * 0.7, s * 0.7, -s * 0.5, s * 0.5, 0);
        ctx.bezierCurveTo(s * 0.7, s * 0.5, s * 0.3, s * 0.7, 0, 0); ctx.fill(); ctx.restore();
      };
      for (let i = 0; i < 7; i++) {
        drawPetal(12 + i * 14, 12, -0.5 + i * 0.15, 14, 0.06 + (i % 3) * 0.02);
        drawPetal(w - 12 - i * 14, h - 12, Math.PI - 0.5 + i * 0.15, 14, 0.06 + (i % 3) * 0.02);
      }
    },
  },
  GALLERY_MIRIM_1: {
    fontSerif: "'MapoFlowerIsland', serif",
    bg: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#FDFCFA'); g.addColorStop(1, '#F5F2ED');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    accent: '#9A8A74', text: '#4A4238', textSub: '#8A8070', qrFg: '#4A4238', qrBg: '#FDFCFA',
    label: 'Gallery 美林-1',
    ornament: (ctx, w, h) => {
      ctx.strokeStyle = 'rgba(154,138,116,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(22, 22); ctx.lineTo(w - 22, 22); ctx.lineTo(w - 22, h - 22); ctx.lineTo(22, h - 22); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = 'rgba(154,138,116,0.3)';
      [22, w - 25].forEach(x => [22, h - 25].forEach(y => ctx.fillRect(x, y, 3, 3)));
    },
  },
  GALLERY_MIRIM_2: {
    fontSerif: "'KyoboHandwriting2020ParkDoYeon', serif",
    bg: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#FAFCFA'); g.addColorStop(1, '#F2F6F2');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    accent: '#6A7B70', text: '#3A4A40', textSub: '#7A8A80', qrFg: '#3A4A40', qrBg: '#FAFCFA',
    label: 'Gallery 美林-2',
    ornament: (ctx, w, h) => {
      ctx.strokeStyle = 'rgba(106,123,112,0.2)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(20, 20); ctx.lineTo(w - 20, 20); ctx.lineTo(w - 20, h - 20); ctx.lineTo(20, h - 20); ctx.closePath(); ctx.stroke();
      ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(106,123,112,0.12)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(28, 28); ctx.lineTo(w - 28, 28); ctx.lineTo(w - 28, h - 28); ctx.lineTo(28, h - 28); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    },
  },
  LUNA_HALFMOON: {
    fontSerif: "'MapoDacapo', serif",
    bg: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
      g.addColorStop(0, '#F8FAFC'); g.addColorStop(0.5, '#F0F4F8'); g.addColorStop(1, '#E8EEF4');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const rg = ctx.createRadialGradient(w * 0.75, h * 0.2, 0, w * 0.75, h * 0.2, Math.max(w, h) * 0.5);
      rg.addColorStop(0, 'rgba(210,225,240,0.08)'); rg.addColorStop(1, 'rgba(210,225,240,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    },
    accent: '#B0C4D4', text: '#4A5A68', textSub: '#7A8A98', qrFg: '#4A5A68', qrBg: '#F8FAFC',
    label: 'Luna Halfmoon',
    ornament: (ctx, w, h) => {
      ctx.fillStyle = 'rgba(176,196,212,0.15)';
      ctx.beginPath(); ctx.arc(w - 42, 38, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#F0F4F8';
      ctx.beginPath(); ctx.arc(w - 33, 33, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(176,196,212,0.04)';
      ctx.beginPath(); ctx.arc(w - 42, 38, 32, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 20; i++) {
        const x = 12 + ((i * 79 + 23) % (w - 24)), y = 10 + ((i * 53 + 11) % (h - 20)), r = 0.5 + (i % 4) * 0.4;
        ctx.fillStyle = `rgba(176,196,212,${0.08 + (i % 3) * 0.06})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        if (i % 4 === 0) {
          ctx.fillStyle = 'rgba(176,196,212,0.03)';
          ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.strokeStyle = 'rgba(176,196,212,0.08)'; ctx.lineWidth = 0.5; ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(28, 22); ctx.lineTo(w - 55, 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28, h - 22); ctx.lineTo(w - 28, h - 22); ctx.stroke();
      ctx.setLineDash([]);
    },
  },
  PEARL_DRIFT: {
    fontSerif: "'MapoDacapo', sans-serif",
    bg: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#050505'); g.addColorStop(0.4, '#0A0A0A'); g.addColorStop(1, '#080808');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(200,215,225,0.01)';
      for (let i = 0; i < w; i += 5) for (let j = 0; j < h; j += 5) {
        if ((i * j) % 37 < 3) ctx.fillRect(i, j, 1, 1);
      }
    },
    accent: '#C8D8E4', text: '#E8EEF2', textSub: '#8A9AA8', qrFg: '#C8D8E4', qrBg: '#0A0A0A',
    label: 'Pearl Drift',
    ornament: (ctx, w, h) => {
      for (let i = 0; i < 9; i++) {
        const cx = 25 + i * ((w - 50) / 8), cy = h - 30, r = 4 + (i % 3) * 2.5;
        const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(227,235,243,0.18)'); g.addColorStop(0.5, 'rgba(200,215,225,0.08)'); g.addColorStop(1, 'rgba(180,195,210,0.02)');
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = 'rgba(227,235,243,0.06)'; ctx.lineWidth = 0.5; ctx.stroke();
      }
      for (let i = 0; i < 5; i++) {
        const cx = 40 + i * ((w - 80) / 4), cy = 25, r = 2 + (i % 2) * 1.5;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(227,235,243,0.12)'); g.addColorStop(1, 'rgba(200,215,225,0)');
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      }
      ctx.strokeStyle = 'rgba(200,215,225,0.06)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(30, 16); ctx.lineTo(w - 30, 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(30, h - 16); ctx.lineTo(w - 30, h - 16); ctx.stroke();
    },
  },
  NIGHT_SEA: {
    fontSerif: "'ZenSerif', serif",
    bg: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#070B14'); g.addColorStop(0.3, '#0A1E32'); g.addColorStop(0.7, '#0D2844'); g.addColorStop(1, '#0F3A5E');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    accent: '#C8D8E8', text: '#E8EEF2', textSub: '#8A9AA8', qrFg: '#C8D8E8', qrBg: '#0A1525',
    label: '밤바다',
    ornament: (ctx, w, h) => {
      for (let i = 0; i < 40; i++) {
        const x = 8 + ((i * 73 + 17) % (w - 16)), y = 6 + ((i * 47 + 31) % (h - 12));
        const r = 0.3 + (i % 5) * 0.3, a = 0.15 + (i % 4) * 0.12;
        ctx.fillStyle = `rgba(200,216,232,${a})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        if (i % 5 === 0) {
          ctx.fillStyle = `rgba(200,216,232,${a * 0.3})`;
          ctx.beginPath(); ctx.arc(x, y, r * 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.fillStyle = 'rgba(255,240,200,0.08)';
      ctx.beginPath(); ctx.arc(w - 45, 35, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#070B14';
      ctx.beginPath(); ctx.arc(w - 37, 31, 15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(200,216,232,0.06)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const y = h - 14 - i * 8 + Math.sin(x * 0.015 + i * 1.8) * 4;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
  },
  AQUA_GLOBE: {
    fontSerif: "'TaebaekMilkyWay', sans-serif",
    bg: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#D6EFFA'); g.addColorStop(0.4, '#E0F3FC'); g.addColorStop(0.7, '#C4E5F5'); g.addColorStop(1, '#A8D8EB');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    accent: '#5B8FA8', text: '#2C4A5A', textSub: '#4A7A90', qrFg: '#2C4A5A', qrBg: '#E4F4FC',
    label: '아쿠아 글로브',
    ornament: (ctx, w, h) => {
      for (let i = 0; i < 10; i++) {
        const cx = 20 + ((i * 97) % (w - 40)), cy = 15 + ((i * 71) % (h - 30)), r = 3 + (i % 4) * 3;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.2 + (i % 3) * 0.1})`; ctx.lineWidth = 0.8; ctx.stroke();
        const hl = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        hl.addColorStop(0, `rgba(255,255,255,${0.12 + (i % 3) * 0.04})`);
        hl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hl; ctx.fill();
      }
      const drawFish = (fx: number, fy: number, s: number, flip: boolean) => {
        ctx.save(); ctx.translate(fx, fy);
        if (flip) ctx.scale(-1, 1);
        ctx.fillStyle = 'rgba(255,140,58,0.15)';
        ctx.beginPath(); ctx.moveTo(s * 0.9, 0);
        ctx.bezierCurveTo(s * 0.6, -s * 0.3, s * 0.1, -s * 0.35, -s * 0.25, -s * 0.12);
        ctx.bezierCurveTo(-s * 0.4, -s * 0.04, -s * 0.4, s * 0.04, -s * 0.25, s * 0.12);
        ctx.bezierCurveTo(s * 0.1, s * 0.35, s * 0.6, s * 0.3, s * 0.9, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-s * 0.3, 0);
        ctx.bezierCurveTo(-s * 0.45, -s * 0.2, -s * 0.55, -s * 0.15, -s * 0.5, 0);
        ctx.bezierCurveTo(-s * 0.55, s * 0.15, -s * 0.45, s * 0.2, -s * 0.3, 0); ctx.fill();
        ctx.fillStyle = 'rgba(50,80,100,0.2)';
        ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.06, s * 0.045, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      };
      drawFish(w * 0.15, h * 0.3, 28, false);
      drawFish(w * 0.8, h * 0.65, 22, true);
      drawFish(w * 0.5, h * 0.15, 18, false);
    },
  },
};

function formatKoreanDate(dateStr: string) {
  const d = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

export default function QRCardModal({ isOpen, onClose, wedding }: QRCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);

  const currentSize = CARD_SIZES[sizeIdx];
  const design = THEME_DESIGNS[wedding.theme] || THEME_DESIGNS.ROMANTIC_CLASSIC;
  const weddingUrl = `${window.location.origin}/w/${wedding.slug}`;

  useEffect(() => {
    if (isOpen && !fontsReady) {
      loadFonts(wedding.theme).then(() => setFontsReady(true));
    }
  }, [isOpen, fontsReady]);

  const renderCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !fontsReady) return;
    setRendering(true);

    const W = currentSize.w;
    const H = currentSize.h;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    design.bg(ctx, W, H);
    design.ornament(ctx, W, H);

    const qrSize = Math.min(W, H) * (sizeIdx === 0 ? 0.52 : 0.32);
    const qrDataUrl = await QRCode.toDataURL(weddingUrl, {
      width: Math.round(qrSize),
      margin: 2,
      color: { dark: design.qrFg, light: design.qrBg },
      errorCorrectionLevel: 'H',
    });

    const qrImg = new Image();
    await new Promise<void>((resolve) => { qrImg.onload = () => resolve(); qrImg.src = qrDataUrl; });

    const isNamecard = sizeIdx === 0;
    const serif = design.fontSerif || '"Noto Serif KR", serif';
    const sans = 'Pretendard, "Apple SD Gothic Neo", sans-serif';

    if (isNamecard) {
      const leftW = W * 0.52;
      const textX = leftW / 2;
      ctx.font = `600 30px ${serif}`;
      ctx.fillStyle = design.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const nameY = H * 0.36;
      ctx.fillText(wedding.groomName, textX, nameY - 18);
      ctx.font = `300 16px ${sans}`;
      ctx.fillStyle = design.textSub;
      ctx.fillText('&', textX, nameY + 6);
      ctx.font = `600 30px ${serif}`;
      ctx.fillStyle = design.text;
      ctx.fillText(wedding.brideName, textX, nameY + 30);
      ctx.font = `300 13px ${sans}`;
      ctx.fillStyle = design.textSub;
      ctx.fillText(formatKoreanDate(wedding.weddingDate), textX, H * 0.68);
      if (wedding.weddingTime) ctx.fillText(wedding.weddingTime, textX, H * 0.68 + 20);
      if (wedding.venueName) {
        ctx.font = `400 12px ${sans}`;
        const venueText = wedding.venueHall ? `${wedding.venueName} ${wedding.venueHall}` : wedding.venueName;
        ctx.fillText(venueText, textX, H * 0.88);
      }
      const qrX = leftW + (W - leftW - qrSize) / 2;
      const qrY = (H - qrSize) / 2;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.04)'; ctx.shadowBlur = 12;
      ctx.fillStyle = design.qrBg;
      const rr = 8;
      ctx.beginPath();
      ctx.moveTo(qrX - 10 + rr, qrY - 10);
      ctx.arcTo(qrX + qrSize + 10, qrY - 10, qrX + qrSize + 10, qrY + qrSize + 10, rr);
      ctx.arcTo(qrX + qrSize + 10, qrY + qrSize + 10, qrX - 10, qrY + qrSize + 10, rr);
      ctx.arcTo(qrX - 10, qrY + qrSize + 10, qrX - 10, qrY - 10, rr);
      ctx.arcTo(qrX - 10, qrY - 10, qrX + qrSize + 10, qrY - 10, rr);
      ctx.fill(); ctx.restore();
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      ctx.font = `300 9px ${sans}`;
      ctx.fillStyle = design.textSub + '80';
      ctx.fillText('QR 스캔', qrX + qrSize / 2, qrY + qrSize + 18);
      ctx.strokeStyle = design.accent + '30'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(leftW, H * 0.12); ctx.lineTo(leftW, H * 0.88); ctx.stroke();
    } else {
      ctx.font = `600 38px ${serif}`;
      ctx.fillStyle = design.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(wedding.groomName, W / 2, H * 0.12);
      ctx.font = `300 18px ${sans}`;
      ctx.fillStyle = design.textSub;
      ctx.fillText('&', W / 2, H * 0.12 + 38);
      ctx.font = `600 38px ${serif}`;
      ctx.fillStyle = design.text;
      ctx.fillText(wedding.brideName, W / 2, H * 0.12 + 76);
      ctx.font = `300 15px ${sans}`;
      ctx.fillStyle = design.textSub;
      ctx.fillText(formatKoreanDate(wedding.weddingDate), W / 2, H * 0.12 + 114);
      if (wedding.weddingTime) ctx.fillText(wedding.weddingTime, W / 2, H * 0.12 + 136);
      ctx.strokeStyle = design.accent + '30'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(W * 0.35, H * 0.26); ctx.lineTo(W * 0.65, H * 0.26); ctx.stroke();
      const qrX = (W - qrSize) / 2;
      const qrY = H * 0.30;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.04)'; ctx.shadowBlur = 16;
      ctx.fillStyle = design.qrBg;
      const rr = 10;
      ctx.beginPath();
      ctx.moveTo(qrX - 14 + rr, qrY - 14);
      ctx.arcTo(qrX + qrSize + 14, qrY - 14, qrX + qrSize + 14, qrY + qrSize + 14, rr);
      ctx.arcTo(qrX + qrSize + 14, qrY + qrSize + 14, qrX - 14, qrY + qrSize + 14, rr);
      ctx.arcTo(qrX - 14, qrY + qrSize + 14, qrX - 14, qrY - 14, rr);
      ctx.arcTo(qrX - 14, qrY - 14, qrX + qrSize + 14, qrY - 14, rr);
      ctx.fill(); ctx.restore();
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      ctx.font = `300 13px ${sans}`;
      ctx.fillStyle = design.textSub;
      ctx.fillText('카메라로 QR을 스캔해주세요', W / 2, qrY + qrSize + 35);
      if (wedding.venueName) {
        const venueY = H * 0.68;
        ctx.strokeStyle = design.accent + '25'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(W * 0.3, venueY - 22); ctx.lineTo(W * 0.7, venueY - 22); ctx.stroke();
        ctx.font = `400 15px ${sans}`;
        ctx.fillStyle = design.text;
        const venueText = wedding.venueHall ? `${wedding.venueName} ${wedding.venueHall}` : wedding.venueName;
        ctx.fillText(venueText, W / 2, venueY);
      }
      ctx.font = `300 12px ${sans}`;
      ctx.fillStyle = design.textSub + '40';
      ctx.fillText('우리의 시작을 함께해주세요', W / 2, H * 0.78);
      ctx.strokeStyle = design.accent + '18'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(W * 0.38, H * 0.78 + 16); ctx.lineTo(W * 0.62, H * 0.78 + 16); ctx.stroke();
      ctx.font = `300 10px ${sans}`;
      ctx.fillStyle = design.textSub + '50';
      ctx.fillText('청첩장 작업실', W / 2, H - 40);
    }

    setRendering(false);
  }, [currentSize, design, wedding, weddingUrl, sizeIdx, fontsReady]);

  useEffect(() => {
    if (isOpen && fontsReady) renderCard();
  }, [isOpen, renderCard, fontsReady]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${wedding.groomName}_${wedding.brideName}_QR_${currentSize.id}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-stone-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h3 className="text-lg font-medium text-stone-800">인쇄용 QR 카드</h3>
              <p className="text-sm text-stone-400 mt-0.5">{design.label}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-stone-500" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex gap-2">
              {CARD_SIZES.map((size, idx) => (
                <button
                  key={size.id}
                  onClick={() => setSizeIdx(idx)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm transition-all ${
                    sizeIdx === idx ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {size.label}
                  <span className="block text-xs mt-0.5 opacity-60">{size.ratio}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-center bg-stone-50 rounded-xl p-6">
              {!fontsReady ? (
                <div className="h-48 flex items-center justify-center text-sm text-stone-400">폰트 로딩 중...</div>
              ) : (
                <canvas
                  ref={canvasRef}
                  className="shadow-lg rounded-lg"
                  style={{
                    maxWidth: '100%',
                    maxHeight: sizeIdx === 0 ? '240px' : '400px',
                    objectFit: 'contain',
                  }}
                />
              )}
            </div>
            <div className="bg-stone-50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-stone-700">인쇄 가이드</p>
              <ul className="text-xs text-stone-500 space-y-1.5 leading-relaxed">
                <li>· 명함 사이즈 (90×50mm) — 지갑에 쏙, 봉투에 함께 동봉</li>
                <li>· 엽서 사이즈 (100×148mm) — 단독으로 전달하기 좋은 크기</li>
                <li>· 추천 용지: 모조지 250g, 린넨지, 면지, 스노우화이트</li>
                <li>· 고해상도 300dpi 이상으로 출력됩니다</li>
              </ul>
            </div>
            <button
              onClick={handleDownload}
              disabled={rendering || !fontsReady}
              className="w-full py-3.5 bg-stone-800 text-white rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-stone-900 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {rendering ? '생성 중...' : '고해상도 PNG 다운로드'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
