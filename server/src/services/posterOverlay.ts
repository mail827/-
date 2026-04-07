import { createCanvas, registerFont, loadImage, CanvasRenderingContext2D } from 'canvas';
import sharp from 'sharp';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FONTS_DIR = path.resolve(__dirname, '../../assets/fonts/poster');
const OUTPUT_WIDTH = 1350;
const OUTPUT_HEIGHT = 1800;

export interface PosterTextInput {
  groomName: string;
  brideName: string;
  titleText?: string;
  tagline?: string;
  dateText?: string;
  venueText?: string;
  nameLanguage: 'kr' | 'en';
}

export interface PosterConfig {
  fontId: string;
  layout?: string;
  textColor?: string;
  textOpacity?: number;
}

interface FontSet {
  title: string;
  name: string;
  info: string;
}

const FONT_REGISTRY: Record<string, FontSet> = {
  script_elegant: {
    title: 'GreatVibes-Regular',
    name: 'Cinzel-VariableFont_wght',
    info: 'Lato-Regular',
  },
  serif_classic: {
    title: 'PlayfairDisplay-VariableFont_wght',
    name: 'PlayfairDisplaySC-Regular',
    info: 'Lato-Regular',
  },
  sans_modern: {
    title: 'Montserrat-VariableFont_wght',
    name: 'Montserrat-VariableFont_wght',
    info: 'Lato-Light',
  },
  calligraphy_kr: {
    title: 'MapoFlowerIsland',
    name: 'MapoFlowerIsland',
    info: 'Lato-Regular',
  },
  script_sacramento: {
    title: 'Sacramento-Regular',
    name: 'CormorantGaramond-VariableFont_wght',
    info: 'Raleway-VariableFont_wght',
  },
  script_pinyon: {
    title: 'PinyonScript-Regular',
    name: 'Cinzel-VariableFont_wght',
    info: 'JosefinSans-VariableFont_wght',
  },
  museum_classic: {
    title: '국립박물관문화재단클래식M',
    name: '국립박물관문화재단클래식B',
    info: '국립박물관문화재단클래식L',
  },
};

let fontsRegistered = false;

function ensureFontsRegistered() {
  if (fontsRegistered) return;
  if (!fs.existsSync(FONTS_DIR)) {
    fs.mkdirSync(FONTS_DIR, { recursive: true });
    return;
  }
  const fontFiles = fs.readdirSync(FONTS_DIR).filter((f) => f.endsWith('.ttf') || f.endsWith('.otf'));
  for (const file of fontFiles) {
    const familyName = path.basename(file, path.extname(file));
    try {
      registerFont(path.join(FONTS_DIR, file), { family: familyName });
    } catch (e) {}
  }
  fontsRegistered = true;
}

interface ZoneAnalysis {
  row: number;
  col: number;
  brightness: number;
  contrast: number;
  isSkinTone: boolean;
}

interface Placement {
  titleY: number;
  titleAlign: CanvasTextAlign;
  titleSize: number;
  taglineY: number;
  taglineSize: number;
  padX: number;
  textColor: string;
  shadowColor: string;
  shadowBlur: number;
  isDark: boolean;
}

async function detectFaceBBoxes(buffer: Buffer): Promise<{x1:number;y1:number;x2:number;y2:number}[]> {
  try {
    const small = await sharp(buffer).resize(512, 683, { fit: 'cover' }).jpeg({ quality: 70 }).toBuffer();
    const b64 = small.toString('base64');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY },
      body: JSON.stringify({
        model: 'gpt-4o-mini', max_tokens: 200,
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64, detail: 'low' } },
          { type: 'text', text: 'Detect all human faces in this image. For each face return its bounding box as percentage of image dimensions. Return ONLY a JSON array like [{"x1":20,"y1":10,"x2":45,"y2":40}] where values are 0-100 percentages. If no faces found return [].' },
        ] }],
      }),
    });
    const data = await res.json() as any;
    const raw = (data.choices?.[0]?.message?.content || '[]').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      console.log('[PosterOverlay] Face detect:', parsed.length, 'faces');
      return parsed;
    }
    return [];
  } catch (e: any) {
    console.log('[PosterOverlay] Face detect failed:', e.message);
    return [];
  }
}

