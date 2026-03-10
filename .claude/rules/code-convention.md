# 코드 작성 규칙

## 절대 규칙
- 주석 없는 프로덕션 코드 (한글/영문 주석 절대 금지)
- Tailwind 유틸리티 클래스 직접 작성
- lucide-react SVG 아이콘만 사용
- 이모지 금지 (코드/UI 어디서든)
- Bootstrap / AI 템플릿 디자인 금지
- macOS sed: `sed -i ''` (리눅스 `sed -i` 아님)
- 프로덕션 DB: `npx prisma db push` (절대 `migrate dev` 금지)
- `VITE_API_URL` 끝에 `/api` 포함됨 — fetch 경로에 `/api` 중복 추가 금지

## 파일 수정 순서
1. 먼저 확인 (cat/grep)
2. 수정
3. 빌드 확인 (`cd client && npm run build`)
4. 배포

## 수정 원칙
- 한번에 여러 가지 동시 수정 금지 → 하나 바꾸고 테스트 후 다음
- sed로 대량 치환 금지 → 범위 확인 후 최소 단위 수정
- sed는 단순 치환만 — 복잡한 변경은 cat EOF 또는 VSCode 직접 수정

## TypeScript
- 사용하지 않는 import는 빌드 에러 (TS6133) → 반드시 제거
- any 타입은 filter(Boolean) as any[] 패턴에서만 허용

## framer-motion 패턴
```tsx
const sectionAnim = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
};
```

## Cloudinary
- client→Cloudinary 직접 업로드 (서버 경유 X)
- heroUrl: q_90,w_1800,c_limit (f_auto 제거)
- galleryThumbUrl: w_500,q_auto,f_auto

## KakaoTalk
- 인앱 브라우저: localStorage 사용 (sessionStorage 금지)

## Neon DB
- 슬립 모드 시 `SELECT 1`로 깨우기
- `seedPackages().catch()` — 서버 시작 크래시 방지
