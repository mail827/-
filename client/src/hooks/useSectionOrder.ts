import { useEffect, useRef } from 'react';

const SECTION_ID_MAP: Record<string, string> = {
  'gallery-section': 'gallery',
  'venue-section': 'location',
  'rsvp-section': 'rsvp',
  'rsvp': 'rsvp',
  'account-section': 'account',
  'guestbook-section': 'guestbook',
  'guestbook': 'guestbook',
  'greeting-section': 'greeting',
  'calendar-section': 'calendar',
};

const DEFAULT_ORDER = [
  'greeting', 'calendar', 'loveStory', 'gallery',
  'location', 'rsvp', 'account', 'guestbook', 'closing',
];

const KNOWN_IDS = ['gallery-section', 'venue-section', 'rsvp-section', 'rsvp', 'account-section', 'guestbook-section', 'guestbook', 'greeting-section', 'calendar-section'];

function detectKeyByContent(el: HTMLElement): string | null {
  const text = el.textContent || '';
  const html = el.innerHTML || '';

  if (el.querySelector('.grid-cols-7') || text.includes('CALENDAR')) return 'calendar';
  if (text.includes('INVITATION') || text.includes('초대합니다') || text.includes('결혼합니다')) {
    if (!el.querySelector('.grid-cols-7')) return 'greeting';
  }
  if (html.includes('youtube.com/embed') || html.includes('youtu.be') || text.includes('OUR STORY')) return 'loveStory';
  if (text.includes('GALLERY') && el.querySelectorAll('img').length >= 1) return 'gallery';
  if (text.includes('LOCATION') || el.querySelector('[id*="kakao-map"]')) return 'location';
  if ((text.includes('RSVP') || text.includes('참석')) && el.querySelector('form, input')) return 'rsvp';
  if (text.includes('GIFT') || text.includes('축의금') || text.includes('신랑측')) return 'account';
  if (text.includes('GUESTBOOK') || text.includes('방명록')) return 'guestbook';
  return null;
}

function findContainerByIds(root: HTMLElement): HTMLElement | null {
  const found: HTMLElement[] = [];
  for (const id of KNOWN_IDS) {
    const el = root.querySelector('#' + id);
    if (el) found.push(el as HTMLElement);
  }
  if (found.length < 2) return null;

  const parentMap = new Map<HTMLElement, number>();
  found.forEach(el => {
    let cur = el.parentElement;
    while (cur && cur !== root) {
      parentMap.set(cur, (parentMap.get(cur) || 0) + 1);
      cur = cur.parentElement;
    }
  });

  let best: HTMLElement | null = null;
  let bestScore = 0;
  parentMap.forEach((_count, parent) => {
    const directWithId = Array.from(parent.children).filter(c => {
      if (KNOWN_IDS.includes(c.id)) return true;
      return c.querySelector(KNOWN_IDS.map(id => '#' + id).join(','));
    }).length;
    if (directWithId > bestScore) {
      bestScore = directWithId;
      best = parent;
    }
  });

  return best;
}

function applyOrder(root: HTMLElement, order: string[]) {
  const container = findContainerByIds(root);
  if (!container) return false;

  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  const children = Array.from(container.children) as HTMLElement[];
  if (children.length < 3) return false;

  const assigned = new Set<string>();
  let heroFound = false;

  children.forEach((child) => {
    const tag = child.tagName.toLowerCase();

    if (tag === 'style' || tag === 'audio' || tag === 'canvas' || tag === 'svg') {
      child.style.order = '-1';
      return;
    }

    if (tag === 'footer') {
      child.style.order = '99';
      return;
    }

    const pos = getComputedStyle(child).position;
    if (pos === 'fixed') return;

    if (!heroFound && child.classList.contains('min-h-screen')) {
      child.style.order = '0';
      heroFound = true;
      return;
    }

    let key: string | null = null;
    if (child.id && SECTION_ID_MAP[child.id]) {
      key = SECTION_ID_MAP[child.id];
    }
    if (!key) {
      const inner = child.querySelector(KNOWN_IDS.map(id => '#' + id).join(','));
      if (inner?.id && SECTION_ID_MAP[inner.id]) {
        key = SECTION_ID_MAP[inner.id];
      }
    }
    if (!key) {
      key = detectKeyByContent(child);
    }

    if (key && !assigned.has(key)) {
      const idx = order.indexOf(key);
      child.style.order = idx !== -1 ? String(idx + 1) : '50';
      assigned.add(key);
      return;
    }

    const text = child.textContent || '';
    if (text.includes('공유하기') || text.includes('Share')) {
      child.style.order = '97';
      return;
    }

    if (child.classList.contains('min-h-screen')) {
      child.style.order = '0';
      return;
    }

    child.style.order = '50';
  });

  console.log('[SectionOrder] container:', container.tagName + '.' + container.className.substring(0, 30), 'children:', children.length, 'assigned:', Array.from(assigned));
  return assigned.size >= 2;
}

export function useSectionOrder(sectionOrder?: string[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appliedRef = useRef(false);

  const order = Array.isArray(sectionOrder) && sectionOrder.length > 0
    ? sectionOrder
    : null;

  useEffect(() => {
    appliedRef.current = false;
    const root = containerRef.current;
    if (!root || !order) return;

    const tryApply = () => {
      if (appliedRef.current) return true;
      if (applyOrder(root, order)) {
        appliedRef.current = true;
        return true;
      }
      return false;
    };

    if (tryApply()) return;

    const observer = new MutationObserver(() => {
      if (tryApply()) observer.disconnect();
    });

    observer.observe(root, { childList: true, subtree: true });

    const fallback = setTimeout(() => {
      if (!appliedRef.current) tryApply();
    }, 1500);

    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, [order ? order.join(',') : null]);

  return containerRef;
}

export { DEFAULT_ORDER };
