import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Heart, Mail, AlertCircle, ArrowRight, CalendarHeart, MapPin, LogIn } from 'lucide-react';
import type { PairInviteInfo } from '../types';

const API = import.meta.env.VITE_API_URL || '';

export default function PairAccept() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const code = params.get('code') || '';

  const [info, setInfo] = useState<PairInviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ slug: string; groomName: string; brideName: string } | null>(null);

  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  useEffect(() => {
    if (!code) {
      setError('초대 코드가 없습니다');
      setLoading(false);
      return;
    }

    fetch(`${API}/pair/info/${code}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          setError(data.error);
          return;
        }
        setInfo(await res.json());
      })
      .catch(() => setError('초대 정보를 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  }, [code]);

  const handleAccept = async () => {
    if (!isLoggedIn) {
      sessionStorage.setItem('pairReturnCode', code);
      navigate('/login');
      return;
    }

    setAccepting(true);
    setError('');

    try {
      const res = await fetch(`${API}/pair/accept/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess({ slug: data.slug, groomName: data.groomName, brideName: data.brideName });
    } catch {
      setError('수락에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setAccepting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fefefe]">
        <div className="w-10 h-10 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fefefe] px-5">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-7 h-7 text-stone-600" fill="currentColor" />
          </div>
          <h1 className="font-serif text-2xl text-stone-800 mb-2">연결 완료</h1>
          <p className="text-stone-500 text-sm mb-8 leading-relaxed">
            {success.groomName} & {success.brideName}<br />
            청첩장을 함께 수정할 수 있어요
          </p>
          <button
            onClick={() => navigate('/my')}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-stone-800 text-white text-sm font-semibold rounded-xl hover:bg-stone-900 transition-colors"
          >
            내 청첩장으로 이동
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fefefe] px-5">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-7 h-7 text-stone-400" />
          </div>
          <h1 className="font-serif text-xl text-stone-800 mb-2">초대를 확인할 수 없어요</h1>
          <p className="text-stone-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-colors text-sm"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefefe] px-5">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-7 h-7 text-stone-500" />
          </div>
          <h1 className="font-serif text-2xl text-stone-800 mb-1.5">함께 수정하기 초대</h1>
          <p className="text-stone-400 text-sm">청첩장을 같이 꾸밀 수 있어요</p>
        </div>

        {info && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-6">
            <div className="p-6 text-center border-b border-stone-100">
              <p className="font-serif text-xl text-stone-800">
                {info.groomName}
                <span className="inline-block mx-2">
                  <Heart className="w-4 h-4 text-stone-300 inline" fill="currentColor" />
                </span>
                {info.brideName}
              </p>
            </div>
            <div className="px-6 py-4 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-stone-400">
                  <CalendarHeart className="w-3.5 h-3.5" />
                  예식일
                </span>
                <span className="text-stone-700 font-medium">{formatDate(info.weddingDate)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-stone-400">
                  <MapPin className="w-3.5 h-3.5" />
                  예식장
                </span>
                <span className="text-stone-700 font-medium">{info.venue}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-stone-800 text-white text-sm font-semibold rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50"
        >
          {accepting ? (
            '수락 중...'
          ) : isLoggedIn ? (
            <>수락하기 <ArrowRight className="w-4 h-4" /></>
          ) : (
            <><LogIn className="w-4 h-4" /> 로그인하고 수락하기</>
          )}
        </button>

        <p className="text-center text-xs text-stone-300 mt-4">
          수락하면 이 청첩장의 내용을 함께 수정할 수 있습니다
        </p>
      </div>
    </div>
  );
}
