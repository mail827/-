import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, MapPin, CreditCard, Image, 
  Music, MessageCircle, Upload, X, Plus, Trash2
} from 'lucide-react';
import type { Wedding, Theme } from '../../types';
import { THEME_NAMES, THEME_COLORS } from '../../types';
import { uploadFile } from '../../utils/api';

interface WeddingFormProps {
  wedding?: Wedding;
  onSubmit: (data: Partial<Wedding>) => void;
  onAddGallery?: (mediaUrl: string, mediaType: 'IMAGE' | 'VIDEO') => void;
  onDeleteGallery?: (id: string) => void;
  isLoading?: boolean;
}

type TabType = 'basic' | 'greeting' | 'venue' | 'account' | 'gallery' | 'options';

const tabs: { id: TabType; label: string; icon: typeof Heart }[] = [
  { id: 'basic', label: '기본 정보', icon: Heart },
  { id: 'greeting', label: '인사말', icon: MessageCircle },
  { id: 'venue', label: '예식 정보', icon: MapPin },
  { id: 'account', label: '축의금', icon: CreditCard },
  { id: 'gallery', label: '갤러리', icon: Image },
  { id: 'options', label: '옵션', icon: Music }
];

const SENIOR_COLORS = [
  { name: '남색', value: '#1E3A5F' },
  { name: '앰버', value: '#B45309' },
  { name: '로즈', value: '#BE123C' },
  { name: '그린', value: '#15803D' },
  { name: '퍼플', value: '#7C3AED' },
  { name: '브라운', value: '#78350F' },
];

