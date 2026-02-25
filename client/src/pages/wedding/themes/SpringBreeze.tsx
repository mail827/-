import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Phone, Copy, Check, 
  Volume2, VolumeX, Share2, ChevronDown
} from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

const fontStyles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  @font-face {
    font-family: 'HsBombaram';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_one@1.0/HSBombaram.woff') format('woff');
    font-weight: normal;
    font-display: swap;
  }
`;

export default function SpringBreeze({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading }: ThemeProps) {
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
    <div className="min-h-screen relative overflow-hidden" style={{ 
      background: 'linear-gradient(180deg, #FFF9F9 0%, #FFF5F8 30%, #FDF5FF 60%, #FFFAF5 100%)',
      fontFamily: "'Pretendard', sans-serif"
    }}>
      <style>{fontStyles}</style>
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.15]">
        <svg className="absolute top-10 left-5 w-20 h-20 animate-float-1" viewBox="0 0 100 100">
          <path d="M50 0 C60 40, 90 50, 50 100 C10 50, 40 40, 50 0" fill="#FFD4E0" />
        </svg>
        <svg className="absolute top-32 right-10 w-16 h-16 animate-float-2" viewBox="0 0 100 100">
          <path d="M50 0 C60 40, 90 50, 50 100 C10 50, 40 40, 50 0" fill="#E8D0F0" />
        </svg>
        <svg className="absolute bottom-40 left-10 w-14 h-14 animate-float-3" viewBox="0 0 100 100">
          <path d="M50 0 C60 40, 90 50, 50 100 C10 50, 40 40, 50 0" fill="#FFE0E8" />
        </svg>
        <svg className="absolute top-1/2 right-5 w-12 h-12 animate-float-1" style={{ animationDelay: '-3s' }} viewBox="0 0 100 100">
          <path d="M50 0 C60 40, 90 50, 50 100 C10 50, 40 40, 50 0" fill="#F0D8FF" />
        </svg>
        <svg className="absolute bottom-60 right-20 w-18 h-18 animate-float-2" style={{ animationDelay: '-5s' }} viewBox="0 0 100 100">
          <path d="M50 0 C60 40, 90 50, 50 100 C10 50, 40 40, 50 0" fill="#FFD8E8" />
        </svg>
      </div>

      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.15; }
          50% { transform: translateY(-30px) rotate(10deg); opacity: 0.25; }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.12; }
          50% { transform: translateY(-25px) rotate(-8deg); opacity: 0.2; }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
          50% { transform: translateY(-35px) rotate(15deg); opacity: 0.18; }
        }
        .animate-float-1 { animation: float-1 8s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 10s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 7s ease-in-out infinite; }
      `}</style>

      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300" style={{ 
          background: 'rgba(255,255,255,0.7)',
          boxShadow: '0 4px 20px rgba(220,180,200,0.2)',
          border: '1px solid rgba(255,220,230,0.5)'
        }}>
          {isPlaying ? <Volume2 className="w-4 h-4" style={{ color: '#D4A0B0' }} /> : <VolumeX className="w-4 h-4" style={{ color: '#C8B0C0' }} />}
        </button>
      )}

      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-sm">
          
          <p className="text-[11px] tracking-[0.35em] text-center mb-10" style={{ color: '#C8A0B8' }}>WEDDING INVITATION</p>
          
          {wedding.heroMedia && (
            <div className="relative mb-12 mx-2">
              <div className="absolute -inset-2 rounded-[16px] opacity-50" style={{ 
                background: 'linear-gradient(135deg, rgba(255,210,220,0.4), rgba(230,200,240,0.4))',
                filter: 'blur(15px)'
              }} />
              <div className="relative rounded-[12px] overflow-hidden" style={{ 
                boxShadow: '0 8px 30px rgba(200,160,180,0.15)'
              }}>
                {wedding.heroMediaType === 'VIDEO' ? (
                  <video src={heroUrl(wedding.heroMedia)} autoPlay muted loop playsInline className="w-full aspect-[3/4] object-cover" style={{ filter: 'brightness(1.02)' }} />
                ) : (
                  <img src={heroUrl(wedding.heroMedia)} alt="" className="w-full aspect-[3/4] object-cover" style={{ filter: 'brightness(1.02)' }} />
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 60%, rgba(255,240,245,0.3) 100%)' }} />
              </div>
            </div>
          )}
          
          <div className="text-left pl-2 space-y-6">
            <div>
              <p className="text-[36px] leading-tight" style={{ color: '#8B6B7B', fontFamily: 'HsBombaram, serif' }}>
                우리 결혼해요
              </p>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-[22px]" style={{ color: '#7B5B6B', fontFamily: 'HsBombaram, serif' }}>
                {wedding.groomName} <span style={{ color: '#D4A0B0' }}>&</span> {wedding.brideName}
              </h1>
            </div>
            
            <div className="space-y-1 text-[14px]" style={{ color: '#9B7B8B' }}>
              <p>{formatDate(wedding.weddingDate, 'korean')}</p>
              <p className="text-[13px]" style={{ color: '#B8A0B0' }}>{formatTime(wedding.weddingTime)}</p>
              <p className="text-[13px] pt-1" style={{ color: '#C8B0C0' }}>{wedding.venue}</p>
            </div>
            
            {wedding.showDday && (
              <p className="text-[12px] tracking-wide pt-2" style={{ color: '#D4A0B0', fontFamily: 'HsBombaram, serif' }}>{getDday(wedding.weddingDate)}</p>
            )}
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-10">
          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: '#E0C0D0' }} />
        </motion.div>
      </section>

      {wedding.greeting && (
        <Section>
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <SectionTitle>초대합니다</SectionTitle>
            <Card className="p-8 text-left">
              {wedding.greetingTitle && (
                <p className="text-[17px] mb-6" style={{ color: '#7B5B6B', fontFamily: 'HsBombaram, serif', lineHeight: 1.9 }}>{wedding.greetingTitle}</p>
              )}
              <p className="text-[14px] whitespace-pre-line" style={{ color: '#6B5060', lineHeight: 2 }}>{wedding.greeting}</p>
              
              {wedding.showParents && (
                <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(220,180,200,0.3)' }}>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[11px] tracking-[0.1em] mb-2" style={{ color: '#C8A0B8' }}>신랑측</p>
                      <p className="text-[12px]" style={{ color: '#A08090' }}>
                        {wedding.groomFatherName && <span>{wedding.groomFatherName}</span>}
                        {wedding.groomFatherName && wedding.groomMotherName && <span> · </span>}
                        {wedding.groomMotherName && <span>{wedding.groomMotherName}</span>}
                      </p>
                      <p className="text-[14px] mt-1" style={{ color: '#7B5B6B' }}>의 아들 <span style={{ fontFamily: 'HsBombaram, serif' }}>{wedding.groomName}</span></p>
                    </div>
                    <div>
                      <p className="text-[11px] tracking-[0.1em] mb-2" style={{ color: '#C8A0B8' }}>신부측</p>
                      <p className="text-[12px]" style={{ color: '#A08090' }}>
                        {wedding.brideFatherName && <span>{wedding.brideFatherName}</span>}
                        {wedding.brideFatherName && wedding.brideMotherName && <span> · </span>}
                        {wedding.brideMotherName && <span>{wedding.brideMotherName}</span>}
                      </p>
                      <p className="text-[14px] mt-1" style={{ color: '#7B5B6B' }}>의 딸 <span style={{ fontFamily: 'HsBombaram, serif' }}>{wedding.brideName}</span></p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </Section>
      )}

      <Section>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center">
          <SectionTitle align="center">예식일</SectionTitle>
          <Card className="p-6 max-w-[280px] mx-auto">
            <p className="text-[13px] tracking-[0.15em] mb-4" style={{ color: '#D4A0B0', fontFamily: 'HsBombaram, serif' }}>
              {calendarData.year}. {String(calendarData.month).padStart(2, '0')}
            </p>
            <div className="grid grid-cols-7 gap-1">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div key={i} className="py-2 text-[11px]" style={{ color: i === 0 ? '#E8A0B0' : i === 6 ? '#A0B8D0' : '#B8A0B0' }}>{d}</div>
              ))}
              {calendarData.weeks.flat().map((day, i) => (
                <div key={i} className="py-2 text-[12px] relative flex items-center justify-center">
                  {day === calendarData.targetDay && (
                    <div className="absolute inset-1 rounded-full" style={{ background: 'linear-gradient(135deg, #E8B0C0, #D0A0C0)' }} />
                  )}
                  <span className="relative z-10" style={{ color: day === calendarData.targetDay ? '#FFFFFF' : day ? '#8B7080' : 'transparent' }}>{day || ''}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 flex justify-center gap-5" style={{ borderTop: '1px solid rgba(220,180,200,0.2)' }}>
              <span className="flex items-center gap-1.5 text-[12px]" style={{ color: '#9B8090' }}>
                <Calendar className="w-3.5 h-3.5" style={{ color: '#D4A0B0' }} />
                {formatDate(wedding.weddingDate, 'short')}
              </span>
              <span className="flex items-center gap-1.5 text-[12px]" style={{ color: '#9B8090' }}>
                <Clock className="w-3.5 h-3.5" style={{ color: '#D4A0B0' }} />
                {formatTime(wedding.weddingTime)}
              </span>
            </div>
          </Card>
        </motion.div>
      </Section>

      {wedding.loveStoryVideo && (
        <Section>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <SectionTitle>우리의 이야기</SectionTitle>
            <Card className="overflow-hidden p-0">
              {wedding.loveStoryVideo.includes("youtube") || wedding.loveStoryVideo.includes("youtu.be") ? (
                <iframe
                  src={wedding.loveStoryVideo.includes("youtu.be") ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("youtu.be/")[1]?.split("?")[0]}` : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("watch?v=")[1]?.split("&")[0]}`}
                  className="w-full aspect-video"
                  allowFullScreen
                />
              ) : (
                <video src={wedding.loveStoryVideo} controls className="w-full aspect-video" />
              )}
            </Card>
          </motion.div>
        </Section>
      )}

      {wedding.galleries && wedding.galleries.length > 0 && (
        <Section id="gallery-section">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <SectionTitle>갤러리</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {wedding.galleries.slice(0, 9).map((item, index) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  whileInView={{ opacity: 1, scale: 1 }} 
                  viewport={{ once: true }} 
                  transition={{ delay: index * 0.05 }} 
                  onClick={() => setGalleryIndex(index)} 
                  className="aspect-square rounded-[10px] overflow-hidden cursor-pointer"
                  style={{ boxShadow: '0 4px 15px rgba(200,160,180,0.12)' }}
                >
                  {item.mediaType === 'VIDEO' ? (
                    <video src={item.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={galleryThumbUrl(item.mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Section>
      )}

      <Section id="venue-section">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <SectionTitle>오시는 길</SectionTitle>
          <Card className="overflow-hidden p-0">
            <KakaoMap address={wedding.venueAddress} venue={wedding.venue} latitude={wedding.venueLatitude} longitude={wedding.venueLongitude} />
            <div className="p-6 text-center">
              <p className="flex items-center justify-center gap-2 text-[15px]" style={{ color: '#7B5B6B', fontFamily: 'HsBombaram, serif' }}>
                <MapPin className="w-4 h-4" style={{ color: '#D4A0B0' }} />
                {wedding.venue}
              </p>
              {wedding.venueHall && <p className="text-[13px] mt-1.5" style={{ color: '#B8909D' }}>{wedding.venueHall}</p>}
              <p className="text-[12px] mt-2" style={{ color: '#C0A8B0' }}>{wedding.venueAddress}</p>
              {wedding.venuePhone && (
                <a href={`tel:${wedding.venuePhone}`} className="inline-flex items-center gap-1.5 mt-3 text-[12px]" style={{ color: '#A08898' }}>
                  <Phone className="w-3 h-3" />{wedding.venuePhone}
                </a>
              )}
              <div className="flex justify-center gap-2 mt-5">
                {wedding.venueNaverMap && (
                  <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-full text-white text-[11px]" style={{ background: '#03C75A' }}>네이버</a>
                )}
                {wedding.venueKakaoMap && (
                  <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-full text-[11px]" style={{ background: '#FEE500', color: '#3C1E1E' }}>카카오</a>
                )}
                {wedding.venueTmap && (
                  <a href={wedding.venueTmap} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-full text-white text-[11px]" style={{ background: '#EF4123' }}>티맵</a>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </Section>

      <Section id="rsvp-section">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <SectionTitle>참석 여부</SectionTitle>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="spring" />
        </motion.div>
      </Section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <Section id="account-section">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <SectionTitle>마음 전하기</SectionTitle>
            <div className="space-y-3">
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
                  <a href={wedding.tossLink} target="_blank" className="px-6 py-3 rounded-full text-white text-[12px]" style={{ background: '#0064FF' }}>토스</a>
                )}
                {wedding.kakaoPayLink && (
                  <a href={wedding.kakaoPayLink} target="_blank" className="px-6 py-3 rounded-full text-[12px]" style={{ background: '#FEE500', color: '#3C1E1E' }}>카카오페이</a>
                )}
              </div>
            )}
          </motion.div>
        </Section>
      )}

      <Section id="guestbook-section">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <SectionTitle>방명록</SectionTitle>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="spring" />
          <GuestbookList 
            guestbooks={localGuestbooks} 
            weddingSlug={wedding.slug} 
            onDelete={handleGuestbookDelete}
            variant="spring"
          />
        </motion.div>
      </Section>

      {wedding.closingMessage && (
        <Section>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Card className="p-8 text-left">
              <p className="text-[14px] whitespace-pre-line" style={{ color: '#6B5060', lineHeight: 2 }}>{wedding.closingMessage}</p>
            </Card>
          </motion.div>
        </Section>
      )}

      <Section>
        <div className="text-center">
          <button 
            onClick={() => setShowShareModal(true)} 
            className="px-10 py-4 rounded-full text-[14px] flex items-center gap-2.5 mx-auto transition-all duration-300 hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, #E8B0C0, #D0A0C8)',
              color: '#FFFFFF',
              boxShadow: '0 6px 20px rgba(220,160,180,0.35)',
              fontFamily: 'HsBombaram, serif'
            }}
          >
            <Share2 className="w-4 h-4" />공유하기
          </button>
          <div className="flex justify-center gap-6 mt-8">
            {wedding.groomPhone && (
              <a href={`tel:${wedding.groomPhone}`} className="text-center group">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-105" style={{ 
                  background: 'rgba(255,255,255,0.8)',
                  boxShadow: '0 4px 15px rgba(220,180,200,0.15)',
                  border: '1px solid rgba(255,220,230,0.5)'
                }}>
                  <Phone className="w-5 h-5" style={{ color: '#D4A0B0' }} />
                </div>
                <span className="text-[11px]" style={{ color: '#B8A0B0', fontFamily: 'HsBombaram, serif' }}>신랑</span>
              </a>
            )}
            {wedding.bridePhone && (
              <a href={`tel:${wedding.bridePhone}`} className="text-center group">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-105" style={{ 
                  background: 'rgba(255,255,255,0.8)',
                  boxShadow: '0 4px 15px rgba(220,180,200,0.15)',
                  border: '1px solid rgba(255,220,230,0.5)'
                }}>
                  <Phone className="w-5 h-5" style={{ color: '#D4A0B0' }} />
                </div>
                <span className="text-[11px]" style={{ color: '#B8A0B0', fontFamily: 'HsBombaram, serif' }}>신부</span>
              </a>
            )}
          </div>
        </div>
      </Section>

      <footer className="py-10 text-center relative z-10" style={{ background: "rgba(220,190,200,0.2)" }}>
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-[10px] tracking-[0.25em] hover:opacity-70 transition-opacity" style={{ color: '#B4A0A8', fontFamily: 'HsBombaram, serif' }}>Made by 청첩장 작업실 ›</a>
      </footer>

      <AnimatePresence>
        {galleryIndex !== null && wedding.galleries && (
          <GalleryModal 
            galleries={wedding.galleries} 
            currentIndex={galleryIndex} 
            onClose={() => setGalleryIndex(null)} 
            onNavigate={setGalleryIndex} theme="SPRING_BREEZE" usePhotoFilter={wedding.usePhotoFilter ?? true} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="light" />
      </AnimatePresence>
    </div>
  );
}

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`py-16 px-6 relative z-10 ${className}`}>
      <div className="max-w-md mx-auto">{children}</div>
    </section>
  );
}

