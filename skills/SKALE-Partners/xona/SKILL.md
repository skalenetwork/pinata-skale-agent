---
name: xona
description: This skill should be used when the user asks to "generate an image with AI", "create an AI image", "generate a video", "create AI content with Xona", "use Xona's image generation", "generate visual content", or mentions Xona creative tools, AI image/video generation, or x402-payable creative services.
version: 0.1.0
---

# Xona AI Content Generation

Generate AI images and videos using Xona's x402-payable resources. This skill enables creation of visual content through various AI models, with payments handled via SKALE Base USDC through the x402 protocol.

## Overview

Xona provides multiple AI models for image and video generation, each optimized for different use cases. All requests require USDC payment on SKALE Base network via x402 protocol. The skill guides users through model selection, parameter configuration, and payment confirmation before generating content.

## Before Using Xona

### Prerequisites Checklist

Before calling Xona services, ensure you have:

Check if you have an OWS wallet in use. You can check the ows skill for that

```
✓ Do I have @x402/core installed?
  npm install @x402/core @x402/evm viem

✓ Do I have my private key or wallet mnemonic?
  Use OWS: ows wallet export --wallet "my-wallet"

✓ Do I have USDC on SKALE Base?
  Check: ows fund balance --wallet "my-wallet" --chain skale-base
  Fund: See "How to Fund Your Wallet" below

✓ Do I know which model I want?
  See "When Do I Use Which Model?" below
```

### Related Skills

If you need to set up prerequisites, see these related skills:

| Need | Related Skill |
|------|---------------|
| Bridge USDC to SKALE Base | **SKALE-Bridge** skill |
| Create/manage wallet | **ows** skill |
| Find other APIs | **x402-bazaar** skill |
| Credit scoring | **cred-protocol** skill |

### How to Fund Your Wallet

Xona requires USDC on SKALE Base for payments. Here's how to fund your wallet:

**Step 1: Check your current balance**
```bash
ows fund balance --wallet "my-wallet" --chain skale-base
```

**Step 2: Fund your wallet (choose one method)**

**Option A: Bridge USDC to SKALE Base (Recommended)**
```bash
# Use the SKALE-Bridge skill
# See: .claude/skills/SKALE-Bridge_/SKILL.md

# Or use Trails API directly
# See: .claude/skills/skale-trails-bridge-hook/SKILL.md
```

**Option B: Use existing funds**
If you already have USDC on another EVM chain, bridge it to SKALE Base.

**Step 3: Verify funding**
```bash
# Confirm you have USDC on SKALE Base
ows fund balance --wallet "my-wallet" --chain skale-base
```

**Minimum recommended amount:** Start with $1-5 USDC for testing. Each image generation costs $0.03-$0.20, video costs $0.50.

## When to Use This Skill

Invoke this skill when users request:
- AI image generation or creation
- AI video generation or creation
- Visual content using Xona services
- AI-powered creative tools
- x402-payable media generation

## Minimal Working Example

### Quick Start with x402

1. **Fund your wallet on SKALE Base**
   ```bash
   # Check balance
   ows fund balance --wallet "my-wallet" --chain skale-base

   # Fund if needed (see SKALE-Bridge skill)
   ```

2. **Install dependencies**
   ```bash
   npm install @x402/core @x402/evm viem
   ```

3. **Use the working implementation**
   ```bash
   # See complete example
   cat .claude/skills/SKALE-Partners/xona/examples/typescript-x402-implementation.md
   ```

4. **Generate content**
   - Pass your prompt and model to the x402 client
   - The facilitator handles payment automatically
   - Receive the generated content URL

**That's it!** The x402 client handles:
- Wallet derivation from mnemonic
- USDC payment on SKALE Base
- 402 Payment Required flow
- Response parsing and error handling

For a complete working implementation, see **`examples/typescript-x402-implementation.md`**.

## Content Generation Workflow

### Step 1: Determine Generation Type

Ask the user what they want to create:
- **Image**: Single visual generation from text prompt
- **Video**: 10-second video from text prompt or image-to-video

### Step 2: Select Model

Present available models with descriptions and pricing. For image generation, show all 8 models. For video, show the single video option.

### Step 3: Collect Parameters

Gather required parameters based on selected model:
- **Required**: Always collect the prompt/idea
- **Optional**: Offer aspect ratio, style keywords, reference images when supported

### Step 4: Show Pricing and Confirm

Display the exact USDC cost and require explicit user confirmation before proceeding.

### Step 5: Generate and Return Results

