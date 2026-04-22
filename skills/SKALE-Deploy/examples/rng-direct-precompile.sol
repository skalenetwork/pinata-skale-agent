// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * Example: Direct Precompile Usage (No Library Dependencies)
 *
 * These examples demonstrate calling the SKALE RNG precompile at 0x18
 * directly using inline assembly, without relying on external libraries.
 *
 * This approach provides maximum control but requires manual implementation
 * of helper functions.
 */

/**
 * Basic Random Number Generator
 * Calls the 0x18 precompile directly to get random bytes
 */

contract DirectRNG {
    event RandomGenerated(uint256 value);

    /**
     * @dev Get random bytes32 from the 0x18 precompile
     * @return randomValue 32 bytes of randomness
     */
    function getRandomBytes() public view returns (bytes32 randomValue) {
        assembly {
            let freemem := mload(0x40)
            let start_addr := add(freemem, 0)
            if iszero(staticcall(gas(), 0x18, 0, 0, start_addr, 32)) {
                invalid()
            }
            randomValue := mload(freemem)
        }
    }

    /**
     * @dev Get random uint256 value
     * @return Random 256-bit number
     */
    function getRandomNumber() public view returns (uint256) {
        return uint256(getRandomBytes());
    }

    /**
     * @dev Get random number in range [0, max-1]
     * @param max Upper bound (exclusive)
     * @return Random number less than max
     */
    function getRandomRange(uint256 max) public view returns (uint256) {
        return getRandomNumber() % max;
    }
}

/**
 * Coin Flip with Direct Precompile
 * No library dependencies - pure Solidity with assembly
 */

contract DirectCoinFlip {
    enum CoinSide { Heads, Tails }

    event CoinFlipped(address indexed player, CoinSide result, uint256 randomValue);

    /**
     * @dev Flip a coin using direct precompile call
     * @return result The coin flip result
     */
    function flip() public returns (CoinSide result) {
        uint256 random = _getRandomNumber();
        result = (random % 2 == 0) ? CoinSide.Heads : CoinSide.Tails;

        emit CoinFlipped(msg.sender, result, random);
        return result;
    }

    /**
     * @dev Internal function to get random number from precompile
     */
    function _getRandomNumber() private view returns (uint256) {
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

/**
 * Multi-Roll Dice with Direct Precompile
 * Demonstrates getting multiple random values in one transaction
 * Uses index iteration to vary the random value
 */

contract DirectDiceRoll {
    event DiceRolled(address indexed player, uint256[] results);

    /**
     * @dev Roll multiple dice
     * @param count Number of dice to roll
     * @param sides Number of sides on each die
     * @return results Array of random numbers
     */
    function rollMultiple(uint256 count, uint256 sides) external view returns (uint256[] memory results) {
        results = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            // Combine base random with index to get different values
            uint256 random = _getRandomWithIndex(i);
            results[i] = (random % sides) + 1; // 1 to sides
        }

        return results;
    }

    /**
     * @dev Get random number varied by index
     */
    function _getRandomWithIndex(uint256 index) private view returns (uint256) {
        bytes32 randomBytes;
        assembly {
            let freemem := mload(0x40)
            if iszero(staticcall(gas(), 0x18, 0, 0, freemem, 32)) {
                invalid()
            }
            randomBytes = mload(freemem)
        }
        return uint256(keccak256(abi.encode(randomBytes, index)));
    }

    /**
     * @dev Get base random number
     */
    function _getRandomNumber() private view returns (uint256) {
        bytes32 randomBytes;
        assembly {
            let freemem := mload(0x40)
            if iszero(staticcall(gas(), 0x18, 0, 0, freemem, 32)) {
                invalid()
            }
            randomBytes = mload(freemem)
        }
        return uint256(randomBytes);
    }
}

/**
 * Weighted Random Selection with Direct Precompile
 * Demonstrates selecting from options with different probabilities
 */

contract DirectWeightedSelector {
    struct Option {
        string name;
        uint256 weight; // Probability weight
    }

    /**
     * @dev Select an option based on weights
     * @param options Array of options with weights
     * @return index The selected option index
     */
    function selectWeighted(Option[] memory options) external view returns (uint256 index) {
        // Calculate total weight
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < options.length; i++) {
            totalWeight += options[i].weight;
        }

        // Get random value in range [0, totalWeight-1]
        bytes32 randomBytes;
        assembly {
            let freemem := mload(0x40)
            if iszero(staticcall(gas(), 0x18, 0, 0, freemem, 32)) {
                invalid()
            }
            randomBytes = mload(freemem)
        }
        uint256 randomValue = uint256(randomBytes) % totalWeight;

        // Find selected option
        uint256 cumulativeWeight = 0;
        for (uint256 i = 0; i < options.length; i++) {
            cumulativeWeight += options[i].weight;
            if (randomValue < cumulativeWeight) {
                return i;
            }
        }

        return options.length - 1; // Fallback
    }
}

/**
 * Safe RNG Wrapper with Validation
 * Adds safety checks for non-SKALE chains
 */

contract SafeDirectRNG {
    error NotOnSKALE();

    /**
     * @dev Get random number with safety check
     * Reverts if not on SKALE network (random value is zero)
     */
    function getRandomNumberSafe() public view returns (uint256) {
        bytes32 randomBytes;
        assembly {
            let freemem := mload(0x40)
            if iszero(staticcall(gas(), 0x18, 0, 0, freemem, 32)) {
                invalid()
            }
            randomBytes = mload(freemem)
        }

        uint256 randomValue = uint256(randomBytes);
        if (randomValue == 0) {
            revert NotOnSKALE();
        }
        return randomValue;
    }

    /**
     * @dev Check if contract is on SKALE network
     */
    function isOnSKALE() public view returns (bool) {
        bytes32 randomBytes;
        assembly {
            let freemem := mload(0x40)
            if iszero(staticcall(gas(), 0x18, 0, 0, freemem, 32)) {
                invalid()
            }
            randomBytes = mload(freemem)
        }
        return uint256(randomBytes) != 0;
    }
}
