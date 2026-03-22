const { fal } = require("@fal-ai/client");

async function main() {
  const result = await fal.subscribe("fal-ai/kling-video/v3/standard/image-to-video", {
    input: {
      prompt: "Gentle slow zoom in. Cinematic wedding portrait. Warm light.",
      image_url: "https://res.cloudinary.com/duzlquvxj/image/upload/v1774140141/wedding/kx62u3fhi3auocdjnlvb.png",
      duration: "5",
      aspect_ratio: "9:16",
      generate_audio: false,
    },
  });

  console.log("=== FULL RESPONSE ===");
  console.log(JSON.stringify(result, null, 2));
}

main();