async function analyzeImageZones(buffer: Buffer): Promise<ZoneAnalysis[]> {
  const zones: ZoneAnalysis[] = [];
  const resized = await sharp(buffer).resize(300, 400, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = resized;
  const { width, height, channels } = info;
  const rowH = Math.floor(height / 3);
  const colW = Math.floor(width / 3);

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      let sumSq = 0;
      let skinCount = 0;
      let count = 0;
      const yStart = r * rowH;
      const yEnd = Math.min((r + 1) * rowH, height);
      const xStart = c * colW;
      const xEnd = Math.min((c + 1) * colW, width);

      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const idx = (y * width + x) * channels;
          const rr = data[idx];
          const gg = data[idx + 1];
          const bb = data[idx + 2];
          const lum = 0.299 * rr + 0.587 * gg + 0.114 * bb;
          sum += lum;
          sumSq += lum * lum;
          count++;
          if (lum > 100 && lum < 200 && rr > gg && rr > bb && (rr - gg) < 80 && (rr - bb) > 10) {
            skinCount++;
          }
        }
      }

      const avg = sum / count;
      const variance = sumSq / count - avg * avg;
      zones.push({
        row: r,
        col: c,
        brightness: avg,
        contrast: Math.sqrt(variance),
        isSkinTone: (skinCount / count) > 0.25,
      });
    }
  }
  return zones;
}

function findOptimalPlacement(zones: ZoneAnalysis[], titleLineCount: number, faceBBoxes: {x1:number;y1:number;x2:number;y2:number}[] = []): Placement {
  const candidates: { y: number; align: CanvasTextAlign; padX: number; score: number; zone: ZoneAnalysis }[] = [];

  const zoneAt = (r: number, c: number) => zones.find(z => z.row === r && z.col === c)!;

  const evalCandidate = (row: number, cols: number[], yRatio: number, align: CanvasTextAlign, padX: number, aestheticBonus: number) => {
    const relevantZones = cols.map(c => zoneAt(row, c));
    const hasFace = relevantZones.some(z => z.isSkinTone);
    const avgBright = relevantZones.reduce((s, z) => s + z.brightness, 0) / relevantZones.length;
    const avgContrast = relevantZones.reduce((s, z) => s + z.contrast, 0) / relevantZones.length;

    let score = aestheticBonus;
    if (hasFace) score -= 100;
    const rowCenter = (row + 0.5) / 3 * 100;
    for (const fb of faceBBoxes) {
      const fy1 = fb.y1; const fy2 = fb.y2;
      const fCenterY = (fy1 + fy2) / 2;
      if (Math.abs(rowCenter - fCenterY) < 25) score -= 200;
    }
    score += (avgContrast < 40) ? 15 : 0;
    const darkBonus = Math.max(0, (180 - avgBright) / 3);
    score += darkBonus;
    if (row === 1) score += 8;
    if (align === 'center') score += 5;

    candidates.push({ y: yRatio, align, padX, score, zone: relevantZones[0] });
  };

  evalCandidate(0, [0, 1, 2], 0.20, 'center', OUTPUT_WIDTH / 2, 12);
  evalCandidate(0, [0, 1, 2], 0.28, 'center', OUTPUT_WIDTH / 2, 15);
  evalCandidate(1, [0, 1, 2], 0.42, 'center', OUTPUT_WIDTH / 2, 20);
  evalCandidate(1, [0, 1, 2], 0.50, 'center', OUTPUT_WIDTH / 2, 18);
  evalCandidate(2, [0, 1, 2], 0.72, 'center', OUTPUT_WIDTH / 2, 10);
  evalCandidate(2, [0, 1, 2], 0.78, 'center', OUTPUT_WIDTH / 2, 8);
  evalCandidate(1, [0], 0.45, 'left', OUTPUT_WIDTH * 0.08, 10);
  evalCandidate(1, [2], 0.45, 'right', OUTPUT_WIDTH * 0.92, 8);
  evalCandidate(2, [0], 0.75, 'left', OUTPUT_WIDTH * 0.08, 6);

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  const zoneBright = best.zone.brightness;
  const isDark = zoneBright < 120;

  const titleSize = best.align === 'center' ? 110 : 90;
  const taglineSize = best.align === 'center' ? 24 : 20;
  const lineHeight = titleSize * 1.15;
  const taglineOffset = (titleLineCount * lineHeight) / 2 + titleSize * 0.6;

  return {
    titleY: best.y,
    titleAlign: best.align,
    titleSize,
    taglineY: best.y + taglineOffset / OUTPUT_HEIGHT,
    taglineSize,
    padX: best.padX,
    textColor: isDark ? '#FFFFFF' : '#1A1A18',
    shadowColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.7)',
    shadowBlur: isDark ? 14 : 10,
    isDark,
  };
}

