import { useState, useEffect } from 'react';
import { Calendar, Download, Filter, TrendingUp, DollarSign, Users, Receipt } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL;

interface OrderDetail {
  id: string;
  orderId: string;
  amount: number;
  packageName: string;
  userName: string;
  userEmail: string;
  paidAt: string;
}

interface CouponSummary {
  code: string;
  count: number;
  totalPaid: number;
  commission: number;
  net: number;
  orders: OrderDetail[];
}

interface Totals {
  totalOrders: number;
  totalPaid: number;
  totalCommission: number;
  totalNet: number;
}

export default function AdminSettlement() {
  const [summary, setSummary] = useState<CouponSummary[]>([]);
  const [totals, setTotals] = useState<Totals>({ totalOrders: 0, totalPaid: 0, totalCommission: 0, totalNet: 0 });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  useEffect(() => {
    if (startDate && endDate) fetchSettlement();
  }, [startDate, endDate, filterCode]);

  const fetchSettlement = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (filterCode) params.set('couponCode', filterCode);
      const res = await fetch(`${API_BASE}/coupon/admin/settlement?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setTotals(data.totals);
      }
    } catch (e) {
      console.error('Settlement fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const rows = [['쿠폰코드', '주문번호', '패키지', '결제금액', '수수료(10%)', '실수령', '구매자', '결제일']];
    summary.forEach(s => {
      s.orders.forEach(o => {
        const comm = Math.floor(o.amount * 0.1);
        rows.push([
          s.code, o.orderId, o.packageName, String(o.amount), String(comm),
          String(o.amount - comm), o.userName || o.userEmail,
          new Date(o.paidAt).toLocaleDateString('ko-KR'),
        ]);
      });
    });
    const bom = '\uFEFF';
    const csv = bom + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlement_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n: number) => n.toLocaleString('ko-KR');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">제휴 정산</h1>
          <p className="text-stone-500 text-sm mt-1">쿠폰 코드별 매출 및 수수료 정산</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700 transition">
          <Download size={16} />
          CSV 다운로드
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-stone-500 mb-1">시작일</label>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">종료일</label>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">쿠폰 필터</label>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="text" value={filterCode} onChange={e => setFilterCode(e.target.value.toUpperCase())}
              placeholder="전체" className="pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm w-40 focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-stone-500 text-xs mb-2"><Receipt size={14} /> 총 주문</div>
          <p className="text-2xl font-bold text-stone-800">{fmt(totals.totalOrders)}<span className="text-sm font-normal text-stone-400 ml-1">건</span></p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-stone-500 text-xs mb-2"><DollarSign size={14} /> 총 결제액</div>
          <p className="text-2xl font-bold text-stone-800">{fmt(totals.totalPaid)}<span className="text-sm font-normal text-stone-400 ml-1">원</span></p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-rose-500 text-xs mb-2"><Users size={14} /> 수수료 (10%)</div>
          <p className="text-2xl font-bold text-rose-600">{fmt(totals.totalCommission)}<span className="text-sm font-normal text-rose-300 ml-1">원</span></p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-emerald-500 text-xs mb-2"><TrendingUp size={14} /> 실수령</div>
          <p className="text-2xl font-bold text-emerald-600">{fmt(totals.totalNet)}<span className="text-sm font-normal text-emerald-300 ml-1">원</span></p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-400">불러오는 중...</div>
      ) : summary.length === 0 ? (
        <div className="text-center py-16 text-stone-400">해당 기간에 쿠폰 결제 내역이 없습니다</div>
      ) : (
        <div className="space-y-4">
          {summary.map(s => (
            <div key={s.code} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <button onClick={() => setExpandedCode(expandedCode === s.code ? null : s.code)}
                className="w-full flex items-center justify-between p-5 hover:bg-stone-50 transition text-left">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-stone-100 rounded-lg font-mono text-sm font-bold text-stone-700">{s.code}</span>
                  <span className="text-sm text-stone-500">{s.count}건</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-stone-600">결제 <strong>{fmt(s.totalPaid)}</strong>원</span>
                  <span className="text-rose-500">수수료 <strong>{fmt(s.commission)}</strong>원</span>
                  <span className="text-emerald-600">실수령 <strong>{fmt(s.net)}</strong>원</span>
                  <svg className={`w-4 h-4 text-stone-400 transition ${expandedCode === s.code ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>
              {expandedCode === s.code && (
                <div className="border-t border-stone-100">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs text-stone-500 font-medium">주문번호</th>
                        <th className="px-5 py-3 text-left text-xs text-stone-500 font-medium">패키지</th>
                        <th className="px-5 py-3 text-left text-xs text-stone-500 font-medium">구매자</th>
                        <th className="px-5 py-3 text-right text-xs text-stone-500 font-medium">결제액</th>
                        <th className="px-5 py-3 text-right text-xs text-stone-500 font-medium">수수료</th>
                        <th className="px-5 py-3 text-right text-xs text-stone-500 font-medium">실수령</th>
                        <th className="px-5 py-3 text-right text-xs text-stone-500 font-medium">결제일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.orders.map(o => {
                        const comm = Math.floor(o.amount * 0.1);
                        return (
                          <tr key={o.id} className="border-t border-stone-50 hover:bg-stone-50/50">
                            <td className="px-5 py-3 font-mono text-xs text-stone-500">{o.orderId.slice(0, 20)}...</td>
                            <td className="px-5 py-3 text-stone-700">{o.packageName}</td>
                            <td className="px-5 py-3 text-stone-600">{o.userName || o.userEmail}</td>
                            <td className="px-5 py-3 text-right text-stone-700">{fmt(o.amount)}원</td>
                            <td className="px-5 py-3 text-right text-rose-500">{fmt(comm)}원</td>
                            <td className="px-5 py-3 text-right text-emerald-600">{fmt(o.amount - comm)}원</td>
                            <td className="px-5 py-3 text-right text-stone-500">{new Date(o.paidAt).toLocaleDateString('ko-KR')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
