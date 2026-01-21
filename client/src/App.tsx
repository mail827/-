import { Routes, Route, Navigate } from 'react-router-dom';
import usePageTracking from './hooks/usePageTracking';
import Landing from './pages/Landing';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import CreateWedding from './pages/CreateWedding';
import EditWedding from './pages/EditWedding';
import WeddingPage from './pages/wedding/WeddingPage';
import RsvpCheck from './pages/RsvpCheck';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminWeddingList from './pages/admin/AdminWeddingList';
import AdminGuides from "./pages/admin/AdminGuides";
import AdminThemeShowcase from "./pages/admin/AdminThemeShowcase";
import AdminWeddingCreate from './pages/admin/AdminWeddingCreate';
import AdminWeddingEdit from './pages/admin/AdminWeddingEdit';
import AiReport from "./pages/admin/AiReport";
import AdminGift from "./pages/admin/AdminGift";
import AdminRsvpList from './pages/admin/AdminRsvpList';
import AdminGuestbookList from './pages/admin/AdminGuestbookList';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPackages from './pages/admin/AdminPackages';
import AdminOrders from './pages/admin/AdminOrders';
import AdminInquiries from './pages/admin/AdminInquiries';
import AdminContents from './pages/admin/AdminContents';
import ReviewManagement from "./pages/admin/ReviewManagement";
import MyPage from './pages/MyPage';
import Terms from './pages/info/Terms';
import Privacy from "./pages/info/Privacy";
import PublicReport from "./pages/PublicReport";
import GiftRedeem from "./pages/GiftRedeem";
import GiftSend from "./pages/GiftSend";
import MyGifts from "./pages/MyGifts";
import FAQ from './pages/info/FAQ';
import Notice from './pages/info/Notice';
import RefundPolicy from './pages/info/RefundPolicy';
import PaymentSuccess from './pages/PaymentSuccess';
import AdminLogin from './pages/AdminLogin';

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
  
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/w/:slug" element={<WeddingPage />} />
        <Route path="/w/:slug/rsvp" element={<RsvpCheck />} />
      <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
      <Route path="/admin/login" element={<AdminLogin />} />
      
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><CreateWedding /></ProtectedRoute>} />
      <Route path="/edit/:id" element={<ProtectedRoute><EditWedding /></ProtectedRoute>} />
      <Route path="/my" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      <Route path="/my/gifts" element={<ProtectedRoute><MyGifts /></ProtectedRoute>} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/report/:token" element={<PublicReport />} />
      <Route path="/gift/redeem" element={<GiftRedeem />} />
      <Route path="/gift/send" element={<ProtectedRoute><GiftSend /></ProtectedRoute>} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/notice" element={<Notice />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="packages" element={<AdminPackages />} />
        <Route path="inquiries" element={<AdminInquiries />} />
        <Route path="guides" element={<AdminGuides />} />
        <Route path="theme-showcase" element={<AdminThemeShowcase />} />
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
  );
}
