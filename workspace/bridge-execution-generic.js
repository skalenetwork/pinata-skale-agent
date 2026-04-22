#!/usr/bin/env node

/**
 * Universal SKALE Bridge Execution Script
 * 
 * Supports bridging between any EVM chains and SKALE Base
 * Uses OWS (Open Wallet Standard) for secure key management
 * 
 * Usage:
 *   node bridge-execution-generic.js --from monad --to skale-base --amount 10000
 * 
 * Environment:
 *   OWS_WALLET=<name> (default: skale-default)
 *   TRAILS_API_KEY (required)
 */

import { TrailsApi, RouteProvider } from '@0xtrails/api';
import { createPublicClient, http, encodeFunctionData, serializeTransaction } from 'viem';
import { execSync } from 'child_process';

// ============================================================================
// CONFIGURATION - All supported chains and USDC addresses
// ============================================================================

const CHAIN_MAP = {
  base: { id: 8453, name: 'Base', rpc: 'https://mainnet.base.org' },
  polygon: { id: 137, name: 'Polygon', rpc: 'https://polygon-bor-rpc.publicnode.com' },
  optimism: { id: 10, name: 'Optimism', rpc: 'https://mainnet.optimism.io' },
  arbitrum: { id: 42161, name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc' },
  avalanche: { id: 43114, name: 'Avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc' },
  monad: { id: 143, name: 'Monad', rpc: 'https://monad-mainnet.infura.io/v3/a90b0b1fcbf94ad3868db4b2b27024cb' },
  'skale-base': { id: 1187947933, name: 'SKALE Base', rpc: 'https://skale-base.skalenodes.com/v1/base' }
};

const USDC_ADDRESSES = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',         // Ethereum
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',       // Base
  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',        // Polygon
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',         // Optimism
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',      // Arbitrum
  43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',      // Avalanche
  143: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',        // Monad
  1187947933: '0x85889c8c714505E0c94b30fcfcF64fE3Ac8FCb20'   // SKALE Base
};

const IMA_DEPOSIT_BOX = '0x7f54e52D08C911eAbB4fDF00Ad36ccf07F867F61';
const TRAILS_ROUTER = '0xBaE357CBAA04a68cbfD5a560Ab06C4E9A3328A90';
const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const SKALE_CHAIN_NAME = 'winged-bubbly-grumium';

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

function signWithOWS(unsignedTxHex, chainId, walletName) {
  try {
    const result = JSON.parse(execSync(
      `OWS_WALLET=${walletName} ows sign tx --chain eip155:${chainId} --tx "${unsignedTxHex}" --json`,
      { encoding: 'utf8' }
    ).trim());
    return result;
  } catch (err) {
    console.error(`❌ OWS signing failed:`, err.message);
    throw err;
  }
}

function reconstructSignedTx(unsignedTx, signature, recoveryId) {
  const sigBytes = Buffer.from(signature, 'hex');
  const r = sigBytes.slice(0, 32);
  const s = sigBytes.slice(32, 64);

  function encodeInt(val) {
    if (val === 0n || val === 0) return Buffer.from([]);
    let hex = (typeof val === 'bigint' ? val : BigInt(val)).toString(16);
    if (hex.length % 2) hex = '0' + hex;
    return Buffer.from(hex, 'hex');
  }

  function encodeBuffer(buf) {
    if (typeof buf === 'string') buf = Buffer.from(buf.slice(2), 'hex');
    if (buf.length === 0) return Buffer.from([0x80]);
    if (buf.length === 1 && buf[0] < 0x80) return buf;
    if (buf.length < 56) return Buffer.concat([Buffer.from([0x80 + buf.length]), buf]);
    const lenBuf = encodeInt(buf.length);
    return Buffer.concat([Buffer.from([0xb7 + lenBuf.length]), lenBuf, buf]);
  }

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
  const txType = Buffer.from([0x02]);
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
// ARGUMENT PARSING
// ============================================================================

function parseArgs() {
  const config = {
    originChain: 'base',
    destinationChain: 'skale-base',
    amount: '10000',
    recipient: undefined
  };

  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--from' && process.argv[i + 1]) config.originChain = process.argv[++i];
    if (arg === '--to' && process.argv[i + 1]) config.destinationChain = process.argv[++i];
    if (arg === '--amount' && process.argv[i + 1]) config.amount = process.argv[++i];
    if (arg === '--recipient' && process.argv[i + 1]) config.recipient = process.argv[++i];
  }

  return config;
}

