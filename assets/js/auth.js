// AUTH: Master admin credentials
const ADMIN_USER = "juan";
const ADMIN_PASS = "juxn000xpxblx";

// AUTH: Redirect to panel if already authenticated
(function checkExistingSession() {
    if (window.location.pathname.includes('admin-login')) {
        const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
        if (isAuthenticated === 'true') {
            window.location.href = 'admin-panel.html';
        }
    }
})();

// INIT: Setup login form handlers
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
   
    // UI: Password visibility toggle handler
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
           
            const icon = this.querySelector('i');
            if (icon) {
                if (type === 'password') {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                } else {
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }
            }
        });
    }
   
    // AUTH: Login form submission handler
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
           
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const errorEl = document.getElementById('loginError');
           
            if (username === '' || password === '') {
                if (errorEl) {
                    errorEl.textContent = 'Por favor completa todos los campos';
                    errorEl.style.display = 'block';
                }
                return;
            }
           
            if (username === ADMIN_USER && password === ADMIN_PASS) {
                sessionStorage.setItem('adminAuthenticated', 'true');
                sessionStorage.setItem('adminUser', username);
                window.location.href = 'admin-panel.html';
            } else {
                if (errorEl) {
                    errorEl.textContent = 'Usuario o contraseña incorrectos';
                    errorEl.style.display = 'block';
                    setTimeout(() => {
                        errorEl.style.display = 'none';
                    }, 3000);
                } else {
                    alert('Usuario o contraseña incorrectos');
                }
            }
        });
    }
});

// GLOBAL: Fallback password toggle for onclick attribute
window.togglePassword = function() {
    const password = document.getElementById('password');
    const icon = document.querySelector('.password-toggle i');
   
    if (password) {
        if (password.type === 'password') {
            password.type = 'text';
            if (icon) {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        } else {
            password.type = 'password';
            if (icon) {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
    }
};