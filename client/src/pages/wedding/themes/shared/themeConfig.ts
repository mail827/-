export interface ThemeConfig {
  name: string;
  hidden?: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textMuted: string;
    background: string;
    card: string;
    border: string;
  };
  photoFilter: {
    transformation: string;
    label: string;
  };
}

export const themeConfigs: Record<string, ThemeConfig> = {
  ROMANTIC_CLASSIC: {
    name: '로맨틱 클래식',
    colors: {
      primary: '#B8A088',
      secondary: '#FAF8F5',
      accent: '#2C2620',
      text: '#2C2620',
      textMuted: '#8A7E72',
      background: '#FAF8F5',
      card: '#FFFDF9',
      border: '#E8E2DA',
    },
    photoFilter: {
      transformation: 'e_saturation:5,e_warmth:15,e_vibrance:8',
      label: '내추럴 웜',
    },
  },
  MODERN_MINIMAL: {
    name: '모던 미니멀',
    colors: {
      primary: '#1A1A1A',
      secondary: '#F5F5F5',
      accent: '#666666',
      text: '#1A1A1A',
      textMuted: '#888888',
      background: '#FFFFFF',
      card: '#FAFAFA',
      border: '#E5E5E5',
    },
    photoFilter: {
      transformation: 'e_saturation:-20,e_contrast:10,e_sharpen:50',
      label: '모노톤 샤프',
    },
  },
  BOHEMIAN_DREAM: {
    name: '보헤미안 드림',
    colors: {
      primary: '#C9A87C',
      secondary: '#F5EDE4',
      accent: '#8B6F47',
      text: '#5C4A32',
      textMuted: '#9A8B7A',
      background: '#FAF6F1',
      card: '#FFFDF9',
      border: '#E6DDD0',
    },
    photoFilter: {
      transformation: 'e_sepia:20,e_saturation:-10,e_warmth:30,e_vignette:20',
      label: '빈티지 웜',
    },
  },
  LUXURY_GOLD: {
    name: '럭셔리 골드',
    colors: {
      primary: '#C9A96E',
      secondary: '#1A1A1A',
      accent: '#D4AF37',
      text: '#2C2C2C',
      textMuted: '#8B7355',
      background: '#0D0D0D',
      card: '#1A1A1A',
      border: '#3D3D3D',
    },
    photoFilter: {
      transformation: 'e_saturation:15,e_warmth:25,co_rgb:D4AF37,e_colorize:5',
      label: '골드 글로우',
    },
  },
  POETIC_LOVE: {
    name: '포에틱 러브',
    hidden: true,
    colors: {
      primary: '#B8A0C8',
      secondary: '#F8F5FA',
      accent: '#9B7BB0',
      text: '#4A4055',
      textMuted: '#8A7A95',
      background: '#FDFCFE',
      card: '#FFFFFF',
      border: '#E8E0ED',
    },
    photoFilter: {
      transformation: 'e_saturation:-5,e_tint:20:purple:white,e_vibrance:15',
      label: '소프트 퍼플',
    },
  },
  SENIOR_SIMPLE: {
    name: '어르신용 심플',
    colors: {
      primary: '#5C5C5C',
      secondary: '#F8F8F8',
      accent: '#8B4513',
      text: '#333333',
      textMuted: '#777777',
      background: '#FFFFFF',
      card: '#FAFAFA',
      border: '#E0E0E0',
    },
    photoFilter: {
      transformation: 'e_sharpen:80,e_contrast:15,e_brightness:5',
      label: '선명하게',
    },
  },
  FOREST_GARDEN: {
    name: '포레스트 가든',
    colors: {
      primary: '#5C6B54',
      secondary: '#F4F7F2',
      accent: '#3D5A3D',
      text: '#3A4A3A',
      textMuted: '#6B7B6B',
      background: '#F9FBF8',
      card: '#FFFFFF',
      border: '#D8E4D4',
    },
    photoFilter: {
      transformation: 'e_saturation:10,co_rgb:5C6B54,e_colorize:8,e_vibrance:20',
      label: '내추럴 그린',
    },
  },
  OCEAN_BREEZE: {
    name: '오션 브리즈',
    colors: {
      primary: '#5B8FA8',
      secondary: '#F0F7FA',
      accent: '#3D7A9E',
      text: '#2C4A5A',
      textMuted: '#6A8A9A',
      background: '#F8FCFD',
      card: '#FFFFFF',
      border: '#D0E4EC',
    },
    photoFilter: {
      transformation: 'e_saturation:5,e_blue:15,e_vibrance:15,e_brightness:5',
      label: '쿨 브리즈',
    },
  },
  GLASS_BUBBLE: {
    name: '글라스 버블',
    colors: {
      primary: '#A89ED0',
      secondary: '#F5F3FA',
      accent: '#8B80B8',
      text: '#4A4560',
      textMuted: '#8A85A0',
      background: '#FAF9FC',
      card: 'rgba(255,255,255,0.7)',
      border: '#E0DCF0',
    },
    photoFilter: {
      transformation: 'e_saturation:-10,e_brightness:10,e_vibrance:10,e_blur:100',
      label: '드리미 글래스',
    },
  },
  SPRING_BREEZE: {
    name: '봄바람',
    hidden: true,
    colors: {
      primary: '#E8B4C8',
      secondary: '#FDF5F8',
      accent: '#C890A8',
      text: '#5A4550',
      textMuted: '#9A8590',
      background: '#FFFAFC',
      card: '#FFFFFF',
      border: '#F0E0E8',
    },
    photoFilter: {
      transformation: 'e_saturation:15,e_tint:10:pink:white,e_vibrance:20,e_brightness:5',
      label: '체리블로썸',
    },
  },
  GALLERY_MIRIM_1: {
    name: '美林 갤러리 1',
    colors: {
      primary: '#9A8A74',
      secondary: '#F7F5F2',
      accent: '#7A6A54',
      text: '#4A4238',
      textMuted: '#8A8070',
      background: '#FDFCFA',
      card: '#FFFFFF',
      border: '#E8E4DC',
    },
    photoFilter: {
      transformation: 'e_saturation:-15,e_contrast:5,e_warmth:10',
      label: '필름 무드',
    },
  },
  GALLERY_MIRIM_2: {
    name: '美林 갤러리 2',
    colors: {
      primary: '#6A7B70',
      secondary: '#F5F7F5',
      accent: '#4A5B50',
      text: '#3A4A40',
      textMuted: '#7A8A80',
      background: '#FAFCFA',
      card: '#FFFFFF',
      border: '#DCE4DC',
    },
    photoFilter: {
      transformation: 'e_saturation:-20,e_contrast:10,e_grayscale,e_colorize:15,co_rgb:6A7B70',
      label: '시네마틱',
    },
  },
  LUNA_HALFMOON: {
    name: 'Luna Halfmoon',
    colors: {
      primary: '#C5D4DE',
      secondary: '#FAFCFD',
      accent: '#A8BDC9',
      text: '#5A6A74',
      textMuted: '#8A9AA4',
      background: '#FFFFFF',
      card: '#FAFCFD',
      border: '#E8EEF2',
    },
    photoFilter: {
      transformation: 'e_saturation:-25,e_brightness:8,e_contrast:-5,e_blue:5',
      label: '수면 위 달빛',
    },
  },
  PEARL_DRIFT: {
    name: 'Pearl Drift',
    colors: {
      primary: '#E3EBF3',
      secondary: '#0A0A0A',
      accent: '#C8D8E8',
      text: '#E8EEF2',
      textMuted: '#8A9AA8',
      background: '#050505',
      card: '#0A0A0A',
      border: '#1A1A1A',
    },
    photoFilter: {
      transformation: 'e_saturation:-30,e_contrast:15,e_brightness:-5,e_blue:8',
      label: '심해 진주빛',
    },
  },
  BOTANICAL_CLASSIC: {
    name: '보태니컬 클래식',
    colors: {
          "primary": "#6B8F5B",
          "secondary": "#F4F1E8",
          "accent": "#3D5A32",
          "text": "#3A3A32",
          "textMuted": "#7A7A6A",
          "background": "#F4F1E8",
          "card": "#FAFAF2",
          "border": "#D8D4C4"
    },
    photoFilter: {
      transformation: 'e_saturation:5,e_warmth:15,e_vibrance:10,co_rgb:6B8F5B,e_colorize:3',
      label: '보태니컬 그린',
    },
  },
  HEART_MINIMAL: {
    name: '하트 미니멀',
    colors: {
          "primary": "#D4956A",
          "secondary": "#FDF5ED",
          "accent": "#C07B52",
          "text": "#4A3828",
          "textMuted": "#8A7A6A",
          "background": "#FDF5ED",
          "card": "#FFFAF5",
          "border": "#E8DDD0"
    },
    photoFilter: {
      transformation: 'e_saturation:8,e_warmth:25,e_vibrance:12',
      label: '워피치 웜',
    },
  },
  WAVE_BORDER: {
    hidden: true,
    name: '웨이브 보더',
    colors: {
          "primary": "#8B7355",
          "secondary": "#F5F0E8",
          "accent": "#6B5A42",
          "text": "#3C3428",
          "textMuted": "#7A6F60",
          "background": "#F5F0E8",
          "card": "#FAF8F2",
          "border": "#DDD5C8"
    },
    photoFilter: {
      transformation: 'e_saturation:-5,e_warmth:20,e_sepia:8,e_vibrance:8',
      label: '빈티지 웜브라운',
    },
  },
  CRUISE_DAY: {
    name: '크루즈 데이',
    colors: {
      primary: '#3B7DD8',
      secondary: '#F5F8FA',
      accent: '#1A2B3A',
      text: '#1A2B3A',
      textMuted: '#6B8299',
      background: '#F5F8FA',
      card: '#FFFFFF',
      border: '#D8E4EE',
    },
    photoFilter: {
      transformation: 'e_saturation:5,e_vibrance:10,e_blue:10',
      label: '쿨 블루',
    },
  },
  CRUISE_SUNSET: {
    name: '크루즈 선셋',
    colors: {
      primary: '#D4A054',
      secondary: '#1A1714',
      accent: '#E8DFD4',
      text: '#E8DFD4',
      textMuted: '#9E8E7A',
      background: '#0D0B09',
      card: '#1A1714',
      border: '#2E2720',
    },
    photoFilter: {
      transformation: 'e_saturation:10,e_warmth:25,e_sepia:10',
      label: '골든 선셋',
    },
  },
  VOYAGE_BLUE: {
    hidden: true,
    name: '보야지 블루',
    colors: {
      primary: '#1A365D',
      secondary: '#F9F7F2',
      accent: '#8E9775',
      text: '#2C3E50',
      textMuted: '#6B7B8D',
      background: '#F9F7F2',
      card: '#FFFFFF',
      border: '#D1D1D1',
    },
    photoFilter: {
      transformation: 'e_saturation:5,e_vibrance:10,e_blue:5',
      label: '쿨 네이비',
    },
  },
  EDITORIAL: {
    name: '에디토리얼',
    colors: {
      primary: '#0e0e0e',
      secondary: '#f0f0f0',
      accent: '#f0f0f0',
      text: '#f0f0f0',
      textMuted: '#888888',
      background: '#0e0e0e',
      card: '#1a1a1a',
      border: '#333333',
    },
    photoFilter: {
      transformation: 'e_contrast:10,e_saturation:-10',
      label: '하이 콘트라스트',
    },
  },
};

export function applyPhotoFilter(imageUrl: string, theme: string): string {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }
  
  const config = themeConfigs[theme];
  if (!config) return imageUrl;
  
  const transformation = config.photoFilter.transformation;
  
  if (imageUrl.includes('/upload/')) {
    return imageUrl.replace('/upload/', `/upload/${transformation},q_auto,f_auto/`);
  }
  
  return imageUrl;
}

export function getThemeColors(theme: string) {
  return themeConfigs[theme]?.colors || themeConfigs.ROMANTIC_CLASSIC.colors;
}

export function getThemeConfig(theme: string) {
  return themeConfigs[theme] || themeConfigs.ROMANTIC_CLASSIC;
}
