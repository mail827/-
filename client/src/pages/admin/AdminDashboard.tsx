import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileHeart, Users, CreditCard, TrendingUp, Calendar, ArrowRight, Plus, BarChart3, Eye, Clock, Smartphone, Monitor, RefreshCw } from 'lucide-react';

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

interface GA4Overview {
  totalUsers: number;
  sessions: number;
  bounceRate: string;
  avgSessionDuration: string;
  pageViews: number;
  error?: string;
}

interface GA4Realtime {
  activeUsers: number;
}

interface GA4Device {
  device: string;
  users: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [weddings, setWeddings] = useState<RecentWedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [ga4, setGa4] = useState<GA4Overview | null>(null);
  const [realtime, setRealtime] = useState<GA4Realtime | null>(null);
  const [devices, setDevices] = useState<GA4Device[]>([]);
  const [ga4Loading, setGa4Loading] = useState(true);

  useEffect(() => {
    fetchData();
    fetchGA4();
    const interval = setInterval(fetchRealtime, 30000);
    return () => clearInterval(interval);
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
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (weddingsRes.ok) {
        const data = await weddingsRes.json();
        setWeddings(data.slice(0, 5));
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGA4 = async () => {
    setGa4Loading(true);
    try {
      const [overviewRes, realtimeRes, devicesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/analytics/overview`),
        fetch(`${import.meta.env.VITE_API_URL}/analytics/realtime`),
        fetch(`${import.meta.env.VITE_API_URL}/analytics/devices`),
      ]);
      if (overviewRes.ok) setGa4(await overviewRes.json());
      if (realtimeRes.ok) setRealtime(await realtimeRes.json());
      if (devicesRes.ok) {
        const data = await devicesRes.json();
        setDevices(data.devices || []);
      }
    } catch (e) {
      console.error('Failed to fetch GA4:', e);
    } finally {
      setGa4Loading(false);
    }
  };

  const fetchRealtime = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/analytics/realtime`);
      if (res.ok) setRealtime(await res.json());
    } catch (e) {
      console.error('Realtime fetch error:', e);
    }
  };

  const formatDuration = (seconds: string) => {
    const sec = parseInt(seconds);
    if (sec < 60) return `${sec}초`;
    const min = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${min}분 ${remaining}초`;
  };

  const statCards = [
    { label: '총 회원', value: stats?.users || 0, icon: Users, color: 'bg-blue-500' },
    { label: '청첩장', value: stats?.weddings || 0, icon: FileHeart, color: 'bg-rose-500' },
    { label: '총 주문', value: stats?.orders || 0, icon: CreditCard, color: 'bg-amber-500' },
    { label: '결제 완료', value: stats?.paidOrders || 0, icon: TrendingUp, color: 'bg-green-500' },
  ];

  const getDeviceIcon = (device: string) => {
    if (device === 'mobile') return Smartphone;
    if (device === 'desktop') return Monitor;
    return Monitor;
  };

  const getDeviceLabel = (device: string) => {
    if (device === 'mobile') return '모바일';
    if (device === 'desktop') return '데스크톱';
    if (device === 'tablet') return '태블릿';
    return device;
  };

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
        <h2 className="text-lg font-bold text-stone-800 mb-4">총 매출</h2>
        <p className="text-4xl font-bold text-stone-800">
          {loading ? '-' : `${(stats?.revenue || 0).toLocaleString()}원`}
        </p>
        <p className="text-sm text-stone-500 mt-2">결제 완료된 주문 기준</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Google Analytics</h2>
              <p className="text-stone-400 text-sm">최근 7일 기준</p>
            </div>
          </div>
          <button
            onClick={fetchGA4}
            disabled={ga4Loading}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${ga4Loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-stone-400">실시간</span>
            </div>
            <p className="text-2xl font-bold">{realtime?.activeUsers || 0}</p>
            <p className="text-xs text-stone-400">활성 사용자</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <Eye className="w-4 h-4 text-stone-400 mb-2" />
            <p className="text-2xl font-bold">{ga4?.totalUsers || 0}</p>
            <p className="text-xs text-stone-400">총 방문자</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <BarChart3 className="w-4 h-4 text-stone-400 mb-2" />
            <p className="text-2xl font-bold">{ga4?.pageViews || 0}</p>
            <p className="text-xs text-stone-400">페이지뷰</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <TrendingUp className="w-4 h-4 text-stone-400 mb-2" />
            <p className="text-2xl font-bold">{ga4?.bounceRate || '0'}%</p>
            <p className="text-xs text-stone-400">이탈률</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <Clock className="w-4 h-4 text-stone-400 mb-2" />
            <p className="text-2xl font-bold">{formatDuration(ga4?.avgSessionDuration || '0')}</p>
            <p className="text-xs text-stone-400">평균 체류</p>
          </div>
        </div>

        {devices.length > 0 && (
          <div className="border-t border-white/10 pt-4">
            <p className="text-sm text-stone-400 mb-3">기기별 방문자</p>
            <div className="flex gap-4">
              {devices.map((d) => {
                const Icon = getDeviceIcon(d.device);
                return (
                  <div key={d.device} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-stone-400" />
                    <span className="text-sm">{getDeviceLabel(d.device)}</span>
                    <span className="text-sm font-bold">{d.users}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

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
              첫 청첩장을 만들어보세요
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
