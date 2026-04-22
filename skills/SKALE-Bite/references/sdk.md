# BITE SDK Reference

Complete API reference for the `@skalenetwork/bite` TypeScript SDK.

## Installation

```bash
npm install @skalenetwork/bite
```

## Constructor

Initialize the BITE SDK with an RPC endpoint.

```typescript
import { BITE } from '@skalenetwork/bite';

// SKALE Base Sepolia (Testnet)
const bite = new BITE('https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha');

// SKALE Base (Mainnet)
const bite = new BITE('https://skale-base.skalenodes.com/v1/base');
```

### Supported Chains

| Chain | Chain ID | RPC Endpoint |
| ----- | -------- | ------------ |
| SKALE Base Sepolia | 324705682 | `https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha` |
| SKALE Base | 1187947933 | `https://skale-base.skalenodes.com/v1/base` |

---

## Core Methods

### `encryptTransaction`

Encrypts the `to` and `data` fields of a transaction using SKALE's threshold public key.

```typescript
async encryptTransaction(tx: {
    to: string;
    data: string;
    value?: string;
}): Promise<{
    to: string;        // BITE precompile address (encrypted)
    data: string;      // Encrypted calldata
    value?: string;    // Pass-through (not encrypted)
}>
```

#### Parameters

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| `to` | `string` | Yes | Target contract address (will be encrypted) |
| `data` | `string` | Yes | Transaction calldata (will be encrypted) |
| `value` | `string` | No | ETH value to send (not encrypted, default: "0") |

#### Returns

Returns an object with encrypted fields:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `to` | `string` | BITE precompile address (magic address that handles decryption) |
| `data` | `string` | Encrypted transaction payload |
| `value` | `string` | Original value (pass-through) |

#### Example

```typescript
import { BITE } from '@skalenetwork/bite';
import { ethers } from 'ethers';

const bite = new BITE('https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha');

// Prepare contract call
const iface = new ethers.Interface([
    'function transfer(address to, uint256 amount) returns (bool)'
]);
const data = iface.encodeFunctionData('transfer', [
    '0xRecipientAddress...',
    ethers.parseEther('100')
]);

// Encrypt the transaction
const encrypted = await bite.encryptTransaction({
    to: '0xTokenContractAddress...',
    data: data,
    value: '0'
});

console.log('Encrypted to:', encrypted.to);   // BITE precompile address
console.log('Encrypted data:', encrypted.data); // Encrypted bytes

// Send with wallet (MUST set gasLimit manually)
const tx = await wallet.sendTransaction({
    ...encrypted,
    gasLimit: 300_000
});
```

#### Important Notes

* **Gas Limit**: Always set `gasLimit` manually when sending. `estimateGas` does not work with encrypted transactions.
* **Value**: The `value` field is NOT encrypted. Use `0` for pure calldata operations.
* **Sender**: The sender address is always public (transaction is signed).

---

### `getDecryptedTransactionData`

Retrieves the decrypted `to` and `data` fields for an executed transaction.

```typescript
async getDecryptedTransactionData(txHash: string): Promise<{
    data: string;
    to: string;
}>
```

#### Parameters

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| `txHash` | `string` | Yes | Transaction hash of the encrypted transaction |

#### Returns

| Field | Type | Description |
| ----- | ---- | ----------- |
| `data` | `string` | Decrypted calldata (original transaction data) |
| `to` | `string` | Decrypted recipient address (original `to` address) |

#### Example

```typescript
// After transaction is confirmed
const txHash = '0xabc123...';

const decrypted = await bite.getDecryptedTransactionData(txHash);

console.log('Original recipient:', decrypted.to);
console.log('Original calldata:', decrypted.data);

// Decode the calldata if needed
const iface = new ethers.Interface([
    'function transfer(address to, uint256 amount) returns (bool)'
]);
const decoded = iface.parseResult({ data: decrypted.data });
console.log('Decoded function call:', decoded);
```

#### When to Use

* Verify what was actually executed in a past transaction
* Decode and analyze encrypted transaction history
* Debug transaction behavior
* Audit encrypted transaction flows

---

### `getCommitteesInfo`

Retrieves information about active validator committees for threshold decryption.

```typescript
async getCommitteesInfo(): Promise<Array<{
    epoch: number;
    committeeNumber: number;
    publicKey: string;
}>>
```

#### Returns

Array of committee objects:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `epoch` | `number` | Epoch number for this committee |
| `committeeNumber` | `number` | Committee identifier |
| `publicKey` | `string` | Threshold public key for encryption |

#### Committee Rotation Behavior

| Array Length | Status |
| ------------ | ------ |
| `1` | Normal operation - single active committee |
| `2` | Committee rotation in progress (~3 minute window) |

During rotation, the SDK **automatically** dual-encrypts transactions for both committees to ensure execution regardless of which committee finalizes the block.

#### Example

```typescript
const committees = await bite.getCommitteesInfo();

console.log('Active committees:', committees.length);

if (committees.length === 2) {
    console.log('⚠️ Committee rotation in progress');
    console.log('SDK will dual-encrypt for both committees');
} else {
    console.log('✅ Single active committee');
}

committees.forEach((committee, index) => {
    console.log(`Committee ${index + 1}:`);
    console.log(`  Epoch: ${committee.epoch}`);
    console.log(`  Number: ${committee.committeeNumber}`);
    console.log(`  Public Key: ${committee.publicKey.slice(0, 10)}...`);
});
```

