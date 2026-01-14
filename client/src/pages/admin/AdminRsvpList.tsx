import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Users, UserCheck, UserX, UsersRound, 
  Trash2, Download, Calendar, Loader2 
} from 'lucide-react';
import { useState } from 'react';
import { api } from '../../utils/api';
import type { Wedding } from '../../types';

interface Rsvp {
  id: string;
  name: string;
  phone: string;
  side: 'GROOM' | 'BRIDE';
  attending: boolean;
  guestCount: number;
  message: string;
  mealType: string | null;
  createdAt: string;
}

export default function AdminRsvpList() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'attending' | 'notAttending'>('all');
  const [sideFilter, setSideFilter] = useState<'all' | 'GROOM' | 'BRIDE'>('all');

  const { data: weddingData } = useQuery({
    queryKey: ['wedding', id],
    queryFn: () => api<{ wedding: Wedding }>(`/weddings/${id}`),
    enabled: !!id
  });

  const { data, isLoading } = useQuery({
    queryKey: ['rsvps', id],
    queryFn: () => api<{ rsvps: Rsvp[] }>(`/rsvp/wedding/${id}`),
    enabled: !!id
  });

  const deleteMutation = useMutation({
    mutationFn: (rsvpId: string) => api(`/rsvp/${rsvpId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rsvps', id] });
      queryClient.invalidateQueries({ queryKey: ['wedding', id] });
    }
  });

  const rsvps = data?.rsvps || [];
  const wedding = weddingData?.wedding;

  const filteredRsvps = rsvps.filter(rsvp => {
    if (filter === 'attending' && !rsvp.attending) return false;
    if (filter === 'notAttending' && rsvp.attending) return false;
    if (sideFilter !== 'all' && rsvp.side !== sideFilter) return false;
    return true;
  });

  const stats = {
    total: rsvps.length,
    attending: rsvps.filter(r => r.attending).length,
    notAttending: rsvps.filter(r => !r.attending).length,
    totalGuests: rsvps.filter(r => r.attending).reduce((sum, r) => sum + r.guestCount, 0),
    groomSide: rsvps.filter(r => r.side === 'GROOM' && r.attending).length,
    brideSide: rsvps.filter(r => r.side === 'BRIDE' && r.attending).length
  };

  const exportToCsv = () => {
    const headers = ['이름', '연락처', '측', '참석여부', '동반인원', '메시지', '식사종류', '등록일시'];
    const rows = rsvps.map(r => [
      r.name,
      r.phone,
      r.side === 'GROOM' ? '신랑' : '신부',
      r.attending ? '참석' : '불참',
      r.guestCount.toString(),
      r.message,
      r.mealType || '',
      new Date(r.createdAt).toLocaleString('ko-KR')
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rsvp_${wedding?.groomName}_${wedding?.brideName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/weddings" className="p-2 hover:bg-white rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#666]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#2D2D2D]">참석 응답</h1>
            {wedding && (
              <p className="text-[#666] mt-1">{wedding.groomName} ♥ {wedding.brideName}</p>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportToCsv}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#666] rounded-xl hover:bg-[#FDF8F3] transition-colors"
        >
          <Download className="w-4 h-4" />
          CSV 다운로드
        </motion.button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '전체 응답', value: stats.total, icon: Users, color: 'from-[#D4A5A5] to-[#E8C4C4]' },
          { label: '참석', value: stats.attending, icon: UserCheck, color: 'from-[#9CAF88] to-[#B5C9A8]' },
          { label: '불참', value: stats.notAttending, icon: UserX, color: 'from-[#C9A961] to-[#E0C88A]' },
          { label: '총 예상 인원', value: stats.totalGuests, icon: UsersRound, color: 'from-[#8B7355] to-[#A69076]' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-[#2D2D2D]">{stat.value}</p>
            <p className="text-sm text-[#666]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap gap-2">
        <div className="flex gap-2">
          {[
            { id: 'all', label: '전체' },
            { id: 'attending', label: '참석' },
            { id: 'notAttending', label: '불참' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === item.id
                  ? 'bg-gradient-to-r from-[#D4A5A5] to-[#C9A961] text-white'
                  : 'bg-[#FDF8F3] text-[#666] hover:bg-[#F5E6E0]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="w-px bg-[#E5E5E5] mx-2 hidden sm:block" />
        <div className="flex gap-2">
          {[
            { id: 'all', label: '양측' },
            { id: 'GROOM', label: '🤵 신랑측' },
            { id: 'BRIDE', label: '👰 신부측' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSideFilter(item.id as typeof sideFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sideFilter === item.id
                  ? 'bg-gradient-to-r from-[#D4A5A5] to-[#C9A961] text-white'
                  : 'bg-[#FDF8F3] text-[#666] hover:bg-[#F5E6E0]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 text-[#D4A5A5] animate-spin" />
        </div>
      ) : filteredRsvps.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-[#D4A5A5]/30 mx-auto mb-4" />
          <p className="text-[#666]">아직 응답이 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FDF8F3]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#666]">이름</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#666]">연락처</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-[#666]">측</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-[#666]">참석</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-[#666]">인원</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#666]">메시지</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#666]">등록일</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredRsvps.map((rsvp, index) => (
                    <motion.tr
                      key={rsvp.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-t border-[#F5E6E0] hover:bg-[#FDF8F3]/50"
                    >
                      <td className="px-6 py-4 font-medium text-[#2D2D2D]">{rsvp.name}</td>
                      <td className="px-6 py-4 text-[#666]">{rsvp.phone}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          rsvp.side === 'GROOM' 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'bg-pink-50 text-pink-600'
                        }`}>
                          {rsvp.side === 'GROOM' ? '신랑' : '신부'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rsvp.attending 
                            ? 'bg-[#9CAF88]/20 text-[#6B8E5E]' 
                            : 'bg-[#D4A5A5]/20 text-[#B08888]'
                        }`}>
                          {rsvp.attending ? '참석' : '불참'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-[#2D2D2D]">{rsvp.guestCount}명</td>
                      <td className="px-6 py-4 text-[#666] max-w-xs truncate">{rsvp.message || '-'}</td>
                      <td className="px-6 py-4 text-[#999] text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(rsvp.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (confirm('정말 삭제하시겠습니까?')) {
                              deleteMutation.mutate(rsvp.id);
                            }
                          }}
                          className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.attending > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-[#2D2D2D] mb-4">측별 참석 현황</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#666]">🤵 신랑측</span>
                <span className="font-medium text-[#2D2D2D]">{stats.groomSide}명</span>
              </div>
              <div className="h-3 bg-[#FDF8F3] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.attending > 0 ? (stats.groomSide / stats.attending) * 100 : 0}%` }}
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#666]">👰 신부측</span>
                <span className="font-medium text-[#2D2D2D]">{stats.brideSide}명</span>
              </div>
              <div className="h-3 bg-[#FDF8F3] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.attending > 0 ? (stats.brideSide / stats.attending) * 100 : 0}%` }}
                  className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
