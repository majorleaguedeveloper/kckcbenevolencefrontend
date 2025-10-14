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

    loadProfile();
});

async function loadProfile() {
    try {
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error');
        const profileContent = document.getElementById('profileContent');
        
        loadingElement.style.display = 'block';
        errorElement.style.display = 'none';
        profileContent.style.display = 'none';

        console.log('Making API request to /auth/profile...');
        console.log('Token available:', !!AuthService.getToken());
        console.log('API Base URL:', AuthService.makeRequest.toString().includes('172.31.235.40') ? 'Correct' : 'Check auth.js');
        
        const response = await AuthService.makeRequest('/auth/profile');
        console.log('API response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('API response data:', data);

        if (response.ok) {
            // Debug: Log the user data received from API
            console.log('Profile data received from API:', data.user);
            displayProfile(data.user);
            loadingElement.style.display = 'none';
            profileContent.style.display = 'block';
        } else {
            throw new Error(data.message || 'Failed to load profile');
        }
    } catch (error) {
        console.error('Profile loading error:', error);
        document.getElementById('loading').style.display = 'none';
        const errorElement = document.getElementById('error');
        errorElement.textContent = 'Failed to load profile. Please try again.';
        errorElement.style.display = 'block';
    }
}

function displayProfile(user) {
    // Store the fresh profile data for use in amendment modal
    currentProfileData = user;
    
    // Profile header
    document.getElementById('profileName').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('memberSince').textContent = `Member since ${formatDate(user.createdAt)}`;

    // Personal information
    document.getElementById('firstName').textContent = user.firstName;
    document.getElementById('lastName').textContent = user.lastName;
    document.getElementById('email').textContent = user.email;
    document.getElementById('phone').textContent = user.phone;
    document.getElementById('accountStatus').textContent = user.isActive ? 'Active' : 'Inactive';
    document.getElementById('lastLogin').textContent = user.lastLogin ? formatDate(user.lastLogin) : 'Never';
    
    // Emergency contact information
    document.getElementById('emergencyContactName').textContent = user.emergencyContact?.fullName || 'Not provided';
    document.getElementById('emergencyContactPhone').textContent = user.emergencyContact?.phone || 'Not provided';
    
    // Endorsement information
    displayEndorsementInfo(user);
    
    // Additional personal information
    const dateOfBirthElement = document.getElementById('dateOfBirth');
    if (dateOfBirthElement) {
        dateOfBirthElement.textContent = user.dateOfBirth ? formatDate(user.dateOfBirth) : 'Not provided';
    }
    
    // Home address
    displayHomeAddress(user.homeAddress);

    // Family information
    displaySpouse(user.spouse);
    displayChildren(user.children);
    displayParents(user.parents);
    displaySiblings(user.siblings);
    
    // Beneficiaries information
    displayBeneficiaries(user.beneficiaries);
    
    // Load amendment requests
    loadAmendmentRequests();
}

function displaySpouse(spouse) {
    const spouseContent = document.getElementById('spouseContent');
    
    // Debug: Log spouse data
    console.log('displaySpouse called with:', spouse);
    
    if (spouse && spouse.firstName) {
        spouseContent.innerHTML = `
            <div class="family-members">
                <div class="family-member">
                    <div class="family-member-name">${spouse.firstName} ${spouse.lastName || ''}</div>
                    <div class="family-member-relation">${spouse.relationship || 'spouse'}</div>
                    ${spouse.dateOfBirth ? `<div class="family-member-dob">Born: ${formatDate(spouse.dateOfBirth)}</div>` : ''}
                    ${spouse.phone ? `<div class="family-member-phone">Phone: ${spouse.phone}</div>` : ''}
                    ${spouse.notes ? `<div class="family-member-notes"><strong>Notes:</strong> ${spouse.notes}</div>` : ''}
                </div>
            </div>
        `;
    } else {
        spouseContent.innerHTML = '<div class="no-data">No spouse information provided</div>';
    }
}

function displayChildren(children) {
    const childrenContent = document.getElementById('childrenContent');
    
    // Debug: Log children data
    console.log('displayChildren called with:', children);
    
    if (children && children.length > 0) {
        const childrenHTML = children.map(child => `
            <div class="family-member">
                <div class="family-member-name">${child.firstName} ${child.lastName}</div>
                <div class="family-member-relation">${child.relationship || 'child'}</div>
                ${child.dateOfBirth ? `<div class="family-member-dob">Born: ${formatDate(child.dateOfBirth)}</div>` : ''}
                ${child.notes ? `<div class="family-member-notes"><strong>Notes:</strong> ${child.notes}</div>` : ''}
            </div>
        `).join('');
        
        childrenContent.innerHTML = `<div class="family-members">${childrenHTML}</div>`;
    } else {
        childrenContent.innerHTML = '<div class="no-data">No children information provided</div>';
    }
}

function displayParents(parents) {
    const parentsContent = document.getElementById('parentsContent');
    
    // Debug: Log parents data
    console.log('displayParents called with:', parents);
    
    if (parents && parents.length > 0) {
        const parentsHTML = parents.map(parent => `
            <div class="family-member">
                <div class="family-member-name">${parent.firstName} ${parent.lastName}</div>
                <div class="family-member-relation">${parent.relationship}</div>
                ${parent.notes ? `<div class="family-member-notes"><strong>Notes:</strong> ${parent.notes}</div>` : ''}
            </div>
        `).join('');
        
        parentsContent.innerHTML = `<div class="family-members">${parentsHTML}</div>`;
    } else {
        parentsContent.innerHTML = '<div class="no-data">No parents information provided</div>';
    }
}

function displaySiblings(siblings) {
    const siblingsContent = document.getElementById('siblingsContent');
    
    // Debug: Log siblings data
    console.log('displaySiblings called with:', siblings);
    
    if (siblings && siblings.length > 0) {
        const siblingsHTML = siblings.map(sibling => `
            <div class="family-member">
                <div class="family-member-name">${sibling.firstName} ${sibling.lastName}</div>
                <div class="family-member-relation">${sibling.relationship}</div>
                ${sibling.notes ? `<div class="family-member-notes"><strong>Notes:</strong> ${sibling.notes}</div>` : ''}
            </div>
        `).join('');
        
        siblingsContent.innerHTML = `<div class="family-members">${siblingsHTML}</div>`;
    } else {
        siblingsContent.innerHTML = '<div class="no-data">No siblings information provided</div>';
    }
}

function displayHomeAddress(homeAddress) {
    const addressElement = document.getElementById('homeAddressContent');
    if (!addressElement) return;
    
    if (homeAddress && (homeAddress.street || homeAddress.city || homeAddress.state || homeAddress.postalCode || homeAddress.country)) {
        const addressParts = [];
        if (homeAddress.street) addressParts.push(homeAddress.street);
        if (homeAddress.city) addressParts.push(homeAddress.city);
        if (homeAddress.state) addressParts.push(homeAddress.state);
        if (homeAddress.postalCode) addressParts.push(homeAddress.postalCode);
        if (homeAddress.country) addressParts.push(homeAddress.country);
        
        addressElement.innerHTML = `
            <div class="address-info">
                ${addressParts.join(', ')}
            </div>
        `;
    } else {
        addressElement.innerHTML = '<div class="no-data">No home address provided</div>';
    }
}

function displayEndorsementInfo(user) {
    // Status display with badge
    const statusElement = document.getElementById('endorsementStatus');
    const status = user.endorsementStatus || 'pending';
    const statusIcons = {
        'pending': '⏳',
        'endorsed': '✅',
        'rejected': '❌'
    };
    
    statusElement.innerHTML = `
        <span class="status-badge ${status}">
            ${statusIcons[status]} ${status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    `;
    
    // Endorsement date
    const dateElement = document.getElementById('endorsementDate');
    if (user.endorsementDate) {
        dateElement.textContent = formatDate(user.endorsementDate);
    } else {
        dateElement.textContent = status === 'pending' ? 'Not yet endorsed' : 'Not available';
    }
    
    // Endorsed by
    const endorsedByElement = document.getElementById('endorsedBy');
    if (user.endorsedBy) {
        if (user.endorsedBy.firstName) {
            endorsedByElement.innerHTML = `
                ${user.endorsedBy.firstName} ${user.endorsedBy.lastName || ''}
                ${user.endorsedBy.email ? `<br><small style="color: #666;">(${user.endorsedBy.email})</small>` : ''}
            `;
        } else {
            endorsedByElement.textContent = 'System Admin';
        }
    } else {
        endorsedByElement.textContent = status === 'pending' ? 'Awaiting assignment' : 'Not available';
    }
    
    // Show/hide action required item and set explanations
    const actionItem = document.getElementById('endorsementActionItem');
    const actionElement = document.getElementById('endorsementAction');
    const explanationDiv = document.getElementById('endorsementExplanation');
    const explanationText = document.getElementById('endorsementExplanationText');
    
    explanationDiv.className = `endorsement-explanation ${status}`;
    
    switch (status) {
        case 'pending':
            actionItem.style.display = 'block';
            actionElement.innerHTML = '<span style="color: #ffc107;">⚠️ Awaiting endorsement approval</span>';
            explanationDiv.style.display = 'block';
            explanationText.innerHTML = `
                <strong>📋 Endorsement Pending</strong><br>
                Your account is currently awaiting endorsement from an existing member. 
                Once endorsed, you'll gain full access to all platform features including 
                claims submission, family management, and benefit participation.
            `;
            break;
            
        case 'endorsed':
            actionItem.style.display = 'none';
            explanationDiv.style.display = 'block';
            explanationText.innerHTML = `
                <strong>🎉 Account Endorsed!</strong><br>
                Your account has been successfully endorsed. You now have full access to 
                all Benevolence Fund features and can participate in the mutual aid community.
            `;
            break;
            
        case 'rejected':
            actionItem.style.display = 'block';
            actionElement.innerHTML = '<span style="color: #dc3545;">❌ Endorsement has been rejected</span>';
            explanationDiv.style.display = 'block';
            explanationText.innerHTML = `
                <strong>🚫 Endorsement Rejected</strong><br>
                Unfortunately, your endorsement request has been rejected. 
                Please contact support or request a new endorsement from another member 
                to proceed with your account activation.
            `;
            break;
            
        default:
            actionItem.style.display = 'none';
            explanationDiv.style.display = 'none';
    }
}

function displayBeneficiaries(beneficiaries) {
    const beneficiariesContent = document.getElementById('beneficiariesContent');
    if (!beneficiariesContent) return;
    
    console.log('displayBeneficiaries called with:', beneficiaries);
    
    if (beneficiaries && beneficiaries.length > 0) {
        const beneficiariesHTML = beneficiaries.map(beneficiary => `
            <div class="family-member">
                <div class="family-member-name">${beneficiary.name}</div>
                <div class="family-member-phone">Phone: ${beneficiary.phone}</div>
                <div class="family-member-percentage">Percentage: ${beneficiary.beneficiaryPercentage}%</div>
            </div>
        `).join('');
        
        // Calculate total percentage
        const totalPercentage = beneficiaries.reduce((sum, b) => sum + (b.beneficiaryPercentage || 0), 0);
        
        beneficiariesContent.innerHTML = `
            <div class="family-members">${beneficiariesHTML}</div>
            <div class="percentage-summary">Total: ${totalPercentage}%</div>
        `;
    } else {
        beneficiariesContent.innerHTML = '<div class="no-data">No beneficiaries information provided</div>';
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

// Amendment Modal Functions
let currentUserData = null;
let currentProfileData = null;
let originalUserDataForAmendment = null;

function populateAmendmentForm(userData) {
    // Populate personal information
    displayAmendmentPersonalInfo(userData);
    
    // Populate emergency contact information
    displayAmendmentEmergencyContact(userData.emergencyContact);
    
    // Populate spouse information
    displayAmendmentSpouse(userData.spouse);
    
    // Populate children information
    displayAmendmentChildren(userData.children || []);
    
    // Populate parents information
    displayAmendmentParents(userData.parents || []);
    
    // Populate siblings information
    displayAmendmentSiblings(userData.siblings || []);
    
    // Populate beneficiaries information
    displayAmendmentBeneficiaries(userData.beneficiaries || []);
}

function displayAmendmentEmergencyContact(emergencyContact) {
    const emergencyContactContent = document.getElementById('amendEmergencyContactContent');
    
    if (emergencyContact && (emergencyContact.fullName || emergencyContact.phone)) {
        emergencyContactContent.innerHTML = `
            <div class="editable-family-member" data-type="emergencyContact">
                <div class="member-header">
                    <div class="member-title">Emergency Contact</div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" name="emergencyContact[fullName]" value="${emergencyContact.fullName || ''}" required maxlength="100">
                    </div>
                    <div class="form-group">
                        <label>Phone Number *</label>
                        <input type="tel" name="emergencyContact[phone]" value="${emergencyContact.phone || ''}" required placeholder="+254712345678">
                    </div>
                </div>
            </div>
        `;
    } else {
        emergencyContactContent.innerHTML = `
            <div class="editable-family-member" data-type="emergencyContact">
                <div class="member-header">
                    <div class="member-title">Emergency Contact</div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" name="emergencyContact[fullName]" required maxlength="100">
                    </div>
                    <div class="form-group">
                        <label>Phone Number *</label>
                        <input type="tel" name="emergencyContact[phone]" required placeholder="+254712345678">
                    </div>
                </div>
            </div>
        `;
    }
}

function displayAmendmentSpouse(spouse) {
    const spouseContent = document.getElementById('amendSpouseContent');
    const addSpouseBtn = document.getElementById('addSpouseBtn');
    
    if (spouse && spouse.firstName) {
        spouseContent.innerHTML = `
            <div class="editable-family-member" data-type="spouse">
                <div class="member-header">
                    <div class="member-title">${spouse.firstName} ${spouse.lastName || ''}</div>
                    <button type="button" class="remove-member-btn" onclick="removeSpouse()">Remove</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name *</label>
                        <input type="text" name="spouse[firstName]" value="${spouse.firstName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name *</label>
                        <input type="text" name="spouse[lastName]" value="${spouse.lastName || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Date of Birth</label>
                        <input type="date" name="spouse[dateOfBirth]" value="${spouse.dateOfBirth && spouse.dateOfBirth !== null ? new Date(spouse.dateOfBirth).toISOString().split('T')[0] : ''}">
                    </div>
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="tel" name="spouse[phone]" value="${spouse.phone || ''}" placeholder="+254712345678">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Relationship *</label>
                        <select name="spouse[relationship]" required>
                            <option value="spouse" ${spouse.relationship === 'spouse' ? 'selected' : ''}>Spouse</option>
                            <option value="partner" ${spouse.relationship === 'partner' ? 'selected' : ''}>Partner</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="spouse[notes]" rows="2" maxlength="500">${spouse.notes || ''}</textarea>
                </div>
            </div>
        `;
        addSpouseBtn.style.display = 'none';
    } else {
        spouseContent.innerHTML = '<div class="no-data">No spouse information provided</div>';
        addSpouseBtn.style.display = 'inline-block';
    }
}

function displayAmendmentChildren(children) {
    const childrenContent = document.getElementById('amendChildrenContent');
    
    if (children && children.length > 0) {
        const childrenHTML = children.map((child, index) => `
            <div class="editable-family-member" data-type="child" data-index="${index}">
                <div class="member-header">
                    <div class="member-title">${child.firstName} ${child.lastName}</div>
                    <button type="button" class="remove-member-btn" onclick="removeFamilyChild(${index})">Remove</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name *</label>
                        <input type="text" name="children[${index}][firstName]" value="${child.firstName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name *</label>
                        <input type="text" name="children[${index}][lastName]" value="${child.lastName || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Date of Birth</label>
                        <input type="date" name="children[${index}][dateOfBirth]" value="${child.dateOfBirth ? new Date(child.dateOfBirth).toISOString().split('T')[0] : ''}">
                    </div>
                    <div class="form-group">
                        <label>Relationship *</label>
                        <select name="children[${index}][relationship]" required>
                            <option value="son" ${child.relationship === 'son' ? 'selected' : ''}>Son</option>
                            <option value="daughter" ${child.relationship === 'daughter' ? 'selected' : ''}>Daughter</option>
                            <option value="child" ${child.relationship === 'child' ? 'selected' : ''}>Child</option>
                            <option value="adopted son" ${child.relationship === 'adopted son' ? 'selected' : ''}>Adopted Son</option>
                            <option value="adopted daughter" ${child.relationship === 'adopted daughter' ? 'selected' : ''}>Adopted Daughter</option>
                            <option value="stepson" ${child.relationship === 'stepson' ? 'selected' : ''}>Stepson</option>
                            <option value="stepdaughter" ${child.relationship === 'stepdaughter' ? 'selected' : ''}>Stepdaughter</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="children[${index}][notes]" rows="2" maxlength="500">${child.notes || ''}</textarea>
                </div>
            </div>
        `).join('');
        
        childrenContent.innerHTML = childrenHTML;
    } else {
        childrenContent.innerHTML = '<div class="no-data">No children information provided</div>';
    }
}

function displayAmendmentParents(parents) {
    const parentsContent = document.getElementById('amendParentsContent');
    
    if (parents && parents.length > 0) {
        const parentsHTML = parents.map((parent, index) => `
            <div class="editable-family-member" data-type="parent" data-index="${index}">
                <div class="member-header">
                    <div class="member-title">${parent.firstName} ${parent.lastName}</div>
                    <button type="button" class="remove-member-btn" onclick="removeParent(${index})">Remove</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name *</label>
                        <input type="text" name="parents[${index}][firstName]" value="${parent.firstName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name *</label>
                        <input type="text" name="parents[${index}][lastName]" value="${parent.lastName || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Relationship *</label>
                        <select name="parents[${index}][relationship]" required>
                            <option value="father" ${parent.relationship === 'father' ? 'selected' : ''}>Father</option>
                            <option value="mother" ${parent.relationship === 'mother' ? 'selected' : ''}>Mother</option>
                            <option value="parent" ${parent.relationship === 'parent' ? 'selected' : ''}>Parent</option>
                            <option value="adoptive father" ${parent.relationship === 'adoptive father' ? 'selected' : ''}>Adoptive Father</option>
                            <option value="adoptive mother" ${parent.relationship === 'adoptive mother' ? 'selected' : ''}>Adoptive Mother</option>
                            <option value="stepfather" ${parent.relationship === 'stepfather' ? 'selected' : ''}>Stepfather</option>
                            <option value="stepmother" ${parent.relationship === 'stepmother' ? 'selected' : ''}>Stepmother</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="parents[${index}][notes]" rows="2" maxlength="500">${parent.notes || ''}</textarea>
                </div>
            </div>
        `).join('');
        
        parentsContent.innerHTML = parentsHTML;
    } else {
        parentsContent.innerHTML = '<div class="no-data">No parents information provided</div>';
    }
}

function displayAmendmentSiblings(siblings) {
    const siblingsContent = document.getElementById('amendSiblingsContent');
    
    if (siblings && siblings.length > 0) {
        const siblingsHTML = siblings.map((sibling, index) => `
            <div class="editable-family-member" data-type="sibling" data-index="${index}">
                <div class="member-header">
                    <div class="member-title">${sibling.firstName} ${sibling.lastName}</div>
                    <button type="button" class="remove-member-btn" onclick="removeSibling(${index})">Remove</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name *</label>
                        <input type="text" name="siblings[${index}][firstName]" value="${sibling.firstName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name *</label>
                        <input type="text" name="siblings[${index}][lastName]" value="${sibling.lastName || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Relationship *</label>
                        <select name="siblings[${index}][relationship]" required>
                            <option value="brother" ${sibling.relationship === 'brother' ? 'selected' : ''}>Brother</option>
                            <option value="sister" ${sibling.relationship === 'sister' ? 'selected' : ''}>Sister</option>
                            <option value="sibling" ${sibling.relationship === 'sibling' ? 'selected' : ''}>Sibling</option>
                            <option value="half-brother" ${sibling.relationship === 'half-brother' ? 'selected' : ''}>Half-Brother</option>
                            <option value="half-sister" ${sibling.relationship === 'half-sister' ? 'selected' : ''}>Half-Sister</option>
                            <option value="stepbrother" ${sibling.relationship === 'stepbrother' ? 'selected' : ''}>Stepbrother</option>
                            <option value="stepsister" ${sibling.relationship === 'stepsister' ? 'selected' : ''}>Stepsister</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="siblings[${index}][notes]" rows="2" maxlength="500">${sibling.notes || ''}</textarea>
                </div>
            </div>
        `).join('');
        
        siblingsContent.innerHTML = siblingsHTML;
    } else {
        siblingsContent.innerHTML = '<div class="no-data">No siblings information provided</div>';
    }
}

// Functions to add family members
function addSpouse() {
    const spouseContent = document.getElementById('amendSpouseContent');
    const addSpouseBtn = document.getElementById('addSpouseBtn');
    
    spouseContent.innerHTML = `
        <div class="editable-family-member" data-type="spouse">
            <div class="member-header">
                <div class="member-title">New Spouse</div>
                <button type="button" class="remove-member-btn" onclick="removeSpouse()">Remove</button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>First Name *</label>
                    <input type="text" name="spouse[firstName]" required>
                </div>
                <div class="form-group">
                    <label>Last Name *</label>
                    <input type="text" name="spouse[lastName]" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="date" name="spouse[dateOfBirth]">
                </div>
                <div class="form-group">
                    <label>Relationship *</label>
                    <select name="spouse[relationship]" required>
                        <option value="">Select relationship</option>
                        <option value="spouse">Spouse</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea name="spouse[notes]" rows="2" maxlength="500"></textarea>
            </div>
        </div>
    `;
    addSpouseBtn.style.display = 'none';
}

function addChild() {
    const childrenContent = document.getElementById('amendChildrenContent');
    const existingChildren = childrenContent.querySelectorAll('.editable-family-member');
    const newIndex = existingChildren.length;
    
    if (newIndex === 0) {
        childrenContent.innerHTML = '';
    }
    
    const childHTML = `
        <div class="editable-family-member" data-type="child" data-index="${newIndex}">
            <div class="member-header">
                <div class="member-title">New Child</div>
                <button type="button" class="remove-member-btn" onclick="removeFamilyChild(${newIndex})">Remove</button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>First Name *</label>
                    <input type="text" name="children[${newIndex}][firstName]" required>
                </div>
                <div class="form-group">
                    <label>Last Name *</label>
                    <input type="text" name="children[${newIndex}][lastName]" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="date" name="children[${newIndex}][dateOfBirth]">
                </div>
                <div class="form-group">
                    <label>Relationship *</label>
                    <select name="children[${newIndex}][relationship]" required>
                        <option value="">Select relationship</option>
                        <option value="son">Son</option>
                        <option value="daughter">Daughter</option>
                        <option value="child">Child</option>
                        <option value="adopted son">Adopted Son</option>
                        <option value="adopted daughter">Adopted Daughter</option>
                        <option value="stepson">Stepson</option>
                        <option value="stepdaughter">Stepdaughter</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea name="children[${newIndex}][notes]" rows="2" maxlength="500"></textarea>
            </div>
        </div>
    `;
    
    childrenContent.insertAdjacentHTML('beforeend', childHTML);
}

function addParent() {
    const parentsContent = document.getElementById('amendParentsContent');
    const existingParents = parentsContent.querySelectorAll('.editable-family-member');
    const newIndex = existingParents.length;
    
    if (newIndex === 0) {
        parentsContent.innerHTML = '';
    }
    
    const parentHTML = `
        <div class="editable-family-member" data-type="parent" data-index="${newIndex}">
            <div class="member-header">
                <div class="member-title">New Parent</div>
                <button type="button" class="remove-member-btn" onclick="removeParent(${newIndex})">Remove</button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>First Name *</label>
                    <input type="text" name="parents[${newIndex}][firstName]" required>
                </div>
                <div class="form-group">
                    <label>Last Name *</label>
                    <input type="text" name="parents[${newIndex}][lastName]" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Relationship *</label>
                    <select name="parents[${newIndex}][relationship]" required>
                        <option value="">Select relationship</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="parent">Parent</option>
                        <option value="adoptive father">Adoptive Father</option>
                        <option value="adoptive mother">Adoptive Mother</option>
                        <option value="stepfather">Stepfather</option>
                        <option value="stepmother">Stepmother</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea name="parents[${newIndex}][notes]" rows="2" maxlength="500"></textarea>
            </div>
        </div>
    `;
    
    parentsContent.insertAdjacentHTML('beforeend', parentHTML);
}

function addSibling() {
    const siblingsContent = document.getElementById('amendSiblingsContent');
    const existingSiblings = siblingsContent.querySelectorAll('.editable-family-member');
    const newIndex = existingSiblings.length;
    
    if (newIndex === 0) {
        siblingsContent.innerHTML = '';
    }
    
    const siblingHTML = `
        <div class="editable-family-member" data-type="sibling" data-index="${newIndex}">
            <div class="member-header">
                <div class="member-title">New Sibling</div>
                <button type="button" class="remove-member-btn" onclick="removeSibling(${newIndex})">Remove</button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>First Name *</label>
                    <input type="text" name="siblings[${newIndex}][firstName]" required>
                </div>
                <div class="form-group">
                    <label>Last Name *</label>
                    <input type="text" name="siblings[${newIndex}][lastName]" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Relationship *</label>
                    <select name="siblings[${newIndex}][relationship]" required>
                        <option value="">Select relationship</option>
                        <option value="brother">Brother</option>
                        <option value="sister">Sister</option>
                        <option value="sibling">Sibling</option>
                        <option value="half-brother">Half-Brother</option>
                        <option value="half-sister">Half-Sister</option>
                        <option value="stepbrother">Stepbrother</option>
                        <option value="stepsister">Stepsister</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea name="siblings[${newIndex}][notes]" rows="2" maxlength="500"></textarea>
            </div>
        </div>
    `;
    
    siblingsContent.insertAdjacentHTML('beforeend', siblingHTML);
}

function addBeneficiary() {
    const beneficiariesContent = document.getElementById('amendBeneficiariesContent');
    const existingBeneficiaries = beneficiariesContent.querySelectorAll('.editable-family-member');
    
    if (existingBeneficiaries.length >= 3) {
        alert('Maximum 3 beneficiaries allowed');
        return;
    }
    
    if (existingBeneficiaries.length === 0) {
        beneficiariesContent.innerHTML = '';
    }
    
    addAmendmentBeneficiary();
}

// Functions to remove family members
function removeSpouse() {
    const spouseContent = document.getElementById('amendSpouseContent');
    const addSpouseBtn = document.getElementById('addSpouseBtn');
    
    spouseContent.innerHTML = '<div class="no-data">No spouse information provided</div>';
    addSpouseBtn.style.display = 'inline-block';
}

function removeFamilyChild(index) {
    const childElement = document.querySelector(`[data-type="child"][data-index="${index}"]`);
    if (childElement) {
        childElement.remove();
        
        // Check if there are any children left
        const childrenContent = document.getElementById('amendChildrenContent');
        const remainingChildren = childrenContent.querySelectorAll('.editable-family-member');
        
        if (remainingChildren.length === 0) {
            childrenContent.innerHTML = '<div class="no-data">No children information provided</div>';
        } else {
            // Re-index remaining children
            remainingChildren.forEach((child, newIndex) => {
                child.setAttribute('data-index', newIndex);
                child.querySelector('.remove-member-btn').setAttribute('onclick', `removeFamilyChild(${newIndex})`);
                
                // Update form field names
                const inputs = child.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    const name = input.getAttribute('name');
                    if (name && name.includes('children[')) {
                        const newName = name.replace(/children\[\d+\]/, `children[${newIndex}]`);
                        input.setAttribute('name', newName);
                    }
                });
            });
        }
    }
}

function removeParent(index) {
    const parentElement = document.querySelector(`[data-type="parent"][data-index="${index}"]`);
    if (parentElement) {
        parentElement.remove();
        
        // Check if there are any parents left
        const parentsContent = document.getElementById('amendParentsContent');
        const remainingParents = parentsContent.querySelectorAll('.editable-family-member');
        
        if (remainingParents.length === 0) {
            parentsContent.innerHTML = '<div class="no-data">No parents information provided</div>';
        } else {
            // Re-index remaining parents
            remainingParents.forEach((parent, newIndex) => {
                parent.setAttribute('data-index', newIndex);
                parent.querySelector('.remove-member-btn').setAttribute('onclick', `removeParent(${newIndex})`);
                
                // Update form field names
                const inputs = parent.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    const name = input.getAttribute('name');
                    if (name && name.includes('parents[')) {
                        const newName = name.replace(/parents\[\d+\]/, `parents[${newIndex}]`);
                        input.setAttribute('name', newName);
                    }
                });
            });
        }
    }
}

