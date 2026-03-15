import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Copy, Check,
  Share2, ChevronDown
} from 'lucide-react';
import {
  RsvpForm, GuestbookForm, GalleryModal, GuestbookList,
  KakaoMap, ShareModal, formatDate, formatTime, getDday,
  getCalendarData, type ThemeProps
} from './shared';

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
  @font-face { font-family: 'Mabeopsa'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2402_keris@1.0/TTHakgyoansimMabeopsaR.woff2') format('woff2'); font-display: swap; }
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200;300;400;500&display=swap');
`;

const themeStyles = `
  .vb-bars{display:flex;gap:2px;align-items:center;height:16px}
  .vb-bar{display:block;width:2px;background:#6B7B8D;border-radius:1px}
  .vb-playing .vb-bar{animation:vb-eq .6s ease infinite alternate}
  .vb-bar:nth-child(1){height:8px;animation-delay:0s}
  .vb-bar:nth-child(2){height:12px;animation-delay:.15s}
  .vb-bar:nth-child(3){height:6px;animation-delay:.3s}
  .vb-bar:nth-child(4){height:10px;animation-delay:.1s}
  .vb-paused .vb-bar{height:4px!important;animation:none}
  @keyframes vb-eq{to{height:4px}}
  .vb-script{font-family:'Great Vibes',cursive}
  .vb-arch-top{border-radius:999px 999px 20px 20px;overflow:hidden}
  .vb-arch-bottom{border-radius:20px 20px 999px 999px;overflow:hidden}
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

const F = {
  display: "'Cormorant Garamond', serif",
  body: "'Noto Serif KR', serif",
  script: "'Great Vibes', cursive",
};

const C = {
  bg: '#F9F7F2',
  bgCard: '#FFFFFF',
  bgDark: '#1A365D',
  text: '#2C3E50',
  textMuted: '#6B7B8D',
  textLight: '#9BAAB8',
  accent: '#1A365D',
  sage: '#8E9775',
  white: '#FFFFFE',
  divider: '#D1D1D1',
  dividerDark: '#2A4A7D',
};

export default function VoyageBlue({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot }: ThemeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [openAccount, setOpenAccount] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [localGuestbooks, setLocalGuestbooks] = useState(guestbooks || []);

  useEffect(() => { setLocalGuestbooks(guestbooks || []); }, [guestbooks]);

  const handleGuestbookDelete = (id: string) => {
    setLocalGuestbooks(prev => prev.filter(g => g.id !== id));
  };

  useEffect(() => {
    if (wedding.bgMusicAutoPlay && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [wedding.bgMusicAutoPlay]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleShare = async (type: 'kakao' | 'instagram' | 'sms', version?: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = version ? `${baseUrl}?v=${version}` : baseUrl;
    const title = `${wedding.groomName} ♥ ${wedding.brideName}`;
    if (type === 'kakao' && window.Kakao) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description: `${formatDate(wedding.weddingDate, 'korean')} ${formatTime(wedding.weddingTime)}`,
          imageUrl: wedding.ogCoverType === 'envelope' ? ({"black_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/7_errq8w.png", "white_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "navy_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/1_zdaupp.png", "black_silver": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "olive_ribbon_a": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/3_wdfeio.png", "olive_ribbon_b": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png", "pink_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/5_pzmfwy.png", "white_bow": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/11_o3gnaj.png", "white_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "black_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "pink_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551604/6_akrfek.png", "olive_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png"}[wedding.envelopeStyle || 'black_ribbon'] || wedding.heroMedia || '') : (wedding.heroMedia || ''),
          link: { mobileWebUrl: url, webUrl: url }
        },
        buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }]
      });
    } else if (type === 'instagram') {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.\n인스타그램 스토리에 공유해보세요!');
    } else if (type === 'sms') {
      window.location.href = `sms:?&body=${encodeURIComponent(`${title}\n${formatDate(wedding.weddingDate, 'korean')}\n${url}`)}`;
    }
    setShowShareModal(false);
  };

  const calendarData = getCalendarData(wedding.weddingDate);
  const photos = wedding.galleries || [];

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text, fontFamily: F.body, fontWeight: 300, overflowX: 'hidden' }}>
      <style>{fontStyles}{themeStyles}</style>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}

      {wedding.bgMusicUrl && (
        <button
          onClick={toggleMusic}
          className={`fixed top-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm ${isPlaying ? 'vb-playing' : 'vb-paused'}`}
          style={{ background: 'rgba(249,247,242,0.9)', border: `1px solid ${C.divider}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        >
          <div className="vb-bars">
            <span className="vb-bar" /><span className="vb-bar" /><span className="vb-bar" /><span className="vb-bar" />
          </div>
        </button>
      )}

      <header className="text-center" style={{ paddingTop: '5rem', paddingBottom: '2.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{ fontSize: 10, letterSpacing: '0.4em', color: C.sage, textTransform: 'uppercase', opacity: 0.8, marginBottom: '0.75rem' }}
        >
          The Voyage of Love
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="vb-script"
          style={{ fontSize: 'clamp(36px, 10vw, 48px)', color: C.accent, lineHeight: 1.2 }}
        >
          {wedding.groomName} & {wedding.brideName}
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          style={{ height: 1, width: 64, background: C.divider, margin: '1.5rem auto 0', opacity: 0.5 }}
        />
      </header>

      <section style={{ padding: '0 1.5rem' }}>
        <div className="space-y-6">
          {photos[0] && (
            <motion.div {...delayAnim(0.15)} className="relative group">
              <div className="vb-arch-top" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <img
                  src={heroUrl(photos[0].mediaUrl)}
                  alt=""
                  className="w-full object-cover hover:scale-105 transition-transform duration-700"
                  style={{ height: 450, display: 'block' }}
                />
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="absolute bottom-6 right-8"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
              >
                <p className="vb-script" style={{ fontSize: 28, color: C.white }}>The Bride</p>
              </motion.div>
            </motion.div>
          )}

          {photos[1] && (
            <motion.div {...delayAnim(0.3)} className="relative group">
              <div className="vb-arch-bottom" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <img
                  src={heroUrl(photos[1].mediaUrl)}
                  alt=""
                  className="w-full object-cover hover:scale-105 transition-transform duration-700"
                  style={{ height: 450, display: 'block' }}
                />
              </div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="absolute top-6 left-8"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
              >
                <p className="vb-script" style={{ fontSize: 28, color: C.white }}>The Groom</p>
              </motion.div>
            </motion.div>
          )}

          {!photos[0] && (wedding.heroMedia) && (
            <motion.div {...delayAnim(0.15)}>
              <div className="vb-arch-top" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <img src={heroUrl(wedding.heroMedia)} alt="" className="w-full object-cover" style={{ height: 500, display: 'block' }} />
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {wedding.greeting && (
        <section style={{ padding: '6rem 2.5rem' }}>
          <div className="max-w-md mx-auto text-center">
            <motion.div {...sectionAnim}>
              <p className="vb-script" style={{ fontSize: 36, color: C.accent, marginBottom: '2rem' }}>Save the Date</p>
            </motion.div>
            <motion.div {...delayAnim(0.15)}>
              {wedding.greetingTitle && (
                <p style={{ fontWeight: 300, fontSize: 16, color: C.text, lineHeight: 2, marginBottom: '1.5rem' }}>
                  {wedding.greetingTitle}
                </p>
              )}
              <p className="whitespace-pre-line" style={{ fontWeight: 200, fontSize: 15, color: C.textMuted, lineHeight: 2.2 }}>
                {wedding.greeting}
              </p>
            </motion.div>

            <motion.div {...delayAnim(0.3)}>
              <div className="flex items-center justify-center" style={{ marginTop: '4rem', borderTop: `1px solid ${C.divider}`, borderBottom: `1px solid ${C.divider}`, padding: '1.5rem 0', gap: '2.5rem', opacity: 0.9 }}>
                <div className="text-center">
                  <p style={{ fontSize: 9, color: C.sage, letterSpacing: '0.25em', marginBottom: '0.5rem' }}>DATE</p>
                  <p style={{ fontSize: 17, fontWeight: 400, letterSpacing: '-0.01em' }}>{formatDate(wedding.weddingDate, 'dots')}</p>
                </div>
                <div style={{ width: 1, height: 40, background: C.divider }} />
                <div className="text-center">
                  <p style={{ fontSize: 9, color: C.sage, letterSpacing: '0.25em', marginBottom: '0.5rem' }}>TIME</p>
                  <p style={{ fontSize: 17, fontWeight: 400, letterSpacing: '-0.01em' }}>{formatTime(wedding.weddingTime)}</p>
                </div>
              </div>
            </motion.div>

            {wedding.showParents && (
              <motion.div {...delayAnim(0.45)} className="text-center" style={{ marginTop: '3rem' }}>
                <div className="flex justify-center gap-12">
                  <div>
                    <p style={{ fontSize: 9, color: C.sage, letterSpacing: '0.25em', marginBottom: '0.5rem' }}>GROOM</p>
                    <p style={{ fontWeight: 200, fontSize: 13, color: C.textMuted }}>
                      {wedding.groomFatherName && <span>{wedding.groomFatherName}</span>}
                      {wedding.groomFatherName && wedding.groomMotherName && <span> · </span>}
                      {wedding.groomMotherName && <span>{wedding.groomMotherName}</span>}
                    </p>
                    <p style={{ fontWeight: 400, fontSize: 14, color: C.text, marginTop: '0.25rem' }}>
                      의 아들 {wedding.groomName}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: C.sage, letterSpacing: '0.25em', marginBottom: '0.5rem' }}>BRIDE</p>
                    <p style={{ fontWeight: 200, fontSize: 13, color: C.textMuted }}>
                      {wedding.brideFatherName && <span>{wedding.brideFatherName}</span>}
                      {wedding.brideFatherName && wedding.brideMotherName && <span> · </span>}
                      {wedding.brideMotherName && <span>{wedding.brideMotherName}</span>}
                    </p>
                    <p style={{ fontWeight: 400, fontSize: 14, color: C.text, marginTop: '0.25rem' }}>
                      의 딸 {wedding.brideName}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {wedding.loveStoryVideo && (
        <section style={{ background: C.bgCard, padding: '5rem 1.5rem' }}>
          <div className="max-w-md mx-auto">
            <motion.div {...sectionAnim} className="text-center" style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: 9, color: C.sage, letterSpacing: '0.4em', textTransform: 'uppercase' }}>OUR STORY</p>
            </motion.div>
            <motion.div {...delayAnim(0.15)} className="rounded-2xl overflow-hidden">
              {wedding.loveStoryVideo.includes("youtube") || wedding.loveStoryVideo.includes("youtu.be") ? (
                <iframe
                  src={wedding.loveStoryVideo.includes("youtu.be") ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("youtu.be/")[1]?.split("?")[0]}` : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("watch?v=")[1]?.split("&")[0]}`}
                  className="w-full aspect-video"
                  allowFullScreen
                />
              ) : (
                <video src={wedding.loveStoryVideo} controls className="w-full aspect-video" />
              )}
            </motion.div>
          </div>
        </section>
      )}

      {photos.length > 2 && (
        <section id="gallery-section" style={{ background: C.bgCard, padding: '5rem 0' }}>
          <motion.div {...sectionAnim} className="text-center" style={{ marginBottom: '2rem', padding: '0 2rem' }}>
            <p style={{ fontSize: 9, color: C.sage, letterSpacing: '0.4em', textTransform: 'uppercase' }}>GALLERY</p>
          </motion.div>
          <div className="max-w-md mx-auto">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {photos.slice(2, 10).map((item, index) => (
                <motion.div
                  key={item.id}
                  {...delayAnim(index % 2 === 0 ? 0.15 : 0.3)}
                  onClick={() => setGalleryIndex(index + 2)}
                  className={`overflow-hidden cursor-pointer ${index === 0 ? 'col-span-2' : ''}`}
                  style={{ aspectRatio: index === 0 ? '4/3' : '1/1' }}
                >
                  {item.mediaType === 'VIDEO' ? (
                    <video src={item.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={galleryThumbUrl(item.mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" style={{ display: 'block' }} />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="venue-section" style={{ background: C.bgDark, padding: '7rem 2rem', color: C.white }}>
        <div className="max-w-md mx-auto">
          <motion.div {...sectionAnim} className="text-center">
            <p className="vb-script" style={{ fontSize: 32, color: C.white, opacity: 0.9, marginBottom: '2.5rem' }}>When & Where</p>
          </motion.div>

          <motion.div {...delayAnim(0.15)} className="text-center">
            <p style={{ fontFamily: F.display, fontWeight: 300, fontSize: 13, color: C.textLight, letterSpacing: '0.2em', marginBottom: '1.5rem' }}>
              {calendarData.year}. {['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][calendarData.month - 1]}
            </p>
            <div className="max-w-[320px] mx-auto">
              <div className="grid grid-cols-7">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-center" style={{ fontWeight: 200, fontSize: 11, color: i === 0 ? '#E8C48A' : C.textLight, padding: '8px 0' }}>{d}</div>
                ))}
                {calendarData.weeks.flat().map((day, i) => {
                  const isSunday = i % 7 === 0;
                  const isTarget = day === calendarData.targetDay;
                  return (
                    <div key={i} className="text-center relative" style={{ fontWeight: 300, fontSize: 13, color: !day ? 'transparent' : isSunday ? '#E8C48A' : C.white, padding: '10px 0' }}>
                      {isTarget && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full" style={{ border: '1px solid #E8C48A' }} />
                      )}
                      <span className="relative z-10">{day || ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div {...delayAnim(0.3)} className="text-center">
            <div style={{ width: 48, height: 1, background: C.dividerDark, margin: '2.5rem auto' }} />
            <p style={{ fontWeight: 300, fontSize: 15, color: C.white }}>
              {formatDate(wedding.weddingDate, 'korean')} {formatTime(wedding.weddingTime)}
            </p>
            <p style={{ fontWeight: 400, fontSize: 16, color: C.white, marginTop: '1rem' }}>{wedding.venue}</p>
            {wedding.venueHall && <p style={{ fontWeight: 200, fontSize: 13, color: C.textLight, marginTop: '0.25rem' }}>{wedding.venueHall}</p>}
            <p style={{ fontWeight: 200, fontSize: 12, color: C.textLight, marginTop: '0.5rem' }}>{wedding.venueAddress}</p>
            {wedding.venuePhone && (
              <a href={`tel:${wedding.venuePhone}`} className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: C.textLight, marginTop: '0.5rem' }}>
                <Phone className="w-3 h-3" />{wedding.venuePhone}
              </a>
            )}

            {wedding.showDday && (
              <p style={{ fontFamily: F.display, fontWeight: 300, fontSize: 13, letterSpacing: '0.15em', color: '#E8C48A', marginTop: '1rem' }}>
                {getDday(wedding.weddingDate)}
              </p>
            )}

            <div className="flex justify-center gap-3" style={{ marginTop: '2rem' }}>
              {wedding.venueNaverMap && (
                <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-full transition-colors duration-300 hover:border-white/60"
                  style={{ background: 'transparent', border: `1px solid ${C.dividerDark}`, padding: '12px 20px', fontFamily: F.body, fontWeight: 200, fontSize: 12, color: C.textLight, minHeight: 48 }}>
                  네이버 지도
                </a>
              )}
              {wedding.venueKakaoMap && (
                <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-full transition-colors duration-300 hover:border-white/60"
                  style={{ background: 'transparent', border: `1px solid ${C.dividerDark}`, padding: '12px 20px', fontFamily: F.body, fontWeight: 200, fontSize: 12, color: C.textLight, minHeight: 48 }}>
                  카카오맵
                </a>
              )}
              {wedding.venueTmap && (
                <a href={wedding.venueTmap} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-full transition-colors duration-300 hover:border-white/60"
                  style={{ background: 'transparent', border: `1px solid ${C.dividerDark}`, padding: '12px 20px', fontFamily: F.body, fontWeight: 200, fontSize: 12, color: C.textLight, minHeight: 48 }}>
                  티맵
                </a>
              )}
            </div>
          </motion.div>

          <motion.div {...delayAnim(0.45)} style={{ marginTop: '2.5rem' }}>
            <KakaoMap address={wedding.venueAddress} venue={wedding.venue} latitude={wedding.venueLatitude} longitude={wedding.venueLongitude} />
          </motion.div>
        </div>
      </section>

      <section id="rsvp-section" style={{ background: C.bg, padding: '7rem 2rem' }}>
        <div className="max-w-md mx-auto">
          <motion.div {...sectionAnim} className="text-center">
            <p style={{ fontSize: 9, color: C.sage, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: '2rem' }}>ATTENDANCE</p>
            <div style={{ width: 1, height: 40, background: C.divider, margin: '0 auto 2.5rem' }} />
          </motion.div>
          <motion.div {...delayAnim(0.15)}>
            <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="minimal" />
          </motion.div>
        </div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section id="account-section" style={{ background: C.bgCard, padding: '6rem 2rem' }}>
          <div className="max-w-md mx-auto">
            <motion.div {...sectionAnim} className="text-center">
              <p style={{ fontSize: 9, color: C.sage, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: '2rem' }}>GIFT</p>
              <div style={{ width: 1, height: 40, background: C.divider, margin: '0 auto 2.5rem' }} />
            </motion.div>

            <motion.div {...delayAnim(0.15)}>
              <AccountCard
                title="신랑측 계좌"
                accounts={[
                  wedding.groomAccount && { bank: wedding.groomBank, account: wedding.groomAccount, holder: wedding.groomAccountHolder || wedding.groomName },
                  wedding.groomFatherAccount && { bank: wedding.groomFatherBank, account: wedding.groomFatherAccount, holder: wedding.groomFatherAccountHolder || wedding.groomFatherName },
                  wedding.groomMotherAccount && { bank: wedding.groomMotherBank, account: wedding.groomMotherAccount, holder: wedding.groomMotherAccountHolder || wedding.groomMotherName }
                ].filter(Boolean) as any[]}
                isOpen={openAccount === 'groom'}
                onToggle={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')}
                copiedAccount={copiedAccount}
                onCopy={copyToClipboard}
              />
            </motion.div>
            <motion.div {...delayAnim(0.3)}>
              <AccountCard
                title="신부측 계좌"
                accounts={[
                  wedding.brideAccount && { bank: wedding.brideBank, account: wedding.brideAccount, holder: wedding.brideAccountHolder || wedding.brideName },
                  wedding.brideFatherAccount && { bank: wedding.brideFatherBank, account: wedding.brideFatherAccount, holder: wedding.brideFatherAccountHolder || wedding.brideFatherName },
                  wedding.brideMotherAccount && { bank: wedding.brideMotherBank, account: wedding.brideMotherAccount, holder: wedding.brideMotherAccountHolder || wedding.brideMotherName }
                ].filter(Boolean) as any[]}
                isOpen={openAccount === 'bride'}
                onToggle={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')}
                copiedAccount={copiedAccount}
                onCopy={copyToClipboard}
              />
            </motion.div>

            {(wedding.tossLink || wedding.kakaoPayLink) && (
              <div className="flex justify-center gap-3" style={{ marginTop: '2rem' }}>
                {wedding.tossLink && (
                  <a href={wedding.tossLink} target="_blank" className="flex items-center justify-center rounded-full transition-colors duration-300"
                    style={{ border: `1px solid ${C.divider}`, padding: '12px 24px', fontFamily: F.body, fontWeight: 200, fontSize: 12, color: C.textMuted, minHeight: 48 }}>
                    토스
                  </a>
                )}
                {wedding.kakaoPayLink && (
                  <a href={wedding.kakaoPayLink} target="_blank" className="flex items-center justify-center rounded-full transition-colors duration-300"
                    style={{ border: `1px solid ${C.divider}`, padding: '12px 24px', fontFamily: F.body, fontWeight: 200, fontSize: 12, color: C.textMuted, minHeight: 48 }}>
                    카카오페이
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <section id="guestbook-section" style={{ background: C.bg, padding: '7rem 2rem' }}>
        <div className="max-w-md mx-auto">
          <motion.div {...sectionAnim} className="text-center">
            <p style={{ fontSize: 9, color: C.sage, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: '2rem' }}>GUESTBOOK</p>
            <div style={{ width: 1, height: 40, background: C.divider, margin: '0 auto 2.5rem' }} />
          </motion.div>
          <motion.div {...delayAnim(0.15)}>
            <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="minimal" />
            <GuestbookList
              guestbooks={localGuestbooks}
              weddingSlug={wedding.slug}
              onDelete={handleGuestbookDelete}
              variant="classic"
            />
          </motion.div>
        </div>
      </section>

      {guestPhotoSlot}

      <section style={{ background: C.bgDark, padding: '5rem 2rem', textAlign: 'center' }}>
        <motion.div {...sectionAnim}>
          <p className="vb-script" style={{ fontSize: 24, color: C.white, opacity: 0.6 }}>Smooth sailing together</p>
        </motion.div>

        <motion.div {...delayAnim(0.15)}>
          {wedding.closingMessage && (
            <p className="whitespace-pre-line" style={{ fontWeight: 200, fontSize: 13, color: C.textLight, lineHeight: 2.2, marginTop: '1.5rem' }}>
              {wedding.closingMessage}
            </p>
          )}

          <div className="flex justify-center gap-4" style={{ marginTop: '2.5rem' }}>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center justify-center rounded-full transition-all duration-300 hover:border-white/50"
              style={{ width: 48, height: 48, border: `1px solid ${C.dividerDark}`, background: 'transparent' }}
            >
              <Share2 className="w-[18px] h-[18px]" style={{ color: C.textLight }} />
            </button>
          </div>

          <div className="flex justify-center gap-4" style={{ marginTop: '2rem' }}>
            {wedding.groomPhone && (
              <a href={`tel:${wedding.groomPhone}`} className="text-center group">
                <div className="flex items-center justify-center rounded-full transition-all duration-300 group-hover:border-white/50"
                  style={{ width: 48, height: 48, border: `1px solid ${C.dividerDark}`, marginBottom: '0.5rem' }}>
                  <Phone className="w-[18px] h-[18px]" style={{ color: C.textLight }} />
                </div>
                <span style={{ fontWeight: 200, fontSize: 11, color: C.textLight }}>신랑</span>
              </a>
            )}
            {wedding.bridePhone && (
              <a href={`tel:${wedding.bridePhone}`} className="text-center group">
                <div className="flex items-center justify-center rounded-full transition-all duration-300 group-hover:border-white/50"
                  style={{ width: 48, height: 48, border: `1px solid ${C.dividerDark}`, marginBottom: '0.5rem' }}>
                  <Phone className="w-[18px] h-[18px]" style={{ color: C.textLight }} />
                </div>
                <span style={{ fontWeight: 200, fontSize: 11, color: C.textLight }}>신부</span>
              </a>
            )}
          </div>
        </motion.div>
      </section>

      <footer style={{ padding: '2rem', textAlign: 'center', background: C.bg }}>
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"
          style={{ fontWeight: 200, fontSize: 11, color: C.textLight, textDecoration: 'none', letterSpacing: '0.05em' }}>
          Made by 청첩장 작업실 ›
        </a>
      </footer>

      <AnimatePresence>
        {galleryIndex !== null && wedding.galleries && (
          <GalleryModal
            galleries={wedding.galleries}
            currentIndex={galleryIndex}
            onClose={() => setGalleryIndex(null)}
            onNavigate={setGalleryIndex}
            theme="VOYAGE_BLUE"
            usePhotoFilter={wedding.usePhotoFilter ?? true}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} variant="light" weddingId={wedding.id} />
      </AnimatePresence>
    </div>
  );
}

function AccountCard({ title, accounts, isOpen, onToggle, copiedAccount, onCopy }: {
  title: string;
  accounts: { bank: string; account: string; holder: string }[];
  isOpen: boolean;
  onToggle: () => void;
  copiedAccount: string | null;
  onCopy: (t: string, id: string) => void;
}) {
  if (!accounts.length) return null;
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center"
        style={{ padding: '1.25rem 0', border: 'none', borderBottom: `1px solid ${C.divider}`, background: 'transparent', cursor: 'pointer', fontFamily: F.body, fontWeight: 300, fontSize: 14, color: C.text }}
      >
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ color: C.textMuted }} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div>
              {accounts.map((acc, i) => (
                <div key={i} style={{ padding: '1.25rem 0', borderBottom: `1px solid ${C.divider}` }}>
                  <p style={{ fontWeight: 200, fontSize: 12, color: C.textMuted }}>{acc.bank} · {acc.holder}</p>
                  <div className="flex justify-between items-center" style={{ marginTop: '0.25rem' }}>
                    <span style={{ fontWeight: 300, fontSize: 13, color: C.text }}>{acc.account}</span>
                    <button
                      onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)}
                      className="flex items-center gap-1 rounded-full transition-all duration-300 hover:border-[#1A365D] hover:text-[#1A365D]"
                      style={{
                        background: 'transparent',
                        border: `1px solid ${copiedAccount === `${title}-${i}` ? C.accent : C.divider}`,
                        borderRadius: 9999,
                        padding: '6px 14px',
                        fontFamily: F.body,
                        fontWeight: 200,
                        fontSize: 11,
                        color: copiedAccount === `${title}-${i}` ? C.accent : C.textMuted,
                        cursor: 'pointer',
                      }}
                    >
                      {copiedAccount === `${title}-${i}` ? <><Check className="w-3 h-3" />완료</> : <><Copy className="w-3 h-3" />복사</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

declare global { interface Window { Kakao?: any; } }
