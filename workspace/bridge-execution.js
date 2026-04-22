import { TrailsApi } from '@0xtrails/api';
import { createWalletClient, createPublicClient, http, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// Config
const trails_api_key = process.env.TRAILS_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!trails_api_key || !PRIVATE_KEY) {
  console.error('Missing TRAILS_API_KEY or PRIVATE_KEY');
  process.exit(1);
}

const trailsAPI = new TrailsApi(trails_api_key);
const account = privateKeyToAccount(PRIVATE_KEY);

// Constants
const BASE_CHAIN_ID = 8453;
const SKALE_CHAIN_NAME = "winged-bubbly-grumium";
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const IMA_DEPOSIT_BOX = "0x7f54e52D08C911eAbB4fDF00Ad36ccf07F867F61";

// Bridge params
const amountBigInt = BigInt('10000'); // 0.01 USDC (6 decimals)
const recipientAddress = '0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29';

console.log(`Bridge: 0.01 USDC from Base to SKALE Base`);
console.log(`From: ${account.address}`);
console.log(`To: ${recipientAddress}`);

// Encode IMA call
function encodeDepositERC20Direct(schainName, tokenAddress, amount, receiver) {
  const abi = [
    {
      inputs: [
        { internalType: "string", name: "schainName", type: "string" },
        { internalType: "address", "name": "erc20OnMainnet", type: "address" },
        { internalType: "uint256", "name": "amount", type: "uint256" },
        { internalType: "address", "name": "receiver", type: "address" }
      ],
      name: "depositERC20Direct",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    }
  ];

  return encodeFunctionData({
    abi,
    functionName: 'depositERC20Direct',
    args: [schainName, tokenAddress, amount, receiver]
  });
}

const imaCalldata = encodeDepositERC20Direct(
  SKALE_CHAIN_NAME,
  BASE_USDC,
  amountBigInt,
  recipientAddress
);

console.log(`\n📋 IMA Calldata: ${imaCalldata.slice(0, 50)}...`);

// Get quote
console.log(`\n⏳ Getting quote from Trails API...`);
const quote = await trailsAPI.quoteIntent({
  ownerAddress: account.address,
  originChainId: BASE_CHAIN_ID,
  originTokenAddress: BASE_USDC,
  originTokenAmount: amountBigInt.toString(),
  destinationChainId: BASE_CHAIN_ID,
  destinationTokenAddress: BASE_USDC,
  destinationTokenAmount: amountBigInt.toString(),
  destinationToAddress: IMA_DEPOSIT_BOX,
  destinationCallData: imaCalldata,
  slippageTolerance: 0.005,
  destinationCallValue: '0',
  tradeType: 'EXACT_INPUT',
});

console.log(`✓ Quote received`);
const intentId = quote.intent.intentId;
console.log(`✓ Intent ID: ${intentId}`);

// Commit intent
console.log(`\n⏳ Committing intent...`);
await trailsAPI.commitIntent({ intent: quote.intent });
console.log(`✓ Intent committed`);

// Setup clients
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(),
});

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

// Check allowance
console.log(`\n⏳ Checking USDC allowance...`);
const ERC20_ABI = [
  {
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

const allowance = await publicClient.readContract({
  address: BASE_USDC,
  abi: ERC20_ABI,
  functionName: 'allowance',
  args: [account.address, quote.intent.depositTransaction.to],
});

console.log(`  Current allowance: ${allowance}`);

if (allowance < amountBigInt) {
  console.log(`⏳ Approving USDC...`);
  const nonce = await publicClient.getTransactionCount({ address: account.address });
  const approveTx = await walletClient.writeContract({
    nonce,
    address: BASE_USDC,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [quote.intent.depositTransaction.to, amountBigInt],
  });
  console.log(`✓ Approval tx: ${approveTx}`);
  await new Promise(r => setTimeout(r, 5000));
}

// Transfer USDC
console.log(`\n⏳ Transferring USDC...`);
const nonce = await publicClient.getTransactionCount({ address: account.address });

const transferHash = await walletClient.sendTransaction({
  nonce,
  to: quote.intent.depositTransaction.to,
  data: quote.intent.depositTransaction.data,
  value: quote.intent.depositTransaction.value ? BigInt(quote.intent.depositTransaction.value) : 0n,
});

console.log(`✓ Transfer tx: ${transferHash}`);

// Wait for confirmation
console.log(`\n⏳ Waiting for transfer to be confirmed...`);
await publicClient.waitForTransactionReceipt({ hash: transferHash });
console.log(`✓ Transfer confirmed!`);

// Execute intent
console.log(`\n⏳ Executing bridge intent...`);
await trailsAPI.executeIntent({
  intentId: intentId,
  depositTransactionHash: transferHash,
});
console.log(`✓ Bridge execution initiated!`);

// Wait for receipt
console.log(`\n⏳ Waiting for bridge to complete (this may take a few minutes)...`);
const receipt = await trailsAPI.waitIntentReceipt({ intentId, timeoutMs: 300000 });
console.log(`\n✅ Bridge ${receipt.intentStatus}!`);
if (receipt.executionTransactionHash) {
  console.log(`   Execution tx: ${receipt.executionTransactionHash}`);
}
