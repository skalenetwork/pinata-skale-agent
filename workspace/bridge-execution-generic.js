import { TrailsApi, RouteProvider } from '@0xtrails/api';
import { createWalletClient, createPublicClient, http, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, polygon, optimism, arbitrum, avalanche } from 'viem/chains';

// ============================================================================
// CONFIGURATION - All supported chains and USDC addresses
// ============================================================================

const CHAIN_MAP = {
  base: { id: 8453, chain: base, name: 'Base' },
  polygon: { id: 137, chain: polygon, name: 'Polygon' },
  optimism: { id: 10, chain: optimism, name: 'Optimism' },
  arbitrum: { id: 42161, chain: arbitrum, name: 'Arbitrum' },
  avalanche: { id: 43114, chain: avalanche, name: 'Avalanche' },
  monad: { id: 143, chain: { id: 143, name: 'Monad', nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 }, rpcUrls: { default: { http: ['https://monad-mainnet.infura.io/v3/a90b0b1fcbf94ad3868db4b2b27024cb'] } } }, name: 'Monad' },
  'skale-base': { id: 1187947933, chain: { id: 1187947933, name: 'SKALE Base', nativeCurrency: { name: 'Credits', symbol: 'CREDIT', decimals: 18 }, rpcUrls: { default: { http: ['https://skale-base.skalenodes.com/v1/base'] } } }, name: 'SKALE Base' }
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

// IMA and Trails Router contracts
const IMA_DEPOSIT_BOX = '0x7f54e52D08C911eAbB4fDF00Ad36ccf07F867F61';
const TRAILS_ROUTER = '0xBaE357CBAA04a68cbfD5a560Ab06C4E9A3328A90';
const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const SKALE_CHAIN_NAME = 'winged-bubbly-grumium';

// Community Pool (for SKALE → Base)
const COMMUNITY_POOL = '0x7153b03C04E0DeeDB24FD745F6765C676E33330c';
const COMMUNITY_LOCKER = '0xD2aaa00300000000000000000000000000000000';
const TOKEN_MANAGER_ERC20 = '0xD2aAA00500000000000000000000000000000000';
const SKALE_USDC = '0x85889c8c714505E0c94b30fcfcF64fE3Ac8FCb20';

// ============================================================================
// PARAMETER PARSING
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    originChain: 'base',
    destinationChain: 'skale-base',
    amount: '10000', // 0.01 USDC by default (6 decimals)
    recipient: null,
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];

    if (key === 'from') config.originChain = value;
    if (key === 'to') config.destinationChain = value;
    if (key === 'amount') config.amount = value;
    if (key === 'recipient') config.recipient = value;
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

const trails_api_key = process.env.TRAILS_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ Missing PRIVATE_KEY environment variable');
  process.exit(1);
}

const trailsAPI = new TrailsApi(trails_api_key);
const account = privateKeyToAccount(PRIVATE_KEY);
const amountBigInt = BigInt(config.amount);

const originChainInfo = CHAIN_MAP[config.originChain];
const destChainInfo = CHAIN_MAP[config.destinationChain];
const recipientAddress = config.recipient || account.address;

console.log(`\n🌉 SKALE Bridge - Universal Execution`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`📤 From: ${originChainInfo.name} (${originChainInfo.id})`);
console.log(`📥 To: ${destChainInfo.name} (${destChainInfo.id})`);
console.log(`💰 Amount: ${amountBigInt / 1000000n} USDC`);
console.log(`👤 Recipient: ${recipientAddress}`);
console.log(`🔑 Signer: ${account.address}`);

// ============================================================================
// BRIDGE LOGIC - Handle different patterns
// ============================================================================

async function executeBridge() {
  // Pattern 1: TO SKALE (Base or non-Base)
  if (config.destinationChain === 'skale-base') {
    return await bridgeToSKALE();
  }

  // Pattern 2: FROM SKALE to Base
  if (config.originChain === 'skale-base' && config.destinationChain === 'base') {
    return await bridgeFromSKALE();
  }

  console.error('❌ Unsupported bridge direction');
  console.error(`   Supported: any chain → skale-base, or skale-base → base`);
  process.exit(1);
}

