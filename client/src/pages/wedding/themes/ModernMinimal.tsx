import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

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

  const handleShare = async (type: 'kakao' | 'instagram' | 'sms') => {
    const url = window.location.href;
    const title = `${wedding.groomName} · ${wedding.brideName}`;
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
    <div className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-stone-100">
          {isPlaying ? <Volume2 className="w-4 h-4 text-stone-600" /> : <VolumeX className="w-4 h-4 text-stone-300" />}
        </button>
      )}

      <section className="min-h-screen flex flex-col">
        <p className="text-center text-[10px] tracking-[0.4em] text-stone-400 pt-12 pb-8">THE WEDDING OF</p>
        
        {wedding.heroMedia && (
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="relative w-full max-w-sm">
              <div className="aspect-[3/4] overflow-hidden">
                {wedding.heroMediaType === 'VIDEO' ? (
                  <video src={wedding.heroMedia} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={wedding.heroMedia} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-white flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-4 bg-[#E8E4DF] rounded-sm" />
                  <div className="w-3 h-3 bg-white border border-stone-200 rounded-sm rotate-45" />
                  <div className="w-8 h-4 bg-[#E8E4DF] rounded-sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center py-12 px-6">
          <h1 className="text-xl tracking-[0.2em] text-[#8B8577] font-light">
            {wedding.groomName} <span className="mx-3 text-stone-300">·</span> {wedding.brideName}
          </h1>
          <div className="mt-6 text-sm text-stone-400 space-y-1">
            <p>{formatDate(wedding.weddingDate, 'dots')} SAT PM {wedding.weddingTime?.split(':').slice(0,2).join(':')}</p>
            <p>{wedding.venue}</p>
          </div>
          {wedding.showDday && <p className="mt-4 text-xs text-stone-300">{getDday(wedding.weddingDate)}</p>}
        </div>
      </section>

      {wedding.greeting && (
        <Section>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            {wedding.greetingTitle && <p className="text-stone-500 mb-6">{wedding.greetingTitle}</p>}
            <p className="text-sm text-stone-400 leading-[2.2] whitespace-pre-line">{wedding.greeting}</p>
            {wedding.showParents && (
              <div className="mt-10 pt-6 border-t border-stone-100 grid grid-cols-2 gap-6 text-sm">
                <div className="text-center">
                  <p className="text-[10px] tracking-[0.2em] text-stone-300 mb-2">GROOM</p>
                  <p className="text-stone-400 text-xs">{wedding.groomFatherName} · {wedding.groomMotherName}</p>
                  <p className="text-stone-600 mt-1">{wedding.groomName}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] tracking-[0.2em] text-stone-300 mb-2">BRIDE</p>
                  <p className="text-stone-400 text-xs">{wedding.brideFatherName} · {wedding.brideMotherName}</p>
                  <p className="text-stone-600 mt-1">{wedding.brideName}</p>
                </div>
              </div>
            )}
          </motion.div>
        </Section>
      )}

      <Section className="bg-white">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <p className="text-[10px] tracking-[0.3em] text-stone-300 mb-6">CALENDAR</p>
          <div className="max-w-xs mx-auto">
            <p className="text-stone-500 text-lg mb-4">{calendarData.year}. {String(calendarData.month).padStart(2, '0')}</p>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="py-2 text-stone-300">{d}</div>)}
              {calendarData.weeks.flat().map((day, i) => (
                <div key={i} className={`py-2 ${day === calendarData.targetDay ? 'bg-stone-800 text-white rounded-full' : day ? 'text-stone-500' : ''}`}>{day}</div>
              ))}
            </div>
            <div className="mt-6 flex justify-center gap-6 text-xs text-stone-400">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(wedding.weddingDate, 'short')}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(wedding.weddingTime)}</span>
            </div>
          </div>
        </motion.div>
      </Section>

      {wedding.loveStoryVideo && (
  <section className="py-16 px-6">
    <div className="max-w-md mx-auto text-center">
      <p className="text-[10px] tracking-[0.2em] text-stone-300 mb-6">OUR STORY</p>
      <div className="rounded-xl overflow-hidden bg-stone-100">
        {wedding.loveStoryVideo.includes("youtube") || wedding.loveStoryVideo.includes("youtu.be") ? (
          <iframe src={wedding.loveStoryVideo.includes("youtu.be") ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("youtu.be/")[1]?.split("?")[0]}` : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("watch?v=")[1]?.split("&")[0]}`} className="w-full aspect-video" allowFullScreen />
        ) : (
          <video src={wedding.loveStoryVideo} controls className="w-full aspect-video" />
        )}
      </div>
    </div>
  </section>
)}

      {wedding.galleries && wedding.galleries.length > 0 && (
        <Section id="gallery-section">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <p className="text-[10px] tracking-[0.3em] text-stone-300 mb-6">GALLERY</p>
            <div className="grid grid-cols-3 gap-1">
              {wedding.galleries.slice(0, 9).map((item, index) => (
                <div key={item.id} onClick={() => setGalleryIndex(index)} className="aspect-square cursor-pointer overflow-hidden bg-stone-100">
                  {item.mediaType === 'VIDEO' ? <video src={item.mediaUrl} className="w-full h-full object-cover" /> : <img src={item.mediaUrl} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />}
                </div>
              ))}
            </div>
          </motion.div>
        </Section>
      )}

      <Section id="venue-section" className="bg-white">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <p className="text-[10px] tracking-[0.3em] text-stone-300 mb-6">LOCATION</p>
          <KakaoMap address={wedding.venueAddress} />
          <div className="mt-6">
            <p className="text-stone-600 flex items-center justify-center gap-1"><MapPin className="w-4 h-4 text-stone-400" />{wedding.venue}</p>
            {wedding.venueHall && <p className="text-stone-400 text-sm mt-1">{wedding.venueHall}</p>}
            <p className="text-stone-400 text-sm mt-1">{wedding.venueAddress}</p>
            <div className="flex justify-center gap-2 mt-4">
              {wedding.venueNaverMap && <a href={wedding.venueNaverMap} target="_blank" className="px-4 py-2 border border-stone-200 text-stone-500 text-xs hover:bg-stone-50 transition-colors">네이버</a>}
              {wedding.venueKakaoMap && <a href={wedding.venueKakaoMap} target="_blank" className="px-4 py-2 border border-stone-200 text-stone-500 text-xs hover:bg-stone-50 transition-colors">카카오</a>}
              {wedding.venueTmap && <a href={wedding.venueTmap} target="_blank" className="px-4 py-2 border border-stone-200 text-stone-500 text-xs hover:bg-stone-50 transition-colors">티맵</a>}
            </div>
          </div>
        </motion.div>
      </Section>

      <Section id="rsvp-section">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <p className="text-[10px] tracking-[0.3em] text-stone-300 mb-6">RSVP</p>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="minimal" />
        </motion.div>
      </Section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <Section id="account-section" className="bg-white">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <p className="text-[10px] tracking-[0.3em] text-stone-300 mb-6">GIFT</p>
            <div className="space-y-2">
              <AccountRow title="신랑측" accounts={[wedding.groomAccount && { bank: wedding.groomBank, account: wedding.groomAccount, holder: wedding.groomAccountHolder || wedding.groomName }].filter(Boolean) as any[]} isOpen={openAccount === 'groom'} onToggle={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} copiedAccount={copiedAccount} onCopy={copyToClipboard} />
              <AccountRow title="신부측" accounts={[wedding.brideAccount && { bank: wedding.brideBank, account: wedding.brideAccount, holder: wedding.brideAccountHolder || wedding.brideName }].filter(Boolean) as any[]} isOpen={openAccount === 'bride'} onToggle={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} copiedAccount={copiedAccount} onCopy={copyToClipboard} />
            </div>
            {(wedding.tossLink || wedding.kakaoPayLink) && (
              <div className="flex justify-center gap-2 mt-4">
                {wedding.tossLink && <a href={wedding.tossLink} target="_blank" className="px-5 py-2.5 bg-[#0064FF] text-white text-sm">토스</a>}
                {wedding.kakaoPayLink && <a href={wedding.kakaoPayLink} target="_blank" className="px-5 py-2.5 bg-[#FEE500] text-stone-800 text-sm">카카오페이</a>}
              </div>
            )}
          </motion.div>
        </Section>
      )}

      <Section id="guestbook-section">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[10px] tracking-[0.3em] text-stone-300 mb-6 text-center">GUESTBOOK</p>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="minimal" />
          <GuestbookList 
            guestbooks={localGuestbooks} 
            weddingSlug={wedding.slug} 
            onDelete={handleGuestbookDelete}
            variant="minimal"
          />
        </motion.div>
      </Section>

      {wedding.closingMessage && (
        <Section className="bg-white">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <p className="text-sm text-stone-400 leading-[2] whitespace-pre-line">{wedding.closingMessage}</p>
          </motion.div>
        </Section>
      )}

      <Section>
        <div className="text-center">
          <button onClick={() => setShowShareModal(true)} className="px-8 py-3 bg-stone-800 text-white text-sm flex items-center gap-2 mx-auto hover:bg-stone-700 transition-colors">
            <Share2 className="w-4 h-4" />Share
          </button>
          <div className="flex justify-center gap-6 mt-6">
            {wedding.groomPhone && <a href={`tel:${wedding.groomPhone}`} className="text-center"><div className="w-12 h-12 border border-stone-200 flex items-center justify-center mb-1"><Phone className="w-5 h-5 text-stone-400" /></div><span className="text-xs text-stone-400">신랑</span></a>}
            {wedding.bridePhone && <a href={`tel:${wedding.bridePhone}`} className="text-center"><div className="w-12 h-12 border border-stone-200 flex items-center justify-center mb-1"><Phone className="w-5 h-5 text-stone-400" /></div><span className="text-xs text-stone-400">신부</span></a>}
          </div>
        </div>
      </Section>

      <footer className="py-8 text-center text-stone-300 text-[10px] tracking-[0.3em]">청첩장 작업실</footer>

      <AnimatePresence>{galleryIndex !== null && wedding.galleries && <GalleryModal galleries={wedding.galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} />}</AnimatePresence>
      <AnimatePresence><ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} variant="light" /></AnimatePresence>
    </div>
  );
}

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`py-16 px-6 ${className}`}><div className="max-w-md mx-auto">{children}</div></section>;
}

function AccountRow({ title, accounts, isOpen, onToggle, copiedAccount, onCopy }: { title: string; accounts: any[]; isOpen: boolean; onToggle: () => void; copiedAccount: string | null; onCopy: (t: string, id: string) => void }) {
  if (!accounts.length) return null;
  return (
    <div className="bg-stone-50">
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between text-sm text-stone-600"><span>{title}</span><ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-stone-100">
              {accounts.map((acc, i) => (
                <div key={i} className="flex items-center justify-between pt-3">
                  <div><p className="text-sm text-stone-600">{acc.holder}</p><p className="text-xs text-stone-400">{acc.bank} {acc.account}</p></div>
                  <button onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)} className="px-3 py-1.5 border border-stone-200 text-xs">{copiedAccount === `${title}-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</button>
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
