document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (AuthService.isLoggedIn()) {
        const user = AuthService.getUser();
        if (user && user.role === 'admin') {
            showDashboard();
        } else {
            // Not an admin user, redirect to login with admin role
            AuthService.logout();
            window.location.href = '../login.html?role=admin';
        }
    } else {
        // Not logged in, redirect to login with admin role
        window.location.href = '../login.html?role=admin';
    }

    // Login form handler
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError('login-error');

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        console.log('Attempting login with:', email);
        const result = await AuthService.login(email, password);
        console.log('Login result:', result);

        if (result.success) {
            console.log('Login successful, user role:', result.user.role);
            if (result.user.role === 'admin') {
                console.log('User is admin, showing dashboard');
                showDashboard();
            } else {
                console.log('User is not admin, role:', result.user.role);
                showError('login-error', 'Admin access required');
                AuthService.logout();
            }
        } else {
            console.log('Login failed:', result.message);
            showError('login-error', result.message);
        }
    });

    // Logout button handler
    document.getElementById('logout-btn').addEventListener('click', function() {
        AuthService.logout();
    });

    // Payment request form handler
    document.getElementById('payment-request-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError('payment-request-error');
        hideError('payment-request-success');

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const stripePaymentLinkUrl = document.getElementById('payment-link-url').value;

        // Validate Stripe payment link URL format
        if (!stripePaymentLinkUrl.startsWith('https://buy.stripe.com/')) {
            showError('payment-request-error', 'Please enter a valid Stripe payment link URL (https://buy.stripe.com/...)');
            return;
        }

        try {
            const response = await AuthService.makeRequest('/payments/admin/create-payment-request', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    description,
                    stripePaymentLinkUrl
                })
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess('payment-request-success', 'Payment request created successfully!');
                document.getElementById('payment-request-form').reset();
                loadPaymentRequests(); // Reload the list
                
                // Set up periodic refresh to show payment updates
                setInterval(() => {
                    console.log('Auto-refreshing payment requests...');
                    loadPaymentRequests();
                }, 30000); // Refresh every 30 seconds
            } else {
                showError('payment-request-error', data.message || 'Failed to create payment request');
            }
        } catch (error) {
            showError('payment-request-error', 'Network error. Please try again.');
        }
    });
});

function showDashboard() {
    try {
        console.log('showDashboard() called');
        const user = AuthService.getUser();
        console.log('User data:', user);
        
        if (!user) {
            console.error('No user data found');
            AuthService.logout();
            return;
        }
        
        const adminNameElement = document.getElementById('admin-name');
        if (adminNameElement) {
            adminNameElement.textContent = `${user.firstName} ${user.lastName}`;
        } else {
            console.error('admin-name element not found');
        }
        
        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');
        
        if (loginSection && dashboardSection) {
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            console.log('Dashboard sections switched successfully');
        } else {
            console.error('Login or dashboard sections not found');
        }
        
        loadPaymentRequests();
    } catch (error) {
        console.error('Error in showDashboard:', error);
        alert('Error loading dashboard: ' + error.message);
    }
}

async function loadPaymentRequests() {
    try {
        console.log('loadPaymentRequests() called');
        const loadingElement = document.getElementById('loading');
        const listElement = document.getElementById('payment-requests-list');
        
        if (!loadingElement || !listElement) {
            console.error('Loading or list elements not found');
            return;
        }
        
        loadingElement.style.display = 'block';
        listElement.innerHTML = '';

        console.log('Making request to /payments/admin/payment-requests');
        const response = await AuthService.makeRequest('/payments/admin/payment-requests');
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);

        loadingElement.style.display = 'none';

        if (response.ok) {
            if (data.paymentRequests.length === 0) {
                listElement.innerHTML = '<p class="no-data">No payment requests found.</p>';
                console.log('No payment requests found');
            } else {
                listElement.innerHTML = data.paymentRequests.map(request => createPaymentRequestHTML(request)).join('');
                console.log('Loaded', data.paymentRequests.length, 'payment requests');
            }
        } else {
            console.error('Failed to load payment requests:', response.status, data);
            listElement.innerHTML = '<p class="error">Failed to load payment requests.</p>';
        }
    } catch (error) {
        console.error('Error in loadPaymentRequests:', error);
        const loadingElement = document.getElementById('loading');
        const listElement = document.getElementById('payment-requests-list');
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (listElement) listElement.innerHTML = '<p class="error">Network error. Please try again.</p>';
    }
}

