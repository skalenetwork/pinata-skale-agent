#!/usr/bin/env node

/**
 * Xona x402 Client - Scalable AI Content Generation on SKALE Base
 * Uses OWS wallet for secure, autonomous x402 USDC payments
 */

import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Configuration
const SKALE_BASE_CHAIN_ID = "eip155:1187947933";
const XONA_BASE_URL = "https://api.xona-agent.com";

// Model pricing
const IMAGE_MODELS = {
  "creative-director": { price: 0.03, endpoint: "/image/creative-director" },
  designer: { price: 0.08, endpoint: "/image/designer" },
  "nano-banana": { price: 0.1, endpoint: "/image/nano-banana" },
  "nano-banana-2": { price: 0.06, endpoint: "/image/nano-banana-2" },
  "nano-banana-pro": { price: 0.2, endpoint: "/image/nano-banana-pro" },
  "grok-imagine": { price: 0.04, endpoint: "/image/grok-imagine" },
  "qwen-image": { price: 0.05, endpoint: "/image-model/qwen-image" },
  "seedream-4.5": { price: 0.08, endpoint: "/image-model/seedream-4.5" },
};

const VIDEO_MODELS = {
  "short-generation": { price: 0.5, endpoint: "/video/short-generation" },
};

class XonaX402Client {
  constructor(accountOrPrivateKey) {
    // Accept either a viem account object or a private key string
    let account;
    if (typeof accountOrPrivateKey === "string") {
      account = privateKeyToAccount(accountOrPrivateKey);
      this.privateKey = accountOrPrivateKey;
    } else {
      account = accountOrPrivateKey;
      this.privateKey = accountOrPrivateKey.privateKey || "unknown";
    }

    const evmScheme = new ExactEvmScheme(account);
    const coreClient = new x402Client().register(SKALE_BASE_CHAIN_ID, evmScheme);
    this.httpClient = new x402HTTPClient(coreClient);
    this.address = account.address;
  }

  async generateImage(model, prompt, options = {}) {
    if (!IMAGE_MODELS[model]) {
      throw new Error(
        `Unknown image model: ${model}. Available: ${Object.keys(IMAGE_MODELS).join(", ")}`
      );
    }

    const modelConfig = IMAGE_MODELS[model];
    const endpoint = modelConfig.endpoint;
    const url = `${XONA_BASE_URL}/base${endpoint}`;

    // Build request body based on model
    const body = this.buildImageBody(model, prompt, options);

    console.log(`\n🎨 Generating image with ${model}...`);
    console.log(`   Prompt: ${prompt}`);
    console.log(`   Cost: $${modelConfig.price} USDC (SKALE Base)`);

    return await this.makeX402Request(url, body, modelConfig.price);
  }

  async generateVideo(prompt, options = {}) {
    const model = "short-generation";
    const modelConfig = VIDEO_MODELS[model];
    const endpoint = modelConfig.endpoint;
    const url = `${XONA_BASE_URL}/base${endpoint}`;

    const body = {
      prompt,
      ...options,
    };

    console.log(`\n🎬 Generating video...`);
    console.log(`   Prompt: ${prompt}`);
    console.log(`   Cost: $${modelConfig.price} USDC (SKALE Base)`);

    return await this.makeX402Request(url, body, modelConfig.price);
  }

  buildImageBody(model, prompt, options) {
    const baseBody = {};

    // creative-director uses "idea" instead of "prompt"
    if (model === "creative-director") {
      baseBody.idea = prompt;
    } else {
      baseBody.prompt = prompt;
    }

    // Add optional parameters based on model capabilities
    if (options.style && model === "designer") {
      baseBody.style = Array.isArray(options.style)
        ? options.style
        : [options.style];
    }

    if (options.aspect_ratio) {
      baseBody.aspect_ratio = options.aspect_ratio;
    }

    if (options.resolution && model === "nano-banana-2") {
      baseBody.resolution = options.resolution;
    }

    if (options.referenceImage && model !== "grok-imagine") {
      baseBody.referenceImage = Array.isArray(options.referenceImage)
        ? options.referenceImage
        : [options.referenceImage];
    } else if (options.referenceImage && model === "grok-imagine") {
      // grok-imagine only supports single reference image
      baseBody.referenceImage = Array.isArray(options.referenceImage)
        ? options.referenceImage[0]
        : options.referenceImage;
    }

    return baseBody;
  }

