import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown, MapPin, Calendar, Clock } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, formatTime, getDday, getCalendarData, type ThemeProps } from './shared';

const W = {
  bg: '#FAF5EE', sand: '#F0E8DA', warm: '#A08060', deep: '#7A5E42',
  wave: '#B89878', text: '#3C3020', textM: '#6A5840', textL: '#A09480',
  cream: '#FFFAF2', card: '#F5EDE0', accent: '#C4A880', line: '#DDD0BE',
};
const fontCss = "@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Noto+Serif+KR:wght@300;400;700&display=swap');";

function WaveTransition({ from = W.bg, to = W.sand }: { from?: string; to?: string }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 48 }}>
      <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="block w-full h-full">
        <rect width="1440" height="48" fill={to} />
        <path d="M0 0 L1440 0 L1440 24 C1380 36,1320 12,1260 24 C1200 36,1140 12,1080 24 C1020 36,960 12,900 24 C840 36,780 12,720 24 C660 36,600 12,540 24 C480 36,420 12,360 24 C300 36,240 12,180 24 C120 36,60 12,0 24 Z" fill={from} />
      </svg>
    </div>
  );
}


function WaveFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 600" preserveAspectRatio="none" fill="none" opacity="0.05">
        {Array.from({length: 20}).map((_, i) => (
          <g key={i}>
            <path d={'M8 ' + (i*30) + ' Q2 ' + (i*30+15) + ', 8 ' + (i*30+30)} stroke={W.warm} strokeWidth="1" />
            <path d={'M392 ' + (i*30) + ' Q398 ' + (i*30+15) + ', 392 ' + (i*30+30)} stroke={W.warm} strokeWidth="1" />
          </g>
        ))}
      </svg>
      {children}
    </div>
  );
}

