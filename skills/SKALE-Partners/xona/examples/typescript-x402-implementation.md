# TypeScript x402 Implementation for SKALE skale

This guide provides a simple TypeScript implementation for making x402-payable requests to Xona endpoints on SKALE skale network using the `@x402/core` SDK.

## Overview

- **Network**: SKALE skale (Chain ID: `eip155:1187947933`)
- **Asset**: USDC
- **Protocol**: x402 v2
- **Facilitator**: `https://facilitator.payai.network/` (predefined, works with any x402-compatible facilitator on SKALE skale)

## Installation

```bash
npm install @x402/core/client @x402/evm viem
```

## Complete Implementation

```typescript
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";

const skale_URL = "https://api.xona-agent.com";

async function callX402Evm(endpoint: string, body: object, evmPrivateKey: `0x${string}`) {
  const account = privateKeyToAccount(evmPrivateKey);
  const evmScheme = new ExactEvmScheme(account);
  const coreClient = new x402Client().register("eip155:1187947933", evmScheme);
  const httpClient = new x402HTTPClient(coreClient);

  // Use /base/ prefix for SKALE skale endpoints
  const url = `${BASE_URL}/base${endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.status !== 402) return response;

  const responseBody = await response.json();
  const paymentRequired = httpClient.getPaymentRequiredResponse(
    (name) => response.headers.get(name),
    responseBody
  );
  const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
  const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...paymentHeaders },
    body: JSON.stringify(body),
  });
}
```

## Usage Examples

### Image Generation

```typescript
// Generate image with designer model ($0.08)
const res = await callX402Evm(
  "/image/designer",
  {
    prompt: "A serene Japanese garden with cherry blossoms",
    style: ["watercolor", "peaceful"],
    aspect_ratio: "16:9"
  },
  "0x..." // Your private key
);

const data = await res.json();
console.log(data.url); // Generated image URL
```

### Video Generation

```typescript
// Generate video from text prompt ($0.50)
const res = await callX402Evm(
  "/video/short-generation",
  {
    prompt: "Drone footage flying over majestic mountains at sunrise",
    aspect_ratio: "16:9"
  },
  "0x..." // Your private key
);

const data = await res.json();
console.log(data.url); // Generated video URL
```

### Image-to-Video Conversion

```typescript
// Convert image to video ($0.50)
const res = await callX402Evm(
  "/video/short-generation",
  {
    prompt: "Animate this scene with gentle camera movement",
    image_url: "https://example.com/source-image.jpg"
  },
  "0x..." // Your private key
);

const data = await res.json();
console.log(data.url); // Generated video URL
```

### High-Quality Image Generation

```typescript
// Generate 4K image with nano-banana-2 ($0.15)
const res = await callX402Evm(
  "/image/nano-banana-2",
  {
    prompt: "Mountain landscape at sunrise",
    resolution: "4k",
    aspect_ratio: "16:9"
  },
  "0x..." // Your private key
);

const data = await res.json();
console.log(data.url); // Generated image URL
```

### Creative Research

```typescript
// Use creative-director for prompt refinement ($0.03)
const res = await callX402Evm(
  "/image/creative-director",
  {
    idea: "A serene garden with magical elements"
  },
  "0x..." // Your private key
);

