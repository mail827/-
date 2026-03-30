import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const activeJobs = new Map<string, AbortController>();

function checkAbort(videoId: string, signal: AbortSignal) {
  if (signal.aborted) throw new Error('CANCELLED');
}

const FAL_API_KEY = process.env.FAL_API_KEY;
const ARK_API_KEY = process.env.ARK_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ARK_BASE = 'https://ark.ap-southeast.bytepluses.com/api/v3';
const PIAPI_KEY = process.env.PIAPI_KEY;

const SELFIE_CONCEPTS: { id: string; prompt: string; subScenes?: string[] }[] = [
  { id: 'studio_classic', prompt: 'place this person in a modern minimalist white studio with clean white walls and large windows casting soft natural daylight, airy contemporary elegance, photorealistic, 8k' },
  { id: 'studio_gallery', prompt: 'place this person in a minimal white architectural studio with curved plaster arches and tall arched windows, soft diffused natural light, clean airy bright, photorealistic, 8k' },
  { id: 'studio_fog', prompt: 'place this person in a warm studio with cream linen draped backdrop and pampas grass, soft warm light, photorealistic, 8k' },
  { id: 'studio_mocha', prompt: 'place this person in a dark moody studio with mocha brown plaster wall and warm spotlight from above, dramatic golden spotlight, photorealistic, 8k' },
  { id: 'studio_sage', prompt: 'place this person in a modern studio with sage green wall and cream boucle sofa and oak floor, soft even natural light, photorealistic, 8k' },
  { id: 'outdoor_garden', prompt: 'place this person in an outdoor garden wedding setting, lush botanical garden with blooming flowers, golden hour sunlight filtering through trees, natural romantic atmosphere, photorealistic, 8k' },
  { id: 'beach_sunset', prompt: 'place this person at a beautiful beach at golden sunset, warm orange pink sky, pristine white sand, gentle sea breeze, romantic atmosphere, photorealistic, 8k' },
  { id: 'hanbok_traditional', prompt: 'place this person wearing elegant traditional Korean hanbok, pastel pink and ivory with delicate floral embroidery, minimalist Korean courtyard with soft bokeh, warm golden light, photorealistic, 8k' },
  { id: 'hanbok_wonsam', prompt: 'place this person in grand Korean royal palace Geunjeongjeon hall, wearing vibrant traditional ceremonial hanbok, red lacquered pillars with dancheong patterns, warm natural daylight, photorealistic, 8k' },
  { id: 'hanbok_dangui', prompt: 'place this person in serene traditional Korean garden with lotus pond and pine trees, wearing elegant dangui hanbok with gold-thread embroidery, gentle morning sunlight, photorealistic, 8k' },
  { id: 'hanbok_modern', prompt: 'place this person wearing modern stylish Korean hanbok in refined colors, minimalist Korean courtyard setting, natural soft lighting, modern Korean fashion editorial style, photorealistic, 8k' },
  { id: 'hanbok_saeguk', prompt: 'place this person in Korean historical palace setting wearing traditional royal court attire, ornate traditional interior, warm candlelight ambiance, photorealistic, 8k' },
  { id: 'hanbok_flower', prompt: 'place this person wearing floral Korean hanbok surrounded by vibrant flower arrangement, spring garden atmosphere, soft natural light, photorealistic, 8k' },
  { id: 'city_night', prompt: 'place this person in a cinematic night city scene, neon lights reflecting on rain-slicked street, warm bokeh city lights, Wong Kar-wai cinematic grading, photorealistic, 8k' },
  { id: 'cherry_blossom', prompt: 'place this person under cherry blossom trees in full bloom, soft pink petals falling gently, warm spring sunlight, dreamy romantic atmosphere, photorealistic, 8k' },
  { id: 'forest_wedding', prompt: 'place this person in an enchanted forest setting, tall trees with dappled sunlight, moss-covered ground, ethereal woodland atmosphere, photorealistic, 8k' },
  { id: 'castle_garden', prompt: 'place this person in a European castle garden with manicured hedges and stone fountain, elegant classical architecture, golden hour light, photorealistic, 8k' },
  { id: 'cathedral', prompt: 'place this person inside a grand cathedral with stained glass windows, dramatic light beams through colorful glass, solemn elegant atmosphere, photorealistic, 8k' },
  { id: 'watercolor', prompt: 'place this person in a bright airy art studio with large floor-to-ceiling windows, soft diffused natural light, white walls with faint watercolor paint splashes in pastel pink lavender and mint, a large canvas on an easel nearby, scattered paint brushes and watercolor palettes, gentle artistic bohemian atmosphere, soft pastel color palette throughout, photorealistic, 8k' },
  { id: 'magazine_cover', prompt: 'place this person in a high fashion editorial portrait, clean minimalist studio with dramatic single light source, GQ/Vogue cover style, photorealistic, 8k' },
  { id: 'rainy_day', prompt: 'place this person under a clear umbrella on a rainy day, rain drops creating beautiful bokeh, wet street reflections, romantic rainy atmosphere, photorealistic, 8k' },
  { id: 'autumn_leaves', prompt: 'place this person in an autumn setting with golden and red maple leaves, warm fall sunlight, cozy romantic atmosphere, photorealistic, 8k' },
  { id: 'winter_snow', prompt: 'place this person in a winter wonderland with softly falling snow, frosted trees, warm breath visible in cold air, magical winter atmosphere, photorealistic, 8k' },
  { id: 'vintage_film', prompt: 'place this person in a vintage film portrait, warm Kodak Portra 400 color palette, soft film grain texture, natural window light, nostalgic romantic mood, photorealistic, 8k' },
  { id: 'cruise_sunset', prompt: 'place this person on a luxury yacht deck at golden hour sunset, warm amber ocean light, turquoise Mediterranean sea, yacht railing and polished wood deck, romantic cinematic lighting, photorealistic, 8k' },
  { id: 'cruise_bluesky', prompt: 'place this person on a luxury cruise ship deck under vivid blue sky, crystal clear ocean stretching to horizon, bright natural daylight, clean nautical atmosphere, photorealistic, 8k' },
  { id: 'vintage_record', prompt: 'place this person in a cozy vintage vinyl record shop, surrounded by wooden shelves filled with LP records, warm tungsten incandescent bulb lighting, intimate nostalgic 1970s atmosphere, Kodak Portra 400 warm film tones, photorealistic, 8k' },
  { id: 'retro_hongkong', prompt: 'place this person walking in Hong Kong Mong Kok night market with red lanterns overhead, neon signs with Chinese characters, rain-slicked street reflecting red and amber lights, Wong Kar-wai cinematic grading, Fuji Superia 400 grain, photorealistic, 8k' },
  { id: 'black_swan', prompt: 'place this person inside a vast dark gothic cathedral with towering pointed arches and deep blue-tinted stained glass windows casting cold blue light, dark stone pillars and vaulted ceiling fading into shadow, polished black marble floor reflecting the subject like a still lake surface creating a mirror image, misty blue atmosphere with faint light rays through windows, ethereal dark romantic mood, photorealistic, 8k' },
  { id: 'velvet_rouge', prompt: 'place this person in a dark opulent colonial-era mansion library inspired by the film The Handmaiden, floor-to-ceiling dark wooden bookshelves filled with leather-bound books, deep crimson red velvet curtains and chaise longue, ornate Victorian-Japanese hybrid interior with dark lacquered wood and brass fixtures, warm dim candlelight casting long dramatic shadows, rich burgundy and dark mahogany color palette with gold accents, decadent mysterious aristocratic atmosphere, photorealistic, 8k', subScenes: ['place this person in a dark grand library with floor-to-ceiling wooden bookshelves and leather-bound books, crimson velvet curtains, warm candlelight, dark mahogany and gold, aristocratic atmosphere, photorealistic, 8k', 'place this person in a dimly lit Victorian-Japanese drawing room with ornate dark lacquered screen panels, deep red velvet sofa, brass candelabra casting warm shadows, rich burgundy and black, photorealistic, 8k', 'place this person standing in a dark hallway of an old mansion, long Persian carpet runner, oil paintings on walls, single warm gas lamp light, mysterious gothic atmosphere, photorealistic, 8k', 'place this person in an opulent bathroom with dark marble and brass fixtures, large ornate mirror, warm candlelight reflecting off dark surfaces, decadent Victorian atmosphere, photorealistic, 8k', 'place this person seated at a dark wooden vanity table with ornate mirror, warm amber lamplight, scattered jewelry and perfume bottles, intimate private chamber atmosphere, photorealistic, 8k', 'place this person in a grand dark staircase of a colonial mansion, ornate wooden banister, warm light from above casting dramatic shadows, mysterious elegant atmosphere, photorealistic, 8k', 'place this person in a moonlit conservatory with dark tropical plants, glass ceiling showing night sky, warm candle glow, mysterious romantic garden room, photorealistic, 8k'] },
  { id: 'water_memory', prompt: 'place this person sitting alone in a dimly lit vintage 1960s movie theater with dark red velvet seats, soft warm projector light on face from screen, empty theater, melancholic romantic mood, photorealistic, 8k', subScenes: ['place this person sitting alone in a dimly lit vintage 1960s movie theater with dark red velvet seats, soft warm projector light on face from screen, empty theater, melancholic romantic mood, photorealistic, 8k', 'place this person standing in the aisle of an empty old movie theater, warm projector beam visible in dusty air, dark red velvet seats on both sides, golden light from screen illuminating silhouette, nostalgic cinematic atmosphere, photorealistic, 8k', 'place this person walking on a rain-soaked city street at night, wet asphalt reflecting green and amber street lights, light drizzle falling, dark moody cinematic atmosphere, photorealistic, 8k', 'place this person standing by a rain-streaked window at night, city lights blurred through wet glass creating bokeh, dark interior with warm amber lamp on face, contemplative mood, photorealistic, 8k', 'place this person in a dimly lit vintage kitchen with turquoise green tile walls, warm pendant light overhead, rain visible through small window, cozy 1960s apartment, photorealistic, 8k', 'place this person fully submerged underwater, hair floating weightlessly, air bubbles rising, caustic light rays from surface above, deep teal water, professional underwater photography, photorealistic, 8k', 'place this person fully submerged underwater close to another person, hair intertwining in water, air bubbles between them, god rays from above, deep teal romantic underwater scene, photorealistic, 8k'] },
  { id: 'blue_hour', prompt: 'place this person during blue hour twilight, deep cobalt sky with last warm light on horizon, city silhouette in background, cinematic blue-orange contrast, photorealistic, 8k' },
  { id: 'iphone_mirror', prompt: 'mirror selfie with iPhone flash of this person, full body reflected in large clean mirror, bright harsh flash creating high contrast, raw phone camera selfie aesthetic, photorealistic, 8k' },
  { id: 'rose_garden', prompt: 'place this person in a lavish rococo-style salon with pale pink walls gilded ornate mirrors and white iron trellis covered in climbing pink roses, crystal chandelier with dripping candle lights above, soft diffused pastel pink light, dreamy hazy atmosphere, photorealistic, 8k', subScenes: ['place this person in a lavish rococo salon with pale pink walls gilded mirrors climbing pink roses, sitting sideways on gilded pink velvet chaise longue with scattered rose petals and macarons on gold tray, soft pastel pink light, photorealistic, 8k', 'place this person on a grand curved marble staircase with wrought iron pink rose vine railing in rococo palace, pale pink walls gilded molding, long dress train cascading down stairs, soft natural window light, face clearly visible looking toward camera, photorealistic, 8k', 'place this person standing on a small ornate stone balcony overlooking pink rose garden below, rococo pale pink exterior wall gilded window frame, climbing roses around open French doors, facing camera with soft smile, soft overcast afternoon light, photorealistic, 8k', 'place this person standing beside a large gilded mirror in rococo salon, facing camera at three-quarter angle, pale pink walls climbing pink roses around mirror frame, soft diffused pastel pink light, photorealistic, 8k'] },
  { id: 'grass_rain', prompt: 'place this person in a wide green grassy hillside field on an overcast rainy day, tall grass and small wildflowers, mist hanging low, grey sky, muted desaturated green tone, grainy analog film Fuji Superia 400, photorealistic, 8k', subScenes: ['place this person sitting in tall green grass on a hillside, soft overcast diffused light, small bouquet of white wildflowers, face clean and dry, muted desaturated green film tone, grainy analog film, photorealistic, 8k', 'place this person walking through a misty green field after rain, facing camera with gentle expression, mist hanging low over field in distance, face clean and dry no water on face, grainy analog film expired stock, muted washed-out green tones, photorealistic, 8k', 'place this person standing in a wide green field under grey sky, fine rain falling around, gentle smile looking slightly off camera, face completely dry and clean, flat grey overcast light, grainy analog film Kodak Portra 400, muddy green-grey palette, photorealistic, 8k', 'place this person standing in tall green grass on grey rainy day, light mist in air, eyes closed soft peaceful smile, face dry and clean no dripping water, flat grey overcast light, shallow depth of field grassy background, grainy analog film Fuji Pro 400H, photorealistic, 8k', 'place this person standing at edge of misty green hillside field, wind blowing hair gently, holding small wildflower bouquet at waist, face clean and dry, soft overcast light, muted green tone, grainy analog film, photorealistic, 8k'] },
  { id: 'eternal_blue', prompt: 'place this person on an empty grey winter beach at dusk, grey overcast sky blending into grey ocean, wet dark sand, cold wind, edges of frame slightly blurred and darkened as if memory is fading, cool blue-grey desaturated palette, heavy film grain, photorealistic, 8k', subScenes: ['place this person standing on a frozen lake under heavy grey sky with light snow falling, massive blue tulle skirt spreading across white ice, face visible looking down gently, monochromatic blue-white-grey palette, quiet melancholic atmosphere, photorealistic, 8k', 'place this person standing between tall bookshelves in dimly lit old bookstore, warm single desk lamp casting long shadows, dust particles floating in lamplight beam, face lit by warm tungsten light, intimate atmosphere, photorealistic, 8k', 'place this person standing on empty grey winter beach facing camera with melancholic expression, enormous tulle skirt dragging across dark wet sand, cold wind blowing hair, cold desaturated blue-grey monochrome, heavy film grain, photorealistic, 8k', 'place this person sitting on edge of bed in dim bedroom, warm amber lamp light on face, looking toward camera with quiet contemplative expression, cool blue shadows in background, heavy film grain, photorealistic, 8k'] },
  { id: 'heart_editorial', prompt: 'place this person in a dark editorial fashion studio with pure black background, hard directional single light source creating deep shadows, high contrast graphic fashion photograph, photorealistic, 8k', subScenes: ['place this person standing in center of white spotlight circle on black stage floor, everything outside spotlight is pure black, face lit by hard theatrical light, confident gaze at camera, photorealistic, 8k', 'place this person standing in studio with white-grey background, dozens of glossy red 3D heart shapes floating around like confetti, flat even studio lighting, red hearts only color in image, editorial fashion, facing camera, photorealistic, 8k', 'place this person sitting on black cube in dark studio, single hard beauty dish light from front casting defined shadows, chin resting on one hand looking directly at camera, everything else pure black, heavy contrast editorial, photorealistic, 8k', 'place this person standing in dark studio with massive white origami organza train fanned out on floor behind, hard front light illuminating face and upper body, intense calm gaze at camera, pure black background, editorial fashion, photorealistic, 8k'] },
  { id: 'vintage_tungsten', prompt: 'place this person in a dark maximalist vintage room with large rose and tropical leaf wallpaper, old CRT television, tropical houseplants, floor lamp with fabric shade, direct on-camera flash flat harsh lighting, faded warm print magenta highlights yellow midtones, 1970s wedding album, photorealistic, 8k', subScenes: ['place this person sitting on floral velvet sofa in dark vintage room with rose and tropical leaf wallpaper, CRT television behind, direct on-camera flash faces bright background dark, faded warm colors magenta highlights, 1979 wedding album, face clearly visible, photorealistic, 8k', 'place this person sitting on carpet floor in front of old CRT television showing static, dark floral wallpaper, ambient tungsten light and cool TV glow, low light muddy warm colors, candid snapshot cheap 35mm 1982, face clearly visible, photorealistic, 8k', 'place this person on narrow dark wood staircase with faded floral carpet runner and framed photos on wall, single bare warm bulb in stairwell, on-camera flash harsh shadow behind, faded orange-shifted highlights, face clearly visible looking at camera, photorealistic, 8k', 'place this person standing in front of dark floral wallpaper with roses and tropical leaves, tropical plant beside, direct on-camera flash flat lighting harsh shadow behind, face clearly visible gentle smile, faded warm magenta highlights, compact film camera 1981, photorealistic, 8k', 'place this person standing in long narrow dark hallway with faded floral wallpaper and worn carpet, dim bare warm bulbs in wall sconces, warm amber tones, face clearly visible, 1980 amateur photography, photorealistic, 8k'] },
  { id: 'aao', prompt: 'place this person standing in a brightly lit Korean convenience store at night, harsh white fluorescent ceiling lights reflecting off cheap linoleum floor, shelves of instant noodles and snacks behind, deadpan centered composition mundane and still, photorealistic, 8k', subScenes: ['place this person standing in brightly lit Korean convenience store at night, harsh fluorescent lights linoleum floor, shelves of snacks, leaning against refrigerator door, deadpan expression, face clearly visible, photorealistic, 8k', 'place this person standing on cluttered apartment rooftop with clotheslines and hanging laundry, concrete floor puddles, rusted water tanks, grey overcast sky flat daylight, face clearly visible, observational quiet, photorealistic, 8k', 'place this person sitting at bottom of large empty drained outdoor swimming pool, cracked pale blue tiles, dead leaves in corners, bright harsh midday sun overhead, face clearly visible looking up, geometric lonely, photorealistic, 8k', 'place this person sitting in empty late-night subway car, harsh fluorescent tube lighting orange plastic seats, green-tinted fluorescent light, black windows reflecting ghost doubles, face clearly visible quiet expression, photorealistic, 8k', 'place this person standing in empty outdoor parking lot at night in rain, single sodium vapor lamp casting harsh orange circle, everything beyond is black, rain streaks visible, face clearly visible looking up at rain, photorealistic, 8k'] },
];

