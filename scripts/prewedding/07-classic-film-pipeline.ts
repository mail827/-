#!/usr/bin/env node

const { fal } = require("@fal-ai/client");
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const TMP = '/tmp/prewedding-classic';

interface Scene {
  index: number;
  photoUrl: string;
  prompt: string;
  camera: string;
  transition: string;
  transitionDuration: number;
  duration: number;
  subtitle: string;
  colorHint: string;
  phase: string;
}

interface CoupleInfo {
  groomName: string;
  brideName: string;
  weddingDate: string;
  metDate?: string;
}

const CLASSIC_FILM_SCENES: Omit<Scene, 'photoUrl' | 'subtitle'>[] = [
  {
    index: 0,
    phase: 'intro',
    prompt: 'Very slow gentle zoom out. Cool blue-grey morning light. Soft mist. Cinematic 35mm anamorphic lens. Shallow depth of field. The subject stays perfectly still with only subtle breathing movement.',
    camera: 'zoom_out',
    transition: 'fadeblack',
    transitionDuration: 0,
    duration: 5,
    colorHint: 'cool morning',
  },
  {
    index: 1,
    phase: 'rising',
    prompt: 'Smooth slow horizontal pan from left to right. Warm natural daylight gradually increases. The couple appears relaxed and natural. Gentle wind moves hair. Cinematic film look with soft contrast.',
    camera: 'pan_right',
    transition: 'dissolve',
    transitionDuration: 1.5,
    duration: 5,
    colorHint: 'warming',
  },
  {
    index: 2,
    phase: 'rising',
    prompt: 'Gentle slow zoom in. Natural warm afternoon light. Soft golden tones begin to emerge. The subjects look at each other naturally. Cinematic shallow depth of field. 35mm film texture.',
    camera: 'zoom_in',
    transition: 'dissolve',
    transitionDuration: 1.5,
    duration: 5,
    colorHint: 'warm afternoon',
  },
  {
    index: 3,
    phase: 'building',
    prompt: 'Slow pan left revealing the scene. Golden hour warm light. Rich amber tones. The couple shares a genuine moment. Background beautifully blurred. Cinematic color grading.',
    camera: 'pan_left',
    transition: 'fade',
    transitionDuration: 0.3,
    duration: 4,
    colorHint: 'golden',
  },
  {
    index: 4,
    phase: 'building',
    prompt: 'Slow intimate zoom in toward faces. Warm golden light wraps around. Eye contact between couple. Soft wind in hair. Deep bokeh. Film grain texture. Emotional, tender.',
    camera: 'zoom_in',
    transition: 'fade',
    transitionDuration: 0.2,
    duration: 4,
    colorHint: 'golden intimate',
  },
  {
    index: 5,
    phase: 'climax',
    prompt: 'Camera completely still. Full frame portrait. The warmest golden light. Time seems to stop. Absolutely minimal movement - only natural breathing. Deep emotional stillness. 35mm film grain.',
    camera: 'static',
    transition: 'dissolve',
    transitionDuration: 2.0,
    duration: 6,
    colorHint: 'peak warm',
  },
  {
    index: 6,
    phase: 'ending',
    prompt: 'Camera still. Soft warm light slowly wrapping. Everything feels peaceful and complete. Gentle natural movement only. The image slowly brightens toward white. Timeless feeling.',
    camera: 'static',
    transition: 'fadewhite',
    transitionDuration: 3.0,
    duration: 5,
    colorHint: 'warm fade',
  },
];

const SUBTITLE_TEMPLATES = {
  intro: [
    '{year}년, 우연히 시작된 이야기',
    '처음 만난 그 날부터',
    '{metDate}, 운명처럼 만나다',
  ],
  rising: [
    '함께한 시간이 쌓여갈수록',
    '서로의 온도를 알아갈 때',
    '당신이 있어 매일이 새로웠습니다',
  ],
  building: [
    '웃음이 닿는 곳마다',
    '그래서, 당신과',
  ],
  climax: [],
  ending: ['{groomName} & {brideName}'],
};

