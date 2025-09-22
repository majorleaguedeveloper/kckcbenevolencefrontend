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

    // Family information
    displaySpouse(user.spouse);
    displayChildren(user.children);
    displayParents(user.parents);
    displaySiblings(user.siblings);
    
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

function populateAmendmentForm(userData) {
    // Populate spouse information
    displayAmendmentSpouse(userData.spouse);
    
    // Populate children information
    displayAmendmentChildren(userData.children || []);
    
    // Populate parents information
    displayAmendmentParents(userData.parents || []);
    
    // Populate siblings information
    displayAmendmentSiblings(userData.siblings || []);
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
                        <input type="date" name="spouse[dateOfBirth]" value="${spouse.dateOfBirth ? new Date(spouse.dateOfBirth).toISOString().split('T')[0] : ''}">
                    </div>
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
                    <button type="button" class="remove-member-btn" onclick="removeChild(${index})">Remove</button>
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
                        <option value="partner">Partner</option>
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
                <button type="button" class="remove-member-btn" onclick="removeChild(${newIndex})">Remove</button>
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

// Functions to remove family members
function removeSpouse() {
    const spouseContent = document.getElementById('amendSpouseContent');
    const addSpouseBtn = document.getElementById('addSpouseBtn');
    
    spouseContent.innerHTML = '<div class="no-data">No spouse information provided</div>';
    addSpouseBtn.style.display = 'inline-block';
}

function removeChild(index) {
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
                child.querySelector('.remove-member-btn').setAttribute('onclick', `removeChild(${newIndex})`);
                
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

function openAmendmentModal() {
    // Use fresh profile data instead of cached login data
    currentUserData = currentProfileData || AuthService.getUser();
    
    const modal = document.getElementById('amendmentModal');
    modal.style.display = 'flex';
    
    // Pre-populate form with current family data
    populateAmendmentForm(currentUserData);
    
    // Add character counter to notes field
    const notesField = document.getElementById('memberNotes');
    notesField.addEventListener('input', updateNotesCharCount);
    
    // Set up form submission
    const form = document.getElementById('amendmentForm');
    form.addEventListener('submit', handleAmendmentSubmission);
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

function collectFormFamilyData(formData) {
    const familyData = {
        hasSpouse: false,
        hasChildren: false,
        hasParents: false,
        hasSiblings: false,
        spouse: null,
        children: [],
        parents: [],
        siblings: []
    };
    
    // Collect spouse data
    const spouseFirstName = formData.get('spouse[firstName]');
    const spouseLastName = formData.get('spouse[lastName]');
    
    if (spouseFirstName && spouseLastName) {
        familyData.hasSpouse = true;
        familyData.spouse = {
            firstName: spouseFirstName.trim(),
            lastName: spouseLastName.trim(),
            dateOfBirth: formData.get('spouse[dateOfBirth]') || null,
            relationship: formData.get('spouse[relationship]') || 'spouse',
            notes: (formData.get('spouse[notes]') || '').trim()
        };
    }
    
    // Collect children data
    const childrenEntries = document.querySelectorAll('#amendChildrenContent .editable-family-member[data-type="child"]');
    if (childrenEntries.length > 0) {
        familyData.hasChildren = true;
        childrenEntries.forEach((entry, index) => {
            const firstName = formData.get(`children[${index}][firstName]`);
            const lastName = formData.get(`children[${index}][lastName]`);
            if (firstName && lastName) {
                familyData.children.push({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    dateOfBirth: formData.get(`children[${index}][dateOfBirth]`) || null,
                    relationship: formData.get(`children[${index}][relationship]`) || 'child',
                    notes: (formData.get(`children[${index}][notes]`) || '').trim()
                });
            }
        });
    }
    
    // Collect parents data
    const parentEntries = document.querySelectorAll('#amendParentsContent .editable-family-member[data-type="parent"]');
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
    }
    
    // Collect siblings data
    const siblingEntries = document.querySelectorAll('#amendSiblingsContent .editable-family-member[data-type="sibling"]');
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
        const proposedFamilyData = collectFormFamilyData(formData);
        
        const amendmentData = {
            proposedFamilyData: proposedFamilyData,
            memberNotes: memberNotes
        };
        
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