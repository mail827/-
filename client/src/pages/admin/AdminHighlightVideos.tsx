import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Film, Upload, Loader2, Link } from 'lucide-react';

interface HighlightVideo {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: string | null;
  order: number;
  isPublished: boolean;
}

type VideoSource = 'upload' | 'youtube' | 'url';

export default function AdminHighlightVideos() {
  const [videos, setVideos] = useState<HighlightVideo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', videoUrl: '', thumbnailUrl: '', duration: '', order: 0, isPublished: true });
  const [loading, setLoading] = useState(false);
  const [videoSource, setVideoSource] = useState<VideoSource>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const getToken = () => localStorage.getItem('token');

  const api = (path: string, opts?: RequestInit) =>
    fetch(`${import.meta.env.VITE_API_URL}/highlight-video${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...opts?.headers },
    });

  const fetchVideos = async () => {
    try {
      const res = await api('/admin');
      if (res.ok) setVideos(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', videoUrl: '', thumbnailUrl: '', duration: '', order: 0, isPublished: true });
    setEditingId(null);
    setShowForm(false);
    setVideoSource('upload');
    setUploadProgress('');
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const maxSize = 95 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('파일이 너무 큽니다. 95MB 이하로 압축해주세요.');
      return;
    }
    setUploading(true);
    setUploadProgress('업로드 중...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'highlight-videos');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload/video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, videoUrl: data.url }));
        setUploadProgress('업로드 완료');
      } else {
        setUploadProgress('업로드 실패');
      }
    } catch (e) {
      console.error(e);
      setUploadProgress('업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([^?&\s]+)/);
    return match ? match[1] : null;
  };

  const handleYoutubeUrl = (url: string) => {
    const id = extractYoutubeId(url);
    if (id) {
      setForm(prev => ({
        ...prev,
        videoUrl: `https://www.youtube.com/embed/${id}`,
        thumbnailUrl: prev.thumbnailUrl || `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
      }));
    } else {
      setForm(prev => ({ ...prev, videoUrl: url }));
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.videoUrl) return;
    setLoading(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const path = editingId ? `/${editingId}` : '';
      const res = await api(path, { method, body: JSON.stringify(form) });
      if (res.ok) { fetchVideos(); resetForm(); }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (v: HighlightVideo) => {
    setForm({
      title: v.title,
      description: v.description || '',
      videoUrl: v.videoUrl,
      thumbnailUrl: v.thumbnailUrl || '',
      duration: v.duration || '',
      order: v.order,
      isPublished: v.isPublished,
    });
    if (v.videoUrl.includes('youtube.com')) setVideoSource('youtube');
    else if (v.videoUrl.includes('cloudinary.com')) setVideoSource('upload');
    else setVideoSource('url');
    setEditingId(v.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await api(`/${id}`, { method: 'DELETE' });
      if (res.ok) fetchVideos();
    } catch (e) {
      console.error(e);
    }
  };

  const togglePublish = async (v: HighlightVideo) => {
    try {
      await api(`/${v.id}`, { method: 'PUT', body: JSON.stringify({ ...v, isPublished: !v.isPublished }) });
      fetchVideos();
    } catch (e) {
      console.error(e);
    }
  };

  const getThumb = (v: HighlightVideo) => {
    if (v.thumbnailUrl) return v.thumbnailUrl;
    if (v.videoUrl.includes('youtube.com/embed/')) {
      const id = v.videoUrl.split('/embed/')[1]?.split('?')[0];
      return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    }
    if (v.videoUrl.includes('cloudinary.com')) {
      return v.videoUrl.replace('/video/upload/', '/video/upload/so_3,w_400,h_225,c_fill,q_auto,f_jpg/');
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">웨딩시네마 관리</h1>
          <p className="text-sm text-stone-400 mt-1">랜딩 페이지에 표시되는 하이라이트 영상</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-full text-sm font-medium hover:bg-stone-900 transition-colors"
        >
          <Plus className="w-4 h-4" />
          영상 추가
        </motion.button>
      </div>

      {videos.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-100">
          <Film className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-400">등록된 영상이 없습니다</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {videos.map((v) => (
            <motion.div
              key={v.id}
              layout
              className={`bg-white rounded-xl p-4 flex items-center gap-4 border transition-all ${v.isPublished ? 'border-stone-200' : 'border-stone-100 opacity-50'}`}
            >
              <div className="w-36 h-20 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                {getThumb(v) ? (
                  <img src={getThumb(v)} alt={v.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-6 h-6 text-stone-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-stone-800 truncate">{v.title}</h3>
                  {v.duration && <span className="text-xs text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full flex-shrink-0">{v.duration}</span>}
                  {v.videoUrl.includes('youtube') && <span className="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">YouTube</span>}
                </div>
                {v.description && <p className="text-sm text-stone-400 truncate">{v.description}</p>}
                <p className="text-xs text-stone-300 mt-1 truncate">{v.videoUrl}</p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs text-stone-400 bg-stone-50 px-2 py-1 rounded mr-1">#{v.order}</span>
                <button onClick={() => togglePublish(v)} className="p-2 rounded-lg hover:bg-stone-50 transition-colors" title={v.isPublished ? '숨기기' : '공개하기'}>
                  {v.isPublished ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-stone-300" />}
                </button>
                <button onClick={() => handleEdit(v)} className="p-2 rounded-lg hover:bg-stone-50 transition-colors">
                  <Pencil className="w-4 h-4 text-stone-500" />
                </button>
                <button onClick={() => handleDelete(v.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => resetForm()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-stone-800">{editingId ? '영상 수정' : '영상 추가'}</h3>
                <button onClick={resetForm} className="p-2 hover:bg-stone-100 rounded-full"><X className="w-5 h-5 text-stone-400" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">제목 *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="하이라이트 영상 제목" className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">설명</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="영상에 대한 간단한 설명" className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">영상 소스 *</label>
                  <div className="flex gap-2 mb-3">
                    {([['upload', '파일 업로드', Upload], ['youtube', 'YouTube', Film], ['url', '직접 입력', Link]] as const).map(([key, label, Icon]) => (
                      <button
                        key={key}
                        onClick={() => setVideoSource(key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${videoSource === key ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {videoSource === 'upload' && (
                    <div>
                      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="w-full py-8 border-2 border-dashed border-stone-200 rounded-xl hover:border-stone-400 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                            <span className="text-sm text-stone-500">{uploadProgress}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-stone-400" />
                            <span className="text-sm text-stone-500">클릭하여 영상 파일 선택</span>
                            <span className="text-xs text-stone-300">최대 95MB</span>
                          </>
                        )}
                      </button>
                      {form.videoUrl && !uploading && (
                        <p className="text-xs text-emerald-500 mt-2 truncate">업로드 완료: {form.videoUrl}</p>
                      )}
                    </div>
                  )}

                  {videoSource === 'youtube' && (
                    <input
                      value={form.videoUrl}
                      onChange={(e) => handleYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                  )}

                  {videoSource === 'url' && (
                    <input
                      value={form.videoUrl}
                      onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                      placeholder="Cloudinary 등 외부 영상 URL"
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">썸네일 URL</label>
                  <input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="비워두면 자동 추출" className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">재생시간</label>
                    <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="4:05" className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">순서</label>
                    <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="w-4 h-4 rounded accent-stone-800" />
                  <span className="text-sm text-stone-700">공개</span>
                </label>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !form.title || !form.videoUrl}
                  className="w-full py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-900 disabled:opacity-50 transition-all"
                >
                  {loading ? '처리중...' : editingId ? '수정하기' : '추가하기'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
