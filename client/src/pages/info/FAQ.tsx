import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const defaultFaqs = [
  { q: '청첩장은 어떻게 만드나요?', a: '카카오 또는 구글로 로그인 후, 원하는 패키지를 선택하고 결제하시면 바로 청첩장을 만들 수 있어요.' },
  { q: '결제 후 수정은 몇 번까지 가능한가요?', a: 'Lite 패키지는 1회, Basic 패키지는 3회, Premium 패키지는 무제한 수정이 가능합니다.' },
  { q: '청첩장 호스팅 기간은 얼마나 되나요?', a: 'Lite는 30일, Basic은 1년, Premium은 평생 호스팅됩니다.' },
  { q: '환불은 어떻게 하나요?', a: '결제 후 7일 이내, 청첩장 URL을 공유하기 전이라면 전액 환불 가능합니다.' },
  { q: 'RSVP 기능은 어떻게 사용하나요?', a: '청첩장을 받은 하객이 참석 여부와 인원수를 입력하면, 대시보드에서 실시간으로 확인할 수 있어요.' },
  { q: '영상 청첩장은 어떻게 제작되나요?', a: 'Basic + 영상 패키지 구매 후, 카카오톡 오픈채팅으로 원본을 보내주시면 편집해드려요.' },
  { q: '테마는 변경할 수 있나요?', a: 'Lite 패키지는 선택한 테마 1종만 사용 가능하고, Basic 이상은 언제든 테마를 변경할 수 있어요.' },
  { q: '계좌번호 복사 기능이 있나요?', a: '네! 축의금 안내 섹션에서 계좌번호 복사 버튼을 제공하고, 토스/카카오페이 송금 링크도 연결할 수 있어요.' },
];

export default function FAQ() {
  const [faqs, setFaqs] = useState(defaultFaqs);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/admin/contents/faq`)
      .then(res => res.json())
      .then(data => {
        if (data?.content) {
          try { setFaqs(JSON.parse(data.content)); } catch {}
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
          <h1 className="text-lg font-medium text-stone-800">자주 묻는 질문</h1>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-5 flex items-center justify-between text-left"
              >
                <span className="font-medium text-stone-800">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-stone-600 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
