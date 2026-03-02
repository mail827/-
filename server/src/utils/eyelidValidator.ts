import fetch from 'node-fetch';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

interface EyelidAnalysis {
  originalType: 'monolid' | 'double' | 'inner_double' | 'unknown';
  resultMatch: boolean;
  confidence: number;
}

export const classifyEyelidType = async (imageUrl: string): Promise<'monolid' | 'double' | 'inner_double' | 'unknown'> => {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
            { type: 'text', text: 'Classify this person\'s eyelid type. Reply ONLY with one word: monolid, inner_double, or double. No explanation.' }
          ]
        }]
      })
    });
    const data = await res.json() as any;
    const answer = (data.choices?.[0]?.message?.content || '').trim().toLowerCase();
    if (answer.includes('monolid')) return 'monolid';
    if (answer.includes('inner')) return 'inner_double';
    if (answer.includes('double')) return 'double';
    return 'unknown';
  } catch (e: any) {
    console.log('Eyelid classification failed:', e.message);
    return 'unknown';
  }
};

export const validateEyelidPreservation = async (
  originalUrl: string,
  resultUrl: string,
  originalType: string
): Promise<{ passed: boolean; reason: string }> => {
  if (originalType === 'double' || originalType === 'unknown') {
    return { passed: true, reason: 'skip_validation' };
  }
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 30,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: originalUrl, detail: 'low' } },
            { type: 'image_url', image_url: { url: resultUrl, detail: 'low' } },
            { type: 'text', text: 'The first image is the original person with monolid/inner double eyelids. The second image is an AI-generated result. Does the second image preserve the original eyelid type WITHOUT adding double eyelid surgery look? Reply ONLY: PASS or FAIL. No explanation.' }
          ]
        }]
      })
    });
    const data = await res.json() as any;
    const answer = (data.choices?.[0]?.message?.content || '').trim().toUpperCase();
    const passed = answer.includes('PASS');
    return { passed, reason: passed ? 'eyelid_preserved' : 'eyelid_modified' };
  } catch (e: any) {
    console.log('Eyelid validation failed:', e.message);
    return { passed: true, reason: 'validation_error_skip' };
  }
};
