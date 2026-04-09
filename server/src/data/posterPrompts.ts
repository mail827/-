export interface PosterConcept {
  id: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'film';
  label: string;
  sub: string;
  posterPrompt: string;
  outfitBride: string;
  outfitGroom: string;
}

const OUTFIT_SPRING_BRIDE = 'soft blush pink silk organza off-shoulder wedding dress with organza petal cap sleeves fitted corset bodice with seed pearls three-tiered organza A-line skirt';
const OUTFIT_SPRING_GROOM = 'light warm grey silk-linen blend two-button suit blush pink silk shirt ivory silk tie peony boutonniere';

const OUTFIT_SUMMER_BRIDE = 'white silk mikado square-neckline wedding dress wide straps structured bodice clear glass beads along neckline flowing chiffon skirt';
const OUTFIT_SUMMER_GROOM = 'natural off-white washed silk-linen blend unlined two-button jacket relaxed shoulders matching straight-leg trousers pale water blue silk shirt collar open no tie';

const OUTFIT_AUTUMN_BRIDE = 'warm champagne ivory silk satin bias-cut V-neckline wedding dress spaghetti straps fluid column silhouette puddle train';
const OUTFIT_AUTUMN_GROOM = 'rich warm tobacco brown wool-silk blend three-button suit champagne ivory silk shirt deep wine red silk tie';

const OUTFIT_WINTER_BRIDE = 'cool silver-white silk faille high boat neckline long fitted sleeve wedding dress silk-covered buttons sculpted bodice A-line skirt chapel train';
const OUTFIT_WINTER_GROOM = 'deep charcoal black silk-wool blend two-button jacket slim notch lapels matching slim trousers silver-white silk shirt pale icy lavender silk tie black cashmere overcoat hanging open';

const OUTFIT_GRASS_BRIDE = 'light ivory silk chiffon halter-neck wedding dress with crossed draped neckline gently fitted bodice multiple sheer chiffon layers with raw-edge hemlines mid-calf length no lace no beading effortless minimal';
const OUTFIT_GRASS_GROOM = 'black wool single-breasted two-button slim fit suit natural shoulders white cotton shirt collar open no tie jacket unbuttoned casually';

const OUTFIT_RAIN_BRIDE = 'soft dove grey silk charmeuse off-shoulder wedding dress with wide gentle drape across shoulders fitted bodice with liquid mercury sheen clean A-line skirt with sweep train long fitted sheer dove grey silk organza sleeves small slate grey silk ribbon bow at center back neckline';
const OUTFIT_RAIN_GROOM = 'cool slate grey wool-silk blend single-breasted two-button suit slim notch lapels tapered trousers soft dove grey silk shirt spread collar deeper charcoal grey silk knit tie';

const OUTFIT_NIGHT_BRIDE = 'midnight navy silk velvet scoop neckline dress with thin spaghetti straps bias-cut bodice straight fluid column skirt with puddle train subtle burnout technique on lower skirt revealing sheer silk base in irregular patches thin gold chain draped across open upper back';
const OUTFIT_NIGHT_GROOM = 'deep midnight navy silk-wool blend single-breasted one-button jacket with slim shawl collar in matching navy silk satin matching slim tapered trousers black silk shirt soft point collar buttoned to top no tie single thin gold chain necklace at collar';

const OUTFIT_BLUE_BRIDE = 'dusty powder blue strapless sweetheart satin bodice wedding dress with massive voluminous cloud-like tulle ruffled skirt in graduating shades from dusty blue at waist to pale icy blue at hem hand-gathered irregular sculptural volume single pearl strand draped loosely across bodice';
const OUTFIT_BLUE_GROOM = 'slate blue-grey wool single-breasted one-button suit slim peak lapels tapered trousers white silk shirt spread collar top button undone no tie small pearl pin on left lapel';

const OUTFIT_ROSE_BRIDE = 'white ivory duchess silk satin off-shoulder wedding dress with softly draped silk across collarbone structured boned corset bodice three small blush pink silk rosettes at left shoulder full voluminous A-line skirt with long graceful train';
const OUTFIT_ROSE_GROOM = 'pale warm beige soft wool single-breasted two-button suit soft natural shoulders relaxed drape ivory cream silk tie loose four-in-hand knot white cotton dress shirt soft spread collar ivory silk pocket square';

const OUTFIT_AAO_BRIDE = 'grand ivory silk duchess satin off-shoulder wedding dress with dramatic oversized sculptural puff sleeves billowing like clouds gathered at wrists fitted boned corset bodice massive full ball gown skirt with cathedral train hundreds of tiny mismatched colorful buttons in pastel pink mint lavender butter yellow embroidered in swirling galaxy spiral pattern across entire skirt dense at center spiraling outward sparse at hem';
const OUTFIT_AAO_GROOM = 'grand ivory silk shantung double-breasted peak-lapel jacket with long dramatic silhouette past hip structured wide shoulders matching high-waisted wide-leg trousers white silk shirt buttoned to top cream silk tie single oversized googly eye pinned on left lapel';

const OUTFIT_CRUISE_SUNSET_BRIDE = 'flowing white chiffon off-shoulder wedding dress with wind-blown fabric gentle draping soft ivory silk charmeuse bodice';
const OUTFIT_CRUISE_SUNSET_GROOM = 'cream linen unstructured two-button suit jacket open collar white shirt no tie relaxed Mediterranean style';

const OUTFIT_CRUISE_BLUE_BRIDE = 'strapless ivory organza fitted bodice dress with light flowing chiffon skirt caught in sea breeze pearl drop earrings';
const OUTFIT_CRUISE_BLUE_GROOM = 'light beige summer linen suit white shirt open collar no tie clean nautical style';

const OUTFIT_TAPE_BRIDE = 'soft warm apricot silk organza off-shoulder wedding dress with sheer organza petal cap sleeves fitted bodice in pale apricot silk charmeuse three graduated tiers of weightless silk organza subtle ombre from pale apricot to soft peach seed pearls at neckline';
const OUTFIT_TAPE_GROOM = 'soft warm sand ivory washed linen-silk blend unstructured two-button suit jacket left open pale celadon green silk shirt open at collar no tie off-white canvas sneakers';

