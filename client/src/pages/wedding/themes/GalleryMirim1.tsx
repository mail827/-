import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap');
  @font-face {
    font-family: 'ChosunIlboMyungjo';
    src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_one@1.0/ChosunIlboMyungjo.woff') format('woff');
    font-weight: normal;
    font-style: normal;
  }
  @font-face {
    font-family: 'Jeju Myeongjo';
    src: url('https://fonts.gstatic.com/ea/jejumyeongjo/v1/JejuMyeongjo-Regular.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
  }
`;

export default function GalleryMirim1({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading }: ThemeProps) {
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

  const handleShare = async (type: 'kakao' | 'instagram' | 'sms') => {
    const url = window.location.href;
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

  return (
    <div className="min-h-screen bg-white">
      <style>{fontStyles}</style>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}

      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-5 right-5 z-50 w-10 h-10 bg-white/80 backdrop-blur-sm border border-black/5 flex items-center justify-center transition-all hover:bg-white">
          {isPlaying ? <Volume2 className="w-4 h-4 text-black/60" /> : <VolumeX className="w-4 h-4 text-black/30" />}
        </button>
      )}

      <section className="min-h-screen flex flex-col justify-center items-center px-6 py-20 relative">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="text-center w-full max-w-lg">
          {wedding.heroMedia && (
            <div className="relative mb-8">
              <div className="relative w-full aspect-[3/4] overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.08)]">
                {wedding.heroMediaType === 'VIDEO' ? (
                  <video src={wedding.heroMedia} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={wedding.heroMedia} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10 pointer-events-none" />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-gradient-to-b from-black/[0.02] to-transparent blur-sm" />
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }} className="mt-10">
            <p className="text-[10px] tracking-[0.5em] text-black/30 mb-6" style={{ fontFamily: 'ChosunIlboMyungjo' }}>WEDDING INVITATION</p>
            <div className="flex items-center justify-center gap-4">
              <h1 className="text-[2rem] tracking-[0.02em] text-[#111]" style={{ fontFamily: 'ChosunIlboMyungjo' }}>{wedding.groomName}</h1>
              <span className="text-[0.9rem] text-black/20 font-light">&</span>
              <h1 className="text-[2rem] tracking-[0.02em] text-[#111]" style={{ fontFamily: 'ChosunIlboMyungjo' }}>{wedding.brideName}</h1>
            </div>
            <p className="mt-6 text-[0.8rem] tracking-[0.05em] text-[#666] opacity-90" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
              {formatDate(wedding.weddingDate, 'dots')} {formatTime(wedding.weddingTime)}
            </p>
            {wedding.showDday && (
              <p className="mt-3 text-[0.75rem] tracking-[0.2em] text-black/25" style={{ fontFamily: 'ChosunIlboMyungjo' }}>{getDday(wedding.weddingDate)}</p>
            )}
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-10">
          <ChevronDown className="w-5 h-5 text-black/15 animate-bounce" />
        </motion.div>
      </section>

      {wedding.greeting && (
        <section className="py-24 px-6 bg-white">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-md mx-auto text-center">
            {wedding.greetingTitle && (
              <h2 className="text-[1.3rem] text-[#222] mb-10 leading-relaxed" style={{ fontFamily: 'ChosunIlboMyungjo' }}>{wedding.greetingTitle}</h2>
            )}
            <p className="text-[1rem] leading-[1.9] text-[#444] whitespace-pre-line" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>{wedding.greeting}</p>
            
            {wedding.showParents && (
              <div className="mt-14 pt-10 border-t border-black/5">
                <div className="space-y-3 text-[0.9rem] text-[#666]" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>
                  <p>
                    <span className="text-black/40">{wedding.groomFatherName}</span>
                    {wedding.groomFatherName && wedding.groomMotherName && <span className="text-black/20 mx-1">·</span>}
                    <span className="text-black/40">{wedding.groomMotherName}</span>
                    <span className="text-black/25 mx-2 text-[0.8rem]">의 아들</span>
                    <span className="text-[#333]">{wedding.groomName}</span>
                  </p>
                  <p>
                    <span className="text-black/40">{wedding.brideFatherName}</span>
                    {wedding.brideFatherName && wedding.brideMotherName && <span className="text-black/20 mx-1">·</span>}
                    <span className="text-black/40">{wedding.brideMotherName}</span>
                    <span className="text-black/25 mx-2 text-[0.8rem]">의 딸</span>
                    <span className="text-[#333]">{wedding.brideName}</span>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {galleries.length > 0 && (
        <section className="py-20 bg-white overflow-hidden">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-[10px] tracking-[0.5em] text-black/30 text-center mb-10" style={{ fontFamily: 'ChosunIlboMyungjo' }}>GALLERY</p>
            
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-4 bg-[#1a1a1a] flex items-center justify-around px-2 z-10">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-white/20" />
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#1a1a1a] flex items-center justify-around px-2 z-10">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-white/20" />
                ))}
              </div>
              
              <div className="flex gap-1 overflow-x-auto py-6 px-4 bg-[#1a1a1a] scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                {galleries.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setGalleryIndex(i)}
                    className="flex-shrink-0 cursor-pointer group"
                    style={{ scrollSnapAlign: 'center' }}
                  >
                    <div className="w-48 aspect-[3/4] overflow-hidden bg-white p-1">
                      {item.mediaType === 'VIDEO' ? (
                        <video src={item.mediaUrl} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={item.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      )}
                    </div>
                    <p className="text-center text-[0.7rem] text-white/40 mt-2 tracking-wider" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
                      {String(i + 1).padStart(2, '0')}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      )}

      <section className="py-24 px-6 bg-white">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto">
          <p className="text-[10px] tracking-[0.5em] text-black/30 text-center mb-12" style={{ fontFamily: 'ChosunIlboMyungjo' }}>CALENDAR</p>
          
          <div className="bg-black/[0.01] p-8">
            <p className="text-center text-[1rem] text-[#333] mb-8" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
              {calendarData.year}. {String(calendarData.month).padStart(2, '0')}
            </p>
            <div className="grid grid-cols-7 text-center text-[0.75rem] mb-3" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className={`py-2 ${i === 0 ? 'text-red-400/60' : 'text-black/30'}`}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center text-[0.85rem]" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>
              {calendarData.weeks.flat().map((day, i) => (
                <span key={i} className={`py-2 ${day === calendarData.targetDay ? 'bg-[#111] text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : day ? 'text-black/50' : ''}`}>
                  {day || ''}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-[0.95rem] text-[#333]" style={{ fontFamily: 'ChosunIlboMyungjo' }}>{formatDate(wedding.weddingDate, 'korean')}</p>
            <p className="text-[0.85rem] text-[#666] mt-2" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>{formatTime(wedding.weddingTime)}</p>
          </div>
        </motion.div>
      </section>

      <section className="py-24 px-6 bg-black/[0.01]">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto">
          <p className="text-[10px] tracking-[0.5em] text-black/30 text-center mb-12" style={{ fontFamily: 'ChosunIlboMyungjo' }}>LOCATION</p>
          
          <div className="text-center mb-10">
            <h3 className="text-[1.2rem] text-[#222]" style={{ fontFamily: 'ChosunIlboMyungjo' }}>{wedding.venue}</h3>
            {wedding.venueHall && <p className="text-[0.95rem] text-[#555] mt-2" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>{wedding.venueHall}</p>}
            {wedding.venueAddress && <p className="text-[0.8rem] text-[#888] mt-3" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>{wedding.venueAddress}</p>}
          </div>

          {wedding.venueAddress && (
            <div className="aspect-[4/3] mb-8 overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
              <KakaoMap address={wedding.venueAddress} />
            </div>
          )}

          <div className="flex justify-center gap-3">
            {wedding.venueNaverMap && (
              <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-[0.75rem] border border-black/10 text-black/60 hover:bg-black hover:text-white transition-all" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
                네이버 지도
              </a>
            )}
            {wedding.venueKakaoMap && (
              <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-[0.75rem] border border-black/10 text-black/60 hover:bg-black hover:text-white transition-all" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
                카카오맵
              </a>
            )}
            {wedding.venueTmap && (
              <a href={wedding.venueTmap} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-[0.75rem] border border-black/10 text-black/60 hover:bg-black hover:text-white transition-all" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
                티맵
              </a>
            )}
          </div>

          {wedding.venuePhone && (
            <a href={`tel:${wedding.venuePhone}`} className="flex items-center justify-center gap-2 mt-8 text-[0.8rem] text-[#888]" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>
              <Phone className="w-3.5 h-3.5" /> {wedding.venuePhone}
            </a>
          )}
        </motion.div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section className="py-24 px-6 bg-white">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto">
            <p className="text-[10px] tracking-[0.5em] text-black/30 text-center mb-4" style={{ fontFamily: 'ChosunIlboMyungjo' }}>GIFT</p>
            <p className="text-[0.9rem] text-[#666] text-center mb-12" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>마음 전하실 곳</p>

            <div className="space-y-4">
              {wedding.groomAccount && (
                <div className="border border-black/5 bg-black/[0.01]">
                  <button onClick={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} className="w-full px-6 py-4 flex items-center justify-between">
                    <span className="text-[0.9rem] text-[#444]" style={{ fontFamily: 'ChosunIlboMyungjo' }}>신랑측 계좌</span>
                    <ChevronDown className={`w-4 h-4 text-black/30 transition-transform duration-300 ${openAccount === 'groom' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'groom' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-6 pb-5 pt-2 border-t border-black/5">
                          <div className="flex items-center justify-between">
                            <div style={{ fontFamily: "'Jeju Myeongjo', serif" }}>
                              <p className="text-[0.8rem] text-[#888]">{wedding.groomBank}</p>
                              <p className="text-[0.9rem] text-[#444] mt-1">{wedding.groomAccount}</p>
                              <p className="text-[0.75rem] text-[#aaa] mt-1">{wedding.groomAccountHolder}</p>
                            </div>
                            <button onClick={() => copyToClipboard(`${wedding.groomBank} ${wedding.groomAccount}`, 'groom')} className="p-2.5 hover:bg-black/5 transition-colors">
                              {copiedAccount === 'groom' ? <Check className="w-4 h-4 text-black/50" /> : <Copy className="w-4 h-4 text-black/25" />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {wedding.brideAccount && (
                <div className="border border-black/5 bg-black/[0.01]">
                  <button onClick={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} className="w-full px-6 py-4 flex items-center justify-between">
                    <span className="text-[0.9rem] text-[#444]" style={{ fontFamily: 'ChosunIlboMyungjo' }}>신부측 계좌</span>
                    <ChevronDown className={`w-4 h-4 text-black/30 transition-transform duration-300 ${openAccount === 'bride' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'bride' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-6 pb-5 pt-2 border-t border-black/5">
                          <div className="flex items-center justify-between">
                            <div style={{ fontFamily: "'Jeju Myeongjo', serif" }}>
                              <p className="text-[0.8rem] text-[#888]">{wedding.brideBank}</p>
                              <p className="text-[0.9rem] text-[#444] mt-1">{wedding.brideAccount}</p>
                              <p className="text-[0.75rem] text-[#aaa] mt-1">{wedding.brideAccountHolder}</p>
                            </div>
                            <button onClick={() => copyToClipboard(`${wedding.brideBank} ${wedding.brideAccount}`, 'bride')} className="p-2.5 hover:bg-black/5 transition-colors">
                              {copiedAccount === 'bride' ? <Check className="w-4 h-4 text-black/50" /> : <Copy className="w-4 h-4 text-black/25" />}
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
                {wedding.tossLink && (
                  <a href={wedding.tossLink} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 text-[0.75rem] bg-[#0064FF] text-white" style={{ fontFamily: 'ChosunIlboMyungjo' }}>토스</a>
                )}
                {wedding.kakaoPayLink && (
                  <a href={wedding.kakaoPayLink} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 text-[0.75rem] bg-[#FEE500] text-black/80" style={{ fontFamily: 'ChosunIlboMyungjo' }}>카카오페이</a>
                )}
              </div>
            )}
          </motion.div>
        </section>
      )}

      <section id="rsvp" className="py-24 px-6 bg-black/[0.01]">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto">
          <p className="text-[10px] tracking-[0.5em] text-black/30 text-center mb-4" style={{ fontFamily: 'ChosunIlboMyungjo' }}>RSVP</p>
          <p className="text-[0.9rem] text-[#666] text-center mb-12" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>참석 여부를 알려주세요</p>
          
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="minimal" />
        </motion.div>
      </section>

      <section id="guestbook" className="py-24 px-6 bg-white">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto">
          <p className="text-[10px] tracking-[0.5em] text-black/30 text-center mb-4" style={{ fontFamily: 'ChosunIlboMyungjo' }}>GUESTBOOK</p>
          <p className="text-[0.9rem] text-[#666] text-center mb-12" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>축하 메시지를 남겨주세요</p>
          
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="minimal" />
          
          {localGuestbooks.length > 0 && (
            <div className="mt-12">
              <GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="minimal" />
            </div>
          )}
        </motion.div>
      </section>

      <section className="py-16 px-6 bg-black/[0.01]">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="max-w-md mx-auto">
          <div className="flex justify-center gap-8 mb-10">
            {wedding.groomPhone && (
              <a href={`tel:${wedding.groomPhone}`} className="text-center group">
                <p className="text-[0.7rem] text-black/40 mb-2" style={{ fontFamily: 'ChosunIlboMyungjo' }}>신랑</p>
                <div className="w-12 h-12 border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all">
                  <Phone className="w-4 h-4 text-black/40 group-hover:text-white transition-colors" />
                </div>
              </a>
            )}
            {wedding.bridePhone && (
              <a href={`tel:${wedding.bridePhone}`} className="text-center group">
                <p className="text-[0.7rem] text-black/40 mb-2" style={{ fontFamily: 'ChosunIlboMyungjo' }}>신부</p>
                <div className="w-12 h-12 border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all">
                  <Phone className="w-4 h-4 text-black/40 group-hover:text-white transition-colors" />
                </div>
              </a>
            )}
          </div>

          <button onClick={() => setShowShareModal(true)} className="w-full py-3.5 border border-black/10 text-[0.8rem] text-black/60 flex items-center justify-center gap-2 hover:bg-black hover:text-white hover:border-black transition-all" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
            <Share2 className="w-4 h-4" /> 공유하기
          </button>
        </motion.div>
      </section>

      <footer className="py-10 text-center bg-white">
        <p className="text-[0.65rem] tracking-[0.3em] text-black/15" style={{ fontFamily: 'ChosunIlboMyungjo' }}>청첩장 작업실</p>
      </footer>

      {galleryIndex !== null && galleries.length > 0 && (
        <GalleryModal galleries={galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} />
      )}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} variant="light" />
    </div>
  );
}

declare global { interface Window { Kakao?: any; } }
