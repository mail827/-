import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Save, RefreshCw, ChevronDown, BarChart3 } from 'lucide-react';
import { API, getHeaders } from './shared';

type Parsed = {
  id?: string;
  month: string;
  income: number;
  totalExpense: number;
  net: number;
  expenses: { category: string; amount: number }[];
};

type SavedSession = {
  id: string;
  month: string;
  rawInput: string;
  income: number;
  totalExpense: number;
  net: number;
  expensesJson: any;
  createdAt: string;
};

const PIE_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-violet-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
  'bg-orange-500', 'bg-indigo-500',
];

async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  const text = await res.text();
  throw new Error(text.slice(0, 180) || `HTTP ${res.status}`);
}

export default function TabFinanceAnalysis() {
  const headers = getHeaders();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/finance/sessions`, { headers });
      if (r.ok) setSessions(await r.json());
    } catch {}
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const runParse = async () => {
    if (!text.trim()) return;
    try {
      setLoading(true);
      setError('');
      const r = await fetch(`${API}/admin/finance/parse`, { method: 'POST', headers, body: JSON.stringify({ text }) });
      const data = await safeJson(r);
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
      setParsed(data);
    } catch (e: any) {
      setError(e?.message || '분석 실패');
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async () => {
    if (!text.trim()) return;
    try {
      setSaving(true);
      setError('');
      const r = await fetch(`${API}/admin/finance/sessions`, { method: 'POST', headers, body: JSON.stringify({ text }) });
      const data = await safeJson(r);
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
      setParsed(data);
      await fetchSessions();
    } catch (e: any) {
      setError(e?.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const loadSession = (s: SavedSession) => {
    setText(s.rawInput);
    const expenses = Array.isArray(s.expensesJson) ? s.expensesJson : [];
    setParsed({ id: s.id, month: s.month, income: s.income, totalExpense: s.totalExpense, net: s.net, expenses });
    setShowHistory(false);
  };

  const pie = useMemo(() => {
    if (!parsed || parsed.totalExpense <= 0) return [];
    return parsed.expenses.map((e) => ({ ...e, pct: Math.round((e.amount / parsed.totalExpense) * 100) }));
  }, [parsed]);

  const barMax = useMemo(() => {
    if (!parsed) return 1;
    return Math.max(parsed.income, parsed.totalExpense, 1);
  }, [parsed]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-stone-500" />
          <span className="text-[10px] tracking-[0.15em] text-stone-400 font-medium">FINANCE ANALYSIS</span>
        </div>
        <p className="text-[12px] text-stone-400">자연어로 수입/지출 입력하면 자동 분석</p>
      </div>

      {!!error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-[13px] text-rose-700">{error}</div>
      )}

      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-stone-700">자연어 입력</p>
          {sessions.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-600"
            >
              저장 기록 ({sessions.length})
              <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {showHistory && (
          <div className="mb-4 space-y-2 max-h-[200px] overflow-auto">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s)}
                className="w-full text-left p-3 rounded-lg border border-stone-100 hover:border-stone-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-stone-700">{s.month}</span>
                  <span className={`text-[11px] font-semibold tabular-nums ${s.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {s.net >= 0 ? '+' : ''}{s.net.toLocaleString()}원
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-1 truncate">{s.rawInput}</p>
                <p className="text-[10px] text-stone-300 mt-1">
                  {new Date(s.createdAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </button>
            ))}
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예: 이번 달 수입 300만원, 월세 50만원, 식비 40만원, 교통비 8만원, 사업비 15만원"
          className="w-full border border-stone-200 rounded-xl p-4 text-[13px] min-h-[100px] focus:outline-none focus:border-stone-400 placeholder:text-stone-300 resize-none"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={runParse}
            disabled={loading || !text.trim()}
            className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-[13px] font-semibold hover:bg-stone-800 disabled:opacity-40 flex items-center gap-2"
          >
            {loading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />분석 중...</> : <><TrendingUp className="w-3.5 h-3.5" />즉시 분석</>}
          </button>
          <button
            onClick={saveSession}
            disabled={saving || !text.trim()}
            className="px-5 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-[13px] font-semibold hover:bg-stone-200 disabled:opacity-40 flex items-center gap-2"
          >
            {saving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />저장 중...</> : <><Save className="w-3.5 h-3.5" />세션 저장</>}
          </button>
        </div>
      </div>

      {parsed && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard label="총수입" value={parsed.income} icon={<TrendingUp className="w-4 h-4" />} color="text-emerald-600" />
            <SummaryCard label="총지출" value={parsed.totalExpense} icon={<TrendingDown className="w-4 h-4" />} color="text-rose-600" />
            <SummaryCard label="순이익" value={parsed.net} icon={<DollarSign className="w-4 h-4" />} color={parsed.net >= 0 ? 'text-emerald-600' : 'text-rose-600'} showSign />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <p className="text-[13px] font-semibold text-stone-700 mb-4">수입 vs 지출</p>
              <BarItem label="수입" value={parsed.income} max={barMax} color="bg-emerald-500" />
              <BarItem label="지출" value={parsed.totalExpense} max={barMax} color="bg-rose-500" />
              <div className="mt-3 pt-3 border-t border-stone-100">
                <BarItem
                  label={parsed.net >= 0 ? '흑자' : '적자'}
                  value={Math.abs(parsed.net)}
                  max={barMax}
                  color={parsed.net >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}
                  prefix={parsed.net < 0 ? '-' : '+'}
                />
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <p className="text-[13px] font-semibold text-stone-700 mb-4">지출 비중</p>
              {pie.length > 0 ? (
                <div className="space-y-3">
                  {pie.map((p, idx) => (
                    <div key={p.category}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="text-stone-600">{p.category}</span>
                        <span className="text-stone-500 tabular-nums">{p.amount.toLocaleString()}원 · {p.pct}%</span>
                      </div>
                      <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p.pct}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.08 }}
                          className={`h-full rounded-full ${PIE_COLORS[idx % PIE_COLORS.length]}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-stone-400 py-8 text-center">지출 데이터가 없습니다</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, color, showSign }: { label: string; value: number; icon: React.ReactNode; color: string; showSign?: boolean }) {
  const display = showSign ? `${value >= 0 ? '+' : ''}${value.toLocaleString()}원` : `${value.toLocaleString()}원`;
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`${color} opacity-60`}>{icon}</span>
        <p className="text-[10px] tracking-[0.1em] text-stone-400">{label}</p>
      </div>
      <p className={`text-xl font-bold tabular-nums ${color}`}>{display}</p>
    </div>
  );
}

function BarItem({ label, value, max, color, prefix }: { label: string; value: number; max: number; color: string; prefix?: string }) {
  const w = Math.max(4, Math.round((value / max) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[12px] text-stone-600 mb-1.5">
        <span>{label}</span>
        <span className="tabular-nums">{prefix || ''}{value.toLocaleString()}원</span>
      </div>
      <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${w}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}
