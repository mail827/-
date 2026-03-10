# 컴포넌트 구조 컨벤션

## 테마 컴포넌트

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

### 공유 모듈 import (필수)
```tsx
import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';
```

### 테마 내부 패턴
```tsx
const fontStyles = `@import url(...)`;     // 폰트 임포트
const themeStyles = `...`;                  // CSS 애니메이션, 클래스
const sectionAnim = {...};                  // framer-motion 섹션 기본 애니메이션
const delayAnim = (delay) => ({...});       // 지연 애니메이션
const F = { display, body, script };        // 폰트 패밀리 상수
const C = { bg, text, accent, ... };        // 컬러 상수
```

### 필수 기능 (모든 테마)
- 음악 재생 버튼 (bgMusicUrl 있을 때)
- 히어로 섹션
- 인사말 (greeting)
- 갤러리 (GalleryModal 연결)
- 캘린더 + 예식 정보 (KakaoMap)
- RSVP (RsvpForm)
- 축의금 (AccountCard + 토스/카카오페이)
- 방명록 (GuestbookForm + GuestbookList)
- 게스트포토 ({guestPhotoSlot})
- 공유 (ShareModal)
- 연락처 (신랑/신부 전화)
- 푸터 ("Made by 청첩장 작업실 ›")

### AccountCard 패턴
각 테마 내부에 AccountCard 함수 컴포넌트 정의 (shared 아님).
테마 컬러 상수 C를 직접 참조.

### GalleryModal theme prop
```tsx
<GalleryModal theme="THEME_ENUM_NAME" usePhotoFilter={wedding.usePhotoFilter ?? true} />
```

### ShareModal variant
- variant="light": 라이트 배경 테마
- variant="dark": 다크 배경 테마

## 신규 테마 추가 체크리스트 (7곳 등록)
1. `themes/[Name].tsx` 생성
2. `themes/shared/themeConfig.ts` 추가
3. `themes/index.ts` export 추가
4. `pages/wedding/WeddingPage.tsx` lazy import + themeComponents 추가
5. `types/index.ts` Theme 타입 + THEME_NAMES + THEME_COLORS
6. `server/prisma/schema.prisma` enum + `npx prisma db push`
7. UI 등록 (6곳):
   - `pages/CreateWedding.tsx`
   - `pages/EditWedding.tsx`
   - `pages/admin/AdminWeddingEdit.tsx`
   - `pages/admin/AdminThemeShowcase.tsx`
   - `components/ThemePreviewModal.tsx` (목록 + lazy import)
   - `components/ThemeShowcaseModal.tsx` (lazy import + accent/glow + 이름)

## 테마 숨기기 (기존 고객 보호)
- themeConfig에 `hidden: true` 추가
- 기존 청첩장은 정상 렌더링 유지
- 신규 선택 목록에서만 숨김
