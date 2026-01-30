/**
 * Global API module with automatic encryption/decryption.
 * 
 * Usage:
 *   import api from '$lib/api';
 * 
 *   // GET request (automatically encrypted)
 *   const data = await api.get('/bingo/gem_models');
 * 
 *   // POST request (automatically encrypted)
 *   const response = await api.post('/bingo/send', { message: 'hello' });
 */

import { encryptRequest, decryptResponse } from './encryption';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

interface ApiResponse<T = any> {
    data: T;
    ok: boolean;
    status: number;
}

/**
 * Internal function that handles all encrypted requests.
 * Converts any HTTP method to an encrypted POST request.
 */
async function encryptedFetch<T = any>(
    endpoint: string,
    options: {
        method?: string;
        payload?: any;
    } = {}
): Promise<ApiResponse<T>> {
    const { method = 'GET', payload = {} } = options;

    // Build the URL
    const url = endpoint.startsWith('http')
        ? endpoint
        : `${PUBLIC_BACKEND_URL}${endpoint}`;

    // Encrypt the payload (includes method info for the backend)
    const { encryptedContent, clientPrivateKey } = await encryptRequest({
        ...payload,
        _method: method, // Tell backend the original intended method
    });

    // Send as encrypted POST
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: encryptedContent }),
    });

    // Handle response
    if (res.ok) {
        const wrapper = await res.json();

        // If response is encrypted, decrypt it
        if (wrapper.content && typeof wrapper.content === 'string') {
            try {
                const decrypted = await decryptResponse(wrapper.content, clientPrivateKey);
                return { data: decrypted as T, ok: true, status: res.status };
            } catch (e) {
                // If decryption fails, return the wrapper as-is
                return { data: wrapper as T, ok: true, status: res.status };
            }
        }

        return { data: wrapper as T, ok: true, status: res.status };
    }

    // Handle error responses
    let errorData: any = null;
    try {
        errorData = await res.json();
    } catch {
        errorData = { detail: res.statusText };
    }

    return { data: errorData, ok: false, status: res.status };
}

/**
 * Global API object with methods for each HTTP verb.
 * All requests are automatically encrypted.
 */
const api = {
    /**
     * Make an encrypted GET request.
     * @param endpoint - API endpoint (e.g., '/bingo/models')
     * @param params - Optional query parameters to include in payload
     */
    async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        return encryptedFetch<T>(endpoint, { method: 'GET', payload: params || {} });
    },

    /**
     * Make an encrypted POST request.
     * @param endpoint - API endpoint (e.g., '/bingo/send')
     * @param data - Request body data
     */
    async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return encryptedFetch<T>(endpoint, { method: 'POST', payload: data || {} });
    },

    /**
     * Make an encrypted PUT request.
     * @param endpoint - API endpoint
     * @param data - Request body data
     */
    async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return encryptedFetch<T>(endpoint, { method: 'PUT', payload: data || {} });
    },

    /**
     * Make an encrypted DELETE request.
     * @param endpoint - API endpoint
     * @param data - Optional request body data
     */
    async delete<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return encryptedFetch<T>(endpoint, { method: 'DELETE', payload: data || {} });
    },

    /**
     * Make an encrypted PATCH request.
     * @param endpoint - API endpoint
     * @param data - Request body data
     */
    async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return encryptedFetch<T>(endpoint, { method: 'PATCH', payload: data || {} });
    },
};

export default api;
