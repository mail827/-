import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import multer from 'multer';
import { generatePosterOverlay, generateThumbnail, PosterTextInput, PosterConfig } from '../services/posterOverlay.js';
import { getPosterConcept, POSTER_CONCEPTS } from '../data/posterPrompts.js';
import { uploadToR2, getR2PublicUrl } from '../utils/r2.js';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const POSTER_PRICES = { PHOTO: 3000, AI: 5000 } as const;

router.get('/concepts', (_req: Request, res: Response) => {
  const grouped = {
    spring: POSTER_CONCEPTS.filter((c) => c.season === 'spring').map((c) => ({ id: c.id, label: c.label, sub: c.sub })),
    summer: POSTER_CONCEPTS.filter((c) => c.season === 'summer').map((c) => ({ id: c.id, label: c.label, sub: c.sub })),
    autumn: POSTER_CONCEPTS.filter((c) => c.season === 'autumn').map((c) => ({ id: c.id, label: c.label, sub: c.sub })),
    winter: POSTER_CONCEPTS.filter((c) => c.season === 'winter').map((c) => ({ id: c.id, label: c.label, sub: c.sub })),
  };
  res.json(grouped);
});

router.get('/fonts', (_req: Request, res: Response) => {
  res.json([
    { id: 'script_elegant', label: 'Elegant Script', preview: 'Aa' },
    { id: 'serif_classic', label: 'Classic Serif', preview: 'Aa' },
    { id: 'sans_modern', label: 'Modern Sans', preview: 'Aa' },
    { id: 'calligraphy_kr', label: '캘리그라피', preview: '가' },
  ]);
});

router.get('/layouts', (_req: Request, res: Response) => {
  res.json([
    { id: 'CLASSIC', label: 'Classic', desc: '상단 이름 · 중앙 타이틀 · 하단 정보' },
    { id: 'MODERN', label: 'Modern', desc: '좌측 정렬 미니멀' },
    { id: 'BOLD', label: 'Bold', desc: '대형 타이틀 중앙' },
    { id: 'MINIMAL', label: 'Minimal', desc: '하단 한 줄 집약' },
  ]);
});

