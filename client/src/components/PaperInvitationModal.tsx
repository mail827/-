import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wedding: {
    slug: string;
    groomName: string;
    brideName: string;
    groomNameEn?: string;
    brideNameEn?: string;
    groomFatherName?: string;
    groomMotherName?: string;
    brideFatherName?: string;
    brideMotherName?: string;
    weddingDate: string;
    weddingTime: string;
    venue: string;
    venueHall?: string;
    venueAddress: string;
    venueKakaoMap?: string;
    transportInfo?: string;
    parkingInfo?: string;
    groomPhone?: string;
    bridePhone?: string;
    greeting?: string;
    greetingTitle?: string;
  };
  photoUrl?: string;
}

const PW = 2400;
const PH = 900;

async function ensureFonts() {
  if (!document.getElementById('paper-inv-fonts')) {
    const link = document.createElement('link');
    link.id = 'paper-inv-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200;300;400;600;700&family=Nanum+Myeongjo:wght@400;700;800&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap';
    document.head.appendChild(link);
  }
  if (!document.getElementById('paper-inv-extra')) {
    const s = document.createElement('style');
    s.id = 'paper-inv-extra';
    s.textContent = "@font-face{font-family:'MaruBuri';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-10-21@1.0/MaruBuri-Regular.woff') format('woff');font-weight:400;font-display:swap;}@font-face{font-family:'MapoDacapo';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/MapoDacapoA.woff') format('woff');font-weight:400;font-display:swap;}@font-face{font-family:'LunaSerif';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/MapoDacapoA.woff') format('woff2');font-weight:400;font-display:swap;}";
    document.head.appendChild(s);
  }
  await Promise.all([
    document.fonts.load('700 48px "Noto Serif KR"'),
    document.fonts.load('800 48px "Nanum Myeongjo"'),
    document.fonts.load('600 48px "Cormorant Garamond"'),
    document.fonts.load('700 48px "Playfair Display"'),
    document.fonts.load('400 48px "MaruBuri"'),
    document.fonts.load('400 48px "MapoDacapo"'),
    document.fonts.load('200 48px "Noto Serif KR"'),
  ].map(p => Promise.race([p, new Promise(r => setTimeout(r, 2500))])));
  await document.fonts.ready;
}


function lngLatToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const y = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n;
  return { x, y };
}

function renderOsmTiles(lat: number, lng: number, zoom: number, w: number, h: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, _reject) => {
    const { x: cx, y: cy } = lngLatToTile(lat, lng, zoom);
    const tileSize = 256;
    const tilesX = Math.ceil(w / tileSize) + 1;
    const tilesY = Math.ceil(h / tileSize) + 1;
    const startTileX = Math.floor(cx - tilesX / 2);
    const startTileY = Math.floor(cy - tilesY / 2);
    const offsetX = (cx - startTileX) * tileSize - w / 2;
    const offsetY = (cy - startTileY) * tileSize - h / 2;

    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#F2F0EB'; ctx.fillRect(0, 0, w, h);

    let loaded = 0;
    const total = tilesX * tilesY;
    const tryResolve = () => { loaded++; if (loaded >= total) drawMarkerAndResolve(); };

    const drawMarkerAndResolve = () => {
      const markerX = (cx - startTileX) * tileSize - offsetX;
      const markerY = (cy - startTileY) * tileSize - offsetY;
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.moveTo(markerX, markerY - 28);
      ctx.bezierCurveTo(markerX - 14, markerY - 28, markerX - 14, markerY - 8, markerX, markerY);
      ctx.bezierCurveTo(markerX + 14, markerY - 8, markerX + 14, markerY - 28, markerX, markerY - 28);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(markerX, markerY - 18, 5, 0, Math.PI * 2); ctx.fill();
      resolve(canvas);
    };

    for (let tx = 0; tx < tilesX; tx++) {
      for (let ty = 0; ty < tilesY; ty++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const tileX2 = startTileX + tx;
        const tileY2 = startTileY + ty;
        const drawX = tx * tileSize - offsetX;
        const drawY = ty * tileSize - offsetY;
        img.onload = () => { ctx.drawImage(img, drawX, drawY, tileSize, tileSize); tryResolve(); };
        img.onerror = () => tryResolve();
        img.src = `https://tile.openstreetmap.org/${zoom}/${tileX2}/${tileY2}.png`;
      }
    }

    setTimeout(() => resolve(canvas), 5000);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, _reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = _reject;
    img.src = src;
  });
}

function parseDate(dateStr: string) {
  const d = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const daysEn = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return {
    year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
    dayName: days[d.getDay()], dayNameEn: daysEn[d.getDay()],
    monthEn: months[d.getMonth()],
    daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
    firstDayOfMonth: new Date(d.getFullYear(), d.getMonth(), 1).getDay(),
  };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const result: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) { result.push(''); continue; }
    let line = '';
    for (const char of paragraph) {
      const test = line + char;
      if (ctx.measureText(test).width > maxW && line) {
        result.push(line); line = char;
      } else { line = test; }
    }
    if (line) result.push(line);
  }
  return result;
}

