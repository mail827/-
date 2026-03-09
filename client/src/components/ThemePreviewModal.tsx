import { lazy, Suspense, useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { themeConfigs } from '../pages/wedding/themes/shared/themeConfig';

const RomanticClassic = lazy(() => import('../pages/wedding/themes/RomanticClassic'));
const ModernMinimal = lazy(() => import('../pages/wedding/themes/ModernMinimal'));
const BohemianDream = lazy(() => import('../pages/wedding/themes/BohemianDream'));
const LuxuryGold = lazy(() => import('../pages/wedding/themes/LuxuryGold'));
const PoeticLove = lazy(() => import('../pages/wedding/themes/PoeticLove'));
const SeniorSimple = lazy(() => import('../pages/wedding/themes/SeniorSimple'));
const ForestGarden = lazy(() => import('../pages/wedding/themes/ForestGarden'));
const OceanBreeze = lazy(() => import('../pages/wedding/themes/OceanBreeze'));
const GlassBubble = lazy(() => import('../pages/wedding/themes/GlassBubble'));
const SpringBreeze = lazy(() => import('../pages/wedding/themes/SpringBreeze'));
const GalleryMirim1 = lazy(() => import('../pages/wedding/themes/GalleryMirim1'));
const GalleryMirim2 = lazy(() => import('../pages/wedding/themes/GalleryMirim2'));
const LunaHalfmoon = lazy(() => import('../pages/wedding/themes/LunaHalfmoon'));
const PearlDrift = lazy(() => import('../pages/wedding/themes/PearlDrift'));
const NightSea = lazy(() => import('../pages/wedding/themes/NightSea'));
const AquaGlobe = lazy(() => import('../pages/wedding/themes/AquaGlobe'));
const BotanicalClassic = lazy(() => import('../pages/wedding/themes/BotanicalClassic'));
const HeartMinimal = lazy(() => import('../pages/wedding/themes/HeartMinimal'));
const WaveBorder = lazy(() => import('../pages/wedding/themes/WaveBorder'));

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
  AQUA_GLOBE: AquaGlobe,
  BOTANICAL_CLASSIC: BotanicalClassic,
  HEART_MINIMAL: HeartMinimal,
  WAVE_BORDER: WaveBorder,
  CRUISE_DAY: lazy(() => import('../pages/wedding/themes/CruiseDay')),
  CRUISE_SUNSET: lazy(() => import('../pages/wedding/themes/CruiseSunset')),
  VOYAGE_BLUE: lazy(() => import('../pages/wedding/themes/VoyageBlue')),
  EDITORIAL: lazy(() => import('../pages/wedding/themes/Editorial')),
  EDITORIAL_WHITE: lazy(() => import('../pages/wedding/themes/EditorialWhite')),
  EDITORIAL_GREEN: lazy(() => import('../pages/wedding/themes/EditorialGreen')),
  EDITORIAL_BLUE: lazy(() => import('../pages/wedding/themes/EditorialBlue')),
  EDITORIAL_BROWN: lazy(() => import('../pages/wedding/themes/EditorialBrown')),
};

const THEMES = [
  { id: 'ROMANTIC_CLASSIC', name: '로맨틱 클래식' },
  { id: 'MODERN_MINIMAL', name: '모던 미니멀' },
  { id: 'BOHEMIAN_DREAM', name: '보헤미안 드림' },
  { id: 'LUXURY_GOLD', name: '럭셔리 골드' },
  { id: 'POETIC_LOVE', name: '포에틱 러브' },
  { id: 'SENIOR_SIMPLE', name: '어르신 심플' },
  { id: 'FOREST_GARDEN', name: '포레스트 가든' },
  { id: 'OCEAN_BREEZE', name: '오션 브리즈' },
  { id: 'GLASS_BUBBLE', name: '글라스 버블' },
  { id: 'SPRING_BREEZE', name: '봄바람' },
  { id: 'GALLERY_MIRIM_1', name: 'Gallery 美林-1' },
  { id: 'GALLERY_MIRIM_2', name: 'Gallery 美林-2' },
  { id: 'LUNA_HALFMOON', name: 'Luna Halfmoon' },
  { id: 'PEARL_DRIFT', name: 'Pearl Drift' },
  { id: 'NIGHT_SEA', name: '밤바다' },
  { id: 'AQUA_GLOBE', name: '아쿠아 글로브' },
  { id: 'BOTANICAL_CLASSIC', name: '보태니컬 클래식' },
  { id: 'HEART_MINIMAL', name: '하트 미니멀' },
  { id: 'WAVE_BORDER', name: '웨이브 보더' },
  { id: 'CRUISE_DAY', name: '크루즈 데이' },
  { id: 'CRUISE_SUNSET', name: '크루즈 선셋' },
  { id: 'VOYAGE_BLUE', name: '보야지 블루' },
  { id: 'EDITORIAL', name: '에디토리얼' },
  { id: 'EDITORIAL_WHITE', name: '에디토리얼 화이트' },
  { id: 'EDITORIAL_GREEN', name: '에디토리얼 그린' },
  { id: 'EDITORIAL_BLUE', name: '에디토리얼 블루' },
  { id: 'EDITORIAL_BROWN', name: '에디토리얼 브라운' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wedding: any;
  onApply: (themeId: string) => void;
}

export default function ThemePreviewModal({ isOpen, onClose, wedding, onApply }: Props) {
  const [previewTheme, setPreviewTheme] = useState(wedding?.theme || 'ROMANTIC_CLASSIC');

  useEffect(() => {
    if (isOpen) setPreviewTheme(wedding?.theme || 'ROMANTIC_CLASSIC');
  }, [isOpen, wedding?.theme]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen || !wedding) return null;

  const ThemeComponent = themeComponents[previewTheme] || themeComponents.ROMANTIC_CLASSIC;
  const noop = () => {};

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-stone-950 flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-stone-900/80 backdrop-blur-sm border-b border-white/5 flex-shrink-0">
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-white/90 tracking-wide">테마 미리보기</span>
          <button
            onClick={() => { onApply(previewTheme); onClose(); }}
            className="px-4 py-1.5 bg-white text-stone-900 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
          >
            적용
          </button>
        </div>

        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto bg-stone-900/50 scrollbar-hide flex-shrink-0">
          {THEMES.filter(t => !themeConfigs[t.id]?.hidden).map(t => (
            <button
              key={t.id}
              onClick={() => setPreviewTheme(t.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                previewTheme === t.id
                  ? 'bg-white text-stone-900 font-medium shadow-sm'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/80'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ transform: "translateZ(0)" }}>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full min-h-[60vh]">
                <Heart className="w-6 h-6 animate-pulse text-white/20" />
              </div>
            }
          >
            <ThemeComponent
              wedding={{ ...wedding, theme: previewTheme }}
              guestbooks={[]}
              onRsvpSubmit={noop}
              onGuestbookSubmit={noop}
              isRsvpLoading={false}
              isGuestbookLoading={false}
              refetchGuestbook={noop}
            />
          </Suspense>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
