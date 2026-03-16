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

    const wrapper = document.createElement('div');
    wrapper.id = 'polaroid-root';

    const kids = Array.from(section.children) as HTMLElement[];
    kids.forEach((el) => { el.style.display = 'none'; });

    section.appendChild(wrapper);
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
    <div style={{ padding: '2rem 0.5rem' }}>
      <p style={{
        fontSize: '10px',
        letterSpacing: '0.4em',
        textAlign: 'center',
        opacity: 0.3,
        marginBottom: '2rem',
      }}>
        GALLERY
      </p>
      <PolaroidGallery galleries={images} theme={theme} usePhotoFilter={usePhotoFilter} />
    </div>,
    target
  );
}
