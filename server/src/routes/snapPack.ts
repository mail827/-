import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { v2 as cloudinary } from 'cloudinary';

const router = Router();
const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FAL_API_KEY = process.env.FAL_API_KEY;
const FAL_QUEUE = 'https://queue.fal.run';
const TOSS_SECRET = process.env.TOSS_SECRET_KEY;

const uploadToCloudinary = async (imageUrl: string, snapId: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'wedding/ai-snap/paid',
      public_id: snapId,
      overwrite: true,
      resource_type: 'image',
      transformation: [{ quality: 'auto:best', fetch_format: 'auto' }],
    });
    return result.secure_url;
  } catch {
    return imageUrl;
  }
};

const TIERS: Record<string, { snaps: number; price: number; label: string }> = {
  'snap-3': { snaps: 3, price: 5900, label: '3장 세트' },
  'snap-5': { snaps: 5, price: 9900, label: '5장 세트' },
  'snap-10': { snaps: 10, price: 14900, label: '10장 세트' },
  'snap-20': { snaps: 20, price: 24900, label: '20장 세트' },
};

const EXTRA_PER_SNAP = 1500;

const ADD_SNAP_TIERS: Record<string, { snaps: number; price: number; label: string }> = {
  'add-1': { snaps: 1, price: 2900, label: '1장 추가' },
  'add-3': { snaps: 3, price: 6900, label: '3장 추가' },
  'add-5': { snaps: 5, price: 9900, label: '5장 추가' },
  'add-10': { snaps: 10, price: 16900, label: '10장 추가' },
};

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
  hanbok_wonsam: {
    label: '궁중 혼례',
    base: 'grand Korean royal palace Geunjeongjeon main hall, red lacquered wooden pillars with golden dancheong patterns, traditional ceremonial table with bongchidari and jeonan, warm natural daylight streaming through wooden lattice, dignified regal atmosphere',
  },
  hanbok_dangui: {
    label: '당의 한복',
    base: 'serene traditional Korean garden with lotus pond, stone bridge, aged pine trees and bamboo grove, wooden hanok pavilion with tiled roof, gentle morning sunlight, refined scholarly atmosphere',
  },
  hanbok_modern: {
    label: '모던 한복',
    base: 'minimalist modern hanok interior with clean white walls, warm wood floor, simple sliding paper doors, single branch ikebana arrangement, soft diffused natural light from large window, contemporary elegant atmosphere',
  },
  hanbok_saeguk: {
    label: '사극풍',
    base: 'magnificent Gyeongbokgung throne hall interior, grand golden dragon screen behind, ornate wooden columns with vivid dancheong, silk lanterns hanging, cinematic golden hour light streaming through doors, epic royal drama atmosphere',
  },
  hanbok_flower: {
    label: '꽃한복',
    base: 'blooming hanok courtyard filled with spring flowers, cherry blossoms and azaleas surrounding wooden veranda, petals gently falling, warm golden spring sunlight, romantic traditional garden atmosphere',
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
  magazine_cover: {
    label: '매거진 커버',
    base: 'clean minimalist high fashion studio, single dramatic spotlight, strong editorial poses, luxury fashion magazine cover aesthetic, high contrast lighting',
  },
  rainy_day: {
    label: '비오는 날',
    base: 'gentle rain with beautiful bokeh, wet cobblestone street reflections, transparent umbrella, intimate romantic mood, soft diffused overcast light, cinematic rain atmosphere',
  },
  autumn_leaves: {
    label: '가을 단풍',
    base: 'golden red maple tree-lined avenue with fall foliage canopy, leaves gently falling, warm amber golden hour light, romantic cozy autumn atmosphere',
  },
  winter_snow: {
    label: '겨울 눈',
    base: 'gentle snowfall in winter wonderland, frosted pine trees, soft blue-white winter light, breath visible in cold air, magical serene winter romance',
  },
  vintage_film: {
    label: '빈티지 필름',
    base: 'warm Kodak Portra 400 film grain texture, slightly faded nostalgic color palette, soft natural window light, 1970s vintage wedding aesthetic',
  },
  cruise_sunset: {
    label: '크루즈 선셋',
    base: 'luxury yacht deck at golden hour sunset, warm amber ocean light, gentle sea breeze blowing hair softly, turquoise Mediterranean sea behind, yacht railing and polished wood deck, golden sun reflecting on calm water waves, romantic warm cinematic lighting',
  },
  cruise_bluesky: {
    label: '크루즈 블루스카이',
    base: 'luxury cruise ship deck under vivid blue sky, crystal clear ocean stretching to horizon, white yacht railing, fresh sea breeze, bright natural daylight, gentle ocean waves sparkling in sunlight, clean nautical atmosphere',
  },
};

