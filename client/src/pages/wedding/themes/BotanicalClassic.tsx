import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Copy, Check, Volume2, VolumeX, Share2, ChevronDown, MapPin, Calendar, Clock } from 'lucide-react';
import { RsvpForm, GuestbookForm, GalleryModal, GuestbookList, KakaoMap, ShareModal, formatDate, getDday, formatTimeLocale, getCalendarData, type ThemeProps } from './shared';

const P = {
  bg: '#EBE8DE', paper: '#F4F2EA', frame: '#CED0C4',
  green1: '#3D5E35', green2: '#5A7E4E', green3: '#7BA06A', green4: '#9AC088',
  brown: '#5A5040', text: '#2E3228', textM: '#525A4A', textL: '#8A9080',
  gold: '#7A7040', cream: '#F6F5EE',
};
const fontCss = "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');@font-face{font-family:'MaruBuri';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-10-21@1.0/MaruBuri-Regular.woff') format('woff');font-weight:normal;font-display:swap;}";

function FullBotanicalFrame() {
  return (
    <>
      <img src="/line-floral-1.png" alt="" className="absolute top-0 left-0 w-[200px] pointer-events-none" style={{ opacity: 0.22 }} />
      <img src="/line-floral-2.png" alt="" className="absolute top-0 right-0 w-[180px] pointer-events-none" style={{ opacity: 0.2, transform: 'scaleX(-1)' }} />
      <img src="/line-floral-1.png" alt="" className="absolute bottom-0 right-0 w-[200px] pointer-events-none" style={{ opacity: 0.18, transform: 'rotate(180deg)' }} />
      <img src="/line-floral-2.png" alt="" className="absolute bottom-0 left-0 w-[170px] pointer-events-none" style={{ opacity: 0.18, transform: 'scaleX(-1) rotate(180deg)' }} />
      <img src="/line-floral-2.png" alt="" className="absolute top-[30%] left-0 w-[120px] pointer-events-none" style={{ opacity: 0.1, transform: 'rotate(15deg)' }} />
      <img src="/line-floral-1.png" alt="" className="absolute top-[55%] right-0 w-[130px] pointer-events-none" style={{ opacity: 0.1, transform: 'scaleX(-1) rotate(-10deg)' }} />
    </>
  );
}

function BotanicalDivider({ variant = 'branch' }: { variant?: 'branch' | 'fern' | 'berry' }) {
  if (variant === 'fern') return (
    <div className="py-6 flex justify-center"><svg width="180" height="30" viewBox="0 0 180 30" fill="none" opacity="0.32">
      <path d="M20 15 Q90 15 160 15" stroke={P.green2} strokeWidth="0.5" />
      {[40,60,80,100,120,140].map((x, i) => <g key={i}><path d={'M'+x+' 15 Q'+(x-8)+' '+(i%2===0?6:24)+' '+(x-15)+' '+(i%2===0?8:22)} stroke={P.green2} strokeWidth="0.6" /><path d={'M'+x+' 15 Q'+(x+8)+' '+(i%2===0?24:6)+' '+(x+15)+' '+(i%2===0?22:8)} stroke={P.green2} strokeWidth="0.6" /></g>)}
    </svg></div>
  );
  if (variant === 'berry') return (
    <div className="py-6 flex justify-center"><svg width="160" height="28" viewBox="0 0 160 28" fill="none" opacity="0.32">
      <path d="M10 14 Q80 14 150 14" stroke={P.brown} strokeWidth="0.5" />
      {[40,65,80,95,120].map((x, i) => <g key={i}><circle cx={x} cy={14 + (i%2===0?-4:4)} r="3" stroke={P.green2} strokeWidth="0.5" fill={P.gold + '20'} /><path d={'M'+x+' '+(14+(i%2===0?-1:1))+' L'+x+' 14'} stroke={P.green2} strokeWidth="0.4" /></g>)}
    </svg></div>
  );
  return (
    <div className="py-6 flex justify-center"><svg width="200" height="24" viewBox="0 0 200 24" fill="none" opacity="0.35">
      <path d="M10 12 C50 4, 80 20, 100 12 C120 4, 150 20, 190 12" stroke={P.green2} strokeWidth="0.7" />
      <path d="M60 10 Q55 3 62 2 Q68 1 65 8" stroke={P.green3} strokeWidth="0.5" fill={P.green3 + '10'} />
      <path d="M100 12 Q95 19 102 20 Q108 22 105 15" stroke={P.green3} strokeWidth="0.5" fill={P.green3 + '10'} />
      <path d="M140 10 Q135 3 142 2 Q148 1 145 8" stroke={P.green3} strokeWidth="0.5" fill={P.green3 + '10'} />
    </svg></div>
  );
}

