import { useState, useEffect } from 'react';
import { RefreshCw, Globe, TrendingUp } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL;

interface ChannelData { name: string; count: number; }
interface CampaignData { name: string; count: number; }
interface DailyData { date: string; count: number; }
interface TrafficData { total: number; channels: ChannelData[]; campaigns: CampaignData[]; daily: DailyData[]; }
interface GAChannelData { source: string; medium: string; sessions: number; users: number; }
interface GATrafficData { total: number; channels: GAChannelData[]; campaigns: CampaignData[]; daily: DailyData[]; }

const CHANNEL_COLORS: Record<string, string> = {
  direct: '#78716c', kakao: '#FEE500', instagram: '#E1306C', naver: '#03C75A',
  google: '#4285F4', facebook: '#1877F2', twitter: '#1DA1F2', blog: '#FF6B35',
  youtube: '#FF0000', threads: '#000000',
};

const CHANNEL_LABELS: Record<string, string> = {
  direct: '직접 유입', kakao: '카카오톡', instagram: '인스타그램', naver: '네이버',
  google: '구글', facebook: '페이스북', twitter: '트위터/X', blog: '블로그',
  youtube: '유튜브', threads: '스레드',
};

export default function AdminTraffic() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [gaData, setGaData] = useState<GATrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<'live' | 'ga'>('live');

  useEffect(() => {
    if (tab === 'live') fetchTraffic();
    else fetchGA();
  }, [days, tab]);

  const fetchTraffic = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/analytics/traffic?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error('Traffic fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGA = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/analytics/traffic-ga?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setGaData(await res.json());
    } catch (e) {
      console.error('GA traffic error:', e);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (name: string) => {
    if (CHANNEL_COLORS[name]) return CHANNEL_COLORS[name];
    const lower = name.toLowerCase();
    if (lower.includes('kakao')) return '#FEE500';
    if (lower.includes('instagram') || lower === 'ig') return '#E1306C';
    if (lower.includes('naver')) return '#03C75A';
    if (lower.includes('google')) return '#4285F4';
    if (lower.includes('facebook') || lower.includes('fb')) return '#1877F2';
    if (lower.includes('youtube') || lower.includes('youtu')) return '#FF0000';
    if (lower.includes('threads')) return '#000000';
    if (lower.includes('twitter') || lower.includes('t.co')) return '#1DA1F2';
    return '#a8a29e';
  };
  const getLabel = (name: string) => CHANNEL_LABELS[name] || name;

  const DayButton = ({ d, label }: { d: number; label: string }) => (
    <button
      onClick={() => setDays(d)}
      className={`px-3 py-1.5 text-xs rounded-lg transition ${days === d ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
    >
      {label}
    </button>
  );

  const DailyChart = ({ daily }: { daily: DailyData[] }) => {
    const maxD = Math.max(...daily.map(d => d.count), 1);
    return (
      <div className="flex items-end gap-[3px] h-40">
        {daily.map(d => (
          <div key={d.date} className="flex-1 flex flex-col items-center group relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
              {d.date.slice(5)} / {d.count}
            </div>
            <div
              className="w-full bg-stone-800 rounded-t hover:bg-stone-600 transition-colors cursor-default min-h-[2px]"
              style={{ height: `${(d.count / maxD) * 100}%` }}
            />
          </div>
        ))}
      </div>
    );
  };

  if (loading && !data && !gaData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-800">유입 경로 분석</h1>
          <p className="text-stone-500 text-sm mt-1">어디서 방문자가 오는지 한눈에</p>
        </div>
        <div className="flex items-center gap-2">
          <DayButton d={7} label="7일" />
          <DayButton d={14} label="14일" />
          <DayButton d={30} label="30일" />
          <DayButton d={90} label="90일" />
          <button onClick={() => tab === 'live' ? fetchTraffic() : fetchGA()} disabled={loading} className="p-2 rounded-lg hover:bg-stone-100 transition">
            <RefreshCw className={`w-4 h-4 text-stone-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('live')}
          className={`px-4 py-2 text-xs rounded-lg font-medium transition ${tab === 'live' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
          자체 수집
        </button>
        <button onClick={() => setTab('ga')}
          className={`px-4 py-2 text-xs rounded-lg font-medium transition ${tab === 'ga' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
          GA4 히스토리
        </button>
      </div>

      {tab === 'ga' && gaData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-stone-500 text-xs mb-2"><Globe className="w-3.5 h-3.5" /> GA 세션</div>
              <p className="text-3xl font-bold text-stone-800">{gaData.total.toLocaleString()}</p>
              <p className="text-xs text-stone-400 mt-1">최근 {days}일</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-stone-500 text-xs mb-2"><TrendingUp className="w-3.5 h-3.5" /> 소스 수</div>
              <p className="text-3xl font-bold text-stone-800">{gaData.channels.length}</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-stone-500 text-xs mb-2"><TrendingUp className="w-3.5 h-3.5" /> 캠페인</div>
              <p className="text-3xl font-bold text-stone-800">{gaData.campaigns.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <h3 className="font-semibold text-stone-800 mb-4">소스 / 매체별</h3>
              <div className="space-y-2.5">
                {gaData.channels.slice(0, 15).map(ch => {
                  const maxSessions = gaData.channels[0]?.sessions || 1;
                  return (
                    <div key={`${ch.source}-${ch.medium}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor(ch.source) }} />
                          <span className="text-sm text-stone-700">{ch.source}</span>
                          <span className="text-xs text-stone-400">/ {ch.medium}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-stone-800 tabular-nums">{ch.sessions}</span>
                          <span className="text-xs text-stone-400 tabular-nums w-10 text-right">{ch.users}u</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(ch.sessions / maxSessions) * 100}%`, backgroundColor: getColor(ch.source) }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <h3 className="font-semibold text-stone-800 mb-4">일별 세션 추이</h3>
              {gaData.daily.length > 0 ? <DailyChart daily={gaData.daily} /> : <div className="text-center py-12 text-stone-400 text-sm">데이터 없음</div>}
            </div>
          </div>

          {gaData.campaigns.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <h3 className="font-semibold text-stone-800 mb-4">UTM 캠페인별</h3>
              <div className="divide-y divide-stone-50">
                {gaData.campaigns.map(c => (
                  <div key={c.name} className="flex items-center justify-between py-3">
                    <span className="text-sm text-stone-700 font-mono">{c.name}</span>
                    <span className="text-sm font-bold text-stone-800 tabular-nums">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'live' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-stone-500 text-xs mb-2"><Globe className="w-3.5 h-3.5" /> 총 방문</div>
              <p className="text-3xl font-bold text-stone-800">{data?.total?.toLocaleString() || 0}</p>
              <p className="text-xs text-stone-400 mt-1">최근 {days}일</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-stone-500 text-xs mb-2"><TrendingUp className="w-3.5 h-3.5" /> 유입 채널 수</div>
              <p className="text-3xl font-bold text-stone-800">{data?.channels?.length || 0}</p>
              <p className="text-xs text-stone-400 mt-1">고유 채널</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-stone-500 text-xs mb-2"><TrendingUp className="w-3.5 h-3.5" /> 캠페인 수</div>
              <p className="text-3xl font-bold text-stone-800">{data?.campaigns?.length || 0}</p>
              <p className="text-xs text-stone-400 mt-1">UTM 캠페인</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <h3 className="font-semibold text-stone-800 mb-4">유입 채널별</h3>
              {data?.channels && data.channels.length > 0 ? (
                <div className="space-y-3">
                  {data.channels.map(ch => {
                    const maxChannel = data.channels[0]?.count || 1;
                    return (
                      <div key={ch.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor(ch.name) }} />
                            <span className="text-sm text-stone-700">{getLabel(ch.name)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-stone-800 tabular-nums">{ch.count}</span>
                            <span className="text-xs text-stone-400 tabular-nums w-12 text-right">
                              {data.total ? ((ch.count / data.total) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(ch.count / maxChannel) * 100}%`, backgroundColor: getColor(ch.name) }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-stone-400 text-sm">아직 유입 데이터가 없습니다</div>
              )}
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <h3 className="font-semibold text-stone-800 mb-4">일별 방문 추이</h3>
              {data?.daily && data.daily.length > 0 ? <DailyChart daily={data.daily} /> : <div className="text-center py-12 text-stone-400 text-sm">아직 방문 데이터가 없습니다</div>}
            </div>
          </div>

          {data?.campaigns && data.campaigns.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <h3 className="font-semibold text-stone-800 mb-4">UTM 캠페인별</h3>
              <div className="divide-y divide-stone-50">
                {data.campaigns.map(c => (
                  <div key={c.name} className="flex items-center justify-between py-3">
                    <span className="text-sm text-stone-700 font-mono">{c.name}</span>
                    <span className="text-sm font-bold text-stone-800 tabular-nums">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
