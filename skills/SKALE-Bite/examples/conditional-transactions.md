# Conditional Transactions Examples - Rock-Paper-Scissors

Complete working example of a **Rock-Paper-Scissors game** using BITE V2 Conditional Transactions (CTX). This demonstrates the commit-reveal pattern with automatic decryption—no manual reveal phase required.

## Project Overview

The game implements encrypted gameplay where both players submit their moves without revealing them. Once both players have committed, the CTX system automatically decrypts both moves simultaneously and determines the winner.

**Game Flow:**

| Phase | Action | Key Details |
| ----- | ------ | ----------- |
| Create | Player 1 creates game | Encrypted move stored, wager locked |
| Join | Player 2 joins game | Encrypted move + 0.06 ETH CTX gas payment |
| Decrypt | Network decrypts | Automatic in next block via `onDecrypt()` |
| Resolve | Contract pays winner | 2x wager to winner, refund on draw |

## Project Structure

```
rock-paper-scissors/
├── contracts/
│   ├── src/
│   │   ├── RockPaperScissors.sol    # Main game contract
│   │   └── encryption/
│   │       ├── Precompiled.sol        # BITE V2 precompile library
│   │       └── types.sol             # Type definitions
│   └── script/
│       └── Deploy.s.sol             # Deployment script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CreateGame.tsx       # Game creation form
│   │   │   ├── JoinGame.tsx         # Game joining form
│   │   │   └── GameList.tsx         # Browse active games
│   │   ├── config/
│   │   │   └── contracts.ts         # Contract addresses & ABIs
│   │   └── utils/
│   │       └── encryption.ts        # BITE SDK utilities
│   └── package.json
└── foundry.toml
```

## Prerequisites

* Node.js 18+ and npm/yarn
* Foundry (for Solidity compilation and deployment)
* Wallet with sFUEL on BITE V2 Sandbox 2

## Quick Start

```bash
# Clone the demo repository
git clone -b thegreataxios/rps https://github.com/TheGreatAxios/ctxs.git
cd ctxs/rock-paper-scissors

# Install dependencies
forge install
cd frontend && npm install

# Deploy contracts
cd ../contracts
export RPC_URL="https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox-2"
export PRIVATE_KEY="0x..."
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast

# Run frontend
cd ../frontend
npm run dev
```

## Smart Contract

### RockPaperScissors.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.27;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IERC20, SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IBiteSupplicant } from "@skalenetwork/bite-solidity/interfaces/IBiteSupplicant.sol";
import { Precompiled } from "./encryption/Precompiled.sol";

/**
 * @title RockPaperScissors
 * @notice Rock-Paper-Scissors game with BITE V2 Conditional Transactions
 * @dev Players submit encrypted moves that decrypt automatically when game joins
 */
