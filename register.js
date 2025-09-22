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

        // Collect family flags
        const hasSpouseRadio = document.querySelector('input[name="hasSpouse"]:checked');
        const hasChildrenRadio = document.querySelector('input[name="hasChildren"]:checked');
        const hasParentsRadio = document.querySelector('input[name="hasParents"]:checked');
        const hasSiblingsRadio = document.querySelector('input[name="hasSiblings"]:checked');

        formData.hasSpouse = hasSpouseRadio ? hasSpouseRadio.value === 'true' : false;
        formData.hasChildren = hasChildrenRadio ? hasChildrenRadio.value === 'true' : false;
        formData.hasParents = hasParentsRadio ? hasParentsRadio.value === 'true' : false;
        formData.hasSiblings = hasSiblingsRadio ? hasSiblingsRadio.value === 'true' : false;

        // Collect spouse data only if hasSpouse is true
        if (formData.hasSpouse) {
            const spouseFirstName = document.getElementById('spouseFirstName').value.trim();
            const spouseLastName = document.getElementById('spouseLastName').value.trim();
            const spouseNotes = document.getElementById('spouseNotes').value.trim();
            
            formData.spouse = {
                firstName: spouseFirstName,
                lastName: spouseLastName,
                dateOfBirth: document.getElementById('spouseDateOfBirth').value,
                relationship: document.getElementById('spouseRelationship').value || 'spouse',
                notes: spouseNotes
            };
        }

        // Collect children data only if hasChildren is true
        formData.children = [];
        if (formData.hasChildren) {
            const childrenInputs = document.querySelectorAll('#childrenContainer .family-member-item');
            childrenInputs.forEach(child => {
                const firstName = child.querySelector('[name$=".firstName"]').value.trim();
                const lastName = child.querySelector('[name$=".lastName"]').value.trim();
                const dateOfBirth = child.querySelector('[name$=".dateOfBirth"]').value;
                const relationship = child.querySelector('[name$=".relationship"]').value;
                const notes = child.querySelector('[name$=".notes"]').value.trim();
                
                if (firstName && lastName && relationship) {
                    formData.children.push({
                        firstName,
                        lastName,
                        dateOfBirth,
                        relationship,
                        notes
                    });
                }
            });
        }

        // Collect parents data only if hasParents is true
        formData.parents = [];
        if (formData.hasParents) {
            const parentsInputs = document.querySelectorAll('#parentsContainer .family-member-item');
            parentsInputs.forEach(parent => {
                const firstName = parent.querySelector('[name$=".firstName"]').value.trim();
                const lastName = parent.querySelector('[name$=".lastName"]').value.trim();
                const relationship = parent.querySelector('[name$=".relationship"]').value;
                const notes = parent.querySelector('[name$=".notes"]').value.trim();
                
                if (firstName && lastName && relationship) {
                    formData.parents.push({
                        firstName,
                        lastName,
                        relationship,
                        notes
                    });
                }
            });
        }

        // Collect siblings data only if hasSiblings is true
        formData.siblings = [];
        if (formData.hasSiblings) {
            const siblingsInputs = document.querySelectorAll('#siblingsContainer .family-member-item');
            siblingsInputs.forEach(sibling => {
                const firstName = sibling.querySelector('[name$=".firstName"]').value.trim();
                const lastName = sibling.querySelector('[name$=".lastName"]').value.trim();
                const relationship = sibling.querySelector('[name$=".relationship"]').value;
                const notes = sibling.querySelector('[name$=".notes"]').value.trim();
                
                if (firstName && lastName && relationship) {
                    formData.siblings.push({
                        firstName,
                        lastName,
                        relationship,
                        notes
                    });
                }
            });
        }

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
                <label>First Name <span class="required">*</span></label>
                <input type="text" name="children[${index}].firstName" maxlength="50" required>
            </div>
            <div class="form-group">
                <label>Last Name <span class="required">*</span></label>
                <input type="text" name="children[${index}].lastName" maxlength="50" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Date of Birth</label>
                <input type="date" name="children[${index}].dateOfBirth">
            </div>
            <div class="form-group">
                <label>Relationship <span class="required">*</span></label>
                <select name="children[${index}].relationship" required>
                    <option value="">Select relationship</option>
                    <option value="son">Son</option>
                    <option value="daughter">Daughter</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Notes (Special circumstances, adopted, etc.)</label>
            <textarea name="children[${index}].notes" rows="2" maxlength="500" placeholder="Any special notes about this child..." id="childNotes${index}" oninput="updateCharCount('childNotes${index}', 500)"></textarea>
            <small class="char-count">0/500 characters</small>
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
                <label>First Name <span class="required">*</span></label>
                <input type="text" name="parents[${index}].firstName" maxlength="50" required>
            </div>
            <div class="form-group">
                <label>Last Name <span class="required">*</span></label>
                <input type="text" name="parents[${index}].lastName" maxlength="50" required>
            </div>
        </div>
        <div class="form-group">
            <label>Relationship <span class="required">*</span></label>
            <select name="parents[${index}].relationship" required>
                <option value="">Select relationship</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
            </select>
        </div>
        <div class="form-group">
            <label>Notes (Special circumstances, adopted, etc.)</label>
            <textarea name="parents[${index}].notes" rows="2" maxlength="500" placeholder="Any special notes about this parent/guardian..." id="parentNotes${index}" oninput="updateCharCount('parentNotes${index}', 500)"></textarea>
            <small class="char-count">0/500 characters</small>
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
                <label>First Name <span class="required">*</span></label>
                <input type="text" name="siblings[${index}].firstName" maxlength="50" required>
            </div>
            <div class="form-group">
                <label>Last Name <span class="required">*</span></label>
                <input type="text" name="siblings[${index}].lastName" maxlength="50" required>
            </div>
        </div>
        <div class="form-group">
            <label>Relationship <span class="required">*</span></label>
            <select name="siblings[${index}].relationship" required>
                <option value="">Select relationship</option>
                <option value="brother">Brother</option>
                <option value="sister">Sister</option>
            </select>
        </div>
        <div class="form-group">
            <label>Notes (Special circumstances, adopted, etc.)</label>
            <textarea name="siblings[${index}].notes" rows="2" maxlength="500" placeholder="Any special notes about this sibling..." id="siblingNotes${index}" oninput="updateCharCount('siblingNotes${index}', 500)"></textarea>
            <small class="char-count">0/500 characters</small>
        </div>
        <button type="button" class="remove-btn" onclick="removeSibling(this)">Remove</button>
    `;
    
    container.appendChild(siblingDiv);
}

function removeSibling(btn) {
    btn.parentElement.remove();
}

// Family section toggle functions
function toggleSpouseDetails(hasSpouse) {
    const spouseDetails = document.getElementById('spouseDetails');
    const spouseInputs = spouseDetails.querySelectorAll('input, select, textarea');
    
    if (hasSpouse) {
        spouseDetails.style.display = 'block';
        // Make spouse fields required
        document.getElementById('spouseFirstName').required = true;
        document.getElementById('spouseLastName').required = true;
        document.getElementById('spouseRelationship').required = true;
    } else {
        spouseDetails.style.display = 'none';
        // Remove required and clear values
        spouseInputs.forEach(input => {
            input.required = false;
            input.value = '';
        });
    }
}

function toggleChildrenDetails(hasChildren) {
    const childrenDetails = document.getElementById('childrenDetails');
    const childrenContainer = document.getElementById('childrenContainer');
    
    if (hasChildren) {
        childrenDetails.style.display = 'block';
        // Add first child if none exist
        if (childrenContainer.children.length === 0) {
            addChild();
        }
    } else {
        childrenDetails.style.display = 'none';
        // Clear all children
        childrenContainer.innerHTML = '';
        registrationForm.childrenCount = 0;
    }
}

function toggleParentsDetails(hasParents) {
    const parentsDetails = document.getElementById('parentsDetails');
    const parentsContainer = document.getElementById('parentsContainer');
    
    if (hasParents) {
        parentsDetails.style.display = 'block';
        // Add first parent if none exist
        if (parentsContainer.children.length === 0) {
            addParent();
        }
    } else {
        parentsDetails.style.display = 'none';
        // Clear all parents
        parentsContainer.innerHTML = '';
        registrationForm.parentsCount = 0;
    }
}

function toggleSiblingsDetails(hasSiblings) {
    const siblingsDetails = document.getElementById('siblingsDetails');
    const siblingsContainer = document.getElementById('siblingsContainer');
    
    if (hasSiblings) {
        siblingsDetails.style.display = 'block';
        // Add first sibling if none exist
        if (siblingsContainer.children.length === 0) {
            addSibling();
        }
    } else {
        siblingsDetails.style.display = 'none';
        // Clear all siblings
        siblingsContainer.innerHTML = '';
        registrationForm.siblingsCount = 0;
    }
}

// Character count functionality
function updateCharCount(textareaId, maxLength) {
    const textarea = document.getElementById(textareaId);
    const charCountElement = textarea.nextElementSibling;
    const currentLength = textarea.value.length;
    
    if (charCountElement && charCountElement.classList.contains('char-count')) {
        charCountElement.textContent = `${currentLength}/${maxLength} characters`;
        
        // Change color when approaching limit
        if (currentLength > maxLength * 0.9) {
            charCountElement.style.color = '#e74c3c';
        } else if (currentLength > maxLength * 0.8) {
            charCountElement.style.color = '#f39c12';
        } else {
            charCountElement.style.color = '#666';
        }
    }
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