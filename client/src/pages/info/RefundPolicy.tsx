import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fefefe]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">돌아가기</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="border-b border-stone-200 pb-6">
            <h1 className="font-serif text-3xl text-stone-800 mb-2">환불 정책</h1>
            <p className="text-stone-500 text-sm">최종 수정일: 2025년 1월 15일</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-stone-800">1. 서비스 개요</h2>
            <p className="text-stone-600 leading-relaxed">
              청첩장 작업실은 디지털 모바일 청첩장 제작 서비스입니다. 
              본 서비스는 결제 즉시 디지털 콘텐츠가 제공되는 무형의 서비스 상품입니다.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-stone-800">2. 환불 가능 조건</h2>
            <div className="bg-stone-50 rounded-xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm flex-shrink-0">✓</span>
                <div>
                  <p className="font-medium text-stone-800">결제 후 24시간 이내, 청첩장 미발행 시</p>
                  <p className="text-sm text-stone-500 mt-1">전액 환불 가능</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm flex-shrink-0">✓</span>
                <div>
                  <p className="font-medium text-stone-800">서비스 장애로 인한 이용 불가 시</p>
                  <p className="text-sm text-stone-500 mt-1">전액 환불 또는 서비스 기간 연장</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm flex-shrink-0">✓</span>
                <div>
                  <p className="font-medium text-stone-800">결제 오류 또는 중복 결제 시</p>
                  <p className="text-sm text-stone-500 mt-1">확인 후 즉시 환불</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-stone-800">3. 환불 불가 조건</h2>
            <div className="bg-rose-50 rounded-xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-sm flex-shrink-0">✕</span>
                <div>
                  <p className="font-medium text-stone-800">청첩장 발행(공개) 후</p>
                  <p className="text-sm text-stone-500 mt-1">디지털 콘텐츠 특성상 발행 후에는 환불이 불가합니다</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-sm flex-shrink-0">✕</span>
                <div>
                  <p className="font-medium text-stone-800">결제 후 7일 경과</p>
                  <p className="text-sm text-stone-500 mt-1">청첩장 미발행 상태라도 7일 경과 시 환불 불가</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-sm flex-shrink-0">✕</span>
                <div>
                  <p className="font-medium text-stone-800">고객 변심에 의한 환불 요청</p>
                  <p className="text-sm text-stone-500 mt-1">서비스 이용 후 단순 변심은 환불 사유가 되지 않습니다</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-stone-800">4. 패키지별 환불 정책</h2>
            <div className="overflow-hidden rounded-xl border border-stone-200">
              <table className="w-full text-sm">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-stone-700">패키지</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-700">환불 조건</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="px-4 py-3 text-stone-800">Lite (3만원)</td>
                    <td className="px-4 py-3 text-stone-600">발행 전 24시간 이내 전액 환불</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-stone-800">Basic (8만원)</td>
                    <td className="px-4 py-3 text-stone-600">발행 전 24시간 이내 전액 환불</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-stone-800">AI Reception (12.9만원)</td>
                    <td className="px-4 py-3 text-stone-600">AI 대화 10회 미만 사용 시 전액 환불</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-stone-800">Basic + 영상 (40만원)</td>
                    <td className="px-4 py-3 text-stone-600">영상 제작 착수 전 청첩장 비용만 환불 가능</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-stone-800">5. 서비스 제공 기간</h2>
            <p className="text-stone-600 leading-relaxed">
              청첩장 호스팅 서비스는 패키지에 따라 <strong>30일~6개월</strong>간 제공됩니다.
              결혼식 종료 후에도 서비스 기간 내에는 청첩장 열람이 가능하며,
              서비스 기간 만료 후에는 아카이브 형태로 전환됩니다.
            </p>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                ⚠️ 최대 서비스 제공 기간은 <strong>6개월</strong>입니다. 
                결혼식 날짜가 6개월 이후인 경우 별도 문의 바랍니다.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-stone-800">6. 환불 절차</h2>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
                <p className="text-stone-600">이메일(mail@weddingshop.cloud) 또는 1:1 문의로 환불 요청</p>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
                <p className="text-stone-600">환불 사유 및 결제 정보 확인 (영업일 기준 1~2일)</p>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
                <p className="text-stone-600">환불 승인 시 결제 수단으로 환불 처리 (카드사에 따라 3~7일 소요)</p>
              </li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-stone-800">7. 문의처</h2>
            <div className="bg-stone-50 rounded-xl p-5 space-y-2">
              <p className="text-stone-600"><span className="text-stone-500">이메일</span> mail@weddingshop.cloud</p>
              <p className="text-stone-600"><span className="text-stone-500">전화</span> 010-2768-3187</p>
              <p className="text-stone-600"><span className="text-stone-500">운영시간</span> 평일 10:00 ~ 18:00 (주말/공휴일 휴무)</p>
            </div>
          </section>

          <div className="border-t border-stone-200 pt-6 mt-8">
            <p className="text-xs text-stone-400 leading-relaxed">
              본 환불 정책은 전자상거래 등에서의 소비자보호에 관한 법률 및 콘텐츠산업진흥법에 따라 작성되었습니다.
              디지털 콘텐츠의 특성상 청약철회가 제한될 수 있으며, 이는 결제 전 고지됩니다.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