const GROOM_SHOT_VARIANTS = [
  { id: 'jacket_adjust', prompt: 'upper body, one hand adjusting suit jacket lapel, relaxed confident smirk, slight head tilt, natural masculine charm' },
  { id: 'hands_pocket', prompt: 'three quarter body, one hand casually in trouser pocket, other hand relaxed at side, easy confident stance, subtle smile' },
  { id: 'leaning_cool', prompt: 'leaning against wall with one shoulder, arms loosely crossed, cool relaxed expression, candid editorial mood' },
  { id: 'walking_stride', prompt: 'mid-stride walking toward camera, jacket unbuttoned, natural movement, looking slightly off-camera, cinematic candid' },
  { id: 'seated_relaxed', prompt: 'seated on steps or ledge, elbows resting on knees, hands loosely clasped, relaxed genuine smile, natural light' },
  { id: 'profile_sharp', prompt: 'sharp side profile, jaw defined by rim lighting, looking into distance, contemplative masculine presence' },
  { id: 'cuff_fixing', prompt: 'close-up upper body, adjusting shirt cuff or watch, eyes downcast with slight smile, intimate grooming moment' },
  { id: 'back_turn_glance', prompt: 'turned away, glancing back over shoulder with half smile, mysterious confident expression, dramatic backlight' },
  { id: 'tie_touch', prompt: 'upper body, one hand lightly touching tie or collar, direct eye contact, warm confident expression' },
  { id: 'laughing_natural', prompt: 'genuine laughing moment, head slightly tilted back, natural joy, eyes crinkled, candid movement' },
  { id: 'low_angle_power', prompt: 'low angle shot, standing tall with hands in pockets, powerful silhouette against sky, heroic cinematic mood' },
  { id: 'arm_cross_lean', prompt: 'arms crossed casually, slight lean, knowing smile, editorial magazine pose, strong but approachable' },
  { id: 'looking_down', prompt: 'looking down with gentle smile, hands adjusting boutonniere, soft overhead lighting, intimate reflective moment' },
  { id: 'dramatic_half', prompt: 'dramatic half-face lighting, one side illuminated, serious composed expression, deep shadows, painterly mood' },
  { id: 'wide_cinematic', prompt: 'wide shot, walking alone through grand scene, small figure in epic environment, cinematic scale and atmosphere' },
  { id: 'collar_up', prompt: 'upper body, turning up coat collar or adjusting scarf, windswept hair, rugged elegant vibe' },
  { id: 'three_quarter_smirk', prompt: 'three quarter view, slight smirk, one eyebrow subtly raised, charismatic effortless cool' },
  { id: 'hands_behind', prompt: 'full body, hands clasped behind back, standing upright with relaxed shoulders, dignified calm confidence' },
  { id: 'over_shoulder_depth', prompt: 'shot from behind over shoulder, partial face visible, looking into scenic distance, mysterious depth' },
  { id: 'dynamic_motion', prompt: 'dynamic movement, jacket swinging with motion, slight wind effect, frozen cinematic action moment' },
];

