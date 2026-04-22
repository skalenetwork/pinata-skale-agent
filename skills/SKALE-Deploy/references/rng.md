# Random Number Generation (RNG)

## Overview

SKALE provides native on-chain randomness through a precompile contract at address `0x18`. Generate random numbers without third-party providers like Chainlink and without callbacks. The random value derives from the block signature, randomized by which entities active in validation sign the block.

## How It Works

### Native RNG Precompile

- **Address:** `0x18`
- **Mechanism:** SKALE Consensus Protocol - validator collective signatures
- **Availability:** All SKALE chains
- **Cost:** Standard gas cost only
- **Per-block:** Random numbers generated per block

The RNG precompile returns a `bytes32` value based on the collective signature of validators signing the current block. Since different validator sets sign each block, the signature provides natural randomness.

### Critical Behaviors

1. **Same Block Returns Same Value**: Multiple calls in the same block return identical values
2. **Non-SKALE Returns Zero**: Local testing or other chains return `0`
3. **Per-Block Generation**: New random value each block

## Installation

### Foundry

```bash
forge install dirtroad/skale-rng
```

### NPM

```bash
npm install @dirtroad/skale-rng
```

### Remappings

Add to `remappings.txt` or configure in `foundry.toml`:

```
@dirtroad/skale-rng/=lib/skale-rng/contracts/
```

## Usage

### Option 1: SKALE RNG Library (Recommended)

Using the `@dirtroad/skale-rng` library provides a clean interface with helper functions.

#### Basic Random Number

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@dirtroad/skale-rng/contracts/RNG.sol";

contract MyRandomContract is RNG {
    uint256 public lastRandom;

    /**
     * @dev Generate a random number between 0 and 2^256-1
     */
    function generateRandom() external view returns (uint256) {
        return getRandomNumber();
    }

    /**
     * @dev Generate a random number between min and max
     */
    function generateRandomInRange(uint256 min, uint256 max) external view returns (uint256) {
        return getNextRandomRange(min, max);
    }

    function storeRandom() external {
        lastRandom = getRandomNumber();
    }
}
```

#### Coin Flip Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@dirtroad/skale-rng/contracts/RNG.sol";

contract CoinFlipWithLibrary is RNG {
    enum CoinSide { Heads, Tails }

    event CoinFlipped(address indexed player, CoinSide result);

    /**
     * @dev Flip a coin - randomly selects between Heads or Tails
     */
    function flip() public returns (CoinSide) {
        uint256 random = getRandomNumber();
        CoinSide result = (random % 2 == 0) ? CoinSide.Heads : CoinSide.Tails;

        emit CoinFlipped(msg.sender, result);
        return result;
    }
}
```

#### Random Number in Range

```solidity
import "@dirtroad/skale-rng/contracts/RNG.sol";

contract Dice is RNG {
    /**
     * @dev Roll a 6-sided die
     */
    function rollDice() external view returns (uint256) {
        // Returns number between 1 and 6
        return getNextRandomRange(1, 6);
    }

    /**
     * @dev Flip a coin
     */
    function flipCoin() external view returns (bool) {
        // Returns true or false
        return getRandomNumber() % 2 == 0;
    }
}
```

#### Random Selection from Array

```solidity
import "@dirtroad/skale-rng/contracts/RNG.sol";

contract Lottery is RNG {
    address[] public participants;

    function enter() external {
        participants.push(msg.sender);
    }

    /**
     * @dev Draw a random winner from participants
     */
    function drawWinner() external view returns (address) {
        require(participants.length > 0, "No participants");
        uint256 index = getRandomRange(participants.length);
        return participants[index];
    }
}
```

### Option 2: Direct Precompile Call (0x18)

For more control or to avoid library dependencies, call the precompile directly using inline assembly.

