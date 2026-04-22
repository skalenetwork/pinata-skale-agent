/**
 * MTM Mode - High-Frequency Trading Example
 *
 * This example demonstrates advanced MTM patterns for high-throughput
 * operations on SKALE Base chains, including transaction batching,
 * error handling, and performance optimization.
 *
 * Use this as a template for:
 * - High-frequency DeFi operations
 * - Gaming platform transactions
 * - Social application batching
 * - Bulk token transfers
 */

import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';

// Types
interface TransactionConfig {
    to: string;
    data: string;
    value?: string;
}

interface BatchResult {
    success: boolean;
    hash?: string;
    nonce?: number;
    error?: Error;
    recipient?: string;
}

interface MTMConfig {
    rpcUrl: string;
    privateKey: string;
    batchSize: number;
    retryAttempts: number;
    confirmations: number;
}

/**
 * MTMTransactionManager handles high-throughput transaction batches
 * with robust error handling and performance optimization
 */
class MTMTransactionManager {
    private readonly provider: JsonRpcProvider;
    private readonly wallet: Wallet;
    private nonce: number | null = null;
    private readonly config: MTMConfig;
    private pendingTransactions = new Map<number, Promise<any>>();

    constructor(config: MTMConfig) {
        this.config = config;
        this.provider = new JsonRpcProvider(config.rpcUrl);
        this.wallet = new Wallet(config.privateKey, this.provider);
    }

    /**
     * Initialize the transaction manager
     */
    async initialize(): Promise<void> {
        this.nonce = await this.provider.getTransactionCount(this.wallet.address);
        console.log(`MTM Manager initialized with nonce: ${this.nonce}`);
    }

    /**
     * Send a single transaction with manual nonce management
     */
    async sendTransaction(txConfig: TransactionConfig): Promise<ethers.ContractTransactionReceipt> {
        if (this.nonce === null) {
            throw new Error('Manager not initialized. Call initialize() first.');
        }

        const currentNonce = this.nonce++;

        try {
            const tx = await this.wallet.sendTransaction({
                to: txConfig.to,
                data: txConfig.data,
                value: txConfig.value || '0',
                nonce: currentNonce
            });

            console.log(`[${currentNonce}] Tx sent: ${tx.hash}`);

            // Wait for confirmation
            const receipt = await tx.wait(this.config.confirmations);
            console.log(`[${currentNonce}] Tx confirmed: ${receipt.hash}`);

            return receipt;

        } catch (error) {
            // Rollback nonce on failure
            this.nonce = currentNonce;
            throw error;
        }
    }

    /**
     * Execute batch transactions with error handling
     */
    async executeBatch(
        transactions: TransactionConfig[],
        metadata?: string[]
    ): Promise<BatchResult[]> {
        if (this.nonce === null) {
            throw new Error('Manager not initialized');
        }

        const results: BatchResult[] = [];
        const startTime = Date.now();

        console.log(`Executing batch of ${transactions.length} transactions`);

        // Process in sub-batches for better error handling
        for (let i = 0; i < transactions.length; i += this.config.batchSize) {
            const batch = transactions.slice(i, i + batchSize);
            const batchMeta = metadata?.slice(i, i + this.config.batchSize);

            console.log(`Processing sub-batch ${Math.floor(i / this.config.batchSize) + 1}`);

            const batchResults = await Promise.allSettled(
                batch.map((tx, idx) =>
                    this.executeWithRetry(tx, batchMeta?.[idx])
                )
            );

            for (let j = 0; j < batchResults.length; j++) {
                const result = batchResults[j];
                results.push({
                    success: result.status === 'fulfilled',
                    error: result.status === 'rejected' ? result.reason : undefined,
                    ...(result.status === 'fulfilled' ? result.value : {})
                });
            }

            // Optional delay between batches
            if (i + this.config.batchSize < transactions.length) {
                await this.delay(100);
            }
        }

        const duration = Date.now() - startTime;
        const tps = Math.round(transactions.length / (duration / 1000));
        const successCount = results.filter(r => r.success).length;

        console.log(`Batch complete: ${successCount}/${transactions.length} successful`);
        console.log(`Duration: ${duration}ms (${tps} TPS)`);

        return results;
    }

