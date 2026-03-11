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
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
`;

const themeStyles = `
  .ed-bars{display:flex;gap:2px;align-items:center;height:16px}
  .ed-bar{display:block;width:2px;background:#888;border-radius:1px}
  .ed-playing .ed-bar{animation:ed-eq .6s ease infinite alternate}
  .ed-bar:nth-child(1){height:8px;animation-delay:0s}
  .ed-bar:nth-child(2){height:12px;animation-delay:.15s}
  .ed-bar:nth-child(3){height:6px;animation-delay:.3s}
  .ed-bar:nth-child(4){height:10px;animation-delay:.1s}
  .ed-paused .ed-bar{height:4px!important;animation:none}
  @keyframes ed-eq{to{height:4px}}
  .ed-syne{font-family:'Syne',sans-serif}
  .ed-serif{font-family:'Cormorant Garamond',serif}
  .ed-pre{font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif}
  .ed-vertical{writing-mode:vertical-rl;font-family:'Pretendard',sans-serif;font-weight:600;letter-spacing:0.5em;text-transform:uppercase}
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
  bg: '#0e0e0e',
  bgCard: '#1a1a1a',
  bgLight: '#151515',
  point: '#f0f0f0',
  muted: '#888888',
  dim: '#555555',
  border: '#333333',
  borderLight: '#444444',
};

