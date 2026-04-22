# BITE V1 Executor - Scalable Encrypted Transaction Script

**Purpose:** Unified, contract-agnostic script for submitting encrypted transactions via BITE V1 on SKALE Base.

**Created:** 2026-04-22

---

## Files

| File | Purpose |
|------|---------|
| **`bite-executor.js`** | Core BITE V1 executor (contract-agnostic, fully scalable) |
| **`bite-freemint-mint.sh`** | Wrapper for FreeMint mint() (quick reference) |
| **`BITE_V1_EXECUTOR_README.md`** | This file |

---

## Quick Start

### Example 1: FreeMint mint() on SKALE Base

```bash
# Via wrapper script (easiest)
bash bite-freemint-mint.sh

# Or directly with bite-executor.js
node bite-executor.js \
  --contract 0x3b3475C987796c2880ecb60c6EcD5dFAf8d81fBf \
  --function mint \
  --chain skale-base
```

### Example 2: RandomMint mint() with arguments on Testnet

```bash
node bite-executor.js \
  --contract 0x80fbb6908244d3f5725f61764bb173f3b7f06660 \
  --function mint \
  --chain skale-base-sepolia \
  --args '[5]'  # Mint 5 random NFTs
```

### Example 3: Custom contract with custom ABI

```bash
node bite-executor.js \
  --contract 0x1234567890123456789012345678901234567890 \
  --function transfer \
  --chain skale-base \
  --args '["0x9999999999999999999999999999999999999999", 1000000000]' \
  --abi ./abi.json
```

---

## Core Script: `bite-executor.js`

**Universal BITE V1 executor** — works with any contract and any function.

### CLI Arguments

```bash
node bite-executor.js [options]
```

| Option | Type | Default | Required | Notes |
|--------|------|---------|----------|-------|
| `--contract` | address | N/A | ✅ Yes | Target contract address (0x...) |
| `--function` | string | N/A | ✅ Yes | Function name to call (e.g., mint, transfer) |
| `--chain` | string | `skale-base` | ❌ No | `skale-base` or `skale-base-sepolia` |
| `--args` | JSON array | `[]` | ❌ No | Function arguments as JSON: `'["arg1", 123]'` |
| `--abi` | file path | N/A | ❌ No | Path to contract ABI JSON file |
| `--gas` | number | `300000` | ❌ No | Gas limit (BITE requires manual estimation) |
| `--wallet` | string | `skale-default` | ❌ No | OWS wallet name for signing |

### Supported Chains

| Chain | Network | Chain ID | RPC |
|-------|---------|----------|-----|
| `skale-base` | Mainnet | 1187947933 | `https://skale-base.skalenodes.com/v1/base` |
| `skale-base-sepolia` | Testnet | 324705682 | `https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha` |

### Environment Variables

| Var | Default | Purpose |
|-----|---------|---------|
| `OWS_WALLET` | `skale-default` | OWS wallet for transaction signing |
| `BITE_RPC` | (from chain config) | Override RPC endpoint |

### Execution Flow

1. **Export wallet address** from OWS
2. **Load or build ABI** (common functions have built-in ABIs)
3. **Encode function call** with provided arguments
4. **Initialize BITE V1** instance
5. **Encrypt transaction** (`to` and `data` fields)
6. **Fetch chain parameters** (nonce, gas price)
7. **Build unsigned EIP-1559 transaction**
8. **Sign with OWS wallet** (via `ows sign tx`)
9. **Assemble signed transaction**
10. **Broadcast to network** via `eth_sendRawTransaction`
11. **Wait for confirmation**

### Built-in Function Support

These functions work without `--abi` flag:

| Function | Inputs | Example |
|----------|--------|---------|
| `mint` | none | `--function mint` |
| `transfer` | address, uint256 | `--function transfer --args '["0x...", 1000000000]'` |
| `approve` | address, uint256 | `--function approve --args '["0x...", 1000000000]'` |

For other functions, provide `--abi`.

### Output Example

```
🔐 BITE V1 Encrypted Transaction Executor
   Chain: SKALE Base Mainnet
   Contract: 0x3b3475C987796c2880ecb60c6EcD5dFAf8d81fBf
   Function: mint
   Wallet: skale-default

📝 Exporting wallet address from OWS...
   Address: 0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29

🔧 Encoding function call...
   Calldata: 0xa0712d68...

🔐 Initializing BITE V1...

🔒 Encrypting transaction with BITE V1...
   ✅ Encryption successful
   To (encrypted): 0x0000000000000000000000000000000000000018
   Data (encrypted): 0x02...

⛓️  Fetching chain parameters...
   Nonce: 42
   Gas Price: 1234567890 wei

📋 Building unsigned transaction...
   Unsigned TX: 02ed...

✍️  Signing with OWS wallet...
   ✅ Signature obtained
   Recovery ID: 1

🔗 Assembling signed transaction...
   Signed TX: 02f8...

📤 Broadcasting to SKALE Base Mainnet...
   ✅ Transaction submitted!
   Hash: 0xabc123...
   Explorer: https://skale-base-explorer.skalenodes.com/tx/0xabc123...

⏳ Waiting for confirmation...
   ✅ Confirmed in block 1234567
   Status: ✅ Success
```

---

## How to Use with Other Contracts

### Pattern 1: Function with No Arguments (like FreeMint mint)

```bash
node bite-executor.js \
  --contract 0x<your-contract> \
  --function mint
```

### Pattern 2: Function with Arguments (like ERC20 transfer)

```bash
node bite-executor.js \
  --contract 0x<your-contract> \
  --function transfer \
  --args '["0x1234567890123456789012345678901234567890", 1000000000]'
```

**Note:** Arguments must be valid JSON. For addresses, use lowercase hex.

### Pattern 3: Custom Function (provide ABI)

```bash
# First, get your contract's ABI and save to contract-abi.json
node bite-executor.js \
  --contract 0x<your-contract> \
  --function myCustomFunction \
  --args '["arg1", 123, true]' \
  --abi ./contract-abi.json
```

### Pattern 4: Custom Gas (if default 300k is insufficient)

```bash
node bite-executor.js \
  --contract 0x<your-contract> \
  --function myFunction \
  --gas 500000
```

### Pattern 5: Testnet (SKALE Base Sepolia)

```bash
node bite-executor.js \
  --contract 0x<your-contract> \
  --function mint \
  --chain skale-base-sepolia
```

### Pattern 6: Different Wallet

```bash
OWS_WALLET=my-other-wallet node bite-executor.js \
  --contract 0x<your-contract> \
  --function mint
```

---

## Creating Function-Specific Wrappers

To create a wrapper for any contract function, follow the FreeMint pattern:

### Step 1: Create a bash wrapper

**File:** `bite-mycontract-myfunction.sh`

```bash
#!/bin/bash

CHAIN="${CHAIN:-skale-base}"
WALLET="${OWS_WALLET:-skale-default}"
MY_CONTRACT="0x1234567890123456789012345678901234567890"

OWS_WALLET="$WALLET" node ./bite-executor.js \
    --contract "$MY_CONTRACT" \
    --function "myFunction" \
    --chain "$CHAIN" \
    --wallet "$WALLET"
```

### Step 2: Make it executable

```bash
chmod +x bite-mycontract-myfunction.sh
```

### Step 3: Use it

```bash
bash bite-mycontract-myfunction.sh
```

---

## Key BITE V1 Concepts

### What Gets Encrypted?

| Data | Status |
|------|--------|
| **`to` address** | ✅ **Encrypted** |
| **`data` (calldata)** | ✅ **Encrypted** |
| `from` (sender) | ❌ Public (visible as signer) |
| `value` | ❌ Public |
| `gas` used | ❌ Public |

### Manual Gas Estimation

⚠️ **CRITICAL:** BITE transactions require **manual gas estimation**. Default is `300000`.

- `estimateGas` RPC calls don't work with encrypted transactions
- If your function is complex or performs many state changes, increase `--gas`
- Monitor transaction results to fine-tune

### Fee Payment

- Transactions use **legacy gas pricing** (not EIP-1559 for SKALE)
- Gas is still public (not encrypted)
- SKALE Base has **zero/near-zero gas costs** for users

---

## Troubleshooting

### `Cannot find module '@skalenetwork/bite'`

Install BITE SDK:
```bash
npm install @skalenetwork/bite
```

### `Failed to export OWS wallet "..."` 

Verify wallet exists and OWS is installed:
```bash
ows wallet list
```

### `Function "..." not found in ABI`

Provide correct function name or custom ABI:
```bash
node bite-executor.js --contract 0x... --function myFunc --abi ./abi.json
```

### Transaction Failed

- Check wallet has sufficient gas balance (CREDIT on SKALE)
- Verify function arguments are correct
- Try testnet first (SKALE Base Sepolia) to debug
- Check gas limit if function is complex

---

## Why This Design?

1. **Single source of truth** — One script, all contracts
2. **Scalable** — Add new contracts by changing CLI args
3. **No duplication** — No separate script per contract
4. **OWS integration** — Secure signing, no private key exposure
5. **CLI-driven** — Easy to script and automate
6. **Wrapper-friendly** — Simple bash wrappers for common operations

---

## Next Steps

- Test `bite-freemint-mint.sh` on testnet first
- Create wrappers for your other contracts
- Integrate into larger automation workflows
- Monitor encryption overhead and gas usage

---

## Questions?

Check the SKALE-Bite skill for complete BITE V1 documentation:
```
~/clawd/skills/SKALE-Bite/SKILL.md
```

