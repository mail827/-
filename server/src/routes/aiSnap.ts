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
    groom: 'transform into professional wedding studio portrait, wearing elegant black tuxedo with white shirt and black bow tie, soft warm studio lighting, ivory fabric backdrop, confident gentle gaze, photorealistic, 8k',
    bride: 'transform into beautiful bridal studio portrait, wearing elegant white lace wedding gown, holding white rose bouquet, soft warm studio lighting, ivory fabric backdrop, gentle smile, photorealistic, 8k',
  },
  outdoor_garden: {
    groom: 'transform into outdoor garden wedding portrait, wearing navy blue suit with boutonniere, lush botanical garden background with blooming flowers, golden hour sunlight filtering through trees, natural romantic atmosphere, photorealistic, 8k',
    bride: 'transform into outdoor garden bridal portrait, wearing flowing white wedding dress, surrounded by blooming roses and wisteria, golden hour sunlight, holding wildflower bouquet, ethereal natural beauty, photorealistic, 8k',
  },
  beach_sunset: {
    groom: 'transform into beach wedding portrait at golden sunset, wearing light linen suit, warm orange pink sky, pristine white sand beach, gentle sea breeze, relaxed confident pose, photorealistic, 8k',
    bride: 'transform into beach bridal portrait at golden sunset, wearing flowing white dress, warm orange pink sky reflecting on ocean, barefoot on white sand, windswept hair, romantic atmosphere, photorealistic, 8k',
  },
  hanbok_traditional: {
    groom: 'transform into traditional Korean wedding portrait, wearing navy blue dopo hanbok with gat hat, Korean palace courtyard with wooden pillars and dancheong, dignified pose, soft natural daylight, photorealistic, 8k',
    bride: 'transform into traditional Korean bridal portrait, wearing red and green wonsam hanbok with jokduri headpiece, Korean palace courtyard, graceful elegant pose, soft natural daylight, photorealistic, 8k',
  },
  city_night: {
    groom: 'transform into glamorous city night portrait, wearing sleek black tuxedo, dazzling city skyline bokeh lights behind, rooftop setting, dramatic rim lighting, sophisticated urban luxury, photorealistic, 8k',
    bride: 'transform into glamorous city night bridal portrait, wearing sparkling white evening gown, dazzling city skyline bokeh lights, rooftop setting, dramatic rim lighting, elegant and sophisticated, photorealistic, 8k',
  },
  cherry_blossom: {
    groom: 'transform into cherry blossom wedding portrait, wearing gray suit with pink boutonniere, surrounded by pink sakura petals falling, spring sunlight filtering through blossom canopy, dreamy pastel atmosphere, photorealistic, 8k',
    bride: 'transform into cherry blossom bridal portrait, wearing soft white dress, surrounded by clouds of pink sakura petals, spring sunlight, ethereal pastel pink atmosphere, romantic and magical, photorealistic, 8k',
  },
  forest_wedding: {
    groom: 'transform into enchanted forest wedding portrait, wearing elegant dark suit with emerald green tie, deep green forest with sunlight streaming through tall trees, flower arch with white roses and ivy, golden light rays and floating dust particles, magical but realistic atmosphere, photorealistic, 8k',
    bride: 'transform into enchanted forest bridal portrait, wearing ethereal white gown with delicate lace, deep green forest with sunlight streaming through trees, surrounded by white roses and ivy arch, golden light rays and floating particles, magical woodland fairy atmosphere, photorealistic, 8k',
  },
  castle_garden: {
    groom: 'transform into fairytale castle wedding portrait, wearing classic black formal suit with bow tie, magnificent European stone castle with towers in background, grand garden with fountain and hedge maze, warm golden hour lighting, dreamy cinematic atmosphere like a movie scene, photorealistic, 8k',
    bride: 'transform into fairytale castle bridal portrait, wearing magnificent white ball gown with long train, European stone castle with towers in background, grand garden with fountain, warm golden hour lighting, princess-like dreamy cinematic atmosphere, photorealistic, 8k',
  },
  cathedral: {
    groom: 'transform into elegant European cathedral wedding portrait, wearing refined charcoal morning suit with vest and patterned tie, gothic stone cathedral with stained glass windows and candlelight, classic white flower arrangement, old world romantic elegance, soft warm lighting, photorealistic, 8k',
    bride: 'transform into elegant European cathedral bridal portrait, wearing classic white cathedral-length wedding gown with veil, gothic stone cathedral with stained glass windows and candlelight, white flower arrangement, old world romantic elegance, soft warm lighting, photorealistic, 8k',
  },
  watercolor: {
    groom: 'transform into artistic watercolor style portrait, wearing cream colored suit, dreamy soft pastel color palette, impressionistic floral background, gentle ethereal light, fine art wedding photography aesthetic, photorealistic, 8k',
    bride: 'transform into artistic watercolor style bridal portrait, wearing delicate white dress, dreamy pastel watercolor background, impressionistic flowers, gentle ethereal light, fine art photography, photorealistic, 8k',
  },
};

