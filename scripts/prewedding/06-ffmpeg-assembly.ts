#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const TMP = '/tmp/prewedding-assembly';

interface ClipInput {
  url: string;
  duration: number;
  transition: 'dissolve' | 'fadewhite' | 'fadeblack' | 'fade' | 'wipeleft';
  transitionDuration: number;
  subtitle?: string;
}

interface AssemblyConfig {
  clips: ClipInput[];
  bgmUrl?: string;
  bgmVolume: number;
  endingText: string;
  endingDuration: number;
  outputPath: string;
  filmGrain: boolean;
  vignette: boolean;
  subtitleFont: string;
  subtitleSize: number;
  subtitleColor: string;
}

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res: any) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (e: Error) => { fs.unlink(dest, () => {}); reject(e); });
  });
}

async function downloadClips(clips: ClipInput[]): Promise<string[]> {
  const paths: string[] = [];
  for (let i = 0; i < clips.length; i++) {
    const clipPath = path.join(TMP, `clip_${i}.mp4`);
    console.log(`  Downloading clip ${i + 1}/${clips.length}...`);
    await download(clips[i].url, clipPath);
    paths.push(clipPath);
  }
  return paths;
}

function buildFilterComplex(config: AssemblyConfig, clipPaths: string[]): string {
  const filters: string[] = [];
  const n = clipPaths.length;

  for (let i = 0; i < n; i++) {
    filters.push(`[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24[v${i}]`);
  }

  let currentStream = '[v0]';
  let runningOffset = config.clips[0].duration;

  for (let i = 1; i < n; i++) {
    const clip = config.clips[i];
    const offset = runningOffset - clip.transitionDuration;
    const outLabel = `[xf${i}]`;
    filters.push(`${currentStream}[v${i}]xfade=transition=${clip.transition}:duration=${clip.transitionDuration}:offset=${offset}${outLabel}`);
    currentStream = outLabel;
    runningOffset = offset + config.clips[i].duration;
  }

  if (config.filmGrain) {
    filters.push(`${currentStream}noise=c0s=8:c0f=t+u[grain]`);
    currentStream = '[grain]';
  }

  if (config.vignette) {
    filters.push(`${currentStream}vignette=PI/5[vig]`);
    currentStream = '[vig]';
  }

  const totalDuration = calculateTotalDuration(config);
  filters.push(`${currentStream}fade=t=out:st=${totalDuration - 2}:d=2[vfinal]`);

  if (config.bgmUrl) {
    const audioIdx = n;
    filters.push(`[${audioIdx}:a]volume=${config.bgmVolume},afade=t=in:st=0:d=2,afade=t=out:st=${totalDuration - 3}:d=3[afinal]`);
  }

  return filters.join(';');
}

function calculateTotalDuration(config: AssemblyConfig): number {
  let total = config.clips[0].duration;
  for (let i = 1; i < config.clips.length; i++) {
    total += config.clips[i].duration - config.clips[i].transitionDuration;
  }
  return total;
}