function drawAdaptiveVignette(ctx: CanvasRenderingContext2D, w: number, h: number, placement: Placement) {
  if (placement.isDark) {
    const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.18);
    topGrad.addColorStop(0, 'rgba(0,0,0,0.45)');
    topGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, h * 0.18);

    const botGrad = ctx.createLinearGradient(0, h * 0.88, 0, h);
    botGrad.addColorStop(0, 'rgba(0,0,0,0)');
    botGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, h * 0.88, w, h * 0.12);
  } else {
    const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.15);
    topGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
    topGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, h * 0.15);

    const botGrad = ctx.createLinearGradient(0, h * 0.9, 0, h);
    botGrad.addColorStop(0, 'rgba(0,0,0,0)');
    botGrad.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, h * 0.9, w, h * 0.1);
  }

  const titleY = placement.titleY * h;
  const bandTop = Math.max(0, titleY - h * 0.15);
  const bandBot = Math.min(h, titleY + h * 0.15);
  const bandGrad = ctx.createLinearGradient(0, bandTop, 0, bandBot);
  if (placement.isDark) {
    bandGrad.addColorStop(0, 'rgba(0,0,0,0)');
    bandGrad.addColorStop(0.3, 'rgba(0,0,0,0.25)');
    bandGrad.addColorStop(0.7, 'rgba(0,0,0,0.25)');
    bandGrad.addColorStop(1, 'rgba(0,0,0,0)');
  } else {
    bandGrad.addColorStop(0, 'rgba(255,255,255,0)');
    bandGrad.addColorStop(0.3, 'rgba(255,255,255,0.2)');
    bandGrad.addColorStop(0.7, 'rgba(255,255,255,0.2)');
    bandGrad.addColorStop(1, 'rgba(255,255,255,0)');
  }
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandTop, w, bandBot - bandTop);
}