function BotanicalCalendar({ dateStr }: { dateStr: string }) {
  const { year, month, targetDay, weeks } = getCalendarData(dateStr);
  const d = ['S','M','T','W','T','F','S'];
  const mn = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  return (
    <div className="py-6 px-4">
      <div className="relative p-6" style={{ background: P.cream, border: '1px solid ' + P.frame, boxShadow: 'inset 0 0 30px ' + P.frame + '40' }}>
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l" style={{ borderColor: P.green2 + '30' }} />
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r" style={{ borderColor: P.green2 + '30' }} />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l" style={{ borderColor: P.green2 + '30' }} />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r" style={{ borderColor: P.green2 + '30' }} />
        <p className="text-center text-xs tracking-[0.3em] mb-4" style={{ color: P.green1, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>{mn[month]} {year}</p>
        <div className="grid grid-cols-7 gap-y-2.5 max-w-[240px] mx-auto">
          {d.map((v, i) => <span key={i} className="text-[10px] text-center" style={{ color: i===0?'#B07060':P.textL, fontFamily: "'Cormorant Garamond', serif" }}>{v}</span>)}
          {weeks.flat().map((v, i) => (
            <span key={i} className="text-xs flex items-center justify-center" style={{
              color: v===null?'transparent':v===targetDay?P.cream:i%7===0?'#B07060':P.text,
              background: v===targetDay?P.green1:'transparent',
              borderRadius: v===targetDay?'50%':undefined,
              width: v===targetDay?28:undefined, height: v===targetDay?28:undefined,
              margin: v===targetDay?'0 auto':undefined,
              fontFamily: "'Cormorant Garamond', serif",
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
    <div style={{ background: P.cream, border: '1px solid ' + P.frame }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4">
        <span className="text-sm" style={{ color: P.text, fontFamily: "'MaruBuri', serif" }}>{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={16} style={{ color: P.textM }} /></motion.div>
      </button>
      <AnimatePresence>{open && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><div className="px-5 pb-4 space-y-2">{children}</div></motion.div>}</AnimatePresence>
    </div>
  );
}

function CopyBtn({ bank, account, holder }: { bank?: string; account?: string; holder?: string }) {
  const [ok, setOk] = useState(false);
  if (!account) return null;
  return (
    <div className="flex items-center justify-between py-2.5 px-3" style={{ background: P.green1 + '06' }}>
      <span className="text-sm" style={{ color: P.text, fontFamily: "'MaruBuri', serif" }}><span style={{ color: P.textM }}>{bank}</span> {account}{holder && <span className="ml-1 text-xs" style={{ color: P.textL }}>({holder})</span>}</span>
      <button onClick={() => { navigator.clipboard.writeText(account); setOk(true); setTimeout(() => setOk(false), 2000); }} className="p-1.5">{ok ? <Check size={14} style={{ color: P.green1 }} /> : <Copy size={14} style={{ color: P.textM }} />}</button>
    </div>
  );
}

export default function BotanicalClassic({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot , locale}: ThemeProps) {
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
          description: formatDate(w.weddingDate) + ' ' + formatTimeLocale(w.weddingTime, locale),
          imageUrl: w.ogCoverType === 'envelope' ? ({"black_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/7_errq8w.png", "white_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "navy_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/1_zdaupp.png", "black_silver": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "olive_ribbon_a": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/3_wdfeio.png", "olive_ribbon_b": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png", "pink_ribbon": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551595/5_pzmfwy.png", "white_bow": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/11_o3gnaj.png", "white_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551598/10_quisxm.png", "black_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551609/9_jvys7z.png", "pink_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551604/6_akrfek.png", "olive_seal": "https://res.cloudinary.com/duzlquvxj/image/upload/v1773551605/4_cjucaz.png"}[w.envelopeStyle || 'black_ribbon'] || w.heroMedia || '') : (w.heroMedia || ''),
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
  const fm: React.CSSProperties = { fontFamily: "'MaruBuri', serif" };
  const fe: React.CSSProperties = { fontFamily: "'Cormorant Garamond', serif" };
  const dday = getDday(w.weddingDate);

  return (
    <div className="min-h-screen relative botanical-theme" style={{ background: P.bg }}>
      <style>{`
        .botanical-theme button[type="submit"] { background: #4A6741; color: #FAF6EC; border-radius: 0; border: none; }
        .botanical-theme button[type="submit"]:hover { background: #3A5230; }
        .botanical-theme input:focus, .botanical-theme textarea:focus, .botanical-theme select:focus { border-color: #6B8F5B; outline-color: #6B8F5B; --tw-ring-color: #6B8F5B; }
      `}</style>
      {w.bgMusicUrl && <audio ref={audioRef} src={w.bgMusicUrl} loop />}
      {w.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center" style={{ background: P.paper + 'EE', border: '1px solid ' + P.frame }}>
          {playing ? <Volume2 size={15} style={{ color: P.green1 }} /> : <VolumeX size={15} style={{ color: P.textM }} />}
        </button>
      )}
      <div className="relative max-w-lg mx-auto overflow-hidden">
        <FullBotanicalFrame />
        <div className="relative z-10">
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.8 }} className="min-h-screen flex flex-col items-center justify-center px-12 text-center">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-[11px] tracking-[0.5em] mb-10" style={{ color: P.green2, ...fe, fontStyle: 'italic' }}>Wedding Invitation</motion.p>
            {w.heroMedia && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 1.2 }}
                className="w-[240px] h-[320px] relative mx-auto mb-10">
                <div className="absolute inset-0" style={{ border: '1px solid ' + P.frame, borderRadius: '50% 50% 5% 5%' }} />
                <div className="absolute inset-[6px] overflow-hidden" style={{ borderRadius: '50% 50% 3% 3%' }}>
                  {w.heroMediaType === 'VIDEO' ? <video src={heroUrl(w.heroMedia)} autoPlay muted loop playsInline className="w-full h-full object-cover" /> : <img src={heroUrl(w.heroMedia)} alt="" className="w-full h-full object-cover" />}
                </div>
                <img src="/line-floral-2.png" alt="" className="absolute -top-8 -left-6 w-[80px] pointer-events-none" style={{ opacity: 0.3, transform: 'rotate(-30deg)' }} />
                <img src="/line-floral-2.png" alt="" className="absolute -top-8 -right-6 w-[80px] pointer-events-none" style={{ opacity: 0.3, transform: 'scaleX(-1) rotate(-30deg)' }} />
                <img src="/line-floral-1.png" alt="" className="absolute -bottom-6 left-1/2 w-[100px] pointer-events-none" style={{ opacity: 0.25, transform: 'translateX(-50%) rotate(180deg)' }} />
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
              <p className="text-sm tracking-[0.08em] mb-2 whitespace-nowrap" style={{ color: P.green1, ...fe, fontStyle: 'italic', fontSize: 'clamp(9px, 2.5vw, 14px)' }}>
                {(w as any).groomNameEn || w.groomName} & {(w as any).brideNameEn || w.brideName}
              </p>
              <h1 className="text-[28px] mb-4" style={{ color: P.text, ...fm, letterSpacing: '0.15em' }}>{w.groomName} · {w.brideName}</h1>
              <p className="text-sm" style={{ color: P.textM, ...fe, fontStyle: 'italic' }}>{formatDate(w.weddingDate)}</p>
              {w.showDday && <p className="text-xs mt-4 tracking-[0.2em]" style={{ color: P.green2 }}>{dday}</p>}
            </motion.div>
          </motion.section>

          <BotanicalDivider variant="branch" />

          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-12 text-center">
            <p className="text-[10px] tracking-[0.5em] mb-8" style={{ color: P.green2, ...fe, fontStyle: 'italic' }}>Invitation</p>
            {w.showParents && (w.groomFatherName || w.groomMotherName || w.brideFatherName || w.brideMotherName) && (
              <div className="text-[13px] mb-8 space-y-1" style={{ color: P.textM, ...fm }}>
                {(w.groomFatherName || w.groomMotherName) && <p>{[w.groomFatherName, w.groomMotherName].filter(Boolean).join(' · ')}{locale === 'en' ? 'Son of' : '의 아들'} <span style={{ color: P.text }}>{w.groomName}</span></p>}
                {(w.brideFatherName || w.brideMotherName) && <p>{[w.brideFatherName, w.brideMotherName].filter(Boolean).join(' · ')}{locale === 'en' ? 'Daughter of' : '의 딸'} <span style={{ color: P.text }}>{w.brideName}</span></p>}
              </div>
            )}
            {w.greeting && <p className="text-[13px] leading-[2.4] whitespace-pre-line" style={{ color: P.text, ...fm }}>{w.greeting}</p>}
          </motion.section>

          <BotanicalDivider variant="fern" />
          {w.loveStoryVideo && (<><motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-12">
            <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: P.green2, ...fe, fontStyle: 'italic' }}>Our Story</p>
            <div className="overflow-hidden" style={{ border: '1px solid ' + P.frame }}><video src={w.loveStoryVideo} controls playsInline className="w-full" style={{ background: '#000' }} /></div>
          </motion.section><BotanicalDivider variant="berry" /></>)}

          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-12 text-center">
            <p className="text-[10px] tracking-[0.5em] mb-10" style={{ color: P.green2, ...fe, fontStyle: 'italic' }}>Ceremony</p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-center gap-2.5"><Calendar size={14} style={{ color: P.green2 }} /><p className="text-sm" style={{ color: P.text, ...fm }}>{formatDate(w.weddingDate)}</p></div>
              <div className="flex items-center justify-center gap-2.5"><Clock size={14} style={{ color: P.green2 }} /><p className="text-sm" style={{ color: P.text, ...fm }}>{formatTimeLocale(w.weddingTime, locale)}</p></div>
              <div className="flex items-center justify-center gap-2.5"><MapPin size={14} style={{ color: P.green2 }} /><p className="text-sm" style={{ color: P.text, ...fm }}>{w.venue}{w.venueHall ? ' ' + w.venueHall : ''}</p></div>
              <p className="text-xs" style={{ color: P.textL }}>{w.venueAddress}</p>
            </div>
            <BotanicalCalendar dateStr={w.weddingDate} />
          </motion.section>

          <BotanicalDivider variant="fern" />

          <motion.section id="venue-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-12 text-center">
            <p className="text-[10px] tracking-[0.5em] mb-8" style={{ color: P.green2, ...fe, fontStyle: 'italic' }}>Location</p>
            <p className="text-sm mb-1" style={{ color: P.text, ...fm }}>{w.venue}{w.venueHall ? ' ' + w.venueHall : ''}</p>
            <p className="text-xs mb-6" style={{ color: P.textL }}>{w.venueAddress}</p>
            <div className="overflow-hidden mb-4" style={{ border: '1px solid ' + P.frame }}><KakaoMap address={w.venueAddress} venue={w.venue} /></div>
            <div className="flex flex-wrap justify-center gap-2">
              {w.venueNaverMap && <a href={w.venueNaverMap} target="_blank" rel="noreferrer" className="px-4 py-2.5 text-xs" style={{ background: P.cream, color: P.green1, border: '1px solid ' + P.frame }}>{locale === 'en' ? 'Naver Map' : '네이버 지도'}</a>}
              {w.venueKakaoMap && <a href={w.venueKakaoMap} target="_blank" rel="noreferrer" className="px-4 py-2.5 text-xs" style={{ background: P.cream, color: P.green1, border: '1px solid ' + P.frame }}>{locale === 'en' ? 'Kakao Map' : '카카오맵'}</a>}
              {w.venueTmap && <a href={w.venueTmap} target="_blank" rel="noreferrer" className="px-4 py-2.5 text-xs" style={{ background: P.cream, color: P.green1, border: '1px solid ' + P.frame }}>{locale === 'en' ? 'T-map' : '티맵'}</a>}
            </div>
          </motion.section>

          <BotanicalDivider variant="branch" />
          <motion.section id="rsvp-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-12">
            <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: P.green2, ...fe, fontStyle: 'italic' }}>Attendance</p>
            <div className="p-5" style={{ background: P.cream, border: '1px solid ' + P.frame }}><RsvpForm onSubmit={onRsvpSubmit} isLoading={isRsvpLoading} weddingId={w.id} variant="botanical" locale={locale} /></div>
          </motion.section>

          <BotanicalDivider variant="fern" />
          <motion.section id="account-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-12">
            <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: P.green2, ...fe, fontStyle: 'italic' }}>Gift</p>
            <div className="space-y-3">
              {(w.groomAccount || w.groomFatherAccount || w.groomMotherAccount) && <AccordionGift title="신랑측 축의금"><CopyBtn bank={w.groomBank} account={w.groomAccount} holder={w.groomAccountHolder} /><CopyBtn bank={w.groomFatherBank} account={w.groomFatherAccount} holder={w.groomFatherAccountHolder} /><CopyBtn bank={w.groomMotherBank} account={w.groomMotherAccount} holder={w.groomMotherAccountHolder} /></AccordionGift>}
              {(w.brideAccount || w.brideFatherAccount || w.brideMotherAccount) && <AccordionGift title="신부측 축의금"><CopyBtn bank={w.brideBank} account={w.brideAccount} holder={w.brideAccountHolder} /><CopyBtn bank={w.brideFatherBank} account={w.brideFatherAccount} holder={w.brideFatherAccountHolder} /><CopyBtn bank={w.brideMotherBank} account={w.brideMotherAccount} holder={w.brideMotherAccountHolder} /></AccordionGift>}
              <div className="flex gap-2 pt-1">
                {w.tossLink && <a href={w.tossLink} target="_blank" rel="noreferrer" className="flex-1 py-3 text-sm text-center" style={{ background: P.cream, color: P.green1, border: '1px solid ' + P.frame }}>토스로 송금</a>}
                {w.kakaoPayLink && <a href={w.kakaoPayLink} target="_blank" rel="noreferrer" className="flex-1 py-3 text-sm text-center" style={{ background: P.cream, color: P.green1, border: '1px solid ' + P.frame }}>{locale === 'en' ? 'KakaoPay' : '카카오페이'}</a>}
              </div>
            </div>
          </motion.section>

          {galleries.length > 0 && (<><BotanicalDivider variant="berry" /><motion.section id="gallery-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-12">
            <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: P.green2, ...fe, fontStyle: 'italic' }}>Gallery</p>
            <div className="space-y-[3px]">
              {galleries.length > 0 && <motion.div whileTap={{ scale: 0.98 }} onClick={() => setGalleryIndex(0)} className="aspect-[16/10] cursor-pointer overflow-hidden" style={{ border: '1px solid ' + P.frame }}><img src={galleryThumbUrl(galleries[0].mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" /></motion.div>}
              <div className="grid grid-cols-3 gap-[3px]">
              {galleries.slice(1).map((g: any, i: number) => (<motion.div key={g.id} whileTap={{ scale: 0.97 }} onClick={() => setGalleryIndex(i + 1)} className="aspect-square cursor-pointer overflow-hidden" style={{ border: '1px solid ' + P.frame }}><img src={galleryThumbUrl(g.mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></motion.div>))}
              </div></div>
          </motion.section></>)}
          {galleryIndex !== null && galleries.length > 0 && <GalleryModal galleries={galleries} currentIndex={galleryIndex} onClose={() => setGalleryIndex(null)} onNavigate={setGalleryIndex} theme="BOTANICAL_CLASSIC" usePhotoFilter={w.usePhotoFilter ?? true} />}

          <BotanicalDivider variant="branch" />
          <motion.section id="guestbook-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-10 py-12">
            <p className="text-[10px] tracking-[0.5em] text-center mb-8" style={{ color: P.green2, ...fe, fontStyle: 'italic' }}>Guestbook</p>
            <div className="space-y-4">
              <div className="p-5" style={{ background: P.cream, border: '1px solid ' + P.frame }}><GuestbookForm onSubmit={onGuestbookSubmit} isLoading={isGuestbookLoading} weddingId={w.id} variant="botanical" locale={locale} /></div>
              {(localGuestbooks || []).length > 0 && <GuestbookList guestbooks={localGuestbooks || []} weddingSlug={w.slug} onDelete={handleGuestbookDelete} variant="botanical" locale={locale} />}
            </div>
          </motion.section>

          <BotanicalDivider variant="fern" />
          {guestPhotoSlot}
          <section className="px-10 py-12 text-center">
            {w.closingMessage && <p className="text-[13px] leading-[2.4] whitespace-pre-line mb-10" style={{ color: P.text, ...fm }}>{w.closingMessage}</p>}
            <div className="flex justify-center gap-3 mb-8">
              {w.groomPhone && <a href={'tel:' + w.groomPhone} className="flex items-center gap-1.5 px-5 py-2.5 text-xs" style={{ background: P.cream, color: P.green1, border: '1px solid ' + P.frame }}><Phone size={12} /> 신랑에게</a>}
              {w.bridePhone && <a href={'tel:' + w.bridePhone} className="flex items-center gap-1.5 px-5 py-2.5 text-xs" style={{ background: P.cream, color: P.green1, border: '1px solid ' + P.frame }}><Phone size={12} /> 신부에게</a>}
            </div>
            <button onClick={() => setShowShare(true)} className="inline-flex items-center gap-2 px-6 py-3 text-sm" style={{ background: P.green1, color: P.cream }}><Share2 size={14} /> 공유하기</button>
          </section>
          <footer className="pb-8 text-center"><a href="https://weddingshop.cloud" target="_blank" rel="noreferrer" className="text-[10px] tracking-wider" style={{ color: P.textL }}>Made by Wedding Studio Lab ›</a></footer>
        </div>
      </div>
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} onShare={handleShare} variant="light" weddingId={w.id} />
    </div>
  );
}
