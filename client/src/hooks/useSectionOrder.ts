import { useEffect, useRef, useCallback } from 'react';

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
  'closing-section': 'closing',
};

const DEFAULT_ORDER = [
  'greeting', 'calendar', 'loveStory', 'gallery',
  'location', 'rsvp', 'account', 'guestbook', 'closing',
];

const KNOWN_IDS = ['gallery-section', 'venue-section', 'rsvp-section', 'rsvp', 'account-section', 'guestbook-section', 'guestbook', 'greeting-section', 'calendar-section', 'closing-section'];

function detectKeyByContent(el: HTMLElement): string | null {
  const text = (el.textContent || '').slice(0, 500);
  const html = (el.innerHTML || '').slice(0, 2000);

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
  if (text.includes('공유하기') || text.includes('Share') || html.includes('showShareModal') || html.includes('showShare')) return 'closing';
  return null;
}

function findContainer(root: HTMLElement): HTMLElement | null {
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

function getKey(child: HTMLElement): string | null {
  if (child.id && SECTION_ID_MAP[child.id]) return SECTION_ID_MAP[child.id];
  const inner = child.querySelector(KNOWN_IDS.map(id => '#' + id).join(','));
  if (inner && (inner as HTMLElement).id && SECTION_ID_MAP[(inner as HTMLElement).id]) {
    return SECTION_ID_MAP[(inner as HTMLElement).id];
  }
  return detectKeyByContent(child);
}

function applyOrder(root: HTMLElement, order: string[], hidden: string[]): boolean {
  const container = findContainer(root);
  if (!container) return false;

  const children = Array.from(container.children) as HTMLElement[];
  if (children.length < 3) return false;

  container.style.display = 'flex';
  container.style.flexDirection = 'column';

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

    try {
      const pos = getComputedStyle(child).position;
      if (pos === 'fixed') return;
    } catch { return; }

    if (!heroFound && (
      child.classList.contains('min-h-screen') ||
      (child.tagName === 'SECTION' && child.querySelector('video, .rc-hero-img, .cd-hero-img, .cs-hero-img, .mm-hero-img'))
    )) {
      child.style.order = '0';
      heroFound = true;
      return;
    }

    const key = getKey(child);
    if (key && !assigned.has(key)) {
      const idx = order.indexOf(key);
      child.style.order = idx !== -1 ? String(idx + 1) : '50';
      child.style.display = hidden.includes(key) ? 'none' : '';
      assigned.add(key);
      return;
    }


    if (child.classList.contains('min-h-screen')) {
      child.style.order = '0';
      return;
    }
    child.style.order = '50';
  });

  return assigned.size >= 2;
}

function applyHiddenOnly(root: HTMLElement, hidden: string[]): boolean {
  const container = findContainer(root);
  if (!container) return false;
  const children = Array.from(container.children) as HTMLElement[];
  children.forEach((child) => {
    const key = getKey(child);
    if (key) {
      child.style.display = hidden.includes(key) ? 'none' : '';
    }
  });
  return true;
}

export function useSectionOrder(sectionOrder?: string[], hiddenSections?: string[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const order = Array.isArray(sectionOrder) && sectionOrder.length > 0 ? sectionOrder : null;
  const hidden = Array.isArray(hiddenSections) ? hiddenSections : [];

  const apply = useCallback(() => {
    const root = containerRef.current;
    if (!root) return false;
    if (order) return applyOrder(root, order, hidden);
    if (hidden.length > 0) return applyHiddenOnly(root, hidden);
    return false;
  }, [order, hidden]);

  useEffect(() => {
    if (!order && hidden.length === 0) return;

    const tryApply = () => {
      if (apply()) {
        return true;
      }
      return false;
    };

    tryApply();

    const observer = new MutationObserver(() => {
      tryApply();
    });

    const root = containerRef.current;
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
    }

    intervalRef.current = setInterval(() => {
      tryApply();
    }, 800);

    const cleanup = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 5000);

    return () => {
      observer.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(cleanup);
    };
  }, [apply, order ? order.join(',') : '', hidden.join(',')]);

  return containerRef;
}

export { DEFAULT_ORDER };
