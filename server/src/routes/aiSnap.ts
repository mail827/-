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
  { id: 'studio_gallery', label: '갤러리' },
  { id: 'studio_fog', label: '포그' },
  { id: 'studio_mocha', label: '모카' },
  { id: 'studio_sage', label: '세이지' },
  { id: 'outdoor_garden', label: '야외 가든' },
  { id: 'beach_sunset', label: '해변 선셋' },
  { id: 'hanbok_traditional', label: '한복 전통' },
  { id: 'hanbok_wonsam', label: '궁중 혼례' },
  { id: 'hanbok_dangui', label: '당의 한복' },
  { id: 'hanbok_modern', label: '모던 한복' },
  { id: 'hanbok_saeguk', label: '사극풍' },
  { id: 'hanbok_flower', label: '꽃한복' },
  { id: 'city_night', label: '시티 나이트' },
  { id: 'cherry_blossom', label: '벚꽃' },
  { id: 'forest_wedding', label: '숲속 웨딩' },
  { id: 'castle_garden', label: '캐슬 가든' },
  { id: 'cathedral', label: '성당 웨딩' },
  { id: 'watercolor', label: '수채화' },
  { id: 'magazine_cover', label: '매거진 커버' },
  { id: 'rainy_day', label: '비오는 날' },
  { id: 'autumn_leaves', label: '가을 단풍' },
  { id: 'winter_snow', label: '겨울 눈' },
  { id: 'vintage_film', label: '빈티지 필름' },
  { id: 'cruise_sunset', label: '크루즈 선셋' },
  { id: 'iphone_selfie', label: '셀카 스냅' },
  { id: 'iphone_mirror', label: '거울 셀카' },
  { id: 'cruise_bluesky', label: '크루즈 블루스카이' },
  { id: 'vintage_record', label: '빈티지 레코드' },
  { id: 'retro_hongkong', label: '레트로 홍콩' },
  { id: 'black_swan', label: '블랙스완' },
  { id: 'blue_hour', label: '블루아워' },
  { id: 'water_memory', label: '물의 기억' },
  { id: 'velvet_rouge', label: '벨벳 루즈' },
];

const PACKAGE_QUOTA: Record<string, number> = {
  lite: 1,
  basic: 3,
  'ai-reception': 10,
  'basic-video': 3,
};
const FREE_TRIAL = 1;
const EXTRA_PRICE = 1500;
const CRUISE_CONCEPTS = ['cruise_sunset', 'cruise_bluesky'];


const RANDOM_POSES_GROOM = [
  'tight closeup framing at chest level, close-up portrait, slight confident smile, direct warm eye contact, extremely shallow depth of field',
  'extreme closeup framing at shoulder level, sharp side profile, moody rim lighting on jawline, contemplative expression',
  'medium shot framing at waist level, upper body, one hand touching open collar casually, slight head tilt, intimate warm gaze',
  'medium shot framing at waist level, upper body leaning shoulder against wall, relaxed smirk, dramatic side lighting',
  'tight closeup framing at chest level, genuine laughing moment, head tilted, natural joy, eyes crinkled with warmth',
  'three quarter body mid-stride, one hand in pocket, looking slightly off-camera with half-smile',
  'medium shot framing at waist level, upper body looking down with gentle smile, adjusting cuff, soft intimate moment',
  'medium shot framing at waist level, upper body turned away, glancing back over shoulder, charming half smile, dramatic backlight',
];

const RANDOM_POSES_BRIDE = [
  'tight closeup framing at chest level, close-up portrait, soft warm smile, gentle eye contact, extremely shallow depth of field, beautiful skin glow',
  'extreme closeup framing at shoulder level, elegant side profile close-up, chin slightly lifted, serene expression, earring catching light',
  'medium shot framing at waist level, upper body, one hand gracefully touching hair behind ear, gentle head tilt, soft warm smile',
  'medium shot framing at waist level, upper body candid laughing moment, eyes crinkled with genuine joy, hand near face',
  'medium shot framing at waist level, upper body looking back over shoulder with mysterious inviting smile, dramatic backlight',
  'medium shot framing at waist level, upper body looking down with gentle smile, one hand adjusting earring, soft intimate moment',
  'three quarter body leaning casually against wall, one leg bent, relaxed confident expression',
  'three quarter body mid-walk, dress visible, looking ahead with gentle smile, natural stride',
];

const RANDOM_POSES_COUPLE = [
  'tight closeup framing at chest level, extreme close-up foreheads gently touching, eyes closed, peaceful intimate moment',
  'tight closeup framing at chest level, close-up gentle cheek kiss, her hand on his chest, warm spontaneous moment',
  'medium shot framing at waist level, upper body facing each other with warm gentle smiles, intimate close distance',
  'medium shot framing at waist level, back hug from behind, both smiling warmly, her hand on his arm',
  'three quarter body walking together mid-stride, turning to look at each other with warm smiles',
  'tight closeup framing at chest level, him whispering in her ear, she smiles with eyes closed, intimate tender moment',
  'extreme closeup framing at shoulder level, noses almost touching, playful eye contact, warm smiles',
  'medium shot framing at waist level, arms linked, she leaning head on his shoulder, both with content smiles',
];

const getRandomPose = (mode: string): string => {
  const arr = mode === 'couple' ? RANDOM_POSES_COUPLE : mode === 'groom' ? RANDOM_POSES_GROOM : RANDOM_POSES_BRIDE;
  return arr[Math.floor(Math.random() * arr.length)];
};

const applyFaceSwap = async (baseUrl: string, isCouple: boolean, imageUrls: string[]): Promise<string> => {
  return baseUrl;
  try {
    const groomFace = imageUrls[0];
    const brideFace = imageUrls[1];
    const swap1 = await falFetch('https://fal.run/fal-ai/face-swap', {
      method: 'POST',
      body: JSON.stringify({ base_image_url: baseUrl, swap_image_url: groomFace }),
    });
    if (swap1?.image?.url) {
      const swap2 = await falFetch('https://fal.run/fal-ai/face-swap', {
        method: 'POST',
        body: JSON.stringify({ base_image_url: swap1.image.url, swap_image_url: brideFace }),
      });
      if (swap2?.image?.url) return swap2.image.url;
      return swap1.image.url;
    }
  } catch (e: any) { console.log('Face-swap skipped:', e.message); }
  return baseUrl;
};

