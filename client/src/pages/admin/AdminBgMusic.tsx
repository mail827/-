import { useState, useEffect, useRef } from 'react';
import { Music, Plus, Trash2, Play, Pause, Upload, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';

interface BgMusic {
  id: string;
  title: string;
  artist: string;
  category: string;
  url: string;
  duration: number;
  order: number;
  isActive: boolean;
}

const CATEGORIES = [
  { id: 'romantic', label: '로맨틱' },
  { id: 'classic', label: '클래식' },
  { id: 'calm', label: '잔잔한' },
  { id: 'bright', label: '밝은' },
  { id: 'emotional', label: '감성적' },
];

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AdminBgMusic() {
  const [musics, setMusics] = useState<BgMusic[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', artist: '', category: 'romantic', url: '', duration: 0 });
  const audioRef = useRef<HTMLAudioElement>(null);
  const token = localStorage.getItem('token');

  const api = (path: string, opts?: RequestInit) =>
    fetch(`${import.meta.env.VITE_API_URL}/bg-music${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts?.headers },
    });

  useEffect(() => {
    api('/').then(r => r.json()).then(d => { setMusics(d); setLoading(false); });
  }, []);

  const handlePlay = (music: BgMusic) => {
    if (playingId === music.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = music.url;
        audioRef.current.play();
      }
      setPlayingId(music.id);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('resource_type', 'auto');

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setForm(prev => ({
        ...prev,
        url: data.secure_url,
        duration: Math.round(data.duration || 0),
        title: prev.title || file.name.replace(/\.[^.]+$/, ''),
      }));
    } catch (err) {
      console.error('Upload error:', err);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.url) return;
    const res = await api('/', {
      method: 'POST',
      body: JSON.stringify({ ...form, order: musics.length }),
    });
    if (res.ok) {
      const newMusic = await res.json();
      setMusics(prev => [...prev, newMusic]);
      setForm({ title: '', artist: '', category: 'romantic', url: '', duration: 0 });
      setShowForm(false);
    }
  };

  const handleToggle = async (music: BgMusic) => {
    const res = await api(`/${music.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...music, isActive: !music.isActive }),
    });
    if (res.ok) {
      setMusics(prev => prev.map(m => m.id === music.id ? { ...m, isActive: !m.isActive } : m));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 음원을 삭제할까요?')) return;
    const res = await api(`/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMusics(prev => prev.filter(m => m.id !== id));
      if (playingId === id) { audioRef.current?.pause(); setPlayingId(null); }
    }
  };

  if (loading) return <div className="p-8 text-stone-400">불러오는 중...</div>;

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: musics.filter(m => m.category === cat.id),
  })).filter(g => g.items.length > 0);

  return (
    <div className="max-w-4xl">
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">배경음악 관리</h1>
          <p className="text-sm text-stone-500 mt-1">음원을 등록하고 고객에게 제공해요</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm rounded-xl hover:bg-stone-800 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? '닫기' : '음원 등록'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">제목</label>
              <input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400"
                placeholder="Moonlight Serenade"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">아티스트</label>
              <input
                value={form.artist}
                onChange={e => setForm(prev => ({ ...prev, artist: e.target.value }))}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400"
                placeholder="Wedding Studio AI"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-stone-500 mb-1 block">카테고리</label>
            <div className="flex gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm(prev => ({ ...prev, category: cat.id }))}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                    form.category === cat.id
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-stone-500 mb-1 block">음원 파일</label>
            {form.url ? (
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                <Music className="w-5 h-5 text-stone-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-700 truncate">{form.title || '업로드됨'}</p>
                  {form.duration > 0 && <p className="text-xs text-stone-400">{formatDuration(form.duration)}</p>}
                </div>
                <audio src={form.url} controls className="h-8" />
                <button onClick={() => setForm(prev => ({ ...prev, url: '', duration: 0 }))} className="p-1 text-stone-400 hover:text-stone-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-stone-400 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="w-8 h-8 text-stone-400 mb-2" />
                <span className="text-sm text-stone-500">{uploading ? '업로드 중...' : 'MP3 / WAV 파일 선택'}</span>
                <input type="file" accept="audio/*" onChange={handleUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!form.title || !form.url}
              className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm rounded-xl hover:bg-stone-800 disabled:opacity-40 transition-colors"
            >
              <Save className="w-4 h-4" />
              등록
            </button>
          </div>
        </div>
      )}

      {musics.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>등록된 음원이 없어요</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.id}>
              <p className="text-xs text-stone-400 tracking-wide mb-3 uppercase">{group.label}</p>
              <div className="space-y-2">
                {group.items.map(music => (
                  <div
                    key={music.id}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
                      playingId === music.id
                        ? 'bg-stone-50 border-stone-300'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    } ${!music.isActive ? 'opacity-50' : ''}`}
                  >
                    <button onClick={() => handlePlay(music)} className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors">
                      {playingId === music.id ? <Pause className="w-4 h-4 text-stone-700" /> : <Play className="w-4 h-4 text-stone-700" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800">{music.title}</p>
                      <p className="text-xs text-stone-400">{music.artist || 'Unknown'} {music.duration > 0 && `· ${formatDuration(music.duration)}`}</p>
                    </div>
                    <button onClick={() => handleToggle(music)} className="p-1.5 text-stone-400 hover:text-stone-600">
                      {music.isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => handleDelete(music.id)} className="p-1.5 text-stone-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
