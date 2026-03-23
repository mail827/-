const { fal } = require("@fal-ai/client");
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TMP = '/tmp/prewedding-v3';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const BGM_PATH = process.env.BGM_PATH || '';

interface PhotoAnalysis {
  url: string;
  type: 'solo_male' | 'solo_female' | 'couple' | 'landscape' | 'detail';
  emotion: string;
  quality: number;
  setting: string;
}

interface Scene {
  index: number;
  photoUrl: string;
  photoType: string;
  prompt: string;
  camera: string;
  duration: number;
  subtitle: string;
  phase: string;
  tier: 'premium' | 'budget';
  clipPath?: string;
  score?: number;
}

interface CoupleInfo {
  groomName: string;
  brideName: string;
  weddingDate: string;
}

async function gptRequest(messages: any[], maxTokens: number = 1000): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: 'gpt-4o', messages, max_tokens: maxTokens }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function analyzePhotos(photoUrls: string[]): Promise<PhotoAnalysis[]> {
  console.log('\n[Step 1] GPT Vision — Photo Analysis');

  const content: any[] = [
    {
      type: 'text',
      text: `Analyze ${photoUrls.length} wedding photos. For each return:
- type: "solo_male" | "solo_female" | "couple" | "landscape" | "detail"
- emotion: "warm" | "calm" | "energetic" | "intimate" | "joyful"
- quality: 1-10
- setting: "indoor" | "outdoor" | "studio" | "nature" | "urban"
Return ONLY a JSON array.`
    },
    ...photoUrls.map(url => ({ type: 'image_url', image_url: { url, detail: 'low' as const } }))
  ];

  const text = await gptRequest([{ role: 'user', content }]);
  const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

  try {
    const arr = JSON.parse(cleaned);
    return photoUrls.map((url, i) => ({
      url,
      type: arr[i]?.type || 'couple',
      emotion: arr[i]?.emotion || 'warm',
      quality: arr[i]?.quality || 5,
      setting: arr[i]?.setting || 'outdoor',
    }));
  } catch {
    return photoUrls.map(url => ({ url, type: 'couple' as const, emotion: 'warm', quality: 5, setting: 'outdoor' }));
  }
}

function decideTier(phase: string, photoType: string): 'premium' | 'budget' {
  if (photoType === 'couple') return 'premium';
  if (phase === 'climax') return 'premium';
  if (phase === 'ending') return 'premium';
  return 'budget';
}

function buildKlingPrompt(photoType: string, camera: string, phase: string): string {
  const cameraPrompts: Record<string, string> = {
    zoom_out: 'Extremely subtle slow zoom out. Barely noticeable movement. Still and calm.',
    pan_right: 'Very subtle slow horizontal drift from left to right. Minimal movement.',
    zoom_in: 'Very gentle slow zoom in. Minimal movement. Calm and still.',
    pan_left: 'Very subtle slow drift from right to left. Minimal movement.',
    static: 'Camera completely still. Only the most subtle natural breathing. Almost a photograph.',
  };

  const typePrompts: Record<string, string> = {
    solo_male: 'Portrait of one man. Solo shot. Do NOT add any other person. Single subject only. No extra figures.',
    solo_female: 'Portrait of one woman. Solo shot. Do NOT add any other person. Single subject only. No extra figures.',
    couple: 'The couple together. Natural intimate moment.',
    landscape: 'Beautiful scenic environment. Atmospheric.',
    detail: 'Close-up detail shot. Soft focus background.',
  };

  const phasePrompts: Record<string, string> = {
    intro: 'Cool morning light. Contemplative mood.',
    rising: 'Natural warm daylight. Relaxed authentic moment.',
    building: 'Golden hour warm light. Emotional connection.',
    climax: 'Warmest golden light. Time stops. Deep emotional stillness.',
    ending: 'Soft warm light. Peaceful. Complete.',
  };

  return [
    cameraPrompts[camera] || cameraPrompts.static,
    typePrompts[photoType] || typePrompts.couple,
    phasePrompts[phase] || '',
    'Cinematic. Clean sharp image. Shallow depth of field. No grain. No noise.',
    'Natural movement only. No morphing. No face distortion. Preserve original appearance exactly.',
  ].join(' ');
}

