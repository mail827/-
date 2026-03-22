# CLAUDE.md — 청첩장 작업실 (Wedding Studio Lab)
# Last updated: 2026-03-22

## 프로젝트 개요
청첩장 작업실 (weddingshop.cloud) — 프리미엄 모바일 청첩장 SaaS
CEO/개발: 다겸 | 비즈니스 파트너: 가현(영상편집, 커뮤니티 마케팅)
브랜드: WEDDING ENGINE
인스타: @weddingstudiolab | 카카오: pf.kakao.com/_xkaQxon

## 인프라
- Frontend: React/TypeScript + Vite -> Vercel (수동 배포, `npm run build && npx vercel --prod`)
- Backend: Node.js/Express -> Fly.io `wedding-api-bitter-butterfly-7766` (Tokyo/nrt, 512MB)
- DB: PostgreSQL via Neon/Prisma (`db push` only — 절대 `migrate dev` on production)
- Storage: Cloudinary | Payments: TossPayments | Notifications: Solapi (알림톡)
- Git: github.com/dakyumlee/WeddingStudio
- fly.toml: auto_stop_machines = 'off'
- **반드시 1대만 운영** — 2대 시 fal.ai response_url 동시 fetch -> 500 에러. `fly scale count 1` 필수

## 핵심 파일 경로
```
client/src/App.tsx
client/src/pages/Landing.tsx
client/src/pages/CreateWedding.tsx
client/src/pages/AiCreateWedding.tsx
client/src/pages/EditWedding.tsx
client/src/pages/AiSnapFree.tsx
client/src/pages/AiSnapStudio.tsx
client/src/pages/GiftRedeem.tsx
client/src/pages/ArchiveSuccess.tsx
client/src/pages/BoothCreditSuccess.tsx
client/src/pages/Dashboard.tsx
client/src/pages/wedding/WeddingPage.tsx
client/src/pages/wedding/themes/shared/GuestAiPhotoBooth.tsx
client/src/pages/wedding/themes/shared/GuestPhotoGallery.tsx
client/src/pages/wedding/themes/shared/BoothGallery.tsx
client/src/pages/wedding/themes/shared/GuestbookForm.tsx
client/src/pages/wedding/themes/shared/GuestbookList.tsx
client/src/pages/wedding/themes/shared/RsvpForm.tsx
client/src/pages/wedding/themes/shared/EnvelopeIntro.tsx
client/src/pages/wedding/themes/shared/VenueDetailTabs.tsx
client/src/pages/wedding/themes/shared/KakaoMap.tsx
client/src/pages/wedding/themes/shared/LocaleSwitch.tsx
client/src/pages/wedding/themes/shared/i18n.ts
client/src/pages/wedding/themes/shared/themeConfig.ts
client/src/pages/wedding/themes/shared/index.ts
client/src/components/AiChat.tsx
client/src/components/BoothCreditPanel.tsx
client/src/pages/admin/AdminWeddingLifecycle.tsx
client/src/pages/admin/AdminWeddingEdit.tsx
client/src/pages/admin/AdminUsers.tsx
client/src/components/KakaoAddressInput.tsx
client/src/types/index.ts
server/src/routes/aiCreate.ts
server/src/routes/aiSnap.ts
server/src/routes/snapPack.ts
server/src/routes/boothCredit.ts
server/src/routes/public.ts
server/src/routes/gift.ts
server/src/routes/guestPhoto.ts
server/src/routes/wedding.ts
server/src/routes/admin.ts
server/src/routes/og.ts
server/src/routes/ai.ts
server/src/routes/translate.ts
server/prisma/schema.prisma
```

## 절대 규칙
- cat/grep으로 파일 상태 확인 먼저
- python3 heredoc으로 복잡한 수정, sed는 단순 치환만
- 주석 없는 코드, 빌드 확인 후 배포
- VITE_API_URL 끝에 /api — fetch 경로에 /api 붙이지 않기
- db push only, 절대 migrate dev on production
- macOS: sed -i '' 필수
- JSX 안 특수문자 사용 금지
- 기본 이모지 절대 금지 -> lucide-react SVG만
- 테마 푸터: "Made by 청첩장 작업실 >"
- Fly.io 반드시 1대만 운영 (fly scale count 1)

## 배포
```bash
# 프론트
cd client && npm run build && npx vercel --prod

# 서버
cd server && npm run build && fly deploy -a wedding-api-bitter-butterfly-7766 --buildkit

# 서버 (새 DB 필드 시)
cd server && fly deploy --no-cache -a wedding-api-bitter-butterfly-7766 --buildkit
```

