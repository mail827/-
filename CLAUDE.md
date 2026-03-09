# CLAUDE.md — Wedding Studio Lab (청첩장 작업실)

## 프로젝트 개요

올인원 디지털 웨딩 청첩장 SaaS 플랫폼.
브랜드: WEDDING ENGINE / 청첩장 작업실
도메인: weddingshop.cloud
Instagram: @weddingstudiolab

## 기술 스택

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS (직접 작성, 유틸리티 클래스)
- framer-motion (애니메이션)
- lucide-react (아이콘)
- Zustand (상태관리)
- TanStack Query
- 배포: Vercel (수동 배포, Git 미연결)

### Backend
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL (Neon DB)
- 배포: Fly.io (vm=512mb, fly.toml은 server/ 안에)
- 빌드: `cd server && npm run build && fly deploy`

### 외부 서비스
- Cloudinary: 이미지/미디어 업로드 (client→Cloudinary 직접 업로드)
- TossPayments: 결제
- Solapi: 카카오 알림톡
- fal.ai: AI 이미지 생성 (nano-banana-2)
- OpenAI: 웨딩이 AI 챗봇
- Kakao SDK: 지도, 공유, OAuth
- GA4: 애널리틱스

## 디렉토리 구조

```
wedding-app/
├── client/
│   └── src/
│       ├── components/          # 공통 컴포넌트
│       │   └── admin/           # AdminLayout.tsx 등
│       ├── pages/
│       │   ├── wedding/
│       │   │   ├── WeddingPage.tsx
│       │   │   └── themes/      # 테마 컴포넌트들
│       │   │       ├── shared/  # 공유 모듈 (RsvpForm, GalleryModal 등)
│       │   │       ├── RomanticClassic.tsx
│       │   │       ├── ModernMinimal.tsx
│       │   │       └── ... (18개 테마)
│       │   ├── admin/           # 관리자 페이지
│       │   ├── AiSnapStudio.tsx
│       │   ├── AiSnapFree.tsx
│       │   ├── Landing.tsx
│       │   └── Dashboard.tsx
│       └── utils/
│           └── image.ts         # heroUrl, galleryThumbUrl
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── snapPack.ts      # AI 스냅팩 (유료)
│   │   │   ├── aiSnap.ts        # AI 스냅 (무료+관리자)
│   │   │   ├── wedding.ts
│   │   │   └── ...
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── index.ts
│   ├── fly.toml
│   └── prisma/
│       └── schema.prisma
```

## 코딩 규칙 (절대 준수)

### 필수
- 주석 없는 프로덕션 코드 (코드에 한글/영문 주석 절대 넣지 않음)
- Tailwind 유틸리티 클래스 직접 작성
- lucide-react SVG 아이콘만 사용
- macOS sed: `sed -i ''` (리눅스 `sed -i` 아님)
- 프로덕션 DB: `npx prisma db push` (절대 `migrate dev` 사용 금지)
- `VITE_API_URL` 끝에 `/api` 포함됨 — fetch 경로에 `/api` 중복 추가 금지
- 파일 수정 시 먼저 확인(cat/grep) → 수정 → 빌드 확인 순서

### 금지
- 이모지 금지 (코드, UI 어디서든 💌🎉 등 텍스트 이모지 절대 사용 금지)
- Bootstrap / AI 템플릿 디자인 금지
- 기본 폰트(Inter, Roboto, Arial) 사용 금지
- "All rights reserved" 같은 뻔한 푸터 문구 금지
- 푸터: `"Made by 청첩장 작업실 ›"` (영문 "Wedding Workshop" 금지)
- 한번에 여러 가지 동시 수정 금지 → 하나 바꾸고 테스트 후 다음
- sed로 대량 치환 금지 → 범위 확인 후 최소 단위 수정

### UI/디자인
- stone 계열 미니멀 컬러
- 감각적이고 독특한 UI/UX — AI스러운 뻔한 디자인 절대 지양
- 디테일한 애니메이션과 인터랙션 중시
- 모든 버튼 터치 영역 48px 이상