const NEGATIVE_PROMPT = 'distorted face, deformed nose, asymmetric eyes, blurry face, smoothed skin, plastic face, bumpy skin, uneven skin texture, cartoon face, ugly face, merged faces, elongated face, enhanced jawline, square jaw, chiseled face, narrow face, donkey face, horse face, long chin, protruding jaw, swollen face, inflated cheeks, inhuman proportions, uncanny valley face, alien features';

const SOLO_PROMPTS: Record<string, { groom: string; bride: string }> = {
  studio_classic: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a modern minimalist white studio with clean white walls and large windows casting soft natural daylight, wearing elegant black tuxedo with white shirt and black bow tie, airy contemporary elegance, confident gentle gaze, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a modern minimalist white studio with clean white walls and large windows casting soft natural daylight, wearing white haute couture strapless sweetheart bell gown with sculpted silk mikado bodice and bell skirt of hundreds of white silk organza petals in wave shapes layered like ocean ripples with long sweeping train, airy contemporary elegance, gentle smile, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  studio_gallery: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a minimal white architectural studio with curved plaster arches and tall arched windows, wearing charcoal grey wool-silk one-button blazer with angular peaked lapel, light grey silk mock-neck top, charcoal trousers, black leather oxfords, soft diffused natural light, clean airy bright, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a minimal white architectural studio with curved plaster arches and tall arched windows, wearing white strapless sweetheart bell gown with organza petal wave skirt like ocean ripples with long train, soft diffused natural light, clean airy bright, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  studio_fog: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a warm studio with cream linen draped backdrop and pampas grass, wearing light grey wool-cashmere two-button blazer with brushed texture, white linen band-collar shirt, light grey trousers, grey suede desert boots, soft warm light, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a warm studio with cream linen draped backdrop and pampas grass, wearing white strapless sweetheart bell gown with twenty plus layers of sheer organza graduating from white to pale grey like dissipating mist no embellishment, soft warm light, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  studio_mocha: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a dark moody studio with mocha brown plaster wall and warm spotlight from above, wearing dark warm taupe brown wool blazer, ivory open-collar shirt, dark brown trousers, dark brown leather shoes, dramatic golden spotlight, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a dark moody studio with mocha brown plaster wall and warm spotlight from above, wearing white halterneck bell gown with crystalline ice-shard organza panels and glass micro-beads, dramatic golden spotlight, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  studio_sage: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a modern studio with sage green wall and cream boucle sofa and oak floor, wearing off-white matte wool shawl collar blazer, white crew-neck knit, off-white trousers, white leather sneakers, soft even natural light, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a modern studio with sage green wall and cream boucle sofa and oak floor, wearing white one-shoulder bell gown with sculptural left shoulder strap and cascading knife-pleated organza panels like waterfall asymmetric train from left, soft even natural light, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  outdoor_garden: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in an outdoor garden wedding setting, wearing navy blue suit with boutonniere, lush botanical garden background with blooming flowers, golden hour sunlight filtering through trees, natural romantic atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in an outdoor garden bridal setting, wearing flowing white wedding dress, surrounded by blooming roses and wisteria, golden hour sunlight, holding wildflower bouquet, ethereal natural beauty, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  beach_sunset: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a beach wedding setting at golden sunset, wearing light linen suit, warm orange pink sky, pristine white sand beach, gentle sea breeze, relaxed confident pose, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a beach bridal setting at golden sunset, wearing flowing white dress, warm orange pink sky reflecting on ocean, barefoot on white sand, windswept hair, romantic atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  hanbok_traditional: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a modern Korean hanbok wedding portrait, wearing refined navy hanbok jeogori with clean modern lines, minimalist Korean courtyard with wooden architecture, soft golden hour light, editorial fashion wedding style, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a modern Korean hanbok bridal portrait, wearing elegant pastel pink and ivory hanbok with delicate floral embroidery, hair adorned with simple gold hairpin, minimalist Korean courtyard, soft golden light, editorial wedding style, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  hanbok_wonsam: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a grand Korean royal palace Geunjeongjeon hall, wearing heukdallyeong (black ceremonial robe) with samo headpiece with wings, gold-embroidered belt, white inner jeogori visible at collar, red lacquered pillars with dancheong patterns, warm natural daylight, dignified regal atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a grand Korean royal palace Geunjeongjeon hall, wearing vibrant red wonsam ceremonial robe layered over yellow chima, golden phoenix embroidery across chest and sleeves, elaborate hwagwan jeweled crown with dangling ornaments, white socks with kkotsin flower shoes, holding ceremonial fan, red lacquered pillars with dancheong, warm natural daylight, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  },
  hanbok_dangui: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a serene traditional Korean garden with lotus pond and pine trees, wearing jade-green dopo Korean scholar overcoat with V-shaped crossed collar gyotgit and goreum ribbon ties, yugeon soft fabric headband, white inner jeogori, jade ornament at waist, NOT a western suit, gentle morning sunlight, refined scholarly atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a serene traditional Korean garden with lotus pond and pine trees, wearing soft blush-pink dangui short ceremonial jacket with gold-thread floral embroidery over deep navy chima skirt, small jokduri bridal coronet with jade and coral beads, delicate binyeo hairpin in updo, gentle morning sunlight, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  },
  hanbok_modern: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a minimalist modern hanok interior with clean white walls and warm wood floor, wearing charcoal gray modern durumagi Korean traditional long overcoat with V-shaped crossed collar gyotgit and goreum ribbon ties, Korean traditional fabric, white inner jeogori with mandarin collar, NOT a western suit NOT a blazer, soft diffused natural light from large window, contemporary elegant atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a minimalist modern hanok interior with clean white walls and warm wood floor, wearing pastel lavender modern jeogori with clean lines over white chima skirt, hair in loose low bun with single minimalist silver binyeo hairpin, no heavy ornament, soft diffused natural light, contemporary minimalist Korean bridal attire, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  },
  hanbok_saeguk: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in magnificent Gyeongbokgung throne hall with golden dragon screen, wearing deep crimson gonryongpo Korean royal dragon robe with V-shaped crossed collar gyotgit, wide sleeves, golden dragon embroidery, golden gwanmo crown, jade belt, NOT a western suit, ornate wooden columns with vivid dancheong, cinematic golden hour light, epic royal drama atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in magnificent Gyeongbokgung throne hall with golden dragon screen, wearing magnificent golden hwarot queen ceremonial robe with vivid phoenix and peony embroidery across entire surface, grand jokduri crown with long bead strings, layered silk underskirts visible at hem, cinematic golden hour light, opulent royal atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  },
  hanbok_flower: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a blooming hanok courtyard with cherry blossoms and azaleas, wearing ivory white durumagi Korean long overcoat with subtle floral embroidery at hem, soft pastel inner jeogori, small flower boutonniere at chest, warm golden spring sunlight, romantic garden atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a blooming hanok courtyard with cherry blossoms and azaleas, wearing light lilac jeogori with delicate flower embroidery over soft white chima skirt, fresh flower hairpin tucked behind ear, loose natural hairstyle with soft waves, warm golden spring sunlight, romantic spring bridal attire, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  },
  city_night: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a cinematic city night portrait, tailored black tuxedo, rain-slicked street, neon reflections, shallow depth of field, moody Wong Kar-wai inspired color grading, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a cinematic city night bridal portrait, sleek white evening gown, rain-slicked street reflecting warm lights, shallow depth of field, moody cinematic color grading, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  cherry_blossom: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a cherry blossom wedding setting, wearing gray suit with pink boutonniere, surrounded by pink sakura petals falling, spring sunlight filtering through blossom canopy, dreamy pastel atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a cherry blossom bridal setting, wearing soft white dress, surrounded by clouds of pink sakura petals, spring sunlight, ethereal pastel pink atmosphere, romantic and magical, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  forest_wedding: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in an enchanted forest wedding setting, wearing elegant dark suit with emerald green tie, deep green forest with sunlight streaming through tall trees, flower arch with white roses and ivy, golden light rays and floating dust particles, magical but realistic atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in an enchanted forest bridal setting, wearing ethereal white gown with delicate lace, deep green forest with sunlight streaming through trees, surrounded by white roses and ivy arch, golden light rays and floating particles, magical woodland fairy atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  castle_garden: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a fairytale castle wedding setting, wearing classic black formal suit with bow tie, magnificent European stone castle with towers in background, grand garden with fountain and hedge maze, warm golden hour lighting, dreamy cinematic atmosphere like a movie scene, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a fairytale castle bridal setting, wearing magnificent white ball gown with long train, European stone castle with towers in background, grand garden with fountain, warm golden hour lighting, princess-like dreamy cinematic atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  cathedral: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in an elegant European cathedral wedding setting, wearing refined charcoal morning suit with vest and patterned tie, gothic stone cathedral with stained glass windows and candlelight, classic white flower arrangement, old world romantic elegance, soft warm lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in an elegant European cathedral bridal setting, wearing classic white cathedral-length wedding gown with veil, gothic stone cathedral with stained glass windows and candlelight, white flower arrangement, old world romantic elegance, soft warm lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  watercolor: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a fine art wedding portrait, cream linen suit, painterly soft focus floral background, diffused golden light, high-end editorial aesthetic, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a fine art bridal portrait, flowing soft tulle gown, painterly muted pastel floral background, diffused golden light, high-end editorial aesthetic, ethereal dreamy, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  magazine_cover: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a high-end editorial wedding portrait, designer black suit, clean dark studio, dramatic single spotlight, strong pose facing camera, high contrast lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a high-end editorial bridal portrait, sculptural white couture gown, clean minimalist backdrop, dramatic single light source, confident elegant pose, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  rainy_day: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a romantic rainy day portrait, dark navy coat suit, holding umbrella, gentle rain with bokeh, wet street reflections, cinematic mood, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a romantic rainy day bridal portrait, white dress, transparent umbrella, gentle rain creating soft bokeh, wet cobblestone reflections, intimate cinematic mood, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  autumn_leaves: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in an autumn wedding portrait, warm brown tweed suit, golden red maple leaves falling, tree-lined path, warm amber light, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in an autumn bridal portrait, ivory dress, surrounded by golden red maple leaves, fall foliage canopy, warm amber golden hour light, romantic cozy, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  winter_snow: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a winter wedding portrait, charcoal wool coat suit, gentle snowfall, frosted trees, soft blue-white light, serene winter atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a winter bridal portrait, white fur-trimmed gown, gentle snowfall, frosted pine trees, soft blue-white winter light, magical serene beauty, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  vintage_film: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a vintage film wedding portrait, retro brown suit, warm Kodak Portra 400 tones, soft film grain, natural window light, 1970s nostalgic aesthetic, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a vintage film bridal portrait, classic A-line lace dress, warm Kodak Portra 400 color palette, soft film grain texture, natural window light, nostalgic romantic, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  cruise_sunset: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. luxury yacht deck at golden hour sunset, groom wearing cream linen suit with open collar white shirt, warm amber ocean light, gentle sea breeze blowing hair softly, turquoise Mediterranean sea behind, yacht railing and polished wood deck, golden sun reflecting on calm water waves, romantic warm cinematic lighting, no text no logos no watermarks, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. elegant bride on luxury yacht deck at golden hour sunset, wearing flowing white chiffon dress with wind-blown fabric, elegant and simple, warm amber ocean light, gentle sea breeze blowing hair and dress softly, turquoise Mediterranean sea behind, yacht railing and polished wood deck, golden sun reflecting on calm water waves, romantic warm cinematic lighting, no text no logos no watermarks, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no face elongation no jaw enhancement no face slimming',
  },
