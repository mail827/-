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
  { id: 'hanbok_traditional', prompt: 'place this person wearing elegant traditional Korean hanbok, pastel pink and ivory with delicate floral embroidery, minimalist Korean courtyard with soft bokeh, warm golden light, photorealistic, 8k' },
  { id: 'hanbok_wonsam', prompt: 'place this person in vast empty courtyard of Korean royal palace, dark grey stone pavement stretching wide, grand wooden palace hall with dancheong painted eaves in background, wearing traditional ceremonial Korean royal wedding hanbok, soft flat overcast light, dignified regal atmosphere, photorealistic, 8k' },
  { id: 'hanbok_dangui', prompt: 'place this person in warm ondol room with yellow-ochre hanji walls, dark wooden daecheongmaru of traditional hanok, wearing elegant pale celadon silk dangui with luminous translucent ivory inner glow with plum goreum bow, brass oil lamp warm amber light, intimate refined atmosphere, photorealistic, 8k' },
  { id: 'hanbok_modern', prompt: 'place this person on mountain ridge in thick cold fog with dark pine silhouettes, wearing modern minimalist Korean hanbok in cool muted tones, flat diffused fog light, contemporary restrained fashion editorial style, photorealistic, 8k' },
  { id: 'hanbok_saeguk', prompt: 'place this person in Joseon palace throne room with dark wooden pillars and ilwolobongdo screen, wearing traditional Korean royal court attire, cinematic dramatic lighting, photorealistic, 8k' },
  { id: 'hanbok_flower', prompt: 'place this person on old stone quay along Seine river in Paris at midnight, iron lampposts warm golden light on wet cobblestones, wearing romantic Korean hanbok in peony pink and burgundy wine tones, cinematic midnight atmosphere, photorealistic, 8k' },
  { id: 'city_night', prompt: 'place this person on the empty top floor of a multi-story parking garage at night open air no roof, city skyline visible in background with scattered office windows and red aircraft warning lights, harsh security fluorescent tube casting flat greenish light on concrete, face lit by softer distant amber glow of city below, wind moving hair, nocturnal urban cinematic atmosphere, photorealistic, 8k' },
  { id: 'cherry_blossom', prompt: 'place this person walking alone down the center of a quiet street lined with cherry blossom trees in full bloom forming pale pink canopy overhead, petals drifting slowly in gentle breeze, petal-covered asphalt soft pink, soft flat overcast light no shadows white sky makes pink petals glow from within, dreamy spring atmosphere, photorealistic, 8k' },
  { id: 'forest_wedding', prompt: 'place this person standing at the threshold where a dirt path enters a dense old-growth forest, massive dark tree trunks packed closely together disappearing into thick white fog, deep green moss on dark wet earth, flat grey diffused light with no source and no shadow, fog erases everything, sacred woodland atmosphere, photorealistic, 8k' },
  { id: 'castle_garden', prompt: 'place this person standing in the center of a vast empty European palace throne room with impossibly high painted ceilings and tall marble columns, single shaft of dusty golden light from high window cutting diagonally across marble floor, dust particles floating in beam, bare and enormous abandoned grandeur, photorealistic, 8k' },
  { id: 'cathedral', prompt: 'place this person standing inside a vast old gothic stone cathedral with soaring ribbed vault ceiling and massive stone pillars, tall stained glass windows casting pools of deep red blue gold violet colored light across stone floor, single shaft of warm light from high window, dark sacred Caravaggio chiaroscuro atmosphere, photorealistic, 8k' },
  { id: 'watercolor', prompt: 'place this person in a bright airy art studio with large floor-to-ceiling windows, soft diffused natural light, white walls with faint watercolor paint splashes in pastel pink lavender and mint, a large canvas on an easel nearby, scattered paint brushes and watercolor palettes, gentle artistic bohemian atmosphere, soft pastel color palette throughout, photorealistic, 8k' },
  { id: 'magazine_cover', prompt: 'place this person in a high fashion editorial portrait, clean minimalist studio with dramatic single light source, GQ/Vogue cover style, photorealistic, 8k' },
  { id: 'rainy_day', prompt: 'place this person sitting alone on wooden bench at a small old bus stop shelter on a quiet street in steady rain, soft dove grey silk charmeuse off-shoulder wedding dress with sheer grey organza long sleeves or cool slate grey wool-silk suit depending on gender, clear vinyl umbrella closed resting against shoulder, wet dark asphalt reflecting grey sky, flickering fluorescent tube light, steady silver rain lines beyond shelter edge, patient melancholic intimate atmosphere, photorealistic, 8k' },
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
  { id: 'spring_letter', prompt: 'place this person sitting alone at a wooden reading desk by a tall window in an old quiet library, cherry blossom branches pressing against the window glass, soft afternoon light filtering through blossoms casting dappled pink-tinted shadows, holding an open book eyes looking out the window, dust floating in light beams, photorealistic, 8k', subScenes: ['place this person sitting at wooden reading desk by tall window in old quiet library, cherry blossom branches against glass, soft afternoon pink-tinted light, holding open book looking out window, face clearly visible, photorealistic, 8k', 'place this person walking toward camera in long narrow school corridor with old wooden floors, cherry blossom petals scattered on hallway floor blown in through open window, strong beam of afternoon sunlight cutting diagonally across corridor, face clearly visible, photorealistic, 8k', 'place this person sitting on wide stone steps outside old columned building, cherry blossom trees fully bloomed petals falling slowly, late afternoon side light casting long shadows, looking down at hands in lap, face clearly visible, photorealistic, 8k', 'place this person on old bicycle on tree-lined path covered in fallen cherry blossom petals, pink petal carpet on ground, warm golden late afternoon backlight creating glowing halos, caught mid-laugh, face clearly visible, photorealistic, 8k', 'place this person standing inside warm amber-lit room seen through old window from outside, window glass slightly wavy with water spots, one cherry blossom petal stuck to outside glass, cool blue evening light outside warm amber inside, face clearly visible, photorealistic, 8k', 'place this person standing alone in middle of wide open field, single enormous cherry blossom tree in full bloom far behind, eyes closed holding folded cream letter against chest, cherry blossom petals drifting across field, soft flat overcast light, face clearly visible, photorealistic, 8k'] },
  { id: 'summer_rain', prompt: 'place this person under massive old tree shade in wide open grass field on blazing summer afternoon, harsh midday sun above but cool shade beneath, dappled light through leaves creating bright spots, face clearly visible, photorealistic, 8k', subScenes: ['place this person under massive old tree shade in wide grass field, dappled sunlight through leaves, field beyond shade blown-out white from intense sun, face clearly visible relaxed, photorealistic, 8k', 'place this person sitting on stone edge of old shallow natural stream surrounded by tall summer grass and wildflowers, feet dangling in clear water, late afternoon golden backlight through hair and water spray, face clearly visible smiling, photorealistic, 8k', 'place this person standing in front of tall open window in old white-walled room, sheer white curtain billowing inward from hot summer breeze, chiffon skirt catching same wind blending with curtain, strong direct afternoon sun rectangle on wooden floor, face clearly visible in profile eyes closed, photorealistic, 8k', 'place this person on wooden porch of old countryside house on hot summer afternoon, tin bucket with watermelon on porch floor, holding thick slice of watermelon mid-bite, small electric fan with ribbon on porch floor, harsh direct sun on dirt yard ahead porch shade, face clearly visible, photorealistic, 8k', 'place this person standing in wide golden barley field under sky half brilliant blue half dark dramatic thundercloud, strong pre-storm wind pressing clothes against body, warm golden sun from right cool storm light from left, face clearly visible chin up, photorealistic, 8k', 'place this person running through barley field in heavy summer rain laughing, completely soaked hair plastered to face, heavy rain streaks as white diagonal lines against dark sky, motion blur on running body, face clearly visible mid-laugh, photorealistic, 8k', 'place this person standing still in barley field after rain stopped, everything wet and steaming in returning sun, sky half dark cloud retreating half golden light breaking through, air visibly steaming as hot sun hits wet ground, faint rainbow arc behind, face clearly visible gentle smile, photorealistic, 8k'] },
  { id: 'autumn_film', prompt: 'place this person in small old Korean portrait studio in late afternoon, standing in front of faded plain backdrop, single warm tungsten bulb overhead and soft late afternoon light from small frosted window, face clearly visible with quiet calm expression, photorealistic, 8k', subScenes: ['place this person in small old Korean portrait studio, standing in front of faded plain backdrop, warm tungsten bulb overhead mixed with afternoon window light, face clearly visible quiet calm half-smile, photorealistic, 8k', 'place this person walking slowly in narrow residential alley in quiet Korean neighborhood in autumn, ginkgo leaves scattered yellow on ground, extremely low sun casting long horizontal golden light down alley turning everything amber, face clearly visible, photorealistic, 8k', 'place this person standing at small railroad crossing with red white barrier arm lowered, autumn trees with deep orange red leaves lining both sides, late afternoon golden light making autumn leaves glow, face clearly visible looking calmly across barrier, photorealistic, 8k', 'place this person on apartment rooftop at sunset, white bedsheets on clothesline blowing gently in evening breeze behind, deep orange sky fading to purple, face clearly visible quiet expression half golden half shadow from setting sun, photorealistic, 8k', 'place this person sitting on worn wooden bench in front of tiny old neighborhood convenience store at dusk, single bare bulb overhead casting warm amber light, holding small paper cup of warm coffee steam rising, cool blue twilight sky above, face clearly visible lit amber from store bulb, photorealistic, 8k', 'place this person looking through glass door of small portrait studio at evening, studio interior glowing warm amber from tungsten bulb, cool blue evening outside with yellow ginkgo leaves drifting past glass, reflection and falling leaves overlapping on glass surface, face clearly visible through glass slightly soft, photorealistic, 8k', 'place this person walking alone in narrow residential alley at early morning, soft pale blue-grey dawn light no shadows no warmth, ginkgo leaves still on ground, holding single developed photograph in right hand at side, walking toward camera with small steady calm expression, face clearly visible, photorealistic, 8k'] },
  { id: 'winter_zhivago', prompt: 'place this person in freezing winter night, extreme close-up faces with red-flushed cheeks and nose tips from cold, tiny ice crystals on hair, single warm light from below like streetlamp reflected off snow, face clearly visible, photorealistic, 8k', subScenes: ['place this person in freezing cold winter night, red-flushed cheeks and nose from cold, few frozen ice crystals on hair, complete darkness behind lit by single warm streetlamp light, face clearly visible, photorealistic, 8k', 'place this person outside in falling snow seen through window covered in thick frost crystal patterns, one small circle melted in frost by pressing warm palm against glass, standing under single streetlamp looking up, cold blue-white snow and lamplight, face clearly visible through cleared frost circle, photorealistic, 8k', 'place this person in small bare room with old wooden floor and peeling wallpaper, only light from mismatched candles placed on floor in rough circle, silk catching warm candlelight glowing gold, candle flames flickering warm orange on face walls in deep cold shadow, face clearly visible eyes closed, photorealistic, 8k', 'place this person standing on snow-covered train tracks stretching to vanishing point, flat white snow covers everything, heavy grey overcast sky blending into white ground no visible horizon, vast white emptiness, face clearly visible, photorealistic, 8k', 'place this person sitting at old upright piano in large empty room with tall windows, snow falling heavily outside windows visible as white streaks against dark evening sky, fingers resting on keys without pressing, empty sheet music stand, single candle on piano only light warm amber on face cold blue from windows, face clearly visible in profile, photorealistic, 8k', 'place this person dancing slowly in wide open snow field at night during heavy snowfall, slow shutter soft motion blur on swaying body, falling snowflakes stretched into long white diagonal lines, single distant streetlamp far behind creating warm orange point of light, foreheads pressed together eyes closed, face clearly visible, photorealistic, 8k', 'place this person walking on quiet residential street covered in fresh undisturbed snow at early winter dawn, palest pink-blue first light before sunrise, black overcoat draped over shoulders too big, footprints in snow behind only marks on pristine white street, face clearly visible walking toward camera, photorealistic, 8k'] },
  { id: 'lovesick', prompt: 'place this person standing alone in empty outdoor parking lot at dawn, flat grey-blue predawn light, white parking lines on dark asphalt stretching into distance, single sodium vapor lamp behind casting long shadow forward, deadpan centered composition, face clearly visible, photorealistic, 8k', subScenes: ['place this person standing alone in empty parking lot at dawn, flat grey-blue predawn light, white parking lines on dark asphalt, single sodium vapor lamp behind, standing stiffly arms at sides deadpan expression, face clearly visible, photorealistic, 8k', 'place this person on quiet residential sidewalk with low morning sun raking warm gold light from left, long shadow thrown right across pavement, holding oversized red heart-shaped helium balloon by white string arm extended, face clearly visible, photorealistic, 8k', 'place this person standing in narrow alley between old concrete buildings, hard midmorning sun from directly above creating narrow strip of bright light on ground between shadowed walls, face lit by warm reflected bounce light from sunlit concrete floor, face clearly visible slight smile, photorealistic, 8k', 'place this person walking on empty city sidewalk bare feet on warm pavement, low warm morning sun from behind creating soft golden rim light on hair and shoulders, long shadow stretching forward, face clearly visible mid-laugh, photorealistic, 8k', 'place this person sitting on concrete ledge on rooftop of low building overlooking city, overcast flat grey sky warm midday diffused light, muted grey beige city rooftops stretching behind, peeling tangerine in hands handing segment, face clearly visible, photorealistic, 8k', 'place this person in same empty parking lot now at night, single sodium vapor lamp casting harsh orange circle on dark asphalt, deflated red heart balloon on ground near feet wrinkled and soft, everything outside orange lamp circle is pure dark, face clearly visible eyes closed, photorealistic, 8k'] },
  { id: 'silver_thread', prompt: 'place this person standing at dark wooden cutting table in grand austere atelier with pale grey walls and tall windows, cold grey morning light from tall window falling in single clean shaft across worktable, dust motes in light shaft, face clearly visible, photorealistic, 8k', subScenes: ['place this person standing at dark wooden cutting table in grand atelier with pale grey walls tall windows, hand-sewing pale silver-lavender silk fabric, silver needle catching window light as single bright point, cold grey morning light single shaft, face clearly visible concentrated expression, photorealistic, 8k', 'place this person standing in grand atelier beside tall window, running fingertips along bolt of pale silver-lavender silk duchess satin fabric unrolled across dark wooden cutting table, cool grey north window light raking at low angle across silk surface showing every weave and sheen variation, face clearly visible looking down at fabric, photorealistic, 8k', 'place this person shot from behind looking into large ornate gilded standing mirror in spacious atelier with pale grey walls and dark herringbone floor, mirror reflects face clearly, cool diffused north window light, face clearly visible in mirror reflection, photorealistic, 8k', 'place this person in grand atelier late afternoon, kneeling adjusting train hem of pale silver-lavender silk dress spread across dark herringbone floor, single loose thread trailing from hem, warm amber-grey afternoon light from window now lower, face clearly visible, photorealistic, 8k', 'place this person descending grand dark wooden staircase in London townhouse, soft cool backlight from tall stairwell window above and behind creating gentle glow, dark wooden banister, face clearly visible, photorealistic, 8k', 'place this person sitting in wooden chair at dark worktable in grand atelier at night, single warm brass desk lamp on worktable only light source, tall windows showing deep blue London evening sky, silver needle stuck in velvet pincushion catching warm lamplight, warm tungsten lamplight on face rest of room falls into deep blue-grey shadow, face clearly visible, photorealistic, 8k'] },
  { id: 'in_the_mood', prompt: 'place this person standing beside old black motorcycle in dark narrow alley at night, wet asphalt reflecting distant neon, graffitied concrete wall behind, warm sodium vapor lamp above, distant cyan neon, face clearly visible, photorealistic, 8k', subScenes: ['place this person descending narrow dimly lit apartment staircase with old green-painted walls peeling slightly dark wooden handrail single bare warm tungsten bulb, holding vintage floral thermos flask, face clearly visible, photorealistic, 8k', 'place this person beside old black motorcycle in dark narrow alley at night wet asphalt reflecting neon, looking at camera, distant cyan neon and warm sodium vapor lamp split lighting, face clearly visible, photorealistic, 8k', 'place this person stopped inside empty highway tunnel at night, orange sodium vapor tunnel lights receding in identical intervals creating infinite perspective lines, motorcycle parked in center of empty lane, face clearly visible, photorealistic, 8k', 'place this person inside old glass phone booth on empty sidewalk at night, holding old phone receiver to ear with one hand other hand flat against glass, cold fluorescent tube inside warm amber streetlight outside, face clearly visible, photorealistic, 8k', 'place this person riding descending escalator in empty subway station at night, overhead fluorescent tube lights in repeating bright lines, face clearly visible, photorealistic, 8k', 'place this person leaning against concrete pillar beneath elevated highway overpass at night, holding lit sparkler, cars passing on highway above creating rhythmic headlight sweeps, face clearly visible, photorealistic, 8k'] },
  { id: 'rouge_clue', prompt: 'place this person peeking out from behind half-open vivid crimson red painted wooden door on quiet cobblestone alley with green ivy climbing stone wall beside red door, warm golden afternoon light raking down alley, face clearly visible, photorealistic, 8k', subScenes: ['place this person peeking out from behind half-open crimson red door on cobblestone alley, green ivy on stone wall, mischievous half-smile, warm golden afternoon light, face clearly visible, photorealistic, 8k', 'place this person sitting alone at small round marble table inside warm amber-lit Parisian cafe, dark red leather banquette behind, tracing something on fogged window glass with fingertip, warm tungsten light on face, face clearly visible, photorealistic, 8k', 'place this person inside narrow old fruit shop doorway, wooden crates of fruit old brass scale, holding single red apple up to eye level examining it against daylight from open door, warm afternoon light, face clearly visible, photorealistic, 8k', 'place this person climbing steep narrow outdoor stone staircase in old quartier, late afternoon sun catching crimson ribbon tied to iron railing, holding white envelopes, stone steps worn smooth, face clearly visible, photorealistic, 8k', 'place this person on old carousel in small park at dusk riding painted white wooden horse sidesaddle, one hand gripping brass pole, carousel string lights warm yellow bulbs overhead mixed with cool blue dusk sky, face clearly visible, photorealistic, 8k', 'place this person standing with back against closed crimson red painted door on cobblestone alley at evening, warm yellow streetlamp above, green ivy on stone wall, looking directly at camera no more hiding, face clearly visible, photorealistic, 8k'] },
    { id: 'summer_tape', prompt: 'place this person in empty school playground in blazing midsummer afternoon, harsh overhead sun entire frame overexposed blown-out white sky, rusted pull-up bars and old green iron bench, hazy heat shimmer, face clearly visible, photorealistic, 8k', subScenes: ['place this person sitting on old green-painted iron bench in empty school playground, harsh overhead midsummer sun overexposed blown-out sky, hazy heat shimmer above asphalt, face clearly visible, photorealistic, 8k', 'place this person walking through long empty school corridor with old wooden floor, afternoon sun pouring through tall windows creating sharp golden light rectangles on dark floor, walking through alternating bands of blinding gold and cool shadow, face clearly visible mid-laugh, photorealistic, 8k', 'place this person sitting on concrete ledge on school rooftop beside concrete water tank, late afternoon sun lower but still intense, face tilted up to sky eyes closed sun on face, warm amber light, face clearly visible, photorealistic, 8k', 'place this person in old concrete school stairwell between floors, single shaft of warm amber light from stairwell window cutting horizontally, dust in light shaft, face in warm light rest in deep shadow, face clearly visible, photorealistic, 8k', 'place this person standing beside outdoor water fountain near school field at golden hour, low golden sun making everything warm amber, water from brass tap catching sunlight as liquid gold, face clearly visible, photorealistic, 8k', 'place this person on same school playground at golden hour sun minutes from setting, deep amber-orange light drenching everything, long shadows of pull-up bars stretching across playground, entire image heavily overexposed edges dissolving into pure warm white lens flare, face clearly visible, photorealistic, 8k'] },
];

