import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileHeart, Users, CreditCard, TrendingUp, Calendar, ArrowRight, Plus, BarChart3, Smartphone, Monitor, RefreshCw } from 'lucide-react';

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
        setWeddings(data.filter((w: any) => w.groomName && w.brideName).slice(0, 5));
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
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${min}m ${remaining}s`;
  };

  const fmt = (n: number) => n.toLocaleString('ko-KR');

  const getDeviceLabel = (device: string) => {
    if (device === 'mobile') return 'Mobile';
    if (device === 'desktop') return 'Desktop';
    if (device === 'tablet') return 'Tablet';
    return device;
  };

  const getDeviceIcon = (device: string) => {
    if (device === 'mobile') return Smartphone;
    return Monitor;
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.15em] text-stone-400 mb-1">OVERVIEW</p>
          <h1 className="text-xl font-bold text-stone-800">관리자 대시보드</h1>
        </div>
        <Link to="/create">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-[13px] font-medium rounded-lg hover:bg-stone-800 transition-colors">
            <Plus className="w-4 h-4" />
            새 청첩장
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: '회원', value: stats?.users || 0, icon: Users },
          { label: '청첩장', value: stats?.weddings || 0, icon: FileHeart },
          { label: '총 주문', value: stats?.orders || 0, icon: CreditCard },
          { label: '결제 완료', value: stats?.paidOrders || 0, icon: TrendingUp },
          { label: '매출', value: stats?.revenue || 0, isCurrency: true, icon: BarChart3 },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-stone-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="w-4 h-4 text-stone-400" />
              <span className="text-[10px] tracking-[0.1em] text-stone-400">{stat.label.toUpperCase()}</span>
            </div>
            <p className="text-2xl font-bold text-stone-800 tabular-nums">
              {loading ? '-' : stat.isCurrency ? `${fmt(stat.value)}` : fmt(stat.value)}
            </p>
            {stat.isCurrency && <p className="text-[11px] text-stone-400 mt-0.5">KRW</p>}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-stone-900 rounded-lg p-5 text-white"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-4 h-4 text-stone-400" />
            <div>
              <p className="text-[13px] font-medium">Google Analytics</p>
              <p className="text-[11px] text-stone-500">7-day overview</p>
            </div>
          </div>
          <button
            onClick={fetchGA4}
            disabled={ga4Loading}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-stone-400 ${ga4Loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white/[0.06] rounded-lg p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] tracking-[0.1em] text-stone-500">REALTIME</span>
            </div>
            <p className="text-xl font-bold tabular-nums">{realtime?.activeUsers || 0}</p>
          </div>
          <div className="bg-white/[0.06] rounded-lg p-3.5">
            <p className="text-[10px] tracking-[0.1em] text-stone-500 mb-2">VISITORS</p>
            <p className="text-xl font-bold tabular-nums">{ga4?.totalUsers || 0}</p>
          </div>
          <div className="bg-white/[0.06] rounded-lg p-3.5">
            <p className="text-[10px] tracking-[0.1em] text-stone-500 mb-2">PAGEVIEWS</p>
            <p className="text-xl font-bold tabular-nums">{ga4?.pageViews || 0}</p>
          </div>
          <div className="bg-white/[0.06] rounded-lg p-3.5">
            <p className="text-[10px] tracking-[0.1em] text-stone-500 mb-2">BOUNCE</p>
            <p className="text-xl font-bold tabular-nums">{ga4?.bounceRate || '0'}%</p>
          </div>
          <div className="bg-white/[0.06] rounded-lg p-3.5">
            <p className="text-[10px] tracking-[0.1em] text-stone-500 mb-2">AVG. STAY</p>
            <p className="text-xl font-bold tabular-nums">{formatDuration(ga4?.avgSessionDuration || '0')}</p>
          </div>
        </div>

        {devices.length > 0 && (
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-white/10">
            {devices.map((d) => {
              const Icon = getDeviceIcon(d.device);
              return (
                <div key={d.device} className="flex items-center gap-2 text-[12px]">
                  <Icon className="w-3.5 h-3.5 text-stone-500" />
                  <span className="text-stone-400">{getDeviceLabel(d.device)}</span>
                  <span className="font-bold tabular-nums">{d.users}</span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <div className="bg-white border border-stone-200 rounded-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <FileHeart className="w-4 h-4 text-stone-400" />
            <p className="text-[13px] font-medium text-stone-800">최근 청첩장</p>
          </div>
          <Link
            to="/admin/weddings"
            className="flex items-center gap-1 text-[12px] text-stone-400 hover:text-stone-700 transition-colors"
          >
            전체 보기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 py-3">
                <div className="w-10 h-10 bg-stone-100 rounded-lg" />
                <div className="flex-1">
                  <div className="h-3.5 bg-stone-100 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-stone-50 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : weddings.length === 0 ? (
          <div className="text-center py-16">
            <FileHeart className="w-8 h-8 text-stone-300 mx-auto mb-3" />
            <p className="text-[13px] text-stone-400">아직 청첩장이 없어요</p>
            <Link to="/create" className="text-[12px] text-stone-600 hover:underline mt-1.5 inline-block">
              첫 청첩장 만들기
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {weddings.map((wedding, index) => (
              <motion.div
                key={wedding.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link
                  to={`/edit/${wedding.id}`}
                  className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-stone-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-stone-900 flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
                    {(wedding.groomName || '')[0] || '?'}{(wedding.brideName || '')[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-stone-800 truncate">
                      {wedding.groomName || ''} & {wedding.brideName || ''}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(wedding.weddingDate).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] text-stone-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {wedding._count?.rsvps || 0}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      wedding.isPublished
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-stone-100 text-stone-500'
                    }`}>
                      {wedding.isPublished ? '공개' : '비공개'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
