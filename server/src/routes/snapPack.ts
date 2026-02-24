import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const FAL_API_KEY = process.env.FAL_API_KEY;
const FAL_QUEUE = 'https://queue.fal.run';
const TOSS_SECRET = process.env.TOSS_SECRET_KEY;

const TIERS: Record<string, { snaps: number; price: number; label: string }> = {
  'snap-3': { snaps: 3, price: 5900, label: '3장 세트' },
  'snap-5': { snaps: 5, price: 9900, label: '5장 세트' },
  'snap-10': { snaps: 10, price: 14900, label: '10장 세트' },
  'snap-20': { snaps: 20, price: 24900, label: '20장 세트' },
};

const EXTRA_PER_SNAP = 1500;

const STUDIO_CONCEPTS: Record<string, { label: string; base: string }> = {
  studio_classic: {
    label: '스튜디오 클래식',
    base: 'professional wedding studio with soft warm lighting, ivory fabric backdrop, elegant atmosphere',
  },
  outdoor_garden: {
    label: '야외 가든',
    base: 'lush botanical garden with blooming flowers, golden hour sunlight filtering through trees, romantic natural atmosphere',
  },
  beach_sunset: {
    label: '해변 선셋',
    base: 'pristine white sand beach at golden sunset, warm orange pink sky reflecting on calm ocean, gentle sea breeze atmosphere',
  },
  hanbok_traditional: {
    label: '한복 전통',
    base: 'traditional Korean palace courtyard with wooden pillars and dancheong, soft natural daylight, dignified atmosphere',
  },
  cherry_blossom: {
    label: '벚꽃',
    base: 'surrounded by clouds of pink sakura cherry blossom trees, petals gently falling, spring sunlight, dreamy pastel pink atmosphere',
  },
};

const CINEMATIC_CONCEPTS: Record<string, { label: string; base: string }> = {
  city_night: {
    label: '시티 나이트',
    base: 'glamorous city rooftop at night, dazzling skyline bokeh lights, dramatic rim lighting, sophisticated urban luxury cinematic atmosphere',
  },
  forest_wedding: {
    label: '숲속 웨딩',
    base: 'deep enchanted forest with golden sunlight streaming through tall ancient trees, white rose and ivy flower arch, floating golden dust particles, magical cinematic atmosphere',
  },
  castle_garden: {
    label: '캐슬 가든',
    base: 'magnificent European stone castle with towers, grand garden with ornate fountain and hedge maze, warm golden hour, Disney-like cinematic dream atmosphere',
  },
  cathedral: {
    label: '성당 웨딩',
    base: 'grand gothic stone cathedral with towering stained glass windows casting colorful light, hundreds of candles, white flower arrangements, old world romantic cinematic elegance',
  },
  watercolor: {
    label: '수채화',
    base: 'dreamy soft pastel watercolor world, impressionistic flower garden, gentle ethereal light rays, fine art cinematic atmosphere',
  },
};

