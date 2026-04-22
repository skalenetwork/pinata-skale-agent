# Kobaru Facilitator Example

[Kobaru](https://www.kobaru.io) enables machine-to-machine payments with reliable, transparent payment infrastructure for developers. It supports TypeScript/Node.js, Go, and Python.

## Kobaru Products

- **Kobaru Console**: Revenue command center for managing payment infrastructure
- **Transparent Proxy**: No-code monetization tool for existing APIs
- **Kobaru Gateway**: Core facilitator infrastructure for SKALE
- **API Paywall Cookbook**: Open-source templates and examples

## Why SKALE Base with Kobaru?

- **Instant settlement**: SKALE's instant finality
- **Predictable costs**: No gas price spikes or unexpected fees
- **Fiat Settlement**: Coming soon for blockchain-frictionless experience

## Installation

```bash
npm install @x402/core @x402/evm @x402/hono viem
```

## Environment Variables

Create a `.env` file:

```bash
# Required: Your wallet to receive payments
WALLET_ADDRESS=0xYourWalletAddress

# Optional: Kobaru API key for enhanced features
KOBARU_API_KEY=your_api_key_from_console

# Private key for client
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
  // Configure Kobaru facilitator
  const facilitatorUrl = "https://gateway.kobaru.io";
  const facilitatorClient = new HTTPFacilitatorClient({
    url: facilitatorUrl,
    headers: process.env.KOBARU_API_KEY ? {
      "Authorization": `Bearer ${process.env.KOBARU_API_KEY}`
    } : undefined
  });

  // Register EVM payment scheme for SKALE
  const resourceServer = new x402ResourceServer(facilitatorClient);
  resourceServer.register("eip155:*", new ExactEvmScheme());

  // Network and token configuration
  const networkId = "eip155:324705682"; // SKALE Base Sepolia
  const assetAddress = "0x2e08028E3C4c2356572E096d8EF835cD5C6030bD"; // USDC

  // Define payment requirements
  const routes = {
    "GET /api/data": {
      accepts: [
        {
          scheme: "exact",
          network: networkId,
          payTo: process.env.WALLET_ADDRESS as `0x${string}`,
          price: {
            amount: "1000", // 0.001 USDC
            asset: assetAddress,
            extra: {
              name: "USDC",
              version: "2"
            }
          }
        }
      ],
      description: "Premium data access",
      mimeType: "application/json"
    }
  };

  // Apply payment middleware
  app.use("*", paymentMiddleware(routes, resourceServer));

  // Protected endpoint
  app.get("/api/data", (c) => {
    return c.json({
      message: "Premium data unlocked!",
      timestamp: new Date().toISOString()
    });
  });

  const port = 3000;
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Using Kobaru facilitator: ${facilitatorUrl}`);
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

  const evmScheme = new ExactEvmScheme(account);
  const coreClient = new x402Client().register("eip155:*", evmScheme);
  const httpClient = new x402HTTPClient(coreClient);

  const url = "http://localhost:3000/api/data";
  const response = await fetch(url);

  if (response.status === 402) {
    console.log("Payment required, processing via Kobaru...");

    const responseBody = await response.json();
    const paymentRequired = httpClient.getPaymentRequiredResponse(
      (name: string) => response.headers.get(name),
      responseBody
    );

    const paymentPayload = await httpClient.createPaymentPayload(
      paymentRequired
    );

    const paymentHeaders = httpClient.encodePaymentSignatureHeader(
      paymentPayload
    );

    const paidResponse = await fetch(url, {
      headers: { ...paymentHeaders },
    });

    const data = await paidResponse.json();
    console.log("Data received:", data);
  }
}

main();
```

## Transparent Proxy (No-Code)

Transform any existing API into a paid endpoint without code changes:

1. Go to [console.kobaru.io](https://console.kobaru.io)
2. Sign up and create a new service
3. Configure backend URL and slug
4. Define paid routes with pricing
5. Access via `https://access.kobaru.io/{your-slug}/premium-data`

## Troubleshooting

| Issue                | Solution                                                                 |
| -------------------- | ------------------------------------------------------------------------ |
| Invalid API key      | Verify `KOBARU_API_KEY` in console.kobaru.io                             |
| Wrong network        | Ensure `eip155:1187947933` (mainnet) or `eip155:324705682` (testnet)     |
| Insufficient balance | User needs USDC on SKALE Base (bridge from Base)                         |
| Expired signature    | Client must sign fresh payment                                          |

## Token Metadata Fetch

Fetch metadata from Kobaru instead of hardcoding:

```typescript
const supported = await facilitatorClient.getSupported();
const networkData = supported.kinds?.find(
  (kind: any) => kind.network === networkId &&
  kind.extra?.asset?.toLowerCase() === assetAddress.toLowerCase()
);
if (networkData?.extra) {
  const { name, version, decimals } = networkData.extra;
  return { name, version, decimals };
}
```

## Resources

- [Kobaru Documentation](https://docs.kobaru.io)
- [API Paywall Cookbook](https://github.com/kobaru-io/api-paywall-cookbook)
- [x402 Protocol Specification](https://x402.org)
