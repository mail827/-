import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const getSessionId = () => {
  let sid = sessionStorage.getItem('_vsid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('_vsid', sid);
  }
  return sid;
};

const getDevice = () => {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
};

const getBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.includes('KAKAOTALK')) return 'kakaotalk';
  if (ua.includes('Instagram')) return 'instagram';
  if (ua.includes('NAVER')) return 'naver';
  if (ua.includes('Firefox')) return 'firefox';
  if (ua.includes('Edg')) return 'edge';
  if (ua.includes('Chrome')) return 'chrome';
  if (ua.includes('Safari')) return 'safari';
  return 'other';
};

let tracked = false;

export default function useVisitTracking() {
  const location = useLocation();

  useEffect(() => {
    if (tracked) return;
    tracked = true;

    const params = new URLSearchParams(location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const utmContent = params.get('utm_content');

    const payload = {
      path: location.pathname,
      referrer: document.referrer || null,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      device: getDevice(),
      browser: getBrowser(),
      sessionId: getSessionId(),
    };

    fetch(`${import.meta.env.VITE_API_URL}/analytics/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, []);
}
