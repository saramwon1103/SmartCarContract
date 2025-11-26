// Authentication and Authorization Manager
const AuthManager = {
    // Check if user is logged in
    isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true';
    },

    // Get current user
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Save user session
    setSession(user) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true');
    },

    // Clear user session
    clearSession() {
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
    },

    // Logout
    async logout() {
        try {
            await fetch('http://localhost:3000/api/auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        this.clearSession();
        window.location.href = 'login.html';
    },

    // Check if user has required role
    hasRole(allowedRoles) {
        const user = this.getCurrentUser();
        if (!user) return false;
        return allowedRoles.includes(user.Role);
    },

    // Protect page - redirect if not authenticated or wrong role
    protectPage(allowedRoles = ['User', 'Owner', 'Admin']) {
        if (!this.isLoggedIn()) {
            alert('Please login to access this page');
            window.location.href = 'login.html';
            return false;
        }

        if (!this.hasRole(allowedRoles)) {
            alert('You do not have permission to access this page');
            this.redirectToHome();
            return false;
        }

        return true;
    },

    // Redirect to appropriate home based on role
    redirectToHome() {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        switch (user.Role) {
            case 'Admin':
                window.location.href = 'admin_dashboard.html';
                break;
            case 'Owner':
                window.location.href = 'owner_home.html';
                break;
            default:
                window.location.href = 'home.html';
        }
    },

    // Update user profile in header
    updateHeaderProfile() {
        const user = this.getCurrentUser();
        if (!user) return;

        // Update avatar if exists
        const avatarElements = document.querySelectorAll('.avatar, .profile-avatar img');
        avatarElements.forEach(el => {
            if (user.AvatarURL) {
                el.src = user.AvatarURL;
            }
        });

        // Update username if element exists
        const usernameElements = document.querySelectorAll('.username, .user-name');
        usernameElements.forEach(el => {
            el.textContent = user.FullName;
        });
    }
};

// Page access control configuration
const PageAccess = {
    // Pages accessible by each role
    'home.html': ['User', 'Owner'],
    'owner_home.html': ['Owner'],
    'admin_dashboard.html': ['Admin'],
    'admin_users.html': ['Admin'],
    'admin_car.html': ['Admin', 'Owner'],
    'admin_contract.html': ['Admin'],
    'car_detail.html': ['User', 'Owner'],
    'rental_form.html': ['User', 'Owner'],
    'my_contracts.html': ['User', 'Owner'],
    'profile.html': ['User', 'Owner', 'Admin']
};

// Auto-protect pages on load
window.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Skip protection for login and register pages
    if (currentPage === 'login.html' || currentPage === 'register.html' || currentPage === '') {
        return;
    }

    // Check if page needs protection
    const allowedRoles = PageAccess[currentPage];
    if (allowedRoles) {
        AuthManager.protectPage(allowedRoles);
    }

    // Update header with user info
    AuthManager.updateHeaderProfile();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, PageAccess };
}