function createPaymentRequestHTML(request) {
    const progress = request.totalMembers > 0 ? (request.paidMembers / request.totalMembers) * 100 : 0;
    const statusClass = `status-${request.status}`;
    
    return `
        <div class="payment-request-item">
            <div class="payment-request-header">
                <div>
                    <div class="payment-request-title">${request.title}</div>
                    <div class="payment-request-meta">
                        Created: ${formatDate(request.createdAt)} | 
                        Due: ${formatDate(request.dueDate)}
                    </div>
                </div>
                <span class="status-badge ${statusClass}">${request.status}</span>
            </div>
            
            <div class="payment-request-description">${request.description}</div>
            
            <div class="payment-request-stats">
                <div class="stat-item">
                    <div class="stat-value">${request.paidMembers} / ${request.totalMembers}</div>
                    <div class="stat-label">Members Paid</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">
                        <a href="${request.stripePaymentLinkUrl}" target="_blank" class="payment-link">
                            View Payment Link
                        </a>
                    </div>
                    <div class="stat-label">Stripe Link</div>
                </div>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            
            <div style="margin-top: 15px;">
                <button onclick="viewPaymentDetails('${request._id}')" class="btn btn-success">
                    View Details
                </button>
            </div>
        </div>
    `;
}

async function viewPaymentDetails(paymentRequestId) {
    try {
        const response = await AuthService.makeRequest(`/payments/admin/payment-requests/${paymentRequestId}/details`);
        const data = await response.json();

        if (response.ok) {
            showPaymentDetailsModal(data.paymentRequest, data.payments);
        } else {
            alert('Failed to load payment details');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

function showPaymentDetailsModal(paymentRequest, payments) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${paymentRequest.title} - Payment Details</h3>
                <button onclick="closeModal()" class="btn btn-secondary">Close</button>
            </div>
            <div class="modal-body">
                <div class="payments-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Email</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payments.map(payment => `
                                <tr>
                                    <td>${payment.user.firstName} ${payment.user.lastName}</td>
                                    <td>${payment.user.email}</td>
                                    <td>${formatCurrency(payment.amount)}</td>
                                    <td><span class="status-badge status-${payment.status}">${payment.status}</span></td>
                                    <td>${formatDate(payment.createdAt)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            background: white;
            border-radius: 10px;
            max-width: 800px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-body {
            padding: 20px;
        }
        .payments-table table {
            width: 100%;
            border-collapse: collapse;
        }
        .payments-table th,
        .payments-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .payments-table th {
            background: #f8f9fa;
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);

    window.closeModal = function() {
        document.body.removeChild(modal);
        document.head.removeChild(style);
        delete window.closeModal;
    };
}

// User Management Functions
async function loadUsers(page = 1) {
    try {
        const loadingElement = document.getElementById('loading-users');
        const listElement = document.getElementById('users-list');
        const paginationElement = document.getElementById('users-pagination');
        
        if (!loadingElement || !listElement) {
            console.error('User loading or list elements not found');
            return;
        }
        
        loadingElement.style.display = 'block';
        listElement.innerHTML = '';
        if (paginationElement) paginationElement.innerHTML = '';

        // Get filter values
        const search = document.getElementById('search-users')?.value || '';
        const role = document.getElementById('role-filter')?.value || '';
        const status = document.getElementById('status-filter')?.value || '';
        
        // Build query parameters
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10'
        });
        
        if (search) params.append('search', search);
        if (role) params.append('role', role);
        if (status) params.append('status', status);

        console.log('Making request to /admin/users with params:', params.toString());
        const response = await AuthService.makeRequest(`/admin/users?${params.toString()}`);
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);

        loadingElement.style.display = 'none';

        if (response.ok) {
            if (data.users.length === 0) {
                listElement.innerHTML = '<p class="no-data">No users found.</p>';
                console.log('No users found');
            } else {
                listElement.innerHTML = data.users.map(user => createUserHTML(user)).join('');
                
                // Create pagination
                if (paginationElement && data.pagination) {
                    paginationElement.innerHTML = createPaginationHTML(data.pagination);
                }
                
                console.log('Loaded', data.users.length, 'users');
            }
        } else {
            console.error('Failed to load users:', response.status, data);
            listElement.innerHTML = '<p class="error">Failed to load users.</p>';
        }
    } catch (error) {
        console.error('Error in loadUsers:', error);
        const loadingElement = document.getElementById('loading-users');
        const listElement = document.getElementById('users-list');
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (listElement) listElement.innerHTML = '<p class="error">Network error. Please try again.</p>';
    }
}

