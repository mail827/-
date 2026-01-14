import { useState, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';

interface FAQItem { q: string; a: string; }
interface NoticeItem { date: string; title: string; content: string; isNew: boolean; }

export default function AdminContents() {
  const [activeTab, setActiveTab] = useState<'terms' | 'faq' | 'notice'>('terms');
  const [terms, setTerms] = useState(`<h2>제1조 (목적)</h2>
<p>본 약관은 청첩장 작업실이 제공하는 모바일 청첩장 제작 서비스의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>

<h2>제2조 (서비스 이용)</h2>
<p>서비스는 회원에게 모바일 청첩장 제작, 관리, 공유 기능을 제공합니다.</p>

<h2>제3조 (환불 정책)</h2>
<p>결제 후 7일 이내, 청첩장 URL 공유 전에는 전액 환불이 가능합니다.</p>`);
  const [faqs, setFaqs] = useState<FAQItem[]>([
    { q: '청첩장은 어떻게 만드나요?', a: '카카오 또는 구글로 로그인 후, 원하는 패키지를 선택하고 결제하시면 바로 청첩장을 만들 수 있어요.' },
    { q: '결제 후 수정은 몇 번까지 가능한가요?', a: 'Lite 패키지는 1회, Basic 패키지는 3회, Premium 패키지는 무제한 수정이 가능합니다.' },
    { q: '환불은 어떻게 하나요?', a: '결제 후 7일 이내, 청첩장 URL을 공유하기 전이라면 전액 환불 가능합니다.' },
  ]);
  const [notices, setNotices] = useState<NoticeItem[]>([
    { date: '2026.01.10', title: '🎉 청첩장 작업실 그랜드 오픈!', content: '안녕하세요! 청첩장 작업실이 정식 오픈했습니다.', isNew: true },
    { date: '2026.01.08', title: '구글 로그인 추가', content: '카카오 로그인 외에 구글 로그인이 추가되었습니다.', isNew: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    const token = localStorage.getItem('token');
    try {
      const [termsRes, faqRes, noticeRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/contents/terms`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/contents/faq`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/contents/notice`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (termsRes.ok) {
        const data = await termsRes.json();
        if (data?.content) setTerms(data.content);
      }
      if (faqRes.ok) {
        const data = await faqRes.json();
        if (data?.content) {
          try { setFaqs(JSON.parse(data.content)); } catch {}
        }
      }
      if (noticeRes.ok) {
        const data = await noticeRes.json();
        if (data?.content) {
          try { setNotices(JSON.parse(data.content)); } catch {}
        }
      }
    } catch (e) {
      console.error('Failed to fetch:', e);
    }
  };

  const saveContent = async (key: string, content: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL}/admin/contents/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: key, content }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save:', e);
    } finally {
      setSaving(false);
    }
  };

  const addFaq = () => setFaqs([...faqs, { q: '', a: '' }]);
  const updateFaq = (idx: number, field: 'q' | 'a', value: string) => {
    setFaqs(faqs.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  };
  const deleteFaq = (idx: number) => setFaqs(faqs.filter((_, i) => i !== idx));

  const addNotice = () => setNotices([{ date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'), title: '', content: '', isNew: true }, ...notices]);
  const updateNotice = (idx: number, field: keyof NoticeItem, value: string | boolean) => {
    setNotices(notices.map((n, i) => i === idx ? { ...n, [field]: value } : n));
  };
  const deleteNotice = (idx: number) => setNotices(notices.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">콘텐츠 관리</h1>
          <p className="text-stone-500 mt-1">이용약관, FAQ, 공지사항을 관리하세요</p>
        </div>
        {saved && <span className="text-green-600 text-sm">✓ 저장되었습니다</span>}
      </div>

      <div className="flex gap-2">
        {(['terms', 'faq', 'notice'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === tab ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {tab === 'terms' ? '이용약관' : tab === 'faq' ? '자주 묻는 질문' : '공지사항'}
          </button>
        ))}
      </div>

      {activeTab === 'terms' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="w-full h-[500px] p-4 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm leading-relaxed"
            placeholder="이용약관 내용을 입력하세요..."
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={() => saveContent('terms', terms)}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="space-y-4">
          <button
            onClick={addFaq}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-xl hover:bg-stone-900"
          >
            <Plus className="w-5 h-5" />
            질문 추가
          </button>

          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-sm text-stone-500 mb-1 block">질문</label>
                    <input
                      type="text"
                      value={faq.q}
                      onChange={(e) => updateFaq(idx, 'q', e.target.value)}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                      placeholder="질문을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-stone-500 mb-1 block">답변</label>
                    <textarea
                      value={faq.a}
                      onChange={(e) => updateFaq(idx, 'a', e.target.value)}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800 h-24 resize-none"
                      placeholder="답변을 입력하세요"
                    />
                  </div>
                </div>
                <button
                  onClick={() => deleteFaq(idx)}
                  className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {faqs.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => saveContent('faq', JSON.stringify(faqs))}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'notice' && (
        <div className="space-y-4">
          <button
            onClick={addNotice}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-xl hover:bg-stone-900"
          >
            <Plus className="w-5 h-5" />
            공지 추가
          </button>

          {notices.map((notice, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-32">
                      <label className="text-sm text-stone-500 mb-1 block">날짜</label>
                      <input
                        type="text"
                        value={notice.date}
                        onChange={(e) => updateNotice(idx, 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm"
                        placeholder="2026.01.10"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm text-stone-500 mb-1 block">제목</label>
                      <input
                        type="text"
                        value={notice.title}
                        onChange={(e) => updateNotice(idx, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm"
                        placeholder="공지사항 제목"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notice.isNew}
                          onChange={(e) => updateNotice(idx, 'isNew', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-stone-600">NEW</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-stone-500 mb-1 block">내용</label>
                    <textarea
                      value={notice.content}
                      onChange={(e) => updateNotice(idx, 'content', e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800 h-20 resize-none text-sm"
                      placeholder="공지사항 내용"
                    />
                  </div>
                </div>
                <button
                  onClick={() => deleteNotice(idx)}
                  className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {notices.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => saveContent('notice', JSON.stringify(notices))}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
