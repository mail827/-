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

const THEME_DESIGNS: Record<string, {
  bg: string[];
  accent: string;
  text: string;
  textSub: string;
  qrFg: string;
  qrBg: string;
  label: string;
  ornament: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}> = {
  ROMANTIC_CLASSIC: {
    bg: ['#FDF9F7', '#F5E6E0'],
    accent: '#D4A5A5',
    text: '#5D4E4E',
    textSub: '#9A8A8A',
    qrFg: '#5D4E4E',
    qrBg: '#FDF9F7',
    label: '로맨틱 클래식',
    ornament: (ctx, w, h) => {
      ctx.strokeStyle = '#D4A5A5';
      ctx.lineWidth = 1.5;
      const m = 30;
      ctx.beginPath();
      ctx.moveTo(m, m); ctx.lineTo(w - m, m); ctx.lineTo(w - m, h - m); ctx.lineTo(m, h - m); ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(m + 8, m + 8); ctx.lineTo(w - m - 8, m + 8); ctx.lineTo(w - m - 8, h - m - 8); ctx.lineTo(m + 8, h - m - 8); ctx.closePath();
      ctx.stroke();
      const drawRose = (cx: number, cy: number, s: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = 'rgba(212,165,165,0.3)';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, s * (1 - i * 0.15), s * 0.6 * (1 - i * 0.15), (i * Math.PI) / 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };
      drawRose(m + 20, m + 20, 18);
      drawRose(w - m - 20, m + 20, 18);
      drawRose(m + 20, h - m - 20, 18);
      drawRose(w - m - 20, h - m - 20, 18);
    },
  },
  MODERN_MINIMAL: {
    bg: ['#FFFFFF', '#F5F5F5'],
    accent: '#1A1A1A',
    text: '#1A1A1A',
    textSub: '#888888',
    qrFg: '#1A1A1A',
    qrBg: '#FFFFFF',
    label: '모던 미니멀',
    ornament: (ctx, w, h) => {
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(24, 24, 40, 2);
      ctx.fillRect(24, 24, 2, 40);
      ctx.fillRect(w - 64, 24, 40, 2);
      ctx.fillRect(w - 26, 24, 2, 40);
      ctx.fillRect(24, h - 26, 40, 2);
      ctx.fillRect(24, h - 64, 2, 40);
      ctx.fillRect(w - 64, h - 26, 40, 2);
      ctx.fillRect(w - 26, h - 64, 2, 40);
    },
  },
  BOHEMIAN_DREAM: {
    bg: ['#FAF6F1', '#F5EDE4'],
    accent: '#C9A87C',
    text: '#5C4A32',
    textSub: '#9A8B7A',
    qrFg: '#5C4A32',
    qrBg: '#FAF6F1',
    label: '보헤미안 드림',
    ornament: (ctx, w, h) => {
      ctx.strokeStyle = 'rgba(201,168,124,0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const x = 20 + (i * (w - 40)) / 11;
        ctx.beginPath();
        ctx.moveTo(x, 15);
        ctx.bezierCurveTo(x + 5, 25, x - 5, 35, x, 45);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, h - 15);
        ctx.bezierCurveTo(x + 5, h - 25, x - 5, h - 35, x, h - 45);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(201,168,124,0.15)';
      const drawLeaf = (cx: number, cy: number, angle: number, s: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(s * 0.3, -s * 0.5, s * 0.7, -s * 0.5, s, 0);
        ctx.bezierCurveTo(s * 0.7, s * 0.5, s * 0.3, s * 0.5, 0, 0);
        ctx.fill();
        ctx.restore();
      };
      drawLeaf(15, h / 2 - 30, -0.3, 25);
      drawLeaf(15, h / 2, 0, 25);
      drawLeaf(15, h / 2 + 30, 0.3, 25);
      drawLeaf(w - 15, h / 2 - 30, Math.PI + 0.3, 25);
      drawLeaf(w - 15, h / 2, Math.PI, 25);
      drawLeaf(w - 15, h / 2 + 30, Math.PI - 0.3, 25);
    },
  },
  LUXURY_GOLD: {
    bg: ['#0D0D0D', '#1A1A1A'],
    accent: '#D4AF37',
    text: '#D4AF37',
    textSub: '#8B7355',
    qrFg: '#D4AF37',
    qrBg: '#0D0D0D',
    label: '럭셔리 골드',
    ornament: (ctx, w, h) => {
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      const m = 25;
      ctx.beginPath();
      ctx.moveTo(m + 15, m); ctx.lineTo(w - m - 15, m);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(m + 15, h - m); ctx.lineTo(w - m - 15, h - m);
      ctx.stroke();
      ctx.lineWidth = 1;
      const drawDeco = (cx: number, cy: number, s: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.strokeStyle = 'rgba(212,175,55,0.6)';
        ctx.beginPath();
        ctx.moveTo(-s, 0); ctx.lineTo(0, -s * 0.6); ctx.lineTo(s, 0); ctx.lineTo(0, s * 0.6); ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      };
      drawDeco(m, m, 12);
      drawDeco(w - m, m, 12);
      drawDeco(m, h - m, 12);
      drawDeco(w - m, h - m, 12);
      drawDeco(w / 2, m, 10);
      drawDeco(w / 2, h - m, 10);
    },
  },
  POETIC_LOVE: {
    bg: ['#FDFCFE', '#F8F5FA'],
    accent: '#B8A0C8',
    text: '#4A4055',
    textSub: '#8A7A95',
    qrFg: '#4A4055',
    qrBg: '#FDFCFE',
    label: '포에틱 러브',
    ornament: (ctx, w, h) => {
      ctx.fillStyle = 'rgba(184,160,200,0.12)';
      for (let i = 0; i < 8; i++) {
        const x = 20 + Math.random() * (w - 40);
        const y = 15 + Math.random() * (h - 30);
        ctx.beginPath();
        ctx.arc(x, y, 2 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(184,160,200,0.25)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(35, 35); ctx.lineTo(w - 35, 35); ctx.lineTo(w - 35, h - 35); ctx.lineTo(35, h - 35); ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    },
  },
  SENIOR_SIMPLE: {
    bg: ['#FFFFFF', '#F8F8F8'],
    accent: '#5C5C5C',
    text: '#333333',
    textSub: '#777777',
    qrFg: '#333333',
    qrBg: '#FFFFFF',
    label: '어르신용 심플',
    ornament: (ctx, w, h) => {
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 20); ctx.lineTo(w - 30, 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(30, h - 20); ctx.lineTo(w - 30, h - 20);
      ctx.stroke();
    },
  },
  FOREST_GARDEN: {
    bg: ['#F9FBF8', '#F4F7F2'],
    accent: '#5C6B54',
    text: '#3A4A3A',
    textSub: '#6B7B6B',
    qrFg: '#3A4A3A',
    qrBg: '#F9FBF8',
    label: '포레스트 가든',
    ornament: (ctx, w, h) => {
      ctx.fillStyle = 'rgba(92,107,84,0.1)';
      const drawLeaf = (cx: number, cy: number, angle: number, s: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(s * 0.4, -s * 0.6, s, -s * 0.3, s, 0);
        ctx.bezierCurveTo(s, s * 0.3, s * 0.4, s * 0.6, 0, 0);
        ctx.fill();
        ctx.strokeStyle = 'rgba(92,107,84,0.2)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      };
      for (let i = 0; i < 4; i++) {
        drawLeaf(10, 20 + i * 25, -0.2 + i * 0.15, 20);
        drawLeaf(w - 10, 20 + i * 25, Math.PI + 0.2 - i * 0.15, 20);
      }
      for (let i = 0; i < 4; i++) {
        drawLeaf(10, h - 20 - i * 25, 0.2 - i * 0.15, 20);
        drawLeaf(w - 10, h - 20 - i * 25, Math.PI - 0.2 + i * 0.15, 20);
      }
    },
  },
  OCEAN_BREEZE: {
    bg: ['#F8FCFD', '#F0F7FA'],
    accent: '#5B8FA8',
    text: '#2C4A5A',
    textSub: '#6A8A9A',
    qrFg: '#2C4A5A',
    qrBg: '#F8FCFD',
    label: '오션 브리즈',
    ornament: (ctx, w, h) => {
      ctx.strokeStyle = 'rgba(91,143,168,0.2)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y = h - 25 - i * 12 + Math.sin(x * 0.02 + i) * 5;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y = 25 + i * 12 + Math.sin(x * 0.02 + i + 2) * 5;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
  },
  GLASS_BUBBLE: {
    bg: ['#FAF9FC', '#F5F3FA'],
    accent: '#A89ED0',
    text: '#4A4560',
    textSub: '#8A85A0',
    qrFg: '#4A4560',
    qrBg: '#FAF9FC',
    label: '글라스 버블',
    ornament: (ctx, w, h) => {
      for (let i = 0; i < 12; i++) {
        const cx = 30 + Math.random() * (w - 60);
        const cy = 20 + Math.random() * (h - 40);
        const r = 4 + Math.random() * 12;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168,158,208,' + (0.1 + Math.random() * 0.15) + ')';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    },
  },
  SPRING_BREEZE: {
    bg: ['#FFFAFC', '#FDF5F8'],
    accent: '#E8B4C8',
    text: '#5A4550',
    textSub: '#9A8590',
    qrFg: '#5A4550',
    qrBg: '#FFFAFC',
    label: '봄바람',
    ornament: (ctx, w, h) => {
      ctx.fillStyle = 'rgba(232,180,200,0.12)';
      const drawPetal = (cx: number, cy: number, angle: number, s: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(s * 0.3, -s * 0.8, s * 0.8, -s * 0.5, s * 0.5, 0);
        ctx.bezierCurveTo(s * 0.8, s * 0.5, s * 0.3, s * 0.8, 0, 0);
        ctx.fill();
        ctx.restore();
      };
      for (let i = 0; i < 5; i++) {
        drawPetal(15 + i * 12, 15, -0.5 + i * 0.25, 12);
        drawPetal(w - 15 - i * 12, h - 15, Math.PI - 0.5 + i * 0.25, 12);
      }
    },
  },
  GALLERY_MIRIM_1: {
    bg: ['#FDFCFA', '#F7F5F2'],
    accent: '#9A8A74',
    text: '#4A4238',
    textSub: '#8A8070',
    qrFg: '#4A4238',
    qrBg: '#FDFCFA',
    label: 'Gallery 美林-1',
    ornament: (ctx, w, h) => {
      ctx.strokeStyle = 'rgba(154,138,116,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(25, 25); ctx.lineTo(w - 25, 25); ctx.lineTo(w - 25, h - 25); ctx.lineTo(25, h - 25); ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(154,138,116,0.15)';
      ctx.fillRect(25, 25, 3, 3);
      ctx.fillRect(w - 28, 25, 3, 3);
      ctx.fillRect(25, h - 28, 3, 3);
      ctx.fillRect(w - 28, h - 28, 3, 3);
    },
  },
  GALLERY_MIRIM_2: {
    bg: ['#FAFCFA', '#F5F7F5'],
    accent: '#6A7B70',
    text: '#3A4A40',
    textSub: '#7A8A80',
    qrFg: '#3A4A40',
    qrBg: '#FAFCFA',
    label: 'Gallery 美林-2',
    ornament: (ctx, w, h) => {
      ctx.strokeStyle = 'rgba(106,123,112,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 20); ctx.lineTo(w - 20, 20); ctx.lineTo(w - 20, h - 20); ctx.lineTo(20, h - 20); ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(28, 28); ctx.lineTo(w - 28, 28); ctx.lineTo(w - 28, h - 28); ctx.lineTo(28, h - 28); ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    },
  },
  LUNA_HALFMOON: {
    bg: ['#FFFFFF', '#FAFCFD'],
    accent: '#C5D4DE',
    text: '#5A6A74',
    textSub: '#8A9AA4',
    qrFg: '#5A6A74',
    qrBg: '#FFFFFF',
    label: 'Luna Halfmoon',
    ornament: (ctx, w, h) => {
      ctx.fillStyle = 'rgba(197,212,222,0.15)';
      ctx.beginPath();
      ctx.arc(w - 40, 40, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(w - 32, 36, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(197,212,222,0.08)';
      for (let i = 0; i < 6; i++) {
        const sx = 20 + Math.random() * (w - 40);
        const sy = 15 + Math.random() * (h - 30);
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  PEARL_DRIFT: {
    bg: ['#FAFCFD', '#F0F7FA'],
    accent: '#A8BDC9',
    text: '#5A6A74',
    textSub: '#8A9AA4',
    qrFg: '#5A6A74',
    qrBg: '#FAFCFD',
    label: 'Pearl Drift',
    ornament: (ctx, w, h) => {
      for (let i = 0; i < 5; i++) {
        const cx = 30 + i * ((w - 60) / 4);
        const cy = h - 30;
        const r = 6 + Math.random() * 4;
        const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(255,255,255,0.8)');
        g.addColorStop(0.5, 'rgba(200,220,235,0.3)');
        g.addColorStop(1, 'rgba(168,189,201,0.1)');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
    },
  },
  NIGHT_SEA: {
    bg: ['#050505', '#0A0A0A'],
    accent: '#C8D8E8',
    text: '#E8EEF2',
    textSub: '#8A9AA8',
    qrFg: '#C8D8E8',
    qrBg: '#0A0A0A',
    label: '밤바다',
    ornament: (ctx, w, h) => {
      ctx.fillStyle = 'rgba(200,216,232,0.1)';
      for (let i = 0; i < 20; i++) {
        const sx = 10 + Math.random() * (w - 20);
        const sy = 10 + Math.random() * (h - 20);
        const sr = 0.5 + Math.random() * 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(200,216,232,0.08)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y = h - 20 - i * 10 + Math.sin(x * 0.015 + i * 2) * 6;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
  },
  AQUA_GLOBE: {
    bg: ['#E4F4FC', '#D6EFFA'],
    accent: '#5B8FA8',
    text: '#2C4A5A',
    textSub: '#6A8A9A',
    qrFg: '#2C4A5A',
    qrBg: '#E4F4FC',
    label: '아쿠아 글로브',
    ornament: (ctx, w, h) => {
      for (let i = 0; i < 8; i++) {
        const cx = 25 + Math.random() * (w - 50);
        const cy = 20 + Math.random() * (h - 40);
        const r = 3 + Math.random() * 8;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(91,143,168,' + (0.12 + Math.random() * 0.1) + ')';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        const hl = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        hl.addColorStop(0, 'rgba(255,255,255,0.15)');
        hl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hl;
        ctx.fill();
      }
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

  const currentSize = CARD_SIZES[sizeIdx];
  const design = THEME_DESIGNS[wedding.theme] || THEME_DESIGNS.ROMANTIC_CLASSIC;
  const weddingUrl = `${window.location.origin}/w/${wedding.slug}`;

  const renderCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);

    const W = currentSize.w;
    const H = currentSize.h;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, design.bg[0]);
    bgGrad.addColorStop(1, design.bg[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    design.ornament(ctx, W, H);

    const qrSize = Math.min(W, H) * (sizeIdx === 0 ? 0.55 : 0.35);
    const qrDataUrl = await QRCode.toDataURL(weddingUrl, {
      width: qrSize,
      margin: 2,
      color: { dark: design.qrFg, light: design.qrBg },
      errorCorrectionLevel: 'H',
    });

    const qrImg = new Image();
    await new Promise<void>((resolve) => {
      qrImg.onload = () => resolve();
      qrImg.src = qrDataUrl;
    });

    const isNamecard = sizeIdx === 0;

    if (isNamecard) {
      const leftW = W * 0.5;
      const textX = leftW / 2;
      const nameSize = 28;
      ctx.font = `600 ${nameSize}px 'Noto Serif KR', serif`;
      ctx.fillStyle = design.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${wedding.groomName} & ${wedding.brideName}`, textX, H * 0.38);

      ctx.font = `300 14px 'Pretendard', sans-serif`;
      ctx.fillStyle = design.textSub;
      ctx.fillText(formatKoreanDate(wedding.weddingDate), textX, H * 0.55);

      if (wedding.weddingTime) {
        ctx.fillText(wedding.weddingTime, textX, H * 0.55 + 22);
      }

      if (wedding.venueName) {
        ctx.font = `400 13px 'Pretendard', sans-serif`;
        ctx.fillStyle = design.textSub;
        const venueText = wedding.venueHall ? `${wedding.venueName} ${wedding.venueHall}` : wedding.venueName;
        ctx.fillText(venueText, textX, H * 0.78);
      }

      const qrX = leftW + (W - leftW - qrSize) / 2;
      const qrY = (H - qrSize) / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.06)';
      ctx.shadowBlur = 15;
      ctx.fillStyle = design.qrBg;
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      ctx.restore();
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      ctx.strokeStyle = design.accent;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(leftW, H * 0.15);
      ctx.lineTo(leftW, H * 0.85);
      ctx.stroke();

    } else {
      const nameSize = 36;
      ctx.font = `600 ${nameSize}px 'Noto Serif KR', serif`;
      ctx.fillStyle = design.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${wedding.groomName} & ${wedding.brideName}`, W / 2, H * 0.12);

      ctx.font = `300 16px 'Pretendard', sans-serif`;
      ctx.fillStyle = design.textSub;
      ctx.fillText(formatKoreanDate(wedding.weddingDate), W / 2, H * 0.18);

      if (wedding.weddingTime) {
        ctx.fillText(wedding.weddingTime, W / 2, H * 0.18 + 24);
      }

      const qrX = (W - qrSize) / 2;
      const qrY = H * 0.3;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.06)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = design.qrBg;
      ctx.fillRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);
      ctx.restore();
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      ctx.font = `400 13px 'Pretendard', sans-serif`;
      ctx.fillStyle = design.textSub;
      ctx.fillText('카메라로 QR을 스캔해주세요', W / 2, qrY + qrSize + 35);

      if (wedding.venueName) {
        const venueY = H * 0.75;
        ctx.strokeStyle = design.accent + '40';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(W * 0.3, venueY - 20);
        ctx.lineTo(W * 0.7, venueY - 20);
        ctx.stroke();

        ctx.font = `400 15px 'Pretendard', sans-serif`;
        ctx.fillStyle = design.text;
        const venueText = wedding.venueHall ? `${wedding.venueName} ${wedding.venueHall}` : wedding.venueName;
        ctx.fillText(venueText, W / 2, venueY);
      }

      ctx.font = `300 11px 'Pretendard', sans-serif`;
      ctx.fillStyle = design.textSub + '80';
      ctx.fillText('청첩장 작업실', W / 2, H - 40);
    }

    setRendering(false);
  }, [currentSize, design, wedding, weddingUrl, sizeIdx]);

  useEffect(() => {
    if (isOpen) renderCard();
  }, [isOpen, renderCard]);

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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-stone-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h3 className="text-lg font-medium text-stone-800">인쇄용 QR 카드</h3>
              <p className="text-sm text-stone-400 mt-0.5">테마: {design.label}</p>
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
                    sizeIdx === idx
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {size.label}
                  <span className="block text-xs mt-0.5 opacity-60">{size.ratio}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-center bg-stone-50 rounded-xl p-6">
              <canvas
                ref={canvasRef}
                className="shadow-lg rounded-lg"
                style={{
                  maxWidth: '100%',
                  maxHeight: sizeIdx === 0 ? '240px' : '400px',
                  objectFit: 'contain',
                }}
              />
            </div>

            <div className="bg-stone-50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-stone-700">인쇄 가이드</p>
              <ul className="text-xs text-stone-500 space-y-1.5 leading-relaxed">
                <li>· 명함 사이즈 (90×50mm) — 지갑에 쏙, 봉투에 함께 동봉</li>
                <li>· 엽서 사이즈 (100×148mm) — 단독으로 전달하기 좋은 크기</li>
                <li>· 추천 용지: 모조지 250g, 린넨지, 면지, 스노우화이트</li>
                <li>· 해상도 300dpi 이상으로 출력됩니다</li>
              </ul>
            </div>

            <button
              onClick={handleDownload}
              disabled={rendering}
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
