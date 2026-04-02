import { useState, useEffect } from 'react';
import { Search, Trash2, Mail, Calendar, Crown, ShieldCheck, ArrowUpDown } from 'lucide-react';

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
}

type SortKey = 'recent' | 'weddings' | 'orders' | 'snaps';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [hideEmpty, setHideEmpty] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        setDeleteConfirm(null);
      }
    } catch (e) {
      console.error('Failed to delete user:', e);
    }
  };

  const handleGrantShieldCheck = async (userId: string) => {
    if (!confirm('이 회원의 모든 청첩장에 영구 아카이브를 적용할까요?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}/grant-archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.error || '실패');
      }
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
        case 'snaps': return (b.snapRemaining || 0) - (a.snapRemaining || 0);
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

        <div className="md:hidden divide-y divide-stone-100">
          {sortedUsers.map((user) => (
            <div key={user.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-stone-600 font-medium">{user.name?.[0] || '?'}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-stone-800">{user.name || '이름없음'}</span>
                      {user.role === 'ADMIN' && <Crown className="w-4 h-4 text-amber-500" />}
                      {getProviderBadge(user.provider)}
                    </div>
                    <p className="text-sm text-stone-500 truncate">{user.email}</p>
                  </div>
                </div>
                {user.role !== 'ADMIN' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleGrantShieldCheck(user.id)} className="p-2 text-stone-400 hover:text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(user.id)} className="p-2 text-stone-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-stone-500">
                <span>청첩장 {user._count?.weddings || 0}</span>
                <span>영구 {user.archiveCount || 0}</span>
                <span>스냅 {user.snapPackCount || 0}팩</span>
                <span>주문 {user._count?.orders || 0}</span>
                {(user.snapSpent || 0) > 0 && <span>{(user.snapSpent || 0).toLocaleString()}원</span>}
                <span>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              {deleteConfirm === user.id && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700 mb-2">정말 삭제하시겠습니까?</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(user.id)} className="px-3 py-1 bg-red-500 text-white text-sm rounded">삭제</button>
                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 bg-stone-200 text-stone-700 text-sm rounded">취소</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">회원</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">가입방법</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">청첩장</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">영구</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">AI스냅</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">스냅매출</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">주문</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">가입일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center">
                        <span className="text-stone-600 font-medium">{user.name?.[0] || '?'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-800">{user.name || '이름없음'}</span>
                          {user.role === 'ADMIN' && <Crown className="w-4 h-4 text-amber-500" />}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-stone-500">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{getProviderBadge(user.provider)}</td>
                  <td className="px-4 py-4 text-stone-600">{user._count?.weddings || 0}개</td>
                  <td className="px-4 py-4">
                    {(user.archiveCount || 0) > 0
                      ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">{user.archiveCount}개</span>
                      : <span className="text-stone-400 text-sm">0</span>
                    }
                  </td>
                  <td className="px-4 py-4">
                    {(user.snapPackCount || 0) > 0
                      ? <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">{user.snapPackCount}팩</span>
                      : <span className="text-stone-400 text-sm">0</span>
                    }
                  </td>
                  <td className="px-4 py-4">
                    {(user.snapSpent || 0) > 0
                      ? <span className="text-stone-600 text-sm">{(user.snapSpent || 0).toLocaleString()}원</span>
                      : <span className="text-stone-400 text-sm">-</span>
                    }
                  </td>
                  <td className="px-4 py-4 text-stone-600">{user._count?.orders || 0}개</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm text-stone-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {user.role !== 'ADMIN' ? (
                      deleteConfirm === user.id ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDelete(user.id)} className="px-2 py-1 bg-red-500 text-white text-xs rounded">삭제</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-stone-200 text-stone-600 text-xs rounded">취소</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleGrantShieldCheck(user.id)} title="영구 아카이브 선물" className="p-2 text-stone-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50">
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(user.id)} className="p-2 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-stone-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedUsers.length === 0 && (
          <div className="p-8 text-center text-stone-500">
            검색 결과가 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