const GLAMOUR_FACE = 'Keep the person\'s facial features exactly the same as the reference image, including eye shape, eyelid fold, nose, lips, jawline, and face proportions. The face must be identical to the input photo. Natural proportionate head to body ratio with realistic skin texture';

const GLAMOUR_OUTFIT_GROOM: Record<string, string> = {
  studio_classic: 'wearing elegant black tuxedo with white dress shirt, black bow tie, polished shoes, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  studio_gallery: 'wearing charcoal grey wool-silk single-breasted one-button blazer with exaggerated angular peaked lapel with crisp geometric edges, light grey silk mock-neck top no collar, charcoal tailored straight-leg trousers with sharp center crease, black matte leather oxford shoes, architectural sharp silhouette, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  studio_fog: 'wearing light grey wool-cashmere single-breasted two-button blazer with notch lapel and soft matte brushed texture, white linen band-collar shirt all buttons closed minimal, light grey straight-leg trousers, light grey suede desert boots, quiet tonal grey no accessories, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  studio_mocha: 'wearing dark warm taupe brown wool gabardine single-breasted one-button blazer with notch lapel muted earthy tone like dried clay, ivory cotton open-collar shirt relaxed no tie, dark warm brown straight-leg trousers, dark brown matte leather shoes, understated earthy elegance, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  studio_sage: 'wearing off-white matte wool-blend single-breasted two-button blazer with shawl collar soft chalky texture like unglazed porcelain, pure white fine gauge crew-neck knit top, off-white straight-leg trousers, white leather minimal sneakers, no accessories, clean ethereal, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  hanbok_traditional: 'wearing traditional Korean hanbok, elegant dark blue dopo with white inner jeogori, traditional headpiece, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  hanbok_wonsam: 'wearing deep midnight navy silk shantung dopo extending below the knee with wide straight sleeves ending at wrist, clean mandarin collar standing two centimeters, gold silk goreum ties in simple knot at chest, deep crimson red silk sash tied at waist with sash tails hanging to mid-thigh, straight-leg trousers in matching midnight navy silk, pale gold silk inner sleeve lining visible only when arms move, NOT a western suit NOT a coat NOT modern clothing, authentic Korean royal groom wedding attire, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  hanbok_dangui: 'wearing deep plum purple silk shantung dopo extending below the knee with clean mandarin collar and straight wide sleeves, pale celadon green silk inner vest visible at chest with gold thread calligraphy line along front edge, gold silk goreum tie at chest in simple knot, slim straight-leg trousers in midnight navy silk, NOT a western suit NOT a coat, refined traditional Korean groom attire, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  hanbok_modern: 'wearing deep charcoal black raw silk knee-length structured overcoat with clean sharp mandarin collar and matte black fabric toggle, dusty blue-grey band-collar shirt beneath, charcoal black silk trousers, blush pink inner collar lining visible at open neck, NOT a western suit NOT a blazer NOT a trench coat, contemporary minimalist Korean hanbok groom attire, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  hanbok_saeguk: 'wearing deep crimson red silk hongryongpo royal robe extending to floor with wide sleeves, large circular gold dragon yongbo medallions on chest and back, round dallyeong neckline with white inner collar, black leather belt with jade and gold buckle plates, black silk ikseongwan crown with wing extensions, NOT Chinese imperial NOT standing collar, authentic Joseon dynasty king attire, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  hanbok_flower: 'wearing deep burgundy wine silk knee-length dopo-inspired overcoat with mandarin collar and single toggle closure, subtle damask petal texture, peony pink band-collar shirt beneath, charcoal black trousers, NOT a western suit NOT a blazer, contemporary romantic Korean hanbok groom attire, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  city_night: 'wearing deep midnight navy silk-wool blend single-breasted one-button jacket with slim shawl collar in matching navy silk satin creating subtle sheen contrast against matte wool body, matching slim tapered trousers, black silk shirt with soft point collar buttoned to top no tie, single thin gold chain necklace just visible at shirt collar, no pocket square no boutonniere, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  cherry_blossom: 'wearing soft warm grey wool-silk blend single-breasted two-button jacket with soft natural shoulders and relaxed elegant silhouette, matching tapered trousers with clean break, pearl white silk shirt with soft spread collar, pale barely-there blush pink silk tie, no pocket square, the grey is soft and warm like cherry blossom bark, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  forest_wedding: 'wearing deep forest green wool-silk blend single-breasted two-button jacket with slim notch lapels and clean natural shoulders, matching tapered trousers with clean break, cream white silk shirt with soft spread collar open no tie, jacket buttons carved from dark natural wood smooth and polished, suit color nearly identical to dark wet tree bark, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  castle_garden: 'wearing deep black silk-wool barathea single-breasted one-button jacket with slim satin-faced peak lapels and sharp clean silhouette, matching slim trousers with satin side-stripe, warm ivory silk shirt with soft spread collar, black silk bow tie, single antique gold silk pocket square folded flat, no other accessories, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  cathedral: 'wearing deep solid black wool gabardine single-breasted two-button jacket with slim notch lapels and precise clean silhouette perfectly pressed, matching slim straight-leg trousers with sharp crease, pure white cotton poplin shirt with stiff point collar, solid black silk tie in tight four-in-hand knot, no pocket square no boutonniere no pin no accessories, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  watercolor: 'wearing cream colored linen suit with no tie, relaxed artistic elegance, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  magazine_cover: 'wearing designer black suit with perfect fit, strong editorial style, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  rainy_day: 'wearing cool slate grey wool-silk blend single-breasted two-button jacket with clean slim notch lapels tailored fitted silhouette, matching tapered trousers with clean break, soft dove grey silk shirt with spread collar, deeper charcoal grey silk knit tie, no pocket square, tonal grey on grey layered like rain clouds, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  vintage_film: 'wearing warm camel brown tweed three-piece suit with wide peaked lapels, matching brown vest with gold buttons, cream white dress shirt with wide pointed collar visible over vest, brown patterned wide tie, brown leather oxford shoes, same outfit in every shot, 1970s retro groom, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  cruise_sunset: 'wearing cream beige linen suit, white open collar shirt, no tie, golden hour nautical groom elegance, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  cruise_bluesky: 'wearing cream beige linen suit, white open collar shirt, no tie, nautical groom elegance, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  vintage_record: 'wearing olive khaki brown wide-lapel vintage blazer over light blue open-collar dress shirt with wide pointed collar visible over blazer lapels, grey pinstripe pleated trousers, brown leather oxford shoes, same outfit in every shot, 1970s retro groom, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  retro_hongkong: 'wearing dark burgundy wine double-breasted blazer with silky sheen over black silk shirt unbuttoned showing collarbone, ivory pocket square, black slim trousers, black chelsea boots, relaxed confident lean with hand in pocket, effortless cool charm, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  black_swan: 'wearing black silk-satin shawl-collar blazer over black silk-georgette relaxed collarless shirt with moderate V-neckline showing collarbones only, shirt tucked in, black high-waisted wide-leg tailored trousers, thin black leather belt with matte buckle, black chelsea boots, all-black no accessories, dark sophisticated elegance, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  velvet_rouge: 'wearing deep dark teal-green silk single-breasted one-button blazer with peaked lapel and refined luminous sheen like aged jade NOT bright turquoise NOT mint, black silk open-collar shirt no tie top two buttons undone, dark teal tailored slim-straight trousers in same silk fabric, black polished leather oxford shoes, no pocket square no accessories, aristocratic sharp darkly romantic, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  water_memory: 'wearing pearl-white silk mikado single-breasted peaked lapel suit with visible luminous silk sheen like wet porcelain, NOT linen NOT matte NOT cream beige, white silk open-collar shirt no tie showing collarbones, pearl-white slim-straight trousers in same silk mikado fabric, white leather minimal dress shoes, entire outfit has unified pearlescent silk glow, ethereal dreamlike elegance, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  blue_hour: 'wearing classic navy blue fine wool two-piece suit, single-breasted two-button blazer with notch lapel fitted silhouette, crisp white dress shirt with top button undone no tie, navy blue tailored slim trousers, dark brown leather oxford shoes, simple classic timeless gentleman, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  iphone_mirror: 'wearing casual white shirt with rolled sleeves, relaxed natural look, no tie no jacket, holding phone for mirror selfie, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  rose_garden: 'wearing pale warm beige soft wool two-button suit with natural shoulders, ivory cream silk tie in loose knot over white cotton dress shirt, ivory silk pocket square, soft brushed matte texture, romantic elegant, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  grass_rain: 'wearing black wool slim-fit two-button suit with natural shoulders, white cotton shirt with collar open no tie, jacket worn casually unbuttoned, clean simple silhouette, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  eternal_blue: 'wearing slate blue-grey wool one-button suit with slim peak lapels, white silk shirt spread collar top button undone no tie, small pearl pin on left lapel, cool melancholic, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  heart_editorial: 'wearing sharp black double-breasted six-button jacket with extreme wide peaked lapels and structured squared shoulders, high-waisted wide-leg trousers with razor-sharp crease, crisp white shirt buttoned to top narrow black silk tie, red fabric heart on left lapel, bold graphic, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  vintage_tungsten: 'wearing dark navy wool two-button suit with wide notch lapels relaxed vintage cut, white cotton shirt soft rounded collar, dusty lavender silk tie slightly loose, soft lived-in quality like 1978 wardrobe, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  aao: 'wearing grand ivory silk shantung double-breasted peak-lapel long jacket extending past hip, structured wide shoulders, high-waisted wide-leg trousers sharp crease, white silk shirt cream tie, oversized googly eye pinned on left lapel, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  spring_letter: 'wearing light warm grey silk-linen blend single-breasted two-button wedding suit with soft natural shoulders slightly nipped waist, matching tapered trousers with clean break, pale blush pink silk shirt, ivory silk tie with soft sheen, small fresh pink peony bud boutonniere on left lapel, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  summer_rain: 'wearing natural off-white washed silk-linen blend unlined single-breasted two-button jacket with soft rolled notch lapels relaxed natural shoulders, matching straight-leg trousers with single front pleat, pale water blue silk shirt soft point collar top button undone, no tie, sleeves slightly pushed up showing shirt cuffs, white canvas sneakers, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  autumn_film: 'wearing rich warm tobacco brown wool-silk blend single-breasted three-button jacket with slightly longer length soft natural shoulders, matching straight-leg trousers with clean pressed crease, champagne ivory silk shirt soft point collar, deep wine red silk tie, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  winter_zhivago: 'wearing deep charcoal black silk-wool blend single-breasted two-button jacket with clean slim notch lapels sharp fitted silhouette, matching slim straight-leg trousers, silver-white silk shirt soft spread collar, pale icy lavender silk tie, black cashmere overcoat draped over one shoulder, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  lovesick: 'wearing vivid electric cobalt blue wool-silk blend single-breasted two-button suit with slim notch lapels contemporary sharp cut, crisp white cotton poplin shirt buttoned to top no tie, single tiny red silk heart pinned on left lapel, dark navy leather shoes, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  silver_thread: 'wearing deep midnight navy wool gabardine double-breasted six-button suit with sharp wide peak lapels and structured squared shoulders, high-waisted wide-leg trousers with single front pleat, crisp white cotton poplin shirt with stiff cutaway collar, narrow dark silver-lavender silk tie in tight four-in-hand knot, white linen pocket square folded sharp, dark burgundy leather oxford shoes, Savile Row precision, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  in_the_mood: 'wearing deep charcoal black wool-silk blend slim single-breasted two-button suit with narrow notch lapels and sharp shoulders, slim tapered trousers, pure white silk charmeuse shirt with subtle luminous sheen soft point collar no tie top two buttons open, black leather chelsea boots, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  rouge_clue: 'wearing warm tobacco brown corduroy single-breasted two-button suit with slim notch lapels and soft natural shoulders, matching corduroy trousers with slight taper, cream white cotton shirt with soft rounded collar, deep crimson red knit tie in slim square-bottom shape, dark brown leather desert boots, single small emerald green enamel arrow pin on left lapel, warm lived-in texture, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
  summer_tape: 'wearing soft warm sand ivory washed linen-silk blend unstructured two-button jacket with soft rolled notch lapels no padding slightly relaxed fit, matching straight-leg linen-silk trousers, pale celadon green silk shirt with soft point collar top two buttons open no tie, jacket left open, off-white canvas sneakers, sun-faded lived-in summer look, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',
};

