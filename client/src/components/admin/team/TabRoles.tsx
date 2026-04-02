export default function TabRoles() {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100">
        <p className="text-[13px] font-semibold text-stone-800">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  const Row = ({ task, desc, cycle }: { task: string; desc: string; cycle: string }) => (
    <tr className="border-b border-stone-50 last:border-0">
      <td className="py-2 pr-3 text-[13px] font-medium text-stone-700">{task}</td>
      <td className="py-2 pr-3 text-[12px] text-stone-500">{desc}</td>
      <td className="py-2 text-[11px] text-stone-400">{cycle}</td>
    </tr>
  );

  return (
    <div className="space-y-5">
      <div className="bg-stone-900 rounded-xl p-5 text-white">
        <p className="text-[10px] tracking-[0.12em] text-stone-500 mb-2">STRUCTURE</p>
        <p className="text-[14px] font-semibold mb-1">지분 구조: 다겸 6 / 가현 4</p>
        <p className="text-[12px] text-stone-400">평가 기간: 2026.03 ~ 2026.06 / 정기 회의: 매주 수요일 오전 10시</p>
        <p className="text-[12px] text-stone-500 mt-2">6월 말 기준 전체 기여도 평가 후 지분 구조 재논의</p>
      </div>

      <Section title="다겸 담당 업무">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] tracking-[0.1em] text-emerald-600 font-semibold mb-2">PRODUCT DEV</p>
            <table className="w-full"><tbody>
              <Row task="신규 기능 개발" desc="테마 추가, 결제 흐름, 사용자 기능" cycle="상시" />
              <Row task="버그 수정" desc="고객 리포트 및 자체 발견 버그" cycle="상시" />
              <Row task="서버/프론트 배포" desc="Fly.io / Vercel 배포 및 모니터링" cycle="필요 시" />
              <Row task="DB 관리" desc="Prisma 스키마 변경, Neon DB" cycle="필요 시" />
            </tbody></table>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.1em] text-cyan-600 font-semibold mb-2">AI PIPELINE</p>
            <table className="w-full"><tbody>
              <Row task="AI스냅 품질 개선" desc="nano-banana-2 프롬프트 튜닝, strength 조정" cycle="상시" />
              <Row task="BytePlus SeeDream" desc="새 AI 모델 연동 개발" cycle="진행중" />
              <Row task="체이닝 최적화" desc="chainRef, 멀티모델, 품질 안정화" cycle="상시" />
            </tbody></table>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.1em] text-orange-600 font-semibold mb-2">MARKETING STRATEGY</p>
            <table className="w-full"><tbody>
              <Row task="숏폼 제작자 응대" desc="외부 제작자 방향 공유, 피드백" cycle="상시" />
              <Row task="마케팅 이미지 제작" desc="카드 이미지, 상세페이지" cycle="필요 시" />
              <Row task="블로그 주제 전달" desc="가현에게 포스팅 방향 제공" cycle="주 1회" />
              <Row task="네이버 검색광고" desc="키워드 세팅, 입찰 조정, 성과 분석" cycle="주 1회" />
              <Row task="제휴 제안 템플릿" desc="웨딩플래너 대상 제안서 작성" cycle="필요 시" />
            </tbody></table>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.1em] text-stone-500 font-semibold mb-2">BUSINESS</p>
            <table className="w-full"><tbody>
              <Row task="고객 기술 CS" desc="가현이 넘긴 기술 문의 처리" cycle="상시" />
              <Row task="결제 시스템" desc="TossPayments 정산, 오류 처리" cycle="필요 시" />
              <Row task="제휴처 관리" desc="포에버웨딩, 웨딩줌인 등" cycle="필요 시" />
            </tbody></table>
          </div>
        </div>
      </Section>

      <Section title="가현 담당 업무">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] tracking-[0.1em] text-pink-600 font-semibold mb-2">SNS CONTENT</p>
            <table className="w-full"><tbody>
              <Row task="인스타그램 릴스/피드" desc="@weddingstudiolab 업로드" cycle="주 2회" />
              <Row task="유튜브 쇼츠" desc="같은 영상 유튜브용 업로드" cycle="주 2회" />
              <Row task="틱톡" desc="틱톡 업로드" cycle="주 2회" />
              <Row task="캡션/해시태그" desc="다겸 가이드 기반 작성" cycle="업로드 시" />
              <Row task="댓글/DM 관리" desc="인스타/유튜브/틱톡 답글" cycle="매일" />
            </tbody></table>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.1em] text-blue-600 font-semibold mb-2">BLOG & CHANNEL</p>
            <table className="w-full"><tbody>
              <Row task="개인블로그 포스팅" desc="다겸 주제 전달 기반 작성" cycle="주 1회" />
              <Row task="비즈카톡 피드" desc="이미지+텍스트 콘텐츠 업로드" cycle="주 1~2회" />
            </tbody></table>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.1em] text-purple-600 font-semibold mb-2">VIRAL</p>
            <table className="w-full"><tbody>
              <Row task="웨딩카페 글" desc="다이렉트, 제이웨딩 등 후기/소개글" cycle="주 2~3회" />
              <Row task="스레드/인스타 바이럴" desc="자연스러운 후기 콘텐츠" cycle="주 1~2회" />
            </tbody></table>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.1em] text-amber-600 font-semibold mb-2">CS & PARTNERSHIP</p>
            <table className="w-full"><tbody>
              <Row task="카카오톡 1차 응대" desc="간단 안내, 기술은 다겸 전달" cycle="매일" />
              <Row task="제휴 DM 발송" desc="웨딩플래너 등 발송" cycle="주 3~5건" />
            </tbody></table>
          </div>
        </div>
      </Section>
    </div>
  );
}
