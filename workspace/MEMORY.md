# MEMORY.md - Long-Term Memory

## OWS Wallet Setup & Usage

**Status:** ✅ Active — `skale-default` wallet created and tested

### Wallet Details
- **Name:** skale-default
- **ID:** a8c407fc-84f9-4602-ab37-58e9e62dffce
- **Created:** 2026-04-22
- **Multi-chain:** Universal HD wallet supporting 10+ chains

### Supported Addresses
- **EVM (Ethereum, Polygon, Base, etc.):** `0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29`
- **Solana:** `FGUzkKTHjLjbdnbHkkVegbgbmkHFH1Yar8Q1cq4aY1MP`
- **Bitcoin:** `bc1qclvv5n99saugt7slwkcwk6eam3n4992uyp4avm`
- **Cosmos, Tron, TON, Filecoin, Sui, XRPL:** All available via `ows wallet list`

---

## Native Gas Transfer Solution (EIP-1559)

**What:** Signed and sent a native ETH transfer on Base network using OWS wallet.

**Transaction Example:**
- From: `0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29` (skale-default)
- To: `0x4981612fE0B86fef303E436977879A83FA31B801`
- Amount: 0.00002 ETH
- Chain: Base (chainId 8453)
- Hash: `0xca8c38ab2c9fff947f44fdc9b1f01f35ac98ca5d47147576eeb4eafcfafc71de`
- Status: ✅ Confirmed

### The Workflow (3-Step Process)

#### Step 1: Build Unsigned EIP-1559 Transaction
Use Python to RLP-encode the unsigned transaction:

```python
python3.11 << 'PYSCRIPT'
def encode_int_strict(val):
    """Encode integer to minimal bytes without leading zeros"""
    if val == 0:
        return b''
    hex_str = hex(val)[2:]
    if len(hex_str) % 2:
        hex_str = '0' + hex_str
    return bytes.fromhex(hex_str)

def rlp_encode(obj):
    """RLP encoder with proper EIP-1559 formatting"""
    if isinstance(obj, bytes):
        if len(obj) == 0:
            return b'\x80'  # Empty bytes encode to 0x80
        elif len(obj) == 1 and obj[0] < 0x80:
            return obj
        elif len(obj) < 56:
            return bytes([0x80 + len(obj)]) + obj
        else:
            length_bytes = encode_int_strict(len(obj))
            return bytes([0xb7 + len(length_bytes)]) + length_bytes + obj
    elif isinstance(obj, list):
        encoded_items = b''.join(rlp_encode(item) for item in obj)
        if len(encoded_items) < 56:
            return bytes([0xc0 + len(encoded_items)]) + encoded_items
        else:
            length_bytes = encode_int_strict(len(encoded_items))
            return bytes([0xf7 + len(length_bytes)]) + length_bytes + encoded_items
    elif isinstance(obj, int):
        encoded = encode_int_strict(obj)
        return rlp_encode(encoded)
    else:
        return rlp_encode(obj.encode() if isinstance(obj, str) else b'')

# Transaction parameters
chainId = 8453
nonce = 0
maxPriorityFeePerGas = 0xf4240
maxFeePerGas = 0x5b8d80
gasLimit = 21000
to_address = bytes.fromhex("4981612fE0B86fef303E436977879A83FA31B801")
value = 0x12309ce54000  # 0.00002 ETH in wei
data = b''
accessList = []

# Build unsigned transaction list
unsigned_tx_list = [
    chainId,
    nonce,
    maxPriorityFeePerGas,
    maxFeePerGas,
    gasLimit,
    to_address,
    value,
    data,
    accessList
]

encoded = rlp_encode(unsigned_tx_list)
unsigned_eip1559_tx = b'\x02' + encoded  # 0x02 = EIP-1559 type
unsigned_tx_hex = unsigned_eip1559_tx.hex()

print("✅ Unsigned transaction (hex, without 0x prefix):")
print(unsigned_tx_hex)
PYSCRIPT
```