## 가격 체계
- Standard: 9,900원 (전테마 27종 + 종이청첩장 + QR카드 + RSVP + 축의금 + 방명록 + 갤러리 + 배경음악 + D-Day)
- Premium: 29,900원 (Standard 전체 + AI 컨시어지 + AI 웨딩스냅 33컨셉 + 하객 AI 포토부스)
- Basic+영상: 40만원
- AI 스냅: 3장 5,900 / 5장 9,900 / 10장 14,900 / 20장 24,900
- AI 포토부스 크레딧: 10장 2,900 / 30장 6,900 / 50장 9,900 / 100장 14,900
- 영구 아카이브: 9,900원
- 선물코드 시스템 active

## 제휴
- 포에버웨딩: FOREVER20 (20%)
- 웨딩줌인: ZOOMIN20 (20%)

---

## 핵심 기능 (27테마)

### 27개 테마
RomanticClassic, ModernMinimal, BohemianDream, LuxuryGold, PoeticLove, SeniorSimple,
ForestGarden, OceanBreeze, GlassBubble, SpringBreeze, GalleryMirim1, GalleryMirim2,
LunaHalfmoon, PearlDrift, NightSea, AquaGlobe, WaveBorder, HeartMinimal, BotanicalClassic,
CruiseDay, CruiseSunset, VoyageBlue, Editorial, EditorialWhite, EditorialGreen, EditorialBlue, EditorialBrown

### 방명록 (29 variant)
- GuestbookForm.tsx + GuestbookList.tsx: 27테마 + classic-dark + playful
- 테마별 고유 디자인 (에디토리얼=언더라인+uppercase, 미림=미니멀극한, 글라스=글래스모피즘 등)
- 5개 기본 노출 + "N개 더 보기" 확장, 200자 캐릭터 카운터
- stagger 페이드인 애니메이션, 삭제 모달 Enter 키 지원

### RSVP
- RsvpForm.tsx: 18+ variant, locale 지원

### 웨딩 라이프사이클
- expiresAt = weddingDate + 90d, status: active -> archive -> expired
- 영구 아카이브 9,900원 (TossPayments)

### AI 기능
- AI 자동제작 (AiCreateWedding.tsx): GPT-4o Vision 테마 추천 + GPT-4o-mini 인사말 생성
- AI 웨딩스냅 33컨셉 (fal.ai nano-banana-2)
- 하객 AI 포토부스 (GuestAiPhotoBooth.tsx): 6컨셉 (Gala/Flower/Hanbok/RedCarpet/Magazine/Champagne)
  - 파티/축하 컨셉으로 리브랜딩 완료 (웨딩의상 제거)
  - 한글/영어 전체 전환 지원
  - 크레딧 시스템: 청첩장당 10장 무료 (모든 게스트 합산), 관리자 무제한
  - 크레딧 소진 시 게스트에게 "크레딧 소진" 안내, 버튼 비활성화
  - 실패/타임아웃 시 크레딧 자동 환불
- AI 컨시어지 (AiChat.tsx): 듀얼 페르소나, locale 전달 -> GPT 영어 응답

### AI 포토부스 크레딧 구매 시스템
- 구매 주체: 웨딩 커플 (청첩장 주인이 EditWedding에서 구매)
- DB: Wedding.boothCredits (Int, default 10) + BoothCreditOrder 모델
- 서버: boothCredit.ts (tiers/status/order/confirm 엔드포인트)
- 클라이언트: BoothCreditPanel.tsx (EditWedding AI Photo Booth 섹션 내)
- 결제: TossPayments v1 SDK (js.tosspayments.com/v1/payment)
- 콜백: /booth-credit/success -> BoothCreditSuccess.tsx
- 크레딧 차감: guestPhoto.ts ai-booth 엔드포인트에서 generate 시 -1, 실패 시 +1 환불
- 잔여 조회: GET /:slug/booth-credits (게스트용, 로그인 불필요)

### 하객 포토부스 갤러리 (BoothGallery.tsx)
- AI_PHOTO mediaType만 필터링하여 전용 갤러리 노출
- 3열 그리드, 2:3 비율, 게스트이름 + 컨셉 라벨 오버레이
- 풀스크린 뷰어 (좌우 내비게이션 + 다운로드)
- WeddingPage guestPhotoSlot: 부스 -> 부스갤러리 -> 게스트갤러리 순서
- 사진 없으면 자동 숨김 (return null)
- 서버: GET /:slug/ai-booth/gallery (imageUrl 비어있지 않은 것만)

### 기타 기능
- 함께만들기, 버전관리(공유링크), 포토필터, 갤러리, 배경음악, D-Day
- 종이청첩장 10종, QR카드 19종
- 게스트갤러리 (사진+동영상), 봉투 인트로
- 선물하기 (GiftRedeem.tsx): AI 자동제작 / 직접 만들기 선택지

---

## 해외전환 (International Mode) — 2026-03-22