function removeSibling(index) {
    const siblingElement = document.querySelector(`[data-type="sibling"][data-index="${index}"]`);
    if (siblingElement) {
        siblingElement.remove();
        
        // Check if there are any siblings left
        const siblingsContent = document.getElementById('amendSiblingsContent');
        const remainingSiblings = siblingsContent.querySelectorAll('.editable-family-member');
        
        if (remainingSiblings.length === 0) {
            siblingsContent.innerHTML = '<div class="no-data">No siblings information provided</div>';
        } else {
            // Re-index remaining siblings
            remainingSiblings.forEach((sibling, newIndex) => {
                sibling.setAttribute('data-index', newIndex);
                sibling.querySelector('.remove-member-btn').setAttribute('onclick', `removeSibling(${newIndex})`);
                
                // Update form field names
                const inputs = sibling.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    const name = input.getAttribute('name');
                    if (name && name.includes('siblings[')) {
                        const newName = name.replace(/siblings\[\d+\]/, `siblings[${newIndex}]`);
                        input.setAttribute('name', newName);
                    }
                });
            });
        }
    }
}

async function openAmendmentModal() {
    try {
        // Always fetch fresh user data to avoid contamination
        const response = await AuthService.makeRequest('/auth/profile');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to load user data');
        }
        
        // Use fresh data directly, never cached global data
        const freshUserData = data.user;
        
        // Store original data for comparison during submission
        originalUserDataForAmendment = JSON.parse(JSON.stringify(freshUserData));
        
        const modal = document.getElementById('amendmentModal');
        modal.style.display = 'flex';
        
        // Pre-populate form with fresh family data
        populateAmendmentForm(freshUserData);
        
        // Add character counter to notes field
        const notesField = document.getElementById('memberNotes');
        notesField.addEventListener('input', updateNotesCharCount);
        
        // Set up form submission
        const form = document.getElementById('amendmentForm');
        form.addEventListener('submit', handleAmendmentSubmission);
        
    } catch (error) {
        console.error('Failed to open amendment modal:', error);
        alert('Failed to load user data. Please try again.');
    }
}

