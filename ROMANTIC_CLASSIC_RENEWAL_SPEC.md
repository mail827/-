# RomanticClassic 테마 리뉴얼 지시서

## 프로젝트 컨텍스트

모바일 웨딩 청첩장 단일 스크롤 페이지.
파일: `client/src/pages/wedding/themes/RomanticClassic.tsx`
경쟁사 레퍼런스: 모다모먼트 (modamoment.com) — 풀스크린 사진, 과감한 타이포, 장식 최소화

## 절대 규칙

- 이모지 금지 (💌🎉 등 텍스트 이모지 절대 NO) — lucide-react 아이콘만 사용
- 부트스트랩/AI 템플릿 디자인 금지
- 기존 shared 모듈 import 구조 유지 (RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal 등)
- ThemeProps 인터페이스 유지
- 기존 기능 모두 유지 (음악, 공유, RSVP, 방명록, 축의금, 갤러리, 캘린더, D-day, 게스트포토)
- `heroUrl`, `galleryThumbUrl` import 유지
- 주석 없는 프로덕션 코드
- Tailwind 직접 작성 (styled-components 사용 안 함)
- framer-motion 사용 (이미 설치됨)
- lucide-react 아이콘 사용

## 디자인 방향: "Editorial Serif Elegance"

모다모먼트의 과감함 + 고급 웨딩 매거진 감성.
핵심 키워드: 풀블리드, 대담한 세리프, 극단적 여백, 무장식

### 컬러 팔레트

```
--bg-primary: #FAF8F5          (웜 아이보리)
--bg-dark: #1A1714             (다크 브라운블랙)
--text-primary: #2C2620        (딥 브라운)
--text-secondary: #8A7E72      (뮤트 브라운)
--text-light: #C4B9AB          (라이트 톤)
--accent: #B8A088              (뮤트 골드 — 이전 #D4AF37보다 훨씬 절제)
--white: #FFFDF9
--divider: #E8E2DA
```

