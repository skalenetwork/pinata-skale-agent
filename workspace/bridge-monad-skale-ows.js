import { OWS } from '@open-wallet-standard/core';
import { TrailsApi, TradeType, RouteProvider } from '@0xtrails/api';
import { createPublicClient, http, encodeFunctionData, getContractAddress } from 'viem';
import { monad, base } from 'viem/chains';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TRAILS_API_KEY = process.env.TRAILS_API_KEY;
if (!TRAILS_API_KEY) {
  console.error('❌ Missing TRAILS_API_KEY environment variable');
  process.exit(1);
}

const ows = new OWS();
const trailsAPI = new TrailsApi(TRAILS_API_KEY);

// Constants
const MONAD_CHAIN_ID = 143;
const BASE_CHAIN_ID = 8453;
const SKALE_CHAIN_ID = 1187947933;
const SKALE_CHAIN_NAME = 'winged-bubbly-grumium';

const MONAD_USDC = '0x754704Bc059F8C67012fEd69BC8A327a5aafb603';
const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const IMA_DEPOSIT_BOX = '0x7f54e52D08C911eAbB4fDF00Ad36ccf07F867F61';
const TRAILS_ROUTER = '0xBaE357CBAA04a68cbfD5a560Ab06C4E9A3328A90';

// Bridge params
const amountBigInt = BigInt('10000'); // 0.01 USDC (6 decimals)
const amountDisplay = Number(amountBigInt) / 1e6;

// ============================================================================
// HELPERS
// ============================================================================

const TRAILS_ROUTER_PLACEHOLDER_AMOUNT = 0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefn;

function encodeDepositERC20Direct(schainName, tokenAddress, amount, receiver) {
  const abi = [{
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
  }];
  return encodeFunctionData({ 
    abi, 
    functionName: 'depositERC20Direct', 
    args: [schainName, tokenAddress, amount, receiver] 
  });
}

function getAmountOffset(calldata, placeholder) {
  const hex = placeholder.toString(16).padStart(64, '0');
  const offset = calldata.toLowerCase().indexOf(hex.toLowerCase());
  if (offset === -1) return -1;
  return (offset - 2) / 2;
}

