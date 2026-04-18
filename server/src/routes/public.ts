import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/packages', async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
    res.json(packages);
  } catch (error) {
    console.error('Packages error:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

router.get('/themes', async (req, res) => {
  try {
    const themes = [
      { id: 'modern-minimal', name: '모던 미니멀', description: '깔끔하고 세련된 디자인', preview: '/themes/modern.jpg' },
      { id: 'romantic-classic', name: '로맨틱 클래식', description: '우아하고 낭만적인 디자인', preview: '/themes/romantic.jpg' },
      { id: 'forest-garden', name: '포레스트 가든', description: '자연 속 정원 같은 디자인', preview: '/themes/forest.jpg' },
      { id: 'bohemian-dream', name: '보헤미안 드림', description: '자유롭고 감성적인 디자인', preview: '/themes/bohemian.jpg' },
      { id: 'luxury-gold', name: '럭셔리 골드', description: '고급스럽고 화려한 디자인', preview: '/themes/luxury.jpg' },
      { id: 'ocean-breeze', name: '오션 브리즈', description: '시원하고 청량한 바다 디자인', preview: '/themes/ocean.jpg' },
      { id: 'playful-pop', name: '플레이풀 팝', description: '발랄하고 컬러풀한 디자인', preview: '/themes/playful.jpg' },
      { id: 'senior-simple', name: '시니어 심플', description: '어르신도 보기 편한 큰 글씨', preview: '/themes/senior.jpg' },
    ];
    res.json(themes);
  } catch (error) {
    console.error('Themes error:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

router.get('/wedding/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const wedding = await prisma.wedding.findUnique({
      where: { slug },
      include: {
        galleries: {
          orderBy: { order: 'asc' }
        }
      }
    });


    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    }

    if (wedding.expiresAt === null) {
      return res.json({ wedding, status: "active" });
    }

    const now = new Date();
    const weddingDate = wedding.weddingDate ? new Date(wedding.weddingDate) : null;

    if (weddingDate && now > weddingDate) {
      const archiveDeadline = new Date(weddingDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      if (now <= archiveDeadline) {
        return res.json({ wedding, status: "archive" });
      }
      return res.json({ wedding, status: "expired" });
    }

    if (wedding.expiresAt && now > new Date(wedding.expiresAt)) {
      return res.json({ wedding, status: "expired" });
    }

    res.json({ wedding, status: "active" });
  } catch (error) {
    console.error('Get public wedding error:', error);
    res.status(500).json({ error: '청첩장 조회 중 오류가 발생했습니다' });
  }
});

router.get('/wedding/:slug/guestbook', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const wedding = await prisma.wedding.findUnique({
      where: { slug },
      select: { id: true }
    });



    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
    }

    const guestbooks = await prisma.guestbook.findMany({
      where: { weddingId: wedding.id, isHidden: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        message: true,
        createdAt: true
      }
    });

    res.json({ guestbooks });
  } catch (error) {
    console.error('Get public guestbook error:', error);
    res.status(500).json({ error: '방명록 조회 중 오류가 발생했습니다' });
  }
});

router.post('/inquiry', async (req, res) => {
  const { name, email, phone, type, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: '필수 항목을 입력해주세요' });
  }
  
  try {
    const inquiry = await prisma.inquiry.create({
      data: { name, email, phone, type: type || 'general', message },
    });
    res.status(201).json(inquiry);
  } catch (error) {
    console.error('Inquiry creation error:', error);
    res.status(500).json({ error: '문의 등록 실패' });
  }
});

router.get('/reviews', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isPublic: true },
      include: { 
        wedding: { 
          select: { 
            groomName: true, 
            brideName: true,
            order: {
              select: {
                package: {
                  select: { name: true }
                }
              }
            }
          } 
        } 
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    res.json(reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      source: r.source,
      groomName: r.wedding.groomName,
      brideName: r.wedding.brideName,
      packageName: r.wedding.order?.package?.name || null,
      createdAt: r.createdAt
    })));
  } catch (error) {
    console.error('Reviews error:', error);
    res.status(500).json({ error: '후기 조회 실패' });
  }
});


router.get('/archive/toss-key', (_req, res) => {
  res.json({ clientKey: process.env.TOSS_CLIENT_KEY });
});

router.post('/archive/payment-request', async (req, res) => {
  try {
    const { weddingId } = req.body;
    if (!weddingId) return res.status(400).json({ error: 'weddingId required' });

    const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
    if (!wedding) return res.status(404).json({ error: 'Not found' });

    const orderId = `ARCHIVE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const amount = 9900;

    res.json({
      clientKey: process.env.TOSS_CLIENT_KEY,
      orderId,
      amount,
      orderName: '영구 아카이브 업그레이드',
      weddingId,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/archive/payment-confirm', async (req, res) => {
  try {
    const { paymentKey, orderId, amount, weddingId } = req.body;

    if (amount !== 9900) return res.status(400).json({ error: 'Invalid amount' });

    const secretKey = process.env.TOSS_SECRET_KEY!;
    const authHeader = Buffer.from(secretKey + ':').toString('base64');

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: { 'Authorization': 'Basic ' + authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      console.error('[archive] Toss confirm error:', tossData);
      return res.status(400).json({ error: tossData.message || 'Payment failed' });
    }

    const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
    if (!wedding) return res.status(404).json({ error: 'Wedding not found' });

    await prisma.wedding.update({
      where: { id: weddingId },
      data: { expiresAt: null },
    });

    console.log('[archive] Upgraded to permanent:', { weddingId, orderId, paymentKey, amount });

    res.json({ success: true });
  } catch (e: any) {
    console.error('[archive] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});


// 내부 테스트 계정 (매출 통계에서 제외)
const INTERNAL_EMAILS = ['hae051198@naver.com', 'oicrcutie@gmail.com'];

// 5분 캐시
let statsCache: { data: any; expiresAt: number } | null = null;
const STATS_TTL_MS = 5 * 60 * 1000;

router.get('/stats', async (_req, res) => {
  try {
    const now = Date.now();
    if (statsCache && statsCache.expiresAt > now) {
      return res.json(statsCache.data);
    }

    const internalUsers = await prisma.user.findMany({
      where: { email: { in: INTERNAL_EMAILS } },
      select: { id: true }
    });
    const internalIds = internalUsers.map((u: { id: string }) => u.id);

    const totalSnaps = await prisma.aiSnap.count({
      where: {
        resultUrl: { not: null },
        userId: internalIds.length ? { notIn: internalIds } : undefined
      }
    });

    const userGroups = await prisma.aiSnap.groupBy({
      by: ['userId'],
      where: {
        resultUrl: { not: null },
        userId: internalIds.length ? { notIn: internalIds } : { not: null }
      }
    });
    const totalUsers = userGroups.length;

    const data = { totalSnaps, totalUsers };
    statsCache = { data, expiresAt: now + STATS_TTL_MS };
    res.json(data);
  } catch (e) {
    console.error('stats error', e);
    res.json({ totalSnaps: 0, totalUsers: 0 });
  }
});

export default router;
