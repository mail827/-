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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 rounded-full bg-violet-100 mx-auto mb-4" />
          <div className="h-3 bg-violet-100 rounded w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-5">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
            <Heart className="w-9 h-9 text-emerald-500" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">연결 완료!</h1>
          <p className="text-gray-500 text-[15px] mb-8 leading-relaxed">
            {success.groomName} ♥ {success.brideName}<br />
            청첩장을 함께 수정할 수 있어요
          </p>
          <button
            onClick={() => navigate('/my')}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 text-white font-semibold rounded-2xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-5">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-300" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">초대를 확인할 수 없어요</h1>
          <p className="text-gray-500 text-[14px] mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-[14px]"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50/80 to-rose-50/30 px-5">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-100/50">
            <Mail className="w-9 h-9 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1.5">함께 수정하기 초대</h1>
          <p className="text-gray-400 text-[13px]">청첩장을 같이 꾸밀 수 있어요</p>
        </div>

        {info && (
          <div className="bg-white rounded-2xl shadow-lg shadow-violet-100/30 overflow-hidden mb-6">
            <div className="p-6 text-center border-b border-gray-50">
              <p className="text-xl font-semibold text-gray-800 tracking-wide">
                {info.groomName}
                <span className="inline-block mx-2">
                  <Heart className="w-4 h-4 text-rose-300 inline" fill="currentColor" />
                </span>
                {info.brideName}
              </p>
            </div>
            <div className="px-6 py-4 space-y-2.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <CalendarHeart className="w-3.5 h-3.5" />
                  예식일
                </span>
                <span className="text-gray-700 font-medium">{formatDate(info.weddingDate)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <MapPin className="w-3.5 h-3.5" />
                  예식장
                </span>
                <span className="text-gray-700 font-medium">{info.venue}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-[13px] rounded-xl text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-500 to-rose-400 text-white font-semibold text-[15px] rounded-2xl hover:shadow-lg hover:shadow-violet-200/50 transition-all disabled:opacity-50"
        >
          {accepting ? (
            '수락 중...'
          ) : isLoggedIn ? (
            <>수락하기 <ArrowRight className="w-4 h-4" /></>
          ) : (
            <><LogIn className="w-4 h-4" /> 로그인하고 수락하기</>
          )}
        </button>

        <p className="text-center text-[11px] text-gray-300 mt-4">
          수락하면 이 청첩장의 내용을 함께 수정할 수 있습니다
        </p>
      </div>
    </div>
  );
}
