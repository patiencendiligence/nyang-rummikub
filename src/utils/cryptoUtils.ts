/**
 * Simple client-side lightweight payload encryption / obfuscation helper
 * for securing real-time game messages and session identifiers.
 */

const SECRET_KEY = 'rummikub-secret-salt-2026';

export function encryptPayload(data: unknown): string {
  try {
    const jsonStr = JSON.stringify(data);
    let cipher = '';
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      cipher += String.fromCharCode(charCode);
    }
    return btoa(encodeURIComponent(cipher));
  } catch (err) {
    console.error('Encryption error:', err);
    return JSON.stringify(data);
  }
}

export function decryptPayload<T>(encryptedStr: string): T | null {
  try {
    const cipher = decodeURIComponent(atob(encryptedStr));
    let jsonStr = '';
    for (let i = 0; i < cipher.length; i++) {
      const charCode = cipher.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      jsonStr += String.fromCharCode(charCode);
    }
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.error('Decryption error:', err);
    try {
      return JSON.parse(encryptedStr) as T;
    } catch {
      return null;
    }
  }
}
