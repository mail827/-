import { useState, useEffect } from 'react';
import { Plus, GripVertical, Pencil, Trash2, Eye, EyeOff, X, Save } from 'lucide-react';

const THEME_OPTIONS = [
  { id: 'ROMANTIC_CLASSIC', name: '로맨틱 클래식' },
  { id: 'MODERN_MINIMAL', name: '모던 미니멀' },
  { id: 'BOHEMIAN_DREAM', name: '보헤미안 드림' },
  { id: 'LUXURY_GOLD', name: '럭셔리 골드' },
  { id: 'POETIC_LOVE', name: '포에틱 러브' },
  { id: 'SENIOR_SIMPLE', name: '어르신용 심플' },
  { id: 'FOREST_GARDEN', name: '포레스트 가든' },
  { id: 'OCEAN_BREEZE', name: '오션 브리즈' },
  { id: 'GLASS_BUBBLE', name: '글라스 버블' },
  { id: 'SPRING_BREEZE', name: '봄바람' },
  { id: 'GALLERY_MIRIM_1', name: 'Gallery 美林-1' },
  { id: 'GALLERY_MIRIM_2', name: 'Gallery 美林-2' },
];

const DEFAULT_SAMPLE_DATA = {
  groomName: '김민준',
  brideName: '이서연',
  weddingDate: '2026-05-15T12:00:00',
  weddingTime: '오후 12시',
  venueName: '그랜드 웨딩홀',
  venueHall: '루체홀',
  greetingTitle: '저희 두 사람이 사랑으로 만나 인생의 반려자가 되려 합니다.',
  greetingContent: '서로 아끼고 사랑하며 예쁘게 살겠습니다. 귀한 걸음 하시어 축복해 주시면 감사하겠습니다.',
};

interface ThemeShowcase {
  id: string;
  theme: string;
  title: string;
  description: string | null;
  sampleData: any;
  order: number;
  isActive: boolean;
}

export default function AdminThemeShowcase() {
  const [showcases, setShowcases] = useState<ThemeShowcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<ThemeShowcase | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fetchShowcases = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/theme-showcase/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShowcases(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShowcases(); }, []);

  const handleSave = async () => {
    if (!editModal) return;
    const token = localStorage.getItem('token');
    const url = isNew
      ? `${import.meta.env.VITE_API_URL}/theme-showcase`
      : `${import.meta.env.VITE_API_URL}/theme-showcase/${editModal.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editModal)
      });
      if (res.ok) {
        setEditModal(null);
        fetchShowcases();
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/theme-showcase/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchShowcases();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const toggleActive = async (showcase: ThemeShowcase) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/theme-showcase/${showcase.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...showcase, isActive: !showcase.isActive })
      });
      fetchShowcases();
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const openNewModal = () => {
    setIsNew(true);
    setEditModal({
      id: '',
      theme: 'ROMANTIC_CLASSIC',
      title: '',
      description: '',
      sampleData: DEFAULT_SAMPLE_DATA,
      order: showcases.length,
      isActive: true
    });
  };

  const openEditModal = (showcase: ThemeShowcase) => {
    setIsNew(false);
    setEditModal({ ...showcase, sampleData: showcase.sampleData || DEFAULT_SAMPLE_DATA });
  };

  if (loading) {
    return <div className="p-8 text-center text-stone-500">로딩 중...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-stone-800">테마 쇼케이스</h1>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">테마 추가</span>
          <span className="sm:hidden">추가</span>
        </button>
      </div>

      <div className="hidden md:block bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">순서</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">테마</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">제목</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">설명</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-stone-600">상태</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-stone-600">관리</th>
            </tr>
          </thead>
          <tbody>
            {showcases.map((showcase, idx) => (
              <tr key={showcase.id} className="border-b border-stone-100 hover:bg-stone-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-stone-400">
                    <GripVertical className="w-4 h-4 cursor-grab" />
                    {idx + 1}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-stone-800">
                  {THEME_OPTIONS.find(t => t.id === showcase.theme)?.name || showcase.theme}
                </td>
                <td className="px-4 py-3 text-stone-700">{showcase.title}</td>
                <td className="px-4 py-3 text-stone-500 text-sm max-w-[200px] truncate">{showcase.description || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleActive(showcase)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      showcase.isActive ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {showcase.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEditModal(showcase)}
                      className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(showcase.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {showcases.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-stone-400">
                  등록된 테마 쇼케이스가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {showcases.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400">
            등록된 테마 쇼케이스가 없습니다
          </div>
        ) : (
          showcases.map((showcase, idx) => (
            <div key={showcase.id} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-xs text-stone-500">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-stone-800">
                    {THEME_OPTIONS.find(t => t.id === showcase.theme)?.name || showcase.theme}
                  </span>
                </div>
                <button
                  onClick={() => toggleActive(showcase)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showcase.isActive ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {showcase.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="space-y-1 mb-3">
                <p className="text-sm text-stone-700">{showcase.title || '(제목 없음)'}</p>
                {showcase.description && (
                  <p className="text-xs text-stone-500 line-clamp-2">{showcase.description}</p>
                )}
              </div>
              
              <div className="flex gap-2 pt-3 border-t border-stone-100">
                <button
                  onClick={() => openEditModal(showcase)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-stone-600 hover:bg-stone-50 rounded-lg transition-colors text-sm"
                >
                  <Pencil className="w-4 h-4" />
                  수정
                </button>
                <button
                  onClick={() => handleDelete(showcase.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditModal(null)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-stone-200 px-4 sm:px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-800">
                {isNew ? '테마 쇼케이스 추가' : '테마 쇼케이스 수정'}
              </h2>
              <button onClick={() => setEditModal(null)} className="p-2 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">테마 선택</label>
                <select
                  value={editModal.theme}
                  onChange={(e) => setEditModal({ ...editModal, theme: e.target.value })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 bg-white"
                >
                  {THEME_OPTIONS.map(theme => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">제목</label>
                <input
                  type="text"
                  value={editModal.title}
                  onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
                  placeholder="예: 우아한 클래식 감성"
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">설명</label>
                <textarea
                  value={editModal.description || ''}
                  onChange={(e) => setEditModal({ ...editModal, description: e.target.value })}
                  placeholder="테마에 대한 간단한 설명"
                  rows={3}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
                />
              </div>

              <div className="border-t border-stone-200 pt-4">
                <h3 className="text-sm font-medium text-stone-700 mb-3">샘플 데이터 (미리보기용)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">신랑 이름</label>
                    <input
                      type="text"
                      value={editModal.sampleData?.groomName || ''}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        sampleData: { ...editModal.sampleData, groomName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">신부 이름</label>
                    <input
                      type="text"
                      value={editModal.sampleData?.brideName || ''}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        sampleData: { ...editModal.sampleData, brideName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">예식장</label>
                    <input
                      type="text"
                      value={editModal.sampleData?.venueName || ''}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        sampleData: { ...editModal.sampleData, venueName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">홀</label>
                    <input
                      type="text"
                      value={editModal.sampleData?.venueHall || ''}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        sampleData: { ...editModal.sampleData, venueHall: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editModal.isActive}
                  onChange={(e) => setEditModal({ ...editModal, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-stone-300"
                />
                <label htmlFor="isActive" className="text-sm text-stone-700">활성화</label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-stone-50 border-t border-stone-200 px-4 sm:px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setEditModal(null)}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors"
              >
                <Save className="w-4 h-4" />
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