const BRIDE_SHOT_VARIANTS = [
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
  hanbok_wonsam: 'wearing heukdallyeong (black ceremonial robe) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, samo headpiece (official Korean groom wedding hat with wings), gold-embroidered belt over white inner jeogori, NOT a western suit NOT a coat NOT modern clothing, authentic traditional Korean royal groom wedding attire',
  hanbok_dangui: 'wearing jade-green dopo (Korean scholar overcoat) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, yugeon (soft fabric headband), white inner jeogori visible underneath, delicate jade ornament at waist, NOT a western suit NOT a coat, refined traditional Korean scholar groom attire',
  hanbok_modern: 'wearing charcoal gray modern durumagi (Korean traditional long overcoat) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, Korean traditional fabric texture, white inner jeogori with mandarin collar visible at neckline, NOT a western suit NOT a blazer NOT a trench coat, contemporary minimalist Korean hanbok groom attire',
  hanbok_saeguk: 'wearing deep crimson gonryongpo (Korean royal dragon robe) with traditional V-shaped crossed collar (gyotgit), wide sleeves, golden dragon embroidery on chest, golden gwanmo crown headpiece, jade belt, NOT a western suit NOT modern clothing, magnificent royal Korean king ceremonial attire',
  hanbok_flower: 'wearing ivory white durumagi (Korean traditional long overcoat) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, subtle floral embroidery at hem, soft pastel inner jeogori visible at neckline, small flower accent, NOT a western suit NOT a blazer, gentle spring Korean hanbok groom attire',
  cherry_blossom: 'wearing soft gray suit with light pink boutonniere, white pocket square',
  city_night: 'wearing sleek black tuxedo with satin lapels, black bow tie, cufflinks',
  forest_wedding: 'wearing dark charcoal suit with emerald green silk tie, white rose boutonniere',
  castle_garden: 'wearing classic black formal morning suit with vest, patterned tie',
  cathedral: 'wearing refined charcoal morning suit with ivory vest, patterned silk tie',
  watercolor: 'wearing cream colored linen suit with no tie, relaxed artistic elegance',
  magazine_cover: 'wearing designer black suit with perfect fit, strong editorial style',
  rainy_day: 'wearing dark navy coat suit, holding umbrella',
  autumn_leaves: 'wearing warm brown tweed suit with earth tones',
  winter_snow: 'wearing charcoal wool coat suit, winter layers',
  vintage_film: 'wearing retro brown suit with wide lapels, 1970s style',
  cruise_sunset: 'wearing light linen suit, nautical elegance',
  cruise_bluesky: 'wearing white or navy blazer, crisp shirt, nautical style',
};

const OUTFIT_BRIDE: Record<string, string> = {
  studio_classic: 'wearing elegant white lace wedding gown with sweetheart neckline, holding white rose bouquet',
  outdoor_garden: 'wearing flowing white organza wedding dress with delicate floral embroidery, wildflower bouquet',
  beach_sunset: 'wearing flowing lightweight white chiffon dress with open back, barefoot, windswept hair',
  hanbok_wonsam: 'wearing vibrant red wonsam (ceremonial robe) layered over yellow chima, golden phoenix embroidery across chest and sleeves, elaborate hwagwan (jeweled crown) with dangling ornaments, white socks with kkotsin (flower shoes), holding a ceremonial fan, traditional Korean royal bride wedding attire',
  hanbok_dangui: 'wearing soft blush-pink dangui (short ceremonial jacket) with gold-thread floral embroidery over deep navy chima (skirt), small jokduri (bridal coronet) with jade and coral beads, delicate binyeo (hairpin) in updo, refined elegant traditional Korean bridal attire',
  hanbok_modern: 'wearing pastel lavender modern jeogori with clean lines over white chima (skirt), hair in loose low bun with single minimalist binyeo (silver hairpin), no heavy ornament, contemporary minimalist Korean bridal attire',
  hanbok_saeguk: 'wearing magnificent golden hwarot (queen ceremonial robe) with vivid phoenix and peony embroidery across entire surface, grand jokduri crown with long bead strings, layered silk underskirts visible at hem, opulent royal Korean queen ceremonial bridal attire',
  hanbok_flower: 'wearing light lilac jeogori with delicate flower embroidery over soft white chima (skirt), fresh flower hairpin tucked behind ear, loose natural hairstyle with soft waves, romantic spring Korean bridal attire',
  cherry_blossom: 'wearing soft white tulle wedding dress with cap sleeves, delicate flower crown',
  city_night: 'wearing sparkling white sequin evening gown with plunging back, elegant updo',
  forest_wedding: 'wearing ethereal white lace gown with cathedral train, baby breath flower crown',
  castle_garden: 'wearing magnificent white ball gown with long royal train, tiara, pearl jewelry',
  cathedral: 'wearing classic white cathedral-length wedding gown with long veil, pearl earrings',
  watercolor: 'wearing delicate off-white silk slip dress with thin straps, loose romantic waves in hair',
  magazine_cover: 'wearing haute couture white gown, high fashion editorial style',
  rainy_day: 'wearing white dress, transparent umbrella, romantic rain aesthetic',
  autumn_leaves: 'wearing ivory dress, warm autumn tones',
  winter_snow: 'wearing white fur-trimmed gown, winter wonderland style',
  vintage_film: 'wearing classic A-line lace dress, 1970s vintage bridal aesthetic',
  cruise_sunset: 'wearing flowing white dress, windswept hair, golden hour elegance',
  cruise_bluesky: 'wearing white summer dress, clean nautical bridal style',
};

