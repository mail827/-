import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ProfileSection from './ProfileSection';

interface ProfileOverrideProps {
  groomName: string;
  brideName: string;
  groomIntro?: string;
  brideIntro?: string;
  groomProfileUrl?: string;
  brideProfileUrl?: string;
  theme: string;
}

export default function ProfileOverride(props: ProfileOverrideProps) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const done = useRef(false);

  const setup = useCallback(() => {
    if (done.current) return true;
    const greeting = document.getElementById('greeting-section');
    const gallery = document.getElementById('gallery-section');
    const anchor = greeting || gallery;
    if (!anchor) return false;

    const wrapper = document.createElement('div');
    wrapper.id = 'profile-root';
    wrapper.style.padding = '2rem 1rem';

    anchor.parentElement?.insertBefore(wrapper, anchor.nextSibling);
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
  if (!props.groomIntro && !props.brideIntro) return null;

  return createPortal(
    <ProfileSection {...props} />,
    target
  );
}