const SHOT_VARIANTS = [
  { id: 'full_front', prompt: 'full body shot, facing camera directly, confident gentle expression, eye contact with camera' },
  { id: 'upper_body', prompt: 'upper body portrait, slightly turned 30 degrees left, warm natural smile, soft eye contact' },
  { id: 'closeup', prompt: 'close-up portrait from chest up, gentle tilt of head, intimate warm expression, shallow depth of field' },
  { id: 'three_quarter', prompt: 'three quarter body shot, turned 45 degrees right, looking over shoulder with smile, elegant pose' },
  { id: 'profile_left', prompt: 'side profile facing left, chin slightly lifted, serene expression, natural facial proportions, refined delicate nose bridge' },
  { id: 'walking', prompt: 'mid-walk pose, slight motion, looking ahead with gentle smile, natural stride, candid cinematic moment' },
  { id: 'seated', prompt: 'gracefully seated pose, hands resting naturally, looking slightly upward, peaceful expression' },
  { id: 'looking_away', prompt: 'looking away from camera into distance, contemplative elegant expression, wind-swept feeling' },
  { id: 'laughing', prompt: 'candid laughing moment, genuine joy, eyes slightly closed, natural movement captured mid-motion' },
  { id: 'hands_detail', prompt: 'upper body shot highlighting hands, one hand touching face or hair, delicate gesture, intimate mood' },
  { id: 'back_turn', prompt: 'turned 60 degrees away, looking back at camera over shoulder, mysterious elegant expression' },
  { id: 'low_angle', prompt: 'low angle shot looking slightly upward, powerful yet graceful presence, dramatic perspective' },
  { id: 'leaning', prompt: 'casually leaning against wall or pillar, relaxed confident pose, natural charm' },
  { id: 'close_eyes', prompt: 'eyes gently closed, peaceful meditative expression, face tilted slightly up, ethereal mood' },
  { id: 'full_side', prompt: 'full body side view walking, natural stride, elegant silhouette, natural facial proportions, refined delicate nose bridge' },
  { id: 'wide_shot', prompt: 'wide establishing shot, full body small in frame, grand environment visible, cinematic scale' },
  { id: 'over_shoulder', prompt: 'shot from behind over shoulder, partial face visible, mysterious depth, cinematic framing' },
  { id: 'dynamic', prompt: 'dynamic movement pose, fabric flowing, slight motion blur on edges, frozen cinematic moment' },
  { id: 'embracing', prompt: 'arms gently crossed or self-embrace, warm protective gesture, soft introspective expression' },
  { id: 'dramatic_light', prompt: 'dramatic chiaroscuro lighting, half face illuminated, deep shadows, painterly mood' },
];

const COUPLE_SHOT_VARIANTS = [
  { id: 'facing_each', prompt: 'couple facing each other, close intimate distance, gentle smiles, eye contact between them' },
  { id: 'side_by_side', prompt: 'couple standing side by side, arms linked, both looking at camera with warm smiles' },
  { id: 'from_behind', prompt: 'couple seen from behind, walking together hand in hand, silhouettes against scenic background' },
  { id: 'forehead_touch', prompt: 'foreheads gently touching, eyes closed, intimate peaceful moment, close-up' },
  { id: 'laughing_together', prompt: 'couple laughing together candidly, genuine joy, natural movement, candid moment' },
  { id: 'walking_together', prompt: 'couple walking together, slight motion, looking at each other while walking, cinematic candid' },
  { id: 'embrace_front', prompt: 'gentle embrace facing camera, her head resting on his shoulder, warm loving expression' },
  { id: 'looking_distance', prompt: 'couple looking into distance together, side by side, contemplative serene mood' },
  { id: 'hand_holding_close', prompt: 'close-up of hands holding, rings visible, soft focus background, intimate detail shot' },
  { id: 'dramatic_wide', prompt: 'wide cinematic shot, couple small in grand environment, epic romantic scale' },
  { id: 'dancing', prompt: 'first dance pose, slight movement, her dress flowing, romantic swirl, cinematic motion' },
  { id: 'seated_together', prompt: 'seated together on steps or bench, relaxed natural pose, comfortable intimate mood' },
  { id: 'back_hug', prompt: 'back hug pose, his arms around her from behind, both smiling, warm cozy feeling' },
  { id: 'face_to_face_close', prompt: 'extreme close shot of faces nearly touching, shallow depth of field, intense romantic tension' },
  { id: 'piggyback', prompt: 'playful piggyback or lifting pose, genuine laughter, joyful energetic moment' },
  { id: 'profile_both', prompt: 'both in profile facing each other, noses almost touching, dramatic backlit silhouette' },
  { id: 'walking_away', prompt: 'walking away from camera together, holding hands, long path ahead, hopeful cinematic mood' },
  { id: 'cheek_kiss', prompt: 'gentle cheek kiss, natural loving gesture, her hand on his chest, soft intimate moment' },
  { id: 'twirling', prompt: 'he twirling her in dance, dress spinning beautifully, frozen motion, magical cinematic moment' },
  { id: 'low_angle_epic', prompt: 'low angle epic shot, couple standing tall, grand sky behind, powerful romantic silhouette' },
];

