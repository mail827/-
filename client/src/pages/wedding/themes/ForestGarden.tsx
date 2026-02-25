import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown } from 'lucide-react';
import { RsvpForm, GuestbookForm, GuestbookList, GalleryModal, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

export default function ForestGarden({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot }: ThemeProps) {
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
    <div className="min-h-screen bg-[#F7F6F3]" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center border border-[#3D5A3D]/10">
          {isPlaying ? <Volume2 className="w-4 h-4 text-[#3D5A3D]" /> : <VolumeX className="w-4 h-4 text-[#aaa]" />}
        </button>
      )}

      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center w-full max-w-sm relative z-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-6 h-px bg-[#3D5A3D]/30" />
            <svg className="w-5 h-5 text-[#3D5A3D]/40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8 6 6 10 6 14c0 4 2.5 6 6 6s6-2 6-6c0-4-2-8-6-12z" /></svg>
            <div className="w-6 h-px bg-[#3D5A3D]/30" />
          </div>
          <p className="text-[10px] tracking-[0.4em] text-[#3D5A3D]/50 mb-8">WEDDING INVITATION</p>
          
          {wedding.heroMedia && (
            <div className="relative mb-10">
              <div className="absolute -inset-4 border border-[#3D5A3D]/10 rounded-sm" />
              <div className="absolute -inset-2 border border-[#3D5A3D]/5 rounded-sm" />
              <div className="aspect-[4/5] overflow-hidden rounded-sm shadow-lg">
                {wedding.heroMediaType === 'VIDEO' ? <video src={heroUrl(wedding.heroMedia)} autoPlay muted loop playsInline className="w-full h-full object-cover" /> : <img src={heroUrl(wedding.heroMedia)} alt="" className="w-full h-full object-cover" />}
              </div>
            </div>
          )}
          
          <h1 className="text-2xl tracking-[0.15em] text-[#2D2D2D] font-light">{wedding.groomName} <span className="text-[#3D5A3D]/40 mx-2">&</span> {wedding.brideName}</h1>
          <div className="my-6 flex items-center justify-center gap-3"><div className="w-16 h-px bg-[#3D5A3D]/15" /><div className="w-1.5 h-1.5 rounded-full bg-[#3D5A3D]/30" /><div className="w-16 h-px bg-[#3D5A3D]/15" /></div>
          <div className="text-sm text-[#666] space-y-1">
            <p>{formatDate(wedding.weddingDate, 'korean')}</p>
            <p>{formatTime(wedding.weddingTime)}</p>
            <p className="text-[#999]">{wedding.venue}</p>
          </div>
          {wedding.showDday && <p className="text-xs text-[#3D5A3D] mt-6 tracking-wider">{getDday(wedding.weddingDate)}</p>}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-8"><ChevronDown className="w-5 h-5 text-[#3D5A3D]/30 animate-bounce" /></motion.div>
      </section>

      {wedding.greeting && (
        <Section>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <TreeDivider /><p className="text-xs tracking-[0.2em] text-[#3D5A3D]/50 mt-6 mb-6">INVITATION</p>
            <div className="bg-white rounded p-8 shadow-sm border border-[#3D5A3D]/5">
              {wedding.greetingTitle && <p className="text-[#3D5A3D] mb-6">{wedding.greetingTitle}</p>}
              <p className="text-sm text-[#666] leading-[2.2] whitespace-pre-line">{wedding.greeting}</p>
              {wedding.showParents && (
                <div className="mt-8 pt-6 border-t border-[#3D5A3D]/10 grid grid-cols-2 gap-6 text-sm">
                  <div className="text-center"><p className="text-[#3D5A3D]/40 text-xs mb-2">신랑측</p><p className="text-[#999] text-xs">{wedding.groomFatherName} · {wedding.groomMotherName}</p><p className="text-[#555] mt-1">의 아들 <span className="text-[#3D5A3D]">{wedding.groomName}</span></p></div>
                  <div className="text-center"><p className="text-[#3D5A3D]/40 text-xs mb-2">신부측</p><p className="text-[#999] text-xs">{wedding.brideFatherName} · {wedding.brideMotherName}</p><p className="text-[#555] mt-1">의 딸 <span className="text-[#3D5A3D]">{wedding.brideName}</span></p></div>
                </div>
              )}
            </div>
          </motion.div>
        </Section>
      )}

      <Section className="bg-[#EEF2EB]">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <TreeDivider /><p className="text-xs tracking-[0.2em] text-[#3D5A3D]/50 mt-6 mb-6">CALENDAR</p>
          <div className="bg-white rounded p-6 shadow-sm max-w-xs mx-auto">
            <p className="text-[#3D5A3D] mb-4">{calendarData.year}. {String(calendarData.month).padStart(2, '0')}</p>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['일','월','화','수','목','금','토'].map((d,i) => <div key={i} className={`py-1.5 ${i === 0 ? 'text-[#B88B6A]' : i === 6 ? 'text-[#6A8FB8]' : 'text-[#aaa]'}`}>{d}</div>)}
              {calendarData.weeks.flat().map((day, i) => (<div key={i} className={`py-1.5 ${day === calendarData.targetDay ? 'bg-[#3D5A3D] text-white rounded-full' : day ? 'text-[#666]' : ''}`}>{day}</div>))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#3D5A3D]/10 flex justify-center gap-4 text-xs text-[#777]">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#3D5A3D]" />{formatDate(wedding.weddingDate, 'short')}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#3D5A3D]" />{formatTime(wedding.weddingTime)}</span>
            </div>
          </div>
        </motion.div>
      </Section>

      {wedding.loveStoryVideo && (
  <Section>
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
      <TreeDivider /><p className="text-xs tracking-[0.2em] text-[#3D5A3D]/50 mt-6 mb-6">OUR STORY</p>
      <div className="rounded-2xl overflow-hidden bg-[#3D5A3D]/10">
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
            <TreeDivider /><p className="text-xs tracking-[0.2em] text-[#3D5A3D]/50 mt-6 mb-6">GALLERY</p>
            <div className="grid grid-cols-3 gap-2">
              {wedding.galleries.slice(0, 9).map((item, index) => (
                <div key={item.id} onClick={() => setGalleryIndex(index)} className="aspect-square rounded overflow-hidden cursor-pointer bg-[#E8EBE4]">
                  {item.mediaType === 'VIDEO' ? <video src={item.mediaUrl} className="w-full h-full object-cover" /> : <img src={galleryThumbUrl(item.mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />}
                </div>
              ))}
            </div>
          </motion.div>
        </Section>
      )}

      <Section id="venue-section" className="bg-[#EEF2EB]">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <TreeDivider /><p className="text-xs tracking-[0.2em] text-[#3D5A3D]/50 mt-6 mb-6">LOCATION</p>
          <div className="bg-white rounded overflow-hidden shadow-sm">
            <KakaoMap address={wedding.venueAddress} venue={wedding.venue} latitude={wedding.venueLatitude} longitude={wedding.venueLongitude} />
            <div className="p-6 text-center">
              <p className="text-[#555] flex items-center justify-center gap-1"><MapPin className="w-4 h-4 text-[#3D5A3D]" />{wedding.venue}</p>
              {wedding.venueHall && <p className="text-[#3D5A3D] text-sm mt-1">{wedding.venueHall}</p>}
              <p className="text-[#999] text-sm mt-1">{wedding.venueAddress}</p>
              {wedding.venuePhone && <a href={`tel:${wedding.venuePhone}`} className="inline-flex items-center gap-1 text-[#aaa] text-xs mt-2"><Phone className="w-3 h-3" />{wedding.venuePhone}</a>}
              <div className="flex justify-center gap-2 mt-4">
                {wedding.venueNaverMap && <a href={wedding.venueNaverMap} target="_blank" className="px-4 py-2 bg-[#03C75A] text-white rounded text-xs">네이버</a>}
                {wedding.venueKakaoMap && <a href={wedding.venueKakaoMap} target="_blank" className="px-4 py-2 bg-[#FEE500] text-[#333] rounded text-xs">카카오</a>}
                {wedding.venueTmap && <a href={wedding.venueTmap} target="_blank" className="px-4 py-2 bg-[#EF4123] text-white rounded text-xs">티맵</a>}
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      <Section id="rsvp-section">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <TreeDivider /><p className="text-xs tracking-[0.2em] text-[#3D5A3D]/50 mt-6 mb-6">RSVP</p>
          <RsvpForm weddingId={wedding.id} onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} variant="forest" />
        </motion.div>
      </Section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <Section id="account-section" className="bg-[#EEF2EB]">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <TreeDivider /><p className="text-xs tracking-[0.2em] text-[#3D5A3D]/50 mt-6 mb-6">GIFT</p>
            <div className="space-y-2">
              <AccountCard title="신랑측" accounts={[wedding.groomAccount && { bank: wedding.groomBank, account: wedding.groomAccount, holder: wedding.groomAccountHolder || wedding.groomName }, wedding.groomFatherAccount && { bank: wedding.groomFatherBank, account: wedding.groomFatherAccount, holder: wedding.groomFatherAccountHolder || wedding.groomFatherName }, wedding.groomMotherAccount && { bank: wedding.groomMotherBank, account: wedding.groomMotherAccount, holder: wedding.groomMotherAccountHolder || wedding.groomMotherName }].filter(Boolean) as any[]} isOpen={openAccount === 'groom'} onToggle={() => setOpenAccount(openAccount === 'groom' ? null : 'groom')} copiedAccount={copiedAccount} onCopy={copyToClipboard} />
              <AccountCard title="신부측" accounts={[wedding.brideAccount && { bank: wedding.brideBank, account: wedding.brideAccount, holder: wedding.brideAccountHolder || wedding.brideName }, wedding.brideFatherAccount && { bank: wedding.brideFatherBank, account: wedding.brideFatherAccount, holder: wedding.brideFatherAccountHolder || wedding.brideFatherName }, wedding.brideMotherAccount && { bank: wedding.brideMotherBank, account: wedding.brideMotherAccount, holder: wedding.brideMotherAccountHolder || wedding.brideMotherName }].filter(Boolean) as any[]} isOpen={openAccount === 'bride'} onToggle={() => setOpenAccount(openAccount === 'bride' ? null : 'bride')} copiedAccount={copiedAccount} onCopy={copyToClipboard} />
            </div>
            {(wedding.tossLink || wedding.kakaoPayLink) && (
              <div className="flex justify-center gap-2 mt-4">
                {wedding.tossLink && <a href={wedding.tossLink} target="_blank" className="px-5 py-2.5 bg-[#0064FF] text-white rounded text-sm">토스</a>}
                {wedding.kakaoPayLink && <a href={wedding.kakaoPayLink} target="_blank" className="px-5 py-2.5 bg-[#FEE500] text-[#333] rounded text-sm">카카오페이</a>}
              </div>
            )}
          </motion.div>
        </Section>
      )}

      <Section id="guestbook-section">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <TreeDivider /><p className="text-xs tracking-[0.2em] text-[#3D5A3D]/50 mt-6 mb-6 text-center">GUESTBOOK</p>
          <GuestbookForm weddingId={wedding.id} onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} variant="forest" />
          <GuestbookList 
            guestbooks={localGuestbooks} 
            weddingSlug={wedding.slug} 
            onDelete={handleGuestbookDelete}
            variant="forest"
          />
        </motion.div>
      </Section>

      {guestPhotoSlot}
      {wedding.closingMessage && (
        <Section className="bg-[#EEF2EB]">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <svg className="w-6 h-6 text-[#3D5A3D]/30 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8 6 6 10 6 14c0 4 2.5 6 6 6s6-2 6-6c0-4-2-8-6-12z" /></svg>
            <p className="text-sm text-[#666] leading-[2] whitespace-pre-line">{wedding.closingMessage}</p>
          </motion.div>
        </Section>
      )}

      <Section>
        <div className="text-center">
          <button onClick={() => setShowShareModal(true)} className="px-8 py-3 bg-[#3D5A3D] text-white rounded text-sm flex items-center gap-2 mx-auto hover:bg-[#2D4A2D] transition-colors"><Share2 className="w-4 h-4" />공유하기</button>
          <div className="flex justify-center gap-4 mt-6">
            {wedding.groomPhone && <a href={`tel:${wedding.groomPhone}`} className="text-center"><div className="w-12 h-12 rounded-full bg-[#3D5A3D]/10 flex items-center justify-center mb-1"><Phone className="w-5 h-5 text-[#3D5A3D]" /></div><span className="text-xs text-[#999]">신랑</span></a>}
            {wedding.bridePhone && <a href={`tel:${wedding.bridePhone}`} className="text-center"><div className="w-12 h-12 rounded-full bg-[#3D5A3D]/10 flex items-center justify-center mb-1"><Phone className="w-5 h-5 text-[#3D5A3D]" /></div><span className="text-xs text-[#999]">신부</span></a>}
          </div>
        </div>
      </Section>

      <footer className="py-8 text-center text-[10px] tracking-widest" style={{ background: "#E8EDE8" }}><a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-[#5A6B5A] hover:text-[#3A4B3A] transition-colors">Made by 청첩장 작업실 ›</a></footer>

      <AnimatePresence>{galleryIndex !== null && wedding.galleries && <GalleryModal galleries={wedding.galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="FOREST_GARDEN" usePhotoFilter={wedding.usePhotoFilter ?? true} />}</AnimatePresence>
      <AnimatePresence><ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="light" /></AnimatePresence>
    </div>
  );
}

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`py-16 px-6 ${className}`}><div className="max-w-md mx-auto">{children}</div></section>;
}

