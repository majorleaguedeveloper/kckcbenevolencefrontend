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

    // Load claims and stats on page load
    loadClaimsStats();
    loadClaims();

    // Setup modal controls
    setupModalControls();
});

let currentPage = 1;
let currentClaim = null;

async function loadClaimsStats() {
    try {
        const response = await AuthService.makeRequest('/admin/stats');
        const data = await response.json();

        if (response.ok) {
            displayClaimsStats(data.claims);
        }
    } catch (error) {
        console.error('Load claims stats error:', error);
    }
}

function displayClaimsStats(stats) {
    const statsContainer = document.getElementById('claims-stats');
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${stats.totalClaims || 0}</div>
            <div class="stat-label">Total Claims</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.pendingClaims || 0}</div>
            <div class="stat-label">Pending Review</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.reviewClaims || 0}</div>
            <div class="stat-label">Under Review</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.approvedClaims || 0}</div>
            <div class="stat-label">Approved</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.completedClaims || 0}</div>
            <div class="stat-label">Completed</div>
        </div>
    `;
}

async function loadClaims(page = 1) {
    try {
        const status = document.getElementById('status-filter').value;
        const search = document.getElementById('search-claims').value;
        
        let url = `/admin/claims?page=${page}&limit=10`;
        if (status) url += `&status=${status}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

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

function clearFilters() {
    document.getElementById('status-filter').value = '';
    document.getElementById('search-claims').value = '';
    loadClaims(1);
}

