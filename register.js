// Registration form functionality
class RegistrationForm {
    constructor() {
        this.childrenCount = 0;
        this.parentsCount = 0;
        this.siblingsCount = 0;
        this.currentStep = 1;
        this.initializeForm();
    }

    initializeForm() {
        const form = document.getElementById('registrationForm');
        form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Check if already logged in
        if (AuthService.isLoggedIn()) {
            this.showError('You are already logged in. Please logout first to register a new account.');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        document.getElementById('successMessage').style.display = 'none';
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showSuccess(message) {
        const successElement = document.getElementById('successMessage');
        successElement.textContent = message;
        successElement.style.display = 'block';
        document.getElementById('errorMessage').style.display = 'none';
        successElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    hideMessages() {
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('successMessage').style.display = 'none';
    }

    setLoading(loading) {
        const btn = document.getElementById('registerBtn');
        const text = document.getElementById('registerText');
        const spinner = document.getElementById('loadingSpinner');
        
        btn.disabled = loading;
        if (loading) {
            text.style.display = 'none';
            spinner.style.display = 'block';
        } else {
            text.style.display = 'inline';
            spinner.style.display = 'none';
        }
    }

    updateStepIndicator(step) {
        const steps = document.querySelectorAll('.step');
        steps.forEach((stepEl, index) => {
            stepEl.classList.remove('active', 'completed');
            if (index + 1 < step) {
                stepEl.classList.add('completed');
            } else if (index + 1 === step) {
                stepEl.classList.add('active');
            }
        });
    }

    validatePersonalInfo() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;

        if (!firstName || firstName.length < 2) {
            this.showError('First name must be at least 2 characters long');
            return false;
        }

        if (!lastName || lastName.length < 2) {
            this.showError('Last name must be at least 2 characters long');
            return false;
        }

        if (!email || !email.includes('@')) {
            this.showError('Please enter a valid email address');
            return false;
        }

        if (!phone || !/^\+[1-9]\d{1,14}$/.test(phone)) {
            this.showError('Please enter a valid international phone number with country code (e.g., +254712345678)');
            return false;
        }

        if (!password || password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return false;
        }

        const confirmPassword = document.getElementById('confirmPassword').value;
        if (!confirmPassword) {
            this.showError('Please confirm your password');
            return false;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return false;
        }

        return true;
    }

    collectFormData() {
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: document.getElementById('password').value
        };

        // Collect spouse data
        const spouseFirstName = document.getElementById('spouseFirstName').value.trim();
        const spouseLastName = document.getElementById('spouseLastName').value.trim();
        
        if (spouseFirstName || spouseLastName) {
            formData.spouse = {
                firstName: spouseFirstName,
                lastName: spouseLastName,
                dateOfBirth: document.getElementById('spouseDateOfBirth').value,
                relationship: document.getElementById('spouseRelationship').value || 'spouse'
            };
        }

        // Collect children data
        formData.children = [];
        const childrenInputs = document.querySelectorAll('#childrenContainer .family-member-item');
        childrenInputs.forEach(child => {
            const firstName = child.querySelector('[name$=".firstName"]').value.trim();
            const lastName = child.querySelector('[name$=".lastName"]').value.trim();
            const dateOfBirth = child.querySelector('[name$=".dateOfBirth"]').value;
            const relationship = child.querySelector('[name$=".relationship"]').value;
            
            if (firstName && lastName) {
                formData.children.push({
                    firstName,
                    lastName,
                    dateOfBirth,
                    relationship: relationship || 'son'
                });
            }
        });

        // Collect parents data
        formData.parents = [];
        const parentsInputs = document.querySelectorAll('#parentsContainer .family-member-item');
        parentsInputs.forEach(parent => {
            const firstName = parent.querySelector('[name$=".firstName"]').value.trim();
            const lastName = parent.querySelector('[name$=".lastName"]').value.trim();
            const relationship = parent.querySelector('[name$=".relationship"]').value;
            
            if (firstName && lastName && relationship) {
                formData.parents.push({
                    firstName,
                    lastName,
                    relationship
                });
            }
        });

        // Collect siblings data
        formData.siblings = [];
        const siblingsInputs = document.querySelectorAll('#siblingsContainer .family-member-item');
        siblingsInputs.forEach(sibling => {
            const firstName = sibling.querySelector('[name$=".firstName"]').value.trim();
            const lastName = sibling.querySelector('[name$=".lastName"]').value.trim();
            const relationship = sibling.querySelector('[name$=".relationship"]').value;
            
            if (firstName && lastName && relationship) {
                formData.siblings.push({
                    firstName,
                    lastName,
                    relationship
                });
            }
        });

        return formData;
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.hideMessages();

        if (!this.validatePersonalInfo()) {
            return;
        }

        this.setLoading(true);

        try {
            const formData = this.collectFormData();
            console.log('Submitting registration data:', formData);

            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.updateStepIndicator(2);
                this.showSuccess('Registration initiated! Please check your email for a verification code.');
                
                // Redirect to verification page with email
                setTimeout(() => {
                    window.location.href = `verify-email.html?email=${encodeURIComponent(formData.email)}`;
                }, 2000);
            } else {
                this.showError(data.message || 'Registration failed. Please try again.');
                this.setLoading(false);
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Network error. Please check your connection and try again.');
            this.setLoading(false);
        }
    }
}

// Family member management functions
function addChild() {
    const container = document.getElementById('childrenContainer');
    const index = registrationForm.childrenCount++;
    
    const childDiv = document.createElement('div');
    childDiv.className = 'family-member-item';
    childDiv.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>First Name</label>
                <input type="text" name="children[${index}].firstName" maxlength="50">
            </div>
            <div class="form-group">
                <label>Last Name</label>
                <input type="text" name="children[${index}].lastName" maxlength="50">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Date of Birth</label>
                <input type="date" name="children[${index}].dateOfBirth">
            </div>
            <div class="form-group">
                <label>Relationship</label>
                <select name="children[${index}].relationship">
                    <option value="son">Son</option>
                    <option value="daughter">Daughter</option>
                </select>
            </div>
        </div>
        <button type="button" class="remove-btn" onclick="removeChild(this)">Remove</button>
    `;
    
    container.appendChild(childDiv);
}

function removeChild(btn) {
    btn.parentElement.remove();
}

function addParent() {
    const container = document.getElementById('parentsContainer');
    const index = registrationForm.parentsCount++;
    
    const parentDiv = document.createElement('div');
    parentDiv.className = 'family-member-item';
    parentDiv.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>First Name</label>
                <input type="text" name="parents[${index}].firstName" maxlength="50">
            </div>
            <div class="form-group">
                <label>Last Name</label>
                <input type="text" name="parents[${index}].lastName" maxlength="50">
            </div>
        </div>
        <div class="form-group">
            <label>Relationship</label>
            <select name="parents[${index}].relationship">
                <option value="">Select relationship</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
            </select>
        </div>
        <button type="button" class="remove-btn" onclick="removeParent(this)">Remove</button>
    `;
    
    container.appendChild(parentDiv);
}

function removeParent(btn) {
    btn.parentElement.remove();
}

function addSibling() {
    const container = document.getElementById('siblingsContainer');
    const index = registrationForm.siblingsCount++;
    
    const siblingDiv = document.createElement('div');
    siblingDiv.className = 'family-member-item';
    siblingDiv.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>First Name</label>
                <input type="text" name="siblings[${index}].firstName" maxlength="50">
            </div>
            <div class="form-group">
                <label>Last Name</label>
                <input type="text" name="siblings[${index}].lastName" maxlength="50">
            </div>
        </div>
        <div class="form-group">
            <label>Relationship</label>
            <select name="siblings[${index}].relationship">
                <option value="">Select relationship</option>
                <option value="brother">Brother</option>
                <option value="sister">Sister</option>
            </select>
        </div>
        <button type="button" class="remove-btn" onclick="removeSibling(this)">Remove</button>
    `;
    
    container.appendChild(siblingDiv);
}

function removeSibling(btn) {
    btn.parentElement.remove();
}

// Password toggle functionality
function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const toggleIcon = document.getElementById(fieldId + '-toggle-icon');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleIcon.textContent = '🙈';
    } else {
        passwordField.type = 'password';
        toggleIcon.textContent = '👁️';
    }
}

// Password confirmation validation
function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageElement = document.getElementById('password-match-message');
    
    if (!confirmPassword) {
        messageElement.textContent = '';
        messageElement.className = 'password-match-message empty';
        return;
    }
    
    if (password === confirmPassword) {
        messageElement.textContent = '✅ Passwords match';
        messageElement.className = 'password-match-message match';
    } else {
        messageElement.textContent = '❌ Passwords do not match';
        messageElement.className = 'password-match-message no-match';
    }
}

// Initialize the form when DOM loads
let registrationForm;
document.addEventListener('DOMContentLoaded', function() {
    registrationForm = new RegistrationForm();
    
    // Add password confirmation listeners
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirmPassword');
    
    passwordField.addEventListener('input', checkPasswordMatch);
    confirmPasswordField.addEventListener('input', checkPasswordMatch);
});