function drawTextAdaptive(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  placement: Placement,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = placement.shadowColor;
  ctx.shadowBlur = placement.shadowBlur;
  ctx.shadowOffsetX = placement.isDark ? 1 : 0;
  ctx.shadowOffsetY = placement.isDark ? 2 : 1;
  ctx.fillStyle = placement.textColor;
  ctx.fillText(text, x, y);
  if (!placement.isDark) {
    ctx.shadowBlur = 0;
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

function fitTextWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontFamily: string,
  maxSize: number,
  maxWidth: number,
): number {
  let size = maxSize;
  while (size > 12) {
    ctx.font = `${size}px "${fontFamily}"`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return size;
}

export async function generatePosterOverlay(
  baseImageBuffer: Buffer,
  textInput: PosterTextInput,
  config: PosterConfig,
): Promise<Buffer> {
  ensureFontsRegistered();

  const resized = await sharp(baseImageBuffer)
    .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 95 })
    .toBuffer();

  const zones = await analyzeImageZones(resized);
  const faceBBoxes = await detectFaceBBoxes(resized);
  const titleLines = textInput.titleText ? textInput.titleText.split('\n') : ['Eternal Tides'];
  const placement = findOptimalPlacement(zones, titleLines.length, faceBBoxes);

  const baseImage = await loadImage(resized);
  const canvas = createCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(baseImage, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  drawAdaptiveVignette(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT, placement);

  const fonts = FONT_REGISTRY[config.fontId] || FONT_REGISTRY.script_elegant;
  const opacity = config.textOpacity ?? 0.95;
  const maxTextWidth = OUTPUT_WIDTH * 0.85;

  ctx.textBaseline = 'middle';

  const nameStr =
    textInput.nameLanguage === 'en'
      ? `${textInput.groomName}  &  ${textInput.brideName}`
      : `${textInput.groomName}  ${textInput.brideName}`;
  const spacedName = nameStr.split('').join('\u2009');

  ctx.textAlign = 'center';
  const nameSize = fitTextWidth(ctx, spacedName, fonts.name, 32, maxTextWidth);
  ctx.font = `${nameSize}px "${fonts.name}"`;
  const nameColor = zones[1].brightness < 120 ? '#FFFFFF' : '#1A1A18';
  const nameShadow = zones[1].brightness < 120 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.6)';
  ctx.save();
  ctx.globalAlpha = opacity * 0.5;
  ctx.shadowColor = nameShadow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = nameColor;
  ctx.fillText(spacedName.toUpperCase(), OUTPUT_WIDTH / 2, OUTPUT_HEIGHT * 0.055);
  ctx.restore();

  if (titleLines.length > 0) {
    const lineHeight = placement.titleSize * 1.15;
    const startY = OUTPUT_HEIGHT * placement.titleY - ((titleLines.length - 1) * lineHeight) / 2;
    ctx.textAlign = placement.titleAlign;
    for (let i = 0; i < titleLines.length; i++) {
      const tSize = fitTextWidth(ctx, titleLines[i], fonts.title, placement.titleSize, maxTextWidth);
      ctx.font = `${tSize}px "${fonts.title}"`;
      drawTextAdaptive(ctx, titleLines[i], placement.padX, startY + i * lineHeight, placement, opacity * 0.9);
    }
  }

  if (textInput.tagline) {
    const tgSize = fitTextWidth(ctx, textInput.tagline, fonts.title, placement.taglineSize, maxTextWidth);
    ctx.font = `italic ${tgSize}px "${fonts.title}"`;
    ctx.textAlign = placement.titleAlign;
    drawTextAdaptive(ctx, textInput.tagline, placement.padX, OUTPUT_HEIGHT * placement.taglineY, placement, opacity * 0.7);
  }

  const infoParts: string[] = [];
  if (textInput.dateText) infoParts.push(textInput.dateText);
  if (textInput.venueText) infoParts.push(textInput.venueText);
  if (infoParts.length > 0) {
    const infoStr = infoParts.join('  \u00b7  ');
    const infoZone = zones[7];
    const infoColor = infoZone.brightness < 120 ? '#FFFFFF' : '#1A1A18';
    const infoShadow = infoZone.brightness < 120 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.6)';
    const infoSize = fitTextWidth(ctx, infoStr, fonts.info, 18, maxTextWidth);
    ctx.font = `${infoSize}px "${fonts.info}"`;
    ctx.textAlign = 'center';
    ctx.save();
    ctx.globalAlpha = opacity * 0.7;
    ctx.shadowColor = infoShadow;
    ctx.shadowBlur = 10;
    ctx.fillStyle = infoColor;
    ctx.fillText(infoStr, OUTPUT_WIDTH / 2, OUTPUT_HEIGHT * 0.95);
    ctx.restore();
  }

  const posterBuffer = canvas.toBuffer('image/png');
  return sharp(posterBuffer).jpeg({ quality: 95 }).toBuffer();
}

export async function generateThumbnail(posterBuffer: Buffer): Promise<Buffer> {
  return sharp(posterBuffer).resize(450, 600, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
}
