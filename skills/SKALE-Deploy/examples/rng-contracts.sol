// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * Example 1: Coin Flip Contract using @dirtroad/skale-rng Library
 *
 * A simple coin flip that randomly selects between Heads or Tails
 * Demonstrates basic RNG usage with the SKALE RNG library
 */

import "@dirtroad/skale-rng/contracts/RNG.sol";

contract CoinFlipWithLibrary is RNG {
    enum CoinSide { Heads, Tails }

    event CoinFlipped(address indexed player, CoinSide result, uint256 randomValue);

    /**
     * @dev Flip a coin - randomly selects between Heads or Tails
     * @return result The coin flip result
     */
    function flip() public returns (CoinSide result) {
        uint256 random = getRandomNumber();
        result = (random % 2 == 0) ? CoinSide.Heads : CoinSide.Tails;

        emit CoinFlipped(msg.sender, result, random);
        return result;
    }

    /**
     * @dev Get the underlying random number for transparency
     */
    function getLastRandom() public view returns (uint256) {
        return getRandomNumber();
    }
}

/**
 * Example 2: Dice Roll Contract
 *
 * Roll multiple dice with configurable sides
 * Demonstrates using getNextRandomRange for multiple random values
 */

contract DiceRoll is RNG {
    event DiceRolled(address indexed player, uint256[] results);

    /**
     * @dev Roll a single die with specified number of sides
     * @param sides Number of sides on the die (e.g., 6 for d6, 20 for d20)
     * @return result Random number between 1 and sides
     */
    function rollSingle(uint256 sides) external view returns (uint256 result) {
        return getNextRandomRange(1, sides);
    }

    /**
     * @dev Roll multiple dice with specified number of sides
     * @param count Number of dice to roll
     * @param sides Number of sides on each die
     * @return results Array of random numbers
     */
    function rollMultiple(uint256 count, uint256 sides) external view returns (uint256[] memory results) {
        results = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            // Use index to get different random values for each die
            results[i] = getNextRandomRange(i, sides);
        }
        return results;
    }
}

/**
 * Example 3: Lottery Contract
 *
 * Enter participants and draw a random winner
 * Demonstrates random selection from an array
 */

contract SimpleLottery is RNG {
    address[] public participants;
    bool public winnerDrawn = false;
    address public winner;

    event Entered(address indexed participant);
    event WinnerSelected(address indexed winner);

    /**
     * @dev Enter the lottery
     */
    function enter() external {
        require(!winnerDrawn, "Winner already drawn");
        participants.push(msg.sender);
        emit Entered(msg.sender);
    }

    /**
     * @dev Draw a random winner from participants
     */
    function drawWinner() external {
        require(!winnerDrawn, "Winner already drawn");
        require(participants.length > 0, "No participants");

        uint256 winningIndex = getRandomRange(participants.length);
        winner = participants[winningIndex];
        winnerDrawn = true;

        emit WinnerSelected(winner);
    }

    /**
     * @dev Get number of participants
     */
    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }

    /**
     * @dev Reset the lottery for next round
     */
    function reset() external {
        require(winnerDrawn, "Winner not yet drawn");
        delete participants;
        winnerDrawn = false;
        winner = address(0);
    }
}

/**
 * Example 4: NFT Random Attribute Generator
 *
 * Generate random attributes for NFTs with varying rarities
 * Demonstrates weighted random selection
 */

contract NFTAttributeGenerator is RNG {
    enum Rarity { Common, Uncommon, Rare, Epic, Legendary }

    struct Attributes {
        Rarity rarity;
        uint256 power;
        uint256 speed;
        uint256 defense;
    }

    event AttributesGenerated(uint256 indexed tokenId, Attributes attributes);

    /**
     * @dev Generate random attributes for a token
     * @param tokenId The token ID to generate attributes for
     * @return attributes The generated attributes
     */
    function generateAttributes(uint256 tokenId) external view returns (Attributes memory) {
        // Generate weighted rarity (10% Legendary, 20% Epic, 30% Rare, etc.)
        uint256 rarityRoll = getRandomNumber() % 100;
        Rarity rarity;

        if (rarityRoll < 10) rarity = Rarity.Legendary;
        else if (rarityRoll < 30) rarity = Rarity.Epic;
        else if (rarityRoll < 60) rarity = Rarity.Rare;
        else if (rarityRoll < 85) rarity = Rarity.Uncommon;
        else rarity = Rarity.Common;

        // Generate stats based on rarity
        uint256 basePower = _getBasePower(rarity);
        uint256 power = basePower + (getRandomNumber() % 20);
        uint256 speed = basePower + (getRandomNumber() % 20);
        uint256 defense = basePower + (getRandomNumber() % 20);

        return Attributes({
            rarity: rarity,
            power: power,
            speed: speed,
            defense: defense
        });
    }

    /**
     * @dev Get base power for rarity tier
     */
    function _getBasePower(Rarity rarity) private pure returns (uint256) {
        if (rarity == Rarity.Legendary) return 90;
        if (rarity == Rarity.Epic) return 70;
        if (rarity == Rarity.Rare) return 50;
        if (rarity == Rarity.Uncommon) return 30;
        return 10; // Common
    }
}

/**
 * Example 5: Random Array Shuffle
 *
 * Shuffle an array of items randomly
 * Demonstrates Fisher-Yates shuffle algorithm with RNG
 */

contract RandomShuffle is RNG {
    /**
     * @dev Shuffle an array of addresses
     * @param array The array to shuffle
     * @return shuffled The shuffled array
     */
    function shuffleAddresses(address[] memory array) external view returns (address[] memory shuffled) {
        shuffled = array;
        uint256 random = getRandomNumber();

        for (uint256 i = array.length - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encode(random, i))) % (i + 1);
            (shuffled[i], shuffled[j]) = (shuffled[j], shuffled[i]);
        }

        return shuffled;
    }

    /**
     * @dev Shuffle an array of numbers
     * @param array The array to shuffle
     * @return shuffled The shuffled array
     */
    function shuffleNumbers(uint256[] memory array) external view returns (uint256[] memory shuffled) {
        shuffled = array;
        uint256 random = getRandomNumber();

        for (uint256 i = array.length - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encode(random, i))) % (i + 1);
            (shuffled[i], shuffled[j]) = (shuffled[j], shuffled[i]);
        }

        return shuffled;
    }
}
