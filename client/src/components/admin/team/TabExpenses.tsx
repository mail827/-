import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Trash2, Receipt } from 'lucide-react';
import { API, getHeaders, isOwner } from './shared';

interface Expense {
  id: string;
  date: string;
  title: string;
  category: string;
  amount: number;
  memo: string | null;
}

const EXPENSE_CATEGORIES: Record<string, { label: string; color: string }> = {
  server: { label: '서버/인프라', color: 'bg-emerald-50 text-emerald-600' },
  api: { label: 'API/AI', color: 'bg-cyan-50 text-cyan-600' },
  marketing: { label: '마케팅/광고', color: 'bg-orange-50 text-orange-600' },
  domain: { label: '도메인/호스팅', color: 'bg-blue-50 text-blue-600' },
  design: { label: '디자인/폰트', color: 'bg-pink-50 text-pink-600' },
  tool: { label: '툴/구독', color: 'bg-purple-50 text-purple-600' },
  etc: { label: '기타', color: 'bg-stone-100 text-stone-600' },
};

export default function TabExpenses() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [data, setData] = useState<{ expenses: Expense[]; total: number; byCategory: Record<string, number> } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: '', title: '', category: 'server', amount: '', memo: '' });
  const owner = isOwner();
  const headers = getHeaders();

  const getMonth = (offset: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  };

  const month = getMonth(monthOffset);
  const monthLabel = (() => {
    const [y, m] = month.split('-');
    return y + '년 ' + parseInt(m) + '월';
  })();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(API + '/admin/team/expenses?month=' + month, { headers });
      if (res.ok) setData(await res.json());
    } catch {}
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const todayStr = (() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  })();

  const addExpense = async () => {
    if (!form.title.trim() || !form.amount) return;
    await fetch(API + '/admin/team/expenses', {
      method: 'POST', headers,
      body: JSON.stringify({
        date: form.date || todayStr,
        title: form.title,
        category: form.category,
        amount: parseInt(form.amount),
        memo: form.memo || null,
      }),
    });
    setForm({ date: '', title: '', category: 'server', amount: '', memo: '' });
    setShowAdd(false);
    fetchData();
  };

  const deleteExpense = async (id: string) => {
    await fetch(API + '/admin/team/expenses/' + id, { method: 'DELETE', headers });
    fetchData();
  };

  const fmt = (n: number) => n.toLocaleString('ko-KR');

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return parseInt(parts[1]) + '/' + parseInt(parts[2]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthOffset(monthOffset - 1)} className="p-1.5 hover:bg-stone-100 rounded-lg"><ChevronLeft className="w-4 h-4 text-stone-500" /></button>
          <span className="text-[14px] font-semibold text-stone-800 min-w-[120px] text-center">{monthLabel}</span>
          <button onClick={() => setMonthOffset(monthOffset + 1)} className="p-1.5 hover:bg-stone-100 rounded-lg"><ChevronRight className="w-4 h-4 text-stone-500" /></button>
          {monthOffset !== 0 && <button onClick={() => setMonthOffset(0)} className="text-[11px] text-stone-400 hover:text-stone-600">이번달</button>}
        </div>
        {owner && (
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-1.5 text-[11px] bg-stone-800 text-white rounded-lg hover:bg-stone-900">
            <Plus className="w-3 h-3" /> 추가
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="text-[12px] border border-stone-200 rounded-lg px-2.5 py-2 bg-white outline-none" />
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="text-[12px] border border-stone-200 rounded-lg px-2.5 py-2 bg-white outline-none">
                  {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="항목명" className="flex-1 min-w-[120px] text-[13px] border border-stone-200 rounded-lg px-3 py-2 bg-white outline-none" />
                <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="금액(원)" type="number" className="w-[100px] text-[13px] border border-stone-200 rounded-lg px-3 py-2 bg-white outline-none" />
                <input value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="메모" className="w-[120px] text-[12px] border border-stone-200 rounded-lg px-2.5 py-2 bg-white outline-none" />
                <button onClick={addExpense} className="px-4 py-2 bg-stone-800 text-white text-[12px] rounded-lg hover:bg-stone-900">추가</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-stone-900 rounded-xl p-4 text-white col-span-2 sm:col-span-1">
          <p className="text-[10px] tracking-[0.12em] text-stone-500 mb-1">TOTAL</p>
          <p className="text-xl font-bold tabular-nums">{fmt(data?.total || 0)}<span className="text-[11px] text-stone-400 ml-1">원</span></p>
        </div>
        {data && Object.entries(data.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cat, amount]) => {
          const c = EXPENSE_CATEGORIES[cat] || { label: cat, color: 'bg-stone-100 text-stone-500' };
          return (
            <div key={cat} className="bg-white border border-stone-200 rounded-xl p-4">
              <p className={'text-[10px] font-medium mb-1 ' + c.color.split(' ')[1]}>{c.label}</p>
              <p className="text-[15px] font-bold text-stone-800 tabular-nums">{fmt(amount)}<span className="text-[11px] text-stone-400 ml-0.5">원</span></p>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-stone-400" />
          <span className="text-[13px] font-semibold text-stone-800">영수 내역</span>
          <span className="text-[11px] text-stone-400 ml-auto">{data?.expenses.length || 0}건</span>
        </div>
        {!data || data.expenses.length === 0 ? (
          <div className="py-12 text-center"><p className="text-[13px] text-stone-300">이번 달 영수 내역이 없어요</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="px-4 py-2.5 text-left text-[10px] tracking-[0.1em] text-stone-400 font-medium w-16">날짜</th>
                  <th className="px-4 py-2.5 text-left text-[10px] tracking-[0.1em] text-stone-400 font-medium w-20">카테고리</th>
                  <th className="px-4 py-2.5 text-left text-[10px] tracking-[0.1em] text-stone-400 font-medium">항목</th>
                  <th className="px-4 py-2.5 text-right text-[10px] tracking-[0.1em] text-stone-400 font-medium w-24">금액</th>
                  <th className="px-4 py-2.5 text-left text-[10px] tracking-[0.1em] text-stone-400 font-medium w-28">메모</th>
                  {owner && <th className="w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((e) => {
                  const c = EXPENSE_CATEGORIES[e.category] || { label: e.category, color: 'bg-stone-100 text-stone-500' };
                  return (
                    <tr key={e.id} className="border-b border-stone-50 hover:bg-stone-50/50 group transition-colors">
                      <td className="px-4 py-2.5 text-stone-400 tabular-nums text-[12px]">{formatDate(e.date)}</td>
                      <td className="px-4 py-2.5"><span className={'text-[10px] px-1.5 py-0.5 rounded-full font-medium ' + c.color}>{c.label}</span></td>
                      <td className="px-4 py-2.5 text-stone-700">{e.title}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-stone-800 tabular-nums">{fmt(e.amount)}</td>
                      <td className="px-4 py-2.5 text-[12px] text-stone-400">{e.memo || '-'}</td>
                      {owner && (
                        <td className="px-2 py-2.5">
                          <button onClick={() => deleteExpense(e.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-stone-200 rounded-lg transition-all">
                            <Trash2 className="w-3 h-3 text-stone-400" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