function buildScenePlan(analyses: PhotoAnalysis[], info: CoupleInfo): Scene[] {
  const template = [
    { phase: 'intro',    camera: 'zoom_out',  duration: 5 },
    { phase: 'rising',   camera: 'pan_right',  duration: 5 },
    { phase: 'rising',   camera: 'zoom_in',   duration: 5 },
    { phase: 'building', camera: 'pan_left',  duration: 4 },
    { phase: 'building', camera: 'zoom_in',   duration: 4 },
    { phase: 'climax',   camera: 'static',    duration: 6 },
    { phase: 'ending',   camera: 'static',    duration: 5 },
  ];

  const subtitles: Record<string, string[]> = {
    intro: ['처음 만난 그 날부터'],
    rising: ['함께한 시간이 쌓여갈수록', '서로의 온도를 알아갈 때'],
    building: ['웃음이 닿는 곳마다', '그래서, 당신과'],
    climax: [],
    ending: [`${info.groomName} & ${info.brideName}`],
  };

  const bestIdx = analyses.reduce((b, a, i) => a.quality > analyses[b].quality ? i : b, 0);
  const sorted = [...analyses];
  const best = sorted.splice(bestIdx, 1)[0];

  const assigned: PhotoAnalysis[] = [];
  const sceneCount = template.length;
  for (let i = 0; i < sceneCount; i++) {
    if (template[i].phase === 'climax') assigned.push(best);
    else if (template[i].phase === 'ending') {
      const couplePhoto = sorted.find(a => a.type === 'couple') || best;
      assigned.push(couplePhoto);
    }
    else assigned.push(sorted[i % sorted.length] || best);
  }

  const usedSubs = new Set<string>();
  return template.map((t, i) => {
    const pool = subtitles[t.phase] || [];
    let subtitle = '';
    for (const s of pool) { if (!usedSubs.has(s)) { subtitle = s; usedSubs.add(s); break; } }
    const tier = decideTier(t.phase, assigned[i].type);

    return {
      index: i,
      photoUrl: assigned[i].url,
      photoType: assigned[i].type,
      prompt: buildKlingPrompt(assigned[i].type, t.camera, t.phase),
      camera: t.camera,
      duration: t.duration,
      subtitle,
      phase: t.phase,
      tier,
    };
  });
}

const ARK_API_KEY = process.env.ARK_API_KEY || '';
const ARK_BASE = 'https://ark.ap-southeast.bytepluses.com/api/v3';

