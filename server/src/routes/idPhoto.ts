import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { uploadFromUrl } from '../utils/cloudinary.js';
import OpenAI from 'openai';
import { sendGiftNotification } from '../utils/solapi.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const mailTransporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });

const router = Router();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FAL_API_KEY = process.env.FAL_API_KEY;
const FAL_QUEUE = 'https://queue.fal.run';

const falFetch = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${FAL_API_KEY}`, ...opts?.headers },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`fal error (${res.status}): ${text.slice(0, 300)}`); }
};

function getOutfitColor(analysis: any) {
  const pc = (analysis.personal_color || '').toLowerCase();
  if (pc.includes('spring')) return 'warm soft peach coral';
  if (pc.includes('summer')) return 'cool dusty lavender blue-gray';
  if (pc.includes('autumn')) return 'warm muted olive khaki';
  if (pc.includes('winter')) return 'deep navy black';
  const ut = (analysis.skin_undertone || '').toLowerCase();
  if (ut.includes('cool')) return 'cool soft blue-gray';
  if (ut.includes('warm')) return 'warm soft ivory beige';
  return 'soft neutral gray beige';
}

function buildPrompt(a: any) {
  const outfitColor = getOutfitColor(a);
  return `Transform this into a clean studio ID portrait. Solid light ivory-gray background with no objects. The person faces the camera directly, neutral calm expression, mouth closed, eyes looking straight at camera. Perfectly even soft diffused studio lighting on face, zero shadows. Sharp focus on face. Shoulders level and centered. Crop from upper chest, 3:4 portrait ratio. ${a.gender === 'male' ? 'He' : 'She'} has ${a.hair}. ${a.glasses ? 'Keep glasses as worn.' : ''} The face must look exactly like the input photo. Keep the exact same eye spacing, eye size, nose size, nose width, lip shape, philtrum length, jawline, and face width. Do not move eyes closer together. Do not enlarge the nose. Do not lengthen the philtrum. Keep the original skin texture with natural pores, do not smooth or airbrush the skin. The person wears a simple plain ${outfitColor} round-neck top, no patterns no logos no text. Matte natural skin, no shine no glow no oily look. High resolution, realistic studio portrait.`;
}

async function analyzeFace(imageUrl: string) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
        { type: "text", text: "You are a portrait photography assistant. Describe this person for a studio portrait session. Determine their seasonal color type based on skin undertone and hair color. Return ONLY valid JSON, no markdown:\n{\"gender\":\"male or female\",\"age_range\":\"20s/30s/etc\",\"skin_tone\":\"description\",\"skin_undertone\":\"warm or cool\",\"personal_color\":\"spring_warm or summer_cool or autumn_warm or winter_cool\",\"hair\":\"color and style description\",\"glasses\":true/false,\"expression\":\"current expression\",\"quality\":\"good/fair/poor\",\"issues\":[]}" }
      ]
    }],
    max_tokens: 400
  });
  const raw = res.choices[0]?.message?.content || '{}';
  try { return JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); } catch { return { gender: "unknown", age_range: "unknown", skin_tone: "unknown", hair: "unknown", glasses: false, expression: "unknown", quality: "fair", issues: [] }; }
}

async function queueGenerate(imageUrl: string, prompt: string) {
  return falFetch(`${FAL_QUEUE}/fal-ai/nano-banana-2/edit`, {
    method: 'POST',
    body: JSON.stringify({ image_urls: [imageUrl], prompt, aspect_ratio: '3:4', output_format: 'png' })
  });
}

router.post('/upload', authMiddleware, async (req: any, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: '이미지가 필요합니다' });

    const analysis = await analyzeFace(imageUrl);

    if (analysis.quality === 'poor') {
      return res.json({ success: false, analysis, message: '사진 품질이 낮습니다. 얼굴이 선명한 정면 사진을 업로드해주세요.' });
    }
    if (analysis.issues?.length > 0) {
      return res.json({ success: false, analysis, message: analysis.issues.join(', ') });
    }

    const idPhoto = await prisma.idPhoto.create({
      data: { userId: req.user.id, originalUrl: imageUrl, faceAnalysis: analysis, status: 'ANALYZED' }
    });

    res.json({ success: true, idPhoto, analysis });
  } catch (e: any) {
    console.error('IdPhoto upload:', e);
    res.status(500).json({ error: '사진 분석 실패' });
  }
});

router.get('/toss-client-key', (_req, res) => {
  res.json({ clientKey: process.env.TOSS_CLIENT_KEY });
});

router.post('/payment/request', authMiddleware, async (req: any, res) => {
  try {
    const { idPhotoId } = req.body;
    const idPhoto = await prisma.idPhoto.findFirst({ where: { id: idPhotoId, userId: req.user.id } });
    if (!idPhoto) return res.status(404).json({ error: '사진을 찾을 수 없습니다' });

    const orderId = `IDPHOTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await prisma.idPhoto.update({ where: { id: idPhotoId }, data: { orderId } });

    res.json({ clientKey: process.env.TOSS_CLIENT_KEY, orderId, amount: 1000, orderName: 'AI ID 포트레이트' });
  } catch (e: any) {
    console.error('IdPhoto payment request:', e);
    res.status(500).json({ error: '결제 요청 실패' });
  }
});

