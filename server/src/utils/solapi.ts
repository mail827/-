import crypto from 'crypto';

const SOLAPI_API_URL = 'https://api.solapi.com/messages/v4/send';

function getAuthHeader() {
  const apiKey = process.env.SOLAPI_API_KEY!;
  const apiSecret = process.env.SOLAPI_API_SECRET!;
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString('hex');
  const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex');
  
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

const cleanPhone = (phone: string) => phone.replace(/[^0-9]/g, '');

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
  const toPhone = cleanPhone(data.to);
  const fromPhone = cleanPhone(process.env.SOLAPI_SENDER_NUMBER!);
  console.log('RSVP 알림톡 발송 시도:', { to: toPhone, from: fromPhone });
  
  try {
    const response = await fetch(SOLAPI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          to: toPhone,
          from: fromPhone,
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
        }
      }),
    });
    
    const result = await response.json();
    console.log('RSVP 알림톡 응답:', JSON.stringify(result, null, 2));
    
    if (!response.ok || result.errorCode) {
      console.error('RSVP 알림톡 발송 실패:', result);
      return null;
    }
    
    return result;
  } catch (error: any) {
    console.error('RSVP 알림톡 발송 에러:', error?.message || error);
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
  weddingUrl: string;
}

export async function sendSummaryNotification(data: SummaryNotificationData) {
  const toPhone = cleanPhone(data.to);
  if (toPhone.length < 10) {
    console.log('유효하지 않은 전화번호:', toPhone);
    return null;
  }
  
  const fromPhone = cleanPhone(process.env.SOLAPI_SENDER_NUMBER!);
  console.log('현황 알림톡 발송 시도:', { to: toPhone, from: fromPhone });
  
  try {
    const response = await fetch(SOLAPI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          to: toPhone,
          from: fromPhone,
          kakaoOptions: {
            pfId: process.env.KAKAO_CHANNEL_ID!,
            templateId: process.env.KAKAO_SUMMARY_TEMPLATE_ID!,
            variables: {
              '#{신랑이름}': data.groomName,
              '#{신부이름}': data.brideName,
              '#{총응답}': String(data.totalGuests),
              '#{참석}': String(data.attending),
              '#{총인원}': String(data.totalPersons),
              '#{불참}': String(data.notAttending),
              '#{링크}': data.weddingUrl,
            },
          },
        }
      }),
    });
    
    const result = await response.json();
    console.log('현황 알림톡 응답:', JSON.stringify(result, null, 2));
    
    if (!response.ok || result.errorCode) {
      console.error('현황 알림톡 발송 실패:', result);
      return null;
    }
    
    return result;
  } catch (error: any) {
    console.error('현황 알림톡 발송 에러:', error?.message || error);
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
  const toPhone = cleanPhone(data.to);
  if (toPhone.length < 10) {
    console.log('유효하지 않은 전화번호:', toPhone);
    return null;
  }
  
  const fromPhone = cleanPhone(process.env.SOLAPI_SENDER_NUMBER!);
  console.log('리마인더 알림톡 발송 시도:', { to: toPhone, from: fromPhone });
  
  try {
    const dDayText = data.dDay === 0 ? 'D-Day' : data.dDay > 0 ? `D-${data.dDay}` : `D+${Math.abs(data.dDay)}`;
    
    const response = await fetch(SOLAPI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          to: toPhone,
          from: fromPhone,
          kakaoOptions: {
            pfId: process.env.KAKAO_CHANNEL_ID!,
            templateId: process.env.KAKAO_REMINDER_TEMPLATE_ID!,
            variables: {
              '#{신랑이름}': data.groomName,
              '#{신부이름}': data.brideName,
              '#{디데이}': dDayText,
              '#{결혼일}': data.weddingDate,
              '#{링크}': data.weddingUrl,
            },
          },
        }
      }),
    });
    
    const result = await response.json();
    console.log('리마인더 알림톡 응답:', JSON.stringify(result, null, 2));
    
    if (!response.ok || result.errorCode) {
      console.error('리마인더 알림톡 발송 실패:', result);
      return null;
    }
    
    return result;
  } catch (error: any) {
    console.error('리마인더 알림톡 발송 에러:', error?.message || error);
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
  const toPhone = cleanPhone(data.to);
  if (toPhone.length < 10) {
    console.log('유효하지 않은 전화번호:', toPhone);
    return null;
  }
  
  const fromPhone = cleanPhone(process.env.SOLAPI_SENDER_NUMBER!);
  console.log('커스텀 알림 발송 시도:', { to: toPhone, from: fromPhone });
  
  try {
    const text = `[${data.groomName}♥${data.brideName} 청첩장]\n\n${data.message}\n\nfrom. 청첩장 작업실`;

    const response = await fetch(SOLAPI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: { to: toPhone, from: fromPhone, text, type: 'LMS' }
      }),
    });
    
    const result = await response.json();
    console.log('커스텀 알림 응답:', JSON.stringify(result, null, 2));
    
    if (!response.ok || result.errorCode) {
      console.error('커스텀 알림 발송 실패:', result);
      return null;
    }
    
    return result;
  } catch (error: any) {
    console.error('커스텀 알림 발송 에러:', error?.message || error);
    return null;
  }
}

