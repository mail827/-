import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Copy, Check,
  ChevronDown
} from 'lucide-react';
import {
  RsvpForm, GuestbookForm, GalleryModal, GuestbookList,
  KakaoMap, ShareModal, formatDate, formatTime, getDday,
  getCalendarData, type ThemeProps
} from './shared';

const fontStyles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
`;

const themeStyles = `
  .eb-bars{display:flex;gap:2px;align-items:center;height:16px}
  .eb-bar{display:block;width:2px;background:#4A6080;border-radius:1px}
  .eb-playing .eb-bar{animation:eb-eq .6s ease infinite alternate}
  .eb-bar:nth-child(1){height:8px;animation-delay:0s}
  .eb-bar:nth-child(2){height:12px;animation-delay:.15s}
  .eb-bar:nth-child(3){height:6px;animation-delay:.3s}
  .eb-bar:nth-child(4){height:10px;animation-delay:.1s}
  .eb-paused .eb-bar{height:4px!important;animation:none}
  @keyframes eb-eq{to{height:4px}}
  .eb-pre{font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif}
  .eb-giant{font-size:clamp(5rem,22vw,25rem);font-weight:900;line-height:0.85;letter-spacing:-0.06em;text-transform:uppercase}
  .eb-large{font-size:clamp(2rem,7vw,4rem);font-weight:900;line-height:1.1;letter-spacing:-0.04em}
  .eb-label{font-size:0.65rem;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;opacity:0.6}
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
  bg: '#F2F2F2',
  card: '#FFFFFF',
  dark: '#001A40',
  muted: '#4A6080',
  dim: '#8A9AB0',
  border: '#D0D8E0',
};

