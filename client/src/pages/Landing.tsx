import { useLocaleStore } from '../store/useLocaleStore';
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { conceptLabel } from '../utils/conceptLabels';
import AnimatedNumber from "../components/AnimatedNumber";
import {
  ArrowRight, Check, Sparkles,
  Send, Camera, ChevronDown, Gift, MessageCircle, X,
  Mail, Loader2
} from "lucide-react";
import ThemeShowcaseModal from "../components/ThemeShowcaseModal";
import { lt } from "./landingI18n";
import type { LandingLocale } from "./landingI18n";
const FEATURE_EN: Record<string, string> = {
  '청첩장 전 기능': 'All invitation features',
  '전 테마 19종': 'All 19 themes',
  '전 테마 27종': 'All 27 themes',
  '무제한 수정': 'Unlimited edits',
  'RSVP · 축의금 · 방명록': 'RSVP · Gift · Guestbook',
  '갤러리 · 폴라로이드': 'Gallery · Polaroid',
  '봉투 인트로 12종': '12 envelope intros',
  '프로필 · 편지 섹션': 'Profile · Letter sections',
  'Standard 전체 포함': 'Everything in Standard',
  'AI 웨딩스냅 43컨셉': 'AI Snap 43 concepts',
  'AI Reception (AI 비서)': 'AI Guest Reception',
  '커플 · 솔로 · 스튜디오 촬영': 'Couple · Solo · Studio shoots',
  '고화질 다운로드': 'HD download',
  'Standard + AI': 'Standard + AI',
  '게스트 갤러리': 'Guest gallery',
  '배경음악': 'Background music',
  'D-Day 카운트': 'D-Day countdown',
  '종이청첩장 10종': '10 paper invitations',
  'QR카드 19종': '19 QR card designs',
  '글꼴 23종': '23 fonts',
  '함께 수정하기': 'Co-editing',
  '버전별 공유 링크': 'Versioned share links',
  '하객 AI 포토부스': 'Guest AI Photo Booth',
};

function trFeature(text: string, locale: string): string {
  if (locale !== 'en') return text;
  return FEATURE_EN[text] || text;
}

function trPkgDesc(text: string, locale: string): string {
  if (locale !== 'en') return text;
  const map: Record<string, string> = {
    '청첩장 전 기능': 'Full invitation features',
    'Standard + AI': 'Standard + AI',
  };
  return map[text] || text;
}


const API = import.meta.env.VITE_API_URL;

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@200;300;400;500;600;700&display=swap";

interface Package {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  features: string[];
}

interface ChatAction {
  type: "button" | "link";
  label: string;
  action: string;
  url?: string;
  style?: "primary" | "secondary" | "kakao";
}

interface ChatMessage {
  role: "user" | "assistant";
  actions?: ChatAction[];
  content: string;
}






function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

