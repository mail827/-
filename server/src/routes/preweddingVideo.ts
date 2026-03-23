import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';


const router = Router();
const prisma = new PrismaClient();

const FAL_API_KEY = process.env.FAL_API_KEY;
const ARK_API_KEY = process.env.ARK_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ARK_BASE = 'https://ark.ap-southeast.bytepluses.com/api/v3';

const PRICING: Record<string, { amount: number; label: string }> = {
  basic: { amount: 29000, label: '식전영상 Basic' },
  premium: { amount: 49000, label: '식전영상 Premium' },
};

const FONTS = [
  { id: 'BMJUA_ttf', name: '주아체', file: 'BMJUA_ttf.ttf' },
  { id: 'BMKkubulimTTF', name: '배민 꾸불림', file: 'BMKkubulimTTF.ttf' },
  { id: 'ChosunGs', name: '조선 고딕', file: 'ChosunGs.TTF' },
  { id: 'ChosunNm', name: '조선 명조', file: 'ChosunNm.ttf' },
  { id: 'ChosunBg', name: '조선 붓글씨', file: 'ChosunBg.TTF' },
  { id: 'Diphylleia-Regular', name: '디필레이아', file: 'Diphylleia-Regular.ttf' },
  { id: 'GreatVibes-Regular', name: 'Great Vibes', file: 'GreatVibes-Regular.ttf' },
  { id: 'DXMSUBTITLESM', name: 'DX 자막체', file: 'DXMSubtitlesM-KSCpc-EUC-H.woff2' },
];

const adminOnly = (req: AuthRequest, res: Response, next: Function) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' });
  next();
};

router.get('/config', (_req, res) => {
  res.json({ pricing: PRICING, fonts: FONTS });
});

router.get('/bgm', async (_req, res) => {
  try {
    const bgms = await prisma.bgMusic.findMany({
      where: { isActive: true, category: 'prewedding' },
      orderBy: { order: 'asc' },
    });
    res.json(bgms);
  } catch {
    res.status(500).json({ error: 'BGM 조회 실패' });
  }
});

