import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Eye, EyeOff, Trash2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  id: string;
  rating: number;
  content: string;
  source: string;
  isPublic: boolean;
  createdAt: string;
  wedding: {
    groomName: string;
    brideName: string;
  };
}

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'public' | 'hidden'>('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (e) {
      console.error('Fetch reviews error:', e);
    } finally {
      setLoading(false);
    }
  };

  const togglePublic = async (id: string, isPublic: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ isPublic: !isPublic })
      });
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, isPublic: !isPublic } : r));
      }
    } catch (e) {
      console.error('Toggle public error:', e);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== id));
      }
    } catch (e) {
      console.error('Delete review error:', e);
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'AI_REPORT': return 'AI 리포트';
      case 'PACKAGE_PURCHASE': return '패키지 구매';
      default: return '일반';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'AI_REPORT': return 'bg-violet-100 text-violet-700';
      case 'PACKAGE_PURCHASE': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-stone-100 text-stone-600';
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === 'public') return r.isPublic;
    if (filter === 'hidden') return !r.isPublic;
    return true;
  });

  const publicCount = reviews.filter(r => r.isPublic).length;
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-stone-200 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/admin" className="p-2 -ml-2 hover:bg-stone-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <div>
            <h1 className="text-lg font-medium text-stone-800">리뷰 관리</h1>
            <p className="text-xs text-stone-500">랜딩페이지에 표시할 리뷰 관리</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-stone-200">
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs">전체 리뷰</span>
            </div>
            <p className="text-2xl font-semibold text-stone-800">{reviews.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-stone-200">
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-xs">공개 중</span>
            </div>
            <p className="text-2xl font-semibold text-stone-800">{publicCount}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-stone-200">
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <Star className="w-4 h-4" />
              <span className="text-xs">평균 별점</span>
            </div>
            <p className="text-2xl font-semibold text-stone-800">{avgRating}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'public', 'hidden'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === f 
                  ? 'bg-stone-800 text-white' 
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {f === 'all' ? '전체' : f === 'public' ? '공개' : '숨김'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredReviews.map(review => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`bg-white rounded-xl p-5 border transition-colors ${
                  review.isPublic ? 'border-stone-200' : 'border-stone-100 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${getSourceColor(review.source)}`}>
                        {getSourceLabel(review.source)}
                      </span>
                      {review.isPublic && (
                        <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">공개</span>
                      )}
                    </div>
                    <p className="text-stone-700 text-sm mb-3">
                      {review.content || '(내용 없음)'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-stone-400">
                      <span>{review.wedding.groomName} & {review.wedding.brideName}</span>
                      <span>{new Date(review.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => togglePublic(review.id, review.isPublic)}
                      className={`p-2 rounded-lg transition-colors ${
                        review.isPublic 
                          ? 'bg-stone-100 hover:bg-stone-200 text-stone-600' 
                          : 'bg-violet-100 hover:bg-violet-200 text-violet-600'
                      }`}
                      title={review.isPublic ? '숨기기' : '공개하기'}
                    >
                      {review.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredReviews.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-stone-400" />
              </div>
              <p className="text-stone-500">리뷰가 없습니다</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
