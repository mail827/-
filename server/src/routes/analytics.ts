import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { Router } from 'express';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const router = Router();

const propertyId = process.env.GA4_PROPERTY_ID || '520847842';

let analyticsClient: BetaAnalyticsDataClient | null = null;

const getClient = () => {
  if (!analyticsClient) {
    try {
      let credentials;
      const envCreds = process.env.GOOGLE_CREDENTIALS_JSON;
      const credPath = join(process.cwd(), 'ga-credentials.json');
      
      if (envCreds) {
        credentials = JSON.parse(envCreds);
      } else if (existsSync(credPath)) {
        credentials = JSON.parse(readFileSync(credPath, 'utf-8'));
      } else {
        throw new Error('No GA credentials found');
      }
      
      console.log('GA4 Config:', { propertyId, clientEmail: credentials.client_email });
      analyticsClient = new BetaAnalyticsDataClient({ credentials });
    } catch (e) {
      console.error('Failed to load GA credentials:', e);
      throw new Error('GA4 credentials not configured');
    }
  }
  return analyticsClient;
};

router.get('/realtime', async (req, res) => {
  try {
    const client = getClient();
    const [response] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }],
    });
    const activeUsers = response.rows?.[0]?.metricValues?.[0]?.value || '0';
    res.json({ activeUsers: parseInt(activeUsers) });
  } catch (error) {
    console.error('GA4 realtime error:', error);
    res.json({ activeUsers: 0, error: 'Failed to fetch' });
  }
});

router.get('/overview', async (req, res) => {
  try {
    const client = getClient();
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'screenPageViews' },
      ],
    });
    const row = response.rows?.[0];
    const metrics = row?.metricValues || [];
    res.json({
      totalUsers: parseInt(metrics[0]?.value || '0'),
      sessions: parseInt(metrics[1]?.value || '0'),
      bounceRate: parseFloat(metrics[2]?.value || '0').toFixed(1),
      avgSessionDuration: parseFloat(metrics[3]?.value || '0').toFixed(0),
      pageViews: parseInt(metrics[4]?.value || '0'),
    });
  } catch (error) {
    console.error('GA4 overview error:', error);
    res.json({ totalUsers: 0, sessions: 0, bounceRate: '0', avgSessionDuration: '0', pageViews: 0, error: 'Failed to fetch' });
  }
});

router.get('/pages', async (req, res) => {
  try {
    const client = getClient();
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'bounceRate' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    });
    const pages = response.rows?.map((row) => ({
      path: row.dimensionValues?.[0]?.value || '',
      views: parseInt(row.metricValues?.[0]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[1]?.value || '0').toFixed(1),
    })) || [];
    res.json({ pages });
  } catch (error) {
    console.error('GA4 pages error:', error);
    res.json({ pages: [], error: 'Failed to fetch' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const client = getClient();
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 20,
    });
    const events = response.rows?.map((row) => ({
      name: row.dimensionValues?.[0]?.value || '',
      count: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || [];
    res.json({ events });
  } catch (error) {
    console.error('GA4 events error:', error);
    res.json({ events: [], error: 'Failed to fetch' });
  }
});

router.get('/devices', async (req, res) => {
  try {
    const client = getClient();
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'totalUsers' }],
    });
    const devices = response.rows?.map((row) => ({
      device: row.dimensionValues?.[0]?.value || '',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || [];
    res.json({ devices });
  } catch (error) {
    console.error('GA4 devices error:', error);
    res.json({ devices: [], error: 'Failed to fetch' });
  }
});

router.get('/daily', async (req, res) => {
  try {
    const client = getClient();
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '14daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    });
    const daily = response.rows?.map((row) => ({
      date: row.dimensionValues?.[0]?.value || '',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
    })) || [];
    res.json({ daily });
  } catch (error) {
    console.error('GA4 daily error:', error);
    res.json({ daily: [], error: 'Failed to fetch' });
  }
});

export { router as analyticsRouter };

