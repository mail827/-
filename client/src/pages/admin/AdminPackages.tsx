import { useState, useEffect } from 'react';
import { Save, Package, Sparkles } from 'lucide-react';

interface PackageData {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  maxEdits: number;
}

export default function AdminPackages() {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/payment/packages`);
      const data = await res.json();
      setPackages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updatePackage = async (pkg: PackageData) => {
    setSaving(pkg.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/packages/${pkg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pkg)
      });
      
      if (res.ok) {
        setMessage('저장되었습니다!');
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage('저장 실패');
      }
    } catch (e) {
      console.error(e);
      setMessage('오류 발생');
    } finally {
      setSaving(null);
    }
  };

  const handleChange = (id: string, field: keyof PackageData, value: string | number | boolean) => {
    setPackages(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleFeatureChange = (id: string, index: number, value: string) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== id) return p;
      const newFeatures = [...p.features];
      newFeatures[index] = value;
      return { ...p, features: newFeatures };
    }));
  };

  const addFeature = (id: string) => {
    setPackages(prev => prev.map(p => 
      p.id === id ? { ...p, features: [...p.features, ''] } : p
    ));
  };

  const removeFeature = (id: string, index: number) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== id) return p;
      const newFeatures = p.features.filter((_, i) => i !== index);
      return { ...p, features: newFeatures };
    }));
  };

  if (loading) {
    return <div className="p-8 text-center text-stone-500">로딩 중...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-stone-700" />
          <h1 className="text-2xl font-bold text-stone-800">패키지 관리</h1>
        </div>
        {message && (
          <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm">
            {message}
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                {pkg.slug === 'ai-reception' && <Sparkles className="w-5 h-5 text-amber-500" />}
                <h2 className="text-xl font-semibold text-stone-800">{pkg.name}</h2>
                <span className="text-sm text-stone-400">({pkg.slug})</span>
              </div>
              <button
                onClick={() => updatePackage(pkg)}
                disabled={saving === pkg.id}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" />
                {saving === pkg.id ? '저장 중...' : '저장'}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">패키지명</label>
                  <input
                    type="text"
                    value={pkg.name}
                    onChange={(e) => handleChange(pkg.id, 'name', e.target.value)}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">가격 (원)</label>
                  <input
                    type="number"
                    value={pkg.price}
                    onChange={(e) => handleChange(pkg.id, 'price', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">설명</label>
                  <input
                    type="text"
                    value={pkg.description}
                    onChange={(e) => handleChange(pkg.id, 'description', e.target.value)}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkg.isActive}
                      onChange={(e) => handleChange(pkg.id, 'isActive', e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300"
                    />
                    <span className="text-sm text-stone-600">활성화</span>
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-600">정렬순서:</span>
                    <input
                      type="number"
                      value={pkg.sortOrder}
                      onChange={(e) => handleChange(pkg.id, 'sortOrder', parseInt(e.target.value))}
                      className="w-16 px-2 py-1 border border-stone-200 rounded-lg text-center"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-600">수정횟수:</span>
                    <input
                      type="number"
                      value={pkg.maxEdits}
                      onChange={(e) => handleChange(pkg.id, 'maxEdits', parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border border-stone-200 rounded-lg text-center"
                      title="-1 = 무제한"
                    />
                    <span className="text-xs text-stone-400">(-1=무제한)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">기능 목록</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pkg.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(pkg.id, idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                      />
                      <button
                        onClick={() => removeFeature(pkg.id, idx)}
                        className="px-2 text-stone-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addFeature(pkg.id)}
                  className="mt-2 text-sm text-stone-500 hover:text-stone-700"
                >
                  + 기능 추가
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
