# CLAUDE.md — 청첩장 작업실 (Wedding Studio Lab)

## 프로젝트 개요
- 서비스: weddingshop.cloud
- 브랜드: WEDDING ENGINE / 청첩장 작업실
- CEO/리드개발자: 다겸
- 콘텐츠/영상: 가현

## 스택
- Frontend: React/TypeScript + Vite → Vercel (수동배포)
- Backend: Node.js/Express/TypeScript → Fly.io (wedding-api-bitter-butterfly-7766, Tokyo/nrt, 512MB)
- DB: PostgreSQL on Neon DB via Prisma (production: `db push` only, `migrate dev` 절대 금지)
- Storage: Cloudinary (직접 업로드, transformation 없이 원본 저장)
- Payments: TossPayments
- Notifications: Solapi (알림톡)
- AI Image: fal.ai nano-banana-2 파이프라인
- AI Text: OpenAI (웨딩이)
- Maps: Kakao geocoding + OpenStreetMap
- Analytics: GA4 (G-0VMCGVBY8M)
- Repo: github.com/dakyumlee/WeddingStudio
- 경로: `/Users/mac/Desktop/협업/wedding-app/`

## 절대 규칙
- 한번에 여러 가지 동시 수정 금지
- sed 대량 치환 금지 → python3 << 'PYEOF' 사용
- strength/프롬프트/shots 동시 변경 금지
- production DB: `db push`만 (migrate dev 금지)
- macOS sed: `sed -i ''` 사용
- `VITE_API_URL` 끝에 `/api` 포함 → fetch 경로에 `/api` 중복 금지
- 코드에 주석 없음
- No default emojis (lucide-react SVG only)
- Footer: "Made by 청첩장 작업실 ›"
- 파일 수정 전 반드시 cat/grep으로 현재 상태 확인

## 배포 절차
```bash
# 서버
cd server && npm run build && fly deploy -a wedding-api-bitter-butterfly-7766

# 클라이언트
cd client && npm run build
# Vercel 대시보드에서 수동 배포
```

---

## AI 스냅 파이프라인

### 아키텍처
- **aiSnap.ts** — 무료체험 + 관리자 퀵스냅 (1장씩)
- **snapPack.ts** — 유료 스냅팩 (5/10/20장, 체이닝)

### 모델: fal-ai/nano-banana-2/edit
- image_size: 768×1152 (세로형)
- Cloudinary 업로드: transformation 없음

### Strength 설정 (2026-03-11 최종)
**snapPack (getShotStrength):**
- selfie: 0.22
- couple: 0.22
- 클로즈업 couple: 0.13
- 클로즈업 solo: 0.17
- solo 기본: 0.20

**aiSnap (3곳 통일):**
- couple: 0.22
- selfie: 0.22
- solo/cruise: 0.20

### 입력 이미지 전처리
**snapPack:** rawInputUrls → Cloudinary `c_fill,ar_2:3,g_face,w_768,h_1152` 크롭 적용
**aiSnap:** `cropToPortrait()` 헬퍼 함수로 동일 크롭

### Face 프롬프트 (snapPack.ts)
```
keep the exact same face, facial features, face shape, eyes, nose, lips unchanged. maintain exact facial proportions face shape eye spacing nose size lip shape. preserve original facial identity exactly, do not alter or beautify the face, photorealistic, 8k, no text no logos no watermarks, no face elongation no jaw enhancement no face slimming
```

### Negative 프롬프트 (base)
손/하체 기형 방지 포함:
- extra fingers, merged fingers, deformed hands, malformed hands, twisted wrist
- deformed legs, missing legs, fused legs, melted lower body, amorphous body below waist

### Seated 포즈
anatomically correct body proportions 명시 (하체 기형 방지)

### 체이닝 시스템 (snapPack.ts)
- chainRef: 첫 성공 이미지를 모드별 저장
- 스튜디오 컨셉(STUDIO_SET): 체이닝 비활성화
- 시네마틱 컨셉: 체이닝 활성화

### 클로즈업 시스템
- STUDIO_GROOM_SHOTS: 8개 (기존 5 + bust_confident, closeup_smile, bust_side)
- STUDIO_BRIDE_SHOTS: 8개 (기존 5 + bust_soft, closeup_gaze, bust_profile)
- getShotStrength: shot.id가 bust_ 또는 closeup_ 시작이면 자동 strength 낮춤

---

## 컨셉 총 33개
(이전 CLAUDE.md와 동일 — 스튜디오5, 아웃도어/한복8, 시네마틱14, 다이나믹6)

---

## 4파일 동기화 패턴 (컨셉 추가 시)
1. `server/src/routes/snapPack.ts`
2. `server/src/routes/aiSnap.ts`
3. `client/src/pages/AiSnapFree.tsx`
4. `client/src/pages/admin/AdminAiSnap.tsx`
5. `client/src/pages/admin/AdminSnapSample.tsx`

