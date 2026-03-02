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
    label: '유럽 궁전',
    base: 'outdoor European castle garden, couple standing on stone pathway surrounded by trimmed hedges and rose bushes, medieval stone castle towers visible far behind, golden hour sunlight streaming across open-air garden, ornate stone fountain nearby, wide open sky above',
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
  iphone_selfie: {
    label: '셀카 스냅',
    base: 'authentic iPhone selfie photo shot at arms length from above, close-up face filling 70 percent of frame, slightly tilted off-center angle not perfectly composed, on-camera flash with neutral cool white balance, subtle film grain and digital noise, slightly overexposed flash highlights on forehead and nose bridge, casual indoor background out of focus, NOT warm golden tone NOT studio lighting, raw unedited phone camera aesthetic',
  },
  iphone_mirror: {
    label: '거울 셀카',
    base: 'mirror selfie with iPhone flash reflection visible in mirror, full body or upper body reflected in large clean mirror, bright harsh flash creating high contrast, slightly washed out flash aesthetic, visible phone in hand, casual posed mirror shot, trendy social media mirror selfie style, clean minimal background behind mirror',
  },
  cruise_bluesky: {
    label: '크루즈 블루스카이',
    base: 'luxury cruise ship deck under vivid blue sky, crystal clear ocean stretching to horizon, white yacht railing, fresh sea breeze, bright natural daylight, gentle ocean waves sparkling in sunlight, clean nautical atmosphere',
  },
  vintage_record: {
    label: '빈티지 레코드',
    base: 'cozy vintage vinyl record shop interior, wooden shelves filled with LP records and colorful album covers displayed on walls, warm tungsten incandescent bulb lighting casting golden amber glow, vinyl turntable on wooden counter, old concert posters on ceiling, intimate nostalgic 1960s 1970s atmosphere, Kodak Portra 400 warm film tones with soft grain',
  },
  retro_hongkong: {
    label: '레트로 홍콩',
    base: 'narrow Hong Kong Mong Kok night market alley, rows of glowing crimson red Chinese paper lanterns strung tightly overhead creating tunnel of warm light, vintage neon signs with traditional Chinese characters in pink cyan and green glow, rain-slicked cobblestone street with deep puddle reflections of all lights, blurred crowd silhouettes in background creating depth, steamy food stall smoke drifting through scene, direct on-camera flash photography, harsh bright flash on subjects with dark background falloff, high contrast paparazzi snapshot style, Wong Kar-wai teal shadows and warm crimson highlights, cross-processed film look, 85mm f1.4, Fuji Superia 400 grain with teal-red color shift',
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
  { id: 'elbow_lean_sign', prompt: 'upper body shot, casually leaning elbow on market stall counter or shop sign railing, one hand in pocket, relaxed warm genuine smile, slight head tilt, intimate close-up night portrait' },
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
  cruise_bluesky: 'wearing white or navy blazer, crisp linen shirt, no tie, nautical casual style',
  vintage_record: 'wearing olive khaki brown wide-lapel vintage blazer over light blue open-collar dress shirt with wide pointed collar visible over blazer lapels, grey pinstripe pleated trousers, brown leather oxford shoes, same outfit in every shot, 1970s retro groom',
  retro_hongkong: 'wearing dark burgundy wine double-breasted blazer with silky sheen over black silk shirt unbuttoned showing collarbone, ivory pocket square, black slim trousers, black chelsea boots, relaxed confident lean with hand in pocket, effortless cool charm',
  iphone_selfie: 'wearing casual white shirt with rolled sleeves, relaxed natural look, no tie no jacket',
  iphone_mirror: 'wearing casual white shirt with rolled sleeves, relaxed natural look, no tie no jacket, holding phone for mirror selfie',
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
  cruise_bluesky: 'wearing white summer dress, windswept hair, clean nautical bridal style',
  vintage_record: 'wearing ivory cream Victorian puff-sleeve wedding dress with sheer floral lace high-neck bodice over sweetheart neckline, short puffy gathered sleeves at shoulder, fitted ivory satin ribbon belt at waist, full A-line satin skirt with front slit, elbow-length white satin opera gloves, short tulle veil on back of head, hair worn completely down and loose past shoulders, same dress same gloves same veil in every shot, 1960s vintage bridal',
  retro_hongkong: 'wearing champagne gold silk satin halter-neck dress with thin spaghetti straps and open cutout sides showing skin, small low mandarin collar detail at neckline, body-hugging silhouette, scattered delicate gold plum blossom embroidery, thigh-high side slit, vintage pearl drop earrings, metallic gold ankle-strap heels, long loose black hair flowing down past shoulders, never tied up never in bun never in updo, hairstyle matching reference photo exactly',
  iphone_selfie: 'wearing casual white blouse or knit top, natural minimal makeup, hair down loosely, relaxed everyday look, no wedding dress',
  iphone_mirror: 'wearing casual white blouse or knit top, natural minimal makeup, hair down loosely, relaxed everyday look, no wedding dress, holding phone for mirror selfie',
};

