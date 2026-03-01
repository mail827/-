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
      {videos.length === 1 ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          onClick={() => setSelected(videos[0])}
          style={{ position: "relative", borderRadius: 12, overflow: "hidden", cursor: "pointer", aspectRatio: "16/9", background: "#0f0e0c" }}
        >
          <img src={getThumb(videos[0])} alt={videos[0].title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7) saturate(0.9)", transition: "all 0.7s ease-out" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(245,240,232,0.1)", border: "1px solid rgba(245,240,232,0.15)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg style={{ width: 18, height: 18, marginLeft: 3 }} viewBox="0 0 24 24" fill="none">
                <path d="M6 4l15 8-15 8V4z" fill="rgba(245,240,232,0.85)" />
              </svg>
            </div>
            <span style={{ fontSize: 11, letterSpacing: 3, color: "rgba(245,240,232,0.5)", textTransform: "uppercase" }}>Play Film</span>
          </div>
          {videos[0].duration && (
            <span style={{ position: "absolute", bottom: 12, right: 14, fontSize: 11, color: "rgba(245,240,232,0.35)", letterSpacing: 1 }}>{videos[0].duration}</span>
          )}
        </motion.div>
      ) : (
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
          {videos.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 + i * 0.1 }}
              onClick={() => setSelected(v)}
              style={{ flex: "0 0 320px", position: "relative", borderRadius: 12, overflow: "hidden", cursor: "pointer", aspectRatio: "16/9", background: "#0f0e0c" }}
            >
              <img src={getThumb(v)} alt={v.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7) saturate(0.9)", transition: "all 0.7s ease-out" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(245,240,232,0.1)", border: "1px solid rgba(245,240,232,0.15)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg style={{ width: 16, height: 16, marginLeft: 2 }} viewBox="0 0 24 24" fill="none">
                    <path d="M6 4l15 8-15 8V4z" fill="rgba(245,240,232,0.85)" />
                  </svg>
                </div>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 14, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
                <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(245,240,232,0.85)" }}>{v.title}</p>
                {v.duration && <span style={{ fontSize: 11, color: "rgba(245,240,232,0.4)" }}>{v.duration}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.92)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ position: "relative", width: "100%", maxWidth: 960, aspectRatio: "16/9", borderRadius: 4, overflow: "hidden" }}
            >
              <button onClick={() => setSelected(null)} style={{ position: "absolute", top: -40, right: 0, padding: 8, background: "none", border: "none", cursor: "pointer" }}>
                <X size={22} style={{ color: "rgba(245,240,232,0.4)" }} />
              </button>
              {isYoutube(selected.videoUrl) ? (
                <iframe
                  src={`${selected.videoUrl}?autoplay=1`}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video ref={videoRef} src={selected.videoUrl} controls playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
