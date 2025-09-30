document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is already logged in
    if (AuthService.isLoggedIn()) {
        const user = AuthService.getUser();
        if (user && user.role === 'user') {
            // Check if user data has endorsement fields, if not refresh it
            if (!user.hasOwnProperty('endorsementStatus')) {
                try {
                    await refreshUserData();
                } catch (error) {
                    console.error('Failed to refresh user data:', error);
                    // Fallback: redirect to login
                    AuthService.logout();
                    window.location.href = '../login.html?role=member';
                    return;
                }
            }
            
            // Check if user requires endorsement
            if (AuthService.requiresEndorsement()) {
                window.location.href = '../request-endorsement.html';
                return;
            }
            showDashboard();
        } else {
            // Not a regular user, redirect to login with member role
            AuthService.logout();
            window.location.href = '../login.html?role=member';
        }
    } else {
        // Not logged in, redirect to login with member role
        window.location.href = '../login.html?role=member';
    }

    // Logout is now handled by the navbar component
});

async function refreshUserData() {
    try {
        const response = await AuthService.makeRequest('/endorsements/status');
        if (response.ok) {
            const statusData = await response.json();
            
            // Get current user data and update with endorsement fields
            const currentUser = AuthService.getUser();
            const updatedUser = {
                ...currentUser,
                endorsementStatus: statusData.endorsementStatus,
                endorsementDate: statusData.endorsementDate,
                endorsedBy: statusData.endorsedBy
            };
            
            AuthService.setUser(updatedUser);
            return updatedUser;
        } else {
            throw new Error(`Failed to fetch endorsement status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error refreshing user data:', error);
        throw error;
    }
}

function showDashboard() {
    const user = AuthService.getUser();
    
    // Update navbar with user information (navbar is auto-injected via data-navbar attribute)
    const userNameElement = document.querySelector('.navbar-user, .mobile-user');
    if (userNameElement) {
        userNameElement.textContent = `${user.firstName} ${user.lastName}`;
    }
    
    loadPendingPayments();
    loadPaymentHistory();
}

async function loadPendingPayments(showLoading = true) {
    const loadingElement = document.getElementById('loading-pending');
    const listElement = document.getElementById('pending-payments-list');
    
    // Only show loading spinner for initial load, not for background refreshes
    if (showLoading) {
        loadingElement.style.display = 'block';
        listElement.innerHTML = '';
    }

    try {
        const response = await AuthService.makeRequest('/payments/member/pending-payments');
        const data = await response.json();

        if (showLoading) {
            loadingElement.style.display = 'none';
        }

        if (response.ok) {
            const newContent = data.pendingPayments.length === 0 
                ? '<p class="no-data">No pending payments at this time.</p>'
                : data.pendingPayments.map(request => createPendingPaymentHTML(request)).join('');
            
            // Only update content if it's different to avoid flashing
            if (listElement.innerHTML !== newContent) {
                listElement.innerHTML = newContent;
            }
        } else {
            if (showLoading || listElement.innerHTML === '') {
                listElement.innerHTML = '<p class="error">Failed to load pending payments.</p>';
            }
        }
    } catch (error) {
        if (showLoading) {
            loadingElement.style.display = 'none';
        }
        if (showLoading || listElement.innerHTML === '') {
            listElement.innerHTML = '<p class="error">Network error. Please try again.</p>';
        }
    }
}

async function loadPaymentHistory(showLoading = true) {
    const loadingElement = document.getElementById('loading-history');
    const listElement = document.getElementById('payment-history-list');
    
    // Only show loading spinner for initial load, not for background refreshes
    if (showLoading) {
        loadingElement.style.display = 'block';
        listElement.innerHTML = '';
    }

    try {
        const response = await AuthService.makeRequest('/payments/member/payment-history');
        const data = await response.json();

        if (showLoading) {
            loadingElement.style.display = 'none';
        }

        if (response.ok) {
            const newContent = data.payments.length === 0 
                ? '<p class="no-data">No payment history found.</p>'
                : data.payments.map(payment => createPaymentHistoryHTML(payment)).join('');
            
            // Only update content if it's different to avoid flashing
            if (listElement.innerHTML !== newContent) {
                listElement.innerHTML = newContent;
            }
        } else {
            if (showLoading || listElement.innerHTML === '') {
                listElement.innerHTML = '<p class="error">Failed to load payment history.</p>';
            }
        }
    } catch (error) {
        if (showLoading) {
            loadingElement.style.display = 'none';
        }
        if (showLoading || listElement.innerHTML === '') {
            listElement.innerHTML = '<p class="error">Network error. Please try again.</p>';
        }
    }
}

function createPendingPaymentHTML(request) {
    return `
        <div class="payment-request-item">
            <div class="payment-request-header">
                <div>
                    <div class="payment-request-title">${request.title}</div>
                    <div class="payment-request-meta">
                        Due: ${formatDate(request.dueDate)}
                    </div>
                </div>
            </div>
            
            <div class="payment-request-description">${request.description}</div>
            
            <div class="payment-actions">
                <button onclick="redirectToPayment('${request._id}', '${request.stripePaymentLinkUrl}')" class="btn btn-success">
                    Pay Now
                </button>
            </div>
        </div>
    `;
}

function createPaymentHistoryHTML(payment) {
    const statusClass = `status-${payment.status}`;
    
    return `
        <div class="payment-history-item">
            <div class="payment-info">
                <h4>${payment.paymentRequest.title}</h4>
                ${payment.amount ? `<p>Amount: ${formatCurrency(payment.amount)}</p>` : ''}
                <p>Date: ${formatDate(payment.createdAt)}</p>
            </div>
            <div>
                <span class="status-badge ${statusClass}">${payment.status}</span>
            </div>
        </div>
    `;
}

async function redirectToPayment(paymentRequestId, paymentLinkUrl) {
    console.log('redirectToPayment called with:', { paymentRequestId, paymentLinkUrl });
    
    // Validate inputs
    if (!paymentRequestId) {
        console.error('Missing paymentRequestId');
        alert('Error: Payment request ID is missing');
        return;
    }
    
    if (!paymentLinkUrl) {
        console.error('Missing paymentLinkUrl');
        alert('Error: Payment link URL is missing');
        return;
    }

    try {
        // Track payment link click
        console.log('Tracking payment click...');
        const response = await AuthService.makeRequest('/payments/member/track-payment-click', {
            method: 'POST',
            body: JSON.stringify({ paymentRequestId })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Payment tracking response:', data);
        } else {
            console.log('Payment tracking failed:', response.status);
        }
    } catch (error) {
        console.log('Failed to track payment click:', error);
        // Continue with redirect even if tracking fails
    }

    // Find the button that was clicked (more reliable approach)
    const allPayButtons = document.querySelectorAll('button');
    let clickedButton = null;
    
    allPayButtons.forEach(btn => {
        if (btn.textContent.includes('Pay Now')) {
            clickedButton = btn;
        }
    });

    // Show processing message
    if (clickedButton) {
        const originalText = clickedButton.textContent;
        clickedButton.textContent = 'Opening Payment...';
        clickedButton.disabled = true;
        
        // Reset button after delay
        setTimeout(() => {
            clickedButton.textContent = originalText;
            clickedButton.disabled = false;
        }, 3000);
    }

    console.log('Attempting to open payment URL:', paymentLinkUrl);
    
    // First try to validate the URL
    try {
        new URL(paymentLinkUrl);
        console.log('Payment URL is valid');
    } catch (urlError) {
        console.error('Invalid payment URL:', urlError);
        alert('Error: Invalid payment link URL');
        return;
    }

    // Try different approaches to open the payment link
    try {
        // Method 1: window.open (preferred)
        const popup = window.open(paymentLinkUrl, '_blank');
        
        if (!popup) {
            console.warn('Popup blocked, trying alternative method');
            // Method 2: Direct window location
            if (confirm('Popup blocked. Click OK to navigate to payment page in current tab.')) {
                window.location.href = paymentLinkUrl;
                return;
            }
        } else {
            console.log('Payment page opened successfully');
        }
    } catch (openError) {
        console.error('Failed to open payment URL:', openError);
        alert('Error opening payment page. Please try again.');
        return;
    }
    
    // Set up periodic refresh to catch payment updates
    let refreshCount = 0;
    const maxRefreshes = 12; // Refresh for up to 3 minutes (12 * 15 seconds)
    
    const refreshInterval = setInterval(() => {
        refreshCount++;
        console.log(`Background refresh (${refreshCount}/${maxRefreshes})...`);
        
        // Use background loading (no loading spinners or content clearing)
        loadPendingPayments(false);
        loadPaymentHistory(false);
        
        if (refreshCount >= maxRefreshes) {
            clearInterval(refreshInterval);
            console.log('Stopped automatic refresh');
        }
    }, 15000); // Refresh every 15 seconds (reduced frequency)
    
    // Also add window focus event to refresh when user comes back
    const handleFocus = () => {
        console.log('Window focused - refreshing payment data');
        // Use background loading for focus refresh too
        loadPendingPayments(false);
        loadPaymentHistory(false);
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Clean up event listener after 5 minutes
    setTimeout(() => {
        window.removeEventListener('focus', handleFocus);
    }, 5 * 60 * 1000);
}

// Global function to be called from HTML
window.redirectToPayment = redirectToPayment;