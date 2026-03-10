# 분류 체계 상세 v0.4

## 테마 아키텍처

### 레이어 구조
```
WeddingPage.tsx (라우터)
  └── ThemeComponent (lazy loaded)
        ├── fontStyles (CSS @import)
        ├── themeStyles (CSS keyframes, classes)
        ├── 상수 (F: 폰트, C: 컬러)
        ├── 애니메이션 (sectionAnim, delayAnim)
        ├── JSX 섹션들
        │   ├── 음악 버튼 (fixed)
        │   ├── 히어로
        │   ├── 인사말 (greeting)
        │   ├── 러브스토리 영상 (loveStoryVideo)
        │   ├── 갤러리 (galleries)
        │   ├── 캘린더+예식정보 (venue)
        │   ├── RSVP (RsvpForm)
        │   ├── 축의금 (AccountCard)
        │   ├── 방명록 (GuestbookForm+List)
        │   ├── 게스트포토 (guestPhotoSlot)
        │   ├── 마무리+공유+연락처
        │   └── 푸터
        ├── GalleryModal (AnimatePresence)
        └── ShareModal (AnimatePresence)
```

### 데이터 플로우
```
WeddingPage
  ├── useQuery → publicApi('/wedding/:slug') → wedding data
  ├── useQuery → publicApi('/wedding/:slug/guestbook') → guestbooks
  ├── useMutation → submitRsvp
  ├── useMutation → submitGuestbook
  └── Props → ThemeComponent
        ├── wedding (전체 데이터)
        ├── guestbooks
        ├── onRsvpSubmit / onGuestbookSubmit
        ├── isRsvpLoading / isGuestbookLoading
        └── guestPhotoSlot (GuestPhotoGallery 렌더)
```

### variant 시스템
```
RsvpForm
  variant → styles[variant] → { input, button, active, inactive }

GuestbookForm
  variant → styles[variant] → { input, button }

ShareModal
  variant → 'light' | 'dark'

GalleryModal
  theme → 'THEME_NAME' (photoFilter 적용)
```

### 테마별 고유 요소

| 테마 | 히어로 | 특수 요소 | 폰트 |
|------|--------|-----------|------|
| RomanticClassic | 풀블리드+캘리 | Dream your Wedding Day | Great Vibes+Cormorant |
| CruiseDay | 풀블리드+블루캘리 | GALLERY 스크롤링크 | Great Vibes |
| CruiseSunset | 풀블리드+화이트캘리 | 세피아 오버레이 | Great Vibes |
| Editorial | MARRIED 타이포 | 세로 ISSUE 텍스트 | Syne+Pretendard |
| EditorialWhite | THE MOMENT OF UNION | 6px 프레임+Vol.번호+ADMIT ONE | Bodoni Moda+Pretendard |
| EditorialGreen | GREEN/UNION 샌드위치 | 무한 리본 스크롤+FOREVER 고스트 | Pretendard |
| EditorialBlue | BLUE/MOMENT 샌드위치 | Vol.+Edition Blue 라벨 | Pretendard |
| EditorialBrown | PURE/LOVE 샌드위치 | STAY GOLD 풋터+골드 accent | Pretendard |
| VoyageBlue | 캘리 헤더(히어로X) | 아치형 사진+세이지 라벨 | Great Vibes+Noto Serif KR |

### 숨김 테마 이력
| 테마 | 사유 | 기존 사용자 |
|------|------|------------|
| POETIC_LOVE | 크루즈로 교체 | 1건 |
| SPRING_BREEZE | 크루즈로 교체 | 3건 |
| WAVE_BORDER | 에디토리얼로 교체 | 1건 |
| AQUA_GLOBE | 캔버스 기반 무거움 | 1건 |
| VOYAGE_BLUE | 디자인 미완 | 0건 |
