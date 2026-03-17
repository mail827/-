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
      classic: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a modern minimalist white studio with clean white walls and large windows casting soft natural daylight, wearing elegant black tuxedo with white shirt and black bow tie, airy contemporary elegance, confident gentle gaze, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      garden: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in an outdoor garden wedding setting, wearing navy blue suit with boutonniere, lush botanical garden background with blooming flowers, golden hour sunlight filtering through trees, natural romantic atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      hanbok: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a modern Korean hanbok wedding portrait, wearing refined navy hanbok jeogori with clean modern lines, minimalist Korean courtyard with wooden architecture, soft golden hour light, editorial fashion wedding style, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      cinema: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. cinematic movie poster style wedding portrait, dramatic lighting, dark moody background with rim light, wearing tailored black suit with confident pose, high contrast lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      magazine: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a high-end editorial wedding portrait, designer black suit, clean dark studio, dramatic single spotlight, strong pose facing camera, high contrast lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      cruise: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. luxury yacht deck at golden hour sunset, wearing cream linen suit with open collar white shirt, warm amber ocean light, gentle sea breeze blowing hair softly, turquoise Mediterranean sea behind, yacht railing and polished wood deck, golden sun reflecting on calm water waves, romantic warm cinematic lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    };
    const BOOTH_FEMALE: Record<string, string> = {
      classic: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a modern minimalist white studio with clean white walls and large windows casting soft natural daylight, wearing white haute couture strapless sweetheart bell gown with sculpted silk mikado bodice and bell skirt, airy contemporary elegance, gentle smile, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      garden: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in an outdoor garden bridal setting, wearing flowing white wedding dress, surrounded by blooming roses and wisteria, golden hour sunlight, holding wildflower bouquet, ethereal natural beauty, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      hanbok: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a modern Korean hanbok bridal portrait, wearing elegant pastel pink and ivory hanbok with delicate floral embroidery, hair adorned with simple gold hairpin, minimalist Korean courtyard, soft golden light, editorial wedding style, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      cinema: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. cinematic movie poster style bridal portrait, dramatic lighting, dark moody background with rim light, wearing glamorous black evening gown, confident elegant pose, high contrast lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      magazine: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a high-end editorial bridal portrait, sculptural white couture gown, clean minimalist backdrop, dramatic single light source, confident elegant pose, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
      cruise: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. elegant bride on luxury yacht deck at golden hour sunset, wearing flowing white chiffon dress with wind-blown fabric, warm amber ocean light, gentle sea breeze blowing hair and dress softly, turquoise Mediterranean sea behind, yacht railing and polished wood deck, golden sun reflecting on calm water waves, romantic warm cinematic lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    };

    const gender = req.body.gender || 'female';
    const concepts = gender === 'male' ? BOOTH_MALE : BOOTH_FEMALE;
    const prompt = concepts[concept] || concepts.classic;

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
