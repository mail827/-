import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X } from 'lucide-react';

interface GuestbookItem {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

interface GuestbookListProps {
  guestbooks: GuestbookItem[];
  weddingSlug: string;
  onDelete?: (id: string) => void;
  variant?: 'classic' | 'minimal' | 'bohemian' | 'luxury' | 'playful' | 'forest' | 'ocean' | 'senior' | 'poetic' | 'glass' | 'spring';
}

export default function GuestbookList({ guestbooks, weddingSlug, onDelete, variant = 'classic' }: GuestbookListProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const styles = {
    classic: { card: 'bg-white/60 backdrop-blur-sm rounded-xl border border-rose-50', text: 'text-stone-700', subtext: 'text-stone-500', date: 'text-stone-400', btn: 'text-rose-300 hover:text-rose-400', modal: 'bg-white', input: 'border-rose-100 focus:border-rose-300', confirmBtn: 'bg-rose-400 hover:bg-rose-500' },
    minimal: { card: 'pb-4 border-b border-stone-100', text: 'text-stone-600', subtext: 'text-stone-400', date: 'text-stone-300', btn: 'text-stone-300 hover:text-stone-500', modal: 'bg-white', input: 'border-stone-200 focus:border-stone-400', confirmBtn: 'bg-stone-800 hover:bg-stone-700' },
    bohemian: { card: 'bg-white rounded-lg p-4 shadow-sm', text: 'text-[#5D5D5D]', subtext: 'text-[#7D7D7D]', date: 'text-[#ADADAD]', btn: 'text-[#5C6B54]/40 hover:text-[#5C6B54]', modal: 'bg-[#FAF8F5]', input: 'border-[#5C6B54]/20 focus:border-[#5C6B54]', confirmBtn: 'bg-[#5C6B54] hover:bg-[#4A5944]' },
    luxury: { card: 'border border-[#C9A96E]/10', text: 'text-[#C9A96E]', subtext: 'text-[#888]', date: 'text-[#555]', btn: 'text-[#C9A96E]/30 hover:text-[#C9A96E]', modal: 'bg-[#1a1a1a]', input: 'bg-[#111] border-[#C9A96E]/30 focus:border-[#C9A96E] text-white', confirmBtn: 'bg-[#C9A96E] hover:bg-[#D4B97A] text-black' },
    playful: { card: 'bg-white rounded-lg shadow-sm', text: 'text-[#555]', subtext: 'text-[#777]', date: 'text-[#bbb]', btn: 'text-[#ccc] hover:text-[#666]', modal: 'bg-white', input: 'border-[#ddd] focus:border-[#333]', confirmBtn: 'bg-[#333] hover:bg-[#444]' },
    poetic: { card: 'bg-white rounded-sm border border-[#E5DDF5]', text: 'text-[#2A2A2A]', subtext: 'text-[#666]', date: 'text-[#C9B7E8]', btn: 'text-[#C9B7E8] hover:text-[#A393D3]', modal: 'bg-[#FBF9FD]', input: 'border-[#E5DDF5] focus:border-[#C9B7E8]', confirmBtn: 'bg-[#C9B7E8] hover:bg-[#A393D3]' },
    forest: { card: 'bg-white rounded p-4 shadow-sm border border-[#3D5A3D]/5', text: 'text-[#555]', subtext: 'text-[#777]', date: 'text-[#aaa]', btn: 'text-[#3D5A3D]/30 hover:text-[#3D5A3D]', modal: 'bg-[#F7F6F3]', input: 'border-[#3D5A3D]/20 focus:border-[#3D5A3D]', confirmBtn: 'bg-[#3D5A3D] hover:bg-[#2D4A2D]' },
    ocean: { card: 'bg-white rounded-xl p-4 shadow-sm border border-[#5B8FA8]/5', text: 'text-[#5B6B7B]', subtext: 'text-[#7B8B9B]', date: 'text-[#ABB]', btn: 'text-[#5B8FA8]/30 hover:text-[#5B8FA8]', modal: 'bg-[#F8FAFB]', input: 'border-[#5B8FA8]/20 focus:border-[#5B8FA8]', confirmBtn: 'bg-[#5B8FA8] hover:bg-[#4B7F98]' },
    senior: { card: 'pb-4 border-b-2 border-amber-50 last:border-0', text: 'text-gray-800 font-medium', subtext: 'text-gray-600', date: 'text-gray-400', btn: 'text-amber-300 hover:text-amber-500', modal: 'bg-white', input: 'border-2 border-amber-100 focus:border-amber-300', confirmBtn: 'bg-amber-500 hover:bg-amber-600' },
    glass: { card: 'bg-white/40 backdrop-blur-md rounded-[16px] p-4 border border-white/50', text: 'text-[#6B5B8C]', subtext: 'text-[#8B7EB0]', date: 'text-[#B8B0D0]', btn: 'text-[#C4B8E8] hover:text-[#9B8EC2]', modal: 'bg-white/80 backdrop-blur-xl', input: 'bg-white/40 border-white/50 focus:border-[#C4B8E8]', confirmBtn: 'bg-gradient-to-r from-[#C4B8E8] to-[#A8D0E8] hover:opacity-90' },
    spring: { card: 'bg-white/75 rounded-[14px] p-4 border border-[#FFE0E8]', text: 'text-[#6B5060]', subtext: 'text-[#8B7080]', date: 'text-[#C8A0B0]', btn: 'text-[#D4A0B0] hover:text-[#C08090]', modal: 'bg-white', input: 'border-[#FFE0E8] focus:border-[#E8B0C0]', confirmBtn: 'bg-gradient-to-r from-[#E8B0C0] to-[#D0A0C8] hover:opacity-90' },
    glass_old: { card: 'bg-white/40 backdrop-blur-md rounded-[16px] p-4 border border-white/50', text: 'text-[#6B5B8C]', subtext: 'text-[#8B7EB0]', date: 'text-[#B8B0D0]', btn: 'text-[#C4B8E8] hover:text-[#9B8EC2]', modal: 'bg-white/80 backdrop-blur-xl', input: 'bg-white/40 border-white/50 focus:border-[#C4B8E8]', confirmBtn: 'bg-gradient-to-r from-[#C4B8E8] to-[#A8D0E8] hover:opacity-90' },
  };

  const s = styles[variant];
  const isLuxury = variant === 'luxury';
  const isSenior = variant === 'senior';

  const handleDelete = async () => {
    if (!deleteTarget || !password) return;
    setIsDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/weddings/${weddingSlug}/guestbook/${deleteTarget}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '삭제 실패'); return; }
      onDelete?.(deleteTarget);
      setDeleteTarget(null);
      setPassword('');
    } catch (err) {
      setError('삭제 중 오류가 발생했습니다');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeModal = () => { setDeleteTarget(null); setPassword(''); setError(''); };

  return (
    <>
      <div className={isSenior ? 'space-y-4' : 'space-y-3'}>
        {guestbooks.slice(0, 10).map((item) => (
          <div key={item.id} className={`p-4 ${s.card}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className={`${isSenior ? 'text-lg' : 'text-sm'} ${s.text}`}>{item.name}</span>
                  <span className={`${isSenior ? 'text-base' : 'text-xs'} ${s.date}`}>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
                <p className={`${isSenior ? 'text-lg' : 'text-sm'} ${s.subtext}`}>{item.message}</p>
              </div>
              <button onClick={() => setDeleteTarget(item.id)} className={`p-1.5 transition-colors ${s.btn}`} title="삭제">
                <Trash2 className={isSenior ? 'w-5 h-5' : 'w-4 h-4'} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={closeModal}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className={`w-full max-w-xs rounded-2xl p-6 ${s.modal}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isLuxury ? 'text-white' : isSenior ? 'text-gray-800 text-xl' : 'text-stone-800'}`}>방명록 삭제</h3>
                <button onClick={closeModal} className={isLuxury ? 'text-[#666]' : 'text-stone-400'}><X className="w-5 h-5" /></button>
              </div>
              <p className={`mb-4 ${isLuxury ? 'text-[#888] text-sm' : isSenior ? 'text-gray-600 text-lg' : 'text-stone-500 text-sm'}`}>작성 시 입력한 비밀번호를 입력해주세요</p>
              <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors mb-3 ${s.input}`} />
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <div className="flex gap-2">
                <button onClick={closeModal} className={`flex-1 py-2.5 rounded-lg border ${isLuxury ? 'border-[#333] text-[#888]' : isSenior ? 'border-amber-200 text-gray-500 text-lg' : 'border-stone-200 text-stone-500'} text-sm`}>취소</button>
                <button onClick={handleDelete} disabled={!password || isDeleting} className={`flex-1 py-2.5 rounded-lg text-white disabled:opacity-50 ${isSenior ? 'text-lg' : 'text-sm'} ${s.confirmBtn}`}>{isDeleting ? '삭제 중...' : '삭제'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