function SectionTitle({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'center' }) {
  return (
    <div className={`mb-8 ${align === 'center' ? 'text-center' : 'text-left pl-1'}`}>
      <p className="text-[17px]" style={{ color: '#8B6B7B', fontFamily: 'HsBombaram, serif' }}>{children}</p>
      <div className={`flex items-center gap-2 mt-2 ${align === 'center' ? 'justify-center' : ''}`}>
        <div className="w-8 h-px" style={{ background: 'linear-gradient(90deg, rgba(220,180,200,0.6), transparent)' }} />
      </div>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={`rounded-[14px] ${className}`}
      style={{ 
        background: 'rgba(255,255,255,0.75)',
        boxShadow: '0 4px 20px rgba(200,160,180,0.1)',
        border: '1px solid rgba(255,230,240,0.6)'
      }}
    >
      {children}
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
    <Card>
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-center justify-between">
        <span className="text-[14px]" style={{ color: '#7B5B6B', fontFamily: 'HsBombaram, serif' }}>{title}</span>
        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ color: '#D4A0B0' }} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(220,180,200,0.2)' }}>
              {accounts.map((acc, i) => (
                <div key={i} className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-[14px]" style={{ color: '#6B5060' }}>{acc.holder}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: '#A08898' }}>{acc.bank} {acc.account}</p>
                  </div>
                  <button 
                    onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)} 
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{ 
                      background: copiedAccount === `${title}-${i}` ? 'linear-gradient(135deg, #E8B0C0, #D0A0C8)' : 'rgba(240,220,230,0.4)',
                      border: '1px solid rgba(220,180,200,0.3)'
                    }}
                  >
                    {copiedAccount === `${title}-${i}` ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" style={{ color: '#C8A0B0' }} />}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

declare global { interface Window { Kakao?: any; } }
