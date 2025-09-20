document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!AuthService.isLoggedIn()) {
        window.location.href = '../login.html?role=member';
        return;
    }

    const user = AuthService.getUser();
    if (!user || user.role !== 'user') {
        AuthService.logout();
        window.location.href = '../login.html?role=member';
        return;
    }

    // Update navbar with user information (navbar is auto-injected via data-navbar attribute)
    const userNameElement = document.querySelector('.navbar-user, .mobile-user');
    if (userNameElement) {
        userNameElement.textContent = `${user.firstName} ${user.lastName}`;
    }

    // Load claims on page load
    loadClaims();

    // Modal controls
    setupModalControls();

    // New claim form
    setupNewClaimForm();
});

let currentPage = 1;
let selectedFamilyMember = null;

async function loadClaims(page = 1) {
    try {
        const url = `/claims/my-claims?page=${page}&limit=10`;

        const response = await AuthService.makeRequest(url);
        const data = await response.json();

        if (response.ok) {
            displayClaims(data.claims);
            displayPagination(data.pagination);
            currentPage = page;
        } else {
            showError('error', data.message || 'Failed to load claims');
        }
    } catch (error) {
        console.error('Load claims error:', error);
        showError('error', 'Failed to load claims. Please try again.');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function displayClaims(claims) {
    const claimsList = document.getElementById('claims-list');
    
    if (claims.length === 0) {
        claimsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No Claims Found</h3>
                <p>You haven't submitted any claims yet. Click "Submit New Claim" to get started.</p>
            </div>
        `;
        return;
    }

    claimsList.innerHTML = claims.map(claim => `
        <div class="claim-card ${claim.status}">
            <div class="claim-header">
                <div class="claim-deceased">
                    ${claim.deceasedFamilyMember.firstName} ${claim.deceasedFamilyMember.lastName}
                    <span style="font-size: 0.875rem; color: #666; font-weight: normal;">
                        (${claim.deceasedFamilyMember.relationship})
                    </span>
                </div>
                <span class="claim-status status-${claim.status}">${claim.status}</span>
            </div>
            
            <div class="claim-details">
                <div class="claim-detail">
                    <span class="claim-detail-label">Date of Death</span>
                    <span class="claim-detail-value">${formatDate(claim.deceasedFamilyMember.dateOfDeath)}</span>
                </div>
                <div class="claim-detail">
                    <span class="claim-detail-label">Submitted</span>
                    <span class="claim-detail-value">${formatDate(claim.createdAt)}</span>
                </div>
                ${claim.approvedAmount ? `
                <div class="claim-detail">
                    <span class="claim-detail-label">Approved Amount</span>
                    <span class="claim-detail-value">${formatCurrency(claim.approvedAmount)}</span>
                </div>
                ` : `
                <div class="claim-detail">
                    <span class="claim-detail-label">Amount</span>
                    <span class="claim-detail-value">To be determined</span>
                </div>
                `}
            </div>
            
            <div class="claim-reason">
                <strong>Reason:</strong> ${claim.reason.length > 100 ? claim.reason.substring(0, 100) + '...' : claim.reason}
            </div>
            
            ${claim.stripePaymentLinkUrl && claim.status === 'approved' ? `
            <div class="payment-link-section">
                <h4>💳 Community Contribution Required</h4>
                <p>Your claim has been approved! Community members need to contribute <strong>${formatCurrency(claim.perMemberContribution)}</strong> each.</p>
                <a href="${claim.stripePaymentLinkUrl}" target="_blank" class="btn btn-primary">View Payment Link</a>
            </div>
            ` : ''}
            
            <div class="claim-actions">
                <button onclick="viewClaimDetails('${claim._id}')" class="btn btn-outline">View Details</button>
            </div>
        </div>
    `).join('');
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
        <button onclick="loadClaims(${pagination.currentPage - 1})" 
                ${!pagination.hasPrev ? 'disabled' : ''}>
            ← Previous
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (i === pagination.currentPage) {
            paginationHTML += `<button class="current-page">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="loadClaims(${i})">${i}</button>`;
        }
    }
    
    // Next button
    paginationHTML += `
        <button onclick="loadClaims(${pagination.currentPage + 1})" 
                ${!pagination.hasNext ? 'disabled' : ''}>
            Next →
        </button>
    `;
    
    paginationHTML += '</div>';
    paginationDiv.innerHTML = paginationHTML;
}

function setupModalControls() {
    const newClaimModal = document.getElementById('new-claim-modal');
    const claimDetailsModal = document.getElementById('claim-details-modal');
    
    // New claim modal controls
    document.getElementById('new-claim-btn').addEventListener('click', () => {
        loadAvailableFamilyMembers();
        newClaimModal.style.display = 'block';
    });

    document.getElementById('close-modal').addEventListener('click', () => {
        newClaimModal.style.display = 'none';
        resetClaimForm();
    });

    document.getElementById('cancel-claim').addEventListener('click', () => {
        newClaimModal.style.display = 'none';
        resetClaimForm();
    });

    // Claim details modal controls
    document.getElementById('close-details-modal').addEventListener('click', () => {
        claimDetailsModal.style.display = 'none';
    });

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === newClaimModal) {
            newClaimModal.style.display = 'none';
            resetClaimForm();
        }
        if (event.target === claimDetailsModal) {
            claimDetailsModal.style.display = 'none';
        }
    });
}

async function loadAvailableFamilyMembers() {
    try {
        const response = await AuthService.makeRequest('/claims/family-members/available');
        const data = await response.json();

        if (response.ok) {
            displayFamilyMembers(data.familyMembers);
        } else {
            showError('claim-error', data.message || 'Failed to load family members');
        }
    } catch (error) {
        console.error('Load family members error:', error);
        showError('claim-error', 'Failed to load family members. Please try again.');
    }
}

function displayFamilyMembers(familyMembers) {
    const familyMembersList = document.getElementById('family-members-list');
    
    if (familyMembers.length === 0) {
        familyMembersList.innerHTML = `
            <div class="empty-state">
                <p>No family members available for claims. All registered family members may already have claims submitted.</p>
            </div>
        `;
        return;
    }

    familyMembersList.innerHTML = familyMembers.map((member, index) => `
        <div class="family-member-option" onclick="selectFamilyMember(${index})">
            <input type="radio" name="family-member" value="${index}" id="member-${index}">
            <label for="member-${index}" style="cursor: pointer; flex: 1;">
                <strong>${member.firstName} ${member.lastName}</strong>
                <span style="color: #666; text-transform: capitalize;"> (${member.relationship})</span>
                ${member.dateOfBirth ? `<br><small>Born: ${formatDate(member.dateOfBirth)}</small>` : ''}
            </label>
        </div>
    `).join('');

    // Store family members data for form submission
    window.availableFamilyMembers = familyMembers;
}

function selectFamilyMember(index) {
    // Remove previous selection
    document.querySelectorAll('.family-member-option').forEach(option => {
        option.classList.remove('selected');
    });

    // Select current option
    const selectedOption = document.querySelectorAll('.family-member-option')[index];
    selectedOption.classList.add('selected');
    selectedOption.querySelector('input[type="radio"]').checked = true;

    selectedFamilyMember = window.availableFamilyMembers[index];
}

function setupNewClaimForm() {
    document.getElementById('new-claim-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitNewClaim();
    });
}

async function submitNewClaim() {
    try {
        hideError('claim-error');
        hideError('claim-success');

        if (!selectedFamilyMember) {
            showError('claim-error', 'Please select a family member');
            return;
        }

        const dateOfDeath = document.getElementById('date-of-death').value;
        const reason = document.getElementById('claim-reason').value.trim();

        if (!dateOfDeath || !reason) {
            showError('claim-error', 'Please fill in all required fields');
            return;
        }

        const claimData = {
            deceasedFamilyMember: {
                ...selectedFamilyMember,
                dateOfDeath: dateOfDeath
            },
            claimAmount: 1, // Default amount that will be overridden by admin
            reason: reason
        };

        const response = await AuthService.makeRequest('/claims', {
            method: 'POST',
            body: JSON.stringify(claimData)
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('claim-success', 'Claim submitted successfully!');
            setTimeout(() => {
                document.getElementById('new-claim-modal').style.display = 'none';
                resetClaimForm();
                loadClaims(); // Reload claims list
            }, 2000);
        } else {
            showError('claim-error', data.message || 'Failed to submit claim');
        }
    } catch (error) {
        console.error('Submit claim error:', error);
        showError('claim-error', 'Failed to submit claim. Please try again.');
    }
}

async function viewClaimDetails(claimId) {
    try {
        const response = await AuthService.makeRequest(`/claims/${claimId}`);
        const data = await response.json();

        if (response.ok) {
            displayClaimDetailsModal(data.claim);
        } else {
            showError('error', data.message || 'Failed to load claim details');
        }
    } catch (error) {
        console.error('View claim details error:', error);
        showError('error', 'Failed to load claim details. Please try again.');
    }
}

function displayClaimDetailsModal(claim) {
    const content = document.getElementById('claim-details-content');
    
    content.innerHTML = `
        <div class="claim-details-full">
            <div class="form-section">
                <h3>👤 Deceased Family Member</h3>
                <div class="claim-details">
                    <div class="claim-detail">
                        <span class="claim-detail-label">Name</span>
                        <span class="claim-detail-value">${claim.deceasedFamilyMember.firstName} ${claim.deceasedFamilyMember.lastName}</span>
                    </div>
                    <div class="claim-detail">
                        <span class="claim-detail-label">Relationship</span>
                        <span class="claim-detail-value" style="text-transform: capitalize;">${claim.deceasedFamilyMember.relationship}</span>
                    </div>
                    <div class="claim-detail">
                        <span class="claim-detail-label">Date of Death</span>
                        <span class="claim-detail-value">${formatDate(claim.deceasedFamilyMember.dateOfDeath)}</span>
                    </div>
                    ${claim.deceasedFamilyMember.dateOfBirth ? `
                    <div class="claim-detail">
                        <span class="claim-detail-label">Date of Birth</span>
                        <span class="claim-detail-value">${formatDate(claim.deceasedFamilyMember.dateOfBirth)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="form-section">
                <h3>💰 Claim Information</h3>
                <div class="claim-details">
                    <div class="claim-detail">
                        <span class="claim-detail-label">Status</span>
                        <span class="claim-detail-value">
                            <span class="claim-status status-${claim.status}">${claim.status}</span>
                        </span>
                    </div>
                    <div class="claim-detail">
                        <span class="claim-detail-label">Submitted</span>
                        <span class="claim-detail-value">${formatDate(claim.createdAt)}</span>
                    </div>
                    ${claim.approvedAmount ? `
                    <div class="claim-detail">
                        <span class="claim-detail-label">Approved Amount</span>
                        <span class="claim-detail-value">${formatCurrency(claim.approvedAmount)}</span>
                    </div>
                    <div class="claim-detail">
                        <span class="claim-detail-label">Per Member Contribution</span>
                        <span class="claim-detail-value">${formatCurrency(claim.perMemberContribution)}</span>
                    </div>
                    ` : `
                    <div class="claim-detail">
                        <span class="claim-detail-label">Amount</span>
                        <span class="claim-detail-value">To be determined by admin</span>
                    </div>
                    `}
                </div>
                
                <div style="margin-top: 1rem;">
                    <span class="claim-detail-label">Reason</span>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-top: 0.5rem;">
                        ${claim.reason}
                    </div>
                </div>
            </div>

            ${claim.reviewNotes ? `
            <div class="form-section">
                <h3>📝 Admin Review</h3>
                <div class="claim-details">
                    ${claim.reviewedBy ? `
                    <div class="claim-detail">
                        <span class="claim-detail-label">Reviewed By</span>
                        <span class="claim-detail-value">${claim.reviewedBy.firstName} ${claim.reviewedBy.lastName}</span>
                    </div>
                    ` : ''}
                </div>
                <div style="margin-top: 1rem;">
                    <span class="claim-detail-label">Review Notes</span>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-top: 0.5rem;">
                        ${claim.reviewNotes}
                    </div>
                </div>
            </div>
            ` : ''}

            ${claim.statusHistory && claim.statusHistory.length > 0 ? `
            <div class="form-section">
                <h3>📊 Status History</h3>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${claim.statusHistory.map(history => `
                        <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem;">
                            <div style="display: flex; justify-content: between; align-items: center;">
                                <span class="claim-status status-${history.status}">${history.status}</span>
                                <small style="color: #666;">${formatDate(history.changedAt)}</small>
                            </div>
                            ${history.notes ? `<div style="margin-top: 0.5rem; font-size: 0.875rem;">${history.notes}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${claim.stripePaymentLinkUrl && claim.status === 'approved' ? `
            <div class="form-section">
                <h3>💳 Community Contribution</h3>
                <div class="payment-link-section">
                    <p>Your claim has been approved! Community members can contribute using the link below:</p>
                    <a href="${claim.stripePaymentLinkUrl}" target="_blank" class="btn btn-primary">Open Payment Link</a>
                </div>
            </div>
            ` : ''}
        </div>
    `;

    document.getElementById('claim-details-modal').style.display = 'block';
}


function resetClaimForm() {
    document.getElementById('new-claim-form').reset();
    selectedFamilyMember = null;
    hideError('claim-error');
    hideError('claim-success');
    
    // Clear family member selection
    document.querySelectorAll('.family-member-option').forEach(option => {
        option.classList.remove('selected');
        option.querySelector('input[type="radio"]').checked = false;
    });
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

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
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