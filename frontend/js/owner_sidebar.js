// Owner Sidebar Component Loader
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
      const response = await fetch('../html/components/owner_sidebar.html');
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
        
        // Setup navigation handlers
        setupNavigation();
        
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
    
    if (filename === 'owner_home.html' || filename === 'home.html' || filename.includes('home')) return 'home';
    if (filename.includes('my_contracts')) return 'contracts';
    if (filename.includes('profile')) return 'profile';
    if (filename.includes('owner_car')) return 'cars';
    
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
        <a href="#" data-page="home" data-url="owner_home.html">
          <img src="../image/home.svg" class="icon" alt="Home icon"> Home
        </a>
        <a href="#" data-page="contracts" data-url="my_contracts.html">
          <img src="../image/car.svg" class="icon" alt="Contracts icon"> My Contracts
        </a>
        <a href="#" data-page="profile" data-url="profile.html">
          <img src="../image/person.svg" class="icon" alt="Profile icon"> Profile
        </a>
        <a href="#" data-page="cars" data-url="owner_car.html">
          <img src="../image/car.svg" class="icon" alt="Cars icon"> My Cars
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
    
    // Setup navigation handlers
    setupNavigation();
    
    // Setup logout handler
    setupLogout();
  }

  // Setup navigation functionality
  function setupNavigation() {
    console.log('Setting up owner sidebar navigation');
    const navLinks = document.querySelectorAll('.sidebar .menu a[data-url]');
    
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const url = this.getAttribute('data-url');
        const currentPage = window.location.pathname.split('/').pop();
        
        console.log('Owner navigation clicked:', {
          url: url,
          currentPage: currentPage,
          pageName: this.getAttribute('data-page')
        });
        
        if (url && url !== currentPage) {
          // Add loading state
          this.style.opacity = '0.6';
          this.style.pointerEvents = 'none';
          
          // For my_contracts, ensure clean loading
          if (url === 'my_contracts.html') {
            console.log('Navigating to My Contracts...');
            // Clear any existing contract data
            if (window.contractsManager) {
              delete window.contractsManager;
            }
            // Clear any cached data
            sessionStorage.removeItem('contractsData');
            localStorage.removeItem('selectedContract');
          }
          
          // Small delay for visual feedback
          setTimeout(() => {
            window.location.href = url;
          }, 100);
        } else {
          console.log('Already on the target page:', url);
        }
      });
    });
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

