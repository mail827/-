import PreweddingVideo from './pages/PreweddingVideo';
import PreweddingVideoGift from './pages/PreweddingVideoGift';
import PreweddingVideoGiftCallback from './pages/PreweddingVideoGiftCallback';
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import usePageTracking from './hooks/usePageTracking';
import useVisitTracking from './hooks/useVisitTracking';
import Landing from './pages/Landing';
import AiSnapFree from './pages/AiSnapFree';
import AiSnapStudioPage from './pages/AiSnapStudio';
import AiSnapCallback from './pages/AiSnapCallback';
import AiSnapRedeem from './pages/AiSnapRedeem';
const AiSnapGift = lazy(() => import('./pages/AiSnapGift'));
const AiSnapGiftCallback = lazy(() => import('./pages/AiSnapGiftCallback'));
const AiSnapAddCallback = lazy(() => import('./pages/AiSnapAddCallback'));
import AdminSnapGift from './pages/admin/AdminSnapGift';
import AdminSnapSample from './pages/admin/AdminSnapSample';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import CreateWedding from './pages/CreateWedding';
import AiCreateWedding from "./pages/AiCreateWedding";
import EditWedding from './pages/EditWedding';
import WeddingPage from './pages/wedding/WeddingPage';
import RsvpCheck from './pages/RsvpCheck';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminWeddingList from './pages/admin/AdminWeddingList';
import AdminGuides from "./pages/admin/AdminGuides";
import AdminHighlightVideos from "./pages/admin/AdminHighlightVideos";
import AdminPreweddingVideos from "./pages/admin/AdminPreweddingVideos";
import AdminVideoGifts from "./pages/admin/AdminVideoGifts";
import AdminThemeShowcase from "./pages/admin/AdminThemeShowcase";
import AdminShowcase from "./components/admin/AdminShowcase";
import AdminWeddingCreate from './pages/admin/AdminWeddingCreate';
import AdminWeddingEdit from './pages/admin/AdminWeddingEdit';
import AiReport from "./pages/admin/AiReport";
import AdminGift from "./pages/admin/AdminGift";
import AdminRsvpList from './pages/admin/AdminRsvpList';
import AdminGuestbookList from './pages/admin/AdminGuestbookList';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTraffic from './pages/admin/AdminTraffic';
import AdminPackages from './pages/admin/AdminPackages';
import AdminCoupon from './pages/admin/AdminCoupon';
import AdminSettlement from './pages/admin/AdminSettlement';
import AdminReconciliation from './pages/admin/AdminReconciliation';
import AdminWeddingLifecycle from './pages/admin/AdminWeddingLifecycle';
import AdminRevenueSplit from './pages/admin/AdminRevenueSplit';
import AdminOrders from './pages/admin/AdminOrders';
import AdminInquiries from './pages/admin/AdminInquiries';
import AdminContents from './pages/admin/AdminContents';
import ReviewManagement from "./pages/admin/ReviewManagement";
import AdminBgMusic from "./pages/admin/AdminBgMusic";
import AdminAiSnap from "./pages/admin/AdminAiSnap";
import MyPage from './pages/MyPage';
import Terms from './pages/info/Terms';
import Privacy from "./pages/info/Privacy";
import PublicReport from "./pages/PublicReport";
import GiftRedeem from "./pages/GiftRedeem";
import ArchiveSuccess from "./pages/ArchiveSuccess";
import GiftRedirect from './pages/GiftRedirect';
import GiftSend from "./pages/GiftSend";
import MyGifts from "./pages/MyGifts";
import FAQ from './pages/info/FAQ';
import Notice from './pages/info/Notice';
import RefundPolicy from './pages/info/RefundPolicy';
import PaymentSuccess from './pages/PaymentSuccess';
import BoothCreditSuccess from './pages/BoothCreditSuccess';
import AdminLogin from './pages/AdminLogin';
import PairAccept from './pages/PairAccept';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ));
    if (payload.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  } catch {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  usePageTracking();
  useVisitTracking();
  
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" /></div>}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/ai-snap" element={<AiSnapFree />} />
      <Route path="/ai-snap/studio" element={<AiSnapStudioPage />} />
      <Route path="/ai-snap/studio/callback" element={<AiSnapCallback />} />
      <Route path="/ai-snap/studio/add-callback" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" /></div>}><AiSnapAddCallback /></Suspense>} />
      <Route path="/ai-snap/redeem" element={<AiSnapRedeem />} />
      <Route path="/ai-snap/gift" element={<AiSnapGift />} />
      <Route path="/prewedding-video" element={<PreweddingVideo />} />
      <Route path="/prewedding-video/success" element={<PreweddingVideo />} />
      <Route path="/prewedding-video/fail" element={<PreweddingVideo />} />
      <Route path="/prewedding-video/gift" element={<PreweddingVideoGift />} />
      <Route path="/prewedding-video/gift/callback" element={<PreweddingVideoGiftCallback />} />
      <Route path="/ai-snap/gift/callback" element={<AiSnapGiftCallback />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/w/:slug" element={<WeddingPage />} />
        <Route path="/w/:slug/rsvp" element={<RsvpCheck />} />
      <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
      <Route path="/booth-credit/success" element={<ProtectedRoute><BoothCreditSuccess /></ProtectedRoute>} />
      <Route path="/admin/login" element={<AdminLogin />} />
      
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/create" element={<CreateWedding />} />
      <Route path="/ai-create" element={<AiCreateWedding />} />
      <Route path="/edit/:id" element={<ProtectedRoute><EditWedding /></ProtectedRoute>} />
      <Route path="/my" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      <Route path="/my/gifts" element={<ProtectedRoute><MyGifts /></ProtectedRoute>} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/report/:token" element={<PublicReport />} />
      <Route path="/gift" element={<GiftRedirect />} />
      <Route path="/archive-success" element={<ArchiveSuccess />} />
            <Route path="/gift/redeem" element={<GiftRedeem />} />
      <Route path="/gift/send" element={<ProtectedRoute><GiftSend /></ProtectedRoute>} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/notice" element={<Notice />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/pair/accept" element={<PairAccept />} />
      
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="traffic" element={<AdminTraffic />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="packages" element={<AdminPackages />} />
        <Route path="coupons" element={<AdminCoupon />} />
        <Route path="settlement" element={<AdminSettlement />} />
        <Route path="lifecycle" element={<AdminWeddingLifecycle />} />
            <Route path="reconciliation" element={<AdminReconciliation />} />
        <Route path="revenue-split" element={<AdminRevenueSplit />} />
        <Route path="inquiries" element={<AdminInquiries />} />
        <Route path="guides" element={<AdminGuides />} />
            <Route path="highlight-videos" element={<AdminHighlightVideos />} />
            <Route path="prewedding-videos" element={<AdminPreweddingVideos />} />
            <Route path="video-gifts" element={<AdminVideoGifts />} />
        <Route path="theme-showcase" element={<AdminThemeShowcase />} />
        <Route path="showcase" element={<AdminShowcase />} />
              <Route path="bg-music" element={<AdminBgMusic />} />
        <Route path="ai-snap" element={<AdminAiSnap />} />
            <Route path="snap-gift" element={<AdminSnapGift />} />
        <Route path="snap-samples" element={<AdminSnapSample />} />
        <Route path="weddings" element={<AdminWeddingList />} />
        <Route path="weddings/create" element={<AdminWeddingCreate />} />
        <Route path="weddings/new" element={<AdminWeddingCreate />} />
        <Route path="weddings/:id/edit" element={<AdminWeddingEdit />} />
        <Route path="weddings/:id/ai-report" element={<AiReport />} />
        <Route path="gifts" element={<AdminGift />} />
        <Route path="weddings/:id/rsvp" element={<AdminRsvpList />} />
        <Route path="weddings/:id/guestbook" element={<AdminGuestbookList />} />
        <Route path="contents" element={<AdminContents />} />
        <Route path="reviews" element={<ReviewManagement />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
