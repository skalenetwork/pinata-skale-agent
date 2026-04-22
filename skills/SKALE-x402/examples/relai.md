# RelAI Facilitator Example

RelAI is a hosted facilitator service that simplifies x402 payment processing on SKALE Network with **BITE v1 support** for encrypted transactions.

## BITE Transaction Support

When a merchant settles any x402 transaction through RelAI facilitator, it gets automatically encrypted through BITE and only decrypted at the consensus level.

For more information on BITE protocol, see [SKALE BITE Documentation](https://docs.skale.space/concepts/bite-protocol/intro-bite-protocol).

## Prerequisites

- Node.js and npm installed
- A wallet on SKALE Base or SKALE Base Sepolia
- Basic understanding of x402 protocol

## Installation

```bash
npm install @relai-fi/x402 express cors dotenv
```

## Environment Variables

Create a `.env` file:

```bash
# Your wallet address to receive payments
PAYMENT_RECEIVER_ADDRESS=0xYourWalletAddressHere

# Private key for client (NEVER commit this!)
PRIVATE_KEY=0xYourPrivateKeyHere

# Server port
PORT=3000

# Price for premium endpoint (in USD)
PREMIUM_PRICE=0.01
```

## Supported Networks and Tokens

| Network            | Tokens                     |
| ------------------ | -------------------------- |
| SKALE Base Sepolia | USDC, USDT, ETH, SKL, WBTC |
| SKALE Base         | USDC, USDT, ETH, SKL, WBTC |

## Server Setup

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Relai from '@relai-fi/x402/server';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize RelAI SDK for SKALE Base Sepolia
const relai = new Relai({
  network: 'skale-base-sepolia',
  facilitatorUrl: 'https://facilitator.x402.fi'
});

// Public endpoint - no payment required
app.get('/api/public', (req, res) => {
  res.json({
    message: 'This is a public endpoint - no payment required',
    network: 'SKALE Base Sepolia'
  });
});

// Premium endpoint - protected by x402 payment
app.get(
  '/api/premium',
  relai.protect({
    payTo: process.env.PAYMENT_RECEIVER_ADDRESS!,
    price: parseFloat(process.env.PREMIUM_PRICE || '0.01'),
  }),
  (req, res) => {
    // Payment is automatically verified by the middleware
    // req.payment contains the payment details
    res.json({
      success: true,
      message: 'Premium data unlocked via RelAI!',
      payment: req.payment
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

## Client Setup

```typescript
import dotenv from 'dotenv';
import { createX402Client } from '@relai-fi/x402/client';
import { privateKeyToAccount } from 'viem/accounts';

dotenv.config();

async function main() {
  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

  // Create account from private key
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  // Create x402 client with RelAI
  const client = createX402Client({
    wallets: {
      evm: {
        address: account.address,
        signTypedData: (params) =>
          account.signTypedData(params as any),
      },
    },
  });

  // Access RelAI-protected resource
  const response = await client.fetch(`${SERVER_URL}/api/premium`);

  if (response.ok) {
    const data = await response.json();
    console.log('Data received:', data);
  }
}

main().catch(console.error);
```

## Troubleshooting

| Issue                | Solution                                     |
| -------------------- | -------------------------------------------- |
| Invalid signature    | Verify wallet configuration and signing      |
| Insufficient balance | Ensure payer has enough tokens               |
| Network mismatch     | Check network matches configuration          |
| Invalid receiver     | Verify PAYMENT_RECEIVER_ADDRESS is correct   |

## Resources

- [RelAI Documentation](https://relai.fi/documentation)
- [x402 Protocol Specification](https://x402.org)
- [BITE Protocol Documentation](https://docs.skale.space/concepts/bite-protocol/intro-bite-protocol)
