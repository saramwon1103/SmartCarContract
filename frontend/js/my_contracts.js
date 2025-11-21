// My Contracts Management
class MyContractsManager {
    constructor() {
        // Get user from AuthManager instead of direct localStorage
        this.currentUser = this.getCurrentUser();
        this.currentUserId = this.currentUser ? this.currentUser.UserId : null;
        this.contracts = [];
        this.filteredContracts = [];
        this.selectedContract = null;
        this.init();
    }

    getCurrentUser() {
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
                <td class="table-price">$${parseFloat(contract.Deposit || 0).toFixed(2)}</td>
                <td class="table-price">$${parseFloat(contract.TotalPrice || 0).toFixed(2)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-small btn-view" onclick="event.stopPropagation(); contractsManager.selectContract('${contract.ContractId}')" title="View Details">View</button>
                        ${contract.Status?.toLowerCase() === 'active' ? 
                            '<button class="btn-small btn-pay" onclick="event.stopPropagation(); contractsManager.handlePayment(\'' + contract.ContractId + '\')" title="Make Payment">Pay</button>' : 
                            ''
                        }
                    </div>
                </td>
            </tr>
        `).join('');
    }

    selectContract(contractId) {
        this.selectedContract = this.contracts.find(c => c.ContractId === contractId);
        if (this.selectedContract) {
            this.displayContractDetails();
            this.highlightSelectedRow(contractId);
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
        
        this.safeUpdateElement('detailDeposit', (el) => {
            el.textContent = `$${parseFloat(contract.Deposit || 0).toFixed(2)}`;
        });
        
        this.safeUpdateElement('detailTotalPrice', (el) => {
            el.textContent = `$${parseFloat(contract.TotalPrice || 0).toFixed(2)}`;
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
            el.textContent = `$${dailyRate.toFixed(2)}/day`;
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
        
        if (payBtn) {
            if (contract.Status?.toLowerCase() === 'active' && contract.Type?.toLowerCase() === 'rent') {
                payBtn.style.display = 'block';
                payBtn.textContent = 'Pay Installment';
            } else {
                payBtn.style.display = 'none';
            }
        }
        
        if (viewOnChainBtn) {
            viewOnChainBtn.style.display = contract.TXHash ? 'block' : 'none';
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
            
        if (!contract) return;

        try {
            // Redirect to payment page or open payment modal
            // For now, just show an alert
            alert(`Payment functionality for contract ${contract.ContractId} will be implemented here.`);
            
            // Example of how to implement actual payment:
            /*
            const response = await fetch(`/api/payment/make/${contract.ContractId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.currentUserId,
                    amount: dailyRate,
                    paymentMethod: 'crypto'
                })
            });
            
            if (response.ok) {
                this.loadContracts(); // Refresh contracts
                alert('Payment successful!');
            } else {
                throw new Error('Payment failed');
            }
            */
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again.');
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.contractsManager = new MyContractsManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MyContractsManager;
}