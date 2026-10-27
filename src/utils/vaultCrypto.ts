/**
 * Utilities for the Device & BitLocker Vault
 * Web Crypto SHA-256 hashing for PIN protection and formatters
 */

const DEFAULT_PIN = '1234';

/**
 * Hash a PIN or passphrase with SHA-256 using standard Web Crypto API
 */
export async function hashVaultPin(pin: string): Promise<string> {
  const normalized = pin.trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(`vault_salt_${normalized}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify if the input PIN matches the stored hash or default PIN ("1234")
 */
export async function verifyVaultPin(inputPin: string, storedHash?: string): Promise<boolean> {
  const inputHash = await hashVaultPin(inputPin);
  if (!storedHash) {
    // Check against default PIN 1234
    const defaultHash = await hashVaultPin(DEFAULT_PIN);
    return inputHash === defaultHash;
  }
  return inputHash === storedHash;
}

/**
 * Format a 48-digit numeric BitLocker key into standard Microsoft groups:
 * XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX
 */
export function formatBitlockerKey(raw: string): string {
  // Strip existing hyphens or spaces
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length === 48) {
    const parts = digits.match(/.{1,6}/g);
    return parts ? parts.join('-') : raw;
  }
  return raw.trim();
}

/**
 * Validate BitLocker key format
 */
export function isBitlockerFormatValid(value: string): boolean {
  const digits = value.replace(/[^0-9]/g, '');
  return digits.length === 48;
}

/**
 * Generate a strong temporary local admin password
 */
export function generateRandomPassword(length = 16): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*+?';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}
