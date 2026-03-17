import { useState, useEffect } from 'react';
import { Clock, Archive, AlertTriangle, Infinity, ExternalLink, Search } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

interface WeddingStatus {
  id: string;
  slug: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  expiresAt: string | null;
  createdAt: string;
  status: 'active' | 'archive' | 'expired' | 'permanent';
  daysLeft: number | null;
  user: { name: string; email: string };
}

export default function AdminWeddingLifecycle() {
  const [weddings, setWeddings] = useState<WeddingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'archive' | 'expired' | 'permanent'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/admin/wedding-lifecycle`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setWeddings(await res.json());
    } catch {}
    setLoading(false);
  };

  const getStatus = (w: WeddingStatus) => {
    if (!w.expiresAt) return { label: '영구', color: '#6366f1', bg: '#eef2ff', icon: Infinity };
    const now = new Date();
    const wDate = new Date(w.weddingDate);
    const archive = new Date(wDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    if (now <= wDate) return { label: '게시중', color: '#16a34a', bg: '#f0fdf4', icon: Clock };
    if (now <= archive) return { label: '아카이브', color: '#d97706', bg: '#fffbeb', icon: Archive };
    return { label: '만료', color: '#dc2626', bg: '#fef2f2', icon: AlertTriangle };
  };

  const getDaysInfo = (w: WeddingStatus) => {
    if (!w.expiresAt) return '영구 보존';
    const now = new Date();
    const wDate = new Date(w.weddingDate);
    const archive = new Date(wDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    if (now <= wDate) {
      const days = Math.ceil((wDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `예식 D-${days}`;
    }
    if (now <= archive) {
      const days = Math.ceil((archive.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `아카이브 ${days}일 남음`;
    }
    const days = Math.ceil((now.getTime() - archive.getTime()) / (1000 * 60 * 60 * 24));
    return `만료 ${days}일 경과`;
  };

  const filtered = weddings.filter(w => {
    const s = getStatus(w);
    if (filter === 'active' && s.label !== '게시중') return false;
    if (filter === 'archive' && s.label !== '아카이브') return false;
    if (filter === 'expired' && s.label !== '만료') return false;
    if (filter === 'permanent' && s.label !== '영구') return false;
    if (search) {
      const q = search.toLowerCase();
      return w.groomName.includes(q) || w.brideName.includes(q) || w.user.email.toLowerCase().includes(q) || w.slug.includes(q);
    }
    return true;
  });

  const counts = {
    all: weddings.length,
    active: weddings.filter(w => getStatus(w).label === '게시중').length,
    archive: weddings.filter(w => getStatus(w).label === '아카이브').length,
    expired: weddings.filter(w => getStatus(w).label === '만료').length,
    permanent: weddings.filter(w => getStatus(w).label === '영구').length,
  };

  if (loading) return <div className="p-8 text-center text-stone-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">청첩장 라이프사이클</h1>
        <p className="text-sm text-stone-500 mt-1">예식일 기준 게시 → 아카이브 → 만료 상태 관리</p>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {([['all', '전체'], ['active', '게시중'], ['archive', '아카이브'], ['expired', '만료'], ['permanent', '영구']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`p-2 sm:p-3 rounded-xl text-center transition-all ${filter === key ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
            <p className="text-lg sm:text-xl font-bold">{counts[key]}</p>
            <p className="text-[10px] sm:text-xs mt-1">{label}</p>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름, 이메일, slug 검색..." className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-800" />
      </div>

      <div className="space-y-2">
        {filtered.map(w => {
          const s = getStatus(w);
          const Icon = s.icon;
          return (
            <div key={w.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 bg-white border border-stone-200 rounded-xl hover:border-stone-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg shrink-0" style={{ background: s.bg }}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm sm:text-base font-semibold text-stone-800 truncate">{w.groomName} & {w.brideName}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium shrink-0" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5 truncate">{w.user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0 sm:ml-auto">
                <div className="sm:text-right">
                  <p className="text-xs sm:text-sm font-medium text-stone-600">{getDaysInfo(w)}</p>
                  <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5">예식 {new Date(w.weddingDate).toLocaleDateString('ko-KR')}</p>
                </div>
                <a href={`/w/${w.slug}`} target="_blank" rel="noopener" className="p-2 text-stone-400 hover:text-stone-600 shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-stone-400 py-8">해당 상태의 청첩장이 없습니다</p>}
      </div>
    </div>
  );
}
