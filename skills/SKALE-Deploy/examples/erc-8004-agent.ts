import { ethers } from 'ethers';

// ============================================================================
// ERC-8004 Agent Quick Start Example
// ============================================================================
// This example demonstrates how to:
// 1. Connect to ERC-8004 registries on SKALE Base
// 2. Register an AI agent
// 3. Discover other agents by capability
// 4. Record interactions to build reputation
// ============================================================================

// Configuration
const CONFIG = {
  // SKALE Base Mainnet
  mainnet: {
    rpcUrl: 'https://skale-base.skalenodes.com/v1/base',
    chainId: 1187947933,
    identityRegistry: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    reputationRegistry: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
  },
  // SKALE Base Sepolia Testnet
  testnet: {
    rpcUrl: 'https://base-sepolia-testnet.skalenodes.com/v1/base-testnet',
    chainId: 324705682,
    identityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    reputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
  }
};

// Minimal ABI for ERC-8004 registries
const IDENTITY_ABI = [
  'function registerAgent(bytes32 agentId, string metadataUri) external',
  'function getAgentMetadata(bytes32 agentId) external view returns (string)',
  'function getAgentsByCapability(string capability) external view returns (bytes32[])',
  'function getAgentsByOwner(address owner) external view returns (bytes32[])',
  'function updateMetadata(bytes32 agentId, string newUri) external'
];

const REPUTATION_ABI = [
  'function recordInteraction(bytes32 agentId, bool success, uint256 weight) external',
  'function getReputation(bytes32 agentId) external view returns (uint256 score, uint256 totalInteractions, uint256 successfulInteractions, uint256 lastUpdated)',
  'function getTopAgents(uint256 limit) external view returns (bytes32[] memory, uint256[] memory)'
];

// ============================================================================
// Step 1: Connect to ERC-8004 Registries
// ============================================================================

function connectToRegistries(
  privateKey: string,
  network: 'mainnet' | 'testnet' = 'testnet'
) {
  const config = CONFIG[network];

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const identityRegistry = new ethers.Contract(
    config.identityRegistry,
    IDENTITY_ABI,
    wallet
  );

  const reputationRegistry = new ethers.Contract(
    config.reputationRegistry,
    REPUTATION_ABI,
    wallet
  );

  return { identityRegistry, reputationRegistry, wallet, provider };
}

// ============================================================================
// Step 2: Register Your Agent
// ============================================================================

async function registerAgent(
  identityRegistry: any,
  agentName: string,
  metadata: {
    name: string;
    description: string;
    capabilities: string[];
    version: string;
  }
): Promise<string> {
  // Generate unique agent ID from name
  const agentId = ethers.keccak256(ethers.toUtf8Bytes(agentName));

  // In production, upload metadata to IPFS and use the CID
  // For this example, we use a placeholder
  const metadataUri = JSON.stringify(metadata);

  console.log(`Registering agent: ${agentName}`);
  console.log(`Agent ID: ${agentId}`);

  const tx = await identityRegistry.registerAgent(agentId, metadataUri);
  await tx.wait();

  console.log(`Agent registered successfully!`);
  console.log(`Transaction: ${tx.hash}`);

  return agentId;
}

// ============================================================================
// Step 3: Discover Other Agents
// ============================================================================

async function discoverAgents(
  identityRegistry: any,
  reputationRegistry: any,
  capability: string
): Promise<void> {
  console.log(`\nSearching for agents with capability: ${capability}`);

  const agentIds = await identityRegistry.getAgentsByCapability(capability);

  if (agentIds.length === 0) {
    console.log('No agents found with this capability.');
    return;
  }

  console.log(`Found ${agentIds.length} agent(s):\n`);

  for (const id of agentIds) {
    const metadataUri = await identityRegistry.getAgentMetadata(id);
    const reputation = await reputationRegistry.getReputation(id);

    const metadata = JSON.parse(metadataUri);

    console.log(`Agent: ${metadata.name} (${id})`);
    console.log(`  Description: ${metadata.description}`);
    console.log(`  Capabilities: ${metadata.capabilities.join(', ')}`);
    console.log(`  Reputation Score: ${reputation.score.toString()}`);
    console.log(`  Success Rate: ${reputation.successfulInteractions}/${reputation.totalInteractions}`);
    console.log('');
  }
}

