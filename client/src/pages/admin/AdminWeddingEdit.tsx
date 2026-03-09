import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Eye, X, Plus, Music, Film, Image, Sparkles, Send, Bell, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';
import AiWritingAssistant from '../../components/AiWritingAssistant';
import PairManager from '../../components/admin/PairManager';
import type { Wedding } from '../../types';

const THEMES = [
  { id: 'ROMANTIC_CLASSIC', name: '로맨틱 클래식', desc: '우아하고 낭만적인 클래식 디자인' },
  { id: 'MODERN_MINIMAL', name: '모던 미니멀', desc: '깔끔한 여백과 타이포그래피' },
  { id: 'BOHEMIAN_DREAM', name: '보헤미안 드림', desc: '자유롭고 따뜻한 보태니컬 감성' },
  { id: 'LUXURY_GOLD', name: '럭셔리 골드', desc: '다크 배경에 골드 아르데코' },
  { id: 'POETIC_LOVE', name: '포에틱 러브', desc: '시적인 감성의 라벤더 톤' },
  { id: 'SENIOR_SIMPLE', name: '어르신용 심플', desc: '큰 글씨, 심플한 구성' },
  { id: 'FOREST_GARDEN', name: '포레스트 가든', desc: '자연 속 싱그러운 그린 톤' },
  { id: 'OCEAN_BREEZE', name: '오션 브리즈', desc: '시원한 바다 블루 컬러' },
  { id: 'GLASS_BUBBLE', name: '글라스 버블', desc: '투명한 글라스모피즘 파스텔' },
  { id: 'SPRING_BREEZE', name: '봄바람', desc: '손글씨 감성의 핑크 수채화' },
  { id: 'GALLERY_MIRIM_1', name: 'Gallery 美林-1', desc: '따뜻한 세피아 종이 질감' },
  { id: 'GALLERY_MIRIM_2', name: 'Gallery 美林-2', desc: '청량한 다크 필름 톤' },
  { id: 'LUNA_HALFMOON', name: '루나 하프문', desc: '달빛 아래 로맨틱 무드' },
  { id: 'PEARL_DRIFT', name: '펄 드리프트', desc: '진주빛 우아한 흐름' },
  { id: 'NIGHT_SEA', name: '밤바다', desc: '별이 쏟아지는 밤바다' },
  { id: 'AQUA_GLOBE', name: '아쿠아 글로브', desc: '청량한 수중 금붕어' },
  { id: 'BOTANICAL_CLASSIC', name: '보태니컬 클래식', desc: '올리브그린 보태니컬 라인아트' },
  { id: 'HEART_MINIMAL', name: '하트 미니멀', desc: '워피치 하트 미니멀' },
  { id: 'WAVE_BORDER', name: '웨이브 보더', desc: '웜브라운 물결 보더' },
  { id: 'CRUISE_DAY', name: '크루즈 데이', desc: '스카이블루 캘리그라피' },
  { id: 'CRUISE_SUNSET', name: '크루즈 선셋', desc: '골든 선셋 다크' },
  { id: 'VOYAGE_BLUE', name: '보야지 블루', desc: 'Voyage of Love 네이비' },
  { id: 'EDITORIAL', name: '에디토리얼', desc: '다크 에디토리얼 매거진' },
  { id: 'EDITORIAL_WHITE', name: '에디토리얼 화이트', desc: '화이트 에디토리얼 매거진' },
  { id: 'EDITORIAL_GREEN', name: '에디토리얼 그린', desc: '숲 에디토리얼 매거진' },
  { id: 'EDITORIAL_BLUE', name: '에디토리얼 블루', desc: '미드나잇 블루 매거진' },
  { id: 'EDITORIAL_BROWN', name: '에디토리얼 브라운', desc: '웜 베이지 매거진' },
  { id: 'WAVE_BORDER', name: '웨이브 보더', desc: '웜브라운 물결 보더' },
  { id: 'CRUISE_DAY', name: '크루즈 데이', desc: '스카이블루 캘리그라피' },
  { id: 'CRUISE_SUNSET', name: '크루즈 선셋', desc: '골든 선셋 다크' },
  { id: 'VOYAGE_BLUE', name: '보야지 블루', desc: 'Voyage of Love 네이비' },
  { id: 'EDITORIAL', name: '에디토리얼', desc: '다크 에디토리얼 매거진' },
  { id: 'EDITORIAL_WHITE', name: '에디토리얼 화이트', desc: '화이트 에디토리얼 매거진' },
  { id: 'EDITORIAL_GREEN', name: '에디토리얼 그린', desc: '숲 에디토리얼 매거진' },
  { id: 'EDITORIAL_BLUE', name: '에디토리얼 블루', desc: '미드나잇 블루 매거진' },
  { id: 'EDITORIAL_BROWN', name: '에디토리얼 브라운', desc: '웜 베이지 매거진' },
  { id: 'HEART_MINIMAL', name: '하트 미니멀', desc: '워피치 하트 미니멀' },
  { id: 'BOTANICAL_CLASSIC', name: '보태니컬 클래식', desc: '올리브그린 보태니컬 라인아트' },
];

const SENIOR_COLORS = [
  { name: '남색', value: '#1E3A5F' },
  { name: '앰버', value: '#B45309' },
  { name: '로즈', value: '#BE123C' },
  { name: '그린', value: '#15803D' },
  { name: '퍼플', value: '#7C3AED' },
  { name: '브라운', value: '#78350F' },
];

interface GalleryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  order: number;
}

function isYouTubeUrl(url: string): boolean {
  return url?.includes('youtube.com') || url?.includes('youtu.be');
}