const GLAMOUR_FACE = 'Preserve the exact original face from the reference photo with every detail unchanged including eyes, nose, lips, jaw shape, face proportions. The face must be identical to the input photo. Anatomically correct natural proportionate head to body ratio, head size must match realistic human proportions relative to shoulders and torso. Raw photo texture, natural skin with visible pores and subtle imperfections, realistic skin grain. Photorealistic 8k quality, clean elegant clothing with no distortion. No text, no logos, no watermarks, no deformed hands, no extra fingers';

const GLAMOUR_OUTFIT_GROOM: Record<string, string> = {
  studio_classic: 'wearing elegant black tuxedo with white dress shirt, black bow tie, polished shoes',
  studio_gallery: 'wearing charcoal grey wool-silk single-breasted one-button blazer with exaggerated angular peaked lapel with crisp geometric edges, light grey silk mock-neck top no collar, charcoal tailored straight-leg trousers with sharp center crease, black matte leather oxford shoes, architectural sharp silhouette',
  studio_fog: 'wearing light grey wool-cashmere single-breasted two-button blazer with notch lapel and soft matte brushed texture, white linen band-collar shirt all buttons closed minimal, light grey straight-leg trousers, light grey suede desert boots, quiet tonal grey no accessories',
  studio_mocha: 'wearing dark warm taupe brown wool gabardine single-breasted one-button blazer with notch lapel muted earthy tone like dried clay, ivory cotton open-collar shirt relaxed no tie, dark warm brown straight-leg trousers, dark brown matte leather shoes, understated earthy elegance',
  studio_sage: 'wearing off-white matte wool-blend single-breasted two-button blazer with shawl collar soft chalky texture like unglazed porcelain, pure white fine gauge crew-neck knit top, off-white straight-leg trousers, white leather minimal sneakers, no accessories, clean ethereal',
  outdoor_garden: 'wearing navy blue suit with white shirt, floral boutonniere pinned to lapel',
  beach_sunset: 'wearing light beige linen suit with open collar white shirt, barefoot',
  hanbok_traditional: 'wearing traditional Korean hanbok, elegant dark blue dopo with white inner jeogori, traditional headpiece',
  hanbok_wonsam: 'MUST wear heukdallyeong (black ceremonial robe with golden circular embroidery on chest) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, samo headpiece (official Korean groom wedding hat with angular wings), gold-embroidered wide belt over white inner jeogori, NOT a western suit NOT a coat NOT modern clothing, authentic traditional Korean royal groom wedding attire',
  hanbok_dangui: 'wearing jade-green dopo (Korean scholar overcoat) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, yugeon (soft fabric headband), white inner jeogori visible underneath, delicate jade ornament at waist, NOT a western suit NOT a coat, refined traditional Korean scholar groom attire',
  hanbok_modern: 'wearing charcoal gray modern durumagi (Korean traditional long overcoat) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, Korean traditional fabric texture, white inner jeogori with mandarin collar visible at neckline, NOT a western suit NOT a blazer NOT a trench coat, contemporary minimalist Korean hanbok groom attire',
  hanbok_saeguk: 'wearing dark navy blue dopo (long traditional Korean overcoat) over white inner robe, traditional V-shaped crossed collar, hair pulled up in traditional Korean topknot with simple black gat hat (wide brimmed Korean traditional hat), subtle gold thread embroidery at hem, dignified composed posture, Korean historical drama nobleman wedding attire, NOT Chinese NOT imperial NOT dragon robe NOT crown',
  hanbok_flower: 'wearing ivory white durumagi (Korean traditional long overcoat) with traditional V-shaped crossed collar (gyotgit), goreum ribbon ties at chest, subtle floral embroidery at hem, soft pastel inner jeogori visible at neckline, small flower accent, NOT a western suit NOT a blazer, gentle spring Korean hanbok groom attire',
  city_night: 'wearing sleek black tuxedo with satin lapels, black bow tie, cufflinks',
  cherry_blossom: 'wearing soft gray suit with light pink boutonniere, white pocket square',
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
  black_swan: 'wearing black silk-satin shawl-collar blazer over black silk-georgette relaxed collarless shirt with moderate V-neckline showing collarbones only, shirt tucked in, black high-waisted wide-leg tailored trousers, thin black leather belt with matte buckle, black chelsea boots, all-black no accessories, dark sophisticated elegance',
  velvet_rouge: 'wearing deep dark teal-green silk single-breasted one-button blazer with peaked lapel and refined luminous sheen like aged jade NOT bright turquoise NOT mint, black silk open-collar shirt no tie top two buttons undone, dark teal tailored slim-straight trousers in same silk fabric, black polished leather oxford shoes, no pocket square no accessories, aristocratic sharp darkly romantic',
  water_memory: 'wearing pearl-white silk mikado single-breasted peaked lapel suit with visible luminous silk sheen like wet porcelain, NOT linen NOT matte NOT cream beige, white silk open-collar shirt no tie showing collarbones, pearl-white slim-straight trousers in same silk mikado fabric, white leather minimal dress shoes, entire outfit has unified pearlescent silk glow, ethereal dreamlike elegance',
  blue_hour: 'wearing classic navy blue fine wool two-piece suit, single-breasted two-button blazer with notch lapel fitted silhouette, crisp white dress shirt with top button undone no tie, navy blue tailored slim trousers, dark brown leather oxford shoes, simple classic timeless gentleman',
  iphone_mirror: 'wearing casual white shirt with rolled sleeves, relaxed natural look, no tie no jacket, holding phone for mirror selfie',
  rose_garden: 'wearing pale warm beige soft wool two-button suit with natural shoulders, ivory cream silk tie in loose knot over white cotton dress shirt, ivory silk pocket square, soft brushed matte texture, romantic elegant',
  grass_rain: 'wearing black wool slim-fit two-button suit with natural shoulders, white cotton shirt with collar open no tie, jacket worn casually unbuttoned, clean simple silhouette',
  eternal_blue: 'wearing slate blue-grey wool one-button suit with slim peak lapels, white silk shirt spread collar top button undone no tie, small pearl pin on left lapel, cool melancholic',
  heart_editorial: 'wearing sharp black double-breasted six-button jacket with extreme wide peaked lapels and structured squared shoulders, high-waisted wide-leg trousers with razor-sharp crease, crisp white shirt buttoned to top narrow black silk tie, red fabric heart on left lapel, bold graphic',
  vintage_tungsten: 'wearing dark navy wool two-button suit with wide notch lapels relaxed vintage cut, white cotton shirt soft rounded collar, dusty lavender silk tie slightly loose, soft lived-in quality like 1978 wardrobe',
  aao: 'wearing grand ivory silk shantung double-breasted peak-lapel long jacket extending past hip, structured wide shoulders, high-waisted wide-leg trousers sharp crease, white silk shirt cream tie, oversized googly eye pinned on left lapel',
};

const GLAMOUR_OUTFIT_BRIDE: Record<string, string> = {
  studio_classic: 'wearing white haute couture strapless sweetheart bell gown with sculpted white silk mikado bodice, bell skirt constructed of hundreds of individually cut white silk organza petals in elongated wave shapes layered and overlapping like ocean ripples frozen in motion, each petal heat-shaped to curl slightly at edges creating three-dimensional depth, long sweeping train',
  studio_gallery: 'wearing white haute couture strapless sweetheart bell gown with sculpted white silk mikado bodice, bell skirt of silk organza petals layered like ocean ripples, long sweeping train, natural elegant makeup',
  studio_fog: 'wearing white haute couture strapless sweetheart bell gown that looks like fog, ivory silk crepe smooth minimal bodice, bell skirt with over twenty layers of ultra-sheer white silk organza in varying tones from pure white to softest pale grey, no embellishment no pattern, long fading train, natural elegant makeup',
  studio_mocha: 'wearing white haute couture halterneck bell gown, single wide fabric band of white silk mikado wrapping from front bust up around neck and down open back leaving shoulders bare, bell skirt of layered white silk organza panels cut in irregular jagged crystalline shapes like cracked glacier ice shards, dramatic trailing train, natural elegant makeup',
  studio_sage: 'wearing white haute couture one-shoulder bell gown with single wide sculptural strap over left shoulder of gathered white silk mikado, right shoulder completely bare, bell skirt cascading in long vertical knife-pleated panels of white silk organza released at different lengths like streams of water, dramatic sweeping train, natural elegant makeup',
  outdoor_garden: 'wearing flowing white organza wedding dress with delicate floral embroidery, wildflower bouquet',
  beach_sunset: 'wearing flowing lightweight white chiffon dress with open back, barefoot, windswept hair',
  hanbok_traditional: 'wearing elegant traditional Korean hanbok, pastel pink jeogori over ivory chima, delicate floral embroidery, traditional bridal headpiece',
  hanbok_wonsam: 'wearing vibrant red wonsam (ceremonial robe) layered over yellow chima, golden phoenix embroidery across chest and sleeves, elaborate hwagwan (jeweled crown) with dangling ornaments, traditional Korean royal bride wedding attire',
  hanbok_dangui: 'wearing soft blush-pink dangui (short ceremonial jacket) with gold-thread floral embroidery over deep navy chima (skirt), small jokduri (bridal coronet) with jade and coral beads, delicate binyeo (hairpin) in updo, refined elegant traditional Korean bridal attire',
  hanbok_modern: 'wearing pastel lavender modern jeogori with clean lines over white chima (skirt), hair in loose low bun with single minimalist binyeo (silver hairpin), no heavy ornament, contemporary minimalist Korean bridal attire',
  hanbok_saeguk: 'wearing deep emerald green traditional Korean wedding robe with wide sleeves, golden floral embroidery on green silk fabric, white inner collar visible, hair in traditional Korean low chignon bun with small black silk jokduri, Korean historical drama traditional bride wedding attire',
  hanbok_flower: 'wearing light lilac jeogori with delicate flower embroidery over soft white chima (skirt), fresh flower hairpin tucked behind ear, loose natural hairstyle with soft waves, romantic spring Korean bridal attire',
  city_night: 'wearing sparkling white sequin evening gown with plunging back, elegant updo',
  cherry_blossom: 'wearing soft white tulle wedding dress with cap sleeves, delicate flower crown',
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
  vintage_record: 'wearing ivory cream Victorian puff-sleeve wedding dress with sheer floral lace high-neck bodice over sweetheart neckline, short puffy gathered sleeves at shoulder, fitted ivory satin ribbon belt at waist, full A-line satin skirt with front slit, elbow-length white satin opera gloves, short tulle veil on back of head, hair worn completely down and loose past shoulders, 1960s vintage bridal',
  retro_hongkong: 'wearing champagne gold silk satin halter-neck dress with thin spaghetti straps and open cutout sides showing skin, small low mandarin collar detail at neckline, body-hugging silhouette, scattered delicate gold plum blossom embroidery, thigh-high side slit, vintage pearl drop earrings, metallic gold ankle-strap heels, long loose black hair flowing down past shoulders',
  black_swan: 'wearing strapless black matte silk tube top bodice with soft wispy black ostrich feather trim running across entire straight-across bustline neckline like feathery border, single black ostrich feather stole draped over LEFT shoulder only cascading down left arm, grand floor-length A-line bell silhouette of layered semi-sheer black tulle extremely long pooling and trailing on floor, natural elegant makeup, dark ethereal beauty',
  velvet_rouge: 'wearing deep crimson red strapless sweetheart haute couture bell gown in crimson silk mikado with soft luminous sheen, grand voluminous bell skirt with overlapping sheer crimson organza panels cut into elongated teardrop shapes resembling peacock tail plumes, white silk satin opera-length gloves smooth luminous fitted, long straight black hair with see-through bangs, natural elegant makeup with subtle lip color',
  water_memory: 'wearing ice-blue haute couture strapless sweetheart mermaid gown in silk mikado with refined porcelain-like luminous sheen, fitted bodice with invisible boning hugging body to below knees, below knees dramatic cascading fin-like panels of double-layered silk organza in gradients of ice-blue fading to pale silver-grey, freshwater pearls hand-sewn in organic irregular clusters, long cathedral train, natural elegant makeup',
  blue_hour: 'wearing deep jewel-tone sapphire blue strapless silk tube top bodice with rich royal blue subtle satin sheen, lightweight silk-chiffon A-line floor-length skirt with slight sweep that moves like liquid, no beading no sequins no feathers pure clean elegant simplicity, matching blue satin pointed-toe heels, natural dewy makeup, elegant evening glamour',
  iphone_mirror: 'wearing casual white blouse or knit top, natural minimal makeup, hair down loosely, relaxed everyday look, no wedding dress, holding phone for mirror selfie',
  rose_garden: 'wearing ivory duchess silk satin off-shoulder wedding dress with draped silk across collarbone, structured corset bodice, three blush pink silk rosettes at left shoulder, full voluminous A-line skirt with long train, natural elegant makeup',
  grass_rain: 'wearing light ivory silk chiffon halter-neck dress with crossed draped neckline, gently fitted bodice, multiple opaque layered chiffon skirt, fabric fully opaque with dense layering ensuring complete body coverage, natural minimal makeup',
  eternal_blue: 'wearing dusty powder blue strapless sweetheart satin bodice dress with massive voluminous cloud-like tulle ruffled skirt graduating blue tones, single pearl strand across bodice, natural elegant makeup',
  heart_editorial: 'wearing pure white architectural high mock-neck dress with structured exaggerated square shoulders, rigid sculpted duchess satin torso, front straight column back origami organza train, oversized red fabric heart brooch at center of chest, editorial fashion makeup',
  vintage_tungsten: 'wearing ivory floral cotton lace high Victorian neckline dress with bishop sleeves gathered at wrist, satin ribbon belt, fingertip tulle veil, no beading no sequins, vintage 1970s bridal',
  aao: 'wearing grand ivory duchess satin off-shoulder ball gown with dramatic oversized puff sleeves, fitted corset bodice, massive ball gown skirt with hundreds of tiny colorful pastel buttons in galaxy spiral pattern, cathedral train, architecturally grand and surreal',
};

