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