iphone_selfie: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. authentic iPhone selfie of the same person from above at arms length, close-up face filling most of frame, slightly tilted off-center composition, wearing slightly wrinkled white button-up shirt top two buttons undone collar open, one arm extended up holding phone showing watch on wrist, on-camera flash with neutral cool white balance, subtle digital noise and film grain, slightly overexposed flash on forehead, looking directly into lens with natural relaxed slight smirk, NOT studio NOT warm golden tone NOT formal, raw phone camera selfie, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. authentic iPhone selfie of the same person from above at arms length, close-up face filling most of frame, slightly tilted off-center composition, wearing off-shoulder white top or white camisole, hair down slightly messy not perfectly styled, natural dewy no-makeup makeup, one hand near face or touching hair, on-camera flash with neutral cool white balance, subtle digital noise and film grain, slightly overexposed flash highlights on nose bridge, looking directly into lens with relaxed half-smile, NOT studio NOT warm golden tone NOT formal, raw phone camera selfie, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  iphone_mirror: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. mirror selfie with iPhone flash of the same person, upper body reflected in large clean mirror, wearing white t-shirt under open black blazer sleeves pushed up, fitted dark trousers, holding iPhone visible in mirror, bright harsh flash creating high contrast, slightly washed out flash aesthetic, casual confident mirror pose, NOT formal NOT tuxedo, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. mirror selfie with iPhone flash of the same person, full body reflected in large clean mirror, wearing fitted white satin slip dress showing silhouette, pearl stud earrings, hair in effortless low ponytail, holding iPhone covering partial face, strappy heels visible, bright harsh flash creating high contrast, slightly washed out flash aesthetic, NOT formal gown NOT veil, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  cruise_bluesky: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. luxury cruise ship deck under vivid blue sky, groom wearing light beige summer suit with white shirt, crystal clear ocean stretching to horizon, white yacht railing, fresh sea breeze, bright natural daylight, gentle ocean waves sparkling in sunlight, clean nautical atmosphere, no text no logos no watermarks, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. elegant bride on luxury cruise ship deck under vivid blue sky, wearing strapless ivory organza dress with light flowing fabric, crystal clear ocean stretching to horizon, white yacht railing, fresh sea breeze blowing veil gently, bright natural daylight, gentle ocean waves sparkling in sunlight, clean nautical atmosphere, no text no logos no watermarks, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no face elongation no jaw enhancement no face slimming',
  },
  vintage_record: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a cozy vintage vinyl record shop, wearing olive khaki brown blazer over light blue open-collar shirt with pinstripe grey trousers and brown leather shoes, surrounded by wooden shelves filled with LP records and album covers on walls, warm tungsten incandescent bulb lighting casting golden amber glow, vinyl turntable nearby, intimate nostalgic 1970s atmosphere, Kodak Portra 400 warm film tones with soft grain, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in a cozy vintage vinyl record shop, wearing ivory puff-sleeve lace high-neck wedding dress with sweetheart neckline under sheer lace bodice, satin ribbon waist belt, elbow-length white satin gloves, short tulle veil with pearl hairpin, surrounded by wooden shelves filled with LP records and album covers, warm tungsten incandescent bulb lighting casting golden amber glow, vintage floral wallpaper in background, intimate nostalgic 1960s bridal atmosphere, Kodak Portra 400 warm film tones with soft grain, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  retro_hongkong: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in Hong Kong Mong Kok night market with red lanterns overhead and neon signs, wearing dark burgundy wine double-breasted blazer with silky sheen over black silk shirt unbuttoned showing collarbone, ivory pocket square, black slim trousers, black chelsea boots, candid mid-stride with hand in pocket, warm red lantern glow on face, rain-slicked street reflecting neon lights, Wong Kar-wai cinematic color grading, shallow depth of field, Fuji Superia 400 film grain, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. place the same person in Hong Kong Mong Kok night market with red lanterns overhead and neon signs, wearing champagne gold silk satin halter-neck dress with thin spaghetti straps and open cutout sides, small low mandarin collar, body-hugging silhouette with gold plum blossom embroidery, thigh-high side slit, pearl drop earrings, gold ankle-strap heels, hairstyle matching reference photo exactly, candid natural moment, warm red lantern glow, rain-slicked street, Wong Kar-wai cinematic grading, Fuji Superia 400 film grain, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  black_swan: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. dark moody cinematic portrait, wearing black silk-satin shawl-collar blazer over black silk-georgette relaxed collarless shirt with moderate V-neckline showing collarbones only, shirt tucked in, black high-waisted wide-leg tailored trousers, thin black leather belt, black chelsea boots, gothic cathedral interior or misty dark lake at blue hour, dramatic chiaroscuro lighting, cold blue tones, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. dark moody cinematic portrait, wearing strapless black matte silk bodice with soft wispy black ostrich feather trim across neckline, single black ostrich feather stole on left shoulder only cascading to elbow, grand floor-length A-line black tulle skirt trailing on floor, feather clusters on lower tulle, long straight black hair with see-through bangs, natural elegant makeup, subtle lip color, gothic cathedral or misty winter lake, dramatic chiaroscuro lighting, cold blue tones, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  velvet_rouge: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. dark moody cinematic portrait, wearing deep dark teal-green silk one-button blazer with peaked lapel and luminous aged jade sheen, black silk open-collar shirt no tie showing collarbones, dark teal slim trousers, black leather oxfords, dark Japanese manor corridor with candlelight or dark private library with golden desk lamp or dimly lit vintage bathroom, warm golden light against deep shadows, aristocratic darkly romantic, dreamlike trance-like expression neither smiling nor sad, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. dark moody cinematic portrait, wearing deep crimson red strapless sweetheart bell gown with overlapping sheer organza teardrop panels with embroidered dark burgundy peacock eye motifs and tiny pearls, white silk satin opera-length gloves, long straight black hair with see-through bangs, natural elegant makeup, dark Japanese manor corridor with candlelight or dark library with desk lamp or copper bathtub with floating red organza and steam, warm golden light against deep shadows, dreamlike trance-like expression neither smiling nor sad, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  water_memory: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. dreamlike cinematic portrait, wearing off-white silk mikado two-button suit with soft notch lapel and refined porcelain-like luminous sheen, white silk open-collar shirt no tie showing collarbones, off-white slim trousers, white leather dress shoes, deep teal-green underwater with caustic light patterns or vintage art deco movie theater with warm projector beam or rain-soaked night street with street lamp reflections, ethereal aquatic teal tones, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. dreamlike cinematic portrait, wearing ice-blue strapless sweetheart mermaid gown in silk mikado with refined luminous sheen, fitted to below knees then dramatic cascading fin-like organza panels in ice-blue to silver-grey gradients like betta fish fins, freshwater pearl clusters near transition, long cathedral train, natural elegant makeup, deep teal-green underwater with caustic light or vintage theater with projector beam or rain-soaked night street, ethereal aquatic teal tones, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
  blue_hour: {
    groom: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. romantic twilight portrait on European cobblestone street, wearing classic navy blue fine wool two-button suit with notch lapel, crisp white dress shirt top button undone no tie, navy slim trousers, dark brown leather oxfords, vintage street lamp casting warm golden glow, purple-blue twilight sky, cinematic warm-cool contrast, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
    bride: 'keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. romantic twilight portrait on European cobblestone street, wearing deep sapphire blue strapless silk bodice gown with flowing chiffon A-line skirt catching wind, matching blue satin pointed-toe heels, long straight black hair with see-through bangs, natural dewy makeup, vintage street lamp warm golden glow against blue hour sky, cinematic warm-cool contrast, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  },
};

