import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

export default function GalleryMirim2({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading }: ThemeProps) {
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
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500&display=swap');
      @font-face {
        font-family: 'KyoboHandwriting2020ParkDoYeon';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2112@1.0/KyoboHandwriting2020A.woff') format('woff');
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
  const serifFont = { fontFamily: "'Noto Serif KR', serif", fontWeight: 300 };
  const titleFont = { fontFamily: "'KyoboHandwriting2020ParkDoYeon', serif" };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#1A1D1C' }}>
      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.06]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(35, 45, 40, 0.9)', border: '1px solid rgba(120, 140, 130, 0.2)' }}>
          {isPlaying ? <Volume2 className="w-4 h-4" style={{ color: '#A8BFB0' }} /> : <VolumeX className="w-4 h-4" style={{ color: '#5A6B60' }} />}
        </button>
      )}

      <section className="min-h-screen flex flex-col justify-center items-center px-6 py-20 relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }} className="text-center w-full max-w-sm">
          {wedding.heroMedia && (
            <div className="relative mb-12">
              <div className="absolute -inset-4 opacity-40" style={{ background: 'radial-gradient(ellipse at center, rgba(100, 130, 110, 0.3) 0%, transparent 70%)' }} />
              <div className="relative" style={{ padding: '8px 8px 28px 8px', background: '#0D0F0E', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
                <div className="aspect-[3/4] overflow-hidden relative">
                  {wedding.heroMediaType === 'VIDEO' ? (
                    <video src={wedding.heroMedia} autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: 'contrast(1.05) brightness(0.95) saturate(0.9)' }} />
                  ) : (
                    <img src={wedding.heroMedia} alt="" className="w-full h-full object-cover" style={{ filter: 'contrast(1.05) brightness(0.95) saturate(0.9)' }} />
                  )}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.15) 100%)' }} />
                </div>
                <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                  <p className="text-[0.45rem] tracking-[0.2em]" style={{ color: 'rgba(168, 191, 176, 0.4)' }}>KODAK 400TX</p>
                  <p className="text-[0.45rem] tracking-[0.15em]" style={{ color: 'rgba(168, 191, 176, 0.4)' }}>35mm</p>
                </div>
              </div>
              <div className="absolute -left-2 top-1/4 w-1.5 h-8 flex flex-col gap-1">
                {[...Array(4)].map((_, i) => <div key={i} className="w-full h-1.5 rounded-sm" style={{ background: 'rgba(100, 130, 110, 0.15)' }} />)}
              </div>
              <div className="absolute -right-2 top-1/4 w-1.5 h-8 flex flex-col gap-1">
                {[...Array(4)].map((_, i) => <div key={i} className="w-full h-1.5 rounded-sm" style={{ background: 'rgba(100, 130, 110, 0.15)' }} />)}
              </div>
            </div>
          )}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }}>
            <div className="flex items-center justify-center gap-6 mb-5">
              <span className="text-[1.4rem]" style={{ ...titleFont, color: '#D4E0D8' }}>{wedding.groomName}</span>
              <span className="text-[0.75rem]" style={{ color: '#5A6B60' }}>&</span>
              <span className="text-[1.4rem]" style={{ ...titleFont, color: '#D4E0D8' }}>{wedding.brideName}</span>
            </div>
            <div className="w-16 h-px mx-auto mb-5" style={{ background: 'linear-gradient(90deg, transparent, #4A5B50, transparent)' }} />
            <p className="text-[0.7rem] tracking-[0.3em]" style={{ ...serifFont, color: '#788C80' }}>{formatDate(wedding.weddingDate, 'dots')}</p>
            {wedding.showDday && <p className="mt-4 text-[0.6rem]" style={{ ...serifFont, color: '#4A5B50' }}>{getDday(wedding.weddingDate)}</p>}
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-10">
          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: '#4A5B50' }} />
        </motion.div>
      </section>

      {wedding.greeting && (
        <section id="greeting-section" className="py-24 px-6" style={{ background: 'linear-gradient(180deg, #1A1D1C 0%, #1E2220 100%)' }}>
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-sm mx-auto text-center">
            {wedding.greetingTitle && <p className="text-[1rem] mb-10" style={{ ...titleFont, color: '#A8BFB0' }}>{wedding.greetingTitle}</p>}
            <p className="text-[0.8rem] leading-[2.4] whitespace-pre-line" style={{ ...serifFont, color: '#8A9B90' }}>{wedding.greeting}</p>
            {wedding.showParents && (
              <div className="mt-12 pt-10" style={{ borderTop: '1px solid rgba(100, 130, 110, 0.15)' }}>
                <div className="space-y-3" style={serifFont}>
                  <p className="text-[0.7rem]" style={{ color: '#6A7B70' }}><span style={{ color: '#5A6B60' }}>{wedding.groomFatherName} · {wedding.groomMotherName}</span><span className="mx-2" style={{ color: '#4A5B50' }}>의 아들</span><span style={{ color: '#A8BFB0' }}>{wedding.groomName}</span></p>
                  <p className="text-[0.7rem]" style={{ color: '#6A7B70' }}><span style={{ color: '#5A6B60' }}>{wedding.brideFatherName} · {wedding.brideMotherName}</span><span className="mx-2" style={{ color: '#4A5B50' }}>의 딸</span><span style={{ color: '#A8BFB0' }}>{wedding.brideName}</span></p>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {galleries.length > 0 && (
        <section id="gallery-section" className="py-20 px-4" style={{ background: '#161918' }}>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-center text-[1rem] mb-12" style={{ ...titleFont, color: '#A8BFB0' }}>Film</p>
            <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
              {galleries.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }} onClick={() => setGalleryIndex(i)} className={`cursor-pointer ${i === 0 || i === 5 ? 'col-span-2' : ''}`}>
                  <div style={{ padding: '6px 6px 20px 6px', background: '#0D0F0E', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)' }}>
                    <div className={`overflow-hidden ${i === 0 || i === 5 ? 'aspect-[16/9]' : 'aspect-square'}`}>
                      {item.mediaType === 'VIDEO' ? <video src={item.mediaUrl} className="w-full h-full object-cover" muted style={{ filter: 'contrast(1.05) brightness(0.95) saturate(0.9)' }} /> : <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" style={{ filter: 'contrast(1.05) brightness(0.95) saturate(0.9)' }} />}
                    </div>
                    <div className="mt-1.5 flex justify-between px-1">
                      <p className="text-[0.4rem]" style={{ color: 'rgba(168, 191, 176, 0.4)' }}>◀ {String(i + 1).padStart(2, '0')} ▶</p>
                      <p className="text-[0.4rem]" style={{ color: 'rgba(168, 191, 176, 0.4)' }}>→</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      <section id="calendar-section" className="py-24 px-6" style={{ background: '#1A1D1C' }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto">
          <p className="text-center text-[0.85rem] mb-8" style={{ ...titleFont, color: '#A8BFB0' }}>{calendarData.year}. {String(calendarData.month).padStart(2, '0')}</p>
          <div className="p-6" style={{ background: 'rgba(20, 25, 22, 0.8)', border: '1px solid rgba(100, 130, 110, 0.1)' }}>
            <div className="grid grid-cols-7 text-center text-[0.55rem] mb-3" style={serifFont}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="py-2" style={{ color: i === 0 ? '#7A8A80' : '#5A6B60' }}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 text-center text-[0.75rem]" style={serifFont}>
              {calendarData.weeks.flat().map((day, i) => <span key={i} className="py-2.5 flex items-center justify-center" style={{ color: day === calendarData.targetDay ? '#1A1D1C' : day ? '#8A9B90' : 'transparent', background: day === calendarData.targetDay ? '#A8BFB0' : 'transparent', borderRadius: '50%', width: day === calendarData.targetDay ? '1.8rem' : 'auto', height: day === calendarData.targetDay ? '1.8rem' : 'auto', margin: day === calendarData.targetDay ? '0 auto' : '0' }}>{day || ''}</span>)}
            </div>
            <div className="mt-8 text-center">
              <p className="text-[0.75rem]" style={{ ...titleFont, color: '#D4E0D8' }}>{formatDate(wedding.weddingDate, 'korean')}</p>
              <p className="text-[0.65rem] mt-2" style={{ ...serifFont, color: '#6A7B70' }}>{formatTime(wedding.weddingTime)}</p>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="venue-section" className="py-24 px-6" style={{ background: '#161918' }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto text-center">
          <p className="text-[1rem] mb-10" style={{ ...titleFont, color: '#A8BFB0' }}>Location</p>
          <div className="mb-8">
            <p className="text-[0.85rem]" style={{ ...serifFont, color: '#D4E0D8' }}>{wedding.venue}</p>
            {wedding.venueHall && <p className="text-[0.75rem] mt-1" style={{ ...serifFont, color: '#788C80' }}>{wedding.venueHall}</p>}
            {wedding.venueAddress && <p className="text-[0.65rem] mt-3" style={{ ...serifFont, color: '#5A6B60' }}>{wedding.venueAddress}</p>}
          </div>
          {wedding.venueAddress && (
            <div className="aspect-[4/3] mb-8" style={{ border: '1px solid rgba(100, 130, 110, 0.15)' }}>
              <KakaoMap address={wedding.venueAddress} className="w-full h-full" />
            </div>
          )}
          <div className="flex justify-center gap-3">
            {wedding.venueNaverMap && <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-[0.6rem] transition-all" style={{ ...serifFont, color: '#A8BFB0', background: 'rgba(100, 130, 110, 0.1)', border: '1px solid rgba(100, 130, 110, 0.2)' }}>NAVER</a>}
            {wedding.venueKakaoMap && <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-[0.6rem] transition-all" style={{ ...serifFont, color: '#A8BFB0', background: 'rgba(100, 130, 110, 0.1)', border: '1px solid rgba(100, 130, 110, 0.2)' }}>KAKAO</a>}
          </div>
          {wedding.venuePhone && <a href={`tel:${wedding.venuePhone}`} className="flex items-center justify-center gap-2 mt-8 text-[0.65rem]" style={{ ...serifFont, color: '#6A7B70' }}><Phone className="w-3.5 h-3.5" /> {wedding.venuePhone}</a>}
        </motion.div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section id="account-section" className="py-24 px-6" style={{ background: '#1A1D1C' }}>
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto">
            <p className="text-[1rem] text-center mb-10" style={{ ...titleFont, color: '#A8BFB0' }}>Gift</p>
            <div className="space-y-3">
              {wedding.groomAccount && (
                <div style={{ background: 'rgba(20, 25, 22, 0.8)', border: '1px solid rgba(100, 130, 110, 0.1)' }}>
                  <button onClick={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} className="w-full px-5 py-4 flex items-center justify-between">
                    <span className="text-[0.75rem]" style={{ ...titleFont, color: '#A8BFB0' }}>신랑측</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openAccount === 'groom' ? 'rotate-180' : ''}`} style={{ color: '#5A6B60' }} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'groom' && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-4" style={{ borderTop: '1px solid rgba(100, 130, 110, 0.1)' }}>
                          <div className="flex items-center justify-between pt-4">
                            <div style={serifFont}><p className="text-[0.6rem]" style={{ color: '#5A6B60' }}>{wedding.groomBank}</p><p className="text-[0.75rem]" style={{ color: '#D4E0D8' }}>{wedding.groomAccount}</p><p className="text-[0.6rem]" style={{ color: '#6A7B70' }}>{wedding.groomAccountHolder}</p></div>
                            <button onClick={() => copyToClipboard(`${wedding.groomBank} ${wedding.groomAccount}`, 'groom')} className="p-2.5 transition-all" style={{ background: 'rgba(100, 130, 110, 0.1)' }}>{copiedAccount === 'groom' ? <Check className="w-4 h-4" style={{ color: '#A8BFB0' }} /> : <Copy className="w-4 h-4" style={{ color: '#6A7B70' }} />}</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {wedding.brideAccount && (
                <div style={{ background: 'rgba(20, 25, 22, 0.8)', border: '1px solid rgba(100, 130, 110, 0.1)' }}>
                  <button onClick={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} className="w-full px-5 py-4 flex items-center justify-between">
                    <span className="text-[0.75rem]" style={{ ...titleFont, color: '#A8BFB0' }}>신부측</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openAccount === 'bride' ? 'rotate-180' : ''}`} style={{ color: '#5A6B60' }} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'bride' && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-4" style={{ borderTop: '1px solid rgba(100, 130, 110, 0.1)' }}>
                          <div className="flex items-center justify-between pt-4">
                            <div style={serifFont}><p className="text-[0.6rem]" style={{ color: '#5A6B60' }}>{wedding.brideBank}</p><p className="text-[0.75rem]" style={{ color: '#D4E0D8' }}>{wedding.brideAccount}</p><p className="text-[0.6rem]" style={{ color: '#6A7B70' }}>{wedding.brideAccountHolder}</p></div>
                            <button onClick={() => copyToClipboard(`${wedding.brideBank} ${wedding.brideAccount}`, 'bride')} className="p-2.5 transition-all" style={{ background: 'rgba(100, 130, 110, 0.1)' }}>{copiedAccount === 'bride' ? <Check className="w-4 h-4" style={{ color: '#A8BFB0' }} /> : <Copy className="w-4 h-4" style={{ color: '#6A7B70' }} />}</button>
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
                {wedding.tossLink && <a href={wedding.tossLink} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 text-[0.6rem] text-white" style={{ background: '#0064FF' }}>TOSS</a>}
                {wedding.kakaoPayLink && <a href={wedding.kakaoPayLink} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 text-[0.6rem]" style={{ background: '#FEE500', color: '#1A1D1C' }}>KAKAO</a>}
              </div>
            )}
          </motion.div>
        </section>
      )}

      <section id="rsvp-section" className="py-24 px-6" style={{ background: '#161918' }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto">
          <p className="text-[1rem] text-center mb-10" style={{ ...titleFont, color: '#A8BFB0' }}>RSVP</p>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="mirim2" />
        </motion.div>
      </section>

      <section id="guestbook-section" className="py-24 px-6" style={{ background: '#1A1D1C' }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto">
          <p className="text-[1rem] text-center mb-10" style={{ ...titleFont, color: '#A8BFB0' }}>Guestbook</p>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="mirim2" />
          {localGuestbooks.length > 0 && <div className="mt-10"><GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="mirim2" /></div>}
        </motion.div>
      </section>

      <section className="py-20 px-6" style={{ background: '#161918' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="max-w-sm mx-auto">
          <div className="flex justify-center gap-12 mb-12">
            {wedding.groomPhone && <a href={`tel:${wedding.groomPhone}`} className="text-center"><div className="w-14 h-14 flex items-center justify-center mb-2 transition-all" style={{ background: 'rgba(100, 130, 110, 0.1)', border: '1px solid rgba(100, 130, 110, 0.2)' }}><Phone className="w-5 h-5" style={{ color: '#A8BFB0' }} /></div><p className="text-[0.6rem]" style={{ ...titleFont, color: '#6A7B70' }}>GROOM</p></a>}
            {wedding.bridePhone && <a href={`tel:${wedding.bridePhone}`} className="text-center"><div className="w-14 h-14 flex items-center justify-center mb-2 transition-all" style={{ background: 'rgba(100, 130, 110, 0.1)', border: '1px solid rgba(100, 130, 110, 0.2)' }}><Phone className="w-5 h-5" style={{ color: '#A8BFB0' }} /></div><p className="text-[0.6rem]" style={{ ...titleFont, color: '#6A7B70' }}>BRIDE</p></a>}
          </div>
          <button onClick={() => setShowShareModal(true)} className="w-full py-4 text-[0.7rem] flex items-center justify-center gap-2 transition-all" style={{ ...titleFont, color: '#A8BFB0', background: 'rgba(100, 130, 110, 0.1)', border: '1px solid rgba(100, 130, 110, 0.2)' }}><Share2 className="w-4 h-4" /> SHARE</button>
        </motion.div>
      </section>

      <footer className="py-12 text-center" style={{ background: "#0F1210" }}><a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-[0.5rem] tracking-[0.3em] hover:opacity-70 transition-opacity" style={{ ...serifFont, color: "#2A3B30" }}>Made by 청첩장 작업실 ›</a></footer>

      {galleryIndex !== null && galleries.length > 0 && <GalleryModal galleries={galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="GALLERY_MIRIM_2" />}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="dark" />
    </div>
  );
}

declare global { interface Window { Kakao?: any; } }