---

## 청첩장 테마 시스템

### themeConfig 위치
`client/src/pages/wedding/themes/shared/themeConfig.ts`

### hidden 테마 (2026-03-11 기준)
- POETIC_LOVE
- SPRING_BREEZE
- WAVE_BORDER
- VOYAGE_BLUE (수정 후 해제 예정)
- AQUA_GLOBE

### 에디토리얼 시리즈 (5종)
- Editorial.tsx, EditorialWhite.tsx, EditorialBlue.tsx, EditorialBrown.tsx, EditorialGreen.tsx
- 데스크탑: outer div (전체 배경) + inner div (max-w-3xl mx-auto)
- 각각 AccountCard 서브 컴포넌트 포함

### 히어로 이미지 초점 조정
- DB: `heroImagePosition` (String?, default "50% 50%")
- 관리자 에디터: 클릭으로 초점 위치 설정 (crosshair cursor + 포인트 표시)
- 에디토리얼 5종에 objectPosition 적용 완료

### 테마 추가 시 7곳 등록 필수
테마.tsx → themeConfig → index.ts → WeddingPage → types(Theme+NAMES+COLORS) → prisma enum + db push → UI 7곳

---

## 면상 보존 — 현재 상태 (2026-03-11)

### 핵심 문제
nano-banana-2는 img2img 모델이라 strength 트레이드오프 불가피:
- 높이면 (0.22+): 씬/의상 전환 O, 얼굴 보존 X
- 낮추면 (0.15-): 얼굴 보존 O, 씬/의상 전환 X

### 테스트 완료 (전부 실서비스 부적합)
| 모델 | 결과 |
|------|------|
| SeeDream 5.0 (seedream-5-0-260128) | 퀄 좋지만 얼굴 완전 다른 사람 |
| WaveSpeedAI InfiniteYou (face-swap) | 불쾌한 골짜기 |
| HuggingFace InfiniteYou aes_stage2 | 스무디/미화 심함 |
| HuggingFace InfiniteYou sim_stage1 | 성형 느낌 (미테스트 — 쿼터 초과) |
| Easel AI face-swap | Fly.io 도쿄에서 타임아웃 (비활성화) |
| PuLID Flux | auth 에러 (비활성화) |

### 현재 최선
nano-banana-2 couple 0.22 / solo 0.20 + 크롭 + 클로즈업 strength 자동 조절

### 대기 중
- Virgil (BytePlus): SeeDream 5.0 face reference 파라미터 확인 중
- InfiniteYou sim_stage1: HuggingFace 쿼터 리셋 후 재테스트
- BytePlus Seedance 2.0: 화이트리스트 대기 (사용량 쌓아야 함)

### 절대 안 되는 것들
- "preserve Korean facial features" → 평균 한국인 얼굴 생성 (금지)
- "jaw line" → 남성 얼굴 각진 변형 (제거)
- Cloudinary transformation → 화질 열화 (제거)
- guidance_scale 6 이상 → 얼굴 뭉개짐
- face 프롬프트 과도하게 길게 → 토큰 오버로드

---

## 제휴
- 포에버웨딩: FOREVER20 (20% 할인), 체험단 진행중
- 웨딩줌인: ZOOMIN20 (20% 할인)
- 위에이블: 이탈

## 가격
- Lite: 3만원
- Basic: 8만원
- AI Reception: 12.9만원
- Basic+영상: 40만원

---

## 주요 파일 위치
- `server/src/routes/snapPack.ts` — 유료 AI 스냅팩 파이프라인
- `server/src/routes/aiSnap.ts` — 무료/관리자 스냅
- `client/src/pages/wedding/themes/shared/themeConfig.ts` — 테마 설정
- `client/src/pages/admin/AdminWeddingEdit.tsx` — 관리자 에디터
- `client/src/pages/wedding/themes/Editorial*.tsx` — 에디토리얼 5종
- `client/src/pages/wedding/WeddingPage.tsx` — 테마 라우터

## API 키 (환경변수)
- fal.ai: FAL_KEY
- BytePlus SeeDream: d73850b6-a7b9-4904-aae8-09205a94b241 (seedream-5-0-260128)
- WaveSpeedAI: 377e071f8855274d1772e1c65162b79e1d1291b3773b9379e1e16a4a7f2b2e20
- Replicate: r8_6TSwmupmyTV3gOGdkFKJJgP0NePZh8G0sSBWl (크레딧 없음)

## 미완료 항목
- VoyageBlue 수정 후 hidden 해제
- 에디토리얼 상단 섹션 배경색 교차 분리감
- 히어로 글자+얼굴 겹침 확인
- 면상 보존 근본 해결 (대기 중)
- 네이버/구글 서치콘솔 등록
- 알림톡 템플릿 추가 등록
- AI Reception 블로그 포스팅
