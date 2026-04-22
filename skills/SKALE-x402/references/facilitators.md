# Facilitators on SKALE

The facilitation process in x402 (verification and settlement of payments) is critical to ensuring resources are paid for properly. While the process is 100% self-hostable by the seller, hosted facilitators like PayAI and x402 reduce integration scope by letting sellers accept payments without blockchain knowledge, transaction management, or gas fees.

On SKALE, facilitators support both SKALE Base (Mainnet) and SKALE Base Sepolia (Testnet), providing a drop-in solution for processing x402 payments.

## Available Facilitators

| Name             | Endpoint                                                                  | Notes                       |
| ---------------- | ------------------------------------------------------------------------- | --------------------------- |
| AutoIncentive    | `https://facilitator.x402endpoints.online`                                | Multi-chain, gasless on SKALE |
| Corbits          | `https://facilitator.corbits.dev`                                         | Developer-focused           |
| Kobaru           | `https://gateway.kobaru.io`                                               | Enterprise, BITE v1         |
| PayAI            | `https://facilitator.payai.network`                                       | Recommended                 |
| RelAI            | `https://facilitator.x402.fi`                                             | BITE v1 support             |
| Ultravioleta DAO | `https://facilitator.ultravioletadao.xyz`                                 | x402 v1 + v2 support        |
| x402x            | `https://facilitator.x402x.dev`                                           | Advanced features           |

## Facilitator Comparison

| Facilitator     | Features                                      | SDK Support       | BITE Support | x402 Version |
| --------------- | --------------------------------------------- | ----------------- | ------------ | ------------ |
| AutoIncentive   | Multi-chain, gasless on SKALE, free to use    | TypeScript/Node   | No           | v1 & v2      |
| Corbits         | Viem + Farmeter SDKs                          | TypeScript/Node   | No           | v1           |
| Kobaru          | Console, Transparent Proxy                    | TS, Go, Python    | Yes (v1)     | v1           |
| PayAI           | Simple setup                                  | TypeScript/Node   | No           | v1           |
| RelAI           | Multi-token, encryption                       | TypeScript/Node   | Yes (v1)     | v1           |
| Ultravioleta    | x402 v1 + v2, multi-version support           | TypeScript/Node   | No           | v1 + v2      |
| x402x           | Analytics, webhooks, rate-limiting            | TypeScript/Node   | No           | v1           |

## Using a Facilitator

To use any facilitator, configure the x402 resource server with the facilitator's endpoint URL:

```typescript
import { HTTPFacilitatorClient } from "@x402/core/server";

const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://facilitator.payai.network"  // Replace with chosen facilitator
});
```

See specific facilitator examples in `examples/` for complete integration guides.

## Facilitator Details

### AutoIncentive

**Endpoint**: `https://facilitator.x402endpoints.online`

**Highlights**:
- Multi-Chain Support — Base, SKALE Base, and Solana from a single endpoint
- Gasless on SKALE — Zero gas fees for settlement on SKALE Base, powered by CREDITS
- x402 v1 & v2 — Supports both legacy network names and CAIP-2 format
- Free to use — No fees charged on top of payments

**Supported Networks**:

| Network            | Network Identifier                 | Token | Signer Address                               |
| ------------------ | ---------------------------------- | ----- | -------------------------------------------- |
| SKALE Base Mainnet | `skale-base` / `eip155:1187947933` | USDC  | `0x12a2A9353fD1bAdb2eB9DbE9Cb75d73e527D2763` |

**Resources**: [AutoIncentive GitHub](https://github.com/Concorde89/facilitator) | `examples/autoincentive.md`

### Corbits

**Endpoint**: `https://facilitator.corbits.dev`

**Features**: Developer-focused, Viem + Farmeter SDKs

**Resources**: [Documentation](https://docs.corbits.dev/facilitator/introduction/overview) | `examples/corbits.md`

### Kobaru

**Endpoint**: `https://gateway.kobaru.io`

**Features**: Enterprise-grade, Console, Transparent Proxy, BITE v1 support

**Resources**: [Documentation](https://docs.kobaru.io) | `examples/kobaru.md`

### PayAI

**Endpoint**: `https://facilitator.payai.network`

**Features**: Simple setup, recommended for beginners

**Resources**: `examples/payai.md`

### RelAI

**Endpoint**: `https://facilitator.x402.fi`

**Features**: Multi-token, encryption, BITE v1 support

**Resources**: [Documentation](https://relai.fi/documentation) | `examples/relai.md`

### Ultravioleta DAO

**Endpoint**: `https://facilitator.ultravioletadao.xyz`

**Features**: x402 v1 + v2 support, multi-version compatibility

**Resources**: `examples/ultravioleta.md`

### x402x

**Endpoint**: `https://facilitator.x402x.dev`

**Features**: Analytics, webhooks, rate-limiting, advanced features

**Resources**: [Documentation](https://www.x402x.dev/docs) | `examples/x402x.md`

## Run Your Own Facilitator

Prefer to run your own facilitator? This requires blockchain knowledge and compute credits/sFUEL depending on the chain.

For detailed documentation on self-hosting, see:
- [SKALE x402 Facilitator Guide](https://docs.skale.space/cookbook/x402/facilitator)
- [x402 Protocol Specification](https://x402.org)

For support, join the SKALE Discord: [https://discord.gg/skale](https://discord.gg/skale)

## Submit Your Facilitator

Does your facilitator support SKALE? Submit a PR to add it:
[https://github.com/skalenetwork/docs.skale.space](https://github.com/skalenetwork/docs.skale.space)

## Important Notice

Facilitators are third-party services with their own terms and conditions. AI and agents are a highly experimental space; third-party software solutions may have bugs or be unaudited. Use these services at your own risk and per their terms.