function drawCalendar(ctx: CanvasRenderingContext2D, cx: number, cy: number, calW: number, d: ReturnType<typeof parseDate>, style: 'warm' | 'cool') {
  const eng = '"Cormorant Garamond", serif';
  const cellW = calW / 7;
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `500 15px ${eng}`;
  ctx.fillStyle = style === 'warm' ? '#B4966E' : '#AAAAAA';
  for (let i = 0; i < 7; i++) {
    ctx.fillText(dayLabels[i], cx + cellW * i + cellW / 2, cy);
  }

  ctx.strokeStyle = style === 'warm' ? 'rgba(180,150,110,0.12)' : 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(cx, cy + 12); ctx.lineTo(cx + calW, cy + 12); ctx.stroke();

  ctx.font = `400 17px ${eng}`;
  let dayNum = 1;
  for (let i = 0; i < 42 && dayNum <= d.daysInMonth; i++) {
    if (i < d.firstDayOfMonth) continue;
    const col = i % 7;
    const row = Math.floor(i / 7);
    const dx = cx + cellW * col + cellW / 2;
    const dy = cy + 30 + row * 32;

    if (dayNum === d.day) {
      ctx.fillStyle = style === 'warm' ? '#4A3A28' : '#1A1A1A';
      ctx.beginPath(); ctx.arc(dx, dy, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = style === 'warm' ? '#FDF8F0' : '#FFFFFF';
      ctx.font = `600 17px ${eng}`;
      ctx.fillText(String(dayNum), dx, dy);
      ctx.font = `400 17px ${eng}`;
    } else {
      ctx.fillStyle = col === 0
        ? (style === 'warm' ? 'rgba(180,100,100,0.5)' : '#CCAAAA')
        : (style === 'warm' ? '#9A8A7A' : '#AAAAAA');
      ctx.fillText(String(dayNum), dx, dy);
    }
    dayNum++;
  }
  const rows = Math.ceil((d.firstDayOfMonth + d.daysInMonth) / 7);
  return cy + 30 + rows * 32 + 10;
}

function drawPhoto(ctx: CanvasRenderingContext2D, photo: HTMLImageElement | null, x: number, y: number, w: number, h: number, placeholder: string) {
  if (photo) {
    const sRatio = photo.width / photo.height;
    const dRatio = w / h;
    let sx = 0, sy = 0, sw = photo.width, sh = photo.height;
    if (sRatio > dRatio) { sw = photo.height * dRatio; sx = (photo.width - sw) / 2; }
    else { sh = photo.width / dRatio; sy = (photo.height - sh) / 2; }
    ctx.drawImage(photo, sx, sy, sw, sh, x, y, w, h);
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    ctx.fillRect(x, y, w, h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '300 16px "Noto Serif KR", serif';
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillText(placeholder, x + w / 2, y + h / 2);
  }
}

async function drawClassic(ctx: CanvasRenderingContext2D, w: Props['wedding'], photo: HTMLImageElement | null, mapQr: HTMLImageElement | null, staticMap: HTMLImageElement | null, invQr: HTMLImageElement | null) {
  const d = parseDate(w.weddingDate);
  const serif = '"Noto Serif KR", serif';
  const eng = '"Cormorant Garamond", serif';
  const panel = PW / 3;

  const bg = ctx.createLinearGradient(0, 0, PW, PH);
  bg.addColorStop(0, '#FBF6EE'); bg.addColorStop(0.33, '#FDFAF4'); bg.addColorStop(0.66, '#FBF6EE'); bg.addColorStop(1, '#F8F2E8');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, PW, PH);
  ctx.fillStyle = 'rgba(180,150,110,0.012)';
  for (let i = 0; i < PW; i += 4) for (let j = 0; j < PH; j += 4) {
    if ((i * 3 + j * 7) % 31 < 2) ctx.fillRect(i, j, 2, 2);
  }

  ctx.strokeStyle = 'rgba(180,150,110,0.06)'; ctx.lineWidth = 0.5;
  ctx.setLineDash([3, 8]);
  ctx.beginPath(); ctx.moveTo(panel, 50); ctx.lineTo(panel, PH - 50); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(panel * 2, 50); ctx.lineTo(panel * 2, PH - 50); ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const p1x = panel / 2;

  ctx.font = `italic 300 18px ${eng}`;
  ctx.fillStyle = 'rgba(180,150,110,0.6)';
  ctx.fillText('Wedding Invitation', p1x, 65);

  ctx.strokeStyle = 'rgba(180,150,110,0.2)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(p1x - 70, 82); ctx.lineTo(p1x + 70, 82); ctx.stroke();

  ctx.font = `400 15px ${eng}`;
  ctx.fillStyle = '#7A6A5A';
  ctx.fillText(`${d.year}. ${String(d.month).padStart(2,'0')}. ${String(d.day).padStart(2,'0')}  ${d.dayNameEn}`, p1x, 105);

  const imgW = 440, imgH = 480;
  const imgX = p1x - imgW / 2, imgY = 125;

  ctx.strokeStyle = 'rgba(180,150,110,0.25)'; ctx.lineWidth = 1;
  ctx.strokeRect(imgX - 8, imgY - 8, imgW + 16, imgH + 16);
  ctx.strokeStyle = 'rgba(180,150,110,0.08)'; ctx.lineWidth = 0.5;
  ctx.strokeRect(imgX - 14, imgY - 14, imgW + 28, imgH + 28);

  drawPhoto(ctx, photo, imgX, imgY, imgW, imgH, '대표 사진');

  ctx.textAlign = 'left';
  ctx.save(); ctx.translate(imgX - 22, imgY + imgH / 2 + 80); ctx.rotate(-Math.PI / 2);
  ctx.font = `300 12px ${serif}`; ctx.fillStyle = 'rgba(120,100,80,0.4)';
  ctx.fillText(w.venue, 0, 0); ctx.restore();

  ctx.save(); ctx.translate(imgX + imgW + 22, imgY + imgH / 2 - 80); ctx.rotate(Math.PI / 2);
  ctx.font = `300 12px ${serif}`; ctx.fillStyle = 'rgba(120,100,80,0.4)';
  ctx.fillText([w.venueHall, w.weddingTime].filter(Boolean).join(' '), 0, 0); ctx.restore();

  ctx.textAlign = 'center';
  const btm1 = imgY + imgH + 40;
  ctx.font = `italic 600 48px ${eng}`;
  ctx.fillStyle = '#4A3A28';
  ctx.fillText('Wedding', p1x, btm1);
  ctx.font = `500 18px ${eng}`;
  ctx.fillStyle = '#7A6A5A';
  ctx.fillText('S A V E  T H E  D A T E', p1x, btm1 + 38);

  if (invQr) {
    const iqS = 55;
    ctx.globalAlpha = 0.8;
    ctx.drawImage(invQr, p1x - iqS / 2, btm1 + 65, iqS, iqS);
    ctx.globalAlpha = 1.0;
    ctx.font = `300 8px ${serif}`;
    ctx.fillStyle = '#B4966E';
    ctx.fillText('모바일 청첩장', p1x, btm1 + 65 + iqS + 10);
  }

  const p2x = panel + panel / 2;
  const m2 = 70;

  ctx.font = `500 20px ${eng}`;
  ctx.fillStyle = '#4A3A28';
  ctx.fillText('O U R  M A R R I A G E', p2x, m2);
  ctx.strokeStyle = 'rgba(180,150,110,0.2)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(p2x - 130, m2 + 16); ctx.lineTo(p2x + 130, m2 + 16); ctx.stroke();

  let y2 = m2 + 50;
  ctx.font = `400 15px ${eng}`;
  ctx.fillStyle = '#7A6A5A';
  ctx.fillText(`${d.year}  ·  ${d.month}/${d.day}  ·  ${d.dayNameEn}`, p2x, y2);
  y2 += 24;
  ctx.font = `300 14px ${serif}`;
  ctx.fillStyle = '#9A8A7A';
  ctx.fillText([w.venue, w.venueHall, w.weddingTime].filter(Boolean).join('  '), p2x, y2);

  y2 += 40;
  ctx.strokeStyle = 'rgba(180,150,110,0.15)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(p2x - 80, y2); ctx.lineTo(p2x + 80, y2); ctx.stroke();
  y2 += 35;

  if (w.groomFatherName || w.groomMotherName) {
    ctx.font = `300 14px ${serif}`;
    ctx.fillStyle = '#9A8A7A';
    ctx.fillText([w.groomFatherName, w.groomMotherName].filter(Boolean).join(' · ') + ' 의 아들', p2x, y2);
    y2 += 30;
  }
  const gEn = w.groomNameEn || '';
  if (gEn) {
    ctx.font = `500 14px ${eng}`;
    ctx.fillStyle = '#9A8A7A';
    ctx.fillText(gEn.toUpperCase(), p2x, y2);
    y2 += 24;
  }
  ctx.font = `700 26px ${serif}`;
  ctx.fillStyle = '#4A3A28';
  ctx.fillText(w.groomName, p2x, y2);
  y2 += 38;

  ctx.font = `italic 300 15px ${eng}`;
  ctx.fillStyle = 'rgba(180,150,110,0.6)';
  ctx.fillText('and', p2x, y2);
  y2 += 32;

  if (w.brideFatherName || w.brideMotherName) {
    ctx.font = `300 14px ${serif}`;
    ctx.fillStyle = '#9A8A7A';
    ctx.fillText([w.brideFatherName, w.brideMotherName].filter(Boolean).join(' · ') + ' 의 딸', p2x, y2);
    y2 += 30;
  }
  const bEn = w.brideNameEn || '';
  if (bEn) {
    ctx.font = `500 14px ${eng}`;
    ctx.fillStyle = '#9A8A7A';
    ctx.fillText(bEn.toUpperCase(), p2x, y2);
    y2 += 24;
  }
  ctx.font = `700 26px ${serif}`;
  ctx.fillStyle = '#4A3A28';
  ctx.fillText(w.brideName, p2x, y2);
  y2 += 40;

  ctx.strokeStyle = 'rgba(180,150,110,0.12)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(p2x - 60, y2); ctx.lineTo(p2x + 60, y2); ctx.stroke();
  y2 += 28;

  if (w.greeting) {
    ctx.fillStyle = '#6A5A4A';
    const remainH = 870 - y2;
    ctx.font = `300 15px ${serif}`;
    let lines = wrapText(ctx, w.greeting, panel - 120);
    let lineH = 26;
    let fontSize = 15;
    if (lines.length * lineH > remainH) {
      fontSize = 13; lineH = 22;
      ctx.font = `300 ${fontSize}px ${serif}`;
      lines = wrapText(ctx, w.greeting, panel - 100);
    }
    if (lines.length * lineH > remainH) {
      fontSize = 12; lineH = 20;
      ctx.font = `300 ${fontSize}px ${serif}`;
      lines = wrapText(ctx, w.greeting, panel - 90);
    }
    const maxLines = Math.min(lines.length, Math.floor(remainH / lineH));
    for (let i = 0; i < maxLines; i++) {
      ctx.fillText(lines[i], p2x, y2);
      y2 += lineH;
    }
    y2 += 12;
  }

  ctx.strokeStyle = 'rgba(180,150,110,0.12)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(p2x - 40, y2); ctx.lineTo(p2x + 40, y2); ctx.stroke();
  y2 += 30;

  ctx.font = `300 14px ${serif}`;
  ctx.fillStyle = '#7A6A5A';
  ctx.fillText(`${d.year}년 ${d.month}월 ${d.day}일 ${d.dayName}요일 ${w.weddingTime || ''}`, p2x, y2);
  y2 += 24;
  ctx.fillText(`${w.venue} ${w.venueHall || ''}`, p2x, y2);

  const p3x = panel * 2 + panel / 2;

  const m3 = 55;
  ctx.font = `500 18px ${eng}`;
  ctx.fillStyle = '#4A3A28';
  ctx.fillText('L O C A T I O N', p3x, m3);
  ctx.strokeStyle = 'rgba(180,150,110,0.2)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(p3x - 90, m3 + 16); ctx.lineTo(p3x + 90, m3 + 16); ctx.stroke();

  let y3 = m3 + 50;

  if (staticMap) {
    const mapW = 520, mapH = 240;
    const mapX = p3x - mapW / 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(180,150,110,0.2)'; ctx.lineWidth = 1;
    ctx.strokeRect(mapX - 2, y3 - 2, mapW + 4, mapH + 4);
    const sR = staticMap.width / staticMap.height, dR = mapW / mapH;
    let sx2 = 0, sy2 = 0, sw2 = staticMap.width, sh2 = staticMap.height;
    if (sR > dR) { sw2 = staticMap.height * dR; sx2 = (staticMap.width - sw2) / 2; }
    else { sh2 = staticMap.width / dR; sy2 = (staticMap.height - sh2) / 2; }
    ctx.drawImage(staticMap, sx2, sy2, sw2, sh2, mapX, y3, mapW, mapH);
    ctx.restore();
    y3 += mapH + 25;
  } else {
    y3 += 10;
  }

  ctx.font = `400 20px ${serif}`;
  ctx.fillStyle = '#4A3A28';
  ctx.fillText(w.venue, p3x, y3);
  y3 += 28;
  if (w.venueHall) {
    ctx.font = `300 15px ${serif}`;
    ctx.fillStyle = '#7A6A5A';
    ctx.fillText(w.venueHall, p3x, y3);
    y3 += 24;
  }
  ctx.font = `300 12px ${serif}`;
  ctx.fillStyle = '#9A8A7A';
  const addrLines = wrapText(ctx, w.venueAddress, panel - 100);
  for (const line of addrLines) {
    ctx.fillText(line, p3x, y3);
    y3 += 20;
  }

  y3 += 20;
  if (mapQr) {
    const qrS = 90;
    ctx.drawImage(mapQr, p3x - qrS / 2, y3, qrS, qrS);
    ctx.font = `300 9px ${serif}`;
    ctx.fillStyle = '#B4966E';
    ctx.fillText('지도 보기', p3x, y3 + qrS + 12);
    y3 += qrS + 25;
  }

  y3 += 15;
  ctx.font = `italic 400 15px ${eng}`;
  ctx.fillStyle = '#B4966E';
  ctx.fillText(`${d.monthEn} ${d.year}`, p3x, y3);
  y3 += 22;
  drawCalendar(ctx, p3x - 180, y3, 360, d, 'warm');

  if (w.groomPhone || w.bridePhone) {
    const cpY = PH - 55;
    ctx.font = `300 11px ${serif}`;
    ctx.fillStyle = '#B4966E';
    const parts = [];
    if (w.groomPhone) parts.push(`신랑 ${w.groomName}  ${w.groomPhone}`);
    if (w.bridePhone) parts.push(`신부 ${w.brideName}  ${w.bridePhone}`);
    ctx.fillText(parts.join('    '), p3x, cpY);
  }

  ctx.fillStyle = 'rgba(180,150,110,0.08)';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(p3x - 10 + i * 10, PH - 30, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  ctx.textAlign = 'right';
  ctx.font = '300 9px "Noto Serif KR", serif';
  ctx.fillStyle = 'rgba(180,150,110,0.3)';
  ctx.fillText('Made by 청첩장 작업실', PW - 30, PH - 15);
}

async function drawModern(ctx: CanvasRenderingContext2D, w: Props['wedding'], photo: HTMLImageElement | null, mapQr: HTMLImageElement | null, staticMap: HTMLImageElement | null, invQr: HTMLImageElement | null) {
  const d = parseDate(w.weddingDate);
  const serif = '"Nanum Myeongjo", serif';
  const eng = '"Playfair Display", serif';
  const sans = '"MaruBuri", sans-serif';
  const panel = PW / 3;

  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, PW, PH);
  ctx.fillStyle = 'rgba(0,0,0,0.006)';
  for (let y = 0; y < PH; y += 2) ctx.fillRect(0, y, PW, 1);
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(0, 0, PW, 4); ctx.fillRect(0, PH - 4, PW, 4);

  ctx.strokeStyle = 'rgba(0,0,0,0.03)'; ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 6]);
  ctx.beginPath(); ctx.moveTo(panel, 30); ctx.lineTo(panel, PH - 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(panel * 2, 30); ctx.lineTo(panel * 2, PH - 30); ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const p1x = panel / 2;
  const m1 = 60;

  ctx.font = `600 13px ${eng}`;
  ctx.fillStyle = '#1A1A1A';
  ctx.fillText('A N  I N V I T A T I O N', p1x, m1);
  ctx.fillStyle = '#1A1A1A'; ctx.fillRect(p1x - 25, m1 + 14, 50, 1);

  ctx.font = `400 14px ${eng}`;
  ctx.fillStyle = '#999999';
  ctx.fillText(`${d.year}    ${String(d.month).padStart(2,'0')}/${String(d.day).padStart(2,'0')}    ${d.dayNameEn}.`, p1x, m1 + 38);

  const imgW = 460, imgH = 460;
  const imgX = p1x - imgW / 2, imgY = m1 + 55;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.06)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(imgX - 4, imgY - 4, imgW + 8, imgH + 8);
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.04)'; ctx.lineWidth = 0.5;
  ctx.strokeRect(imgX - 4, imgY - 4, imgW + 8, imgH + 8);

  drawPhoto(ctx, photo, imgX, imgY, imgW, imgH, '대표 사진');

  ctx.textAlign = 'left';
  ctx.save(); ctx.translate(imgX - 18, imgY + imgH / 2 + 80); ctx.rotate(-Math.PI / 2);
  ctx.font = `400 11px ${sans}`; ctx.fillStyle = '#CCCCCC';
  ctx.fillText(w.venue, 0, 0); ctx.restore();
  ctx.save(); ctx.translate(imgX + imgW + 18, imgY + imgH / 2 - 80); ctx.rotate(Math.PI / 2);
  ctx.font = `400 11px ${sans}`; ctx.fillStyle = '#CCCCCC';
  ctx.fillText([w.venueHall, w.weddingTime].filter(Boolean).join(' '), 0, 0); ctx.restore();

  ctx.textAlign = 'center';
  const btm1 = imgY + imgH + 35;
  ctx.font = `italic 700 44px ${eng}`;
  ctx.fillStyle = '#1A1A1A';
  ctx.fillText('Wedding', p1x, btm1);
  ctx.font = `700 16px ${eng}`;
  ctx.fillText('S A V E  T H E  D A T E', p1x, btm1 + 35);

  if (invQr) {
    const iqS = 50;
    ctx.globalAlpha = 0.7;
    ctx.drawImage(invQr, p1x - iqS / 2, btm1 + 58, iqS, iqS);
    ctx.globalAlpha = 1.0;
    ctx.font = `400 8px ${sans}`;
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('모바일 청첩장', p1x, btm1 + 58 + iqS + 10);
  }

  const p2x = panel + panel / 2;
  

  const m2s = 55;
  ctx.font = `700 18px ${eng}`;
  ctx.fillStyle = '#1A1A1A';
  ctx.fillText('O U R  M A R R I A G E', p2x, m2s);
  ctx.fillStyle = '#1A1A1A'; ctx.fillRect(p2x - 110, m2s + 15, 220, 1);

  let y2 = m2s + 42;
  ctx.font = `400 14px ${eng}`;
  ctx.fillStyle = '#888888';
  ctx.fillText(`${d.year}  ·  ${d.month}/${d.day}  ·  ${d.dayNameEn}`, p2x, y2);
  y2 += 22;
  ctx.font = `400 13px ${sans}`;
  ctx.fillStyle = '#AAAAAA';
  ctx.fillText([w.venue, w.venueHall, w.weddingTime].filter(Boolean).join('  '), p2x, y2);

  y2 += 30;
  ctx.fillStyle = '#E8E8E8'; ctx.fillRect(p2x - 60, y2, 120, 0.5);
  y2 += 28;

  if (w.groomFatherName || w.groomMotherName) {
    ctx.font = `400 13px ${sans}`;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText([w.groomFatherName, w.groomMotherName].filter(Boolean).join(' · ') + ' 의 아들', p2x, y2);
    y2 += 28;
  }
  const gEn = w.groomNameEn || '';
  if (gEn) {
    ctx.font = `500 15px ${eng}`;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(gEn.toUpperCase(), p2x, y2);
    y2 += 24;
  }
  ctx.font = `700 26px ${serif}`;
  ctx.fillStyle = '#1A1A1A';
  ctx.fillText(w.groomName, p2x, y2);
  y2 += 40;

  ctx.font = `italic 400 16px ${eng}`;
  ctx.fillStyle = '#DDDDDD';
  ctx.fillText('and', p2x, y2);
  y2 += 45;

  if (w.brideFatherName || w.brideMotherName) {
    ctx.font = `400 13px ${sans}`;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText([w.brideFatherName, w.brideMotherName].filter(Boolean).join(' · ') + ' 의 딸', p2x, y2);
    y2 += 28;
  }
  const bEn = w.brideNameEn || '';
  if (bEn) {
    ctx.font = `500 15px ${eng}`;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(bEn.toUpperCase(), p2x, y2);
    y2 += 24;
  }
  ctx.font = `700 26px ${serif}`;
  ctx.fillStyle = '#1A1A1A';
  ctx.fillText(w.brideName, p2x, y2);
  y2 += 48;

  ctx.fillStyle = '#E8E8E8'; ctx.fillRect(p2x - 40, y2, 80, 0.5);
  y2 += 30;

  if (w.greeting) {
    ctx.fillStyle = '#666666';
    const remainH = 870 - y2;
    ctx.font = `400 14px ${sans}`;
    let lines = wrapText(ctx, w.greeting, panel - 120);
    let lineH = 26;
    let fontSize = 14;
    if (lines.length * lineH > remainH) {
      fontSize = 12; lineH = 22;
      ctx.font = `400 ${fontSize}px ${sans}`;
      lines = wrapText(ctx, w.greeting, panel - 100);
    }
    if (lines.length * lineH > remainH) {
      fontSize = 11; lineH = 19;
      ctx.font = `400 ${fontSize}px ${sans}`;
      lines = wrapText(ctx, w.greeting, panel - 90);
    }
    const maxLines = Math.min(lines.length, Math.floor(remainH / lineH));
    for (let i = 0; i < maxLines; i++) {
      ctx.fillText(lines[i], p2x, y2);
      y2 += lineH;
    }
    y2 += 15;
  }

  ctx.fillStyle = '#E8E8E8'; ctx.fillRect(p2x - 30, y2, 60, 0.5);
  y2 += 28;
  ctx.font = `400 13px ${sans}`;
  ctx.fillStyle = '#888888';
  ctx.fillText(`${d.year}. ${d.month}. ${d.day}. ${d.dayName}요일 ${w.weddingTime || ''}`, p2x, y2);
  y2 += 22;
  ctx.fillText(`${w.venue} ${w.venueHall || ''}`, p2x, y2);

  const p3x = panel * 2 + panel / 2;

  if (photo) {
    ctx.save(); ctx.globalAlpha = 0.04;
    const bgW = panel, bgH = PH;
    const sR = photo.width / photo.height, dR = bgW / bgH;
    let sx = 0, sy = 0, sw = photo.width, sh = photo.height;
    if (sR > dR) { sw = photo.height * dR; sx = (photo.width - sw) / 2; }
    else { sh = photo.width / dR; sy = (photo.height - sh) / 2; }
    ctx.drawImage(photo, sx, sy, sw, sh, panel * 2, 0, bgW, bgH);
    ctx.globalAlpha = 1.0; ctx.restore();
  }

  const m3m = 50;
  ctx.font = `600 16px ${eng}`;
  ctx.fillStyle = '#1A1A1A';
  ctx.fillText('L O C A T I O N', p3x, m3m);
  ctx.fillStyle = '#1A1A1A'; ctx.fillRect(p3x - 80, m3m + 14, 160, 1);

  let y3 = m3m + 45;

  if (staticMap) {
    const mapW = 520, mapH = 240;
    const mapX = p3x - mapW / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.06)'; ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 0.5;
    ctx.strokeRect(mapX, y3, mapW, mapH);
    const sR = staticMap.width / staticMap.height, dR = mapW / mapH;
    let sx2 = 0, sy2 = 0, sw2 = staticMap.width, sh2 = staticMap.height;
    if (sR > dR) { sw2 = staticMap.height * dR; sx2 = (staticMap.width - sw2) / 2; }
    else { sh2 = staticMap.width / dR; sy2 = (staticMap.height - sh2) / 2; }
    ctx.drawImage(staticMap, sx2, sy2, sw2, sh2, mapX, y3, mapW, mapH);
    ctx.restore();
    y3 += mapH + 18;
  } else {
    y3 += 10;
  }

  ctx.font = `700 19px ${serif}`;
  ctx.fillStyle = '#1A1A1A';
  ctx.fillText(w.venue, p3x, y3);
  y3 += 24;
  if (w.venueHall) {
    ctx.font = `400 14px ${sans}`;
    ctx.fillStyle = '#888888';
    ctx.fillText(w.venueHall, p3x, y3);
    y3 += 22;
  }
  ctx.font = `400 11px ${sans}`;
  ctx.fillStyle = '#AAAAAA';
  const addrLines = wrapText(ctx, w.venueAddress, panel - 100);
  for (const line of addrLines) {
    ctx.fillText(line, p3x, y3);
    y3 += 18;
  }

  y3 += 18;
  if (mapQr) {
    const qrS = 85;
    ctx.drawImage(mapQr, p3x - qrS / 2, y3, qrS, qrS);
    ctx.font = `400 9px ${sans}`;
    ctx.fillStyle = '#BBBBBB';
    ctx.fillText('지도 보기', p3x, y3 + qrS + 12);
    y3 += qrS + 26;
  }

  y3 += 5;
  ctx.font = `italic 400 14px ${eng}`;
  ctx.fillStyle = '#CCCCCC';
  ctx.fillText(`${d.monthEn} ${d.year}`, p3x, y3);
  y3 += 20;
  drawCalendar(ctx, p3x - 180, y3, 360, d, 'cool');

  if (w.groomPhone || w.bridePhone) {
    const cpY = PH - 60;
    ctx.font = `400 10px ${sans}`;
    ctx.fillStyle = '#BBBBBB';
    const parts = [];
    if (w.groomPhone) parts.push(`신랑 ${w.groomName}  ${w.groomPhone}`);
    if (w.bridePhone) parts.push(`신부 ${w.brideName}  ${w.bridePhone}`);
    ctx.fillText(parts.join('    '), p3x, cpY);
  }

  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(p3x - 1, PH - 30, 2, 14);

  ctx.textAlign = 'right';
  ctx.font = '400 9px "MaruBuri", sans-serif';
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillText('Made by 청첩장 작업실', PW - 30, PH - 10);
}













