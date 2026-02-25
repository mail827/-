import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Phone, Copy, Check, 
  Volume2, VolumeX, Share2, ChevronDown
} from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap');
  @font-face {
    font-family: 'Aritaburi';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_one@1.0/Arita-buri-SemiBold.woff') format('woff');
    font-weight: normal;
    font-display: swap;
  }
`;

export default function RomanticClassic({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot }: ThemeProps) {
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
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(180deg, #FFFEF9 0%, #FDF9F3 50%, #FAF6EE 100%)',
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
    }}>
      <style>{fontStyles}</style>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300" style={{ background: 'rgba(255,253,245,0.9)', border: '1px solid #D4AF37', boxShadow: '0 2px 8px rgba(212,175,55,0.15)' }}>
          {isPlaying ? <Volume2 className="w-4 h-4" style={{ color: '#D4AF37' }} /> : <VolumeX className="w-4 h-4" style={{ color: '#A08050' }} />}
        </button>
      )}

      <section className="min-h-screen flex flex-col items-center justify-center px-8 py-24 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-32 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M20,80 Q10,50 30,30 Q50,10 70,30 Q90,50 80,80' fill='none' stroke='%23D4AF37' stroke-width='1'/%3E%3Ccircle cx='30' cy='30' r='8' fill='none' stroke='%23D4AF37' stroke-width='0.5'/%3E%3Ccircle cx='70' cy='30' r='8' fill='none' stroke='%23D4AF37' stroke-width='0.5'/%3E%3C/svg%3E")` }} />
          <div className="absolute bottom-0 right-0 w-32 h-32 opacity-[0.04] rotate-180" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M20,80 Q10,50 30,30 Q50,10 70,30 Q90,50 80,80' fill='none' stroke='%23D4AF37' stroke-width='1'/%3E%3Ccircle cx='30' cy='30' r='8' fill='none' stroke='%23D4AF37' stroke-width='0.5'/%3E%3Ccircle cx='70' cy='30' r='8' fill='none' stroke='%23D4AF37' stroke-width='0.5'/%3E%3C/svg%3E")` }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} className="text-center w-full max-w-sm relative z-10">
          <p className="text-[11px] tracking-[0.4em] mb-10" style={{ color: '#B8A070', fontFamily: 'Aritaburi, serif' }}>WEDDING INVITATION</p>
          
          {wedding.heroMedia && (
            <div className="relative mb-12 mx-4">
              <div className="absolute -inset-3 rounded-sm" style={{ border: '1px solid #D4AF37', opacity: 0.3 }} />
              <div className="absolute -inset-1.5 rounded-sm" style={{ border: '1px solid #D4AF37', opacity: 0.15 }} />
              <div className="relative aspect-[3/4] overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(139,115,70,0.12)' }}>
                {wedding.heroMediaType === 'VIDEO' ? (
                  <video src={heroUrl(wedding.heroMedia)} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={heroUrl(wedding.heroMedia)} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-4">
                <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #D4AF37)' }} />
                <h1 className="text-[24px] sm:text-[32px] tracking-[0.1em] sm:tracking-[0.15em] whitespace-nowrap" style={{ color: '#4A4035', fontFamily: 'Aritaburi, serif', fontWeight: 400 }}>
                  {wedding.groomName}
                </h1>
                <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
              </div>
              <p className="text-[20px]" style={{ color: '#D4AF37' }}>&</p>
              <h1 className="text-[24px] sm:text-[32px] tracking-[0.1em] sm:tracking-[0.15em] whitespace-nowrap" style={{ color: '#4A4035', fontFamily: 'Aritaburi, serif', fontWeight: 400 }}>
                {wedding.brideName}
              </h1>
            </div>
            
            <div className="space-y-2" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              <p className="text-[15px] tracking-wide" style={{ color: '#6B5E4A' }}>{formatDate(wedding.weddingDate, 'korean')}</p>
              <p className="text-[14px]" style={{ color: '#8B7355' }}>{formatTime(wedding.weddingTime)}</p>
              <p className="text-[13px] mt-3" style={{ color: '#A08B70' }}>{wedding.venue}</p>
            </div>
            
            {wedding.showDday && (
              <p className="text-[12px] tracking-[0.15em] pt-2" style={{ color: '#C4A35A' }}>{getDday(wedding.weddingDate)}</p>
            )}
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-10">
          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: '#D4AF37', opacity: 0.5 }} />
        </motion.div>
      </section>

      {wedding.greeting && (
        <Section>
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center">
            <SectionTitle>INVITATION</SectionTitle>
            <div className="relative p-10 mx-2" style={{ background: 'rgba(255,253,248,0.7)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div className="absolute top-3 left-3 w-6 h-6 border-t border-l" style={{ borderColor: '#D4AF37', opacity: 0.4 }} />
              <div className="absolute top-3 right-3 w-6 h-6 border-t border-r" style={{ borderColor: '#D4AF37', opacity: 0.4 }} />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l" style={{ borderColor: '#D4AF37', opacity: 0.4 }} />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r" style={{ borderColor: '#D4AF37', opacity: 0.4 }} />
              
              {wedding.greetingTitle && (
                <p className="text-[18px] mb-8" style={{ color: '#5A4D3A', fontFamily: 'Aritaburi, serif', lineHeight: 1.8 }}>{wedding.greetingTitle}</p>
              )}
              <p className="text-[14px] whitespace-pre-line" style={{ color: '#6B5E4A', fontFamily: "'Nanum Myeongjo', serif", lineHeight: 2.2 }}>{wedding.greeting}</p>
              
              {wedding.showParents && (
                <div className="mt-10 pt-8" style={{ borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                  <div className="grid grid-cols-2 gap-8 text-center" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                    <div>
                      <p className="text-[11px] tracking-[0.15em] mb-3" style={{ color: '#B8A070' }}>신랑측</p>
                      <p className="text-[12px]" style={{ color: '#8B7B65' }}>
                        {wedding.groomFatherName && <span>{wedding.groomFatherName}</span>}
                        {wedding.groomFatherName && wedding.groomMotherName && <span> · </span>}
                        {wedding.groomMotherName && <span>{wedding.groomMotherName}</span>}
                      </p>
                      <p className="text-[14px] mt-2" style={{ color: '#5A4D3A' }}>의 아들 <span style={{ color: '#4A4035' }}>{wedding.groomName}</span></p>
                    </div>
                    <div>
                      <p className="text-[11px] tracking-[0.15em] mb-3" style={{ color: '#B8A070' }}>신부측</p>
                      <p className="text-[12px]" style={{ color: '#8B7B65' }}>
                        {wedding.brideFatherName && <span>{wedding.brideFatherName}</span>}
                        {wedding.brideFatherName && wedding.brideMotherName && <span> · </span>}
                        {wedding.brideMotherName && <span>{wedding.brideMotherName}</span>}
                      </p>
                      <p className="text-[14px] mt-2" style={{ color: '#5A4D3A' }}>의 딸 <span style={{ color: '#4A4035' }}>{wedding.brideName}</span></p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </Section>
      )}

      <Section>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center">
          <SectionTitle>CALENDAR</SectionTitle>
          <div className="max-w-[280px] mx-auto p-6" style={{ background: 'rgba(255,253,248,0.7)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <p className="text-[13px] tracking-[0.2em] mb-5" style={{ color: '#C4A35A', fontFamily: 'Aritaburi, serif' }}>
              {calendarData.year}. {String(calendarData.month).padStart(2, '0')}
            </p>
            <div className="grid grid-cols-7 gap-0.5" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div key={i} className="py-2 text-[11px]" style={{ color: i === 0 ? '#C4A35A' : i === 6 ? '#8B9EAA' : '#A08B70' }}>{d}</div>
              ))}
              {calendarData.weeks.flat().map((day, i) => (
                <div key={i} className="py-2 text-[12px] relative flex items-center justify-center" style={{ color: day === calendarData.targetDay ? '#FFFDF5' : day ? '#6B5E4A' : 'transparent' }}>
                  {day === calendarData.targetDay && (
                    <div className="absolute inset-1 rounded-full" style={{ background: '#C4A35A' }} />
                  )}
                  <span className="relative z-10">{day || ''}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-5 flex justify-center gap-6" style={{ borderTop: '1px solid rgba(212,175,55,0.15)' }}>
              <span className="flex items-center gap-2 text-[12px]" style={{ color: '#8B7355' }}>
                <Calendar className="w-3.5 h-3.5" style={{ color: '#C4A35A' }} />
                {formatDate(wedding.weddingDate, 'short')}
              </span>
              <span className="flex items-center gap-2 text-[12px]" style={{ color: '#8B7355' }}>
                <Clock className="w-3.5 h-3.5" style={{ color: '#C4A35A' }} />
                {formatTime(wedding.weddingTime)}
              </span>
            </div>
          </div>
        </motion.div>
      </Section>

      {wedding.loveStoryVideo && (
        <Section>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <SectionTitle>OUR STORY</SectionTitle>
            <div className="mx-2 overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
              {wedding.loveStoryVideo.includes("youtube") || wedding.loveStoryVideo.includes("youtu.be") ? (
                <iframe
                  src={wedding.loveStoryVideo.includes("youtu.be") ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("youtu.be/")[1]?.split("?")[0]}` : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("watch?v=")[1]?.split("&")[0]}`}
                  className="w-full aspect-video"
                  allowFullScreen
                />
              ) : (
                <video src={wedding.loveStoryVideo} controls className="w-full aspect-video" />
              )}
            </div>
          </motion.div>
        </Section>
      )}

      {wedding.galleries && wedding.galleries.length > 0 && (
        <Section id="gallery-section">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <SectionTitle>GALLERY</SectionTitle>
            <div className="grid grid-cols-3 gap-1.5 mx-2">
              {wedding.galleries.slice(0, 9).map((item, index) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0 }} 
                  whileInView={{ opacity: 1 }} 
                  viewport={{ once: true }} 
                  transition={{ delay: index * 0.05 }} 
                  onClick={() => setGalleryIndex(index)} 
                  className="aspect-square overflow-hidden cursor-pointer"
                  style={{ border: '1px solid rgba(212,175,55,0.15)' }}
                >
                  {item.mediaType === 'VIDEO' ? (
                    <video src={item.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={galleryThumbUrl(item.mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Section>
      )}

      <Section id="venue-section">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center">
          <SectionTitle>LOCATION</SectionTitle>
          <div className="mx-2 overflow-hidden" style={{ background: 'rgba(255,253,248,0.7)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <KakaoMap address={wedding.venueAddress} venue={wedding.venue} latitude={wedding.venueLatitude} longitude={wedding.venueLongitude} />
            <div className="p-6 text-center" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              <p className="flex items-center justify-center gap-2 text-[15px]" style={{ color: '#5A4D3A' }}>
                <MapPin className="w-4 h-4" style={{ color: '#C4A35A' }} />
                {wedding.venue}
              </p>
              {wedding.venueHall && <p className="text-[13px] mt-1.5" style={{ color: '#C4A35A' }}>{wedding.venueHall}</p>}
              <p className="text-[12px] mt-2" style={{ color: '#A08B70' }}>{wedding.venueAddress}</p>
              {wedding.venuePhone && (
                <a href={`tel:${wedding.venuePhone}`} className="inline-flex items-center gap-1.5 mt-3 text-[12px]" style={{ color: '#8B7355' }}>
                  <Phone className="w-3 h-3" />{wedding.venuePhone}
                </a>
              )}
              <div className="flex justify-center gap-2 mt-5">
                {wedding.venueNaverMap && (
                  <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-white text-[11px] tracking-wide" style={{ background: '#03C75A' }}>네이버</a>
                )}
                {wedding.venueKakaoMap && (
                  <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-[11px] tracking-wide" style={{ background: '#FEE500', color: '#3C1E1E' }}>카카오</a>
                )}
                {wedding.venueTmap && (
                  <a href={wedding.venueTmap} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-white text-[11px] tracking-wide" style={{ background: '#EF4123' }}>티맵</a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      <Section id="rsvp-section">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center">
          <SectionTitle>RSVP</SectionTitle>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="classic" />
        </motion.div>
      </Section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <Section id="account-section">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center">
            <SectionTitle>GIFT</SectionTitle>
            <div className="space-y-2 mx-2">
              <AccountCard 
                title="신랑측" 
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
              <AccountCard 
                title="신부측" 
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
            </div>
            {(wedding.tossLink || wedding.kakaoPayLink) && (
              <div className="flex justify-center gap-3 mt-5">
                {wedding.tossLink && (
                  <a href={wedding.tossLink} target="_blank" className="px-6 py-2.5 text-white text-[12px] tracking-wide" style={{ background: '#0064FF' }}>토스</a>
                )}
                {wedding.kakaoPayLink && (
                  <a href={wedding.kakaoPayLink} target="_blank" className="px-6 py-2.5 text-[12px] tracking-wide" style={{ background: '#FEE500', color: '#3C1E1E' }}>카카오페이</a>
                )}
              </div>
            )}
          </motion.div>
        </Section>
      )}

      <Section id="guestbook-section">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <SectionTitle className="text-center">GUESTBOOK</SectionTitle>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="classic" />
          <GuestbookList 
            guestbooks={localGuestbooks} 
            weddingSlug={wedding.slug} 
            onDelete={handleGuestbookDelete}
            variant="classic"
          />
        </motion.div>
      </Section>

      {guestPhotoSlot}
      {wedding.closingMessage && (
        <Section>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center px-4">
            <p className="text-[14px] whitespace-pre-line" style={{ color: '#6B5E4A', fontFamily: "'Nanum Myeongjo', serif", lineHeight: 2.2 }}>{wedding.closingMessage}</p>
          </motion.div>
        </Section>
      )}

      <Section>
        <div className="text-center">
          <button 
            onClick={() => setShowShareModal(true)} 
            className="px-10 py-3.5 text-[13px] tracking-[0.15em] flex items-center gap-2.5 mx-auto transition-all duration-300 hover:shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #D4AF37 0%, #C4A030 100%)',
              color: '#FFFDF5',
              boxShadow: '0 4px 15px rgba(212,175,55,0.3)'
            }}
          >
            <Share2 className="w-4 h-4" />공유하기
          </button>
          <div className="flex justify-center gap-6 mt-8">
            {wedding.groomPhone && (
              <a href={`tel:${wedding.groomPhone}`} className="text-center group">
                <div className="w-14 h-14 flex items-center justify-center mb-2 transition-all duration-300" style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,253,248,0.8)' }}>
                  <Phone className="w-5 h-5" style={{ color: '#C4A35A' }} />
                </div>
                <span className="text-[11px] tracking-wide" style={{ color: '#A08B70', fontFamily: "'Nanum Myeongjo', serif" }}>신랑</span>
              </a>
            )}
            {wedding.bridePhone && (
              <a href={`tel:${wedding.bridePhone}`} className="text-center group">
                <div className="w-14 h-14 flex items-center justify-center mb-2 transition-all duration-300" style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,253,248,0.8)' }}>
                  <Phone className="w-5 h-5" style={{ color: '#C4A35A' }} />
                </div>
                <span className="text-[11px] tracking-wide" style={{ color: '#A08B70', fontFamily: "'Nanum Myeongjo', serif" }}>신부</span>
              </a>
            )}
          </div>
        </div>
      </Section>

      <footer className="py-10 text-center" style={{ background: "#FAF6F0" }}>
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-[10px] tracking-[0.3em] hover:opacity-80 transition-opacity" style={{ color: '#A08540' }}>Made by 청첩장 작업실 ›</a>
      </footer>

      <AnimatePresence>
        {galleryIndex !== null && wedding.galleries && (
          <GalleryModal 
            galleries={wedding.galleries} 
            currentIndex={galleryIndex} 
            onClose={() => setGalleryIndex(null)} 
            onNavigate={setGalleryIndex} theme="ROMANTIC_CLASSIC" usePhotoFilter={wedding.usePhotoFilter ?? true} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} variant="light" weddingId={wedding.id} />
      </AnimatePresence>
    </div>
  );
}

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`py-20 px-6 ${className}`}>
      <div className="max-w-md mx-auto">{children}</div>
    </section>
  );
}

function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-10 ${className}`}>
      <p className="text-[11px] tracking-[0.4em]" style={{ color: '#C4A35A', fontFamily: 'Aritaburi, serif' }}>{children}</p>
      <div className="flex items-center justify-center gap-3 mt-3">
        <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4))' }} />
        <div className="w-1.5 h-1.5 rotate-45" style={{ background: '#D4AF37', opacity: 0.5 }} />
        <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.4), transparent)' }} />
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
    <div style={{ background: 'rgba(255,253,248,0.7)', border: '1px solid rgba(212,175,55,0.2)' }}>
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-center justify-between">
        <span className="text-[13px] tracking-wide" style={{ color: '#6B5E4A', fontFamily: "'Nanum Myeongjo', serif" }}>{title}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ color: '#C4A35A' }} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(212,175,55,0.15)' }}>
              {accounts.map((acc, i) => (
                <div key={i} className="flex items-center justify-between pt-4">
                  <div style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                    <p className="text-[13px]" style={{ color: '#5A4D3A' }}>{acc.holder}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: '#A08B70' }}>{acc.bank} {acc.account}</p>
                  </div>
                  <button 
                    onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)} 
                    className="px-3 py-2 text-[11px] tracking-wide transition-all duration-300"
                    style={{ 
                      background: copiedAccount === `${title}-${i}` ? '#C4A35A' : 'rgba(212,175,55,0.1)',
                      color: copiedAccount === `${title}-${i}` ? '#FFFDF5' : '#C4A35A',
                      border: '1px solid rgba(212,175,55,0.3)'
                    }}
                  >
                    {copiedAccount === `${title}-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
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
