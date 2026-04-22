# Gas Model and Funding

## Overview

SKALE uses **Compute Credits (CREDIT)** instead of traditional gas fees. Understanding this model is essential for proper deployment and user experience.

## Compute Credits (SKALE Base)

**Chains:** SKALE Base (Mainnet and Testnet)

**Characteristics:**
- Prepaid gas credits
- Chain owner purchases credits in bulk
- No token needed by users for transactions
- Predictable costs for developers

**How Compute Credits Work:**
1. Chain owner purchases Compute Credits from SKALE Network
2. Credits are attached to the chain
3. All transactions consume from the pool
4. Users don't need to hold or acquire any token

## Estimated CREDIT Requirements

Before deploying, ensure your wallet (or chain) has enough CREDIT:

| Contract Type | Estimated CREDIT | Testnet | Mainnet |
|---|---|---|---|
| Basic ERC-20 | ~0.05 CREDIT | Free faucet | Purchase credits |
| ERC-721 (no RNG) | ~0.10 CREDIT | Free faucet | Purchase credits |
| ERC-721 + RNG | ~0.16 CREDIT | Free faucet | Purchase credits |
| ERC-1155 | ~0.12 CREDIT | Free faucet | Purchase credits |
| Complex dApp | ~0.20+ CREDIT | Free faucet | Purchase credits |

## Checking Your Balance

### Using OWS (Recommended)

```bash
# Check wallet balance on testnet
ows fund balance --wallet "my-wallet" --chain skale-base-sepolia

# Check wallet balance on mainnet
ows fund balance --wallet "my-wallet" --chain skale-base

# Get wallet address for funding
ows wallet export --wallet "my-wallet"
```

### Manual Balance Check

```bash
# Using cast
cast balance <YOUR_ADDRESS> --rpc-url https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha
```

## Funding Your Wallet

### Testnet (Free)

**SKALE Base Sepolia Faucet:**
- URL: `https://faucet.skale.space/`
- Network: SKALE Base Sepolia
- Amount: Free CREDIT for testing

**Steps:**
1. Visit the faucet
2. Select "SKALE Base Sepolia"
3. Enter your wallet address
4. Complete captcha if required
5. Receive free CREDIT

### Mainnet (Paid)

**SKALE Base Credits Portal:**
- URL: `https://base.skalenodes.com/credits`
- Purchase Compute Credits for your chain

**Important:** For mainnet deployments, ensure your chain has sufficient Compute Credits before deploying.

## Chain-Specific Resources

| Chain | Faucet / Credits | Explorer | RPC |
|-------|------------------|----------|-----|
| **SKALE Base Sepolia** | `https://faucet.skale.space/` | `https://base-sepolia-testnet-explorer.skalenodes.com/` | `https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha` |
| **SKALE Base** | `https://base.skalenodes.com/credits` | `https://skale-base-explorer.skalenodes.com/` | `https://skale-base.skalenodes.com/v1/base` |

## Important Notes

### CREDIT vs SKALE Token

**Important:** SKALE Base uses **Compute Credits (CREDIT)**, not SKALE tokens (SKL) for gas.

| What You Need | Where to Get It |
|---------------|-----------------|
| Testnet CREDIT | https://faucet.skale.space/ |
| Mainnet CREDIT | https://base.skalenodes.com/credits |

**Common mistake:** Trying to use SKALE token (SKL) to pay for gas on SKALE Base. This won't work — SKALE Base uses prepaid Compute Credits that the chain owner purchases.

### Always Test First

**Always test on testnet first** with free faucet CREDIT before deploying to mainnet. This ensures:
- Your contract works correctly
- You have enough CREDIT for deployment
- You understand the gas costs

### Balance Before Deployment

Before deploying, always check your balance:

```bash
# Using OWS
ows fund balance --wallet "my-wallet" --chain skale-base-sepolia

# If balance is too low, fund from faucet:
# Testnet: https://faucet.skale.space/
# Mainnet: https://base.skalenodes.com/credits
```

## For Most Use Cases

SKALE Base with Compute Credits provides the best user experience since users don't need to acquire any token.






