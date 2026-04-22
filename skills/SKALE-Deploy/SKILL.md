---
name: SKALE-Deploy
description: This skill should be used when the user asks to "deploy to SKALE", "deploy contracts on SKALE", "choose a SKALE chain", "configure Foundry for SKALE", "get CREDITS", "build an AI agent on SKALE", "use ERC-8004", "register an agent", "enable MTM mode", "use multi-transaction mode", "batch transactions on SKALE", "deploy with OWS wallet", "use OWS for SKALE deployment", or mentions SKALE deployment, chain selection, gas models, smart contract deployment, ERC-8004 AI agents, high-performance dApps with MTM, or OWS wallet integration on SKALE Network.
version: 1.2.0
---

# Deploy to SKALE

Deploy smart contracts, build AI agents, and create high-performance dApps on SKALE Network with zero gas fees for end users.

## What is SKALE Deploy?

SKALE Deploy enables developers to build and deploy decentralized applications on SKALE Network with unique advantages:

* **Zero Gas Fees** — End users pay no transaction fees (chain owner uses Compute Credits)
* **High Performance** — Up to 700 TPS with Multi-Transaction Mode (MTM)
* **EVM Compatible** — Full Solidity support with Istanbul EVM
* **AI Agent Ready** — Native support for ERC-8004 autonomous agent trust layer
* **Built-in Randomness** — On-chain RNG precompile at 0x18, no third-party dependencies
* **Privacy Features** — BITE Protocol for encrypted mempool transactions

## Key Properties

### Zero Gas Model

SKALE uses Compute Credits instead of gas fees:

* **Prepaid Credits** — Chain owner purchases Compute Credits upfront
* **User Experience** — No gas fees for end users
* **Predictable Costs** — Fixed per-transaction cost for chain owners
* **No Stalling** — Transactions always process when credits are available

### High Throughput with MTM

Multi-Transaction Mode removes the one-transaction-per-block-per-account limitation:

* **700 TPS** — Medium chains support hundreds of transactions per block
* **Batch Operations** — Mint 1000 NFTs, process bulk payments, handle game state updates
* **Manual Nonces** — Simple nonce tracking enables parallel execution
* **No Rework** — Works with existing contracts, no code changes needed

### Native Randomness

SKALE provides on-chain random numbers through precompile `0x18`:

* **No Callbacks** — Synchronous randomness in single transaction
* **No Fees** — No gas for third-party oracle services
* **Validator-Based** — Randomness derives from block signer signatures
* **Per-Block** — Same value within block, new value each block

### AI Agent Infrastructure

ERC-8004 provides on-chain identity and reputation for autonomous agents:

* **Identity Registry** — Agent registration and ownership
* **Reputation Registry** — Track agent credibility over time
* **Discovery** — Find agents by capability across organizations
* **Trustless A2A** — Agent-to-Agent interactions without pre-established trust

## Supported Chains

| Chain | Chain ID | Network | Endpoint | Features |
| ----- | -------- | ------- | -------- | -------- |
| **SKALE Base** | 1187947933 | Mainnet | `https://skale-base.skalenodes.com/v1/base` | MTM, BITE Phase 1, ERC-8004 |
| **SKALE Base Sepolia** | 324705682 | Testnet | `https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha` | MTM, BITE Phase 1, ERC-8004 |

**Recommendation:** Use SKALE Base for all new projects (best UX, full feature support).

For detailed chain comparison and configuration, see **`references/chain-selection.md`**.

## Common Use Cases

### High-Performance dApps

Build applications requiring high transaction throughput:

* **Gaming Platforms** — Real-time multiplayer state updates
* **NFT Marketplaces** — Bulk minting, batch royalty payments
* **DeFi Protocols** — High-frequency trading, liquidation handling
* **Social Apps** — Batch notifications, follows, content posts

### AI Agent Applications

Deploy autonomous agents with on-chain identity:

* **Agent Discovery** — Find agents by capability
* **Reputation Tracking** — Build trust over time
* **Trustless Interactions** — A2A transactions without intermediaries
* **Cross-Chain Operations** — Agents work across organizational boundaries

