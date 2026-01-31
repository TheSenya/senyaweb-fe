/**
 * Encryption utilities for secure client-server communication.
 * 
 * Uses asymmetric encryption (RSA-OAEP for server, ECDH-ES for client)
 * to ensure end-to-end encryption of all API requests and responses.
 * 
 * Flow:
 * 1. Client fetches server's public key (cached after first fetch)
 * 2. Client generates ephemeral ECDH key pair for each request
 * 3. Client encrypts request with server's RSA public key
 * 4. Server decrypts, processes, and encrypts response with client's ECDH public key
 * 5. Client decrypts response with ephemeral private key
 */

import * as jose from 'jose';
import { getServerPublicKeyPEM, invalidateKeyCache } from './crypto/keyManager';

/**
 * Encrypts data for the server using the Server's Public Key.
 * Also generates a transient Client Key Pair for the server to encrypt the response.
 * 
 * The server's public key is fetched from the backend and cached.
 * 
 * @param payload The JSON serializable data to send
 * @returns An object containing the encrypted content string and the client's private key (to decrypt the response)
 * @throws Error if the server public key cannot be fetched or encryption fails
 */
export async function encryptRequest(payload: any) {
    // 1. Generate a transient ECDH key pair for the client
    // This ensures forward secrecy - each request uses a new key pair
    const { publicKey, privateKey } = await jose.generateKeyPair('ECDH-ES+A256KW', { crv: 'P-256' });

    // Export the public key as JWK to send to the server
    const clientPublicKeyJwk = await jose.exportJWK(publicKey);

    // 2. Prepare the wrapper payload
    const wrapper = {
        ts: Date.now(), // timestamp for replay protection
        payload: payload,
        client_public_key: clientPublicKeyJwk
    };

    const wrapperJson = JSON.stringify(wrapper);

    // 3. Get the server's public key (fetched and cached by keyManager)
    const serverPublicKeyPEM = await getServerPublicKeyPEM();
    const serverPublicKey = await jose.importSPKI(serverPublicKeyPEM, 'RSA-OAEP-256');

    // 4. Encrypt using the Server's Public Key
    const jwe = await new jose.CompactEncrypt(new TextEncoder().encode(wrapperJson))
        .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
        .encrypt(serverPublicKey);

    return {
        encryptedContent: jwe,
        clientPrivateKey: privateKey
    };
}

/**
 * Decrypts the server's response using the transient Client Private Key.
 * 
 * @param encryptedResponse The JWE string received from the server
 * @param clientPrivateKey The private key generated during the request
 * @returns The decrypted payload object
 * @throws Error if decryption fails (possibly due to key mismatch)
 */
export async function decryptResponse(encryptedResponse: string, clientPrivateKey: any) {
    const { plaintext } = await jose.compactDecrypt(encryptedResponse, clientPrivateKey);
    const decoded = new TextDecoder().decode(plaintext);
    return JSON.parse(decoded);
}

// Re-export invalidateKeyCache for use when key rotation is suspected
export { invalidateKeyCache };
