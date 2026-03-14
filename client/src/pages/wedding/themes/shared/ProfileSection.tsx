import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getThemeConfig } from './themeConfig';

interface ProfileSectionProps {
  groomName: string;
  brideName: string;
  groomIntro?: string;
  brideIntro?: string;
  groomProfileUrl?: string;
  brideProfileUrl?: string;
  theme?: string;
}

export default function ProfileSection({ groomName, brideName, groomIntro, brideIntro, groomProfileUrl, brideProfileUrl, theme = 'MODERN_MINIMAL' }: ProfileSectionProps) {
  const [viewImage, setViewImage] = useState<string | null>(null);

  if (!groomIntro && !brideIntro) return null;

  const config = getThemeConfig(theme);
  const c = config.colors;
  const isDark = isColorDark(c.background);

  const textColor = isDark ? 'rgba(255,255,255,0.85)' : c.text;
  const mutedColor = isDark ? 'rgba(255,255,255,0.4)' : c.textMuted;
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const initBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';

  return (
    <>
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', padding: '0 0.5rem' }}>
        <PersonCard
          name={groomName}
          label="GROOM"
          intro={groomIntro}
          profileUrl={groomProfileUrl}
          textColor={textColor}
          mutedColor={mutedColor}
          borderColor={borderColor}
          initBg={initBg}
          primary={c.primary}
          onImageClick={groomProfileUrl ? () => setViewImage(groomProfileUrl) : undefined}
        />
        <PersonCard
          name={brideName}
          label="BRIDE"
          intro={brideIntro}
          profileUrl={brideProfileUrl}
          textColor={textColor}
          mutedColor={mutedColor}
          borderColor={borderColor}
          initBg={initBg}
          primary={c.primary}
          onImageClick={brideProfileUrl ? () => setViewImage(brideProfileUrl) : undefined}
        />
      </div>
      <AnimatePresence>
        {viewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewImage(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '2rem',
            }}
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={viewImage}
              alt=""
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PersonCard({ name, label, intro, profileUrl, textColor, mutedColor, borderColor, initBg, primary, onImageClick }: {
  name: string; label: string; intro?: string; profileUrl?: string;
  textColor: string; mutedColor: string; borderColor: string; initBg: string; primary: string;
  onImageClick?: () => void;
}) {
  return (
    <div style={{ flex: 1, textAlign: 'center', maxWidth: '160px' }}>
      <div
        onClick={onImageClick}
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          margin: '0 auto 12px',
          overflow: 'hidden',
          border: `1px solid ${borderColor}`,
          background: initBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onImageClick ? 'pointer' : 'default',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => { if (onImageClick) e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {profileUrl ? (
          <img src={profileUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 22, color: primary, fontWeight: 300 }}>
            {name.charAt(0)}
          </span>
        )}
      </div>
      <p style={{ fontSize: 9, letterSpacing: '0.2em', color: mutedColor, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 500, color: textColor, marginBottom: 6 }}>{name}</p>
      {intro && (
        <p style={{ fontSize: 12, lineHeight: 1.6, color: mutedColor }}>{intro}</p>
      )}
    </div>
  );
}

function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
