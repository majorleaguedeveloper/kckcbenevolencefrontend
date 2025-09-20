document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is admin
    if (!AuthService.isLoggedIn()) {
        window.location.href = '../login.html?role=admin';
        return;
    }

    const user = AuthService.getUser();
    if (!user || user.role !== 'admin') {
        AuthService.logout();
        window.location.href = '../login.html?role=admin';
        return;
    }

    // Set admin name
    document.getElementById('admin-name').textContent = `${user.firstName} ${user.lastName}`;

    // Logout functionality
    document.getElementById('logout-btn').addEventListener('click', () => {
        AuthService.logout();
    });

    // Load users and stats on page load
    loadUsersStats();
    loadUsers();

    // Setup modal controls
    setupModalControls();
});

let currentPage = 1;

async function loadUsersStats() {
    try {
        const response = await AuthService.makeRequest('/admin/stats');
        const data = await response.json();

        if (response.ok) {
            displayUsersStats(data);
        }
    } catch (error) {
        console.error('Load users stats error:', error);
    }
}

function displayUsersStats(stats) {
    const statsContainer = document.getElementById('users-stats');
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${stats.totalUsers || 0}</div>
            <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.activeUsers || 0}</div>
            <div class="stat-label">Active Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.inactiveUsers || 0}</div>
            <div class="stat-label">Inactive Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.adminUsers || 0}</div>
            <div class="stat-label">Admin Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.recentRegistrations || 0}</div>
            <div class="stat-label">Recent Registrations (30d)</div>
        </div>
    `;
}

async function loadUsers(page = 1) {
    try {
        const search = document.getElementById('search-users').value;
        const role = document.getElementById('role-filter').value;
        const status = document.getElementById('status-filter').value;
        
        let url = `/admin/users?page=${page}&limit=10`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (role) url += `&role=${role}`;
        if (status) url += `&status=${status}`;

        const response = await AuthService.makeRequest(url);
        const data = await response.json();

        if (response.ok) {
            displayUsers(data.users);
            displayPagination(data.pagination);
            currentPage = page;
        } else {
            showError('error', data.message || 'Failed to load users');
        }
    } catch (error) {
        console.error('Load users error:', error);
        showError('error', 'Failed to load users. Please try again.');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function clearUserFilters() {
    document.getElementById('search-users').value = '';
    document.getElementById('role-filter').value = '';
    document.getElementById('status-filter').value = '';
    loadUsers(1);
}

function displayUsers(users) {
    const usersList = document.getElementById('users-list');
    
    if (users.length === 0) {
        usersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h3>No Users Found</h3>
                <p>No users match the current filters.</p>
            </div>
        `;
        return;
    }

    usersList.innerHTML = users.map(user => `
        <div class="user-card ${user.isActive ? 'active' : 'inactive'}">
            <div class="user-header">
                <div class="user-info">
                    <div class="user-name">${user.firstName} ${user.lastName}</div>
                    <div class="user-email">${user.email}</div>
                    <div class="user-phone">📞 ${user.phone}</div>
                </div>
                <div class="user-status">
                    <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">
                        ${user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span class="status-badge role-${user.role}">${user.role}</span>
                </div>
            </div>
            
            <div class="user-actions">
                <button onclick="viewUserDetails('${user._id}')" class="btn btn-outline">View Details</button>
                ${user.role !== 'admin' || user._id !== getCurrentUserId() ? `
                    <button onclick="toggleUserRole('${user._id}', '${user.role === 'admin' ? 'user' : 'admin'}')" 
                            class="btn btn-secondary">
                        Make ${user.role === 'admin' ? 'User' : 'Admin'}
                    </button>
                ` : ''}
                ${user._id !== getCurrentUserId() ? `
                    <button onclick="toggleUserStatus('${user._id}', ${!user.isActive})" 
                            class="btn ${user.isActive ? 'btn-warning' : 'btn-success'}">
                        ${user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}


function getCurrentUserId() {
    const user = AuthService.getUser();
    return user ? user.id : null;
}

function displayPagination(pagination) {
    const paginationDiv = document.getElementById('pagination');
    
    if (pagination.totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }

    let paginationHTML = '<div class="pagination">';
    
    // Previous button
    paginationHTML += `
        <button onclick="loadUsers(${pagination.currentPage - 1})" 
                ${!pagination.hasPrev ? 'disabled' : ''}>
            ← Previous
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (i === pagination.currentPage) {
            paginationHTML += `<button class="current-page">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="loadUsers(${i})">${i}</button>`;
        }
    }
    
    // Next button
    paginationHTML += `
        <button onclick="loadUsers(${pagination.currentPage + 1})" 
                ${!pagination.hasNext ? 'disabled' : ''}>
            Next →
        </button>
    `;
    
    paginationHTML += '</div>';
    paginationDiv.innerHTML = paginationHTML;
}

function setupModalControls() {
    const detailsModal = document.getElementById('user-details-modal');
    
    // Details modal controls
    document.getElementById('close-details-modal').addEventListener('click', () => {
        detailsModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === detailsModal) {
            detailsModal.style.display = 'none';
        }
    });
}

async function viewUserDetails(userId) {
    try {
        const response = await AuthService.makeRequest(`/admin/users/${userId}`);
        const data = await response.json();

        if (response.ok) {
            displayUserDetailsModal(data.user);
        } else {
            showError('error', data.message || 'Failed to load user details');
        }
    } catch (error) {
        console.error('View user details error:', error);
        showError('error', 'Failed to load user details. Please try again.');
    }
}

function displayUserDetailsModal(user) {
    const content = document.getElementById('user-details-content');
    
    content.innerHTML = `
        <div class="user-details-full">
            <div class="form-section">
                <h3>👤 Personal Information</h3>
                <div class="user-details">
                    <div class="user-detail">
                        <span class="user-detail-label">Full Name</span>
                        <span class="user-detail-value">${user.firstName} ${user.lastName}</span>
                    </div>
                    <div class="user-detail">
                        <span class="user-detail-label">Email</span>
                        <span class="user-detail-value">${user.email}</span>
                    </div>
                    <div class="user-detail">
                        <span class="user-detail-label">Phone</span>
                        <span class="user-detail-value">${user.phone}</span>
                    </div>
                    <div class="user-detail">
                        <span class="user-detail-label">Role</span>
                        <span class="user-detail-value">
                            <span class="status-badge role-${user.role}">${user.role}</span>
                        </span>
                    </div>
                    <div class="user-detail">
                        <span class="user-detail-label">Status</span>
                        <span class="user-detail-value">
                            <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">
                                ${user.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </span>
                    </div>
                    <div class="user-detail">
                        <span class="user-detail-label">Member Since</span>
                        <span class="user-detail-value">${formatDate(user.createdAt)}</span>
                    </div>
                    <div class="user-detail">
                        <span class="user-detail-label">Last Login</span>
                        <span class="user-detail-value">${user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</span>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>👨‍👩‍👧‍👦 Family Information</h3>
                ${getDetailedFamilyInfo(user)}
            </div>
        </div>
    `;

    document.getElementById('user-details-modal').style.display = 'block';
}

function getDetailedFamilyInfo(user) {
    let familyHTML = '';
    
    // Spouse
    if (user.spouse && user.spouse.firstName) {
        familyHTML += `
            <div class="family-section">
                <h4>💑 Spouse</h4>
                <div class="user-details">
                    <div class="user-detail">
                        <span class="user-detail-label">Name</span>
                        <span class="user-detail-value">${user.spouse.firstName} ${user.spouse.lastName || ''}</span>
                    </div>
                    ${user.spouse.dateOfBirth ? `
                    <div class="user-detail">
                        <span class="user-detail-label">Date of Birth</span>
                        <span class="user-detail-value">${formatDate(user.spouse.dateOfBirth)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // Children
    if (user.children && user.children.length > 0) {
        const children = user.children.filter(child => child.firstName && child.lastName);
        if (children.length > 0) {
            familyHTML += `
                <div class="family-section">
                    <h4>👶 Children</h4>
                    ${children.map(child => `
                        <div class="user-details" style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                            <div class="user-detail">
                                <span class="user-detail-label">Name</span>
                                <span class="user-detail-value">${child.firstName} ${child.lastName}</span>
                            </div>
                            <div class="user-detail">
                                <span class="user-detail-label">Relationship</span>
                                <span class="user-detail-value" style="text-transform: capitalize;">${child.relationship}</span>
                            </div>
                            ${child.dateOfBirth ? `
                            <div class="user-detail">
                                <span class="user-detail-label">Date of Birth</span>
                                <span class="user-detail-value">${formatDate(child.dateOfBirth)}</span>
                            </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
    
    // Parents
    if (user.parents && user.parents.length > 0) {
        const parents = user.parents.filter(parent => parent.firstName && parent.lastName);
        if (parents.length > 0) {
            familyHTML += `
                <div class="family-section">
                    <h4>👨‍👩‍👧‍👦 Parents</h4>
                    ${parents.map(parent => `
                        <div class="user-details" style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                            <div class="user-detail">
                                <span class="user-detail-label">Name</span>
                                <span class="user-detail-value">${parent.firstName} ${parent.lastName}</span>
                            </div>
                            <div class="user-detail">
                                <span class="user-detail-label">Relationship</span>
                                <span class="user-detail-value" style="text-transform: capitalize;">${parent.relationship}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
    
    // Siblings
    if (user.siblings && user.siblings.length > 0) {
        const siblings = user.siblings.filter(sibling => sibling.firstName && sibling.lastName);
        if (siblings.length > 0) {
            familyHTML += `
                <div class="family-section">
                    <h4>👫 Siblings</h4>
                    ${siblings.map(sibling => `
                        <div class="user-details" style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                            <div class="user-detail">
                                <span class="user-detail-label">Name</span>
                                <span class="user-detail-value">${sibling.firstName} ${sibling.lastName}</span>
                            </div>
                            <div class="user-detail">
                                <span class="user-detail-label">Relationship</span>
                                <span class="user-detail-value" style="text-transform: capitalize;">${sibling.relationship}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
    
    if (!familyHTML) {
        familyHTML = '<p style="color: #666; font-style: italic;">No family members registered</p>';
    }
    
    return familyHTML;
}

async function toggleUserRole(userId, newRole) {
    try {
        const response = await AuthService.makeRequest(`/admin/users/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: newRole })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('success', `User role updated to ${newRole}`);
            loadUsers(currentPage);
            loadUsersStats();
        } else {
            showError('error', data.message || 'Failed to update user role');
        }
    } catch (error) {
        console.error('Toggle user role error:', error);
        showError('error', 'Failed to update user role. Please try again.');
    }
}

async function toggleUserStatus(userId, activate) {
    try {
        const response = await AuthService.makeRequest(`/admin/users/${userId}/status`, {
            method: 'PATCH'
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('success', data.message);
            loadUsers(currentPage);
            loadUsersStats();
        } else {
            showError('error', data.message || 'Failed to update user status');
        }
    } catch (error) {
        console.error('Toggle user status error:', error);
        showError('error', 'Failed to update user status. Please try again.');
    }
}

// Utility functions
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function showSuccess(elementId, message) {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 5000);
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}