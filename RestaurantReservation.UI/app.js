const API_URL = 'http://localhost:5046/api';
let currentUser = null;
let reservationModal = null;

// DOM Elements
const authForms = document.getElementById('authForms');
const mainContent = document.getElementById('mainContent');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginLink = document.getElementById('loginLink');
const registerLink = document.getElementById('registerLink');
const logoutLink = document.getElementById('logoutLink');
const adminSection = document.getElementById('adminSection');
const tablesList = document.getElementById('tablesList');
const reservationsList = document.getElementById('reservationsList');
const reservationForm = document.getElementById('reservationForm');
const authTabs = document.querySelectorAll('.auth-tab');
const authFormsContainer = document.querySelectorAll('.auth-form');
const tablesContainer = document.getElementById('tablesContainer');
const reservationsContainer = document.getElementById('reservationsContainer');
const logoutBtn = document.getElementById('logoutBtn');
const authSection = document.getElementById('authSection');
const navTabs = document.querySelectorAll('.nav-tab');
const logoutItem = document.getElementById('logoutItem');
const heroSection = document.querySelector('.hero-section');

let selectedTableId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function setupEventListeners() {
    // Auth tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('data-target');
            showForm(target === 'loginForm' ? 'login' : 'register');
        });
    });

    // Auth forms
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Auth links
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForm('login');
        });
    }

    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForm('register');
        });
    }

    // Reservation form
    if (reservationForm) {
        reservationForm.addEventListener('submit', handleReservationSubmit);
    }

    // Navigation tabs
    navTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('data-target');
            switchTab(target);
        });
    });
}

// Initialize Bootstrap Modals
document.addEventListener('DOMContentLoaded', function() {
    const modalElement = document.getElementById('reservationModal');
    if (modalElement) {
        reservationModal = new bootstrap.Modal(modalElement);
        console.log('Modal initialized successfully');
    } else {
        console.error('Modal element not found');
    }

    // Initialize Add Table Modal
    const addTableForm = document.getElementById('addTableForm');
    if (addTableForm) {
        addTableForm.addEventListener('submit', handleAddTable);
    }
});

