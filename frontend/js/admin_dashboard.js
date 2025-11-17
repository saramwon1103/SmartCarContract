// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // API Base URLs
  const API_BASE_URL = 'http://localhost:3000/api/admin';
  
  // Chart instance
  let carChart = null;
  
  // Initialize dashboard
  initDashboard();
  
  async function initDashboard() {
    try {
      // Load all dashboard data
      await Promise.all([
        loadDashboardStats(),
        loadCarRentalChart(),
        loadRecentTransactions(),
        loadRentalDetails()
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }
  
  // Load main dashboard statistics
  async function loadDashboardStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      
      const stats = await response.json();
      updateStatsDisplay(stats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Use fallback data
      const fallbackStats = {
        totalCars: 30,
        totalUsers: 20,
        totalOwners: 20,
        activeContracts: 8,
        totalRevenue: 4520.00,
        monthlyGrowth: 12.5
      };
      updateStatsDisplay(fallbackStats);
    }
  }
  
  function updateStatsDisplay(stats) {
    // Update stat cards
    const totalCarsEl = document.getElementById('totalCars');
    const totalUsersEl = document.getElementById('totalUsers');
    const activeContractsEl = document.getElementById('activeContracts');
    const totalRevenueEl = document.getElementById('totalRevenue');
    
    if (totalCarsEl) totalCarsEl.textContent = stats.totalCars || 20;
    if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers || 40;
    if (activeContractsEl) activeContractsEl.textContent = stats.activeContracts || 8;
    if (totalRevenueEl) {
      const revenue = stats.totalRevenue || 4520;
      totalRevenueEl.textContent = revenue.toLocaleString();
    }
    
    console.log('Dashboard Stats Updated:', stats);
  }
  
  // Load car rental chart data
  async function loadCarRentalChart() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/car-types`);
      if (!response.ok) throw new Error('Failed to fetch car rental data');
      
      const data = await response.json();
      renderCarChart(data.chartData);
    } catch (error) {
      console.error('Error loading car rental chart:', error);
      // Use fallback data based on actual database brands
      const fallbackData = {
        labels: ['Toyota', 'Honda', 'Hyundai', 'Mazda', 'Kia'],
        data: [8, 3, 3, 2, 2],
        colors: ['#3563E9', '#264BC8', '#85A8F8', '#AEC8FC', '#D6E4FD']
      };
      renderCarChart(fallbackData);
    }
  }
  
  function renderCarChart(chartData) {
    const ctx = document.getElementById('carChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (carChart) {
      carChart.destroy();
    }
    
    carChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.data,
          backgroundColor: chartData.colors,
          borderWidth: 0,
          hoverBackgroundColor: chartData.colors.map(color => color + 'CC'),
          hoverBorderWidth: 2,
          hoverBorderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((context.parsed * 100) / total);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          duration: 1000
        }
      }
    });
    
    // Update legend
    updateChartLegend(chartData);
  }
  
  function updateChartLegend(chartData) {
    const legendContainer = document.querySelector('.chart-legend');
    if (!legendContainer) return;
    
    legendContainer.innerHTML = '';
    
    const total = chartData.data.reduce((sum, value) => sum + value, 0);
    
    // Update center info
    const centerNumber = document.querySelector('.center-number');
    if (centerNumber) centerNumber.textContent = total;
    
    chartData.labels.forEach((label, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div style="display: flex; align-items: center;">
          <span class="dot" style="background-color: ${chartData.colors[index]}"></span>
          <span>${label}</span>
        </div>
        <b>${chartData.data[index]}</b>
      `;
      legendContainer.appendChild(li);
    });
  }
  
  // Load recent transactions
  async function loadRecentTransactions() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/recent-transactions`);
      if (!response.ok) throw new Error('Failed to fetch recent transactions');
      
      const transactions = await response.json();
      renderTransactions(transactions.transactions || []);
    } catch (error) {
      console.error('Error loading recent transactions:', error);
      // Use fallback data
      const fallbackTransactions = [
        {
          contractId: 'CT11',
          carName: 'Honda City',
          carType: 'Honda',
          amount: 88.00,
          date: '2025-11-17',
          imageURL: 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreihehfcugfr2vcyrwie3n3m5euwj7mb72fj5o7v66kakaobvw6w3x4'
        },
        {
          contractId: 'CT12',
          carName: 'Kia Morning',
          carType: 'Kia',
          amount: 70.00,
          date: '2025-11-16',
          imageURL: 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeihvhdvpegoudhmaggfl6jm7zej26qvr7gwv7yszuvpuw7wc6w5u54'
        },
        {
          contractId: 'CT13',
          carName: 'Honda CR-V',
          carType: 'Honda',
          amount: 420.00,
          date: '2025-11-15',
          imageURL: 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeidfbotk5wmspbxvmtgiw2jydexrq5ccxybewsghwbobaqcspyk62a'
        },
        {
          contractId: 'CT09',
          carName: 'Tesla Model 3',
          carType: 'Tesla',
          amount: 320.00,
          date: '2025-11-14',
          imageURL: 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeifhvobh4klbgvhbfstdnrvvjt4as2i5gwk3fhhlynjgfjhmgkshbu'
        }
      ];
      renderTransactions(fallbackTransactions);
    }
  }
  
  function renderTransactions(transactions) {
    const transactionsList = document.querySelector('.transaction-list');
    if (!transactionsList) return;
    
    transactionsList.innerHTML = '';
    
    transactions.slice(0, 4).forEach(transaction => {
      const isHighAmount = transaction.amount >= 300;
      const li = document.createElement('li');
      li.className = 'transaction-item';
      li.innerHTML = `
        <div class="transaction-avatar">
          <img src="${transaction.imageURL}" 
               alt="${transaction.carName}"
               onerror="this.src='https://via.placeholder.com/50x50'">
        </div>
        <div class="transaction-info">
          <h4>${transaction.carName}</h4>
          <p>${transaction.carType} • Contract #${transaction.contractId}</p>
        </div>
        <div class="transaction-meta">
          <span class="transaction-date">${formatDate(transaction.date)}</span>
          <div class="transaction-amount ${isHighAmount ? 'high-amount' : ''}">${transaction.amount.toFixed(2)} CPT</div>
        </div>
      `;
      transactionsList.appendChild(li);
    });
  }
  
  // Load rental details (latest active rental)
  async function loadRentalDetails() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/rental-details`);
      if (!response.ok) throw new Error('Failed to fetch rental details');
      
      const rentalData = await response.json();
      renderRentalDetails(rentalData.rental || {});
    } catch (error) {
      console.error('Error loading rental details:', error);
      // Use fallback data
      const fallbackRental = {
        contractId: 'CT11',
        carName: 'Honda City',
        carType: 'Honda',
        carImage: 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreihehfcugfr2vcyrwie3n3m5euwj7mb72fj5o7v66kakaobvw6w3x4',
        pickupLocation: 'Ho Chi Minh City',
        dropoffLocation: 'Ho Chi Minh City',
        pickupDate: '2025-11-17',
        dropoffDate: '2025-11-20',
        pickupTime: '09:00',
        dropoffTime: '18:00',
        totalPrice: 88.00,
        renterName: 'Trần Thị Hoa',
        status: 'Active'
      };
      renderRentalDetails(fallbackRental);
    }
  }
  
  function renderRentalDetails(rental) {
    if (!rental.contractId) return;
    
    // Update car info
    const carBox = document.querySelector('.car-box');
    if (carBox) {
      carBox.innerHTML = `
        <img src="${rental.carImage}" alt="${rental.carName}" onerror="this.src='https://via.placeholder.com/80x60'">
        <div>
          <h4>${rental.carName}</h4>
          <p>${rental.carType}</p>
        </div>
        <span>#${rental.contractId}</span>
      `;
    }
    
    // Update pickup/dropoff info
    const pickupDrop = document.querySelector('.pickup-drop');
    if (pickupDrop) {
      pickupDrop.innerHTML = `
        <div>
          <h5>Pick - Up</h5>
          <p>Location: ${rental.pickupLocation}</p>
          <p>Date: ${formatDate(rental.pickupDate)}</p>
          <p>Time: ${rental.pickupTime}</p>
        </div>
        <div>
          <h5>Drop - Off</h5>
          <p>Location: ${rental.dropoffLocation}</p>
          <p>Date: ${formatDate(rental.dropoffDate)}</p>
          <p>Time: ${rental.dropoffTime}</p>
        </div>
      `;
    }
    
    // Update total price
    const totalPrice = document.querySelector('.total-price h3');
    if (totalPrice) {
      totalPrice.textContent = `${rental.totalPrice.toFixed(2)} CPT`;
    }
  }
  
  // Utility functions
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }
  
  // Auto refresh dashboard every 5 minutes
  setInterval(() => {
    loadRecentTransactions();
    loadRentalDetails();
  }, 5 * 60 * 1000);
  
  // Export functions for potential external use
  window.adminDashboard = {
    refresh: initDashboard,
    refreshTransactions: loadRecentTransactions,
    refreshChart: loadCarRentalChart
  };
});