#### Basic Precompile Usage

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GetRandomNumber {
    /**
     * @dev Get random bytes32 value from precompile
     */
    function getRandom() public view returns (bytes32) {
        bytes32 randomValue;
        assembly {
            let freemem := mload(0x40)
            let start_addr := add(freemem, 0)
            if iszero(staticcall(gas(), 0x18, 0, 0, start_addr, 32)) {
                invalid()
            }
            randomValue := mload(freemem)
        }
        return randomValue;
    }

    /**
     * @dev Get random uint256 value
     */
    function getRandomUint256() public view returns (uint256) {
        return uint256(getRandom());
    }
}
```

#### Coin Flip with Direct Precompile

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CoinFlip {
    enum CoinSide { Heads, Tails }

    event CoinFlipped(address indexed player, CoinSide result);

    /**
     * @dev Flip a coin using direct precompile call
     */
    function flip() public returns (CoinSide) {
        uint256 random = getRandomNumber();
        CoinSide result = (random % 2 == 0) ? CoinSide.Heads : CoinSide.Tails;

        emit CoinFlipped(msg.sender, result);
        return result;
    }

    /**
     * @dev Get random number from 0x18 precompile
     */
    function getRandomNumber() private view returns (uint256) {
        bytes32 randomBytes;
        assembly {
            let freemem := mload(0x40)
            if iszero(staticcall(gas(), 0x18, 0, 0, freemem, 32)) {
                invalid()
            }
            randomBytes := mload(freemem)
        }
        return uint256(randomBytes);
    }
}
```

## RNG Library Reference

The `@dirtroad/skale-rng` library provides these functions:

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getRandomBytes()` | none | `bytes32` | Raw random bytes from precompile |
| `getRandomNumber()` | none | `uint256` | Random 256-bit number |
| `getNextRandomNumber(uint256 nextIndex)` | `nextIndex` | `uint256` | Random number with index iteration (for multiple values in same block) |
| `getRandomRange(uint256 max)` | `max` | `uint256` | Random number between 0 and max-1 |
| `getNextRandomRange(uint256 nextIndex, uint256 max)` | `nextIndex`, `max` | `uint256` | Random number in range with index iteration |

### Full RNG.sol Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * RNG Endpoint Code for Function getRandomBytes() is taken from
 * the SKALE Network Documentation:
 * https://docs.skale.network/tools/skale-specific/random-number-generator
 */
contract RNG {

    /**
     * @dev Read here for how it works:
     * https://docs.skale.network/tools/skale-specific/random-number-generator
     * @return Random bytes32 from the 0x18 precompile
     */
    function getRandomBytes() public view returns (bytes32 addr) {
        assembly {
            let freemem := mload(0x40)
            let start_addr := add(freemem, 0)
            if iszero(staticcall(gas(), 0x18, 0, 0, start_addr, 32)) {
              invalid()
            }
            addr := mload(freemem)
        }
    }

    /**
     * @return The random number
     */
    function getRandomNumber() public view returns (uint256) {
        return uint256(getRandomBytes());
    }

    /**
     * @param nextIndex The nextIndex to iterate the RNG value by
     * @return The random number with an additional index iteration.
     *         This should be used for multiple values in the same block
     */
    function getNextRandomNumber(uint256 nextIndex) public view returns (uint256) {
        return uint256(keccak256(abi.encode(getRandomNumber() | nextIndex)));
    }

    /**
     * @param nextIndex The nextIndex to iterate the RNG value by
     * @param max The maximum number the random number should be exclusive
     * @return Random number between 0 & max-1
     */
    function getNextRandomRange(uint256 nextIndex, uint256 max) public view returns (uint256) {
        return uint256(keccak256(abi.encode(getRandomNumber() | nextIndex))) % max;
    }

    /**
     * @param max The maximum number the random number should be exclusive
     * @return Random number between 0 & max-1
     */
    function getRandomRange(uint256 max) public view returns (uint256) {
        return getRandomNumber() % max;
    }
}
```

## Important Notes

### Same Block Behavior

**Critical:** Multiple calls to `getRandomNumber()` in the same block return the same value. This is fundamental to how SKALE RNG works—the value derives from the block signature which is constant for a given block.

```solidity
// DON'T DO THIS - both calls return same value
function badRandom() external view returns (uint256, uint256) {
    return (getRandomNumber(), getRandomNumber()); // Identical values!
}

// DO THIS - use different portions of the random value
function goodRandom() external view returns (uint256, uint256) {
    uint256 random = getRandomNumber();
    // Use different 128-bit portions
    return (random & ((1 << 128) - 1), random >> 128);
}

// OR use getNextRandomNumber with index
function indexedRandom() external view returns (uint256, uint256) {
    return (
        getNextRandomNumber(0),
        getNextRandomNumber(1)
    );
}
```

