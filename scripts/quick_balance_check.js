const ethers = require('ethers');

async function checkBalance() {
  try {
    const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
    const address = '0x45B27dc6bE8B48188e31F90699e5E67A835f7B2b';
    
    console.log('Checking balance for:', address);
    console.log('Provider:', provider);
    
    const network = await provider.getNetwork();
    console.log('Connected to network:', network);
    
    const balance = await provider.getBalance(address);
    console.log('Raw balance:', balance.toString());
    
    const formattedBalance = ethers.formatEther(balance);
    console.log('Formatted balance:', formattedBalance, 'ETH');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBalance();
