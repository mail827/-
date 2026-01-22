import type { Wedding } from '../../../../types';

export function formatDate(dateStr: string, format: 'full' | 'short' | 'korean' | 'dots' = 'korean') {
  const date = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = days[date.getDay()];
  
  switch (format) {
    case 'korean':
      return `${year}년 ${month}월 ${day}일 ${dayName}요일`;
    case 'short':
      return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
    case 'dots':
      return `${year}. ${month}. ${day}.`;
    case 'full':
      return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    default:
      return `${year}년 ${month}월 ${day}일`;
  }
}

export function formatTime(timeStr: string) {
  if (!timeStr || !timeStr.includes(':')) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours)) return '';
  const ampm = hours >= 12 ? '오후' : '오전';
  const h = hours % 12 || 12;
  return `${ampm} ${h}시${minutes > 0 ? ` ${minutes}분` : ''}`;
}

export function getDday(dateStr: string) {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export function getCalendarData(dateStr: string) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const targetDay = date.getDate();
  
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];
  
  for (let i = 0; i < firstDay; i++) {
    week.push(null);
  }
  
  for (let day = 1; day <= lastDate; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  
  return { year, month: month + 1, targetDay, weeks };
}

export interface ThemeProps {
  wedding: Wedding;
  guestbooks: any[];
  onRsvpSubmit: (data: any) => void;
  onGuestbookSubmit: (data: any) => void;
  isRsvpLoading: boolean;
  isGuestbookLoading: boolean;
  refetchGuestbook: () => void;
}
