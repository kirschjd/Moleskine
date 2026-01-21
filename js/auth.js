/**
 * Moleskine - Authentication Module
 * Simple client-side password gate
 */

const Auth = (function() {
    // Default password hash (SHA-256 of 'moleskine')
    // Change this to your own password hash
    const DEFAULT_PASSWORD_HASH = 'd950113d83977940d0160cdc6f59edd3da64ac03b4f7cd896a27921a45cd8fb4';

    const SESSION_KEY = 'moleskine_auth';
    const HASH_KEY = 'moleskine_password_hash';

    /**
     * Simple SHA-256 hash function using Web Crypto API
     */
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Get the stored password hash or use default
     */
    function getPasswordHash() {
        return localStorage.getItem(HASH_KEY) || DEFAULT_PASSWORD_HASH;
    }

    /**
     * Set a new password hash
     */
    async function setPassword(newPassword) {
        const hash = await sha256(newPassword);
        localStorage.setItem(HASH_KEY, hash);
        return true;
    }

    /**
     * Check if user is authenticated
     */
    function isAuthenticated() {
        return sessionStorage.getItem(SESSION_KEY) === 'true';
    }

    /**
     * Attempt login with password
     */
    async function login(password) {
        const inputHash = await sha256(password);
        const storedHash = getPasswordHash();

        if (inputHash === storedHash) {
            sessionStorage.setItem(SESSION_KEY, 'true');
            return true;
        }
        return false;
    }

    /**
     * Log out the user
     */
    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.href = 'index.html';
    }

    /**
     * Require authentication - redirect if not authenticated
     */
    function requireAuth() {
        if (!isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    /**
     * Initialize auth form handlers (for index.html)
     */
    function initAuthForm() {
        const form = document.getElementById('auth-form');
        const passwordInput = document.getElementById('password-input');
        const errorEl = document.getElementById('auth-error');

        if (!form) return;

        // If already authenticated, redirect to app
        if (isAuthenticated()) {
            window.location.href = 'app.html';
            return;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = passwordInput.value;
            if (!password) {
                errorEl.textContent = 'Please enter a password';
                return;
            }

            const success = await login(password);

            if (success) {
                window.location.href = 'app.html';
            } else {
                errorEl.textContent = 'Incorrect password';
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }

    // Auto-initialize if on auth page
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthForm);
    } else {
        initAuthForm();
    }

    // Public API
    return {
        isAuthenticated,
        login,
        logout,
        requireAuth,
        setPassword,
        sha256
    };
})();
