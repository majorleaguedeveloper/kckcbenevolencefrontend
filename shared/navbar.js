/**
 * ============================================
 * RESPONSIVE NAVBAR COMPONENT
 * ============================================
 */

class ResponsiveNavbar {
    constructor() {
        this.navbar = null;
        this.toggle = null;
        this.overlay = null;
        this.mobileMenu = null;
        this.isOpen = false;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.navbar = document.querySelector('.navbar');
        this.toggle = document.querySelector('.navbar-toggle');
        this.overlay = document.querySelector('.navbar-overlay');
        this.mobileMenu = document.querySelector('.navbar-mobile-menu');
        
        if (!this.toggle || !this.mobileMenu) {
            return; // Navbar elements not found
        }
        
        this.bindEvents();
        this.setActiveNavItem();
    }
    
    bindEvents() {
        // Toggle button click
        this.toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });
        
        // Overlay click to close
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                this.closeMenu();
            });
        }
        
        // Close menu when clicking mobile nav links
        const mobileLinks = this.mobileMenu.querySelectorAll('.mobile-nav-link, .mobile-logout');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Small delay for better UX
                setTimeout(() => this.closeMenu(), 150);
            });
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isOpen) {
                this.closeMenu();
            }
        });
        
        // Handle scroll (optional: hide navbar on scroll)
        // this.handleScroll();
    }
    
    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        this.isOpen = true;
        this.toggle.classList.add('active');
        this.mobileMenu.classList.add('active');
        if (this.overlay) {
            this.overlay.classList.add('active');
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Update ARIA attributes
        this.toggle.setAttribute('aria-expanded', 'true');
        
        // Focus first menu item
        const firstMenuItem = this.mobileMenu.querySelector('.mobile-nav-link');
        if (firstMenuItem) {
            setTimeout(() => firstMenuItem.focus(), 300);
        }
    }
    
    closeMenu() {
        this.isOpen = false;
        this.toggle.classList.remove('active');
        this.mobileMenu.classList.remove('active');
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Update ARIA attributes
        this.toggle.setAttribute('aria-expanded', 'false');
        
        // Return focus to toggle button
        this.toggle.focus();
    }
    
    setActiveNavItem() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Desktop nav items
        const desktopNavItems = document.querySelectorAll('.navbar-nav .nav-link');
        desktopNavItems.forEach(link => {
            const linkPage = link.getAttribute('href');
            if (linkPage === currentPage || 
                (currentPage === '' && linkPage === 'index.html')) {
                link.classList.add('active');
            }
        });
        
        // Mobile nav items
        const mobileNavItems = document.querySelectorAll('.mobile-nav-link');
        mobileNavItems.forEach(link => {
            const linkPage = link.getAttribute('href');
            if (linkPage === currentPage || 
                (currentPage === '' && linkPage === 'index.html')) {
                link.classList.add('active');
            }
        });
    }
    
    // Optional: Auto-hide navbar on scroll
    handleScroll() {
        let lastScrollTop = 0;
        const delta = 5;
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (Math.abs(lastScrollTop - scrollTop) <= delta) {
                return;
            }
            
            if (scrollTop > lastScrollTop && scrollTop > this.navbar.offsetHeight) {
                // Scrolling down
                this.navbar.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up
                this.navbar.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
        });
    }
    
    // Public method to close menu (can be called externally)
    close() {
        this.closeMenu();
    }
    
    // Public method to set user name
    setUserName(name, role = '') {
        const desktopUser = document.querySelector('.navbar-user');
        const mobileUser = document.querySelector('.mobile-user');
        
        if (desktopUser) {
            desktopUser.textContent = name;
        }
        
        if (mobileUser) {
            mobileUser.textContent = `${name}${role ? ` (${role})` : ''}`;
        }
    }
    
    // Public method to update subtitle
    setSubtitle(subtitle) {
        const subtitleElement = document.querySelector('.navbar-subtitle');
        if (subtitleElement) {
            subtitleElement.textContent = subtitle;
        }
    }
}

// Auto-initialize navbar when script loads
let navbarInstance;

function initNavbar() {
    navbarInstance = new ResponsiveNavbar();
    
    // Make instance globally available
    window.navbar = navbarInstance;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}