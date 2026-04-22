# BITE Protocol - Encrypted Transactions Examples

Complete examples for Phase 1 Encrypted Transactions on SKALE Base and SKALE Base Sepolia.

## Installation

```bash
npm install @skalenetwork/bite ethers
```

## Basic Setup

```typescript
import { BITE } from '@skalenetwork/bite';
import { ethers } from 'ethers';

// SKALE Base Sepolia Testnet
const RPC_ENDPOINT = 'https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha';
const CHAIN_ID = 324705682;

// For Mainnet, use:
// const RPC_ENDPOINT = 'https://skale-base.skalenodes.com/v1/base';
// const CHAIN_ID = 1187947933;

const bite = new BITE(RPC_ENDPOINT);
const provider = new ethers.JsonRpcProvider(RPC_ENDPOINT);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
```

---

## Use Case 1: Private Token Transfers

Hide ERC20 transfer amounts and recipients from mempool observers.

```typescript
async function privateTokenTransfer(
    tokenAddress: string,
    recipient: string,
    amount: bigint
) {
    // ERC20 transfer function signature: transfer(address,uint256)
    const iface = new ethers.Interface([
        'function transfer(address to, uint256 amount) returns (bool)'
    ]);

    const transferData = iface.encodeFunctionData('transfer', [recipient, amount]);

    // Encrypt the transaction
    const encrypted = await bite.encryptTransaction({
        to: tokenAddress,
        data: transferData,
        value: '0'
    });

    // Send with manual gas limit (REQUIRED)
    const tx = await wallet.sendTransaction({
        ...encrypted,
        gasLimit: 200_000  // ERC20 transfers typically use ~100k gas
    });

    console.log('Encrypted transfer sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Confirmed in block:', receipt?.blockNumber);

    return tx.hash;
}

// Usage
await privateTokenTransfer(
    '0xTokenAddress...',
    '0xRecipientAddress...',
    ethers.parseEther('100')  // 100 tokens
);
```

### What's Protected?

* ✅ Recipient address (hidden until execution)
* ✅ Transfer amount (hidden until execution)
* ✅ Token contract address (hidden until execution)
* ❌ Sender address (public - transaction is signed)
* ❌ Gas used (public after execution)

---

## Use Case 2: Confidential Contract Interactions

Keep function calls and parameters private during mempool and consensus.

```typescript
async function confidentialContractCall(
    contractAddress: string,
    functionName: string,
    parameters: any[]
) {
    // Define your contract interface
    const iface = new ethers.Interface([
        'function confidentialFunction(uint256 secretParam, bytes32 secretHash) external'
    ]);

    const callData = iface.encodeFunctionData(functionName, parameters);

    // Encrypt the entire contract interaction
    const encrypted = await bite.encryptTransaction({
        to: contractAddress,
        data: callData,
        value: '0'
    });

    const tx = await wallet.sendTransaction({
        ...encrypted,
        gasLimit: 300_000  // Adjust based on your function's gas needs
    });

    console.log('Confidential call sent:', tx.hash);
    return await tx.wait();
}

// Usage
await confidentialContractCall(
    '0xYourContractAddress...',
    'confidentialFunction',
    [
        12345n,                              // secretParam
        ethers.hexlify(ethers.randomBytes(32)) // secretHash
    ]
);
```

### When to Use This

* Sensitive business logic that competitors shouldn't see
* Proprietary trading strategies
* Private auction bids
* Confidential governance actions

---

## Use Case 3: Private Voting

Encrypt votes to prevent bribery and coercion—vote intent remains hidden until finality.

```typescript
// Governance contract interface
const GOVERNANCE_ABI = [
    'function vote(uint256 proposalId, bool support) external',
    'function getProposal(uint256 proposalId) external view returns (uint256 startBlock, uint256 endBlock, bool executed)'
];

async function castPrivateVote(
    governanceAddress: string,
    proposalId: number,
    support: boolean
) {
    const iface = new ethers.Interface(GOVERNANCE_ABI);

    const voteData = iface.encodeFunctionData('vote', [proposalId, support]);

    // Encrypt the vote - no one can see how you voted until confirmed
    const encrypted = await bite.encryptTransaction({
        to: governanceAddress,
        data: voteData,
        value: '0'
    });

    const tx = await wallet.sendTransaction({
        ...encrypted,
        gasLimit: 100_000
    });

    console.log('Encrypted vote sent:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Vote recorded in block:', receipt?.blockNumber);

    return receipt;
}

// Usage: Vote YES on proposal 42
await castPrivateVote(
    '0xGovernanceAddress...',
    42,
    true  // support = YES
);
```

### Anti-Bribery Benefits

* Voters cannot prove they voted a certain way before finality
* Bribers cannot verify vote intent in mempool
* Vote buying becomes significantly harder

---

## Use Case 4: NFT Mint Privacy

Hide metadata and mint details until reveal, preventing front-running.