const OUTFIT_GROOM: Record<string, string> = {
  studio_classic: 'wearing elegant black tuxedo with white dress shirt, black bow tie, polished shoes',
  outdoor_garden: 'wearing navy blue suit with white shirt, floral boutonniere pinned to lapel',
  beach_sunset: 'wearing light beige linen suit with open collar white shirt, barefoot',
  hanbok_traditional: 'wearing navy blue dopo hanbok with gat hat, traditional Korean wedding attire',
  cherry_blossom: 'wearing soft gray suit with light pink boutonniere, white pocket square',
  city_night: 'wearing sleek black tuxedo with satin lapels, black bow tie, cufflinks',
  forest_wedding: 'wearing dark charcoal suit with emerald green silk tie, white rose boutonniere',
  castle_garden: 'wearing classic black formal morning suit with vest, patterned tie',
  cathedral: 'wearing refined charcoal morning suit with ivory vest, patterned silk tie',
  watercolor: 'wearing cream colored linen suit with no tie, relaxed artistic elegance',
};

const OUTFIT_BRIDE: Record<string, string> = {
  studio_classic: 'wearing elegant white lace wedding gown with sweetheart neckline, holding white rose bouquet',
  outdoor_garden: 'wearing flowing white organza wedding dress with delicate floral embroidery, wildflower bouquet',
  beach_sunset: 'wearing flowing lightweight white chiffon dress with open back, barefoot, windswept hair',
  hanbok_traditional: 'wearing red and green wonsam hanbok with jokduri headpiece, traditional Korean bridal attire',
  cherry_blossom: 'wearing soft white tulle wedding dress with cap sleeves, delicate flower crown',
  city_night: 'wearing sparkling white sequin evening gown with plunging back, elegant updo',
  forest_wedding: 'wearing ethereal white lace gown with cathedral train, baby breath flower crown',
  castle_garden: 'wearing magnificent white ball gown with long royal train, tiara, pearl jewelry',
  cathedral: 'wearing classic white cathedral-length wedding gown with long veil, pearl earrings',
  watercolor: 'wearing delicate off-white silk slip dress with thin straps, loose romantic waves in hair',
};

const buildPrompt = (concept: string, category: string, mode: string, shotIdx: number): string => {
  const allConcepts = { ...STUDIO_CONCEPTS, ...CINEMATIC_CONCEPTS };
  const scene = allConcepts[concept]?.base || STUDIO_CONCEPTS.studio_classic.base;
  const isCinematic = category === 'cinematic';

  const variants = mode === 'couple' ? COUPLE_SHOT_VARIANTS : SHOT_VARIANTS;
  const shot = variants[shotIdx % variants.length];

  const continuity = 'maintaining exact same outfit, same hairstyle, same accessories, same jewelry throughout, strict wardrobe continuity';
  const faceQuality = 'natural facial proportions, refined delicate nose bridge, photorealistic skin texture, no uncanny valley, lifelike';
  const photoTexture = 'shot on Canon EOS R5, 85mm f/1.4 lens, natural film grain, realistic photograph texture';
  const cinemaExtra = isCinematic ? ', anamorphic lens flare, subtle motion blur on fabric edges, cinematic color grading, 2.39:1 widescreen feel' : '';

  if (mode === 'couple') {
    const groomOutfit = OUTFIT_GROOM[concept] || OUTFIT_GROOM.studio_classic;
    const brideOutfit = OUTFIT_BRIDE[concept] || OUTFIT_BRIDE.studio_classic;
    return `transform into ${isCinematic ? 'cinematic' : 'professional'} wedding photograph, the man on the left ${groomOutfit}, the woman on the right ${brideOutfit}, ${shot.prompt}, ${scene}, ${continuity}, ${faceQuality}, ${photoTexture}${cinemaExtra}, 8k`;
  }

  const outfit = mode === 'groom'
    ? (OUTFIT_GROOM[concept] || OUTFIT_GROOM.studio_classic)
    : (OUTFIT_BRIDE[concept] || OUTFIT_BRIDE.studio_classic);

  const subject = mode === 'groom' ? 'groom' : 'bride';
  return `transform into ${isCinematic ? 'cinematic' : 'professional'} ${subject} wedding portrait, ${outfit}, ${shot.prompt}, ${scene}, ${continuity}, ${faceQuality}, ${photoTexture}${cinemaExtra}, 8k`;
};