contract RockPaperScissors is ReentrancyGuard, IBiteSupplicant {
    using SafeERC20 for IERC20;

    // ==================== Enums ====================

    enum Move { None, Rock, Paper, Scissors }
    enum GameState { Created, Joined, Finished, Expired }

    // ==================== Structs ====================

    struct Game {
        address player1;
        address player2;
        bytes encryptedMove1;      // Encrypted move from Player 1
        bytes encryptedMove2;      // Encrypted move from Player 2
        uint8 move1;              // Decrypted move (revealed after CTX)
        uint8 move2;              // Decrypted move (revealed after CTX)
        uint256 wagerAmount;
        address wagerToken;
        GameState state;
        uint256 joinDeadline;
        address winner;
    }

    // ==================== Constants ====================

    // BITE Precompile addresses
    address public constant SUBMIT_CTX = 0x000000000000000000000000000000000000001B;
    address public constant ENCRYPT_TE = 0x000000000000000000000000000000000000001C;

    uint256 public constant CTX_GAS_LIMIT = 2_500_000;
    uint256 public constant CTX_GAS_PAYMENT = 0.06 ether;
    uint256 public constant JOIN_TIMEOUT = 1 hours;

    // ==================== State ====================

    uint256 public nextGameId;
    mapping(uint256 => Game) public games;

    // ==================== Events ====================

    event GameCreated(
        uint256 indexed gameId,
        address indexed player1,
        uint256 wagerAmount,
        address wagerToken
    );

    event GameJoined(
        uint256 indexed gameId,
        address indexed player2,
        bytes encryptedMove
    );

    event MovesDecrypted(
        uint256 indexed gameId,
        uint8 move1,
        uint8 move2
    );

    event GameFinished(
        uint256 indexed gameId,
        address indexed winner
    );

    // ==================== Errors ====================

    error InvalidEncryptedMove();
    error InvalidToken();
    error GameNotFound();
    error GameFull();
    error InvalidGameState();
    error GameExpired();
    error InvalidCTXGasPayment();
    error InvalidMove();

    // ==================== Constructor ====================

    constructor() {}

    // ==================== External Functions ====================

    /**
     * @notice Create a new game with encrypted move
     * @param _encryptedMove Threshold-encrypted move (from BITE SDK)
     * @param _wagerAmount Amount to wager
     * @param _wagerToken ERC20 token address for wager
     * @return gameId The ID of the created game
     */
    function createGame(
        bytes calldata _encryptedMove,
        uint256 _wagerAmount,
        address _wagerToken
    )
        external
        nonReentrant
        returns (uint256 gameId)
    {
        if (_encryptedMove.length == 0) revert InvalidEncryptedMove();
        if (_wagerToken == address(0)) revert InvalidToken();

        // Transfer wager tokens from player to contract
        IERC20(_wagerToken).safeTransferFrom(msg.sender, address(this), _wagerAmount);

        gameId = nextGameId++;
        games[gameId] = Game({
            player1: msg.sender,
            player2: address(0),
            encryptedMove1: _encryptedMove,
            encryptedMove2: "",
            move1: 0,
            move2: 0,
            wagerAmount: _wagerAmount,
            wagerToken: _wagerToken,
            state: GameState.Created,
            joinDeadline: block.timestamp + JOIN_TIMEOUT,
            winner: address(0)
        });

        emit GameCreated(gameId, msg.sender, _wagerAmount, _wagerToken);
    }

    /**
     * @notice Join an existing game with encrypted move
     * @param _gameId The ID of the game to join
     * @param _encryptedMove Threshold-encrypted move (from BITE SDK)
     * @dev Must send exactly CTX_GAS_PAYMENT (0.06 ETH) for CTX execution
     */
    function joinGame(
        uint256 _gameId,
        bytes calldata _encryptedMove
    )
        external
        payable
        nonReentrant
    {
        Game storage game = games[_gameId];

        if (game.player1 == address(0)) revert GameNotFound();
        if (game.player2 != address(0)) revert GameFull();
        if (game.state != GameState.Created) revert InvalidGameState();
        if (block.timestamp > game.joinDeadline) revert GameExpired();
        if (_encryptedMove.length == 0) revert InvalidEncryptedMove();
        if (msg.value != CTX_GAS_PAYMENT) revert InvalidCTXGasPayment();

        // Transfer wager tokens from player to contract
        IERC20(game.wagerToken).safeTransferFrom(
            msg.sender,
            address(this),
            game.wagerAmount
        );

        game.player2 = msg.sender;
        game.encryptedMove2 = _encryptedMove;
        game.state = GameState.Joined;

        emit GameJoined(_gameId, msg.sender, _encryptedMove);

        // Submit CTX to decrypt both moves
        _submitDecryptCTX(_gameId);
    }

    /**
     * @notice Callback for automatic decryption from BITE network
     * @param decryptedArguments Decrypted moves (move1, move2)
     * @param plaintextArguments Game ID for identification
     * @dev Called automatically by the network in the next block
     */
    function onDecrypt(
        bytes[] calldata decryptedArguments,
        bytes[] calldata plaintextArguments
    )
        external
        nonReentrant
    {
        // Decode game ID from plaintext args
        uint256 gameId = abi.decode(plaintextArguments[0], (uint256));
        Game storage game = games[gameId];

        if (game.player1 == address(0)) revert GameNotFound();
        if (game.state != GameState.Joined) revert InvalidGameState();

        // Decrypt moves from BITE
        game.move1 = uint8(bytes1(decryptedArguments[0]));
        game.move2 = uint8(bytes1(decryptedArguments[1]));

        if (game.move1 < 1 || game.move1 > 3) revert InvalidMove();
        if (game.move2 < 1 || game.move2 > 3) revert InvalidMove();

        emit MovesDecrypted(gameId, game.move1, game.move2);

        // Resolve game
        _resolveGame(gameId);
    }

    // ==================== View Functions ====================

    /**
     * @notice Get full game details
     * @param _gameId The ID of the game
     * @return All game data
     */
    function getGame(uint256 _gameId)
        external
        view
        returns (
            address player1,
            address player2,
            bytes memory encryptedMove1,
            bytes memory encryptedMove2,
            uint8 move1,
            uint8 move2,
            uint256 wagerAmount,
            address wagerToken,
            GameState state,
            uint256 joinDeadline,
            address winner
        )
    {
        Game memory game = games[_gameId];
        return (
            game.player1,
            game.player2,
            game.encryptedMove1,
            game.encryptedMove2,
            game.move1,
            game.move2,
            game.wagerAmount,
            game.wagerToken,
            game.state,
            game.joinDeadline,
            game.winner
        );
    }

    /**
     * @notice Get all active games
     * @return Array of active game IDs
     */
    function getActiveGames() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < nextGameId; i++) {
            if (games[i].state == GameState.Created) {
                activeCount++;
            }
        }

        uint256[] memory activeGames = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < nextGameId; i++) {
            if (games[i].state == GameState.Created) {
                activeGames[index++] = i;
            }
        }

        return activeGames;
    }

    // ==================== Internal Functions ====================

    /**
     * @notice Submit CTX to decrypt both moves
     * @param _gameId The ID of the game
     * @dev Packages encrypted moves and submits to BITE precompile
     */
    function _submitDecryptCTX(uint256 _gameId) internal {
        Game storage game = games[_gameId];

        // Prepare encrypted args (both moves)
        bytes[] memory encryptedArgs = new bytes[](2);
        encryptedArgs[0] = game.encryptedMove1;
        encryptedArgs[1] = game.encryptedMove2;

        // Prepare plaintext args (game ID for callback)
        bytes[] memory plaintextArgs = new bytes[](1);
        plaintextArgs[0] = abi.encode(_gameId);

        // Get CTX sender address and transfer gas payment
        address payable ctxSender = Precompiled.submitCTX(
            SUBMIT_CTX,
            CTX_GAS_LIMIT,
            encryptedArgs,
            plaintextArgs
        );

        // Transfer gas payment to CTX sender
        payable(ctxSender).transfer(CTX_GAS_PAYMENT);
    }

    /**
     * @notice Resolve the game and distribute winnings
     * @param _gameId The ID of the game
     */
    function _resolveGame(uint256 _gameId) internal {
        Game storage game = games[_gameId];

        Move move1 = Move(game.move1);
        Move move2 = Move(game.move2);

        if (move1 == move2) {
            // Draw - refund both players
            game.winner = address(0);
            _refundPlayer(game.player1, game.wagerAmount, game.wagerToken);
            _refundPlayer(game.player2, game.wagerAmount, game.wagerToken);
        } else if (
            (move1 == Move.Rock && move2 == Move.Scissors) ||
            (move1 == Move.Paper && move2 == Move.Rock) ||
            (move1 == Move.Scissors && move2 == Move.Paper)
        ) {
            // Player 1 wins
            game.winner = game.player1;
            _transferPayout(game.player1, game.wagerAmount * 2, game.wagerToken);
        } else {
            // Player 2 wins
            game.winner = game.player2;
            _transferPayout(game.player2, game.wagerAmount * 2, game.wagerToken);
        }

        game.state = GameState.Finished;
        emit GameFinished(_gameId, game.winner);
    }

    /**
     * @notice Refund wager to a player (draw)
     * @param _player The player to refund
     * @param _amount The amount to refund
     * @param _token The token to refund
     */
    function _refundPlayer(
        address _player,
        uint256 _amount,
        address _token
    ) internal {
        IERC20(_token).safeTransfer(_player, _amount);
    }

    /**
     * @notice Transfer payout to winner
     * @param _winner The winning player
     * @param _amount The amount to transfer (2x wager)
     * @param _token The token to transfer
     */
    function _transferPayout(
        address _winner,
        uint256 _amount,
        address _token
    ) internal {
        IERC20(_token).safeTransfer(_winner, _amount);
    }
}
```

## Foundry Configuration

**foundry.toml:**

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.27"
evm_version = "istanbul"

# See more config options https://github.com/foundry-rs/foundry/tree/master/config
```

