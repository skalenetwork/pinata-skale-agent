# MEMORY.md - Long-Term Memory

## RandomMint ERC-721 Contract Deployment (2026-04-22 14:56 UTC)

**Status:** ✅ Successfully deployed to SKALE Base mainnet

### Contract Details
- **Name:** RandomMint
- **Type:** ERC-721 with SKALE Native RNG
- **Address:** `0x80fbb6908244d3f5725f61764bb173f3b7f06660`
- **Network:** SKALE Base Mainnet (Chain ID: 1187947933)
- **Transaction:** `0x8b37cc0c0fc72173491fa052bd1394215a52e3c54ffdbc8e66a8fe3125d09fba`
- **Signer:** `0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29` (skale-default wallet)

### Features
- ✅ Open `mint()` function — anyone can mint 1-10 random NFTs
- ✅ Uses SKALE native RNG (precompile at 0x18)
- ✅ Batch mint function (`batchMint()`) for bulk operations
- ✅ Full ERC-721 standard compliance
- ✅ Multi-Transaction Mode (MTM) support
- ✅ Zero gas fees for users (SKALE model)

### Explorer
- **View Contract:** https://skale-base-explorer.skalenodes.com/address/0x80fbb6908244d3f5725f61764bb173f3b7f06660

### Source Code
- **File:** `/home/node/clawd/workspace/skale-contracts/src/RandomMint.sol`
- **Deployment script:** `/home/node/clawd/workspace/skale-contracts/script/Deploy.s.sol`

### Deployment Method
Used OWS wallet signing with manual RLP transaction encoding, EIP-1559 format, and direct RPC broadcast (deployment-randomint-simple.sh script)

---

## SKALE Contracts Deployment & Verification Workflow

### ⭐ CRITICAL WORKFLOW (Follow Always)

**For every contract deployment on SKALE Base:**

1. **ALWAYS use this Foundry project folder:** `/home/node/clawd/workspace/skale-contracts`
2. **ALWAYS verify after deployment** using the Blockscout verifier pattern below

### Deployment Steps

```bash
# 1. Create your contract in src/ folder
# 2. Edit script/Deploy.s.sol to deploy it
# 3. Export private key from OWS wallet
export PRIVATE_KEY=$(ows wallet export --wallet "skale-default")

# 4. Deploy to testnet FIRST (Chain: SKALE Base Sepolia)
cd /home/node/clawd/workspace/skale-contracts
forge script script/Deploy.s.sol \
  --rpc-url skale_base_sepolia \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast

# 5. After testing, deploy to mainnet (Chain: SKALE Base)
forge script script/Deploy.s.sol \
  --rpc-url skale_base \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast

# 6. Clean up private key
unset PRIVATE_KEY
```

### Verification Pattern (ALWAYS use this)

After deployment, verify the contract using Blockscout verifier:

```bash
forge verify-contract \
 --rpc-url <chain_rpc> \
 <contract_address> \
 src/<contract_name_file>.sol:<contract_name> \
 --verifier blockscout \
 --verifier-url <explorer_base_url>/api
```

**Replace these placeholders:**
- `<chain_rpc>` — RPC URL (see SKALE-Deploy skill references for full list)
  - Mainnet: `https://skale-base.skalenodes.com/v1/base`
  - Testnet: `https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha`
- `<contract_address>` — Deployed contract address (from broadcast output)
- `<contract_name_file>` — File name in src/ (e.g., FreeMint)
- `<contract_name>` — Contract class name (e.g., FreeMint)
- `<explorer_base_url>` — Blockscout URL (see below)

**Explorer URLs by Network:**
- **Mainnet:** `https://skale-base-explorer.skalenodes.com`
- **Testnet:** `https://base-sepolia-testnet-explorer.skalenodes.com`

### Real Example

```bash
# Verify FreeMint contract on mainnet
forge verify-contract \
 --rpc-url https://skale-base.skalenodes.com/v1/base \
 0x3b3475C987796c2880ecb60c6EcD5dFAf8d81fBf \
 src/FreeMint.sol:FreeMint \
 --verifier blockscout \
 --verifier-url https://skale-base-explorer.skalenodes.com/api
```

---

## SKALE Contracts Project Setup & Deployments

### Project Status
**Status:** ✅ Active — Foundry project ready for deployment
**Location:** `/home/node/clawd/workspace/skale-contracts`

---

## FreeMint ERC-721 Contract Deployment (2026-04-22 14:22 UTC)

**Status:** ✅ Successfully deployed to SKALE Base mainnet

### Contract Details
- **Name:** FreeMint
- **Symbol:** FM
- **Address:** `0x3b3475C987796c2880ecb60c6EcD5dFAf8d81fBf`
- **Network:** SKALE Base Mainnet (Chain ID: 1187947933)
- **Transaction:** `0xcf8d8e59862aceaf3336c33fdfb48c6fade016d89506b54b6e61e63378edb656`

### Features
- ✅ Free mint function (`mint(string uri)`) — anyone can mint
- ✅ Batch mint function (`batchMint(string[] uris)`) — mint multiple in one tx
- ✅ Standard ERC-721 transfers, approvals
- ✅ Token URI metadata support
- ✅ No gas fees for users (SKALE model)

### Source Code
- **File:** `/home/node/clawd/workspace/skale-contracts/src/FreeMint.sol`
- **Deployment script:** `/home/node/clawd/workspace/skale-contracts/script/Deploy.s.sol`

### Explorer
- **View on SKALE Base Explorer:** https://skale-base-explorer.skalenodes.com/address/0x3b3475C987796c2880ecb60c6EcD5dFAf8d81fBf

---

## SKALE Contracts Project Setup (2026-04-22 14:19 UTC)

### Project Details
- **Folder:** `/home/node/clawd/workspace/skale-contracts`
- **Tool:** Foundry (forge 1.5.1-stable)
- **Configuration:**
  - Solidity version: 0.8.24
  - EVM version: istanbul (SKALE requirement)
  - RPC endpoints configured for both mainnet & testnet

### Features Ready
- ✅ Deployment script template at `script/Deploy.s.sol`
- ✅ SKALE Base mainnet + Sepolia testnet endpoints in foundry.toml
- ✅ `.env.example` for private key setup
- ✅ Comprehensive README with deployment workflows
- ✅ Default to legacy transactions (required for SKALE)

### Usage Going Forward
- **All new contract projects → use `/home/node/clawd/workspace/skale-contracts`**
- **Unless explicitly told otherwise, always use this folder**
- **Deploy with:** `forge script script/Deploy.s.sol --rpc-url <network> --private-key $PRIVATE_KEY --legacy --broadcast`

---

## OWS Wallet Setup & Usage

**Status:** ✅ Active — `skale-default` wallet created and tested, funded with CREDIT

### Wallet Details
- **Name:** skale-default
- **ID:** a8c407fc-84f9-4602-ab37-58e9e62dffce
- **Created:** 2026-04-22
- **Multi-chain:** Universal HD wallet supporting 10+ chains

### Supported Addresses
- **EVM (Ethereum, Polygon, Base, etc.):** `0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29`
- **Solana:** `FGUzkKTHjLjbdnbHkkVegbgbmkHFH1Yar8Q1cq4aY1MP`
- **Bitcoin:** `bc1qclvv5n99saugt7slwkcwk6eam3n4992uyp4avm`
- **Cosmos, Tron, TON, Filecoin, Sui, XRPL:** All available via `ows wallet list`

---

## Native Gas Transfer Solution (EIP-1559)

**What:** Signed and sent a native ETH transfer on Base network using OWS wallet.

**Transaction Example:**
- From: `0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29` (skale-default)
- To: `0x4981612fE0B86fef303E436977879A83FA31B801`
- Amount: 0.00002 ETH
- Chain: Base (chainId 8453)
- Hash: `0xca8c38ab2c9fff947f44fdc9b1f01f35ac98ca5d47147576eeb4eafcfafc71de`
- Status: ✅ Confirmed

### The Workflow (3-Step Process)

#### Step 1: Build Unsigned EIP-1559 Transaction
Use Python to RLP-encode the unsigned transaction:

```python
python3.11 << 'PYSCRIPT'
def encode_int_strict(val):
    """Encode integer to minimal bytes without leading zeros"""
    if val == 0:
        return b''
    hex_str = hex(val)[2:]
    if len(hex_str) % 2:
        hex_str = '0' + hex_str
    return bytes.fromhex(hex_str)

def rlp_encode(obj):
    """RLP encoder with proper EIP-1559 formatting"""
    if isinstance(obj, bytes):
        if len(obj) == 0:
            return b'\x80'  # Empty bytes encode to 0x80
        elif len(obj) == 1 and obj[0] < 0x80:
            return obj
        elif len(obj) < 56:
            return bytes([0x80 + len(obj)]) + obj
        else:
            length_bytes = encode_int_strict(len(obj))
            return bytes([0xb7 + len(length_bytes)]) + length_bytes + obj
    elif isinstance(obj, list):
        encoded_items = b''.join(rlp_encode(item) for item in obj)
        if len(encoded_items) < 56:
            return bytes([0xc0 + len(encoded_items)]) + encoded_items
        else:
            length_bytes = encode_int_strict(len(encoded_items))
            return bytes([0xf7 + len(length_bytes)]) + length_bytes + encoded_items
    elif isinstance(obj, int):
        encoded = encode_int_strict(obj)
        return rlp_encode(encoded)
    else:
        return rlp_encode(obj.encode() if isinstance(obj, str) else b'')

# Transaction parameters
chainId = 8453
nonce = 0
maxPriorityFeePerGas = 0xf4240
maxFeePerGas = 0x5b8d80
gasLimit = 21000
to_address = bytes.fromhex("4981612fE0B86fef303E436977879A83FA31B801")
value = 0x12309ce54000  # 0.00002 ETH in wei
data = b''
accessList = []

# Build unsigned transaction list
unsigned_tx_list = [
    chainId,
    nonce,
    maxPriorityFeePerGas,
    maxFeePerGas,
    gasLimit,
    to_address,
    value,
    data,
    accessList
]

encoded = rlp_encode(unsigned_tx_list)
unsigned_eip1559_tx = b'\x02' + encoded  # 0x02 = EIP-1559 type
unsigned_tx_hex = unsigned_eip1559_tx.hex()

print("✅ Unsigned transaction (hex, without 0x prefix):")
print(unsigned_tx_hex)
PYSCRIPT
```

**Output:** `02ed82210580830f4240835b8d80825208944981612fe0b86fef303e436977879a83fa31b8018612309ce5400080c0`

#### Step 2: Sign with OWS
```bash
OWS_WALLET=skale-default ows sign tx \
  --chain base \
  --tx "02ed82210580830f4240835b8d80825208944981612fe0b86fef303e436977879a83fa31b8018612309ce5400080c0" \
  --json
```

**Output:**
```json
{
  "recovery_id": 1,
  "signature": "fc76ac9723cc887d9494836a364ae3aa47ac617470351c3f0f09628d6e7ccafb1b5ab21af6905ff26610b17f880f898db977aadd987603890de7964f4491bbd401"
}
```

#### Step 3: Assemble Signed Transaction
Use Python to reconstruct the signed EIP-1559 transaction:

```python
python3.11 << 'PYSCRIPT'
# Extract r, s, recovery_id from signature
signature_hex = "fc76ac9723cc887d9494836a364ae3aa47ac617470351c3f0f09628d6e7ccafb1b5ab21af6905ff26610b17f880f898db977aadd987603890de7964f4491bbd401"
signature_bytes = bytes.fromhex(signature_hex)
recovery_id = signature_bytes[-1]
r = signature_bytes[:32]
s = signature_bytes[32:64]

# Use same RLP encoder as above...
# Build signed transaction list
signed_tx_list = [
    chainId,
    nonce,
    maxPriorityFeePerGas,
    maxFeePerGas,
    gasLimit,
    to_address,
    value,
    data,
    accessList,
    recovery_id,  # yParity
    r,
    s
]

encoded = rlp_encode(signed_tx_list)
signed_eip1559_tx = b'\x02' + encoded
signed_tx_hex = '0x' + signed_eip1559_tx.hex()

print(signed_tx_hex)
PYSCRIPT
```

**Output:** `0x02f87082210580830f4240835b8d80825208944981612fe0b86fef303e436977879a83fa31b8018612309ce5400080c001a0fc76ac9723cc887d9494836a364ae3aa47ac617470351c3f0f09628d6e7ccafba01b5ab21af6905ff26610b17f880f898db977aadd987603890de7964f4491bbd4`

#### Step 4: Broadcast to Chain
```bash
curl -s -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["0x02f87082210580830f4240835b8d80825208944981612fe0b86fef303e436977879a83fa31b8018612309ce5400080c001a0fc76ac9723cc887d9494836a364ae3aa47ac617470351c3f0f09628d6e7ccafba01b5ab21af6905ff26610b17f880f898db977aadd987603890de7964f4491bbd4"],"id":1}'
```

**Output:**
```json
{"jsonrpc":"2.0","result":"0xca8c38ab2c9fff947f44fdc9b1f01f35ac98ca5d47147576eeb4eafcfafc71de","id":1}
```

---

## Why This Approach?

1. **No heavy dependencies** — Just Python stdlib + curl
2. **Full control** — Manual RLP encoding ensures correctness
3. **OWS handles key management** — Private key never exposed, always encrypted
4. **Portable** — Works on any system with Python 3 and curl
5. **Secure** — OWS policy checks pass before signing

---

## Key Learnings

- **EIP-1559 encoding quirks:** Empty values must be `0x80` (not `0x00`), integers must have no leading zeros
- **Recovery ID matters:** Must be 0 or 1 for proper transaction assembly
- **RLP is strict:** One byte wrong breaks the whole transaction
- **OWS CLI is reliable:** Use `--json` flag for structured output, chain names work fine (no CAIP-2 needed)

---

## Policy: Default Wallet & Signing Method for All Blockchain Transactions

⚠️ **IMPORTANT RULES:**

### Rule 1: Always Use OWS Signing
**Never ask for or use raw PRIVATE_KEY. Always use OWS for signing.**
- OWS keeps keys encrypted at rest
- Private key never exposed in environment
- Secure, auditable, repeatable
- Use `ows sign tx` command with unsigned transaction hex

### Rule 2: Always Use skale-default Wallet
**All blockchain transactions should be signed with `skale-default` wallet FIRST, unless explicitly told otherwise.**
- If asked to sign a transaction (any chain, any type), use `skale-default` by default
- If user wants a different wallet, they **must explicitly say so** (e.g., "use a different wallet" or "create a new wallet")
- This applies to:
  - Native gas transfers (ETH, SOL, BTC, etc.)
  - Token transfers (ERC-20, SPL, etc.)
  - Smart contract interactions
  - Multi-chain operations
  - Bridge transactions
  - Anything requiring a signature

### Rule 3: Always Use Generic Bridge Script
**For SKALE bridging, ALWAYS use `/home/node/clawd/workspace/bridge-execution-generic.js`**
- It's chain-agnostic, reusable, and uses OWS signing
- Don't create custom one-off bridge scripts
- Don't question which script to use
- The generic script handles everything: approval, transfer, intent execution, and completion wait

---

## Next Steps for Other Transaction Types

- **Token transfers (ERC-20):** Encode `data` field with transfer calldata (function selector + args)
- **Contract calls:** Similar approach; construct calldata instead of empty `data`
- **Multi-chain:** Change `--chain` parameter and RPC URL; addresses auto-derive per chain
- **Solana transactions:** Use `--chain solana` with different transaction structure
- **Bitcoin transactions:** Use `--chain bitcoin` for UTXO-based signing

---

## Monad → SKALE Base Bridge Execution (2026-04-22 12:15 UTC)

**Status:** ✅ Complete - Transactions broadcast to Monad RPC

### Successful Execution
- **Approval TX:** `0x9a65fff7d2be2ef1985bbd3860044d5d574189a4a9de671b36880f02847bf150`
- **Transfer TX:** `0x6776e5179a881feba33e1187f522c9258de18ec41b5b21d35046c6e32ddca645`
- **Intent ID:** `0x4a58a15aee0df36510bc04741b64f392ed416e973689b29c8afc69adeb53aa01`
- **Amount:** 0.01 USDC
- **Signer:** `0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29` (skale-default)
- **Route:** Monad → Base → SKALE
- **RPC Used:** Infura Monad (https://monad-mainnet.infura.io/v3/...)

### Workflow Used
1. Connected to Monad RPC via Infura
2. Queried nonce & gas prices
3. Built Trails API route with placeholder IMA encoding
4. Got intent quote & committed to Trails
5. Built approval transaction → signed with OWS
6. Built transfer transaction → signed with OWS
7. Reconstructed signed EIP-1559 transactions
8. Broadcast both TXs to Monad

---

## Bridge Workflow - Generic Multi-Chain Execution (OWS Signing)

**⭐ UPDATED 2026-04-22 12:30 UTC - Now uses OWS signing (skale-default by default)**

### Quick Start
```bash
# Bridge 0.01 USDC from Monad to SKALE Base using skale-default wallet
OWS_WALLET=skale-default node /home/node/clawd/workspace/bridge-execution-generic.js \
  --from monad \
  --to skale-base \
  --amount 10000

# Bridge 0.05 USDC from Polygon to SKALE Base
OWS_WALLET=skale-default node /home/node/clawd/workspace/bridge-execution-generic.js \
  --from polygon \
  --to skale-base \
  --amount 50000
```

### Configuration
- **Script:** `/home/node/clawd/workspace/bridge-execution-generic.js`
- **Signing:** OWS (Open Wallet Standard) - no private key exposure
- **Default wallet:** `skale-default` (EVM: `0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29`)
- **Environment:** `OWS_WALLET=<name>` (optional), `TRAILS_API_KEY` (required)

### Supported Bridge Directions
- **Any EVM → SKALE Base:** Base, Polygon, Optimism, Arbitrum, Avalanche, Monad
- **SKALE Base → Base:** (coming soon)

### Technical Details
- Uses `OWS_WALLET` for signing (default: `skale-default`)
- Constructs unsigned EIP-1559 transactions
- Signs via `ows sign tx --chain eip155:<chainId>`
- Reconstructs signed TX with RLP encoding
- Broadcasts via eth_sendRawTransaction
- Executes Trails API intent
- Waits for bridge completion (5-10 minutes)

### Why OWS Signing?
1. ✅ Private key never exposed (encrypted at rest)
2. ✅ Works with skale-default wallet automatically
3. ✅ No PRIVATE_KEY environment variable needed
4. ✅ Secure, auditable, repeatable
5. ✅ No more questioning which signing method to use

---

## Bridge Workflow - Generic Multi-Chain Execution

**Universal bridge script for all supported directions. Created 2026-04-22.**

### Prerequisites
- User's wallet funded with USDC on **origin chain**
- `TRAILS_API_KEY` environment variable already configured on the skill
- Private key derived from OWS wallet

### Quick Execution Path

**Step 1: Export & Derive Private Key**
```bash
# Export mnemonic
ows wallet export --wallet skale-default

# Derive private key (standard Ethereum HD path m/44'/60'/0'/0/0)
node << 'JSCODE'
const bip39 = require("bip39");
const { hdkey } = require("ethereumjs-wallet");

const mnemonic = "YOUR_24_WORD_MNEMONIC";
const seed = bip39.mnemonicToSeedSync(mnemonic);
const hdwallet = hdkey.fromMasterSeed(seed);
const wallet = hdwallet.derivePath("m/44'/60'/0'/0/0").getWallet();
const privateKey = "0x" + wallet.getPrivateKey().toString("hex");

console.log(privateKey);
JSCODE
```

**Step 2: Run Generic Bridge Script**
```bash
cd ~/clawd/skills/SKALE-Bridge

# Base → SKALE Base (0.01 USDC)
PRIVATE_KEY="0x..." node /home/node/clawd/workspace/bridge-execution-generic.js

# Polygon → SKALE Base (0.05 USDC to different recipient)
PRIVATE_KEY="0x..." node /home/node/clawd/workspace/bridge-execution-generic.js \
  --from polygon \
  --to skale-base \
  --amount 50000 \
  --recipient 0x1234567890123456789012345678901234567890

# SKALE Base → Base (0.01 USDC)
PRIVATE_KEY="0x..." node /home/node/clawd/workspace/bridge-execution-generic.js \
  --from skale-base \
  --to base
```

**Supported Parameters:**
- `--from` — Origin chain: `base`, `polygon`, `optimism`, `arbitrum`, `avalanche`, `monad`, `skale-base` (default: `base`)
- `--to` — Destination chain: `skale-base`, `base` (default: `skale-base`)
- `--amount` — USDC amount in 6-decimal format, e.g., `10000` = 0.01 USDC (default: `10000`)
- `--recipient` — Recipient address on destination chain (default: signer address)

**Expected Output:**
- Bridge direction and pattern (Direct IMA, Multi-hop, or IMA Exit)
- Intent ID
- Approval & transfer TX hashes
- Bridge execution confirmation
- Completion status (5-10 minutes for USDC arrival)

### Key Files & Locations

| File | Purpose | Location |
|------|---------|----------|
| **bridge-execution-generic.js** | ⭐ Universal bridge script (all chains & directions) | `/home/node/clawd/workspace/bridge-execution-generic.js` |
| **bridge-execution.js** | Original Base → SKALE script (reference) | `/home/node/clawd/workspace/bridge-execution.js` |
| **SKALE-Bridge skill** | Trails API + IMA contract details | `~/clawd/skills/SKALE-Bridge/` |
| **bridge-to-skale-base.md** | Multi-chain bridge patterns reference | `~/clawd/skills/SKALE-Bridge/references/` |
| **bridge-from-skale-base.md** | SKALE → Base pattern reference | `~/clawd/skills/SKALE-Bridge/references/` |
| **package.json** | Node deps (bip39, viem, trails) | `~/clawd/skills/SKALE-Bridge/` |

### Supported Bridge Directions

**Generic script handles all these automatically:**

1. **Base → SKALE Base** (Direct IMA, fastest)
   ```bash
   PRIVATE_KEY="0x..." node bridge-execution-generic.js
   ```

2. **Polygon → SKALE Base** (Multi-hop via Base)
   ```bash
   PRIVATE_KEY="0x..." node bridge-execution-generic.js --from polygon
   ```

3. **Optimism → SKALE Base** (Multi-hop via Base)
   ```bash
   PRIVATE_KEY="0x..." node bridge-execution-generic.js --from optimism
   ```

4. **Arbitrum → SKALE Base** (Multi-hop via Base)
   ```bash
   PRIVATE_KEY="0x..." node bridge-execution-generic.js --from arbitrum
   ```

5. **Avalanche → SKALE Base** (Multi-hop via Base)
   ```bash
   PRIVATE_KEY="0x..." node bridge-execution-generic.js --from avalanche
   ```

6. **Monad → SKALE Base** (Multi-hop via Base)
   ```bash
   PRIVATE_KEY="0x..." node bridge-execution-generic.js --from monad
   ```

7. **SKALE Base → Base** (IMA Exit + Community Pool)
   ```bash
   PRIVATE_KEY="0x..." node bridge-execution-generic.js --from skale-base --to base
   ```

### Dependencies Required

```json
{
  "@0xtrails/api": "^0.13.2",
  "viem": "^2.47.5",
  "bip39": "^3.0.4",
  "ethereumjs-wallet": "^1.0.2"
}
```

Install via: `cd ~/clawd/skills/SKALE-Bridge && npm install`

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ERC20: transfer amount exceeds balance` | User wallet doesn't have enough USDC on origin chain | Fund wallet first, then retry |
| `Cannot find module '@0xtrails/api'` | Dependencies not installed | Run `npm install` in skill directory |
| `Missing TRAILS_API_KEY` | Env var not set in skill | Verify TRAILS_API_KEY is configured on SKALE-Bridge skill |
| `Invalid private key` | Mnemonic → private key derivation failed | Re-export OWS wallet, verify mnemonic spelling |

### Why This Path?

1. **Minimal hops** — Direct OWS → Viem signing (vs. OWS CLI sign command which is interactive)
2. **Scriptable** — Private key derivation works in any environment
3. **Reliable** — Viem + Trails API handle gas estimation, nonce management, retries
4. **Reproducible** — Same 3 steps for any bridge amount/recipient
