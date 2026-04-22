#!/bin/bash
set -e

# Get mnemonic from OWS wallet via interactive terminal
echo "🔓 Exporting OWS wallet mnemonic..."
MNEMONIC=$(ows wallet export --wallet "skale-default" 2>&1 | tail -1)

if [[ ! "$MNEMONIC" =~ ^[a-z]+ ]]; then
    echo "❌ Failed to get valid mnemonic from OWS"
    exit 1
fi

# Derive private key from mnemonic using Node.js
PRIVATE_KEY=$(node -e "
const bip39 = require('bip39');
const { hdkey } = require('ethereumjs-wallet');

const mnemonic = '$MNEMONIC';
const seed = bip39.mnemonicToSeedSync(mnemonic);
const hdwallet = hdkey.fromMasterSeed(seed);
const wallet = hdwallet.derivePath(\"m/44'/60'/0'/0/0\").getWallet();
const privateKey = '0x' + wallet.getPrivateKey().toString('hex');

console.log(privateKey);
")

if [[ ! "$PRIVATE_KEY" =~ ^0x[a-f0-9]{64}$ ]]; then
    echo "❌ Failed to derive valid private key"
    exit 1
fi

# Run MTM executor with derived private key
export PRIVATE_KEY
node /home/node/clawd/workspace/mtm-executor.js --contract 0x3EA415d43e5ad81E05954193600Cb187B9B96F85 --function mint --count 10

# Cleanup
unset PRIVATE_KEY
