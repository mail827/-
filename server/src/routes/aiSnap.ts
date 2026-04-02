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
  { id: 'rose_garden', label: '장미 정원' },
  { id: 'grass_rain', label: '풀밭' },
  { id: 'eternal_blue', label: '블루' },
  { id: 'heart_editorial', label: '하이 에디토리얼' },
  { id: 'vintage_tungsten', label: '빈티지 텅스텐' },
  { id: 'aao', label: '에에올' },
  { id: 'spring_letter', label: '봄: 러브레터' },
  { id: 'summer_rain', label: '여름: 소나기' },
  { id: 'autumn_film', label: '가을: 필름' },
  { id: 'winter_zhivago', label: '겨울: 지바고' },
];

const PACKAGE_QUOTA: Record<string, number> = {
  lite: 1,
  basic: 3,
  'ai-reception': 10,
  'basic-video': 3,
  standard: 1,
  premium: 20,
};
const FREE_TRIAL = 1;
const EXTRA_PRICE = 1500;
const CRUISE_CONCEPTS = ['cruise_sunset', 'cruise_bluesky'];


const RANDOM_POSES_GROOM = [
  'three quarter body shot from head to knees, confident relaxed standing pose with both hands visible, one hand in pocket, slight confident smile, direct warm eye contact, shallow depth of field',
  'full body shot from head to toe, sharp standing pose with both hands naturally visible, weight on back foot, moody rim lighting on jawline, contemplative expression',
  'medium shot framing at waist level, upper body, one hand touching open collar casually, slight head tilt, intimate warm gaze, both hands visible',
  'medium shot framing at waist level, upper body leaning shoulder against wall, relaxed smirk, dramatic side lighting',
  'tight closeup framing at chest level, genuine laughing moment, head tilted, natural joy, eyes crinkled with warmth',
  'three quarter body mid-stride, one hand in pocket, looking slightly off-camera with half-smile',
  'medium shot framing at waist level, upper body looking down with gentle smile, adjusting cuff, soft intimate moment',
  'medium shot framing at waist level, upper body turned away, glancing back over shoulder, charming half smile, dramatic backlight',
];

const RANDOM_POSES_BRIDE = [
  'three quarter body shot from head to knees, elegant standing pose with both hands visible holding bouquet, soft warm smile, gentle eye contact, shallow depth of field, beautiful skin glow',
  'full body shot from head to toe, graceful standing pose with both hands naturally at sides, slight weight shift on one hip, serene confident expression',
  'medium shot framing at waist level, upper body, one hand gracefully touching hair behind ear, gentle head tilt, soft warm smile, both hands visible',
  'medium shot framing at waist level, upper body candid laughing moment, eyes crinkled with genuine joy, hand near face',
  'medium shot framing at waist level, upper body looking back over shoulder with mysterious inviting smile, dramatic backlight',
  'medium shot framing at waist level, upper body looking down with gentle smile, one hand adjusting earring, soft intimate moment',
  'three quarter body leaning casually against wall, one leg bent, relaxed confident expression',
  'three quarter body mid-walk, dress visible, looking ahead with gentle smile, natural stride',
];

const RANDOM_POSES_COUPLE = [
  'three quarter body shot from head to knees, couple standing close together, his arm around her waist, her hand on his chest, both looking at camera with warm smiles, all hands visible',
  'full body shot from head to toe, couple walking hand in hand, natural relaxed stride, looking at each other with genuine smiles, both full bodies visible',
  'medium shot framing at waist level, upper body facing each other with warm gentle smiles, intimate close distance, both hands visible',
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


const cropToPortrait = (url: string): string => {
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/c_fill,ar_3:4,g_face,w_900,h_1200/');
  }
  return url;
};

const FACE_INSTRUCTION = 'CRITICAL: preserve the EXACT original face AND exact hairstyle hair length hair color from the reference photo unchanged. Do NOT modify eyes, do NOT add double eyelids, do NOT change eye shape. Keep exact nose, lips, jaw, face proportions. Do NOT beautify or slim face. Do NOT change hairstyle, do NOT cut hair shorter, do NOT add bangs if none exist, keep exact same hair from input photo. Do NOT create deformed hands or extra fingers. Do NOT add text logos watermarks. Keep clean elegant clothing with no distortion';