const GLAMOUR_OUTFIT_COUPLE_GROOM: Record<string, string> = {
  lovesick: 'cobalt blue suit, white shirt buttoned to top no tie, red heart pin on lapel',
  silver_thread: 'midnight navy double-breasted suit, white shirt, silver-lavender tie',
  summer_tape: 'sand ivory linen suit, celadon green shirt open collar no tie',
  in_the_mood: 'charcoal black wool-silk suit, white silk charmeuse shirt, no tie',
  rouge_clue: 'tobacco brown corduroy suit, cream shirt, crimson red knit tie',
};

const GLAMOUR_OUTFIT_BRIDE: Record<string, string> = {
  studio_classic: 'wearing white haute couture strapless sweetheart bell gown with sculpted white silk mikado bodice, bell skirt constructed of hundreds of individually cut white silk organza petals in elongated wave shapes layered and overlapping like ocean ripples frozen in motion, each petal heat-shaped to curl slightly at edges creating three-dimensional depth, long sweeping train',
  studio_gallery: 'wearing white haute couture strapless sweetheart bell gown with sculpted white silk mikado bodice, bell skirt of silk organza petals layered like ocean ripples, long sweeping train, natural elegant makeup',
  studio_fog: 'wearing white haute couture strapless sweetheart bell gown that looks like fog, ivory silk crepe smooth minimal bodice, bell skirt with over twenty layers of ultra-sheer white silk organza in varying tones from pure white to softest pale grey, no embellishment no pattern, long fading train, natural elegant makeup',
  studio_mocha: 'wearing white haute couture halterneck bell gown, single wide fabric band of white silk mikado wrapping from front bust up around neck and down open back leaving shoulders bare, bell skirt of layered white silk organza panels cut in irregular jagged crystalline shapes like cracked glacier ice shards, dramatic trailing train, natural elegant makeup',
  studio_sage: 'wearing white haute couture one-shoulder bell gown with single wide sculptural strap over left shoulder of gathered white silk mikado, right shoulder completely bare, bell skirt cascading in long vertical knife-pleated panels of white silk organza released at different lengths like streams of water, dramatic sweeping train, natural elegant makeup',
  hanbok_traditional: 'wearing elegant traditional Korean hanbok, pastel pink jeogori over ivory chima, delicate floral embroidery, traditional bridal headpiece',
  hanbok_wonsam: 'wearing deep crimson red silk duchesse satin jeogori with sharp geometric shoulders and clean straight neckline, single oversized gold silk goreum bow tied asymmetrically at chest with bow tails falling to waist, grand sweeping A-line ivory white silk organza chima over pale gold silk satin underlayer creating luminous warm glow, long dramatic train, wide deep crimson obi-like silk sash matching jeogori at waist, gold thread geometric palace lattice embroidery at hem, hair adorned with simple gold binyeo hairpin, authentic Korean royal bride wedding attire',
  hanbok_dangui: 'wearing pale jade-tinted ivory silk dangui with luminous translucent quality as if light passes through revealing warm ivory glow beneath, open at front with wide flowing sleeves extending past fingertips, deep plum purple silk goreum bow tied elegantly at chest with tails falling past waist, grand full A-line ivory-gold silk chima with soft luminous inner warmth and cathedral train, gold thread calligraphy line embroidery along dangui sleeve edge, hair tied back with plum silk ribbon, refined elegant traditional Korean bridal attire',
  hanbok_modern: 'wearing cool dusty blue-grey silk jeogori with traditional curved closure and cropped high waist, deep forest green silk goreum tie with long tail, pale grey organza chima over blue-grey satin lining with sweep train, hidden blush pink inner wrist lining, no embroidery no gold no pattern, contemporary minimalist Korean bridal attire',
  hanbok_saeguk: 'wearing deep emerald green heavy silk wonsam with gold phoenix brocade patterns and large gold phoenix medallion on chest, Korean V-shape neckline with white inner collar, crimson inner jeogori visible, rainbow saekdong stripe bands on wide sleeves, burgundy purple chima, red goreum tie, hair center-parted in low jjokmeori NO bangs with tteoljam trembling hairpins and jade binyeo, authentic Joseon dynasty queen wedding attire',
  hanbok_flower: 'wearing deep peony pink silk jeogori with tonal damask petal weave and white inner collar, burgundy wine goreum bow, full ombre organza chima from peony pink to white at hem with chapel train, burgundy wine inner wrist lining, no floral motifs, romantic Korean bridal attire',
  city_night: 'wearing midnight navy silk velvet scoop-neckline dress sitting just below collarbones with thin spaghetti straps, smooth clean bias-cut bodice skimming torso, straight fluid column skirt to floor with modest puddle train, subtle burnout technique where velvet pile removed in irregular scattered pattern across lower skirt revealing sheer silk base beneath like night sky with gaps in clouds, thin chain of tiny gold links draped once across open upper back between straps, no lace no beading no sequins, natural elegant makeup',
  cherry_blossom: 'wearing soft pearl white silk chiffon off-shoulder wedding dress with sheer chiffon draped loosely across collarbones barely holding onto shoulders, fitted bodice in silk satin with chiffon floating over as translucent second skin, soft full A-line skirt in three layers of weightless silk chiffon that move independently with slightest air with gentle sweep train, innermost chiffon layer dyed palest barely-there blush pink invisible when still but faintest pink breathes through when outer layers separate, no lace no beading no flower motifs, natural elegant makeup',
  forest_wedding: 'wearing warm cream white silk crepe de chine high square-neckline wedding dress, long sleeves fitted to forearm then opening into soft wide bell cuffs falling past fingertips, smooth fitted bodice with single horizontal seam at natural waist, relaxed straight column skirt to floor with long sweep train, bottom hem and train edge dip-dyed in soft gradient fading from cream white into warm moss green over last fifteen centimeters as if dress absorbed forest floor color, no lace no beading no flowers no leaves, natural elegant makeup',
  castle_garden: 'wearing pale antique gold silk satin strapless wedding dress with straight sharp horizontal neckline, smooth sculpted bodice minimal seams silk satin reflecting light like liquid gold, natural waistline with single thin self-fabric belt tied in long trailing bow at back with bow tails falling to floor, grand sweeping A-line skirt with long cathedral train in heavy luminous silk satin with deep sculptural folds pooling on floor, long opera-length gloves in matching antique gold silk satin fingertip to above elbow, no lace no beading no embroidery, natural elegant makeup',
  cathedral: 'wearing pure white heavy silk gazar high closed neckline wedding dress sitting just below jaw with clean sharp edge almost clerical, long sleeves fitted close to arm to wrist with single silk-covered button closure at each cuff, sculpted bodice precise tailoring smooth seamless silk gazar holding shape with stiff architectural quality, restrained A-line skirt floor-length with long cathedral train extending six feet behind, long fingertip-length plain tulle veil attached at crown, natural elegant makeup',
  watercolor: 'wearing delicate off-white silk slip dress with thin straps, loose romantic waves in hair',
  magazine_cover: 'wearing haute couture white gown, high fashion editorial style',
  rainy_day: 'wearing soft dove grey silk charmeuse off-shoulder wedding dress with fabric draping softly across both shoulders in wide gentle curve, fitted bodice smooth seamless surface with liquid mercury-like sheen, clean A-line skirt falling in one fluid unbroken line to floor with modest sweep train, long fitted sleeves in sheer dove grey silk organza showing arms beneath like skin seen through rain on glass, single small silk ribbon bow in slightly darker slate grey at center back neckline, no lace no beading no embroidery, natural elegant makeup',
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
  spring_letter: 'wearing soft blush pink silk organza off-shoulder wedding dress with organza petal cap sleeves, fitted corset bodice with seed pearls scattered across bodice, three-tiered organza A-line skirt with long train, natural elegant makeup',
  summer_rain: 'wearing pure white silk mikado square-neckline wedding dress with wide straps on edge of shoulders, structured minimal bodice with sharp princess seams, softly gathered lightweight white silk chiffon skirt with gentle sweep train, single row of tiny hand-sewn clear glass beads along square neckline edge like water droplets, natural elegant makeup',
  autumn_film: 'wearing warm champagne ivory silk satin bias-cut V-neckline wedding dress with delicate spaghetti straps crossing once at upper back, smooth diagonal drape across torso creating one soft asymmetric fold at waist, fluid column silhouette skimming body pooling into long elegant puddle train, natural elegant makeup',
  winter_zhivago: 'wearing cool silver-white silk faille high boat neckline wedding dress with long fitted sleeves tapering to wrist with row of silk-covered buttons from wrist to elbow, sculpted structured bodice with clean vertical princess seams, full architectural A-line skirt with deep inverted box pleats creating geometric volume chapel-length train, thin detachable silk faille cape attaching at both shoulders falling straight down back to hem, cape inside lining pale icy lavender silk, natural elegant makeup',
  lovesick: 'wearing deep vivid scarlet red silk charmeuse slip dress with thin spaghetti straps and clean scoop neckline, smooth bias-cut fitted bodice with no boning fabric draping by gravity, fluid straight column skirt to floor with small puddle train, single oversized white silk fabric heart pinned at center of chest as only embellishment, no lace no beading, natural elegant makeup',
  silver_thread: 'wearing pale silver-lavender heavy silk duchess satin wedding dress with high closed jewel neckline and long fitted sleeves with twelve tiny silk-covered buttons from wrist to mid-forearm, sculpted tailored bodice with precise princess seams and structured boned interior, restrained A-line skirt with cathedral train, surface completely clean no embellishment no lace no beading the construction is the decoration, natural elegant makeup',
  in_the_mood: 'wearing pure white heavy silk charmeuse off-shoulder wedding dress with romantic gathered sweetheart neckline and dramatic oversized puff sleeves in silk organza billowing at shoulder then gathered tight at elbow, fitted boned corset bodice in smooth luminous silk charmeuse, massive voluminous four-tiered ruched bell-shaped ball gown skirt in cascading tiers of silk charmeuse with deep romantic ruching, cathedral train extending six feet, fingertip-length tulle veil with silk bow at crown, no lace no beading, natural elegant makeup',
  rouge_clue: 'wearing deep emerald green silk taffeta cocktail-length wedding dress with clean square neckline and wide shoulder straps, structured fitted bodice with sharp princess seams in crisp taffeta, full playful A-line skirt ending at mid-calf with slight petticoat volume beneath, single oversized handmade crimson red silk fabric camellia flower pinned at left waist as only embellishment, no lace no beading, retro 1960s silhouette, natural elegant makeup',
  summer_tape: 'wearing soft warm apricot silk organza off-shoulder wedding dress with sheer organza draped loosely across collarbones forming gentle petal cap sleeves, fitted bodice in pale apricot silk charmeuse beneath floating organza overlay, full romantic A-line skirt in three graduated tiers of weightless silk organza with gentle sweep train, subtle ombre from pale apricot at bodice to soft peach at hem, single tiny cluster of freshwater seed pearls at center of neckline, no lace no beading elsewhere, natural elegant makeup',
};