const COUPLE_PROMPTS: Record<string, string> = {
  studio_classic: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a modern minimalist white studio with clean white walls and large windows casting soft natural daylight, the man wearing black tuxedo with bow tie on the left, the woman wearing white haute couture strapless sweetheart bell gown with organza petal wave skirt on the right, couple looking at each other lovingly, airy contemporary elegance, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  studio_gallery: 'keep both faces exactly the same as reference, identical face shapes eyes noses lips unchanged. couple in minimal white architectural studio with curved plaster arches and arched windows, man wearing charcoal angular peaked lapel suit with grey mock-neck, woman wearing white strapless bell gown with organza petal wave skirt, soft diffused natural light, clean airy bright, 50mm lens, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  studio_fog: 'keep both faces exactly the same as reference, identical face shapes eyes noses lips unchanged. couple in warm studio with cream linen draped backdrop and pampas grass in ceramic vase, man wearing light grey wool-cashmere suit with band-collar shirt, woman wearing white strapless fog gradient gown with layered sheer organza, sitting together on low wooden bench, soft warm light, 50mm lens, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  studio_mocha: 'keep both faces exactly the same as reference, identical face shapes eyes noses lips unchanged. couple in dark moody studio with mocha brown plaster wall and warm spotlight from above, man wearing dark warm brown wool suit with ivory shirt, woman wearing white halterneck bell gown with ice-shard organza panels, standing close foreheads touching in golden pool of light, 85mm lens, dramatic warm tones, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  studio_sage: 'keep both faces exactly the same as reference, identical face shapes eyes noses lips unchanged. couple in modern editorial studio with sage green wall and cream boucle sofa and oak floor, man wearing off-white shawl collar blazer with white knit standing beside sofa, woman wearing white one-shoulder pleated waterfall gown sitting on sofa, soft even natural light, 50mm lens, calm muted tones, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  outdoor_garden: 'keep the exact same faces, facial features, face shapes, eyes, nose, lips unchanged. preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, romantic couple in dreamy golden hour garden filled with blooming roses wisteria and wildflowers, groom wearing navy blue suit with white shirt, bride wearing ethereal white lace wedding dress holding colorful wildflower bouquet, soft warm backlit sunlight filtering through flower arches, dreamy bokeh background with pink and purple petals floating in air, romantic enchanted garden atmosphere, no text no logos no watermarks, preserve original facial identities exactly, do not alter or beautify the faces, photorealistic, 8k, ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  beach_sunset: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a beach wedding setting at golden sunset, the man in light linen suit on the left, the woman in flowing white dress on the right, walking barefoot on white sand, warm orange pink sky, romantic, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  hanbok_traditional: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a modern Korean hanbok wedding photoshoot, the man wearing refined navy hanbok with clean lines on the left, the woman wearing elegant pastel pink and ivory hanbok with delicate floral embroidery on the right, minimalist Korean traditional courtyard with soft bokeh, romantic warm golden light, modern editorial wedding style, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  hanbok_wonsam: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in grand Korean royal palace Geunjeongjeon hall, the man wearing heukdallyeong black ceremonial robe with samo headpiece on the left, the woman wearing vibrant red wonsam with golden phoenix embroidery and elaborate hwagwan jeweled crown on the right, red lacquered pillars with dancheong patterns, warm natural daylight, dignified royal wedding ceremony, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  hanbok_dangui: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in serene traditional Korean garden with lotus pond and pine trees, the man wearing jade-green dopo with yugeon headband on the left, the woman wearing blush-pink dangui with gold-thread embroidery over navy chima and jokduri coronet on the right, gentle morning sunlight, refined elegant atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  hanbok_modern: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in minimalist modern hanok interior with white walls and warm wood floor, the man wearing charcoal gray modern durumagi over white jeogori on the left, the woman wearing pastel lavender jeogori over white chima with minimalist silver binyeo on the right, soft diffused natural light, contemporary elegant atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  hanbok_saeguk: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in magnificent Gyeongbokgung throne hall with golden dragon screen, the man wearing deep crimson gonryongpo with golden dragon embroidery and gwanmo crown on the left, the woman wearing magnificent golden hwarot with phoenix embroidery and grand jokduri crown on the right, cinematic golden hour light, epic royal drama atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  hanbok_flower: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in blooming hanok courtyard with cherry blossoms and azaleas, the man wearing ivory durumagi Korean traditional overcoat with V-shaped crossed collar gyotgit and goreum ribbon ties and floral embroidery on the left, the woman wearing lilac jeogori with flower embroidery over white chima with flower hairpin on the right, warm golden spring sunlight, romantic garden atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  city_night: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a cinematic city night wedding scene, the man in tailored black tuxedo on the left, the woman in sleek white evening gown on the right, rain-slicked street reflecting neon and warm street lights, shallow depth of field, moody cinematic color grading, Wong Kar-wai inspired atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  cherry_blossom: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a cherry blossom wedding setting, the man in gray suit on the left, the woman in white dress on the right, couple looking at each other with gentle smiles, pink sakura petals falling around them, spring sunlight, dreamy pastel atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  forest_wedding: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in an enchanted forest wedding setting, the man in dark suit on the left, the woman in ethereal white gown on the right, deep green forest with golden sunlight streaming through trees, white rose and ivy flower arch, floating light particles, magical romantic atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  castle_garden: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a dramatic European castle wedding, the man in classic black tailcoat on the left, the woman in grand white ball gown with cathedral train on the right, baroque palace with ornate columns and chandeliers, dramatic golden light streaming through tall windows, cinematic grandeur, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  cathedral: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a romantic cathedral wedding ceremony, the man in charcoal morning suit on the left, the woman in classic ivory cathedral gown with long veil on the right, warm candlelight illuminating gothic arches, stained glass casting colorful light, white roses lining the aisle, intimate romantic atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  watercolor: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a fine art wedding portrait, the man in cream linen suit on the left, the woman in flowing soft tulle gown on the right, painterly soft focus background with muted pastel florals, diffused golden light, high-end editorial aesthetic, dreamy romantic atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  magazine_cover: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a high-end editorial wedding photoshoot, the man in designer black suit on the left, the woman in sculptural white couture gown on the right, clean minimalist studio, single dramatic spotlight from above, strong confident poses facing camera, high contrast black and white toned lighting, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  rainy_day: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple sharing a transparent umbrella in gentle rain, the man in dark navy coat suit on the left, the woman in white dress on the right, soft rain creating beautiful bokeh, wet cobblestone street reflections, intimate romantic mood, soft diffused overcast light, cinematic rain photography, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  autumn_leaves: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in an autumn wedding scene, the man in warm brown tweed suit on the left, the woman in ivory dress on the right, surrounded by golden red maple leaves, tree-lined avenue with fall foliage canopy, warm amber golden hour light, romantic cozy autumn atmosphere, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  winter_snow: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a winter wonderland wedding, the man in charcoal wool coat suit on the left, the woman in white fur-trimmed gown on the right, gentle snowfall, frosted pine trees, soft blue-white winter light, breath visible in cold air, magical serene winter romance, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  vintage_film: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. place the same couple in a vintage film photography wedding, the man in retro brown suit with wide lapels on the left, the woman in classic A-line lace dress on the right, warm film grain texture, slightly faded Kodak Portra 400 color palette, soft natural window light, nostalgic 1970s wedding aesthetic, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  cruise_sunset: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same faces, facial features, face shapes, eyes, nose, lips unchanged. romantic couple on luxury yacht deck at golden hour sunset, groom wearing cream linen suit with open collar white shirt, bride wearing flowing white chiffon dress with wind-blown fabric, warm amber ocean light, gentle sea breeze blowing hair softly, turquoise Mediterranean sea behind, yacht railing and polished wood deck, golden sun reflecting on calm water waves, couple standing close together looking at each other lovingly, romantic warm cinematic lighting, no text no logos no watermarks, preserve original facial identities exactly, do not alter or beautify the faces, photorealistic, 8k ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
iphone_selfie: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. authentic iPhone couple selfie from above at arms length, both faces close together filling frame, slightly tilted off-center, the man in white button-up shirt open collar on the left, the woman in white top or camisole on the right, on-camera flash with neutral cool white balance, digital noise and grain, slightly overexposed flash, both with candid natural laughing or smiling expressions, heads touching or very close, NOT studio NOT warm golden NOT formal, raw couple selfie, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  iphone_mirror: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. couple mirror selfie with iPhone flash, both reflected in large clean mirror, the man in white t-shirt under open black blazer on the left, the woman in fitted white satin slip dress on the right, one person holding iPhone visible in mirror, bright harsh flash high contrast, slightly washed out flash aesthetic, casual fun couple mirror pose, NOT formal, preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  cruise_bluesky: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same faces, facial features, face shapes, eyes, nose, lips unchanged. elegant couple on luxury cruise ship deck under vivid blue sky, groom wearing light beige summer suit with white shirt, bride wearing strapless ivory organza dress, crystal clear ocean stretching to horizon, white yacht railing, fresh sea breeze, bright natural daylight, gentle ocean waves sparkling in sunlight, couple embracing naturally on deck, clean nautical atmosphere, no text no logos no watermarks, preserve original facial identities exactly, do not alter or beautify the faces, photorealistic, 8k ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  vintage_record: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same faces, facial features, face shapes, eyes, nose, lips unchanged. romantic couple in a cozy vintage vinyl record shop, the man wearing olive khaki brown blazer over light blue open-collar shirt with pinstripe grey trousers on the left, the woman wearing ivory puff-sleeve lace high-neck wedding dress with sweetheart neckline under sheer lace bodice satin ribbon waist belt elbow-length white satin gloves and short tulle veil with pearl hairpin on the right, surrounded by wooden shelves filled with LP records and album covers on walls, warm tungsten incandescent bulb lighting casting golden amber glow, vinyl turntable nearby, couple looking at each other lovingly or browsing records together, intimate nostalgic 1970s atmosphere, Kodak Portra 400 warm film tones with soft grain, no text no logos no watermarks, preserve original facial identities exactly, do not alter or beautify the faces, photorealistic, 8k ultra sharp facial details, no face distortion no face morphing no face smoothing, maintain natural skin texture pores and contours for both faces, no face elongation no jaw enhancement no face slimming',
  retro_hongkong: 'preserve both faces with absolute accuracy, maintain exact facial proportions face shape eye spacing nose size lip shape for both subjects, keep the exact same faces unchanged. couple walking together in Hong Kong Mong Kok night market with red lanterns overhead, the man wearing dark burgundy double-breasted blazer with silky sheen over black silk shirt unbuttoned showing collarbone with ivory pocket square on the left, the woman wearing champagne gold silk satin halter-neck dress with spaghetti straps open cutout sides small mandarin collar gold plum blossom embroidery thigh-high slit pearl earrings long loose black hair flowing down past shoulders never tied up on the right, neon signs with Chinese characters, rain-slicked street reflecting red and amber lights, candid walking moment looking at each other warmly, Wong Kar-wai cinematic grading, Fuji Superia 400 grain, no text no logos no watermarks, preserve original facial identities exactly, do not alter or beautify the faces, photorealistic, 8k ultra sharp facial details, no face distortion no face morphing no face smoothing, no face elongation no jaw enhancement no face slimming',
  black_swan: 'keep both faces exactly the same as reference, identical face shapes eyes noses lips unchanged. dark moody cinematic couple portrait inside gothic cathedral, man wearing black silk-satin shawl-collar blazer over black V-neck silk-georgette shirt, woman wearing strapless black feather-trimmed tulle ball gown with feather stole on left shoulder, foreheads touching, cool blue light through stained glass windows, dark stone columns, dramatic chiaroscuro lighting, cold blue tones, 35mm lens, film grain, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  velvet_rouge: 'keep both faces exactly the same as reference, identical face shapes eyes noses lips unchanged. dark moody cinematic couple portrait, man wearing deep dark teal-green silk peaked lapel suit with black silk shirt, woman wearing deep crimson red strapless sweetheart bell gown with peacock eye embroidered organza teardrop panels and white silk opera gloves, dark Japanese manor corridor with paper lanterns and tatami or dark private library with leather armchair and golden desk lamp or dimly lit vintage bathroom she in copper bathtub with red organza floating in water he kneeling beside holding her face, warm golden candlelight against deep shadows, aristocratic darkly romantic, dreamlike trance-like mood neither smiling nor sad but entranced, 35mm lens, film grain, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  water_memory: 'keep both faces exactly the same as reference, identical face shapes eyes noses lips unchanged. dreamlike cinematic couple portrait, man wearing off-white silk mikado suit with white open-collar shirt no tie, woman wearing ice-blue strapless sweetheart mermaid gown with cascading betta fish fin-like organza panels and freshwater pearl clusters, deep dark teal-green underwater floating together foreheads almost touching eyes closed hair floating upward tiny air bubbles soft caustic light from above, or sitting together in empty vintage art deco movie theater faded red velvet seats warm projector beam dust particles she resting head on his shoulder, or standing face to face in heavy rain on empty night street his hands on her face her hands on his chest wet reflective asphalt warm street lamp glow, ethereal teal tones, 50mm lens, film grain, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
  blue_hour: 'keep both faces exactly the same as reference, identical face shapes eyes noses lips unchanged. romantic couple portrait slow dancing under vintage street lamp at twilight, man wearing navy blue suit white shirt no tie, woman wearing sapphire blue strapless satin and chiffon gown skirt floating mid-sway, his hand on her waist her hand on his shoulder, purple-blue twilight sky with warm glowing street lamp, European cobblestone street, cinematic warm-cool contrast, 50mm lens, film grain, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming',
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

    let basePrompt = '';
    if (mode === 'couple') {
      basePrompt = COUPLE_PROMPTS[concept] || COUPLE_PROMPTS.studio_classic;
    } else if (mode === 'groom') {
      basePrompt = SOLO_PROMPTS[concept]?.groom || SOLO_PROMPTS.studio_classic.groom;
    } else {
      basePrompt = SOLO_PROMPTS[concept]?.bride || SOLO_PROMPTS.studio_classic.bride;
    }
    const pose = getRandomPose(mode);
    const prompt = pose + ', ' + basePrompt;

    const isCouple = mode === 'couple';
    const strength = isCouple ? 0.15 : (concept.startsWith('iphone_') ? 0.22 : (CRUISE_CONCEPTS.includes(concept) ? 0.18 : 0.18));
    let urls: string[];
    if (isCouple) {
      if (imageUrls.length >= 3) {
        urls = [imageUrls[2], imageUrls[0], imageUrls[1]];
      } else {
        urls = imageUrls.slice(0, 2);
      }
    } else {
      urls = imageUrls;
    }
    const body: Record<string, unknown> = {
      prompt,
      image_urls: urls,
      strength,
      num_images: 1,
      image_size: { width: 768, height: 1152 },
      negative_prompt: NEGATIVE_PROMPT,
    };
    const submit = await falFetch(`${FAL_QUEUE}/fal-ai/nano-banana-2/edit`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (submit.images) {
      const falUrl = submit.images[0]?.url;
      if (falUrl) {
        const swappedUrl = await applyFaceSwap(falUrl, mode === 'couple', imageUrls);
        const uploaded = await uploadFromUrl(swappedUrl, 'ai-snap');
        await prisma.aiSnap.update({
          where: { id: snapId },
          data: { status: 'done', resultUrl: uploaded.url, prompt },
        });
      } else {
        await prisma.aiSnap.update({
          where: { id: snapId },
          data: { status: 'failed', prompt },
        });
      }
      return;
    }

    if (!submit.status_url) throw new Error('No status_url');

    const result = await waitForResult(submit.status_url, submit.response_url);
    const falUrl = result.images?.[0]?.url;
    if (!falUrl) throw new Error('No result image');
    const uploaded = await uploadFromUrl(falUrl, 'ai-snap');
    await prisma.aiSnap.update({
      where: { id: snapId },
      data: { status: 'done', resultUrl: uploaded.url, prompt },
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
    let basePrompt = '';
    if (mode === 'couple') {
      basePrompt = COUPLE_PROMPTS[concept] || COUPLE_PROMPTS.studio_classic;
    } else if (mode === 'groom') {
      basePrompt = SOLO_PROMPTS[concept]?.groom || SOLO_PROMPTS.studio_classic.groom;
    } else {
      basePrompt = SOLO_PROMPTS[concept]?.bride || SOLO_PROMPTS.studio_classic.bride;
    }
    const pose = getRandomPose(mode);
    const prompt = pose + ', ' + basePrompt;

    await prisma.user.update({ where: { id: userId }, data: { freeSnapUsed: true } });

    let urls: string[];
    if (mode === 'couple') {
      if (imageUrls.length >= 3) {
        urls = [imageUrls[2], imageUrls[0], imageUrls[1]];
      } else {
        urls = imageUrls.slice(0, 2);
      }
    } else {
      urls = imageUrls;
    }
    const isCouple = mode === 'couple';
    const isSelfie = concept === 'iphone_selfie' || concept === 'iphone_mirror';
    const isCruise = concept === 'cruise_sunset' || concept === 'cruise_bluesky';
    const strength = isSelfie ? 0.22 : isCruise ? 0.18 : isCouple ? 0.15 : 0.18;

    const submit = await falFetch(`${FAL_QUEUE}/fal-ai/nano-banana-2/edit`, {
      method: 'POST',
      body: JSON.stringify({ prompt, image_urls: urls, strength, num_images: 1, image_size: { width: 768, height: 1152 }, negative_prompt: NEGATIVE_PROMPT }),
    });

    if (submit.images) {
      const rawUrl = submit.images[0]?.url;
      const swappedUrl = await applyFaceSwap(rawUrl, isCouple, imageUrls);
      const uploaded = await uploadFromUrl(swappedUrl, 'ai-snap/free');
      const watermarked = getWatermarkedUrl(uploaded.publicId);
      await prisma.aiSnap.create({
        data: {
          userId, concept, engine: 'nano-banana-2', prompt,
          inputUrls: imageUrls, resultUrl: watermarked,
          resultOriginalUrl: uploaded.url, status: 'done', isFree: true,
        },
      });
      return res.json({ status: 'done', resultUrl: watermarked });
    }
    if (!submit.status_url) throw new Error('No status_url');
    const snap = await prisma.aiSnap.create({
      data: {
        userId, concept, engine: 'nano-banana-2', prompt,
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
        weddingId, concept, engine: 'nano-banana-2',
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



router.post('/admin/ic-test', authMiddleware, async (req: AuthRequest, res) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'admin only' });
  const { prompt, imageUrl } = req.body;
  if (!prompt || !imageUrl) return res.status(400).json({ error: 'prompt, imageUrl required' });
  try {
    const submit = await falFetch('https://queue.fal.run/fal-ai/instant-character', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        image_url: imageUrl,
        image_size: { width: 768, height: 1152 },
      }),
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
    }
    if (!falUrl) throw new Error('No image generated');
    const uploaded = await uploadFromUrl(falUrl, 'ai-snap-ic-test');
    res.json({ status: 'done', resultUrl: uploaded.url, engine: 'instant-character' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/pulid-test', authMiddleware, async (req: AuthRequest, res) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'admin only' });
  const { prompt, imageUrl, idWeight, negativePrompt } = req.body;
  if (!prompt || !imageUrl) return res.status(400).json({ error: 'prompt, imageUrl required' });
  try {
    const submit = await falFetch('https://queue.fal.run/fal-ai/flux-pulid', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        reference_image_url: imageUrl,
        image_size: { width: 768, height: 1152 },
        id_weight: idWeight || 0.85,
        guidance_scale: 4,
        num_inference_steps: 20,
        negative_prompt: negativePrompt || 'deformed face, cartoon, anime, illustration, blurry, low quality',
        max_sequence_length: '256',
      }),
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
    }
    if (!falUrl) throw new Error('No image generated');
    const uploaded = await uploadFromUrl(falUrl, 'ai-snap-pulid-test');
    res.json({ status: 'done', resultUrl: uploaded.url, engine: 'flux-pulid' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/quick-generate', authMiddleware, async (req: AuthRequest, res) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: '관리자만 가능' });
  const { concept, imageUrls, mode } = req.body;
  if (!concept || !imageUrls || imageUrls.length < 1) return res.status(400).json({ error: 'concept, imageUrls required' });
  try {
    let basePrompt = '';
    if (mode === 'couple') {
      basePrompt = COUPLE_PROMPTS[concept] || COUPLE_PROMPTS.studio_classic;
    } else if (mode === 'groom') {
      basePrompt = SOLO_PROMPTS[concept]?.groom || SOLO_PROMPTS.studio_classic.groom;
    } else {
      basePrompt = SOLO_PROMPTS[concept]?.bride || SOLO_PROMPTS.studio_classic.bride;
    }
    const pose = getRandomPose(mode);
    const prompt = pose + ', ' + basePrompt;
    const effectiveMode = req.body.mode || 'groom';
    const isCouple = effectiveMode === 'couple';
    const strength = isCouple ? 0.15 : (concept.startsWith('iphone_') ? 0.22 : (CRUISE_CONCEPTS.includes(concept) ? 0.18 : 0.18));
    let urls: string[];
    if (isCouple) {
      if (imageUrls.length >= 3) {
        urls = [imageUrls[2], imageUrls[0], imageUrls[1]];
      } else {
        urls = imageUrls.slice(0, 2);
      }
    } else {
      urls = imageUrls;
    }
    const submit = await falFetch(`${FAL_QUEUE}/fal-ai/nano-banana-2/edit`, {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        image_urls: urls,
        strength,
        num_images: 1,
      image_size: { width: 768, height: 1152 },
        negative_prompt: NEGATIVE_PROMPT,
      }),
    });
    if (submit.images) {
      const falUrl = submit.images[0]?.url;
      if (falUrl) {
        const swappedUrl = falUrl;
        const uploaded = await uploadFromUrl(swappedUrl, 'ai-snap');
        return res.json({ status: 'done', resultUrl: uploaded.url });
      }
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
      const falUrl = result.images?.[0]?.url;
      if (falUrl) {
        const swappedUrl = falUrl;
        const uploaded = await uploadFromUrl(swappedUrl, 'ai-snap');
        return res.json({ status: 'done', resultUrl: uploaded.url });
      }
      return res.json({ status: 'done', resultUrl: null });
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
