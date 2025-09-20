// Mobile Navigation Toggle Functionality
function initializeMobileNav() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const mobileClose = document.getElementById('mobile-close');
    
    if (!mobileToggle || !navMenu) {
        return; // Elements not found, exit gracefully
    }
    
    function openMenu() {
        navMenu.classList.add('mobile-visible');
        if (mobileOverlay) mobileOverlay.classList.add('active');
        mobileToggle.setAttribute('aria-expanded', 'true');
        mobileToggle.textContent = '✕';
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
        
        // Focus first menu item for accessibility
        const firstMenuItem = navMenu.querySelector('a, button:not(.mobile-close)');
        if (firstMenuItem) {
            setTimeout(() => firstMenuItem.focus(), 300);
        }
    }
    
    function closeMenu() {
        navMenu.classList.remove('mobile-visible');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.textContent = '☰';
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to toggle button
        mobileToggle.focus();
    }
    
    // Toggle mobile menu
    mobileToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = navMenu.classList.contains('mobile-visible');
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    // Close button functionality
    if (mobileClose) {
        mobileClose.addEventListener('click', function(e) {
            e.stopPropagation();
            closeMenu();
        });
    }
    
    // Close menu when clicking overlay
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', function() {
            closeMenu();
        });
    }
    
    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navMenu.classList.contains('mobile-visible')) {
            closeMenu();
        }
    });
    
    // Close menu when clicking on menu links (except close button)
    const menuLinks = navMenu.querySelectorAll('a, button:not(.mobile-close)');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Add small delay for better UX
            setTimeout(() => {
                closeMenu();
            }, 150);
        });
    });
    
    // Handle window resize - hide mobile menu on larger screens
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });
    
    // Trap focus within menu when open
    navMenu.addEventListener('keydown', function(e) {
        if (e.key === 'Tab' && navMenu.classList.contains('mobile-visible')) {
            const focusableElements = navMenu.querySelectorAll('a, button');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
}

// Initialize mobile navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeMobileNav);