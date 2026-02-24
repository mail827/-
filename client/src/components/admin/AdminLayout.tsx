import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileHeart, LogOut, Users, CreditCard, MessageSquare, Crown, FileText, Gift, Star, Menu, X, Package, Play, Palette, Ticket, TrendingUp, Heart, Film, Music, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: '대시보드', exact: true },
    { path: '/admin/users', icon: Users, label: '회원 관리' },
    { path: '/admin/orders', icon: CreditCard, label: '주문 내역' },
    { path: '/admin/inquiries', icon: MessageSquare, label: '1:1 문의' },
    { path: '/admin/weddings', icon: FileHeart, label: '청첩장 관리' },
    { path: '/admin/guides', icon: Play, label: '이용 가이드' },
    { path: '/admin/highlight-videos', icon: Film, label: '식전영상' },
    { path: '/admin/contents', icon: FileText, label: '콘텐츠 관리' },
    { path: '/admin/gifts', icon: Gift, label: '선물 관리' },
    { path: '/admin/reviews', icon: Star, label: '리뷰 관리' },
    { path: '/admin/packages', icon: Package, label: '패키지 관리' },
    { path: '/admin/coupons', icon: Ticket, label: '쿠폰 관리' },
    { path: '/admin/settlement', icon: TrendingUp, label: '제휴 정산' },
    { path: '/admin/theme-showcase', icon: Palette, label: '테마 쇼케이스' },
    { path: '/admin/bg-music', icon: Music, label: '배경음악' },
    { path: '/admin/ai-snap', icon: Sparkles, label: 'AI 웨딩스냅' },
    { path: '/admin/snap-gift', icon: Gift, label: 'AI스냅 선물' },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 hover:bg-stone-100 rounded-lg md:hidden"
            >
              <Menu className="w-5 h-5 text-stone-600" />
            </button>
            <Link to="/admin" className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              <span className="font-serif text-lg text-stone-800 hidden sm:inline">청첩장 작업실</span>
              <span className="px-2 py-0.5 bg-stone-800 text-white text-xs rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" /> Admin
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-stone-500 hover:text-stone-700 hidden sm:block">
              내 대시보드
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">로그아웃</span>
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
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 md:hidden"
            >
              <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-400" />
                  <span className="font-serif text-lg text-stone-800">관리자</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-stone-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-stone-600" />
                </button>
              </div>
              <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] pb-16">
                {menuItems.map((item) => {
                  const isActive = item.exact 
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-200">
                <Link 
                  to="/dashboard" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 text-sm text-stone-500 hover:text-stone-700"
                >
                  내 대시보드로 이동
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex">
        <aside className="w-56 min-h-[calc(100vh-57px)] bg-white border-r border-stone-200 p-4 hidden md:block">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
