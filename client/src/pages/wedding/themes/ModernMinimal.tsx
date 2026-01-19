import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

const fontStyles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
`;

export default function ModernMinimal({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading }: ThemeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [openAccount, setOpenAccount] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [localGuestbooks, setLocalGuestbooks] = useState(guestbooks || []);

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
    const title = `${wedding.groomName} · ${wedding.brideName}`;
    if (type === 'kakao' && window.Kakao) {
      window.Kakao.Share.sendDefault({ objectType: 'feed', content: { title, description: formatDate(wedding.weddingDate, 'dots'), imageUrl: wedding.heroMedia || '', link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }] });
    } else if (type === 'instagram') {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.');
    } else if (type === 'sms') {
      window.location.href = `sms:?&body=${encodeURIComponent(`${title}\n${url}`)}`;
    }
    setShowShareModal(false);
  };

  const calendarData = getCalendarData(wedding.weddingDate);
  const galleryImages = wedding.galleries?.filter(g => g.mediaType === 'IMAGE').map(g => g.mediaUrl) || [];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <style>{fontStyles}</style>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center">
          {isPlaying ? <Volume2 className="w-4 h-4 text-black" /> : <VolumeX className="w-4 h-4 text-black/30" />}
        </button>
      )}

      <section className="min-h-screen flex flex-col justify-center px-8 py-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} className="text-center">
          <p className="text-[10px] tracking-[0.5em] text-black/40 mb-12">WEDDING INVITATION</p>
          
          {wedding.heroMedia && (
            <div className="mb-12">
              <div className="relative w-full max-w-xs mx-auto aspect-[3/4] overflow-hidden">
                {wedding.heroMediaType === 'VIDEO' ? (
                  <video src={wedding.heroMedia} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={wedding.heroMedia} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-center gap-6">
              <span className="text-[28px] font-extralight tracking-wide">{wedding.groomName}</span>
              <span className="text-[12px] text-black/30">&</span>
              <span className="text-[28px] font-extralight tracking-wide">{wedding.brideName}</span>
            </div>
            
            <div className="w-8 h-px bg-black/20 mx-auto" />
            
            <div className="space-y-1">
              <p className="text-[13px] font-light text-black/60">{formatDate(wedding.weddingDate, 'korean')}</p>
              <p className="text-[12px] font-light text-black/40">{formatTime(wedding.weddingTime)}</p>
            </div>

            {wedding.showDday && (
              <p className="text-[11px] tracking-[0.2em] text-black/30 pt-4">{getDday(wedding.weddingDate)}</p>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown className="w-5 h-5 text-black/20 animate-bounce" />
        </motion.div>
      </section>

      {wedding.greeting && (
        <section className="py-20 px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-sm mx-auto text-center">
            {wedding.greetingTitle && (
              <p className="text-[15px] font-light leading-relaxed text-black/80 mb-8 whitespace-pre-line">{wedding.greetingTitle}</p>
            )}
            <p className="text-[13px] font-light leading-[2] text-black/50 whitespace-pre-line">{wedding.greeting}</p>

            {wedding.showParents && (
              <div className="mt-12 pt-8 border-t border-black/5">
                <div className="space-y-4 text-[12px] font-light text-black/50">
                  <p>
                    {wedding.groomFatherName && <span>{wedding.groomFatherName}</span>}
                    {wedding.groomFatherName && wedding.groomMotherName && <span> · </span>}
                    {wedding.groomMotherName && <span>{wedding.groomMotherName}</span>}
                    <span className="text-black/30 ml-2">의 아들</span>
                    <span className="text-black/70 ml-2">{wedding.groomName}</span>
                  </p>
                  <p>
                    {wedding.brideFatherName && <span>{wedding.brideFatherName}</span>}
                    {wedding.brideFatherName && wedding.brideMotherName && <span> · </span>}
                    {wedding.brideMotherName && <span>{wedding.brideMotherName}</span>}
                    <span className="text-black/30 ml-2">의 딸</span>
                    <span className="text-black/70 ml-2">{wedding.brideName}</span>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {galleryImages.length > 0 && (
        <section className="py-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="px-4">
            <p className="text-[10px] tracking-[0.4em] text-black/30 text-center mb-8">GALLERY</p>
            <div className="grid grid-cols-3 gap-1">
              {galleryImages.map((img, i) => (
                <div key={i} onClick={() => setGalleryIndex(i)} className="aspect-square cursor-pointer overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      <section className="py-20 px-8 bg-black/[0.02]">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto">
          <p className="text-[10px] tracking-[0.4em] text-black/30 text-center mb-12">CALENDAR</p>
          
          <div className="bg-white p-6">
            <p className="text-center text-[13px] font-light text-black/60 mb-6">
              {calendarData.year}. {String(calendarData.month).padStart(2, '0')}
            </p>
            <div className="grid grid-cols-7 text-center text-[11px] mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className={`py-2 font-light ${i === 0 ? 'text-red-400/70' : 'text-black/30'}`}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center text-[12px]">
              {calendarData.weeks.flat().map((day, i) => (
                <span
                  key={i}
                  className={`py-2 font-light ${
                    day === calendarData.targetDay
                      ? 'bg-black text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                      : day ? 'text-black/60' : ''
                  }`}
                >
                  {day || ''}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center space-y-1">
            <p className="text-[13px] font-light text-black/70">{formatDate(wedding.weddingDate, 'korean')}</p>
            <p className="text-[12px] font-light text-black/40">{formatTime(wedding.weddingTime)}</p>
          </div>
        </motion.div>
      </section>

      <section className="py-20 px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto">
          <p className="text-[10px] tracking-[0.4em] text-black/30 text-center mb-12">LOCATION</p>
          
          <div className="text-center mb-8">
            <p className="text-[15px] font-light text-black/80 mb-1">{wedding.venue}</p>
            {wedding.venueHall && <p className="text-[13px] font-light text-black/50">{wedding.venueHall}</p>}
            {wedding.venueAddress && <p className="text-[12px] font-light text-black/40 mt-3">{wedding.venueAddress}</p>}
          </div>

          {wedding.venueAddress && (
            <div className="aspect-[4/3] bg-black/5 mb-6 overflow-hidden">
              <KakaoMap address={wedding.venueAddress} />
            </div>
          )}

          <div className="flex justify-center gap-2">
            {wedding.venueNaverMap && (
              <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-[11px] font-light border border-black/10 text-black/60 hover:bg-black hover:text-white transition-colors">
                네이버 지도
              </a>
            )}
            {wedding.venueKakaoMap && (
              <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-[11px] font-light border border-black/10 text-black/60 hover:bg-black hover:text-white transition-colors">
                카카오 지도
              </a>
            )}
            {wedding.venueTmap && (
              <a href={wedding.venueTmap} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-[11px] font-light border border-black/10 text-black/60 hover:bg-black hover:text-white transition-colors">
                티맵
              </a>
            )}
          </div>

          {wedding.venuePhone && (
            <a href={`tel:${wedding.venuePhone}`} className="flex items-center justify-center gap-2 mt-6 text-[12px] font-light text-black/40">
              <Phone className="w-3 h-3" /> {wedding.venuePhone}
            </a>
          )}
        </motion.div>
      </section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <section className="py-20 px-8 bg-black/[0.02]">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto">
            <p className="text-[10px] tracking-[0.4em] text-black/30 text-center mb-4">GIFT</p>
            <p className="text-[13px] font-light text-black/50 text-center mb-10">마음 전하실 곳</p>

            <div className="space-y-4">
              {wedding.groomAccount && (
                <div className="bg-white p-5">
                  <button onClick={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} className="w-full flex items-center justify-between">
                    <span className="text-[13px] font-light text-black/70">신랑측 계좌</span>
                    <ChevronDown className={`w-4 h-4 text-black/30 transition-transform ${openAccount === 'groom' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'groom' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[12px] font-light text-black/50">{wedding.groomBank}</p>
                              <p className="text-[13px] font-light text-black/70">{wedding.groomAccount}</p>
                              <p className="text-[11px] font-light text-black/40">{wedding.groomAccountHolder}</p>
                            </div>
                            <button onClick={() => copyToClipboard(`${wedding.groomBank} ${wedding.groomAccount}`, 'groom')} className="p-2">
                              {copiedAccount === 'groom' ? <Check className="w-4 h-4 text-black/50" /> : <Copy className="w-4 h-4 text-black/30" />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {wedding.brideAccount && (
                <div className="bg-white p-5">
                  <button onClick={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} className="w-full flex items-center justify-between">
                    <span className="text-[13px] font-light text-black/70">신부측 계좌</span>
                    <ChevronDown className={`w-4 h-4 text-black/30 transition-transform ${openAccount === 'bride' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openAccount === 'bride' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[12px] font-light text-black/50">{wedding.brideBank}</p>
                              <p className="text-[13px] font-light text-black/70">{wedding.brideAccount}</p>
                              <p className="text-[11px] font-light text-black/40">{wedding.brideAccountHolder}</p>
                            </div>
                            <button onClick={() => copyToClipboard(`${wedding.brideBank} ${wedding.brideAccount}`, 'bride')} className="p-2">
                              {copiedAccount === 'bride' ? <Check className="w-4 h-4 text-black/50" /> : <Copy className="w-4 h-4 text-black/30" />}
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
                {wedding.tossLink && (
                  <a href={wedding.tossLink} target="_blank" className="px-6 py-2.5 text-[11px] font-light bg-[#0064FF] text-white">토스</a>
                )}
                {wedding.kakaoPayLink && (
                  <a href={wedding.kakaoPayLink} target="_blank" className="px-6 py-2.5 text-[11px] font-light bg-[#FEE500] text-black/80">카카오페이</a>
                )}
              </div>
            )}
          </motion.div>
        </section>
      )}

      <section id="rsvp" className="py-20 px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto">
          <p className="text-[10px] tracking-[0.4em] text-black/30 text-center mb-4">RSVP</p>
          <p className="text-[13px] font-light text-black/50 text-center mb-10">참석 여부를 알려주세요</p>
          
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="minimal" />
        </motion.div>
      </section>

      <section id="guestbook" className="py-20 px-8 bg-black/[0.02]">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-sm mx-auto">
          <p className="text-[10px] tracking-[0.4em] text-black/30 text-center mb-4">GUESTBOOK</p>
          <p className="text-[13px] font-light text-black/50 text-center mb-10">축하 메시지를 남겨주세요</p>
          
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="minimal" />
          
          {localGuestbooks.length > 0 && (
            <div className="mt-10">
              <GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="minimal" />
            </div>
          )}
        </motion.div>
      </section>

      <section className="py-12 px-8">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="max-w-sm mx-auto">
          <div className="flex justify-center gap-6 mb-8">
            {wedding.groomPhone && (
              <a href={`tel:${wedding.groomPhone}`} className="text-center">
                <p className="text-[11px] font-light text-black/40 mb-1">신랑</p>
                <div className="w-10 h-10 border border-black/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-black/40" />
                </div>
              </a>
            )}
            {wedding.bridePhone && (
              <a href={`tel:${wedding.bridePhone}`} className="text-center">
                <p className="text-[11px] font-light text-black/40 mb-1">신부</p>
                <div className="w-10 h-10 border border-black/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-black/40" />
                </div>
              </a>
            )}
          </div>

          <button onClick={() => setShowShareModal(true)} className="w-full py-3 border border-black/10 text-[12px] font-light text-black/60 flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-colors">
            <Share2 className="w-4 h-4" /> 공유하기
          </button>
        </motion.div>
      </section>

      <footer className="py-8 text-center" style={{ background: "#F8F8F8" }}>
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-[10px] tracking-[0.2em] text-black/30 hover:text-black/40 transition-colors">Made by 청첩장 작업실 ›</a>
      </footer>

      {galleryIndex !== null && wedding.galleries && (
        <GalleryModal 
          galleries={wedding.galleries} 
          currentIndex={galleryIndex} 
          onClose={() => setGalleryIndex(null)} 
          onNavigate={setGalleryIndex}
        />
      )}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="light" />
    </div>
  );
}

declare global { interface Window { Kakao?: any; } }