const VIDEO_COUPLE_SHOTS = [
  'medium shot standing side by side, linked arms, gentle smiles at each other',
  'wide shot from behind, walking hand in hand, scenic environment visible',
  'close-up facing each other, warm smiles, shallow depth of field',
  'medium shot back hug, arms around waist, cozy embrace',
  'wide full body shot walking together, scenic framing',
  'close-up foreheads touching, eyes closed, intimate moment',
  'medium shot seated together, arm around shoulder, warm interaction',
];

const VIDEO_GROOM_SHOTS = [
  'full body wide shot, standing confidently, one hand in pocket',
  'close-up upper body, adjusting jacket lapel, warm eye contact',
  'cinematic side profile, sharp jawline, rim lighting',
  'medium shot, walking forward with purpose, warm golden light',
  'full body seated on steps, elbows on knees, genuine smile',
  'over-the-shoulder angle, three quarter turn, looking back',
  'wide shot leaning against wall, arms crossed, environmental framing',
];

const VIDEO_BRIDE_SHOTS = [
  'full body wide shot, standing elegantly, hand on dress, gentle smile',
  'close-up upper body, tucking hair behind ear, soft expression',
  'medium shot from behind, looking over shoulder, mysterious smile, backlight',
  'wide shot walking gracefully, dress flowing in motion',
  'medium shot seated elegantly, hands on knee, gentle smile',
  'close-up profile view, wind in hair, serene expression',
  'full body, standing by doorframe, elegant pose, soft natural light',
];






async function visionQC(originalUrl: string, generatedUrl: string, mode: string = ''): Promise<boolean> {
  try {
    let genderCheck = '';
    if (mode === 'groom') genderCheck = '\n3. GENDER-OUTFIT: The person MUST be wearing masculine clothing (suit, blazer, shirt, pants). If wearing a dress, skirt, gown, or any feminine clothing, answer FAIL.';
    else if (mode === 'bride') genderCheck = '\n3. GENDER-OUTFIT: The person MUST be wearing feminine clothing (dress, gown, skirt). If wearing a full suit with pants like a man, answer FAIL.';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_API_KEY },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 20,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: originalUrl, detail: 'high' } },
            { type: 'image_url', image_url: { url: generatedUrl, detail: 'high' } },
            { type: 'text', text: 'Image 1 is the original photo. Image 2 is AI-generated. Check these things:\n1. DEFORMITY: Does image 2 have any deformed faces, extra or missing fingers, mutated hands, fused body parts, distorted limbs, extra arms or legs, melted or blurred facial features, asymmetric eyes at different heights, disproportionately large head compared to body, or any anatomical impossibility?\n2. FACE MATCH: Comparing ONLY eyes shape, nose shape, mouth shape, jawline, and face proportions — is it clearly the same person?' + genderCheck + '\nAnswer FAIL if ANY check fails. Answer PASS only if ALL checks pass. Reply with one word: PASS or FAIL.' },
          ],
        }],
      }),
    });
    const data = await res.json();
    const answer = (data.choices?.[0]?.message?.content || '').trim().toUpperCase();
    if (!answer) { console.log('[VisionQC] empty response, PASS by default'); return true; }
    const passed = answer.includes('PASS') && !answer.includes('FAIL');
    console.log('[VisionQC]', passed ? 'PASS' : 'FAIL', '| raw:', answer.slice(0, 80));
    return passed;
  } catch (e: any) {
    console.error('[VisionQC] error:', e.message);
    return true;
  }
}


async function cropUpperBody(imageUrl: string): Promise<string> {
  try {
    const sharp = (await import('sharp')).default;
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const imgRes = await fetch(imageUrl);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const meta = await sharp(buf).metadata();
    const w = meta.width || 900;
    const h = meta.height || 1200;
    const cropH = Math.round(h * 0.75);
    const cropped = await sharp(buf)
      .extract({ left: 0, top: 0, width: w, height: cropH })
      .jpeg({ quality: 92 })
      .toBuffer();
    const s3 = new S3Client({ region: 'auto', endpoint: process.env.R2_ENDPOINT!, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! } });
    const key = 'glamour-crop/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
    await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME || 'wedding-assets', Key: key, Body: cropped, ContentType: 'image/jpeg' }));
    const publicUrl = process.env.R2_PUBLIC_URL + '/' + key;
    console.log('[CropUpper] OK:', key);
    return publicUrl;
  } catch (e: any) {
    console.error('[CropUpper] failed:', e.message);
    return imageUrl;
  }
}

async function generateGlamourPhotos(selfieUrls: string[], gender: 'male' | 'female' | 'couple', count: number = 7, selectedIds?: string[]): Promise<string[]> {
  const conceptId = selectedIds?.length ? selectedIds[0] : 'studio_classic';
  const concept = SELFIE_CONCEPTS.find(c => c.id === conceptId) || SELFIE_CONCEPTS[0];
  const groomOutfit = GLAMOUR_OUTFIT_GROOM[conceptId] || GLAMOUR_OUTFIT_GROOM.studio_classic;
  const brideOutfit = GLAMOUR_OUTFIT_BRIDE[conceptId] || GLAMOUR_OUTFIT_BRIDE.studio_classic;

  const plan: { mode: 'couple' | 'groom' | 'bride'; urls: string[] }[] = [];
  if (selfieUrls.length >= 3) {
    plan.push({ mode: 'groom', urls: [selfieUrls[0]] });
    plan.push({ mode: 'groom', urls: [selfieUrls[0]] });
    plan.push({ mode: 'groom', urls: [selfieUrls[0]] });
    plan.push({ mode: 'bride', urls: [selfieUrls[1]] });
    plan.push({ mode: 'bride', urls: [selfieUrls[1]] });
    plan.push({ mode: 'bride', urls: [selfieUrls[1]] });
    plan.push({ mode: 'couple', urls: selfieUrls[2] ? [selfieUrls[2]] : [selfieUrls[0], selfieUrls[1]] });
    plan.push({ mode: 'couple', urls: [selfieUrls[0], selfieUrls[1]] });
    plan.push({ mode: 'couple', urls: selfieUrls[2] ? [selfieUrls[2]] : [selfieUrls[0], selfieUrls[1]] });
    plan.push({ mode: 'couple', urls: [selfieUrls[0], selfieUrls[1]] });
  } else if (selfieUrls.length === 2) {
    plan.push({ mode: 'groom', urls: [selfieUrls[0]] });
    plan.push({ mode: 'groom', urls: [selfieUrls[0]] });
    plan.push({ mode: 'groom', urls: [selfieUrls[0]] });
    plan.push({ mode: 'bride', urls: [selfieUrls[1]] });
    plan.push({ mode: 'bride', urls: [selfieUrls[1]] });
    plan.push({ mode: 'bride', urls: [selfieUrls[1]] });
    plan.push({ mode: 'couple', urls: selfieUrls });
    plan.push({ mode: 'couple', urls: selfieUrls });
    plan.push({ mode: 'couple', urls: selfieUrls });
    plan.push({ mode: 'couple', urls: selfieUrls });
  } else {
    const soloMode = gender === 'male' ? 'groom' as const : 'bride' as const;
    for (let j = 0; j < count; j++) plan.push({ mode: soloMode, urls: selfieUrls });
  }

  const groomShots = VIDEO_GROOM_SHOTS;
  const brideShots = VIDEO_BRIDE_SHOTS;
  const coupleShots = VIDEO_COUPLE_SHOTS;
  let gi = 0, bi = 0, ci = 0;

  async function genOne(p: typeof plan[0], shot: string, refUrls: string[], shotIndex: number = 0): Promise<string | null> {
    const modeWord = p.mode === 'couple' ? 'this couple' : p.mode === 'groom' ? 'this man' : 'this woman';
    const sceneBase = concept.subScenes && concept.subScenes.length > 0
      ? concept.subScenes[shotIndex % concept.subScenes.length]
      : concept.prompt;
    const scene = sceneBase.replace('this person', modeWord);
    const outfitPrompt = p.mode === 'couple'
      ? 'man ' + groomOutfit + ', woman ' + brideOutfit
      : p.mode === 'groom' ? groomOutfit : brideOutfit;

    const prompt = [
      GLAMOUR_FACE,
      scene,
      outfitPrompt,
      shot,
    ].join(', ');

    try {
      const submitRes = await fetch('https://queue.fal.run/fal-ai/nano-banana-2/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Key ' + FAL_API_KEY },
        body: JSON.stringify({
          prompt,
          image_urls: refUrls,
          num_images: 1,
          aspect_ratio: '3:4',
          resolution: '1K',
          output_format: 'png',
        }),
      });
      const submitData = await submitRes.json();
      let rawUrl: string | null = null;
      if (submitData.images?.[0]?.url) {
        rawUrl = submitData.images[0].url;
      } else if (submitData.request_id) {
        const requestId = submitData.request_id;
        const responseUrl = submitData.response_url || ('https://queue.fal.run/fal-ai/nano-banana-2/edit/requests/' + requestId);
        const statusUrl = submitData.status_url || (responseUrl + '/status');
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 5000));
          try {
            const poll = await fetch(statusUrl, { headers: { 'Authorization': 'Key ' + FAL_API_KEY } });
            const pollData = await poll.json();
            if (pollData.status === 'COMPLETED') {
              const resultRes = await fetch(responseUrl, { headers: { 'Authorization': 'Key ' + FAL_API_KEY } });
              const resultData = await resultRes.json();
              rawUrl = resultData?.images?.[0]?.url || null;
              break;
            }
            if (pollData.status === 'FAILED') { console.error('[Glamour] fal generation failed'); break; }
          } catch { continue; }
        }
      } else {
        console.error('[Glamour] no images or request_id:', JSON.stringify(submitData).slice(0, 200));
        return null;
      }
      if (rawUrl) {
        try {
          const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
          const imgRes = await fetch(rawUrl);
          const buf = Buffer.from(await imgRes.arrayBuffer());
          const s3 = new S3Client({ region: 'auto', endpoint: process.env.R2_ENDPOINT!, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! } });
          const key = 'glamour/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.png';
          await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME || 'wedding-assets', Key: key, Body: buf, ContentType: 'image/png' }));
          const publicUrl = process.env.R2_PUBLIC_URL + '/' + key;
          console.log('[Glamour] R2 saved:', key);
          return publicUrl;
        } catch (e: any) {
          console.error('[Glamour] R2 save failed, using fal url:', e.message);
          return rawUrl;
        }
      }
      console.error('[Glamour] no image url in result');
    } catch (e: any) { console.error('[Glamour] error:', e.message); }
    return null;
  }

  const allResults: (string | null)[] = [];
  const BATCH = 3;
  const totalJobs = Math.min(count, plan.length);

  for (let batch = 0; batch < totalJobs; batch += BATCH) {
    const batchEnd = Math.min(batch + BATCH, totalJobs);
    const batchPromises: Promise<string | null>[] = [];

    for (let si = batch; si < batchEnd; si++) {
      const p = plan[si];
      const shots = p.mode === 'couple' ? coupleShots : p.mode === 'groom' ? groomShots : brideShots;
      const shotIdx = p.mode === 'couple' ? ci++ : p.mode === 'groom' ? gi++ : bi++;
      const shot = shots[shotIdx % shots.length];

      batchPromises.push(
        (async () => {
          const url1 = await genOne(p, shot, p.urls, si);
          if (!url1) { console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' GEN FAILED'); return null; }
          if (p.mode === 'couple') {
            const url2 = await genOne(p, shot, p.urls, si);
            if (!url2) {
              const soloPass = await visionQC(p.urls[0], url1, p.mode);
              console.log('[Glamour] ' + conceptId + ' couple shot ' + (si + 1) + ' only url1, QC ' + (soloPass ? 'PASS' : 'FAIL(use anyway)'));
              return url1;
            }
            const qc1 = await visionQC(p.urls[0], url1, p.mode);
            const qc2 = await visionQC(p.urls[0], url2, p.mode);
            console.log('[Glamour] ' + conceptId + ' couple shot ' + (si + 1) + ' QC: A=' + (qc1?'PASS':'FAIL') + ' B=' + (qc2?'PASS':'FAIL'));
            if (qc1 && !qc2) return url1;
            if (!qc1 && qc2) return url2;
            if (!qc1 && !qc2) {
              console.log('[Glamour] ' + conceptId + ' couple shot ' + (si + 1) + ' both FAIL, comparative pick');
            }
            try {
              const pickRes = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_API_KEY },
                body: JSON.stringify({
                  model: 'gpt-4o-mini', max_tokens: 10,
                  messages: [{ role: 'user', content: [
                    { type: 'image_url', image_url: { url: url1, detail: 'high' } },
                    { type: 'image_url', image_url: { url: url2, detail: 'high' } },
                    { type: 'text', text: 'Two AI-generated couple wedding photos. Pick the one with more natural faces, better preserved facial identity, and fewer visual artifacts. Reply ONLY A or B.' },
                  ] }],
                }),
              });
              const pickData = await pickRes.json();
              const pick = (pickData.choices?.[0]?.message?.content || 'A').trim().toUpperCase();
              const chosen = pick.includes('B') ? url2 : url1;
              console.log('[Glamour] ' + conceptId + ' couple shot ' + (si + 1) + ' comparative: ' + pick);
              return chosen;
            } catch (e: any) { console.log('[Glamour] couple comparative error:', e.message); return url1; }
          }
          const pass1 = await visionQC(p.urls[0], url1, p.mode);
          if (pass1) { console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' QC PASS'); return url1; }
          console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' QC FAIL, retry');
          const url2 = await genOne(p, shot, p.urls, si);
          if (!url2) { console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' retry gen failed, use first'); return url1; }
          const pass2 = await visionQC(p.urls[0], url2, p.mode);
          if (pass2) { console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' retry QC PASS'); return url2; }
          console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' both QC FAIL, use first'); return url1;
        })()
      );
    }

    const batchResults = await Promise.all(batchPromises);
    allResults.push(...batchResults);
    console.log('[Glamour] batch ' + (Math.floor(batch/BATCH)+1) + ' done: ' + batchResults.filter(Boolean).length + '/' + batchResults.length);
  }

  return allResults.filter((r): r is string => !!r);
}



const SUBTITLE_STYLES = [
  { id: 'poetic', name: '시적 감성', desc: '당신이라는 계절이 왔다' },
  { id: 'minimal', name: '담백 미니멀', desc: '처음, 함께, 우리의 날' },
  { id: 'narrative', name: '내러티브', desc: '그해 봄, 우연이 시작이 되고' },
  { id: 'cinema', name: '영화적', desc: '한 편의 영화처럼' },
];

