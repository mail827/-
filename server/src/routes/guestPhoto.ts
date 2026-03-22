import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/:slug/upload', upload.single('photo'), async (req, res) => {
  try {
    const { slug } = req.params;
    const { guestName, message } = req.body;
    const wedding = await prisma.wedding.findUnique({ where: { slug } });
    if (!wedding) return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    if (!wedding.guestPhotoEnabled) return res.status(403).json({ error: '하객 포토 업로드가 비활성화되어 있습니다' });
    if (!req.file) return res.status(400).json({ error: '사진을 선택해주세요' });

    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: `wedding/${slug}/guest-photos`, transformation: [{ width: 1200, quality: 'auto' }] },
        (err, r) => err ? reject(err) : resolve(r)
      ).end(req.file!.buffer);
    });

    const photo = await prisma.guestPhoto.create({
      data: { weddingId: wedding.id, guestName: guestName || '익명', imageUrl: result.secure_url, publicId: result.public_id, message, mediaType: 'IMAGE' },
    });
    res.json(photo);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:slug/upload-video', async (req, res) => {
  try {
    const { slug } = req.params;
    const { guestName, message, videoUrl, publicId } = req.body;
    const wedding = await prisma.wedding.findUnique({ where: { slug } });
    if (!wedding) return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    if (!wedding.guestPhotoEnabled) return res.status(403).json({ error: '업로드가 비활성화되어 있습니다' });
    if (!videoUrl) return res.status(400).json({ error: '영상 URL이 필요합니다' });

    const photo = await prisma.guestPhoto.create({
      data: {
        weddingId: wedding.id,
        guestName: guestName || '익명',
        imageUrl: videoUrl,
        publicId: publicId || null,
        message,
        mediaType: 'VIDEO'
      },
    });
    res.json(photo);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:slug', async (req, res) => {
  const wedding = await prisma.wedding.findUnique({ where: { slug: req.params.slug } });
  if (!wedding) return res.status(404).json({ error: '없음' });
  const photos = await prisma.guestPhoto.findMany({
    where: { weddingId: wedding.id, approved: true, mediaType: { not: 'AI_PHOTO' } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(photos);
});

router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    const photo = await prisma.guestPhoto.findUnique({ where: { id: req.params.id }, include: { wedding: true } });
    if (!photo) return res.status(404).json({ error: '없음' });
    if (photo.wedding.userId !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ error: '권한 없음' });
    if (photo.publicId) {
      if (photo.mediaType === 'VIDEO') {
        await cloudinary.uploader.destroy(photo.publicId, { resource_type: 'video' });
      } else {
        await cloudinary.uploader.destroy(photo.publicId);
      }
    }
    await prisma.guestPhoto.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});


