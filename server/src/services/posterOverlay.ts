import { createCanvas, registerFont, loadImage, CanvasRenderingContext2D } from 'canvas';
import sharp from 'sharp';
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
  layout: 'CLASSIC' | 'MODERN' | 'BOLD' | 'MINIMAL';
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

interface LayoutPosition {
  nameY: number;
  nameAlign: CanvasTextAlign;
  nameSize: number;
  titleY: number;
  titleSize: number;
  taglineY: number;
  taglineSize: number;
  infoY: number;
  infoSize: number;
}

const LAYOUTS: Record<string, LayoutPosition> = {
  CLASSIC: {
    nameY: 0.055,
    nameAlign: 'center',
    nameSize: 32,
    titleY: 0.44,
    titleSize: 110,
    taglineY: 0.56,
    taglineSize: 24,
    infoY: 0.95,
    infoSize: 18,
  },
  MODERN: {
    nameY: 0.88,
    nameAlign: 'left',
    nameSize: 26,
    titleY: 0.78,
    titleSize: 90,
    taglineY: 0.84,
    taglineSize: 20,
    infoY: 0.96,
    infoSize: 16,
  },
  BOLD: {
    nameY: 0.04,
    nameAlign: 'center',
    nameSize: 30,
    titleY: 0.38,
    titleSize: 140,
    taglineY: 0.52,
    taglineSize: 26,
    infoY: 0.95,
    infoSize: 18,
  },
  MINIMAL: {
    nameY: 0.93,
    nameAlign: 'center',
    nameSize: 22,
    titleY: 0.46,
    titleSize: 72,
    taglineY: 0.54,
    taglineSize: 18,
    infoY: 0.97,
    infoSize: 15,
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

function drawGradientVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.55)');
  topGrad.addColorStop(0.6, 'rgba(0,0,0,0.15)');
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, w, h * 0.5);

  const bottomGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
  bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
  bottomGrad.addColorStop(0.5, 'rgba(0,0,0,0.2)');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);

  const edgeGrad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  edgeGrad.addColorStop(0, 'rgba(0,0,0,0)');
  edgeGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, w, h);
}

function drawTextWithShadow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  opacity: number,
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = color;
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

  const baseImage = await loadImage(resized);
  const canvas = createCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(baseImage, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  drawGradientVignette(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  const layout = LAYOUTS[config.layout] || LAYOUTS.CLASSIC;
  const fonts = FONT_REGISTRY[config.fontId] || FONT_REGISTRY.script_elegant;
  const color = config.textColor || '#FFFFFF';
  const opacity = config.textOpacity ?? 0.95;
  const maxTextWidth = OUTPUT_WIDTH * 0.85;
  const padX = config.layout === 'MODERN' ? OUTPUT_WIDTH * 0.08 : OUTPUT_WIDTH / 2;

  ctx.textAlign = layout.nameAlign;
  ctx.textBaseline = 'middle';

  const nameStr =
    textInput.nameLanguage === 'en'
      ? `${textInput.groomName}  &  ${textInput.brideName}`
      : `${textInput.groomName}  ${textInput.brideName}`;

  const spacedName = nameStr.split('').join('\u2009');
  const nameSize = fitTextWidth(ctx, spacedName, fonts.name, layout.nameSize, maxTextWidth);
  ctx.font = `${nameSize}px "${fonts.name}"`;
  drawTextWithShadow(ctx, spacedName.toUpperCase(), padX, OUTPUT_HEIGHT * layout.nameY, color, opacity * 0.55);

  if (textInput.titleText) {
    const lines = textInput.titleText.split('\n');
    const lineHeight = layout.titleSize * 1.15;
    const startY = OUTPUT_HEIGHT * layout.titleY - ((lines.length - 1) * lineHeight) / 2;
    ctx.textAlign = 'center';
    for (let i = 0; i < lines.length; i++) {
      const tSize = fitTextWidth(ctx, lines[i], fonts.title, layout.titleSize, maxTextWidth);
      ctx.font = `${tSize}px "${fonts.title}"`;
      drawTextWithShadow(
        ctx,
        lines[i],
        OUTPUT_WIDTH / 2,
        startY + i * lineHeight,
        color,
        opacity * 0.9,
      );
    }
  }

  if (textInput.tagline) {
    const tgSize = fitTextWidth(ctx, textInput.tagline, fonts.title, layout.taglineSize, maxTextWidth);
    ctx.font = `italic ${tgSize}px "${fonts.title}"`;
    ctx.textAlign = 'center';
    drawTextWithShadow(
      ctx,
      textInput.tagline,
      OUTPUT_WIDTH / 2,
      OUTPUT_HEIGHT * layout.taglineY,
      color,
      opacity * 0.85,
    );
  }

  const infoParts: string[] = [];
  if (textInput.dateText) infoParts.push(textInput.dateText);
  if (textInput.venueText) infoParts.push(textInput.venueText);
  if (infoParts.length > 0) {
    const infoStr = infoParts.join('  ·  ');
    const infoSize = fitTextWidth(ctx, infoStr, fonts.info, layout.infoSize, maxTextWidth);
    ctx.font = `${infoSize}px "${fonts.info}"`;
    ctx.textAlign = 'center';
    drawTextWithShadow(
      ctx,
      infoStr,
      OUTPUT_WIDTH / 2,
      OUTPUT_HEIGHT * layout.infoY,
      color,
      opacity * 0.8,
    );
  }

  const posterBuffer = canvas.toBuffer('image/png');

  const finalJpeg = await sharp(posterBuffer).jpeg({ quality: 95 }).toBuffer();

  return finalJpeg;
}

export async function generateThumbnail(posterBuffer: Buffer): Promise<Buffer> {
  return sharp(posterBuffer).resize(450, 600, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
}
