import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/:id/translate', authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const wedding = await prisma.wedding.findUnique({ where: { id } });
  if (!wedding) return res.status(404).json({ error: 'Not found' });
  if (wedding.userId !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const fields: Record<string, string> = {};
  if (wedding.greeting) fields.greeting = wedding.greeting;
  if (wedding.greetingTitle) fields.greetingTitle = wedding.greetingTitle;
  if (wedding.closingMessage) fields.closingMessage = wedding.closingMessage;
  if (wedding.venue) fields.venue = wedding.venue;
  if (wedding.venueHall) fields.venueHall = wedding.venueHall;
  if (wedding.venueAddress) fields.venueAddress = wedding.venueAddress;
  if (wedding.transportInfo) fields.transportInfo = wedding.transportInfo;
  if (wedding.parkingInfo) fields.parkingInfo = wedding.parkingInfo;
  if ((wedding as any).envelopeCardText) fields.envelopeCardText = (wedding as any).envelopeCardText;

  const tabs = (wedding as any).venueDetailTabs as { title: string; content: string; image?: string }[] | null;
  if (tabs && tabs.length > 0) {
    tabs.forEach((tab, i) => {
      fields[`tab_${i}_title`] = tab.title;
      if (tab.content) fields[`tab_${i}_content`] = tab.content;
    });
  }

  if (Object.keys(fields).length === 0) {
    return res.json({ translationsEn: {} });
  }

  try {
    const prompt = `You are a professional wedding invitation translator. Translate the following Korean wedding invitation texts to natural, elegant English. Keep names in their original form. Keep the tone warm and formal, appropriate for a wedding invitation.

Return ONLY a JSON object with the same keys, translated values. No markdown, no explanation.

${JSON.stringify(fields, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const text = response.choices[0]?.message?.content?.trim() || '{}';
    let translations: Record<string, string>;
    try {
      translations = JSON.parse(text.replace(/```json\n?|```/g, '').trim());
    } catch {
      console.error('[translate] GPT response not JSON:', text.slice(0, 300));
      return res.status(500).json({ error: 'Translation parse failed' });
    }

    if (tabs && tabs.length > 0) {
      const translatedTabs = tabs.map((tab, i) => ({
        title: translations[`tab_${i}_title`] || tab.title,
        content: translations[`tab_${i}_content`] || tab.content,
        image: tab.image,
      }));
      translations.venueDetailTabs = JSON.stringify(translatedTabs);
      tabs.forEach((_, i) => {
        delete translations[`tab_${i}_title`];
        delete translations[`tab_${i}_content`];
      });
    }

    await prisma.wedding.update({
      where: { id },
      data: { translationsEn: translations } as any,
    });

    res.json({ translationsEn: translations });
  } catch (e: any) {
    console.error('[translate] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id/translations', async (req, res) => {
  const wedding = await prisma.wedding.findUnique({
    where: { id: req.params.id },
    select: { translationsEn: true } as any,
  });
  if (!wedding) return res.status(404).json({ error: 'Not found' });
  res.json({ translationsEn: (wedding as any).translationsEn || {} });
});

export default router;
