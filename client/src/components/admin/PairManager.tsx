import { useState, useEffect, useCallback } from 'react';
import { Heart, Copy, Check, Link2, X, UserPlus, Unlink } from 'lucide-react';
import type { PairStatus } from '../../types';

const API = import.meta.env.VITE_API_URL || '';

interface Props {
  weddingId: string;
}

export default function PairManager({ weddingId }: Props) {
  const [status, setStatus] = useState<PairStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/pair/status/${weddingId}`, { headers });
      if (res.ok) setStatus(await res.json());
    } catch {
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const createInvite = async () => {
    setActing(true);
    setError('');
    try {
      const res = await fetch(`${API}/pair/invite/${weddingId}`, { method: 'POST', headers });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }
      await fetchStatus();
    } catch {
      setError('초대 코드 생성에 실패했습니다');
    } finally {
      setActing(false);
    }
  };

  const cancelInvite = async () => {
    setActing(true);
    try {
      await fetch(`${API}/pair/invite/${weddingId}`, { method: 'DELETE', headers });
      await fetchStatus();
    } catch {
    } finally {
      setActing(false);
    }
  };

  const removePair = async () => {
    setActing(true);
    try {
      await fetch(`${API}/pair/${weddingId}`, { method: 'DELETE', headers });
      setConfirmRemove(false);
      await fetchStatus();
    } catch {
    } finally {
      setActing(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/pair/accept?code=${code}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const getTimeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return '만료됨';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}시간 ${m}분 남음`;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-stone-100 rounded w-1/3 mb-3" />
        <div className="h-3 bg-stone-50 rounded w-2/3" />
      </div>
    );
  }

  if (!status) return null;

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      )}

      {status.paired && status.pairUser && (
        <div>
          <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl mb-4">
            <div className="w-11 h-11 rounded-full bg-stone-200 flex items-center justify-center shrink-0 overflow-hidden">
              {status.pairUser.profileImage ? (
                <img src={status.pairUser.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <Heart className="w-5 h-5 text-stone-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-800 truncate">
                {status.pairUser.name || '이름 없음'}
              </p>
              <p className="text-xs text-stone-400 truncate">{status.pairUser.email}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-800 text-white text-xs font-medium rounded-full shrink-0">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              연결됨
            </span>
          </div>

          {status.isOwner && (
            <>
              {!confirmRemove ? (
                <button
                  onClick={() => setConfirmRemove(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-stone-400 hover:text-red-500 py-2.5 transition-colors"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  연결 해제
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={removePair}
                    disabled={acting}
                    className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {acting ? '해제 중...' : '정말 해제할래요'}
                  </button>
                  <button
                    onClick={() => setConfirmRemove(false)}
                    className="flex-1 py-2.5 bg-stone-100 text-stone-500 text-sm rounded-xl hover:bg-stone-200 transition-colors"
                  >
                    취소
                  </button>
                </div>
              )}
            </>
          )}

          {!status.isOwner && (
            <p className="text-center text-xs text-stone-400 py-1">
              소유자가 연결을 관리합니다
            </p>
          )}
        </div>
      )}

      {!status.paired && status.pendingInvite && (
        <div>
          <div className="text-center mb-5">
            <p className="text-sm text-stone-500 mb-4">초대 코드를 상대방에게 공유해주세요</p>
            <div className="inline-flex items-center gap-3 px-6 py-3.5 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-2xl font-mono font-bold tracking-[0.25em] text-stone-800">
                {status.pendingInvite.code}
              </span>
              <button
                onClick={() => copyCode(status.pendingInvite!.code)}
                className="p-1.5 hover:bg-stone-200 rounded-lg transition-colors"
                title="복사"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-stone-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-3 flex items-center justify-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {getTimeLeft(status.pendingInvite.expiresAt)}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => copyLink(status.pendingInvite!.code)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-900 transition-colors"
            >
              {linkCopied ? (
                <><Check className="w-3.5 h-3.5" /> 복사됨</>
              ) : (
                <><Link2 className="w-3.5 h-3.5" /> 초대 링크 복사</>
              )}
            </button>
            <button
              onClick={cancelInvite}
              disabled={acting}
              className="px-4 py-2.5 bg-stone-100 text-stone-500 text-sm rounded-xl hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!status.paired && !status.pendingInvite && status.isOwner && (
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-stone-100 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-stone-400" />
          </div>
          <p className="text-sm text-stone-400 mb-5 leading-relaxed">
            초대 코드를 생성하고 카톡이나 문자로<br />
            공유하면 함께 수정할 수 있어요
          </p>
          <button
            onClick={createInvite}
            disabled={acting}
            className="w-full py-3 bg-stone-800 text-white text-sm font-semibold rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50"
          >
            {acting ? '생성 중...' : '초대 코드 생성하기'}
          </button>
        </div>
      )}
    </div>
  );
}
