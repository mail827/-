import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Send, Bell, MessageSquare, Calendar } from 'lucide-react';
import WeddingForm from '../../components/admin/WeddingForm';
import { api } from '../../utils/api';
import type { Wedding } from '../../types';

export default function AdminWeddingEdit() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [customMessage, setCustomMessage] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<{ type: string; message: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['wedding', id],
    queryFn: () => api<Wedding>(`/weddings/${id}`),
    enabled: !!id
  });

  const updateMutation = useMutation({
    mutationFn: (updateData: Partial<Wedding>) =>
      api<Wedding>(`/weddings/${id}`, { method: 'PUT', body: updateData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding', id] });
      queryClient.invalidateQueries({ queryKey: ['weddings'] });
    }
  });

  const addGalleryMutation = useMutation({
    mutationFn: ({ mediaUrl, mediaType }: { mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO' }) =>
      api(`/weddings/${id}/gallery`, { method: 'POST', body: { mediaUrl, mediaType } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding', id] });
    }
  });

  const deleteGalleryMutation = useMutation({
    mutationFn: (galleryId: string) =>
      api(`/weddings/${id}/gallery/${galleryId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding', id] });
    }
  });

  const sendNotification = async (type: 'summary' | 'reminder' | 'custom') => {
    setNotificationStatus(null);
    try {
      const body = type === 'custom' ? { message: customMessage } : undefined;
      const res = await api<{ success: boolean; sentTo: number; dDay?: number }>(
        `/notification/${type}/${id}`,
        { method: 'POST', body }
      );
      
      if (res.success) {
        const typeNames = { summary: 'RSVP 현황', reminder: '리마인더', custom: '커스텀 메시지' };
        setNotificationStatus({ 
          type: 'success', 
          message: `${typeNames[type]} 알림이 ${res.sentTo}명에게 발송되었습니다${res.dDay !== undefined ? ` (D-${res.dDay})` : ''}` 
        });
        if (type === 'custom') setCustomMessage('');
      }
    } catch (err: any) {
      setNotificationStatus({ type: 'error', message: err.message || '발송 실패' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#D4A5A5] animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-[#666]">청첩장을 찾을 수 없습니다</p>
        <Link to="/admin/weddings" className="text-[#D4A5A5] text-sm hover:underline mt-2 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/weddings"
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#666]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">
            {data.groomName} ♥ {data.brideName}
          </h1>
          <p className="text-[#666] mt-1">청첩장 정보를 수정하세요</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#2D2D2D] mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#D4A5A5]" />
          카카오톡 알림 발송
        </h2>
        
        {notificationStatus && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            notificationStatus.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {notificationStatus.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => sendNotification('summary')}
            className="flex items-center justify-center gap-2 p-4 border-2 border-stone-200 rounded-xl hover:border-[#D4A5A5] hover:bg-[#FDF8F8] transition-all"
          >
            <Send className="w-5 h-5 text-[#D4A5A5]" />
            <div className="text-left">
              <p className="font-medium text-[#2D2D2D]">RSVP 현황 알림</p>
              <p className="text-xs text-[#888]">현재 참석/불참 현황 발송</p>
            </div>
          </button>

          <button
            onClick={() => sendNotification('reminder')}
            className="flex items-center justify-center gap-2 p-4 border-2 border-stone-200 rounded-xl hover:border-[#D4A5A5] hover:bg-[#FDF8F8] transition-all"
          >
            <Calendar className="w-5 h-5 text-[#D4A5A5]" />
            <div className="text-left">
              <p className="font-medium text-[#2D2D2D]">D-Day 리마인더</p>
              <p className="text-xs text-[#888]">결혼식 날짜 안내 발송</p>
            </div>
          </button>
        </div>

        <div className="border-t border-stone-100 pt-4">
          <div className="flex items-start gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-[#D4A5A5] mt-0.5" />
            <p className="font-medium text-[#2D2D2D]">커스텀 메시지</p>
          </div>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="신랑/신부에게 보낼 메시지를 입력하세요..."
            rows={3}
            className="w-full p-3 border border-stone-200 rounded-lg text-sm resize-none focus:outline-none focus:border-[#D4A5A5]"
          />
          <button
            onClick={() => sendNotification('custom')}
            disabled={!customMessage.trim()}
            className="mt-2 px-4 py-2 bg-[#D4A5A5] text-white rounded-lg text-sm hover:bg-[#C99595] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            커스텀 메시지 발송
          </button>
        </div>
      </div>

      <WeddingForm
        wedding={data}
        onSubmit={(formData) => updateMutation.mutate(formData)}
        onAddGallery={(mediaUrl, mediaType) => addGalleryMutation.mutate({ mediaUrl, mediaType })}
        onDeleteGallery={(galleryId) => deleteGalleryMutation.mutate(galleryId)}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
