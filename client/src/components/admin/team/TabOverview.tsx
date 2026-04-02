import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Plus, X, Check, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { API, TeamTask, TeamNotice, TeamFocusItem, getWeekId, getHeaders, calcRate, isOwner, weekIdToRange } from './shared';

export default function TabOverview() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [notices, setNotices] = useState<TeamNotice[]>([]);
  const [focusItems, setFocusItems] = useState<TeamFocusItem[]>([]);
  const [showAddNotice, setShowAddNotice] = useState(false);
  const [showAddFocus, setShowAddFocus] = useState(false);
  const [newNotice, setNewNotice] = useState('');
  const [newFocus, setNewFocus] = useState({ title: '', assignee: 'gahyun', deadline: '', priority: 0 });
  const owner = isOwner();
  const headers = getHeaders();
  const weekId = getWeekId(weekOffset);

  const fetchAll = useCallback(async () => {
    try {
      const [tRes, nRes, fRes] = await Promise.all([
        fetch(`${API}/admin/team/tasks?weekId=${weekId}`, { headers }),
        fetch(`${API}/admin/team/notices`, { headers }),
        fetch(`${API}/admin/team/focus?weekId=${weekId}`, { headers }),
      ]);
      if (tRes.ok) setTasks(await tRes.json());
      if (nRes.ok) setNotices(await nRes.json());
      if (fRes.ok) setFocusItems(await fRes.json());
    } catch {}
  }, [weekId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const gahyunTasks = tasks.filter((t) => t.assignee === 'gahyun');
  const dakyumTasks = tasks.filter((t) => t.assignee === 'dakyum');
  const gahyunRate = calcRate(gahyunTasks);
  const dakyumRate = calcRate(dakyumTasks);

  const addNotice = async () => {
    if (!newNotice.trim()) return;
    await fetch(`${API}/admin/team/notices`, { method: 'POST', headers, body: JSON.stringify({ content: newNotice }) });
    setNewNotice(''); setShowAddNotice(false); fetchAll();
  };

  const deleteNotice = async (id: string) => {
    await fetch(`${API}/admin/team/notices/${id}`, { method: 'DELETE', headers }); fetchAll();
  };

  const addFocus = async () => {
    if (!newFocus.title.trim()) return;
    const maxP = focusItems.length > 0 ? Math.max(...focusItems.map((f) => f.priority)) + 1 : 1;
    await fetch(`${API}/admin/team/focus`, {
      method: 'POST', headers,
      body: JSON.stringify({ weekId, ...newFocus, priority: newFocus.priority || maxP }),
    });
    setNewFocus({ title: '', assignee: 'gahyun', deadline: '', priority: 0 }); setShowAddFocus(false); fetchAll();
  };

  const toggleFocus = async (item: TeamFocusItem) => {
    await fetch(`${API}/admin/team/focus/${item.id}`, { method: 'PATCH', headers, body: JSON.stringify({ done: !item.done }) });
    fetchAll();
  };

  const deleteFocus = async (id: string) => {
    await fetch(`${API}/admin/team/focus/${id}`, { method: 'DELETE', headers }); fetchAll();
  };

  const RateBar = ({ label, rate, color }: { label: string; rate: number; color: string }) => (
    <div className="flex items-center gap-3">
      <span className="text-[12px] font-semibold text-stone-600 w-8">{label}</span>
      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={`h-full rounded-full ${color}`} />
      </div>
      <span className="text-[13px] font-bold text-stone-700 tabular-nums w-10 text-right">{rate}%</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="bg-amber-50/60 border border-amber-200/40 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-semibold text-amber-700 tracking-[0.12em]">NOTICE</span>
          </div>
          {owner && (
            <button onClick={() => setShowAddNotice(!showAddNotice)} className="p-1 hover:bg-amber-100 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5 text-amber-600" />
            </button>
          )}
        </div>
        {notices.length === 0 && <p className="text-[12px] text-amber-600/60">공지사항이 없습니다</p>}
        {notices.map((n) => (
          <div key={n.id} className="flex items-start justify-between group">
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-amber-500 mt-0.5 flex-shrink-0">{new Date(n.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</span>
              <p className="text-[13px] text-amber-900 leading-relaxed">{n.content}</p>
            </div>
            {owner && (
              <button onClick={() => deleteNotice(n.id)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-amber-100 rounded ml-2 flex-shrink-0">
                <X className="w-3 h-3 text-amber-500" />
              </button>
            )}
          </div>
        ))}
        <AnimatePresence>
          {showAddNotice && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex gap-2 pt-1">
                <input value={newNotice} onChange={(e) => setNewNotice(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNotice()} placeholder="공지 내용..." className="flex-1 text-[13px] bg-white border border-amber-200 rounded-lg px-3 py-2 outline-none focus:border-amber-400" />
                <button onClick={addNotice} className="px-3 py-2 bg-amber-600 text-white rounded-lg text-[12px] font-medium hover:bg-amber-700 transition-colors">추가</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-stone-500" />
            <span className="text-[13px] font-semibold text-stone-800">이번 주 포커스</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1 hover:bg-stone-100 rounded-lg"><ChevronLeft className="w-4 h-4 text-stone-400" /></button>
            <span className="text-[12px] text-stone-600 tabular-nums">{weekIdToRange(weekId)}</span>
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1 hover:bg-stone-100 rounded-lg"><ChevronRight className="w-4 h-4 text-stone-400" /></button>
            {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-[10px] text-stone-400 hover:text-stone-600">today</button>}
            {owner && <button onClick={() => setShowAddFocus(!showAddFocus)} className="ml-2 flex items-center gap-1 px-2 py-1.5 text-[11px] bg-stone-800 text-white rounded-lg hover:bg-stone-900"><Plus className="w-3 h-3" /></button>}
          </div>
        </div>
        <AnimatePresence>
          {showAddFocus && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-stone-100">
              <div className="p-4 bg-stone-50/50 flex gap-2 flex-wrap">
                <input value={String(newFocus.priority || '')} onChange={(e) => setNewFocus({ ...newFocus, priority: parseInt(e.target.value) || 0 })} placeholder="#" className="w-12 text-[12px] border border-stone-200 rounded-lg px-2 py-2 bg-white text-center outline-none" />
                <input value={newFocus.title} onChange={(e) => setNewFocus({ ...newFocus, title: e.target.value })} placeholder="할 일" className="flex-1 min-w-[150px] text-[13px] border border-stone-200 rounded-lg px-3 py-2 bg-white outline-none" />
                <select value={newFocus.assignee} onChange={(e) => setNewFocus({ ...newFocus, assignee: e.target.value })} className="text-[12px] border border-stone-200 rounded-lg px-2.5 py-2 bg-white outline-none">
                  <option value="gahyun">가현</option>
                  <option value="dakyum">다겸</option>
                </select>
                <input value={newFocus.deadline} onChange={(e) => setNewFocus({ ...newFocus, deadline: e.target.value })} placeholder="마감 (예: 4/4금)" className="w-24 text-[12px] border border-stone-200 rounded-lg px-2.5 py-2 bg-white outline-none" />
                <button onClick={addFocus} className="px-4 py-2 bg-stone-800 text-white text-[12px] rounded-lg hover:bg-stone-900">추가</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {focusItems.length === 0 ? (
          <div className="py-10 text-center"><p className="text-[13px] text-stone-300">이번 주 포커스가 비어있어요</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="px-4 py-2.5 text-left text-[10px] tracking-[0.1em] text-stone-400 font-medium w-10">#</th>
                  <th className="px-4 py-2.5 text-left text-[10px] tracking-[0.1em] text-stone-400 font-medium">할 일</th>
                  <th className="px-4 py-2.5 text-left text-[10px] tracking-[0.1em] text-stone-400 font-medium w-16">담당</th>
                  <th className="px-4 py-2.5 text-left text-[10px] tracking-[0.1em] text-stone-400 font-medium w-20">마감</th>
                  <th className="px-4 py-2.5 text-center text-[10px] tracking-[0.1em] text-stone-400 font-medium w-14">완료</th>
                  {owner && <th className="w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {focusItems.map((item) => (
                  <tr key={item.id} className="border-b border-stone-50 hover:bg-stone-50/50 group transition-colors">
                    <td className="px-4 py-2.5 text-stone-400 tabular-nums">{item.priority}</td>
                    <td className={`px-4 py-2.5 ${item.done ? 'line-through text-stone-400' : 'text-stone-700'}`}>{item.title}</td>
                    <td className="px-4 py-2.5"><span className={`text-[11px] font-medium ${item.assignee === 'dakyum' ? 'text-stone-700' : 'text-pink-600'}`}>{item.assignee === 'dakyum' ? '다겸' : '가현'}</span></td>
                    <td className="px-4 py-2.5 text-[12px] text-stone-400">{item.deadline || '-'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <button onClick={() => toggleFocus(item)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mx-auto transition-all ${item.done ? 'bg-stone-800 border-stone-800' : 'border-stone-300 hover:border-stone-500'}`}>
                        {item.done && <Check className="w-3 h-3 text-white" />}
                      </button>
                    </td>
                    {owner && (
                      <td className="px-2 py-2.5">
                        <button onClick={() => deleteFocus(item.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-stone-200 rounded transition-all"><X className="w-3 h-3 text-stone-400" /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <p className="text-[10px] tracking-[0.12em] text-stone-400 font-medium mb-4">WEEKLY COMPLETION</p>
          <div className="space-y-3">
            <RateBar label="가현" rate={gahyunRate} color="bg-pink-400" />
            <RateBar label="다겸" rate={dakyumRate} color="bg-stone-700" />
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[11px] text-stone-400">전체 {tasks.length}개 항목</span>
            <span className="text-[11px] text-stone-400">완료 {tasks.filter((t) => (t.target ? t.done >= t.target : t.checked)).length}개</span>
          </div>
        </div>

        <div className="bg-stone-900 rounded-xl p-5 text-white">
          <p className="text-[10px] tracking-[0.12em] text-stone-500 font-medium mb-4">TEAM AGREEMENT</p>
          <div className="space-y-3 text-[12px] text-stone-300 leading-relaxed">
            <div>
              <p className="text-[10px] text-stone-500 mb-1 tracking-wide">MEETING</p>
              <p>매주 수요일 오전 10시 정기 회의</p>
            </div>
            <div>
              <p className="text-[10px] text-stone-500 mb-1 tracking-wide">RECORD</p>
              <p>매일 퇴근 전 한 일 + 비고 기록</p>
            </div>
            <div>
              <p className="text-[10px] text-stone-500 mb-1 tracking-wide">PRINCIPLE</p>
              <p>못 하겠으면 솔직하게. 감정이 아니라 기록으로.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