## Deployment Script

**script/Deploy.s.sol:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.27;

import { Script } from "forge-std/Script.sol";
import { MockSKL } from "../src/MockSKL.sol";
import { RockPaperScissors } from "../src/RockPaperScissors.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock SKL token for testing
        MockSKL mockSKL = new MockSKL();
        console.log("MockSKL deployed at:", address(mockSKL));

        // Deploy game contract
        RockPaperScissors rps = new RockPaperScissors();
        console.log("RockPaperScissors deployed at:", address(rps));

        vm.stopBroadcast();

        console.log("\n=== UPDATE FRONTEND ===");
        console.log("TOKEN_ADDRESS[%s] = %s", block.chainid, address(mockSKL));
        console.log("CONTRACT_ADDRESS[%s] = %s", block.chainid, address(rps));
        console.log("Deployer: %s", vm.addr(deployerPrivateKey));
        console.log("Network: %s", block.chainid);
    }
}
```

**Deployment commands:**

```bash
# Set environment variables
export RPC_URL="https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox-2"
export PRIVATE_KEY="0x..."

# Deploy contracts
cd contracts
forge script script/Deploy.s.sol:Deploy \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast

# Expected output:
# MockSKL deployed at: 0x...
# RockPaperScissors deployed at: 0x...
```

## Frontend Implementation

### Configuration

**src/config/contracts.ts:**

```typescript
export const CONTRACT_ADDRESS: Record<number, string> = {
  103698795: "0x...", // BITE V2 Sandbox 2 - Replace with deployed address
};

