# Quick Start Deploy Guide

Complete end-to-end example for deploying to SKALE Base Sepolia testnet.

## Full Example: Deploy ERC-721 with RNG

### Step 1: Create OWS Wallet

```bash
# Create a new wallet for your project
ows wallet create --wallet "my-nft-project"

# Export the wallet address to get funding
ows wallet export --wallet "my-nft-project"
# Output: 0x1234567890123456789012345678901234567890
```

### Step 2: Get Testnet CREDIT (Free)

1. Visit the SKALE faucet: **https://faucet.skale.space/**
2. Select network: **SKALE Base Sepolia**
3. Enter your wallet address from step 1
4. Complete captcha if required
5. Receive free CREDIT

**Verify your balance:**
```bash
ows fund balance --wallet "my-nft-project" --chain skale-base-sepolia
```

### Step 3: Initialize Foundry Project

```bash
# Create new Foundry project
forge init my-nft-project
cd my-nft-project

# Install SKALE RNG library
forge install dirtroad/skale-rng
```

### Step 4: Configure for SKALE

Update `foundry.toml`:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.24"
evm_version = "istanbul"

[rpc_endpoints]
skale_base_sepolia = "https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha"
skale_base = "https://skale-base.skalenodes.com/v1/base"
```

### Step 5: Create Your Contract

`src/MyNFT.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@dirtroad/skale-rng/contracts/RNG.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyNFT is ERC721, RNG {
    uint256 private _tokenId;

    constructor() ERC721("MyNFT", "MNFT") {}

    function mint() external {
        _tokenId++;
        _mint(msg.sender, _tokenId);
    }

    function randomMint() external {
        _tokenId++;
        uint256 randomId = getRandomRange(10000) + 1;
        _mint(msg.sender, randomId);
    }
}
```

### Step 6: Create Deployment Script

`script/Deploy.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MyNFT.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        MyNFT nft = new MyNFT();
        console.log("MyNFT deployed to:", address(nft));

        vm.stopBroadcast();
    }
}
```

### Step 7: Deploy to Testnet

```bash
# Set environment variables
export PRIVATE_KEY=$(ows wallet export --wallet "my-nft-project")
export SKALE_RPC="https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha"

# Deploy with legacy transactions (required for SKALE)
forge script script/Deploy.s.sol \
  --rpc-url $SKALE_RPC \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast
```

**Expected output:**
```
[⠊] Compiling...
[⠒] Compiling 1 files with 0.8.24
[⠢] Solc 0.8.24 - https://github.com/ethereum/solidity-release-cycle/...
[⠔] Solc 0.8.24 - https://github.com/ethereum/solidity-release-cycle/...
...
Deploy Script
====================================================================
MyNFT deployed to: 0x...
====================================================================

Transaction sent to: 0x...
...
✅ Deployment successful!
```

### Step 8: Verify on Explorer

```bash
# Check your contract on Blockscout
echo "Visit: https://base-sepolia-testnet-explorer.skalenodes.com/address/<CONTRACT_ADDRESS>"
```

### Step 9: Verify Contract Source Code

```bash
# Verify contract on Blockscout
forge verify-contract <CONTRACT_ADDRESS> \
  src/MyNFT.sol:MyNFT \
  --chain-id 324705682 \
  --watch
```

### Step 10: Test Your Contract

```bash
# Mint a token
cast send <CONTRACT_ADDRESS> "mint()" \
  --rpc-url $SKALE_RPC \
  --private-key $PRIVATE_KEY \
  --legacy

# Check token supply
cast call <CONTRACT_ADDRESS> "totalSupply()" \
  --rpc-url $SKALE_RPC
```

## Done! Your contract is live on SKALE Base Sepolia

**Next Steps:**

1. Test your contract functionality thoroughly
2. Deploy to SKALE Base mainnet when ready
3. Purchase Compute Credits for mainnet: https://base.skalenodes.com/credits

## Common Issues

### "Insufficient funds" error
- Ensure you have CREDIT in your wallet
- Check balance: `ows fund balance --wallet "my-nft-project" --chain skale-base-sepolia`
- Fund from faucet: https://faucet.skale.space/

### "Transaction reverted" error
- Verify you're using `--legacy` flag
- Check Solidity version is 0.8.24
- Verify EVM version is "istanbul"

### Contract verification fails
- Ensure source code matches exactly
- Check contract address is correct
- Verify chain ID: 324705682 (testnet), 1187947933 (mainnet)

## Resources

- **Testnet Faucet:** https://faucet.skale.space/
- **Testnet Explorer:** https://base-sepolia-testnet-explorer.skalenodes.com/
- **Mainnet Credits:** https://base.skalenodes.com/credits
- **Mainnet Explorer:** https://skale-base-explorer.skalenodes.com/
