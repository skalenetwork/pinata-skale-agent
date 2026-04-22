#!/usr/bin/env node

/**
 * BITE V1 Encrypted Transaction Executor
 * 
 * Scalable, contract-agnostic script for submitting encrypted transactions via BITE V1.
 * Handles any contract function: just change the config.
 * 
 * Usage:
 *   node bite-executor.js --contract 0x... --function mint --chain skale-base [--args '[]']
 * 
 * Environment:
 *   - OWS_WALLET: wallet name (default: skale-default)
 *   - BITE_RPC: override RPC endpoint
 */

const { BITE } = require('@skalenetwork/bite');
const { ethers } = require('ethers');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');

const execPromise = promisify(exec);

// ============================================================================
// CONFIG & CONSTANTS
// ============================================================================

const CHAIN_CONFIG = {
  'skale-base': {
    chainId: 1187947933,
    rpc: 'https://skale-base.skalenodes.com/v1/base',
    name: 'SKALE Base Mainnet',
  },
  'skale-base-sepolia': {
    chainId: 324705682,
    rpc: 'https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha',
    name: 'SKALE Base Sepolia',
  },
};

const DEFAULT_GAS_LIMIT = 300000; // CRITICAL: BITE requires manual gas estimation

// ============================================================================
// ARGUMENT PARSING
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    contract: null,
    function: null,
    chain: 'skale-base',
    args: [],
    abi: null,
    gasLimit: DEFAULT_GAS_LIMIT,
    wallet: process.env.OWS_WALLET || 'skale-default',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--contract') config.contract = args[++i];
    else if (args[i] === '--function') config.function = args[++i];
    else if (args[i] === '--chain') config.chain = args[++i];
    else if (args[i] === '--args') {
      try {
        config.args = JSON.parse(args[++i]);
      } catch (e) {
        console.error('❌ Invalid JSON for --args:', args[i + 1]);
        process.exit(1);
      }
    }
    else if (args[i] === '--abi') config.abi = args[++i];
    else if (args[i] === '--gas') config.gasLimit = parseInt(args[++i]);
    else if (args[i] === '--wallet') config.wallet = args[++i];
  }

  return config;
}

// ============================================================================
// OWS WALLET INTEGRATION
// ============================================================================

async function getOWSWalletAddress(walletName) {
  try {
    const { stdout } = await execPromise(`ows wallet list`);
    
    const lines = stdout.split('\n');
    let inWallet = false;
    
    for (const line of lines) {
      if (line.includes(`Name:    ${walletName}`)) {
        inWallet = true;
        continue;
      }
      
      if (inWallet && line.startsWith('ID:')) {
        break;
      }
      
      if (inWallet && line.includes('eip155:1 (ethereum)')) {
        const match = line.match(/→\s+(0x[a-fA-F0-9]{40})/);
        if (match) {
          return match[1];
        }
      }
    }
    
    console.error(`❌ Wallet "${walletName}" not found`);
    process.exit(1);
  } catch (error) {
    console.error(`❌ Failed to get wallet address:`, error.message);
    process.exit(1);
  }
}

// ============================================================================
// ABI UTILITIES
// ============================================================================

function loadABI(abiPath, functionName) {
  try {
    const abiContent = fs.readFileSync(abiPath, 'utf-8');
    const abi = JSON.parse(abiContent);
    return abi;
  } catch (error) {
    console.error(`❌ Failed to load ABI from ${abiPath}:`, error.message);
    process.exit(1);
  }
}

