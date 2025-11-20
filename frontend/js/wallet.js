// Wallet Connection Modal Script
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const walletModalOverlay = document.getElementById('walletModalOverlay');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const walletOptions = document.querySelectorAll('.wallet-option');

    // Open modal
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', function(e) {
            e.preventDefault();
            walletModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close modal
    function closeModal() {
        walletModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }

    // Close modal when clicking overlay
    if (walletModalOverlay) {
        walletModalOverlay.addEventListener('click', function(e) {
            if (e.target === walletModalOverlay) {
                closeModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && walletModalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

    // Handle wallet selection
    walletOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const walletType = this.getAttribute('data-wallet');
            connectWallet(walletType);
        });
    });

    // Wallet connection function
    async function connectWallet(walletType) {
        console.log('Connecting to wallet:', walletType);

        // Show loading state
        const selectedWallet = document.querySelector(`[data-wallet="${walletType}"]`);
        const originalHTML = selectedWallet.innerHTML;
        selectedWallet.innerHTML = '<span class="wallet-name">Connecting...</span>';
        selectedWallet.style.opacity = '0.6';
        selectedWallet.style.pointerEvents = 'none';

        try {
            switch(walletType) {
                case 'metamask':
                    await connectMetaMask();
                    break;
                case 'walletconnect':
                    await connectWalletConnect();
                    break;
                default:
                    console.log('Wallet type not supported yet');
            }
        } catch (error) {
            console.error('Connection error:', error);
            alert(`Failed to connect to ${walletType}. Please make sure the wallet is installed.`);
            selectedWallet.innerHTML = originalHTML;
            selectedWallet.style.opacity = '1';
            selectedWallet.style.pointerEvents = 'auto';
        }
    }

    // MetaMask connection
    async function connectMetaMask() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                // First request accounts
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                // Check and switch to Hardhat network
                await switchToHardhatNetwork();
                
                console.log('MetaMask connected:', accounts[0]);
                updateConnectedState('MetaMask', accounts[0]);
                closeModal();
            } catch (err) {
                console.error('MetaMask connection error:', err);
                throw new Error('Failed to connect: ' + err.message);
            }
        } else {
            window.open('https://metamask.io/', '_blank');
            throw new Error('MetaMask is not installed');
        }
    }

    // Switch to Hardhat local network
    async function switchToHardhatNetwork() {
        const hardhatChainId = '0x7A69'; // 31337 in hex
        
        try {
            // Try to switch to Hardhat network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: hardhatChainId }]
            });
            
            console.log('Switched to Hardhat network');
        } catch (switchError) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: hardhatChainId,
                            chainName: 'Hardhat Local Network',
                            rpcUrls: ['http://127.0.0.1:8545'],
                            nativeCurrency: {
                                name: 'ETH',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            blockExplorerUrls: null
                        }]
                    });
                    
                    console.log('Added and switched to Hardhat network');
                } catch (addError) {
                    console.error('Failed to add Hardhat network:', addError);
                    throw new Error('Please add Hardhat network (Chain ID: 31337, RPC: http://127.0.0.1:8545) manually in MetaMask');
                }
            } else {
                console.error('Failed to switch network:', switchError);
                throw new Error('Please switch to Hardhat network manually in MetaMask');
            }
        }
    }

    // WalletConnect connection
    async function connectWalletConnect() {
        // For WalletConnect, you would need to import the WalletConnect library
        // This is a placeholder implementation
        console.log('WalletConnect integration requires additional library');
        alert('WalletConnect integration coming soon! Please install WalletConnect library.');
        throw new Error('WalletConnect library not loaded');
    }

    // Update UI when wallet is connected
    function updateConnectedState(walletName, address) {
        // Store connection info
        localStorage.setItem('connectedWallet', walletName);
        localStorage.setItem('walletAddress', address);

        // Update button text
        if (connectWalletBtn) {
            const shortAddress = address.substring(0, 6) + '...' + address.substring(address.length - 4);
            connectWalletBtn.innerHTML = `
                <i class="fa-solid fa-wallet"></i>
                <span>${shortAddress}</span>
            `;
            connectWalletBtn.classList.add('connected');
        }

        // Update wallet info display
        const walletInfo = document.getElementById('walletInfo');
        const walletBalance = document.getElementById('walletBalance');
        const walletAddressElement = document.getElementById('walletAddress');

        if (walletInfo && walletBalance && walletAddressElement) {
            walletInfo.style.display = 'block';
            walletAddressElement.textContent = address.substring(0, 6) + '...' + address.substring(address.length - 4);
            
            // Load both ETH and CPT balances
            loadWalletBalances(address);
        }

        // Show success message
        showNotification(`Successfully connected to ${walletName}!`, 'success');
    }

    // Load both ETH and CPT balance
    async function loadWalletBalances(address) {
        try {
            console.log('Loading balances for address:', address);
            
            // Load ETH balance using ethers
            if (typeof window.ethereum !== 'undefined') {
                const provider = new ethers.BrowserProvider(window.ethereum);
                
                // Check network
                const network = await provider.getNetwork();
                console.log('Connected to network:', network.chainId, network.name);
                
                if (network.chainId !== 31337n) {
                    console.warn('Not connected to Hardhat network (31337). Current:', network.chainId);
                }
                
                const ethBalanceWei = await provider.getBalance(address);
                const ethBalance = parseFloat(ethers.formatEther(ethBalanceWei));
                
                console.log('ETH Balance:', ethBalance, 'ETH');
                
                // Load CPT balance from API
                try {
                    const response = await fetch(`http://localhost:3000/api/wallet/cpt-balance/${address}`);
                    const data = await response.json();
                    
                    console.log('CPT Balance API response:', data);
                    
                    const walletBalance = document.getElementById('walletBalance');
                    if (walletBalance) {
                        if (data.success) {
                            const cptBalance = parseFloat(data.balance).toFixed(2);
                            walletBalance.innerHTML = `
                                <div style="font-size: 12px; line-height: 1.3;">
                                    <div>${ethBalance.toFixed(4)} ETH</div>
                                    <div>${cptBalance} CPT</div>
                                </div>
                            `;
                        } else {
                            walletBalance.innerHTML = `
                                <div style="font-size: 12px; line-height: 1.3;">
                                    <div>${ethBalance.toFixed(4)} ETH</div>
                                    <div>0.00 CPT</div>
                                </div>
                            `;
                        }
                    }
                } catch (apiError) {
                    console.error('Error loading CPT balance from API:', apiError);
                    const walletBalance = document.getElementById('walletBalance');
                    if (walletBalance) {
                        walletBalance.innerHTML = `
                            <div style="font-size: 12px; line-height: 1.3;">
                                <div>${ethBalance.toFixed(4)} ETH</div>
                                <div>API Error</div>
                            </div>
                        `;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading wallet balances:', error);
            const walletBalance = document.getElementById('walletBalance');
            if (walletBalance) {
                walletBalance.innerHTML = `
                    <div style="font-size: 12px; color: red;">
                        Error loading balance
                    </div>
                `;
            }
        }
    }

    // Check if wallet was previously connected
    function checkPreviousConnection() {
        const savedWallet = localStorage.getItem('connectedWallet');
        const savedAddress = localStorage.getItem('walletAddress');

        if (savedWallet && savedAddress) {
            const shortAddress = savedAddress.substring(0, 6) + '...' + savedAddress.substring(savedAddress.length - 4);
            if (connectWalletBtn) {
                connectWalletBtn.innerHTML = `
                    <i class="fa-solid fa-wallet"></i>
                    <span>${shortAddress}</span>
                `;
                connectWalletBtn.classList.add('connected');
            }

            // Update wallet info display
            const walletInfo = document.getElementById('walletInfo');
            const walletBalance = document.getElementById('walletBalance');
            const walletAddressElement = document.getElementById('walletAddress');

            if (walletInfo && walletBalance && walletAddressElement) {
                walletInfo.style.display = 'block';
                walletAddressElement.textContent = shortAddress;
                
                // Load both ETH and CPT balances  
                loadWalletBalances(savedAddress);
            }
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `wallet-notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 140px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' : '#3563E9'};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }

        .connect-wallet-btn.connected {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        }

        .connect-wallet-btn.connected:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }
    `;
    document.head.appendChild(style);

    // Initialize
    checkPreviousConnection();
});
