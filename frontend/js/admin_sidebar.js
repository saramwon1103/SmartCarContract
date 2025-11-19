// Admin Sidebar Component Loader
(function() {
  'use strict';

  // Load sidebar HTML
  async function loadSidebar() {
    const sidebarContainer = document.querySelector('.dashboard-container');
    if (!sidebarContainer) return;

    // Check if sidebar already exists
    const existingSidebar = sidebarContainer.querySelector('.sidebar');
    if (existingSidebar) {
      // Just update active state
      setActivePage();
      return;
    }

    try {
      const response = await fetch('../html/components/admin_sidebar.html');
      if (!response.ok) throw new Error('Failed to load sidebar');
      
      const sidebarHTML = await response.text();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sidebarHTML;
      const sidebar = tempDiv.querySelector('.sidebar');
      
      if (sidebar) {
        // Insert sidebar before main content
        const main = sidebarContainer.querySelector('.main');
        if (main) {
          sidebarContainer.insertBefore(sidebar, main);
        } else {
          sidebarContainer.insertBefore(sidebar, sidebarContainer.firstChild);
        }
        
        // Set active state based on current page
        setActivePage();
        
        // Setup logout handler
        setupLogout();
      }
    } catch (error) {
      console.error('Error loading sidebar:', error);
      // Fallback: create basic sidebar if fetch fails
      createFallbackSidebar();
    }
  }

  // Set active page in navigation
  function setActivePage() {
    const currentPage = getCurrentPageName();
    const menuLinks = document.querySelectorAll('.sidebar .menu a');
    
    menuLinks.forEach(link => {
      link.classList.remove('active');
      const pageName = link.getAttribute('data-page');
      if (pageName === currentPage) {
        link.classList.add('active');
      }
    });
  }

  // Get current page name from URL
  function getCurrentPageName() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || '';
    
    if (filename.includes('admin_dashboard')) return 'dashboard';
    if (filename.includes('admin_contract')) return 'contract';
    if (filename.includes('admin_users')) return 'users';
    if (filename.includes('admin_car')) return 'cars';
    
    return '';
  }

  // Fallback sidebar if fetch fails
  function createFallbackSidebar() {
    const sidebarContainer = document.querySelector('.dashboard-container');
    if (!sidebarContainer) return;

    // Check if sidebar already exists
    const existingSidebar = sidebarContainer.querySelector('.sidebar');
    if (existingSidebar) {
      setActivePage();
      return;
    }

    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
      <h2 class="logo">MORENT</h2>
      <nav class="menu">
        <a href="admin_dashboard.html" data-page="dashboard">
          <img src="../image/home.svg" class="icon" alt="Dashboard icon"> Dashboard
        </a>
        <a href="admin_contract.html" data-page="contract">
          <img src="../image/contract.svg" class="icon" alt="Contract icon"> Contracts
        </a>
        <a href="admin_users.html" data-page="users">
          <img src="../image/person.svg" class="icon" alt="User icon"> User
        </a>
        <a href="admin_car.html" data-page="cars">
          <img src="../image/car.svg" class="icon" alt="Car icon"> Cars
        </a>
      </nav>
      <div class="sidebar-footer">
        <a href="#" id="logoutBtn" class="logout-link">
          <img src="../image/setting.svg" class="icon" alt="Logout icon"> Log out
        </a>
      </div>
    `;
    
    const main = sidebarContainer.querySelector('.main');
    if (main) {
      sidebarContainer.insertBefore(sidebar, main);
    } else {
      sidebarContainer.insertBefore(sidebar, sidebarContainer.firstChild);
    }
    
    setActivePage();
    
    // Setup logout handler
    setupLogout();
  }

  // Setup logout functionality
  function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        handleLogout();
      });
    }
  }

  // Handle logout
  function handleLogout() {
    // Use AuthManager if available
    if (typeof AuthManager !== 'undefined' && AuthManager.logout) {
      AuthManager.logout();
    } else {
      // Fallback: clear localStorage and redirect
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar);
  } else {
    loadSidebar();
  }
})();

