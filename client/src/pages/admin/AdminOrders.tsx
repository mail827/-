import { useState, useEffect } from 'react';
import { Search, Trash2, CreditCard, Camera, Film, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('token');
const headers = () => ({ Authorization: `Bearer ${token()}` });

type Tab = 'package' | 'snap' | 'cinema';
type StatusFilter = 'ALL' | 'PENDING' | 'PAID' | 'CANCELLED';

interface PkgOrder {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  user: { id: string; name: string; email: string };
  package: { name: string; slug: string };
  wedding: { id: string; slug: string; groomName: string; brideName: string } | null;
}

interface SnapOrder {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  tier: string;
  concept: string;
  mode: string;
  totalSnaps: number;
  usedSnaps: number;
  couponCode: string | null;
  paidAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface CinemaOrder {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  mode: string;
  groomName: string;
  brideName: string;
  templateId: string;
  totalCost: number | null;
  couponCode: string | null;
  paymentKey: string | null;
  paidAt: string | null;
  errorMsg: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
}

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
    <span
      className="px-2 py-0.5 text-xs rounded-full font-medium"
      style={{ background: s.color + '18', color: s.color }}
    >
      {s.label}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}

function formatAmount(n: number) {
  return n.toLocaleString() + '\uC6D0';
}

export default function AdminOrders() {
  const [tab, setTab] = useState<Tab>('package');
  const [pkgOrders, setPkgOrders] = useState<PkgOrder[]>([]);
  const [snapOrders, setSnapOrders] = useState<SnapOrder[]>([]);
  const [cinemaOrders, setCinemaOrders] = useState<CinemaOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, s, c] = await Promise.all([
        fetch(`${API}/admin/orders`, { headers: headers() }).then(r => r.json()),
        fetch(`${API}/admin/snap-orders`, { headers: headers() }).then(r => r.json()),
        fetch(`${API}/admin/cinema-orders`, { headers: headers() }).then(r => r.json()),
      ]);
      setPkgOrders(p);
      setSnapOrders(s);
      setCinemaOrders(c);
    } catch (e) {
      console.error('load orders error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API}/admin/orders/${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok) {
        setPkgOrders(prev => prev.filter(o => o.id !== id));
        setDeleteConfirm(null);
      }
    } catch (e) {
      console.error('delete error:', e);
    }
  };

  const paidPkg = pkgOrders.filter(o => o.status === 'PAID');
  const paidSnap = snapOrders.filter(o => o.status === 'PAID');
  const paidCinema = cinemaOrders.filter(o => ['PAID','ANALYZING','GENERATING','COMPOSING','COMPLETED','DONE'].includes(o.status));

  const totalRevenue =
    paidPkg.reduce((s, o) => s + o.amount, 0) +
    paidSnap.reduce((s, o) => s + o.amount, 0) +
    paidCinema.reduce((s, o) => s + o.amount, 0);

  const tabs: { key: Tab; label: string; icon: typeof CreditCard; count: number; paid: number }[] = [
    { key: 'package', label: '\uCCAD\uCCA9\uC7A5', icon: CreditCard, count: pkgOrders.length, paid: paidPkg.length },
    { key: 'snap', label: 'AI\uC2A4\uB0C5', icon: Camera, count: snapOrders.length, paid: paidSnap.length },
    { key: 'cinema', label: '\uC6E8\uB529\uC2DC\uB124\uB9C8', icon: Film, count: cinemaOrders.length, paid: paidCinema.length },
  ];

  const matchSearch = (texts: (string | undefined | null)[]) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return texts.some(t => t?.toLowerCase().includes(q));
  };

  const matchFilter = (status: string) => {
    if (filter === 'ALL') return true;
    if (filter === 'PAID') return ['PAID', 'ANALYZING', 'GENERATING', 'COMPOSING', 'COMPLETED'].includes(status);
    return status === filter;
  };

  const filteredPkg = pkgOrders.filter(o => matchSearch([o.user?.name, o.user?.email, o.orderId]) && matchFilter(o.status));
  const filteredSnap = snapOrders.filter(o => matchSearch([o.user?.name, o.user?.email, o.orderId, o.concept]) && matchFilter(o.status));
  const filteredCinema = cinemaOrders.filter(o => matchSearch([o.user?.name, o.user?.email, o.orderId, o.groomName, o.brideName]) && matchFilter(o.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-800">
          {'\uC8FC\uBB38 \uB0B4\uC5ED'}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {'\uCD1D \uB9E4\uCD9C'} {formatAmount(totalRevenue)} / {'\uACB0\uC81C \uC644\uB8CC'} {paidPkg.length + paidSnap.length + paidCinema.length}{'\uAC74'}
        </p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setFilter('ALL'); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                active ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              <span className={`text-xs ${active ? 'text-stone-300' : 'text-stone-400'}`}>
                {t.paid}/{t.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder={
                tab === 'package' ? '\uC774\uB984, \uC774\uBA54\uC77C, \uC8FC\uBB38\uBC88\uD638...' :
                tab === 'snap' ? '\uC774\uB984, \uC774\uBA54\uC77C, \uCEE8\uC149...' :
                '\uC774\uB984, \uC774\uBA54\uC77C, \uC2E0\uB791\uC2E0\uBD80...'
              }
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {(['ALL', 'PAID', 'PENDING', 'CANCELLED'] as StatusFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  filter === f ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                }`}
              >
                {f === 'ALL' ? '\uC804\uCCB4' : f === 'PAID' ? '\uACB0\uC81C\uC644\uB8CC' : f === 'PENDING' ? '\uB300\uAE30\uC911' : '\uCDE8\uC18C'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'package' && (
          <div className="divide-y divide-stone-50">
            {filteredPkg.length === 0 ? (
              <div className="p-12 text-center text-sm text-stone-400">
                {search || filter !== 'ALL' ? '\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4' : '\uCCAD\uCCA9\uC7A5 \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}
              </div>
            ) : filteredPkg.map(o => (
              <div key={o.id} className="px-4 py-3 hover:bg-stone-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-stone-800">{o.user?.name || '-'}</span>
                        <Badge status={o.status} />
                        <span className="text-xs text-stone-400 font-mono">#{o.orderId?.slice(-8)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                        <span>{o.user?.email}</span>
                        <span>{o.package?.name}</span>
                        {o.wedding && <span>{o.wedding.groomName} & {o.wedding.brideName}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-stone-800">{formatAmount(o.amount)}</p>
                      <p className="text-xs text-stone-400">{formatDate(o.createdAt)}</p>
                    </div>
                    {deleteConfirm === o.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(o.id)} className="px-2 py-1 bg-red-500 text-white text-xs rounded">OK</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-stone-200 text-xs rounded">X</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(o.id)} className="p-1.5 text-stone-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'snap' && (
          <div className="divide-y divide-stone-50">
            {filteredSnap.length === 0 ? (
              <div className="p-12 text-center text-sm text-stone-400">
                {search || filter !== 'ALL' ? '\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4' : 'AI\uC2A4\uB0C5 \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}
              </div>
            ) : filteredSnap.map(o => (
              <div key={o.id} className="px-4 py-3 hover:bg-stone-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-stone-800">{o.user?.name || '-'}</span>
                      <Badge status={o.status} />
                      <span className="text-xs text-stone-400 font-mono">#{o.orderId?.slice(-8)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                      <span>{o.user?.email}</span>
                      <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded">{TIERS[o.tier] || o.tier}</span>
                      <span>{o.concept}</span>
                      <span>{o.mode === 'couple' ? '\uCEE4\uD50C' : o.mode === 'bride' ? '\uC2E0\uBD80' : '\uC2E0\uB791'}</span>
                      <span>{o.usedSnaps}/{o.totalSnaps}\uC7A5</span>
                      {o.couponCode && <span className="text-amber-600">{o.couponCode}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold text-stone-800">{formatAmount(o.amount)}</p>
                    <p className="text-xs text-stone-400">{formatDate(o.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'cinema' && (
          <div className="divide-y divide-stone-50">
            {filteredCinema.length === 0 ? (
              <div className="p-12 text-center text-sm text-stone-400">
                {search || filter !== 'ALL' ? '\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4' : '\uC6E8\uB529\uC2DC\uB124\uB9C8 \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}
              </div>
            ) : filteredCinema.map(o => (
              <div key={o.id} className="px-4 py-3 hover:bg-stone-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-stone-800">{o.groomName} & {o.brideName}</span>
                      <Badge status={o.status} />
                      <span className="text-xs text-stone-400 font-mono">#{o.orderId?.slice(-8)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                      <span>{o.user?.email}</span>
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{o.mode === 'selfie' ? '\uC140\uD53C' : '\uD3EC\uD1A0'}</span>
                      {o.totalCost != null && <span>{'API $'}{o.totalCost.toFixed(2)}</span>}
                      {o.couponCode && <span className="text-amber-600">{o.couponCode}</span>}
                      {o.errorMsg && <span className="text-red-400 truncate max-w-[160px]">{o.errorMsg}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold text-stone-800">{formatAmount(o.amount)}</p>
                    <p className="text-xs text-stone-400">{formatDate(o.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
