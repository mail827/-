import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageView } from '../utils/analytics';

export default function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    pageView(location.pathname + location.search);
  }, [location]);
}
