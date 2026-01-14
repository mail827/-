import { useState, useEffect } from 'react';
import { Search, Trash2, Calendar, CreditCard } from 'lucide-react';

interface Order {
  id: string;
  orderId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  createdAt: string;
  paidAt: string | null;
  user: { id: string; name: string; email: string };
  package: { name: string; slug: string };
  wedding: { id: string; slug: string; groomName: string; brideName: string } | null;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'CANCELLED'>('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== orderId));
        setDeleteConfirm(null);
      }
    } catch (e) {
      console.error('Failed to delete order:', e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">결제완료</span>;
      case 'PENDING': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">대기중</span>;
      case 'CANCELLED': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">취소됨</span>;
      case 'REFUNDED': return <span className="px-2 py-1 bg-stone-100 text-stone-600 text-xs rounded-full">환불됨</span>;
      default: return <span className="px-2 py-1 bg-stone-100 text-stone-600 text-xs rounded-full">{status}</span>;
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.user?.name?.includes(search) || o.user?.email?.includes(search) || o.orderId?.includes(search);
    const matchFilter = filter === 'ALL' || o.status === filter;
    return matchSearch && matchFilter;
  });

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
          <h1 className="text-xl sm:text-2xl font-bold text-stone-800">주문 내역</h1>
          <p className="text-stone-500 text-sm mt-1">총 {orders.length}건의 주문</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="이름, 이메일, 주문번호 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['ALL', 'PAID', 'PENDING', 'CANCELLED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap ${
                  filter === f ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {f === 'ALL' ? '전체' : f === 'PAID' ? '결제완료' : f === 'PENDING' ? '대기중' : '취소됨'}
              </button>
            ))}
          </div>
        </div>

        {/* 모바일: 카드 형식 */}
        <div className="md:hidden divide-y divide-stone-100">
          {filteredOrders.map((order) => (
            <div key={order.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-stone-800">{order.user?.name || '이름없음'}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">{order.user?.email}</p>
                </div>
                <button
                  onClick={() => setDeleteConfirm(order.id)}
                  className="p-2 text-stone-400 hover:text-red-500 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-600 mb-2">
                <CreditCard className="w-4 h-4" />
                <span>{order.package?.name}</span>
                <span className="font-medium">{order.amount?.toLocaleString()}원</span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>#{order.orderId?.slice(-8)}</span>
                <span>{new Date(order.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              {deleteConfirm === order.id && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700 mb-2">정말 삭제하시겠습니까?</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(order.id)} className="px-3 py-1 bg-red-500 text-white text-sm rounded">삭제</button>
                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 bg-stone-200 text-stone-700 text-sm rounded">취소</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 데스크탑: 테이블 형식 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">주문번호</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">고객</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">패키지</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">금액</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">주문일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50">
                  <td className="px-4 py-4 text-sm text-stone-600 font-mono">#{order.orderId?.slice(-8)}</td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-stone-800">{order.user?.name || '이름없음'}</p>
                      <p className="text-sm text-stone-500">{order.user?.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-stone-600">{order.package?.name}</td>
                  <td className="px-4 py-4 font-medium text-stone-800">{order.amount?.toLocaleString()}원</td>
                  <td className="px-4 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm text-stone-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {deleteConfirm === order.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDelete(order.id)} className="px-2 py-1 bg-red-500 text-white text-xs rounded">삭제</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-stone-200 text-stone-600 text-xs rounded">취소</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(order.id)} className="p-2 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-stone-500">
            {search || filter !== 'ALL' ? '검색 결과가 없습니다' : '주문 내역이 없습니다'}
          </div>
        )}
      </div>
    </div>
  );
}
