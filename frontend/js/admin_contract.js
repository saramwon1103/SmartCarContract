// Admin Contract Management JavaScript

// Utility Functions
function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  const text = element.textContent;
  
  if (text && text !== '-') {
    navigator.clipboard.writeText(text).then(() => {
      // Show success feedback
      const copyBtn = element.parentElement.querySelector('.copy-btn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✅';
      copyBtn.style.background = '#10b981';
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // API Base URL
  const API_BASE_URL = 'http://localhost:3000/api/admin';
  
  // Global variables
  let contractsData = [];
  let selectedContract = null;
  
  // Initialize the page
  initContractManagement();
  
  async function initContractManagement() {
    try {
      await loadContracts();
      updateStats();
      renderTable();
      setupEventListeners();
      
      // Initialize UI state
      const detailsPanel = document.getElementById('contractDetails');
      const emptyState = document.getElementById('emptyState');
      
      if (detailsPanel) detailsPanel.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      
    } catch (error) {
      console.error('Error initializing contract management:', error);
      showError('Failed to load contract data');
    }
  }
  
  // Load contracts from backend
  async function loadContracts() {
    try {
      const response = await fetch(`${API_BASE_URL}/contracts`);
      if (!response.ok) throw new Error('Failed to fetch contracts');
      
      const data = await response.json();
      contractsData = data.contracts || [];
    } catch (error) {
      console.error('Error loading contracts:', error);
      // Use fallback data based on actual database structure
      contractsData = [
        {
          ContractId: "CT11",
          CarId: "C009",
          UserId: "U021",
          OwnerId: "U009",
          Type: "Rent",
          StartDate: "2025-11-17",
          EndDate: "2025-11-20",
          Deposit: 22.00,
          TotalAmount: 88.00,
          Status: "Active",
          TXHash: "0x1234567890abcdef1234567890abcdef12345678",
          // Joined data from Cars table
          CarName: "Honda City",
          Brand: "Honda",
          ImageURL: "https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreihehfcugfr2vcyrwie3n3m5euwj7mb72fj5o7v66kakaobvw6w3x4",
          // Joined data from Users table
          UserName: "Trần Thị Hoa",
          UserEmail: "hoa.tran@example.com",
          OwnerName: "Nguyễn Văn Minh",
          OwnerEmail: "minh.nguyen@example.com"
        },
        {
          ContractId: "CT12",
          CarId: "C012",
          UserId: "U022",
          OwnerId: "U012",
          Type: "Rent",
          StartDate: "2025-11-16",
          EndDate: "2025-11-19",
          Deposit: 14.00,
          TotalAmount: 42.00,
          Status: "Pending",
          TXHash: "0x2345678901bcdef012345678901bcdef01234567",
          CarName: "Kia Morning",
          Brand: "Kia",
          ImageURL: "https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeihvhdvpegoudhmaggfl6jm7zej26qvr7gwv7yszuvpuw7wc6w5u54",
          UserName: "Lê Văn Đức",
          UserEmail: "duc.le@example.com",
          OwnerName: "Phạm Thị Lan",
          OwnerEmail: "lan.pham@example.com"
        },
        {
          ContractId: "CT13",
          CarId: "C015",
          UserId: "U023",
          OwnerId: "U015",
          Type: "Rent",
          StartDate: "2025-11-15",
          EndDate: "2025-11-25",
          Deposit: 105.00,
          TotalAmount: 420.00,
          Status: "Active",
          TXHash: "0x3456789012cdef0123456789012cdef01234567",
          CarName: "Honda CR-V",
          Brand: "Honda",
          ImageURL: "https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeidfbotk5wmspbxvmtgiw2jydexrq5ccxybewsghwbobaqcspyk62a",
          UserName: "Hoàng Minh Tuấn",
          UserEmail: "tuan.hoang@example.com",
          OwnerName: "Trần Văn Hùng",
          OwnerEmail: "hung.tran@example.com"
        },
        {
          ContractId: "CT09",
          CarId: "C020",
          UserId: "U024",
          OwnerId: "U020",
          Type: "Rent",
          StartDate: "2025-11-10",
          EndDate: "2025-11-14",
          Deposit: 80.00,
          TotalAmount: 320.00,
          Status: "Completed",
          TXHash: "0x4567890123def01234567890123def01234567",
          CarName: "Tesla Model 3",
          Brand: "Tesla",
          ImageURL: "https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeifhvobh4klbgvhbfstdnrvvjt4as2i5gwk3fhhlynjgfjhmgkshbu",
          UserName: "Vũ Thị Mai",
          UserEmail: "mai.vu@example.com",
          OwnerName: "Nguyễn Thanh Tùng",
          OwnerEmail: "tung.nguyen@example.com"
        }
      ];
    }
  }
  
  // Render contracts table
  function renderTable(data = contractsData) {
    const tbody = document.getElementById('rentedCarsTable');
    if (!tbody) return;
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="table-empty">No contracts found</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(contract => `
      <tr data-contract-id="${contract.ContractId}" class="contract-row">
        <td class="contract-id">${contract.ContractId}</td>
        <td>
          <div class="table-car-info">
            <img src="${contract.ImageURL}" alt="${contract.CarName}" class="table-car-image" 
                 onerror="this.src='https://via.placeholder.com/60x40'">
            <div>
              <p class="table-car-name">${contract.CarName}</p>
              <p class="table-car-type">${contract.Brand}</p>
            </div>
          </div>
        </td>
        <td>
          <div class="table-customer-info">
            <p class="table-customer-name">${contract.UserName}</p>
            <p class="table-customer-email">${contract.UserEmail}</p>
          </div>
        </td>
        <td>
          <div class="table-owner-info">
            <p class="table-owner-name">${contract.OwnerName}</p>
            <p class="table-owner-email">${contract.OwnerEmail}</p>
          </div>
        </td>
        <td class="contract-type">${contract.Type}</td>
        <td><span class="status-badge status-${contract.Status.toLowerCase()}">${contract.Status}</span></td>
        <td class="table-price">${contract.Deposit.toFixed(2)} CPT</td>
        <td class="table-price">${contract.TotalAmount.toFixed(2)} CPT</td>
        <td>
          <div class="action-buttons">
            <button class="btn-view" data-contract-id="${contract.ContractId}" data-action="view">
              View
            </button>
            <button class="btn-action" data-contract-id="${contract.ContractId}" data-action="update">
              Update
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    // Add click event listeners to rows
    tbody.querySelectorAll('.contract-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (!e.target.closest('.action-buttons')) {
          const contractId = row.getAttribute('data-contract-id');
          selectContract(contractId);
        }
      });
    });
    
    // Add click event listeners to action buttons
    tbody.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const contractId = btn.getAttribute('data-contract-id');
        selectContract(contractId);
      });
    });
    
    tbody.querySelectorAll('.btn-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const contractId = btn.getAttribute('data-contract-id');
        updateContractStatus(contractId);
      });
    });
  }
  
  // Update statistics
  function updateStats() {
    const total = contractsData.length;
    const active = contractsData.filter(c => c.Status === 'Active').length;
    const pending = contractsData.filter(c => c.Status === 'Pending').length;
    const completed = contractsData.filter(c => c.Status === 'Completed').length;

    const totalEl = document.getElementById('totalContracts');
    const activeEl = document.getElementById('activeContracts');
    const pendingEl = document.getElementById('pendingContracts');
    const completedEl = document.getElementById('completedContracts');
    
    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (pendingEl) pendingEl.textContent = pending;
    if (completedEl) completedEl.textContent = completed;
  }
  
  // Select contract to view details
  function selectContract(contractId) {
    selectedContract = contractsData.find(c => c.ContractId === contractId);
    if (!selectedContract) {
      console.log('Contract not found:', contractId);
      return;
    }

    console.log('Selected contract:', selectedContract);

    // Update car info
    const carImage = document.getElementById('detailCarImage');
    const carName = document.getElementById('detailCarName');
    const carType = document.getElementById('detailCarType');
    const contractIdEl = document.getElementById('detailContractId');
    
    if (carImage) {
      carImage.src = selectedContract.ImageURL;
      carImage.onerror = function() { this.src = 'https://via.placeholder.com/80x60'; };
    }
    if (carName) carName.textContent = selectedContract.CarName;
    if (carType) carType.textContent = `${selectedContract.Brand} • ${selectedContract.Type}`;
    if (contractIdEl) contractIdEl.textContent = `#${selectedContract.ContractId}`;

    // Update contract details
    updateDetailField('detailContractType', selectedContract.Type);
    updateDetailField('detailTXHash', selectedContract.TXHash || 'Pending blockchain confirmation');
    updateDetailField('detailStartDate', formatDate(selectedContract.StartDate));
    updateDetailField('detailEndDate', formatDate(selectedContract.EndDate));
    
    // Update customer info
    updateDetailField('detailCustomerName', selectedContract.UserName);
    updateDetailField('detailCustomerEmail', selectedContract.UserEmail);
    updateDetailField('detailOwnerName', selectedContract.OwnerName);
    updateDetailField('detailOwnerEmail', selectedContract.OwnerEmail);
    
    // Update pricing
    updateDetailField('detailDeposit', `${selectedContract.Deposit.toFixed(2)} CPT`);
    updateDetailField('detailTotalPrice', `${selectedContract.TotalAmount.toFixed(2)} CPT`);
    
    // Show contract status
    updateContractStatusDisplay(selectedContract.Status);

    // Show details panel and hide empty state
    const detailsPanel = document.getElementById('contractDetails');
    const emptyState = document.getElementById('emptyState');
    
    if (detailsPanel) {
      detailsPanel.classList.add('show');
      detailsPanel.style.display = 'block';
    }
    if (emptyState) {
      emptyState.style.display = 'none';
    }
    
    // Highlight selected row
    document.querySelectorAll('.contract-row').forEach(row => {
      row.classList.remove('selected');
    });
    
    // Find and highlight the clicked row
    const selectedRow = document.querySelector(`tr[data-contract-id="${contractId}"]`);
    if (selectedRow) {
      selectedRow.classList.add('selected');
    }
    
    console.log('Contract details updated successfully');
  }
  
  function updateDetailField(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = value || '-';
  }
  
  function updateContractStatusDisplay(status) {
    const statusEl = document.getElementById('detailStatus');
    if (statusEl) {
      statusEl.textContent = status;
      statusEl.className = `status-badge status-${status.toLowerCase()}`;
    }
  }
  
  // Filter and search functionality
  function filterContracts() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    
    if (!searchInput || !statusFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;

    let filtered = contractsData.filter(contract => {
      const matchSearch = 
        contract.ContractId.toLowerCase().includes(searchTerm) ||
        contract.CarName.toLowerCase().includes(searchTerm) ||
        contract.Brand.toLowerCase().includes(searchTerm) ||
        contract.UserName.toLowerCase().includes(searchTerm) ||
        contract.UserEmail.toLowerCase().includes(searchTerm) ||
        contract.OwnerName.toLowerCase().includes(searchTerm) ||
        contract.OwnerEmail.toLowerCase().includes(searchTerm) ||
        contract.Type.toLowerCase().includes(searchTerm) ||
        contract.StartDate.toLowerCase().includes(searchTerm) ||
        contract.EndDate.toLowerCase().includes(searchTerm);
      
      const matchStatus = !statusValue || contract.Status === statusValue;
      return matchSearch && matchStatus;
    });

    renderTable(filtered);
  }
  
  // Update contract status
  async function updateContractStatus(contractId) {
    if (!contractId) return;
    
    const contract = contractsData.find(c => c.ContractId === contractId);
    if (!contract) return;
    
    const newStatus = prompt(`Update status for contract ${contractId}:`, contract.Status);
    if (!newStatus) return;
    
    const validStatuses = ['Pending', 'Active', 'Completed', 'Terminated'];
    if (!validStatuses.includes(newStatus)) {
      alert('Invalid status. Valid values: ' + validStatuses.join(', '));
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update contract status');
      
      // Update local data
      contract.Status = newStatus;
      updateStats();
      renderTable();
      
      if (selectedContract && selectedContract.ContractId === contractId) {
        updateContractStatusDisplay(newStatus);
      }
      
      showSuccess(`Contract ${contractId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating contract status:', error);
      showError('Failed to update contract status');
    }
  }
  
  // View on blockchain
  function viewOnBlockchain() {
    if (!selectedContract || !selectedContract.TXHash) {
      showError('No transaction hash available');
      return;
    }
    
    // Open Ethereum blockchain explorer
    const explorerUrl = `https://etherscan.io/tx/${selectedContract.TXHash}`;
    window.open(explorerUrl, '_blank');
  }
  
  // Terminate contract
  async function terminateContract() {
    if (!selectedContract) return;
    
    if (selectedContract.Status === 'Completed' || selectedContract.Status === 'Terminated') {
      showError('Cannot terminate a completed or already terminated contract');
      return;
    }
    
    const confirmMessage = `Are you sure you want to terminate contract ${selectedContract.ContractId}?\nThis action cannot be undone.`;
    if (!confirm(confirmMessage)) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${selectedContract.ContractId}/terminate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Failed to terminate contract');
      
      // Update local data
      selectedContract.Status = 'Terminated';
      updateStats();
      renderTable();
      updateContractStatusDisplay('Terminated');
      
      showSuccess(`Contract ${selectedContract.ContractId} has been terminated`);
    } catch (error) {
      console.error('Error terminating contract:', error);
      showError('Failed to terminate contract');
    }
  }
  
  // Refresh data
  async function refreshData() {
    try {
      showInfo('Refreshing contract data...');
      await loadContracts();
      updateStats();
      renderTable();
      showSuccess('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showError('Failed to refresh data');
    }
  }
  
  // Utility functions
  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }
  
  function showSuccess(message) {
    showNotification(message, 'success');
  }
  
  function showError(message) {
    showNotification(message, 'error');
  }
  
  function showInfo(message) {
    showNotification(message, 'info');
  }
  
  function showNotification(message, type = 'info') {
    // Simple notification system - you can enhance this
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    switch(type) {
      case 'success':
        notification.style.backgroundColor = '#10b981';
        break;
      case 'error':
        notification.style.backgroundColor = '#ef4444';
        break;
      default:
        notification.style.backgroundColor = '#3b82f6';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  // Setup event listeners
  function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) {
      searchInput.addEventListener('input', debounce(filterContracts, 300));
    }
    
    if (statusFilter) {
      statusFilter.addEventListener('change', filterContracts);
    }
    
    // Global functions for HTML onclick handlers
    window.selectContract = selectContract;
    window.updateContractStatus = updateContractStatus;
    window.viewOnBlockchain = viewOnBlockchain;
    window.terminateContract = terminateContract;
    window.refreshData = refreshData;
  }
  
  // Debounce function for search
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
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
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
});