// wallet-auth.js - Tích hợp đăng nhập với wallet system
class WalletAuthManager {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';
        this.currentUser = null;
        this.userWallet = null;
        this.web3 = null;
        this.init();
    }

    async init() {
        // Khởi tạo Web3 nếu MetaMask có sẵn
        if (typeof window.ethereum !== 'undefined') {
            this.web3 = new Web3(window.ethereum);
        }
        
        // Kiểm tra user đã đăng nhập chưa
        this.loadUserSession();
    }

    // Load user session từ localStorage
    loadUserSession() {
        const userStr = localStorage.getItem('user');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (isLoggedIn && userStr) {
            this.currentUser = JSON.parse(userStr);
            this.loadUserWallet();
        }
    }

    // Lấy thông tin wallet của user
    async loadUserWallet() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`${this.apiBase}/users/${this.currentUser.UserId}/wallet`);
            const data = await response.json();
            
            if (data.success && data.wallet) {
                this.userWallet = data.wallet;
            }
        } catch (error) {
            console.error('Error loading user wallet:', error);
        }
    }

    // Đăng nhập user
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                // Lưu session
                this.currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('isLoggedIn', 'true');
                
                // Load wallet info
                await this.loadUserWallet();
                
                return { success: true, user: data.user, wallet: this.userWallet };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // Kiểm tra và yêu cầu kết nối MetaMask
    async connectWallet() {
        if (!this.web3) {
            throw new Error('MetaMask is not installed');
        }

        try {
            // Yêu cầu kết nối MetaMask
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            const walletAddress = accounts[0];
            
            // Cập nhật wallet cho user hiện tại
            if (this.currentUser) {
                const result = await this.updateUserWallet(walletAddress);
                if (result.success) {
                    this.userWallet = {
                        WalletAddress: walletAddress,
                        NetWork: 'Hardhat'
                    };
                }
                return { success: true, address: walletAddress };
            } else {
                return { success: false, error: 'User not logged in' };
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            return { success: false, error: error.message };
        }
    }

    // Cập nhật wallet address cho user
    async updateUserWallet(walletAddress) {
        if (!this.currentUser) {
            return { success: false, error: 'User not logged in' };
        }

        try {
            const response = await fetch(`${this.apiBase}/users/${this.currentUser.UserId}/wallet`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    walletAddress,
                    network: 'Hardhat'
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Update wallet error:', error);
            return { success: false, error: error.message };
        }
    }

    // Kiểm tra điều kiện để thuê xe
    async checkRentalEligibility() {
        const checks = {
            loggedIn: this.isLoggedIn(),
            hasWallet: this.hasWallet(),
            walletConnected: false,
            cptBalance: 0,
            eligible: false,
            message: ''
        };

        // Kiểm tra đăng nhập
        if (!checks.loggedIn) {
            checks.message = 'Please login to rent a car';
            return checks;
        }

        // Kiểm tra có wallet không
        if (!checks.hasWallet) {
            checks.message = 'Please connect your wallet to rent a car';
            return checks;
        }

        // Kiểm tra wallet có kết nối với MetaMask không
        if (this.web3 && this.userWallet) {
            try {
                const accounts = await this.web3.eth.getAccounts();
                checks.walletConnected = accounts.includes(this.userWallet.WalletAddress);
                
                if (checks.walletConnected) {
                    // Kiểm tra CPT balance
                    const balanceResponse = await fetch(`${this.apiBase}/wallet/cpt-balance/${this.userWallet.WalletAddress}`);
                    const balanceData = await balanceResponse.json();
                    
                    if (balanceData.success) {
                        checks.cptBalance = parseFloat(balanceData.balance);
                    }
                }
            } catch (error) {
                console.error('Wallet check error:', error);
            }
        }

        // Xác định eligible
        checks.eligible = checks.loggedIn && checks.hasWallet && checks.walletConnected;
        
        if (checks.eligible) {
            if (checks.cptBalance > 0) {
                checks.message = 'Ready to rent! You can proceed with car rental.';
            } else {
                checks.message = 'Wallet connected but no CPT balance. You may need to buy tokens.';
            }
        } else if (checks.hasWallet && !checks.walletConnected) {
            checks.message = 'Please switch MetaMask to the wallet associated with your account';
        }

        return checks;
    }

    // Utility methods
    isLoggedIn() {
        return this.currentUser !== null && localStorage.getItem('isLoggedIn') === 'true';
    }

    hasWallet() {
        return this.userWallet && this.userWallet.WalletAddress;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserWallet() {
        return this.userWallet;
    }

    // Đăng xuất
    logout() {
        this.currentUser = null;
        this.userWallet = null;
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    }

    // Redirect đến trang phù hợp
    redirectToRole() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        switch (this.currentUser.Role) {
            case 'Admin':
                window.location.href = 'admin_dashboard.html';
                break;
            case 'Owner':
                window.location.href = 'owner_home.html';
                break;
            default:
                window.location.href = 'home.html';
        }
    }
}

// Global instance
window.walletAuth = new WalletAuthManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletAuthManager;
}