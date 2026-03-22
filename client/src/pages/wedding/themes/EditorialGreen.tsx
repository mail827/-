import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Copy, Check,
  ChevronDown
} from 'lucide-react';
import {
  RsvpForm, GuestbookForm, GalleryModal, GuestbookList,
  KakaoMap, ShareModal, getDday, formatDateLocale, formatTimeLocale,
  getCalendarData, type ThemeProps
} from './shared';

const fontStyles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
`;

const themeStyles = `
  .eg-bars{display:flex;gap:2px;align-items:center;height:16px}
  .eg-bar{display:block;width:2px;background:#5A6B5A;border-radius:1px}
  .eg-playing .eg-bar{animation:eg-eq .6s ease infinite alternate}
  .eg-bar:nth-child(1){height:8px;animation-delay:0s}
  .eg-bar:nth-child(2){height:12px;animation-delay:.15s}
  .eg-bar:nth-child(3){height:6px;animation-delay:.3s}
  .eg-bar:nth-child(4){height:10px;animation-delay:.1s}
  .eg-paused .eg-bar{height:4px!important;animation:none}
  @keyframes eg-eq{to{height:4px}}
  .eg-pre{font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif}
  .eg-giant{font-size:clamp(5rem,25vw,15rem);font-weight:900;letter-spacing:-0.06em;text-transform:uppercase;line-height:0.85}
  .eg-large{font-size:clamp(2rem,8vw,5rem);font-weight:800;letter-spacing:-0.04em;line-height:1}
  .eg-label{font-size:clamp(0.65rem,2vw,0.8rem);font-weight:600;letter-spacing:0.3em;text-transform:uppercase;opacity:0.8}
  .eg-outline{font-size:clamp(4rem,15vw,10rem);font-weight:900;line-height:0.8;color:transparent;-webkit-text-stroke:1.5px #1A2F23}
  @keyframes eg-ribbon{0%{transform:translateX(0)}100%{transform:translateX(-33.33%)}}
  .eg-ribbon-track{display:flex;animation:eg-ribbon 12s linear infinite;white-space:nowrap}
`;

const sectionAnim = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
};

const delayAnim = (delay: number) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 1, ease: [0.22, 1, 0.36, 1], delay },
});

const C = {
  bg: '#E8EDE0',
  card: '#F0F4EA',
  dark: '#1A2F23',
  accent: '#94A684',
  text: '#1A2F23',
  muted: '#5A6B5A',
  dim: '#8A9A84',
  border: '#C4D0B8',
};

export default function EditorialGreen({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot , locale}: ThemeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [openAccount, setOpenAccount] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [localGuestbooks, setLocalGuestbooks] = useState(guestbooks || []);
  const [heroHeight] = useState(() => typeof window !== 'undefined' ? window.innerHeight + 'px' : '100vh');

  useEffect(() => { setLocalGuestbooks(guestbooks || []); }, [guestbooks]);
  const handleGuestbookDelete = (id: string) => { setLocalGuestbooks(prev => prev.filter(g => g.id !== id)); };

  useEffect(() => {
    if (wedding.bgMusicAutoPlay && audioRef.current) { audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {}); }
  }, [wedding.bgMusicAutoPlay]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause(); else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text); setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleShare = async (type: 'kakao' | 'instagram' | 'sms', version?: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = version ? `${baseUrl}?v=${version}` : baseUrl;
    const title = `${wedding.groomName} & ${wedding.brideName}`;
    if (type === 'kakao' && window.Kakao) {
      window.Kakao.Share.sendDefault({ objectType: 'feed', content: { title, description: `${formatDateLocale(wedding.weddingDate, 'full', locale)} ${formatTimeLocale(wedding.weddingTime, locale)}`, imageUrl: wedding.ogCoverType === 'envelope' ? ({"black_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/7_errq8w.png", "white_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "navy_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/1_zdaupp.png", "black_silver": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "olive_ribbon_a": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/3_wdfeio.png", "olive_ribbon_b": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png", "pink_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/5_pzmfwy.png", "white_bow": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/11_o3gnaj.png", "white_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "black_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "pink_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551604/6_akrfek.png", "olive_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png"}[wedding.envelopeStyle || 'black_ribbon'] || wedding.heroMedia || '') : (wedding.heroMedia || ''), link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }] });
    } else if (type === 'instagram') { await navigator.clipboard.writeText(url); alert('링크가 복사되었습니다.\n인스타그램 스토리에 공유해보세요!'); }
    else if (type === 'sms') { window.location.href = `sms:?&body=${encodeURIComponent(`${title}\n${formatDateLocale(wedding.weddingDate, 'full', locale)}\n${url}`)}`; }
    setShowShareModal(false);
  };

  const calendarData = getCalendarData(wedding.weddingDate);
  const wd = new Date(wedding.weddingDate);
  const mo = String(wd.getMonth() + 1).padStart(2, '0');
  const dy = String(wd.getDate()).padStart(2, '0');
  const ribbonText = `EST. ${wd.getFullYear()} / ${wedding.groomName} & ${wedding.brideName} / THE RAW NATURE EDITORIAL`;

  return (
    <div className="min-h-screen eg-pre" style={{ background: C.bg, overflowX: 'hidden' }}>
      <div className="w-full" style={{ color: C.text, fontWeight: 400, wordBreak: 'keep-all' }}>
      <style>{fontStyles}{themeStyles}</style>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className={`fixed top-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center ${isPlaying ? 'eg-playing' : 'eg-paused'}`}
          style={{ background: 'rgba(232,237,224,0.9)', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="eg-bars"><span className="eg-bar" /><span className="eg-bar" /><span className="eg-bar" /><span className="eg-bar" /></div>
        </button>
      )}

      <section className="relative flex flex-col justify-center" style={{ height: heroHeight, padding: '1.25rem', overflow: 'hidden' }}>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="eg-label" style={{ marginLeft: 4, marginBottom: 8 }}>A New Beginning</motion.p>
        <motion.h1 initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className="eg-giant" style={{ alignSelf: 'flex-start', zIndex: 2 }}>GREEN</motion.h1>

        {(wedding.heroMedia || wedding.galleries?.[0]?.mediaUrl) && (
          <motion.div initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.3 }}
            style={{ width: '75%', height: '38vh', alignSelf: 'center', margin: '12px 0', overflow: 'hidden', zIndex: 1 }}>
            {wedding.heroMediaType === 'VIDEO' ? (
              <video src={wedding.heroMedia ? heroUrl(wedding.heroMedia) : ''} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <img src={heroUrl(wedding.heroMedia || wedding.galleries?.[0]?.mediaUrl || '')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            )}
          </motion.div>
        )}

        <motion.h1 initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="eg-giant" style={{ alignSelf: 'flex-end', zIndex: 2, marginTop: '-0.2em' }}>UNION</motion.h1>
      </section>

      <div style={{ width: '100%', padding: '14px 0', background: C.accent, color: C.dark, overflow: 'hidden' }}>
        <div className="eg-ribbon-track" style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.05em' }}>
          <span style={{ padding: '0 20px' }}>{ribbonText}</span>
          <span style={{ padding: '0 20px' }}>{ribbonText}</span>
          <span style={{ padding: '0 20px' }}>{ribbonText}</span>
          <span style={{ padding: '0 20px' }}>{ribbonText}</span>
          <span style={{ padding: '0 20px' }}>{ribbonText}</span>
          <span style={{ padding: '0 20px' }}>{ribbonText}</span>
        </div>
      </div>

      <section style={{ padding: '5rem 1.25rem' }}>
        <div style={{ borderTop: `2px solid ${C.dark}`, paddingTop: '2.5rem' }}>
          <motion.div {...sectionAnim} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
            <div>
              <p className="eg-label" style={{ marginBottom: 12 }}>Invitation</p>
              {wedding.greetingTitle && <p className="eg-large" style={{ marginBottom: 16 }}>{wedding.greetingTitle}</p>}
              {wedding.greeting && <p className="whitespace-pre-line" style={{ marginTop: 16, lineHeight: 1.8, opacity: 0.8, fontSize: 14 }}>{wedding.greeting}</p>}
            </div>
            <div>
              <p className="eg-label" style={{ marginBottom: 12 }}>Timeline</p>
              <div className="eg-outline">{mo}.{dy}</div>
              <p style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 800, marginTop: 8, letterSpacing: '-0.02em' }}>
                {formatDateLocale(wedding.weddingDate, 'full', locale)} / {formatTimeLocale(wedding.weddingTime, locale)}
              </p>
            </div>
          </motion.div>
        </div>

        {wedding.showParents && (
          <motion.div {...delayAnim(0.2)} style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <p className="eg-label" style={{ marginBottom: 8 }}>Groom</p>
              <p style={{ fontWeight: 300, fontSize: 12, color: C.muted }}>
                {wedding.groomFatherName}{wedding.groomFatherName && wedding.groomMotherName && ' · '}{wedding.groomMotherName}
              </p>
              <p style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{locale === 'en' ? 'Son of' : '의 아들'} {wedding.groomName}</p>
            </div>
            <div>
              <p className="eg-label" style={{ marginBottom: 8 }}>Bride</p>
              <p style={{ fontWeight: 300, fontSize: 12, color: C.muted }}>
                {wedding.brideFatherName}{wedding.brideFatherName && wedding.brideMotherName && ' · '}{wedding.brideMotherName}
              </p>
              <p style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{locale === 'en' ? 'Daughter of' : '의 딸'} {wedding.brideName}</p>
            </div>
          </motion.div>
        )}
      </section>

      {wedding.loveStoryVideo && (
        <section style={{ padding: '0 1.25rem 4rem' }}>
          <motion.div {...sectionAnim}>
            <p className="eg-label" style={{ marginBottom: 16 }}>Film</p>
            {wedding.loveStoryVideo.includes("youtube") || wedding.loveStoryVideo.includes("youtu.be") ? (
              <iframe src={wedding.loveStoryVideo.includes("youtu.be") ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("youtu.be/")[1]?.split("?")[0]}` : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("watch?v=")[1]?.split("&")[0]}`} className="w-full aspect-video" allowFullScreen />
            ) : ( <video src={wedding.loveStoryVideo} controls className="w-full aspect-video" /> )}
          </motion.div>
        </section>
      )}

      {wedding.galleries && wedding.galleries.length > 0 && (
        <section id="gallery-section" style={{ padding: '0 0 4rem' }}>
          <motion.div {...sectionAnim} style={{ padding: '0 1.25rem', marginBottom: '1.5rem' }}>
            <p className="eg-label">Gallery</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {wedding.galleries.slice(0, 9).map((item, index) => (
              <motion.div key={item.id} {...delayAnim(index % 2 === 0 ? 0.1 : 0.2)} onClick={() => setGalleryIndex(index)}
                className={`overflow-hidden cursor-pointer ${index === 0 ? 'col-span-2' : ''}`} style={{ aspectRatio: index === 0 ? '16/9' : '1/1' }}>
                {item.mediaType === 'VIDEO' ? ( <video src={item.mediaUrl} className="w-full h-full object-cover" /> ) : (
                  <img src={galleryThumbUrl(item.mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" style={{ display: 'block' }} /> )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section id="venue-section" style={{ background: C.dark, color: C.bg, padding: '3rem 1.25rem' }}>
        <motion.div {...sectionAnim}>
          <p className="eg-label" style={{ opacity: 0.5, marginBottom: 20 }}>Location Details</p>
          <p className="eg-large">{wedding.venue}</p>
          {wedding.venueHall && <p style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>{wedding.venueHall}</p>}
          <p style={{ fontSize: 13, opacity: 0.5, marginTop: 8 }}>{wedding.venueAddress}</p>
          {wedding.venuePhone && ( <a href={`tel:${wedding.venuePhone}`} className="inline-flex items-center gap-1.5" style={{ fontSize: 12, opacity: 0.6, marginTop: 6, color: C.bg }}><Phone className="w-3 h-3" />{wedding.venuePhone}</a> )}

          <div className="flex gap-3 flex-wrap" style={{ marginTop: '2rem' }}>
            {wedding.venueNaverMap && ( <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" style={{ color: C.bg, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 4, minHeight: 48, display: 'flex', alignItems: 'center' }}>NAVER MAP</a> )}
            {wedding.venueKakaoMap && ( <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" style={{ color: C.bg, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 4, minHeight: 48, display: 'flex', alignItems: 'center' }}>KAKAO MAP</a> )}
            {wedding.venueTmap && ( <a href={wedding.venueTmap} target="_blank" rel="noopener noreferrer" style={{ color: C.bg, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 4, minHeight: 48, display: 'flex', alignItems: 'center' }}>T MAP</a> )}
          </div>
        </motion.div>

        <motion.div {...delayAnim(0.2)} className="text-center" style={{ marginTop: '3rem' }}>
          <div className="max-w-[300px] mx-auto">
            <div className="grid grid-cols-7">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-center" style={{ fontWeight: 600, fontSize: 10, color: i === 0 ? C.accent : 'rgba(232,237,224,0.4)', padding: '6px 0' }}>{d}</div>
              ))}
              {calendarData.weeks.flat().map((day, i) => {
                const isS = i % 7 === 0;
                const isT = day === calendarData.targetDay;
                return (
                  <div key={i} className="text-center relative" style={{ fontWeight: 400, fontSize: 13, color: !day ? 'transparent' : isS ? C.accent : 'rgba(232,237,224,0.8)', padding: '8px 0' }}>
                    {isT && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full" style={{ border: `2px solid ${C.accent}` }} />}
                    <span className="relative z-10">{day || ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {wedding.showDday && <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: C.accent, marginTop: '1.25rem' }}>{getDday(wedding.weddingDate)}</p>}
        </motion.div>

        <motion.div {...delayAnim(0.3)} style={{ marginTop: '2rem' }}>
          <KakaoMap address={wedding.venueAddress} mapAddress={(wedding as any).mapAddress} mapVenue={(wedding as any).mapVenue} locale={locale} venue={wedding.venue} latitude={wedding.venueLatitude} longitude={wedding.venueLongitude} />
        </motion.div>
      </section>

      <section id="rsvp-section" style={{ background: C.bg, padding: '4rem 1.25rem' }}>
        <motion.div {...sectionAnim}>
          <p className="eg-label" style={{ marginBottom: '2rem' }}>Attendance</p>
        </motion.div>
        <motion.div {...delayAnim(0.15)}>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="editorial" locale={locale} />
        </motion.div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section id="account-section" style={{ background: C.card, padding: '4rem 1.25rem' }}>
          <motion.div {...sectionAnim}>
            <p className="eg-label" style={{ marginBottom: '2rem' }}>Gift</p>
          </motion.div>
          <motion.div {...delayAnim(0.15)}>
            <AccountCard title="신랑측 계좌" accounts={[
              wedding.groomAccount && { bank: wedding.groomBank, account: wedding.groomAccount, holder: wedding.groomAccountHolder || wedding.groomName },
              wedding.groomFatherAccount && { bank: wedding.groomFatherBank, account: wedding.groomFatherAccount, holder: wedding.groomFatherAccountHolder || wedding.groomFatherName },
              wedding.groomMotherAccount && { bank: wedding.groomMotherBank, account: wedding.groomMotherAccount, holder: wedding.groomMotherAccountHolder || wedding.groomMotherName }
            ].filter(Boolean) as any[]} isOpen={openAccount === 'groom'} onToggle={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} copiedAccount={copiedAccount} onCopy={copyToClipboard} />
          </motion.div>
          <motion.div {...delayAnim(0.3)}>
            <AccountCard title="신부측 계좌" accounts={[
              wedding.brideAccount && { bank: wedding.brideBank, account: wedding.brideAccount, holder: wedding.brideAccountHolder || wedding.brideName },
              wedding.brideFatherAccount && { bank: wedding.brideFatherBank, account: wedding.brideFatherAccount, holder: wedding.brideFatherAccountHolder || wedding.brideFatherName },
              wedding.brideMotherAccount && { bank: wedding.brideMotherBank, account: wedding.brideMotherAccount, holder: wedding.brideMotherAccountHolder || wedding.brideMotherName }
            ].filter(Boolean) as any[]} isOpen={openAccount === 'bride'} onToggle={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} copiedAccount={copiedAccount} onCopy={copyToClipboard} />
          </motion.div>
          {(wedding.tossLink || wedding.kakaoPayLink) && (
            <div className="flex gap-3 flex-wrap" style={{ marginTop: '2rem' }}>
              {wedding.tossLink && ( <a href={wedding.tossLink} target="_blank" style={{ color: C.dark, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 4, minHeight: 48, display: 'flex', alignItems: 'center' }}>TOSS</a> )}
              {wedding.kakaoPayLink && ( <a href={wedding.kakaoPayLink} target="_blank" style={{ color: C.dark, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 4, minHeight: 48, display: 'flex', alignItems: 'center' }}>KAKAO PAY</a> )}
            </div>
          )}
        </section>
      )}

      <section id="guestbook-section" style={{ background: C.bg, padding: '4rem 1.25rem' }}>
        <motion.div {...sectionAnim}>
          <p className="eg-label" style={{ marginBottom: '2rem' }}>Guestbook</p>
        </motion.div>
        <motion.div {...delayAnim(0.15)}>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="editorial-green" locale={locale} />
          <GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="editorial-green" locale={locale} />
        </motion.div>
      </section>

      {guestPhotoSlot}

      <section style={{ padding: '4rem 1.25rem' }}>
        <motion.div {...sectionAnim} className="text-center">
          {wedding.closingMessage && <p className="whitespace-pre-line" style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.9, color: C.muted, marginBottom: '2rem' }}>{wedding.closingMessage}</p>}
          <div className="flex justify-center gap-4">
            {wedding.groomPhone && ( <a href={`tel:${wedding.groomPhone}`} className="text-center group">
              <div className="flex items-center justify-center transition-all duration-300 group-hover:bg-[#1A2F23] group-hover:text-[#E8EDE0]" style={{ width: 48, height: 48, border: `1.5px solid ${C.dark}`, marginBottom: '0.5rem' }}><Phone className="w-4 h-4" /></div>
              <span style={{ fontWeight: 600, fontSize: 10, color: C.muted }}>신랑</span></a> )}
            {wedding.bridePhone && ( <a href={`tel:${wedding.bridePhone}`} className="text-center group">
              <div className="flex items-center justify-center transition-all duration-300 group-hover:bg-[#1A2F23] group-hover:text-[#E8EDE0]" style={{ width: 48, height: 48, border: `1.5px solid ${C.dark}`, marginBottom: '0.5rem' }}><Phone className="w-4 h-4" /></div>
              <span style={{ fontWeight: 600, fontSize: 10, color: C.muted }}>신부</span></a> )}
          </div>
          <button onClick={() => setShowShareModal(true)} style={{ marginTop: '2rem', background: C.dark, color: C.bg, padding: '14px 32px', fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }} className="hover:opacity-80 transition-opacity">SHARE</button>
        </motion.div>
      </section>

      <footer style={{ padding: '5rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
        <div className="eg-giant" style={{ fontSize: '15vw', opacity: 0.06, lineHeight: 0.5 }}>FOREVER</div>
        <p style={{ marginTop: '2rem', fontWeight: 300, letterSpacing: '0.1em', fontSize: 13 }}>SEE YOU IN THE GREENERY.</p>
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" style={{ fontWeight: 300, fontSize: 10, color: C.dim, textDecoration: 'none', display: 'block', marginTop: '2rem' }}>Made by Wedding Studio Lab ›</a>
      </footer>

      <AnimatePresence>
        {galleryIndex !== null && wedding.galleries && ( <GalleryModal galleries={wedding.galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="EDITORIAL_GREEN" usePhotoFilter={wedding.usePhotoFilter ?? true} /> )}
      </AnimatePresence>
      <AnimatePresence>
        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} variant="light" weddingId={wedding.id} />
      </AnimatePresence>
    </div>
    </div>
  );
}

function AccountCard({ title, accounts, isOpen, onToggle, copiedAccount, onCopy }: { title: string; accounts: { bank: string; account: string; holder: string }[]; isOpen: boolean; onToggle: () => void; copiedAccount: string | null; onCopy: (t: string, id: string) => void; }) {
  if (!accounts.length) return null;
  return (
    <div>
      <button onClick={onToggle} className="w-full flex justify-between items-center" style={{ padding: '1.25rem 0', border: 'none', borderBottom: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: C.text }}>
        {title}<ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ color: C.muted }} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div>{accounts.map((acc, i) => (
              <div key={i} style={{ padding: '1.25rem 0', borderBottom: `1px solid ${C.border}` }}>
                <p style={{ fontWeight: 300, fontSize: 12, color: C.muted }}>{acc.bank} · {acc.holder}</p>
                <div className="flex justify-between items-center" style={{ marginTop: '0.25rem' }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{acc.account}</span>
                  <button onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)} className="flex items-center gap-1 transition-all duration-300 hover:bg-[#1A2F23] hover:text-[#E8EDE0]"
                    style={{ background: 'transparent', border: `1px solid ${copiedAccount === `${title}-${i}` ? C.dark : C.border}`, padding: '6px 14px', fontWeight: 500, fontSize: 11, color: copiedAccount === `${title}-${i}` ? C.dark : C.muted, cursor: 'pointer' }}>
                    {copiedAccount === `${title}-${i}` ? <><Check className="w-3 h-3" />완료</> : <><Copy className="w-3 h-3" />복사</>}
                  </button>
                </div>
              </div>
            ))}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

declare global { interface Window { Kakao?: any; } }