export const TOKEN_ADDRESS: Record<number, string> = {
  103698795: "0x...", // MockSKL - Replace with deployed address
};

export const CHAIN_ID = 103698795;
export const RPC_URL = "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox-2";

// Rock-Paper-Scissors Contract ABI
export const CONTRACT_ABI = [
  // Read functions
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "games",
    "outputs": [
      {"internalType": "address", "name": "player1", "type": "address"},
      {"internalType": "address", "name": "player2", "type": "address"},
      {"internalType": "bytes", "name": "encryptedMove1", "type": "bytes"},
      {"internalType": "bytes", "name": "encryptedMove2", "type": "bytes"},
      {"internalType": "uint8", "name": "move1", "type": "uint8"},
      {"internalType": "uint8", "name": "move2", "type": "uint8"},
      {"internalType": "uint256", "name": "wagerAmount", "type": "uint256"},
      {"internalType": "address", "name": "wagerToken", "type": "address"},
      {"internalType": "enum RockPaperScissors.GameState", "name": "state", "type": "uint8"},
      {"internalType": "uint256", "name": "joinDeadline", "type": "uint256"},
      {"internalType": "address", "name": "winner", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_gameId", "type": "uint256"}],
    "name": "getGame",
    "outputs": [
      {"internalType": "address", "name": "player1", "type": "address"},
      {"internalType": "address", "name": "player2", "type": "address"},
      {"internalType": "bytes", "name": "encryptedMove1", "type": "bytes"},
      {"internalType": "bytes", "name": "encryptedMove2", "type": "bytes"},
      {"internalType": "uint8", "name": "move1", "type": "uint8"},
      {"internalType": "uint8", "name": "move2", "type": "uint8"},
      {"internalType": "uint256", "name": "wagerAmount", "type": "uint256"},
      {"internalType": "address", "name": "wagerToken", "type": "address"},
      {"internalType": "enum RockPaperScissors.GameState", "name": "state", "type": "uint8"},
      {"internalType": "uint256", "name": "joinDeadline", "type": "uint256"},
      {"internalType": "address", "name": "winner", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveGames",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Write functions
  {
    "inputs": [
      {"internalType": "bytes", "name": "_encryptedMove", "type": "bytes"},
      {"internalType": "uint256", "name": "_wagerAmount", "type": "uint256"},
      {"internalType": "address", "name": "_wagerToken", "type": "address"}
    ],
    "name": "createGame",
    "outputs": [{"internalType": "uint256", "name": "gameId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_gameId", "type": "uint256"},
      {"internalType": "bytes", "name": "_encryptedMove", "type": "bytes"}
    ],
    "name": "joinGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "player1", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "wagerAmount", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "wagerToken", "type": "address"}
    ],
    "name": "GameCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "player2", "type": "address"},
      {"indexed": false, "internalType": "bytes", "name": "encryptedMove", "type": "bytes"}
    ],
    "name": "GameJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256"},
      {"indexed": false, "internalType": "uint8", "name": "move1", "type": "uint8"},
      {"indexed": false, "internalType": "uint8", "name": "move2", "type": "uint8"}
    ],
    "name": "MovesDecrypted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "winner", "type": "address"}
    ],
    "name": "GameFinished",
    "type": "event"
  }
] as const;

