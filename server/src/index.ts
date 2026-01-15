import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { emailAuthRouter } from './routes/emailAuth.js';
import { oauthRouter } from './routes/oauth.js';
import { weddingRouter } from './routes/wedding.js';
import { uploadRouter } from './routes/upload.js';
import { rsvpRouter } from './routes/rsvp.js';
import { notificationRouter } from './routes/notification.js';
import { guestbookRouter } from './routes/guestbook.js';
import publicRouter from './routes/public.js';
import { chatRouter } from './routes/chat.js';
import { paymentRouter } from './routes/payment.js';
import { adminRouter } from './routes/admin.js';
import aiRouter from './routes/ai.js';
import aiReportRouter from "./routes/aiReport.js";
import reportRouter from "./routes/report.js";
import { seedPackages } from './utils/seed.js';
import giftRouter from "./routes/gift.js";
import { startScheduler } from "./utils/scheduler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://dummywedding.vercel.app',
    'https://weddingshop.cloud',
    'https://www.weddingshop.cloud',
    'https://dummywedding-leedakyums-projects.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/email-auth', emailAuthRouter);
app.use('/api/oauth', oauthRouter);
app.use('/api/weddings', weddingRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/rsvp', rsvpRouter);
app.use('/api/notification', notificationRouter);
app.use('/api/guestbook', guestbookRouter);
app.use('/api/public', publicRouter);
app.use('/api/chat', chatRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/admin', adminRouter);
app.use("/api/weddings", aiReportRouter);
app.use("/api/report", reportRouter);
app.use("/api/gift", giftRouter);
app.use('/api/ai', aiRouter);

seedPackages();

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('🎊 Wedding Server running on port ' + PORT);
  startScheduler();
});
