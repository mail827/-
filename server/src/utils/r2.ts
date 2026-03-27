import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'wedding-assets';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

const EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/aac': '.aac',
  'audio/mp4': '.m4a',
};

interface R2UploadResult {
  url: string;
  key: string;
  thumbUrl?: string;
}

const optimizeImage = async (buffer: Buffer, maxWidth: number, quality: number = 92): Promise<Buffer> => {
  return sharp(buffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality, nearLossless: true })
    .toBuffer();
};

export const uploadToR2 = async (
  fileBuffer: Buffer,
  folder: string,
  mimeType: string,
  options?: { skipThumb?: boolean; maxWidth?: number; quality?: number; keepOriginal?: boolean }
): Promise<R2UploadResult> => {
  const id = randomUUID();
  const isImage = mimeType.startsWith('image/');
  const ext = isImage ? (options?.keepOriginal ? (EXT_MAP[mimeType] || '.jpg') : '.webp') : (EXT_MAP[mimeType] || '.bin');
  const key = `${folder}/${id}${ext}`;

  let body: Buffer = fileBuffer;
  let contentType = mimeType;

  if (isImage) {
    body = await optimizeImage(fileBuffer, options?.maxWidth || 2400, 95);
    contentType = 'image/webp';
  }

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));

  const result: R2UploadResult = {
    url: `${PUBLIC_URL}/${key}`,
    key,
  };

  if (isImage && !options?.skipThumb) {
    const thumbBuffer = await optimizeImage(fileBuffer, 400, 80);
    const thumbKey = `${folder}/${id}_thumb.webp`;
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: thumbKey,
      Body: thumbBuffer,
      ContentType: 'image/webp',
    }));
    result.thumbUrl = `${PUBLIC_URL}/${thumbKey}`;
  }

  return result;
};

export const uploadFromUrlToR2 = async (
  imageUrl: string,
  folder: string
): Promise<R2UploadResult> => {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/png';
  return uploadToR2(buffer, folder, contentType, { keepOriginal: true, skipThumb: true });
};

export const uploadVideoToR2 = async (
  filePath: string,
  folder: string,
  videoId: string
): Promise<R2UploadResult> => {
  const fs = await import('fs');
  const buffer = fs.readFileSync(filePath);
  const key = `${folder}/${videoId}.mp4`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'video/mp4',
  }));

  return { url: `${PUBLIC_URL}/${key}`, key };
};

export const deleteFromR2 = async (key: string): Promise<void> => {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  const thumbKey = key.replace(/\.[^.]+$/, '_thumb.webp');
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: thumbKey })).catch(() => {});
};

export const getR2PublicUrl = (key: string): string => `${PUBLIC_URL}/${key}`;

export const uploadFromUrlToR2WithWatermark = async (
  imageUrl: string,
  folder: string,
  watermarkText: string = 'weddingshop.cloud'
): Promise<R2UploadResult> => {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const metadata = await sharp(buffer).metadata();
  const w = metadata.width || 900;
  const h = metadata.height || 1200;
  const fontSize = Math.max(16, Math.floor(w * 0.025));

  const svgOverlay = Buffer.from(
    `<svg width="${w}" height="${h}"><text x="${w - 20}" y="${h - 20}" font-size="${fontSize}" fill="white" opacity="0.4" text-anchor="end" font-family="Arial, sans-serif">${watermarkText}</text></svg>`
  );

  const watermarked = await sharp(buffer)
    .composite([{ input: svgOverlay, gravity: 'southeast' }])
    .webp({ quality: 90 })
    .toBuffer();

  const id = randomUUID();
  const key = `${folder}/${id}.webp`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: watermarked,
    ContentType: 'image/webp',
  }));

  return { url: `${PUBLIC_URL}/${key}`, key };
};

async function detectFaceCenter(imageUrl: string): Promise<{ x: number; y: number } | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
            { type: 'text', text: 'Return ONLY JSON {x,y} with the face center as percentage (0-100) of image width/height. If multiple faces, pick the largest. Example: {"x":50,"y":30}' },
          ],
        }],
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    const match = text.match(/\{[^}]+\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
    return null;
  } catch { return null; }
}

export const cropToPortraitR2 = async (imageUrl: string): Promise<string> => {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return imageUrl;
    const buffer = Buffer.from(await res.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) return imageUrl;

    const facePos = await detectFaceCenter(imageUrl);
    const fx = facePos ? facePos.x / 100 : 0.5;
    const fy = facePos ? facePos.y / 100 : 0.35;

    const targetRatio = 3 / 4;
    const currentRatio = metadata.width / metadata.height;
    let cropW = metadata.width;
    let cropH = metadata.height;

    if (currentRatio > targetRatio) {
      cropW = Math.round(metadata.height * targetRatio);
    } else {
      cropH = Math.round(metadata.width / targetRatio);
    }

    const left = Math.max(0, Math.min(metadata.width - cropW, Math.round(fx * metadata.width - cropW / 2)));
    const top = Math.max(0, Math.min(metadata.height - cropH, Math.round(fy * metadata.height - cropH / 2)));

    const cropped = await sharp(buffer)
      .extract({ left, top, width: cropW, height: cropH })
      .resize(900, 1200)
      .png({ quality: 95 })
      .toBuffer();

    const id = randomUUID();
    const key = 'crop-temp/' + id + '.png';

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: cropped,
      ContentType: 'image/png',
    }));

    return PUBLIC_URL + '/' + key;
  } catch (e) {
    console.error('[cropToPortraitR2] error:', (e as Error).message);
    return imageUrl;
  }
};
