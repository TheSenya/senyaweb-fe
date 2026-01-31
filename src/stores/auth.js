import { writable } from 'svelte/store';

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} email
 * @property {boolean} is_active
 * @property {boolean} is_admin
 * @property {string|null} created_at
 * @property {string|null} last_login
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isAdmin
 * @property {boolean} isLoading - True while checking auth status
 */

/** @type {AuthState} */
const initialState = {
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: true  // Start as loading until we check auth
};

export const auth = writable(initialState);

/**
 * Login action - sets the user as authenticated
 * @param {User} userData - User information from the server
 */
export const login = (userData) => {
    auth.set({
        user: userData,
        isAuthenticated: true,
        isAdmin: userData.is_admin || false,
        isLoading: false
    });
};

/**
 * Logout action - clears all auth state
 */
export const logout = () => {
    auth.set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false
    });
};

/**
 * Set loading state to false (used when auth check completes)
 */
export const setAuthLoaded = () => {
    auth.update(state => ({
        ...state,
        isLoading: false
    }));
};
