# 리팩토링 기준

## 리팩토링 해도 되는 경우
- 사용하지 않는 import 제거
- 중복 코드 3회 이상 발견 시 공통 함수 추출
- 컬러 하드코딩 → 상수 객체(C)로 이동
- 같은 스타일 반복 → CSS 클래스로 추출 (themeStyles)

## 리팩토링 하면 안 되는 경우
- shared 모듈 구조 변경 (RsvpForm, GuestbookForm 등 — 모든 테마 영향)
- ThemeProps 인터페이스 변경
- WeddingPage.tsx의 themeComponents 매핑 구조 변경
- 기존 테마 파일의 함수명/export 변경
- Prisma schema enum 값 변경 (기존 데이터 유실)

## 테마 파일 리팩토링 원칙
- 각 테마는 독립적 — 공통 코드를 억지로 추출하지 않음
- AccountCard는 각 테마 내부에 정의 (C 상수 직접 참조)
- variant 스타일은 shared 모듈에서 관리

## DB 관련
- enum 값 삭제 금지 (기존 데이터 참조)
- hidden 플래그로 숨기기만 가능
- 기존 고객 청첩장이 있는 테마는 함부로 교체 금지 → DB 조회 먼저

## 성능
- 이미지: Cloudinary 변환으로 최적화 (리사이즈, 포맷 변환)
- 테마 컴포넌트: lazy import (WeddingPage에서 lazy(() => import()))
- 갤러리: slice(0, 9) — 최대 9장 표시