const falFetch = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${FAL_API_KEY}`, ...opts?.headers },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`fal error (${res.status}): ${text.slice(0, 300)}`); }
};

router.get('/tiers', (_req, res) => {
  res.json(Object.entries(TIERS).map(([id, t]) => ({ id, ...t })));
});

router.get('/concepts', (_req, res) => {
  const studio = Object.entries(STUDIO_CONCEPTS).map(([id, c]) => ({ id, label: c.label, category: 'studio' }));
  const cinematic = Object.entries(CINEMATIC_CONCEPTS).map(([id, c]) => ({ id, label: c.label, category: 'cinematic' }));
  res.json({ studio, cinematic });
});

router.post('/create-order', authMiddleware, async (req: AuthRequest, res) => {
  const userId = (req as AuthRequest).user?.id;
  if (!userId) return res.status(401).json({ error: '로그인 필요' });

  const { tier, concept, category, mode, imageUrls } = req.body;
  const tierInfo = TIERS[tier];
  if (!tierInfo) return res.status(400).json({ error: '잘못된 티어' });
  if (!concept || !imageUrls || imageUrls.length < 1) return res.status(400).json({ error: 'concept, imageUrls required' });

  const orderId = `SNAP_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const pack = await prisma.snapPack.create({
    data: {
      userId, tier, totalSnaps: tierInfo.snaps, concept,
      category: category || 'studio', mode: mode || 'groom',
      inputUrls: imageUrls, amount: tierInfo.price, orderId,
    },
  });

  res.json({ packId: pack.id, orderId, amount: tierInfo.price, label: tierInfo.label });
});

