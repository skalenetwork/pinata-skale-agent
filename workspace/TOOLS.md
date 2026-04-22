# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

---

## OWS Wallet Configuration

### Default Wallet (PRIMARY SIGNING WALLET)
- **Wallet Name:** `skale-default`
- **Wallet ID:** `a8c407fc-84f9-4602-ab37-58e9e62dffce`
- **Status:** ✅ Active — **USE FOR ALL BLOCKCHAIN TRANSACTIONS BY DEFAULT**
- **Rule:** If asked to sign/send a blockchain tx, always use this wallet unless you explicitly say otherwise

**Supported Addresses:**
- EVM (Ethereum, Polygon, Base, etc.): `0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29`
- Solana: `FGUzkKTHjLjbdnbHkkVegbgbmkHFH1Yar8Q1cq4aY1MP`
- Bitcoin: `bc1qclvv5n99saugt7slwkcwk6eam3n4992uyp4avm`
- Cosmos: `cosmos1u2fwe0ms2lre47rmvahrpkrwn8dpdxksuw5g5x`
- Tron: `TXa2gSsG8HPiCPY94nmEhnKbYi6GU6u6SE`
- TON: `UQCGppzv6vO8Gfbb8v9KhmQr4o7Oj_94TQdz_AF9if7HxmOO`
- Filecoin: `f13423s2sy6pnmu3fphzlbeyklvltpxiarkjlurxy`
- Sui: `0xbed50548e3a54d1ac53d42b5c076e7446767b989ea668760881dbef1256582dc`
- XRPL: `rEDJzseG5PfQ3hD2DmTZf3YxvRwiNT95pm`
- Nano: `nano_3izrg7choha7u9ub9cef9be8okcio7q35fhfpku6uinw3gwysxubrdxckx5s`

**⚠️ BACKUP:** Mnemonic phrase (24 words) was displayed at creation. Store securely offline. Will not be shown again.

---

## SKALE Contracts Foundry Project

### Project Location
- **Folder:** `/home/node/clawd/workspace/skale-contracts`
- **Status:** ✅ Ready for development
- **Configuration:** Solidity 0.8.24, EVM Istanbul, SKALE endpoints configured
- **Wallet:** `skale-default` (OWS)

### ⭐ Contract Verification Pattern

**ALWAYS use this pattern after deployment:**

```bash
forge verify-contract \
 --rpc-url <chain_rpc> \
 <contract_address> \
 src/<contract_name_file>.sol:<contract_name> \
 --verifier blockscout \
 --verifier-url <explorer_base_url>/api
```

**Quick Reference:**
- **Mainnet RPC:** `https://skale-base.skalenodes.com/v1/base`
- **Testnet RPC:** `https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha`
- **Mainnet Explorer API:** `https://skale-base-explorer.skalenodes.com/api`
- **Testnet Explorer API:** `https://base-sepolia-testnet-explorer.skalenodes.com/api`

**Example:**
```bash
forge verify-contract \
 --rpc-url https://skale-base.skalenodes.com/v1/base \
 0x3b3475C987796c2880ecb60c6EcD5dFAf8d81fBf \
 src/FreeMint.sol:FreeMint \
 --verifier blockscout \
 --verifier-url https://skale-base-explorer.skalenodes.com/api
```

### Quick Deploy Workflow
```bash
# 1. Export private key from OWS wallet
export PRIVATE_KEY=$(ows wallet export --wallet "skale-default")

# 2. Deploy to testnet
cd /home/node/clawd/workspace/skale-contracts
forge script script/Deploy.s.sol \
  --rpc-url skale_base_sepolia \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast

# 3. Verify on testnet (copy contract address from broadcast output)
forge verify-contract \
 --rpc-url https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha \
 <CONTRACT_ADDRESS> \
 src/ContractFile.sol:ContractName \
 --verifier blockscout \
 --verifier-url https://base-sepolia-testnet-explorer.skalenodes.com/api

# 4. Clean up
unset PRIVATE_KEY
```

### Project Structure
- `src/` — Smart contract source files
- `script/Deploy.s.sol` — Deployment script template (edit for your contracts)
- `test/` — Test files
- `foundry.toml` — Pre-configured for SKALE Base & Sepolia
- `.env.example` — Environment variable template
- `README.md` — Setup and deployment guide

### Important
- **Always use this project folder** for all contract deployments (unless explicitly told otherwise)
- **Test on Sepolia first** before mainnet deployment
- **ALWAYS verify contracts after deployment** using the Blockscout pattern above
- **Set EVM to Istanbul** (already done in foundry.toml)
- **Use --legacy flag** (required for SKALE)
- **No EIP-1559** (SKALE uses legacy transactions only)

---

## SKALE Bridge Script

### Universal Bridge Execution (OWS Signing)

**Script:** `/home/node/clawd/workspace/bridge-execution-generic.js`

**Quick Start:**
```bash
# Bridge 0.01 USDC from Monad to SKALE Base
node bridge-execution-generic.js --from monad --to skale-base --amount 10000

# Bridge 0.05 USDC from Polygon to SKALE Base
node bridge-execution-generic.js --from polygon --to skale-base --amount 50000

# Bridge with custom recipient
node bridge-execution-generic.js --from base --to skale-base --amount 10000 --recipient 0x...
```

**Supported Chains:**
- Origin: `base`, `polygon`, `optimism`, `arbitrum`, `avalanche`, `monad`
- Destination: `skale-base` (or `base` from skale-base)

**Signing:**
- Uses `skale-default` wallet by default (OWS)
- Private key never exposed (encrypted at rest)
- Configured via: `OWS_WALLET=<name>` (optional env var)

**Environment:**
- `TRAILS_API_KEY` - Required (already in OpenClaw config)
- `OWS_WALLET` - Optional (defaults to `skale-default`)

**What it does:**
1. Checks allowance, approves if needed (OWS signed)
2. Builds & signs transfer TX (OWS signed)
3. Broadcasts both to origin chain RPC
4. Executes Trails API intent
5. Waits for bridge completion (5-10 minutes)

**No private keys. No questions. Always use this script for bridging.**
