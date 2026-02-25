import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

export default function PearlDrift({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot }: ThemeProps) {
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
      window.Kakao.Share.sendDefault({ objectType: 'feed', content: { title, description: formatDate(wedding.weddingDate, 'korean'), imageUrl: wedding.heroMedia || '', link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }] });
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
  const pearlFont = { fontFamily: "'MapoDacapo', sans-serif" };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen relative" style={{ background: '#050505' }}>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(10, 10, 10, 0.8)', border: '1px solid rgba(227, 235, 243, 0.1)' }}>
          {isPlaying ? <Volume2 className="w-4 h-4" style={{ color: '#E3EBF3' }} /> : <VolumeX className="w-4 h-4" style={{ color: '#5A6A78' }} />}
        </button>
      )}

      <section className="min-h-screen flex flex-col justify-center items-center px-6 relative">
        {wedding.heroMedia && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="w-full max-w-lg">
            <div className="relative">
              <div className="aspect-[3/4] overflow-hidden">
                {wedding.heroMediaType === 'VIDEO' ? (
                  <video src={heroUrl(wedding.heroMedia)} autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: 'saturate(0.7) contrast(1.1) brightness(0.95)' }} />
                ) : (
                  <img src={heroUrl(wedding.heroMedia)} alt="" className="w-full h-full object-cover" style={{ filter: 'saturate(0.7) contrast(1.1) brightness(0.95)' }} />
                )}
              </div>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 60%, rgba(5, 5, 5, 0.8) 100%)' }} />
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <div className="flex items-center justify-center gap-6 mb-4">
                  <span className="text-[1.6rem]" style={{ ...pearlFont, color: '#E8EEF2' }}>{wedding.groomName}</span>
                  <span className="text-[0.9rem]" style={{ color: 'rgba(227, 235, 243, 0.3)' }}>&</span>
                  <span className="text-[1.6rem]" style={{ ...pearlFont, color: '#E8EEF2' }}>{wedding.brideName}</span>
                </div>
                <p className="text-[0.75rem] tracking-[0.2em]" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.5)' }}>{formatDate(wedding.weddingDate, 'dots')}</p>
                {wedding.showDday && <p className="mt-3 text-[0.65rem] tracking-widest" style={{ ...pearlFont, color: 'rgba(200, 216, 232, 0.4)' }}>{getDday(wedding.weddingDate)}</p>}
              </div>
            </div>
          </motion.div>
        )}
        {!wedding.heroMedia && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="text-center">
            <div className="flex items-center justify-center gap-6 mb-6">
              <span className="text-[2rem]" style={{ ...pearlFont, color: '#E8EEF2' }}>{wedding.groomName}</span>
              <span className="text-[1rem]" style={{ color: 'rgba(227, 235, 243, 0.3)' }}>&</span>
              <span className="text-[2rem]" style={{ ...pearlFont, color: '#E8EEF2' }}>{wedding.brideName}</span>
            </div>
            <p className="text-[0.8rem] tracking-[0.2em]" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.5)' }}>{formatDate(wedding.weddingDate, 'dots')}</p>
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-10">
          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: 'rgba(227, 235, 243, 0.3)' }} />
        </motion.div>
      </section>

      {wedding.greeting && (
        <section className="py-32 px-8" style={{ background: '#0A0A0A' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="max-w-md mx-auto text-center">
            {wedding.greetingTitle && <p className="text-[1rem] mb-12" style={{ ...pearlFont, color: '#E8EEF2' }}>{wedding.greetingTitle}</p>}
            <p className="text-[0.85rem] leading-[2.6] whitespace-pre-line" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.7)' }}>{wedding.greeting}</p>
            {wedding.showParents && (
              <div className="mt-16 pt-12" style={{ borderTop: '1px solid rgba(227, 235, 243, 0.08)' }}>
                <div className="space-y-4" style={pearlFont}>
                  <p className="text-[0.75rem]" style={{ color: 'rgba(227, 235, 243, 0.5)' }}>
                    <span style={{ color: 'rgba(227, 235, 243, 0.35)' }}>{wedding.groomFatherName} · {wedding.groomMotherName}</span>
                    <span className="mx-3" style={{ color: 'rgba(227, 235, 243, 0.15)' }}>의 아들</span>
                    <span style={{ color: '#E8EEF2' }}>{wedding.groomName}</span>
                  </p>
                  <p className="text-[0.75rem]" style={{ color: 'rgba(227, 235, 243, 0.5)' }}>
                    <span style={{ color: 'rgba(227, 235, 243, 0.35)' }}>{wedding.brideFatherName} · {wedding.brideMotherName}</span>
                    <span className="mx-3" style={{ color: 'rgba(227, 235, 243, 0.15)' }}>의 딸</span>
                    <span style={{ color: '#E8EEF2' }}>{wedding.brideName}</span>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {galleries.length > 0 && (
        <section id="gallery-section" className="py-32 px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <p className="text-center text-[0.8rem] mb-20 tracking-[0.3em]" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.4)' }}>GALLERY</p>
            <div className="max-w-2xl mx-auto">
              {galleries.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.2, duration: 1 }} onClick={() => setGalleryIndex(i)} className="cursor-pointer mb-1">
                  <div className="overflow-hidden">
                    {item.mediaType === 'VIDEO' ? (
                      <video src={item.mediaUrl} className="w-full object-cover transition-all duration-1000 hover:scale-[1.01]" muted style={{ filter: 'saturate(0.7) contrast(1.1) brightness(0.95)' }} />
                    ) : (
                      <img src={galleryThumbUrl(item.mediaUrl)} alt="" loading="lazy" className="w-full object-cover transition-all duration-1000 hover:scale-[1.01]" style={{ filter: 'saturate(0.7) contrast(1.1) brightness(0.95)' }} />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      <section className="py-32 px-8" style={{ background: '#0A0A0A' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-sm mx-auto">
          <p className="text-center text-[0.8rem] mb-12 tracking-[0.3em]" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.4)' }}>{calendarData.year}. {String(calendarData.month).padStart(2, '0')}</p>
          <div className="grid grid-cols-7 text-center text-[0.6rem] mb-4" style={pearlFont}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} className="py-3 tracking-widest" style={{ color: i === 0 ? 'rgba(200, 216, 232, 0.5)' : 'rgba(227, 235, 243, 0.35)' }}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 text-center text-[0.75rem]" style={pearlFont}>
            {calendarData.weeks.flat().map((day, i) => (
              <span key={i} className="py-3 flex items-center justify-center" style={{
                color: day === calendarData.targetDay ? '#050505' : day ? 'rgba(227, 235, 243, 0.5)' : 'transparent',
                background: day === calendarData.targetDay ? '#E3EBF3' : 'transparent',
                borderRadius: '50%',
                width: day === calendarData.targetDay ? '2rem' : 'auto',
                height: day === calendarData.targetDay ? '2rem' : 'auto',
                margin: day === calendarData.targetDay ? '0 auto' : '0'
              }}>{day || ''}</span>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-[0.8rem]" style={{ ...pearlFont, color: '#E8EEF2' }}>{formatDate(wedding.weddingDate, 'korean')}</p>
            {wedding.weddingTime && <p className="text-[0.7rem] mt-2" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.5)' }}>{formatTime(wedding.weddingTime)}</p>}
          </div>
        </motion.div>
      </section>

      <section id="venue-section" className="py-32 px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-md mx-auto text-center">
          <p className="text-[0.8rem] mb-14 tracking-[0.3em]" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.4)' }}>LOCATION</p>
          <div className="mb-10">
            <p className="text-[0.9rem]" style={{ ...pearlFont, color: '#E8EEF2' }}>{wedding.venue}</p>
            {wedding.venueHall && <p className="text-[0.8rem] mt-2" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.5)' }}>{wedding.venueHall}</p>}
            {wedding.venueAddress && <p className="text-[0.7rem] mt-4" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.35)' }}>{wedding.venueAddress}</p>}
          </div>
          {wedding.venueAddress && (
            <div className="aspect-[4/3] mb-10 overflow-hidden" style={{ border: '1px solid rgba(227, 235, 243, 0.1)' }}>
              <KakaoMap address={wedding.venueAddress} className="w-full h-full" />
            </div>
          )}
          <div className="flex justify-center gap-3">
            {wedding.venueNaverMap && <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="px-6 py-3 text-[0.65rem] tracking-wider transition-all" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.7)', background: 'rgba(227, 235, 243, 0.05)', border: '1px solid rgba(227, 235, 243, 0.1)' }}>네이버지도</a>}
            {wedding.venueKakaoMap && <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="px-6 py-3 text-[0.65rem] tracking-wider transition-all" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.7)', background: 'rgba(227, 235, 243, 0.05)', border: '1px solid rgba(227, 235, 243, 0.1)' }}>카카오맵</a>}
          </div>
          {wedding.venuePhone && <a href={`tel:${wedding.venuePhone}`} className="flex items-center justify-center gap-2 mt-10 text-[0.7rem]" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.5)' }}><Phone className="w-3.5 h-3.5" /> {wedding.venuePhone}</a>}
        </motion.div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section id="account-section" className="py-32 px-8" style={{ background: '#0A0A0A' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-md mx-auto">
            <p className="text-[0.8rem] text-center mb-14 tracking-[0.3em]" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.4)' }}>GIFT</p>
            <div className="space-y-4">
              {wedding.groomAccount && (
                <div style={{ background: 'rgba(227, 235, 243, 0.03)', border: '1px solid rgba(227, 235, 243, 0.08)' }}>
                  <button onClick={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} className="w-full px-6 py-5 flex items-center justify-between">
                    <span className="text-[0.8rem] tracking-wider" style={{ ...pearlFont, color: '#E8EEF2' }}>신랑측</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${openAccount === 'groom' ? 'rotate-180' : ''}`} style={{ color: 'rgba(227, 235, 243, 0.3)' }} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'groom' && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden">
                        <div className="px-6 pb-5" style={{ borderTop: '1px solid rgba(227, 235, 243, 0.08)' }}>
                          <div className="flex items-center justify-between pt-5">
                            <div style={pearlFont}>
                              <p className="text-[0.65rem]" style={{ color: 'rgba(227, 235, 243, 0.35)' }}>{wedding.groomBank}</p>
                              <p className="text-[0.8rem] mt-1" style={{ color: '#E8EEF2' }}>{wedding.groomAccount}</p>
                              <p className="text-[0.65rem] mt-1" style={{ color: 'rgba(227, 235, 243, 0.5)' }}>{wedding.groomAccountHolder}</p>
                            </div>
                            <button onClick={() => copyToClipboard(`${wedding.groomBank} ${wedding.groomAccount}`, 'groom')} className="p-3 transition-all" style={{ background: 'rgba(227, 235, 243, 0.05)' }}>
                              {copiedAccount === 'groom' ? <Check className="w-4 h-4" style={{ color: '#E8EEF2' }} /> : <Copy className="w-4 h-4" style={{ color: 'rgba(227, 235, 243, 0.4)' }} />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {wedding.brideAccount && (
                <div style={{ background: 'rgba(227, 235, 243, 0.03)', border: '1px solid rgba(227, 235, 243, 0.08)' }}>
                  <button onClick={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} className="w-full px-6 py-5 flex items-center justify-between">
                    <span className="text-[0.8rem] tracking-wider" style={{ ...pearlFont, color: '#E8EEF2' }}>신부측</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${openAccount === 'bride' ? 'rotate-180' : ''}`} style={{ color: 'rgba(227, 235, 243, 0.3)' }} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'bride' && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden">
                        <div className="px-6 pb-5" style={{ borderTop: '1px solid rgba(227, 235, 243, 0.08)' }}>
                          <div className="flex items-center justify-between pt-5">
                            <div style={pearlFont}>
                              <p className="text-[0.65rem]" style={{ color: 'rgba(227, 235, 243, 0.35)' }}>{wedding.brideBank}</p>
                              <p className="text-[0.8rem] mt-1" style={{ color: '#E8EEF2' }}>{wedding.brideAccount}</p>
                              <p className="text-[0.65rem] mt-1" style={{ color: 'rgba(227, 235, 243, 0.5)' }}>{wedding.brideAccountHolder}</p>
                            </div>
                            <button onClick={() => copyToClipboard(`${wedding.brideBank} ${wedding.brideAccount}`, 'bride')} className="p-3 transition-all" style={{ background: 'rgba(227, 235, 243, 0.05)' }}>
                              {copiedAccount === 'bride' ? <Check className="w-4 h-4" style={{ color: '#E8EEF2' }} /> : <Copy className="w-4 h-4" style={{ color: 'rgba(227, 235, 243, 0.4)' }} />}
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
              <div className="flex justify-center gap-3 mt-10">
                {wedding.tossLink && <a href={wedding.tossLink} target="_blank" rel="noopener noreferrer" className="px-8 py-3 text-[0.65rem] text-white tracking-wider" style={{ background: '#0064FF' }}>토스</a>}
                {wedding.kakaoPayLink && <a href={wedding.kakaoPayLink} target="_blank" rel="noopener noreferrer" className="px-8 py-3 text-[0.65rem] tracking-wider" style={{ background: '#FEE500', color: '#3C1E1E' }}>카카오페이</a>}
              </div>
            )}
          </motion.div>
        </section>
      )}

      <section id="rsvp-section" className="py-32 px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-md mx-auto">
          <p className="text-[0.8rem] text-center mb-14 tracking-[0.3em]" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.4)' }}>RSVP</p>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="pearl" />
        </motion.div>
      </section>

      <section id="guestbook-section" className="py-32 px-8" style={{ background: '#0A0A0A' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-md mx-auto">
          <p className="text-[0.8rem] text-center mb-14 tracking-[0.3em]" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.4)' }}>MESSAGE</p>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="pearl" />
          {localGuestbooks.length > 0 && <div className="mt-14"><GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="pearl" /></div>}
        </motion.div>
      </section>

      <section className="py-24 px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-md mx-auto">
          <div className="flex justify-center gap-14 mb-14">
            {wedding.groomPhone && (
              <a href={`tel:${wedding.groomPhone}`} className="text-center">
                <div className="w-14 h-14 flex items-center justify-center mb-3 transition-all hover:scale-105" style={{ background: 'rgba(227, 235, 243, 0.05)', border: '1px solid rgba(227, 235, 243, 0.1)' }}>
                  <Phone className="w-5 h-5" style={{ color: 'rgba(227, 235, 243, 0.6)' }} />
                </div>
                <p className="text-[0.65rem] tracking-wider" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.5)' }}>신랑</p>
              </a>
            )}
            {wedding.bridePhone && (
              <a href={`tel:${wedding.bridePhone}`} className="text-center">
                <div className="w-14 h-14 flex items-center justify-center mb-3 transition-all hover:scale-105" style={{ background: 'rgba(227, 235, 243, 0.05)', border: '1px solid rgba(227, 235, 243, 0.1)' }}>
                  <Phone className="w-5 h-5" style={{ color: 'rgba(227, 235, 243, 0.6)' }} />
                </div>
                <p className="text-[0.65rem] tracking-wider" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.5)' }}>신부</p>
              </a>
            )}
          </div>
          <button onClick={() => setShowShareModal(true)} className="w-full py-4 text-[0.75rem] tracking-wider flex items-center justify-center gap-3 transition-all hover:scale-[1.01]" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.7)', background: 'rgba(227, 235, 243, 0.05)', border: '1px solid rgba(227, 235, 243, 0.1)' }}>
            <Share2 className="w-4 h-4" /> 공유하기
          </button>
        </motion.div>
      </section>

      {guestPhotoSlot}
      <footer className="py-14 text-center" style={{ background: '#0A0A0A' }}>
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-[0.5rem] tracking-[0.25em] hover:opacity-70 transition-opacity" style={{ ...pearlFont, color: 'rgba(227, 235, 243, 0.25)' }}>
          Made by 청첩장 작업실 ›
        </a>
      </footer>

      {galleryIndex !== null && galleries.length > 0 && <GalleryModal galleries={galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="PEARL_DRIFT" usePhotoFilter={wedding.usePhotoFilter ?? true} />}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="dark" />
    </div>
  );
}

declare global { interface Window { Kakao?: any; } }
