import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

const fontStyles = `
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
    <div className="min-h-screen relative" style={{ background: '#FAF8F5' }}>
      <style>{fontStyles}</style>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-[#FAF8F5]/90 backdrop-blur-sm border border-[#E8E4DD] flex items-center justify-center transition-all hover:bg-white">
          {isPlaying ? <Volume2 className="w-4 h-4 text-[#5a5a5a]" /> : <VolumeX className="w-4 h-4 text-[#aaa]" />}
        </button>
      )}

      <section className="min-h-screen flex flex-col justify-center items-center px-6 py-20 relative">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="text-center w-full max-w-md">
          
          {wedding.heroMedia && (
            <div className="relative mb-10">
              <div className="relative p-3 bg-white shadow-[0_4px_30px_rgba(0,0,0,0.06)] rotate-[-1deg]">
                <div className="aspect-[4/5] overflow-hidden">
                  {wedding.heroMediaType === 'VIDEO' ? (
                    <video src={wedding.heroMedia} autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: 'saturate(0.95) contrast(0.98)' }} />
                  ) : (
                    <img src={wedding.heroMedia} alt="" className="w-full h-full object-cover" style={{ filter: 'saturate(0.95) contrast(0.98)' }} />
                  )}
                </div>
                <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.03)' }} />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[85%] h-6 bg-black/[0.02] blur-md" />
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 1 }} className="mt-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <h1 className="text-[2rem] text-[#3f3f3f] tracking-[-0.01em]" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>{wedding.groomName}</h1>
              <span className="text-[1rem] text-[#bbb]">&</span>
              <h1 className="text-[2rem] text-[#3f3f3f] tracking-[-0.01em]" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>{wedding.brideName}</h1>
            </div>
            
            <p className="text-[0.8rem] tracking-[0.03em] text-[#7b7b7b]" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
              {formatDate(wedding.weddingDate, 'dots')}
            </p>
            <p className="text-[0.75rem] text-[#999] mt-1" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
              {formatTime(wedding.weddingTime)}
            </p>
            
            {wedding.showDday && (
              <p className="mt-4 text-[0.7rem] tracking-[0.15em] text-[#bbb]" style={{ fontFamily: 'ChosunIlboMyungjo' }}>{getDday(wedding.weddingDate)}</p>
            )}
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="absolute bottom-10">
          <ChevronDown className="w-5 h-5 text-[#ccc] animate-bounce" />
        </motion.div>
      </section>

      {wedding.greeting && (
        <section className="py-24 px-6">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-md mx-auto text-center">
            {wedding.greetingTitle && (
              <h2 className="text-[1.2rem] text-[#5a5a5a] mb-10 leading-relaxed" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>{wedding.greetingTitle}</h2>
            )}
            <p className="text-[1rem] leading-[1.85] text-[#6a6a6a] whitespace-pre-line" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>{wedding.greeting}</p>
            
            {wedding.showParents && (
              <div className="mt-16 pt-10 border-t border-[#E8E4DD]">
                <div className="space-y-4 text-[0.9rem] text-[#777]" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>
                  <p>
                    <span className="text-[#999]">{wedding.groomFatherName}</span>
                    {wedding.groomFatherName && wedding.groomMotherName && <span className="text-[#ccc] mx-1">·</span>}
                    <span className="text-[#999]">{wedding.groomMotherName}</span>
                    <span className="text-[#bbb] mx-2 text-[0.8rem]">의 아들</span>
                    <span className="text-[#5a5a5a]">{wedding.groomName}</span>
                  </p>
                  <p>
                    <span className="text-[#999]">{wedding.brideFatherName}</span>
                    {wedding.brideFatherName && wedding.brideMotherName && <span className="text-[#ccc] mx-1">·</span>}
                    <span className="text-[#999]">{wedding.brideMotherName}</span>
                    <span className="text-[#bbb] mx-2 text-[0.8rem]">의 딸</span>
                    <span className="text-[#5a5a5a]">{wedding.brideName}</span>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {galleries.length > 0 && (
        <section className="py-20 overflow-hidden">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-[0.8rem] tracking-[0.03em] text-[#7b7b7b] text-center mb-12" style={{ fontFamily: 'ChosunIlboMyungjo' }}>우리의 기록</p>
            
            <div className="relative px-4">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-[#E8E4DD]" />
              
              <div className="flex gap-4 overflow-x-auto py-8 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                {galleries.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setGalleryIndex(i)}
                    className="flex-shrink-0 cursor-pointer group"
                    style={{ scrollSnapAlign: 'center' }}
                  >
                    <div className={`bg-white p-2 shadow-[0_2px_15px_rgba(0,0,0,0.05)] transition-transform duration-500 group-hover:scale-[1.02] ${i % 2 === 0 ? 'rotate-[-2deg]' : 'rotate-[2deg]'}`}>
                      <div className="w-44 aspect-[3/4] overflow-hidden">
                        {item.mediaType === 'VIDEO' ? (
                          <video src={item.mediaUrl} className="w-full h-full object-cover" muted style={{ filter: 'saturate(0.95)' }} />
                        ) : (
                          <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" style={{ filter: 'saturate(0.95)' }} />
                        )}
                      </div>
                      <p className="text-center text-[0.65rem] text-[#aaa] mt-2 pb-1" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
                        {formatDate(wedding.weddingDate, 'short')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      )}

      <section className="py-24 px-6">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto">
          <p className="text-[0.8rem] tracking-[0.03em] text-[#7b7b7b] text-center mb-12" style={{ fontFamily: 'ChosunIlboMyungjo' }}>예식 일정</p>
          
          <div className="bg-white/60 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
            <p className="text-center text-[1rem] text-[#5a5a5a] mb-8" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>
              {calendarData.year}년 {calendarData.month}월
            </p>
            <div className="grid grid-cols-7 text-center text-[0.7rem] mb-3" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <span key={i} className={`py-2 ${i === 0 ? 'text-[#C9A96E]' : 'text-[#aaa]'}`}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center text-[0.85rem]" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>
              {calendarData.weeks.flat().map((day, i) => (
                <span key={i} className={`py-2.5 ${day === calendarData.targetDay ? 'bg-[#C9A96E] text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : day ? 'text-[#6a6a6a]' : ''}`}>
                  {day || ''}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-[0.95rem] text-[#5a5a5a]" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>{formatDate(wedding.weddingDate, 'korean')}</p>
            <p className="text-[0.85rem] text-[#888] mt-2" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>{formatTime(wedding.weddingTime)}</p>
          </div>
        </motion.div>
      </section>

      <section className="py-24 px-6 bg-white/40">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto">
          <p className="text-[0.8rem] tracking-[0.03em] text-[#7b7b7b] text-center mb-12" style={{ fontFamily: 'ChosunIlboMyungjo' }}>오시는 길</p>
          
          <div className="text-center mb-10">
            <h3 className="text-[1.1rem] text-[#5a5a5a]" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>{wedding.venue}</h3>
            {wedding.venueHall && <p className="text-[0.95rem] text-[#777] mt-2" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>{wedding.venueHall}</p>}
            {wedding.venueAddress && <p className="text-[0.8rem] text-[#999] mt-3" style={{ fontFamily: 'ChosunIlboMyungjo' }}>{wedding.venueAddress}</p>}
          </div>

          {wedding.venueAddress && (
            <div className="aspect-[4/3] mb-8 overflow-hidden shadow-[0_2px_15px_rgba(0,0,0,0.04)] bg-white p-2">
              <KakaoMap address={wedding.venueAddress} className="w-full h-full" />
            </div>
          )}

          <div className="flex justify-center gap-3">
            {wedding.venueNaverMap && (
              <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-[0.75rem] bg-white border border-[#E8E4DD] text-[#6a6a6a] hover:bg-[#5a5a5a] hover:text-white hover:border-[#5a5a5a] transition-all" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
                네이버 지도
              </a>
            )}
            {wedding.venueKakaoMap && (
              <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-[0.75rem] bg-white border border-[#E8E4DD] text-[#6a6a6a] hover:bg-[#5a5a5a] hover:text-white hover:border-[#5a5a5a] transition-all" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
                카카오맵
              </a>
            )}
            {wedding.venueTmap && (
              <a href={wedding.venueTmap} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-[0.75rem] bg-white border border-[#E8E4DD] text-[#6a6a6a] hover:bg-[#5a5a5a] hover:text-white hover:border-[#5a5a5a] transition-all" style={{ fontFamily: 'ChosunIlboMyungjo' }}>
                티맵
              </a>
            )}
          </div>

          {wedding.venuePhone && (
            <a href={`tel:${wedding.venuePhone}`} className="flex items-center justify-center gap-2 mt-8 text-[0.8rem] text-[#999]" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>
              <Phone className="w-3.5 h-3.5" /> {wedding.venuePhone}
            </a>
          )}
        </motion.div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section className="py-24 px-6">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto">
            <p className="text-[0.8rem] tracking-[0.03em] text-[#7b7b7b] text-center mb-4" style={{ fontFamily: 'ChosunIlboMyungjo' }}>마음 전하실 곳</p>
            <p className="text-[0.9rem] text-[#888] text-center mb-12" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>감사한 마음을 담아 받겠습니다</p>

            <div className="space-y-4">
              {wedding.groomAccount && (
                <div className="bg-white/70 backdrop-blur-sm border border-[#E8E4DD]">
                  <button onClick={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} className="w-full px-6 py-4 flex items-center justify-between">
                    <span className="text-[0.9rem] text-[#5a5a5a]" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>신랑측 계좌</span>
                    <ChevronDown className={`w-4 h-4 text-[#bbb] transition-transform duration-300 ${openAccount === 'groom' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'groom' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-6 pb-5 pt-2 border-t border-[#E8E4DD]">
                          <div className="flex items-center justify-between">
                            <div style={{ fontFamily: "'Jeju Myeongjo', serif" }}>
                              <p className="text-[0.8rem] text-[#999]">{wedding.groomBank}</p>
                              <p className="text-[0.9rem] text-[#5a5a5a] mt-1">{wedding.groomAccount}</p>
                              <p className="text-[0.75rem] text-[#bbb] mt-1">{wedding.groomAccountHolder}</p>
                            </div>
                            <button onClick={() => copyToClipboard(`${wedding.groomBank} ${wedding.groomAccount}`, 'groom')} className="p-2.5 hover:bg-[#F5F3F0] rounded-full transition-colors">
                              {copiedAccount === 'groom' ? <Check className="w-4 h-4 text-[#C9A96E]" /> : <Copy className="w-4 h-4 text-[#ccc]" />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {wedding.brideAccount && (
                <div className="bg-white/70 backdrop-blur-sm border border-[#E8E4DD]">
                  <button onClick={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} className="w-full px-6 py-4 flex items-center justify-between">
                    <span className="text-[0.9rem] text-[#5a5a5a]" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>신부측 계좌</span>
                    <ChevronDown className={`w-4 h-4 text-[#bbb] transition-transform duration-300 ${openAccount === 'bride' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'bride' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-6 pb-5 pt-2 border-t border-[#E8E4DD]">
                          <div className="flex items-center justify-between">
                            <div style={{ fontFamily: "'Jeju Myeongjo', serif" }}>
                              <p className="text-[0.8rem] text-[#999]">{wedding.brideBank}</p>
                              <p className="text-[0.9rem] text-[#5a5a5a] mt-1">{wedding.brideAccount}</p>
                              <p className="text-[0.75rem] text-[#bbb] mt-1">{wedding.brideAccountHolder}</p>
                            </div>
                            <button onClick={() => copyToClipboard(`${wedding.brideBank} ${wedding.brideAccount}`, 'bride')} className="p-2.5 hover:bg-[#F5F3F0] rounded-full transition-colors">
                              {copiedAccount === 'bride' ? <Check className="w-4 h-4 text-[#C9A96E]" /> : <Copy className="w-4 h-4 text-[#ccc]" />}
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
                  <a href={wedding.tossLink} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 text-[0.75rem] bg-[#0064FF] text-white rounded-sm" style={{ fontFamily: 'ChosunIlboMyungjo' }}>토스</a>
                )}
                {wedding.kakaoPayLink && (
                  <a href={wedding.kakaoPayLink} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 text-[0.75rem] bg-[#FEE500] text-[#3f3f3f] rounded-sm" style={{ fontFamily: 'ChosunIlboMyungjo' }}>카카오페이</a>
                )}
              </div>
            )}
          </motion.div>
        </section>
      )}

      <section id="rsvp" className="py-24 px-6 bg-white/40">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto">
          <p className="text-[0.8rem] tracking-[0.03em] text-[#7b7b7b] text-center mb-4" style={{ fontFamily: 'ChosunIlboMyungjo' }}>참석 여부</p>
          <p className="text-[0.9rem] text-[#888] text-center mb-12" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>소중한 분들을 위해 자리를 준비하겠습니다</p>
          
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="classic" />
        </motion.div>
      </section>

      <section id="guestbook" className="py-24 px-6">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto">
          <p className="text-[0.8rem] tracking-[0.03em] text-[#7b7b7b] text-center mb-4" style={{ fontFamily: 'ChosunIlboMyungjo' }}>방명록</p>
          <p className="text-[0.9rem] text-[#888] text-center mb-12" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>축하의 말씀을 남겨주세요</p>
          
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="classic" />
          
          {localGuestbooks.length > 0 && (
            <div className="mt-12">
              <GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="classic" />
            </div>
          )}
        </motion.div>
      </section>

      <section className="py-16 px-6 bg-white/40">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="max-w-md mx-auto">
          <div className="flex justify-center gap-10 mb-10">
            {wedding.groomPhone && (
              <a href={`tel:${wedding.groomPhone}`} className="text-center group">
                <p className="text-[0.7rem] text-[#aaa] mb-2" style={{ fontFamily: 'ChosunIlboMyungjo' }}>신랑에게</p>
                <div className="w-12 h-12 rounded-full bg-white border border-[#E8E4DD] flex items-center justify-center group-hover:bg-[#5a5a5a] group-hover:border-[#5a5a5a] transition-all">
                  <Phone className="w-4 h-4 text-[#999] group-hover:text-white transition-colors" />
                </div>
              </a>
            )}
            {wedding.bridePhone && (
              <a href={`tel:${wedding.bridePhone}`} className="text-center group">
                <p className="text-[0.7rem] text-[#aaa] mb-2" style={{ fontFamily: 'ChosunIlboMyungjo' }}>신부에게</p>
                <div className="w-12 h-12 rounded-full bg-white border border-[#E8E4DD] flex items-center justify-center group-hover:bg-[#5a5a5a] group-hover:border-[#5a5a5a] transition-all">
                  <Phone className="w-4 h-4 text-[#999] group-hover:text-white transition-colors" />
                </div>
              </a>
            )}
          </div>

          <button onClick={() => setShowShareModal(true)} className="w-full py-3.5 bg-white border border-[#E8E4DD] text-[0.8rem] text-[#6a6a6a] flex items-center justify-center gap-2 hover:bg-[#5a5a5a] hover:text-white hover:border-[#5a5a5a] transition-all" style={{ fontFamily: "'Jeju Myeongjo', serif" }}>
            <Share2 className="w-4 h-4" /> 청첩장 공유하기
          </button>
        </motion.div>
      </section>

      <footer className="py-10 text-center" style={{ background: '#FAF8F5' }}>
        <p className="text-[0.65rem] tracking-[0.2em] text-[#ccc]" style={{ fontFamily: 'ChosunIlboMyungjo' }}>청첩장 작업실</p>
      </footer>

      {galleryIndex !== null && galleries.length > 0 && (
        <GalleryModal galleries={galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} />
      )}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} variant="light" />
    </div>
  );
}

declare global { interface Window { Kakao?: any; } }
