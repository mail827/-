import { useState, useEffect } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL;

interface Coupon {
  id: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCoupon() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    discountType: 'PERCENT',
    discountValue: 10,
    maxUses: '',
    expiresAt: '',
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${API_BASE}/coupon/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (e) {
      console.error('Failed to fetch coupons:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.code || !form.name || !form.discountValue) {
      alert('필수 항목을 입력해주세요');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/coupon/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          name: form.name,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt || null,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({ code: '', name: '', discountType: 'PERCENT', discountValue: 10, maxUses: '', expiresAt: '' });
        fetchCoupons();
      } else {
        const err = await res.json();
        alert(err.error || '생성 실패');
      }
    } catch (e) {
      alert('네트워크 오류');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch(`${API_BASE}/coupon/admin/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchCoupons();
    } catch (e) {
      console.error('Toggle failed:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('쿠폰을 삭제하시겠습니까?')) return;

    try {
      await fetch(`${API_BASE}/coupon/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCoupons();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-stone-800">쿠폰 관리</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900"
        >
          <Plus className="w-4 h-4" />
          쿠폰 생성
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 mb-6 border border-stone-200">
          <h2 className="text-lg font-semibold mb-4">새 쿠폰 만들기</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-stone-600 mb-1">쿠폰 코드 *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="FOREVER20"
                className="w-full px-4 py-2 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-600 mb-1">쿠폰명 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="포에버웨딩 20% 할인"
                className="w-full px-4 py-2 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-600 mb-1">할인 타입</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg"
              >
                <option value="PERCENT">퍼센트 (%)</option>
                <option value="FIXED">고정 금액 (원)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-stone-600 mb-1">할인값 *</label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                placeholder="20"
                className="w-full px-4 py-2 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-600 mb-1">최대 사용 횟수</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="무제한"
                className="w-full px-4 py-2 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-600 mb-1">만료일</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-stone-200 rounded-lg hover:bg-stone-50"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900"
            >
              생성
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">코드</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">이름</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">할인</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">사용</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">만료일</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">상태</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                  등록된 쿠폰이 없습니다
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-stone-800">{coupon.code}</td>
                  <td className="px-4 py-3 text-sm text-stone-600">{coupon.name}</td>
                  <td className="px-4 py-3 text-sm text-stone-800">
                    {coupon.discountType === 'PERCENT' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString()}원`}
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-600">
                    {coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-600">
                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(coupon.id, coupon.isActive)}>
                      {coupon.isActive ? (
                        <ToggleRight className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-stone-300" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
