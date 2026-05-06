/* ================================================================
   TRUSTATE — admin_auth.js
   Interactivity for Admin Login & Sign Up.
   ================================================================ */

(function () {
    'use strict';

    const $ = id => document.getElementById(id);

    function showToast(msg, type = 'error') {
        const t = $('toast');
        if (!t) return;
        t.textContent = msg;
        t.style.background = type === 'success' ? '#00C47A' : '#FF4D4D';
        t.style.boxShadow = type === 'success'
            ? '0 10px 30px rgba(0, 196, 122, 0.3)'
            : '0 10px 30px rgba(255, 77, 77, 0.3)';

        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }

    // --- Login Logic ---
    const loginForm = $('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = $('submitBtn');
            const email = $('email').value.trim();
            const password = $('password').value;

            btn.innerHTML = 'Verifying...';
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';

            try {
                const response = await fetch('http://localhost:5000/api/admin/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast('Login successful! Redirecting...', 'success');
                    // Store full response (token + admin info)
                    localStorage.setItem('adminUser', JSON.stringify(data));
                    setTimeout(() => {
                        window.location.href = '../admin/admin_dashboard.html';
                    }, 1000);
                } else {
                    showToast(data.message || 'Invalid email or password.');
                    btn.innerHTML = 'Sign In to Dashboard →';
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'all';
                }
            } catch (err) {
                showToast('Server connection failed. Please try again.');
                btn.innerHTML = 'Sign In to Dashboard →';
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'all';
            }
        });
    }

    // --- Signup Logic ---
    const signupForm = $('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = $('submitBtn');
            const fullName = $('fullname').value.trim();
            const email = $('email').value.trim();
            const password = $('password').value;
            const accessKey = $('accesskey').value.trim();

            btn.innerHTML = 'Creating Account...';
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';

            try {
                const response = await fetch('http://localhost:5000/api/admin/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, email, password, accessKey })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast('Account created successfully!', 'success');
                    setTimeout(() => {
                        window.location.href = 'admin_login.html';
                    }, 1500);
                } else {
                    showToast(data.message || 'Signup failed.');
                    btn.innerHTML = 'Create Account →';
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'all';
                }
            } catch (err) {
                showToast('Server connection failed. Please try again.');
                btn.innerHTML = 'Create Account →';
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'all';
            }
        });
    }

})();