const HANBOK_CONCEPTS = new Set(['hanbok_wonsam', 'hanbok_dangui', 'hanbok_modern', 'hanbok_saeguk', 'hanbok_flower']);

const DETAIL_SHOTS = new Set([
  'hand_holding_close', 'hands_detail', 'cuff_fixing', 'looking_down',
]);

const WIDE_SHOTS = new Set([
  'dramatic_wide', 'wide_shot', 'wide_cinematic', 'low_angle_epic', 'low_angle_power', 'walking_away',
]);

const CLOSEUP_SHOTS = new Set([
  'closeup', 'face_to_face_close', 'dramatic_half', 'dramatic_light', 'close_eyes', 'profile_sharp',
]);


const CINEMATIC_GROOM_SHOTS = [
  { id: 'closeup_gaze', prompt: 'tight closeup framing at chest level, face and upper chest only, no waist no legs, close-up portrait, direct warm eye contact, slight confident smile, extremely shallow depth of field' },
  { id: 'profile_rim', prompt: 'extreme closeup framing at shoulder level, face only sharp side profile, moody rim lighting on jawline, contemplative expression, dramatic cinematic' },
  { id: 'collar_touch', prompt: 'medium shot framing at waist level, upper body only, one hand touching open shirt collar casually, slight head tilt, intimate warm gaze toward camera' },
  { id: 'leaning_wall', prompt: 'medium shot framing at waist level, upper body casually leaning shoulder against neon-lit wall, relaxed smirk, arms loosely crossed, dramatic side lighting' },
  { id: 'laughing_close', prompt: 'tight closeup framing at chest level, close-up genuine laughing moment, head tilted, natural joy, eyes crinkled with warmth' },
  { id: 'walking_stride', prompt: 'three quarter body mid-stride, one hand in pocket, looking slightly off-camera with half-smile, natural movement' },
  { id: 'looking_down', prompt: 'medium shot framing at waist level, upper body looking down with gentle thoughtful smile, hand adjusting cuff, soft intimate moment' },
  { id: 'back_glance', prompt: 'medium shot framing at waist level, upper body turned away, glancing back over shoulder with charming half smile, dramatic backlight' },
  { id: 'three_quarter_smirk', prompt: 'tight closeup framing at chest level, three quarter view close-up face, slight knowing smirk, one eyebrow subtly raised, effortless charisma' },
  { id: 'seated_cool', prompt: 'seated casually, elbows on knees, relaxed genuine smile looking up, intimate eye level angle' },
];


const CINEMATIC_BRIDE_SHOTS = [
  { id: 'closeup_smile', prompt: 'tight closeup framing at chest level, face and upper chest only visible, no waist no legs, close-up portrait, soft warm smile, gentle eye contact, extremely shallow depth of field, beautiful skin glow from neon light' },
  { id: 'profile_earring', prompt: 'extreme closeup framing at shoulder level, face only side profile close-up, chin slightly lifted, serene expression, earring catching neon light, wind in hair, blurred background' },
  { id: 'hair_touch', prompt: 'medium shot framing at waist level, upper body only, one hand gracefully touching hair behind ear, gentle head tilt, soft warm smile, intimate framing' },
  { id: 'laughing_candid', prompt: 'medium shot framing at waist level, upper body candid laughing moment, eyes crinkled with genuine joy, hand near face, natural warmth' },
  { id: 'over_shoulder', prompt: 'medium shot framing at waist level, upper body looking back over shoulder with mysterious inviting smile, dramatic backlight on face and hair' },
  { id: 'adjusting', prompt: 'upper body, looking down with gentle smile, one hand adjusting earring, soft intimate moment' },
  { id: 'leaning_wall', prompt: 'three quarter body leaning casually against neon-lit wall, one leg bent, relaxed confident expression, warm glow on face' },
  { id: 'walking_slit', prompt: 'three quarter body mid-walk, dress slit visible, looking ahead with gentle smile, natural stride' },
  { id: 'three_quarter_warm', prompt: 'medium shot framing at waist level, upper body turned 45 degrees, warm inviting expression, extremely shallow depth of field' },
  { id: 'wind_moment', prompt: 'tight closeup framing at chest level, close-up face and hair, wind catching hair across face, natural surprised expression, authentic beauty' },
];

