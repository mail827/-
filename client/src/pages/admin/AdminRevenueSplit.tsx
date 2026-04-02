import { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, Receipt, TrendingUp, User, Percent } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL;

interface Stats {
  revenue: number;
  paidOrders: number;
}

interface TossSummary {
  totalAmount: number;
  totalFee: number;
  totalPayoutAmount: number;
  settledCount: number; tx?: { totalAmount: number; totalFee: number; count: number; netAmount: number };
}

interface SplitResult {
  totalRevenue: number;
  pgFee: number;
  netAfterPg: number;
  dakyum: {
    gross: number;
    vat: number;
    netAfterVat: number;
    estimatedIncomeTax: number;
    estimatedLocalTax: number;
    finalEstimate: number;
  };
  gahyun: {
    gross: number;
    withholdingTax: number;
    withholdingLocal: number;
    totalWithholding: number;
    net: number;
  };
}

export default function AdminRevenueSplit() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [tossSummary, setTossSummary] = useState<TossSummary | null>(null);
  const [dbStats, setDbStats] = useState<Stats | null>(null);
  const [source, setSource] = useState<'toss' | 'db'>('toss');
  const [dakyumRatio, setDakyumRatio] = useState(60);
  const [incomeTaxRate, setIncomeTaxRate] = useState(6);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setStartDate(`${y}-${m}-01`);
    const last = new Date(y, now.getMonth() + 1, 0);
    setEndDate(`${y}-${m}-${String(last.getDate()).padStart(2, '0')}`);
  }, []);

  useEffect(() => {
    if (startDate && endDate) fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const [tossRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/settlement/toss-summary?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (tossRes.ok) setTossSummary(await tossRes.json());
      if (statsRes.ok) setDbStats(await statsRes.json());
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const gahyunRatio = 100 - dakyumRatio;

  const calculate = (): SplitResult | null => {
    let totalRevenue = 0;
    let pgFee = 0;

    if (source === 'toss' && tossSummary) {
      totalRevenue = tossSummary.tx ? tossSummary.tx.totalAmount : tossSummary.totalAmount;
      const txFee = tossSummary.tx?.totalFee || 0;
      const settleFee = tossSummary.totalFee || 0;
      pgFee = txFee > 0 ? txFee : settleFee > 0 ? settleFee : Math.floor(totalRevenue * 0.033);
    } else if (source === 'db' && dbStats) {
      totalRevenue = dbStats.revenue;
      pgFee = Math.floor(totalRevenue * 0.033);
    } else {
      return null;
    }

    const netAfterPg = totalRevenue - pgFee;
    const dakyumGross = Math.floor(netAfterPg * (dakyumRatio / 100));
    const gahyunGross = netAfterPg - dakyumGross;

    const dakyumVat = Math.floor(dakyumGross / 11);
    const dakyumNetAfterVat = dakyumGross - dakyumVat;
    const dakyumIncomeTax = Math.floor(dakyumNetAfterVat * (incomeTaxRate / 100));
    const dakyumLocalTax = Math.floor(dakyumIncomeTax * 0.1);
    const dakyumFinal = dakyumNetAfterVat - dakyumIncomeTax - dakyumLocalTax;

    const gahyunWithholding = Math.floor(gahyunGross * 0.03);
    const gahyunLocal = Math.floor(gahyunWithholding * 0.1);
    const gahyunTotalWithholding = gahyunWithholding + gahyunLocal;
    const gahyunNet = gahyunGross - gahyunTotalWithholding;

    return {
      totalRevenue,
      pgFee,
      netAfterPg,
      dakyum: {
        gross: dakyumGross,
        vat: dakyumVat,
        netAfterVat: dakyumNetAfterVat,
        estimatedIncomeTax: dakyumIncomeTax,
        estimatedLocalTax: dakyumLocalTax,
        finalEstimate: dakyumFinal,
      },
      gahyun: {
        gross: gahyunGross,
        withholdingTax: gahyunWithholding,
        withholdingLocal: gahyunLocal,
        totalWithholding: gahyunTotalWithholding,
        net: gahyunNet,
      },
    };
  };

  const result = calculate();
  const fmt = (n: number) => n.toLocaleString('ko-KR');

  const exportCSV = () => {
    if (!result) return;
    const rows = [
      ['항목', '금액'],
      ['총 매출', String(result.totalRevenue)],
      ['PG 수수료', String(result.pgFee)],
      ['PG 차감 후', String(result.netAfterPg)],
      [''],
      [`다겸 (${dakyumRatio}%)`, ''],
      ['배분 금액', String(result.dakyum.gross)],
      ['부가세 (1/11)', String(result.dakyum.vat)],
      ['부가세 차감 후', String(result.dakyum.netAfterVat)],
      [`종합소득세 추정 (${incomeTaxRate}%)`, String(result.dakyum.estimatedIncomeTax)],
      ['지방소득세 (10%)', String(result.dakyum.estimatedLocalTax)],
      ['예상 실수령', String(result.dakyum.finalEstimate)],
      [''],
      [`가현 (${gahyunRatio}%)`, ''],
      ['배분 금액', String(result.gahyun.gross)],
      ['원천징수 소득세 (3%)', String(result.gahyun.withholdingTax)],
      ['원천징수 지방세 (0.3%)', String(result.gahyun.withholdingLocal)],
      ['원천징수 합계 (3.3%)', String(result.gahyun.totalWithholding)],
      ['실지급액', String(result.gahyun.net)],
    ];
    const bom = '\uFEFF';
    const csv = bom + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_split_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Row = ({ label, value, bold, color, indent }: { label: string; value: string; bold?: boolean; color?: string; indent?: boolean }) => (
    <div className={`flex items-center justify-between py-2.5 ${indent ? 'pl-4' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-stone-800' : 'text-stone-500'}`}>{label}</span>
      <span className={`text-sm tabular-nums ${bold ? 'font-bold' : 'font-medium'} ${color || 'text-stone-800'}`}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">매출 분배</h1>
          <p className="text-stone-500 text-sm mt-1">다겸 {dakyumRatio}% / 가현 {gahyunRatio}% 세금 계산</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={!result}
            className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg text-sm hover:bg-stone-50 transition disabled:opacity-50">
            <Download size={16} /> CSV
          </button>
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700 transition disabled:opacity-50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
        </div>
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
          <label className="block text-xs text-stone-500 mb-1">데이터 소스</label>
          <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
            <button onClick={() => setSource('toss')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${source === 'toss' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}>
              토스 정산
            </button>
            <button onClick={() => setSource('db')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${source === 'db' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}>
              DB 매출
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">다겸 비율</label>
          <div className="flex items-center gap-2">
            <input type="range" min={10} max={90} step={5} value={dakyumRatio}
              onChange={e => setDakyumRatio(Number(e.target.value))}
              className="w-24 accent-stone-800" />
            <span className="text-sm font-medium text-stone-700 w-16">{dakyumRatio}:{gahyunRatio}</span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">종소세율</label>
          <select value={incomeTaxRate} onChange={e => setIncomeTaxRate(Number(e.target.value))}
            className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300">
            <option value={6}>6% (1,400만 이하)</option>
            <option value={15}>15% (1,400~5,000만)</option>
            <option value={24}>24% (5,000~8,800만)</option>
            <option value={35}>35% (8,800~1.5억)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-stone-400">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
          데이터 조회 중...
        </div>
      ) : result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-stone-500 text-xs mb-2"><Receipt size={14} /> 총 매출</div>
              <p className="text-3xl font-bold text-stone-800">{fmt(result.totalRevenue)}<span className="text-sm font-normal text-stone-400 ml-1">원</span></p>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-red-500 text-xs mb-2"><Percent size={14} /> PG 수수료</div>
              <p className="text-3xl font-bold text-red-600">-{fmt(result.pgFee)}<span className="text-sm font-normal text-red-300 ml-1">원</span></p>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-emerald-500 text-xs mb-2"><TrendingUp size={14} /> 분배 대상</div>
              <p className="text-3xl font-bold text-emerald-600">{fmt(result.netAfterPg)}<span className="text-sm font-normal text-emerald-300 ml-1">원</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-stone-800 text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <User size={16} />
                </div>
                <div>
                  <p className="font-bold">다겸</p>
                  <p className="text-stone-300 text-xs">일반과세 · {dakyumRatio}%</p>
                </div>
              </div>
              <div className="p-6 divide-y divide-stone-100">
                <Row label={`배분 금액 (${dakyumRatio}%)`} value={`${fmt(result.dakyum.gross)}원`} bold />
                <Row label="부가세 (1/11)" value={`-${fmt(result.dakyum.vat)}원`} color="text-red-500" indent />
                <Row label="부가세 차감 후" value={`${fmt(result.dakyum.netAfterVat)}원`} indent />
                <Row label={`종합소득세 추정 (${incomeTaxRate}%)`} value={`-${fmt(result.dakyum.estimatedIncomeTax)}원`} color="text-red-500" indent />
                <Row label="지방소득세 (소득세의 10%)" value={`-${fmt(result.dakyum.estimatedLocalTax)}원`} color="text-red-500" indent />
                <div className="pt-3">
                  <Row label="예상 실수령" value={`${fmt(result.dakyum.finalEstimate)}원`} bold color="text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-rose-700 text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <User size={16} />
                </div>
                <div>
                  <p className="font-bold">가현</p>
                  <p className="text-rose-200 text-xs">프리랜서 3.3% · {gahyunRatio}%</p>
                </div>
              </div>
              <div className="p-6 divide-y divide-stone-100">
                <Row label={`배분 금액 (${gahyunRatio}%)`} value={`${fmt(result.gahyun.gross)}원`} bold />
                <Row label="원천징수 소득세 (3%)" value={`-${fmt(result.gahyun.withholdingTax)}원`} color="text-red-500" indent />
                <Row label="원천징수 지방세 (0.3%)" value={`-${fmt(result.gahyun.withholdingLocal)}원`} color="text-red-500" indent />
                <Row label="원천징수 합계 (3.3%)" value={`-${fmt(result.gahyun.totalWithholding)}원`} color="text-red-500" indent />
                <div className="pt-3">
                  <Row label="실지급액" value={`${fmt(result.gahyun.net)}원`} bold color="text-emerald-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-stone-400 leading-relaxed">
              종합소득세는 연간 소득 기준 추정치이며 실제 세금은 다를 수 있습니다.
              부가세는 매출 기준 1/11로 산정했으며, 매입세액 공제 전 금액입니다.
              가현 원천징수 3.3%는 다겸이 신고/납부 의무가 있습니다 (원천징수이행상황신고서).
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-stone-400">데이터를 조회해주세요</div>
      )}
    </div>
  );
}