const data = await res.json();
console.log(data); // Research and refined prompt suggestions
```

## Available Endpoints

### Image Generation

| Endpoint | Price | Description |
|----------|-------|-------------|
| `/base/image/creative-director` | $0.03 | Research and prompt refinement |
| `/base/image/designer` | $0.08 | Style blending |
| `/base/image/nano-banana` | $0.10 | Fast generation |
| `/base/image/nano-banana-2` | $0.06-$0.15 | Resolution-based (1k/2k/4k) |
| `/base/image/nano-banana-pro` | $0.20 | Premium quality |
| `/base/image/grok-imagine` | $0.04 | Grok AI model |
| `/base/image-model/qwen-image` | $0.05 | Qwen model |
| `/base/image-model/seedream-4.5` | $0.08 | ByteDance Seedream-4.5 |

### Video Generation

| Endpoint | Price | Description |
|----------|-------|-------------|
| `/base/video/short-generation` | $0.50 | 10-second video |

## Error Handling

```typescript
async function safeCallX402Evm(endpoint: string, body: object, privateKey: `0x${string}`) {
  try {
    const res = await callX402Evm(endpoint, body, privateKey);

    if (!res.ok) {
      throw new Error(`Request failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    if (error.message.includes('insufficient funds')) {
      console.error('Insufficient USDC balance on SKALE Base');
      // Guide user to fund their wallet
    } else if (error.message.includes('Payment Required')) {
      console.error('Payment failed');
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}
```

## Environment Configuration

```typescript
// .env
PRIVATE_KEY=0x...  // Your wallet private key (NEVER commit this)
```

```typescript
// config.ts
export const config = {
  privateKey: process.env.PRIVATE_KEY as `0x${string}`,
  baseUrl: 'https://api.xona-agent.com',
  chainId: 'eip155:1187947933', // SKALE Base
};
```

## Package Dependencies

```json
{
  "dependencies": {
    "@x402/core/client": "^1.0.0",
    "@x402/evm": "^1.0.0",
    "viem": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "dotenv": "^16.3.1"
  }
}
```

## Alternative Facilitators

This implementation works with any x402-compatible facilitator on SKALE Base. The `@x402/core` SDK automatically handles payment routing through your configured facilitator.

To use a specific facilitator, configure it when creating the x402 client:

```typescript
const coreClient = new x402Client({
  facilitatorUrl: 'https://facilitator.payai.network/' // or any x402-compatible facilitator
}).register("eip155:1187947933", evmScheme);
```

## Complete Example: Image Generation Service

```typescript
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";

class XonaImageGenerator {
  private httpClient: x402HTTPClient;
  private baseUrl: string;

  constructor(privateKey: `0x${string}`) {
    const account = privateKeyToAccount(privateKey);
    const evmScheme = new ExactEvmScheme(account);
    const coreClient = new x402Client().register("eip155:1187947933", evmScheme);
    this.httpClient = new x402HTTPClient(coreClient);
    this.baseUrl = "https://api.xona-agent.com";
  }

  async generateImage(
    model: string,
    prompt: string,
    options?: {
      style?: string[];
      aspect_ratio?: string;
      resolution?: string;
      referenceImage?: string[];
    }
  ): Promise<string> {
    const endpoint = `/image/${model}`;
    const url = `${this.baseUrl}/base${endpoint}`;

    const body = {
      prompt,
      ...options
    };

    const response = await this.makeRequest(url, body);
    const data = await response.json();

    return data.url;
  }

  async generateVideo(
    prompt: string,
    options?: {
      aspect_ratio?: string;
      image_url?: string;
    }
  ): Promise<string> {
    const endpoint = "/video/short-generation";
    const url = `${this.skaleUrl}/base${endpoint}`;

    const body = {
      prompt,
      ...options
    };

    const response = await this.makeRequest(url, body);
    const data = await response.json();

    return data.url;
  }

  private async makeRequest(url: string, body: object): Promise<Response> {
    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.status === 402) {
      const responseBody = await response.json();
      const paymentRequired = this.httpClient.getPaymentRequiredResponse(
        (name) => response.headers.get(name),
        responseBody
      );
      const paymentPayload = await this.httpClient.createPaymentPayload(paymentRequired);
      const paymentHeaders = this.httpClient.encodePaymentSignatureHeader(paymentPayload);

      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...paymentHeaders },
        body: JSON.stringify(body),
      });
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response;
  }
}

// Usage
const generator = new XonaImageGenerator(process.env.PRIVATE_KEY as `0x${string}`);

// Generate image
const imageUrl = await generator.generateImage(
  'designer',
  'A sunset over mountains',
  { style: ['watercolor'], aspect_ratio: '16:9' }
);
console.log('Image URL:', imageUrl);

// Generate video
const videoUrl = await generator.generateVideo(
  'Drone footage over mountains',
  { aspect_ratio: '16:9' }
);
console.log('Video URL:', videoUrl);
```

## Security Best Practices

1. **Never commit private keys** - Use environment variables
2. **Validate user input** - Sanitize prompts before sending
3. **Handle errors gracefully** - Provide clear error messages
4. **Use HTTPS only** - All endpoints must use HTTPS
5. **Keep SDK updated** - Regularly update `@x402/core` and dependencies
