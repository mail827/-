import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, ChevronDown } from 'lucide-react';
import { t, getGuestbookDateLocale, type Locale } from './i18n';

type GuestbookVariant = 'classic' | 'classic-dark' | 'minimal' | 'bohemian' | 'luxury' | 'playful' | 'poetic' | 'senior' | 'forest' | 'ocean' | 'glass' | 'spring' | 'mirim1' | 'mirim2' | 'luna' | 'pearl' | 'night-sea' | 'aqua-globe' | 'wave' | 'cruise-day' | 'cruise-sunset' | 'voyage-blue' | 'editorial' | 'editorial-white' | 'editorial-green' | 'editorial-blue' | 'editorial-brown' | 'heart' | 'botanical';

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
  variant?: GuestbookVariant;
  locale?: Locale;
}

interface VariantStyle {
  card: string;
  name: string;
  message: string;
  date: string;
  btn: string;
  divider: string;
  modal: string;
  modalTitle: string;
  modalDesc: string;
  modalInput: string;
  confirmBtn: string;
  cancelBtn: string;
  moreBtn: string;
}

const styles: Record<GuestbookVariant, VariantStyle> = {
  classic: {
    card: 'bg-[#FAF7F3] rounded-xl p-4',
    name: 'text-[#5A4E42] font-medium',
    message: 'text-[#8A7E72]',
    date: 'text-[#C4B8A8]',
    btn: 'text-[#C4B8A8] hover:text-[#B8A088]',
    divider: 'border-[#E8E2DA]/50',
    modal: 'bg-[#FAF7F3]',
    modalTitle: 'text-[#2C2620]',
    modalDesc: 'text-[#8A7E72]',
    modalInput: 'bg-white border-[#E8E2DA] focus:border-[#B8A088] rounded-xl',
    confirmBtn: 'bg-[#2C2620] hover:bg-[#1A1714] text-white rounded-xl',
    cancelBtn: 'border-[#E8E2DA] text-[#8A7E72] rounded-xl',
    moreBtn: 'text-[#B8A088]'
  },
  'classic-dark': {
    card: 'bg-white/[0.03] rounded-xl p-4 border border-[#5A5048]/20',
    name: 'text-[#FFFDF9] font-medium',
    message: 'text-[#A89E92]',
    date: 'text-[#5A5048]',
    btn: 'text-[#5A5048] hover:text-[#B8A088]',
    divider: 'border-[#5A5048]/20',
    modal: 'bg-[#1A1714]',
    modalTitle: 'text-[#FFFDF9]',
    modalDesc: 'text-[#8A7E72]',
    modalInput: 'bg-white/[0.04] border-[#5A5048] focus:border-[#B8A088] text-[#FFFDF9] rounded-xl',
    confirmBtn: 'bg-[#B8A088] hover:bg-[#9E8A72] text-[#1A1714] rounded-xl',
    cancelBtn: 'border-[#5A5048] text-[#8A7E72] rounded-xl',
    moreBtn: 'text-[#B8A088]'
  },
  minimal: {
    card: 'pb-4 border-b border-stone-100',
    name: 'text-stone-800 font-medium',
    message: 'text-stone-400',
    date: 'text-stone-300',
    btn: 'text-stone-200 hover:text-stone-500',
    divider: 'border-stone-100',
    modal: 'bg-white',
    modalTitle: 'text-stone-900',
    modalDesc: 'text-stone-400',
    modalInput: 'border-b border-stone-200 focus:border-stone-800 rounded-none bg-transparent',
    confirmBtn: 'bg-stone-900 hover:bg-stone-800 text-white rounded-none',
    cancelBtn: 'border-stone-200 text-stone-400 rounded-none',
    moreBtn: 'text-stone-400'
  },
  bohemian: {
    card: 'bg-[#FAF7F2] rounded-lg p-4 border border-[#D4C4A8]/20',
    name: 'text-[#4A4A3A] font-medium',
    message: 'text-[#8A8070]',
    date: 'text-[#B8A888]/50',
    btn: 'text-[#5C6B54]/25 hover:text-[#5C6B54]',
    divider: 'border-[#D4C4A8]/15',
    modal: 'bg-[#FAF7F2]',
    modalTitle: 'text-[#4A4A3A]',
    modalDesc: 'text-[#8A8070]',
    modalInput: 'bg-white border-[#D4C4A8]/30 focus:border-[#5C6B54] rounded-lg',
    confirmBtn: 'bg-[#5C6B54] hover:bg-[#4A5944] text-white rounded-lg',
    cancelBtn: 'border-[#D4C4A8]/30 text-[#8A8070] rounded-lg',
    moreBtn: 'text-[#5C6B54]'
  },
  luxury: {
    card: 'border-b border-[#C9A96E]/8 pb-4',
    name: 'text-[#C9A96E] font-medium',
    message: 'text-[#888]',
    date: 'text-[#444]',
    btn: 'text-[#C9A96E]/20 hover:text-[#C9A96E]',
    divider: 'border-[#C9A96E]/8',
    modal: 'bg-[#111]',
    modalTitle: 'text-[#E8E0D0]',
    modalDesc: 'text-[#888]',
    modalInput: 'bg-[#0D0D0D] border-[#C9A96E]/20 focus:border-[#C9A96E] text-[#E8E0D0] rounded-lg',
    confirmBtn: 'bg-gradient-to-r from-[#C9A96E] to-[#D4B97A] text-[#0D0D0D] rounded-lg',
    cancelBtn: 'border-[#333] text-[#888] rounded-lg',
    moreBtn: 'text-[#C9A96E]'
  },
  playful: {
    card: 'bg-[#FAFAFA] rounded-2xl p-4',
    name: 'text-[#333] font-medium',
    message: 'text-[#888]',
    date: 'text-[#CCC]',
    btn: 'text-[#DDD] hover:text-[#888]',
    divider: 'border-[#F0F0F0]',
    modal: 'bg-white',
    modalTitle: 'text-[#333]',
    modalDesc: 'text-[#888]',
    modalInput: 'border-[#E8E8E8] focus:border-[#333] rounded-full',
    confirmBtn: 'bg-[#333] hover:bg-[#555] text-white rounded-full',
    cancelBtn: 'border-[#E8E8E8] text-[#888] rounded-full',
    moreBtn: 'text-[#888]'
  },
  poetic: {
    card: 'bg-[#FDFBFF] rounded-2xl p-4 border border-[#E5DDF5]/50',
    name: 'text-[#4A3F6B] font-medium',
    message: 'text-[#8A80A8]',
    date: 'text-[#C9B7E8]/50',
    btn: 'text-[#C9B7E8]/30 hover:text-[#A393D3]',
    divider: 'border-[#E5DDF5]/30',
    modal: 'bg-[#FDFBFF]',
    modalTitle: 'text-[#4A3F6B]',
    modalDesc: 'text-[#8A80A8]',
    modalInput: 'border-[#E5DDF5] focus:border-[#C9B7E8] rounded-2xl',
    confirmBtn: 'bg-[#C9B7E8] hover:bg-[#B5A0DA] text-white rounded-2xl',
    cancelBtn: 'border-[#E5DDF5] text-[#8A80A8] rounded-2xl',
    moreBtn: 'text-[#C9B7E8]'
  },
  senior: {
    card: 'pb-5 border-b-2 border-[#E8E0D0]',
    name: 'text-[#1E3A5F] font-bold text-lg',
    message: 'text-[#4A4A4A] text-lg leading-relaxed',
    date: 'text-[#AAA] text-base',
    btn: 'text-[#CCC] hover:text-[#1E3A5F]',
    divider: 'border-[#E8E0D0]',
    modal: 'bg-white',
    modalTitle: 'text-[#1E3A5F] text-xl',
    modalDesc: 'text-[#666] text-lg',
    modalInput: 'border-2 border-[#E8E0D0] focus:border-[#1E3A5F] rounded-xl text-lg py-4',
    confirmBtn: 'bg-[#1E3A5F] hover:bg-[#15304F] text-white rounded-xl text-lg py-3',
    cancelBtn: 'border-2 border-[#E8E0D0] text-[#888] rounded-xl text-lg py-3',
    moreBtn: 'text-[#1E3A5F] text-lg'
  },
  forest: {
    card: 'bg-[#F5F9F5] rounded-lg p-4 border-l-2 border-[#3D5A3D]/20',
    name: 'text-[#2D3A2D] font-medium',
    message: 'text-[#6A7A6A]',
    date: 'text-[#8BAD8B]/40',
    btn: 'text-[#3D5A3D]/20 hover:text-[#3D5A3D]',
    divider: 'border-[#3D5A3D]/8',
    modal: 'bg-[#F5F9F5]',
    modalTitle: 'text-[#2D3A2D]',
    modalDesc: 'text-[#6A7A6A]',
    modalInput: 'border-[#3D5A3D]/15 focus:border-[#3D5A3D] rounded-lg',
    confirmBtn: 'bg-[#3D5A3D] hover:bg-[#2D4A2D] text-white rounded-lg',
    cancelBtn: 'border-[#3D5A3D]/15 text-[#6A7A6A] rounded-lg',
    moreBtn: 'text-[#3D5A3D]'
  },
  ocean: {
    card: 'bg-[#F5FAFC] rounded-xl p-4',
    name: 'text-[#3A5A6A] font-medium',
    message: 'text-[#7A8A9A]',
    date: 'text-[#5B8FA8]/30',
    btn: 'text-[#5B8FA8]/20 hover:text-[#5B8FA8]',
    divider: 'border-[#5B8FA8]/8',
    modal: 'bg-[#F5FAFC]',
    modalTitle: 'text-[#3A5A6A]',
    modalDesc: 'text-[#7A8A9A]',
    modalInput: 'border-[#5B8FA8]/15 focus:border-[#5B8FA8] rounded-xl',
    confirmBtn: 'bg-[#5B8FA8] hover:bg-[#4B7F98] text-white rounded-xl',
    cancelBtn: 'border-[#5B8FA8]/15 text-[#7A8A9A] rounded-xl',
    moreBtn: 'text-[#5B8FA8]'
  },
  glass: {
    card: 'bg-white/25 backdrop-blur-md rounded-2xl p-4 border border-white/40',
    name: 'text-[#4A3F6B] font-medium',
    message: 'text-[#8B7EB0]',
    date: 'text-[#B8B0D0]/50',
    btn: 'text-[#C4B8E8]/30 hover:text-[#9B8EC2]',
    divider: 'border-white/20',
    modal: 'bg-white/80 backdrop-blur-xl',
    modalTitle: 'text-[#4A3F6B]',
    modalDesc: 'text-[#8B7EB0]',
    modalInput: 'bg-white/40 border-white/50 focus:border-[#C4B8E8]/70 rounded-2xl',
    confirmBtn: 'bg-gradient-to-r from-[#C4B8E8] to-[#A8D0E8] text-white rounded-2xl',
    cancelBtn: 'border-white/50 text-[#8B7EB0] rounded-2xl',
    moreBtn: 'text-[#9B8EC2]'
  },
  spring: {
    card: 'bg-white/50 rounded-2xl p-4 border border-[#FFE0E8]/50',
    name: 'text-[#6B5060] font-medium',
    message: 'text-[#9A8090]',
    date: 'text-[#D4A0B0]/40',
    btn: 'text-[#D4A0B0]/25 hover:text-[#C08090]',
    divider: 'border-[#FFE0E8]/30',
    modal: 'bg-white',
    modalTitle: 'text-[#6B5060]',
    modalDesc: 'text-[#9A8090]',
    modalInput: 'border-[#FFE0E8] focus:border-[#E8B0C0] rounded-2xl',
    confirmBtn: 'bg-gradient-to-r from-[#E8B0C0] to-[#D0A0C8] text-white rounded-2xl',
    cancelBtn: 'border-[#FFE0E8] text-[#9A8090] rounded-2xl',
    moreBtn: 'text-[#E8B0C0]'
  },
  mirim1: {
    card: 'pb-4 border-b border-black/5',
    name: 'text-[#111] font-medium',
    message: 'text-[#888]',
    date: 'text-[#CCC]',
    btn: 'text-black/10 hover:text-black/40',
    divider: 'border-black/5',
    modal: 'bg-white',
    modalTitle: 'text-[#111]',
    modalDesc: 'text-[#888]',
    modalInput: 'border-b border-black/10 focus:border-black/60 rounded-none bg-transparent',
    confirmBtn: 'bg-[#111] hover:bg-black text-white rounded-none',
    cancelBtn: 'border-black/10 text-[#888] rounded-none',
    moreBtn: 'text-[#888]'
  },
  mirim2: {
    card: 'bg-[#1A1D1C] rounded-lg p-4 border border-[#3A4B40]/40',
    name: 'text-[#D4E0D8] font-medium',
    message: 'text-[#8A9B90]',
    date: 'text-[#5A6B60]',
    btn: 'text-[#3A4B40] hover:text-[#A8BFB0]',
    divider: 'border-[#3A4B40]/30',
    modal: 'bg-[#1A1D1C]',
    modalTitle: 'text-[#D4E0D8]',
    modalDesc: 'text-[#8A9B90]',
    modalInput: 'bg-[#1E2220] border-[#3A4B40] focus:border-[#5A6B60] text-[#D4E0D8] rounded-lg',
    confirmBtn: 'bg-[#A8BFB0] hover:bg-[#8AA090] text-[#1A1D1C] rounded-lg',
    cancelBtn: 'border-[#3A4B40] text-[#8A9B90] rounded-lg',
    moreBtn: 'text-[#A8BFB0]'
  },
  luna: {
    card: 'bg-[#F8FAFC] rounded-xl p-4 border border-[#E0E8EE]/60',
    name: 'text-[#4A5A64] font-medium',
    message: 'text-[#7A8A94]',
    date: 'text-[#B0C0CC]/60',
    btn: 'text-[#C5D4DE]/40 hover:text-[#8AAAB8]',
    divider: 'border-[#E0E8EE]/40',
    modal: 'bg-white',
    modalTitle: 'text-[#4A5A64]',
    modalDesc: 'text-[#7A8A94]',
    modalInput: 'border-[#E0E8EE] focus:border-[#A8BDC9] rounded-xl',
    confirmBtn: 'bg-[#A8BDC9] hover:bg-[#8AAAB8] text-white rounded-xl',
    cancelBtn: 'border-[#E0E8EE] text-[#7A8A94] rounded-xl',
    moreBtn: 'text-[#A8BDC9]'
  },
  pearl: {
    card: 'bg-[rgba(227,235,243,0.02)] rounded-lg p-4 border border-[rgba(227,235,243,0.06)]',
    name: 'text-[#E8EEF2] font-medium',
    message: 'text-[rgba(227,235,243,0.5)]',
    date: 'text-[rgba(227,235,243,0.2)]',
    btn: 'text-[rgba(227,235,243,0.1)] hover:text-[rgba(227,235,243,0.4)]',
    divider: 'border-[rgba(227,235,243,0.06)]',
    modal: 'bg-[#0A0A0A]',
    modalTitle: 'text-[#E8EEF2]',
    modalDesc: 'text-[rgba(227,235,243,0.5)]',
    modalInput: 'bg-[#080808] border-[rgba(227,235,243,0.08)] focus:border-[rgba(227,235,243,0.25)] text-[#E8EEF2] rounded-lg',
    confirmBtn: 'bg-[#E3EBF3] hover:bg-[#D0D8E3] text-[#050505] rounded-lg',
    cancelBtn: 'border-[rgba(227,235,243,0.1)] text-[rgba(227,235,243,0.4)] rounded-lg',
    moreBtn: 'text-[rgba(227,235,243,0.4)]'
  },
  'night-sea': {
    card: 'bg-[#0A0F1A] rounded-lg p-4 border border-[#1A3050]/40',
    name: 'text-[#C0D8F0] font-medium',
    message: 'text-[#5A7A9A]',
    date: 'text-[#2A4A6A]',
    btn: 'text-[#1A3050] hover:text-[#4A8EC2]',
    divider: 'border-[#1A3050]/30',
    modal: 'bg-[#0A0F1A]',
    modalTitle: 'text-[#C0D8F0]',
    modalDesc: 'text-[#5A7A9A]',
    modalInput: 'bg-[#070B14] border-[#1A3050]/60 focus:border-[#4A8EC2] text-[#C0D8F0] rounded-lg',
    confirmBtn: 'bg-[#4A8EC2] hover:bg-[#5BA0D0] text-white rounded-lg',
    cancelBtn: 'border-[#1A3050]/40 text-[#5A7A9A] rounded-lg',
    moreBtn: 'text-[#4A8EC2]'
  },
  'aqua-globe': {
    card: 'bg-[#EFF8FD] rounded-xl p-4',
    name: 'text-[#1A3A50] font-medium',
    message: 'text-[#5A7A8A]',
    date: 'text-[#2C5F7C]/25',
    btn: 'text-[#2C5F7C]/15 hover:text-[#2C5F7C]',
    divider: 'border-[#2C5F7C]/8',
    modal: 'bg-[#EFF8FD]',
    modalTitle: 'text-[#1A3A50]',
    modalDesc: 'text-[#5A7A8A]',
    modalInput: 'border-[#2C5F7C]/15 focus:border-[#2C5F7C] rounded-xl',
    confirmBtn: 'bg-[#2C5F7C] hover:bg-[#1A4A64] text-white rounded-xl',
    cancelBtn: 'border-[#2C5F7C]/15 text-[#5A7A8A] rounded-xl',
    moreBtn: 'text-[#2C5F7C]'
  },
  wave: {
    card: 'bg-[#FDFAF5] rounded-lg p-4 border-l-2 border-[#A08060]/15',
    name: 'text-[#3C3020] font-medium',
    message: 'text-[#8A7A60]',
    date: 'text-[#C4B8A0]/40',
    btn: 'text-[#A08060]/15 hover:text-[#A08060]',
    divider: 'border-[#DDD0BE]/30',
    modal: 'bg-[#FDFAF5]',
    modalTitle: 'text-[#3C3020]',
    modalDesc: 'text-[#8A7A60]',
    modalInput: 'border-[#DDD0BE] focus:border-[#A08060] rounded-lg',
    confirmBtn: 'bg-[#A08060] hover:bg-[#8A6A4A] text-white rounded-lg',
    cancelBtn: 'border-[#DDD0BE] text-[#8A7A60] rounded-lg',
    moreBtn: 'text-[#A08060]'
  },
  'cruise-day': {
    card: 'bg-white rounded-xl p-4 border border-[#3B7DD8]/6',
    name: 'text-[#1A2B3A] font-medium',
    message: 'text-[#6A7A8A]',
    date: 'text-[#3B7DD8]/20',
    btn: 'text-[#3B7DD8]/15 hover:text-[#3B7DD8]',
    divider: 'border-[#3B7DD8]/6',
    modal: 'bg-white',
    modalTitle: 'text-[#1A2B3A]',
    modalDesc: 'text-[#6A7A8A]',
    modalInput: 'border-[#3B7DD8]/15 focus:border-[#3B7DD8] rounded-xl',
    confirmBtn: 'bg-[#3B7DD8] hover:bg-[#2B6DC8] text-white rounded-xl',
    cancelBtn: 'border-[#3B7DD8]/15 text-[#6A7A8A] rounded-xl',
    moreBtn: 'text-[#3B7DD8]'
  },
  'cruise-sunset': {
    card: 'border-b border-[#D4A054]/10 pb-4',
    name: 'text-[#E8DFD4] font-medium',
    message: 'text-[#8A7A60]',
    date: 'text-[#5A4830]/60',
    btn: 'text-[#D4A054]/15 hover:text-[#D4A054]',
    divider: 'border-[#D4A054]/8',
    modal: 'bg-[#0D0B09]',
    modalTitle: 'text-[#E8DFD4]',
    modalDesc: 'text-[#8A7A60]',
    modalInput: 'bg-[#111] border-[#D4A054]/15 focus:border-[#D4A054] text-[#E8DFD4] rounded-lg',
    confirmBtn: 'bg-[#D4A054] hover:bg-[#C49044] text-[#0D0B09] rounded-lg',
    cancelBtn: 'border-[#D4A054]/15 text-[#8A7A60] rounded-lg',
    moreBtn: 'text-[#D4A054]'
  },
  'voyage-blue': {
    card: 'bg-[#F9F7F2] rounded-lg p-4 border border-[#1A365D]/6',
    name: 'text-[#1A365D] font-medium',
    message: 'text-[#5A6A7A]',
    date: 'text-[#1A365D]/15',
    btn: 'text-[#1A365D]/10 hover:text-[#1A365D]',
    divider: 'border-[#1A365D]/6',
    modal: 'bg-[#F9F7F2]',
    modalTitle: 'text-[#1A365D]',
    modalDesc: 'text-[#5A6A7A]',
    modalInput: 'border-[#1A365D]/12 focus:border-[#1A365D] rounded-lg',
    confirmBtn: 'bg-[#1A365D] hover:bg-[#0F2A4D] text-[#F9F7F2] rounded-lg',
    cancelBtn: 'border-[#1A365D]/12 text-[#5A6A7A] rounded-lg',
    moreBtn: 'text-[#1A365D]'
  },
  editorial: {
    card: 'border-b border-[#333] pb-4',
    name: 'text-white font-medium tracking-wide',
    message: 'text-[#888]',
    date: 'text-[#444]',
    btn: 'text-[#333] hover:text-white',
    divider: 'border-[#333]',
    modal: 'bg-[#0e0e0e]',
    modalTitle: 'text-white',
    modalDesc: 'text-[#888]',
    modalInput: 'bg-transparent border-b border-[#333] focus:border-white text-white rounded-none',
    confirmBtn: 'bg-white hover:bg-[#E8E8E8] text-[#0e0e0e] rounded-none tracking-widest uppercase text-xs',
    cancelBtn: 'border-[#333] text-[#888] rounded-none',
    moreBtn: 'text-[#888]'
  },
  'editorial-white': {
    card: 'border-b border-[#E0E0E0] pb-4',
    name: 'text-[#0e0e0e] font-medium tracking-wide',
    message: 'text-[#888]',
    date: 'text-[#CCC]',
    btn: 'text-[#DDD] hover:text-[#0e0e0e]',
    divider: 'border-[#E0E0E0]',
    modal: 'bg-[#f5f4f0]',
    modalTitle: 'text-[#0e0e0e]',
    modalDesc: 'text-[#888]',
    modalInput: 'bg-transparent border-b border-[#D0D0D0] focus:border-[#0e0e0e] rounded-none',
    confirmBtn: 'bg-[#0e0e0e] hover:bg-[#2A2A2A] text-[#f0f0f0] rounded-none tracking-widest uppercase text-xs',
    cancelBtn: 'border-[#D0D0D0] text-[#888] rounded-none',
    moreBtn: 'text-[#888]'
  },
  'editorial-green': {
    card: 'border-b border-[#94A684]/15 pb-4',
    name: 'text-[#1A2F23] font-medium tracking-wide',
    message: 'text-[#5A6A50]',
    date: 'text-[#94A684]/30',
    btn: 'text-[#94A684]/15 hover:text-[#1A2F23]',
    divider: 'border-[#94A684]/15',
    modal: 'bg-[#E8EDE0]',
    modalTitle: 'text-[#1A2F23]',
    modalDesc: 'text-[#5A6A50]',
    modalInput: 'bg-transparent border-b border-[#94A684]/30 focus:border-[#1A2F23] rounded-none',
    confirmBtn: 'bg-[#1A2F23] hover:bg-[#0F2018] text-[#E8EDE0] rounded-none tracking-widest uppercase text-xs',
    cancelBtn: 'border-[#94A684]/30 text-[#5A6A50] rounded-none',
    moreBtn: 'text-[#1A2F23]'
  },
  'editorial-blue': {
    card: 'border-b border-[#001A40]/8 pb-4',
    name: 'text-[#001A40] font-medium tracking-wide',
    message: 'text-[#5A6A80]',
    date: 'text-[#001A40]/15',
    btn: 'text-[#001A40]/8 hover:text-[#001A40]',
    divider: 'border-[#001A40]/8',
    modal: 'bg-[#F2F2F2]',
    modalTitle: 'text-[#001A40]',
    modalDesc: 'text-[#5A6A80]',
    modalInput: 'bg-transparent border-b border-[#001A40]/15 focus:border-[#001A40] rounded-none',
    confirmBtn: 'bg-[#001A40] hover:bg-[#001030] text-white rounded-none tracking-widest uppercase text-xs',
    cancelBtn: 'border-[#001A40]/15 text-[#5A6A80] rounded-none',
    moreBtn: 'text-[#001A40]'
  },
  'editorial-brown': {
    card: 'border-b border-[#C5A059]/10 pb-4',
    name: 'text-[#3E362E] font-medium tracking-wide',
    message: 'text-[#8A7A60]',
    date: 'text-[#C5A059]/20',
    btn: 'text-[#C5A059]/10 hover:text-[#3E362E]',
    divider: 'border-[#C5A059]/10',
    modal: 'bg-[#F5EFE6]',
    modalTitle: 'text-[#3E362E]',
    modalDesc: 'text-[#8A7A60]',
    modalInput: 'bg-transparent border-b border-[#C5A059]/20 focus:border-[#3E362E] rounded-none',
    confirmBtn: 'bg-[#3E362E] hover:bg-[#2E2620] text-[#F5EFE6] rounded-none tracking-widest uppercase text-xs',
    cancelBtn: 'border-[#C5A059]/20 text-[#8A7A60] rounded-none',
    moreBtn: 'text-[#3E362E]'
  },
  heart: {
    card: 'bg-[#FFFCF7] rounded-xl p-4 border border-[#E07B38]/6',
    name: 'text-[#3A2E22] font-medium',
    message: 'text-[#8A7060]',
    date: 'text-[#E07B38]/20',
    btn: 'text-[#E07B38]/12 hover:text-[#E07B38]',
    divider: 'border-[#E07B38]/6',
    modal: 'bg-[#FFFCF7]',
    modalTitle: 'text-[#3A2E22]',
    modalDesc: 'text-[#8A7060]',
    modalInput: 'border-[#E07B38]/12 focus:border-[#E07B38] rounded-xl',
    confirmBtn: 'bg-[#E07B38] hover:bg-[#C86A2E] text-white rounded-xl',
    cancelBtn: 'border-[#E07B38]/12 text-[#8A7060] rounded-xl',
    moreBtn: 'text-[#E07B38]'
  },
  botanical: {
    card: 'bg-[#F4F3ED] rounded-lg p-4 border-l-2 border-[#3D5E35]/15',
    name: 'text-[#2E3228] font-medium',
    message: 'text-[#6A7060]',
    date: 'text-[#5A7E4E]/20',
    btn: 'text-[#5A7E4E]/12 hover:text-[#3D5E35]',
    divider: 'border-[#5A7E4E]/8',
    modal: 'bg-[#F4F3ED]',
    modalTitle: 'text-[#2E3228]',
    modalDesc: 'text-[#6A7060]',
    modalInput: 'border-[#5A7E4E]/15 focus:border-[#3D5E35] rounded-lg',
    confirmBtn: 'bg-[#3D5E35] hover:bg-[#2E4A28] text-white rounded-lg',
    cancelBtn: 'border-[#5A7E4E]/15 text-[#6A7060] rounded-lg',
    moreBtn: 'text-[#3D5E35]'
  }
};