// ============================================================================
// Step 4: Record Interactions & Build Reputation
// ============================================================================

async function executeInteraction(
  reputationRegistry: any,
  targetAgentId: string,
  execute: () => Promise<void>,
  weight: number = 100
): Promise<boolean> {
  try {
    console.log(`\nExecuting interaction with agent ${targetAgentId}...`);

    // Execute the interaction logic
    await execute();

    // Record successful interaction
    const tx = await reputationRegistry.recordInteraction(
      targetAgentId,
      true,
      weight
    );
    await tx.wait();

    console.log('Interaction successful! Reputation recorded.');
    console.log(`Transaction: ${tx.hash}`);

    return true;
  } catch (error) {
    console.error('Interaction failed:', error);

    // Record failed interaction
    try {
      const tx = await reputationRegistry.recordInteraction(
        targetAgentId,
        false,
        Math.floor(weight / 2)
      );
      await tx.wait();
      console.log('Failure recorded to reputation registry.');
    } catch (recordError) {
      console.error('Failed to record interaction:', recordError);
    }

    return false;
  }
}

// ============================================================================
// Example: Complete Workflow
// ============================================================================

async function main() {
  // Setup: Replace with your private key
  const PRIVATE_KEY = process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE';

  // Connect to testnet registries
  const { identityRegistry, reputationRegistry, wallet } = connectToRegistries(
    PRIVATE_KEY,
    'testnet'
  );

  console.log(`Connected with wallet: ${wallet.address}`);

  // Step 1: Register your agent
  const myAgentId = await registerAgent(identityRegistry, 'my-price-oracle', {
    name: 'Price Oracle Agent',
    description: 'Fetches and verifies crypto prices from multiple sources',
    capabilities: ['fetch-price', 'verify-price', 'compare-prices'],
    version: '1.0.0'
  });

  // Step 2: Discover other agents
  await discoverAgents(identityRegistry, reputationRegistry, 'execute-trade');

  // Step 3: Execute interaction and build reputation
  const targetAgentId = ethers.keccak256(ethers.toUtf8Bytes('trading-bot'));

  await executeInteraction(
    reputationRegistry,
    targetAgentId,
    async () => {
      // Your agent logic here
      console.log('Fetching prices...');
      console.log('Comparing across exchanges...');
      console.log('Executing optimal trade...');
    },
    100 // Weight of this interaction
  );

  // Step 4: Check updated reputation
  const reputation = await reputationRegistry.getReputation(targetAgentId);
  console.log(`\nTarget agent reputation updated:`);
  console.log(`  Score: ${reputation.score.toString()}`);
  console.log(`  Total Interactions: ${reputation.totalInteractions.toString()}`);
  console.log(`  Successful: ${reputation.successfulInteractions.toString()}`);
}

// ============================================================================
// Helper: Get Top Agents by Reputation
// ============================================================================

async function getTopAgents(
  reputationRegistry: any,
  identityRegistry: any,
  limit: number = 10
): Promise<void> {
  const { agentIds, scores } = await reputationRegistry.getTopAgents(limit);

  console.log(`\nTop ${limit} Agents by Reputation:\n`);

  for (let i = 0; i < agentIds.length; i++) {
    const metadataUri = await identityRegistry.getAgentMetadata(agentIds[i]);
    const metadata = JSON.parse(metadataUri);

    console.log(`${i + 1}. ${metadata.name}`);
    console.log(`   Score: ${scores[i].toString()}`);
    console.log(`   Capabilities: ${metadata.capabilities.join(', ')}`);
    console.log('');
  }
}

// Export functions for use in other modules
export {
  connectToRegistries,
  registerAgent,
  discoverAgents,
  executeInteraction,
  getTopAgents
};

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