function ThemeShowcase({ onLogin, landingLocale, packages, onStartCreate }: { onLogin: () => void; landingLocale: LandingLocale; packages: Package[]; onStartCreate: () => void }) {
  const [ref, inView] = useInView(0.08);
  const [showcases, setShowcases] = useState<{ name: string; url: string; description?: string }[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [formData, setFormData] = useState({ groom: "", bride: "", date: "", venue: "", heroMedia: "" });
  const [iframeKey, setIframeKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/public/theme-showcases`)
      .then(r => r.json())
      .then((data: { name: string; url: string; description?: string }[]) => {
        if (data.length > 0) setShowcases(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { setIframeLoaded(false); }, [activeIdx, iframeKey]);

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setIframeKey(k => k + 1), 800);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setPhotoPreview(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", "wedding_guide");
      const res = await fetch("https://api.cloudinary.com/v1_1/" + import.meta.env.VITE_CLOUDINARY_CLOUD_NAME + "/image/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.secure_url) updateForm("heroMedia", data.secure_url);
    } catch {} finally { setUploading(false); }
  };

  const removePhoto = () => {
    setPhotoPreview("");
    updateForm("heroMedia", "");
    if (fileRef.current) fileRef.current.value = "";
  };

  const buildPreviewUrl = (baseUrl: string) => {
    const params = new URLSearchParams();
    params.set("preview", "1");
    if (formData.groom) params.set("groom", formData.groom);
    if (formData.bride) params.set("bride", formData.bride);
    if (formData.date) params.set("date", formData.date);
    if (formData.venue) params.set("venue", formData.venue);
    if (formData.heroMedia) params.set("heroMedia", formData.heroMedia);
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}${params.toString()}`;
  };


const pricingBlock = packages.length > 0 ? (
    <section style={{ padding: "80px 0 100px", background: "#FAFAF8", borderTop: "1px solid #E8E5E0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#999", letterSpacing: 3, marginBottom: 12, textTransform: "uppercase" }}>Invitation Pricing</p>
          <h3 className="serif" style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 400, color: "#1a1a1a", marginBottom: 10, letterSpacing: "-0.02em" }}>{landingLocale === 'ko' ? '이 청첩장, 얼마인가요?' : 'How much is this invitation?'}</h3>
          <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 13, color: "#999" }}>{landingLocale === 'ko' ? '무제한 수정 · 영구 아카이브 별도' : 'Unlimited edits · Archive separate'}</p>
        </div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <a href="/gift/redeem" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 100, border: "1px solid #E0DDD8", fontSize: 12, color: "#888", textDecoration: "none" }}>
            <Gift size={13} />
            {lt('pricing','giftCode',landingLocale)}
          </a>
        </div>
        <div className="pricing-grid snap-pill" style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", padding: "14px 0 16px", scrollbarWidth: "none", maxWidth: 1100, margin: "0 auto", justifyContent: "center" }}>
          {packages.map((pkg) => {
            const isHighlight = pkg.slug === "premium";
            return (
              <div key={pkg.id} style={{ minWidth: 280, flex: "0 0 280px", scrollSnapAlign: "start", padding: "32px 24px", borderRadius: 14, border: isHighlight ? "2px solid #1a1a1a" : "1px solid #E8E5E0", background: isHighlight ? "#fff" : "#fff", position: "relative" }}>
                {pkg.slug === "premium" && <div style={{ position: "absolute", top: -1, left: 24, transform: "translateY(-50%)", background: "#1a1a1a", color: "#fff", fontSize: 10, padding: "4px 12px", borderRadius: 100, fontWeight: 500 }}>BEST</div>}
                <p style={{ fontSize: 11, color: "#bbb", marginBottom: 4 }}>{trPkgDesc(pkg.description, landingLocale)}</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>{pkg.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 20 }}>
                  <p className="serif" style={{ fontSize: 30, fontWeight: 400, color: "#1a1a1a" }}>{pkg.price.toLocaleString()}</p>
                  <p style={{ fontSize: 13, color: "#999" }}>{landingLocale === 'en' ? 'KRW' : '원'}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {pkg.features.slice(0, 6).map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Check size={13} color={isHighlight ? "#1a1a1a" : "#ccc"} strokeWidth={2} />
                      <p style={{ fontSize: 13, color: "#666" }}>{trFeature(f, landingLocale)}</p>
                    </div>
                  ))}
                  {pkg.features.length > 6 && <p style={{ fontSize: 12, color: "#bbb", paddingLeft: 21 }}>+{pkg.features.length - 6}{landingLocale === 'en' ? ' more' : '개 더'}</p>}
                </div>
                <button onClick={onStartCreate} style={{ display: "block", width: "100%", textAlign: "center", padding: "12px 0", borderRadius: 8, fontSize: 13, fontWeight: 500, background: isHighlight ? "#1a1a1a" : "transparent", color: isHighlight ? "#fff" : "#1a1a1a", border: isHighlight ? "none" : "1px solid #E0DDD8", cursor: "pointer" }}>{lt('pricing','startBtn',landingLocale)}</button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  ) : null;

  if (showcases.length === 0) {
    return (
      <>
        <section style={{ padding: "80px 24px 40px", background: "#F5F1EB", textAlign: "center", borderTop: "1px solid rgba(26,26,26,0.08)" }}>
          <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#999", letterSpacing: 3, marginBottom: 14, textTransform: "uppercase", fontWeight: 500 }}>THE WEDDING INVITATION</p>
          <h2 className="serif" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 400, color: "#1a1a1a", marginBottom: 12, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{landingLocale === 'ko' ? '이름을 입으면, 청첩장이 됩니다.' : 'Wear your names. It becomes an invitation.'}</h2>
          <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 14, color: "#888", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>{landingLocale === 'ko' ? '27개 테마 · AI 컨시어지 · 무제한 수정.' : '27 themes · AI concierge · unlimited edits.'}</p>
        </section>
        <section id="themes" ref={ref as React.RefObject<HTMLElement>} style={{ padding: "100px 0", borderTop: "1px solid #E8E5E0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px", textAlign: "center" }}>
          <div style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)" }}>
            <p style={{ fontSize: 13, color: "#bbb", letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" }}>Themes</p>
            <h2 className="serif" style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", marginBottom: 12 }}>{lt('themeShowcase','noShowH2',landingLocale)}</h2>
            <p style={{ fontSize: 14, color: "#999", lineHeight: 1.8, marginBottom: 32 }}>{lt('themeShowcase','noShowDesc',landingLocale)}</p>
            <button onClick={onLogin} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888", padding: "10px 24px", borderRadius: 8, border: "1px solid #E0DDD8", background: "transparent", cursor: "pointer" }}>{lt('themeShowcase','allThemes',landingLocale)} <ArrowRight size={14} /></button>
          </div>
        </div>
      </section>
      {pricingBlock}
      </>
    );
  }

  const current = showcases[activeIdx];
  const previewUrl = buildPreviewUrl(current.url);
  const hasInput = formData.groom || formData.bride || formData.date || formData.venue || formData.heroMedia;
  const filledCount = [formData.groom, formData.bride, formData.date, formData.venue, formData.heroMedia].filter(Boolean).length;

  return (
    <>
        <section style={{ padding: "80px 24px 40px", background: "#F5F1EB", textAlign: "center", borderTop: "1px solid rgba(26,26,26,0.08)" }}>
          <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#999", letterSpacing: 3, marginBottom: 14, textTransform: "uppercase", fontWeight: 500 }}>THE WEDDING INVITATION</p>
          <h2 className="serif" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 400, color: "#1a1a1a", marginBottom: 12, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{landingLocale === 'ko' ? '이름을 입으면, 청첩장이 됩니다.' : 'Wear your names. It becomes an invitation.'}</h2>
          <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 14, color: "#888", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>{landingLocale === 'ko' ? '27개 테마 · AI 컨시어지 · 무제한 수정.' : '27 themes · AI concierge · unlimited edits.'}</p>
        </section>
    <section id="themes" ref={ref as React.RefObject<HTMLElement>} style={{ padding: "100px 0", borderTop: "1px solid #E8E5E0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 56, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)" }}>
          <p style={{ fontSize: 13, color: "#bbb", letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" }}>Themes</p>
          <h2 className="serif" style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", marginBottom: 12 }}>{lt('themeShowcase','h2',landingLocale)}</h2>
          <p style={{ fontSize: 14, color: "#999", lineHeight: 1.8 }}>{lt('themeShowcase','desc',landingLocale)}</p>
        </div>
        <div className="theme-builder-grid" style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 56, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s" }}>
          <div style={{ width: 340, flexShrink: 0 }}>
            <button onClick={() => setFormOpen(p => !p)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", background: "none", border: "none", borderBottom: "1px solid #E8E5E0", cursor: "pointer", marginBottom: formOpen ? 16 : 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 600, letterSpacing: 0.3 }}>{lt('themeShowcase','inputLabel',landingLocale)}</p>
                {filledCount > 0 && !formOpen && <span style={{ fontSize: 10, color: "#fff", background: "#1a1a1a", borderRadius: 10, padding: "2px 8px", fontWeight: 500 }}>{filledCount}{lt('themeShowcase','inputCount',landingLocale)}</span>}
              </div>
              <ChevronDown size={16} color="#999" style={{ transform: formOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }} />
            </button>
            <div style={{ maxHeight: formOpen ? 500 : 0, overflow: "hidden", transition: "max-height 0.4s cubic-bezier(0.22,1,0.36,1)", opacity: formOpen ? 1 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #E8E5E0" }}>
                <div className="showcase-name-row" style={{ display: "flex", gap: 10 }}>
                  <input type="text" placeholder={lt("themeShowcase","groomPh",landingLocale)} value={formData.groom} onChange={e => updateForm("groom", e.target.value)} style={{ flex: 1, padding: "12px 14px", borderRadius: 8, border: "1px solid #E0DDD8", background: "#fff", fontSize: 13, color: "#1a1a1a", outline: "none" }} />
                  <input type="text" placeholder={lt("themeShowcase","bridePh",landingLocale)} value={formData.bride} onChange={e => updateForm("bride", e.target.value)} style={{ flex: 1, padding: "12px 14px", borderRadius: 8, border: "1px solid #E0DDD8", background: "#fff", fontSize: 13, color: "#1a1a1a", outline: "none" }} />
                </div>
                <input type="date" value={formData.date} onChange={e => updateForm("date", e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #E0DDD8", background: "#fff", fontSize: 13, color: formData.date ? "#1a1a1a" : "#bbb", outline: "none" }} />
                <input type="text" placeholder={lt("themeShowcase","venuePh",landingLocale)} value={formData.venue} onChange={e => updateForm("venue", e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #E0DDD8", background: "#fff", fontSize: 13, color: "#1a1a1a", outline: "none" }} />
                <div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} id="showcase-photo" />
                  {photoPreview ? (
                    <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid #E0DDD8" }}>
                      <img src={photoPreview} alt="" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} loading="lazy" decoding="async" />
                      {uploading && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 size={20} color="#999" style={{ animation: "spin 1s linear infinite" }} /></div>}
                      <button onClick={removePhoto} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={12} color="#fff" /></button>
                    </div>
                  ) : (
                    <label htmlFor="showcase-photo" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 8, border: "1px dashed #D0CCC6", background: "#FAFAF8", cursor: "pointer" }}>
                      <Camera size={16} color="#bbb" />
                      <span style={{ fontSize: 12, color: "#aaa" }}>{lt('themeShowcase','photoPh',landingLocale)}</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#999", marginBottom: 12, fontWeight: 500, letterSpacing: 0.5 }}>{lt('themeShowcase','themeLabel',landingLocale)}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24, maxHeight: 240, overflowY: "auto" }}>
              {showcases.map((s, i) => (
                <button key={i} onClick={() => setActiveIdx(i)} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: activeIdx === i ? "2px solid #1a1a1a" : "1px solid #E0DDD8", background: activeIdx === i ? "#F5F4F1" : "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.25s", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: activeIdx === i ? "#1a1a1a" : "#ddd", flexShrink: 0, transition: "all 0.25s" }} />
                  <div>
                    <p style={{ fontSize: 13, color: activeIdx === i ? "#1a1a1a" : "#666", fontWeight: activeIdx === i ? 600 : 400 }}>{s.name}</p>
                    {s.description && <p style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>{s.description}</p>}
                  </div>
                </button>
              ))}
            </div>
            {hasInput ? (
              <button onClick={onLogin} className="chat-msg-enter" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px 0", borderRadius: 10, background: "#1a1a1a", color: "#fff", fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer" }}>{lt('themeShowcase','startBtn',landingLocale)} <ArrowRight size={16} /></button>
            ) : (
              <p style={{ fontSize: 12, color: "#ccc", textAlign: "center" }}>{lt('themeShowcase','infoHint',landingLocale)}</p>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ width: 280, height: 580, borderRadius: 40, border: "6px solid #1a1a1a", background: "#000", padding: 2, boxShadow: "0 25px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: 34, overflow: "hidden", position: "relative", background: "#FAF9F7" }}>
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 100, height: 28, background: "#1a1a1a", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }} />
                {!iframeLoaded && <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, zIndex: 5 }}><Loader2 size={20} color="#bbb" style={{ animation: "spin 1s linear infinite" }} /><p style={{ fontSize: 11, color: "#bbb" }}>{lt('themeShowcase','loadingLabel',landingLocale)}</p></div>}
                <iframe key={`${activeIdx}-${iframeKey}`} src={previewUrl} onLoad={() => setIframeLoaded(true)} style={{ width: "100%", height: "100%", border: "none", opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.4s" }} title={`${current.name} 미리보기`} />
              </div>
            </div>
            <div style={{ position: "absolute", bottom: -32, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
              {showcases.map((_, i) => <button key={i} onClick={() => setActiveIdx(i)} style={{ width: activeIdx === i ? 20 : 6, height: 6, borderRadius: 3, background: activeIdx === i ? "#1a1a1a" : "#ddd", transition: "all 0.3s", border: "none", cursor: "pointer", padding: 0 }} />)}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 64 }}>
          <button onClick={onLogin} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888", padding: "10px 24px", borderRadius: 8, border: "1px solid #E0DDD8", background: "transparent", cursor: "pointer" }}>{lt('themeShowcase','allThemes',landingLocale)} <ArrowRight size={14} /></button>
        </div>
      </div>
    </section>
    {pricingBlock}
    </>
  );
}


export default function Landing() {
  const [searchParams] = useSearchParams();
  const [packages, setPackages] = useState<Package[]>([]);
  const [guides, setGuides] = useState<{ id: string; title: string; description: string | null; videoUrl: string; videoType?: string; category: string }[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<typeof guides[0] | null>(null);

  const [showThemeShowcase, setShowThemeShowcase] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [emailStep, setEmailStep] = useState<"email" | "code" | "password" | "setPassword">("email");
  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [_isNewUser, setIsNewUser] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: "", email: "", phone: "", type: "general", message: "" });
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const { locale: appLocale, setLocale: setAppLocale } = useLocaleStore();
  const [landingLocale, setLandingLocale] = useState<LandingLocale>(appLocale as LandingLocale);
  useEffect(() => { setLandingLocale(appLocale as LandingLocale); }, [appLocale]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "안녕하세요! 청첩장 작업실 웨딩이예요.\n\n결혼 준비하시나요? 축하드려요!\n궁금한 거 있으시면 편하게 물어보세요~" }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [visitorId] = useState(() => localStorage.getItem("visitorId") || `visitor_${Date.now()}`);
  const [greeting, setGreeting] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const [snapSamples, setSnapSamples] = useState<{ id: string; concept: string; imageUrl: string; mode: string }[]>([]);
  const [stats, setStats] = useState<{ totalSnaps: number; totalUsers: number } | null>(null);
  // Step 1 Hero 3-Act로 전환 시 미사용. 추후 다른 섹션에서 재활용 가능하도록 주석 보존.
  // const [heroShowcaseUrl, setHeroShowcaseUrl] = useState<string | undefined>(() => {
  //   try { return localStorage.getItem("heroShowcaseUrl") || undefined; } catch { return undefined; }
  // });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const isLoggedIn = !!localStorage.getItem("token");

  const [heroRef, heroInView] = useInView(0.05);

  useEffect(() => {
    if (searchParams.get("login") === "pair") setShowLoginModal(true);
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem("visitorId", visitorId);
    fetch(`${API}/payment/packages`).then(r => r.json()).then(setPackages).catch(() => {});
    fetch(`${API}/guide`).then(r => r.json()).then(setGuides).catch(() => {});
    fetch(`${API}/admin/snap-samples`).then(r => r.json()).then(setSnapSamples).catch(() => {});
    fetch(`${API}/public/stats`).then(r => r.json()).then(setStats).catch(() => {});
    // Step 1: Hero 3-Act는 heroShowcase 대신 snapSamples 사용. 아래 fetch는 주석으로 보존.
    // fetch(`${API}/public/hero-showcase`).then(r => r.json()).then((data: { url: string }) => {
    //   if (data.url) {
    //     setHeroShowcaseUrl(data.url);
    //     try { localStorage.setItem("heroShowcaseUrl", data.url); } catch {}
    //   }
    // }).catch(() => {});

  }, []);

  useEffect(() => { try { localStorage.setItem("landingLocale", landingLocale); } catch {} }, [landingLocale]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);
  useEffect(() => { document.body.style.overflow = chatOpen ? "hidden" : ""; }, [chatOpen]);
  useEffect(() => {
    const t1 = setTimeout(() => setGreeting(true), 3000);
    const t2 = setTimeout(() => setGreetingDismissed(true), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleLogin = (provider: "kakao" | "google") => { window.location.href = `${API}/oauth/${provider}`; };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch(`${API}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, visitorId }) });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.message, actions: data.actions }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "죄송해요, 잠시 문제가 생겼어요. 다시 시도해주세요!" }]);
    } finally { setChatLoading(false); }
  };

  const submitInquiry = async () => {
    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.message) return;
    setInquirySending(true);
    try {
      const res = await fetch(`${API}/public/inquiry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(inquiryForm) });
      if (res.ok) { setInquirySuccess(true); setInquiryForm({ name: "", email: "", phone: "", type: "general", message: "" }); setTimeout(() => { setShowInquiryForm(false); setInquirySuccess(false); }, 2000); }
    } catch (e) { console.error("Inquiry error:", e); }
    finally { setInquirySending(false); }
  };

  const handleCheckEmail = async () => {
    if (!emailInput || !emailInput.includes("@")) { setEmailError("유효한 이메일을 입력해주세요"); return; }
    setEmailLoading(true); setEmailError("");
    try {
      const res = await fetch(`${API}/email-auth/check-email`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailInput }) });
      const data = await res.json();
      if (data.exists && data.hasPassword) { setIsNewUser(false); setEmailStep("password"); }
      else { setIsNewUser(true); await handleSendCode(); }
    } catch { setEmailError("네트워크 오류가 발생했습니다"); } finally { setEmailLoading(false); }
  };

  const handleSendCode = async () => {
    setEmailLoading(true); setEmailError("");
    try {
      const res = await fetch(`${API}/email-auth/send-code`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailInput }) });
      if (res.ok) setEmailStep("code");
      else { const data = await res.json(); setEmailError(data.error || "발송 실패"); }
    } catch { setEmailError("네트워크 오류"); } finally { setEmailLoading(false); }
  };

  const handleVerifyCode = async () => {
    if (codeInput.length !== 6) { setEmailError("6자리 인증번호를 입력해주세요"); return; }
    setEmailLoading(true); setEmailError("");
    try {
      const res = await fetch(`${API}/email-auth/verify-code`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailInput, code: codeInput }) });
      const data = await res.json();
      if (res.ok && data.verified) setEmailStep("setPassword");
      else setEmailError(data.error || "인증 실패");
    } catch { setEmailError("네트워크 오류"); } finally { setEmailLoading(false); }
  };

  const handleEmailLogin = async () => {
    if (!passwordInput) { setEmailError("비밀번호를 입력해주세요"); return; }
    setEmailLoading(true); setEmailError("");
    try {
      const res = await fetch(`${API}/email-auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailInput, password: passwordInput }) });
      const data = await res.json();
      if (res.ok) { localStorage.setItem("token", data.token); window.location.href = "/dashboard"; }
      else setEmailError(data.error || "로그인 실패");
    } catch { setEmailError("네트워크 오류"); } finally { setEmailLoading(false); }
  };

  const handleRegister = async () => {
    if (!passwordInput || passwordInput.length < 6) { setEmailError("비밀번호는 6자 이상이어야 합니다"); return; }
    setEmailLoading(true); setEmailError("");
    try {
      const res = await fetch(`${API}/email-auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailInput, password: passwordInput }) });
      const data = await res.json();
      if (res.ok) { localStorage.setItem("token", data.token);
          const returnTo = localStorage.getItem("returnTo"); if (returnTo) { localStorage.removeItem("returnTo"); window.location.href = returnTo; return; } window.location.href = "/dashboard"; }
      else setEmailError(data.error || "회원가입 실패");
    } catch { setEmailError("네트워크 오류"); } finally { setEmailLoading(false); }
  };

  const openLogin = () => setShowLoginModal(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'true') {
      setShowLoginModal(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);


  return (
    <>
      <style>{`
        .showcase-tile { transition: transform 0.3s ease; }
        .showcase-tile:hover { transform: scale(1.02); }
        .showcase-tile:hover .showcase-overlay { opacity: 1 !important; }
        .engine-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.06); border-color: #1a1a1a !important; }
        .engine-card[href="/create"]:hover { background: #2a2a2a !important; }
        .proof-stat { animation: proofFade 1s ease-out both; }
        .proof-stat:nth-child(3) { animation-delay: 0.2s; }
        @keyframes proofFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @import url('${FONT_LINK}');
        @font-face { font-family: 'BookendBatang'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2410-2@1.0/TTBookendBatangR.woff2') format('woff2'); font-weight: 400; font-display: swap; }
        @font-face { font-family: 'BookendBatang'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2410-2@1.0/TTBookendBatangSB.woff2') format('woff2'); font-weight: 700; font-display: swap; }
        .serif { font-family: 'BookendBatang', 'Georgia', serif; }
        
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }
        .typing-dot { animation: typingBounce 1.2s infinite; }
        @keyframes chatEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .chat-msg-enter { animation: chatEnter 0.3s ease-out; }
        .nav-blur { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
          @media (max-width: 640px) {
            .nav-blur > div { padding: 10px 14px !important; }
            .nav-blur > div > div:first-child p:first-child { font-size: 13px !important; max-width: 120px; }
            .nav-blur > div > div:first-child p:last-child { display: none !important; }
            .nav-blur > div > div:last-child { gap: 8px !important; }
            .nav-blur > div > div:last-child a { display: none !important; }
            .nav-blur > div > div:last-child button:last-child { padding: 7px 14px !important; font-size: 11px !important; }
          }

        .landing-body ::-webkit-scrollbar { display: none; }
        .snap-pill::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .hero-flat { padding-top: 60px !important; }
          .hero-logo img { width: 200px !important; height: 200px !important; }
          .hero-title { font-size: clamp(48px, 12vw, 72px) !important; }
          .engine-grid { grid-template-columns: 1fr !important; }
          .showcase-rug { padding: 0 16px 8px !important; }
          .showcase-rug > a:first-child, .showcase-rug > div:first-child { width: 280px !important; }
          .showcase-rug > a:not(:first-child), .showcase-rug > div:not(:first-child) { width: 180px !important; }
          .hero-content { flex-direction: column-reverse !important; padding: 40px 24px 60px !important; min-height: calc(100vh - 60px) !important; gap: 32px !important; }
          .hero-left { flex: 1 1 auto !important; width: 100% !important; }
          .hero-right { flex: 0 0 auto !important; width: 100% !important; max-height: 40vh !important; }
          .hero-right img { max-width: 280px !important; }
          .hero-title { font-size: 52px !important; line-height: 1.05 !important; margin-bottom: 20px !important; }
          .hero-desc { font-size: 17px !important; }
          .hero-ctas { gap: 20px !important; }
          .hero-cta-primary { width: 100% !important; justify-content: center !important; }
          .hero-stats-inline { font-size: 11px !important; gap: 14px !important; flex-wrap: wrap !important; }
          .engine-grid { grid-template-columns: 1fr !important; }
          .showcase-rug { padding: 0 16px 8px !important; }
          .showcase-rug > a:first-child, .showcase-rug > div:first-child { width: 280px !important; }
          .showcase-rug > a:not(:first-child), .showcase-rug > div:not(:first-child) { width: 180px !important; }
          .chat-section { flex-direction: column !important; padding: 60px 20px !important; gap: 40px !important; }
          .idphoto-section { flex-direction: column !important; padding: 60px 20px !important; gap: 40px !important; }
          .idphoto-section > div { width: 100% !important; max-width: 100% !important; }
          .snap-section { flex-direction: column-reverse !important; padding: 60px 20px !important; gap: 40px !important; }
          .snap-text, .chat-text-col { max-width: 100% !important; }
          .specs-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .problem-grid { grid-template-columns: 1fr !important; }
          .theme-builder-grid { flex-direction: column-reverse !important; align-items: center !important; gap: 32px !important; padding: 0 4px !important; }
          .showcase-name-row { flex-direction: column !important; }
          .theme-builder-grid > div:first-child { width: 100% !important; max-width: 100% !important; padding: 0 16px !important; }
          .theme-builder-grid > div:last-child { transform: scale(0.75) !important; transform-origin: top center !important; margin-bottom: -100px !important; }
          .snap-pack-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .weddingai-grid { flex-direction: column !important; gap: 32px !important; }
          .weddingai-grid > div:first-child { min-width: 0 !important; width: 100% !important; word-break: keep-all !important; }
          .weddingai-grid > div:last-child { width: 100% !important; }
          .theme-builder-grid > div:first-child > div > div:first-child { flex-direction: column !important; }
          .theme-builder-grid > div:first-child { padding: 0 20px !important; }
          #themes > div { padding: 0 20px !important; }
          .footer-info { flex-direction: column !important; gap: 16px !important; }
          .serif { font-size: inherit !important; }
          section { padding-left: 20px !important; padding-right: 20px !important; }
          section h2.serif { font-size: 24px !important; line-height: 1.4 !important; word-break: keep-all !important; }
          section h3.serif { font-size: 22px !important; line-height: 1.4 !important; word-break: keep-all !important; }
        }
        @keyframes scrollHint { 0% { transform: scaleY(0); transform-origin: top; } 50% { transform: scaleY(1); transform-origin: top; } 51% { transform: scaleY(1); transform-origin: bottom; } 100% { transform: scaleY(0); transform-origin: bottom; } }
        .hero-scroll-indicator { animation: scrollHint 2s ease-in-out infinite; }

        .landing-product-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 640px) { .landing-product-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div className="landing-body" style={{ minHeight: "100vh", background: "#FAF9F7", overflowX: "hidden", fontFamily: "'Noto Sans KR', -apple-system, sans-serif", WebkitFontSmoothing: "antialiased" }}>

        <nav className="nav-blur" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,249,247,0.85)", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", letterSpacing: -0.3 }}>{lt('nav','brand',landingLocale)}</p>
              <p style={{ fontSize: 10, color: "#bbb", letterSpacing: 1 }}>{lt('nav','sub',landingLocale)}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <a href="#themes" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>{lt('nav','themes',landingLocale)}</a>
              <a href="#pricing" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>{lt('nav','pricing',landingLocale)}</a>
              <button onClick={() => (() => { const next = landingLocale === 'ko' ? 'en' : 'ko'; setLandingLocale(next); setAppLocale(next); })()} style={{ fontSize: 11, color: "#888", background: "none", border: "1px solid #E0DDD8", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}>{landingLocale === 'ko' ? 'EN' : 'KO'}</button>
              <button onClick={openLogin} style={{ fontSize: 12, color: "#fff", background: "#1a1a1a", padding: "8px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 500 }}>{lt('nav','start',landingLocale)}</button>
            </div>
          </div>
        </nav>

        <section ref={heroRef as React.RefObject<HTMLElement>} className="hero-flat" style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "#F5F1EB", paddingTop: 70 }}>

          <div className="hero-content" style={{ position: "relative", zIndex: 2, maxWidth: 920, margin: "0 auto", padding: "60px 48px 80px", minHeight: "calc(100vh - 70px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>

            <div className="hero-logo" style={{ marginBottom: 48, opacity: heroInView ? 1 : 0, transform: heroInView ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.98)", transition: "opacity 1.2s ease, transform 1.2s ease" }}>
              <img src="/logo.png" alt="Wedding Engine" style={{ width: 280, height: 280, objectFit: "contain", mixBlendMode: "multiply" }} loading="eager" />
            </div>

            <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#999", letterSpacing: 4, marginBottom: 28, textTransform: "uppercase", fontWeight: 500, opacity: heroInView ? 1 : 0, transition: "opacity 0.8s ease 0.2s" }}>Wedding AI Studio · 2026</p>

            <h1 className="hero-title" style={{ fontFamily: "Fraunces, Times New Roman, serif", fontSize: "clamp(56px, 10vw, 128px)", fontWeight: 300, fontStyle: "italic", lineHeight: 0.95, color: "#1a1a1a", letterSpacing: "-0.04em", marginBottom: 36, opacity: heroInView ? 1 : 0, transform: heroInView ? "translateY(0)" : "translateY(16px)", transition: "opacity 1s ease 0.3s, transform 1s ease 0.3s" }}>
              Wedding<br/>Engine
            </h1>

            <div style={{ width: 40, height: 1, background: "#1a1a1a", marginBottom: 32, opacity: heroInView ? 0.4 : 0, transition: "opacity 1s ease 0.5s" }} />

            <p className="hero-desc" style={{ fontFamily: "Pretendard, sans-serif", fontSize: "clamp(15px, 1.6vw, 18px)", color: "#333", lineHeight: 1.6, marginBottom: 8, fontWeight: 400, maxWidth: 520, opacity: heroInView ? 1 : 0, transform: heroInView ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s" }}>
              {lt('hero','h1_1',landingLocale)} {lt('hero','h1_2',landingLocale)} {lt('hero','h1_3',landingLocale)}
            </p>

            <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 13, color: "#999", marginBottom: 48, fontWeight: 400, opacity: heroInView ? 1 : 0, transition: "opacity 0.8s ease 0.75s" }}>
              {lt('hero','desc1',landingLocale)} · {lt('hero','desc2',landingLocale)}
            </p>

            <div className="hero-ctas" style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap", marginBottom: 56, opacity: heroInView ? 1 : 0, transform: heroInView ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.8s ease 0.9s, transform 0.8s ease 0.9s" }}>
              <a href="/ai-snap" className="hero-cta-primary" style={{ fontFamily: "Pretendard, sans-serif", display: "inline-flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500, color: "#1a1a1a", background: "transparent", padding: "16px 32px", border: "1px solid #1a1a1a", textDecoration: "none", transition: "all 0.25s ease" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#1a1a1a"; (e.currentTarget as HTMLElement).style.color = "#F5F1EB"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#1a1a1a"; }}>
                {lt('hero','btnCreate',landingLocale)}
                <ArrowRight size={14} />
              </a>
              <button onClick={() => setShowCreateModal(true)} style={{ fontFamily: "Pretendard, sans-serif", background: "transparent", border: "none", padding: "4px 0", fontSize: 14, fontWeight: 500, color: "#1a1a1a", cursor: "pointer", borderBottom: "1px solid #1a1a1a", lineHeight: 1.2 }}>
                {lt('hero','btnSnap',landingLocale)}
              </button>
            </div>

            <div className="hero-stats-inline" style={{ display: "flex", alignItems: "center", gap: 24, fontFamily: "Pretendard, sans-serif", fontSize: 12, color: "#888", letterSpacing: 0.5, opacity: heroInView ? 1 : 0, transition: "opacity 0.8s ease 1.05s" }}>
              <span><strong style={{ fontWeight: 600, color: "#1a1a1a" }}>54</strong> {lt('hero','statSnap',landingLocale)}</span>
              <span style={{ color: "#ccc" }}>·</span>
              <span><strong style={{ fontWeight: 600, color: "#1a1a1a" }}>41</strong> {lt('hero','statPaper',landingLocale)}</span>
              <span style={{ color: "#ccc" }}>·</span>
              <span><strong style={{ fontWeight: 600, color: "#1a1a1a" }}>27</strong> {lt('hero','statTheme',landingLocale)}</span>
            </div>

          </div>

        </section>
<section className="proof-bar" style={{ background: "#F5F1EB", padding: "48px 24px", borderTop: "1px solid rgba(26,26,26,0.06)", borderBottom: "1px solid rgba(26,26,26,0.06)", textAlign: "center", overflow: "hidden" }}>
          <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(32px, 6vw, 80px)", flexWrap: "wrap" }}>
            <div className="proof-stat" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <AnimatedNumber value={stats?.totalSnaps ?? 0} duration={1800} />
              <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#888", letterSpacing: 2, textTransform: "uppercase", margin: 0, fontWeight: 500 }}>AI Wedding Photos</p>
            </div>
            <div style={{ width: 1, height: 40, background: "rgba(26,26,26,0.12)" }} className="proof-divider" />
            <div className="proof-stat" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <AnimatedNumber value={stats?.totalUsers ?? 0} duration={1800} />
              <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#888", letterSpacing: 2, textTransform: "uppercase", margin: 0, fontWeight: 500 }}>Couples</p>
            </div>
          </div>
          <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 13, color: "#666", marginTop: 20, margin: "20px 0 0", fontWeight: 400, opacity: stats ? 1 : 0, transition: "opacity 1s ease 0.8s" }}>
            {landingLocale === 'en' ? 'Already created and counting.' : '지금 이 순간에도 만들어지고 있어요.'}
          </p>
        </section>

        <section className="pricing-strip" style={{ padding: "44px 24px", background: "#1a1a1a", textAlign: "center" }}>
          <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(20px, 4vw, 48px)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "rgba(245,241,235,0.5)", letterSpacing: 2, margin: 0, textTransform: "uppercase", fontWeight: 500 }}>{landingLocale === 'ko' ? '지금 시작하면' : 'Start now'}</p>
              <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: "clamp(16px, 2vw, 18px)", color: "#F5F1EB", margin: 0, fontWeight: 400, letterSpacing: "-0.01em" }}>
                {landingLocale === 'ko' ? (
                  <>첫 장 <span style={{ fontWeight: 600 }}>무료</span>. 그 다음부터 <span style={{ fontWeight: 600 }}>5,900원</span>.</>
                ) : (
                  <>First one <span style={{ fontWeight: 600 }}>free</span>. Then <span style={{ fontWeight: 600 }}>5,900 KRW</span>.</>
                )}
              </p>
            </div>
            <a href="/ai-snap" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#F5F1EB", color: "#1a1a1a", textDecoration: "none", fontFamily: "Pretendard, sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: 0.2, transition: "transform 0.2s ease" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
              {landingLocale === 'ko' ? '무료로 시작하기' : 'Start for free'}
              <span>→</span>
            </a>
          </div>
        </section>



<section className="snap-showcase" style={{ padding: "100px 0 120px", background: "#FAF9F7" }}>
          <div style={{ maxWidth: 1600, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48, padding: "0 24px" }}>
              <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#999", letterSpacing: 3, marginBottom: 12, textTransform: "uppercase" }}>{snapSamples.length > 0 ? Array.from(new Set(snapSamples.map(s => s.concept))).length + " CONCEPTS" : "54 CONCEPTS"}</p>
              <h2 className="serif" style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, color: "#1a1a1a", marginBottom: 10, letterSpacing: "-0.02em" }}>{landingLocale === 'ko' ? '셀카 하나가 이렇게 됩니다.' : 'One selfie, endless outcomes.'}</h2>
              <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 13, color: "#888" }}>{landingLocale === 'ko' ? '스와이프하여 둘러보세요' : 'Swipe to browse'}</p>
            </div>

            <div className="showcase-rug" style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", padding: "0 24px 8px", scrollbarWidth: "none" }}>
              {snapSamples.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ flexShrink: 0, width: i === 0 ? 400 : 240, aspectRatio: i === 0 ? "4 / 5" : "3 / 4", borderRadius: 10, background: "linear-gradient(135deg, #E8E4DE 0%, #D5CEC5 100%)", opacity: 0.4, scrollSnapAlign: "start" }} />
                ))
              ) : (
                Array.from(new Map(snapSamples.map(s => [s.concept, s])).values()).map((s, i) => (
                  <a key={s.id} href="/ai-snap" className="showcase-tile" style={{ flexShrink: 0, width: i === 0 ? 400 : 240, aspectRatio: i === 0 ? "4 / 5" : "3 / 4", borderRadius: 10, overflow: "hidden", position: "relative", display: "block", background: "url(" + s.imageUrl + ") center/cover", cursor: "pointer", textDecoration: "none", scrollSnapAlign: "start" }}>
                    <div className="showcase-overlay" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 45%)", opacity: i === 0 ? 1 : 0, transition: "opacity 0.3s ease", display: "flex", alignItems: "flex-end", padding: 18 }}>
                      <div>
                        {i === 0 && <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: 2, margin: "0 0 6px", textTransform: "uppercase", fontWeight: 500 }}>Featured</p>}
                        <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: i === 0 ? 18 : 13, color: "#fff", fontWeight: i === 0 ? 500 : 500, margin: 0, letterSpacing: -0.2 }}>{conceptLabel(s.concept)}</p>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>

            <div style={{ textAlign: "center", marginTop: 48, padding: "0 24px" }}>
              <a href="/ai-snap" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "Pretendard, sans-serif", fontSize: 14, fontWeight: 500, color: "#1a1a1a", padding: "16px 32px", border: "1px solid #1a1a1a", textDecoration: "none", transition: "all 0.25s ease" }} onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#1a1a1a"; el.style.color = "#F5F1EB"; }} onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "#1a1a1a"; }}>
                {landingLocale === 'ko' ? '무료로 1장 만들어보기' : 'Try 1 for free'}
                <span>→</span>
              </a>
            </div>
          </div>
        </section>

        <a href="/id-photo" className="idphoto-hook" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "28px 24px", background: "#F5F1EB", borderTop: "1px solid rgba(26,26,26,0.06)", borderBottom: "1px solid rgba(26,26,26,0.06)", textDecoration: "none", transition: "background 0.2s ease" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EEE9E0"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F5F1EB"; }}>
          <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 13, color: "#666", fontWeight: 400, letterSpacing: 0.2 }}>{landingLocale === 'ko' ? '정합도 높은 사진을 원하신다면?' : 'Need higher-fidelity photos?'}</span>
          <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 13, color: "#1a1a1a", fontWeight: 500, letterSpacing: 0.2 }}>{landingLocale === 'ko' ? 'AI 프로필 촬영' : 'AI Portrait'}</span>
          <span style={{ fontSize: 13, color: "#1a1a1a" }}>→</span>
        </a>





        <section style={{ padding: "120px 0 100px", borderTop: "1px solid #E8E5E0", background: "#FAF9F7" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#999", letterSpacing: 3, marginBottom: 12, textTransform: "uppercase" }}>THE ENGINE</p>
              <h2 className="serif" style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 400, color: "#1a1a1a", marginBottom: 12, letterSpacing: "-0.02em" }}>{lt('engine','h2',landingLocale)}</h2>
              <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 14, color: "#888" }}>{lt('engine','desc',landingLocale)}</p>
            </div>

            <div className="engine-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>

              <a href="/ai-snap" className="engine-card" style={{ textDecoration: "none", padding: "40px 32px", borderRadius: 20, border: "1px solid #E8E5E0", background: "#fff", display: "flex", flexDirection: "column", gap: 14, minHeight: 280, transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#bbb", letterSpacing: 2, fontWeight: 500 }}>01 · AI WEDDING SNAP</span>
                  <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#1a1a1a", padding: "4px 10px", borderRadius: 100, background: "#F5F1EB", fontWeight: 500 }}>54 concepts</span>
                </div>
                <p className="serif" style={{ fontSize: 26, fontWeight: 400, color: "#1a1a1a", marginBottom: 4, letterSpacing: "-0.02em" }}>{landingLocale === 'ko' ? '셀카가 화보가 됩니다' : 'A selfie becomes a wedding photo'}</p>
                <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 13, color: "#888", lineHeight: 1.65, flex: 1 }}>{landingLocale === 'ko' ? '한복·스튜디오·셀카·시네마틱까지 54개 컨셉. 스튜디오 촬영 없이 완성.' : 'Hanbok, studio, selfie, cinematic — 54 concepts. Without a photoshoot.'}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #F0EDE8" }}>
                  <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 12, color: "#666", fontWeight: 500 }}>{landingLocale === 'ko' ? '5,900원부터 · 무료 체험 1장' : 'From 5,900 KRW · 1 free trial'}</span>
                  <span style={{ fontSize: 14, color: "#1a1a1a" }}>→</span>
                </div>
              </a>

              <a href="/prewedding-video" className="engine-card" style={{ textDecoration: "none", padding: "40px 32px", borderRadius: 20, border: "1px solid #E8E5E0", background: "#fff", display: "flex", flexDirection: "column", gap: 14, minHeight: 280, transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#bbb", letterSpacing: 2, fontWeight: 500 }}>02 · WEDDING CINEMA</span>
                  <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#1a1a1a", padding: "4px 10px", borderRadius: 100, background: "#F5F1EB", fontWeight: 500 }}>3–10 min</span>
                </div>
                <p className="serif" style={{ fontSize: 26, fontWeight: 400, color: "#1a1a1a", marginBottom: 4, letterSpacing: "-0.02em" }}>{landingLocale === 'ko' ? '사진이 영화가 됩니다' : 'Photos become a cinema'}</p>
                <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 13, color: "#888", lineHeight: 1.65, flex: 1 }}>{landingLocale === 'ko' ? '사진만 올리면 AI가 자막·음악을 입혀 3~10분 시네마를 완성합니다.' : 'Upload photos, AI layers subtitles and music into a 3–10 min cinema.'}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #F0EDE8" }}>
                  <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 12, color: "#666", fontWeight: 500 }}>{landingLocale === 'ko' ? '29,000원부터' : 'From 29,000 KRW'}</span>
                  <span style={{ fontSize: 14, color: "#1a1a1a" }}>→</span>
                </div>
              </a>

              <a href="/poster" className="engine-card" style={{ textDecoration: "none", padding: "40px 32px", borderRadius: 20, border: "1px solid #E8E5E0", background: "#fff", display: "flex", flexDirection: "column", gap: 14, minHeight: 280, transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#bbb", letterSpacing: 2, fontWeight: 500 }}>03 · WEDDING POSTER</span>
                  <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#1a1a1a", padding: "4px 10px", borderRadius: 100, background: "#F5F1EB", fontWeight: 500 }}>41 concepts</span>
                </div>
                <p className="serif" style={{ fontSize: 26, fontWeight: 400, color: "#1a1a1a", marginBottom: 4, letterSpacing: "-0.02em" }}>{landingLocale === 'ko' ? '사진이 포스터가 됩니다' : 'Photos become a poster'}</p>
                <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 13, color: "#888", lineHeight: 1.65, flex: 1 }}>{landingLocale === 'ko' ? '영화 포스터 같은 웨딩 포스터. 41개 컨셉 · 30초 생성.' : 'Movie poster meets wedding. 41 concepts, generated in 30 sec.'}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #F0EDE8" }}>
                  <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 12, color: "#666", fontWeight: 500 }}>{landingLocale === 'ko' ? '3,000원부터' : 'From 3,000 KRW'}</span>
                  <span style={{ fontSize: 14, color: "#1a1a1a" }}>→</span>
                </div>
              </a>

              <a href="/create" className="engine-card" style={{ textDecoration: "none", padding: "40px 32px", borderRadius: 20, border: "1px solid #1a1a1a", background: "#1a1a1a", display: "flex", flexDirection: "column", gap: 14, minHeight: 280, transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "rgba(245,241,235,0.5)", letterSpacing: 2, fontWeight: 500 }}>04 · INVITATION</span>
                  <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 11, color: "#1a1a1a", padding: "4px 10px", borderRadius: 100, background: "#F5F1EB", fontWeight: 500 }}>27 themes</span>
                </div>
                <p className="serif" style={{ fontSize: 26, fontWeight: 400, color: "#F5F1EB", marginBottom: 4, letterSpacing: "-0.02em" }}>{landingLocale === 'ko' ? '그리고, 청첩장까지' : 'And the invitation, too'}</p>
                <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 13, color: "rgba(245,241,235,0.6)", lineHeight: 1.65, flex: 1 }}>{landingLocale === 'ko' ? 'AI 컨시어지가 탑재된 모바일 청첩장. 종이·QR카드 무료 포함.' : 'Mobile invitation with AI concierge. Free paper cards & QR included.'}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid rgba(245,241,235,0.1)" }}>
                  <span style={{ fontFamily: "Pretendard, sans-serif", fontSize: 12, color: "rgba(245,241,235,0.7)", fontWeight: 500 }}>{landingLocale === 'ko' ? '9,900원부터' : 'From 9,900 KRW'}</span>
                  <span style={{ fontSize: 14, color: "#F5F1EB" }}>→</span>
                </div>
              </a>

            </div>
          </div>
        </section>

        <ThemeShowcase onLogin={openLogin} landingLocale={landingLocale} packages={packages} onStartCreate={() => setShowCreateModal(true)} />
        <footer style={{ borderTop: "1px solid #E8E5E0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 48px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>청첩장 작업실</p>
              <p style={{ fontSize: 10, color: "#ccc", letterSpacing: 1 }}>WEDDING ENGINE</p>
            </div>
            <div style={{ display: "flex", gap: 24, marginBottom: 28, flexWrap: "wrap" }}>
              {[{ l: lt("footer","notice",landingLocale), h: "/notice" }, { l: lt("footer","faq",landingLocale), h: "/faq" }, { l: lt("footer","terms",landingLocale), h: "/terms" }, { l: lt("footer","privacy",landingLocale), h: "/privacy" }, { l: lt("footer","refund",landingLocale), h: "/refund-policy" }].map((link) => (
                <a key={link.l} href={link.h} style={{ fontSize: 12, color: "#888", textDecoration: "none" }}>{link.l}</a>
              ))}
            </div>
            <div className="footer-info" style={{ display: "flex", justifyContent: "space-between", gap: 40, flexWrap: "wrap", marginBottom: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <p style={{ fontSize: 11, color: "#bbb" }}><span style={{ color: "#999" }}>상호</span> 청첩장작업실</p>
                <p style={{ fontSize: 11, color: "#bbb" }}><span style={{ color: "#999" }}>대표</span> 이다겸</p>
                <p style={{ fontSize: 11, color: "#bbb" }}><span style={{ color: "#999" }}>사업자등록번호</span> 413-03-96815</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <p style={{ fontSize: 11, color: "#bbb" }}><span style={{ color: "#999" }}>주소</span> 부산광역시 부산진구 전포대로 224번길 22</p>
                <p style={{ fontSize: 11, color: "#bbb" }}><span style={{ color: "#999" }}>연락처</span> 010-2768-3187</p>
                <p style={{ fontSize: 11, color: "#bbb" }}><span style={{ color: "#999" }}>이메일</span> mail@weddingshop.cloud</p>
                <p style={{ fontSize: 11, color: "#bbb" }}><span style={{ color: "#999" }}>통신판매업신고</span> 제2026-부산진-0007741호</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, borderTop: "1px solid #F0EFEC" }}>
              <p style={{ fontSize: 11, color: "#ccc" }}>{lt('footer','made',landingLocale)}</p>
              <div style={{ display: "flex", gap: 20 }}>
                <a href="https://instagram.com/weddingstudiolab" target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#bbb", textDecoration: "none" }}>Instagram</a>
                <a href="https://pf.kakao.com/_xkaQxon" target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#bbb", textDecoration: "none" }}>KakaoTalk</a>
              </div>
            </div>
          </div>
        </footer>

      </div>

      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        {greeting && !greetingDismissed && !chatOpen && (
          <div className="chat-msg-enter" style={{ padding: "10px 16px", borderRadius: "14px 14px 4px 14px", background: "#fff", border: "1px solid #E8E5E0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", maxWidth: 220, position: "relative" }}>
            <button onClick={() => setGreetingDismissed(true)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#eee", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={10} color="#999" /></button>
            <p style={{ fontSize: 12, color: "#555" }}>{lt('chatBot','greeting',landingLocale)}</p>
          </div>
        )}
        <button onClick={() => { setChatOpen(true); setGreetingDismissed(true); }} style={{ width: 52, height: 52, borderRadius: "50%", background: "#1a1a1a", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
          <Sparkles size={20} color="#fff" />
        </button>
      </div>

      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setChatOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50 }} className="md:hidden" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} style={{ position: "fixed", inset: 0, zIndex: 50, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }} className="md:!inset-auto md:!bottom-24 md:!right-6 md:!w-[380px] md:!h-[520px] md:!rounded-2xl md:!shadow-2xl">
              <div style={{ padding: "16px", background: "#1a1a1a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={16} /></div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>웨딩이</p>
                    <p style={{ fontSize: 11, color: "#666" }}>청첩장 상담 AI</p>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 8 }}><X size={20} /></button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "85%" }}>
                      <div style={{ padding: "12px 16px", borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: msg.role === "user" ? "#2C2C2C" : "#F5F4F1", color: msg.role === "user" ? "#fff" : "#555", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </div>
                      {msg.actions && msg.actions.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                          {msg.actions.map((act, i) => (
                            <button key={i} onClick={() => { if (act.action === "external") window.open(act.url, "_blank"); else if (act.action === "navigate") window.location.href = act.url || "/"; }} style={{ padding: "8px 16px", borderRadius: 100, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none", background: act.style === "primary" ? "#1a1a1a" : act.style === "kakao" ? "#FEE500" : "#fff", color: act.style === "primary" ? "#fff" : act.style === "kakao" ? "#191919" : "#555", boxShadow: act.style === "primary" || act.style === "kakao" ? "none" : "inset 0 0 0 1px #E0DDD8" }}>
                              {act.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ padding: "14px 20px", borderRadius: "4px 16px 16px 16px", background: "#F5F4F1" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[0, 150, 300].map(d => <span key={d} className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#bbb", animationDelay: `${d}ms` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: 16, borderTop: "1px solid #E8E5E0", flexShrink: 0 }}>
                <button onClick={() => { if (!isLoggedIn) { if (confirm("로그인이 필요한 서비스입니다. 로그인 하시겠습니까?")) window.location.href = "/dashboard"; } else setShowInquiryForm(true); }} style={{ width: "100%", marginBottom: 10, padding: "8px 0", fontSize: 12, color: "#999", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <MessageCircle size={13} />
                  {lt('chatBot','inquiry',landingLocale)}
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) sendChat(); }} onFocus={() => window.scrollTo(0, 0)} placeholder={landingLocale === "en" ? "Type a message..." : "메시지를 입력하세요..."} style={{ flex: 1, padding: "12px 16px", borderRadius: 24, border: "1px solid #E0DDD8", background: "#F5F4F1", fontSize: 13, outline: "none" }} />
                  <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ width: 44, height: 44, borderRadius: "50%", background: "#1a1a1a", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: chatLoading || !chatInput.trim() ? 0.4 : 1 }}><Send size={16} color="#fff" /></button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showLoginModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowLoginModal(false)} />
          <div style={{ position: "relative", background: "#fff", borderRadius: 16, padding: "36px 32px", width: "100%", maxWidth: 380, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <button onClick={() => setShowLoginModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#bbb" }}><X size={20} /></button>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 6, textAlign: "center" }}>{lt('modal','loginTitle',landingLocale)}</h3>
            <p style={{ fontSize: 13, color: "#999", marginBottom: 24, textAlign: "center" }}>{lt('modal','loginDesc',landingLocale)}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => { setShowLoginModal(false); handleLogin("kakao"); }} style={{ width: "100%", padding: "13px 0", background: "#FEE500", color: "#3C1E1E", borderRadius: 10, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.3 4.54 6.7-.2.74-.73 2.64-.84 3.05-.13.5.18.5.39.36.16-.1 2.59-1.76 3.63-2.47.74.1 1.5.16 2.28.16 5.52 0 10-3.58 10-8s-4.48-8-10-8z" /></svg>
                {lt('modal','kakao',landingLocale)}
              </button>
              <button onClick={() => { setShowLoginModal(false); handleLogin("google"); }} style={{ width: "100%", padding: "13px 0", background: "#fff", color: "#555", borderRadius: 10, border: "1px solid #E0DDD8", fontWeight: 500, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                {lt('modal','google',landingLocale)}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0" }}>
                <div style={{ flex: 1, height: 1, background: "#E8E5E0" }} />
                <span style={{ fontSize: 12, color: "#bbb" }}>{lt("modal","or",landingLocale)}</span>
                <div style={{ flex: 1, height: 1, background: "#E8E5E0" }} />
              </div>
              <button onClick={() => { setShowLoginModal(false); setShowEmailLogin(true); }} style={{ width: "100%", padding: "13px 0", background: "#fff", color: "#555", borderRadius: 10, border: "1px solid #E0DDD8", fontWeight: 500, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Mail size={18} />
                {lt("modal","email",landingLocale)}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmailLogin && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowEmailLogin(false)} />
          <div style={{ position: "relative", background: "#fff", borderRadius: 16, padding: "36px 32px", width: "100%", maxWidth: 380, margin: "0 16px" }}>
            <button onClick={() => { setShowEmailLogin(false); setEmailStep("email"); setEmailInput(""); setCodeInput(""); setPasswordInput(""); setEmailError(""); }} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#bbb" }}><X size={20} /></button>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, background: "#F5F4F1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Mail size={22} color="#555" /></div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>{emailStep === "setPassword" ? "비밀번호 설정" : emailStep === "password" ? "로그인" : "이메일로 시작하기"}</h3>
              <p style={{ fontSize: 13, color: "#999", marginTop: 4 }}>{emailStep === "email" ? "이메일을 입력해주세요" : emailStep === "code" ? "인증번호를 입력해주세요" : emailStep === "password" ? "비밀번호를 입력해주세요" : "사용할 비밀번호를 설정해주세요"}</p>
            </div>
            {emailStep === "email" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="이메일 주소" onKeyDown={(e) => e.key === "Enter" && handleCheckEmail()} style={{ width: "100%", padding: "13px 16px", border: "1px solid #E0DDD8", borderRadius: 10, fontSize: 13, outline: "none" }} />
                {emailError && <p style={{ fontSize: 12, color: "#E53E3E" }}>{emailError}</p>}
                <button onClick={handleCheckEmail} disabled={emailLoading} style={{ width: "100%", padding: "13px 0", background: "#1a1a1a", color: "#fff", borderRadius: 10, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: emailLoading ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>{emailLoading && <Loader2 size={16} className="animate-spin" />}계속하기</button>
              </div>
            )}
            {emailStep === "password" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 12, color: "#999", textAlign: "center" }}>{emailInput}</p>
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="비밀번호" onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()} style={{ width: "100%", padding: "13px 16px", border: "1px solid #E0DDD8", borderRadius: 10, fontSize: 13, outline: "none" }} />
                {emailError && <p style={{ fontSize: 12, color: "#E53E3E" }}>{emailError}</p>}
                <button onClick={handleEmailLogin} disabled={emailLoading} style={{ width: "100%", padding: "13px 0", background: "#1a1a1a", color: "#fff", borderRadius: 10, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: emailLoading ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>{emailLoading && <Loader2 size={16} className="animate-spin" />}로그인</button>
                <button onClick={() => { setEmailStep("email"); setPasswordInput(""); setEmailError(""); }} style={{ background: "none", border: "none", fontSize: 12, color: "#999", cursor: "pointer", padding: "8px 0" }}>다른 이메일로 변경</button>
              </div>
            )}
            {emailStep === "code" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 12, color: "#999", textAlign: "center" }}>{emailInput}</p>
                <input type="text" value={codeInput} onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="인증번호 6자리" onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()} style={{ width: "100%", padding: "13px 16px", border: "1px solid #E0DDD8", borderRadius: 10, fontSize: 20, outline: "none", textAlign: "center", letterSpacing: "0.5em" }} />
                {emailError && <p style={{ fontSize: 12, color: "#E53E3E", textAlign: "center" }}>{emailError}</p>}
                <button onClick={handleVerifyCode} disabled={emailLoading || codeInput.length !== 6} style={{ width: "100%", padding: "13px 0", background: "#1a1a1a", color: "#fff", borderRadius: 10, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: emailLoading || codeInput.length !== 6 ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>{emailLoading && <Loader2 size={16} className="animate-spin" />}확인</button>
                <button onClick={handleSendCode} disabled={emailLoading} style={{ background: "none", border: "none", fontSize: 12, color: "#999", cursor: "pointer", padding: "8px 0" }}>인증번호 다시 받기</button>
              </div>
            )}
            {emailStep === "setPassword" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 12, color: "#999", textAlign: "center" }}>{emailInput}</p>
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="비밀번호 (6자 이상)" onKeyDown={(e) => e.key === "Enter" && handleRegister()} style={{ width: "100%", padding: "13px 16px", border: "1px solid #E0DDD8", borderRadius: 10, fontSize: 13, outline: "none" }} />
                {emailError && <p style={{ fontSize: 12, color: "#E53E3E" }}>{emailError}</p>}
                <button onClick={handleRegister} disabled={emailLoading || passwordInput.length < 6} style={{ width: "100%", padding: "13px 0", background: "#1a1a1a", color: "#fff", borderRadius: 10, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: emailLoading || passwordInput.length < 6 ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>{emailLoading && <Loader2 size={16} className="animate-spin" />}회원가입 완료</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showInquiryForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowInquiryForm(false)} />
          <div style={{ position: "relative", background: "#fff", borderRadius: 16, padding: "32px", width: "100%", maxWidth: 420, maxHeight: "90vh", overflowY: "auto" }}>
            {inquirySuccess ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ width: 56, height: 56, background: "#ECFDF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Check size={24} color="#059669" /></div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 6 }}>문의가 접수되었습니다</h3>
                <p style={{ fontSize: 13, color: "#999" }}>빠른 시일 내에 답변 드릴게요!</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>1:1 문의</h3>
                  <button onClick={() => setShowInquiryForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb" }}><X size={20} /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 6 }}>이름 *</label>
                    <input type="text" value={inquiryForm.name} onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })} style={{ width: "100%", padding: "12px 14px", border: "1px solid #E0DDD8", borderRadius: 10, fontSize: 13, outline: "none" }} placeholder="홍길동" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 6 }}>이메일 *</label>
                    <input type="email" value={inquiryForm.email} onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })} style={{ width: "100%", padding: "12px 14px", border: "1px solid #E0DDD8", borderRadius: 10, fontSize: 13, outline: "none" }} placeholder="example@email.com" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 6 }}>연락처</label>
                    <input type="tel" value={inquiryForm.phone} onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })} style={{ width: "100%", padding: "12px 14px", border: "1px solid #E0DDD8", borderRadius: 10, fontSize: 13, outline: "none" }} placeholder="010-1234-5678" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 6 }}>문의 유형</label>
                    <select value={inquiryForm.type} onChange={(e) => setInquiryForm({ ...inquiryForm, type: e.target.value })} style={{ width: "100%", padding: "12px 14px", border: "1px solid #E0DDD8", borderRadius: 10, fontSize: 13, outline: "none", background: "#fff" }}>
                      <option value="general">일반 문의</option>
                      <option value="custom">커스텀 청첩장</option>
                      <option value="video">영상 문의</option>
                      <option value="payment">결제 문의</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 6 }}>문의 내용 *</label>
                    <textarea value={inquiryForm.message} onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })} style={{ width: "100%", padding: "12px 14px", border: "1px solid #E0DDD8", borderRadius: 10, fontSize: 13, outline: "none", height: 120, resize: "none" }} placeholder="문의하실 내용을 자세히 적어주세요" />
                  </div>
                  <button onClick={submitInquiry} disabled={inquirySending || !inquiryForm.name || !inquiryForm.email || !inquiryForm.message} style={{ width: "100%", padding: "13px 0", background: "#1a1a1a", color: "#fff", borderRadius: 10, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: inquirySending || !inquiryForm.name || !inquiryForm.email || !inquiryForm.message ? 0.5 : 1 }}>
                    {inquirySending ? "전송 중..." : "문의하기"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedGuide && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedGuide(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", maxWidth: 800, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #E8E5E0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontWeight: 600, color: "#1a1a1a" }}>{selectedGuide.title}</p>
                <button onClick={() => setSelectedGuide(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb" }}><X size={20} /></button>
              </div>
              <div style={{ flex: 1, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {selectedGuide.videoType === "YOUTUBE" ? (
                  <iframe src={selectedGuide.videoUrl} style={{ width: "100%", aspectRatio: "16/9" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                ) : (
                  <video src={selectedGuide.videoUrl} controls autoPlay style={{ maxWidth: "100%", maxHeight: "70vh" }} />
                )}
              </div>
              {selectedGuide.description && (
                <div style={{ padding: "14px 20px", borderTop: "1px solid #E8E5E0" }}>
                  <p style={{ fontSize: 13, color: "#999" }}>{selectedGuide.description}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {showCreateModal && (
        <div onClick={() => setShowCreateModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, maxWidth: 420, width: "100%", overflow: "hidden" }}>
            <div style={{ padding: "28px 24px 8px", textAlign: "center" }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{lt('modal','createTitle',landingLocale)}</p>
              <p style={{ fontSize: 13, color: "#999" }}>{lt('modal','createDesc',landingLocale)}</p>
            </div>
            <div style={{ padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="/ai-create" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderRadius: 12, border: "2px solid #1a1a1a", background: "#fafaf9", textDecoration: "none", transition: "all 0.15s" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Sparkles size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>{lt('modal','aiCreate',landingLocale)}</p>
                  <p style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{lt('modal','aiCreateDesc',landingLocale)}</p>
                </div>
              </a>
              <a href="/create" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderRadius: 12, border: "1px solid #e5e2dd", background: "#fff", textDecoration: "none", transition: "all 0.15s" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f5f4f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ArrowRight size={20} color="#1a1a1a" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>{lt('modal','manual',landingLocale)}</p>
                  <p style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{lt('modal','manualDesc',landingLocale)}</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      <ThemeShowcaseModal isOpen={showThemeShowcase} onClose={() => setShowThemeShowcase(false)} />
    </>
  );
}
