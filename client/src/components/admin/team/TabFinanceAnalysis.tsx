import { useMemo, useState } from 'react';
import { API, getHeaders } from './shared';

type Parsed = {
  month: string;
  income: number;
  totalExpense: number;
  net: number;
  expenses: { category: string; amount: number }[];
};

async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  const text = await res.text();
  throw new Error(text.slice(0, 180) || `HTTP ${res.status}`);
}

export default function TabFinanceAnalysis() {
  const headers = getHeaders();
  const [text, setText] = useState('이번 달 수입 180만원, 월세 47만원, 카드값 28만원, 교통비 14000원, 사업비 12만원');
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runParse = async (save = false) => {
    try {
      setLoading(true);
      setError('');
      const url = save ? `${API}/admin/finance/sessions` : `${API}/admin/finance/parse`;
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ text }) });
      const data = await safeJson(r);
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
      setParsed(data);
    } catch (e: any) {
      setError(e?.message || '분석 실패');
    } finally {
      setLoading(false);
    }
  };

  const pie = useMemo(() => {
    if (!parsed || parsed.totalExpense <= 0) return [];
    return parsed.expenses.map((e) => ({ ...e, pct: Math.round((e.amount / parsed.totalExpense) * 100) }));
  }, [parsed]);

  return (
    <div className="space-y-4">
      {!!error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-xl p-4">
        <p className="text-sm font-semibold text-stone-700 mb-2">자연어 입력</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full border rounded-lg p-3 text-sm min-h-[120px]" />
        <div className="flex gap-2 mt-2 flex-wrap">
          <button onClick={() => runParse(false)} className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm">{loading ? '분석중...' : '즉시 분석'}</button>
          <button onClick={() => runParse(true)} className="px-4 py-2 rounded-lg bg-stone-100 text-stone-700 text-sm">세션 저장</button>
        </div>
      </div>

      {parsed && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card label="총수입" value={parsed.income} />
            <Card label="총지출" value={parsed.totalExpense} />
            <Card label="순이익" value={parsed.net} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm font-semibold mb-3 text-stone-700">막대그래프</p>
              <Bar label="수입" value={parsed.income} max={Math.max(parsed.income, parsed.totalExpense, Math.abs(parsed.net)) || 1} color="bg-emerald-500" />
              <Bar label="지출" value={parsed.totalExpense} max={Math.max(parsed.income, parsed.totalExpense, Math.abs(parsed.net)) || 1} color="bg-rose-500" />
              <Bar label="순이익" value={Math.abs(parsed.net)} max={Math.max(parsed.income, parsed.totalExpense, Math.abs(parsed.net)) || 1} color="bg-blue-500" />
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm font-semibold mb-3 text-stone-700">원형그래프(비중)</p>
              <div className="space-y-2">
                {pie.map((p) => (
                  <div key={p.category}>
                    <div className="flex justify-between text-xs text-stone-600"><span>{p.category}</span><span>{p.pct}%</span></div>
                    <div className="h-2 bg-stone-100 rounded"><div className="h-2 bg-violet-500 rounded" style={{ width: `${p.pct}%` }} /></div>
                  </div>
                ))}
                {pie.length === 0 && <p className="text-xs text-stone-400">지출 데이터가 없습니다.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-2xl font-bold text-stone-800 mt-1 tabular-nums">{value.toLocaleString()}원</p>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const w = Math.max(6, Math.round((value / max) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-stone-600 mb-1"><span>{label}</span><span>{value.toLocaleString()}원</span></div>
      <div className="h-2 bg-stone-100 rounded"><div className={`h-2 rounded ${color}`} style={{ width: `${w}%` }} /></div>
    </div>
  );
}
