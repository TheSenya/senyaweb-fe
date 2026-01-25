import { writable } from 'svelte/store';

/**
 * @typedef {Object} AuthState
 * @property {object|null} user
 * @property {boolean} isAuthenticated
 */

/** @type {AuthState} */
const initialState = {
    user: null,
    isAuthenticated: false
};

export const auth = writable(initialState);

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
};
