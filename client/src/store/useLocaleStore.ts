import { create } from 'zustand';

type AppLocale = 'ko' | 'en';

interface LocaleStore {
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: (() => {
    try { return (localStorage.getItem('appLocale') as AppLocale) || 'ko'; } catch { return 'ko' as AppLocale; }
  })(),
  setLocale: (l) => { localStorage.setItem('appLocale', l); set({ locale: l }); },
  toggleLocale: () => set((s) => {
    const next = s.locale === 'ko' ? 'en' : 'ko';
    localStorage.setItem('appLocale', next);
    return { locale: next };
  }),
}));
