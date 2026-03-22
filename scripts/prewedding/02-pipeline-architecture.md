# 식전영상 자동화 파이프라인 — 기술 아키텍처

## 시스템 개요

```
Customer Input → Photo Analysis → Story Engine → Style Transform → Video Generation → Assembly → Delivery
     |               |                |                |                |              |           |
  사진 5~10장    GPT-4o Vision    GPT-4o + 룰셋    SeedDream       Seedance 1.5    FFmpeg     Cloudinary
  커플 정보      태그/감정 추출    순서/자막 배치    색보정 적용      사진→영상 클립   조립+BGM    MP4 업로드
  템플릿 선택
```

## DB Schema (Prisma)

```prisma
model PreweddingVideo {
  id             String   @id @default(cuid())
  weddingId      String?
  userId         String
  status         PreweddingVideoStatus @default(PENDING)
  templateId     String
  templateData   Json
  photos         Json     // [{url, tag, emotion, order}]
  scenes         Json     // [{index, photoUrl, styledUrl, clipUrl, prompt, camera, transition, subtitle, colorTemp, duration}]
  bgmUrl         String?
  outputUrl      String?
  resolution     String   @default("1080p")
  aspectRatio    String   @default("9:16")
  totalDuration  Float?
  estimatedCost  Float?
  errorMsg       String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user    User     @relation(fields: [userId], references: [id])
  wedding Wedding? @relation(fields: [weddingId], references: [id])

  @@index([userId])
  @@index([status])
}

enum PreweddingVideoStatus {
  PENDING
  ANALYZING
  STYLING
  GENERATING
  ASSEMBLING
  DONE
  FAILED
}

model VideoTemplate {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  nameEn      String?
  description String
  category    String   @default("classic")
  ruleset     Json
  bgmPresets  Json     @default("[]")
  colorPreset String   @default("warm_amber")
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
}
```

## API Endpoints

```
POST   /api/prewedding-video/create          → 영상 생성 시작
GET    /api/prewedding-video/:id             → 상태 조회
GET    /api/prewedding-video/:id/poll        → 클라이언트 폴링
GET    /api/prewedding-video/my              → 내 영상 목록
DELETE /api/prewedding-video/:id             → 삭제
GET    /api/prewedding-video/templates       → 템플릿 목록
GET    /api/prewedding-video/templates/:slug → 템플릿 상세
```

## 파이프라인 Step별 구현

### Step 1: Photo Analysis (GPT-4o Vision)

```typescript
// server/src/prewedding/photoAnalyzer.ts

interface PhotoAnalysis {
  url: string;
  tags: string[];        // ['travel', 'selfie', 'formal', 'nature', 'closeup', 'group']
  emotion: string;       // 'warm' | 'calm' | 'energetic' | 'intimate' | 'joyful'
  quality: number;       // 1-10
  faceCount: number;
  setting: string;       // 'indoor' | 'outdoor' | 'studio' | 'nature' | 'urban'
  lightCondition: string;// 'golden_hour' | 'daylight' | 'night' | 'studio' | 'overcast'
}

async function analyzePhotos(imageUrls: string[]): Promise<PhotoAnalysis[]> {
  const results: PhotoAnalysis[] = [];

  // 배치 분석 — 모든 사진을 한 번에 GPT-4o에 보냄
  const content = [
    { type: 'text', text: `Analyze these ${imageUrls.length} wedding photos. For each photo, return JSON array with: tags (travel/selfie/formal/nature/closeup/group), emotion (warm/calm/energetic/intimate/joyful), quality (1-10), faceCount, setting (indoor/outdoor/studio/nature/urban), lightCondition (golden_hour/daylight/night/studio/overcast). Return ONLY valid JSON array.` },
    ...imageUrls.map(url => ({ type: 'image_url', image_url: { url } }))
  ];

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  });

  return JSON.parse(res.choices[0].message.content).photos;
}
```

### Step 2: Story Engine (GPT-4o + Template Ruleset)

