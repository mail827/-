import { type Locale } from './i18n';

interface LocaleSwitchProps {
  locale: Locale;
  onChange: (locale: Locale) => void;
}

export default function LocaleSwitch({ locale, onChange }: LocaleSwitchProps) {
  return (
    <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 9998, display: 'flex', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(128,128,128,0.15)', backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.35)', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
      <button
        onClick={() => onChange('ko')}
        style={{
          padding: '7px 14px',
          fontSize: 11,
          fontWeight: locale === 'ko' ? 700 : 400,
          letterSpacing: 0.5,
          background: locale === 'ko' ? 'rgba(255,255,255,0.2)' : 'transparent',
          color: locale === 'ko' ? '#fff' : 'rgba(255,255,255,0.4)',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        KO
      </button>
      <button
        onClick={() => onChange('en')}
        style={{
          padding: '7px 14px',
          fontSize: 11,
          fontWeight: locale === 'en' ? 700 : 400,
          letterSpacing: 0.5,
          background: locale === 'en' ? 'rgba(255,255,255,0.2)' : 'transparent',
          color: locale === 'en' ? '#fff' : 'rgba(255,255,255,0.4)',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        EN
      </button>
    </div>
  );
}