const OUTFIT_CLUE_BRIDE = 'deep emerald green silk taffeta cocktail-length dress clean square neckline wide shoulder straps structured fitted bodice full playful A-line skirt ending at mid-calf with petticoat volume oversized handmade crimson red silk camellia flower at left waist';
const OUTFIT_CLUE_GROOM = 'warm tobacco brown corduroy two-button suit slim notch lapels cream white cotton shirt soft rounded collar deep crimson red knit tie emerald green enamel arrow pin on left lapel dark brown leather desert boots';

const OUTFIT_TUNGSTEN_BRIDE = 'ivory floral cotton lace high Victorian neckline wedding dress with bishop sleeves gathered at wrist with lace cuffs entire bodice and sleeves of dense floral cotton lace with white silk lining beneath natural waistline with thin white satin ribbon belt skirt falling in relaxed straight column with slight flare at hem in matching lace over silk simple fingertip-length tulle veil';
const OUTFIT_TUNGSTEN_GROOM = 'dark navy wool single-breasted two-button suit with slightly wide notch lapels in relaxed vintage cut not slim-fit straight-leg trousers with gentle break white cotton dress shirt with soft rounded collar muted dusty lavender silk tie in slightly loose knot';

export const POSTER_CONCEPTS: PosterConcept[] = [
  {
    id: 'spring_field',
    season: 'spring',
    label: '봄: 벚꽃 들판',
    sub: '하늘 아래 단 하나의 나무',
    outfitBride: OUTFIT_SPRING_BRIDE,
    outfitGroom: OUTFIT_SPRING_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot from slightly low angle. A vast open field with a single enormous cherry blossom tree in full bloom centered in the upper half of the frame against pale white sky. The couple stands prominently from waist up, woman wearing ${OUTFIT_SPRING_BRIDE}, man wearing ${OUTFIT_SPRING_GROOM}. Cherry blossom petals drift across the field like slow pink snow. The tree canopy and sky occupy the upper 40 percent of the frame leaving generous negative space. Soft flat overcast light with no harsh shadows. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, 8k`,
  },
  {
    id: 'spring_tunnel',
    season: 'spring',
    label: '봄: 벚꽃 터널',
    sub: '페달을 밟는 봄날',
    outfitBride: OUTFIT_SPRING_BRIDE,
    outfitGroom: OUTFIT_SPRING_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot looking down a long tree-lined path. Cherry blossom trees on both sides form a dense pink canopy arch in the upper half of the frame. Fallen petals cover the ground like a pink carpet. The couple rides an old bicycle through the tunnel of blossoms, woman wearing ${OUTFIT_SPRING_BRIDE} sitting sideways on rear rack skirt flowing, man wearing ${OUTFIT_SPRING_GROOM} pedaling, motion blur on wheels. The blossom canopy overhead fills the upper 40 percent creating natural text space. Warm golden late afternoon backlight filtering through petals. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, 8k`,
  },
  {
    id: 'spring_steps',
    season: 'spring',
    label: '봄: 석조 계단',
    sub: '말하지 못한 것들',
    outfitBride: OUTFIT_SPRING_BRIDE,
    outfitGroom: OUTFIT_SPRING_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot at grand old building with tall stone columns. The couple sits on the wide stone steps, woman wearing ${OUTFIT_SPRING_BRIDE} skirt spread across steps, man wearing ${OUTFIT_SPRING_GROOM}. Cherry blossom trees line the walkway fully bloomed petals falling. The massive columns and building architecture fill the upper portion of the frame providing monumental negative space. Late afternoon side light casting long shadows across the steps. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, 8k`,
  },
  {
    id: 'summer_storm',
    season: 'summer',
    label: '여름: 보리밭 폭풍',
    sub: '모든 것이 바뀌기 직전',
    outfitBride: OUTFIT_SUMMER_BRIDE,
    outfitGroom: OUTFIT_SUMMER_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot in a golden barley field. The sky is split dramatically, half brilliant blue on the right and half dark thundercloud rolling in from the left. The couple stands facing the approaching storm, woman wearing ${OUTFIT_SUMMER_BRIDE} chiffon skirt pressed by wind, man wearing ${OUTFIT_SUMMER_GROOM} jacket flapping open. The barley bends in golden waves. The dramatic split sky fills the upper 50 percent of the frame. Warm golden sun from right cool storm light from left. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, the moment before everything changes, 8k`,
  },
  {
    id: 'summer_tree',
    season: 'summer',
    label: '여름: 나무 그늘',
    sub: '매미 소리가 들리는 오후',
    outfitBride: OUTFIT_SUMMER_BRIDE,
    outfitGroom: OUTFIT_SUMMER_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot under a massive old tree in the center of a wide open grass field on a blazing summer afternoon. The enormous tree canopy fills the upper half of the frame, dense green leaves with dappled sunlight breaking through. The couple is beneath the tree, woman lying on grass in ${OUTFIT_SUMMER_BRIDE} chiffon skirt spread around her, man sitting against trunk in ${OUTFIT_SUMMER_GROOM} reading. The field beyond the shade is blown-out white from intense sun. Deep cool shadow under tree contrasts scorching bright field. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, still and heavy with summer heat, 8k`,
  },
  {
    id: 'summer_rainbow',
    season: 'summer',
    label: '여름: 비 갠 후',
    sub: '폭풍이 지나간 자리',
    outfitBride: OUTFIT_SUMMER_BRIDE,
    outfitGroom: OUTFIT_SUMMER_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot in a golden barley field after sudden summer rain. Everything wet and steaming in the returning sun. The sky is half dark cloud retreating right and half clear golden light breaking through left. A faint rainbow arc stretches across the upper portion of the frame. The couple stands prominently, soaked, woman in ${OUTFIT_SUMMER_BRIDE} clinging with rain, man in ${OUTFIT_SUMMER_GROOM} darkened with water. Golden mist rises from the wet ground catching the light. The rainbow and dramatic sky fill the upper 45 percent. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, the storm is over and everything glistens, 8k`,
  },
  {
    id: 'autumn_alley',
    season: 'autumn',
    label: '가을: 은행잎 골목',
    sub: '금빛으로 물든 귀갓길',
    outfitBride: OUTFIT_AUTUMN_BRIDE,
    outfitGroom: OUTFIT_AUTUMN_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot in a narrow Korean residential alley filled with intense golden sunset light. Low apartment walls on both sides, potted plants, a bicycle leaning against a wall. Yellow ginkgo leaves blanket the entire ground like a golden carpet. The couple walks through the alley from behind, woman in ${OUTFIT_AUTUMN_BRIDE} puddle train dragging through ginkgo leaves, man in ${OUTFIT_AUTUMN_GROOM}. Their long shadows stretch toward camera. The alley and golden light fill the upper 60 percent of the frame. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, everything is gold quiet and unhurried, 8k`,
  },
  {
    id: 'autumn_crossing',
    season: 'autumn',
    label: '가을: 건널목',
    sub: '차단기 너머로',
    outfitBride: OUTFIT_AUTUMN_BRIDE,
    outfitGroom: OUTFIT_AUTUMN_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot at a small railroad crossing in a quiet town. The red and white barrier arm lowered horizontally across the frame. Autumn trees with deep orange and red leaves line both sides of the tracks forming a fiery canopy in the upper half of the frame. The couple stands one on each side of the barrier, woman in ${OUTFIT_AUTUMN_BRIDE}, man in ${OUTFIT_AUTUMN_GROOM}. They face each other across the barrier calmly. The burning autumn canopy and sky fill the upper 45 percent. Late afternoon golden light making leaves glow like fire. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, composed and resigned, 8k`,
  },
  {
    id: 'autumn_rooftop',
    season: 'autumn',
    label: '가을: 옥상 석양',
    sub: '그가 찍는 마지막 사진',
    outfitBride: OUTFIT_AUTUMN_BRIDE,
    outfitGroom: OUTFIT_AUTUMN_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot on a Korean apartment rooftop at sunset. The sky fills the upper half of the frame in deep orange fading to purple at the top. A clothesline with white bedsheets and his brown jacket stretches across the middle ground. The couple is in the lower third, man sitting on low concrete ledge photographing her with old film camera champagne shirt wine red tie loosened, woman standing facing him in ${OUTFIT_AUTUMN_BRIDE} golden in the last light. The dramatic sunset sky provides generous text space in the upper 50 percent. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, the most important photograph he will ever take, 8k`,
  },
  {
    id: 'winter_tracks',
    season: 'winter',
    label: '겨울: 눈 기찻길',
    sub: '세상이 지워진 자리',
    outfitBride: OUTFIT_WINTER_BRIDE,
    outfitGroom: OUTFIT_WINTER_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot on snow-covered train tracks. Flat white snow covers everything, the tracks are faint parallel lines disappearing into fog. Heavy grey overcast sky blending seamlessly into the white ground with no visible horizon. The couple stands small in the lower third on the rails, woman in ${OUTFIT_WINTER_BRIDE} nearly invisible against white snow only dark hair distinguishing her, man in ${OUTFIT_WINTER_GROOM} stark against white. They hold hands across the gap between the rails. The vast empty white sky fills the upper 55 percent. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, two people are the only proof this world is inhabited, 8k`,
  },
  {
    id: 'winter_dance',
    season: 'winter',
    label: '겨울: 눈밭의 춤',
    sub: '음악 없이 추는 왈츠',
    outfitBride: OUTFIT_WINTER_BRIDE,
    outfitGroom: OUTFIT_WINTER_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot in an open snow field at night during heavy snowfall. Black sky fills the upper half of the frame. A single distant streetlamp far behind the couple creates a warm orange point of light in the upper background. The couple dances slowly, woman in ${OUTFIT_WINTER_BRIDE} ghostly against snow, man in ${OUTFIT_WINTER_GROOM} a dark shape against white. Foreheads pressed together. Snowflakes stretched into long white diagonal lines by slow shutter. The dark sky and falling snow fill the upper 50 percent. Photorealistic, 50mm portrait lens, slow shutter motion blur, cinematic photograph, analog film grain, a half-remembered dream in the cold, 8k`,
  },
  {
    id: 'winter_candles',
    season: 'winter',
    label: '겨울: 촛불',
    sub: '얼어붙은 세상의 유일한 온기',
    outfitBride: OUTFIT_WINTER_BRIDE,
    outfitGroom: OUTFIT_WINTER_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot in a small bare room with old wooden floor and peeling wallpaper. No electricity. The room is dark and cold. The couple sits on the floor in the empty room. Mismatched candles of different heights placed around them in a rough circle are the only light source. Woman in ${OUTFIT_WINTER_BRIDE} pooling around her glowing gold in candlelight. Man in ${OUTFIT_WINTER_GROOM} behind her wrapping his arms around her, black overcoat spread beneath them. The dark ceiling and walls fill the upper 55 percent of the frame in deep shadow. Warm amber candlelight on their faces contrasts the freezing dark room. Their breath faintly visible despite the candles. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, fragile warmth inside hostile cold, 8k`,
  },
  {
    id: 'memoir_playground',
    season: 'film',
    label: '서머 테이프: 운동장',
    sub: '하루가 끝나는 줄 모르는 사람들',
    outfitBride: OUTFIT_TAPE_BRIDE,
    outfitGroom: OUTFIT_TAPE_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot. Empty school playground at golden hour, sun minutes from setting. Old green-painted iron bench beside rusted pull-up bars. Long shadows of pull-up bars stretch across dusty playground like sundial lines. She sits on bench, ${OUTFIT_TAPE_BRIDE} glowing deep warm gold in low sun, tiered skirt spread on bench. He lies on bench with head in her lap, ${OUTFIT_TAPE_GROOM} turned warm amber in sunset light, eyes closed. Her hand rests on his forehead fingers in his hair. Silver camcorder sits upright on bench arm, LCD screen open recording, red light blinking. Entire image heavily overexposed, edges dissolving into pure warm white, lens flare streaking across upper right corner. The blown-out golden sky fills the upper 50 percent. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, a small machine remembers this for them, 8k`,
  },
  {
    id: 'memoir_corridor',
    season: 'film',
    label: '서머 테이프: 복도',
    sub: '창문은 시간이고 그녀는 지나간다',
    outfitBride: OUTFIT_TAPE_BRIDE,
    outfitGroom: OUTFIT_TAPE_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot. Long empty school corridor with old wooden floor and tall windows on right side. Afternoon sun pouring through windows creating five sharp rectangles of golden light on dark wooden floor with deep shadows between. She walks ahead through the light rectangles, ${OUTFIT_TAPE_BRIDE} flaring as she moves through alternating bands of blinding gold and cool mauve shadow. He walks behind her in ${OUTFIT_TAPE_GROOM}, holding silver camcorder filming her back. Dust motes thick in light shafts like golden snow. She looks back over bare shoulder mid-laugh, face half in sun half in shadow. The corridor ceiling and repeating windows fill the upper 45 percent of the frame. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, each window is a year, 8k`,
  },
  {
    id: 'memoir_stairwell',
    season: 'film',
    label: '서머 테이프: 계단',
    sub: '빛이 말하는 것',
    outfitBride: OUTFIT_TAPE_BRIDE,
    outfitGroom: OUTFIT_TAPE_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot. Old concrete school stairwell between floors, shot from above looking down. He sits on stairs three steps above her, ${OUTFIT_TAPE_GROOM}, elbows on knees. She sits on landing below, ${OUTFIT_TAPE_BRIDE} pooling on concrete, train cascading down two steps behind her. She has turned and faces upward toward him, her expression reshaped into something with more weight. One window on stairwell wall lets in single shaft of warm amber light cutting horizontally between them like a visible sentence hanging in air. Dust particles in the light shaft. Below the landing is shadow, above him is shadow. They exist only in this one floor of light. The dark stairwell ceiling and upper shadows fill the upper 50 percent. Photorealistic, 85mm portrait lens, deep depth of field, cinematic photograph, the light separates them like glass, 8k`,
  },
  {
    id: 'clue_carousel',
    season: 'film',
    label: '루즈 클루: 회전목마',
    sub: '닿을 듯 닿지 않는',
    outfitBride: OUTFIT_CLUE_BRIDE,
    outfitGroom: OUTFIT_CLUE_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot. Old carousel in a small park at dusk. She rides a painted white wooden horse sidesaddle, ${OUTFIT_CLUE_BRIDE} spread over painted saddle, one hand gripping brass pole, other hand trailing behind reaching toward him. He stands on carousel platform beside her horse, ${OUTFIT_CLUE_GROOM}, one hand holding brass pole, other hand reaching toward her trailing hand. Fingertips almost touching as carousel turns slowly. A red arrow painted on the carousel floor points in a circle. Carousel string lights in warm yellow bulbs overhead, mixed with cool blue dusk sky between canopy gaps. The ornate carousel canopy with gilded decoration and warm string lights fills the upper 45 percent of the frame. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, almost touching is more than touching, 8k`,
  },
  {
    id: 'clue_reddoor',
    season: 'film',
    label: '루즈 클루: 빨간 문',
    sub: '모든 화살표는 널 가리키고 있었다',
    outfitBride: OUTFIT_CLUE_BRIDE,
    outfitGroom: OUTFIT_CLUE_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot. Quiet cobblestone alley at evening, vivid crimson red painted wooden door with warm yellow streetlamp above, green ivy climbing stone walls. She stands with back against the closed red door, ${OUTFIT_CLUE_BRIDE} vivid emerald against crimson paint, crimson camellia at waist disappearing into the red door behind her. She looks directly at him, no more hiding. He stands close in front of her, ${OUTFIT_CLUE_GROOM}, holding five opened cards in one hand at his side, other hand resting on the red door beside her head. A red arrow sticker on the cobblestone at their feet points at the door, at her, it was always pointing at her. The stone wall, ivy, and warm streetlamp glow fill the upper 45 percent. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, every arrow led here, 8k`,
  },
  {
    id: 'clue_records',
    season: 'film',
    label: '루즈 클루: 레코드샵',
    sub: '세 장 건너의 사랑',
    outfitBride: OUTFIT_CLUE_BRIDE,
    outfitGroom: OUTFIT_CLUE_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot. Tiny cramped vintage record shop, walls lined floor to ceiling with LP sleeves in rainbow of worn cardboard spines creating mosaic of muted color. She stands in narrow aisle flipping through records in a bin, ${OUTFIT_CLUE_BRIDE} compressed between packed shelves. He stands in parallel aisle on other side of same double-sided record bin, ${OUTFIT_CLUE_GROOM}. The record bin divides them at chest height. They flip through records from opposite sides, fingers moving toward each other through LP sleeves without seeing. A red arrow sticker is stuck to the spine of the LP between their approaching hands. Warm tungsten light from single hanging bulb above. The packed LP shelves and hanging bulb fill the upper 40 percent. Photorealistic, 50mm portrait lens, deep depth of field, cinematic photograph, their fingers tell a story their eyes cannot see, 8k`,
  },
  {
    id: 'tungsten_sofa',
    season: 'film',
    label: '텅스텐: 꽃소파',
    sub: '1979년, 우리의 처음',
    outfitBride: OUTFIT_TUNGSTEN_BRIDE,
    outfitGroom: OUTFIT_TUNGSTEN_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot. A Korean couple sitting on a floral velvet sofa in a dark maximalist vintage room. Large rose and tropical leaf wallpaper in deep red and green covering the entire wall behind them. An old CRT television to one side showing warm static glow, tropical houseplants, floor lamp with fabric shade. Woman wearing ${OUTFIT_TUNGSTEN_BRIDE}. Man wearing ${OUTFIT_TUNGSTEN_GROOM}. They sit close together, she holds his hand on her lap, both smiling warmly at camera. Shot with direct on-camera flash, faces brightly lit but background falls dark quickly beyond two meters. Faded warm print colors with magenta tint in highlights and yellow shift in midtones. The dark floral wallpaper and CRT television fill the upper 45 percent of the frame. Looks like a scanned photograph from a 1979 wedding album. Photorealistic, 50mm lens, celluloid grain, 8k`,
  },
  {
    id: 'tungsten_stairs',
    season: 'film',
    label: '텅스텐: 계단',
    sub: '내려오는 그녀를 기다리는 시간',
    outfitBride: OUTFIT_TUNGSTEN_BRIDE,
    outfitGroom: OUTFIT_TUNGSTEN_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot. A Korean couple on a narrow dark wood staircase with faded floral carpet runner and old framed family photos on the dark wooden wall. She descends the stairs in ${OUTFIT_TUNGSTEN_BRIDE}, veil trailing on stairs behind her, one hand on dark wooden banister. He waits at the bottom in ${OUTFIT_TUNGSTEN_GROOM}, hand extended upward toward her. A single bare warm Edison bulb hanging in the stairwell overhead is the only light source casting warm amber glow. Shot with on-camera flash from the bottom of stairs creating harsh bright light on her face with strong shadow behind her on the wall. The flash falls off leaving the top of the staircase in deep darkness. The dark stairwell ceiling and upper wall with framed photos fill the upper 50 percent. Faded print colors with orange-shifted highlights. 1976 amateur photography aesthetic. Photorealistic, 50mm lens, celluloid grain, 8k`,
  },
  {
    id: 'tungsten_formal',
    season: 'film',
    label: '텅스텐: 스튜디오 포트레이트',
    sub: '1977년 소도시의 작은 사진관',
    outfitBride: OUTFIT_TUNGSTEN_BRIDE,
    outfitGroom: OUTFIT_TUNGSTEN_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium full body shot. A Korean couple standing side by side facing camera for a formal wedding portrait. A mottled grey-brown canvas studio backdrop fills the entire background seamlessly with no edges visible. Woman wearing ${OUTFIT_TUNGSTEN_BRIDE}, holding a small round bouquet of white fabric flowers at her waist. Man wearing ${OUTFIT_TUNGSTEN_GROOM}, standing straight with both arms at sides. Both have tight polite closed-mouth smiles with chins slightly raised. Flat even studio lighting with very faint soft shadow behind them. Skin slightly pale and washed out from overexposure. Perfectly centered symmetrical composition. The grey-brown backdrop fills the upper 55 percent providing generous text space. A formal wedding studio portrait from a small Korean town in 1977. Slight warm magenta cast from aged photo paper. Photorealistic, 50mm lens, sharp focus, 8k`,
  },
  {
    id: 'cruise_sunset',
    season: 'summer',
    label: '크루즈: 선셋',
    sub: '수평선 너머 마지막 빛',
    outfitBride: OUTFIT_CRUISE_SUNSET_BRIDE,
    outfitGroom: OUTFIT_CRUISE_SUNSET_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot on luxury yacht deck at golden hour. The couple stands at the railing looking at each other, woman wearing ${OUTFIT_CRUISE_SUNSET_BRIDE} fabric flowing in warm sea breeze, man wearing ${OUTFIT_CRUISE_SUNSET_GROOM}. Behind them the Mediterranean sea stretches to the horizon in deep turquoise fading to molten gold where sun meets water. The sun is low and large, casting long warm amber light across the polished teak deck. The vast golden sky and ocean fill the upper 50 percent of the frame with generous negative space. Warm cinematic golden hour light. Photorealistic, 85mm portrait lens, shallow depth of field, cinematic photograph, 8k`,
  },
  {
    id: 'cruise_bluesky',
    season: 'summer',
    label: '크루즈: 블루스카이',
    sub: '끝이 없는 푸른 앞에서',
    outfitBride: OUTFIT_CRUISE_BLUE_BRIDE,
    outfitGroom: OUTFIT_CRUISE_BLUE_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot on luxury cruise ship upper deck under vivid clear blue sky. The couple embraces naturally at white yacht railing, woman wearing ${OUTFIT_CRUISE_BLUE_BRIDE} caught in fresh sea breeze, man wearing ${OUTFIT_CRUISE_BLUE_GROOM}. Crystal clear deep blue ocean stretches to sharp horizon line. White ship railing and polished deck floor frame the lower portion. The vast clean blue sky fills the upper 55 percent of the frame as pure negative space. Bright natural midday sunlight with crisp shadows. Photorealistic, 85mm portrait lens, deep depth of field, cinematic photograph, 8k`,
  },
  {
    id: 'grass_walk',
    season: 'summer',
    label: '풀밭: 빗속 산책',
    sub: '젖은 풀 위로 걷는 길',
    outfitBride: OUTFIT_GRASS_BRIDE,
    outfitGroom: OUTFIT_GRASS_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot from behind at low waist level. A couple walking away from camera up a gentle green grassy slope on a grey rainy day. Fine rain mist visible in the air. Tall grass and small white wildflowers blurred in the foreground framing the bottom. Woman wearing ${OUTFIT_GRASS_BRIDE} wet hem dragging through tall wet grass hair slightly damp. Man wearing ${OUTFIT_GRASS_GROOM} jacket damp on shoulders his arm around her waist. Distant treeline barely visible through low hanging mist. Heavy grey overcast sky fills the upper 55 percent of the frame as generous negative space. Completely flat grey diffused light no sun. Grainy analog film photograph shot on Fuji Superia 400 muted desaturated green-grey tones heavy grain soft focus. Photorealistic, 50mm lens, 8k`,
  },
  {
    id: 'grass_rain',
    season: 'summer',
    label: '풀밭: 빗속의 비',
    sub: '빗속에 누운 채로',
    outfitBride: OUTFIT_GRASS_BRIDE,
    outfitGroom: OUTFIT_GRASS_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Overhead view looking straight down. A couple lying on wet dark green grass after rain. Tiny water droplets on grass blades around them. Woman wearing ${OUTFIT_GRASS_BRIDE} damp sheer layers clinging to wet grass hair damp sticking slightly to forehead laughing looking up at grey sky. Man wearing ${OUTFIT_GRASS_GROOM} looking at her smiling. A few white wildflowers scattered in the grass near them. Heavy overcast grey sky light flat and soft. The dark green grass fills the entire frame with their bodies in the lower 60 percent leaving the upper portion as textured green negative space. Grainy analog film photograph shot on Fuji Superia 400 color shift toward green and grey heavy grain slightly underexposed. Photorealistic, 50mm lens, 8k`,
  },
  {
    id: 'grass_forehead',
    season: 'summer',
    label: '풀밭: 이마를 맞대고',
    sub: '빗속에서 빗속으로',
    outfitBride: OUTFIT_GRASS_BRIDE,
    outfitGroom: OUTFIT_GRASS_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Close-up medium shot. A couple standing forehead to forehead in a wide green field on a rainy day. Woman wearing ${OUTFIT_GRASS_BRIDE} wet hair sticking to her cheeks eyes closed soft smile raindrops on skin. Man wearing ${OUTFIT_GRASS_GROOM} damp from rain eyes closed. Fine rain falling around them. The vast green field and grey overcast sky stretch behind them with the blurred grassy background filling the upper 50 percent as soft green negative space. Completely flat grey light. Shallow depth of field dissolving background into green blur. Grainy analog film photograph shot on Fuji Pro 400H muted green-grey tones heavy grain soft focus. Photorealistic, 85mm lens, 8k`,
  },
  {
    id: 'rain_cafe',
    season: 'autumn',
    label: '비: 창 너머로',
    sub: '안과 밖의 온도',
    outfitBride: OUTFIT_RAIN_BRIDE,
    outfitGroom: OUTFIT_RAIN_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Shot from outside a small old cafe looking through a rain-streaked window. The glass is fogged with warm condensation from inside. Rain runs down the outside of the glass in slow rivulets. Through the blurred foggy glass the couple sits at a small wooden table inside the warm amber-lit cafe. Woman wearing ${OUTFIT_RAIN_BRIDE} glowing warm in interior light, she traces a small heart shape with her fingertip on the fogged glass. Man wearing ${OUTFIT_RAIN_GROOM} watching her draw on the glass smiling. Two cups of something warm on the table between them steam rising. The rain-streaked glass surface fills the entire frame, the dark wet brick wall and street lamp outside frame the upper 40 percent as dark negative space. Focus on the rain-streaked glass surface. Photorealistic, 50mm lens, warm inside cold outside, 8k`,
  },
  {
    id: 'rain_bridge',
    season: 'autumn',
    label: '비: 다리 위에서',
    sub: '흘러가는 물 위의 시간',
    outfitBride: OUTFIT_RAIN_BRIDE,
    outfitGroom: OUTFIT_RAIN_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot from slightly above. A couple standing on a small old stone pedestrian bridge over a swollen stream in light drizzle at dusk. Dark water below catching pale remaining light with tiny rain circles on surface. Woman wearing ${OUTFIT_RAIN_BRIDE} wet silk train hanging over bridge edge trailing toward water standing at stone railing looking at him. Man wearing ${OUTFIT_RAIN_GROOM} leaning forearms on railing looking down at water. The dark swollen stream and purple-grey dusk sky fill the upper 50 percent of the frame. Flat purple-grey dusk light no warmth diffused through rain clouds. The entire image nearly monochrome only skin tones have any warmth. Photorealistic, 40mm lens, 8k`,
  },
  {
    id: 'rain_busstop',
    season: 'autumn',
    label: '비: 버스 정류장',
    sub: '비가 그를 데려왔다',
    outfitBride: OUTFIT_RAIN_BRIDE,
    outfitGroom: OUTFIT_RAIN_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot. A couple sitting together on a wooden bench inside a small old bus stop shelter at night in heavy rain. Metal roof shelter on two poles. Woman wearing ${OUTFIT_RAIN_BRIDE} damp and dark silver sheer organza sleeves she rests her head on his shoulder eyes closed. Man wearing ${OUTFIT_RAIN_GROOM} soaked through clinging no tie he rests his head on top of hers eyes closed. A clear vinyl umbrella lies closed on the ground at their feet abandoned. Rain pours in silver lines beyond the shelter edge. A single flickering fluorescent tube in the shelter ceiling casts flat cool light. The wet street reflects the fluorescent light and their two still figures doubled in the dark water on the asphalt. The dark rainy night sky and silver rain streaks fill the upper 50 percent of the frame. Photorealistic, 50mm lens, 8k`,
  },
  {
    id: 'night_crosswalk',
    season: 'autumn',
    label: '나이트: 횟단보도',
    sub: '새벽 2시, 갈 곳 없는 밤',
    outfitBride: OUTFIT_NIGHT_BRIDE,
    outfitGroom: OUTFIT_NIGHT_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot from street level camera on the ground looking up. A couple crossing a wide empty city crosswalk at night. White zebra stripes glowing under harsh overhead sodium streetlamps. The intersection is empty no cars no people just vast painted asphalt and traffic lights cycling for no one. Woman walking in front wearing ${OUTFIT_NIGHT_BRIDE} column skirt brushing the white painted lines gold back chain catching streetlight. Man walking a step behind wearing ${OUTFIT_NIGHT_GROOM} hands in trouser pockets. Red traffic light casts a wash of red across wet asphalt to their left. Green pharmacy cross sign glows on a building behind them to the right. Their long shadows from overhead sodium lamp stretch sharp beneath them on the white stripes. The buildings and dark night sky fill the upper 50 percent of the frame. Photorealistic, 28mm wide lens, urban and electric, 8k`,
  },
  {
    id: 'night_rooftop',
    season: 'autumn',
    label: '나이트: 옥상 주차장',
    sub: '콘크리트 위의 밤하늘',
    outfitBride: OUTFIT_NIGHT_BRIDE,
    outfitGroom: OUTFIT_NIGHT_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot. A couple on the empty top floor of a multi-story parking garage at night. Open air no roof. Concrete floor with faded parking lines and oil stains. City skyline visible in the background with scattered lit office windows and red aircraft warning lights on rooftops. Woman sitting on the concrete barrier wall at the edge wearing ${OUTFIT_NIGHT_BRIDE} legs dangling over the edge toward the city view burnout patches letting city lights glow through fabric. Man standing behind the barrier leaning on it beside her wearing ${OUTFIT_NIGHT_GROOM} looking out at the skyline. A single harsh security fluorescent tube behind them casts flat greenish light on concrete but their faces are lit by softer distant amber glow of the city below. Wind moves her hair sideways. The dark night sky and city skyline fill the upper 55 percent of the frame. Photorealistic, 35mm lens, brutalist and cold but the city below is alive, 8k`,
  },
  {
    id: 'night_dawn',
    season: 'autumn',
    label: '나이트: 새벽',
    sub: '가장 긴 밤이 끝나고',
    outfitBride: OUTFIT_NIGHT_BRIDE,
    outfitGroom: OUTFIT_NIGHT_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot with telephoto compression. A couple on a parking garage rooftop at first light of dawn. City skyline silhouetted dark against a sky that is deep indigo at the top fading to pale steel blue at the horizon with a faint thin line of warm peach light beginning between dark buildings. Office windows mostly dark now neon signs off the city finally quiet. Woman standing at concrete barrier edge wearing ${OUTFIT_NIGHT_BRIDE} now reading almost black in predawn blue burnout sheer patches showing skin cold and blue-grey. Man standing behind her wearing ${OUTFIT_NIGHT_GROOM} wrapping arms around her from behind chin on top of her head. Both face the horizon. The deep indigo-to-peach dawn sky and silhouetted skyline fill the upper 55 percent of the frame as cinematic negative space. The gold chains on both catch the first warm photon as two tiny gold sparks the only warm color in the entire blue frame. Photorealistic, 85mm telephoto, the longest night is ending, 8k`,
  },
  {
    id: 'blue_ice',
    season: 'winter',
    label: '블루: 얼음 위에서',
    sub: '금이 가는 기억의 무게',
    outfitBride: OUTFIT_BLUE_BRIDE,
    outfitGroom: OUTFIT_BLUE_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Directly overhead bird-eye view looking straight down. A couple lying on their backs on a frozen cracked ice surface. Woman wearing ${OUTFIT_BLUE_BRIDE} with the massive blue tulle skirt fanned out across white ice like spilled ink dissolving in water hair spread across the ice. Man lying beside her wearing ${OUTFIT_BLUE_GROOM}. Their heads close together but bodies angled apart forming a V shape. Both stare straight up at camera with quiet calm expressions. Hairline cracks in the ice radiating outward from beneath them. The white cracked ice fills the upper 55 percent of the frame as vast cold negative space. Flat cold overcast light from above casting no shadows. Blue tulle against white ice is the only color in the frame. Photorealistic, 24mm wide lens, symmetrical composition, heavy grain, Kodak Vision3 500T blue-shifted color, 8k`,
  },
  {
    id: 'blue_spin',
    season: 'winter',
    label: '블루: 기억의 소용돌이',
    sub: '붙잡을 수 없는 기억',
    outfitBride: OUTFIT_BLUE_BRIDE,
    outfitGroom: OUTFIT_BLUE_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Abstract motion-blurred image of a couple spinning in an empty white room. Woman in ${OUTFIT_BLUE_BRIDE} and man in ${OUTFIT_BLUE_GROOM} captured at extremely slow shutter speed creating circular sweeping streaks of blue and grey against pure white. At the center where they hold each other a brief moment of sharpness shows her face buried in his neck his hand on back of her head. The blue tulle skirt creates sweeping arcs of watercolor-like brushstrokes across the white void. The pure white background fills the upper 50 percent of the frame as clean negative space. Everything else is pure motion and blur. Shot on analog film with quarter second shutter speed extreme motion blur heavy grain dreamy and disorienting. Photorealistic, 50mm lens, 8k`,
  },
  {
    id: 'blue_bookstore',
    season: 'winter',
    label: '블루: 도서관',
    sub: '책 사이에 숨겨둔 시간',
    outfitBride: OUTFIT_BLUE_BRIDE,
    outfitGroom: OUTFIT_BLUE_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot. A couple hiding between tall wooden bookshelves in a dimly lit old bookstore. Woman crouching low between stacks of books wearing ${OUTFIT_BLUE_BRIDE} voluminous tulle skirt compressed and squeezed between the shelves pearl strand across bodice she presses a finger to her lips looking up at camera with playful eyes. Man standing above her leaning against the bookshelf wearing ${OUTFIT_BLUE_GROOM} looking down at her smiling. Warm single desk lamp at the end of the aisle casting long shadows through gaps between books. Dust particles floating in the lamplight beam. The dark bookshelves and warm lamplight fill the upper 50 percent of the frame. Deep shadow everywhere except the warm tungsten lamp pool. Photorealistic, 50mm lens, shallow depth of field with books in foreground blurred, heavy grain, warm tungsten and cool shadow split, 8k`,
  },
  {
    id: 'rose_salon',
    season: 'spring',
    label: '장미: 로코코 살롱',
    sub: '마카롱을 베어 물던 오후',
    outfitBride: OUTFIT_ROSE_BRIDE,
    outfitGroom: OUTFIT_ROSE_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot. A couple inside a lavish rococo-style salon with pale pink walls gilded ornate mirrors and white iron trellis panels covered in climbing pink roses. Crystal chandelier with dripping candle lights above. Woman sitting sideways on a gilded pink velvet chaise longue laughing mid-bite into a pale pink macaron wearing ${OUTFIT_ROSE_BRIDE} train cascading across the floor. Man leaning on the back of the chaise looking down at her with amused grin wearing ${OUTFIT_ROSE_GROOM}. Scattered rose petals and macarons on a small gold tray beside her. The crystal chandelier pale pink ceiling and gilded molding fill the upper 45 percent of the frame as ornate negative space. Soft diffused natural window light with gentle pastel pink color cast. Dreamy hazy atmosphere. Photorealistic editorial photograph, 50mm lens, shallow depth of field, film grain, 8k`,
  },
  {
    id: 'rose_mirror',
    season: 'spring',
    label: '장미: 거울',
    sub: '거울 속에서 만나는 눈',
    outfitBride: OUTFIT_ROSE_BRIDE,
    outfitGroom: OUTFIT_ROSE_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot from three-quarter back angle. A couple in a rococo salon with pale pink walls gilded ornate mirrors pink rose trellis. Woman standing facing a large gilded mirror adjusting a rosette on her shoulder wearing ${OUTFIT_ROSE_BRIDE}. Man standing behind her wearing ${OUTFIT_ROSE_GROOM}. Their eyes meeting through the mirror reflection both smiling softly. The mirror shows their faces while camera sees their backs. The gilded mirror frame pink climbing roses and pale pink wall fill the upper 50 percent of the frame. Soft diffused pastel pink light dreamy haze. Photorealistic editorial photograph, 50mm lens, shallow depth of field, film grain, 8k`,
  },
  {
    id: 'rose_balcony',
    season: 'spring',
    label: '장미: 발코니',
    sub: '프렌치 도어 너머로',
    outfitBride: OUTFIT_ROSE_BRIDE,
    outfitGroom: OUTFIT_ROSE_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot from inside the room looking through open French doors. A couple standing on a small ornate stone balcony overlooking a pink rose garden below. Rococo pale pink exterior wall with gilded window frame behind them. Woman wearing ${OUTFIT_ROSE_BRIDE} she rests her head on his shoulder. Man wearing ${OUTFIT_ROSE_GROOM} they lean on the stone balustrade side by side. Pink climbing roses around the doorframe framing them. The French door frame pink roses and pale pink wall fill the upper 45 percent of the frame. Soft overcast afternoon light. Photorealistic editorial photograph, 50mm lens, shallow depth of field, film grain, 8k`,
  },
  {
    id: 'aao_pool',
    season: 'film',
    label: '에에올: 빈 수영장',
    sub: '바닥에 누운 우주',
    outfitBride: OUTFIT_AAO_BRIDE,
    outfitGroom: OUTFIT_AAO_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Shot from the pool edge looking straight down. A couple at the bottom of a large empty drained outdoor swimming pool. Cracked pale blue tiles on floor and walls dead leaves collected in corners old lane dividers rusted and collapsed. No water. Bright harsh midday sun directly overhead casting short deep shadows straight down. Woman wearing ${OUTFIT_AAO_BRIDE} button galaxy skirt spread across cracked blue tiles colorful buttons echoing scattered tile fragments she sits on pool floor knees up arms wrapped around them. Man wearing ${OUTFIT_AAO_GROOM} lying flat on his back beside her staring straight up at camera. The cracked blue tile pool walls and concrete edge fill the upper 45 percent of the frame as geometric negative space. Harsh noon shadow no romance in the light. Photorealistic, 28mm wide lens, geometric and lonely but together, 8k`,
  },
  {
    id: 'aao_subway',
    season: 'film',
    label: '에에올: 지하철',
    sub: '처음처럼 보는 눈',
    outfitBride: OUTFIT_AAO_BRIDE,
    outfitGroom: OUTFIT_AAO_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot centered symmetrical composition. Inside an empty late-night subway car with harsh fluorescent tube lighting and orange plastic seats. Woman sitting on one side wearing ${OUTFIT_AAO_BRIDE} button galaxy skirt compressed between seats train pooled on dirty subway floor. Man sitting directly across from her on opposite side wearing ${OUTFIT_AAO_GROOM}. They are the only two people in the car. Three meters of empty space between them. They look at each other across the aisle with quiet recognition not smiling not sad just seeing each other clearly. Green-tinted fluorescent light. Black windows reflecting their doubles like ghosts. The fluorescent tubes advertisements and dark ceiling fill the upper 40 percent of the frame. Slight motion blur on handrails. Photorealistic, 40mm lens, mirror symmetry, melancholic and electric, 8k`,
  },
  {
    id: 'aao_rain',
    season: 'film',
    label: '에에올: 빗속의 우주',
    sub: '네가 전부인 순간',
    outfitBride: OUTFIT_AAO_BRIDE,
    outfitGroom: OUTFIT_AAO_GROOM,
    posterPrompt: `KEEP EXACT SAME FACE from reference. DO NOT change face features eyes nose mouth jawline hair. Portrait 3:4 ratio. Medium shot. A couple standing in the middle of an empty outdoor parking lot in heavy rain at night. Concrete surface reflecting rain and a single overhead sodium vapor lamp casting harsh orange circle of light around them. Everything beyond the light circle is pure black darkness. Woman wearing ${OUTFIT_AAO_BRIDE} completely drenched and heavy clinging to body puff sleeves deflated from weight of water colorful buttons glistening wet soaking wet hair plastered to face she laughs with head tilted back letting rain fall on face. Man wearing ${OUTFIT_AAO_GROOM} darkened and translucent from rain googly eye on lapel with raindrop on its surface he watches her laughing not laughing himself just looking at her like she is the entire universe. The black night sky and heavy rain streaks as white diagonal lines fill the upper 55 percent of the frame. Photorealistic, 85mm lens, shallow depth of field, 8k`,
  },
];

export const getPosterConcept = (id: string): PosterConcept | undefined =>
  POSTER_CONCEPTS.find((c) => c.id === id);

export const getPosterConceptsBySeason = (season: string): PosterConcept[] =>
  POSTER_CONCEPTS.filter((c) => c.season === season);
