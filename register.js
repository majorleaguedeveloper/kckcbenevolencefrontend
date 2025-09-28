// Registration form functionality
class RegistrationForm {
    constructor() {
        this.childrenCount = 0;
        this.parentsCount = 0;
        this.siblingsCount = 0;
        this.beneficiariesCount = 0;
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
            return;
        }
        
        // Add real-time validation and user guidance
        this.setupRealTimeValidation();
        this.setupFormFlowImprovements();
    }
    
    setupRealTimeValidation() {
        // Email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                const email = emailInput.value.trim();
                if (email && !email.includes('@')) {
                    this.showFieldError(emailInput, 'Please enter a valid email address');
                } else {
                    this.clearFieldError(emailInput);
                }
            });
        }
        
        // Phone validation
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', () => {
                // Auto-format phone number
                let value = phoneInput.value.replace(/[^\d+]/g, '');
                if (value && !value.startsWith('+')) {
                    value = '+' + value;
                }
                phoneInput.value = value;
            });
            
            phoneInput.addEventListener('blur', () => {
                const phone = phoneInput.value.trim();
                if (phone && !/^\+[1-9]\d{1,14}$/.test(phone)) {
                    this.showFieldError(phoneInput, 'Please use international format: +country_code_number');
                } else {
                    this.clearFieldError(phoneInput);
                }
            });
        }
        
        // Password validation
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                if (password.length > 0 && password.length < 6) {
                    this.showFieldError(passwordInput, 'Password must be at least 6 characters');
                } else {
                    this.clearFieldError(passwordInput);
                }
                
                // Check confirm password if it has a value
                if (confirmPasswordInput && confirmPasswordInput.value) {
                    this.validatePasswordMatch();
                }
            });
        }
        
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        }
    }
    
    setupFormFlowImprovements() {
        // Add smooth transitions for family sections
        const familyRadios = document.querySelectorAll('input[type="radio"][name^="has"]');
        familyRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const name = e.target.name;
                const value = e.target.value === 'true';
                
                // Show helpful guidance when user selects "Yes"
                if (value) {
                    setTimeout(() => {
                        const containerMap = {
                            'hasChildren': 'childrenContainer',
                            'hasParents': 'parentsContainer',
                            'hasSiblings': 'siblingsContainer',
                            'hasBeneficiaries': 'beneficiariesContainer'
                        };
                        
                        const containerId = containerMap[name];
                        if (containerId) {
                            const container = document.getElementById(containerId);
                            if (container && container.children.length === 0) {
                                // Auto-scroll to the add button area
                                const addButton = container.parentElement.querySelector('button');
                                if (addButton) {
                                    addButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                    // Briefly highlight the add button
                                    addButton.style.transform = 'scale(1.05)';
                                    addButton.style.transition = 'transform 0.3s ease';
                                    setTimeout(() => {
                                        addButton.style.transform = 'scale(1)';
                                    }, 600);
                                }
                            }
                        }
                    }, 300);
                }
            });
        });
        
        // Add helpful tooltips for required fields
        this.addFieldTooltips();
    }
    
    validatePasswordMatch() {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (!passwordInput || !confirmPasswordInput) return;
        
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError(confirmPasswordInput, 'Passwords do not match');
        } else {
            this.clearFieldError(confirmPasswordInput);
        }
    }
    
    showFieldError(input, message) {
        this.clearFieldError(input);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '0.8rem';
        errorDiv.style.marginTop = '4px';
        
        input.style.borderColor = '#e74c3c';
        input.parentNode.appendChild(errorDiv);
    }
    
    clearFieldError(input) {
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        input.style.borderColor = '';
    }
    
    addFieldTooltips() {
        const tooltips = {
            'phone': 'Use international format starting with + (e.g., +15551234567)',
            'password': 'Minimum 6 characters required',
            'email': 'Use a valid email address you can access'
        };
        
        Object.entries(tooltips).forEach(([id, tooltip]) => {
            const input = document.getElementById(id);
            if (input) {
                input.title = tooltip;
                input.setAttribute('data-tooltip', tooltip);
            }
        });
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
            this.showError('Please enter a valid international phone number with country code (e.g., +15551234567)');
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

    validateFamilyInfo() {
        // Check required family flags
        const hasSpouseRadio = document.querySelector('input[name="hasSpouse"]:checked');
        const hasChildrenRadio = document.querySelector('input[name="hasChildren"]:checked');
        const hasParentsRadio = document.querySelector('input[name="hasParents"]:checked');
        const hasSiblingsRadio = document.querySelector('input[name="hasSiblings"]:checked');
        const hasBeneficiariesRadio = document.querySelector('input[name="hasBeneficiaries"]:checked');

        if (!hasSpouseRadio) {
            this.showError('Please specify if you have a spouse or partner');
            return false;
        }

        if (!hasChildrenRadio) {
            this.showError('Please specify if you have children');
            return false;
        }

        if (!hasParentsRadio) {
            this.showError('Please specify if you have living parents');
            return false;
        }

        if (!hasSiblingsRadio) {
            this.showError('Please specify if you have siblings');
            return false;
        }

        if (!hasBeneficiariesRadio) {
            this.showError('Please specify if you have beneficiaries');
            return false;
        }

        // Validate that forms exist for selected family members
        if (hasSpouseRadio && hasSpouseRadio.value === 'true') {
            const spouseFirstName = document.getElementById('spouseFirstName');
            const spouseLastName = document.getElementById('spouseLastName');
            if (!spouseFirstName || !spouseLastName || !spouseFirstName.value.trim() || !spouseLastName.value.trim()) {
                this.showError('Please provide spouse information since you indicated you have a spouse');
                return false;
            }
        }

        if (hasChildrenRadio && hasChildrenRadio.value === 'true') {
            const childrenForms = document.querySelectorAll('#childrenContainer .family-member-item');
            if (childrenForms.length === 0) {
                this.showError('Please add at least one child since you indicated you have children. Click "Add Child" button.');
                return false;
            }
            // Validate that all children have required fields
            let hasValidChild = false;
            childrenForms.forEach((child, index) => {
                const firstName = child.querySelector(`[name="children[${index}].firstName"]`);
                const lastName = child.querySelector(`[name="children[${index}].lastName"]`);
                const relationship = child.querySelector(`[name="children[${index}].relationship"]`);
                if (firstName && lastName && relationship && firstName.value.trim() && lastName.value.trim() && relationship.value) {
                    hasValidChild = true;
                }
            });
            if (!hasValidChild) {
                this.showError('Please provide complete information for at least one child');
                return false;
            }
        }

        if (hasParentsRadio && hasParentsRadio.value === 'true') {
            const parentsForms = document.querySelectorAll('#parentsContainer .family-member-item');
            if (parentsForms.length === 0) {
                this.showError('Please add at least one parent since you indicated you have living parents. Click "Add Parent" button.');
                return false;
            }
            // Validate that all parents have required fields
            let hasValidParent = false;
            parentsForms.forEach((parent, index) => {
                const firstName = parent.querySelector(`[name="parents[${index}].firstName"]`);
                const lastName = parent.querySelector(`[name="parents[${index}].lastName"]`);
                const relationship = parent.querySelector(`[name="parents[${index}].relationship"]`);
                if (firstName && lastName && relationship && firstName.value.trim() && lastName.value.trim() && relationship.value) {
                    hasValidParent = true;
                }
            });
            if (!hasValidParent) {
                this.showError('Please provide complete information for at least one parent');
                return false;
            }
        }

        if (hasSiblingsRadio && hasSiblingsRadio.value === 'true') {
            const siblingsForms = document.querySelectorAll('#siblingsContainer .family-member-item');
            if (siblingsForms.length === 0) {
                this.showError('Please add at least one sibling since you indicated you have siblings. Click "Add Sibling" button.');
                return false;
            }
            // Validate that all siblings have required fields
            let hasValidSibling = false;
            siblingsForms.forEach((sibling, index) => {
                const firstName = sibling.querySelector(`[name="siblings[${index}].firstName"]`);
                const lastName = sibling.querySelector(`[name="siblings[${index}].lastName"]`);
                const relationship = sibling.querySelector(`[name="siblings[${index}].relationship"]`);
                if (firstName && lastName && relationship && firstName.value.trim() && lastName.value.trim() && relationship.value) {
                    hasValidSibling = true;
                }
            });
            if (!hasValidSibling) {
                this.showError('Please provide complete information for at least one sibling');
                return false;
            }
        }

        if (hasBeneficiariesRadio && hasBeneficiariesRadio.value === 'true') {
            const beneficiariesForms = document.querySelectorAll('#beneficiariesContainer .beneficiary-item');
            if (beneficiariesForms.length === 0) {
                this.showError('Please add at least one beneficiary since you indicated you have beneficiaries. Click "Add Beneficiary" button.');
                return false;
            }
            
            // Validate percentage sum
            let total = 0;
            let hasValidBeneficiary = false;
            
            beneficiariesForms.forEach((beneficiary, index) => {
                const name = beneficiary.querySelector(`[name="beneficiaries[${index}].name"]`);
                const phone = beneficiary.querySelector(`[name="beneficiaries[${index}].phone"]`);
                const percentage = beneficiary.querySelector(`[name="beneficiaries[${index}].beneficiaryPercentage"]`);
                
                if (name && phone && percentage && name.value.trim() && phone.value.trim() && percentage.value) {
                    hasValidBeneficiary = true;
                    total += parseInt(percentage.value) || 0;
                }
            });
            
            if (!hasValidBeneficiary) {
                this.showError('Please provide complete information for at least one beneficiary');
                return false;
            }
            
            if (total !== 100) {
                this.showError('Beneficiary percentages must sum to exactly 100%');
                return false;
            }
        }

        return true;
    }

    collectFormData() {
        // Collect basic required fields with null checks
        const firstNameEl = document.getElementById('firstName');
        const lastNameEl = document.getElementById('lastName');
        const emailEl = document.getElementById('email');
        const phoneEl = document.getElementById('phone');
        const passwordEl = document.getElementById('password');
        
        if (!firstNameEl || !lastNameEl || !emailEl || !phoneEl || !passwordEl) {
            console.error('Missing required form elements:', {
                firstName: !!firstNameEl,
                lastName: !!lastNameEl,
                email: !!emailEl,
                phone: !!phoneEl,
                password: !!passwordEl
            });
            throw new Error('Required form elements are missing');
        }

        const formData = {
            firstName: firstNameEl.value.trim(),
            lastName: lastNameEl.value.trim(),
            email: emailEl.value.trim(),
            phone: phoneEl.value.trim(),
            password: passwordEl.value
        };

        // Collect personal information with null check
        const dateOfBirthEl = document.getElementById('dateOfBirth');
        if (dateOfBirthEl && dateOfBirthEl.value) {
            formData.dateOfBirth = dateOfBirthEl.value;
        }

        // Collect home address with null checks
        const homeAddressStreetEl = document.getElementById('homeAddressStreet');
        const homeAddressCityEl = document.getElementById('homeAddressCity');
        const homeAddressStateEl = document.getElementById('homeAddressState');
        const homeAddressPostalCodeEl = document.getElementById('homeAddressPostalCode');
        const homeAddressCountryEl = document.getElementById('homeAddressCountry');
        
        const homeAddress = {
            street: homeAddressStreetEl ? homeAddressStreetEl.value.trim() : '',
            city: homeAddressCityEl ? homeAddressCityEl.value.trim() : '',
            state: homeAddressStateEl ? homeAddressStateEl.value.trim() : '',
            postalCode: homeAddressPostalCodeEl ? homeAddressPostalCodeEl.value.trim() : '',
            country: homeAddressCountryEl ? homeAddressCountryEl.value.trim() : ''
        };

        // Only include home address if at least one field is filled
        if (Object.values(homeAddress).some(value => value)) {
            formData.homeAddress = homeAddress;
        }

        // Collect family flags
        const hasSpouseRadio = document.querySelector('input[name="hasSpouse"]:checked');
        const hasChildrenRadio = document.querySelector('input[name="hasChildren"]:checked');
        const hasParentsRadio = document.querySelector('input[name="hasParents"]:checked');
        const hasSiblingsRadio = document.querySelector('input[name="hasSiblings"]:checked');
        const hasBeneficiariesRadio = document.querySelector('input[name="hasBeneficiaries"]:checked');

        formData.hasSpouse = hasSpouseRadio ? hasSpouseRadio.value === 'true' : false;
        formData.hasChildren = hasChildrenRadio ? hasChildrenRadio.value === 'true' : false;
        formData.hasParents = hasParentsRadio ? hasParentsRadio.value === 'true' : false;
        formData.hasSiblings = hasSiblingsRadio ? hasSiblingsRadio.value === 'true' : false;
        formData.hasBeneficiaries = hasBeneficiariesRadio ? hasBeneficiariesRadio.value === 'true' : false;

        // Collect spouse data only if hasSpouse is true
        if (formData.hasSpouse) {
            const spouseFirstNameEl = document.getElementById('spouseFirstName');
            const spouseLastNameEl = document.getElementById('spouseLastName');
            const spouseDateOfBirthEl = document.getElementById('spouseDateOfBirth');
            const spousePhoneEl = document.getElementById('spousePhone');
            const spouseRelationshipEl = document.getElementById('spouseRelationship');
            const spouseNotesEl = document.getElementById('spouseNotes');
            
            if (!spouseFirstNameEl || !spouseLastNameEl) {
                console.error('Missing spouse form elements when hasSpouse is true');
                throw new Error('Spouse form elements are missing');
            }
            
            formData.spouse = {
                firstName: spouseFirstNameEl.value.trim(),
                lastName: spouseLastNameEl.value.trim(),
                dateOfBirth: spouseDateOfBirthEl ? spouseDateOfBirthEl.value : '',
                phone: spousePhoneEl ? spousePhoneEl.value.trim() : '',
                relationship: spouseRelationshipEl ? spouseRelationshipEl.value || 'spouse' : 'spouse',
                notes: spouseNotesEl ? spouseNotesEl.value.trim() : ''
            };
        }

        // Always initialize family arrays to ensure backend compatibility
        formData.children = [];
        formData.parents = [];
        formData.siblings = [];
        formData.beneficiaries = [];
        
        // Collect children data only if hasChildren is true
        if (formData.hasChildren) {
            const childrenInputs = document.querySelectorAll('#childrenContainer .family-member-item');
            childrenInputs.forEach((child, index) => {
                const firstNameInput = child.querySelector(`[name="children[${index}].firstName"]`);
                const lastNameInput = child.querySelector(`[name="children[${index}].lastName"]`);
                const dateOfBirthInput = child.querySelector(`[name="children[${index}].dateOfBirth"]`);
                const relationshipInput = child.querySelector(`[name="children[${index}].relationship"]`);
                const notesInput = child.querySelector(`[name="children[${index}].notes"]`);
                
                if (firstNameInput && lastNameInput && relationshipInput && notesInput && dateOfBirthInput) {
                    const firstName = firstNameInput.value.trim();
                    const lastName = lastNameInput.value.trim();
                    const dateOfBirth = dateOfBirthInput.value;
                    const relationship = relationshipInput.value;
                    const notes = notesInput.value.trim();
                    
                    if (firstName && lastName && relationship) {
                        formData.children.push({
                            firstName,
                            lastName,
                            dateOfBirth,
                            relationship,
                            notes
                        });
                    }
                } else {
                    console.warn('Missing child input elements:', {
                        firstNameInput: !!firstNameInput,
                        lastNameInput: !!lastNameInput,
                        dateOfBirthInput: !!dateOfBirthInput,
                        relationshipInput: !!relationshipInput,
                        notesInput: !!notesInput
                    });
                }
            });
        }

        // Collect parents data only if hasParents is true
        if (formData.hasParents) {
            const parentsInputs = document.querySelectorAll('#parentsContainer .family-member-item');
            parentsInputs.forEach((parent, index) => {
                const firstNameInput = parent.querySelector(`[name="parents[${index}].firstName"]`);
                const lastNameInput = parent.querySelector(`[name="parents[${index}].lastName"]`);
                const relationshipInput = parent.querySelector(`[name="parents[${index}].relationship"]`);
                const notesInput = parent.querySelector(`[name="parents[${index}].notes"]`);
                
                if (firstNameInput && lastNameInput && relationshipInput && notesInput) {
                    const firstName = firstNameInput.value.trim();
                    const lastName = lastNameInput.value.trim();
                    const relationship = relationshipInput.value;
                    const notes = notesInput.value.trim();
                    
                    if (firstName && lastName && relationship) {
                        formData.parents.push({
                            firstName,
                            lastName,
                            relationship,
                            notes
                        });
                    }
                } else {
                    console.warn('Missing parent input elements:', {
                        firstNameInput: !!firstNameInput,
                        lastNameInput: !!lastNameInput,
                        relationshipInput: !!relationshipInput,
                        notesInput: !!notesInput
                    });
                }
            });
        }

        // Collect siblings data only if hasSiblings is true
        if (formData.hasSiblings) {
            const siblingsInputs = document.querySelectorAll('#siblingsContainer .family-member-item');
            siblingsInputs.forEach((sibling, index) => {
                const firstNameInput = sibling.querySelector(`[name="siblings[${index}].firstName"]`);
                const lastNameInput = sibling.querySelector(`[name="siblings[${index}].lastName"]`);
                const relationshipInput = sibling.querySelector(`[name="siblings[${index}].relationship"]`);
                const notesInput = sibling.querySelector(`[name="siblings[${index}].notes"]`);
                
                if (firstNameInput && lastNameInput && relationshipInput && notesInput) {
                    const firstName = firstNameInput.value.trim();
                    const lastName = lastNameInput.value.trim();
                    const relationship = relationshipInput.value;
                    const notes = notesInput.value.trim();
                    
                    if (firstName && lastName && relationship) {
                        formData.siblings.push({
                            firstName,
                            lastName,
                            relationship,
                            notes
                        });
                    }
                } else {
                    console.warn('Missing sibling input elements:', {
                        firstNameInput: !!firstNameInput,
                        lastNameInput: !!lastNameInput,
                        relationshipInput: !!relationshipInput,
                        notesInput: !!notesInput
                    });
                }
            });
        }

        // Collect beneficiaries data only if hasBeneficiaries is true
        if (formData.hasBeneficiaries) {
            const beneficiariesInputs = document.querySelectorAll('#beneficiariesContainer .beneficiary-item');
            beneficiariesInputs.forEach((beneficiary, index) => {
                const nameInput = beneficiary.querySelector(`[name="beneficiaries[${index}].name"]`);
                const phoneInput = beneficiary.querySelector(`[name="beneficiaries[${index}].phone"]`);
                const percentageInput = beneficiary.querySelector(`[name="beneficiaries[${index}].beneficiaryPercentage"]`);
                
                if (nameInput && phoneInput && percentageInput) {
                    const name = nameInput.value.trim();
                    const phone = phoneInput.value.trim();
                    const beneficiaryPercentage = parseInt(percentageInput.value) || 0;
                    
                    if (name && phone && beneficiaryPercentage) {
                        formData.beneficiaries.push({
                            name,
                            phone,
                            beneficiaryPercentage
                        });
                    }
                } else {
                    console.warn('Missing beneficiary input elements:', {
                        nameInput: !!nameInput,
                        phoneInput: !!phoneInput,
                        percentageInput: !!percentageInput
                    });
                }
            });
        }

        // Final validation to ensure data integrity
        console.log('Collected form data:', {
            hasSpouse: formData.hasSpouse,
            hasChildren: formData.hasChildren,
            hasParents: formData.hasParents,
            hasSiblings: formData.hasSiblings,
            hasBeneficiaries: formData.hasBeneficiaries,
            spouseData: formData.spouse ? 'present' : 'absent',
            childrenCount: formData.children.length,
            parentsCount: formData.parents.length,
            siblingsCount: formData.siblings.length,
            beneficiariesCount: formData.beneficiaries.length
        });
        
        // Ensure boolean flags match data presence
        if (formData.hasSpouse && !formData.spouse) {
            console.warn('hasSpouse is true but spouse data is missing');
        }
        if (formData.hasChildren && formData.children.length === 0) {
            console.warn('hasChildren is true but children array is empty');
        }
        if (formData.hasParents && formData.parents.length === 0) {
            console.warn('hasParents is true but parents array is empty');
        }
        if (formData.hasSiblings && formData.siblings.length === 0) {
            console.warn('hasSiblings is true but siblings array is empty');
        }
        if (formData.hasBeneficiaries && formData.beneficiaries.length === 0) {
            console.warn('hasBeneficiaries is true but beneficiaries array is empty');
        }

        return formData;
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.hideMessages();

        if (!this.validatePersonalInfo()) {
            return;
        }

        if (!this.validateFamilyInfo()) {
            return;
        }

        this.setLoading(true);

        try {
            let formData;
            try {
                formData = this.collectFormData();
                console.log('Submitting registration data:', formData);
            } catch (dataError) {
                console.error('Form data collection error:', dataError);
                this.showError(`Form validation error: ${dataError.message}. Please check all required fields are filled.`);
                this.setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            console.log('Registration response status:', response.status);
            console.log('Registration response headers:', response.headers.get('content-type'));

            let data;
            try {
                data = await response.json();
                console.log('Registration response data:', data);
            } catch (jsonError) {
                console.error('Failed to parse JSON response:', jsonError);
                const textResponse = await response.text();
                console.error('Raw response:', textResponse);
                this.showError(`Server error (${response.status}): Unable to parse response. Check console for details.`);
                this.setLoading(false);
                return;
            }

            if (response.ok) {
                this.updateStepIndicator(2);
                this.showSuccess('Registration initiated! Please check your email for a verification code.');
                
                // Redirect to verification page with email
                setTimeout(() => {
                    window.location.href = `verify-email.html?email=${encodeURIComponent(formData.email)}`;
                }, 2000);
            } else {
                // Enhanced error handling with specific guidance
                if (response.status === 400) {
                    // Validation errors
                    if (data.errors && Array.isArray(data.errors)) {
                        const errorMessages = data.errors.map(err => `• ${err.path || 'Field'}: ${err.msg}`).join('\n');
                        this.showError(`Please fix the following validation errors:\n${errorMessages}`);
                    } else if (data.message) {
                        if (data.message.includes('email')) {
                            this.showError(`Email error: ${data.message}. Please check your email address and try again.`);
                        } else if (data.message.includes('password')) {
                            this.showError(`Password error: ${data.message}. Please check your password requirements.`);
                        } else if (data.message.includes('phone')) {
                            this.showError(`Phone error: ${data.message}. Please check your phone number format.`);
                        } else {
                            this.showError(`Validation error: ${data.message}`);
                        }
                    } else {
                        this.showError('Invalid form data. Please check all fields and try again.');
                    }
                } else if (response.status === 409) {
                    // Conflict - likely duplicate email
                    this.showError('An account with this email already exists. Please use a different email or try logging in.');
                } else if (response.status === 500) {
                    // Server error
                    this.showError('Server error occurred. Please try again in a few moments. If the problem persists, contact support.');
                } else if (response.status === 413) {
                    // Payload too large
                    this.showError('Registration data is too large. Please reduce the amount of information or contact support.');
                } else {
                    // Generic error for other status codes
                    this.showError(data.message || `Registration failed (Error ${response.status}). Please try again or contact support if the issue persists.`);
                }
                this.setLoading(false);
            }
        } catch (error) {
            console.error('Registration network error:', error);
            
            // Enhanced network error handling
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showError('Cannot connect to server. Please check:\n• Is the backend server running?\n• Check your internet connection\n• Try refreshing the page');
            } else if (error.name === 'AbortError') {
                this.showError('Request timed out. Please check your connection and try again.');
            } else if (error.message.includes('JSON')) {
                this.showError('Server response error. Please try again or contact support if the issue persists.');
            } else if (error.message.includes('CORS')) {
                this.showError('Cross-origin request blocked. Please contact support.');
            } else {
                this.showError(`Network error: ${error.message}. Please check your connection and try again.`);
            }
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

// Beneficiaries functionality
function toggleBeneficiariesDetails(hasBeneficiaries) {
    const beneficiariesDetails = document.getElementById('beneficiariesDetails');
    const beneficiariesContainer = document.getElementById('beneficiariesContainer');
    
    if (hasBeneficiaries) {
        beneficiariesDetails.style.display = 'block';
        // Add first beneficiary if none exist
        if (beneficiariesContainer.children.length === 0) {
            addBeneficiary();
        }
    } else {
        beneficiariesDetails.style.display = 'none';
        // Clear all beneficiaries
        beneficiariesContainer.innerHTML = '';
        registrationForm.beneficiariesCount = 0;
        updatePercentageTotal();
    }
}

function addBeneficiary() {
    if (registrationForm.beneficiariesCount >= 3) {
        alert('Maximum 3 beneficiaries allowed');
        return;
    }

    const container = document.getElementById('beneficiariesContainer');
    const index = registrationForm.beneficiariesCount;
    
    const beneficiaryHTML = `
        <div class="beneficiary-item" id="beneficiary-${index}">
            <div class="beneficiary-header">
                <div class="beneficiary-title">Beneficiary ${index + 1}</div>
                <button type="button" class="remove-beneficiary-btn" onclick="removeBeneficiary(${index})">Remove</button>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="beneficiaryName-${index}">Full Name <span class="required">*</span></label>
                    <input type="text" id="beneficiaryName-${index}" name="beneficiaries[${index}].name" required maxlength="100">
                </div>
                <div class="form-group">
                    <label for="beneficiaryPhone-${index}">Phone Number <span class="required">*</span></label>
                    <input type="tel" id="beneficiaryPhone-${index}" name="beneficiaries[${index}].phone" required placeholder="+15551234567">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="beneficiaryPercentage-${index}">Beneficiary Percentage (%) <span class="required">*</span></label>
                    <input type="number" id="beneficiaryPercentage-${index}" name="beneficiaries[${index}].beneficiaryPercentage" 
                           required min="1" max="100" step="1" onchange="updatePercentageTotal()">
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', beneficiaryHTML);
    registrationForm.beneficiariesCount++;
    
    // Hide add button if maximum reached
    if (registrationForm.beneficiariesCount >= 3) {
        document.getElementById('addBeneficiaryBtn').style.display = 'none';
    }
    
    updatePercentageTotal();
}

function removeBeneficiary(index) {
    const beneficiary = document.getElementById(`beneficiary-${index}`);
    if (beneficiary) {
        beneficiary.remove();
        registrationForm.beneficiariesCount--;
        
        // Show add button if below maximum
        document.getElementById('addBeneficiaryBtn').style.display = 'inline-block';
        
        // Re-index remaining beneficiaries
        const container = document.getElementById('beneficiariesContainer');
        const remainingBeneficiaries = container.querySelectorAll('.beneficiary-item');
        
        remainingBeneficiaries.forEach((item, newIndex) => {
            item.id = `beneficiary-${newIndex}`;
            item.querySelector('.beneficiary-title').textContent = `Beneficiary ${newIndex + 1}`;
            item.querySelector('.remove-beneficiary-btn').setAttribute('onclick', `removeBeneficiary(${newIndex})`);
            
            // Update form field names and IDs
            const inputs = item.querySelectorAll('input');
            inputs.forEach(input => {
                const name = input.getAttribute('name');
                const id = input.getAttribute('id');
                
                if (name && name.includes('beneficiaries[')) {
                    const newName = name.replace(/beneficiaries\[\d+\]/, `beneficiaries[${newIndex}]`);
                    input.setAttribute('name', newName);
                }
                
                if (id && id.includes('-')) {
                    const baseName = id.split('-')[0];
                    input.setAttribute('id', `${baseName}-${newIndex}`);
                    const label = item.querySelector(`label[for="${id}"]`);
                    if (label) {
                        label.setAttribute('for', `${baseName}-${newIndex}`);
                    }
                }
            });
        });
        
        // Reset the count to match actual number
        registrationForm.beneficiariesCount = remainingBeneficiaries.length;
        updatePercentageTotal();
    }
}

function updatePercentageTotal() {
    const percentageInputs = document.querySelectorAll('input[name*="beneficiaryPercentage"]');
    let total = 0;
    
    percentageInputs.forEach(input => {
        const value = parseInt(input.value) || 0;
        total += value;
    });
    
    const totalElement = document.getElementById('totalPercentage');
    const totalContainer = totalElement.parentElement;
    
    totalElement.textContent = total;
    
    // Update styling based on total
    totalContainer.classList.remove('valid', 'invalid');
    if (total === 100) {
        totalContainer.classList.add('valid');
    } else if (total > 0) {
        totalContainer.classList.add('invalid');
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