    /**
     * Execute transaction with retry logic
     */
    private async executeWithRetry(
        txConfig: TransactionConfig,
        metadata?: string
    ): Promise<BatchResult> {
        const currentNonce = this.nonce!;

        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const receipt = await this.sendTransaction(txConfig);
                return {
                    success: true,
                    hash: receipt.hash,
                    nonce: currentNonce,
                    recipient: metadata
                };
            } catch (error) {
                console.error(`[Attempt ${attempt}/${this.config.retryAttempts}] Failed:`, error.message);

                if (attempt === this.config.retryAttempts) {
                    return {
                        success: false,
                        nonce: currentNonce,
                        error,
                        recipient: metadata
                    };
                }

                // Exponential backoff before retry
                await this.delay(Math.pow(2, attempt) * 100);
            }
        }

        return {
            success: false,
            nonce: currentNonce,
            error: new Error('Max retry attempts exceeded'),
            recipient: metadata
        };
    }

    /**
     * High-performance fire-and-forget mode
     * Maximum throughput, no confirmation waiting
     */
    async fireAndForget(transactions: TransactionConfig[]): Promise<string[]> {
        if (this.nonce === null) {
            throw new Error('Manager not initialized');
        }

        console.log(`Fire-and-forget mode: ${transactions.length} transactions`);
        const startTime = Date.now();
        const hashes: string[] = [];

        for (let i = 0; i < transactions.length; i++) {
            const currentNonce = this.nonce!++;

            try {
                const tx = await this.wallet.sendTransaction({
                    to: transactions[i].to,
                    data: transactions[i].data,
                    value: transactions[i].value || '0',
                    nonce: currentNonce
                });

                hashes.push(tx.hash);
                console.log(`[${i + 1}/${transactions.length}] Sent: ${tx.hash}`);

            } catch (error) {
                this.nonce = currentNonce;
                console.error(`Failed at ${i + 1}:`, error.message);
                throw error;
            }
        }

        const duration = Date.now() - startTime;
        const tps = Math.round(transactions.length / (duration / 1000));

        console.log(`Complete: ${transactions.length} transactions in ${duration}ms (${tps} TPS)`);
        return hashes;
    }

    /**
     * Get current nonce for debugging
     */
    getCurrentNonce(): number | null {
        return this.nonce;
    }

    /**
     * Reset nonce to on-chain value (use with caution)
     */
    async resetNonce(): Promise<void> {
        this.nonce = await this.provider.getTransactionCount(this.wallet.address);
        console.log(`Nonce reset to: ${this.nonce}`);
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * High-Frequency Token Transfer Example
 */
async function highFrequencyTransfers() {
    // ERC20 Transfer ABI
    const ERC20_ABI = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function balanceOf(address owner) view returns (uint256)'
    ];

    const config: MTMConfig = {
        rpcUrl: 'https://skale-base.skalenodes.com/v1/base',
        privateKey: process.env.PRIVATE_KEY!,
        batchSize: 50,
        retryAttempts: 3,
        confirmations: 1
    };

    const tokenAddress = '0x...'; // Your token contract
    const manager = new MTMTransactionManager(config);
    await manager.initialize();

    // Generate test transfers
    const transfers: TransactionConfig[] = [];
    const recipients: string[] = [];

    for (let i = 0; i < 100; i++) {
        const recipient = Wallet.createRandom().address;
        const amount = ethers.parseEther('10');

        const contract = new Contract(tokenAddress, ERC20_ABI);
        const data = contract.interface.encodeFunctionData('transfer', [recipient, amount]);

        transfers.push({ to: tokenAddress, data });
        recipients.push(recipient);
    }

    // Execute batch transfers
    const results = await manager.executeBatch(transfers, recipients);

    // Report results
    const successCount = results.filter(r => r.success).length;
    console.log(`\nResults: ${successCount}/${transfers.length} successful`);

    return results;
}

/**
 * Gaming Platform - Tournament Reward Distribution
 */