### Privacy-Preserving Applications

Add encryption to transaction flows:

* **Private Voting** — Encrypt votes until finality
* **Confidential Transfers** — Hide amounts and recipients
* **MEV Resistance** — Prevent front-running and sandwich attacks
* **Sealed-Bid Auctions** — Commit-reveal without reveal phase friction

## Quick Start

### Prerequisites

Before deploying, ensure you have:

Check if you have an OWS wallet in use. You can check the ows skill for that


* **Wallet with funds** — OWS wallet (recommended) with CREDIT on SKALE Base
* **Development tool** — Foundry or Hardhat installed
* **Chain access** — RPC endpoint configured

**Recommended Wallet: OWS**

OWS (Open Wallet Standard) is the recommended wallet for SKALE deployments:

* **Secure Key Management** — AES-256-GCM encryption, keys never exposed
* **Multi-Chain Support** — Single wallet for EVM, Solana, and more
* **Offline-First** — Local-first design, no external dependencies
* **Agent-Ready** — Built-in API key system for autonomous agent deployments

**For wallet setup:**
```bash
# Using OWS (recommended for development)
ows wallet create --wallet "my-skale-wallet"
ows wallet export --wallet "my-skale-wallet"  # Get private key

# Check wallet balance
ows fund balance --wallet "my-skale-wallet" --chain skale-base
```

See **"Deploy with OWS"** section below for complete deployment workflow.

### Quick Deploy with OWS (End-to-End)

Complete example from wallet creation to deployment:

```bash
# Step 1: Create OWS wallet
ows wallet create --wallet "my-nft-project"

# Step 2: Get testnet CREDIT (free)
# Visit: https://faucet.skale.space/
# Select: SKALE Base Sepolia
# Enter your wallet address from: ows wallet export --wallet "my-nft-project"

# Step 3: Initialize Foundry project
forge init my-nft-project
cd my-nft-project

# Step 4: Configure for SKALE
# Update foundry.toml with:
#   solc_version = "0.8.24"
#   evm_version = "istanbul"

# Step 5: Deploy to testnet
export PRIVATE_KEY=$(ows wallet export --wallet "my-nft-project")
export SKALE_RPC="https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha"

forge script script/Deploy.s.sol \
  --rpc-url $SKALE_RPC \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast

# Done! Your contract is live on SKALE Base Sepolia
```

### Compute Credit Requirements

Before deploying, ensure your wallet has enough CREDIT:

| Contract Type | Estimated CREDIT | Testnet | Mainnet |
|---|---|---|---|
| Basic ERC-20 | ~0.05 CREDIT | Free faucet | Purchase credits |
| ERC-721 (no RNG) | ~0.10 CREDIT | Free faucet | Purchase credits |
| ERC-721 + RNG | ~0.16 CREDIT | Free faucet | Purchase credits |
| ERC-1155 | ~0.12 CREDIT | Free faucet | Purchase credits |
| Complex dApp | ~0.20+ CREDIT | Free faucet | Purchase credits |

**Checking Your Balance:**
```bash
# Using OWS
ows fund balance --wallet "my-wallet" --chain skale-base-sepolia

# If balance is too low, fund from faucet:
# Testnet: https://faucet.skale.space/
# Mainnet: https://base.skalenodes.com/credits
```

**Always test on testnet first** with free faucet CREDIT before deploying to mainnet.

### Deployment Steps

**1. Configure Foundry for SKALE**

```bash
# Initialize project
forge init my-project
cd my-project

# Install SKALE RNG library (optional)
forge install dirtroad/skale-rng
```

**`foundry.toml` configuration:**
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.24"
evm_version = "istanbul"