Execute the x402 request using SKALE Base network and return the generated content URL to the user.

## Image Generation Models

| Model | Price | Description | Best For |
|-------|-------|-------------|----------|
| creative-director | $0.03 | AI-powered creative research and prompt refinement. Analyzes trends, transforms ideas into optimized generation plans. | Exploring ideas before generating |
| designer | $0.08 | Image generation with intelligent style blending. Combines prompt with style keywords. | Artistic control with style guidance |
| nano-banana | $0.10 | Direct generation without style blending. Fast and affordable. | Quick generations |
| nano-banana-2 | $0.06-$0.15 | Resolution-based pricing: 1K=$0.06, 2K=$0.10, 4K=$0.15 | Specific resolution needs |
| nano-banana-pro | $0.20 | Premium quality direct generation. | Highest quality outputs |
| grok-imagine | $0.04 | Uses xAI's Grok Imagine API. Supports single reference image. | Grok-powered generation |
| qwen-image | $0.05 | Qwen model for high-quality images. | Balanced quality and price |
| seedream-4.5 | $0.08 | ByteDance Seedream-4.5 model with advanced AI capabilities. | Advanced generation features |

## Video Generation Models

| Model | Price | Description |
|-------|-------|-------------|
| short-generation | $0.50 | 10-second video using xAI's Grok Video API. Supports image-to-video. |

## When Do I Use Which Model?

### Quick Test or Exploration
**Use: creative-director ($0.03)**
- Lowest cost option
- Great for testing ideas before committing to higher costs
- Analyzes trends and transforms ideas into optimized prompts
- Perfect for brainstorming and concept exploration

### Production Quality
**Use: designer ($0.08) or nano-banana-pro ($0.20)**
- designer: Best for artistic control with style blending
- nano-banana-pro: Highest quality direct generation
- Both suitable for final assets and production use

### Budget Conscious
**Use: grok-imagine ($0.04)**
- Best quality/price ratio
- Powered by xAI's Grok Imagine API
- Supports single reference image
- Good balance of quality and affordability

**Use: qwen-image ($0.05)**
- Slightly higher cost than grok-imagine
- Qwen model for high-quality images
- Good alternative if grok-imagine is unavailable

### Specific Resolution Needs
**Use: nano-banana-2 ($0.06-$0.15)**
- Resolution-based pricing: 1K=$0.06, 2K=$0.10, 4K=$0.15
- Perfect when you need specific output dimensions
- Only model with explicit resolution control

### Fast Generation
**Use: nano-banana ($0.10)**
- Direct generation without style blending
- Fast and affordable
- Good for quick iterations when speed matters

### Advanced Features
**Use: seedream-4.5 ($0.08)**
- ByteDance Seedream-4.5 model
- Advanced AI capabilities
- Similar price to designer with different feature set

## Model Parameters

### creative-director
- **idea** (required): User's prompt/idea for image generation
- **reference_images** (optional): Array of existing image URLs for references

### designer
- **prompt** (required): Detailed prompt description
- **style** (optional): Array of style keywords to blend
- **aspect_ratio** (optional): Aspect ratio (default: 1:1)
- **referenceImage** (optional): Array of reference image URLs

### nano-banana
- **prompt** (required): Detailed prompt description
- **aspect_ratio** (optional): Aspect ratio (default: 1:1)
- **referenceImage** (optional): Array of reference image URLs

### nano-banana-2
- **prompt** (required): Detailed prompt description
- **resolution** (optional): 1k ($0.06), 2k ($0.10), 4k ($0.15)
- **aspect_ratio** (optional): Aspect ratio (default: 1:1)
- **referenceImage** (optional): Array of reference image URLs

### nano-banana-pro
- **prompt** (required): Detailed prompt description
- **aspect_ratio** (optional): Aspect ratio (default: 1:1)
- **referenceImage** (optional): Array of reference image URLs

### grok-imagine
- **prompt** (required): Detailed prompt description
- **referenceImage** (optional): Single reference image URL (only one supported)

### qwen-image
- **prompt** (required): Detailed prompt description
- **aspect_ratio** (optional): Aspect ratio (default: 1:1)
- **referenceImage** (optional): Array of reference image URLs

### seedream-4.5
- **prompt** (required): Detailed prompt description
- **aspect_ratio** (optional): Aspect ratio (default: 1:1)
- **referenceImage** (optional): Array of reference image URLs

### short-generation (video)
- **prompt** (required): Prompt for video generation
- **aspect_ratio** (optional): Video aspect ratio
- **image_url** (optional): Input image URL for image-to-video generation

