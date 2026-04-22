# x402 Protocol Integration for SKALE Base

## Overview

Xona resources use the x402 v2 protocol for payments. This document covers the integration details for SKALE Base network.

## Payment Configuration

### Network Details
- **Network**: SKALE Base (Chain ID: `1187947933`)
- **Asset**: USDC
- **Protocol Version**: x402 v2
- **Facilitator**: `https://facilitator.payai.network/` (predefined, works with any x402-compatible facilitator on SKALE Base)

### Payment Flow

1. **User Request**: User initiates content generation
2. **Price Display**: Show exact USDC cost
3. **Confirmation**: Require explicit user approval
4. **Payment**: x402 protocol handles USDC transfer on SKALE Base
5. **Generation**: Request proceeds after payment confirmation
6. **Result**: Generated content URL returned

## x402 Protocol Details

### Request Format
```json
{
  "x402_version": "v2",
  "pricing": {
    "amount": "0.08",
    "asset": "USDC",
    "network": "eip155:1187947933"
  }
}
```

### Facilitator Options

**PayAI Facilitator** (Predefined - `https://facilitator.payai.network/`):
- API proxy service
- Handles x402 payment processing
- Provides request forwarding
- Returns generation results
- Optimized for SKALE Base

**Alternative Facilitators**:
- Any x402 v2 compatible facilitator on SKALE Base
- Direct x402 implementation
- Custom middleware

## Error Handling

### Payment Errors

**Insufficient Balance**:
```
Error: Insufficient USDC balance on SKALE Base
Required: 0.08 USDC
Current: 0.00 USDC
```

Action: Inform user of required amount and suggest funding options.

**Payment Failed**:
```
Error: Payment transaction failed
Reason: [transaction details]
```

Action: Suggest retry or check network status.

### Generation Errors

**Timeout**:
```
Error: Generation request timed out
Model: seedream-4.5
Timeout: 120s
```

Action: Suggest simpler prompt or different model.

**Invalid Parameters**:
```
Error: Invalid parameter value
Parameter: aspect_ratio
Value: "invalid"
```

Action: Guide user to valid parameter values.

**Generation Failed**:
```
Error: Image generation failed
Model: nano-banana
Reason: [details]
```

Action: Suggest retry or alternative model.

## SKALE Base Network Information

### Network Details
- **Chain ID**: TBD (SKALE Base specific)
- **Currency**: USDC
- **Gas Model**: Zero gas fees (SKALE advantage)
- **Confirmation Time**: ~1 second

### USDC on SKALE Base
- Bridged from Ethereum/mainnet
- Same address as Ethereum USDC (using SKALE's native chain account abstraction)
- Fully compatible with ERC-20
- Zero transaction fees

### Funding Options

1. **Bridge USDC**: Bridge from Ethereum/mainnet to SKALE Base
2. **Exchange**: Purchase on exchange and transfer to SKALE Base
3. faucet**: SKALE testnet faucet (for testing)

## Security Considerations

### Payment Security
- All payments require user confirmation
- Exact amounts displayed before approval
- No automatic or hidden charges
- x402 protocol ensures atomic transactions

### API Security
- HTTPS only
- No sensitive data in prompts
- Reference images must be publicly accessible URLs
- No credential storage required

## Best Practices

### For Users
1. Verify pricing before confirming
2. Ensure sufficient USDC balance on SKALE Base
3. Use precise prompts for better results
4. Start with lower-cost models for testing

### For Integration
1. Always display pricing before payment
2. Handle all error cases gracefully
3. Provide clear error messages
4. Suggest alternatives on failure
5. Cache results for re-display

### Cost Optimization
1. Use `nano-banana-2` 1k for previews
2. Use `creative-director` for prompt refinement
3. Batch similar requests
4. Use appropriate resolution for use case

## Troubleshooting

### Common Issues

**Issue**: Payment not processing
- Check SKALE Base network status
- Verify USDC balance
- Confirm facilitator availability

**Issue**: Generation fails
- Verify prompt format
- Check parameter values
- Try alternative model

**Issue**: Slow generation
- Check network status
- Try simpler model
- Reduce prompt complexity

**Issue**: Invalid image URL
- Ensure HTTPS URL
- Verify image is publicly accessible
- Check image format (JPG, PNG recommended)

## Network Status

### Checking SKALE Base Status
Use SKALE Network explorer or status page to verify:
- Network operational status
- Block production
- USDC contract status

### Facilitator Status
Check PayAI or other x402 facilitator status:
- API endpoint availability (`https://facilitator.payai.network/`)
- Payment processing status
- Known issues or maintenance

## References

- x402 Protocol Documentation
- SKALE Network Documentation
- Corbits API Documentation
- Xona API Documentation
