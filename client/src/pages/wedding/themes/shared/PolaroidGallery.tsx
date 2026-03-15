import { useState, useMemo } from 'react';
import { galleryThumbUrl } from '../../../../utils/image';
import GalleryModal from './GalleryModal';
import { getThemeConfig } from './themeConfig';

interface GalleryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  order: number;
}

interface PolaroidGalleryProps {
  galleries: GalleryItem[];
  theme?: string;
  usePhotoFilter?: boolean;
}

function getFrameStyle(theme: string) {
  const config = getThemeConfig(theme);
  const bg = config.colors.background;
  const isDark = isColorDark(bg);

  if (isDark) {
    return {
      frame: '#1a1a1a',
      border: 'rgba(255,255,255,0.06)',
      shadow: '0 1px 8px rgba(0,0,0,0.4), 0 4px 20px rgba(0,0,0,0.2)',
      caption: 'rgba(255,255,255,0.12)',
      imgBg: '#111',
    };
  }

  const primary = config.colors.primary;
  const warmth = getWarmth(primary);

  if (warmth > 0.6) {
    return {
      frame: '#FFFDF8',
      border: 'rgba(0,0,0,0.04)',
      shadow: '0 1px 6px rgba(139,111,71,0.08), 0 4px 16px rgba(139,111,71,0.04)',
      caption: 'rgba(139,111,71,0.15)',
      imgBg: '#f5f0e8',
    };
  }

  if (warmth < 0.4) {
    return {
      frame: '#FAFCFD',
      border: 'rgba(0,0,0,0.03)',
      shadow: '0 1px 6px rgba(91,143,168,0.08), 0 4px 16px rgba(91,143,168,0.04)',
      caption: 'rgba(91,143,168,0.15)',
      imgBg: '#f0f4f7',
    };
  }

  return {
    frame: '#fff',
    border: 'rgba(0,0,0,0.04)',
    shadow: '0 1px 6px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    caption: 'rgba(0,0,0,0.12)',
    imgBg: '#f5f5f3',
  };
}

function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function getWarmth(hex: string): number {
  const c = hex.replace('#', '');
  if (c.length < 6) return 0.5;
  const r = parseInt(c.substring(0, 2), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return r / (r + b + 1);
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function PolaroidGallery({ galleries, theme = 'MODERN_MINIMAL', usePhotoFilter = true }: PolaroidGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const images = galleries.filter(g => g.mediaType === 'IMAGE');

  const transforms = useMemo(() => {
    return images.map((item, i) => {
      const rng = seededRandom(item.id.charCodeAt(0) * 1000 + i * 137);
      const rotation = (rng() - 0.5) * 16;
      const tx = (rng() - 0.5) * 12;
      const ty = (rng() - 0.5) * 8;
      const scale = 0.92 + rng() * 0.08;
      return { rotation, tx, ty, scale };
    });
  }, [images.length]);

  if (!images.length) return null;

  const style = getFrameStyle(theme);

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px 8px',
          padding: '4px 12px',
        }}
      >
        {images.map((item, i) => {
          const t = transforms[i];
          const baseTransform = `rotate(${t.rotation}deg) translate(${t.tx}px, ${t.ty}px) scale(${t.scale})`;
          return (
            <div
              key={item.id}
              onClick={() => setSelectedIndex(i)}
              style={{
                cursor: 'pointer',
                transform: baseTransform,
                transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                transformOrigin: 'center center',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'rotate(0deg) translate(0,0) scale(1.04)';
                e.currentTarget.style.zIndex = '10';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = baseTransform;
                e.currentTarget.style.zIndex = '0';
              }}
            >
              <div
                style={{
                  background: style.frame,
                  padding: '4px 4px 22px 4px',
                  boxShadow: style.shadow,
                  borderRadius: '1px',
                  border: `1px solid ${style.border}`,
                }}
              >
                <div style={{ aspectRatio: '4/5', overflow: 'hidden', backgroundColor: style.imgBg }}>
                  <img
                    src={galleryThumbUrl(item.mediaUrl)}
                    alt=""
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
                <div
                  style={{
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '7px',
                      letterSpacing: '0.15em',
                      color: style.caption,
                      userSelect: 'none',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {selectedIndex !== null && (
        <GalleryModal
          galleries={images}
          currentIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={(idx) => setSelectedIndex(idx)}
          theme={theme}
          usePhotoFilter={usePhotoFilter}
        />
      )}
    </>
  );
}