## Payment Configuration

- **Network**: SKALE Base (Chain ID: `1187947933`)
- **Asset**: USDC
- **Protocol**: x402 v2
- **Facilitator**: `https://facilitator.payai.network/` (predefined, works with any x402-compatible facilitator on SKALE Base)

## API Endpoints

Use these x402-payable API endpoints for generation. All endpoints use POST method and require x402 payment via SKALE Base USDC.

### Image Generation Endpoints

| Model | API Endpoint | Price |
|-------|--------------|-------|
| creative-director | `https://api.xona-agent.com/base/image/creative-director` | $0.03 |
| designer | `https://api.xona-agent.com/base/image/designer` | $0.08 |
| nano-banana | `https://api.xona-agent.com/base/image/nano-banana` | $0.10 |
| nano-banana-2 | `https://api.xona-agent.com/base/image/nano-banana-2` | $0.06-$0.15 |
| nano-banana-pro | `https://api.xona-agent.com/base/image/nano-banana-pro` | $0.20 |
| grok-imagine | `https://api.xona-agent.com/base/image/grok-imagine` | $0.04 |
| qwen-image | `https://api.xona-agent.com/base/image-model/qwen-image` | $0.05 |
| seedream-4.5 | `https://api.xona-agent.com/base/image-model/seedream-4.5` | $0.08 |

### Video Generation Endpoints

| Model | API Endpoint | Price |
|-------|--------------|-------|
| short-generation | `https://api.xona-agent.com/base/video/short-generation` | $0.50 |

## Making API Requests

To call Xona endpoints with x402 payment:

1. **Select the appropriate API endpoint** from the tables above
2. **Prepare the request body** with model-specific parameters (JSON format)
3. **Use x402 facilitator** (Corbits or compatible) to handle payment
4. **Specify payment chain**: SKALE Base 
5. **Send POST request** with x402 headers

Example request body for `designer` model:
```json
{
  "prompt": "A serene Japanese garden with cherry blossoms",
  "style": ["watercolor", "peaceful"],
  "aspect_ratio": "16:9"
}
```

The x402 facilitator will:
- Intercept the 402 Payment Required response
- Process USDC payment on SKALE Base
- Retry the request with payment proof
- Return the generated content URL

## Response Format

After successful generation, Xona returns JSON with the following structure:

```json
{
  "image_url": "https://cdn.xona-agent.com/generated/image-abc123.png",
  "image_description": "A serene Japanese garden with cherry blossoms in watercolor style",
  "metadata": {
    "model": "designer",
    "prompt": "A serene Japanese garden with cherry blossoms",
    "style": ["watercolor", "peaceful"],
    "aspect_ratio": "16:9",
    "generation_time": "2.3s"
  }
}
```

**Response fields:**
- `image_url`: Direct URL to the generated image (valid for 24 hours)
- `image_description`: Natural language description of the generated content
- `metadata`: Generation details including model, prompt, and parameters

**Video generation response:**
```json
{
  "video_url": "https://cdn.xona-agent.com/generated/video-xyz789.mp4",
  "video_description": "A serene Japanese garden with cherry blossoms falling gently",
  "metadata": {
    "model": "short-generation",
    "duration": "10s",
    "aspect_ratio": "16:9",
    "generation_time": "15.7s"
  }
}
```

## Best Practices

1. **Always show pricing**: Display exact USDC cost before any request
2. **Require confirmation**: Get explicit user approval before proceeding with payment
3. **Present options clearly**: Show all available models with descriptions when user requests generation
4. **Collect optional parameters**: Offer optional features like aspect ratio and style keywords when supported
5. **Display results prominently**: Show generated content URLs clearly after completion
6. **Handle errors gracefully**: Manage insufficient balance, generation failures, and timeouts appropriately

## Error Handling

Common errors to handle:
- **Insufficient balance**: Inform user of required USDC amount on SKALE Base
- **Generation failure**: Retry or suggest alternative model
- **Timeout**: Suggest simpler prompt or different model
- **Invalid parameters**: Guide user to provide correct values

## Additional Resources

### Reference Files
- **`references/models.md`** - Detailed model specifications and capabilities
- **`references/x402-integration.md`** - x402 protocol integration details

### Examples
- **`examples/image-generation.md`** - Example image generation workflows
- **`examples/video-generation.md`** - Example video generation workflows
- **`examples/typescript-x402-implementation.md`** - Complete TypeScript implementation for x402 requests on SKALE Base
