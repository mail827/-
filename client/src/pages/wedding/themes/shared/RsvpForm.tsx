import { useState } from 'react';
import { motion } from 'framer-motion';

interface RsvpFormProps {
  weddingId: string;
  onSubmit: (data: { weddingId: string; name: string; phone: string; side: 'GROOM' | 'BRIDE'; attending: boolean; guestCount: number; message?: string }) => Promise<void>;
  isLoading: boolean;
  variant?: 'classic' | 'minimal' | 'bohemian' | 'luxury' | 'playful' | 'forest' | 'ocean' | 'poetic' | 'glass' | 'spring' | 'mirim1' | 'mirim2' | 'luna' | 'pearl' | 'botanical' | 'heart' | 'wave';
}

export default function RsvpForm({ weddingId: _weddingId, onSubmit, isLoading, variant = 'classic' }: RsvpFormProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [side, setSide] = useState<'GROOM' | 'BRIDE' | null>(null);
  const [attendance, setAttendance] = useState<boolean | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!name || !contact || !side || attendance === null) return;
    await onSubmit({ weddingId: _weddingId, name, phone: contact, side, attending: attendance, guestCount, message });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
        <p className="text-stone-600">참석 여부가 전달되었습니다</p>
        <p className="text-stone-400 text-sm mt-2">감사합니다</p>
      </motion.div>
    );
  }

  const styles = {
    classic: { input: 'bg-white/60 border-[#E8E2DA] focus:border-[#B8A088]', button: 'bg-[#2C2620] hover:bg-[#1A1714]', active: 'bg-[#2C2620] text-[#FFFDF9]', inactive: 'bg-white border-[#E8E2DA] text-[#8A7E72]' },
    minimal: { input: 'bg-stone-50 border-stone-200 focus:border-stone-400', button: 'bg-stone-800 hover:bg-stone-700', active: 'bg-stone-800 text-white', inactive: 'bg-white border-stone-200 text-stone-600' },
    bohemian: { input: 'bg-white border-[#5C6B54]/20 focus:border-[#5C6B54]', button: 'bg-[#5C6B54] hover:bg-[#4A5944]', active: 'bg-[#5C6B54] text-white', inactive: 'bg-white border-[#5C6B54]/20 text-[#5D5D5D]' },
    luxury: { input: 'bg-[#111] border-[#C9A96E]/30 focus:border-[#C9A96E] text-white', button: 'bg-[#C9A96E] hover:bg-[#D4B97A] text-black', active: 'bg-[#C9A96E] text-black', inactive: 'bg-[#111] border-[#C9A96E]/30 text-[#888]' },
    playful: { input: 'bg-white border-[#ddd] focus:border-[#333]', button: 'bg-[#333] hover:bg-[#444]', active: 'bg-[#333] text-white', inactive: 'bg-white border-[#ddd] text-[#666]' },
    poetic: { input: 'bg-white border-[#E5DDF5] focus:border-[#C9B7E8]', button: 'bg-[#C9B7E8] hover:bg-[#A393D3]', active: 'bg-[#C9B7E8] text-white', inactive: 'bg-white border-[#E5DDF5] text-[#666]' },
    forest: { input: 'bg-white border-[#3D5A3D]/20 focus:border-[#3D5A3D]', button: 'bg-[#3D5A3D] hover:bg-[#2D4A2D]', active: 'bg-[#3D5A3D] text-white', inactive: 'bg-white border-[#3D5A3D]/20 text-[#555]' },
    ocean: { input: 'bg-white border-[#5B8FA8]/20 focus:border-[#5B8FA8]', button: 'bg-[#5B8FA8] hover:bg-[#4B7F98]', active: 'bg-[#5B8FA8] text-white', inactive: 'bg-white border-[#5B8FA8]/20 text-[#5B6B7B]' },
    glass: { input: 'bg-white/40 backdrop-blur-md border-white/50 focus:border-[#C4B8E8]', button: 'bg-gradient-to-r from-[#C4B8E8] to-[#A8D0E8] hover:opacity-90', active: 'bg-gradient-to-r from-[#C4B8E8] to-[#A8D0E8] text-white', inactive: 'bg-white/40 backdrop-blur-md border-white/50 text-[#7B6B9C]' },
    spring: { input: 'bg-white/75 border-[#FFE0E8] focus:border-[#E8B0C0]', button: 'bg-gradient-to-r from-[#E8B0C0] to-[#D0A0C8] hover:opacity-90', active: 'bg-gradient-to-r from-[#E8B0C0] to-[#D0A0C8] text-white', inactive: 'bg-white/75 border-[#FFE0E8] text-[#8B6B7B]' },
    mirim1: { input: 'bg-black/[0.01] border-black/10 focus:border-black/30', button: 'bg-[#111] hover:bg-black', active: 'bg-[#111] text-white', inactive: 'bg-white border-black/10 text-[#666]' },
    mirim2: { input: 'bg-[#1E2220] border-[#3A4B40] focus:border-[#5A6B60] text-[#D4E0D8] placeholder:text-[#5A6B60]', button: 'bg-[#A8BFB0] hover:bg-[#8AA090] text-[#1A1D1C]', active: 'bg-[#A8BFB0] text-[#1A1D1C]', inactive: 'bg-[#1E2220] border-[#3A4B40] text-[#6A7B70]' },
    luna: { input: 'bg-[#FAFCFD] border-[#E8EEF2] focus:border-[#C5D4DE] text-[#5A6A74] placeholder:text-[#A8B8C4]', button: 'bg-[#A8BDC9] hover:bg-[#8AAAB8] text-white', active: 'bg-[#A8BDC9] text-white', inactive: 'bg-[#FAFCFD] border-[#E8EEF2] text-[#8A9AA4]' },
    botanical: { input: 'bg-[#F6F5EE] border-[#CED0C4] focus:border-[#5A7E4E] text-[#2E3228]', button: 'bg-[#3D5E35] hover:bg-[#2E4A28]', active: 'bg-[#3D5E35] text-white', inactive: 'bg-[#F6F5EE] border-[#CED0C4] text-[#525A4A]' },
    heart: { input: 'bg-[#FFFCF2] border-[#FFE8C8] focus:border-[#E07B38] text-[#3A2E22]', button: 'bg-[#E07B38] hover:bg-[#C86A2E]', active: 'bg-[#E07B38] text-white', inactive: 'bg-[#FFFCF2] border-[#FFE8C8] text-[#7A6850]' },
    wave: { input: 'bg-[#FFFAF2] border-[#DDD0BE] focus:border-[#A08060] text-[#3C3020]', button: 'bg-[#A08060] hover:bg-[#7A5E42]', active: 'bg-[#A08060] text-white', inactive: 'bg-[#FFFAF2] border-[#DDD0BE] text-[#6A5840]' },
    pearl: { input: 'bg-[#0A0A0A] border-[rgba(227,235,243,0.1)] focus:border-[rgba(227,235,243,0.3)] text-[#E8EEF2] placeholder:text-[rgba(227,235,243,0.3)]', button: 'bg-[#E3EBF3] hover:bg-[#C8D8E8] text-[#050505]', active: 'bg-[#E3EBF3] text-[#050505]', inactive: 'bg-[rgba(227,235,243,0.03)] border-[rgba(227,235,243,0.1)] text-[rgba(227,235,243,0.5)]' },
  };

  const s = styles[variant];

  return (
    <div className="space-y-4">
      <input type="text" placeholder="이름" value={name} onChange={e => setName(e.target.value)} className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors ${s.input}`} />
      <input type="tel" placeholder="연락처" value={contact} onChange={e => setContact(e.target.value)} className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors ${s.input}`} />
      
      <div className="flex gap-2">
        <button onClick={() => setSide('GROOM')} className={`flex-1 py-3 rounded-lg text-sm border transition-all ${side === 'GROOM' ? s.active : s.inactive}`}>신랑측</button>
        <button onClick={() => setSide('BRIDE')} className={`flex-1 py-3 rounded-lg text-sm border transition-all ${side === 'BRIDE' ? s.active : s.inactive}`}>신부측</button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setAttendance(true)} className={`flex-1 py-3 rounded-lg text-sm border transition-all ${attendance === true ? s.active : s.inactive}`}>참석</button>
        <button onClick={() => setAttendance(false)} className={`flex-1 py-3 rounded-lg text-sm border transition-all ${attendance === false ? s.active : s.inactive}`}>불참</button>
      </div>
      
      {attendance && (
        <div className="flex items-center gap-3">
          <span className={`text-sm ${variant === 'pearl' ? 'text-[rgba(227,235,243,0.5)]' : variant === 'luna' ? 'text-[#8A9AA4]' : 'text-stone-500'}`}>동반 인원</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className={`w-8 h-8 rounded border ${s.inactive}`}>-</button>
            <span className={`w-8 text-center ${variant === 'pearl' ? 'text-[#E8EEF2]' : variant === 'luna' ? 'text-[#5A6A74]' : ''}`}>{guestCount}</span>
            <button onClick={() => setGuestCount(guestCount + 1)} className={`w-8 h-8 rounded border ${s.inactive}`}>+</button>
          </div>
        </div>
      )}
      
      <textarea placeholder="메시지 (선택)" value={message} onChange={e => setMessage(e.target.value)} rows={3} className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors resize-none ${s.input}`} />
      
      <button onClick={handleSubmit} disabled={isLoading || !name || !contact || !side || attendance === null} className={`w-full py-3 rounded-lg text-white text-sm transition-colors disabled:opacity-50 ${s.button}`}>
        {isLoading ? '전송 중...' : '참석 여부 전달하기'}
      </button>
    </div>
  );
}
