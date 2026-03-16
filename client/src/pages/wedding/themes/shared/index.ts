export { default as RsvpForm } from './RsvpForm';
export { default as GuestbookForm } from './GuestbookForm';
export { default as GuestbookList } from './GuestbookList';
export { default as GalleryModal } from './GalleryModal';
export { default as KakaoMap } from './KakaoMap';
export { default as ShareModal } from './ShareModal';
export { default as PolaroidGallery } from './PolaroidGallery';
export { default as GalleryOverride } from './GalleryOverride';
export { default as VenueDetailTabs } from './VenueDetailTabs';
export { default as VenueTabsOverride } from './VenueTabsOverride';
export { default as ProfileSection } from './ProfileSection';
export { default as ProfileOverride } from './ProfileOverride';
export { default as LetterSection } from './LetterSection';
export { default as LetterOverride } from './LetterOverride';



export interface WeddingData {
  id: string;
  theme: string;
  slug: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  weddingTime: string;
  venue: string;
  venueHall?: string;
  venueAddress: string;
  venuePhone?: string;
  venueNaverMap?: string;
  venueKakaoMap?: string;
  venueTmap?: string;
  venueLatitude?: number;
  venueLongitude?: number;
  heroMedia?: string;
  heroMediaType?: 'IMAGE' | 'VIDEO';
  heroImagePosition?: string;
  greeting?: string;
  greetingTitle?: string;
  showParents?: boolean;
  groomFatherName?: string;
  groomMotherName?: string;
  brideFatherName?: string;
  brideMotherName?: string;
  groomPhone?: string;
  bridePhone?: string;
  groomAccount?: string;
  groomBank?: string;
  groomAccountHolder?: string;
  brideAccount?: string;
  brideBank?: string;
  brideAccountHolder?: string;
  groomFatherAccount?: string;
  groomFatherBank?: string;
  groomFatherAccountHolder?: string;
  groomMotherAccount?: string;
  groomMotherBank?: string;
  groomMotherAccountHolder?: string;
  brideFatherAccount?: string;
  brideFatherBank?: string;
  brideFatherAccountHolder?: string;
  brideMotherAccount?: string;
  brideMotherBank?: string;
  brideMotherAccountHolder?: string;
  tossLink?: string;
  kakaoPayLink?: string;
  closingMessage?: string;
  bgMusicUrl?: string;
  loveStoryVideo?: string;
  usePhotoFilter?: boolean;
  bgMusicAutoPlay?: boolean;
  showDday?: boolean;
  themeColor?: string;
  galleries?: { id: string;
  theme: string; mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO'; order: number; }[];
  sectionOrder?: string[];
  galleryRatio?: string;
  heroTextPosition?: string;
  heroScriptFont?: string;
  heroLayout?: string;
  galleryLayout?: string;
  groomIntro?: string;
  brideIntro?: string;
  groomProfileUrl?: string;
  brideProfileUrl?: string;
  groomLetter?: string;
  brideLetter?: string;
  groomLetterImage?: string;
  brideLetterImage?: string;
  showLetter?: boolean;
  envelopeEnabled?: boolean;
  envelopeStyle?: string;
  envelopeCardText?: string;
  envelopeCardColor?: string;
  showProfile?: boolean;
  venueDetailTabs?: { title: string; image?: string; content: string }[];
  ogCoverType?: string;
  ogCustomTitle?: string;
  ogCustomImage?: string;
}

export interface GuestbookData {
  id: string;
  theme: string;
  name: string;
  message: string;
  createdAt: string;
}

export interface RsvpData {
  name: string;
  phone: string;
  attending: boolean;
  guestCount: number;
  message?: string;
}

export interface GuestbookSubmitData {
  name: string;
  password: string;
  message: string;
}

export interface ThemeProps {
  wedding: WeddingData;
  guestbooks?: GuestbookData[];
  onRsvpSubmit: (data: RsvpData) => Promise<void>;
  onGuestbookSubmit: (data: GuestbookSubmitData) => Promise<void>;
  isRsvpLoading: boolean;
  isGuestbookLoading: boolean;
  guestPhotoSlot?: React.ReactNode;
  gallerySlot?: React.ReactNode;
}

export function formatDate(dateString: string, format: 'korean' | 'dots' | 'short' = 'korean'): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  switch (format) {
    case 'korean': return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
    case 'dots': return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
    case 'short': return `${month}월 ${day}일`;
    default: return dateString;
  }
}

export function formatTime(timeString?: string): string {
  if (timeString && (timeString.includes('오전') || timeString.includes('오후'))) return timeString;
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours < 12 ? '오전' : '오후';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${period} ${displayHours}시 ${minutes > 0 ? `${minutes}분` : ''}`.trim();
}

export function getDday(dateString: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export function getCalendarData(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const targetDay = date.getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const lastDate = new Date(year, month, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = new Array(firstDay).fill(null);
  for (let d = 1; d <= lastDate; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }
  return { year, month, targetDay, weeks };
}

export const SENIOR_COLORS = [
  { name: '남색', value: '#1E3A5F' },
  { name: '앰버', value: '#B45309' },
  { name: '로즈', value: '#BE123C' },
  { name: '그린', value: '#15803D' },
  { name: '퍼플', value: '#7C3AED' },
  { name: '브라운', value: '#78350F' },
];
export * from './themeConfig';