### 아키텍처
- DB: Wedding.locale (ko/en, default ko), Wedding.showLocaleSwitch (Boolean, default true), Wedding.translationsEn (Json?)
- i18n 사전: `client/src/pages/wedding/themes/shared/i18n.ts` (ko/en, 라이브러리 없이 경량)
- LocaleSwitch: 왼쪽 하단 고정, 반투명 다크 배경, showLocaleSwitch=false면 숨김

### 적용 범위
**i18n 사전 (하드코딩 UI):**
- 날짜/시간: formatDateLocale / formatTimeLocale (27테마 전부 적용)
- RSVP 폼: 이름/연락처/참석/불참/신랑측/신부측/동반인원/메시지/전송
- 방명록: 이름/비밀번호/메시지/삭제/취소/더보기
- 축의금: 신랑측/신부측/계좌복사/복사됨/토스/카카오페이
- 지도: 네이버지도/카카오맵/티맵/주소복사
- 공통: 결혼식 초대/의 아들/의 딸/전화하기/문자하기
- 봉투: "Something begins when you open this." / "request the pleasure of your company"
- 갤러리: "Help us remember this day." / Photo/Video 전환
- AI 포토부스: 전체 한영 전환 지원
- AI 컨시어지: 감성 토스트 (EN_TOASTS), 퀵버튼 영어, locale -> 서버 GPT 영어 응답

**GPT 자동 번역 (유저 입력 커스텀 텍스트):**
- 서버: `server/src/routes/translate.ts` — POST /weddings/:id/translate
- GPT-4o-mini로 greeting, greetingTitle, closingMessage, venue, venueHall, venueAddress, transportInfo, parkingInfo, envelopeCardText, venueDetailTabs 번역
- translationsEn Json 필드에 저장
- WeddingPage에서 locale='en'이면 translationsEn 오버라이드 -> 테마 코드 수정 없이 적용
- EditWedding 설정탭: International Mode 토글 + "Translate to English" 버튼 + 하객 전환 허용 토글

**27테마 일괄 적용:**
- 모든 테마에 locale prop 전달 (ThemeProps.locale)
- AquaGlobe/NightSea는 isPreview 추가 타입이라 별도 처리

### 아직 미적용
- 각 테마 내부 남은 한글 하드코딩 (KakaoMap 로딩, placeholder 등)
- AI 컨시어지 placeholder 텍스트 (한국어 하드코딩)

---

## AI 스냅 파이프라인

### 아키텍처
- aiSnap.ts — 무료체험 + 관리자 퀵스냅
- snapPack.ts — 유료 스냅팩 (체이닝)
- 클라이언트 폴링 구조: statusUrl/responseUrl DB저장 -> generate 즉시 응답 -> GET poll

### 모델: fal-ai/nano-banana-2/edit
- strength: couple 0.22 / solo 0.20
- image_size: 768x1152
- Cloudinary 업로드: transformation 없음

### response_url 재시도 로직
- waitForResult / free-poll / admin-poll: COMPLETED인데 detail 있으면 3회 재시도 (2초 간격)
- snapPack: retry 조건에 unavailable / timeout / Internal Server Error 포함

### Fly.io 2대 운영 시 문제
- 두 머신이 같은 response_url 동시 fetch -> 500 Internal Server Error
- 관리자는 동기 응답(submit.images)이라 영향 없었음
- 해결: fly scale count 1 필수

### Easel face-swap: shouldSwap=false (Fly.io timeout)

### 4파일 동기화 (컨셉 추가 시)
snapPack.ts, aiSnap.ts, AiSnapFree.tsx, AdminAiSnap.tsx (+ AdminSnapSample.tsx)

---

## VenueDetailTabs 다크 판별
- parentElement의 getComputedStyle로 런타임 다크/라이트 감지
- themeConfig background 폴백
- RomanticClassic처럼 페이지는 라이트인데 venue만 다크인 케이스 대응

---

## 선물 리딤 (GiftRedeem.tsx)
- 리딤 성공 후: AI 자동 제작(/ai-create) + 직접 만들기(/create) 2칸 카드 선택지
- AI 쪽 NEW 뱃지, "나중에 만들기" -> 대시보드 이동

---

## 다음 세션 TODO

### 긴급
1. /en 별도 랜딩 경로 (SEO, Product Hunt)
2. 각 테마 내부 남은 한글 하드코딩 (KakaoMap 로딩, placeholder 등)
3. AI 컨시어지 placeholder 한국어 -> locale 대응

### 개발
4. BytePlus SeeDream 백업 파이프라인
5. 알림톡 템플릿 추가 등록
6. 네이버 스마트스토어 AI 스냅 4개 등록

### 마케팅
7. 글로벌 시장 진출 — 감성 중심 리셀링 ("기능" -> "경험")
8. 인스타 + 네이버 블로그 + 커뮤니티 바이럴
9. 검색광고 소재 최적화

### 성장 전략
10. 랜딩 영문 버전 -> Product Hunt / IndieHackers 런칭
11. "경험형 콘텐츠" 포지셔닝