const INITIAL_COUNT = 5;

export default function GuestbookList({ guestbooks, onDelete, variant = 'classic', locale = 'ko' }: GuestbookListProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const s = styles[variant] || styles.classic;
  const isSenior = variant === 'senior';

  const visibleItems = expanded ? guestbooks : guestbooks.slice(0, INITIAL_COUNT);
  const hasMore = guestbooks.length > INITIAL_COUNT;

  const handleDelete = async () => {
    if (!deleteTarget || !password) return;
    setIsDeleting(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/guestbook/${deleteTarget}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '삭제 실패'); return; }
      onDelete?.(deleteTarget);
      setDeleteTarget(null);
      setPassword('');
    } catch {
      setError(t('guestbook', 'deleteError', locale));
    } finally {
      setIsDeleting(false);
    }
  };

  const closeModal = () => { setDeleteTarget(null); setPassword(''); setError(''); };

  return (
    <>
      <div className={`${isSenior ? 'space-y-5' : 'space-y-3'}`}>
        <AnimatePresence initial={false}>
          {visibleItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, delay: i < INITIAL_COUNT ? i * 0.03 : 0 }}
              className={s.card}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className={`${isSenior ? '' : 'text-sm'} ${s.name}`}>{item.name}</span>
                    <span className={`${isSenior ? '' : 'text-[11px]'} shrink-0 ${s.date}`}>
                      {getGuestbookDateLocale(item.createdAt, locale)}
                    </span>
                  </div>
                  <p className={`${isSenior ? '' : 'text-sm'} leading-relaxed break-words ${s.message}`}>{item.message}</p>
                </div>
                <button
                  onClick={() => setDeleteTarget(item.id)}
                  className={`shrink-0 p-1 transition-colors duration-200 ${s.btn}`}
                >
                  <Trash2 className={isSenior ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className={`w-full flex items-center justify-center gap-1.5 py-3 text-sm transition-colors duration-200 ${s.moreBtn}`}
          >
            <span>{guestbooks.length - INITIAL_COUNT}{t('guestbook', 'more', locale)}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-[280px] rounded-2xl p-5 ${s.modal}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`${isSenior ? 'text-lg' : 'text-sm'} font-medium ${s.modalTitle}`}>{t('guestbook', 'deleteTitle', locale)}</h3>
                <button onClick={closeModal} className={`${s.btn} p-0.5`}>
                  <X className={isSenior ? 'w-6 h-6' : 'w-4 h-4'} />
                </button>
              </div>
              <p className={`${isSenior ? 'text-base' : 'text-xs'} mb-4 ${s.modalDesc}`}>
                {t('guestbook', 'deleteDesc', locale)}
              </p>
              <input
                type="password"
                placeholder={t('guestbook', 'password', locale)}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDelete()}
                className={`w-full px-4 py-3 ${isSenior ? 'text-base' : 'text-sm'} border outline-none transition-colors duration-200 mb-3 ${s.modalInput}`}
              />
              {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className={`flex-1 py-2.5 ${isSenior ? 'text-base' : 'text-sm'} border transition-colors duration-200 ${s.cancelBtn}`}
                >
                  {t('guestbook', 'cancel', locale)}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!password || isDeleting}
                  className={`flex-1 py-2.5 ${isSenior ? 'text-base' : 'text-sm'} transition-all duration-200 disabled:opacity-40 ${s.confirmBtn}`}
                >
                  {isDeleting ? t('guestbook', 'deleting', locale) : t('guestbook', 'deleteConfirm', locale)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
