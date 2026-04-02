declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export const pageView = (path: string, title?: string) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_location: window.location.origin + path,
      page_title: title || document.title,
    });
  }
};

export const event = (action: string, params?: Record<string, unknown>) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', action, params);
  }
};

export const trackWeddingView = (slug: string, theme: string) => {
  event('wedding_view', { slug, theme });
};

export const trackRsvpSubmit = (slug: string, attending: boolean) => {
  event('rsvp_submit', { slug, attending });
};

export const trackGuestbookWrite = (slug: string) => {
  event('guestbook_write', { slug });
};

export const trackShareClick = (slug: string, platform: 'kakao' | 'instagram' | 'link') => {
  event('share_click', { slug, platform });
};

export const trackAccountCopy = (slug: string, side: 'groom' | 'bride') => {
  event('account_copy', { slug, side });
};

export const trackPaymentStart = (packageId: string, amount: number) => {
  event('begin_checkout', { currency: 'KRW', value: amount, items: [{ item_id: packageId }] });
};

export const trackPaymentComplete = (orderId: string, amount: number) => {
  event('purchase', { transaction_id: orderId, currency: 'KRW', value: amount });
};

export const trackScrollDepth = (slug: string, depth: number) => {
  event('scroll_depth', { slug, depth_percent: depth });
};

export const trackSectionView = (slug: string, section: string) => {
  event('section_view', { slug, section });
};
