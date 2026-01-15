import { SolapiMessageService } from 'solapi';

const messageService = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
);

interface RsvpNotificationData {
  to: string;
  groomName: string;
  brideName: string;
  guestName: string;
  attending: boolean;
  guestCount: number;
  weddingUrl: string;
}

export async function sendRsvpNotification(data: RsvpNotificationData) {
  try {
    const result = await messageService.send({
      to: data.to,
      from: process.env.SOLAPI_SENDER_NUMBER!,
      kakaoOptions: {
        pfId: process.env.KAKAO_CHANNEL_ID!,
        templateId: process.env.KAKAO_RSVP_TEMPLATE_ID!,
        variables: {
          '#{신랑이름}': data.groomName,
          '#{신부이름}': data.brideName,
          '#{게스트이름}': data.guestName,
          '#{참석여부}': data.attending ? '참석' : '불참',
          '#{인원수}': String(data.guestCount),
          '#{링크}': data.weddingUrl,
        },
      },
    });
    console.log('알림톡 발송 성공:', result);
    return result;
  } catch (error) {
    console.error('알림톡 발송 실패:', error);
    return null;
  }
}

interface SummaryNotificationData {
  to: string;
  groomName: string;
  brideName: string;
  totalGuests: number;
  attending: number;
  notAttending: number;
  totalPersons: number;
}

export async function sendSummaryNotification(data: SummaryNotificationData) {
  try {
    const message = `[${data.groomName}♥${data.brideName} 청첩장]
📊 RSVP 현황 알림

총 응답: ${data.totalGuests}명
✅ 참석: ${data.attending}명 (총 ${data.totalPersons}인)
❌ 불참: ${data.notAttending}명

from. 청첩장 작업실`;

    const result = await messageService.send({
      to: data.to,
      from: process.env.SOLAPI_SENDER_NUMBER!,
      text: message,
    });
    console.log('현황 알림 발송 성공:', result);
    return result;
  } catch (error) {
    console.error('현황 알림 발송 실패:', error);
    return null;
  }
}

interface ReminderNotificationData {
  to: string;
  groomName: string;
  brideName: string;
  dDay: number;
  weddingDate: string;
  weddingUrl: string;
}

export async function sendReminderNotification(data: ReminderNotificationData) {
  try {
    const dDayText = data.dDay === 0 ? 'D-Day' : data.dDay > 0 ? `D-${data.dDay}` : `D+${Math.abs(data.dDay)}`;
    const message = `[${data.groomName}♥${data.brideName} 청첩장]
💒 결혼식 ${dDayText}

📅 ${data.weddingDate}

💌 청첩장 보기
${data.weddingUrl}

from. 청첩장 작업실`;

    const result = await messageService.send({
      to: data.to,
      from: process.env.SOLAPI_SENDER_NUMBER!,
      text: message,
    });
    console.log('리마인더 발송 성공:', result);
    return result;
  } catch (error) {
    console.error('리마인더 발송 실패:', error);
    return null;
  }
}

interface CustomNotificationData {
  to: string;
  groomName: string;
  brideName: string;
  message: string;
}

export async function sendCustomNotification(data: CustomNotificationData) {
  try {
    const message = `[${data.groomName}♥${data.brideName} 청첩장]

${data.message}

from. 청첩장 작업실`;

    const result = await messageService.send({
      to: data.to,
      from: process.env.SOLAPI_SENDER_NUMBER!,
      text: message,
    });
    console.log('커스텀 알림 발송 성공:', result);
    return result;
  } catch (error) {
    console.error('커스텀 알림 발송 실패:', error);
    return null;
  }
}
