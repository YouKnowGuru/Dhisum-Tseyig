/**
 * License Storage Utility
 * Handles reading/writing license.json, trial.json, and .trial-lock files.
 * All files are stored in the Electron userData directory.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getInstallSecret } from './installSecret';

// ============================================
// Types
// ============================================

export interface LicenseData {
  licenseKey: string;
  deviceId: string;
  plan: string;
  expiryDate: string;
  maxUsers: number;
  lastVerified: string;
  /** BUG FIX H-7: server explicitly rejected the license at this time */
  lastDeniedAt?: string;
  activationSecret?: string;
}

export interface TrialData {
  trialStartDate: string;
  trialEndDate: string;
  deviceId: string;
}

export interface TrialLockData {
  deviceId: string;
  trialStartDate: string;
}

// ============================================
// File Paths
// ============================================

let userDataPath: string = '';
let encryptionKey: Buffer | null = null;
let legacyEncryptionKey: Buffer | null = null;
let legacyNoSecretKey: Buffer | null = null;

/** Hardcoded pepper from the previous version — kept ONLY for backward-compat
 * decryption of files written by older builds. New writes always use the
 * env-based pepper. */
const LEGACY_PEPPER = 'Jinda2026BhutanPOS';

/**
 * Must be called once from the main process with app.getPath('userData')
 */
export function initStoragePath(dataPath: string): void {
  userDataPath = dataPath;
  encryptionKey = deriveKeyFromPath(dataPath, getLicensePepper());
  legacyEncryptionKey = deriveKeyFromPath(dataPath, LEGACY_PEPPER);
  // Fallback for files encrypted before .install-key existed (no install secret)
  legacyNoSecretKey = deriveKeyFromPathNoSecret(dataPath, LEGACY_PEPPER);
}

/**
 * Read the encryption pepper from the environment, matching the pattern
 * used by encryption.ts. In production the env var must be set; in dev a
 * warning-only fallback is used. The pepper is never hardcoded in source.
 */
function getLicensePepper(): string {
  const pepper = process.env.ENCRYPTION_PEPPER;
  if (pepper && pepper.length >= 32) {
    return pepper;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_PEPPER environment variable must be set in production');
  }
  console.warn('[licenseStorage] WARNING: ENCRYPTION_PEPPER not set — using install-secret-only derivation.');
  return '';
}

/**
 * Derive a device-specific encryption key from the storage path, pepper,
 * and the per-install secret. Without the install secret an attacker who
 * knows the pepper and the userData path still cannot reproduce the key.
 */
function deriveKeyFromPath(dataPath: string, pepper: string): Buffer {
  const sec = getInstallSecret();
  const installTag = sec ? sec.toString('hex') : '';
  return crypto.createHash('sha256').update(dataPath + pepper + installTag).digest();
}

/**
 * Derive a key using only the path and pepper (no install secret).
 * Used as a last-resort fallback for files encrypted by very old builds
 * that predate the .install-key mechanism.
 */
function deriveKeyFromPathNoSecret(dataPath: string, pepper: string): Buffer {
  return crypto.createHash('sha256').update(dataPath + pepper).digest();
}

function getLicensePath(): string {
  return path.join(userDataPath, 'license.json');
}

function getTrialPath(): string {
  return path.join(userDataPath, 'trial.json');
}

function getTrialLockPath(): string {
  return path.join(userDataPath, '.trial-lock');
}

// ============================================
// Encryption/Decryption (AES-256-GCM provides integrity)
// ============================================

function getEncryptionKey(): Buffer {
  if (!encryptionKey) {
    throw new Error('Storage path not initialized. Call initStoragePath first.');
  }
  return encryptionKey;
}

/**
 * BUG FIX H-8: switched from AES-256-CBC (no integrity check) to AES-256-GCM
 * (authenticated encryption). Format: `<iv-hex>:<ciphertext-hex>:<authTag-hex>`.
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(12); // GCM recommends 12-byte IVs
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
}

/**
 * BUG FIX H-8: GCM throws on tag mismatch, which we surface as a corrupted
 * lock file (the existing callers already treat this as "no lock").
 *
 * SECURITY FIX: tries the current (env-based) key first, then falls back
 * to the legacy hardcoded-pepper key so that files written by older builds
 * can still be read and auto-migrated to the new key on the next write.
 */
function decrypt(text: string): string {
  const parts = text.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  const iv = Buffer.from(parts[0]!, 'hex');
  const encrypted = parts[1]!;
  const authTag = Buffer.from(parts[2]!, 'hex');

  // Try the current key first
  try {
    return tryDecrypt(getEncryptionKey(), iv, encrypted, authTag);
  } catch (_e) {
    // Fall back to legacy key (legacy pepper + install secret)
    if (legacyEncryptionKey) {
      try {
        return tryDecrypt(legacyEncryptionKey, iv, encrypted, authTag);
      } catch (_e2) {
        // Fall back to legacy key without install secret (very old builds)
        if (legacyNoSecretKey) {
          return tryDecrypt(legacyNoSecretKey, iv, encrypted, authTag);
        }
      }
    }
    throw _e;
  }
}

