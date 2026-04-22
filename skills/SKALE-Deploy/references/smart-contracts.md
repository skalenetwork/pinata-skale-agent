# Smart Contract Deployment

## Before You Deploy

**IMPORTANT:** Always check your gas balance before deploying:

```bash
# Using OWS (recommended)
ows fund balance --wallet "my-wallet" --chain skale-base-sepolia

# Fund from faucet if needed:
# Testnet: https://faucet.skale.space/
# Mainnet: https://base.skalenodes.com/credits
```

**Estimated CREDIT requirements:**
- Basic ERC-20: ~0.05 CREDIT
- ERC-721 (no RNG): ~0.10 CREDIT
- ERC-721 + RNG: ~0.16 CREDIT
- ERC-1155: ~0.12 CREDIT
- Complex dApp: ~0.20+ CREDIT

For detailed funding information, see **`references/gas-and-funding.md`**.

## Compiler Requirements

SKALE chains run on an older EVM version. Configure your compiler accordingly.

### Standard Contracts

For most smart contracts:

```toml
# foundry.toml
solc_version = "0.8.24"
evm_version = "istanbul"
```

**Important:** Do not use Solidity versions above 0.8.24 for standard contracts, as they may include opcodes not supported by SKALE's Istanbul EVM.

### CTX Contracts (Conditional Transactions)

For BITE Protocol CTX contracts, newer Solidity is required:

```toml
# foundry.toml
solc_version = "0.8.27"
evm_version = "istanbul"
```

**CTX Requirements:**
- Solidity >= 0.8.27
- EVM istanbul
- Compatible with BITE Protocol for encrypted transactions

### Hardhat Configuration

```typescript
// hardhat.config.ts
const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.24",
        settings: {
            evmVersion: "istanbul"
        }
    }
};
```

## Foundry Deployment

### Installation

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Initialize project
forge init my-project
cd my-project
```

### Install SKALE RNG Library (Optional)

```bash
forge install dirtroad/skale-rng
```

### Configure Foundry

```toml
# foundry.toml
[profile.default]
solc_version = "0.8.24"
evm_version = "istanbul"

# Use legacy EIP-155 transactions (SKALE doesn't support EIP-1559)
via_ir = false

[rpc_endpoints]
skale_base_testnet = "https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha"
skale_base = "https://skale-base.skalenodes.com/v1/base"
```

### Deployment Script

```solidity
// script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MyContract.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy your contract
        MyContract myContract = new MyContract();

        vm.stopBroadcast();

        console.log("MyContract deployed to:", address(myContract));
    }
}
```

### Deploy Command

```bash
# Step 1: Check your balance
ows fund balance --wallet "my-wallet" --chain skale-base-sepolia

# Step 2: Fund if needed (testnet is free)
# Visit: https://faucet.skale.space/

# Step 3: Set environment variables
export PRIVATE_KEY=0x...
export SKALE_RPC=https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha

# Step 4: Deploy with legacy transactions (required for SKALE)
forge script script/Deploy.s.sol \
  --rpc-url $SKALE_RPC \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast

# Verify contract on explorer (if supported)
forge verify-contract <contract-address> \
  MyContract \
  --chain-id 324705682 \
  --watch
```

### Common Deployment Options

```bash
# Deploy with constructor arguments
forge script script/Deploy.s.sol \
  --rpc-url $SKALE_RPC \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast \
  --constructor-args $(cast abi-encode "constructor(string,uint256)" "MyToken" 1000000)

# Deploy with specific gas price (usually not needed on SKALE)
forge script script/Deploy.s.sol \
  --rpc-url $SKALE_RPC \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast \
  --gas-price 1000000000

# Deploy with priority fee (not used on SKALE, use --legacy instead)
```

## Hardhat Deployment

### Installation

```bash
# Initialize project
npx hardhat init my-project
cd my-project

# Install dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

