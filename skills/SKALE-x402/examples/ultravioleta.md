# Ultravioleta DAO Facilitator Integration

Complete example for integrating Ultravioleta DAO facilitator with x402 on SKALE Base.

## Overview

Ultravioleta DAO provides a hosted facilitator service for x402 payment processing with support for both x402 v1 and v2 protocols.

**Highlights:**
- x402 v1 + v2 Support — Multi-version compatibility
- Drop-in solution for processing x402 payments
- Supports SKALE Base (Mainnet) and SKALE Base Sepolia (Testnet)

## Prerequisites

```bash
npm install @x402/core @x402/evm @x402/hono viem
```

## Environment Variables

Create a `.env` file:

```bash
# Receiver address for the x402 payment
RECEIVING_ADDRESS=0xAddress_Receiving_Payment

# Private key (keep secure!)
PRIVATE_KEY=0xyour_pk
```

## Server Implementation

```typescript
import { Hono } from "hono";
import { paymentMiddleware } from "@x402/hono";
import { HTTPFacilitatorClient } from "@x402/core/server";
import "dotenv/config";

const app = new Hono();

const receiver_address = process.env.RECEIVING_ADDRESS || "0xsome_default_address";

// Initialize Ultravioleta DAO facilitator client
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://facilitator.ultravioletadao.xyz"
});

// Free endpoint
app.get("/api/free", (c) => {
  return c.json({
    type: "free",
    message: "This is free data that does not require payment",
    timestamp: new Date().toISOString(),
    data: {
      value: "Free content accessible to everyone"
    },
  });
});

// Premium endpoint with payment required
app.get(
  "/api/premium",
  paymentMiddleware(facilitatorClient, {
    network: "eip155:1187947933",  // SKALE Base
    asset: "0x85889c8c714505E0c94b30fcfcF64fE3Ac8FCb20",  // USDC on SKALE Base
    amount: "1000",  // Amount in smallest unit
    payTo: receiver_address,
    description: "Premium data requiring x402 payment",
    mimeType: "application/json",
    maxTimeoutSeconds: 60,
  }),
  (c) => {
    return c.json({
      type: "paid",
      message: "This is paid data accessed via x402 payment",
      timestamp: new Date().toISOString(),
      data: {
        value: "Premium content unlocked via payment"
      },
    });
  }
);

// Start server
Bun.serve({
  fetch: app.fetch,
  port: 3000,
});

console.log("Server running on http://localhost:3000");
```

## Client Implementation

```typescript
import { wrapFetch } from "@x402/evm";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import "dotenv/config";

const pk = process.env.PRIVATE_KEY;

if (!pk) {
  throw new Error("PRIVATE_KEY must be set in your environment");
}

const account = privateKeyToAccount(pk as `0x${string}`);
const walletClient = createWalletClient({
  account,
  transport: http("https://skale-base.skalenodes.com/v1/base"),
});

// Wrap fetch to automatically handle x402 payments
const fetchWithPayer = wrapFetch(fetch, walletClient);

// Access protected resource
const url = "http://localhost:3000/api/premium";
const response = await fetchWithPayer(url);

if (response.ok) {
  const data = await response.json();
  console.log("Response data:", data);
} else {
  console.error(`Error: ${response.statusText}`);
}
```

## Network Configuration

Ultravioleta DAO supports both SKALE Base mainnet and testnet:

| Chain              | Chain ID     | Network ID             |
| ------------------ | ------------ | ---------------------- |
| SKALE Base Sepolia | 324705682    | `eip155:324705682`     |
| SKALE Base         | 1187947933   | `eip155:1187947933`    |

## x402 Version Support

Ultravioleta DAO supports both x402 v1 and v2:

- **x402 v1**: Legacy network names (e.g., `skale-base`)
- **x402 v2**: CAIP-2 format (e.g., `eip155:1187947933`)

The facilitator automatically detects which format is being used and handles accordingly.

## Troubleshooting

### Connection Issues

1. Verify the facilitator URL: `https://facilitator.ultravioletadao.xyz`
2. Check network connectivity
3. Ensure proper configuration

### Payment Failures

| Issue                 | Solution                                |
| --------------------- | --------------------------------------- |
| Invalid signature     | Verify wallet configuration and signing |
| Insufficient balance  | Ensure payer has enough USDC            |
| Network mismatch      | Check chain ID matches configuration    |
| Expired authorization | Increase `maxTimeoutSeconds`            |
| Version incompatibility | Ensure x402 version matches server config |

## Resources

- [x402 Protocol Specification](https://x402.org)
- [SKALE Documentation](https://docs.skale.space/cookbook/facilitators/using-ultravioleta)
- [Ultravioleta DAO Documentation](https://ultravioletadao.xyz)

## Important Notice

Ultravioleta DAO is a third-party service with its own terms and conditions. AI and agents are a highly experimental space; third-party software solutions may have bugs or be unaudited. Use this service at your own risk and per their terms.
