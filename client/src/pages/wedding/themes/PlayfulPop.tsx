import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

export default function PlayfulPop({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading }: ThemeProps) {
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
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}?theme=${wedding.theme}`;
    const title = `${wedding.groomName} & ${wedding.brideName}`;
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
    <div className="min-h-screen bg-[#F8F8F8]" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center">
          {isPlaying ? <Volume2 className="w-4 h-4 text-[#333]" /> : <VolumeX className="w-4 h-4 text-[#ccc]" />}
        </button>
      )}

      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center w-full max-w-sm">
          <p className="text-sm text-[#999] italic mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Love is the key of a happy life together</p>
          
          {wedding.heroMedia && (
            <div className="relative mb-8">
              <div className="bg-black py-2 flex justify-around">
                {[...Array(12)].map((_, i) => <div key={i} className="w-3 h-4 bg-white" />)}
              </div>
              <div className="aspect-[4/3] overflow-hidden">
                {wedding.heroMediaType === 'VIDEO' ? <video src={wedding.heroMedia} autoPlay muted loop playsInline className="w-full h-full object-cover" /> : <img src={wedding.heroMedia} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="bg-black py-2 flex justify-around">
                {[...Array(12)].map((_, i) => <div key={i} className="w-3 h-4 bg-white" />)}
              </div>
            </div>
          )}
          
          <h1 className="text-2xl tracking-[0.15em] text-[#333] font-light">{wedding.groomName} <span className="text-[#ccc] mx-2">&</span> {wedding.brideName}</h1>
          <div className="mt-6 text-sm text-[#666] space-y-1">
            <p>{formatDate(wedding.weddingDate, 'korean')}</p>
            <p>{formatTime(wedding.weddingTime)}</p>
            <p className="text-[#999]">{wedding.venue}</p>
          </div>
          {wedding.showDday && <p className="text-xs text-[#aaa] mt-4">{getDday(wedding.weddingDate)}</p>}
        </motion.div>
        <div className="mt-12 h-16 bg-[#FFF9E5] w-full max-w-sm rounded-sm" />
      </section>

      {wedding.greeting && (
        <Section>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <p className="text-xs text-[#999] mb-6">초대합니다</p>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {wedding.greetingTitle && <p className="text-[#555] mb-4">{wedding.greetingTitle}</p>}
              <p className="text-sm text-[#777] leading-[2] whitespace-pre-line">{wedding.greeting}</p>
              {wedding.showParents && (
                <div className="mt-6 pt-4 border-t border-[#eee] grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center"><p className="text-[#aaa] text-xs mb-1">신랑측</p><p className="text-[#999] text-xs">{wedding.groomFatherName} · {wedding.groomMotherName}</p><p className="text-[#555] mt-1">의 아들 {wedding.groomName}</p></div>
                  <div className="text-center"><p className="text-[#aaa] text-xs mb-1">신부측</p><p className="text-[#999] text-xs">{wedding.brideFatherName} · {wedding.brideMotherName}</p><p className="text-[#555] mt-1">의 딸 {wedding.brideName}</p></div>
                </div>
              )}
            </div>
          </motion.div>
        </Section>
      )}

      <Section className="bg-white">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <p className="text-xs text-[#999] mb-6">CALENDAR</p>
          <div className="max-w-xs mx-auto">
            <p className="text-[#555] text-lg mb-4">{calendarData.year}년 {calendarData.month}월</p>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['일','월','화','수','목','금','토'].map((d,i) => <div key={i} className={`py-2 ${i === 0 ? 'text-[#E57373]' : i === 6 ? 'text-[#64B5F6]' : 'text-[#aaa]'}`}>{d}</div>)}
              {calendarData.weeks.flat().map((day, i) => (<div key={i} className={`py-2 ${day === calendarData.targetDay ? 'bg-[#333] text-white rounded-full' : day ? 'text-[#666]' : ''}`}>{day}</div>))}
            </div>
            <div className="mt-4 flex justify-center gap-4 text-xs text-[#888]">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(wedding.weddingDate, 'short')}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(wedding.weddingTime)}</span>
            </div>
          </div>
        </motion.div>
      </Section>

      {wedding.loveStoryVideo && (
  <Section>
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
      <p className="text-xs tracking-[0.2em] text-pink-400 mb-6">OUR STORY</p>
      <div className="rounded-2xl overflow-hidden bg-pink-50">
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
            <p className="text-xs text-[#999] mb-6">GALLERY</p>
            <div className="grid grid-cols-3 gap-2">
              {wedding.galleries.slice(0, 9).map((item, index) => (
                <div key={item.id} onClick={() => setGalleryIndex(index)} className="aspect-square rounded-lg overflow-hidden cursor-pointer bg-[#eee]">
                  {item.mediaType === 'VIDEO' ? <video src={item.mediaUrl} className="w-full h-full object-cover" /> : <img src={item.mediaUrl} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />}
                </div>
              ))}
            </div>
          </motion.div>
        </Section>
      )}

      <Section id="venue-section" className="bg-white">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <p className="text-xs text-[#999] mb-6">LOCATION</p>
          <div className="rounded-lg overflow-hidden shadow-sm">
            <KakaoMap address={wedding.venueAddress} />
            <div className="p-6 text-center bg-white">
              <p className="text-[#555] flex items-center justify-center gap-1"><MapPin className="w-4 h-4 text-[#999]" />{wedding.venue}</p>
              {wedding.venueHall && <p className="text-[#888] text-sm mt-1">{wedding.venueHall}</p>}
              <p className="text-[#aaa] text-sm mt-1">{wedding.venueAddress}</p>
              <div className="flex justify-center gap-2 mt-4">
                {wedding.venueNaverMap && <a href={wedding.venueNaverMap} target="_blank" className="px-4 py-2 bg-[#03C75A] text-white rounded-lg text-xs">네이버</a>}
                {wedding.venueKakaoMap && <a href={wedding.venueKakaoMap} target="_blank" className="px-4 py-2 bg-[#FEE500] text-[#333] rounded-lg text-xs">카카오</a>}
                {wedding.venueTmap && <a href={wedding.venueTmap} target="_blank" className="px-4 py-2 bg-[#EF4123] text-white rounded-lg text-xs">티맵</a>}
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      <Section id="rsvp-section">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <p className="text-xs text-[#999] mb-6">RSVP</p>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="playful" />
        </motion.div>
      </Section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <Section id="account-section" className="bg-white">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <p className="text-xs text-[#999] mb-6">GIFT</p>
            <div className="space-y-2">
              <AccountCard title="신랑측" accounts={[wedding.groomAccount && { bank: wedding.groomBank, account: wedding.groomAccount, holder: wedding.groomAccountHolder || wedding.groomName }].filter(Boolean) as any[]} isOpen={openAccount === 'groom'} onToggle={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} copiedAccount={copiedAccount} onCopy={copyToClipboard} />
              <AccountCard title="신부측" accounts={[wedding.brideAccount && { bank: wedding.brideBank, account: wedding.brideAccount, holder: wedding.brideAccountHolder || wedding.brideName }].filter(Boolean) as any[]} isOpen={openAccount === 'bride'} onToggle={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} copiedAccount={copiedAccount} onCopy={copyToClipboard} />
            </div>
            {(wedding.tossLink || wedding.kakaoPayLink) && (
              <div className="flex justify-center gap-2 mt-4">
                {wedding.tossLink && <a href={wedding.tossLink} target="_blank" className="px-5 py-2.5 bg-[#0064FF] text-white rounded-lg text-sm">토스</a>}
                {wedding.kakaoPayLink && <a href={wedding.kakaoPayLink} target="_blank" className="px-5 py-2.5 bg-[#FEE500] text-[#333] rounded-lg text-sm">카카오페이</a>}
              </div>
            )}
          </motion.div>
        </Section>
      )}

      <Section id="guestbook-section">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-xs text-[#999] mb-6 text-center">GUESTBOOK</p>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="playful" />
          <GuestbookList 
            guestbooks={localGuestbooks} 
            weddingSlug={wedding.slug} 
            onDelete={handleGuestbookDelete}
            variant="playful"
          />
        </motion.div>
      </Section>

      {wedding.closingMessage && (
        <Section className="bg-white">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <p className="text-sm text-[#777] leading-[2] whitespace-pre-line">{wedding.closingMessage}</p>
          </motion.div>
        </Section>
      )}

      <Section>
        <div className="text-center">
          <button onClick={() => setShowShareModal(true)} className="px-8 py-3 bg-[#333] text-white rounded-full text-sm flex items-center gap-2 mx-auto hover:bg-[#444] transition-colors"><Share2 className="w-4 h-4" />공유하기</button>
          <div className="flex justify-center gap-4 mt-6">
            {wedding.groomPhone && <a href={`tel:${wedding.groomPhone}`} className="text-center"><div className="w-12 h-12 rounded-full bg-[#eee] flex items-center justify-center mb-1"><Phone className="w-5 h-5 text-[#666]" /></div><span className="text-xs text-[#999]">신랑</span></a>}
            {wedding.bridePhone && <a href={`tel:${wedding.bridePhone}`} className="text-center"><div className="w-12 h-12 rounded-full bg-[#eee] flex items-center justify-center mb-1"><Phone className="w-5 h-5 text-[#666]" /></div><span className="text-xs text-[#999]">신부</span></a>}
          </div>
        </div>
      </Section>

      <footer className="py-8 text-center text-[#ccc] text-[10px]">청첩장 작업실</footer>

      <AnimatePresence>{galleryIndex !== null && wedding.galleries && <GalleryModal galleries={wedding.galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} />}</AnimatePresence>
      <AnimatePresence><ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} variant="light" /></AnimatePresence>
    </div>
  );
}

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`py-16 px-6 ${className}`}><div className="max-w-md mx-auto">{children}</div></section>;
}

function AccountCard({ title, accounts, isOpen, onToggle, copiedAccount, onCopy }: { title: string; accounts: any[]; isOpen: boolean; onToggle: () => void; copiedAccount: string | null; onCopy: (t: string, id: string) => void }) {
  if (!accounts.length) return null;
  return (
    <div className="bg-[#f8f8f8] rounded-lg overflow-hidden">
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between text-sm text-[#555]"><span>{title}</span><ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-[#eee]">
              {accounts.map((acc, i) => (
                <div key={i} className="flex items-center justify-between pt-3">
                  <div><p className="text-sm text-[#555]">{acc.holder}</p><p className="text-xs text-[#aaa]">{acc.bank} {acc.account}</p></div>
                  <button onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)} className="px-3 py-1.5 bg-white border border-[#ddd] rounded text-xs">{copiedAccount === `${title}-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</button>
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