### Testing on Non-SKALE Chains

**Critical:** When testing on local networks or other chains (Ethereum, Polygon, etc.), the RNG precompile at `0x18` does not exist and returns `0` instead of reverting.

```solidity
// Safe random with validation
function safeRandom() external view returns (uint256) {
    uint256 random = getRandomNumber();
    require(random != 0, "Not on SKALE network");
    return random;
}

// Or handle gracefully for testing
function getRandom() internal view returns (uint256) {
    uint256 random = getRandomNumber();
    if (random == 0) {
        // Fallback for testing on non-SKALE chains
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.number)));
    }
    return random;
}
```

**Always verify the random value is non-zero before use** in production contracts.

### Per-Block Randomness

Random numbers are generated per block based on the validator collective signature. Within a single block:
- First call gets the block's random value
- Subsequent calls return identical values
- Use `getNextRandomNumber(index)` or bit manipulation for multiple random values

### Fork Protection

The same random value is used across all chains in the same block position to prevent manipulation. Validators cannot influence outcomes by forking chains since the randomness depends on the collective signature.

## Advanced Patterns

### Multiple Random Values in Same Block

When needing multiple random values in the same transaction:

```solidity
import "@dirtroad/skale-rng/contracts/RNG.sol";

contract MultiRandom is RNG {
    /**
     * @dev Generate multiple random values using index iteration
     */
    function getRandomTriple() external view returns (uint256, uint256, uint256) {
        return (
            getNextRandomNumber(0),
            getNextRandomNumber(1),
            getNextRandomNumber(2)
        );
    }

    /**
     * @dev Alternative: split single random value into parts
     */
    function getRandomTripleSplit() external view returns (uint256, uint256, uint256) {
        uint256 random = getRandomNumber();
        return (
            uint128(random),           // Lower 128 bits
            uint128(random >> 85),      // Middle 85 bits
            uint256(random >> 170)      // Upper 86 bits
        );
    }
}
```

### Batch Random Numbers

```solidity
import "@dirtroad/skale-rng/contracts/RNG.sol";

contract BatchRandom is RNG {
    /**
     * @dev Generate an array of random numbers
     */
    function getRandomBatch(uint256 count)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory results = new uint256[](count);
        uint256 random = getRandomNumber();

        for (uint256 i = 0; i < count; i++) {
            results[i] = uint256(keccak256(abi.encode(random, i)));
        }

        return results;
    }

    /**
     * @dev Generate random numbers in a specified range
     */
    function getRandomRangeBatch(uint256 count, uint256 max)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory results = new uint256[](count);
        uint256 random = getRandomNumber();

        for (uint256 i = 0; i < count; i++) {
            results[i] = uint256(keccak256(abi.encode(random, i))) % max;
        }

        return results;
    }
}
```

### Random Array Shuffle (Fisher-Yates)

```solidity
import "@dirtroad/skale-rng/contracts/RNG.sol";

contract ArrayShuffle is RNG {
    /**
     * @dev Shuffle an array using Fisher-Yates algorithm
     */
    function shuffle(uint256[] memory array)
        external
        pure
        returns (uint256[] memory)
    {
        for (uint256 i = array.length - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encode(array, i))) % (i + 1);
            (array[i], array[j]) = (array[j], array[i]);
        }

        return array;
    }
}
```

### Seeded Randomness

```solidity
import "@dirtroad/skale-rng/contracts/RNG.sol";

contract SeededRandom is RNG {
    uint256 private seed;

    /**
     * @dev Refresh the seed with new random value
     */
    function refreshSeed() external {
        seed = getRandomNumber();
    }

    /**
     * @dev Get next random value from seed sequence
     */
    function nextRandom() external view returns (uint256) {
        return uint256(keccak256(abi.encode(seed, block.timestamp)));
    }
}
```

## Testing

### Foundry Test

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/CoinFlip.sol";