const HANBOK_CONCEPTS = new Set(['hanbok_wonsam', 'hanbok_dangui', 'hanbok_modern', 'hanbok_saeguk', 'hanbok_flower']);

const buildPrompt = (concept: string, category: string, mode: string, shotIdx: number): string => {
  const allConcepts = { ...STUDIO_CONCEPTS, ...CINEMATIC_CONCEPTS };
  const scene = allConcepts[concept]?.base || STUDIO_CONCEPTS.studio_classic.base;
  const isCinematic = category === 'cinematic';
  const isHanbok = HANBOK_CONCEPTS.has(concept);
  const variants = mode === 'couple' ? COUPLE_SHOT_VARIANTS : mode === 'groom' ? GROOM_SHOT_VARIANTS : BRIDE_SHOT_VARIANTS;
  const shot = variants[shotIdx % variants.length];

  const face = 'preserve exact facial features from reference photo, natural Korean face proportions, keep original nose bridge width and shape, maintain authentic jawline and cheekbones, real skin texture with natural pores, no facial modification';

  const outfitLock = 'CRITICAL: maintain absolutely identical outfit from first generated image — same fabric, same color, same pattern, same embroidery, same neckline, same sleeves, same hemline, same shoes. Maintain absolutely identical hairstyle — same parting, same length, same curl pattern, same hair color, same hair accessories, same headpiece position. Maintain absolutely identical jewelry and accessories — same earrings, same necklace, same rings, same belt, same hairpin position. Zero deviation allowed between shots';

  const cam = isCinematic
    ? 'cinematic 85mm f/1.4, anamorphic bokeh, filmic color grading'
    : 'Canon EOS R5 85mm f/1.4, natural soft lighting, fine film grain';

  const hanbokExtra = isHanbok
    ? ', authentic traditional Korean hanbok fabric texture with visible silk sheen, accurate hanbok layering and draping, traditional Korean color palette'
    : '';

  if (mode === 'couple') {
    const gOutfit = OUTFIT_GROOM[concept] || OUTFIT_GROOM.studio_classic;
    const bOutfit = OUTFIT_BRIDE[concept] || OUTFIT_BRIDE.studio_classic;
    return `${isCinematic ? 'cinematic' : 'professional'} Korean wedding photo, man ${gOutfit}, woman ${bOutfit}, ${shot.prompt}, ${scene}, ${face}, ${outfitLock}${hanbokExtra}, ${cam}, 8k ultra detailed`;
  }

  const clothe = mode === 'groom'
    ? (OUTFIT_GROOM[concept] || OUTFIT_GROOM.studio_classic)
    : (OUTFIT_BRIDE[concept] || OUTFIT_BRIDE.studio_classic);
  const subj = mode === 'groom' ? 'Korean groom' : 'Korean bride';
  return `${isCinematic ? 'cinematic' : 'professional'} ${subj} wedding portrait, ${clothe}, ${shot.prompt}, ${scene}, ${face}, ${outfitLock}${hanbokExtra}, ${cam}, 8k ultra detailed`;
};

