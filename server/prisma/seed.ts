import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.package.createMany({
    data: [
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
        name: 'Basic + 영상',
        slug: 'basic-video',
        price: 400000,
        description: '청첩장 + 영상 패키지',
        features: ['Basic 전체 기능', '1분 하이라이트 영상', '토끼작업실 편집', '수정 무제한', '평생 호스팅', '원본 파일 제공', '🎉 런칭특가'],
        isActive: true,
        sortOrder: 3,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ 패키지 데이터 추가 완료');
}

main().catch(console.error).finally(() => prisma.$disconnect());
