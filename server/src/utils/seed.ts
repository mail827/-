import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPackages() {
  const packages = [
    {
      name: 'Lite',
      slug: 'lite',
      price: 30000,
      description: '테마 1종 + 어르신 테마',
      features: ['테마 1종 자유선택', '어르신 테마 기본제공', '1회 수정', '30일 호스팅', '카카오톡/문자 공유', 'RSVP 관리'],
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Basic',
      slug: 'basic',
      price: 80000,
      description: '전체 테마 무제한',
      features: ['전체 8가지 테마', '테마 변경 무제한', '3회 수정', '1년 호스팅', '갤러리 20장', '배경음악', 'RSVP+방명록'],
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'AI Reception',
      slug: 'ai-reception',
      price: 150000,
      description: '나만의 AI 비서가 하객을 맞이해요',
      features: ['Basic 전체 기능', '나만의 AI 비서 작명', '신랑/신부 듀얼 페르소나', '비밀 폭로전 모드', '실시간 방명록 답장', '교통/주차/뷔페 안내', '평생 호스팅'],
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'Basic + 영상',
      slug: 'basic-video',
      price: 400000,
      description: '청첩장 + 영상 패키지',
      features: ['Basic 전체 기능', '1분 하이라이트 영상', '토끼작업실 편집', '수정 무제한', '평생 호스팅', '원본 파일 제공', '런칭특가'],
      isActive: true,
      sortOrder: 4,
    },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { slug: pkg.slug },
      update: {
        name: pkg.name,
        price: pkg.price,
        description: pkg.description,
        features: pkg.features,
        isActive: pkg.isActive,
        sortOrder: pkg.sortOrder,
      },
      create: pkg,
    });
  }
  
  console.log('✅ 패키지 데이터 동기화 완료!');
}
