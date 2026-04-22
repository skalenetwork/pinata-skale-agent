---
name: SKALE-Partners
description: This skill should be used when the user asks about "SKALE partners", "SKALE ecosystem tools", "SKALE integrations", "Xona AI", "use OWS with Xona", or mentions Xona AI content generation, AI image generation, or OWS wallet for Xona on SKALE Base.
version: 1.3.0
---

# SKALE Partners

Discover and integrate Xona's AI-powered image and video generation platform on SKALE Network.

## What is SKALE Partners?

SKALE Partners connects AI agents with specialized services in the SKALE ecosystem. Currently featuring:

* **Xona** — AI-powered image and video generation with automatic x402 USDC payments

This skill provides navigation to the Xona partner skill for implementation details and examples.

## Key Properties

### x402 Protocol Integration

Xona uses x402 for autonomous payments:

* **Gasless Transactions** — Pay ~$0.0007 per transaction on SKALE Base
* **USDC Payments** — Stable currency for predictable costs
* **No Subscriptions** — Pay per generation, no recurring fees
* **Agent-to-Agent** — Enable autonomous economic interactions

### SKALE Base Network

Xona operates on SKALE Base:

* **High Performance** — Fast transactions with sub-cent costs
* **USDC Payments** — Stable currency for predictable pricing
* **Agent-Ready** — Built for autonomous agent operations

### AI Content Generation

Xona enables creative AI capabilities:

* **8 Image Models** — Various styles and quality levels
* **Video Generation** — 10-second clips from text prompts
* **Style Blending** — Combine reference images with text
* **x402 Payments** — Automatic USDC payments on SKALE Base

## Supported Chains

| Chain | Chain ID | Network | Partner Support |
| ----- | -------- | ------- | --------------- |
| **SKALE Base** | 1187947933 | Mainnet | Xona |
| **SKALE Base Sepolia** | 324705682 | Testnet | Xona |

**Note:** This skill focuses on SKALE Base for Xona services.

## Common Use Cases

### AI Content Generation

Create visual content with AI:

* **Marketing Assets** — Generate images for campaigns
* **Video Content** — Create short videos from text
* **Creative Workflows** — AI-assisted design and iteration
* **Style Transfer** — Blend reference images with prompts

## Quick Start

### Prerequisites

Before using Xona services, ensure you have:

* **OWS Wallet** (recommended) — Secure wallet for SKALE Base
* **USDC on SKALE Base** — For x402 payments (~$0.0007 gas per transaction)

**Recommended Wallet: OWS**

OWS is the recommended wallet for Xona:

* **Secure Key Management** — AES-256-GCM encryption, keys never exposed
* **x402 Payment Ready** — Seamless USDC payments for autonomous transactions
* **Agent-Ready** — Built-in API key system for automated operations

**For wallet setup:**
```bash
# Check for existing OWS wallet
ows wallet list

# Create wallet if needed (use `ows` skill for full setup)
ows wallet create --wallet "my-xona" --show-mnemonic
```

See **"Use Xona with OWS"** section below for complete SKALE Base workflows.

### Getting Started with Xona

**For AI content generation:**
```bash
# Navigate to Xona skill
cat .claude/skills/xona/SKILL.md
```

### Basic Workflow

1. **Navigate to the Xona SKILL.md** for detailed instructions
2. **Follow setup steps** (wallet, USDC funding)
3. **Invoke the Xona skill** when user requests AI content generation

## Partner Skills

### Xona

**Purpose:** AI-powered image and video generation.

**Use when:** AI image generation, video creation, visual content synthesis.

**Key features:**
* 8 image generation models (various styles and quality)
* Video generation (10-second clips)
* Style blending and reference image support
* x402 USDC payments on SKALE Base

**Documentation:** `xona/SKILL.md` (includes examples and references)

## Critical Rules

* **Read Xona SKILL.md First** — Xona has specific setup requirements
* **Fund Your Wallet** — Ensure USDC on SKALE Base for x402 payments
* **Testnet First** — Use SKALE Base Sepolia for testing before mainnet
* **Payment Confirmation** — Always confirm costs before executing paid operations
* **Rate Limits** — Respect API rate limits to avoid service disruption

## Use Xona with OWS

OWS (Open Wallet Standard) is the recommended wallet for Xona on SKALE Base. For complete OWS wallet management capabilities, see the **`ows`** skill.

### Why OWS for Xona?

* **Secure Key Management** — AES-256-GCM encryption, keys never exposed
* **x402 Payments** — Seamless USDC payments for autonomous agent transactions
* **Agent-Ready** — Built-in API key system for automated Xona service calls

### Quick Start with OWS

**Step 1: Check for existing OWS wallet**
```bash
ows wallet list
```

**Step 2: Create wallet if needed**
```bash
ows wallet create --wallet "my-xona" --show-mnemonic
```

**Step 3: Fund wallet with USDC on SKALE Base**
```bash
# Check current balance
ows fund balance --wallet "my-xona" --chain skale-base

# Get USDC on SKALE Base:
# Testnet: https://faucet.skale.space/ (free)
# Mainnet: Bridge via SKALE-Bridge skill
```

### OWS + Xona Workflow

```bash
# 1. Set up OWS wallet
export PRIVATE_KEY=$(ows wallet export --wallet "my-xona")

# 2. Check USDC balance on SKALE Base
ows fund balance --wallet "my-xona" --chain skale-base

# 3. Use Xona for AI content generation with automatic payments
# The xona skill will handle automatic USDC payments (~$0.0007 gas)

# 4. Clean up
unset PRIVATE_KEY
```

### Key OWS Commands for Xona

| Operation | Command |
|-----------|---------|
| Check existing wallets | `ows wallet list` |
| Create new wallet | `ows wallet create --wallet "name" --show-mnemonic` |
| Get address | `ows wallet export --wallet "name"` |
| Check USDC balance | `ows fund balance --wallet "name" --chain skale-base` |
| Sign transaction | `ows sign tx --wallet "name" --chain evm --tx "..."` |
| Sign and broadcast | `ows sign send-tx --wallet "name" --chain evm --tx "..." --rpc-url "..."` |

### Important Gotchas for Xona

**USDC on SKALE Base:** x402 payments require USDC specifically on SKALE Base:

```bash
# Check USDC balance
ows fund balance --wallet "my-xona" --chain skale-base

# If low, bridge USDC to SKALE Base using SKALE-Bridge skill
```

**Gas Costs:** x402 payments on SKALE Base cost ~$0.0007 per transaction (sub-cent).

**Security:** Always unset private key after Xona operations:
```bash
unset PRIVATE_KEY
```

For complete OWS documentation and advanced features (API keys, policies), see the **`ows`** skill.

## Quick Reference

| Partner | Primary Use | Payment | Network | Documentation |
|---------|-------------|---------|---------|---------------|
| **Xona** | AI Content | x402 USDC | SKALE Base | `xona/SKILL.md` |


## Additional Resources

### Partner Documentation

For detailed information on Xona, consult the Xona SKILL.md file:

* **`xona/SKILL.md`** — Image/video generation, model selection, pricing

### Example Files (Xona)

* **`xona/examples/`** — Working examples for AI content generation
* **`xona/references/`** — Detailed model specifications and capabilities

### External Documentation

* [SKALE Network](https://skale.space)
* [x402 Protocol](https://www.x402.org)
* [Xona AI](https://xona.ai)

### Related Skills

* **`ows`** — Multi-chain wallet management
* **`SKALE-Deploy`** — Deploy contracts on SKALE
* **`SKALE-Bridge`** — Bridge USDC to/from SKALE
* **`SKALE-x402`** — x402 protocol implementation details
