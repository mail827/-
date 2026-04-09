import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Flame, Code2, Megaphone, ChevronLeft, ChevronRight, Trash2, RefreshCw, Copy, Check, AlertTriangle, Film } from 'lucide-react';
import { API, getWeekId, getHeaders, isOwner, weekIdToRange } from './shared';

interface Insight {
  id: string;
  weekId: string;
  type: string;
  title: string;
  content: string;
  metadata: any;
  createdAt: string;
}

const TYPES = [
  { id: 'all', label: '전체' },
  { id: 'trend', label: '트렌드' },
  { id: 'painpoint', label: '빡침포인트' },
  { id: 'devlog', label: '개발로그' },
  { id: 'hook', label: '후킹카피' },
  { id: 'shortform', label: '숏폼대본' },
  { id: 'longform', label: '롱폼기획' },
  { id: 'scenario', label: '시나리오' },
] as const;

const TYPE_CONFIG: Record<string, { icon: any; label: string; accent: string; bg: string; border: string }> = {
  trend: { icon: TrendingUp, label: 'HOT TREND', accent: 'text-blue-600', bg: 'bg-blue-50/60', border: 'border-blue-200/40' },
  painpoint: { icon: Flame, label: 'PAIN POINT', accent: 'text-red-600', bg: 'bg-red-50/60', border: 'border-red-200/40' },
  devlog: { icon: Code2, label: 'DEV LOG', accent: 'text-emerald-600', bg: 'bg-emerald-50/60', border: 'border-emerald-200/40' },
  hook: { icon: Megaphone, label: 'HOOK', accent: 'text-violet-600', bg: 'bg-violet-50/60', border: 'border-violet-200/40' },
  shortform: { icon: Film, label: 'SHORTFORM SCRIPT', accent: 'text-orange-600', bg: 'bg-orange-50/60', border: 'border-orange-200/40' },
  longform: { icon: Film, label: 'LONGFORM PLAN', accent: 'text-indigo-600', bg: 'bg-indigo-50/60', border: 'border-indigo-200/40' },
  scenario: { icon: Film, label: 'SCENARIO', accent: 'text-rose-600', bg: 'bg-rose-50/60', border: 'border-rose-200/40' },
  error: { icon: AlertTriangle, label: 'ERROR', accent: 'text-amber-600', bg: 'bg-amber-50/60', border: 'border-amber-200/40' },
};

const DEFAULT_CONFIG = { icon: Film, label: 'INSIGHT', accent: 'text-stone-600', bg: 'bg-stone-50/60', border: 'border-stone-200/50' };

