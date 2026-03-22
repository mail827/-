import { useState, useRef, useEffect } from 'react';
import { Camera, Sparkles, Loader2, Share2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL;
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'wedding_guide';

const CONCEPTS = [
  { id: 'gala', label: 'Gala', desc: 'Evening Party' },
  { id: 'flower', label: 'Flower', desc: 'Bouquet Portrait' },
  { id: 'hanbok', label: 'Hanbok', desc: 'Modern Hanbok' },
  { id: 'redcarpet', label: 'Red Carpet', desc: 'Celebrity Mood' },
  { id: 'magazine', label: 'Magazine', desc: 'Fashion Editorial' },
  { id: 'champagne', label: 'Champagne', desc: 'Golden Toast' },
];

interface Props {
  slug: string;
  groomName: string;
  brideName: string;
  locale?: string;
}

export default function GuestAiPhotoBooth({ slug, groomName, brideName, locale = 'ko' }: Props) {
  const [step, setStep] = useState<'intro' | 'upload' | 'concept' | 'generating' | 'result'>('intro');
  const [photo, setPhoto] = useState('');
  const [concept, setConcept] = useState('gala');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [guestName, setGuestName] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [unlimited, setUnlimited] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const progressRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    fetch(`${API}/guest-photo/${slug}/booth-credits`)
      .then(r => r.json())
      .then(d => { setCredits(d.credits); setUnlimited(d.unlimited || false); })
      .catch(() => {});
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [slug]);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      setPhoto(data.secure_url);
      setStep('concept');
    } catch {
      setError('Upload failed');
    }
    setUploading(false);
  };

  const generate = async () => {
    if (!photo || !concept) return;
    setStep('generating');
    setProgress(0);
    setError('');
    progressRef.current = setInterval(() => setProgress(p => p >= 90 ? 90 : p + Math.random() * 6), 600);

    try {
      const res = await fetch(`${API}/guest-photo/${slug}/ai-booth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: guestName || 'Guest', imageUrl: photo, concept, gender }),
      });
      const data = await res.json();

      if (data.code === 'NO_CREDITS') {
        clearInterval(progressRef.current);
        setCredits(0);
        setError(locale === 'en' ? locale === 'en' ? 'The photo booth has closed!' : '포토부스가 마감되었어요!' : 'AI credits exhausted');
        setStep('concept');
        return;
      }

      if (data.status === 'processing' && data.statusUrl) {
        if (!unlimited) setCredits(prev => prev !== null ? prev - 1 : prev);
        pollRef.current = setInterval(async () => {
          try {
            const pRes = await fetch(`${API}/guest-photo/${slug}/ai-booth/poll/${data.photoId}?statusUrl=${encodeURIComponent(data.statusUrl)}&responseUrl=${encodeURIComponent(data.responseUrl)}`);
            const pData = await pRes.json();
            if (pData.status === 'done') {
              clearInterval(pollRef.current);
              clearInterval(progressRef.current);
              setProgress(100);
              setResultUrl(pData.resultUrl);
              setTimeout(() => setStep('result'), 500);
            } else if (pData.status === 'failed') {
              clearInterval(pollRef.current);
              clearInterval(progressRef.current);
              if (!unlimited) setCredits(prev => prev !== null ? prev + 1 : prev);
              setError(pData.error || 'Generation failed');
              setStep('concept');
            }
          } catch {}
        }, 3000);
      } else {
        clearInterval(progressRef.current);
        setError(data.error || 'Failed to start');
        setStep('concept');
      }
    } catch {
      clearInterval(progressRef.current);
      setError('Network error');
      setStep('concept');
    }
  };

  const shareToInstagram = () => {
    if (resultUrl) {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = `wedding-photobooth-${Date.now()}.jpg`;
      link.click();
    }
  };

  const reset = () => {
    setStep('intro');
    setPhoto('');
    setConcept('gala');
    setResultUrl('');
    setProgress(0);
    setError('');
    setGuestName('');
  };

  const exhausted = credits !== null && credits <= 0 && !unlimited;

  return (
    <div style={{ padding: '48px 0', textAlign: 'center', color: 'inherit' }}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ''; }} />

      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ maxWidth: 360, margin: '0 auto', padding: '0 20px' }}>
            <div style={{ width: 1, height: 40, background: 'currentColor', opacity: 0.15, margin: '0 auto 24px' }} />
            <p style={{ fontSize: 10, letterSpacing: 3, opacity: 0.4, marginBottom: 14 }}>AI CELEBRATION SNAP</p>
            <p style={{ fontSize: 15, opacity: 0.7, lineHeight: 1.8, marginBottom: 6 }}>
              {groomName} & {brideName}
            </p>
            <p style={{ fontSize: 12, opacity: 0.4, marginBottom: 28 }}>
              {locale === 'en' ? 'Step into their moment. Become part of the memory.' : 'AI celebration snap'}
            </p>
            {exhausted ? (
              <p style={{ fontSize: 13, opacity: 0.45, padding: '12px 20px', border: '1px solid rgba(128,128,128,0.2)', borderRadius: 10, display: 'inline-block' }}>
                {locale === 'en' ? 'Photo booth is currently unavailable' : 'AI credits exhausted'}
              </p>
            ) : (
              <>
                <button onClick={() => setStep('upload')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'inherit', borderRadius: 100, border: '1px solid rgba(255,255,255,0.15)', fontSize: 13, fontWeight: 400, cursor: 'pointer', letterSpacing: 0.5 }}>
                  <Camera size={15} />
                  {locale === 'en' ? 'Join the memory' : 'AI snap'}
                </button>
                {credits !== null && !unlimited && (
                  <p style={{ fontSize: 11, opacity: 0.3, marginTop: 12 }}>{credits}{locale === 'en' ? ' remaining' : '장 남음'}</p>
                )}
              </>
            )}
          </motion.div>
        )}

        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ maxWidth: 360, margin: '0 auto', padding: '0 20px' }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{locale === 'en' ? 'Upload Selfie' : 'Upload selfie'}</p>
            <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 16 }}>{locale === 'en' ? 'Upload a clear front-facing photo' : 'Clear selfie needed'}</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setGender('male')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: gender === 'male' ? '2px solid currentColor' : '1px solid rgba(128,128,128,0.3)', background: gender === 'male' ? 'rgba(128,128,128,0.1)' : 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: gender === 'male' ? 600 : 400, color: 'inherit' }}>{locale === 'en' ? 'Male' : 'Male'}</button>
              <button onClick={() => setGender('female')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: gender === 'female' ? '2px solid currentColor' : '1px solid rgba(128,128,128,0.3)', background: gender === 'female' ? 'rgba(128,128,128,0.1)' : 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: gender === 'female' ? 600 : 400, color: 'inherit' }}>{locale === 'en' ? 'Female' : 'Female'}</button>
            </div>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder={locale === 'en' ? 'Name' : 'Name'} style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(128,128,128,0.3)', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none', background: 'rgba(255,255,255,0.08)', color: 'inherit' }} />
            <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'inherit', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              {uploading ? (locale === 'en' ? 'Uploading...' : 'Uploading...') : (locale === 'en' ? 'Upload Photo' : 'Upload photo')}
            </button>
            <button onClick={reset} style={{ marginTop: 12, background: 'none', border: 'none', fontSize: 12, opacity: 0.4, color: 'inherit', cursor: 'pointer' }}>{locale === 'en' ? 'Cancel' : 'Cancel'}</button>
          </motion.div>
        )}

        {step === 'concept' && (
          <motion.div key="concept" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ maxWidth: 400, margin: '0 auto', padding: '0 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px', border: '2px solid rgba(128,128,128,0.3)' }}>
              <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{locale === 'en' ? 'Pick your vibe' : 'Pick your vibe'}</p>
            <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 20 }}>{locale === 'en' ? 'How do you want to remember today?' : 'Select concept'}</p>
            {error && <p style={{ fontSize: 12, color: '#e55', marginBottom: 12, opacity: 0.9 }}>{error}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
              {CONCEPTS.map(c => (
                <button key={c.id} onClick={() => setConcept(c.id)} style={{ padding: '14px 8px', borderRadius: 10, border: concept === c.id ? '2px solid currentColor' : '1px solid rgba(128,128,128,0.3)', background: concept === c.id ? 'rgba(128,128,128,0.15)' : 'transparent', cursor: 'pointer', textAlign: 'center', color: 'inherit' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{c.label}</p>
                  <p style={{ fontSize: 10, opacity: 0.5 }}>{c.desc}</p>
                </button>
              ))}
            </div>
            {credits !== null && !unlimited && (
              <p style={{ fontSize: 11, opacity: 0.35, marginBottom: 10 }}>{locale === 'en' ? `${credits} credits remaining` : `${credits}장 남음`}</p>
            )}
            <button onClick={generate} disabled={exhausted} style={{ width: '100%', padding: '14px', background: exhausted ? 'rgba(128,128,128,0.1)' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'inherit', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', fontSize: 14, fontWeight: 500, cursor: exhausted ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: exhausted ? 0.4 : 1 }}>
              <Sparkles size={16} />
              {exhausted ? (locale === 'en' ? 'No credits' : 'No credits') : (locale === 'en' ? 'Generate' : 'Generate')}
            </button>
            <button onClick={reset} style={{ marginTop: 12, background: 'none', border: 'none', fontSize: 12, opacity: 0.4, color: 'inherit', cursor: 'pointer' }}>{locale === 'en' ? 'Cancel' : 'Cancel'}</button>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ maxWidth: 320, margin: '0 auto', padding: '40px 20px' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'inherit', margin: '0 auto 20px', display: 'block' }} />
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{locale === 'en' ? 'Crafting your moment...' : 'Crafting your moment...'}</p>
            <div style={{ width: '100%', height: 4, background: 'rgba(128,128,128,0.2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'currentColor', borderRadius: 2, transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ fontSize: 11, opacity: 0.4, marginTop: 8 }}>{Math.round(progress)}%</p>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ maxWidth: 360, margin: '0 auto', padding: '0 20px' }}>
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(128,128,128,0.3)', marginBottom: 16, position: 'relative' }}>
              <img src={resultUrl} alt="AI Celebration" style={{ width: '100%', display: 'block' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={shareToInstagram} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.12)', color: 'inherit', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Download size={16} />
                {locale === 'en' ? 'Save' : 'Save'}
              </button>
              <button onClick={() => { if (navigator.share) navigator.share({ title: `${groomName} & ${brideName}`, url: resultUrl }); }} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'inherit', borderRadius: 10, border: '1px solid rgba(128,128,128,0.3)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Share2 size={16} />
                {locale === 'en' ? 'Share' : 'Share'}
              </button>
            </div>
            <button onClick={reset} style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid rgba(128,128,128,0.3)', borderRadius: 10, fontSize: 13, color: 'inherit', opacity: 0.5, cursor: 'pointer' }}>
              {locale === 'en' ? 'Create another moment' : 'Try another concept'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