const PRICING: Record<string, { amount: number; label: string }> = {
  photo: { amount: 29000, label: '식전영상' },
  selfie: { amount: 39000, label: '식전영상 + AI 화보팩' },
};

const FONTS = [
  { id: 'BMJUA_ttf', name: '주아체', file: 'BMJUA_ttf.ttf' },
  { id: 'BMKkubulimTTF', name: '배민 꾸불림', file: 'BMKkubulimTTF.ttf' },
  { id: 'ChosunGs', name: '조선 고딕', file: 'ChosunGs.TTF' },
  { id: 'ChosunNm', name: '조선 명조', file: 'ChosunNm.ttf' },
  { id: 'ChosunBg', name: '조선 붓글씨', file: 'ChosunBg.TTF' },
  { id: 'Diphylleia-Regular', name: '디필레이아', file: 'Diphylleia-Regular.ttf' },
  { id: 'GreatVibes-Regular', name: 'Great Vibes', file: 'GreatVibes-Regular.ttf' },
  { id: 'DXMSUBTITLESM', name: 'DX 자막체', file: 'DXMSubtitlesM.ttf' },
];


async function execAsync(cmd: string, timeout = 300000): Promise<void> {
  const { exec } = await import('child_process');
  return new Promise((resolve, reject) => {
    const proc = exec(cmd, { timeout, maxBuffer: 50 * 1024 * 1024 }, (error: any) => {
      if (error) reject(error);
      else resolve();
    });
    proc.stderr?.on('data', (d: string) => console.log('[ffmpeg]', d.toString().trim().slice(-200)));
  });
}

const adminOnly = (req: AuthRequest, res: Response, next: Function) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' });
  next();
};

function escapeDrawtext(text: string): string {
  return text
    .replace(/'/g, '\u2019')
    .replace(/;/g, '')
    .replace(/:/g, '\\:')
    .replace(/%/g, '%%');
}

function getFontPath(fontId: string): string {
  const entry = FONTS.find(f => f.id === fontId);
  if (!entry) return '/app/fonts/BMJUA_ttf.ttf';
  return `/app/fonts/${entry.file}`;
}

router.get('/config', (_req, res) => {
  res.json({ pricing: PRICING, fonts: FONTS, subtitleStyles: SUBTITLE_STYLES, selfieConcepts: SELFIE_CONCEPTS.map(c => ({ id: c.id, name: ({ studio_classic: '클래식 스튜디오', studio_gallery: '갤러리 스튜디오', studio_fog: '포그 스튜디오', studio_mocha: '모카 스튜디오', studio_sage: '세이지 스튜디오', outdoor_garden: '가든 웨딩', beach_sunset: '비치 선셋', hanbok_traditional: '전통 한복', hanbok_wonsam: '원삼 혼례', hanbok_dangui: '당의 한복', hanbok_modern: '모던 한복', hanbok_saeguk: '사극풍', hanbok_flower: '꽃 한복', city_night: '시티 나이트', cherry_blossom: '벚꽃', forest_wedding: '숲속 웨딩', castle_garden: '유럽 궁전', cathedral: '성당', watercolor: '수채화', magazine_cover: '매거진 커버', rainy_day: '비 오는 날', autumn_leaves: '가을 단풍', winter_snow: '겨울 눈', vintage_film: '빈티지 필름', cruise_sunset: '크루즈 선셋', cruise_bluesky: '크루즈 블루스카이', vintage_record: '빈티지 레코드', retro_hongkong: '레트로 홍콩', black_swan: '블랙 스완', velvet_rouge: '벨벳 루즈', water_memory: '물의 기억', blue_hour: '블루아워', iphone_mirror: '거울 셀카', rose_garden: '장미 정원', grass_rain: '풀밭', eternal_blue: '블루', heart_editorial: '하이 에디토리얼', vintage_tungsten: '빈티지 텅스텐', aao: '에에올' } as Record<string, string>)[c.id] || c.id })) });
});

router.get('/bgm', async (_req, res) => {
  try {
    const bgms = await prisma.bgMusic.findMany({
      where: { isActive: true, category: 'prewedding' },
      orderBy: { order: 'asc' },
    });
    res.json(bgms);
  } catch {
    res.status(500).json({ error: 'BGM 조회 실패' });
  }
});

router.post('/create', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { groomName, brideName, weddingDate, metStory, photos, bgmId, bgmUrl, fontId, tier, venueName, groomFather, groomMother, brideFather, brideMother, mode, selfieConcepts, endingMessage, videoEngine, familyMembers, friendsList, specialThanks, creditTextColor } = req.body;

  const minPhotos = mode === 'selfie' ? 1 : 3;
  if (!groomName || !brideName || !photos?.length || photos.length < minPhotos) {
    return res.status(400).json({ error: mode === 'selfie' ? '셀카 1장 이상 필요' : '사진 3장 이상 필요' });
  }

  const pricing = PRICING[mode || 'photo'] || PRICING.photo;
  const orderId = `PV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const video = await prisma.preweddingVideo.create({
      data: {
        userId,
        groomName,
        brideName,
        weddingDate: weddingDate || '',
        metStory: metStory || '',
        photos,
        bgmId: bgmId || null,
        bgmUrl: bgmUrl || null,
        fontId: fontId || 'BMJUA_ttf',
        subtitleStyle: req.body.subtitleStyle || 'poetic',
        mode: mode || 'photo',
        scenes: mode === 'selfie' && selfieConcepts ? selfieConcepts : undefined,
        venueName: venueName || '',
        groomFather: groomFather || '',
        groomMother: groomMother || '',
        brideFather: brideFather || '',
        brideMother: brideMother || '',
        endingMessage: endingMessage || '',
        familyMembers: familyMembers || '',
        friendsList: friendsList || '',
        specialThanks: specialThanks || '',
        creditTextColor: creditTextColor || '#ffffff',
        amount: pricing.amount,
        orderId,
        status: 'PENDING',
      },
    });

    res.json({ id: video.id, orderId, amount: pricing.amount, label: pricing.label, clientKey: process.env.TOSS_CLIENT_KEY });
  } catch (e: any) {
    console.error('PreweddingVideo create error:', e);
    res.status(500).json({ error: '주문 생성 실패' });
  }
});

router.post('/payment/confirm', authMiddleware, async (req: AuthRequest, res) => {
  const { orderId, paymentKey, amount } = req.body;

  try {
    const video = await prisma.preweddingVideo.findUnique({ where: { orderId } });
    if (!video) return res.status(404).json({ error: '주문 없음' });
    if (video.userId !== req.user!.id) return res.status(403).json({ error: 'forbidden' });
    if (video.amount !== amount) return res.status(400).json({ error: '금액 불일치' });

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify({ orderId, paymentKey, amount }),
    });

    if (!tossRes.ok) {
      const err = await tossRes.json();
      return res.status(400).json({ error: err.message || '결제 실패' });
    }

    await prisma.preweddingVideo.update({
      where: { orderId },
      data: { paymentKey, paidAt: new Date(), status: 'ANALYZING' },
    });

    processVideoAsync(video.id).catch(err => {
      activeJobs.delete(video.id);
      if (err.message === 'CANCELLED') { console.log('[Pipeline] cancelled:', video.id); return; }
      console.error('Pipeline error:', err);
      prisma.preweddingVideo.update({
        where: { id: video.id },
        data: { status: 'FAILED', errorMsg: err.message },
      });
    });

    res.json({ success: true, videoId: video.id });
  } catch (e: any) {
    console.error('Payment confirm error:', e);
    res.status(500).json({ error: '결제 확인 실패' });
  }
});

router.get('/my', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const videos = await prisma.preweddingVideo.findMany({
      where: { userId: req.user!.id, paidAt: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(videos);
  } catch {
    res.status(500).json({ error: '조회 실패' });
  }
});

router.get('/poll/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const video = await prisma.preweddingVideo.findUnique({ where: { id: req.params.id } });
    if (!video) return res.status(404).json({ error: 'not found' });
    if (video.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' });

    res.json({
      status: video.status,
      outputUrl: video.outputUrl,
      totalDuration: video.totalDuration,
      errorMsg: video.errorMsg,
      scenes: video.scenes,
    });
  } catch {
    res.status(500).json({ error: '조회 실패' });
  }
});

router.get('/admin/list', authMiddleware, adminOnly, async (_req, res) => {
  try {
    const videos = await prisma.preweddingVideo.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true } } },
    });
    res.json(videos);
  } catch {
    res.status(500).json({ error: '조회 실패' });
  }
});

router.post('/admin/free-generate', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { groomName, brideName, weddingDate, metStory, photos, bgmUrl, fontId, venueName, groomFather, groomMother, brideFather, brideMother, mode, selfieConcepts, endingMessage, videoEngine } = req.body;

  const freeMinPhotos = mode === 'selfie' ? 1 : 3;
  if (!groomName || !brideName || !photos?.length || photos.length < freeMinPhotos) {
    return res.status(400).json({ error: mode === 'selfie' ? '이름 + 셀카 1장 이상 필요' : '이름 + 사진 3장 이상 필요' });
  }

  const orderId = `PV-FREE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  try {
    const video = await prisma.preweddingVideo.create({
      data: {
        userId,
        groomName,
        brideName,
        weddingDate: weddingDate || '',
        metStory: metStory || '',
        photos,
        bgmUrl: bgmUrl || null,
        fontId: fontId || 'BMJUA_ttf',
        subtitleStyle: req.body.subtitleStyle || 'poetic',
        mode: mode || 'photo',
        scenes: mode === 'selfie' && selfieConcepts ? selfieConcepts : undefined,
        venueName: req.body.venueName || '',
        groomFather: req.body.groomFather || '',
        groomMother: req.body.groomMother || '',
        brideFather: req.body.brideFather || '',
        brideMother: req.body.brideMother || '',
        endingMessage: req.body.endingMessage || '',
        familyMembers: req.body.familyMembers || '',
        friendsList: req.body.friendsList || '',
        specialThanks: req.body.specialThanks || '',
        creditTextColor: req.body.creditTextColor || '#ffffff',
        amount: 0,
        orderId,
        paymentKey: 'ADMIN_FREE',
        paidAt: new Date(),
        status: 'ANALYZING',
      },
    });

    processVideoAsync(video.id, videoEngine || 'seedance15').catch(err => {
      activeJobs.delete(video.id);
      if (err.message === 'CANCELLED') { console.log('[Pipeline] cancelled:', video.id); return; }
      console.error('Free gen pipeline error:', err);
      prisma.preweddingVideo.update({
        where: { id: video.id },
        data: { status: 'FAILED', errorMsg: err.message },
      });
    });

    res.json({ success: true, videoId: video.id, orderId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/cancel/:id', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const video = await prisma.preweddingVideo.findUnique({ where: { id: req.params.id } });
    if (!video) return res.status(404).json({ error: 'not found' });
    const ctrl = activeJobs.get(req.params.id);
    if (ctrl) { ctrl.abort(); activeJobs.delete(req.params.id); }
    await prisma.preweddingVideo.update({
      where: { id: req.params.id },
      data: { status: 'FAILED', errorMsg: 'Cancelled by admin' },
    });
    res.json({ success: true, aborted: !!ctrl });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/retry/:id', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const video = await prisma.preweddingVideo.findUnique({ where: { id: req.params.id } });
    if (!video) return res.status(404).json({ error: 'not found' });
    if (video.status !== 'FAILED') return res.status(400).json({ error: 'FAILED 상태만 재시도 가능' });
    await prisma.preweddingVideo.update({
      where: { id: req.params.id },
      data: { status: 'ANALYZING', errorMsg: null, outputUrl: null, clipUrls: [], scenes: [], subtitles: [], photoAnalysis: [], totalCost: null, totalDuration: null },
    });
    processVideoAsync(video.id).catch(err => {
      activeJobs.delete(video.id);
      if (err.message === 'CANCELLED') { console.log('[Pipeline] cancelled:', video.id); return; }
      console.error('Retry pipeline error:', err);
      prisma.preweddingVideo.update({
        where: { id: video.id },
        data: { status: 'FAILED', errorMsg: err.message },
      });
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

async function gptRequest(messages: any[], maxTokens = 1000) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_API_KEY },
    body: JSON.stringify({ model: 'gpt-4o', messages, max_tokens: maxTokens }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function analyzePhotos(photoUrls: string[]) {
  const content: any[] = [
    { type: 'text', text: 'Analyze ' + photoUrls.length + ' wedding photos. For each return: type ("solo_male"|"solo_female"|"couple"|"landscape"|"detail"), emotion ("warm"|"calm"|"energetic"|"intimate"|"joyful"), quality (1-10), setting ("indoor"|"outdoor"|"studio"|"nature"|"urban"). Return ONLY JSON array.' },
    ...photoUrls.map(url => ({ type: 'image_url', image_url: { url, detail: 'low' as const } })),
  ];
  const text = await gptRequest([{ role: 'user', content }]);
  try {
    return JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
  } catch {
    return photoUrls.map(() => ({ type: 'couple', emotion: 'warm', quality: 5, setting: 'outdoor' }));
  }
}

async function generateSubtitles(analyses: any[], groomName: string, brideName: string, metStory: string, style: string = 'poetic') {
  const sceneCount = analyses.length;
  const hasHint = metStory && metStory.trim() && metStory.trim() !== 'none';

  const styleExamples: Record<string, string> = {
    poetic: '예시: "어느 봄날 우연히" / "스친 너의 온기가" / "내 모든 계절을" / "바꿔놓았다" / "" / "이름 & 이름"',
    minimal: '예시: "처음" / "설렘" / "확신" / "영원" / "" / "이름 & 이름"',
    narrative: '예시: "그해 봄, 널 처음 만났다" / "어색한 인사 뒤에 숨긴" / "떨리는 마음을 들켰을까" / "그게 사랑인 줄 몰랐다" / "" / "이름 & 이름"',
    cinema: '예시: "THE DAY WE MET" / "모든 것이 달라졌다" / "FALLING" / "멈출 수 없었다" / "" / "FOREVER YOURS"',
  };

  const hintInstruction = hasHint
    ? [
      '',
      '*** 가장 중요 ***',
      '커플이 직접 쓴 힌트: "' + metStory + '"',
      '이 힌트를 반드시 자막의 중심 소재로 사용하세요.',
      '힌트의 키워드나 감성이 자막에 녹아들어야 합니다.',
      '예를 들어 힌트가 "영화관에서 처음 만남"이면 → "스크린 불빛 사이로" / "너를 처음 발견한 그 자리" 처럼 영화 소재를 직접 활용.',
      '예를 들어 힌트가 "제주도 여행"이면 → "그 섬의 바람이" / "우릴 처음 이어주던 날" 처럼.',
      '힌트를 무시하면 실패입니다.',
    ].join('\n')
    : '';

  const prompt = [
    '당신은 웨딩 식전영상 자막 작가입니다.',
    '커플: ' + groomName + ' & ' + brideName,
    '',
    '규칙:',
    '1. 자막 ' + sceneCount + '개를 만드세요',
    '2. 자막을 이어서 읽으면 하나의 문장/러브레터가 되어야 합니다',
    '3. 각 자막은 최대 15자 (한글 기준)',
    '4. 끝에서 두번째 = 빈 문자열 "" (영상이 말하게)',
    '5. 마지막 = "' + groomName + ' & ' + brideName + '"',
    '',
    '스타일: ' + (style === 'minimal' ? '미니멀 (2~4자씩)' : style === 'narrative' ? '내러티브 (일기체)' : style === 'cinema' ? '시네마틱 (한영 혼합)' : '시적 감성'),
    styleExamples[style] || styleExamples.poetic,
    hintInstruction,
    '',
    '*** 절대 하지 말 것 ***',
    '- "빛나는 순간", "설렘과 사랑", "눈빛에 담긴" 같은 뻔한 키워드 나열 금지',
    '- 각 자막이 독립적인 단어/구가 아니라, 이어읽으면 하나의 문장이 되어야 함',
    '- 테스트: 자막을 전부 이어 읽어보세요. "빛나는순간 우연히시작된 우리이야기" ← 이건 문장이 아님. 실패.',
    '- 테스트: "어느봄날우연히 스친너의온기가 내모든계절을 바꿔놓았다" ← 이건 하나의 문장. 성공.',
    '',
    'JSON 배열만 반환: ["자막1", "자막2", ..., "", "' + groomName + ' & ' + brideName + '"]',
  ].join('\n');

  const text = await gptRequest([{ role: 'user', content: prompt }], 500);
  try {
    return JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
  } catch {
    return hasHint
      ? [metStory.slice(0, 15), '그 순간부터', '너와 나의 이야기가', '시작되었다', '', groomName + ' & ' + brideName]
      : ['처음 만난 그 날부터', '함께한 시간이 쌓여', '서로의 온도를 알아갈 때', '그래서, 당신과', '', groomName + ' & ' + brideName];
  }
}

function decideTier(photoType: string, phase: string): 'premium' | 'budget' {
  return 'budget';
}

async function generateKlingClip(photoUrl: string, prompt: string, duration: number) {
  try {
    const result = await fetch('https://queue.fal.run/fal-ai/kling-video/v3/pro/image-to-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Key ' + FAL_API_KEY },
      body: JSON.stringify({
        prompt,
        start_image_url: photoUrl,
        duration: String(duration),
        aspect_ratio: '16:9',
        cfg_scale: 0.5,
        generate_audio: false,
        negative_prompt: 'blur, distort, low quality, morphing, face change, extra person, grain, noise, kissing, licking, tongue, open mouth, erotic, sexual, touching face, lip contact',
      }),
    });
    const text = await result.text();
    let data: any;
    try { data = JSON.parse(text); } catch { console.error('[Kling] submit parse error:', text.slice(0, 200)); return null; }
    console.log('[Kling] submit response keys:', Object.keys(data));
    const requestId = data.request_id;
    const statusUrl = data.status_url;
    const responseUrl = data.response_url;
    if (!requestId) { console.error('[Kling] no request_id:', JSON.stringify(data).slice(0, 300)); return null; }
    console.log('[Kling] request_id:', requestId, 'status_url:', statusUrl);

    const pollUrl = statusUrl || ('https://queue.fal.run/fal-ai/kling-video/v3/pro/image-to-video/requests/' + requestId + '/status');
    const resultUrl = responseUrl || ('https://queue.fal.run/fal-ai/kling-video/v3/pro/image-to-video/requests/' + requestId);

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const poll = await fetch(pollUrl, {
          headers: { 'Authorization': 'Key ' + FAL_API_KEY },
        });
        const pollText = await poll.text();
        let status: any;
        try { status = JSON.parse(pollText); } catch { console.error('[Kling] poll parse error (status ' + poll.status + '):', pollText.slice(0, 200)); continue; }
        console.log('[Kling] poll status:', status.status);
        if (status.status === 'COMPLETED') {
          try {
            const resultRes = await fetch(resultUrl, {
              headers: { 'Authorization': 'Key ' + FAL_API_KEY },
            });
            const resultText = await resultRes.text();
            console.log('[Kling] result data:', resultText.slice(0, 500));
            const resultData = JSON.parse(resultText);
            const videoUrl = resultData?.data?.video?.url || resultData?.video?.url || resultData?.output?.video?.url || null;
            console.log('[Kling] video url:', videoUrl ? 'found' : 'missing');
            return videoUrl;
          } catch (e: any) { console.error('[Kling] result fetch error:', e.message); return null; }
        }
        if (status.status === 'FAILED') { console.error('[Kling] generation failed:', JSON.stringify(status).slice(0, 200)); return null; }
      } catch (pollErr: any) { console.error('[Kling] poll fetch error:', pollErr.message); continue; }
    }
    console.error('[Kling] timeout after 60 polls');
    return null;
  } catch (e: any) { console.error('[Kling] fatal error:', e.message); return null; }
}


async function generatePiAPISeedance2Clip(photoUrl: string, prompt: string, duration: number, model: string = 'seedance-2-fast-preview') {
  if (!PIAPI_KEY) { console.error('[SD2] PIAPI_KEY not set'); return null; }
  try {
    const res = await fetch('https://api.piapi.ai/api/v1/task', {
      method: 'POST',
      headers: { 'X-API-Key': PIAPI_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'seedance',
        task_type: model,
        input: {
          prompt: prompt,
          image_urls: [photoUrl],
          duration,
          aspect_ratio: '16:9',
        },
      }),
    });
    const data = await res.json();
    if (data.code !== 200) { console.error('[SD2] submit failed:', data.message); return null; }
    const taskId = data.data?.task_id;
    if (!taskId) { console.error('[SD2] no task_id'); return null; }
    console.log('[SD2] task submitted:', taskId, 'model:', model);
    for (let i = 0; i < 90; i++) {
      await new Promise(r => setTimeout(r, 10000));
      try {
        const poll = await fetch('https://api.piapi.ai/api/v1/task/' + taskId, { headers: { 'X-API-Key': PIAPI_KEY! } });
        const pollData = await poll.json();
        const status = pollData.data?.status;
        if (i % 3 === 0) console.log('[SD2] poll ' + taskId.slice(0, 8) + ':', status);
        if (status === 'completed') { const videoUrl = pollData.data?.output?.video || null; console.log('[SD2] done:', videoUrl ? 'got url' : 'no url'); return videoUrl; }
        if (status === 'failed') { console.error('[SD2] failed:', pollData.data?.error?.message); return null; }
      } catch (e: any) { console.error('[SD2] poll error:', e.message); continue; }
    }
    console.error('[SD2] timeout after 90 polls');
    return null;
  } catch (e: any) { console.error('[SD2] fatal:', e.message); return null; }
}


async function removePiAPIWatermark(videoUrl: string): Promise<string | null> {
  if (!PIAPI_KEY) return videoUrl;
  try {
    const res = await fetch('https://api.piapi.ai/api/v1/task', {
      method: 'POST',
      headers: { 'X-API-Key': PIAPI_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'seedance', task_type: 'remove-watermark', input: { video_url: videoUrl } }),
    });
    const data = await res.json();
    if (data.code !== 200) { console.error('[WM] submit failed:', data.message); return videoUrl; }
    const taskId = data.data?.task_id;
    if (!taskId) return videoUrl;
    console.log('[WM] removing watermark:', taskId);
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const poll = await fetch('https://api.piapi.ai/api/v1/task/' + taskId, { headers: { 'X-API-Key': PIAPI_KEY! } });
        const pollData = await poll.json();
        if (pollData.data?.status === 'completed') {
          const cleanUrl = pollData.data?.output?.video || null;
          console.log('[WM] done:', cleanUrl ? 'clean' : 'no url');
          return cleanUrl || videoUrl;
        }
        if (pollData.data?.status === 'failed') { console.error('[WM] failed'); return videoUrl; }
      } catch { continue; }
    }
    return videoUrl;
  } catch (e: any) { console.error('[WM] error:', e.message); return videoUrl; }
}

