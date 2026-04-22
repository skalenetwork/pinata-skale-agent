# PayAI Facilitator Example

PayAI is a recommended hosted facilitator service that provides simple x402 payment processing on SKALE Network.

## Prerequisites

- Node.js and npm installed
- A wallet on SKALE Base or SKALE Base Sepolia
- Basic understanding of x402 protocol

## Installation

```bash
npm install @x402/core @x402/evm @x402/hono viem
```

## Environment Variables

Create a `.env` file:

```bash
# Your wallet to receive payments
RECEIVING_ADDRESS=0xYourReceivingAddress

# Private key for client (NEVER commit this!)
PRIVATE_KEY=0xYourPrivateKeyHere

# Server port
PORT=3000
```

## Server Setup

```typescript
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import "dotenv/config";

const app = new Hono();
app.use("*", cors());

async function main() {
  // Configure PayAI facilitator
  const client = new HTTPFacilitatorClient({
    url: "https://facilitator.payai.network"
  });

  const server = new x402ResourceServer(client);
  server.register("eip155:*", new ExactEvmScheme());

  // Define payment-protected endpoints
  const routes = {
    "GET /api/data": {
      accepts: [{
        scheme: "exact",
        network: "eip155:324705682", // SKALE Base Sepolia
        payTo: process.env.RECEIVING_ADDRESS as `0x${string}`,
        price: {
          amount: "1000",  // 0.001 USDC
          asset: "0x2e08028E3C4c2356572E096d8EF835cD5C6030bD"
        }
      }]
    }
  };

  // Apply payment middleware
  app.use("*", paymentMiddleware(routes, server));

  // Protected endpoint
  app.get("/api/data", (c) => {
    return c.json({
      message: "Premium data unlocked via PayAI!",
      timestamp: new Date().toISOString(),
      data: {
        temperature: 72,
        humidity: 45,
        conditions: "Sunny",
      }
    });
  });

  const port = 3000;
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Using PayAI facilitator: https://facilitator.payai.network`);
  });
}

main().catch(console.error);
```

## Client Setup

```typescript
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";
import "dotenv/config";

async function main() {
  const account = privateKeyToAccount(
    process.env.PRIVATE_KEY as `0x${string}`
  );

  const httpClient = new x402HTTPClient(
    new x402Client().register("eip155:*", new ExactEvmScheme(account))
  );

  const url = "http://localhost:3000/api/data";
  const response = await fetch(url);

  if (response.status === 402) {
    console.log("Payment required, processing via PayAI...");

    const responseBody = await response.json();
    const paymentRequired = httpClient.getPaymentRequiredResponse(
      (name) => response.headers.get(name),
      responseBody
    );

    const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
    const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

    const paidResponse = await fetch(url, { headers: paymentHeaders });
    const data = await paidResponse.json();
    console.log("Data received:", data);
  } else if (response.ok) {
    const data = await response.json();
    console.log("Data received:", data);
  } else {
    console.error(`Error: ${response.statusText}`);
  }
}

main();
```

## Complete Example with Multiple Endpoints

```typescript
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import "dotenv/config";

const app = new Hono();

const client = new HTTPFacilitatorClient({
  url: "https://facilitator.payai.network"
});
const server = new x402ResourceServer(client);
server.register("eip155:*", new ExactEvmScheme());

// Multiple endpoints with different pricing
app.use(paymentMiddleware({
  "GET /api/basic": {
    accepts: [{
      scheme: "exact",
      network: "eip155:324705682",
      payTo: process.env.RECEIVING_ADDRESS as `0x${string}`,
      price: { amount: "1000", asset: "0x2e08028E3C4c2356572E096d8EF835cD5C6030bD" }
    }]
  },
  "GET /api/premium": {
    accepts: [{
      scheme: "exact",
      network: "eip155:324705682",
      payTo: process.env.RECEIVING_ADDRESS as `0x${string}`,
      price: { amount: "10000", asset: "0x2e08028E3C4c2356572E096d8EF835cD5C6030bD" }
    }]
  }
}, server));

app.get("/api/basic", (c) => c.json({ tier: "basic", data: "Basic content" }));
app.get("/api/premium", (c) => c.json({ tier: "premium", data: "Premium content" }));

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
```

## Troubleshooting

| Issue                 | Solution                                |
| --------------------- | --------------------------------------- |
| Invalid signature     | Verify wallet configuration and signing |
| Insufficient balance  | Ensure payer has enough USDC            |
| Network mismatch      | Check chain ID matches SKALE Base Sepolia |
| Connection timeout    | Verify facilitator URL is correct       |

## Resources

- [x402 Protocol Specification](https://x402.org)
- [SKALE Documentation](https://docs.skale.space)
