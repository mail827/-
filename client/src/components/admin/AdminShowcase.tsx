import { useState, useEffect, useCallback } from "react";
import { Save, Plus, Trash2, GripVertical, ExternalLink, Monitor, Layout, Loader2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

interface Showcase {
  name: string;
  url: string;
  description: string;
}

export default function AdminShowcase() {
  const [heroUrl, setHeroUrl] = useState("");
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroSaved, setHeroSaved] = useState(false);
  const [heroLoading, setHeroLoading] = useState(true);

  const [showcases, setShowcases] = useState<Showcase[]>([]);
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);
  const [themeLoading, setThemeLoading] = useState(true);

  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/admin/hero-showcase`, { headers })
      .then(r => r.json())
      .then(data => { if (data.url) setHeroUrl(data.url); })
      .catch(() => {})
      .finally(() => setHeroLoading(false));

    fetch(`${API}/admin/theme-showcases`, { headers })
      .then(r => r.json())
      .then((data: Showcase[]) => { if (Array.isArray(data)) setShowcases(data); })
      .catch(() => {})
      .finally(() => setThemeLoading(false));
  }, []);

  const saveHero = useCallback(async () => {
    setHeroSaving(true);
    try {
      await fetch(`${API}/admin/hero-showcase`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ url: heroUrl.trim() }),
      });
      setHeroSaved(true);
      setTimeout(() => setHeroSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setHeroSaving(false); }
  }, [heroUrl]);

  const saveThemes = useCallback(async () => {
    setThemeSaving(true);
    try {
      await fetch(`${API}/admin/theme-showcases`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ showcases }),
      });
      setThemeSaved(true);
      setTimeout(() => setThemeSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setThemeSaving(false); }
  }, [showcases]);

  const addShowcase = () => {
    setShowcases(prev => [...prev, { name: "", url: "", description: "" }]);
  };

  const updateShowcase = (idx: number, field: keyof Showcase, value: string) => {
    setShowcases(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeShowcase = (idx: number) => {
    setShowcases(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setShowcases(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 8,
    border: "1px solid #E0DDD8",
    background: "#fff",
    fontSize: 13,
    color: "#1a1a1a",
    outline: "none",
    fontFamily: "'Noto Sans KR', sans-serif",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Monitor size={18} color="#1a1a1a" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>히어로 쇼케이스</h2>
          </div>
          <button
            onClick={saveHero}
            disabled={heroSaving}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 20px", borderRadius: 8,
              background: heroSaved ? "#059669" : "#1a1a1a",
              color: "#fff", border: "none", fontSize: 13, fontWeight: 500,
              cursor: heroSaving ? "not-allowed" : "pointer",
              opacity: heroSaving ? 0.6 : 1,
              transition: "background 0.3s",
            }}
          >
            {heroSaving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
            {heroSaved ? "저장됨" : "저장"}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>
          랜딩 첫 화면 폰 목업에 표시할 청첩장 URL 하나를 설정합니다.
        </p>
        {heroLoading ? (
          <div style={{ padding: 20, textAlign: "center", color: "#bbb", fontSize: 13 }}>불러오는 중...</div>
        ) : (
          <div style={{ padding: 20, borderRadius: 12, border: "1px solid #E8E5E0", background: "#FAFAF8" }}>
            <label style={{ display: "block", fontSize: 11, color: "#999", marginBottom: 6, fontWeight: 500 }}>
              청첩장 URL (예: https://weddingshop.cloud/w/xxx)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={heroUrl}
                onChange={e => setHeroUrl(e.target.value)}
                placeholder="https://weddingshop.cloud/w/임떵듄-이따깜-mkjqq3lc"
                style={{ ...inputStyle, flex: 1, fontFamily: "monospace", fontSize: 12 }}
              />
              {heroUrl && (
                <a
                  href={heroUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 40, height: 40, borderRadius: 8, border: "1px solid #E0DDD8",
                    background: "#fff", color: "#888", flexShrink: 0,
                  }}
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Layout size={18} color="#1a1a1a" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>테마 쇼케이스</h2>
          </div>
          <button
            onClick={saveThemes}
            disabled={themeSaving}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 20px", borderRadius: 8,
              background: themeSaved ? "#059669" : "#1a1a1a",
              color: "#fff", border: "none", fontSize: 13, fontWeight: 500,
              cursor: themeSaving ? "not-allowed" : "pointer",
              opacity: themeSaving ? 0.6 : 1,
              transition: "background 0.3s",
            }}
          >
            {themeSaving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
            {themeSaved ? "저장됨" : "저장"}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>
          고객이 이름/날짜를 넣어 체험할 수 있는 빈 테마 청첩장들을 등록합니다. 테마 섹션에 표시됩니다.
        </p>

        {themeLoading ? (
          <div style={{ padding: 20, textAlign: "center", color: "#bbb", fontSize: 13 }}>불러오는 중...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {showcases.map((s, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                style={{
                  padding: 20, borderRadius: 12,
                  border: dragIdx === i ? "2px solid #1a1a1a" : "1px solid #E8E5E0",
                  background: "#FAFAF8",
                  opacity: dragIdx === i ? 0.7 : 1,
                  transition: "border 0.15s, opacity 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ cursor: "grab", color: "#ccc", flexShrink: 0 }}>
                    <GripVertical size={16} />
                  </div>
                  <input
                    type="text"
                    value={s.name}
                    onChange={e => updateShowcase(i, "name", e.target.value)}
                    placeholder="테마 이름 (예: 보태니컬)"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#bbb", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                    #{i + 1}
                  </div>
                  <button
                    onClick={() => removeShowcase(i)}
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32, borderRadius: 8, border: "none",
                      background: "transparent", color: "#E53E3E", cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, paddingLeft: 28 }}>
                  <input
                    type="text"
                    value={s.url}
                    onChange={e => updateShowcase(i, "url", e.target.value)}
                    placeholder="청첩장 URL (예: /w/abc123)"
                    style={{ ...inputStyle, flex: 1, fontFamily: "monospace", fontSize: 12 }}
                  />
                  {s.url && (
                    <a
                      href={s.url.startsWith("http") ? s.url : `https://weddingshop.cloud${s.url}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 40, height: 40, borderRadius: 8, border: "1px solid #E0DDD8",
                        background: "#fff", color: "#888", flexShrink: 0,
                      }}
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
                <div style={{ paddingLeft: 28 }}>
                  <input
                    type="text"
                    value={s.description}
                    onChange={e => updateShowcase(i, "description", e.target.value)}
                    placeholder="설명 (선택, 예: 세이지그린 · 내추럴)"
                    style={inputStyle}
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addShowcase}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: 16, borderRadius: 12,
                border: "2px dashed #E0DDD8", background: "transparent",
                color: "#bbb", fontSize: 13, cursor: "pointer",
              }}
            >
              <Plus size={16} />
              쇼케이스 추가
            </button>
          </div>
        )}
        <p style={{ fontSize: 11, color: "#ccc", textAlign: "center", marginTop: 16 }}>
          등록된 청첩장이 랜딩 페이지 테마 섹션에 iframe으로 표시됩니다. 빈 테마(사진/정보 없는)를 등록하면 고객이 직접 체험할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