```typescript
// server/src/prewedding/storyEngine.ts

interface Scene {
  index: number;
  photoUrl: string;
  subtitle: string;
  camera: 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'tilt_up' | 'static';
  transition: 'dissolve' | 'cut' | 'fade_white' | 'fade_black' | 'smash_cut';
  colorTemp: 'cool' | 'neutral' | 'warm' | 'hot';
  duration: number;       // seconds
  holdDuration: number;   // seconds of static hold before transition
  emotionTarget: string;
}

async function buildStoryboard(
  photos: PhotoAnalysis[],
  template: VideoTemplate,
  coupleInfo: { groomName: string; brideName: string; weddingDate: string; metDate?: string }
): Promise<Scene[]> {

  const ruleset = template.ruleset;

  const prompt = `You are a film director creating a pre-wedding video storyboard.

Template: "${template.name}" (${template.category})
Emotion Curve: ${JSON.stringify(ruleset.emotionCurve)}
Scene Count: ${ruleset.sceneCount}
Photos available: ${JSON.stringify(photos.map((p, i) => ({ index: i, tags: p.tags, emotion: p.emotion, setting: p.setting })))}

Couple: ${coupleInfo.groomName} & ${coupleInfo.brideName}
Wedding Date: ${coupleInfo.weddingDate}
${coupleInfo.metDate ? `Met: ${coupleInfo.metDate}` : ''}

Rules:
1. Follow the emotion curve exactly: ${ruleset.emotionCurve.map((e: any) => `Scene ${e.scene}: ${e.emotion} (${e.colorTemp})`).join(', ')}
2. Best quality photo → climax scene
3. Closeup photos → intimate/warm scenes
4. Travel/outdoor → establishing/transition scenes
5. Camera movements: ${JSON.stringify(ruleset.cameraPresets)}
6. Transition timing: ${JSON.stringify(ruleset.transitionPresets)}

Generate ${ruleset.sceneCount} scenes. Each scene needs: photoIndex, subtitle (Korean, emotional, short), camera, transition, colorTemp, duration, holdDuration.
Return ONLY valid JSON array.`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
  });

  return JSON.parse(res.choices[0].message.content).scenes;
}
```

### Step 3: Style Transform (SeedDream — 기존 인프라)

```typescript
// server/src/prewedding/styleTransform.ts

// SeedDream API — 이미 AI스냅에서 사용 중인 인프라 그대로 활용
// 색보정 프롬프트만 템플릿별로 다르게 적용

const COLOR_PRESETS: Record<string, string> = {
  warm_amber:    'warm amber golden hour color grading, soft orange tones, gentle lens flare',
  cool_slate:    'cool blue-grey modern color grading, clean shadow contrast, desaturated',
  film_grain:    'vintage 35mm film grain, slightly faded warm colors, nostalgic tone',
  pastel_bloom:  'soft pastel bloom, overexposed highlights, dreamy pink undertones',
  noir_contrast: 'high contrast noir, deep shadows, dramatic rim lighting',
};

async function applyStyleTransform(
  photoUrl: string,
  colorPreset: string,
  intensity: number = 0.3  // 0.0~1.0, 낮을수록 원본 유지
): Promise<string> {
  // SeedDream strength 조절로 색보정 강도 컨트롤
  // 기존 AI스냅 파이프라인과 동일한 구조
  // 결과: Cloudinary에 업로드된 색보정 이미지 URL
}
```

### Step 4: Video Generation (Seedance 1.5 Pro)

```typescript
// server/src/prewedding/videoGenerator.ts

const ARK_BASE = 'https://ark.ap-southeast.bytepluses.com/api/v3';
const ARK_API_KEY = process.env.ARK_API_KEY;

const CAMERA_PROMPTS: Record<string, string> = {
  zoom_in:    'Slow smooth zoom in toward the subject. Intimate framing.',
  zoom_out:   'Gentle zoom out revealing the environment. Establishing shot.',
  pan_left:   'Smooth horizontal pan from right to left. Subject moves through frame.',
  pan_right:  'Smooth horizontal pan from left to right. Cinematic reveal.',
  tilt_up:    'Camera slowly tilts upward. Dramatic reveal from feet to face.',
  static:     'Camera completely still. Subject breathes naturally. Minimal movement.',
};

async function generateClip(
  scene: Scene,
  styledPhotoUrl: string,
  colorPrompt: string,
): Promise<{ taskId: string }> {

  const cameraPrompt = CAMERA_PROMPTS[scene.camera] || CAMERA_PROMPTS.static;

  const fullPrompt = [
    cameraPrompt,
    colorPrompt,
    'Cinematic shallow depth of field. Natural subtle movement.',
    `--resolution 1080p --ratio 9:16 --dur ${scene.duration} --seed -1`,
  ].join(' ');

  const body = {
    model: 'seedance-1-5-pro-251215',
    content: [
      { type: 'image_url', image_url: { url: styledPhotoUrl } },
      { type: 'text', text: fullPrompt },
    ],
  };

  const res = await fetch(`${ARK_BASE}/contents/generations/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ARK_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return { taskId: data.id };
}

