import { heroUrl, galleryThumbUrl } from '../../../utils/image';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, Volume2, VolumeX, MapPin, Calendar, Clock } from 'lucide-react';
import { KakaoMap, GuestbookList, GalleryModal, ShareModal, formatDate, formatTime, getDday, type ThemeProps } from './shared';

export default function SeniorSimple({ wedding, guestbooks, onRsvpSubmit, onGuestbookSubmit, isRsvpLoading, isGuestbookLoading, guestPhotoSlot }: ThemeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rsvpData, setRsvpData] = useState({ name: '', contact: '', attendance: true, guestCount: 1 });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [guestbookData, setGuestbookData] = useState({ name: '', password: '', message: '' });
  const [guestbookSubmitted, setGuestbookSubmitted] = useState(false);
  const [localGuestbooks, setLocalGuestbooks] = useState(guestbooks || []);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const C = wedding.themeColor || '#1E3A5F';
  const C_light = `${C}15`;
  const C_medium = `${C}30`;

  useEffect(() => { setLocalGuestbooks(guestbooks || []); }, [guestbooks]);

  useEffect(() => {
    if (wedding.bgMusicAutoPlay && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [wedding.bgMusicAutoPlay]);

  const handleShare = async (type: "kakao" | "instagram" | "sms", version?: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = version ? `${baseUrl}?v=${version}` : baseUrl;
    const title = `${wedding.groomName} ♥ ${wedding.brideName}`;
    if (type === "kakao" && window.Kakao) {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: { title, description: `${formatDate(wedding.weddingDate, "korean")} ${formatTime(wedding.weddingTime)}`, imageUrl: wedding.heroMedia || "", link: { mobileWebUrl: url, webUrl: url } },
        buttons: [{ title: "청첩장 보기", link: { mobileWebUrl: url, webUrl: url } }]
      });
    } else if (type === "instagram") {
      await navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다.");
    } else if (type === "sms") {
      window.location.href = `sms:?&body=${encodeURIComponent(`${title}\n${url}`)}`;
    }
    setShowShareModal(false);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleRsvpSubmit = async () => {
    if (!rsvpData.name || !rsvpData.contact) return;
    await onRsvpSubmit({ name: rsvpData.name, phone: rsvpData.contact, attending: rsvpData.attendance, guestCount: rsvpData.guestCount });
    setRsvpSubmitted(true);
  };

  const handleGuestbookSubmit = async () => {
    if (!guestbookData.name || !guestbookData.password || !guestbookData.message) return;
    await onGuestbookSubmit(guestbookData);
    setGuestbookData({ name: '', password: '', message: '' });
    setGuestbookSubmitted(true);
    setTimeout(() => setGuestbookSubmitted(false), 3000);
  };

  const handleGuestbookDelete = (id: string) => {
    setLocalGuestbooks(prev => prev.filter(g => g.id !== id));
  };

  const copyAccount = async (text: string) => {
    await navigator.clipboard.writeText(text);
    alert('계좌번호가 복사되었습니다');
  };

  return (
    <div className="min-h-screen bg-[#FFFEF8]" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      {wedding.bgMusicUrl && <audio ref={audioRef} src={wedding.bgMusicUrl} loop />}
      
      {wedding.bgMusicUrl && (
        <button onClick={toggleMusic} className="fixed top-4 right-4 z-50 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center" style={{ borderColor: C, borderWidth: 2 }}>
          {isPlaying ? <Volume2 className="w-6 h-6" style={{ color: C }} /> : <VolumeX className="w-6 h-6 text-gray-400" />}
        </button>
      )}

      <section className="py-12 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
          <p className="text-lg mb-4" style={{ color: C }}>결혼합니다</p>
          
          {wedding.heroMedia && (
            <div className="my-8 rounded-2xl overflow-hidden shadow-lg">
              {wedding.heroMediaType === 'VIDEO' ? (
                <video src={heroUrl(wedding.heroMedia)} autoPlay muted loop playsInline className="w-full aspect-[4/5] object-cover" />
              ) : (
                <img src={heroUrl(wedding.heroMedia)} alt="" className="w-full aspect-[4/5] object-cover" />
              )}
            </div>
          )}
          
          <h1 className="text-4xl text-gray-800 font-medium mb-6">
            {wedding.groomName} <span style={{ color: C }}>♥</span> {wedding.brideName}
          </h1>
          
          <div className="text-xl text-gray-600 space-y-2">
            <p className="font-medium">{formatDate(wedding.weddingDate, 'korean')}</p>
            <p>{formatTime(wedding.weddingTime)}</p>
            <p className="text-gray-500">{wedding.venue} {wedding.venueHall}</p>
          </div>
          
          {wedding.showDday && (
            <p className="mt-6 text-2xl font-medium" style={{ color: C }}>{getDday(wedding.weddingDate)}</p>
          )}
        </motion.div>
      </section>

      {wedding.greeting && (
        <Section title="인사말" color={C}>
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            {wedding.greetingTitle && (
              <p className="text-xl text-gray-700 font-medium mb-6 text-center">{wedding.greetingTitle}</p>
            )}
            <p className="text-lg text-gray-600 leading-loose whitespace-pre-line text-center">{wedding.greeting}</p>
            
            {wedding.showParents && (
              <div className="mt-10 pt-8" style={{ borderTopWidth: 2, borderTopColor: C_light }}>
                <div className="grid grid-cols-1 gap-6 text-lg text-center">
                  <div>
                    <p className="mb-2" style={{ color: C }}>신랑측</p>
                    <p className="text-gray-500">{wedding.groomFatherName} · {wedding.groomMotherName}의 아들</p>
                    <p className="text-gray-800 text-xl font-medium mt-1">{wedding.groomName}</p>
                  </div>
                  <div>
                    <p className="mb-2" style={{ color: C }}>신부측</p>
                    <p className="text-gray-500">{wedding.brideFatherName} · {wedding.brideMotherName}의 딸</p>
                    <p className="text-gray-800 text-xl font-medium mt-1">{wedding.brideName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      <Section title="예식 일시" color={C} bgColor={C_light}>
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <div className="flex items-center justify-center gap-3 text-xl text-gray-700 mb-4">
            <Calendar className="w-6 h-6" style={{ color: C }} />
            <span className="font-medium">{formatDate(wedding.weddingDate, 'korean')}</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-xl text-gray-700">
            <Clock className="w-6 h-6" style={{ color: C }} />
            <span className="font-medium">{formatTime(wedding.weddingTime)}</span>
          </div>
        </div>
      </Section>

      {wedding.loveStoryVideo && (
  <Section>
    <div className="text-center">
      <p className="text-sm text-stone-500 mb-4">영상으로 보기</p>
      <div className="rounded-xl overflow-hidden bg-stone-100">
        {wedding.loveStoryVideo.includes("youtube") || wedding.loveStoryVideo.includes("youtu.be") ? (
          <iframe src={wedding.loveStoryVideo.includes("youtu.be") ? `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("youtu.be/")[1]?.split("?")[0]}` : `https://www.youtube.com/embed/${wedding.loveStoryVideo.split("watch?v=")[1]?.split("&")[0]}`} className="w-full aspect-video" allowFullScreen />
        ) : (
          <video src={wedding.loveStoryVideo} controls className="w-full aspect-video" />
        )}
      </div>
    </div>
  </Section>
)}

      {wedding.galleries && wedding.galleries.length > 0 && (
        <Section title="갤러리" color={C}>
          <div className="grid grid-cols-2 gap-3">
            {wedding.galleries.slice(0, 6).map((item, index) => (
              <div 
                key={item.id} 
                onClick={() => setGalleryIndex(index)} 
                className="aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-100 shadow-sm"
              >
                {item.mediaType === 'VIDEO' ? (
                  <video src={item.mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={galleryThumbUrl(item.mediaUrl)} alt="" loading="lazy" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="오시는 길" color={C} bgColor={C_light}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <KakaoMap address={wedding.venueAddress} venue={wedding.venue} latitude={wedding.venueLatitude} longitude={wedding.venueLongitude} />
          <div className="p-6 text-center">
            <p className="flex items-center justify-center gap-2 text-xl text-gray-800 font-medium">
              <MapPin className="w-6 h-6" style={{ color: C }} />
              {wedding.venue}
            </p>
            {wedding.venueHall && <p className="text-lg mt-2" style={{ color: C }}>{wedding.venueHall}</p>}
            <p className="text-lg text-gray-500 mt-2">{wedding.venueAddress}</p>
            {wedding.venuePhone && (
              <a href={`tel:${wedding.venuePhone}`} className="inline-flex items-center gap-2 text-lg mt-4" style={{ color: C }}>
                <Phone className="w-5 h-5" />{wedding.venuePhone}
              </a>
            )}
            <div className="flex flex-col gap-3 mt-6">
              {wedding.venueNaverMap && <a href={wedding.venueNaverMap} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-[#03C75A] text-white rounded-xl text-lg font-medium">네이버 지도</a>}
              {wedding.venueKakaoMap && <a href={wedding.venueKakaoMap} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-[#FEE500] text-gray-800 rounded-xl text-lg font-medium">카카오 지도</a>}
              {wedding.venueTmap && <a href={wedding.venueTmap} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-[#EF4123] text-white rounded-xl text-lg font-medium">티맵</a>}
            </div>
          </div>
        </div>
      </Section>

      <Section title="참석 여부" color={C}>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {rsvpSubmitted ? (
            <div className="text-center py-8">
              <p className="text-xl font-medium" style={{ color: C }}>참석 여부가 전달되었습니다</p>
              <p className="text-lg text-gray-500 mt-2">감사합니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              <input type="text" placeholder="이름" value={rsvpData.name} onChange={(e) => setRsvpData({ ...rsvpData, name: e.target.value })} className="w-full px-5 py-4 rounded-xl border-2 text-lg outline-none" style={{ borderColor: C_medium }} />
              <input type="tel" placeholder="연락처" value={rsvpData.contact} onChange={(e) => setRsvpData({ ...rsvpData, contact: e.target.value })} className="w-full px-5 py-4 rounded-xl border-2 text-lg outline-none" style={{ borderColor: C_medium }} />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setRsvpData({ ...rsvpData, attendance: true })} className="py-4 rounded-xl text-lg font-medium border-2 transition-colors" style={{ backgroundColor: rsvpData.attendance ? C : 'white', color: rsvpData.attendance ? 'white' : '#666', borderColor: rsvpData.attendance ? C : C_medium }}>참석</button>
                <button onClick={() => setRsvpData({ ...rsvpData, attendance: false })} className="py-4 rounded-xl text-lg font-medium border-2 transition-colors" style={{ backgroundColor: !rsvpData.attendance ? '#666' : 'white', color: !rsvpData.attendance ? 'white' : '#666', borderColor: !rsvpData.attendance ? '#666' : C_medium }}>불참</button>
              </div>
              {rsvpData.attendance && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-lg text-gray-600">동반 인원</span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setRsvpData({ ...rsvpData, guestCount: Math.max(1, rsvpData.guestCount - 1) })} className="w-12 h-12 rounded-full text-2xl font-medium" style={{ backgroundColor: C_light, color: C }}>-</button>
                    <span className="text-xl w-8 text-center">{rsvpData.guestCount}</span>
                    <button onClick={() => setRsvpData({ ...rsvpData, guestCount: rsvpData.guestCount + 1 })} className="w-12 h-12 rounded-full text-2xl font-medium" style={{ backgroundColor: C_light, color: C }}>+</button>
                  </div>
                </div>
              )}
              <button onClick={handleRsvpSubmit} disabled={isRsvpLoading || !rsvpData.name || !rsvpData.contact} className="w-full py-4 text-white rounded-xl text-lg font-medium disabled:opacity-50" style={{ backgroundColor: C }}>{isRsvpLoading ? '전송 중...' : '참석 여부 전달하기'}</button>
            </div>
          )}
        </div>
      </Section>

      {(wedding.groomAccount || wedding.brideAccount) && (
        <Section title="마음 전하기" color={C} bgColor={C_light}>
          <div className="space-y-4">
            {wedding.groomAccount && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-lg font-medium mb-3" style={{ color: C }}>신랑측 계좌</p>
                <p className="text-xl text-gray-800">{wedding.groomAccountHolder || wedding.groomName}</p>
                <p className="text-lg text-gray-500 mt-1">{wedding.groomBank} {wedding.groomAccount}</p>
                <button onClick={() => copyAccount(`${wedding.groomBank} ${wedding.groomAccount}`)} className="w-full mt-4 py-3 rounded-xl text-lg font-medium" style={{ backgroundColor: C_light, color: C }}>계좌번호 복사</button>
              </div>
            )}
            {wedding.brideAccount && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-lg font-medium mb-3" style={{ color: C }}>신부측 계좌</p>
                <p className="text-xl text-gray-800">{wedding.brideAccountHolder || wedding.brideName}</p>
                <p className="text-lg text-gray-500 mt-1">{wedding.brideBank} {wedding.brideAccount}</p>
                <button onClick={() => copyAccount(`${wedding.brideBank} ${wedding.brideAccount}`)} className="w-full mt-4 py-3 rounded-xl text-lg font-medium" style={{ backgroundColor: C_light, color: C }}>계좌번호 복사</button>
              </div>
            )}
            {(wedding.tossLink || wedding.kakaoPayLink) && (
              <div className="flex flex-col sm:flex-row gap-3">
                {wedding.tossLink && <a href={wedding.tossLink} target="_blank" className="flex-1 py-4 bg-[#0064FF] text-white rounded-xl text-lg font-medium text-center">토스</a>}
                {wedding.kakaoPayLink && <a href={wedding.kakaoPayLink} target="_blank" className="flex-1 py-4 bg-[#FEE500] text-gray-800 rounded-xl text-lg font-medium text-center">카카오페이</a>}
              </div>
            )}
          </div>
        </Section>
      )}

      <Section title="축하 메시지" color={C}>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {guestbookSubmitted && <p className="text-center text-lg mb-4" style={{ color: C }}>메시지가 등록되었습니다</p>}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" placeholder="이름" value={guestbookData.name} onChange={(e) => setGuestbookData({ ...guestbookData, name: e.target.value })} className="w-full sm:flex-1 px-4 py-3 rounded-xl border-2 text-lg outline-none" style={{ borderColor: C_medium }} />
              <input type="password" placeholder="비밀번호" value={guestbookData.password} onChange={(e) => setGuestbookData({ ...guestbookData, password: e.target.value })} className="w-full sm:w-28 px-4 py-3 rounded-xl border-2 text-lg outline-none" style={{ borderColor: C_medium }} />
            </div>
            <textarea placeholder="축하 메시지를 남겨주세요" value={guestbookData.message} onChange={(e) => setGuestbookData({ ...guestbookData, message: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border-2 text-lg outline-none resize-none" style={{ borderColor: C_medium }} />
            <button onClick={handleGuestbookSubmit} disabled={isGuestbookLoading || !guestbookData.name || !guestbookData.password || !guestbookData.message} className="w-full py-4 text-white rounded-xl text-lg font-medium disabled:opacity-50" style={{ backgroundColor: C }}>{isGuestbookLoading ? '등록 중...' : '메시지 남기기'}</button>
          </div>
          <div className="mt-6">
            <GuestbookList guestbooks={localGuestbooks} weddingSlug={wedding.slug} onDelete={handleGuestbookDelete} variant="senior" />
          </div>
        </div>
      </Section>

      {wedding.closingMessage && (
        <Section color={C}>
          <div className="text-center">
            <p className="text-lg text-gray-600 leading-loose whitespace-pre-line">{wedding.closingMessage}</p>
          </div>
        </Section>
      )}

      <Section bgColor={C_light}>
        <div className="flex gap-4">
          {wedding.groomPhone && (
            <a href={`tel:${wedding.groomPhone}`} className="flex-1 py-5 bg-white rounded-2xl text-center shadow-sm">
              <Phone className="w-8 h-8 mx-auto mb-2" style={{ color: C }} />
              <p className="text-lg text-gray-800 font-medium">신랑에게 연락</p>
            </a>
          )}
          {wedding.bridePhone && (
            <a href={`tel:${wedding.bridePhone}`} className="flex-1 py-5 bg-white rounded-2xl text-center shadow-sm">
              <Phone className="w-8 h-8 mx-auto mb-2" style={{ color: C }} />
              <p className="text-lg text-gray-800 font-medium">신부에게 연락</p>
            </a>
          )}
        </div>
      </Section>


      <Section bgColor={C_light}>
        <div className="text-center">
          <button onClick={() => setShowShareModal(true)} className="w-full py-4 text-lg font-medium rounded-xl" style={{ background: C, color: "white" }}>
            공유하기
          </button>
        </div>
      </Section>

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShare} weddingId={wedding.id} variant="light" />

      {guestPhotoSlot}
      <footer className="py-8 text-center" style={{ background: "#F5F5F5" }}><a href="https://weddingshop.cloud" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-600 transition-colors text-sm">Made by 청첩장 작업실 ›</a></footer>

      {galleryIndex !== null && wedding.galleries && (
        <GalleryModal 
          galleries={wedding.galleries} 
          currentIndex={galleryIndex} 
          onClose={() => setGalleryIndex(null)} 
          onNavigate={setGalleryIndex} theme="SENIOR_SIMPLE" usePhotoFilter={wedding.usePhotoFilter ?? true} 
        />
      )}
    </div>
  );
}

function Section({ children, title, color, bgColor, className = '' }: { children: React.ReactNode; title?: string; color?: string; bgColor?: string; className?: string }) {
  return (
    <section className={`py-10 px-6 ${className}`} style={{ backgroundColor: bgColor }}>
      <div className="max-w-md mx-auto">
        {title && <h2 className="text-2xl font-medium text-center mb-6" style={{ color: color || '#1f2937' }}>{title}</h2>}
        {children}
      </div>
    </section>
  );
}