골드(#D4AF37) 완전 제거. 억제된 톤의 뮤트 골드만 미니멀하게.

### 타이포그래피

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200;300;400;500;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap');
```

- 영문 디스플레이: `Cormorant Garamond` (이탈릭 300 적극 활용)
- 한글 본문: `Noto Serif KR` (200~400 weight — 가늘고 우아)
- 한글 보조: `Nanum Myeongjo`

### 레이아웃 원칙

1. 사진은 프레임 없이 풀블리드 (edge-to-edge, 패딩 0)
2. 텍스트 섹션은 넉넉한 여백 (py-24 이상)
3. 코너 장식, 골드 라인, 사각 프레임 일체 제거
4. 섹션 구분은 여백과 배경색 전환으로만
5. 모든 인터랙티브 버튼은 48px 이상 터치 영역

---

## 섹션별 상세 스펙

### 1. 히어로 (100vh 풀스크린)

```
레이아웃: 사진이 100vw × 100vh 풀스크린 배경
사진 위에 그라디언트 오버레이: linear-gradient(transparent 40%, rgba(0,0,0,0.5) 100%)
텍스트 위치: 하단 정렬 (bottom: 15%)
```

**텍스트 배치:**
```
상단 작은 글씨: "WEDDING INVITATION" — Cormorant Garamond 300, 11px, tracking 0.35em, #FFFDF9 opacity 0.7
중앙 이름 (크게):
  신랑이름 — Noto Serif KR 300, 28px, #FFFDF9, tracking 0.15em
  "&" — Cormorant Garamond italic 300, 22px, #FFFDF9 opacity 0.6, my-3
  신부이름 — Noto Serif KR 300, 28px, #FFFDF9, tracking 0.15em
하단 날짜: Cormorant Garamond 300, 14px, #FFFDF9 opacity 0.7, tracking 0.2em
         예: "2026. 06. 15"
```

**애니메이션:**
- 사진: scale 1.05 → 1.0 (3초, ease-out)
- 텍스트: opacity 0→1, y 30→0 (stagger 0.2초씩)
- 하단 스크롤 안내 화살표: ChevronDown, opacity 0.4, bounce 애니메이션

**영상인 경우:** `<video>` 풀스크린 autoPlay muted loop playsInline, 동일 오버레이

### 2. 인사말 섹션

```
배경: #FAF8F5
패딩: py-28 px-8
```

**레이아웃:**
```
"INVITATION" — Cormorant Garamond italic 300, 12px, tracking 0.4em, #B8A088, mb-8
가는 세로선: w-px h-10, bg #E8E2DA, mx-auto, mb-10

인사말 제목 (있을 경우):
  Noto Serif KR 300, 18px, #2C2620, leading-relaxed, mb-8

인사말 본문:
  Noto Serif KR 200, 14px, #8A7E72, leading-[2.4], whitespace-pre-line

부모님 이름 (showParents === true):
  가는 가로선: w-12 h-px bg #E8E2DA mx-auto my-10
  "신랑측" / "신부측" 라벨: Cormorant Garamond 400, 11px, tracking 0.2em, #B8A088
  부모 이름: Noto Serif KR 300, 12px, #8A7E72
  "의 아들/딸 OOO": Noto Serif KR 400, 14px, #2C2620
```

코너 장식, 사각 프레임 일체 없음. 텍스트와 여백만으로 구성.

### 3. 갤러리 섹션

```
배경: #FFFDF9
패딩: py-24 px-0 (사진은 풀블리드)
```

**레이아웃:**
```
"GALLERY" — Cormorant Garamond italic 300, 12px, tracking 0.4em, #B8A088, mb-8, text-center

사진 그리드: 2열 그리드, gap-1
  - 첫 번째 사진: col-span-2 (풀폭, aspect-[4/3])
  - 나머지: 1:1 정사각형 그리드
  - 사진 tap → GalleryModal
```

사진 프레임/테두리/그림자 없음. 사진 자체가 레이아웃.

### 4. 캘린더 & 예식 정보

```
배경: #1A1714 (다크 섹션 — 대비감)
텍스트: #FFFDF9
패딩: py-28 px-8
```

**레이아웃:**
```
"WHEN & WHERE" — Cormorant Garamond italic 300, 12px, tracking 0.4em, #B8A088, mb-10

캘린더: (기존 calendarData 로직 그대로)
  년.월: Cormorant Garamond 300, 13px, #C4B9AB, tracking 0.2em
  요일 헤더: Noto Serif KR 200, 11px, #8A7E72
  날짜 숫자: Noto Serif KR 300, 13px, #FFFDF9
  결혼 당일: 원형 표시 — border 1px #B8A088, rounded-full
  일요일: #B8A088

가는 가로선: w-12 h-px bg #5A5048 mx-auto my-10

장소 정보:
  예식일시: Noto Serif KR 300, 15px, #FFFDF9
  장소명: Noto Serif KR 400, 16px, #FFFDF9, mt-4
  홀이름: Noto Serif KR 200, 13px, #C4B9AB
  주소: Noto Serif KR 200, 12px, #8A7E72, mt-2

지도 버튼들: (네이버지도/카카오맵/티맵)
  배경 transparent, border 1px #5A5048, rounded-full
  텍스트: Noto Serif KR 200, 12px, #C4B9AB
  터치영역 48px
  flex gap-3 justify-center mt-8
```

KakaoMap 컴포넌트는 다크 배경 아래에 풀폭으로 배치 (mx-0 px-0)

### 5. RSVP (참석 여부)

```
배경: #FAF8F5
패딩: py-28 px-8
```

```
"ATTENDANCE" — Cormorant Garamond italic 300, 12px, tracking 0.4em, #B8A088, mb-10

RsvpForm 컴포넌트 사용 (기존 그대로)
스타일 override가 필요하면 wrapper div에 className 추가
```

### 6. 축의금

```
배경: #FFFDF9
패딩: py-28 px-8
```

```
"GIFT" — Cormorant Garamond italic 300, 12px, tracking 0.4em, #B8A088, mb-10

신랑측/신부측 아코디언:
  토글 버튼: 풀폭, py-5, border-b 1px #E8E2DA
    "신랑측 계좌" — Noto Serif KR 300, 14px, #2C2620
    ChevronDown 아이콘, rotate 애니메이션
  
  펼침 내용: AnimatePresence + motion.div
    각 계좌: py-4
      은행명/예금주: Noto Serif KR 200, 12px, #8A7E72
      계좌번호: Noto Serif KR 300, 13px, #2C2620
      복사 버튼: Copy 아이콘 + "복사" — border 1px #E8E2DA, rounded-full, px-4 py-2
      복사 완료: Check 아이콘 + "완료" — #B8A088
```

### 7. 방명록

```
배경: #1A1714
텍스트: #FFFDF9
패딩: py-28 px-8
```

```
"GUESTBOOK" — Cormorant Garamond italic 300, 12px, tracking 0.4em, #B8A088, mb-10

GuestbookForm 컴포넌트 + GuestbookList 컴포넌트
다크 배경에 맞게 wrapper 스타일링
```

### 8. 게스트 포토

```
{guestPhotoSlot} 그대로 렌더링
```

### 9. 마무리 & 공유

```
배경: #FAF8F5
패딩: py-28 px-8
```

```
"SHARE" — Cormorant Garamond italic 300, 12px, tracking 0.4em, #B8A088, mb-6

마무리 문구:
  Noto Serif KR 200, 13px, #8A7E72, text-center
  "소중한 날에 함께해 주시면 감사하겠습니다"

공유 버튼들: flex gap-4 justify-center mt-10
  각 버튼: w-12 h-12 rounded-full border 1px #E8E2DA
    Share2 아이콘
```

### 10. 푸터

```
py-8 text-center
"Made by 청첩장 작업실 ›" — Noto Serif KR 200, 11px, #C4B9AB
링크: /
```

---

## 음악 버튼

```
위치: fixed top-5 right-5 z-50
크기: w-10 h-10 rounded-full
배경: rgba(250,248,245,0.85) backdrop-blur-sm
테두리: 1px solid #E8E2DA
아이콘: Volume2 / VolumeX, w-4 h-4, #8A7E72
그림자: 0 2px 12px rgba(0,0,0,0.06)
```

---

## 스크롤 애니메이션 (framer-motion)

모든 섹션 진입 시:
```tsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
>
```

섹션 타이틀 (영문):
```tsx
<motion.p
  initial={{ opacity: 0, letterSpacing: '0.6em' }}
  whileInView={{ opacity: 1, letterSpacing: '0.4em' }}
  viewport={{ once: true }}
  transition={{ duration: 1.2 }}
>
```

사진 진입:
```tsx
<motion.div
  initial={{ opacity: 0, scale: 1.05 }}
  whileInView={{ opacity: 1, scale: 1 }}
  viewport={{ once: true }}
  transition={{ duration: 0.8 }}
>
```

---

## 삭제할 요소 목록 (기존 대비)

- `border-t border-l` / `border-b border-r` 코너 장식 전부
- `#D4AF37` 골드 컬러 전부
- SVG noise 배경 텍스처
- SVG 꽃/장식 패턴
- `Aritaburi` 폰트 (→ Cormorant Garamond로 대체)
- 사진 주위 `-inset-3` 이중 프레임
- `boxShadow: '0 8px 32px rgba(139,115,70,0.12)'` 과한 그림자

---

## 파일 구조

수정 파일: `client/src/pages/wedding/themes/RomanticClassic.tsx` (전체 교체)

import 유지:
```tsx
import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Phone, Copy, Check, 
  Volume2, VolumeX, Share2, ChevronDown
} from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';
```

기존 props 시그니처 유지:
```tsx
export default function RomanticClassic({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot }: ThemeProps)
```

---

## themeConfig.ts 수정

`ROMANTIC_CLASSIC` 항목 컬러 업데이트:
```ts
ROMANTIC_CLASSIC: {
  name: '로맨틱 클래식',
  colors: {
    primary: '#B8A088',
    secondary: '#FAF8F5',
    accent: '#2C2620',
    text: '#2C2620',
    textMuted: '#8A7E72',
    background: '#FAF8F5',
    card: '#FFFDF9',
    border: '#E8E2DA',
  },
  photoFilter: {
    transformation: 'e_saturation:5,e_warmth:15,e_vibrance:8',
    label: '내추럴 웜',
  },
},
```