## 테마 시스템

### 테마 파일 구조
각 테마는 독립 컴포넌트: `client/src/pages/wedding/themes/[ThemeName].tsx`

### ThemeProps 인터페이스
```tsx
interface ThemeProps {
  wedding: WeddingData;
  guestbooks: Guestbook[];
  onRsvpSubmit: (data: any) => Promise<void>;
  onGuestbookSubmit: (data: any) => Promise<void>;
  isRsvpLoading: boolean;
  isGuestbookLoading: boolean;
  guestPhotoSlot?: React.ReactNode;
}
```

### 공유 모듈 (themes/shared/)
```tsx
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';
import { heroUrl, galleryThumbUrl } from '../../../utils/image';
```

### 테마 설정: themes/shared/themeConfig.ts
각 테마의 컬러/필터 설정. 테마 추가 시 여기도 수정 필요.

### 신규 테마 추가 체크리스트
1. themes/[Name].tsx 생성
2. themeConfig.ts에 컬러/필터 추가
3. themes/index.ts에 export 추가
4. WeddingPage.tsx에 라우팅 추가
5. types에 Theme enum + NAMES + COLORS 추가
6. prisma enum 추가 + `npx prisma db push`
7. UI 7곳 등록 (Dashboard, Landing 등)

## AI 스냅 시스템

### 파일 구조
- `server/src/routes/snapPack.ts` — 유료 스냅팩 (체이닝, shot rotation)
- `server/src/routes/aiSnap.ts` — 무료 1장 + 관리자 퀵스냅
- `client/src/pages/AiSnapStudio.tsx` — 유료 스냅 UI
- `client/src/pages/AiSnapFree.tsx` — 무료 체험 UI
- `client/src/pages/admin/AdminAiSnap.tsx` — 관리자 UI

### 핵심 규칙
- nano-banana-2 strength: solo 0.20, couple 0.15, selfie 0.22
- DYNAMIC_CONCEPTS: retro_hongkong, vintage_record, cruise_sunset, cruise_bluesky, black_swan, blue_hour
- face-swap: 비활성화 (shouldSwap = false)
- strength/프롬프트/shots 동시 변경 금지
- 테스트 시 최소 장수 (1~2장)로 비용 최소화

### 컨셉 목록 (28개)
studio, outdoor, beach, hanbok×5, cherry, city_night, forest, castle, cathedral, watercolor, magazine, rainy, autumn, winter, vintage_film, cruise×2, iphone×2, vintage_record, retro_hongkong, black_swan, blue_hour

## 결제 시스템

### 가격 티어
- Lite: 3만원 (테마1종, 수정1회, 30일)
- Basic: 8만원 (전체테마, 무제한변경, 3회수정, 3개월)
- AI Reception: 12.9만원 (AI비서+듀얼페르소나)
- Basic+영상: 40만원 (하이라이트영상)

### AI 스냅 티어
- 3장: 5,900원 / 5장: 9,900원 / 10장: 14,900원 / 20장: 24,900원

## 제휴
- 위에이블: WEABLE30 (30% 할인 + 10% 커미션)
- 포에버웨딩: FOREVER20 (20% 할인)

## 관리자
- 관리자 계정: oicrcutie@gmail.com, gah7186@naver.com
- AdminLayout: `client/src/components/admin/AdminLayout.tsx`

## 빌드 & 배포

```bash
# 서버
cd server && npm run build && fly deploy

# 클라이언트
cd client && npm run build
# → Vercel 수동 배포

# DB 스키마 변경 시
cd server && npx prisma db push
```

## 주의사항

- Neon DB 슬립 모드: 오래 쓰지 않으면 `SELECT 1`로 깨우기
- KakaoTalk 인앱 브라우저: localStorage 사용 (sessionStorage 금지)
- Cloudinary: client→Cloudinary 직접 업로드 (서버 경유 X)
- `seedPackages().catch()` — 서버 시작 시 크래시 방지
- Canvas 고정 위치: parentElement 참조 + transform:translateZ(0)
