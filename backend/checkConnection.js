const { ethers } = require("ethers");

async function main() {
  try {
    const provider = new ethers.providers.JsonRpcProvider({
      url: "http://127.0.0.1:8545", // change to your actual RPC URL if needed
      timeout: 10000,
    }, {
      name: "localhost",
      chainId: 31337, // Hardhat's default chain ID
    });

    const network = await provider.getNetwork();
    console.log("✅ Connected to network:", network);

    const blockNumber = await provider.getBlockNumber();
    console.log("📦 Current Block Number:", blockNumber);

    const accounts = await provider.listAccounts();
    console.log("👤 Available Accounts:", accounts);

  } catch (err) {
    console.error("❌ Error connecting to blockchain:");
    console.error(err);
  }
}

main();