const GLAMOUR_OUTFIT_COUPLE_BRIDE: Record<string, string> = {
  lovesick: 'scarlet red silk slip dress, spaghetti straps, white heart pinned at chest',
  silver_thread: 'silver-lavender silk satin wedding dress, high neckline, long sleeves, cathedral train',
  summer_tape: 'soft apricot organza off-shoulder dress, tiered skirt, seed pearls at neckline',
  rouge_clue: 'emerald green taffeta cocktail dress, square neckline, A-line mid-calf, crimson camellia at waist',
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
    if (mode === 'groom') genderCheck = '\n5. GENDER-OUTFIT: The person MUST be wearing masculine clothing (suit, blazer, shirt, pants). If wearing a dress, skirt, gown, or any feminine clothing, answer FAIL.';
    else if (mode === 'bride') genderCheck = '\n5. GENDER-OUTFIT: The person MUST be wearing feminine clothing (dress, gown, skirt). If wearing a full suit with pants like a man, answer FAIL.';
    else if (mode === 'couple') genderCheck = '\n5. GENDER-OUTFIT: Image 2 must show exactly TWO people — one man in masculine clothing (suit/blazer/shirt) and one woman in feminine clothing (dress/gown). If both wear the same gender clothing or only one person is visible, answer FAIL.';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_API_KEY },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 20,
        temperature: 0,
        messages: [
          { role: 'system', content: 'You are an extremely strict facial identity verification inspector. Your job is to REJECT any image where the face does not closely match the reference. When in doubt, answer FAIL. You must be harsh — a photo of a different person wearing similar clothes is still FAIL.' },
          { role: 'user', content: [
            { type: 'image_url', image_url: { url: originalUrl, detail: 'high' } },
            { type: 'image_url', image_url: { url: generatedUrl, detail: 'high' } },
            { type: 'text', text: 'Image 1 is the original reference selfie. Image 2 is AI-generated. You MUST be extremely strict. Check ALL:\n1. FACE IDENTITY (MOST IMPORTANT): Compare the face in image 1 vs the main person in image 2. Check eye shape (single vs double eyelid), nose bridge width, lip thickness, jawline angle, cheekbone height, face width-to-height ratio, eyebrow shape. If these features do NOT closely match — even if the person looks vaguely similar — answer FAIL. A different person who looks somewhat alike is still FAIL.\n2. DEFORMITY: Any deformed faces, extra/missing fingers, mutated hands, fused body parts, extra/missing limbs, melted facial features, disproportionate head, missing body parts, headless body, or anatomical impossibility = FAIL.\n3. PERSON COUNT: Solo mode: must be exactly 1 person. Couple mode: must be exactly 2 people. Wrong count = FAIL.\n4. COMPLETENESS: Every visible person (including reflections) must have complete head, face, hair, and body. Missing head or cut-off head = FAIL.' + genderCheck + '\nFAIL if ANY check fails. PASS only if ALL checks pass. When uncertain, default to FAIL. Reply with one word only: PASS or FAIL.' },
          ] },
        ],
      }),
    });
    const data = await res.json();
    const answer = (data.choices?.[0]?.message?.content || '').trim().toUpperCase();
    if (!answer) { console.log('[VisionQC] empty response, FAIL by default'); return false; }
    const passed = answer.includes('PASS') && !answer.includes('FAIL');
    console.log('[VisionQC]', passed ? 'PASS' : 'FAIL', '| raw:', answer.slice(0, 80));
    return passed;
  } catch (e: any) {
    console.error('[VisionQC] error:', e.message);
    return false;
  }
}


