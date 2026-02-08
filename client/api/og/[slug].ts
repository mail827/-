import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.redirect(301, '/');
  }

  try {
    const apiBase = process.env.VITE_API_URL || 'https://wedding-api.fly.dev/api';
    const response = await fetch(`${apiBase}/public/wedding/${slug}`);

    if (!response.ok) {
      return res.redirect(302, `/w/${slug}`);
    }

    const data = await response.json();
    const w = data.wedding;
    if (!w) return res.redirect(302, `/w/${slug}`);

    const title = `${w.groomName} ♥ ${w.brideName} 결혼식에 초대합니다`;
    const esc = (s: string) => s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const desc = esc(w.greeting ? w.greeting.substring(0, 120) : `${w.groomName}과 ${w.brideName}의 결혼을 축하해주세요.`);
    const image = w.mainPhoto || w.heroImage || 'https://weddingshop.cloud/og-image.png';
    const url = `https://weddingshop.cloud/w/${slug}`;

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="청첩장 작업실">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="800">
<meta property="og:image:height" content="800">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Event",
  "name": title,
  "description": w.greeting || "",
  "image": image,
  "url": url,
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": { "@type": "Place", "name": w.venue || "", "address": w.venueAddress || "" },
  "startDate": w.weddingDate || "",
  "organizer": { "@type": "Organization", "name": "청첩장 작업실", "url": "https://weddingshop.cloud" }
})}
</script>
<meta http-equiv="refresh" content="0;url=/w/${slug}">
</head>
<body>
<h1>${esc(title)}</h1>
<p>${desc}</p>
<a href="/w/${slug}">청첩장 보기</a>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(html);
  } catch (e) {
    return res.redirect(302, `/w/${slug}`);
  }
}
