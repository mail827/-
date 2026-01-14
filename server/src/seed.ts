import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const packages = [
    {
      name: 'Lite',
      slug: 'lite',
      price: 30000,
      description: '셀프로 간편하게 만드는 청첩장',
      features: ['기본 테마 5종', '즉시 발행', '카카오톡 공유', 'RSVP 관리', '방명록'],
      sortOrder: 1,
    },
    {
      name: 'Basic',
      slug: 'basic',
      price: 80000,
      description: 'AI 상담과 함께 만드는 맞춤 청첩장',
      features: ['테마 8종', 'AI 상담 지원', '테마 커스터마이징', '갤러리 20장', '배경음악', '어르신용 테마'],
      sortOrder: 2,
    },
    {
      name: 'Basic + 영상',
      slug: 'basic-video',
      price: 400000,
      description: '청첩장과 1분 하이라이트 영상 패키지',
      features: ['Basic 청첩장 포함', '1분 하이라이트 영상', '토끼작업실 편집', '원본 파일 제공', '청첩장 내 영상 삽입', '🎉 런칭 특가'],
      sortOrder: 3,
    },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { slug: pkg.slug },
      update: pkg,
      create: pkg,
    });
    console.log(`✅ Package ${pkg.name} created/updated`);
  }

  await prisma.package.deleteMany({
    where: { slug: { in: ['standard', 'premium'] } }
  });
  console.log('🗑️ Removed old packages');

  console.log('🌱 Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
