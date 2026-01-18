import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Eye, EyeOff, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface Guide {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  category: string;
  order: number;
  isPublished: boolean;
}

const CATEGORIES = [
  { value: 'BASIC', label: '기본 사용법' },
  { value: 'WEDDING', label: '청첩장 만들기' },
  { value: 'RSVP', label: 'RSVP 관리' },
  { value: 'GIFT', label: '선물/축의금' },
  { value: 'AI', label: 'AI 기능' },
];

export default function AdminGuides() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Guide | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    category: 'BASIC',
    isPublished: true,
  });

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/guide/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGuides(data);
      }
    } catch (e) {
      console.error('Failed to fetch guides:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, videoUrl: data.url }));
      }
    } catch (e) {
      alert('업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.videoUrl) {
      alert('제목과 영상은 필수입니다');
      return;
    }

    const token = localStorage.getItem('token');
    const url = editing
      ? `${import.meta.env.VITE_API_URL}/guide/${editing.id}`
      : `${import.meta.env.VITE_API_URL}/guide`;
    
    try {
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          order: editing?.order || guides.length,
        }),
      });
      
      if (res.ok) {
        fetchGuides();
        closeModal();
      }
    } catch (e) {
      alert('저장 실패');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    const token = localStorage.getItem('token');
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/guide/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setGuides(guides.filter(g => g.id !== id));
    } catch (e) {
      alert('삭제 실패');
    }
  };

  const togglePublish = async (guide: Guide) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/guide/${guide.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...guide, isPublished: !guide.isPublished }),
      });
      fetchGuides();
    } catch (e) {
      alert('수정 실패');
    }
  };

  const openEdit = (guide: Guide) => {
    setEditing(guide);
    setForm({
      title: guide.title,
      description: guide.description || '',
      videoUrl: guide.videoUrl,
      category: guide.category,
      isPublished: guide.isPublished,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ title: '', description: '', videoUrl: '', category: 'BASIC', isPublished: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-800">이용 가이드 관리</h1>
          <p className="text-stone-500 text-sm mt-1">총 {guides.length}개의 가이드</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-900 transition-all"
        >
          <Plus className="w-4 h-4" />
          새 가이드
        </motion.button>
      </div>

      {guides.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
          <Play className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500">아직 가이드가 없습니다</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-stone-600 hover:text-stone-800 text-sm underline"
          >
            첫 가이드 추가하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {guides.map((guide, index) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-stone-200 p-4 flex gap-4"
            >
              <div className="flex-shrink-0 w-32 sm:w-48 aspect-video bg-stone-100 rounded-lg overflow-hidden relative group">
                <video
                  src={guide.videoUrl}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-stone-800">{guide.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        guide.isPublished ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {guide.isPublished ? '공개' : '비공개'}
                      </span>
                    </div>
                    <span className="text-xs text-stone-400 mt-1 inline-block">
                      {CATEGORIES.find(c => c.value === guide.category)?.label || guide.category}
                    </span>
                  </div>
                </div>
                
                {guide.description && (
                  <p className="text-sm text-stone-500 mt-2 line-clamp-2">{guide.description}</p>
                )}
                
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => togglePublish(guide)}
                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg"
                    title={guide.isPublished ? '비공개로 변경' : '공개로 변경'}
                  >
                    {guide.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(guide)}
                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg"
                    title="수정"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(guide.id)}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-stone-100">
              <h2 className="text-lg font-semibold text-stone-800">
                {editing ? '가이드 수정' : '새 가이드 추가'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-stone-600 mb-2">제목 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="예: 청첩장 만드는 방법"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>
              
              <div>
                <label className="block text-sm text-stone-600 mb-2">설명</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="간단한 설명 (선택)"
                  rows={2}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>
              
              <div>
                <label className="block text-sm text-stone-600 mb-2">카테고리</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-stone-600 mb-2">영상 *</label>
                {form.videoUrl ? (
                  <div className="relative">
                    <video
                      src={form.videoUrl}
                      controls
                      className="w-full rounded-xl"
                    />
                    <button
                      onClick={() => setForm(prev => ({ ...prev, videoUrl: '' }))}
                      className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-stone-400">
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                    ) : (
                      <>
                        <Play className="w-8 h-8 text-stone-400 mb-2" />
                        <span className="text-stone-500 text-sm">영상 업로드</span>
                        <span className="text-stone-400 text-xs mt-1">MP4, MOV 등</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                  className="w-5 h-5 rounded"
                />
                <span className="text-stone-600">공개</span>
              </label>
            </div>
            
            <div className="p-6 border-t border-stone-100 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.title || !form.videoUrl || uploading}
                className="flex-1 px-4 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 disabled:opacity-50"
              >
                {editing ? '수정' : '추가'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
