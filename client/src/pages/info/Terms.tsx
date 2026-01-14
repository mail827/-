import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const defaultContent = `제1조 (목적)
본 약관은 청첩장 작업실(이하 "서비스")이 제공하는 모바일 청첩장 제작 서비스의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.

제2조 (서비스 이용)
① 서비스는 회원에게 모바일 청첩장 제작, 관리, 공유 기능을 제공합니다.
② 서비스 이용은 회원가입 후 가능하며, 일부 유료 서비스는 결제 후 이용 가능합니다.

제3조 (콘텐츠 저작권)
① 회원이 업로드한 사진, 영상, 텍스트 등의 콘텐츠에 대한 저작권은 회원에게 있습니다.
② 서비스가 제공하는 템플릿, 디자인 요소의 저작권은 청첩장 작업실에 있습니다.

제4조 (환불 정책)
① 결제 후 7일 이내, 청첩장 URL 공유 전에는 전액 환불이 가능합니다.
② 청첩장 URL 공유 후에는 환불이 불가합니다.
③ 영상 제작 서비스는 제작 착수 전까지 환불 가능합니다.

제5조 (서비스 호스팅)
① Lite 패키지: 결제일로부터 30일간 호스팅
② Basic 패키지: 결제일로부터 1년간 호스팅
③ Premium 패키지: 평생 호스팅

제6조 (면책사항)
천재지변, 서버 장애 등 불가항력적 사유로 인한 서비스 중단에 대해서는 책임지지 않습니다.

시행일: 2026년 1월 1일`;

export default function Terms() {
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/admin/contents/terms`)
      .then(res => res.json())
      .then(data => { if (data?.content) setContent(data.content); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#fefefe]">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-stone-100 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 -ml-2 hover:bg-stone-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <h1 className="text-lg font-medium text-stone-800">이용약관</h1>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="whitespace-pre-wrap text-stone-700 leading-relaxed">{content}</div>
      </main>
    </div>
  );
}