#### Threshold Decryption Details

* **Committee Size**: 3t+1 validators (e.g., 4 nodes for t=1)
* **Threshold**: 2t+1 validators required to decrypt
* **DKG**: Distributed Key Generation creates new keys each epoch
* **Security**: No single validator can decrypt alone

---

## Complete Example: Full Transaction Lifecycle

```typescript
import { BITE } from '@skalenetwork/bite';
import { ethers } from 'ethers';

const RPC_ENDPOINT = 'https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha';
const bite = new BITE(RPC_ENDPOINT);
const provider = new ethers.JsonRpcProvider(RPC_ENDPOINT);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

async function fullEncryptedTransactionFlow() {
    // 1. Check committee status
    const committees = await bite.getCommitteesInfo();
    console.log('Committee status:', committees.length === 1 ? 'Normal' : 'Rotating');

    // 2. Prepare transaction data
    const iface = new ethers.Interface([
        'function confidentialFunction(uint256 secretValue) external'
    ]);
    const data = iface.encodeFunctionData('confidentialFunction', [42n]);

    // 3. Encrypt the transaction
    const encrypted = await bite.encryptTransaction({
        to: '0xTargetContract...',
        data: data,
        value: '0'
    });

    // 4. Send encrypted transaction (MUST set gasLimit)
    const tx = await wallet.sendTransaction({
        ...encrypted,
        gasLimit: 300_000
    });

    console.log('Encrypted TX sent:', tx.hash);

    // 5. Wait for confirmation
    const receipt = await tx.wait();
    console.log('Confirmed in block:', receipt?.blockNumber);

    // 6. Retrieve decrypted data
    const decrypted = await bite.getDecryptedTransactionData(tx.hash);
    console.log('Decrypted to:', decrypted.to);
    console.log('Decrypted data:', decrypted.data);

    // 7. Decode to verify
    const parsed = iface.parseResult({ data: decrypted.data });
    console.log('Decoded call:', parsed);

    return {
        hash: tx.hash,
        blockNumber: receipt?.blockNumber,
        decrypted
    };
}

fullEncryptedTransactionFlow().catch(console.error);
```

---

## Best Practices

### 1. Always Set Gas Limit

```typescript
// ❌ WRONG - will fail
const tx = await wallet.sendTransaction(encrypted);

// ✅ CORRECT - always set gasLimit
const tx = await wallet.sendTransaction({
    ...encrypted,
    gasLimit: 300_000
});
```

### 2. Handle Committee Rotation

```typescript
const committees = await bite.getCommitteesInfo();

if (committees.length === 2) {
    // Rotation in progress - SDK handles dual encryption automatically
    console.log('Rotation active - transaction may take slightly longer');
}
```

### 3. Verify Decryption After Execution

```typescript
const receipt = await tx.wait();

if (receipt && receipt.status === 1) {
    const decrypted = await bite.getDecryptedTransactionData(tx.hash);
    // Verify the decrypted data matches expectations
}
```

### 4. Use Appropriate Gas Limits

| Operation | Gas Limit |
| --------- | --------- |
| ERC20 Transfer | 200,000 |
| Simple Call | 300,000 |
| Complex Logic | 500,000+ |

Monitor actual usage and adjust down once you know typical consumption.

---

## Error Handling

```typescript
try {
    const encrypted = await bite.encryptTransaction({
        to: '0x...',
        data: '0x...'
    });

    const tx = await wallet.sendTransaction({
        ...encrypted,
        gasLimit: 300_000
    });

    return await tx.wait();
} catch (error: any) {
    if (error.message.includes('insufficient funds')) {
        console.error('Insufficient sFUEL for gas');
    } else if (error.message.includes('nonce')) {
        console.error('Nonce conflict - transaction may be pending');
    } else {
        console.error('Transaction failed:', error.message);
    }
    throw error;
}
```

---

## TypeScript Types

```typescript
interface EncryptedTransaction {
    to: string;
    data: string;
    value?: string;
}

interface CommitteeInfo {
    epoch: number;
    committeeNumber: number;
    publicKey: string;
}

interface DecryptedTxData {
    to: string;
    data: string;
}

declare class BITE {
    constructor(rpcEndpoint: string);

    encryptTransaction(tx: {
        to: string;
        data: string;
        value?: string;
    }): Promise<EncryptedTransaction>;

    getDecryptedTransactionData(txHash: string): Promise<DecryptedTxData>;

    getCommitteesInfo(): Promise<CommitteeInfo[]>;
}
```

---

## Additional Resources

* **SKILL.md** - Core BITE Protocol concepts
* **`examples/encrypted-transactions.md`** - Working code examples
* **`references/ctx.md`** - Conditional Transactions (Phase 2)
* [BITE Protocol Documentation](https://docs.skale.space/llms.txt)
* [npm Package](https://www.npmjs.com/package/@skalenetwork/bite)