function createUserHTML(user) {
    const statusClass = user.isActive ? 'status-active' : 'status-cancelled';
    const statusText = user.isActive ? 'Active' : 'Inactive';
    
    // Format family member sections
    let familySections = '';
    
    // Spouse section
    if (user.spouse && user.spouse.firstName) {
        familySections += `
            <div class="family-section">
                <h4>💑 Spouse/Partner</h4>
                <div class="family-members">
                    <div class="family-member">
                        <div class="family-member-name">${user.spouse.firstName} ${user.spouse.lastName || ''}</div>
                        <div class="family-member-relation">${user.spouse.relationship || 'spouse'}</div>
                        ${user.spouse.dateOfBirth ? `<div style="font-size: 0.75rem; color: #888;">Born: ${formatDate(user.spouse.dateOfBirth)}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Children section
    if (user.children && user.children.length > 0) {
        familySections += `
            <div class="family-section">
                <h4>👶 Children (${user.children.length})</h4>
                <div class="family-members">
                    ${user.children.map(child => `
                        <div class="family-member">
                            <div class="family-member-name">${child.firstName} ${child.lastName}</div>
                            <div class="family-member-relation">${child.relationship || 'son'}</div>
                            ${child.dateOfBirth ? `<div style="font-size: 0.75rem; color: #888;">Born: ${formatDate(child.dateOfBirth)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Parents section
    if (user.parents && user.parents.length > 0) {
        familySections += `
            <div class="family-section">
                <h4>👨‍👩‍👦 Parents (${user.parents.length})</h4>
                <div class="family-members">
                    ${user.parents.map(parent => `
                        <div class="family-member">
                            <div class="family-member-name">${parent.firstName} ${parent.lastName}</div>
                            <div class="family-member-relation">${parent.relationship}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Siblings section
    if (user.siblings && user.siblings.length > 0) {
        familySections += `
            <div class="family-section">
                <h4>👫 Siblings (${user.siblings.length})</h4>
                <div class="family-members">
                    ${user.siblings.map(sibling => `
                        <div class="family-member">
                            <div class="family-member-name">${sibling.firstName} ${sibling.lastName}</div>
                            <div class="family-member-relation">${sibling.relationship}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    return `
        <div class="user-item">
            <div class="user-header">
                <div class="user-name">${user.firstName} ${user.lastName}</div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            
            <div class="user-details">
                <div class="user-detail-group">
                    <div class="user-detail-label">Email</div>
                    <div class="user-detail-value">${user.email}</div>
                </div>
                <div class="user-detail-group">
                    <div class="user-detail-label">Phone</div>
                    <div class="user-detail-value">${user.phone}</div>
                </div>
                <div class="user-detail-group">
                    <div class="user-detail-label">Role</div>
                    <div class="user-detail-value">${user.role}</div>
                </div>
                <div class="user-detail-group">
                    <div class="user-detail-label">Joined</div>
                    <div class="user-detail-value">${formatDate(user.createdAt)}</div>
                </div>
                ${user.lastLogin ? `
                <div class="user-detail-group">
                    <div class="user-detail-label">Last Login</div>
                    <div class="user-detail-value">${formatDate(user.lastLogin)}</div>
                </div>
                ` : ''}
            </div>
            
            ${familySections}
            
            <div class="user-actions">
                <button onclick="toggleUserRole('${user._id}', '${user.role}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">
                    ${user.role === 'admin' ? 'Make User' : 'Make Admin'}
                </button>
                <button onclick="toggleUserStatus('${user._id}', ${user.isActive})" class="btn ${user.isActive ? 'btn-secondary' : 'btn-success'}" style="padding: 6px 12px; font-size: 0.8rem;">
                    ${user.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button onclick="viewUserDetails('${user._id}')" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem;">
                    View Details
                </button>
            </div>
        </div>
    `;
}

function createPaginationHTML(pagination) {
    let html = '<div class="pagination">';
    
    // Previous button
    html += `<button onclick="loadUsers(${pagination.currentPage - 1})" ${!pagination.hasPrev ? 'disabled' : ''}>Previous</button>`;
    
    // Page numbers
    const startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const isCurrentPage = i === pagination.currentPage;
        html += `<button onclick="loadUsers(${i})" class="${isCurrentPage ? 'current-page' : ''}">${i}</button>`;
    }
    
    // Next button
    html += `<button onclick="loadUsers(${pagination.currentPage + 1})" ${!pagination.hasNext ? 'disabled' : ''}>Next</button>`;
    
    // Pagination info
    html += `<div class="pagination-info">Showing ${(pagination.currentPage - 1) * 10 + 1} to ${Math.min(pagination.currentPage * 10, pagination.totalUsers)} of ${pagination.totalUsers} users</div>`;
    
    html += '</div>';
    return html;
}

async function toggleUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
        return;
    }
    
    try {
        const response = await AuthService.makeRequest(`/admin/users/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: newRole })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('payment-request-success', `User role updated to ${newRole} successfully!`);
            loadUsers(); // Reload the current page
        } else {
            alert(data.message || 'Failed to update user role');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }
    
    try {
        const response = await AuthService.makeRequest(`/admin/users/${userId}/status`, {
            method: 'PATCH'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('payment-request-success', data.message);
            loadUsers(); // Reload the current page
        } else {
            alert(data.message || 'Failed to update user status');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

async function viewUserDetails(userId) {
    try {
        const response = await AuthService.makeRequest(`/admin/users/${userId}`);
        const data = await response.json();

        if (response.ok) {
            showUserDetailsModal(data.user);
        } else {
            alert('Failed to load user details');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

function showUserDetailsModal(user) {
    // Build family information HTML
    let familyHTML = '';
    
    if (user.spouse && user.spouse.firstName) {
        familyHTML += `
            <div class="detail-section">
                <h4>Spouse/Partner</h4>
                <p><strong>Name:</strong> ${user.spouse.firstName} ${user.spouse.lastName || ''}</p>
                <p><strong>Relationship:</strong> ${user.spouse.relationship || 'spouse'}</p>
                ${user.spouse.dateOfBirth ? `<p><strong>Date of Birth:</strong> ${formatDate(user.spouse.dateOfBirth)}</p>` : ''}
            </div>
        `;
    }
    
    if (user.children && user.children.length > 0) {
        familyHTML += `
            <div class="detail-section">
                <h4>Children (${user.children.length})</h4>
                ${user.children.map(child => `
                    <div style="padding: 8px; background: #f8f9fa; margin: 5px 0; border-radius: 4px;">
                        <p><strong>Name:</strong> ${child.firstName} ${child.lastName}</p>
                        <p><strong>Relationship:</strong> ${child.relationship || 'son'}</p>
                        ${child.dateOfBirth ? `<p><strong>Date of Birth:</strong> ${formatDate(child.dateOfBirth)}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    if (user.parents && user.parents.length > 0) {
        familyHTML += `
            <div class="detail-section">
                <h4>Parents (${user.parents.length})</h4>
                ${user.parents.map(parent => `
                    <div style="padding: 8px; background: #f8f9fa; margin: 5px 0; border-radius: 4px;">
                        <p><strong>Name:</strong> ${parent.firstName} ${parent.lastName}</p>
                        <p><strong>Relationship:</strong> ${parent.relationship}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    if (user.siblings && user.siblings.length > 0) {
        familyHTML += `
            <div class="detail-section">
                <h4>Siblings (${user.siblings.length})</h4>
                ${user.siblings.map(sibling => `
                    <div style="padding: 8px; background: #f8f9fa; margin: 5px 0; border-radius: 4px;">
                        <p><strong>Name:</strong> ${sibling.firstName} ${sibling.lastName}</p>
                        <p><strong>Relationship:</strong> ${sibling.relationship}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${user.firstName} ${user.lastName} - User Details</h3>
                <button onclick="closeUserModal()" class="btn btn-secondary">Close</button>
            </div>
            <div class="modal-body">
                <div class="detail-section">
                    <h4>Personal Information</h4>
                    <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Phone:</strong> ${user.phone}</p>
                    <p><strong>Role:</strong> ${user.role}</p>
                    <p><strong>Status:</strong> ${user.isActive ? 'Active' : 'Inactive'}</p>
                    <p><strong>Joined:</strong> ${formatDate(user.createdAt)}</p>
                    ${user.lastLogin ? `<p><strong>Last Login:</strong> ${formatDate(user.lastLogin)}</p>` : '<p><strong>Last Login:</strong> Never</p>'}
                </div>
                ${familyHTML}
            </div>
        </div>
    `;

    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
        .detail-section {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e1e5e9;
        }
        .detail-section:last-child {
            border-bottom: none;
        }
        .detail-section h4 {
            color: #667eea;
            font-size: 1.1rem;
            margin-bottom: 10px;
        }
        .detail-section p {
            margin: 5px 0;
            font-size: 0.95rem;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);

    window.closeUserModal = function() {
        document.body.removeChild(modal);
        document.head.removeChild(style);
        delete window.closeUserModal;
    };
}