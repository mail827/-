import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileHeart, Users, CreditCard, TrendingUp, Calendar, ArrowRight, Plus } from 'lucide-react';

interface Stats {
  users: number;
  weddings: number;
  orders: number;
  paidOrders: number;
  revenue: number;
}

interface RecentWedding {
  id: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  isPublished: boolean;
  theme: string;
  _count?: { rsvps: number; guestbooks: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [weddings, setWeddings] = useState<RecentWedding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [statsRes, weddingsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/weddings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      if (weddingsRes.ok) {
        const weddingsData = await weddingsRes.json();
        setWeddings(weddingsData.slice(0, 5));
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: '총 회원', value: stats?.users || 0, icon: Users, color: 'bg-blue-500' },
    { label: '청첩장', value: stats?.weddings || 0, icon: FileHeart, color: 'bg-rose-500' },
    { label: '총 주문', value: stats?.orders || 0, icon: CreditCard, color: 'bg-amber-500' },
    { label: '결제 완료', value: stats?.paidOrders || 0, icon: TrendingUp, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">관리자 대시보드</h1>
          <p className="text-stone-500 mt-1">전체 현황을 한눈에 확인하세요</p>
        </div>
        <Link to="/create">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-3 bg-stone-800 text-white font-medium rounded-xl hover:bg-stone-900 transition-all"
          >
            <Plus className="w-5 h-5" />
            새 청첩장 만들기
          </motion.button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-5 border border-stone-200"
          >
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-stone-800">
              {loading ? '-' : stat.value.toLocaleString()}
            </p>
            <p className="text-sm text-stone-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-800">총 매출</h2>
        </div>
        <p className="text-4xl font-bold text-stone-800">
          {loading ? '-' : `${(stats?.revenue || 0).toLocaleString()}원`}
        </p>
        <p className="text-sm text-stone-500 mt-2">결제 완료된 주문 기준</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-stone-800">최근 청첩장</h2>
          <Link 
            to="/admin/weddings" 
            className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 transition-colors"
          >
            전체 보기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
                <div className="w-12 h-12 bg-stone-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-stone-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-stone-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : weddings.length === 0 ? (
          <div className="text-center py-12">
            <FileHeart className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">아직 청첩장이 없어요</p>
            <Link to="/create" className="text-stone-800 text-sm hover:underline mt-2 inline-block">
              첫 청첩장을 만들어보세요 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {weddings.map((wedding, index) => (
              <motion.div
                key={wedding.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/edit/${wedding.id}`}
                  className="flex items-center gap-4 p-4 bg-stone-50 hover:bg-stone-100 rounded-xl transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center text-white font-bold">
                    {wedding.groomName?.charAt(0)}{wedding.brideName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 truncate">
                      {wedding.groomName} ♥ {wedding.brideName}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-stone-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(wedding.weddingDate).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-stone-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {wedding._count?.rsvps || 0}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      wedding.isPublished 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-stone-200 text-stone-600'
                    }`}>
                      {wedding.isPublished ? '공개' : '비공개'}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