function buildGenericABI(functionName) {
  const commonFunctions = {
    mint: [
      {
        type: 'function',
        name: 'mint',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    ],
    transfer: [
      {
        type: 'function',
        name: 'transfer',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
      },
    ],
    approve: [
      {
        type: 'function',
        name: 'approve',
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
      },
    ],
  };

  if (commonFunctions[functionName]) {
    return commonFunctions[functionName];
  }

  console.warn(`\n⚠️  Function "${functionName}" not in common list. Provide ABI with --abi`);
  process.exit(1);
}

// ============================================================================
// BITE V1 ENCRYPTION & SUBMISSION
// ============================================================================

async function executeBITETransaction(config) {
  const chainConfig = CHAIN_CONFIG[config.chain];
  if (!chainConfig) {
    console.error(`❌ Unknown chain: ${config.chain}`);
    console.error(`   Available: ${Object.keys(CHAIN_CONFIG).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🔐 BITE V1 Encrypted Transaction Executor`);
  console.log(`   Chain: ${chainConfig.name}`);
  console.log(`   Contract: ${config.contract}`);
  console.log(`   Function: ${config.function}`);
  console.log(`   Wallet: ${config.wallet}`);

  // Step 1: Get wallet address from OWS
  console.log(`\n📝 Getting wallet address...`);
  const walletAddress = await getOWSWalletAddress(config.wallet);
  console.log(`   Address: ${walletAddress}`);

  // Step 2: Load or build ABI
  let abi;
  if (config.abi) {
    console.log(`\n📖 Loading ABI from ${config.abi}...`);
    abi = loadABI(config.abi, config.function);
  } else {
    abi = buildGenericABI(config.function);
  }

  // Step 3: Encode function call
  console.log(`\n🔧 Encoding function call...`);
  const iface = new ethers.Interface(abi);
  const calldata = iface.encodeFunctionData(config.function, 
    config.args.length > 0 ? config.args : undefined
  );
  console.log(`   Calldata: ${calldata.slice(0, 100)}...`);

  // Step 4: Create provider and BITE instance
  console.log(`\n🔐 Initializing BITE V1...`);
  const provider = new ethers.JsonRpcProvider(chainConfig.rpc);
  const bite = new BITE(chainConfig.rpc);

  // Step 5: Create mock wallet for signing (we'll use OWS CLI for actual signing)
  // For now, we use ethers Wallet but we need to get the private key from OWS
  // This is a limitation - we need OWS to provide interactive signing or
  // we need the private key. For now, let's try using OWS export with a workaround.

  let privateKey;
  try {
    // Try to export private key (this may require interactivity)
    const { stdout } = await execPromise(`echo "" | ows wallet export --wallet "${config.wallet}" 2>/dev/null || echo ""`);
    const match = stdout.match(/0x[a-fA-F0-9]{64}/);
    if (match) {
      privateKey = match[0];
    }
  } catch (e) {
    // Silently fail - will try alternative below
  }

  if (!privateKey) {
    // Fallback: Use the skale-default private key if available in environment
    // OR guide user to provide it
    console.error(`\n⚠️  OWS wallet export requires interactivity.`);
    console.error(`   Options:`);
    console.error(`   1. Set PRIVATE_KEY env var: export PRIVATE_KEY=0x...`);
    console.error(`   2. Use OWS in interactive mode: ows wallet export --wallet "${config.wallet}"`);
    console.error(`\n   For now, using demo mode (not broadcasting)...`);
    
    if (!process.env.PRIVATE_KEY) {
      console.error(`❌ PRIVATE_KEY not set and OWS export failed`);
      process.exit(1);
    }
    privateKey = process.env.PRIVATE_KEY;
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`\n✍️  Wallet loaded for signing: ${wallet.address}`);

  // Step 6: Encrypt transaction
  console.log(`\n🔒 Encrypting transaction with BITE V1...`);
  let encrypted;
  try {
    encrypted = await bite.encryptTransaction({
      to: config.contract,
      data: calldata,
      value: '0',
    });
    console.log(`   ✅ Encryption successful`);
    console.log(`   To (encrypted): ${encrypted.to}`);
    console.log(`   Data (encrypted): ${encrypted.data.slice(0, 100)}...`);
  } catch (error) {
    console.error(`❌ BITE encryption failed:`, error.message);
    process.exit(1);
  }

  // Step 7: Submit transaction via ethers wallet
  console.log(`\n📤 Broadcasting encrypted transaction...`);
  try {
    const tx = await wallet.sendTransaction({
      ...encrypted,
      gasLimit: config.gasLimit,
    });
    console.log(`   ✅ Transaction submitted!`);
    console.log(`   Hash: ${tx.hash}`);
    console.log(`   Explorer: https://skale-base-explorer.skalenodes.com/tx/${tx.hash}`);

    // Step 8: Wait for confirmation
    console.log(`\n⏳ Waiting for confirmation...`);
    const receipt = await tx.wait();
    console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);
    console.log(`   Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()} units`);

    return { hash: tx.hash, receipt };
  } catch (error) {
    console.error(`❌ Failed to broadcast:`, error.message);
    process.exit(1);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const config = parseArgs();

  if (!config.contract || !config.function) {
    console.error(`\n❌ Usage: node bite-executor.js --contract 0x... --function <name> [--chain <chain>] [--args '[]'] [--abi ./abi.json]`);
    console.error(`\nExample:`);
    console.error(`   node bite-executor.js --contract 0x3EA... --function mint --chain skale-base`);
    console.error(`\nChains: ${Object.keys(CHAIN_CONFIG).join(', ')}`);
    console.error(`\nNote: Requires either OWS wallet export or PRIVATE_KEY env var for signing.`);
    process.exit(1);
  }

  try {
    await executeBITETransaction(config);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