contract CoinFlipTest is Test {
    CoinFlip coinFlip;

    function setUp() public {
        coinFlip = new CoinFlip();
    }

    /**
     * @dev Test requires SKALE chain to pass (RNG returns non-zero)
     */
    function testCoinFlip() public {
        // Set to SKALE Base Sepolia chain ID
        vm.chainId(324705682);
        CoinFlip.CoinSide result = coinFlip.flip();
        // Result should be valid enum value
        assert(uint256(result) <= 1);
    }

    /**
     * @dev Test randomness behavior in same block
     */
    function testSameBlockSameValue() public {
        vm.chainId(324705682);
        uint256 random1 = coinFlip.getRandomNumber();
        uint256 random2 = coinFlip.getRandomNumber();
        assertEq(random1, random2); // Same value in same block
    }

    /**
     * @dev Test with mocked random value for deterministic testing
     */
    function testWithMockRandom() public {
        // For local testing without SKALE, mock the precompile
        vm.mockCall(
            address(0x18),
            abi.encodeWithSelector(bytes4(keccak256("getRandomNumber()"))),
            abi.encode(uint256(12345))
        );

        uint256 random = coinFlip.getRandomNumber();
        assertEq(random, 12345);
    }
}
```

### Testing Strategy

1. **On SKALE Testnet**: Deploy to SKALE Base Sepolia for real RNG behavior
2. **Local with Mocks**: Use `vm.mockCall` for deterministic local testing
3. **Skip Pattern**: Skip RNG-specific tests on non-SKALE chains

```solidity
function testRandom() public {
    // Skip test if not on SKALE
    if (block.chainid != 324705682 && block.chainid != 1187947933) {
        return;
    }
    // Actual test code here
}
```

## Security Considerations

### When to Use SKALE RNG

✅ **Suitable for:**
- Game mechanics (dice, cards, loot boxes)
- Lottery and raffle systems
- Random selection processes
- NFT attribute generation
- Proof of fairness systems
- Low to medium-value applications

❌ **Not suitable for:**
- High-value financial decisions (consider commit-reveal schemes)
- Situations requiring cryptographic randomness guarantees
- Cross-chain randomness (different chains may have different values)
- Applications requiring unpredictable future randomness

### Best Practices

1. **Verify Non-Zero**: Always check random value is non-zero in production
2. **Handle Same-Block**: Be aware multiple calls return same value
3. **Document RNG Usage**: Clearly document randomness use in contract NatSpec
4. **Test Thoroughly**: Test both on SKALE and local networks
5. **Consider Alternatives**: For high-value scenarios, consider commit-reveal or Chainlink VRF

### Common Vulnerabilities

```solidity
// VULNERABLE: Assuming multiple calls give different values
function vulnerable() external {
    uint256[] memory numbers = new uint256[](3);
    numbers[0] = getRandomNumber();
    numbers[1] = getRandomNumber();  // Same as numbers[0]!
    numbers[2] = getRandomNumber();  // Same as numbers[0]!
}

// SECURE: Using index iteration
function secure() external view returns (uint256[] memory) {
    uint256[] memory numbers = new uint256[](3);
    numbers[0] = getNextRandomNumber(0);
    numbers[1] = getNextRandomNumber(1);
    numbers[2] = getNextRandomNumber(2);
    return numbers;
}
```

## Troubleshooting

### Random Value is Zero

**Symptom:** `getRandomNumber()` returns `0`

**Cause:** Contract not deployed on SKALE network

**Solution:**
- Verify connected to SKALE chain (check chain ID)
- Ensure using correct RPC endpoint
- Test on SKALE Base Sepolia testnet first

### All Random Values Identical

**Symptom:** Multiple RNG calls return same value

**Cause:** Calling `getRandomNumber()` multiple times in same transaction

**Solution:**
- Store value once and manipulate as needed
- Use `getNextRandomNumber(index)` for multiple values
- Split single 256-bit value into parts

### Tests Fail on Local Network

**Symptom:** Tests fail with zero random values

**Cause:** RNG precompile returns 0 on non-SKALE networks

**Solution:**
- Use `vm.mockCall` to mock the precompile in tests
- Use `vm.chainId()` to set SKALE chain ID
- Skip RNG tests on local networks

## Resources

- **[SKALE RNG Documentation](https://docs.skale.space/cookbook/native-features/rng-get-random-number.md)** - Official RNG documentation
- **[@dirtroad/skale-rng Library](https://www.npmjs.com/package/@dirtroad/skale-rng)** - NPM package
- **[SKALE Documentation Index](https://docs.skale.space/llms.txt)** - Complete documentation catalog
