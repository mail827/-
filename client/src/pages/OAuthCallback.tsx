import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      localStorage.setItem('token', token);
      
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      const pairCode = localStorage.getItem('pairReturnCode');
      const pendingGiftCode = localStorage.getItem('pendingGiftCode');
      
      if (pairCode) {
        localStorage.removeItem('pairReturnCode');
        navigate(`/pair/accept?code=${pairCode}`);
      } else if (pendingGiftCode) {
        navigate('/gift/redeem');
      } else if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl);
      } else {
        const afterLogin = sessionStorage.getItem('afterLogin'); sessionStorage.removeItem('afterLogin'); navigate(afterLogin || '/dashboard');
      }
    } else if (error) {
      navigate('/?error=' + encodeURIComponent(error));
    } else {
      navigate('/');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-stone-400 border-t-stone-800 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}
