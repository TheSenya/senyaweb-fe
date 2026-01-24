import * as jose from 'jose';

const SERVER_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvBQ/W8J0jb1AtBNfL9cg
VTu861liKlM2grCJCMRaM8Dpf4HrreImrjBM7CnDKmfWEATZTb/3L3JPl70DCSsg
5eu/rnmYez+2L8G66Xq1O06XSwA0x1hhFcnB9N6aFoL3I9dtFnPEh+jSL6XOyjCl
OBKQ0gXHDedCFrhDqCOZRKwdfPERrjeZU5xKpLzWbPs9JT/DpTu+r4ZwXCVk7u3r
jpX3y0m7/eDFjXJj2t3Reckg/L9SX4wIFky906f9pnLUs8b1G9Hjp39EU3d/6Kuc
/oHbOydw1j/809+Mq+TPHgHH4+Naqn8pQquG4na7+ENgFNWV2mFZEiRV2wSzrA6Q
YQIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Encrypts data for the server using the Server's Public Key.
 * Also generates a transient Client Key Pair for the server to encrypt the response.
 * 
 * @param payload The JSON serializable data to send
 * @returns An object containing the encrypted content string and the client's private key (to decrypt the response)
 */
export async function encryptRequest(payload: any) {
    // 1. Generate a transient ECDH key pair for the client
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

    // 3. Encrypt using the Server's Public Key
    const serverPublicKey = await jose.importSPKI(SERVER_PUBLIC_KEY_PEM, 'RSA-OAEP-256');

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
 */
export async function decryptResponse(encryptedResponse: string, clientPrivateKey: any) {
    const { plaintext } = await jose.compactDecrypt(encryptedResponse, clientPrivateKey);
    const decoded = new TextDecoder().decode(plaintext);
    return JSON.parse(decoded);
}