router.post('/payment/confirm', authMiddleware, async (req: any, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;
    if (amount !== 1000) return res.status(400).json({ error: '금액 불일치' });

    const idPhoto = await prisma.idPhoto.findFirst({ where: { orderId, userId: req.user.id } });
    if (!idPhoto) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });

    const basicAuth = Buffer.from(`${process.env.TOSS_SECRET_KEY!}:`).toString('base64');
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount })
    });

    if (!tossRes.ok) {
      const err = await tossRes.json();
      return res.status(400).json({ error: err.message || '결제 승인 실패' });
    }

    const analysis = idPhoto.faceAnalysis as any;
    const prompt = buildPrompt(analysis);
    const queue = await queueGenerate(idPhoto.originalUrl, prompt);

    await prisma.idPhoto.update({
      where: { id: idPhoto.id },
      data: { paymentKey, paidAt: new Date(), status: 'GENERATING', resultUrl: queue.request_id }
    });

    res.json({ success: true, idPhotoId: idPhoto.id, requestId: queue.request_id });
  } catch (e: any) {
    console.error('IdPhoto payment confirm:', e);
    res.status(500).json({ error: '결제 확인 실패' });
  }
});

router.post('/regenerate', authMiddleware, async (req: any, res) => {
  try {
    const { idPhotoId } = req.body;
    const original = await prisma.idPhoto.findFirst({ where: { id: idPhotoId, userId: req.user.id } });
    if (!original) return res.status(404).json({ error: '원본을 찾을 수 없습니다' });

    const newPhoto = await prisma.idPhoto.create({
      data: {
        userId: req.user.id,
        originalUrl: original.originalUrl,
        faceAnalysis: original.faceAnalysis || undefined,
        status: 'ANALYZED'
      }
    });

    const orderId = `IDPHOTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await prisma.idPhoto.update({ where: { id: newPhoto.id }, data: { orderId } });

    res.json({ clientKey: process.env.TOSS_CLIENT_KEY, orderId, amount: 1000, orderName: 'AI ID 포트레이트 재생성', idPhotoId: newPhoto.id });
  } catch (e: any) {
    console.error('IdPhoto regenerate:', e);
    res.status(500).json({ error: '재생성 요청 실패' });
  }
});

router.get('/status/:id', authMiddleware, async (req: any, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const idPhoto = await prisma.idPhoto.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!idPhoto) return res.status(404).json({ error: '사진 없음' });

    if (idPhoto.status === 'COMPLETED') return res.json({ status: 'COMPLETED', resultUrl: idPhoto.resultUrl });
    if (idPhoto.status !== 'GENERATING') return res.json({ status: idPhoto.status });

    const requestId = idPhoto.resultUrl;
    console.log('[idphoto-poll]', idPhoto.id, 'requestId:', requestId);
    const sRes = await fetch(`${FAL_QUEUE}/fal-ai/nano-banana-2/requests/${requestId}/status`, { headers: { Authorization: `Key ${FAL_API_KEY}` } }); const sText = await sRes.text();
    console.log('[idphoto-poll]', idPhoto.id, 'fal response:', sRes.status, sText.slice(0, 200)); if (!sText) return res.json({ status: 'GENERATING', position: 0 }); const sData = JSON.parse(sText);

    if (sData.status === 'COMPLETED') {
      const rRes = await fetch(`${FAL_QUEUE}/fal-ai/nano-banana-2/requests/${requestId}`, { headers: { Authorization: `Key ${FAL_API_KEY}` } }); const rText = await rRes.text(); console.log('[idphoto-result]', idPhoto.id, 'status:', rRes.status, 'body:', rText.slice(0, 300)); const rData = JSON.parse(rText);
      const imgUrl = rData.images?.[0]?.url;

      if (imgUrl) {
        const uploaded = await uploadFromUrl(imgUrl, `id-photo/${idPhoto.id}`);
        await prisma.idPhoto.update({
          where: { id: idPhoto.id },
          data: { status: 'COMPLETED', resultUrl: uploaded.url }
        });
        return res.json({ status: 'COMPLETED', resultUrl: uploaded.url });
      }
    }

    if (sData.status === 'FAILED') {
      await prisma.idPhoto.update({ where: { id: idPhoto.id }, data: { status: 'FAILED' } });
      return res.json({ status: 'FAILED' });
    }

    res.json({ status: 'GENERATING', position: sData.queue_position });
  } catch (e: any) {
    console.error('IdPhoto status:', e);
    res.status(500).json({ error: '상태 확인 실패' });
  }
});

router.get('/my', authMiddleware, async (req: any, res) => {
  try {
    const photos = await prisma.idPhoto.findMany({
      where: { userId: req.user.id, paidAt: { not: null } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ photos });
  } catch (e: any) {
    res.status(500).json({ error: '조회 실패' });
  }
});

router.get('/face-analysis/:userId', authMiddleware, async (req: any, res) => {
  try {
    const latest = await prisma.idPhoto.findFirst({
      where: { userId: req.params.userId, faceAnalysis: { not: 'null' } },
      orderBy: { createdAt: 'desc' },
      select: { faceAnalysis: true, originalUrl: true }
    });
    if (!latest) return res.json({ found: false });
    res.json({ found: true, faceAnalysis: latest.faceAnalysis, originalUrl: latest.originalUrl });
  } catch (e: any) {
    res.status(500).json({ error: '조회 실패' });
  }
});


router.post('/gift/create', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: '권한 없음' });
    const { toEmail, toPhone, message } = req.body;

    const code = 'IDPH-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const gift = await prisma.idPhotoGift.create({
      data: { code, fromUserId: req.user.id, toEmail, toPhone, message, expiresAt }
    });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const senderName = user?.name || '청첩장 작업실';

    if (toEmail) {
      await mailTransporter.sendMail({
        from: '"청첩장 작업실" <' + process.env.GMAIL_USER + '>',
        to: toEmail,
        subject: senderName + '님이 AI 포트레이트 이용권을 선물했어요',
        html: '<div style="max-width:480px;margin:0 auto;font-family:sans-serif;color:#333"><h2 style="font-size:20px;font-weight:600">AI ID 포트레이트 이용권</h2>' + (message ? '<p style="color:#666;margin:16px 0">' + message + '</p>' : '') + '<p style="color:#666;margin:16px 0">코드: <strong>' + code + '</strong></p><a href="https://weddingshop.cloud/id-photo/redeem?code=' + code + '" style="display:inline-block;padding:14px 28px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;margin-top:16px">사용하기</a><p style="color:#aaa;font-size:12px;margin-top:24px">Made by 청첩장 작업실</p></div>'
      });
    }

    if (toPhone) {
      sendGiftNotification({
        to: toPhone, groomName: '', brideName: '', senderName,
        giftName: 'AI ID 포트레이트 이용권', message: message || '',
        link: 'https://weddingshop.cloud/id-photo/redeem?code=' + code,
      }).catch(err => console.error('ID포트레이트 선물 알림 실패:', err));
    }

    res.json({ success: true, code, gift });
  } catch (e) {
    console.error('IdPhotoGift create:', e);
    res.status(500).json({ error: '선물 생성 실패' });
  }
});

router.get('/gift/check', async (req: any, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: '코드 필요' });
    const gift = await prisma.idPhotoGift.findUnique({ where: { code: code as string } });
    if (!gift) return res.json({ valid: false, error: '유효하지 않은 코드' });
    if (gift.redeemedAt) return res.json({ valid: false, error: '이미 사용된 코드' });
    if (gift.expiresAt < new Date()) return res.json({ valid: false, error: '만료된 코드' });
    res.json({ valid: true });
  } catch (e) {
    res.status(500).json({ error: '확인 실패' });
  }
});

router.post('/gift/redeem', authMiddleware, async (req: any, res) => {
  try {
    const { code, imageUrl } = req.body;
    const gift = await prisma.idPhotoGift.findUnique({ where: { code } });
    if (!gift) return res.status(400).json({ error: '유효하지 않은 코드' });
    if (gift.redeemedAt) return res.status(400).json({ error: '이미 사용된 코드' });
    if (gift.expiresAt < new Date()) return res.status(400).json({ error: '만료된 코드' });

    const analysis = await analyzeFace(imageUrl);
    const prompt = buildPrompt(analysis);
    const queue = await queueGenerate(imageUrl, prompt);

    const idPhoto = await prisma.idPhoto.create({
      data: { userId: req.user.id, originalUrl: imageUrl, faceAnalysis: analysis, status: 'GENERATING', resultUrl: queue.request_id, paidAt: new Date(), amount: 0 }
    });

    await prisma.idPhotoGift.update({ where: { code }, data: { redeemedAt: new Date(), redeemedBy: req.user.id } });

    res.json({ success: true, idPhotoId: idPhoto.id });
  } catch (e) {
    console.error('IdPhotoGift redeem:', e);
    res.status(500).json({ error: '사용 실패' });
  }
});

router.get('/gift/list', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: '권한 없음' });
    const gifts = await prisma.idPhotoGift.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ gifts });
  } catch (e) {
    res.status(500).json({ error: '조회 실패' });
  }
});

export default router;

router.get('/admin/list', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: '권한 없음' });
    const photos = await prisma.idPhoto.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.json({ photos });
  } catch (e: any) {
    res.status(500).json({ error: '조회 실패' });
  }
});

router.post('/admin/generate', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: '권한 없음' });
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: '이미지 필요' });

    const analysis = await analyzeFace(imageUrl);
    const prompt = buildPrompt(analysis);
    const queue = await queueGenerate(imageUrl, prompt);

    const idPhoto = await prisma.idPhoto.create({
      data: {
        userId: req.user.id,
        originalUrl: imageUrl,
        faceAnalysis: analysis,
        status: 'GENERATING',
        resultUrl: queue.request_id,
        paidAt: new Date(),
        amount: 0
      }
    });

    res.json({ success: true, idPhotoId: idPhoto.id, requestId: queue.request_id, analysis });
  } catch (e: any) {
    console.error('Admin IdPhoto generate:', e);
    res.status(500).json({ error: '생성 실패' });
  }
});

router.post('/admin/gift', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: '권한 없음' });
    const { idPhotoId, toEmail, toPhone, message } = req.body;

    const idPhoto = await prisma.idPhoto.findUnique({ where: { id: idPhotoId } });
    if (!idPhoto || idPhoto.status !== 'COMPLETED') return res.status(400).json({ error: '완성된 사진만 선물 가능합니다' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const senderName = user?.name || '청첩장 작업실';
    const downloadLink = idPhoto.resultUrl || '';

    if (toEmail) {
      await mailTransporter.sendMail({
        from: '"청첩장 작업실" <' + process.env.GMAIL_USER + '>',
        to: toEmail,
        subject: senderName + '님이 AI 포트레이트를 선물했어요',
        html: '<div style="max-width:480px;margin:0 auto;font-family:sans-serif;color:#333"><h2 style="font-size:20px;font-weight:600">AI ID 포트레이트가 도착했어요</h2>' + (message ? '<p style="color:#666;margin:16px 0">' + message + '</p>' : '') + '<a href="' + downloadLink + '" style="display:inline-block;padding:14px 28px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;margin-top:16px">사진 확인하기</a><p style="color:#aaa;font-size:12px;margin-top:24px">Made by 청첩장 작업실</p></div>'
      });
    }

    if (toPhone) {
      sendGiftNotification({
        to: toPhone, groomName: '', brideName: '', senderName,
        giftName: 'AI ID 포트레이트', message: message || '',
        link: downloadLink,
      }).catch(err => console.error('ID포트레이트 선물 알림 실패:', err));
    }

    res.json({ success: true, message: '선물 발송 완료' });
  } catch (e: any) {
    console.error('IdPhoto gift error:', e);
    res.status(500).json({ error: '선물 실패' });
  }
});