interface PaymentNotificationData {
  to: string;
  customerName: string;
  productName: string;
  amount: number;
  link: string;
}

export async function sendPaymentNotification(data: PaymentNotificationData) {
  const toPhone = cleanPhone(data.to);
  if (toPhone.length < 10) {
    console.log('유효하지 않은 전화번호:', toPhone);
    return null;
  }
  
  const fromPhone = cleanPhone(process.env.SOLAPI_SENDER_NUMBER!);
  console.log('결제완료 알림톡 발송 시도:', { to: toPhone, from: fromPhone });
  
  try {
    const response = await fetch(SOLAPI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          to: toPhone,
          from: fromPhone,
          kakaoOptions: {
            pfId: process.env.KAKAO_CHANNEL_ID!,
            templateId: process.env.KAKAO_PAYMENT_TEMPLATE_ID!,
            variables: {
              '#{고객명}': data.customerName,
              '#{상품명}': data.productName,
              '#{결제금액}': data.amount.toLocaleString(),
              '#{링크}': data.link,
            },
          },
        }
      }),
    });
    
    const result = await response.json();
    console.log('결제완료 알림톡 응답:', JSON.stringify(result, null, 2));
    
    if (!response.ok || result.errorCode) {
      console.error('결제완료 알림톡 발송 실패:', result);
      return null;
    }
    
    return result;
  } catch (error: any) {
    console.error('결제완료 알림톡 발송 에러:', error?.message || error);
    return null;
  }
}

interface GiftNotificationData {
  to: string;
  groomName: string;
  brideName: string;
  senderName: string;
  giftName: string;
  message: string;
  link: string;
}

export async function sendGiftNotification(data: GiftNotificationData) {
  const toPhone = cleanPhone(data.to);
  if (toPhone.length < 10) {
    console.log('유효하지 않은 전화번호:', toPhone);
    return null;
  }
  
  const fromPhone = cleanPhone(process.env.SOLAPI_SENDER_NUMBER!);
  console.log('선물도착 알림톡 발송 시도:', { to: toPhone, from: fromPhone });
  
  try {
    const response = await fetch(SOLAPI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          to: toPhone,
          from: fromPhone,
          kakaoOptions: {
            pfId: process.env.KAKAO_CHANNEL_ID!,
            templateId: process.env.KAKAO_GIFT_TEMPLATE_ID!,
            variables: {
              '#{신랑이름}': data.groomName,
              '#{신부이름}': data.brideName,
              '#{보낸사람}': data.senderName,
              '#{선물명}': data.giftName,
              '#{메시지}': data.message || '(메시지 없음)',
              '#{링크}': data.link,
            },
          },
        }
      }),
    });
    
    const result = await response.json();
    console.log('선물도착 알림톡 응답:', JSON.stringify(result, null, 2));
    
    if (!response.ok || result.errorCode) {
      console.error('선물도착 알림톡 발송 실패:', result);
      return null;
    }
    
    return result;
  } catch (error: any) {
    console.error('선물도착 알림톡 발송 에러:', error?.message || error);
    return null;
  }
}
