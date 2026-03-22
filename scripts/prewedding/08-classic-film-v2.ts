const { fal } = require("@fal-ai/client");
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TMP = '/tmp/prewedding-v2';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const BGM_URL = process.env.BGM_URL || 'https://res.cloudinary.com/duzlquvxj/video/upload/v1774192227/Morning_light_through_the_curtain_folds_ncpskg.mp3';

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
  transition: string;
  transitionDuration: number;
  duration: number;
  subtitle: string;
  phase: string;
}

interface CoupleInfo {
  groomName: string;
  brideName: string;
  weddingDate: string;
}

async function analyzePhotos(photoUrls: string[]): Promise<PhotoAnalysis[]> {
  console.log('\n[GPT Vision] Analyzing photos...');

  const content: any[] = [
    {
      type: 'text',
      text: `You are analyzing wedding photos. For each photo, determine:
- type: "solo_male" (one man), "solo_female" (one woman), "couple" (two people together), "landscape" (scenery/no people), "detail" (rings/flowers/details)
- emotion: "warm" | "calm" | "energetic" | "intimate" | "joyful"
- quality: 1-10 (composition, lighting, focus)
- setting: "indoor" | "outdoor" | "studio" | "nature" | "urban"

Return ONLY a JSON array like:
[{"type":"couple","emotion":"warm","quality":9,"setting":"outdoor"}, ...]

${photoUrls.length} photos to analyze.`
    },
    ...photoUrls.map(url => ({
      type: 'image_url' as const,
      image_url: { url, detail: 'low' as const }
    }))
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content }],
      max_tokens: 1000,
    }),
  });

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '[]';
  const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

  try {
    const analyses = JSON.parse(cleaned);
    return photoUrls.map((url, i) => ({
      url,
      type: analyses[i]?.type || 'couple',
      emotion: analyses[i]?.emotion || 'warm',
      quality: analyses[i]?.quality || 5,
      setting: analyses[i]?.setting || 'outdoor',
    }));
  } catch {
    console.log('  GPT parse failed, using defaults');
    return photoUrls.map(url => ({
      url, type: 'couple' as const, emotion: 'warm', quality: 5, setting: 'outdoor'
    }));
  }
}

function buildPromptForPhoto(analysis: PhotoAnalysis, camera: string, phase: string): string {
  const cameraPrompts: Record<string, string> = {
    zoom_out: 'Very slow gentle zoom out. Establishing shot.',
    pan_right: 'Smooth slow horizontal pan from left to right. Cinematic reveal.',
    zoom_in: 'Slow intimate zoom in. Shallow depth of field deepens.',
    pan_left: 'Smooth slow pan from right to left. Subject centered.',
    static: 'Camera completely still. Only natural subtle breathing movement.',
  };

  const phasePrompts: Record<string, string> = {
    intro: 'Cool morning light. Soft mist atmosphere. Distant, contemplative mood.',
    rising: 'Natural warm daylight. Gentle warmth building. Relaxed authentic moment.',
    building: 'Golden hour warm light. Rich amber tones. Emotional connection.',
    climax: 'The warmest golden light. Time stops. Deep emotional stillness.',
    ending: 'Soft warm light slowly brightening. Peaceful. Complete.',
  };

  const typePrompts: Record<string, string> = {
    solo_male: 'Portrait of one man. Solo shot. Do NOT add any other person. Single subject only. No extra figures.',
    solo_female: 'Portrait of one woman. Solo shot. Do NOT add any other person. Single subject only. No extra figures.',
    couple: 'The couple together. Natural intimate interaction between two people.',
    landscape: 'Beautiful scenic environment. No people needed. Atmospheric.',
    detail: 'Close-up detail shot. Macro feel. Soft focus background.',
  };

  return [
    cameraPrompts[camera] || cameraPrompts.static,
    typePrompts[analysis.type] || typePrompts.couple,
    phasePrompts[phase] || '',
    'Cinematic 35mm anamorphic lens. Shallow depth of field. Film texture.',
    'Natural movement only. No morphing. No face distortion. Preserve original appearance exactly.',
  ].join(' ');
}

