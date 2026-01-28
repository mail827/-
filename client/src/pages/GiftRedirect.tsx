import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function GiftRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const code = searchParams.get('code');
    navigate(`/gift/redeem${code ? `?code=${code}` : ''}`, { replace: true });
  }, [searchParams, navigate]);
  
  return null;
}