router.post('/:slug/ai-booth', async (req, res) => {
  try {
    const { slug } = req.params;
    const { guestName, imageUrl, concept } = req.body;
    if (!imageUrl || !concept) return res.status(400).json({ error: 'imageUrl, concept required' });

    const wedding = await prisma.wedding.findUnique({ where: { slug } });
    if (!wedding) return res.status(404).json({ error: 'Not found' });
    if (!wedding.aiEnabled) return res.status(403).json({ error: 'AI not enabled' });

    const FAL_API_KEY = process.env.FAL_API_KEY;
    const NEGATIVE = 'distorted face, deformed nose, asymmetric eyes, blurry face, smoothed skin, plastic face, bumpy skin, uneven skin texture, cartoon face, ugly face, merged faces, elongated face, enhanced jawline, square jaw, chiseled face, narrow face, long chin, protruding jaw, swollen face, inflated cheeks, inhuman proportions, uncanny valley face, alien features, double eyelid surgery, beautified face, cartoon, anime, illustration, painting, drawing, nsfw, nude, watermark, text, logo';

    const BOOTH_MALE: Record<string, string> = {
      gala: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person at a glamorous evening gala celebration party, wearing stylish charcoal suit with open collar shirt no tie, warm ambient lighting from chandeliers, marble hall with golden accents, holding a glass of champagne, confident relaxed smile, elegant celebration atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      flower: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a bright flower garden portrait, wearing smart casual navy blazer with white shirt, surrounded by colorful blooming peonies and roses, soft natural daylight, holding a small congratulatory bouquet, warm genuine smile, spring celebration mood, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      hanbok: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person wearing modern stylish daily hanbok in deep blue tone, contemporary casual Korean hanbok fashion, clean minimalist Korean cafe or courtyard setting, natural soft lighting, relaxed confident pose, modern Korean fashion editorial style, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      redcarpet: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person on a red carpet event, wearing sharp fitted black suit with subtle sheen, camera flashes in background, velvet rope and photographers, celebrity gala premiere atmosphere, charismatic confident pose, dramatic lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      magazine: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. high fashion editorial portrait, wearing designer casual outfit earth-tone knit sweater or stylish coat, clean minimalist studio with single dramatic light source, strong editorial pose, GQ magazine cover style, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      champagne: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person at a rooftop celebration party at golden hour sunset, wearing smart casual linen blazer with relaxed open collar, raising champagne glass in a toast, warm golden sunset city skyline behind, string lights and celebration atmosphere, joyful genuine smile, warm cinematic lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    };
    const BOOTH_FEMALE: Record<string, string> = {
      gala: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person at a glamorous evening gala celebration party, wearing elegant midnight blue or burgundy cocktail dress, warm ambient lighting from chandeliers, marble hall with golden accents, holding a glass of champagne, radiant confident smile, luxurious celebration atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      flower: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a bright flower garden portrait, wearing elegant pastel floral dress, surrounded by colorful blooming peonies and roses, soft natural daylight, holding a lush congratulatory bouquet, warm genuine smile, spring celebration mood, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      hanbok: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person wearing modern stylish daily hanbok in soft pastel pink tone, contemporary casual Korean hanbok fashion with simple clean lines, clean minimalist Korean cafe or courtyard setting, natural soft lighting, relaxed elegant pose, modern Korean fashion editorial style, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      redcarpet: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person on a red carpet event, wearing stunning black or deep red evening gown, camera flashes in background, velvet rope and photographers, celebrity gala premiere atmosphere, graceful confident pose, dramatic lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      magazine: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. high fashion editorial portrait, wearing designer casual outfit elegant knit or stylish trench coat, clean minimalist studio with single dramatic light source, strong editorial pose, Vogue magazine cover style, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      champagne: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person at a rooftop celebration party at golden hour sunset, wearing elegant satin slip dress in champagne gold color, raising champagne glass in a toast, warm golden sunset city skyline behind, string lights and celebration atmosphere, joyful radiant smile, warm cinematic lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    };

    const gender = req.body.gender || 'female';
    const concepts = gender === 'male' ? BOOTH_MALE : BOOTH_FEMALE;
    const prompt = concepts[concept] || concepts.gala;

    const cropUrl = imageUrl.includes('cloudinary.com') && imageUrl.includes('/upload/')
      ? imageUrl.replace('/upload/', '/upload/c_fill,ar_2:3,g_face,w_768,h_1152/')
      : imageUrl;

    const falRes = await fetch('https://queue.fal.run/fal-ai/nano-banana-2/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Key ' + FAL_API_KEY },
      body: JSON.stringify({ prompt, image_urls: [cropUrl], strength: 0.20, num_images: 1, image_size: { width: 768, height: 1152 }, negative_prompt: NEGATIVE }),
    });
    const falData = await falRes.json();

    if (!falData.status_url) return res.status(500).json({ error: 'AI generation failed' });

    const photo = await prisma.guestPhoto.create({
      data: {
        weddingId: wedding.id,
        guestName: guestName || 'Guest',
        imageUrl: '',
        mediaType: 'AI_PHOTO',
        message: concept,
      },
    });

    res.json({ photoId: photo.id, statusUrl: falData.status_url, responseUrl: falData.response_url, status: 'processing' });
  } catch (e: any) {
    console.error('[ai-booth] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/:slug/ai-booth/poll/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    const { statusUrl, responseUrl } = req.query;
    if (!statusUrl || !responseUrl) return res.status(400).json({ error: 'statusUrl, responseUrl required' });

    const FAL_API_KEY = process.env.FAL_API_KEY;
    const statusRes = await fetch(statusUrl as string, {
      headers: { Authorization: 'Key ' + FAL_API_KEY },
    });
    const status = await statusRes.json();

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(responseUrl as string, {
        headers: { Authorization: 'Key ' + FAL_API_KEY },
      });
      const result = await resultRes.json();

      if (result.detail) return res.json({ status: 'failed', error: 'AI server temporarily unavailable' });

      const falUrl = result.images?.[0]?.url;
      if (!falUrl) return res.json({ status: 'failed', error: 'No image generated' });

      const uploadRes: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(falUrl, {
          folder: 'wedding/ai-booth',
          transformation: [
            { overlay: { font_family: 'Arial', font_size: 24, text: 'weddingshop.cloud' }, gravity: 'south_east', x: 20, y: 20, opacity: 40, color: '#ffffff' }
          ],
        }, (err, r) => err ? reject(err) : resolve(r));
      });

      await prisma.guestPhoto.update({
        where: { id: photoId },
        data: { imageUrl: uploadRes.secure_url, publicId: uploadRes.public_id },
      });

      return res.json({ status: 'done', resultUrl: uploadRes.secure_url });
    }

    if (status.status === 'FAILED') {
      await prisma.guestPhoto.delete({ where: { id: photoId } }).catch(() => {});
      return res.json({ status: 'failed', error: status.error || 'Generation failed' });
    }

    res.json({ status: 'processing' });
  } catch (e: any) {
    console.error('[ai-booth poll] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
