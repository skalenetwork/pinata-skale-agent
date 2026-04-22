#!/usr/bin/env node

/**
 * Generic MTM (Multi-Transaction Mode) Executor for SKALE Base
 * 
 * Executes any contract function x times using manual nonce incrementation
 * Supports up to 700 TPS throughput on SKALE Base
 * 
 * Usage:
 *   node mtm-executor.js --contract <address> --function <name> --count <number> [--args <json>] [--abi <path>]
 * 
 * Examples:
 *   # Mint NFT 10 times (no args)
 *   node mtm-executor.js --contract 0x3EA... --function mint --count 10
 * 
 *   # Transfer tokens 5 times
 *   node mtm-executor.js --contract 0xABC... --function transfer --count 5 --args '["0x123...",1000000000]'
 * 
 *   # With custom ABI file
 *   node mtm-executor.js --contract 0x123... --function swap --count 20 --abi ./abi.json --args '[...]'
 */

const { JsonRpcProvider, Wallet, Contract, parseAbi } = require('ethers');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const config = {};

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--contract') {
            config.contractAddress = args[++i];
        } else if (args[i] === '--function') {
            config.functionName = args[++i];
        } else if (args[i] === '--count') {
            config.executionCount = parseInt(args[++i], 10);
        } else if (args[i] === '--args') {
            try {
                config.functionArgs = JSON.parse(args[++i]);
            } catch (e) {
                console.error('❌ Invalid JSON format for --args:', e.message);
                process.exit(1);
            }
        } else if (args[i] === '--abi') {
            config.abiPath = args[++i];
        } else if (args[i] === '--rpc') {
            config.rpcUrl = args[++i];
        }
    }

    return config;
}

// Validate required arguments
function validateConfig(config) {
    if (!config.contractAddress || !config.contractAddress.startsWith('0x')) {
        console.error('❌ Missing or invalid --contract address (must start with 0x)');
        process.exit(1);
    }

    if (!config.functionName) {
        console.error('❌ Missing --function name');
        process.exit(1);
    }

    if (!config.executionCount || config.executionCount < 1) {
        console.error('❌ Missing or invalid --count (must be >= 1)');
        process.exit(1);
    }

    if (!process.env.PRIVATE_KEY) {
        console.error('❌ Missing PRIVATE_KEY environment variable');
        process.exit(1);
    }
}

// Load ABI from file or use minimal ERC721 ABI
function loadABI(abiPath) {
    if (abiPath) {
        try {
            const abiContent = fs.readFileSync(abiPath, 'utf8');
            return JSON.parse(abiContent);
        } catch (e) {
            console.error(`❌ Failed to load ABI from ${abiPath}:`, e.message);
            process.exit(1);
        }
    }

    // Default minimal ABI for ERC721 mint functions
    // This will work for simple mint() functions with no arguments
    return [
        {
            name: 'mint',
            type: 'function',
            inputs: [],
            outputs: []
        }
    ];
}

// Main execution function
async function executeMTM(config) {
    console.log('\n🚀 SKALE MTM Executor Starting...\n');

    // Initialize provider and signer
    const rpcUrl = config.rpcUrl || 'https://skale-base.skalenodes.com/v1/base';
    const provider = new JsonRpcProvider(rpcUrl);
    const signer = new Wallet(process.env.PRIVATE_KEY, provider);
    const signerAddress = signer.address;

    console.log(`📍 Network: SKALE Base Mainnet`);
    console.log(`👤 Signer Address: ${signerAddress}`);
    console.log(`📝 Contract: ${config.contractAddress}`);
    console.log(`🎯 Function: ${config.functionName}`);
    console.log(`🔢 Executions: ${config.executionCount}`);
    if (config.functionArgs?.length > 0) {
        console.log(`📦 Args: ${JSON.stringify(config.functionArgs)}`);
    }

    try {
        // Get current nonce
        const currentNonce = await provider.getTransactionCount(signerAddress);
        console.log(`\n📊 Current Nonce: ${currentNonce}`);

        let nonce = currentNonce;

        // Load ABI
        const abi = loadABI(config.abiPath);
        const contract = new Contract(config.contractAddress, abi, signer);

        // Prepare transaction data
        const encodedData = contract.interface.encodeFunctionData(
            config.functionName,
            config.functionArgs || []
        );

        console.log(`✅ Function encoded successfully\n`);

        // Fire all transactions with manual nonce incrementation
        console.log(`🔥 Firing ${config.executionCount} transactions with MTM...\n`);

        const txPromises = [];
        const startTime = Date.now();

        for (let i = 0; i < config.executionCount; i++) {
            const txPromise = signer.sendTransaction({
                to: config.contractAddress,
                data: encodedData,
                nonce: nonce++
            })
                .then(tx => ({
                    index: i + 1,
                    hash: tx.hash,
                    nonce: nonce - 1,
                    status: 'sent'
                }))
                .catch(error => ({
                    index: i + 1,
                    error: error.message,
                    nonce: nonce - 1,
                    status: 'failed'
                }));

            txPromises.push(txPromise);
        }

        // Wait for all transactions to be sent
        const results = await Promise.all(txPromises);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        // Display results
        console.log('\n📈 Transaction Results:\n');
        console.log('────────────────────────────────────────────────────────────────');

        let successCount = 0;
        let failureCount = 0;

        results.forEach(result => {
            if (result.status === 'sent') {
                console.log(
                    `✅ TX #${String(result.index).padStart(3)} | Nonce: ${result.nonce} | Hash: ${result.hash}`
                );
                successCount++;
            } else {
                console.log(
                    `❌ TX #${String(result.index).padStart(3)} | Nonce: ${result.nonce} | Error: ${result.error}`
                );
                failureCount++;
            }
        });

        console.log('────────────────────────────────────────────────────────────────\n');

        // Summary
        console.log('📊 Summary:');
        console.log(`   ✅ Successful: ${successCount}/${config.executionCount}`);
        console.log(`   ❌ Failed: ${failureCount}/${config.executionCount}`);
        console.log(`   ⏱️  Time: ${duration}s`);
        console.log(`   🚀 TPS: ${(config.executionCount / parseFloat(duration)).toFixed(2)}\n`);

        // Show explorer link
        const explorerUrl = 'https://skale-base-explorer.skalenodes.com';
        console.log(`🔍 View on Explorer: ${explorerUrl}/address/${signerAddress}`);
        console.log(
            `\n⏳ Transactions will be confirmed within 1-2 blocks (~10-20 seconds)\n`
        );

    } catch (error) {
        console.error('\n❌ Error during MTM execution:', error.message);
        process.exit(1);
    }
}

// Main entry point
(async () => {
    const config = parseArgs();
    validateConfig(config);
    await executeMTM(config);
})().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
});
