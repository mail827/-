import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Users, Eye, Trash2, Copy, Check, Edit, MessageCircle, Sparkles, Clock, Infinity } from 'lucide-react';
import { motion } from 'framer-motion';

interface Wedding {
  id: string;
  slug: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  isPublished: boolean;
  theme: string;
  expiresAt: string | null;
  _count?: { rsvps: number; guestbooks: number };
  user?: { id: string; name: string; email: string };
}

export default function AdminWeddingList() {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWeddings();
  }, []);

  const fetchWeddings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/weddings-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWeddings(data);
      }
    } catch (e) {
      console.error('Failed to fetch weddings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL}/weddings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setWeddings(weddings.filter(w => w.id !== id));
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const copyLink = async (slug: string, id: string) => {
    const url = window.location.origin + '/w/' + slug;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return { text: '평생', color: 'text-emerald-600 bg-emerald-50' };
    const date = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: '만료됨', color: 'text-red-600 bg-red-50' };
    if (diffDays <= 30) return { text: `${diffDays}일 남음`, color: 'text-amber-600 bg-amber-50' };
    return { text: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }), color: 'text-stone-600 bg-stone-50' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-800">청첩장 관리</h1>
          <p className="text-stone-500 text-sm mt-1">총 {weddings.length}개의 청첩장</p>
        </div>
        <Link to="/admin/weddings/create">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-900 transition-all w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            새 청첩장
          </motion.button>
        </Link>
      </div>

      {/* 모바일: 카드 형식 */}
      <div className="md:hidden space-y-3">
        {weddings.map((wedding, index) => {
          const expiry = formatExpiry(wedding.expiresAt);
          return (
            <motion.div
              key={wedding.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-stone-200 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-stone-800">
                      {wedding.groomName} ♥ {wedding.brideName}
                    </span>
                    {wedding.user && (
                      <span className="text-xs text-stone-400">{wedding.user.name}</span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      wedding.isPublished ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {wedding.isPublished ? '공개' : '비공개'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-sm text-stone-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(wedding.weddingDate).toLocaleDateString('ko-KR')}
                    </div>
                    <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${expiry.color}`}>
                      {wedding.expiresAt ? <Clock className="w-3 h-3" /> : <Infinity className="w-3 h-3" />}
                      {expiry.text}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(wedding.id)}
                  className="p-2 text-stone-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-stone-500 mb-3">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> RSVP {wedding._count?.rsvps || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> 방명록 {wedding._count?.guestbooks || 0}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => copyLink(wedding.slug, wedding.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200"
                >
                  {copiedId === wedding.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedId === wedding.id ? '복사됨' : '링크'}
                </button>
                <Link to={`/w/${wedding.slug}`} target="_blank" className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">
                    <Eye className="w-4 h-4" /> 보기
                  </button>
                </Link>
                <Link to={`/admin/weddings/${wedding.id}/edit`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-900">
                    <Edit className="w-4 h-4" /> 수정
                  </button>
                </Link>
              </div>

              <div className="flex gap-2 mt-2">
                <Link to={`/admin/weddings/${wedding.id}/rsvp`} className="flex-1">
                  <button className="w-full px-3 py-2 bg-blue-50 text-blue-600 text-xs rounded-lg hover:bg-blue-100">
                    RSVP 관리
                  </button>
                </Link>
                <Link to={`/admin/weddings/${wedding.id}/guestbook`} className="flex-1">
                  <button className="w-full px-3 py-2 bg-purple-50 text-purple-600 text-xs rounded-lg hover:bg-purple-100">
                    방명록 관리
                  </button>
                </Link>
                <Link to={`/admin/weddings/${wedding.id}/ai-report`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-violet-50 text-violet-600 text-xs rounded-lg hover:bg-violet-100">
                    <Sparkles className="w-3 h-3" /> AI
                  </button>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 데스크탑: 테이블 형식 */}
      <div className="hidden md:block bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">청첩장</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">회원</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">예식일</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">만료일</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">상태</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">RSVP</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">방명록</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {weddings.map((wedding) => {
              const expiry = formatExpiry(wedding.expiresAt);
              return (
                <tr key={wedding.id} className="hover:bg-stone-50">
                  <td className="px-4 py-4">
                    <span className="font-medium text-stone-800">
                      {wedding.groomName} ♥ {wedding.brideName}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs text-stone-500">
                      <p className="font-medium text-stone-700">{wedding.user?.name || '-'}</p>
                      <p className="text-stone-400">{wedding.user?.email || ''}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm text-stone-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(wedding.weddingDate).toLocaleDateString('ko-KR')}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${expiry.color}`}>
                      {wedding.expiresAt ? <Clock className="w-3 h-3" /> : <Infinity className="w-3 h-3" />}
                      {expiry.text}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      wedding.isPublished ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {wedding.isPublished ? '공개' : '비공개'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link to={`/admin/weddings/${wedding.id}/rsvp`} className="text-sm text-blue-600 hover:underline">
                      {wedding._count?.rsvps || 0}명
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <Link to={`/admin/weddings/${wedding.id}/guestbook`} className="text-sm text-purple-600 hover:underline">
                      {wedding._count?.guestbooks || 0}개
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyLink(wedding.slug, wedding.id)}
                        className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg"
                        title="링크 복사"
                      >
                        {copiedId === wedding.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <Link to={`/w/${wedding.slug}`} target="_blank">
                        <button className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg" title="미리보기">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link to={`/admin/weddings/${wedding.id}/edit`}>
                        <button className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg" title="수정">
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link to={`/admin/weddings/${wedding.id}/ai-report`}>
                        <button className="p-2 text-violet-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg" title="AI 리포트">
                          <Sparkles className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(wedding.id)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {weddings.length === 0 && (
          <div className="p-8 text-center text-stone-500">
            아직 청첩장이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
