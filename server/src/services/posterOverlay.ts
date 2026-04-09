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
  complexity: number;
  isSkinTone: boolean;
  avgR: number;
  avgG: number;
  avgB: number;
}

interface Placement {
  nameY: number;
  titleY: number;
  titleSize: number;
  taglineY: number;
  textColor: string;
  shadowColor: string;
  shadowBlur: number;
  isDark: boolean;
}

async function detectFaceZones(buffer: Buffer): Promise<Set<number>> {
  try {
    const small = await sharp(buffer).resize(512, 683, { fit: 'cover' }).jpeg({ quality: 75 }).toBuffer();
    const b64 = small.toString('base64');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY },
      body: JSON.stringify({
        model: 'gpt-4o', max_tokens: 20,
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64, detail: 'low' } },
          { type: 'text', text: 'This image is divided into 5 horizontal rows: ROW1 (top 20%), ROW2 (20-40%), ROW3 (40-60%), ROW4 (60-80%), ROW5 (bottom 20%). Which rows contain human faces? Reply ONLY with row numbers separated by commas. Example: ROW1,ROW2' },
        ] }],
      }),
    });
    const data = await res.json() as any;
    const raw = (data.choices?.[0]?.message?.content || '').toUpperCase();
    const zones = new Set<number>();
    if (raw.includes('ROW1') || raw.includes('1')) zones.add(0);
    if (raw.includes('ROW2') || raw.includes('2')) zones.add(1);
    if (raw.includes('ROW3') || raw.includes('3')) zones.add(2);
    if (raw.includes('ROW4') || raw.includes('4')) zones.add(3);
    if (raw.includes('ROW5') || raw.includes('5')) zones.add(4);
    console.log('[PosterOverlay] Face zones (5-row):', raw.trim(), '-> rows', [...zones]);
    return zones;
  } catch (e: any) {
    console.log('[PosterOverlay] Face zone detect failed:', e.message);
    return new Set();
  }
}

async function analyzeImageBrightness(buffer: Buffer): Promise<{ top: number; mid: number; bot: number }> {
  const resized = await sharp(buffer).resize(150, 200, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = resized;
  const { width, height, channels } = info;
  const thirdH = Math.floor(height / 3);
  const calc = (yStart: number, yEnd: number) => {
    let sum = 0, count = 0;
    for (let y = yStart; y < yEnd; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        sum += 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        count++;
      }
    }
    return sum / count;
  };
  return {
    top: calc(0, thirdH),
    mid: calc(thirdH, thirdH * 2),
    bot: calc(thirdH * 2, height),
  };
}

function findOptimalPlacement(faceRows: Set<number>, brightness: { top: number; mid: number; bot: number }): Placement {
  const titleCandidates = [
    { y: 0.52, faceCheck: [2, 3] },
    { y: 0.62, faceCheck: [3, 4] },
    { y: 0.42, faceCheck: [1, 2] },
    { y: 0.72, faceCheck: [3, 4] },
    { y: 0.30, faceCheck: [1, 2] },
  ];

  let titleY = 0.52;
  for (const c of titleCandidates) {
    const blocked = c.faceCheck.some(r => faceRows.has(r));
    if (!blocked) {
      titleY = c.y;
      break;
    }
  }

  const nameCandidates = [0.055, 0.93];
  let nameY = faceRows.has(0) ? 0.93 : 0.055;

  const avgBright = (brightness.top + brightness.mid + brightness.bot) / 3;
  const isDark = avgBright < 130;

  return {
    nameY,
    titleY,
    titleSize: 280,
    taglineY: titleY > 0.6 ? titleY + 0.14 : 0.88,
    textColor: '#FFFFFF',
    shadowColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)',
    shadowBlur: isDark ? 24 : 16,
    isDark,
  };
}

function drawTextWithShadow(
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
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = placement.textColor;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = placement.shadowBlur * 0.4;
  ctx.fillText(text, x, y);
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

  const [faceRows, brightness] = await Promise.all([
    detectFaceZones(resized),
    analyzeImageBrightness(resized),
  ]);
  const titleLines = textInput.titleText ? textInput.titleText.split('\n') : ['Eternal Tides'];
  const placement = findOptimalPlacement(faceRows, brightness);

  console.log('[PosterOverlay] titleY:', placement.titleY, 'nameY:', placement.nameY, 'isDark:', placement.isDark, 'faces:', [...faceRows]);

  const baseImage = await loadImage(resized);
  const canvas = createCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(baseImage, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  const fonts = FONT_REGISTRY[config.fontId] || FONT_REGISTRY.script_elegant;
  const opacity = config.textOpacity ?? 0.95;
  const maxTextWidth = OUTPUT_WIDTH * 0.92;

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const nameStr =
    textInput.nameLanguage === 'en'
      ? `${textInput.groomName}  &  ${textInput.brideName}`
      : `${textInput.groomName}  ${textInput.brideName}`;
  const spacedName = nameStr.split('').join('\u2009');

  const nameSize = fitTextWidth(ctx, spacedName, fonts.name, 36, maxTextWidth);
  ctx.font = `${nameSize}px "${fonts.name}"`;
  drawTextWithShadow(ctx, spacedName.toUpperCase(), OUTPUT_WIDTH / 2, OUTPUT_HEIGHT * placement.nameY, placement, opacity * 0.9);

  if (titleLines.length > 0) {
    const lineHeight = placement.titleSize * 1.08;
    const totalH = (titleLines.length - 1) * lineHeight;
    const startY = OUTPUT_HEIGHT * placement.titleY - totalH / 2;
    for (let i = 0; i < titleLines.length; i++) {
      const tSize = fitTextWidth(ctx, titleLines[i], fonts.title, placement.titleSize, maxTextWidth);
      ctx.font = `${tSize}px "${fonts.title}"`;
      drawTextWithShadow(ctx, titleLines[i], OUTPUT_WIDTH / 2, startY + i * lineHeight, placement, opacity * 0.93);
    }
  }

  if (textInput.tagline) {
    const tgSize = fitTextWidth(ctx, textInput.tagline, fonts.info, 24, maxTextWidth);
    ctx.font = `italic ${tgSize}px "${fonts.info}"`;
    drawTextWithShadow(ctx, textInput.tagline, OUTPUT_WIDTH / 2, OUTPUT_HEIGHT * placement.taglineY, placement, opacity * 0.8);
  }

  const infoParts: string[] = [];
  if (textInput.dateText) infoParts.push(textInput.dateText);
  if (textInput.venueText) infoParts.push(textInput.venueText);
  if (infoParts.length > 0) {
    const infoStr = infoParts.join('  \u00b7  ');
    const infoSize = fitTextWidth(ctx, infoStr, fonts.info, 20, maxTextWidth);
    ctx.font = `${infoSize}px "${fonts.info}"`;
    drawTextWithShadow(ctx, infoStr, OUTPUT_WIDTH / 2, OUTPUT_HEIGHT * 0.96, placement, opacity * 0.75);
  }

  const posterBuffer = canvas.toBuffer('image/png');
  return sharp(posterBuffer).jpeg({ quality: 95 }).toBuffer();
}

export async function generateThumbnail(posterBuffer: Buffer): Promise<Buffer> {
  return sharp(posterBuffer).resize(450, 600, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
}