router.post('/visit', async (req, res) => {
  try {
    const { path, referrer, utmSource, utmMedium, utmCampaign, utmContent, device, browser, sessionId } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || null;
    await prisma.visit.create({
      data: { path, referrer: referrer || null, utmSource: utmSource || null, utmMedium: utmMedium || null, utmCampaign: utmCampaign || null, utmContent: utmContent || null, device: device || null, browser: browser || null, sessionId: sessionId || null, ip },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('Visit track error:', e);
    res.json({ ok: false });
  }
});

router.get('/traffic', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const visits = await prisma.visit.findMany({
      where: { createdAt: { gte: since } },
      select: { referrer: true, utmSource: true, utmMedium: true, utmCampaign: true, device: true, createdAt: true },
    });

    const channelMap: Record<string, number> = {};
    const campaignMap: Record<string, number> = {};
    const dailyMap: Record<string, number> = {};

    visits.forEach(v => {
      let channel = 'direct';
      if (v.utmSource) {
        channel = v.utmSource;
      } else if (v.referrer) {
        if (v.referrer.includes('instagram')) channel = 'instagram';
        else if (v.referrer.includes('t.co') || v.referrer.includes('twitter')) channel = 'twitter';
        else if (v.referrer.includes('facebook') || v.referrer.includes('fb.')) channel = 'facebook';
        else if (v.referrer.includes('naver')) channel = 'naver';
        else if (v.referrer.includes('google')) channel = 'google';
        else if (v.referrer.includes('kakao')) channel = 'kakao';
        else if (v.referrer.includes('blog')) channel = 'blog';
        else if (v.referrer.includes('youtube') || v.referrer.includes('youtu.be')) channel = 'youtube';
        else if (v.referrer.includes('threads.net')) channel = 'threads';
        else channel = new URL(v.referrer).hostname.replace('www.', '');
      }
      channelMap[channel] = (channelMap[channel] || 0) + 1;

      if (v.utmCampaign) {
        campaignMap[v.utmCampaign] = (campaignMap[v.utmCampaign] || 0) + 1;
      }

      const day = v.createdAt.toISOString().slice(0, 10);
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    });

    const channels = Object.entries(channelMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const campaigns = Object.entries(campaignMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const daily = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ total: visits.length, channels, campaigns, daily });
  } catch (e) {
    console.error('Traffic stats error:', e);
    res.json({ total: 0, channels: [], campaigns: [], daily: [] });
  }
});

router.get('/traffic-ga', async (req, res) => {
  try {
    const client = getClient();
    const days = parseInt(req.query.days as string) || 30;
    const startDate = `${days}daysAgo`;

    const [sourceRes] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 30,
    });

    const [dailyRes] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'date' }, { name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    });

    const [campaignRes] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'sessionCampaignName' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 20,
    });

    const channels = sourceRes.rows?.map(row => ({
      source: row.dimensionValues?.[0]?.value || '(direct)',
      medium: row.dimensionValues?.[1]?.value || '(none)',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0'),
    })) || [];

    const totalSessions = channels.reduce((s, c) => s + c.sessions, 0);

    const dailyMap: Record<string, number> = {};
    dailyRes.rows?.forEach(row => {
      const date = row.dimensionValues?.[0]?.value || '';
      const count = parseInt(row.metricValues?.[0]?.value || '0');
      const formatted = date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
      dailyMap[formatted] = (dailyMap[formatted] || 0) + count;
    });
    const daily = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const campaigns = campaignRes.rows
      ?.filter(row => {
        const v = row.dimensionValues?.[0]?.value || '';
        return !['(not set)', '(referral)', '(direct)', '(organic)'].includes(v);
      })
      .map(row => ({
        name: row.dimensionValues?.[0]?.value || '',
        count: parseInt(row.metricValues?.[0]?.value || '0'),
      })) || [];

    res.json({ total: totalSessions, channels, campaigns, daily });
  } catch (e) {
    console.error('GA traffic error:', e);
    res.json({ total: 0, channels: [], campaigns: [], daily: [] });
  }
});