function closeAmendmentModal() {
    const modal = document.getElementById('amendmentModal');
    modal.style.display = 'none';
    
    // Reset form
    const form = document.getElementById('amendmentForm');
    form.reset();
    
    // Remove event listeners
    const notesField = document.getElementById('memberNotes');
    notesField.removeEventListener('input', updateNotesCharCount);
    form.removeEventListener('submit', handleAmendmentSubmission);
    
    // Clear global state to prevent contamination
    currentUserData = null;
    originalUserDataForAmendment = null;
    
    // Reset character count
    const charCount = document.querySelector('.char-count');
    if (charCount) {
        charCount.textContent = '0/1000 characters';
        charCount.style.color = '#666';
    }
}

function updateNotesCharCount() {
    const notesField = document.getElementById('memberNotes');
    const charCount = document.querySelector('.char-count');
    const currentLength = notesField.value.length;
    const maxLength = 1000;
    
    charCount.textContent = `${currentLength}/${maxLength} characters`;
    
    // Change color when approaching limit
    if (currentLength > maxLength * 0.9) {
        charCount.style.color = '#e74c3c';
    } else if (currentLength > maxLength * 0.8) {
        charCount.style.color = '#f39c12';
    } else {
        charCount.style.color = '#666';
    }
}

function collectFormFamilyData(formData, originalUserData = null) {
    const familyData = {};
    
    // Personal information - use form data if available, otherwise use original
    const amendedDateOfBirth = formData.get('amendDateOfBirth');
    familyData.dateOfBirth = amendedDateOfBirth || originalUserData?.dateOfBirth || null;
    
    const formHomeAddress = {
        street: formData.get('amendHomeAddressStreet') || '',
        city: formData.get('amendHomeAddressCity') || '',
        state: formData.get('amendHomeAddressState') || '',
        postalCode: formData.get('amendHomeAddressPostalCode') || '',
        country: formData.get('amendHomeAddressCountry') || ''
    };
    
    // If form has any address data, use it; otherwise use original
    const hasFormAddressData = Object.values(formHomeAddress).some(v => v !== '');
    if (hasFormAddressData) {
        familyData.homeAddress = formHomeAddress;
    } else {
        familyData.homeAddress = originalUserData?.homeAddress || {};
    }
    
    // Emergency contact information
    const emergencyContactFullName = formData.get('emergencyContact[fullName]');
    const emergencyContactPhone = formData.get('emergencyContact[phone]');
    
    if (emergencyContactFullName || emergencyContactPhone) {
        familyData.emergencyContact = {
            fullName: emergencyContactFullName ? emergencyContactFullName.trim() : '',
            phone: emergencyContactPhone ? emergencyContactPhone.trim() : ''
        };
    } else {
        // Use original emergency contact data to preserve unchanged sections
        familyData.emergencyContact = originalUserData?.emergencyContact || {};
    }
    
    // Spouse information
    const spouseFirstName = formData.get('spouse[firstName]');
    const spouseLastName = formData.get('spouse[lastName]');
    
    if (spouseFirstName && spouseLastName) {
        const spouseDateOfBirth = formData.get('spouse[dateOfBirth]');
        
        // Preserve original date if form value matches what was displayed
        let finalDateOfBirth = null;
        if (spouseDateOfBirth && spouseDateOfBirth.trim() !== '') {
            if (originalUserData && originalUserData.spouse && originalUserData.spouse.dateOfBirth) {
                const originalDisplayDate = new Date(originalUserData.spouse.dateOfBirth).toISOString().split('T')[0];
                if (spouseDateOfBirth === originalDisplayDate) {
                    // User didn't change the date, preserve original
                    finalDateOfBirth = originalUserData.spouse.dateOfBirth;
                } else {
                    // User changed the date, use new value
                    finalDateOfBirth = spouseDateOfBirth;
                }
            } else {
                // No original date, use form value
                finalDateOfBirth = spouseDateOfBirth;
            }
        }
        
        familyData.hasSpouse = true;
        familyData.spouse = {
            firstName: spouseFirstName.trim(),
            lastName: spouseLastName.trim(),
            dateOfBirth: finalDateOfBirth,
            relationship: formData.get('spouse[relationship]') || 'spouse',
            phone: formData.get('spouse[phone]') || '',
            notes: (formData.get('spouse[notes]') || '').trim()
        };
    } else {
        // No form spouse data - use original data to preserve unchanged sections
        if (originalUserData && originalUserData.spouse && originalUserData.spouse.firstName) {
            familyData.hasSpouse = true;
            familyData.spouse = originalUserData.spouse;
        } else {
            familyData.hasSpouse = false;
            familyData.spouse = {};
        }
    }
    
    // Children information
    const childrenEntries = document.querySelectorAll('#amendChildrenContent .editable-family-member[data-type="child"]');
    familyData.children = [];
    
    if (childrenEntries.length > 0) {
        familyData.hasChildren = true;
        childrenEntries.forEach((entry, index) => {
            const firstName = formData.get(`children[${index}][firstName]`);
            const lastName = formData.get(`children[${index}][lastName]`);
            if (firstName && lastName) {
                const childDateOfBirth = formData.get(`children[${index}][dateOfBirth]`);
                
                // Preserve original child date if unchanged
                let finalChildDateOfBirth = null;
                if (childDateOfBirth && childDateOfBirth.trim() !== '') {
                    if (originalUserData && originalUserData.children && originalUserData.children[index] && originalUserData.children[index].dateOfBirth) {
                        const originalChildDisplayDate = new Date(originalUserData.children[index].dateOfBirth).toISOString().split('T')[0];
                        if (childDateOfBirth === originalChildDisplayDate) {
                            // User didn't change the date, preserve original
                            finalChildDateOfBirth = originalUserData.children[index].dateOfBirth;
                        } else {
                            // User changed the date, use new value
                            finalChildDateOfBirth = childDateOfBirth;
                        }
                    } else {
                        // No original date, use form value
                        finalChildDateOfBirth = childDateOfBirth;
                    }
                }
                
                familyData.children.push({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    dateOfBirth: finalChildDateOfBirth,
                    relationship: formData.get(`children[${index}][relationship]`) || 'child',
                    notes: (formData.get(`children[${index}][notes]`) || '').trim()
                });
            }
        });
    } else {
        // No form elements found - use original data to preserve unchanged sections
        if (originalUserData && originalUserData.children && originalUserData.children.length > 0) {
            familyData.hasChildren = true;
            familyData.children = originalUserData.children;
        } else {
            familyData.hasChildren = false;
        }
    }
    
    // Parents information
    const parentEntries = document.querySelectorAll('#amendParentsContent .editable-family-member[data-type="parent"]');
    familyData.parents = [];
    
    if (parentEntries.length > 0) {
        familyData.hasParents = true;
        parentEntries.forEach((entry, index) => {
            const firstName = formData.get(`parents[${index}][firstName]`);
            const lastName = formData.get(`parents[${index}][lastName]`);
            if (firstName && lastName) {
                familyData.parents.push({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    relationship: formData.get(`parents[${index}][relationship]`) || 'parent',
                    notes: (formData.get(`parents[${index}][notes]`) || '').trim()
                });
            }
        });
    } else {
        familyData.hasParents = false;
    }
    
    // Siblings information
    const siblingEntries = document.querySelectorAll('#amendSiblingsContent .editable-family-member[data-type="sibling"]');
    familyData.siblings = [];
    
    if (siblingEntries.length > 0) {
        familyData.hasSiblings = true;
        siblingEntries.forEach((entry, index) => {
            const firstName = formData.get(`siblings[${index}][firstName]`);
            const lastName = formData.get(`siblings[${index}][lastName]`);
            if (firstName && lastName) {
                familyData.siblings.push({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    relationship: formData.get(`siblings[${index}][relationship]`) || 'sibling',
                    notes: (formData.get(`siblings[${index}][notes]`) || '').trim()
                });
            }
        });
    } else {
        // No form elements found - use original data to preserve unchanged sections
        if (originalUserData && originalUserData.siblings && originalUserData.siblings.length > 0) {
            familyData.hasSiblings = true;
            familyData.siblings = originalUserData.siblings;
        } else {
            familyData.hasSiblings = false;
        }
    }
    
    // Beneficiaries information
    const beneficiaryEntries = document.querySelectorAll('#amendBeneficiariesContent .editable-family-member[data-type="beneficiary"]');
    familyData.beneficiaries = [];
    
    if (beneficiaryEntries.length > 0) {
        familyData.hasBeneficiaries = true;
        beneficiaryEntries.forEach((entry, index) => {
            const name = formData.get(`beneficiaries[${index}][name]`);
            const phone = formData.get(`beneficiaries[${index}][phone]`);
            const percentage = formData.get(`beneficiaries[${index}][beneficiaryPercentage]`);
            if (name && phone && percentage) {
                familyData.beneficiaries.push({
                    name: name.trim(),
                    phone: phone.trim(),
                    beneficiaryPercentage: parseInt(percentage) || 0
                });
            }
        });
    } else {
        // No form elements found - use original data to preserve unchanged sections
        if (originalUserData && originalUserData.beneficiaries && originalUserData.beneficiaries.length > 0) {
            familyData.hasBeneficiaries = true;
            familyData.beneficiaries = originalUserData.beneficiaries;
        } else {
            familyData.hasBeneficiaries = false;
        }
    }
    
    return familyData;
}

