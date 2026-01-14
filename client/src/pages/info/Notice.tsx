import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const defaultNotices = [
  { date: '2026.01.10', title: '🎉 청첩장 작업실 그랜드 오픈!', content: '안녕하세요! 청첩장 작업실이 정식 오픈했습니다.', isNew: true },
  { date: '2026.01.08', title: '구글 로그인 추가', content: '카카오 로그인 외에 구글 로그인이 추가되었습니다.', isNew: true },
];

export default function Notice() {
  const [notices, setNotices] = useState(defaultNotices);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/admin/contents/notice`)
      .then(res => res.json())
      .then(data => {
        if (data?.content) {
          try { setNotices(JSON.parse(data.content)); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#fefefe]">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-stone-100 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 -ml-2 hover:bg-stone-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <h1 className="text-lg font-medium text-stone-800">공지사항</h1>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-4">
          {notices.map((notice, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-stone-400">{notice.date}</span>
                {notice.isNew && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs rounded-full">NEW</span>
                )}
              </div>
              <h3 className="font-medium text-stone-800 text-lg mb-2">{notice.title}</h3>
              <p className="text-stone-600">{notice.content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
