import { useState } from 'react';
import { motion } from 'framer-motion';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (type: 'kakao' | 'instagram' | 'sms', version?: string) => void;
  variant?: 'light' | 'dark' | 'glass';
  weddingId?: string;
}

export default function ShareModal({ isOpen, onClose, onShare, variant = 'light', weddingId }: ShareModalProps) {
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const isDark = variant === 'dark';

  const handleShareClick = async (type: 'kakao' | 'instagram' | 'sms') => {
    console.log("ShareModal weddingId:", weddingId);
    if (!weddingId) {
      onShare(type);
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/snapshot/${weddingId}`, {
        method: 'POST'
      });
      const data = await res.json();
      onShare(type, data.version);
    } catch (error) {
      console.error('Snapshot error:', error);
      onShare(type);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-t-2xl p-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
      >
        <p className={`text-center mb-6 ${isDark ? 'text-white' : 'text-stone-700'}`}>
          {isCreating ? '공유 링크 생성 중...' : '공유하기'}
        </p>
        
        <div className="flex justify-center gap-8">
          <button
            onClick={() => handleShareClick('kakao')}
            disabled={isCreating}
            className="flex flex-col items-center gap-2 disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-full bg-[#FEE500] flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#3C1E1E">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.33 4.67 6.74l-.96 3.57c-.08.31.27.56.53.38l4.19-2.77c.52.05 1.04.08 1.57.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
              </svg>
            </div>
            <span className={`text-xs ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>카카오톡</span>
          </button>

          <button
            onClick={() => handleShareClick('instagram')}
            disabled={isCreating}
            className="flex flex-col items-center gap-2 disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <span className={`text-xs ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>인스타그램</span>
          </button>

          <button
            onClick={() => handleShareClick('sms')}
            disabled={isCreating}
            className="flex flex-col items-center gap-2 disabled:opacity-50"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-[#333]' : 'bg-[#34C759]'}`}>
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
              </svg>
            </div>
            <span className={`text-xs ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>문자</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className={`w-full mt-6 py-3 text-sm ${isDark ? 'text-[#666]' : 'text-stone-400'}`}
        >
          닫기
        </button>
      </motion.div>
    </motion.div>
  );
}
