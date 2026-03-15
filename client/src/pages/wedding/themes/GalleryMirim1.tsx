import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

export default function GalleryMirim1({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot }: ThemeProps) {
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
      @import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap');
      @font-face {
        font-family: 'MapoFlowerIsland';
        src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/MapoFlowerIslandA.woff') format('woff');
        font-weight: normal;
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
      window.Kakao.Share.sendDefault({ objectType: 'feed', content: { title, description: formatDate(wedding.weddingDate, 'korean'), imageUrl: wedding.ogCoverType === 'envelope' ? ({"black_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/7_errq8w.png", "white_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "navy_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/1_zdaupp.png", "black_silver": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "olive_ribbon_a": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/3_wdfeio.png", "olive_ribbon_b": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png", "pink_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/5_pzmfwy.png", "white_bow": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/11_o3gnaj.png", "white_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "black_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "pink_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551604/6_akrfek.png", "olive_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png"}[wedding.envelopeStyle || 'black_ribbon'] || wedding.heroMedia || '') : (wedding.heroMedia || ''), link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }] });
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
  const serifFont = { fontFamily: "'Nanum Myeongjo', serif" };
  const titleFont = { fontFamily: "'MapoFlowerIsland', serif" };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #FAF6F1 0%, #F5EDE4 50%, #F0E8DD 100%)' }}>
      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.12]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      <div className="fixed inset-0 pointer-events-none z-20 opacity-[0.03]" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(180, 140, 100, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(160, 120, 80, 0.3) 0%, transparent 50%)' }} />

      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(245, 237, 228, 0.95)', boxShadow: '0 2px 12px rgba(139, 115, 85, 0.15)' }}>
          {isPlaying ? <Volume2 className="w-4 h-4" style={{ color: '#8B7355' }} /> : <VolumeX className="w-4 h-4" style={{ color: '#C4B09A' }} />}
        </button>
      )}

      <section className="min-h-screen flex flex-col justify-center items-center px-6 py-20 relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }} className="text-center w-full max-w-sm">
          {wedding.heroMedia && (
            <div className="relative mb-10">
              <div className="absolute -inset-3 rounded-sm" style={{ background: 'linear-gradient(135deg, rgba(212, 196, 176, 0.3) 0%, rgba(201, 184, 150, 0.2) 100%)', filter: 'blur(8px)' }} />
              <div className="relative p-3" style={{ background: 'linear-gradient(145deg, #FFFEF9 0%, #F8F4EC 100%)', boxShadow: '0 8px 32px rgba(139, 115, 85, 0.12), 0 2px 8px rgba(139, 115, 85, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
                <div className="aspect-[3/4] overflow-hidden relative">
                  {wedding.heroMediaType === 'VIDEO' ? (
                    <video src={heroUrl(wedding.heroMedia)} autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: 'sepia(0.08) contrast(0.98) brightness(1.01)' }} />
                  ) : (
                    <img src={heroUrl(wedding.heroMedia)} alt="" className="w-full h-full object-cover" style={{ filter: 'sepia(0.08) contrast(0.98) brightness(1.01)' }} />
                  )}
                  <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 60px rgba(139, 115, 85, 0.08)' }} />
                </div>
                <div className="absolute bottom-4 right-4 text-right">
                  <p className="text-[0.55rem] tracking-[0.15em]" style={{ ...serifFont, color: 'rgba(139, 115, 85, 0.35)' }}>FILM NO. 001</p>
                </div>
              </div>
              <div className="absolute -left-1 top-6 w-6 h-8 rounded-sm opacity-70" style={{ background: 'linear-gradient(180deg, #D4C4B0 0%, #C9B896 100%)', transform: 'rotate(-8deg)', boxShadow: '0 2px 6px rgba(139, 115, 85, 0.2)' }} />
              <div className="absolute -right-1 top-1/3 w-6 h-7 rounded-sm opacity-60" style={{ background: 'linear-gradient(180deg, #E8DFD0 0%, #D4C4B0 100%)', transform: 'rotate(5deg)', boxShadow: '0 2px 6px rgba(139, 115, 85, 0.15)' }} />
            </div>
          )}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }}>
            <p className="text-[0.6rem] tracking-[0.4em] mb-6" style={{ ...serifFont, color: '#B8A080' }}>W E D D I N G</p>
            <div className="flex items-center justify-center gap-5 mb-4">
              <span className="text-[1.5rem]" style={{ ...titleFont, color: '#6B5A48' }}>{wedding.groomName}</span>
              <span className="text-[0.9rem]" style={{ color: '#C4B09A' }}>&</span>
              <span className="text-[1.5rem]" style={{ ...titleFont, color: '#6B5A48' }}>{wedding.brideName}</span>
            </div>
            <div className="w-12 h-px mx-auto mb-4" style={{ background: 'linear-gradient(90deg, transparent, #C4B09A, transparent)' }} />
            <p className="text-[0.75rem] tracking-wide" style={{ ...serifFont, color: '#9A8A74' }}>{formatDate(wedding.weddingDate, 'dots')}</p>
            {wedding.showDday && <p className="mt-3 text-[0.65rem]" style={{ ...serifFont, color: '#C4B09A' }}>{getDday(wedding.weddingDate)}</p>}
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-10">
          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: '#C4B09A' }} />
        </motion.div>
      </section>

      {wedding.greeting && (
        <section id="greeting-section" className="py-20 px-6">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-sm mx-auto">
            <div className="relative p-8" style={{ background: 'linear-gradient(145deg, #FFFEF9 0%, #FAF6F1 100%)', boxShadow: '0 4px 24px rgba(139, 115, 85, 0.1), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
              <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, #D4C4B0, #C9B896, #D4C4B0)' }} />
              {wedding.greetingTitle && <p className="text-[1rem] mb-8 leading-relaxed text-center" style={{ ...titleFont, color: '#6B5A48' }}>{wedding.greetingTitle}</p>}
              <p className="text-[0.85rem] leading-[2.2] whitespace-pre-line text-center" style={{ ...serifFont, color: '#7A6A58' }}>{wedding.greeting}</p>
              {wedding.showParents && (
                <div className="mt-10 pt-8" style={{ borderTop: '1px solid rgba(196, 176, 154, 0.3)' }}>
                  <div className="space-y-3 text-center" style={serifFont}>
                    <p className="text-[0.75rem]" style={{ color: '#9A8A74' }}><span style={{ color: '#B8A080' }}>{wedding.groomFatherName} · {wedding.groomMotherName}</span><span className="mx-2" style={{ color: '#C4B09A' }}>의 아들</span><span style={{ color: '#6B5A48' }}>{wedding.groomName}</span></p>
                    <p className="text-[0.75rem]" style={{ color: '#9A8A74' }}><span style={{ color: '#B8A080' }}>{wedding.brideFatherName} · {wedding.brideMotherName}</span><span className="mx-2" style={{ color: '#C4B09A' }}>의 딸</span><span style={{ color: '#6B5A48' }}>{wedding.brideName}</span></p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </section>
      )}

      {wedding.loveStoryVideo && (
        <section className="py-16 px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto">
            <p className="text-center text-[1rem] mb-8" style={{ ...titleFont, color: '#6B5A48' }}>Our Story</p>
            <div className="relative p-2" style={{ background: 'linear-gradient(145deg, #FFFEF9 0%, #F8F4EC 100%)', boxShadow: '0 6px 20px rgba(139, 115, 85, 0.12)' }}>
              {wedding.loveStoryVideo.includes('youtube') || wedding.loveStoryVideo.includes('youtu.be') ? (
                <iframe
                  src={wedding.loveStoryVideo.includes('youtu.be') ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split('youtu.be/')[1]?.split('?')[0]}` : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split('watch?v=')[1]?.split('&')[0]}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" allowFullScreen className="w-full aspect-video" style={{ border: 'none' }}
                />
              ) : (
                <video src={wedding.loveStoryVideo} controls playsInline className="w-full aspect-video object-cover" style={{ filter: 'sepia(0.06) contrast(0.97) brightness(1.01)' }} />
              )}
            </div>
          </motion.div>
        </section>
      )}

      {galleries.length > 0 && (
        <section id="gallery-section" className="py-20 px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-center text-[1rem] mb-12" style={{ ...titleFont, color: '#6B5A48' }}>우리의 기록</p>
            <div className="max-w-md mx-auto space-y-4">
              {galleries.map((item, i) => {
                const isWide = i === 0 || i === 3;
                const rotations = [-1.5, 1, -0.5, 1.5, -1, 0.5];
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }} onClick={() => setGalleryIndex(i)} className="cursor-pointer mx-auto" style={{ maxWidth: isWide ? '100%' : '75%', marginLeft: i % 2 === 0 ? '0' : 'auto', marginRight: i % 2 === 0 ? 'auto' : '0' }}>
                    <div className="relative p-2" style={{ background: 'linear-gradient(145deg, #FFFEF9 0%, #F8F4EC 100%)', boxShadow: '0 6px 20px rgba(139, 115, 85, 0.12), 0 2px 6px rgba(139, 115, 85, 0.08)', transform: `rotate(${rotations[i % 6]}deg)` }}>
                      <div className={`overflow-hidden ${isWide ? 'aspect-[4/3]' : 'aspect-[3/4]'}`}>
                        {item.mediaType === 'VIDEO' ? <video src={item.mediaUrl} className="w-full h-full object-cover" muted style={{ filter: 'sepia(0.06) contrast(0.97) brightness(1.01)' }} /> : <img src={galleryThumbUrl(item.mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover" style={{ filter: 'sepia(0.06) contrast(0.97) brightness(1.01)' }} />}
                      </div>
                      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 40px rgba(139, 115, 85, 0.05)' }} />
                      <div className="mt-2 text-right pr-1"><p className="text-[0.5rem] tracking-[0.1em]" style={{ ...serifFont, color: 'rgba(139, 115, 85, 0.35)' }}>NO. {String(i + 1).padStart(2, '0')}</p></div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>
      )}

      <section id="calendar-section" className="py-20 px-6">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto">
          <div className="p-6" style={{ background: 'linear-gradient(145deg, #FFFEF9 0%, #FAF6F1 100%)', boxShadow: '0 4px 24px rgba(139, 115, 85, 0.1)' }}>
            <p className="text-center text-[0.85rem] mb-6" style={{ ...titleFont, color: '#6B5A48' }}>{calendarData.year}년 {calendarData.month}월</p>
            <div className="grid grid-cols-7 text-center text-[0.6rem] mb-3" style={serifFont}>
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => <span key={i} className="py-2" style={{ color: i === 0 ? '#C9A080' : '#B8A080' }}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 text-center text-[0.75rem]" style={serifFont}>
              {calendarData.weeks.flat().map((day, i) => <span key={i} className="py-2 flex items-center justify-center" style={{ color: day === calendarData.targetDay ? '#FFFEF9' : day ? '#7A6A58' : 'transparent', background: day === calendarData.targetDay ? 'linear-gradient(135deg, #8B7355 0%, #6B5A48 100%)' : 'transparent', borderRadius: '50%', width: day === calendarData.targetDay ? '1.8rem' : 'auto', height: day === calendarData.targetDay ? '1.8rem' : 'auto', margin: day === calendarData.targetDay ? '0 auto' : '0' }}>{day || ''}</span>)}
            </div>
            <div className="mt-6 text-center">
              <p className="text-[0.8rem]" style={{ ...titleFont, color: '#6B5A48' }}>{formatDate(wedding.weddingDate, 'korean')}</p>
              <p className="text-[0.7rem] mt-2" style={{ ...serifFont, color: '#9A8A74' }}>{formatTime(wedding.weddingTime)}</p>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="venue-section" className="py-20 px-6" style={{ background: 'rgba(250, 246, 241, 0.6)' }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto text-center">
          <p className="text-[1rem] mb-10" style={{ ...titleFont, color: '#6B5A48' }}>오시는 길</p>
          <div className="mb-6">
            <p className="text-[0.9rem]" style={{ ...serifFont, color: '#6B5A48' }}>{wedding.venue}</p>
            {wedding.venueHall && <p className="text-[0.8rem] mt-1" style={{ ...serifFont, color: '#9A8A74' }}>{wedding.venueHall}</p>}
            {wedding.venueAddress && <p className="text-[0.7rem] mt-3" style={{ ...serifFont, color: '#B8A080' }}>{wedding.venueAddress}</p>}
          </div>
          {wedding.venueAddress && (
            <div className="aspect-[4/3] mb-6 p-2" style={{ background: 'linear-gradient(145deg, #FFFEF9 0%, #F8F4EC 100%)', boxShadow: '0 4px 20px rgba(139, 115, 85, 0.1)' }}>
              <KakaoMap address={wedding.venueAddress} venue={wedding.venue} latitude={wedding.venueLatitude} longitude={wedding.venueLongitude} className="w-full h-full" />
            </div>
          )}
          <div className="flex justify-center gap-2">
            {wedding.venueNaverMap && <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-[0.65rem] rounded-full transition-all" style={{ ...serifFont, color: '#6B5A48', background: '#FFFEF9', border: '1px solid rgba(196, 176, 154, 0.5)', boxShadow: '0 2px 8px rgba(139, 115, 85, 0.08)' }}>네이버지도</a>}
            {wedding.venueKakaoMap && <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-[0.65rem] rounded-full transition-all" style={{ ...serifFont, color: '#6B5A48', background: '#FFFEF9', border: '1px solid rgba(196, 176, 154, 0.5)', boxShadow: '0 2px 8px rgba(139, 115, 85, 0.08)' }}>카카오맵</a>}
          </div>
          {wedding.venuePhone && <a href={`tel:${wedding.venuePhone}`} className="flex items-center justify-center gap-2 mt-6 text-[0.7rem]" style={{ ...serifFont, color: '#9A8A74' }}><Phone className="w-3.5 h-3.5" /> {wedding.venuePhone}</a>}
        </motion.div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section id="account-section" className="py-20 px-6">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto">
            <p className="text-[1rem] text-center mb-10" style={{ ...titleFont, color: '#6B5A48' }}>마음 전하실 곳</p>
            <div className="space-y-3">
              {wedding.groomAccount && (
                <div style={{ background: 'linear-gradient(145deg, #FFFEF9 0%, #FAF6F1 100%)', boxShadow: '0 4px 20px rgba(139, 115, 85, 0.08)' }}>
                  <button onClick={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} className="w-full px-5 py-4 flex items-center justify-between">
                    <span className="text-[0.8rem]" style={{ ...titleFont, color: '#6B5A48' }}>신랑측</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openAccount === 'groom' ? 'rotate-180' : ''}`} style={{ color: '#C4B09A' }} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'groom' && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-4" style={{ borderTop: '1px solid rgba(196, 176, 154, 0.2)' }}>
                          <div className="flex items-center justify-between pt-4">
                            <div style={serifFont}><p className="text-[0.65rem]" style={{ color: '#B8A080' }}>{wedding.groomBank}</p><p className="text-[0.8rem]" style={{ color: '#6B5A48' }}>{wedding.groomAccount}</p><p className="text-[0.65rem]" style={{ color: '#9A8A74' }}>{wedding.groomAccountHolder}</p></div>
                            <button onClick={() => copyToClipboard(`${wedding.groomBank} ${wedding.groomAccount}`, 'groom')} className="p-2 rounded-full transition-all" style={{ background: 'rgba(212, 196, 176, 0.2)' }}>{copiedAccount === 'groom' ? <Check className="w-4 h-4" style={{ color: '#6B5A48' }} /> : <Copy className="w-4 h-4" style={{ color: '#B8A080' }} />}</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {wedding.brideAccount && (
                <div style={{ background: 'linear-gradient(145deg, #FFFEF9 0%, #FAF6F1 100%)', boxShadow: '0 4px 20px rgba(139, 115, 85, 0.08)' }}>
                  <button onClick={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} className="w-full px-5 py-4 flex items-center justify-between">
                    <span className="text-[0.8rem]" style={{ ...titleFont, color: '#6B5A48' }}>신부측</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openAccount === 'bride' ? 'rotate-180' : ''}`} style={{ color: '#C4B09A' }} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'bride' && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-4" style={{ borderTop: '1px solid rgba(196, 176, 154, 0.2)' }}>
                          <div className="flex items-center justify-between pt-4">
                            <div style={serifFont}><p className="text-[0.65rem]" style={{ color: '#B8A080' }}>{wedding.brideBank}</p><p className="text-[0.8rem]" style={{ color: '#6B5A48' }}>{wedding.brideAccount}</p><p className="text-[0.65rem]" style={{ color: '#9A8A74' }}>{wedding.brideAccountHolder}</p></div>
                            <button onClick={() => copyToClipboard(`${wedding.brideBank} ${wedding.brideAccount}`, 'bride')} className="p-2 rounded-full transition-all" style={{ background: 'rgba(212, 196, 176, 0.2)' }}>{copiedAccount === 'bride' ? <Check className="w-4 h-4" style={{ color: '#6B5A48' }} /> : <Copy className="w-4 h-4" style={{ color: '#B8A080' }} />}</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
            {(wedding.tossLink || wedding.kakaoPayLink) && (
              <div className="flex justify-center gap-3 mt-6">
                {wedding.tossLink && <a href={wedding.tossLink} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 text-[0.65rem] text-white rounded-full" style={{ background: 'linear-gradient(135deg, #0064FF 0%, #0050CC 100%)' }}>토스</a>}
                {wedding.kakaoPayLink && <a href={wedding.kakaoPayLink} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 text-[0.65rem] rounded-full" style={{ background: '#FEE500', color: '#3C1E1E' }}>카카오페이</a>}
              </div>
            )}
          </motion.div>
        </section>
      )}

      <section id="rsvp-section" className="py-20 px-6" style={{ background: 'rgba(250, 246, 241, 0.6)' }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto">
          <p className="text-[1rem] text-center mb-10" style={{ ...titleFont, color: '#6B5A48' }}>참석 여부</p>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="mirim1" />
        </motion.div>
      </section>

      <section id="guestbook-section" className="py-20 px-6">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto">
          <p className="text-[1rem] text-center mb-10" style={{ ...titleFont, color: '#6B5A48' }}>방명록</p>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="mirim1" />
          {localGuestbooks.length > 0 && <div className="mt-10"><GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="mirim1" /></div>}
        </motion.div>
      </section>

      {guestPhotoSlot}
      <section className="py-16 px-6" style={{ background: 'rgba(250, 246, 241, 0.6)' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="max-w-sm mx-auto">
          <div className="flex justify-center gap-10 mb-10">
            {wedding.groomPhone && <a href={`tel:${wedding.groomPhone}`} className="text-center"><div className="w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all hover:scale-105" style={{ background: '#FFFEF9', boxShadow: '0 4px 16px rgba(139, 115, 85, 0.1)' }}><Phone className="w-5 h-5" style={{ color: '#8B7355' }} /></div><p className="text-[0.65rem]" style={{ ...titleFont, color: '#9A8A74' }}>신랑</p></a>}
            {wedding.bridePhone && <a href={`tel:${wedding.bridePhone}`} className="text-center"><div className="w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all hover:scale-105" style={{ background: '#FFFEF9', boxShadow: '0 4px 16px rgba(139, 115, 85, 0.1)' }}><Phone className="w-5 h-5" style={{ color: '#8B7355' }} /></div><p className="text-[0.65rem]" style={{ ...titleFont, color: '#9A8A74' }}>신부</p></a>}
          </div>
          <button onClick={() => setShowShareModal(true)} className="w-full py-3.5 text-[0.75rem] rounded-full flex items-center justify-center gap-2 transition-all hover:scale-[1.02]" style={{ ...titleFont, color: '#6B5A48', background: '#FFFEF9', boxShadow: '0 4px 16px rgba(139, 115, 85, 0.1)', border: '1px solid rgba(196, 176, 154, 0.3)' }}><Share2 className="w-4 h-4" /> 청첩장 공유하기</button>
        </motion.div>
      </section>

      <footer className="py-12 text-center" style={{ background: "#F5EEE6" }}><a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-[0.55rem] tracking-[0.2em] hover:opacity-70 transition-opacity" style={{ ...serifFont, color: "#9A8B75" }}>Made by 청첩장 작업실 ›</a></footer>

      {galleryIndex !== null && galleries.length > 0 && <GalleryModal galleries={galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="GALLERY_MIRIM_1" usePhotoFilter={wedding.usePhotoFilter ?? true} />}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="light" />
    </div>
  );
}

declare global { interface Window { Kakao?: any; } }