const buildNegativePrompt = (mode: string, concept: string): string => {
  const base = 'deformed face, elongated banana-shaped face, stretched face, pinched nose, bulbous nose, uncanny valley, plastic skin, wax figure, 3D render, cartoon, anime, illustration, painting, doll-like, mannequin, blurry, low quality, watermark, text overlay';

  const consistencyBlock = 'different outfit, changed clothes, different hairstyle, new accessories, altered jewelry, different headpiece, modified hair color, changed fabric color, inconsistent pattern, different shoes, wardrobe change, costume switch, hair restyled, accessories swapped';

  const male = 'overly angular square jaw, exaggerated chin, feminized male face, too-smooth airbrush skin, unnaturally narrow face';
  const female = 'masculine jaw, wide nose bridge, overly sharp features, generic AI female face';

  const isHanbok = HANBOK_CONCEPTS.has(concept);
  const hanbokNeg = isHanbok
    ? ', Japanese kimono, Chinese hanfu, inaccurate hanbok structure, wrong collar direction, synthetic fabric look, plastic-looking silk, anachronistic modern elements mixed with traditional'
    : '';

  if (mode === 'groom') return `${base}, ${consistencyBlock}, ${male}${hanbokNeg}`;
  if (mode === 'bride') return `${base}, ${consistencyBlock}, ${female}${hanbokNeg}`;
  return `${base}, ${consistencyBlock}, ${male}, ${female}${hanbokNeg}`;
};

