import { useLocaleStore } from '../store/useLocaleStore';
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Check, Sparkles, Heart, MapPin, Calendar,
  Send, Copy, CreditCard, Camera, ChevronDown, Film, Gift, MessageCircle, Zap, X,
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
  'AI 웨딩스냅 39컨셉': 'AI Snap 39 concepts',
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

import HighlightVideoSection from "../components/HighlightVideoSection";

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

const CHAT_SEQUENCE_KO = [
  { q: "주차 어디로 가면 되나요?", a: "그랜드컨벤션 지하 2층 무료 주차장 이용 가능합니다. 만차 시 인근 공영주차장도 도보 2분 거리에 있어요.", delay: 800 },
  { q: "식사는 몇 시부터 가능한가요?", a: "2시 30분부터 식사 가능합니다. 뷔페식으로 준비되어 있으며 예식 후에도 여유롭게 이용하실 수 있어요.", delay: 400 },
  { q: "축의금 계좌 알려주세요", a: "신랑 측 카카오뱅크 3333-12-XXXXXX (김현우)입니다. 아래 카카오페이 송금 버튼으로 바로 보내실 수도 있어요.", delay: 400 },
];

let CHAT_SEQUENCE = CHAT_SEQUENCE_KO;

const CHAT_SEQUENCE_EN = [
  { q: "Where should I park?", a: "Free parking is available at Grand Convention B2. If it's full, there's a public lot within a 2-minute walk.", delay: 800 },
  { q: "When does the meal start?", a: "Meal service begins at 2:30 PM. It's a buffet, so you can enjoy it even after the ceremony.", delay: 400 },
  { q: "Can I get the gift account?", a: "Groom's side: KakaoBank 3333-12-XXXXXX (Hyunwoo Kim). You can also send via KakaoPay below.", delay: 400 },
];





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

function PhoneMockup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div style={{ width: 280, height: 580, borderRadius: 40, border: "6px solid #1a1a1a", background: "#000", padding: 2, boxShadow: "0 25px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 34, overflow: "hidden", background: "#fff", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 100, height: 28, background: "#1a1a1a", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }} />
          {children}
        </div>
      </div>
    </div>
  );
}

function HeroPhone({ url }: { url?: string }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!url) return;
    try {
      const origin = new URL(url).origin;
      if (!document.querySelector(`link[href="${origin}"]`)) {
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = origin;
        document.head.appendChild(link);
      }
    } catch {}
  }, [url]);
  return (
    <PhoneMockup>
      {url ? (
        <div style={{ position: "absolute", inset: 0 }}>
          {!loaded && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FAF9F7", zIndex: 2, gap: 16 }}>
              <div style={{ width: "70%", aspectRatio: "3/4", borderRadius: 4, background: "linear-gradient(135deg, #EDE9E3 0%, #E0DDD8 100%)", animation: "pulse 1.8s ease-in-out infinite" }} />
              <div style={{ width: 60, height: 1, background: "#D4CFC8" }} />
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 40, height: 10, borderRadius: 2, background: "#E0DDD8" }} />
                <div style={{ fontSize: 12, color: "#ccc" }}>&</div>
                <div style={{ width: 40, height: 10, borderRadius: 2, background: "#E0DDD8" }} />
              </div>
              <div style={{ width: 80, height: 8, borderRadius: 2, background: "#E8E5E0", marginTop: 4 }} />
              <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
            </div>
          )}
          <iframe
            src={url}
            onLoad={() => setLoaded(true)}
            style={{ width: "100%", height: "100%", border: "none", opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease" }}
            title="청첩장 미리보기"
            loading="eager"
          />
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div className="hero-scroll-content" style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <div style={{ background: "linear-gradient(180deg, #F4F1EC 0%, #E8EBE4 100%)", minHeight: 1200, padding: "60px 24px 40px" }}>
              <div style={{ textAlign: "center", paddingTop: 20 }}>
                <div style={{ width: 40, height: 1, background: "#7C8C6E", margin: "0 auto 20px", opacity: 0.5 }} />
                <p style={{ fontFamily: "'BookendBatang', serif", fontSize: 13, letterSpacing: 3, color: "#7C8C6E", textTransform: "uppercase", marginBottom: 24 }}>Wedding Invitation</p>
                <h3 style={{ fontFamily: "'BookendBatang', serif", fontSize: 28, fontWeight: 300, color: "#2C2C2C", lineHeight: 1.4, marginBottom: 4 }}>현우</h3>
                <p style={{ fontFamily: "'BookendBatang', serif", fontSize: 16, color: "#999", margin: "8px 0" }}>&</p>
                <h3 style={{ fontFamily: "'BookendBatang', serif", fontSize: 28, fontWeight: 300, color: "#2C2C2C", lineHeight: 1.4, marginBottom: 20 }}>수빈</h3>
                <p style={{ fontSize: 12, color: "#888", letterSpacing: 1.5, marginBottom: 28 }}>2025. 06. 14 SAT PM 2:00</p>
              </div>
              <div style={{ width: "100%", height: 240, borderRadius: 4, background: "linear-gradient(135deg, #D4C5B0 0%, #B8A88A 50%, #C4B496 100%)", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Heart size={20} color="#fff" strokeWidth={1} style={{ opacity: 0.7 }} />
              </div>
              <div style={{ textAlign: "center", padding: "16px 0", borderTop: "1px solid rgba(124,140,110,0.15)", borderBottom: "1px solid rgba(124,140,110,0.15)", marginBottom: 24 }}>
                <p style={{ fontSize: 13, color: "#666", lineHeight: 2 }}>서로의 마음을 확인하고<br />하나의 길을 함께 걸으려 합니다</p>
              </div>
              <div style={{ padding: "16px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <MapPin size={14} color="#7C8C6E" />
                  <p style={{ fontSize: 12, color: "#555" }}>그랜드컨벤션 3층 그랜드홀</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <Calendar size={14} color="#7C8C6E" />
                  <p style={{ fontSize: 12, color: "#555" }}>2025년 6월 14일 토요일 오후 2시</p>
                </div>
                <div style={{ width: "100%", height: 140, borderRadius: 4, background: "#E8E5E0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontSize: 11, color: "#aaa", letterSpacing: 1 }}>MAP</p>
                </div>
              </div>
              <div style={{ marginTop: 20, padding: "20px 0", borderTop: "1px solid rgba(124,140,110,0.15)" }}>
                <p style={{ fontSize: 12, color: "#888", textAlign: "center", marginBottom: 16 }}>참석 여부를 알려주세요</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, padding: "12px 0", borderRadius: 4, background: "#7C8C6E", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: "#fff" }}>참석</p>
                  </div>
                  <div style={{ flex: 1, padding: "12px 0", borderRadius: 4, border: "1px solid #ddd", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: "#888" }}>미정</p>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 20, padding: "20px 0", borderTop: "1px solid rgba(124,140,110,0.15)" }}>
                <p style={{ fontSize: 12, color: "#888", textAlign: "center", marginBottom: 16 }}>축의금 안내</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, padding: "10px", borderRadius: 4, border: "1px solid #e0e0e0", textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}>신랑 측</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <Copy size={10} color="#999" />
                      <p style={{ fontSize: 11, color: "#666" }}>계좌복사</p>
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: "10px", borderRadius: 4, border: "1px solid #e0e0e0", textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}>신부 측</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <CreditCard size={10} color="#999" />
                      <p style={{ fontSize: 11, color: "#666" }}>카카오페이</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PhoneMockup>
  );
}

