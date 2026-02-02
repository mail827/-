import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Phone, Copy, Check, 
  Volume2, VolumeX, Share2, ChevronDown
} from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500&display=swap');
  @font-face {
    font-family: 'ChangwonDangamRounded';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2511-1@1.0/ChangwonDangamRound-Regular.woff2') format('woff2');
    font-weight: normal;
    font-display: swap;
  }
`;

export default function GlassBubble({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading }: ThemeProps) {
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
      background: 'linear-gradient(135deg, #FAFAFF 0%, #EDE9FF 25%, #EAF6FF 50%, #E8FFF9 75%, #FAFAFF 100%)',
      fontFamily: "'Noto Sans KR', sans-serif"
    }}>
      <style>{fontStyles}</style>
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full animate-float-slow" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(237,233,255,0.3))', filter: 'blur(1px)' }} />
        <div className="absolute top-40 right-16 w-20 h-20 rounded-full animate-float-medium" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7), rgba(234,246,255,0.3))', filter: 'blur(1px)' }} />
        <div className="absolute bottom-32 left-20 w-24 h-24 rounded-full animate-float-fast" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7), rgba(232,255,249,0.3))', filter: 'blur(1px)' }} />
        <div className="absolute top-1/2 right-8 w-16 h-16 rounded-full animate-float-slow" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), rgba(237,233,255,0.2))', filter: 'blur(1px)', animationDelay: '-2s' }} />
        <div className="absolute bottom-60 right-24 w-28 h-28 rounded-full animate-float-medium" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), rgba(234,246,255,0.2))', filter: 'blur(1px)', animationDelay: '-4s' }} />
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-15px) translateX(-8px); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-25px) translateX(5px); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 5s ease-in-out infinite; }
      `}</style>

      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-5 right-5 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300" style={{ 
          background: 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 8px 32px rgba(180,170,220,0.15), inset 0 1px 0 rgba(255,255,255,0.5)'
        }}>
          {isPlaying ? <Volume2 className="w-5 h-5" style={{ color: '#9B8EC2' }} /> : <VolumeX className="w-5 h-5" style={{ color: '#B8B0D0' }} />}
        </button>
      )}

      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className="text-center w-full max-w-sm">
          
          <p className="text-[12px] tracking-[0.3em] mb-8" style={{ color: '#A89ED0', fontFamily: 'ChangwonDangamRounded, sans-serif' }}>WEDDING INVITATION</p>
          
          {wedding.heroMedia && (
            <div className="relative mb-10 mx-4">
              <div className="absolute -inset-3 rounded-[28px]" style={{ 
                background: 'linear-gradient(135deg, rgba(237,233,255,0.5), rgba(234,246,255,0.5), rgba(232,255,249,0.5))',
                filter: 'blur(20px)'
              }} />
              <div className="relative rounded-[24px] overflow-hidden" style={{ 
                boxShadow: '0 8px 32px rgba(180,170,220,0.2), 0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid rgba(255,255,255,0.6)'
              }}>
                {wedding.heroMediaType === 'VIDEO' ? (
                  <video src={wedding.heroMedia} autoPlay muted loop playsInline className="w-full aspect-[3/4] object-cover" />
                ) : (
                  <img src={wedding.heroMedia} alt="" className="w-full aspect-[3/4] object-cover" />
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-5">
            <h1 className="text-[32px] tracking-wide" style={{ color: '#6B5B8C', fontFamily: 'ChangwonDangamRounded, sans-serif' }}>
              {wedding.groomName}
              <span className="mx-3 text-[24px]" style={{ color: '#C4B8E8' }}>♥</span>
              {wedding.brideName}
            </h1>
            
            <div className="space-y-1.5 text-[14px]" style={{ color: '#8B7EB0' }}>
              <p>{formatDate(wedding.weddingDate, 'korean')}</p>
              <p className="text-[13px]" style={{ color: '#A89ED0' }}>{formatTime(wedding.weddingTime)}</p>
              <p className="text-[13px] pt-1" style={{ color: '#B8B0D0' }}>{wedding.venue}</p>
            </div>
            
            {wedding.showDday && (
              <div className="inline-block px-5 py-2 rounded-full mt-2" style={{ 
                background: 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.6)'
              }}>
                <p className="text-[12px] tracking-wide" style={{ color: '#9B8EC2', fontFamily: 'ChangwonDangamRounded, sans-serif' }}>{getDday(wedding.weddingDate)}</p>
              </div>
            )}
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-10">
          <ChevronDown className="w-6 h-6 animate-bounce" style={{ color: '#C4B8E8' }} />
        </motion.div>
      </section>

      {wedding.greeting && (
        <Section>
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center">
            <SectionTitle>초대합니다</SectionTitle>
            <GlassCard className="p-8">
              {wedding.greetingTitle && (
                <p className="text-[18px] mb-6" style={{ color: '#6B5B8C', fontFamily: 'ChangwonDangamRounded, sans-serif', lineHeight: 1.8 }}>{wedding.greetingTitle}</p>
              )}
              <p className="text-[14px] whitespace-pre-line" style={{ color: '#7B6B9C', lineHeight: 2 }}>{wedding.greeting}</p>
              
              {wedding.showParents && (
                <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(200,190,230,0.3)' }}>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <p className="text-[11px] tracking-[0.15em] mb-2" style={{ color: '#B8B0D0', fontFamily: 'ChangwonDangamRounded, sans-serif' }}>신랑측</p>
                      <p className="text-[12px]" style={{ color: '#9B8EC2' }}>
                        {wedding.groomFatherName && <span>{wedding.groomFatherName}</span>}
                        {wedding.groomFatherName && wedding.groomMotherName && <span> · </span>}
                        {wedding.groomMotherName && <span>{wedding.groomMotherName}</span>}
                      </p>
                      <p className="text-[14px] mt-1.5" style={{ color: '#6B5B8C' }}>의 아들 <span style={{ fontFamily: 'ChangwonDangamRounded, sans-serif' }}>{wedding.groomName}</span></p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] tracking-[0.15em] mb-2" style={{ color: '#B8B0D0', fontFamily: 'ChangwonDangamRounded, sans-serif' }}>신부측</p>
                      <p className="text-[12px]" style={{ color: '#9B8EC2' }}>
                        {wedding.brideFatherName && <span>{wedding.brideFatherName}</span>}
                        {wedding.brideFatherName && wedding.brideMotherName && <span> · </span>}
                        {wedding.brideMotherName && <span>{wedding.brideMotherName}</span>}
                      </p>
                      <p className="text-[14px] mt-1.5" style={{ color: '#6B5B8C' }}>의 딸 <span style={{ fontFamily: 'ChangwonDangamRounded, sans-serif' }}>{wedding.brideName}</span></p>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </Section>
      )}

      <Section>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center">
          <SectionTitle>예식일</SectionTitle>
          <GlassCard className="p-6 max-w-[300px] mx-auto">
            <p className="text-[14px] tracking-[0.2em] mb-5" style={{ color: '#9B8EC2', fontFamily: 'ChangwonDangamRounded, sans-serif' }}>
              {calendarData.year}. {String(calendarData.month).padStart(2, '0')}
            </p>
            <div className="grid grid-cols-7 gap-1">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div key={i} className="py-2 text-[11px]" style={{ color: i === 0 ? '#E8A0B0' : i === 6 ? '#8BB8D0' : '#A89ED0', fontFamily: 'ChangwonDangamRounded, sans-serif' }}>{d}</div>
              ))}
              {calendarData.weeks.flat().map((day, i) => (
                <div key={i} className="py-2 text-[12px] relative flex items-center justify-center">
                  {day === calendarData.targetDay && (
                    <div className="absolute inset-1 rounded-full" style={{ 
                      background: 'linear-gradient(135deg, #C4B8E8, #A8D0E8)',
                      boxShadow: '0 4px 15px rgba(180,170,220,0.4)'
                    }} />
                  )}
                  <span className="relative z-10" style={{ color: day === calendarData.targetDay ? '#FFFFFF' : day ? '#7B6B9C' : 'transparent' }}>{day || ''}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-5 flex justify-center gap-5" style={{ borderTop: '1px solid rgba(200,190,230,0.2)' }}>
              <span className="flex items-center gap-2 text-[12px]" style={{ color: '#8B7EB0' }}>
                <Calendar className="w-4 h-4" style={{ color: '#B8B0E8' }} />
                {formatDate(wedding.weddingDate, 'short')}
              </span>
              <span className="flex items-center gap-2 text-[12px]" style={{ color: '#8B7EB0' }}>
                <Clock className="w-4 h-4" style={{ color: '#B8B0E8' }} />
                {formatTime(wedding.weddingTime)}
              </span>
            </div>
          </GlassCard>
        </motion.div>
      </Section>

      {wedding.loveStoryVideo && (
        <Section>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <SectionTitle>우리의 이야기</SectionTitle>
            <GlassCard className="overflow-hidden p-0">
              {wedding.loveStoryVideo.includes("youtube") || wedding.loveStoryVideo.includes("youtu.be") ? (
                <iframe
                  src={wedding.loveStoryVideo.includes("youtu.be") ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("youtu.be/")[1]?.split("?")[0]}` : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("watch?v=")[1]?.split("&")[0]}`}
                  className="w-full aspect-video"
                  allowFullScreen
                />
              ) : (
                <video src={wedding.loveStoryVideo} controls className="w-full aspect-video" />
              )}
            </GlassCard>
          </motion.div>
        </Section>
      )}

      {wedding.galleries && wedding.galleries.length > 0 && (
        <Section id="gallery-section">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <SectionTitle>갤러리</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {wedding.galleries.slice(0, 9).map((item, index) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  whileInView={{ opacity: 1, scale: 1 }} 
                  viewport={{ once: true }} 
                  transition={{ delay: index * 0.05 }} 
                  onClick={() => setGalleryIndex(index)} 
                  className="aspect-square rounded-[16px] overflow-hidden cursor-pointer"
                  style={{ 
                    boxShadow: '0 4px 20px rgba(180,170,220,0.15)',
                    border: '1px solid rgba(255,255,255,0.5)'
                  }}
                >
                  {item.mediaType === 'VIDEO' ? (
                    <video src={item.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.mediaUrl} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Section>
      )}

      <Section id="venue-section">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center">
          <SectionTitle>오시는 길</SectionTitle>
          <GlassCard className="overflow-hidden p-0">
            <KakaoMap address={wedding.venueAddress} venue={wedding.venue} latitude={wedding.venueLatitude} longitude={wedding.venueLongitude} />
            <div className="p-6 text-center">
              <p className="flex items-center justify-center gap-2 text-[15px]" style={{ color: '#6B5B8C', fontFamily: 'ChangwonDangamRounded, sans-serif' }}>
                <MapPin className="w-4 h-4" style={{ color: '#B8B0E8' }} />
                {wedding.venue}
              </p>
              {wedding.venueHall && <p className="text-[13px] mt-1.5" style={{ color: '#9B8EC2' }}>{wedding.venueHall}</p>}
              <p className="text-[12px] mt-2" style={{ color: '#A89ED0' }}>{wedding.venueAddress}</p>
              {wedding.venuePhone && (
                <a href={`tel:${wedding.venuePhone}`} className="inline-flex items-center gap-1.5 mt-3 text-[12px]" style={{ color: '#8B7EB0' }}>
                  <Phone className="w-3 h-3" />{wedding.venuePhone}
                </a>
              )}
              <div className="flex justify-center gap-2 mt-5">
                {wedding.venueNaverMap && (
                  <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-full text-white text-[11px] tracking-wide" style={{ background: '#03C75A' }}>네이버</a>
                )}
                {wedding.venueKakaoMap && (
                  <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-full text-[11px] tracking-wide" style={{ background: '#FEE500', color: '#3C1E1E' }}>카카오</a>
                )}
                {wedding.venueTmap && (
                  <a href={wedding.venueTmap} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-full text-white text-[11px] tracking-wide" style={{ background: '#EF4123' }}>티맵</a>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </Section>

      <Section id="rsvp-section">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center">
          <SectionTitle>참석 여부</SectionTitle>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="glass" />
        </motion.div>
      </Section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <Section id="account-section">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center">
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
                  <a href={wedding.tossLink} target="_blank" className="px-6 py-3 rounded-full text-white text-[12px] tracking-wide" style={{ background: '#0064FF' }}>토스</a>
                )}
                {wedding.kakaoPayLink && (
                  <a href={wedding.kakaoPayLink} target="_blank" className="px-6 py-3 rounded-full text-[12px] tracking-wide" style={{ background: '#FEE500', color: '#3C1E1E' }}>카카오페이</a>
                )}
              </div>
            )}
          </motion.div>
        </Section>
      )}

      <Section id="guestbook-section">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <SectionTitle className="text-center">방명록</SectionTitle>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="glass" />
          <GuestbookList 
            guestbooks={localGuestbooks} 
            weddingSlug={wedding.slug} 
            onDelete={handleGuestbookDelete}
            variant="glass"
          />
        </motion.div>
      </Section>

      {wedding.closingMessage && (
        <Section>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <GlassCard className="p-8">
              <p className="text-[14px] whitespace-pre-line" style={{ color: '#7B6B9C', lineHeight: 2 }}>{wedding.closingMessage}</p>
            </GlassCard>
          </motion.div>
        </Section>
      )}

      <Section>
        <div className="text-center">
          <button 
            onClick={() => setShowShareModal(true)} 
            className="px-10 py-4 rounded-full text-[14px] tracking-wide flex items-center gap-2.5 mx-auto transition-all duration-300 hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, #C4B8E8, #A8D0E8)',
              color: '#FFFFFF',
              boxShadow: '0 8px 25px rgba(180,170,220,0.4)',
              fontFamily: 'ChangwonDangamRounded, sans-serif'
            }}
          >
            <Share2 className="w-4 h-4" />공유하기
          </button>
          <div className="flex justify-center gap-6 mt-8">
            {wedding.groomPhone && (
              <a href={`tel:${wedding.groomPhone}`} className="text-center group">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-105" style={{ 
                  background: 'rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255,255,255,0.6)',
                  boxShadow: '0 4px 15px rgba(180,170,220,0.15)'
                }}>
                  <Phone className="w-5 h-5" style={{ color: '#9B8EC2' }} />
                </div>
                <span className="text-[11px]" style={{ color: '#A89ED0', fontFamily: 'ChangwonDangamRounded, sans-serif' }}>신랑</span>
              </a>
            )}
            {wedding.bridePhone && (
              <a href={`tel:${wedding.bridePhone}`} className="text-center group">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-105" style={{ 
                  background: 'rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255,255,255,0.6)',
                  boxShadow: '0 4px 15px rgba(180,170,220,0.15)'
                }}>
                  <Phone className="w-5 h-5" style={{ color: '#9B8EC2' }} />
                </div>
                <span className="text-[11px]" style={{ color: '#A89ED0', fontFamily: 'ChangwonDangamRounded, sans-serif' }}>신부</span>
              </a>
            )}
          </div>
        </div>
      </Section>

      <footer className="py-10 text-center relative z-10" style={{ background: "rgba(180,170,200,0.15)" }}>
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-[10px] tracking-[0.3em] hover:opacity-70 transition-opacity" style={{ color: '#8A80A0', fontFamily: 'ChangwonDangamRounded, sans-serif' }}>Made by 청첩장 작업실 ›</a>
      </footer>

      <AnimatePresence>
        {galleryIndex !== null && wedding.galleries && (
          <GalleryModal 
            galleries={wedding.galleries} 
            currentIndex={galleryIndex} 
            onClose={() => setGalleryIndex(null)} 
            onNavigate={setGalleryIndex} theme="GLASS_BUBBLE" usePhotoFilter={wedding.usePhotoFilter ?? true} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="glass" />
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

function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-8 ${className}`}>
      <p className="text-[18px] tracking-wide" style={{ color: '#7B6B9C', fontFamily: 'ChangwonDangamRounded, sans-serif' }}>{children}</p>
      <div className="flex items-center justify-center gap-2 mt-3">
        <div className="w-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,190,230,0.5))' }} />
        <div className="w-2 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, #C4B8E8, #A8D0E8)' }} />
        <div className="w-8 h-px" style={{ background: 'linear-gradient(90deg, rgba(200,190,230,0.5), transparent)' }} />
      </div>
    </div>
  );
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={`rounded-[24px] ${className}`}
      style={{ 
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(25px)',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 8px 32px rgba(180,170,220,0.12), inset 0 1px 0 rgba(255,255,255,0.5)'
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
    <GlassCard>
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-center justify-between">
        <span className="text-[14px]" style={{ color: '#6B5B8C', fontFamily: 'ChangwonDangamRounded, sans-serif' }}>{title}</span>
        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ color: '#B8B0E8' }} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(200,190,230,0.2)' }}>
              {accounts.map((acc, i) => (
                <div key={i} className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-[14px]" style={{ color: '#6B5B8C' }}>{acc.holder}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: '#A89ED0' }}>{acc.bank} {acc.account}</p>
                  </div>
                  <button 
                    onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)} 
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{ 
                      background: copiedAccount === `${title}-${i}` ? 'linear-gradient(135deg, #C4B8E8, #A8D0E8)' : 'rgba(200,190,230,0.15)',
                      border: '1px solid rgba(200,190,230,0.3)'
                    }}
                  >
                    {copiedAccount === `${title}-${i}` ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" style={{ color: '#9B8EC2' }} />}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

declare global { interface Window { Kakao?: any; } }