[rpc_endpoints]
skale_base = "${SKALE_RPC}"
```

**2. Create deployment script**

`script/Deploy.s.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MyContract.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        MyContract contract = new MyContract();
        console.log("Contract deployed:", address(contract));

        vm.stopBroadcast();
    }
}
```

**3. Deploy to SKALE Base**

```bash
# Set environment variables
export SKALE_RPC="https://skale-base.skalenodes.com/v1/base"
export PRIVATE_KEY="0x..."  # Or use OWS wallet export

# Deploy with legacy transactions (REQUIRED for SKALE)
forge script script/Deploy.s.sol \
  --rpc-url $SKALE_RPC \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast
```

**4. Verify deployment**

```bash
# Check contract on explorer
echo "https://skale-base-explorer.skalenodes.com/address/<CONTRACT_ADDRESS>"
```

**5. Verify contract on Blockscout**

After deployment, verify your contract source code on Blockscout explorer:

```bash
# Foundry verification
forge verify-contract <CONTRACT_ADDRESS> \
  src/MyContract.sol:MyContract \
  --chain-id 324705682 \
  --watch

# With constructor arguments
forge verify-contract <CONTRACT_ADDRESS> \
  src/MyContract.sol:MyContract \
  --constructor-args $(cast abi-encode "constructor(string)" "MyToken") \
  --chain-id 324705682 \
  --watch
```

For Hardhat verification, see **`references/smart-contracts.md`**.

## Critical Rules

* **Legacy Transactions Only** — SKALE does not support EIP-1559, always use `--legacy`
* **Solidity Version** — Use ≤0.8.24 for standard contracts, ≥0.8.27 for BITE CTX
* **EVM Version** — Always set to "istanbul"
* **Gas Limit** — Set manually (estimateGas may not work correctly)
* **Compute Credits** — Chain must have credits for transactions to process
* **Testnet First** — Always deploy to SKALE Base Sepolia before mainnet

## Common Pitfalls

### CREDIT vs SKALE Token Confusion

SKALE Base uses **Compute Credits (CREDIT)**, not SKALE tokens:

| What You Need | Where to Get It |
|---------------|-----------------|
| Testnet CREDIT | https://faucet.skale.space/ |
| Mainnet CREDIT | https://base.skalenodes.com/credits |

**Common mistake:** Trying to use SKALE token (SKL) to pay for gas on SKALE Base. This won't work — SKALE Base uses prepaid Compute Credits that the chain owner purchases.

### Missing --legacy Flag

SKALE does not support EIP-1559 transactions. Always use the `--legacy` flag:

```bash
# Wrong (will fail)
forge script script/Deploy.s.sol --rpc-url $SKALE_RPC --broadcast

# Correct
forge script script/Deploy.s.sol --rpc-url $SKALE_RPC --legacy --broadcast
```

### Gas Estimation Issues

SKALE's gas estimation may not work correctly in some scenarios:

**Solution:** Set gas limits manually for complex operations:

```bash
forge script script/Deploy.s.sol \
  --rpc-url $SKALE_RPC \
  --legacy \
  --broadcast \
  --gas-limit 10000000
```

### Import Path Problems

When using SKALE RNG, use the correct import path:

```solidity
// Correct - use library import (recommended)
import "@dirtroad/skale-rng/contracts/RNG.sol";

// Incorrect - don't use direct precompile unless specifically requested
// import "skale/RNG.sol";  // This won't work
```

If you need direct precompile access (rare), use inline assembly:

```solidity
function getRandomNumber() internal view returns (uint256) {
    uint256 result;
    assembly {
        let freemem := mload(0x40)
        mstore(freemem, 0)
        let success := staticcall(gas(), 0x18, freemem, 0x20, freemem, 0x20)
        result := mload(freemem)
    }
    return result;
}
```

### Wrong Solidity Version

Using Solidity > 0.8.24 (for standard contracts) will cause deployment failures:

```toml
# Wrong
solc_version = "0.8.25"  # Has PUSH0 opcode not supported on SKALE

# Correct (standard contracts)
solc_version = "0.8.24"

