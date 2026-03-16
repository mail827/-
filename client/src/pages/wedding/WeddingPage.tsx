import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import type { Wedding, Theme, Guestbook } from '../../types';
import { lazy, Suspense, useState, useEffect } from 'react';

const RomanticClassic = lazy(() => import('./themes/RomanticClassic'));
const ModernMinimal = lazy(() => import('./themes/ModernMinimal'));
const BohemianDream = lazy(() => import('./themes/BohemianDream'));
const LuxuryGold = lazy(() => import('./themes/LuxuryGold'));
const PoeticLove = lazy(() => import('./themes/PoeticLove'));
const ForestGarden = lazy(() => import('./themes/ForestGarden'));
const OceanBreeze = lazy(() => import('./themes/OceanBreeze'));
const SeniorSimple = lazy(() => import('./themes/SeniorSimple'));
const GlassBubble = lazy(() => import('./themes/GlassBubble'));
const SpringBreeze = lazy(() => import('./themes/SpringBreeze'));
const GalleryMirim1 = lazy(() => import('./themes/GalleryMirim1'));
const GalleryMirim2 = lazy(() => import('./themes/GalleryMirim2'));
const LunaHalfmoon = lazy(() => import('./themes/LunaHalfmoon'));
const PearlDrift = lazy(() => import('./themes/PearlDrift'));
const NightSea = lazy(() => import('./themes/NightSea'));
const AquaGlobe = lazy(() => import('./themes/AquaGlobe'));
const BotanicalClassic = lazy(() => import("./themes/BotanicalClassic"));
const HeartMinimal = lazy(() => import("./themes/HeartMinimal"));
const WaveBorder = lazy(() => import("./themes/WaveBorder"));
const CruiseDay = lazy(() => import('./themes/CruiseDay'));
const CruiseSunset = lazy(() => import('./themes/CruiseSunset'));
const VoyageBlue = lazy(() => import('./themes/VoyageBlue'));
const Editorial = lazy(() => import('./themes/Editorial'));
const EditorialWhite = lazy(() => import('./themes/EditorialWhite'));
const EditorialGreen = lazy(() => import('./themes/EditorialGreen'));
const EditorialBlue = lazy(() => import('./themes/EditorialBlue'));
const EditorialBrown = lazy(() => import('./themes/EditorialBrown'));
import AiChat from '../../components/AiChat';
import { GalleryOverride, VenueTabsOverride, ProfileOverride, LetterOverride } from './themes/shared';
import EnvelopeIntro from './themes/shared/EnvelopeIntro';
import GuestPhotoGallery from './themes/shared/GuestPhotoGallery';
import { useSectionOrder } from '../../hooks/useSectionOrder';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function publicApi<T>(endpoint: string, options?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${API_BASE}/public${endpoint}`, {
    method: options?.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options?.body ? JSON.stringify(options.body) : undefined
  });
  if (!res.ok) throw new Error('API Error');
  return res.json();
}

async function submitRsvp(data: unknown) {
  const res = await fetch(`${API_BASE}/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('RSVP 제출 실패');
  return res.json();
}

