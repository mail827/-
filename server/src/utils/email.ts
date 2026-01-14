import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

interface ReportData {
  totalChats: number;
  uniqueVisitors: number;
  topQuestions: { question: string; count: number }[];
  funnyQuestions: string[];
}

export async function sendReportEmail(
  to: string, 
  groomName: string, 
  brideName: string, 
  reportUrl: string,
  data?: ReportData
) {
  const topQuestionsHtml = data?.topQuestions?.slice(0, 5).map((q, i) => `
    <tr>
      <td style="padding: 8px 12px; background: ${i === 0 ? '#FEF3C7' : i === 1 ? '#F3F4F6' : i === 2 ? '#FEF3C7' : '#F9FAFB'}; border-radius: 6px;">
        <span style="font-weight: bold; color: ${i === 0 ? '#D97706' : i === 1 ? '#6B7280' : i === 2 ? '#B45309' : '#9CA3AF'}; margin-right: 8px;">${i + 1}</span>
        <span style="color: #374151;">${q.question}</span>
        <span style="color: #9CA3AF; font-size: 12px; float: right;">${q.count}회</span>
      </td>
    </tr>
    <tr><td style="height: 6px;"></td></tr>
  `).join('') || '';

  const funnyHtml = data?.funnyQuestions?.slice(0, 3).map(q => `
    <div style="background: #FDF2F8; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; font-size: 14px; color: #BE185D;">
      "${q}"
    </div>
  `).join('') || '';

  const mailOptions = {
    from: `"청첩장 작업실" <${process.env.GMAIL_USER}>`,
    to,
    subject: `💌 ${groomName} ♥ ${brideName}님의 AI 리포트가 도착했어요!`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Apple SD Gothic Neo', -apple-system, sans-serif;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0 0 8px 0;">AI 컨시어지 리포트</p>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">${groomName} ♥ ${brideName}</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px 20px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.8; text-align: center;">
            하객들이 AI에게 몰래 물어본<br/>
            <strong style="color: #7C3AED;">'그 질문들'</strong>을 확인해보세요!
          </p>
          
          ${data ? `
          <div style="display: flex; justify-content: center; gap: 16px; margin: 24px 0;">
            <div style="background: white; padding: 16px 24px; border-radius: 12px; text-align: center; flex: 1; max-width: 120px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="font-size: 28px; font-weight: bold; color: #1F2937; margin: 0;">${data.totalChats}</p>
              <p style="font-size: 12px; color: #9CA3AF; margin: 4px 0 0 0;">총 대화</p>
            </div>
            <div style="background: white; padding: 16px 24px; border-radius: 12px; text-align: center; flex: 1; max-width: 120px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="font-size: 28px; font-weight: bold; color: #1F2937; margin: 0;">${data.uniqueVisitors}</p>
              <p style="font-size: 12px; color: #9CA3AF; margin: 4px 0 0 0;">방문자</p>
            </div>
          </div>
          ` : ''}
          
          ${data?.topQuestions?.length ? `
          <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 12px 0;">📊 인기 질문 TOP 5</p>
            <table style="width: 100%; border-collapse: collapse;">
              ${topQuestionsHtml}
            </table>
          </div>
          ` : ''}
          
          ${data?.funnyQuestions?.length ? `
          <div style="margin: 20px 0;">
            <p style="font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 12px 0;">😂 웃긴 질문 모음</p>
            ${funnyHtml}
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reportUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              전체 리포트 확인하기 →
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            이 링크는 24시간 동안만 유효해요.
          </p>
        </div>
        
        <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            청첩장 작업실 | mail@weddingshop.cloud
          </p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendTestEmail(to: string) {
  const mailOptions = {
    from: `"청첩장 작업실" <${process.env.GMAIL_USER}>`,
    to,
    subject: '테스트 이메일입니다',
    text: '이메일 발송 테스트 성공!'
  };

  return transporter.sendMail(mailOptions);
}

export async function sendInquiryReply(to: string, name: string, originalMessage: string, reply: string) {
  const mailOptions = {
    from: `"청첩장 작업실" <${process.env.GMAIL_USER}>`,
    to,
    subject: `[청첩장 작업실] 문의하신 내용에 답변드립니다`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Apple SD Gothic Neo', sans-serif;">
        <div style="background: #1f2937; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">청첩장 작업실</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px 20px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.8;">
            안녕하세요, ${name}님!
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1f2937;">
            <p style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0; white-space: pre-wrap;">${reply}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            추가 문의사항이 있으시면 언제든 연락주세요.
          </p>
        </div>
        
        <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            청첩장 작업실 | mail@weddingshop.cloud
          </p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendGiftEmail(to: string, fromName: string, packageName: string, code: string, message?: string) {
  const mailOptions = {
    from: `"청첩장 작업실" <${process.env.GMAIL_USER}>`,
    to,
    subject: `🎁 ${fromName}님이 청첩장을 선물했어요!`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Apple SD Gothic Neo', sans-serif;">
        <div style="background: linear-gradient(135deg, #f472b6 0%, #ec4899 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎁 선물이 도착했어요!</h1>
        </div>
        
        <div style="background: #fdf2f8; padding: 30px 20px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.8; text-align: center;">
            <strong>${fromName}</strong>님이<br/>
            <strong>${packageName}</strong> 패키지를 선물했어요!
          </p>
          
          ${message ? `
          <div style="background: white; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">"${message}"</p>
          </div>
          ` : ''}
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">선물 코드</p>
            <p style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">${code}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://weddingshop.cloud/gift/redeem?code=${code}" style="display: inline-block; background: #ec4899; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              선물 받기 →
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            코드는 90일간 유효합니다.
          </p>
        </div>
        
        <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            청첩장 작업실 | mail@weddingshop.cloud
          </p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}