# Correct (BITE CTX contracts only)
solc_version = "0.8.27"
```

## Chain Selection

| Use Case | Recommended Chain | Chain ID |
|----------|-------------------|----------|
| New projects (best UX) | SKALE Base | 1187947933 |
| Development & Testing | SKALE Base Sepolia | 324705682 |

**Why SKALE Base?**
* Zero gas fees for end users
* Full feature support (MTM, BITE, ERC-8004)
* Best-in-class developer experience

For detailed chain comparison, RPC URLs, and configuration, see **`references/chain-selection.md`**.

## Smart Contract Deployment

### Compiler Requirements

SKALE chains run on Istanbul EVM with specific Solidity requirements:

```toml
# Standard contracts
solc_version = "0.8.24"
evm_version = "istanbul"

# CTX contracts (BITE Protocol Phase 2)
solc_version = "0.8.27"
evm_version = "istanbul"
```

**Important:** Do not use Solidity versions above 0.8.24 for standard contracts.

### Foundry Deployment

```bash
# Install SKALE RNG library (optional)
forge install dirtroad/skale-rng

# Deploy with legacy transactions (required for SKALE)
forge script script/Deploy.s.sol \
  --rpc-url $SKALE_RPC \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast
```

### Hardhat Deployment

```typescript
// hardhat.config.ts
const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.24",
        settings: { evmVersion: "istanbul" }
    },
    networks: {
        skaleBaseSepolia: {
            url: process.env.SKALE_RPC,
            chainId: 324705682,
            accounts: [process.env.PRIVATE_KEY]
        }
    }
};
```

```bash
npx hardhat run scripts/deploy.ts --network skaleBaseSepolia
```

For complete deployment guides, tool setup, and troubleshooting, see **`references/smart-contracts.md`**.

## Gas Model and Funding

SKALE Base uses **Compute Credits** instead of traditional gas fees:

| Model | User Pays | Chain Owner Pays |
|-------|-----------|------------------|
| **Compute Credits** | ❌ No | ✅ Yes |

### Obtaining Compute Credits

* **Testnet:** Free via faucet — `https://faucet.skale.space/`
* **Mainnet:** Purchase through SKALE dashboard or contact chain operator

For detailed information on obtaining and configuring gas, see **`references/gas-and-funding.md`**.

## Random Number Generation

SKALE provides native on-chain randomness through a precompile at `0x18`. Generate random numbers without third-party providers like Chainlink and without callbacks.

### Quick Start (Recommended Approach)

Install the RNG library:

```bash
forge install dirtroad/skale-rng
# or
npm install @dirtroad/skale-rng
```

**Important:** Always use the library import path by default:

```solidity
// Correct - use library import (recommended)
import "@dirtroad/skale-rng/contracts/RNG.sol";

contract MyContract is RNG {
    function random() external view returns (uint256) {
        return getRandomNumber();
    }

    function randomRange(uint256 max) external view returns (uint256) {
        return getRandomRange(max);  // Returns 0 to max-1
    }

    function coinFlip() external returns (string memory) {
        return getRandomNumber() % 2 == 0 ? "Heads" : "Tails";
    }
}
```

### Critical Behaviors

* **Per-Block:** Random numbers generated per block based on validator signatures
* **Same Block:** Multiple calls in the same block return identical values
* **Non-SKALE:** Returns `0` on other chains or local networks (not SKALE)

### Two Usage Options

**Option 1: Library (Recommended - Default)**
* Use `@dirtroad/skale-rng` for clean interface
* Helper functions for ranges and multiple values
* See **`examples/rng-contracts.sol`** for coin flip, dice, lottery, NFT attributes

**Option 2: Direct Precompile (Advanced Users Only)**
* Call `0x18` directly with inline assembly
* Maximum control, no dependencies
* Only use if you specifically request direct precompile access
* See **`examples/rng-direct-precompile.sol`** for direct implementation

For complete implementation details, patterns, testing guidance, and security considerations, see **`references/rng.md`**.

## Multi-Transaction Mode (MTM)

MTM enables building high-performance dApps on SKALE Base by allowing multiple transactions per block per account—up to **700 TPS** for medium chains.

### What is MTM?

