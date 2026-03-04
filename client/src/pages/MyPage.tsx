import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Clock, CheckCircle, XCircle, User, Mail, Calendar, Gift, ChevronRight, Star, Pencil } from 'lucide-react';

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

interface WeddingReview {
  id: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  packageName: string | null;
  canReview: boolean;
  hasReview: boolean;
  review: { id: string; rating: number; content: string } | null;
}

export default function MyPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [weddings, setWeddings] = useState<WeddingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'inquiries' | 'reviews'>('profile');
  
  const [reviewModal, setReviewModal] = useState<{ open: boolean; wedding: WeddingReview | null }>({ open: false, wedding: null });
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [submitting, setSubmitting] = useState(false);

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
      const [userRes, inquiriesRes, weddingsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/auth/user/inquiries`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/auth/user/weddings`, {
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

      if (weddingsRes.ok) {
        const weddingsData = await weddingsRes.json();
        setWeddings(weddingsData);
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (wedding: WeddingReview) => {
    setReviewForm({
      rating: wedding.review?.rating || 5,
      content: wedding.review?.content || ''
    });
    setReviewModal({ open: true, wedding });
  };

  const submitReview = async () => {
    if (!reviewModal.wedding) return;
    
    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/user/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weddingId: reviewModal.wedding.id,
          rating: reviewForm.rating,
          content: reviewForm.content
        }),
      });
      
      if (res.ok) {
        setReviewModal({ open: false, wedding: null });
        fetchData();
      }
    } catch (e) {
      console.error('Failed to submit review:', e);
    } finally {
      setSubmitting(false);
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
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'profile' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
            }`}
          >
            내 정보
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'inquiries' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
            }`}
          >
            문의 {inquiries.length > 0 && `(${inquiries.length})`}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'reviews' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
            }`}
          >
            리뷰
          </button>
        </div>

        {activeTab === 'profile' && user && (
          <div className="bg-white rounded-lg border border-stone-200 p-6">
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
              <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg">
                <Mail className="w-5 h-5 text-stone-400" />
                <div>
                  <p className="text-sm text-stone-500">이메일</p>
                  <p className="text-stone-800">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg">
                <Calendar className="w-5 h-5 text-stone-400" />
                <div>
                  <p className="text-sm text-stone-500">가입일</p>
                  <p className="text-stone-800">{new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
                </div>
              </div>
              <Link to="/my/gifts" className="flex items-center justify-between p-4 bg-gradient-to-r from-stone-50 to-stone-100 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors">
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
              <div className="bg-white rounded-lg border border-stone-200 p-8 text-center">
                <MessageSquare className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">문의 내역이 없습니다</p>
              </div>
            ) : (
              inquiries.map((inquiry) => {
                const status = statusConfig[inquiry.status];
                const StatusIcon = status.icon;
                
                return (
                  <div key={inquiry.id} className="bg-white rounded-lg border border-stone-200 p-5">
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
                      <div className="bg-stone-800 text-white rounded-lg p-4 mt-3">
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

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {weddings.length === 0 ? (
              <div className="bg-white rounded-lg border border-stone-200 p-8 text-center">
                <Star className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">아직 청첩장이 없습니다</p>
                <p className="text-sm text-stone-400 mt-1">청첩장을 만들고 결혼식 후 리뷰를 남겨주세요!</p>
              </div>
            ) : (
              weddings.map((wedding) => (
                <div key={wedding.id} className="bg-white rounded-lg border border-stone-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-stone-800">{wedding.groomName} ♥ {wedding.brideName}</h3>
                      <p className="text-sm text-stone-500">{new Date(wedding.weddingDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                    {wedding.packageName && (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full">
                        {wedding.packageName}
                      </span>
                    )}
                  </div>
                  
                  {wedding.hasReview && wedding.review ? (
                    <div className="bg-stone-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < wedding.review!.rating ? 'text-yellow-400 fill-yellow-400' : 'text-stone-200'}`} />
                          ))}
                        </div>
                        <button
                          onClick={() => openReviewModal(wedding)}
                          className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          수정
                        </button>
                      </div>
                      <p className="text-stone-600 text-sm">{wedding.review.content}</p>
                    </div>
                  ) : wedding.canReview ? (
                    <button
                      onClick={() => openReviewModal(wedding)}
                      className="w-full py-3 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-700 transition-colors"
                    >
                      리뷰 작성하기
                    </button>
                  ) : (
                    <div className="text-center py-3 bg-stone-50 rounded-lg">
                      <p className="text-sm text-stone-400">결혼식 후 리뷰를 작성할 수 있어요</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {reviewModal.open && reviewModal.wedding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-stone-800 mb-1">리뷰 작성</h3>
            <p className="text-sm text-stone-500 mb-6">{reviewModal.wedding.groomName} ♥ {reviewModal.wedding.brideName}</p>
            
            <div className="mb-6">
              <p className="text-sm text-stone-600 mb-3">서비스는 어떠셨나요?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                    className="p-1"
                  >
                    <Star className={`w-8 h-8 transition-colors ${star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-stone-200'}`} />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <textarea
                value={reviewForm.content}
                onChange={(e) => setReviewForm(f => ({ ...f, content: e.target.value }))}
                placeholder="청첩장 작업실 이용 경험을 들려주세요!"
                className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none h-32 focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setReviewModal({ open: false, wedding: null })}
                className="flex-1 py-3 border border-stone-200 rounded-lg font-medium text-stone-600 hover:bg-stone-50"
              >
                취소
              </button>
              <button
                onClick={submitReview}
                disabled={submitting}
                className="flex-1 py-3 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-700 disabled:opacity-50"
              >
                {submitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
