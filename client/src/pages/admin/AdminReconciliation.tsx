import { useState, useEffect } from 'react';
import { ArrowRightLeft, AlertTriangle, CheckCircle, RefreshCw, Download, Calendar, ChevronDown, ChevronRight, Zap, TrendingUp, Receipt } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL;

interface Summary {
  tossTotal: number;
  dbTotal: number;
  difference: number;
  tossCount: number;
  dbPaidCount: number;
  matchedCount: number;
  mismatchedCount: number;
  tossOnlyCount: number;
}

interface MismatchItem {
  paymentKey: string;
  orderId: string;
  tossAmount: number;
  dbAmount: number;
  dbStatus: string;
  tossStatus: string;
  recordType: string;
  recordId: string;
  userName: string;
  packageName: string;
  approvedAt: string;
}

interface TossOnlyItem {
  paymentKey: string;
  orderId: string;
  amount: number;
  method: string;
  approvedAt: string;
  orderName: string;
  status: string;
}

interface DbOnlyItem {
  type: string;
  id: string;
  orderId: string;
  amount: number;
  paymentKey: string;
}

interface TossSummary {
  totalAmount: number;
  totalFee: number;
  totalPayoutAmount: number;
  settledCount: number;
  byMethod: Record<string, { count: number; amount: number; fee: number }>;
}

