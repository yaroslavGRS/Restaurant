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

// Event Listeners
document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
document.getElementById('addTableForm')?.addEventListener('submit', handleAddTable);
reservationForm.addEventListener('submit', handleReservationSubmit);
loginLink.addEventListener('click', () => showForm('login'));
registerLink.addEventListener('click', () => showForm('register'));
logoutLink.addEventListener('click', handleLogout);

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
    if (formType === 'login') {
        loginForm.classList.remove('d-none');
        registerForm.classList.add('d-none');
    } else {
        loginForm.classList.add('d-none');
        registerForm.classList.remove('d-none');
    }
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Login failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        currentUser = { email: data.email, role: data.role };
        updateUI();
        loadTables();
        loadReservations();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Registration failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        currentUser = { email: data.email, role: data.role };
        updateUI();
        loadTables();
        loadReservations();
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateUI();
}

// UI Update Functions
function updateUI() {
    const token = localStorage.getItem('token');
    if (token) {
        authForms.classList.add('d-none');
        mainContent.classList.remove('d-none');
        loginLink.classList.add('d-none');
        registerLink.classList.add('d-none');
        logoutLink.classList.remove('d-none');
        adminSection.classList.toggle('d-none', currentUser?.role !== 'Admin');
    } else {
        authForms.classList.remove('d-none');
        mainContent.classList.add('d-none');
        loginLink.classList.remove('d-none');
        registerLink.classList.remove('d-none');
        logoutLink.classList.add('d-none');
        adminSection.classList.add('d-none');
    }
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
        
        tablesList.innerHTML = tables.map(table => `
            <div class="col-md-4 mb-4">
                <div class="card table-card ${table.isAvailable ? 'table-available' : 'table-unavailable'}">
                    <div class="card-body">
                        <h5 class="card-title">Table ${table.number}</h5>
                        <p class="card-text">
                            Seats: ${table.seats}<br>
                            Location: ${table.location}<br>
                            Status: ${table.isAvailable ? 'Available' : 'Unavailable'}
                        </p>
                        ${table.isAvailable ? `
                            <button class="btn btn-primary reserve-btn" data-table-id="${table.id}">
                                Reserve
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
                showReservationModal(tableId);
            });
        });
    } catch (error) {
        console.error('Error loading tables:', error);
    }
}

function showReservationModal(tableId) {
    console.log('Showing modal for table:', tableId);
    if (!reservationModal) {
        console.error('Modal not initialized');
        return;
    }
    document.getElementById('selectedTableId').value = tableId;
    reservationModal.show();
}

async function handleReservationSubmit(e) {
    e.preventDefault();
    const tableId = document.getElementById('selectedTableId').value;
    const date = document.getElementById('reservationDate').value;
    const timeFrom = document.getElementById('reservationTimeFrom').value;
    const timeTo = document.getElementById('reservationTimeTo').value;
    const numberOfGuests = document.getElementById('numberOfGuests').value;

    try {
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                tableId,
                date,
                timeFrom,
                timeTo,
                numberOfGuests
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to create reservation');
        }

        reservationModal.hide();
        e.target.reset();
        alert('Reservation created successfully!');
        loadTables();
        loadReservations();
    } catch (error) {
        alert('Failed to create reservation: ' + error.message);
    }
}

// Reservation Functions
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
            reservationsList.innerHTML = `
                <div class="alert alert-info text-center">
                    You don't have any reservations yet.
                </div>
            `;
            return;
        }

        console.log('Processing reservations...');
        reservationsList.innerHTML = reservations.map(reservation => {
            console.log('Processing reservation:', reservation);
            const status = getReservationStatus(reservation.status);
            return `
                <div class="card reservation-card reservation-${status.toLowerCase()} mb-3">
                    <div class="card-body">
                        <h5 class="card-title">Reservation #${reservation.id}</h5>
                        <p class="card-text">
                            Date: ${new Date(reservation.date).toLocaleDateString()}<br>
                            Time: ${reservation.timeFrom} - ${reservation.timeTo}<br>
                            Table: ${reservation.table?.number || 'N/A'}<br>
                            Location: ${reservation.table?.location || 'N/A'}<br>
                            Status: ${status}
                        </p>
                        ${status === 'Pending' ? `
                            <button class="btn btn-danger" onclick="cancelReservation(${reservation.id})">
                                Cancel
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading reservations:', error);
        reservationsList.innerHTML = `
            <div class="alert alert-danger text-center">
                Failed to load reservations. Please try again later.
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

// Initialize
updateUI();
if (localStorage.getItem('token')) {
    loadTables();
    loadReservations();
} 