function getYouTubeEmbedUrl(url: string): string {
  if (!url) return '';
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('watch?v=')) {
    videoId = url.split('watch?v=')[1]?.split('&')[0];
  } else if (url.includes('embed/')) {
    videoId = url.split('embed/')[1]?.split('?')[0];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

export default function AdminWeddingEdit() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('notification');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [wedding, setWedding] = useState<any>(null);
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<{ type: string; message: string } | null>(null);
  const [rsvpList, setRsvpList] = useState<any[]>([]);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['wedding', id],
    queryFn: () => api<Wedding>(`/weddings/${id}`),
    enabled: !!id
  });

  useEffect(() => {
    if (data) {
      setWedding({
        ...data,
        aiSecrets: (data as any).aiSecrets || {},
        aiMenuInfo: (data as any).aiMenuInfo || {},
        aiTransportInfo: (data as any).aiTransportInfo || {},
        aiCustomQna: (data as any).aiCustomQna || [],
      });
      setGalleries((data as any).galleries || []);
    }
  }, [data]);

  const fetchRsvp = async () => {
    if (!id) return;
    setRsvpLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/weddings/${id}/rsvp`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRsvpList(data);
      }
    } catch (e) {
      console.error('Failed to fetch RSVP:', e);
    } finally {
      setRsvpLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'rsvp') fetchRsvp();
  }, [tab]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api(`/weddings/${id}`, { method: 'PUT', body: wedding });
      queryClient.invalidateQueries({ queryKey: ['wedding', id] });
      alert('저장되었습니다!');
    } catch (e) {
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setWedding((prev: any) => ({ ...prev, [key]: value }));
  };

  const updateAiSecrets = (key: string, value: string) => {
    setWedding((prev: any) => ({
      ...prev,
      aiSecrets: { ...prev.aiSecrets, [key]: value }
    }));
  };

  const updateAiMenu = (key: string, value: string) => {
    setWedding((prev: any) => ({
      ...prev,
      aiMenuInfo: { ...prev.aiMenuInfo, [key]: value }
    }));
  };

  const updateAiTransport = (key: string, value: string) => {
    setWedding((prev: any) => ({
      ...prev,
      aiTransportInfo: { ...prev.aiTransportInfo, [key]: value }
    }));
  };

  const addCustomQna = () => {
    setWedding((prev: any) => ({
      ...prev,
      aiCustomQna: [...(prev.aiCustomQna || []), { question: '', answer: '' }]
    }));
  };

  const updateCustomQna = (index: number, field: 'question' | 'answer', value: string) => {
    setWedding((prev: any) => {
      const updated = [...prev.aiCustomQna];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, aiCustomQna: updated };
    });
  };

  const removeCustomQna = (index: number) => {
    setWedding((prev: any) => ({
      ...prev,
      aiCustomQna: prev.aiCustomQna.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, type: 'image' | 'video' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            updateField(field, data.url);
            if (field === 'heroMedia') {
              updateField('heroMediaType', type === 'video' ? 'VIDEO' : 'IMAGE');
            }
            resolve();
          } else reject(new Error('Upload failed'));
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('POST', `${import.meta.env.VITE_API_URL}/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });
    } catch (e) {
      alert('업로드 실패');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    const token = localStorage.getItem('token');
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          const isVideo = file.type.startsWith('video/');
          const galleryRes = await fetch(`${import.meta.env.VITE_API_URL}/weddings/${id}/gallery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ mediaUrl: uploadData.url, mediaType: isVideo ? 'VIDEO' : 'IMAGE', order: galleries.length })
          });
          if (galleryRes.ok) {
            const newItem = await galleryRes.json();
            setGalleries(prev => [...prev, newItem]);
          }
        }
      } catch (e) {
        console.error('Gallery upload error:', e);
      }
    }
    setUploading(false);
  };

  const handleDeleteGallery = async (galleryId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/weddings/${id}/gallery/${galleryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setGalleries(prev => prev.filter(g => g.id !== galleryId));
      }
    } catch (e) {
      alert('삭제 실패');
    }
  };

  const sendNotification = async (type: 'summary' | 'reminder' | 'custom') => {
    setNotificationStatus(null);
    try {
      const body = type === 'custom' ? { message: customMessage } : undefined;
      const res = await api<{ success: boolean; sentTo: number; dDay?: number }>(`/notification/${type}/${id}`, { method: 'POST', body });
      if (res.success) {
        const typeNames = { summary: 'RSVP 현황', reminder: '리마인더', custom: '커스텀 메시지' };
        setNotificationStatus({ type: 'success', message: `${typeNames[type]} 알림이 ${res.sentTo}명에게 발송되었습니다${res.dDay !== undefined ? ` (D-${res.dDay})` : ''}` });
        if (type === 'custom') setCustomMessage('');
      }
    } catch (err: any) {
      setNotificationStatus({ type: 'error', message: err.message || '발송 실패' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">청첩장을 찾을 수 없습니다</p>
        <Link to="/admin/weddings" className="text-stone-600 text-sm hover:underline mt-2 inline-block">목록으로 돌아가기</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'notification', name: '📢 발송' },
    { id: 'basic', name: '기본 정보' },
    { id: 'greeting', name: '인사말' },
    { id: 'venue', name: '예식 정보' },
    { id: 'account', name: '축의금' },
    { id: 'media', name: '대표 미디어' },
    { id: 'gallery', name: '갤러리' },
    { id: 'video', name: '영상' },
    { id: 'music', name: '배경음악' },
    { id: 'ai', name: '🤖 AI' },
    { id: 'settings', name: '설정' },
    { id: 'pair', name: '👫 함께 수정' },
    { id: 'rsvp', name: 'RSVP' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/weddings" className="p-2 hover:bg-white rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-stone-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-800">{wedding.groomName} ♥ {wedding.brideName}</h1>
            <p className="text-stone-500 mt-1">청첩장 관리</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open(`/w/${wedding.slug}`, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50">
            <Eye className="w-4 h-4" />
            미리보기
          </button>
          {tab !== 'notification' && (
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-xl disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </div>

      {/* 모바일: 드롭다운 */}
      <select
        value={tab}
        onChange={(e) => setTab(e.target.value)}
        className="sm:hidden w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300 mb-4"
      >
        {tabs.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      {/* 데스크탑: 탭 버튼 */}
      <div className="hidden sm:flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {tab === 'notification' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-stone-600" />
              카카오톡 알림 발송
            </h2>
            {notificationStatus && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${notificationStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {notificationStatus.message}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button onClick={() => sendNotification('summary')} className="flex items-center gap-4 p-5 bg-stone-50 rounded-xl border border-stone-200 hover:border-stone-400 transition-all group">
                <div className="w-12 h-12 bg-stone-200 rounded-xl flex items-center justify-center group-hover:bg-stone-300 transition-colors">
                  <Send className="w-6 h-6 text-stone-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-stone-800">RSVP 현황 알림</p>
                  <p className="text-sm text-stone-500">현재 참석/불참 현황 발송</p>
                </div>
              </button>
              <button onClick={() => sendNotification('reminder')} className="flex items-center gap-4 p-5 bg-stone-50 rounded-xl border border-stone-200 hover:border-stone-400 transition-all group">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-stone-800">D-Day 리마인더</p>
                  <p className="text-sm text-stone-500">결혼식 날짜 안내 발송</p>
                </div>
              </button>
            </div>
            <div className="bg-stone-50 rounded-xl p-5 border border-stone-200">
              <div className="flex items-start gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-stone-500 mt-0.5" />
                <p className="font-semibold text-stone-800">커스텀 메시지</p>
              </div>
              <textarea value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} placeholder="신랑/신부에게 보낼 메시지를 입력하세요..." rows={3} className="w-full p-4 border border-stone-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stone-300" />
              <button onClick={() => sendNotification('custom')} disabled={!customMessage.trim()} className="mt-3 px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                커스텀 메시지 발송
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link to={`/admin/weddings/${id}/rsvp`} className="bg-white rounded-xl p-5 border border-stone-200 hover:border-stone-400 transition-all group">
              <p className="font-semibold text-stone-800">📋 RSVP 관리</p>
              <p className="text-sm text-stone-500 mt-1">참석 응답 확인 및 관리</p>
            </Link>
            <Link to={`/admin/weddings/${id}/guestbook`} className="bg-white rounded-xl p-5 border border-stone-200 hover:border-stone-400 transition-all group">
              <p className="font-semibold text-stone-800">💌 방명록 관리</p>
              <p className="text-sm text-stone-500 mt-1">방명록 메시지 확인</p>
            </Link>
          </div>
        </div>
      )}

      {tab === 'basic' && (
        <div className="space-y-6">
          <Section title="테마">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEMES.map(theme => (
                <button key={theme.id} onClick={() => updateField("theme", theme.id)} className={`p-4 rounded-xl border-2 text-left transition-all ${wedding.theme === theme.id ? "border-stone-800 bg-stone-50" : "border-stone-200 hover:border-stone-400"}`}>
                  <p className="font-medium text-stone-800">{theme.name}</p>
                  <p className="text-xs text-stone-500 mt-1">{theme.desc}</p>
                </button>
              ))}
            </div>
            {wedding.theme === 'SENIOR_SIMPLE' && (
              <div className="mt-6 pt-6 border-t border-stone-200">
                <p className="text-sm font-medium text-stone-700 mb-4">테마 색상</p>
                <div className="flex flex-wrap gap-3">
                  {SENIOR_COLORS.map((color) => (
                    <button key={color.value} onClick={() => updateField('themeColor', color.value)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${wedding.themeColor === color.value ? 'border-stone-800 bg-stone-50' : 'border-stone-200'}`}>
                      <div className="w-10 h-10 rounded-full shadow-inner" style={{ backgroundColor: color.value }} />
                      <span className="text-xs font-medium text-stone-600">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Section>
          <Section title="신랑 정보">
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="이름" value={wedding.groomName} onChange={v => updateField('groomName', v)} />
              <Input label="영문 이름" value={wedding.groomNameEn} onChange={v => updateField('groomNameEn', v)} />
              <Input label="연락처" value={wedding.groomPhone} onChange={v => updateField('groomPhone', v)} />
            </div>
          </Section>
          <Section title="신부 정보">
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="이름" value={wedding.brideName} onChange={v => updateField('brideName', v)} />
              <Input label="영문 이름" value={wedding.brideNameEn} onChange={v => updateField('brideNameEn', v)} />
              <Input label="연락처" value={wedding.bridePhone} onChange={v => updateField('bridePhone', v)} />
            </div>
          </Section>
          <Section title="부모님 정보">
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input type="checkbox" checked={wedding.showParents || false} onChange={(e) => updateField('showParents', e.target.checked)} className="w-5 h-5 rounded" />
              <span className="text-stone-600">부모님 성함 표시</span>
            </label>
            {wedding.showParents && (
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-stone-600">신랑측</p>
                  <Input label="아버지 성함" value={wedding.groomFatherName} onChange={v => updateField('groomFatherName', v)} />
                  <Input label="어머니 성함" value={wedding.groomMotherName} onChange={v => updateField('groomMotherName', v)} />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-stone-600">신부측</p>
                  <Input label="아버지 성함" value={wedding.brideFatherName} onChange={v => updateField('brideFatherName', v)} />
                  <Input label="어머니 성함" value={wedding.brideMotherName} onChange={v => updateField('brideMotherName', v)} />
                </div>
              </div>
            )}
          </Section>
        </div>
      )}

      {tab === 'greeting' && (
        <div className="space-y-6">
          <Section title="인사말">
            <Input label="인사말 제목" value={wedding.greetingTitle} onChange={v => updateField('greetingTitle', v)} />
            <textarea placeholder="인사말 내용" value={wedding.greeting || ''} onChange={(e) => updateField('greeting', e.target.value)} rows={6} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none mt-4" />
          <AiWritingAssistant
              fieldType="greeting"
              context={{
                groomName: wedding.groomName,
                brideName: wedding.brideName,
                weddingDate: wedding.weddingDate,
                venue: wedding.venue,
              }}
              onSelect={(value) => updateField('greeting', value)}
            />
            </Section>
          <Section title="마무리 인사">
            <textarea placeholder="마무리 메시지 (선택)" value={wedding.closingMessage || ''} onChange={(e) => updateField('closingMessage', e.target.value)} rows={3} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
              <AiWritingAssistant
              fieldType="closingMessage"
              context={{
                groomName: wedding.groomName,
                brideName: wedding.brideName,
              }}
              onSelect={(value) => updateField('closingMessage', value)}
            />
          </Section>
        </div>
      )}

      {tab === 'venue' && (
        <div className="space-y-6">
          <Section title="예식 일시">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-stone-600 mb-2">예식 날짜</label>
                <input type="date" value={wedding.weddingDate?.split('T')[0] || ''} onChange={(e) => updateField('weddingDate', e.target.value)} className="w-full px-4 py-3 border border-stone-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm text-stone-600 mb-2">예식 시간</label>
                <input type="time" value={wedding.weddingTime || ''} onChange={(e) => updateField('weddingTime', e.target.value)} className="w-full px-4 py-3 border border-stone-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm text-stone-600 mb-2">청첩장 만료일</label>
                <input type="date" value={wedding.expiresAt?.split('T')[0] || ''} onChange={(e) => updateField('expiresAt', e.target.value)} className="w-full px-4 py-3 border border-stone-200 rounded-xl" />
                <p className="text-xs text-stone-400 mt-1">비워두면 기본 1년</p>
              </div>
            </div>
          </Section>
          <Section title="예식장 정보">
            <div className="space-y-4">
              <Input label="예식장명" value={wedding.venue} onChange={v => updateField('venue', v)} />
              <Input label="홀 이름" value={wedding.venueHall} onChange={v => updateField('venueHall', v)} />
              <Input label="주소" value={wedding.venueAddress} onChange={v => updateField('venueAddress', v)} />
              <Input label="예식장 연락처" value={wedding.venuePhone} onChange={v => updateField('venuePhone', v)} />
            </div>
          </Section>
          <Section title="지도 링크">
            <div className="space-y-4">
              <Input label="네이버 지도" value={wedding.venueNaverMap} onChange={v => updateField('venueNaverMap', v)} placeholder="https://naver.me/..." />
              <Input label="카카오맵" value={wedding.venueKakaoMap} onChange={v => updateField('venueKakaoMap', v)} placeholder="https://kko.to/..." />
              <Input label="티맵" value={wedding.venueTmap} onChange={v => updateField('venueTmap', v)} placeholder="https://..." />
            </div>
          </Section>
        </div>
      )}

      {tab === 'account' && (
        <div className="space-y-6">
          <Section title="신랑 계좌">
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="은행" value={wedding.groomBank} onChange={v => updateField('groomBank', v)} />
              <Input label="계좌번호" value={wedding.groomAccount} onChange={v => updateField('groomAccount', v)} />
              <Input label="예금주" value={wedding.groomAccountHolder} onChange={v => updateField('groomAccountHolder', v)} />
            </div>
          </Section>
          <Section title="신부 계좌">
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="은행" value={wedding.brideBank} onChange={v => updateField('brideBank', v)} />
              <Input label="계좌번호" value={wedding.brideAccount} onChange={v => updateField('brideAccount', v)} />
              <Input label="예금주" value={wedding.brideAccountHolder} onChange={v => updateField('brideAccountHolder', v)} />
            </div>
          </Section>
          <Section title="신랑측 부모님 계좌">
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <Input label="아버지 은행" value={wedding.groomFatherBank} onChange={v => updateField('groomFatherBank', v)} />
                <Input label="계좌번호" value={wedding.groomFatherAccount} onChange={v => updateField('groomFatherAccount', v)} />
                <Input label="예금주" value={wedding.groomFatherAccountHolder} onChange={v => updateField('groomFatherAccountHolder', v)} />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Input label="어머니 은행" value={wedding.groomMotherBank} onChange={v => updateField('groomMotherBank', v)} />
                <Input label="계좌번호" value={wedding.groomMotherAccount} onChange={v => updateField('groomMotherAccount', v)} />
                <Input label="예금주" value={wedding.groomMotherAccountHolder} onChange={v => updateField('groomMotherAccountHolder', v)} />
              </div>
            </div>
          </Section>
          <Section title="신부측 부모님 계좌">
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <Input label="아버지 은행" value={wedding.brideFatherBank} onChange={v => updateField('brideFatherBank', v)} />
                <Input label="계좌번호" value={wedding.brideFatherAccount} onChange={v => updateField('brideFatherAccount', v)} />
                <Input label="예금주" value={wedding.brideFatherAccountHolder} onChange={v => updateField('brideFatherAccountHolder', v)} />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Input label="어머니 은행" value={wedding.brideMotherBank} onChange={v => updateField('brideMotherBank', v)} />
                <Input label="계좌번호" value={wedding.brideMotherAccount} onChange={v => updateField('brideMotherAccount', v)} />
                <Input label="예금주" value={wedding.brideMotherAccountHolder} onChange={v => updateField('brideMotherAccountHolder', v)} />
              </div>
            </div>
          </Section>
          <Section title="간편 송금">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="토스 송금 링크" value={wedding.tossLink} onChange={v => updateField('tossLink', v)} placeholder="https://toss.me/..." />
              <Input label="카카오페이 링크" value={wedding.kakaoPayLink} onChange={v => updateField('kakaoPayLink', v)} placeholder="https://qr.kakaopay.com/..." />
            </div>
          </Section>
        </div>
      )}

      {tab === 'media' && (
        <Section title="대표 이미지/영상">
          <p className="text-sm text-stone-500 mb-4">청첩장 상단에 표시될 대표 이미지나 영상을 설정하세요</p>
          {wedding.heroMedia ? (
            <div className="relative">
              {wedding.heroMediaType === 'VIDEO' ? (
                isYouTubeUrl(wedding.heroMedia) ? (
                  <iframe src={getYouTubeEmbedUrl(wedding.heroMedia)} className="w-full h-64 rounded-xl" allowFullScreen />
                ) : (
                  <video src={wedding.heroMedia} controls className="w-full h-64 object-cover rounded-xl" />
                )
              ) : (
                <img src={wedding.heroMedia} alt="Hero" className="w-full h-64 object-cover rounded-xl" />
              )}
              <button onClick={() => { updateField('heroMedia', ''); updateField('heroMediaType', 'IMAGE'); }} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-stone-400">
                  <Image className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-stone-500 text-sm">이미지 업로드</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'heroMedia', 'image')} className="hidden" />
                </label>
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-stone-400">
                  <Film className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-stone-500 text-sm">영상 업로드</span>
                  <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'heroMedia', 'video')} className="hidden" />
                </label>
              </div>
              <div className="text-center text-stone-400 text-sm">또는</div>
              <Input label="YouTube URL" value="" onChange={v => { updateField('heroMedia', v); updateField('heroMediaType', 'VIDEO'); }} placeholder="https://youtube.com/watch?v=..." />
            </div>
          )}
          {uploading && (<div className="mt-4"><div className="flex items-center gap-3"><div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden"><div className="h-full bg-stone-800 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} /></div><span className="text-xs text-stone-500 w-10 text-right">{uploadProgress}%</span></div></div>)}
        </Section>
      )}

      {tab === 'gallery' && (
        <Section title="갤러리">
          <p className="text-sm text-stone-500 mb-4">웨딩 사진이나 영상을 여러 장 추가할 수 있어요</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            {galleries.map((item) => (
              <div key={item.id} className="relative aspect-square">
                {item.mediaType === 'VIDEO' ? (
                  <video src={item.mediaUrl} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <img src={item.mediaUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                )}
                <button onClick={() => handleDeleteGallery(item.id)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70">
                  <X className="w-3 h-3" />
                </button>
                {item.mediaType === 'VIDEO' && <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">영상</div>}
              </div>
            ))}
            <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-stone-400">
              <Plus className="w-8 h-8 text-stone-400 mb-2" />
              <span className="text-stone-500 text-sm">추가</span>
              <input type="file" accept="image/*,video/*" multiple onChange={handleGalleryUpload} className="hidden" />
            </label>
          </div>
          {uploading && (<div className="mt-4"><div className="flex items-center gap-3"><div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden"><div className="h-full bg-stone-800 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} /></div><span className="text-xs text-stone-500 w-10 text-right">{uploadProgress}%</span></div></div>)}
          <p className="text-xs text-stone-400 mt-2">* 이미지와 영상을 함께 업로드할 수 있어요</p>
        </Section>
      )}

      {tab === 'video' && (
        <Section title="러브스토리 영상">
          <p className="text-sm text-stone-500 mb-4">두 분의 이야기를 담은 영상을 추가하세요</p>
          {wedding.loveStoryVideo ? (
            <div className="relative">
              {isYouTubeUrl(wedding.loveStoryVideo) ? (
                <iframe src={getYouTubeEmbedUrl(wedding.loveStoryVideo)} className="w-full aspect-video rounded-xl" allowFullScreen />
              ) : (
                <video src={wedding.loveStoryVideo} controls className="w-full rounded-xl" />
              )}
              <button onClick={() => updateField('loveStoryVideo', '')} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-stone-400">
                <Film className="w-8 h-8 text-stone-400 mb-2" />
                <span className="text-stone-500 text-sm">영상 파일 업로드</span>
                <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'loveStoryVideo', 'video')} className="hidden" />
              </label>
              <div className="text-center text-stone-400 text-sm">또는</div>
              <Input label="YouTube URL" value={wedding.loveStoryVideo} onChange={v => updateField('loveStoryVideo', v)} placeholder="https://youtube.com/watch?v=..." />
            </div>
          )}
          {uploading && (<div className="mt-4"><div className="flex items-center gap-3"><div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden"><div className="h-full bg-stone-800 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} /></div><span className="text-xs text-stone-500 w-10 text-right">{uploadProgress}%</span></div></div>)}
        </Section>
      )}

      {tab === 'music' && (
        <Section title="배경음악">
          <p className="text-sm text-stone-500 mb-4">청첩장에 배경음악을 설정할 수 있어요</p>
          {wedding.bgMusicUrl ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
                <div className="w-12 h-12 bg-stone-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Music className="w-6 h-6 text-stone-500" />
                </div>
                <div className="flex-1 min-w-0">
                  {isYouTubeUrl(wedding.bgMusicUrl) ? (
                    <div>
                      <p className="text-sm text-stone-600 mb-2">YouTube 음악</p>
                      <p className="text-xs text-stone-400 truncate">{wedding.bgMusicUrl}</p>
                      <p className="text-xs text-amber-600 mt-2">⚠️ YouTube 음악은 청첩장에서 영상으로 표시됩니다</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-stone-600 truncate">{wedding.bgMusicUrl.split('/').pop()}</p>
                      <audio src={wedding.bgMusicUrl} controls className="w-full mt-2" />
                    </>
                  )}
                </div>
                <button onClick={() => updateField('bgMusicUrl', '')} className="p-2 text-stone-400 hover:text-stone-600 flex-shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-stone-400">
                <Music className="w-8 h-8 text-stone-400 mb-2" />
                <span className="text-stone-500 text-sm">음악 파일 업로드</span>
                <span className="text-stone-400 text-xs mt-1">MP3, WAV 등</span>
                <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'bgMusicUrl', 'audio')} className="hidden" />
              </label>
              <div className="text-center text-stone-400 text-sm">또는</div>
              <Input label="음악 URL (직접 재생 가능한 URL)" value={wedding.bgMusicUrl} onChange={v => updateField('bgMusicUrl', v)} placeholder="https://example.com/music.mp3" />
              <p className="text-xs text-amber-600">⚠️ YouTube 링크는 배경음악으로 사용할 수 없어요. MP3 파일을 업로드해주세요.</p>
            </div>
          )}
          <label className="flex items-center gap-3 mt-6 cursor-pointer">
            <input type="checkbox" checked={wedding.bgMusicAutoPlay || false} onChange={(e) => updateField('bgMusicAutoPlay', e.target.checked)} className="w-5 h-5 rounded" />
            <span className="text-stone-600">자동 재생</span>
          </label>
          <p className="text-xs text-stone-400 mt-2">* 모바일에서는 사용자 상호작용 후 자동재생이 가능해요</p>
          {uploading && (<div className="mt-4"><div className="flex items-center gap-3"><div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden"><div className="h-full bg-stone-800 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} /></div><span className="text-xs text-stone-500 w-10 text-right">{uploadProgress}%</span></div></div>)}
        </Section>
      )}

      {tab === 'ai' && (
        <div className="space-y-6">
          <div className="bg-stone-800 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">AI 웨딩 컨시어지</h2>
                <p className="text-sm opacity-80">하객과 대화하는 특별한 청첩장</p>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={wedding.aiEnabled || false} onChange={(e) => updateField('aiEnabled', e.target.checked)} className="w-6 h-6 rounded bg-white/20 border-0" />
              <span className="font-medium">AI 기능 활성화</span>
            </label>
          </div>

          {wedding.aiEnabled && (
            <>
              <Link to={`/admin/weddings/${id}/ai-report`} className="block p-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl text-white hover:opacity-90">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI 리포트 보기</p>
                    <p className="text-sm opacity-80">하객들이 AI에게 몰래 물어본 질문들</p>
                  </div>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>

              <Section title="AI 이름 설정">
                <Input label="AI 이름" value={wedding.aiName} onChange={v => updateField('aiName', v)} placeholder="자비스, 알프레드, 댕댕이..." />
              </Section>

              <Section title="AI 인터랙션 스타일">
                <div className="space-y-3">
                  {[
                    { value: 'classic', name: '클래식 모드', desc: '정중하고 친절한 안내. 어르신 하객이 많은 예식에 추천' },
                    { value: 'variety', name: '버라이어티 모드', desc: '신랑/신부 선택 + 비밀 폭로전. 힙한 결혼식에 추천' },
                    { value: 'active', name: '액티브 모드', desc: '스크롤에 따라 AI가 먼저 말 걸어요' },
                  ].map(mode => (
                    <label key={mode.value} className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer hover:bg-stone-50 ${wedding.aiMode === mode.value || (!wedding.aiMode && mode.value === 'classic') ? 'border-stone-800 bg-stone-50' : 'border-stone-200'}`}>
                      <input type="radio" name="aiMode" value={mode.value} checked={wedding.aiMode === mode.value || (!wedding.aiMode && mode.value === 'classic')} onChange={(e) => updateField('aiMode', e.target.value)} className="mt-1" />
                      <div>
                        <p className="font-medium text-stone-800">{mode.name}</p>
                        <p className="text-sm text-stone-500">{mode.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-sm text-stone-600 mb-2">세부 성격 스타일</label>
                  <select value={wedding.aiToneStyle || 'default'} onChange={(e) => updateField('aiToneStyle', e.target.value)} className="w-full px-4 py-3 border border-stone-200 rounded-xl bg-white">
                    {(wedding.aiMode === 'classic' || !wedding.aiMode) && (
                      <>
                        <option value="default">정석 호텔 지배인 - 품격있고 예의바름</option>
                        <option value="romantic">감성 시인 - 문학적이고 부드러움</option>
                        <option value="smart">똑똒한 비서 - 명료하고 또박또박</option>
                      </>
                    )}
                    {wedding.aiMode === 'variety' && (
                      <>
                        <option value="bestie">10년지기 찐친 - 살짝 선넘는 TMI</option>
                        <option value="fanclub">주접킹 팬클럽 회장 - 하이텐션 칭찬</option>
                        <option value="siri">시크한 AI - 무미건조한데 웃김</option>
                      </>
                    )}
                    {wedding.aiMode === 'active' && (
                      <>
                        <option value="planner">열정적인 웨딩 플래너 - 꼼꼼하게 리드</option>
                        <option value="sheriff">동네 보안관 - 듬직한 편의 안내</option>
                        <option value="reporter">라이브 리포터 - 생동감 넘치는 중계</option>
                      </>
                    )}
                  </select>
                </div>
              </Section>

              <Section title="신랑신부 성격·말투">
                <p className="text-sm text-stone-500 mb-4">AI가 두 분의 말투를 흉내낼 수 있도록 알려주세요</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">신랑 {wedding.groomName}의 말투</label>
                    <textarea value={wedding.aiGroomPersonality || ''} onChange={(e) => updateField('aiGroomPersonality', e.target.value)} placeholder="예: 유머러스하고 장난기 많음" rows={3} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                      <AiWritingAssistant
                        fieldType="groomPersonality"
                        context={{ groomName: wedding.groomName }}
                        onSelect={(value) => updateField('aiGroomPersonality', value)}
                      />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">신부 {wedding.brideName}의 말투</label>
                    <textarea value={wedding.aiBridePersonality || ''} onChange={(e) => updateField('aiBridePersonality', e.target.value)} placeholder="예: 다정하고 따뜻한 성격" rows={3} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                      <AiWritingAssistant
                        fieldType="bridePersonality"
                        context={{ brideName: wedding.brideName }}
                        onSelect={(value) => updateField('aiBridePersonality', value)}
                      />
                  </div>
                </div>
              </Section>

              <Section title="비밀 에피소드">
                <p className="text-sm text-stone-500 mb-4">하객들이 물어보면 AI가 재밌게 풀어줄 비밀 이야기들!</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">신랑의 비밀</label>
                    <textarea value={wedding.aiSecrets?.groomSecret || ''} onChange={(e) => updateAiSecrets('groomSecret', e.target.value)} placeholder="예: 사실 프로포즈 3번 실패함" rows={2} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                      <AiWritingAssistant
                        fieldType="secret"
                        context={{ groomName: wedding.groomName, brideName: wedding.brideName, secretType: '신랑의 비밀' }}
                        onSelect={(value) => updateAiSecrets('groomSecret', value)}
                      />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">신부의 비밀</label>
                    <textarea value={wedding.aiSecrets?.brideSecret || ''} onChange={(e) => updateAiSecrets('brideSecret', e.target.value)} placeholder="예: 첫만남 때 신랑 별로였음" rows={2} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                      <AiWritingAssistant
                        fieldType="secret"
                        context={{ groomName: wedding.groomName, brideName: wedding.brideName, secretType: '신부의 비밀' }}
                        onSelect={(value) => updateAiSecrets('brideSecret', value)}
                      />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">첫만남 에피소드</label>
                    <textarea value={wedding.aiSecrets?.firstMeetStory || ''} onChange={(e) => updateAiSecrets('firstMeetStory', e.target.value)} placeholder="어디서 어떻게 처음 만났는지" rows={2} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                      <AiWritingAssistant
                        fieldType="secret"
                        context={{ groomName: wedding.groomName, brideName: wedding.brideName, secretType: '첫만남 에피소드' }}
                        onSelect={(value) => updateAiSecrets('firstMeetStory', value)}
                      />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">프로포즈 비하인드</label>
                    <textarea value={wedding.aiSecrets?.proposeStory || ''} onChange={(e) => updateAiSecrets('proposeStory', e.target.value)} placeholder="프로포즈 장소와 에피소드" rows={2} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                      <AiWritingAssistant
                        fieldType="secret"
                        context={{ groomName: wedding.groomName, brideName: wedding.brideName, secretType: '프로포즈 비하인드' }}
                        onSelect={(value) => updateAiSecrets('proposeStory', value)}
                      />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">웃긴 에피소드</label>
                    <textarea value={wedding.aiSecrets?.funnyStory || ''} onChange={(e) => updateAiSecrets('funnyStory', e.target.value)} placeholder="둘만 아는 재미있는 이야기" rows={2} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                      <AiWritingAssistant
                        fieldType="secret"
                        context={{ groomName: wedding.groomName, brideName: wedding.brideName, secretType: '웃긴 에피소드' }}
                        onSelect={(value) => updateAiSecrets('funnyStory', value)}
                      />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">서로의 첫인상</label>
                    <textarea value={wedding.aiSecrets?.firstImpression || ''} onChange={(e) => updateAiSecrets('firstImpression', e.target.value)} placeholder="서로의 첫인상과 지금 생각" rows={2} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                      <AiWritingAssistant
                        fieldType="secret"
                        context={{ groomName: wedding.groomName, brideName: wedding.brideName, secretType: '서로의 첫인상' }}
                        onSelect={(value) => updateAiSecrets('firstImpression', value)}
                      />
                  </div>
                </div>
              </Section>

              <Section title="뷔페·메뉴 정보">
                <p className="text-sm text-stone-500 mb-4">하객들에게 뭐 먹을지 추천해줄 수 있어요!</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">메뉴 리스트</label>
                    <textarea value={wedding.aiMenuInfo?.menuList || ''} onChange={(e) => updateAiMenu('menuList', e.target.value)} placeholder="예: 한우불고기, 해물찜, 훈제연어, 초밥 등" rows={3} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">추천 메뉴</label>
                    <textarea value={wedding.aiMenuInfo?.recommendation || ''} onChange={(e) => updateAiMenu('recommendation', e.target.value)} placeholder="추천 메뉴가 있다면 알려주세요" rows={2} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">특이사항</label>
                    <textarea value={wedding.aiMenuInfo?.specialNote || ''} onChange={(e) => updateAiMenu('specialNote', e.target.value)} placeholder="특별히 알려드리고 싶은 점" rows={2} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                  </div>
                </div>
              </Section>

              <Section title="교통·주차 정보">
                <p className="text-sm text-stone-500 mb-4">정확한 교통 정보를 입력하면 AI가 친절하게 안내해줘요</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">주차 안내</label>
                    <textarea value={wedding.aiTransportInfo?.parking || ''} onChange={(e) => updateAiTransport('parking', e.target.value)} placeholder="주차 가능 대수, 요금, 대안 등" rows={2} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">대중교통</label>
                    <textarea value={wedding.aiTransportInfo?.publicTransport || ''} onChange={(e) => updateAiTransport('publicTransport', e.target.value)} placeholder="예: 2호선 강남역 3번 출구에서 도보 10분" rows={2} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">택시/차량</label>
                    <textarea value={wedding.aiTransportInfo?.taxi || ''} onChange={(e) => updateAiTransport('taxi', e.target.value)} placeholder="예: 강남역에서 택시 약 15분" rows={2} className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none" />
                  </div>
                </div>
              </Section>

              <Section title="커스텀 Q&A">
                <p className="text-sm text-stone-500 mb-4">자주 받는 질문과 답변을 미리 등록해두세요</p>
                <div className="space-y-4">
                  {(wedding.aiCustomQna || []).map((qna: any, index: number) => (
                    <div key={index} className="p-4 bg-stone-50 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-stone-500">Q&A #{index + 1}</span>
                        <button onClick={() => removeCustomQna(index)} className="text-red-500 hover:text-red-600"><X className="w-4 h-4" /></button>
                      </div>
                      <input type="text" value={qna.question} onChange={(e) => updateCustomQna(index, 'question', e.target.value)} placeholder="질문 예: 축의금 얼마가 적당해?" className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm" />
                      <textarea value={qna.answer} onChange={(e) => updateCustomQna(index, 'answer', e.target.value)} placeholder="답변 예: 마음이 중요합니다" rows={2} className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm resize-none" />
                    </div>
                  ))}
                  <button onClick={addCustomQna} className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 hover:border-stone-400 hover:text-stone-600 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Q&A 추가
                  </button>
                </div>
              </Section>
            </>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-6">
          <Section title="공개 설정">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={wedding.isPublished || false} onChange={(e) => updateField('isPublished', e.target.checked)} className="w-5 h-5 rounded" />
              <span className="text-stone-600">청첩장 공개</span>
            </label>
            <p className="text-xs text-stone-400 mt-2">* 공개하면 누구나 링크로 볼 수 있어요</p>
          </Section>
          <Section title="디데이 표시">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={wedding.showDday || false} onChange={(e) => updateField('showDday', e.target.checked)} className="w-5 h-5 rounded" />
              <span className="text-stone-600">D-Day 카운트 표시</span>
            </label>
          </Section>
          <Section title="글씨 색상">
            <p className="text-sm text-stone-500 mb-4">헤더 영역의 글씨 색상을 선택하세요</p>
            <div className="flex flex-wrap gap-3">
              {[
                { value: '#ffffff', label: '흰색' },
                { value: '#1c1917', label: '검정' },
                { value: '#78716c', label: '회색' },
                { value: '#a16207', label: '골드' },
                { value: '#991b1b', label: '와인' },
                { value: '#1e3a5f', label: '네이비' },
              ].map(color => (
                <button key={color.value} onClick={() => updateField('textColor', color.value)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${wedding.textColor === color.value ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-400'}`}>
                  <div className="w-5 h-5 rounded-full border border-stone-300" style={{ backgroundColor: color.value }} />
                  <span className="text-sm text-stone-600">{color.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm text-stone-600 mb-2">직접 입력 (HEX)</label>
              <input type="text" value={wedding.textColor || '#ffffff'} onChange={(e) => updateField('textColor', e.target.value)} placeholder="#ffffff" className="w-32 px-4 py-2 border border-stone-200 rounded-xl text-sm" />
            </div>
          </Section>
          <Section title="청첩장 주소">
            <div className="space-y-2">
              <p className="text-stone-500 text-sm break-all">{window.location.origin}/w/</p>
              <input type="text" value={wedding.slug || ''} onChange={(e) => updateField('slug', e.target.value)} className="w-full px-4 py-3 border border-stone-200 rounded-xl" />
            </div>
            <p className="text-xs text-stone-400 mt-2">* 영문, 숫자, 하이픈만 사용 가능해요</p>
          </Section>
        </div>
      )}

      
      {tab === 'pair' && (
        <div className="space-y-6">
          <PairManager weddingId={wedding.id} groomName={wedding.groomName} brideName={wedding.brideName} heroMedia={wedding.heroMedia} />
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <h2 className="font-semibold text-lg text-stone-800 mb-4">공동 편집 안내</h2>
            <div className="space-y-3 text-[14px] text-stone-500 leading-relaxed">
              <p>초대 코드를 생성하고 예비 배우자에게 공유하면, 같은 청첩장을 함께 수정할 수 있어요.</p>
              <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                <p className="text-stone-700 font-medium">공동 편집자 권한</p>
                <p>• 청첩장 내용 수정, 갤러리 추가/삭제</p>
                <p>• RSVP, 방명록 확인</p>
                <p>• AI 설정 변경</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                <p className="text-amber-700 font-medium">소유자만 가능</p>
                <p>• 청첩장 삭제</p>
                <p>• 공동 편집자 연결 해제</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'rsvp' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-stone-800">참석 여부 응답</h3>
            <span className="text-sm text-stone-500">총 {rsvpList.length}명</span>
          </div>
          {rsvpLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
            </div>
          ) : rsvpList.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-2xl">
              <p className="text-stone-500">아직 응답이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{rsvpList.filter(r => r.attending === true).length}</p>
                  <p className="text-sm text-emerald-600">참석</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{rsvpList.filter(r => r.attending === false).length}</p>
                  <p className="text-sm text-red-600">불참</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-stone-700">{rsvpList.reduce((sum, r) => sum + (r.guestCount || 1), 0)}</p>
                  <p className="text-sm text-stone-600">총 인원</p>
                </div>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">이름</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">참석</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">인원</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">측</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">메시지</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {rsvpList.map((rsvp: any) => (
                      <tr key={rsvp.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3 text-stone-800">{rsvp.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${rsvp.attending ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {rsvp.attending ? '참석' : '불참'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-stone-600">{rsvp.guestCount || 1}명</td>
                        <td className="px-4 py-3 text-stone-600">{rsvp.side === 'groom' || rsvp.side === 'GROOM' ? '신랑' : '신부'}</td>
                        <td className="px-4 py-3 text-stone-500 text-sm truncate max-w-[200px]">{rsvp.message || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-stone-200 rounded-2xl p-6">
      <h2 className="font-semibold text-lg text-stone-800 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: any; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm text-stone-600 mb-2">{label}</label>
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200" />
    </div>
  );
}