const config = parseArgs();

// Validate chains
if (!CHAIN_MAP[config.originChain]) {
  console.error(`❌ Unknown origin chain: ${config.originChain}`);
  console.error(`   Supported: ${Object.keys(CHAIN_MAP).join(', ')}`);
  process.exit(1);
}

if (!CHAIN_MAP[config.destinationChain]) {
  console.error(`❌ Unknown destination chain: ${config.destinationChain}`);
  console.error(`   Supported: ${Object.keys(CHAIN_MAP).join(', ')}`);
  process.exit(1);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

const TRAILS_API_KEY = process.env.TRAILS_API_KEY;
const WALLET_NAME = process.env.OWS_WALLET || 'skale-default';

if (!TRAILS_API_KEY) {
  console.error('❌ Missing TRAILS_API_KEY environment variable');
  process.exit(1);
}

async function main() {
  const trailsAPI = new TrailsApi(TRAILS_API_KEY);

  // Get signer address from OWS wallet
  let signerAddress;
  try {
    const walletList = execSync(`ows wallet list`, { encoding: 'utf8' });
    const match = walletList.match(new RegExp(`Name:\\s+${WALLET_NAME}[\\s\\S]*?eip155:1 \\(ethereum\\) → (0x[a-fA-F0-9]+)`));
    if (!match) throw new Error(`Wallet ${WALLET_NAME} not found or no EVM address`);
    signerAddress = match[1];
  } catch (err) {
    console.error(`❌ Failed to get signer address from OWS:`, err.message);
    process.exit(1);
  }

  const amountBigInt = BigInt(config.amount);
  const originChainInfo = CHAIN_MAP[config.originChain];
  const destChainInfo = CHAIN_MAP[config.destinationChain];
  const recipientAddress = config.recipient || signerAddress;

  console.log(`\n🌉 SKALE Bridge - Universal Execution`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📤 From: ${originChainInfo.name} (${originChainInfo.id})`);
  console.log(`📥 To: ${destChainInfo.name} (${destChainInfo.id})`);
  console.log(`💰 Amount: ${amountBigInt / 1000000n} USDC`);
  console.log(`👤 Recipient: ${recipientAddress}`);
  console.log(`🔑 Signer: ${signerAddress} (${WALLET_NAME})`);

  // Bridge TO SKALE
  if (config.destinationChain === 'skale-base') {
    const originChainId = originChainInfo.id;
    const originUSDC = USDC_ADDRESSES[originChainId];

    console.log(`\n🔀 Pattern: ${originChainId === 8453 ? 'Direct IMA' : 'Multi-hop via Base'}`);

    // 1. Get quote
    console.log(`\n⏳ Getting quote from Trails API...`);

    let destinationChainId = 8453;
    let destinationTokenAddress = BASE_USDC;
    let destinationToAddress, destinationCallData;

    if (originChainId === 8453) {
      // Base → SKALE: Direct IMA
      destinationToAddress = IMA_DEPOSIT_BOX;
      destinationCallData = encodeDepositERC20Direct(SKALE_CHAIN_NAME, BASE_USDC, amountBigInt, recipientAddress);
    } else {
      // Non-Base → SKALE: Multi-hop
      const imaCallData = encodeDepositERC20Direct(SKALE_CHAIN_NAME, BASE_USDC, PLACEHOLDER, recipientAddress);
      const wrapped = wrapWithTrailsRouter(BASE_USDC, IMA_DEPOSIT_BOX, imaCallData);
      destinationToAddress = wrapped.toAddress;
      destinationCallData = wrapped.callData;
    }

    const quote = await trailsAPI.quoteIntent({
      ownerAddress: signerAddress,
      originChainId,
      originTokenAddress: originUSDC,
      originTokenAmount: amountBigInt.toString(),
      destinationChainId,
      destinationTokenAddress,
      destinationToAddress,
      destinationCallData,
      slippageTolerance: 0.005,
      destinationCallValue: '0',
      tradeType: 'EXACT_INPUT',
      options: {
        bridgeProvider: RouteProvider.AUTO,
      },
    });

    const intentId = quote.intent.intentId;
    console.log(`✓ Intent ID: ${intentId}`);

    // 2. Commit intent
    console.log(`\n⏳ Committing intent...`);
    await trailsAPI.commitIntent({ intent: quote.intent });
    console.log(`✓ Intent committed`);

    // 3. Setup public client
    const publicClient = createPublicClient({
      chain: { id: originChainInfo.id, name: originChainInfo.name, nativeCurrency: { name: 'Native', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [originChainInfo.rpc] } } },
      transport: http(),
    });

    // 4. Check/approve allowance
    console.log(`\n⏳ Checking USDC allowance...`);
    const ERC20_ABI = [
      { name: 'allowance', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
      { name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }
    ];

    const allowance = await publicClient.readContract({
      address: originUSDC,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [signerAddress, quote.intent.depositTransaction.to]
    });

    console.log(`  Current allowance: ${allowance}`);

    if (allowance < amountBigInt) {
      console.log(`⏳ Approving USDC with OWS...`);
      
      const nonce = await publicClient.getTransactionCount({ address: signerAddress });
      const gasPrice = await publicClient.getGasPrice();
      const maxPriorityFeeRaw = await publicClient.request({ method: 'eth_maxPriorityFeePerGas' });
      const maxPriorityFee = typeof maxPriorityFeeRaw === 'string' ? BigInt(maxPriorityFeeRaw) : maxPriorityFeeRaw;

      const approveData = encodeFunctionData({
        abi: [{ name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }],
        functionName: 'approve',
        args: [quote.intent.depositTransaction.to, amountBigInt],
      });

      const unsignedApproveTx = {
        to: originUSDC,
        from: signerAddress,
        data: approveData,
        nonce,
        chainId: originChainId,
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

      const approveSign = signWithOWS(approveRlp, originChainId, WALLET_NAME);
      const signedApproveTx = reconstructSignedTx(unsignedApproveTx, approveSign.signature, approveSign.recovery_id);
      
      const approveTxHash = await broadcastTx(publicClient, signedApproveTx);
      console.log(`✓ Approval tx: ${approveTxHash}`);
      await new Promise(r => setTimeout(r, 5000));
    }

    // 5. Transfer USDC
    console.log(`\n⏳ Transferring USDC with OWS...`);
    
    const nonce = await publicClient.getTransactionCount({ address: signerAddress });
    const gasPrice = await publicClient.getGasPrice();
    const maxPriorityFeeRaw = await publicClient.request({ method: 'eth_maxPriorityFeePerGas' });
    const maxPriorityFee = typeof maxPriorityFeeRaw === 'string' ? BigInt(maxPriorityFeeRaw) : maxPriorityFeeRaw;

    const txValue = quote.intent.depositTransaction.value ? BigInt(quote.intent.depositTransaction.value) : 0n;

    const unsignedTransferTx = {
      to: quote.intent.depositTransaction.to,
      from: signerAddress,
      data: quote.intent.depositTransaction.data,
      nonce,
      chainId: originChainId,
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

    const transferSign = signWithOWS(transferRlp, originChainId, WALLET_NAME);
    const signedTransferTx = reconstructSignedTx(unsignedTransferTx, transferSign.signature, transferSign.recovery_id);
    
    const transferHash = await broadcastTx(publicClient, signedTransferTx);
    console.log(`✓ Transfer tx: ${transferHash}`);

    // 6. Wait for confirmation
    console.log(`\n⏳ Waiting for transfer to be confirmed...`);
    await publicClient.waitForTransactionReceipt({ hash: transferHash });
    console.log(`✓ Transfer confirmed!`);

    // 7. Execute intent
    console.log(`\n⏳ Executing bridge intent...`);
    await trailsAPI.executeIntent({
      intentId,
      depositTransactionHash: transferHash
    });
    console.log(`✓ Bridge execution initiated!`);

    // 8. Wait for completion
    console.log(`\n⏳ Waiting for bridge to complete (this may take 5-10 minutes)...`);
    const receipt = await trailsAPI.waitIntentReceipt({ intentId, timeoutMs: 600000 });
    console.log(`\n✅ Bridge ${receipt.intentStatus}!`);
    if (receipt.executionTransactionHash) {
      console.log(`   Execution tx: ${receipt.executionTransactionHash}`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Amount: ${amountBigInt / 1000000n} USDC`);
    console.log(`   From: ${originChainInfo.name}`);
    console.log(`   To: ${destChainInfo.name}`);
    console.log(`   Intent ID: ${intentId}`);
    console.log(`   Transfer TX: ${transferHash}\n`);
  } else {
    console.error(`❌ Unsupported bridge direction`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
