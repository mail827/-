import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

export default function PoeticLove({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot }: ThemeProps) {
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
    const title = `${wedding.groomName} ♥ ${wedding.brideName}`;
    if (type === 'kakao' && window.Kakao) {
      window.Kakao.Share.sendDefault({ objectType: 'feed', content: { title, description: formatDate(wedding.weddingDate, 'korean'), imageUrl: wedding.heroMedia || '', link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }] });
    } else if (type === 'instagram') {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.\n인스타그램 스토리에 공유해보세요!');
    } else if (type === 'sms') {
      window.location.href = `sms:?&body=${encodeURIComponent(`${title}\n${url}`)}`;
    }
    setShowShareModal(false);
  };

  const calendarData = getCalendarData(wedding.weddingDate);

  return (
    <div className="min-h-screen bg-[#FBF9FD]" style={{ fontFamily: "'NostalgicMyoeunHeullim', 'Nanum Myeongjo', serif" }}>
      <style>{`
        @font-face {
          font-family: 'NostalgicMyoeunHeullim';
          src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-1@1.0/Griun_MyoeunHeullim-Rg.woff2') format('woff2');
          font-weight: normal;
          font-display: swap;
        }
        @import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap');
      `}</style>
      
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center border border-[#E5DDF5]">
          {isPlaying ? <Volume2 className="w-4 h-4 text-[#A393D3]" /> : <VolumeX className="w-4 h-4 text-[#C9B7E8]" />}
        </button>
      )}

      <section className="min-h-screen flex flex-col items-center justify-center px-8 py-24">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 1.5 }}
          className="text-center w-full max-w-sm"
        >
          <p className="text-xs tracking-[0.3em] text-[#A393D3] mb-16">우리, 결혼합니다</p>
          
          {wedding.heroMedia && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="mb-16"
            >
              <div className="aspect-[3/4] max-w-[280px] mx-auto overflow-hidden rounded-sm shadow-lg">
                {wedding.heroMediaType === 'VIDEO' ? (
                  <video src={heroUrl(wedding.heroMedia)} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={heroUrl(wedding.heroMedia)} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h1 className="text-3xl text-[#2A2A2A] tracking-[0.2em] font-normal">
              {wedding.groomName}
              <span className="text-[#C9B7E8] mx-4 text-2xl">그리고</span>
              {wedding.brideName}
            </h1>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-12 space-y-2"
          >
            <p className="text-sm text-[#666] tracking-wider">{formatDate(wedding.weddingDate, 'korean')}</p>
            <p className="text-sm text-[#888]">{formatTime(wedding.weddingTime)}</p>
            <p className="text-xs text-[#A393D3] mt-4">{wedding.venue}</p>
          </motion.div>
          
          {wedding.showDday && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-xs text-[#C9B7E8] mt-8 tracking-widest"
            >
              {getDday(wedding.weddingDate)}
            </motion.p>
          )}
        </motion.div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#E5DDF5] to-transparent mx-12" />

      {wedding.greeting && (
        <Section>
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-xs tracking-[0.3em] text-[#C9B7E8] mb-12">초대의 글</p>
            
            {wedding.greetingTitle && (
              <p className="text-lg text-[#2A2A2A] mb-8 tracking-wide">{wedding.greetingTitle}</p>
            )}
            
            <p className="text-sm text-[#555] leading-[2.5] whitespace-pre-line tracking-wide">
              {wedding.greeting}
            </p>
            
            {wedding.showParents && (
              <div className="mt-16 pt-8 border-t border-[#E5DDF5]">
                <div className="space-y-6 text-sm text-[#666]">
                  <div className="flex justify-center items-center gap-4">
                    <span className="text-[#999]">{wedding.groomFatherName} · {wedding.groomMotherName}</span>
                    <span className="text-[#A393D3]">의 아들</span>
                    <span className="text-[#2A2A2A]">{wedding.groomName}</span>
                  </div>
                  <div className="flex justify-center items-center gap-4">
                    <span className="text-[#999]">{wedding.brideFatherName} · {wedding.brideMotherName}</span>
                    <span className="text-[#A393D3]">의 딸</span>
                    <span className="text-[#2A2A2A]">{wedding.brideName}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </Section>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-[#E5DDF5] to-transparent mx-12" />

      <Section>
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="text-xs tracking-[0.3em] text-[#C9B7E8] mb-12">날짜</p>
          <div className="max-w-xs mx-auto">
            <p className="text-[#2A2A2A] text-lg mb-8 tracking-wider">
              {calendarData.year}. {String(calendarData.month).padStart(2, '0')}
            </p>
            <div className="grid grid-cols-7 gap-2 text-xs">
              {['일','월','화','수','목','금','토'].map((d,i) => (
                <div key={i} className={`py-3 ${i === 0 ? 'text-[#C9B7E8]' : i === 6 ? 'text-[#A393D3]' : 'text-[#999]'}`}>{d}</div>
              ))}
              {calendarData.weeks.flat().map((day, i) => (
                <div 
                  key={i} 
                  className={`py-3 ${
                    day === calendarData.targetDay 
                      ? 'bg-[#C9B7E8] text-white rounded-full' 
                      : day ? 'text-[#666]' : ''
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="mt-10 flex justify-center gap-8 text-xs text-[#888]">
              <span className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-[#C9B7E8]" />
                {formatDate(wedding.weddingDate, 'short')}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-[#C9B7E8]" />
                {formatTime(wedding.weddingTime)}
              </span>
            </div>
          </div>
        </motion.div>
      </Section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#E5DDF5] to-transparent mx-12" />

      {wedding.loveStoryVideo && (
        <>
          <Section>
            <motion.div 
              initial={{ opacity: 0 }} 
              whileInView={{ opacity: 1 }} 
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-xs tracking-[0.3em] text-[#C9B7E8] mb-12">우리의 이야기</p>
              <div className="rounded-sm overflow-hidden shadow-sm">
                {wedding.loveStoryVideo.includes("youtube") || wedding.loveStoryVideo.includes("youtu.be") ? (
                  <iframe 
                    src={wedding.loveStoryVideo.includes("youtu.be") 
                      ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("youtu.be/")[1]?.split("?")[0]}` 
                      : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("watch?v=")[1]?.split("&")[0]}`} 
                    className="w-full aspect-video" 
                    allowFullScreen 
                  />
                ) : (
                  <video src={wedding.loveStoryVideo} controls className="w-full aspect-video" />
                )}
              </div>
            </motion.div>
          </Section>
          <div className="h-px bg-gradient-to-r from-transparent via-[#E5DDF5] to-transparent mx-12" />
        </>
      )}

      {wedding.galleries && wedding.galleries.length > 0 && (
        <>
          <Section id="gallery-section">
            <motion.div 
              initial={{ opacity: 0 }} 
              whileInView={{ opacity: 1 }} 
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-xs tracking-[0.3em] text-[#C9B7E8] mb-12">갤러리</p>
              <div className="grid grid-cols-1 gap-6">
                {wedding.galleries.slice(0, 3).map((item, index) => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    onClick={() => setGalleryIndex(index)} 
                    className="aspect-[4/3] rounded-sm overflow-hidden cursor-pointer shadow-sm"
                  >
                    {item.mediaType === 'VIDEO' ? (
                      <video src={item.mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={galleryThumbUrl(item.mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-102 transition-transform duration-700" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </Section>
          <div className="h-px bg-gradient-to-r from-transparent via-[#E5DDF5] to-transparent mx-12" />
        </>
      )}

      <Section id="venue-section">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs tracking-[0.3em] text-[#C9B7E8] mb-12">오시는 길</p>
          <div className="rounded-sm overflow-hidden shadow-sm bg-white">
            <KakaoMap address={wedding.venueAddress} venue={wedding.venue} latitude={wedding.venueLatitude} longitude={wedding.venueLongitude} />
            <div className="p-8 text-center">
              <p className="text-[#2A2A2A] flex items-center justify-center gap-2 text-lg">
                <MapPin className="w-4 h-4 text-[#C9B7E8]" />
                {wedding.venue}
              </p>
              {wedding.venueHall && <p className="text-[#888] text-sm mt-2">{wedding.venueHall}</p>}
              <p className="text-[#999] text-xs mt-2 tracking-wide">{wedding.venueAddress}</p>
              
              <div className="flex justify-center gap-3 mt-8">
                {wedding.venueNaverMap && (
                  <a href={wedding.venueNaverMap} target="_blank" className="px-5 py-2 bg-[#03C75A] text-white rounded-sm text-xs tracking-wide">네이버</a>
                )}
                {wedding.venueKakaoMap && (
                  <a href={wedding.venueKakaoMap} target="_blank" className="px-5 py-2 bg-[#FEE500] text-[#333] rounded-sm text-xs tracking-wide">카카오</a>
                )}
                {wedding.venueTmap && (
                  <a href={wedding.venueTmap} target="_blank" className="px-5 py-2 bg-[#EF4123] text-white rounded-sm text-xs tracking-wide">티맵</a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#E5DDF5] to-transparent mx-12" />

      <Section id="rsvp-section">
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs tracking-[0.3em] text-[#C9B7E8] mb-12">참석 여부</p>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="poetic" />
        </motion.div>
      </Section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#E5DDF5] to-transparent mx-12" />

      {(wedding.groomAccount || wedding.brideAccount) && (
        <>
          <Section id="account-section">
            <motion.div 
              initial={{ opacity: 0 }} 
              whileInView={{ opacity: 1 }} 
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-xs tracking-[0.3em] text-[#C9B7E8] mb-4">마음 전하실 곳</p>
              <p className="text-xs text-[#999] mb-12">축하의 마음을 담아 축의금을 전달해보세요</p>
              
              <div className="space-y-3">
                <AccountCard 
                  title="신랑측" 
                  accounts={[wedding.groomAccount && { bank: wedding.groomBank, account: wedding.groomAccount, holder: wedding.groomAccountHolder || wedding.groomName }].filter(Boolean) as any[]} 
                  isOpen={openAccount === 'groom'} 
                  onToggle={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} 
                  copiedAccount={copiedAccount} 
                  onCopy={copyToClipboard} 
                />
                <AccountCard 
                  title="신부측" 
                  accounts={[wedding.brideAccount && { bank: wedding.brideBank, account: wedding.brideAccount, holder: wedding.brideAccountHolder || wedding.brideName }].filter(Boolean) as any[]} 
                  isOpen={openAccount === 'bride'} 
                  onToggle={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} 
                  copiedAccount={copiedAccount} 
                  onCopy={copyToClipboard} 
                />
              </div>
              
              {(wedding.tossLink || wedding.kakaoPayLink) && (
                <div className="flex justify-center gap-3 mt-8">
                  {wedding.tossLink && (
                    <a href={wedding.tossLink} target="_blank" className="px-6 py-2.5 bg-[#0064FF] text-white rounded-sm text-xs tracking-wide">토스로 보내기</a>
                  )}
                  {wedding.kakaoPayLink && (
                    <a href={wedding.kakaoPayLink} target="_blank" className="px-6 py-2.5 bg-[#FEE500] text-[#333] rounded-sm text-xs tracking-wide">카카오페이</a>
                  )}
                </div>
              )}
            </motion.div>
          </Section>
          <div className="h-px bg-gradient-to-r from-transparent via-[#E5DDF5] to-transparent mx-12" />
        </>
      )}

      <Section id="guestbook-section">
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }}
        >
          <p className="text-xs tracking-[0.3em] text-[#C9B7E8] mb-12 text-center">방명록</p>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="poetic" />
          <GuestbookList 
            guestbooks={localGuestbooks} 
            weddingSlug={wedding.slug} 
            onDelete={handleGuestbookDelete}
            variant="poetic"
          />
        </motion.div>
      </Section>

      {guestPhotoSlot && (
        <Section id="guest-gallery-section">
          {guestPhotoSlot}
        </Section>
      )}

      {wedding.closingMessage && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-[#E5DDF5] to-transparent mx-12" />
          <Section>
            <motion.div 
              initial={{ opacity: 0 }} 
              whileInView={{ opacity: 1 }} 
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-sm text-[#555] leading-[2.5] whitespace-pre-line tracking-wide">
                {wedding.closingMessage}
              </p>
            </motion.div>
          </Section>
        </>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-[#E5DDF5] to-transparent mx-12" />

      <Section>
        <div className="text-center">
          <button 
            onClick={() => setShowShareModal(true)} 
            className="px-10 py-3 bg-[#C9B7E8] text-white rounded-sm text-sm flex items-center gap-3 mx-auto hover:bg-[#A393D3] transition-colors tracking-wide"
          >
            <Share2 className="w-4 h-4" />
            공유하기
          </button>
          
          <div className="flex justify-center gap-8 mt-10">
            {wedding.groomPhone && (
              <a href={`tel:${wedding.groomPhone}`} className="text-center group">
                <div className="w-12 h-12 rounded-full bg-white border border-[#E5DDF5] flex items-center justify-center mb-2 group-hover:border-[#C9B7E8] transition-colors">
                  <Phone className="w-4 h-4 text-[#A393D3]" />
                </div>
                <span className="text-xs text-[#999]">신랑</span>
              </a>
            )}
            {wedding.bridePhone && (
              <a href={`tel:${wedding.bridePhone}`} className="text-center group">
                <div className="w-12 h-12 rounded-full bg-white border border-[#E5DDF5] flex items-center justify-center mb-2 group-hover:border-[#C9B7E8] transition-colors">
                  <Phone className="w-4 h-4 text-[#A393D3]" />
                </div>
                <span className="text-xs text-[#999]">신부</span>
              </a>
            )}
          </div>
        </div>
      </Section>

      <footer className="py-12 text-center" style={{ background: "#F0EAF5" }}>
        <a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#9A88C0] tracking-[0.2em] hover:text-[#7A68A0] transition-colors">Made by 청첩장 작업실 ›</a>
      </footer>

      <AnimatePresence>
        {galleryIndex !== null && wedding.galleries && (
          <GalleryModal 
            galleries={wedding.galleries} 
            currentIndex={galleryIndex} 
            onClose={() => setGalleryIndex(null)} 
            onNavigate={setGalleryIndex} theme="POETIC_LOVE" usePhotoFilter={wedding.usePhotoFilter ?? true} 
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="light" />
      </AnimatePresence>
    </div>
  );
}

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`py-20 px-8 ${className}`}>
      <div className="max-w-sm mx-auto">{children}</div>
    </section>
  );
}

function AccountCard({ title, accounts, isOpen, onToggle, copiedAccount, onCopy }: { title: string; accounts: any[]; isOpen: boolean; onToggle: () => void; copiedAccount: string | null; onCopy: (t: string, id: string) => void }) {
  if (!accounts.length) return null;
  return (
    <div className="bg-white rounded-sm overflow-hidden border border-[#E5DDF5]">
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-center justify-between text-sm text-[#555]">
        <span className="tracking-wide">{title}</span>
        <ChevronDown className={`w-4 h-4 text-[#C9B7E8] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4 border-t border-[#E5DDF5]">
              {accounts.map((acc, i) => (
                <div key={i} className="flex items-center justify-between pt-4">
                  <div className="text-left">
                    <p className="text-sm text-[#2A2A2A]">{acc.holder}</p>
                    <p className="text-xs text-[#999] mt-1">{acc.bank} {acc.account}</p>
                  </div>
                  <button 
                    onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)} 
                    className="px-4 py-2 bg-[#FBF9FD] border border-[#E5DDF5] rounded-sm text-xs text-[#A393D3] hover:bg-[#E5DDF5] transition-colors"
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