const falFetch = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${FAL_API_KEY}`, ...opts?.headers },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`fal error (${res.status}): ${text.slice(0, 300)}`); }
};

const validateCoupon = async (code: string, originalPrice: number): Promise<{ valid: boolean; finalPrice: number; couponCode: string | null }> => {
  if (!code) return { valid: false, finalPrice: originalPrice, couponCode: null };
  try {
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) return { valid: false, finalPrice: originalPrice, couponCode: null };
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return { valid: false, finalPrice: originalPrice, couponCode: null };
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false, finalPrice: originalPrice, couponCode: null };

    let finalPrice = originalPrice;
    if (coupon.discountType === 'PERCENT') {
      finalPrice = Math.round(originalPrice * (1 - coupon.discountValue / 100));
    } else {
      finalPrice = Math.max(0, originalPrice - coupon.discountValue);
    }

    return { valid: true, finalPrice, couponCode: coupon.code };
  } catch {
    return { valid: false, finalPrice: originalPrice, couponCode: null };
  }
};

router.get('/toss-client-key', (_req, res) => {
  res.json({ clientKey: process.env.TOSS_CLIENT_KEY });
});

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

  const { tier, concept, category, mode, imageUrls, couponCode } = req.body;
  const tierInfo = TIERS[tier];
  if (!tierInfo) return res.status(400).json({ error: '잘못된 티어' });
  if (!concept || !imageUrls || imageUrls.length < 1) return res.status(400).json({ error: 'concept, imageUrls required' });

  const { valid, finalPrice, couponCode: validCode } = await validateCoupon(couponCode, tierInfo.price);

  const orderId = `SNAP_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const pack = await prisma.snapPack.create({
    data: {
      userId, tier, totalSnaps: tierInfo.snaps, concept,
      category: category || 'studio', mode: mode || 'groom',
      inputUrls: imageUrls, amount: finalPrice, orderId,
      couponCode: valid ? validCode : null,
    },
  });

  res.json({
    packId: pack.id, orderId, amount: finalPrice, label: tierInfo.label,
    originalPrice: tierInfo.price,
    discounted: valid,
    couponCode: valid ? validCode : null,
  });
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

    if (pack.couponCode) {
      await prisma.coupon.update({
        where: { code: pack.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

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

router.post('/add-snaps/order', authMiddleware, async (req: any, res) => {
  const { packId, addTier } = req.body;
  const userId = req.user.id;
  const tierInfo = ADD_SNAP_TIERS[addTier];
  if (!tierInfo) return res.status(400).json({ error: '잘못된 추가 티어' });
  const pack = await prisma.snapPack.findFirst({ where: { id: packId, userId } });
  if (!pack) return res.status(404).json({ error: '팩 없음' });
  const orderId = `SNAPADD_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  res.json({ orderId, amount: tierInfo.price, packId, addTier, clientKey: process.env.TOSS_CLIENT_KEY });
});

router.post('/add-snaps/confirm', authMiddleware, async (req: any, res) => {
  const { paymentKey, orderId, amount, packId, addTier } = req.body;
  const userId = req.user.id;
  const tierInfo = ADD_SNAP_TIERS[addTier];
  if (!tierInfo || tierInfo.price !== amount) return res.status(400).json({ error: '금액 불일치' });
  const pack = await prisma.snapPack.findFirst({ where: { id: packId, userId } });
  if (!pack) return res.status(404).json({ error: '팩 없음' });
  const encoded = Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64');
  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: { Authorization: `Basic ${encoded}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const tossData = await tossRes.json();
  if (!tossRes.ok) return res.status(400).json({ error: tossData.message || '결제 실패' });
  const updated = await prisma.snapPack.update({
    where: { id: packId },
    data: { totalSnaps: pack.totalSnaps + tierInfo.snaps },
    include: { snaps: true },
  });
  res.json(updated);
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
    const negativePrompt = buildNegativePrompt(effectiveMode, pack.concept);

    const inputUrlsArr = pack.inputUrls as string[];
    const chainRefs = (pack.chainRefUrls || {}) as Record<string, string>;

    let imageUrls: string[];

    if (chainRefs[effectiveMode]) {
      const refUrl = chainRefs[effectiveMode];
      if (effectiveMode === 'groom') {
        imageUrls = [refUrl, inputUrlsArr[0]];
      } else if (effectiveMode === 'bride') {
        imageUrls = [refUrl, inputUrlsArr[1]];
      } else {
        imageUrls = inputUrlsArr.length >= 3
          ? [refUrl, inputUrlsArr[2], inputUrlsArr[0], inputUrlsArr[1]]
          : [refUrl, ...inputUrlsArr.slice(0, 2)];
      }
    } else {
      if (effectiveMode === 'groom') {
        imageUrls = [inputUrlsArr[0]];
      } else if (effectiveMode === 'bride') {
        imageUrls = [inputUrlsArr[1]];
      } else {
        imageUrls = inputUrlsArr.length >= 3
          ? [inputUrlsArr[2], inputUrlsArr[0], inputUrlsArr[1]]
          : inputUrlsArr.slice(0, 2);
      }
    }

    const snap = await prisma.aiSnap.create({
      data: {
        snapPackId: pack.id, userId: pack.userId, concept: pack.concept, mode: effectiveMode,
        engine: 'nano-banana-pro', prompt, inputUrls: pack.inputUrls as any, status: 'processing',
      },
    });

    await prisma.snapPack.update({ where: { id: packId }, data: { usedSnaps: pack.usedSnaps + 1 } });

    (async () => {
      try {
        const submit = await falFetch(`${FAL_QUEUE}/fal-ai/nano-banana-pro/edit`, {
          method: 'POST',
          body: JSON.stringify({ prompt, image_urls: imageUrls, negative_prompt: negativePrompt, strength: effectiveMode === 'couple' ? 0.18 : 0.28, num_images: 1 }),
        });

        let falUrl: string | null = null;

        if (submit.images && submit.images[0]?.url) {
          falUrl = submit.images[0].url;
        } else if (submit.status_url) {
          const start = Date.now();
          while (Date.now() - start < 180000) {
            await new Promise(r => setTimeout(r, 3000));
            const status = await falFetch(submit.status_url);
            if (status.status === 'COMPLETED') {
              const result = await falFetch(submit.response_url);
              falUrl = result.images?.[0]?.url || null;
              break;
            }
            if (status.status === 'FAILED') throw new Error(status.error || 'Failed');
          }
          if (!falUrl) throw new Error('Timeout');
        } else {
          throw new Error('No images or status_url');
        }

        const validateRes = await fetch(falUrl!, { method: 'HEAD' });
        const cType = validateRes.headers.get('content-type') || '';
        const cLen = parseInt(validateRes.headers.get('content-length') || '0', 10);
        if (!cType.startsWith('image/') || cLen < 10000) {
          throw new Error('Invalid image: ' + cType + ' size=' + cLen);
        }
        const permanentUrl = await uploadToCloudinary(falUrl!, snap.id);
        await prisma.aiSnap.update({ where: { id: snap.id }, data: { status: 'done', resultUrl: permanentUrl } });

        if (!chainRefs[effectiveMode]) {
          chainRefs[effectiveMode] = permanentUrl;
          await prisma.snapPack.update({
            where: { id: packId },
            data: { chainRefUrls: chainRefs },
          });
        }
      } catch (err: any) {
        await prisma.aiSnap.update({ where: { id: snap.id }, data: { status: 'failed', errorMsg: err.message?.slice(0, 500) } });
        await prisma.snapPack.update({ where: { id: packId }, data: { usedSnaps: { decrement: 1 } } });
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
