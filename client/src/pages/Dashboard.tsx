import { useState, useEffect, useRef } from 'react';
import { useLocaleStore } from '../store/useLocaleStore';
import { at } from '../utils/appI18n';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { Sparkles, Image as ImageIcon, Plus, Eye, Edit, Share2, LogOut, Crown, CreditCard, Trash2, User as UserIcon, MessageSquare, X, Clock, CheckCircle, RefreshCw, Gift, Users, QrCode, Heart, Download, Loader2, ChevronLeft, ChevronRight, ChevronDown, Camera, Play, Film } from 'lucide-react';
import ChatWidget from '../components/ChatWidget';
import QRCardModal from '../components/QRCardModal';
import ImageCropper from '../components/ImageCropper';
import SharedLinkManager from '../components/SharedLinkManager';

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

interface GuestPhoto {
  id: string;
  guestName: string;
  imageUrl: string;
  mediaType?: string;
  message?: string;
  createdAt: string;
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

const vStatusMap: Record<string, { label: string; color: string; progress: number }> = {
      PENDING: { label: '대기', color: '#a8a29e', progress: 0 },
      ANALYZING: { label: '분석 중', color: '#f59e0b', progress: 20 },
      GENERATING: { label: '영상 생성 중', color: '#3b82f6', progress: 55 },
      ASSEMBLING: { label: '조립 중', color: '#8b5cf6', progress: 85 },
      DONE: { label: '완성', color: '#22c55e', progress: 100 },
      FAILED: { label: '실패', color: '#ef4444', progress: 0 },
    };
    const vActive = ['ANALYZING', 'GENERATING', 'ASSEMBLING'];
    
export default function Dashboard() {
  const navigate = useNavigate();
  const { locale: al } = useLocaleStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  const [snapOpen, setSnapOpen] = useState(false);
  const [guestPhotos, setGuestPhotos] = useState<GuestPhoto[]>([]);
  const [guestPhotoSlug, setGuestPhotoSlug] = useState<string | null>(null);
  const [guestPhotoViewIndex, setGuestPhotoViewIndex] = useState<number | null>(null);
  const [deleteConfirmPhoto, setDeleteConfirmPhoto] = useState<GuestPhoto | null>(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [myVideos, setMyVideos] = useState<any[]>([]);
  const videoPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [heroCropWedding, setHeroCropWedding] = useState<Wedding | null>(null);
  const [heroCropSrc, setHeroCropSrc] = useState('');
  const [heroCropFile, setHeroCropFile] = useState<File | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroPendingWedding, setHeroPendingWedding] = useState<Wedding | null>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const fetchMyVideos = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/prewedding-video/my', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        const data = await res.json();
        setMyVideos(data);
        const hasActive = data.some((v: any) => vActive.includes(v.status));
        if (hasActive && !videoPollRef.current) {
          videoPollRef.current = setInterval(fetchMyVideos, 8000);
        } else if (!hasActive && videoPollRef.current) {
          clearInterval(videoPollRef.current);
          videoPollRef.current = null;
        }
      }
    } catch {}
  };

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'wedding_guide';

  const uploadBlobToCloudinary = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append('file', blob, 'hero.jpg');
      fd.append('upload_preset', UPLOAD_PRESET);
      fd.append('folder', 'wedding');
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          resolve(res.secure_url);
        } else reject(new Error(at('uploadFailed', al)));
      };
      xhr.onerror = () => reject(new Error(at('networkError', al)));
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
      xhr.send(fd);
    });
  };

  const handleHeroCropComplete = async (blob: Blob) => {
    if (!heroCropWedding || heroUploading) return;
    setHeroUploading(true);
    try {
      const url = await uploadBlobToCloudinary(blob);
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/weddings/${heroCropWedding.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ heroMedia: url }),
      });
      if (res.ok) {
        setWeddings(prev => prev.map(w => w.id === heroCropWedding.id ? { ...w, heroMedia: url } : w));
      }
    } catch {}
    setHeroUploading(false);
    setHeroCropWedding(null);
    setHeroCropSrc('');
    setHeroCropFile(null);
  };

  const handleHeroFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const w = heroPendingWedding;
    setHeroPendingWedding(null);
    if (!w) return;
    const reader = new FileReader();
    reader.onload = () => {
      setHeroCropWedding(w);
      setHeroCropSrc(reader.result as string);
      setHeroCropFile(file);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openHeroCropForExisting = (wedding: Wedding) => {
    setHeroCropWedding(wedding);
    setHeroCropSrc(wedding.heroMedia!);
    setHeroCropFile(null);
  };

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
    fetchMyVideos();
  }, [navigate]);

  useEffect(() => {
    if (weddings.length > 0 && !guestPhotoSlug) setGuestPhotoSlug(weddings[0].slug);
  }, [weddings]);

  const loadGuestPhotos = () => {
    if (!guestPhotoSlug) return;
    fetch(`${import.meta.env.VITE_API_URL}/guest-photo/${guestPhotoSlug}`)
      .then(r => r.ok ? r.json() : [])
      .then(setGuestPhotos)
      .catch(() => setGuestPhotos([]));
  };

  useEffect(() => {
    if (!guestPhotoSlug) {
      setGuestPhotos([]);
      return;
    }
    loadGuestPhotos();
  }, [guestPhotoSlug]);

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
    if (!confirm(at('deleteConfirmOrder', al))) return;
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
      alert(at('paymentModuleLoading', al));
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
        throw new Error(err.error || at('paymentRetryFailed', al));
      }

      const { clientKey, order: orderData } = await res.json();
      const tossPayments = window.TossPayments(clientKey);

      await tossPayments.requestPayment('Card', {
        amount: orderData.amount,
        orderId: orderData.orderId,
        orderName: order.package.name,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/dashboard`,
      });

    } catch (error: any) {
      console.error('Retry payment error:', error);
      if (!error.message?.includes(at('cancel', al))) {
        alert(error.message || at('paymentRetryFailed', al));
      }
    } finally {
      setRetryingOrderId(null);
    }
  };

  const handleDeleteGuestPhoto = async () => {
    if (!deleteConfirmPhoto) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/guest-photo/${deleteConfirmPhoto.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setGuestPhotos(prev => prev.filter(p => p.id !== deleteConfirmPhoto.id));
      setDeleteConfirmPhoto(null);
      setGuestPhotoViewIndex(null);
    }
  };

  const handleDownloadGuestPhoto = (photo: GuestPhoto) => {
    fetch(photo.imageUrl).then(r => r.blob()).then(blob => {
      const ext = photo.mediaType === 'VIDEO' ? 'mp4' : 'jpg';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `guest-${photo.guestName}-${photo.id.slice(0, 8)}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  };

  const handleDownloadAllZip = async () => {
    if (guestPhotos.length === 0) return;
    setZipLoading(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < guestPhotos.length; i++) {
        const res = await fetch(guestPhotos[i].imageUrl);
        const blob = await res.blob();
        const ext = guestPhotos[i].imageUrl.includes('.png') ? 'png' : 'jpg';
        zip.file(`guest-${i + 1}-${guestPhotos[i].guestName}.${ext}`, blob);
      }
      const out = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(out);
      a.download = `guest-photos-${guestPhotoSlug || 'gallery'}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {}
    setZipLoading(false);
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
        alert(at('deleted', al));
      } else {
        alert(at('deleteFailed', al));
      }
    } catch (e) {
      alert(at('errorOccurred', al));
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
      <input
        ref={heroFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleHeroFileSelect}
      />
      <header className="border-b border-stone-100 sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-stone-800">청첩장 작업실</span>
            <span className="text-[10px] tracking-[0.1em] text-stone-400 font-medium hidden sm:inline">WEDDING ENGINE</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/mypage" className="flex items-center gap-2 hover:bg-stone-50 px-2.5 py-1.5 rounded-lg transition-all">
              <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-[11px] text-stone-600 font-medium">
                {user?.name?.[0] || '?'}
              </div>
              <span className="text-[13px] text-stone-700 font-medium hidden sm:block">{user?.name}</span>
              {user?.role === 'ADMIN' && (
                <span className="text-[10px] tracking-[0.1em] text-stone-400 font-medium">ADMIN</span>
              )}
            </Link>
            <button onClick={handleLogout} className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors">
              <LogOut className="w-4 h-4" />
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
          <p className="text-[11px] tracking-[0.15em] text-stone-400 mb-2">DASHBOARD</p>
          <h1 className="font-serif text-2xl text-stone-800">
            {at('hello', al)}, {user?.name}님
          </h1>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-14">
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowCreateModal(true)}
            className="p-4 bg-stone-900 text-white rounded-lg flex items-center gap-3 hover:bg-stone-800 transition-colors text-left"
          >
            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[13px] font-medium">{at('createWedding', al)}</p>
              <p className="text-[11px] text-stone-400">{at('newWedding', al)}</p>
            </div>
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            onClick={() => navigate('/ai-snap/gift')}
            className="p-4 bg-white rounded-lg flex items-center gap-3 hover:bg-stone-50 transition-all text-left border border-stone-200"
          >
            <div className="w-9 h-9 bg-stone-100 rounded-lg flex items-center justify-center">
              <Gift className="w-4 h-4 text-stone-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-stone-800">{at('giftSnap', al)}</p>
              <p className="text-[11px] text-stone-400">{at('toSomeone', al)}</p>
            </div>
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            onClick={() => setShowModal('orders')}
            className="p-4 bg-white rounded-lg flex items-center gap-3 hover:bg-stone-50 transition-all text-left border border-stone-200"
          >
            <div className="w-9 h-9 bg-stone-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-stone-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-stone-800">{at('orderHistory', al)}</p>
              <p className="text-[11px] text-stone-400">{orders.length} {at('ordersCount', al)}</p>
            </div>
          </motion.button>
          {user?.role === 'ADMIN' && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.09 }}
              onClick={() => navigate('/admin')}
              className="p-4 bg-stone-900 text-white rounded-lg flex items-center gap-3 hover:bg-stone-800 transition-all text-left"
            >
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[13px] font-medium">{at('adminPanel', al)}</p>
                <p className="text-[11px] text-stone-400">{at('manageAll', al)}</p>
              </div>
            </motion.button>
          )}
        </div>

        <section className="mb-12">
          <button onClick={() => setSnapOpen(!snapOpen)} className="w-full flex items-center justify-between mb-0 group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-stone-500" />
              </div>
              <div className="text-left">
                <p className="text-[11px] tracking-[0.15em] text-stone-400">AI WEDDING SNAP</p>
                <h2 className="font-serif text-lg text-stone-800">{at('aiWeddingSnap', al)}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/ai-snap/studio" onClick={e => e.stopPropagation()} className="px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-medium hover:bg-stone-900 transition-all flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 화보 스튜디오
              </a>
              <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${snapOpen ? "rotate-180" : ""}`} />
            </div>
          </button>
          {snapOpen && <div className="mt-6">

          {hasStudioContent && (
            <div className="space-y-6 mb-8">
              {readyPacks.map(pack => {
                const done = pack.snaps.filter(s => s.status === 'done' && s.resultUrl);
                if (done.length === 0) return null;
                return (
                  <div key={pack.id} className="bg-white rounded-lg border border-stone-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold text-stone-800">{pack.concept}</p>
                        <p className="text-xs text-stone-400">{pack.category === 'studio' ? at('studio', al) : at('cinematic', al)} · {pack.usedSnaps}/{pack.totalSnaps}장</p>
                      </div>
                      <a href={`/ai-snap/studio?packId=${pack.id}`}
                        className="text-xs text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1">
                        스튜디오에서 보기 <Eye className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {done.map((snap, i) => (
                        <div key={snap.id} className="rounded-lg overflow-hidden border border-stone-100 group relative">
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
                                {snap.mode === 'couple' ? at('couple', al) : snap.mode === 'groom' ? at('groom', al) : at('bride', al)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {pack.usedSnaps < pack.totalSnaps && (
                        <a href={`/ai-snap/studio?packId=${pack.id}`}
                          className="rounded-lg border-2 border-dashed border-stone-200 aspect-square flex flex-col items-center justify-center hover:border-stone-400 transition-all">
                          <Plus className="w-5 h-5 text-stone-400 mb-1" />
                          <span className="text-[10px] text-stone-400">{pack.totalSnaps - pack.usedSnaps} {at('remaining', al)}</span>
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
              <p className="text-sm font-medium text-stone-500 mb-4">{at('freeTrialSnaps', al)}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {mySnaps.map((snap: any) => (
                  <div key={snap.id} className="rounded-lg overflow-hidden border border-stone-200 group relative">
                    {snap.resultUrl ? (
                      <>
                        <img src={snap.resultUrl} alt="AI Snap" className="w-full aspect-square object-cover" />
                        {snap.isFree && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded-full text-[10px] text-white">
                            {snap.unlocked ? at('unlocked', al) : at('freeTrial', al)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <a href={snap.resultUrl} download target="_blank"
                            className="opacity-0 group-hover:opacity-100 p-1.5 bg-white rounded-full transition-all">
                            <Download className="w-3.5 h-3.5 text-stone-800" />
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-square bg-stone-50 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {mySnaps.some((s: any) => s.isFree && !s.unlocked) && (
                <div className="bg-stone-100 border border-stone-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{at('noWatermark', al)}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{at('noWatermarkDesc', al)}</p>
                  </div>
                  <a href="/ai-snap/studio" className="flex-shrink-0 px-4 py-2 bg-stone-800 text-white rounded-lg text-xs font-medium hover:bg-stone-900 transition-all">
                    {at("viewPackages", al)}
                  </a>
                </div>
              )}
            </>
          )}

          {!hasStudioContent && !hasFreeSnaps && (
            <div className="bg-stone-50 rounded-lg border border-stone-200 p-8 text-center">
              <Sparkles className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500 mb-1">{at('noSnapsYet', al)}</p>
              <p className="text-xs text-stone-400 mb-5">{at('noSnapsDesc', al)}</p>
              <div className="flex gap-3 justify-center">
                <a href="/ai-snap" className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-900 transition-all">
                  <Sparkles className="w-4 h-4" /> 무료 체험하기
                </a>
                <a href="/ai-snap/studio" className="inline-flex items-center gap-2 px-5 py-2.5 border border-stone-200 text-stone-600 rounded-lg text-sm hover:bg-stone-50 transition-all">
                  <ImageIcon className="w-4 h-4" /> 화보 스튜디오
                </a>
              </div>
            </div>
          )}
          </div>}
        </section>

        <section>
          <p className="text-[11px] tracking-[0.15em] text-stone-400 mb-2">MY INVITATIONS</p>
          <h2 className="font-serif text-lg text-stone-800 mb-8">{at('myInvitations', al)}</h2>
          
          {weddings.length === 0 ? (
            <div className="bg-stone-50 rounded-lg p-16 text-center">
              <Heart className="w-10 h-10 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500 mb-6">{at('noWeddingsYet', al)}</p>
              <button
                onClick={() => setShowCreateModal(true)}
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
                  className="bg-white rounded-lg overflow-hidden border border-stone-200 hover:shadow-lg transition-all"
                >
                  <div className="h-36 bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center relative overflow-hidden group">
                    {wedding.heroMedia ? (
                      <img src={wedding.heroMedia} alt="" className="w-full h-full object-cover cursor-pointer" onClick={() => openHeroCropForExisting(wedding)} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setHeroPendingWedding(wedding); heroFileInputRef.current?.click(); }}
                        className="w-full h-full flex flex-col items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-50/50 transition-colors"
                      >
                        <Camera className="w-8 h-8 mb-1" />
                        <span className="text-xs">{at('heroImage', al)}</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(wedding.id, wedding.groomName, wedding.brideName); }}
                      className="absolute top-3 right-3 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title={at("delete", al)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {wedding.heroMedia && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openHeroCropForExisting(wedding); }}
                        className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        크롭 조정
                      </button>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-[15px] text-stone-800 mb-1">
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
                        {wedding.isPublished ? at('published', al) : at('unpublished', al)}
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
                        <Eye className="w-4 h-4" /> {at("view", al)}
                      </button>
                      <button
                        onClick={() => navigate(`/edit/${wedding.id}`)}
                        className="flex-1 py-2.5 bg-stone-800 text-white rounded-lg text-sm flex items-center justify-center gap-1.5 hover:bg-stone-900 transition-colors"
                      >
                        <Edit className="w-4 h-4" /> {at("edit", al)}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/w/${wedding.slug}`);
                          alert(at('linkCopied', al));
                        }}
                        className="py-2.5 px-3 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setQrWedding(wedding)}
                        className="py-2.5 px-3 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
                        title={at("printQr", al)}
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

        {weddings.length > 0 && (
          <SharedLinkManager weddings={weddings} />
        )}

        {weddings.length > 0 && (
          <section className="mt-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs tracking-[0.2em] text-stone-400 mb-1">GUEST GALLERY</p>
                  <h2 className="font-serif text-lg sm:text-xl text-stone-800">{at('guestGallery', al)}</h2>
                </div>
                <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full">{guestPhotos.length}장</span>
              </div>
              <div className="flex items-center gap-2">
                {weddings.length > 1 && (
                  <select
                    value={guestPhotoSlug || ''}
                    onChange={e => setGuestPhotoSlug(e.target.value)}
                    className="px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-700 bg-white"
                  >
                    {weddings.map(w => (
                      <option key={w.id} value={w.slug}>{w.groomName} & {w.brideName}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={handleDownloadAllZip}
                  disabled={guestPhotos.length === 0 || zipLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 text-stone-600 rounded-lg text-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {zipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  전체 다운로드
                </button>
              </div>
            </div>

            {guestPhotos.length === 0 ? (
              <div className="bg-stone-50 rounded-lg border border-stone-200 p-12 text-center">
                <ImageIcon className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="text-sm text-stone-500">{at('noGuestPhotos', al)}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {guestPhotos.map((photo, i) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-lg overflow-hidden border border-stone-200 aspect-square bg-stone-50"
                  >
                    {photo.mediaType === 'VIDEO' ? (
                      <div className="relative w-full h-full cursor-pointer" onClick={() => setGuestPhotoViewIndex(i)}>
                        <video src={photo.imageUrl} className="w-full h-full object-cover" muted preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img src={photo.imageUrl} alt={photo.guestName} className="w-full h-full object-cover cursor-pointer" onClick={() => setGuestPhotoViewIndex(i)} />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={e => { e.stopPropagation(); handleDownloadGuestPhoto(photo); }}
                        className="p-2 bg-white rounded-full hover:bg-stone-100 transition-colors"
                      >
                        <Download className="w-4 h-4 text-stone-700" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteConfirmPhoto(photo); }}
                        className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}


        {myVideos.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center">
                <Film className="w-4 h-4 text-stone-500" />
              </div>
              <div>
                <p className="text-[11px] tracking-[0.15em] text-stone-400">PRE-WEDDING VIDEO</p>
                <h2 className="font-serif text-lg text-stone-800">식전영상</h2>
              </div>
            </div>
            <div className="space-y-4">
              {myVideos.map(v => {
                const vs = vStatusMap[v.status] || vStatusMap.PENDING;
                const isActive = vActive.includes(v.status);
                return (
                  <div key={v.id} className="bg-white rounded-xl border border-stone-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-stone-800">{v.groomName} & {v.brideName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: vs.color + '15', color: vs.color }}>
                          {isActive && <Loader2 size={10} className="animate-spin" />}
                          {v.status === 'DONE' && <CheckCircle size={10} />}
                          {vs.label}
                        </span>
                      </div>
                      <span className="text-xs text-stone-400">{new Date(v.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    {isActive && (
                      <div className="mb-3">
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: vs.progress + '%', background: vs.color }} />
                        </div>
                        <p className="text-[10px] mt-1 text-stone-400">약 8~10분 소요됩니다</p>
                      </div>
                    )}
                    {v.status === 'DONE' && v.outputUrl && (
                      <div>
                        <video src={v.outputUrl} controls playsInline className="w-full rounded-lg mb-3" style={{ maxHeight: 360 }} />
                        <a href={v.outputUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-2.5 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-900 transition-colors">
                          <Download size={14} /> 다운로드
                        </a>
                      </div>
                    )}
                    {v.status === 'FAILED' && (
                      <p className="text-xs text-red-400">{v.errorMsg || '생성에 실패했어요'}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-12">
          <p className="text-[11px] tracking-[0.15em] text-stone-400 mb-2">MY PAGE</p>
          <h2 className="font-serif text-lg text-stone-800 mb-8">{at('myInfo', al)}</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-stone-200 p-6">
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
              className="bg-white rounded-lg border border-stone-200 p-6 cursor-pointer hover:border-stone-400 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-stone-500" />
                  <h3 className="font-medium text-stone-800">{at('myInquiriesShort', al)}</h3>
                </div>
                <span className="text-sm text-stone-500">{inquiries.length}건</span>
              </div>
              
              {inquiries.length === 0 ? (
                <p className="text-sm text-stone-400">{at('noInquiries', al)}</p>
              ) : (
                <div className="space-y-2">
                  {inquiries.slice(0, 3).map((inq: any) => (
                    <div key={inq.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                      <p className="text-sm text-stone-600 truncate flex-1 mr-2">{inq.message}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        inq.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        inq.status === 'REPLIED' ? 'bg-green-100 text-green-700' :
                        'bg-stone-100 text-stone-600'
                      }`}>
                        {inq.status === 'PENDING' ? at('pending', al) : inq.status === 'REPLIED' ? at('replied', al) : at('closed', al)}
                      </span>
                    </div>
                  ))}
                  {inquiries.length > 3 && (
                    <p className="text-xs text-stone-400 text-center pt-2">+{inquiries.length - 3}{at('moreItems', al)}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <h3 className="font-serif text-lg text-stone-800">
                {showModal === 'inquiries' ? at('myInquiries', al) : at('myOrders', al)}
              </h3>
              <button onClick={() => setShowModal(null)} className="p-2 hover:bg-stone-100 rounded-full">
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {showModal === 'orders' && (
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <p className="text-sm text-stone-400 text-center py-8">{at('noOrders', al)}</p>
                  ) : (
                    orders.map((order: Order) => (
                      <div key={order.id} className={`p-4 rounded-lg border ${
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
                              {order.status === 'PENDING' ? at('pending', al) : order.status === 'PAID' ? at('paid', al) : at('cancel', al)}
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
                              setShowCreateModal(true);
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
                    <p className="text-sm text-stone-400 text-center py-8">{at('noInquiries', al)}</p>
                  ) : (
                    inquiries.map((inq: any) => (
                      <div key={inq.id} className="p-4 bg-stone-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            inq.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            inq.status === 'REPLIED' ? 'bg-green-100 text-green-700' :
                            'bg-stone-200 text-stone-600'
                          }`}>
                            {inq.status === 'PENDING' ? at('pending', al) : inq.status === 'REPLIED' ? at('replied', al) : at('closed', al)}
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

      <AnimatePresence>
        {guestPhotoViewIndex !== null && guestPhotos[guestPhotoViewIndex] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setGuestPhotoViewIndex(null)}>
            <button onClick={e => { e.stopPropagation(); setGuestPhotoViewIndex(Math.max(0, guestPhotoViewIndex - 1)); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white z-10">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="max-w-4xl w-full px-4" onClick={e => e.stopPropagation()}>
              {guestPhotos[guestPhotoViewIndex].mediaType === 'VIDEO' ? (
                <video src={guestPhotos[guestPhotoViewIndex].imageUrl} controls autoPlay playsInline className="w-full rounded-lg max-h-[70vh]" />
              ) : (
                <img src={guestPhotos[guestPhotoViewIndex].imageUrl} alt="" className="w-full rounded-lg" />
              )}
              <div className="text-center mt-3">
                <p className="text-white/80 text-sm">{guestPhotos[guestPhotoViewIndex].guestName}</p>
                {guestPhotos[guestPhotoViewIndex].message && <p className="text-white/50 text-xs mt-1">{guestPhotos[guestPhotoViewIndex].message}</p>}
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); setGuestPhotoViewIndex(Math.min(guestPhotos.length - 1, guestPhotoViewIndex + 1)); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white z-10">
              <ChevronRight className="w-6 h-6" />
            </button>
            <button onClick={() => setGuestPhotoViewIndex(null)} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirmPhoto(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
              <p className="text-stone-800 font-medium mb-2">{at('deletePhotoConfirm', al)}</p>
              <p className="text-sm text-stone-500 mb-6">{deleteConfirmPhoto.guestName}{at('uploadedBy', al)}</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirmPhoto(null)}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-600 rounded-lg text-sm hover:bg-stone-50">
                  취소
                </button>
                <button onClick={handleDeleteGuestPhoto}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                  삭제
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {heroCropWedding && heroCropSrc && (
        <ImageCropper
          imageSrc={heroCropSrc}
          onCropComplete={handleHeroCropComplete}
          onCancel={() => { setHeroCropWedding(null); setHeroCropSrc(''); setHeroCropFile(null); }}
          originalFile={heroCropFile}
        />
      )}
      {heroUploading && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg px-6 py-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-stone-600" />
            <span className="text-sm text-stone-700">{at('uploading', al)}</span>
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
      {showCreateModal && (
        <div onClick={() => setShowCreateModal(false)} className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-5">
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl max-w-[420px] w-full overflow-hidden">
            <div className="pt-7 px-6 pb-2 text-center">
              <p className="text-lg font-semibold text-stone-800 mb-1">{at('createWedding', al)}</p>
              <p className="text-[13px] text-stone-500">{at('createModalDesc', al)}</p>
            </div>
            <div className="p-5 pt-4 flex flex-col gap-2.5">
              <button onClick={() => { setShowCreateModal(false); navigate('/ai-create'); }} className="flex items-center gap-3.5 p-4 rounded-xl border-2 border-stone-800 bg-stone-50 text-left hover:bg-stone-100 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-stone-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-stone-800 mb-0.5">{at('aiAutoCreateLabel', al)}</p>
                  <p className="text-xs text-stone-500">{at('aiAutoCreateDesc', al)}</p>
                </div>
              </button>
              <button onClick={() => { setShowCreateModal(false); navigate('/create'); }} className="flex items-center gap-3.5 p-4 rounded-xl border border-stone-200 bg-white text-left hover:bg-stone-50 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-stone-800" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-stone-800 mb-0.5">{at('manualCreateLabel', al)}</p>
                  <p className="text-xs text-stone-500">{at('manualCreateDesc', al)}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && (
        <div onClick={() => setShowCreateModal(false)} className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-5">
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl max-w-[420px] w-full overflow-hidden">
            <div className="pt-7 px-6 pb-2 text-center">
              <p className="text-lg font-semibold text-stone-800 mb-1">{at('createWedding', al)}</p>
              <p className="text-[13px] text-stone-500">{at('createModalDesc', al)}</p>
            </div>
            <div className="p-5 pt-4 flex flex-col gap-2.5">
              <button onClick={() => { setShowCreateModal(false); navigate('/ai-create'); }} className="flex items-center gap-3.5 p-4 rounded-xl border-2 border-stone-800 bg-stone-50 text-left hover:bg-stone-100 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-stone-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-stone-800 mb-0.5">{at('aiAutoCreateLabel', al)}</p>
                  <p className="text-xs text-stone-500">{at('aiAutoCreateDesc', al)}</p>
                </div>
              </button>
              <button onClick={() => { setShowCreateModal(false); navigate('/create'); }} className="flex items-center gap-3.5 p-4 rounded-xl border border-stone-200 bg-white text-left hover:bg-stone-50 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-stone-800" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-stone-800 mb-0.5">{at('manualCreateLabel', al)}</p>
                  <p className="text-xs text-stone-500">{at('manualCreateDesc', al)}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      <ChatWidget isLoggedIn={true} userEmail={user?.email || ""} userName={user?.name || ""} />
    </div>
  );
}