function AiChatDemo({ landingLocale }: { landingLocale: LandingLocale }) {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<{ type: string; text: string }[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  const runSequence = useCallback(() => {
    setMessages([]);
    setStep(0);
    setTyping(false);
  }, []);

  useEffect(() => {
    if (step >= CHAT_SEQUENCE.length) {
      const t = setTimeout(runSequence, 3500);
      return () => clearTimeout(t);
    }
    const item = CHAT_SEQUENCE[step];
    const t1 = setTimeout(() => {
      setMessages(prev => [...prev, { type: "user", text: item.q }]);
      setTyping(true);
    }, item.delay);
    const t2 = setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { type: "ai", text: item.a }]);
      setStep(prev => prev + 1);
    }, item.delay + 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [step, runSequence]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, typing]);

  return (
    <PhoneMockup>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "#FAF9F7" }}>
        <div style={{ padding: "44px 16px 12px", borderBottom: "1px solid #E8E5E0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #2C2C2C, #555)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={14} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{landingLocale === 'en' ? 'AI Wedding Concierge' : 'AI 웨딩 비서'}</p>
            <p style={{ fontSize: 10, color: "#7C8C6E" }}>{landingLocale === 'en' ? 'Hyunwoo & Subin Wedding' : '현우 · 수빈 결혼식'}</p>
          </div>
          <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#7C8C6E" }} />
        </div>
        <div ref={chatRef} style={{ flex: 1, overflow: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ alignSelf: "flex-start", maxWidth: "82%", padding: "10px 14px", borderRadius: "4px 16px 16px 16px", background: "#fff", border: "1px solid #E8E5E0" }}>
            <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{landingLocale === 'en' ? "Hi! Feel free to ask anything about Hyunwoo & Subin's wedding." : '안녕하세요! 현우 · 수빈 결혼식에 대해 궁금한 점이 있으시면 편하게 물어보세요.'}</p>
          </div>
          {messages.map((msg, i) => (
            msg.type === "user" ? (
              <div key={i} className="chat-msg-enter" style={{ alignSelf: "flex-end", maxWidth: "75%", padding: "10px 14px", borderRadius: "16px 4px 16px 16px", background: "#2C2C2C" }}>
                <p style={{ fontSize: 12, color: "#fff", lineHeight: 1.5 }}>{msg.text}</p>
              </div>
            ) : (
              <div key={i} className="chat-msg-enter" style={{ alignSelf: "flex-start", maxWidth: "82%", padding: "10px 14px", borderRadius: "4px 16px 16px 16px", background: "#fff", border: "1px solid #E8E5E0" }}>
                <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{msg.text}</p>
              </div>
            )
          ))}
          {typing && (
            <div style={{ alignSelf: "flex-start", padding: "12px 18px", borderRadius: "4px 16px 16px 16px", background: "#fff", border: "1px solid #E8E5E0" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 200, 400].map(d => <span key={d} className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#bbb", animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "10px 14px 24px", borderTop: "1px solid #E8E5E0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 24, border: "1px solid #E0DDD8", background: "#fff" }}>
            <p style={{ flex: 1, fontSize: 12, color: "#bbb" }}>{landingLocale === 'en' ? 'Type a message' : '메시지를 입력하세요'}</p>
            <Send size={16} color="#ccc" />
          </div>
        </div>
      </div>
    </PhoneMockup>
  );
}

function ScenarioCard({ item, index, parentInView }: { item: { q: string; a: string }; index: number; parentInView: boolean }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (!parentInView) return;
    const t = setTimeout(() => setShowAnswer(true), 1200 + index * 1800);
    return () => clearTimeout(t);
  }, [parentInView, index]);

  useEffect(() => {
    if (!showAnswer) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedText(item.a.slice(0, i));
      if (i >= item.a.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [showAnswer, item.a]);

  return (
    <div style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid #E8E5E0", background: "#FAFAF8", opacity: parentInView ? 1 : 0, transform: parentInView ? "translateY(0)" : "translateY(12px)", transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 400}ms` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: showAnswer ? 8 : 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#E8E5E0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
          <MessageCircle size={9} color="#999" />
        </div>
        <p style={{ fontSize: 12, color: "#999" }}>{item.q}</p>
      </div>
      {showAnswer && (
        <div className="chat-msg-enter" style={{ display: "flex", alignItems: "flex-start", gap: 8, paddingLeft: 26 }}>
          <ArrowRight size={10} color="#bbb" style={{ marginTop: 3, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{typedText}<span style={{ opacity: typedText.length < item.a.length ? 1 : 0, transition: "opacity 0.3s" }}>|</span></p>
        </div>
      )}
    </div>
  );
}


function ThemeShowcase({ onLogin, landingLocale }: { onLogin: () => void; landingLocale: LandingLocale }) {
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

  if (showcases.length === 0) {
    return (
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
    );
  }

  const current = showcases[activeIdx];
  const previewUrl = buildPreviewUrl(current.url);
  const hasInput = formData.groom || formData.bride || formData.date || formData.venue || formData.heroMedia;
  const filledCount = [formData.groom, formData.bride, formData.date, formData.venue, formData.heroMedia].filter(Boolean).length;

  return (
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
                      <img src={photoPreview} alt="" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
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
  );
}


export default function Landing() {
  const [searchParams] = useSearchParams();
  const [packages, setPackages] = useState<Package[]>([]);
  const [reviews, setReviews] = useState<{ id: string; rating: number; content: string; source: string; groomName: string; brideName: string; packageName: string | null; createdAt: string }[]>([]);
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
  CHAT_SEQUENCE = landingLocale === 'en' ? CHAT_SEQUENCE_EN : CHAT_SEQUENCE_KO;
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "안녕하세요! 청첩장 작업실 웨딩이예요.\n\n결혼 준비하시나요? 축하드려요!\n궁금한 거 있으시면 편하게 물어보세요~" }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [visitorId] = useState(() => localStorage.getItem("visitorId") || `visitor_${Date.now()}`);
  const [greeting, setGreeting] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const [snapSamples, setSnapSamples] = useState<{ id: string; concept: string; imageUrl: string; mode: string }[]>([]);
  const [selectedSnap, setSelectedSnap] = useState<string | null>(null);
  const [heroShowcaseUrl, setHeroShowcaseUrl] = useState<string | undefined>(() => {
    try { return localStorage.getItem("heroShowcaseUrl") || undefined; } catch { return undefined; }
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const isLoggedIn = !!localStorage.getItem("token");

  const [heroRef, heroInView] = useInView(0.05);
  const [problemRef, problemInView] = useInView(0.15);
  const [engineRef, engineInView] = useInView(0.1);
  const [chatSectionRef, chatSectionInView] = useInView(0.1);
  const [snapRef, snapInView] = useInView(0.1);
  const [specRef, specInView] = useInView(0.1);
  const [pricingRef, pricingInView] = useInView(0.1);
  const [ctaRef, ctaInView] = useInView(0.1);

  useEffect(() => {
    if (searchParams.get("login") === "pair") setShowLoginModal(true);
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem("visitorId", visitorId);
    fetch(`${API}/payment/packages`).then(r => r.json()).then(setPackages).catch(() => {});
    fetch(`${API}/public/reviews`).then(r => r.json()).then(setReviews).catch(() => {});
    fetch(`${API}/guide`).then(r => r.json()).then(setGuides).catch(() => {});
    fetch(`${API}/admin/snap-samples`).then(r => r.json()).then(setSnapSamples).catch(() => {});
    fetch(`${API}/public/hero-showcase`).then(r => r.json()).then((data: { url: string }) => {
      if (data.url) {
        setHeroShowcaseUrl(data.url);
        try { localStorage.setItem("heroShowcaseUrl", data.url); } catch {}
      }
    }).catch(() => {});

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

  const specs = [
    { num: lt('spec','s1num',landingLocale), label: lt('spec','s1label',landingLocale), desc: lt('spec','s1desc',landingLocale) },
    { num: lt('spec','s2num',landingLocale), label: lt('spec','s2label',landingLocale), desc: lt('spec','s2desc',landingLocale) },
    { num: lt('spec','s3num',landingLocale), label: lt('spec','s3label',landingLocale), desc: lt('spec','s3desc',landingLocale) },
    { num: lt('spec','s4num',landingLocale), label: lt('spec','s4label',landingLocale), desc: lt('spec','s4desc',landingLocale) },
    { num: lt('spec','s5num',landingLocale), label: lt('spec','s5label',landingLocale), desc: lt('spec','s5desc',landingLocale) },
    { num: lt('spec','s6num',landingLocale), label: lt('spec','s6label',landingLocale), desc: lt('spec','s6desc',landingLocale) },
  ];

  return (
    <>
      <style>{`
        @import url('${FONT_LINK}');
        @font-face { font-family: 'BookendBatang'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2410-2@1.0/TTBookendBatangR.woff2') format('woff2'); font-weight: 400; font-display: swap; }
        @font-face { font-family: 'BookendBatang'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2410-2@1.0/TTBookendBatangSB.woff2') format('woff2'); font-weight: 700; font-display: swap; }
        .serif { font-family: 'BookendBatang', 'Georgia', serif; }
        @keyframes heroScroll { 0%, 8% { transform: translateY(0); } 42%, 58% { transform: translateY(calc(-100% + 580px)); } 92%, 100% { transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hero-scroll-content { animation: heroScroll 8s cubic-bezier(0.45,0,0.55,1) infinite; }
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
          @media (max-width: 640px) {
            .hero-btns { flex-direction: column !important; width: 100%; }
            .hero-btns button, .hero-btns a { width: 100% !important; justify-content: center !important; padding: 14px 20px !important; font-size: 14px !important; box-sizing: border-box; }
            .hero-stats { gap: 20px !important; }
          }
        .landing-body ::-webkit-scrollbar { display: none; }
        .snap-pill::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; text-align: center !important; padding: 100px 20px 60px !important; gap: 40px !important; }
          .hero-text h1 { font-size: 26px !important; line-height: 1.4 !important; letter-spacing: -0.3px !important; }
          .hero-stats { justify-content: center !important; }
          .hero-btns { justify-content: center !important; }
          .engine-grid { grid-template-columns: 1fr !important; }
          .chat-section { flex-direction: column !important; padding: 60px 20px !important; gap: 40px !important; }
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
          .theme-builder-grid > div:first-child > div > div:first-child { flex-direction: column !important; }
          .theme-builder-grid > div:first-child { padding: 0 20px !important; }
          #themes > div { padding: 0 20px !important; }
          .footer-info { flex-direction: column !important; gap: 16px !important; }
        }
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

        <section ref={heroRef as React.RefObject<HTMLElement>} className="hero-grid" style={{ maxWidth: 1200, margin: "0 auto", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "120px 48px 80px", gap: 60 }}>
          <div className="hero-text" style={{ maxWidth: 540, opacity: heroInView ? 1 : 0, transform: heroInView ? "translateY(0)" : "translateY(30px)", transition: "all 0.8s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 100, border: "1px solid #E0DDD8", marginBottom: 28, background: "#fff" }}>
              <Zap size={11} color="#999" />
              <p style={{ fontSize: 11, color: "#888", letterSpacing: 0.3 }}>{lt('hero','badge',landingLocale)}</p>
            </div>
            <h1 className="serif" style={{ fontSize: landingLocale === 'en' ? 46 : 42, fontWeight: 400, lineHeight: landingLocale === 'en' ? 1.2 : 1.35, color: "#1a1a1a", marginBottom: 24, letterSpacing: landingLocale === 'en' ? -1.5 : -0.5 }}>
              {lt('hero','h1_1',landingLocale)}<br />
              <span style={{ color: "#999" }}>{lt('hero','h1_2',landingLocale)}<br />{lt('hero','h1_3',landingLocale)}</span> {lt('hero','h1_4',landingLocale)}
            </h1>
            <p style={{ fontSize: 15, color: "#777", lineHeight: 1.8, marginBottom: 36 }}>
              {lt('hero','desc1',landingLocale)}<br />
              {lt('hero','desc2',landingLocale)}
            </p>
            <div className="hero-btns" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48, flexWrap: "wrap" }}>
              <button onClick={() => setShowCreateModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "#fff", background: "#1a1a1a", padding: "14px 28px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 500 }}>
                {lt('hero','btnCreate',landingLocale)}
                <ArrowRight size={16} />
              </button>
              <a href="/ai-snap" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "#1a1a1a", background: "#fff", padding: "14px 28px", borderRadius: 8, border: "1px solid #E0DDD8", textDecoration: "none", fontWeight: 500 }}>
                <Camera size={16} />
                {lt('hero','btnSnap',landingLocale)}
              </a>
              <a href="/prewedding-video" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "#1a1a1a", background: "#fff", padding: "14px 28px", borderRadius: 8, border: "1px solid #E0DDD8", textDecoration: "none", fontWeight: 500 }}>
                <Film size={16} />
                {landingLocale === 'ko' ? '식전영상' : 'Pre-ceremony Video'}
              </a>

            </div>
            <p style={{ fontSize: 12, color: "#bbb", marginTop: 12 }}>{lt('hero','noLogin',landingLocale)}</p>
            <div className="hero-stats" style={{ display: "flex", gap: 36, paddingTop: 32, borderTop: "1px solid #E8E5E0", marginTop: 32 }}>
              {[["26", lt('hero','statTheme',landingLocale)], ["39", lt('hero','statSnap',landingLocale)], ["10", lt('hero','statPaper',landingLocale)]].map(([n, l]) => (
                <div key={l}>
                  <p className="serif" style={{ fontSize: 28, fontWeight: 200, color: "#1a1a1a" }}>{n}</p>
                  <p style={{ fontSize: 11, color: "#aaa", marginTop: 2, letterSpacing: 0.5 }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ opacity: heroInView ? 1 : 0, transform: heroInView ? "translateY(0)" : "translateY(40px)", transition: "all 1s cubic-bezier(0.22,1,0.36,1) 0.2s" }}>
            <HeroPhone url={heroShowcaseUrl} />
          </div>
        </section>

        <section ref={problemRef as React.RefObject<HTMLElement>} style={{ padding: "80px 48px", borderTop: "1px solid #E8E5E0" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", opacity: problemInView ? 1 : 0, transform: problemInView ? "translateY(0)" : "translateY(20px)", transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)" }}>
            <p style={{ fontSize: 13, color: "#bbb", letterSpacing: 1, marginBottom: 20, textTransform: "uppercase" }}>{lt('problem','tag',landingLocale)}</p>
            <h2 className="serif" style={{ fontSize: 30, fontWeight: 400, color: "#1a1a1a", lineHeight: 1.5, marginBottom: 20 }}>{lt('problem','h2_1',landingLocale)}<br />{lt('problem','h2_2',landingLocale)}</h2>
            <p style={{ fontSize: 14, color: "#999", lineHeight: 1.8, marginBottom: 40 }}>{lt('problem','desc1',landingLocale)}<br />{lt('problem','desc2',landingLocale)}</p>
            <div className="problem-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, textAlign: "left" }}>
              {[
                { icon: <MessageCircle size={18} />, title: lt("problem","card1Title",landingLocale), desc: lt("problem","card1Desc",landingLocale) },
                { icon: <Copy size={18} />, title: lt("problem","card2Title",landingLocale), desc: lt("problem","card2Desc",landingLocale) },
                { icon: <MapPin size={18} />, title: lt("problem","card3Title",landingLocale), desc: lt("problem","card3Desc",landingLocale) },
              ].map((item, i) => (
                <div key={i} style={{ padding: 24, borderRadius: 12, border: "1px solid #E8E5E0", background: "#fff", opacity: problemInView ? 1 : 0, transform: problemInView ? "translateY(0)" : "translateY(15px)", transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${200 + i * 100}ms` }}>
                  <div style={{ color: "#bbb", marginBottom: 12 }}>{item.icon}</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 6 }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: "#999", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="engine" ref={engineRef as React.RefObject<HTMLElement>} style={{ padding: "80px 48px", background: "#F5F4F1", borderTop: "1px solid #E8E5E0", borderBottom: "1px solid #E8E5E0" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48, opacity: engineInView ? 1 : 0, transform: engineInView ? "translateY(0)" : "translateY(20px)", transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)" }}>
              <p style={{ fontSize: 13, color: "#bbb", letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>{lt('engine','tag',landingLocale)}</p>
              <h2 className="serif" style={{ fontSize: 30, fontWeight: 400, color: "#1a1a1a", marginBottom: 12 }}>{lt('engine','h2',landingLocale)}</h2>
              <p style={{ fontSize: 14, color: "#999" }}>{lt('engine','desc',landingLocale)}</p>
            </div>
            <div className="engine-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { icon: <MessageCircle size={20} color="#1a1a1a" />, tag: lt("engine","e1Tag",landingLocale), title: lt("engine","e1Title",landingLocale), desc: lt("engine","e1Desc",landingLocale), features: [lt("engine","e1f1",landingLocale), lt("engine","e1f2",landingLocale), lt("engine","e1f3",landingLocale), lt("engine","e1f4",landingLocale)], delay: 0.15 },
                { icon: <Camera size={20} color="#1a1a1a" />, tag: lt("engine","e2Tag",landingLocale), title: lt("engine","e2Title",landingLocale), desc: lt("engine","e2Desc",landingLocale), features: [lt("engine","e2f1",landingLocale), lt("engine","e2f2",landingLocale), lt("engine","e2f3",landingLocale), lt("engine","e2f4",landingLocale)], delay: 0.3 },
              ].map((e, i) => (
                <div key={i} style={{ padding: "40px 36px", borderRadius: 16, background: "#fff", border: "1px solid #E8E5E0", opacity: engineInView ? 1 : 0, transform: engineInView ? "translateY(0)" : "translateY(20px)", transition: `all 0.7s cubic-bezier(0.22,1,0.36,1) ${e.delay}s` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F5F4F1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>{e.icon}</div>
                  <p style={{ fontSize: 12, color: "#bbb", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>{e.tag}</p>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>{e.title}</h3>
                  <p style={{ fontSize: 14, color: "#888", lineHeight: 1.8, marginBottom: 20, whiteSpace: "pre-line" }}>{e.desc}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {e.features.map((f, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Check size={12} color="#bbb" strokeWidth={2.5} />
                        <p style={{ fontSize: 12, color: "#666" }}>{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "100px 48px", borderTop: "1px solid #E8E5E0" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontSize: 13, color: "#bbb", letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" }}>{lt('features','tag',landingLocale)}</p>
              <h2 className="serif" style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", marginBottom: 12 }}>{lt('features','h2',landingLocale)}</h2>
              <p style={{ fontSize: 14, color: "#999" }}>{lt('features','desc',landingLocale)}</p>
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", padding: "4px 0 16px", scrollbarWidth: "none" }}>
              {[
                { title: lt('featureCards','f1t',landingLocale), desc: lt('featureCards','f1d',landingLocale), tag: lt('featureCards','tag1',landingLocale) },
                { title: lt('featureCards','f2t',landingLocale), desc: lt('featureCards','f2d',landingLocale), tag: lt('featureCards','tag2',landingLocale) },
                { title: lt('featureCards','f3t',landingLocale), desc: lt('featureCards','f3d',landingLocale), tag: lt('featureCards','tag3',landingLocale) },
                { title: lt('featureCards','f4t',landingLocale), desc: lt('featureCards','f4d',landingLocale), tag: lt('featureCards','tag4',landingLocale) },
                { title: lt('featureCards','f5t',landingLocale), desc: lt('featureCards','f5d',landingLocale), tag: lt('featureCards','tag5',landingLocale) },
                { title: lt('featureCards','f6t',landingLocale), desc: lt('featureCards','f6d',landingLocale), tag: lt('featureCards','tag6',landingLocale) },
                { title: lt('featureCards','f7t',landingLocale), desc: lt('featureCards','f7d',landingLocale), tag: lt('featureCards','tag7',landingLocale) },
                { title: lt('featureCards','f8t',landingLocale), desc: lt('featureCards','f8d',landingLocale), tag: lt('featureCards','tag8',landingLocale) },
                { title: lt('featureCards','f9t',landingLocale), desc: lt('featureCards','f9d',landingLocale), tag: lt('featureCards','tag9',landingLocale) },
                { title: lt('featureCards','f10t',landingLocale), desc: lt('featureCards','f10d',landingLocale), tag: lt('featureCards','tag10',landingLocale) },
                { title: lt('featureCards','f11t',landingLocale), desc: lt('featureCards','f11d',landingLocale), tag: lt('featureCards','tag11',landingLocale) },
                { title: lt('featureCards','f12t',landingLocale), desc: lt('featureCards','f12d',landingLocale), tag: lt('featureCards','tag12',landingLocale) },
              ].map((f, i) => (
                <div key={i} style={{ minWidth: 220, padding: "24px 20px", borderRadius: 14, border: "1px solid #E8E5E0", background: "#fff", scrollSnapAlign: "start", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{f.title}</p>
                    <span style={{ fontSize: 10, color: "#888", padding: "3px 10px", borderRadius: 100, background: "#F5F4F1", fontWeight: 500 }}>{f.tag}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section ref={chatSectionRef as React.RefObject<HTMLElement>} className="chat-section" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "100px 48px", gap: 72 }}>
          <div className="chat-text-col" style={{ maxWidth: 440, opacity: chatSectionInView ? 1 : 0, transform: chatSectionInView ? "translateY(0)" : "translateY(30px)", transition: "all 0.8s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 100, border: "1px solid #E0DDD8", marginBottom: 24, background: "#F5F4F1" }}>
              <Sparkles size={11} color="#999" />
              <p style={{ fontSize: 11, color: "#888" }}>AI Reception</p>
            </div>
            <h2 className="serif" style={{ fontSize: 34, fontWeight: 400, lineHeight: 1.4, color: "#1a1a1a", marginBottom: 16 }}>{lt('chat','h2_1',landingLocale)}<br />{lt('chat','h2_2',landingLocale)}</h2>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.9, marginBottom: 32 }}>{lt('chat','desc1',landingLocale)}<br />{lt('chat','desc2',landingLocale)}</p>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 11, color: "#bbb", letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>{lt('chat','scenario',landingLocale)}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(landingLocale === 'en' ? CHAT_SEQUENCE_EN : CHAT_SEQUENCE_KO).map((item, i) => (
                  <ScenarioCard key={i} item={item} index={i} parentInView={chatSectionInView} />
                ))}
              </div>
            </div>
            <div style={{ padding: "16px 20px", borderRadius: 10, background: "#1a1a1a" }}>
              <p style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{lt('chat','premiumLabel',landingLocale)}</p>
              <p style={{ fontSize: 14, color: "#fff" }}>{lt('chat','premiumDesc',landingLocale)}<span style={{ fontWeight: 600 }}>{lt('chat','premiumBold',landingLocale)}</span>{lt('chat','premiumIncl',landingLocale)}</p>
              <p className="serif" style={{ fontSize: 24, fontWeight: 400, color: "#fff", marginTop: 8 }}>29,900<span style={{ fontSize: 13, color: "#666", fontFamily: "'Noto Sans KR', sans-serif" }}>원</span></p>
            </div>
          </div>
          <div style={{ opacity: chatSectionInView ? 1 : 0, transform: chatSectionInView ? "translateY(0)" : "translateY(40px)", transition: "all 1s cubic-bezier(0.22,1,0.36,1) 0.2s" }}>
            <AiChatDemo landingLocale={landingLocale} />
          </div>
        </section>

        <section ref={snapRef as React.RefObject<HTMLElement>} className="snap-section" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "100px 48px", gap: 72, borderTop: "1px solid #E8E5E0" }}>
          <div style={{ opacity: snapInView ? 1 : 0, transform: snapInView ? "translateY(0)" : "translateY(30px)", transition: "all 0.8s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ width: 480, overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", paddingBottom: 8, scrollbarWidth: "none" }} >
                {(() => {
                  const showcaseConcepts = ["studio_classic", "studio_gallery", "studio_fog", "studio_mocha", "studio_sage", "black_swan", "water_memory", "velvet_rouge", "blue_hour", "magazine_cover", "hanbok_wonsam", "hanbok_dangui", "hanbok_modern", "hanbok_saeguk", "hanbok_flower", "cruise_sunset", "cruise_bluesky", "retro_hongkong", "vintage_record", "iphone_selfie", "iphone_mirror"];
                  const fallbacks = [
                    { label: "스튜디오 클래식", gradient: "linear-gradient(135deg, #E8E4DE 0%, #D5CEC5 100%)" },
                    { label: "갤러리", gradient: "linear-gradient(135deg, #E8E4DE 0%, #F5F2ED 100%)" },
                    { label: "포그", gradient: "linear-gradient(135deg, #D5CEC5 0%, #E8E2DA 100%)" },
                    { label: "모카", gradient: "linear-gradient(135deg, #3E2C23 0%, #6B4E3D 100%)" },
                    { label: "세이지", gradient: "linear-gradient(135deg, #5C6B4E 0%, #8A9A72 100%)" },
                    { label: "블랙스완", gradient: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)" },
                    { label: "물의 기억", gradient: "linear-gradient(135deg, #0D4F4F 0%, #1A7A6D 100%)" },
                    { label: "벨벳 루즈", gradient: "linear-gradient(135deg, #6B1D2A 0%, #8B2F3F 100%)" },
                    { label: "블루아워", gradient: "linear-gradient(135deg, #1B2838 0%, #2C4A6E 100%)" },
                    { label: "매거진 커버", gradient: "linear-gradient(135deg, #2C2C2C 0%, #4A4A4A 100%)" },
                    { label: "궁중혼례", gradient: "linear-gradient(135deg, #8B6914 0%, #C4956A 100%)" },
                    { label: "당의 한복", gradient: "linear-gradient(135deg, #B8A088 0%, #D4C4A8 100%)" },
                    { label: "모던 한복", gradient: "linear-gradient(135deg, #7C8C6E 0%, #A0B090 100%)" },
                    { label: "사극풍", gradient: "linear-gradient(135deg, #6B4226 0%, #8B6240 100%)" },
                    { label: "꽃한복", gradient: "linear-gradient(135deg, #C48B9F 0%, #D4A0B0 100%)" },
                    { label: "크루즈 선셋", gradient: "linear-gradient(135deg, #B08968 0%, #D4B896 100%)" },
                    { label: "크루즈 블루", gradient: "linear-gradient(135deg, #4A7C9B 0%, #6A9CB8 100%)" },
                    { label: "레트로 홍콩", gradient: "linear-gradient(135deg, #8B2020 0%, #C44040 100%)" },
                    { label: "빈티지 레코드", gradient: "linear-gradient(135deg, #8B7355 0%, #B09070 100%)" },
                    { label: "셀카 스냅", gradient: "linear-gradient(135deg, #5A6B7A 0%, #8A9BAA 100%)" },
                    { label: "거울 셀카", gradient: "linear-gradient(135deg, #6A6A6A 0%, #9A9A9A 100%)" },
                  ];
                  return showcaseConcepts.map((concept, i) => {
                    const sample = snapSamples.find(s => s.concept === concept);
                    return (
                      <div key={i} style={{ minWidth: 200, height: 280, borderRadius: 14, background: sample ? `url(${sample.imageUrl}) center/cover` : fallbacks[i].gradient, display: "flex", alignItems: "flex-end", padding: 16, position: "relative", overflow: "hidden", cursor: "pointer", scrollSnapAlign: "start", flexShrink: 0 }} onClick={() => setSelectedSnap(selectedSnap === concept ? null : concept)}>
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 100%)" }} />
                        <p style={{ fontSize: 13, color: "#fff", position: "relative", fontWeight: 500, letterSpacing: 0.5 }}>{fallbacks[i].label}</p>
                      </div>
                    );
                  });
                })()}
              </div>
              <p style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "#bbb" }}>
                {snapSamples.length > 0 ? `${snapSamples.length}개 샘플 등록됨` : "39개 컨셉 — 스와이프하여 둘러보기"}
              </p>
            </div>
            {selectedSnap && snapSamples.filter(s => s.concept === selectedSnap).length > 0 && (
              <div style={{ marginTop: 12, display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {snapSamples.filter(s => s.concept === selectedSnap).map(s => (
                  <div key={s.id} style={{ flexShrink: 0, width: 100, height: 130, borderRadius: 8, overflow: "hidden", border: "1px solid #E8E5E0" }}>
                    <img src={s.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="snap-text" style={{ maxWidth: 440, opacity: snapInView ? 1 : 0, transform: snapInView ? "translateY(0)" : "translateY(30px)", transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 100, border: "1px solid #E0DDD8", marginBottom: 24, background: "#F5F4F1" }}>
              <Camera size={11} color="#999" />
              <p style={{ fontSize: 11, color: "#888" }}>AI Wedding Snap</p>
            </div>
            <h2 className="serif" style={{ fontSize: 34, fontWeight: 400, lineHeight: 1.4, color: "#1a1a1a", marginBottom: 8 }}>{lt('snap','h2_1',landingLocale)}<br />{lt('snap','h2_2',landingLocale)}</h2>
            <p className="serif" style={{ fontSize: 20, fontWeight: 300, color: "#aaa", marginBottom: 20 }}>{lt('snap','sub',landingLocale)}</p>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.9, marginBottom: 24 }}>{lt('snap','desc1',landingLocale)}<br />{lt('snap','desc2',landingLocale)}</p>
            <div style={{ padding: "16px 18px", borderRadius: 10, border: "1px solid #E8E5E0", background: "#FAFAF8", marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>{lt('snap','boxTitle',landingLocale)}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[lt("snap","boxF1",landingLocale), lt("snap","boxF2",landingLocale), lt("snap","boxF3",landingLocale)].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={11} color="#bbb" strokeWidth={2.5} />
                    <p style={{ fontSize: 12, color: "#666" }}>{t}</p>
                  </div>
                ))}
              </div>
            </div>
            <a href="/ai-snap" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#1a1a1a", textDecoration: "none", fontWeight: 500, padding: "10px 20px", borderRadius: 8, border: "1px solid #E0DDD8" }}>
              {lt('snap','cta',landingLocale)}
              <ArrowRight size={14} />
            </a>
          </div>
        </section>

        <ThemeShowcase onLogin={openLogin} landingLocale={landingLocale} />

        <section ref={specRef as React.RefObject<HTMLElement>} style={{ padding: "80px 0", background: "#1a1a1a" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div className="specs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, padding: "0 48px" }}>
              {specs.map((s, i) => (
                <div key={i} style={{ textAlign: "center", padding: "40px 16px", opacity: specInView ? 1 : 0, transform: specInView ? "translateY(0)" : "translateY(20px)", transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 100}ms` }}>
                  <p className="serif" style={{ fontSize: 48, fontWeight: 300, color: "#fff", marginBottom: 8 }}>{s.num}</p>
                  <p style={{ fontSize: 14, color: "#fff", marginBottom: 8, fontWeight: 500 }}>{s.label}</p>
                  <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" ref={pricingRef as React.RefObject<HTMLElement>} style={{ padding: "100px 0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontSize: 13, color: "#bbb", letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" }}>Pricing</p>
              <h2 className="serif" style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", marginBottom: 12 }}>{lt('pricing','h2',landingLocale)}</h2>
              <p style={{ fontSize: 14, color: "#999" }}>{lt('pricing','desc',landingLocale)}</p>
            </div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <a href="/gift/redeem" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 100, border: "1px solid #E0DDD8", fontSize: 13, color: "#888", textDecoration: "none" }}>
                <Gift size={14} />
                {lt('pricing','giftCode',landingLocale)}
              </a>
            </div>
            {packages.length > 0 ? (
              <div className="pricing-grid snap-pill" style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", padding: "14px 0 16px", scrollbarWidth: "none", maxWidth: 1100, margin: "0 auto", justifyContent: "center" }}>
                {packages.map((pkg, i) => {
                  const isHighlight = pkg.slug === "premium";
                  return (
                    <div key={pkg.id} style={{ minWidth: 280, flex: "0 0 280px", scrollSnapAlign: "start", padding: "32px 24px", borderRadius: 14, border: isHighlight ? "2px solid #1a1a1a" : "1px solid #E8E5E0", background: isHighlight ? "#FAFAF8" : "#fff", position: "relative", opacity: pricingInView ? 1 : 0, transform: pricingInView ? "translateY(0)" : "translateY(20px)", transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 80}ms` }}>
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
                      <button onClick={() => setShowCreateModal(true)} style={{ display: "block", width: "100%", textAlign: "center", padding: "12px 0", borderRadius: 8, fontSize: 13, fontWeight: 500, background: isHighlight ? "#1a1a1a" : "transparent", color: isHighlight ? "#fff" : "#1a1a1a", border: isHighlight ? "none" : "1px solid #E0DDD8", cursor: "pointer" }}>{lt('pricing','startBtn',landingLocale)}</button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: "#bbb", fontSize: 13 }}>요금 정보를 불러오는 중...</div>
            )}
          </div>
        </section>

        <section id="ai-snap-pricing" style={{ padding: "100px 0", background: "#F5F4F1", borderTop: "1px solid #E8E5E0", borderBottom: "1px solid #E8E5E0" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 48px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <p style={{ fontSize: 11, color: "#bbb", letterSpacing: 2, marginBottom: 10 }}>{lt('snapPricing','tag',landingLocale)}</p>
              <h2 className="serif" style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", marginBottom: 10 }}>{lt('snapPricing','h2',landingLocale)}</h2>
              <p style={{ fontSize: 14, color: "#999" }}>{lt('snapPricing','desc',landingLocale)}</p>
            </div>
            <div className="snap-pack-grid snap-pill" style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", padding: "14px 0 16px", scrollbarWidth: "none", justifyContent: "center" }}>
              {[
                { name: landingLocale === 'en' ? '3-Photo Pack' : '3장 세트', per: landingLocale === 'en' ? '$1.97/shot' : '장당 1,967원', price: '5,900', popular: false },
                { name: landingLocale === 'en' ? '5-Photo Pack' : '5장 세트', per: landingLocale === 'en' ? '$1.98/shot' : '장당 1,980원', price: '9,900', popular: false },
                { name: landingLocale === 'en' ? '10-Photo Pack' : '10장 세트', per: landingLocale === 'en' ? '$1.49/shot' : '장당 1,490원', price: '14,900', popular: true },
                { name: landingLocale === 'en' ? '20-Photo Pack' : '20장 세트', per: landingLocale === 'en' ? '$1.25/shot' : '장당 1,245원', price: '24,900', popular: false },
              ].map((pack) => (
                <div key={pack.name} style={{ minWidth: 220, flex: "0 0 220px", scrollSnapAlign: "start", padding: "28px 20px", borderRadius: 14, background: "#fff", border: pack.popular ? "2px solid #1a1a1a" : "1px solid #E8E5E0", textAlign: "left", position: "relative" }}>
                  {pack.popular && <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%) translateY(-50%)", background: "#1a1a1a", color: "#fff", fontSize: 10, padding: "4px 14px", borderRadius: 100, fontWeight: 500 }}>{lt('snapPricing','popular',landingLocale)}</div>}
                  <p style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{pack.name}</p>
                  <p style={{ fontSize: 11, color: "#bbb", marginBottom: 16 }}>{pack.per}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 20 }}>
                    <p className="serif" style={{ fontSize: 28, fontWeight: 400, color: "#1a1a1a" }}>{pack.price}</p>
                    <p style={{ fontSize: 12, color: "#999" }}>{landingLocale === 'en' ? 'KRW' : '원'}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {[lt("snapPricing","f1",landingLocale), lt("snapPricing","f2",landingLocale), lt("snapPricing","f3",landingLocale)].map((f, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Check size={12} color={pack.popular ? "#1a1a1a" : "#ccc"} strokeWidth={2} />
                        <p style={{ fontSize: 12, color: "#666" }}>{f}</p>
                      </div>
                    ))}
                  </div>
                  <a href="/ai-snap/studio" style={{ display: "block", textAlign: "center", padding: "11px 0", borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: "none", background: pack.popular ? "#1a1a1a" : "transparent", color: pack.popular ? "#fff" : "#1a1a1a", border: pack.popular ? "none" : "1px solid #E0DDD8" }}>{lt('pricing','startBtn',landingLocale)}</a>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <a href="/ai-snap" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "#fff", background: "#1a1a1a", padding: "14px 28px", borderRadius: 10, textDecoration: "none", fontWeight: 500 }}>
                {lt('snapPricing','freeCta',landingLocale)}
                <Camera size={16} />
              </a>
            </div>
          </div>
        </section>

        <section style={{ padding: "80px 48px", background: "#FAF9F7" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <p style={{ fontSize: 11, color: "#bbb", letterSpacing: 2, marginBottom: 10 }}>{lt('video','tag',landingLocale)}</p>
              <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, color: "#1a1a1a", marginBottom: 8 }}>{lt('video','h3',landingLocale)}</h3>
              <p style={{ fontSize: 13, color: "#999", lineHeight: 1.8 }}>{lt('video','desc',landingLocale)}</p>
            </div>
              <HighlightVideoSection />
          </div>
        </section>

        {guides.length > 0 && (
          <section style={{ padding: "80px 48px", background: "#F5F4F1", borderTop: "1px solid #E8E5E0" }}>
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <p style={{ fontSize: 11, color: "#bbb", letterSpacing: 2, marginBottom: 10 }}>{lt('guide','tag',landingLocale)}</p>
                <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, color: "#1a1a1a", marginBottom: 8 }}>{lt('guide','h3',landingLocale)}</h3>
              </div>
              <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16 }} className="snap-pill">
                {guides.map((g) => (
                  <div key={g.id} onClick={() => setSelectedGuide(g)} style={{ flex: "0 0 280px", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid #E8E5E0", cursor: "pointer" }}>
                    <div style={{ aspectRatio: "16/9", background: "#E8E5E0", position: "relative", overflow: "hidden" }}>
                      {g.videoType === "YOUTUBE" ? (
                        <img src={`https://img.youtube.com/vi/${g.videoUrl.split("/embed/")[1]}/mqdefault.jpg`} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={g.title} />
                      ) : (
                        <video src={g.videoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} preload="metadata" muted />
                      )}
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)", opacity: 0, transition: "opacity 0.2s" }} onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0")}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg style={{ width: 18, height: 18, marginLeft: 2 }} fill="#1a1a1a" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{g.title}</p>
                      {g.description && <p style={{ fontSize: 12, color: "#999" }}>{g.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {reviews.length > 0 && (
          <section style={{ padding: "80px 48px", borderTop: "1px solid #E8E5E0" }}>
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <p style={{ fontSize: 11, color: "#bbb", letterSpacing: 2, marginBottom: 10 }}>{lt('review','tag',landingLocale)}</p>
                <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, color: "#1a1a1a", marginBottom: 8 }}>{lt('review','h3',landingLocale)}</h3>
              </div>
              <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16 }} className="snap-pill">
                {reviews.map((r) => (
                  <div key={r.id} style={{ flex: "0 0 240px", padding: 20, borderRadius: 14, border: "1px solid #E8E5E0", background: "#fff" }}>
                    <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
                      {[...Array(5)].map((_, j) => (
                        <svg key={j} style={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill={j < r.rating ? "#F59E0B" : "#E8E5E0"}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.content || "정말 만족스러웠어요!"}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#bbb" }}>
                      <span>{r.groomName} & {r.brideName}</span>
                      <span>{new Date(r.createdAt).toLocaleDateString("ko-KR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section style={{ padding: "100px 48px", borderTop: "1px solid #E8E5E0" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", gap: 56 }} className="weddingai-grid">
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: "#bbb", letterSpacing: 2, marginBottom: 10 }}>{lt('weddingAi','tag',landingLocale)}</p>
              <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, color: "#1a1a1a", marginBottom: 8, lineHeight: 1.4 }}>{lt('weddingAi','h3',landingLocale)}</h3>
              <p style={{ fontSize: 14, color: "#999", lineHeight: 1.8, marginBottom: 28 }}>{lt('weddingAi','desc1',landingLocale)}<br />{lt('weddingAi','desc2',landingLocale)}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {[lt("weddingAi","f1",landingLocale), lt("weddingAi","f2",landingLocale), lt("weddingAi","f3",landingLocale)].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check size={12} color="#bbb" strokeWidth={2.5} />
                    <p style={{ fontSize: 13, color: "#666" }}>{f}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#ccc" }}>{lt('weddingAi','tip',landingLocale)}</p>
            </div>
            <div style={{ width: 300, flexShrink: 0 }}>
              <div style={{ borderRadius: 16, border: "1px solid #E8E5E0", background: "#fff", overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #F0EFEC", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={12} color="#fff" /></div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{landingLocale === 'en' ? 'Wedding AI' : '웨딩이'}</p>
                    <p style={{ fontSize: 9, color: "#7C8C6E" }}>{landingLocale === 'en' ? 'Online' : '온라인'}</p>
                  </div>
                </div>
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ alignSelf: "flex-end", maxWidth: "80%", padding: "9px 13px", borderRadius: "14px 4px 14px 14px", background: "#2C2C2C" }}><p style={{ fontSize: 11, color: "#fff" }}>{landingLocale === 'en' ? 'Recommend a theme' : '테마 추천해주세요'}</p></div>
                  <div style={{ alignSelf: "flex-start", maxWidth: "85%", padding: "9px 13px", borderRadius: "4px 14px 14px 14px", background: "#F5F4F1" }}><p style={{ fontSize: 11, color: "#555", lineHeight: 1.6 }}>{landingLocale === 'en' ? 'What vibe do you prefer? Natural, modern, or classic? Pick one and I\'ll find the perfect theme.' : '어떤 분위기를 좋아하세요? 내추럴, 모던, 클래식 중 골라주시면 딱 맞는 테마를 추천해드릴게요.'}</p></div>
                  <div style={{ alignSelf: "flex-end", maxWidth: "80%", padding: "9px 13px", borderRadius: "14px 4px 14px 14px", background: "#2C2C2C" }}><p style={{ fontSize: 11, color: "#fff" }}>{landingLocale === 'en' ? 'Natural!' : '내추럴이요!'}</p></div>
                  <div style={{ alignSelf: "flex-start", maxWidth: "85%", padding: "9px 13px", borderRadius: "4px 14px 14px 14px", background: "#F5F4F1" }}><p style={{ fontSize: 11, color: "#555", lineHeight: 1.6 }}>{landingLocale === 'en' ? 'I recommend the Botanical theme! Sage green tones with a natural feel.' : 'Botanical 테마 추천드려요! 세이지그린 톤에 자연스러운 느낌이에요.'}</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section ref={ctaRef as React.RefObject<HTMLElement>} style={{ padding: "100px 48px", textAlign: "center" }}>
          <div style={{ opacity: ctaInView ? 1 : 0, transform: ctaInView ? "translateY(0)" : "translateY(20px)", transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)" }}>
            <h2 className="serif" style={{ fontSize: 38, fontWeight: 400, color: "#1a1a1a", marginBottom: 16 }}>{lt('cta','h2_1',landingLocale)}<br />{lt('cta','h2_2',landingLocale)}</h2>
            <p style={{ fontSize: 14, color: "#999", marginBottom: 36, lineHeight: 1.8 }}>{lt('cta','desc1',landingLocale)}<br />{lt('cta','desc2',landingLocale)}</p>
            <button onClick={() => setShowCreateModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, color: "#fff", background: "#1a1a1a", padding: "16px 36px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 500 }}>
              {lt('cta','btn',landingLocale)}
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

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
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} onFocus={() => window.scrollTo(0, 0)} placeholder={landingLocale === "en" ? "Type a message..." : "메시지를 입력하세요..."} style={{ flex: 1, padding: "12px 16px", borderRadius: 24, border: "1px solid #E0DDD8", background: "#F5F4F1", fontSize: 13, outline: "none" }} />
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
