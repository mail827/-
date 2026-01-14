import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import WeddingForm from '../../components/admin/WeddingForm';
import { api } from '../../utils/api';
import type { Wedding } from '../../types';

export default function AdminWeddingCreate() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (data: Partial<Wedding>) => 
      api<{ wedding: Wedding }>('/weddings', { method: 'POST', body: data }),
    onSuccess: (data) => {
      navigate(`/admin/weddings/${data.wedding.id}`);
    }
  });

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
          <h1 className="text-2xl font-bold text-[#2D2D2D]">새 청첩장 만들기</h1>
          <p className="text-[#666] mt-1">특별한 순간을 담아보세요</p>
        </div>
      </div>

      <WeddingForm
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
