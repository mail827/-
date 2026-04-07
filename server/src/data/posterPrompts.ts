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
];

export const getPosterConcept = (id: string): PosterConcept | undefined =>
  POSTER_CONCEPTS.find((c) => c.id === id);

export const getPosterConceptsBySeason = (season: string): PosterConcept[] =>
  POSTER_CONCEPTS.filter((c) => c.season === season);