const COUPLE_PROMPTS: Record<string, string> = {
  studio_classic: 'transform into professional wedding studio photograph, the man wearing black tuxedo with bow tie on the left, the woman wearing elegant white lace wedding gown holding bouquet on the right, couple looking at each other lovingly, natural facial proportions, refined delicate nose bridge, soft warm studio lighting, ivory fabric backdrop, photorealistic, 8k',
  outdoor_garden: 'transform into outdoor garden wedding photograph, the man in navy suit on the left, the woman in flowing white dress on the right, walking hand in hand through flower archway, natural facial proportions, refined delicate nose bridge, golden hour sunlight, lush botanical garden, photorealistic, 8k',
  beach_sunset: 'transform into beach wedding photograph at golden sunset, the man in light linen suit on the left, the woman in flowing white dress on the right, walking barefoot on white sand, natural facial proportions, refined delicate nose bridge, warm orange pink sky, romantic, photorealistic, 8k',
  hanbok_traditional: 'transform into traditional Korean wedding portrait, the man in navy dopo hanbok on the left, the woman in red green wonsam hanbok on the right, Korean palace courtyard, natural facial proportions, refined delicate nose bridge, dignified graceful pose, soft daylight, photorealistic, 8k',
  city_night: 'transform into glamorous city night wedding photograph, the man in black tuxedo on the left, the woman in sparkling white gown on the right, city skyline bokeh lights, rooftop setting, natural facial proportions, refined delicate nose bridge, dramatic lighting, photorealistic, 8k',
  cherry_blossom: 'transform into cherry blossom wedding photograph, the man in gray suit on the left, the woman in white dress on the right, couple looking at each other with gentle smiles, natural facial proportions, refined delicate nose bridge, pink sakura petals falling around them, spring sunlight, dreamy pastel atmosphere, photorealistic, 8k',
  forest_wedding: 'transform into enchanted forest wedding photograph, the man in dark suit on the left, the woman in ethereal white gown on the right, deep green forest with golden sunlight streaming through trees, white rose and ivy flower arch, natural facial proportions, refined delicate nose bridge, floating light particles, magical romantic atmosphere, photorealistic, 8k',
  castle_garden: 'transform into fairytale castle wedding photograph, the man in black formal suit on the left, the woman in magnificent white ball gown on the right, European stone castle with towers in background, grand garden with fountain, natural facial proportions, refined delicate nose bridge, warm golden hour cinematic lighting, photorealistic, 8k',
  cathedral: 'transform into European cathedral wedding photograph, the man in charcoal morning suit on the left, the woman in classic white cathedral gown with veil on the right, couple looking at each other lovingly, natural facial proportions, refined delicate nose bridge, gothic stone cathedral with stained glass and candlelight, white flowers, old world romantic elegance, photorealistic, 8k',
  watercolor: 'transform into watercolor style wedding portrait, the man in cream suit on the left, the woman in white dress on the right, natural facial proportions, refined delicate nose bridge, soft pastel watercolor background, impressionistic flowers, ethereal light, fine art, photorealistic, 8k',
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
      body: JSON.stringify({ prompt, image_urls: imageUrls }),
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
      return res.json({ status: 'done', resultUrl: watermarked, originalPublicId: uploaded.publicId });
    }
    if (!submit.status_url) throw new Error('No status_url');
    res.json({ status: 'generating', statusUrl: submit.status_url, responseUrl: submit.response_url });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
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
      return res.json({ status: 'done', resultUrl: watermarked, originalPublicId: uploaded.publicId });
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

router.get('/admin/list', authMiddleware, async (req: AuthRequest, res) => {
  if ((req as AuthRequest).user?.role !== 'ADMIN') return res.status(403).json({ error: '관리자만 접근 가능' });
  try {
    const snaps = await prisma.aiSnap.findMany({
      include: { wedding: { select: { id: true, slug: true, groomName: true, brideName: true } } },
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