router.post('/create', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { groomName, brideName, weddingDate, metStory, photos, bgmId, bgmUrl, fontId, tier } = req.body;

  if (!groomName || !brideName || !photos?.length || photos.length < 3) {
    return res.status(400).json({ error: '신랑/신부 이름, 사진 3장 이상 필요' });
  }

  const pricing = PRICING[tier] || PRICING.basic;
  const orderId = `PV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const video = await prisma.preweddingVideo.create({
      data: {
        userId,
        groomName,
        brideName,
        weddingDate: weddingDate || '',
        metStory: metStory || '',
        photos,
        bgmId: bgmId || null,
        bgmUrl: bgmUrl || null,
        fontId: fontId || 'BMJUA_ttf',
        amount: pricing.amount,
        orderId,
        status: 'PENDING',
      },
    });

    res.json({ id: video.id, orderId, amount: pricing.amount, label: pricing.label, clientKey: process.env.TOSS_CLIENT_KEY });
  } catch (e: any) {
    console.error('PreweddingVideo create error:', e);
    res.status(500).json({ error: '주문 생성 실패' });
  }
});

router.post('/payment/confirm', authMiddleware, async (req: AuthRequest, res) => {
  const { orderId, paymentKey, amount } = req.body;

  try {
    const video = await prisma.preweddingVideo.findUnique({ where: { orderId } });
    if (!video) return res.status(404).json({ error: '주문 없음' });
    if (video.userId !== req.user!.id) return res.status(403).json({ error: 'forbidden' });
    if (video.amount !== amount) return res.status(400).json({ error: '금액 불일치' });

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify({ orderId, paymentKey, amount }),
    });

    if (!tossRes.ok) {
      const err = await tossRes.json();
      return res.status(400).json({ error: err.message || '결제 실패' });
    }

    await prisma.preweddingVideo.update({
      where: { orderId },
      data: { paymentKey, paidAt: new Date(), status: 'ANALYZING' },
    });

    processVideoAsync(video.id).catch(err => {
      console.error('Pipeline error:', err);
      prisma.preweddingVideo.update({
        where: { id: video.id },
        data: { status: 'FAILED', errorMsg: err.message },
      });
    });

    res.json({ success: true, videoId: video.id });
  } catch (e: any) {
    console.error('Payment confirm error:', e);
    res.status(500).json({ error: '결제 확인 실패' });
  }
});

router.get('/my', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const videos = await prisma.preweddingVideo.findMany({
      where: { userId: req.user!.id, paidAt: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(videos);
  } catch {
    res.status(500).json({ error: '조회 실패' });
  }
});

router.get('/poll/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const video = await prisma.preweddingVideo.findUnique({ where: { id: req.params.id } });
    if (!video) return res.status(404).json({ error: 'not found' });
    if (video.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' });

    res.json({
      status: video.status,
      outputUrl: video.outputUrl,
      totalDuration: video.totalDuration,
      errorMsg: video.errorMsg,
      scenes: video.scenes,
    });
  } catch {
    res.status(500).json({ error: '조회 실패' });
  }
});

router.get('/admin/list', authMiddleware, adminOnly, async (_req, res) => {
  try {
    const videos = await prisma.preweddingVideo.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true } } },
    });
    res.json(videos);
  } catch {
    res.status(500).json({ error: '조회 실패' });
  }
});

async function gptRequest(messages: any[], maxTokens = 1000) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'gpt-4o', messages, max_tokens: maxTokens }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function analyzePhotos(photoUrls: string[]) {
  const content: any[] = [
    { type: 'text', text: `Analyze ${photoUrls.length} wedding photos. For each return: type ("solo_male"|"solo_female"|"couple"|"landscape"|"detail"), emotion ("warm"|"calm"|"energetic"|"intimate"|"joyful"), quality (1-10), setting ("indoor"|"outdoor"|"studio"|"nature"|"urban"). Return ONLY JSON array.` },
    ...photoUrls.map(url => ({ type: 'image_url', image_url: { url, detail: 'low' } })),
  ];
  const text = await gptRequest([{ role: 'user', content }]);
  try {
    return JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
  } catch {
    return photoUrls.map(() => ({ type: 'couple', emotion: 'warm', quality: 5, setting: 'outdoor' }));
  }
}

async function generateSubtitles(analyses: any[], groomName: string, brideName: string, metStory: string) {
  const prompt = `You are writing Korean subtitles for a wedding pre-ceremony video.
Couple: ${groomName} & ${brideName}
Story hint: ${metStory || 'none'}
Photos: ${JSON.stringify(analyses.map((a: any, i: number) => ({ scene: i + 1, type: a.type, emotion: a.emotion })))}

Rules:
- Write short, emotional Korean subtitles (max 15 chars each)
- Scene plan: intro, rising, rising, building, building, climax (no subtitle), ending (names only)
- Match emotion to each scene phase
- Return JSON array: ["subtitle1", "subtitle2", ...]
- Climax scene = empty string
- Ending scene = "${groomName} & ${brideName}"`;

  const text = await gptRequest([{ role: 'user', content: prompt }], 500);
  try {
    return JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
  } catch {
    return ['처음 만난 그 날부터', '함께한 시간이 쌓여갈수록', '서로의 온도를 알아갈 때', '웃음이 닿는 곳마다', '그래서, 당신과', '', `${groomName} & ${brideName}`];
  }
}

function decideTier(photoType: string, phase: string): 'premium' | 'budget' {
  if (photoType === 'couple') return 'premium';
  if (phase === 'climax' || phase === 'ending') return 'premium';
  return 'budget';
}

async function generateKlingClip(photoUrl: string, prompt: string, duration: number) {
  const result = await fetch('https://queue.fal.run/fal-ai/kling-video/v3/standard/image-to-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${FAL_API_KEY}` },
    body: JSON.stringify({
      input: {
        prompt,
        image_url: photoUrl,
        duration: String(duration),
        aspect_ratio: '9:16',
        cfg_scale: 0.5,
        generate_audio: false,
        negative_prompt: 'blur, distort, low quality, morphing, face change, extra person, grain, noise',
      },
    }),
  });
  const data = await result.json();
  const requestId = data.request_id;
  if (!requestId) return null;

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const poll = await fetch(`https://queue.fal.run/fal-ai/kling-video/v3/standard/image-to-video/status/${requestId}`, {
      headers: { 'Authorization': `Key ${FAL_API_KEY}` },
    });
    const status = await poll.json();
    if (status.status === 'COMPLETED') return status.response?.data?.video?.url || null;
    if (status.status === 'FAILED') return null;
  }
  return null;
}