export default function TabMarketing() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string>('all');
  const owner = isOwner();
  const headers = getHeaders();
  const weekId = getWeekId(weekOffset);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/marketing/insights?weekId=${weekId}`, { headers });
      if (res.ok) setInsights(await res.json());
    } catch {} finally { setLoading(false); }
  }, [weekId]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API}/admin/marketing/generate`, { method: 'POST', headers });
      if (res.ok) {
        await fetchInsights();
      } else {
        const err = await res.json();
        alert(err.error || 'failed');
      }
    } catch (e: any) {
      alert(e.message || 'failed');
    } finally { setGenerating(false); }
  };

  const deleteInsight = async (id: string) => {
    await fetch(`${API}/admin/marketing/insights/${id}`, { method: 'DELETE', headers });
    fetchInsights();
  };

  const copyContent = (insight: Insight) => {
    const text = typeof insight.content === 'string' ? insight.content : String(insight.content ?? '');
    navigator.clipboard.writeText(text);
    setCopiedId(insight.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const normalizeText = (value: unknown) => (typeof value === 'string' ? value : String(value ?? ''));
  const meta = insights[0]?.metadata;
  const filtered = activeType === 'all' ? insights.filter(i => i.type !== 'error') : insights.filter(i => i.type === activeType);
  const errors = insights.filter(i => i.type === 'error');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-stone-500" />
            <span className="text-[10px] tracking-[0.15em] text-stone-400 font-medium">MARKETING AI</span>
          </div>
          <p className="text-[12px] text-stone-400">web search + 자동 수집 + 콘텐츠 가이드</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1.5 hover:bg-stone-100 rounded-lg">
            <ChevronLeft className="w-4 h-4 text-stone-400" />
          </button>
          <span className="text-[12px] text-stone-600 tabular-nums min-w-[100px] text-center">{weekIdToRange(weekId)}</span>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1.5 hover:bg-stone-100 rounded-lg">
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-[10px] text-stone-400 hover:text-stone-600">today</button>
          )}
        </div>
      </div>

      {meta && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'INVITATION', val: meta.orderSummary?.total || 0, sub: (meta.orderSummary?.revenue || 0).toLocaleString() + '원' },
            { label: 'AI SNAP', val: meta.snapSummary?.total || 0, sub: (meta.snapSummary?.revenue || 0).toLocaleString() + '원' },
            { label: 'CINEMA', val: meta.videoSummary?.total || 0, sub: null },
          ].map(item => (
            <div key={item.label} className="bg-white border border-stone-200 rounded-xl p-4">
              <p className="text-[10px] tracking-[0.1em] text-stone-400 mb-1">{item.label}</p>
              <p className="text-xl font-bold text-stone-800 tabular-nums">{item.val}<span className="text-[11px] font-normal text-stone-400 ml-1">건</span></p>
              {item.sub && <p className="text-[11px] text-stone-400 mt-0.5">{item.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {owner && weekOffset === 0 && (
        <button
          onClick={generate}
          disabled={generating}
          className="w-full py-3 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2 bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              AI가 웹 검색 + 분석 중... 최대 1분
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              이번 주 인사이트 생성
            </>
          )}
        </button>
      )}

      {insights.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TYPES.map(t => {
            const count = t.id === 'all' ? insights.filter(i => i.type !== 'error').length : insights.filter(i => i.type === t.id).length;
            if (t.id !== 'all' && count === 0) return null;
            return (
              <button
                key={t.id}
                onClick={() => setActiveType(t.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] whitespace-nowrap transition-all ${
                  activeType === t.id
                    ? 'bg-stone-800 text-white font-medium'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {t.label} {count > 0 && <span className="ml-1 text-[10px] opacity-60">{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-5 h-5 text-stone-300 animate-spin mx-auto mb-2" />
          <p className="text-[13px] text-stone-300">로딩 중...</p>
        </div>
      ) : filtered.length === 0 && errors.length === 0 ? (
        <div className="py-16 text-center">
          <Zap className="w-6 h-6 text-stone-200 mx-auto mb-2" />
          <p className="text-[13px] text-stone-300">아직 생성된 인사이트가 없어요</p>
          {owner && weekOffset === 0 && <p className="text-[11px] text-stone-300 mt-1">위 버튼을 눌러 AI 분석을 시작하세요</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(insight => {
            const config = TYPE_CONFIG[insight.type] || DEFAULT_CONFIG;
            const Icon = config.icon;
            const isExpanded = expandedId === insight.id;
            const paragraphs = normalizeText(insight.content).split('\n').filter(l => l.trim());
            const preview = paragraphs.slice(0, 6);
            const needsTruncate = paragraphs.length > 6;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${config.bg} border ${config.border} rounded-xl overflow-hidden`}
              >
                <div className="px-5 py-3 flex items-center justify-between border-b border-black/5">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${config.accent}`} />
                    <span className={`text-[10px] font-semibold tracking-[0.12em] ${config.accent}`}>{config.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => copyContent(insight)} className="p-1.5 hover:bg-white/60 rounded-lg transition-colors" title="복사">
                      {copiedId === insight.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                    </button>
                    {owner && (
                      <button onClick={() => deleteInsight(insight.id)} className="p-1.5 hover:bg-white/60 rounded-lg transition-colors" title="삭제">
                        <Trash2 className="w-3.5 h-3.5 text-stone-400" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-5 py-4">
                  <h3 className="text-[15px] font-bold text-stone-800 mb-3">{insight.title}</h3>
                  <div className="space-y-2">
                    {(isExpanded || !needsTruncate ? paragraphs : preview).map((line, idx) => (
                      <p key={idx} className="text-[13px] text-stone-600 leading-[1.75]">{line}</p>
                    ))}
                  </div>
                  {needsTruncate && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                      className="mt-3 text-[12px] font-medium text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      {isExpanded ? '접기' : '더보기'}
                    </button>
                  )}
                </div>
                <div className="px-5 py-2 border-t border-black/5">
                  <p className="text-[10px] text-stone-400">
                    {new Date(insight.createdAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} 생성
                  </p>
                </div>
              </motion.div>
            );
          })}
          {errors.length > 0 && activeType === 'all' && errors.map(e => (
            <div key={e.id} className="bg-amber-50/60 border border-amber-200/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-semibold tracking-[0.12em] text-amber-600">ERROR</span>
                </div>
                {owner && (
                  <button onClick={() => deleteInsight(e.id)} className="p-1 hover:bg-amber-100 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5 text-amber-500" />
                  </button>
                )}
              </div>
              <p className="text-[13px] text-amber-800 leading-relaxed line-clamp-3">응답 형식 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
