import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

router.get('/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const w = await prisma.wedding.findUnique({ where: { slug } });
    if (!w) return res.redirect(302, `https://weddingshop.cloud/w/${slug}`);

    const title = esc(`${w.groomName} ♥ ${w.brideName} 결혼식에 초대합니다`);
    const desc = esc(w.greeting ? w.greeting.substring(0, 120) : `${w.groomName}과 ${w.brideName}의 결혼을 축하해주세요.`);
    const image = w.heroMedia || 'https://weddingshop.cloud/og-image.png';
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
<meta property="og:image:width" content="800">
<meta property="og:image:height" content="800">
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
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(html);
  } catch (e) {
    res.redirect(302, `https://weddingshop.cloud/w/${slug}`);
  }
});

export default router;