function buildScenePlan(analyses: PhotoAnalysis[], info: CoupleInfo): Scene[] {
  const phases =      ['intro',     'rising',    'rising',    'building',  'building',  'climax',  'ending'];
  const cameras =     ['zoom_out',  'pan_right', 'zoom_in',  'pan_left',  'zoom_in',   'static',  'static'];
  const transitions = ['fadeblack', 'dissolve',  'dissolve',  'fade',      'fade',      'dissolve','fadewhite'];
  const transDurs =   [0,           1.5,         1.5,         0.3,         0.2,         2.0,       3.0];
  const durations =   [5,           5,           5,           4,           4,           6,         5];

  const subtitlePool: Record<string, string[]> = {
    intro: ['처음 만난 그 날부터'],
    rising: ['함께한 시간이 쌓여갈수록', '서로의 온도를 알아갈 때'],
    building: ['웃음이 닿는 곳마다', '그래서, 당신과'],
    climax: [],
    ending: [`${info.groomName} & ${info.brideName}`],
  };

  const sceneCount = Math.min(7, Math.max(5, analyses.length + 2));
  const usedSubs = new Set<string>();

  const bestIdx = analyses.reduce((best, a, i) => a.quality > analyses[best].quality ? i : best, 0);
  const sorted = [...analyses];
  const bestPhoto = sorted.splice(bestIdx, 1)[0];

  const assigned: PhotoAnalysis[] = [];
  for (let i = 0; i < sceneCount; i++) {
    if (phases[i] === 'climax') {
      assigned.push(bestPhoto);
    } else {
      assigned.push(sorted[i % sorted.length] || bestPhoto);
    }
  }

  return Array.from({ length: sceneCount }, (_, i) => {
    const phase = phases[i] || 'rising';
    const pool = subtitlePool[phase] || [];
    let subtitle = '';
    for (const s of pool) {
      if (!usedSubs.has(s)) { subtitle = s; usedSubs.add(s); break; }
    }

    return {
      index: i,
      photoUrl: assigned[i].url,
      photoType: assigned[i].type,
      prompt: buildPromptForPhoto(assigned[i], cameras[i] || 'static', phase),
      camera: cameras[i] || 'static',
      transition: transitions[i] || 'dissolve',
      transitionDuration: transDurs[i] || 1.0,
      duration: durations[i] || 5,
      subtitle,
      phase,
    };
  });
}

async function generateClip(scene: Scene): Promise<string | null> {
  const label = `Scene ${scene.index + 1} (${scene.phase}/${scene.photoType})`;
  process.stdout.write(`  [${label}] `);
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
        negative_prompt: "blur, distort, low quality, morphing, face change, extra person, duplicate person, chinese style, asian temple",
      },
      logs: false,
      onQueueUpdate: (update: any) => {
        if (update.status === "IN_PROGRESS") {
          process.stdout.write(`\r  [${label}] ${Math.round((Date.now() - start) / 1000)}s...`);
        }
      },
    });

    const url = (result as any).data?.video?.url;
    console.log(`\r  [${label}] Done ${Math.round((Date.now() - start) / 1000)}s`);
    return url || null;
  } catch (e: any) {
    console.log(`\r  [${label}] FAILED: ${e.message}`);
    return null;
  }
}

function downloadSync(url: string, dest: string) {
  execSync(`curl -sL -o "${dest}" "${url}"`, { timeout: 120000 });
}

function assembleFFmpeg(clipPaths: string[], scenes: Scene[], outputPath: string, bgmPath?: string) {
  const filters: string[] = [];
  const n = clipPaths.length;

  for (let i = 0; i < n; i++) {
    filters.push(`[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24[scaled${i}]`);
    filters.push(`[scaled${i}]crop=1080:1728:0:96[v${i}]`);
  }

  let currentStream = '[v0]';
  let runningOffset = scenes[0].duration;

  for (let i = 1; i < n; i++) {
    const s = scenes[i];
    const offset = Math.max(0, runningOffset - s.transitionDuration);
    const out = `[xf${i}]`;
    filters.push(`${currentStream}[v${i}]xfade=transition=${s.transition}:duration=${s.transitionDuration}:offset=${offset}${out}`);
    currentStream = out;
    runningOffset = offset + s.duration;
  }

  filters.push(`${currentStream}copy[grain]`);

  const totalDuration = runningOffset;
  filters.push(`[grain]pad=1080:1920:0:96:black[letterbox]`);
  filters.push(`[letterbox]fade=t=in:st=0:d=2,fade=t=out:st=${totalDuration - 2}:d=2[vfinal]`);

  const inputs = clipPaths.map(p => `-i "${p}"`);
  const hasAudio = bgmPath && fs.existsSync(bgmPath);

  if (hasAudio) {
    inputs.push(`-i "${bgmPath}"`);
    filters.push(`[${n}:a]volume=0.35,afade=t=in:st=0:d=3,afade=t=out:st=${totalDuration - 4}:d=4[afinal]`);
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
    `-t ${totalDuration}`,
    `"${outputPath}"`,
  ].join(' ');

  execSync(cmd, { stdio: 'inherit', timeout: 180000 });
}

