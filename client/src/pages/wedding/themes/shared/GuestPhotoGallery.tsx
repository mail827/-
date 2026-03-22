import { useState, useEffect, useRef } from 'react';
import { Camera, X, Send, Loader2, ChevronLeft, ChevronRight, Play, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL;
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'wedding_guide';

interface GuestPhoto {
  id: string;
  guestName: string;
  imageUrl: string;
  mediaType?: string;
  message?: string;
  createdAt: string;
}

interface Props {
  slug: string;
  locale?: string;
  enabled?: boolean;
}

export default function GuestPhotoGallery({ slug, enabled = true, locale = 'ko' }: Props) {
  const [photos, setPhotos] = useState<GuestPhoto[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  const [previews, setPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [uploadMode, setUploadMode] = useState<'photo' | 'video'>('photo');
  const inputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadPhotos(); }, [slug]);
  useEffect(() => () => { previews.forEach(p => URL.revokeObjectURL(p.url)); }, [previews]);

  const loadPhotos = async () => {
    try {
      const res = await fetch(`${API}/guest-photo/${slug}`);
      if (res.ok) setPhotos(await res.json());
    } catch {}
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 10);
    if (!selected.length) return;
    setFiles(selected);
    setUploadMode('photo');
    setPreviews(selected.map(f => ({ url: URL.createObjectURL(f), type: 'image' })));
    setShowUpload(true);
    e.target.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      alert(locale === 'en' ? 'Video must be under 100MB' : '영상은 100MB 이하만 업로드 가능합니다.');
      return;
    }
    setFiles([file]);
    setUploadMode('video');
    setPreviews([{ url: URL.createObjectURL(file), type: 'video' }]);
    setShowUpload(true);
    e.target.value = '';
  };

  const uploadVideoToCloudinary = (file: File): Promise<{ url: string; publicId: string }> => {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      fd.append('folder', `wedding/${slug}/guest-videos`);
      fd.append('resource_type', 'video');
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          resolve({ url: res.secure_url, publicId: res.public_id });
        } else reject(new Error('업로드 실패'));
      };
      xhr.onerror = () => reject(new Error('네트워크 오류'));
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`);
      xhr.send(fd);
    });
  };

  const handleUpload = async () => {
    if (!files.length || uploading) return;
    setUploading(true);
    setUploadedCount(0);
    try {
      if (uploadMode === 'video') {
        const { url, publicId } = await uploadVideoToCloudinary(files[0]);
        await fetch(`${API}/guest-photo/${slug}/upload-video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestName: guestName || '익명',
            message: message || undefined,
            videoUrl: url,
            publicId
          })
        });
        setUploadedCount(1);
      } else {
        for (let i = 0; i < files.length; i++) {
          const fd = new FormData();
          fd.append('photo', files[i]);
          fd.append('guestName', guestName || '익명');
          if (message) fd.append('message', message);
          await fetch(`${API}/guest-photo/${slug}/upload`, { method: 'POST', body: fd });
          setUploadedCount(i + 1);
        }
      }
      setUploaded(true);
      setShowUpload(false);
      setFiles([]);
      setPreviews([]);
      setGuestName('');
      setMessage('');
      await loadPhotos();
      setTimeout(() => setUploaded(false), 3000);
    } catch {
      alert('업로드에 실패했습니다. 다시 시도해주세요.');
    }
    setUploading(false);
  };

  const getVideoThumbnail = (url: string) => {
    return url.replace(/\.(mp4|mov|avi|webm)$/i, '.jpg').replace('/video/upload/', '/video/upload/w_400,h_400,c_fill,so_0/');
  };

  const isVideo = (photo: GuestPhoto) => photo.mediaType === 'VIDEO';

  if (!enabled) return null;

  return (
    <div className="py-12 px-4">
      <div className="text-center mb-8">
        <h3 className="text-lg tracking-[0.15em] mb-6">GUEST GALLERY</h3>
        <p className="text-sm mt-2 opacity-60">{locale === 'en' ? 'Help us remember this day.' : '우리의 순간을 함께 채워주세요'}</p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mb-6 max-w-md mx-auto">
          {photos.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
              onClick={() => setViewIndex(i)} className="aspect-square overflow-hidden cursor-pointer rounded-sm relative group">
              {isVideo(p) ? (
                <>
                  <img src={getVideoThumbnail(p.imageUrl)} alt={p.guestName} loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.background = '#e7e5e4'; }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                </>
              ) : (
                <img src={p.imageUrl} alt={p.guestName} loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              )}
            </motion.div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="text-center py-8 mb-6">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm opacity-40">{locale === 'en' ? 'Be the first to capture a memory.' : '첫 번째 사진을 올려주세요'}</p>
        </div>
      )}

      <div className="text-center">
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm border border-current opacity-70">
            <Camera className="w-4 h-4" />
            {locale === 'en' ? 'Photo' : '사진'}
          </button>
          <button onClick={() => videoInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm border border-current opacity-70">
            <Film className="w-4 h-4" />
            {locale === 'en' ? 'Video' : '영상'}
          </button>
        </div>
        <p className="text-xs mt-2 opacity-50">{locale === 'en' ? 'Max 10 photos · Max 100MB video' : '사진 최대 10장 · 영상 최대 100MB'}</p>
        <AnimatePresence>
          {uploaded && (
            <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs mt-3 opacity-70">감사합니다! 업로드됐어요</motion.p>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showUpload && previews.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={() => { setShowUpload(false); setPreviews([]); setFiles([]); }}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-stone-800">
                  {uploadMode === 'video' ? (locale === 'en' ? 'Upload Video' : '영상 올리기') : (locale === 'en' ? 'Upload Photo' : '사진 올리기')}
                </p>
                <button onClick={() => { setShowUpload(false); setPreviews([]); setFiles([]); }}><X className="w-5 h-5 text-stone-400" /></button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {previews.map((p, i) => (
                  p.type === 'video' ? (
                    <div key={i} className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100 relative">
                      <video src={p.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
                        {(files[i]?.size / 1024 / 1024).toFixed(1)}MB
                      </div>
                    </div>
                  ) : (
                    <img key={i} src={p.url} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                  )
                ))}
              </div>
              <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="이름 (선택)"
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400" />
              <input value={message} onChange={e => setMessage(e.target.value)} placeholder="한마디 (선택)"
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400" />
              <button onClick={handleUpload} disabled={uploading}
                className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {uploading
                  ? uploadMode === 'video'
                    ? locale === 'en' ? 'Uploading video...' : '영상 업로드 중...'
                    : `${uploadedCount}/${files.length} 업로드 중...`
                  : uploadMode === 'video'
                    ? (locale === 'en' ? 'Upload Video' : '영상 올리기')
                    : `${files.length}장 올리기`
                }
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewIndex !== null && photos[viewIndex] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setViewIndex(null)}>
            <button onClick={e => { e.stopPropagation(); setViewIndex(Math.max(0, viewIndex - 1)); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white z-10"><ChevronLeft className="w-6 h-6" /></button>
            <div className="max-w-lg w-full px-4" onClick={e => e.stopPropagation()}>
              {isVideo(photos[viewIndex]) ? (
                <video
                  src={photos[viewIndex].imageUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full rounded-lg max-h-[70vh]"
                />
              ) : (
                <img src={photos[viewIndex].imageUrl} alt="" className="w-full rounded-lg" />
              )}
              <div className="text-center mt-3">
                <p className="text-white/80 text-sm">{photos[viewIndex].guestName}</p>
                {photos[viewIndex].message && <p className="text-white/50 text-xs mt-1">{photos[viewIndex].message}</p>}
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); setViewIndex(Math.min(photos.length - 1, viewIndex + 1)); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white z-10"><ChevronRight className="w-6 h-6" /></button>
            <button onClick={() => setViewIndex(null)} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white"><X className="w-6 h-6" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