function drawLeafOrnament(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, scale: number = 1) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 0.8 * scale; ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 14 * scale);
  ctx.bezierCurveTo(cx - 10 * scale, cy - 14 * scale, cx - 16 * scale, cy - 4 * scale, cx, cy + 2 * scale);
  ctx.bezierCurveTo(cx + 16 * scale, cy - 4 * scale, cx + 10 * scale, cy - 14 * scale, cx, cy - 14 * scale);
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 14 * scale); ctx.lineTo(cx, cy + 2 * scale); ctx.stroke();
  ctx.globalAlpha = 1; ctx.restore();
}

async function draw2Fold(ctx: CanvasRenderingContext2D, w: Props['wedding'], photo: HTMLImageElement | null, mapQr: HTMLImageElement | null, staticMap: HTMLImageElement | null, invQr: HTMLImageElement | null, styleName: 'pearl' | 'luna') {
  const W = 2480, H = 1100;
  const half = W / 2;
  const d = parseDate(w.weddingDate);
  const styles = {
    pearl: {
      bg: '#0A0A0A', text: '#E8EEF2', sub: '#8A9AA4', muted: '#5A6A74',
      line: 'rgba(232,238,242,0.06)', lineSolid: 'rgba(232,238,242,0.12)',
      kr: '"MapoDacapo", sans-serif', en: '"Playfair Display", serif',
      watermark: 'rgba(232,238,242,0.08)', qrBg: '#FFFFFF', orn: 'rgba(184,200,210,0.3)',
    },
    luna: {
      bg: '#FAFBFC', text: '#3A4A54', sub: '#6A7A84', muted: '#9AABB4',
      line: 'rgba(58,74,84,0.04)', lineSolid: 'rgba(58,74,84,0.08)',
      kr: '"Noto Serif KR", serif', en: '"Cormorant Garamond", serif',
      watermark: 'rgba(58,74,84,0.1)', qrBg: '#FFFFFF', orn: 'rgba(58,74,84,0.18)',
    },
  };
  const s = styles[styleName];

  ctx.fillStyle = s.bg; ctx.fillRect(0, 0, W, H);
  if (styleName === 'pearl') {
    ctx.fillStyle = 'rgba(255,255,255,0.004)';
    for (let i = 0; i < W; i += 6) for (let j = 0; j < H; j += 6) {
      if ((i * 7 + j * 13) % 53 < 1) ctx.fillRect(i, j, 1, 1);
    }
  } else {
    ctx.fillStyle = 'rgba(58,74,84,0.005)';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  }

  const lx = half / 2;
  const pad = 40;

  if (photo) {
    const photoArea = { x: pad, y: pad, w: half - pad * 2, h: H - pad * 2 };
    const sR = photo.width / photo.height;
    const dR = photoArea.w / photoArea.h;
    let sx = 0, sy = 0, sw = photo.width, sh = photo.height;
    if (sR > dR) { sw = photo.height * dR; sx = (photo.width - sw) / 2; }
    else { sh = photo.width / dR; sy = (photo.height - sh) / 2; }
    ctx.drawImage(photo, sx, sy, sw, sh, photoArea.x, photoArea.y, photoArea.w, photoArea.h);

    const topGrad = ctx.createLinearGradient(0, pad, 0, pad + 160);
    topGrad.addColorStop(0, styleName === 'pearl' ? 'rgba(10,10,10,0.55)' : 'rgba(250,251,252,0.65)');
    topGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(photoArea.x, photoArea.y, photoArea.w, 160);

    const btmGrad = ctx.createLinearGradient(0, H - pad - 280, 0, H - pad);
    btmGrad.addColorStop(0, 'rgba(0,0,0,0)');
    btmGrad.addColorStop(0.35, styleName === 'pearl' ? 'rgba(10,10,10,0.45)' : 'rgba(250,251,252,0.5)');
    btmGrad.addColorStop(1, styleName === 'pearl' ? 'rgba(10,10,10,0.85)' : 'rgba(250,251,252,0.88)');
    ctx.fillStyle = btmGrad;
    ctx.fillRect(photoArea.x, H - pad - 280, photoArea.w, 280);

    ctx.strokeStyle = s.lineSolid; ctx.lineWidth = 1;
    ctx.strokeRect(photoArea.x, photoArea.y, photoArea.w, photoArea.h);
  } else {
    ctx.fillStyle = styleName === 'pearl' ? '#1A1A1A' : '#F0F2F4';
    ctx.fillRect(pad, pad, half - pad * 2, H - pad * 2);
    ctx.font = '400 20px sans-serif'; ctx.fillStyle = s.muted;
    ctx.textAlign = 'center'; ctx.fillText('\uB300\uD45C \uC0AC\uC9C4', lx, H / 2);
  }

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  ctx.font = '400 15px ' + s.en;
  ctx.fillStyle = styleName === 'pearl' ? 'rgba(232,238,242,0.8)' : 'rgba(58,74,84,0.7)';
  ctx.fillText(d.year + '. ' + String(d.month).padStart(2,'0') + '. ' + String(d.day).padStart(2,'0') + '  ' + d.dayNameEn, lx, pad + 28);

  let by = H - pad - 22;

  if (invQr) {
    const iqS = 50;
    ctx.fillStyle = s.qrBg; ctx.fillRect(pad + 14, by - iqS - 6, iqS + 8, iqS + 8);
    ctx.globalAlpha = 0.85; ctx.drawImage(invQr, pad + 18, by - iqS - 2, iqS, iqS); ctx.globalAlpha = 1;
    ctx.font = '400 8px ' + s.kr;
    ctx.fillStyle = styleName === 'pearl' ? 'rgba(232,238,242,0.5)' : 'rgba(58,74,84,0.5)';
    ctx.fillText('\uBAA8\uBC14\uC77C \uCCAD\uCCA9\uC7A5', pad + 18 + iqS / 2, by + 6);
  }

  ctx.font = '400 14px ' + s.kr;
  ctx.fillStyle = styleName === 'pearl' ? 'rgba(232,238,242,0.6)' : 'rgba(58,74,84,0.5)';
  ctx.fillText(w.venue + ' ' + (w.venueHall || ''), lx, by);
  by -= 24;

  ctx.font = '400 16px ' + s.kr;
  ctx.fillStyle = styleName === 'pearl' ? 'rgba(232,238,242,0.7)' : 'rgba(58,74,84,0.6)';
  ctx.fillText(d.year + '\uB144 ' + d.month + '\uC6D4 ' + d.day + '\uC77C ' + d.dayName + '\uC694\uC77C ' + (w.weddingTime || ''), lx, by);
  by -= 34;

  const hasGP = w.groomFatherName || w.groomMotherName;
  const hasBP = w.brideFatherName || w.brideMotherName;

  if (hasGP || hasBP) {
    ctx.font = '400 12px ' + s.kr;
    ctx.fillStyle = styleName === 'pearl' ? 'rgba(232,238,242,0.55)' : 'rgba(58,74,84,0.5)';
    const gpText = hasGP ? [w.groomFatherName, w.groomMotherName].filter(Boolean).join(' \u00B7 ') + '\uC758 \uC544\uB4E4' : '';
    const bpText = hasBP ? [w.brideFatherName, w.brideMotherName].filter(Boolean).join(' \u00B7 ') + '\uC758 \uB538' : '';
    const parentLine = [gpText, bpText].filter(Boolean).join('\u3000\u3000');
    ctx.fillText(parentLine, lx, by + 8);
    by -= 26;
  }

  ctx.font = '700 42px ' + s.kr;
  ctx.fillStyle = styleName === 'pearl' ? '#FFFFFF' : s.text;
  ctx.fillText(w.groomName, lx - 70, by);
  ctx.font = '300 18px ' + s.en;
  ctx.fillStyle = styleName === 'pearl' ? 'rgba(255,255,255,0.5)' : s.muted;
  ctx.fillText('\u00B7', lx, by - 2);
  ctx.font = '700 42px ' + s.kr;
  ctx.fillStyle = styleName === 'pearl' ? '#FFFFFF' : s.text;
  ctx.fillText(w.brideName, lx + 70, by);
  by -= 50;

  ctx.font = 'italic 700 60px ' + s.en;
  ctx.fillStyle = styleName === 'pearl' ? '#FFFFFF' : s.text;
  ctx.fillText('Wedding', lx, by);
  by -= 34;
  ctx.font = '300 18px ' + s.en;
  ctx.fillStyle = styleName === 'pearl' ? 'rgba(232,238,242,0.5)' : s.muted;
  ctx.fillText('S A V E  T H E  D A T E', lx, by);

  ctx.strokeStyle = s.line; ctx.lineWidth = 0.5; ctx.setLineDash([4, 10]);
  ctx.beginPath(); ctx.moveTo(half, 30); ctx.lineTo(half, H - 30); ctx.stroke();
  ctx.setLineDash([]);

  const rx = half + half / 2;
  const txL = half + 55;
  const txR = W - 55;
  const contentW = txR - txL;
  const hasTransport = w.transportInfo && w.transportInfo.trim();
  const hasParking = w.parkingInfo && w.parkingInfo.trim();
  const hasInfo = hasTransport || hasParking;

  const mapH = hasInfo ? 200 : 260;
  const venueH = 22 + (w.venueHall ? 20 : 0) + Math.ceil(w.venueAddress.length / 30) * 16;
  let infoH = 0;
  if (hasTransport) { infoH += 24 + (w.transportInfo || '').split('\n').filter((l: string) => l.trim()).length * 18 + 10; }
  if (hasParking) { infoH += 24 + (w.parkingInfo || '').split('\n').filter((l: string) => l.trim()).length * 18; }
  const qrH = mapQr ? 66 : 0;
  const calH = 175;
  const greetLines = w.greeting ? wrapText((() => { const m = document.createElement('canvas').getContext('2d')!; m.font = '400 15px ' + s.kr; return m; })(), w.greeting, half - 140) : []; const greetH = w.greeting ? Math.min(greetLines.length, 6) * 22 + 10 : 40;
  const phoneH = 20;
  const titleH = 30;

  const totalContent = titleH + mapH + venueH + infoH + qrH + calH + greetH + phoneH;
  const sections = 7 + (hasInfo ? 1 : 0) + (mapQr ? 1 : 0);
  const gap = Math.max(14, Math.min(28, (H - 40 - totalContent) / sections));
  let ry = Math.max(30, (H - totalContent - gap * (sections - 1)) / 2);

  ctx.textAlign = 'center';
  ctx.font = '300 16px ' + s.en; ctx.fillStyle = s.muted;
  ctx.fillText('L O C A T I O N', rx, ry);
  ry += 12;
  ctx.strokeStyle = s.lineSolid; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(rx - 70, ry); ctx.lineTo(rx + 70, ry); ctx.stroke();
  ry += gap;

  if (staticMap) {
    const mapW = half - 110;
    const mapX = rx - mapW / 2;
    ctx.save();
    ctx.strokeStyle = s.lineSolid; ctx.lineWidth = 1;
    ctx.strokeRect(mapX - 1, ry - 1, mapW + 2, mapH + 2);
    const sR = staticMap.width / staticMap.height, dR = mapW / mapH;
    let sx2 = 0, sy2 = 0, sw2 = staticMap.width, sh2 = staticMap.height;
    if (sR > dR) { sw2 = staticMap.height * dR; sx2 = (staticMap.width - sw2) / 2; }
    else { sh2 = staticMap.width / dR; sy2 = (staticMap.height - sh2) / 2; }
    ctx.drawImage(staticMap, sx2, sy2, sw2, sh2, mapX, ry, mapW, mapH);
    ctx.restore();
    ry += mapH + gap;
  }

  ctx.textAlign = 'center';
  ctx.font = '700 22px ' + s.kr; ctx.fillStyle = s.text;
  ctx.fillText(w.venue, rx, ry); ry += 24;
  if (w.venueHall) {
    ctx.font = '400 16px ' + s.kr; ctx.fillStyle = s.sub;
    ctx.fillText(w.venueHall, rx, ry); ry += 20;
  }
  ctx.font = '400 13px ' + s.kr; ctx.fillStyle = s.muted;
  const aL = wrapText(ctx, w.venueAddress, half - 120);
  for (const l of aL) { ctx.fillText(l, rx, ry); ry += 16; }
  ry += gap;

  if (hasInfo) {
    ctx.textAlign = 'left';
    if (hasTransport) {
      ctx.font = '700 16px ' + s.kr; ctx.fillStyle = s.text;
      ctx.fillText('\uAD50\uD1B5 \uC548\uB0B4', txL, ry); ry += 24;
      ctx.font = '400 13px ' + s.kr; ctx.fillStyle = s.sub;
      for (const para of w.transportInfo!.split('\n')) {
        if (!para.trim()) { ry += 5; continue; }
        const wl = wrapText(ctx, para, contentW);
        for (const l of wl) { ctx.fillText(l, txL, ry); ry += 18; }
      }
      ry += 10;
    }
    if (hasParking) {
      ctx.font = '700 16px ' + s.kr; ctx.fillStyle = s.text;
      ctx.fillText('\uC8FC\uCC28 \uC548\uB0B4', txL, ry); ry += 24;
      ctx.font = '400 13px ' + s.kr; ctx.fillStyle = s.sub;
      for (const para of w.parkingInfo!.split('\n')) {
        if (!para.trim()) { ry += 5; continue; }
        const wl = wrapText(ctx, para, contentW);
        for (const l of wl) { ctx.fillText(l, txL, ry); ry += 18; }
      }
    }
    ctx.textAlign = 'center';
    ry += gap;
  }

  if (mapQr) {
    const qS = 55;
    ctx.fillStyle = s.qrBg; ctx.fillRect(rx - qS/2 - 3, ry - 3, qS + 6, qS + 6);
    ctx.drawImage(mapQr, rx - qS/2, ry, qS, qS);
    ctx.font = '400 9px ' + s.kr; ctx.fillStyle = s.muted;
    ctx.fillText('\uC9C0\uB3C4 \uBCF4\uAE30', rx, ry + qS + 11);
    ry += qS + 14 + gap;
  }

  ctx.font = 'italic 400 14px ' + s.en; ctx.fillStyle = s.muted;
  ctx.fillText(d.monthEn + ' ' + d.year, rx, ry);
  ry += 18;
  const calEnd = drawCalendar(ctx, rx - 160, ry, 320, d, 'cool');
  ry = calEnd + gap;

  if (w.greeting) {
    ctx.save();
    ctx.globalAlpha = styleName === 'pearl' ? 0.35 : 0.3;
    const gLines = wrapText(ctx, w.greeting, half - 140);
    const maxG = Math.min(gLines.length, 8);
    const gFontSize = maxG > 5 ? 13 : 15;
    const gLineH = maxG > 5 ? 19 : 22;
    ctx.font = '400 ' + gFontSize + 'px ' + s.kr; ctx.fillStyle = s.text;
    for (let i = 0; i < maxG; i++) { ctx.fillText(gLines[i], rx, ry); ry += gLineH; }
    ctx.globalAlpha = 1;
    ctx.restore();
  } else {
    ctx.save();
    ctx.globalAlpha = styleName === 'pearl' ? 0.18 : 0.13;
    ctx.font = 'italic 400 18px ' + s.en; ctx.fillStyle = s.text;
    ctx.fillText('"The best thing to hold onto in life is each other"', rx, ry);
    drawLeafOrnament(ctx, rx - 250, ry, s.orn, 0.7);
    drawLeafOrnament(ctx, rx + 250, ry, s.orn, 0.7);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  if (w.groomPhone || w.bridePhone) {
    const cpY = H - 26;
    ctx.font = '400 12px ' + s.kr; ctx.fillStyle = s.muted;
    const parts: string[] = [];
    if (w.groomPhone) parts.push('\uC2E0\uB791 ' + w.groomName + '  ' + w.groomPhone);
    if (w.bridePhone) parts.push('\uC2E0\uBD80 ' + w.brideName + '  ' + w.bridePhone);
    ctx.fillText(parts.join('    '), rx, cpY);
  }

  ctx.textAlign = 'right';
  ctx.font = '400 10px ' + s.kr; ctx.fillStyle = s.watermark;
  ctx.fillText('Made by \uCCAD\uCCA9\uC7A5 \uC791\uC5C5\uC2E4', W - 30, H - 12);
}

const DESIGNS = [
  { id: 'classic', label: '클래식', desc: '따뜻한 아이보리 · 3단 접지', draw: drawClassic as any, w: 2400, h: 900 },
  { id: 'modern', label: '모던', desc: '미니멀 화이트 · 3단 접지', draw: drawModern as any, w: 2400, h: 900 },
  { id: 'pearl-drift', label: 'Pearl Drift', desc: '다크 감성 · 2단 접지', draw: ((ctx: any, w: any, p: any, m: any, s: any, i: any) => draw2Fold(ctx, w, p, m, s, i, 'pearl')) as any, w: 2480, h: 1100 },
  { id: 'luna-halfmoon', label: 'Luna Halfmoon', desc: '순백 물결 · 2단 접지', draw: ((ctx: any, w: any, p: any, m: any, s: any, i: any) => draw2Fold(ctx, w, p, m, s, i, 'luna')) as any, w: 2480, h: 1100 },
];

export default function PaperInvitationModal({ isOpen, onClose, wedding, photoUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [designIdx, setDesignIdx] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [mapQr, setMapQr] = useState<HTMLImageElement | null>(null);
  const [staticMap, setStaticMap] = useState<HTMLCanvasElement | null>(null);
  const [invQr, setInvQr] = useState<HTMLImageElement | null>(null);

  const current = DESIGNS[designIdx];

  useEffect(() => {
    if (isOpen && !fontsReady) {
      ensureFonts().then(() => setFontsReady(true));
    }
  }, [isOpen, fontsReady]);

  useEffect(() => {
    if (isOpen && photoUrl && !photo) {
      loadImage(photoUrl).then(setPhoto).catch(() => setPhoto(null));
    }
  }, [isOpen, photoUrl, photo]);

  useEffect(() => {
    if (!isOpen || mapQr) return;
    const mapUrl = wedding.venueKakaoMap || `https://map.kakao.com/?q=${encodeURIComponent(wedding.venueAddress)}`;
    QRCode.toDataURL(mapUrl, {
      width: 400, margin: 2, errorCorrectionLevel: 'H',
      color: { dark: '#333333', light: '#FFFFFF' },
    }).then(url => loadImage(url)).then(setMapQr).catch(() => setMapQr(null));
  }, [isOpen, wedding.venueKakaoMap, wedding.venueAddress, mapQr]);

  useEffect(() => {
    if (!isOpen || staticMap) return;
    const apiBase = import.meta.env.VITE_API_URL || '';
    const addr = wedding.venue + ' ' + (wedding.venueHall || '');
    fetch(`${apiBase}/map/geocode?address=${encodeURIComponent(addr)}`)
      .then(r => r.json())
      .then(({ lng, lat }) => renderOsmTiles(Number(lat), Number(lng), 16, 800, 600))
      .then(setStaticMap)
      .catch(() => setStaticMap(null));
  }, [isOpen, wedding.venue, wedding.venueHall, staticMap]);

  useEffect(() => {
    if (!isOpen || invQr) return;
    const invUrl = `${window.location.origin}/w/${wedding.slug}`;
    QRCode.toDataURL(invUrl, {
      width: 200, margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#555555', light: '#FFFFFF' },
    }).then(url => loadImage(url)).then(setInvQr).catch(() => setInvQr(null));
  }, [isOpen, wedding.slug, invQr]);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !fontsReady) return;
    setRendering(true);
    canvas.width = (current as any).w || 2400; canvas.height = (current as any).h || 900;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    await current.draw(ctx, wedding, photo, mapQr, staticMap, invQr);
    setRendering(false);
  }, [current, wedding, fontsReady, photo, mapQr, staticMap, invQr]);

  useEffect(() => {
    if (isOpen && fontsReady) render();
  }, [isOpen, render, fontsReady]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${wedding.groomName}_${wedding.brideName}_종이청첩장_${current.id}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-stone-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h3 className="text-lg font-medium text-stone-800">종이 청첩장</h3>
              <p className="text-sm text-stone-400 mt-0.5">{(current as any).h > 1000 ? '2단 접지' : '3단 접지'} · 인쇄용 고해상도</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-stone-500" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <button onClick={() => setDesignIdx(i => (i - 1 + DESIGNS.length) % DESIGNS.length)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-stone-400" />
              </button>
              <div className="text-center">
                <p className="text-base font-medium text-stone-800">{current.label}</p>
                <p className="text-xs text-stone-400 mt-0.5">{current.desc}</p>
              </div>
              <button onClick={() => setDesignIdx(i => (i + 1) % DESIGNS.length)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-stone-400" />
              </button>
            </div>
            <div className="flex justify-center gap-2">
              {DESIGNS.map((_, idx) => (
                <button key={idx} onClick={() => setDesignIdx(idx)}
                  className={`h-2 rounded-full transition-all ${designIdx === idx ? 'bg-stone-800 w-5' : 'bg-stone-300 w-2'}`} />
              ))}
            </div>
            <div className="flex justify-center bg-stone-50 rounded-xl p-4 overflow-x-auto">
              {!fontsReady ? (
                <div className="h-48 flex items-center justify-center text-sm text-stone-400">폰트 로딩 중...</div>
              ) : (
                <canvas ref={canvasRef} className="shadow-xl rounded-lg" style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain' }} />
              )}
            </div>
            <div className="bg-stone-50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-stone-700">인쇄 안내</p>
              <ul className="text-xs text-stone-500 space-y-1.5 leading-relaxed">
                <li>{(current as any).h > 1000 ? '2단 접지 A5 규격 (펼침 297×210mm / 접힘 148.5×210mm)' : '3단 접지 규격 (펼침 381×143mm / 접힘 127×143mm)'}</li>
                <li>300dpi 고해상도 ({(current as any).w}×{(current as any).h}px)</li>
                <li>추천 용지: 랑데부지 250g, 스노우화이트, 코튼지</li>
                <li>{(current as any).h > 1000 ? '인쇄소에 파일 전달 후 반접기 재단 요청' : '인쇄소에 파일 전달 후 3단 접지 재단 요청'}</li>
                <li>· 지도 QR코드를 스캔하면 카카오맵이 열립니다</li>
              </ul>
            </div>
            <button onClick={handleDownload} disabled={rendering || !fontsReady}
              className="w-full py-3.5 bg-stone-800 text-white rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-stone-900 transition-colors disabled:opacity-50">
              <Download className="w-4 h-4" />
              {rendering ? '생성 중...' : '고해상도 PNG 다운로드'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