export default function Editorial({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot }: ThemeProps) {
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
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'Pretendard', sans-serif", overflowX: 'hidden' }}>
      <div className="max-w-[520px] mx-auto" style={{ color: C.point, fontWeight: 300, wordBreak: 'keep-all' }}>
      <style>{fontStyles}{themeStyles}</style>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}

      {wedding.bgMusicUrl && (
        <button
          onClick={toggleMusic}
          className={`fixed top-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm ${isPlaying ? 'ed-playing' : 'ed-paused'}`}
          style={{ background: 'rgba(14,14,14,0.85)', border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
        >
          <div className="ed-bars">
            <span className="ed-bar" /><span className="ed-bar" /><span className="ed-bar" /><span className="ed-bar" />
          </div>
        </button>
      )}

      <section className="relative flex flex-col justify-center" style={{ height: heroHeight, overflow: 'hidden', padding: '0 1.25rem' }}>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="ed-syne"
          style={{ fontSize: 'clamp(80px, 22vw, 160px)', fontWeight: 800, lineHeight: 0.85, letterSpacing: '-0.08em', textTransform: 'uppercase', marginLeft: -4 }}
        >
          MAR<br />RIED
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="ed-serif self-end"
          style={{ fontStyle: 'italic', fontSize: 14, marginRight: 20, marginTop: 12, opacity: 0.7 }}
        >
          A new chapter by {wedding.groomName} & {wedding.brideName}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute"
          style={{ bottom: '5vh', left: '50%', transform: 'translateX(-50%)' }}
        >
          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: C.point }} />
        </motion.div>
      </section>

      {(wedding.heroMedia || wedding.galleries?.[0]?.mediaUrl) && (
        <section style={{ padding: '0' }}>
          <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            {wedding.heroMediaType === 'VIDEO' ? (
              <video src={wedding.heroMedia ? heroUrl(wedding.heroMedia) : ''} autoPlay muted loop playsInline className="w-full" style={{ display: 'block', maxHeight: '70vh', objectFit: 'cover' }} />
            ) : (
              <img src={heroUrl(wedding.heroMedia || wedding.galleries?.[0]?.mediaUrl || '')} alt="" className="w-full" style={{ display: 'block', maxHeight: '70vh', objectFit: 'cover' }} />
            )}
          </motion.div>
        </section>
      )}

      <section style={{ padding: '6rem 1.5rem' }}>
        <div className="max-w-md mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem' }}>
          <div>
            <motion.div {...sectionAnim}>
              <h2 className="ed-syne" style={{ fontSize: 'clamp(36px, 10vw, 52px)', fontWeight: 800, lineHeight: 1, textTransform: 'uppercase', margin: 0 }}>
                THE<br />EDITORIAL
              </h2>
            </motion.div>
            {wedding.greeting && (
              <motion.div {...delayAnim(0.2)}>
                <p className="ed-serif whitespace-pre-line" style={{ fontStyle: 'italic', fontSize: 15, lineHeight: 1.8, marginTop: '2rem', color: C.muted }}>
                  {wedding.greeting}
                </p>
              </motion.div>
            )}
          </div>
          <motion.div
            {...delayAnim(0.3)}
            className="ed-vertical"
            style={{ fontSize: 11, borderLeft: `1px solid ${C.point}`, paddingLeft: 12, color: C.muted }}
          >
            {formatDate(wedding.weddingDate, 'dots').replace(/\./g, ' / ')} ISSUE
          </motion.div>
        </div>
      </section>

      {wedding.showParents && (
        <section style={{ background: C.bgCard, padding: '5rem 1.5rem' }}>
          <div className="max-w-md mx-auto">
            <motion.div {...sectionAnim} className="flex justify-between" style={{ gap: '3rem' }}>
              <div>
                <p className="ed-pre" style={{ fontSize: 9, letterSpacing: '0.3em', color: C.muted, marginBottom: '0.75rem' }}>GROOM</p>
                <p className="ed-pre" style={{ fontWeight: 300, fontSize: 13, color: C.muted }}>
                  {wedding.groomFatherName && <span>{wedding.groomFatherName}</span>}
                  {wedding.groomFatherName && wedding.groomMotherName && <span> · </span>}
                  {wedding.groomMotherName && <span>{wedding.groomMotherName}</span>}
                </p>
                <p className="ed-pre" style={{ fontWeight: 500, fontSize: 15, color: C.point, marginTop: '0.25rem' }}>
                  의 아들 {wedding.groomName}
                </p>
              </div>
              <div className="text-right">
                <p className="ed-pre" style={{ fontSize: 9, letterSpacing: '0.3em', color: C.muted, marginBottom: '0.75rem' }}>BRIDE</p>
                <p className="ed-pre" style={{ fontWeight: 300, fontSize: 13, color: C.muted }}>
                  {wedding.brideFatherName && <span>{wedding.brideFatherName}</span>}
                  {wedding.brideFatherName && wedding.brideMotherName && <span> · </span>}
                  {wedding.brideMotherName && <span>{wedding.brideMotherName}</span>}
                </p>
                <p className="ed-pre" style={{ fontWeight: 500, fontSize: 15, color: C.point, marginTop: '0.25rem' }}>
                  의 딸 {wedding.brideName}
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {wedding.loveStoryVideo && (
        <section style={{ background: C.bg, padding: '5rem 0' }}>
          <div className="max-w-md mx-auto">
            <motion.div {...sectionAnim}>
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

      {wedding.galleries && wedding.galleries.length > 0 && (
        <section id="gallery-section" style={{ background: C.bg, padding: '5rem 0' }}>
          <motion.div {...sectionAnim} style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
            <p className="ed-syne" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: C.muted }}>GALLERY</p>
          </motion.div>
          <div className="max-w-md mx-auto">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {wedding.galleries.slice(0, 9).map((item, index) => (
                <motion.div
                  key={item.id}
                  {...delayAnim(index % 2 === 0 ? 0.15 : 0.3)}
                  onClick={() => setGalleryIndex(index)}
                  className={`overflow-hidden cursor-pointer ${index === 0 ? 'col-span-2' : ''}`}
                  style={{ aspectRatio: index === 0 ? '16/9' : '1/1' }}
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

      <section id="venue-section" style={{ background: C.bgCard, padding: '6rem 1.5rem' }}>
        <div className="max-w-md mx-auto">
          <motion.div {...sectionAnim}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'start' }}>
              <div>
                <p className="ed-pre" style={{ fontSize: 9, letterSpacing: '0.3em', color: C.muted, marginBottom: '1rem' }}>LOCATION</p>
                <p className="ed-serif" style={{ fontStyle: 'italic', fontSize: 22, color: C.point }}>{wedding.venue}</p>
                {wedding.venueHall && <p className="ed-pre" style={{ fontWeight: 300, fontSize: 13, color: C.muted, marginTop: '0.25rem' }}>{wedding.venueHall}</p>}
                <p className="ed-pre" style={{ fontWeight: 300, fontSize: 12, color: C.dim, marginTop: '0.5rem' }}>{wedding.venueAddress}</p>
                {wedding.venuePhone && (
                  <a href={`tel:${wedding.venuePhone}`} className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: C.muted, marginTop: '0.5rem' }}>
                    <Phone className="w-3 h-3" />{wedding.venuePhone}
                  </a>
                )}

                <div style={{ marginTop: '2rem' }}>
                  <p className="ed-pre" style={{ fontSize: 9, letterSpacing: '0.3em', color: C.muted, marginBottom: '0.75rem' }}>TIME</p>
                  <p className="ed-serif" style={{ fontStyle: 'italic', fontSize: 20, color: C.point }}>
                    {formatDate(wedding.weddingDate, 'dots')} / {formatTime(wedding.weddingTime)}
                  </p>
                </div>
              </div>

              <div className="ed-vertical" style={{ fontSize: 10, borderLeft: `1px solid ${C.point}`, paddingLeft: 10, color: C.dim, minHeight: 120 }}>
                {calendarData.year} ISSUE
              </div>
            </div>
          </motion.div>

          <motion.div {...delayAnim(0.2)} className="text-center" style={{ marginTop: '3rem' }}>
            <div className="max-w-[320px] mx-auto">
              <div className="grid grid-cols-7">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-center ed-pre" style={{ fontWeight: 500, fontSize: 10, color: i === 0 ? C.point : C.dim, padding: '8px 0' }}>{d}</div>
                ))}
                {calendarData.weeks.flat().map((day, i) => {
                  const isSunday = i % 7 === 0;
                  const isTarget = day === calendarData.targetDay;
                  return (
                    <div key={i} className="text-center relative ed-pre" style={{ fontWeight: 400, fontSize: 13, color: !day ? 'transparent' : isSunday ? C.point : C.muted, padding: '10px 0' }}>
                      {isTarget && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full" style={{ border: `1px solid ${C.point}` }} />
                      )}
                      <span className="relative z-10">{day || ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {wedding.showDday && (
              <p className="ed-syne" style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', color: C.muted, marginTop: '1.5rem' }}>
                {getDday(wedding.weddingDate)}
              </p>
            )}
          </motion.div>

          <motion.div {...delayAnim(0.35)}>
            <div className="flex justify-center gap-3" style={{ marginTop: '2.5rem' }}>
              {wedding.venueNaverMap && (
                <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-full transition-colors duration-300 hover:border-white/60 ed-pre"
                  style={{ background: 'transparent', border: `1px solid ${C.border}`, padding: '12px 20px', fontWeight: 400, fontSize: 12, color: C.muted, minHeight: 48 }}>
                  네이버 지도
                </a>
              )}
              {wedding.venueKakaoMap && (
                <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-full transition-colors duration-300 hover:border-white/60 ed-pre"
                  style={{ background: 'transparent', border: `1px solid ${C.border}`, padding: '12px 20px', fontWeight: 400, fontSize: 12, color: C.muted, minHeight: 48 }}>
                  카카오맵
                </a>
              )}
              {wedding.venueTmap && (
                <a href={wedding.venueTmap} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-full transition-colors duration-300 hover:border-white/60 ed-pre"
                  style={{ background: 'transparent', border: `1px solid ${C.border}`, padding: '12px 20px', fontWeight: 400, fontSize: 12, color: C.muted, minHeight: 48 }}>
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

      <section id="rsvp-section" style={{ background: C.bg, padding: '6rem 1.5rem' }}>
        <div className="max-w-md mx-auto">
          <motion.div {...sectionAnim}>
            <p className="ed-syne" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, marginBottom: '2.5rem' }}>ATTENDANCE</p>
          </motion.div>
          <motion.div {...delayAnim(0.15)}>
            <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="pearl" />
          </motion.div>
        </div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section id="account-section" style={{ background: C.bgCard, padding: '6rem 1.5rem' }}>
          <div className="max-w-md mx-auto">
            <motion.div {...sectionAnim}>
              <p className="ed-syne" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, marginBottom: '2.5rem' }}>GIFT</p>
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
                  <a href={wedding.tossLink} target="_blank" className="flex items-center justify-center rounded-full transition-colors duration-300 ed-pre"
                    style={{ border: `1px solid ${C.border}`, padding: '12px 24px', fontWeight: 400, fontSize: 12, color: C.muted, minHeight: 48 }}>
                    토스
                  </a>
                )}
                {wedding.kakaoPayLink && (
                  <a href={wedding.kakaoPayLink} target="_blank" className="flex items-center justify-center rounded-full transition-colors duration-300 ed-pre"
                    style={{ border: `1px solid ${C.border}`, padding: '12px 24px', fontWeight: 400, fontSize: 12, color: C.muted, minHeight: 48 }}>
                    카카오페이
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <section id="guestbook-section" style={{ background: C.bg, padding: '6rem 1.5rem' }}>
        <div className="max-w-md mx-auto">
          <motion.div {...sectionAnim}>
            <p className="ed-syne" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, marginBottom: '2.5rem' }}>GUESTBOOK</p>
          </motion.div>
          <motion.div {...delayAnim(0.15)}>
            <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="pearl" />
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

      <section style={{ background: C.bgCard, padding: '5rem 1.5rem' }}>
        <div className="max-w-md mx-auto text-center">
          <motion.div {...sectionAnim}>
            {wedding.closingMessage && (
              <p className="ed-serif whitespace-pre-line" style={{ fontStyle: 'italic', fontSize: 15, color: C.muted, lineHeight: 1.8 }}>
                {wedding.closingMessage}
              </p>
            )}

            <div className="flex justify-center gap-4" style={{ marginTop: '3rem' }}>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center justify-center rounded-full transition-all duration-300 hover:bg-white/10"
                style={{ background: C.point, color: C.bg, padding: '14px 28px', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 11, borderRadius: 50, border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}
              >
                SHARE
              </button>
            </div>

            <div className="flex justify-center gap-4" style={{ marginTop: '2.5rem' }}>
              {wedding.groomPhone && (
                <a href={`tel:${wedding.groomPhone}`} className="text-center group">
                  <div className="flex items-center justify-center rounded-full transition-all duration-300 group-hover:border-white/60"
                    style={{ width: 48, height: 48, border: `1px solid ${C.border}`, marginBottom: '0.5rem' }}>
                    <Phone className="w-[18px] h-[18px]" style={{ color: C.muted }} />
                  </div>
                  <span className="ed-pre" style={{ fontWeight: 400, fontSize: 11, color: C.dim }}>신랑</span>
                </a>
              )}
              {wedding.bridePhone && (
                <a href={`tel:${wedding.bridePhone}`} className="text-center group">
                  <div className="flex items-center justify-center rounded-full transition-all duration-300 group-hover:border-white/60"
                    style={{ width: 48, height: 48, border: `1px solid ${C.border}`, marginBottom: '0.5rem' }}>
                    <Phone className="w-[18px] h-[18px]" style={{ color: C.muted }} />
                  </div>
                  <span className="ed-pre" style={{ fontWeight: 400, fontSize: 11, color: C.dim }}>신부</span>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <footer style={{ padding: '2rem', textAlign: 'center', background: C.bg }}>
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity ed-pre"
          style={{ fontWeight: 300, fontSize: 11, color: C.dim, textDecoration: 'none', letterSpacing: '0.05em' }}>
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
            theme="EDITORIAL"
            usePhotoFilter={wedding.usePhotoFilter ?? true}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} variant="dark" weddingId={wedding.id} />
      </AnimatePresence>
    </div>
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
        className="w-full flex justify-between items-center ed-pre"
        style={{ padding: '1.25rem 0', border: 'none', borderBottom: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontWeight: 500, fontSize: 14, color: C.point }}
      >
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ color: C.muted }} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div>
              {accounts.map((acc, i) => (
                <div key={i} style={{ padding: '1.25rem 0', borderBottom: `1px solid ${C.border}` }}>
                  <p className="ed-pre" style={{ fontWeight: 300, fontSize: 12, color: C.dim }}>{acc.bank} · {acc.holder}</p>
                  <div className="flex justify-between items-center" style={{ marginTop: '0.25rem' }}>
                    <span className="ed-pre" style={{ fontWeight: 400, fontSize: 13, color: C.point }}>{acc.account}</span>
                    <button
                      onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)}
                      className="flex items-center gap-1 rounded-full transition-all duration-300 hover:border-white/60 ed-pre"
                      style={{
                        background: 'transparent',
                        border: `1px solid ${copiedAccount === `${title}-${i}` ? C.point : C.border}`,
                        borderRadius: 9999,
                        padding: '6px 14px',
                        fontWeight: 400,
                        fontSize: 11,
                        color: copiedAccount === `${title}-${i}` ? C.point : C.muted,
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