const SCENE_ROTATION: Record<string, { groom: string[]; bride: string[]; couple: string[] }> = {
  rose_garden: {
    groom: [
      'editorial portrait in lavish rococo salon with pale pink walls gilded ornate mirrors climbing pink roses crystal chandelier with dripping candle lights, wearing pale warm beige soft wool two-button suit with natural shoulders relaxed drape ivory cream silk tie in loose knot over white dress shirt ivory pocket square, leaning on gilded pink velvet chaise longue with amused grin, scattered rose petals and pale pink macarons on gold tray nearby, soft diffused pastel pink light dreamy hazy atmosphere, long straight black hair, photorealistic, 8k',
      'editorial portrait standing on small ornate stone balcony overlooking pink rose garden below, rococo pale pink exterior wall with gilded window frame behind, wearing pale warm beige soft wool two-button suit ivory cream silk tie white dress shirt, leaning on stone balustrade looking out at garden, climbing roses around open French doors, soft overcast afternoon light, long straight black hair, photorealistic, 8k',
    ],
    bride: [
      'editorial portrait on grand curved marble staircase with wrought iron pink rose vine railing in rococo palace, pale pink walls with gilded molding, wearing ivory duchess silk satin off-shoulder wedding dress with softly draped silk at collarbone structured corset bodice three blush pink rosettes at left shoulder full voluminous A-line skirt with long graceful train cascading down marble stairs behind her, one hand on railing descending stairs, soft natural light from tall arched window, long straight black hair past shoulders, pastel pink atmosphere, photorealistic, 8k',
      'editorial portrait standing facing large gilded mirror in rococo salon adjusting rosette on shoulder, wearing ivory duchess silk satin off-shoulder wedding dress with draped silk at collarbone structured corset three blush pink rosettes at left shoulder full A-line skirt, three-quarter back angle with mirror showing face, pale pink walls climbing pink roses around mirror frame, soft diffused pastel pink light, long straight black hair, photorealistic, 8k',
    ],
    couple: [
      'couple in lavish rococo salon with pale pink walls gilded ornate mirrors white iron trellis completely covered in climbing pink roses crystal chandelier with dripping candle lights, man wearing pale warm beige soft wool two-button suit ivory tie white shirt leaning on back of gilded pink velvet chaise longue looking down with amused grin, woman wearing ivory duchess silk satin off-shoulder wedding dress with draped silk at collarbone structured corset three blush pink rosettes at left shoulder full A-line skirt with long train sitting sideways on chaise laughing mid-bite into pale pink macaron, scattered rose petals and macarons on small gold tray, soft diffused natural window light from right with gentle pastel pink color cast, dreamy hazy atmosphere, both with long straight black hair, photorealistic editorial photograph 50mm lens shallow depth of field film grain, 8k',
      'couple standing on small ornate stone balcony overlooking pink rose garden below, rococo pale pink exterior wall with gilded window frame behind, man wearing pale beige suit ivory tie white shirt, woman wearing ivory duchess silk satin off-shoulder dress with rosettes at shoulder full A-line skirt, leaning on stone balustrade side by side she rests head on his shoulder both looking out at garden, shot from inside room framing them through open French doors, climbing roses around doorframe, soft overcast afternoon light, both with long straight black hair, photorealistic editorial photograph 50mm lens, 8k',
    ],
  },
  grass_rain: {
    groom: [
      'analog film portrait in wide green grassy hillside on grey rainy day, wearing black wool slim-fit two-button suit with natural shoulders white shirt open collar no tie jacket unbuttoned slightly damp on shoulders, standing in tall wet grass, fine rain mist visible in air, muted desaturated green-grey tones, completely flat grey overcast light, heavy film grain shot on Fuji Superia 400, long straight black hair, photorealistic, 8k',
      'analog film portrait walking away from camera up gentle green grassy slope, shot from behind at low waist level, wearing black wool suit white shirt open collar no tie, tall grass and small wildflowers blurred in foreground, soft overcast light, muted desaturated green tone, grainy analog film, long straight black hair, photorealistic, 8k',
    ],
    bride: [
      'analog film portrait in wide green grassy field on overcast rainy day, wearing light ivory silk chiffon halter-neck wedding dress with crossed draped fabric gathered at back of neck shoulders bare, gently fitted bodice with natural soft gathers, multiple opaque layered chiffon skirt with uneven raw-edge hemlines catching slight breeze, fabric fully opaque with dense layering ensuring complete coverage, fine rain on skin, eyes closed soft smile, flat grey overcast light, muted green-grey tones heavy film grain Kodak Portra 400, long straight black hair slightly damp, photorealistic, 8k',
      'analog film close-up portrait standing forehead to forehead position in green field on rainy day, wearing light ivory silk chiffon halter-neck dress with crossed draped neckline, wet hair sticking to cheeks, raindrops on skin, both eyes closed soft smile, fine rain falling around, completely flat grey overcast light, shallow depth of field grassy background dissolved into green blur, heavy film grain Fuji Pro 400H muted green-grey tones, long straight black hair damp from rain, photorealistic, 8k',
    ],
    couple: [
      'couple sitting close together in tall wet grass on grey rainy day, woman sitting between his legs leaning back into him eyes closed smiling wearing light ivory silk chiffon halter-neck wedding dress with crossed draped neckline fabric fully opaque with dense layering, man wearing black wool two-button suit white shirt open collar no tie wrapping arms around her, fine rain mist visible in air, no sun completely flat grey light, heavy film grain shot on Kodak Portra 400 pushed two stops, muddy green-grey color palette, both with long straight black hair slightly damp, photorealistic analog film photograph, 8k',
      'couple running through green field holding hands captured with slight motion energy, woman wearing light ivory silk chiffon halter-neck dress sheer skirt flowing in movement, man taller in black suit white shirt, running toward camera laughing, rainy grey overcast day, heavy film grain Fuji Superia 400 muted green-grey tones, both with long straight black hair flying behind, photorealistic analog film, 8k',
    ],
  },
  eternal_blue: {
    groom: [
      'melancholic cinematic portrait between tall bookshelves in dimly lit old bookstore, wearing slate blue-grey wool one-button suit with slim peak lapels clean sharp silhouette white silk shirt spread collar top button undone no tie small pearl pin on left lapel, standing above looking down with gentle smile, warm single brass desk lamp at end of aisle casting long shadows through gaps between books, dust particles floating in lamplight beam, warm tungsten and cool shadow split, long straight black hair, heavy film grain, photorealistic, 8k',
      'melancholic cinematic portrait caught mid-stride inside perfect circle of white spotlight on completely black stage floor wearing slate blue-grey wool one-button suit with slim peak lapels white shirt pearl lapel pin, body angled dynamically one foot forward, everything outside spotlight is pure black void, hard theatrical lighting, long straight black hair, heavy film grain, photorealistic, 8k',
    ],
    bride: [
      'melancholic cinematic portrait on empty grey winter beach at dusk, wearing dusty powder blue strapless sweetheart satin bodice dress with massive voluminous cloud-like tulle ruffled skirt in graduating shades from dusty blue to pale icy blue at hem hand-gathered in irregular cloud-like ruffles, single pearl strand draped across bodice, standing alone at water edge with back three-quarters turned to camera, enormous tulle skirt dragging across dark wet sand, cold wind blowing hair sideways, grey overcast sky meeting grey ocean, cold desaturated blue-grey monochrome, heavy film grain, long straight black hair, photorealistic, 8k',
      'melancholic cinematic portrait shot from directly overhead bird-eye view lying on frozen cracked ice surface, wearing dusty blue strapless sweetheart satin bodice tulle dress massive blue tulle skirt fanned out across white ice like spilled ink dissolving in water, pearl strand across bodice, hair spread across ice, staring straight up at camera with quiet calm expression, hairline cracks in ice radiating outward, flat cold overcast light, blue tulle against white ice only color, long straight black hair fanned out, heavy film grain Kodak Vision3 500T blue-shifted, photorealistic, 8k',
    ],
    couple: [
      'couple on frozen cracked lake surface under heavy grey sky light snow falling, woman wearing dusty powder blue strapless sweetheart satin bodice dress with massive voluminous cloud-like tulle ruffled skirt in graduating blue tones pearl strand across bodice, man wearing slate blue-grey wool one-button suit white shirt pearl lapel pin wrapping his jacket around both of them, she buries face in his chest, massive blue tulle skirt spreads across white ice like pool of blue watercolor dissolving into white, everything fading to white at edges, monochromatic blue-white-grey palette, both with long straight black hair, quiet melancholic heavy film grain, photorealistic, 8k',
      'couple standing at water edge on empty grey winter beach at dusk facing ocean with backs to camera, woman wearing dusty blue tulle dress with pearl strand massive skirt pooling on wet sand behind her, man wearing slate blue-grey suit pearl lapel pin standing close beside her shoulders barely touching not holding hands, grey sky beginning to show faintest crack of pale blue light along horizon, wet sand reflects their silhouettes, shot from far away making them small figures against vast grey seascape, cold monochrome with single line of distant blue, both with long straight black hair, heavy film grain quiet and still, photorealistic, 8k',
    ],
  },
  heart_editorial: {
    groom: [
      'high fashion editorial portrait caught mid-stride inside perfect circle of white spotlight on completely black stage floor, wearing sharp black wool double-breasted six-button jacket with extreme wide peaked lapels heavily structured squared shoulders high-waisted wide-leg trousers with razor-sharp front crease, crisp white shirt buttoned to top narrow black silk tie pulled very tight, single small red fabric heart pinned on left lapel, body angled dynamically one foot forward jacket swinging slightly arms in motion, everything outside spotlight circle is pure black void, hard theatrical lighting deep contrast, long straight black hair, photorealistic, 8k',
      'high fashion editorial extreme close-up face against pure black background, holding gold-rimmed magnifying glass over right eye making eye appear enormous through lens staring directly at camera, only eyes nose and lips visible in tight crop, wearing sharp black double-breasted suit just the wide peaked lapel barely visible with red fabric heart pin, one hard key light from upper left creating deep shadow on right side of face, rest is pure darkness, long straight black hair, photorealistic 85mm macro lens razor sharp focus on magnified eye, 8k',
    ],
    bride: [
      'high fashion editorial portrait shot from directly overhead bird-eye view lying on black floor, wearing pure white architectural high mock-neck wedding dress with structured exaggerated square shoulders rigid sculpted heavy white duchess satin torso, massive origami organza train fanned out in perfect spiral around body filling frame like white sculpture on black canvas, one single oversized red fabric heart brooch pinned at center of chest, one hand resting on chest over heart other extended outward disappearing into white folds, hair fanned out around head, looking straight up at camera with intense calm gaze, hard overhead light creating bright white form against pure black floor, long straight black hair, photorealistic, 8k',
      'high fashion editorial extreme close-up face against pure black background, holding gold-rimmed magnifying glass over right eye making eye appear enormous through lens staring directly at camera, only eyes nose and lips visible in tight crop, wearing white architectural mock-neck dress just the high neckline barely visible at bottom of frame with red fabric heart brooch peeking at edge, one hard key light from upper left creating deep shadow on right side of face, rest is pure darkness, long straight black hair, photorealistic 85mm macro lens razor sharp focus on magnified eye, 8k',
    ],
    couple: [
      'couple in dark studio, woman sitting on simple black cube wearing pure white architectural mock-neck dress with structured exaggerated square shoulders rigid sculpted torso origami train pooled on black floor red fabric heart brooch at chest resting chin on one hand looking directly at camera, man standing tall behind her one head taller wearing sharp black double-breasted six-button suit with wide peaked lapels white shirt narrow black tie red fabric heart on left lapel looking down at her not at camera, single hard beauty dish light from directly above casting defined shadows under cheekbones, everything else falls to black, only white dress black suit two red hearts and skin tones visible, both with long straight black hair, heavy contrast editorial fashion photograph 85mm lens, photorealistic, 8k',
      'plain white wall with sharp black shadow silhouettes of couple in profile about to kiss projected by single hard side light source, actual couple not visible only their shadows on wall, her shadow shows structured square shoulders of dress and high neckline, his shadow shows wide peaked lapels of double-breasted suit, shadow noses almost touching, in bottom right corner woman actual hand reaches into frame holding red fabric heart between fingers, hand is only real element everything else is shadow play, hard directional side light, high contrast black and white with only red heart in color, photorealistic, 8k',
    ],
  },
  vintage_tungsten: {
    groom: [
      'portrait in dark maximalist vintage room with floral wallpaper roses and tropical leaves, wearing dark navy wool relaxed vintage suit white rounded collar shirt dusty lavender tie, standing beside floor lamp with fabric shade, direct on-camera flash flat harsh shadow behind on wallpaper, one hand in pocket trying to look cool but slightly awkward self-conscious half-smile, faded warm print colors yellow midtones, disposable camera at wedding reception, photorealistic, 8k',
      'portrait on narrow dark wood staircase with faded floral carpet runner and framed photos on wall, wearing dark navy suit white shirt lavender tie, standing at bottom of stairs hand extended upward, single bare warm bulb in stairwell, on-camera flash from bottom harsh shadow behind, orange-shifted highlights 1970s amateur photography, photorealistic, 8k',
    ],
    bride: [
      'portrait in front of dark floral wallpaper with large roses and tropical leaves, wearing ivory floral lace high Victorian neckline dress bishop sleeves satin ribbon belt fingertip tulle veil, standing with hands clasped at waist shy gentle smile, tall tropical plant beside, direct on-camera flash too close face slightly overexposed flat harsh shadow behind, faded warm print colors magenta highlights, husband took this with compact film camera 1981, photorealistic, 8k',
      'portrait descending narrow dark wood staircase with faded carpet runner, wearing ivory floral lace high-neck dress bishop sleeves satin belt veil trailing on stairs, one hand on banister looking down at camera, single bare warm bulb above, on-camera flash from below harsh lighting deep darkness at top, faded print orange highlights 1970s, photorealistic, 8k',
    ],
    couple: [
      'couple sitting on floral velvet sofa in dark maximalist vintage room with rose and tropical leaf wallpaper, old CRT television and houseplants behind, floor lamp with fabric shade, man in dark navy relaxed suit white rounded collar shirt lavender tie, woman in ivory floral lace high-neck dress bishop sleeves satin belt veil, she holds his hand both smiling warmly at camera, direct on-camera flash faces bright background dark, faded warm print magenta highlights yellow midtones, scanned photograph from 1979 wedding album, photorealistic, 8k',
      'couple sitting on carpet floor in front of old CRT television showing static, dark floral wallpaper behind, man in navy suit jacket removed white shirt lavender tie loosened, woman in ivory lace dress bishop sleeves satin belt veil on shoulders, she leans head on his shoulder he rests cheek on her head, eyes closed peaceful, ambient tungsten light and cool TV static glow, low light muddy warm colors crushed shadows, candid snapshot on cheap 35mm 1982, photorealistic, 8k',
    ],
  },
  aao: {
    groom: [
      'portrait standing in brightly lit Korean convenience store at night, wearing grand ivory silk shantung double-breasted peak-lapel long jacket extending past hip structured wide shoulders, high-waisted wide-leg trousers sharp crease, white silk shirt cream tie, oversized googly eye on left lapel, holding triangle kimbap reading label, harsh white fluorescent ceiling lights linoleum floor shelves of snacks, deadpan centered, photorealistic, 8k',
      'portrait standing on cluttered apartment rooftop in middle of day, wearing ivory silk long jacket wide trousers googly eye on lapel, handing clothespin to someone reaching up, clotheslines with hanging laundry, concrete floor puddles, rusted water tanks satellite dishes, grey overcast sky flat daylight, observational quiet, photorealistic, 8k',
    ],
    bride: [
      'portrait standing in brightly lit Korean convenience store at night, wearing grand ivory duchess satin off-shoulder ball gown dramatic puff sleeves corset bodice, massive skirt with hundreds of colorful pastel buttons in galaxy spiral pattern cathedral train crumpled between aisles, sipping paper cup of instant coffee leaning against refrigerator door, harsh fluorescent lights linoleum floor, deadpan centered, photorealistic, 8k',
      'portrait sitting at bottom of large empty drained outdoor swimming pool, wearing ivory ball gown puff sleeves button galaxy skirt spread across cracked pale blue tiles, knees up arms wrapped around them, dead leaves in corners no water, bright harsh midday sun overhead casting short shadows, geometric lonely, photorealistic, 8k',
    ],
    couple: [
      'couple in brightly lit Korean convenience store at night, man in ivory silk long jacket wide trousers cream tie googly eye on lapel holding triangle kimbap, woman in ivory duchess satin off-shoulder ball gown puff sleeves button galaxy skirt cathedral train crumpled between aisles sipping paper cup coffee leaning on fridge, standing side by side but separate each doing their own thing, harsh fluorescent lights linoleum floor, deadpan mundane still, photorealistic, 8k',
      'couple in same convenience store, she presses forehead against his chest both hands gripping front of his jacket, he wraps arms around her shoulders chin on her head, eyes closed, triangle kimbap and paper coffee cup abandoned on counter, harsh white fluorescent light cheap floor, nothing changed except they chose each other again, centered still final, photorealistic, 8k',
    ],
  },
};

