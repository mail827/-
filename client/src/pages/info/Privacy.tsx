import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const defaultContent = `청첩장 작업실 개인정보처리방침

청첩장 작업실(이하 "회사")은 이용자의 개인정보를 중요시하며, 개인정보보호법 등 관련 법령을 준수합니다.

1. 수집하는 개인정보 항목
- 필수항목: 이메일, 이름(신랑/신부), 결혼식 일시 및 장소
- 선택항목: 전화번호, 사진, 영상, 계좌정보
- 자동수집: 접속 IP, 쿠키, 서비스 이용기록

2. 개인정보의 수집 및 이용목적
- 청첩장 제작 및 서비스 제공
- 결제 및 환불 처리
- 고객 문의 응대
- 서비스 개선 및 통계 분석

3. 개인정보의 보유 및 이용기간
- 회원탈퇴 시까지 또는 서비스 이용 종료 시까지
- 관련 법령에 따른 보존기간
  · 계약 또는 청약철회 기록: 5년
  · 대금결제 및 재화 공급 기록: 5년
  · 소비자 불만 또는 분쟁처리 기록: 3년

4. 개인정보의 제3자 제공
회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
다만, 다음의 경우는 예외로 합니다.
- 법령에 의한 요청이 있는 경우
- 결제 처리를 위한 PG사 제공 (나이스페이먼츠)

5. 개인정보의 파기
회원탈퇴 또는 서비스 종료 시 지체 없이 파기합니다.
- 전자적 파일: 복구 불가능한 방법으로 삭제
- 종이 문서: 분쇄기로 파쇄

6. 이용자의 권리
이용자는 언제든지 다음 권리를 행사할 수 있습니다.
- 개인정보 열람 요청
- 오류 정정 요청
- 삭제 요청
- 처리 정지 요청

7. 개인정보 보호책임자
- 성명: 이다겸
- 이메일: mail@weddingshop.cloud

8. 개인정보 처리방침 변경
본 방침은 시행일로부터 적용되며, 변경 시 공지사항을 통해 안내합니다.

시행일: 2026년 1월 12일

상호: 청첩장 작업실
대표: 이다겸
사업자등록번호: 413-03-96815
통신판매업신고: 제2026-부산진-0007741호
주소: 부산진구 전포대로 224번길 22`;

export default function Privacy() {
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/admin/contents/privacy`)
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
          <h1 className="text-lg font-medium text-stone-800">개인정보처리방침</h1>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="whitespace-pre-wrap text-stone-700 leading-relaxed">{content}</div>
      </main>
    </div>
  );
}