router.post('/order', async (req: Request, res: Response) => {
  try {
    const {
      track,
      groomNameKr, groomNameEn,
      brideNameKr, brideNameEn,
      titleText, tagline, dateText, venueText,
      fontId, layout, conceptId,
      customerEmail, customerPhone,
      couponCode,
    } = req.body;

    if (!track || !['PHOTO', 'AI'].includes(track)) {
      return res.status(400).json({ error: 'Invalid track' });
    }
    if (track === 'AI' && !conceptId) {
      return res.status(400).json({ error: 'AI track requires conceptId' });
    }

    const orderId = `poster_${Date.now().toString(36) + Math.random().toString(36).slice(2, 10).replace(/-/g, '').slice(0, 16)}`;
    let amount: number = POSTER_PRICES[track as keyof typeof POSTER_PRICES];
    let validCoupon: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (coupon && coupon.isActive && (!coupon.expiresAt || new Date() < coupon.expiresAt) && (!coupon.maxUses || coupon.usedCount < coupon.maxUses) && (coupon.category === 'ALL' || coupon.category === 'POSTER')) {
        if (coupon.discountType === 'PERCENT') {
          amount = Math.round(amount * (1 - coupon.discountValue / 100));
        } else {
          amount = Math.max(0, amount - coupon.discountValue);
        }
        validCoupon = coupon.code;
        await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      }
    }

    const { giftCode, isAdmin } = req.body;
    if (giftCode) {
      const gift = await prisma.posterGift.findUnique({ where: { code: giftCode } });
      if (gift && !gift.isRedeemed && new Date() < gift.expiresAt) {
        amount = 0;
        await prisma.posterGift.update({ where: { id: gift.id }, data: { isRedeemed: true, redeemedAt: new Date() } });
      }
    }
    if (isAdmin === true) {
      amount = 0;
    }

    const order = await prisma.posterOrder.create({
      data: {
        orderId,
        track,
        amount,
        groomNameKr, groomNameEn,
        brideNameKr, brideNameEn,
        titleText, tagline, dateText, venueText,
        fontId: fontId || 'script_elegant',
        layout: layout || 'CLASSIC',
        conceptId,
        customerEmail, customerPhone,
        couponCode,
      },
    });

    if (validCoupon) { await prisma.coupon.update({ where: { code: validCoupon }, data: {} }).catch(() => {}); }
    res.json({ orderId: order.orderId, amount: order.amount, id: order.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const order = await prisma.posterOrder.findUnique({ where: { orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.track !== 'PHOTO') return res.status(400).json({ error: 'Upload only for PHOTO track' });

    const key = `posters/${order.id}/source.jpg`;
    await uploadToR2(req.file.buffer, key, 'image/jpeg');
    const url = getR2PublicUrl(key);

    await prisma.posterOrder.update({
      where: { orderId },
      data: { sourceImageUrl: url },
    });

    res.json({ success: true, url });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});


router.post('/upload-faces', upload.array('faces', 4), async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) return res.status(400).json({ error: 'No files' });
    const order = await prisma.posterOrder.findUnique({ where: { orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const urls: string[] = [];
    for (let i = 0; i < req.files.length; i++) {
      const key = `posters/${order.id}/face_${i}.jpg`;
      await uploadToR2(req.files[i].buffer, key, 'image/jpeg');
      urls.push(getR2PublicUrl(key));
    }
    await prisma.posterOrder.update({ where: { orderId }, data: { faceImageUrls: urls } });
    res.json({ success: true, urls });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/download/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await prisma.posterOrder.findUnique({ where: { orderId: req.params.orderId } });
    if (!order || !order.finalPosterUrl) return res.status(404).json({ error: 'Not found' });
    res.json({ url: order.finalPosterUrl });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});


router.post('/confirm', async (req: Request, res: Response) => {
  try {
    const { paymentKey, orderId, amount } = req.body;
    if (!paymentKey || !orderId || amount === undefined || amount === null) return res.status(400).json({ error: 'Missing params' });

    const order = await prisma.posterOrder.findUnique({ where: { orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'PENDING') return res.json({ success: true, order });

    if (paymentKey === 'FREE' && Number(amount) === 0) {
      const updated = await prisma.posterOrder.update({
        where: { orderId },
        data: { status: 'PAID' as const, paymentKey: 'FREE' },
      });
      return res.json({ success: true, order: updated });
    }

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64'),
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });

    if (!tossRes.ok) {
      const err = await tossRes.json();
      return res.status(400).json({ error: err.message || 'Payment failed' });
    }

    const updated = await prisma.posterOrder.update({
      where: { orderId },
      data: { status: 'PAID' as const, paymentKey },
    });

    res.json({ success: true, order: updated });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId required' });

    const order = await prisma.posterOrder.findUnique({ where: { orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'PAID') return res.status(400).json({ error: 'Not paid' });

    await prisma.posterOrder.update({ where: { orderId }, data: { status: 'GENERATING' as const } });

    (async () => {
      try {
        const { generatePosterOverlay, generateThumbnail } = await import('../services/posterOverlay.js');
        const { uploadToR2 } = await import('../utils/r2.js');
        const { getR2PublicUrl } = await import('../utils/r2.js');

        let baseImageBuffer: Buffer;

        if (order.track === 'PHOTO' && order.sourceImageUrl) {
          const imgRes = await fetch(order.sourceImageUrl);
          baseImageBuffer = Buffer.from(await imgRes.arrayBuffer());
        } else if (order.track === 'AI' && order.conceptId) {
          const { getPosterConcept } = await import('../data/posterPrompts.js');
          const concept = getPosterConcept(order.conceptId);
          if (!concept) throw new Error('Concept not found');
          await prisma.posterOrder.update({ where: { orderId }, data: { status: 'GENERATING' as const } });
          const faceUrls = order.faceImageUrls || [];
          if (faceUrls.length === 0) throw new Error('No face images uploaded');
          const falRes = await fetch('https://queue.fal.run/fal-ai/nano-banana-2/edit', {
            method: 'POST',
            headers: { Authorization: 'Key ' + process.env.FAL_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: concept.posterPrompt, image_url: faceUrls[0], aspect_ratio: '3:4' }),
          });
          if (!falRes.ok) throw new Error('fal.ai queue submit failed');
          const falQueue = await falRes.json();
          const reqId = falQueue.request_id;
          let aiUrl = '';
          for (let poll = 0; poll < 60; poll++) {
            await new Promise(r => setTimeout(r, 3000));
            const sRes = await fetch('https://queue.fal.run/fal-ai/nano-banana-2/edit/requests/' + reqId + '/status', { headers: { Authorization: 'Key ' + process.env.FAL_KEY } });
            const sData = await sRes.json();
            if (sData.status === 'COMPLETED') {
              const rRes = await fetch('https://queue.fal.run/fal-ai/nano-banana-2/edit/requests/' + reqId, { headers: { Authorization: 'Key ' + process.env.FAL_KEY } });
              const rData = await rRes.json();
              aiUrl = rData.images?.[0]?.url || '';
              break;
            }
            if (sData.status === 'FAILED') throw new Error('fal.ai generation failed');
          }
          if (!aiUrl) throw new Error('fal.ai generation timeout');
          const aiImgRes = await fetch(aiUrl);
          baseImageBuffer = Buffer.from(await aiImgRes.arrayBuffer());
          const aiKey = 'posters/' + order.id + '/ai_generated.jpg';
          await uploadToR2(baseImageBuffer, aiKey, 'image/jpeg');
          await prisma.posterOrder.update({ where: { orderId }, data: { aiGeneratedUrl: getR2PublicUrl(aiKey) } });
        } else {
          throw new Error('No source image');
        }

        const textInput = {
          groomName: order.groomNameEn || order.groomNameKr || '',
          brideName: order.brideNameEn || order.brideNameKr || '',
          titleText: order.titleText || undefined,
          tagline: order.tagline || undefined,
          dateText: order.dateText || undefined,
          venueText: order.venueText || undefined,
          nameLanguage: (order.groomNameEn ? 'en' : 'kr') as 'en' | 'kr',
        };

        const posterConfig = { fontId: order.fontId, layout: order.layout };
        const posterBuffer = await generatePosterOverlay(baseImageBuffer, textInput, posterConfig);
        const thumbBuffer = await generateThumbnail(posterBuffer);

        const posterKey = 'posters/' + order.id + '/final.jpg';
        const thumbKey = 'posters/' + order.id + '/thumb.jpg';
        await uploadToR2(posterBuffer, posterKey, 'image/jpeg');
        await uploadToR2(thumbBuffer, thumbKey, 'image/jpeg');

        await prisma.posterOrder.update({
          where: { orderId },
          data: { status: 'DONE' as const, finalPosterUrl: getR2PublicUrl(posterKey), thumbnailUrl: getR2PublicUrl(thumbKey) },
        });
      } catch (e: any) {
        await prisma.posterOrder.update({ where: { orderId }, data: { status: 'FAILED' as const } });
        console.error('[poster generate]', e.message);
      }
    })();

    res.json({ success: true, status: 'GENERATING' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/status/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await prisma.posterOrder.findUnique({ where: { orderId: req.params.orderId } });
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json({ status: order.status, posterUrl: order.finalPosterUrl, thumbnailUrl: order.thumbnailUrl });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
