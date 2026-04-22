# Corbits Facilitator Example

Corbits is a hosted facilitator service that streamlines x402 payment processing using the Viem and Farmeter SDKs.

## Prerequisites

- Node.js and npm installed
- A wallet on SKALE Base Sepolia
- Basic understanding of x402 protocol

## Installation

```bash
npm install viem
npm install @faremeter/info
npm install @faremeter/middleware
```

## Environment Variables

Create a `.env` file:

```bash
# Receiver address for the x402 payment
RECEIVING_ADDRESS=0xAddress_Receiving_Payment

# Private key (NEVER commit this!)
PRIVATE_KEY=0xyour_pk

# Server port
PORT=3000
```

## Server Setup

```typescript
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { hono as middleware } from "@faremeter/middleware";
import { evm } from "@faremeter/info";
import "dotenv/config";

const app = new Hono();

const receiver_address = process.env.RECEIVING_ADDRESS || "0xsome_default_address";
const facilitator = "https://facilitator.corbits.dev";

const paywalledMiddleware = await middleware.createMiddleware({
  facilitatorURL: facilitator,
  accepts: [
    evm.x402Exact({
      network: "eip155:324705682",
      asset: "USDC",
      amount: "1000", // $0.0001 in USDC base units
      payTo: receiver_address,
    }),
  ],
});

// Free endpoint - no payment required
app.get("/api/free", (c) => {
  return c.json({
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
app.get("/api/premium", paywalledMiddleware, (c) => {
  return c.json({
    type: "paid",
    message: "This is a paid data that requires x402 payment",
    timestamp: new Date().toISOString(),
    data: {
      temperature: 72,
      humidity: 45,
      conditions: "Sunny",
    },
  });
});

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
```

## Client Setup

```typescript
import { createLocalWallet } from "@faremeter/wallet-evm";
import { createPaymentHandler } from "@faremeter/payment-evm/exact";
import { wrap as wrapFetch } from "@faremeter/fetch";
import { skaleBaseSepoliaTestnet } from "viem/chains";
import "dotenv/config";

const pk = process.env.PRIVATE_KEY;

if (!pk) {
  throw new Error("PRIVATE_KEY must be set in your environment");
}

const url = `http://localhost:3000/api/premium`;

const wallet = await createLocalWallet(skaleBaseSepoliaTestnet, pk);

const fetchWithPayer = wrapFetch(fetch, {
  handlers: [createPaymentHandler(wallet)],
});

const response = await fetchWithPayer(url);

if (response.ok) {
  const data = await response.json();
  console.log("Response data:", data);
} else {
  console.error(`Error: ${response.statusText}`);
}
```

## Troubleshooting

| Issue                 | Solution                                |
| --------------------- | --------------------------------------- |
| Invalid signature     | Verify wallet configuration and signing |
| Insufficient balance  | Ensure payer has enough tokens          |
| Network mismatch      | Check chain ID matches configuration    |
| Expired authorization | Increase timeout settings               |

## Resources

- [Corbits Documentation](https://docs.corbits.dev/facilitator/introduction/overview)
- [x402 Protocol Specification](https://x402.org)