**Output:** `02ed82210580830f4240835b8d80825208944981612fe0b86fef303e436977879a83fa31b8018612309ce5400080c0`

#### Step 2: Sign with OWS
```bash
OWS_WALLET=skale-default ows sign tx \
  --chain base \
  --tx "02ed82210580830f4240835b8d80825208944981612fe0b86fef303e436977879a83fa31b8018612309ce5400080c0" \
  --json
```

**Output:**
```json
{
  "recovery_id": 1,
  "signature": "fc76ac9723cc887d9494836a364ae3aa47ac617470351c3f0f09628d6e7ccafb1b5ab21af6905ff26610b17f880f898db977aadd987603890de7964f4491bbd401"
}
```

#### Step 3: Assemble Signed Transaction
Use Python to reconstruct the signed EIP-1559 transaction:

```python
python3.11 << 'PYSCRIPT'
# Extract r, s, recovery_id from signature
signature_hex = "fc76ac9723cc887d9494836a364ae3aa47ac617470351c3f0f09628d6e7ccafb1b5ab21af6905ff26610b17f880f898db977aadd987603890de7964f4491bbd401"
signature_bytes = bytes.fromhex(signature_hex)
recovery_id = signature_bytes[-1]
r = signature_bytes[:32]
s = signature_bytes[32:64]

# Use same RLP encoder as above...
# Build signed transaction list
signed_tx_list = [
    chainId,
    nonce,
    maxPriorityFeePerGas,
    maxFeePerGas,
    gasLimit,
    to_address,
    value,
    data,
    accessList,
    recovery_id,  # yParity
    r,
    s
]

encoded = rlp_encode(signed_tx_list)
signed_eip1559_tx = b'\x02' + encoded
signed_tx_hex = '0x' + signed_eip1559_tx.hex()

print(signed_tx_hex)
PYSCRIPT
```

**Output:** `0x02f87082210580830f4240835b8d80825208944981612fe0b86fef303e436977879a83fa31b8018612309ce5400080c001a0fc76ac9723cc887d9494836a364ae3aa47ac617470351c3f0f09628d6e7ccafba01b5ab21af6905ff26610b17f880f898db977aadd987603890de7964f4491bbd4`

#### Step 4: Broadcast to Chain
```bash
curl -s -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["0x02f87082210580830f4240835b8d80825208944981612fe0b86fef303e436977879a83fa31b8018612309ce5400080c001a0fc76ac9723cc887d9494836a364ae3aa47ac617470351c3f0f09628d6e7ccafba01b5ab21af6905ff26610b17f880f898db977aadd987603890de7964f4491bbd4"],"id":1}'
```

**Output:**
```json
{"jsonrpc":"2.0","result":"0xca8c38ab2c9fff947f44fdc9b1f01f35ac98ca5d47147576eeb4eafcfafc71de","id":1}
```

---

## Why This Approach?

1. **No heavy dependencies** — Just Python stdlib + curl
2. **Full control** — Manual RLP encoding ensures correctness
3. **OWS handles key management** — Private key never exposed, always encrypted
4. **Portable** — Works on any system with Python 3 and curl
5. **Secure** — OWS policy checks pass before signing

---

## Key Learnings

- **EIP-1559 encoding quirks:** Empty values must be `0x80` (not `0x00`), integers must have no leading zeros
- **Recovery ID matters:** Must be 0 or 1 for proper transaction assembly
- **RLP is strict:** One byte wrong breaks the whole transaction
- **OWS CLI is reliable:** Use `--json` flag for structured output, chain names work fine (no CAIP-2 needed)

---

## Next Steps for Other Transaction Types

- **Token transfers (ERC-20):** Encode `data` field with transfer calldata (function selector + args)
- **Contract calls:** Similar approach; construct calldata instead of empty `data`
- **Multi-chain:** Change `--chain` parameter and RPC URL; addresses auto-derive per chain
