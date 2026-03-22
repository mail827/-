

const ARK_API_KEY = process.env.ARK_API_KEY || 'd73850b6';
const BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3';

const MODELS = {
  SEEDANCE_1_5_PRO: 'seedance-1-5-pro-251215',
  SEEDANCE_1_0_PRO: 'seedance-1-0-pro-250723',
  SEEDANCE_1_0_LITE: 'seedance-1-0-lite-i2v-250428',
};

interface VideoTaskRequest {
  model: string;
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
}

interface VideoTaskResponse {
  id: string;
  model: string;
  content: { video_url: string } | null;
  status: 'submitted' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  error?: { code: string; message: string };
  usage?: { completion_tokens: number };
}

async function createVideoTask(
  prompt: string,
  imageUrl?: string,
  options: {
    model?: string;
    resolution?: '480p' | '720p' | '1080p';
    ratio?: '16:9' | '9:16' | '1:1';
    duration?: number;
    seed?: number;
    cameraFixed?: boolean;
    withAudio?: boolean;
  } = {}
): Promise<VideoTaskResponse> {
  const {
    model = MODELS.SEEDANCE_1_5_PRO,
    resolution = '720p',
    ratio = '9:16',
    duration = 5,
    seed = -1,
    cameraFixed = false,
    withAudio = false,
  } = options;

  const paramStr = `--resolution ${resolution} --ratio ${ratio} --dur ${duration} --seed ${seed}${cameraFixed ? ' --camerafixed' : ''}${withAudio ? ' --with_audio' : ''}`;
  const fullPrompt = `${prompt} ${paramStr}`;

  const content: VideoTaskRequest['content'] = [];

  if (imageUrl) {
    content.push({ type: 'image_url', image_url: { url: imageUrl } });
  }
  content.push({ type: 'text', text: fullPrompt });

  const body: VideoTaskRequest = { model, content };

  const res = await fetch(`${BASE_URL}/contents/generations/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ARK_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create task failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<VideoTaskResponse>;
}

async function getVideoTask(taskId: string): Promise<VideoTaskResponse> {
  const res = await fetch(`${BASE_URL}/contents/generations/tasks/${taskId}`, {
    headers: { 'Authorization': `Bearer ${ARK_API_KEY}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Get task failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<VideoTaskResponse>;
}

async function pollUntilDone(taskId: string, maxWait = 300000): Promise<VideoTaskResponse> {
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const task = await getVideoTask(taskId);

    console.log(`  [${Math.round((Date.now() - start) / 1000)}s] status: ${task.status}`);

    if (task.status === 'succeeded') return task;
    if (task.status === 'failed') throw new Error(`Task failed: ${task.error?.message || 'unknown'}`);
    if (task.status === 'cancelled') throw new Error('Task cancelled');

    await new Promise(r => setTimeout(r, 5000));
  }

  throw new Error('Timeout');
}

// ============ TEST CASES ============

async function testTextToVideo() {
  console.log('\n=== TEST 1: Text-to-Video ===');
  console.log('Prompt: Warm golden light. Slow camera pan. A couple walks hand in hand through autumn leaves.');

  const task = await createVideoTask(
    'Warm golden light. Slow camera pan across an autumn garden. Dried leaves float gently in the air. Cinematic, soft bokeh, 35mm film look.',
    undefined,
    { resolution: '720p', ratio: '9:16', duration: 5 }
  );

  console.log(`Task created: ${task.id}`);
  const result = await pollUntilDone(task.id);
  console.log(`Video URL: ${result.content?.video_url}`);
  return result;
}

async function testImageToVideo(imageUrl: string) {
  console.log('\n=== TEST 2: Image-to-Video (Wedding Photo) ===');
  console.log(`Image: ${imageUrl}`);

  const task = await createVideoTask(
    'Gentle slow zoom in on the couple. Soft natural light wraps around them. Hair and dress fabric move slightly in a warm breeze. Cinematic, shallow depth of field.',
    imageUrl,
    { resolution: '720p', ratio: '9:16', duration: 5, cameraFixed: false }
  );

  console.log(`Task created: ${task.id}`);
  const result = await pollUntilDone(task.id);
  console.log(`Video URL: ${result.content?.video_url}`);
  return result;
}

async function testCameraMovements(imageUrl: string) {
  console.log('\n=== TEST 3: Camera Movement Variations ===');

  const movements = [
    { name: 'Zoom In', prompt: 'Slow zoom in on the subject. Intimate close-up. Soft bokeh background deepens.' },
    { name: 'Pan Right', prompt: 'Smooth horizontal pan from left to right. Subject stays centered. Environment reveals.' },
    { name: 'Tilt Up', prompt: 'Camera slowly tilts upward from feet to face. Dramatic reveal. Golden hour light.' },
    { name: 'Static Hold', prompt: 'Camera completely still. Subject breathes naturally. Wind moves hair slightly. 3 second hold.' },
  ];

  const results = [];

  for (const mv of movements) {
    console.log(`\n  [${mv.name}] ${mv.prompt.slice(0, 60)}...`);
    try {
      const task = await createVideoTask(mv.prompt, imageUrl, {
        resolution: '480p',
        ratio: '9:16',
        duration: 5,
        cameraFixed: mv.name === 'Static Hold',
      });
      console.log(`  Task: ${task.id}`);
      results.push({ name: mv.name, taskId: task.id });
    } catch (e: any) {
      console.log(`  Failed: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\nPolling all tasks...');
  for (const r of results) {
    try {
      const result = await pollUntilDone(r.taskId);
      console.log(`  [${r.name}] ${result.content?.video_url}`);
    } catch (e: any) {
      console.log(`  [${r.name}] Failed: ${e.message}`);
    }
  }
}

async function testColorGrading(imageUrl: string) {
  console.log('\n=== TEST 4: Color Grading Styles ===');

  const styles = [
    { name: 'Warm Amber', prompt: 'Warm amber golden hour light. Soft orange tones. Gentle lens flare.' },
    { name: 'Cool Slate', prompt: 'Cool blue-grey tones. Modern minimal. Clean shadow contrast.' },
    { name: 'Film Grain', prompt: 'Vintage 35mm film grain. Slightly faded colors. Nostalgic warm tones.' },
    { name: 'Pastel Bloom', prompt: 'Soft pastel bloom effect. Overexposed highlights. Dreamy pink tones.' },
  ];

  for (const style of styles) {
    console.log(`\n  [${style.name}]`);
    try {
      const task = await createVideoTask(
        `${style.prompt} Slow zoom in. Subject center frame.`,
        imageUrl,
        { resolution: '480p', ratio: '9:16', duration: 5 }
      );
      console.log(`  Task: ${task.id}`);
    } catch (e: any) {
      console.log(`  Failed: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

// ============ MAIN ============

async function main() {
  console.log('==============================================');
  console.log(' Seedance API Test — Wedding Video Pipeline');
  console.log('==============================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${ARK_API_KEY.slice(0, 4)}...`);
  console.log(`Model: ${MODELS.SEEDANCE_1_5_PRO}`);

  const testImageUrl = process.argv[2] || '';

  try {
    await testTextToVideo();

    if (testImageUrl) {
      await testImageToVideo(testImageUrl);
      await testCameraMovements(testImageUrl);
      await testColorGrading(testImageUrl);
    } else {
      console.log('\n[SKIP] Image tests — pass image URL as argument');
      console.log('  npx tsx 01-seedance-api-test.ts https://your-wedding-photo.jpg');
    }

    console.log('\n=== ALL TESTS COMPLETE ===');
  } catch (e: any) {
    console.error(`\nFATAL: ${e.message}`);
  }
}

main();