async function generateSeedanceClip(photoUrl: string, prompt: string, duration: number) {
  try {

    const res = await fetch(ARK_BASE + '/contents/generations/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ARK_API_KEY },
      body: JSON.stringify({
        model: 'seedance-1-5-pro-251215',
        content: [
          { type: 'image_url', image_url: { url: photoUrl } },
          { type: 'text', text: prompt + ' --resolution 720p --ratio 16:9 --dur ' + duration + ' --seed -1' },
        ],
      }),
    });
    if (!res.ok) { console.error('[Seedance] submit failed:', res.status); return null; }
    const taskText = await res.text();
    let task: any;
    try { task = JSON.parse(taskText); } catch { console.error('[Seedance] submit parse error:', taskText.slice(0, 200)); return null; }

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const poll = await fetch(ARK_BASE + '/contents/generations/tasks/' + task.id, {
          headers: { 'Authorization': 'Bearer ' + ARK_API_KEY },
        });
        const pollText = await poll.text();
        let data: any;
        try { data = JSON.parse(pollText); } catch { console.error('[Seedance] poll parse error:', pollText.slice(0, 200)); continue; }
        if (data.status === 'succeeded') return data.content?.video_url || null;
        if (data.status === 'failed') { console.error('[Seedance] generation failed'); return null; }
      } catch (pollErr: any) { console.error('[Seedance] poll fetch error:', pollErr.message); continue; }
    }
    return null;
  } catch (e: any) { console.error('[Seedance] fatal error:', e.message); return null; }
}


function buildSD2Prompt(photoType: string, camera: string, phase: string) {
  const scenes: Record<string, string[]> = {
    solo_male: [
      'The man in @image1 walks forward with one hand in pocket, warm golden light, shallow depth of field, dreamy atmosphere',
      'The man in @image1 standing confidently, gentle breeze in hair, soft side lighting, cinematic',
      'The man in @image1 gazes into the distance, dramatic rim lighting, calm expression, slow push-in',
      'The man in @image1 turns toward camera with a warm smile, soft golden backlight, intimate close-up',
      'The man in @image1 leaning casually, arms crossed, soft ambient lighting, slow zoom out',
      'The man in @image1 walking through the scene, looking over shoulder, cinematic tracking, warm tones',
      'The man in @image1 standing still, wind in hair, soft diffused light, gentle slow motion',
    ],
    solo_female: [
      'The woman in @image1 brushes hair behind her ear, warm morning light, soft focus, dreamy',
      'The woman in @image1 walking gracefully, dress flowing in breeze, soft backlight, slow motion',
      'The woman in @image1 turns to camera with a gentle smile, dramatic side lighting, intimate',
      'The woman in @image1 looks down then lifts gaze, soft golden light, shallow depth of field',
      'The woman in @image1 standing in profile, wind in hair, serene expression, rim lighting',
      'The woman in @image1 walking slowly, looking over shoulder elegantly, cinematic dolly shot',
      'The woman in @image1 standing still, gentle breeze, soft diffused light, dreamy atmosphere',
    ],
    couple: [
      'The couple in @image1 walks hand in hand, soft morning light, slow dolly forward, dreamy atmosphere',
      'The couple in @image1 standing close together, foreheads touching, warm golden hour backlight',
      'The couple in @image1 walking arm in arm, looking at each other warmly, cinematic tracking shot',
      'The couple in @image1 embracing gently, soft side lighting, intimate close-up, shallow depth of field',
      'The couple in @image1 standing together looking into distance, warm backlight, slow zoom out',
      'The couple in @image1 turns toward each other and smiles, cherry blossom petals falling, golden light',
      'The couple in @image1 walking forward together toward camera, warm backlight, slow motion',
    ],
  };
  const type = photoType.startsWith('solo_m') ? 'solo_male' : photoType.startsWith('solo_f') ? 'solo_female' : 'couple';
  const list = scenes[type] || scenes.couple;
  const phaseIdx: Record<string, number> = { intro: 0, rising: 1, building: 2, climax: 3, ending: 4 };
  const idx = phaseIdx[phase] || 0;
  return list[idx % list.length];
}


function buildSD15DirectPrompt(photoType: string, camera: string, phase: string, sceneIndex: number = 0) {
  const FACE_GUARD = 'Maintain exact same framing and crop level as input image from first frame to last frame. Camera locked at eye height aimed perfectly horizontal, zero tilt angle, zero vertical movement, no panning up or down. The visible area in frame must not change or expand. Subject stays at identical position and scale throughout entire shot. Face clearly visible at all times, preserve exact original face identity expression hairstyle outfit unchanged. Shallow depth of field.';

  const groomMotions = [
    'Subtle natural breathing, gentle breeze moves hair slightly, warm golden light',
    'Subtle weight shift, soft warm side lighting, natural breathing only',
    'Gentle natural sway, warm ambient light, golden hour tones',
    'Subtle natural blink, soft warm lighting, peaceful atmosphere',
  ];

  const brideMotions = [
    'Hair and veil flowing gently in breeze, soft warm backlight, subtle natural breathing',
    'Subtle natural breathing, dress fabric sways softly in wind, soft golden light',
    'Gentle breeze moves hair and dress, warm soft light, natural breathing',
    'Subtle natural blink, hair strands move in breeze, warm morning light',
  ];

  const coupleMotions = [
    'Subtle natural breathing together, gentle breeze, warm golden hour light',
    'Subtle natural sway together, warm soft backlight, peaceful atmosphere',
  ];

  const type = photoType.startsWith('solo_m') ? 'groom' : photoType.startsWith('solo_f') ? 'bride' : 'couple';
  const list = type === 'groom' ? groomMotions : type === 'bride' ? brideMotions : coupleMotions;
  return FACE_GUARD + ' ' + list[sceneIndex % list.length];
}


function buildPrompt(photoType: string, camera: string, phase: string) {
  const cam: Record<string, string> = {
    zoom_out: 'Extremely subtle slow zoom out. Barely noticeable movement.',
    pan_right: 'Very subtle slow horizontal drift right. Minimal movement.',
    zoom_in: 'Very gentle slow zoom in. Minimal movement. Calm.',
    pan_left: 'Very subtle slow drift left. Minimal movement.',
    static: 'Camera completely still. Almost a photograph. Only subtle natural breathing.',
  };
  const type: Record<string, string> = {
    solo_male: 'Portrait of one man. Solo. Do NOT add any other person.',
    solo_female: 'Portrait of one woman. Solo. Do NOT add any other person.',
    couple: 'The couple standing together. Gentle smile. Calm. No kissing. No licking. No touching face.',
    landscape: 'Scenic environment. Atmospheric.',
    detail: 'Close-up detail. Soft background.',
  };
  return [
    cam[camera] || cam.static,
    type[photoType] || type.couple,
    'Cinematic. Clean sharp image. Shallow depth of field. No grain. No noise.',
    'Natural movement only. No morphing. No face distortion. Preserve original appearance.',
  ].join(' ');
}


async function generateOpeningClip(duration: number = 4) {
  try {

    const res = await fetch(ARK_BASE + '/contents/generations/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ARK_API_KEY },
      body: JSON.stringify({
        model: 'seedance-1-5-pro-251215',
        content: [{ type: 'text', text: 'Extreme slow motion macro cinematography. Delicate white flower petals falling through soft golden backlight, a sheer ivory bridal veil caught in gentle breeze flowing through frame like silk water, shallow depth of field with creamy warm bokeh, petals drifting past translucent fabric creating layered depth, warm golden hour tone, no people no face no text no letters, peaceful elegant atmosphere, shot on Arri Alexa anamorphic lens. --resolution 720p --ratio 16:9 --dur ' + duration + ' --seed -1' }],
      }),
    });
    if (!res.ok) { console.error('[Opening] submit failed:', res.status); return null; }
    const taskText = await res.text();
    let task: any;
    try { task = JSON.parse(taskText); } catch { console.error('[Opening] parse error'); return null; }
    console.log('[Opening] task submitted:', task.id);

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const poll = await fetch(ARK_BASE + '/contents/generations/tasks/' + task.id, {
          headers: { 'Authorization': 'Bearer ' + ARK_API_KEY },
        });
        const pollText = await poll.text();
        let data: any;
        try { data = JSON.parse(pollText); } catch { continue; }
        if (data.status === 'succeeded') { console.log('[Opening] done'); return data.content?.video_url || null; }
        if (data.status === 'failed') { console.error('[Opening] failed'); return null; }
      } catch { continue; }
    }
    return null;
  } catch (e: any) { console.error('[Opening] fatal:', e.message); return null; }
}