async function handleAmendmentSubmission(e) {
    e.preventDefault();
    
    const memberNotes = document.getElementById('memberNotes').value.trim();
    
    if (!memberNotes) {
        alert('Please provide a reason for your amendment request.');
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        
        // Collect proposed family data from the form
        const formData = new FormData(e.target);
        const proposedFamilyData = collectFormFamilyData(formData, originalUserDataForAmendment);
        
        const amendmentData = {
            proposedFamilyData: proposedFamilyData,
            memberNotes: memberNotes
        };
        
        console.log('Submitting amendment data:', amendmentData);
        
        const response = await AuthService.makeRequest('/amendments/member/submit-amendment', {
            method: 'POST',
            body: JSON.stringify(amendmentData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Amendment request submitted successfully! An administrator will review your request.');
            closeAmendmentModal();
            // Refresh the amendment requests list
            loadAmendmentRequests();
        } else {
            alert(result.message || 'Failed to submit amendment request. Please try again.');
        }
        
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
    } catch (error) {
        console.error('Amendment submission error:', error);
        alert('Network error. Please try again.');
        
        // Reset button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Amendment Request';
    }
}

// Amendment requests history
async function loadAmendmentRequests() {
    try {
        const loadingElement = document.getElementById('loadingAmendments');
        const listElement = document.getElementById('amendmentRequestsList');
        
        loadingElement.style.display = 'block';
        
        const response = await AuthService.makeRequest('/amendments/member/my-amendments');
        const data = await response.json();
        
        loadingElement.style.display = 'none';
        
        if (response.ok) {
            if (data.amendments.length === 0) {
                listElement.innerHTML = '<div class="no-data">No amendment requests found. You can submit a new request using the button above.</div>';
            } else {
                listElement.innerHTML = data.amendments.map(amendment => createAmendmentRequestHTML(amendment)).join('');
            }
        } else {
            listElement.innerHTML = '<div class="error">Failed to load amendment requests.</div>';
        }
    } catch (error) {
        console.error('Load amendment requests error:', error);
        document.getElementById('loadingAmendments').style.display = 'none';
        document.getElementById('amendmentRequestsList').innerHTML = '<div class="error">Network error. Please try again.</div>';
    }
}

function displayAmendmentPersonalInfo(userData) {
    // Date of Birth
    const dateOfBirthInput = document.getElementById('amendDateOfBirth');
    if (dateOfBirthInput) {
        dateOfBirthInput.value = userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '';
    }
    
    // Home Address
    const homeAddress = userData.homeAddress || {};
    const streetInput = document.getElementById('amendHomeAddressStreet');
    const cityInput = document.getElementById('amendHomeAddressCity');
    const stateInput = document.getElementById('amendHomeAddressState');
    const postalCodeInput = document.getElementById('amendHomeAddressPostalCode');
    const countryInput = document.getElementById('amendHomeAddressCountry');
    
    if (streetInput) streetInput.value = homeAddress.street || '';
    if (cityInput) cityInput.value = homeAddress.city || '';
    if (stateInput) stateInput.value = homeAddress.state || '';
    if (postalCodeInput) postalCodeInput.value = homeAddress.postalCode || '';
    if (countryInput) countryInput.value = homeAddress.country || '';
}

function displayAmendmentBeneficiaries(beneficiaries) {
    const beneficiariesContent = document.getElementById('amendBeneficiariesContent');
    const addBeneficiaryBtn = document.getElementById('addBeneficiaryBtn');
    
    if (!beneficiariesContent) return;
    
    // Clear existing content
    beneficiariesContent.innerHTML = '';
    
    if (beneficiaries && beneficiaries.length > 0) {
        beneficiaries.forEach((beneficiary, index) => {
            addAmendmentBeneficiary(beneficiary, index);
        });
        addBeneficiaryBtn.style.display = beneficiaries.length >= 3 ? 'none' : 'inline-block';
    } else {
        addBeneficiaryBtn.style.display = 'inline-block';
    }
    
    updateAmendmentPercentageTotal();
}

function addAmendmentBeneficiary(beneficiaryData = {}, index = null) {
    const container = document.getElementById('amendBeneficiariesContent');
    const existingBeneficiaries = container.querySelectorAll('.editable-family-member');
    
    if (existingBeneficiaries.length >= 3) {
        alert('Maximum 3 beneficiaries allowed');
        return;
    }
    
    const newIndex = index !== null ? index : existingBeneficiaries.length;
    
    const beneficiaryHTML = `
        <div class="editable-family-member" data-type="beneficiary" data-index="${newIndex}">
            <div class="member-header">
                <div class="member-title">Beneficiary ${newIndex + 1}</div>
                <button type="button" class="remove-member-btn" onclick="removeAmendmentBeneficiary(this)">Remove</button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="beneficiaries[${newIndex}][name]" value="${beneficiaryData.name || ''}" required maxlength="100">
                </div>
                <div class="form-group">
                    <label>Phone Number *</label>
                    <input type="tel" name="beneficiaries[${newIndex}][phone]" value="${beneficiaryData.phone || ''}" required placeholder="+254712345678">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Beneficiary Percentage (%) *</label>
                    <input type="number" name="beneficiaries[${newIndex}][beneficiaryPercentage]" 
                           value="${beneficiaryData.beneficiaryPercentage || ''}" 
                           required min="1" max="100" step="1" 
                           onchange="updateAmendmentPercentageTotal()">
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', beneficiaryHTML);
    
    // Update add button visibility
    const addBtn = document.getElementById('addBeneficiaryBtn');
    if (container.querySelectorAll('.editable-family-member').length >= 3) {
        addBtn.style.display = 'none';
    }
    
    updateAmendmentPercentageTotal();
}

function removeAmendmentBeneficiary(button) {
    const beneficiaryElement = button.closest('.editable-family-member');
    beneficiaryElement.remove();
    
    // Re-index remaining beneficiaries
    const container = document.getElementById('amendBeneficiariesContent');
    const remaining = container.querySelectorAll('.editable-family-member');
    
    remaining.forEach((element, index) => {
        element.setAttribute('data-index', index);
        element.querySelector('.member-title').textContent = `Beneficiary ${index + 1}`;
        
        // Update input names
        const inputs = element.querySelectorAll('input');
        inputs.forEach(input => {
            const name = input.getAttribute('name');
            if (name && name.includes('beneficiaries[')) {
                const newName = name.replace(/beneficiaries\[\d+\]/, `beneficiaries[${index}]`);
                input.setAttribute('name', newName);
            }
        });
    });
    
    // Show add button if under limit
    const addBtn = document.getElementById('addBeneficiaryBtn');
    addBtn.style.display = remaining.length < 3 ? 'inline-block' : 'none';
    
    updateAmendmentPercentageTotal();
}

function updateAmendmentPercentageTotal() {
    const percentageInputs = document.querySelectorAll('#amendBeneficiariesContent input[name*="beneficiaryPercentage"]');
    let total = 0;
    
    percentageInputs.forEach(input => {
        const value = parseInt(input.value) || 0;
        total += value;
    });
    
    const totalElement = document.getElementById('amendTotalPercentage');
    if (totalElement) {
        totalElement.textContent = total;
        
        const container = totalElement.parentElement;
        container.classList.remove('valid', 'invalid');
        
        if (total === 100) {
            container.classList.add('valid');
        } else if (total > 0) {
            container.classList.add('invalid');
        }
    }
}

function createAmendmentRequestHTML(amendment) {
    const statusClass = `status-${amendment.status}`;
    
    return `
        <div class="amendment-request-item">
            <div class="amendment-request-header">
                <div class="amendment-date">
                    Submitted: ${formatDate(amendment.createdAt)}
                    ${amendment.reviewedAt ? `• Reviewed: ${formatDate(amendment.reviewedAt)}` : ''}
                </div>
                <span class="amendment-status-badge ${statusClass}">${amendment.status}</span>
            </div>
            
            <div class="amendment-notes">
                <strong>Your Request:</strong> ${amendment.memberNotes}
            </div>
            
            ${amendment.adminResponse ? `
                <div class="amendment-notes">
                    <strong>Admin Response:</strong> ${amendment.adminResponse}
                    ${amendment.reviewedBy ? `<br><small>Reviewed by: ${amendment.reviewedBy.firstName} ${amendment.reviewedBy.lastName}</small>` : ''}
                </div>
            ` : ''}
        </div>
    `;
}