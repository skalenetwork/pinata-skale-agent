#!/usr/bin/env node

/**
 * Complete Monad → SKALE Base Bridge Execution
 * 
 * Full end-to-end:
 * 1. Query Monad RPC for nonce & gas prices
 * 2. Get Trails API quote & intent
 * 3. Build unsigned transactions
 * 4. Sign with OWS (skale-default)
 * 5. Broadcast to Monad RPC
 */

import { TrailsApi } from '@0xtrails/api';
import { createPublicClient, createWalletClient, http, encodeFunctionData, serializeTransaction } from 'viem';
import { execSync } from 'child_process';

// ============================================================================
// CONFIG
// ============================================================================

const TRAILS_API_KEY = process.env.TRAILS_API_KEY;
if (!TRAILS_API_KEY) {
  console.error('❌ Missing TRAILS_API_KEY');
  process.exit(1);
}

const SIGNER = '0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29'; // skale-default EVM
const WALLET_NAME = 'skale-default';

const MONAD_RPC = 'https://monad-mainnet.infura.io/v3/a90b0b1fcbf94ad3868db4b2b27024cb';
const MONAD_CHAIN_ID = 143;
const BASE_CHAIN_ID = 8453;

const MONAD_USDC = '0x754704Bc059F8C67012fEd69BC8A327a5aafb603';
const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const IMA_DEPOSIT_BOX = '0x7f54e52D08C911eAbB4fDF00Ad36ccf07F867F61';
const TRAILS_ROUTER = '0xBaE357CBAA04a68cbfD5a560Ab06C4E9A3328A90';
const SKALE_CHAIN_NAME = 'winged-bubbly-grumium';

const amountBigInt = BigInt('10000'); // 0.01 USDC
const amountDisplay = Number(amountBigInt) / 1e6;

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
  if (amountOffset === -1) throw new Error('Placeholder not found');

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

function signWithOWS(unsignedTxHex, chain) {
  try {
    const result = JSON.parse(execSync(
      `OWS_WALLET=${WALLET_NAME} ows sign tx --chain ${chain} --tx "${unsignedTxHex}" --json`,
      { encoding: 'utf8' }
    ).trim());
    return result;
  } catch (err) {
    console.error(`❌ OWS signing failed:`, err.message);
    throw err;
  }
}

function reconstructSignedTx(unsignedTx, signature, recoveryId) {
  // Extract r, s from signature hex
  const sigBytes = Buffer.from(signature, 'hex');
  const r = sigBytes.slice(0, 32);
  const s = sigBytes.slice(32, 64);

  // Helper to encode integers strictly (no leading zeros)
  function encodeInt(val) {
    if (val === 0n || val === 0) return Buffer.from([]);
    let hex = (typeof val === 'bigint' ? val : BigInt(val)).toString(16);
    if (hex.length % 2) hex = '0' + hex;
    return Buffer.from(hex, 'hex');
  }

  // Helper to encode buffer/string
  function encodeBuffer(buf) {
    if (typeof buf === 'string') buf = Buffer.from(buf.slice(2), 'hex');
    if (buf.length === 0) return Buffer.from([0x80]);
    if (buf.length === 1 && buf[0] < 0x80) return buf;
    if (buf.length < 56) return Buffer.concat([Buffer.from([0x80 + buf.length]), buf]);
    const lenBuf = encodeInt(buf.length);
    return Buffer.concat([Buffer.from([0xb7 + lenBuf.length]), lenBuf, buf]);
  }

  // RLP encode function
  function rlpEncode(items) {
    const encoded = Buffer.concat(items.map(item => {
      if (item === 0n || item === 0) return Buffer.from([0x80]);
      if (typeof item === 'bigint' || typeof item === 'number') {
        const buf = encodeInt(item);
        return encodeBuffer(buf);
      }
      if (typeof item === 'string') return encodeBuffer(item);
      if (Array.isArray(item)) return rlpEncode(item);
      return encodeBuffer(item);
    }));

    if (encoded.length < 56) return Buffer.concat([Buffer.from([0xc0 + encoded.length]), encoded]);
    const lenBuf = encodeInt(encoded.length);
    return Buffer.concat([Buffer.from([0xf7 + lenBuf.length]), lenBuf, encoded]);
  }

  // Build signed tx list (EIP-1559)
  const signedTxList = [
    unsignedTx.chainId,
    unsignedTx.nonce,
    unsignedTx.maxPriorityFeePerGas,
    unsignedTx.maxFeePerGas,
    unsignedTx.gasLimit,
    unsignedTx.to,
    unsignedTx.value,
    unsignedTx.data,
    unsignedTx.accessList || [],
    recoveryId,
    r,
    s
  ];

  const encoded = rlpEncode(signedTxList);
  const txType = Buffer.from([0x02]); // EIP-1559
  return '0x' + Buffer.concat([txType, encoded]).toString('hex');
}