Without MTM, subsequent transactions from the same account within the same block revert. MTM removes this limitation by allowing incremental nonces per block, enabling:

- **Batch Operations**: Mint 1000 NFTs in seconds
- **High-Frequency Trading**: Process hundreds of trades per block
- **Gaming Platforms**: Handle real-time multiplayer state updates
- **Social Apps**: Batch notifications, follows, content posts

### Quick Start (Recommended: Use Generic Executor)

For immediate batch execution without writing code, use the **generic MTM executor script** available in your workspace:

```bash
# Execute any contract function x times
export PRIVATE_KEY=$(ows wallet export --wallet "skale-default")
node ~/clawd/workspace/mtm-executor.js \
  --contract 0x3EA415d43e5ad81E05954193600Cb187B9B96F85 \
  --function mint \
  --count 10
```

**Supports:**
- Any contract function
- Custom arguments with `--args '["arg1","arg2"]'`
- Custom ABI files with `--abi ./abi.json`
- Custom RPC endpoints with `--rpc "..."`

For complete documentation, examples, and advanced patterns, see:
- **Full Guide:** `~/clawd/workspace/MTM_EXECUTOR_README.md`
- **Wrapper Script:** `bash ~/clawd/workspace/run-mtm-mint.sh`

### Manual Implementation (For Custom Use Cases)

For applications requiring custom logic, implement MTM directly with manual nonce management:

```javascript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://skale-base.skalenodes.com/v1/base');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new Contract(ADDRESS, ABI, wallet);

// Initialize nonce to current transaction count
let nonce = await provider.getTransactionCount(wallet.address);

// Send transactions with manual nonce increment
async function write(functionName, args = []) {
    await wallet.sendTransaction({
        to: contract.target,
        data: contract.interface.encodeFunctionData(functionName, args),
        nonce: nonce++
    });
}

// Batch mint NFTs with MTM
async function batchMint(recipients) {
    await Promise.all(recipients.map(r => write('mint', [r])));
}
```

### Requirements

| Requirement | Details |
|-------------|---------|
| Chain | SKALE Base (MTM enabled on both testnet and mainnet) |
| Nonce Management | Manual tracking and incrementation required |
| Transaction Type | Legacy transactions only |
| Throughput | Up to 700 TPS (medium chains) |

For complete implementation patterns, error handling, performance optimization, and working examples, see **`references/mtm-mode.md`** and **`examples/mtm-batch-mint.js`**.

## ERC-8004 for AI Agents

ERC-8004 creates a **trust layer for autonomous AI agents** on SKALE. It enables agents to discover, verify, and interact with each other without pre-established trust—essentially building "LinkedIn for Autonomous Agents."

### What is ERC-8004?

ERC-8004 provides three on-chain registries:

1. **Identity Registry** – Agent identification and ownership
2. **Reputation Registry** – Track agent credibility over time
3. **Verification Registry** – Validate agent capabilities and claims

This enables **trustless Agent-to-Agent (A2A)** interactions—agents can discover and transact with each other across organizational boundaries.

### Deployed Contracts on SKALE

ERC-8004 is officially deployed on SKALE Base at canonical cross-chain addresses:

| Network | Identity Registry | Reputation Registry |
|---------|-------------------|---------------------|
| **SKALE Base Mainnet** | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| **SKALE Base Sepolia** | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |

