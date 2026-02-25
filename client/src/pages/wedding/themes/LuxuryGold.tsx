import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

export default function LuxuryGold({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading }: ThemeProps) {
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
    const title = `${wedding.groomName} & ${wedding.brideName}`;
    if (type === 'kakao' && window.Kakao) {
      window.Kakao.Share.sendDefault({ objectType: 'feed', content: { title, description: formatDate(wedding.weddingDate, 'dots'), imageUrl: wedding.heroMedia || '', link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }] });
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
    <div className="min-h-screen bg-[#0D0D0D] text-white" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center border border-[#C9A96E]/30">
          {isPlaying ? <Volume2 className="w-4 h-4 text-[#C9A96E]" /> : <VolumeX className="w-4 h-4 text-[#555]" />}
        </button>
      )}

      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative">
        <div className="absolute top-6 left-6 w-16 h-16 border-l border-t border-[#C9A96E]/20" />
        <div className="absolute top-6 right-6 w-16 h-16 border-r border-t border-[#C9A96E]/20" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-l border-b border-[#C9A96E]/20" />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-r border-b border-[#C9A96E]/20" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="text-center w-full max-w-sm">
          <p className="text-[10px] tracking-[0.5em] text-[#C9A96E]/60 mb-8">THE WEDDING OF</p>
          
          {wedding.heroMedia && (
            <div className="relative mb-10">
              <div className="absolute -inset-2 border border-[#C9A96E]/20" />
              <div className="aspect-[3/4] overflow-hidden">
                {wedding.heroMediaType === 'VIDEO' ? <video src={heroUrl(wedding.heroMedia)} autoPlay muted loop playsInline className="w-full h-full object-cover" /> : <img src={heroUrl(wedding.heroMedia)} alt="" className="w-full h-full object-cover" />}
              </div>
            </div>
          )}
          
          <h1 className="text-3xl text-[#C9A96E] font-light italic tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>{wedding.groomName} & {wedding.brideName}</h1>
          <div className="flex items-center justify-center gap-3 my-4">
            <div className="w-12 h-px bg-[#C9A96E]/30" /><div className="w-1.5 h-1.5 bg-[#C9A96E] rotate-45" /><div className="w-12 h-px bg-[#C9A96E]/30" />
          </div>
          <div className="text-sm text-[#888] space-y-1">
            <p>{formatDate(wedding.weddingDate, 'dots')}</p>
            <p>{formatTime(wedding.weddingTime)}</p>
            <p className="text-[#666]">{wedding.venue}</p>
          </div>
          {wedding.showDday && <p className="text-xs text-[#C9A96E]/60 tracking-wider mt-4">{getDday(wedding.weddingDate)}</p>}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-8"><ChevronDown className="w-5 h-5 text-[#C9A96E]/30 animate-bounce" /></motion.div>
      </section>

      {wedding.greeting && (
        <Section>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <GoldDivider />
            <div className="mt-8">
              {wedding.greetingTitle && <p className="text-[#C9A96E] italic mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>{wedding.greetingTitle}</p>}
              <p className="text-sm text-[#999] leading-[2.2] whitespace-pre-line">{wedding.greeting}</p>
              {wedding.showParents && (
                <div className="mt-10 pt-8 border-t border-[#C9A96E]/10 grid grid-cols-2 gap-6 text-sm">
                  <div className="text-center"><p className="text-[10px] tracking-[0.3em] text-[#C9A96E]/40 mb-2">GROOM</p><p className="text-[#666] text-xs">{wedding.groomFatherName} · {wedding.groomMotherName}</p><p className="text-[#aaa] mt-1">{wedding.groomName}</p></div>
                  <div className="text-center"><p className="text-[10px] tracking-[0.3em] text-[#C9A96E]/40 mb-2">BRIDE</p><p className="text-[#666] text-xs">{wedding.brideFatherName} · {wedding.brideMotherName}</p><p className="text-[#aaa] mt-1">{wedding.brideName}</p></div>
                </div>
              )}
            </div>
          </motion.div>
        </Section>
      )}

      <Section className="bg-[#111]">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <GoldDivider /><p className="text-[10px] tracking-[0.4em] text-[#C9A96E]/60 mt-6 mb-6">CALENDAR</p>
          <div className="border border-[#C9A96E]/20 p-6 max-w-xs mx-auto">
            <p className="text-[#C9A96E] mb-4">{calendarData.year}. {String(calendarData.month).padStart(2, '0')}</p>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="py-1.5 text-[#C9A96E]/40">{d}</div>)}
              {calendarData.weeks.flat().map((day, i) => (<div key={i} className={`py-1.5 ${day === calendarData.targetDay ? 'bg-[#C9A96E] text-black' : day ? 'text-[#888]' : ''}`}>{day}</div>))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#C9A96E]/10 flex justify-center gap-4 text-xs text-[#888]">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#C9A96E]/60" />{formatDate(wedding.weddingDate, 'short')}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#C9A96E]/60" />{formatTime(wedding.weddingTime)}</span>
            </div>
          </div>
        </motion.div>
      </Section>

      {wedding.loveStoryVideo && (
  <Section>
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
      <p className="text-xs tracking-[0.2em] text-[#C9A96E]/60 mb-6">OUR STORY</p>
      <div className="rounded-2xl overflow-hidden bg-[#C9A96E]/10">
        {wedding.loveStoryVideo.includes("youtube") || wedding.loveStoryVideo.includes("youtu.be") ? (
          <iframe src={wedding.loveStoryVideo.includes("youtu.be") ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("youtu.be/")[1]?.split("?")[0]}` : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("watch?v=")[1]?.split("&")[0]}`} className="w-full aspect-video" allowFullScreen />
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
            <GoldDivider /><p className="text-[10px] tracking-[0.4em] text-[#C9A96E]/60 mt-6 mb-6">GALLERY</p>
            <div className="grid grid-cols-3 gap-1">
              {wedding.galleries.slice(0, 9).map((item, index) => (
                <div key={item.id} onClick={() => setGalleryIndex(index)} className="aspect-square cursor-pointer overflow-hidden bg-[#1a1a1a] relative group">
                  {item.mediaType === 'VIDEO' ? <video src={item.mediaUrl} className="w-full h-full object-cover" /> : <img src={galleryThumbUrl(item.mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  <div className="absolute inset-0 border border-[#C9A96E]/0 group-hover:border-[#C9A96E]/30 transition-all" />
                </div>
              ))}
            </div>
          </motion.div>
        </Section>
      )}

      <Section id="venue-section" className="bg-[#111]">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <GoldDivider /><p className="text-[10px] tracking-[0.4em] text-[#C9A96E]/60 mt-6 mb-6">LOCATION</p>
          <div className="border border-[#C9A96E]/20 overflow-hidden">
            <KakaoMap address={wedding.venueAddress} venue={wedding.venue} latitude={wedding.venueLatitude} longitude={wedding.venueLongitude} />
            <div className="p-6 text-center">
              <p className="text-[#ccc] flex items-center justify-center gap-1"><MapPin className="w-4 h-4 text-[#C9A96E]" />{wedding.venue}</p>
              {wedding.venueHall && <p className="text-[#C9A96E]/80 text-sm mt-1">{wedding.venueHall}</p>}
              <p className="text-[#666] text-sm mt-1">{wedding.venueAddress}</p>
              <div className="flex justify-center gap-2 mt-4">
                {wedding.venueNaverMap && <a href={wedding.venueNaverMap} target="_blank" className="px-4 py-2 border border-[#C9A96E]/30 text-[#C9A96E] text-xs hover:bg-[#C9A96E] hover:text-black transition-all">네이버</a>}
                {wedding.venueKakaoMap && <a href={wedding.venueKakaoMap} target="_blank" className="px-4 py-2 border border-[#C9A96E]/30 text-[#C9A96E] text-xs hover:bg-[#C9A96E] hover:text-black transition-all">카카오</a>}
                {wedding.venueTmap && <a href={wedding.venueTmap} target="_blank" className="px-4 py-2 border border-[#C9A96E]/30 text-[#C9A96E] text-xs hover:bg-[#C9A96E] hover:text-black transition-all">티맵</a>}
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      <Section id="rsvp-section">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <GoldDivider /><p className="text-[10px] tracking-[0.4em] text-[#C9A96E]/60 mt-6 mb-6">RSVP</p>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="luxury" />
        </motion.div>
      </Section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <Section id="account-section" className="bg-[#111]">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <GoldDivider /><p className="text-[10px] tracking-[0.4em] text-[#C9A96E]/60 mt-6 mb-6">GIFT</p>
            <div className="space-y-px">
              <AccountCard title="GROOM" accounts={[wedding.groomAccount && { bank: wedding.groomBank, account: wedding.groomAccount, holder: wedding.groomAccountHolder || wedding.groomName }].filter(Boolean) as any[]} isOpen={openAccount === 'groom'} onToggle={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} copiedAccount={copiedAccount} onCopy={copyToClipboard} />
              <AccountCard title="BRIDE" accounts={[wedding.brideAccount && { bank: wedding.brideBank, account: wedding.brideAccount, holder: wedding.brideAccountHolder || wedding.brideName }].filter(Boolean) as any[]} isOpen={openAccount === 'bride'} onToggle={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} copiedAccount={copiedAccount} onCopy={copyToClipboard} />
            </div>
            {(wedding.tossLink || wedding.kakaoPayLink) && (
              <div className="flex justify-center gap-2 mt-4">
                {wedding.tossLink && <a href={wedding.tossLink} target="_blank" className="px-5 py-2.5 bg-[#0064FF] text-white text-sm">TOSS</a>}
                {wedding.kakaoPayLink && <a href={wedding.kakaoPayLink} target="_blank" className="px-5 py-2.5 bg-[#FEE500] text-black text-sm">KAKAO</a>}
              </div>
            )}
          </motion.div>
        </Section>
      )}

      <Section id="guestbook-section">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <GoldDivider /><p className="text-[10px] tracking-[0.4em] text-[#C9A96E]/60 mt-6 mb-6 text-center">GUESTBOOK</p>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="luxury" />
          <GuestbookList 
            guestbooks={localGuestbooks} 
            weddingSlug={wedding.slug} 
            onDelete={handleGuestbookDelete}
            variant="luxury"
          />
        </motion.div>
      </Section>

      {wedding.closingMessage && (
        <Section className="bg-[#111]">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <GoldDivider /><p className="text-sm text-[#888] leading-[2] whitespace-pre-line mt-6">{wedding.closingMessage}</p>
          </motion.div>
        </Section>
      )}

      <Section>
        <div className="text-center">
          <button onClick={() => setShowShareModal(true)} className="px-8 py-3 bg-[#C9A96E] text-black text-sm flex items-center gap-2 mx-auto hover:bg-[#D4B97A] transition-colors"><Share2 className="w-4 h-4" />SHARE</button>
          <div className="flex justify-center gap-6 mt-6">
            {wedding.groomPhone && <a href={`tel:${wedding.groomPhone}`} className="text-center"><div className="w-12 h-12 border border-[#C9A96E]/30 flex items-center justify-center mb-1 hover:bg-[#C9A96E] hover:text-black transition-all"><Phone className="w-5 h-5 text-[#C9A96E]" /></div><span className="text-xs text-[#666]">Groom</span></a>}
            {wedding.bridePhone && <a href={`tel:${wedding.bridePhone}`} className="text-center"><div className="w-12 h-12 border border-[#C9A96E]/30 flex items-center justify-center mb-1 hover:bg-[#C9A96E] hover:text-black transition-all"><Phone className="w-5 h-5 text-[#C9A96E]" /></div><span className="text-xs text-[#666]">Bride</span></a>}
          </div>
        </div>
      </Section>

      <footer className="py-8 text-center text-[10px] tracking-[0.3em]" style={{ background: "#1A1A1A" }}><a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-[#666] hover:text-[#888] transition-colors">Made by 청첩장 작업실 ›</a></footer>

      <AnimatePresence>{galleryIndex !== null && wedding.galleries && <GalleryModal galleries={wedding.galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="LUXURY_GOLD" usePhotoFilter={wedding.usePhotoFilter ?? true} />}</AnimatePresence>
      <AnimatePresence><ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="dark" /></AnimatePresence>
    </div>
  );
}

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`py-16 px-6 ${className}`}><div className="max-w-md mx-auto">{children}</div></section>;
}

function GoldDivider() {
  return (<div className="flex items-center justify-center gap-2"><div className="w-8 h-px bg-[#C9A96E]/30" /><div className="w-1.5 h-1.5 bg-[#C9A96E] rotate-45" /><div className="w-8 h-px bg-[#C9A96E]/30" /></div>);
}

function AccountCard({ title, accounts, isOpen, onToggle, copiedAccount, onCopy }: { title: string; accounts: any[]; isOpen: boolean; onToggle: () => void; copiedAccount: string | null; onCopy: (t: string, id: string) => void }) {
  if (!accounts.length) return null;
  return (
    <div className="border border-[#C9A96E]/20">
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between text-xs tracking-[0.2em] text-[#C9A96E]/80"><span>{title}</span><ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-[#C9A96E]/10">
              {accounts.map((acc, i) => (
                <div key={i} className="flex items-center justify-between pt-3">
                  <div><p className="text-sm text-[#ccc]">{acc.holder}</p><p className="text-xs text-[#666]">{acc.bank} {acc.account}</p></div>
                  <button onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)} className="px-3 py-1.5 border border-[#C9A96E]/30 text-[#C9A96E] text-xs">{copiedAccount === `${title}-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</button>
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
