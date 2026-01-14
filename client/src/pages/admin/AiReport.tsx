import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, TrendingUp, Users, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatLog {
  id: string;
  visitorId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

interface ReportData {
  totalChats: number;
  uniqueVisitors: number;
  topQuestions: { question: string; count: number }[];
  recentChats: ChatLog[];
  funnyQuestions: string[];
}

export default function AiReport() {
  const { id } = useParams();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const [reportLink, setReportLink] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/weddings/${id}/ai-report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const report = await res.json();
        setData(report);
      }
    } catch (e) {
      console.error('Failed to fetch AI report:', e);
    } finally {
      setLoading(false);
    }
  };


  const generateReportLink = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/weddings/${id}/generate-report-link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReportLink(data.url);
      }
    } catch (e) {
      console.error("Generate report link error:", e);
    } finally {
      setGenerating(false);
    }
  };

  const sendReportEmail = async () => {
    if (!emailTo || !reportLink) return;
    setEmailSending(true);
    try {
      const token = reportLink.split("/report/")[1];
      const res = await fetch(`${import.meta.env.VITE_API_URL}/report/${token}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTo })
      });
      if (res.ok) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      }
    } catch (e) {
      console.error("Send email error:", e);
    } finally {
      setEmailSending(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 overflow-x-hidden">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-stone-200 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={`/admin/wedding/${id}`} className="p-2 -ml-2 hover:bg-stone-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <div>
            <h1 className="text-lg font-medium text-stone-800">AI 리포트</h1>
            <p className="text-xs text-stone-500">하객들이 AI에게 몰래 물어본 질문들</p>
          </div>
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
            내 친구들이 신랑신부 몰래<br />
            AI에게만 물어본 <span className="font-medium">'그 질문'</span>
          </p>
          <p className="text-sm opacity-70">궁금하지 않으세요?</p>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 p-4 bg-white rounded-xl border border-stone-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-stone-800">리포트 링크 생성</p>
              <p className="text-sm text-stone-500">신랑신부에게 공유할 24시간 유효 링크</p>
            </div>
            <button
              onClick={generateReportLink}
              disabled={generating}
              className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50"
            >
              {generating ? "생성 중..." : "링크 생성"}
            </button>
          </div>
          {reportLink && (
            <div className="mt-4 p-3 bg-stone-50 rounded-lg">
              <p className="text-xs text-stone-500 mb-1">생성된 링크 (24시간 유효)</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={reportLink}
                  readOnly
                  className="flex-1 min-w-0 px-3 py-2 bg-white border border-stone-200 rounded text-sm truncate"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(reportLink); }}
                  className="px-3 py-2 bg-stone-100 rounded text-sm hover:bg-stone-200 shrink-0"
                >
                  복사
                </button>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <button
                  onClick={() => {
                    if (window.Kakao) {
                      window.Kakao.Share.sendDefault({
                        objectType: "feed",
                        content: {
                          title: "AI 리포트가 도착했어요! 💌",
                          description: "하객들이 AI에게 몰래 물어본 질문들을 확인해보세요",
                          imageUrl: "https://weddingshop.cloud/og-image.png",
                          link: { mobileWebUrl: reportLink, webUrl: reportLink }
                        },
                        buttons: [{ title: "리포트 확인하기", link: { mobileWebUrl: reportLink, webUrl: reportLink } }]
                      });
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-[#FEE500] text-[#191919] rounded text-sm font-medium hover:bg-[#FDD800]"
                >
                  💬 카카오톡 공유
                </button>
                <div className="flex-1 flex gap-2">
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="이메일 주소 입력"
                    className="flex-1 px-3 py-2 border border-stone-200 rounded text-sm"
                  />
                  <button
                    onClick={sendReportEmail}
                    disabled={emailSending || !emailTo}
                    className="px-3 py-2 bg-stone-800 text-white rounded text-sm font-medium hover:bg-stone-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    {emailSent ? "✓ 발송완료" : emailSending ? "발송중..." : "✉️ 발송"}
                  </button>
                </div>
              </div>
              </div>
            </div>
          )}
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
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
            <h2 className="text-sm font-medium text-rose-700 mb-4 flex items-center gap-2">
              😂 웃긴 질문 모음
            </h2>
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
            className="bg-white rounded-xl p-6 border border-stone-200"
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
                      {chat.role === 'USER' ? '🙋 하객' : '🤖 AI'}
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
            <p className="text-sm text-stone-400">청첩장을 공유하면 데이터가 쌓여요!</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