function buildSubtitleFilter(config: AssemblyConfig): string {
  const parts: string[] = [];
  let offset = 0;

  for (let i = 0; i < config.clips.length; i++) {
    const clip = config.clips[i];
    if (clip.subtitle) {
      const start = offset + 0.5;
      const end = offset + clip.duration - 0.5;
      const escaped = clip.subtitle.replace(/'/g, "'\\''").replace(/:/g, '\\:');
      parts.push(
        `drawtext=text='${escaped}':fontfile=/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc:fontsize=${config.subtitleSize}:fontcolor=${config.subtitleColor}:x=(w-text_w)/2:y=h-200:enable='between(t,${start},${end})':shadowcolor=black@0.4:shadowx=2:shadowy=2`
      );
    }
    if (i > 0) {
      offset += clip.duration - clip.transitionDuration;
    } else {
      offset += clip.duration;
    }
  }

  return parts.join(',');
}

async function assembleVideo(config: AssemblyConfig) {
  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });

  console.log('\n[1/4] Downloading clips...');
  const clipPaths = await downloadClips(config.clips);

  if (config.bgmUrl) {
    console.log('[2/4] Downloading BGM...');
    await download(config.bgmUrl, path.join(TMP, 'bgm.mp3'));
  }

  console.log('[3/4] Building FFmpeg command...');

  const inputs = clipPaths.map(p => `-i "${p}"`);
  if (config.bgmUrl) inputs.push(`-i "${path.join(TMP, 'bgm.mp3')}"`);

  const filterComplex = buildFilterComplex(config, clipPaths);
  const totalDuration = calculateTotalDuration(config);

  const maps = ['-map "[vfinal]"'];
  if (config.bgmUrl) maps.push('-map "[afinal]"');

  const cmd = [
    'ffmpeg -y',
    ...inputs,
    `-filter_complex "${filterComplex}"`,
    ...maps,
    '-c:v libx264 -preset fast -crf 22',
    config.bgmUrl ? '-c:a aac -b:a 192k' : '-an',
    '-movflags +faststart',
    `-t ${totalDuration}`,
    `"${config.outputPath}"`,
  ].join(' \\\n  ');

  console.log('\n--- FFmpeg Command ---');
  console.log(cmd);
  console.log('---\n');

  console.log('[4/4] Assembling video...');
  try {
    execSync(cmd, { stdio: 'inherit', timeout: 120000 });
    console.log(`\nDone! Output: ${config.outputPath}`);
    const stat = fs.statSync(config.outputPath);
    console.log(`File size: ${(stat.size / 1024 / 1024).toFixed(1)}MB`);
    console.log(`Duration: ~${totalDuration}s`);
  } catch (e: any) {
    console.error('FFmpeg failed:', e.message);

    console.log('\nTrying simpler concat approach...');
    const concatList = clipPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(path.join(TMP, 'concat.txt'), concatList);

    const simpleCmd = [
      'ffmpeg -y',
      `-f concat -safe 0 -i "${path.join(TMP, 'concat.txt')}"`,
      '-c:v libx264 -preset fast -crf 22',
      '-movflags +faststart',
      `"${config.outputPath}"`,
    ].join(' ');

    execSync(simpleCmd, { stdio: 'inherit', timeout: 120000 });
    console.log(`\nDone (simple concat)! Output: ${config.outputPath}`);
  }
}

async function main() {
  console.log('==========================================');
  console.log(' FFmpeg Assembly Prototype');
  console.log('==========================================');

  const testClips = process.argv.slice(2);

  if (testClips.length === 0) {
    console.log('\nUsage:');
    console.log('  npx tsx 06-ffmpeg-assembly.ts <clip1_url> <clip2_url> <clip3_url> ...');
    console.log('\nOr run with the Kling test results:');
    console.log('  npx tsx 06-ffmpeg-assembly.ts \\');
    console.log('    "https://v3b.fal.media/files/.../output.mp4" \\');
    console.log('    "https://v3b.fal.media/files/.../output.mp4" \\');
    console.log('    "https://v3b.fal.media/files/.../output.mp4"');

    console.log('\nRunning with demo config (no clips)...');
    return;
  }

  const config: AssemblyConfig = {
    clips: testClips.map((url, i) => ({
      url,
      duration: 5,
      transition: i === 0 ? 'fadeblack' as const :
                  i === testClips.length - 1 ? 'fadewhite' as const :
                  'dissolve' as const,
      transitionDuration: i === 0 ? 0 : 1.5,
      subtitle: i === 0 ? '우리의 이야기가 시작된 곳' :
                i === testClips.length - 1 ? '' :
                undefined,
    })),
    bgmVolume: 0.3,
    endingText: 'Groom & Bride\n2026.06.20',
    endingDuration: 5,
    outputPath: path.join(TMP, 'output.mp4'),
    filmGrain: true,
    vignette: true,
    subtitleFont: 'NotoSansCJK',
    subtitleSize: 36,
    subtitleColor: 'white',
  };

  await assembleVideo(config);
}

main().catch(console.error);
