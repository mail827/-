import { useState, useEffect } from 'react';
import { Trash2, Plus, Image, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const CONCEPTS = [
  { id: 'studio_classic', label: '스튜디오 클래식' },
  { id: 'outdoor_garden', label: '야외 가든' },
  { id: 'beach_sunset', label: '해변 선셋' },
  { id: 'hanbok_wonsam', label: '궁중 혼례' },
  { id: 'hanbok_dangui', label: '당의 한복' },
  { id: 'hanbok_modern', label: '모던 한복' },
  { id: 'hanbok_saeguk', label: '사극풍' },
  { id: 'hanbok_flower', label: '꽃한복' },
  { id: 'cherry_blossom', label: '벚꽃' },
  { id: 'iphone_selfie', label: '셀카 스냅' },
  { id: 'iphone_mirror', label: '거울 셀카' },
  { id: 'cruise_sunset', label: '크루즈 선셋' },
  { id: 'cruise_bluesky', label: '크루즈 블루' },
  { id: 'vintage_record', label: '빈티지 레코드' },
  { id: 'retro_hongkong', label: '레트로 홍콩' },
  { id: 'city_night', label: '시티 나이트' },
  { id: 'forest_wedding', label: '숲속 웨딩' },
  { id: 'castle_garden', label: '유럽 궁전' },
  { id: 'cathedral', label: '성당 웨딩' },
  { id: 'watercolor', label: '수채화' },
  { id: 'magazine_cover', label: '매거진 커버' },
  { id: 'rainy_day', label: '비오는 날' },
  { id: 'autumn_leaves', label: '가을 단풍' },
  { id: 'winter_snow', label: '겨울 눈' },
  { id: 'vintage_film', label: '빈티지 필름' },
  { id: 'black_swan', label: '블랙스완' },
  { id: 'blue_hour', label: '블루아워' },
  { id: 'water_memory', label: '물의 기억' },
  { id: 'velvet_rouge', label: '벨벳 루즈' },
  { id: 'studio_gallery', label: '갤러리' },
  { id: 'studio_fog', label: '포그' },
  { id: 'studio_mocha', label: '모카' },
  { id: 'studio_sage', label: '세이지' },
  { id: 'rose_garden', label: '장미 정원' },
  { id: 'grass_rain', label: '풀밭' },
  { id: 'eternal_blue', label: '블루' },
  { id: 'heart_editorial', label: '하이 에디토리얼' },
];

interface Sample { id: string; concept: string; mode: string; imageUrl: string; sortOrder: number }

export default function AdminSnapSample() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const token = localStorage.getItem('token');

  const load = async () => {
    const res = await fetch(`${API}/admin/snap-samples`, { headers: { Authorization: `Bearer ${token}` } });
    setSamples(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const upload = async (concept: string, mode: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(concept);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      fd.append('folder', 'ai-snap/samples');
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
      const cloud = await cloudRes.json();
      await fetch(`${API}/admin/snap-samples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ concept, mode, imageUrl: cloud.secure_url, sortOrder: samples.filter(s => s.concept === concept).length }),
      });
      setUploading(null);
      load();
    };
    input.click();
  };

  const remove = async (id: string) => {
    if (!confirm('삭제할까요?')) return;
    await fetch(`${API}/admin/snap-samples/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const filtered = filter === 'all' ? CONCEPTS : CONCEPTS.filter(c => c.id === filter);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-stone-400" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900">AI 스냅 샘플 관리</h1>
          <p className="text-sm text-stone-500 mt-1">무료체험 페이지에 표시될 컨셉별 샘플 이미지</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white">
          <option value="all">전체 컨셉</option>
          {CONCEPTS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map(concept => {
          const conceptSamples = samples.filter(s => s.concept === concept.id);
          return (
            <div key={concept.id} className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-stone-800">{concept.label}</h3>
                  <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{conceptSamples.length}장</span>
                </div>
                <div className="flex gap-2">
                  {['couple', 'groom', 'bride'].map(mode => (
                    <button key={mode} onClick={() => upload(concept.id, mode)} disabled={uploading === concept.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50">
                      {uploading === concept.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      {mode === 'couple' ? '커플' : mode === 'groom' ? '신랑' : '신부'}
                    </button>
                  ))}
                </div>
              </div>
              {conceptSamples.length === 0 ? (
                <div className="flex items-center justify-center py-8 border border-dashed border-stone-200 rounded-xl">
                  <div className="text-center">
                    <Image className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-sm text-stone-400">샘플 이미지를 업로드해주세요</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {conceptSamples.map(s => (
                    <div key={s.id} className="relative group aspect-[3/4] rounded-xl overflow-hidden">
                      <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button onClick={() => remove(s.id)} className="p-2 bg-white/90 rounded-full hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-[10px] text-white/80">{s.mode === 'couple' ? '커플' : s.mode === 'groom' ? '신랑' : '신부'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
