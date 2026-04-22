# Chain Selection

## Overview

SKALE offers multiple chains with different characteristics. Choose based on your project's needs for gas model, Ethereum connectivity, and use case.

## SKALE Base (Recommended for New Projects)

SKALE Base is the latest generation SKALE chain with zero gas fees via Compute Credits.

### Network Details

| Network | Chain ID | RPC | Explorer |
|---------|----------|-----|----------|
| Testnet | 324705682 | `https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha` | `https://base-sepolia-testnet-explorer.skalenodes.com/` |
| Mainnet | 1187947933 | `https://skale-base.skalenodes.com/v1/base` | `https://skale-base-explorer.skalenodes.com/` |

### Characteristics

- **Gas Model**: Compute Credits (prepaid by chain owner)
- **Ethereum Connection**: Standalone chain
- **Use Cases**: General purpose dApps, gaming, social apps
- **Advantage**: True zero gas for end users

### When to Choose SKALE Base

- Building consumer-facing applications where users should pay zero gas
- Don't require direct Ethereum bridge connectivity
- Want the latest SKALE features
- Prefer predictable gas costs via prepaid credits

### Environment Variables

```bash
# SKALE Base Testnet
export SKALE_RPC=https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha
export SKALE_CHAIN_ID=324705682

# SKALE Base Mainnet
export SKALE_RPC=https://skale-base.skalenodes.com/v1/base
export SKALE_CHAIN_ID=1187947933
```

### Foundry Configuration

```toml
# foundry.toml
[rpc_endpoints]
skale_base_testnet = "${SKALE_RPC}"
skale_base = "https://skale-base.skalenodes.com/v1/base"
```

### Hardhat Configuration

```typescript
// hardhat.config.ts
const config: HardhatUserConfig = {
    networks: {
        skaleBaseSepolia: {
            url: process.env.SKALE_RPC || "https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha",
            chainId: 324705682,
            accounts: [process.env.PRIVATE_KEY]
        },
        skaleBase: {
            url: "https://skale-base.skalenodes.com/v1/base",
            chainId: 1187947933,
            accounts: [process.env.PRIVATE_KEY]
        },
    }
};
```

## Testnet vs Mainnet

Always test on SKALE Base Sepolia Testnet before deploying to mainnet:

| Feature | Testnet | Mainnet |
|---------|---------|---------|
| Chain ID | 324705682 | 1187947933 |
| Gas | Free | Free (with funding) |
| Assets | Test tokens | Real assets |
| Purpose | Development | Production |

## Reference

- [SKALE Network Documentation](https://docs.skale.space/)
- [Chain Explorer](https://skale-base-explorer.skalenodes.com/)
