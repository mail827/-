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
      shadow: '1px 2px 8px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.2)',
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
      shadow: '1px 2px 8px rgba(139,111,71,0.08), 0 6px 20px rgba(139,111,71,0.04)',
      caption: 'rgba(139,111,71,0.15)',
      imgBg: '#f5f0e8',
    };
  }

  if (warmth < 0.4) {
    return {
      frame: '#FAFCFD',
      border: 'rgba(0,0,0,0.03)',
      shadow: '1px 2px 8px rgba(91,143,168,0.08), 0 6px 20px rgba(91,143,168,0.04)',
      caption: 'rgba(91,143,168,0.15)',
      imgBg: '#f0f4f7',
    };
  }

  return {
    frame: '#fff',
    border: 'rgba(0,0,0,0.04)',
    shadow: '1px 2px 8px rgba(0,0,0,0.07), 0 6px 20px rgba(0,0,0,0.04)',
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

const ROTATIONS = [8, -5, 3, -10, 6, -3, 11, -7, 4, -6, 9, -4, 7, -11, 2, -8, 5, -9, 10, -2];
const OFFSETS_X = [2, 6, -4, -2, 8, -6, 0, 4, -3, 5, -5, 3, -1, 7, -7, 1, -4, 6, -2, 4];
const OFFSETS_Y = [-6, 4, -2, 8, -4, 6, -8, 2, 5, -3, 7, -5, 3, -7, 1, -6, 4, -1, 6, -4];
const Z_ORDER = [3, 7, 1, 5, 9, 2, 8, 4, 6, 10, 1, 7, 3, 8, 5, 2, 9, 4, 6, 1];

export default function PolaroidGallery({ galleries, theme = 'MODERN_MINIMAL', usePhotoFilter = true }: PolaroidGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const images = galleries.filter(g => g.mediaType === 'IMAGE');
  if (!images.length) return null;

  const style = getFrameStyle(theme);
  const cols = 3;
  const cellW = 100 / cols;
  const rowH = 58;

  return (
    <>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: Math.ceil(images.length / cols) * rowH + 16 + 'vw',
          minHeight: Math.ceil(images.length / cols) * 160 + 40,
        }}
      >
        {images.map((item, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const rot = ROTATIONS[i % ROTATIONS.length];
          const ox = OFFSETS_X[i % OFFSETS_X.length];
          const oy = OFFSETS_Y[i % OFFSETS_Y.length];
          const z = Z_ORDER[i % Z_ORDER.length];

          return (
            <div
              key={item.id}
              onClick={() => setSelectedIndex(i)}
              style={{
                position: 'absolute',
                left: `calc(${col * cellW + cellW * 0.08}% + ${ox}px)`,
                top: `calc(${row * rowH}vw * 0.85 + ${oy}px + 8px)`,
                width: `${cellW * 0.82}%`,
                transform: `rotate(${rot}deg)`,
                zIndex: z,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  background: style.frame,
                  padding: '4px 4px 20px 4px',
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
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '6px',
                      letterSpacing: '0.15em',
                      color: style.caption,
                      userSelect: 'none',
                      fontFamily: 'monospace',
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
