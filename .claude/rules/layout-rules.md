# 레이아웃 규칙

## 모바일 퍼스트
- 모든 청첩장은 모바일 단일 스크롤 페이지
- 기본 뷰포트: 390px 기준
- 데스크탑에서도 자연스럽게 확장 (max-width 강제 제한 없음)

## 히어로 섹션
- 높이: JS `window.innerHeight` 고정 (dvh/svh 아닌 useState로 초기 고정)
- 사진: 풀블리드 (edge-to-edge)
- 그라디언트: 상단+하단 양방향
- 글자: 얼굴 마스크 피해서 상단/하단 분리 배치

## 섹션 구분
- 여백과 배경색 전환으로 구분 (코너 장식, 골드 라인, 프레임 제거)
- 라이트 배경 ↔ 다크 배경 교차로 리듬감
- 에디토리얼 시리즈: borderTop으로 섹션 분리

## 히어로 사진 품질
- heroUrl: Cloudinary q_90,w_1800,c_limit (f_auto 제거 — 원본 포맷 유지)
- galleryThumbUrl: w_500,q_auto
- heroMedia fallback: heroMedia 없으면 galleries[0] 사용

## 에디토리얼 히어로 구조
- Editorial 다크/화이트: MARRIED 대형 타이포 → 사진 풀블리드
- Editorial 그린: GREEN → 사진 (75% 너비) → UNION
- Editorial 블루: BLUE → 사진 (75% 너비) → MOMENT
- Editorial 브라운: PURE → 사진 (75% 너비) → LOVE

## 갤러리 그리드
- 2열 그리드, gap-2
- 첫 번째: col-span-2 (풀폭, 4:3 또는 16:9)
- 나머지: 1:1 정사각형
- 프레임/테두리/그림자 없음

## 캘린더
- 7열 그리드
- 일요일: accent 색상
- 결혼 당일: 원형 border 표시