const CINEMATIC_COUPLE_SHOTS_DYNAMIC = [
  { id: 'closeup_foreheads', prompt: 'tight closeup framing at chest level, extreme close-up foreheads gently touching, eyes closed, peaceful intimate moment, faces fill entire frame, shallow depth of field' },
  { id: 'cheek_kiss_close', prompt: 'tight closeup framing at chest level, close-up gentle cheek kiss, her hand on his chest, warm spontaneous moment, faces prominent' },
  { id: 'facing_smile', prompt: 'medium shot framing at waist level, upper body facing each other with warm gentle smiles, intimate close distance, soft natural moment' },
  { id: 'back_hug_smile', prompt: 'medium shot framing at waist level, back hug from behind, both smiling warmly, her hand on his arm, cozy natural embrace, upper body framing' },
  { id: 'walking_look', prompt: 'three quarter body walking together mid-stride, turning to look at each other with warm smiles, natural hand holding' },
  { id: 'whisper_ear', prompt: 'tight closeup framing at chest level, close-up him whispering in her ear, she smiles with eyes closed, intimate tender moment' },
  { id: 'nose_touch', prompt: 'extreme closeup framing at shoulder level, extreme close-up noses almost touching, playful eye contact, warm smiles, romantic tension' },
  { id: 'playful_pull', prompt: 'three quarter body playful moment, one pulling other by hand, genuine laughter, dynamic joyful movement' },
  { id: 'linked_lean', prompt: 'medium shot framing at waist level, arms linked, she leaning head on his shoulder, both with content smiles, intimate medium shot' },
  { id: 'behind_silhouette', prompt: 'couple from behind walking away hand in hand, looking at each other, silhouettes against neon lights and lanterns' },
];

const DYNAMIC_CONCEPTS = new Set(['retro_hongkong', 'vintage_record']);

const getVariants = (mode: string, concept: string) => {
  if (DYNAMIC_CONCEPTS.has(concept)) {
    return mode === 'couple' ? CINEMATIC_COUPLE_SHOTS_DYNAMIC : mode === 'groom' ? CINEMATIC_GROOM_SHOTS : CINEMATIC_BRIDE_SHOTS;
  }
  return mode === 'couple' ? COUPLE_SHOT_VARIANTS : mode === 'groom' ? GROOM_SHOT_VARIANTS : BRIDE_SHOT_VARIANTS;
};
const getShotStrength = (mode: string, concept: string, shotIdx: number): number => {
  const variants = getVariants(mode, concept);
  const shot = variants[shotIdx % variants.length];
  const isSelfie = concept === 'iphone_selfie' || concept === 'iphone_mirror';
  const isCruise = concept === 'cruise_sunset' || concept === 'cruise_bluesky';
  if (isSelfie) return 0.22;
  if (DETAIL_SHOTS.has(shot.id)) return 0.38;
  if (WIDE_SHOTS.has(shot.id)) return mode === 'couple' ? 0.30 : 0.35;
  if (CLOSEUP_SHOTS.has(shot.id)) return mode === 'couple' ? 0.18 : 0.22;
  if (isCruise) return mode === 'couple' ? 0.28 : 0.30;
  if (DYNAMIC_CONCEPTS.has(concept)) return mode === 'couple' ? 0.18 : mode === 'bride' ? 0.20 : 0.23;
  if (mode === 'couple') return 0.28;
  return 0.28;
};

