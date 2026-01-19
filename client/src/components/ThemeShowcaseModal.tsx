import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera, User, ChevronUp, ChevronDown } from 'lucide-react';
import {
  RomanticClassic,
  ModernMinimal,
  BohemianDream,
  LuxuryGold,
  PoeticLove,
  ForestGarden,
  OceanBreeze,
  SeniorSimple,
  GlassBubble,
  SpringBreeze,
  GalleryMirim1,
  GalleryMirim2,
} from '../pages/wedding/themes';

const themeComponents: Record<string, React.ComponentType<any>> = {
  ROMANTIC_CLASSIC: RomanticClassic,
  MODERN_MINIMAL: ModernMinimal,
  BOHEMIAN_DREAM: BohemianDream,
  LUXURY_GOLD: LuxuryGold,
  POETIC_LOVE: PoeticLove,
  SENIOR_SIMPLE: SeniorSimple,
  FOREST_GARDEN: ForestGarden,
  OCEAN_BREEZE: OceanBreeze,
  GLASS_BUBBLE: GlassBubble,
  SPRING_BREEZE: SpringBreeze,
  GALLERY_MIRIM_1: GalleryMirim1,
  GALLERY_MIRIM_2: GalleryMirim2,
  GalleryMirim1,
  GalleryMirim2,
};

