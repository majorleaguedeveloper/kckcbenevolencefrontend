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

    // Update navbar with user information (navbar is auto-injected via data-navbar attribute)
    const userNameElement = document.querySelector('.navbar-user, .mobile-user');
    if (userNameElement) {
        userNameElement.textContent = `${user.firstName} ${user.lastName}`;
    }

    // Load amendments and stats on page load
    loadAmendmentStats();
    loadAmendments();
});

let currentPage = 1;
let searchTimeout;

async function loadAmendmentStats() {
    try {
        const response = await AuthService.makeRequest('/amendments/admin/amendments?limit=1000');
        const data = await response.json();

        if (response.ok) {
            displayAmendmentStats(data.stats);
        }
    } catch (error) {
        console.error('Load amendment stats error:', error);
    }
}

function displayAmendmentStats(stats) {
    const statsContainer = document.getElementById('amendmentStats');
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${stats.total || 0}</div>
            <div class="stat-label">Total Requests</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.pending || 0}</div>
            <div class="stat-label">Pending Review</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.approved || 0}</div>
            <div class="stat-label">Approved</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.rejected || 0}</div>
            <div class="stat-label">Rejected</div>
        </div>
    `;
}

async function loadAmendments() {
    try {
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error');
        const listElement = document.getElementById('amendmentsList');
        
        loadingElement.style.display = 'block';
        errorElement.style.display = 'none';
        listElement.innerHTML = '';

        // Get filter values
        const statusFilter = document.getElementById('statusFilter').value;
        const searchUser = document.getElementById('searchUser').value;

        // Build query parameters
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        if (searchUser) params.append('search', searchUser);
        params.append('page', currentPage);
        params.append('limit', 10);

        const response = await AuthService.makeRequest(`/amendments/admin/amendments?${params.toString()}`);
        const data = await response.json();

        loadingElement.style.display = 'none';

        if (response.ok) {
            if (data.amendments.length === 0) {
                listElement.innerHTML = '<div class="no-data">No amendment requests found.</div>';
            } else {
                listElement.innerHTML = data.amendments.map(amendment => createAmendmentHTML(amendment)).join('');
            }
        } else {
            errorElement.textContent = data.message || 'Failed to load amendments';
            errorElement.style.display = 'block';
        }
    } catch (error) {
        console.error('Load amendments error:', error);
        document.getElementById('loading').style.display = 'none';
        const errorElement = document.getElementById('error');
        errorElement.textContent = 'Network error. Please try again.';
        errorElement.style.display = 'block';
    }
}

function createAmendmentHTML(amendment) {
    const statusClass = `status-${amendment.status}`;
    const user = amendment.user;
    
    return `
        <div class="amendment-item">
            <div class="amendment-header">
                <div>
                    <div class="amendment-user">${user.firstName} ${user.lastName}</div>
                    <div class="amendment-date">
                        Submitted: ${formatDate(amendment.createdAt)}
                        ${amendment.reviewedAt ? `• Reviewed: ${formatDate(amendment.reviewedAt)}` : ''}
                    </div>
                </div>
                <div class="amendment-status">
                    <span class="status-badge ${statusClass}">${amendment.status}</span>
                </div>
            </div>

            <div class="amendment-notes">
                <div class="amendment-notes-label">Member's Request:</div>
                <p class="amendment-notes-text">${amendment.memberNotes}</p>
            </div>

            ${amendment.adminResponse ? `
                <div class="amendment-notes">
                    <div class="amendment-notes-label">Admin Response:</div>
                    <p class="amendment-notes-text">${amendment.adminResponse}</p>
                    ${amendment.reviewedBy ? `<small>Reviewed by: ${amendment.reviewedBy.firstName} ${amendment.reviewedBy.lastName}</small>` : ''}
                </div>
            ` : ''}

            <div class="amendment-actions">
                <button onclick="viewAmendmentDetails('${amendment._id}')" class="btn btn-primary">
                    👁️ View Details
                </button>
                ${amendment.status === 'pending' ? `
                    <button onclick="approveAmendment('${amendment._id}')" class="btn btn-success">
                        ✅ Approve
                    </button>
                    <button onclick="rejectAmendment('${amendment._id}')" class="btn btn-danger">
                        ❌ Reject
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

async function viewAmendmentDetails(amendmentId) {
    try {
        const response = await AuthService.makeRequest(`/amendments/admin/amendments/${amendmentId}`);
        const data = await response.json();

        if (response.ok) {
            showAmendmentModal(data.amendment);
        } else {
            alert('Failed to load amendment details');
        }
    } catch (error) {
        console.error('Load amendment details error:', error);
        alert('Network error. Please try again.');
    }
}

function showAmendmentModal(amendment) {
    const modal = document.getElementById('reviewModal');
    const title = document.getElementById('reviewModalTitle');
    const body = document.getElementById('reviewModalBody');
    
    title.textContent = `Amendment Request - ${amendment.user.firstName} ${amendment.user.lastName}`;
    
    body.innerHTML = `
        <div class="amendment-details">
            <div class="section">
                <h4>Request Information</h4>
                <p><strong>Status:</strong> <span class="status-badge status-${amendment.status}">${amendment.status}</span></p>
                <p><strong>Submitted:</strong> ${formatDate(amendment.createdAt)}</p>
                ${amendment.reviewedAt ? `<p><strong>Reviewed:</strong> ${formatDate(amendment.reviewedAt)}</p>` : ''}
                ${amendment.reviewedBy ? `<p><strong>Reviewed by:</strong> ${amendment.reviewedBy.firstName} ${amendment.reviewedBy.lastName}</p>` : ''}
            </div>

            <div class="section">
                <h4>Member's Explanation</h4>
                <div class="amendment-notes">
                    <p class="amendment-notes-text">${amendment.memberNotes}</p>
                </div>
            </div>

            ${amendment.adminResponse ? `
                <div class="section">
                    <h4>Admin Response</h4>
                    <div class="amendment-notes">
                        <p class="amendment-notes-text">${amendment.adminResponse}</p>
                    </div>
                </div>
            ` : ''}

            <div class="section">
                <h4>Family Information Comparison</h4>
                <div class="comparison-grid">
                    ${renderFamilyComparison(amendment.currentFamilyData, amendment.proposedFamilyData)}
                </div>
            </div>

            ${amendment.status === 'pending' ? `
                <div class="section">
                    <h4>Review Actions</h4>
                    <div class="amendment-actions">
                        <button onclick="approveAmendment('${amendment._id}')" class="btn btn-success">
                            ✅ Approve Amendment
                        </button>
                        <button onclick="rejectAmendment('${amendment._id}')" class="btn btn-danger">
                            ❌ Reject Amendment
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
}

function renderFamilyComparison(currentData, proposedData) {
    const sections = ['spouse', 'children', 'parents', 'siblings'];
    let html = '';
    
    sections.forEach(section => {
        const currentSection = getCurrentSectionData(currentData, section);
        const proposedSection = getProposedSectionData(proposedData, section);
        const changes = detectChanges(currentSection, proposedSection, section);
        
        if (changes.hasChanges || currentSection.hasData || proposedSection.hasData) {
            html += `
                <div class="family-section-comparison ${changes.hasChanges ? 'has-changes' : ''}">
                    <div class="section-header">
                        <h5>${section.charAt(0).toUpperCase() + section.slice(1)}</h5>
                        ${changes.hasChanges ? '<span class="change-indicator">✏️ Modified</span>' : '<span class="no-change-indicator">No Changes</span>'}
                    </div>
                    <div class="comparison-columns">
                        <div class="current-column">
                            <h6>Current</h6>
                            ${renderSectionData(currentSection, 'current')}
                        </div>
                        <div class="proposed-column">
                            <h6>Proposed</h6>
                            ${renderSectionData(proposedSection, 'proposed', changes)}
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    return html || '<div class="no-changes">No family information changes</div>';
}

function getCurrentSectionData(data, section) {
    if (section === 'spouse') {
        return {
            hasData: !!(data.spouse && data.spouse.firstName),
            data: data.spouse || null
        };
    } else {
        return {
            hasData: !!(data[section] && data[section].length > 0),
            data: data[section] || []
        };
    }
}

function getProposedSectionData(data, section) {
    if (section === 'spouse') {
        return {
            hasData: !!(data.spouse && data.spouse.firstName),
            data: data.spouse || null
        };
    } else {
        return {
            hasData: !!(data[section] && data[section].length > 0),
            data: data[section] || []
        };
    }
}

function detectChanges(current, proposed, section) {
    if (section === 'spouse') {
        if (!current.hasData && !proposed.hasData) return { hasChanges: false };
        if (!current.hasData && proposed.hasData) return { hasChanges: true, type: 'added' };
        if (current.hasData && !proposed.hasData) return { hasChanges: true, type: 'removed' };
        
        // Compare spouse details
        const currentSpouse = current.data;
        const proposedSpouse = proposed.data;
        
        if (currentSpouse.firstName !== proposedSpouse.firstName ||
            currentSpouse.lastName !== proposedSpouse.lastName ||
            currentSpouse.dateOfBirth !== proposedSpouse.dateOfBirth ||
            currentSpouse.notes !== proposedSpouse.notes) {
            return { hasChanges: true, type: 'modified' };
        }
        
        return { hasChanges: false };
    } else {
        // For arrays (children, parents, siblings)
        if (!current.hasData && !proposed.hasData) return { hasChanges: false };
        if (!current.hasData && proposed.hasData) return { hasChanges: true, type: 'added' };
        if (current.hasData && !proposed.hasData) return { hasChanges: true, type: 'removed' };
        
        // Compare array lengths and contents
        if (current.data.length !== proposed.data.length) {
            return { hasChanges: true, type: 'modified' };
        }
        
        // Deep compare each member
        for (let i = 0; i < current.data.length; i++) {
            const currentMember = current.data[i];
            const proposedMember = proposed.data[i];
            
            if (currentMember.firstName !== proposedMember.firstName ||
                currentMember.lastName !== proposedMember.lastName ||
                currentMember.relationship !== proposedMember.relationship ||
                currentMember.dateOfBirth !== proposedMember.dateOfBirth ||
                currentMember.notes !== proposedMember.notes) {
                return { hasChanges: true, type: 'modified' };
            }
        }
        
        return { hasChanges: false };
    }
}

function renderSectionData(sectionData, type, changes = null) {
    if (!sectionData.hasData) {
        return `<div class="no-data ${type === 'proposed' && changes?.type === 'added' ? 'change-added' : ''}">
            ${type === 'proposed' && changes?.type === 'added' ? '+ ' : ''}No information provided
        </div>`;
    }
    
    if (Array.isArray(sectionData.data)) {
        // Handle arrays (children, parents, siblings)
        return sectionData.data.map(member => `
            <div class="family-member ${type === 'proposed' && changes?.hasChanges ? 'change-modified' : ''}">
                <div class="member-name">
                    ${type === 'proposed' && changes?.hasChanges ? '✏️ ' : ''}
                    ${member.firstName} ${member.lastName}
                </div>
                <div class="member-details">
                    Relationship: ${member.relationship}
                    ${member.dateOfBirth ? `<br>DOB: ${formatDate(member.dateOfBirth)}` : ''}
                    ${member.notes ? `<br>Notes: ${member.notes}` : ''}
                </div>
            </div>
        `).join('');
    } else {
        // Handle spouse object
        const spouse = sectionData.data;
        return `
            <div class="family-member ${type === 'proposed' && changes?.hasChanges ? 'change-modified' : ''}">
                <div class="member-name">
                    ${type === 'proposed' && changes?.hasChanges ? '✏️ ' : ''}
                    ${spouse.firstName} ${spouse.lastName || ''}
                </div>
                <div class="member-details">
                    Relationship: ${spouse.relationship || 'spouse'}
                    ${spouse.dateOfBirth ? `<br>DOB: ${formatDate(spouse.dateOfBirth)}` : ''}
                    ${spouse.notes ? `<br>Notes: ${spouse.notes}` : ''}
                </div>
            </div>
        `;
    }
}

function renderFamilyInfo(familyData) {
    let html = '';
    
    // Spouse
    if (familyData.spouse && familyData.spouse.firstName) {
        html += `
            <div class="family-info">
                <div class="family-type">Spouse</div>
                <div class="family-member">
                    <div class="member-name">${familyData.spouse.firstName} ${familyData.spouse.lastName || ''}</div>
                    <div class="member-details">
                        Relationship: ${familyData.spouse.relationship || 'spouse'}
                        ${familyData.spouse.dateOfBirth ? `<br>DOB: ${formatDate(familyData.spouse.dateOfBirth)}` : ''}
                        ${familyData.spouse.notes ? `<br>Notes: ${familyData.spouse.notes}` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Children
    if (familyData.children && familyData.children.length > 0) {
        html += `
            <div class="family-info">
                <div class="family-type">Children</div>
                ${familyData.children.map(child => `
                    <div class="family-member">
                        <div class="member-name">${child.firstName} ${child.lastName}</div>
                        <div class="member-details">
                            Relationship: ${child.relationship}
                            ${child.dateOfBirth ? `<br>DOB: ${formatDate(child.dateOfBirth)}` : ''}
                            ${child.notes ? `<br>Notes: ${child.notes}` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Parents
    if (familyData.parents && familyData.parents.length > 0) {
        html += `
            <div class="family-info">
                <div class="family-type">Parents</div>
                ${familyData.parents.map(parent => `
                    <div class="family-member">
                        <div class="member-name">${parent.firstName} ${parent.lastName}</div>
                        <div class="member-details">
                            Relationship: ${parent.relationship}
                            ${parent.notes ? `<br>Notes: ${parent.notes}` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Siblings
    if (familyData.siblings && familyData.siblings.length > 0) {
        html += `
            <div class="family-info">
                <div class="family-type">Siblings</div>
                ${familyData.siblings.map(sibling => `
                    <div class="family-member">
                        <div class="member-name">${sibling.firstName} ${sibling.lastName}</div>
                        <div class="member-details">
                            Relationship: ${sibling.relationship}
                            ${sibling.notes ? `<br>Notes: ${sibling.notes}` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    return html || '<div class="no-data">No family information</div>';
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    modal.style.display = 'none';
}

async function approveAmendment(amendmentId) {
    const response = prompt('Enter a response message (optional):');
    if (response === null) return; // User cancelled
    
    try {
        const result = await AuthService.makeRequest(`/amendments/admin/amendments/${amendmentId}/approve`, {
            method: 'PUT',
            body: JSON.stringify({
                adminResponse: response || 'Amendment approved.'
            })
        });
        
        const data = await result.json();
        
        if (result.ok) {
            alert('Amendment approved successfully!');
            closeReviewModal();
            loadAmendments();
            loadAmendmentStats();
        } else {
            alert(data.message || 'Failed to approve amendment');
        }
    } catch (error) {
        console.error('Approve amendment error:', error);
        alert('Network error. Please try again.');
    }
}

async function rejectAmendment(amendmentId) {
    const response = prompt('Enter a reason for rejection (required):');
    if (!response || response.trim() === '') {
        alert('A reason for rejection is required.');
        return;
    }
    
    try {
        const result = await AuthService.makeRequest(`/amendments/admin/amendments/${amendmentId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({
                adminResponse: response.trim()
            })
        });
        
        const data = await result.json();
        
        if (result.ok) {
            alert('Amendment rejected.');
            closeReviewModal();
            loadAmendments();
            loadAmendmentStats();
        } else {
            alert(data.message || 'Failed to reject amendment');
        }
    } catch (error) {
        console.error('Reject amendment error:', error);
        alert('Network error. Please try again.');
    }
}

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadAmendments();
    }, 500);
}

function clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('searchUser').value = '';
    loadAmendments();
}

function formatDate(dateString) {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}