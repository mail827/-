import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Clock, CheckCircle, XCircle, User, Mail, Calendar, Gift, ChevronRight } from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  status: 'PENDING' | 'REPLIED' | 'CLOSED';
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function MyPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'inquiries'>('profile');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const [userRes, inquiriesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/auth/user/inquiries`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }

      if (inquiriesRes.ok) {
        const inquiriesData = await inquiriesRes.json();
        setInquiries(inquiriesData);
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    PENDING: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: '답변 대기' },
    REPLIED: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: '답변 완료' },
    CLOSED: { icon: XCircle, color: 'bg-stone-100 text-stone-700', label: '종료' },
  };

  const typeLabels: Record<string, string> = {
    general: '일반 문의',
    payment: '결제 문의',
    custom: '커스텀 문의',
    video: '영상 문의',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fefefe] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefefe]">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-stone-100 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 hover:bg-stone-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <h1 className="text-lg font-medium text-stone-800">마이페이지</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'profile' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
            }`}
          >
            내 정보
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'inquiries' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
            }`}
          >
            문의 내역 {inquiries.length > 0 && `(${inquiries.length})`}
          </button>
        </div>

        {activeTab === 'profile' && user && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-stone-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-800">{user.name}</h2>
                <p className="text-stone-500">{user.email}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl">
                <Mail className="w-5 h-5 text-stone-400" />
                <div>
                  <p className="text-sm text-stone-500">이메일</p>
                  <p className="text-stone-800">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl">
                <Calendar className="w-5 h-5 text-stone-400" />
                <div>
                  <p className="text-sm text-stone-500">가입일</p>
                  <p className="text-stone-800">{new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
                </div>
              </div>
              <Link to="/my/gifts" className="flex items-center justify-between p-4 bg-gradient-to-r from-stone-50 to-stone-100 rounded-xl border border-stone-200 hover:border-stone-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5 text-stone-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">청첩장 선물하기</p>
                    <p className="text-sm text-stone-500">소중한 분에게 선물하세요</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400" />
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {inquiries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
                <MessageSquare className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">문의 내역이 없습니다</p>
              </div>
            ) : (
              inquiries.map((inquiry) => {
                const status = statusConfig[inquiry.status];
                const StatusIcon = status.icon;
                
                return (
                  <div key={inquiry.id} className="bg-white rounded-2xl border border-stone-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      <span className="px-2 py-1 bg-stone-100 text-stone-600 text-xs rounded-full">
                        {typeLabels[inquiry.type] || inquiry.type}
                      </span>
                      <span className="text-xs text-stone-400 ml-auto">
                        {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    
                    <p className="text-stone-700 whitespace-pre-wrap mb-3">{inquiry.message}</p>
                    
                    {inquiry.reply && (
                      <div className="bg-stone-800 text-white rounded-xl p-4 mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-stone-300">
                            답변 ({new Date(inquiry.repliedAt!).toLocaleDateString('ko-KR')})
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{inquiry.reply}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
