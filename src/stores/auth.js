import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Initial state
const initialState = {
    user: null,
    isAuthenticated: false
};

// Retrieve from localStorage if available
const storedAuth = browser ? localStorage.getItem('auth') : null;
const initialAuth = storedAuth ? JSON.parse(storedAuth) : initialState;

export const auth = writable(initialAuth);

// Subscribe to store changes and update localStorage
auth.subscribe((value) => {
    if (browser) {
        localStorage.setItem('auth', JSON.stringify(value));
    }
});

/**
 * Login action
 * @param {object} userData - User information
 */
export const login = (userData) => {
    auth.set({
        user: userData,
        isAuthenticated: true
    });
};

/**
 * Logout action
 */
export const logout = () => {
    auth.set(initialState);
    if (browser) {
        localStorage.removeItem('auth');
    }
};
