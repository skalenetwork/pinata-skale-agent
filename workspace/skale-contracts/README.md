# SKALE Contracts Project

Foundry-based smart contract development and deployment for SKALE Base.

## Clone

```bash
git clone https://agents.pinata.cloud/v0/agents/xywpkfq0/git skale-agent-xywpkfq0
cd skale-agent-xywpkfq0/skale-contracts
```

No special flags needed — all files are included.

## Setup

### 1. Get Private Key from OWS Wallet

```bash
ows wallet export --wallet "skale-default"
```

Copy the output and add to `.env`:

```bash
cp .env.example .env
# Edit .env and paste PRIVATE_KEY
```

### 2. Verify Wallet Funding

Check CREDIT balance on SKALE Base:

```bash
ows fund balance --wallet "skale-default" --chain skale-base
```

If low on testnet, get free CREDIT:
- **Testnet:** https://faucet.skale.space/
- **Mainnet:** https://base.skalenodes.com/credits

### 3. Install Dependencies

```bash
forge install
```

This fetches the required libraries (forge-std, OpenZeppelin contracts, etc.).

### 4. Build Contracts

```bash
forge build
```

## Deployment

### Deploy to Testnet (SKALE Base Sepolia)

```bash
export PRIVATE_KEY=$(ows wallet export --wallet "skale-default")

forge script script/Deploy.s.sol \
  --rpc-url skale_base_sepolia \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast
```

### Deploy to Mainnet (SKALE Base)

```bash
export PRIVATE_KEY=$(ows wallet export --wallet "skale-default")

forge script script/Deploy.s.sol \
  --rpc-url skale_base \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast
```

### Clean Up After Deployment

**Security:** Always unset the private key:

```bash
unset PRIVATE_KEY
```

## Configuration

- **Solidity Version:** 0.8.24 (standard contracts)
- **EVM Version:** istanbul (SKALE requirement)
- **Transaction Type:** Legacy only (SKALE doesn't support EIP-1559)
- **RPC Endpoints:** Configured in `foundry.toml`

## Important Notes

⚠️ **DO NOT commit `.env` to version control** — it contains your private key!

✅ **Always test on testnet first** before deploying to mainnet

✅ **Use `--legacy` flag** — SKALE requires legacy transactions

✅ **Monitor CREDIT balance** — Transactions require available credits

## Useful Commands

```bash
# Build contracts
forge build

# Run tests
forge test

# Check gas usage
forge test --gas-report

# Check balance
cast balance <ADDRESS> --rpc-url skale_base_sepolia

# Check nonce
cast nonce <ADDRESS> --rpc-url skale_base_sepolia

# View transaction
cast receipt <TX_HASH> --rpc-url skale_base_sepolia
```

## Resources

- [SKALE Deploy Skill](~/clawd/skills/SKALE-Deploy/SKILL.md)
- [OWS Wallet Skill](~/clawd/skills/ows/SKILL.md)
- [SKALE Base Docs](https://docs.skale.space/base/)
- [Foundry Book](https://book.getfoundry.sh/)

## Wallet & OWS

- **Default Wallet:** `skale-default` (pre-configured)
- **EVM Address:** `0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29`
- **Manage wallets:** `ows wallet list`
- **Export address:** `ows wallet export --wallet "skale-default"`
