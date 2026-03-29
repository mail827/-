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

    });
    return result.secure_url;
  } catch {
    return imageUrl;
  }
};

const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_BASE = 'https://ark.ap-southeast.bytepluses.com/api/v3';

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
    base: 'modern minimalist white studio with clean white walls, large floor-to-ceiling windows casting soft natural daylight, gentle shadows on polished light floor, airy open space, refined contemporary elegance',
  },
  studio_gallery: {
    label: '갤러리',
    base: 'minimal white architectural studio with large curved white plaster arch structures, smooth seamless white floor and walls, soft diffused natural light from tall arched windows on the left, clean airy bright contemporary space',
  },
  studio_fog: {
    label: '포그',
    base: 'warm-toned intimate studio with large flowing cream linen fabric draped from ceiling to floor as backdrop with soft natural wrinkles and folds, warm beige concrete floor, single dried pampas grass arrangement in ceramic vase to the side, soft warm diffused studio light',
  },
  studio_mocha: {
    label: '모카',
    base: 'moody dark studio with smooth dark mocha brown painted wall with subtle plaster texture, polished dark concrete floor, single round warm spotlight from above creating soft pool of golden light, dramatic yet minimal atmosphere',
  },
  studio_sage: {
    label: '세이지',
    base: 'modern editorial studio with muted sage green painted wall, single curved cream boucle sofa, light oak wooden herringbone floor, sheer white curtain with soft natural window light, calm muted green and cream tones, even studio lighting no harsh shadows',
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
    base: 'traditional Korean historical drama film set, wooden hanok palace corridor with painted dancheong ceiling beams, warm natural daylight through paper lattice doors, traditional wooden floor, museum-quality recreation of Joseon era interior, cinematic warm tone',
  },
  hanbok_flower: {
    label: '꽃한복',
    base: 'wide spacious hanok courtyard with blooming spring flowers, cherry blossoms and azaleas framing the scene in background, stone pathway center, petals gently falling, warm golden spring sunlight, romantic traditional garden with room for two people',
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
    base: 'tall ancient oak forest with warm golden sunlight streaming through dense green canopy, natural mossy forest floor with ferns and wildflowers, soft dappled light, peaceful serene woodland atmosphere',
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
  black_swan: {
    label: '블랙스왈',
    base: 'dark moody cinematic atmosphere, gothic European stone cathedral interior with towering stained glass windows casting deep blue and purple light, dramatic chiaroscuro lighting, cold blue tones, dark stone columns and arches, haunting beautiful tension, dark romantic elegance, film grain',
  },
  blue_hour: {
    label: '블루아워',
    base: 'romantic European cobblestone street at twilight blue hour, vintage wrought-iron street lamp casting warm golden glow, old stone buildings with warm lit windows, purple blue gradient sky after sunset, cinematic warm-cool contrast lighting, dreamy romantic atmosphere, film grain',
  },
  velvet_rouge: {
    label: '벨벳 루즈',
    base: 'dark moody cinematic atmosphere, warm golden candlelight against deep shadows, aristocratic darkly romantic elegance, dreamlike trance-like mood, neither smiling nor sad but entranced and mesmerizing, film grain',
  },
  water_memory: {
    label: '물의 기억',
    base: 'dreamlike cinematic atmosphere, ethereal teal tones, film grain',
  },
  rose_garden: {
    label: '장미 정원',
    base: 'lavish rococo salon with pale pink walls gilded ornate mirrors white iron trellis covered in climbing pink roses crystal chandelier with candle lights pastel pink dreamy hazy atmosphere',
  },
  grass_rain: {
    label: '풀밭',
    base: 'wide green grassy hillside field on overcast rainy day mist hanging low grey sky flat diffused light muted desaturated green analog film grain atmosphere',
  },
  eternal_blue: {
    label: '블루',
    base: 'empty grey winter beach at dusk cold desaturated blue-grey monochrome fading edges heavy film grain melancholic memory atmosphere',
  },
  heart_editorial: {
    label: '하이 에디토리얼',
    base: 'dark editorial fashion studio pure black background hard directional single light source high contrast graphic fashion photograph',
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
  { id: 'full_front', prompt: 'full body shot, elegant contrapposto pose, one hand lightly resting at side, relaxed natural smile, gentle eye contact, graceful posture' },
  { id: 'upper_body', prompt: 'upper body portrait, slightly turned 30 degrees, chin slightly lifted, warm natural smile, soft eye contact, relaxed shoulders' },
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

const STUDIO_COUPLE_SHOTS = [
  { id: 'seated_sofa', prompt: 'couple seated together on sofa, she leaning into him, relaxed intimate, natural warm smiles' },
  { id: 'leaning_wall', prompt: 'couple leaning against wall together, his arm around her waist, casual elegant pose, looking at camera' },
  { id: 'forehead_touch', prompt: 'foreheads gently touching, eyes closed, intimate peaceful moment, standing close' },
  { id: 'back_hug_stand', prompt: 'back hug pose standing, his arms wrapped around her from behind, both smiling warmly, cozy natural' },
  { id: 'facing_close', prompt: 'couple facing each other very close, noses almost touching, gentle smiles, romantic tension' },
  { id: 'laughing_candid', prompt: 'couple laughing together candidly, genuine joy, she playfully touching his chest, natural movement' },
  { id: 'seated_floor', prompt: 'couple sitting on floor together, relaxed legs extended or crossed, leaning on each other, casual intimate' },
  { id: 'dancing_slow', prompt: 'slow dance pose, his hand on her waist her hand on his shoulder, swaying gently, romantic quiet moment' },
  { id: 'cheek_kiss', prompt: 'gentle cheek kiss, natural loving gesture, her hand on his lapel, soft intimate moment' },
  { id: 'side_embrace', prompt: 'standing side by side, his arm around her shoulder pulling her close, her arm around his waist, warm comfortable couple' },
];

const STUDIO_GROOM_SHOTS = [
  { id: 'leaning_wall', prompt: 'leaning casually against wall, one hand in pocket, relaxed confident posture, looking at camera' },
  { id: 'seated_chair', prompt: 'seated on chair or sofa arm, natural seated posture with two legs visible, relaxed leaning forward slightly, hands clasped, natural confident, anatomically correct body proportions' },
  { id: 'adjusting_jacket', prompt: 'adjusting jacket lapel or cuff, natural grooming gesture, three quarter angle, composed elegant' },
  { id: 'standing_relaxed', prompt: 'standing relaxed, one hand in pocket, slight smile, full body natural pose' },
  { id: 'profile_look', prompt: 'profile view looking to the side, contemplative calm expression, dramatic side lighting' },
  { id: 'bust_confident', prompt: 'tight framing from chest up, looking directly at camera with relaxed confident expression, soft studio light on face, shallow depth of field' },
  { id: 'closeup_smile', prompt: 'extreme closeup framing from shoulders up, natural genuine smile, warm eye contact with camera, soft directional light sculpting face' },
  { id: 'bust_side', prompt: 'bust shot from chest up, three quarter turn looking over shoulder toward camera, jawline lit by side light, calm composed expression' },
];

const STUDIO_BRIDE_SHOTS = [
  { id: 'seated_elegant', prompt: 'seated elegantly on sofa or chair, natural seated posture with two legs visible beneath dress, dress draped beautifully, hands resting on lap, soft gaze at camera, anatomically correct body proportions' },
  { id: 'touching_hair', prompt: 'gently touching hair or tucking strand behind ear, soft natural smile, three quarter angle' },
  { id: 'looking_window', prompt: 'standing near window light, looking slightly to side, natural backlit glow, contemplative serene' },
  { id: 'walking_toward', prompt: 'walking toward camera, dress flowing with movement, confident elegant stride, slight smile' },
  { id: 'leaning_wall', prompt: 'leaning gently against wall, relaxed pose, one hand lightly on skirt, natural warm expression' },
  { id: 'bust_soft', prompt: 'tight framing from chest up, soft natural smile, gentle eye contact, window light illuminating face, shallow depth of field blurring background' },
  { id: 'closeup_gaze', prompt: 'extreme closeup framing from shoulders up, looking directly at camera with serene expression, soft light on cheekbones, delicate natural beauty' },
  { id: 'bust_profile', prompt: 'bust shot from chest up, elegant profile or three quarter angle, light catching jawline and collarbone, peaceful calm expression' },
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
  studio_gallery: 'wearing charcoal grey wool-silk single-breasted one-button blazer with exaggerated angular peaked lapel with crisp geometric edges, light grey silk mock-neck top no collar, charcoal tailored straight-leg trousers with sharp center crease, black matte leather oxford shoes, architectural sharp silhouette',
  studio_fog: 'wearing light grey wool-cashmere single-breasted two-button blazer with notch lapel and soft matte brushed texture, white linen band-collar shirt all buttons closed minimal, light grey straight-leg trousers, light grey suede desert boots, quiet tonal grey no accessories',
  studio_mocha: 'wearing dark warm taupe brown wool gabardine single-breasted one-button blazer with notch lapel muted earthy tone like dried clay, ivory cotton open-collar shirt relaxed no tie, dark warm brown straight-leg trousers, dark brown matte leather shoes, understated earthy elegance',
  studio_sage: 'wearing off-white matte wool-blend single-breasted two-button blazer with shawl collar soft chalky texture like unglazed porcelain, pure white fine gauge crew-neck knit top, off-white straight-leg trousers, white leather minimal sneakers, no accessories, clean ethereal',
  outdoor_garden: 'wearing navy blue suit with white shirt, floral boutonniere pinned to lapel',
  beach_sunset: 'wearing light beige linen suit with open collar white shirt, barefoot',
  hanbok_wonsam: 'MUST wear heukdallyeong (black ceremonial robe with golden circular embroidery on chest) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, samo headpiece (official Korean groom wedding hat with angular wings), gold-embroidered wide belt over white inner jeogori, NOT a western suit NOT a coat NOT modern clothing, authentic traditional Korean royal groom wedding attire',
  hanbok_dangui: 'wearing jade-green dopo (Korean scholar overcoat) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, yugeon (soft fabric headband), white inner jeogori visible underneath, delicate jade ornament at waist, NOT a western suit NOT a coat, refined traditional Korean scholar groom attire',
  hanbok_modern: 'wearing charcoal gray modern durumagi (Korean traditional long overcoat) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, Korean traditional fabric texture, white inner jeogori with mandarin collar visible at neckline, NOT a western suit NOT a blazer NOT a trench coat, contemporary minimalist Korean hanbok groom attire',
  hanbok_saeguk: 'wearing dark navy blue dopo (long traditional Korean overcoat) over white inner robe, traditional V-shaped crossed collar, hair pulled up in traditional Korean topknot with simple black gat hat (wide brimmed Korean traditional hat), subtle gold thread embroidery at hem, dignified composed posture, Korean historical drama nobleman wedding attire, NOT Chinese NOT imperial NOT dragon robe NOT crown',
  hanbok_flower: 'wearing ivory white durumagi (Korean traditional long overcoat) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, subtle floral embroidery at hem, soft pastel inner jeogori visible at neckline, small flower accent, NOT a western suit NOT a blazer, gentle spring Korean hanbok groom attire',
  cherry_blossom: 'wearing soft gray suit with light pink boutonniere, white pocket square',
  city_night: 'wearing sleek black tuxedo with satin lapels, black bow tie, cufflinks',
  forest_wedding: 'wearing dark charcoal wool suit with forest green silk tie, simple white boutonniere, polished leather shoes',
  castle_garden: 'wearing classic black formal morning suit with vest, patterned tie',
  cathedral: 'wearing refined charcoal morning suit with ivory vest, patterned silk tie',
  watercolor: 'wearing cream colored linen suit with no tie, relaxed artistic elegance',
  magazine_cover: 'wearing designer black suit with perfect fit, strong editorial style',
  rainy_day: 'wearing dark navy coat suit, holding umbrella',
  autumn_leaves: 'wearing warm brown tweed suit with earth tones',
  winter_snow: 'wearing charcoal wool coat suit, winter layers',
  vintage_film: 'wearing warm camel brown tweed three-piece suit with wide peaked lapels, matching brown vest with gold buttons, cream white dress shirt with wide pointed collar visible over vest, brown patterned wide tie, brown leather oxford shoes, same outfit in every shot, 1970s retro groom',
  cruise_sunset: 'wearing cream beige linen suit, white open collar shirt, no tie, golden hour nautical groom elegance',
  cruise_bluesky: 'wearing cream beige linen suit, white open collar shirt, no tie, nautical groom elegance',
  vintage_record: 'wearing olive khaki brown wide-lapel vintage blazer over light blue open-collar dress shirt with wide pointed collar visible over blazer lapels, grey pinstripe pleated trousers, brown leather oxford shoes, same outfit in every shot, 1970s retro groom',


  retro_hongkong: 'wearing dark burgundy wine double-breasted blazer with silky sheen over black silk shirt unbuttoned showing collarbone, ivory pocket square, black slim trousers, black chelsea boots, relaxed confident lean with hand in pocket, effortless cool charm',
  iphone_selfie: 'wearing casual white shirt with rolled sleeves, relaxed natural look, no tie no jacket',
  iphone_mirror: 'wearing casual white shirt with rolled sleeves, relaxed natural look, no tie no jacket, holding phone for mirror selfie',
  black_swan: 'wearing black silk-satin shawl-collar blazer over black silk-georgette relaxed collarless shirt with moderate V-neckline showing collarbones only, shirt tucked in, black high-waisted wide-leg tailored trousers, thin black leather belt with matte buckle, black chelsea boots, all-black no accessories, dark sophisticated elegance',
  blue_hour: 'wearing classic navy blue fine wool two-piece suit, single-breasted two-button blazer with notch lapel fitted silhouette, crisp white dress shirt with top button undone no tie, navy blue tailored slim trousers, dark brown leather oxford shoes, simple classic timeless gentleman',
  velvet_rouge: 'wearing deep dark teal-green silk single-breasted one-button blazer with peaked lapel and refined luminous sheen like aged jade NOT bright turquoise NOT mint, black silk open-collar shirt no tie top two buttons undone, dark teal tailored slim-straight trousers in same silk fabric, black polished leather oxford shoes, no pocket square no accessories, aristocratic sharp darkly romantic',
  water_memory: 'wearing pearl-white silk mikado single-breasted peaked lapel suit with visible luminous silk sheen like wet porcelain, NOT linen NOT matte NOT cream beige, white silk open-collar shirt no tie showing collarbones, pearl-white slim-straight trousers in same silk mikado fabric, white leather minimal dress shoes, entire outfit has unified pearlescent silk glow, ethereal dreamlike elegance',
  rose_garden: 'wearing pale warm beige soft wool two-button suit with natural shoulders and relaxed comfortable drape, ivory cream silk tie in loose four-in-hand knot over white cotton dress shirt with soft spread collar, ivory silk pocket square tucked casually, soft brushed matte texture, romantic elegant groom',
  grass_rain: 'wearing black wool slim-fit two-button suit with natural shoulders, white cotton shirt with collar open no tie, jacket worn casually unbuttoned, clean simple silhouette, natural relaxed groom',
  eternal_blue: 'wearing slate blue-grey wool one-button suit with slim peak lapels and clean sharp silhouette, white silk shirt with spread collar top button undone no tie, small pearl pin on left lapel as only accessory, cool melancholic elegance',
  heart_editorial: 'wearing sharp black wool double-breasted six-button jacket with extreme wide peaked lapels and heavily structured squared shoulders, matching high-waisted wide-leg trousers with razor-sharp front crease, crisp white shirt buttoned to top with narrow black silk tie pulled very tight, single small red fabric heart pinned on left lapel, bold graphic power silhouette, editorial fashion',
};

const OUTFIT_BRIDE: Record<string, string> = {
  studio_classic: 'wearing white haute couture strapless sweetheart bell gown with sculpted white silk mikado bodice, bell skirt constructed of hundreds of individually cut white silk organza petals in elongated wave shapes layered and overlapping like ocean ripples frozen in motion, each petal heat-shaped to curl slightly at edges creating three-dimensional depth, petals denser at waist gradually more sparse toward hem revealing sheer tulle underneath, long sweeping train',
  studio_gallery: 'wearing white haute couture strapless sweetheart bell gown with sculpted white silk mikado bodice, bell skirt constructed of hundreds of individually cut white silk organza petals in elongated wave shapes layered and overlapping like ocean ripples frozen in motion, each petal heat-shaped to curl at edges creating three-dimensional depth, petals denser at waist gradually sparse toward hem revealing tulle underneath, long sweeping train, natural elegant makeup',
  studio_fog: 'wearing white haute couture strapless sweetheart bell gown that looks like fog, ivory silk crepe smooth minimal bodice, bell skirt with over twenty layers of ultra-sheer white silk organza in gradually varying tones from pure white to softest hint of pale grey at outermost layer, each layer slightly longer than last raw-edged creating soft blurred gradient at hem like dissipating mist, no embellishment no pattern, long fading train, natural elegant makeup',
  studio_mocha: 'wearing white haute couture halterneck bell gown, single wide fabric band of white silk mikado wrapping from front bust up around neck and down open back leaving shoulders bare, clean straight-across neckline, bell skirt of layered white silk organza panels cut in irregular jagged crystalline shapes like cracked glacier ice shards, alternating opaque and sheer panels creating depth with shadow patterns like light through ice, tiny clusters of clear glass micro-beads sparse and subtle, dramatic trailing train, natural elegant makeup',
  studio_sage: 'wearing white haute couture one-shoulder bell gown with single wide sculptural strap over left shoulder of gathered white silk mikado fanning from narrow point into wide dramatic drape across chest wrapping torso asymmetrically, right shoulder completely bare, bell skirt cascading in long vertical knife-pleated panels of white silk organza released at different lengths like streams of water pouring over cliff edge, pleats crisp at waist softening toward hem into fluid ripples, left side longer continuing asymmetry, dramatic sweeping train from left side only, natural elegant makeup',
  outdoor_garden: 'wearing flowing white organza wedding dress with delicate floral embroidery, wildflower bouquet',
  beach_sunset: 'wearing flowing lightweight white chiffon dress with open back, barefoot, windswept hair',
  hanbok_wonsam: 'wearing vibrant red wonsam (ceremonial robe) layered over yellow chima, golden phoenix embroidery across chest and sleeves, elaborate hwagwan (jeweled crown) with dangling ornaments, white socks with kkotsin (flower shoes), holding a ceremonial fan, traditional Korean royal bride wedding attire',
  hanbok_dangui: 'wearing soft blush-pink dangui (short ceremonial jacket) with gold-thread floral embroidery over deep navy chima (skirt), small jokduri (bridal coronet) with jade and coral beads, delicate binyeo (hairpin) in updo, refined elegant traditional Korean bridal attire',
  hanbok_modern: 'wearing pastel lavender modern jeogori with clean lines over white chima (skirt), hair in loose low bun with single minimalist binyeo (silver hairpin), no heavy ornament, contemporary minimalist Korean bridal attire',
  hanbok_saeguk: 'wearing deep emerald green traditional Korean wedding robe with wide sleeves, golden floral embroidery on green silk fabric, white inner collar visible, hair in traditional Korean low chignon bun with small black silk jokduri (low flat minimal Korean bridal headpiece sitting close to head) with minimal gold trim, NOT tall crown NOT multi-gem crown NOT phoenix crown NOT hanging beads NOT imperial Chinese headdress, robe MUST be dark green NOT golden NOT yellow, Korean historical drama traditional bride wedding attire',
  hanbok_flower: 'wearing light lilac jeogori with delicate flower embroidery over soft white chima (skirt), fresh flower hairpin tucked behind ear, loose natural hairstyle with soft waves, romantic spring Korean bridal attire',
  cherry_blossom: 'wearing soft white tulle wedding dress with cap sleeves, delicate flower crown',
  city_night: 'wearing sparkling white sequin evening gown with plunging back, elegant updo',
  forest_wedding: 'wearing elegant white lace gown with natural flowing train, loose wavy hair with simple greenery hairpin, no flower crown no wreath',
  castle_garden: 'wearing magnificent white ball gown with long royal train, tiara, pearl jewelry',
  cathedral: 'wearing classic white cathedral-length wedding gown with long veil, pearl earrings',
  watercolor: 'wearing delicate off-white silk slip dress with thin straps, loose romantic waves in hair',
  magazine_cover: 'wearing haute couture white gown, high fashion editorial style',
  rainy_day: 'wearing white dress, transparent umbrella, romantic rain aesthetic',
  autumn_leaves: 'wearing ivory dress, warm autumn tones',
  winter_snow: 'wearing white fur-trimmed gown, winter wonderland style',
  vintage_film: 'wearing ivory cream vintage lace A-line wedding dress with long bell sleeves, high modest neckline with scalloped lace trim, natural waistline with satin ribbon, ankle-length hem showing white kitten heels, loose natural hair with baby breath flowers, same dress in every shot, 1970s vintage bridal aesthetic',
  cruise_sunset: 'wearing ivory strapless tube top bridal gown with sheer tulle skirt catching golden wind, long tulle veil in sunset light, windswept loose hair, golden hour bridal elegance',
  cruise_bluesky: 'wearing ivory strapless tube top bridal gown with sheer tulle skirt flowing in sea breeze, long tulle veil billowing in wind, windswept loose hair, ethereal nautical bridal elegance',
  vintage_record: 'wearing ivory cream Victorian puff-sleeve wedding dress with sheer floral lace high-neck bodice over sweetheart neckline, short puffy gathered sleeves at shoulder, fitted ivory satin ribbon belt at waist, full A-line satin skirt with front slit, elbow-length white satin opera gloves, short tulle veil on back of head, hair worn completely down and loose past shoulders, same dress same gloves same veil in every shot, 1960s vintage bridal',


  retro_hongkong: 'wearing champagne gold silk satin halter-neck dress with thin spaghetti straps and open cutout sides showing skin, small low mandarin collar detail at neckline, body-hugging silhouette, scattered delicate gold plum blossom embroidery, thigh-high side slit, vintage pearl drop earrings, metallic gold ankle-strap heels, long loose black hair flowing down past shoulders, never tied up never in bun never in updo, hairstyle matching reference photo exactly',
  iphone_selfie: 'wearing casual white blouse or knit top, natural minimal makeup, hair down loosely, relaxed everyday look, no wedding dress',
  iphone_mirror: 'wearing casual white blouse or knit top, natural minimal makeup, hair down loosely, relaxed everyday look, no wedding dress, holding phone for mirror selfie',
  black_swan: 'wearing strapless black matte silk tube top bodice with soft wispy black ostrich feather trim running across entire straight-across bustline neckline like feathery border, single black ostrich feather stole draped over LEFT shoulder only cascading down left arm to elbow right shoulder completely bare, grand floor-length A-line bell silhouette of layered semi-sheer black tulle extremely long pooling and trailing on floor, black ostrich feather clusters scattered along lower tulle layers, natural elegant makeup, subtle lip color, vintage drop earrings, dark ethereal beauty',
  blue_hour: 'wearing deep jewel-tone sapphire blue strapless silk tube top bodice with rich royal blue subtle satin sheen, lightweight silk-chiffon A-line floor-length skirt with slight sweep that moves like liquid, layered inner silk with sheer chiffon overlay that catches air and floats with movement, no beading no sequins no feathers pure clean elegant simplicity, matching blue satin pointed-toe heels, natural dewy makeup, elegant evening glamour',
  velvet_rouge: 'wearing deep crimson red strapless sweetheart haute couture bell gown in crimson silk mikado with soft luminous sheen, grand voluminous bell skirt constructed in layers of crimson silk with overlapping sheer crimson organza panels cut into elongated teardrop shapes resembling peacock tail plumes, hand-embroidered tonal dark burgundy and garnet peacock eye motifs with tiny freshwater pearl at center of each panel, white silk satin opera-length gloves smooth luminous fitted, long straight black hair with see-through bangs, natural elegant makeup with subtle lip color, dramatic sculptural alive with layered movement',
  water_memory: 'wearing ice-blue haute couture strapless sweetheart mermaid gown in silk mikado with refined porcelain-like luminous sheen, fitted bodice with invisible boning hugging body to below knees, below knees dramatic cascading fin-like panels of double-layered silk organza in gradients of ice-blue fading to pale silver-grey to near-transparent edges cut at different lengths like betta fish tail fins, freshwater pearls of varying sizes hand-sewn in organic irregular clusters denser near bodice-to-fin transition thinning outward, long cathedral train, natural elegant makeup',
  rose_garden: 'wearing ivory duchess silk satin off-shoulder wedding dress with softly draped silk folding across collarbone, structured boned corset bodice with smooth clean surface, three small delicate blush pink silk rosettes clustered at left shoulder, full voluminous A-line skirt with long graceful train sweeping floor, no lace no beading no embroidery, opulent rococo bridal elegance',
  grass_rain: 'wearing light ivory silk chiffon halter-neck wedding dress with crossed draped fabric gathered at back of neck leaving shoulders bare, gently fitted bodice with natural soft gathers at waist no boning, multiple opaque layered chiffon skirt panels with slightly uneven raw-edge hemlines creating organic flowing movement, fabric fully opaque with dense layering ensuring complete coverage, clean effortless minimal bridal',
  eternal_blue: 'wearing dusty powder blue strapless sweetheart satin bodice dress with massive voluminous cloud-like tulle ruffled skirt in graduating shades from dusty blue at waist to pale icy blue at hem, tulle layers hand-gathered in irregular cloud-like ruffles creating organic sculptural volume, single strand of small pearls draped loosely across bodice, soft matte tulle finish, no lace no sequins no glitter, dramatic sculptural',
  heart_editorial: 'wearing pure white architectural high mock-neck wedding dress with structured exaggerated square shoulders, rigid sculpted heavy white duchess satin torso like armor, front sharp straight column stopping at ankle, back dramatic floor-sweeping sculptural train of stiff white organza folds like origami paper, one single oversized red fabric heart pinned at center of chest like brooch, no lace no beading no tulle no soft draping, everything geometric and architectural, editorial high fashion',
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
  { id: 'profile_earring', prompt: 'extreme closeup framing at shoulder level, face only side profile close-up, chin slightly lifted, serene expression, subtle elegant earring visible, wind in hair, blurred background' },
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
  { id: 'walking_look', prompt: 'three quarter body walking together mid-stride, turning to look at each other with warm smiles, natural hand holding' },
  { id: 'back_hug_smile', prompt: 'medium shot framing at waist level, back hug from behind, both smiling warmly, her hand on his arm, cozy natural embrace, upper body framing' },
  { id: 'behind_silhouette', prompt: 'couple from behind walking away hand in hand, looking at each other, silhouettes against beautiful background light' },
  { id: 'facing_smile', prompt: 'medium shot framing at waist level, upper body facing each other with warm gentle smiles, intimate close distance, soft natural moment' },
  { id: 'playful_pull', prompt: 'three quarter body playful moment, one pulling other by hand, genuine laughter, dynamic joyful movement' },
  { id: 'cheek_kiss_close', prompt: 'tight closeup framing at chest level, close-up gentle cheek kiss, her hand on his chest, warm spontaneous moment, faces prominent' },
  { id: 'linked_lean', prompt: 'medium shot framing at waist level, arms linked, she leaning head on his shoulder, both with content smiles, intimate medium shot' },
  { id: 'nose_touch', prompt: 'extreme closeup framing at shoulder level, extreme close-up noses almost touching, playful eye contact, warm smiles, romantic tension' },
  { id: 'whisper_ear', prompt: 'tight closeup framing at chest level, close-up him whispering in her ear, she smiles with eyes closed, intimate tender moment' },
];

const DYNAMIC_CONCEPTS = new Set(['retro_hongkong', 'vintage_record', 'cruise_sunset', 'cruise_bluesky', 'black_swan', 'blue_hour', 'water_memory', 'velvet_rouge', 'rose_garden', 'grass_rain', 'eternal_blue', 'heart_editorial']);

const STUDIO_SET = new Set(['studio_classic', 'studio_gallery', 'studio_fog', 'studio_mocha', 'studio_sage']);

const getVariants = (mode: string, concept: string) => {
  if (DYNAMIC_CONCEPTS.has(concept)) {
    return mode === 'couple' ? CINEMATIC_COUPLE_SHOTS_DYNAMIC : mode === 'groom' ? CINEMATIC_GROOM_SHOTS : CINEMATIC_BRIDE_SHOTS;
  }
  if (STUDIO_SET.has(concept)) return mode === 'couple' ? STUDIO_COUPLE_SHOTS : mode === 'groom' ? STUDIO_GROOM_SHOTS : STUDIO_BRIDE_SHOTS;
  return mode === 'couple' ? COUPLE_SHOT_VARIANTS : mode === 'groom' ? GROOM_SHOT_VARIANTS : BRIDE_SHOT_VARIANTS;
};
const getShotStrength = (mode: string, concept: string, shotIdx: number): number => {
  const isSelfie = concept === 'iphone_selfie' || concept === 'iphone_mirror';
  if (isSelfie) return 0.22;
  const variants = getVariants(mode, concept);
  const shot = variants[shotIdx % variants.length];
  const isCloseup = shot.id.startsWith('bust_') || shot.id.startsWith('closeup_');
  if (isCloseup) return mode === 'couple' ? 0.13 : 0.17;
  if (mode === 'couple') return 0.22;
  return 0.20;
};

const CONCEPT_MOOD: Record<string, string> = {
  beach_sunset: 'wind blowing through hair naturally, barefoot on wet sand, relaxed playful movement, golden hour warmth on skin',
  outdoor_garden: 'dappled sunlight through leaves, soft petal falling, relaxed garden stroll',
  cherry_blossom: 'cherry petals drifting in breeze, soft pink tones, gentle spring wind',
  forest_wedding: 'warm golden light filtering through tall trees, natural fern and moss ground, peaceful woodland serenity, nature documentary cinematography',
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


  studio_gallery: 'clean bright airy white space, gentle natural light casting soft geometric shadows through arched windows, serene minimal contemporary atmosphere, 50mm lens',
  studio_fog: 'warm soft diffused light, cream linen texture visible in background, dried pampas grass adding natural warmth, intimate cozy yet refined atmosphere, 50mm lens',
  studio_mocha: 'single dramatic warm spotlight from above creating golden pool of light against dark mocha background, deep shadows surrounding, intimate dramatic gallery atmosphere, 85mm lens',
  studio_sage: 'soft even natural light from sheer curtain, calm muted sage green and cream tones, warm oak floor, organic curved furniture shapes, serene editorial calm, 50mm lens',
  black_swan: 'dark dramatic shadows, moody blue-purple color grading, fog and mist atmosphere, haunting beautiful tension, cold blue tones through stained glass, editorial fashion darkness, 35mm lens',
  velvet_rouge_corridor: 'dark Japanese manor long dim corridor with tatami floors and paper sliding doors, warm candlelight from paper lanterns casting golden glow, deep dramatic shadows, aristocratic moody atmosphere, 35mm lens',
  velvet_rouge_library: 'dark private library with floor-to-ceiling bookshelves filled with old leather-bound books, tufted dark brown leather armchair, single brass desk lamp casting warm golden light, dark wood paneling, Persian rug on floor, intimate amber and deep shadow tones, 50mm lens',
  velvet_rouge_bathtub: 'dimly lit vintage bathroom with large freestanding copper bathtub filled with water, crimson organza skirt floating and spreading in water, steam rising from water, warm golden single overhead light, dark tile walls, moody atmospheric shadows, 35mm lens',
  water_memory_underwater: 'deep dark teal-green underwater, soft caustic light patterns dancing on skin from above, tiny air bubbles floating around, hair floating weightlessly in water, fabrics billowing and spreading in water, ethereal aquatic dreamlike atmosphere, 50mm lens',
  water_memory_theater: 'empty vintage art deco movie theater, faded red velvet seats, warm golden projector beam cutting through darkness with dust particles floating in light, dark teal-green walls with gold art deco trim on ceiling, warm amber and cool teal contrast, intimate cinematic atmosphere, 35mm lens',
  water_memory_rain: 'empty European city street at night in heavy rain, wet reflective asphalt with warm orange puddle reflections, vintage wrought-iron street lamps casting warm glow, rain streaks visible in lamplight, dark moody night with warm-cool contrast, cinematic rain atmosphere, 50mm lens',
  blue_hour: 'warm golden street lamp glow contrasting cool blue twilight sky, romantic European evening, gentle wind catching hair and dress fabric, cinematic warm bokeh city lights, purple-blue sky gradient, 50mm lens',
  retro_hongkong: 'direct harsh on-camera flash fired at subject, bright white flash illuminating face and body against dark night background, flash falloff creating dark shadows behind subject, paparazzi snapshot caught off-guard moment, candid mid-stride body turned at natural angle, weight on one leg, wind in hair, neon reflections on wet pavement, shallow depth of field f1.4 crowd bokeh, Wong Kar-wai intimate mood, relaxed body language, Fuji Superia 400 cross-processed grain',
  rose_garden_salon: 'lavish rococo salon with pale pink walls gilded ornate mirrors white iron trellis covered in climbing pink roses crystal chandelier dripping candle lights, pink velvet chaise longue scattered rose petals and macarons on gold tray, soft diffused pastel pink light dreamy hazy atmosphere, 50mm lens',
  rose_garden_staircase: 'grand curved marble staircase with wrought iron pink rose vine railing in rococo palace interior, pale pink walls with gilded molding, long dress train cascading down five marble steps, soft natural light from tall arched window, pastel pink atmosphere, 35mm lens',
  rose_garden_balcony: 'small ornate stone balcony overlooking pink rose garden below, rococo pale pink exterior wall with gilded window frame, climbing roses around open French doors framing subjects, soft overcast afternoon light, 50mm lens',
  grass_rain_overcast: 'wide green grassy hillside with tall grass and small wildflowers, gentle slope disappearing into horizon, soft overcast flat grey light, muted desaturated green tone, grainy analog film Fuji Superia 400, 85mm lens',
  grass_rain_heavy: 'green field on grey rainy day, fine rain mist visible in air, no sun completely flat grey light, wet grass glistening with water droplets, grainy analog film Kodak Portra 400 pushed two stops, muddy green-grey color palette heavy grain, 50mm lens',
  grass_rain_motion: 'misty green field after rain, low mist hanging over field in distance, everything soft and hazy, grainy analog film on expired film stock, muted washed-out green tones, light leak on edge, 35mm lens',
  eternal_blue_beach: 'empty grey winter beach at dusk, grey overcast sky blending into grey ocean at barely visible horizon, wet dark sand with reflections, edges of frame slightly blurred and darkened as if memory is fading, cool blue-grey desaturated palette, heavy film grain slight lens flare, 35mm lens',
  eternal_blue_frozen: 'frozen cracked lake surface under heavy grey sky, light snow falling, hairline cracks in ice radiating outward, flat cold overcast light casting no shadows, monochromatic blue-white-grey palette, Kodak Vision3 500T blue-shifted film stock, 50mm lens',
  eternal_blue_bookstore: 'tall bookshelves in dimly lit old bookstore, warm single brass desk lamp at end of aisle casting long shadows through gaps between books, dust particles floating in lamplight beam, deep shadow everywhere else, warm tungsten and cool shadow split, intimate atmosphere, 50mm lens',
  heart_editorial_spotlight: 'pure black stage floor with perfect circle of white spotlight, everything outside spotlight circle is pure black void, hard clean edge between light and dark on floor, shot from slightly above, hard theatrical lighting deep contrast, 50mm lens',
  heart_editorial_shadow: 'plain white wall with sharp black shadow silhouettes projected by single hard side light source, shadow play with silhouette profiles visible on wall, high contrast with only red fabric hearts in color rest monochrome, hard directional side light, 35mm lens',
  heart_editorial_dark: 'dark studio with single hard beauty dish light from directly above casting defined shadows under cheekbones and chin, everything else falls to pure black, only white dress black suit two red hearts and skin tones visible in frame, heavy contrast editorial fashion, 85mm lens',
};

const buildPrompt = (concept: string, category: string, mode: string, shotIdx: number): string => {
  const allConcepts = { ...STUDIO_CONCEPTS, ...CINEMATIC_CONCEPTS };
  const scene = allConcepts[concept]?.base || STUDIO_CONCEPTS.studio_classic.base;
  const isCinematic = category === 'cinematic';
  const isHanbok = HANBOK_CONCEPTS.has(concept);
  const variants = getVariants(mode, concept);
  const shot = variants[shotIdx % variants.length];
  const isDetail = DETAIL_SHOTS.has(shot.id);

  const face = 'CRITICAL INSTRUCTION: preserve the EXACT original face from the reference photo. Do NOT modify eyes, do NOT add double eyelids, do NOT change eye shape or eye size. Keep the exact same nose, lips, jaw shape, face proportions unchanged. Do NOT beautify, do NOT slim the face, do NOT enhance jawline. The face must be identical to the input photo. photorealistic 8k quality. Do NOT add any text, logos, or watermarks. Do NOT create deformed hands or extra fingers. Keep clean elegant clothing with no distortion or melting textures';

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

  const VELVET_ROUGE_SCENES = ['velvet_rouge_corridor', 'velvet_rouge_library', 'velvet_rouge_bathtub'];
  const WATER_MEMORY_SCENES = ['water_memory_underwater', 'water_memory_theater', 'water_memory_rain'];
  const ROSE_GARDEN_SCENES = ['rose_garden_salon', 'rose_garden_staircase', 'rose_garden_balcony'];
  const GRASS_RAIN_SCENES = ['grass_rain_overcast', 'grass_rain_heavy', 'grass_rain_motion'];
  const ETERNAL_BLUE_SCENES = ['eternal_blue_beach', 'eternal_blue_frozen', 'eternal_blue_bookstore'];
  const HEART_EDITORIAL_SCENES = ['heart_editorial_spotlight', 'heart_editorial_shadow', 'heart_editorial_dark'];
  const mood = concept === 'velvet_rouge' ? (CONCEPT_MOOD[VELVET_ROUGE_SCENES[shotIdx % 3]] || '') : concept === 'water_memory' ? (CONCEPT_MOOD[WATER_MEMORY_SCENES[shotIdx % 3]] || '') : concept === 'rose_garden' ? (CONCEPT_MOOD[ROSE_GARDEN_SCENES[shotIdx % 3]] || '') : concept === 'grass_rain' ? (CONCEPT_MOOD[GRASS_RAIN_SCENES[shotIdx % 3]] || '') : concept === 'eternal_blue' ? (CONCEPT_MOOD[ETERNAL_BLUE_SCENES[shotIdx % 3]] || '') : concept === 'heart_editorial' ? (CONCEPT_MOOD[HEART_EDITORIAL_SCENES[shotIdx % 3]] || '') : (CONCEPT_MOOD[concept] || '');

  if (mode === 'couple') {
    const gOutfit = OUTFIT_GROOM[concept] || OUTFIT_GROOM.studio_classic;
    const bOutfit = OUTFIT_BRIDE[concept] || OUTFIT_BRIDE.studio_classic;
    const coupleNatural = 'natural relaxed body language, genuine warm smiles, not stiff not rigid, candid authentic interaction';
    return `${face}, ${shot.prompt}, ${coupleNatural}, ${mood}, ${isCinematic ? 'cinematic' : 'professional'} Korean wedding photo, man ${gOutfit}, woman ${bOutfit}, ${scene}, ${outfitLock}${hanbokExtra}, ${detailFocus}, ${cam}`.replace(/, ,/g, ',');
  }

  const clothe = mode === 'groom'
    ? (OUTFIT_GROOM[concept] || OUTFIT_GROOM.studio_classic)
    : (OUTFIT_BRIDE[concept] || OUTFIT_BRIDE.studio_classic);
  const subj = mode === 'groom' ? 'Korean groom' : 'Korean bride';
  return `${face}, ${shot.prompt}, ${mood}, ${isCinematic ? 'cinematic' : 'professional'} ${subj} wedding portrait, ${clothe}, ${scene}, ${outfitLock}${hanbokExtra}, ${detailFocus}, ${cam}`.replace(/, ,/g, ',');
};

const buildNegativePrompt = (mode: string, concept: string, shotIdx?: number): string => {
  const base = 'deformed face, elongated face, stretched face, pinched nose, bulbous nose, uncanny valley, plastic skin, wax figure, 3D render, cartoon, anime, illustration, painting, doll-like, mannequin, blurry, low quality, watermark, text overlay, collage, grid, multiple frames, split screen, four panel, multi image, photo strip, contact sheet, neon glow on skin, blue light artifact, lens flare on face, color fringing, glowing earring, sparkling earring, lens flare on earring, star burst on jewelry, bright light reflecting off earring, extra fingers, merged fingers, missing fingers, deformed hands, fused digits, six fingers, four fingers, malformed hands, twisted wrist, deformed legs, missing legs, fused legs, extra limbs, melted lower body, amorphous body below waist, blob-like dress with no body structure';
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
  const isSaeguk = concept === 'hanbok_saeguk';
  const hanbokNeg = isHanbok ? ', Japanese kimono, Chinese hanfu, inaccurate hanbok structure, wrong collar direction, synthetic fabric' : '';
  const saegukNeg = isSaeguk ? ', tall crown, multi-gem crown, phoenix crown, imperial Chinese headdress, hanging beads over face, forbidden city, dragon throne, golden dragon screen, Ming dynasty, Qing dynasty, Chinese emperor, Chinese empress, ornate golden tiara, bead curtain headpiece, yellow imperial robe' : '';

  if (mode === 'groom') return `${base}, ${consistencyBlock}, ${male}${detailNeg}${hanbokNeg}${saegukNeg}${selfieNeg}${mirrorExtra}`;
  if (mode === 'bride') return `${base}, ${consistencyBlock}, ${female}${detailNeg}${hanbokNeg}${saegukNeg}${selfieNeg}${mirrorExtra}`;
  return `${base}, ${consistencyBlock}, ${male}, ${female}, stiff pose, rigid body, passport photo, mugshot, expressionless, arms at sides${detailNeg}${hanbokNeg}${saegukNeg}${selfieNeg}${mirrorExtra}`;
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

router.post('/reset-chain/:packId', authMiddleware, async (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role !== 'ADMIN') return res.status(403).json({ error: 'admin only' });
  try {
    await prisma.snapPack.update({ where: { id: req.params.packId }, data: { chainRefUrls: {} } });
    res.json({ success: true, message: 'chainRef 초기화 완료' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
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


router.patch("/pack/:packId/photos", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { packId } = req.params;
    const { index, url } = req.body;
    const pack = await prisma.snapPack.findFirst({ where: { id: packId, userId: req.user!.id } });
    if (!pack) return res.status(404).json({ error: "Pack not found" });
    const urls = pack.inputUrls as string[];
    if (index < 0 || index >= urls.length) return res.status(400).json({ error: "Invalid index" });
    urls[index] = url;
    const updated = await prisma.snapPack.update({ where: { id: packId }, data: { inputUrls: urls } });
    res.json({ inputUrls: updated.inputUrls });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
  const { packId, mode } = req.body;

  try {
    const pack = await prisma.snapPack.findUnique({ where: { id: packId }, include: { snaps: true } });
    if (!pack || pack.status !== 'PAID') return res.status(400).json({ error: '결제된 팩이 아닙니다' });
    if (pack.usedSnaps >= pack.totalSnaps) return res.status(403).json({ error: '생성 가능 횟수 초과', needExtra: true });

    const effectiveMode = mode || pack.mode;
    const variantLen = getVariants(effectiveMode, pack.concept).length;
    const modeCount = await prisma.aiSnap.count({ where: { snapPackId: pack.id, mode: effectiveMode } });
    const shotIdx = modeCount % variantLen;
    const prompt = buildPrompt(pack.concept, pack.category, effectiveMode, shotIdx);
    const negativePrompt = buildNegativePrompt(effectiveMode, pack.concept, shotIdx);

    const rawInputUrls = pack.inputUrls as string[];
    const inputUrlsArr = rawInputUrls.map((url: string) => {
      if (url.includes('cloudinary.com') && url.includes('/upload/')) {
        return url.replace('/upload/', '/upload/c_fill,ar_3:4,g_face,w_900,h_1200/');
      }
      return url;
    });
    const chainRefs = (pack.chainRefUrls || {}) as Record<string, string>;
    let imageUrls: string[];

    const shouldResetChain = modeCount > 0 && modeCount % 5 === 0;

    const useChain = !STUDIO_SET.has(pack.concept);
    if (effectiveMode === "groom") {
      const ref = (useChain && !shouldResetChain) ? chainRefs.groom : null;
      imageUrls = ref ? [ref, inputUrlsArr[0]] : [inputUrlsArr[0]];
    } else if (effectiveMode === "bride") {
      const ref = (useChain && !shouldResetChain) ? chainRefs.bride : null;
      imageUrls = ref ? [ref, inputUrlsArr[1]] : [inputUrlsArr[1]];
    } else {
      const refs: string[] = [];
      if (useChain && !shouldResetChain) {
        if (chainRefs.couple) refs.push(chainRefs.couple);
        if (chainRefs.groom) refs.push(chainRefs.groom);
        if (chainRefs.bride) refs.push(chainRefs.bride);
      }
      const base = inputUrlsArr.length >= 3
        ? [inputUrlsArr[2], inputUrlsArr[0], inputUrlsArr[1]]
        : inputUrlsArr.slice(0, 2);
      imageUrls = refs.length > 0 ? [...refs, ...base].slice(0, 4) : base;
    }

    const snap = await prisma.aiSnap.create({
      data: {
        snapPackId: pack.id, userId: pack.userId, concept: pack.concept, mode: effectiveMode,
        engine: 'nano-banana-2', prompt, inputUrls: pack.inputUrls as any, status: 'processing',
      },
    });

    await prisma.snapPack.update({ where: { id: packId }, data: { usedSnaps: pack.usedSnaps + 1 } });

    try {
      if (pack.preferredEngine === 'seedream' && ARK_API_KEY) {
        console.log('[snapPack SeeDream] generating with ARK for snap:', snap.id, 'mode:', effectiveMode);
        let refUrl = '';
        if (effectiveMode === 'bride' && inputUrlsArr.length >= 2) {
          refUrl = inputUrlsArr[1];
        } else if (effectiveMode === 'couple' && inputUrlsArr.length >= 3) {
          refUrl = inputUrlsArr[2];
        } else {
          refUrl = inputUrlsArr[0];
        }
        const sdPrompt = effectiveMode === 'couple'
          ? 'Use the reference image as the same couple. Keep the character identities exactly matching the reference image people, only change outfits and background. Preserve the EXACT faces, hairstyles, hair lengths unchanged. ' + prompt
          : 'Use the reference image as the same person. Keep the character identity exactly matching the reference image person, only change outfit and background. Preserve the EXACT face, hairstyle, hair length unchanged. ' + prompt;

        const arkRes = await fetch(ARK_BASE + '/images/generations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ARK_API_KEY },
          body: JSON.stringify({ model: 'seedream-5-0-260128', prompt: sdPrompt, image: refUrl, size: '2K', output_format: 'png', watermark: false }),
        });

        if (!arkRes.ok) {
          const errText = await arkRes.text().catch(() => '');
          console.error('[snapPack SeeDream] failed:', arkRes.status, errText.slice(0, 500));
          await prisma.aiSnap.update({ where: { id: snap.id }, data: { status: 'failed', errorMsg: 'SeeDream generation failed' } });
          return res.json({ snapId: snap.id, status: 'failed' });
        }

        const arkData = await arkRes.json();
        const sdUrl = arkData.data?.[0]?.url;
        if (!sdUrl) {
          console.error('[snapPack SeeDream] no image url:', JSON.stringify(arkData).slice(0, 500));
          await prisma.aiSnap.update({ where: { id: snap.id }, data: { status: 'failed', errorMsg: 'No image from SeeDream' } });
          return res.json({ snapId: snap.id, status: 'failed' });
        }

        const uploadedUrl = await uploadToCloudinary(sdUrl, snap.id);
        const updatedChain = { ...chainRefs };
        if (effectiveMode === 'groom') updatedChain.groom = uploadedUrl;
        else if (effectiveMode === 'bride') updatedChain.bride = uploadedUrl;
        else updatedChain.couple = uploadedUrl;
        await prisma.snapPack.update({ where: { id: packId }, data: { chainRefUrls: updatedChain } });
        await prisma.aiSnap.update({ where: { id: snap.id }, data: { status: 'done', resultUrl: uploadedUrl, engine: 'seedream' } });
        console.log('[snapPack SeeDream] done:', uploadedUrl.slice(0, 80));
        return res.json({ snapId: snap.id, status: 'done', resultUrl: uploadedUrl });
      }

        const submit = await falFetch(`${FAL_QUEUE}/fal-ai/nano-banana-2/edit`, {
          method: 'POST',
          body: JSON.stringify({ prompt, image_urls: imageUrls, num_images: 1, aspect_ratio: '3:4', resolution: '1K', output_format: 'png' }),
        });

        console.log('[snapPack fal response]', JSON.stringify(submit).slice(0, 300));

        let falUrl: string | null = null;

        if (submit.images && submit.images[0]?.url) {
          falUrl = submit.images[0].url;
        } else if (submit.status_url) {
          await prisma.aiSnap.update({ where: { id: snap.id }, data: { statusUrl: submit.status_url, responseUrl: submit.response_url } });
          return res.json({ snapId: snap.id, shotIndex: shotIdx, remaining: pack.totalSnaps - pack.usedSnaps - 1, status: 'processing' });
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
        const shouldSwap = false;
        if (shouldSwap) {
          try {
            if (effectiveMode === "groom") {
              const swapRes = await falFetch("https://fal.run/fal-ai/face-swap", {
                method: "POST",
                body: JSON.stringify({ base_image_url: finalUrl, swap_image_url: inputUrlsArr[0] }),
              });
              if (swapRes?.image?.url) {
                const check = await fetch(swapRes.image.url, { method: "HEAD" });
                if (parseInt(check.headers.get("content-length") || "0", 10) > 10000) finalUrl = swapRes.image.url;
              }
            } else if (effectiveMode === "bride") {
              const swapRes = await falFetch("https://fal.run/fal-ai/face-swap", {
                method: "POST",
                body: JSON.stringify({ base_image_url: finalUrl, swap_image_url: inputUrlsArr[1] || inputUrlsArr[0] }),
              });
              if (swapRes?.image?.url) {
                const check = await fetch(swapRes.image.url, { method: "HEAD" });
                if (parseInt(check.headers.get("content-length") || "0", 10) > 10000) finalUrl = swapRes.image.url;
              }
            } else {
              const groomFace = inputUrlsArr[0];
              const brideFace = inputUrlsArr[1];
              const swap1 = await falFetch("https://fal.run/fal-ai/face-swap", {
                method: "POST",
                body: JSON.stringify({ base_image_url: finalUrl, swap_image_url: groomFace }),
              });
              if (swap1?.image?.url) {
                const c1 = await fetch(swap1.image.url, { method: "HEAD" });
                if (parseInt(c1.headers.get("content-length") || "0", 10) > 10000) {
                  finalUrl = swap1.image.url;
                  const swap2 = await falFetch("https://fal.run/fal-ai/face-swap", {
                    method: "POST",
                    body: JSON.stringify({ base_image_url: finalUrl, swap_image_url: brideFace }),
                  });
                  if (swap2?.image?.url) {
                    const c2 = await fetch(swap2.image.url, { method: "HEAD" });
                    if (parseInt(c2.headers.get("content-length") || "0", 10) > 10000) finalUrl = swap2.image.url;
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

        if (!chainRefs[effectiveMode] || shouldResetChain) {
          chainRefs[effectiveMode] = permanentUrl;
          await prisma.snapPack.update({
            where: { id: packId },
            data: { chainRefUrls: chainRefs },
          });
        }
    } catch (err: any) {
      console.error('[snapPack generate] FAILED:', err.message);
      await prisma.aiSnap.update({ where: { id: snap.id }, data: { status: 'failed', errorMsg: err.message?.slice(0, 500) } });
      await prisma.snapPack.update({ where: { id: packId }, data: { usedSnaps: { decrement: 1 } } });
      return res.json({ snapId: snap.id, shotIndex: shotIdx, remaining: pack.totalSnaps - pack.usedSnaps - 1, failed: true });
    }
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

    if (snap.status === 'processing' && snap.statusUrl) {
      try {
        const status = await falFetch(snap.statusUrl);
        console.log('[snap poll]', snap.id, 'fal status:', status.status);
        if (status.status === 'COMPLETED' && snap.responseUrl) {
          const result = await falFetch(snap.responseUrl);
          console.log('[snap poll]', snap.id, 'response keys:', Object.keys(result), JSON.stringify(result).slice(0, 400));
          if (result.detail) {
            const errMsg = typeof result.detail === 'string' ? result.detail : JSON.stringify(result.detail).slice(0, 300);
            if (errMsg.includes('unavailable') || errMsg.includes('timeout') || errMsg.includes('Internal Server Error') || errMsg.includes('internal')) {
              console.log('[snap poll]', snap.id, 'fal temp error, retrying submit...');
              try {
                const retryPack = await prisma.snapPack.findUnique({ where: { id: snap.snapPackId! } });
                const retrySubmit = await falFetch(`${FAL_QUEUE}/fal-ai/nano-banana-2/edit`, {
                  method: 'POST',
                  body: JSON.stringify({ prompt: snap.prompt, image_urls: snap.inputUrls as string[], num_images: 1, aspect_ratio: '3:4', resolution: '1K', output_format: 'png' }),
                });
                if (retrySubmit.status_url) {
                  await prisma.aiSnap.update({ where: { id: snap.id }, data: { statusUrl: retrySubmit.status_url, responseUrl: retrySubmit.response_url } });
                  console.log('[snap poll]', snap.id, 'retry submitted');
                  return res.json({ ...snap, status: 'processing' });
                }
              } catch (retryErr: any) {
                console.error('[snap poll]', snap.id, 'retry also failed:', retryErr.message);
              }
            }
            console.error('[snap poll]', snap.id, 'fal error detail:', errMsg);
            await prisma.aiSnap.update({ where: { id: snap.id }, data: { status: 'failed', errorMsg: errMsg, statusUrl: null, responseUrl: null } });
            if (snap.snapPackId) await prisma.snapPack.update({ where: { id: snap.snapPackId }, data: { usedSnaps: { decrement: 1 } } }).catch(() => {});
            const updated = await prisma.aiSnap.findUnique({ where: { id: snap.id } });
            return res.json(updated);
          }
          const falUrl = result.images?.[0]?.url || result.output?.images?.[0]?.url || result.image?.url || result.output?.image?.url;
          console.log('[snap poll]', snap.id, 'falUrl:', falUrl?.slice(0, 80));
          if (falUrl) {
            const validateRes = await fetch(falUrl, { method: 'HEAD' });
            const cType = validateRes.headers.get('content-type') || '';
            const cLen = parseInt(validateRes.headers.get('content-length') || '0', 10);
            console.log('[snap poll]', snap.id, 'validate:', cType, cLen);
            if (cType.startsWith('image/') && cLen > 10000) {
              console.log('[snap poll]', snap.id, 'uploading to cloudinary...');
              const permanentUrl = await uploadToCloudinary(falUrl, snap.id);
              console.log('[snap poll]', snap.id, 'done:', permanentUrl?.slice(0, 60));
              await prisma.aiSnap.update({ where: { id: snap.id }, data: { status: 'done', resultUrl: permanentUrl, statusUrl: null, responseUrl: null } });

              if (snap.snapPackId) {
                const pack = await prisma.snapPack.findUnique({ where: { id: snap.snapPackId } });
                if (pack) {
                  const chainRefs = (pack.chainRefUrls || {}) as Record<string, string>;
                  if (snap.mode && !chainRefs[snap.mode]) {
                    chainRefs[snap.mode] = permanentUrl;
                    await prisma.snapPack.update({ where: { id: snap.snapPackId }, data: { chainRefUrls: chainRefs } });
                  }
                }
              }

              const updated = await prisma.aiSnap.findUnique({ where: { id: snap.id } });
              return res.json(updated);
            }
          }
        } else if (status.status === 'FAILED') {
          await prisma.aiSnap.update({ where: { id: snap.id }, data: { status: 'failed', errorMsg: status.error || 'fal.ai failed', statusUrl: null, responseUrl: null } });
          await prisma.snapPack.update({ where: { id: snap.snapPackId! }, data: { usedSnaps: { decrement: 1 } } }).catch(() => {});
          const updated = await prisma.aiSnap.findUnique({ where: { id: snap.id } });
          return res.json(updated);
        }
      } catch (pollErr: any) {
        console.error('[snap poll] Error:', snap.id, pollErr.message, pollErr.stack?.slice(0, 300));
      }
    }

    res.json(snap);
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/snap/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const snap = await prisma.aiSnap.findUnique({ where: { id: req.params.id } });
    if (!snap) return res.status(404).json({ error: 'Not found' });
    if (snap.userId !== req.user?.id) return res.status(403).json({ error: 'Forbidden' });
    await prisma.aiSnap.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
