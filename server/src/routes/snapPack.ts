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
  hanbok_wonsam: {
    label: '궁중 혼례',
    base: 'vast empty courtyard of Korean royal palace, dark grey stone pavement stretching wide, grand wooden palace hall with dancheong painted eaves in background, haenggak corridors with dark wooden pillars in rhythm, warm ochre paper doors, soft flat overcast light, dignified regal atmosphere',
  },
  hanbok_dangui: {
    label: '당의 한복',
    base: 'warm ondol room with soft yellow-ochre hanji papered walls and floor, dark wooden daecheongmaru open hall of traditional hanok looking out at stone courtyard, curved eaves framing rain or light, traditional Korean garden with plum blossom tree and mossy stone path, brass oil lamp warm amber light, intimate refined atmosphere',
  },
  hanbok_modern: {
    label: '모던 한복',
    base: 'mountain ridge shrouded in thick cold fog with dark pine silhouettes, modern minimalist hanok with clean wooden beams and large glass sliding doors overlooking misty mountain valley, deep curved eaves with heavy rain, narrow wooden staircase with dark wood and clean lines, cool diffused fog light, contemporary restrained atmosphere',
  },
  hanbok_saeguk: {
    label: '사극풍',
    base: 'Joseon palace throne room with dark wooden pillars and painted ilwolobongdo screen of sun moon and five peaks behind throne, ceremonial hall with dark wooden floor and hanji screen doors, queen private chamber with ornate furniture and folding screen, secret rear garden with pine trees and red maple trees beside lotus pond pavilion, cinematic warm tone',
  },
  hanbok_flower: {
    label: '꽃한복',
    base: 'midnight Paris Seine riverbank with old stone quay and iron gas-style lampposts casting warm golden light on wet cobblestones, ornate iron pedestrian bridge over Seine with art nouveau railings and globe lampposts, narrow Parisian side street with corner flower shop window lit warm, long stone arcade with arched ceiling and repeating columns in rain, old dark Parisian carousel with painted horses and faded gold mirrors, cinematic midnight atmosphere',
  },
  cherry_blossom: {
    label: '벚꽃',
    base: 'quiet residential street lined with cherry blossom trees in full bloom forming pale pink canopy overhead, petals drifting slowly in gentle breeze, petal-covered asphalt soft pink, soft flat overcast light no sun no shadows white sky that makes pink petals glow from within, dreamy spring atmosphere, photorealistic cinematic',
  },
};


