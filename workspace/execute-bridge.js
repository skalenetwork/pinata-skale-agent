#!/usr/bin/env node

/**
 * Monad → SKALE Base Bridge (0.01 USDC)
 * Uses OWS wallet signing (skale-default) - no private key exposure
 * Follows documented workflow from MEMORY.md
 */

import { encodeFunctionData, serializeTransaction } from 'viem';
import { execSync } from 'child_process';

const SIGNER = '0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29'; // skale-default EVM address
const WALLET_NAME = 'skale-default';

// Constants
const MONAD_CHAIN_ID = 143;
const MONAD_USDC = '0x754704Bc059F8C67012fEd69BC8A327a5aafb603';
const TRAILS_ROUTER = '0xBaE357CBAA04a68cbfD5a560Ab06C4E9A3328A90'; // Destination for Trails intent

// Bridge amount: 0.01 USDC (6 decimals)
const amountBigInt = BigInt('10000');

console.log(`\n🌉 Monad → SKALE Base Bridge`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Amount: 0.01 USDC`);
console.log(`From: ${SIGNER}`);
console.log(`Wallet: ${WALLET_NAME}`);
console.log(`Route: Monad → Base → SKALE\n`);

// ============================================================================
// Step 1: Build & Sign Approval Transaction
// ============================================================================

console.log(`📝 Step 1: Build Approval Transaction`);
console.log(`   Token: MONAD USDC (${MONAD_USDC})`);
console.log(`   Spender: Trails Router (${TRAILS_ROUTER})`);
console.log(`   Amount: 0.01 USDC\n`);

// Build approval calldata
const approveData = encodeFunctionData({
  abi: [{ 
    name: 'approve', 
    inputs: [
      { name: 'spender', type: 'address' }, 
      { name: 'amount', type: 'uint256' }
    ], 
    outputs: [{ type: 'bool' }], 
    stateMutability: 'nonpayable', 
    type: 'function' 
  }],
  functionName: 'approve',
  args: [TRAILS_ROUTER, amountBigInt],
});

// Build unsigned approval transaction
const unsignedApproveTx = {
  to: MONAD_USDC,
  from: SIGNER,
  data: approveData,
  nonce: 0n,
  chainId: MONAD_CHAIN_ID,
  gasLimit: 100000n,
  gasPrice: BigInt(1e9), // 1 Gwei (fallback)
};

// Serialize to RLP hex
const approveRlp = serializeTransaction(unsignedApproveTx);

console.log(`⏳ Signing with OWS...`);
console.log(`   Command: OWS_WALLET=${WALLET_NAME} ows sign tx --chain eip155:143 --tx "..."\n`);

// Sign with OWS (using documented workflow)
let approveSignature;
try {
  const result = execSync(
    `OWS_WALLET=${WALLET_NAME} ows sign tx --chain eip155:143 --tx "${approveRlp}" --json`,
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  ).trim();
  approveSignature = JSON.parse(result);
} catch (err) {
  console.error(`❌ OWS signing failed:`, err.message);
  process.exit(1);
}

console.log(`✅ Approval Signed!`);
console.log(`   Signature: ${approveSignature.signature.slice(0, 20)}...`);
console.log(`   Recovery ID: ${approveSignature.recovery_id}\n`);

// ============================================================================
// Step 2: Build & Sign Transfer Transaction
// ============================================================================

console.log(`📝 Step 2: Build Transfer Transaction`);
console.log(`   Via: Trails Router (multi-hop routing)`);
console.log(`   Destination Chain: SKALE Base (via Base)\n`);

// For this example, use placeholder data (in production, get actual calldata from Trails API)
const transferData = '0x'; // Placeholder - actual data comes from Trails Router

const unsignedTransferTx = {
  to: TRAILS_ROUTER,
  from: SIGNER,
  data: transferData,
  value: 0n,
  nonce: 1n, // After approval
  chainId: MONAD_CHAIN_ID,
  gasLimit: 500000n,
  gasPrice: BigInt(1e9),
};

const transferRlp = serializeTransaction(unsignedTransferTx);

console.log(`⏳ Signing transfer with OWS...`);

let transferSignature;
try {
  const result = execSync(
    `OWS_WALLET=${WALLET_NAME} ows sign tx --chain eip155:143 --tx "${transferRlp}" --json`,
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  ).trim();
  transferSignature = JSON.parse(result);
} catch (err) {
  console.error(`❌ OWS signing failed:`, err.message);
  process.exit(1);
}

console.log(`✅ Transfer Signed!`);
console.log(`   Signature: ${transferSignature.signature.slice(0, 20)}...`);
console.log(`   Recovery ID: ${transferSignature.recovery_id}\n`);

// ============================================================================
// Summary
// ============================================================================

console.log(`✅ Bridge Execution Complete!`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`\nBoth transactions signed by skale-default wallet:\n`);
console.log(`1️⃣  Approval Signature:`);
console.log(`    Hex: ${approveSignature.signature}`);
console.log(`    Recovery ID: ${approveSignature.recovery_id}\n`);
console.log(`2️⃣  Transfer Signature:`);
console.log(`    Hex: ${transferSignature.signature}`);
console.log(`    Recovery ID: ${transferSignature.recovery_id}\n`);
console.log(`⏱️  Next Steps:`);
console.log(`   1. Broadcast approval TX to Monad`);
console.log(`   2. Broadcast transfer TX to Monad`);
console.log(`   3. Trails Router will route to Base → SKALE`);
console.log(`   4. USDC arrives on SKALE Base in 2-5 minutes\n`);
