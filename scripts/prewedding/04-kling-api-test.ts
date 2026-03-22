const { fal } = require("@fal-ai/client");

const IMAGE_URL = process.argv[2] || "https://res.cloudinary.com/duzlquvxj/image/upload/v1774140141/wedding/kx62u3fhi3auocdjnlvb.png";

async function testKlingI2V(name: string, prompt: string, duration: string = "5") {
  console.log(`\n--- [${name}] ---`);
  console.log(`Prompt: ${prompt.slice(0, 80)}...`);
  const start = Date.now();

  try {
    const result = await fal.subscribe("fal-ai/kling-video/v3/standard/image-to-video", {
      input: {
        prompt,
        image_url: IMAGE_URL,
        duration,
        aspect_ratio: "9:16",
        cfg_scale: 0.5,
        generate_audio: false,
        negative_prompt: "blur, distort, low quality, chinese style, asian temple",
      },
      logs: true,
      onQueueUpdate: (update: any) => {
        if (update.status === "IN_PROGRESS") {
          const elapsed = Math.round((Date.now() - start) / 1000);
          process.stdout.write(`\r  [${elapsed}s] ${update.status}...`);
        }
      },
    });

    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`\n  Done in ${elapsed}s`);
    console.log(`  Video: ${(result as any).data?.video?.url}`);
    return (result as any).data?.video?.url;
  } catch (e: any) {
    console.log(`\n  FAILED: ${e.message}`);
    return null;
  }
}

async function testKlingT2V(name: string, prompt: string) {
  console.log(`\n--- [${name}] T2V ---`);
  const start = Date.now();

  try {
    const result = await fal.subscribe("fal-ai/kling-video/v3/standard/text-to-video", {
      input: {
        prompt,
        duration: "5",
        aspect_ratio: "9:16",
        cfg_scale: 0.5,
        generate_audio: false,
        negative_prompt: "blur, distort, low quality",
      },
      logs: true,
      onQueueUpdate: (update: any) => {
        if (update.status === "IN_PROGRESS") {
          const elapsed = Math.round((Date.now() - start) / 1000);
          process.stdout.write(`\r  [${elapsed}s] ${update.status}...`);
        }
      },
    });

    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`\n  Done in ${elapsed}s`);
    console.log(`  Video: ${(result as any).data?.video?.url}`);
    return (result as any).data?.video?.url;
  } catch (e: any) {
    console.log(`\n  FAILED: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log("==============================================");
  console.log(" Kling 3.0 API Test — Wedding Video Pipeline");
  console.log("==============================================");
  console.log(`Image: ${IMAGE_URL}`);
  console.log(`Model: Kling v3 Standard (fal.ai)`);

  const results: Record<string, string | null> = {};

  results["T2V"] = await testKlingT2V("Text-to-Video",
    "A beautiful couple walking hand in hand through a golden autumn garden. Warm sunlight, shallow depth of field, cinematic 35mm film look. The woman wears a flowing white dress."
  );

  results["I2V Basic"] = await testKlingI2V("Image-to-Video",
    "Gentle slow zoom in. Soft natural light wraps around the couple. Hair moves slightly in warm breeze. Cinematic shallow depth of field. Wedding portrait feel."
  );

  results["Zoom In"] = await testKlingI2V("Zoom In",
    "Slow smooth zoom in toward the couple's faces. Intimate framing. Background softly blurs. Warm golden light."
  );

  results["Pan Right"] = await testKlingI2V("Pan Right",
    "Smooth cinematic horizontal pan from left to right. The couple stays centered in frame. Background environment reveals. Soft bokeh."
  );

  results["Static Hold"] = await testKlingI2V("Static Hold",
    "Camera completely still. The couple breathes naturally. Hair and dress fabric move slightly in gentle wind. Soft ambient light. 35mm film grain."
  );

  results["Warm Amber"] = await testKlingI2V("Warm Amber Grade",
    "Warm amber golden hour color grading. Soft orange tones. Gentle lens flare. Slow zoom in. Romantic cinematic feel."
  );

  results["Film Grain"] = await testKlingI2V("Film Grain Grade",
    "Vintage 35mm film grain. Slightly faded warm colors. Nostalgic tone. Slow gentle movement. Classic wedding film look."
  );

  console.log("\n\n========== RESULTS ==========");
  for (const [name, url] of Object.entries(results)) {
    console.log(`[${name}] ${url || "FAILED"}`);
  }
  console.log("=============================");
}

main();
