# 폴더 구조 규칙

## 루트
```
wedding-app/
├── client/              # React 프론트엔드
├── server/              # Express 백엔드
├── CLAUDE.md            # 프로젝트 컨텍스트
├── .claude/             # Claude Code 설정
│   ├── rules/           # 규칙 파일들
│   ├── skills/          # 작업 레시피
│   └── resources/       # 참고 자료
```

## client/src/ 구조
```
src/
├── components/
│   ├── admin/           # AdminLayout.tsx, AdminNav 등
│   ├── AiChat.tsx       # AI 웨딩이 챗봇
│   ├── ThemePreviewModal.tsx
│   ├── ThemeShowcaseModal.tsx
│   └── QRCardModal.tsx
├── pages/
│   ├── wedding/
│   │   ├── WeddingPage.tsx    # 테마 라우터 (lazy import)
│   │   └── themes/
│   │       ├── shared/        # 공유 컴포넌트
│   │       │   ├── index.ts   # barrel export
│   │       │   ├── themeConfig.ts
│   │       │   ├── RsvpForm.tsx
│   │       │   ├── GuestbookForm.tsx
│   │       │   ├── GuestbookList.tsx
│   │       │   ├── GalleryModal.tsx
│   │       │   ├── KakaoMap.tsx
│   │       │   ├── ShareModal.tsx
│   │       │   └── GuestPhotoGallery.tsx
│   │       ├── RomanticClassic.tsx
│   │       ├── Editorial.tsx
│   │       └── ... (각 테마별 독립 파일)
│   ├── admin/
│   │   ├── AdminWeddingEdit.tsx
│   │   ├── AdminThemeShowcase.tsx
│   │   └── AdminAiSnap.tsx
│   ├── CreateWedding.tsx
│   ├── EditWedding.tsx
│   ├── Dashboard.tsx
│   └── Landing.tsx
├── types/
│   └── index.ts         # Theme, WeddingData, THEME_NAMES, THEME_COLORS
├── utils/
│   └── image.ts         # heroUrl, galleryThumbUrl, optimizeCloudinaryUrl
└── hooks/
    └── useSectionOrder.ts
```

## server/ 구조
```
server/
├── src/
│   ├── routes/
│   │   ├── wedding.ts
│   │   ├── snapPack.ts      # AI 스냅팩 (유료)
│   │   ├── aiSnap.ts        # AI 스냅 (무료)
│   │   └── ...
│   ├── middleware/
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── fly.toml
└── package.json
```

## 파일 위치 주의
- AdminLayout: `client/src/components/admin/AdminLayout.tsx` (pages/admin이 아님)
- themeConfig: `client/src/pages/wedding/themes/shared/themeConfig.ts`
- image utils: `client/src/utils/image.ts`
