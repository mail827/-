# 인터랙션 원칙

## 스크롤 애니메이션 (framer-motion)

### 섹션 진입
```tsx
initial={{ opacity: 0, y: 40 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, margin: '-50px' }}
transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
```

### 섹션 타이틀 (에디토리얼 외 — letter-spacing morph)
```tsx
initial={{ opacity: 0, letterSpacing: '0.6em' }}
whileInView={{ opacity: 1, letterSpacing: '0.4em' }}
viewport={{ once: true }}
transition={{ duration: 1.2 }}
```

### 사진 진입
```tsx
initial={{ opacity: 0, scale: 1.05 }}
whileInView={{ opacity: 1, scale: 1 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
```

### 히어로 텍스트 stagger
delay: 0.15s씩 증가 (0.15, 0.3, 0.45, 0.6...)

### 히어로 사진 줌아웃
CSS keyframe: scale(1.08) → scale(1), 4s ease-out

## 음악 버튼
- 이퀄라이저 바 애니메이션 (4개 바, stagger delay)
- 재생: 바 높이 애니메이션
- 정지: 바 높이 4px 고정
- 위치: fixed top-5 right-5 z-50
- 배경: backdrop-blur-sm + 테마 배경색 85% opacity

## 축의금 아코디언
- AnimatePresence + motion.div
- initial={{ height: 0 }} → animate={{ height: 'auto' }}
- ChevronDown rotate 180deg 토글

## 복사 버튼
- 클릭 시: Copy → Check 아이콘 + "완료" 텍스트
- 2초 후 원복
- accent 색상으로 전환

## 공유
- ShareModal 컴포넌트 사용
- 카카오톡 / 인스타그램 / SMS

## 갤러리
- 사진 tap → GalleryModal
- hover: scale(1.05) transition 700ms

## 지도 버튼
- 네이버 / 카카오맵 / 티맵
- 에디토리얼: 밑줄 링크 (NAVER MAP / KAKAO MAP / T MAP)
- 나머지: rounded-full pill 버튼
