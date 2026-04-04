import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import VenueDetailTabs from './VenueDetailTabs';

interface TabItem {
  title: string;
  image?: string;
  content: string;
}

interface VenueTabsOverrideProps {
  tabs: TabItem[];
  theme: string;
}

export default function VenueTabsOverride({ tabs, theme }: VenueTabsOverrideProps) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const done = useRef(false);

  const setup = useCallback(() => {
    if (done.current) return true;
    const section = document.getElementById('venue-section');
    if (!section) return false;

    const inner = section.querySelector(':scope > div') || section;
    const wrapper = document.createElement('div');
    wrapper.id = 'venue-tabs-root';
    inner.appendChild(wrapper);
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

  if (!target || !tabs?.length) return null;

  return createPortal(
    <VenueDetailTabs tabs={tabs} theme={theme} />,
    target
  );
}