### Configure Hardhat

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "istanbul"
    }
  },
  networks: {
    skaleBaseSepolia: {
      url: process.env.SKALE_RPC || "https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha",
      chainId: 324705682,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    skaleBase: {
      url: "https://skale-base.skalenodes.com/v1/base",
      chainId: 1187947933,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};

export default config;
```

### Deployment Script

```typescript
// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying MyContract...");

  const MyContract = await ethers.getContractFactory("MyContract");
  const myContract = await MyContract.deploy();

  await myContract.waitForDeployment();
  const address = await myContract.getAddress();

  console.log("MyContract deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Deploy Command

```bash
# Set environment variables
export PRIVATE_KEY=0x...
export SKALE_RPC=https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha

# Deploy to testnet
npx hardhat run scripts/deploy.ts --network skaleBaseSepolia

# Deploy to mainnet
npx hardhat run scripts/deploy.ts --network skaleBase
```

### Deployment with Constructor Arguments

```typescript
// scripts/deploy.ts
async function main() {
  const initialSupply = ethers.parseEther("1000000");
  const tokenName = "MyToken";
  const tokenSymbol = "MTK";

  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy(initialSupply, tokenName, tokenSymbol);

  await token.waitForDeployment();
  console.log("MyToken deployed to:", await token.getAddress());
}
```

### Verify Contract (Hardhat)

```typescript
// hardhat.config.ts - add verification config
const config: HardhatUserConfig = {
  solidity: { version: "0.8.24", settings: { evmVersion: "istanbul" } },
  networks: {
    skaleBaseSepolia: {
      url: process.env.SKALE_RPC,
      chainId: 324705682,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      "skale-base-testnet": "placeholder" // Some explorers don't require API key
    },
    customChains: [
      {
        network: "skale-base-testnet",
        chainId: 324705682,
        urls: {
          apiURL: "https://base-sepolia-testnet-explorer.skalenodes.com/api",
          browserURL: "https://base-sepolia-testnet-explorer.skalenodes.com"
        }
      }
    ]
  }
};
```

```bash
# Verify contract
npx hardhat verify --network skaleBaseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Transaction Settings

### Legacy Transactions

SKALE chains do not support EIP-1559 (Type 2 transactions). Always use legacy transactions:

**Foundry:** Use `--legacy` flag
**Hardhat:** Configure appropriately in network settings

```typescript
// Hardhat - force legacy transactions
networks: {
  skaleBaseSepolia: {
    url: process.env.SKALE_RPC,
    chainId: 324705682,
    accounts: [process.env.PRIVATE_KEY],
    hardfork: "istanbul"
  }
}
```

### Gas Configuration

SKALE has near-zero gas, but you may need to set gas limits for complex operations:

```bash
# Foundry - set specific gas limit
forge script script/Deploy.s.sol \
  --rpc-url $SKALE_RPC \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast \
  --gas-limit 10000000
```

## Troubleshooting

### Common Errors

**"Transaction reverted" or "Opcode not supported"**
- Check Solidity version is ≤ 0.8.24
- Verify EVM version is set to "istanbul"

**"Insufficient funds"**
- Ensure wallet has CREDITS or compute credits
- For SKALE Base, contact chain owner for compute credits

**"Invalid chain ID"**
- Verify chain ID matches your target chain
- Check RPC URL is correct

### Deployment Checklist

Before deploying to mainnet:

- [ ] Tested on testnet
- [ ] Solidity version ≤ 0.8.24 (or ≥ 0.8.27 for CTX)
- [ ] EVM version set to "istanbul"
- [ ] Using legacy transactions (`--legacy` in Foundry)
- [ ] Wallet funded with CREDITS
- [ ] Verified contract works as expected
- [ ] Saved deployment addresses and transaction hashes

## Reference

- [SKALE Foundry Setup](https://docs.skale.space/cookbook/deployment/setup-foundry.md)
- [SKALE Hardhat Setup](https://docs.skale.space/cookbook/deployment/setup-hardhat.md)