router.post('/confirm-payment', authMiddleware, async (req: AuthRequest, res) => {
  const { paymentKey, orderId, amount } = req.body;

  try {
    const pack = await prisma.snapPack.findUnique({ where: { orderId } });
    if (!pack) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    if (pack.amount !== amount) return res.status(400).json({ error: '금액 불일치' });

    const encoded = Buffer.from(`${TOSS_SECRET}:`).toString('base64');
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: { Authorization: `Basic ${encoded}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      return res.status(400).json({ error: tossData.message || '결제 실패' });
    }

    await prisma.snapPack.update({
      where: { orderId },
      data: { status: 'PAID', paymentKey, paidAt: new Date() },
    });

    res.json({ success: true, packId: pack.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/extra-payment', authMiddleware, async (req: AuthRequest, res) => {
  const { packId, paymentKey, orderId, amount, count } = req.body;

  try {
    const pack = await prisma.snapPack.findUnique({ where: { id: packId } });
    if (!pack || pack.status !== 'PAID') return res.status(400).json({ error: '유효하지 않은 팩' });

    const expectedAmount = count * EXTRA_PER_SNAP;
    if (amount !== expectedAmount) return res.status(400).json({ error: '금액 불일치' });

    const encoded = Buffer.from(`${TOSS_SECRET}:`).toString('base64');
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: { Authorization: `Basic ${encoded}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const tossData = await tossRes.json();
    if (!tossRes.ok) return res.status(400).json({ error: tossData.message || '결제 실패' });

    await prisma.snapPack.update({
      where: { id: packId },
      data: { totalSnaps: pack.totalSnaps + count },
    });

    res.json({ success: true, newTotal: pack.totalSnaps + count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
  const { packId, mode } = req.body;

  try {
    const pack = await prisma.snapPack.findUnique({ where: { id: packId }, include: { snaps: true } });
    if (!pack || pack.status !== 'PAID') return res.status(400).json({ error: '결제된 팩이 아닙니다' });
    if (pack.usedSnaps >= pack.totalSnaps) return res.status(403).json({ error: '생성 가능 횟수 초과', needExtra: true });

    const effectiveMode = mode || pack.mode;
    const shotIdx = pack.usedSnaps;
    const prompt = buildPrompt(pack.concept, pack.category, effectiveMode, shotIdx);

    const inputUrlsArr = pack.inputUrls as string[];
    const imageUrls = effectiveMode === 'groom' ? [inputUrlsArr[0]] : effectiveMode === 'bride' ? [inputUrlsArr[1]] : effectiveMode === 'couple' ? inputUrlsArr : inputUrlsArr;

    const snap = await prisma.aiSnap.create({
      data: {
        snapPackId: pack.id, concept: pack.concept, mode: effectiveMode,
        engine: 'nano-banana-pro', prompt, inputUrls: pack.inputUrls as any, status: 'processing',
      },
    });

    await prisma.snapPack.update({ where: { id: packId }, data: { usedSnaps: pack.usedSnaps + 1 } });

    (async () => {
      try {
        const submit = await falFetch(`${FAL_QUEUE}/fal-ai/nano-banana-pro/edit`, {
          method: 'POST',
          body: JSON.stringify({ prompt, image_urls: imageUrls }),
        });

        if (submit.images) {
          await prisma.aiSnap.update({ where: { id: snap.id }, data: { status: 'done', resultUrl: submit.images[0]?.url } });
          return;
        }
        if (!submit.status_url) throw new Error('No status_url');

        const start = Date.now();
        while (Date.now() - start < 180000) {
          await new Promise(r => setTimeout(r, 3000));
          const status = await falFetch(submit.status_url);
          if (status.status === 'COMPLETED') {
            const result = await falFetch(submit.response_url);
            await prisma.aiSnap.update({ where: { id: snap.id }, data: { status: 'done', resultUrl: result.images?.[0]?.url } });
            return;
          }
          if (status.status === 'FAILED') throw new Error(status.error || 'Failed');
        }
        throw new Error('Timeout');
      } catch (err: any) {
        await prisma.aiSnap.update({ where: { id: snap.id }, data: { status: 'failed', errorMsg: err.message?.slice(0, 500) } });
      }
    })();

    res.json({ snapId: snap.id, shotIndex: shotIdx, remaining: pack.totalSnaps - pack.usedSnaps - 1 });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/pack/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const pack = await prisma.snapPack.findUnique({
      where: { id: req.params.id },
      include: { snaps: { orderBy: { createdAt: 'asc' } } },
    });
    if (!pack) return res.status(404).json({ error: 'Not found' });
    res.json(pack);
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/my-packs', authMiddleware, async (req: AuthRequest, res) => {
  const userId = (req as AuthRequest).user?.id;
  try {
    const packs = await prisma.snapPack.findMany({
      where: { userId, status: 'PAID' },
      include: { snaps: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(packs);
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.patch('/pack/:id/setup', authMiddleware, async (req: AuthRequest, res) => {
  const userId = (req as AuthRequest).user?.id;
  const { concept, category, mode, imageUrls } = req.body;
  try {
    const pack = await prisma.snapPack.findUnique({ where: { id: req.params.id } });
    if (!pack) return res.status(404).json({ error: '팩을 찾을 수 없습니다' });
    if (pack.userId !== userId) return res.status(403).json({ error: '권한 없음' });
    if (pack.concept && pack.concept !== '') return res.status(400).json({ error: '이미 설정된 팩입니다' });
    if (!concept || !imageUrls || imageUrls.length < 1) return res.status(400).json({ error: 'concept, imageUrls 필수' });
    const updated = await prisma.snapPack.update({
      where: { id: req.params.id },
      data: { concept, category: category || 'studio', mode: mode || 'groom', inputUrls: imageUrls },
      include: { snaps: { orderBy: { createdAt: 'asc' } } },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/snap/:id', authMiddleware, async (req, res) => {
  try {
    const snap = await prisma.aiSnap.findUnique({ where: { id: req.params.id } });
    if (!snap) return res.status(404).json({ error: 'Not found' });
    res.json(snap);
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
