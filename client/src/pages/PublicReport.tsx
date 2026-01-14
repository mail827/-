import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, TrendingUp, Users, Download, Star, Clock, Sparkles } from 'lucide-react';

interface ChatLog {
  id: string;
  visitorId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

interface ReportData {
  groomName: string;
  brideName: string;
  weddingDate: string;
  totalChats: number;
  uniqueVisitors: number;
  topQuestions: { question: string; count: number }[];
  funnyQuestions: string[];
  recentChats: ChatLog[];
  expiresAt: string;
}

export default function PublicReport() {
  const { token } = useParams();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [token]);

  const fetchReport = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/report/${token}`);
      if (res.status === 404) {
        setError('리포트를 찾을 수 없습니다');
      } else if (res.status === 410) {
        setError('리포트 링크가 만료되었습니다');
      } else if (res.ok) {
        const report = await res.json();
        setData(report);
      }
    } catch (e) {
      setError('리포트를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!reviewSubmitted) {
      setShowReviewModal(true);
    } else {
      generatePDF();
    }
  };

  const submitReview = async () => {
    if (rating === 0) return;
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/report/${token}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review })
      });
      setReviewSubmitted(true);
      setShowReviewModal(false);
      generatePDF();
    } catch (e) {
      console.error('Review submit error:', e);
    }
  };

  const generatePDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-stone-400" />
          </div>
          <p className="text-stone-600 text-lg mb-2">{error}</p>
          <p className="text-stone-400 text-sm">청첩장 작업실</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 print:bg-white">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-stone-200 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-lg font-medium text-stone-800">AI 리포트</h1>
          <p className="text-xs text-stone-500">하객들이 AI에게 몰래 물어본 질문들</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl text-white"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm opacity-80">AI 컨시어지 활동 요약</span>
          </div>
          <p className="text-2xl font-light mb-2">
            {data?.groomName} & {data?.brideName}
          </p>
          <p className="text-sm opacity-70">
            {new Date(data?.weddingDate || '').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 border border-stone-200"
          >
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">총 대화</span>
            </div>
            <p className="text-2xl font-semibold text-stone-800">{data?.totalChats || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 border border-stone-200"
          >
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs">방문자 수</span>
            </div>
            <p className="text-2xl font-semibold text-stone-800">{data?.uniqueVisitors || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-5 border border-stone-200"
          >
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">평균 질문</span>
            </div>
            <p className="text-2xl font-semibold text-stone-800">
              {data?.uniqueVisitors ? (data.totalChats / data.uniqueVisitors / 2).toFixed(1) : 0}
            </p>
          </motion.div>
        </div>

        {data?.topQuestions && data.topQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 border border-stone-200 mb-6"
          >
            <h2 className="text-sm font-medium text-stone-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              인기 질문 TOP 5
            </h2>
            <div className="space-y-3">
              {data.topQuestions.slice(0, 5).map((q, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-stone-100 text-stone-600' :
                    i === 2 ? 'bg-amber-100 text-amber-700' :
                    'bg-stone-50 text-stone-500'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-stone-700">{q.question}</span>
                  <span className="text-xs text-stone-400">{q.count}회</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {data?.funnyQuestions && data.funnyQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-rose-100 mb-6"
          >
            <h2 className="text-sm font-medium text-rose-700 mb-4">웃긴 질문 모음</h2>
            <div className="space-y-2">
              {data.funnyQuestions.map((q, i) => (
                <div key={i} className="bg-white/60 rounded-lg p-3 text-sm text-stone-700">
                  "{q}"
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {data?.recentChats && data.recentChats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl p-6 border border-stone-200 mb-6"
          >
            <h2 className="text-sm font-medium text-stone-800 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-500" />
              최근 대화 내역
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.recentChats.map((chat) => (
                <div 
                  key={chat.id} 
                  className={`p-3 rounded-lg text-sm ${
                    chat.role === 'USER' 
                      ? 'bg-stone-100 text-stone-700 ml-8' 
                      : 'bg-violet-50 text-violet-700 mr-8'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs opacity-60">
                      {chat.role === 'USER' ? '하객' : 'AI'}
                    </span>
                    <span className="text-xs opacity-40">
                      {new Date(chat.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  {chat.content}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {(!data || data.totalChats === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-500 mb-2">아직 AI와 대화한 하객이 없어요</p>
            <p className="text-sm text-stone-400">청첩장을 공유하면 데이터가 쌓여요</p>
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={handleDownloadPDF}
          className="w-full py-4 bg-stone-800 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-stone-700 transition-colors print:hidden"
        >
          <Download className="w-5 h-5" />
          PDF로 저장하기
        </motion.button>

        <p className="text-center text-xs text-stone-400 mt-4 print:hidden">
          리포트는 {new Date(data?.expiresAt || '').toLocaleString('ko-KR')}까지 유효합니다
        </p>

        <footer className="mt-12 text-center text-xs text-stone-400 print:hidden">
          청첩장 작업실
        </footer>
      </main>

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 print:hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
          >
            <h3 className="text-lg font-medium text-stone-800 mb-2 text-center">
              잠깐!
            </h3>
            <p className="text-sm text-stone-500 mb-6 text-center">
              리포트가 마음에 드셨다면<br />
              짧은 후기 하나만 남겨주세요
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-200'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="청첩장 작업실 어떠셨나요? (선택)"
              className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none h-24 text-sm focus:outline-none focus:ring-2 focus:ring-stone-800 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 border border-stone-200 rounded-xl text-stone-600 text-sm"
              >
                나중에
              </button>
              <button
                onClick={submitReview}
                disabled={rating === 0}
                className="flex-1 py-3 bg-stone-800 text-white rounded-xl text-sm disabled:opacity-50"
              >
                제출하고 다운로드
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
