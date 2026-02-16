/**
 * Frontend Encryption Utility (AES-256-GCM)
 * Compatible with Backend Encryption Middleware
 */

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

/**
 * Convert Hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

/**
 * Convert Uint8Array to Hex string
 */
function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Get CryptoKey from hex string
 */
async function getEncryptionKey(hexKey: string): Promise<CryptoKey> {
    const keyBytes = hexToBytes(hexKey);
    return window.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data
 */
export async function encryptData(data: string): Promise<{ encryptedData: string; iv: string }> {
    if (!ENCRYPTION_KEY) throw new Error('Encryption key not configured');

    const key = await getEncryptionKey(ENCRYPTION_KEY);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);

    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
    );

    const encryptedArray = new Uint8Array(encrypted);
    const authTagLength = 16;

    // In Web Crypto, the auth tag is appended to the ciphertext
    return {
        encryptedData: bytesToHex(encryptedArray),
        iv: bytesToHex(iv)
    };
}

/**
 * Decrypt data
 */
export async function decryptData(encryptedData: string, ivHex: string): Promise<string> {
    if (!ENCRYPTION_KEY) throw new Error('Encryption key not configured');

    const key = await getEncryptionKey(ENCRYPTION_KEY);
    const iv = hexToBytes(ivHex);
    const data = hexToBytes(encryptedData);

    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );

    return new TextDecoder().decode(decrypted);
}