const CONCEPT_MOOD: Record<string, string> = {
  beach_sunset: 'wind blowing through hair naturally, barefoot on wet sand, relaxed playful movement, golden hour warmth on skin',
  outdoor_garden: 'dappled sunlight through leaves, soft petal falling, relaxed garden stroll',
  cherry_blossom: 'cherry petals drifting in breeze, soft pink tones, gentle spring wind',
  forest_wedding: 'misty ethereal forest light, dappled sun rays through canopy, mossy ground',
  cruise_sunset: 'ocean breeze windswept hair, golden light on deck railing, relaxed nautical vibe',
  cruise_bluesky: 'bright sea breeze, crisp blue sky, wind in hair, relaxed deck atmosphere',
  city_night: 'neon reflections on wet pavement, moody urban glow, cinematic city depth',
  castle_garden: 'standing outdoors in castle garden, open sky above, natural sunlight, stone pathway underfoot, green hedges surrounding',
  cathedral: 'dramatic stained glass light beams, sacred solemn beauty, high ceiling depth',
  rainy_day: 'rain droplets on umbrella, wet street reflections, cozy intimate closeness',
  autumn_leaves: 'golden leaves falling around couple, warm amber light, crunchy leaf ground',
  winter_snow: 'gentle snowflakes on hair and shoulders, visible breath in cold air, cozy warmth',
  watercolor: 'soft dreamy pastel wash, painterly light diffusion',
  magazine_cover: 'strong editorial lighting, confident powerful pose, high fashion attitude',
  vintage_film: 'warm film grain, slightly faded colors, nostalgic soft focus edges',
  iphone_selfie: 'casual spontaneous vibe, slightly imperfect framing, authentic not posed',
  iphone_mirror: 'mirror reflection with flash, casual standing pose, trendy social media aesthetic',
  vintage_record: 'candid relaxed moment browsing records, warm tungsten glow on skin, LP records surrounding, vinyl turntable spinning, natural smile or looking down at records, intimate cozy nostalgia, retro film grain',
  retro_hongkong: 'candid moment mid-stride, body turned at natural angle, weight on one leg, wind in hair, warm red lantern glow on skin, neon reflections on wet pavement, shallow depth of field f1.4 crowd bokeh, Wong Kar-wai intimate mood, gentle natural smile, relaxed body language, cinematic Fuji Superia grain',
};

const buildPrompt = (concept: string, category: string, mode: string, shotIdx: number): string => {
  const allConcepts = { ...STUDIO_CONCEPTS, ...CINEMATIC_CONCEPTS };
  const scene = allConcepts[concept]?.base || STUDIO_CONCEPTS.studio_classic.base;
  const isCinematic = category === 'cinematic';
  const isHanbok = HANBOK_CONCEPTS.has(concept);
  const variants = getVariants(mode, concept);
  const shot = variants[shotIdx % variants.length];
  const isDetail = DETAIL_SHOTS.has(shot.id);

  const face = 'preserve exact facial features from reference, natural Korean proportions, authentic skin texture';

  const outfitLock = DYNAMIC_CONCEPTS.has(concept) ? 'MUST keep absolutely identical outfit from first shot, same fabric same color same accessories same shoes same hairstyle, do not change any clothing detail' : 'keep identical outfit, hairstyle, accessories from first shot';

  const detailFocus = isDetail
    ? 'sharp macro focus on hands and rings, anatomically correct five fingers per hand, natural finger spacing, realistic ring placement on ring finger'
    : '';

  const cam = isCinematic
    ? 'cinematic 85mm f/1.4, anamorphic bokeh, filmic grading'
    : 'Canon EOS R5 85mm f/1.4, natural light, fine grain';

  const hanbokExtra = isHanbok
    ? ', authentic hanbok silk texture, accurate layering and draping'
    : '';

  const mood = CONCEPT_MOOD[concept] || '';

  if (mode === 'couple') {
    const gOutfit = OUTFIT_GROOM[concept] || OUTFIT_GROOM.studio_classic;
    const bOutfit = OUTFIT_BRIDE[concept] || OUTFIT_BRIDE.studio_classic;
    const coupleNatural = 'natural relaxed body language, genuine warm smiles, not stiff not rigid, candid authentic interaction';
    return `${shot.prompt}, ${coupleNatural}, ${mood}, ${isCinematic ? 'cinematic' : 'professional'} Korean wedding photo, man ${gOutfit}, woman ${bOutfit}, ${scene}, ${face}, ${outfitLock}${hanbokExtra}, ${detailFocus}, ${cam}`.replace(/, ,/g, ',');
  }

  const clothe = mode === 'groom'
    ? (OUTFIT_GROOM[concept] || OUTFIT_GROOM.studio_classic)
    : (OUTFIT_BRIDE[concept] || OUTFIT_BRIDE.studio_classic);
  const subj = mode === 'groom' ? 'Korean groom' : 'Korean bride';
  return `${shot.prompt}, ${mood}, ${isCinematic ? 'cinematic' : 'professional'} ${subj} wedding portrait, ${clothe}, ${scene}, ${face}, ${outfitLock}${hanbokExtra}, ${detailFocus}, ${cam}`.replace(/, ,/g, ',');
};

