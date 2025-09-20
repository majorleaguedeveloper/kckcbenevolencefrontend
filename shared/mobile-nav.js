// Mobile Navigation Toggle Functionality
function initializeMobileNav() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (!mobileToggle || !navMenu) {
        return; // Elements not found, exit gracefully
    }
    
    // Toggle mobile menu
    mobileToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        navMenu.classList.toggle('mobile-visible');
        
        // Update aria-expanded for accessibility
        const isExpanded = navMenu.classList.contains('mobile-visible');
        mobileToggle.setAttribute('aria-expanded', isExpanded);
        
        // Change hamburger icon
        mobileToggle.textContent = isExpanded ? '✕' : '☰';
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
            navMenu.classList.remove('mobile-visible');
            mobileToggle.setAttribute('aria-expanded', 'false');
            mobileToggle.textContent = '☰';
        }
    });
    
    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navMenu.classList.contains('mobile-visible')) {
            navMenu.classList.remove('mobile-visible');
            mobileToggle.setAttribute('aria-expanded', 'false');
            mobileToggle.textContent = '☰';
            mobileToggle.focus(); // Return focus to toggle button
        }
    });
    
    // Close menu when clicking on menu links (for better UX)
    const menuLinks = navMenu.querySelectorAll('a, button');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('mobile-visible');
            mobileToggle.setAttribute('aria-expanded', 'false');
            mobileToggle.textContent = '☰';
        });
    });
    
    // Handle window resize - hide mobile menu on larger screens
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navMenu.classList.remove('mobile-visible');
            mobileToggle.setAttribute('aria-expanded', 'false');
            mobileToggle.textContent = '☰';
        }
    });
}

// Initialize mobile navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeMobileNav);