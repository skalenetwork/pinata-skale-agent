#!/usr/bin/env node

/**
 * Monad → SKALE Base Bridge Execution
 * 
 * Uses OWS wallet (skale-default) to sign all transactions securely.
 * Private key never exposed—only signatures returned from OWS.
 */

import { TrailsApi } from '@0xtrails/api';
import { createPublicClient, createWalletClient, http, encodeFunctionData, serializeTransaction, parseGwei } from 'viem';
import { monad, base } from 'viem/chains';
import { execSync } from 'child_process';

// ============================================================================
// CONFIG
// ============================================================================

const TRAILS_API_KEY = process.env.TRAILS_API_KEY;
if (!TRAILS_API_KEY) {
  console.error('❌ Missing TRAILS_API_KEY');
  process.exit(1);
}

const trailsAPI = new TrailsApi(TRAILS_API_KEY);
const SIGNER = '0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29'; // skale-default EVM address
const WALLET_NAME = 'skale-default';

// Chain & Token Addresses
const MONAD_CHAIN_ID = 143;
const BASE_CHAIN_ID = 8453;
const MONAD_USDC = '0x754704Bc059F8C67012fEd69BC8A327a5aafb603';
const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const IMA_DEPOSIT_BOX = '0x7f54e52D08C911eAbB4fDF00Ad36ccf07F867F61';
const TRAILS_ROUTER = '0xBaE357CBAA04a68cbfD5a560Ab06C4E9A3328A90';
const SKALE_CHAIN_NAME = 'winged-bubbly-grumium';

// Bridge Amount: 0.01 USDC (6 decimals)
const amountBigInt = BigInt('10000');
const amountDisplay = Number(amountBigInt) / 1e6;

// Placeholder for Trails Router injection
const PLACEHOLDER = 0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefn;

// ============================================================================
// HELPERS
// ============================================================================

