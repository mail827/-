import { useState, useEffect, useRef } from 'react';
import BoothCreditPanel from '../components/BoothCreditPanel';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { at } from '../utils/appI18n';
import { useLocaleStore } from '../store/useLocaleStore';
import { ArrowLeft, Save, Eye, X, Plus, Music, Film, Image, Sparkles, Loader2, QrCode, FileText } from 'lucide-react';
import AiWritingAssistant from '../components/AiWritingAssistant';
import PairManager from '../components/admin/PairManager';
import QRCardModal from '../components/QRCardModal';
import PaperInvitationModal from '../components/PaperInvitationModal';
import ThemePreviewModal from '../components/ThemePreviewModal';
import SectionOrderEditor from '../components/SectionOrderEditor';
import ImageCropModal from '../components/ImageCropModal';
import AiSnapStudio from '../components/AiSnapStudio';
import { Play, Pause } from 'lucide-react';
import KakaoAddressInput from '../components/KakaoAddressInput';
import { themeConfigs } from './wedding/themes/shared/themeConfig';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'wedding_guide';

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
  { id: 'LUNA_HALFMOON', name: 'Luna Halfmoon', desc: '순백의 고요한 물결' },
  { id: 'PEARL_DRIFT', name: 'Pearl Drift', desc: '심해 속 떠다니는 진주' },
  { id: 'NIGHT_SEA', name: '밤바다', desc: '별이 쏟아지는 밤, 깊은 바다' },
  { id: 'AQUA_GLOBE', name: '아쿠아 글로브', desc: '청량한 수중 금붕어 세계' },
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

