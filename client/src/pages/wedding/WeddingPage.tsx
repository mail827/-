import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import LocaleSwitch from './themes/shared/LocaleSwitch';
import type { Locale } from './themes/shared/i18n';
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
import GuestAiPhotoBooth from './themes/shared/GuestAiPhotoBooth';
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
  const [locale, setLocale] = useState<Locale>('ko');

  const [wedding, setWedding] = useState<Wedding | null>(null);

  const isLocalPreview = slug === 'preview';

  const { data, isLoading, error } = useQuery({
    queryKey: ['wedding', slug, version],
    queryFn: async () => {
      if (isLocalPreview) {
        const stored = localStorage.getItem('previewWeddingData');
        if (stored) {
          const parsed = JSON.parse(stored);
          return { wedding: { ...parsed, id: 'preview', slug: 'preview', isPublished: true, isArchived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), galleries: parsed.galleries || [], rsvps: [], guestbooks: [], bgMusicAutoPlay: false, showDday: true, loveStoryType: 'PHOTO' as const, heroMediaType: parsed.heroMediaType || 'IMAGE' as const, showParents: parsed.showParents ?? true, _count: { rsvps: 0, guestbooks: 0, galleries: 0 } } as Wedding };
        }
        throw new Error('No preview data');
      }
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

  useEffect(() => { const w = wedding ?? data?.wedding; if (w?.locale) setLocale(w.locale as Locale); }, [wedding, data]);

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

  const isArchive = (data as any)?.status === "archive";

  if ((data as any)?.status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
        <div className="text-center px-6">
          <Heart className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-600 font-medium">청첩장 유효기간이 만료되었습니다</p>
          <p className="text-stone-400 text-sm mt-2">9,900원으로 영구 보존할 수 있어요</p>
          <button onClick={async () => {
            try {
              const res = await fetch(API_BASE + '/public/archive/payment-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weddingId: (data as any)?.wedding?.id }),
              });
              const info = await res.json();
              const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
              const toss = await loadTossPayments(info.clientKey);
              const payment = toss.payment({ customerKey: 'ARCHIVE_' + info.weddingId });
              await payment.requestPayment({
                method: 'CARD',
                amount: { currency: 'KRW', value: info.amount },
                orderId: info.orderId,
                orderName: info.orderName,
                successUrl: window.location.origin + '/archive-success?weddingId=' + info.weddingId,
                failUrl: window.location.href,
              });
            } catch (e) { console.error(e); }
          }} style={{ display: "inline-block", marginTop: 16, padding: "14px 32px", background: "#1a1a1a", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer" }}>9,900원으로 영구 보존하기</button>
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

  const rawWedding = wedding ?? data.wedding;
  const weddingToUse = (() => {
    if (locale !== 'en' || !rawWedding?.translationsEn) return rawWedding;
    const tr = rawWedding.translationsEn as Record<string, string>;
    const merged = { ...rawWedding } as any;
    merged.mapAddress = rawWedding.venueAddress;
    merged.mapVenue = rawWedding.venue;
    if (tr.greeting) (merged as any).greeting = tr.greeting;
    if (tr.greetingTitle) (merged as any).greetingTitle = tr.greetingTitle;
    if (tr.closingMessage) (merged as any).closingMessage = tr.closingMessage;
    if (tr.venue) (merged as any).venue = tr.venue;
    if (tr.venueHall) (merged as any).venueHall = tr.venueHall;
    if (tr.venueAddress) (merged as any).venueAddress = tr.venueAddress;
    if (tr.transportInfo) (merged as any).transportInfo = tr.transportInfo;
    if (tr.parkingInfo) (merged as any).parkingInfo = tr.parkingInfo;
    if (tr.envelopeCardText) (merged as any).envelopeCardText = tr.envelopeCardText;
    if (tr.venueDetailTabs) {
      try { (merged as any).venueDetailTabs = JSON.parse(tr.venueDetailTabs); } catch {}
    }
    return merged;
  })();

  const urlTheme = searchParams.get('theme') as Theme | null;
  const theme = (urlTheme || weddingToUse.theme || 'ROMANTIC_CLASSIC') as Theme;
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
          locale={locale}
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
        {isArchive && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 99999, background: "#1a1a1a", padding: "14px 16px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <p style={{ fontSize: 13, color: "#fff" }}>Our Wedding Archive</p>
            <div style={{ width: 1, height: 14, background: "#555" }} />
            <p style={{ fontSize: 11, color: "#999" }}>RSVP and payments are closed</p>
          </div>
        )}
        {weddingToUse.showLocaleSwitch !== false && <LocaleSwitch locale={locale} onChange={setLocale} />}
        <ThemeComponent
          wedding={weddingToUse}
          locale={locale}
          guestbooks={guestbookData?.guestbooks || []}
          onRsvpSubmit={isArchive ? (() => {}) : ((data: any) => rsvpMutation.mutate(data))}
          onGuestbookSubmit={isArchive ? (() => {}) : ((data: any) => guestbookMutation.mutate(data))}
          isRsvpLoading={rsvpMutation.isPending}
          isGuestbookLoading={guestbookMutation.isPending}
          refetchGuestbook={refetchGuestbook}
          isArchive={isArchive}
          guestPhotoSlot={!isPreview ? (
            <>
              {!isArchive && weddingToUse.aiBoothEnabled && (
                <GuestAiPhotoBooth slug={weddingToUse.slug} groomName={weddingToUse.groomName} brideName={weddingToUse.brideName} locale={locale} />
              )}
              {weddingToUse.guestPhotoEnabled !== false && (
                <GuestPhotoGallery slug={weddingToUse.slug} enabled={true} locale={locale} />
              )}
            </>
          ) : undefined}

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
      {weddingToUse.aiBoothEnabled && !isPreview && !isArchive && (
        <AiChat
          slug={weddingToUse.slug}
          groomName={weddingToUse.groomName}
          brideName={weddingToUse.brideName}
          wedding={weddingToUse}
          locale={locale}
        />
      )}
    </>
  );
}
