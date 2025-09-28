document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (AuthService.isLoggedIn()) {
        const user = AuthService.getUser();
        if (user && user.role === 'admin') {
            showDashboard();
        } else {
            // Not an admin user, redirect to login with admin role
            AuthService.logout();
            window.location.href = '../login.html?role=admin';
        }
    } else {
        // Not logged in, redirect to login with admin role
        window.location.href = '../login.html?role=admin';
    }

    // Logout is now handled by the navbar component

    // Payment request form handler
    document.getElementById('payment-request-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError('payment-request-error');
        hideError('payment-request-success');

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const stripePaymentLinkUrl = document.getElementById('payment-link-url').value;

        // Validate Stripe payment link URL format
        if (!stripePaymentLinkUrl.startsWith('https://buy.stripe.com/')) {
            showError('payment-request-error', 'Please enter a valid Stripe payment link URL (https://buy.stripe.com/...)');
            return;
        }

        try {
            const response = await AuthService.makeRequest('/payments/admin/create-payment-request', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    description,
                    stripePaymentLinkUrl
                })
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess('payment-request-success', 'Payment request created successfully!');
                document.getElementById('payment-request-form').reset();
                loadPaymentRequests(); // Reload the list
                
                // Set up periodic refresh to show payment updates
                setInterval(() => {
                    console.log('Auto-refreshing payment requests...');
                    loadPaymentRequests();
                }, 30000); // Refresh every 30 seconds
            } else {
                showError('payment-request-error', data.message || 'Failed to create payment request');
            }
        } catch (error) {
            showError('payment-request-error', 'Network error. Please try again.');
        }
    });
});

function showDashboard() {
    try {
        console.log('showDashboard() called');
        const user = AuthService.getUser();
        console.log('User data:', user);
        
        if (!user) {
            console.error('No user data found');
            AuthService.logout();
            return;
        }
        
        // Update navbar with user information (navbar is auto-injected via data-navbar attribute)
        const userNameElement = document.querySelector('.navbar-user, .mobile-user');
        if (userNameElement) {
            userNameElement.textContent = `${user.firstName} ${user.lastName}`;
        }
        
        loadPaymentRequests();
    } catch (error) {
        console.error('Error in showDashboard:', error);
        alert('Error loading dashboard: ' + error.message);
    }
}

async function loadPaymentRequests() {
    try {
        console.log('loadPaymentRequests() called');
        const loadingElement = document.getElementById('loading');
        const listElement = document.getElementById('payment-requests-list');
        
        if (!loadingElement || !listElement) {
            console.error('Loading or list elements not found');
            return;
        }
        
        loadingElement.style.display = 'block';
        listElement.innerHTML = '';

        console.log('Making request to /payments/admin/payment-requests');
        const response = await AuthService.makeRequest('/payments/admin/payment-requests');
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);

        loadingElement.style.display = 'none';

        if (response.ok) {
            if (data.paymentRequests.length === 0) {
                listElement.innerHTML = '<p class="no-data">No payment requests found.</p>';
                console.log('No payment requests found');
            } else {
                listElement.innerHTML = data.paymentRequests.map(request => createPaymentRequestHTML(request)).join('');
                console.log('Loaded', data.paymentRequests.length, 'payment requests');
            }
        } else {
            console.error('Failed to load payment requests:', response.status, data);
            listElement.innerHTML = '<p class="error">Failed to load payment requests.</p>';
        }
    } catch (error) {
        console.error('Error in loadPaymentRequests:', error);
        const loadingElement = document.getElementById('loading');
        const listElement = document.getElementById('payment-requests-list');
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (listElement) listElement.innerHTML = '<p class="error">Network error. Please try again.</p>';
    }
}

function createPaymentRequestHTML(request) {
    const progress = request.totalMembers > 0 ? (request.paidMembers / request.totalMembers) * 100 : 0;
    const statusClass = `status-${request.status}`;
    
    return `
        <div class="payment-request-item">
            <div class="payment-request-header">
                <div>
                    <div class="payment-request-title">${request.title}</div>
                    <div class="payment-request-meta">
                        Created: ${formatDate(request.createdAt)} | 
                        Due: ${formatDate(request.dueDate)}
                    </div>
                </div>
                <span class="status-badge ${statusClass}">${request.status}</span>
            </div>
            
            <div class="payment-request-description">${request.description}</div>
            
            <div class="payment-request-stats">
                <div class="stat-item">
                    <div class="stat-value">${request.paidMembers} / ${request.totalMembers}</div>
                    <div class="stat-label">Members Paid</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">
                        <a href="${request.stripePaymentLinkUrl}" target="_blank" class="payment-link">
                            View Payment Link
                        </a>
                    </div>
                    <div class="stat-label">Stripe Link</div>
                </div>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            
            <div style="margin-top: 15px;">
                <button onclick="viewPaymentDetails('${request._id}')" class="btn btn-success">
                    View Details
                </button>
                <button onclick="generateSpreadsheet('${request._id}')" class="btn btn-primary" style="margin-left: 10px;">
                    Generate Spreadsheet
                </button>
            </div>
        </div>
    `;
}