async function buildCinematicEnding(tmpDir: string, endingPhotos: string[], creditLines: string[], fontPath: string, endingDur: number, endingOutPath: string, creditTextColor: string = '#ffffff'): Promise<boolean> {
  const { execSync } = await import('child_process');
  const fs = await import('fs');
  const path = await import('path');
  if (endingPhotos.length < 2) return false;
  try {
    const slidePaths: string[] = [];
    for (let i = 0; i < Math.min(3, endingPhotos.length); i++) {
      const dlPath = path.join(tmpDir, 'eslide_dl_' + i + '.jpg');
      const scaledPath = path.join(tmpDir, 'eslide_' + i + '.jpg');
      try {
        console.log('[Ending] downloading photo ' + (i+1) + ':', endingPhotos[i].slice(0, 80));
        execSync('curl -sL -o "' + dlPath + '" "' + endingPhotos[i] + '"', { timeout: 30000 });
        const stat = fs.statSync(dlPath);
        if (stat.size < 1000) { console.log('[Ending] photo ' + (i+1) + ' too small'); continue; }
        await execAsync('ffmpeg -y -i "' + dlPath + '" -vf "scale=440:620:force_original_aspect_ratio=decrease,pad=440:620:(ow-iw)/2:(oh-ih)/2:black" -frames:v 1 -update 1 "' + scaledPath + '"', 15000);
        slidePaths.push(scaledPath);
        console.log('[Ending] photo ' + (i+1) + ' scaled OK');
      } catch (e: any) { console.log('[Ending] photo ' + (i+1) + ' failed:', e.message?.slice(0, 100)); }
    }
    if (slidePaths.length < 2) throw new Error('Only ' + slidePaths.length + ' ending photos');
    const perPhoto = Math.max(4, Math.ceil(endingDur / slidePaths.length) + 1);
    const leftSlide = path.join(tmpDir, 'left_slide.mp4');
    const slideInputs = slidePaths.map(p => '-loop 1 -t ' + perPhoto + ' -i "' + p + '"').join(' ');
    const sf: string[] = [];
    for (let i = 0; i < slidePaths.length; i++) sf.push('[' + i + ':v]fps=25,format=yuv420p[p' + i + ']');
    let cur = '[p0]';
    let off = perPhoto - 1;
    for (let i = 1; i < slidePaths.length; i++) {
      const out = '[x' + i + ']';
      sf.push(cur + '[p' + i + ']xfade=transition=fade:duration=1:offset=' + off + out);
      cur = out;
      off += perPhoto - 1;
    }
    await execAsync('ffmpeg -y -threads 2 ' + slideInputs + ' -filter_complex "' + sf.join(';') + '" -map "' + cur + '" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 18 -an -t ' + endingDur + ' "' + leftSlide + '"', 60000);
    console.log('[Ending] Left slideshow created');
    const creditFile = path.join(tmpDir, 'credits.txt');
    const fs2 = await import('fs');
    fs2.writeFileSync(creditFile, creditLines.join('\n'), 'utf-8');
    const fadeO = (endingDur - 1.5).toFixed(1);
    const crEnd = (endingDur - 1.0).toFixed(1);
    const crFade = (endingDur - 1.7).toFixed(1);
    const totalTextH2 = creditLines.length * 36;
    const spd = Math.max(20, Math.round((920 + totalTextH2) / (endingDur - 2)));
    const compVf = "[0:v][1:v]overlay=40:50,drawtext=fontfile='" + fontPath + "':textfile='" + creditFile + "':fontsize=20:fontcolor=" + creditTextColor + "@0.9:line_spacing=16:x=880-text_w/2:y=h-" + spd + "*t+200:enable='between(t\\,1.0\\," + crEnd + ")':alpha='if(lt(t\\,1.5)\\,(t-1.0)/0.5\\,if(gt(t\\," + crFade + ")\\,(" + crEnd + "-t)/0.7\\,1))',fade=t=in:st=0:d=1.5,fade=t=out:st=" + fadeO + ":d=1.5[vout]";
    await execAsync('ffmpeg -y -threads 2 -f lavfi -i color=c=0x0a0a0a:s=1280x720:d=' + endingDur + ':r=25 -i "' + leftSlide + '" -filter_complex "' + compVf + '" -map "[vout]" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 18 -an -t ' + endingDur + ' "' + endingOutPath + '"', 60000);
    console.log('[Pipeline] Cinematic ending: ' + endingDur + 's, ' + slidePaths.length + ' photos');
    return true;
  } catch (e: any) {
    console.log('[Pipeline] Cinematic ending failed:', e.message?.slice(0, 300));
    return false;
  }
}

