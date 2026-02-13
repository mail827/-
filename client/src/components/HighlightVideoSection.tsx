import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface HighlightVideo {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: string | null;
}

function getThumb(v: HighlightVideo) {
  if (v.thumbnailUrl) return v.thumbnailUrl;
  if (v.videoUrl.includes('youtube.com/embed/')) {
    const id = v.videoUrl.split('/embed/')[1]?.split('?')[0];
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  }
  if (v.videoUrl.includes('cloudinary.com')) {
    return v.videoUrl.replace('/video/upload/', '/video/upload/so_3,w_800,h_450,c_fill,q_auto,f_jpg/');
  }
  return '';
}

function isYoutube(url: string) {
  return url.includes('youtube.com/embed/');
}

export default function HighlightVideoSection() {
  const [videos, setVideos] = useState<HighlightVideo[]>([]);
  const [selected, setSelected] = useState<HighlightVideo | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/highlight-video`)
      .then(r => r.json())
      .then(setVideos)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = 'hidden';
      if (!isYoutube(selected.videoUrl)) setTimeout(() => videoRef.current?.play(), 400);
    } else {
      document.body.style.overflow = '';
      if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
    }
    return () => { document.body.style.overflow = ''; };
  }, [selected]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  if (videos.length === 0) return null;

  return (
    <>
      <section id="highlight" className="relative py-28 md:py-36 px-4 bg-[#1a1714] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(180,165,140,0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-[1]">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center text-[11px] tracking-[4px] uppercase mb-4"
            style={{ color: 'rgba(180,165,140,0.5)', fontFamily: "'Cormorant Garamond', serif" }}
          >
            Highlight Film
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-[22px] md:text-[28px] font-extralight text-center mb-3 leading-relaxed"
            style={{ color: 'rgba(245,240,232,0.9)', letterSpacing: '-0.5px' }}
          >
            두 사람의 이야기를, 영상으로
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-sm font-extralight text-center mb-10 md:mb-14"
            style={{ color: 'rgba(180,165,140,0.45)', letterSpacing: '0.5px' }}
          >
            토끼편집실이 담아낸 특별한 순간
          </motion.p>

          {videos.length === 1 ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              onClick={() => setSelected(videos[0])}
              className="max-w-[900px] mx-auto relative rounded-[4px] overflow-hidden cursor-pointer aspect-video bg-[#0f0e0c] group"
            >
              <div className="absolute inset-0 rounded-[4px] border border-white/[0.08] pointer-events-none z-[2]" />
              <img src={getThumb(videos[0])} alt={videos[0].title} className="w-full h-full object-cover transition-all duration-700 ease-out brightness-[0.7] saturate-[0.9] group-hover:scale-[1.03] group-hover:brightness-[0.5]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-[1]">
                <div className="w-14 h-14 md:w-[72px] md:h-[72px] rounded-full backdrop-blur-xl flex items-center justify-center transition-all duration-500 ease-out group-hover:scale-[1.08]" style={{ background: 'rgba(245,240,232,0.08)', border: '1px solid rgba(245,240,232,0.12)' }}>
                  <svg className="w-4 h-4 md:w-5 md:h-5 ml-[3px]" viewBox="0 0 24 24" fill="none">
                    <path d="M6 4l15 8-15 8V4z" fill="rgba(245,240,232,0.85)" />
                  </svg>
                </div>
                <span className="text-xs tracking-[3px] uppercase" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: "'Cormorant Garamond', serif" }}>Play Film</span>
              </div>
              {videos[0].duration && (
                <span className="absolute bottom-4 right-4 text-xs tracking-wider z-[1]" style={{ color: 'rgba(245,240,232,0.35)', fontFamily: "'Cormorant Garamond', serif" }}>{videos[0].duration}</span>
              )}
            </motion.div>
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
              {videos.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                  onClick={() => setSelected(v)}
                  className="flex-shrink-0 w-72 sm:w-80 snap-start relative rounded-[4px] overflow-hidden cursor-pointer aspect-video bg-[#0f0e0c] group"
                >
                  <div className="absolute inset-0 rounded-[4px] border border-white/[0.08] pointer-events-none z-[2]" />
                  <img src={getThumb(v)} alt={v.title} className="w-full h-full object-cover transition-all duration-700 ease-out brightness-[0.7] saturate-[0.9] group-hover:scale-[1.03] group-hover:brightness-[0.5]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-[1]">
                    <div className="w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all duration-500 group-hover:scale-[1.08]" style={{ background: 'rgba(245,240,232,0.08)', border: '1px solid rgba(245,240,232,0.12)' }}>
                      <svg className="w-4 h-4 ml-[2px]" viewBox="0 0 24 24" fill="none">
                        <path d="M6 4l15 8-15 8V4z" fill="rgba(245,240,232,0.85)" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent z-[1]">
                    <p className="text-sm font-light" style={{ color: 'rgba(245,240,232,0.85)' }}>{v.title}</p>
                    {v.duration && <span className="text-xs" style={{ color: 'rgba(245,240,232,0.4)' }}>{v.duration}</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="font-serif text-xs font-extralight text-center mt-6"
            style={{ color: 'rgba(180,165,140,0.3)' }}
          >
            Filmed & Edited by 토끼편집실
          </motion.p>
        </div>
      </section>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6"
            style={{ background: 'rgba(0,0,0,0.92)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[960px] aspect-video rounded-[4px] overflow-hidden"
            >
              <button onClick={() => setSelected(null)} className="absolute -top-10 md:-top-12 right-0 p-2">
                <X className="w-5 h-5 md:w-6 md:h-6" style={{ color: 'rgba(245,240,232,0.4)' }} />
              </button>
              {isYoutube(selected.videoUrl) ? (
                <iframe
                  src={`${selected.videoUrl}?autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video ref={videoRef} src={selected.videoUrl} controls playsInline preload="metadata" className="w-full h-full object-contain bg-black" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
