import { useState } from 'react';
import { t, type Locale } from './i18n';

type GuestbookVariant = 'classic' | 'classic-dark' | 'minimal' | 'bohemian' | 'luxury' | 'playful' | 'poetic' | 'senior' | 'forest' | 'ocean' | 'glass' | 'spring' | 'mirim1' | 'mirim2' | 'luna' | 'pearl' | 'night-sea' | 'aqua-globe' | 'wave' | 'cruise-day' | 'cruise-sunset' | 'voyage-blue' | 'editorial' | 'editorial-white' | 'editorial-green' | 'editorial-blue' | 'editorial-brown' | 'heart' | 'botanical';

interface GuestbookFormProps {
  weddingId: string;
  onSubmit: (data: { weddingId: string; name: string; password: string; message: string }) => Promise<void>;
  isLoading: boolean;
  variant?: GuestbookVariant;
  locale?: Locale;
}

const MAX_LENGTH = 200;

const styles: Record<GuestbookVariant, { input: string; button: string; counter: string }> = {
  classic: {
    input: 'bg-[#FAF7F3] border border-[#E8E2DA] rounded-xl focus:border-[#B8A088] text-[#5A4E42] placeholder:text-[#C4B8A8]',
    button: 'bg-[#2C2620] hover:bg-[#1A1714] rounded-xl text-white',
    counter: 'text-[#C4B8A8]'
  },
  'classic-dark': {
    input: 'bg-white/[0.03] border border-[#5A5048] rounded-xl focus:border-[#B8A088] text-[#FFFDF9] placeholder:text-[#5A5048]',
    button: 'bg-[#B8A088] hover:bg-[#9E8A72] rounded-xl text-[#1A1714]',
    counter: 'text-[#5A5048]'
  },
  minimal: {
    input: 'bg-transparent border-b border-stone-200 rounded-none focus:border-stone-800 text-stone-800 placeholder:text-stone-300 px-0',
    button: 'bg-stone-900 hover:bg-stone-800 rounded-none text-white tracking-widest uppercase text-xs',
    counter: 'text-stone-300'
  },
  bohemian: {
    input: 'bg-[#FAF7F2] border border-[#D4C4A8]/40 rounded-lg focus:border-[#5C6B54] text-[#4A4A3A] placeholder:text-[#B8A888]/60',
    button: 'bg-[#5C6B54] hover:bg-[#4A5944] rounded-lg text-white',
    counter: 'text-[#B8A888]/50'
  },
  luxury: {
    input: 'bg-[#0D0D0D] border border-[#C9A96E]/20 rounded-lg focus:border-[#C9A96E] text-[#E8E0D0] placeholder:text-[#555]',
    button: 'bg-gradient-to-r from-[#C9A96E] to-[#D4B97A] hover:from-[#D4B97A] hover:to-[#E0C88A] rounded-lg text-[#0D0D0D] font-medium',
    counter: 'text-[#555]'
  },
  playful: {
    input: 'bg-[#FAFAFA] border border-[#E8E8E8] rounded-full focus:border-[#333] text-[#333] placeholder:text-[#BBB] px-5',
    button: 'bg-[#333] hover:bg-[#555] rounded-full text-white',
    counter: 'text-[#CCC]'
  },
  poetic: {
    input: 'bg-[#FDFBFF] border border-[#E5DDF5] rounded-2xl focus:border-[#C9B7E8] text-[#4A3F6B] placeholder:text-[#C9B7E8]/50',
    button: 'bg-[#C9B7E8] hover:bg-[#B5A0DA] rounded-2xl text-white',
    counter: 'text-[#C9B7E8]/40'
  },
  senior: {
    input: 'bg-white border-2 border-[#E8E0D0] rounded-xl focus:border-[#1E3A5F] text-[#1E3A5F] placeholder:text-[#AAA] text-lg py-4',
    button: 'bg-[#1E3A5F] hover:bg-[#15304F] rounded-xl text-white text-lg py-4',
    counter: 'text-[#AAA] text-base'
  },
  forest: {
    input: 'bg-[#F5F9F5] border border-[#3D5A3D]/15 rounded-lg focus:border-[#3D5A3D] text-[#2D3A2D] placeholder:text-[#8BAD8B]/50',
    button: 'bg-[#3D5A3D] hover:bg-[#2D4A2D] rounded-lg text-white',
    counter: 'text-[#8BAD8B]/40'
  },
  ocean: {
    input: 'bg-[#F5FAFC] border border-[#5B8FA8]/15 rounded-xl focus:border-[#5B8FA8] text-[#3A5A6A] placeholder:text-[#5B8FA8]/35',
    button: 'bg-[#5B8FA8] hover:bg-[#4B7F98] rounded-xl text-white',
    counter: 'text-[#5B8FA8]/30'
  },
  glass: {
    input: 'bg-white/30 backdrop-blur-md border border-white/50 rounded-2xl focus:border-[#C4B8E8]/70 text-[#4A3F6B] placeholder:text-[#9B8EC2]/40',
    button: 'bg-gradient-to-r from-[#C4B8E8] to-[#A8D0E8] hover:from-[#B5A8DA] hover:to-[#98C0D8] rounded-2xl text-white',
    counter: 'text-[#9B8EC2]/30'
  },
  spring: {
    input: 'bg-white/60 border border-[#FFE0E8] rounded-2xl focus:border-[#E8B0C0] text-[#6B5060] placeholder:text-[#D4A0B0]/40',
    button: 'bg-gradient-to-r from-[#E8B0C0] to-[#D0A0C8] hover:from-[#DA9EB0] hover:to-[#C090B8] rounded-2xl text-white',
    counter: 'text-[#D4A0B0]/30'
  },
  mirim1: {
    input: 'bg-transparent border-b border-black/10 rounded-none focus:border-black/60 text-[#111] placeholder:text-[#CCC] px-0',
    button: 'bg-[#111] hover:bg-black rounded-none text-white tracking-[0.2em] uppercase text-xs',
    counter: 'text-black/20'
  },
  mirim2: {
    input: 'bg-[#1A1D1C] border border-[#3A4B40] rounded-lg focus:border-[#5A6B60] text-[#D4E0D8] placeholder:text-[#5A6B60]',
    button: 'bg-[#A8BFB0] hover:bg-[#8AA090] rounded-lg text-[#1A1D1C] font-medium',
    counter: 'text-[#3A4B40]'
  },
  luna: {
    input: 'bg-[#F8FAFC] border border-[#E0E8EE] rounded-xl focus:border-[#A8BDC9] text-[#4A5A64] placeholder:text-[#B0C0CC]',
    button: 'bg-[#A8BDC9] hover:bg-[#8AAAB8] rounded-xl text-white',
    counter: 'text-[#B0C0CC]/60'
  },
  pearl: {
    input: 'bg-[#080808] border border-[rgba(227,235,243,0.08)] rounded-lg focus:border-[rgba(227,235,243,0.25)] text-[#E8EEF2] placeholder:text-[rgba(227,235,243,0.2)]',
    button: 'bg-[#E3EBF3] hover:bg-[#D0D8E3] rounded-lg text-[#050505] font-medium',
    counter: 'text-[rgba(227,235,243,0.15)]'
  },
  'night-sea': {
    input: 'bg-[#0A0F1A] border border-[#1A3050]/60 rounded-lg focus:border-[#4A8EC2] text-[#C0D8F0] placeholder:text-[#2A4A6A]',
    button: 'bg-[#4A8EC2] hover:bg-[#5BA0D0] rounded-lg text-white',
    counter: 'text-[#1A3050]'
  },
  'aqua-globe': {
    input: 'bg-[#EFF8FD] border border-[#2C5F7C]/10 rounded-xl focus:border-[#2C5F7C] text-[#1A3A50] placeholder:text-[#2C5F7C]/30',
    button: 'bg-[#2C5F7C] hover:bg-[#1A4A64] rounded-xl text-white',
    counter: 'text-[#2C5F7C]/20'
  },
  wave: {
    input: 'bg-[#FDFAF5] border border-[#DDD0BE] rounded-lg focus:border-[#A08060] text-[#3C3020] placeholder:text-[#C4B8A0]/60',
    button: 'bg-[#A08060] hover:bg-[#8A6A4A] rounded-lg text-white',
    counter: 'text-[#C4B8A0]/40'
  },
  'cruise-day': {
    input: 'bg-white border border-[#3B7DD8]/10 rounded-xl focus:border-[#3B7DD8] text-[#1A2B3A] placeholder:text-[#3B7DD8]/25',
    button: 'bg-[#3B7DD8] hover:bg-[#2B6DC8] rounded-xl text-white',
    counter: 'text-[#3B7DD8]/20'
  },
  'cruise-sunset': {
    input: 'bg-[#0D0B09] border border-[#D4A054]/15 rounded-lg focus:border-[#D4A054] text-[#E8DFD4] placeholder:text-[#5A4830]',
    button: 'bg-[#D4A054] hover:bg-[#C49044] rounded-lg text-[#0D0B09] font-medium',
    counter: 'text-[#5A4830]/60'
  },
  'voyage-blue': {
    input: 'bg-[#F9F7F2] border border-[#1A365D]/10 rounded-lg focus:border-[#1A365D] text-[#1A365D] placeholder:text-[#1A365D]/25',
    button: 'bg-[#1A365D] hover:bg-[#0F2A4D] rounded-lg text-[#F9F7F2]',
    counter: 'text-[#1A365D]/15'
  },
  editorial: {
    input: 'bg-transparent border-b border-[#333] rounded-none focus:border-white text-white placeholder:text-[#555] px-0',
    button: 'bg-white hover:bg-[#E8E8E8] rounded-none text-[#0e0e0e] tracking-[0.15em] uppercase text-xs font-medium',
    counter: 'text-[#444]'
  },
  'editorial-white': {
    input: 'bg-transparent border-b border-[#D0D0D0] rounded-none focus:border-[#0e0e0e] text-[#0e0e0e] placeholder:text-[#BBB] px-0',
    button: 'bg-[#0e0e0e] hover:bg-[#2A2A2A] rounded-none text-[#f0f0f0] tracking-[0.15em] uppercase text-xs font-medium',
    counter: 'text-[#CCC]'
  },
  'editorial-green': {
    input: 'bg-transparent border-b border-[#94A684]/30 rounded-none focus:border-[#1A2F23] text-[#1A2F23] placeholder:text-[#94A684]/40 px-0',
    button: 'bg-[#1A2F23] hover:bg-[#0F2018] rounded-none text-[#E8EDE0] tracking-[0.15em] uppercase text-xs font-medium',
    counter: 'text-[#94A684]/30'
  },
  'editorial-blue': {
    input: 'bg-transparent border-b border-[#001A40]/15 rounded-none focus:border-[#001A40] text-[#001A40] placeholder:text-[#001A40]/20 px-0',
    button: 'bg-[#001A40] hover:bg-[#001030] rounded-none text-white tracking-[0.15em] uppercase text-xs font-medium',
    counter: 'text-[#001A40]/15'
  },
  'editorial-brown': {
    input: 'bg-transparent border-b border-[#C5A059]/20 rounded-none focus:border-[#3E362E] text-[#3E362E] placeholder:text-[#C5A059]/30 px-0',
    button: 'bg-[#3E362E] hover:bg-[#2E2620] rounded-none text-[#F5EFE6] tracking-[0.15em] uppercase text-xs font-medium',
    counter: 'text-[#C5A059]/25'
  },
  heart: {
    input: 'bg-[#FFFCF7] border border-[#E07B38]/12 rounded-xl focus:border-[#E07B38] text-[#3A2E22] placeholder:text-[#E07B38]/25',
    button: 'bg-[#E07B38] hover:bg-[#C86A2E] rounded-xl text-white',
    counter: 'text-[#E07B38]/20'
  },
  botanical: {
    input: 'bg-[#F4F3ED] border border-[#5A7E4E]/12 rounded-lg focus:border-[#3D5E35] text-[#2E3228] placeholder:text-[#5A7E4E]/30',
    button: 'bg-[#3D5E35] hover:bg-[#2E4A28] rounded-lg text-white',
    counter: 'text-[#5A7E4E]/20'
  }
};

