#!/usr/bin/env node

/**
 * Xona Image/Video Generator Wrapper
 * Derives private key from mnemonic and generates content
 */

import { XonaX402Client, IMAGE_MODELS, VIDEO_MODELS } from "./xona-x402-client.js";
import { mnemonicToAccount } from "viem/accounts";

const MNEMONIC = "remind supply youth chimney remember width venture kidney vote maple tilt dove";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  try {
    // Derive account from mnemonic (same HD wallet path as OWS)
    const account = mnemonicToAccount(MNEMONIC, { accountIndex: 0 });

    console.log(`\n✅ OWS Wallet Loaded: ${account.address}`);

    const client = new XonaX402Client(account);

    if (command === "frog") {
      // Generate the mariachi frog!
      const prompt =
        "A whimsical, cartoonish frog dressed as a Mexican mariachi musician, wearing a vibrant embroidered sombrero, playing an acoustic guitar, colorful traditional outfit with golden embroidery, festive and joyful atmosphere, professional illustration style";

      console.log(`\n🎨 Generating: Mariachi Frog`);
      const result = await client.generateImage(
        "grok-imagine",
        prompt
      );

      console.log("\n🎉 Success!");
      if (result.image_url) {
        console.log(`\n📸 Image URL: ${result.image_url}`);
      } else if (result.url) {
        console.log(`\n📸 Image URL: ${result.url}`);
      }

      // Save to file for reference
      const fs = await import("fs");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `frog-mariachi-${timestamp}.json`;
      fs.writeFileSync(filename, JSON.stringify(result, null, 2));
      console.log(`💾 Saved to: ${filename}`);
    } else if (command === "image") {
      const model = args[1] || "grok-imagine";
      const prompt = args.slice(2).join(" ");

      if (!prompt) {
        console.error("❌ Error: Please provide a prompt");
        showHelp();
        process.exit(1);
      }

      const result = await client.generateImage(model, prompt);
      console.log("\n✅ Image generated!");

      const fs = await import("fs");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `xona-image-${timestamp}.json`;
      fs.writeFileSync(filename, JSON.stringify(result, null, 2));
      console.log(`📸 Result saved to: ${filename}`);
    } else if (command === "video") {
      const prompt = args.slice(1).join(" ");

      if (!prompt) {
        console.error("❌ Error: Please provide a prompt");
        showHelp();
        process.exit(1);
      }

      const result = await client.generateVideo(prompt);
      console.log("\n✅ Video generated!");

      const fs = await import("fs");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `xona-video-${timestamp}.json`;
      fs.writeFileSync(filename, JSON.stringify(result, null, 2));
      console.log(`🎬 Result saved to: ${filename}`);
    } else if (command === "list-models") {
      console.log("\n📊 Image Models:");
      Object.entries(IMAGE_MODELS).forEach(([name, config]) => {
        console.log(`   ${name.padEnd(20)} $${config.price}`);
      });
      console.log("\n📊 Video Models:");
      Object.entries(VIDEO_MODELS).forEach(([name, config]) => {
        console.log(`   ${name.padEnd(20)} $${config.price}`);
      });
    } else if (command === "help" || command === "--help") {
      showHelp();
    } else {
      console.error(`\n❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
  Xona Content Generator - x402 Payments on SKALE Base
  
  COMMANDS:
    frog                      Generate a mariachi frog image ($ 0.04)
    image <model> <prompt>    Generate custom image
    video <prompt>            Generate 10-second video
    list-models              Show all available models
    help                     Show this help
  
  IMAGE MODELS ($0.03 - $0.20):
    • grok-imagine           $0.04 - Best value
    • qwen-image             $0.05
    • creative-director      $0.03 - Prompt refinement
    • designer               $0.08 - Style blending
    • seedream-4.5           $0.08
    • nano-banana            $0.10
    • nano-banana-2          $0.06-$0.15
    • nano-banana-pro        $0.20 - Premium quality
  
  VIDEO MODELS:
    • short-generation       $0.50 - 10 second videos
  
  EXAMPLES:
    node xona-generate.js frog
    node xona-generate.js image grok-imagine "A sunset over mountains"
    node xona-generate.js video "Dragons flying through clouds"
    node xona-generate.js list-models
  `);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
}
