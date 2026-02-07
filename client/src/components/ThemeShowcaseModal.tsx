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
  LunaHalfmoon,
  PearlDrift,
  NightSea,
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
  LUNA_HALFMOON: LunaHalfmoon,
  PEARL_DRIFT: PearlDrift,
  NIGHT_SEA: NightSea,
  NightSea,
};

const themeAccents: Record<string, { accent: string; glow: string }> = {
  ROMANTIC_CLASSIC: { accent: 'rgba(244,163,177,0.15)', glow: 'rgba(244,163,177,0.1)' },
  MODERN_MINIMAL: { accent: 'rgba(148,163,184,0.15)', glow: 'rgba(148,163,184,0.1)' },
  BOHEMIAN_DREAM: { accent: 'rgba(217,183,140,0.15)', glow: 'rgba(217,183,140,0.1)' },
  LUXURY_GOLD: { accent: 'rgba(212,175,55,0.12)', glow: 'rgba(212,175,55,0.08)' },
  POETIC_LOVE: { accent: 'rgba(196,181,205,0.15)', glow: 'rgba(196,181,205,0.1)' },
  SENIOR_SIMPLE: { accent: 'rgba(168,162,158,0.15)', glow: 'rgba(168,162,158,0.1)' },
  FOREST_GARDEN: { accent: 'rgba(134,169,140,0.15)', glow: 'rgba(134,169,140,0.1)' },
  OCEAN_BREEZE: { accent: 'rgba(147,197,205,0.15)', glow: 'rgba(147,197,205,0.1)' },
  GLASS_BUBBLE: { accent: 'rgba(200,200,210,0.15)', glow: 'rgba(200,200,210,0.1)' },
  SPRING_BREEZE: { accent: 'rgba(219,182,192,0.15)', glow: 'rgba(219,182,192,0.1)' },
  GALLERY_MIRIM_1: { accent: 'rgba(180,175,170,0.15)', glow: 'rgba(180,175,170,0.1)' },
  GALLERY_MIRIM_2: { accent: 'rgba(175,170,180,0.15)', glow: 'rgba(175,170,180,0.1)' },
  LUNA_HALFMOON: { accent: 'rgba(144,175,197,0.15)', glow: 'rgba(144,175,197,0.1)' },
  PEARL_DRIFT: { accent: 'rgba(232,238,242,0.12)', glow: 'rgba(232,238,242,0.08)' },
  NIGHT_SEA: { accent: 'rgba(80,160,240,0.15)', glow: 'rgba(80,160,240,0.1)' },
};

