#!/bin/bash

# BITE V1 FreeMint Mint Wrapper
# Encrypts and submits a FreeMint mint() transaction via BITE V1 on SKALE Base
# 
# Usage:
#   bash bite-freemint-mint.sh
#   bash bite-freemint-mint.sh --chain skale-base-sepolia
#   bash bite-freemint-mint.sh --wallet my-wallet

CHAIN="${CHAIN:-skale-base}"
WALLET="${OWS_WALLET:-skale-default}"
FREEMINT_ADDRESS="0x3b3475C987796c2880ecb60c6EcD5dFAf8d81fBf"

echo "🔐 BITE V1 FreeMint Mint Transaction"
echo "   Chain: $CHAIN"
echo "   Wallet: $WALLET"
echo "   FreeMint: $FREEMINT_ADDRESS"
echo ""

# Ensure bite-executor.js exists in parent directory
if [ ! -f "../bite-executor.js" ]; then
    echo "❌ bite-executor.js not found in parent directory"
    exit 1
fi

# Execute BITE transaction
OWS_WALLET="$WALLET" node ../bite-executor.js \
    --contract "$FREEMINT_ADDRESS" \
    --function "mint" \
    --chain "$CHAIN" \
    --wallet "$WALLET"