interface ThemeShowcase {
  id: string;
  theme: string;
  title: string;
  description: string | null;
  sampleData: any;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SAMPLE = {
  groomName: '민준',
  brideName: '서연',
  weddingDate: '2026-05-15T12:00:00',
  weddingTime: '오후 12시',
  venueName: '그랜드 웨딩홀',
  venueHall: '루체홀',
  venueAddress: '서울시 강남구 테헤란로 123',
  greetingTitle: '저희 두 사람이 사랑으로 만나',
  greetingContent: '서로 아끼고 사랑하며 예쁘게 살겠습니다.\n귀한 걸음 하시어 축복해 주시면 감사하겠습니다.',
  groomFatherName: '김철수',
  groomMotherName: '이영희',
  brideFatherName: '박민수',
  brideMotherName: '최수진',
  galleryImages: [],
  guestbooks: [],
};

export default function ThemeShowcaseModal({ isOpen, onClose }: Props) {
  const [showcases, setShowcases] = useState<ThemeShowcase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  
  const [groomName, setGroomName] = useState('민준');
  const [brideName, setBrideName] = useState('서연');
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchShowcases();
      setShowCustomize(false);
    }
  }, [isOpen]);

  const fetchShowcases = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/theme-showcase`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setShowcases(data);
        } else {
          setShowcases(Object.keys(themeComponents).map((theme) => ({
            id: theme,
            theme,
            title: getThemeName(theme),
            description: null,
            sampleData: DEFAULT_SAMPLE
          })));
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setShowcases(Object.keys(themeComponents).map((theme) => ({
        id: theme,
        theme,
        title: getThemeName(theme),
        description: null,
        sampleData: DEFAULT_SAMPLE
      })));
    } finally {
      setLoading(false);
    }
  };

  const getThemeName = (theme: string) => {
    const names: Record<string, string> = {
      ROMANTIC_CLASSIC: '로맨틱 클래식',
      MODERN_MINIMAL: '모던 미니멀',
      BOHEMIAN_DREAM: '보헤미안 드림',
      LUXURY_GOLD: '럭셔리 골드',
      POETIC_LOVE: '포에틱 러브',
      SENIOR_SIMPLE: '어르신용 심플',
      FOREST_GARDEN: '포레스트 가든',
      OCEAN_BREEZE: '오션 브리즈',
      GLASS_BUBBLE: '글라스 버블',
      SPRING_BREEZE: '봄바람',
    };
    return names[theme] || theme;
  };

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % showcases.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + showcases.length) % showcases.length);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, showcases.length]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const current = showcases[currentIndex];
  const ThemeComponent = current ? themeComponents[current.theme] : null;
  const weddingData = { 
    ...DEFAULT_SAMPLE, 
    ...current?.sampleData,
    groomName: groomName || '민준',
    brideName: brideName || '서연',
    heroMedia: heroImage || null,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-50"
        >
          <X className="w-6 h-6" />
        </button>

        {loading ? (
          <div className="h-full flex items-center justify-center text-white">
            로딩 중...
          </div>
        ) : (
          <div className="h-full flex flex-col md:flex-row">
            {/* 모바일: 접히는 커스터마이즈 패널 */}
            <div className="md:hidden">
              <button
                onClick={() => setShowCustomize(!showCustomize)}
                className="w-full py-3 px-4 bg-white/10 flex items-center justify-between text-white text-sm"
              >
                <span>내 이름으로 미리보기</span>
                {showCustomize ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <AnimatePresence>
                {showCustomize && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white/10 px-4 pb-4 overflow-hidden"
                  >
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-white/60 text-xs mb-1 block">신랑</label>
                        <input
                          type="text"
                          value={groomName}
                          onChange={(e) => setGroomName(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-white/60 text-xs mb-1 block">신부</label>
                        <input
                          type="text"
                          value={brideName}
                          onChange={(e) => setBrideName(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">사진</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    {heroImage && (
                      <div className="mt-2 relative inline-block">
                        <img src={heroImage} alt="" className="h-12 w-12 object-cover rounded-lg" />
                        <button onClick={() => setHeroImage(null)} className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 데스크톱: 사이드 패널 */}
            <div className="hidden md:flex w-72 bg-white/10 backdrop-blur-sm p-5 flex-col gap-4">
              <h3 className="text-white font-medium text-center">내 이름으로 미리보기</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">신랑 이름</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={groomName}
                      onChange={(e) => setGroomName(e.target.value)}
                      placeholder="신랑 이름"
                      className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-white/60 text-xs mb-1 block">신부 이름</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={brideName}
                      onChange={(e) => setBrideName(e.target.value)}
                      placeholder="신부 이름"
                      className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-white/60 text-xs mb-1 block">대표 사진</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="desktop-file-input"
                  />
                  {heroImage ? (
                    <div className="relative">
                      <img src={heroImage} alt="미리보기" className="w-full h-32 object-cover rounded-xl" />
                      <button
                        onClick={() => setHeroImage(null)}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="desktop-file-input"
                      className="w-full py-6 border-2 border-dashed border-white/20 rounded-xl text-white/40 hover:border-white/40 hover:text-white/60 transition-colors flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-xs">사진 업로드</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/10">
                <p className="text-white/40 text-xs text-center">
                  좌우 화살표 또는 스와이프로<br />10가지 테마를 둘러보세요
                </p>
              </div>
            </div>

            {/* 메인 프리뷰 영역 */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="text-center py-3 md:py-4">
                <h2 className="text-lg md:text-xl font-medium text-white">{current?.title}</h2>
                <p className="text-white/40 text-xs mt-1">
                  {currentIndex + 1} / {showcases.length}
                </p>
              </div>

              <div
                className="flex-1 flex items-center justify-center px-4 pb-4 min-h-0"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <button
                  onClick={goPrev}
                  className="hidden md:flex p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors mr-4"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="relative h-full max-h-[70vh] md:max-h-[75vh] aspect-[9/16]">
                  <div className="absolute -inset-2 bg-gradient-to-b from-white/10 to-white/5 rounded-[2rem] blur-lg" />
                  
                  <div className="relative h-full bg-stone-900 rounded-[2rem] p-1.5 shadow-2xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-stone-900 rounded-b-xl" />
                    
                    <div className="h-full bg-white rounded-[1.5rem] overflow-hidden">
                      <div className="w-full h-full overflow-y-auto scrollbar-hide">
                        {ThemeComponent && (
                          <ThemeComponent
                            wedding={weddingData}
                            guestbooks={[]}
                            onRsvpSubmit={() => {}}
                            onGuestbookSubmit={() => {}}
                            isRsvpLoading={false}
                            isGuestbookLoading={false}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={goNext}
                  className="hidden md:flex p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-4"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* 하단 도트 네비게이션 */}
              <div className="flex justify-center gap-1.5 py-3">
                {showcases.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentIndex ? 'bg-white w-4' : 'bg-white/30 w-1.5'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
