import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown, MapPin, Calendar, Clock } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, getDday, formatTimeLocale, getCalendarData, type ThemeProps } from './shared';

const H = {
  bg: '#FFF9EE', alt: '#FFF5E6', blush: '#FFE8C8', peach: '#E07B38', rose: '#C86A2E',
  deep: '#9A4E1C', text: '#3A2E22', textM: '#7A6850', textL: '#A89878',
  cream: '#FFFCF2', warm: '#F0943E', card: '#FFF3DE', glow: '#F0943E',
};
const fontCss = "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap');@font-face{font-family:'GowunBatang';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/GowunBatang-Regular.woff') format('woff');font-weight:normal;font-display:swap;}";
const hp = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

function FloatingHearts() {
  const hearts = Array.from({ length: 10 }, (_, i) => ({
    id: i, x: 5 + (i * 11) % 90, size: 10 + (i % 4) * 5,
    dur: 14 + i * 2, delay: i * 1.5, opacity: 0.06 + (i % 4) * 0.02,
    color: i % 3 === 0 ? H.peach : i % 3 === 1 ? H.warm : H.rose,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {hearts.map(h => (
        <motion.div key={h.id} className="absolute" style={{ left: h.x + '%', top: '105%' }}
          animate={{ y: [0, -window.innerHeight * 1.4], x: [0, Math.sin(h.id * 0.8) * 50, Math.cos(h.id) * 20, 0], rotate: [0, h.id % 2 === 0 ? 20 : -20, 0], scale: [1, 1.1, 0.9, 1] }}
          transition={{ duration: h.dur, delay: h.delay, repeat: Infinity, ease: 'linear' }}>
          <svg width={h.size} height={h.size} viewBox="0 0 24 24" fill={h.color} opacity={h.opacity}><path d={hp} /></svg>
        </motion.div>
      ))}
    </div>
  );
}

function HeartBeat() {
  return (
    <motion.span className="inline-block mx-3" animate={{ scale: [1, 1.25, 1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill={H.warm}><path d={hp} /></svg>
    </motion.span>
  );
}

function HeartDivider() {
  return (
    <div className="py-6 flex items-center justify-center gap-3">
      <div className="h-px flex-1 max-w-[50px]" style={{ background: 'linear-gradient(to right, transparent, ' + H.blush + ')' }} />
      <motion.svg animate={{ scale: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity }} width="10" height="10" viewBox="0 0 24 24" fill={H.blush}><path d={hp} /></motion.svg>
      <motion.svg animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2.5, repeat: Infinity }} width="16" height="16" viewBox="0 0 24 24" fill={H.warm} opacity="0.6"><path d={hp} /></motion.svg>
      <motion.svg animate={{ scale: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} width="10" height="10" viewBox="0 0 24 24" fill={H.blush}><path d={hp} /></motion.svg>
      <div className="h-px flex-1 max-w-[50px]" style={{ background: 'linear-gradient(to left, transparent, ' + H.blush + ')' }} />
    </div>
  );
}

function HeartCalendar({ dateStr }: { dateStr: string }) {
  const { year, month, targetDay, weeks } = getCalendarData(dateStr);
  const d = ['S','M','T','W','T','F','S'];
  return (
    <div className="py-6">
      <div className="rounded-3xl px-6 py-6 relative overflow-hidden" style={{ background: H.card }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, ' + H.peach + ' 1px, transparent 1px), radial-gradient(circle at 70% 70%, ' + H.warm + ' 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <p className="relative text-center text-xs tracking-[0.25em] mb-5" style={{ color: H.peach, fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 500 }}>{year}. {String(month).padStart(2, '0')}</p>
        <div className="relative grid grid-cols-7 gap-y-3 max-w-[250px] mx-auto">
          {d.map((v, i) => <span key={i} className="text-[10px] text-center font-medium" style={{ color: i===0?H.rose:H.textL, fontFamily: "'GowunBatang', serif" }}>{v}</span>)}
          {weeks.flat().map((v, i) => (
            <span key={i} className="text-xs flex items-center justify-center relative" style={{
              color: v===null?'transparent':v===targetDay?'#fff':i%7===0?H.rose:H.text,
              fontFamily: "'GowunBatang', serif",
            }}>
              {v===targetDay && <motion.svg className="absolute" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} width="30" height="30" viewBox="0 0 24 24" fill={H.peach}><path d={hp} /></motion.svg>}
              <span className="relative z-10">{v ?? ''}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccordionGift({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: H.card }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4">
        <span className="text-sm" style={{ color: H.text, fontFamily: "'GowunBatang', serif" }}>{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={16} style={{ color: H.textM }} /></motion.div>
      </button>
      <AnimatePresence>{open && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><div className="px-5 pb-4 space-y-2">{children}</div></motion.div>}</AnimatePresence>
    </div>
  );
}

function CopyBtn({ bank, account, holder }: { bank?: string; account?: string; holder?: string }) {
  const [ok, setOk] = useState(false);
  if (!account) return null;
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: H.bg }}>
      <span className="text-sm" style={{ color: H.text, fontFamily: "'GowunBatang', serif" }}><span style={{ color: H.textM }}>{bank}</span> {account}{holder && <span className="ml-1 text-xs" style={{ color: H.textL }}>({holder})</span>}</span>
      <button onClick={() => { navigator.clipboard.writeText(account); setOk(true); setTimeout(() => setOk(false), 2000); }} className="p-1.5">{ok ? <Check size={14} style={{ color: H.peach }} /> : <Copy size={14} style={{ color: H.textM }} />}</button>
    </div>
  );
}

export default function HeartMinimal({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot , locale}: ThemeProps) {
  const w = wedding;
  const galleries = (w.galleries || []).filter((g: any) => g.mediaUrl);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  const handleShare = async (type: 'kakao' | 'instagram' | 'sms', version?: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = version ? `${baseUrl}?v=${version}` : baseUrl;
    const title = w.groomName + ' ♥ ' + w.brideName;
    if (type === 'kakao' && window.Kakao) {
      window.Kakao.Share.sendDefault({ objectType: 'feed', content: { title, description: formatDate(w.weddingDate) + ' ' + formatTimeLocale(w.weddingTime, locale), imageUrl: w.ogCoverType === 'envelope' ? ({"black_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/7_errq8w.png", "white_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "navy_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/1_zdaupp.png", "black_silver": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "olive_ribbon_a": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/3_wdfeio.png", "olive_ribbon_b": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png", "pink_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/5_pzmfwy.png", "white_bow": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/11_o3gnaj.png", "white_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "black_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "pink_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551604/6_akrfek.png", "olive_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png"}[w.envelopeStyle || 'black_ribbon'] || w.heroMedia || '') : (w.heroMedia || ''), link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }] });
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
  const fg: React.CSSProperties = { fontFamily: "'GowunBatang', serif" };
  const fp: React.CSSProperties = { fontFamily: "'Playfair Display', serif" };
  const dday = getDday(w.weddingDate);

  return (
    <div className="min-h-screen relative heart-theme" style={{ background: H.bg }}>
      <style>{`
        .heart-theme button[type="submit"] { background: ${H.peach}; color: #fff; border-radius: 9999px; border: none; }
        .heart-theme button[type="submit"]:hover { background: ${H.rose}; }
        .heart-theme input:focus, .heart-theme textarea:focus, .heart-theme select:focus { border-color: ${H.warm}; outline-color: ${H.warm}; --tw-ring-color: ${H.warm}; }
      `}</style>
      {w.bgMusicUrl && <audio ref={audioRef} src={w.bgMusicUrl} loop />}
      {w.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: H.cream + 'EE', backdropFilter: 'blur(8px)', boxShadow: '0 2px 12px ' + H.peach + '15' }}>
          {playing ? <Volume2 size={15} style={{ color: H.peach }} /> : <VolumeX size={15} style={{ color: H.textM }} />}
        </button>
      )}
      <FloatingHearts />

      <div className="relative z-10 max-w-lg mx-auto">

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-[10px] tracking-[0.6em] mb-14" style={{ color: H.peach, ...fp, fontStyle: 'italic' }}>We're Getting Married</motion.p>

          {w.heroMedia && (
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-[300px] h-[340px] relative mx-auto mb-14">
              <div className="w-full h-full overflow-hidden" style={{ clipPath: 'url(#heartClip)' }}>
                {w.heroMediaType === 'VIDEO' ? <video src={heroUrl(w.heroMedia)} autoPlay muted loop playsInline className="w-full h-full object-cover" /> : <img src={heroUrl(w.heroMedia)} alt="" className="w-full h-full object-cover" />}
              </div>
              <svg width="0" height="0" className="absolute">
                <defs><clipPath id="heartClip" clipPathUnits="objectBoundingBox">
                  <path d="M0.5,0.92 C0.12,0.72,0,0.52,0,0.35 C0,0.15,0.15,0,0.3,0 C0.38,0,0.45,0.04,0.5,0.12 C0.55,0.04,0.62,0,0.7,0 C0.85,0,1,0.15,1,0.35 C1,0.52,0.88,0.72,0.5,0.92z" />
                </clipPath></defs>
              </svg>
              <motion.div className="absolute -inset-4 pointer-events-none rounded-full"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: 'radial-gradient(circle, ' + H.glow + '18 0%, ' + H.warm + '08 40%, transparent 70%)' }} />
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
            {(((w as any).groomNameEn) || (w as any).brideNameEn) && (
              <p className="text-sm tracking-[0.15em] mb-2" style={{ color: H.textL, ...fp, fontStyle: 'italic' }}>
                {(((w as any).groomNameEn) as string) || ''} & {(((w as any).brideNameEn) as string) || ''}
              </p>
            )}
            <h1 className="text-[34px] mb-4" style={{ color: H.text, ...fg, letterSpacing: '0.12em' }}>
              {w.groomName}<HeartBeat />{w.brideName}
            </h1>
            <p className="text-sm tracking-wide" style={{ color: H.textM, ...fp, fontStyle: 'italic' }}>{formatDate(w.weddingDate)}</p>
            {w.showDday && <p className="text-xs mt-5 tracking-[0.2em]" style={{ color: H.peach, ...fp }}>{dday}</p>}
          </motion.div>
        </motion.section>

        <HeartDivider />

        <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-14 text-center" style={{ background: 'linear-gradient(180deg, ' + H.bg + ' 0%, ' + H.alt + ' 100%)' }}>
          <p className="text-[10px] tracking-[0.5em] mb-8" style={{ color: H.peach, ...fp, fontStyle: 'italic' }}>Invitation</p>
          {w.showParents && (w.groomFatherName || w.groomMotherName || w.brideFatherName || w.brideMotherName) && (
            <div className="text-[13px] mb-8 space-y-1.5" style={{ color: H.textM, ...fg }}>
              {(w.groomFatherName || w.groomMotherName) && <p>{[w.groomFatherName, w.groomMotherName].filter(Boolean).join(' · ')}{locale === 'en' ? 'Son of' : '의 아들'} <span style={{ color: H.text }}>{w.groomName}</span></p>}
              {(w.brideFatherName || w.brideMotherName) && <p>{[w.brideFatherName, w.brideMotherName].filter(Boolean).join(' · ')}{locale === 'en' ? 'Daughter of' : '의 딸'} <span style={{ color: H.text }}>{w.brideName}</span></p>}
            </div>
          )}
          {w.greeting && <p className="text-[13px] leading-[2.4] whitespace-pre-line" style={{ color: H.text, ...fg }}>{w.greeting}</p>}
        </motion.section>

        <HeartDivider />
        {w.loveStoryVideo && (<><motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-8 py-14" style={{ background: H.alt }}>
          <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: H.peach, ...fp, fontStyle: 'italic' }}>Our Story</p>
          <div className="rounded-3xl overflow-hidden" style={{ boxShadow: '0 8px 32px ' + H.peach + '18' }}><video src={w.loveStoryVideo} controls playsInline className="w-full" style={{ background: '#000' }} /></div>
        </motion.section><HeartDivider /></>)}

        <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-8 py-14 text-center" style={{ background: H.bg }}>
          <p className="text-[10px] tracking-[0.5em] mb-10" style={{ color: H.peach, ...fp, fontStyle: 'italic' }}>Ceremony</p>
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-center gap-2.5"><Calendar size={14} style={{ color: H.warm }} /><p className="text-sm" style={{ color: H.text, ...fg }}>{formatDate(w.weddingDate)}</p></div>
            <div className="flex items-center justify-center gap-2.5"><Clock size={14} style={{ color: H.warm }} /><p className="text-sm" style={{ color: H.text, ...fg }}>{formatTimeLocale(w.weddingTime, locale)}</p></div>
            <div className="flex items-center justify-center gap-2.5"><MapPin size={14} style={{ color: H.warm }} /><p className="text-sm" style={{ color: H.text, ...fg }}>{w.venue}{w.venueHall ? ' ' + w.venueHall : ''}</p></div>
            <p className="text-xs" style={{ color: H.textL }}>{w.venueAddress}</p>
          </div>
          <HeartCalendar dateStr={w.weddingDate} />
        </motion.section>

        <HeartDivider />

        <motion.section id="venue-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-8 py-14 text-center" style={{ background: H.alt }}>
          <p className="text-[10px] tracking-[0.5em] mb-8" style={{ color: H.peach, ...fp, fontStyle: 'italic' }}>Location</p>
          <p className="text-sm mb-1" style={{ color: H.text, ...fg }}>{w.venue}{w.venueHall ? ' ' + w.venueHall : ''}</p>
          <p className="text-xs mb-6" style={{ color: H.textL }}>{w.venueAddress}</p>
          <div className="rounded-3xl overflow-hidden mb-4" style={{ boxShadow: '0 4px 20px ' + H.peach + '12' }}><KakaoMap address={w.venueAddress} venue={w.venue} /></div>
          <div className="flex flex-wrap justify-center gap-2">
            {w.venueNaverMap && <a href={w.venueNaverMap} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-full text-xs" style={{ background: H.card, color: H.peach, ...fg }}>{locale === 'en' ? 'Naver Map' : '네이버 지도'}</a>}
            {w.venueKakaoMap && <a href={w.venueKakaoMap} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-full text-xs" style={{ background: H.card, color: H.peach, ...fg }}>{locale === 'en' ? 'Kakao Map' : '카카오맵'}</a>}
            {w.venueTmap && <a href={w.venueTmap} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-full text-xs" style={{ background: H.card, color: H.peach, ...fg }}>{locale === 'en' ? 'T-map' : '티맵'}</a>}
          </div>
        </motion.section>

        <HeartDivider />
        <motion.section id="rsvp-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-8 py-14" style={{ background: H.bg }}>
          <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: H.peach, ...fp, fontStyle: 'italic' }}>Attendance</p>
          <div className="rounded-3xl p-5" style={{ background: H.card }}><RsvpForm onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} weddingId={w.id} variant="heart" locale={locale} /></div>
        </motion.section>

        <HeartDivider />
        <motion.section id="account-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-8 py-14" style={{ background: H.alt }}>
          <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: H.peach, ...fp, fontStyle: 'italic' }}>Gift</p>
          <div className="space-y-3">
            {(w.groomAccount || w.groomFatherAccount || w.groomMotherAccount) && <AccordionGift title="신랑측 축의금"><CopyBtn bank={w.groomBank} account={w.groomAccount} holder={w.groomAccountHolder} /><CopyBtn bank={w.groomFatherBank} account={w.groomFatherAccount} holder={w.groomFatherAccountHolder} /><CopyBtn bank={w.groomMotherBank} account={w.groomMotherAccount} holder={w.groomMotherAccountHolder} /></AccordionGift>}
            {(w.brideAccount || w.brideFatherAccount || w.brideMotherAccount) && <AccordionGift title="신부측 축의금"><CopyBtn bank={w.brideBank} account={w.brideAccount} holder={w.brideAccountHolder} /><CopyBtn bank={w.brideFatherBank} account={w.brideFatherAccount} holder={w.brideFatherAccountHolder} /><CopyBtn bank={w.brideMotherBank} account={w.brideMotherAccount} holder={w.brideMotherAccountHolder} /></AccordionGift>}
            <div className="flex gap-2 pt-1">
              {w.tossLink && <a href={w.tossLink} target="_blank" rel="noreferrer" className="flex-1 py-3 rounded-2xl text-sm text-center" style={{ background: H.card, color: H.peach, ...fg }}>토스로 송금</a>}
              {w.kakaoPayLink && <a href={w.kakaoPayLink} target="_blank" rel="noreferrer" className="flex-1 py-3 rounded-2xl text-sm text-center" style={{ background: H.card, color: H.peach, ...fg }}>{locale === 'en' ? 'KakaoPay' : '카카오페이'}</a>}
            </div>
          </div>
        </motion.section>

        {galleries.length > 0 && (<><HeartDivider /><motion.section id="gallery-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-8 py-14" style={{ background: H.bg }}>
          <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: H.peach, ...fp, fontStyle: 'italic' }}>Gallery</p>
          <div className="space-y-2">
            {galleries.length > 0 && (
              <motion.div whileTap={{ scale: 0.98 }} onClick={() => setGalleryIndex(0)} className="relative cursor-pointer overflow-hidden rounded-3xl" style={{ aspectRatio: '4/3' }}>
                <img src={galleryThumbUrl(galleries[0].mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 40px ' + H.peach + '10' }} />
              </motion.div>
            )}
            <div className="grid grid-cols-3 gap-2">
            {galleries.slice(1).map((g: any, i: number) => (<motion.div key={g.id} whileTap={{ scale: 0.97 }} onClick={() => setGalleryIndex(i + 1)} className="aspect-square cursor-pointer overflow-hidden rounded-2xl"><img src={galleryThumbUrl(g.mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></motion.div>))}
            </div></div>
        </motion.section></>)}
        {galleryIndex !== null && galleries.length > 0 && <GalleryModal galleries={galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="HEART_MINIMAL" usePhotoFilter={w.usePhotoFilter ?? true} />}

        <HeartDivider />
        <motion.section id="guestbook-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-8 py-14" style={{ background: H.alt }}>
          <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: H.peach, ...fp, fontStyle: 'italic' }}>Guestbook</p>
          <div className="space-y-4">
            <div className="rounded-3xl p-5" style={{ background: H.card }}><GuestbookForm onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} weddingId={w.id} variant="heart" locale={locale} /></div>
            {(localGuestbooks || []).length > 0 && <GuestbookList guestbooks={localGuestbooks || []} weddingSlug={w.slug} onDelete={handleGuestbookDelete} variant="heart" locale={locale} />}
          </div>
        </motion.section>

        <HeartDivider />
        {guestPhotoSlot}
        <section className="px-8 py-14 text-center" style={{ background: H.bg }}>
          {w.closingMessage && <p className="text-[13px] leading-[2.4] whitespace-pre-line mb-10" style={{ color: H.text, ...fg }}>{w.closingMessage}</p>}
          <div className="flex justify-center gap-3 mb-8">
            {w.groomPhone && <a href={'tel:' + w.groomPhone} className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs" style={{ background: H.card, color: H.peach, ...fg }}><Phone size={12} /> 신랑에게</a>}
            {w.bridePhone && <a href={'tel:' + w.bridePhone} className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs" style={{ background: H.card, color: H.peach, ...fg }}><Phone size={12} /> 신부에게</a>}
          </div>
          <button onClick={() => setShowShare(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm" style={{ background: H.peach, color: '#fff' }}><Share2 size={14} /> 공유하기</button>
        </section>
        <footer className="pb-8 text-center"><a href="https://weddingshop.cloud" target="_blank" rel="noreferrer" className="text-[10px] tracking-wider" style={{ color: H.textL }}>Made by Wedding Studio Lab ›</a></footer>
      </div>
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} onShare={handleShare} variant="light" weddingId={w.id} />
    </div>
  );
}