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

// Initialize Bootstrap Modal
document.addEventListener('DOMContentLoaded', function() {
    const modalElement = document.getElementById('reservationModal');
    if (modalElement) {
        reservationModal = new bootstrap.Modal(modalElement);
        console.log('Modal initialized successfully');
    } else {
        console.error('Modal element not found');
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
}

// Authentication Functions
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        if (authSection) authSection.classList.add('d-none');
        if (mainContent) mainContent.classList.remove('d-none');
        if (logoutItem) logoutItem.classList.remove('d-none');
        if (heroSection) heroSection.classList.add('d-none');
        loadTables();
        loadReservations();
    } else {
        if (authSection) authSection.classList.remove('d-none');
        if (mainContent) mainContent.classList.add('d-none');
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
            throw new Error('Login failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        checkAuth();
        showAlert('Login successful!', 'success');
    } catch (error) {
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
    checkAuth();
    showAlert('Logged out successfully', 'success');
}

// Table Functions
async function handleAddTable(e) {
    e.preventDefault();
    const number = document.getElementById('tableNumber').value;
    const seats = document.getElementById('tableSeats').value;
    const location = document.getElementById('tableLocation').value;

    try {
        const response = await fetch(`${API_URL}/tables`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ number, seats, location })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to add table');
        }

        e.target.reset();
        loadTables();
    } catch (error) {
        alert('Failed to add table: ' + error.message);
    }
}

async function loadTables() {
    try {
        const response = await fetch(`${API_URL}/tables`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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

                        ${table.isAvailable ? `
                            <button class="btn btn-primary reserve-btn" data-table-id="${table.id}">
                                <i class="fas fa-calendar-plus"></i> Reserve Now
                            </button>
                        ` : ''}
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
    }
}

// Reservation Functions
async function handleReservationSubmit(e) {
    e.preventDefault();
    const date = document.getElementById('reservationDate').value;
    const time = document.getElementById('reservationTime').value;
    const guests = document.getElementById('numberOfGuests').value;

    try {
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                tableId: selectedTableId,
                date,
                time,
                numberOfGuests: parseInt(guests)
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to create reservation');
        }

        reservationModal.hide();
        reservationForm.reset();
        loadTables();
        loadReservations();
        showAlert('Reservation created successfully!', 'success');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function loadReservations() {
    try {
        console.log('Loading reservations...');
        const token = localStorage.getItem('token');
        console.log('Token:', token ? 'exists' : 'missing');

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
            return `
                <div class="card reservation-card reservation-${status.toLowerCase()}">
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="fas fa-calendar-alt"></i> Reservation #${reservation.id}
                        </h5>
                        <p class="card-text">
                            <i class="fas fa-chair"></i> Table ${reservation.table?.number || 'N/A'}<br>
                            <i class="fas fa-users"></i> ${reservation.numberOfGuests} guests<br>
                            <i class="fas fa-clock"></i> ${new Date(reservation.date).toLocaleDateString()} at ${reservation.time}<br>
                            <i class="fas fa-info-circle"></i> Status: ${status}
                        </p>
                        ${status === 'Pending' ? `
                            <button class="btn btn-danger" onclick="cancelReservation(${reservation.id})">
                                <i class="fas fa-times"></i> Cancel
                            </button>
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
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
        console.log('Cancelling reservation:', reservationId);
        const response = await fetch(`${API_URL}/reservations/${reservationId}/cancel`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Failed to cancel reservation:', error);
            throw new Error('Failed to cancel reservation');
        }

        console.log('Reservation cancelled successfully');
        // Оновлюємо обидва списки
        await Promise.all([
            loadReservations(),
            loadTables()
        ]);
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        alert('Failed to cancel reservation: ' + error.message);
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
    navTabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-target="${tab}"]`).classList.add('active');
    
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.add('d-none'));
    document.getElementById(tab).classList.remove('d-none');
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.container').firstChild);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Initialize
if (localStorage.getItem('token')) {
    loadTables();
    loadReservations();
} 