const buildNegativePrompt = (mode: string, concept: string, shotIdx?: number): string => {
  const base = 'deformed face, elongated face, stretched face, pinched nose, bulbous nose, uncanny valley, plastic skin, wax figure, 3D render, cartoon, anime, illustration, painting, doll-like, mannequin, blurry, low quality, watermark, text overlay, collage, grid, multiple frames, split screen, four panel, multi image, photo strip, contact sheet, neon glow on skin, blue light artifact, lens flare on face, color fringing';
  const consistencyBlock = 'different outfit, changed clothes, different hairstyle, altered jewelry, wardrobe change, accessories swapped';
  const male = 'overly angular jaw, exaggerated chin, feminized male face, airbrush skin';
  const female = 'masculine jaw, wide nose bridge, overly sharp features, generic AI face';

  const variants = getVariants(mode, concept);
  const shot = shotIdx !== undefined ? variants[shotIdx % variants.length] : null;
  const isDetail = shot && DETAIL_SHOTS.has(shot.id);
  const detailNeg = isDetail
    ? ', extra fingers, merged fingers, missing fingers, deformed hands, fused digits, wrong finger count, six fingers, four fingers, unnatural hand pose, melted ring, blurred ring, malformed jewelry, twisted wrist'
    : '';

  const isSelfie = concept === 'iphone_selfie' || concept === 'iphone_mirror';
  const mirrorExtra = concept === 'iphone_mirror' ? ', second person reflection, dirty mirror, cracked mirror' : '';
  const selfieNeg = isSelfie ? ', perfect studio lighting, ring light reflection, heavily retouched skin, stiff formal pose, warm golden color cast, orange skin tone' : '';

  const isHanbok = HANBOK_CONCEPTS.has(concept);
  const hanbokNeg = isHanbok ? ', Japanese kimono, Chinese hanfu, inaccurate hanbok structure, wrong collar direction, synthetic fabric' : '';

  if (mode === 'groom') return `${base}, ${consistencyBlock}, ${male}${detailNeg}${hanbokNeg}${selfieNeg}${mirrorExtra}`;
  if (mode === 'bride') return `${base}, ${consistencyBlock}, ${female}${detailNeg}${hanbokNeg}${selfieNeg}${mirrorExtra}`;
  return `${base}, ${consistencyBlock}, ${male}, ${female}, stiff pose, rigid body, passport photo, mugshot, expressionless, arms at sides${detailNeg}${hanbokNeg}${selfieNeg}${mirrorExtra}`;
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
    const variantLen = getVariants(effectiveMode, pack.concept).length;
    const shotIdx = Math.floor(Math.random() * variantLen);
    const prompt = buildPrompt(pack.concept, pack.category, effectiveMode, shotIdx);
    const negativePrompt = buildNegativePrompt(effectiveMode, pack.concept, shotIdx);

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
          body: JSON.stringify({ prompt, image_urls: imageUrls, negative_prompt: negativePrompt, strength: getShotStrength(effectiveMode, pack.concept, shotIdx), num_images: 1 }),
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

        let finalUrl = falUrl!;
        const skipSwapShots = new Set(['closeup_foreheads', 'cheek_kiss_close', 'nose_touch', 'whisper_ear']);
        const currentShot = getVariants(effectiveMode, pack.concept)[shotIdx % getVariants(effectiveMode, pack.concept).length];
        const shouldSwap = effectiveMode === 'couple' && inputUrlsArr.length >= 2 && !skipSwapShots.has(currentShot.id);
        if (false && shouldSwap) {
          try {
            const groomFace = inputUrlsArr[0];
            const brideFace = inputUrlsArr[1];
            const swapPass1 = await falFetch('https://fal.run/fal-ai/face-swap', {
              method: 'POST',
              body: JSON.stringify({ base_image_url: finalUrl, swap_image_url: groomFace }),
            });
            if (swapPass1?.image?.url) {
              const check1 = await fetch(swapPass1.image.url, { method: 'HEAD' });
              const size1 = parseInt(check1.headers.get('content-length') || '0', 10);
              if (size1 > 10000) {
                finalUrl = swapPass1.image.url;
                const swapPass2 = await falFetch('https://fal.run/fal-ai/face-swap', {
                  method: 'POST',
                  body: JSON.stringify({ base_image_url: finalUrl, swap_image_url: brideFace }),
                });
                if (swapPass2?.image?.url) {
                  const check2 = await fetch(swapPass2.image.url, { method: 'HEAD' });
                  const size2 = parseInt(check2.headers.get('content-length') || '0', 10);
                  if (size2 > 10000) {
                    finalUrl = swapPass2.image.url;
                  }
                }
              }
            }
          } catch (swapErr: any) {
            console.log('Face-swap skipped:', swapErr.message);
          }
        }

        const permanentUrl = await uploadToCloudinary(finalUrl, snap.id);
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