// ERC20 ABI for token approval
export const ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
```

### Encryption Utilities

**src/utils/encryption.ts:**

```typescript
import { BITE } from '@skalenetwork/bite';
import { RPC_URL } from '../config/contracts';

let biteInstance: BITE | null = null;

export function getBITE(): BITE {
  if (!biteInstance) {
    biteInstance = new BITE(RPC_URL);
  }
  return biteInstance;
}

export enum Move {
  None = 0,
  Rock = 1,
  Paper = 2,
  Scissors = 3,
}

/**
 * Encrypt a move using BITE threshold encryption
 * @param move The move to encrypt (1-3)
 * @returns Encrypted move as hex string
 */
export async function encryptMove(move: Move): Promise<string> {
  if (move < 1 || move > 3) {
    throw new Error('Invalid move: must be 1 (Rock), 2 (Paper), or 3 (Scissors)');
  }

  const bite = getBITE();

  // Convert move to hex (1 -> "01", 2 -> "02", 3 -> "03")
  const moveHex = move.toString(16).padStart(2, '0');

  // Encrypt using BITE SDK
  const encryptedMove = await bite.encryptMessage(moveHex);

  return encryptedMove;
}

/**
 * Get the display name for a move
 */
export function getMoveName(move: Move): string {
  switch (move) {
    case Move.Rock:
      return 'Rock';
    case Move.Paper:
      return 'Paper';
    case Move.Scissors:
      return 'Scissors';
    default:
      return 'None';
  }
}

/**
 * Get the emoji for a move
 */
export function getMoveEmoji(move: Move): string {
  switch (move) {
    case Move.Rock:
      return '🪨';
    case Move.Paper:
      return '📄';
    case Move.Scissors:
      return '✂️';
    default:
      return '❓';
  }
}
```

### CreateGame Component

**src/components/CreateGame.tsx:**

```tsx
import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI, TOKEN_ADDRESS, ERC20_ABI, CHAIN_ID } from '../config/contracts';
import { encryptMove, Move, getMoveName, getMoveEmoji } from '../utils/encryption';

const MOVES = [Move.Rock, Move.Paper, Move.Scissors];

