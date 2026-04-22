---
name: SKALE-x402
description: This skill should be used when the user asks to "build x402 payments", "setup x402 payment middleware", "create x402 agent client", "monetize AI services", "implement agent-to-agent payments", or mentions x402 protocol, HTTP 402, facilitator setup, or gasless payments on SKALE.
version: 0.1.0
---

# x402 on SKALE

x402 extends HTTP with native payment capabilities using the `402 Payment Required` status code. It enables autonomous agent-to-agent payments, paywalled API resources, and gasless transactions via ERC-3009 TransferWithAuthorization. SKALE's zero gas fees make it ideal for micropayments.

## Core Concepts

x402 consists of three main components:

1. **Resource Server** - Protects API endpoints with payment requirements
2. **Facilitator** - Handles payment processing (use existing services, don't host your own)
3. **Agent Client** - Automatically pays for resources when encountering 402 responses

The protocol flow:
1. Agent requests a protected resource
2. Server responds with `402 Payment Required` + payment details
3. Agent creates payment signature (gasless via ERC-3009)
4. Facilitator executes the payment
5. Agent retries request with payment headers
6. Server returns the protected content

## Quick Start

Install required packages:

```bash
npm install @x402/core @x402/evm @x402/hono
```

## Facilitators

Use an existing facilitator service rather than running your own. See `references/facilitators.md` for detailed comparison and setup instructions.

| Service | URL | Notes |
|---------|-----|-------|
| AutoIncentive | `https://facilitator.x402endpoints.online` | Multi-chain (Base/SKALE/Solana), gasless on SKALE |
| Corbits | `https://facilitator.corbits.dev` | Developer-focused |
| Kobaru | `https://gateway.kobaru.io` | Enterprise, BITE v1 |
| PayAI | `https://facilitator.payai.network` | Recommended |
| RelAI | `https://facilitator.x402.fi` | BITE v1 support |
| Ultravioleta DAO | `https://facilitator.ultravioletadao.xyz` | x402 v1 + v2 support |
| x402x | `https://facilitator.x402x.dev` | Advanced features |

## Network Configuration

x402 uses CAIP-2 network IDs in format `eip155:CHAIN_ID`:

| Chain | Chain ID | Network ID |
|-------|----------|------------|
| SKALE Base Sepolia | 324705682 | `eip155:324705682` |
| SKALE Base | 1187947933 | `eip155:1187947933` |

## Server Implementation

To protect API endpoints with x402 payments:

1. Initialize an x402 resource server with a facilitator client
2. Register payment schemes (ExactEvmScheme for SKALE)
3. Apply payment middleware to protected routes
4. Configure pricing per endpoint (amount, asset, receiving address)

See `references/server.md` for complete server setup code.

## Client Implementation

To enable agents to pay for x402-protected resources:

1. Create an x402 client with signing credentials
2. Wrap fetch calls to handle 402 responses
3. Client automatically creates payment signatures and retries

See `references/client.md` for complete client setup code.

## Use Cases

- **Autonomous Service Access**: Agents pay for API calls, data feeds, AI services
- **Monetize Agent Services**: Protect AI endpoints behind paywalls
- **Multi-Agent Economies**: Enable agent-to-agent payments for services

## Additional Resources

### Reference Files

For detailed implementation guides and reference material:
- **`references/server.md`** - Complete server setup with Hono middleware
- **`references/client.md`** - Client implementation for accessing paid resources
- **`references/tokens.md`** - Available tokens and addresses for SKALE Base/Sepolia
- **`references/concepts.md`** - x402 protocol concepts, ERC-3009, and architecture
- **`references/facilitators.md`** - Facilitator comparison and setup instructions

### Example Files

Working implementations in `examples/`:
- **`complete-setup.md`** - Full server and client implementation
- **`autoincentive.md`** - AutoIncentive facilitator integration example
- **`corbits.md`** - Corbits facilitator integration example
- **`kobaru.md`** - Kobaru facilitator integration example
- **`payai.md`** - PayAI facilitator integration example
- **`relai.md`** - RelAI facilitator integration example
- **`ultravioleta.md`** - Ultravioleta DAO facilitator integration example
- **`x402x.md`** - x402x facilitator integration example

## External Documentation

- [x402 Official Docs](https://docs.skale.space/get-started/agentic-builders/start-with-x402.md)