// ============================================================================
// Pattern 1: Bridge TO SKALE Base
// ============================================================================

async function bridgeToSKALE() {
  console.log(`\n🔀 Pattern: ${originChainInfo.name === 'Base' ? 'Direct IMA' : 'Multi-hop via Base'}`);

  const originChainId = originChainInfo.id;
  const originUSDC = USDC_ADDRESSES[originChainId];

  // Helper: Encode IMA DepositBox call
  function encodeDepositERC20Direct(schainName, tokenAddress, amount, receiver) {
    const abi = [
      {
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
      }
    ];

    return encodeFunctionData({
      abi,
      functionName: 'depositERC20Direct',
      args: [schainName, tokenAddress, amount, receiver]
    });
  }

  // Encode base IMA call
  const imaCalldata = encodeDepositERC20Direct(SKALE_CHAIN_NAME, BASE_USDC, amountBigInt, recipientAddress);

  // Determine routing pattern
  let destinationChainId = 8453; // Always route to Base for SKALE transfers
  let destinationTokenAddress = BASE_USDC;
  let destinationToAddress, destinationCallData;

  if (originChainId === 8453) {
    // Base → SKALE: Direct IMA (no Trails Router wrapper)
    destinationToAddress = IMA_DEPOSIT_BOX;
    destinationCallData = imaCalldata;
  } else {
    // Non-Base → SKALE: Multi-hop via Trails Router
    // Encode IMA with placeholder for injection
    const PLACEHOLDER = BigInt('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
    const imaCalldataPlaceholder = encodeDepositERC20Direct(SKALE_CHAIN_NAME, BASE_USDC, PLACEHOLDER, recipientAddress);

    // Helper: Find placeholder offset
    function getAmountOffset(calldata, placeholder) {
      const hex = placeholder.toString(16).padStart(64, '0');
      const offset = calldata.toLowerCase().indexOf(hex.toLowerCase());
      if (offset === -1) return -1;
      return (offset - 2) / 2;
    }

    const amountOffset = getAmountOffset(imaCalldataPlaceholder, PLACEHOLDER);
    if (amountOffset === -1) {
      throw new Error('❌ Placeholder not found in IMA calldata');
    }

    // Wrap with Trails Router injectAndCall
    const routerAbi = [
      {
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
      }
    ];

    const placeholderBytes32 = `0x${PLACEHOLDER.toString(16).padStart(64, '0')}`;

    destinationToAddress = TRAILS_ROUTER;
    destinationCallData = encodeFunctionData({
      abi: routerAbi,
      functionName: 'injectAndCall',
      args: [BASE_USDC, IMA_DEPOSIT_BOX, imaCalldataPlaceholder, BigInt(amountOffset), placeholderBytes32]
    });
  }

  // 1. Get quote
  console.log(`\n⏳ Getting quote from Trails API...`);
  const quote = await trailsAPI.quoteIntent({
    ownerAddress: account.address,
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

  // 3. Setup wallet clients
  const walletClient = createWalletClient({
    account,
    chain: originChainInfo.chain,
    transport: http()
  });

  const publicClient = createPublicClient({
    chain: originChainInfo.chain,
    transport: http()
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
    args: [account.address, quote.intent.depositTransaction.to]
  });

  console.log(`  Current allowance: ${allowance}`);

  if (allowance < amountBigInt) {
    console.log(`⏳ Approving USDC...`);
    const nonce = await publicClient.getTransactionCount({ address: account.address });
    const approveTx = await walletClient.writeContract({
      nonce,
      address: originUSDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [quote.intent.depositTransaction.to, amountBigInt]
    });
    console.log(`✓ Approval tx: ${approveTx}`);
    await new Promise(r => setTimeout(r, 5000));
  }

  // 5. Transfer USDC
  console.log(`\n⏳ Transferring USDC...`);
  const nonce = await publicClient.getTransactionCount({ address: account.address });
  const transferHash = await walletClient.sendTransaction({
    nonce,
    to: quote.intent.depositTransaction.to,
    data: quote.intent.depositTransaction.data,
    value: quote.intent.depositTransaction.value ? BigInt(quote.intent.depositTransaction.value) : 0n
  });

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

  return { intentId, status: receipt.intentStatus };
}

// ============================================================================
// Pattern 2: Bridge FROM SKALE Base to Base
// ============================================================================

async function bridgeFromSKALE() {
  console.log(`\n🔀 Pattern: IMA Exit + Community Pool`);

  const skaleClient = createWalletClient({
    account,
    chain: originChainInfo.chain,
    transport: http()
  });

  const skalePublicClient = createPublicClient({
    chain: originChainInfo.chain,
    transport: http()
  });

  const baseClient = createWalletClient({
    account,
    chain: base,
    transport: http()
  });

  const basePublicClient = createPublicClient({
    chain: base,
    transport: http()
  });

  // 1. Check Community Pool activation
  console.log(`\n⏳ Checking Community Pool status...`);
  const poolBalance = await basePublicClient.readContract({
    address: COMMUNITY_POOL,
    abi: [{ inputs: [{ name: 'user', type: 'address' }, { name: 'schainName', type: 'string' }], name: 'getBalance', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }],
    functionName: 'getBalance',
    args: [account.address, SKALE_CHAIN_NAME]
  });

  const isActiveOnLocker = await skalePublicClient.readContract({
    address: COMMUNITY_LOCKER,
    abi: [{ inputs: [{ name: '', type: 'address' }], name: 'activeUsers', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' }],
    functionName: 'activeUsers',
    args: [account.address]
  });

  console.log(`  Pool Balance: ${poolBalance}`);
  console.log(`  Active on Locker: ${isActiveOnLocker}`);

  // 2. Recharge Community Pool if needed
  if (poolBalance === 0n || !isActiveOnLocker) {
    console.log(`\n⏳ Community Pool not active. Recharging with 0.0001 ETH...`);
    const rechargeHash = await baseClient.writeContract({
      address: COMMUNITY_POOL,
      abi: [{ inputs: [{ name: 'schainName', type: 'string' }, { name: 'receiver', type: 'address' }], name: 'rechargeUserWallet', outputs: [], stateMutability: 'payable', type: 'function' }],
      functionName: 'rechargeUserWallet',
      args: [SKALE_CHAIN_NAME, account.address],
      value: 100000000000n // 0.0001 ETH
    });
    console.log(`✓ Recharge tx: ${rechargeHash}`);
    await basePublicClient.waitForTransactionReceipt({ hash: rechargeHash });
    console.log(`✓ Recharge confirmed! Waiting for activation (30 seconds)...`);
    await new Promise(r => setTimeout(r, 30000));
  } else {
    console.log(`✓ Community Pool already active`);
  }

  // 3. Approve TokenManager
  console.log(`\n⏳ Approving USDC for TokenManager...`);
  const nonce = await skalePublicClient.getTransactionCount({ address: account.address });
  const approveTx = await skaleClient.writeContract({
    nonce,
    address: SKALE_USDC,
    abi: [{ name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }],
    functionName: 'approve',
    args: [TOKEN_MANAGER_ERC20, amountBigInt]
  });
  console.log(`✓ Approval tx: ${approveTx}`);
  await new Promise(r => setTimeout(r, 5000));

  // 4. Execute Exit
  console.log(`\n⏳ Executing exit from SKALE...`);
  const exitNonce = await skalePublicClient.getTransactionCount({ address: account.address });
  const exitHash = await skaleClient.writeContract({
    nonce: exitNonce,
    address: TOKEN_MANAGER_ERC20,
    abi: [{ inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'exitToMainERC20', outputs: [], stateMutability: 'nonpayable', type: 'function' }],
    functionName: 'exitToMainERC20',
    args: [recipientAddress, amountBigInt]
  });

  console.log(`✓ Exit tx: ${exitHash}`);
  console.log(`\n✅ Bridge initiated! USDC will arrive on Base in 5-10 minutes`);

  return { exitHash, status: 'INITIATED' };
}

// ============================================================================
// EXECUTE
// ============================================================================

try {
  await executeBridge();
} catch (error) {
  console.error(`\n❌ Bridge failed:`, error.message);
  process.exit(1);
}
