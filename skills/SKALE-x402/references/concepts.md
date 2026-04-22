# x402 Protocol Concepts

## Overview

x402 is an open protocol that extends HTTP with native payment capabilities through the `402 Payment Required` status code. It enables autonomous agent-to-agent payments without requiring gas from the end user.

## ERC-3009: TransferWithAuthorization

The foundation of x402 gasless payments is ERC-3009, an Ethereum standard that enables gasless token transfers. It allows a payer (agent) to authorize a transfer without executing it themselves.

### How It Works

1. **Authorization Creation**: The payer signs an authorization message containing:
   - From address (payer's wallet)
   - To address (recipient)
   - Amount and token address
   - Validity period (nonce and expiration)
   - Signature

2. **Facilitator Execution**: A facilitator (relayer) receives the authorization and:
   - Validates the signature and authorization parameters
   - Executes the `transferWithAuthorization` function on the token contract
   - Pays the gas fee (often subsidized or covered by the service)

3. **Benefits**:
   - No gas required from the payer
   - No pre-approval or allowance needed
   - Single-use authorizations prevent replay attacks
   - Revocable through expiration

### Authorization Format

```typescript
interface Authorization {
    from: string;        // Payer address
    to: string;          // Recipient address
    value: bigint;       // Amount (in token decimals)
    validAfter: number;  // Unix timestamp (optional)
    expiresAt: number;   // Unix timestamp
    nonce: bigint;       // Unique identifier
    signature: string;   // ECDSA signature
}
```

## Protocol Architecture

### Components

#### 1. Resource Server

Protects API endpoints by requiring payment before access.

**Responsibilities:**
- Validate payment signatures
- Enforce pricing rules
- Return 402 responses for unpaid requests
- Serve content after successful payment

**Key Interface:**
```typescript
interface PaymentRequirement {
    scheme: string;      // Payment scheme (e.g., "exact")
    network: string;     // CAIP-2 network ID
    payTo: string;       // Recipient address
    price: {
        amount: string;  // Price in token decimals
        asset: string;   // Token contract address
    };
}
```

#### 2. Facilitator

Handles payment execution on behalf of payers.

**Responsibilities:**
- Receive payment authorizations
- Validate signatures and authorization parameters
- Execute token transfers via ERC-3009
- Return payment receipts

**Why use existing facilitators:**
- No need to run infrastructure
- Subsidized gas fees
- Built-in rate limiting and security
- Reliability and uptime guarantees

#### 3. Agent Client

Automatically pays for protected resources.

**Responsibilities:**
- Intercept HTTP responses
- Detect 402 Payment Required status
- Create payment authorizations
- Retry requests with payment headers
- Handle payment failures

**Payment Flow:**
```typescript
1. fetch(url) -> 402
2. Extract payment requirements from response
3. Create ERC-3009 authorization
4. Submit to facilitator
5. Receive payment receipt
6. Retry fetch(url) with receipt
7. Receive protected content
```

## HTTP Flow

### Unpaid Request

```http
GET /api/premium HTTP/1.1
Host: api.example.com
```

### 402 Response

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json
Payment-Required: true

{
    "accepts": [{
        "scheme": "exact",
        "network": "eip155:324705682",
        "payTo": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "price": {
            "amount": "10000",
            "asset": "0x2e08028E3C4c2356572E096d8EF835cD5C6030bD"
        }
    }]
}
```

### Paid Request

```http
GET /api/premium HTTP/1.1
Host: api.example.com
Payment-Signature: scheme=exact,network=eip155:324705682,...
```

### 200 Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "data": "Premium content"
}
```

## Payment Schemes

### Exact Scheme

The exact scheme requires a specific payment amount. Used for fixed-price resources.

**Parameters:**
- `amount`: Exact amount required
- `asset`: Token contract address

### Other Schemes (Future)

The protocol supports extensible schemes:
- **Range**: Accept payments within a min/max range
- **Dynamic**: Price determined by server logic
- **Subscription**: Recurring payments for access

## Security Considerations

### For Server Operators

1. **Validate Signatures**: Always verify ERC-3009 signatures with the facilitator
2. **Check Nonces**: Prevent replay attacks by tracking used nonces
3. **Set Expirations**: Use reasonable expiration times for authorizations
4. **Rate Limiting**: Protect against abuse even with payments

### For Client Operators

1. **Secure Private Keys**: Never expose private keys in logs or error messages
2. **Validate URLs**: Ensure payments go to expected endpoints
3. **Check Pricing**: Verify prices before authorizing payments
4. **Handle Failures**: Implement retry logic with exponential backoff

### For Facilitators

1. **Rate Limiting**: Prevent spam and abuse
2. **Gas Estimation**: Accurately estimate gas costs
3. **Nonce Tracking**: Prevent replay attacks
4. **Monitoring**: Track unusual payment patterns

## Advantages on SKALE

SKALE Network is ideal for x402 implementations due to:

1. **Zero Gas Fees**: No cost for executing payments
2. **High Throughput**: Support many concurrent transactions
3. **Fast Confirmations**: Sub-second block times
4. **EVM Compatibility**: Full ERC-3009 support
5. **Low Latency**: Minimal delay between payment and access

## References

- [ERC-3009 Specification](https://eips.ethereum.org/EIPS/eip-3009)
- [x402 Protocol](https://github.com/x402)
- [SKALE Network](https://skale.space/)
