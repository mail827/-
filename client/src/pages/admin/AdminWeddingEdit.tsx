import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import WeddingForm from '../../components/admin/WeddingForm';
import { api } from '../../utils/api';
import type { Wedding } from '../../types';

export default function AdminWeddingEdit() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

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
