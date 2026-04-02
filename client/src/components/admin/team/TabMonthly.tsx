import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { API, CATEGORIES, getHeaders, isOwner } from './shared';

interface MonthlySummary {
  gahyunRate: number; dakyumRate: number;
  gahyunByCategory: Record<string, number>; dakyumByCategory: Record<string, number>;
  gahyunTotal: number; dakyumTotal: number;
  metrics: Record<string, string>; reviews: Record<string, string>;
}

const METRIC_KEYS = [
  { key: 'insta_followers', label: '인스타 팔로워' },
  { key: 'youtube_subs', label: '유튜브 구독자' },
  { key: 'blog_visitors', label: '블로그 방문자' },
  { key: 'smartstore_views', label: '스마트스토어 유입' },
  { key: 'site_visitors', label: '사이트 방문자' },
  { key: 'total_orders', label: '총 결제 건수' },
  { key: 'revenue', label: '총 매출' },
];

const REVIEW_FIELDS = [
  { field: 'gahyun_review', label: '가현 한줄 회고' },
  { field: 'dakyum_review', label: '다겸 한줄 회고' },
  { field: 'good', label: '이번 달 잘한 점' },
  { field: 'improve', label: '이번 달 개선할 점' },
  { field: 'next_focus', label: '다음 달 중점 사항' },
];

export default function TabMonthly() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [data, setData] = useState<MonthlySummary | null>(null);
  const [metricInputs, setMetricInputs] = useState<Record<string, string>>({});
  const [reviewInputs, setReviewInputs] = useState<Record<string, string>>({});
  
  const owner = isOwner();
  const headers = getHeaders();

  const getMonth = (offset: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const month = getMonth(monthOffset);
  const monthLabel = (() => {
    const [y, m] = month.split('-');
    return `${y}년 ${parseInt(m)}월`;
  })();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/team/monthly/summary?month=${month}`, { headers });
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setMetricInputs(d.metrics || {});
        setReviewInputs(d.reviews || {});
      }
    } catch {}
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveMetric = async (key: string) => {
    await fetch(`${API}/admin/team/metrics`, { method: 'POST', headers, body: JSON.stringify({ month, key, value: metricInputs[key] || '' }) });
  };

  const saveReview = async (field: string) => {
    await fetch(`${API}/admin/team/reviews`, { method: 'POST', headers, body: JSON.stringify({ month, field, content: reviewInputs[field] || '' }) });
  };

  const RateRow = ({ label, rate, color }: { label: string; rate: number; color: string }) => (
    <div className="flex items-center gap-3 py-1">
      <span className="text-[12px] text-stone-500 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${rate}%` }} />
      </div>
      <span className="text-[12px] font-bold text-stone-600 tabular-nums w-10 text-right">{rate}%</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={() => setMonthOffset(monthOffset - 1)} className="p-1.5 hover:bg-stone-100 rounded-lg"><ChevronLeft className="w-4 h-4 text-stone-500" /></button>
        <span className="text-[14px] font-semibold text-stone-800 min-w-[120px] text-center">{monthLabel}</span>
        <button onClick={() => setMonthOffset(monthOffset + 1)} className="p-1.5 hover:bg-stone-100 rounded-lg"><ChevronRight className="w-4 h-4 text-stone-500" /></button>
        {monthOffset !== 0 && <button onClick={() => setMonthOffset(0)} className="text-[11px] text-stone-400 hover:text-stone-600">이번달</button>}
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-[10px] tracking-[0.12em] text-stone-400 font-medium mb-3">가현 업무 완료율</p>
            <div className="mb-3"><RateRow label="전체" rate={data.gahyunRate} color="bg-pink-400" /></div>
            {Object.entries(data.gahyunByCategory).map(([cat, rate]) => (
              <RateRow key={cat} label={CATEGORIES[cat]?.label || cat} rate={rate} color="bg-pink-300" />
            ))}
            {data.gahyunTotal === 0 && <p className="text-[12px] text-stone-300 text-center py-4">데이터 없음</p>}
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-[10px] tracking-[0.12em] text-stone-400 font-medium mb-3">다겸 업무 완료율</p>
            <div className="mb-3"><RateRow label="전체" rate={data.dakyumRate} color="bg-stone-700" /></div>
            {Object.entries(data.dakyumByCategory).map(([cat, rate]) => (
              <RateRow key={cat} label={CATEGORIES[cat]?.label || cat} rate={rate} color="bg-stone-500" />
            ))}
            {data.dakyumTotal === 0 && <p className="text-[12px] text-stone-300 text-center py-4">데이터 없음</p>}
          </div>
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <p className="text-[10px] tracking-[0.12em] text-stone-400 font-medium">PERFORMANCE METRICS</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {METRIC_KEYS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[12px] text-stone-500 w-28 flex-shrink-0">{label}</span>
                <input
                  value={metricInputs[key] || ''}
                  onChange={(e) => setMetricInputs({ ...metricInputs, [key]: e.target.value })}
                  onBlur={() => saveMetric(key)}
                  placeholder="-"
                  disabled={!owner}
                  className="flex-1 text-[13px] border border-stone-200 rounded-lg px-3 py-1.5 outline-none focus:border-stone-400 disabled:bg-stone-50 tabular-nums"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <p className="text-[10px] tracking-[0.12em] text-stone-400 font-medium">REVIEW</p>
        </div>
        <div className="p-4 space-y-4">
          {REVIEW_FIELDS.map(({ field, label }) => (
            <div key={field}>
              <label className="text-[12px] font-medium text-stone-600 block mb-1.5">{label}</label>
              <div className="flex gap-2">
                <input
                  value={reviewInputs[field] || ''}
                  onChange={(e) => setReviewInputs({ ...reviewInputs, [field]: e.target.value })}
                  placeholder="작성..."
                  className="flex-1 text-[13px] border border-stone-200 rounded-lg px-3 py-2 outline-none focus:border-stone-400"
                />
                <button onClick={() => saveReview(field)} className="px-3 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors">
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
