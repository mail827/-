import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, getDday, formatDateLocale, formatTimeLocale, getCalendarData, type ThemeProps } from './shared';

export default function LunaHalfmoon({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot , locale}: ThemeProps) {
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
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'MapoDacapo';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/MapoDacapoA.woff') format('woff');
        font-weight: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (wedding.bgMusicAutoPlay && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [wedding.bgMusicAutoPlay]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
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
      window.Kakao.Share.sendDefault({ objectType: 'feed', content: { title, description: formatDateLocale(wedding.weddingDate, 'full', locale), imageUrl: wedding.ogCoverType === 'envelope' ? ({"black_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/7_errq8w.png", "white_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "navy_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/1_zdaupp.png", "black_silver": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "olive_ribbon_a": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/3_wdfeio.png", "olive_ribbon_b": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png", "pink_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/5_pzmfwy.png", "white_bow": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/11_o3gnaj.png", "white_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "black_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "pink_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551604/6_akrfek.png", "olive_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png"}[wedding.envelopeStyle || 'black_ribbon'] || wedding.heroMedia || '') : (wedding.heroMedia || ''), link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }] });
    } else if (type === 'instagram') {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.');
    } else if (type === 'sms') {
      window.location.href = `sms:?&body=${encodeURIComponent(`${title}\n${url}`)}`;
    }
    setShowShareModal(false);
  };

  const calendarData = getCalendarData(wedding.weddingDate);
  const galleries = wedding.galleries || [];
  const dacapoFont = { fontFamily: "'MapoDacapo', serif" };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.6, ease: [0.25, 0.1, 0.25, 1] } }
  };

  const softFade = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 2, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-screen relative" style={{ background: '#FFFFFF' }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 120% 80% at 50% 0%, rgba(200, 215, 225, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse 100% 60% at 50% 100%, rgba(200, 215, 225, 0.06) 0%, transparent 40%)
        `
      }} />
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
      }} />

      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500" style={{ background: 'rgba(255, 255, 255, 0.85)', boxShadow: '0 2px 20px rgba(180, 195, 205, 0.2)', border: '1px solid rgba(200, 215, 225, 0.3)' }}>
          {isPlaying ? <Volume2 className="w-4 h-4" style={{ color: '#7A8A94' }} /> : <VolumeX className="w-4 h-4" style={{ color: '#A8B8C4' }} />}
        </button>
      )}

      <section className="min-h-screen flex flex-col justify-center items-center px-10 py-32 relative">
        <motion.div initial="hidden" animate="visible" variants={softFade} className="text-center w-full max-w-sm">
          {wedding.heroMedia && (
            <div className="relative mb-20">
              <div className="relative overflow-hidden">
                <div className="aspect-[3/4] overflow-hidden">
                  {wedding.heroMediaType === 'VIDEO' ? (
                    <video src={heroUrl(wedding.heroMedia)} autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: 'saturate(0.8) brightness(1.03) contrast(0.98)' }} />
                  ) : (
                    <img src={heroUrl(wedding.heroMedia)} alt="" className="w-full h-full object-cover" style={{ filter: 'saturate(0.8) brightness(1.03) contrast(0.98)' }} />
                  )}
                </div>
              </div>
            </div>
          )}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 2 }}>
            <div className="flex items-center justify-center gap-10 mb-8">
              <span className="text-[1.6rem] tracking-widest" style={{ ...dacapoFont, color: '#5A6A74', fontWeight: 300 }}>{wedding.groomName}</span>
              <span className="text-[0.9rem]" style={{ color: '#C8D7E0' }}>&</span>
              <span className="text-[1.6rem] tracking-widest" style={{ ...dacapoFont, color: '#5A6A74', fontWeight: 300 }}>{wedding.brideName}</span>
            </div>
            <div className="w-12 h-px mx-auto mb-8" style={{ background: 'linear-gradient(90deg, transparent, #D0DFE8, transparent)' }} />
            <p className="text-[0.75rem] tracking-[0.4em]" style={{ ...dacapoFont, color: '#9AABB8' }}>{formatDateLocale(wedding.weddingDate, 'dots', locale)}</p>
            {wedding.showDday && <p className="mt-6 text-[0.65rem] tracking-[0.3em]" style={{ ...dacapoFont, color: '#B8C8D4' }}>{getDday(wedding.weddingDate)}</p>}
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 1.5 }} className="absolute bottom-16">
          <ChevronDown className="w-4 h-4 animate-bounce" style={{ color: '#D0DFE8', animationDuration: '2.5s' }} />
        </motion.div>
      </section>

      {wedding.greeting && (
        <section className="py-32 px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="max-w-sm mx-auto text-center">
            {wedding.greetingTitle && <p className="text-[1rem] mb-12 tracking-wide" style={{ ...dacapoFont, color: '#5A6A74', lineHeight: 2 }}>{wedding.greetingTitle}</p>}
            <p className="text-[0.85rem] leading-[2.8] whitespace-pre-line" style={{ ...dacapoFont, color: '#6A7A84' }}>{wedding.greeting}</p>
            {wedding.showParents && (
              <div className="mt-20 pt-12" style={{ borderTop: '1px solid rgba(200, 215, 225, 0.4)' }}>
                <div className="space-y-5" style={dacapoFont}>
                  <p className="text-[0.75rem]" style={{ color: '#7A8A94' }}>
                    <span style={{ color: '#9AABB8' }}>{wedding.groomFatherName} · {wedding.groomMotherName}</span>
                    <span className="mx-4" style={{ color: '#D0DFE8' }}>{locale === 'en' ? 'Son of' : '의 아들'}</span>
                    <span style={{ color: '#5A6A74' }}>{wedding.groomName}</span>
                  </p>
                  <p className="text-[0.75rem]" style={{ color: '#7A8A94' }}>
                    <span style={{ color: '#9AABB8' }}>{wedding.brideFatherName} · {wedding.brideMotherName}</span>
                    <span className="mx-4" style={{ color: '#D0DFE8' }}>{locale === 'en' ? 'Daughter of' : '의 딸'}</span>
                    <span style={{ color: '#5A6A74' }}>{wedding.brideName}</span>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {wedding.loveStoryVideo && (
        <section className="py-24 px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-sm mx-auto text-center">
            <div className="overflow-hidden" style={{ borderRadius: 8 }}>
              {wedding.loveStoryVideo.includes("youtube") || wedding.loveStoryVideo.includes("youtu.be") ? (
                <iframe src={wedding.loveStoryVideo.includes("youtu.be") ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("youtu.be/")[1]?.split("?")[0]}` : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("watch?v=")[1]?.split("&")[0]}`} className="w-full aspect-video" allowFullScreen />
              ) : (
                <video src={wedding.loveStoryVideo} controls playsInline className="w-full aspect-video" style={{ background: '#000' }} />
              )}
            </div>
          </motion.div>
        </section>
      )}

      {galleries.length > 0 && (
        <section id="gallery-section" className="py-32 px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <p className="text-center text-[0.85rem] mb-20 tracking-[0.4em]" style={{ ...dacapoFont, color: '#9AABB8' }}>GALLERY</p>
            <div className="max-w-sm mx-auto space-y-8">
              {galleries.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.2, duration: 1.2 }} onClick={() => setGalleryIndex(i)} className="cursor-pointer">
                  <div className="overflow-hidden aspect-[4/5]">
                    {item.mediaType === 'VIDEO' ? (
                      <video src={item.mediaUrl} className="w-full h-full object-cover transition-all duration-1000 hover:scale-[1.02]" muted style={{ filter: 'saturate(0.8) brightness(1.03)' }} />
                    ) : (
                      <img src={galleryThumbUrl(item.mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover transition-all duration-1000 hover:scale-[1.02]" style={{ filter: 'saturate(0.8) brightness(1.03)' }} />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      <section className="py-32 px-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-xs mx-auto">
          <p className="text-center text-[0.8rem] mb-12 tracking-[0.3em]" style={{ ...dacapoFont, color: '#9AABB8' }}>{calendarData.year}. {String(calendarData.month).padStart(2, '0')}</p>
          <div className="grid grid-cols-7 text-center text-[0.6rem] mb-6" style={dacapoFont}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} className="py-3 tracking-[0.2em]" style={{ color: i === 0 ? '#B8C8D4' : '#9AABB8' }}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 text-center text-[0.75rem]" style={dacapoFont}>
            {calendarData.weeks.flat().map((day, i) => (
              <span key={i} className="py-3 flex items-center justify-center" style={{
                color: day === calendarData.targetDay ? '#FFFFFF' : day ? '#6A7A84' : 'transparent',
                background: day === calendarData.targetDay ? 'linear-gradient(135deg, #A8C0CC 0%, #8AAAB8 100%)' : 'transparent',
                borderRadius: '50%',
                width: day === calendarData.targetDay ? '2rem' : 'auto',
                height: day === calendarData.targetDay ? '2rem' : 'auto',
                margin: day === calendarData.targetDay ? '0 auto' : '0'
              }}>{day || ''}</span>
            ))}
          </div>
          <div className="mt-14 text-center">
            <p className="text-[0.8rem]" style={{ ...dacapoFont, color: '#5A6A74' }}>{formatDateLocale(wedding.weddingDate, 'full', locale)}</p>
            {wedding.weddingTime && formatTimeLocale(wedding.weddingTime, locale) && (
  <p className="text-[0.7rem] mt-3" style={{ ...dacapoFont, color: '#9AABB8' }}>
    {formatTimeLocale(wedding.weddingTime, locale)}
  </p>
)}
          </div>
        </motion.div>
      </section>

      <section id="venue-section" className="py-32 px-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-sm mx-auto text-center">
          <p className="text-[0.85rem] mb-16 tracking-[0.4em]" style={{ ...dacapoFont, color: '#9AABB8' }}>LOCATION</p>
          <div className="mb-10">
            <p className="text-[0.9rem]" style={{ ...dacapoFont, color: '#5A6A74' }}>{wedding.venue}</p>
            {wedding.venueHall && <p className="text-[0.8rem] mt-3" style={{ ...dacapoFont, color: '#8A9AA4' }}>{wedding.venueHall}</p>}
            {wedding.venueAddress && <p className="text-[0.7rem] mt-5" style={{ ...dacapoFont, color: '#B8C8D4' }}>{wedding.venueAddress}</p>}
          </div>
          {wedding.venueAddress && (
            <div className="aspect-[4/3] mb-10 overflow-hidden" style={{ border: '1px solid rgba(200, 215, 225, 0.4)' }}>
              <KakaoMap address={wedding.venueAddress} mapAddress={(wedding as any).mapAddress} mapVenue={(wedding as any).mapVenue} locale={locale} className="w-full h-full" />
            </div>
          )}
          <div className="flex justify-center gap-4">
            {wedding.venueNaverMap && <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="px-6 py-3 text-[0.65rem] tracking-[0.15em] transition-all duration-500" style={{ ...dacapoFont, color: '#6A7A84', background: 'transparent', border: '1px solid rgba(200, 215, 225, 0.5)' }}>네이버지도</a>}
            {wedding.venueKakaoMap && <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="px-6 py-3 text-[0.65rem] tracking-[0.15em] transition-all duration-500" style={{ ...dacapoFont, color: '#6A7A84', background: 'transparent', border: '1px solid rgba(200, 215, 225, 0.5)' }}>{locale === 'en' ? 'Kakao Map' : '카카오맵'}</a>}
          </div>
          {wedding.venuePhone && <a href={`tel:${wedding.venuePhone}`} className="flex items-center justify-center gap-2 mt-10 text-[0.7rem]" style={{ ...dacapoFont, color: '#9AABB8' }}><Phone className="w-3 h-3" /> {wedding.venuePhone}</a>}
        </motion.div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section id="account-section" className="py-32 px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-sm mx-auto">
            <p className="text-[0.85rem] text-center mb-16 tracking-[0.4em]" style={{ ...dacapoFont, color: '#9AABB8' }}>GIFT</p>
            <div className="space-y-5">
              {wedding.groomAccount && (
                <div style={{ background: 'transparent', border: '1px solid rgba(200, 215, 225, 0.4)' }}>
                  <button onClick={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} className="w-full px-6 py-5 flex items-center justify-between">
                    <span className="text-[0.8rem] tracking-[0.2em]" style={{ ...dacapoFont, color: '#5A6A74' }}>{locale === 'en' ? "Groom's Side" : '신랑측'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-700 ${openAccount === 'groom' ? 'rotate-180' : ''}`} style={{ color: '#D0DFE8' }} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'groom' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5 }} className="overflow-hidden">
                        <div className="px-6 pb-6" style={{ borderTop: '1px solid rgba(200, 215, 225, 0.3)' }}>
                          <div className="flex items-center justify-between pt-5">
                            <div style={dacapoFont}>
                              <p className="text-[0.65rem]" style={{ color: '#B8C8D4' }}>{wedding.groomBank}</p>
                              <p className="text-[0.8rem] mt-2" style={{ color: '#5A6A74' }}>{wedding.groomAccount}</p>
                              <p className="text-[0.65rem] mt-2" style={{ color: '#9AABB8' }}>{wedding.groomAccountHolder}</p>
                            </div>
                            <button onClick={() => copyToClipboard(`${wedding.groomBank} ${wedding.groomAccount}`, 'groom')} className="p-3 transition-all duration-500" style={{ background: 'rgba(200, 215, 225, 0.15)' }}>
                              {copiedAccount === 'groom' ? <Check className="w-4 h-4" style={{ color: '#5A6A74' }} /> : <Copy className="w-4 h-4" style={{ color: '#B8C8D4' }} />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {wedding.brideAccount && (
                <div style={{ background: 'transparent', border: '1px solid rgba(200, 215, 225, 0.4)' }}>
                  <button onClick={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} className="w-full px-6 py-5 flex items-center justify-between">
                    <span className="text-[0.8rem] tracking-[0.2em]" style={{ ...dacapoFont, color: '#5A6A74' }}>{locale === 'en' ? "Bride's Side" : '신부측'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-700 ${openAccount === 'bride' ? 'rotate-180' : ''}`} style={{ color: '#D0DFE8' }} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'bride' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5 }} className="overflow-hidden">
                        <div className="px-6 pb-6" style={{ borderTop: '1px solid rgba(200, 215, 225, 0.3)' }}>
                          <div className="flex items-center justify-between pt-5">
                            <div style={dacapoFont}>
                              <p className="text-[0.65rem]" style={{ color: '#B8C8D4' }}>{wedding.brideBank}</p>
                              <p className="text-[0.8rem] mt-2" style={{ color: '#5A6A74' }}>{wedding.brideAccount}</p>
                              <p className="text-[0.65rem] mt-2" style={{ color: '#9AABB8' }}>{wedding.brideAccountHolder}</p>
                            </div>
                            <button onClick={() => copyToClipboard(`${wedding.brideBank} ${wedding.brideAccount}`, 'bride')} className="p-3 transition-all duration-500" style={{ background: 'rgba(200, 215, 225, 0.15)' }}>
                              {copiedAccount === 'bride' ? <Check className="w-4 h-4" style={{ color: '#5A6A74' }} /> : <Copy className="w-4 h-4" style={{ color: '#B8C8D4' }} />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
            {(wedding.tossLink || wedding.kakaoPayLink) && (
              <div className="flex justify-center gap-4 mt-10">
                {wedding.tossLink && <a href={wedding.tossLink} target="_blank" rel="noopener noreferrer" className="px-8 py-3 text-[0.65rem] text-white tracking-[0.15em]" style={{ background: '#0064FF' }}>{locale === 'en' ? 'Toss' : '토스'}</a>}
                {wedding.kakaoPayLink && <a href={wedding.kakaoPayLink} target="_blank" rel="noopener noreferrer" className="px-8 py-3 text-[0.65rem] tracking-[0.15em]" style={{ background: '#FEE500', color: '#3C1E1E' }}>{locale === 'en' ? 'KakaoPay' : '카카오페이'}</a>}
              </div>
            )}
          </motion.div>
        </section>
      )}

      <section id="rsvp-section" className="py-32 px-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-sm mx-auto">
          <p className="text-[0.85rem] text-center mb-16 tracking-[0.4em]" style={{ ...dacapoFont, color: '#9AABB8' }}>RSVP</p>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="luna" locale={locale} />
        </motion.div>
      </section>

      <section id="guestbook-section" className="py-32 px-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-sm mx-auto">
          <p className="text-[0.85rem] text-center mb-16 tracking-[0.4em]" style={{ ...dacapoFont, color: '#9AABB8' }}>MESSAGE</p>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="luna" locale={locale} />
          {localGuestbooks.length > 0 && <div className="mt-16"><GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="luna" locale={locale} /></div>}
        </motion.div>
      </section>

      {guestPhotoSlot}
      <section className="py-24 px-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-sm mx-auto">
          <div className="flex justify-center gap-16 mb-16">
            {wedding.groomPhone && (
              <a href={`tel:${wedding.groomPhone}`} className="text-center">
                <div className="w-12 h-12 flex items-center justify-center mb-4 transition-all duration-500 hover:scale-105" style={{ border: '1px solid rgba(200, 215, 225, 0.5)' }}>
                  <Phone className="w-4 h-4" style={{ color: '#8A9AA4' }} />
                </div>
                <p className="text-[0.65rem] tracking-[0.2em]" style={{ ...dacapoFont, color: '#9AABB8' }}>신랑</p>
              </a>
            )}
            {wedding.bridePhone && (
              <a href={`tel:${wedding.bridePhone}`} className="text-center">
                <div className="w-12 h-12 flex items-center justify-center mb-4 transition-all duration-500 hover:scale-105" style={{ border: '1px solid rgba(200, 215, 225, 0.5)' }}>
                  <Phone className="w-4 h-4" style={{ color: '#8A9AA4' }} />
                </div>
                <p className="text-[0.65rem] tracking-[0.2em]" style={{ ...dacapoFont, color: '#9AABB8' }}>신부</p>
              </a>
            )}
          </div>
          <button onClick={() => setShowShareModal(true)} className="w-full py-4 text-[0.75rem] tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-500" style={{ ...dacapoFont, color: '#5A6A74', background: 'transparent', border: '1px solid rgba(200, 215, 225, 0.5)' }}>
            <Share2 className="w-4 h-4" /> 공유하기
          </button>
        </motion.div>
      </section>

      <footer className="py-16 text-center">
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-[0.5rem] tracking-[0.3em] hover:opacity-70 transition-opacity duration-500" style={{ ...dacapoFont, color: '#C8D7E0' }}>
          Made by Wedding Studio Lab ›
        </a>
      </footer>

      {galleryIndex !== null && galleries.length > 0 && <GalleryModal galleries={galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="LUNA_HALFMOON" usePhotoFilter={wedding.usePhotoFilter ?? true} />}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="light" />
    </div>
  );
}

declare global { interface Window { Kakao?: any; } }