async function main() {
  console.log('============================================');
  console.log(' Classic Film V2 — Full Pipeline');
  console.log(' GPT Vision + Kling I2V + BGM + Letterbox');
  console.log('============================================\n');

  const photoUrls = process.argv.slice(2).filter(a => a.startsWith('http'));

  if (photoUrls.length < 3) {
    console.log('Usage:');
    console.log('  npx tsx 08-classic-film-v2.ts <photo1> <photo2> ... <photo8>');
    console.log('');
    console.log('Env vars:');
    console.log('  GROOM_NAME, BRIDE_NAME, WEDDING_DATE');
    console.log('  BGM_URL (optional)');
    console.log('  OPENAI_API_KEY (for GPT Vision)');
    return;
  }

  const info: CoupleInfo = {
    groomName: process.env.GROOM_NAME || '신랑',
    brideName: process.env.BRIDE_NAME || '신부',
    weddingDate: process.env.WEDDING_DATE || '2026.06.20',
  };

  console.log(`Groom: ${info.groomName}`);
  console.log(`Bride: ${info.brideName}`);
  console.log(`Photos: ${photoUrls.length}`);
  console.log(`BGM: ${BGM_URL.split('/').pop()?.slice(0, 40)}`);

  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });

  console.log('\n=== Step 1: GPT Vision Photo Analysis ===');
  const analyses = await analyzePhotos(photoUrls);
  analyses.forEach((a, i) => {
    console.log(`  [${i + 1}] ${a.type.padEnd(12)} emotion:${a.emotion.padEnd(8)} quality:${a.quality} setting:${a.setting}`);
  });

  console.log('\n=== Step 2: Build Scene Plan ===');
  const scenes = buildScenePlan(analyses, info);
  scenes.forEach(s => {
    console.log(`  [${s.index + 1}] ${s.phase.padEnd(10)} ${s.photoType.padEnd(12)} ${s.camera.padEnd(10)} ${s.duration}s  "${s.subtitle || '-'}"`);
  });

  console.log('\n=== Step 3: Generate Clips (Kling 3.0) ===');
  const clipUrls: (string | null)[] = [];
  for (const scene of scenes) {
    const url = await generateClip(scene);
    clipUrls.push(url);
    await new Promise(r => setTimeout(r, 500));
  }

  const validIdx = clipUrls.map((u, i) => u ? i : -1).filter(i => i >= 0);
  console.log(`\n${validIdx.length}/${scenes.length} clips generated`);

  if (validIdx.length < 3) {
    console.log('Too few clips. Aborting.');
    return;
  }

  console.log('\n=== Step 4: Download Clips ===');
  const clipPaths: string[] = [];
  const validScenes: Scene[] = [];
  for (const i of validIdx) {
    const p = path.join(TMP, `clip_${i}.mp4`);
    console.log(`  Downloading scene ${i + 1}...`);
    downloadSync(clipUrls[i]!, p);
    clipPaths.push(p);
    validScenes.push(scenes[i]);
  }

  console.log('\n=== Step 5: Download BGM ===');
  const bgmPath = path.join(TMP, 'bgm.mp3');
  downloadSync(BGM_URL, bgmPath);
  console.log('  BGM ready');

  console.log('\n=== Step 6: FFmpeg Assembly ===');
  const outputPath = path.join(TMP, 'classic_film_v2.mp4');

  try {
    assembleFFmpeg(clipPaths, validScenes, outputPath, bgmPath);
    const stat = fs.statSync(outputPath);
    console.log('\n============================================');
    console.log(` OUTPUT: ${outputPath}`);
    console.log(` Size: ${(stat.size / 1024 / 1024).toFixed(1)}MB`);
    console.log('============================================');
    console.log(`\n  open "${outputPath}"`);
  } catch (e: any) {
    console.error('\nFFmpeg failed:', e.message);
    console.log('\nClip URLs:');
    validIdx.forEach(i => console.log(`  [${i + 1}] ${clipUrls[i]}`));
  }
}

main().catch(console.error);
