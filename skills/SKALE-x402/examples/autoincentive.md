# AutoIncentive Facilitator Integration

Complete example for integrating AutoIncentive facilitator with x402 on SKALE Base.

## Overview

AutoIncentive is a hosted facilitator service that streamlines x402 payment processing. It offers multi-chain support (Base, SKALE Base, Solana) from a single endpoint with zero gas fees on SKALE.

**Highlights:**
- Multi-Chain Support — Base, SKALE Base, and Solana
- Gasless on SKALE — Zero gas fees powered by CREDITS
- x402 v1 & v2 — Supports legacy network names and CAIP-2 format
- Free to use — No fees on top of payments

## Prerequisites

```bash
npm install x402 viem
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
import express from "express";
import { paymentMiddleware } from "x402/express";
import "dotenv/config";

const app = express();

const receiver_address = process.env.RECEIVING_ADDRESS || "0xsome_default_address";
const facilitator = "https://facilitator.x402endpoints.online";

// Free endpoint
app.get("/api/free", (req, res) => {
  res.json({
    type: "free",
    message: "This is free data that does not require payment",
    timestamp: new Date().toISOString(),
    data: {
      temperature: 72,
      humidity: 45,
      conditions: "Sunny",
    },
  });
});

// Premium endpoint with payment required
app.get(
  "/api/premium",
  paymentMiddleware(facilitator, {
    network: "eip155:1187947933",  // SKALE Base
    asset: "0x85889c8c714505E0c94b30fcfcF64fE3Ac8FCb20",  // USDC on SKALE Base
    amount: "1000",  // Amount in smallest unit
    payTo: receiver_address,
    description: "Premium weather data",
    mimeType: "application/json",
    maxTimeoutSeconds: 60,
    resource: "/api/premium",
  }),
  (req, res) => {
    res.json({
      type: "paid",
      message: "This is paid data that requires x402 payment",
      timestamp: new Date().toISOString(),
      data: {
        temperature: 72,
        humidity: 45,
        conditions: "Sunny",
      },
    });
  }
);

app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
```

## Client Implementation

```typescript
import { wrapFetch } from "x402";
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

const fetchWithPayer = wrapFetch(fetch, walletClient);

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

AutoIncentive supports SKALE Base with the following configuration:

| Network            | Network Identifier                 | Token | Signer Address                               |
| ------------------ | ---------------------------------- | ----- | -------------------------------------------- |
| SKALE Base Mainnet | `skale-base` / `eip155:1187947933` | USDC  | `0x12a2A9353fD1bAdb2eB9DbE9Cb75d73e527D2763` |

## Troubleshooting

### Connection Issues

1. Verify the facilitator URL: `https://facilitator.x402endpoints.online`
2. Check network connectivity
3. Ensure API credentials are valid
4. Review firewall settings

### Payment Failures

| Issue                 | Solution                                |
| --------------------- | --------------------------------------- |
| Invalid signature     | Verify wallet configuration and signing |
| Insufficient balance  | Ensure payer has enough USDC            |
| Network mismatch      | Check chain ID matches configuration    |
| Expired authorization | Increase `maxTimeoutSeconds`            |

## Resources

- [AutoIncentive GitHub](https://github.com/Concorde89/facilitator)
- [x402 Protocol Specification](https://x402.org)
- [SKALE Documentation](https://docs.skale.space/cookbook/facilitators/using-autoincentive)
