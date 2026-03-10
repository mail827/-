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
│       ├── components/
│       │   └── admin/           # AdminLayout.tsx 등
│       ├── pages/
│       │   ├── wedding/
│       │   │   ├── WeddingPage.tsx
│       │   │   └── themes/      # 테마 컴포넌트들
│       │   │       ├── shared/  # RsvpForm, GalleryModal 등
│       │   │       ├── RomanticClassic.tsx
│       │   │       ├── Editorial.tsx
│       │   │       ├── EditorialWhite.tsx
│       │   │       ├── EditorialGreen.tsx
│       │   │       ├── EditorialBlue.tsx
│       │   │       ├── EditorialBrown.tsx
│       │   │       ├── CruiseDay.tsx
│       │   │       ├── CruiseSunset.tsx
│       │   │       ├── VoyageBlue.tsx
│       │   │       └── ... (기존 테마들)
│       │   ├── admin/
│       │   ├── AiSnapStudio.tsx
│       │   ├── Landing.tsx
│       │   └── Dashboard.tsx
│       ├── types/
│       │   └── index.ts         # Theme type, THEME_NAMES, THEME_COLORS
│       └── utils/
│           └── image.ts         # heroUrl, galleryThumbUrl
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── fly.toml
│   └── prisma/
│       └── schema.prisma
```

## 빌드 & 배포

```bash
# 클라이언트 빌드
cd client && npm run build

# 클라이언트 배포 (Vercel)
cd client && vercel --prod

# 서버 빌드 + 배포 (Fly.io)
cd server && npm run build && fly deploy

# DB 스키마 변경 시
cd server && npx prisma db push
```

## 핵심 규칙

상세 규칙은 `.claude/rules/` 참조:
- `code-convention.md` — 코드 작성 규칙
- `design-system.md` — 디자인 시스템 원칙
- `tailwind-theme.md` — 테마 토큰, 컬러, 타이포
- `layout-rules.md` — 레이아웃 규칙
- `components.md` — 컴포넌트 구조 컨벤션
- `easy-refactoring.md` — 리팩토링 기준
- `project-directory.md` — 폴더 구조 규칙
- `project-summary.md` — 프로젝트 개요

## 관리자
- oicrcutie@gmail.com, gah7186@naver.com
- AdminLayout: `client/src/components/admin/AdminLayout.tsx`