async function generateSeedanceClip(photoUrl: string, camera: string, duration: number, photoType: string): Promise<string | null> {
  const cameraPrompts: Record<string, string> = {
    zoom_out: 'Very subtle slow zoom out. Calm establishing shot.',
    pan_right: 'Gentle slow horizontal drift right. Minimal movement.',
    zoom_in: 'Very gentle slow zoom in. Calm and still.',
    pan_left: 'Gentle slow horizontal drift left. Minimal movement.',
    static: 'Camera still. Only subtle natural breathing.',
  };

  const typePrompts: Record<string, string> = {
    solo_male: 'Portrait of one man. Solo. Do NOT add any other person.',
    solo_female: 'Portrait of one woman. Solo. Do NOT add any other person.',
    couple: 'The couple together naturally.',
    landscape: 'Scenic environment. Atmospheric.',
    detail: 'Close-up detail. Soft background.',
  };

  const prompt = [
    cameraPrompts[camera] || cameraPrompts.static,
    typePrompts[photoType] || typePrompts.couple,
    'Cinematic. Clean sharp. No grain. No noise. Preserve original appearance.',
    `--resolution 720p --ratio 9:16 --dur ${duration} --seed -1`,
  ].join(' ');

  const body = {
    model: 'seedance-1-5-pro-251215',
    content: [
      { type: 'image_url', image_url: { url: photoUrl } },
      { type: 'text', text: prompt },
    ],
  };

  const res = await fetch(`${ARK_BASE}/contents/generations/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ARK_API_KEY}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  const task = await res.json();
  const taskId = task.id;

  const start = Date.now();
  while (Date.now() - start < 300000) {
    const poll = await fetch(`${ARK_BASE}/contents/generations/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${ARK_API_KEY}` },
    });
    const data = await poll.json();
    if (data.status === 'succeeded') return data.content?.video_url || null;
    if (data.status === 'failed') return null;
    await new Promise(r => setTimeout(r, 5000));
  }
  return null;
}

async function generateKlingClip(scene: Scene): Promise<string | null> {
  const start = Date.now();
  try {
    const result = await fal.subscribe("fal-ai/kling-video/v3/standard/image-to-video", {
      input: {
        prompt: scene.prompt,
        image_url: scene.photoUrl,
        duration: String(scene.duration),
        aspect_ratio: "9:16",
        cfg_scale: 0.5,
        generate_audio: false,
        negative_prompt: "blur, distort, low quality, morphing, face change, extra person, duplicate person, grain, noise, film grain",
      },
      logs: false,
      onQueueUpdate: (update: any) => {
        if (update.status === "IN_PROGRESS") {
          process.stdout.write(`\r    ${Math.round((Date.now() - start) / 1000)}s...`);
        }
      },
    });
    const elapsed = Math.round((Date.now() - start) / 1000);
    process.stdout.write(`\r    Done ${elapsed}s\n`);
    return (result as any).data?.video?.url || null;
  } catch (e: any) {
    console.log(`\r    FAILED: ${e.message}`);
    return null;
  }
}

async function scoreClip(clipUrl: string, scene: Scene): Promise<number> {
  const text = await gptRequest([{
    role: 'user',
    content: [
      { type: 'text', text: `Score this AI-generated wedding video thumbnail 1-10 on: emotion, face quality, motion naturalness, composition. Scene context: ${scene.phase} phase, ${scene.photoType} photo. Return ONLY a JSON: {"score": N, "reason": "..."}` },
      { type: 'image_url', image_url: { url: scene.photoUrl, detail: 'low' } },
    ]
  }], 200);

  try {
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned).score || 5;
  } catch {
    return 5;
  }
}

function downloadSync(url: string, dest: string) {
  execSync(`curl -sL -o "${dest}" "${url}"`, { timeout: 120000 });
}

function assembleFFmpeg(scenes: Scene[], outputPath: string, bgmPath?: string) {
  const filters: string[] = [];
  const n = scenes.length;

  for (let i = 0; i < n; i++) {
    filters.push(`[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24[scaled${i}]`);
    filters.push(`[scaled${i}]crop=1080:1728:0:96[v${i}]`);
  }

  let currentStream = '[v0]';
  let runningOffset = scenes[0].duration;

  for (let i = 1; i < n; i++) {
    const offset = runningOffset - 0.1;
    const out = `[xf${i}]`;
    filters.push(`${currentStream}[v${i}]xfade=transition=fade:duration=0.1:offset=${offset.toFixed(1)}${out}`);
    currentStream = out;
    runningOffset = offset + scenes[i].duration;
  }

  const totalDuration = runningOffset;
  filters.push(`${currentStream}pad=1080:1920:0:96:black[letterbox]`);
  filters.push(`[letterbox]fade=t=in:st=0:d=2,fade=t=out:st=${(totalDuration - 2).toFixed(1)}:d=2[vfinal]`);

  const inputs = scenes.map(s => `-i "${s.clipPath}"`);
  const hasAudio = bgmPath && fs.existsSync(bgmPath);

  if (hasAudio) {
    inputs.push(`-i "${bgmPath}"`);
    filters.push(`[${n}:a]volume=0.35,afade=t=in:st=0:d=3,afade=t=out:st=${(totalDuration - 4).toFixed(1)}:d=4[afinal]`);
  }

  const maps = ['-map "[vfinal]"'];
  if (hasAudio) maps.push('-map "[afinal]"');

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

  execSync(cmd, { stdio: 'inherit', timeout: 180000 });
}

async function main() {
  console.log('============================================');
  console.log(' V3 Hybrid Engine');
  console.log(' Kling (premium) + Seedance (budget)');
  console.log(' Shot Scoring + Best-of-2');
  console.log('============================================\n');

  const photoUrls = process.argv.slice(2).filter(a => a.startsWith('http'));
  if (photoUrls.length < 3) {
    console.log('Usage: npx tsx 09-hybrid-v3.ts <photo1> <photo2> ... <photo8>');
    console.log('Env: GROOM_NAME, BRIDE_NAME, BGM_PATH, OPENAI_API_KEY, FAL_KEY');
    return;
  }

  const info: CoupleInfo = {
    groomName: process.env.GROOM_NAME || '신랑',
    brideName: process.env.BRIDE_NAME || '신부',
    weddingDate: process.env.WEDDING_DATE || '2026.06.20',
  };

  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });

  const analyses = await analyzePhotos(photoUrls);
  analyses.forEach((a, i) => {
    console.log(`  [${i + 1}] ${a.type.padEnd(12)} quality:${a.quality} emotion:${a.emotion}`);
  });

  console.log('\n[Step 2] Scene Plan + Tier Assignment');
  const scenes = buildScenePlan(analyses, info);

  const premiumCount = scenes.filter(s => s.tier === 'premium').length;
  const budgetCount = scenes.filter(s => s.tier === 'budget').length;
  console.log(`  Premium (Kling): ${premiumCount} scenes`);
  console.log(`  Budget (Seedance): ${budgetCount} scenes`);
  console.log('');
  scenes.forEach(s => {
    const tierIcon = s.tier === 'premium' ? '$$' : '--';
    console.log(`  [${s.index + 1}] ${tierIcon} ${s.phase.padEnd(10)} ${s.photoType.padEnd(12)} ${s.camera.padEnd(10)} ${s.duration}s  "${s.subtitle || '-'}"`);
  });

  console.log('\n[Step 3] Generate Budget Clips (Seedance 1.5 — $0.001/sec)');
  for (const scene of scenes.filter(s => s.tier === 'budget')) {
    const clipPath = path.join(TMP, `clip_${scene.index}.mp4`);
    console.log(`  [Scene ${scene.index + 1}] ${scene.phase}/${scene.photoType} Seedance...`);
    const start = Date.now();
    const url = await generateSeedanceClip(scene.photoUrl, scene.camera, scene.duration, scene.photoType);
    const elapsed = Math.round((Date.now() - start) / 1000);
    if (url) {
      downloadSync(url, clipPath);
      scene.clipPath = clipPath;
      console.log(`    Done ${elapsed}s`);
    } else {
      console.log(`    FAILED — falling back to static frame`);
      const imgPath = clipPath.replace('.mp4', '.jpg');
      execSync(`curl -sL -o "${imgPath}" "${scene.photoUrl}"`, { timeout: 30000 });
      execSync(`ffmpeg -y -loop 1 -i "${imgPath}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -t ${scene.duration} -c:v libx264 -pix_fmt yuv420p -preset fast -crf 21 "${clipPath}"`, { stdio: 'pipe', timeout: 30000 });
      scene.clipPath = clipPath;
    }
  }

  console.log('\n[Step 4] Generate Premium Clips (Kling — Best-of-2)');
  for (const scene of scenes.filter(s => s.tier === 'premium')) {
    console.log(`  [Scene ${scene.index + 1}] ${scene.phase} / ${scene.photoType}`);

    const candidates: { url: string; score: number }[] = [];

    for (let attempt = 0; attempt < 1; attempt++) {
      console.log(`    Attempt ${attempt + 1}/1:`);
      const url = await generateKlingClip(scene);
      if (url) {
        const score = await scoreClip(url, scene);
        console.log(`    Score: ${score}/10`);
        candidates.push({ url, score });
      }
      if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
    }

    if (candidates.length === 0) {
      console.log(`    Both failed! Falling back to Seedance`);
      const clipPath = path.join(TMP, `clip_${scene.index}.mp4`);
      const fallbackUrl = await generateSeedanceClip(scene.photoUrl, scene.camera, scene.duration, scene.photoType);
      if (fallbackUrl) { downloadSync(fallbackUrl, clipPath); }
      else { execSync(`curl -sL -o "${clipPath.replace('.mp4','.jpg')}" "${scene.photoUrl}"`); execSync(`ffmpeg -y -loop 1 -i "${clipPath.replace('.mp4','.jpg')}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -t ${scene.duration} -c:v libx264 -pix_fmt yuv420p -crf 21 "${clipPath}"`, { stdio: 'pipe' }); }
      scene.clipPath = clipPath;
      scene.score = 3;
      continue;
    }

    const best = candidates.sort((a, b) => b.score - a.score)[0];
    console.log(`    Winner: score ${best.score}/10`);
    const clipPath = path.join(TMP, `clip_${scene.index}.mp4`);
    downloadSync(best.url, clipPath);
    scene.clipPath = clipPath;
    scene.score = best.score;
  }

  const validScenes = scenes.filter(s => s.clipPath);
  console.log(`\n[Step 5] Quality Gate — ${validScenes.length}/${scenes.length} scenes ready`);

  const lowScoreScenes = validScenes.filter(s => s.tier === 'premium' && (s.score || 0) < 4);
  if (lowScoreScenes.length > 0) {
    console.log(`  Dropping ${lowScoreScenes.length} low-score clips:`);
    lowScoreScenes.forEach(s => {
      console.log(`    Scene ${s.index + 1}: score ${s.score} — DROPPED`);
      s.clipPath = undefined;
    });
  }

  const finalScenes = scenes.filter(s => s.clipPath);
  console.log(`  Final: ${finalScenes.length} scenes`);

  console.log('\n[Step 6] FFmpeg Assembly');
  const bgmPath = BGM_PATH || '';
  const outputPath = path.join(TMP, 'hybrid_v3.mp4');

  try {
    assembleFFmpeg(finalScenes, outputPath, bgmPath);
    const stat = fs.statSync(outputPath);

    const klingCost = scenes.filter(s => s.tier === 'premium').length * 2 * 0.56;
    const seedanceCost = scenes.filter(s => s.tier === 'budget').length * 0.005;
    const totalCost = klingCost + seedanceCost;

    console.log('\n============================================');
    console.log(` OUTPUT: ${outputPath}`);
    console.log(` Size: ${(stat.size / 1024 / 1024).toFixed(1)}MB`);
    console.log(` Scenes: ${finalScenes.length} (${premiumCount} premium + ${budgetCount} budget)`);
    console.log(` Estimated cost: $${totalCost.toFixed(2)} (${Math.round(totalCost * 1400)}원)`);
    console.log('============================================');
    console.log(`\n  open "${outputPath}"`);
  } catch (e: any) {
    console.error('\nFFmpeg failed:', e.message);
  }
}

main().catch(console.error);