async function broadcastTx(publicClient, signedTx) {
  try {
    const hash = await publicClient.request({
      method: 'eth_sendRawTransaction',
      params: [signedTx]
    });
    return hash;
  } catch (err) {
    console.error(`❌ Broadcast failed:`, err.message);
    throw err;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function bridgeMonadToSkale() {
  console.log(`\n🌉 Monad → SKALE Base Bridge (Complete Execution)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // 1. Setup Monad public client
  console.log(`📡 Connecting to Monad RPC (Infura)...`);
  const monadPublicClient = createPublicClient({
    chain: {
      id: MONAD_CHAIN_ID,
      name: 'Monad',
      nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
      rpcUrls: { default: { http: [MONAD_RPC] } }
    },
    transport: http(),
  });

  console.log(`✓ Connected\n`);

  // 2. Get nonce and gas prices
  console.log(`⏳ Querying wallet state on Monad...`);
  const nonceRaw = await monadPublicClient.getTransactionCount({ address: SIGNER });
  const nonce = typeof nonceRaw === 'bigint' ? nonceRaw : BigInt(nonceRaw);
  const gasPrice = await monadPublicClient.getGasPrice();
  const maxPriorityFeeRaw = await monadPublicClient.request({ method: 'eth_maxPriorityFeePerGas' });
  const maxPriorityFee = typeof maxPriorityFeeRaw === 'string' ? BigInt(maxPriorityFeeRaw) : BigInt(maxPriorityFeeRaw);

  console.log(`✓ Nonce: ${nonce}`);
  console.log(`✓ Gas Price: ${(gasPrice / BigInt(1e9))} Gwei`);
  console.log(`✓ Max Priority Fee: ${(maxPriorityFee / BigInt(1e9))} Gwei\n`);

  // 3. Build Trails route
  console.log(`⏳ Building bridge route via Trails API...`);
  const imaCallData = encodeDepositERC20Direct(SKALE_CHAIN_NAME, BASE_USDC, PLACEHOLDER, SIGNER);
  const wrapped = wrapWithTrailsRouter(BASE_USDC, IMA_DEPOSIT_BOX, imaCallData);

  const trailsAPI = new TrailsApi(TRAILS_API_KEY);
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
    tradeType: 'EXACT_INPUT',
  });

  const intentId = quote.intent.intentId;
  console.log(`✓ Intent ID: ${intentId}`);
  console.log(`✓ Destination: ${quote.intent.depositTransaction.to}\n`);

  // 4. Commit intent
  console.log(`⏳ Committing intent to Trails API...`);
  await trailsAPI.commitIntent({ intent: quote.intent });
  console.log(`✓ Intent committed\n`);

  // 5. Build approval transaction
  console.log(`📝 Step 1: Building Approval Transaction`);
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
    maxPriorityFeePerGas: maxPriorityFee,
    maxFeePerGas: gasPrice,
    accessList: [],
    value: 0n,
  };

  const approveRlp = serializeTransaction({
    to: unsignedApproveTx.to,
    from: unsignedApproveTx.from,
    data: unsignedApproveTx.data,
    nonce: unsignedApproveTx.nonce,
    chainId: unsignedApproveTx.chainId,
    gas: unsignedApproveTx.gasLimit,
    type: 'eip1559',
    maxPriorityFeePerGas: unsignedApproveTx.maxPriorityFeePerGas,
    maxFeePerGas: unsignedApproveTx.maxFeePerGas,
  });

  console.log(`   To: ${MONAD_USDC}`);
  console.log(`   Approve: ${quote.intent.depositTransaction.to} for ${amountDisplay} USDC\n`);

  // 6. Sign approval
  console.log(`⏳ Signing approval with OWS...`);
  const approveSign = signWithOWS(approveRlp, 'eip155:143');
  console.log(`✓ Signed: ${approveSign.signature.slice(0, 20)}...\n`);

  // 7. Build transfer transaction
  console.log(`📝 Step 2: Building Transfer Transaction`);
  
  const txValue = quote.intent.depositTransaction.value 
    ? BigInt(quote.intent.depositTransaction.value) 
    : BigInt(0);

  const unsignedTransferTx = {
    to: quote.intent.depositTransaction.to,
    from: SIGNER,
    data: quote.intent.depositTransaction.data,
    nonce: nonce + 1n,
    chainId: MONAD_CHAIN_ID,
    gasLimit: 500000n,
    maxPriorityFeePerGas: maxPriorityFee,
    maxFeePerGas: gasPrice,
    accessList: [],
    value: txValue,
  };

  const transferRlp = serializeTransaction({
    to: unsignedTransferTx.to,
    from: unsignedTransferTx.from,
    data: unsignedTransferTx.data,
    nonce: unsignedTransferTx.nonce,
    chainId: unsignedTransferTx.chainId,
    gas: unsignedTransferTx.gasLimit,
    type: 'eip1559',
    maxPriorityFeePerGas: unsignedTransferTx.maxPriorityFeePerGas,
    maxFeePerGas: unsignedTransferTx.maxFeePerGas,
    value: unsignedTransferTx.value,
  });

  console.log(`   Via: Trails Router (${quote.intent.depositTransaction.to})`);
  console.log(`   Route: Monad → Base → SKALE\n`);

  // 8. Sign transfer
  console.log(`⏳ Signing transfer with OWS...`);
  const transferSign = signWithOWS(transferRlp, 'eip155:143');
  console.log(`✓ Signed: ${transferSign.signature.slice(0, 20)}...\n`);

  // 9. Reconstruct signed transactions
  console.log(`⏳ Reconstructing signed transactions...\n`);
  
  const signedApproveTx = reconstructSignedTx(unsignedApproveTx, approveSign.signature, approveSign.recovery_id);
  console.log(`✓ Approval TX ready: ${signedApproveTx.slice(0, 50)}...\n`);

  const signedTransferTx = reconstructSignedTx(unsignedTransferTx, transferSign.signature, transferSign.recovery_id);
  console.log(`✓ Transfer TX ready: ${signedTransferTx.slice(0, 50)}...\n`);

  // 10. Broadcast transactions
  console.log(`🚀 Broadcasting transactions to Monad...\n`);

  console.log(`📤 Broadcasting Approval...`);
  const approveTxHash = await broadcastTx(monadPublicClient, signedApproveTx);
  console.log(`✓ Approval TX: ${approveTxHash}\n`);

  // Wait a bit before sending transfer
  console.log(`⏳ Waiting 3 seconds before transfer...`);
  await new Promise(r => setTimeout(r, 3000));

  console.log(`📤 Broadcasting Transfer...`);
  const transferTxHash = await broadcastTx(monadPublicClient, signedTransferTx);
  console.log(`✓ Transfer TX: ${transferTxHash}`);

  // 10. Wait for transfer confirmation
  console.log(`\n⏳ Waiting for transfer confirmation...`);
  await monadPublicClient.waitForTransactionReceipt({ hash: transferTxHash });
  console.log(`✓ Transfer confirmed!\n`);

  // 11. Execute intent with Trails API
  console.log(`\n⏳ Executing Trails intent...`);
  await trailsAPI.executeIntent({ intentId, depositTransactionHash: transferTxHash });
  console.log(`✓ Intent execution initiated\n`);

  // 12. Wait for completion
  console.log(`⏳ Waiting for bridge to complete (this may take 2-5 minutes)...`);
  const receipt = await trailsAPI.waitIntentReceipt({ intentId, timeoutMs: 600000 }); // 10 minute timeout
  
  console.log(`✓ Bridge ${receipt.intentStatus}`);
  if (receipt.executionTransactionHash) console.log(`  Execution TX: ${receipt.executionTransactionHash}\n`);

  // 13. Summary
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Bridge Execution Complete!\n`);
  console.log(`📊 Summary:`);
  console.log(`   Amount: ${amountDisplay} USDC`);
  console.log(`   From: ${SIGNER}`);
  console.log(`   Route: Monad → Base → SKALE`);
  console.log(`   Intent ID: ${intentId}`);
  console.log(`   Approval TX: ${approveTxHash}`);
  console.log(`   Transfer TX: ${transferTxHash}`);
  if (receipt.executionTransactionHash) console.log(`   Execution TX: ${receipt.executionTransactionHash}`);
  console.log(`   Status: ${receipt.intentStatus}\n`);
  console.log(`🔗 Track on Blockscout:`);
  console.log(`   Monad Approval: https://monadbtc.blockscout.com/tx/${approveTxHash}`);
  console.log(`   Monad Transfer: https://monadbtc.blockscout.com/tx/${transferTxHash}`);
  console.log(`   Intent Details: https://dashboard.trails.build/intents/${intentId}\n`);
}

// Execute
bridgeMonadToSkale().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
