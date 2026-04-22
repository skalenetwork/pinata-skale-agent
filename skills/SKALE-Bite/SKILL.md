---
name: SKALE-Bite
description: This skill should be used when the user asks to "build with BITE Protocol", "encrypt transactions on SKALE", "create MEV-resistant transactions", "implement encrypted transfers", "build confidential voting", "add privacy to dApps", "use BITE SDK", "implement conditional transactions", "build with CTX", "use BITE V2", "encrypt on-chain data", "implement commit-reveal", or mentions BITE Protocol, encrypted mempool, threshold encryption, conditional transactions, CTX, BITE Sandbox on SKALE. Covers Phase 1 encrypted transactions (SKALE Base) and Phase 2 Conditional Transactions (BITE Sandbox).
version: 1.1.0
---

# Build with BITE Protocol

BITE Protocol adds threshold encryption to SKALE while maintaining full EVM compatibility. Encrypt transactions before mempool submission, preventing MEV and protecting sensitive data until after execution.

## Pre-requisites

Check if you have an OWS wallet in use. You can check the ows skill for that
The OWS wallet can then be used to sign any type of txs non behlaf of the user.

Make sure to check for the gas balance on the used chain to perform the tx signing.

If using any other token (ex: USDC) make sure to also check for that token balance before proceeding with the operation.


## What is BITE?

BITE (Blockchain Interoperability and Trustless Execution) extends SKALE with threshold encryption built into consensus:

* **Encrypt** - Wallet encrypts `to` and `data` fields using SKALE's threshold public key
* **Submit** - Encrypted transaction goes to BITE precompile (magic address)
* **Finalize** - Consensus finalizes the encrypted transaction without seeing contents
* **Decrypt** - After finality, validator committee runs threshold decryption
* **Execute** - Transaction executes normally in the EVM

This achieves **commit-then-reveal** at the protocol layer—inclusion happens before anyone can read the transaction.

## Key Properties

### MEV Resistance

By encrypting `to` and `data`, BITE removes the information MEV bots need:

* No front-running (intent hidden until finality)
* No sandwich attacks (bots can't see swaps)
* No censorship (validators can't filter by content)

### Threshold Decryption

No single node can decrypt transactions. The validator committee jointly decrypts using threshold BLS—minimum number of validators must collaborate. Keys rotate each epoch using onchain DKG.

### Zero Trust

Cryptography ensures security without trusting any single party:

* No early decryption (requires threshold of validators)
* No selective decryption (all or nothing per epoch)
* No single point of failure (distributed key generation)

### EVM Compatible

BITE works with existing tooling:

* Metamask, WalletConnect, and other wallets
* Foundry, Hardhat, and other development frameworks
* Ethers.js, Viem, and other web3 libraries
* Existing Solidity contracts (no changes needed for Phase 1)

## Phase Focus: Encrypted Transactions

This skill covers both **Phase 1: Encrypted Transactions** (live on SKALE Base) and **Phase 2: Conditional Transactions** (available on BITE Sandbox).

| Phase | Name | Status |
| ----- | ---- | ------ |
| 1 | Encrypted Transactions | **Live on SKALE Base** |
| 2 | Conditional Transactions (CTX) | **BITE Sandbox** |
| 3 | Threshold Re-encryption | Roadmap |
| 4 | Fully Homomorphic Encryption | Roadmap |

### Phase 2: Conditional Transactions (CTX)

Conditional Transactions enable **smart contract-level encryption** with automatic decryption callbacks. Use CTX for:

* **Commit-reveal patterns** - Sealed-bid auctions, Rock-Paper-Scissors games
* **Privacy-preserving state** - Keep on-chain data encrypted until conditions are met
* **Automatic decryption** - Network decrypts and triggers `onDecrypt()` callback
* **No manual reveal phase** - Eliminates reveal-phase friction and failed reveals

**CTX vs Phase 1:**

| Feature | Phase 1 | Phase 2 (CTX) |
| ------- | ------- | ------------- |
| Encryption Level | Mempool + consensus | Smart contract state |
| Decryption Trigger | After finality | When contract submits CTX |
| Callback | None | `onDecrypt()` in contract |
| Gas Payment | Standard transaction | +0.06 ETH for CTX execution |
| Chain | SKALE Base | BITE Sandbox |

**CTX requires:**
* Access to BITE V2 Sandbox chain
* Solidity >=0.8.27, EVM Istanbul
* Implement `IBiteSupplicant` interface
* 0.06 ETH gas payment per CTX

See **`references/ctx.md`** for complete CTX implementation guide and **`examples/conditional-transactions.md`** for working code examples.

## Supported Chains

**Phase 1 (Encrypted Transactions):**

| Chain | Chain ID | Network | Endpoint |
| ----- | -------- | ------- | -------- |
| SKALE Base | 1187947933 | Mainnet | `https://skale-base.skalenodes.com/v1/base` |
| SKALE Base Sepolia | 324705682 | Testnet | `https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha` |

**Phase 2 (Conditional Transactions):**

| Chain | Chain ID | Network | Endpoint | Features |
| ----- | -------- | ------- | -------- | -------- |
| BITE V2 Sandbox 2 | 103698795 | Testnet | `https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox-2` | CTX, x402 |
| SKALE Base Sepolia | 324705682 | Testnet | `https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha` | CTX (coming soon) |

## Common Use Cases

### Phase 1: Encrypted Mempool Transactions

### Private Token Transfers

Encrypt ERC20 transfers to hide amounts and recipients from mempool observers.

### Confidential Contract Interactions

Keep function calls and parameters private during mempool and consensus.

### Private Voting

Encrypt votes to prevent bribery and coercion—intent remains hidden until finality.

### NFT Mint Privacy

Hide metadata and mint details until reveal, preventing front-running of mint patterns.

### Phase 2: Conditional Transactions (Smart Contract-Level Encryption)

### Sealed-Bid Auctions

Bidders submit encrypted bids that decrypt only after auction closes. Prevents last-minute sniping and bid copying.

### Rock-Paper-Scissors Games

Both players submit encrypted moves. Network decrypts simultaneously after both commit—no front-running, no manual reveal phase.

### Privacy-Preserving Voting

Votes remain encrypted until voting period closes, then decrypt in bulk. Prevents bribery and coercion.

### Commit-Reveal Patterns

Eliminate reveal-phase friction with automatic decryption. No failed reveals, no waiting for all participants to reveal.

## Quick Start

Install SDK:

```bash
npm install @skalenetwork/bite
```

Basic encrypted transaction:

```typescript
import { BITE } from '@skalenetwork/bite';

const bite = new BITE('https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha');

// Encrypt transaction
const encrypted = await bite.encryptTransaction({
    to: "0xContractAddress",
    data: "0xCalldata"
});

// Send with wallet - CRITICAL: set gas manually
const tx = await wallet.sendTransaction({
    ...encrypted,
    gasLimit: 300_000
});
```

## Critical Rules

* **Gas**: Always set manually (default 300k) - `estimateGas` doesn't work with BITE
* **Committee**: 3t+1 nodes, 2t+1 needed to decrypt
* **Rotation**: SDK handles dual encryption automatically during rotation
* **Sender**: Always public (transaction is signed)
* **Value**: Public (not encrypted)
* **Encrypted**: `to` address and `calldata` only

## Data Visibility

| Data | Encrypted |
| ---- | --------- |
| Recipient (to) | ✅ Encrypted |
| Calldata (data) | ✅ Encrypted |
| Sender | ❌ Public |
| Value | ❌ Public |
| Gas used | ❌ Public |

## Additional Resources

### Reference Files

For detailed implementation guidance:

* **`references/sdk.md`** - Complete SDK API reference with all methods
* **`references/ctx.md`** - Conditional Transactions (Phase 2) for advanced use cases

### Example Files

Working examples in `examples/`:

* **`examples/encrypted-transactions.md`** - Complete Phase 1 implementation examples including:
  - Private token transfers
  - Confidential contract interactions
  - Private voting systems
  - NFT mint privacy patterns

* **`examples/conditional-transactions.md`** - Complete Phase 2 CTX implementation including:
  - Rock-Paper-Scissors smart contract
  - React frontend components (CreateGame, JoinGame)
  - Encryption utilities with BITE SDK
  - Deployment and testing guide

### External Documentation

* [BITE Protocol Documentation](https://docs.skale.space/llms.txt)
* [SKALE Base Documentation](https://docs.skale.space/)
* [npm Package](https://www.npmjs.com/package/@skalenetwork/bite)
