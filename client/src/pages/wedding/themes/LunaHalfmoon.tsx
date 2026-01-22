import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

export default function LunaHalfmoon({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading }: ThemeProps) {
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
        font-family: 'SchoolSafetyWave';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2402_keris@1.0/TTHakgyoansimMulgyeolR.woff2') format('woff2');
        font-weight: 400;
        font-display: swap;
      }
      @font-face {
        font-family: 'SchoolSafetyWave';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2402_keris@1.0/TTHakgyoansimMulgyeolB.woff2') format('woff2');
        font-weight: 700;
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
  const waveFont = { fontFamily: "'SchoolSafetyWave', serif" };

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] } }
  };

  return (
    <div className="min-h-screen relative" style={{ background: '#FFFFFF' }}>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(255, 255, 255, 0.9)', boxShadow: '0 2px 20px rgba(197, 212, 222, 0.3)', border: '1px solid rgba(197, 212, 222, 0.3)' }}>
          {isPlaying ? <Volume2 className="w-4 h-4" style={{ color: '#7A8A94' }} /> : <VolumeX className="w-4 h-4" style={{ color: '#A8B8C4' }} />}
        </button>
      )}

      <section className="min-h-screen flex flex-col justify-center items-center px-8 py-24 relative">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center w-full max-w-md">
          {wedding.heroMedia && (
            <div className="relative mb-16">
              <div className="relative overflow-hidden" style={{ borderRadius: '0' }}>
                <div className="aspect-[3/4] overflow-hidden">
                  {wedding.heroMediaType === 'VIDEO' ? (
                    <video src={wedding.heroMedia} autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: 'saturate(0.85) brightness(1.02)' }} />
                  ) : (
                    <img src={wedding.heroMedia} alt="" className="w-full h-full object-cover" style={{ filter: 'saturate(0.85) brightness(1.02)' }} />
                  )}
                </div>
              </div>
            </div>
          )}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1.5 }}>
            <div className="flex items-center justify-center gap-8 mb-6">
              <span className="text-[1.8rem] font-light tracking-wide" style={{ ...waveFont, color: '#5A6A74' }}>{wedding.groomName}</span>
              <span className="text-[1rem]" style={{ color: '#C5D4DE' }}>&</span>
              <span className="text-[1.8rem] font-light tracking-wide" style={{ ...waveFont, color: '#5A6A74' }}>{wedding.brideName}</span>
            </div>
            <div className="w-16 h-px mx-auto mb-6" style={{ background: 'linear-gradient(90deg, transparent, #C5D4DE, transparent)' }} />
            <p className="text-[0.8rem] tracking-[0.3em] font-light" style={{ ...waveFont, color: '#8A9AA4' }}>{formatDate(wedding.weddingDate, 'dots')}</p>
            {wedding.showDday && <p className="mt-4 text-[0.7rem] tracking-widest" style={{ ...waveFont, color: '#A8BDC9' }}>{getDday(wedding.weddingDate)}</p>}
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="absolute bottom-12">
          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: '#C5D4DE' }} />
        </motion.div>
      </section>

      {wedding.greeting && (
        <section className="py-28 px-8" style={{ background: '#FAFCFD' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="max-w-md mx-auto text-center">
            {wedding.greetingTitle && <p className="text-[1.1rem] mb-10 font-light" style={{ ...waveFont, color: '#5A6A74' }}>{wedding.greetingTitle}</p>}
            <p className="text-[0.9rem] leading-[2.4] whitespace-pre-line font-light" style={{ ...waveFont, color: '#6A7A84' }}>{wedding.greeting}</p>
            {wedding.showParents && (
              <div className="mt-14 pt-10" style={{ borderTop: '1px solid rgba(197, 212, 222, 0.4)' }}>
                <div className="space-y-4" style={waveFont}>
                  <p className="text-[0.8rem] font-light" style={{ color: '#7A8A94' }}>
                    <span style={{ color: '#8A9AA4' }}>{wedding.groomFatherName} · {wedding.groomMotherName}</span>
                    <span className="mx-3" style={{ color: '#C5D4DE' }}>의 아들</span>
                    <span style={{ color: '#5A6A74' }}>{wedding.groomName}</span>
                  </p>
                  <p className="text-[0.8rem] font-light" style={{ color: '#7A8A94' }}>
                    <span style={{ color: '#8A9AA4' }}>{wedding.brideFatherName} · {wedding.brideMotherName}</span>
                    <span className="mx-3" style={{ color: '#C5D4DE' }}>의 딸</span>
                    <span style={{ color: '#5A6A74' }}>{wedding.brideName}</span>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {galleries.length > 0 && (
        <section className="py-28 px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <p className="text-center text-[1rem] mb-16 tracking-widest font-light" style={{ ...waveFont, color: '#7A8A94' }}>GALLERY</p>
            <div className="max-w-lg mx-auto space-y-6">
              {galleries.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.8 }} onClick={() => setGalleryIndex(i)} className="cursor-pointer">
                  <div className="overflow-hidden aspect-[4/5]">
                    {item.mediaType === 'VIDEO' ? (
                      <video src={item.mediaUrl} className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]" muted style={{ filter: 'saturate(0.85) brightness(1.02)' }} />
                    ) : (
                      <img src={item.mediaUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]" style={{ filter: 'saturate(0.85) brightness(1.02)' }} />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      <section className="py-28 px-8" style={{ background: '#FAFCFD' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-sm mx-auto">
          <p className="text-center text-[0.9rem] mb-10 tracking-widest font-light" style={{ ...waveFont, color: '#7A8A94' }}>{calendarData.year}. {String(calendarData.month).padStart(2, '0')}</p>
          <div className="grid grid-cols-7 text-center text-[0.65rem] mb-4" style={waveFont}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} className="py-3 tracking-widest" style={{ color: i === 0 ? '#A8BDC9' : '#8A9AA4' }}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 text-center text-[0.8rem]" style={waveFont}>
            {calendarData.weeks.flat().map((day, i) => (
              <span key={i} className="py-3 flex items-center justify-center" style={{
                color: day === calendarData.targetDay ? '#FFFFFF' : day ? '#6A7A84' : 'transparent',
                background: day === calendarData.targetDay ? 'linear-gradient(135deg, #A8BDC9 0%, #8AAAB8 100%)' : 'transparent',
                borderRadius: '50%',
                width: day === calendarData.targetDay ? '2rem' : 'auto',
                height: day === calendarData.targetDay ? '2rem' : 'auto',
                margin: day === calendarData.targetDay ? '0 auto' : '0'
              }}>{day || ''}</span>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-[0.85rem] font-light" style={{ ...waveFont, color: '#5A6A74' }}>{formatDate(wedding.weddingDate, 'korean')}</p>
            <p className="text-[0.75rem] mt-2 font-light" style={{ ...waveFont, color: '#8A9AA4' }}>{formatTime(wedding.weddingTime)}</p>
          </div>
        </motion.div>
      </section>

      <section className="py-28 px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-md mx-auto text-center">
          <p className="text-[1rem] mb-12 tracking-widest font-light" style={{ ...waveFont, color: '#7A8A94' }}>LOCATION</p>
          <div className="mb-8">
            <p className="text-[0.95rem] font-light" style={{ ...waveFont, color: '#5A6A74' }}>{wedding.venue}</p>
            {wedding.venueHall && <p className="text-[0.85rem] mt-2 font-light" style={{ ...waveFont, color: '#8A9AA4' }}>{wedding.venueHall}</p>}
            {wedding.venueAddress && <p className="text-[0.75rem] mt-4 font-light" style={{ ...waveFont, color: '#A8BDC9' }}>{wedding.venueAddress}</p>}
          </div>
          {wedding.venueAddress && (
            <div className="aspect-[4/3] mb-8 overflow-hidden" style={{ border: '1px solid rgba(197, 212, 222, 0.3)' }}>
              <KakaoMap address={wedding.venueAddress} className="w-full h-full" />
            </div>
          )}
          <div className="flex justify-center gap-3">
            {wedding.venueNaverMap && <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="px-6 py-3 text-[0.7rem] tracking-wider transition-all font-light" style={{ ...waveFont, color: '#6A7A84', background: '#FAFCFD', border: '1px solid rgba(197, 212, 222, 0.5)' }}>네이버지도</a>}
            {wedding.venueKakaoMap && <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="px-6 py-3 text-[0.7rem] tracking-wider transition-all font-light" style={{ ...waveFont, color: '#6A7A84', background: '#FAFCFD', border: '1px solid rgba(197, 212, 222, 0.5)' }}>카카오맵</a>}
          </div>
          {wedding.venuePhone && <a href={`tel:${wedding.venuePhone}`} className="flex items-center justify-center gap-2 mt-8 text-[0.75rem] font-light" style={{ ...waveFont, color: '#8A9AA4' }}><Phone className="w-3.5 h-3.5" /> {wedding.venuePhone}</a>}
        </motion.div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section className="py-28 px-8" style={{ background: '#FAFCFD' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-md mx-auto">
            <p className="text-[1rem] text-center mb-12 tracking-widest font-light" style={{ ...waveFont, color: '#7A8A94' }}>GIFT</p>
            <div className="space-y-4">
              {wedding.groomAccount && (
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(197, 212, 222, 0.3)' }}>
                  <button onClick={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} className="w-full px-6 py-5 flex items-center justify-between">
                    <span className="text-[0.85rem] font-light tracking-wider" style={{ ...waveFont, color: '#5A6A74' }}>신랑측</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${openAccount === 'groom' ? 'rotate-180' : ''}`} style={{ color: '#C5D4DE' }} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'groom' && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden">
                        <div className="px-6 pb-5" style={{ borderTop: '1px solid rgba(197, 212, 222, 0.3)' }}>
                          <div className="flex items-center justify-between pt-5">
                            <div style={waveFont}>
                              <p className="text-[0.7rem] font-light" style={{ color: '#A8BDC9' }}>{wedding.groomBank}</p>
                              <p className="text-[0.85rem] font-light mt-1" style={{ color: '#5A6A74' }}>{wedding.groomAccount}</p>
                              <p className="text-[0.7rem] font-light mt-1" style={{ color: '#8A9AA4' }}>{wedding.groomAccountHolder}</p>
                            </div>
                            <button onClick={() => copyToClipboard(`${wedding.groomBank} ${wedding.groomAccount}`, 'groom')} className="p-3 transition-all" style={{ background: 'rgba(197, 212, 222, 0.2)' }}>
                              {copiedAccount === 'groom' ? <Check className="w-4 h-4" style={{ color: '#5A6A74' }} /> : <Copy className="w-4 h-4" style={{ color: '#A8BDC9' }} />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {wedding.brideAccount && (
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(197, 212, 222, 0.3)' }}>
                  <button onClick={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} className="w-full px-6 py-5 flex items-center justify-between">
                    <span className="text-[0.85rem] font-light tracking-wider" style={{ ...waveFont, color: '#5A6A74' }}>신부측</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${openAccount === 'bride' ? 'rotate-180' : ''}`} style={{ color: '#C5D4DE' }} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'bride' && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden">
                        <div className="px-6 pb-5" style={{ borderTop: '1px solid rgba(197, 212, 222, 0.3)' }}>
                          <div className="flex items-center justify-between pt-5">
                            <div style={waveFont}>
                              <p className="text-[0.7rem] font-light" style={{ color: '#A8BDC9' }}>{wedding.brideBank}</p>
                              <p className="text-[0.85rem] font-light mt-1" style={{ color: '#5A6A74' }}>{wedding.brideAccount}</p>
                              <p className="text-[0.7rem] font-light mt-1" style={{ color: '#8A9AA4' }}>{wedding.brideAccountHolder}</p>
                            </div>
                            <button onClick={() => copyToClipboard(`${wedding.brideBank} ${wedding.brideAccount}`, 'bride')} className="p-3 transition-all" style={{ background: 'rgba(197, 212, 222, 0.2)' }}>
                              {copiedAccount === 'bride' ? <Check className="w-4 h-4" style={{ color: '#5A6A74' }} /> : <Copy className="w-4 h-4" style={{ color: '#A8BDC9' }} />}
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
              <div className="flex justify-center gap-3 mt-8">
                {wedding.tossLink && <a href={wedding.tossLink} target="_blank" rel="noopener noreferrer" className="px-8 py-3 text-[0.7rem] text-white tracking-wider font-light" style={{ background: '#0064FF' }}>토스</a>}
                {wedding.kakaoPayLink && <a href={wedding.kakaoPayLink} target="_blank" rel="noopener noreferrer" className="px-8 py-3 text-[0.7rem] tracking-wider font-light" style={{ background: '#FEE500', color: '#3C1E1E' }}>카카오페이</a>}
              </div>
            )}
          </motion.div>
        </section>
      )}

      <section className="py-28 px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-md mx-auto">
          <p className="text-[1rem] text-center mb-12 tracking-widest font-light" style={{ ...waveFont, color: '#7A8A94' }}>RSVP</p>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="luna" />
        </motion.div>
      </section>

      <section className="py-28 px-8" style={{ background: '#FAFCFD' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-md mx-auto">
          <p className="text-[1rem] text-center mb-12 tracking-widest font-light" style={{ ...waveFont, color: '#7A8A94' }}>MESSAGE</p>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="luna" />
          {localGuestbooks.length > 0 && <div className="mt-12"><GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="luna" /></div>}
        </motion.div>
      </section>

      <section className="py-20 px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-md mx-auto">
          <div className="flex justify-center gap-12 mb-12">
            {wedding.groomPhone && (
              <a href={`tel:${wedding.groomPhone}`} className="text-center">
                <div className="w-14 h-14 flex items-center justify-center mb-3 transition-all hover:scale-105" style={{ background: '#FAFCFD', border: '1px solid rgba(197, 212, 222, 0.5)' }}>
                  <Phone className="w-5 h-5" style={{ color: '#7A8A94' }} />
                </div>
                <p className="text-[0.7rem] font-light tracking-wider" style={{ ...waveFont, color: '#8A9AA4' }}>신랑</p>
              </a>
            )}
            {wedding.bridePhone && (
              <a href={`tel:${wedding.bridePhone}`} className="text-center">
                <div className="w-14 h-14 flex items-center justify-center mb-3 transition-all hover:scale-105" style={{ background: '#FAFCFD', border: '1px solid rgba(197, 212, 222, 0.5)' }}>
                  <Phone className="w-5 h-5" style={{ color: '#7A8A94' }} />
                </div>
                <p className="text-[0.7rem] font-light tracking-wider" style={{ ...waveFont, color: '#8A9AA4' }}>신부</p>
              </a>
            )}
          </div>
          <button onClick={() => setShowShareModal(true)} className="w-full py-4 text-[0.8rem] tracking-wider flex items-center justify-center gap-3 transition-all hover:scale-[1.01] font-light" style={{ ...waveFont, color: '#5A6A74', background: '#FAFCFD', border: '1px solid rgba(197, 212, 222, 0.5)' }}>
            <Share2 className="w-4 h-4" /> 공유하기
          </button>
        </motion.div>
      </section>

      <footer className="py-12 text-center" style={{ background: '#FAFCFD' }}>
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-[0.55rem] tracking-[0.25em] hover:opacity-70 transition-opacity font-light" style={{ ...waveFont, color: '#A8BDC9' }}>
          Made by 청첩장 작업실 ›
        </a>
      </footer>

      {galleryIndex !== null && galleries.length > 0 && <GalleryModal galleries={galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="LUNA_HALFMOON" usePhotoFilter={wedding.usePhotoFilter ?? true} />}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="light" />
    </div>
  );
}

declare global { interface Window { Kakao?: any; } }
