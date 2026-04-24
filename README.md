# SKALE Agent

A powerful AI agent for building and managing applications on the SKALE Base with cross-chain bridging, automonomos contract deployment, SKALE specific features like RNG, and autonomous agent-to-agent payments.

## Overview

This agent provides a comprehensive toolkit for developers building on SKALE, including smart contract deployment, cross-chain USDC transfers, privacy-preserving transactions, AI-powered content generation, and autonomous payment protocols.

## Core Features

- **Multi-Transaction Mode (MTM)** — High-performance batch operations (~700 TPS)
- **Cross-Chain Bridging** — Bridge USDC between any EVM chain and SKALE
- **Privacy-Preserving Transactions** — MEV-resistant encrypted transactions via BITE Protocol
- **Autonomous Agent Payments** — HTTP 402 payment protocol for agent-to-agent economies
- **AI Content Generation** — Image and video generation with automatic x402 payments
- **Secure Wallet Management** — Offline-first multi-chain wallet (EVM, Solana, Bitcoin, Cosmos, etc.)

## Skills

### SKALE-Deploy
Deploy smart contracts and build dApps on SKALE Network. Supports Foundry/Hardhat, ERC-8004 AI agent registration, and native on-chain RNG.

**Requirements:** Foundry or Hardhat, OWS wallet recommended

### SKALE-Bridge
Bridge USDC bidirectionally between any EVM-compatible chain (Base, Polygon, Ethereum, Optimism, Arbitrum, Avalanche, Monad) and SKALE Base Chain.

**Requirements:** `TRAILS_API_KEY` — Get it at [https://dashboard.trails.build/](https://dashboard.trails.build/)

### SKALE-Bite
Build privacy-preserving applications with BITE Protocol. Adds threshold encryption to SKALE while maintaining EVM compatibility. Supports encrypted mempool transactions and Conditional Transactions (CTX).

### SKALE-x402
Implement the x402 protocol for autonomous agent-to-agent payments on SKALE. Extends HTTP with native payment capabilities using 402 status codes and gasless micropayments via ERC-3009.

### SKALE-Partners
Gateway to SKALE ecosystem partners. Currently featuring **Xona AI** for AI-powered image and video generation with automatic x402 payments.

#### Xona
AI-powered content generation with automatic payments. 8 image models ($0.03-$0.20) and video generation ($0.50) with payments handled automatically through x402 protocol.

### OWS
Secure, offline-first multi-chain wallet management. Supports 10+ chains including EVM, Solana, Bitcoin, Cosmos, Tron, and TON. Keys encrypted at rest with AES-256-GCM.

### Pinata-platform
Platform self-service operations for managing skills, agents, secrets, tasks, channels, and templates. Complete CLI for Pinata agents.

## Getting Started

### Prerequisites

- Node.js 18+
- Foundry or Hardhat (for contract deployment)
- OWS wallet (recommended for all operations)

### Installation

```bash
npm install
```

### Configuration

For **SKALE-Bridge** functionality, set your Trails API key:

```bash
export TRAILS_API_KEY=your_api_key_here
```

Get your API key at [https://dashboard.trails.build/](https://dashboard.trails.build/)

## Network Information

- **Production:** SKALE Base (Chain ID: `1187947933`)
- **Testnet:** SKALE Base Sepolia (Chain ID: `324705682`)