async function distributeTournamentRewards() {
    // Gaming token ABI
    const GAME_TOKEN_ABI = [
        'function distributeReward(address player, uint256 amount, uint256 tournamentId)',
        'function bulkDistribute(address[] calldata players, uint256[] calldata amounts, uint256 tournamentId)'
    ];

    const config: MTMConfig = {
        rpcUrl: 'https://skale-base.skalenodes.com/v1/base',
        privateKey: process.env.PRIVATE_KEY!,
        batchSize: 100,
        retryAttempts: 2,
        confirmations: 2
    };

    const gameContract = '0x...'; // Your game contract
    const manager = new MTMTransactionManager(config);
    await manager.initialize();

    // Tournament winners
    const winners = [
        { address: '0x...', reward: ethers.parseEther('1000'), rank: 1 },
        { address: '0x...', reward: ethers.parseEther('500'), rank: 2 },
        { address: '0x...', reward: ethers.parseEther('250'), rank: 3 },
        // ... more winners
    ];

    const contract = new Contract(gameContract, GAME_TOKEN_ABI);

    // Build reward transactions
    const rewardTxs: TransactionConfig[] = winners.map(winner => ({
        to: gameContract,
        data: contract.interface.encodeFunctionData('distributeReward', [
            winner.address,
            winner.reward,
            Date.now() // tournament ID
        ])
    }));

    const results = await manager.executeBatch(rewardTxs);

    console.log(`Distributed rewards to ${results.filter(r => r.success).length} players`);
    return results;
}

/**
 * NFT Marketplace - Bulk Listing Updates
 */
async function bulkListingsUpdate() {
    const MARKETPLACE_ABI = [
        'function updateListing(uint256 listingId, uint256 newPrice)',
        'function createListing(address nftContract, uint256 tokenId, uint256 price)'
    ];

    const config: MTMConfig = {
        rpcUrl: 'https://skale-base.skalenodes.com/v1/base',
        privateKey: process.env.PRIVATE_KEY!,
        batchSize: 75,
        retryAttempts: 3,
        confirmations: 1
    };

    const marketplace = '0x...';
    const manager = new MTMTransactionManager(config);
    await manager.initialize();

    // Update 200 listings with new prices
    const updates: TransactionConfig[] = [];
    const listingIds: string[] = [];

    for (let i = 0; i < 200; i++) {
        const newPrice = ethers.parseEther((Math.random() * 2).toFixed(4));
        const contract = new Contract(marketplace, MARKETPLACE_ABI);

        updates.push({
            to: marketplace,
            data: contract.interface.encodeFunctionData('updateListing', [i, newPrice])
        });
        listingIds.push(`Listing #${i}`);
    }

    const results = await manager.executeBatch(updates, listingIds);
    return results;
}

/**
 * Performance Testing Suite
 */
async function runPerformanceTests() {
    console.log('=== MTM Performance Testing ===\n');

    const testCases = [
        { size: 10, name: 'Small batch' },
        { size: 50, name: 'Medium batch' },
        { size: 100, name: 'Large batch' },
        { size: 200, name: 'XL batch' },
        { size: 500, name: 'Stress test' }
    ];

    const results: Array<{ size: number; tps: number; duration: number }> = [];

    for (const testCase of testCases) {
        console.log(`\n--- ${testCase.name} (${testCase.size} txs) ---`);

        const dummyTxs: TransactionConfig[] = Array(testCase.size).fill(null).map(() => ({
            to: Wallet.createRandom().address,
            data: '0x' // Dummy data for testing
        }));

        const config: MTMConfig = {
            rpcUrl: 'https://skale-base.skalenodes.com/v1/base',
            privateKey: process.env.PRIVATE_KEY!,
            batchSize: testCase.size,
            retryAttempts: 1,
            confirmations: 0 // Faster for testing
        };

        const manager = new MTMTransactionManager(config);
        await manager.initialize();

        const startTime = Date.now();

        try {
            await manager.fireAndForget(dummyTxs);
            const duration = Date.now() - startTime;
            const tps = Math.round(testCase.size / (duration / 1000));

            results.push({ size: testCase.size, tps, duration });
            console.log(`Result: ${tps} TPS (${duration}ms)`);

        } catch (error) {
            console.log(`Test failed:`, error.message);
        }
    }

    console.log('\n=== Performance Summary ===');
    results.forEach(r => {
        console.log(`${r.size} txs: ${r.tps} TPS (${r.duration}ms)`);
    });
}

// Export for module usage
export {
    MTMTransactionManager,
    MTMConfig,
    TransactionConfig,
    BatchResult,
    highFrequencyTransfers,
    distributeTournamentRewards,
    bulkListingsUpdate,
    runPerformanceTests
};
