import { ethers } from "ethers";
import { execSync } from "child_process";
import fs from "fs";

const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
const fromAddress = "0xb50CdEBc05b11574610739f3aCfA1f1DDe1e8A29";
const toAddress = "0x4981612fE0B86fef303E436977879A83FA31B801";
const amount = ethers.parseEther("0.00002");

console.log("🔄 Building transaction on Base...");
console.log(`From: ${fromAddress}`);
console.log(`To: ${toAddress}`);
console.log(`Amount: 0.00002 ETH`);

// Get nonce and gas price
const nonce = await provider.getTransactionCount(fromAddress);
const feeData = await provider.getFeeData();

console.log(`\nNonce: ${nonce}`);
console.log(`Gas Price: ${ethers.formatUnits(feeData.gasPrice, "gwei")} gwei`);

// Build the transaction (EIP-1559)
const tx = {
  to: toAddress,
  from: fromAddress,
  value: amount,
  data: "0x",
  nonce: nonce,
  gasLimit: BigInt(21000),
  maxFeePerGas: feeData.maxFeePerGas || feeData.gasPrice,
  maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || BigInt(0),
  chainId: 8453, // Base mainnet
};

// Create unsigned transaction
const unsignedTx = ethers.Transaction.from(tx);
const serialized = unsignedTx.unsignedSerialized;

console.log(`\n📝 Serialized transaction (hex):`);
console.log(serialized);

// Save for signing
fs.writeFileSync("/tmp/unsigned-tx.txt", serialized.substring(2)); // Remove 0x prefix
console.log(`\n✅ Transaction ready for signing`);
