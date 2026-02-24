import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Plus, Eye, Edit, Share2, LogOut, Crown, CreditCard, Trash2, User as UserIcon, MessageSquare, X, Clock, CheckCircle, RefreshCw, Gift, Users, QrCode, Heart, Download } from 'lucide-react';
import ChatWidget from '../components/ChatWidget';
import QRCardModal from '../components/QRCardModal';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Wedding {
  id: string;
  slug: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  isPublished: boolean;
  theme: string;
  heroMedia?: string;
  pairUserId?: string;
}

interface Order {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
  package: { id: string; name: string };
  wedding?: Wedding;
}

interface Snap {
  id: string;
  status: string;
  resultUrl?: string;
  concept: string;
  mode?: string;
}

interface Pack {
  id: string;
  tier: string;
  totalSnaps: number;
  usedSnaps: number;
  concept: string;
  category: string;
  mode: string;
  status: string;
  snaps: Snap[];
}

declare global {
  interface Window {
    TossPayments?: any;
  }
}

function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [mySnaps, setMySnaps] = useState<any[]>([]);
  const [myPacks, setMyPacks] = useState<Pack[]>([]);
  const [qrWedding, setQrWedding] = useState<Wedding | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<'inquiries' | 'orders' | null>(null);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      localStorage.removeItem('token');
      navigate('/');
      return;
    }
    
    setUser(payload);
    fetchData(token);
  }, [navigate]);

  const fetchData = async (token: string) => {
    try {
      const [weddingsRes, ordersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/weddings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/payment/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (weddingsRes.ok) {
        const weddingsData = await weddingsRes.json();
        setWeddings(weddingsData);
      }

      try {
        const snapRes = await fetch(`${import.meta.env.VITE_API_URL}/ai-snap/free/my-snaps`, { headers: { Authorization: `Bearer ${token}` } });
        if (snapRes.ok) { const snapData = await snapRes.json(); setMySnaps(snapData); }
      } catch {}

      try {
        const packRes = await fetch(`${import.meta.env.VITE_API_URL}/snap-pack/my-packs`, { headers: { Authorization: `Bearer ${token}` } });
        if (packRes.ok) { const packData = await packRes.json(); setMyPacks(Array.isArray(packData) ? packData : []); }
      } catch {}

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      const inquiriesRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/user/inquiries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('이 주문을 삭제하시겠습니까?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/payment/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== orderId));
      }
    } catch (e) {
      console.error('Failed to delete order:', e);
    }
  };

  const handleRetryPayment = async (order: Order) => {
    if (!window.TossPayments) {
      alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setRetryingOrderId(order.id);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/payment/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '결제 재시도 실패');
      }

      const { clientKey, order: orderData } = await res.json();
      const tossPayments = window.TossPayments(clientKey);

      await tossPayments.requestPayment('카드', {
        amount: orderData.amount,
        orderId: orderData.orderId,
        orderName: order.package.name,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/dashboard`,
      });

    } catch (error: any) {
      console.error('Retry payment error:', error);
      if (!error.message?.includes('취소')) {
        alert(error.message || '결제 재시도에 실패했습니다.');
      }
    } finally {
      setRetryingOrderId(null);
    }
  };

  const handleDelete = async (weddingId: string, groomName: string, brideName: string) => {
    const confirmed = window.confirm(`정말 "${groomName} & ${brideName}" 청첩장을 삭제하시겠습니까?\n\n삭제된 청첩장은 복구할 수 없습니다.`);
    if (!confirmed) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/weddings/${weddingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setWeddings(prev => prev.filter(w => w.id !== weddingId));
        alert('삭제되었습니다.');
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  const readyPacks = myPacks.filter(p => p.concept && p.concept !== '');
  const hasStudioContent = readyPacks.length > 0;
  const hasFreeSnaps = mySnaps.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fefefe]">
        <div className="w-10 h-10 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefefe]">
      <header className="border-b border-stone-200 sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl text-stone-800">청첩장 작업실</Link>
          
          <div className="flex items-center gap-4">
            <Link to="/mypage" className="flex items-center gap-2 hover:bg-stone-50 px-3 py-2 rounded-xl transition-all group">
              <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-sm text-stone-600">
                {user?.name?.[0] || '?'}
              </div>
              <span className="text-sm text-stone-700 font-medium hidden sm:block">{user?.name}</span>
              {user?.role === 'ADMIN' && (
                <span className="px-2 py-1 bg-stone-800 text-white text-xs rounded-full">Admin</span>
              )}
            </Link>
            <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <p className="text-sm tracking-[0.2em] text-stone-400 mb-2">DASHBOARD</p>
          <h1 className="font-serif text-3xl text-stone-800">
            안녕하세요, {user?.name}님
          </h1>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/create')}
            className="p-6 bg-stone-800 text-white rounded-2xl flex items-center gap-4 hover:bg-stone-900 transition-colors text-left"
          >
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium">청첩장 만들기</p>
              <p className="text-sm text-stone-400">새 청첩장을 만들어보세요</p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => navigate('/ai-snap/gift')}
            className="p-6 bg-white rounded-2xl flex items-center gap-4 hover:shadow-lg transition-all text-left border border-stone-200"
          >
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-stone-800">화보 선물하기</p>
              <p className="text-sm text-stone-500">소중한 분에게 선물</p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setShowModal('orders')}
            className="p-6 bg-white rounded-2xl flex items-center gap-4 hover:shadow-lg transition-all text-left border border-stone-200"
          >
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-stone-800">주문 내역</p>
              <p className="text-sm text-stone-500">{orders.length}개의 주문</p>
            </div>
          </motion.button>

          {user?.role === 'ADMIN' && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={() => navigate('/admin')}
              className="p-6 bg-stone-800 text-white rounded-2xl flex items-center gap-4 hover:bg-stone-900 transition-all text-left"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium">관리자 패널</p>
                <p className="text-sm text-stone-400">전체 청첩장 관리</p>
              </div>
            </motion.button>
          )}
        </div>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm tracking-[0.2em] text-stone-400 mb-2">AI WEDDING SNAP</p>
              <h2 className="font-serif text-2xl text-stone-800">내 AI 웨딩스냅</h2>
            </div>
            <div className="flex gap-2">
              <a href="/ai-snap/studio" className="px-4 py-2 bg-stone-800 text-white rounded-xl text-xs font-medium hover:bg-stone-900 transition-all flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 화보 스튜디오
              </a>
            </div>
          </div>

          {hasStudioContent && (
            <div className="space-y-6 mb-8">
              {readyPacks.map(pack => {
                const done = pack.snaps.filter(s => s.status === 'done' && s.resultUrl);
                if (done.length === 0) return null;
                return (
                  <div key={pack.id} className="bg-white rounded-2xl border border-stone-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold text-stone-800">{pack.concept}</p>
                        <p className="text-xs text-stone-400">{pack.category === 'studio' ? '스튜디오' : '시네마틱'} · {pack.usedSnaps}/{pack.totalSnaps}장</p>
                      </div>
                      <a href={`/ai-snap/studio?packId=${pack.id}`}
                        className="text-xs text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1">
                        스튜디오에서 보기 <Eye className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {done.map((snap, i) => (
                        <div key={snap.id} className="rounded-xl overflow-hidden border border-stone-100 group relative">
                          <img src={snap.resultUrl} alt={`Snap ${i + 1}`} className="w-full aspect-square object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                            <a href={snap.resultUrl} download target="_blank"
                              className="opacity-0 group-hover:opacity-100 p-1.5 bg-white rounded-full transition-all">
                              <Download className="w-3.5 h-3.5 text-stone-800" />
                            </a>
                          </div>
                          {snap.mode && (
                            <div className="absolute bottom-1 left-1">
                              <span className="px-1.5 py-0.5 bg-black/50 rounded-full text-[9px] text-white">
                                {snap.mode === 'couple' ? '커플' : snap.mode === 'groom' ? '신랑' : '신부'}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {pack.usedSnaps < pack.totalSnaps && (
                        <a href={`/ai-snap/studio?packId=${pack.id}`}
                          className="rounded-xl border-2 border-dashed border-stone-200 aspect-square flex flex-col items-center justify-center hover:border-stone-400 transition-all">
                          <Plus className="w-5 h-5 text-stone-400 mb-1" />
                          <span className="text-[10px] text-stone-400">{pack.totalSnaps - pack.usedSnaps}장 남음</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasFreeSnaps && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {mySnaps.map((snap: any) => (
                  <div key={snap.id} className="rounded-2xl overflow-hidden border border-stone-200 group relative">
                    {snap.resultUrl ? (
                      <>
                        <img src={snap.resultUrl} alt="AI Snap" className="w-full aspect-square object-cover" />
                        {snap.isFree && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded-full text-[10px] text-white">무료체험</div>
                        )}
                      </>
                    ) : (
                      <div className="aspect-square bg-stone-50 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {mySnaps.some((s: any) => s.isFree) && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">워터마크 없는 원본이 필요하세요?</p>
                    <p className="text-xs text-stone-500 mt-0.5">패키지 구매 시 워터마크 제거 + 다양한 컨셉 이용 가능</p>
                  </div>
                  <a href="/ai-snap/studio" className="flex-shrink-0 px-4 py-2 bg-stone-800 text-white rounded-xl text-xs font-medium hover:bg-stone-900 transition-all">
                    패키지 보기
                  </a>
                </div>
              )}
            </>
          )}

          {!hasStudioContent && !hasFreeSnaps && (
            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-8 text-center">
              <Sparkles className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500 mb-1">아직 만든 웨딩스냅이 없어요</p>
              <p className="text-xs text-stone-400 mb-5">AI가 사진 한 장으로 웨딩 화보를 만들어드려요</p>
              <div className="flex gap-3 justify-center">
                <a href="/ai-snap" className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm hover:bg-stone-900 transition-all">
                  <Sparkles className="w-4 h-4" /> 무료 체험하기
                </a>
                <a href="/ai-snap/studio" className="inline-flex items-center gap-2 px-5 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm hover:bg-stone-50 transition-all">
                  <ImageIcon className="w-4 h-4" /> 화보 스튜디오
                </a>
              </div>
            </div>
          )}
        </section>

        <section>
          <p className="text-sm tracking-[0.2em] text-stone-400 mb-2">MY INVITATIONS</p>
          <h2 className="font-serif text-2xl text-stone-800 mb-8">내 청첩장</h2>
          
          {weddings.length === 0 ? (
            <div className="bg-stone-50 rounded-2xl p-16 text-center">
              <Heart className="w-10 h-10 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500 mb-6">아직 만든 청첩장이 없어요</p>
              <button
                onClick={() => navigate('/create')}
                className="px-8 py-3 bg-stone-800 text-white rounded-full text-sm hover:bg-stone-900 transition-colors"
              >
                청첩장 만들기
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {weddings.map((wedding, idx) => (
                <motion.div
                  key={wedding.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-2xl overflow-hidden border border-stone-200 hover:shadow-lg transition-all"
                >
                  <div className="h-36 bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center relative overflow-hidden">
                    {wedding.heroMedia ? <img src={wedding.heroMedia} alt="" className="w-full h-full object-cover" /> : <Heart className="w-8 h-8 text-stone-300" />}
                    <button
                      onClick={() => handleDelete(wedding.id, wedding.groomName, wedding.brideName)}
                      className="absolute top-3 right-3 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-lg text-stone-800 mb-1">
                      {wedding.groomName} & {wedding.brideName}
                    </h3>
                    <p className="text-sm text-stone-400 mb-4">
                      {new Date(wedding.weddingDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-2 mb-5">
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        wedding.isPublished 
                          ? 'bg-green-50 text-green-600 border border-green-200' 
                          : 'bg-stone-100 text-stone-500'
                      }`}>
                        {wedding.isPublished ? '공개' : '비공개'}
                      </span>
                      {wedding.pairUserId && (
                        <span className="px-3 py-1 text-xs rounded-full bg-violet-50 text-violet-600 border border-violet-200 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          함께 수정 중
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`/w/${wedding.slug}`, '_blank')}
                        className="flex-1 py-2.5 border border-stone-200 text-stone-600 rounded-lg text-sm flex items-center justify-center gap-1.5 hover:bg-stone-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" /> 보기
                      </button>
                      <button
                        onClick={() => navigate(`/edit/${wedding.id}`)}
                        className="flex-1 py-2.5 bg-stone-800 text-white rounded-lg text-sm flex items-center justify-center gap-1.5 hover:bg-stone-900 transition-colors"
                      >
                        <Edit className="w-4 h-4" /> 수정
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/w/${wedding.slug}`);
                          alert('링크가 복사되었습니다!');
                        }}
                        className="py-2.5 px-3 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setQrWedding(wedding)}
                        className="py-2.5 px-3 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
                        title="인쇄용 QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <p className="text-sm tracking-[0.2em] text-stone-400 mb-2">MY PAGE</p>
          <h2 className="font-serif text-2xl text-stone-800 mb-8">내 정보</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-7 h-7 text-stone-500" />
                </div>
                <div>
                  <h3 className="font-medium text-stone-800">{user?.name}</h3>
                  <p className="text-sm text-stone-500">{user?.email}</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setShowModal('inquiries')}
              className="bg-white rounded-2xl border border-stone-200 p-6 cursor-pointer hover:border-stone-400 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-stone-500" />
                  <h3 className="font-medium text-stone-800">내 문의</h3>
                </div>
                <span className="text-sm text-stone-500">{inquiries.length}건</span>
              </div>
              
              {inquiries.length === 0 ? (
                <p className="text-sm text-stone-400">문의 내역이 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {inquiries.slice(0, 3).map((inq: any) => (
                    <div key={inq.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                      <p className="text-sm text-stone-600 truncate flex-1 mr-2">{inq.message}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        inq.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        inq.status === 'REPLIED' ? 'bg-green-100 text-green-700' :
                        'bg-stone-100 text-stone-600'
                      }`}>
                        {inq.status === 'PENDING' ? '대기중' : inq.status === 'REPLIED' ? '답변완료' : '종료'}
                      </span>
                    </div>
                  ))}
                  {inquiries.length > 3 && (
                    <p className="text-xs text-stone-400 text-center pt-2">+{inquiries.length - 3}건 더보기</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-800">
                {showModal === 'inquiries' ? '내 문의 내역' : '주문 내역'}
              </h3>
              <button onClick={() => setShowModal(null)} className="p-2 hover:bg-stone-100 rounded-full">
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {showModal === 'orders' && (
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <p className="text-sm text-stone-400 text-center py-8">주문 내역이 없습니다</p>
                  ) : (
                    orders.map((order: Order) => (
                      <div key={order.id} className={`p-4 rounded-xl border ${
                        order.status === 'PENDING' ? 'bg-yellow-50 border-yellow-200' :
                        order.status === 'PAID' ? 'bg-green-50 border-green-200' :
                        'bg-stone-50 border-stone-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {order.status === 'PENDING' ? <Clock className="w-4 h-4 text-yellow-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                            <span className="font-medium text-stone-800">{order.package?.name}</span>
                          </div>
                          <span className={`font-medium ${order.status === 'PENDING' ? 'text-yellow-700' : 'text-green-700'}`}>
                            {order.amount?.toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              order.status === 'PAID' ? 'bg-green-100 text-green-700' :
                              'bg-stone-200 text-stone-600'
                            }`}>
                              {order.status === 'PENDING' ? '대기중' : order.status === 'PAID' ? '결제완료' : '취소'}
                            </span>
                            <span className="text-xs text-stone-400 ml-2">{new Date(order.createdAt).toLocaleDateString('ko-KR')}</span>
                          </div>
                          {order.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRetryPayment(order)}
                                disabled={retryingOrderId === order.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                              >
                                {retryingOrderId === order.id ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                                결제하기
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                        {order.status === 'PAID' && !order.wedding && (
                          <button
                            onClick={() => {
                              setShowModal(null);
                              navigate('/create');
                            }}
                            className="mt-3 w-full py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-900 transition-colors"
                          >
                            청첩장 만들기
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {showModal === 'inquiries' && (
                <div className="space-y-3">
                  {inquiries.length === 0 ? (
                    <p className="text-sm text-stone-400 text-center py-8">문의 내역이 없습니다</p>
                  ) : (
                    inquiries.map((inq: any) => (
                      <div key={inq.id} className="p-4 bg-stone-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            inq.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            inq.status === 'REPLIED' ? 'bg-green-100 text-green-700' :
                            'bg-stone-200 text-stone-600'
                          }`}>
                            {inq.status === 'PENDING' ? '대기중' : inq.status === 'REPLIED' ? '답변완료' : '종료'}
                          </span>
                          <span className="text-xs text-stone-400">{new Date(inq.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <p className="text-stone-700 text-sm">{inq.message}</p>
                        {inq.reply && (
                          <div className="mt-3 p-3 bg-stone-800 text-white rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-stone-400">답변</span>
                            </div>
                            <p className="text-sm">{inq.reply}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {qrWedding && (
        <QRCardModal
          isOpen={!!qrWedding}
          onClose={() => setQrWedding(null)}
          wedding={qrWedding as any}
        />
      )}
      <ChatWidget isLoggedIn={true} userEmail={user?.email || ""} userName={user?.name || ""} />
    </div>
  );
}
