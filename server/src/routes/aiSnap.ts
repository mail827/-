import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { uploadFromUrl, getWatermarkedUrl } from '../utils/cloudinary.js';

const router = Router();
const prisma = new PrismaClient();

const FAL_API_KEY = process.env.FAL_API_KEY;
const FAL_QUEUE = 'https://queue.fal.run';

const CONCEPTS = [
  { id: 'studio_classic', label: '스튜디오 클래식' },
  { id: 'outdoor_garden', label: '야외 가든' },
  { id: 'beach_sunset', label: '해변 선셋' },
  { id: 'hanbok_traditional', label: '한복 전통' },
  { id: 'city_night', label: '시티 나이트' },
  { id: 'cherry_blossom', label: '벚꽃' },
  { id: 'forest_wedding', label: '숲속 웨딩' },
  { id: 'castle_garden', label: '캐슬 가든' },
  { id: 'cathedral', label: '성당 웨딩' },
  { id: 'watercolor', label: '수채화' },
];

const PACKAGE_QUOTA: Record<string, number> = {
  lite: 1,
  basic: 3,
  'ai-reception': 10,
  'basic-video': 3,
};
const FREE_TRIAL = 1;
const EXTRA_PRICE = 1500;

const SOLO_PROMPTS: Record<string, { groom: string; bride: string }> = {
  studio_classic: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in a professional wedding studio, wearing elegant black tuxedo with white shirt and black bow tie, soft warm studio lighting, ivory fabric backdrop, confident gentle gaze, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in a beautiful bridal studio, wearing elegant white lace wedding gown, holding white rose bouquet, soft warm studio lighting, ivory fabric backdrop, gentle smile, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  },
  outdoor_garden: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in an outdoor garden wedding setting, wearing navy blue suit with boutonniere, lush botanical garden background with blooming flowers, golden hour sunlight filtering through trees, natural romantic atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in an outdoor garden bridal setting, wearing flowing white wedding dress, surrounded by blooming roses and wisteria, golden hour sunlight, holding wildflower bouquet, ethereal natural beauty, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  },
  beach_sunset: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in a beach wedding setting at golden sunset, wearing light linen suit, warm orange pink sky, pristine white sand beach, gentle sea breeze, relaxed confident pose, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in a beach bridal setting at golden sunset, wearing flowing white dress, warm orange pink sky reflecting on ocean, barefoot on white sand, windswept hair, romantic atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  },
  hanbok_traditional: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in a traditional Korean wedding setting, wearing navy blue dopo hanbok with gat hat, Korean palace courtyard with wooden pillars and dancheong, dignified pose, soft natural daylight, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in a traditional Korean bridal setting, wearing red and green wonsam hanbok with jokduri headpiece, Korean palace courtyard, graceful elegant pose, soft natural daylight, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  },
  city_night: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in a glamorous city night setting, wearing sleek black tuxedo, dazzling city skyline bokeh lights behind, rooftop setting, dramatic rim lighting, sophisticated urban luxury, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in a glamorous city night bridal setting, wearing sparkling white evening gown, dazzling city skyline bokeh lights, rooftop setting, dramatic rim lighting, elegant and sophisticated, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  },
  cherry_blossom: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in a cherry blossom wedding setting, wearing gray suit with pink boutonniere, surrounded by pink sakura petals falling, spring sunlight filtering through blossom canopy, dreamy pastel atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in a cherry blossom bridal setting, wearing soft white dress, surrounded by clouds of pink sakura petals, spring sunlight, ethereal pastel pink atmosphere, romantic and magical, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  },
  forest_wedding: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in an enchanted forest wedding setting, wearing elegant dark suit with emerald green tie, deep green forest with sunlight streaming through tall trees, flower arch with white roses and ivy, golden light rays and floating dust particles, magical but realistic atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in an enchanted forest bridal setting, wearing ethereal white gown with delicate lace, deep green forest with sunlight streaming through trees, surrounded by white roses and ivy arch, golden light rays and floating particles, magical woodland fairy atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  },
  castle_garden: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in a fairytale castle wedding setting, wearing classic black formal suit with bow tie, magnificent European stone castle with towers in background, grand garden with fountain and hedge maze, warm golden hour lighting, dreamy cinematic atmosphere like a movie scene, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in a fairytale castle bridal setting, wearing magnificent white ball gown with long train, European stone castle with towers in background, grand garden with fountain, warm golden hour lighting, princess-like dreamy cinematic atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  },
  cathedral: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in an elegant European cathedral wedding setting, wearing refined charcoal morning suit with vest and patterned tie, gothic stone cathedral with stained glass windows and candlelight, classic white flower arrangement, old world romantic elegance, soft warm lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in an elegant European cathedral bridal setting, wearing classic white cathedral-length wedding gown with veil, gothic stone cathedral with stained glass windows and candlelight, white flower arrangement, old world romantic elegance, soft warm lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  },
  watercolor: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in an artistic watercolor style setting, wearing cream colored suit, dreamy soft pastel color palette, impressionistic floral background, gentle ethereal light, fine art wedding photography aesthetic, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same person in an artistic watercolor style bridal setting, wearing delicate white dress, dreamy pastel watercolor background, impressionistic flowers, gentle ethereal light, fine art photography, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  },
};

