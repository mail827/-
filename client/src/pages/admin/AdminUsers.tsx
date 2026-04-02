import { useState, useEffect } from 'react';
import { Search, Trash2, Mail, Crown, ShieldCheck, ArrowUpDown, ChevronDown, CreditCard, Camera, Film, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const hdr = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

interface User {
  id: string;
  email: string;
  name: string;
  provider: string;
  role: string;
  createdAt: string;
  _count?: { weddings: number; orders: number };
  archiveCount?: number;
  snapRemaining?: number;
  snapPackCount?: number;
  snapSpent?: number;
  cinemaCount?: number;
  cinemaSpent?: number;
}

interface UserOrders {
  orders: any[];
  snaps: any[];
  cinema: any[];
}

type SortKey = 'recent' | 'weddings' | 'orders' | 'snaps' | 'cinema';

const STATUS: Record<string, { label: string; color: string }> = {
  PAID: { label: '결제완료', color: '#16a34a' },
  PENDING: { label: '대기중', color: '#ca8a04' },
  CANCELLED: { label: '취소됨', color: '#dc2626' },
  REFUNDED: { label: '환불됨', color: '#78716c' },
  ANALYZING: { label: '분석중', color: '#7c3aed' },
  GENERATING: { label: '생성중', color: '#2563eb' },
  COMPOSING: { label: '편집중', color: '#0891b2' },
  COMPLETED: { label: '완료', color: '#059669' },
  FAILED: { label: '실패', color: '#dc2626' },
  DONE: { label: '완성', color: '#059669' },
};

const TIERS: Record<string, string> = {
  basic3: '3장', standard5: '5장', value10: '10장', premium20: '20장',
};

function Badge({ status }: { status: string }) {
  const s = STATUS[status] || { label: status, color: '#78716c' };
  return (
    <span className="px-1.5 py-0.5 text-[10px] rounded-full font-medium" style={{ background: s.color + '18', color: s.color }}>
      {s.label}
    </span>
  );
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}

function UserDetailPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<UserOrders | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/users/${userId}/orders`, { headers: hdr() })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="py-6 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-stone-400" /></div>;
  if (!data) return <div className="py-4 text-center text-xs text-stone-400">데이터를 불러올 수 없습니다</div>;

  const totalItems = data.orders.length + data.snaps.length + data.cinema.length;
  if (totalItems === 0) return <div className="py-4 text-center text-xs text-stone-400">결제 이력이 없습니다</div>;

  const totalPaid =
    data.orders.filter(o => o.status === 'PAID').reduce((s: number, o: any) => s + (o.amount || 0), 0) +
    data.snaps.filter(o => o.status === 'PAID').reduce((s: number, o: any) => s + (o.amount || 0), 0) +
    data.cinema.filter(o => ['PAID','ANALYZING','GENERATING','COMPOSING','COMPLETED','DONE'].includes(o.status)).reduce((s: number, o: any) => s + (o.amount || 0), 0);

  return (
    <div className="bg-stone-50/80 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-stone-500">결제 이력 {totalItems}건</span>
        <span className="text-xs font-semibold text-stone-700">총 {totalPaid.toLocaleString()}원</span>
      </div>

      {data.orders.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <CreditCard className="w-3 h-3 text-stone-400" />
            <span className="text-[10px] tracking-widest text-stone-400 uppercase">청첩장 패키지</span>
          </div>
          <div className="space-y-1">
            {data.orders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge status={o.status} />
                  <span className="text-stone-700">{o.package?.name || '-'}</span>
                  {o.wedding && <span className="text-stone-400">{o.wedding.groomName} & {o.wedding.brideName}</span>}
                </div>
                <div className="flex items-center gap-3 text-stone-500">
                  <span className="font-medium text-stone-700">{(o.amount || 0).toLocaleString()}원</span>
                  <span>{fmt(o.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.snaps.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Camera className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] tracking-widest text-violet-400 uppercase">AI 스냅</span>
          </div>
          <div className="space-y-1">
            {data.snaps.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge status={o.status} />
                  <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded text-[10px]">{TIERS[o.tier] || o.tier}</span>
                  <span className="text-stone-700">{o.concept}</span>
                  <span className="text-stone-400">{o.mode === 'couple' ? '커플' : o.mode === 'bride' ? '신부' : '신랑'}</span>
                  <span className="text-stone-400">{o.usedSnaps}/{o.totalSnaps}장</span>
                </div>
                <div className="flex items-center gap-3 text-stone-500">
                  {o.couponCode && <span className="text-amber-600">{o.couponCode}</span>}
                  <span className="font-medium text-stone-700">{(o.amount || 0).toLocaleString()}원</span>
                  <span>{fmt(o.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.cinema.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Film className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] tracking-widest text-blue-400 uppercase">웨딩시네마</span>
          </div>
          <div className="space-y-1">
            {data.cinema.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge status={o.status} />
                  <span className="text-stone-700">{o.groomName} & {o.brideName}</span>
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]">{o.mode === 'selfie' ? '셀피' : '포토'}</span>
                  {o.totalCost != null && <span className="text-stone-400">API ${o.totalCost.toFixed(2)}</span>}
                  {o.errorMsg && <span className="text-red-400 truncate max-w-[120px]">{o.errorMsg}</span>}
                </div>
                <div className="flex items-center gap-3 text-stone-500">
                  {o.couponCode && <span className="text-amber-600">{o.couponCode}</span>}
                  <span className="font-medium text-stone-700">{(o.amount || 0).toLocaleString()}원</span>
                  <span>{fmt(o.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [hideEmpty, setHideEmpty] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/admin/users`, { headers: hdr() });
      setUsers(await res.json());
    } catch (e) { console.error('Failed to fetch users:', e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(`${API}/admin/users/${userId}`, { method: 'DELETE', headers: hdr() });
      if (res.ok) { setUsers(users.filter(u => u.id !== userId)); setDeleteConfirm(null); }
    } catch (e) { console.error('Failed to delete user:', e); }
  };

  const handleGrantArchive = async (userId: string) => {
    if (!confirm('이 회원의 모든 청첩장에 영구 아카이브를 적용할까요?')) return;
    try {
      const res = await fetch(`${API}/admin/users/${userId}/grant-archive`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...hdr() }, body: '{}',
      });
      const data = await res.json();
      if (res.ok) { alert(data.message); fetchUsers(); } else { alert(data.error || '실패'); }
    } catch { alert('네트워크 오류'); }
  };

  const getActivity = (u: User) => (u._count?.weddings || 0) + (u._count?.orders || 0) + (u.snapPackCount || 0);

  const sortedUsers = [...users]
    .filter(u =>
      (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())) &&
      (!hideEmpty || getActivity(u) > 0)
    )
    .sort((a, b) => {
      switch (sortKey) {
        case 'weddings': return (b._count?.weddings || 0) - (a._count?.weddings || 0);
        case 'orders': return (b._count?.orders || 0) - (a._count?.orders || 0);
        case 'snaps': return (b.snapRemaining || 0) - (a.snapRemaining || 0);        case 'cinema': return (b.cinemaCount || 0) - (a.cinemaCount || 0);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const activeCount = users.filter(u => getActivity(u) > 0).length;

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'kakao': return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">카카오</span>;
      case 'google': return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">구글</span>;
      default: return <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full">이메일</span>;
    }
  };

  const SortButton = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => setSortKey(k)}
      className={`px-3 py-1.5 text-xs rounded-lg transition ${sortKey === k ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
    >
      {label}
    </button>
  );

  const toggleExpand = (userId: string) => {
    setExpandedUser(prev => prev === userId ? null : userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-800">회원 관리</h1>
          <p className="text-stone-500 text-sm mt-1">총 {users.length}명 / 활동 {activeCount}명</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="이름 또는 이메일로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <SortButton k="recent" label="최근 가입" />
            <SortButton k="weddings" label="청첩장순" />
            <SortButton k="orders" label="주문순" />
            <SortButton k="snaps" label="스냅순" />
            <SortButton k="cinema" label="시네마순" />
            <div className="ml-auto">
              <label className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideEmpty}
                  onChange={(e) => setHideEmpty(e.target.checked)}
                  className="rounded border-stone-300 text-stone-800 focus:ring-stone-800"
                />
                활동 있는 회원만
              </label>
            </div>
          </div>
        </div>

        <div className="divide-y divide-stone-100">
          {sortedUsers.map((user) => (
            <div key={user.id}>
              <div
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-stone-50/50 transition-colors"
                onClick={() => toggleExpand(user.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-stone-200 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-stone-600 font-medium text-sm">{user.name?.[0] || '?'}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-stone-800 text-sm">{user.name || '이름없음'}</span>
                      {user.role === 'ADMIN' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                      {getProviderBadge(user.provider)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <div className="hidden sm:flex items-center gap-3 text-xs text-stone-500">
                    <span>청첩장 {user._count?.weddings || 0}</span>
                    {(user.archiveCount || 0) > 0 && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">영구 {user.archiveCount}</span>}
                    {(user.snapPackCount || 0) > 0 && <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded">{user.snapPackCount}팩</span>}
                    {(user.snapSpent || 0) > 0 && <span>{(user.snapSpent || 0).toLocaleString()}원</span>}
                    {(user.cinemaCount || 0) > 0 && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">시네마 {user.cinemaCount}</span>}
                    <span>{fmt(user.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {user.role !== 'ADMIN' && (
                      <>
                        <button onClick={() => handleGrantArchive(user.id)} title="영구 아카이브" className="p-1.5 text-stone-300 hover:text-emerald-600 transition-colors">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirm === user.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleDelete(user.id)} className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded">OK</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-2 py-0.5 bg-stone-200 text-[10px] rounded">X</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(user.id)} className="p-1.5 text-stone-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <ChevronDown className={`w-4 h-4 text-stone-300 transition-transform ${expandedUser === user.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* 모바일 요약 */}
              <div className="sm:hidden px-4 pb-2 flex items-center gap-3 text-[10px] text-stone-400 -mt-1">
                <span>청첩장 {user._count?.weddings || 0}</span>
                <span>주문 {user._count?.orders || 0}</span>
                {(user.snapPackCount || 0) > 0 && <span>{user.snapPackCount}팩</span>}
                {(user.snapSpent || 0) > 0 && <span>{(user.snapSpent || 0).toLocaleString()}원</span>}
                    {(user.cinemaCount || 0) > 0 && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">시네마 {user.cinemaCount}</span>}
                <span>{fmt(user.createdAt)}</span>
              </div>

              {expandedUser === user.id && <UserDetailPanel userId={user.id} />}
            </div>
          ))}
        </div>

        {sortedUsers.length === 0 && (
          <div className="p-8 text-center text-stone-500">검색 결과가 없습니다</div>
        )}
      </div>
    </div>
  );
}
