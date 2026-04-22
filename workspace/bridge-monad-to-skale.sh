#!/bin/bash

# Bridge Monad → SKALE Base using OWS wallet
# No private key export needed—OWS handles all signing internally

set -e

WALLET_NAME="skale-default"
TRAILS_API_KEY="${TRAILS_API_KEY:-}"

if [ -z "$TRAILS_API_KEY" ]; then
  echo "❌ Missing TRAILS_API_KEY environment variable"
  echo "Set it first: export TRAILS_API_KEY=your_key"
  exit 1
fi

echo "🌉 Bridge Monad → SKALE Base (0.01 USDC)"
echo ""

# 1. Get wallet address from OWS
echo "⏳ Getting wallet address from OWS..."
SIGNER=$(ows wallet info --wallet "$WALLET_NAME" --format json | jq -r '.addresses.evm')
if [ -z "$SIGNER" ]; then
  echo "❌ Could not get EVM address from wallet. Make sure $WALLET_NAME exists."
  exit 1
fi
echo "✓ Signer: $SIGNER"
echo ""

# 2. Run Node.js bridge preparation (builds intent, checks balance, etc.)
echo "⏳ Preparing bridge intent..."
node << 'EOF'
import { TrailsApi } from '@0xtrails/api';
import { createPublicClient, http, encodeFunctionData } from 'viem';

const TRAILS_API_KEY = process.env.TRAILS_API_KEY;
const SIGNER = process.env.SIGNER;

const trailsAPI = new TrailsApi(TRAILS_API_KEY);

const MONAD_CHAIN_ID = 143;
const BASE_CHAIN_ID = 8453;
const MONAD_USDC = '0x754704Bc059F8C67012fEd69BC8A327a5aafb603';
const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const IMA_DEPOSIT_BOX = '0x7f54e52D08C911eAbB4fDF00Ad36ccf07F867F61';
const TRAILS_ROUTER = '0xBaE357CBAA04a68cbfD5a560Ab06C4E9A3328A90';
const SKALE_CHAIN_NAME = 'winged-bubbly-grumium';

const amountBigInt = BigInt('10000'); // 0.01 USDC
const PLACEHOLDER = 0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefn;

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
  return offset === -1 ? -1 : (offset - 2) / 2;
}

function wrapWithTrailsRouter(token, target, callData) {
  const amountOffset = getAmountOffset(callData, PLACEHOLDER);
  if (amountOffset === -1) throw new Error('Placeholder not found');

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

  const placeholderBytes32 = `0x${PLACEHOLDER.toString(16).padStart(64, '0')}`;

  return {
    callData: encodeFunctionData({
      abi: routerAbi,
      functionName: 'injectAndCall',
      args: [token, target, callData, BigInt(amountOffset), placeholderBytes32]
    }),
    toAddress: TRAILS_ROUTER
  };
}

(async () => {
  // Build IMA call with placeholder
  const imaCallData = encodeDepositERC20Direct(
    SKALE_CHAIN_NAME,
    BASE_USDC,
    PLACEHOLDER,
    SIGNER
  );

  const wrapped = wrapWithTrailsRouter(BASE_USDC, IMA_DEPOSIT_BOX, imaCallData);

  // Get quote
  console.log('⏳ Getting quote from Trails API...');
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
  console.log(`✓ Intent ID: ${intentId}`);

  // Commit intent
  console.log('⏳ Committing intent...');
  await trailsAPI.commitIntent({ intent: quote.intent });
  console.log('✓ Intent committed');

  // Check balance on Monad
  const monadClient = createPublicClient({
    chain: {
      id: MONAD_CHAIN_ID,
      name: 'Monad',
      nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
      rpcUrls: { default: { http: ['https://mainnet.monadbtc.com'] } }
    },
    transport: http(),
  });

  console.log('⏳ Checking USDC balance on Monad...');
  const balance = await monadClient.readContract({
    address: MONAD_USDC,
    abi: [{ name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }],
    functionName: 'balanceOf',
    args: [SIGNER],
  });

  const amountDisplay = Number(amountBigInt) / 1e6;
  const balanceDisplay = Number(balance) / 1e6;

  if (balance < amountBigInt) {
    console.error(`\n❌ Insufficient USDC balance on Monad`);
    console.error(`   Available: ${balanceDisplay} USDC`);
    console.error(`   Required: ${amountDisplay} USDC`);
    process.exit(1);
  }
  console.log(`✓ Balance: ${balanceDisplay} USDC`);

  // Output results for bash
  console.log(JSON.stringify({
    intentId,
    depositTo: quote.intent.depositTransaction.to,
    depositData: quote.intent.depositTransaction.data,
    amountDisplay
  }));
})();
EOF

echo ""
echo "✅ Bridge prepared!"
echo "   Intent ready for execution"
echo "   USDC will bridge via Monad → Base → SKALE in 2-5 minutes"
