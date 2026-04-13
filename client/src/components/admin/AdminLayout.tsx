import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileHeart, LogOut, Users, CreditCard, MessageSquare, FileText, Gift, Star, Menu, X, Package, Play, Palette, Ticket, TrendingUp, Film, Music, Sparkles, Image, Eye, ArrowRightLeft, PieChart, Clock, Globe, ClipboardCheck, Frame, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuGroups = [
  {
    label: 'TEAM',
    items: [
      { path: '/admin/team', icon: ClipboardCheck, label: '팀 대시보드' },
    ],
  },
  {
    label: 'OPERATION',
    items: [
      { path: '/admin', icon: LayoutDashboard, label: '대시보드', exact: true },
      { path: '/admin/users', icon: Users, label: '회원 관리' },
      { path: '/admin/traffic', icon: Globe, label: '유입 분석' },
      { path: '/admin/orders', icon: CreditCard, label: '주문 내역' },
      { path: '/admin/inquiries', icon: MessageSquare, label: '1:1 문의' },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { path: '/admin/weddings', icon: FileHeart, label: '청첩장 관리' },
      { path: '/admin/lifecycle', icon: Clock, label: '라이프사이클' },
      { path: '/admin/guides', icon: Play, label: '이용 가이드' },
      { path: '/admin/highlight-videos', icon: Film, label: '하이라이트' },
      { path: '/admin/prewedding-videos', icon: Film, label: '웨딩시네마 주문' },
      { path: '/admin/video-gifts', icon: Gift, label: '영상 선물' },
      { path: '/admin/contents', icon: FileText, label: '콘텐츠 관리' },
    ],
  },
  {
    label: 'PRODUCT',
    items: [
      { path: '/admin/gifts', icon: Gift, label: '선물 관리' },
      { path: '/admin/reviews', icon: Star, label: '리뷰 관리' },
      { path: '/admin/packages', icon: Package, label: '패키지 관리' },
      { path: '/admin/coupons', icon: Ticket, label: '쿠폰 관리' },
    ],
  },
  {
    label: 'SETTLEMENT',
    items: [
      { path: '/admin/settlement', icon: TrendingUp, label: '제휴 정산' },
      { path: '/admin/reconciliation', icon: ArrowRightLeft, label: '정산 대사' },
      { path: '/admin/revenue-split', icon: PieChart, label: '매출 분배' },
    ],
  },
  {
    label: 'SHOWCASE',
    items: [
      { path: '/admin/theme-showcase', icon: Palette, label: '테마 쇼케이스' },
      { path: '/admin/showcase', icon: Eye, label: '쇼케이스 미리보기' },
      { path: '/admin/bg-music', icon: Music, label: '배경음악' },
    ],
  },
  {
    label: 'AI',
    items: [
      { path: '/admin/ai-snap', icon: Sparkles, label: 'AI 웨딩스냅' },
      { path: '/admin/snap-gift', icon: Gift, label: 'AI스냅 선물' },
      { path: '/admin/snap-samples', icon: Image, label: 'AI스냅 샘플' },
      { path: '/admin/id-photo', icon: Camera, label: 'AI ID 포트레이트' },
    ],
  },
  {
    label: 'POSTER',
    items: [
      { path: '/admin/poster', icon: Frame, label: '웨딩포스터' },
    ],
  },
];


export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const isActive = (item: { path: string; exact?: boolean }) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-5">
      {menuGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 mb-1.5 text-[10px] font-medium tracking-[0.15em] text-stone-400">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
                  isActive(item)
                    ? 'bg-stone-900 text-white font-medium'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 -ml-1.5 hover:bg-stone-100 rounded-lg md:hidden"
            >
              <Menu className="w-5 h-5 text-stone-600" />
            </button>
            <Link to="/admin" className="flex items-center gap-2.5">
              <span className="text-[15px] font-semibold text-stone-800">청첩장 작업실</span>
              <span className="text-[10px] tracking-[0.1em] text-stone-400 font-medium">ADMIN</span>
            </Link>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/dashboard" className="text-[13px] text-stone-400 hover:text-stone-700 transition-colors hidden sm:block">
              내 대시보드
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="text-[13px] hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed top-0 left-0 bottom-0 w-[260px] bg-white z-50 md:hidden flex flex-col"
            >
              <div className="h-14 px-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-stone-800">관리자</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 hover:bg-stone-100 rounded-lg">
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-2">
                <NavContent onNavigate={() => setMobileMenuOpen(false)} />
              </div>
              <div className="p-3 border-t border-stone-100 flex-shrink-0">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2.5 text-[13px] text-stone-400 hover:text-stone-700 transition-colors"
                >
                  내 대시보드로 이동
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex">
        <aside className="w-52 min-h-[calc(100vh-56px)] bg-white border-r border-stone-100 py-5 px-3 hidden md:block overflow-y-auto">
          <NavContent />
        </aside>
        <main className="flex-1 p-5 md:p-7 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
