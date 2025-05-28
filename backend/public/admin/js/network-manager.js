/**
 * Network Manager Component for DBIS Admin Dashboard
 * Allows switching between local Hardhat and Avalanche Fuji networks
 */

// Network Manager Component
class NetworkManager {
  constructor() {
    this.networkStatusElement = document.getElementById('network-status');
    this.networkSwitchForm = document.getElementById('network-switch-form');
    this.contractStatusElement = document.getElementById('contract-status');
    this.apiBaseUrl = '/api/network';
    
    this.init();
  }
  
  /**
   * Initialize the component
   */
  init() {
    this.fetchNetworkStatus();
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    if (this.networkSwitchForm) {
      this.networkSwitchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(this.networkSwitchForm);
        const network = formData.get('network');
        this.switchNetwork(network);
      });
    }
  }
  
  /**
   * Fetch current network status
   */
  async fetchNetworkStatus() {
    try {
      this.showLoading('Fetching network status...');
      
      const response = await fetch(`${this.apiBaseUrl}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch network status');
      }
      
      const data = await response.json();
      this.updateNetworkStatusUI(data.network);
      
    } catch (error) {
      this.showError(`Error fetching network status: ${error.message}`);
    }
  }
  
  /**
   * Fetch contract status
   */
  async fetchContractStatus() {
    try {
      this.showLoading('Fetching contract status...');
      
      const response = await fetch(`${this.apiBaseUrl}/contract`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch contract status');
      }
      
      const data = await response.json();
      this.updateContractStatusUI(data.contractStatus);
      
    } catch (error) {
      this.showError(`Error fetching contract status: ${error.message}`);
    }
  }
  
  /**
   * Switch network
   * @param {String} network - Network to switch to ('local' or 'avalanche')
   */
  async switchNetwork(network) {
    try {
      this.showLoading(`Switching to ${network === 'local' ? 'Local Hardhat' : 'Avalanche Fuji Testnet'} network...`);
      
      const response = await fetch(`${this.apiBaseUrl}/switch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ network })
      });
      
      if (!response.ok) {
        throw new Error('Failed to switch network');
      }
      
      const data = await response.json();
      this.showSuccess(`Successfully switched to ${data.network.networkName} network`);
      
      // Update UI
      this.updateNetworkStatusUI(data.network);
      
      // Fetch contract status after switching
      this.fetchContractStatus();
      
    } catch (error) {
      this.showError(`Error switching network: ${error.message}`);
    }
  }
  
  /**
   * Update network status UI
   * @param {Object} networkData - Network data
   */
  updateNetworkStatusUI(networkData) {
    if (!this.networkStatusElement) return;
    
    const { network, networkName, rpcUrl, contractAddress } = networkData;
    
    const html = `
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Network Status</h5>
          <span class="badge ${network === 'local' ? 'bg-info' : 'bg-primary'}">${networkName}</span>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <strong>Network:</strong> ${networkName}
          </div>
          <div class="mb-3">
            <strong>RPC URL:</strong> ${rpcUrl}
          </div>
          <div class="mb-3">
            <strong>Contract Address:</strong> 
            ${contractAddress ? 
              `<a href="${network === 'avalanche' ? 'https://testnet.snowtrace.io/address/' + contractAddress : '#'}" 
                target="_blank" class="text-break">${contractAddress}</a>` : 
              '<span class="text-danger">Not deployed</span>'}
          </div>
        </div>
      </div>
    `;
    
    this.networkStatusElement.innerHTML = html;
  }
  
  /**
   * Update contract status UI
   * @param {Object} contractStatus - Contract status
   */
  updateContractStatusUI(contractStatus) {
    if (!this.contractStatusElement) return;
    
    const { accessible, deployed, address, network, error } = contractStatus;
    
    const html = `
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Contract Status</h5>
          <span class="badge ${accessible ? 'bg-success' : 'bg-danger'}">
            ${accessible ? 'Accessible' : 'Not Accessible'}
          </span>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <strong>Network:</strong> ${network}
          </div>
          <div class="mb-3">
            <strong>Deployed:</strong> 
            <span class="${deployed ? 'text-success' : 'text-danger'}">
              ${deployed ? 'Yes' : 'No'}
            </span>
          </div>
          ${address ? `
          <div class="mb-3">
            <strong>Address:</strong> 
            <span class="text-break">${address}</span>
          </div>
          ` : ''}
          ${error ? `
          <div class="alert alert-danger">
            <strong>Error:</strong> ${error}
          </div>
          ` : ''}
        </div>
      </div>
    `;
    
    this.contractStatusElement.innerHTML = html;
  }
  
  /**
   * Show loading message
   * @param {String} message - Loading message
   */
  showLoading(message) {
    // Implementation depends on your UI framework
    console.log(message);
  }
  
  /**
   * Show success message
   * @param {String} message - Success message
   */
  showSuccess(message) {
    // Implementation depends on your UI framework
    console.log(message);
  }
  
  /**
   * Show error message
   * @param {String} message - Error message
   */
  showError(message) {
    // Implementation depends on your UI framework
    console.error(message);
  }
  
  /**
   * Get auth token from local storage
   * @returns {String} Auth token
   */
  getAuthToken() {
    return localStorage.getItem('authToken') || '';
  }
}

// Initialize the component when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new NetworkManager();
});