async function detectFaceCenter(imageUrl: string): Promise<{cy: number; faceH: number} | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_API_KEY },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 80,
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
          { type: 'text', text: 'Return ONLY a JSON object with the vertical center of the main face as a ratio 0-1 from top, and the face height as a ratio of the image. Format: {"cy":0.25,"fh":0.15}' }
        ]}]
      })
    });
    const data = await res.json();
    const txt = data.choices?.[0]?.message?.content?.trim() || '';
    const match = txt.match(/\{[^}]+\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.cy === 'number' && typeof parsed.fh === 'number') return { cy: parsed.cy, faceH: parsed.fh };
    return null;
  } catch { return null; }
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

    const shortSide = Math.min(w, cropH);
    const scale = shortSide < 1024 ? 1024 / shortSide : 1;
    const outW = Math.round(w * scale);
    const outH = Math.round(cropH * scale);
    const cropped = await sharp(buf)
      .extract({ left: 0, top: 0, width: w, height: cropH })
      .resize(outW, outH, { fit: 'fill', kernel: 'lanczos3' })
      .jpeg({ quality: 95 })
      .toBuffer();
    console.log('[CropUpper] ' + w + 'x' + cropH + ' -> ' + outW + 'x' + outH);
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

async function generateGlamourPhotos(selfieUrls: string[], gender: 'male' | 'female' | 'couple', count: number = 7, selectedIds?: string[], qcTracker?: {url: string, passed: boolean, mode: string}[]): Promise<string[]> {
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
    const coupleGroom = GLAMOUR_OUTFIT_COUPLE_GROOM[conceptId] || groomOutfit;
    const coupleBride = GLAMOUR_OUTFIT_COUPLE_BRIDE[conceptId] || brideOutfit;
    const outfitPrompt = p.mode === 'couple'
      ? 'man ' + coupleGroom + ', woman ' + coupleBride
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
          resolution: '2K',
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
  const BATCH = 5;
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
            const coupleQC = async (refUrls: string[], genUrl: string): Promise<boolean> => {
              const basePass = await visionQC(refUrls[0], genUrl, 'couple');
              if (!basePass) return false;
              if (refUrls.length >= 2) {
                const bridePass = await visionQC(refUrls[1], genUrl, 'couple');
                if (!bridePass) { console.log('[CoupleQC] bride face FAIL'); return false; }
              }
              return true;
            };
            const pass1 = await coupleQC(p.urls, url1);
            if (pass1) { console.log('[Glamour] ' + conceptId + ' couple shot ' + (si + 1) + ' QC PASS'); qcTracker?.push({url: url1, passed: true, mode: p.mode}); return url1; }
            console.log('[Glamour] ' + conceptId + ' couple shot ' + (si + 1) + ' QC FAIL, retry 2');
            const url2 = await genOne(p, shot, p.urls, si);
            if (url2) {
              const pass2 = await coupleQC(p.urls, url2);
              if (pass2) { console.log('[Glamour] ' + conceptId + ' couple shot ' + (si + 1) + ' retry2 QC PASS'); qcTracker?.push({url: url2, passed: true, mode: p.mode}); return url2; }
            }
            console.log('[Glamour] ' + conceptId + ' couple shot ' + (si + 1) + ' QC FAIL, retry 3');
            const url3 = await genOne(p, shot, p.urls, si);
            if (url3) {
              const pass3 = await coupleQC(p.urls, url3);
              if (pass3) { console.log('[Glamour] ' + conceptId + ' couple shot ' + (si + 1) + ' retry3 QC PASS'); qcTracker?.push({url: url3, passed: true, mode: p.mode}); return url3; }
            }
            const candidates = [url1, url2, url3].filter((u): u is string => !!u);
            if (candidates.length >= 2) {
              try {
                const pickRes = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_API_KEY },
                  body: JSON.stringify({
                    model: 'gpt-4o-mini', max_tokens: 10,
                    messages: [{ role: 'user', content: [
                      ...candidates.slice(0, 2).map(u => ({ type: 'image_url' as const, image_url: { url: u, detail: 'high' as const } })),
                      { type: 'text' as const, text: 'Two AI-generated couple wedding photos. Pick the one where BOTH faces look more natural and better match real human proportions. Reply ONLY A or B.' },
                    ] }],
                  }),
                });
                const pickData = await pickRes.json();
                const pick = (pickData.choices?.[0]?.message?.content || 'A').trim().toUpperCase();
                const chosen = pick.includes('B') ? candidates[1] : candidates[0];
                console.log('[Glamour] ' + conceptId + ' couple shot ' + (si + 1) + ' all QC FAIL, comparative: ' + pick);
                qcTracker?.push({url: chosen, passed: false, mode: p.mode}); return chosen;
              } catch (e: any) { console.log('[Glamour] couple comparative error:', e.message); }
            }
            qcTracker?.push({url: url1, passed: false, mode: p.mode}); return url1;
          }
          const pass1 = await visionQC(p.urls[0], url1, p.mode);
          if (pass1) { console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' QC PASS'); qcTracker?.push({url: url1, passed: true, mode: p.mode}); return url1; }
          console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' QC FAIL, retry 2');
          const url2 = await genOne(p, shot, p.urls, si);
          if (!url2) { console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' retry2 gen failed, use first'); return url1; }
          const pass2 = await visionQC(p.urls[0], url2, p.mode);
          if (pass2) { console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' retry2 QC PASS'); qcTracker?.push({url: url2, passed: true, mode: p.mode}); return url2; }
          console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' retry2 QC FAIL, retry 3');
          const url3 = await genOne(p, shot, p.urls, si);
          if (!url3) { console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' retry3 gen failed, use best'); return url2; }
          const pass3 = await visionQC(p.urls[0], url3, p.mode);
          if (pass3) { console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' retry3 QC PASS'); qcTracker?.push({url: url3, passed: true, mode: p.mode}); return url3; }
          console.log('[Glamour] ' + conceptId + ' ' + p.mode + ' shot ' + (si + 1) + ' all 3 QC FAIL, use first'); qcTracker?.push({url: url1, passed: false, mode: p.mode}); return url1;
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
  photo: { amount: 29000, label: '웨딩시네마' },
  selfie: { amount: 39000, label: '웨딩시네마 + AI 화보팩' },
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