  async makeX402Request(url, body, expectedCost) {
    try {
      // Initial request (should get 402 Payment Required)
      let response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.status === 402) {
        console.log(`   💳 Processing x402 payment on SKALE Base...`);

        const responseBody = await response.json();
        const paymentRequired = this.httpClient.getPaymentRequiredResponse(
          (name) => response.headers.get(name),
          responseBody
        );

        const paymentPayload =
          await this.httpClient.createPaymentPayload(paymentRequired);
        const paymentHeaders =
          this.httpClient.encodePaymentSignatureHeader(paymentPayload);

        // Retry with payment proof
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...paymentHeaders,
          },
          body: JSON.stringify(body),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Generation failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`   ✅ Generation complete!`);
      console.log(`   📸 URL: ${data.image_url || data.url || data.video_url}`);

      return data;
    } catch (error) {
      if (error.message.includes("insufficient funds")) {
        throw new Error(
          "❌ Insufficient USDC balance on SKALE Base. Please fund your wallet first."
        );
      }
      throw error;
    }
  }

  async checkBalance() {
    try {
      const output = execSync(
        `ows fund balance --wallet "${process.env.OWS_WALLET || "skale-default"}" --chain skale-base`,
        { encoding: "utf8" }
      );
      return output.trim();
    } catch (error) {
      return "Unable to check balance";
    }
  }
}

// Export for use as module or CLI
export { XonaX402Client, IMAGE_MODELS, VIDEO_MODELS };

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  try {
    // Get private key from OWS wallet
    const walletName = process.env.OWS_WALLET || "skale-default";
    console.log(`\n🔐 Loading OWS wallet: ${walletName}`);

    const privateKey = execSync(`ows wallet export --wallet "${walletName}"`, {
      encoding: "utf8",
    }).trim();

    if (!privateKey.startsWith("0x")) {
      throw new Error("Invalid private key from OWS wallet");
    }

    const client = new XonaX402Client(privateKey);

    // Show wallet info
    console.log(`   Address: ${client.address}`);
    console.log(`   Balance: ${await client.checkBalance()}`);

    // Handle commands
    if (command === "help" || command === "--help" || command === "-h") {
      showHelp();
    } else if (command === "image") {
      const model = args[1] || "grok-imagine";
      const prompt = args.slice(2).join(" ");

      if (!prompt) {
        console.error("\n❌ Error: Please provide a prompt");
        console.log("\nUsage: node xona-x402-client.js image <model> <prompt>");
        process.exit(1);
      }

      const result = await client.generateImage(model, prompt);
      saveResult(result, "image");
    } else if (command === "video") {
      const prompt = args.slice(1).join(" ");

      if (!prompt) {
        console.error("\n❌ Error: Please provide a prompt");
        console.log("\nUsage: node xona-x402-client.js video <prompt>");
        process.exit(1);
      }

      const result = await client.generateVideo(prompt);
      saveResult(result, "video");
    } else if (command === "list-models") {
      console.log("\n📊 Available Image Models:");
      Object.entries(IMAGE_MODELS).forEach(([name, config]) => {
        console.log(`   ${name}: $${config.price}`);
      });
      console.log("\n📊 Available Video Models:");
      Object.entries(VIDEO_MODELS).forEach(([name, config]) => {
        console.log(`   ${name}: $${config.price}`);
      });
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
  Xona x402 Client - AI Content Generation on SKALE Base
  
  USAGE:
    node xona-x402-client.js <command> [options]
  
  COMMANDS:
    image <model> <prompt>    Generate image with specified model
    video <prompt>            Generate 10-second video
    list-models              List all available models and pricing
    help                     Show this help message
  
  EXAMPLES:
    # Generate image with grok-imagine ($0.04)
    node xona-x402-client.js image grok-imagine "A frog dressed like a mariachi"
    
    # Generate image with designer ($0.08, supports style)
    node xona-x402-client.js image designer "A magical forest"
    
    # Generate video ($0.50)
    node xona-x402-client.js video "Dragon flying over mountains at sunset"
    
    # List all available models
    node xona-x402-client.js list-models
  
  ENVIRONMENT:
    OWS_WALLET        OWS wallet name (default: "skale-default")
    PRIVATE_KEY       Set this to bypass OWS lookup (use with caution)
  
  REQUIREMENTS:
    - OWS wallet with USDC on SKALE Base
    - @x402/core installed: npm install @x402/core/client @x402/evm viem
  `);
}

function saveResult(result, type) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `xona-${type}-${timestamp}.json`;
  const filepath = path.join(process.cwd(), filename);

  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
  console.log(`\n💾 Result saved to: ${filepath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
}