async function generateSeedanceClip(photoUrl: string, prompt: string, duration: number) {
  const fullPrompt = `${prompt} --resolution 720p --ratio 9:16 --dur ${duration} --seed -1`;
  const res = await fetch(`${ARK_BASE}/contents/generations/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ARK_API_KEY}` },
    body: JSON.stringify({
      model: 'seedance-1-5-pro-251215',
      content: [
        { type: 'image_url', image_url: { url: photoUrl } },
        { type: 'text', text: fullPrompt },
      ],
    }),
  });
  if (!res.ok) return null;
  const task = await res.json();

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const poll = await fetch(`${ARK_BASE}/contents/generations/tasks/${task.id}`, {
      headers: { 'Authorization': `Bearer ${ARK_API_KEY}` },
    });
    const data = await poll.json();
    if (data.status === 'succeeded') return data.content?.video_url || null;
    if (data.status === 'failed') return null;
  }
  return null;
}

function buildPrompt(photoType: string, camera: string, phase: string) {
  const cam: Record<string, string> = {
    zoom_out: 'Extremely subtle slow zoom out. Barely noticeable movement.',
    pan_right: 'Very subtle slow horizontal drift right. Minimal movement.',
    zoom_in: 'Very gentle slow zoom in. Minimal movement. Calm.',
    pan_left: 'Very subtle slow drift left. Minimal movement.',
    static: 'Camera completely still. Almost a photograph. Only subtle natural breathing.',
  };
  const type: Record<string, string> = {
    solo_male: 'Portrait of one man. Solo. Do NOT add any other person.',
    solo_female: 'Portrait of one woman. Solo. Do NOT add any other person.',
    couple: 'The couple together. Natural intimate moment.',
    landscape: 'Scenic environment. Atmospheric.',
    detail: 'Close-up detail. Soft background.',
  };
  return [
    cam[camera] || cam.static,
    type[photoType] || type.couple,
    'Cinematic. Clean sharp image. Shallow depth of field. No grain. No noise.',
    'Natural movement only. No morphing. No face distortion. Preserve original appearance.',
  ].join(' ');
}