async function viewPaymentDetails(paymentRequestId) {
    try {
        const response = await AuthService.makeRequest(`/payments/admin/payment-requests/${paymentRequestId}/details`);
        const data = await response.json();

        if (response.ok) {
            showPaymentDetailsModal(data.paymentRequest, data.payments);
        } else {
            alert('Failed to load payment details');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

function showPaymentDetailsModal(paymentRequest, payments) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${paymentRequest.title} - Payment Details</h3>
                <button onclick="closeModal()" class="btn btn-secondary">Close</button>
            </div>
            <div class="modal-body">
                <div class="payments-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Email</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payments.map(payment => `
                                <tr>
                                    <td>${payment.user.firstName} ${payment.user.lastName}</td>
                                    <td>${payment.user.email}</td>
                                    <td>${formatCurrency(payment.amount)}</td>
                                    <td><span class="status-badge status-${payment.status}">${payment.status}</span></td>
                                    <td>${formatDate(payment.createdAt)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            background: white;
            border-radius: 10px;
            max-width: 800px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-body {
            padding: 20px;
        }
        .payments-table table {
            width: 100%;
            border-collapse: collapse;
        }
        .payments-table th,
        .payments-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .payments-table th {
            background: #f8f9fa;
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);

    window.closeModal = function() {
        document.body.removeChild(modal);
        document.head.removeChild(style);
        delete window.closeModal;
    };
}

async function generateSpreadsheet(paymentRequestId) {
    // Find the button that was clicked
    const button = event ? event.target : document.querySelector(`button[onclick="generateSpreadsheet('${paymentRequestId}')"]`);
    
    try {
        // Show loading state
        if (button) {
            button.textContent = 'Generating...';
            button.disabled = true;
        }

        const response = await AuthService.makeRequest(`/payments/admin/payment-requests/${paymentRequestId}/export-spreadsheet`);
        const data = await response.json();

        if (response.ok) {
            // Create Excel file
            const workbook = createExcelWorkbook(data);
            
            // Create and trigger download
            downloadExcel(workbook, `payment-request-${data.paymentRequest.title.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx`);
        } else {
            alert('Failed to generate spreadsheet: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Generate spreadsheet error:', error);
        alert('Network error. Please try again.');
    } finally {
        // Restore button state
        if (button) {
            button.textContent = 'Generate Spreadsheet';
            button.disabled = false;
        }
    }
}

function createExcelWorkbook(data) {
    const { paymentRequest, generatedAt, totalMembers, paidMembers, data: memberData } = data;
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare data for the worksheet
    const worksheetData = [];
    
    // Add header information (metadata)
    worksheetData.push(['Payment Request Report']);
    worksheetData.push(['Title:', paymentRequest.title]);
    worksheetData.push(['Description:', paymentRequest.description]);
    worksheetData.push(['Generated on:', formatDate(generatedAt)]);
    worksheetData.push(['Total Members:', totalMembers]);
    worksheetData.push(['Paid Members:', paidMembers]);
    worksheetData.push([]); // Empty row separator
    
    // Add column headers
    worksheetData.push(['Member Name', 'Email', 'Amount', 'Payment Date', 'Payment Status']);
    
    // Add member data
    memberData.forEach(member => {
        const amount = member.amount ? formatCurrency(member.amount) : '-';
        const paymentDate = member.paymentDate ? formatDate(member.paymentDate) : '-';
        
        worksheetData.push([
            member.memberName,
            member.email,
            amount,
            paymentDate,
            member.paymentStatus
        ]);
    });
    
    // Create worksheet from data
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    const columnWidths = [
        { wch: 25 }, // Member Name
        { wch: 30 }, // Email
        { wch: 15 }, // Amount
        { wch: 20 }, // Payment Date
        { wch: 15 }  // Payment Status
    ];
    worksheet['!cols'] = columnWidths;
    
    // Style the header row (row 8, which contains the column headers)
    const headerRowIndex = 7; // 0-based index for row 8
    const headerCells = ['A8', 'B8', 'C8', 'D8', 'E8'];
    
    headerCells.forEach(cellRef => {
        if (!worksheet[cellRef]) worksheet[cellRef] = {};
        worksheet[cellRef].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { bgColor: { indexed: 64 }, fgColor: { rgb: '366092' } },
            alignment: { horizontal: 'center' }
        };
    });
    
    // Style the title row (row 1)
    if (!worksheet['A1']) worksheet['A1'] = {};
    worksheet['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: '366092' } }
    };
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Report');
    
    return workbook;
}

function downloadExcel(workbook, filename) {
    try {
        // Generate Excel file buffer
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        
        // Create blob with Excel content
        const blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
        });
        
        // Create download link
        const link = document.createElement('a');
        if (link.download !== undefined) {
            // Use HTML5 download attribute
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            // Fallback for older browsers
            if (navigator.msSaveBlob) {
                navigator.msSaveBlob(blob, filename);
            } else {
                alert('Your browser does not support file downloads. Please try a different browser.');
            }
        }
    } catch (error) {
        console.error('Excel download error:', error);
        alert('Failed to generate Excel file. Please try again.');
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

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}