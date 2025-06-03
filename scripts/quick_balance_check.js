const ethers = require('ethers');

async function checkBalance() {
  try {
    const provider = new ethers.JsonRpcProvider('https://api.avax-test.network/ext/bc/C/rpc');
    const address = '0x47168A987D52D18e5e3558A90606818DA09Bd472';
    
    console.log('Checking balance for:', address);
    console.log('Provider:', provider);
    
    const network = await provider.getNetwork();
    console.log('Connected to network:', network);
    
    const balance = await provider.getBalance(address);
    console.log('Raw balance:', balance.toString());
    
    const formattedBalance = ethers.formatEther(balance);
    console.log('Formatted balance:', formattedBalance, 'AVAX');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBalance();