async function processVideoAsync(videoId: string) {
  const video = await prisma.preweddingVideo.findUnique({ where: { id: videoId } });
  if (!video) throw new Error('Video not found');

  const photoUrls = video.photos as string[];

  await prisma.preweddingVideo.update({ where: { id: videoId }, data: { status: 'ANALYZING' } });
  const analyses = await analyzePhotos(photoUrls);
  const subtitles = await generateSubtitles(analyses, video.groomName, video.brideName, video.metStory || '');

  await prisma.preweddingVideo.update({ where: { id: videoId }, data: { photoAnalysis: analyses, subtitles } });

  const template = [
    { phase: 'intro', camera: 'zoom_out', duration: 5 },
    { phase: 'rising', camera: 'pan_right', duration: 5 },
    { phase: 'rising', camera: 'zoom_in', duration: 5 },
    { phase: 'building', camera: 'pan_left', duration: 4 },
    { phase: 'building', camera: 'zoom_in', duration: 4 },
    { phase: 'climax', camera: 'static', duration: 6 },
    { phase: 'ending', camera: 'static', duration: 5 },
  ];

  const sceneCount = Math.min(7, Math.max(5, photoUrls.length + 2));
  const bestIdx = analyses.reduce((b: number, a: any, i: number) => (a.quality > analyses[b].quality ? i : b), 0);
  const sorted = [...analyses.map((a: any, i: number) => ({ ...a, url: photoUrls[i] }))];
  const best = sorted.splice(bestIdx, 1)[0];

  const scenes = template.slice(0, sceneCount).map((t, i) => {
    let photo;
    if (t.phase === 'climax') photo = best;
    else if (t.phase === 'ending') photo = sorted.find(a => a.type === 'couple') || best;
    else photo = sorted[i % sorted.length] || best;

    const tier = decideTier(photo.type, t.phase);
    return { ...t, photoUrl: photo.url, photoType: photo.type, tier, subtitle: subtitles[i] || '' };
  });

  await prisma.preweddingVideo.update({ where: { id: videoId }, data: { scenes, status: 'GENERATING' } });

  const clipUrls: string[] = [];
  let totalCost = 0;

  for (const scene of scenes) {
    const prompt = buildPrompt(scene.photoType, scene.camera, scene.phase);
    let clipUrl: string | null = null;

    if (scene.tier === 'premium') {
      clipUrl = await generateKlingClip(scene.photoUrl, prompt, scene.duration);
      totalCost += 0.56;
    } else {
      clipUrl = await generateSeedanceClip(scene.photoUrl, prompt, scene.duration);
      totalCost += 0.005;
    }

    clipUrls.push(clipUrl || '');
  }

  const validClips = clipUrls.filter(Boolean);
  if (validClips.length < 3) {
    await prisma.preweddingVideo.update({
      where: { id: videoId },
      data: { status: 'FAILED', errorMsg: `Only ${validClips.length} clips succeeded` },
    });
    return;
  }

  await prisma.preweddingVideo.update({
    where: { id: videoId },
    data: { clipUrls, status: 'ASSEMBLING', totalCost },
  });

  const tmpDir = `/tmp/pv-${videoId}`;
  const { execSync } = await import('child_process');
  const fs = await import('fs');
  const path = await import('path');

  fs.mkdirSync(tmpDir, { recursive: true });

  const clipPaths: string[] = [];
  const validScenes: typeof scenes = [];
  for (let i = 0; i < clipUrls.length; i++) {
    if (!clipUrls[i]) continue;
    const clipPath = path.join(tmpDir, `clip_${i}.mp4`);
    try {
      execSync(`curl -sL -o "${clipPath}" "${clipUrls[i]}"`, { timeout: 120000 });
      clipPaths.push(clipPath);
      validScenes.push(scenes[i]);
    } catch {}
  }

  if (clipPaths.length < 3) {
    await prisma.preweddingVideo.update({
      where: { id: videoId },
      data: { status: 'FAILED', errorMsg: 'Not enough clips downloaded' },
    });
    return;
  }

  let bgmPath = '';
  if (video.bgmUrl) {
    bgmPath = path.join(tmpDir, 'bgm.mp3');
    try { execSync(`curl -sL -o "${bgmPath}" "${video.bgmUrl}"`, { timeout: 60000 }); } catch { bgmPath = ''; }
  }

  const filters: string[] = [];
  const n = clipPaths.length;

  for (let i = 0; i < n; i++) {
    filters.push(`[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24[scaled${i}]`);
    filters.push(`[scaled${i}]crop=1080:1728:0:96[v${i}]`);
  }

  let currentStream = '[v0]';
  let runningOffset = validScenes[0].duration;

  for (let i = 1; i < n; i++) {
    const offset = (runningOffset - 0.1).toFixed(1);
    const out = `[xf${i}]`;
    filters.push(`${currentStream}[v${i}]xfade=transition=fade:duration=0.1:offset=${offset}${out}`);
    currentStream = out;
    runningOffset = parseFloat(offset) + validScenes[i].duration;
  }

  const totalDuration = runningOffset;
  filters.push(`${currentStream}pad=1080:1920:0:96:black[letterbox]`);
  filters.push(`[letterbox]fade=t=in:st=0:d=2,fade=t=out:st=${(totalDuration - 2).toFixed(1)}:d=2[vfinal]`);

  const inputs = clipPaths.map(p => `-i "${p}"`);
  const hasAudio = bgmPath && fs.existsSync(bgmPath);

  if (hasAudio) {
    inputs.push(`-i "${bgmPath}"`);
    filters.push(`[${n}:a]volume=0.35,afade=t=in:st=0:d=3,afade=t=out:st=${(totalDuration - 4).toFixed(1)}:d=4[afinal]`);
  }

  const maps = ['-map "[vfinal]"'];
  if (hasAudio) maps.push('-map "[afinal]"');

  const outputPath = path.join(tmpDir, 'output.mp4');
  const cmd = [
    'ffmpeg -y',
    ...inputs,
    `-filter_complex "${filters.join(';')}"`,
    ...maps,
    '-c:v libx264 -pix_fmt yuv420p -preset fast -crf 21',
    hasAudio ? '-c:a aac -b:a 192k' : '-an',
    '-movflags +faststart',
    `-t ${totalDuration.toFixed(1)}`,
    `"${outputPath}"`,
  ].join(' ');

  try {
    execSync(cmd, { timeout: 300000 });
  } catch (e: any) {
    await prisma.preweddingVideo.update({
      where: { id: videoId },
      data: { status: 'FAILED', errorMsg: 'FFmpeg assembly failed: ' + e.message?.slice(0, 200) },
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

  let outputUrl = '';
  try {
    const cloudinary = (await import('cloudinary')).v2;
    const result = await cloudinary.uploader.upload(outputPath, {
      resource_type: 'video',
      folder: 'prewedding-video',
      public_id: `pv-${videoId}`,
    });
    outputUrl = result.secure_url || '';
  } catch (uploadErr: any) {
    console.error('Cloudinary upload error:', uploadErr.message);
    outputUrl = '';
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });

  await prisma.preweddingVideo.update({
    where: { id: videoId },
    data: {
      status: outputUrl ? 'DONE' : 'FAILED',
      outputUrl: outputUrl || null,
      totalDuration,
      errorMsg: outputUrl ? null : 'Upload failed',
    },
  });
}

export default router;
