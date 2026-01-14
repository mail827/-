import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle, Trash2, Calendar, Loader2, Heart } from 'lucide-react';
import { api } from '../../utils/api';
import type { Wedding } from '../../types';

interface Guestbook {
  id: string;
  name: string;
  message: string;
  isHidden: boolean;
  createdAt: string;
}

export default function AdminGuestbookList() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: weddingData } = useQuery({
    queryKey: ['wedding', id],
    queryFn: () => api<{ wedding: Wedding }>(`/weddings/${id}`),
    enabled: !!id
  });

  const { data, isLoading } = useQuery({
    queryKey: ['guestbooks', id],
    queryFn: () => api<{ guestbooks: Guestbook[] }>(`/guestbook/wedding/${id}`),
    enabled: !!id
  });

  const deleteMutation = useMutation({
    mutationFn: (guestbookId: string) => api(`/guestbook/${guestbookId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guestbooks', id] });
      queryClient.invalidateQueries({ queryKey: ['wedding', id] });
    }
  });

  const guestbooks = data?.guestbooks || [];
  const wedding = weddingData?.wedding;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/weddings" className="p-2 hover:bg-white rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#666]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">방명록</h1>
          {wedding && (
            <p className="text-[#666] mt-1">{wedding.groomName} ♥ {wedding.brideName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A5A5] to-[#E8C4C4] flex items-center justify-center mb-3">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-[#2D2D2D]">{guestbooks.length}</p>
          <p className="text-sm text-[#666]">전체 방명록</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9CAF88] to-[#B5C9A8] flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-[#2D2D2D]">
            {guestbooks.filter(g => !g.isHidden).length}
          </p>
          <p className="text-sm text-[#666]">공개 메시지</p>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 text-[#D4A5A5] animate-spin" />
        </div>
      ) : guestbooks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <MessageCircle className="w-12 h-12 text-[#D4A5A5]/30 mx-auto mb-4" />
          <p className="text-[#666]">아직 방명록이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {guestbooks.map((guestbook, index) => (
              <motion.div
                key={guestbook.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-2xl p-6 shadow-sm ${
                  guestbook.isHidden ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A5A5] to-[#C9A961] flex items-center justify-center text-white font-bold">
                        {guestbook.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#2D2D2D]">{guestbook.name}</h3>
                        <p className="text-xs text-[#999] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(guestbook.createdAt).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {guestbook.isHidden && (
                        <span className="px-2 py-0.5 bg-[#666]/10 text-[#666] text-xs rounded-full">
                          숨김
                        </span>
                      )}
                    </div>
                    <p className="text-[#2D2D2D] leading-relaxed whitespace-pre-wrap">
                      {guestbook.message}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (confirm('정말 삭제하시겠습니까?')) {
                        deleteMutation.mutate(guestbook.id);
                      }
                    }}
                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
