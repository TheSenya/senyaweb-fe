import { beforeNavigate, goto } from '$app/navigation';
import { get } from 'svelte/store';

/**
 * Sets up a navigation guard to protect routes from unauthenticated access.
 * This function should be called in the root layout's script context.
 * 
 * @param {object} authStore - The Svelte store containing authentication state.
 *                             Expected structure: { isAuthenticated: boolean, ... }
 */
export function setupAuthGuard(authStore) {
    /**
     * Intercepts navigation attempts before they complete.
     * Prevents "flicker" by blocking unauthorized navigation at the source.
     */
    beforeNavigate(({ to, cancel }) => {
        // If there is no destination (e.g. hash change or obscure state), ignore
        if (!to || !to.route || !to.route.id) return;

        // Get current auth state
        const { isAuthenticated } = get(authStore);

        // Define public routes (routes that don't require login)
        // We assume the root '/' is the login/landing page.
        const isPublicRoute = to.route.id === '/';

        // Check if user is authenticated
        if (!isAuthenticated && !isPublicRoute) {
            // User is not logged in and trying to access a protected rout
            console.warn('Access denied: User is not authenticated.');

            // Cancel the navigation immediately
            // This keeps the user on the current page (e.g. login page)
            cancel();

            // Optionally, if the user was somehow on a different page (not likely if guard is working),
            // or if we want to ensure they are at the login screen:
            // goto('/'); 
            // Ideally, cancellation is enough if they are initiating navigation FROM a safe place.
            // If they are refreshing a protected page, beforeNavigate might not catch it during SSR/first load,
            // so onMount check is still good backup, but beforeNavigate handles the "click" cases perfectly.
        }
    });
}
