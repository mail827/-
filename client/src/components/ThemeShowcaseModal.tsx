import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera, User } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchShowcases();
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-6xl h-[90vh] flex flex-col md:flex-row gap-6"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-white">
              로딩 중...
            </div>
          ) : (
            <>
              <div className="w-full md:w-72 bg-white/10 backdrop-blur-sm rounded-2xl p-5 flex flex-col gap-4">
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
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
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
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-6 border-2 border-dashed border-white/20 rounded-xl text-white/40 hover:border-white/40 hover:text-white/60 transition-colors flex flex-col items-center gap-2"
                      >
                        <Camera className="w-6 h-6" />
                        <span className="text-xs">사진 업로드</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/10">
                  <p className="text-white/40 text-xs text-center">
                    좌우로 스와이프해서<br />10가지 테마를 둘러보세요
                  </p>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-medium text-white mb-1">{current?.title}</h2>
                  {current?.description && (
                    <p className="text-white/60 text-sm">{current.description}</p>
                  )}
                  <p className="text-white/40 text-xs mt-2">
                    {currentIndex + 1} / {showcases.length}
                  </p>
                </div>

                <div
                  className="flex-1 flex items-center justify-center gap-4"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <button
                    onClick={goPrev}
                    className="hidden md:flex p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <div className="relative">
                    <div className="absolute -inset-3 bg-gradient-to-b from-white/20 to-white/5 rounded-[3rem] blur-xl" />
                    
                    <div className="relative bg-stone-900 rounded-[2.5rem] p-2 shadow-2xl">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-stone-900 rounded-b-2xl" />
                      
                      <div className="w-[280px] h-[540px] md:w-[300px] md:h-[580px] bg-white rounded-[2rem] overflow-hidden">
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
                    className="hidden md:flex p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex justify-center gap-2 mt-4">
                  {showcases.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentIndex ? 'bg-white w-6' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
