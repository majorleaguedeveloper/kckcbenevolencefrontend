/**
 * ============================================
 * NAVBAR HTML TEMPLATE GENERATOR
 * ============================================
 */

function createNavbarHTML(config) {
    const {
        title = 'Benevolence Fund',
        subtitle = '',
        theme = 'admin-theme',
        userName = '',
        navigation = [],
        showLogout = true
    } = config;

    return `
        <nav class="navbar ${theme}">
            <div class="navbar-container">
                <!-- Brand/Title -->
                <div class="navbar-brand">
                    ${title}
                    ${subtitle ? `<span class="navbar-subtitle">${subtitle}</span>` : ''}
                </div>

                <!-- Desktop Navigation -->
                <div class="navbar-nav">
                    ${userName ? `<span class="navbar-user">${userName}</span>` : ''}
                    ${navigation.map(item => `
                        <a href="${item.href}" class="nav-link" title="${item.title || item.text}">
                            ${item.icon ? `<span class="nav-icon">${item.icon}</span>` : ''}
                            ${item.text}
                        </a>
                    `).join('')}
                    ${showLogout ? `
                        <button class="navbar-logout" onclick="handleLogout()" title="Logout">
                            <span class="logout-icon">🚪</span>
                            Logout
                        </button>
                    ` : ''}
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
                        ${item.icon ? `<span class="mobile-nav-icon">${item.icon}</span>` : ''}
                        ${item.text}
                    </a>
                `).join('')}
                ${showLogout ? `
                    <button class="mobile-logout" onclick="handleLogout()">
                        <span class="logout-icon">🚪</span>
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
        title: 'Benevolence Fund',
        subtitle: 'Admin Portal',
        theme: 'admin-theme',
        navigation: [
            {
                text: 'Dashboard',
                href: 'index.html',
                icon: '📊',
                title: 'Go to Admin Dashboard'
            },
            {
                text: 'Claims Management',
                href: 'claims.html',
                icon: '📋',
                title: 'Manage Claims'
            },
            {
                text: 'User Management',
                href: 'users.html',
                icon: '👥',
                title: 'Manage Users'
            },
            {
                text: 'Amendment Management',
                href: 'amendments.html',
                icon: '📝',
                title: 'Manage Family Information Amendments'
            }
        ]
    },
    
    member: {
        title: 'Benevolence Fund',
        subtitle: 'Member Portal',
        theme: 'member-theme',
        navigation: [
            {
                text: 'Dashboard',
                href: 'index.html',
                icon: '🏠',
                title: 'Go to Dashboard'
            },
            {
                text: 'My Claims',
                href: 'claims.html',
                icon: '📝',
                title: 'View My Claims'
            },
            {
                text: 'My Profile',
                href: 'profile.html',
                icon: '👤',
                title: 'View My Profile'
            },
            {
                text: 'Endorsements',
                href: 'endorsements.html',
                icon: '🤝',
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