Explore registered agents via [8004 Scan](https://www.8004scan.io/agents?chain=1187947933).

### Quick Start

```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://mainnet.skale.network/');
const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

// Canonical ERC-8004 addresses on SKALE Base
const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const REPUTATION_REGISTRY = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63';

const identityRegistry = new ethers.Contract(IDENTITY_REGISTRY, IDENTITY_ABI, wallet);
const reputationRegistry = new ethers.Contract(REPUTATION_REGISTRY, REPUTATION_ABI, wallet);

// Register your agent
const agentId = ethers.keccak256(ethers.toUtf8Bytes('my-agent'));
await identityRegistry.registerAgent(agentId, metadataUri);

// Discover other agents by capability
const agents = await identityRegistry.getAgentsByCapability('execute-trade');

// Record interaction to build reputation
await reputationRegistry.recordInteraction(targetAgentId, true, 100);
```

For complete API reference, use cases, security considerations, and working examples, see **`references/erc-8004.md`** and **`examples/erc-8004-agent.ts`**.

## Deploy with OWS

OWS (Open Wallet Standard) is the recommended wallet for SKALE deployments. For complete OWS wallet management capabilities, see the **`ows`** skill.

### Why OWS for SKALE?

* **Secure Key Management** — AES-256-GCM encryption, private keys never exposed to shell
* **Multi-Chain Support** — Single mnemonic derives addresses for EVM, Solana, and more
* **Agent-Ready** — Built-in API key system for autonomous agent deployments
* **Local-First** — No external dependencies, offline-first security

### Quick Start with OWS

**Step 1: Check for existing OWS wallet**
```bash
ows wallet list
```

**Step 2: Create wallet if needed (use `ows` skill for full setup)**
```bash
ows wallet create --wallet "my-skale-project" --show-mnemonic
```

**Step 3: Deploy using OWS private key**
```bash
# Export private key from OWS
export PRIVATE_KEY=$(ows wallet export --wallet "my-skale-project")

# Deploy with Foundry
forge script script/Deploy.s.sol \
  --rpc-url $SKALE_RPC \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast

# Clean up (security best practice)
unset PRIVATE_KEY
```

### Complete Deployment Example

```bash
# 1. Create OWS wallet (if you don't have one)
ows wallet create --wallet "my-nft-project" --show-mnemonic

# 2. Get wallet address and fund with CREDIT
ows wallet export --wallet "my-nft-project"  # Copy address
# Visit: https://faucet.skale.space/ (testnet) or https://base.skalenodes.com/credits (mainnet)

# 3. Deploy to SKALE Base Sepolia
export PRIVATE_KEY=$(ows wallet export --wallet "my-nft-project")
forge script script/Deploy.s.sol \
  --rpc-url "https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha" \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast
```

### Hardhat + OWS Integration

**hardhat.config.ts:**
```typescript
const config: HardhatUserConfig = {
  solidity: { version: "0.8.24", settings: { evmVersion: "istanbul" } },
  networks: {
    skaleBaseSepolia: {
      url: process.env.SKALE_RPC || "https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha",
      chainId: 324705682,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};
```

**Deployment script:**
```bash
# Set environment from OWS
export PRIVATE_KEY=$(ows wallet export --wallet "my-skale-project")

# Deploy with Hardhat
npx hardhat run scripts/deploy.ts --network skaleBaseSepolia
```

### OWS + MTM (Multi-Transaction Mode)

For high-throughput deployments with MTM:

```javascript
// Using OWS-derived private key
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
const provider = new ethers.JsonRpcProvider(process.env.SKALE_RPC);
const signer = wallet.connect(provider);

// Initialize nonce and batch transactions
let nonce = await provider.getTransactionCount(wallet.address);

async function batchWithOWS(functionName, argsList) {
  const contract = new Contract(ADDRESS, ABI, signer);
  const txs = argsList.map((args) =>
    signer.sendTransaction({
      to: contract.target,
      data: contract.interface.encodeFunctionData(functionName, args),
      nonce: nonce++,
      gasLimit: 500000,
      gasPrice: 1000000000
    })
  );
  return Promise.all(txs);
}
```

### Key OWS Commands for SKALE

| Operation | Command |
|-----------|---------|
| Check existing wallets | `ows wallet list` |
| Create new wallet | `ows wallet create --wallet "name" --show-mnemonic` |
| Get address | `ows wallet export --wallet "name"` |
| Check balance | `ows fund balance --wallet "name" --chain skale-base-sepolia` |
| Sign transaction | `ows sign tx --wallet "name" --chain evm --tx "..."` |
| Sign and broadcast | `ows sign send-tx --wallet "name" --chain evm --tx "..." --rpc-url "..."` |

### Important Gotchas

**TTY Requirements:** OWS requires interactive terminal for signing. For CI/CD, export private key instead:
```bash
export PRIVATE_KEY=$(ows wallet export --wallet "my-wallet")
```

**Nonce Management:** Get current nonce before deploying to avoid conflicts:
```bash
CURRENT_NONCE=$(cast nonce $ADDRESS --rpc-url $SKALE_RPC)
forge script script/Deploy.s.sol --nonce $CURRENT_NONCE ...
```

**Security:** Always unset private key after deployment:
```bash
unset PRIVATE_KEY
```

For complete OWS documentation and advanced features (API keys, policies, multi-chain), see the **`ows`** skill.

## Transaction Requirements

- **Use Legacy Transactions:** SKALE does not support EIP-1559
- **Set EVM Version:** Always use "istanbul"
- **Gas Price:** 1-2 gwei is typical

## Deployment Checklist

Before deploying to mainnet:

- [ ] Tested on SKALE Base Sepolia testnet
- [ ] Solidity version ≤ 0.8.24 (or ≥ 0.8.27 for CTX)
- [ ] EVM version set to "istanbul"
- [ ] Using `--legacy` flag (Foundry) or legacy transactions
- [ ] Chain has Compute Credits
- [ ] Verified contract functionality on testnet
- [ ] Saved deployment addresses and transaction hashes

## Additional Resources

### Reference Files

For detailed implementation guidance:

* **`references/chain-selection.md`** — Detailed chain comparison, RPC URLs, when to use each chain
* **`references/smart-contracts.md`** — Complete Foundry/Hardhat setup, deployment scripts, contract restrictions
* **`references/gas-and-funding.md`** — Gas models, faucet locations, compute credits
* **`references/rng.md`** — Random number generation, patterns, testing, security considerations
* **`references/erc-8004.md`** — ERC-8004 AI agent trust layer, registries, API reference, use cases
* **`references/mtm-mode.md`** — Multi-Transaction Mode for high-performance dApps, batch operations, 700 TPS throughput

### Example Files

Working examples in `examples/`:

* **`examples/deployment.md`** — Complete Foundry and Hardhat deployment scripts
* **`examples/rng-contracts.sol`** — Working RNG examples: coin flip, dice, lottery, NFT attributes (library-based)
* **`examples/rng-direct-precompile.sol`** — Direct precompile implementation without library dependencies
* **`examples/erc-8004-agent.ts`** — Complete ERC-8004 agent implementation: registration, discovery, reputation tracking
* **`examples/mtm-batch-mint.js`** — MTM batch NFT minting example with error handling and performance testing
* **`examples/mtm-high-frequency.ts`** — Advanced MTM patterns: high-frequency trading, gaming rewards, bulk operations

### External Documentation

* [SKALE Documentation](https://docs.skale.space/)
* [SKALE Base Documentation](https://docs.skale.space/base/)
* [8004 Scan - Agent Explorer](https://www.8004scan.io/agents?chain=1187947933)
* [SKALE RNG Library (npm)](https://www.npmjs.com/package/@dirtroad/skale-rng)
* [Foundry Documentation](https://book.getfoundry.sh/)

### Network Resources

| Resource | URL |
|----------|-----|
| **Testnet Faucet** | `https://faucet.skale.space/` |
| **Base Testnet Explorer** | `https://base-sepolia-testnet-explorer.skalenodes.com/` |
| **Base Mainnet Explorer** | `https://skale-base-explorer.skalenodes.com/` |
| **RPC Endpoint (Testnet)** | `https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha` |
| **RPC Endpoint (Mainnet)** | `https://skale-base.skalenodes.com/v1/base` |

### Testnet vs Mainnet

| Feature | Testnet | Mainnet |
|---------|---------|---------|
| Chain ID | 324705682 | 1187947933 |
| Purpose | Development | Production |
| Assets | Test tokens | Real assets |

**Always test on testnet before deploying to mainnet.**