export function CreateGame() {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { writeContract } = useWriteContract();

  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [wagerAmount, setWagerAmount] = useState('1');
  const [isApproving, setIsApproving] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createTxHash, setCreateTxHash] = useState<string | null>(null);

  const tokenAddress = TOKEN_ADDRESS[CHAIN_ID];
  const contractAddress = CONTRACT_ADDRESS[CHAIN_ID];

  // Check token allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && contractAddress ? [address, contractAddress] : undefined,
  });

  const handleCreateGame = async () => {
    if (!selectedMove || !tokenAddress || !contractAddress) return;

    const amount = wagerAmount ? parseEther(wagerAmount) : BigInt(0);
    const needsApproval = allowance !== undefined && amount > (allowance || 0n);

    try {
      // Step 1: Approve token spending if needed
      if (needsApproval) {
        setIsApproving(true);
        const approveHash = await writeContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contractAddress as `0x${string}`, amount],
        });

        if (approveHash && publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
          await refetchAllowance();
        }
        setIsApproving(false);
      }

      // Step 2: Encrypt the selected move
      setIsEncrypting(true);
      const encryptedMove = await encryptMove(selectedMove);
      setIsEncrypting(false);

      // Step 3: Create game with encrypted move
      setIsCreating(true);
      const hash = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'createGame',
        args: [encryptedMove, amount, tokenAddress as `0x${string}`],
      });

      setCreateTxHash(hash || null);
      setIsCreating(false);

      // Reset form
      setSelectedMove(null);
      setWagerAmount('1');
    } catch (e) {
      console.error('Error creating game:', e);
      setIsApproving(false);
      setIsEncrypting(false);
      setIsCreating(false);
    }
  };

  if (chain?.id !== CHAIN_ID) {
    return (
      <div className="alert alert-warning">
        Please switch to BITE V2 Sandbox 2 (Chain ID: {CHAIN_ID})
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Create New Game</h2>

      <div className="form-group">
        <label>Select Your Move (Encrypted):</label>
        <div className="moves-grid">
          {MOVES.map((move) => (
            <button
              key={move}
              className={`move-button ${selectedMove === move ? 'selected' : ''}`}
              onClick={() => setSelectedMove(move)}
              disabled={isCreating || isEncrypting}
            >
              <span className="move-emoji">{getMoveEmoji(move)}</span>
              <span className="move-name">{getMoveName(move)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="wager">Wager Amount (SKL):</label>
        <input
          id="wager"
          type="number"
          min="0"
          step="0.1"
          value={wagerAmount}
          onChange={(e) => setWagerAmount(e.target.value)}
          disabled={isCreating}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={handleCreateGame}
        disabled={!selectedMove || isCreating || isApproving || isEncrypting}
      >
        {isCreating ? 'Creating...' :
         isEncrypting ? 'Encrypting move...' :
         isApproving ? 'Approving tokens...' :
         'Create Game'}
      </button>

      {createTxHash && (
        <div className="success-message">
          Game created!{' '}
          <a href={`https://base-sepolia-testnet-explorer.skalenodes.com:10032/tx/${createTxHash}`}
             target="_blank" rel="noopener noreferrer">
            View transaction
          </a>
        </div>
      )}
    </div>
  );
}
```

### JoinGame Component

**src/components/JoinGame.tsx:**

```tsx
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI, TOKEN_ADDRESS, ERC20_ABI, CHAIN_ID } from '../config/contracts';
import { encryptMove, Move, getMoveName, getMoveEmoji } from '../utils/encryption';

const MOVES = [Move.Rock, Move.Paper, Move.Scissors];
const CTX_GAS_PAYMENT = BigInt(60000000000000000); // 0.06 ETH

interface JoinGameProps {
  gameId: string;
  onJoined?: () => void;
}

interface GameData {
  player1: string;
  player2: string;
  encryptedMove1: string;
  encryptedMove2: string;
  move1: number;
  move2: number;
  wagerAmount: bigint;
  wagerToken: string;
  state: number;
  joinDeadline: bigint;
  winner: string;
}

export function JoinGame({ gameId, onJoined }: JoinGameProps) {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { writeContract } = useWriteContract();

  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinTxHash, setJoinTxHash] = useState<string | null>(null);

  const tokenAddress = TOKEN_ADDRESS[CHAIN_ID];
  const contractAddress = CONTRACT_ADDRESS[CHAIN_ID];

  // Get game details for wager amount
  const { data: gameData } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getGame',
    args: gameId ? [BigInt(gameId)] : undefined,
    query: {
      enabled: !!gameId,
    },
  }) as { data: GameData | undefined };

  const wagerAmount = gameData?.wagerAmount;

  // Check token allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && contractAddress ? [address, contractAddress] : undefined,
  });

  const handleJoinGame = async () => {
    if (!selectedMove || !gameId || !wagerAmount || !tokenAddress) return;

    try {
      // Step 1: Approve token spending if needed
      const needsApproval = allowance !== undefined && wagerAmount > (allowance || 0n);

      if (needsApproval) {
        setIsApproving(true);
        const approveHash = await writeContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contractAddress as `0x${string}`, wagerAmount],
        });

        if (approveHash && publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
          await refetchAllowance();
        }
        setIsApproving(false);
      }

      // Step 2: Encrypt the selected move
      setIsEncrypting(true);
      const encryptedMove = await encryptMove(selectedMove);
      setIsEncrypting(false);

      // Step 3: Join game with CTX gas payment
      setIsJoining(true);
      const joinHash = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'joinGame',
        args: [BigInt(gameId), encryptedMove],
        value: CTX_GAS_PAYMENT, // 0.06 ETH for CTX execution
      });

      setJoinTxHash(joinHash || null);
      setIsJoining(false);

      if (onJoined) {
        onJoined();
      }
    } catch (e) {
      console.error('Error joining game:', e);
      setIsApproving(false);
      setIsEncrypting(false);
      setIsJoining(false);
    }
  };

  if (!gameData) {
    return <div>Loading game details...</div>;
  }

  if (gameData.state !== 0) { // 0 = Created
    return <div>Game is not accepting new players</div>;
  }

  if (chain?.id !== CHAIN_ID) {
    return (
      <div className="alert alert-warning">
        Please switch to BITE V2 Sandbox 2 (Chain ID: {CHAIN_ID})
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Join Game #{gameId}</h2>

      <div className="game-info">
        <p><strong>Wager:</strong> {wagerAmount ? (Number(wagerAmount) / 1e18).toString() : '0'} SKL</p>
        <p><strong>CTX Gas Payment:</strong> 0.06 ETH</p>
      </div>

      <div className="form-group">
        <label>Select Your Move (Encrypted):</label>
        <div className="moves-grid">
          {MOVES.map((move) => (
            <button
              key={move}
              className={`move-button ${selectedMove === move ? 'selected' : ''}`}
              onClick={() => setSelectedMove(move)}
              disabled={isJoining || isEncrypting}
            >
              <span className="move-emoji">{getMoveEmoji(move)}</span>
              <span className="move-name">{getMoveName(move)}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleJoinGame}
        disabled={!selectedMove || isJoining || isApproving || isEncrypting}
      >
        {isJoining ? 'Joining...' :
         isEncrypting ? 'Encrypting move...' :
         isApproving ? 'Approving tokens...' :
         'Join Game (0.06 ETH)'}
      </button>

      {joinTxHash && (
        <div className="success-message">
          Game joined! Waiting for decryption...{' '}
          <a href={`https://base-sepolia-testnet-explorer.skalenodes.com:10032/tx/${joinTxHash}`}
             target="_blank" rel="noopener noreferrer">
            View transaction
          </a>
        </div>
      )}
    </div>
  );
}
```

### GameList Component

**src/components/GameList.tsx:**

```tsx
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID } from '../config/contracts';
import { JoinGame } from './JoinGame';

export function GameList() {
  const contractAddress = CONTRACT_ADDRESS[CHAIN_ID];

  const { data: activeGames, isLoading, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getActiveGames',
    query: {
      refetchInterval: 5000, // Poll every 5 seconds
    },
  });

  return (
    <div className="card">
      <h2>Active Games</h2>

      {isLoading ? (
        <p>Loading games...</p>
      ) : activeGames && activeGames.length > 0 ? (
        <div className="games-list">
          {activeGames.map((gameId) => (
            <div key={gameId.toString()} className="game-item">
              <h3>Game #{gameId.toString()}</h3>
              <JoinGame gameId={gameId.toString()} onJoined={() => refetch()} />
            </div>
          ))}
        </div>
      ) : (
        <p>No active games. Create one to get started!</p>
      )}
    </div>
  );
}
```

## Testing

### Foundry Tests

**test/RockPaperScissors.t.sol:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.27;

import "forge-std/Test.sol";
import { RockPaperScissors } from "../src/RockPaperScissors.sol";
import { MockSKL } from "../src/MockSKL.sol";

contract RockPaperScissorsTest is Test {
    RockPaperScissors rps;
    MockSKL token;

    address player1 = address(0x1);
    address player2 = address(0x2);

    function setUp() public {
        vm.startPrank(player1);

        // Deploy mock token
        token = new MockSKL();
        token.mint(player1, 1000 ether);
        token.mint(player2, 1000 ether);

        // Deploy game contract
        rps = new RockPaperScissors();

        vm.stopPrank();
    }

    function testCreateGame() public {
        vm.startPrank(player1);

        bytes memory encryptedMove = hex"01"; // Mock encrypted Rock
        uint256 wager = 10 ether;

        token.approve(address(rps), wager);
        uint256 gameId = rps.createGame(encryptedMove, wager, address(token));

        (
            address p1,
            address p2,
            ,
            ,
            ,
            ,
            uint256 wagerAmount,
            address wagerToken,
            ,
            ,

        ) = rps.getGame(gameId);

        assertEq(p1, player1);
        assertEq(p2, address(0));
        assertEq(wagerAmount, wager);
        assertEq(wagerToken, address(token));

        vm.stopPrank();
    }

    function testJoinAndDecrypt() public {
        // Player 1 creates game
        vm.startPrank(player1);
        bytes memory encrypted1 = hex"01"; // Rock
        uint256 wager = 10 ether;

        token.approve(address(rps), wager);
        uint256 gameId = rps.createGame(encrypted1, wager, address(token));
        vm.stopPrank();

        // Player 2 joins game
        vm.startPrank(player2);
        bytes memory encrypted2 = hex"02"; // Paper

        token.approve(address(rps), wager);
        vm.deal(player2, 0.06 ether);
        rps.joinGame{value: 0.06 ether}(gameId, encrypted2);
        vm.stopPrank();

        // Mock decryption callback (Rock vs Paper)
        vm.prank(address(0x1B)); // SUBMIT_CTX address
        bytes[] memory decrypted = new bytes[](2);
        decrypted[0] = hex"01"; // Rock
        decrypted[1] = hex"02"; // Paper

        bytes[] memory plaintext = new bytes[](1);
        plaintext[0] = abi.encode(gameId);

        rps.onDecrypt(decrypted, plaintext);

        // Verify player 2 won (Paper beats Rock)
        (, , , , , , , , , , address winner) = rps.getGame(gameId);
        assertEq(winner, player2);
    }

    function testDraw() public {
        // Player 1 creates game
        vm.startPrank(player1);
        bytes memory encrypted1 = hex"01"; // Rock
        uint256 wager = 10 ether;

        token.approve(address(rps), wager);
        uint256 gameId = rps.createGame(encrypted1, wager, address(token));
        vm.stopPrank();

        // Player 2 joins game
        vm.startPrank(player2);
        bytes memory encrypted2 = hex"01"; // Rock (same move)

        token.approve(address(rps), wager);
        vm.deal(player2, 0.06 ether);
        rps.joinGame{value: 0.06 ether}(gameId, encrypted2);
        vm.stopPrank();

        // Mock decryption callback (Rock vs Rock)
        vm.prank(address(0x1B));
        bytes[] memory decrypted = new bytes[](2);
        decrypted[0] = hex"01"; // Rock
        decrypted[1] = hex"01"; // Rock

        bytes[] memory plaintext = new bytes[](1);
        plaintext[0] = abi.encode(gameId);

        rps.onDecrypt(decrypted, plaintext);

        // Verify draw (no winner)
        (, , , , , , , , , , address winner) = rps.getGame(gameId);
        assertEq(winner, address(0));

        // Verify both players got refund
        assertEq(token.balanceOf(player1), 1000 ether);
        assertEq(token.balanceOf(player2), 1000 ether - 0.06 ether); // Minus gas
    }
}
```

**Run tests:**

```bash
forge test
```

## Resources

* **[BITE TypeScript SDK](https://github.com/skalenetwork/bite-ts)** - Frontend encryption library
* **[BITE Solidity Library](https://github.com/skalenetwork/bite-solidity)** - Solidity interfaces
* **[Full Demo Repository](https://github.com/TheGreatAxios/ctxs)** - Complete working example
* **[SKALE Documentation](https://docs.skale.space/llms.txt)** - Complete documentation index
