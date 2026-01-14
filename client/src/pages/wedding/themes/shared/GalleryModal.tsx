import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

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
}

export default function GalleryModal({ galleries, currentIndex, onClose, onNavigate }: GalleryModalProps) {
  const [direction, setDirection] = useState(0);
  const current = galleries[currentIndex];
  if (!current) return null;

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
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white z-10"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {currentIndex < galleries.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white z-10"
        >
          <ChevronRight className="w-8 h-8" />
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
            className="max-w-4xl max-h-[90vh] w-full px-4 cursor-grab active:cursor-grabbing"
          >
            {current.mediaType === 'VIDEO' ? (
              <video
                src={current.mediaUrl}
                controls
                autoPlay
                className="w-full h-full object-contain max-h-[85vh] pointer-events-auto"
              />
            ) : (
              <img
                src={current.mediaUrl}
                alt=""
                className="w-full h-full object-contain max-h-[85vh] select-none pointer-events-none"
                draggable={false}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {galleries.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setDirection(i > currentIndex ? 1 : -1); onNavigate(i); }}
            className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white w-4' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </motion.div>
  );
}