interface UploadProgress {
  [key: string]: number;
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

function validateFile(file: File, type: 'image' | 'video' | 'audio'): string | null {
  const limits = {
    image: { maxSize: 20 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },
    video: { maxSize: 200 * 1024 * 1024, types: ['video/mp4', 'video/quicktime', 'video/webm'] },
    audio: { maxSize: 20 * 1024 * 1024, types: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'] },
  };
  const limit = limits[type];
  if (file.size > limit.maxSize) {
    return `파일 크기가 너무 커요 (최대 ${limit.maxSize / 1024 / 1024}MB)`;
  }
  if (!limit.types.some(t => file.type.startsWith(t.split('/')[0]))) {
    return '지원하지 않는 파일 형식이에요';
  }
  return null;
}

export default function EditWedding() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { locale } = useLocaleStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showPaper, setShowPaper] = useState(false);
  const [showThemePreview, setShowThemePreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [wedding, setWedding] = useState<any>(null);
  const [tab, setTab] = useState('basic');
  const [rsvpList, setRsvpList] = useState<any[]>([]);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [bgMusics, setBgMusics] = useState<any[]>([]);
  const [previewMusicId, setPreviewMusicId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/bg-music/public`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setBgMusics(d); })
      .catch(() => {});
  }, []);

  const [currentCropFile, setCurrentCropFile] = useState<File | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const uploadToCloudinary = (
    file: File,
    progressKey: string,
    onSuccess: (url: string) => void,
    onError: (err: string) => void
  ) => {
    const resourceType = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'video' : 'image';
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'wedding');

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(prev => ({ ...prev, [progressKey]: percent }));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        onSuccess(response.secure_url);
      } else {
        onError('업로드 실패');
      }
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[progressKey];
        return next;
      });
      xhrRef.current = null;
    };

    xhr.onerror = () => {
      onError('네트워크 오류');
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[progressKey];
        return next;
      });
      xhrRef.current = null;
    };

    xhr.open('POST', url);
    xhr.send(formData);
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
      setUploadProgress({});
      setUploading(false);
    }
  };

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

  useEffect(() => { if (tab === "rsvp") fetchRsvp(); }, [tab]);
  
  useEffect(() => {
    fetchWedding();
  }, [id]);

  const fetchWedding = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/weddings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWedding({
          ...data,
          aiSecrets: data.aiSecrets || {},
          aiMenuInfo: data.aiMenuInfo || {},
          aiTransportInfo: data.aiTransportInfo || {},
          aiCustomQna: data.aiCustomQna || [],
        });
        setGalleries(data.galleries || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/weddings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(wedding)
      });
      if (res.ok) {
        alert(at('savedSuccess', locale));
        if (wedding.showLocaleSwitch) {
          fetch(`${import.meta.env.VITE_API_URL}/weddings/${id}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          }).then(r => r.json()).then(d => {
            if (d.translationsEn) setWedding((prev: any) => ({ ...prev, translationsEn: d.translationsEn }));
          }).catch(() => {});
        }
      }
    } catch (e) {
      alert(at('saveFailed', locale));
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

    const error = validateFile(file, type);
    if (error) {
      alert(error);
      return;
    }

    setUploading(true);
    uploadToCloudinary(
      file,
      field,
      (url) => {
        updateField(field, url);
        if (field === 'heroMedia') {
          updateField('heroMediaType', type === 'video' ? 'VIDEO' : 'IMAGE');
        }
        setUploading(false);
      },
      (err) => {
        alert(err);
        setUploading(false);
      }
    );
  };

  const uploadSingleGallery = async (fileOrBlob: File | Blob, index: number) => {
    const token = localStorage.getItem('token');
    const actualFile = fileOrBlob instanceof File ? fileOrBlob : new File([fileOrBlob], 'cropped.jpg', { type: 'image/jpeg' });
    return new Promise<void>((resolve) => {
      uploadToCloudinary(
        actualFile,
        `gallery-${index}`,
        async (url) => {
          try {
            const galleryRes = await fetch(`${import.meta.env.VITE_API_URL}/weddings/${id}/gallery`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                mediaUrl: url,
                mediaType: 'IMAGE',
                order: Date.now() + index
              })
            });
            if (galleryRes.ok) {
              const newItem = await galleryRes.json();
              setGalleries(prev => [...prev, newItem]);
            }
          } catch (e) {
            console.error('Gallery save error:', e);
          }
          resolve();
        },
        (err) => { console.error(err); resolve(); }
      );
    });
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles: File[] = [];
    const videoFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/');
      const type = isVideo ? 'video' : 'image';
      const error = validateFile(file, type);
      if (error) { console.error(`${file.name}: ${error}`); continue; }
      if (isVideo) videoFiles.push(file);
      else imageFiles.push(file);
    }

    if (videoFiles.length > 0) {
      setUploading(true);
      const token = localStorage.getItem('token');
      for (let i = 0; i < videoFiles.length; i++) {
        await new Promise<void>((resolve) => {
          uploadToCloudinary(
            videoFiles[i],
            `gallery-v${i}`,
            async (url) => {
              try {
                const galleryRes = await fetch(`${import.meta.env.VITE_API_URL}/weddings/${id}/gallery`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ mediaUrl: url, mediaType: 'VIDEO', order: Date.now() + i })
                });
                if (galleryRes.ok) {
                  const newItem = await galleryRes.json();
                  setGalleries(prev => [...prev, newItem]);
                }
              } catch (e) { console.error('Gallery save error:', e); }
              resolve();
            },
            (err) => { console.error(err); resolve(); }
          );
        });
      }
      setUploading(false);
    }

    if (imageFiles.length > 0) {
      if ((wedding.galleryRatio || '1:1') === 'original') {
        setUploading(true);
        for (let i = 0; i < imageFiles.length; i++) {
          await uploadSingleGallery(imageFiles[i], galleries.length + i);
        }
        setUploading(false);
      } else {
        setCropQueue(imageFiles.slice(1));
        setCurrentCropFile(imageFiles[0]);
      }
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    setUploading(true);
    await uploadSingleGallery(blob, galleries.length);
    setUploading(false);
    
    if (cropQueue.length > 0) {
      setCurrentCropFile(cropQueue[0]);
      setCropQueue(prev => prev.slice(1));
    } else {
      setCurrentCropFile(null);
    }
  };

  const handleCropCancel = () => {
    if (cropQueue.length > 0) {
      setCurrentCropFile(cropQueue[0]);
      setCropQueue(prev => prev.slice(1));
    } else {
      setCurrentCropFile(null);
    }
  };

  const handleDeleteGallery = async (galleryId: string) => {
    if (!confirm(at('deleteConfirm', locale))) return;
    
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
      alert(at('deleteFailed', locale));
    }
  };

  const UploadProgressBar = ({ progressKey }: { progressKey: string }) => {
    const progress = uploadProgress[progressKey];
    if (progress === undefined) return null;
    
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between text-sm text-stone-600 mb-1">
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {at('uploading', locale)}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-stone-800 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          onClick={cancelUpload}
          className="mt-2 text-sm text-red-500 hover:text-red-600"
        >
          업로드 취소
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fefefe]">
        <div className="w-10 h-10 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fefefe]">
        <p className="text-stone-500">{at('notFound', locale)}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'basic', name: at('tabBasic', locale) },
    { id: 'greeting', name: at('tabGreeting', locale) },
    { id: 'venue', name: at('tabVenue', locale) },
    { id: 'account', name: at('tabAccount', locale) },
    { id: 'media', name: at('tabMedia', locale) },
    { id: 'gallery', name: at('tabGallery', locale) },
    { id: 'video', name: at('tabVideo', locale) },
    { id: 'music', name: at('tabMusic', locale) },
    { id: 'ai', name: '🤖 AI', highlight: wedding.aiEnabled },
    { id: 'ai-snap', name: at('tabAiSnap', locale) },
    { id: 'sections', name: at('tabSections', locale) },
    { id: 'settings', name: at('tabSettings', locale) },
    { id: 'pair', name: at('tabPair', locale) },
    { id: 'rsvp', name: 'RSVP' },
  ];

  return (
    <div className="min-h-screen bg-[#fefefe]">
      <header className="border-b border-stone-200 sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-stone-600">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm hidden sm:block">{at('dashboard', locale)}</span>
          </button>
          <span className="font-serif text-lg text-stone-800">{at('editTitle', locale)}</span>
          <div className="flex gap-2">
            <button
              onClick={() => window.open(`/w/${wedding.slug}`, '_blank')}
              className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowQR(true)}
              className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg"
              title="인쇄용 QR 카드"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowPaper(true)}
              className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg"
              title="종이 청첩장"
            >
              <FileText className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? at('saving', locale) : at('save', locale)}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                tab === t.id 
                  ? t.id === 'ai' ? 'bg-stone-800 text-white' : 'bg-stone-800 text-white' 
                  : t.id === 'ai' && wedding.aiEnabled ? 'bg-stone-100 text-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 pb-8 space-y-6">
        {tab === 'basic' && (
          <>
            <Section title={at('sectionTheme', locale)}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {THEMES.filter(t => !themeConfigs[t.id]?.hidden).map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => updateField('theme', theme.id)}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      wedding.theme === theme.id
                        ? 'border-stone-800 bg-stone-50'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowThemePreview(true)}
                className="mt-4 w-full py-3 border-2 border-dashed border-stone-300 rounded-lg text-stone-500 hover:border-stone-400 hover:text-stone-700 flex items-center justify-center gap-2 text-sm transition-colors"
              >
                <Eye className="w-4 h-4" />
                선택한 테마로 미리보기
              </button>

              {wedding.theme === 'SENIOR_SIMPLE' && (
                <div className="mt-6 pt-6 border-t border-stone-200">
                  <p className="text-sm font-medium text-stone-700 mb-2">{at('themeColor', locale)}</p>
                  <p className="text-xs text-stone-500 mb-4">{at('themeColorDesc', locale)}</p>
                  <div className="flex flex-wrap gap-3">
                    {SENIOR_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => updateField('themeColor', color.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          wedding.themeColor === color.value
                            ? 'border-stone-800 bg-stone-50'
                            : 'border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <div 
                          className="w-10 h-10 rounded-full shadow-inner" 
                          style={{ backgroundColor: color.value }}
                        />
                        <span className="text-xs font-medium text-stone-600">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section title={at('sectionGroom', locale)}>
              <div className="grid sm:grid-cols-3 gap-4">
                <Input label={at('name', locale)} value={wedding.groomName} onChange={v => updateField('groomName', v)} />
                <Input label={at('nameEn', locale)} value={wedding.groomNameEn} onChange={v => updateField('groomNameEn', v)} />
                <Input label={at('phone', locale)} value={wedding.groomPhone} onChange={v => updateField('groomPhone', v)} />
              </div>
            </Section>

            <Section title={at('sectionBride', locale)}>
              <div className="grid sm:grid-cols-3 gap-4">
                <Input label={at('name', locale)} value={wedding.brideName} onChange={v => updateField('brideName', v)} />
                <Input label={at('nameEn', locale)} value={wedding.brideNameEn} onChange={v => updateField('brideNameEn', v)} />
                <Input label={at('phone', locale)} value={wedding.bridePhone} onChange={v => updateField('bridePhone', v)} />
              </div>
            </Section>

            <Section title={at('sectionParents', locale)}>
              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wedding.showParents || false}
                  onChange={(e) => updateField('showParents', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-stone-600">{at('showParents', locale)}</span>
              </label>
              {wedding.showParents && (
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-stone-600">신랑측</p>
                    <Input label={at('fatherName', locale)} value={wedding.groomFatherName} onChange={v => updateField('groomFatherName', v)} />
                    <Input label={at('motherName', locale)} value={wedding.groomMotherName} onChange={v => updateField('groomMotherName', v)} />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-stone-600">신부측</p>
                    <Input label={at('fatherName', locale)} value={wedding.brideFatherName} onChange={v => updateField('brideFatherName', v)} />
                    <Input label={at('motherName', locale)} value={wedding.brideMotherName} onChange={v => updateField('brideMotherName', v)} />
                  </div>
                </div>
              )}
            </Section>
          </>
        )}

        {tab === 'basic' && (
          <Section title={at('sectionProfile', locale)}>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={wedding.showProfile || false}
                onChange={(e) => updateField('showProfile', e.target.checked)}
                className="rounded border-stone-300"
              />
              <span className="text-sm text-stone-600">{at('showProfileLabel', locale)}</span>
            </div>
            {wedding.showProfile && (
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-stone-500 mb-2">{at('groomProfile', locale)}</label>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center flex-shrink-0">
                      {wedding.groomProfileUrl ? (
                        <img src={wedding.groomProfileUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg text-stone-300">{(wedding.groomName || '신')[0]}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <label className="px-3 py-1.5 text-xs rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 cursor-pointer transition-all">
                        사진 선택
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          uploadToCloudinary(file, 'groomProfile', (url) => updateField('groomProfileUrl', url), () => {});
                        }} />
                      </label>
                      {wedding.groomProfileUrl && (
                        <button onClick={() => updateField('groomProfileUrl', '')} className="px-3 py-1.5 text-xs rounded-lg text-red-400 hover:text-red-600">삭제</button>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[
                        'https://res.cloudinary.com/duzlquvxj/image/upload/v1773494940/4_h0iczw.jpg',
                        'https://res.cloudinary.com/duzlquvxj/image/upload/v1773494940/5_vghru5.jpg',
                        'https://res.cloudinary.com/duzlquvxj/image/upload/v1773494940/6_sptmku.jpg',
                      ].map((url, i) => (
                        <button key={i} onClick={() => updateField('groomProfileUrl', url)}
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${wedding.groomProfileUrl === url ? 'border-stone-800 scale-110' : 'border-stone-200 hover:border-stone-400'}`}>
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={wedding.groomIntro || ''}
                    onChange={(e) => updateField('groomIntro', e.target.value)}
                    placeholder="커피 없이 못 사는 개발자"
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-300 focus:border-stone-300 outline-none resize-none"
                    rows={2}
                    maxLength={100}
                  />
                  <p className="text-xs text-stone-400 mt-1 text-right">{(wedding.groomIntro || '').length}/100</p>
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-2">{at('brideProfile', locale)}</label>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center flex-shrink-0">
                      {wedding.brideProfileUrl ? (
                        <img src={wedding.brideProfileUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg text-stone-300">{(wedding.brideName || '신')[0]}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <label className="px-3 py-1.5 text-xs rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 cursor-pointer transition-all">
                        사진 선택
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          uploadToCloudinary(file, 'brideProfile', (url) => updateField('brideProfileUrl', url), () => {});
                        }} />
                      </label>
                      {wedding.brideProfileUrl && (
                        <button onClick={() => updateField('brideProfileUrl', '')} className="px-3 py-1.5 text-xs rounded-lg text-red-400 hover:text-red-600">삭제</button>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[
                        'https://res.cloudinary.com/duzlquvxj/image/upload/v1773494941/1_dgssbx.png',
                        'https://res.cloudinary.com/duzlquvxj/image/upload/v1773494941/2_nnf22a.png',
                        'https://res.cloudinary.com/duzlquvxj/image/upload/v1773494941/3_f9mqjc.png',
                      ].map((url, i) => (
                        <button key={i} onClick={() => updateField('brideProfileUrl', url)}
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${wedding.brideProfileUrl === url ? 'border-stone-800 scale-110' : 'border-stone-200 hover:border-stone-400'}`}>
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={wedding.brideIntro || ''}
                    onChange={(e) => updateField('brideIntro', e.target.value)}
                    placeholder="여행을 사랑하는 디자이너"
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-300 focus:border-stone-300 outline-none resize-none"
                    rows={2}
                    maxLength={100}
                  />
                  <p className="text-xs text-stone-400 mt-1 text-right">{(wedding.brideIntro || '').length}/100</p>
                </div>
              </div>
            )}
          </Section>
        )}

        {tab === 'greeting' && (
          <>
            <Section title={at('sectionGreeting', locale)}>
              <Input label={at('greetingTitle', locale)} value={wedding.greetingTitle} onChange={v => updateField('greetingTitle', v)} />
              <textarea
                placeholder="인사말 내용"
                value={wedding.greeting || ''}
                onChange={(e) => updateField('greeting', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none mt-4"
              />
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

            <Section title={at('closingMsg', locale)}>
              <textarea
                placeholder="마무리 메시지 (선택)"
                value={wedding.closingMessage || ''}
                onChange={(e) => updateField('closingMessage', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
              />
              <AiWritingAssistant
                fieldType="closingMessage"
                context={{
                  groomName: wedding.groomName,
                  brideName: wedding.brideName,
                }}
                onSelect={(value) => updateField('closingMessage', value)}
              />
            </Section>
          </>
        )}

        {tab === 'basic' && (
          <Section title={at('heroScriptFont', locale)}>
            <p className="text-sm text-stone-500 mb-3">{at('heroScriptFontDesc', locale)}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: '', label: 'Great Vibes', font: 'Great Vibes' },
                { value: 'Dancing Script', label: 'Dancing Script', font: 'Dancing Script' },
                { value: 'Parisienne', label: 'Parisienne', font: 'Parisienne' },
                { value: 'Alex Brush', label: 'Alex Brush', font: 'Alex Brush' },
                { value: 'Sacramento', label: 'Sacramento', font: 'Sacramento' },
                { value: 'Pinyon Script', label: 'Pinyon Script', font: 'Pinyon Script' },
                { value: 'Tangerine', label: 'Tangerine', font: 'Tangerine' },
              ].map((font) => (
                <button
                  key={font.value}
                  onClick={() => updateField('heroScriptFont', font.value || null)}
                  className={`px-4 py-4 rounded-lg border-2 transition-all text-center ${
                    (wedding.heroScriptFont || '') === font.value
                      ? 'border-stone-800 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                  style={{ fontFamily: "'"+font.font+"', cursive" }}
                >
                  <span className="text-lg">Wedding Day</span>
                  <p className="text-[10px] text-stone-400 mt-1">{font.label}</p>
                </button>
              ))}
            </div>
          </Section>
        )}

        {tab === 'basic' && (
          <>
          <Section title={at('fontScale', locale)}>
            <p className="text-sm text-stone-500 mb-3">{at('fontScaleDesc', locale)}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'small', label: at('fontSmall', locale), sample: 'Aa', size: '14px' },
                { value: 'medium', label: at('fontMedium', locale), sample: 'Aa', size: '16px' },
                { value: 'large', label: at('fontLarge', locale), sample: 'Aa', size: '19px' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateField('fontScale', opt.value)}
                  className={`py-4 rounded-xl border-2 transition-all ${
                    (wedding.fontScale || 'medium') === opt.value
                      ? 'border-stone-800 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <p className="text-center text-stone-700" style={{ fontSize: opt.size }}>{opt.sample}</p>
                  <p className="text-[10px] text-stone-400 text-center mt-1">{opt.label}</p>
                </button>
              ))}
            </div>
          </Section>

          <Section title={at('fontFamily', locale)}>
            <p className="text-sm text-stone-500 mb-4">{at('fontFamilyDesc', locale)}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: '', label: '기본 (테마 글꼴)' },
                { value: 'Noto Serif KR', label: 'Noto Serif (명조)' },
                { value: 'Gowun Batang', label: '고운 바탕' },
                { value: 'Nanum Myeongjo', label: '나눔 명조' },
                { value: 'S-CoreDream', label: '에스코어드림' },
                { value: 'Diphylleia', label: '디필레이아' },
                { value: 'ChosunNm', label: '조선 명조' },
                { value: 'ChosunGs', label: '조선 궁서' },
                { value: 'ChosunBg', label: '조선 봉건' },
                { value: 'ChosunSg', label: '조선 세고딕' },
                { value: 'ChosunSm', label: '조선 세명조' },
                { value: 'ChosunKm', label: '조선 큰명조' },
                { value: 'ChosunKg', label: '조선 큰고딕' },
                { value: 'ChosunLo', label: '조선 로고' },
                { value: 'ChosunGu', label: '조선 궁활자' },
                { value: 'ChosunCentennial', label: '조선 100주년' },
                { value: 'MyeongjoTtobak', label: '묘은또박체' },
                { value: 'Museum', label: '박물관 클래식' },
                
                { value: 'HakgyoansimLunchtime', label: '학교안심 점심시간' },
                { value: 'HsBombaram30', label: '봄바람' },
                { value: 'BM Kkubulim', label: '배민 꾸불림' },
                { value: 'Zen Serif', label: 'Zen Serif' },
              ].map((font) => (
                <button
                  key={font.value}
                  onClick={() => updateField('fontFamily', font.value || null)}
                  className={`px-4 py-3 text-sm rounded-lg border-2 transition-all text-left ${
                    (wedding.fontFamily || '') === font.value
                      ? 'border-stone-800 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                  style={{ fontFamily: font.value ? `'${font.value}', sans-serif` : 'inherit' }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </Section>
          </>
        )}

        {tab === 'basic' && (
          <Section title={at('envelope', locale)}>
            <p className="text-sm text-stone-500 mb-4">{at('envelopeDesc', locale)}</p>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={wedding.envelopeEnabled || false}
                onChange={(e) => updateField('envelopeEnabled', e.target.checked)}
                className="rounded border-stone-300"
              />
              <span className="text-sm text-stone-600">{at('envelopeUse', locale)}</span>
            </div>
            {wedding.envelopeEnabled && (
              <><div className="grid grid-cols-4 gap-3">
                {[
                  { value: 'black_ribbon', label: '블랙 레드리본', preview: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551431/1-Photoroom_foq0wz.png' },
                  { value: 'white_ribbon', label: '화이트 금리본', preview: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551432/3-Photoroom_zftkad.png' },
                  { value: 'navy_seal', label: '네이비 씰링', preview: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551432/2-Photoroom_wmyxia.png' },
                  { value: 'black_silver', label: '블랙 은리본', preview: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551432/4-Photoroom_lnyaib.png' },
                  { value: 'olive_ribbon_a', label: '올리브 리본A', preview: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/5-Photoroom_b3ap27.png' },
                  { value: 'olive_ribbon_b', label: '올리브 리본B', preview: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/6-Photoroom_zopodw.png' },
                  { value: 'pink_ribbon', label: '핑크 리본', preview: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/7-Photoroom_y9bijv.png' },
                  { value: 'white_bow', label: '화이트 리본', preview: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/8-Photoroom_akpnjh.png' },
                  { value: 'white_seal', label: '화이트 씰링', preview: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/9-Photoroom_vrwsw2.png' },
                  { value: 'black_seal', label: '블랙 씰링', preview: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/10-Photoroom_ufpw7v.png' },
                  { value: 'pink_seal', label: '핑크 씰링', preview: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551434/11-Photoroom_yitcbl.png' },
                  { value: 'olive_seal', label: '올리브 씰링', preview: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551436/13-Photoroom_gevewd.png' },
                ].map((env) => (
                  <button
                    key={env.value}
                    onClick={() => updateField('envelopeStyle', env.value)}
                    className={`rounded-lg overflow-hidden border-2 transition-all ${
                      (wedding.envelopeStyle || 'ivory') === env.value
                        ? 'border-stone-800 scale-105'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <img src={env.preview} alt={env.label} className="w-full aspect-[3/2] object-cover" />
                    <p className="text-[10px] text-stone-500 py-1 text-center">{env.label}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-xs text-stone-500 mb-2">{at('envelopeCardText', locale)}</label>
                <textarea
                  value={wedding.envelopeCardText || ''}
                  onChange={(e) => updateField('envelopeCardText', e.target.value)}
                  placeholder={`${wedding.groomName || '신랑'} & ${wedding.brideName || '신부'}의
결혼식에 초대합니다`}
                  className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-300 focus:border-stone-300 outline-none resize-none"
                  rows={3}
                />
              </div>
              <div className="mt-4">
                <label className="block text-xs text-stone-500 mb-2">{at('envelopeCardColor', locale)}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: '', label: '기본' },
                    { value: '#1a1a1a', label: '블랙' },
                    { value: '#4a4038', label: '브라운' },
                    { value: '#2a3a4a', label: at('colorNavy', locale) },
                    { value: '#3a4a3a', label: '올리브' },
                    { value: '#5a3a4a', label: at('colorWine', locale) },
                    { value: '#C9A96E', label: at('colorGold', locale) },
                    { value: '#e8dfd4', label: '아이보리' },
                    { value: '#ffffff', label: '화이트' },
                  ].map((c) => (
                    <button
                      key={c.value}
                      onClick={() => updateField('envelopeCardColor', c.value || null)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        (wedding.envelopeCardColor || '') === c.value
                          ? 'border-stone-800 scale-110'
                          : 'border-stone-200'
                      }`}
                      style={{ background: c.value || '#ccc' }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </>)}
          </Section>
        )}

        {tab === 'basic' && (
          <Section title={at('kakaoShare', locale)}>
            <p className="text-sm text-stone-500 mb-4">{at('kakaoShareDesc', locale)}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { value: 'default', label: at('ogDefault', locale) },
                { value: 'envelope', label: at('ogEnvelope', locale) },
                { value: 'custom', label: at('ogCustom', locale) },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateField('ogCoverType', opt.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                    (wedding.ogCoverType || 'default') === opt.value
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {(wedding.ogCoverType === 'custom' || wedding.ogCoverType === 'envelope') && (
              <div className="mb-4">
                <label className="block text-xs text-stone-500 mb-2">
                  {wedding.ogCoverType === 'envelope' ? '봉투 이미지 (선택 — 미선택 시 기본 봉투)' : 'OG 이미지 업로드'}
                </label>
                <label className="px-3 py-1.5 text-xs rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 cursor-pointer transition-all">
                  {uploadProgress['ogImage'] !== undefined && uploadProgress['ogImage'] < 100 ? `업로드 중 ${uploadProgress['ogImage']}%` : '이미지 선택'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) { alert('10MB 이하의 이미지만 업로드할 수 있어요'); return; }
                    uploadToCloudinary(file, 'ogImage', (url) => updateField('ogCustomImage', url), (_err) => alert('이미지 업로드에 실패했어요. 다른 이미지로 시도해주세요.'));
                  }} />
                </label>
                {wedding.ogCustomImage && (
                  <div className="mt-2 relative inline-block">
                    <img src={wedding.ogCustomImage} alt="" className="w-48 h-24 object-cover rounded-lg" />
                    <button onClick={() => updateField('ogCustomImage', '')} className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 text-white rounded-full text-xs flex items-center justify-center">x</button>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-xs text-stone-500 mb-2">{at('ogCustomTitle', locale)}</label>
              <input
                value={wedding.ogCustomTitle || ''}
                onChange={(e) => updateField('ogCustomTitle', e.target.value)}
                placeholder={`${wedding.groomName || '신랑'} ♥ ${wedding.brideName || '신부'} 결혼식에 초대합니다`}
                className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-300 focus:border-stone-300 outline-none"
              />
            </div>
          </Section>
        )}

        {tab === 'greeting' && (
          <Section title={at('letterSection', locale)}>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={wedding.showLetter || false}
                onChange={(e) => updateField('showLetter', e.target.checked)}
                className="rounded border-stone-300"
              />
              <span className="text-sm text-stone-600">{at('showLetter', locale)}</span>
            </div>
            {wedding.showLetter && (
              <div className="space-y-6">
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wedding.letterFromVisible !== false}
                    onChange={(e) => updateField('letterFromVisible', e.target.checked)}
                    className="rounded border-stone-300"
                  />
                  <span className="text-xs text-stone-500">FROM. 이름 표시</span>
                </label>
                <div>
                  <label className="block text-xs text-stone-500 mb-2">{at('groomToBride', locale)}</label>
                  <textarea
                    value={wedding.groomLetter || ''}
                    onChange={(e) => updateField('groomLetter', e.target.value)}
                    placeholder="당신을 만나 매일이 행복합니다..."
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-300 focus:border-stone-300 outline-none resize-none"
                    rows={5}
                  />
                  <div className="mt-2">
                    <label className="px-3 py-1.5 text-xs rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 cursor-pointer transition-all">
                      편지 이미지 추가
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        uploadToCloudinary(file, 'groomLetter', (url) => updateField('groomLetterImage', url), () => {});
                      }} />
                    </label>
                    {wedding.groomLetterImage && (
                      <div className="mt-2 relative inline-block">
                        <img src={wedding.groomLetterImage} alt="" className="w-32 h-32 object-cover rounded-lg" />
                        <button onClick={() => updateField('groomLetterImage', '')} className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 text-white rounded-full text-xs flex items-center justify-center">x</button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-2">{at('brideToGroom', locale)}</label>
                  <textarea
                    value={wedding.brideLetter || ''}
                    onChange={(e) => updateField('brideLetter', e.target.value)}
                    placeholder="우리 함께 걸어갈 날들이 기대됩니다..."
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-300 focus:border-stone-300 outline-none resize-none"
                    rows={5}
                  />
                  <div className="mt-2">
                    <label className="px-3 py-1.5 text-xs rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 cursor-pointer transition-all">
                      편지 이미지 추가
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        uploadToCloudinary(file, 'brideLetter', (url) => updateField('brideLetterImage', url), () => {});
                      }} />
                    </label>
                    {wedding.brideLetterImage && (
                      <div className="mt-2 relative inline-block">
                        <img src={wedding.brideLetterImage} alt="" className="w-32 h-32 object-cover rounded-lg" />
                        <button onClick={() => updateField('brideLetterImage', '')} className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 text-white rounded-full text-xs flex items-center justify-center">x</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Section>
        )}

        {tab === 'venue' && (
          <>
            <Section title={at('sectionDateTime', locale)}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-stone-600 mb-2">{at('weddingDate', locale)}</label>
                  <input
                    type="date"
                    value={wedding.weddingDate?.split('T')[0] || ''}
                    onChange={(e) => updateField('weddingDate', e.target.value)}
                    className="w-full px-4 py-3 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-600 mb-2">{at('weddingTime', locale)}</label>
                  <input
                    type="time"
                    value={wedding.weddingTime || ''}
                    onChange={(e) => updateField('weddingTime', e.target.value)}
                    className="w-full px-4 py-3 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>
            </Section>

            <Section title={at('sectionVenue', locale)}>
              <div className="space-y-4">
                <Input label={at('venueName', locale)} value={wedding.venue} onChange={v => updateField('venue', v)} />
                <Input label={at('hallName', locale)} value={wedding.venueHall} onChange={v => updateField('venueHall', v)} />
                <KakaoAddressInput
                  value={wedding.venueAddress}
                  onChange={v => updateField('venueAddress', v)}
                  label="주소"
                />
                <Input label={at('venuePhone', locale)} value={wedding.venuePhone} onChange={v => updateField('venuePhone', v)} />
              </div>
            </Section>

            <Section title={at('sectionMap', locale)}>
              <div className="space-y-4">
                <Input label="네이버 지도" value={wedding.venueNaverMap} onChange={v => updateField('venueNaverMap', v)} placeholder="https://naver.me/..." />
                <Input label="카카오맵" value={wedding.venueKakaoMap} onChange={v => updateField('venueKakaoMap', v)} placeholder="https://kko.to/..." />
                <Input label="티맵" value={wedding.venueTmap} onChange={v => updateField('venueTmap', v)} placeholder="https://..." />
              </div>
            </Section>

            <Section title={at('sectionTransport', locale)}>
              <p className="text-xs text-stone-400 mb-3">{at('printNote', locale)}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-stone-600 mb-2">{at('transportGuide', locale)}</label>
                  <textarea
                    value={wedding.transportInfo || ''}
                    onChange={(e) => updateField('transportInfo', e.target.value)}
                    placeholder={"지하철 2호선 강남역 3번 출구 도보 5분\n버스: 356, 479, 3111"}
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-300 focus:border-stone-300 outline-none resize-none"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-600 mb-2">{at('aiParking', locale)}</label>
                  <textarea
                    value={wedding.parkingInfo || ''}
                    onChange={(e) => updateField('parkingInfo', e.target.value)}
                    placeholder="건물 내 지하 주차장 무료 이용 가능 (3시간)"
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-300 focus:border-stone-300 outline-none resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </Section>

            <Section title={at('detailTabs', locale)}>
              <p className="text-sm text-stone-500 mb-4">{at('detailTabsDesc', locale)}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['식사안내', '주차안내', '전세버스', '숙소안내'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      const tabs = (wedding.venueDetailTabs as any[]) || [];
                      if (tabs.find((t: any) => t.title === preset)) return;
                      updateField('venueDetailTabs', [...tabs, { title: preset, image: '', content: '' }]);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 transition-all"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
              {((wedding.venueDetailTabs as any[]) || []).map((tab: any, i: number) => (
                <div key={i} className="border border-stone-200 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      value={tab.title}
                      onChange={(e) => {
                        const tabs = [...((wedding.venueDetailTabs as any[]) || [])];
                        tabs[i] = { ...tabs[i], title: e.target.value };
                        updateField('venueDetailTabs', tabs);
                      }}
                      className="text-sm font-medium bg-transparent border-b border-stone-200 focus:border-stone-400 outline-none pb-1"
                      placeholder="탭 제목"
                    />
                    <button
                      onClick={() => {
                        const tabs = [...((wedding.venueDetailTabs as any[]) || [])];
                        tabs.splice(i, 1);
                        updateField('venueDetailTabs', tabs);
                      }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      삭제
                    </button>
                  </div>
                  <textarea
                    value={tab.content || ''}
                    onChange={(e) => {
                      const tabs = [...((wedding.venueDetailTabs as any[]) || [])];
                      tabs[i] = { ...tabs[i], content: e.target.value };
                      updateField('venueDetailTabs', tabs);
                    }}
                    placeholder="안내 내용을 입력하세요 (줄바꿈 지원)"
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-300 focus:border-stone-300 outline-none resize-none"
                    rows={4}
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <label className="px-3 py-1.5 text-xs rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 cursor-pointer transition-all">
                      사진 추가
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        uploadToCloudinary(file, 'venueTab' + i, (url) => {
                          const tabs = [...((wedding.venueDetailTabs as any[]) || [])];
                          tabs[i] = { ...tabs[i], image: url };
                          updateField('venueDetailTabs', tabs);
                        }, () => {});
                      }} />
                    </label>
                    {tab.image && (
                      <div className="relative inline-block">
                        <img src={tab.image} alt="" className="w-20 h-20 object-cover rounded-lg" />
                        <button onClick={() => {
                          const tabs = [...((wedding.venueDetailTabs as any[]) || [])];
                          tabs[i] = { ...tabs[i], image: '' };
                          updateField('venueDetailTabs', tabs);
                        }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 text-white rounded-full text-xs flex items-center justify-center">x</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </Section>
          </>
        )}

        {tab === 'account' && (
          <>
            <Section title={at('groomAccountSection', locale)}>
              <div className="space-y-3">
                <BankSelect label={at('bank', locale)} value={wedding.groomBank} onChange={v => updateField('groomBank', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label={at('accountNumber', locale)} value={wedding.groomAccount} onChange={v => updateField('groomAccount', v)} />
                  <Input label={at('accountHolder', locale)} value={wedding.groomAccountHolder} onChange={v => updateField('groomAccountHolder', v)} />
                </div>
              </div>
            </Section>

            <Section title={at('brideAccountSection', locale)}>
              <div className="space-y-3">
                <BankSelect label={at('bank', locale)} value={wedding.brideBank} onChange={v => updateField('brideBank', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label={at('accountNumber', locale)} value={wedding.brideAccount} onChange={v => updateField('brideAccount', v)} />
                  <Input label={at('accountHolder', locale)} value={wedding.brideAccountHolder} onChange={v => updateField('brideAccountHolder', v)} />
                </div>
              </div>
            </Section>

            <Section title={at('groomParentAccount', locale)}>
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-stone-500">아버지</p>
                  <BankSelect label={at('bank', locale)} value={wedding.groomFatherBank} onChange={v => updateField('groomFatherBank', v)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={at('accountNumber', locale)} value={wedding.groomFatherAccount} onChange={v => updateField('groomFatherAccount', v)} />
                    <Input label={at('accountHolder', locale)} value={wedding.groomFatherAccountHolder} onChange={v => updateField('groomFatherAccountHolder', v)} />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-stone-500">어머니</p>
                  <BankSelect label={at('bank', locale)} value={wedding.groomMotherBank} onChange={v => updateField('groomMotherBank', v)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={at('accountNumber', locale)} value={wedding.groomMotherAccount} onChange={v => updateField('groomMotherAccount', v)} />
                    <Input label={at('accountHolder', locale)} value={wedding.groomMotherAccountHolder} onChange={v => updateField('groomMotherAccountHolder', v)} />
                  </div>
                </div>
              </div>
            </Section>

            <Section title={at('brideParentAccount', locale)}>
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-stone-500">아버지</p>
                  <BankSelect label={at('bank', locale)} value={wedding.brideFatherBank} onChange={v => updateField('brideFatherBank', v)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={at('accountNumber', locale)} value={wedding.brideFatherAccount} onChange={v => updateField('brideFatherAccount', v)} />
                    <Input label={at('accountHolder', locale)} value={wedding.brideFatherAccountHolder} onChange={v => updateField('brideFatherAccountHolder', v)} />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-stone-500">어머니</p>
                  <BankSelect label={at('bank', locale)} value={wedding.brideMotherBank} onChange={v => updateField('brideMotherBank', v)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={at('accountNumber', locale)} value={wedding.brideMotherAccount} onChange={v => updateField('brideMotherAccount', v)} />
                    <Input label={at('accountHolder', locale)} value={wedding.brideMotherAccountHolder} onChange={v => updateField('brideMotherAccountHolder', v)} />
                  </div>
                </div>
              </div>
            </Section>

            <div className="bg-gradient-to-b from-stone-50 to-white border border-stone-200 rounded-lg p-5">
              <h3 className="font-medium text-stone-800 mb-1">{at('easyTransfer', locale)}</h3>
              <p className="text-xs text-stone-400 mb-4">{at('easyTransferDesc', locale)}</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-white">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#0064FF' }}>
                    <span className="text-white text-xs font-bold">T</span>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-stone-500 mb-1">토스 송금 링크</label>
                    <input type="text" value={wedding.tossLink || ''} onChange={e => updateField('tossLink', e.target.value)} placeholder="토스 앱 > 송금 > 송금링크 복사" className="w-full text-sm border-none outline-none bg-transparent placeholder:text-stone-300" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-white">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FEE500' }}>
                    <span className="text-stone-800 text-xs font-bold">K</span>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-stone-500 mb-1">카카오페이 링크</label>
                    <input type="text" value={wedding.kakaoPayLink || ''} onChange={e => updateField('kakaoPayLink', e.target.value)} placeholder="https://qr.kakaopay.com/..." className="w-full text-sm border-none outline-none bg-transparent placeholder:text-stone-300" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'media' && (
          <Section title={at('heroMediaSection', locale)}>
            <p className="text-sm text-stone-500 mb-4">{at('heroMediaDesc', locale)}</p>
            
            {wedding.heroMedia ? (
              <div className="relative">
                {wedding.heroMediaType === 'VIDEO' ? (
                  isYouTubeUrl(wedding.heroMedia) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(wedding.heroMedia)}
                      className="w-full h-64 rounded-lg"
                      allowFullScreen
                    />
                  ) : (
                    <video src={wedding.heroMedia} controls className="w-full h-64 object-cover rounded-lg" />
                  )
                ) : (
                  <img src={wedding.heroMedia} alt="Hero" className="w-full h-64 object-cover rounded-lg" />
                )}
                <button
                  onClick={() => {
                    updateField('heroMedia', '');
                    updateField('heroMediaType', 'IMAGE');
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-stone-400">
                    <Image className="w-8 h-8 text-stone-400 mb-2" />
                    <span className="text-stone-500 text-sm">{at('uploadImage', locale)}</span>
                    <span className="text-stone-400 text-xs mt-1">{at('max20mb', locale)}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'heroMedia', 'image')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-stone-400">
                    <Film className="w-8 h-8 text-stone-400 mb-2" />
                    <span className="text-stone-500 text-sm">{at('uploadVideo', locale)}</span>
                    <span className="text-stone-400 text-xs mt-1">{at('max200mb', locale)}</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, 'heroMedia', 'video')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                <UploadProgressBar progressKey="heroMedia" />
                <div className="text-center text-stone-400 text-sm">{at('orDivider', locale)}</div>
                <Input 
                  label="YouTube URL" 
                  value="" 
                  onChange={v => {
                    updateField('heroMedia', v);
                    updateField('heroMediaType', 'VIDEO');
                  }} 
                  placeholder="https://youtube.com/watch?v=..." 
                />
              </div>
            )}
          </Section>
        )}

        {tab === 'gallery' && (
          <Section title={at('gallerySection', locale)}>
            <p className="text-sm text-stone-500 mb-4">{at('galleryDesc', locale)}</p>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-stone-500">{at('layoutLabel', locale)}</span>
              {[
                { value: 'grid', label: at('gridLayout', locale) },
                { value: 'polaroid', label: at('polaroidLayout', locale) },
              ].map((layout) => (
                <button
                  key={layout.value}
                  onClick={() => updateField('galleryLayout', layout.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                    (wedding.galleryLayout || 'grid') === layout.value
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {layout.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-stone-500">{at('galleryRatio', locale)}</span>
              {['1:1', '3:4', '4:3', 'original'].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => updateField('galleryRatio', ratio)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                    (wedding.galleryRatio || '1:1') === ratio
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {ratio === 'original' ? at('originalRatio', locale) : ratio}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              {galleries.map((item) => (
                <div key={item.id} className={`relative ${
                  (wedding.galleryRatio || '1:1') === '3:4' ? 'aspect-[3/4]' :
                  (wedding.galleryRatio || '1:1') === '4:3' ? 'aspect-[4/3]' :
                  (wedding.galleryRatio || '1:1') === 'original' ? 'aspect-auto' :
                  'aspect-square'
                }`}>
                  {item.mediaType === 'VIDEO' ? (
                    <video src={item.mediaUrl} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <img src={item.mediaUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                  )}
                  <button
                    onClick={() => handleDeleteGallery(item.id)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {item.mediaType === 'VIDEO' && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                      영상
                    </div>
                  )}
                </div>
              ))}
              
              <label className={`${
                  (wedding.galleryRatio || '1:1') === '3:4' ? 'aspect-[3/4]' :
                  (wedding.galleryRatio || '1:1') === '4:3' ? 'aspect-[4/3]' :
                  (wedding.galleryRatio || '1:1') === 'original' ? 'aspect-square' :
                  'aspect-square'
                } flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-stone-400 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Plus className="w-8 h-8 text-stone-400 mb-2" />
                <span className="text-stone-500 text-sm">{at('addBtn', locale)}</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            
            {Object.keys(uploadProgress).filter(k => k.startsWith('gallery')).map(key => (
              <UploadProgressBar key={key} progressKey={key} />
            ))}
            
            <p className="text-xs text-stone-400 mt-2">{at('galleryNote', locale)}</p>
            
            {currentCropFile && (
              <ImageCropModal
                file={currentCropFile}
                onComplete={handleCropComplete}
                onCancel={handleCropCancel}
                aspectRatio={
                  (wedding.galleryRatio || '1:1') === '3:4' ? 3/4 :
                  (wedding.galleryRatio || '1:1') === '4:3' ? 4/3 :
                  (wedding.galleryRatio || '1:1') === 'original' ? undefined :
                  1
                }
              />
            )}
            
            <div className="mt-6 pt-6 border-t border-stone-100">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-stone-700">테마 포토필터 적용</p>
                  <p className="text-sm text-stone-500">{at('photoFilterDesc', locale)}</p>
                </div>
                <input
                  type="checkbox"
                  checked={wedding.usePhotoFilter ?? true}
                  onChange={e => updateField('usePhotoFilter', e.target.checked)}
                  className="w-5 h-5 rounded accent-stone-800"
                />
              </label>
            </div>

          </Section>
        )}

        {tab === 'video' && (
          <Section title={at('loveStoryVideo', locale)}>
            <p className="text-sm text-stone-500 mb-4">{at('loveStoryDesc', locale)}</p>
            
            {wedding.loveStoryVideo ? (
              <div className="relative">
                {isYouTubeUrl(wedding.loveStoryVideo) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(wedding.loveStoryVideo)}
                    className="w-full aspect-video rounded-lg"
                    allowFullScreen
                  />
                ) : (
                  <video src={wedding.loveStoryVideo} controls className="w-full rounded-lg" />
                )}
                <button
                  onClick={() => updateField('loveStoryVideo', '')}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <label className={`flex flex-col items-center justify-center h-48 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-stone-400 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Film className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-stone-500 text-sm">{at('uploadVideoFile', locale)}</span>
                  <span className="text-stone-400 text-xs mt-1">{at('max200mb', locale)}</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, 'loveStoryVideo', 'video')}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <UploadProgressBar progressKey="loveStoryVideo" />
                <div className="text-center text-stone-400 text-sm">{at('orDivider', locale)}</div>
                <Input 
                  label="YouTube URL" 
                  value={wedding.loveStoryVideo} 
                  onChange={v => updateField('loveStoryVideo', v)} 
                  placeholder="https://youtube.com/watch?v=..." 
                />
              </div>
            )}
          </Section>
        )}

        {tab === 'music' && (
          <Section title={at('bgMusic', locale)}>
            <p className="text-sm text-stone-500 mb-4">{at('bgMusicDesc', locale)}</p>

            <div className="mb-6">
              <p className="text-sm font-medium text-stone-700 mb-3">{at('defaultTracks', locale)}</p>
              <audio ref={previewAudioRef} onEnded={() => setPreviewMusicId(null)} />
              {bgMusics.length > 0 ? (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {bgMusics.map(m => (
                    <div
                      key={m.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                        wedding.bgMusicUrl === m.url
                          ? 'bg-stone-100 border-stone-400'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                      onClick={() => {
                        updateField('bgMusicUrl', m.url);
                        if (previewAudioRef.current) { previewAudioRef.current.pause(); }
                        setPreviewMusicId(null);
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (previewMusicId === m.id) {
                            previewAudioRef.current?.pause();
                            setPreviewMusicId(null);
                          } else {
                            if (previewAudioRef.current) {
                              previewAudioRef.current.src = m.url;
                              previewAudioRef.current.play();
                            }
                            setPreviewMusicId(m.id);
                          }
                        }}
                        className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors flex-shrink-0"
                      >
                        {previewMusicId === m.id ? <Pause className="w-3.5 h-3.5 text-stone-700" /> : <Play className="w-3.5 h-3.5 text-stone-700" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-800 truncate">{m.title}</p>
                        <p className="text-xs text-stone-400">{m.artist}{m.duration > 0 ? ` · ${Math.floor(m.duration / 60)}:${String(m.duration % 60).padStart(2, '0')}` : ''}</p>
                      </div>
                      {wedding.bgMusicUrl === m.url && (
                        <span className="text-xs text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full flex-shrink-0">{at('selectedLabel', locale)}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-400 py-4 text-center">{at('noDefaultTracks', locale)}</p>
              )}
            </div>

            <div className="border-t border-stone-100 pt-5">
              <p className="text-sm font-medium text-stone-700 mb-3">{at('directUpload', locale)}</p>
            </div>
            
            {wedding.bgMusicUrl ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg">
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
                  <button
                    onClick={() => updateField('bgMusicUrl', '')}
                    className="p-2 text-stone-400 hover:text-stone-600 flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-stone-400 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Music className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-stone-500 text-sm">{at('uploadMusicFile', locale)}</span>
                  <span className="text-stone-400 text-xs mt-1">{at('mp3Wav', locale)}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileUpload(e, 'bgMusicUrl', 'audio')}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <UploadProgressBar progressKey="bgMusicUrl" />
                <div className="text-center text-stone-400 text-sm">{at('orDivider', locale)}</div>
                <Input 
                  label={at('musicUrlLabel', locale)} 
                  value={wedding.bgMusicUrl} 
                  onChange={v => updateField('bgMusicUrl', v)} 
                  placeholder="https://example.com/music.mp3" 
                />
                <p className="text-xs text-amber-600">⚠️ YouTube 링크는 배경음악으로 사용할 수 없어요. MP3 파일을 업로드해주세요.</p>
              </div>
            )}
            
            <label className="flex items-center gap-3 mt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={wedding.bgMusicAutoPlay || false}
                onChange={(e) => updateField('bgMusicAutoPlay', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="text-stone-600">{at('autoPlay', locale)}</span>
            </label>
            <p className="text-xs text-stone-400 mt-2">{at('autoPlayNote', locale)}</p>
          </Section>
        )}

        {tab === 'ai' && (
          <>
            <div className="bg-stone-800 rounded-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{at('aiConcierge', locale)}</h2>
                  <p className="text-sm opacity-80">{at('aiConciergeDesc', locale)}</p>
                </div>
              </div>
              <p className="text-sm opacity-90 mb-4">
                "{at('aiPromo1', locale)}<br />
                {at('aiPromo2', locale)}" 🎉
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wedding.aiEnabled || false}
                  onChange={(e) => updateField('aiEnabled', e.target.checked)}
                  className="w-6 h-6 rounded bg-white/20 border-0"
                />
                <span className="font-medium">{at('aiEnable', locale)}</span>
              </label>
            </div>
            
            {wedding.aiEnabled && (
              <Link to={`/admin/weddings/${id}/ai-report`} className="block mb-6 p-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg text-white hover:opacity-90 transition-opacity">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{at('aiReport', locale)}</p>
                    <p className="text-sm opacity-80">{at('aiReportDesc', locale)}</p>
                  </div>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
            )}

            {wedding.aiEnabled && (
              <>
                <Section title={at('aiBooth', locale)}>
                  <p className="text-sm text-stone-500 mb-4">{at('aiBoothDesc', locale)}</p>
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={wedding.aiBoothEnabled || false}
                      onChange={(e) => updateField('aiBoothEnabled', e.target.checked)}
                      className="w-6 h-6 rounded border-stone-300"
                    />
                    <span className="text-sm font-medium text-stone-700">{at('aiBoothEnable', locale)}</span>
                  </label>
                  {wedding.aiBoothEnabled && (
                    <BoothCreditPanel weddingId={wedding.id} slug={wedding.slug} />
                  )}
                </Section>
                <Section title={at('aiNameSection', locale)}>
                  <p className="text-sm text-stone-500 mb-4">{at('aiNameDesc', locale)}</p>
                  <input
                    type="text"
                    value={wedding.aiName || ""}
                    onChange={(e) => updateField("aiName", e.target.value)}
                    placeholder="자비스, 알프레드, 댕댕이, 흰둥이..."
                    className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                  />
                </Section>
                <Section title={at('aiStyleSection', locale)}>
                  <p className="text-sm text-stone-500 mb-4">{at('aiStyleDesc', locale)}</p>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors">
                      <input type="radio" name="aiMode" value="classic" checked={wedding.aiMode === "classic" || !wedding.aiMode} onChange={(e) => updateField("aiMode", e.target.value)} className="mt-1" />
                      <div>
                        <p className="font-medium text-stone-800">{at('aiClassic', locale)}</p>
                        <p className="text-sm text-stone-500">{at('aiClassicDesc', locale)}</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-4 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors">
                      <input type="radio" name="aiMode" value="variety" checked={wedding.aiMode === "variety"} onChange={(e) => updateField("aiMode", e.target.value)} className="mt-1" />
                      <div>
                        <p className="font-medium text-stone-800">{at('aiVariety', locale)}</p>
                        <p className="text-sm text-stone-500">{at('aiVarietyDesc', locale)}</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-4 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors">
                      <input type="radio" name="aiMode" value="active" checked={wedding.aiMode === "active"} onChange={(e) => updateField("aiMode", e.target.value)} className="mt-1" />
                      <div>
                        <p className="font-medium text-stone-800">{at('aiActive', locale)}</p>
                        <p className="text-sm text-stone-500">{at('aiActiveDesc', locale)}</p>
                      </div>
                    </label>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm text-stone-600 mb-2">{at('aiToneLabel', locale)}</label>
                    <select
                      value={wedding.aiToneStyle || "default"}
                      onChange={(e) => updateField("aiToneStyle", e.target.value)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg bg-white"
                    >
                      {(wedding.aiMode === "classic" || !wedding.aiMode) && (
                        <>
                          <option value="default">{at('toneDefault', locale)}</option>
                          <option value="romantic">{at('toneRomantic', locale)}</option>
                          <option value="smart">{at('toneSmart', locale)}</option>
                        </>
                      )}
                      {wedding.aiMode === "variety" && (
                        <>
                          <option value="bestie">{at('toneBestie', locale)}</option>
                          <option value="fanclub">{at('toneFanclub', locale)}</option>
                          <option value="siri">{at('toneSiri', locale)}</option>
                        </>
                      )}
                      {wedding.aiMode === "active" && (
                        <>
                          <option value="planner">{at('tonePlanner', locale)}</option>
                          <option value="sheriff">{at('toneSheriff', locale)}</option>
                          <option value="reporter">{at('toneReporter', locale)}</option>
                        </>
                      )}
                    </select>
                  </div>
                </Section>
                <Section title={at('aiPersonality', locale)}>
                  <p className="text-sm text-stone-500 mb-4">{at('aiPersonalityDesc', locale)}</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-stone-600 mb-2">신랑 {wedding.groomName}의 말투</label>
                      <textarea
                        value={wedding.aiGroomPersonality || ''}
                        onChange={(e) => updateField('aiGroomPersonality', e.target.value)}
                        placeholder="예: 유머러스하고 장난기 많음"
                        rows={3}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                      />
                      <AiWritingAssistant
                        fieldType="groomPersonality"
                        context={{ groomName: wedding.groomName }}
                        onSelect={(value) => updateField('aiGroomPersonality', value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-600 mb-2">신부 {wedding.brideName}의 말투</label>
                      <textarea
                        value={wedding.aiBridePersonality || ''}
                        onChange={(e) => updateField('aiBridePersonality', e.target.value)}
                        placeholder="예: 다정하고 따뜻한 성격"
                        rows={3}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                      />
                      <AiWritingAssistant
                        fieldType="bridePersonality"
                        context={{ brideName: wedding.brideName }}
                        onSelect={(value) => updateField('aiBridePersonality', value)}
                      />
                    </div>
                  </div>
                </Section>

              <Section title={at('aiSecrets', locale)}>
                <p className="text-sm text-stone-500 mb-4">{at('aiSecretsDesc', locale)}</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">{at('groomSecret', locale)}</label>
                    <textarea
                      value={wedding.aiSecrets?.groomSecret || ''}
                      onChange={(e) => updateAiSecrets('groomSecret', e.target.value)}
                      placeholder="예: 사실 프로포즈 3번 실패함"
                      rows={2}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                    />
                    <AiWritingAssistant
                      fieldType="secret"
                      context={{
                        groomName: wedding.groomName,
                        brideName: wedding.brideName,
                        secretType: '신랑의 비밀',
                      }}
                      onSelect={(value) => updateAiSecrets('groomSecret', value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">{at('brideSecret', locale)}</label>
                    <textarea
                      value={wedding.aiSecrets?.brideSecret || ''}
                      onChange={(e) => updateAiSecrets('brideSecret', e.target.value)}
                      placeholder="예: 첫만남 때 신랑 별로였음"
                      rows={2}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                    />
                    <AiWritingAssistant
                      fieldType="secret"
                      context={{
                        groomName: wedding.groomName,
                        brideName: wedding.brideName,
                        secretType: '신부의 비밀',
                      }}
                      onSelect={(value) => updateAiSecrets('brideSecret', value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">{at('firstMeet', locale)}</label>
                    <textarea
                      value={wedding.aiSecrets?.firstMeetStory || ''}
                      onChange={(e) => updateAiSecrets('firstMeetStory', e.target.value)}
                      placeholder="어디서 어떻게 처음 만났는지"
                      rows={2}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                    />
                    <AiWritingAssistant
                      fieldType="secret"
                      context={{
                        groomName: wedding.groomName,
                        brideName: wedding.brideName,
                        secretType: '첫만남 이야기',
                      }}
                      onSelect={(value) => updateAiSecrets('firstMeetStory', value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">{at('proposeBehind', locale)}</label>
                    <textarea
                      value={wedding.aiSecrets?.proposeStory || ''}
                      onChange={(e) => updateAiSecrets('proposeStory', e.target.value)}
                      placeholder="프로포즈 장소와 에피소드"
                      rows={2}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                    />
                    <AiWritingAssistant
                      fieldType="secret"
                      context={{
                        groomName: wedding.groomName,
                        brideName: wedding.brideName,
                        secretType: '프로포즈 비하인드',
                      }}
                      onSelect={(value) => updateAiSecrets('proposeStory', value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">{at('funnyEpisode', locale)}</label>
                    <textarea
                      value={wedding.aiSecrets?.funnyStory || ''}
                      onChange={(e) => updateAiSecrets('funnyStory', e.target.value)}
                      placeholder="둘만 아는 재미있는 이야기"
                      rows={2}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                    />
                    <AiWritingAssistant
                      fieldType="secret"
                      context={{
                        groomName: wedding.groomName,
                        brideName: wedding.brideName,
                        secretType: '웃긴 에피소드',
                      }}
                      onSelect={(value) => updateAiSecrets('funnyStory', value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">{at('firstImpression', locale)}</label>
                    <textarea
                      value={wedding.aiSecrets?.firstImpression || ''}
                      onChange={(e) => updateAiSecrets('firstImpression', e.target.value)}
                      placeholder="서로의 첫인상과 지금 생각"
                      rows={2}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                    />
                    <AiWritingAssistant
                      fieldType="secret"
                      context={{
                        groomName: wedding.groomName,
                        brideName: wedding.brideName,
                        secretType: '서로의 첫인상',
                      }}
                      onSelect={(value) => updateAiSecrets('firstImpression', value)}
                    />
                  </div>
                </div>
              </Section>

                <Section title={at('aiMenu', locale)}>
                  <p className="text-sm text-stone-500 mb-4">{at('aiMenuDesc', locale)}</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-stone-600 mb-2">{at('menuList', locale)}</label>
                      <textarea
                        value={wedding.aiMenuInfo?.menuList || ''}
                        onChange={(e) => updateAiMenu('menuList', e.target.value)}
                        placeholder="예: 한우불고기, 해물찜, 훈제연어, 초밥, 파스타, 스테이크 등"
                        rows={3}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-600 mb-2">{at('menuRecommend', locale)}</label>
                      <textarea
                        value={wedding.aiMenuInfo?.recommendation || ''}
                        onChange={(e) => updateAiMenu('recommendation', e.target.value)}
                        placeholder="추천 메뉴가 있다면 알려주세요"
                        rows={2}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-600 mb-2">{at('menuSpecial', locale)}</label>
                      <textarea
                        value={wedding.aiMenuInfo?.specialNote || ''}
                        onChange={(e) => updateAiMenu('specialNote', e.target.value)}
                        placeholder="특별히 알려드리고 싶은 점"
                        rows={2}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                      />
                    </div>
                  </div>
                </Section>

                <Section title={at('aiTransport', locale)}>
                  <p className="text-sm text-stone-500 mb-4">{at('aiTransportDesc', locale)}</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-stone-600 mb-2">{at('aiParking', locale)}</label>
                      <textarea
                        value={wedding.aiTransportInfo?.parking || ''}
                        onChange={(e) => updateAiTransport('parking', e.target.value)}
                        placeholder="주차 가능 대수, 요금, 대안 등"
                        rows={2}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-600 mb-2">{at('aiPublicTransport', locale)}</label>
                      <textarea
                        value={wedding.aiTransportInfo?.publicTransport || ''}
                        onChange={(e) => updateAiTransport('publicTransport', e.target.value)}
                        placeholder="예: 2호선 강남역 3번 출구에서 도보 10분, 신분당선 신논현역 5번 출구에서 도보 5분"
                        rows={2}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-600 mb-2">{at('aiTaxi', locale)}</label>
                      <textarea
                        value={wedding.aiTransportInfo?.taxi || ''}
                        onChange={(e) => updateAiTransport('taxi', e.target.value)}
                        placeholder="예: 강남역에서 택시 타면 약 15분, 토요일 낮이라 20분 정도 걸릴 수도 있어요"
                        rows={2}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg resize-none"
                      />
                    </div>
                  </div>
                </Section>

                <Section title={at('aiQna', locale)}>
                  <p className="text-sm text-stone-500 mb-4">{at('aiQnaDesc', locale)}</p>
                  <div className="space-y-4">
                    {(wedding.aiCustomQna || []).map((qna: any, index: number) => (
                      <div key={index} className="p-4 bg-stone-50 rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-medium text-stone-500">Q&A #{index + 1}</span>
                          <button
                            onClick={() => removeCustomQna(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={qna.question}
                          onChange={(e) => updateCustomQna(index, 'question', e.target.value)}
                          placeholder="질문 예: 축의금 얼마가 적당해?"
                          className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm"
                        />
                        <textarea
                          value={qna.answer}
                          onChange={(e) => updateCustomQna(index, 'answer', e.target.value)}
                          placeholder="답변 예: 마음이 중요합니다"
                          rows={2}
                          className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm resize-none"
                        />
                        <AiWritingAssistant
                          fieldType="qnaAnswer"
                          context={{
                            groomName: wedding.groomName,
                            brideName: wedding.brideName,
                            question: qna.question,
                          }}
                          onSelect={(value) => updateCustomQna(index, 'answer', value)}
                        />
                      </div>
                    ))}
                    <button
                      onClick={addCustomQna}
                      className="w-full py-3 border-2 border-dashed border-stone-300 rounded-lg text-stone-500 hover:border-stone-400 hover:text-stone-600 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Q&A 추가
                    </button>
                  </div>
                </Section>
              </>
            )}
          </>
        )}

        {tab === 'pair' && (
          <Section title={at('pairSection', locale)}>
            <div className="mb-4">
              <p className="text-sm text-stone-500 leading-relaxed">
                {at('pairDesc1', locale)}<br />
                {at('pairDesc2', locale)}
              </p>
            </div>
            <PairManager weddingId={id!} groomName={wedding.groomName} brideName={wedding.brideName} heroMedia={wedding.heroMedia} />
          </Section>
        )}

        {tab === 'rsvp' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-stone-800">{at('rsvpTitle', locale)}</h3>
              <span className="text-sm text-stone-500">총 {rsvpList.length}명</span>
            </div>
            
            {rsvpLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
              </div>
            ) : rsvpList.length === 0 ? (
              <div className="text-center py-12 bg-stone-50 rounded-lg">
                <p className="text-stone-500">{at('rsvpNoData', locale)}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">{rsvpList.filter(r => r.attending === true).length}</p>
                    <p className="text-sm text-green-600">{at('rsvpAttend', locale)}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-700">{rsvpList.filter(r => r.attending === false).length}</p>
                    <p className="text-sm text-red-600">{at('rsvpNotAttend', locale)}</p>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-stone-700">{rsvpList.reduce((sum, r) => sum + (r.guestCount || 1), 0)}</p>
                    <p className="text-sm text-stone-600">{at('rsvpTotalGuests', locale)}</p>
                  </div>
                </div>
                
                <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">{at('colName', locale)}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">{at('colAttend', locale)}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">{at('colCount', locale)}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">{at('colSide', locale)}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">{at('colMessage', locale)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {rsvpList.map((rsvp: any) => (
                        <tr key={rsvp.id} className="hover:bg-stone-50">
                          <td className="px-4 py-3 text-stone-800">{rsvp.name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${rsvp.attending ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {rsvp.attending ? at('rsvpAttend', locale) : at('rsvpNotAttend', locale)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-stone-600">{rsvp.guestCount || 1}명</td>
                          <td className="px-4 py-3 text-stone-600">{rsvp.side === 'groom' ? at('colGroom', locale) : at('colBride', locale)}</td>
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


        {tab === 'ai-snap' && (
          <Section title={at('aiSnapStudio', locale)}>
            <AiSnapStudio weddingId={id || ''} />
          </Section>
        )}

        {tab === 'sections' && (
          <Section title={at('sectionOrder', locale)}>
            <SectionOrderEditor
              value={wedding.sectionOrder}
              onChange={(order) => updateField('sectionOrder', order)}
              hiddenSections={(wedding.hiddenSections as string[]) || []}
              onHiddenChange={(hidden) => updateField('hiddenSections', hidden)}
            />
          </Section>
        )}

        {tab === 'settings' && (
          <>
            <Section title={at('publishSetting', locale)}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wedding.isPublished || false}
                  onChange={(e) => updateField('isPublished', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-stone-600">{at('publishLabel', locale)}</span>
              </label>
              <p className="text-xs text-stone-400 mt-2">{at('publishNote', locale)}</p>
            </Section>

            <Section title={at('ddaySetting', locale)}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wedding.showDday || false}
                  onChange={(e) => updateField('showDday', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-stone-600">{at('ddayLabel', locale)}</span>
              </label>
            </Section>

            <Section title={at('internationalMode', locale)}>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wedding.locale === 'en'}
                    onChange={async (e) => {
                      const isEn = e.target.checked;
                      updateField('locale', isEn ? 'en' : 'ko');
                      if (isEn && !wedding.translationsEn) {
                        try {
                          const token = localStorage.getItem('token');
                          const res = await fetch(`${import.meta.env.VITE_API_URL}/weddings/${wedding.id}/translate`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (res.ok) {
                            const data = await res.json();
                            updateField('translationsEn', data.translationsEn);
                          }
                        } catch (err) {
                          console.error('Translation failed:', err);
                        }
                      }
                    }}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <span className="text-stone-600">{at('defaultEnLabel', locale)}</span>
                    <p className="text-xs text-stone-400">{at('defaultEnDesc', locale)}</p>
                  </div>
                </label>
                {wedding.locale === 'en' && (
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${import.meta.env.VITE_API_URL}/weddings/${wedding.id}/translate`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (res.ok) {
                          const data = await res.json();
                          updateField('translationsEn', data.translationsEn);
                          alert(at('translateDone', locale));
                        } else {
                          alert(at('translateFail', locale));
                        }
                      } catch (err) {
                        console.error(err);
                        alert(at('translateFail', locale));
                      }
                    }}
                    className="mt-3 w-full py-2.5 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    {wedding.translationsEn ? at('retranslate', locale) : at('translateBtn', locale)}
                  </button>
                )}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wedding.showLocaleSwitch !== false}
                    onChange={(e) => updateField('showLocaleSwitch', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <span className="text-stone-600">{at('localeSwitchLabel', locale)}</span>
                    <p className="text-xs text-stone-400">{at('localeSwitchDesc', locale)}</p>
                  </div>
                </label>
              </div>
            </Section>

            <Section title={at('heroPosition', locale)}>
              <p className="text-sm text-stone-500 mb-3">{at('heroPositionDesc', locale)}</p>
              <div className="relative w-full rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '9/16', maxHeight: 360 }}>
                <img
                  src={wedding.heroMedia || wedding.galleries?.[0]?.mediaUrl || ''}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div
                  className="absolute left-0 right-0 flex flex-col items-center transition-all duration-200"
                  style={{ top: `${Number(wedding.heroTextPosition) || 20}%` }}
                >
                  <p className="text-white/60 text-[8px] tracking-[0.25em] uppercase font-light">Happily Ever After</p>
                  <p className="text-white text-xl italic font-light mt-1" style={{ fontFamily: 'Georgia, serif' }}>
                    Dream your<br />Wedding Day
                  </p>
                </div>
                <div
                  className="absolute left-0 right-0 flex flex-col items-center transition-all duration-200"
                  style={{ top: `${Number(wedding.heroNamePosition) || 85}%`, transform: 'translateY(-100%)' }}
                >
                  <p className="text-white/50 text-[8px] tracking-[0.15em]">
                    FINALLY {wedding.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.') : '2026.00.00'}
                  </p>
                  <p className="text-white text-sm font-light tracking-wider mt-0.5">
                    {wedding.groomName || '신랑'} & {wedding.brideName || '신부'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-stone-500 mb-1">{at('heroEngText', locale)}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-stone-400">{at('upLabel', locale)}</span>
                    <input type="range" min={5} max={60} value={Number(wedding.heroTextPosition) || 20} onChange={(e) => updateField('heroTextPosition', String(e.target.value))} className="flex-1 accent-stone-800" />
                    <span className="text-[10px] text-stone-400">{at('downLabel', locale)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">{at('heroNameDate', locale)}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-stone-400">{at('upLabel', locale)}</span>
                    <input type="range" min={40} max={95} value={Number(wedding.heroNamePosition) || 85} onChange={(e) => updateField('heroNamePosition', String(e.target.value))} className="flex-1 accent-stone-800" />
                    <span className="text-[10px] text-stone-400">{at('downLabel', locale)}</span>
                  </div>
                </div>
              </div>
            </Section>

            <Section title={at('textColorSection', locale)}>
              <p className="text-sm text-stone-500 mb-4">{at('textColorDesc', locale)}</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: '#ffffff', label: at('colorWhite', locale) },
                  { value: '#1c1917', label: at('colorBlack', locale) },
                  { value: '#78716c', label: at('colorGray', locale) },
                  { value: '#a16207', label: at('colorGold', locale) },
                  { value: '#991b1b', label: at('colorWine', locale) },
                  { value: '#1e3a5f', label: at('colorNavy', locale) },
                ].map(color => (
                  <button
                    key={color.value}
                    onClick={() => updateField('textColor', color.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      wedding.textColor === color.value 
                        ? 'border-stone-800 bg-stone-50' 
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <div 
                      className="w-5 h-5 rounded-full border border-stone-300" 
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-sm text-stone-600">{color.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm text-stone-600 mb-2">{at('directInputHex', locale)}</label>
                <input
                  type="text"
                  value={wedding.textColor || '#ffffff'}
                  onChange={(e) => updateField('textColor', e.target.value)}
                  placeholder="#ffffff"
                  className="w-32 px-4 py-2 border border-stone-200 rounded-lg text-sm"
                />
              </div>
            </Section>


            <Section title={at('notifSetting', locale)}>
              <p className="text-sm text-stone-500 mb-4">{at('notifDesc', locale)}</p>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wedding.rsvpNotification ?? true}
                    onChange={(e) => updateField('rsvpNotification', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <span className="text-stone-600">{at('rsvpNotif', locale)}</span>
                    <p className="text-xs text-stone-400">{at('rsvpNotifDesc', locale)}</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wedding.giftNotification ?? true}
                    onChange={(e) => updateField('giftNotification', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <span className="text-stone-600">{at('giftNotif', locale)}</span>
                    <p className="text-xs text-stone-400">{at('giftNotifDesc', locale)}</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wedding.notificationEnabled ?? true}
                    onChange={(e) => updateField('notificationEnabled', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <span className="text-stone-600">{at('reminderNotif', locale)}</span>
                    <p className="text-xs text-stone-400">{at('reminderNotifDesc', locale)}</p>
                  </div>
                </label>
              </div>
            </Section>

            <Section title={at('slugSetting', locale)}>
              <div className="space-y-2">
                <p className="text-stone-500 text-sm break-all">{window.location.origin}/w/</p>
                <input
                  type="text"
                  value={wedding.slug || ''}
                  onChange={(e) => updateField('slug', e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg"
                />
              </div>
              <p className="text-xs text-stone-400 mt-2">{at('slugNote', locale)}</p>
            </Section>
          </>
        )}
      </main>
      {showThemePreview && wedding && (
        <ThemePreviewModal
          isOpen={showThemePreview}
          onClose={() => setShowThemePreview(false)}
          wedding={wedding}
          onApply={(themeId) => updateField('theme', themeId)}
        />
      )}
      {showPaper && wedding && (
        <PaperInvitationModal
          isOpen={showPaper}
          onClose={() => setShowPaper(false)}
          wedding={wedding}
          photoUrl={wedding.heroMedia || galleries[0]?.mediaUrl}
          galleries={galleries}
        />
      )}
      {showQR && wedding && (
        <QRCardModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          wedding={wedding}
        />
      )}
    </div>
  );
}


const POPULAR_BANKS = [
  { name: 'KB국민', bg: '#FFB300', text: '#fff' },
  { name: '신한', bg: '#0046FF', text: '#fff' },
  { name: '하나', bg: '#009B8D', text: '#fff' },
  { name: '우리', bg: '#0066B3', text: '#fff' },
  { name: 'NH농협', bg: '#00AB4E', text: '#fff' },
  { name: 'IBK기업', bg: '#2B4A83', text: '#fff' },
  { name: '카카오뱅크', bg: '#FEE500', text: '#1a1a1a' },
  { name: '토스뱅크', bg: '#0064FF', text: '#fff' },
  { name: 'SC제일', bg: '#009A44', text: '#fff' },
  { name: '새마을', bg: '#0066CC', text: '#fff' },
  { name: '우체국', bg: '#EF4123', text: '#fff' },
  { name: '수협', bg: '#0072CE', text: '#fff' },
];

function BankSelect({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm text-stone-600 mb-1.5">{label}</label>
      <style>{'.bank-scroll::-webkit-scrollbar{display:none}'}</style>
      <div className="bank-scroll flex gap-1.5 mb-2 overflow-x-auto pb-0.5" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {POPULAR_BANKS.map(b => {
          const selected = value === b.name;
          return (
            <button
              key={b.name}
              type="button"
              onClick={() => onChange(b.name)}
              className="shrink-0 transition-all"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                background: selected ? b.bg : '#f5f5f4',
                color: selected ? b.text : '#78716c',
                border: selected ? `1.5px solid ${b.bg}` : '1.5px solid transparent',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: selected ? b.text : b.bg, flexShrink: 0 }} />
              {b.name}
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="기타 은행 직접 입력"
        className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300 text-sm"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-stone-200 rounded-lg p-6">
      <h2 className="font-serif text-xl text-stone-800 mb-6">{title}</h2>
      {children}
    </section>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: any; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm text-stone-600 mb-2">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
      />
    </div>
  );
}
