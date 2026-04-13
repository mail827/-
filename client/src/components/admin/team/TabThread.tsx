import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles, Copy, Check, Trash2, RefreshCw, ChevronDown, Flame, Target, Zap, Heart, PenTool } from 'lucide-react';
import { API, getHeaders, isOwner } from './shared';

interface ThreadPost {
  id: string;
  category: string;
  title: string;
  content: string;
  heatLevel: number;
  platform: string;
  metadata: any;
  createdAt: string;
}

const CATEGORIES = [
  { id: 'all', label: '전체', icon: MessageCircle },
  { id: 'rage', label: '분노유발', icon: Flame },
  { id: 'comparison', label: '비교형', icon: Target },
  { id: 'pov', label: 'POV', icon: Zap },
  { id: 'story', label: '스토리텔링', icon: Heart },
  { id: 'event', label: '이벤트/홍보', icon: Sparkles },
] as const;

const HEAT_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'WARM', color: 'text-amber-500' },
  2: { label: 'HOT', color: 'text-orange-500' },
  3: { label: 'FIRE', color: 'text-red-500' },
};

const PLATFORM_LABELS: Record<string, string> = {
  threads: '스레드',
  instagram: '인스타',
  cafe: '카페',
  blog: '블로그',
};

export default function TabThread() {
  const [posts, setPosts] = useState<ThreadPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const owner = isOwner();
  const headers = getHeaders();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/marketing/threads`, { headers });
      if (res.ok) setPosts(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API}/admin/marketing/threads/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ topic: customTopic || undefined }),
      });
      if (res.ok) {
        setCustomTopic('');
        await fetchPosts();
      } else {
        const err = await res.json();
        alert(err.error || 'failed');
      }
    } catch (e: any) {
      alert(e.message || 'failed');
    } finally { setGenerating(false); }
  };

  const deletePost = async (id: string) => {
    await fetch(`${API}/admin/marketing/threads/${id}`, { method: 'DELETE', headers });
    fetchPosts();
  };

  const copyContent = (post: ThreadPost) => {
    navigator.clipboard.writeText(post.content);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = activeCategory === 'all' ? posts : posts.filter(p => p.category === activeCategory);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PenTool className="w-4 h-4 text-stone-500" />
          <span className="text-[10px] tracking-[0.15em] text-stone-400 font-medium">THREAD PLANNER</span>
        </div>
        <p className="text-[12px] text-stone-400">스레드 · 인스타 · 카페 바이럴 글 AI 기획</p>
      </div>

      {owner && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="특정 주제가 있으면 입력 (없으면 AI가 알아서)"
              className="flex-1 px-4 py-2.5 text-[13px] bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 placeholder:text-stone-300"
            />
            <button
              onClick={generate}
              disabled={generating}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {generating ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" />생성 중...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" />글 기획</>
              )}
            </button>
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => {
            const count = cat.id === 'all' ? posts.length : posts.filter(p => p.category === cat.id).length;
            if (cat.id !== 'all' && count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-stone-800 text-white font-medium'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {cat.label} {count > 0 && <span className="ml-1 text-[10px] opacity-60">{count}</span>}
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
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <PenTool className="w-6 h-6 text-stone-200 mx-auto mb-2" />
          <p className="text-[13px] text-stone-300">아직 기획된 글이 없어요</p>
          {owner && <p className="text-[11px] text-stone-300 mt-1">위 버튼으로 AI 글 기획을 시작하세요</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((post, idx) => {
            const isExpanded = expandedId === post.id;
            const heat = HEAT_CONFIG[post.heatLevel] || HEAT_CONFIG[1];
            const lines = post.content.split('\n').filter(l => l.trim());
            const preview = lines.slice(0, 4);
            const needsTruncate = lines.length > 4;
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-stone-300 transition-colors"
              >
                <div className="px-5 py-3 flex items-center justify-between border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold tracking-[0.1em] ${heat.color}`}>
                      {Array.from({ length: post.heatLevel }, () => '🔥').join('')} {heat.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                      {PLATFORM_LABELS[post.platform] || post.platform}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-50 text-stone-400">
                      {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => copyContent(post)} className="p-1.5 hover:bg-stone-50 rounded-lg" title="복사">
                      {copiedId === post.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                    </button>
                    {owner && (
                      <button onClick={() => deletePost(post.id)} className="p-1.5 hover:bg-stone-50 rounded-lg" title="삭제">
                        <Trash2 className="w-3.5 h-3.5 text-stone-400" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-5 py-4">
                  <h3 className="text-[15px] font-bold text-stone-800 mb-3">{post.title}</h3>
                  <div className="space-y-1.5">
                    {(isExpanded || !needsTruncate ? lines : preview).map((line, li) => (
                      <p key={li} className="text-[13px] text-stone-600 leading-[1.8]">{line}</p>
                    ))}
                  </div>
                  {needsTruncate && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : post.id)}
                      className="mt-3 flex items-center gap-1 text-[12px] font-medium text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      {isExpanded ? '접기' : `+${lines.length - 4}줄 더보기`}
                    </button>
                  )}
                </div>
                <div className="px-5 py-2 border-t border-stone-50">
                  <p className="text-[10px] text-stone-300">
                    {new Date(post.createdAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
