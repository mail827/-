import { useState } from 'react';
import { getThemeConfig } from './themeConfig';

interface LetterSectionProps {
  groomName: string;
  brideName: string;
  groomLetter?: string;
  brideLetter?: string;
  groomLetterImage?: string;
  brideLetterImage?: string;
  theme?: string;
  letterFromVisible?: boolean;
}

export default function LetterSection({ groomName, brideName, groomLetter, brideLetter, groomLetterImage, brideLetterImage, theme = 'MODERN_MINIMAL', letterFromVisible = true }: LetterSectionProps) {
  const [active, setActive] = useState<'groom' | 'bride'>('groom');

  const config = getThemeConfig(theme);
  const c = config.colors;
  const isDark = isColorDark(c.background);

  const textColor = isDark ? 'rgba(255,255,255,0.85)' : c.text;
  const mutedColor = isDark ? 'rgba(255,255,255,0.35)' : c.textMuted;
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)';
  const activeBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';

  const tabs = [
    { key: 'groom' as const, label: `FROM. ${groomName}`, letter: groomLetter, image: groomLetterImage },
    { key: 'bride' as const, label: `FROM. ${brideName}`, letter: brideLetter, image: brideLetterImage },
  ].filter(t => t.letter || t.image);

  if (!tabs.length) return null;

  const current = tabs.find(t => t.key === active) || tabs[0];

  return (
    <div style={{ padding: '0 1rem' }}>
      <p style={{
        fontSize: 9,
        letterSpacing: '0.3em',
        textAlign: 'center',
        color: mutedColor,
        marginBottom: '1.5rem',
        textTransform: 'uppercase',
      }}>
        Letter
      </p>

      {tabs.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              style={{
                padding: '8px 20px',
                fontSize: 11,
                fontWeight: active === t.key ? 600 : 400,
                letterSpacing: '0.05em',
                color: active === t.key ? textColor : mutedColor,
                background: active === t.key ? activeBg : 'transparent',
                border: `1px solid ${active === t.key ? borderColor : 'transparent'}`,
                borderRadius: '100px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: 40,
              }}
            >
              {letterFromVisible ? t.label : (t.key === 'groom' ? groomName : brideName)}
            </button>
          ))}
        </div>
      )}

      <div style={{
        background: cardBg,
        borderRadius: '12px',
        padding: '1.5rem',
        border: `1px solid ${borderColor}`,
      }}>
        {current.image && (
          <div style={{
            marginBottom: current.letter ? '1rem' : 0,
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <img src={current.image} alt="" style={{ width: '100%', display: 'block', borderRadius: '8px' }} />
          </div>
        )}
        {current.letter && (
          <p style={{
            fontSize: 14,
            lineHeight: 2,
            color: textColor,
            whiteSpace: 'pre-wrap',
            textAlign: 'center',
            fontStyle: 'italic',
          }}>
            {current.letter}
          </p>
        )}
        {letterFromVisible && (
          <p style={{
            fontSize: 11,
            color: mutedColor,
            textAlign: 'right',
            marginTop: '1rem',
            fontStyle: 'italic',
          }}>
            {current.label}
          </p>
        )}
      </div>
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
