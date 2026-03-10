# 컴포넌트 작업 실행 레시피

## 신규 테마 생성 (전체 플로우)

### 1단계: DB enum 추가
```bash
sed -i '' 's/  LAST_ENUM/  LAST_ENUM\n  NEW_THEME/' server/prisma/schema.prisma
cd server && npx prisma db push
```

### 2단계: types 등록 (3곳)
```bash
cd ..
sed -i '' "s/'LAST_ENUM'/'LAST_ENUM' | 'NEW_THEME'/" client/src/types/index.ts
sed -i '' "/LAST_ENUM: '마지막 테마'/a\\
  NEW_THEME: '새 테마',
" client/src/types/index.ts
sed -i '' "/LAST_ENUM: { primary/a\\
  NEW_THEME: { primary: '#xxx', secondary: '#xxx', accent: '#xxx', bg: '#xxx' },
" client/src/types/index.ts
```

### 3단계: themeConfig 등록
```bash
sed -i '' '/^};/i\
  NEW_THEME: {\
    name: '"'"'새 테마'"'"',\
    colors: { ... },\
    photoFilter: { ... },\
  },
' client/src/pages/wedding/themes/shared/themeConfig.ts
```

### 4단계: index + WeddingPage
```bash
sed -i '' "/LastTheme/a\\
export { default as NewTheme } from './NewTheme';
" client/src/pages/wedding/themes/index.ts

sed -i '' "/const LastTheme/a\\
const NewTheme = lazy(() => import('./themes/NewTheme'));
" client/src/pages/wedding/WeddingPage.tsx

sed -i '' "/LAST_THEME: LastTheme,/a\\
  NEW_THEME: NewTheme,
" client/src/pages/wedding/WeddingPage.tsx
```

### 5단계: UI 6곳 등록
CreateWedding, EditWedding, AdminWeddingEdit, AdminThemeShowcase, ThemePreviewModal, ThemeShowcaseModal

### 6단계: tsx 파일 생성
- 기존 테마 복사 금지 — 고유 디자인 필수
- ThemeProps 인터페이스 준수
- shared 모듈 import 유지
- 주석 없는 프로덕션 코드

### 7단계: 확인
```bash
grep -r "NEW_THEME" client/src/ --include="*.tsx" --include="*.ts" | grep -v "themes/New" | wc -l
# 13 이상이면 OK
cd client && npm run build
```

### 8단계: 배포
```bash
cd client && vercel --prod
cd server && npm run build && fly deploy  # enum 추가 시에만
```

## 테마 숨기기

### DB 조회 (먼저!)
```sql
SELECT id, theme, "groomName", "brideName" FROM "Wedding" WHERE theme = 'THEME_NAME';
```

### 0건이면 → 파일 교체 가능
### 1건 이상이면 → hidden 처리만
```bash
sed -i '' "s/THEME_NAME: {/THEME_NAME: {\n    hidden: true,/" client/src/pages/wedding/themes/shared/themeConfig.ts
```

## shared 컴포넌트 variant 추가

### RsvpForm + GuestbookForm 동시 수정
1. variant 타입에 추가: `'wave' | 'new_variant'`
2. styles 객체에 스타일 추가
3. 테마에서 variant 지정
