import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X, Check, Copy, Send, Trash2 } from 'lucide-react';
import { API, CATEGORIES, TeamTask, TeamLog, getWeekId, getDateStr, formatDate, getHeaders, calcRate, isOwner, weekIdToRange } from './shared';

export default function TabWeekly() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [dateOffset, setDateOffset] = useState(0);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [logs, setLogs] = useState<TeamLog[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ assignee: 'gahyun', category: 'sns', title: '', target: '' });
  const [newLogContent, setNewLogContent] = useState('');
  const [newLogNote, setNewLogNote] = useState('');
  const owner = isOwner();
  const headers = getHeaders();
  const weekId = getWeekId(weekOffset);
  const dateStr = getDateStr(dateOffset);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/team/tasks?weekId=${weekId}`, { headers });
      if (res.ok) setTasks(await res.json());
    } catch {}
  }, [weekId]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/team/logs?date=${dateStr}`, { headers });
      if (res.ok) setLogs(await res.json());
    } catch {}
  }, [dateStr]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const toggleTask = async (task: TeamTask) => {
    if (task.target) {
      const newDone = task.done < task.target ? task.done + 1 : 0;
      await fetch(`${API}/admin/team/tasks/${task.id}`, { method: 'PATCH', headers, body: JSON.stringify({ done: newDone }) });
    } else {
      await fetch(`${API}/admin/team/tasks/${task.id}`, { method: 'PATCH', headers, body: JSON.stringify({ checked: !task.checked }) });
    }
    fetchTasks();
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    await fetch(`${API}/admin/team/tasks`, {
      method: 'POST', headers,
      body: JSON.stringify({ weekId, ...newTask, target: newTask.target ? parseInt(newTask.target) : null }),
    });
    setNewTask({ assignee: 'gahyun', category: 'sns', title: '', target: '' });
    setShowAddTask(false); fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await fetch(`${API}/admin/team/tasks/${id}`, { method: 'DELETE', headers }); fetchTasks();
  };

  const copyWeek = async () => {
    const prev = getWeekId(weekOffset - 1);
    const res = await fetch(`${API}/admin/team/tasks/copy-week`, {
      method: 'POST', headers, body: JSON.stringify({ fromWeekId: prev, toWeekId: weekId }),
    });
    if (res.ok) fetchTasks();
    else { const err = await res.json(); alert(err.error || 'failed'); }
  };

  const addLog = async () => {
    if (!newLogContent.trim()) return;
    await fetch(`${API}/admin/team/logs`, {
      method: 'POST', headers, body: JSON.stringify({ date: dateStr, content: newLogContent, note: newLogNote || null }),
    });
    setNewLogContent(''); setNewLogNote(''); fetchLogs();
  };

  const deleteLog = async (id: string) => {
    await fetch(`${API}/admin/team/logs/${id}`, { method: 'DELETE', headers }); fetchLogs();
  };

  const toggleLogNote = async (log: TeamLog) => {
    const isDone = log.note === '완료';
    const newNote = isDone ? null : '완료';
    await fetch(`${API}/admin/team/logs/${log.id}`, { method: 'DELETE', headers });
    await fetch(`${API}/admin/team/logs`, {
      method: 'POST', headers,
      body: JSON.stringify({ date: log.date, content: log.content, note: newNote }),
    });
    fetchLogs();
  };

  const gahyunTasks = tasks.filter((t) => t.assignee === 'gahyun');
  const dakyumTasks = tasks.filter((t) => t.assignee === 'dakyum');

  const TaskGroup = ({ label, list, color }: { label: string; list: TeamTask[]; color: string }) => {
    const grouped: Record<string, TeamTask[]> = {};
    list.forEach((t) => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });
    const rate = calcRate(list);
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold text-stone-700">{label}</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-stone-100 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${rate}%` }} transition={{ duration: 0.6 }} className={`h-full rounded-full ${color}`} />
            </div>
            <span className="text-[13px] font-bold text-stone-700 tabular-nums">{rate}%</span>
          </div>
        </div>
        {list.length === 0 ? (
          <p className="text-[12px] text-stone-300 text-center py-6">항목 없음</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([cat, items]) => {
              const c = CATEGORIES[cat] || { label: cat, color: 'bg-stone-100 text-stone-500' };
              return (
                <div key={cat}>
                  <p className={`text-[10px] font-semibold tracking-[0.1em] mb-1.5 px-1 ${c.color.split(' ')[1]}`}>{c.label.toUpperCase()}</p>
                  <div className="space-y-1">
                    {items.map((task) => {
                      const isComplete = task.target ? task.done >= task.target : task.checked;
                      return (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task)}
                          className={`group flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all ${
                            isComplete ? 'bg-stone-100/60' : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isComplete ? 'bg-stone-800 border-stone-800' : 'border-stone-300'
                          }`}>
                            {isComplete && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={`text-[13px] flex-1 transition-colors ${
                            isComplete ? 'line-through text-stone-400' : 'text-stone-700'
                          }`}>{task.title}</span>
                          {task.target && (
                            <span className={`text-[12px] font-mono tabular-nums px-2 py-0.5 rounded-md ${
                              isComplete ? 'bg-stone-200 text-stone-500' : 'bg-stone-100 text-stone-500'
                            }`}>{task.done}/{task.target}</span>
                          )}
                          {owner && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-stone-200 rounded-lg transition-all"
                            >
                              <X className="w-3 h-3 text-stone-400" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1.5 hover:bg-stone-100 rounded-lg"><ChevronLeft className="w-4 h-4 text-stone-500" /></button>
            <span className="text-[13px] font-semibold text-stone-800 min-w-[120px] text-center">{weekIdToRange(weekId)}</span>
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1.5 hover:bg-stone-100 rounded-lg"><ChevronRight className="w-4 h-4 text-stone-500" /></button>
            {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-[11px] text-stone-400 hover:text-stone-600 ml-1">today</button>}
          </div>
          <div className="flex items-center gap-1.5">
            {owner && tasks.length === 0 && (
              <button onClick={copyWeek} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-stone-500 hover:bg-stone-100 rounded-lg"><Copy className="w-3 h-3" /> 지난주 복사</button>
            )}
            {owner && (
              <button onClick={() => setShowAddTask(!showAddTask)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] bg-stone-800 text-white rounded-lg hover:bg-stone-900"><Plus className="w-3 h-3" /> 항목</button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {showAddTask && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-stone-100">
              <div className="p-4 bg-stone-50/50 flex gap-2 flex-wrap">
                <select value={newTask.assignee} onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })} className="text-[12px] border border-stone-200 rounded-lg px-2.5 py-2 bg-white outline-none">
                  <option value="gahyun">가현</option><option value="dakyum">다겸</option>
                </select>
                <select value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value })} className="text-[12px] border border-stone-200 rounded-lg px-2.5 py-2 bg-white outline-none">
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="할 일" className="flex-1 min-w-[120px] text-[13px] border border-stone-200 rounded-lg px-3 py-2 bg-white outline-none" />
                <input value={newTask.target} onChange={(e) => setNewTask({ ...newTask, target: e.target.value })} placeholder="목표수" type="number" className="w-[70px] text-[13px] border border-stone-200 rounded-lg px-3 py-2 bg-white outline-none" />
                <button onClick={addTask} className="px-4 py-2 bg-stone-800 text-white text-[12px] rounded-lg hover:bg-stone-900">추가</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {tasks.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-[13px] text-stone-400">이번 주 체크리스트가 비어있어요</p>
            {owner && <p className="text-[11px] text-stone-300 mt-1">지난주 복사하거나 새 항목을 추가해보세요</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-100">
            <TaskGroup label="가현" list={gahyunTasks} color="bg-pink-400" />
            <TaskGroup label="다겸" list={dakyumTasks} color="bg-stone-700" />
          </div>
        )}
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <button onClick={() => setDateOffset(dateOffset - 1)} className="p-1.5 hover:bg-stone-100 rounded-lg"><ChevronLeft className="w-4 h-4 text-stone-500" /></button>
            <span className="text-[13px] font-semibold text-stone-800 min-w-[100px] text-center">{formatDate(dateStr)}</span>
            <button onClick={() => setDateOffset(dateOffset + 1)} className="p-1.5 hover:bg-stone-100 rounded-lg"><ChevronRight className="w-4 h-4 text-stone-500" /></button>
            {dateOffset !== 0 && <button onClick={() => setDateOffset(0)} className="text-[11px] text-stone-400 hover:text-stone-600 ml-1">today</button>}
          </div>
          <span className="text-[10px] tracking-[0.1em] text-stone-400 font-medium">DAILY LOG</span>
        </div>
        <div className="p-3">
          {logs.length === 0 ? (
            <p className="text-[12px] text-stone-300 text-center py-6">기록이 없어요</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => {
                const isDone = log.note === '완료';
                return (
                  <div key={log.id} className="group flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-stone-50 transition-colors">
                    <span className={`text-[11px] font-semibold flex-shrink-0 w-7 ${log.userName === '다겸' ? 'text-stone-700' : 'text-pink-600'}`}>{log.userName}</span>
                    <p className={`text-[13px] flex-1 leading-relaxed ${isDone ? 'text-stone-400' : 'text-stone-600'}`}>{log.content}</p>
                    <button
                      onClick={() => toggleLogNote(log)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex-shrink-0 ${
                        isDone
                          ? 'bg-stone-800 text-white'
                          : 'bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600'
                      }`}
                    >
                      {isDone ? '완료' : '진행중'}
                    </button>
                    <button onClick={() => deleteLog(log.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-stone-200 rounded-lg flex-shrink-0"><Trash2 className="w-3 h-3 text-stone-400" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="px-3 pb-3">
          <div className="flex gap-2">
            <input value={newLogContent} onChange={(e) => setNewLogContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLog()} placeholder="오늘 한 일 기록..." className="flex-1 text-[13px] border border-stone-200 rounded-lg px-3 py-2.5 outline-none focus:border-stone-400" />
            <button onClick={addLog} disabled={!newLogContent.trim()} className="px-3.5 py-2.5 bg-stone-800 text-white rounded-lg hover:bg-stone-900 disabled:opacity-30"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
