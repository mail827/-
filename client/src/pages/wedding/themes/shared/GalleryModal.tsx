import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { applyPhotoFilter } from './themeConfig';
import { galleryFullUrl } from '../../../../utils/image';

interface GalleryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  order: number;
}

interface GalleryModalProps {
  galleries: GalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  theme?: string;
  usePhotoFilter?: boolean;
}

export default function GalleryModal({ galleries, currentIndex, onClose, onNavigate, theme, usePhotoFilter = true }: GalleryModalProps) {
  const [direction, setDirection] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const current = galleries[currentIndex];
  if (!current) return null;

  const getOptimizedUrl = (url: string, mediaType: string) => {
    if (mediaType === 'VIDEO') return url;
    if (theme && usePhotoFilter) {
      const filtered = applyPhotoFilter(url, theme);
      return galleryFullUrl(filtered);
    }
    return galleryFullUrl(url);
  };

  useEffect(() => {
    setLoaded(false);
  }, [currentIndex]);

  useEffect(() => {
    const preload = [currentIndex - 1, currentIndex + 1]
      .filter(i => i >= 0 && i < galleries.length)
      .map(i => galleries[i])
      .filter(g => g.mediaType === 'IMAGE');
    preload.forEach(g => {
      const img = new Image();
      img.src = getOptimizedUrl(g.mediaUrl, g.mediaType);
    });
  }, [currentIndex]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < galleries.length - 1) {
      setDirection(1);
      onNavigate(currentIndex + 1);
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && currentIndex > 0) {
      handlePrev();
    } else if (info.offset.x < -threshold && currentIndex < galleries.length - 1) {
      handleNext();
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-14 right-3 w-12 h-12 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full text-white/90 hover:text-white hover:bg-black/80 z-10 active:scale-95 transition-all"
      >
        <X className="w-7 h-7" />
      </button>

      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full text-white/80 hover:text-white z-10 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {currentIndex < galleries.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full text-white/80 hover:text-white z-10 active:scale-95 transition-all"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      <div className="w-full h-full flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.25 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            className="max-w-4xl max-h-[90vh] w-full px-4 cursor-grab active:cursor-grabbing relative"
          >
            {current.mediaType === 'VIDEO' ? (
              <video
                src={current.mediaUrl}
                controls
                autoPlay
                className="w-full h-full object-contain max-h-[85vh] pointer-events-auto"
              />
            ) : (
              <>
                {!loaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={getOptimizedUrl(current.mediaUrl, current.mediaType)}
                  alt=""
                  className={`w-full h-full object-contain max-h-[85vh] select-none pointer-events-none transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                  draggable={false}
                  onLoad={() => setLoaded(true)}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {galleries.length <= 20 && galleries.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setDirection(i > currentIndex ? 1 : -1); onNavigate(i); }}
            className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white w-4' : 'bg-white/40'}`}
          />
        ))}
        {galleries.length > 20 && (
          <span className="text-white/60 text-xs">{currentIndex + 1} / {galleries.length}</span>
        )}
      </div>
    </motion.div>
  );
}
