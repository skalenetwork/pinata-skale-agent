#!/usr/bin/env node

/**
 * Xona Interactive AI Content Generator
 * Prompts for model selection and cost confirmation before generating
 */

import { XonaX402Client, IMAGE_MODELS, VIDEO_MODELS } from "./xona-x402-client.js";
import { mnemonicToAccount } from "viem/accounts";
import * as readline from "readline";

const MNEMONIC =
  "remind supply youth chimney remember width venture kidney vote maple tilt dove";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

function question(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function displayModels() {
  console.log(`\n${colors.cyan}📊 IMAGE GENERATION MODELS${colors.reset}`);
  console.log(
    colors.yellow +
      "─────────────────────────────────────────────────────────" +
      colors.reset
  );

  let index = 1;
  const models = Object.entries(IMAGE_MODELS);

  models.forEach(([name, config], i) => {
    const costStr = `$${config.price.toFixed(2)}`;
    const desc = {
      "grok-imagine": "Best value for quality",
      "qwen-image": "Balanced quality & price",
      "creative-director": "Prompt refinement & research",
      designer: "Style blending & artistic control",
      "seedream-4.5": "Advanced ByteDance model",
      "nano-banana": "Fast direct generation",
      "nano-banana-2": "Resolution-based pricing",
      "nano-banana-pro": "Premium quality output",
    }[name];

    const mark = name === "grok-imagine" ? " ⭐ " : "   ";
    console.log(
      `  ${mark}${colors.bright}${i + 1}.${colors.reset} ${name.padEnd(20)} ${colors.green}${costStr.padEnd(8)}${colors.reset} ${desc}`
    );
  });

  console.log(
    `\n${colors.cyan}🎬 VIDEO GENERATION MODELS${colors.reset}`
  );
  console.log(
    colors.yellow +
      "─────────────────────────────────────────────────────────" +
      colors.reset
  );
  console.log(
    `   1. short-generation        ${colors.green}$0.50${colors.reset}  10-second video clips`
  );
}

async function selectModel() {
  displayModels();

  const answer = await question(
    `\n${colors.bright}Which model would you like to use? (1-8, or 'v' for video): ${colors.reset}`
  );

  const modelIndex = parseInt(answer) - 1;
  const modelKeys = Object.keys(IMAGE_MODELS);

  if (answer.toLowerCase() === "v") {
    return {
      type: "video",
      model: "short-generation",
      price: 0.5,
    };
  }

  if (modelIndex >= 0 && modelIndex < modelKeys.length) {
    const modelName = modelKeys[modelIndex];
    const modelConfig = IMAGE_MODELS[modelName];
    return {
      type: "image",
      model: modelName,
      price: modelConfig.price,
    };
  }

  console.error(`${colors.red}❌ Invalid selection${colors.reset}`);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);

  try {
    // Load wallet
    const account = mnemonicToAccount(MNEMONIC, { accountIndex: 0 });
    console.log(`\n${colors.green}✅ OWS Wallet Loaded${colors.reset}`);
    console.log(`   ${colors.cyan}Address: ${account.address}${colors.reset}`);

    const client = new XonaX402Client(account);

    // Handle commands
    if (args.length === 0) {
      // Interactive mode
      const selection = await selectModel();
      let prompt;

      if (selection.type === "image") {
        console.log(
          `\n${colors.bright}Selected: ${selection.model}${colors.reset}`
        );
        console.log(
          `${colors.cyan}Cost: $${selection.price.toFixed(2)} USDC on SKALE Base${colors.reset}`
        );
        prompt = await question(
          `\n${colors.bright}Enter your image prompt:${colors.reset} `
        );

        const confirmed = await question(
          `\n${colors.yellow}⚠️  Ready to generate? This will charge $${selection.price.toFixed(2)} USDC. Confirm? (yes/no): ${colors.reset}`
        );

        if (confirmed.toLowerCase() !== "yes") {
          console.log(`${colors.red}❌ Cancelled${colors.reset}`);
          process.exit(0);
        }

        const result = await client.generateImage(selection.model, prompt);
        saveAndDisplay(result, "image");
      } else {
        prompt = await question(
          `\n${colors.bright}Enter your video prompt:${colors.reset} `
        );

        const confirmed = await question(
          `\n${colors.yellow}⚠️  Ready to generate? This will charge $${selection.price.toFixed(2)} USDC. Confirm? (yes/no): ${colors.reset}`
        );

        if (confirmed.toLowerCase() !== "yes") {
          console.log(`${colors.red}❌ Cancelled${colors.reset}`);
          process.exit(0);
        }

        const result = await client.generateVideo(prompt);
        saveAndDisplay(result, "video");
      }
    } else if (args[0] === "quick" || args[0] === "q") {
      // Quick mode - grok-imagine (default best value)
      const prompt = args.slice(1).join(" ");
      if (!prompt) {
        console.error(`${colors.red}❌ Please provide a prompt${colors.reset}`);
        process.exit(1);
      }

      console.log(
        `\n${colors.cyan}Using grok-imagine (best value at $0.04)...${colors.reset}`
      );
      const result = await client.generateImage("grok-imagine", prompt);
      saveAndDisplay(result, "image");
    } else if (args[0] === "list") {
      displayModels();
    } else {
      console.error(
        `${colors.red}❌ Unknown command: ${args[0]}${colors.reset}\n`
      );
      showHelp();
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

function saveAndDisplay(result, type) {
  const fs = require("fs");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename =
    type === "image"
      ? `xona-image-${timestamp}.json`
      : `xona-video-${timestamp}.json`;

  fs.writeFileSync(filename, JSON.stringify(result, null, 2));

  console.log(`\n${colors.green}✅ Generation complete!${colors.reset}`);

  if (result.image_url) {
    console.log(`${colors.cyan}📸 Image URL:${colors.reset}`);
    console.log(`   ${result.image_url}`);
  } else if (result.url) {
    console.log(`${colors.cyan}📸 URL:${colors.reset}`);
    console.log(`   ${result.url}`);
  } else if (result.video_url) {
    console.log(`${colors.cyan}🎬 Video URL:${colors.reset}`);
    console.log(`   ${result.video_url}`);
  }

  console.log(`\n${colors.magenta}💾 Result saved to: ${filename}${colors.reset}\n`);
}

function showHelp() {
  console.log(`
  ${colors.bright}Xona Interactive - AI Content Generation on SKALE Base${colors.reset}

  ${colors.cyan}USAGE:${colors.reset}
    node xona-interactive.js [command]

  ${colors.cyan}COMMANDS:${colors.reset}
    (no args)      Launch interactive model selector
    quick <prompt> Use grok-imagine ($0.04) for quick generation
    list           Show all available models
    help           Show this help message

  ${colors.cyan}EXAMPLES:${colors.reset}
    # Interactive mode (select model, enter prompt, confirm cost)
    node xona-interactive.js

    # Quick generation with best-value model
    node xona-interactive.js quick "A frog dressed as a mariachi"
    node xona-interactive.js q "A sunset over mountains"

    # List available models
    node xona-interactive.js list

  ${colors.cyan}FEATURES:${colors.reset}
    ✓ Interactive model selection
    ✓ Clear pricing display
    ✓ Cost confirmation before payment
    ✓ Automatic x402 settlement on SKALE Base
    ✓ Results saved to JSON
  `);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2] === "help" || process.argv[2] === "--help") {
    showHelp();
  } else {
    main().catch((error) => {
      console.error(
        `${colors.red}Fatal error: ${error.message}${colors.reset}`
      );
      process.exit(1);
    });
  }
}
