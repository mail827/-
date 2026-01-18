import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  LayoutDashboard, 
  FileHeart, 
  LogOut,
  Sparkles,
  Palette
} from 'lucide-react';
import { useAuthStore } from '../../hooks/useAuth';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: '대시보드', end: true },
    { to: '/admin/weddings', icon: FileHeart, label: '청첩장 관리', end: false },
    { to: '/admin/theme-showcase', icon: Palette, label: '테마 쇼케이스', end: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F3] via-[#FAF5F0] to-[#F5E6E0] admin-panel">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#D4A5A5]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/admin" className="flex items-center gap-3 group">
              <motion.div 
                whileHover={{ rotate: 15 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A5A5] to-[#C9A961] flex items-center justify-center shadow-lg shadow-[#D4A5A5]/20"
              >
                <Heart className="w-5 h-5 text-white" fill="white" />
              </motion.div>
              <span className="text-lg font-bold text-[#2D2D2D] hidden sm:block">
                청첩장 스튜디오
              </span>
            </NavLink>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-1 bg-[#FDF8F3] rounded-full px-4 py-2">
                <Sparkles className="w-4 h-4 text-[#C9A961]" />
                <span className="text-sm font-medium text-[#2D2D2D]">
                  안녕, {admin?.name}!
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#D4A5A5] hover:text-[#C9A961] hover:bg-[#D4A5A5]/10 rounded-full transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap gap-2 mb-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4A5A5] to-[#C9A961] text-white shadow-lg shadow-[#D4A5A5]/30'
                    : 'bg-white text-[#666] hover:bg-[#F5E6E0] hover:text-[#2D2D2D]'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </div>

        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
