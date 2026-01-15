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
