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
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200;300;400;500&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
`;

const themeStyles = `
  .cs-bars{display:flex;gap:2px;align-items:center;height:16px}
  .cs-bar{display:block;width:2px;background:#9E8E7A;border-radius:1px}
  .cs-playing .cs-bar{animation:cs-eq .6s ease infinite alternate}
  .cs-bar:nth-child(1){height:8px;animation-delay:0s}
  .cs-bar:nth-child(2){height:12px;animation-delay:.15s}
  .cs-bar:nth-child(3){height:6px;animation-delay:.3s}
  .cs-bar:nth-child(4){height:10px;animation-delay:.1s}
  .cs-paused .cs-bar{height:4px!important;animation:none}
  @keyframes cs-eq{to{height:4px}}
  @keyframes cs-heroZoom{from{transform:scale(1.06)}to{transform:scale(1)}}
  .cs-hero-img{animation:cs-heroZoom 4s ease-out forwards;opacity:.7}
  .cs-vertical{writing-mode:vertical-rl;text-orientation:mixed;transform:rotate(180deg)}
  .cs-script{font-family:'Great Vibes',cursive}
`;

const sectionAnim = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
};

const titleAnim = {
  initial: { opacity: 0, letterSpacing: '0.6em' },
  whileInView: { opacity: 1, letterSpacing: '0.4em' },
  viewport: { once: true },
  transition: { duration: 1.2 },
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
  bg: '#0D0B09',
  bgCard: '#1A1714',
  bgWarm: '#151210',
  text: '#E8DFD4',
  textMuted: '#9E8E7A',
  textLight: '#6B5D4E',
  accent: '#D4A054',
  accentLight: '#E8C48A',
  white: '#FFF8EE',
  divider: '#2E2720',
  dividerLight: '#3D342A',
};

export default function CruiseSunset({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot }: ThemeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [openAccount, setOpenAccount] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [localGuestbooks, setLocalGuestbooks] = useState(guestbooks || []);
  const [heroHeight] = useState(() => typeof window !== 'undefined' ? window.innerHeight + 'px' : '100vh');

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
          imageUrl: wedding.heroMedia || '',
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

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text, fontFamily: F.body, fontWeight: 200, overflowX: 'hidden' }}>
      <style>{fontStyles}{themeStyles}</style>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}

      {wedding.bgMusicUrl && (
        <button
          onClick={toggleMusic}
          className={`fixed top-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm ${isPlaying ? 'cs-playing' : 'cs-paused'}`}
          style={{ background: 'rgba(26,23,20,0.85)', border: `1px solid ${C.divider}`, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
        >
          <div className="cs-bars">
            <span className="cs-bar" /><span className="cs-bar" /><span className="cs-bar" /><span className="cs-bar" />
          </div>
        </button>
      )}

      <section className="relative w-full overflow-hidden" style={{ height: heroHeight, background: '#000' }}>
        <div className="absolute inset-0">
          {(wedding.heroMedia || wedding.galleries?.[0]?.mediaUrl) && (
            wedding.heroMediaType === 'VIDEO' ? (
              <video src={wedding.heroMedia ? heroUrl(wedding.heroMedia) : ''} autoPlay muted loop playsInline className="w-full h-full object-cover cs-hero-img" />
            ) : (
              <img src={heroUrl(wedding.heroMedia || wedding.galleries?.[0]?.mediaUrl || '')} alt="" className="w-full h-full object-cover cs-hero-img" />
            )
          )}
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(13,11,9,0.6) 100%)' }} />

        <div className="absolute inset-0 z-20 flex flex-col justify-between" style={{ padding: '2.5rem 2rem' }}>
          <motion.p
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="text-center"
            style={{ fontFamily: F.body, fontWeight: 200, fontSize: 11, letterSpacing: '0.25em', color: C.textMuted, textTransform: 'uppercase' }}
          >
            Happily Ever After
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="text-center"
            style={{ marginTop: '0' }}
          >
            <p className="cs-script" style={{ fontSize: 'clamp(52px, 13vw, 76px)', color: C.white, lineHeight: 1.15, textShadow: '0 4px 30px rgba(212,160,84,0.15)' }}>
              Dream your<br />Wedding Day
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
            className="flex flex-col items-center"
            style={{ gap: '1.25rem' }}
          >
            <div className="text-center">
              <p style={{ fontFamily: F.display, fontWeight: 300, fontSize: 11, color: C.accent, letterSpacing: '0.12em', marginBottom: '0.4rem', opacity: 0.8 }}>
                FINALLY {formatDate(wedding.weddingDate, 'dots')}
              </p>
              <p style={{ fontWeight: 400, fontSize: 20, color: C.white, letterSpacing: '0.08em' }}>
                {wedding.groomName} & {wedding.brideName}
              </p>
            </div>
            <button
              onClick={() => document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="transition-colors duration-300"
              style={{ fontFamily: F.body, fontWeight: 200, fontSize: 11, color: 'rgba(255,248,238,0.5)', letterSpacing: '0.25em', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,248,238,0.2)', paddingBottom: 3, cursor: 'pointer' }}
            >
              GALLERY
            </button>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="cs-vertical absolute z-20"
          style={{ right: '1.25rem', top: '50%', translate: '0 -50%', fontFamily: F.body, fontWeight: 200, fontSize: 9, letterSpacing: '0.3em', color: C.textLight }}
        >
          new chapter
        </motion.p>
      </section>

      {wedding.greeting && (
        <section style={{ background: C.bg, padding: '7rem 2rem' }}>
          <div className="max-w-md mx-auto">
            <motion.div {...sectionAnim} className="text-center">
              <motion.p {...titleAnim} style={{ fontFamily: F.display, fontWeight: 300, fontStyle: 'italic', fontSize: 12, letterSpacing: '0.4em', color: C.accent, marginBottom: '2rem' }}>
                INVITATION
              </motion.p>
              <div style={{ width: 1, height: 40, background: C.divider, margin: '0 auto 2.5rem' }} />
            </motion.div>

            <motion.div {...delayAnim(0.15)} className="text-center">
              {wedding.greetingTitle && (
                <p style={{ fontWeight: 300, fontSize: 18, color: C.text, lineHeight: 2, marginBottom: '2rem' }}>
                  {wedding.greetingTitle}
                </p>
              )}
              <p className="whitespace-pre-line" style={{ fontWeight: 200, fontSize: 14, color: C.textMuted, lineHeight: 2.4 }}>
                {wedding.greeting}
              </p>
            </motion.div>

            {wedding.showParents && (
              <motion.div {...delayAnim(0.3)} className="text-center">
                <div style={{ width: 48, height: 1, background: C.divider, margin: '2.5rem auto' }} />
                <div className="flex justify-center gap-12" style={{ marginTop: '2rem' }}>
                  <div>
                    <p style={{ fontFamily: F.display, fontWeight: 400, fontSize: 11, letterSpacing: '0.2em', color: C.accent, marginBottom: '0.5rem' }}>GROOM</p>
                    <p style={{ fontWeight: 300, fontSize: 13, color: C.textMuted }}>
                      {wedding.groomFatherName && <span>{wedding.groomFatherName}</span>}
                      {wedding.groomFatherName && wedding.groomMotherName && <span> · </span>}
                      {wedding.groomMotherName && <span>{wedding.groomMotherName}</span>}
                    </p>
                    <p style={{ fontWeight: 400, fontSize: 14, color: C.text, marginTop: '0.25rem' }}>
                      의 아들 {wedding.groomName}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: F.display, fontWeight: 400, fontSize: 11, letterSpacing: '0.2em', color: C.accent, marginBottom: '0.5rem' }}>BRIDE</p>
                    <p style={{ fontWeight: 300, fontSize: 13, color: C.textMuted }}>
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
        <section style={{ background: C.bgWarm, padding: '6rem 0' }}>
          <div className="max-w-md mx-auto">
            <motion.div {...sectionAnim} className="text-center" style={{ padding: '0 2rem 2rem' }}>
              <motion.p {...titleAnim} style={{ fontFamily: F.display, fontWeight: 300, fontStyle: 'italic', fontSize: 12, letterSpacing: '0.4em', color: C.accent }}>
                OUR STORY
              </motion.p>
            </motion.div>
            <motion.div {...delayAnim(0.15)}>
              <div className="overflow-hidden">
                {wedding.loveStoryVideo.includes("youtube") || wedding.loveStoryVideo.includes("youtu.be") ? (
                  <iframe
                    src={wedding.loveStoryVideo.includes("youtu.be") ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("youtu.be/")[1]?.split("?")[0]}` : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("watch?v=")[1]?.split("&")[0]}`}
                    className="w-full aspect-video"
                    allowFullScreen
                  />
                ) : (
                  <video src={wedding.loveStoryVideo} controls className="w-full aspect-video" />
                )}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {wedding.galleries && wedding.galleries.length > 0 && (
        <section id="gallery-section" style={{ background: C.bgWarm, padding: '6rem 0' }}>
          <motion.div {...sectionAnim} className="text-center" style={{ padding: '0 2rem 2rem' }}>
            <motion.p {...titleAnim} style={{ fontFamily: F.display, fontWeight: 300, fontStyle: 'italic', fontSize: 12, letterSpacing: '0.4em', color: C.accent }}>
              GALLERY
            </motion.p>
          </motion.div>
          <div className="max-w-md mx-auto">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {wedding.galleries.slice(0, 9).map((item, index) => (
                <motion.div
                  key={item.id}
                  {...delayAnim(index < 2 ? 0.15 : (index % 2 === 0 ? 0.15 : 0.3))}
                  onClick={() => setGalleryIndex(index)}
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

      <section id="venue-section" style={{ background: C.bgCard, padding: '7rem 2rem' }}>
        <div className="max-w-md mx-auto">
          <motion.div {...sectionAnim} className="text-center">
            <motion.p {...titleAnim} style={{ fontFamily: F.display, fontWeight: 300, fontStyle: 'italic', fontSize: 12, letterSpacing: '0.4em', color: C.accent, marginBottom: '2.5rem' }}>
              WHEN & WHERE
            </motion.p>
          </motion.div>

          <motion.div {...delayAnim(0.15)} className="text-center">
            <p style={{ fontFamily: F.display, fontWeight: 300, fontSize: 13, color: C.textLight, letterSpacing: '0.2em', marginBottom: '1.5rem' }}>
              {calendarData.year}. {['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][calendarData.month - 1]}
            </p>
            <div className="max-w-[320px] mx-auto">
              <div className="grid grid-cols-7">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-center" style={{ fontWeight: 200, fontSize: 11, color: i === 0 ? C.accent : C.textLight, padding: '8px 0' }}>{d}</div>
                ))}
                {calendarData.weeks.flat().map((day, i) => {
                  const isSunday = i % 7 === 0;
                  const isTarget = day === calendarData.targetDay;
                  return (
                    <div key={i} className="text-center relative" style={{ fontWeight: 300, fontSize: 13, color: !day ? 'transparent' : isSunday ? C.accent : C.text, padding: '10px 0' }}>
                      {isTarget && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full" style={{ border: `1px solid ${C.accent}` }} />
                      )}
                      <span className="relative z-10">{day || ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div {...delayAnim(0.3)} className="text-center">
            <div style={{ width: 48, height: 1, background: C.dividerLight, margin: '2.5rem auto' }} />
            <p style={{ fontWeight: 300, fontSize: 15, color: C.text }}>
              {formatDate(wedding.weddingDate, 'korean')} {formatTime(wedding.weddingTime)}
            </p>
            <p style={{ fontWeight: 400, fontSize: 16, color: C.text, marginTop: '1rem' }}>{wedding.venue}</p>
            {wedding.venueHall && <p style={{ fontWeight: 200, fontSize: 13, color: C.textMuted, marginTop: '0.25rem' }}>{wedding.venueHall}</p>}
            <p style={{ fontWeight: 200, fontSize: 12, color: C.textLight, marginTop: '0.5rem' }}>{wedding.venueAddress}</p>
            {wedding.venuePhone && (
              <a href={`tel:${wedding.venuePhone}`} className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: C.textMuted, marginTop: '0.5rem' }}>
                <Phone className="w-3 h-3" />{wedding.venuePhone}
              </a>
            )}

            {wedding.showDday && (
              <p style={{ fontFamily: F.display, fontWeight: 300, fontSize: 13, letterSpacing: '0.15em', color: C.accent, marginTop: '1rem' }}>
                {getDday(wedding.weddingDate)}
              </p>
            )}

            <div className="flex justify-center gap-3" style={{ marginTop: '2rem' }}>
              {wedding.venueNaverMap && (
                <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-full transition-colors duration-300 hover:border-[#D4A054]"
                  style={{ background: 'transparent', border: `1px solid ${C.dividerLight}`, padding: '12px 20px', fontFamily: F.body, fontWeight: 200, fontSize: 12, color: C.textMuted, minHeight: 48 }}>
                  네이버 지도
                </a>
              )}
              {wedding.venueKakaoMap && (
                <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-full transition-colors duration-300 hover:border-[#D4A054]"
                  style={{ background: 'transparent', border: `1px solid ${C.dividerLight}`, padding: '12px 20px', fontFamily: F.body, fontWeight: 200, fontSize: 12, color: C.textMuted, minHeight: 48 }}>
                  카카오맵
                </a>
              )}
              {wedding.venueTmap && (
                <a href={wedding.venueTmap} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-full transition-colors duration-300 hover:border-[#D4A054]"
                  style={{ background: 'transparent', border: `1px solid ${C.dividerLight}`, padding: '12px 20px', fontFamily: F.body, fontWeight: 200, fontSize: 12, color: C.textMuted, minHeight: 48 }}>
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
            <motion.p {...titleAnim} style={{ fontFamily: F.display, fontWeight: 300, fontStyle: 'italic', fontSize: 12, letterSpacing: '0.4em', color: C.accent, marginBottom: '2rem' }}>
              ATTENDANCE
            </motion.p>
            <div style={{ width: 1, height: 40, background: C.divider, margin: '0 auto 2.5rem' }} />
          </motion.div>
          <motion.div {...delayAnim(0.15)}>
            <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="luxury" />
          </motion.div>
        </div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section id="account-section" style={{ background: C.bgCard, padding: '6rem 2rem' }}>
          <div className="max-w-md mx-auto">
            <motion.div {...sectionAnim} className="text-center">
              <motion.p {...titleAnim} style={{ fontFamily: F.display, fontWeight: 300, fontStyle: 'italic', fontSize: 12, letterSpacing: '0.4em', color: C.accent, marginBottom: '2rem' }}>
                GIFT
              </motion.p>
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
                    style={{ border: `1px solid ${C.dividerLight}`, padding: '12px 24px', fontFamily: F.body, fontWeight: 200, fontSize: 12, color: C.textMuted, minHeight: 48 }}>
                    토스
                  </a>
                )}
                {wedding.kakaoPayLink && (
                  <a href={wedding.kakaoPayLink} target="_blank" className="flex items-center justify-center rounded-full transition-colors duration-300"
                    style={{ border: `1px solid ${C.dividerLight}`, padding: '12px 24px', fontFamily: F.body, fontWeight: 200, fontSize: 12, color: C.textMuted, minHeight: 48 }}>
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
            <motion.p {...titleAnim} style={{ fontFamily: F.display, fontWeight: 300, fontStyle: 'italic', fontSize: 12, letterSpacing: '0.4em', color: C.accent, marginBottom: '2rem' }}>
              GUESTBOOK
            </motion.p>
            <div style={{ width: 1, height: 40, background: C.divider, margin: '0 auto 2.5rem' }} />
          </motion.div>
          <motion.div {...delayAnim(0.15)}>
            <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="luxury" />
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

      <section style={{ background: C.bgCard, padding: '7rem 2rem' }}>
        <div className="max-w-md mx-auto text-center">
          <motion.div {...sectionAnim}>
            <motion.p {...titleAnim} style={{ fontFamily: F.display, fontWeight: 300, fontStyle: 'italic', fontSize: 12, letterSpacing: '0.4em', color: C.accent }}>
              SHARE
            </motion.p>
          </motion.div>

          <motion.div {...delayAnim(0.15)}>
            {wedding.closingMessage && (
              <p className="whitespace-pre-line" style={{ fontWeight: 200, fontSize: 13, color: C.textMuted, lineHeight: 2.2, marginTop: '2rem' }}>
                {wedding.closingMessage}
              </p>
            )}

            <div className="flex justify-center gap-4" style={{ marginTop: '2.5rem' }}>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center justify-center rounded-full transition-all duration-300 hover:border-[#D4A054]"
                style={{ width: 48, height: 48, border: `1px solid ${C.dividerLight}`, background: 'transparent' }}
              >
                <Share2 className="w-[18px] h-[18px]" style={{ color: C.textMuted }} />
              </button>
            </div>

            <div className="flex justify-center gap-4" style={{ marginTop: '2rem' }}>
              {wedding.groomPhone && (
                <a href={`tel:${wedding.groomPhone}`} className="text-center group">
                  <div className="flex items-center justify-center rounded-full transition-all duration-300 group-hover:border-[#D4A054]"
                    style={{ width: 48, height: 48, border: `1px solid ${C.dividerLight}`, marginBottom: '0.5rem' }}>
                    <Phone className="w-[18px] h-[18px]" style={{ color: C.textMuted }} />
                  </div>
                  <span style={{ fontWeight: 200, fontSize: 11, color: C.textLight }}>신랑</span>
                </a>
              )}
              {wedding.bridePhone && (
                <a href={`tel:${wedding.bridePhone}`} className="text-center group">
                  <div className="flex items-center justify-center rounded-full transition-all duration-300 group-hover:border-[#D4A054]"
                    style={{ width: 48, height: 48, border: `1px solid ${C.dividerLight}`, marginBottom: '0.5rem' }}>
                    <Phone className="w-[18px] h-[18px]" style={{ color: C.textMuted }} />
                  </div>
                  <span style={{ fontWeight: 200, fontSize: 11, color: C.textLight }}>신부</span>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <footer style={{ padding: '2rem', textAlign: 'center' }}>
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
            theme="CRUISE_SUNSET"
            usePhotoFilter={wedding.usePhotoFilter ?? true}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} variant="dark" weddingId={wedding.id} />
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
                  <p style={{ fontWeight: 200, fontSize: 12, color: C.textLight }}>{acc.bank} · {acc.holder}</p>
                  <div className="flex justify-between items-center" style={{ marginTop: '0.25rem' }}>
                    <span style={{ fontWeight: 300, fontSize: 13, color: C.text }}>{acc.account}</span>
                    <button
                      onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)}
                      className="flex items-center gap-1 rounded-full transition-all duration-300 hover:border-[#D4A054] hover:text-[#D4A054]"
                      style={{
                        background: 'transparent',
                        border: `1px solid ${copiedAccount === `${title}-${i}` ? C.accent : C.dividerLight}`,
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
