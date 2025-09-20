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