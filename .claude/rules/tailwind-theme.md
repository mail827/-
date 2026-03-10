# 테마 토큰, 컬러, 타이포

## 테마 시스템 구조

### themeConfig.ts (`client/src/pages/wedding/themes/shared/themeConfig.ts`)
각 테마의 colors, photoFilter 정의. hidden 플래그로 테마 숨김 가능.

```ts
THEME_NAME: {
  hidden?: true,           // 신규 선택에서 숨김 (기존 청첩장은 유지)
  name: '한글 이름',
  colors: {
    primary, secondary, accent, text, textMuted,
    background, card, border
  },
  photoFilter: {
    transformation: 'cloudinary 변환 문자열',
    label: '필터 이름'
  }
}
```

### 현재 테마 목록 (26종, hidden 포함)

**활성 테마:**
- ROMANTIC_CLASSIC: 로맨틱 클래식 (웜 아이보리 + 뮤트 골드)
- MODERN_MINIMAL, BOHEMIAN_DREAM, LUXURY_GOLD
- SENIOR_SIMPLE, FOREST_GARDEN, OCEAN_BREEZE
- GLASS_BUBBLE, GALLERY_MIRIM_1, GALLERY_MIRIM_2
- LUNA_HALFMOON, PEARL_DRIFT, NIGHT_SEA
- BOTANICAL_CLASSIC, HEART_MINIMAL
- CRUISE_DAY: 스카이블루 캘리그라피
- CRUISE_SUNSET: 골든 선셋 다크
- EDITORIAL: 다크 에디토리얼 (#0e0e0e)
- EDITORIAL_WHITE: 전시회 포스터 (#ffffff + 6px 프레임)
- EDITORIAL_GREEN: 숲 에디토리얼 (#E8EDE0 + GREEN/UNION 타이포)
- EDITORIAL_BLUE: 미드나잇 블루 (#F2F2F2 + BLUE/MOMENT 타이포)
- EDITORIAL_BROWN: 웜 베이지 (#F5EFE6 + PURE/LOVE 타이포)

**숨김 테마 (hidden: true):**
- POETIC_LOVE, SPRING_BREEZE, WAVE_BORDER, VOYAGE_BLUE, AQUA_GLOBE

### 컬러 팔레트 예시

**RomanticClassic:**
```
bg: #FAF8F5, bgDark: #1A1714, text: #2C2620
textMuted: #8A7E72, accent: #B8A088, white: #FFFDF9
divider: #E8E2DA
```

**Editorial (다크):**
```
bg: #0e0e0e, bgCard: #1a1a1a, point: #f0f0f0
muted: #888888, border: #333333
```

**Editorial Green:**
```
bg: #E8EDE0, dark: #1A2F23, accent: #94A684
muted: #5A6B5A, border: #C4D0B8
```

**Editorial Blue:**
```
bg: #F2F2F2, dark: #001A40, muted: #4A6080
border: #D0D8E0, highlight: #8AB4F8
```

**Editorial Brown:**
```
bg: #F5EFE6, dark: #3E362E, gold: #C5A059
muted: #7A6F60, border: #DDD5C8
```

### shared 컴포넌트 variant 목록

RsvpForm / GuestbookForm variant:
- classic: 웜 아이보리 (RomanticClassic)
- classic-dark: 다크 배경용 (RomanticClassic 방명록)
- minimal: 스톤 계열
- editorial: 직각 + 투명 배경 + #111 버튼 (에디토리얼 시리즈)
- luxury: 다크 골드 (CruiseSunset, Editorial 다크)
- forest: 그린 계열
- ocean, glass, spring, pearl, luna, botanical, heart, wave 등

### types 등록 위치
- Theme 타입: `client/src/types/index.ts`
- THEME_NAMES: 같은 파일
- THEME_COLORS: 같은 파일
