import { useState } from 'react';
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
      shadow: '0 2px 12px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.2)',
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
      shadow: '0 2px 8px rgba(139,111,71,0.08), 0 8px 24px rgba(139,111,71,0.04)',
      caption: 'rgba(139,111,71,0.15)',
      imgBg: '#f5f0e8',
    };
  }

  if (warmth < 0.4) {
    return {
      frame: '#FAFCFD',
      border: 'rgba(0,0,0,0.03)',
      shadow: '0 2px 8px rgba(91,143,168,0.08), 0 8px 24px rgba(91,143,168,0.04)',
      caption: 'rgba(91,143,168,0.15)',
      imgBg: '#f0f4f7',
    };
  }

  return {
    frame: '#fff',
    border: 'rgba(0,0,0,0.04)',
    shadow: '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
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

const ROTATIONS = [-2.8, 1.5, -1.2, 2.4, -0.8, 1.9, -2.1, 0.6, -1.7, 2.8, -0.4, 1.1, -2.5, 0.9, -1.4, 2.2, -0.6, 1.7, -2.3, 0.3];

export default function PolaroidGallery({ galleries, theme = 'MODERN_MINIMAL', usePhotoFilter = true }: PolaroidGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const images = galleries.filter(g => g.mediaType === 'IMAGE');
  if (!images.length) return null;

  const style = getFrameStyle(theme);

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px 12px',
          padding: '4px 8px',
        }}
      >
        {images.map((item, i) => {
          const rotation = ROTATIONS[i % ROTATIONS.length];
          return (
            <div
              key={item.id}
              onClick={() => setSelectedIndex(i)}
              style={{
                cursor: 'pointer',
                transform: `rotate(${rotation}deg)`,
                transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                transformOrigin: 'center center',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'rotate(0deg) scale(1.03)';
                e.currentTarget.style.zIndex = '10';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = `rotate(${rotation}deg) scale(1)`;
                e.currentTarget.style.zIndex = '0';
              }}
            >
              <div
                style={{
                  background: style.frame,
                  padding: '6px 6px 28px 6px',
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
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '8px',
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
