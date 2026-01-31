/**
 * Server Public Key Manager
 * 
 * Fetches and caches the server's public key from the backend.
 * This is used by the encryption module to encrypt requests.
 * 
 * The public key is safe to fetch over the network - it's meant to be public!
 * Only the server's private key can decrypt messages encrypted with this key.
 */

import { PUBLIC_BACKEND_URL } from '$env/static/public';

// Module-level cache for the public key PEM string
let cachedPublicKeyPEM: string | null = null;

// Prevents multiple parallel fetches
let fetchPromise: Promise<string> | null = null;

/**
 * Fetches and caches the server's public key in PEM format.
 * 
 * Uses a singleton pattern to ensure we only fetch once per session.
 * Subsequent calls return the cached key immediately.
 * 
 * @returns The server's public key as a PEM-formatted string
 * @throws Error if the key cannot be fetched
 */
export async function getServerPublicKeyPEM(): Promise<string> {
    // Return cached key if available
    if (cachedPublicKeyPEM) {
        return cachedPublicKeyPEM;
    }

    // If a fetch is already in progress, wait for it
    // This prevents multiple parallel fetches if called rapidly
    if (fetchPromise) {
        return fetchPromise;
    }

    // Start the fetch
    fetchPromise = fetchPublicKey();

    try {
        cachedPublicKeyPEM = await fetchPromise;
        return cachedPublicKeyPEM;
    } finally {
        fetchPromise = null;
    }
}

/**
 * Internal function to fetch the public key from the backend.
 */
async function fetchPublicKey(): Promise<string> {
    const url = `${PUBLIC_BACKEND_URL}/crypto/public-key`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'text/plain',
        },
    });

    if (!response.ok) {
        throw new Error(
            `Failed to fetch server public key: ${response.status} ${response.statusText}`
        );
    }

    const pemString = await response.text();

    // Basic validation that this looks like a PEM key
    if (!pemString.includes('-----BEGIN PUBLIC KEY-----')) {
        throw new Error('Invalid public key format received from server');
    }

    console.log('✅ Server public key fetched and cached');
    return pemString;
}

/**
 * Clears the cached public key.
 * 
 * Use this when:
 * - You suspect the server has rotated its keys
 * - A decryption error occurs (might indicate key mismatch)
 * - You want to force a fresh fetch
 */
export function invalidateKeyCache(): void {
    cachedPublicKeyPEM = null;
    console.log('🔄 Server public key cache invalidated');
}

/**
 * Checks if a public key is currently cached.
 * Useful for debugging or conditional logic.
 */
export function hasKeyCache(): boolean {
    return cachedPublicKeyPEM !== null;
}