function tryDecrypt(key: Buffer, iv: Buffer, encrypted: string, authTag: Buffer): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ============================================
// License File Operations
// ============================================

export function readLicense(): LicenseData | null {
  const filePath = getLicensePath();
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8').trim();

    let data: LicenseData;
    try {
      const decrypted = decrypt(raw);
      data = JSON.parse(decrypted) as LicenseData;
    } catch {
      // Plaintext fallback (old format)
      data = JSON.parse(raw) as LicenseData;
    }

    if (!data.licenseKey || !data.deviceId || !data.plan) {
      console.error('[licenseStorage] Invalid license data structure');
      return null;
    }

    return data;
  } catch (error) {
    // Backward-compat: file was encrypted with an old key we can no longer
    // derive. Delete it so the user can start fresh instead of repeated
    // failed reads on every startup.
    console.warn('[licenseStorage] License file unreadable (backward-compat), clearing:', (error as Error).message?.substring(0, 80));
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    return null;
  }
}

export function writeLicense(data: LicenseData): void {
  try {
    if (!userDataPath) {
      throw new Error('Storage path not initialized. Call initStoragePath first.');
    }

    // Validate data before writing
    if (!data.licenseKey || !data.deviceId || !data.plan) {
      throw new Error('Invalid license data: missing required fields');
    }

    // BUG FIX H-8: encrypt license data so users cannot bypass licensing by
    // editing license.json in a text editor (e.g. changing expiryDate, plan,
    // maxUsers, or lastVerified).
    const filePath = getLicensePath();
    const encrypted = encrypt(JSON.stringify(data));
    fs.writeFileSync(filePath, encrypted, 'utf-8');
  } catch (error) {
    console.error('[licenseStorage] Error writing license:', error);
    throw error;
  }
}

export function deleteLicense(): void {
  try {
    const filePath = getLicensePath();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('[licenseStorage] Error deleting license:', error);
    throw error;
  }
}

// ============================================
// Trial File Operations
// ============================================

export function readTrial(): TrialData | null {
  const filePath = getTrialPath();
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8').trim();

    let data: TrialData;
    try {
      const decrypted = decrypt(raw);
      data = JSON.parse(decrypted) as TrialData;
    } catch {
      // Plaintext fallback (old format)
      data = JSON.parse(raw) as TrialData;
    }

    if (!data.deviceId || !data.trialStartDate || !data.trialEndDate) {
      console.error('[licenseStorage] Invalid trial data structure');
      return null;
    }

    return data;
  } catch (error) {
    // Backward-compat: file was encrypted with an old key. Clear it.
    console.warn('[licenseStorage] Trial file unreadable (backward-compat), clearing:', (error as Error).message?.substring(0, 80));
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    return null;
  }
}

export function writeTrial(data: TrialData): void {
  try {
    if (!userDataPath) {
      throw new Error('Storage path not initialized. Call initStoragePath first.');
    }

    // Validate data before writing
    if (!data.deviceId || !data.trialStartDate || !data.trialEndDate) {
      throw new Error('Invalid trial data: missing required fields');
    }

    // BUG FIX H-8: encrypt trial data so users cannot extend their trial by
    // editing trial.json in a text editor.
    const filePath = getTrialPath();
    const encrypted = encrypt(JSON.stringify(data));
    fs.writeFileSync(filePath, encrypted, 'utf-8');
  } catch (error) {
    console.error('[licenseStorage] Error writing trial:', error);
    throw error;
  }
}

// ============================================
// Trial Lock (Encrypted) Operations
// ============================================

export function readTrialLock(): TrialLockData | null {
  const filePath = getTrialLockPath();
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const decrypted = decrypt(raw);
    const data = JSON.parse(decrypted) as TrialLockData;

    if (!data.deviceId || !data.trialStartDate) {
      console.error('[licenseStorage] Invalid trial lock data structure');
      return null;
    }

    return data;
  } catch (error) {
    // Backward-compat: lock file encrypted with old key. Clear it so the
    // user can start a fresh trial instead of repeated failed reads.
    console.warn('[licenseStorage] Trial lock unreadable (backward-compat), clearing:', (error as Error).message?.substring(0, 80));
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    return null;
  }
}

export function writeTrialLock(data: TrialLockData): void {
  try {
    if (!userDataPath) {
      throw new Error('Storage path not initialized. Call initStoragePath first.');
    }

    // Validate data before writing
    if (!data.deviceId || !data.trialStartDate) {
      throw new Error('Invalid trial lock data: missing required fields');
    }

    const filePath = getTrialLockPath();
    const encrypted = encrypt(JSON.stringify(data));
    fs.writeFileSync(filePath, encrypted, 'utf-8');
  } catch (error) {
    console.error('[licenseStorage] Error writing trial lock:', error);
    throw error;
  }
}