function TreeDivider() {
  return (<div className="flex items-center justify-center gap-2"><div className="w-8 h-px bg-[#3D5A3D]/20" /><svg className="w-4 h-4 text-[#3D5A3D]/30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8 6 6 10 6 14c0 4 2.5 6 6 6s6-2 6-6c0-4-2-8-6-12z" /></svg><div className="w-8 h-px bg-[#3D5A3D]/20" /></div>);
}

function AccountCard({ title, accounts, isOpen, onToggle, copiedAccount, onCopy }: { title: string; accounts: any[]; isOpen: boolean; onToggle: () => void; copiedAccount: string | null; onCopy: (t: string, id: string) => void }) {
  if (!accounts.length) return null;
  return (
    <div className="bg-white rounded overflow-hidden shadow-sm">
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between text-sm text-[#555]"><span>{title}</span><ChevronDown className={`w-4 h-4 text-[#3D5A3D] transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-[#3D5A3D]/10">
              {accounts.map((acc, i) => (
                <div key={i} className="flex items-center justify-between pt-3">
                  <div><p className="text-sm text-[#555]">{acc.holder}</p><p className="text-xs text-[#aaa]">{acc.bank} {acc.account}</p></div>
                  <button onClick={() => onCopy(`${acc.bank} ${acc.account}`, `${title}-${i}`)} className="px-3 py-1.5 bg-[#3D5A3D]/10 text-[#3D5A3D] rounded text-xs">{copiedAccount === `${title}-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</button>
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