export default function WeddingForm({ 
  wedding, 
  onSubmit, 
  onAddGallery,
  onDeleteGallery,
  isLoading 
}: WeddingFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [formData, setFormData] = useState<Partial<Wedding>>({
    theme: wedding?.theme || 'ROMANTIC_CLASSIC',
    themeColor: wedding?.themeColor || '#1E3A5F',
    weddingDate: wedding?.weddingDate?.split('T')[0] || '',
    weddingTime: wedding?.weddingTime || '',
    groomName: wedding?.groomName || '',
    groomNameEn: wedding?.groomNameEn || '',
    groomPhone: wedding?.groomPhone || '',
    brideName: wedding?.brideName || '',
    brideNameEn: wedding?.brideNameEn || '',
    bridePhone: wedding?.bridePhone || '',
    showParents: wedding?.showParents ?? true,
    groomFatherName: wedding?.groomFatherName || '',
    groomMotherName: wedding?.groomMotherName || '',
    groomFatherPhone: wedding?.groomFatherPhone || '',
    groomMotherPhone: wedding?.groomMotherPhone || '',
    brideFatherName: wedding?.brideFatherName || '',
    brideMotherName: wedding?.brideMotherName || '',
    brideFatherPhone: wedding?.brideFatherPhone || '',
    brideMotherPhone: wedding?.brideMotherPhone || '',
    greetingTitle: wedding?.greetingTitle || '',
    greeting: wedding?.greeting || '',
    loveStory: wedding?.loveStory || '',
    loveStoryType: wedding?.loveStoryType || 'PHOTO',
    loveStoryVideo: wedding?.loveStoryVideo || '',
    venue: wedding?.venue || '',
    venueHall: wedding?.venueHall || '',
    venueAddress: wedding?.venueAddress || '',
    venuePhone: wedding?.venuePhone || '',
    venueNaverMap: wedding?.venueNaverMap || '',
    venueKakaoMap: wedding?.venueKakaoMap || '',
    venueTmap: wedding?.venueTmap || '',
    groomBank: wedding?.groomBank || '',
    groomAccount: wedding?.groomAccount || '',
    groomAccountHolder: wedding?.groomAccountHolder || '',
    brideBank: wedding?.brideBank || '',
    brideAccount: wedding?.brideAccount || '',
    brideAccountHolder: wedding?.brideAccountHolder || '',
    groomFatherBank: wedding?.groomFatherBank || '',
    groomFatherAccount: wedding?.groomFatherAccount || '',
    groomFatherAccountHolder: wedding?.groomFatherAccountHolder || '',
    groomMotherBank: wedding?.groomMotherBank || '',
    groomMotherAccount: wedding?.groomMotherAccount || '',
    groomMotherAccountHolder: wedding?.groomMotherAccountHolder || '',
    brideFatherBank: wedding?.brideFatherBank || '',
    brideFatherAccount: wedding?.brideFatherAccount || '',
    brideFatherAccountHolder: wedding?.brideFatherAccountHolder || '',
    brideMotherBank: wedding?.brideMotherBank || '',
    brideMotherAccount: wedding?.brideMotherAccount || '',
    brideMotherAccountHolder: wedding?.brideMotherAccountHolder || '',
    tossLink: wedding?.tossLink || '',
    kakaoPayLink: wedding?.kakaoPayLink || '',
    heroMedia: wedding?.heroMedia || '',
    heroMediaType: wedding?.heroMediaType || 'IMAGE',
    bgMusicUrl: wedding?.bgMusicUrl || '',
    bgMusicAutoPlay: wedding?.bgMusicAutoPlay ?? false,
    showDday: wedding?.showDday ?? true,
    closingMessage: wedding?.closingMessage || ''
  });

  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof Wedding>(field: K, value: Wedding[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading('hero');
    try {
      const isVideo = file.type.startsWith('video/');
      const result = await uploadFile(file, isVideo ? 'video' : 'image', 'hero');
      updateField('heroMedia', result.url);
      updateField('heroMediaType', isVideo ? 'VIDEO' : 'IMAGE');
    } catch (error) {
      alert('업로드 실패: ' + (error as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onAddGallery) return;

    setUploading('gallery');
    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith('video/');
        const result = await uploadFile(file, isVideo ? 'video' : 'image', 'gallery');
        onAddGallery(result.url, isVideo ? 'VIDEO' : 'IMAGE');
      }
    } catch (error) {
      alert('업로드 실패: ' + (error as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading('music');
    try {
      const result = await uploadFile(file, 'audio');
      updateField('bgMusicUrl', result.url);
    } catch (error) {
      alert('업로드 실패: ' + (error as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputClass = "w-full px-4 py-3 bg-[#FDF8F3] border-2 border-transparent rounded-xl focus:border-[#D4A5A5] focus:bg-white outline-none transition-all text-[#2D2D2D]";
  const labelClass = "block text-sm font-medium text-[#2D2D2D] mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap gap-2 bg-white rounded-xl p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#D4A5A5] to-[#C9A961] text-white shadow-md'
                : 'text-[#666] hover:bg-[#FDF8F3]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <AnimatePresence mode="wait">
          {activeTab === 'basic' && (
            <motion.div
              key="basic"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className={labelClass}>테마 선택</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(Object.keys(THEME_NAMES) as Theme[]).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => updateField('theme', theme)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        formData.theme === theme
                          ? 'border-[#D4A5A5] bg-[#FDF8F3]'
                          : 'border-transparent bg-[#F5F5F5] hover:bg-[#FDF8F3]'
                      }`}
                    >
                      <div className="flex gap-1 mb-2 justify-center">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: THEME_COLORS[theme].primary }} 
                        />
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: THEME_COLORS[theme].accent }} 
                        />
                      </div>
                      <p className="text-xs font-medium text-center text-[#2D2D2D]">
                        {THEME_NAMES[theme]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {formData.theme === 'SENIOR_SIMPLE' && (
                <div>
                  <label className={labelClass}>어르신 테마 색상</label>
                  <p className="text-xs text-[#888] mb-3">선물하시는 분의 취향에 맞게 색상을 선택해주세요</p>
                  <div className="flex flex-wrap gap-3">
                    {SENIOR_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => updateField('themeColor', color.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          formData.themeColor === color.value
                            ? 'border-[#D4A5A5] bg-[#FDF8F3]'
                            : 'border-transparent bg-[#F5F5F5] hover:bg-[#FDF8F3]'
                        }`}
                      >
                        <div 
                          className="w-10 h-10 rounded-full shadow-inner" 
                          style={{ backgroundColor: color.value }}
                        />
                        <span className="text-xs font-medium text-[#2D2D2D]">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>대표 이미지/영상</label>
                <div className="relative">
                  {formData.heroMedia ? (
                    <div className="relative rounded-xl overflow-hidden bg-[#FDF8F3]">
                      {formData.heroMediaType === 'VIDEO' ? (
                        <video src={formData.heroMedia} className="w-full h-48 object-cover" />
                      ) : (
                        <img src={formData.heroMedia} alt="대표 이미지" className="w-full h-48 object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => updateField('heroMedia', '')}
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[#D4A5A5]/30 rounded-xl cursor-pointer hover:bg-[#FDF8F3] transition-colors">
                      <Upload className="w-8 h-8 text-[#D4A5A5] mb-2" />
                      <p className="text-sm text-[#666]">이미지 또는 영상을 업로드하세요</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleHeroUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                  {uploading === 'hero' && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                      <div className="w-8 h-8 border-2 border-[#D4A5A5] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>예식 날짜</label>
                  <input
                    type="date"
                    value={formData.weddingDate}
                    onChange={(e) => updateField('weddingDate', e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>예식 시간</label>
                  <input
                    type="time"
                    value={formData.weddingTime}
                    onChange={(e) => updateField('weddingTime', e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-[#2D2D2D] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">🤵</span>
                    신랑 정보
                  </h3>
                  <div>
                    <label className={labelClass}>이름 (한글)</label>
                    <input
                      type="text"
                      value={formData.groomName}
                      onChange={(e) => updateField('groomName', e.target.value)}
                      className={inputClass}
                      placeholder="홍길동"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>이름 (영문)</label>
                    <input
                      type="text"
                      value={formData.groomNameEn}
                      onChange={(e) => updateField('groomNameEn', e.target.value)}
                      className={inputClass}
                      placeholder="Gildong Hong"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>연락처</label>
                    <input
                      type="tel"
                      value={formData.groomPhone}
                      onChange={(e) => updateField('groomPhone', e.target.value)}
                      className={inputClass}
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-[#2D2D2D] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-xs">👰</span>
                    신부 정보
                  </h3>
                  <div>
                    <label className={labelClass}>이름 (한글)</label>
                    <input
                      type="text"
                      value={formData.brideName}
                      onChange={(e) => updateField('brideName', e.target.value)}
                      className={inputClass}
                      placeholder="김영희"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>이름 (영문)</label>
                    <input
                      type="text"
                      value={formData.brideNameEn}
                      onChange={(e) => updateField('brideNameEn', e.target.value)}
                      className={inputClass}
                      placeholder="Younghee Kim"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>연락처</label>
                    <input
                      type="tel"
                      value={formData.bridePhone}
                      onChange={(e) => updateField('bridePhone', e.target.value)}
                      className={inputClass}
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showParents}
                    onChange={(e) => updateField('showParents', e.target.checked)}
                    className="w-5 h-5 rounded border-[#D4A5A5] text-[#D4A5A5] focus:ring-[#D4A5A5]"
                  />
                  <span className="text-sm text-[#2D2D2D]">혼주 정보 표시</span>
                </label>
              </div>

              {formData.showParents && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F5E6E0]">
                  <div className="space-y-4">
                    <h4 className="font-medium text-[#666]">신랑측 혼주</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>아버지 성함</label>
                        <input
                          type="text"
                          value={formData.groomFatherName}
                          onChange={(e) => updateField('groomFatherName', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>어머니 성함</label>
                        <input
                          type="text"
                          value={formData.groomMotherName}
                          onChange={(e) => updateField('groomMotherName', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-[#666]">신부측 혼주</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>아버지 성함</label>
                        <input
                          type="text"
                          value={formData.brideFatherName}
                          onChange={(e) => updateField('brideFatherName', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>어머니 성함</label>
                        <input
                          type="text"
                          value={formData.brideMotherName}
                          onChange={(e) => updateField('brideMotherName', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'greeting' && (
            <motion.div
              key="greeting"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className={labelClass}>인사말 제목</label>
                <input
                  type="text"
                  value={formData.greetingTitle}
                  onChange={(e) => updateField('greetingTitle', e.target.value)}
                  className={inputClass}
                  placeholder="소중한 분들을 초대합니다"
                />
              </div>
              <div>
                <label className={labelClass}>인사말</label>
                <textarea
                  value={formData.greeting}
                  onChange={(e) => updateField('greeting', e.target.value)}
                  className={`${inputClass} h-40 resize-none`}
                  placeholder="따뜻한 인사말을 작성해주세요..."
                />
              </div>
              <div>
                <label className={labelClass}>러브스토리 / 소개글</label>
                <textarea
                  value={formData.loveStory}
                  onChange={(e) => updateField('loveStory', e.target.value)}
                  className={`${inputClass} h-32 resize-none`}
                  placeholder="두 분의 이야기를 들려주세요..."
                />
              </div>
              <div>
                <label className={labelClass}>마무리 인사</label>
                <textarea
                  value={formData.closingMessage}
                  onChange={(e) => updateField('closingMessage', e.target.value)}
                  className={`${inputClass} h-24 resize-none`}
                  placeholder="감사의 말씀..."
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'venue' && (
            <motion.div
              key="venue"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>예식장 이름</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => updateField('venue', e.target.value)}
                    className={inputClass}
                    placeholder="○○웨딩홀"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>홀 이름</label>
                  <input
                    type="text"
                    value={formData.venueHall}
                    onChange={(e) => updateField('venueHall', e.target.value)}
                    className={inputClass}
                    placeholder="그랜드볼룸 3층"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>주소</label>
                <input
                  type="text"
                  value={formData.venueAddress}
                  onChange={(e) => updateField('venueAddress', e.target.value)}
                  className={inputClass}
                  placeholder="서울특별시 강남구..."
                  required
                />
              </div>
              <div>
                <label className={labelClass}>예식장 전화번호</label>
                <input
                  type="tel"
                  value={formData.venuePhone}
                  onChange={(e) => updateField('venuePhone', e.target.value)}
                  className={inputClass}
                  placeholder="02-1234-5678"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>네이버 지도 링크</label>
                  <input
                    type="url"
                    value={formData.venueNaverMap}
                    onChange={(e) => updateField('venueNaverMap', e.target.value)}
                    className={inputClass}
                    placeholder="https://naver.me/..."
                  />
                </div>
                <div>
                  <label className={labelClass}>카카오맵 링크</label>
                  <input
                    type="url"
                    value={formData.venueKakaoMap}
                    onChange={(e) => updateField('venueKakaoMap', e.target.value)}
                    className={inputClass}
                    placeholder="https://kko.to/..."
                  />
                </div>
                <div>
                  <label className={labelClass}>티맵 링크</label>
                  <input
                    type="url"
                    value={formData.venueTmap}
                    onChange={(e) => updateField('venueTmap', e.target.value)}
                    className={inputClass}
                    placeholder="https://tmap.life/..."
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-[#2D2D2D]">🤵 신랑측 계좌</h3>
                  <div className="space-y-3 p-4 bg-[#FDF8F3] rounded-xl">
                    <div>
                      <label className={labelClass}>신랑 계좌</label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={formData.groomBank}
                          onChange={(e) => updateField('groomBank', e.target.value)}
                          className={inputClass}
                          placeholder="은행"
                        />
                        <input
                          type="text"
                          value={formData.groomAccount}
                          onChange={(e) => updateField('groomAccount', e.target.value)}
                          className={`${inputClass} col-span-2`}
                          placeholder="계좌번호"
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.groomAccountHolder}
                        onChange={(e) => updateField('groomAccountHolder', e.target.value)}
                        className={`${inputClass} mt-2`}
                        placeholder="예금주"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>신랑 아버지 계좌</label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={formData.groomFatherBank}
                          onChange={(e) => updateField('groomFatherBank', e.target.value)}
                          className={inputClass}
                          placeholder="은행"
                        />
                        <input
                          type="text"
                          value={formData.groomFatherAccount}
                          onChange={(e) => updateField('groomFatherAccount', e.target.value)}
                          className={`${inputClass} col-span-2`}
                          placeholder="계좌번호"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>신랑 어머니 계좌</label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={formData.groomMotherBank}
                          onChange={(e) => updateField('groomMotherBank', e.target.value)}
                          className={inputClass}
                          placeholder="은행"
                        />
                        <input
                          type="text"
                          value={formData.groomMotherAccount}
                          onChange={(e) => updateField('groomMotherAccount', e.target.value)}
                          className={`${inputClass} col-span-2`}
                          placeholder="계좌번호"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-[#2D2D2D]">👰 신부측 계좌</h3>
                  <div className="space-y-3 p-4 bg-[#FDF8F3] rounded-xl">
                    <div>
                      <label className={labelClass}>신부 계좌</label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={formData.brideBank}
                          onChange={(e) => updateField('brideBank', e.target.value)}
                          className={inputClass}
                          placeholder="은행"
                        />
                        <input
                          type="text"
                          value={formData.brideAccount}
                          onChange={(e) => updateField('brideAccount', e.target.value)}
                          className={`${inputClass} col-span-2`}
                          placeholder="계좌번호"
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.brideAccountHolder}
                        onChange={(e) => updateField('brideAccountHolder', e.target.value)}
                        className={`${inputClass} mt-2`}
                        placeholder="예금주"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>신부 아버지 계좌</label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={formData.brideFatherBank}
                          onChange={(e) => updateField('brideFatherBank', e.target.value)}
                          className={inputClass}
                          placeholder="은행"
                        />
                        <input
                          type="text"
                          value={formData.brideFatherAccount}
                          onChange={(e) => updateField('brideFatherAccount', e.target.value)}
                          className={`${inputClass} col-span-2`}
                          placeholder="계좌번호"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>신부 어머니 계좌</label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={formData.brideMotherBank}
                          onChange={(e) => updateField('brideMotherBank', e.target.value)}
                          className={inputClass}
                          placeholder="은행"
                        />
                        <input
                          type="text"
                          value={formData.brideMotherAccount}
                          onChange={(e) => updateField('brideMotherAccount', e.target.value)}
                          className={`${inputClass} col-span-2`}
                          placeholder="계좌번호"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#F5E6E0]">
                <div>
                  <label className={labelClass}>토스 송금 링크</label>
                  <input
                    type="url"
                    value={formData.tossLink}
                    onChange={(e) => updateField('tossLink', e.target.value)}
                    className={inputClass}
                    placeholder="https://toss.me/..."
                  />
                </div>
                <div>
                  <label className={labelClass}>카카오페이 링크</label>
                  <input
                    type="url"
                    value={formData.kakaoPayLink}
                    onChange={(e) => updateField('kakaoPayLink', e.target.value)}
                    className={inputClass}
                    placeholder="https://qr.kakaopay.com/..."
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className={labelClass}>갤러리 이미지/영상</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {wedding?.galleries?.map((gallery) => (
                    <div key={gallery.id} className="relative aspect-square rounded-xl overflow-hidden bg-[#FDF8F3] group">
                      {gallery.mediaType === 'VIDEO' ? (
                        <video src={gallery.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={gallery.mediaUrl} alt="" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => onDeleteGallery?.(gallery.id)}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="aspect-square border-2 border-dashed border-[#D4A5A5]/30 rounded-xl cursor-pointer hover:bg-[#FDF8F3] transition-colors flex flex-col items-center justify-center">
                    {uploading === 'gallery' ? (
                      <div className="w-8 h-8 border-2 border-[#D4A5A5] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-8 h-8 text-[#D4A5A5] mb-2" />
                        <p className="text-xs text-[#666]">추가</p>
                      </>
                    )}
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'options' && (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className={labelClass}>배경 음악</label>
                <div className="flex items-center gap-4">
                  {formData.bgMusicUrl ? (
                    <div className="flex-1 flex items-center gap-3 p-4 bg-[#FDF8F3] rounded-xl">
                      <Music className="w-5 h-5 text-[#D4A5A5]" />
                      <span className="flex-1 truncate text-sm text-[#666]">{formData.bgMusicUrl}</span>
                      <button
                        type="button"
                        onClick={() => updateField('bgMusicUrl', '')}
                        className="p-1 hover:bg-[#D4A5A5]/20 rounded"
                      >
                        <X className="w-4 h-4 text-[#666]" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[#D4A5A5]/30 rounded-xl cursor-pointer hover:bg-[#FDF8F3]">
                      {uploading === 'music' ? (
                        <div className="w-5 h-5 border-2 border-[#D4A5A5] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-[#D4A5A5]" />
                          <span className="text-sm text-[#666]">음악 파일 업로드</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleMusicUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.bgMusicAutoPlay}
                    onChange={(e) => updateField('bgMusicAutoPlay', e.target.checked)}
                    className="w-5 h-5 rounded border-[#D4A5A5] text-[#D4A5A5] focus:ring-[#D4A5A5]"
                  />
                  <span className="text-sm text-[#2D2D2D]">배경음악 자동 재생</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showDday}
                    onChange={(e) => updateField('showDday', e.target.checked)}
                    className="w-5 h-5 rounded border-[#D4A5A5] text-[#D4A5A5] focus:ring-[#D4A5A5]"
                  />
                  <span className="text-sm text-[#2D2D2D]">D-Day 카운트다운 표시</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-end gap-3">
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-3 bg-gradient-to-r from-[#D4A5A5] to-[#C9A961] text-white font-semibold rounded-xl shadow-lg shadow-[#D4A5A5]/30 disabled:opacity-50"
        >
          {isLoading ? '저장 중...' : wedding ? '저장하기' : '청첩장 만들기'}
        </motion.button>
      </div>
    </form>
  );
}