function encodeDepositERC20Direct(schainName, tokenAddress, amount, receiver) {
  return encodeFunctionData({
    abi: [{
      inputs: [
        { internalType: 'string', name: 'schainName', type: 'string' },
        { internalType: 'address', name: 'erc20OnMainnet', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
        { internalType: 'address', name: 'receiver', type: 'address' }
      ],
      name: 'depositERC20Direct',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }],
    functionName: 'depositERC20Direct',
    args: [schainName, tokenAddress, amount, receiver]
  });
}

function getAmountOffset(calldata, placeholder) {
  const hex = placeholder.toString(16).padStart(64, '0');
  const offset = calldata.toLowerCase().indexOf(hex.toLowerCase());
  return offset === -1 ? -1 : (offset - 2) / 2;
}

function wrapWithTrailsRouter(token, target, callData) {
  const amountOffset = getAmountOffset(callData, PLACEHOLDER);
  if (amountOffset === -1) throw new Error('Placeholder not found in IMA calldata');

  return {
    callData: encodeFunctionData({
      abi: [{
        inputs: [
          { name: 'token', type: 'address' },
          { name: 'target', type: 'address' },
          { name: 'callData', type: 'bytes' },
          { name: 'amountOffset', type: 'uint256' },
          { name: 'placeholder', type: 'bytes32' }
        ],
        name: 'injectAndCall',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      }],
      functionName: 'injectAndCall',
      args: [token, target, callData, BigInt(amountOffset), `0x${PLACEHOLDER.toString(16).padStart(64, '0')}`]
    }),
    toAddress: TRAILS_ROUTER
  };
}

function signWithOWS(unsignedTxHex, chainName) {
  console.log(`   🔐 Signing with OWS wallet (${WALLET_NAME})...`);
  try {
    const result = JSON.parse(execSync(`OWS_WALLET=${WALLET_NAME} ows sign tx --chain ${chainName} --tx "${unsignedTxHex}" --json`, { encoding: 'utf8' }).trim());
    return result;
  } catch (err) {
    console.error(`   ❌ OWS signing failed:`, err.message);
    throw err;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function bridgeMonadToSkale() {
  console.log(`\n🌉 Monad → SKALE Base Bridge`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Amount: ${amountDisplay} USDC`);
  console.log(`From: ${SIGNER}`);
  console.log(`Wallet: ${WALLET_NAME}`);
  console.log(`Route: Monad → Base → SKALE\n`);

  // 1. Setup clients
  const monadPublicClient = createPublicClient({
    chain: {
      id: MONAD_CHAIN_ID,
      name: 'Monad',
      nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
      rpcUrls: { default: { http: ['https://mainnet.monadbtc.com'] } }
    },
    transport: http(),
  });

  const basePublicClient = createPublicClient({ chain: base, transport: http() });

  // 2. Check balance on Monad
  console.log(`⏳ Checking USDC balance on Monad...`);
  const balance = await monadPublicClient.readContract({
    address: MONAD_USDC,
    abi: [{ name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }],
    functionName: 'balanceOf',
    args: [SIGNER],
  });

  if (balance < amountBigInt) {
    console.error(`❌ Insufficient balance on Monad`);
    console.error(`   Available: ${Number(balance) / 1e6} USDC`);
    console.error(`   Required: ${amountDisplay} USDC`);
    process.exit(1);
  }
  console.log(`✓ Balance: ${Number(balance) / 1e6} USDC\n`);

  // 3. Build route and get quote
  console.log(`⏳ Building bridge route (IMA via Trails Router)...`);
  const imaCallData = encodeDepositERC20Direct(SKALE_CHAIN_NAME, BASE_USDC, PLACEHOLDER, SIGNER);
  const wrapped = wrapWithTrailsRouter(BASE_USDC, IMA_DEPOSIT_BOX, imaCallData);

  console.log(`⏳ Getting quote from Trails API...`);
  const quote = await trailsAPI.quoteIntent({
    ownerAddress: SIGNER,
    originChainId: MONAD_CHAIN_ID,
    originTokenAddress: MONAD_USDC,
    originTokenAmount: amountBigInt.toString(),
    destinationChainId: BASE_CHAIN_ID,
    destinationTokenAddress: BASE_USDC,
    destinationTokenAmount: amountBigInt.toString(),
    destinationToAddress: wrapped.toAddress,
    destinationCallData: wrapped.callData,
    slippageTolerance: 0.005,
    destinationCallValue: '0',
    tradeType: 'EXACT_INPUT',
  });

  const intentId = quote.intent.intentId;
  console.log(`✓ Intent ID: ${intentId}\n`);

  // 4. Commit intent
  console.log(`⏳ Committing intent to Trails API...`);
  await trailsAPI.commitIntent({ intent: quote.intent });
  console.log(`✓ Intent committed\n`);

  // 5. Approve USDC on Monad
  console.log(`⏳ Step 1: Approve USDC on Monad`);
  console.log(`   To: ${quote.intent.depositTransaction.to}`);
  console.log(`   Amount: ${amountDisplay} USDC`);

  const nonce = await monadPublicClient.getTransactionCount({ address: SIGNER });
  const gasPrice = await monadPublicClient.getGasPrice();

  const approveData = encodeFunctionData({
    abi: [{ name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }],
    functionName: 'approve',
    args: [quote.intent.depositTransaction.to, amountBigInt],
  });

  const unsignedApproveTx = {
    to: MONAD_USDC,
    from: SIGNER,
    data: approveData,
    nonce,
    chainId: MONAD_CHAIN_ID,
    gasLimit: 100000n,
    gasPrice,
  };

  const approveRlp = serializeTransaction(unsignedApproveTx);
  const approveSignature = signWithOWS(approveRlp, 'monad');
  console.log(`✓ Signed: ${approveSignature.signature.slice(0, 20)}...\n`);

  // 6. Transfer USDC via Trails intent
  console.log(`⏳ Step 2: Execute bridge transfer on Monad`);
  console.log(`   Via: Trails Router (multi-hop routing)`);
  console.log(`   Destination: SKALE Base`);

  const transferNonce = nonce + 1n;
  const unsignedTransferTx = {
    to: quote.intent.depositTransaction.to,
    from: SIGNER,
    data: quote.intent.depositTransaction.data,
    value: quote.intent.depositTransaction.value ? BigInt(quote.intent.depositTransaction.value) : 0n,
    nonce: transferNonce,
    chainId: MONAD_CHAIN_ID,
    gasLimit: 500000n,
    gasPrice,
  };

  const transferRlp = serializeTransaction(unsignedTransferTx);
  const transferSignature = signWithOWS(transferRlp, 'monad');
  console.log(`✓ Signed: ${transferSignature.signature.slice(0, 20)}...\n`);

  // 7. Summary
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Bridge Execution Prepared!\n`);
  console.log(`Intent ID: ${intentId}`);
  console.log(`Amount: ${amountDisplay} USDC`);
  console.log(`Route: Monad → Base → SKALE`);
  console.log(`Signer: ${SIGNER}`);
  console.log(`\nTransactions ready for broadcast:`);
  console.log(`  1. Approval TX (Monad USDC → Router)`);
  console.log(`  2. Transfer TX (via Trails Router → IMA → SKALE)\n`);
  console.log(`⏱️  Estimated Time: 2-5 minutes for USDC arrival on SKALE Base\n`);
  console.log(`Next Steps:`);
  console.log(`  1. Broadcast approve transaction to Monad`);
  console.log(`  2. Broadcast transfer transaction to Monad`);
  console.log(`  3. Wait for Trails intent to complete\n`);
}

// Execute
bridgeMonadToSkale().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