function pickSubtitle(phase: string, info: CoupleInfo, usedSet: Set<string>): string {
  const pool = SUBTITLE_TEMPLATES[phase as keyof typeof SUBTITLE_TEMPLATES] || [];
  if (pool.length === 0) return '';

  for (const tpl of pool) {
    if (!usedSet.has(tpl)) {
      usedSet.add(tpl);
      let text = tpl;
      text = text.replace('{groomName}', info.groomName);
      text = text.replace('{brideName}', info.brideName);
      text = text.replace('{year}', info.metDate ? info.metDate.split('-')[0] : new Date().getFullYear().toString());
      text = text.replace('{metDate}', info.metDate || '');
      return text;
    }
  }

  let text = pool[0];
  text = text.replace('{groomName}', info.groomName);
  text = text.replace('{brideName}', info.brideName);
  text = text.replace('{year}', info.metDate ? info.metDate.split('-')[0] : new Date().getFullYear().toString());
  return text;
}

function assignPhotosToScenes(photoUrls: string[], sceneCount: number): string[] {
  const assigned: string[] = [];

  if (photoUrls.length >= sceneCount) {
    return photoUrls.slice(0, sceneCount);
  }

  for (let i = 0; i < sceneCount; i++) {
    assigned.push(photoUrls[i % photoUrls.length]);
  }

  const bestIdx = 0;
  const climaxScene = sceneCount - 2;
  if (climaxScene > 0 && climaxScene < assigned.length) {
    [assigned[bestIdx], assigned[climaxScene]] = [assigned[climaxScene], assigned[bestIdx]];
  }

  return assigned;
}

async function generateClip(scene: Scene): Promise<string | null> {
  console.log(`  [Scene ${scene.index + 1}] ${scene.phase} — ${scene.camera}`);
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
        negative_prompt: "blur, distort, low quality, unnatural movement, morphing face, chinese architecture",
      },
      logs: false,
      onQueueUpdate: (update: any) => {
        if (update.status === "IN_PROGRESS") {
          const elapsed = Math.round((Date.now() - start) / 1000);
          process.stdout.write(`\r    [${elapsed}s] generating...`);
        }
      },
    });

    const elapsed = Math.round((Date.now() - start) / 1000);
    const url = (result as any).data?.video?.url;
    console.log(`\r    Done in ${elapsed}s`);
    return url || null;
  } catch (e: any) {
    console.log(`\r    FAILED: ${e.message}`);
    return null;
  }
}

function downloadSync(url: string, dest: string) {
  execSync(`curl -sL -o "${dest}" "${url}"`, { timeout: 60000 });
}

function assembleWithFFmpeg(
  clipPaths: string[],
  scenes: Scene[],
  outputPath: string,
  bgmPath?: string,
) {
  const filters: string[] = [];
  const n = clipPaths.length;

  for (let i = 0; i < n; i++) {
    filters.push(`[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24[v${i}]`);
  }

  let currentStream = '[v0]';
  let runningOffset = scenes[0].duration;

  for (let i = 1; i < n; i++) {
    const s = scenes[i];
    const offset = Math.max(0, runningOffset - s.transitionDuration);
    const outLabel = `[xf${i}]`;
    filters.push(`${currentStream}[v${i}]xfade=transition=${s.transition}:duration=${s.transitionDuration}:offset=${offset}${outLabel}`);
    currentStream = outLabel;
    runningOffset = offset + s.duration;
  }

  filters.push(`${currentStream}noise=c0s=2:c0f=t+u[grain]`);
  filters.push(`[grain]vignette=PI/4[vig]`);

  const totalDuration = runningOffset;
  filters.push(`[vig]fade=t=out:st=${totalDuration - 2}:d=2[vfinal]`);

  if (bgmPath && fs.existsSync(bgmPath)) {
    filters.push(`[${n}:a]volume=0.25,afade=t=in:st=0:d=2,afade=t=out:st=${totalDuration - 3}:d=3[afinal]`);
  }

  const inputs = clipPaths.map(p => `-i "${p}"`);
  if (bgmPath && fs.existsSync(bgmPath)) inputs.push(`-i "${bgmPath}"`);

  const hasAudio = bgmPath && fs.existsSync(bgmPath);
  const maps = ['-map "[vfinal]"'];
  if (hasAudio) maps.push('-map "[afinal]"');

  const cmd = [
    'ffmpeg -y',
    ...inputs,
    `-filter_complex "${filters.join(';')}"`,
    ...maps,
    '-c:v libx264 -pix_fmt yuv420p -preset fast -crf 22',
    hasAudio ? '-c:a aac -b:a 192k' : '-an',
    '-movflags +faststart',
    `-t ${totalDuration}`,
    `"${outputPath}"`,
  ].join(' ');

  console.log('\n--- FFmpeg ---');
  execSync(cmd, { stdio: 'inherit', timeout: 180000 });
}