function getSubtitleFontPath(fontId: string): string {
  const latinOnly = ['GreatVibes-Regular'];
  if (latinOnly.includes(fontId)) return '/app/fonts/DXMSubtitlesM.ttf';
  return getFontPath(fontId);
}

router.get('/config', (_req, res) => {
  res.json({ pricing: PRICING, fonts: FONTS, subtitleStyles: SUBTITLE_STYLES, selfieConcepts: SELFIE_CONCEPTS.map(c => ({ id: c.id, name: ({ studio_classic: '클래식 스튜디오', studio_gallery: '갤러리 스튜디오', studio_fog: '포그 스튜디오', studio_mocha: '모카 스튜디오', studio_sage: '세이지 스튜디오', outdoor_garden: '가든 웨딩', beach_sunset: '비치 선셋', hanbok_traditional: '전통 한복', hanbok_wonsam: '원삼 혼례', hanbok_dangui: '당의 한복', hanbok_modern: '모던 한복', hanbok_saeguk: '사극풍', hanbok_flower: '꽃 한복', city_night: '시티 나이트', cherry_blossom: '벚꽃', forest_wedding: '숲속 웨딩', castle_garden: '유럽 궁전', cathedral: '성당', watercolor: '수채화', magazine_cover: '매거진 커버', rainy_day: '비 오는 날', autumn_leaves: '가을 단풍', winter_snow: '겨울 눈', vintage_film: '빈티지 필름', cruise_sunset: '크루즈 선셋', cruise_bluesky: '크루즈 블루스카이', vintage_record: '빈티지 레코드', retro_hongkong: '레트로 홍콩', black_swan: '블랙 스완', velvet_rouge: '벨벳 루즈', water_memory: '물의 기억', blue_hour: '블루아워', iphone_mirror: '거울 셀카', rose_garden: '장미 정원', grass_rain: '풀밭', eternal_blue: '블루', heart_editorial: '하이 에디토리얼', vintage_tungsten: '빈티지 텅스텐', aao: '에에올', spring_letter: '봄: 러브레터', summer_rain: '여름: 소나기', autumn_film: '가을: 필름', winter_zhivago: '겨울: 지바고', lovesick: '러브시크', silver_thread: '실버스레드', summer_tape: '서머테이프', rouge_clue: '루즈클루', in_the_mood: '화양연화' } as Record<string, string>)[c.id] || c.id })) });
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
  const { groomName, brideName, weddingDate, metStory, photos, bgmId, bgmUrl, fontId, tier, venueName, groomFather, groomMother, brideFather, brideMother, mode, selfieConcepts, endingMessage, videoEngine, familyMembers, friendsList, specialThanks, creditTextColor, couponCode } = req.body;

  const minPhotos = mode === 'selfie' ? 1 : 3;
  if (!groomName || !brideName || !photos?.length || photos.length < minPhotos) {
    return res.status(400).json({ error: mode === 'selfie' ? '셀카 1장 이상 필요' : '사진 3장 이상 필요' });
  }

  const pricing = PRICING[mode || 'photo'] || PRICING.photo;
  let finalAmount = pricing.amount;
  let appliedCoupon: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (coupon && coupon.isActive) {
      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        return res.status(400).json({ error: '만료된 쿠폰입니다' });
      }
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ error: '사용 한도 초과' });
      }
      if (coupon.category !== 'ALL' && coupon.category !== 'CINEMA') {
        return res.status(400).json({ error: '이 쿠폰은 웨딩시네마에 사용할 수 없습니다' });
      }
      if (coupon.discountType === 'PERCENT') {
        finalAmount = Math.floor(pricing.amount * (100 - coupon.discountValue) / 100);
      } else {
        finalAmount = Math.max(0, pricing.amount - coupon.discountValue);
      }
      appliedCoupon = couponCode.toUpperCase();
      await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    }
  }

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
        couponCode: appliedCoupon,
        amount: finalAmount,
        orderId,
        status: 'PENDING',
      },
    });

    res.json({ id: video.id, orderId, amount: finalAmount, label: pricing.label, clientKey: process.env.TOSS_CLIENT_KEY });
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
      glamourResults: video.glamourResults,
      mode: video.mode,
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
    '당신은 웨딩시네마 자막 작가입니다.',
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
          { type: 'text', text: prompt + ' --resolution 720p --ratio 16:9 --duration ' + duration + ' --camerafixed true --seed -1' },
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
  const FACE_GUARD = 'Locked tripod shot, no camera movement, no tilt, no pan. Face facing camera, no head turns, preserve exact face identity unchanged.';

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
    'Almost still photograph, only very subtle natural breathing, warm light',
    'Almost still photograph, minimal movement, soft warm light',
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
        content: [{ type: 'text', text: 'Extreme slow motion macro cinematography. Delicate white flower petals falling through soft golden backlight, a sheer ivory bridal veil caught in gentle breeze flowing through frame like silk water, shallow depth of field with creamy warm bokeh, petals drifting past translucent fabric creating layered depth, warm golden hour tone, no people no face no text no letters, peaceful elegant atmosphere, shot on Arri Alexa anamorphic lens. --resolution 720p --ratio 16:9 --duration ' + duration + ' --seed -1' }],
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
    for (let i = 0; i < Math.min(6, endingPhotos.length); i++) {
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
    await execAsync('ffmpeg -y -threads 2 ' + slideInputs + ' -filter_complex "' + sf.join(';') + '" -map "' + cur + '" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 18 -an -t ' + endingDur + ' "' + leftSlide + '"', 120000);
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
    await execAsync('ffmpeg -y -threads 2 -f lavfi -i color=c=0x0a0a0a:s=1280x720:d=' + endingDur + ':r=25 -i "' + leftSlide + '" -filter_complex "' + compVf + '" -map "[vout]" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 18 -an -t ' + endingDur + ' "' + endingOutPath + '"', 120000);
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
    const glamourQc: {url: string, passed: boolean, mode: string}[] = [];
    const glamourPhotos = await generateGlamourPhotos(photoUrls, gender, 10, savedConcepts, glamourQc);
    if (glamourPhotos.length < 3) throw new Error('Glamour photo generation failed: only ' + glamourPhotos.length + ' photos');
    photoUrls = glamourPhotos;
    await prisma.preweddingVideo.update({ where: { id: videoId }, data: { photos: glamourPhotos, glamourResults: glamourQc } });
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
    if (t.phase === 'climax' && !used.has(bestIdx)) { photo = best; used.add(bestIdx); }
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



  const HANBOK_IDS = new Set(['hanbok_wonsam', 'hanbok_dangui', 'hanbok_modern', 'hanbok_saeguk', 'hanbok_flower', 'hanbok_traditional']);
  const skipCrop = HANBOK_IDS.has((video as any).templateId);
  if ((video as any).mode === 'selfie' && !skipCrop) {
    const uniqueCropUrls = [...new Set(scenes.map((s: any) => s.photoUrl))];
    const cropMap: Record<string, string> = {};
    const CROP_BATCH = 5;
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

  const CLIP_BATCH = 5;
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
  const failedIndices = clipResults.map((url, i) => !url ? i : -1).filter(i => i >= 0);
  if (failedIndices.length > 0 && failedIndices.length <= 5) {
    console.log('[Pipeline] Retrying ' + failedIndices.length + ' failed clips:', failedIndices.map(i => i + 1).join(','));
    const retryPromises = failedIndices.map(si => {
      const scene = scenes[si];
      let gen: Promise<string | null>;
      if (videoEngine === 'seedance2') {
        const sd2prompt = buildSD2Prompt(scene.photoType, scene.camera, scene.phase);
        gen = generatePiAPISeedance2Clip(scene.photoUrl, sd2prompt, scene.duration, 'seedance-2-preview').then(url => url ? removePiAPIWatermark(url) : null);
      } else if (videoEngine === 'seedance2-fast') {
        const sd2prompt = buildSD2Prompt(scene.photoType, scene.camera, scene.phase);
        gen = generatePiAPISeedance2Clip(scene.photoUrl, sd2prompt, scene.duration, 'seedance-2-fast-preview').then(url => url ? removePiAPIWatermark(url) : null);
      } else {
        const sd15prompt = buildSD15DirectPrompt(scene.photoType, scene.camera, scene.phase, si);
        gen = generateSeedanceClip(scene.photoUrl, sd15prompt, scene.duration);
      }
      return gen.then(url => {
        if (url) {
          clipResults[si] = url;
          console.log('[Pipeline] retry clip ' + (si + 1) + ' OK');
        } else {
          console.log('[Pipeline] retry clip ' + (si + 1) + ' FAILED again');
        }
      }).catch(e => {
        console.error('[Pipeline] retry clip ' + (si + 1) + ' error:', (e as any).message);
      });
    });
    await Promise.all(retryPromises);
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
  const subtitleFontPath = getSubtitleFontPath(video.fontId || 'BMJUA_ttf');

  // === STEP A: Build opening.mp4 (Netflix/Apple cinematic intro) ===
  const openingOut = path.join(tmpDir, 'opening_final.mp4');
  const introSrc = '/app/assets/intro_cinematic.mp4';
  const nameFont = '/app/fonts/ClimateCrisisKR.ttf';
  const gName = escapeDrawtext(video.groomName);
  const bName = escapeDrawtext(video.brideName);
  const wDate = escapeDrawtext(video.weddingDate || '');
  try {
    const fullName = gName + '  &  ' + bName;
    const chars = Array.from(fullName);
    const tBase = 2.0;
    const tGap = 0.12;
    let typingVf = '';
    for (let ci = 0; ci < chars.length; ci++) {
      const partial = escapeDrawtext(chars.slice(0, ci + 1).join(''));
      const tS = (tBase + ci * tGap).toFixed(2);
      const isLast = ci === chars.length - 1;
      const tE = isLast ? '4.5' : (tBase + (ci + 1) * tGap).toFixed(2);
      const fade = isLast ? "\\:alpha='if(gt(t\\," + '4.0' + ")\\,(4.5-t)/0.5\\,1)'" : '';
      typingVf += ",drawtext=fontfile='" + nameFont + "':text='" + partial + "':fontsize=70:fontcolor=white@0.95:x=(w-text_w)/2:y=(h/2)-24:enable='between(t\\," + tS + "\\," + tE + ")'" + fade;
    }
    const dtBrand = ",drawtext=fontfile='" + nameFont + "':text='WEDDING ENGINE':fontsize=13:fontcolor=white@0.35:x=(w-text_w)/2:y=(h*0.62):enable='between(t\\,0.4\\,1.8)':alpha='if(lt(t\\,0.8)\\,(t-0.4)/0.4\\,if(gt(t\\,1.4)\\,(1.8-t)/0.4\\,1))'";
    const dtDate = wDate ? ",drawtext=fontfile='" + nameFont + "':text='" + wDate + "':fontsize=15:fontcolor=white@0.4:x=(w-text_w)/2:y=(h/2)+52:enable='between(t\\,3.2\\,4.5)':alpha='if(lt(t\\,3.5)\\,(t-3.2)/0.3\\,if(gt(t\\,4.0)\\,(4.5-t)/0.5\\,1))'" : '';
    const introVf = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=24" + dtBrand + typingVf + dtDate + ",fade=t=in:st=0:d=0.8,fade=t=out:st=4.2:d=0.8";
    await execAsync('ffmpeg -y -threads 2 -i "' + introSrc + '" -vf "' + introVf + '" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 18 -an -t 5 "' + openingOut + '"', 120000);
    console.log('[Pipeline] Cinematic intro created (' + chars.length + ' chars typed)');
  } catch (e: any) {
    console.error('[Pipeline] Intro failed:', e.message?.slice(0, 200));
    try {
      const fbVf = "drawtext=fontfile='" + nameFont + "':text='" + gName + "  &  " + bName + "':fontsize=70:fontcolor=white@0.95:x=(w-text_w)/2:y=(h/2)-24:enable='between(t\\,0.8\\,4.2)':alpha='if(lt(t\\,1.2)\\,(t-0.8)/0.4\\,if(gt(t\\,3.6)\\,(4.2-t)/0.6\\,1))',fade=t=in:st=0:d=0.8,fade=t=out:st=4.0:d=1.0";
      await execAsync('ffmpeg -y -threads 2 -f lavfi -i "color=c=black:s=1280x720:d=5:r=24" -vf "' + fbVf + '" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -an -t 5 "' + openingOut + '"', 60000);
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
      filters.push(subStream + "drawtext=fontfile='" + subtitleFontPath + "':text='" + escaped + "':fontsize=30:fontcolor=white:shadowx=2:shadowy=2:shadowcolor=black@0.6:x=(w-text_w)/2:y=h-60:enable='between(t\\," + fi0.toFixed(2) + "\\," + fo1.toFixed(2) + ")':alpha='if(lt(t\\," + fi1.toFixed(2) + ")\\,(t-" + fi0.toFixed(2) + ")/0.6\\,if(gt(t\\," + fo0.toFixed(2) + ")\\,(" + fo1.toFixed(2) + "-t)/0.6\\,1))'" + outLabel);
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
  if (allEndPhotos.length >= 6) { const step = (allEndPhotos.length - 1) / 5; for (let i = 0; i < 6; i++) endingPhotos.push(allEndPhotos[Math.round(i * step)]); }
  else { endingPhotos.push(...allEndPhotos); }
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



  // === STEP: Build sequence opening (vertical split reveal) ===
  const seqOut = path.join(tmpDir, 'sequence.mp4');
  try {
    const firstFrame = path.join(tmpDir, 'first_frame.png');
    await execAsync('ffmpeg -y -i "' + mainOut + '" -frames:v 1 -update 1 -q:v 2 "' + firstFrame + '"', 30000);
    await execAsync('ffmpeg -y -threads 2 -f lavfi -i "color=c=black:s=1280x720:d=1.5:r=24" -loop 1 -t 1.5 -i "' + firstFrame + '" -filter_complex "[1:v]scale=1280:720,setsar=1[img];[0:v][img]overlay=0:0:enable=1[out]" -map "[out]" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 18 -an -t 1.5 "' + seqOut + '"', 60000);
    console.log('[Pipeline] Sequence opening created (1.5s fade-in reveal)');
  } catch (e: any) {
    console.error('[Pipeline] Sequence opening failed:', e.message?.slice(0, 200));
    try { const fs2 = await import('fs'); fs2.unlinkSync(seqOut); } catch {}
  }

// === STEP D: Concat ===
  const concatParts: string[] = [];
  if (fs.existsSync(openingOut)) concatParts.push(openingOut);
  if (fs.existsSync(seqOut)) concatParts.push(seqOut);
  concatParts.push(mainOut);
  if (fs.existsSync(endingOut)) concatParts.push(endingOut);

  const concatList = path.join(tmpDir, 'concat.txt');
  fs.writeFileSync(concatList, concatParts.map(p => "file '" + p + "'").join('\n'));

  const hasAudio = bgmPath && fs.existsSync(bgmPath);
  const totalDuration = (fs.existsSync(openingOut) ? 5 : 0) + (fs.existsSync(seqOut) ? 1.5 : 0) + mainDuration + (fs.existsSync(endingOut) ? endingDur : 0);
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

  // === STEP A: Build opening.mp4 (Netflix/Apple cinematic intro) ===
  const openingOut = path.join(tmpDir, 'opening_final.mp4');
  const introSrc = '/app/assets/intro_cinematic.mp4';
  const nameFont = '/app/fonts/ClimateCrisisKR.ttf';
  const gName = escapeDrawtext(video.groomName);
  const bName = escapeDrawtext(video.brideName);
  const wDate = escapeDrawtext(video.weddingDate || '');
  try {
    const fullName = gName + '  &  ' + bName;
    const chars = Array.from(fullName);
    const tBase = 2.0;
    const tGap = 0.12;
    let typingVf = '';
    for (let ci = 0; ci < chars.length; ci++) {
      const partial = escapeDrawtext(chars.slice(0, ci + 1).join(''));
      const tS = (tBase + ci * tGap).toFixed(2);
      const isLast = ci === chars.length - 1;
      const tE = isLast ? '4.5' : (tBase + (ci + 1) * tGap).toFixed(2);
      const fade = isLast ? "\\:alpha='if(gt(t\\," + '4.0' + ")\\,(4.5-t)/0.5\\,1)'" : '';
      typingVf += ",drawtext=fontfile='" + nameFont + "':text='" + partial + "':fontsize=70:fontcolor=white@0.95:x=(w-text_w)/2:y=(h/2)-24:enable='between(t\\," + tS + "\\," + tE + ")'" + fade;
    }
    const dtBrand = ",drawtext=fontfile='" + nameFont + "':text='WEDDING ENGINE':fontsize=13:fontcolor=white@0.35:x=(w-text_w)/2:y=(h*0.62):enable='between(t\\,0.4\\,1.8)':alpha='if(lt(t\\,0.8)\\,(t-0.4)/0.4\\,if(gt(t\\,1.4)\\,(1.8-t)/0.4\\,1))'";
    const dtDate = wDate ? ",drawtext=fontfile='" + nameFont + "':text='" + wDate + "':fontsize=15:fontcolor=white@0.4:x=(w-text_w)/2:y=(h/2)+52:enable='between(t\\,3.2\\,4.5)':alpha='if(lt(t\\,3.5)\\,(t-3.2)/0.3\\,if(gt(t\\,4.0)\\,(4.5-t)/0.5\\,1))'" : '';
    const introVf = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=24" + dtBrand + typingVf + dtDate + ",fade=t=in:st=0:d=0.8,fade=t=out:st=4.2:d=0.8";
    await execAsync('ffmpeg -y -threads 2 -i "' + introSrc + '" -vf "' + introVf + '" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 18 -an -t 5 "' + openingOut + '"', 120000);
    console.log('[Pipeline] Cinematic intro created (' + chars.length + ' chars typed)');
  } catch (e: any) {
    console.error('[Pipeline] Intro failed:', e.message?.slice(0, 200));
    try {
      const fbVf = "drawtext=fontfile='" + nameFont + "':text='" + gName + "  &  " + bName + "':fontsize=70:fontcolor=white@0.95:x=(w-text_w)/2:y=(h/2)-24:enable='between(t\\,0.8\\,4.2)':alpha='if(lt(t\\,1.2)\\,(t-0.8)/0.4\\,if(gt(t\\,3.6)\\,(4.2-t)/0.6\\,1))',fade=t=in:st=0:d=0.8,fade=t=out:st=4.0:d=1.0";
      await execAsync('ffmpeg -y -threads 2 -f lavfi -i "color=c=black:s=1280x720:d=5:r=24" -vf "' + fbVf + '" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -an -t 5 "' + openingOut + '"', 60000);
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
  if (allEndPhotos.length >= 6) { const step = (allEndPhotos.length - 1) / 5; for (let i = 0; i < 6; i++) endingPhotos.push(allEndPhotos[Math.round(i * step)]); }
  else { endingPhotos.push(...allEndPhotos); }
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



  // === STEP: Build sequence opening (vertical split reveal) ===
  const seqOut = path.join(tmpDir, 'sequence.mp4');
  try {
    const firstFrame = path.join(tmpDir, 'first_frame.png');
    await execAsync('ffmpeg -y -i "' + mainOut + '" -frames:v 1 -update 1 -q:v 2 "' + firstFrame + '"', 30000);
    await execAsync('ffmpeg -y -threads 2 -f lavfi -i "color=c=black:s=1280x720:d=1.5:r=24" -loop 1 -t 1.5 -i "' + firstFrame + '" -filter_complex "[1:v]scale=1280:720,setsar=1[img];[0:v][img]overlay=0:0:enable=1[out]" -map "[out]" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 18 -an -t 1.5 "' + seqOut + '"', 60000);
    console.log('[Pipeline] Sequence opening created (1.5s fade-in reveal)');
  } catch (e: any) {
    console.error('[Pipeline] Sequence opening failed:', e.message?.slice(0, 200));
    try { const fs2 = await import('fs'); fs2.unlinkSync(seqOut); } catch {}
  }

// === STEP D: Concat opening + main + ending ===
  const concatParts: string[] = [];
  if (fs.existsSync(openingOut)) concatParts.push(openingOut);
  if (fs.existsSync(seqOut)) concatParts.push(seqOut);
  concatParts.push(mainOut);
  if (fs.existsSync(endingOut)) concatParts.push(endingOut);

  const concatList = path.join(tmpDir, 'concat.txt');
  fs.writeFileSync(concatList, concatParts.map(p => "file '" + p + "'").join('\n'));

  const hasAudio = bgmPath && fs.existsSync(bgmPath);
  const totalDuration = 5 + (fs.existsSync(seqOut) ? 1.5 : 0) + mainDuration + endingDur;
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