function buildEndingCredits(groomName: string, brideName: string, weddingDate: string, venueName: string, gf: string, gm: string, bf: string, bm: string, endingMsg: string = '', familyMembers: string = '', friendsList: string = '', specialThanks: string = ''): string[] {
  const lines: string[] = [];
  lines.push('CAST');
  lines.push('');
  lines.push('\uC2E0\uB791  ' + groomName);
  lines.push('\uC2E0\uBD80  ' + brideName);
  lines.push('');
  if (weddingDate) lines.push(weddingDate);
  if (venueName) lines.push(venueName);
  lines.push('');
  if (gf || gm || bf || bm) {
    lines.push('PARENTS');
    lines.push('\uC6B0\uB9AC\uB97C \uC138\uC0C1\uC5D0 \uC788\uAC8C \uD574\uC900 \uBD84\uB4E4');
    lines.push('');
    if (gf) lines.push(groomName + '\uC758 \uC544\uBC84\uC9C0  ' + gf);
    if (gm) lines.push(groomName + '\uC758 \uC5B4\uBA38\uB2C8  ' + gm);
    if (bf) lines.push(brideName + '\uC758 \uC544\uBC84\uC9C0  ' + bf);
    if (bm) lines.push(brideName + '\uC758 \uC5B4\uBA38\uB2C8  ' + bm);
    lines.push('');
  }
  if (familyMembers && familyMembers.trim()) {
    lines.push('FAMILY');
    lines.push('\uC6B0\uB9AC\uC758 \uC548\uC815\uC801\uC778 \uC6B8\uD0C0\uB9AC');
    lines.push('');
    familyMembers.split('\n').filter(l => l.trim()).forEach(l => lines.push(l.trim()));
    lines.push('');
  }
  if (friendsList && friendsList.trim()) {
    lines.push('FRIENDS');
    lines.push('\uB098\uC758 \uAE30\uC5B5\uC744 \uB098\uB208 \uD2B9\uBCC4\uD55C \uC774\uB4E4');
    lines.push('');
    friendsList.split('\n').filter(l => l.trim()).forEach(l => lines.push(l.trim()));
    lines.push('');
  }
  if (specialThanks && specialThanks.trim()) {
    lines.push('SPECIAL THANKS');
    lines.push('');
    specialThanks.split('\n').filter(l => l.trim()).forEach(l => lines.push(l.trim()));
    lines.push('');
  }
  if (endingMsg) {
    lines.push('');
    lines.push(endingMsg);
    lines.push('');
  }
  lines.push('');
  lines.push('Made by \uCCAD\uCCA9\uC7A5 \uC791\uC5C5\uC2E4');
  return lines;
}
async function processVideoAsync(videoId: string, videoEngine: string = 'seedance15') {
  const abortCtrl = new AbortController();
  const signal = abortCtrl.signal;
  activeJobs.set(videoId, abortCtrl);
  const video = await prisma.preweddingVideo.findUnique({ where: { id: videoId } });
  if (!video) throw new Error('Video not found');

  let photoUrls = video.photos as string[];

  if ((video as any).mode === 'selfie') {
    await prisma.preweddingVideo.update({ where: { id: videoId }, data: { status: 'ANALYZING' } });
    checkAbort(videoId, signal);
    console.log('[Pipeline] Selfie mode: generating glamour photos...');
    const gender = photoUrls.length >= 2 ? 'couple' as const : 'female' as const;
    const savedConcepts = (video.scenes as string[]) || undefined;
    const glamourPhotos = await generateGlamourPhotos(photoUrls, gender, 10, savedConcepts);
    if (glamourPhotos.length < 3) throw new Error('Glamour photo generation failed: only ' + glamourPhotos.length + ' photos');
    photoUrls = glamourPhotos;
    await prisma.preweddingVideo.update({ where: { id: videoId }, data: { photos: glamourPhotos } });
    console.log('[Pipeline] Using glamour photos for ending');
    console.log('[Pipeline] Generated ' + glamourPhotos.length + ' glamour photos (cost ~$' + (glamourPhotos.length * 0.04).toFixed(2) + ')');
  }

  await prisma.preweddingVideo.update({ where: { id: videoId }, data: { status: 'ANALYZING' } });
  const analyses = await analyzePhotos(photoUrls);
  const subtitles = await generateSubtitles(analyses, video.groomName, video.brideName, video.metStory || '', (video as any).subtitleStyle || 'poetic');

  await prisma.preweddingVideo.update({ where: { id: videoId }, data: { photoAnalysis: analyses, subtitles } });



  const template = [
    { phase: 'intro', camera: 'zoom_in', duration: 5 },
    { phase: 'intro', camera: 'pan_right', duration: 5 },
    { phase: 'rising', camera: 'static', duration: 5 },
    { phase: 'rising', camera: 'pan_left', duration: 5 },
    { phase: 'building', camera: 'zoom_in', duration: 4 },
    { phase: 'building', camera: 'pan_right', duration: 4 },
    { phase: 'building', camera: 'static', duration: 4 },
    { phase: 'climax', camera: 'static', duration: 6 },
    { phase: 'climax', camera: 'static', duration: 5 },
    { phase: 'ending', camera: 'static', duration: 5 },
  ];

  const sceneCount = Math.min(10, Math.max(7, photoUrls.length));
  const bestIdx = analyses.reduce((b: number, a: any, i: number) => (a.quality > analyses[b].quality ? i : b), 0);
  const all = analyses.map((a: any, i: number) => ({ ...a, url: photoUrls[i] }));
  const best = all[bestIdx];
  const used = new Set<number>();

  const scenes = template.slice(0, sceneCount).map((t, i) => {
    let photo;
    if (t.phase === 'climax') { photo = best; used.add(bestIdx); }
    else if (t.phase === 'ending') { const ci = all.findIndex((a: any, idx: number) => a.type === 'couple' && !used.has(idx)); photo = ci >= 0 ? all[ci] : best; if (ci >= 0) used.add(ci); }
    else {
      const unused = all.findIndex((_: any, idx: number) => !used.has(idx));
      const pick = unused >= 0 ? unused : i % all.length;
      photo = all[pick];
      used.add(pick);
    }

    const tier = decideTier(photo.type, t.phase);
    return { ...t, photoUrl: photo.url, photoType: photo.type, tier, subtitle: subtitles[i] || '' };
  });

  await prisma.preweddingVideo.update({ where: { id: videoId }, data: { scenes, status: 'GENERATING' } });



  if ((video as any).mode === 'selfie') {
    const uniqueCropUrls = [...new Set(scenes.map((s: any) => s.photoUrl))];
    const cropMap: Record<string, string> = {};
    const CROP_BATCH = 3;
    for (let cb = 0; cb < uniqueCropUrls.length; cb += CROP_BATCH) {
      const batch = uniqueCropUrls.slice(cb, cb + CROP_BATCH);
      const results = await Promise.all(batch.map((url: string) => cropUpperBody(url)));
      batch.forEach((url: string, i: number) => { cropMap[url] = results[i]; });
    }
    scenes.forEach((s: any) => { s.photoUrl = cropMap[s.photoUrl] || s.photoUrl; });
    console.log('[Pipeline] Cropped ' + uniqueCropUrls.length + ' photos to upper body for Seedance');
  }

  let totalCost = (video as any).mode === 'selfie' ? photoUrls.length * 0.04 : 0;
  const clipResults = new Array(scenes.length).fill('');

  const CLIP_BATCH = 3;
  for (let bi = 0; bi < scenes.length; bi += CLIP_BATCH) {
    checkAbort(videoId, signal);
    const batchScenes = scenes.slice(bi, Math.min(bi + CLIP_BATCH, scenes.length));
    const batchPromises = batchScenes.map((scene, bsi) => {
      const si = bi + bsi;
      let gen: Promise<string | null>;
      let engineLabel = 'SD1.5';

      if (videoEngine === 'kling') {
        const prompt = buildPrompt(scene.photoType, scene.camera, scene.phase);
        gen = generateKlingClip(scene.photoUrl, prompt, scene.duration);
        totalCost += 0.55;
        engineLabel = 'Kling';
      } else if (videoEngine === 'seedance2') {
        const sd2prompt = buildSD2Prompt(scene.photoType, scene.camera, scene.phase);
        gen = generatePiAPISeedance2Clip(scene.photoUrl, sd2prompt, scene.duration, 'seedance-2-preview').then(url => url ? removePiAPIWatermark(url) : null);
        totalCost += 0.75;
        engineLabel = 'SD2.0';
      } else if (videoEngine === 'seedance2-fast') {
        const sd2prompt = buildSD2Prompt(scene.photoType, scene.camera, scene.phase);
        gen = generatePiAPISeedance2Clip(scene.photoUrl, sd2prompt, scene.duration, 'seedance-2-fast-preview').then(url => url ? removePiAPIWatermark(url) : null);
        totalCost += 0.40;
        engineLabel = 'SD2.0-fast';
      } else {
        const sd15prompt = buildSD15DirectPrompt(scene.photoType, scene.camera, scene.phase, si);
        gen = generateSeedanceClip(scene.photoUrl, sd15prompt, scene.duration);
        totalCost += 0.005;
        engineLabel = 'SD1.5';
      }

      return gen.then(url => {
        clipResults[si] = url || '';
        console.log('[Pipeline] clip ' + (si + 1) + '/' + scenes.length + (url ? ' OK (' + engineLabel + ')' : ' FAILED'));
        return prisma.preweddingVideo.update({
          where: { id: videoId },
          data: { clipUrls: [...clipResults] },
        });
      }).catch(e => {
        console.error('[Pipeline] clip ' + (si + 1) + ' error:', (e as any).message);
      });
    });
    await Promise.all(batchPromises);
    console.log('[Pipeline] clip batch ' + (Math.floor(bi / CLIP_BATCH) + 1) + '/' + Math.ceil(scenes.length / CLIP_BATCH) + ' done');
  }
  const clipUrls = clipResults;

  const validClips = clipUrls.filter(Boolean);
  if (validClips.length < 3) {
    await prisma.preweddingVideo.update({
      where: { id: videoId },
      data: { status: 'FAILED', errorMsg: 'Only ' + validClips.length + ' clips succeeded' },
    });
    return;
  }


  checkAbort(videoId, signal);

  await prisma.preweddingVideo.update({
    where: { id: videoId },
    data: { clipUrls, status: 'ASSEMBLING', totalCost },
  });

  const tmpDir = '/tmp/pv-' + videoId;
  const { execSync } = await import('child_process');
  const fs = await import('fs');
  const path = await import('path');

  fs.mkdirSync(tmpDir, { recursive: true });

  const clipPaths: string[] = [];
  const validScenes: typeof scenes = [];
  for (let i = 0; i < clipUrls.length; i++) {
    if (!clipUrls[i]) continue;
    const clipPath = path.join(tmpDir, 'clip_' + i + '.mp4');
    try {
      execSync('curl -sL -o "' + clipPath + '" "' + clipUrls[i] + '"', { timeout: 120000 });
      clipPaths.push(clipPath);
      validScenes.push(scenes[i]);
    } catch {}
  }

  if (clipPaths.length < 3) {
    await prisma.preweddingVideo.update({
      where: { id: videoId },
      data: { status: 'FAILED', errorMsg: 'Not enough clips downloaded' },
    });
    return;
  }

  let bgmPath = '';
  if (video.bgmUrl) {
    bgmPath = path.join(tmpDir, 'bgm.mp3');
    try { execSync('curl -sL -o "' + bgmPath + '" "' + video.bgmUrl + '"', { timeout: 60000 }); } catch { bgmPath = ''; }
  }

  const fontPath = getFontPath(video.fontId || 'BMJUA_ttf');

  // === STEP A: Build opening.mp4 (intro_raw + names overlay) ===
  const openingOut = path.join(tmpDir, 'opening_final.mp4');
  const introSrc = '/app/assets/intro_raw.mp4';
  const nameFont = '/app/fonts/ChosunNm.ttf';
  const ampFont = '/app/fonts/GreatVibes-Regular.ttf';
  const gName = escapeDrawtext(video.groomName);
  const bName = escapeDrawtext(video.brideName);
  const wDate = escapeDrawtext(video.weddingDate || '');
  try {
    const dtGroom = ",drawtext=fontfile='" + nameFont + "':text='" + gName + "':fontsize=38:fontcolor=white@0.95:x=(w-text_w)/2:y=(h/2)-50:enable='between(t\\,0.5\\,4.5)':alpha='if(lt(t\\,1.0)\\,(t-0.5)/0.5\\,if(gt(t\\,3.8)\\,(4.5-t)/0.7\\,1))'";
    const dtAmp = ",drawtext=fontfile='" + ampFont + "':text='&':fontsize=30:fontcolor=white@0.7:x=(w-text_w)/2:y=(h/2)-5:enable='between(t\\,1.0\\,4.5)':alpha='if(lt(t\\,1.5)\\,(t-1.0)/0.5\\,if(gt(t\\,3.8)\\,(4.5-t)/0.7\\,1))'";
    const dtBride = ",drawtext=fontfile='" + nameFont + "':text='" + bName + "':fontsize=38:fontcolor=white@0.95:x=(w-text_w)/2:y=(h/2)+35:enable='between(t\\,1.3\\,4.5)':alpha='if(lt(t\\,1.8)\\,(t-1.3)/0.5\\,if(gt(t\\,3.8)\\,(4.5-t)/0.7\\,1))'";
    const dtDate = wDate ? ",drawtext=fontfile='" + nameFont + "':text='" + wDate + "':fontsize=20:fontcolor=white@0.7:x=(w-text_w)/2:y=(h/2)+85:enable='between(t\\,1.8\\,4.5)':alpha='if(lt(t\\,2.3)\\,(t-1.8)/0.5\\,if(gt(t\\,3.8)\\,(4.5-t)/0.7\\,1))'" : '';
    const introVf = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=24" + dtGroom + dtAmp + dtBride + dtDate + ",fade=t=in:st=0:d=1.0,fade=t=out:st=4.0:d=1.0";
    await execAsync('ffmpeg -y -threads 2 -i "' + introSrc + '" -vf "' + introVf + '" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 18 -an -t 5 "' + openingOut + '"', 120000);
    console.log('[Pipeline] Cinematic intro with names created');
  } catch (e: any) {
    console.error('[Pipeline] Intro overlay failed:', e.message?.slice(0, 200));
    try {
      await execAsync("ffmpeg -y -threads 2 -f lavfi -i color=c=black:s=1280x720:d=5:r=24 -vf \"drawtext=fontfile='" + nameFont + "':text='" + gName + " & " + bName + "':fontsize=36:fontcolor=white@0.95:x=(w-text_w)/2:y=(h/2):enable='between(t,0.5,4.0)':alpha='if(lt(t,1.0),(t-0.5)/0.5,if(gt(t,3.5),(4.0-t)/0.5,1))',fade=t=in:st=0:d=1,fade=t=out:st=3.5:d=1.5\" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -an -t 5 \"" + openingOut + "\"", 30000);
      console.log('[Pipeline] Black intro fallback');
    } catch { console.error('[Pipeline] Intro fallback failed'); }
  }

  // === STEP B: Build main.mp4 ===
  const filters: string[] = [];
  const n = clipPaths.length;
  for (let i = 0; i < n; i++) {
    filters.push('[' + i + ':v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=24[v' + i + ']');
  }
  let currentStream = '[v0]';
  let runningOffset = validScenes[0].duration;
  for (let i = 1; i < n; i++) {
    const offset = (runningOffset - 0.8).toFixed(1);
    const out = '[xf' + i + ']';
    filters.push(currentStream + '[v' + i + ']xfade=transition=fade:duration=0.8:offset=' + offset + out);
    currentStream = out;
    runningOffset = parseFloat(offset) + validScenes[i].duration;
  }
  const mainDuration = runningOffset;

  const subtitleTimings: { text: string; start: number; end: number }[] = [];
  let sceneOffset = 0;
  for (let i = 0; i < validScenes.length; i++) {
    const text = validScenes[i].subtitle;
    if (text && text.trim()) {
      subtitleTimings.push({ text: text.trim(), start: sceneOffset + 0.5, end: sceneOffset + validScenes[i].duration - 0.5 });
    }
    sceneOffset += validScenes[i].duration - (i < validScenes.length - 1 ? 0.8 : 0);
  }

  if (subtitleTimings.length > 0) {
    let subStream = currentStream;
    subtitleTimings.forEach((st, i) => {
      const isLast = i === subtitleTimings.length - 1;
      const outLabel = isLast ? '[subtitled]' : '[sub' + i + ']';
      const escaped = escapeDrawtext(st.text);
      const fi0 = st.start; const fi1 = st.start + 0.6; const fo0 = st.end - 0.6; const fo1 = st.end;
      filters.push(subStream + "drawtext=fontfile='" + fontPath + "':text='" + escaped + "':fontsize=30:fontcolor=white:shadowx=2:shadowy=2:shadowcolor=black@0.6:x=(w-text_w)/2:y=h-60:enable='between(t\\," + fi0.toFixed(2) + "\\," + fo1.toFixed(2) + ")':alpha='if(lt(t\\," + fi1.toFixed(2) + ")\\,(t-" + fi0.toFixed(2) + ")/0.6\\,if(gt(t\\," + fo0.toFixed(2) + ")\\,(" + fo1.toFixed(2) + "-t)/0.6\\,1))'" + outLabel);
      subStream = outLabel;
    });
    filters.push('[subtitled]fade=t=in:st=0:d=1,fade=t=out:st=' + (mainDuration - 1).toFixed(1) + ':d=1[vfinal]');
  } else {
    filters.push(currentStream + 'fade=t=in:st=0:d=1,fade=t=out:st=' + (mainDuration - 1).toFixed(1) + ':d=1[vfinal]');
  }

  const mainOut = path.join(tmpDir, 'main.mp4');
  const mainCmd = ['ffmpeg -y -threads 2', ...clipPaths.map(p => '-i "' + p + '"'), '-filter_complex "' + filters.join(';') + '"', '-map "[vfinal]"', '-c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 18 -an', '-movflags +faststart -t ' + mainDuration.toFixed(1), '"' + mainOut + '"'].join(' ');
  console.log('[FFmpeg main cmd]', mainCmd.slice(0, 500));
  try {
    await execAsync(mainCmd, 300000);
    console.log('[Pipeline] Main video created');
  } catch (e: any) {
    const stderr = e.stderr ? e.stderr.toString().slice(-500) : 'no stderr';
    console.error('[FFmpeg main stderr]', stderr);
    await prisma.preweddingVideo.update({ where: { id: videoId }, data: { status: 'FAILED', errorMsg: 'FFmpeg main: ' + stderr.slice(0, 500) } });
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

    // === STEP C: Build ending.mp4 (cinematic photo slide + credits) ===
  const endingOut = path.join(tmpDir, 'ending_final.mp4');
  const v = video as any;
  const creditLines = buildEndingCredits(video.groomName, video.brideName, video.weddingDate || '', v.venueName || '', v.groomFather || '', v.groomMother || '', v.brideFather || '', v.brideMother || '', v.endingMessage || '', v.familyMembers || '', v.friendsList || '', v.specialThanks || '');
  const allEndPhotos = (photoUrls || (video.photos as string[])).filter(Boolean);
  const endingPhotos: string[] = [];
  if (allEndPhotos.length >= 9) { endingPhotos.push(allEndPhotos[0], allEndPhotos[4], allEndPhotos[8]); }
  else if (allEndPhotos.length >= 4) { endingPhotos.push(allEndPhotos[0], allEndPhotos[Math.floor(allEndPhotos.length / 2)], allEndPhotos[allEndPhotos.length - 1]); }
  else { endingPhotos.push(...allEndPhotos.slice(0, 3)); }
  const totalTextH = creditLines.length * 36;
  const endingDur = Math.max(12, Math.round((920 + totalTextH) / 35 + 2));
  let endingCreated = await buildCinematicEnding(tmpDir, endingPhotos, creditLines, fontPath, endingDur, endingOut, v.creditTextColor || '#ffffff');

  if (!endingCreated) {
    try {
      const creditEscS = escapeDrawtext(creditLines.join('\\n'));
      const fadeOS = (endingDur - 1.5).toFixed(1);
      const crEndS = (endingDur - 1.0).toFixed(1);
      const crFadeS = (endingDur - 1.7).toFixed(1);
      const spdS = Math.max(50, Math.round(creditLines.length * 20 / endingDur + 40));
      await execAsync("ffmpeg -y -threads 2 -f lavfi -i color=c=0x0a0a0a:s=1280x720:d=" + endingDur + ":r=24 -vf \"drawtext=fontfile='" + fontPath + "':text='" + creditEscS + "':fontsize=22:fontcolor=white@0.9:x=(w-text_w)/2:y=h-" + spdS + "*t+200:enable='between(t\\," + '0.5' + "\\," + crEndS + ")':alpha='if(lt(t\\,1.2)\\,(t-0.5)/0.7\\,if(gt(t\\," + crFadeS + ")\\,(" + crEndS + "-t)/0.7\\,1))',fade=t=in:st=0:d=1.5,fade=t=out:st=" + fadeOS + ":d=1.5\" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -an -t " + endingDur + " \"" + endingOut + "\"", 60000);
      console.log('[Pipeline] Simple ending fallback');
    } catch (e: any) {
      console.error('[Pipeline] Ending failed:', e.message?.slice(0, 200));
    }
  }


// === STEP D: Concat ===
  const concatParts: string[] = [];
  if (fs.existsSync(openingOut)) concatParts.push(openingOut);
  concatParts.push(mainOut);
  if (fs.existsSync(endingOut)) concatParts.push(endingOut);

  const concatList = path.join(tmpDir, 'concat.txt');
  fs.writeFileSync(concatList, concatParts.map(p => "file '" + p + "'").join('\n'));

  const hasAudio = bgmPath && fs.existsSync(bgmPath);
  const totalDuration = (fs.existsSync(openingOut) ? 5 : 0) + mainDuration + (fs.existsSync(endingOut) ? endingDur : 0);
  const outputPath = path.join(tmpDir, 'output.mp4');

  let concatCmd: string;
  if (hasAudio) {
    concatCmd = 'ffmpeg -y -threads 2 -f concat -safe 0 -i "' + concatList + '" -i "' + bgmPath + '" -filter_complex "[1:a]volume=0.35,afade=t=in:st=0:d=3,afade=t=out:st=' + (totalDuration - 4).toFixed(1) + ':d=4[afinal]" -map 0:v -map "[afinal]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "' + outputPath + '"';
  } else {
    concatCmd = 'ffmpeg -y -threads 2 -f concat -safe 0 -i "' + concatList + '" -c copy -movflags +faststart "' + outputPath + '"';
  }
  console.log('[FFmpeg concat cmd]', concatCmd.slice(0, 300));

  try {
    await execAsync(concatCmd, 300000);
    console.log('[Pipeline] Final concat done');
  } catch (e: any) {
    const stderrC = e.stderr ? e.stderr.toString().slice(-500) : 'no stderr';
    console.error('[FFmpeg concat stderr]', stderrC);
    await prisma.preweddingVideo.update({ where: { id: videoId }, data: { status: 'FAILED', errorMsg: 'FFmpeg concat: ' + stderrC.slice(0, 500) } });
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

  let outputUrl = '';
  try {
    const { uploadVideoToR2 } = await import('../utils/r2.js');
    const r2Result = await uploadVideoToR2(outputPath, 'prewedding-video', videoId);
    outputUrl = r2Result.url;
    console.log('[Pipeline] R2 upload done:', outputUrl);
  } catch (uploadErr: any) {
    console.error('[Pipeline] R2 upload error:', uploadErr.message);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });

  activeJobs.delete(videoId);
  await prisma.preweddingVideo.update({
    where: { id: videoId },
    data: { status: outputUrl ? 'DONE' : 'FAILED', outputUrl: outputUrl || null, totalDuration, errorMsg: outputUrl ? null : 'Upload failed' },
  });
}


router.post('/create-with-gift', authMiddleware, async (req: any, res) => {
  const userId = req.user.id;
  const { groomName, brideName, weddingDate, metStory, photos, bgmId, bgmUrl, fontId, subtitleStyle, giftCode, venueName, groomFather, groomMother, brideFather, brideMother, endingMessage, mode, familyMembers, friendsList, specialThanks, creditTextColor } = req.body;

  const freeMinPhotos = mode === 'selfie' ? 1 : 3;
  if (!groomName || !brideName || !photos?.length || photos.length < freeMinPhotos) {
    return res.status(400).json({ error: mode === 'selfie' ? '이름 + 셀카 1장 이상 필요' : '이름 + 사진 3장 이상 필요' });
  }
  if (!giftCode) return res.status(400).json({ error: 'gift code required' });

  try {
    const gift = await prisma.videoGift.findUnique({ where: { code: giftCode } });
    if (!gift) return res.status(404).json({ error: '유효하지 않은 선물 코드' });
    if (gift.isRedeemed) return res.status(400).json({ error: '이미 사용된 코드' });
    if (new Date() > gift.expiresAt) return res.status(400).json({ error: '만료된 코드' });

    const orderId = 'PV-GIFT-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

    const video = await prisma.preweddingVideo.create({
      data: {
        userId,
        groomName,
        brideName,
        weddingDate: weddingDate || '',
        metStory: metStory || '',
        photos,
        bgmId: bgmId || null,
        bgmUrl: bgmUrl || null,
        fontId: fontId || 'BMJUA_ttf',
        subtitleStyle: subtitleStyle || 'poetic',
        venueName: venueName || '',
        groomFather: groomFather || '',
        groomMother: groomMother || '',
        brideFather: brideFather || '',
        brideMother: brideMother || '',
        endingMessage: endingMessage || '',
        familyMembers: familyMembers || '',
        friendsList: friendsList || '',
        specialThanks: specialThanks || '',
        creditTextColor: creditTextColor || '#ffffff',
        amount: 0,
        orderId,
        paymentKey: 'GIFT_' + giftCode,
        paidAt: new Date(),
        status: 'ANALYZING',
      },
    });

    await prisma.videoGift.update({
      where: { code: giftCode },
      data: { isRedeemed: true, redeemedAt: new Date(), toUserId: userId },
    });

    processVideoAsync(video.id).catch(err => {
      console.error('Gift pipeline error:', err);
      prisma.preweddingVideo.update({
        where: { id: video.id },
        data: { status: 'FAILED', errorMsg: err.message },
      });
    });

    res.json({ success: true, videoId: video.id });
  } catch (e: any) {
    console.error('Gift create error:', e);
    res.status(500).json({ error: e.message });
  }
});


router.post('/admin/resume/:id', authMiddleware, async (req: any, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' });

  try {
    const video = await prisma.preweddingVideo.findUnique({ where: { id: req.params.id } });
    if (!video) return res.status(404).json({ error: 'not found' });

    const clipUrls = video.clipUrls as string[] | null;
    const scenes = video.scenes as any[] | null;
    if (!clipUrls || !scenes || clipUrls.filter(Boolean).length < 3) {
      return res.status(400).json({ error: 'No saved clips to resume' });
    }

    await prisma.preweddingVideo.update({
      where: { id: req.params.id },
      data: { status: 'ASSEMBLING', errorMsg: null, outputUrl: null },
    });

    assembleOnly(video.id).catch(err => {
      console.error('Resume pipeline error:', err);
      prisma.preweddingVideo.update({
        where: { id: video.id },
        data: { status: 'FAILED', errorMsg: err.message },
      });
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

async function assembleOnly(videoId: string) {
  const video = await prisma.preweddingVideo.findUnique({ where: { id: videoId } });
  if (!video) throw new Error('Video not found');

  const clipUrls = video.clipUrls as string[];
  const scenes = video.scenes as any[];

  const tmpDir = '/tmp/pv-' + videoId;
  const { execSync } = await import('child_process');
  const fs = await import('fs');
  const path = await import('path');

  fs.mkdirSync(tmpDir, { recursive: true });

  const clipPaths: string[] = [];
  const validScenes: typeof scenes = [];
  for (let i = 0; i < clipUrls.length; i++) {
    if (!clipUrls[i]) continue;
    const clipPath = path.join(tmpDir, 'clip_' + i + '.mp4');
    try {
      execSync('curl -sL -o "' + clipPath + '" "' + clipUrls[i] + '"', { timeout: 120000 });
      clipPaths.push(clipPath);
      validScenes.push(scenes[i]);
    } catch {}
  }

  if (clipPaths.length < 3) {
    await prisma.preweddingVideo.update({
      where: { id: videoId },
      data: { status: 'FAILED', errorMsg: 'Not enough clips downloaded' },
    });
    return;
  }

  let bgmPath = '';
  if (video.bgmUrl) {
    bgmPath = path.join(tmpDir, 'bgm.mp3');
    try { execSync('curl -sL -o "' + bgmPath + '" "' + video.bgmUrl + '"', { timeout: 60000 }); } catch { bgmPath = ''; }
  }

  const fontPath = getFontPath(video.fontId || 'BMJUA_ttf');

  // === STEP A: Build opening.mp4 (intro_raw + names overlay) ===
  const openingOut = path.join(tmpDir, 'opening_final.mp4');
  const introSrc = '/app/assets/intro_raw.mp4';
  const nameFont = '/app/fonts/ChosunNm.ttf';
  const ampFont = '/app/fonts/GreatVibes-Regular.ttf';
  const gName = escapeDrawtext(video.groomName);
  const bName = escapeDrawtext(video.brideName);
  const wDate = escapeDrawtext(video.weddingDate || '');
  try {
    const dtGroom = ",drawtext=fontfile='" + nameFont + "':text='" + gName + "':fontsize=38:fontcolor=white@0.95:x=(w-text_w)/2:y=(h/2)-50:enable='between(t\\,0.5\\,4.5)':alpha='if(lt(t\\,1.0)\\,(t-0.5)/0.5\\,if(gt(t\\,3.8)\\,(4.5-t)/0.7\\,1))'";
    const dtAmp = ",drawtext=fontfile='" + ampFont + "':text='&':fontsize=30:fontcolor=white@0.7:x=(w-text_w)/2:y=(h/2)-5:enable='between(t\\,1.0\\,4.5)':alpha='if(lt(t\\,1.5)\\,(t-1.0)/0.5\\,if(gt(t\\,3.8)\\,(4.5-t)/0.7\\,1))'";
    const dtBride = ",drawtext=fontfile='" + nameFont + "':text='" + bName + "':fontsize=38:fontcolor=white@0.95:x=(w-text_w)/2:y=(h/2)+35:enable='between(t\\,1.3\\,4.5)':alpha='if(lt(t\\,1.8)\\,(t-1.3)/0.5\\,if(gt(t\\,3.8)\\,(4.5-t)/0.7\\,1))'";
    const dtDate = wDate ? ",drawtext=fontfile='" + nameFont + "':text='" + wDate + "':fontsize=20:fontcolor=white@0.7:x=(w-text_w)/2:y=(h/2)+85:enable='between(t\\,1.8\\,4.5)':alpha='if(lt(t\\,2.3)\\,(t-1.8)/0.5\\,if(gt(t\\,3.8)\\,(4.5-t)/0.7\\,1))'" : '';
    const introVf = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=24" + dtGroom + dtAmp + dtBride + dtDate + ",fade=t=in:st=0:d=1.0,fade=t=out:st=4.0:d=1.0";
    await execAsync('ffmpeg -y -threads 2 -i "' + introSrc + '" -vf "' + introVf + '" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 18 -an -t 5 "' + openingOut + '"', 120000);
    console.log('[Pipeline] Cinematic intro with names created');
  } catch (e: any) {
    console.error('[Pipeline] Intro overlay failed:', e.message?.slice(0, 200));
    try {
      await execAsync("ffmpeg -y -threads 2 -f lavfi -i color=c=black:s=1280x720:d=5:r=24 -vf \"drawtext=fontfile='" + nameFont + "':text='" + gName + " & " + bName + "':fontsize=36:fontcolor=white@0.95:x=(w-text_w)/2:y=(h/2):enable='between(t,0.5,4.0)':alpha='if(lt(t,1.0),(t-0.5)/0.5,if(gt(t,3.5),(4.0-t)/0.5,1))',fade=t=in:st=0:d=1,fade=t=out:st=3.5:d=1.5\" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -an -t 5 \"" + openingOut + "\"", 30000);
      console.log('[Pipeline] Black intro fallback');
    } catch { console.error('[Pipeline] Intro fallback failed'); }
  }

  // === STEP B: Build main.mp4 (existing clips) ===
  const filters: string[] = [];
  const n = clipPaths.length;

  for (let i = 0; i < n; i++) {
    filters.push('[' + i + ':v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=24[v' + i + ']');
  }

  let currentStream = '[v0]';
  let runningOffset = validScenes[0].duration;

  for (let i = 1; i < n; i++) {
    const offset = (runningOffset - 0.8).toFixed(1);
    const out = '[xf' + i + ']';
    filters.push(currentStream + '[v' + i + ']xfade=transition=fade:duration=0.8:offset=' + offset + out);
    currentStream = out;
    runningOffset = parseFloat(offset) + validScenes[i].duration;
  }

  const mainDuration = runningOffset;

  const subtitleTimings: { text: string; start: number; end: number }[] = [];
  let sceneOffset = 0;
  for (let i = 0; i < validScenes.length; i++) {
    const text = validScenes[i].subtitle;
    if (text && text.trim()) {
      subtitleTimings.push({
        text: text.trim(),
        start: sceneOffset + 0.5,
        end: sceneOffset + validScenes[i].duration - 0.5,
      });
    }
    sceneOffset += validScenes[i].duration - (i < validScenes.length - 1 ? 0.8 : 0);
  }

  if (subtitleTimings.length > 0) {
    let subStream = currentStream;
    subtitleTimings.forEach((st, i) => {
      const isLast = i === subtitleTimings.length - 1;
      const outLabel = isLast ? '[subtitled]' : '[sub' + i + ']';
      const escaped = escapeDrawtext(st.text);
      const fadeInStart = st.start;
      const fadeInEnd = st.start + 0.6;
      const fadeOutStart = st.end - 0.6;
      const fadeOutEnd = st.end;
      filters.push(
        subStream + "drawtext=fontfile='" + fontPath + "':text='" + escaped + "':fontsize=30:fontcolor=white:shadowx=2:shadowy=2:shadowcolor=black@0.6:x=(w-text_w)/2:y=h-60:enable='between(t\\," + fadeInStart.toFixed(2) + "\\," + fadeOutEnd.toFixed(2) + ")':alpha='if(lt(t\\," + fadeInEnd.toFixed(2) + ")\\,(t-" + fadeInStart.toFixed(2) + ")/0.6\\,if(gt(t\\," + fadeOutStart.toFixed(2) + ")\\,(" + fadeOutEnd.toFixed(2) + "-t)/0.6\\,1))'" + outLabel
      );
      subStream = outLabel;
    });
    filters.push('[subtitled]fade=t=in:st=0:d=1,fade=t=out:st=' + (mainDuration - 1).toFixed(1) + ':d=1[vfinal]');
  } else {
    filters.push(currentStream + 'fade=t=in:st=0:d=1,fade=t=out:st=' + (mainDuration - 1).toFixed(1) + ':d=1[vfinal]');
  }

  const mainOut = path.join(tmpDir, 'main.mp4');
  const mainInputs = clipPaths.map(p => '-i "' + p + '"');
  const mainCmd = [
    'ffmpeg -y -threads 2',
    ...mainInputs,
    '-filter_complex "' + filters.join(';') + '"',
    '-map "[vfinal]"',
    '-c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 18 -an',
    '-movflags +faststart',
    '-t ' + mainDuration.toFixed(1),
    '"' + mainOut + '"',
  ].join(' ');

  console.log('[FFmpeg main cmd]', mainCmd.slice(0, 500));

  try {
    await execAsync(mainCmd, 300000);
    console.log('[Pipeline] Main video created');
  } catch (e: any) {
    await prisma.preweddingVideo.update({
      where: { id: videoId },
      data: { status: 'FAILED', errorMsg: 'FFmpeg main failed: ' + e.message?.slice(0, 300) },
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

    // === STEP C: Build ending.mp4 (cinematic photo slide + credits) ===
  const endingOut = path.join(tmpDir, 'ending_final.mp4');
  const v = video as any;
  const creditLines = buildEndingCredits(video.groomName, video.brideName, video.weddingDate || '', v.venueName || '', v.groomFather || '', v.groomMother || '', v.brideFather || '', v.brideMother || '', v.endingMessage || '', v.familyMembers || '', v.friendsList || '', v.specialThanks || '');
  const allEndPhotos = (video.photos as string[]).filter(Boolean);
  const endingPhotos: string[] = [];
  if (allEndPhotos.length >= 9) { endingPhotos.push(allEndPhotos[0], allEndPhotos[4], allEndPhotos[8]); }
  else if (allEndPhotos.length >= 4) { endingPhotos.push(allEndPhotos[0], allEndPhotos[Math.floor(allEndPhotos.length / 2)], allEndPhotos[allEndPhotos.length - 1]); }
  else { endingPhotos.push(...allEndPhotos.slice(0, 3)); }
  const totalTextH = creditLines.length * 36;
  const endingDur = Math.max(12, Math.round((920 + totalTextH) / 35 + 2));
  let endingCreated = await buildCinematicEnding(tmpDir, endingPhotos, creditLines, fontPath, endingDur, endingOut, v.creditTextColor || '#ffffff');

  if (!endingCreated) {
    try {
      const creditEscS = escapeDrawtext(creditLines.join('\\n'));
      const fadeOS = (endingDur - 1.5).toFixed(1);
      const crEndS = (endingDur - 1.0).toFixed(1);
      const crFadeS = (endingDur - 1.7).toFixed(1);
      const spdS = Math.max(50, Math.round(creditLines.length * 20 / endingDur + 40));
      await execAsync("ffmpeg -y -threads 2 -f lavfi -i color=c=0x0a0a0a:s=1280x720:d=" + endingDur + ":r=24 -vf \"drawtext=fontfile='" + fontPath + "':text='" + creditEscS + "':fontsize=22:fontcolor=white@0.9:x=(w-text_w)/2:y=h-" + spdS + "*t+200:enable='between(t\\," + '0.5' + "\\," + crEndS + ")':alpha='if(lt(t\\,1.2)\\,(t-0.5)/0.7\\,if(gt(t\\," + crFadeS + ")\\,(" + crEndS + "-t)/0.7\\,1))',fade=t=in:st=0:d=1.5,fade=t=out:st=" + fadeOS + ":d=1.5\" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -an -t " + endingDur + " \"" + endingOut + "\"", 60000);
      console.log('[Pipeline] Simple ending fallback');
    } catch (e: any) {
      console.error('[Pipeline] Ending failed:', e.message?.slice(0, 200));
    }
  }


// === STEP D: Concat opening + main + ending ===
  const concatParts: string[] = [];
  if (fs.existsSync(openingOut)) concatParts.push(openingOut);
  concatParts.push(mainOut);
  if (fs.existsSync(endingOut)) concatParts.push(endingOut);

  const concatList = path.join(tmpDir, 'concat.txt');
  fs.writeFileSync(concatList, concatParts.map(p => "file '" + p + "'").join('\n'));

  const hasAudio = bgmPath && fs.existsSync(bgmPath);
  const totalDuration = 5 + mainDuration + endingDur;
  const outputPath = path.join(tmpDir, 'output.mp4');

  let concatCmd: string;
  if (hasAudio) {
    concatCmd = 'ffmpeg -y -threads 2 -f concat -safe 0 -i "' + concatList + '" -i "' + bgmPath + '" -filter_complex "[1:a]volume=0.35,afade=t=in:st=0:d=3,afade=t=out:st=' + (totalDuration - 4).toFixed(1) + ':d=4[afinal]" -map 0:v -map "[afinal]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "' + outputPath + '"';
  } else {
    concatCmd = 'ffmpeg -y -threads 2 -f concat -safe 0 -i "' + concatList + '" -c copy -movflags +faststart "' + outputPath + '"';
  }

  console.log('[FFmpeg concat cmd]', concatCmd.slice(0, 300));

  const cmd = concatCmd;

  console.log('[FFmpeg resume cmd]', cmd.slice(0, 500));

  try {
    await execAsync(cmd, 300000);
  } catch (e: any) {
    await prisma.preweddingVideo.update({
      where: { id: videoId },
      data: { status: 'FAILED', errorMsg: 'FFmpeg resume failed: ' + e.message?.slice(0, 300) },
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

  let outputUrl = '';
  try {
    const { uploadVideoToR2 } = await import('../utils/r2.js');
    const r2Result = await uploadVideoToR2(outputPath, 'prewedding-video', videoId);
    outputUrl = r2Result.url;
    console.log('[Pipeline] R2 upload done:', outputUrl);
  } catch (uploadErr: any) {
    console.error('[Pipeline] R2 upload error:', uploadErr.message);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });

  await prisma.preweddingVideo.update({
    where: { id: videoId },
    data: {
      status: outputUrl ? 'DONE' : 'FAILED',
      outputUrl: outputUrl || null,
      totalDuration,
      errorMsg: outputUrl ? null : 'Upload failed',
    },
  });
}

export default router;