function displayClaims(claims) {
    const claimsList = document.getElementById('claims-list');
    
    if (claims.length === 0) {
        claimsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No Claims Found</h3>
                <p>No claims match the current filters.</p>
            </div>
        `;
        return;
    }

    claimsList.innerHTML = claims.map(claim => {
        return `
            <div class="claim-card ${claim.status}">
                <div class="claim-header">
                    <div class="claim-member-info">
                        <div class="claim-member-name">
                            ${claim.user.firstName} ${claim.user.lastName}
                            <small style="color: #666; font-weight: normal;">(${claim.user.email})</small>
                        </div>
                        <div class="claim-deceased">
                            Deceased: ${claim.deceasedFamilyMember.firstName} ${claim.deceasedFamilyMember.lastName}
                            (${claim.deceasedFamilyMember.relationship})
                        </div>
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
                    <strong>Reason:</strong> ${claim.reason.length > 150 ? claim.reason.substring(0, 150) + '...' : claim.reason}
                </div>
                
                <div class="claim-actions">
                    <button onclick="viewClaimDetails('${claim._id}')" class="btn btn-outline">View Full Details</button>
                    ${claim.status === 'pending' ? `
                        <button onclick="moveToReview('${claim._id}')" class="btn btn-primary">Move to Review</button>
                    ` : ''}
                    ${['pending', 'review'].includes(claim.status) ? `
                        <button onclick="reviewClaim('${claim._id}')" class="btn btn-success">Review & Approve/Reject</button>
                    ` : ''}
                    ${claim.status === 'approved' ? `
                        <button onclick="markCompleted('${claim._id}')" class="btn btn-primary">Mark as Completed</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function verifyFamilyMember(claim) {
    const user = claim.user;
    const deceased = claim.deceasedFamilyMember;
    
    // Check spouse
    if (deceased.relationship === 'spouse' && user.spouse) {
        return user.spouse.firstName?.toLowerCase() === deceased.firstName.toLowerCase() &&
               user.spouse.lastName?.toLowerCase() === deceased.lastName.toLowerCase();
    }
    
    // Check children
    if (['son', 'daughter'].includes(deceased.relationship) && user.children) {
        return user.children.some(child => 
            child.firstName?.toLowerCase() === deceased.firstName.toLowerCase() &&
            child.lastName?.toLowerCase() === deceased.lastName.toLowerCase() &&
            child.relationship === deceased.relationship
        );
    }
    
    // Check parents
    if (['father', 'mother', 'guardian'].includes(deceased.relationship) && user.parents) {
        return user.parents.some(parent => 
            parent.firstName?.toLowerCase() === deceased.firstName.toLowerCase() &&
            parent.lastName?.toLowerCase() === deceased.lastName.toLowerCase() &&
            parent.relationship === deceased.relationship
        );
    }
    
    // Check siblings
    if (['brother', 'sister'].includes(deceased.relationship) && user.siblings) {
        return user.siblings.some(sibling => 
            sibling.firstName?.toLowerCase() === deceased.firstName.toLowerCase() &&
            sibling.lastName?.toLowerCase() === deceased.lastName.toLowerCase() &&
            sibling.relationship === deceased.relationship
        );
    }
    
    return false;
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
    const reviewModal = document.getElementById('claim-review-modal');
    const detailsModal = document.getElementById('claim-details-modal');
    
    // Review modal controls
    document.getElementById('close-review-modal').addEventListener('click', () => {
        reviewModal.style.display = 'none';
    });

    // Details modal controls
    document.getElementById('close-details-modal').addEventListener('click', () => {
        detailsModal.style.display = 'none';
    });

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === reviewModal) {
            reviewModal.style.display = 'none';
        }
        if (event.target === detailsModal) {
            detailsModal.style.display = 'none';
        }
    });
}

async function moveToReview(claimId) {
    try {
        const response = await AuthService.makeRequest(`/admin/claims/${claimId}/status`, {
            method: 'PUT',
            body: JSON.stringify({
                status: 'review',
                notes: 'Moved to review by admin'
            })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('success', 'Claim moved to review status');
            loadClaims(currentPage);
            loadClaimsStats();
        } else {
            showError('error', data.message || 'Failed to update claim status');
        }
    } catch (error) {
        console.error('Move to review error:', error);
        showError('error', 'Failed to update claim status. Please try again.');
    }
}

async function reviewClaim(claimId) {
    try {
        const response = await AuthService.makeRequest(`/admin/claims/${claimId}`);
        const data = await response.json();

        if (response.ok) {
            currentClaim = data.claim;
            displayReviewModal(data.claim);
        } else {
            showError('error', data.message || 'Failed to load claim details');
        }
    } catch (error) {
        console.error('Load claim for review error:', error);
        showError('error', 'Failed to load claim details. Please try again.');
    }
}

function displayReviewModal(claim) {
    const content = document.getElementById('review-claim-content');
    const familyMemberVerified = verifyFamilyMember(claim);
    
    content.innerHTML = `
        <div class="claim-review-full">
            <div class="form-section">
                <h3>👤 Claimant Information</h3>
                <div class="claim-details">
                    <div class="claim-detail">
                        <span class="claim-detail-label">Name</span>
                        <span class="claim-detail-value">${claim.user.firstName} ${claim.user.lastName}</span>
                    </div>
                    <div class="claim-detail">
                        <span class="claim-detail-label">Email</span>
                        <span class="claim-detail-value">${claim.user.email}</span>
                    </div>
                    <div class="claim-detail">
                        <span class="claim-detail-label">Phone</span>
                        <span class="claim-detail-value">${claim.user.phone}</span>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>💀 Deceased Family Member</h3>
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
                </div>
                
                <div class="family-verification" style="margin-top: 1rem;">
                    <div class="verification-status ${familyMemberVerified ? 'verified' : 'not-verified'}">
                        ${familyMemberVerified ? '✅ Family member verified in registration' : '❌ Family member not found in registration'}
                    </div>
                    ${!familyMemberVerified ? '<p style="color: #dc3545; font-size: 0.875rem; margin-top: 0.5rem;">⚠️ This claim should be rejected as the family member is not in the user\'s registration.</p>' : ''}
                </div>
            </div>

            <div class="form-section">
                <h3>💰 Claim Information</h3>
                <div class="claim-details">
                    <div class="claim-detail">
                        <span class="claim-detail-label">Submitted</span>
                        <span class="claim-detail-value">${formatDate(claim.createdAt)}</span>
                    </div>
                </div>
                
                <div style="background: #fff3cd; padding: 1rem; border-radius: 4px; margin-top: 1rem; color: #856404;">
                    ℹ️ <strong>Note:</strong> The member did not specify an amount. You will determine the appropriate amount if approving this claim.
                </div>
                
                <div style="margin-top: 1rem;">
                    <span class="claim-detail-label">Reason</span>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-top: 0.5rem;">
                        ${claim.reason}
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>📋 Review Decision</h3>
                <form id="review-form">
                    <div class="form-group">
                        <label>Decision:</label>
                        <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="radio" name="decision" value="approved" onchange="toggleApprovalFields(true)">
                                <span style="color: #28a745;">✅ Approve</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="radio" name="decision" value="rejected" onchange="toggleApprovalFields(false)">
                                <span style="color: #dc3545;">❌ Reject</span>
                            </label>
                        </div>
                    </div>

                    <div id="approval-fields" style="display: none;">
                        <div class="calculation-section">
                            <h4>💰 Calculate Contributions</h4>
                            <div class="form-group">
                                <label for="total-amount">Total Amount to Distribute ($):</label>
                                <input type="number" id="total-amount" min="1" step="0.01" placeholder="Enter total amount">
                                <button type="button" onclick="calculateContributions()" class="btn btn-primary" style="margin-top: 0.5rem;">
                                    Calculate Per-Member Contribution
                                </button>
                            </div>
                            <div id="calculation-result" class="calculation-result" style="display: none;">
                                <!-- Calculation results will appear here -->
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="approved-amount">Final Approved Amount ($):</label>
                            <input type="number" id="approved-amount" min="1" step="0.01" required>
                        </div>

                        <div class="form-group">
                            <label for="per-member-contribution">Per Member Contribution ($):</label>
                            <input type="number" id="per-member-contribution" min="0" step="0.01" required>
                        </div>

                        <div class="form-group">
                            <label for="stripe-payment-link">Stripe Payment Link (optional):</label>
                            <input type="url" id="stripe-payment-link" placeholder="https://buy.stripe.com/...">
                            <small>Create a payment link in Stripe for the per-member contribution amount</small>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="review-notes">Review Notes:</label>
                        <textarea id="review-notes" rows="3" placeholder="Add any notes about your decision..."></textarea>
                    </div>

                    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                        <button type="button" onclick="closeReviewModal()" class="btn btn-secondary">Cancel</button>
                        <button type="button" onclick="submitReview()" class="btn btn-primary">Submit Review</button>
                    </div>
                </form>
            </div>
        </div>
        
        <div id="review-error" class="error-message" style="display: none;"></div>
        <div id="review-success" class="success-message" style="display: none;"></div>
    `;

    document.getElementById('claim-review-modal').style.display = 'block';
}

function toggleApprovalFields(show) {
    const approvalFields = document.getElementById('approval-fields');
    approvalFields.style.display = show ? 'block' : 'none';
    
    // Clear fields when hiding
    if (!show) {
        document.getElementById('approved-amount').value = '';
        document.getElementById('per-member-contribution').value = '';
        document.getElementById('stripe-payment-link').value = '';
        document.getElementById('total-amount').value = '';
        document.getElementById('calculation-result').style.display = 'none';
    }
}

async function calculateContributions() {
    try {
        const totalAmount = parseFloat(document.getElementById('total-amount').value);
        
        if (!totalAmount || totalAmount <= 0) {
            showError('review-error', 'Please enter a valid total amount');
            return;
        }

        const response = await AuthService.makeRequest(`/admin/claims/${currentClaim._id}/calculate-contributions`, {
            method: 'POST',
            body: JSON.stringify({ totalAmount })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('calculation-result').innerHTML = `
                <h4>📊 Calculation Results</h4>
                <div class="claim-details">
                    <div class="claim-detail">
                        <span class="claim-detail-label">Total Amount</span>
                        <span class="claim-detail-value">${formatCurrency(data.totalAmount)}</span>
                    </div>
                    <div class="claim-detail">
                        <span class="claim-detail-label">Contributing Members</span>
                        <span class="claim-detail-value">${data.totalContributors}</span>
                    </div>
                    <div class="claim-detail">
                        <span class="claim-detail-label">Per Member Contribution</span>
                        <span class="claim-detail-value">${formatCurrency(data.perMemberContribution)}</span>
                    </div>
                    <div class="claim-detail">
                        <span class="claim-detail-label">Total to be Collected</span>
                        <span class="claim-detail-value">${formatCurrency(data.totalCollected)}</span>
                    </div>
                </div>
                <button type="button" onclick="useCalculatedAmounts(${data.totalAmount}, ${data.perMemberContribution})" 
                        class="btn btn-success" style="margin-top: 1rem;">
                    Use These Amounts
                </button>
            `;
            document.getElementById('calculation-result').style.display = 'block';
            hideError('review-error');
        } else {
            showError('review-error', data.message || 'Failed to calculate contributions');
        }
    } catch (error) {
        console.error('Calculate contributions error:', error);
        showError('review-error', 'Failed to calculate contributions. Please try again.');
    }
}

function useCalculatedAmounts(approvedAmount, perMemberContribution) {
    document.getElementById('approved-amount').value = approvedAmount;
    document.getElementById('per-member-contribution').value = perMemberContribution;
}

async function submitReview() {
    try {
        hideError('review-error');
        hideError('review-success');

        const decision = document.querySelector('input[name="decision"]:checked')?.value;
        const reviewNotes = document.getElementById('review-notes').value.trim();

        if (!decision) {
            showError('review-error', 'Please select a decision (approve or reject)');
            return;
        }

        const reviewData = {
            status: decision,
            reviewNotes: reviewNotes
        };

        if (decision === 'approved') {
            const approvedAmount = parseFloat(document.getElementById('approved-amount').value);
            const perMemberContribution = parseFloat(document.getElementById('per-member-contribution').value);
            const stripePaymentLinkUrl = document.getElementById('stripe-payment-link').value.trim();

            if (!approvedAmount || approvedAmount <= 0) {
                showError('review-error', 'Please enter a valid approved amount');
                return;
            }

            if (!perMemberContribution || perMemberContribution < 0) {
                showError('review-error', 'Please enter a valid per member contribution amount');
                return;
            }

            reviewData.approvedAmount = approvedAmount;
            reviewData.perMemberContribution = perMemberContribution;
            if (stripePaymentLinkUrl) {
                reviewData.stripePaymentLinkUrl = stripePaymentLinkUrl;
            }
        }

        const response = await AuthService.makeRequest(`/admin/claims/${currentClaim._id}/review`, {
            method: 'PUT',
            body: JSON.stringify(reviewData)
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('review-success', `Claim ${decision} successfully!`);
            setTimeout(() => {
                closeReviewModal();
                loadClaims(currentPage);
                loadClaimsStats();
            }, 2000);
        } else {
            showError('review-error', data.message || `Failed to ${decision} claim`);
        }
    } catch (error) {
        console.error('Submit review error:', error);
        showError('review-error', 'Failed to submit review. Please try again.');
    }
}

function closeReviewModal() {
    document.getElementById('claim-review-modal').style.display = 'none';
    currentClaim = null;
}

async function markCompleted(claimId) {
    try {
        const response = await AuthService.makeRequest(`/admin/claims/${claimId}/disbursement`, {
            method: 'PUT',
            body: JSON.stringify({
                disbursementStatus: 'completed'
            })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('success', 'Claim marked as completed');
            loadClaims(currentPage);
            loadClaimsStats();
        } else {
            showError('error', data.message || 'Failed to mark claim as completed');
        }
    } catch (error) {
        console.error('Mark completed error:', error);
        showError('error', 'Failed to mark claim as completed. Please try again.');
    }
}

async function viewClaimDetails(claimId) {
    try {
        const response = await AuthService.makeRequest(`/admin/claims/${claimId}`);
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
    const familyMemberVerified = verifyFamilyMember(claim);
    
    content.innerHTML = `
        <div class="claim-details-full">
            <div class="form-section">
                <h3>👤 Claimant Information</h3>
                <div class="claim-details">
                    <div class="claim-detail">
                        <span class="claim-detail-label">Name</span>
                        <span class="claim-detail-value">${claim.user.firstName} ${claim.user.lastName}</span>
                    </div>
                    <div class="claim-detail">
                        <span class="claim-detail-label">Email</span>
                        <span class="claim-detail-value">${claim.user.email}</span>
                    </div>
                    <div class="claim-detail">
                        <span class="claim-detail-label">Phone</span>
                        <span class="claim-detail-value">${claim.user.phone}</span>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>💀 Deceased Family Member</h3>
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
                
                <div class="family-verification" style="margin-top: 1rem;">
                    <div class="verification-status ${familyMemberVerified ? 'verified' : 'not-verified'}">
                        ${familyMemberVerified ? '✅ Family member verified in registration' : '❌ Family member not found in registration'}
                    </div>
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

            ${claim.stripePaymentLinkUrl ? `
            <div class="form-section">
                <h3>💳 Payment Link</h3>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px;">
                    <p>Stripe Payment Link for community contributions:</p>
                    <a href="${claim.stripePaymentLinkUrl}" target="_blank" class="btn btn-primary">Open Payment Link</a>
                </div>
            </div>
            ` : ''}

            ${claim.statusHistory && claim.statusHistory.length > 0 ? `
            <div class="form-section">
                <h3>📊 Status History</h3>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${claim.statusHistory.map(history => `
                        <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span class="claim-status status-${history.status}">${history.status}</span>
                                <small style="color: #666;">${formatDate(history.changedAt)}</small>
                            </div>
                            ${history.changedBy ? `<div style="font-size: 0.875rem; color: #666; margin-top: 0.25rem;">By: ${history.changedBy.firstName} ${history.changedBy.lastName}</div>` : ''}
                            ${history.notes ? `<div style="margin-top: 0.5rem; font-size: 0.875rem;">${history.notes}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;

    document.getElementById('claim-details-modal').style.display = 'block';
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