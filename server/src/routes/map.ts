import { Router } from 'express';

const router = Router();
const KAKAO_KEY = process.env.KAKAO_CLIENT_ID;

async function geocode(address: string): Promise<{lng: string, lat: string} | null> {
  if (!KAKAO_KEY) return null;
  const kw = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(address)}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
  );
  const kwData = await kw.json() as any;
  if (kwData.documents?.length > 0) {
    return { lng: kwData.documents[0].x, lat: kwData.documents[0].y };
  }
  const addr = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
  );
  const addrData = await addr.json() as any;
  if (addrData.documents?.length > 0) {
    return { lng: addrData.documents[0].x, lat: addrData.documents[0].y };
  }
  return null;
}

router.get('/static', async (req, res) => {
  try {
    const { address, width, height, zoom } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'address required' });
    }

    const coords = await geocode(String(address));
    if (!coords) {
      return res.status(404).json({ error: 'address not found' });
    }

    const w = Math.min(Number(width) || 600, 600);
    const h = Math.min(Number(height) || 400, 400);
    const z = Number(zoom) || 16;

    const osmUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lng}&zoom=${z}&size=${w}x${h}&markers=${coords.lat},${coords.lng},red-pushpin`;

    const mapRes = await fetch(osmUrl);
    if (!mapRes.ok) {
      return res.status(mapRes.status).json({ error: 'map fetch failed' });
    }

    const arrayBuf = await mapRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    res.set({
      'Content-Type': mapRes.headers.get('content-type') || 'image/png',
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(buffer);
  } catch (e) {
    console.error('Map proxy error:', e);
    res.status(500).json({ error: 'internal error' });
  }
});

router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'address required' });
    }
    const coords = await geocode(String(address));
    if (!coords) {
      return res.status(404).json({ error: 'not found' });
    }
    res.json(coords);
  } catch (e) {
    res.status(500).json({ error: 'internal error' });
  }
});

export const mapRouter = router;
