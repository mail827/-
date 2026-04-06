export interface PosterConcept {
  id: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
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

export const POSTER_CONCEPTS: PosterConcept[] = [
  {
    id: 'spring_field',
    season: 'spring',
    label: '봄: 벚꽃 들판',
    sub: '하늘 아래 단 하나의 나무',
    outfitBride: OUTFIT_SPRING_BRIDE,
    outfitGroom: OUTFIT_SPRING_GROOM,
    posterPrompt: `Preserve exact same face identity from reference photo unchanged. Same eyes nose mouth jawline unchanged. Portrait 3:4 ratio. Wide establishing shot from low angle. A vast open field with a single enormous cherry blossom tree in full bloom centered in the upper half of the frame against pale white sky. The couple stands small in the lower third of the frame, woman wearing ${OUTFIT_SPRING_BRIDE}, man wearing ${OUTFIT_SPRING_GROOM}. Cherry blossom petals drift across the field like slow pink snow. The tree canopy and sky occupy the upper 40 percent of the frame leaving generous negative space. Soft flat overcast light with no harsh shadows. Photorealistic, 24mm wide angle lens, deep depth of field, cinematic movie poster composition, 8k`,
  },
  {
    id: 'spring_tunnel',
    season: 'spring',
    label: '봄: 벚꽃 터널',
    sub: '페달을 밟는 봄날',
    outfitBride: OUTFIT_SPRING_BRIDE,
    outfitGroom: OUTFIT_SPRING_GROOM,
    posterPrompt: `Preserve exact same face identity from reference photo unchanged. Same eyes nose mouth jawline unchanged. Portrait 3:4 ratio. Wide establishing shot looking down a long tree-lined path. Cherry blossom trees on both sides form a dense pink canopy arch in the upper half of the frame. Fallen petals cover the ground like a pink carpet. The couple is small in the lower center of the frame riding an old bicycle through the tunnel of blossoms, woman wearing ${OUTFIT_SPRING_BRIDE} sitting sideways on rear rack skirt flowing, man wearing ${OUTFIT_SPRING_GROOM} pedaling, motion blur on wheels. The blossom canopy overhead fills the upper 40 percent creating natural text space. Warm golden late afternoon backlight filtering through petals. Photorealistic, 24mm wide angle lens, deep depth of field, cinematic movie poster composition, 8k`,
  },
  {
    id: 'spring_steps',
    season: 'spring',
    label: '봄: 석조 계단',
    sub: '말하지 못한 것들',
    outfitBride: OUTFIT_SPRING_BRIDE,
    outfitGroom: OUTFIT_SPRING_GROOM,
    posterPrompt: `Preserve exact same face identity from reference photo unchanged. Same eyes nose mouth jawline unchanged. Portrait 3:4 ratio. Wide establishing shot of grand old building with tall stone columns. Camera pulled far back showing full facade. The couple sits small on the wide stone steps in the lower third of the frame, woman wearing ${OUTFIT_SPRING_BRIDE} skirt spread across steps, man wearing ${OUTFIT_SPRING_GROOM}. Cherry blossom trees line the walkway fully bloomed petals falling. The massive columns and building architecture fill the upper portion of the frame providing monumental negative space. Late afternoon side light casting long shadows across the steps. Photorealistic, 24mm wide angle lens, deep depth of field, cinematic movie poster composition, 8k`,
  },
  {
    id: 'summer_storm',
    season: 'summer',
    label: '여름: 보리밭 폭풍',
    sub: '모든 것이 바뀌기 직전',
    outfitBride: OUTFIT_SUMMER_BRIDE,
    outfitGroom: OUTFIT_SUMMER_GROOM,
    posterPrompt: `Preserve exact same face identity from reference photo unchanged. Same eyes nose mouth jawline unchanged. Portrait 3:4 ratio. Wide establishing shot of a vast golden barley field stretching to the horizon. The sky is split dramatically, half brilliant blue on the right and half dark thundercloud rolling in from the left. The couple stands small in the lower third of the frame facing the approaching storm, woman wearing ${OUTFIT_SUMMER_BRIDE} chiffon skirt pressed by wind, man wearing ${OUTFIT_SUMMER_GROOM} jacket flapping open. The barley bends in golden waves. The dramatic split sky fills the upper 50 percent of the frame. Warm golden sun from right cool storm light from left. Photorealistic, 24mm wide angle lens, deep depth of field, cinematic movie poster composition, the moment before everything changes, 8k`,
  },
  {
    id: 'summer_tree',
    season: 'summer',
    label: '여름: 나무 그늘',
    sub: '매미 소리가 들리는 오후',
    outfitBride: OUTFIT_SUMMER_BRIDE,
    outfitGroom: OUTFIT_SUMMER_GROOM,
    posterPrompt: `Preserve exact same face identity from reference photo unchanged. Same eyes nose mouth jawline unchanged. Portrait 3:4 ratio. Wide establishing shot looking up at a massive old tree in the center of a wide open grass field on a blazing summer afternoon. The enormous tree canopy fills the upper half of the frame, dense green leaves with dappled sunlight breaking through. The couple is small beneath the tree in the lower third, woman lying on grass in ${OUTFIT_SUMMER_BRIDE} chiffon skirt spread around her, man sitting against trunk in ${OUTFIT_SUMMER_GROOM} reading. The field beyond the shade is blown-out white from intense sun. Deep cool shadow under tree contrasts scorching bright field. Photorealistic, 24mm wide angle lens, deep depth of field, cinematic movie poster composition, still and heavy with summer heat, 8k`,
  },
  {
    id: 'summer_rainbow',
    season: 'summer',
    label: '여름: 비 갠 후',
    sub: '폭풍이 지나간 자리',
    outfitBride: OUTFIT_SUMMER_BRIDE,
    outfitGroom: OUTFIT_SUMMER_GROOM,
    posterPrompt: `Preserve exact same face identity from reference photo unchanged. Same eyes nose mouth jawline unchanged. Portrait 3:4 ratio. Wide establishing shot of a golden barley field after sudden summer rain. Everything wet and steaming in the returning sun. The sky is half dark cloud retreating right and half clear golden light breaking through left. A faint rainbow arc stretches across the upper portion of the frame. The couple stands small in the lower third, soaked, woman in ${OUTFIT_SUMMER_BRIDE} clinging with rain, man in ${OUTFIT_SUMMER_GROOM} darkened with water. Golden mist rises from the wet ground catching the light. The rainbow and dramatic sky fill the upper 45 percent. Photorealistic, 24mm wide angle lens, deep depth of field, cinematic movie poster composition, the storm is over and everything glistens, 8k`,
  },
  {
    id: 'autumn_alley',
    season: 'autumn',
    label: '가을: 은행잎 골목',
    sub: '금빛으로 물든 귀갓길',
    outfitBride: OUTFIT_AUTUMN_BRIDE,
    outfitGroom: OUTFIT_AUTUMN_GROOM,
    posterPrompt: `Preserve exact same face identity from reference photo unchanged. Same eyes nose mouth jawline unchanged. Portrait 3:4 ratio. Wide establishing shot of a narrow Korean residential alley stretching deep toward a vanishing point filled with intense golden sunset light. Low apartment walls on both sides, potted plants, a bicycle leaning against a wall. Yellow ginkgo leaves blanket the entire ground like a golden carpet. The couple walks away from camera in the lower third of the frame small against the deep alley, woman in ${OUTFIT_AUTUMN_BRIDE} puddle train dragging through ginkgo leaves, man in ${OUTFIT_AUTUMN_GROOM}. Their long shadows stretch toward camera. The alley and golden light fill the upper 60 percent of the frame. Photorealistic, 24mm wide angle lens, deep depth of field, cinematic movie poster composition, everything is gold quiet and unhurried, 8k`,
  },
  {
    id: 'autumn_crossing',
    season: 'autumn',
    label: '가을: 건널목',
    sub: '차단기 너머로',
    outfitBride: OUTFIT_AUTUMN_BRIDE,
    outfitGroom: OUTFIT_AUTUMN_GROOM,
    posterPrompt: `Preserve exact same face identity from reference photo unchanged. Same eyes nose mouth jawline unchanged. Portrait 3:4 ratio. Wide establishing shot of a small railroad crossing in a quiet town. The red and white barrier arm lowered horizontally across the frame. Autumn trees with deep orange and red leaves line both sides of the tracks forming a fiery canopy in the upper half of the frame. The couple stands small in the lower third one on each side of the barrier, woman in ${OUTFIT_AUTUMN_BRIDE}, man in ${OUTFIT_AUTUMN_GROOM}. They face each other across the barrier calmly. The burning autumn canopy and sky fill the upper 45 percent. Late afternoon golden light making leaves glow like fire. Photorealistic, 24mm wide angle lens, deep depth of field, cinematic movie poster composition, composed and resigned, 8k`,
  },
  {
    id: 'autumn_rooftop',
    season: 'autumn',
    label: '가을: 옥상 석양',
    sub: '그가 찍는 마지막 사진',
    outfitBride: OUTFIT_AUTUMN_BRIDE,
    outfitGroom: OUTFIT_AUTUMN_GROOM,
    posterPrompt: `Preserve exact same face identity from reference photo unchanged. Same eyes nose mouth jawline unchanged. Portrait 3:4 ratio. Wide establishing shot of a Korean apartment rooftop at sunset. The sky fills the upper half of the frame in deep orange fading to purple at the top. A clothesline with white bedsheets and his brown jacket stretches across the middle ground. The couple is in the lower third, man sitting on low concrete ledge photographing her with old film camera champagne shirt wine red tie loosened, woman standing facing him in ${OUTFIT_AUTUMN_BRIDE} golden in the last light. The dramatic sunset sky provides generous text space in the upper 50 percent. Photorealistic, 24mm wide angle lens, deep depth of field, cinematic movie poster composition, the most important photograph he will ever take, 8k`,
  },
  {
    id: 'winter_tracks',
    season: 'winter',
    label: '겨울: 눈 기찻길',
    sub: '세상이 지워진 자리',
    outfitBride: OUTFIT_WINTER_BRIDE,
    outfitGroom: OUTFIT_WINTER_GROOM,
    posterPrompt: `Preserve exact same face identity from reference photo unchanged. Same eyes nose mouth jawline unchanged. Portrait 3:4 ratio. Wide establishing shot of snow-covered train tracks stretching straight to the vanishing point. Flat white snow covers everything, the tracks are faint parallel lines disappearing into fog. Heavy grey overcast sky blending seamlessly into the white ground with no visible horizon. The couple stands small in the lower third on the rails, woman in ${OUTFIT_WINTER_BRIDE} nearly invisible against white snow only dark hair distinguishing her, man in ${OUTFIT_WINTER_GROOM} stark against white. They hold hands across the gap between the rails. The vast empty white sky fills the upper 55 percent. Photorealistic, 24mm wide angle lens, deep depth of field, cinematic movie poster composition, two people are the only proof this world is inhabited, 8k`,
  },
  {
    id: 'winter_dance',
    season: 'winter',
    label: '겨울: 눈밭의 춤',
    sub: '음악 없이 추는 왈츠',
    outfitBride: OUTFIT_WINTER_BRIDE,
    outfitGroom: OUTFIT_WINTER_GROOM,
    posterPrompt: `Preserve exact same face identity from reference photo unchanged. Same eyes nose mouth jawline unchanged. Portrait 3:4 ratio. Wide establishing shot of an open snow field at night during heavy snowfall. Black sky fills the upper half of the frame. A single distant streetlamp far behind the couple creates a warm orange point of light in the upper background. The couple dances slowly in the lower third of the frame small in the vast white field, woman in ${OUTFIT_WINTER_BRIDE} ghostly against snow, man in ${OUTFIT_WINTER_GROOM} a dark shape against white. Foreheads pressed together. Snowflakes stretched into long white diagonal lines by slow shutter. The dark sky and falling snow fill the upper 50 percent. Photorealistic, 24mm wide angle lens, slow shutter motion blur, cinematic movie poster composition, analog film grain, a half-remembered dream in the cold, 8k`,
  },
  {
    id: 'winter_candles',
    season: 'winter',
    label: '겨울: 촛불',
    sub: '얼어붙은 세상의 유일한 온기',
    outfitBride: OUTFIT_WINTER_BRIDE,
    outfitGroom: OUTFIT_WINTER_GROOM,
    posterPrompt: `Preserve exact same face identity from reference photo unchanged. Same eyes nose mouth jawline unchanged. Portrait 3:4 ratio. Wide establishing shot of a small bare room with old wooden floor and peeling wallpaper. No electricity. The room is dark and cold. The couple sits on the floor in the lower third of the frame small in the empty room. Mismatched candles of different heights placed around them in a rough circle are the only light source. Woman in ${OUTFIT_WINTER_BRIDE} pooling around her glowing gold in candlelight. Man in ${OUTFIT_WINTER_GROOM} behind her wrapping his arms around her, black overcoat spread beneath them. The dark ceiling and walls fill the upper 55 percent of the frame in deep shadow. Warm amber candlelight on their faces contrasts the freezing dark room. Their breath faintly visible despite the candles. Photorealistic, 24mm wide angle lens, deep depth of field, cinematic movie poster composition, fragile warmth inside hostile cold, 8k`,
  },
];

export const getPosterConcept = (id: string): PosterConcept | undefined =>
  POSTER_CONCEPTS.find((c) => c.id === id);

export const getPosterConceptsBySeason = (season: string): PosterConcept[] =>
  POSTER_CONCEPTS.filter((c) => c.season === season);