function wrapWithTrailsRouter(token, target, callData) {
  const amountOffset = getAmountOffset(callData, TRAILS_ROUTER_PLACEHOLDER_AMOUNT);
  if (amountOffset === -1) throw new Error('❌ Placeholder not found in calldata');

  const routerAbi = [{
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
  }];

  const placeholderBytes32 = `0x${TRAILS_ROUTER_PLACEHOLDER_AMOUNT.toString(16).padStart(64, '0')}`;

  return {
    callData: encodeFunctionData({
      abi: routerAbi,
      functionName: 'injectAndCall',
      args: [token, target, callData, BigInt(amountOffset), placeholderBytes32]
    }),
    toAddress: TRAILS_ROUTER
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function bridgeMonadToSkale() {
  console.log(`🌉 Bridge Monad → SKALE Base`);
  console.log(`   Amount: ${amountDisplay} USDC`);
  console.log(`   Route: Monad → Base → SKALE (multi-hop)\n`);

  // 1. Get wallet from OWS
  console.log(`⏳ Loading skale-default wallet from OWS...`);
  const wallet = ows.getWallet('skale-default');
  const signerAddress = wallet.getAddress('evm'); // EVM address from HD wallet
  console.log(`✓ Signer: ${signerAddress}\n`);

  // 2. Create Monad public client
  const monadPublicClient = createPublicClient({
    chain: {
      id: MONAD_CHAIN_ID,
      name: 'Monad',
      nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
      rpcUrls: { default: { http: ['https://mainnet.monadbtc.com'] } }
    },
    transport: http(),
  });

  // 3. Create Base public client
  const basePublicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  // 4. Build IMA calldata with placeholder
  console.log(`⏳ Building bridge route (Monad → Base → SKALE)...`);
  const imaCallData = encodeDepositERC20Direct(
    SKALE_CHAIN_NAME,
    BASE_USDC,
    TRAILS_ROUTER_PLACEHOLDER_AMOUNT,
    signerAddress
  );

  const wrapped = wrapWithTrailsRouter(BASE_USDC, IMA_DEPOSIT_BOX, imaCallData);
  console.log(`✓ Route prepared\n`);

  // 5. Get quote from Trails API
  console.log(`⏳ Getting quote from Trails API...`);
  const quote = await trailsAPI.quoteIntent({
    ownerAddress: signerAddress,
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
  console.log(`✓ Intent ID: ${intentId}`);
  console.log(`✓ Route: ${quote.intent.bridgeRoute?.routes?.[0]?.name || 'Trails Router'}\n`);

  // 6. Commit intent
  console.log(`⏳ Committing intent to Trails API...`);
  await trailsAPI.commitIntent({ intent: quote.intent });
  console.log(`✓ Intent committed\n`);

  // 7. Check USDC balance on Monad
  console.log(`⏳ Checking Monad USDC balance...`);
  const balance = await monadPublicClient.readContract({
    address: MONAD_USDC,
    abi: [{ name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }],
    functionName: 'balanceOf',
    args: [signerAddress],
  });

  if (balance < amountBigInt) {
    console.error(`❌ Insufficient USDC balance on Monad`);
    console.error(`   Available: ${Number(balance) / 1e6} USDC`);
    console.error(`   Required: ${amountDisplay} USDC`);
    process.exit(1);
  }
  console.log(`✓ Balance: ${Number(balance) / 1e6} USDC\n`);

  // 8. Approve USDC for Trails Router on Monad
  console.log(`⏳ Approving USDC on Monad for Trails Router...`);
  const nonce = await monadPublicClient.getTransactionCount({ address: signerAddress });
  
  // Build approve transaction
  const approveData = encodeFunctionData({
    abi: [{ name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }],
    functionName: 'approve',
    args: [quote.intent.depositTransaction.to, amountBigInt],
  });

  const unsignedApproveTx = {
    to: MONAD_USDC,
    from: signerAddress,
    data: approveData,
    nonce,
    chainId: MONAD_CHAIN_ID,
    gasLimit: 100000n,
    gasPrice: BigInt(1e9), // Placeholder, will be updated
  };

  // Get current gas price
  const gasPrice = await monadPublicClient.getGasPrice();
  unsignedApproveTx.gasPrice = gasPrice;

  console.log(`   TX: approve ${amountDisplay} USDC to ${quote.intent.depositTransaction.to}`);
  console.log(`⏳ Signing with OWS...`);

  // Sign with OWS
  const approveSignature = await wallet.signTransaction({
    chain: 'evm',
    unsignedTx: JSON.stringify(unsignedApproveTx)
  });

  console.log(`✓ Signed. Approval signature: ${approveSignature.signature.slice(0, 20)}...\n`);

  // 9. Send approve transaction
  console.log(`⏳ Broadcasting approve transaction on Monad...`);
  // Note: In production, you'd reconstruct the signed TX and broadcast it
  // For now, we'll use the quote's pre-built transaction
  console.log(`✓ Ready to broadcast (requires signed transaction reconstruction)\n`);

  // 10. Transfer USDC via Trails intent
  console.log(`⏳ Preparing bridge transfer...`);
  console.log(`   From: ${signerAddress}`);
  console.log(`   Via: Trails Router → IMA Deposit Box`);
  console.log(`   Amount: ${amountDisplay} USDC`);
  console.log(`   Destination: ${signerAddress} on SKALE Base\n`);

  console.log(`✅ Bridge execution ready!`);
  console.log(`\nTo complete the bridge:`);
  console.log(`1. Approve USDC on Monad (via signed transaction)`);
  console.log(`2. Execute Trails intent with ${intentId}`);
  console.log(`3. USDC will arrive on SKALE Base in 2-5 minutes\n`);

  console.log(`Intent Details:`);
  console.log(`  ID: ${intentId}`);
  console.log(`  Status: Ready for execution`);
  console.log(`  Deposit TX To: ${quote.intent.depositTransaction.to}`);
  console.log(`  Deposit TX Data: ${quote.intent.depositTransaction.data.slice(0, 50)}...`);
}

// Execute
bridgeMonadToSkale().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
