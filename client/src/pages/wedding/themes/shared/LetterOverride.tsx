import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import LetterSection from './LetterSection';

interface LetterOverrideProps {
  groomName: string;
  brideName: string;
  groomLetter?: string;
  brideLetter?: string;
  groomLetterImage?: string;
  brideLetterImage?: string;
  theme: string;
}

export default function LetterOverride(props: LetterOverrideProps) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const done = useRef(false);

  const setup = useCallback(() => {
    if (done.current) return true;
    const gallery = document.getElementById('gallery-section');
    const venue = document.getElementById('venue-section');
    const anchor = gallery || venue;
    if (!anchor) return false;

    const wrapper = document.createElement('div');
    wrapper.id = 'letter-root';
    wrapper.style.padding = '3rem 0';

    anchor.parentElement?.insertBefore(wrapper, anchor);
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

  if (!target) return null;
  if (!props.groomLetter && !props.brideLetter) return null;

  return createPortal(<LetterSection {...props} />, target);
}
