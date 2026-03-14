import { useState } from 'react';
import { getThemeConfig } from './themeConfig';

interface TabItem {
  title: string;
  image?: string;
  content: string;
}

interface VenueDetailTabsProps {
  tabs: TabItem[];
  theme?: string;
}

export default function VenueDetailTabs({ tabs, theme = 'MODERN_MINIMAL' }: VenueDetailTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!tabs || !tabs.length) return null;

  const config = getThemeConfig(theme);
  const c = config.colors;
  const isDark = isColorDark(c.background);

  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const activeBorder = isDark ? c.primary : c.primary;
  const textColor = isDark ? 'rgba(255,255,255,0.9)' : c.text;
  const mutedColor = isDark ? 'rgba(255,255,255,0.4)' : c.textMuted;
  const contentBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)';

  const active = tabs[activeIndex];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: `1px solid ${borderColor}`,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            style={{
              flex: tabs.length <= 3 ? 1 : undefined,
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: activeIndex === i ? 600 : 400,
              color: activeIndex === i ? textColor : mutedColor,
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeIndex === i ? activeBorder : 'transparent'}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              minHeight: '44px',
            }}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div style={{ padding: '1.5rem 0.5rem', background: contentBg, borderRadius: '0 0 8px 8px' }}>
        {active.image && (
          <div style={{ marginBottom: '1rem', borderRadius: '6px', overflow: 'hidden' }}>
            <img
              src={active.image}
              alt={active.title}
              style={{ width: '100%', display: 'block', borderRadius: '6px' }}
            />
          </div>
        )}
        {active.content && (
          <div
            style={{
              fontSize: '14px',
              lineHeight: 1.8,
              color: textColor,
              whiteSpace: 'pre-wrap',
              textAlign: 'center',
            }}
          >
            {active.content}
          </div>
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
