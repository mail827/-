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


    if (wedding?.expiresAt && new Date() > new Date(wedding.expiresAt)) {
      return res.json({ wedding, status: "expired" });
    }

    if (!wedding) {
      return res.status(404).json({ error: '청첩장을 찾을 수 없습니다' });
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

export default router;
