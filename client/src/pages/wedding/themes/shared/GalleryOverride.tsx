import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PolaroidGallery from './PolaroidGallery';

interface GalleryOverrideProps {
  galleries: { id: string; mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO'; order: number }[];
  theme: string;
  usePhotoFilter?: boolean;
}

export default function GalleryOverride({ galleries, theme, usePhotoFilter }: GalleryOverrideProps) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const done = useRef(false);

  const setup = useCallback(() => {
    if (done.current) return true;
    const section = document.getElementById('gallery-section');
    if (!section) return false;

    const grid = section.querySelector('[style*="grid"]') || section.querySelector('.grid');
    if (grid) {
      (grid as HTMLElement).style.display = 'none';
    }

    const existing = section.querySelector('#polaroid-root');
    if (existing) {
      setTarget(existing as HTMLElement);
      done.current = true;
      return true;
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'polaroid-root';
    if (grid) {
      grid.parentElement?.insertBefore(wrapper, grid);
    } else {
      section.appendChild(wrapper);
    }
    setTarget(wrapper);
    done.current = true;
    return true;
  }, []);

  useEffect(() => {
    if (setup()) return;
    const observer = new MutationObserver(() => {
      if (setup()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [setup]);

  const images = galleries.filter(g => g.mediaType === 'IMAGE');
  if (!target || !images.length) return null;

  return createPortal(
    <div style={{ padding: '1rem 0' }}>
      <PolaroidGallery galleries={images} theme={theme} usePhotoFilter={usePhotoFilter} />
    </div>,
    target
  );
}