async function pollClip(taskId: string): Promise<string> {
  // 5초 간격 폴링, 최대 5분
  // 성공 시 video_url 반환
  // 실패 시 1회 재시도 후 에러
}

async function generateAllClips(scenes: Scene[]): Promise<string[]> {
  // 병렬 생성 (최대 3개 동시) — Rate limit 고려
  // Promise.all with concurrency control
  const clipUrls: string[] = [];

  for (let i = 0; i < scenes.length; i += 3) {
    const batch = scenes.slice(i, i + 3);
    const results = await Promise.all(
      batch.map(async (scene) => {
        const { taskId } = await generateClip(scene, scene.styledUrl!, '');
        return pollClip(taskId);
      })
    );
    clipUrls.push(...results);
  }

  return clipUrls;
}
```

### Step 5: Assembly (FFmpeg on Fly.io)

```typescript
// server/src/prewedding/videoAssembler.ts
// FFmpeg 기반 클립 조립 — Fly.io 512MB VM에서 실행

interface AssemblyInput {
  clips: Array<{
    url: string;
    duration: number;
    transition: string;
    subtitle?: string;
    subtitleFont?: string;
    subtitlePosition?: 'center' | 'bottom';
  }>;
  bgmUrl: string;
  bgmVolume: number;        // 0.0~1.0
  outputResolution: string;  // '1080x1920' (9:16)
  colorLut?: string;         // LUT 파일 경로
  endingText: string;        // "이름 & 이름\n2026.06.20"
  fadeOutDuration: number;   // 마지막 페이드 아웃 초
}

async function assembleVideo(input: AssemblyInput): Promise<string> {
  // 1. 모든 클립 다운로드 → /tmp/clips/
  // 2. FFmpeg filter_complex 구성
  //    - 클립 연결
  //    - 전환 효과 (xfade filter: dissolve, fade, wipeleft 등)
  //    - 자막 오버레이 (drawtext)
  //    - 색보정 LUT (lut3d)
  //    - BGM 믹싱 (amix, volume)
  //    - 페이드 아웃
  // 3. 출력 → /tmp/output.mp4
  // 4. Cloudinary 업로드
  // 5. URL 반환

  const filterParts: string[] = [];
  const inputs: string[] = [];

  for (let i = 0; i < input.clips.length; i++) {
    inputs.push(`-i /tmp/clips/clip_${i}.mp4`);
  }
  inputs.push(`-i /tmp/bgm.mp3`);

  // xfade transitions between clips
  let currentStream = '[0:v]';
  for (let i = 1; i < input.clips.length; i++) {
    const offset = input.clips.slice(0, i).reduce((s, c) => s + c.duration, 0) - 1;
    const transition = mapTransition(input.clips[i].transition);
    const outLabel = `[v${i}]`;
    filterParts.push(`${currentStream}[${i}:v]xfade=transition=${transition}:duration=1:offset=${offset}${outLabel}`);
    currentStream = outLabel;
  }

  // subtitle overlay
  for (let i = 0; i < input.clips.length; i++) {
    if (input.clips[i].subtitle) {
      // drawtext filter per scene timing
    }
  }

  // ending text
  filterParts.push(`${currentStream}fade=t=out:st=${totalDuration - input.fadeOutDuration}:d=${input.fadeOutDuration}[vfinal]`);

  // BGM
  const audioIdx = input.clips.length;
  filterParts.push(`[${audioIdx}:a]volume=${input.bgmVolume},afade=t=out:st=${totalDuration - 3}:d=3[afinal]`);

  const ffmpegCmd = [
    'ffmpeg',
    ...inputs,
    '-filter_complex', filterParts.join(';'),
    '-map', '[vfinal]',
    '-map', '[afinal]',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
    '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart',
    '-y', '/tmp/output.mp4',
  ].join(' ');

  // exec ffmpeg
  // upload to cloudinary
  // return url
}