export default function EditorialBlue({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot }: ThemeProps) {
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
      window.Kakao.Share.sendDefault({ objectType: 'feed', content: { title, description: `${formatDate(wedding.weddingDate, 'korean')} ${formatTime(wedding.weddingTime)}`, imageUrl: wedding.ogCoverType === 'envelope' ? ({"black_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/7_errq8w.png", "white_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "navy_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/1_zdaupp.png", "black_silver": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "olive_ribbon_a": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/3_wdfeio.png", "olive_ribbon_b": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png", "pink_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/5_pzmfwy.png", "white_bow": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/11_o3gnaj.png", "white_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "black_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "pink_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551604/6_akrfek.png", "olive_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png"}[wedding.envelopeStyle || 'black_ribbon'] || wedding.heroMedia || '') : (wedding.heroMedia || ''), link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }] });
    } else if (type === 'instagram') { await navigator.clipboard.writeText(url); alert('링크가 복사되었습니다.\n인스타그램 스토리에 공유해보세요!'); }
    else if (type === 'sms') { window.location.href = `sms:?&body=${encodeURIComponent(`${title}\n${formatDate(wedding.weddingDate, 'korean')}\n${url}`)}`; }
    setShowShareModal(false);
  };

  const calendarData = getCalendarData(wedding.weddingDate);
  const wd = new Date(wedding.weddingDate);
  const yr = wd.getFullYear();

  return (
    <div className="min-h-screen eb-pre" style={{ background: C.bg, overflowX: 'hidden' }}>
      <div className="w-full" style={{ color: C.dark, fontWeight: 400, wordBreak: 'keep-all' }}>
      <style>{fontStyles}{themeStyles}</style>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className={`fixed top-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center ${isPlaying ? 'eb-playing' : 'eb-paused'}`}
          style={{ background: 'rgba(242,242,242,0.9)', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="eb-bars"><span className="eb-bar" /><span className="eb-bar" /><span className="eb-bar" /><span className="eb-bar" /></div>
        </button>
      )}

      <section className="relative flex flex-col" style={{ height: heroHeight, padding: 'clamp(10px,3vw,20px)' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
          className="flex justify-between" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          <span>Vol. {yr}</span>
          <span>Edition Blue</span>
        </motion.div>

        <div className="flex-1 flex flex-col justify-center" style={{ marginTop: '-5vh' }}>
          <motion.h1 initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="eb-giant" style={{ alignSelf: 'flex-start' }}>
            Blue
          </motion.h1>
          {(wedding.heroMedia || wedding.galleries?.[0]?.mediaUrl) && (
            <motion.div initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.3 }}
              style={{ width: "75%", height: "38vh", alignSelf: "center", margin: "12px 0", overflow: "hidden", zIndex: 1 }}>
              {wedding.heroMediaType === "VIDEO" ? (
                <video src={wedding.heroMedia ? heroUrl(wedding.heroMedia) : ""} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <img src={heroUrl(wedding.heroMedia || wedding.galleries?.[0]?.mediaUrl || "")} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              )}
            </motion.div>
          )}
          <motion.h1 initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="eb-giant" style={{ alignSelf: 'flex-start', marginTop: '-0.05em' }}>
            Moment
          </motion.h1>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }}
          style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', alignSelf: 'flex-end' }}>
          Scroll to Invitation
        </motion.div>
      </section>


      <section style={{ padding: '5rem 1.25rem', borderTop: `2px solid ${C.dark}` }}>
        <motion.div {...sectionAnim} style={{ marginBottom: '2.5rem' }}>
          <p className="eb-label" style={{ marginBottom: 15 }}>The Artists</p>
          <p className="eb-large">{wedding.groomName} & {wedding.brideName}</p>
        </motion.div>

        <motion.div {...delayAnim(0.15)} style={{ marginBottom: '2.5rem' }}>
          <p className="eb-label" style={{ marginBottom: 15 }}>The Date</p>
          <p className="eb-large">{formatDate(wedding.weddingDate, 'korean')}</p>
          <p style={{ fontSize: 'clamp(1.2rem,4vw,1.8rem)', fontWeight: 800, marginTop: 4, letterSpacing: '-0.02em' }}>{formatTime(wedding.weddingTime)}</p>
        </motion.div>

        <motion.div {...delayAnim(0.3)}>
          <p className="eb-label" style={{ marginBottom: 15 }}>The Venue</p>
          <p className="eb-large">{wedding.venue}</p>
          {wedding.venueHall && <p style={{ fontSize: 16, fontWeight: 500, color: C.muted, marginTop: 4 }}>{wedding.venueHall}</p>}
          <p style={{ fontSize: 14, fontWeight: 300, color: C.muted, marginTop: 8 }}>{wedding.venueAddress}</p>
          {wedding.venuePhone && ( <a href={`tel:${wedding.venuePhone}`} className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: C.muted, marginTop: 6 }}><Phone className="w-3 h-3" />{wedding.venuePhone}</a> )}
        </motion.div>
      </section>

      {wedding.greeting && (
        <section style={{ padding: '4rem 1.25rem', background: C.card, borderTop: `1px solid ${C.border}` }}>
          <motion.div {...sectionAnim}>
            <p className="eb-label" style={{ marginBottom: 16 }}>Invitation</p>
            {wedding.greetingTitle && <p style={{ fontSize: 'clamp(1.5rem,5vw,2.2rem)', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 16 }}>{wedding.greetingTitle}</p>}
            <p className="whitespace-pre-line" style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.9, color: C.muted }}>{wedding.greeting}</p>
          </motion.div>

          {wedding.showParents && (
            <motion.div {...delayAnim(0.2)} style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <p className="eb-label" style={{ marginBottom: 8 }}>Groom</p>
                <p style={{ fontWeight: 300, fontSize: 12, color: C.muted }}>
                  {wedding.groomFatherName}{wedding.groomFatherName && wedding.groomMotherName && ' · '}{wedding.groomMotherName}
                </p>
                <p style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>의 아들 {wedding.groomName}</p>
              </div>
              <div>
                <p className="eb-label" style={{ marginBottom: 8 }}>Bride</p>
                <p style={{ fontWeight: 300, fontSize: 12, color: C.muted }}>
                  {wedding.brideFatherName}{wedding.brideFatherName && wedding.brideMotherName && ' · '}{wedding.brideMotherName}
                </p>
                <p style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>의 딸 {wedding.brideName}</p>
              </div>
            </motion.div>
          )}
        </section>
      )}

      {wedding.loveStoryVideo && (
        <section style={{ padding: '0 1.25rem 4rem', borderTop: `1px solid ${C.border}` }}>
          <motion.div {...sectionAnim} style={{ paddingTop: '2.5rem' }}>
            <p className="eb-label" style={{ marginBottom: 16 }}>Film</p>
            {wedding.loveStoryVideo.includes("youtube") || wedding.loveStoryVideo.includes("youtu.be") ? (
              <iframe src={wedding.loveStoryVideo.includes("youtu.be") ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("youtu.be/")[1]?.split("?")[0]}` : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("watch?v=")[1]?.split("&")[0]}`} className="w-full aspect-video" allowFullScreen />
            ) : ( <video src={wedding.loveStoryVideo} controls className="w-full aspect-video" /> )}
          </motion.div>
        </section>
      )}

      {wedding.galleries && wedding.galleries.length > 0 && (
        <section id="gallery-section" style={{ padding: '0 0 4rem', background: C.card, borderTop: `1px solid ${C.border}` }}>
          <motion.div {...sectionAnim} style={{ padding: '2.5rem 1.25rem 1.5rem' }}>
            <p className="eb-label">Gallery</p>
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

      <section id="venue-section" style={{ background: C.dark, color: C.bg, padding: '4rem 1.25rem' }}>
        <motion.div {...sectionAnim} className="text-center" style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.3em", opacity: 0.4, marginBottom: "0.75rem" }}>WHEN & WHERE</p>
          <p style={{ fontSize: 18, fontWeight: 800, marginBottom: "0.25rem" }}>{formatDate(wedding.weddingDate, "korean")} {formatTime(wedding.weddingTime)}</p>
          <p style={{ fontSize: 14, fontWeight: 500, opacity: 0.7, marginBottom: "2rem" }}>{wedding.venue}{wedding.venueHall ? ` ${wedding.venueHall}` : ""}</p>
          <div className="max-w-[300px] mx-auto">
            <div className="grid grid-cols-7">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-center" style={{ fontWeight: 600, fontSize: 10, color: i === 0 ? '#8AB4F8' : 'rgba(242,242,242,0.3)', padding: '6px 0' }}>{d}</div>
              ))}
              {calendarData.weeks.flat().map((day, i) => {
                const isS = i % 7 === 0;
                const isT = day === calendarData.targetDay;
                return (
                  <div key={i} className="text-center relative" style={{ fontWeight: 400, fontSize: 13, color: !day ? 'transparent' : isS ? '#8AB4F8' : 'rgba(242,242,242,0.7)', padding: '8px 0' }}>
                    {isT && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full" style={{ border: '2px solid #8AB4F8' }} />}
                    <span className="relative z-10">{day || ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {wedding.showDday && <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: '#8AB4F8', marginTop: '1.25rem' }}>{getDday(wedding.weddingDate)}</p>}
        </motion.div>

        <motion.div {...delayAnim(0.2)}>
          <div className="flex justify-center gap-3 flex-wrap" style={{ marginTop: '2rem' }}>
            {wedding.venueNaverMap && ( <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" style={{ color: C.bg, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 4, minHeight: 48, display: 'flex', alignItems: 'center' }}>NAVER MAP</a> )}
            {wedding.venueKakaoMap && ( <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" style={{ color: C.bg, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 4, minHeight: 48, display: 'flex', alignItems: 'center' }}>KAKAO MAP</a> )}
            {wedding.venueTmap && ( <a href={wedding.venueTmap} target="_blank" rel="noopener noreferrer" style={{ color: C.bg, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 4, minHeight: 48, display: 'flex', alignItems: 'center' }}>T MAP</a> )}
          </div>
        </motion.div>

        <motion.div {...delayAnim(0.3)} style={{ marginTop: '2rem' }}>
          <KakaoMap address={wedding.venueAddress} venue={wedding.venue} latitude={wedding.venueLatitude} longitude={wedding.venueLongitude} />
        </motion.div>
      </section>

      <section id="rsvp-section" style={{ background: C.card, padding: '4rem 1.25rem', borderTop: `1px solid ${C.border}` }}>
        <motion.div {...sectionAnim}>
          <p className="eb-label" style={{ marginBottom: '2rem' }}>Attendance</p>
        </motion.div>
        <motion.div {...delayAnim(0.15)}>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="editorial" />
        </motion.div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section id="account-section" style={{ background: C.card, padding: '4rem 1.25rem', borderTop: `1px solid ${C.border}` }}>
          <motion.div {...sectionAnim}>
            <p className="eb-label" style={{ marginBottom: '2rem' }}>Gift</p>
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

      <section id="guestbook-section" style={{ background: C.card, padding: '4rem 1.25rem', borderTop: `1px solid ${C.border}` }}>
        <motion.div {...sectionAnim}>
          <p className="eb-label" style={{ marginBottom: '2rem' }}>Guestbook</p>
        </motion.div>
        <motion.div {...delayAnim(0.15)}>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="editorial" />
          <GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="classic" />
        </motion.div>
      </section>

      {guestPhotoSlot}

      <section style={{ padding: '4rem 1.25rem', borderTop: `1px solid ${C.border}` }}>
        <motion.div {...sectionAnim} className="text-center">
          {wedding.closingMessage && <p className="whitespace-pre-line" style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.9, color: C.muted, marginBottom: '2rem' }}>{wedding.closingMessage}</p>}
          <div className="flex justify-center gap-4">
            {wedding.groomPhone && ( <a href={`tel:${wedding.groomPhone}`} className="text-center group">
              <div className="flex items-center justify-center transition-all duration-300 group-hover:bg-[#001A40] group-hover:text-[#F2F2F2]" style={{ width: 48, height: 48, border: `1.5px solid ${C.dark}`, marginBottom: '0.5rem' }}><Phone className="w-4 h-4" /></div>
              <span style={{ fontWeight: 600, fontSize: 10, color: C.muted }}>신랑</span></a> )}
            {wedding.bridePhone && ( <a href={`tel:${wedding.bridePhone}`} className="text-center group">
              <div className="flex items-center justify-center transition-all duration-300 group-hover:bg-[#001A40] group-hover:text-[#F2F2F2]" style={{ width: 48, height: 48, border: `1.5px solid ${C.dark}`, marginBottom: '0.5rem' }}><Phone className="w-4 h-4" /></div>
              <span style={{ fontWeight: 600, fontSize: 10, color: C.muted }}>신부</span></a> )}
          </div>
          <button onClick={() => setShowShareModal(true)} style={{ marginTop: '2rem', background: C.dark, color: C.bg, padding: '14px 32px', fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }} className="hover:opacity-80 transition-opacity">SHARE</button>
        </motion.div>
      </section>

      <footer style={{ padding: '2rem 1.25rem', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" style={{ fontWeight: 300, fontSize: 10, color: C.dim, textDecoration: 'none' }}>Made by 청첩장 작업실 ›</a>
      </footer>

      <AnimatePresence>
        {galleryIndex !== null && wedding.galleries && ( <GalleryModal galleries={wedding.galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="EDITORIAL_BLUE" usePhotoFilter={wedding.usePhotoFilter ?? true} /> )}
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
      <button onClick={onToggle} className="w-full flex justify-between items-center" style={{ padding: '1.25rem 0', border: 'none', borderBottom: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: C.dark }}>
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
                  <button onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)} className="flex items-center gap-1 transition-all duration-300 hover:bg-[#001A40] hover:text-[#F2F2F2]"
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
