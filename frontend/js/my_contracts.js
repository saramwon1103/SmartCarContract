// My Contracts Management
class MyContractsManager {
    constructor() {
        // Get user from AuthManager for consistency
        this.currentUser = window.AuthManager ? window.AuthManager.getCurrentUser() : this.getCurrentUserFallback();
        this.currentUserId = this.currentUser ? this.currentUser.UserId : null;
        this.contracts = [];
        this.filteredContracts = [];
        this.selectedContract = null;
        
        // Debug logging
        console.log('MyContractsManager - Current User:', this.currentUser);
        console.log('MyContractsManager - User Role:', this.currentUser?.Role);
        console.log('MyContractsManager - User ID:', this.currentUserId);
        
        this.init();
    }

    getCurrentUser() {
        // Use AuthManager if available, fallback to localStorage
        if (window.AuthManager) {
            return window.AuthManager.getCurrentUser();
        }
        return this.getCurrentUserFallback();
    }

    getCurrentUserFallback() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true' && this.currentUser !== null;
    }

    init() {
        this.bindEvents();
        if (this.isLoggedIn() && this.currentUserId) {
            this.loadContracts();
        } else {
            this.redirectToLogin();
        }
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('searchContracts');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterContracts(e.target.value);
            });
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterByStatus(e.target.value);
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadContracts();
            });
        }

        // Contract actions
        const payBtn = document.getElementById('payBtn');
        const viewOnChainBtn = document.getElementById('viewOnChain');
        
        if (payBtn) {
            payBtn.addEventListener('click', () => {
                this.handlePayment();
            });
        }

        if (viewOnChainBtn) {
            viewOnChainBtn.addEventListener('click', () => {
                this.viewOnBlockchain();
            });
        }
    }

    async loadContracts() {
        try {
            this.showLoading();
            
            const response = await fetch(`http://localhost:3000/api/users/${this.currentUserId}/contracts`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to load contracts');
            }
            
            this.contracts = data.contracts || [];
            this.filteredContracts = [...this.contracts];
            
            this.updateStats();
            this.renderContractsTable();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading contracts:', error);
            this.showError('Failed to load contracts. Please try again.');
            this.hideLoading();
        }
    }

    updateStats() {
        const total = this.contracts.length;
        const active = this.contracts.filter(c => c.Status?.toLowerCase() === 'active').length;
        const pending = this.contracts.filter(c => c.Status?.toLowerCase() === 'pending').length;
        const completed = this.contracts.filter(c => c.Status?.toLowerCase() === 'completed').length;

        document.getElementById('totalContracts').textContent = total;
        document.getElementById('activeContracts').textContent = active;
        document.getElementById('pendingContracts').textContent = pending;
        document.getElementById('completedContracts').textContent = completed;
    }

    renderContractsTable() {
        const tbody = document.getElementById('contractsTableBody');
        if (!tbody) return;

        if (this.filteredContracts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No contracts found</td></tr>';
            return;
        }

        tbody.innerHTML = this.filteredContracts.map(contract => `
            <tr onclick="contractsManager.selectContract('${contract.ContractId}')" class="contract-row" data-contract-id="${contract.ContractId}">
                <td>
                    <span class="contract-id">${contract.ContractId}</span>
                </td>
                <td>
                    <div class="table-car-info">
                        <img src="${contract.CarImageURL || '../image/car-placeholder.jpg'}" alt="Car" class="table-car-image">
                        <div>
                            <div class="table-car-name">${contract.CarName || 'Unknown'}</div>
                            <div class="table-car-type">${contract.Brand || 'Unknown Brand'}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="contract-type-badge ${contract.Type?.toLowerCase()}">${contract.Type || 'N/A'}</span>
                </td>
                <td>
                    <div class="date-range">
                        <div class="date-item">
                            <span class="date-label">From:</span>
                            <span class="date-value">${this.formatDate(contract.StartDate)}</span>
                        </div>
                        <div class="date-item">
                            <span class="date-label">To:</span>
                            <span class="date-value">${this.formatDate(contract.EndDate)}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${contract.Status?.toLowerCase()}">${contract.Status || 'N/A'}</span>
                </td>
                <td class="table-price">$${parseFloat(contract.TotalPrice || 0).toFixed(2)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-small btn-view" onclick="event.stopPropagation(); contractsManager.selectContract('${contract.ContractId}')" title="View Details">View</button>
                        ${contract.Status?.toLowerCase() === 'active' ? 
                            '<button class="btn-small btn-pay" onclick="event.stopPropagation(); contractsManager.handlePayment(\'' + contract.ContractId + '\')" title="Make Payment">Pay</button>' : 
                            ''
                        }
                        ${this.currentUser?.Role === 'Owner' && contract.Status?.toLowerCase() === 'pending' ?
                            '<button class="btn-small btn-approve" onclick="event.stopPropagation(); contractsManager.handleOwnerApproval(\'' + contract.ContractId + '\', \'approve\')" title="Approve Contract">Approve</button>' +
                            '<button class="btn-small btn-reject" onclick="event.stopPropagation(); contractsManager.handleOwnerApproval(\'' + contract.ContractId + '\', \'reject\')" title="Reject Contract">Reject</button>' :
                            ''
                        }
                        ${this.currentUser?.Role === 'Owner' && contract.Status?.toLowerCase() === 'paid' ?
                            '<button class="btn-small btn-confirm" onclick="event.stopPropagation(); contractsManager.handlePaymentConfirmation(\'' + contract.ContractId + '\')" title="Confirm Payment Received">Confirm</button>' :
                            ''
                        }
                    </div>
                </td>
            </tr>
        `).join('');
    }

    selectContract(contractId) {
        this.selectedContract = this.contracts.find(c => c.ContractId === contractId);
        console.log('Selected contract:', this.selectedContract);
        if (this.selectedContract) {
            this.displayContractDetails();
            this.highlightSelectedRow(contractId);
            
            // Update payment section after selecting contract
            if (typeof updatePaymentSection === 'function') {
                setTimeout(updatePaymentSection, 100); // Small delay to ensure DOM is updated
            }
        }
    }

    highlightSelectedRow(contractId) {
        // Remove previous selection
        document.querySelectorAll('.contract-row').forEach(row => {
            row.classList.remove('selected');
        });
        
        // Add selection to current row
        const selectedRow = document.querySelector(`[data-contract-id="${contractId}"]`);
        if (selectedRow) {
            selectedRow.classList.add('selected');
        }
    }

    displayContractDetails() {
        if (!this.selectedContract) return;

        const contract = this.selectedContract;
        const detailsPanel = document.getElementById('contractDetails');
        const emptyState = document.getElementById('emptyState');
        
        if (detailsPanel && emptyState) {
            emptyState.style.display = 'none';
            detailsPanel.style.display = 'block';
            detailsPanel.classList.add('show');
        }

        // Update contract details with error checking
        this.safeUpdateElement('detailCarImage', (el) => {
            el.src = contract.CarImageURL || '../image/car-placeholder.jpg';
            el.alt = `${contract.CarName} Image`;
        });
        
        this.safeUpdateElement('detailCarName', (el) => {
            el.textContent = contract.CarName || 'N/A';
        });
        
        this.safeUpdateElement('detailCarType', (el) => {
            const year = contract.ModelYear ? new Date(contract.ModelYear).getFullYear() : 'Unknown';
            el.textContent = `${contract.Brand || 'Unknown'} - ${year}`;
        });
        
        this.safeUpdateElement('detailContractId', (el) => {
            el.textContent = contract.ContractId;
        });
        
        this.safeUpdateElement('detailContractType', (el) => {
            el.textContent = contract.Type || 'N/A';
        });
        
        this.safeUpdateElement('detailTXHash', (el) => {
            el.textContent = contract.TXHash || 'Pending...';
            el.title = contract.TXHash || '';
            if (contract.TXHash) {
                el.style.cursor = 'pointer';
                el.onclick = () => this.viewOnBlockchain();
            }
        });
        
        this.safeUpdateElement('detailStartDate', (el) => {
            el.textContent = this.formatDate(contract.StartDate);
        });
        
        this.safeUpdateElement('detailEndDate', (el) => {
            el.textContent = this.formatDate(contract.EndDate);
        });
        
        // Counterparty information (owner or renter)
        const isOwner = contract.OwnerId === this.currentUserId;
        
        this.safeUpdateElement('detailCounterpartyName', (el) => {
            el.textContent = isOwner ? (contract.RenterName || 'N/A') : (contract.OwnerName || 'N/A');
        });
        
        this.safeUpdateElement('detailCounterpartyEmail', (el) => {
            el.textContent = isOwner ? (contract.RenterEmail || 'N/A') : (contract.OwnerEmail || 'N/A');
        });
        
        this.safeUpdateElement('detailTotalPrice', (el) => {
            el.textContent = `${parseFloat(contract.TotalPrice || 0).toFixed(2)} CPT`;
        });

        // Payment information (for rent contracts)
        if (contract.Type?.toLowerCase() === 'rent') {
            this.updatePaymentInfo(contract);
        } else {
            // Hide payment info for buy contracts
            this.safeUpdateElement('detailInstallmentAmount', (el) => el.textContent = 'N/A');
            this.safeUpdateElement('detailPaidPeriods', (el) => el.textContent = '1');
            this.safeUpdateElement('detailTotalPeriods', (el) => el.textContent = '1');
            this.safeUpdateElement('detailNextPayment', (el) => el.textContent = 'Completed');
        }

        // Update action buttons
        this.updateActionButtons(contract);
        
        // Update payment section after displaying details
        if (typeof updatePaymentSection === 'function') {
            setTimeout(updatePaymentSection, 100);
        }
    }

    safeUpdateElement(elementId, updateFn) {
        const element = document.getElementById(elementId);
        if (element && updateFn) {
            updateFn(element);
        }
    }

    updatePaymentInfo(contract) {
        // Calculate rental days and payment schedule
        const startDate = new Date(contract.StartDate);
        const endDate = new Date(contract.EndDate);
        const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
        const dailyRate = parseFloat(contract.TotalPrice) / totalDays;
        
        this.safeUpdateElement('detailInstallmentAmount', (el) => {
            el.textContent = `${dailyRate.toFixed(2)} CPT/day`;
        });
        
        // For now, assume daily payments (this could be enhanced with actual payment schedule)
        const today = new Date();
        const daysPassed = Math.max(0, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)));
        const paidPeriods = Math.min(daysPassed, totalDays);
        
        this.safeUpdateElement('detailPaidPeriods', (el) => {
            el.textContent = paidPeriods.toString();
        });
        
        this.safeUpdateElement('detailTotalPeriods', (el) => {
            el.textContent = totalDays.toString();
        });
        
        this.safeUpdateElement('detailNextPayment', (el) => {
            if (paidPeriods < totalDays && contract.Status?.toLowerCase() === 'active') {
                const nextPaymentDate = new Date(startDate);
                nextPaymentDate.setDate(nextPaymentDate.getDate() + paidPeriods + 1);
                el.textContent = this.formatDate(nextPaymentDate);
            } else {
                el.textContent = 'N/A';
            }
        });
    }

    updateActionButtons(contract) {
        const payBtn = document.getElementById('payBtn');
        const viewOnChainBtn = document.getElementById('viewOnChain');
        const actionsContainer = document.querySelector('.contract-actions');
        
        if (payBtn) {
            if (contract.Status?.toLowerCase() === 'active' && this.currentUser?.Role !== 'Owner') {
                payBtn.style.display = 'block';
                payBtn.textContent = 'Make Payment';
                // Remove existing click handlers and add new one
                payBtn.onclick = () => this.handlePayment(contract.ContractId);
            } else {
                payBtn.style.display = 'none';
            }
        }
        
        if (viewOnChainBtn) {
            viewOnChainBtn.style.display = contract.TXHash ? 'block' : 'none';
            viewOnChainBtn.onclick = () => this.viewOnBlockchain();
        }

        // Add owner-specific actions
        if (this.currentUser?.Role === 'Owner' && actionsContainer) {
            // Remove existing owner buttons
            const existingOwnerBtns = actionsContainer.querySelectorAll('.owner-action-btn');
            existingOwnerBtns.forEach(btn => btn.remove());

            let ownerButtons = '';
            
            if (contract.Status?.toLowerCase() === 'pending') {
                ownerButtons = `
                    <button class="btn-primary owner-action-btn" onclick="contractsManager.handleOwnerApproval('${contract.ContractId}', 'approve')">
                        Approve Contract
                    </button>
                    <button class="btn-secondary owner-action-btn" onclick="contractsManager.handleOwnerApproval('${contract.ContractId}', 'reject')">
                        Reject Contract
                    </button>
                `;
            } else if (contract.Status?.toLowerCase() === 'paid') {
                ownerButtons = `
                    <button class="btn-primary owner-action-btn" onclick="contractsManager.handlePaymentConfirmation('${contract.ContractId}')">
                        Confirm Payment Received
                    </button>
                `;
            }
            
            if (ownerButtons) {
                actionsContainer.insertAdjacentHTML('beforeend', ownerButtons);
            }
        }
    }

    filterContracts(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredContracts = [...this.contracts];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredContracts = this.contracts.filter(contract =>
                contract.ContractId?.toLowerCase().includes(term) ||
                contract.CarName?.toLowerCase().includes(term) ||
                contract.Brand?.toLowerCase().includes(term) ||
                contract.RenterName?.toLowerCase().includes(term) ||
                contract.OwnerName?.toLowerCase().includes(term)
            );
        }
        this.renderContractsTable();
    }

    filterByStatus(status) {
        if (!status) {
            this.filteredContracts = [...this.contracts];
        } else {
            this.filteredContracts = this.contracts.filter(contract =>
                contract.Status?.toLowerCase() === status.toLowerCase()
            );
        }
        this.renderContractsTable();
    }

    async handlePayment(contractId = null) {
        const contract = contractId ? 
            this.contracts.find(c => c.ContractId === contractId) : 
            this.selectedContract;
            
        if (!contract) {
            alert('No contract selected');
            return;
        }

        // Set as selected contract for payment
        this.selectedContract = contract;
        this.displayContractDetails();

        try {
            // Check if user is logged in and has correct role
            if (this.currentUser?.Role === 'Owner') {
                alert('Owners cannot make payments. Only users can pay for contracts.');
                return;
            }

            // Check if contract is in Active status (ready for payment)
            if (contract.Status?.toLowerCase() !== 'active') {
                alert(`Contract status is ${contract.Status}. Only Active contracts can be paid.`);
                return;
            }

            // Call the MetaMask payment function if available
            if (typeof makeContractPayment === 'function') {
                console.log('Calling makeContractPayment for contract:', contract.ContractId);
                await makeContractPayment();
            } else {
                // Fallback: show connect wallet message
                alert('Please connect your MetaMask wallet first to make payment.');
                
                // Try to trigger wallet connection
                if (typeof connectWallet === 'function') {
                    await connectWallet();
                }
            }
            
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed: ' + error.message);
        }
    }

    viewOnBlockchain() {
        if (!this.selectedContract?.TXHash) return;
        
        // Open blockchain explorer (this would depend on your network)
        const explorerUrl = `https://etherscan.io/tx/${this.selectedContract.TXHash}`;
        window.open(explorerUrl, '_blank');
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    showLoading() {
        const tbody = document.getElementById('contractsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Loading contracts...</td></tr>';
        }
    }

    hideLoading() {
        // Loading is hidden when renderContractsTable is called
    }

    showError(message) {
        const tbody = document.getElementById('contractsTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="table-empty text-error">${message}</td></tr>`;
        }
    }

    redirectToLogin() {
        console.log('User not logged in or user ID not found');
        console.log('Current user:', this.currentUser);
        console.log('Is logged in:', this.isLoggedIn());
        alert('Please login to view your contracts.');
        window.location.href = 'login.html';
    }

    async handleOwnerApproval(contractId, action) {
        try {
            const contract = this.contracts.find(c => c.ContractId === contractId);
            if (!contract) {
                alert('Contract not found');
                return;
            }

            const confirmed = confirm(`${action === 'approve' ? 'Approve' : 'Reject'} contract ${contractId}?`);
            if (!confirmed) return;

            const response = await fetch(`http://localhost:3000/api/contracts/${contractId}/owner-action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    ownerId: this.currentUserId
                })
            });

            const result = await response.json();

            if (result.success) {
                alert(`✅ Contract ${action}d successfully!`);
                this.loadContracts(); // Reload contracts
            } else {
                throw new Error(result.error || `Failed to ${action} contract`);
            }

        } catch (error) {
            console.error(`Owner ${action} error:`, error);
            alert(`Failed to ${action} contract: ` + error.message);
        }
    }

    async handlePaymentConfirmation(contractId) {
        try {
            const contract = this.contracts.find(c => c.ContractId === contractId);
            if (!contract) {
                alert('Contract not found');
                return;
            }

            const confirmed = confirm(`Confirm that you have received payment of $${contract.TotalPrice} for contract ${contractId}?`);
            if (!confirmed) return;

            const response = await fetch(`http://localhost:3000/api/contracts/${contractId}/confirm-payment-received`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ownerId: this.currentUserId
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ Payment confirmation completed! Contract is now completed.');
                this.loadContracts(); // Reload contracts
            } else {
                throw new Error(result.error || 'Failed to confirm payment received');
            }

        } catch (error) {
            console.error('Payment confirmation error:', error);
            alert('Failed to confirm payment: ' + error.message);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.contractsManager = new MyContractsManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MyContractsManager;
}