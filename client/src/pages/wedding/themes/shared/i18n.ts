export type Locale = 'ko' | 'en';

const dict = {
  section: {
    greeting: { ko: '인사말', en: 'Greeting' },
    ceremony: { ko: '예식 정보', en: 'Ceremony' },
    location: { ko: '오시는 길', en: 'Location' },
    rsvp: { ko: '참석 여부', en: 'RSVP' },
    gift: { ko: '축의금', en: 'Gift' },
    gallery: { ko: '갤러리', en: 'Gallery' },
    guestbook: { ko: '방명록', en: 'Guestbook' },
    closing: { ko: '마무리', en: 'Closing' },
    attendance: { ko: 'ATTENDANCE', en: 'ATTENDANCE' },
    loveStory: { ko: '러브 스토리', en: 'Love Story' },
    profile: { ko: '프로필', en: 'Profile' },
    letter: { ko: '편지', en: 'Letter' },
  },
  rsvp: {
    name: { ko: '이름', en: 'Name' },
    phone: { ko: '연락처', en: 'Phone' },
    groomSide: { ko: '신랑측', en: 'Groom' },
    brideSide: { ko: '신부측', en: 'Bride' },
    attend: { ko: '참석', en: 'Attending' },
    notAttend: { ko: '불참', en: 'Not Attending' },
    guestCount: { ko: '동반 인원', en: 'Guest Count' },
    mealCount: { ko: '식사 인원', en: 'Meal Count' },
    person: { ko: '명', en: '' },
    message: { ko: '축하 메시지 (선택)', en: 'Message (optional)' },
    submit: { ko: '참석 여부 전달하기', en: 'Submit RSVP' },
    submitted: { ko: '참석 여부가 전달되었습니다', en: 'Your RSVP has been submitted' },
    thanks: { ko: '감사합니다', en: 'Thank you' },
    includeMe: { ko: '본인 포함', en: 'Including yourself' },
  },
  guestbook: {
    name: { ko: '이름', en: 'Name' },
    nameSenior: { ko: '성함', en: 'Name' },
    password: { ko: '비밀번호', en: 'Password' },
    passwordShort: { ko: '비번', en: 'PW' },
    placeholder: { ko: '축하 메시지를 남겨주세요', en: 'Leave a congratulatory message' },
    submit: { ko: '남기기', en: 'Submit' },
    submitSenior: { ko: '방명록 남기기', en: 'Submit' },
    submitting: { ko: '등록 중...', en: 'Submitting...' },
    deleteTitle: { ko: '방명록 삭제', en: 'Delete Entry' },
    deleteDesc: { ko: '작성 시 입력한 비밀번호를 입력해주세요', en: 'Please enter the password you used when writing' },
    deleteConfirm: { ko: '삭제', en: 'Delete' },
    deleting: { ko: '삭제 중...', en: 'Deleting...' },
    cancel: { ko: '취소', en: 'Cancel' },
    deleteFail: { ko: '삭제 실패', en: 'Delete failed' },
    deleteError: { ko: '삭제 중 오류가 발생했습니다', en: 'An error occurred while deleting' },
    more: { ko: '개 더 보기', en: ' more' },
  },
  gift: {
    groomSide: { ko: '신랑측', en: "Groom's Side" },
    brideSide: { ko: '신부측', en: "Bride's Side" },
    groomFather: { ko: '신랑 아버지', en: "Groom's Father" },
    groomMother: { ko: '신랑 어머니', en: "Groom's Mother" },
    brideFather: { ko: '신부 아버지', en: "Bride's Father" },
    brideMother: { ko: '신부 어머니', en: "Bride's Mother" },
    copyAccount: { ko: '계좌번호 복사', en: 'Copy Account' },
    copied: { ko: '복사되었습니다', en: 'Copied!' },
    toss: { ko: '토스로 보내기', en: 'Send via Toss' },
    kakaoPay: { ko: '카카오페이', en: 'KakaoPay' },
    desc: { ko: '축하의 마음을 전해보세요', en: 'Send your warm wishes' },
  },
  map: {
    naverMap: { ko: '네이버 지도', en: 'Naver Map' },
    kakaoMap: { ko: '카카오맵', en: 'Kakao Map' },
    tmap: { ko: '티맵', en: 'T-map' },
    copyAddress: { ko: '주소 복사', en: 'Copy Address' },
    copied: { ko: '복사되었습니다', en: 'Copied!' },
    call: { ko: '전화', en: 'Call' },
  },
  share: {
    kakao: { ko: '카카오톡 공유', en: 'Share via KakaoTalk' },
    link: { ko: '링크 복사', en: 'Copy Link' },
    instagram: { ko: '인스타그램', en: 'Instagram' },
    copied: { ko: '링크가 복사되었습니다', en: 'Link copied!' },
  },
  calendar: {
    weekdays: {
      ko: ['일', '월', '화', '수', '목', '금', '토'],
      en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
    months: {
      ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    },
  },
  common: {
    groom: { ko: '신랑', en: 'Groom' },
    bride: { ko: '신부', en: 'Bride' },
    and: { ko: '그리고', en: 'and' },
    son: { ko: '아들', en: 'Son' },
    daughter: { ko: '딸', en: 'Daughter' },
    dday: { ko: 'D', en: 'D' },
    contact: { ko: '연락하기', en: 'Contact' },
    call: { ko: '전화하기', en: 'Call' },
    sms: { ko: '문자하기', en: 'Message' },
  },
} as const;

type Dict = typeof dict;

export function t<
  S extends keyof Dict,
  K extends keyof Dict[S]
>(section: S, key: K, locale: Locale = 'ko'): string {
  const entry = dict[section][key] as any;
  if (typeof entry === 'object' && !Array.isArray(entry)) {
    return entry[locale] || entry.ko;
  }
  return entry;
}

export function tArr<
  S extends keyof Dict,
  K extends keyof Dict[S]
>(section: S, key: K, locale: Locale = 'ko'): string[] {
  const entry = dict[section][key] as any;
  if (typeof entry === 'object' && entry[locale]) {
    return entry[locale];
  }
  return entry?.ko || [];
}

export function formatDateLocale(dateString: string, format: 'full' | 'dots' | 'short' = 'full', locale: Locale = 'ko'): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const weekdays = tArr('calendar', 'weekdays', locale);
  const weekday = weekdays[date.getDay()];
  const months = tArr('calendar', 'months', locale);

  if (locale === 'en') {
    switch (format) {
      case 'full': return `${weekday}, ${months[month]} ${day}, ${year}`;
      case 'dots': return `${String(month + 1).padStart(2, '0')}.${String(day).padStart(2, '0')}.${year}`;
      case 'short': return `${months[month].slice(0, 3)} ${day}`;
      default: return dateString;
    }
  }

  switch (format) {
    case 'full': return `${year}년 ${month + 1}월 ${day}일 ${weekday}요일`;
    case 'dots': return `${year}.${String(month + 1).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
    case 'short': return `${month + 1}월 ${day}일`;
    default: return dateString;
  }
}

export function formatTimeLocale(timeString: string | undefined, locale: Locale = 'ko'): string {
  if (!timeString) return '';
  if (locale === 'ko' && (timeString.includes('오전') || timeString.includes('오후'))) return timeString;
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours)) return timeString;

  if (locale === 'en') {
    const ampm = hours < 12 ? 'AM' : 'PM';
    const h = hours % 12 || 12;
    return minutes > 0 ? `${h}:${String(minutes).padStart(2, '0')} ${ampm}` : `${h}:00 ${ampm}`;
  }

  const period = hours < 12 ? '오전' : '오후';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${period} ${displayHours}시 ${minutes > 0 ? `${minutes}분` : ''}`.trim();
}

export function getDdayLocale(dateString: string, _locale?: Locale): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export function getGuestbookDateLocale(dateString: string, locale: Locale = 'ko'): string {
  const date = new Date(dateString);
  if (locale === 'en') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}