async function main() {
  console.log('============================================');
  console.log(' Classic Film — Auto Pipeline MVP');
  console.log(' Photos → Kling I2V → FFmpeg → Final MP4');
  console.log('============================================\n');

  const photoUrls = process.argv.slice(2).filter(a => a.startsWith('http'));

  if (photoUrls.length < 3) {
    console.log('Usage:');
    console.log('  npx tsx 07-classic-film-pipeline.ts <photo1> <photo2> <photo3> ... [photo8]');
    console.log('');
    console.log('Example:');
    console.log('  npx tsx 07-classic-film-pipeline.ts \\');
    console.log('    "https://res.cloudinary.com/.../photo1.jpg" \\');
    console.log('    "https://res.cloudinary.com/.../photo2.jpg" \\');
    console.log('    "https://res.cloudinary.com/.../photo3.jpg"');
    console.log('');
    console.log('Minimum 3 photos, maximum 7 (one per scene).');
    console.log('Best photo should be first — it goes to the climax scene.');
    return;
  }

  const info: CoupleInfo = {
    groomName: process.env.GROOM_NAME || '신랑',
    brideName: process.env.BRIDE_NAME || '신부',
    weddingDate: process.env.WEDDING_DATE || '2026.06.20',
    metDate: process.env.MET_DATE || '',
  };

  console.log(`Groom: ${info.groomName}`);
  console.log(`Bride: ${info.brideName}`);
  console.log(`Photos: ${photoUrls.length}`);
  console.log(`Scenes: ${CLASSIC_FILM_SCENES.length}`);
  console.log('');

  const assignedPhotos = assignPhotosToScenes(photoUrls, CLASSIC_FILM_SCENES.length);
  const usedSubtitles = new Set<string>();

  const scenes: Scene[] = CLASSIC_FILM_SCENES.map((template, i) => ({
    ...template,
    photoUrl: assignedPhotos[i],
    subtitle: pickSubtitle(template.phase, info, usedSubtitles),
  }));

  console.log('=== Scene Plan ===');
  scenes.forEach(s => {
    console.log(`  [${s.index + 1}] ${s.phase.padEnd(10)} ${s.camera.padEnd(10)} ${s.duration}s  "${s.subtitle || '(no subtitle)'}"`);
  });
  console.log('');

  console.log('=== Step 1: Generate Clips via Kling 3.0 ===');
  const clipUrls: (string | null)[] = [];

  for (const scene of scenes) {
    const url = await generateClip(scene);
    clipUrls.push(url);
    await new Promise(r => setTimeout(r, 1000));
  }

  const successCount = clipUrls.filter(Boolean).length;
  console.log(`\n${successCount}/${scenes.length} clips generated successfully`);

  if (successCount < 3) {
    console.log('Too few clips succeeded. Aborting assembly.');
    return;
  }

  const validScenes = scenes.filter((_, i) => clipUrls[i]);
  const validUrls = clipUrls.filter(Boolean) as string[];

  console.log('\n=== Step 2: Download Clips ===');
  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });

  const clipPaths: string[] = [];
  for (let i = 0; i < validUrls.length; i++) {
    const clipPath = path.join(TMP, `clip_${i}.mp4`);
    console.log(`  Downloading clip ${i + 1}/${validUrls.length}...`);
    downloadSync(validUrls[i], clipPath);
    clipPaths.push(clipPath);
  }

  console.log('\n=== Step 3: FFmpeg Assembly ===');
  const outputPath = path.join(TMP, 'classic_film_output.mp4');

  try {
    assembleWithFFmpeg(clipPaths, validScenes, outputPath);
    console.log(`\n=============================`);
    console.log(` OUTPUT: ${outputPath}`);
    const stat = fs.statSync(outputPath);
    console.log(` Size: ${(stat.size / 1024 / 1024).toFixed(1)}MB`);
    console.log(`=============================`);
    console.log(`\nOpen with:`);
    console.log(`  open "${outputPath}"`);
  } catch (e: any) {
    console.error('\nFFmpeg assembly failed:', e.message);
    console.log('\nClip URLs (use manually):');
    validUrls.forEach((url, i) => console.log(`  [${i + 1}] ${url}`));
  }
}

main().catch(console.error);