export default function GuestbookForm({ weddingId: _weddingId, onSubmit, isLoading, variant = 'classic', locale = 'ko' }: GuestbookFormProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !password || !message.trim()) return;
    await onSubmit({ weddingId: _weddingId, name: name.trim(), password, message: message.trim() });
    setName('');
    setPassword('');
    setMessage('');
  };

  const s = styles[variant] || styles.classic;
  const isSenior = variant === 'senior';
  const isUnderline = ['minimal', 'mirim1', 'editorial', 'editorial-white', 'editorial-green', 'editorial-blue', 'editorial-brown'].includes(variant);

  return (
    <div className={`${isSenior ? 'space-y-4' : 'space-y-3'}`}>
      <div className={`flex ${isSenior ? 'gap-3' : 'gap-2'}`}>
        <input
          type="text"
          placeholder={isSenior ? t('guestbook', 'nameSenior', locale) : t('guestbook', 'name', locale)}
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          className={`flex-1 min-w-0 ${isUnderline ? 'py-3' : 'px-4 py-3'} ${isSenior ? '' : 'text-sm'} border outline-none transition-colors duration-200 ${s.input}`}
        />
        <input
          type="password"
          placeholder={isSenior ? t('guestbook', 'passwordShort', locale) : t('guestbook', 'password', locale)}
          value={password}
          onChange={e => setPassword(e.target.value)}
          maxLength={20}
          className={`${isSenior ? 'w-32' : 'w-28'} shrink-0 ${isUnderline ? 'py-3' : 'px-4 py-3'} ${isSenior ? '' : 'text-sm'} border outline-none transition-colors duration-200 ${s.input}`}
        />
      </div>
      <div className="relative">
        <textarea
          placeholder={t('guestbook', 'placeholder', locale)}
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, MAX_LENGTH))}
          rows={isSenior ? 4 : 3}
          className={`w-full ${isUnderline ? 'py-3' : 'px-4 py-3'} ${isSenior ? '' : 'text-sm'} leading-relaxed border outline-none transition-colors duration-200 resize-none ${s.input}`}
        />
        <span className={`absolute bottom-2.5 right-3 text-[11px] tabular-nums ${s.counter}`}>
          {message.length}/{MAX_LENGTH}
        </span>
      </div>
      <button
        onClick={handleSubmit}
        disabled={isLoading || !name.trim() || !password || !message.trim()}
        className={`w-full ${isSenior ? 'py-4' : 'py-3'} ${isSenior ? 'text-base' : 'text-sm'} transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${s.button}`}
      >
        {isLoading ? t('guestbook', 'submitting', locale) : isSenior ? t('guestbook', 'submitSenior', locale) : t('guestbook', 'submit', locale)}
      </button>
    </div>
  );
}
