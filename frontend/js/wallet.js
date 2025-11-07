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
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                console.log('MetaMask connected:', accounts[0]);
                updateConnectedState('MetaMask', accounts[0]);
                closeModal();
            } catch (err) {
                throw new Error('User rejected the request');
            }
        } else {
            window.open('https://metamask.io/', '_blank');
            throw new Error('MetaMask is not installed');
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

        // Show success message
        showNotification(`Successfully connected to ${walletName}!`, 'success');
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