const IPhoneMockup = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    <div className="absolute -inset-4 bg-gradient-to-b from-white/5 to-transparent rounded-[3.5rem] blur-2xl" />
    
    <div className="relative bg-[#1a1a1a] rounded-[3rem] p-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_25px_50px_-12px_rgba(0,0,0,0.8)]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[32px] bg-[#1a1a1a] rounded-b-[1rem] z-20 flex items-center justify-center">
        <div className="w-[60px] h-[4px] bg-[#0a0a0a] rounded-full mt-1" />
      </div>
      
      <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[8px] h-[8px] bg-[#0a0a0a] rounded-full z-20 border border-[#2a2a2a]" />
      
      <div className="absolute -left-[2px] top-[120px] w-[3px] h-[30px] bg-[#2a2a2a] rounded-l-sm" />
      <div className="absolute -left-[2px] top-[170px] w-[3px] h-[55px] bg-[#2a2a2a] rounded-l-sm" />
      <div className="absolute -left-[2px] top-[235px] w-[3px] h-[55px] bg-[#2a2a2a] rounded-l-sm" />
      <div className="absolute -right-[2px] top-[180px] w-[3px] h-[70px] bg-[#2a2a2a] rounded-r-sm" />
      
      <div className="relative bg-[#0a0a0a] rounded-[2.8rem] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[44px] bg-gradient-to-b from-black/20 to-transparent z-10 pointer-events-none" />
        
        <div className="w-[280px] h-[600px] sm:w-[320px] sm:h-[680px] overflow-hidden">
          {children}
        </div>
        
        <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-white/20 rounded-full" />
      </div>
    </div>
  </div>
);

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
  weddingTime: '12:00',
  venueName: '그랜드 웨딩홀',
  venueHall: '루체홀',
  venueAddress: '서울시 강남구 테헤란로 123',
  venue: '그랜드 웨딩홀',
  greetingTitle: '저희 두 사람이 사랑으로 만나',
  greeting: '서로 아끼고 사랑하며 예쁘게 살겠습니다.\n귀한 걸음 하시어 축복해 주시면 감사하겠습니다.',
  groomFatherName: '김철수',
  groomMotherName: '이영희',
  brideFatherName: '박민수',
  brideMotherName: '최수진',
  showParents: true,
  showDday: true,
  galleries: [],
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
      GALLERY_MIRIM_1: '美林 갤러리 1',
      GALLERY_MIRIM_2: '美林 갤러리 2',
      LUNA_HALFMOON: '루나 하프문',
      PEARL_DRIFT: '펄 드리프트',
      NIGHT_SEA: '밤바다',
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
  const accent = current ? themeAccents[current.theme] : null;
  
  const weddingData = { 
    ...DEFAULT_SAMPLE, 
    ...current?.sampleData,
    groomName: groomName || DEFAULT_SAMPLE.groomName,
    brideName: brideName || DEFAULT_SAMPLE.brideName,
    heroMedia: heroImage || null,
    weddingTime: current?.sampleData?.weddingTime || DEFAULT_SAMPLE.weddingTime,
    weddingDate: current?.sampleData?.weddingDate || DEFAULT_SAMPLE.weddingDate,
    venue: current?.sampleData?.venue || current?.sampleData?.venueName || DEFAULT_SAMPLE.venue,
    greeting: current?.sampleData?.greeting || current?.sampleData?.greetingContent || DEFAULT_SAMPLE.greeting,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-hidden bg-[#0c0c0c]"
      >
        <div 
          className="absolute inset-0 transition-all duration-700"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${accent?.accent || 'rgba(150,150,150,0.1)'} 0%, transparent 60%),
                        radial-gradient(ellipse at 80% 80%, ${accent?.glow || 'rgba(150,150,150,0.05)'} 0%, transparent 40%),
                        radial-gradient(ellipse at 20% 90%, ${accent?.glow || 'rgba(150,150,150,0.05)'} 0%, transparent 40%)`
          }}
        />

        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white/80 transition-colors z-50 hover:bg-white/5 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="h-full flex flex-col md:flex-row relative z-10">
            <div className="md:hidden">
              <button
                onClick={() => setShowCustomize(!showCustomize)}
                className="w-full py-3 px-4 bg-white/5 backdrop-blur-sm flex items-center justify-between text-white/70 text-sm border-b border-white/5"
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
                    className="bg-white/5 backdrop-blur-sm px-4 pb-4 overflow-hidden"
                  >
                    <div className="flex gap-3 pt-2">
                      <div className="flex-1">
                        <label className="text-white/40 text-xs mb-1 block">신랑</label>
                        <input
                          type="text"
                          value={groomName}
                          onChange={(e) => setGroomName(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/20"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-white/40 text-xs mb-1 block">신부</label>
                        <input
                          type="text"
                          value={brideName}
                          onChange={(e) => setBrideName(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-white/40 text-xs mb-1 block">사진</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:border-white/20"
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

            <div className="hidden md:flex w-72 bg-white/[0.02] backdrop-blur-sm p-5 flex-col gap-4 border-r border-white/5">
              <h3 className="text-white/80 font-medium text-center text-sm tracking-wide">내 이름으로 미리보기</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">신랑 이름</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      value={groomName}
                      onChange={(e) => setGroomName(e.target.value)}
                      placeholder="신랑 이름"
                      className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/20 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">신부 이름</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      value={brideName}
                      onChange={(e) => setBrideName(e.target.value)}
                      placeholder="신부 이름"
                      className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/20 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">대표 사진</label>
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
                      className="w-full py-6 border border-dashed border-white/10 rounded-xl text-white/30 hover:border-white/20 hover:text-white/50 transition-colors flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-xs">사진 업로드</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5">
                <p className="text-white/30 text-xs text-center leading-relaxed">
                  좌우 화살표 또는 스와이프로<br />{showcases.length}가지 테마를 둘러보세요
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="text-center py-4 md:py-5">
                <motion.h2 
                  key={current?.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg md:text-xl font-medium text-white/90 tracking-wide"
                >
                  {current?.title}
                </motion.h2>
                <p className="text-white/30 text-xs mt-1.5 tracking-wider">
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
                  className="hidden md:flex p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-all mr-6"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <IPhoneMockup>
                    <div className="w-full h-full overflow-y-auto scrollbar-hide bg-white">
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
                  </IPhoneMockup>
                </motion.div>

                <button
                  onClick={goNext}
                  className="hidden md:flex p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-all ml-6"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              <div className="flex justify-center gap-1.5 py-4">
                {showcases.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? 'bg-white/70 w-6' : 'bg-white/20 w-1.5 hover:bg-white/30'
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
