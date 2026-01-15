import { useState } from 'react';

interface GuestbookFormProps {
  weddingId: string;
  onSubmit: (data: { weddingId: string; name: string; password: string; message: string }) => Promise<void>;
  isLoading: boolean;
  variant?: 'classic' | 'minimal' | 'bohemian' | 'luxury' | 'playful' | 'forest' | 'ocean';
}

export default function GuestbookForm({ weddingId: _weddingId, onSubmit, isLoading, variant = 'classic' }: GuestbookFormProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!name || !password || !message) return;
    await onSubmit({ weddingId: _weddingId, name, password, message });
    setName('');
    setPassword('');
    setMessage('');
  };

  const styles = {
    classic: { input: 'bg-white/60 border-rose-100 focus:border-rose-300', button: 'bg-rose-400 hover:bg-rose-500' },
    minimal: { input: 'bg-stone-50 border-stone-200 focus:border-stone-400', button: 'bg-stone-800 hover:bg-stone-700' },
    bohemian: { input: 'bg-white border-[#5C6B54]/20 focus:border-[#5C6B54]', button: 'bg-[#5C6B54] hover:bg-[#4A5944]' },
    luxury: { input: 'bg-[#111] border-[#C9A96E]/30 focus:border-[#C9A96E] text-white placeholder:text-[#555]', button: 'bg-[#C9A96E] hover:bg-[#D4B97A] text-black' },
    playful: { input: 'bg-white border-[#ddd] focus:border-[#333]', button: 'bg-[#333] hover:bg-[#444]' },
    forest: { input: 'bg-white border-[#3D5A3D]/20 focus:border-[#3D5A3D]', button: 'bg-[#3D5A3D] hover:bg-[#2D4A2D]' },
    ocean: { input: 'bg-white border-[#5B8FA8]/20 focus:border-[#5B8FA8]', button: 'bg-[#5B8FA8] hover:bg-[#4B7F98]' },
  };

  const s = styles[variant];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input type="text" placeholder="이름" value={name} onChange={e => setName(e.target.value)} className={`flex-1 min-w-0 px-4 py-3 rounded-lg border text-sm outline-none transition-colors ${s.input}`} />
        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} className={`w-28 shrink-0 px-4 py-3 rounded-lg border text-sm outline-none transition-colors ${s.input}`} />
      </div>
      <textarea placeholder="축하 메시지를 남겨주세요" value={message} onChange={e => setMessage(e.target.value)} rows={3} className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors resize-none ${s.input}`} />
      <button onClick={handleSubmit} disabled={isLoading || !name || !password || !message} className={`w-full py-3 rounded-lg text-white text-sm transition-colors disabled:opacity-50 ${s.button}`}>
        {isLoading ? '등록 중...' : '방명록 남기기'}
      </button>
    </div>
  );
}