const COUPLE_PROMPTS: Record<string, string> = {
  studio_classic: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a professional wedding studio, the man wearing black tuxedo with bow tie on the left, the woman wearing elegant white lace wedding gown holding bouquet on the right, couple looking at each other lovingly, soft warm studio lighting, ivory fabric backdrop, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  outdoor_garden: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in an outdoor garden wedding setting, the man in navy suit on the left, the woman in flowing white dress on the right, walking hand in hand through flower archway, golden hour sunlight, lush botanical garden, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  beach_sunset: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a beach wedding setting at golden sunset, the man in light linen suit on the left, the woman in flowing white dress on the right, walking barefoot on white sand, warm orange pink sky, romantic, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  hanbok_traditional: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a traditional Korean wedding setting, the man in navy dopo hanbok on the left, the woman in red green wonsam hanbok on the right, Korean palace courtyard, dignified graceful pose, soft daylight, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  city_night: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a glamorous city night wedding setting, the man in black tuxedo on the left, the woman in sparkling white gown on the right, city skyline bokeh lights, rooftop setting, dramatic lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  cherry_blossom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a cherry blossom wedding setting, the man in gray suit on the left, the woman in white dress on the right, couple looking at each other with gentle smiles, pink sakura petals falling around them, spring sunlight, dreamy pastel atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  forest_wedding: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in an enchanted forest wedding setting, the man in dark suit on the left, the woman in ethereal white gown on the right, deep green forest with golden sunlight streaming through trees, white rose and ivy flower arch, floating light particles, magical romantic atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  castle_garden: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a fairytale castle wedding setting, the man in black formal suit on the left, the woman in magnificent white ball gown on the right, European stone castle with towers in background, grand garden with fountain, warm golden hour cinematic lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  cathedral: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a European cathedral wedding setting, the man in charcoal morning suit on the left, the woman in classic white cathedral gown with veil on the right, couple looking at each other lovingly, gothic stone cathedral with stained glass and candlelight, white flowers, old world romantic elegance, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
  watercolor: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a watercolor style wedding setting, the man in cream suit on the left, the woman in white dress on the right, soft pastel watercolor background, impressionistic flowers, ethereal light, fine art, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k',
};

