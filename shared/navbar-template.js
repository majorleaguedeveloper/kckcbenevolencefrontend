function createNavbarHTML(config) {
    const {
        theme = '',
        userName = '',
        navigation = [],
        showLogout = true
    } = config;

    return `
        <nav class="navbar ${theme}">
            <div class="navbar-container">
                <!-- Brand/Title -->
                <div class="navbar-brand">
                    MNK Benevolence
                </div>

                <!-- Desktop Navigation -->
                <div class="navbar-nav">
                    ${userName ? `<span class="navbar-user">${userName}</span>` : ''}
                    ${navigation.map(item => `
                        <a href="${item.href}" class="nav-link" title="${item.title || item.text}">
                            ${item.text}
                        </a>
                    `).join('')}
                </div>

                <!-- Support Nav-->
                <div>
                    <button class="support-button">
                        Support
                    </button>
                </div>

                <!-- Mobile Toggle Button -->
                <button class="navbar-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
                    <div class="hamburger">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>
            </div>

            <!-- Mobile Menu Overlay -->
            <div class="navbar-overlay"></div>

            <!-- Mobile Navigation Menu -->
            <div class="navbar-mobile-menu">
                ${userName ? `<div class="mobile-user">${userName}</div>` : ''}
                ${navigation.map(item => `
                    <a href="${item.href}" class="mobile-nav-link">
                        ${item.text}
                    </a>
                `).join('')}
                ${showLogout ? `
                    <button class="mobile-logout" onclick="handleLogout()">
                        Logout
                    </button>
                ` : ''}
            </div>
        </nav>
    `;
}

// Predefined navigation configurations
const NAVBAR_CONFIGS = {
    admin: {
        theme: 'admin-theme',
        navigation: [
            {
                text: 'Dashboard',
                href: 'index.html',
                title: 'Go to Admin Dashboard'
            },
            {
                text: 'Claims',
                href: 'claims.html',
                title: 'Manage Claims'
            },
            {
                text: 'Users',
                href: 'users.html',
                title: 'Manage Users'
            },
            {
                text: 'Amendments',
                href: 'amendments.html',
                title: 'Manage Family Information Amendments'
            }
        ]
    },
    
    member: {
        theme: 'member-theme',
        navigation: [
            {
                text: 'Dashboard',
                href: 'index.html',
                title: 'Go to Dashboard'
            },
            {
                text: 'Claims',
                href: 'claims.html',
                title: 'View Claims'
            },
            {
                text: 'My Profile',
                href: 'profile.html',
                title: 'View My Profile'
            },
            {
                text: 'Endorsements',
                href: 'endorsements.html',
                title: 'Manage Endorsement Requests'
            }
        ]
    }
};

// Helper function to inject navbar into page
function injectNavbar(configName, userName = '') {
    const config = NAVBAR_CONFIGS[configName];
    if (!config) {
        console.error(`Navbar configuration '${configName}' not found`);
        return;
    }
    
    config.userName = userName;
    
    const navbarHTML = createNavbarHTML(config);
    
    // Insert navbar at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    
    // Add spacer class to prevent content overlap
    const mainContent = document.querySelector('main, .container, .dashboard-content');
    if (mainContent) {
        mainContent.style.marginTop = '20px';
    }
}

// Logout handler function
function handleLogout() {
    if (typeof AuthService !== 'undefined' && AuthService.logout) {
        AuthService.logout();
    } else {
        // Fallback logout
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../login.html';
    }
}

// Auto-inject navbar if data attributes are present
document.addEventListener('DOMContentLoaded', function() {
    const body = document.body;
    const navbarType = body.getAttribute('data-navbar');
    const userName = body.getAttribute('data-user-name');
    
    if (navbarType) {
        injectNavbar(navbarType, userName);
    }
});