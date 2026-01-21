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
};

const themeBackgrounds: Record<string, { bg: string; elements: React.ReactNode }> = {
  ROMANTIC_CLASSIC: {
    bg: 'from-rose-950 via-pink-900/90 to-rose-950',
    elements: (
      <>
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: [0, 0.6, 0],
              y: ['-10%', '110%'],
              x: [0, Math.sin(i) * 30],
              rotate: [0, 360]
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.8,
              ease: 'linear'
            }}
            style={{ left: `${5 + i * 8}%` }}
          >
            🌸
          </motion.div>
        ))}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-30" />
      </>
    )
  },
  MODERN_MINIMAL: {
    bg: 'from-slate-900 via-gray-900 to-slate-900',
    elements: (
      <>
        <motion.div
          className="absolute top-20 left-20 w-40 h-40 border border-white/10 rounded-full"
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute bottom-32 right-16 w-24 h-24 border border-white/10"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-2 h-2 bg-white/20 rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="absolute top-1/2 left-10 w-px h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        <div className="absolute top-1/4 right-10 w-px h-48 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      </>
    )
  },
  BOHEMIAN_DREAM: {
    bg: 'from-amber-950 via-orange-900/90 to-amber-950',
    elements: (
      <>
        <motion.div
          className="absolute top-16 right-20 text-6xl opacity-20"
          animate={{ rotate: [0, 10, 0], y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          🌙
        </motion.div>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 10, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
            style={{ 
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`
            }}
          >
            🪶
          </motion.div>
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(251,191,36,0.1),transparent_50%)]" />
      </>
    )
  },
  LUXURY_GOLD: {
    bg: 'from-yellow-950 via-amber-900 to-yellow-950',
    elements: (
      <>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400/60 rounded-full"
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-yellow-500/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-yellow-500/10 to-transparent" />
        <motion.div
          className="absolute top-20 left-16 w-20 h-20 border border-yellow-500/20 rotate-45"
          animate={{ rotate: [45, 55, 45], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-32 right-20 w-16 h-16 border border-yellow-500/20 rotate-12"
          animate={{ rotate: [12, 22, 12] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </>
    )
  },
  POETIC_LOVE: {
    bg: 'from-violet-950 via-purple-900/90 to-violet-950',
    elements: (
      <>
        <motion.div
          className="absolute top-24 left-12 text-white/10 text-7xl font-serif italic"
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          "
        </motion.div>
        <motion.div
          className="absolute bottom-24 right-12 text-white/10 text-7xl font-serif italic rotate-180"
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 5, repeat: Infinity, delay: 2.5 }}
        >
          "
        </motion.div>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-xl"
            animate={{ 
              y: [0, -30],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.8,
            }}
            style={{
              left: `${15 + i * 15}%`,
              bottom: '10%',
            }}
          >
            ✨
          </motion.div>
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)]" />
      </>
    )
  },
  SENIOR_SIMPLE: {
    bg: 'from-stone-800 via-stone-700 to-stone-800',
    elements: (
      <>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute top-0 left-12 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="absolute top-0 right-12 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-3 h-3 border border-white/20 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-3 h-3 border border-white/20 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, delay: 2 }}
        />
      </>
    )
  },
  FOREST_GARDEN: {
    bg: 'from-emerald-950 via-green-900 to-emerald-950',
    elements: (
      <>
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ 
              opacity: [0, 0.5, 0],
              y: ['-5%', '105%'],
              rotate: [0, 180, 360],
              x: [0, Math.sin(i) * 20, 0]
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              delay: i * 1.2,
              ease: 'linear'
            }}
            style={{ left: `${5 + i * 10}%` }}
          >
            🍃
          </motion.div>
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.1),transparent_50%)]" />
      </>
    )
  },
  OCEAN_BREEZE: {
    bg: 'from-cyan-950 via-blue-900 to-cyan-950',
    elements: (
      <>
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400/30 rounded-full"
            animate={{
              y: [0, -40, 0],
              x: [0, Math.sin(i) * 15, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
            style={{
              left: `${5 + i * 6.5}%`,
              bottom: `${10 + (i % 4) * 15}%`,
            }}
          />
        ))}
        <motion.div
          className="absolute bottom-0 left-0 w-full h-32"
          style={{
            background: 'linear-gradient(to top, rgba(34,211,238,0.1), transparent)',
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <svg className="absolute bottom-0 left-0 w-full h-20 opacity-20" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <motion.path
            d="M0,60 C300,100 600,20 900,60 C1050,80 1150,50 1200,60 L1200,120 L0,120 Z"
            fill="rgba(34,211,238,0.3)"
            animate={{ d: [
              "M0,60 C300,100 600,20 900,60 C1050,80 1150,50 1200,60 L1200,120 L0,120 Z",
              "M0,50 C300,20 600,100 900,50 C1050,30 1150,70 1200,50 L1200,120 L0,120 Z",
              "M0,60 C300,100 600,20 900,60 C1050,80 1150,50 1200,60 L1200,120 L0,120 Z",
            ]}}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </>
    )
  },
  GLASS_BUBBLE: {
    bg: 'from-slate-900 via-slate-800 to-slate-900',
    elements: (
      <>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm"
            style={{
              width: 60 + i * 20,
              height: 60 + i * 20,
              left: `${10 + (i % 4) * 25}%`,
              top: `${15 + Math.floor(i / 4) * 50}%`,
            }}
            animate={{
              y: [0, -20, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          />
        ))}
      </>
    )
  },
  SPRING_BREEZE: {
    bg: 'from-pink-950 via-rose-900/90 to-pink-950',
    elements: (
      <>
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            animate={{ 
              y: [0, -20, 0],
              x: [0, 10, 0],
              rotate: [0, 15, 0],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{
              duration: 3 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            style={{ 
              left: `${5 + i * 10}%`,
              top: `${20 + (i % 3) * 25}%`
            }}
          >
            {i % 2 === 0 ? '🌷' : '🌸'}
          </motion.div>
        ))}
      </>
    )
  },
  GALLERY_MIRIM_1: {
    bg: 'from-neutral-900 via-stone-800 to-neutral-900',
    elements: (
      <>
        <div className="absolute inset-8 border border-white/10 rounded-lg" />
        <div className="absolute inset-12 border border-white/5 rounded-lg" />
        <motion.div
          className="absolute top-6 left-6 w-3 h-3 bg-white/20"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-6 right-6 w-3 h-3 bg-white/20"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
        />
      </>
    )
  },
  GALLERY_MIRIM_2: {
    bg: 'from-zinc-900 via-neutral-800 to-zinc-900',
    elements: (
      <>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-white/20 via-white/5 to-white/20" />
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-px bg-gradient-to-r from-white/20 via-white/5 to-white/20" />
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 border border-white/30"
            style={{
              top: i < 2 ? '20%' : '80%',
              left: i % 2 === 0 ? '20%' : '80%',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </>
    )
  },
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
      GALLERY_MIRIM_1: '美林 갤러리 1',
      GALLERY_MIRIM_2: '美林 갤러리 2',
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
  const themeBg = current ? themeBackgrounds[current.theme] : null;
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
        className={`fixed inset-0 z-50 overflow-hidden bg-gradient-to-br ${themeBg?.bg || 'from-slate-900 to-slate-800'}`}
      >
        <div className="absolute inset-0 overflow-hidden">
          {themeBg?.elements}
        </div>

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
          <div className="h-full flex flex-col md:flex-row relative z-10">
            <div className="md:hidden">
              <button
                onClick={() => setShowCustomize(!showCustomize)}
                className="w-full py-3 px-4 bg-black/30 backdrop-blur-sm flex items-center justify-between text-white text-sm"
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
                    className="bg-black/30 backdrop-blur-sm px-4 pb-4 overflow-hidden"
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

            <div className="hidden md:flex w-72 bg-black/30 backdrop-blur-md p-5 flex-col gap-4">
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
                  좌우 화살표 또는 스와이프로<br />{showcases.length}가지 테마를 둘러보세요
                </p>
              </div>
            </div>

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
                  className="hidden md:flex p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors mr-4 backdrop-blur-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="relative h-full max-h-[70vh] md:max-h-[75vh] aspect-[9/16]">
                  <div className="absolute -inset-3 bg-gradient-to-b from-white/10 to-white/5 rounded-[2.5rem] blur-xl" />
                  
                  <div className="relative h-full bg-stone-900 rounded-[2rem] p-1.5 shadow-2xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-stone-900 rounded-b-2xl flex items-center justify-center">
                      <div className="w-12 h-1.5 bg-stone-800 rounded-full" />
                    </div>
                    
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
                  className="hidden md:flex p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-4 backdrop-blur-sm"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

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
