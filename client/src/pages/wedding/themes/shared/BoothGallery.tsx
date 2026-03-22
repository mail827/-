import { useState, useEffect } from 'react';
import { Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL;

interface BoothPhoto {
  id: string;
  guestName: string;
  imageUrl: string;
  message?: string;
  createdAt: string;
}

interface Props {
  slug: string;
  locale?: string;
}

export default function BoothGallery({ slug, locale = 'ko' }: Props) {
  const [photos, setPhotos] = useState<BoothPhoto[]>([]);
  const [viewIndex, setViewIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API}/guest-photo/${slug}/ai-booth/gallery`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPhotos(d); })
      .catch(() => {});
  }, [slug]);

  if (!photos.length) return null;

  const download = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `booth-${Date.now()}.jpg`;
    a.click();
  };

  const conceptLabel = (msg?: string) => {
    const map: Record<string, string> = { gala: 'Gala', flower: 'Flower', hanbok: 'Hanbok', redcarpet: 'Red Carpet', magazine: 'Magazine', champagne: 'Champagne' };
    return msg ? map[msg] || msg : '';
  };

  return (
    <div style={{ padding: '40px 0', textAlign: 'center', color: 'inherit' }}>
      <div style={{ width: 1, height: 32, background: 'currentColor', opacity: 0.12, margin: '0 auto 20px' }} />
      <p style={{ fontSize: 10, letterSpacing: 3, opacity: 0.35, marginBottom: 6 }}>AI PHOTO BOOTH</p>
      <p style={{ fontSize: 13, opacity: 0.45, marginBottom: 24 }}>
        {locale === 'en' ? 'Moments captured by guests' : '하객들의 축하 스냅'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>
        {photos.map((p, i) => (
          <div
            key={p.id}
            onClick={() => setViewIndex(i)}
            style={{ position: 'relative', aspectRatio: '2/3', borderRadius: 6, overflow: 'hidden', cursor: 'pointer' }}
          >
            <img src={p.imageUrl} alt={p.guestName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 8px 6px', background: 'linear-gradient(transparent, rgba(0,0,0,0.5))', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 10, color: '#fff', opacity: 0.9 }}>{p.guestName}</span>
              <span style={{ fontSize: 9, color: '#fff', opacity: 0.5 }}>{conceptLabel(p.message)}</span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {viewIndex !== null && photos[viewIndex] && (
          <motion.div
            key="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewIndex(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <button onClick={() => setViewIndex(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 10 }}>
              <X size={24} />
            </button>

            {viewIndex > 0 && (
              <button onClick={(e) => { e.stopPropagation(); setViewIndex(viewIndex - 1); }} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', zIndex: 10 }}>
                <ChevronLeft size={20} />
              </button>
            )}

            {viewIndex < photos.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); setViewIndex(viewIndex + 1); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', zIndex: 10 }}>
                <ChevronRight size={20} />
              </button>
            )}

            <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
              <img src={photos[viewIndex].imageUrl} alt="" style={{ width: '100%', borderRadius: 12, display: 'block', marginBottom: 16 }} />
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{photos[viewIndex].guestName}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{conceptLabel(photos[viewIndex].message)}</span>
              </div>
              <button
                onClick={() => download(photos[viewIndex!].imageUrl)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, color: '#fff', fontSize: 12, cursor: 'pointer' }}
              >
                <Download size={14} />
                {locale === 'en' ? 'Save' : '저장'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
