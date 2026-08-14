const BASE_URL = 'http://127.0.0.1:3000';

function showSection(sectionId) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    updateJwtDisplay();
}

function switchSignup(type) {
    if (type === 'user') {
        document.getElementById('form-signup-user').style.display = 'flex';
        document.getElementById('form-signup-shopkeeper').style.display = 'none';
    } else {
        document.getElementById('form-signup-user').style.display = 'none';
        document.getElementById('form-signup-shopkeeper').style.display = 'flex';
    }
}

function updateJwtDisplay() {
    const token = localStorage.getItem('jwt_token');
    const display = document.getElementById('jwt-display');
    const storedStatus = document.getElementById('jwt-stored-status');
    const dashStatus = document.getElementById('dash-jwt-status');
    
    if (token) {
        display.value = token;
        storedStatus.innerText = 'Stored: YES';
        dashStatus.innerText = '✓ Stored';
        dashStatus.style.color = 'green';
    } else {
        display.value = '';
        storedStatus.innerText = 'Stored: NO';
        dashStatus.innerText = 'Not Stored';
        dashStatus.style.color = 'red';
    }
}

function clearJwt() {
    localStorage.removeItem('jwt_token');
    updateJwtDisplay();
    document.getElementById('login-status').innerText = 'JWT Cleared.';
}

function logout() {
    clearJwt();
    showSection('login-section');
}

async function handleSignup(e, type) {
    e.preventDefault();
    const statusBox = document.getElementById('signup-status');
    statusBox.innerText = 'Loading...';
    
    let payload = {};
    let endpoint = '';

    if (type === 'user') {
        endpoint = '/signup_user';
        payload = {
            first_name: document.getElementById('su-first_name').value,
            username: document.getElementById('su-username').value,
            email: document.getElementById('su-email').value,
            phone_number: document.getElementById('su-phone_number').value,
            password: document.getElementById('su-password').value,
        };
    } else {
        endpoint = '/signup_shopkeeper';
        payload = {
            shop_name: document.getElementById('ss-shop_name').value,
            username: document.getElementById('ss-username').value,
            email: document.getElementById('ss-email').value,
            phone_number: document.getElementById('ss-phone_number').value,
            password: document.getElementById('ss-password').value,
        };
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        statusBox.innerText = `HTTP Status: ${response.status}\n\nResponse:\n${text}`;
    } catch (err) {
        statusBox.innerText = `Network Error / Backend Unavailable.\n\n${err.message}`;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const statusBox = document.getElementById('login-status');
    statusBox.innerText = 'Loading...';

    const payload = {
        username_or_email: document.getElementById('login-identifier').value,
        password: document.getElementById('login-password').value,
    };

    try {
        const response = await fetch(`${BASE_URL}/login_user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        statusBox.innerText = `HTTP Status: ${response.status}\n\nResponse:\n${text}`;

        if (response.ok) {
            // Axum returns raw string with quotes, parse it
            let token = text;
            try { token = JSON.parse(text); } catch(e) {}
            
            localStorage.setItem('jwt_token', token);
            updateJwtDisplay();
            statusBox.innerText += '\n\nLogin successful! JWT stored.';
        }
    } catch (err) {
        statusBox.innerText = `Network Error / Backend Unavailable.\n\n${err.message}`;
    }
}

async function accessDashboard() {
    const statusBox = document.getElementById('dashboard-result');
    const httpStatus = document.getElementById('dashboard-http-status');
    const authStatus = document.getElementById('dashboard-auth-status');
    const responseBody = document.getElementById('dashboard-response');
    
    httpStatus.innerText = 'Loading...';
    authStatus.innerText = '';
    responseBody.innerText = '';

    const token = localStorage.getItem('jwt_token');

    try {
        const response = await fetch(`${BASE_URL}/dashboard`, {
            method: 'GET',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        httpStatus.innerText = `HTTP Status: ${response.status}`;

        if (response.status === 401 || response.status === 403) {
            authStatus.innerHTML = '<strong style="color:red">JWT authentication failed</strong>';
        } else if (response.ok) {
            authStatus.innerHTML = '<strong style="color:green">JWT authentication successful</strong>';
        }

        const text = await response.text();
        responseBody.innerText = `\nResponse Body:\n${text}`;

    } catch (err) {
        httpStatus.innerText = `Network Error / Backend Unavailable.\n\n${err.message}`;
    }
}

// Initial setup
updateJwtDisplay();