function WaveCalendar({ dateStr }: { dateStr: string }) {
  const { year, month, targetDay, weeks } = getCalendarData(dateStr);
  const d = ['S','M','T','W','T','F','S'];
  const mn = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div className="py-6">
      <div className="relative px-6 py-5 rounded-none" style={{ background: W.cream }}>
        <svg className="absolute top-0 left-0 w-full h-2" viewBox="0 0 1200 8" preserveAspectRatio="none"><path d="M0 8 Q150 0,300 8 Q450 0,600 8 Q750 0,900 8 Q1050 0,1200 8" fill={W.sand} /></svg>
        <svg className="absolute bottom-0 left-0 w-full h-2" viewBox="0 0 1200 8" preserveAspectRatio="none"><path d="M0 0 Q150 8,300 0 Q450 8,600 0 Q750 8,900 0 Q1050 8,1200 0" fill={W.sand} /></svg>
        <p className="text-center text-xs tracking-[0.3em] mb-4 pt-2" style={{ color: W.warm, fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic' }}>{mn[month]} {year}</p>
        <div className="grid grid-cols-7 gap-y-2.5 max-w-[240px] mx-auto">
          {d.map((v, i) => <span key={i} className="text-[10px] text-center" style={{ color: i===0?'#B07060':W.textL, fontFamily: "'Libre Baskerville', serif" }}>{v}</span>)}
          {weeks.flat().map((v, i) => (
            <span key={i} className="text-xs flex items-center justify-center" style={{
              color: v===null?'transparent':v===targetDay?'#fff':i%7===0?'#B07060':W.text,
              background: v===targetDay?W.warm:'transparent',
              borderRadius: v===targetDay?'50%':undefined,
              width: v===targetDay?28:undefined, height: v===targetDay?28:undefined,
              margin: v===targetDay?'0 auto':undefined,
              fontFamily: "'Libre Baskerville', serif",
            }}>{v ?? ''}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccordionGift({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden" style={{ background: W.cream, border: '1px solid ' + W.line }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4">
        <span className="text-sm" style={{ color: W.text, fontFamily: "'Noto Serif KR', serif" }}>{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={16} style={{ color: W.textM }} /></motion.div>
      </button>
      <AnimatePresence>{open && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><div className="px-5 pb-4 space-y-2">{children}</div></motion.div>}</AnimatePresence>
    </div>
  );
}

function CopyBtn({ bank, account, holder }: { bank?: string; account?: string; holder?: string }) {
  const [ok, setOk] = useState(false);
  if (!account) return null;
  return (
    <div className="flex items-center justify-between py-2.5 px-3" style={{ background: W.bg }}>
      <span className="text-sm" style={{ color: W.text, fontFamily: "'Noto Serif KR', serif" }}><span style={{ color: W.textM }}>{bank}</span> {account}{holder && <span className="ml-1 text-xs" style={{ color: W.textL }}>({holder})</span>}</span>
      <button onClick={() => { navigator.clipboard.writeText(account); setOk(true); setTimeout(() => setOk(false), 2000); }} className="p-1.5">{ok ? <Check size={14} style={{ color: W.warm }} /> : <Copy size={14} style={{ color: W.textM }} />}</button>
    </div>
  );
}

export default function WaveBorder({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading }: ThemeProps) {
  const w = wedding;
  const galleries = (w.galleries || []).filter((g: any) => g.mediaUrl);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);

  const handleShare = async (type: 'kakao' | 'instagram' | 'sms', version?: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = version ? `${baseUrl}?v=${version}` : baseUrl;
    const title = w.groomName + ' ♥ ' + w.brideName;
    if (type === 'kakao' && window.Kakao) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description: formatDate(w.weddingDate) + ' ' + formatTime(w.weddingTime),
          imageUrl: w.heroMedia || '',
          link: { mobileWebUrl: url, webUrl: url }
        },
        buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }]
      });
    } else if (type === 'instagram') {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.\n인스타그램 스토리에 공유해보세요!');
    } else if (type === 'sms') {
      window.location.href = 'sms:?&body=' + encodeURIComponent(title + '\n' + formatDate(w.weddingDate) + '\n' + url);
    }
    setShowShare(false);
  };
  const [localGuestbooks, setLocalGuestbooks] = useState(guestbooks || []);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => { setLocalGuestbooks(guestbooks || []); }, [guestbooks]);
  useEffect(() => { const s = document.createElement('style'); s.textContent = fontCss; document.head.appendChild(s); return () => { document.head.removeChild(s); }; }, []);
  useEffect(() => { if (w.bgMusicAutoPlay && audioRef.current) audioRef.current.play().then(() => setPlaying(true)).catch(() => {}); }, [w.bgMusicAutoPlay]);
  const toggleMusic = () => { if (!audioRef.current) return; playing ? (audioRef.current.pause(), setPlaying(false)) : audioRef.current.play().then(() => setPlaying(true)).catch(() => {}); };
  const handleGuestbookDelete = (id: string) => { setLocalGuestbooks(prev => prev.filter(g => g.id !== id)); };
  const fk: React.CSSProperties = { fontFamily: "'Noto Serif KR', serif" };
  const fl: React.CSSProperties = { fontFamily: "'Libre Baskerville', serif" };
  const dday = getDday(w.weddingDate);

  return (
    <div className="min-h-screen wave-theme" style={{ background: W.bg }}>
      <style>{`
        .wave-theme button[type="submit"] { background: #A08060; color: #fff; border-radius: 4px; border: none; }
        .wave-theme button[type="submit"]:hover { background: #7A5E42; }
        .wave-theme input:focus, .wave-theme textarea:focus, .wave-theme select:focus { border-color: #B89878; outline-color: #B89878; --tw-ring-color: #B89878; }
      `}</style>
      {w.bgMusicUrl && <audio ref={audioRef} src={w.bgMusicUrl} loop />}
      {w.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center" style={{ background: W.cream + 'EE', backdropFilter: 'blur(8px)', border: '1px solid ' + W.line }}>
          {playing ? <Volume2 size={15} style={{ color: W.warm }} /> : <VolumeX size={15} style={{ color: W.textM }} />}
        </button>
      )}

      <div className="max-w-lg mx-auto">
        <WaveFrame>
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="min-h-screen flex flex-col items-center justify-center px-10 text-center relative" style={{ background: W.bg }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-[10px] tracking-[0.5em] mb-10" style={{ color: W.wave, ...fl, fontStyle: 'italic' }}>Wedding Invitation</motion.p>

            {w.heroMedia && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 1 }}
                className="w-full max-w-[300px] relative mx-auto mb-10">
                <div className="relative overflow-hidden" style={{ borderRadius: '40% 40% 5% 5%' }}>
                  <div className="aspect-[3/4]">
                    {w.heroMediaType === 'VIDEO' ? <video src={heroUrl(w.heroMedia)} autoPlay muted loop playsInline className="w-full h-full object-cover" /> : <img src={heroUrl(w.heroMedia)} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <svg className="absolute bottom-0 left-0 w-full h-5" viewBox="0 0 1200 20" preserveAspectRatio="none">
                    <path d="M0 20 L0 10 Q100 0,200 10 Q300 20,400 10 Q500 0,600 10 Q700 20,800 10 Q900 0,1000 10 Q1100 20,1200 10 L1200 20 Z" fill={W.bg} />
                  </svg>
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
              <h1 className="text-[28px] mb-3" style={{ color: W.text, ...fk, letterSpacing: '0.12em' }}>
                {w.groomName}
                <span className="inline-block mx-3 text-lg" style={{ color: W.accent, ...fl, fontStyle: 'italic' }}>&</span>
                {w.brideName}
              </h1>
              <p className="text-sm" style={{ color: W.textM, ...fl, fontStyle: 'italic' }}>{formatDate(w.weddingDate)}</p>
              {w.showDday && <p className="text-xs mt-4 tracking-[0.2em]" style={{ color: W.wave }}>{dday}</p>}
            </motion.div>
          </motion.section>
        </WaveFrame>

        <WaveTransition from={W.bg} to={W.sand} />

        <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-14 text-center" style={{ background: W.sand }}>
          <p className="text-[10px] tracking-[0.5em] mb-8" style={{ color: W.wave, ...fl, fontStyle: 'italic' }}>Invitation</p>
          {w.showParents && (w.groomFatherName || w.groomMotherName || w.brideFatherName || w.brideMotherName) && (
            <div className="text-[13px] mb-8 space-y-1.5" style={{ color: W.textM, ...fk }}>
              {(w.groomFatherName || w.groomMotherName) && <p>{[w.groomFatherName, w.groomMotherName].filter(Boolean).join(' · ')}의 아들 <span style={{ color: W.text }}>{w.groomName}</span></p>}
              {(w.brideFatherName || w.brideMotherName) && <p>{[w.brideFatherName, w.brideMotherName].filter(Boolean).join(' · ')}의 딸 <span style={{ color: W.text }}>{w.brideName}</span></p>}
            </div>
          )}
          {w.greeting && <p className="text-[13px] leading-[2.4] whitespace-pre-line" style={{ color: W.text, ...fk }}>{w.greeting}</p>}
        </motion.section>

        {w.loveStoryVideo ? (<>
          <WaveTransition from={W.sand} to={W.bg} />
          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-14" style={{ background: W.bg }}>
            <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: W.wave, ...fl, fontStyle: 'italic' }}>Our Story</p>
            <div className="overflow-hidden" style={{ border: '1px solid ' + W.line }}><video src={w.loveStoryVideo} controls playsInline className="w-full" style={{ background: '#000' }} /></div>
          </motion.section>
          <WaveTransition from={W.bg} to={W.sand} />
        </>) : (
          <WaveTransition from={W.sand} to={W.sand} />
        )}

        <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-14 text-center" style={{ background: W.sand }}>
          <p className="text-[10px] tracking-[0.5em] mb-10" style={{ color: W.wave, ...fl, fontStyle: 'italic' }}>Ceremony</p>
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-center gap-2.5"><Calendar size={14} style={{ color: W.wave }} /><p className="text-sm" style={{ color: W.text, ...fk }}>{formatDate(w.weddingDate)}</p></div>
            <div className="flex items-center justify-center gap-2.5"><Clock size={14} style={{ color: W.wave }} /><p className="text-sm" style={{ color: W.text, ...fk }}>{formatTime(w.weddingTime)}</p></div>
            <div className="flex items-center justify-center gap-2.5"><MapPin size={14} style={{ color: W.wave }} /><p className="text-sm" style={{ color: W.text, ...fk }}>{w.venue}{w.venueHall ? ' ' + w.venueHall : ''}</p></div>
            <p className="text-xs" style={{ color: W.textL }}>{w.venueAddress}</p>
          </div>
          <WaveCalendar dateStr={w.weddingDate} />
        </motion.section>

        <WaveTransition from={W.sand} to={W.bg} />

        <motion.section id="venue-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-14 text-center" style={{ background: W.bg }}>
          <p className="text-[10px] tracking-[0.5em] mb-8" style={{ color: W.wave, ...fl, fontStyle: 'italic' }}>Location</p>
          <p className="text-sm mb-1" style={{ color: W.text, ...fk }}>{w.venue}{w.venueHall ? ' ' + w.venueHall : ''}</p>
          <p className="text-xs mb-6" style={{ color: W.textL }}>{w.venueAddress}</p>
          <div className="overflow-hidden mb-4" style={{ border: '1px solid ' + W.line }}><KakaoMap address={w.venueAddress} venue={w.venue} /></div>
          <div className="flex flex-wrap justify-center gap-2">
            {w.venueNaverMap && <a href={w.venueNaverMap} target="_blank" rel="noreferrer" className="px-4 py-2.5 text-xs" style={{ background: W.cream, color: W.warm, border: '1px solid ' + W.line, ...fk }}>네이버 지도</a>}
            {w.venueKakaoMap && <a href={w.venueKakaoMap} target="_blank" rel="noreferrer" className="px-4 py-2.5 text-xs" style={{ background: W.cream, color: W.warm, border: '1px solid ' + W.line, ...fk }}>카카오맵</a>}
            {w.venueTmap && <a href={w.venueTmap} target="_blank" rel="noreferrer" className="px-4 py-2.5 text-xs" style={{ background: W.cream, color: W.warm, border: '1px solid ' + W.line, ...fk }}>티맵</a>}
          </div>
        </motion.section>

        <WaveTransition from={W.bg} to={W.sand} />

        <motion.section id="rsvp-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-14" style={{ background: W.sand }}>
          <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: W.wave, ...fl, fontStyle: 'italic' }}>Attendance</p>
          <div className="p-5" style={{ background: W.cream, border: '1px solid ' + W.line }}><RsvpForm onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} weddingId={w.id} variant="wave" /></div>
        </motion.section>

        <WaveTransition from={W.sand} to={W.bg} />

        <motion.section id="account-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-14" style={{ background: W.bg }}>
          <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: W.wave, ...fl, fontStyle: 'italic' }}>Gift</p>
          <div className="space-y-3">
            {(w.groomAccount || w.groomFatherAccount || w.groomMotherAccount) && <AccordionGift title="신랑측 축의금"><CopyBtn bank={w.groomBank} account={w.groomAccount} holder={w.groomAccountHolder} /><CopyBtn bank={w.groomFatherBank} account={w.groomFatherAccount} holder={w.groomFatherAccountHolder} /><CopyBtn bank={w.groomMotherBank} account={w.groomMotherAccount} holder={w.groomMotherAccountHolder} /></AccordionGift>}
            {(w.brideAccount || w.brideFatherAccount || w.brideMotherAccount) && <AccordionGift title="신부측 축의금"><CopyBtn bank={w.brideBank} account={w.brideAccount} holder={w.brideAccountHolder} /><CopyBtn bank={w.brideFatherBank} account={w.brideFatherAccount} holder={w.brideFatherAccountHolder} /><CopyBtn bank={w.brideMotherBank} account={w.brideMotherAccount} holder={w.brideMotherAccountHolder} /></AccordionGift>}
            <div className="flex gap-2 pt-1">
              {w.tossLink && <a href={w.tossLink} target="_blank" rel="noreferrer" className="flex-1 py-3 text-sm text-center" style={{ background: W.cream, color: W.warm, border: '1px solid ' + W.line }}>토스로 송금</a>}
              {w.kakaoPayLink && <a href={w.kakaoPayLink} target="_blank" rel="noreferrer" className="flex-1 py-3 text-sm text-center" style={{ background: W.cream, color: W.warm, border: '1px solid ' + W.line }}>카카오페이</a>}
            </div>
          </div>
        </motion.section>

        {galleries.length > 0 && (<><WaveTransition from={W.bg} to={W.sand} /><motion.section id="gallery-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-14" style={{ background: W.sand }}>
          <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: W.wave, ...fl, fontStyle: 'italic' }}>Gallery</p>
          <div className="space-y-[3px]">
            {galleries.length > 0 && <motion.div whileTap={{ scale: 0.98 }} onClick={() => setGalleryIndex(0)} className="aspect-[16/9] cursor-pointer overflow-hidden" style={{ border: '1px solid ' + W.line }}><img src={galleryThumbUrl(galleries[0].mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" /></motion.div>}
            <div className="grid grid-cols-3 gap-[3px]">
            {galleries.slice(1).map((g: any, i: number) => (<motion.div key={g.id} whileTap={{ scale: 0.97 }} onClick={() => setGalleryIndex(i + 1)} className="aspect-square cursor-pointer overflow-hidden" style={{ border: '1px solid ' + W.line }}><img src={galleryThumbUrl(g.mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></motion.div>))}
            </div></div>
        </motion.section></>)}
        {galleryIndex !== null && galleries.length > 0 && <GalleryModal galleries={galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="WAVE_BORDER" usePhotoFilter={w.usePhotoFilter ?? true} />}

        <WaveTransition from={W.sand} to={W.bg} />

        <motion.section id="guestbook-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-14" style={{ background: W.bg }}>
          <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: W.wave, ...fl, fontStyle: 'italic' }}>Guestbook</p>
          <div className="space-y-4">
            <div className="p-5" style={{ background: W.cream, border: '1px solid ' + W.line }}><GuestbookForm onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} weddingId={w.id} variant="wave" /></div>
            {(localGuestbooks || []).length > 0 && <GuestbookList guestbooks={localGuestbooks || []} weddingSlug={w.slug} onDelete={handleGuestbookDelete} />}
          </div>
        </motion.section>

        <WaveTransition from={W.bg} to={W.sand} />

        <section className="px-10 py-14 text-center" style={{ background: W.sand }}>
          {w.closingMessage && <p className="text-[13px] leading-[2.4] whitespace-pre-line mb-10" style={{ color: W.text, ...fk }}>{w.closingMessage}</p>}
          <div className="flex justify-center gap-3 mb-8">
            {w.groomPhone && <a href={'tel:' + w.groomPhone} className="flex items-center gap-1.5 px-5 py-2.5 text-xs" style={{ background: W.cream, color: W.warm, border: '1px solid ' + W.line }}><Phone size={12} /> 신랑에게</a>}
            {w.bridePhone && <a href={'tel:' + w.bridePhone} className="flex items-center gap-1.5 px-5 py-2.5 text-xs" style={{ background: W.cream, color: W.warm, border: '1px solid ' + W.line }}><Phone size={12} /> 신부에게</a>}
          </div>
          <button onClick={() => setShowShare(true)} className="inline-flex items-center gap-2 px-6 py-3 text-sm" style={{ background: W.warm, color: '#fff' }}><Share2 size={14} /> 공유하기</button>
        </section>
        <WaveTransition from={W.sand} to={W.bg} />
        <footer className="pb-8 text-center" style={{ background: W.bg }}><a href="https://weddingshop.cloud" target="_blank" rel="noreferrer" className="text-[10px] tracking-wider" style={{ color: W.textL }}>Made by 청첩장 작업실 ›</a></footer>
      </div>
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} onShare={handleShare} variant="light" weddingId={w.id} />
    </div>
  );
}
