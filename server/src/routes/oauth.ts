import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

router.get('/kakao', (req, res) => {
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.KAKAO_REDIRECT_URI!)}&response_type=code`;
  res.redirect(kakaoAuthUrl);
});

router.get('/kakao/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID!,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code: code as string,
      }),
    });
    
    const tokenData = await tokenRes.json();
    console.log('Kakao token response:', tokenData);
    
    if (!tokenData.access_token) {
      console.error('No access token:', tokenData);
      return res.redirect(`${process.env.CLIENT_URL}?error=no_token`);
    }
    
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    const kakaoUser = await userRes.json();
    console.log('Kakao user:', kakaoUser);
    
    let user = await prisma.user.findUnique({
      where: { provider_providerId: { provider: 'KAKAO', providerId: String(kakaoUser.id) } },
    });
    
    if (!user) {
      const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
      const email = kakaoUser.kakao_account?.email || `kakao_${kakaoUser.id}@wedding.app`;
      
      user = await prisma.user.create({
        data: {
          email,
          name: kakaoUser.properties?.nickname || '사용자',
          profileImage: kakaoUser.properties?.profile_image,
          provider: 'KAKAO',
          providerId: String(kakaoUser.id),
          role: adminEmails.includes(email) ? 'ADMIN' : 'CUSTOMER',
        },
      });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.redirect(`${process.env.CLIENT_URL}/oauth/callback?token=${token}`);
  } catch (error) {
    console.error('Kakao OAuth error:', error);
    res.redirect(`${process.env.CLIENT_URL}?error=oauth_failed`);
  }
});

export const oauthRouter = router;

router.get('/google', (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI!)}&response_type=code&scope=email%20profile`;
  res.redirect(googleAuthUrl);
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        code: code as string,
      }),
    });
    
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      console.error('No access token:', tokenData);
      return res.redirect(`${process.env.CLIENT_URL}?error=no_token`);
    }
    
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    const googleUser = await userRes.json();
    console.log('Google user:', googleUser);
    
    let user = await prisma.user.findUnique({
      where: { provider_providerId: { provider: 'GOOGLE', providerId: googleUser.id } },
    });
    
    if (!user) {
      // 같은 이메일로 가입한 유저 있는지 확인
      const existingUser = await prisma.user.findFirst({
        where: { email: googleUser.email },
      });
      
      if (existingUser) {
        // 기존 유저가 있으면 그 유저로 로그인
        user = existingUser;
      } else {
        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
        
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name || '사용자',
            profileImage: googleUser.picture,
            provider: 'GOOGLE',
            providerId: googleUser.id,
            role: adminEmails.includes(googleUser.email) ? 'ADMIN' : 'CUSTOMER',
          },
        });
      }
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.redirect(`${process.env.CLIENT_URL}/oauth/callback?token=${token}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.CLIENT_URL}?error=oauth_failed`);
  }
});
