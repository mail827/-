import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const ENVELOPE_TEMPLATES: Record<string, string> = {
  black_ribbon: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/7_errq8w.png',
  white_ribbon: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png',
  navy_seal: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/1_zdaupp.png',
  black_silver: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png',
  olive_ribbon_a: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/3_wdfeio.png',
  olive_ribbon_b: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png',
  pink_ribbon: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/5_pzmfwy.png',
  white_bow: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/11_o3gnaj.png',
  white_seal: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png',
  black_seal: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png',
  pink_seal: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551604/6_akrfek.png',
  olive_seal: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png',
};

function getEnvelopeOgImage(baseUrl: string, groomName: string, brideName: string, dateStr: string): string {
  if (!baseUrl.includes('cloudinary.com')) return baseUrl;
  const text = `${groomName} %26 ${brideName}`;
  const dateText = dateStr || '';
  const nameOverlay = `l_text:Noto Sans KR_32_bold:${encodeURIComponent(text)},co_rgb:3a3a3a,g_center,y_-20`;
  const dateOverlay = `l_text:Noto Sans KR_18:${encodeURIComponent(dateText)},co_rgb:8a8a8a,g_center,y_30`;
  return baseUrl.replace('/upload/', `/upload/w_1200,h_630,c_fill/${nameOverlay}/${dateOverlay}/`);
}

router.get('/pair/:code', async (req: Request, res: Response) => {
  const { code } = req.params;
  try {
    const invite = await prisma.pairInvite.findUnique({
      where: { code },
      include: { wedding: true }
    });
    if (!invite || !invite.wedding) return res.redirect(302, `https://weddingshop.cloud/pair/accept?code=${code}`);
    const w = invite.wedding;
    const title = esc(`${w.groomName} & ${w.brideName} 청첩장을 함께 꾸며요`);
    const desc = esc(`${w.groomName}과 ${w.brideName}의 청첩장을 같이 수정할 수 있도록 초대합니다.`);
    const image = w.heroMedia || 'https://weddingshop.cloud/og-image.png';
    const url = `https://weddingshop.cloud/pair/accept?code=${code}`;
    const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<title>${title}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="청첩장 작업실">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="800">
<meta property="og:image:height" content="800">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${image}">
<meta http-equiv="refresh" content="0;url=${url}">
</head><body><h1>${title}</h1><p>${desc}</p><a href="${url}">초대 수락하기</a></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).send(html);
  } catch (e) {
    res.redirect(302, `https://weddingshop.cloud/pair/accept?code=${code}`);
  }
});

router.get('/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const w = await prisma.wedding.findUnique({ where: { slug } });
    if (!w) return res.redirect(302, `https://weddingshop.cloud/w/${slug}`);

    const ogType = (w as any).ogCoverType || 'default';
    const ogCustomTitle = (w as any).ogCustomTitle;
    const ogCustomImage = (w as any).ogCustomImage;

    let title: string;
    if (ogCustomTitle) {
      title = esc(ogCustomTitle);
    } else {
      title = esc(`${w.groomName} ♥ ${w.brideName} 결혼식에 초대합니다`);
    }

    const desc = esc(w.greeting ? w.greeting.substring(0, 120) : `${w.groomName}과 ${w.brideName}의 결혼을 축하해주세요.`);

    let image: string;
    if (ogType === 'custom' && ogCustomImage) {
      image = ogCustomImage;
    } else if (ogType === 'envelope') {
      const envelopeStyle = (w as any).envelopeStyle || 'black_ribbon';
      image = ogCustomImage || ENVELOPE_TEMPLATES[envelopeStyle] || ENVELOPE_TEMPLATES.black_ribbon;
    } else {
      image = w.heroMedia || 'https://weddingshop.cloud/og-image.png';
    }

    const url = `https://weddingshop.cloud/w/${slug}`;

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="청첩장 작업실">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">
${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Event",
      "name": `${w.groomName} ♥ ${w.brideName} 결혼식에 초대합니다`,
      "description": w.greeting || "",
      "image": image,
      "url": url,
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": { "@type": "Place", "name": w.venue || "", "address": w.venueAddress || "" },
      "startDate": w.weddingDate || "",
      "organizer": { "@type": "Organization", "name": "청첩장 작업실", "url": "https://weddingshop.cloud" }
    })}
</script>
<meta http-equiv="refresh" content="0;url=${url}">
</head>
<body>
<h1>${title}</h1>
<p>${desc}</p>
<a href="${url}">청첩장 보기</a>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).send(html);
  } catch (e) {
    res.redirect(302, `https://weddingshop.cloud/w/${slug}`);
  }
});

export default router;