const SOLO_PROMPTS: Record<string, { groom: string; bride: string }> = {
  studio_classic: {
    groom: 'place the same person in a modern minimalist white studio with clean white walls and large windows casting soft natural daylight, wearing elegant black tuxedo with white shirt and black bow tie, airy contemporary elegance, confident gentle gaze, photorealistic, 8k',
    bride: 'place the same person in a modern minimalist white studio with clean white walls and large windows casting soft natural daylight, wearing white haute couture strapless sweetheart bell gown with sculpted silk mikado bodice and bell skirt of hundreds of white silk organza petals in wave shapes layered like ocean ripples with long sweeping train, airy contemporary elegance, gentle smile, photorealistic, 8k',
  },
  studio_gallery: {
    groom: 'place the same person in a minimal white architectural studio with curved plaster arches and tall arched windows, wearing charcoal grey wool-silk one-button blazer with angular peaked lapel, light grey silk mock-neck top, charcoal trousers, black leather oxfords, soft diffused natural light, clean airy bright, photorealistic, 8k',
    bride: 'place the same person in a minimal white architectural studio with curved plaster arches and tall arched windows, wearing white strapless sweetheart bell gown with organza petal wave skirt like ocean ripples with long train, soft diffused natural light, clean airy bright, photorealistic, 8k',
  },
  studio_fog: {
    groom: 'place the same person in a warm studio with cream linen draped backdrop and pampas grass, wearing light grey wool-cashmere two-button blazer with brushed texture, white linen band-collar shirt, light grey trousers, grey suede desert boots, soft warm light, photorealistic, 8k',
    bride: 'place the same person in a warm studio with cream linen draped backdrop and pampas grass, wearing white strapless sweetheart bell gown with twenty plus layers of sheer organza graduating from white to pale grey like dissipating mist no embellishment, soft warm light, photorealistic, 8k',
  },
  studio_mocha: {
    groom: 'place the same person in a dark moody studio with mocha brown plaster wall and warm spotlight from above, wearing dark warm taupe brown wool blazer, ivory open-collar shirt, dark brown trousers, dark brown leather shoes, dramatic golden spotlight, photorealistic, 8k',
    bride: 'place the same person in a dark moody studio with mocha brown plaster wall and warm spotlight from above, wearing white halterneck bell gown with crystalline ice-shard organza panels and glass micro-beads, dramatic golden spotlight, photorealistic, 8k',
  },
  studio_sage: {
    groom: 'place the same person in a modern studio with sage green wall and cream boucle sofa and oak floor, wearing off-white matte wool shawl collar blazer, white crew-neck knit, off-white trousers, white leather sneakers, soft even natural light, photorealistic, 8k',
    bride: 'place the same person in a modern studio with sage green wall and cream boucle sofa and oak floor, wearing white one-shoulder bell gown with sculptural left shoulder strap and cascading knife-pleated organza panels like waterfall asymmetric train from left, soft even natural light, photorealistic, 8k',
  },
  hanbok_traditional: {
    groom: 'place the same person in a modern Korean hanbok wedding portrait, wearing refined navy hanbok jeogori with clean modern lines, minimalist Korean courtyard with wooden architecture, soft golden hour light, editorial fashion wedding style, photorealistic, 8k',
    bride: 'place the same person in a modern Korean hanbok bridal portrait, wearing elegant pastel pink and ivory hanbok with delicate floral embroidery, hair adorned with simple gold hairpin, minimalist Korean courtyard, soft golden light, editorial wedding style, photorealistic, 8k',
  },
  hanbok_wonsam: {
    groom: 'place the same person in a grand Korean royal palace Geunjeongjeon hall, wearing heukdallyeong (black ceremonial robe) with samo headpiece with wings, gold-embroidered belt, white inner jeogori visible at collar, red lacquered pillars with dancheong patterns, warm natural daylight, dignified regal atmosphere, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
    bride: 'place the same person in a grand Korean royal palace Geunjeongjeon hall, wearing vibrant red wonsam ceremonial robe layered over yellow chima, golden phoenix embroidery across chest and sleeves, elaborate hwagwan jeweled crown with dangling ornaments, white socks with kkotsin flower shoes, holding ceremonial fan, red lacquered pillars with dancheong, warm natural daylight, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  },
  hanbok_dangui: {
    groom: 'place the same person in a serene traditional Korean garden with lotus pond and pine trees, wearing jade-green dopo Korean scholar overcoat with V-shaped crossed collar gyotgit and goreum ribbon ties, yugeon soft fabric headband, white inner jeogori, jade ornament at waist, NOT a western suit, gentle morning sunlight, refined scholarly atmosphere, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
    bride: 'place the same person in a serene traditional Korean garden with lotus pond and pine trees, wearing soft blush-pink dangui short ceremonial jacket with gold-thread floral embroidery over deep navy chima skirt, small jokduri bridal coronet with jade and coral beads, delicate binyeo hairpin in updo, gentle morning sunlight, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  },
  hanbok_modern: {
    groom: 'place the same person in a minimalist modern hanok interior with clean white walls and warm wood floor, wearing charcoal gray modern durumagi Korean traditional long overcoat with V-shaped crossed collar gyotgit and goreum ribbon ties, Korean traditional fabric, white inner jeogori with mandarin collar, NOT a western suit NOT a blazer, soft diffused natural light from large window, contemporary elegant atmosphere, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
    bride: 'place the same person in a minimalist modern hanok interior with clean white walls and warm wood floor, wearing pastel lavender modern jeogori with clean lines over white chima skirt, hair in loose low bun with single minimalist silver binyeo hairpin, no heavy ornament, soft diffused natural light, contemporary minimalist Korean bridal attire, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  },
  hanbok_saeguk: {
    groom: 'place the same person in magnificent Gyeongbokgung throne hall with golden dragon screen, wearing deep crimson gonryongpo Korean royal dragon robe with V-shaped crossed collar gyotgit, wide sleeves, golden dragon embroidery, golden gwanmo crown, jade belt, NOT a western suit, ornate wooden columns with vivid dancheong, cinematic golden hour light, epic royal drama atmosphere, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
    bride: 'place the same person in magnificent Gyeongbokgung throne hall with golden dragon screen, wearing magnificent golden hwarot queen ceremonial robe with vivid phoenix and peony embroidery across entire surface, grand jokduri crown with long bead strings, layered silk underskirts visible at hem, cinematic golden hour light, opulent royal atmosphere, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  },
  hanbok_flower: {
    groom: 'place the same person in a blooming hanok courtyard with cherry blossoms and azaleas, wearing ivory white durumagi Korean long overcoat with subtle floral embroidery at hem, soft pastel inner jeogori, small flower boutonniere at chest, warm golden spring sunlight, romantic garden atmosphere, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
    bride: 'place the same person in a blooming hanok courtyard with cherry blossoms and azaleas, wearing light lilac jeogori with delicate flower embroidery over soft white chima skirt, fresh flower hairpin tucked behind ear, loose natural hairstyle with soft waves, warm golden spring sunlight, romantic spring bridal attire, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  },
  city_night: {
    groom: 'place the same person in a cinematic city night portrait, tailored black tuxedo, rain-slicked street, neon reflections, shallow depth of field, moody Wong Kar-wai inspired color grading, photorealistic, 8k',
    bride: 'place the same person in a cinematic city night bridal portrait, sleek white evening gown, rain-slicked street reflecting warm lights, shallow depth of field, moody cinematic color grading, photorealistic, 8k',
  },
  cherry_blossom: {
    groom: 'place the same person standing on a quiet residential street lined with cherry blossom trees in full bloom forming pale pink canopy overhead, soft warm grey wool-silk blend two-button jacket with natural shoulders, pearl white silk shirt, pale blush pink silk tie, petals drifting slowly in gentle breeze, petal-covered asphalt soft pink, soft flat overcast light no shadows white sky makes pink petals glow from within, photorealistic, 8k',
    bride: 'place the same person walking alone down the center of a quiet street lined with cherry blossom trees in full bloom forming pale pink tunnel, pearl white silk chiffon off-shoulder wedding dress with three layers of weightless chiffon skirt and sweep train dragging on petal-covered asphalt, outermost chiffon layers lifting slightly in breeze, looking up at canopy above, soft flat overcast light white sky makes petals glow from within, quiet and small in the frame, photorealistic, 8k',
  },
  forest_wedding: {
    groom: 'place the same person in an enchanted forest wedding setting, wearing elegant dark suit with emerald green tie, deep green forest with sunlight streaming through tall trees, flower arch with white roses and ivy, golden light rays and floating dust particles, magical but realistic atmosphere, photorealistic, 8k',
    bride: 'place the same person in an enchanted forest bridal setting, wearing ethereal white gown with delicate lace, deep green forest with sunlight streaming through trees, surrounded by white roses and ivy arch, golden light rays and floating particles, magical woodland fairy atmosphere, photorealistic, 8k',
  },
  castle_garden: {
    groom: 'place the same person standing in a vast empty throne room with impossibly high painted ceilings and tall marble columns, deep black silk-wool barathea one-button jacket with slim satin-faced peak lapels, ivory silk shirt, black silk bow tie, antique gold silk pocket square, standing at bottom of monumental marble staircase looking upward, single shaft of dusty golden light from high window cutting diagonally across the room, dust particles floating in beam, vast empty grandeur, photorealistic, 8k',
    bride: 'place the same person standing in the exact center of a vast empty throne room with impossibly high painted ceilings and tall marble columns, pale antique gold silk satin strapless wedding dress with cathedral train spread behind on marble floor, long gold opera-length gloves, trailing bow at back, single shaft of dusty golden light from high window landing on marble floor nearby, she stands just outside the light, dust particles float slowly in beam, the scale makes her human and the room eternal, photorealistic, 8k',
  },
  cathedral: {
    groom: 'place the same person standing inside a vast old gothic stone cathedral at the altar steps, deep solid black wool gabardine two-button jacket with slim notch lapels perfectly pressed, white cotton poplin shirt stiff point collar, solid black silk tie, massive stone pillars and soaring ribbed vault ceiling behind, single shaft of warm light from high stained glass window casting rose-red and gold colored light on the stone floor beside him, dark sacred Caravaggio chiaroscuro atmosphere, photorealistic, 8k',
    bride: 'place the same person walking alone down the center aisle of a vast old gothic stone cathedral with soaring ribbed vault ceiling, pure white heavy silk gazar high-neck wedding dress with long sleeves single button cuffs and cathedral train extending far behind on stone floor, fingertip tulle veil, tall stained glass windows casting pools of deep red blue gold violet colored light on stone floor on either side of her path but her white dress stays white in soft diffused ambient grey light, no guests in dark wooden pews, sacred and solitary, photorealistic, 8k',
  },
  watercolor: {
    groom: 'place the same person in a fine art wedding portrait, cream linen suit, painterly soft focus floral background, diffused golden light, high-end editorial aesthetic, photorealistic, 8k',
    bride: 'place the same person in a fine art bridal portrait, flowing soft tulle gown, painterly muted pastel floral background, diffused golden light, high-end editorial aesthetic, ethereal dreamy, photorealistic, 8k',
  },
  magazine_cover: {
    groom: 'place the same person in a high-end editorial wedding portrait, designer black suit, clean dark studio, dramatic single spotlight, strong pose facing camera, high contrast lighting, photorealistic, 8k',
    bride: 'place the same person in a high-end editorial bridal portrait, sculptural white couture gown, clean minimalist backdrop, dramatic single light source, confident elegant pose, photorealistic, 8k',
  },
  rainy_day: {
    groom: 'place the same person standing alone at a small old bus stop shelter on a quiet street in steady rain, cool slate grey wool-silk blend suit with slim notch lapels, dove grey silk shirt spread collar, charcoal grey silk knit tie, clear vinyl umbrella resting against shoulder, wet dark asphalt reflecting grey sky, flickering fluorescent tube light in shelter ceiling, steady silver rain lines beyond shelter edge, patient contemplative expression, photorealistic, 8k',
    bride: 'place the same person sitting alone on wooden bench at a small old bus stop shelter on a quiet street in steady rain, soft dove grey silk charmeuse off-shoulder wedding dress with sheer grey organza long sleeves, A-line skirt with sweep train folded on lap, slate grey ribbon bow at back neckline, clear vinyl umbrella closed resting against shoulder, wet dark asphalt reflecting grey sky and shelter structure, flickering fluorescent tube light casting flat cool light on face, steady silver rain lines beyond shelter edge, looking down empty wet street waiting for someone, photorealistic, 8k',
  },
  vintage_film: {
    groom: 'place the same person in a vintage film wedding portrait, retro brown suit, warm Kodak Portra 400 tones, soft film grain, natural window light, 1970s nostalgic aesthetic, photorealistic, 8k',
    bride: 'place the same person in a vintage film bridal portrait, classic A-line lace dress, warm Kodak Portra 400 color palette, soft film grain texture, natural window light, nostalgic romantic, photorealistic, 8k',
  },
  cruise_sunset: {
    groom: 'luxury yacht deck at golden hour sunset, groom wearing cream linen suit with open collar white shirt, warm amber ocean light, gentle sea breeze blowing hair softly, turquoise Mediterranean sea behind, yacht railing and polished wood deck, golden sun reflecting on calm water waves, romantic warm cinematic lighting, photorealistic, 8k',
    bride: 'elegant bride on luxury yacht deck at golden hour sunset, wearing flowing white chiffon dress with wind-blown fabric, elegant and simple, warm amber ocean light, gentle sea breeze blowing hair and dress softly, turquoise Mediterranean sea behind, yacht railing and polished wood deck, golden sun reflecting on calm water waves, romantic warm cinematic lighting, photorealistic, 8k',
  },
iphone_selfie: {
    groom: 'authentic iPhone selfie of the same person from above at arms length, close-up face filling most of frame, slightly tilted off-center composition, wearing slightly wrinkled white button-up shirt top two buttons undone collar open, one arm extended up holding phone showing watch on wrist, on-camera flash with neutral cool white balance, subtle digital noise and film grain, slightly overexposed flash on forehead, looking directly into lens with natural relaxed slight smirk, NOT studio NOT warm golden tone NOT formal, raw phone camera selfie, photorealistic, 8k',
    bride: 'authentic iPhone selfie of the same person from above at arms length, close-up face filling most of frame, slightly tilted off-center composition, wearing off-shoulder white top or white camisole, hair down slightly messy not perfectly styled, natural dewy no-makeup makeup, one hand near face or touching hair, on-camera flash with neutral cool white balance, subtle digital noise and film grain, slightly overexposed flash highlights on nose bridge, looking directly into lens with relaxed half-smile, NOT studio NOT warm golden tone NOT formal, raw phone camera selfie, photorealistic, 8k',
  },
  iphone_mirror: {
    groom: 'mirror selfie with iPhone flash of the same person, upper body reflected in large clean mirror, wearing white t-shirt under open black blazer sleeves pushed up, fitted dark trousers, holding iPhone visible in mirror, bright harsh flash creating high contrast, slightly washed out flash aesthetic, casual confident mirror pose, NOT formal NOT tuxedo, photorealistic, 8k',
    bride: 'mirror selfie with iPhone flash of the same person, full body reflected in large clean mirror, wearing fitted white satin slip dress showing silhouette, pearl stud earrings, hair in effortless low ponytail, holding iPhone covering partial face, strappy heels visible, bright harsh flash creating high contrast, slightly washed out flash aesthetic, NOT formal gown NOT veil, photorealistic, 8k',
  },
  cruise_bluesky: {
    groom: 'luxury cruise ship deck under vivid blue sky, groom wearing light beige summer suit with white shirt, crystal clear ocean stretching to horizon, white yacht railing, fresh sea breeze, bright natural daylight, gentle ocean waves sparkling in sunlight, clean nautical atmosphere, photorealistic, 8k',
    bride: 'elegant bride on luxury cruise ship deck under vivid blue sky, wearing strapless ivory organza dress with light flowing fabric, crystal clear ocean stretching to horizon, white yacht railing, fresh sea breeze blowing veil gently, bright natural daylight, gentle ocean waves sparkling in sunlight, clean nautical atmosphere, photorealistic, 8k',
  },
  vintage_record: {
    groom: 'place the same person in a cozy vintage vinyl record shop, wearing olive khaki brown blazer over light blue open-collar shirt with pinstripe grey trousers and brown leather shoes, surrounded by wooden shelves filled with LP records and album covers on walls, warm tungsten incandescent bulb lighting casting golden amber glow, vinyl turntable nearby, intimate nostalgic 1970s atmosphere, Kodak Portra 400 warm film tones with soft grain, photorealistic, 8k',
    bride: 'place the same person in a cozy vintage vinyl record shop, wearing ivory puff-sleeve lace high-neck wedding dress with sweetheart neckline under sheer lace bodice, satin ribbon waist belt, elbow-length white satin gloves, short tulle veil with pearl hairpin, surrounded by wooden shelves filled with LP records and album covers, warm tungsten incandescent bulb lighting casting golden amber glow, vintage floral wallpaper in background, intimate nostalgic 1960s bridal atmosphere, Kodak Portra 400 warm film tones with soft grain, photorealistic, 8k',
  },
  retro_hongkong: {
    groom: 'place the same person in Hong Kong Mong Kok night market with red lanterns overhead and neon signs, wearing dark burgundy wine double-breasted blazer with silky sheen over black silk shirt unbuttoned showing collarbone, ivory pocket square, black slim trousers, black chelsea boots, candid mid-stride with hand in pocket, warm red lantern glow on face, rain-slicked street reflecting neon lights, Wong Kar-wai cinematic color grading, shallow depth of field, Fuji Superia 400 film grain, photorealistic, 8k',
    bride: 'place the same person in Hong Kong Mong Kok night market with red lanterns overhead and neon signs, wearing champagne gold silk satin halter-neck dress with thin spaghetti straps and open cutout sides, small low mandarin collar, body-hugging silhouette with gold plum blossom embroidery, thigh-high side slit, pearl drop earrings, gold ankle-strap heels, hairstyle matching reference photo exactly, candid natural moment, warm red lantern glow, rain-slicked street, Wong Kar-wai cinematic grading, Fuji Superia 400 film grain, photorealistic, 8k',
  },
  black_swan: {
    groom: 'dark moody cinematic portrait, wearing black silk-satin shawl-collar blazer over black silk-georgette relaxed collarless shirt with moderate V-neckline showing collarbones only, shirt tucked in, black high-waisted wide-leg tailored trousers, thin black leather belt, black chelsea boots, gothic cathedral interior or misty dark lake at blue hour, dramatic chiaroscuro lighting, cold blue tones, photorealistic, 8k',
    bride: 'dark moody cinematic portrait, wearing strapless black matte silk bodice with soft wispy black ostrich feather trim across neckline, single black ostrich feather stole on left shoulder only cascading to elbow, grand floor-length A-line black tulle skirt trailing on floor, feather clusters on lower tulle, long straight black hair with see-through bangs, natural elegant makeup, subtle lip color, gothic cathedral or misty winter lake, dramatic chiaroscuro lighting, cold blue tones, photorealistic, 8k',
  },
  velvet_rouge: {
    groom: 'dark moody cinematic portrait, wearing deep dark teal-green silk one-button blazer with peaked lapel and luminous aged jade sheen, black silk open-collar shirt no tie showing collarbones, dark teal slim trousers, black leather oxfords, dark Japanese manor corridor with candlelight or dark private library with golden desk lamp or dimly lit vintage bathroom, warm golden light against deep shadows, aristocratic darkly romantic, dreamlike trance-like expression neither smiling nor sad, photorealistic, 8k',
    bride: 'dark moody cinematic portrait, wearing deep crimson red strapless sweetheart bell gown with overlapping sheer organza teardrop panels with embroidered dark burgundy peacock eye motifs and tiny pearls, white silk satin opera-length gloves, long straight black hair with see-through bangs, natural elegant makeup, dark Japanese manor corridor with candlelight or dark library with desk lamp or copper bathtub with floating red organza and steam, warm golden light against deep shadows, dreamlike trance-like expression neither smiling nor sad, photorealistic, 8k',
  },
  water_memory: {
    groom: 'dreamlike cinematic portrait, wearing off-white silk mikado two-button suit with soft notch lapel and refined porcelain-like luminous sheen, white silk open-collar shirt no tie showing collarbones, off-white slim trousers, white leather dress shoes, deep teal-green underwater with caustic light patterns or vintage art deco movie theater with warm projector beam or rain-soaked night street with street lamp reflections, ethereal aquatic teal tones, photorealistic, 8k',
    bride: 'dreamlike cinematic portrait, wearing ice-blue strapless sweetheart mermaid gown in silk mikado with refined luminous sheen, fitted to below knees then dramatic cascading fin-like organza panels in ice-blue to silver-grey gradients like betta fish fins, freshwater pearl clusters near transition, long cathedral train, natural elegant makeup, deep teal-green underwater with caustic light or vintage theater with projector beam or rain-soaked night street, ethereal aquatic teal tones, photorealistic, 8k',
  },
  blue_hour: {
    groom: 'romantic twilight portrait on European cobblestone street, wearing classic navy blue fine wool two-button suit with notch lapel, crisp white dress shirt top button undone no tie, navy slim trousers, dark brown leather oxfords, vintage street lamp casting warm golden glow, purple-blue twilight sky, cinematic warm-cool contrast, photorealistic, 8k',
    bride: 'romantic twilight portrait on European cobblestone street, wearing deep sapphire blue strapless silk bodice gown with flowing chiffon A-line skirt catching wind, matching blue satin pointed-toe heels, natural dewy makeup, vintage street lamp warm golden glow against blue hour sky, cinematic warm-cool contrast, photorealistic, 8k',
  },
  rose_garden: {
    groom: 'editorial portrait in lavish rococo salon with pale pink walls gilded ornate mirrors climbing pink roses crystal chandelier with dripping candle lights, wearing pale warm beige soft wool two-button suit with natural shoulders relaxed drape ivory cream silk tie in loose knot over white dress shirt ivory pocket square, leaning on gilded pink velvet chaise longue with amused grin, scattered rose petals and pale pink macarons on gold tray nearby, soft diffused pastel pink light dreamy hazy atmosphere, long straight black hair, photorealistic, 8k',
    bride: 'editorial portrait on grand curved marble staircase with wrought iron pink rose vine railing in rococo palace, pale pink walls with gilded molding, wearing ivory duchess silk satin off-shoulder wedding dress with softly draped silk at collarbone structured corset bodice three blush pink rosettes at left shoulder full voluminous A-line skirt with long graceful train cascading down marble stairs behind her, one hand on railing descending stairs, soft natural light from tall arched window, long straight black hair past shoulders, pastel pink atmosphere, photorealistic, 8k',
  },
  grass_rain: {
    groom: 'analog film portrait in wide green grassy hillside on grey rainy day, wearing black wool slim-fit two-button suit with natural shoulders white shirt open collar no tie jacket unbuttoned slightly damp on shoulders, standing in tall wet grass, fine rain mist visible in air, muted desaturated green-grey tones, completely flat grey overcast light, heavy film grain shot on Fuji Superia 400, long straight black hair, photorealistic, 8k',
    bride: 'analog film portrait in wide green grassy field on overcast rainy day, wearing light ivory silk chiffon halter-neck wedding dress with crossed draped fabric gathered at back of neck shoulders bare, gently fitted bodice with natural soft gathers, multiple opaque layered chiffon skirt with uneven raw-edge hemlines catching slight breeze, fabric fully opaque with dense layering ensuring complete coverage, fine rain on skin, eyes closed soft smile, flat grey overcast light, muted green-grey tones heavy film grain Kodak Portra 400, long straight black hair slightly damp, photorealistic, 8k',
  },
  eternal_blue: {
    groom: 'melancholic cinematic portrait between tall bookshelves in dimly lit old bookstore, wearing slate blue-grey wool one-button suit with slim peak lapels clean sharp silhouette white silk shirt spread collar top button undone no tie small pearl pin on left lapel, standing above looking down with gentle smile, warm single brass desk lamp at end of aisle casting long shadows through gaps between books, dust particles floating in lamplight beam, warm tungsten and cool shadow split, long straight black hair, heavy film grain, photorealistic, 8k',
    bride: 'melancholic cinematic portrait on empty grey winter beach at dusk, wearing dusty powder blue strapless sweetheart satin bodice dress with massive voluminous cloud-like tulle ruffled skirt in graduating shades from dusty blue to pale icy blue at hem hand-gathered in irregular cloud-like ruffles, single pearl strand draped across bodice, standing alone at water edge with back three-quarters turned to camera, enormous tulle skirt dragging across dark wet sand, cold wind blowing hair sideways, grey overcast sky meeting grey ocean, cold desaturated blue-grey monochrome, heavy film grain, long straight black hair, photorealistic, 8k',
  },
  heart_editorial: {
    groom: 'high fashion editorial portrait caught mid-stride inside perfect circle of white spotlight on completely black stage floor, wearing sharp black wool double-breasted six-button jacket with extreme wide peaked lapels heavily structured squared shoulders high-waisted wide-leg trousers with razor-sharp front crease, crisp white shirt buttoned to top narrow black silk tie pulled very tight, single small red fabric heart pinned on left lapel, body angled dynamically one foot forward jacket swinging slightly arms in motion, everything outside spotlight circle is pure black void, hard theatrical lighting deep contrast, long straight black hair, photorealistic, 8k',
    bride: 'high fashion editorial portrait shot from directly overhead bird-eye view lying on black floor, wearing pure white architectural high mock-neck wedding dress with structured exaggerated square shoulders rigid sculpted heavy white duchess satin torso, massive origami organza train fanned out in perfect spiral around body filling frame like white sculpture on black canvas, one single oversized red fabric heart brooch pinned at center of chest, one hand resting on chest over heart other extended outward disappearing into white folds, hair fanned out around head, looking straight up at camera with intense calm gaze, hard overhead light creating bright white form against pure black floor, long straight black hair, photorealistic, 8k',
  },
  vintage_tungsten: {
    groom: 'place the same person standing in front of dark floral wallpaper with large roses and tropical leaves, wearing dark navy wool two-button suit with wide notch lapels relaxed vintage cut, white cotton shirt with soft rounded collar, dusty lavender silk tie slightly loose, floor lamp with fabric shade beside, direct on-camera flash flat lighting harsh shadow behind on wallpaper, faded warm print colors magenta highlights yellow midtones, compact film camera 1978, photorealistic, 8k',
    bride: 'place the same person standing in front of dark floral wallpaper with large roses and tropical leaves, wearing ivory floral cotton lace high Victorian neckline dress with bishop sleeves gathered at wrist, satin ribbon belt, fingertip tulle veil, tall tropical plant beside, direct on-camera flash flat lighting harsh shadow behind, faded warm print colors magenta highlights, compact film camera 1981, photorealistic, 8k',
  },
  aao: {
    groom: 'place the same person standing in a brightly lit Korean convenience store at night, wearing grand ivory silk shantung double-breasted peak-lapel long jacket extending past hip with structured wide shoulders, high-waisted wide-leg trousers sharp crease, white silk shirt buttoned to top cream silk tie, oversized googly eye pinned on left lapel, harsh white fluorescent ceiling lights linoleum floor shelves of instant noodles behind, deadpan composition, photorealistic, 8k',
    bride: 'place the same person standing in a brightly lit Korean convenience store at night, wearing grand ivory silk duchess satin off-shoulder ball gown with dramatic oversized puff sleeves, fitted corset bodice, massive ball gown skirt with hundreds of tiny mismatched colorful pastel buttons in swirling galaxy spiral pattern cathedral train crumpled between narrow aisles, harsh white fluorescent ceiling lights linoleum floor, deadpan composition, photorealistic, 8k',
  },
  spring_letter: {
    groom: 'place the same person in old quiet library with tall windows cherry blossom branches pressing against glass, wearing light warm grey silk-linen blend two-button suit blush pink silk shirt ivory silk tie peony boutonniere, soft afternoon dappled pink-tinted light filtering through blossoms, dust floating in beams, through gap between bookshelves, photorealistic, 85mm lens, 8k',
    bride: 'place the same person sitting alone at wooden reading desk by tall window in old quiet library, wearing soft blush pink silk organza off-shoulder wedding dress with organza petal cap sleeves fitted corset bodice with seed pearls three-tiered organza A-line skirt, train pooling on worn wooden floor, cherry blossom branches pressing against window glass petals stuck to panes, soft afternoon dappled pink-tinted light, library empty and silent dust floating, photorealistic, 85mm lens, 8k',
  },
  summer_rain: {
    groom: 'place the same person under massive old tree in wide open grass field blazing summer afternoon, wearing natural off-white washed silk-linen blend unlined two-button jacket relaxed shoulders matching straight-leg trousers pale water blue silk shirt collar open no tie sleeves pushed up white canvas sneakers, harsh midday sun above deep cool shade beneath dappled light, field beyond blown-out white, photorealistic, 50mm lens, 8k',
    bride: 'place the same person standing alone in front of tall open window in old white-walled room bare wooden floor, wearing pure white silk mikado square-neckline wedding dress wide straps structured bodice clear glass beads along neckline flowing chiffon skirt catching wind, sheer white curtain billowing inward from summer breeze, white on white sunlight and shadow, strong direct afternoon sun sharp rectangle on floor, photorealistic, 85mm lens, 8k',
  },
  autumn_film: {
    groom: 'place the same person in small old Korean portrait studio late afternoon, wearing rich warm tobacco brown wool-silk blend three-button jacket champagne ivory silk shirt deep wine red silk tie, faded plain backdrop single warm tungsten bulb overhead soft afternoon light from frosted side window, mixed warm light, photorealistic, 50mm lens, 8k',
    bride: 'place the same person standing in front of faded backdrop in small old Korean portrait studio, wearing warm champagne ivory silk satin bias-cut V-neckline wedding dress spaghetti straps fluid column silhouette pooling into puddle train small cluster silk leaves amber sienna wine red at back strap crossing, warm tungsten bulb and afternoon side window mixed light, quiet calm half-smile, photorealistic, 50mm lens, 8k',
  },
  winter_zhivago: {
    groom: 'place the same person standing on snow-covered train tracks stretching straight to vanishing point, wearing deep charcoal black silk-wool blend two-button jacket slim notch lapels sharp fitted silhouette matching slim trousers silver-white silk shirt pale icy lavender silk tie black cashmere overcoat hanging open, flat white snow grey overcast sky no visible horizon, stark black against white, photorealistic, 40mm lens symmetrical, 8k',
    bride: 'place the same person sitting at old upright piano in large empty room tall windows, wearing cool silver-white silk faille high boat neckline long fitted sleeve wedding dress silk-covered buttons wrist to elbow sculpted bodice A-line skirt deep inverted box pleats chapel train, snow falling heavily outside room unheated breath visible, fingers on keys without pressing empty sheet music stand, charcoal overcoat on piano single candle warm amber cold blue window, photorealistic, 50mm lens, 8k',
  },
};

const COUPLE_PROMPTS: Record<string, string> = {
  studio_classic: 'place the same couple in a modern minimalist white studio with clean white walls and large windows casting soft natural daylight, the man wearing black tuxedo with bow tie on the left, the woman wearing white haute couture strapless sweetheart bell gown with organza petal wave skirt on the right, couple looking at each other lovingly, airy contemporary elegance, photorealistic, 8k',
  studio_gallery: 'couple in minimal white architectural studio with curved plaster arches and arched windows, man wearing charcoal angular peaked lapel suit with grey mock-neck, woman wearing white strapless bell gown with organza petal wave skirt, soft diffused natural light, clean airy bright, 50mm lens, photorealistic, 8k',
  studio_fog: 'couple in warm studio with cream linen draped backdrop and pampas grass in ceramic vase, man wearing light grey wool-cashmere suit with band-collar shirt, woman wearing white strapless fog gradient gown with layered sheer organza, sitting together on low wooden bench, soft warm light, 50mm lens, photorealistic, 8k',
  studio_mocha: 'couple in dark moody studio with mocha brown plaster wall and warm spotlight from above, man wearing dark warm brown wool suit with ivory shirt, woman wearing white halterneck bell gown with ice-shard organza panels, standing close foreheads touching in golden pool of light, 85mm lens, dramatic warm tones, photorealistic, 8k',
  studio_sage: 'couple in modern editorial studio with sage green wall and cream boucle sofa and oak floor, man wearing off-white shawl collar blazer with white knit standing beside sofa, woman wearing white one-shoulder pleated waterfall gown sitting on sofa, soft even natural light, 50mm lens, calm muted tones, photorealistic, 8k',
  rose_garden: 'couple in lavish rococo salon with pale pink walls gilded ornate mirrors white iron trellis completely covered in climbing pink roses crystal chandelier with dripping candle lights, man wearing pale warm beige soft wool two-button suit ivory tie white shirt leaning on back of gilded pink velvet chaise longue looking down with amused grin, woman wearing ivory duchess silk satin off-shoulder wedding dress with draped silk at collarbone structured corset three blush pink rosettes at left shoulder full A-line skirt with long train sitting sideways on chaise laughing mid-bite into pale pink macaron, scattered rose petals and macarons on small gold tray, soft diffused natural window light from right with gentle pastel pink color cast, dreamy hazy atmosphere, both with long straight black hair, photorealistic editorial photograph 50mm lens shallow depth of field film grain, 8k',
  grass_rain: 'couple sitting close together in tall wet grass on grey rainy day, woman sitting between his legs leaning back into him eyes closed smiling wearing light ivory silk chiffon halter-neck wedding dress with crossed draped neckline fabric fully opaque with dense layering, man wearing black wool two-button suit white shirt open collar no tie wrapping arms around her, fine rain mist visible in air, no sun completely flat grey light, heavy film grain shot on Kodak Portra 400 pushed two stops, muddy green-grey color palette, both with long straight black hair slightly damp, photorealistic analog film photograph, 8k',
  eternal_blue: 'couple on frozen cracked lake surface under heavy grey sky light snow falling, woman wearing dusty powder blue strapless sweetheart satin bodice dress with massive voluminous cloud-like tulle ruffled skirt in graduating blue tones pearl strand across bodice, man wearing slate blue-grey wool one-button suit white shirt pearl lapel pin wrapping his jacket around both of them, she buries face in his chest, massive blue tulle skirt spreads across white ice like pool of blue watercolor dissolving into white, everything fading to white at edges, monochromatic blue-white-grey palette, both with long straight black hair, quiet melancholic heavy film grain, photorealistic, 8k',
  heart_editorial: 'couple in dark studio, woman sitting on simple black cube wearing pure white architectural mock-neck dress with structured exaggerated square shoulders rigid sculpted torso origami train pooled on black floor red fabric heart brooch at chest resting chin on one hand looking directly at camera, man standing tall behind her one head taller wearing sharp black double-breasted six-button suit with wide peaked lapels white shirt narrow black tie red fabric heart on left lapel looking down at her not at camera, single hard beauty dish light from directly above casting defined shadows under cheekbones, everything else falls to black, only white dress black suit two red hearts and skin tones visible, both with long straight black hair, heavy contrast editorial fashion photograph 85mm lens, photorealistic, 8k',
  hanbok_traditional: 'place the same couple in a modern Korean hanbok wedding photoshoot, the man wearing refined navy hanbok with clean lines on the left, the woman wearing elegant pastel pink and ivory hanbok with delicate floral embroidery on the right, minimalist Korean traditional courtyard with soft bokeh, romantic warm golden light, modern editorial wedding style, photorealistic, 8k',
  hanbok_wonsam: 'place the same couple in grand Korean royal palace Geunjeongjeon hall, the man wearing heukdallyeong black ceremonial robe with samo headpiece on the left, the woman wearing vibrant red wonsam with golden phoenix embroidery and elaborate hwagwan jeweled crown on the right, red lacquered pillars with dancheong patterns, warm natural daylight, dignified royal wedding ceremony, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  hanbok_dangui: 'place the same couple in serene traditional Korean garden with lotus pond and pine trees, the man wearing jade-green dopo with yugeon headband on the left, the woman wearing blush-pink dangui with gold-thread embroidery over navy chima and jokduri coronet on the right, gentle morning sunlight, refined elegant atmosphere, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  hanbok_modern: 'place the same couple in minimalist modern hanok interior with white walls and warm wood floor, the man wearing charcoal gray modern durumagi over white jeogori on the left, the woman wearing pastel lavender jeogori over white chima with minimalist silver binyeo on the right, soft diffused natural light, contemporary elegant atmosphere, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  hanbok_saeguk: 'place the same couple in magnificent Gyeongbokgung throne hall with golden dragon screen, the man wearing deep crimson gonryongpo with golden dragon embroidery and gwanmo crown on the left, the woman wearing magnificent golden hwarot with phoenix embroidery and grand jokduri crown on the right, cinematic golden hour light, epic royal drama atmosphere, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  hanbok_flower: 'place the same couple in blooming hanok courtyard with cherry blossoms and azaleas, the man wearing ivory durumagi Korean traditional overcoat with V-shaped crossed collar gyotgit and goreum ribbon ties and floral embroidery on the left, the woman wearing lilac jeogori with flower embroidery over white chima with flower hairpin on the right, warm golden spring sunlight, romantic garden atmosphere, photorealistic, 8k, no Japanese kimono, no Chinese hanfu, no western suit, no blazer, no trench coat, no modern overcoat, accurate Korean hanbok structure with V-shaped crossed collar and goreum ties, correct collar direction',
  city_night: 'place the same couple crossing a wide empty city crosswalk at night, white zebra stripes glowing under harsh overhead sodium streetlamps, the woman in front in midnight navy silk velvet scoop-neck dress with burnout pattern and gold back chain on the left, the man a step behind in midnight navy shawl-collar suit black silk shirt gold chain necklace hands in trouser pockets on the right, red traffic light casting red wash across wet asphalt, long shadows from overhead lamp stretching beneath them, shot from street level camera on ground looking up, empty intersection feels enormous around them, urban and electric 2am, photorealistic, 8k',
  cherry_blossom: 'place the same couple sitting on a simple wooden park bench under a single enormous cherry blossom tree with petals falling steadily like slow pink snow, the woman on the left in pearl white silk chiffon off-shoulder dress with three-layered chiffon skirt spread on bench holding a single fallen cherry blossom branch turning it in her fingers, the man on the right in soft warm grey wool-silk suit pearl white shirt pale blush pink tie watching a petal land on his trouser leg, ground carpeted thick with fallen petals, small gap between them on bench, soft overcast flat light everything glows pastel, falling petals creating pink bokeh, photorealistic, 8k',
  forest_wedding: 'place the same couple deep inside a dense old-growth forest with massive dark tree trunks rising like cathedral pillars, the woman on the left in warm cream white silk crepe de chine high square-neck dress with wide bell sleeves and moss green dip-dyed hem blending with actual moss on ground, the man on the right in deep forest green wool-silk suit cream silk shirt open collar suit color nearly identical to dark wet tree bark, they stand apart each beside a separate tree trunk facing each other across thick white fog flowing between them at waist height, two single shafts of pale grey light from canopy above landing on each separately, dense and sacred, photorealistic, 8k',
  castle_garden: 'place the same couple walking through a long grand hall of mirrors with gilded frames lining both walls reflecting each other infinitely, the woman on the left in pale antique gold silk satin strapless dress with cathedral train trailing on marble and long gold opera gloves, the man on the right in deep black barathea suit with satin peak lapels ivory shirt black bow tie gold pocket square, single crystal chandelier lit dimly above them, marble floor reflecting warm golden pool, mirrors multiply them infinitely hundreds of golden dresses and black suits receding into darkness, photorealistic, 8k',
  cathedral: 'place the same couple at the altar steps inside a vast gothic stone cathedral, the man on the left kneeling on cold grey stone step in deep black wool gabardine suit white shirt black tie looking up holding her left hand in both his hands bringing it toward his forehead, the woman on the right standing on step above in pure white heavy silk gazar high-neck dress with cathedral train and fingertip tulle veil looking down at him, deep rose-red and gold stained glass light from high window behind her falls directly on his kneeling figure while she stands backlit as silhouette edged in colored light, Caravaggio chiaroscuro, photorealistic, 8k',
  watercolor: 'place the same couple in a fine art wedding portrait, the man in cream linen suit on the left, the woman in flowing soft tulle gown on the right, painterly soft focus background with muted pastel florals, diffused golden light, high-end editorial aesthetic, dreamy romantic atmosphere, photorealistic, 8k',
  magazine_cover: 'place the same couple in a high-end editorial wedding photoshoot, the man in designer black suit on the left, the woman in sculptural white couture gown on the right, clean minimalist studio, single dramatic spotlight from above, strong confident poses facing camera, high contrast black and white toned lighting, photorealistic, 8k',
  rainy_day: 'place the same couple walking together under one clear vinyl umbrella on a quiet rain-soaked street lined with old low buildings, the man on the left holding umbrella tilted toward her side so she stays dry while his right shoulder is soaked dark with rain in cool slate grey wool-silk suit dove grey shirt charcoal knit tie, the woman on the right in soft dove grey silk charmeuse off-shoulder dress with sheer organza sleeves hem darkened with water, walking in step close together her arm linked through his, she looks up at his wet shoulder and he pretends not to notice, wet pavement stretching ahead reflecting lights, silver rain streaks around them, photorealistic, 8k',
  vintage_film: 'place the same couple in a vintage film photography wedding, the man in retro brown suit with wide lapels on the left, the woman in classic A-line lace dress on the right, warm film grain texture, slightly faded Kodak Portra 400 color palette, soft natural window light, nostalgic 1970s wedding aesthetic, photorealistic, 8k',
  cruise_sunset: 'romantic couple on luxury yacht deck at golden hour sunset, groom wearing cream linen suit with open collar white shirt, bride wearing flowing white chiffon dress with wind-blown fabric, warm amber ocean light, gentle sea breeze blowing hair softly, turquoise Mediterranean sea behind, yacht railing and polished wood deck, golden sun reflecting on calm water waves, couple standing close together looking at each other lovingly, romantic warm cinematic lighting, photorealistic, 8k',
iphone_selfie: 'authentic iPhone couple selfie from above at arms length, both faces close together filling frame, slightly tilted off-center, the man in white button-up shirt open collar on the left, the woman in white top or camisole on the right, on-camera flash with neutral cool white balance, digital noise and grain, slightly overexposed flash, both with candid natural laughing or smiling expressions, heads touching or very close, NOT studio NOT warm golden NOT formal, raw couple selfie, photorealistic, 8k',
  iphone_mirror: 'couple mirror selfie with iPhone flash, both reflected in large clean mirror, the man in white t-shirt under open black blazer on the left, the woman in fitted white satin slip dress on the right, one person holding iPhone visible in mirror, bright harsh flash high contrast, slightly washed out flash aesthetic, casual fun couple mirror pose, NOT formal, photorealistic, 8k',
  cruise_bluesky: 'elegant couple on luxury cruise ship deck under vivid blue sky, groom wearing light beige summer suit with white shirt, bride wearing strapless ivory organza dress, crystal clear ocean stretching to horizon, white yacht railing, fresh sea breeze, bright natural daylight, gentle ocean waves sparkling in sunlight, couple embracing naturally on deck, clean nautical atmosphere, photorealistic, 8k',
  vintage_record: 'romantic couple in a cozy vintage vinyl record shop, the man wearing olive khaki brown blazer over light blue open-collar shirt with pinstripe grey trousers on the left, the woman wearing ivory puff-sleeve lace high-neck wedding dress with sweetheart neckline under sheer lace bodice satin ribbon waist belt elbow-length white satin gloves and short tulle veil with pearl hairpin on the right, surrounded by wooden shelves filled with LP records and album covers on walls, warm tungsten incandescent bulb lighting casting golden amber glow, vinyl turntable nearby, couple looking at each other lovingly or browsing records together, intimate nostalgic 1970s atmosphere, Kodak Portra 400 warm film tones with soft grain, photorealistic, 8k',
  retro_hongkong: 'couple walking together in Hong Kong Mong Kok night market with red lanterns overhead, the man wearing dark burgundy double-breasted blazer with silky sheen over black silk shirt unbuttoned showing collarbone with ivory pocket square on the left, the woman wearing champagne gold silk satin halter-neck dress with spaghetti straps open cutout sides small mandarin collar gold plum blossom embroidery thigh-high slit pearl earrings long loose black hair flowing down past shoulders never tied up on the right, neon signs with Chinese characters, rain-slicked street reflecting red and amber lights, candid walking moment looking at each other warmly, Wong Kar-wai cinematic grading, Fuji Superia 400 grain, photorealistic, 8k',
  black_swan: 'dark moody cinematic couple portrait inside gothic cathedral, man wearing black silk-satin shawl-collar blazer over black V-neck silk-georgette shirt, woman wearing strapless black feather-trimmed tulle ball gown with feather stole on left shoulder, foreheads touching, cool blue light through stained glass windows, dark stone columns, dramatic chiaroscuro lighting, cold blue tones, 35mm lens, film grain, photorealistic, 8k',
  velvet_rouge: 'dark moody cinematic couple portrait, man wearing deep dark teal-green silk peaked lapel suit with black silk shirt, woman wearing deep crimson red strapless sweetheart bell gown with peacock eye embroidered organza teardrop panels and white silk opera gloves, dark Japanese manor corridor with paper lanterns and tatami or dark private library with leather armchair and golden desk lamp or dimly lit vintage bathroom she in copper bathtub with red organza floating in water he kneeling beside holding her face, warm golden candlelight against deep shadows, aristocratic darkly romantic, dreamlike trance-like mood neither smiling nor sad but entranced, 35mm lens, film grain, photorealistic, 8k',
  water_memory: 'dreamlike cinematic couple portrait, man wearing off-white silk mikado suit with white open-collar shirt no tie, woman wearing ice-blue strapless sweetheart mermaid gown with cascading betta fish fin-like organza panels and freshwater pearl clusters, deep dark teal-green underwater floating together foreheads almost touching eyes closed hair floating upward tiny air bubbles soft caustic light from above, or sitting together in empty vintage art deco movie theater faded red velvet seats warm projector beam dust particles she resting head on his shoulder, or standing face to face in heavy rain on empty night street his hands on her face her hands on his chest wet reflective asphalt warm street lamp glow, ethereal teal tones, 50mm lens, film grain, photorealistic, 8k',
  blue_hour: 'romantic couple portrait slow dancing under vintage street lamp at twilight, man wearing navy blue suit white shirt no tie, woman wearing sapphire blue strapless satin and chiffon gown skirt floating mid-sway, his hand on her waist her hand on his shoulder, purple-blue twilight sky with warm glowing street lamp, European cobblestone street, cinematic warm-cool contrast, 50mm lens, film grain, photorealistic, 8k',
  vintage_tungsten: 'couple sitting on floral velvet sofa in dark maximalist vintage room with large rose and tropical leaf wallpaper in deep red and green, old CRT television and tropical houseplants behind, floor lamp with fabric shade, man wearing dark navy relaxed vintage suit white rounded collar shirt dusty lavender tie, woman wearing ivory floral lace high-neck dress with bishop sleeves satin ribbon belt fingertip tulle veil, she holds his hand both smiling at camera, direct on-camera flash faces brightly lit background dark, faded warm print colors magenta tint in highlights yellow midtones, scanned photograph from 1979 wedding album, photorealistic, 8k',
  aao: 'couple in brightly lit Korean convenience store at night, man wearing ivory silk shantung double-breasted long jacket wide-leg trousers cream tie googly eye on lapel, woman wearing ivory duchess satin off-shoulder ball gown with puff sleeves and colorful button galaxy spiral skirt cathedral train crumpled between aisles, she presses forehead against his chest gripping front of his jacket, he wraps arms around her shoulders chin on her head, eyes closed, harsh white fluorescent light cheap linoleum floor, nothing romantic about the light but everything about the moment, centered still final, photorealistic, 8k',
  spring_letter: 'couple on wide stone steps outside old columned building cherry blossom trees fully bloomed petals falling, woman wearing blush pink organza off-shoulder dress petal cap sleeves seed pearl bodice three-tiered skirt spread across steps, man wearing light warm grey silk-linen suit blush pink shirt ivory tie, sitting with small gap not quite touching, late afternoon side light casting long shadows, quiet and aching, photorealistic, 40mm lens, 8k',
  summer_rain: 'couple sitting on stone edge of old shallow natural stream surrounded by tall summer grass feet dangling in clear water, woman wearing white silk mikado square-neck dress chiffon skirt hiked to knees glass bead neckline kicking water, man wearing off-white silk-linen suit trousers rolled up jacket off water blue shirt watching her smiling, late afternoon sun low golden backlight lens flare, photorealistic, 40mm lens, 8k',
  autumn_film: 'couple walking slowly away from camera down narrow Korean residential alley autumn, woman wearing champagne silk satin bias-cut dress puddle train dragging across yellow ginkgo leaves, man tobacco brown suit champagne shirt wine red tie, walking side by side her pinky barely hooking his, long shadows sun very low amber, photorealistic, 85mm telephoto, 8k',
  winter_zhivago: 'couple dancing slowly in wide open snow field at night heavy snowfall no music, woman wearing silver-white silk faille dress ghostly against snow, man charcoal black suit dark against white, foreheads pressed together eyes closed, slow shutter motion blur snowflakes diagonal lines, single distant streetlamp warm orange, analog film grain quiet infinite, photorealistic, 8k',
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
    if (status.status === 'COMPLETED') {
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await falFetch(responseUrl);
        if (!result.detail) return result;
        console.log('[waitForResult] response_url returned error, retry', attempt + 1, ':', JSON.stringify(result.detail).slice(0, 200));
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
      return falFetch(responseUrl);
    }
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
    const rotation = SCENE_ROTATION[concept];
    if (rotation) {
      const arr = mode === 'couple' ? rotation.couple : mode === 'groom' ? rotation.groom : rotation.bride;
      basePrompt = arr[Math.floor(Math.random() * arr.length)];
    } else if (mode === 'couple') {
      basePrompt = COUPLE_PROMPTS[concept] || COUPLE_PROMPTS.studio_classic;
    } else if (mode === 'groom') {
      basePrompt = SOLO_PROMPTS[concept]?.groom || SOLO_PROMPTS.studio_classic.groom;
    } else {
      basePrompt = SOLO_PROMPTS[concept]?.bride || SOLO_PROMPTS.studio_classic.bride;
    }
    const pose = rotation ? '' : getRandomPose(mode);
    const prompt = FACE_INSTRUCTION + ', ' + pose + ', ' + basePrompt;

    const isCouple = mode === 'couple';
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
      image_urls: urls.map(cropToPortrait),
      num_images: 1,
      aspect_ratio: '3:4',
      resolution: '1K',
      output_format: 'png',
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
    const prompt = FACE_INSTRUCTION + ', ' + pose + ', ' + basePrompt;

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

    const submit = await falFetch(`${FAL_QUEUE}/fal-ai/nano-banana-2/edit`, {
      method: 'POST',
      body: JSON.stringify({ prompt, image_urls: urls.map(cropToPortrait), num_images: 1, aspect_ratio: '3:4', resolution: '1K', output_format: 'png' }),
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
    console.error('[free/generate] Error:', e.message);
    await prisma.user.update({ where: { id: userId }, data: { freeSnapUsed: false } }).catch(() => {});
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
      let result: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        result = await falFetch(responseUrl as string);
        if (!result.detail) break;
        console.log('[free/poll] response_url error, retry', attempt + 1, ':', JSON.stringify(result.detail).slice(0, 200));
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
      if (result.detail) {
        console.error('[free/poll] fal detail error after retries:', JSON.stringify(result.detail).slice(0, 300));
        return res.json({ status: 'failed', error: 'AI server temporarily unavailable. Please try again.' });
      }
      const falUrl = result.images?.[0]?.url;
      if (!falUrl) {
        console.error('[free/poll] no image url, keys:', Object.keys(result));
        return res.json({ status: 'failed', error: 'No image generated' });
      }
      const uploaded = await uploadFromUrl(falUrl, 'ai-snap/free');
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
        aspect_ratio: '3:4', resolution: '1K', output_format: 'png',
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
        aspect_ratio: '3:4', resolution: '1K', output_format: 'png',
        id_weight: idWeight || 0.85,
        guidance_scale: 4,
        num_inference_steps: 20,

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
    const prompt = FACE_INSTRUCTION + ', ' + pose + ', ' + basePrompt;
    const effectiveMode = req.body.mode || 'groom';
    const isCouple = effectiveMode === 'couple';
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
        image_urls: urls.map(cropToPortrait),
        num_images: 1,
        aspect_ratio: '3:4',
        resolution: '1K',
        output_format: 'png',
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
    if (!status || status.status === 'NOT_FOUND' || status.status === 'CANCELLED') {
      return res.json({ status: 'failed', error: 'Job not found or cancelled' });
    }
    if (status.status === 'COMPLETED') {
      let result: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        result = await falFetch(responseUrl as string);
        if (!result.detail) break;
        console.log('[admin/poll] response_url error, retry', attempt + 1);
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
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


const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_BASE = 'https://ark.ap-southeast.bytepluses.com/api/v3';

const generateSeeDream = async (snapId: string, concept: string, imageUrls: string[], mode: string) => {
  try {
    await prisma.aiSnap.update({ where: { id: snapId }, data: { retryStatus: 'generating' } });
    console.log('[SeeDream retry] starting for snap:', snapId, 'concept:', concept, 'mode:', mode);

    let basePrompt = '';
    if (mode === 'couple') {
      basePrompt = COUPLE_PROMPTS[concept] || COUPLE_PROMPTS.studio_classic;
    } else if (mode === 'groom') {
      basePrompt = SOLO_PROMPTS[concept]?.groom || SOLO_PROMPTS.studio_classic.groom;
    } else {
      basePrompt = SOLO_PROMPTS[concept]?.bride || SOLO_PROMPTS.studio_classic.bride;
    }
    const pose = getRandomPose(mode);
    const prompt = FACE_INSTRUCTION + ', ' + pose + ', ' + basePrompt;

    const isCouple = mode === 'couple';
    let urls: string[];
    if (isCouple) {
      urls = imageUrls.length >= 3 ? [imageUrls[2], imageUrls[0], imageUrls[1]] : imageUrls.slice(0, 2);
    } else {
      urls = imageUrls;
    }

    let refUrl = '';
    if (isCouple && urls.length >= 3) {
      refUrl = cropToPortrait(urls[2]);
    } else if (mode === 'bride' && urls.length >= 2) {
      refUrl = cropToPortrait(urls[1]);
    } else {
      refUrl = cropToPortrait(urls[0]);
    }

    const SEEDREAM_SCENES: Record<string, string> = {
      studio_classic: 'elegant white wedding studio with soft natural window light, clean minimal backdrop',
      studio_gallery: 'minimal white architectural studio with curved plaster arches, soft diffused natural light',
      studio_fog: 'warm studio with cream linen draped backdrop and pampas grass, soft warm light',
      studio_mocha: 'dark moody studio with mocha brown wall and dramatic warm spotlight from above',
      studio_sage: 'modern studio with sage green wall and cream furniture, soft even natural light',
      hanbok_traditional: 'traditional Korean palace courtyard, soft natural daylight, dignified atmosphere',
      hanbok_wonsam: 'grand Korean royal palace with red lacquered pillars and dancheong patterns',
      hanbok_dangui: 'serene traditional Korean garden with lotus pond and pine trees',
      hanbok_modern: 'minimalist Korean courtyard, natural soft lighting, modern fashion editorial',
      hanbok_saeguk: 'Korean historical palace with ornate traditional interior, warm candlelight',
      hanbok_flower: 'vibrant flower arrangement spring garden, soft natural light',
      city_night: 'late night empty city streets with neon reflections on wet pavement, sodium streetlamps, rooftop parking garage overlooking skyline, underground passage with flickering fluorescent tubes, nocturnal urban cinematic atmosphere',
      cherry_blossom: 'quiet street lined with cherry blossom trees in full bloom forming pale pink canopy, petals drifting slowly, petal-covered ground soft pink, soft flat overcast light, dreamy spring pastel atmosphere',
      forest_wedding: 'dense old-growth forest with massive dark trunks like cathedral pillars, thick white fog between trees at waist height, deep green moss on dark wet earth, flat grey diffused light, sacred woodland atmosphere',
      castle_garden: 'vast empty European palace interior with high painted ceilings marble columns, grand hall of mirrors with gilded frames, dusty golden light from high windows, abandoned grandeur',
      cathedral: 'vast old gothic stone cathedral with soaring ribbed vault ceiling massive stone pillars, tall stained glass windows casting colored light pools on stone floor, votive candles flickering in dark alcove, sacred Caravaggio chiaroscuro atmosphere',
      watercolor: 'bright airy art studio with large windows, soft pastel watercolor splashes on white walls',
      magazine_cover: 'high fashion editorial portrait, clean minimalist studio, dramatic single light source',
      rainy_day: 'steady rain on quiet Korean street with old low buildings, wet dark asphalt reflecting grey sky, flickering fluorescent light, clear vinyl umbrella, silver rain lines, patient intimate atmosphere',
      vintage_film: 'vintage portrait with warm Kodak Portra 400 tones, soft film grain, natural window light',
      cruise_sunset: 'luxury yacht deck at golden hour sunset, warm amber ocean light, turquoise Mediterranean sea',
      cruise_bluesky: 'luxury cruise ship deck under vivid blue sky, crystal clear ocean, bright natural daylight',
      vintage_record: 'cozy vintage vinyl record shop, warm tungsten lighting, 1970s atmosphere',
      retro_hongkong: 'Hong Kong night market with red lanterns and neon signs, rain-slicked street',
      black_swan: 'dark gothic cathedral with pointed arches, deep blue stained glass, polished black marble floor',
      blue_hour: 'twilight blue hour on European cobblestone street, warm street lamp against deep blue sky',
      velvet_rouge: 'dark opulent mansion library with crimson velvet curtains, warm dim candlelight',
      water_memory: 'dimly lit vintage movie theater with red velvet seats, warm projector light',
      rose_garden: 'lavish rococo salon with pale pink walls, gilded mirrors, climbing pink roses, crystal chandelier, pastel pink dreamy light',
      grass_rain: 'wide green grassy hillside on overcast rainy day, mist hanging low, grey sky, muted green tones, analog film grain',
      eternal_blue: 'empty grey winter beach at dusk, grey sky meeting grey ocean, cold blue-grey monochrome, heavy film grain',
      heart_editorial: 'dark editorial fashion studio, pure black background, hard directional spotlight, high contrast',
      vintage_tungsten: 'dark maximalist vintage room with rose and tropical leaf floral wallpaper, old CRT television, houseplants, floor lamp with fabric shade, direct on-camera flash flat harsh lighting, faded warm print colors magenta highlights yellow midtones, 1970s wedding album',
      aao: 'brightly lit Korean convenience store at night, harsh white fluorescent ceiling lights, linoleum floor, shelves of instant noodles and snacks, deadpan mundane atmosphere, flat ugly fluorescent light',
      spring_letter: 'old quiet library with tall windows cherry blossom branches pressing against glass, soft afternoon dappled pink-tinted light filtering through blossoms, dust floating in warm light beams, quiet and still',
      summer_rain: 'wide open grass field under blazing summer sun or barley field before thunderstorm, harsh midday sun dappled shade or dramatic split sky, hot summer heat and breeze',
      autumn_film: 'narrow Korean residential alley autumn ginkgo leaves or small old portrait studio warm tungsten bulb, extremely low golden afternoon light turning everything amber, quiet unhurried film grain',
      winter_zhivago: 'snow-covered landscape at night or early dawn, heavy snowfall or pristine fresh snow, single distant streetlamp warm orange point, cold blue-white monochrome, breath visible freezing air',
    };

    const SEEDREAM_OUTFIT_GROOM: Record<string, string> = {
  studio_classic: 'wearing elegant black tuxedo with white dress shirt, black bow tie, polished shoes',
  studio_gallery: 'wearing charcoal grey wool-silk single-breasted one-button blazer with exaggerated angular peaked lapel with crisp geometric edges, light grey silk mock-neck top no collar, charcoal tailored straight-leg trousers with sharp center crease, black matte leather oxford shoes, architectural sharp silhouette',
  studio_fog: 'wearing light grey wool-cashmere single-breasted two-button blazer with notch lapel and soft matte brushed texture, white linen band-collar shirt all buttons closed minimal, light grey straight-leg trousers, light grey suede desert boots, quiet tonal grey no accessories',
  studio_mocha: 'wearing dark warm taupe brown wool gabardine single-breasted one-button blazer with notch lapel muted earthy tone like dried clay, ivory cotton open-collar shirt relaxed no tie, dark warm brown straight-leg trousers, dark brown matte leather shoes, understated earthy elegance',
  studio_sage: 'wearing off-white matte wool-blend single-breasted two-button blazer with shawl collar soft chalky texture like unglazed porcelain, pure white fine gauge crew-neck knit top, off-white straight-leg trousers, white leather minimal sneakers, no accessories, clean ethereal',
  hanbok_wonsam: 'MUST wear heukdallyeong (black ceremonial robe with golden circular embroidery on chest) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, samo headpiece (official Korean groom wedding hat with angular wings), gold-embroidered wide belt over white inner jeogori, NOT a western suit NOT a coat NOT modern clothing, authentic traditional Korean royal groom wedding attire',
  hanbok_dangui: 'wearing jade-green dopo (Korean scholar overcoat) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, yugeon (soft fabric headband), white inner jeogori visible underneath, delicate jade ornament at waist, NOT a western suit NOT a coat, refined traditional Korean scholar groom attire',
  hanbok_modern: 'wearing charcoal gray modern durumagi (Korean traditional long overcoat) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, Korean traditional fabric texture, white inner jeogori with mandarin collar visible at neckline, NOT a western suit NOT a blazer NOT a trench coat, contemporary minimalist Korean hanbok groom attire',
  hanbok_saeguk: 'wearing dark navy blue dopo (long traditional Korean overcoat) over white inner robe, traditional V-shaped crossed collar, hair pulled up in traditional Korean topknot with simple black gat hat (wide brimmed Korean traditional hat), subtle gold thread embroidery at hem, dignified composed posture, Korean historical drama nobleman wedding attire, NOT Chinese NOT imperial NOT dragon robe NOT crown',
  hanbok_flower: 'wearing ivory white durumagi (Korean traditional long overcoat) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, subtle floral embroidery at hem, soft pastel inner jeogori visible at neckline, small flower accent, NOT a western suit NOT a blazer, gentle spring Korean hanbok groom attire',
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
  vintage_tungsten: 'wearing dark navy wool single-breasted two-button suit with slightly wide notch lapels in relaxed vintage cut not slim-fit, straight-leg trousers with gentle break at hem, white cotton dress shirt with soft rounded collar, muted dusty lavender silk tie in slightly loose knot, suit has soft lived-in quality not crisp like pulled from 1978 wardrobe',
  aao: 'wearing grand ivory silk shantung double-breasted peak-lapel jacket with long dramatic silhouette extending past the hip, structured wide shoulders, matching high-waisted wide-leg trousers with sharp pressed crease, white silk shirt buttoned to top with cream silk tie, single oversized googly eye with wobbly black pupil pinned on left lapel where boutonniere would be',
  spring_letter: 'wearing light warm grey silk-linen blend single-breasted two-button wedding suit soft natural shoulders slightly nipped waist, matching tapered trousers clean break, pale blush pink silk shirt, ivory silk tie soft sheen, small fresh pink peony bud boutonniere left lapel, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  summer_rain: 'wearing natural off-white washed silk-linen blend unlined single-breasted two-button jacket soft rolled notch lapels relaxed shoulders, matching straight-leg trousers single front pleat, pale water blue silk shirt soft point collar top button undone, no tie, sleeves slightly pushed up, white canvas sneakers, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  autumn_film: 'wearing rich warm tobacco brown wool-silk blend single-breasted three-button jacket slightly longer length soft natural shoulders, matching straight-leg trousers clean pressed crease, champagne ivory silk shirt soft point collar, deep wine red silk tie, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  winter_zhivago: 'wearing deep charcoal black silk-wool blend single-breasted two-button jacket clean slim notch lapels sharp fitted silhouette, matching slim straight-leg trousers, silver-white silk shirt soft spread collar, pale icy lavender silk tie, black cashmere overcoat draped over one shoulder, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
};
    const SEEDREAM_OUTFIT_BRIDE: Record<string, string> = {
  studio_classic: 'wearing white haute couture strapless sweetheart bell gown with sculpted white silk mikado bodice, bell skirt constructed of hundreds of individually cut white silk organza petals in elongated wave shapes layered and overlapping like ocean ripples frozen in motion, each petal heat-shaped to curl slightly at edges creating three-dimensional depth, petals denser at waist gradually more sparse toward hem revealing sheer tulle underneath, long sweeping train',
  studio_gallery: 'wearing white haute couture strapless sweetheart bell gown with sculpted white silk mikado bodice, bell skirt constructed of hundreds of individually cut white silk organza petals in elongated wave shapes layered and overlapping like ocean ripples frozen in motion, each petal heat-shaped to curl at edges creating three-dimensional depth, petals denser at waist gradually sparse toward hem revealing tulle underneath, long sweeping train, natural elegant makeup',
  studio_fog: 'wearing white haute couture strapless sweetheart bell gown that looks like fog, ivory silk crepe smooth minimal bodice, bell skirt with over twenty layers of ultra-sheer white silk organza in gradually varying tones from pure white to softest hint of pale grey at outermost layer, each layer slightly longer than last raw-edged creating soft blurred gradient at hem like dissipating mist, no embellishment no pattern, long fading train, natural elegant makeup',
  studio_mocha: 'wearing white haute couture halterneck bell gown, single wide fabric band of white silk mikado wrapping from front bust up around neck and down open back leaving shoulders bare, clean straight-across neckline, bell skirt of layered white silk organza panels cut in irregular jagged crystalline shapes like cracked glacier ice shards, alternating opaque and sheer panels creating depth with shadow patterns like light through ice, tiny clusters of clear glass micro-beads sparse and subtle, dramatic trailing train, natural elegant makeup',
  studio_sage: 'wearing white haute couture one-shoulder bell gown with single wide sculptural strap over left shoulder of gathered white silk mikado fanning from narrow point into wide dramatic drape across chest wrapping torso asymmetrically, right shoulder completely bare, bell skirt cascading in long vertical knife-pleated panels of white silk organza released at different lengths like streams of water pouring over cliff edge, pleats crisp at waist softening toward hem into fluid ripples, left side longer continuing asymmetry, dramatic sweeping train from left side only, natural elegant makeup',
  hanbok_wonsam: 'wearing vibrant red wonsam (ceremonial robe) layered over yellow chima, golden phoenix embroidery across chest and sleeves, elaborate hwagwan (jeweled crown) with dangling ornaments, white socks with kkotsin (flower shoes), holding a ceremonial fan, traditional Korean royal bride wedding attire',
  hanbok_dangui: 'wearing soft blush-pink dangui (short ceremonial jacket) with gold-thread floral embroidery over deep navy chima (skirt), small jokduri (bridal coronet) with jade and coral beads, delicate binyeo (hairpin) in updo, refined elegant traditional Korean bridal attire',
  hanbok_modern: 'wearing pastel lavender modern jeogori with clean lines over white chima (skirt), hair in loose low bun with single minimalist binyeo (silver hairpin), no heavy ornament, contemporary minimalist Korean bridal attire',
  hanbok_saeguk: 'wearing deep emerald green traditional Korean wedding robe with wide sleeves, golden floral embroidery on green silk fabric, white inner collar visible, hair in traditional Korean low chignon bun with small black silk jokduri (low flat minimal Korean bridal headpiece sitting close to head) with minimal gold trim, NOT tall crown NOT multi-gem crown NOT phoenix crown NOT hanging beads NOT imperial Chinese headdress, robe MUST be dark green NOT golden NOT yellow, Korean historical drama traditional bride wedding attire',
  hanbok_flower: 'wearing light lilac jeogori with delicate flower embroidery over soft white chima (skirt), fresh flower hairpin tucked behind ear, loose natural hairstyle with soft waves, romantic spring Korean bridal attire',
  cherry_blossom: 'wearing soft pearl white silk chiffon off-shoulder wedding dress with sheer chiffon draped loosely across collarbones barely holding onto shoulders, fitted bodice in silk satin with chiffon floating over as translucent second skin, soft full A-line skirt in three layers of weightless silk chiffon that move independently with slightest air with gentle sweep train, innermost chiffon layer dyed palest barely-there blush pink invisible when still but faintest pink breathes through when outer layers separate, no lace no beading no flower motifs, natural elegant makeup',
  city_night: 'wearing midnight navy silk velvet scoop-neckline dress sitting just below collarbones with thin spaghetti straps, smooth clean bias-cut bodice skimming torso, straight fluid column skirt to floor with modest puddle train, subtle burnout technique where velvet pile removed in irregular scattered pattern across lower skirt revealing sheer silk base beneath like night sky with gaps in clouds, thin chain of tiny gold links draped once across open upper back between straps, no lace no beading no sequins, natural elegant makeup',
  forest_wedding: 'wearing warm cream white silk crepe de chine high square-neckline wedding dress, long sleeves fitted to forearm then opening into soft wide bell cuffs falling past fingertips, smooth fitted bodice with single horizontal seam at natural waist, relaxed straight column skirt to floor with long sweep train, bottom hem and train edge dip-dyed in soft gradient fading from cream white into warm moss green over last fifteen centimeters as if dress absorbed forest floor color, no lace no beading no flowers no leaves, natural elegant makeup',
  castle_garden: 'wearing pale antique gold silk satin strapless wedding dress with straight sharp horizontal neckline, smooth sculpted bodice minimal seams silk satin reflecting light like liquid gold, natural waistline with single thin self-fabric belt tied in long trailing bow at back with bow tails falling to floor, grand sweeping A-line skirt with long cathedral train in heavy luminous silk satin with deep sculptural folds pooling on floor, long opera-length gloves in matching antique gold silk satin fingertip to above elbow, no lace no beading no embroidery, natural elegant makeup',
  cathedral: 'wearing pure white heavy silk gazar high closed neckline wedding dress sitting just below jaw with clean sharp edge almost clerical, long sleeves fitted close to arm to wrist with single silk-covered button closure at each cuff, sculpted bodice precise tailoring smooth seamless silk gazar holding shape with stiff architectural quality, restrained A-line skirt floor-length with long cathedral train extending six feet behind, long fingertip-length plain tulle veil attached at crown, natural elegant makeup',
  watercolor: 'wearing delicate off-white silk slip dress with thin straps, loose romantic waves in hair',
  magazine_cover: 'wearing haute couture white gown, high fashion editorial style',
  rainy_day: 'wearing soft dove grey silk charmeuse off-shoulder wedding dress with fabric draping softly across both shoulders in wide gentle curve, fitted bodice smooth seamless surface with liquid mercury-like sheen, clean A-line skirt falling in one fluid unbroken line to floor with modest sweep train, long fitted sleeves in sheer dove grey silk organza showing arms beneath like skin seen through rain on glass, single small silk ribbon bow in slightly darker slate grey at center back neckline, no lace no beading no embroidery, natural elegant makeup',
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
  vintage_tungsten: 'wearing ivory floral cotton lace wedding dress with high Victorian neckline with delicate scalloped edge, long bishop sleeves gathered at wrist with lace cuffs, entire bodice and sleeves of dense floral cotton lace with white silk lining beneath, natural waistline with thin white satin ribbon belt bow, skirt falls in relaxed straight column with slight flare at hem in matching floral lace over silk, simple fingertip-length tulle veil attached at crown, no beading no sequins no modern structure, beautiful vintage dress from a 1970s wedding',
  aao: 'wearing grand ivory silk duchess satin off-shoulder ball gown with dramatic oversized sculptural puff sleeves billowing like inflated clouds gathered tightly at wrists, fitted boned corset bodice with smooth powerful silhouette, massive full ball gown skirt with sweeping cathedral-length train, hundreds of tiny mismatched colorful buttons in pastel pink mint lavender butter yellow all different shapes and sizes embroidered in swirling galaxy spiral pattern across entire skirt and train dense at center hip spiraling outward becoming sparse at hem, no lace no beading no sequins, architecturally grand and surreal',
  spring_letter: 'wearing soft blush pink silk organza off-shoulder wedding dress with organza petal cap sleeves, fitted corset bodice with seed pearls scattered across bodice, three-tiered organza A-line skirt with long train, natural elegant makeup',
  summer_rain: 'wearing pure white silk mikado square-neckline wedding dress with wide straps on edge of shoulders, structured minimal bodice sharp princess seams, softly gathered white silk chiffon skirt gentle sweep train, tiny clear glass beads along square neckline like water droplets, natural elegant makeup',
  autumn_film: 'wearing warm champagne ivory silk satin bias-cut V-neckline wedding dress with delicate spaghetti straps crossing at upper back, smooth diagonal drape across torso asymmetric waist fold, fluid column silhouette pooling into puddle train, small cluster silk leaves amber sienna wine red at back strap crossing, natural elegant makeup',
  winter_zhivago: 'wearing cool silver-white silk faille high boat neckline long fitted sleeve wedding dress with silk-covered buttons wrist to elbow, sculpted bodice vertical princess seams, full architectural A-line skirt deep inverted box pleats chapel train, thin detachable silk faille cape at shoulders with pale icy lavender silk lining, natural elegant makeup',
};

    const scene = SEEDREAM_SCENES[concept] || SEEDREAM_SCENES.studio_classic;
    let sdPrompt = '';
    if (isCouple) {
      const gOutfit = SEEDREAM_OUTFIT_GROOM[concept] || 'classic dark suit with white shirt';
      const bOutfit = SEEDREAM_OUTFIT_BRIDE[concept] || 'elegant white wedding gown';
      sdPrompt = 'Portrait 3:4 ratio. The same couple from the reference image. The man ' + gOutfit + '. The woman ' + bOutfit + '. ' + scene + '. Each person must retain their own distinct unique facial features from the reference photo, the man and woman must have clearly different faces, the man must look masculine with his own jawline and bone structure, the woman must look feminine with her own separate distinct features, do NOT merge or blend their faces, do NOT make them look like siblings or the same person. Warm friendly natural expressions with genuine gentle smiles and kind soft eyes, relaxed comfortable intimate mood, NOT stern NOT cold NOT serious NOT expressionless NOT frowning. Photorealistic editorial photograph, soft natural skin texture with visible pores, warm natural skin tone, 50mm lens, shallow depth of field, no AI artifacts no plastic skin no uncanny valley';
    } else if (mode === 'groom') {
      const outfit = SEEDREAM_OUTFIT_GROOM[concept] || 'classic dark suit with white shirt';
      sdPrompt = 'Portrait 3:4 ratio. The same person from the reference image. ' + outfit + '. ' + scene + '. Warm friendly natural expression with genuine gentle smile and kind soft eyes, relaxed comfortable body language, NOT stern NOT cold NOT serious NOT expressionless NOT frowning. Photorealistic editorial photograph, soft natural skin texture with visible pores, warm natural skin tone, 50mm lens, shallow depth of field, no AI artifacts no plastic skin no uncanny valley';
    } else {
      const outfit = SEEDREAM_OUTFIT_BRIDE[concept] || 'elegant white wedding gown';
      sdPrompt = 'Portrait 3:4 ratio. The same person from the reference image. ' + outfit + '. ' + scene + '. Warm friendly natural expression with genuine gentle smile and kind soft eyes, relaxed comfortable body language, NOT stern NOT cold NOT serious NOT expressionless NOT frowning. Photorealistic editorial photograph, soft natural skin texture with visible pores, warm natural skin tone, 50mm lens, shallow depth of field, no AI artifacts no plastic skin no uncanny valley';
    }

    console.log('[SeeDream retry] calling ARK API, image:', refUrl.slice(0, 80));
    const res = await fetch(ARK_BASE + '/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ARK_API_KEY },
      body: JSON.stringify({
        model: 'seedream-5-0-260128',
        prompt: sdPrompt,
        image: refUrl,
        size: '2K',
        output_format: 'png',
        watermark: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[SeeDream retry] failed:', res.status, errText.slice(0, 500));
      await prisma.aiSnap.update({ where: { id: snapId }, data: { retryStatus: 'failed' } });
      return;
    }

    const data = await res.json();
    const imgUrl = data.data?.[0]?.url;
    if (imgUrl) {
      const uploaded = await uploadFromUrl(imgUrl, 'ai-snap-retry');
      await prisma.aiSnap.update({
        where: { id: snapId },
        data: { retryStatus: 'done', retryResultUrl: uploaded.url },
      });
    } else {
      console.error('[SeeDream retry] no image url:', JSON.stringify(data).slice(0, 500));
      await prisma.aiSnap.update({ where: { id: snapId }, data: { retryStatus: 'failed' } });
    }
  } catch (err: any) {
    console.error('[SeeDream retry] fatal:', err.message);
    await prisma.aiSnap.update({ where: { id: snapId }, data: { retryStatus: 'failed' } });
  }
};

router.post('/:id/retry', authMiddleware, async (req: AuthRequest, res) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const snap = await prisma.aiSnap.findUnique({ where: { id: req.params.id } });
  if (!snap) return res.status(404).json({ error: 'Snap not found' });
  if (snap.retryStatus === 'done') return res.status(400).json({ error: 'Already retried' });
  if (snap.retryStatus === 'generating') return res.status(400).json({ error: 'Retry in progress' });
  if (snap.status !== 'done') return res.status(400).json({ error: 'Original not done' });

  await prisma.aiSnap.update({ where: { id: snap.id }, data: { retryStatus: 'generating' } });
  res.json({ ok: true, retryStatus: 'generating' });

  generateSeeDream(snap.id, snap.concept, snap.inputUrls as string[], snap.mode || 'groom');
});

router.post('/:id/select', authMiddleware, async (req: AuthRequest, res) => {
  const { version } = req.body;
  const snap = await prisma.aiSnap.findUnique({ where: { id: req.params.id } });
  if (!snap) return res.status(404).json({ error: 'Snap not found' });

  if (version === 'retry' && snap.retryResultUrl) {
    await prisma.aiSnap.update({
      where: { id: snap.id },
      data: { resultOriginalUrl: snap.resultUrl, resultUrl: snap.retryResultUrl, engine: 'seedream' },
    });
    if (snap.snapPackId) {
      await prisma.snapPack.update({
        where: { id: snap.snapPackId },
        data: { preferredEngine: 'seedream' },
      });
      console.log('[Select] preferredEngine set to seedream for pack:', snap.snapPackId);
    }
  } else if (version === 'original' && snap.snapPackId) {
    await prisma.snapPack.update({
      where: { id: snap.snapPackId },
      data: { preferredEngine: null },
    });
    console.log('[Select] preferredEngine cleared for pack:', snap.snapPackId);
  }
  res.json({ ok: true });
});

export default router;
