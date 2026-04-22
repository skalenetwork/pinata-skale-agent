# Conditional Transactions (CTX) - BITE V2

Conditional Transactions (CTX) enable **smart contract-level encryption** with automatic decryption callbacks. Encrypt data on-chain, store it in contract state, and have the network decrypt it automatically when conditions are met.

## How CTX Works

### The Commit-Reveal Pattern with Automatic Decryption

Traditional commit-reveal requires users to manually submit a reveal transaction after the commit phase. CTX eliminates the reveal phase:

**Traditional Flow:**
1. User commits (sends hash of data)
2. Commit deadline passes
3. **Each user must reveal** (many fail to reveal!)
4. Contract processes revealed data

**CTX Flow:**
1. User commits encrypted data (threshold-encrypted)
2. Contract submits CTX when ready
3. **Network automatically decrypts in next block**
4. Contract's `onDecrypt()` callback receives plaintext

### CTX Transaction Flow

```
[User] --encrypt--> [Contract stores encrypted data]
                          |
                          v
                   [Contract submits CTX]
                          |
                          v
              [BITE precompile (0x...1B)]
                          |
                          v
          [Next block: Threshold decryption]
                          |
                          v
           [Contract.onDecrypt() called with plaintext]
```

## Requirements

### Chain Access

CTX is currently available on **BITE V2 Sandbox 2**:

| Property | Value |
| -------- | ----- |
| RPC URL | `https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox-2` |
| Chain ID | `103698795` (Hex: `0x62e516b`) |
| Explorer | [Blockscout](https://base-sepolia-testnet-explorer.skalenodes.com:10032) |

**Coming soon:** SKALE Base Sepolia and SKALE Base mainnet

### Solidity Configuration

**Important:** Deploy CTX contracts with specific compiler settings:

```toml
# foundry.toml
solc_version = "0.8.27"
evm_version = "istanbul"
```

**Minimum versions:**
* Solidity >=0.8.27
* EVM Istanbul

### Dependencies

Install the BITE Solidity library:

```bash
forge install skalenetwork/bite-solidity
```

## Precompile Addresses

BITE V2 provides precompiled contracts at fixed addresses:

| Precompile | Address | Purpose |
| ---------- | ------- | ------- |
| SUBMIT_CTX | `0x000000000000000000000000000000000000001B` | Submit encrypted data for decryption |
| ENCRYPT_TE | `0x000000000000000000000000000000000000001C` | Threshold encryption (usually frontend) |

## Gas Requirements

CTX execution requires **0.06 ETH** per transaction (for 2.5M gas limit):

```solidity
uint256 public constant CTX_GAS_LIMIT = 2_500_000;
uint256 public constant CTX_GAS_PAYMENT = 0.06 ether;
```

* The gas payment covers the threshold decryption computation
* Payment is transferred to the CTX executor (relayer)
* Gas is paid in the chain's native token (sFUEL/ETH)

## Solidity Contract Implementation

### Basic CTX Contract

```solidity
pragma solidity >=0.8.27;

import { IBiteSupplicant } from "@skalenetwork/bite-solidity/interfaces/IBiteSupplicant.sol";

contract MyEncryptedContract is IBiteSupplicant {
    bytes public message;
    bool public decrypted;

    address public constant SUBMIT_CTX = 0x000000000000000000000000000000000000001B;
    uint256 public constant CTX_GAS_LIMIT = 2_500_000;
    uint256 public constant CTX_GAS_PAYMENT = 0.06 ether;

    event MessageCommitted(bytes encrypted);
    event MessageDecrypted(string plaintext);

    /// @notice Submit encrypted data for automatic decryption
    /// @param encrypted The threshold-encrypted data (from frontend)
    function reveal(bytes calldata encrypted) external payable {
        require(msg.value == CTX_GAS_PAYMENT, "Insufficient CTX gas payment");

        bytes[] memory encryptedArgs = new bytes[](1);
        encryptedArgs[0] = encrypted;

        // Submit CTX - will decrypt in next block
        _submitCTX(encryptedArgs, new bytes[](0));

        emit MessageCommitted(encrypted);
    }

    /// @notice Callback - receives decrypted data automatically
    function onDecrypt(bytes[] calldata decrypted, bytes[] calldata) external override {
        message = decrypted[0];
        decrypted = true;

        emit MessageDecrypted(string(decrypted[0]));
    }

    function _submitCTX(bytes[] memory encryptedArgs, bytes[] memory plaintextArgs) internal {
        (address ctxSender,) = SUBMIT_CTX.delegatecall(
            abi.encodeWithSignature(
                "submitCTX(uint256,bytes[],bytes[])",
                CTX_GAS_LIMIT,
                encryptedArgs,
                plaintextArgs
            )
        );

        payable(ctxSender).transfer(CTX_GAS_PAYMENT);
    }
}
```

### Using the Precompile Library

```solidity
import { Precompiled } from "@skalenetwork/bite-solidity/Precompiled.sol";

function _submitCTX(bytes[] memory encryptedArgs, bytes[] memory plaintextArgs) internal {
    address payable ctxSender = Precompiled.submitCTX(
        SUBMIT_CTX,
        CTX_GAS_LIMIT,
        encryptedArgs,
        plaintextArgs
    );

    payable(ctxSender).transfer(CTX_GAS_PAYMENT);
}
```

### IBiteSupplicant Interface

```solidity
interface IBiteSupplicant {
    /// @notice Callback for automatic decryption
    /// @param decryptedArguments Decrypted values from encryptedArgs
    /// @param plaintextArguments Original values from plaintextArgs (unchanged)
    function onDecrypt(
        bytes[] calldata decryptedArguments,
        bytes[] calldata plaintextArguments
    ) external;
}
```

## Data Flow: Encrypted vs Plaintext Arguments

When submitting a CTX, you provide two arrays:

### Encrypted Arguments (`encryptedArgs`)
Data that will be **threshold-decrypt**ed before the callback:
* Encrypted moves in a game
* Encrypted bids in an auction
* Encrypted votes

### Plaintext Arguments (`plaintextArgs`)
Data passed through **unchanged** to the callback:
* Game ID for callback identification
* Auction ID
* User addresses
* Any metadata needed in `onDecrypt()`

**Example:**

```solidity
// Encrypt two moves, pass game ID as plaintext
bytes[] memory encryptedArgs = new bytes[](2);
encryptedArgs[0] = encryptedMove1;
encryptedArgs[1] = encryptedMove2;

bytes[] memory plaintextArgs = new bytes[](1);
plaintextArgs[0] = abi.encode(gameId);  // Used to identify which game

_submitCTX(encryptedArgs, plaintextArgs);

// In onDecrypt:
function onDecrypt(bytes[] calldata decrypted, bytes[] calldata plaintext) external {
    uint256 gameId = abi.decode(plaintext[0], (uint256));
    bytes move1 = decrypted[0];
    bytes move2 = decrypted[1];
    // ...
}
```

## Frontend Encryption

Install the BITE TypeScript SDK:

```bash
npm install @skalenetwork/bite
```

### Encrypting Data

```typescript
import { BITE } from '@skalenetwork/bite';

const rpcUrl = 'https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox-2';
const bite = new BITE(rpcUrl);

// Encrypt a value (e.g., game move as hex)
async function encryptMove(move: number): Promise<string> {
    const moveHex = move.toString(16).padStart(2, '0');
    const encrypted = await bite.encryptMessage(moveHex);
    return encrypted;
}
```

### Contract Interaction Pattern

```typescript
// 1. Encrypt data
const encryptedMove = await encryptMove(1); // Rock

// 2. Submit to contract with CTX gas payment
const tx = await writeContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'joinGame',
    args: [gameId, encryptedMove],
    value: parseEther('0.06')  // CTX gas payment
});
```

## MTM Mode (Multi-Transaction Mode)

**MTM Mode** allows accounts to send multiple transactions with incremental nonces per block, enabling up to **700 TPS** per account on medium SKALE Chains.

### Why MTM Matters for CTX

Without MTM, if a contract tries to submit multiple transactions in the same block, subsequent transactions revert due to nonce conflicts. MTM allows:

* Multiple CTX submissions in rapid succession
* Batch game moves in a single block
* High-throughput encrypted applications

### MTM Usage Pattern

```javascript
import { providers, Wallet } from "ethers";

const provider = new providers.JsonRpcProvider(RPC_URL);
const signer = new Wallet(PRIVATE_KEY).connect(provider);

// Start from current nonce
let nonce = await provider.getTransactionCount(signer.address);

async function sendWithIncrementalNonce(txData) {
    await signer.sendTransaction({
        ...txData,
        nonce: nonce++  // Manually increment nonce
    });
}

// Send multiple CTX rapidly
for (const game of games) {
    await sendWithIncrementalNonce({
        to: contract.address,
        data: contract.interface.encodeFunctionData("submitCTX", [game.encryptedData])
    });
}
```

### MTM Requirements

* Must be enabled at chain creation (future: toggleable by `MTM_ADMIN_ROLE`)
* Check chain documentation for MTM availability
* See [SKALE Platformer](https://platformer.dirtroad.dev) for working example

## Complete Example: Rock-Paper-Scissors

The classic commit-reveal use case implemented with CTX:

**Game Flow:**
1. Player 1 creates game with encrypted move
2. Player 2 joins with encrypted move + CTX gas payment
3. CTX automatically decrypts both moves
4. Contract determines winner and distributes funds

**Key Features:**
* No reveal phase (automatic decryption)
* No failed reveals (network guarantees decryption)
* Simultaneous decryption (no player sees other's move first)

For complete implementation, see **`examples/conditional-transactions.md`**.

## Testing CTX Contracts

### Foundry Test Setup

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.27;

import "forge-std/Test.sol";
import { RockPaperScissors } from "../src/RockPaperScissors.sol";

contract CTXTest is Test {
    RockPaperScissors rps;

    function setUp() public {
        rps = new RockPaperScissors();
    }

    function testEncryptedReveal() public {
        // Mock encrypted data (in real tests, encrypt with SDK)
        bytes memory encrypted1 = hex"01";  // Placeholder
        bytes memory encrypted2 = hex"02";  // Placeholder

        // Create game
        uint256 gameId = rps.createGame(encrypted1, 100 ether, tokenAddress);

        // Join game with CTX payment
        vm.deal(player2, 0.06 ether);
        vm.prank(player2);
        rps.joinGame{value: 0.06 ether}(gameId, encrypted2);

        // Mock the decryption callback
        vm.prank(address(0x1B));  // SUBMIT_CTX address
        bytes[] memory decrypted = new bytes[](2);
        decrypted[0] = hex"01";  // Rock
        decrypted[1] = hex"02";  // Paper
        rps.onDecrypt(decrypted, new bytes[](0));

        // Assert winner
        (, , , , , , , , address winner, ) = rps.games(gameId);
        assertEq(winner, player2);  // Paper beats Rock
    }
}
```

### Mocking Decryption in Tests

Since Foundry cannot perform real threshold decryption, mock the callback:

```solidity
function testOnDecrypt() public {
    // Setup game state
    uint256 gameId = rps.createGame(encrypted1, 100 ether, tokenAddress);

    // Simulate what the network does after CTX
    bytes[] memory decrypted = new bytes[](2);
    decrypted[0] = hex"01";  // Rock
    decrypted[1] = hex"03";  // Scissors

    bytes[] memory plaintext = new bytes[](1);
    plaintext[0] = abi.encode(gameId);

    // Call callback directly
    rps.onDecrypt(decrypted, plaintext);

    // Verify game resolved correctly
    (, , , , , , , , address winner, ) = rps.games(gameId);
    assertEq(winner, player1);  // Rock beats Scissors
}
```

## Deployment

### Deploy Script

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.27;

import "forge-std/Script.sol";
import { RockPaperScissors } from "../src/RockPaperScissors.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        RockPaperScissors rps = new RockPaperScissors();

        console.log("RockPaperScissors deployed at:", address(rps));
        console.log("Chain ID:", block.chainid);

        vm.stopBroadcast();
    }
}
```

### Deployment Commands

```bash
# Set environment
export RPC_URL="https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox-2"
export PRIVATE_KEY="0x..."

# Deploy
forge script script/Deploy.s.sol:Deploy \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast
```

## Troubleshooting

### Common Errors

**"Invalid CTX gas payment"**
* Ensure `msg.value` equals exactly 0.06 ETH
* Check contract's `CTX_GAS_PAYMENT` constant

**"Invalid encrypted move"**
* Verify frontend encryption uses correct RPC URL
* Check `@skalenetwork/bite` SDK version

**"onDecrypt not called"**
* Verify CTX was submitted successfully
* Check next block for decryption event
* Ensure callback is `external` and implements `IBiteSupplicant`

**"Contract deployment fails"**
* Verify Solidity version >=0.8.27
* Check EVM version is set to `istanbul`
* Use correct compiler settings in `foundry.toml`

### Debugging Tips

1. **Check events:** Emmit events in `onDecrypt()` to track callback execution
2. **Verify gas payment:** Ensure 0.06 ETH is sent with CTX submission
3. **Mock callback:** Test `onDecrypt()` directly in Foundry
4. **Test encryption:** Verify SDK encryption returns non-empty bytes
5. **Chain compatibility:** Ensure using BITE V2 Sandbox 2

## Additional Resources

* **`examples/conditional-transactions.md`** - Complete Rock-Paper-Scissors tutorial
* **[BITE TypeScript SDK](https://github.com/skalenetwork/bite-ts)** - Frontend encryption library
* **[BITE Solidity Library](https://github.com/skalenetwork/bite-solidity)** - Solidity interfaces and utilities
* **[CTX Demo](https://github.com/TheGreatAxios/ctxs)** - Working Rock-Paper-Scissors implementation
* **[SKALE Documentation](https://docs.skale.space/llms.txt)** - Complete documentation index
