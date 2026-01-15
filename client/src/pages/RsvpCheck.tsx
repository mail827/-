import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, Lock, Heart, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Rsvp {
  id: string;
  name: string;
  side: 'GROOM' | 'BRIDE';
  attending: boolean;
  guestCount: number;
  mealCount: number;
  message?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  attending: number;
  notAttending: number;
  totalGuests: number;
  totalMeals: number;
}

export default function RsvpCheck() {
  const { slug } = useParams<{ slug: string }>();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<{
    wedding: { groomName: string; brideName: string; weddingDate: string };
    rsvps: Rsvp[];
    stats: Stats;
  } | null>(null);
  const [showGroom, setShowGroom] = useState(true);
  const [showBride, setShowBride] = useState(true);

  const handleSubmit = async () => {
    if (!password || password.length !== 4) {
      setError('비밀번호 4자리를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/rsvp/verify/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || '조회 실패');
        return;
      }

      setData(result);
    } catch (err) {
      setError('서버 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-rose-400" />
            </div>
            <h1 className="text-xl font-medium text-stone-800 mb-2">참석 현황 조회</h1>
            <p className="text-stone-500 text-sm">신랑 전화번호 뒷자리 4자리를 입력해주세요</p>
          </div>

          <input
            type="password"
            maxLength={4}
            placeholder="●●●●"
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full text-center text-2xl tracking-[1em] py-4 border-2 border-stone-200 rounded-xl focus:border-rose-300 outline-none transition-colors mb-4"
          />

          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={isLoading || password.length !== 4}
            className="w-full py-4 bg-rose-400 text-white rounded-xl font-medium hover:bg-rose-500 transition-colors disabled:opacity-50"
          >
            {isLoading ? '확인 중...' : '조회하기'}
          </button>
        </motion.div>
      </div>
    );
  }

  const groomRsvps = data.rsvps.filter(r => r.side === 'GROOM');
  const brideRsvps = data.rsvps.filter(r => r.side === 'BRIDE');

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <Heart className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h1 className="text-xl font-medium text-stone-800">
              {data.wedding.groomName} ♥ {data.wedding.brideName}
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              {new Date(data.wedding.weddingDate).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <Users className="w-6 h-6 text-stone-400 mx-auto mb-2" />
              <p className="text-2xl font-semibold text-stone-800">{data.stats.total}</p>
              <p className="text-xs text-stone-500">총 응답</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <UserCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-semibold text-emerald-600">{data.stats.totalGuests}</p>
              <p className="text-xs text-stone-500">참석 인원</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <UserX className="w-6 h-6 text-rose-300 mx-auto mb-2" />
              <p className="text-2xl font-semibold text-rose-400">{data.stats.notAttending}</p>
              <p className="text-xs text-stone-500">불참</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowGroom(!showGroom)}
                className="w-full px-4 py-3 flex items-center justify-between bg-blue-50"
              >
                <span className="font-medium text-blue-800">신랑측 ({groomRsvps.length}명)</span>
                {showGroom ? <ChevronUp className="w-5 h-5 text-blue-400" /> : <ChevronDown className="w-5 h-5 text-blue-400" />}
              </button>
              {showGroom && (
                <div className="divide-y divide-stone-100">
                  {groomRsvps.length === 0 ? (
                    <p className="p-4 text-stone-400 text-sm text-center">아직 응답이 없습니다</p>
                  ) : (
                    groomRsvps.map((rsvp) => (
                      <div key={rsvp.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-stone-700">{rsvp.name}</p>
                          {rsvp.message && <p className="text-xs text-stone-400 mt-1">{rsvp.message}</p>}
                        </div>
                        <div className="text-right">
                          {rsvp.attending ? (
                            <span className="text-emerald-600 text-sm font-medium">{rsvp.guestCount}명 참석</span>
                          ) : (
                            <span className="text-rose-400 text-sm">불참</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowBride(!showBride)}
                className="w-full px-4 py-3 flex items-center justify-between bg-rose-50"
              >
                <span className="font-medium text-rose-800">신부측 ({brideRsvps.length}명)</span>
                {showBride ? <ChevronUp className="w-5 h-5 text-rose-400" /> : <ChevronDown className="w-5 h-5 text-rose-400" />}
              </button>
              {showBride && (
                <div className="divide-y divide-stone-100">
                  {brideRsvps.length === 0 ? (
                    <p className="p-4 text-stone-400 text-sm text-center">아직 응답이 없습니다</p>
                  ) : (
                    brideRsvps.map((rsvp) => (
                      <div key={rsvp.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-stone-700">{rsvp.name}</p>
                          {rsvp.message && <p className="text-xs text-stone-400 mt-1">{rsvp.message}</p>}
                        </div>
                        <div className="text-right">
                          {rsvp.attending ? (
                            <span className="text-emerald-600 text-sm font-medium">{rsvp.guestCount}명 참석</span>
                          ) : (
                            <span className="text-rose-400 text-sm">불참</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
