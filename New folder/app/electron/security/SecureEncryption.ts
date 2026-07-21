/**
 * Enhanced Encryption Utilities
 * Bank-Level Security with HMAC Authentication
 */

import crypto from 'crypto';
import { machineIdSync } from 'node-machine-id';
import { getInstallSecret } from '../../src/utils/installSecret';

// Configuration
const ALGORITHM = 'aes-256-gcm'; // GCM mode provides authentication
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 600000; // OWASP 2024 recommendation for PBKDF2-SHA512

/**
 * Get encryption pepper from secure environment
 */
function getEncryptionPepper(): string {
  const pepper = process.env.ENCRYPTION_PEPPER;
  
  if (pepper && pepper.length >= 32) {
    return pepper;
  }
  
  // Production: Throw error
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_PEPPER environment variable must be set in production');
  }
  
  // Development: Generate temporary (NOT for production)
  console.warn('[Encryption] WARNING: Using temporary development pepper');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Derive encryption key using PBKDF2.
 *
 * BUG FIX C-4: now also mixes in the per-install secret (`installSecret`).
 * If `node-machine-id` is unavailable on this platform, the previous
 * implementation substituted `crypto.randomBytes(32)` *per call*, which made
 * re-decryption impossible. The fallback now uses the install secret as a
 * stable machine-specific component, and throws when even the install
 * secret is missing.
 */
function deriveKey(salt: Buffer, pepper: string): Buffer {
  let machineId: string;

  try {
    machineId = machineIdSync(true);
  } catch (_error) {
    // BUG FIX C-4: use the deterministic install secret instead of a
    // fresh random value (which would prevent re-decryption).
    const sec = getInstallSecret();
    if (sec) {
      machineId = sec.toString('hex');
    } else {
      throw new Error('SecureEncryption requires the per-install secret. Call initInstallSecret() at start-up.');
    }
  }

  const installSecretHex = (() => {
    const s = getInstallSecret();
    return s ? s.toString('hex') : '';
  })();
  const combined = machineId + pepper + installSecretHex;
  return crypto.pbkdf2Sync(combined, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt data with AES-256-GCM
 * Format: [salt(32)][iv(16)][authTag(16)][encryptedData]
 */
export function encryptSecure(data: Buffer): Buffer {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const pepper = getEncryptionPepper();
  const key = deriveKey(salt, pepper);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Combine: salt + iv + authTag + encrypted
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Decrypt data encrypted with encryptSecure
 */
export function decryptSecure(encryptedData: Buffer): Buffer {
  if (encryptedData.length < SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted data');
  }
  
  const salt = encryptedData.subarray(0, SALT_LENGTH);
  const iv = encryptedData.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encryptedData.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const data = encryptedData.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  
  const pepper = getEncryptionPepper();
  const key = deriveKey(salt, pepper);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

/**
 * Encrypt string data
 */
export function encryptString(plainText: string): Buffer {
  return encryptSecure(Buffer.from(plainText, 'utf-8'));
}

/**
 * Decrypt to string
 */
export function decryptString(encryptedData: Buffer): string {
  return decryptSecure(encryptedData).toString('utf-8');
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash password using PBKDF2
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
  return {
    hash: hash.toString('hex'),
    salt,
  };
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
  const computedHash = computed.toString('hex');
  
  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
  } catch {
    return false;
  }
}

/**
 * Generate secure backup key
 */
export function generateBackupKey(): string {
  return crypto.randomBytes(64).toString('base64url');
}

/**
 * Encrypt file for backup
 * Uses a unique random salt per backup (stored alongside encrypted data)
 */
export function encryptBackup(data: Buffer, backupKey?: string): { encrypted: Buffer; key: string } {
  const key = backupKey || generateBackupKey();
  const salt = crypto.randomBytes(32);
  const keyBuffer = crypto.scryptSync(key, salt, 32);
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Prepend salt so decryptBackup can read it
  return {
    encrypted: Buffer.concat([salt, iv, authTag, encrypted]),
    key,
  };
}

/**
 * Decrypt backup file
 */
export function decryptBackup(encryptedData: Buffer, key: string): Buffer {
  // Read salt from the first 32 bytes
  const salt = encryptedData.subarray(0, 32);
  const iv = encryptedData.subarray(32, 32 + IV_LENGTH);
  const authTag = encryptedData.subarray(32 + IV_LENGTH, 32 + IV_LENGTH + AUTH_TAG_LENGTH);
  const data = encryptedData.subarray(32 + IV_LENGTH + AUTH_TAG_LENGTH);
  
  const keyBuffer = crypto.scryptSync(key, salt, 32);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([decipher.update(data), decipher.final()]);
}
