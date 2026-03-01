import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const USER_ID = "cmk802hhv00005dywv69bagfy";

const demos = [
  { theme: "GALLERY_MIRIM_1" as const, name: "갤러리 미림", desc: "감성 갤러리 · 필름톤" },
  { theme: "BOTANICAL_CLASSIC" as const, name: "보태니컬", desc: "세이지그린 · 내추럴" },
  { theme: "LUXURY_GOLD" as const, name: "럭셔리 골드", desc: "골드 · 프리미엄" },
  { theme: "OCEAN_BREEZE" as const, name: "오션", desc: "바다 · 시원한 블루" },
  { theme: "HEART_MINIMAL" as const, name: "하트 미니멀", desc: "옐로우오렌지 · 미니멀" },
];

async function main() {
  const showcases: { name: string; url: string; description: string }[] = [];

  for (const d of demos) {
    const slug = `demo-${d.theme.toLowerCase().replace(/_/g, "-")}-${Date.now().toString(36)}`;
    await p.wedding.create({
      data: {
        userId: USER_ID,
        slug,
        theme: d.theme,
        isPublished: true,
        weddingDate: new Date("2025-12-25"),
        weddingTime: "오후 2:00",
        groomName: "",
        brideName: "",
        venue: "",
        venueAddress: "",
        greeting: "서로의 마음을 확인하고\n하나의 길을 함께 걸으려 합니다",
      },
    });
    const url = `https://weddingshop.cloud/w/${slug}`;
    showcases.push({ name: d.name, url, description: d.desc });
    console.log(`[OK] ${d.name} → ${url}`);
  }

  await p.siteContent.upsert({
    where: { key: "theme_showcase_urls" },
    update: { content: JSON.stringify(showcases) },
    create: { key: "theme_showcase_urls", title: "테마 쇼케이스 URL", content: JSON.stringify(showcases) },
  });

  console.log("\n[DONE] 쇼케이스 5개 자동 등록 완료");
  await p.$disconnect();
}

main().catch((e) => { console.error(e); p.$disconnect(); });
