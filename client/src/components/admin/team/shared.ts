export const API = import.meta.env.VITE_API_URL;

export const CATEGORIES: Record<string, { label: string; color: string }> = {
  sns: { label: 'SNS', color: 'bg-pink-50 text-pink-600' },
  blog: { label: '블로그', color: 'bg-blue-50 text-blue-600' },
  viral: { label: '바이럴', color: 'bg-purple-50 text-purple-600' },
  cs: { label: 'CS', color: 'bg-amber-50 text-amber-700' },
  dev: { label: '개발', color: 'bg-emerald-50 text-emerald-600' },
  marketing: { label: '마케팅', color: 'bg-orange-50 text-orange-600' },
  ai: { label: 'AI', color: 'bg-cyan-50 text-cyan-600' },
  biz: { label: '사업', color: 'bg-stone-100 text-stone-600' },
};

export interface TeamTask {
  id: string; weekId: string; assignee: string; category: string;
  title: string; target: number | null; done: number; checked: boolean; sortOrder: number;
}

export interface TeamLog {
  id: string; userId: string; userName: string; date: string; content: string; note: string | null;
}

export interface TeamNotice {
  id: string; content: string; createdAt: string;
}

export interface TeamFocusItem {
  id: string; weekId: string; priority: number; title: string;
  assignee: string; deadline: string | null; done: boolean;
}

export function getWeekId(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  const day = d.getDay();
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (day === 0 ? 6 : day - 1));
  const jan1 = new Date(monday.getFullYear(), 0, 1);
  const diff = Math.floor((monday.getTime() - jan1.getTime()) / 86400000);
  const weekNum = Math.floor(diff / 7) + 1;
  return monday.getFullYear() + '-W' + String(weekNum).padStart(2, '0');
}

export function getDateStr(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일','월','화','수','목','금','토'];
  return (d.getMonth() + 1) + '/' + d.getDate() + ' (' + days[d.getDay()] + ')';
}

export function isOwner(): boolean {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return ['oicrcutie@gmail.com','gah7186@naver.com','lovegah2010@daum.net','gah7186@gmail.com'].includes(payload.email);
  } catch { return false; }
}

export function getHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
}

export function calcRate(list: TeamTask[]): number {
  if (list.length === 0) return 0;
  const completed = list.filter((t) => (t.target ? t.done >= t.target : t.checked)).length;
  return Math.round((completed / list.length) * 100);
}

export function getCurrentMonth(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

export function weekIdToRange(weekId: string): string {
  const [yearStr, wStr] = weekId.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  const jan1 = new Date(year, 0, 1);
  const jan1Day = jan1.getDay();
  const mondayOffset = (jan1Day <= 1 ? 1 - jan1Day : 8 - jan1Day);
  const w1Monday = new Date(year, 0, 1 + mondayOffset);
  const monday = new Date(w1Monday.getTime() + (week - 1) * 7 * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const fmt = (d: Date) => (d.getMonth() + 1) + '/' + d.getDate();
  return fmt(monday) + ' ~ ' + fmt(sunday);
}
