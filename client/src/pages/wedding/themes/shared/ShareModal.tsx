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
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isDark = variant === 'dark';

  const getShareUrl = async (): Promise<string> => {
    const baseUrl = window.location.origin + window.location.pathname;
    if (!weddingId) return baseUrl;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/snapshot/${weddingId}`, { method: 'POST' });
      const data = await res.json();
      return data.version ? `${baseUrl}?v=${data.version}` : baseUrl;
    } catch {
      return baseUrl;
    }
  };

  const handleKakao = async () => {
    setIsCreating(true);
    try {
      const url = await getShareUrl();
      onShare('kakao', url.includes('?v=') ? url.split('?v=')[1] : undefined);
    } finally {
      setIsCreating(false);
    }
  };

  const handleNativeShare = async () => {
    setIsCreating(true);
    try {
      const url = await getShareUrl();
      if (navigator.share) {
        await navigator.share({ title: document.title || '청첩장', url });
        onClose();
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => { setCopied(false); onClose(); }, 1500);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        const url = window.location.href;
        await navigator.clipboard?.writeText(url);
        setCopied(true);
        setTimeout(() => { setCopied(false); onClose(); }, 1500);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    setIsCreating(true);
    try {
      const url = await getShareUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => { setCopied(false); }, 1500);
    } catch {
      setCopied(false);
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
          {isCreating ? '공유 링크 생성 중...' : copied ? '링크가 복사되었습니다!' : '공유하기'}
        </p>
        
        <div className="flex justify-center gap-6">
          <button onClick={handleKakao} disabled={isCreating} className="flex flex-col items-center gap-2 disabled:opacity-50">
            <div className="w-14 h-14 rounded-full bg-[#FEE500] flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.33 4.67 6.74l-.96 3.57c-.08.31.27.56.53.38l4.19-2.77c.52.05 1.04.08 1.57.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/></svg>
            </div>
            <span className={`text-xs ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>카카오톡</span>
          </button>

          <button onClick={handleNativeShare} disabled={isCreating} className="flex flex-col items-center gap-2 disabled:opacity-50">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-[#333]' : 'bg-stone-100'}`}>
              <svg className={`w-6 h-6 ${isDark ? 'text-white' : 'text-stone-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </div>
            <span className={`text-xs ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>공유</span>
          </button>

          <button onClick={handleCopyLink} disabled={isCreating} className="flex flex-col items-center gap-2 disabled:opacity-50">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-[#333]' : 'bg-stone-100'}`}>
              {copied ? (
                <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg className={`w-6 h-6 ${isDark ? 'text-white' : 'text-stone-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              )}
            </div>
            <span className={`text-xs ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>{copied ? '복사됨' : '링크복사'}</span>
          </button>
        </div>

        <button onClick={onClose} className={`w-full mt-6 py-3 text-sm ${isDark ? 'text-[#666]' : 'text-stone-400'}`}>닫기</button>
      </motion.div>
    </motion.div>
  );
}