const CINEMATIC_CONCEPTS: Record<string, { label: string; base: string }> = {
  city_night: {
    label: '시티 나이트',
    base: 'late night city streets with neon signs reflecting on wet pavement, empty crosswalks under sodium streetlamps, rooftop parking garage overlooking city skyline, underground pedestrian passage with flickering fluorescent tubes, taxi backseat with streaking neon lights through windows, urban nocturnal cinematic atmosphere, photorealistic cinematic',
  },
  forest_wedding: {
    label: '숲속 웨딩',
    base: 'dense old-growth forest with massive dark tree trunks rising like cathedral pillars, thick white fog moving slowly between trunks at waist height, deep green moss covering dark wet earth and fallen leaves, flat grey diffused light with no source and no shadow, fog erases everything, the air itself is visible, sacred woodland atmosphere, photorealistic cinematic',
  },
  castle_garden: {
    label: '유럽 궁전',
    base: 'vast empty European palace interior with impossibly high painted ceilings and tall marble columns, grand hall of mirrors with gilded frames, monumental marble staircase, enormous empty ballroom with parquet floor and gilded wall panels, dusty golden light falling from high windows, dust particles floating in light beams, bare and enormous abandoned grandeur, photorealistic cinematic',
  },
  cathedral: {
    label: '성당 웨딩',
    base: 'vast old gothic stone cathedral with soaring ribbed vault ceiling, massive stone pillars lining long center aisle, tall stained glass windows casting pools of deep red blue gold violet colored light across stone floor in geometric patterns, dark oak doors with iron studs, votive candle rack with dozens of flickering candles, sacred solemn Caravaggio chiaroscuro atmosphere, photorealistic cinematic',
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
    base: 'steady rain on quiet Korean street with old low buildings, wet dark asphalt reflecting grey sky, small old bus stop shelter with metal roof and wooden bench, flickering fluorescent tube light, clear vinyl umbrella, silver rain lines falling beyond shelter edge, flat cool diffused overcast light, patient melancholic intimate atmosphere, photorealistic cinematic',
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
  vintage_tungsten: {
    label: '빈티지 텅스텐',
    base: 'dark maximalist vintage room with large rose and tropical leaf wallpaper in deep red and green, old CRT television, tropical houseplants, floor lamp with fabric shade, direct on-camera flash with harsh flat lighting and rapid falloff into darkness, faded warm print colors with magenta tint in highlights and yellow shift in midtones, 1970s amateur wedding photography aesthetic',
  },
  aao: {
    label: '에에올',
    base: 'harsh unromantic fluorescent or sodium vapor lighting, mundane everyday location, deadpan centered composition, surreal couture wedding attire in ordinary setting, photorealistic observational still life quality',
  },
  spring_letter: {
    label: '봄: 러브레터',
    base: 'old quiet library or school corridor with cherry blossom branches pressing against tall windows, petals scattered on wooden floors, soft afternoon dappled pink-tinted light filtering through blossoms, warm nostalgic atmosphere, photorealistic cinematic',
  },
  summer_rain: {
    label: '여름: 소나기',
    base: 'blazing summer afternoon with intense sunlight and deep cool shade, wide open grass fields or shallow streams surrounded by wildflowers, golden backlight water splashes summer heat haze, warm golden lazy atmosphere, photorealistic cinematic',
  },
  autumn_film: {
    label: '가을: 필름',
    base: 'quiet Korean neighborhood in autumn, narrow residential alleys with fallen yellow ginkgo leaves, small portrait studios with warm tungsten bulbs, extremely low sun casting long horizontal golden amber light, warm melancholic nostalgic atmosphere, photorealistic cinematic',
  },
  winter_zhivago: {
    label: '겨울: 지바고',
    base: 'freezing winter landscape with heavy snowfall, snow-covered streets and train tracks, frosted windows candle-lit rooms, cold blue-white snow contrasting warm amber candlelight, dramatic winter atmosphere visible breath in cold air, photorealistic cinematic',
  },
  lovesick: {
    label: '러브시크',
    base: 'empty urban spaces at dawn and night, scarlet red silk charmeuse and electric cobalt blue wool-silk color collision, sodium vapor lamps harsh orange circles on dark asphalt, heart-shaped helium balloon, deadpan awkward distance becoming zero, celluloid grain photorealistic cinematic',
  },
  silver_thread: {
    label: '실버스레드',
    base: 'grand austere London townhouse atelier with pale grey walls and dark herringbone wooden floor, cold grey morning north-light from tall windows, silver-lavender and midnight navy tonal palette, tailor cutting table silver needle brass desk lamp, precise controlled intimate atmosphere, celluloid grain photorealistic cinematic',
  },
  summer_tape: {
    label: '서머 테이프',
    base: 'empty school playground and corridors in blazing midsummer afternoon, harsh overhead sun overexposed blown-out white sky, apricot and warm sand ivory color palette, silver camcorder, lens flare bleeding across frame, hazy heat shimmer, golden hour sunset dissolving edges into warm white, celluloid grain photorealistic cinematic',
  },
  in_the_mood: {
    label: '화양연화',
    base: 'Wong Kar-wai cinematic split warm-cool color temperature, celluloid grain photorealistic cinematic',
  },
  rouge_clue: {
    label: '루즈 클루',
    base: 'over-saturated emerald green and crimson red whimsical romantic atmosphere, celluloid grain photorealistic cinematic',
  },
  summer_film: {
    label: '썸머필름',
    base: 'late afternoon golden sun on quiet Korean street, old cinema facades, warm celluloid nostalgia, school uniform atmosphere, photorealistic cinematic',
  },
  lily_choucho: {
    label: '릴리슈슈',
    base: 'vast green rice paddies under heavy overcast grey sky, narrow dirt paths between fields, wind bending rice plants, oversaturated green grey melancholic atmosphere, photorealistic cinematic',
  },
  nocturnal_animals: {
    label: '녹터널 애니멀즈',
    base: 'minimalist brutalist gallery hall with raw concrete walls polished black terrazzo floor six-meter ceiling single enormous abstract monochrome painting on far wall, hard cone ceiling spotlights deep black shadow rest of hall, Vivienne Westwood baroque pearl accent photorealistic cinematic celluloid grain',
  },
  santorini_linen: {
    label: '산토리니 리넨',
    base: 'sunlit white limestone cliff-top villages of southern Italy blown-out Mediterranean noon sun bleached lime-washed stone walls deep inset window shadows heat haze halation bloom celluloid grain photorealistic cinematic',
  },
  age_of_innocence: {
    label: '순수의 시대',
    base: '1880s Gilded Age Metropolitan Opera House with private velvet-lined opera boxes grand curved Carrara marble staircase in lobby gas-lit crystal chandeliers mahogany panelling bone-white mikado gowns and suits warm amber gaslight honey-gold light deep crimson velvet shadow celluloid grain photorealistic cinematic',
  },
  blurred_spring: {
    label: '흐릿한 봄',
    base: '1970s American suburban backyard in summer white clapboard house with faded green shutters white picket fence oak trees overhead casting dappled gold patterns Polaroid photographs faded red Schwinn bicycle oscillating garden sprinkler making rainbow warm sun-bleached Kodak Gold 200 halation bloom celluloid grain Virgin Suicides Sofia Coppola aesthetic photorealistic cinematic',
  },
  rosewater_ballet: {
    label: '사랑방다실',
    base: '1860s New England Orchard House wooden clapboard exterior cream wallpaper with faint floral pattern sloped-ceiling attic writing room with quill pens and ink manuscripts stone fireplace dusty green velvet wingback armchair lace curtains New England rocky Atlantic coast granite boulders beach picnic gingham blanket dusty rose-peach magic hour sky Tiffen Classic Soft and Rose FX diffusion Kodak VISION3 500T celluloid grain Little Women aesthetic pink-rose harmony photorealistic cinematic',
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
  summer_film: 'deep navy blue wool serge gakuran-style school uniform with standing mandarin collar buttoned to top with five gold metal buttons in single column, structured shoulders, white cotton shirt visible at collar edge, matching deep navy straight-leg trousers, black leather lace-up shoes',
  lily_choucho: 'muted ash grey wool blazer with single button, slim fit, notch lapels, faded navy school crest embroidered on left chest pocket, white cotton dress shirt with point collar, thin muted olive green woven necktie in loose four-in-hand knot, dark charcoal grey wool straight-leg trousers, black leather oxford lace-up shoes',
  nocturnal_animals: 'pure black wool grain de poudre double-breasted tuxedo with satin peaked lapels and six satin-covered buttons, structured squared shoulders, high-waisted slim tapered trousers with black satin side-stripe, pure black silk satin collarless shirt buttoned to top, thin black grosgrain ribbon tied in flat knot at left side of neck with two short tails, oversized cream baroque pearl pin on left lapel, black patent leather Chelsea boots',
  santorini_linen: 'matte bone-white wool-silk blend double-breasted two-piece suit with structured squared shoulders and sharp wide peaked lapels in matching matte bone-white self-faced fabric, six covered bone-white buttons, high-necked pure bone-white silk crepe band-collar shirt fastened to throat no tie, slim straight-leg trousers in same bone-white wool-silk with clean single front pleat, matte bone-white suede ankle boots, single clear round-cut crystal boutonniere on left lapel',
  age_of_innocence: 'bone-white silk-wool blend single-breasted two-piece suit with single covered button closure at natural waist and clean notched lapels in matching bone-white silk-wool self-faced not shiny, structured but natural shoulders jacket length ending just below hip welt pockets at hip no flap, high-necked bone-white silk crepe mandarin-collar shirt fastened cleanly to throat with single covered button at collar no tie no bow tie no pocket square, slim straight-leg trousers in same bone-white silk-wool with clean single front pleat breaking cleanly at ankle, matte bone-white suede oxford shoes, single elongated teardrop-shaped cream pearl fifteen millimeters long pinned at center of left lapel just below lapel notch hanging on tiny invisible thread dangling freely one centimeter below pin point, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  blurred_spring: 'pale butter-cream beige Italian linen-silk blend summer suit with soft natural unstructured 1970s shoulders single-breasted two-button jacket with slim notch lapels jacket length ending just below hip slightly looser silhouette through body two flap pockets at hip one welt pocket on left chest all buttons covered in matching butter-cream fabric linen-silk showing gentle natural drape and slight lived-in crease texture at elbows and waist, pistachio-cream silk shirt with casual point collar top two buttons left undone showing hollow of throat no tie no bow tie no pocket square, slim straight-leg trousers in same butter-cream linen-silk with clean single front pleat no side stripe no cuffs slightly cropped ending just above ankle no belt, dusty sage-green suede slip-on loafers with no laces no tassels clean minimal almond-toe shape, tiny hand-embroidered single wild fern sprig in pale sage green silk thread on inner-right lapel facing approximately 3cm tall visible only when jacket lapel slightly opens, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  rosewater_ballet: 'deep burnt chocolate brown wool-silk blend three-piece formal suit, single-breasted one-button jacket with structured natural shoulders slim peaked lapels in matching burnt chocolate self-faced not satin not shiny jacket length ending just below hip slim tailored fit one welt pocket on chest two flap pockets at hip single covered button in matching chocolate fabric, matching burnt chocolate wool-silk waistcoat with five covered buttons down front slim fitted through torso sharp V-neckline, soft dusty rose-pink silk shirt with clean point collar top button fastened no tie no bow tie, slim straight-leg trousers in same burnt chocolate wool-silk with clean single front pleat no side stripe no cuffs breaking cleanly at ankle, polished dark chocolate brown leather oxford shoes in matching deep brown tone, single small 6mm cream freshwater pearl pinned on left lapel as minimalist boutonniere, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',

  studio_classic: 'wearing elegant black tuxedo with white dress shirt, black bow tie, polished shoes',
  studio_gallery: 'wearing charcoal grey wool-silk single-breasted one-button blazer with exaggerated angular peaked lapel with crisp geometric edges, light grey silk mock-neck top no collar, charcoal tailored straight-leg trousers with sharp center crease, black matte leather oxford shoes, architectural sharp silhouette',
  studio_fog: 'wearing light grey wool-cashmere single-breasted two-button blazer with notch lapel and soft matte brushed texture, white linen band-collar shirt all buttons closed minimal, light grey straight-leg trousers, light grey suede desert boots, quiet tonal grey no accessories',
  studio_mocha: 'wearing dark warm taupe brown wool gabardine single-breasted one-button blazer with notch lapel muted earthy tone like dried clay, ivory cotton open-collar shirt relaxed no tie, dark warm brown straight-leg trousers, dark brown matte leather shoes, understated earthy elegance',
  studio_sage: 'wearing off-white matte wool-blend single-breasted two-button blazer with shawl collar soft chalky texture like unglazed porcelain, pure white fine gauge crew-neck knit top, off-white straight-leg trousers, white leather minimal sneakers, no accessories, clean ethereal',
  hanbok_wonsam: 'wearing deep midnight navy silk shantung dopo extending below the knee with wide straight sleeves ending at wrist, clean mandarin collar standing two centimeters, gold silk goreum ties in simple knot at chest, deep crimson red silk sash tied at waist with sash tails hanging to mid-thigh, straight-leg trousers in matching midnight navy silk, pale gold silk inner sleeve lining visible only when arms move, NOT a western suit NOT a coat NOT modern clothing, authentic Korean royal groom wedding attire',
  hanbok_dangui: 'wearing deep plum purple silk shantung dopo extending below the knee with clean mandarin collar and straight wide sleeves, pale celadon green silk inner vest visible at chest with gold thread calligraphy line along front edge, gold silk goreum tie at chest in simple knot with short tails, slim straight-leg trousers in midnight navy silk, NOT a western suit NOT a coat, refined traditional Korean groom attire',
  hanbok_modern: 'wearing deep charcoal black raw silk knee-length structured overcoat inspired by dopo silhouette with clean sharp mandarin collar and single matte black fabric toggle closure, straight tailored sleeves showing sliver of white shirt cuff, cool dusty blue-grey silk band-collar shirt beneath matching bride jeogori tone, slim straight-leg charcoal black silk trousers, warm blush pink silk inner collar lining visible only when collar sits slightly open, NOT a western suit NOT a blazer NOT a trench coat, contemporary minimalist Korean hanbok groom attire',
  hanbok_saeguk: 'wearing deep crimson red silk hongryongpo royal robe extending to floor with wide sleeves, large circular gold-thread embroidered yongbo dragon medallions on chest and back, round dallyeong neckline with white inner collar visible beneath, wide black leather belt with jade and gold ornamental buckle plates at waist, subtle damask dragon pattern woven into base fabric, black silk ikseongwan crown with two distinctive wing extensions at back, NOT Chinese NOT imperial Chinese NOT standing collar, authentic Joseon dynasty king wedding attire',
  hanbok_flower: 'wearing deep burgundy wine silk knee-length dopo-inspired overcoat with clean mandarin collar and single fabric toggle closure wrapped in peony pink silk, subtle tonal damask petal texture woven into silk visible only in certain light, wide straight sleeves, soft peony pink silk band-collar shirt beneath, slim charcoal black silk trousers, no floral embroidery no printed patterns, NOT a western suit NOT a blazer, contemporary romantic Korean hanbok groom attire',
  cherry_blossom: 'wearing soft warm grey wool-silk blend single-breasted two-button jacket with soft natural shoulders and relaxed elegant silhouette, matching tapered trousers with clean break, pearl white silk shirt with soft spread collar, pale barely-there blush pink silk tie, no pocket square, the grey is soft and warm like cherry blossom bark, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  city_night: 'wearing deep midnight navy silk-wool blend single-breasted one-button jacket with slim shawl collar in matching navy silk satin creating subtle sheen contrast against matte wool body, matching slim tapered trousers, black silk shirt with soft point collar buttoned to top no tie, single thin gold chain necklace just visible at shirt collar, no pocket square no boutonniere, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  forest_wedding: 'wearing deep forest green wool-silk blend single-breasted two-button jacket with slim notch lapels and clean natural shoulders, matching tapered trousers with clean break, cream white silk shirt with soft spread collar open no tie, jacket buttons carved from dark natural wood smooth and polished, suit color nearly identical to dark wet tree bark, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  castle_garden: 'wearing deep black silk-wool barathea single-breasted one-button jacket with slim satin-faced peak lapels and sharp clean silhouette, matching slim trousers with satin side-stripe, warm ivory silk shirt with soft spread collar, black silk bow tie, single antique gold silk pocket square folded flat matching bride dress exactly, no other accessories, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  cathedral: 'wearing deep solid black wool gabardine single-breasted two-button jacket with slim notch lapels and precise clean silhouette perfectly pressed, matching slim straight-leg trousers with sharp crease, pure white cotton poplin shirt with stiff point collar, solid black silk tie in tight four-in-hand knot, no pocket square no boutonniere no pin no accessories, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  watercolor: 'wearing cream colored linen suit with no tie, relaxed artistic elegance',
  magazine_cover: 'wearing designer black suit with perfect fit, strong editorial style',
  rainy_day: 'wearing cool slate grey wool-silk blend single-breasted two-button jacket with clean slim notch lapels tailored fitted silhouette, matching tapered trousers with clean break, soft dove grey silk shirt with spread collar, deeper charcoal grey silk knit tie, no pocket square, tonal grey on grey layered like rain clouds, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  vintage_film: 'wearing warm camel brown tweed three-piece suit with wide peaked lapels, matching brown vest with gold buttons, cream white dress shirt with wide pointed collar visible over vest, brown patterned wide tie, brown leather oxford shoes, same outfit in every shot, 1970s retro groom',
  cruise_sunset: 'wearing cream beige linen suit, white open collar shirt, no tie, golden hour nautical groom elegance',
  cruise_bluesky: 'wearing cream beige linen suit, white open collar shirt, no tie, nautical groom elegance',
  vintage_record: 'wearing olive khaki brown wide-lapel vintage blazer over light blue open-collar dress shirt with wide pointed collar visible over blazer lapels, grey pinstripe pleated trousers, brown leather oxford shoes, same outfit in every shot, 1970s retro groom',


  retro_hongkong: 'wearing dark burgundy wine double-breasted blazer with silky sheen over black silk shirt unbuttoned showing collarbone, ivory pocket square, black slim trousers, black chelsea boots, relaxed confident lean with hand in pocket, effortless cool charm',
  vintage_tungsten: 'wearing dark navy wool single-breasted two-button suit with slightly wide notch lapels in relaxed vintage cut not slim-fit, straight-leg trousers with gentle break at hem, white cotton dress shirt with soft rounded collar, muted dusty lavender silk tie in slightly loose knot, suit has soft lived-in quality not crisp like pulled from 1978 wardrobe',
  aao: 'wearing grand ivory silk shantung double-breasted peak-lapel jacket with long dramatic silhouette extending past the hip, structured wide shoulders, matching high-waisted wide-leg trousers with sharp pressed crease, white silk shirt buttoned to top with cream silk tie, single oversized googly eye with wobbly black pupil pinned on left lapel where boutonniere would be',
  spring_letter: 'wearing light warm grey silk-linen blend single-breasted two-button wedding suit soft natural shoulders slightly nipped waist, matching tapered trousers clean break, pale blush pink silk shirt, ivory silk tie soft sheen, small fresh pink peony bud boutonniere left lapel, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  summer_rain: 'wearing natural off-white washed silk-linen blend unlined single-breasted two-button jacket soft rolled notch lapels relaxed shoulders, matching straight-leg trousers single front pleat, pale water blue silk shirt soft point collar top button undone, no tie, sleeves slightly pushed up, white canvas sneakers, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  autumn_film: 'wearing rich warm tobacco brown wool-silk blend single-breasted three-button jacket slightly longer length soft natural shoulders, matching straight-leg trousers clean pressed crease, champagne ivory silk shirt soft point collar, deep wine red silk tie, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  winter_zhivago: 'wearing deep charcoal black silk-wool blend single-breasted two-button jacket clean slim notch lapels sharp fitted silhouette, matching slim straight-leg trousers, silver-white silk shirt soft spread collar, pale icy lavender silk tie, black cashmere overcoat draped over one shoulder, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
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
  lovesick: 'wearing vivid electric cobalt blue wool-silk blend single-breasted two-button suit with slim notch lapels, crisp white cotton poplin shirt buttoned to top no tie, single tiny red silk heart pinned on left lapel, dark navy leather shoes',
  silver_thread: 'wearing deep midnight navy wool gabardine double-breasted six-button suit with sharp wide peak lapels and structured squared shoulders, high-waisted wide-leg trousers with single front pleat, crisp white cotton poplin shirt with stiff cutaway collar, narrow dark silver-lavender silk tie, white linen pocket square folded sharp, dark burgundy leather oxford shoes, Savile Row precision',
  summer_tape: 'wearing soft warm sand ivory washed linen-silk blend unstructured two-button jacket with soft rolled notch lapels no padding, matching straight-leg linen-silk trousers, pale celadon green silk shirt with soft point collar top two buttons open no tie, jacket left open, off-white canvas sneakers, sun-faded lived-in summer look',
  rouge_clue: 'wearing warm tobacco brown corduroy single-breasted two-button suit with slim notch lapels and soft natural shoulders, matching corduroy trousers with slight taper, cream white cotton shirt with soft rounded collar, deep crimson red knit tie, dark brown leather desert boots, warm lived-in texture',
  in_the_mood: 'wearing deep charcoal black wool-silk blend slim single-breasted two-button suit with narrow notch lapels and sharp shoulders, slim tapered trousers, pure white silk charmeuse shirt with subtle luminous sheen soft point collar no tie top two buttons open, black leather chelsea boots',
};

const OUTFIT_BRIDE: Record<string, string> = {
  summer_film: 'deep navy blue wool serge sailor-style school uniform with broad square sailor collar flap edged with three thin white stripe lines, white cotton inner blouse with rounded collar, single crimson red silk ribbon tied in neat bow at center of V-opening, fitted waist, knife-pleated matching deep navy skirt ending above knee, white cotton knee-high socks, dark brown leather Mary Jane strap shoes',
  lily_choucho: 'muted ash grey wool blazer with single button, slim fit, notch lapels, faded navy school crest on left chest pocket, white cotton dress shirt with soft point collar, thin muted olive green satin ribbon tie in small neat bow at collar, dark charcoal grey-green tartan check pleated skirt ending above knee with muted tones of charcoal and dark olive woven together knife pleats pressed, dark grey cotton knee-high socks, black leather penny loafer shoes',
  nocturnal_animals: 'pure black heavy silk duchess satin off-shoulder ball gown with sharp angular V sweetheart neckline, structured boned corset bodice with single diagonal seam of jet black Swarovski crystals from right neckline to left waist, massive voluminous bell-shaped skirt in five cascading tiers of black silk organza with raw frayed edges, Vivienne Westwood three-strand pearl choker with oversized cream baroque pearls and gold orb pendant at center front, small cream pearl stud earrings, scarlet matte red lipstick',
  santorini_linen: 'matte bone-white strapless bustier ball gown with perfectly straight horizontal neckline across upper chest no sweetheart curve, heavily boned fitted bustier bodice in matte bone-white silk taffeta with six internal vertical stays, dramatically voluminous bell ball skirt of hundreds of dense knife-sharp vertical pleats in bone-white silk organza, 2.5 meter cathedral-length veil in bone-white silk organza with raw unfinished edges, single-strand clear crystal rivière necklace at collarbone with fifteen graduated round-cut crystals, natural elegant makeup with light freckles',
  age_of_innocence: 'bone-white silk mikado wedding gown with high-necked bodice in solid opaque matte bone-white silk mikado fitted with clean princess seam tailoring, high symmetric stand collar in matching bone-white silk mikado 2.5 centimeters tall rising cleanly straight up to sit just below jawline fully enclosing entire throat, long fitted sleeves in same bone-white silk mikado extending from shoulders all the way down arms to wrists ending in clean straight cuffs at wrist bone no buttons no cuff detail, single vertical line of fifteen individual cream freshwater pearls hand-sewn one at a time in perfect alignment directly down exact center front of bodice from base of high collar at hollow of throat straight down to center of natural waistline graduating in size from smallest three millimeters at throat to largest ten millimeters just above waist spaced approximately one and a half centimeters apart, single elongated teardrop-shaped pearl approximately fifteen millimeters long hanging freely from tiny invisible thread below waistline seam dangling down onto upper skirt, full floor-length A-line skirt in same heavy bone-white silk mikado in clean architectural bell-shaped folds no pleats no drape no tiers no decoration, cathedral-length veil in bone-white silk tulle 2.5 meters long attached at back of bodice below high collar flowing past both sides of skirt raw unfinished edges, natural elegant makeup with light freckles',
  blurred_spring: 'tea-length strapless classical ballerina tutu wedding gown in soft bleached green gradient, fitted structured strapless corset bodice in warm ivory-cream silk mikado with clean straight-across horizontal neckline no sweetheart curve heavily boned with internal structure creating clean smooth surface extending to exact natural waistline, three scattered tiny wild fern sprig embroideries approximately 3cm tall in pale sage green silk thread whisper-soft like pressed botanical specimens placed sparsely one near left upper chest one near right lower ribcage one near center waist, tea-length mid-calf Romantic tutu skirt in classical 1950s Dior New Look bell silhouette with volume extending outward from hips 15-20cm horizontally then falling naturally downward in soft rounded curve to mid-calf hem constructed from eight layers of soft fine silk tulle stacked in graduated lengths each layer visible as separate frilled edge voluminous but naturally hanging, skirt color very soft bleached sun-faded gradient at waist topmost layers dusty pale sage-cream barely green almost ivory blending with bodice middle layers transition softly to muted pistachio green bottom outermost layers at hem dusty soft moss green muted never saturated never anime-bright gentle watercolor wash, narrow 2cm pale butter-cream silk satin ribbon around natural waist tied in small simple flat knot at exact center back with no tails no bow loops no hanging ends, dusty pale sage green silk satin ballet flats, narrow 3cm dusty rose-pink silk satin ribbon headband with small tidy flat bow on one side no veil no gloves no necklace no earrings, keeping original front bangs exactly as shown in reference image natural elegant makeup with light freckles',
  rosewater_ballet: 'dusty rose-pink silk mikado strapless sweetheart ball gown wedding dress with moderate sweetheart neckline soft M-curve dipping approximately 3cm at center front below straight horizontal shoulder line two shoulder edges flat and horizontal center dip soft and rounded not deep V, fitted structured strapless corset bodice in soft dusty rose-pink silk mikado muted warm pink with slight gray undertone like inside of tea rose petal heavily boned internally clean smooth surface tight fitted through natural waist with clean princess seam tailoring, organic cream freshwater pearl beadwork with pearls varying 2mm to 6mm hand-sewn scattered across bodice in soft organic flow pattern concentrated densely along sweetheart neckline edge forming delicate pearl trim then cascading downward across bodice in irregular meandering streams like water drops pearl density highest at neckline gradually thinning toward natural waist all pearls individually stitched flat against silk no chains no strands hanging no dangling beads asymmetric natural placement, grand voluminous ball gown skirt in same dusty rose-pink silk mikado with soft muted sheen not high gloss extending outward from waist in wide bell shape cascading to floor length no pleats no tiers no drape one continuous smooth voluminous princess ball skirt with clean architectural folds cathedral train approximately 1.5 meters behind, narrow dusty rose-pink silk satin ribbon headband 3cm wide tonally matching dress exactly sitting as clean narrow band across top of head with small tidy flat bow on one side no veil no long ribbon tails no floral crown, keeping original front bangs exactly as shown in reference image only back and length in black shoulder-length hippie jelly perm wavy hair with soft S-curl waves, natural elegant makeup with light freckles no gloves no jewelry other than bodice pearls',

  studio_classic: 'wearing white haute couture strapless sweetheart bell gown with sculpted white silk mikado bodice, bell skirt constructed of hundreds of individually cut white silk organza petals in elongated wave shapes layered and overlapping like ocean ripples frozen in motion, each petal heat-shaped to curl slightly at edges creating three-dimensional depth, petals denser at waist gradually more sparse toward hem revealing sheer tulle underneath, long sweeping train',
  studio_gallery: 'wearing white haute couture strapless sweetheart bell gown with sculpted white silk mikado bodice, bell skirt constructed of hundreds of individually cut white silk organza petals in elongated wave shapes layered and overlapping like ocean ripples frozen in motion, each petal heat-shaped to curl at edges creating three-dimensional depth, petals denser at waist gradually sparse toward hem revealing tulle underneath, long sweeping train, natural elegant makeup',
  studio_fog: 'wearing white haute couture strapless sweetheart bell gown that looks like fog, ivory silk crepe smooth minimal bodice, bell skirt with over twenty layers of ultra-sheer white silk organza in gradually varying tones from pure white to softest hint of pale grey at outermost layer, each layer slightly longer than last raw-edged creating soft blurred gradient at hem like dissipating mist, no embellishment no pattern, long fading train, natural elegant makeup',
  studio_mocha: 'wearing white haute couture halterneck bell gown, single wide fabric band of white silk mikado wrapping from front bust up around neck and down open back leaving shoulders bare, clean straight-across neckline, bell skirt of layered white silk organza panels cut in irregular jagged crystalline shapes like cracked glacier ice shards, alternating opaque and sheer panels creating depth with shadow patterns like light through ice, tiny clusters of clear glass micro-beads sparse and subtle, dramatic trailing train, natural elegant makeup',
  studio_sage: 'wearing white haute couture one-shoulder bell gown with single wide sculptural strap over left shoulder of gathered white silk mikado fanning from narrow point into wide dramatic drape across chest wrapping torso asymmetrically, right shoulder completely bare, bell skirt cascading in long vertical knife-pleated panels of white silk organza released at different lengths like streams of water pouring over cliff edge, pleats crisp at waist softening toward hem into fluid ripples, left side longer continuing asymmetry, dramatic sweeping train from left side only, natural elegant makeup',
  hanbok_wonsam: 'wearing deep crimson red silk duchesse satin jeogori with sharp geometric shoulders and clean straight neckline, single oversized gold silk goreum bow tied asymmetrically at chest with bow tails falling to waist, grand sweeping A-line ivory white silk organza chima over pale gold silk satin underlayer creating luminous warm glow, long dramatic train, wide deep crimson obi-like silk sash matching jeogori at waist, single thin border of hand-embroidered gold thread in delicate geometric palace window lattice pattern at hem, hair adorned with simple gold binyeo hairpin, authentic Korean royal bride wedding attire',
  hanbok_dangui: 'wearing pale jade-tinted ivory silk dangui with luminous translucent quality as if light passes through revealing warm ivory glow beneath, open at front with wide flowing sleeves extending past fingertips, deep plum purple silk goreum bow tied elegantly at chest with tails falling past waist, grand full A-line ivory-gold silk chima with soft luminous inner warmth and cathedral train, delicate gold thread calligraphy line embroidery along outer edge of celadon dangui sleeves, hair tied back loosely with plum silk ribbon, refined elegant traditional Korean bridal attire',
  hanbok_modern: 'wearing cool dusty blue-grey silk jeogori fitted close to body with traditional curved closure and cropped high waist length, single long deep forest green silk goreum tie with minimal knot and one long tail past waist, full flowing A-line pale cool grey silk organza chima layered over dusty blue-grey silk satin lining creating misty layered depth with graceful sweep train, long sleeves with hidden warm blush pink silk inner wrist lining visible only when hands lift, no embroidery no gold no pattern, contemporary minimalist Korean bridal attire',
  hanbok_saeguk: 'wearing deep emerald green heavy silk wonsam with gold phoenix and cloud brocade patterns covering entire surface, large circular gold phoenix medallion on chest, Korean V-shape neckline with white inner collar and gold-trimmed second layer, deep crimson red silk inner jeogori visible at front opening, wide sleeves with horizontal rainbow saekdong stripe bands of red blue yellow white silk near cuffs, deep dark burgundy purple chima beneath, red and gold ornamental goreum tie at chest, hair center-parted in low chignon jjokmeori at nape NO bangs NO see-through bangs, ornate floral tteoljam trembling hairpin ornaments with dangling pearl and coral beads on thin gold chains on both sides, jade binyeo pin through chignon, NOT tall crown NOT imperial Chinese headdress, authentic Joseon dynasty queen wedding attire',
  hanbok_flower: 'wearing deep peony pink silk jeogori with subtle tonal damask petal weave visible only when light rakes across surface, Korean V-neckline with white inner collar, single burgundy wine silk goreum tied in elegant long-tailed bow, full flowing A-line silk organza chima in hand-dyed ombre gradient from deep peony pink at high waist fading through soft blush to pure white at hem with chapel-length train, long sleeves with burgundy wine silk inner wrist lining, no printed flowers no embroidered flowers no floral motifs, the hanbok IS the flower through color alone, romantic Korean bridal attire',
  cherry_blossom: 'wearing soft pearl white silk chiffon off-shoulder wedding dress with sheer chiffon draped loosely across collarbones barely holding onto shoulders, fitted bodice in silk satin with chiffon floating over as translucent second skin, soft full A-line skirt in three layers of weightless silk chiffon that move independently with slightest air with gentle sweep train, innermost chiffon layer dyed palest barely-there blush pink invisible when still but faintest pink breathes through when outer layers separate, no lace no beading no flower motifs, natural elegant makeup',
  city_night: 'wearing midnight navy silk velvet scoop-neckline dress sitting just below collarbones with thin spaghetti straps, smooth clean bias-cut bodice skimming torso, straight fluid column skirt to floor with modest puddle train, subtle burnout technique where velvet pile removed in irregular scattered pattern across lower skirt revealing sheer silk base beneath like night sky with gaps in clouds, thin chain of tiny gold links draped once across open upper back between straps, no lace no beading no sequins, natural elegant makeup',
  forest_wedding: 'wearing warm cream white silk crepe de chine high square-neckline wedding dress, long sleeves fitted to forearm then opening into soft wide bell cuffs falling past fingertips, smooth fitted bodice with single horizontal seam at natural waist, relaxed straight column skirt to floor with long sweep train, bottom hem and train edge dip-dyed in soft gradient fading from cream white into warm moss green over last fifteen centimeters as if dress absorbed forest floor color, no lace no beading no flowers no leaves, natural elegant makeup',
  castle_garden: 'wearing pale antique gold silk satin strapless wedding dress with straight sharp horizontal neckline, smooth sculpted bodice minimal seams silk satin reflecting light like liquid gold, natural waistline with single thin self-fabric belt tied in long trailing bow at back with bow tails falling to floor, grand sweeping A-line skirt with long cathedral train in heavy luminous silk satin with deep sculptural folds pooling on floor, long opera-length gloves in matching antique gold silk satin fingertip to above elbow, no lace no beading no embroidery, natural elegant makeup',
  cathedral: 'wearing pure white heavy silk gazar high closed neckline wedding dress sitting just below jaw with clean sharp edge almost clerical, long sleeves fitted close to arm to wrist with single silk-covered button closure at each cuff, sculpted bodice precise tailoring smooth seamless silk gazar holding shape with stiff architectural quality, restrained A-line skirt floor-length with long cathedral train extending six feet behind, train edge with barely visible raised white embroidered intertwining vine lines, long fingertip-length plain tulle veil attached at crown, natural elegant makeup',
  watercolor: 'wearing delicate off-white silk slip dress with thin straps, loose romantic waves in hair',
  magazine_cover: 'wearing haute couture white gown, high fashion editorial style',
  rainy_day: 'wearing soft dove grey silk charmeuse off-shoulder wedding dress with fabric draping softly across both shoulders in wide gentle curve, fitted bodice smooth seamless surface with liquid mercury-like sheen, clean A-line skirt falling in one fluid unbroken line to floor with modest sweep train, long fitted sleeves in sheer dove grey silk organza showing arms beneath like skin seen through rain on glass, single small silk ribbon bow in slightly darker slate grey at center back neckline, no lace no beading no embroidery, natural elegant makeup',
  vintage_film: 'wearing ivory cream vintage lace A-line wedding dress with long bell sleeves, high modest neckline with scalloped lace trim, natural waistline with satin ribbon, ankle-length hem showing white kitten heels, loose natural hair with baby breath flowers, same dress in every shot, 1970s vintage bridal aesthetic',
  cruise_sunset: 'wearing ivory strapless tube top bridal gown with sheer tulle skirt catching golden wind, long tulle veil in sunset light, windswept loose hair, golden hour bridal elegance',
  cruise_bluesky: 'wearing ivory strapless tube top bridal gown with sheer tulle skirt flowing in sea breeze, long tulle veil billowing in wind, windswept loose hair, ethereal nautical bridal elegance',
  vintage_record: 'wearing ivory cream Victorian puff-sleeve wedding dress with sheer floral lace high-neck bodice over sweetheart neckline, short puffy gathered sleeves at shoulder, fitted ivory satin ribbon belt at waist, full A-line satin skirt with front slit, elbow-length white satin opera gloves, short tulle veil on back of head, hair worn completely down and loose past shoulders, same dress same gloves same veil in every shot, 1960s vintage bridal',


  retro_hongkong: 'wearing champagne gold silk satin halter-neck dress with thin spaghetti straps and open cutout sides showing skin, small low mandarin collar detail at neckline, body-hugging silhouette, scattered delicate gold plum blossom embroidery, thigh-high side slit, vintage pearl drop earrings, metallic gold ankle-strap heels, long loose black hair flowing down past shoulders, never tied up never in bun never in updo, hairstyle matching reference photo exactly',
  vintage_tungsten: 'wearing ivory floral cotton lace wedding dress with high Victorian neckline with delicate scalloped edge, long bishop sleeves gathered at wrist with lace cuffs, entire bodice and sleeves of dense floral cotton lace with white silk lining beneath, natural waistline with thin white satin ribbon belt bow, skirt falls in relaxed straight column with slight flare at hem in matching floral lace over silk, simple fingertip-length tulle veil attached at crown, no beading no sequins no modern structure, beautiful vintage dress from a 1970s wedding',
  aao: 'wearing grand ivory silk duchess satin off-shoulder ball gown with dramatic oversized sculptural puff sleeves billowing like inflated clouds gathered tightly at wrists, fitted boned corset bodice with smooth powerful silhouette, massive full ball gown skirt with sweeping cathedral-length train, hundreds of tiny mismatched colorful buttons in pastel pink mint lavender butter yellow all different shapes and sizes embroidered in swirling galaxy spiral pattern across entire skirt and train dense at center hip spiraling outward becoming sparse at hem, no lace no beading no sequins, architecturally grand and surreal',
  spring_letter: 'wearing soft blush pink silk organza off-shoulder wedding dress with organza petal cap sleeves, fitted corset bodice with seed pearls scattered across bodice, three-tiered organza A-line skirt with long train, natural elegant makeup',
  summer_rain: 'wearing pure white silk mikado square-neckline wedding dress with wide straps on edge of shoulders, structured minimal bodice sharp princess seams, softly gathered white silk chiffon skirt gentle sweep train, tiny clear glass beads along square neckline like water droplets, natural elegant makeup',
  autumn_film: 'wearing warm champagne ivory silk satin bias-cut V-neckline wedding dress with delicate spaghetti straps crossing at upper back, smooth diagonal drape across torso asymmetric waist fold, fluid column silhouette pooling into puddle train, small cluster silk leaves amber sienna wine red at back strap crossing, natural elegant makeup',
  winter_zhivago: 'wearing cool silver-white silk faille high boat neckline long fitted sleeve wedding dress with silk-covered buttons wrist to elbow, sculpted bodice vertical princess seams, full architectural A-line skirt deep inverted box pleats chapel train, thin detachable silk faille cape at shoulders with pale icy lavender silk lining, natural elegant makeup',
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
  lovesick: 'wearing deep vivid scarlet red silk charmeuse slip dress with thin spaghetti straps and clean scoop neckline, smooth bias-cut fitted bodice, fluid straight column skirt to floor with small puddle train, single oversized white silk fabric heart pinned at center of chest, no lace no beading, natural elegant makeup',
  silver_thread: 'wearing pale silver-lavender heavy silk duchess satin wedding dress with high closed jewel neckline and long fitted sleeves with tiny silk-covered buttons from wrist to mid-forearm, sculpted tailored bodice with precise princess seams, restrained A-line skirt with cathedral train, no embellishment no lace no beading, natural elegant makeup',
  summer_tape: 'wearing soft warm apricot silk organza off-shoulder wedding dress with sheer organza petal cap sleeves, fitted bodice in pale apricot silk charmeuse, full romantic A-line skirt in three graduated tiers of weightless silk organza with gentle sweep train, subtle ombre from pale apricot at bodice to soft peach at hem, natural elegant makeup',
  rouge_clue: 'wearing deep emerald green silk taffeta cocktail-length wedding dress with clean square neckline and wide shoulder straps, structured fitted bodice, full playful A-line skirt ending at mid-calf, single oversized crimson red silk fabric camellia flower pinned at left waist, retro 1960s silhouette, natural elegant makeup',
  in_the_mood: 'wearing pure white heavy silk charmeuse off-shoulder wedding dress with romantic gathered sweetheart neckline and dramatic oversized puff sleeves in silk organza billowing at shoulder then gathered tight at elbow, fitted boned corset bodice in smooth luminous silk charmeuse, massive voluminous four-tiered ruched bell-shaped ball gown skirt, cathedral train, fingertip-length tulle veil with silk bow at crown, no lace no beading, natural elegant makeup',
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


const HANBOK_COUPLE_SHOTS = [
  { id: 'formal_facing', prompt: 'couple facing each other at formal distance across low wooden table with ceremonial candle between them, seated in traditional posture, looking into each other eyes with quiet intensity, warm candlelight from front cool daylight filtering through hanji behind, shallow depth of field on space between them' },
  { id: 'walking_procession', prompt: 'couple walking along traditional wooden corridor with repeating dark pillars, she walks three steps ahead he walks behind, both look straight ahead with perfect posture, his eyes angled slightly downward toward her trailing fabric, late afternoon golden bars of light across dark wooden floor, 85mm telephoto compressing pillar rhythm' },
  { id: 'wall_separation', prompt: 'couple separated by tall stone palace wall, she on one side facing wall with hand flat against rough stone at shoulder height, he on other side with hand at exact same height directly opposite, they cannot see each other but hands separated by inches of stone, soft overcast light, symmetrical split composition' },
  { id: 'seated_distance', prompt: 'couple sitting on dark wooden maru floor looking out at courtyard, one arm length apart, she holds small ceramic tea cup in both hands, his cup sits on wood between them untouched, soft grey diffused light, the deliberate space between them is careful not cold' },
  { id: 'candlelight_chamber', prompt: 'couple seated formally across from each other in intimate chamber at night, single tall candle in brass holder between them on floor, candlelight warm amber on faces painting Renaissance chiaroscuro, they look at each other across flame, neither smiles, her fingers on lap shift slightly toward his side' },
  { id: 'garden_reflection', prompt: 'couple at edge of dark still lotus pond in palace garden, she sits on pavilion floor looking at water, his reflection appears in water beside hers, in real world he stands behind railing separated by wooden bars, but in water their reflections exist together without barriers, late afternoon golden light' },
  { id: 'dawn_courtyard', prompt: 'couple standing together in vast empty palace courtyard at first pale dawn light, pink-grey sky above dark palace roofs, facing each other at formal distance, everything proper and restored, but she holds small folded hanji paper note in clasped hands and he has identical note tucked in sash edge, soft predawn pink light' },
  { id: 'threshold_moment', prompt: 'he stands at chamber entrance threshold hesitating, formal outer robe loosened revealing white inner layer, she sits on floor inside looking up at him, heavy ceremonial garments removed and draped on wooden rack behind her, warm amber oil lamp light, the threshold between corridor and chamber is the last line of protocol' },
  { id: 'hidden_hands', prompt: 'couple seated side by side in formal posture facing forward in throne room or ceremonial hall, full formal attire restored, her hand completely hidden beneath wide heavy sleeve resting on top of his hand on armrest, from front perfectly formal, beneath the silk two hands clasped, soft warm morning light' },
  { id: 'back_view_garden', prompt: 'couple walking along winding stone path through garden with autumn trees, dressed down in simpler daily clothes off duty, she reaches hand back without looking, he takes it, no officials no protocol, golden side light through tree canopy painting warm amber, the hand reaching back is quiet rebellion' },
];

const HANBOK_GROOM_SHOTS = [
  { id: 'throne_solitary', prompt: 'seated alone on wooden throne or formal chair, vast empty hall with dark wooden pillars, single beam of daylight cutting diagonally across dark floor, hands grip armrests, eyes look slightly to one side at something offscreen, power and loneliness in same seat, 35mm lens' },
  { id: 'procession_path', prompt: 'walking alone down center of stone courtyard path at dawn, hands clasped holding jade tablet or folded paper, measured steps looking straight ahead, grey-pink predawn sky, the only upright figure in vast empty space, 85mm telephoto' },
  { id: 'threshold_hesitate', prompt: 'standing at doorway threshold at night, formal robe collar loosened revealing white inner layer, one hand holding removed headpiece at side, warm amber oil lamp light from room beyond, hesitation at the boundary between duty and intimacy' },
  { id: 'window_contemplation', prompt: 'standing near hanji paper window, daylight filtering through creating soft geometric shadows on face, profile view looking through lattice at courtyard beyond, contemplative calm expression, quiet composed dignity' },
  { id: 'seated_floor', prompt: 'seated on floor in formal posture at low wooden table, hands on knees, single candle on table painting warm amber on face, looking down at small folded paper or letter, intimate private moment, shallow depth of field' },
  { id: 'corridor_walk', prompt: 'walking along dark wooden palace corridor with repeating pillars, late afternoon golden bars of light alternating with shadow, measured dignified stride, three quarter body, cinematic pillar compression' },
  { id: 'garden_alone', prompt: 'standing alone in palace garden with twisted pine tree and autumn maple leaves, dressed in simpler daily clothes, holding removed hat in hand, looking at falling leaves, off duty vulnerable, golden side light' },
  { id: 'profile_authority', prompt: 'tight closeup profile, strong jawline lit by single directional warm light, formal collar and headpiece visible, composed regal expression, deep shadow on far side of face, 85mm lens shallow depth' },
];

const HANBOK_BRIDE_SHOTS = [
  { id: 'mirror_vanity', prompt: 'seated alone at low wooden vanity with small bronze mirror in private chamber, looking at own slightly distorted reflection, ornate folding screen behind, brass oil lamps casting warm amber, dressed for him but he has not arrived, shallow depth of field on face and bronze reflection side by side' },
  { id: 'ondol_solitary', prompt: 'sitting alone on warm ondol floor in formal posture, knees folded beneath, hands resting open on lap as if reading own palms, single oil lamp on low table only light, the room quiet enough to hear flame, intimate and solitary, 50mm lens' },
  { id: 'fan_mystery', prompt: 'tight closeup holding unfolded traditional silk fan covering lower half of face, only eyes visible above fan edge, eyes look directly at camera soft and deep holding something unsaid, warm oil lamp light from below painting eyes luminous, 85mm lens razor sharp focus on eyes everything else dissolves' },
  { id: 'corridor_silhouette', prompt: 'walking along wooden corridor seen from behind, fabric train trailing on dark wooden floor, repeating pillars creating rhythm, late afternoon golden light from open side, elegant silhouette, three quarter body' },
  { id: 'garden_pavilion', prompt: 'sitting alone on pavilion floor beside lotus pond, legs folded beneath, looking at dark water, reflection wavering on surface below, autumn maple trees framing scene, late afternoon golden light, contemplative serene, 50mm lens' },
  { id: 'hands_wrapping', prompt: 'extreme closeup of hands carefully wrapping small object in silk pojagi cloth, precise tender folds, gold ring glimpsed inside before last fold, brass oil lamp at edge of frame warm directional light, 90mm macro lens on fingertips, everything else cream blur' },
  { id: 'window_light', prompt: 'standing near hanji window, soft diffused light on face creating gentle geometric lattice shadow pattern, three quarter angle, serene peaceful expression, hair ornaments catching window light' },
  { id: 'profile_gentle', prompt: 'tight closeup gentle profile, soft warm light on cheekbone and jawline, ornamental hairpin visible, peaceful closed-eye moment, extremely shallow depth of field, intimate beauty' },
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

const DYNAMIC_CONCEPTS = new Set(['retro_hongkong', 'vintage_record', 'cruise_sunset', 'cruise_bluesky', 'black_swan', 'blue_hour', 'water_memory', 'velvet_rouge', 'rose_garden', 'grass_rain', 'eternal_blue', 'heart_editorial', 'vintage_tungsten', 'aao', 'spring_letter', 'summer_rain', 'autumn_film', 'winter_zhivago']);

const STUDIO_SET = new Set(['studio_classic', 'studio_gallery', 'studio_fog', 'studio_mocha', 'studio_sage']);

const getVariants = (mode: string, concept: string) => {
  if (HANBOK_CONCEPTS.has(concept)) {
    return mode === 'couple' ? HANBOK_COUPLE_SHOTS : mode === 'groom' ? HANBOK_GROOM_SHOTS : HANBOK_BRIDE_SHOTS;
  }
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
  cherry_blossom: 'sitting on simple wooden park bench under single enormous cherry blossom tree, petals falling steadily like slow pink snow, ground carpeted thick with fallen petals, she holds a single fallen cherry blossom branch turning it slowly in her fingers, he watches a petal land on his trouser leg, small gap between them on bench, soft overcast flat light making everything glow pastel, falling petals in soft focus creating pink bokeh',
  forest_wedding: 'deep inside dense old-growth forest with massive dark trunks like cathedral pillars, thick white fog flowing between them at waist height like slow white river, they stand apart each beside a separate tree trunk facing each other across the fog, two single shafts of pale grey light from canopy above landing on each of them separately like spotlights in dark theater, dense and sacred',
  cruise_sunset: 'ocean breeze windswept hair, golden light on deck railing, relaxed nautical vibe',
  cruise_bluesky: 'bright sea breeze, crisp blue sky, wind in hair, relaxed deck atmosphere',
  city_night: 'in backseat of taxi at night seen through closed side window, window glass reflecting passing city neon lights as colored streaks red blue green amber, she rests forehead against cool glass he looks at phone screen white light underlit on face from below, together but each in their own world for one quiet moment, taxi meter glows small and green',
  castle_garden: 'in long grand hall of mirrors with gilded frames lining both walls reflecting each other infinitely, crystal chandeliers in row but only one near middle lit dimly rest dark, marble floor reflecting single lit chandelier as warm golden pool, they walk side by side not touching through center of hall, mirrors multiply them infinitely hundreds of golden dresses and black suits receding into darkness, grand and intimate simultaneously',
  cathedral: 'at altar steps inside cathedral he kneels on cold grey stone step in black suit looking up, she stands on step above in white silk gazar dress and veil looking down, he holds her left hand in both his hands bringing it toward his forehead, deep rose-red and gold stained glass light falls directly on his kneeling figure while she stands backlit as silhouette, surrender as grace',
  rainy_day: 'sharing one clear vinyl umbrella he tilts toward her side so she stays dry while his shoulder is soaked dark with rain, walking in step close together her arm linked through his, wet pavement stretching ahead reflecting lights, silver rain streaks around them, the umbrella tilted toward her is the whole love story',
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
  vintage_tungsten_sofa: 'dark maximalist vintage room with large rose and tropical leaf floral wallpaper in deep red and green, old CRT television behind, tropical houseplants, floral velvet sofa, floor lamp with fabric shade, direct on-camera flash harsh flat lighting faces brightly lit background falls dark quickly, faded warm print colors with magenta highlights and yellow midtones, scanned photograph from 1979 wedding album, 35mm lens',
  vintage_tungsten_floor: 'sitting on carpet floor in front of old CRT television showing static, dark floral wallpaper behind, ambient tungsten room light and cool TV static glow on faces, very low light slightly motion-blurred from slow shutter speed handheld, colors muddy and warm with crushed dark shadows, candid snapshot on cheap 35mm point-and-shoot 1982, 50mm lens',
  vintage_tungsten_stairs: 'narrow dark wood staircase with faded floral carpet runner and old framed photos on wall, single bare warm bulb hanging in stairwell, direct on-camera flash from bottom of stairs harsh shadow cast behind on wall, deep darkness at top of staircase, faded print colors with orange-shifted highlights, 1970s amateur photography, 35mm lens',
  vintage_tungsten_portrait: 'standing in front of dark floral wallpaper with large roses and tropical leaves, tall tropical plant beside, direct on-camera flash from slightly too close face overexposed and flat harsh shadow directly behind on wallpaper, faded warm print colors with magenta highlights, compact film camera 1981, 50mm lens',
  vintage_tungsten_hug: 'cramped dark room with busy floral wallpaper in deep red and green, direct on-camera flash too close harsh flat white skin oily shine on foreheads hard black shadow outline behind on wallpaper, warm yellow-green color cast magenta shifted highlights, point-and-shoot 1979 wedding afterparty, 35mm lens',
  vintage_tungsten_hallway: 'long narrow dark hallway with faded floral wallpaper and worn carpet, dim bare warm bulbs in old wall sconces casting small pools of amber light, on-camera flash only reaches first meter overexposed bright while distance underexposed and murky, camera tilted warm muddy amber tones, blurry mess 1980, 50mm lens',
  vintage_tungsten_studio: 'mottled grey-brown canvas studio backdrop seamless covering floor, flat even studio lighting with faint soft shadow, skin slightly pale and washed out from overexposure, formal wedding studio portrait from small Korean town 1977, slight warm magenta cast aged photo paper, 50mm lens',
  aao_convenience: 'brightly lit Korean convenience store at night, harsh white fluorescent ceiling lights reflecting off cheap linoleum floor, shelves of instant noodles snacks plastic-wrapped kimbap, through glass storefront window street is empty and dark, flat ugly fluorescent light with no atmosphere, deadpan centered composition mundane and still, 35mm lens',
  aao_rooftop: 'cluttered apartment rooftop in middle of day, clotheslines strung with hanging laundry white bedsheets faded towels old t-shirts flapping in wind, concrete floor with puddles from rain, rusted water tanks and satellite dishes in background, grey overcast sky, flat grey overcast daylight, observational and quiet tender without trying, 50mm lens',
  aao_pool: 'bottom of large empty drained outdoor swimming pool, cracked pale blue tiles on floor and walls, dead leaves in corners old lane dividers rusted and collapsed, no water, bright harsh midday sun directly overhead casting short deep shadows straight down, geometric and isolating, 28mm wide lens eye-level from pool edge',
  aao_subway: 'empty late-night subway car harsh fluorescent tube lighting orange plastic seats, green-tinted fluorescent light making skin slightly sickly, black windows reflecting doubles like ghosts, slight motion blur on handrails, centered symmetrical composition melancholic and electric, 40mm lens',
  aao_parking: 'empty outdoor parking lot in heavy rain at night, concrete surface reflecting rain and single overhead sodium vapor lamp casting harsh orange circle of light, everything beyond light circle is pure black darkness, heavy rain streaks visible as white diagonal lines in sodium lamp light, 85mm lens shallow depth of field',
  aao_stairwell: 'concrete fire escape stairwell of old apartment building, bare bulbs at each landing creating repeating pools of warm light down vertical shaft, raw concrete walls rusted metal railings, warm amber light pools against cold grey concrete, vertiginous and yearning, 24mm wide lens',
  aao_convenience_final: 'same Korean convenience store harsh fluorescent lights same shelves same linoleum floor, triangle kimbap and paper coffee cup abandoned on counter, flat harsh white light no shadows no atmosphere, nothing in universe has changed except they chose each other again, centered still final, 50mm lens',
  spring_letter_library: 'old quiet library with tall windows and wooden reading desks, cherry blossom branches pressing against window glass petals stuck to panes, soft afternoon dappled pink-tinted light filtering through blossoms casting shadows across desk, dust floating in warm light beams, empty and silent, 85mm lens through gap between bookshelves',
  spring_letter_corridor: 'long narrow school corridor with old wooden floors and tall windows on one side, cherry blossom petals scattered across hallway floor blown in through open window, strong beam of afternoon sunlight cutting diagonally across corridor creating wall of golden light, 50mm lens deep perspective',
  spring_letter_steps: 'wide stone steps outside old columned building, cherry blossom trees fully bloomed lining walkway, petals falling slowly in breeze, late afternoon side light casting long shadows across steps, quiet and aching, 40mm lens wide showing columns and trees',
  spring_letter_bicycle: 'tree-lined path covered in fallen cherry blossom petals like pink carpet, warm golden late afternoon backlight from behind creating glowing halos around hair and flying petals, slight motion blur on spinning wheels, joy breaking through melancholy, 35mm lens panning',
  spring_letter_window: 'shot from outside looking through old slightly wavy window glass with water spots and cherry blossom petal stuck to outside, warm amber-lit room inside, cool blue evening light outside, temperature split across glass, voyeuristic and tender, 50mm focus on window glass surface',
  spring_letter_field: 'wide open field with single enormous cherry blossom tree in full bloom far in distance against pale white sky, petals drifting across field like slow pink snow, soft flat overcast light no shadows, feels like it happened long time ago, 85mm telephoto compressing distance',
  spring_letter_letter: 'extreme close-up of hands at wooden desk folding handwritten letter on cream paper, small cherry blossom petal landed on paper folded inside, glass of water refracting afternoon window light casting small rainbow on letter, 90mm macro razor sharp focus on fold crease',
  summer_rain_tree: 'under massive old tree shade in wide open grass field blazing summer afternoon, harsh midday sun above but deep cool shade beneath, dappled light through leaves creating bright spots, field beyond shade blown-out white from intense sun, still and heavy with summer heat, 50mm lens',
  summer_rain_stream: 'stone edge of old shallow natural stream surrounded by tall summer grass and wildflowers, clear water feet dangling in, late afternoon sun low golden strong backlight through hair and water spray, lazy and golden, 40mm lens strong backlight lens flare',
  summer_rain_curtain: 'tall open window in old white-walled room bare wooden floor, sheer white curtain billowing inward from hot summer breeze, white on white on white only sunlight and shadow defining fabrics, strong direct afternoon sun hard sharp rectangle on wooden floor, heat and light and air, 85mm lens shallow depth',
  summer_rain_porch: 'wooden porch of old countryside house hot summer afternoon, tin bucket cold water with watermelon condensation dripping, small electric fan metal cage guard ribbon fluttering, harsh direct sun on dirt yard narrow strip of porch shade, hot and sticky candid and real, 35mm lens',
  summer_rain_storm: 'wide golden barley field under sky half brilliant blue half dark dramatic thundercloud, strong pre-storm wind bending barley in golden waves, warm golden sun from right cool blue-grey storm light from left, moment before everything changes, 28mm wide lens dramatic split light',
  summer_rain_downpour: 'barley field in heavy sudden summer rain dark grey sky, heavy rain streaks white diagonal lines across dark sky, barley flattened by rain, slow shutter motion blur on running bodies and rain, chaotic joyful drenched, 35mm lens motion blur',
  summer_rain_rainbow: 'barley field after rain stopped everything wet dripping steaming in returning sun, sky half dark cloud retreating half golden light breaking through, air visibly steaming as hot sun hits wet ground rising mist catching golden light, faint rainbow arc in sky, everything glistens, 85mm shallow depth steaming golden bokeh',
  autumn_film_studio: 'small old Korean portrait studio late afternoon, faded plain backdrop, single warm tungsten bulb overhead and soft late afternoon light leaking through small frosted side window, mixed warm light, moment before shutter click, 50mm lens shallow depth',
  autumn_film_alley: 'narrow residential alley quiet Korean neighborhood autumn, low apartment walls potted plants bicycle against wall, fallen yellow ginkgo leaves scattered on ground, sun very low minutes from setting casting extremely long horizontal golden light turning everything amber, quiet and unhurried, 85mm telephoto compressing alley depth',
  autumn_film_crossing: 'small railroad crossing quiet town red white barrier arm lowered no train coming, autumn trees deep orange red leaves lining both sides of tracks, late afternoon golden light making autumn leaves glow like fire, composed and resigned, 40mm lens barrier in sharp focus',
  autumn_film_rooftop: 'apartment rooftop at sunset, white bedsheets on clothesline blowing gently in evening breeze, deep orange sky fading to purple at top, strong warm side light from setting sun face half golden half shadow, most important photograph ever taken, 50mm lens',
  autumn_film_store: 'worn wooden bench in front of tiny old neighborhood convenience store at dusk, single bare bulb above entrance casting warm amber circle of light, faded signs stacked plastic crates, cool blue twilight sky above, warm-cool split between store light and twilight, small and ordinary and enough, 35mm lens',
  autumn_film_glass: 'shot from outside through glass door of small portrait studio at evening, interior glowing warm amber from tungsten bulb, glass has hand-painted reversed letters barely visible, cool blue evening outside yellow ginkgo leaves drifting past glass, reflection and falling leaves overlap on glass surface, 50mm focus on glass surface',
  autumn_film_dawn: 'narrow residential alley early morning, soft pale blue-grey dawn light no shadows no warmth, ginkgo leaves still on ground bicycle still against wall, everything same but light changed and entire feeling with it, quiet grey still, 85mm telephoto same alley different light',
  winter_zhivago_breath: 'freezing winter night extreme close-up, red-flushed cheeks nose tips from cold, white breath visible two clouds of warm vapor merging in freezing air, tiny ice crystals on hair frost on eyebrows, complete darkness behind single warm light from below like streetlamp on snow, 85mm macro razor sharp on merging breath',
  winter_zhivago_frost: 'shot from inside dark room through window covered in thick frost crystal patterns, one small circle melted by pressing warm palm against glass, through circle figure outside in falling snow under single streetlamp, frost patterns frame clear circle as natural vignette, inside dark warm outside cold blue-white, 50mm focus on frost surface',
  winter_zhivago_candles: 'small bare room old wooden floor peeling wallpaper no electricity, only light from mismatched candles of different heights on floor in rough circle, silk catching candlelight glowing gold, candle flames warm orange on faces walls and ceiling deep cold shadow, breath faintly visible despite candles, 35mm fragile warmth inside hostile cold',
  winter_zhivago_tracks: 'snow-covered train tracks stretching straight to vanishing point both directions, flat white snow covers everything tracks barely visible as two faint parallel lines disappearing into fog, heavy grey overcast sky blending into white ground no visible horizon, world erased, 40mm symmetrical composition vast empty white',
  winter_zhivago_piano: 'old upright piano in large empty room with tall windows, snow falls heavily outside visible as white streaks against dark evening sky, room unheated breath visible, fingers rest on keys without pressing empty sheet music stand, charcoal coat draped over piano top, single candle warm amber cold blue window two light temperatures, 50mm shallow depth on hands on keys',
  winter_zhivago_dance: 'wide open snow field at night heavy snowfall, slow dance in falling snow no music, slow shutter soft motion blur on swaying bodies, snowflakes stretched into long white diagonal lines, single distant streetlamp warm orange point in background, foreheads pressed together eyes closed, 1/4 second shutter analog film grain quiet and infinite',
  winter_zhivago_dawn: 'quiet residential street covered in fresh undisturbed snow early winter dawn, palest pink-blue first light before sunrise perfectly flat even no shadows, black overcoat draped over her shoulders too big, footprints in snow behind only marks on pristine white street, lavender tie only color in frame, longest night is over, 85mm telephoto compressing snowy street',
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
  in_the_mood_alley: 'dark narrow alley at night with wet asphalt reflecting cyan neon and warm sodium vapor lamp, old black motorcycle parked against graffitied concrete wall, split warm-cool color temperature',
  in_the_mood_tunnel: 'empty highway tunnel at night with infinite receding orange sodium vapor lights creating perspective lines on wet road surface, solitary atmosphere',
  in_the_mood_phone: 'old glass phone booth on empty sidewalk at night, cold fluorescent tube inside contrasting warm amber streetlight outside, rain-slicked pavement',
  in_the_mood_escalator: 'empty subway station escalator descending into cold blue-white fluorescent depth, rhythmic repeating overhead tube lights, solitary late-night stillness',
  in_the_mood_arcade: 'dark retro arcade at night with rows of glowing game screens casting multicolor light on faces, warm ambient neon',
  in_the_mood_rooftop: 'building rooftop at night overlooking city skyline with distant neon and warm sodium lamps, cool night air',
  in_the_mood_underpass: 'elevated highway underpass at night with concrete pillars and rhythmic headlight sweeps from cars above, warm sparkler glow',
  lovesick_parking: 'empty outdoor parking lot at night, single sodium vapor lamp casting harsh orange circle on dark wet asphalt, predawn grey-blue darkness',
  lovesick_alley: 'narrow urban alley with single bare bulb above metal door, scarlet red graffiti on concrete wall, cobalt blue accents, flat grey ambient light',
  lovesick_rooftop: 'empty concrete rooftop at dawn, grey sky with first pale light, scattered empty bottles, raw vulnerable stillness',
  silver_thread_atelier: 'grand austere London townhouse atelier with pale dove grey walls and dark herringbone parquet floor, tall window with cold grey north light, tailor cutting table with silver scissors',
  silver_thread_fitting: 'dimly lit bespoke fitting room with ornate gilded standing mirror, dark wooden staircase ascending into shadow, single warm brass desk lamp',
  silver_thread_staircase: 'dark wooden staircase in Victorian townhouse with worn carpet runner, brass handrail, cold blue-grey light from high window',
  rouge_clue_alley: 'old Parisian cobblestone alley with crimson red painted door and green ivy climbing ancient stone wall, warm amber light spilling from cafe window, twilight blue sky',
  rouge_clue_carousel: 'vintage carousel with warm string lights at dusk, weathered painted horses, golden hour glow against indigo sky',
  rouge_clue_record: 'vintage record shop interior with warm tungsten bulbs, dark wooden shelves of vinyl, old carousel poster on stone wall, emerald and crimson warmth',
  summer_tape_playground: 'empty school playground with rusted pull-up bars and old green iron bench, harsh midsummer overhead sun, overexposed blown-out white sky, cicada heat shimmer',
  summer_tape_corridor: 'school corridor with old worn wooden floor and rectangles of hot afternoon sun from classroom windows, dust suspended in golden light beams',
  summer_tape_rooftop: 'school rooftop at golden hour, warm sunset dissolving edges, chain-link fence silhouette, summer breeze',
  summer_film_cinema: 'sidewalk in front of old single-screen cinema with hand-painted movie poster board and faded red awning, late afternoon golden sun on quiet street, warm celluloid nostalgia, 50mm lens',
  summer_film_bridge: 'old iron railing pedestrian bridge over quiet river at late afternoon, peeling paint on railing, low warm sun raking along bridge and river surface catching golden light in slow ripples, 50mm lens',
  summer_film_staircase: 'wide concrete outdoor school staircase at golden hour, deep golden horizontal light from left, long sharp shadows on concrete steps, warm amber atmosphere, 85mm lens',
  lily_choucho_paddy: 'vast green rice paddy field under heavy overcast grey sky, narrow dirt path between oversaturated green rice plants, flat grey light, digital video texture, 50mm lens',
  lily_choucho_corridor: 'long school corridor with old worn wooden floor and tall windows casting repeating rectangles of grey light creating alternating bars of light and shadow, corridor stretching to vanishing point, digital video texture, 50mm lens',
  lily_choucho_wall: 'behind school building stained concrete wall with green moss cracks, flat grey light, damp concrete texture, sharing earphones backs against wall, digital video texture, 85mm lens',
  nocturnal_animals_gallery: 'vast minimalist brutalist gallery hall with raw concrete walls polished black terrazzo floor six-meter ceiling single enormous abstract monochrome painting on far wall, hard cone ceiling spotlights drop circles of light rest of hall in deep black shadow, celluloid grain, 35mm lens',
  nocturnal_animals_armchair: 'deep emerald green velvet mid-century armchairs in modernist living room with low black marble coffee table, black brass floor lamps with amber tungsten globe bulbs casting warm one-side face light with cool shadow on other side, celluloid grain, 50mm lens',
  nocturnal_animals_sedan: 'modern black sedan interior on night highway, amber dashboard backlight on lower faces, streaks of cold sodium-orange street lamp light slipping across faces through windshield in rhythmic flashes, celluloid grain, 35mm lens',
  santorini_linen_wall: 'massive sunlit white limestone wall of old Southern Italian cliff-top village ten meters high in bleached lime-washed stone with deep inset rectangular window shadows, Mediterranean noon sun blasting wall into blown-out highlights heat haze rising, celluloid grain halation bloom, 35mm lens',
  santorini_linen_alley: 'narrow sunlit alley between two towering white limestone walls of Italian cliff village barely two meters wide pale stone pavement, overhead sun blasting walls into pure blown-out white far end of alley glowing white rectangle, celluloid grain halation bloom, 50mm lens',
  santorini_linen_cliff: 'white limestone cliff-top overlooking Mediterranean at late golden hour soft gradient pale honey-gold at horizon fading through apricot to lavender warm rose-gold light, celluloid grain, 24mm wide lens',
  age_of_innocence_stairs: 'grand curved white Carrara marble staircase inside 1880s Metropolitan Opera House lobby dark mahogany bannister curving behind massive crystal chandelier above glowing in warm gaslight gilded mirror on far wall reflecting distant evening-dress figures as blurred spots honey-gold marble warm amber wash, celluloid grain, 35mm lens',
  age_of_innocence_opera_box: 'private velvet-lined opera box overlooking vast 1880s Gilded Age opera house deep crimson velvet upholstered chairs dark mahogany railing gas-lit crystal chandelier glowing far in distance warm amber gaslight washing from front deep velvet shadow behind bone-white garments glowing against crimson velvet, celluloid grain, 50mm lens',
  age_of_innocence_study: 'Gilded Age private study with mahogany panelled walls lined with leather-bound books large marble fireplace with low orange flame walnut writing desk with silver dip pen glass inkwell ivory letter card single yellow rose on desk single tungsten reading lamp casting warm amber pool deep cool shadow behind, celluloid grain, 50mm lens',
  blurred_spring_porch: 'wooden back porch of 1970s American suburban white clapboard house with faded green shutters screen door with metal mesh slightly ajar backyard grass extending behind to white picket fence tall oak tree leaves overhead casting dappled gold patterns across porch floorboards warm morning sunlight halation bloom, Kodak Gold 200 celluloid grain, 50mm lens',
  blurred_spring_sprinkler: 'sunlit 1970s suburban backyard lawn with rotating oscillating garden sprinkler water arcs spraying in bright diagonal lines creating rainbow in air water droplets catching extreme overhead noon sun like thousands of scattered diamonds white clapboard house and white picket fence in soft focus background, Kodak Gold 200 celluloid grain strong halation bloom on water, 35mm lens overexposed',
  blurred_spring_twilight: '1970s suburban backyard lawn at magic hour white picket fence and clapboard house silhouetted against deep rose-magenta fading to lavender fading to pale peach twilight sky first fireflies tiny specks of warm glow long soft pink shadows across lawn warm rose-amber light, Kodak Gold 200 celluloid grain, 50mm lens',
  rosewater_ballet_orchard: 'Orchard House-style 1860s New England wooden living room interior warm wooden floor planks soft cream wallpaper with faint floral pattern lace curtains at tall windows stone fireplace dusty green velvet wingback armchair cool-warm balanced morning light with peachy undertone gentle dappled patterns across wooden floor, Tiffen Classic Soft and Rose FX Kodak VISION3 500T celluloid grain, 35mm lens',
  rosewater_ballet_shore: 'New England rocky Atlantic coast shore calm flat sea with small foam waves large gray granite boulders at shoreline distant rocky coastline silhouette seagulls in sky late afternoon golden hour sky glowing in soft dusty rose-peach gradient with pale lavender-blue at horizon sea shimmering pink-silver, Tiffen Rose FX Kodak VISION3 500T celluloid grain, 50mm lens',
  rosewater_ballet_attic: 'sloped-ceiling attic writing room of New England 1860s wooden house with small wooden writing desk beneath sloped attic window glass inkwell with dark brown-black ink stack of cream manuscript pages with copperplate handwriting brass oil lamp cool-warm balanced morning light pouring diagonally through window gentle peachy-cream beam filled with floating dust motes rose-cream shadow of sloped wooden beams, Tiffen Classic Soft and Rose FX Kodak VISION3 500T celluloid grain, 85mm lens',
};

const buildPrompt = (concept: string, category: string, mode: string, shotIdx: number): string => {
  const allConcepts = { ...STUDIO_CONCEPTS, ...CINEMATIC_CONCEPTS };
  const scene = allConcepts[concept]?.base || STUDIO_CONCEPTS.studio_classic.base;
  const isCinematic = category === 'cinematic';
  const isHanbok = HANBOK_CONCEPTS.has(concept);
  const variants = getVariants(mode, concept);
  const shot = variants[shotIdx % variants.length];
  const isDetail = DETAIL_SHOTS.has(shot.id);

  const face = 'Keep the person\'s facial features exactly the same as the reference image, including eye shape, nose, lips, jawline, and hairstyle. The face must be identical to the input photo';

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
  const mood = concept === 'velvet_rouge' ? (CONCEPT_MOOD[VELVET_ROUGE_SCENES[shotIdx % 3]] || '') : concept === 'water_memory' ? (CONCEPT_MOOD[WATER_MEMORY_SCENES[shotIdx % 3]] || '') : concept === 'rose_garden' ? (CONCEPT_MOOD[ROSE_GARDEN_SCENES[shotIdx % 3]] || '') : concept === 'grass_rain' ? (CONCEPT_MOOD[GRASS_RAIN_SCENES[shotIdx % 3]] || '') : concept === 'eternal_blue' ? (CONCEPT_MOOD[ETERNAL_BLUE_SCENES[shotIdx % 3]] || '') : concept === 'vintage_tungsten' ? (CONCEPT_MOOD[(['vintage_tungsten_sofa', 'vintage_tungsten_floor', 'vintage_tungsten_stairs', 'vintage_tungsten_portrait', 'vintage_tungsten_hug', 'vintage_tungsten_hallway', 'vintage_tungsten_studio'])[shotIdx % 7]] || '') : concept === 'aao' ? (CONCEPT_MOOD[(['aao_convenience', 'aao_rooftop', 'aao_pool', 'aao_subway', 'aao_parking', 'aao_stairwell', 'aao_convenience_final'])[shotIdx % 7]] || '') : concept === 'heart_editorial' ? (CONCEPT_MOOD[HEART_EDITORIAL_SCENES[shotIdx % 3]] || '') : concept === 'spring_letter' ? (CONCEPT_MOOD[(['spring_letter_library', 'spring_letter_corridor', 'spring_letter_steps', 'spring_letter_bicycle', 'spring_letter_window', 'spring_letter_field', 'spring_letter_letter'])[shotIdx % 7]] || '') : concept === 'summer_rain' ? (CONCEPT_MOOD[(['summer_rain_tree', 'summer_rain_stream', 'summer_rain_curtain', 'summer_rain_porch', 'summer_rain_storm', 'summer_rain_downpour', 'summer_rain_rainbow'])[shotIdx % 7]] || '') : concept === 'autumn_film' ? (CONCEPT_MOOD[(['autumn_film_studio', 'autumn_film_alley', 'autumn_film_crossing', 'autumn_film_rooftop', 'autumn_film_store', 'autumn_film_glass', 'autumn_film_dawn'])[shotIdx % 7]] || '') : concept === 'winter_zhivago' ? (CONCEPT_MOOD[(['winter_zhivago_breath', 'winter_zhivago_frost', 'winter_zhivago_candles', 'winter_zhivago_tracks', 'winter_zhivago_piano', 'winter_zhivago_dance', 'winter_zhivago_dawn'])[shotIdx % 7]] || '') : concept === 'in_the_mood' ? (CONCEPT_MOOD[(['in_the_mood_alley', 'in_the_mood_tunnel', 'in_the_mood_phone', 'in_the_mood_escalator', 'in_the_mood_arcade', 'in_the_mood_rooftop', 'in_the_mood_underpass'])[shotIdx % 7]] || '') : concept === 'lovesick' ? (CONCEPT_MOOD[(['lovesick_parking', 'lovesick_alley', 'lovesick_rooftop'])[shotIdx % 3]] || '') : concept === 'silver_thread' ? (CONCEPT_MOOD[(['silver_thread_atelier', 'silver_thread_fitting', 'silver_thread_staircase'])[shotIdx % 3]] || '') : concept === 'rouge_clue' ? (CONCEPT_MOOD[(['rouge_clue_alley', 'rouge_clue_carousel', 'rouge_clue_record'])[shotIdx % 3]] || '') : concept === 'summer_tape' ? (CONCEPT_MOOD[(['summer_tape_playground', 'summer_tape_corridor', 'summer_tape_rooftop'])[shotIdx % 3]] || '') : concept === 'summer_film' ? (CONCEPT_MOOD[(['summer_film_cinema', 'summer_film_bridge', 'summer_film_staircase'])[shotIdx % 3]] || '') : concept === 'lily_choucho' ? (CONCEPT_MOOD[(['lily_choucho_paddy', 'lily_choucho_corridor', 'lily_choucho_wall'])[shotIdx % 3]] || '') : concept === 'nocturnal_animals' ? (CONCEPT_MOOD[(['nocturnal_animals_gallery', 'nocturnal_animals_armchair', 'nocturnal_animals_sedan'])[shotIdx % 3]] || '') : concept === 'santorini_linen' ? (CONCEPT_MOOD[(['santorini_linen_wall', 'santorini_linen_alley', 'santorini_linen_cliff'])[shotIdx % 3]] || '') : concept === 'age_of_innocence' ? (CONCEPT_MOOD[(['age_of_innocence_stairs', 'age_of_innocence_opera_box', 'age_of_innocence_study'])[shotIdx % 3]] || '') : concept === 'blurred_spring' ? (CONCEPT_MOOD[(['blurred_spring_porch', 'blurred_spring_sprinkler', 'blurred_spring_twilight'])[shotIdx % 3]] || '') : concept === 'rosewater_ballet' ? (CONCEPT_MOOD[(['rosewater_ballet_orchard', 'rosewater_ballet_shore', 'rosewater_ballet_attic'])[shotIdx % 3]] || '') : (CONCEPT_MOOD[concept] || '');

  if (mode === 'couple') {
    const gOutfit = OUTFIT_GROOM[concept] || OUTFIT_GROOM.studio_classic;
    const bOutfit = OUTFIT_BRIDE[concept] || OUTFIT_BRIDE.studio_classic;
    const coupleNatural = 'natural relaxed body language, genuine warm smiles, not stiff not rigid, candid authentic interaction';
    return `${face}. ${mood ? mood + '. ' : ''}${scene}. A couple: the man ${gOutfit}. The woman ${bOutfit}. They have natural relaxed body language with genuine warm smiles. ${shot.prompt}. ${isCinematic ? 'Cinematic' : 'Professional'} wedding photograph${hanbokExtra}. ${detailFocus}`.replace(/\. \./g, '.').trim();
  }

  const clothe = mode === 'groom'
    ? (OUTFIT_GROOM[concept] || OUTFIT_GROOM.studio_classic)
    : (OUTFIT_BRIDE[concept] || OUTFIT_BRIDE.studio_classic);
  const subj = mode === 'groom' ? 'Korean groom' : 'Korean bride';
  return `${face}. ${mood ? mood + '. ' : ''}${scene}. The person is a ${subj}, ${clothe}. ${shot.prompt}. ${isCinematic ? 'Cinematic' : 'Professional'} wedding photograph${hanbokExtra}. ${detailFocus}`.replace(/\. \./g, '.').trim();
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
  const isAdmin = req.user?.role === 'ADMIN';

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
      inputUrls: imageUrls,
      amount: isAdmin ? 0 : finalPrice,
      orderId,
      couponCode: isAdmin ? null : (valid ? validCode : null),
      status: isAdmin ? 'PAID' : 'PENDING',
      paidAt: isAdmin ? new Date() : null,
      paymentKey: isAdmin ? 'ADMIN_FREE' : null,
    },
  });

  if (isAdmin) {
    return res.json({
      packId: pack.id, orderId, amount: 0, label: tierInfo.label,
      skipPayment: true,
    });
  }

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
        const submit = await falFetch(`${FAL_QUEUE}/fal-ai/nano-banana-2/edit`, {
          method: 'POST',
          body: JSON.stringify({ prompt, image_urls: imageUrls, num_images: 1, aspect_ratio: '3:4', resolution: '1K', output_format: 'png', thinking_level: 'high' }),
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
                  body: JSON.stringify({ prompt: snap.prompt, image_urls: snap.inputUrls as string[], num_images: 1, aspect_ratio: '3:4', resolution: '1K', output_format: 'png', thinking_level: 'high' }),
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