```typescript
const NFT_ABI = [
    'function mint(address recipient, string memory metadata) external',
    'function tokenURI(uint256 tokenId) external view returns (string)'
];

async function privateNFTMint(
    nftAddress: string,
    recipient: string,
    encryptedMetadata: string
) {
    const iface = new ethers.Interface(NFT_ABI);

    const mintData = iface.encodeFunctionData('mint', [recipient, encryptedMetadata]);

    // Encrypt mint transaction - bots cannot see what you're minting
    const encrypted = await bite.encryptTransaction({
        to: nftAddress,
        data: mintData,
        value: '0'
    });

    const tx = await wallet.sendTransaction({
        ...encrypted,
        gasLimit: 250_000  // NFT mints vary by complexity
    });

    console.log('Encrypted mint sent:', tx.hash);
    const receipt = await tx.wait();

    // Extract tokenId from logs (implementation specific)
    const tokenId = extractTokenIdFromLogs(receipt?.logs);
    console.log('Minted token ID:', tokenId);

    return { receipt, tokenId };
}

// Usage
await privateNFTMint(
    '0xNFTContractAddress...',
    '0xYourAddress...',
    'ipfs://encrypted-metadata-hash...'
);
```

### Front-Running Prevention

* Bots cannot see rare traits in mempool
* Metadata remains hidden until block finality
* Prevents sniper bots from targeting valuable mints

---

## Complete Workflow: Encrypt → Send → View Decrypted

```typescript
import { BITE } from '@skalenetwork/bite';
import { ethers } from 'ethers';

const bite = new BITE('https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha');
const provider = new ethers.JsonRpcProvider('https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

async function sendAndTrackEncryptedTransaction() {
    // 1. Prepare transaction
    const contractAddress = "0x1234567890123456789012345678901234567890";
    const iface = new ethers.Interface([
        'function confidentialFunction(uint256 value) external'
    ]);
    const data = iface.encodeFunctionData('confidentialFunction', [42n]);

    // 2. Encrypt the transaction
    console.log('Encrypting transaction...');
    const encrypted = await bite.encryptTransaction({
        to: contractAddress,
        data: data,
        value: '0'
    });

    // 3. Send with manual gas limit (REQUIRED)
    console.log('Sending encrypted transaction...');
    const tx = await wallet.sendTransaction({
        ...encrypted,
        gasLimit: 300_000
    });

    console.log('Transaction hash:', tx.hash);

    // 4. Wait for confirmation
    const receipt = await tx.wait();
    console.log('Confirmed in block:', receipt?.blockNumber);

    // 5. View the decrypted data (now visible on-chain)
    const decryptedData = await bite.getDecryptedTransactionData(tx.hash);
    console.log('Decrypted to address:', decryptedData.to);
    console.log('Decrypted calldata:', decryptedData.data);

    return {
        hash: tx.hash,
        blockNumber: receipt?.blockNumber,
        decrypted: decryptedData
    };
}

// Check committee status before sending
async function checkCommitteeStatus() {
    const committees = await bite.getCommitteesInfo();
    console.log('Active committees:', committees.length);

    if (committees.length === 2) {
        console.log('⚠️ Committee rotation in progress (~3 min window)');
        console.log('SDK will automatically dual-encrypt for both committees');
    } else {
        console.log('✅ Single active committee');
    }

    return committees;
}

// Run the complete workflow
async function main() {
    await checkCommitteeStatus();
    const result = await sendAndTrackEncryptedTransaction();
    console.log('Complete:', result);
}

main().catch(console.error);
```

---

## Gas Limit Guidelines

Always set gas manually - `estimateGas` does not work with BITE.

| Operation | Recommended Gas Limit |
| --------- | --------------------- |
| ERC20 Transfer | 200,000 |
| Simple Contract Call | 300,000 |
| Complex Contract Call | 500,000 |
| NFT Mint | 250,000 |
| Governance Vote | 100,000 |

**Tip**: Start with these defaults and monitor actual gas usage. Reduce limits once you know your transaction's typical consumption.

---

## Chain Endpoints Reference

### SKALE Base Sepolia (Testnet)
```typescript
const RPC_ENDPOINT = 'https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha';
const CHAIN_ID = 324705682;
```

### SKALE Base (Mainnet)
```typescript
const RPC_ENDPOINT = 'https://skale-base.skalenodes.com/v1/base';
const CHAIN_ID = 1187947933;
```

---

## Common Patterns

### Error Handling

```typescript
async function sendWithErrorHandling() {
    try {
        const encrypted = await bite.encryptTransaction({
            to: '0x...',
            data: '0x...'
        });

        const tx = await wallet.sendTransaction({
            ...encrypted,
            gasLimit: 300_000
        });

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
            console.log('✅ Transaction successful');
        } else {
            console.log('❌ Transaction failed');
        }

        return receipt;
    } catch (error: any) {
        console.error('Transaction error:', error.message);

        // Handle common errors
        if (error.message.includes('insufficient funds')) {
            console.log('Add more sFUEL to your wallet');
        } else if (error.message.includes('nonce')) {
            console.log('Nonce error - transaction may be pending');
        }

        throw error;
    }
}
```

### Batch Transactions

```typescript
async function sendBatchEncryptedTransactions(transactions: Array<{to: string, data: string}>) {
    const results = [];

    for (const tx of transactions) {
        const encrypted = await bite.encryptTransaction(tx);

        const sentTx = await wallet.sendTransaction({
            ...encrypted,
            gasLimit: 300_000
        });

        const receipt = await sentTx.wait();
        results.push({ hash: sentTx.hash, receipt });
    }

    return results;
}
```

---

## Additional Resources

* **SKILL.md** - Core BITE Protocol concepts and setup
* **`references/sdk.md`** - Complete SDK API documentation
* **`references/ctx.md`** - Conditional Transactions (Phase 2)
* [BITE Protocol Docs](https://docs.skale.space/llms.txt)
* [npm Package](https://www.npmjs.com/package/@skalenetwork/bite)