// Show/Hide Forms
function showForm(formType) {
    if (!loginForm || !registerForm) return;

    // Update active tab
    authTabs.forEach(tab => {
        if (tab.getAttribute('data-target') === (formType === 'login' ? 'loginForm' : 'registerForm')) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Show/hide forms with animation
    if (formType === 'login') {
        registerForm.classList.add('d-none');
        setTimeout(() => {
            loginForm.classList.remove('d-none');
        }, 50);
    } else {
        loginForm.classList.add('d-none');
        setTimeout(() => {
            registerForm.classList.remove('d-none');
        }, 50);
    }

    // Ensure auth section is visible
    const authSection = document.getElementById('authSection');
    if (authSection) {
        authSection.classList.remove('d-none');
    }
}

// Authentication Functions
function checkAuth() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const authSection = document.getElementById('authSection');
    const mainContent = document.getElementById('mainContent');
    const logoutItem = document.getElementById('logoutItem');
    const heroSection = document.querySelector('.hero-section');
    const addTableButton = document.querySelector('[data-bs-target="#addTableModal"]');
    const deleteButtons = document.querySelectorAll('.delete-btn');
    const reservationsTab = document.querySelector('[data-target="reservationsTab"]');
    const myReservationsTab = document.querySelector('[data-target="myReservationsTab"]');
    const reservationsHeader = document.querySelector('.reservations-header h2');
    const statusFilter = document.getElementById('reservationStatusFilter');

    if (token) {
        authSection.classList.add('d-none');
        mainContent.classList.remove('d-none');
        if (logoutItem) logoutItem.classList.remove('d-none');
        if (heroSection) heroSection.classList.add('d-none');
        
        // Show/hide admin features based on role
        const isAdmin = userRole === 'Admin';
        if (addTableButton) {
            addTableButton.style.display = isAdmin ? 'block' : 'none';
        }
        deleteButtons.forEach(btn => {
            btn.style.display = isAdmin ? 'block' : 'none';
        });

        // Show/hide reservations tabs based on user role
        if (reservationsTab) {
            if (isAdmin) {
                reservationsTab.style.display = 'block';
                myReservationsTab.style.display = 'none';
                reservationsTab.innerHTML = '<i class="fas fa-calendar-alt"></i> All Reservations';
                if (reservationsHeader) reservationsHeader.textContent = 'All Reservations';
                if (statusFilter) statusFilter.style.display = 'block';
                // Load reservations for admin
                const filterSelect = document.getElementById('reservationStatusFilter');
                const currentFilter = filterSelect ? filterSelect.value : 'all';
                loadAllReservations(currentFilter);
            } else {
                reservationsTab.style.display = 'none';
                myReservationsTab.style.display = 'block';
                // Load user's reservations
                loadUserReservations();
            }
        }
    } else {
        authSection.classList.remove('d-none');
        mainContent.classList.add('d-none');
        if (logoutItem) logoutItem.classList.add('d-none');
        if (heroSection) heroSection.classList.remove('d-none');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('http://localhost:5046/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Login error response:', {
                status: response.status,
                statusText: response.statusText,
                errorText: errorText
            });
            throw new Error('Login failed');
        }

        const data = await response.json();
        console.log('Login response data:', data);
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role);
        console.log('Stored user role:', data.role);
        
        checkAuth();
        showAlert('Login successful!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message, 'danger');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'danger');
        return;
    }

    try {
        const response = await fetch('http://localhost:5046/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        showAlert('Registration successful! Please login.', 'success');
        showForm('login');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    
    // Show auth section and hide main content
    const authSection = document.getElementById('authSection');
    const mainContent = document.getElementById('mainContent');
    const heroSection = document.querySelector('.hero-section');
    
    if (authSection) authSection.classList.remove('d-none');
    if (mainContent) mainContent.classList.add('d-none');
    if (heroSection) heroSection.classList.remove('d-none');
    
    // Show registration form by default
    showForm('register');
    
    showAlert('Logged out successfully', 'success');
}

// Table Functions
async function handleAddTable(e) {
    e.preventDefault();
    
    // Get form elements
    const numberInput = document.getElementById('tableNumber');
    const seatsInput = document.getElementById('tableSeats');
    const locationInput = document.getElementById('tableLocation');
    
    // Check if elements exist
    if (!numberInput || !seatsInput || !locationInput) {
        console.error('Form elements not found:', {
            numberInput: !!numberInput,
            seatsInput: !!seatsInput,
            locationInput: !!locationInput
        });
        showAlert('Error: Form elements not found', 'danger');
        return;
    }

    const number = numberInput.value;
    const seats = seatsInput.value;
    const location = locationInput.value;
    const token = localStorage.getItem('token');
    
    console.log('Token for add table:', token ? 'exists' : 'missing');

    try {
        const response = await fetch(`${API_URL}/tables`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                number: parseInt(number),
                seats: parseInt(seats),
                location: location
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Add table error response:', error);
            throw new Error(error || 'Failed to add table');
        }

        const result = await response.json();
        console.log('Table added successfully:', result);

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTableModal'));
        if (modal) {
            modal.hide();
        }
        e.target.reset();
        
        loadTables();
        showAlert('Table added successfully!', 'success');
    } catch (error) {
        console.error('Error adding table:', error);
        showAlert(error.message, 'danger');
    }
}

async function handleDeleteTable(tableId) {
    const token = localStorage.getItem('token');
    console.log('Token for delete table:', token ? 'exists' : 'missing');

    try {
        // First try normal delete
        const response = await fetch(`${API_URL}/tables/${tableId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Delete table error response:', errorText);
            
            if (errorText.includes('existing reservations')) {
                // Show confirmation dialog for force delete
                if (confirm('This table has active reservations. Do you want to delete it anyway? This will also delete all reservations for this table.')) {
                    // Try force delete
                    const forceResponse = await fetch(`${API_URL}/tables/${tableId}/force`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!forceResponse.ok) {
                        const forceErrorText = await forceResponse.text();
                        throw new Error(`Failed to force delete table: ${forceErrorText}`);
                    }

                    loadTables();
                    showAlert('Table and its reservations have been deleted successfully', 'success');
                    return;
                }
                return;
            }
            
            throw new Error(`Failed to delete table: ${errorText}`);
        }

        loadTables();
        showAlert('Table deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting table:', error);
        showAlert(error.message, 'danger');
    }
}

async function loadTables() {
    try {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');
        const isAdmin = userRole === 'Admin';
        console.log('Loading tables as:', isAdmin ? 'Admin' : 'User');

        const response = await fetch(`${API_URL}/tables`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load tables');

        const tables = await response.json();
        console.log('Loaded tables:', tables);
        
        tablesContainer.innerHTML = tables.map(table => `
            <div class="col-md-4">
                <div class="card table-card ${table.isAvailable ? 'table-available' : 'table-unavailable'}">
                    <div class="card-body">
                        <div class="table-header">
                            <div class="table-status ${table.isAvailable ? 'available' : 'unavailable'}">
                                <i class="fas ${table.isAvailable ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                ${table.isAvailable ? 'Available' : 'Unavailable'}
                            </div>
                            <div class="table-capacity">
                                <i class="fas fa-chair"></i>
                                ${table.seats} seats
                            </div>
                        </div>
                        
                        <div class="table-info">
                            <h5 class="card-title">Table ${table.number}</h5>
                            <div class="table-location">
                                <i class="fas fa-map-marker-alt"></i>
                                ${table.location || 'Main Hall'}
                            </div>
                        </div>

                        <div class="table-actions">
                            ${table.isAvailable ? `
                                <button class="btn btn-primary reserve-btn" data-table-id="${table.id}">
                                    <i class="fas fa-calendar-plus"></i> Reserve Now
                                </button>
                            ` : ''}
                            ${isAdmin ? `
                                <button class="btn btn-danger delete-btn" onclick="handleDeleteTable(${table.id})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners to all reserve buttons
        const reserveButtons = document.querySelectorAll('.reserve-btn');
        console.log('Found reserve buttons:', reserveButtons.length);
        
        reserveButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tableId = this.getAttribute('data-table-id');
                console.log('Button clicked for table:', tableId);
                selectedTableId = tableId;
                reservationModal.show();
            });
        });
    } catch (error) {
        console.error('Error loading tables:', error);
        showAlert('Failed to load tables', 'danger');
    }
}

// Reservation Functions
async function handleReservationSubmit(e) {
    e.preventDefault();
    const date = document.getElementById('reservationDate').value;
    const time = document.getElementById('reservationTime').value;
    const guests = document.getElementById('numberOfGuests').value;
    const comments = document.getElementById('reservationComments').value;

    try {
        console.log('Submitting reservation with comments:', comments);
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                tableId: selectedTableId,
                date,
                timeFrom: time,
                timeTo: time,
                numberOfGuests: parseInt(guests),
                comments: comments
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Reservation creation error:', error);
            throw new Error(error || 'Failed to create reservation');
        }

        const result = await response.json();
        console.log('Reservation created successfully:', result);

        reservationModal.hide();
        reservationForm.reset();
        loadTables();
        loadReservations();
        showAlert('Reservation created successfully!', 'success');
    } catch (error) {
        console.error('Error creating reservation:', error);
        showAlert(error.message, 'danger');
    }
}

async function loadReservations() {
    try {
        console.log('Loading reservations...');
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');
        console.log('Token:', token ? 'exists' : 'missing');
        console.log('User Role:', userRole);

        // If user is admin, use loadAllReservations instead
        if (userRole === 'Admin') {
            const filterSelect = document.getElementById('reservationStatusFilter');
            const currentFilter = filterSelect ? filterSelect.value : 'all';
            await loadAllReservations(currentFilter);
            return;
        }

        const response = await fetch(`${API_URL}/reservations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const error = await response.text();
            console.error('Failed to load reservations:', error);
            throw new Error('Failed to load reservations');
        }

        const reservations = await response.json();
        console.log('Loaded reservations:', reservations);
        
        if (!reservations || reservations.length === 0) {
            console.log('No reservations found');
            reservationsContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> You have no reservations yet.
                </div>
            `;
            return;
        }

        console.log('Processing reservations...');
        reservationsContainer.innerHTML = reservations.map(reservation => {
            console.log('Processing reservation:', reservation);
            const status = getReservationStatus(reservation.status);
            const statusClass = {
                'Pending': 'warning',
                'Confirmed': 'success',
                'Cancelled': 'danger'
            }[status] || 'secondary';

            return `
                <div class="card reservation-card reservation-${status.toLowerCase()}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title">
                                <i class="fas fa-calendar-alt"></i> Reservation #${reservation.id}
                            </h5>
                            <span class="badge bg-${statusClass}">${status}</span>
                        </div>
                        <div class="reservation-details">
                            <p><i class="fas fa-chair"></i> Table ${reservation.table?.number || 'N/A'}</p>
                            <p><i class="fas fa-users"></i> ${reservation.numberOfGuests} guests</p>
                            <p><i class="fas fa-clock"></i> ${new Date(reservation.date).toLocaleDateString()} at ${reservation.timeFrom}</p>
                            ${reservation.comments ? `
                                <div class="reservation-comments mt-3">
                                    <p class="mb-1"><i class="fas fa-comment"></i> Your Comments:</p>
                                    <p class="comments-text">${reservation.comments}</p>
                                </div>
                            ` : ''}
                        </div>
                        <div class="reservation-status-info mt-3">
                            ${status === 'Pending' ? `
                                <div class="alert alert-warning">
                                    <i class="fas fa-clock"></i> Your reservation is pending confirmation by the restaurant.
                                </div>
                            ` : status === 'Confirmed' ? `
                                <div class="alert alert-success">
                                    <i class="fas fa-check-circle"></i> Your reservation has been confirmed! You can come to the restaurant.
                                </div>
                            ` : `
                                <div class="alert alert-danger">
                                    <i class="fas fa-times-circle"></i> Your reservation has been cancelled by the restaurant.
                                </div>
                            `}
                        </div>
                        ${status === 'Pending' ? `
                            <div class="reservation-actions mt-3">
                                <button class="btn btn-danger" onclick="cancelReservation(${reservation.id})">
                                    <i class="fas fa-times"></i> Cancel Reservation
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading reservations:', error);
        reservationsContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> Failed to load reservations. Please try again later.
            </div>
        `;
    }
}

// Helper function to convert reservation status number to string
function getReservationStatus(status) {
    switch (status) {
        case 0:
            return 'Pending';
        case 1:
            return 'Confirmed';
        case 2:
            return 'Cancelled';
        default:
            return 'Pending';
    }
}

async function cancelReservation(reservationId) {
    try {
        const response = await fetch(`${API_URL}/reservations/${reservationId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to cancel reservation');
        }

        showAlert('Reservation cancelled successfully', 'success');
        
        // Reload both reservations and tables
        await Promise.all([
            loadUserReservations(),
            loadTables()
        ]);
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        showAlert(error.message, 'danger');
    }
}

// Auth Functions
function switchAuthForm(form) {
    authForms.forEach(f => f.classList.add('d-none'));
    document.getElementById(form).classList.remove('d-none');
    authTabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-target="${form}"]`).classList.add('active');
}

function switchTab(tab) {
    // Update active tab
    navTabs.forEach(t => {
        if (t.getAttribute('data-target') === tab) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });
    
    // Update content display
    const tabContents = document.querySelectorAll('.tab-pane');
    tabContents.forEach(content => {
        if (content.id === tab) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    // Load data for the selected tab
    if (tab === 'tablesTab') {
        loadTables();
    } else if (tab === 'reservationsTab') {
        loadAllReservations();
    } else if (tab === 'myReservationsTab') {
        loadUserReservations();
    }
}

function showAlert(message, type) {
    // Видаляємо попередні сповіщення
    const existingAlerts = document.querySelectorAll('.alert-container');
    existingAlerts.forEach(alert => alert.remove());

    // Створюємо контейнер для сповіщення
    const alertContainer = document.createElement('div');
    alertContainer.className = 'alert-container';
    
    // Створюємо сповіщення
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Додаємо сповіщення в контейнер
    alertContainer.appendChild(alertDiv);
    document.body.appendChild(alertContainer);

    // Автоматично видаляємо через 5 секунд
    setTimeout(() => {
        alertContainer.remove();
    }, 5000);
}

// Add event listener for status filter
document.getElementById('reservationStatusFilter').addEventListener('change', function(e) {
    const selectedStatus = e.target.value;
    loadAllReservations(selectedStatus);
});

// Function to load all reservations (admin only)
async function loadAllReservations(filterStatus = 'all') {
    try {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');
        
        // Only allow admin to view reservations
        if (userRole !== 'Admin') {
            console.log('User is not admin, redirecting to user view');
            await loadReservations();
            return;
        }

        console.log('Loading all reservations with filter:', filterStatus);
        const response = await fetch(`${API_URL}/reservations`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load reservations');
        }

        const reservations = await response.json();
        console.log('Loaded all reservations:', reservations);

        const container = document.getElementById('reservationsContainer');
        container.innerHTML = '';

        if (reservations.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No reservations found</div>';
            return;
        }

        // Filter reservations based on selected status
        const filteredReservations = reservations.filter(reservation => {
            const status = getReservationStatus(reservation.status);
            return filterStatus === 'all' || status.toLowerCase() === filterStatus;
        });

        console.log('Filtered reservations:', filteredReservations);

        if (filteredReservations.length === 0) {
            container.innerHTML = `<div class="alert alert-info">No ${filterStatus} reservations found</div>`;
            return;
        }

        // Create cards for filtered reservations
        filteredReservations.forEach(reservation => {
            console.log('Processing reservation:', reservation);
            const card = document.createElement('div');
            const status = getReservationStatus(reservation.status);
            const statusLower = status.toLowerCase();
            card.className = `reservation-card ${statusLower}`;
            
            const statusClass = {
                'Pending': 'warning',
                'Cancelled': 'danger'
            }[status] || 'secondary';

            const commentsHtml = reservation.comments ? `
                <div class="reservation-comments mt-3">
                    <p class="mb-1"><i class="fas fa-comment"></i> User Comments:</p>
                    <p class="comments-text">${reservation.comments}</p>
                </div>
            ` : `
                <div class="reservation-comments mt-3">
                    <p class="text-muted"><i class="fas fa-comment-slash"></i> No comments from user</p>
                </div>
            `;

            card.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="card-title">
                                <i class="fas fa-table"></i> Table ${reservation.table?.number || 'N/A'}
                            </h5>
                            <p class="card-text">
                                <i class="fas fa-user"></i> User ID: ${reservation.userId}
                            </p>
                        </div>
                        <span class="badge bg-${statusClass}">${status}</span>
                    </div>
                    <div class="reservation-details">
                        <p><i class="fas fa-calendar"></i> ${new Date(reservation.date).toLocaleDateString()}</p>
                        <p><i class="fas fa-clock"></i> ${reservation.timeFrom}</p>
                        <p><i class="fas fa-users"></i> ${reservation.numberOfGuests} guests</p>
                        ${commentsHtml}
                    </div>
                    <div class="reservation-actions mt-3">
                        ${status === 'Pending' ? `
                            <button class="btn btn-success btn-sm me-2" onclick="updateReservationStatus(${reservation.id}, 'Confirmed')">
                                <i class="fas fa-check"></i> Confirm
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="updateReservationStatus(${reservation.id}, 'Cancelled')">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading reservations:', error);
        showAlert('Failed to load reservations', 'danger');
    }
}

// Function to update reservation status
async function updateReservationStatus(reservationId, newStatus) {
    try {
        const statusValue = {
            'Confirmed': 1,
            'Cancelled': 2
        }[newStatus] || 0;

        const response = await fetch(`${API_URL}/reservations/${reservationId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: statusValue })
        });

        if (!response.ok) {
            throw new Error('Failed to update reservation status');
        }

        // If the reservation is confirmed, update the table status
        if (newStatus === 'Confirmed') {
            // Get the reservation details to find the table ID
            const reservationResponse = await fetch(`${API_URL}/reservations/${reservationId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (reservationResponse.ok) {
                const reservation = await reservationResponse.json();
                if (reservation.tableId) {
                    // Update the table status to available
                    await fetch(`${API_URL}/tables/${reservation.tableId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ isAvailable: true })
                    });
                }
            }
        }

        showAlert(`Reservation ${newStatus.toLowerCase()} successfully`, 'success');
        
        // Reload both reservations and tables
        await Promise.all([
            loadAllReservations(),
            loadTables()
        ]);
    } catch (error) {
        console.error('Error updating reservation status:', error);
        showAlert('Failed to update reservation status', 'danger');
    }
}

// Function to load user's reservations
async function loadUserReservations() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/reservations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to load reservations');
        }

        const reservations = await response.json();
        const container = document.getElementById('myReservationsContainer');
        
        if (!reservations || reservations.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> You have no reservations yet.
                </div>
            `;
            return;
        }

        container.innerHTML = reservations.map(reservation => {
            const status = getReservationStatus(reservation.status);
            const statusClass = {
                'Pending': 'warning',
                'Confirmed': 'success',
                'Cancelled': 'danger'
            }[status] || 'secondary';

            return `
                <div class="col-md-6 mb-4">
                    <div class="card reservation-card reservation-${status.toLowerCase()}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <h5 class="card-title">
                                    <i class="fas fa-calendar-alt"></i> Reservation #${reservation.id}
                                </h5>
                                <span class="badge bg-${statusClass}">${status}</span>
                            </div>
                            <div class="reservation-details">
                                <p><i class="fas fa-chair"></i> Table ${reservation.table?.number || 'N/A'}</p>
                                <p><i class="fas fa-users"></i> ${reservation.numberOfGuests} guests</p>
                                <p><i class="fas fa-clock"></i> ${new Date(reservation.date).toLocaleDateString()} at ${reservation.timeFrom}</p>
                                ${reservation.comments ? `
                                    <div class="reservation-comments mt-3">
                                        <p class="mb-1"><i class="fas fa-comment"></i> Your Comments:</p>
                                        <p class="comments-text">${reservation.comments}</p>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="reservation-status-info mt-3">
                                ${status === 'Pending' ? `
                                    <div class="alert alert-warning">
                                        <i class="fas fa-clock"></i> Your reservation is pending confirmation by the restaurant.
                                    </div>
                                ` : status === 'Confirmed' ? `
                                    <div class="alert alert-success">
                                        <i class="fas fa-check-circle"></i> Your reservation has been confirmed! You can come to the restaurant.
                                    </div>
                                ` : `
                                    <div class="alert alert-danger">
                                        <i class="fas fa-times-circle"></i> Your reservation has been cancelled by the restaurant.
                                    </div>
                                `}
                            </div>
                            ${status === 'Pending' ? `
                                <div class="reservation-actions mt-3">
                                    <button class="btn btn-danger" onclick="cancelReservation(${reservation.id})">
                                        <i class="fas fa-times"></i> Cancel Reservation
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading user reservations:', error);
        document.getElementById('myReservationsContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> Failed to load reservations. Please try again later.
            </div>
        `;
    }
}

// Initialize
if (localStorage.getItem('token')) {
    loadTables();
    loadReservations();
} 