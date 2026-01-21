export type Theme = 'ROMANTIC_CLASSIC' | 'MODERN_MINIMAL' | 'BOHEMIAN_DREAM' | 'LUXURY_GOLD' | 'POETIC_LOVE' | 'SENIOR_SIMPLE' | 'FOREST_GARDEN' | 'OCEAN_BREEZE' | 'GLASS_BUBBLE' | 'SPRING_BREEZE' | 'GALLERY_MIRIM_1' | 'GALLERY_MIRIM_2';
export type MediaType = 'IMAGE' | 'VIDEO';
export type StoryType = 'PHOTO' | 'VIDEO';
export type Side = 'GROOM' | 'BRIDE';

export interface Admin {
  id: string;
  email: string;
  name: string;
}

export interface Wedding {
  id: string;
  slug: string;
  theme: Theme;
  themeColor?: string;
  isPublished: boolean;
  isArchived: boolean;
  weddingDate: string;
  weddingTime: string;
  groomName: string;
  groomNameEn?: string;
  groomPhone?: string;
  groomFatherName?: string;
  groomMotherName?: string;
  groomFatherPhone?: string;
  groomMotherPhone?: string;
  brideName: string;
  brideNameEn?: string;
  bridePhone?: string;
  brideFatherName?: string;
  brideMotherName?: string;
  brideFatherPhone?: string;
  brideMotherPhone?: string;
  showParents: boolean;
  greeting?: string;
  greetingTitle?: string;
  loveStory?: string;
  loveStoryType: StoryType;
  venue: string;
  venueHall?: string;
  venueAddress: string;
  venuePhone?: string;
  venueMapUrl?: string;
  venueNaverMap?: string;
  venueKakaoMap?: string;
  venueTmap?: string;
  venueLatitude?: number;
  venueLongitude?: number;
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
  bgMusicAutoPlay: boolean;
  showDday: boolean;
  heroMedia?: string;
  heroMediaType: MediaType;
  mainColor?: string;
  accentColor?: string;
  fontFamily?: string;
  textColor?: string;
  aiEnabled?: boolean;
  aiName?: string;
  aiMode?: string;
  aiToneStyle?: string;
  aiGroomPersonality?: string;
  aiBridePersonality?: string;
  aiSecrets?: AiSecrets;
  aiMenuInfo?: AiMenuInfo;
  aiTransportInfo?: AiTransportInfo;
  aiCustomQna?: AiQna[];
  createdAt: string;
  updatedAt: string;
  galleries?: Gallery[];
  rsvps?: Rsvp[];
  guestbooks?: Guestbook[];
  _count?: {
    rsvps: number;
    guestbooks: number;
    galleries: number;
  };
}

export interface AiSecrets {
  groomDrinkingHabit?: string;
  brideDrinkingHabit?: string;
  firstMeetStory?: string;
  proposeStory?: string;
  funnyStory?: string;
  firstImpression?: string;
}

export interface AiMenuInfo {
  menuList?: string;
  recommendation?: string;
  specialNote?: string;
}

export interface AiTransportInfo {
  parking?: string;
  publicTransport?: string;
  taxi?: string;
}

export interface AiQna {
  question: string;
  answer: string;
}

export interface Gallery {
  id: string;
  weddingId: string;
  mediaUrl: string;
  mediaType: MediaType;
  order: number;
  caption?: string;
  createdAt: string;
}

export interface Rsvp {
  id: string;
  weddingId: string;
  name: string;
  phone?: string;
  side: Side;
  attending: boolean;
  guestCount: number;
  mealCount: number;
  message?: string;
  createdAt: string;
}

export interface Guestbook {
  id: string;
  weddingId?: string;
  name: string;
  message: string;
  isHidden?: boolean;
  createdAt: string;
}

export interface RsvpStats {
  total: number;
  attending: number;
  notAttending: number;
  totalGuests: number;
  totalMeals: number;
  groomSide: number;
  brideSide: number;
}

export const THEME_NAMES: Record<Theme, string> = {
  ROMANTIC_CLASSIC: '로맨틱 클래식',
  MODERN_MINIMAL: '모던 미니멀',
  BOHEMIAN_DREAM: '보헤미안 드림',
  LUXURY_GOLD: '럭셔리 골드',
  POETIC_LOVE: '포에틱 러브',
  SENIOR_SIMPLE: '어르신용 심플',
  FOREST_GARDEN: '포레스트 가든',
  OCEAN_BREEZE: '오션 브리즈',
  GLASS_BUBBLE: '글라스 버블',
  SPRING_BREEZE: '봄바람',
  GALLERY_MIRIM_1: 'Gallery 美林-1',
  GALLERY_MIRIM_2: 'Gallery 美林-2'
};

export const THEME_COLORS: Record<Theme, { primary: string; secondary: string; accent: string; bg: string }> = {
  ROMANTIC_CLASSIC: { primary: '#D4A5A5', secondary: '#F5E6E0', accent: '#C9A961', bg: '#FDF8F3' },
  MODERN_MINIMAL: { primary: '#2D2D2D', secondary: '#F5F5F5', accent: '#000000', bg: '#FFFFFF' },
  BOHEMIAN_DREAM: { primary: '#9CAF88', secondary: '#F5E6D3', accent: '#D4A574', bg: '#FAF7F2' },
  LUXURY_GOLD: { primary: '#C9A961', secondary: '#1A1A1A', accent: '#E8D5B7', bg: '#0D0D0D' },
  POETIC_LOVE: { primary: '#C9B7E8', secondary: '#A393D3', accent: '#E5DDF5', bg: '#FBF9FD' },
  SENIOR_SIMPLE: { primary: '#1E3A5F', secondary: '#F0F4F8', accent: '#1E3A5F', bg: '#FFFEF8' },
  FOREST_GARDEN: { primary: '#5D7E5F', secondary: '#E8F0E8', accent: '#8BAD8B', bg: '#F5F9F5' },
  OCEAN_BREEZE: { primary: '#4A90A4', secondary: '#E0F0F5', accent: '#6BB5C9', bg: '#F5FAFC' },
  GLASS_BUBBLE: { primary: '#9B8EC2', secondary: '#EDE9FF', accent: '#C4B8E8', bg: '#FAFAFF' },
  SPRING_BREEZE: { primary: '#D4A0B0', secondary: '#FFF5F8', accent: '#E8B0C0', bg: '#FFF9F9' },
  GALLERY_MIRIM_1: { primary: '#111111', secondary: '#FFFFFF', accent: '#666666', bg: '#FFFFFF' },
  GALLERY_MIRIM_2: { primary: '#3f3f3f', secondary: '#FAF8F5', accent: '#C9A96E', bg: '#FAF8F5' }
};