const falFetch = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${FAL_API_KEY}`,
      ...opts?.headers,
    },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`fal.ai error (${res.status}): ${text.slice(0, 300)}`);
  }
};

const waitForResult = async (statusUrl: string, responseUrl: string, maxWait = 180): Promise<any> => {
  const start = Date.now();
  while (Date.now() - start < maxWait * 1000) {
    await new Promise(r => setTimeout(r, 3000));
    const status = await falFetch(statusUrl);
    if (status.status === 'COMPLETED') return falFetch(responseUrl);
    if (status.status === 'FAILED') throw new Error(status.error || 'Generation failed');
  }
  throw new Error('Timeout');
};

const getQuota = async (weddingId: string, requestUserRole?: string) => {
  const wedding = await prisma.wedding.findUnique({
    where: { id: weddingId },
    include: {
      order: { include: { package: true } },
      user: true,
    },
  });
  if (!wedding) return { max: 0, used: 0, remaining: 0, isAdmin: false, packageSlug: null };

  const isAdmin = wedding.user?.role === 'ADMIN';
  if (isAdmin) {
    const used = await prisma.aiSnap.count({ where: { weddingId, status: { in: ['done', 'generating', 'processing'] } } });
    return { max: 999, used, remaining: 999, isAdmin: true, packageSlug: 'admin' };
  }

  const slug = wedding.order?.package?.slug;
  const packageMax = slug ? (PACKAGE_QUOTA[slug] ?? FREE_TRIAL) : FREE_TRIAL;
  const used = await prisma.aiSnap.count({ where: { weddingId, status: { in: ['done', 'generating', 'processing'] } } });
  const remaining = Math.max(0, packageMax - used);

  return { max: packageMax, used, remaining, isAdmin: false, packageSlug: slug || 'free', extraPrice: EXTRA_PRICE };
};

const generate = async (snapId: string, concept: string, imageUrls: string[], mode: string) => {
  try {
    await prisma.aiSnap.update({ where: { id: snapId }, data: { status: 'generating' } });

    let prompt = '';
    if (mode === 'couple') {
      prompt = COUPLE_PROMPTS[concept] || COUPLE_PROMPTS.studio_classic;
    } else if (mode === 'groom') {
      prompt = SOLO_PROMPTS[concept]?.groom || SOLO_PROMPTS.studio_classic.groom;
    } else {
      prompt = SOLO_PROMPTS[concept]?.bride || SOLO_PROMPTS.studio_classic.bride;
    }

    const submit = await falFetch(`${FAL_QUEUE}/fal-ai/nano-banana-pro/edit`, {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        image_urls: imageUrls,
        strength: 0.45,
        num_images: 1,
      }),
    });

    if (submit.images) {
      const resultUrl = submit.images[0]?.url;
      await prisma.aiSnap.update({
        where: { id: snapId },
        data: { status: resultUrl ? 'done' : 'failed', resultUrl, prompt },
      });
      return;
    }

    if (!submit.status_url) throw new Error('No status_url');

    const result = await waitForResult(submit.status_url, submit.response_url);
    const resultUrl = result.images?.[0]?.url;
    if (!resultUrl) throw new Error('No result image');

    await prisma.aiSnap.update({
      where: { id: snapId },
      data: { status: 'done', resultUrl, prompt },
    });
  } catch (err: any) {
    await prisma.aiSnap.update({
      where: { id: snapId },
      data: { status: 'failed', errorMsg: err.message?.slice(0, 500) },
    });
  }
};

router.post('/free/generate', authMiddleware, async (req: AuthRequest, res) => {
  const userId = (req as AuthRequest).user?.id;
  if (!userId) return res.status(401).json({ error: '로그인이 필요합니다' });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
  if (user.freeSnapUsed && user.role !== 'ADMIN') {
    return res.status(403).json({ error: '무료 체험은 1장만 가능해요', used: true });
  }

  const { concept, imageUrls, mode } = req.body;
  if (!concept || !imageUrls || imageUrls.length < 1) return res.status(400).json({ error: 'concept, imageUrls required' });

  try {
    let prompt = '';
    if (mode === 'couple') {
      prompt = COUPLE_PROMPTS[concept] || COUPLE_PROMPTS.studio_classic;
    } else if (mode === 'groom') {
      prompt = SOLO_PROMPTS[concept]?.groom || SOLO_PROMPTS.studio_classic.groom;
    } else {
      prompt = SOLO_PROMPTS[concept]?.bride || SOLO_PROMPTS.studio_classic.bride;
    }

    await prisma.user.update({ where: { id: userId }, data: { freeSnapUsed: true } });

    const submit = await falFetch(`${FAL_QUEUE}/fal-ai/nano-banana-pro/edit`, {
      method: 'POST',
      body: JSON.stringify({ prompt, image_urls: imageUrls }),
    });

    if (submit.images) {
      const uploaded = await uploadFromUrl(submit.images[0]?.url, 'ai-snap/free');
      const watermarked = getWatermarkedUrl(uploaded.publicId);
      await prisma.aiSnap.create({
        data: {
          userId, concept, engine: 'nano-banana-pro', prompt,
          inputUrls: imageUrls, resultUrl: watermarked,
          resultOriginalUrl: uploaded.url, status: 'done', isFree: true,
        },
      });
      return res.json({ status: 'done', resultUrl: watermarked });
    }
    if (!submit.status_url) throw new Error('No status_url');
    const snap = await prisma.aiSnap.create({
      data: {
        userId, concept, engine: 'nano-banana-pro', prompt,
        inputUrls: imageUrls, status: 'processing', isFree: true,
      },
    });
    res.json({ status: 'generating', snapId: snap.id, statusUrl: submit.status_url, responseUrl: submit.response_url });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/free/my-snaps', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: '로그인 필요' });

  const hasPaidPack = await prisma.snapPack.findFirst({ where: { userId, status: 'PAID' } });

  const snaps = await prisma.aiSnap.findMany({
    where: { userId, isFree: true },
    orderBy: { createdAt: 'desc' },
  });

  const result = snaps.map(s => ({
    ...s,
    resultUrl: hasPaidPack && s.resultOriginalUrl ? s.resultOriginalUrl : s.resultUrl,
    unlocked: !!(hasPaidPack && s.resultOriginalUrl),
  }));

  res.json(result);
});

router.get('/free/check', authMiddleware, async (req: AuthRequest, res) => {
  const userId = (req as AuthRequest).user?.id;
  if (!userId) return res.status(401).json({ error: '로그인 필요' });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  res.json({ used: user?.freeSnapUsed || false, isAdmin: user?.role === 'ADMIN' });
});

router.get('/free/poll', async (req, res) => {
  const { statusUrl, responseUrl } = req.query;
  if (!statusUrl || !responseUrl) return res.status(400).json({ error: 'statusUrl, responseUrl required' });
  try {
    const status = await falFetch(statusUrl as string);
    if (status.status === 'COMPLETED') {
      const result = await falFetch(responseUrl as string);
      const uploaded = await uploadFromUrl(result.images?.[0]?.url, 'ai-snap/free');
      const watermarked = getWatermarkedUrl(uploaded.publicId);
      const snapId = req.query.snapId as string;
      if (snapId) {
        await prisma.aiSnap.update({
          where: { id: snapId },
          data: { resultUrl: watermarked, resultOriginalUrl: uploaded.url, status: 'done' },
        });
      }
      return res.json({ status: 'done', resultUrl: watermarked });
    }
    if (status.status === 'FAILED') return res.json({ status: 'failed', error: status.error });
    res.json({ status: 'generating' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/concepts', (_req, res) => {
  res.json(CONCEPTS);
});

router.get('/quota/:weddingId', authMiddleware, async (req, res) => {
  try {
    const quota = await getQuota(req.params.weddingId, (req as any).user?.role);
    res.json(quota);
  } catch (e) {
    res.status(500).json({ error: 'Quota check failed' });
  }
});

router.get('/list/:weddingId', authMiddleware, async (req, res) => {
  try {
    const snaps = await prisma.aiSnap.findMany({
      where: { weddingId: req.params.weddingId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(snaps);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list snaps' });
  }
});

router.get('/status/:id', authMiddleware, async (req, res) => {
  try {
    const snap = await prisma.aiSnap.findUnique({ where: { id: req.params.id } });
    if (!snap) return res.status(404).json({ error: 'Not found' });
    res.json(snap);
  } catch (e) {
    res.status(500).json({ error: 'Status check failed' });
  }
});

router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
  const { weddingId, concept, imageUrls, mode } = req.body;
  if (!weddingId || !concept || !imageUrls || imageUrls.length < 1) {
    return res.status(400).json({ error: 'weddingId, concept, imageUrls required' });
  }

  try {
    const quota = await getQuota(weddingId, (req as AuthRequest).user?.role);
    if (!quota.isAdmin && quota.remaining <= 0) {
      return res.status(403).json({
        error: '생성 가능 횟수를 모두 사용했어요',
        quota,
      });
    }

    const snap = await prisma.aiSnap.create({
      data: {
        weddingId, concept, engine: 'nano-banana-pro',
        prompt: '', inputUrls: imageUrls, status: 'processing',
      },
    });

    generate(snap.id, concept, imageUrls, mode || 'couple');

    const updatedQuota = { ...quota, used: quota.used + 1, remaining: quota.isAdmin ? 999 : quota.remaining - 1 };
    res.json({ ...snap, quota: updatedQuota });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/quick-generate', authMiddleware, async (req: AuthRequest, res) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: '관리자만 가능' });
  const { concept, imageUrls, mode } = req.body;
  if (!concept || !imageUrls || imageUrls.length < 1) return res.status(400).json({ error: 'concept, imageUrls required' });
  try {
    let prompt = '';
    if (mode === 'couple') {
      prompt = COUPLE_PROMPTS[concept] || COUPLE_PROMPTS.studio_classic;
    } else if (mode === 'groom') {
      prompt = SOLO_PROMPTS[concept]?.groom || SOLO_PROMPTS.studio_classic.groom;
    } else {
      prompt = SOLO_PROMPTS[concept]?.bride || SOLO_PROMPTS.studio_classic.bride;
    }
    const submit = await falFetch(`${FAL_QUEUE}/fal-ai/nano-banana-pro/edit`, {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        image_urls: imageUrls,
        strength: 0.45,
        num_images: 1,
      }),
    });
    if (submit.images) {
      return res.json({ status: 'done', resultUrl: submit.images[0]?.url });
    }
    if (!submit.status_url) throw new Error('No status_url');
    res.json({ statusUrl: submit.status_url, responseUrl: submit.response_url });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/admin/poll', async (req, res) => {
  const { statusUrl, responseUrl } = req.query;
  if (!statusUrl) return res.status(400).json({ error: 'statusUrl required' });
  try {
    const status = await falFetch(statusUrl as string);
    if (status.status === 'COMPLETED') {
      const result = await falFetch(responseUrl as string);
      const resultUrl = result.images?.[0]?.url;
      return res.json({ status: 'done', resultUrl });
    }
    if (status.status === 'FAILED') {
      return res.json({ status: 'failed', error: status.error });
    }
    res.json({ status: 'processing' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/admin/list', authMiddleware, async (req: AuthRequest, res) => {
  if ((req as AuthRequest).user?.role !== 'ADMIN') return res.status(403).json({ error: '관리자만 접근 가능' });
  try {
    const snaps = await prisma.aiSnap.findMany({
      include: {
        wedding: { select: { id: true, slug: true, groomName: true, brideName: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json(snaps);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list snaps' });
  }
});

router.get('/admin/stats', authMiddleware, async (req: AuthRequest, res) => {
  if ((req as AuthRequest).user?.role !== 'ADMIN') return res.status(403).json({ error: '관리자만 접근 가능' });
  try {
    const [total, done, failed, generating] = await Promise.all([
      prisma.aiSnap.count(),
      prisma.aiSnap.count({ where: { status: 'done' } }),
      prisma.aiSnap.count({ where: { status: 'failed' } }),
      prisma.aiSnap.count({ where: { status: { in: ['generating', 'processing'] } } }),
    ]);
    res.json({ total, done, failed, generating });
  } catch (e) {
    res.status(500).json({ error: 'Stats failed' });
  }
});

router.delete('/admin/:id', authMiddleware, async (req: AuthRequest, res) => {
  if ((req as AuthRequest).user?.role !== 'ADMIN') return res.status(403).json({ error: '관리자만 접근 가능' });
  try {
    await prisma.aiSnap.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.aiSnap.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;