function mapTransition(t: string): string {
  const map: Record<string, string> = {
    dissolve:    'dissolve',
    cut:         'fade',        // 0.1s fade = hard cut feel
    fade_white:  'fadewhite',
    fade_black:  'fadeblack',
    smash_cut:   'fade',
  };
  return map[t] || 'dissolve';
}
```

### Step 6: Orchestrator

```typescript
// server/src/prewedding/orchestrator.ts

async function createPreweddingVideo(
  userId: string,
  photoUrls: string[],
  templateSlug: string,
  coupleInfo: CoupleInfo,
  weddingId?: string,
): Promise<string> {

  // 1. DB 레코드 생성
  const video = await prisma.preweddingVideo.create({
    data: {
      userId,
      weddingId,
      templateId: templateSlug,
      status: 'ANALYZING',
      photos: photoUrls.map(url => ({ url })),
    },
  });

  // 비동기 처리 시작 (fire & forget)
  processVideo(video.id).catch(err => {
    prisma.preweddingVideo.update({
      where: { id: video.id },
      data: { status: 'FAILED', errorMsg: err.message },
    });
  });

  return video.id;
}

async function processVideo(videoId: string) {
  const video = await prisma.preweddingVideo.findUnique({ where: { id: videoId } });
  const template = await prisma.videoTemplate.findUnique({ where: { slug: video.templateId } });

  // Step 1: Analyze
  await updateStatus(videoId, 'ANALYZING');
  const analyses = await analyzePhotos(video.photos.map(p => p.url));

  // Step 2: Storyboard
  const scenes = await buildStoryboard(analyses, template, video.coupleInfo);

  // Step 3: Style
  await updateStatus(videoId, 'STYLING');
  for (const scene of scenes) {
    scene.styledUrl = await applyStyleTransform(
      scene.photoUrl,
      template.colorPreset,
      template.ruleset.styleIntensity || 0.3
    );
  }

  // Step 4: Generate clips
  await updateStatus(videoId, 'GENERATING');
  const clipUrls = await generateAllClips(scenes);
  scenes.forEach((s, i) => { s.clipUrl = clipUrls[i]; });

  // Step 5: Assemble
  await updateStatus(videoId, 'ASSEMBLING');
  const outputUrl = await assembleVideo({
    clips: scenes.map(s => ({
      url: s.clipUrl!,
      duration: s.duration,
      transition: s.transition,
      subtitle: s.subtitle,
    })),
    bgmUrl: template.bgmPresets[0]?.url || '',
    bgmVolume: 0.3,
    outputResolution: '1080x1920',
    endingText: `${video.coupleInfo.groomName} & ${video.coupleInfo.brideName}\n${video.coupleInfo.weddingDate}`,
    fadeOutDuration: 3,
  });

  // Step 6: Done
  await prisma.preweddingVideo.update({
    where: { id: videoId },
    data: {
      status: 'DONE',
      outputUrl,
      scenes,
      totalDuration: scenes.reduce((s, sc) => s + sc.duration, 0),
    },
  });
}
```

## 비용 시뮬레이션

| Step | 항목 | 단가 | 수량 | 소계 |
|------|------|------|------|------|
| 1 | GPT-4o Vision (사진 분석) | ~$0.01/장 | 8장 | $0.08 |
| 2 | GPT-4o (스토리보드) | ~$0.01 | 1회 | $0.01 |
| 3 | SeedDream (색보정) | ~$0.035/장 | 8장 | $0.28 |
| 4 | Seedance 1.5 (영상) | ~$0.10/클립 | 8클립 | $0.80 |
| 5 | FFmpeg (조립) | 서버 연산 | 1회 | $0.00 |
| 6 | Cloudinary (저장) | 기존 인프라 | 1회 | $0.00 |
| **합계** | | | | **~$1.17 (약 1,600원)** |

## 판매가 대비 마진

| 상품 | 판매가 | 원가 | 마진 |
|------|--------|------|------|
| Basic (1편) | 29,000원 | ~1,600원 | 94.5% |
| Premium (1편 + 색보정 선택) | 49,000원 | ~2,000원 | 95.9% |
| Studio (풀옵션) | 79,000원 | ~3,000원 | 96.2% |
