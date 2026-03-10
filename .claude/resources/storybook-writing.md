# 테마 시안 작성법

## HTML 프리뷰 → React 변환 워크플로우

### 1단계: HTML 프리뷰 작성
- 더미 데이터로 전체 섹션 포함
- 모바일 390px 기준
- CDN Tailwind + Google Fonts
- IntersectionObserver로 스크롤 애니메이션

### 2단계: 프리뷰 확인
- 모바일/데스크탑 양쪽 확인
- 폰트 로딩, 애니메이션, 컬러 팔레트 검증

### 3단계: React 변환
- HTML → TSX 변환
- IntersectionObserver → framer-motion whileInView
- 더미 데이터 → wedding props 바인딩
- shared 모듈 연결 (RsvpForm, GalleryModal 등)
- AccountCard 내부 함수 컴포넌트로 정의

### 4단계: 빌드 + 검증
- `npm run build` 0 errors 확인
- TS6133 (unused imports) 제거
- 실제 데이터로 렌더링 확인

## 테마 디자인 원칙

### 히어로 스타일별 분류
- **풀블리드 사진**: RomanticClassic, CruiseDay, CruiseSunset
- **타이포 레이어링**: Editorial (MARRIED), Green (GREEN/UNION), Blue (BLUE/MOMENT), Brown (PURE/LOVE)
- **전시회 프레임**: EditorialWhite (6px border + Vol. 번호)
- **아치 프레임**: VoyageBlue (상단/하단 아치)

### 섹션 리듬 패턴
- **라이트 교차**: bg → card → bg → card (EditorialWhite, Brown, Blue)
- **다크 포인트**: bg → bg → dark → bg (RomanticClassic, CruiseDay)
- **풀 다크**: dark → card → dark (Editorial, CruiseSunset)
- **그린 교차**: bg → dark(venue) → bg (EditorialGreen)

### 타이포 크기 가이드
- 히어로 메인: clamp(5rem, 22vw, 25rem) ~ clamp(6rem, 28vw, 20rem)
- 섹션 디스플레이: clamp(2rem, 7vw, 4rem) ~ clamp(2.5rem, 10vw, 6rem)
- 라벨: 0.6~0.7rem, font-weight 700~900, letter-spacing 0.2~0.3em
- 본문: 14px, font-weight 200~300, line-height 1.8~1.9
