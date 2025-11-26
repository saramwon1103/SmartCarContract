// User Sidebar Component Loader
(function() {
  'use strict';

  // Load sidebar HTML
  async function loadSidebar() {
    const sidebarContainer = document.querySelector('.dashboard-container');
    if (!sidebarContainer) {
      console.log('No dashboard-container found, using fallback sidebar');
      createFallbackSidebar();
      return;
    }

    // Check if sidebar already exists
    const existingSidebar = sidebarContainer.querySelector('.sidebar');
    if (existingSidebar) {
      console.log('Sidebar already exists, updating active state');
      setActivePage();
      setupLogout();
      return;
    }

    try {
      console.log('Loading sidebar from component file...');
      const response = await fetch('../html/components/user_sidebar.html');
      if (!response.ok) throw new Error(`Failed to load sidebar: ${response.status}`);
      
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
        
        console.log('Sidebar loaded successfully from component');
        
        // Set active state based on current page
        setActivePage();
        
        // Setup logout handler
        setupLogout();
      } else {
        throw new Error('Sidebar element not found in component');
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
    
    if (filename === 'index.html' || filename === '' || filename.includes('index')) return 'home';
    if (filename.includes('my_contracts')) return 'contracts';
    if (filename.includes('profile')) return 'profile';
    if (filename.includes('wallet')) return 'wallet';
    
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
        <a href="home.html" data-page="home">
          <img src="../image/home.svg" class="icon" alt="Home icon"> Home
        </a>
        <a href="my_contracts.html" data-page="contracts">
          <img src="../image/car.svg" class="icon" alt="Contracts icon"> My Contracts
        </a>
        <a href="profile.html" data-page="profile">
          <img src="../image/person.svg" class="icon" alt="Profile icon"> Profile
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
    console.log('Logout clicked');
    console.log('AuthManager available:', typeof AuthManager !== 'undefined');
    
    // Use AuthManager if available
    if (typeof AuthManager !== 'undefined' && AuthManager.logout) {
      console.log('Using AuthManager logout');
      AuthManager.logout();
    } else {
      console.log('Using fallback logout');
      // Fallback: clear localStorage and redirect
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
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