export default function AdminReconciliation() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [mismatched, setMismatched] = useState<MismatchItem[]>([]);
  const [tossOnly, setTossOnly] = useState<TossOnlyItem[]>([]);
  const [dbOnly, setDbOnly] = useState<DbOnlyItem[]>([]);
  const [tossSummary, setTossSummary] = useState<TossSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'reconcile' | 'toss'>('reconcile');
  const [expandedSection, setExpandedSection] = useState<string | null>('mismatched');

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
    if (startDate && endDate) {
      if (activeTab === 'reconcile') fetchReconcile();
      else fetchTossSummary();
    }
  }, [startDate, endDate, activeTab]);

  const fetchReconcile = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`${API_BASE}/settlement/reconcile?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setMismatched(data.mismatched);
        setTossOnly(data.tossOnly);
        setDbOnly(data.dbOnly);
      }
    } catch (e) {
      console.error('Reconcile error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTossSummary = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`${API_BASE}/settlement/toss-summary?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTossSummary(await res.json());
    } catch (e) {
      console.error('Toss summary error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (item: MismatchItem) => {
    setSyncing(item.paymentKey);
    try {
      const res = await fetch(`${API_BASE}/settlement/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey: item.paymentKey,
          recordType: item.recordType,
          recordId: item.recordId,
        }),
      });
      if (res.ok) {
        setMismatched(prev => prev.filter(m => m.paymentKey !== item.paymentKey));
        fetchReconcile();
      }
    } catch (e) {
      console.error('Sync error:', e);
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    for (const item of mismatched) {
      await handleSync(item);
    }
  };

  const fmt = (n: number) => n.toLocaleString('ko-KR');

  const exportCSV = () => {
    const rows = [['구분', '주문번호', 'paymentKey', '토스금액', 'DB금액', 'DB상태', '토스상태', '구매자', '패키지', '승인일']];
    mismatched.forEach(m => {
      rows.push(['불일치', m.orderId, m.paymentKey, String(m.tossAmount), String(m.dbAmount), m.dbStatus, m.tossStatus, m.userName, m.packageName, m.approvedAt ? new Date(m.approvedAt).toLocaleDateString('ko-KR') : '-']);
    });
    tossOnly.forEach(t => {
      rows.push(['토스만', t.orderId, t.paymentKey, String(t.amount), '-', '-', t.status, '-', t.orderName || '-', t.approvedAt ? new Date(t.approvedAt).toLocaleDateString('ko-KR') : '-']);
    });
    const bom = '\uFEFF';
    const csv = bom + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Section = ({ id, title, count, color, children }: { id: string; title: string; count: number; color: string; children: React.ReactNode }) => (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <button onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between p-5 bg-white hover:bg-stone-50 transition text-left">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <span className="font-semibold text-stone-800">{title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${count > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{count}건</span>
        </div>
        {expandedSection === id ? <ChevronDown size={18} className="text-stone-400" /> : <ChevronRight size={18} className="text-stone-400" />}
      </button>
      {expandedSection === id && <div className="border-t border-stone-100">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">정산 대사</h1>
          <p className="text-stone-500 text-sm mt-1">토스페이먼츠 vs DB 결제 데이터 비교</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg text-sm hover:bg-stone-50 transition">
            <Download size={16} />
            CSV
          </button>
          <button onClick={() => activeTab === 'reconcile' ? fetchReconcile() : fetchTossSummary()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700 transition disabled:opacity-50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab('reconcile')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'reconcile' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
          <ArrowRightLeft size={14} className="inline mr-2" />대사 비교
        </button>
        <button onClick={() => setActiveTab('toss')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'toss' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
          <Receipt size={14} className="inline mr-2" />토스 정산
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
      </div>

      {activeTab === 'reconcile' && (
        <>
          {loading ? (
            <div className="text-center py-20 text-stone-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
              토스 거래 내역 조회 중...
            </div>
          ) : summary ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-stone-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-stone-500 text-xs mb-2"><TrendingUp size={14} /> 토스 결제 합계</div>
                  <p className="text-2xl font-bold text-stone-800">{fmt(summary.tossTotal)}<span className="text-sm font-normal text-stone-400 ml-1">원</span></p>
                  <p className="text-xs text-stone-400 mt-1">{summary.tossCount}건</p>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-stone-500 text-xs mb-2"><Receipt size={14} /> DB 매출 합계</div>
                  <p className="text-2xl font-bold text-stone-800">{fmt(summary.dbTotal)}<span className="text-sm font-normal text-stone-400 ml-1">원</span></p>
                  <p className="text-xs text-stone-400 mt-1">{summary.dbPaidCount}건</p>
                </div>
                <div className={`bg-white border rounded-xl p-5 ${summary.difference !== 0 ? 'border-red-300 bg-red-50/30' : 'border-green-300 bg-green-50/30'}`}>
                  <div className={`flex items-center gap-2 text-xs mb-2 ${summary.difference !== 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {summary.difference !== 0 ? <AlertTriangle size={14} /> : <CheckCircle size={14} />} 차이
                  </div>
                  <p className={`text-2xl font-bold ${summary.difference !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {summary.difference > 0 ? '+' : ''}{fmt(summary.difference)}<span className="text-sm font-normal ml-1">원</span>
                  </p>
                  <p className="text-xs text-stone-400 mt-1">{summary.difference === 0 ? '일치' : '불일치 확인 필요'}</p>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-stone-500 text-xs mb-2"><CheckCircle size={14} /> 매칭 현황</div>
                  <p className="text-2xl font-bold text-green-600">{summary.matchedCount}<span className="text-sm font-normal text-stone-400 ml-1">건 일치</span></p>
                  <p className="text-xs text-stone-400 mt-1">불일치 {summary.mismatchedCount}건 / 토스만 {summary.tossOnlyCount}건</p>
                </div>
              </div>

              <div className="space-y-4">
                <Section id="mismatched" title="상태 불일치 (토스 완료 / DB 미완료)" count={mismatched.length} color="bg-red-500">
                  {mismatched.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">
                      <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                      불일치 건이 없습니다
                    </div>
                  ) : (
                    <>
                      <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                        <p className="text-sm text-amber-700">
                          <AlertTriangle size={14} className="inline mr-1" />
                          {mismatched.length}건의 결제가 토스에서는 완료됐지만 DB에 반영되지 않았습니다
                        </p>
                        <button onClick={handleSyncAll}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs hover:bg-amber-700 transition">
                          <Zap size={12} /> 전체 동기화
                        </button>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-stone-50">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs text-stone-500 font-medium">주문번호</th>
                            <th className="px-5 py-3 text-left text-xs text-stone-500 font-medium">구매자</th>
                            <th className="px-5 py-3 text-left text-xs text-stone-500 font-medium">패키지</th>
                            <th className="px-5 py-3 text-right text-xs text-stone-500 font-medium">토스 금액</th>
                            <th className="px-5 py-3 text-center text-xs text-stone-500 font-medium">DB 상태</th>
                            <th className="px-5 py-3 text-right text-xs text-stone-500 font-medium">승인일</th>
                            <th className="px-5 py-3 text-center text-xs text-stone-500 font-medium">동기화</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mismatched.map(m => (
                            <tr key={m.paymentKey} className="border-t border-stone-50 hover:bg-stone-50/50">
                              <td className="px-5 py-3 font-mono text-xs text-stone-500">{m.orderId.slice(0, 24)}...</td>
                              <td className="px-5 py-3 text-stone-700">{m.userName}</td>
                              <td className="px-5 py-3 text-stone-600">{m.packageName}</td>
                              <td className="px-5 py-3 text-right font-medium text-stone-800">{fmt(m.tossAmount)}원</td>
                              <td className="px-5 py-3 text-center">
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">{m.dbStatus}</span>
                              </td>
                              <td className="px-5 py-3 text-right text-stone-500 text-xs">
                                {m.approvedAt ? new Date(m.approvedAt).toLocaleDateString('ko-KR') : '-'}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <button onClick={() => handleSync(m)}
                                  disabled={syncing === m.paymentKey}
                                  className="px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs hover:bg-stone-700 transition disabled:opacity-50">
                                  {syncing === m.paymentKey ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} className="inline mr-1" />}
                                  동기화
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </Section>

                <Section id="tossOnly" title="토스에만 있는 건 (DB 누락)" count={tossOnly.length} color="bg-amber-500">
                  {tossOnly.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">
                      <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                      누락 건이 없습니다
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-stone-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs text-stone-500 font-medium">주문번호</th>
                          <th className="px-5 py-3 text-left text-xs text-stone-500 font-medium">상품명</th>
                          <th className="px-5 py-3 text-left text-xs text-stone-500 font-medium">결제수단</th>
                          <th className="px-5 py-3 text-right text-xs text-stone-500 font-medium">금액</th>
                          <th className="px-5 py-3 text-right text-xs text-stone-500 font-medium">승인일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tossOnly.map(t => (
                          <tr key={t.paymentKey} className="border-t border-stone-50 hover:bg-stone-50/50">
                            <td className="px-5 py-3 font-mono text-xs text-stone-500">{t.orderId.slice(0, 24)}...</td>
                            <td className="px-5 py-3 text-stone-700">{t.orderName || '-'}</td>
                            <td className="px-5 py-3 text-stone-600">{t.method || '-'}</td>
                            <td className="px-5 py-3 text-right font-medium text-stone-800">{fmt(t.amount)}원</td>
                            <td className="px-5 py-3 text-right text-stone-500 text-xs">
                              {t.approvedAt ? new Date(t.approvedAt).toLocaleDateString('ko-KR') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Section>

                <Section id="dbOnly" title="DB에만 있는 건 (토스 미확인)" count={dbOnly.length} color="bg-blue-500">
                  {dbOnly.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">
                      <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                      이상 없습니다
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-stone-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs text-stone-500 font-medium">구분</th>
                          <th className="px-5 py-3 text-left text-xs text-stone-500 font-medium">주문번호</th>
                          <th className="px-5 py-3 text-right text-xs text-stone-500 font-medium">금액</th>
                          <th className="px-5 py-3 text-left text-xs text-stone-500 font-medium">paymentKey</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbOnly.map(d => (
                          <tr key={d.id} className="border-t border-stone-50 hover:bg-stone-50/50">
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${d.type === 'order' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {d.type === 'order' ? '청첩장' : '스냅팩'}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-mono text-xs text-stone-500">{d.orderId.slice(0, 24)}...</td>
                            <td className="px-5 py-3 text-right font-medium text-stone-800">{fmt(d.amount)}원</td>
                            <td className="px-5 py-3 font-mono text-xs text-stone-400">{d.paymentKey?.slice(0, 20) || '-'}...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Section>
              </div>
            </>
          ) : null}
        </>
      )}

      {activeTab === 'toss' && (
        <>
          {loading ? (
            <div className="text-center py-20 text-stone-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
              토스 정산 데이터 조회 중...
            </div>
          ) : tossSummary ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-stone-200 rounded-xl p-5">
                  <p className="text-xs text-stone-500 mb-2">총 결제 금액</p>
                  <p className="text-3xl font-bold text-stone-800">{fmt(tossSummary.totalAmount)}<span className="text-sm font-normal text-stone-400 ml-1">원</span></p>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-5">
                  <p className="text-xs text-red-500 mb-2">토스 수수료</p>
                  <p className="text-3xl font-bold text-red-600">-{fmt(tossSummary.totalFee)}<span className="text-sm font-normal text-red-300 ml-1">원</span></p>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-5">
                  <p className="text-xs text-emerald-500 mb-2">실 지급액</p>
                  <p className="text-3xl font-bold text-emerald-600">{fmt(tossSummary.totalPayoutAmount)}<span className="text-sm font-normal text-emerald-300 ml-1">원</span></p>
                </div>
              </div>

              {Object.keys(tossSummary.byMethod).length > 0 && (
                <div className="bg-white border border-stone-200 rounded-xl p-5">
                  <h3 className="font-semibold text-stone-800 mb-4">결제 수단별</h3>
                  <div className="space-y-3">
                    {Object.entries(tossSummary.byMethod).map(([method, data]) => (
                      <div key={method} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 bg-stone-100 rounded text-xs font-medium text-stone-700">{method}</span>
                          <span className="text-sm text-stone-500">{data.count}건</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <span className="text-stone-700">{fmt(data.amount)}원</span>
                          <span className="text-red-500">-{fmt(data.fee)}원</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
