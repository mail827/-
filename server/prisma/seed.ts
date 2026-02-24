import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const packages = [
    {
      name: 'Lite',
      slug: 'lite',
      price: 30000,
      description: '테마 1종 + 어르신 테마',
      features: ['테마 1종 자유선택', '어르신 테마 기본제공', '1회 수정', '30일 호스팅', '카카오톡/문자 공유', 'RSVP 관리', 'AI 웨딩스냅 1장', '🎉 런칭특가 50,000원 → 30,000원'],
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Basic',
      slug: 'basic',
      price: 80000,
      description: '전체 테마 무제한',
      features: ['전체 19가지 테마', '테마 변경 무제한', '3회 수정', '3개월 호스팅', '갤러리 20장', '배경음악', 'RSVP+방명록', 'AI 웨딩스냅 3장', '🎉 런칭특가 100,000원 → 80,000원'],
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'AI Reception',
      slug: 'ai-reception',
      price: 129000,
      description: '나만의 AI 비서가 하객을 맞이해요',
      features: ['Basic 전체 기능', '나만의 AI 비서 작명', '신랑/신부 듀얼 페르소나', '비밀 폭로전 모드', '실시간 방명록 답장', '교통/주차/뷔페 안내', '3개월 호스팅', 'AI 웨딩스냅 10장', '🎉 런칭특가 150,000원 → 129,000원'],
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'Basic + 영상',
      slug: 'basic-video',
      price: 400000,
      description: '청첩장 + 영상 패키지',
      features: ['Basic 전체 기능', '1분 하이라이트 영상', '토끼작업실 편집', '수정 무제한', '3개월 호스팅', '원본 파일 제공', 'AI 웨딩스냅 3장', '🎉 런칭특가 550,000원 → 400,000원'],
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
  
  console.log('✅ 패키지 데이터 업데이트 완료');
}

main().catch(console.error).finally(() => prisma.$disconnect());