async function submitGuestbook(data: unknown) {
  const res = await fetch(`${API_BASE}/guestbook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('방명록 작성 실패');
  return res.json();
}

const themeComponents: Record<Theme, React.ComponentType<any>> = {
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
  WAVE_BORDER: WaveBorder,
  CRUISE_DAY: CruiseDay,
  CRUISE_SUNSET: CruiseSunset,
  VOYAGE_BLUE: VoyageBlue,
  EDITORIAL: Editorial,
  EDITORIAL_WHITE: EditorialWhite,
  EDITORIAL_GREEN: EditorialGreen,
  EDITORIAL_BLUE: EditorialBlue,
  EDITORIAL_BROWN: EditorialBrown,
  HEART_MINIMAL: HeartMinimal,
  BOTANICAL_CLASSIC: BotanicalClassic,
};


export default function WeddingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const version = searchParams.get("v");
  const isPreview = searchParams.get("preview") === "1";
  const [previewApplied, setPreviewApplied] = useState(false);
  const [envelopeDismissed, setEnvelopeDismissed] = useState(false);

  const [wedding, setWedding] = useState<Wedding | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['wedding', slug, version],
    queryFn: async () => {
      if (version) {
        const res = await fetch(`${API_BASE}/snapshot/${slug}/${version}`);
        if (res.ok) return { wedding: await res.json() as Wedding };
      }
      return publicApi<{ wedding: Wedding }>(`/wedding/${slug}`);
    }
  });

  const { data: guestbookData, refetch: refetchGuestbook } = useQuery({
    queryKey: ['guestbook', slug],
    queryFn: () => publicApi<{ guestbooks: Guestbook[] }>(`/wedding/${slug}/guestbook`),
    enabled: !!slug && !isPreview
  });

  const rsvpMutation = useMutation({
    mutationFn: submitRsvp,
    onSuccess: () => alert('참석 여부가 전달되었습니다 💕')
  });

  
  const sectionRef = useSectionOrder(data?.wedding?.sectionOrder as string[] | undefined, data?.wedding?.hiddenSections as string[] | undefined);

  const guestbookMutation = useMutation({
    mutationFn: submitGuestbook,
    onSuccess: () => {
      refetchGuestbook();
      alert('메시지가 등록되었습니다 💝');
    }
  });

  useEffect(() => {
    if (data?.wedding) {
      setWedding(data.wedding);
      setPreviewApplied(false);
    }
  }, [data?.wedding?.id]);

  useEffect(() => {
    if (!wedding || !isPreview || previewApplied) return;
    const groom = searchParams.get("groom");
    const bride = searchParams.get("bride");
    const date = searchParams.get("date");
    const venue = searchParams.get("venue");
    const heroMedia = searchParams.get("heroMedia");
    if (groom || bride || date || venue || heroMedia) {
      setWedding(prev => prev ? {
        ...prev,
        ...(groom && { groomName: groom }),
        ...(bride && { brideName: bride }),
        ...(date && { weddingDate: date }),
        ...(venue && { venue }),
        ...(heroMedia && { heroMedia, heroMediaType: "IMAGE" as const }),
      } : prev);
      setPreviewApplied(true);
    }
  }, [wedding?.id]);

  useEffect(() => {
    const font = wedding?.fontFamily || data?.wedding?.fontFamily;
    if (font) {
      document.documentElement.style.setProperty('--wedding-font', font);
      document.body.style.fontFamily = `'${font}', 'Noto Sans KR', sans-serif`;
      return () => { document.body.style.fontFamily = ''; };
    }
  }, [wedding?.fontFamily, data?.wedding?.fontFamily]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Heart className="w-8 h-8 text-rose-400" />
        </motion.div>
      </div>
    );
  }

  if ((data as any)?.status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
        <div className="text-center px-6">
          <Heart className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-600 font-medium">청첩장 유효기간이 만료되었습니다</p>
          <p className="text-stone-400 text-sm mt-2">이 청첩장은 더 이상 열람할 수 없습니다</p>
        </div>
      </div>
    );
  }


  if (error || !data?.wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50">
        <div className="text-center px-6">
          <Heart className="w-12 h-12 text-rose-300/50 mx-auto mb-4" />
          <p className="text-stone-500">청첩장을 찾을 수 없습니다</p>
          <p className="text-stone-400 text-sm mt-2">링크를 다시 확인해주세요</p>
        </div>
      </div>
    );
  }

  const weddingToUse = wedding ?? data.wedding;



  const urlTheme = searchParams.get('theme') as Theme | null;
  const theme = urlTheme || weddingToUse.theme || 'ROMANTIC_CLASSIC';
  const ThemeComponent = themeComponents[theme] || RomanticClassic;

  const fontScaleStyle = (() => {
    const scale = weddingToUse.fontScale || 'medium';
    if (scale === 'medium') return '';
    const factor = scale === 'small' ? '0.9' : '1.12';
    return `body { font-size: calc(16px * ${factor}) !important; }`;
  })();

  const accentColorStyle = (() => {
    const color = weddingToUse.accentColor;
    if (!color) return '';
    return `[data-accent] { color: ${color} !important; }`;
  })();

  const galleryAspectStyle = (() => {
    const ratio = weddingToUse.galleryRatio || '1:1';
    if (ratio === '1:1') return '';
    if (ratio === 'original') {
      return '#gallery-section .grid > div { aspect-ratio: auto !important; } #gallery-section .grid > div img { object-fit: contain !important; height: auto !important; }';
    }
    const cssRatio = ratio === '3:4' ? '3/4' : ratio === '4:3' ? '4/3' : 'auto';
    return '#gallery-section .grid > div { aspect-ratio: ' + cssRatio + ' !important; }';
  })();

  return (
    <>
      {weddingToUse.envelopeEnabled && !envelopeDismissed && !isPreview && (
        <EnvelopeIntro
          groomName={weddingToUse.groomName}
          brideName={weddingToUse.brideName}
          weddingDate={weddingToUse.weddingDate}
          style={weddingToUse.envelopeStyle || 'ivory'}
          cardText={weddingToUse.envelopeCardText}
          fontFamily={weddingToUse.fontFamily}
          cardColor={weddingToUse.envelopeCardColor}
          onComplete={() => setEnvelopeDismissed(true)}
        />
      )}
      <div ref={sectionRef} style={{
        zoom: (weddingToUse.fontScale === 'small' ? 0.92 : weddingToUse.fontScale === 'large' ? 1.08 : 1),
      }}>
      {fontScaleStyle && <style>{fontScaleStyle}</style>}
      {accentColorStyle && <style>{accentColorStyle}</style>}
      {galleryAspectStyle && <style>{galleryAspectStyle}</style>}
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Heart className="w-6 h-6 animate-pulse text-stone-300" /></div>}>
        <ThemeComponent
          wedding={weddingToUse}
          guestbooks={guestbookData?.guestbooks || []}
          onRsvpSubmit={(data: any) => rsvpMutation.mutate(data)}
          onGuestbookSubmit={(data: any) => guestbookMutation.mutate(data)}
          isRsvpLoading={rsvpMutation.isPending}
          isGuestbookLoading={guestbookMutation.isPending}
          refetchGuestbook={refetchGuestbook}
          guestPhotoSlot={!isPreview && weddingToUse.guestPhotoEnabled !== false ? <GuestPhotoGallery slug={weddingToUse.slug} enabled={true} /> : undefined}
        />
      </Suspense>
      {weddingToUse.galleryLayout === 'polaroid' && !theme.startsWith('EDITORIAL') && weddingToUse.galleries?.length && !isPreview && (
        <GalleryOverride
          galleries={weddingToUse.galleries}
          theme={theme}
          usePhotoFilter={weddingToUse.usePhotoFilter}
        />
      )}
      </div>
      {weddingToUse.showProfile && !isPreview && (
        <ProfileOverride
          groomName={weddingToUse.groomName}
          brideName={weddingToUse.brideName}
          groomIntro={weddingToUse.groomIntro}
          brideIntro={weddingToUse.brideIntro}
          groomProfileUrl={weddingToUse.groomProfileUrl}
          brideProfileUrl={weddingToUse.brideProfileUrl}
          theme={theme}
        />
      )}
      {weddingToUse.showLetter && !isPreview && (
        <LetterOverride
          groomName={weddingToUse.groomName}
          brideName={weddingToUse.brideName}
          groomLetter={weddingToUse.groomLetter}
          brideLetter={weddingToUse.brideLetter}
          groomLetterImage={weddingToUse.groomLetterImage}
          brideLetterImage={weddingToUse.brideLetterImage}
          theme={theme}
          letterFromVisible={weddingToUse.letterFromVisible !== false}
        />
      )}
      {weddingToUse.venueDetailTabs && (weddingToUse.venueDetailTabs as any[])?.length > 0 && !isPreview && (
        <VenueTabsOverride
          tabs={weddingToUse.venueDetailTabs as { title: string; image?: string; content: string }[]}
          theme={theme}
        />
      )}
      {weddingToUse.aiEnabled && !isPreview && (
        <AiChat
          slug={weddingToUse.slug}
          groomName={weddingToUse.groomName}
          brideName={weddingToUse.brideName}
          wedding={weddingToUse}
        />
      )}
    </>
  );
}
