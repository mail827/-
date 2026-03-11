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
  @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap');
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
`;

const themeStyles = `
  .ew-bars{display:flex;gap:2px;align-items:center;height:16px}
  .ew-bar{display:block;width:2px;background:#aaa;border-radius:1px}
  .ew-playing .ew-bar{animation:ew-eq .6s ease infinite alternate}
  .ew-bar:nth-child(1){height:8px;animation-delay:0s}
  .ew-bar:nth-child(2){height:12px;animation-delay:.15s}
  .ew-bar:nth-child(3){height:6px;animation-delay:.3s}
  .ew-bar:nth-child(4){height:10px;animation-delay:.1s}
  .ew-paused .ew-bar{height:4px!important;animation:none}
  @keyframes ew-eq{to{height:4px}}
  .ew-bodoni{font-family:'Bodoni Moda',serif}
  .ew-pre{font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif}
`;

const sectionAnim = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
};

const delayAnim = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay },
});

const C = {
  bg: '#ffffff',
  bgDark: '#111111',
  text: '#111111',
  muted: '#888888',
  dim: '#bbbbbb',
  line: '#111111',
  lineLight: '#e0e0e0',
};

export default function EditorialWhite({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot }: ThemeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [openAccount, setOpenAccount] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [localGuestbooks, setLocalGuestbooks] = useState(guestbooks || []);

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
      window.Kakao.Share.sendDefault({ objectType: 'feed', content: { title, description: `${formatDate(wedding.weddingDate, 'korean')} ${formatTime(wedding.weddingTime)}`, imageUrl: wedding.heroMedia || '', link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }] });
    } else if (type === 'instagram') { await navigator.clipboard.writeText(url); alert('링크가 복사되었습니다.\n인스타그램 스토리에 공유해보세요!'); }
    else if (type === 'sms') { window.location.href = `sms:?&body=${encodeURIComponent(`${title}\n${formatDate(wedding.weddingDate, 'korean')}\n${url}`)}`; }
    setShowShareModal(false);
  };

  const calendarData = getCalendarData(wedding.weddingDate);
  const wd = new Date(wedding.weddingDate);
  const yr = wd.getFullYear();
  const mo = String(wd.getMonth() + 1).padStart(2, '0');
  const dy = String(wd.getDate()).padStart(2, '0');

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'Pretendard',sans-serif", overflowX: 'hidden' }}>
      <div className="max-w-[520px] mx-auto" style={{ color: C.text, fontWeight: 400 }}>
      <style>{fontStyles}{themeStyles}</style>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className={`fixed top-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center ${isPlaying ? 'ew-playing' : 'ew-paused'}`}
          style={{ background: 'rgba(255,255,255,0.9)', border: `1px solid ${C.lineLight}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="ew-bars"><span className="ew-bar" /><span className="ew-bar" /><span className="ew-bar" /><span className="ew-bar" /></div>
        </button>
      )}

      <div style={{ border: `6px solid ${C.line}`, minHeight: '100vh' }}>
        <header style={{ padding: '1.5rem 1.25rem', borderBottom: `2px solid ${C.line}` }}>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="ew-bodoni" style={{ fontStyle: 'italic', fontSize: 14, display: 'block', marginBottom: 10 }}>
            Vol. {yr}_{mo}{dy}
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="ew-pre"
            style={{ fontSize: 'clamp(32px,9vw,48px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.05em', textTransform: 'uppercase' }}>
            THE<br />MOMENT OF<br />UNION
          </motion.h1>
        </header>

        {(wedding.heroMedia || wedding.galleries?.[0]?.mediaUrl) && (
          <section style={{ position: 'relative' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }} style={{ display: 'flex' }}>
              <div style={{ flex: 1 }}>
                {wedding.heroMediaType === 'VIDEO' ? (
                  <video src={wedding.heroMedia ? heroUrl(wedding.heroMedia) : ''} autoPlay muted loop playsInline style={{ width: '100%', height: 380, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <img src={heroUrl(wedding.heroMedia || wedding.galleries?.[0]?.mediaUrl || '')} alt="" style={{ width: '100%', height: 380, objectFit: 'cover', display: 'block' }} />
                )}
              </div>
              <div className="ew-bodoni" style={{ width: 48, borderLeft: `1px solid ${C.lineLight}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '1rem 0' }}>
                <span style={{ writingMode: 'vertical-rl', fontWeight: 700, fontSize: 20, letterSpacing: '0.05em' }}>{yr}</span>
                <span style={{ writingMode: 'vertical-rl', fontStyle: 'italic', fontWeight: 400, fontSize: 18 }}>{mo}.{dy}</span>
              </div>
            </motion.div>
          </section>
        )}

        <section style={{ borderTop: `1px solid ${C.lineLight}`, padding: '2.5rem 1.25rem' }}>
          <motion.div {...sectionAnim} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <p className="ew-pre" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>Artist</p>
              <p className="ew-pre" style={{ fontSize: 16, fontWeight: 600 }}>{wedding.groomName} & {wedding.brideName}</p>
            </div>
            <div>
              <p className="ew-pre" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>Location</p>
              <p className="ew-pre" style={{ fontSize: 15, fontWeight: 500 }}>{wedding.venue}</p>
              {wedding.venueHall && <p className="ew-pre" style={{ fontSize: 13, fontWeight: 300, color: C.muted, marginTop: 2 }}>{wedding.venueHall}</p>}
            </div>
          </motion.div>
        </section>

        {wedding.greeting && (
          <section style={{ borderTop: `1px solid ${C.lineLight}`, padding: '2.5rem 1.25rem' }}>
            <motion.div {...sectionAnim}>
              <p className="ew-pre" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: 16 }}>Curator's Note</p>
              <p className="ew-bodoni" style={{ fontStyle: 'italic', fontWeight: 700, fontSize: 22, marginBottom: 12 }}>{wedding.greetingTitle || '"Our Story"'}</p>
              <p className="ew-pre whitespace-pre-line" style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.9, color: C.muted }}>{wedding.greeting}</p>
            </motion.div>
            {wedding.showParents && (
              <motion.div {...delayAnim(0.2)} style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <p className="ew-pre" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, marginBottom: 8 }}>GROOM</p>
                  <p className="ew-pre" style={{ fontWeight: 300, fontSize: 12, color: C.muted }}>
                    {wedding.groomFatherName}{wedding.groomFatherName && wedding.groomMotherName && ' · '}{wedding.groomMotherName}
                  </p>
                  <p className="ew-pre" style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>의 아들 {wedding.groomName}</p>
                </div>
                <div>
                  <p className="ew-pre" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, marginBottom: 8 }}>BRIDE</p>
                  <p className="ew-pre" style={{ fontWeight: 300, fontSize: 12, color: C.muted }}>
                    {wedding.brideFatherName}{wedding.brideFatherName && wedding.brideMotherName && ' · '}{wedding.brideMotherName}
                  </p>
                  <p className="ew-pre" style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>의 딸 {wedding.brideName}</p>
                </div>
              </motion.div>
            )}
          </section>
        )}

        {wedding.loveStoryVideo && (
          <section style={{ borderTop: `1px solid ${C.lineLight}`, padding: '2.5rem 1.25rem' }}>
            <motion.div {...sectionAnim}>
              <p className="ew-pre" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: 16 }}>Film</p>
              {wedding.loveStoryVideo.includes("youtube") || wedding.loveStoryVideo.includes("youtu.be") ? (
                <iframe src={wedding.loveStoryVideo.includes("youtu.be") ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("youtu.be/")[1]?.split("?")[0]}` : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("watch?v=")[1]?.split("&")[0]}`} className="w-full aspect-video" allowFullScreen />
              ) : ( <video src={wedding.loveStoryVideo} controls className="w-full aspect-video" /> )}
            </motion.div>
          </section>
        )}

        {wedding.galleries && wedding.galleries.length > 0 && (
          <section id="gallery-section" style={{ borderTop: `1px solid ${C.lineLight}`, padding: '2.5rem 0' }}>
            <motion.div {...sectionAnim} style={{ padding: '0 1.25rem', marginBottom: '1.5rem' }}>
              <p className="ew-pre" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase' }}>Exhibition</p>
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

        <section id="venue-section" style={{ borderTop: `1px solid ${C.lineLight}`, padding: '2.5rem 1.25rem' }}>
          <motion.div {...sectionAnim}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <p className="ew-pre" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, marginBottom: 10 }}>DATE</p>
                <p className="ew-bodoni" style={{ fontStyle: 'italic', fontSize: 20 }}>{formatDate(wedding.weddingDate, 'dots')}</p>
              </div>
              <div>
                <p className="ew-pre" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, marginBottom: 10 }}>TIME</p>
                <p className="ew-bodoni" style={{ fontStyle: 'italic', fontSize: 20 }}>{formatTime(wedding.weddingTime)}</p>
              </div>
            </div>
            <div>
              <p className="ew-pre" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, marginBottom: 10 }}>VENUE</p>
              <p className="ew-pre" style={{ fontWeight: 600, fontSize: 16 }}>{wedding.venue}</p>
              {wedding.venueHall && <p className="ew-pre" style={{ fontWeight: 300, fontSize: 13, color: C.muted, marginTop: 2 }}>{wedding.venueHall}</p>}
              <p className="ew-pre" style={{ fontWeight: 300, fontSize: 12, color: C.muted, marginTop: 4 }}>{wedding.venueAddress}</p>
              {wedding.venuePhone && ( <a href={`tel:${wedding.venuePhone}`} className="ew-pre inline-flex items-center gap-1.5" style={{ fontSize: 12, color: C.muted, marginTop: 4 }}><Phone className="w-3 h-3" />{wedding.venuePhone}</a> )}
            </div>
          </motion.div>
          <motion.div {...delayAnim(0.15)} className="text-center" style={{ marginTop: '2rem' }}>
            <p className="ew-bodoni" style={{ fontStyle: 'italic', fontSize: 13, color: C.muted, letterSpacing: '0.2em', marginBottom: '1.5rem' }}>
              {calendarData.year}. {['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][calendarData.month - 1]}
            </p>
            <div className="max-w-[300px] mx-auto">
              <div className="grid grid-cols-7">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} className="text-center ew-pre" style={{ fontWeight: 600, fontSize: 10, color: i === 0 ? C.text : C.dim, padding: '6px 0' }}>{d}</div>
                ))}
                {calendarData.weeks.flat().map((day, i) => {
                  const isS = i % 7 === 0;
                  const isT = day === calendarData.targetDay;
                  return (
                    <div key={i} className="text-center relative ew-pre" style={{ fontWeight: 400, fontSize: 13, color: !day ? 'transparent' : isS ? C.text : C.muted, padding: '8px 0' }}>
                      {isT && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full" style={{ border: `2px solid ${C.text}` }} />}
                      <span className="relative z-10">{day || ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {wedding.showDday && <p className="ew-bodoni" style={{ fontStyle: 'italic', fontSize: 14, color: C.muted, marginTop: '1.25rem' }}>{getDday(wedding.weddingDate)}</p>}
          </motion.div>
          <motion.div {...delayAnim(0.3)}>
            <div className="flex justify-center gap-3" style={{ marginTop: '2rem' }}>
              {wedding.venueNaverMap && ( <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center transition-colors duration-300 hover:bg-black hover:text-white ew-pre" style={{ border: `1px solid ${C.text}`, padding: '12px 20px', fontWeight: 500, fontSize: 11, minHeight: 48 }}>네이버 지도</a> )}
              {wedding.venueKakaoMap && ( <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center transition-colors duration-300 hover:bg-black hover:text-white ew-pre" style={{ border: `1px solid ${C.text}`, padding: '12px 20px', fontWeight: 500, fontSize: 11, minHeight: 48 }}>카카오맵</a> )}
              {wedding.venueTmap && ( <a href={wedding.venueTmap} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center transition-colors duration-300 hover:bg-black hover:text-white ew-pre" style={{ border: `1px solid ${C.text}`, padding: '12px 20px', fontWeight: 500, fontSize: 11, minHeight: 48 }}>티맵</a> )}
            </div>
          </motion.div>
          <motion.div {...delayAnim(0.4)} style={{ marginTop: '2rem' }}>
            <KakaoMap address={wedding.venueAddress} venue={wedding.venue} latitude={wedding.venueLatitude} longitude={wedding.venueLongitude} />
          </motion.div>
        </section>

        <section id="rsvp-section" style={{ borderTop: `1px solid ${C.lineLight}`, padding: '2.5rem 1.25rem' }}>
          <motion.div {...sectionAnim}>
            <p className="ew-pre" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: '2rem' }}>Attendance</p>
          </motion.div>
          <motion.div {...delayAnim(0.15)}>
            <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="editorial" />
          </motion.div>
        </section>

        {(wedding.groomAccount || wedding.brideAccount) && (
          <section id="account-section" style={{ borderTop: `1px solid ${C.lineLight}`, padding: '2.5rem 1.25rem' }}>
            <motion.div {...sectionAnim}>
              <p className="ew-pre" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: '2rem' }}>Gift</p>
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
              <div className="flex justify-center gap-3" style={{ marginTop: '2rem' }}>
                {wedding.tossLink && ( <a href={wedding.tossLink} target="_blank" className="flex items-center justify-center transition-colors duration-300 hover:bg-black hover:text-white ew-pre" style={{ border: `1px solid ${C.text}`, padding: '12px 24px', fontWeight: 500, fontSize: 11, minHeight: 48 }}>토스</a> )}
                {wedding.kakaoPayLink && ( <a href={wedding.kakaoPayLink} target="_blank" className="flex items-center justify-center transition-colors duration-300 hover:bg-black hover:text-white ew-pre" style={{ border: `1px solid ${C.text}`, padding: '12px 24px', fontWeight: 500, fontSize: 11, minHeight: 48 }}>카카오페이</a> )}
              </div>
            )}
          </section>
        )}

        <section id="guestbook-section" style={{ borderTop: `1px solid ${C.lineLight}`, padding: '2.5rem 1.25rem' }}>
          <motion.div {...sectionAnim}>
            <p className="ew-pre" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: '2rem' }}>Guestbook</p>
          </motion.div>
          <motion.div {...delayAnim(0.15)}>
            <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="editorial" />
            <GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="classic" />
          </motion.div>
        </section>

        {guestPhotoSlot}

        <section style={{ borderTop: `1px solid ${C.lineLight}`, padding: '2.5rem 1.25rem' }}>
          <motion.div {...sectionAnim} className="text-center">
            {wedding.closingMessage && <p className="ew-pre whitespace-pre-line" style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.9, color: C.muted, marginBottom: '2rem' }}>{wedding.closingMessage}</p>}
            <div className="flex justify-center gap-4">
              {wedding.groomPhone && ( <a href={`tel:${wedding.groomPhone}`} className="text-center group">
                <div className="flex items-center justify-center transition-all duration-300 group-hover:bg-black group-hover:text-white" style={{ width: 48, height: 48, border: `1px solid ${C.text}`, marginBottom: '0.5rem' }}><Phone className="w-4 h-4" /></div>
                <span className="ew-pre" style={{ fontWeight: 500, fontSize: 10, color: C.muted }}>신랑</span></a> )}
              {wedding.bridePhone && ( <a href={`tel:${wedding.bridePhone}`} className="text-center group">
                <div className="flex items-center justify-center transition-all duration-300 group-hover:bg-black group-hover:text-white" style={{ width: 48, height: 48, border: `1px solid ${C.text}`, marginBottom: '0.5rem' }}><Phone className="w-4 h-4" /></div>
                <span className="ew-pre" style={{ fontWeight: 500, fontSize: 10, color: C.muted }}>신부</span></a> )}
            </div>
          </motion.div>
        </section>

        <footer onClick={() => setShowShareModal(true)} style={{ background: C.bgDark, color: C.bg, padding: '1.5rem', textAlign: 'center', cursor: 'pointer' }} className="hover:opacity-80 transition-opacity">
          <p className="ew-pre" style={{ fontSize: 10, letterSpacing: '0.4em', fontWeight: 300 }}>ADMIT ONE : SHARE THIS INVITATION</p>
        </footer>
      </div>

      <div style={{ padding: '1.25rem', textAlign: 'center' }}>
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity ew-pre" style={{ fontWeight: 300, fontSize: 10, color: C.dim, textDecoration: 'none' }}>Made by 청첩장 작업실 ›</a>
      </div>

      <AnimatePresence>
        {galleryIndex !== null && wedding.galleries && ( <GalleryModal galleries={wedding.galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="EDITORIAL_WHITE" usePhotoFilter={wedding.usePhotoFilter ?? true} /> )}
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
      <button onClick={onToggle} className="w-full flex justify-between items-center ew-pre" style={{ padding: '1.25rem 0', border: 'none', borderBottom: `1px solid ${C.lineLight}`, background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: C.text }}>
        {title}<ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ color: C.muted }} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div>{accounts.map((acc, i) => (
              <div key={i} style={{ padding: '1.25rem 0', borderBottom: `1px solid ${C.lineLight}` }}>
                <p className="ew-pre" style={{ fontWeight: 300, fontSize: 12, color: C.muted }}>{acc.bank} · {acc.holder}</p>
                <div className="flex justify-between items-center" style={{ marginTop: '0.25rem' }}>
                  <span className="ew-pre" style={{ fontWeight: 500, fontSize: 13 }}>{acc.account}</span>
                  <button onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)} className="flex items-center gap-1 transition-all duration-300 hover:bg-black hover:text-white ew-pre"
                    style={{ background: 'transparent', border: `1px solid ${copiedAccount === `${title}-${i}` ? C.text : C.lineLight}`, padding: '6px 14px', fontWeight: 500, fontSize: 11, color: copiedAccount === `${title}-${i}` ? C.text : C.muted, cursor: 'pointer' }}>
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
