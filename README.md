# 💒 Wedding Invitation Web App

모던하고 감성적인 디지털 청첩장 생성 플랫폼

## ✨ 주요 기능

### 🎨 5가지 테마
- **로맨틱 클래식** - 따뜻한 로즈골드 톤의 우아한 감성
- **모던 미니멀** - 깔끔한 블랙&화이트 미니멀리즘
- **보헤미안 드림** - 자연스러운 그린&브라운 톤
- **럭셔리 골드** - 고급스러운 블랙&골드 무드
- **플레이풀 팝** - 밝고 발랄한 컬러풀 스타일

### 📱 청첩장 섹션
1. **히어로** - 대표 이미지/영상, 신랑신부 이름, D-day 카운트다운
2. **인사말** - 혼주 정보 포함 옵션
3. **갤러리** - 사진/영상 슬라이드
4. **예식 정보** - 날짜, 시간, 장소 + 네이버/카카오/티맵 연동
5. **참석 여부** - RSVP 폼 (측, 인원, 식사 여부)
6. **축의금 안내** - 계좌 복사, 토스/카카오페이 링크
7. **방명록** - 비밀번호 보호 메시지
8. **마무리 인사** - 감사 메시지 + 연락 버튼
9. **공유하기** - 카카오톡/인스타그램/링크 복사

### 🔧 관리자 기능
- 다겸 & 가현 전용 관리자 패널
- 청첩장 CRUD
- RSVP 현황 (참석/불참, 측별 통계, CSV 내보내기)
- 방명록 관리
- 실시간 대시보드

## 🛠 기술 스택

**Frontend**
- React 18 + TypeScript + Vite
- TailwindCSS + Framer Motion
- Zustand + TanStack Query
- Lucide Icons

**Backend**
- Express.js + TypeScript
- Prisma ORM + PostgreSQL (NeonDB)
- JWT Authentication
- Cloudinary (이미지/영상/음악)

## 🚀 실행 방법

### 1. 환경변수 설정

```bash
# server/.env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
ADMIN_EMAIL_1="oicrcutie@gmail.com"
ADMIN_PASSWORD_1="aa667788!!"
ADMIN_NAME_1="다겸"
ADMIN_EMAIL_2="gah7186@naver.com"
ADMIN_PASSWORD_2="gah981107"
ADMIN_NAME_2="가현"
```

### 2. 서버 실행

```bash
cd server
npm install
npx prisma db push
npm run db:seed  # 관리자 계정 생성
npm run dev      # localhost:4000
```

### 3. 클라이언트 실행

```bash
cd client
npm install
npm run dev      # localhost:5173
```

## 📁 프로젝트 구조

```
wedding-app/
├── client/
│   ├── src/
│   │   ├── components/admin/    # 관리자 컴포넌트
│   │   ├── pages/
│   │   │   ├── admin/           # 관리자 페이지들
│   │   │   └── wedding/         # 공개 청첩장 페이지
│   │   ├── hooks/               # useAuth
│   │   ├── types/               # TypeScript 타입
│   │   └── utils/               # API 유틸
│   └── index.html
├── server/
│   ├── src/
│   │   ├── routes/              # API 라우트
│   │   ├── middleware/          # Auth 미들웨어
│   │   └── utils/               # Prisma, Cloudinary
│   └── prisma/schema.prisma
└── README.md
```

## 🔗 URL 구조

- `/admin/login` - 관리자 로그인
- `/admin` - 대시보드
- `/admin/weddings` - 청첩장 목록
- `/admin/weddings/new` - 새 청첩장 생성
- `/admin/weddings/:id` - 청첩장 수정
- `/admin/weddings/:id/rsvp` - RSVP 목록
- `/admin/weddings/:id/guestbook` - 방명록
- `/w/:slug` - 공개 청첩장 페이지

## 💕 Made by 다겸 & 가현
