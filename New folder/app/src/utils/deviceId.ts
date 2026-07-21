/**
 * Device ID Utility
 * Generates a unique, persistent hardware fingerprint for license binding.
 * This utility is isomorphic: it works in both Main and Renderer processes.
 */

// We use dynamic require for node-machine-id to avoid Vite bundling issues in the renderer
let machineIdSync: any = null;

// Determine environment
const isRenderer = typeof window !== 'undefined';
const isMain = !isRenderer;

if (isMain) {
    try {
        // Only require in Node environment
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        machineIdSync = require('node-machine-id').machineIdSync;
    } catch (e) {
        console.error('[DeviceId] Failed to load node-machine-id in Main process:', e);
    }
}

let cachedId: string | null = null;

/**
 * Initialize the device identifier.
 * Renderer: Calls the secure bridge.
 * Main: Calls node-machine-id directly with persistent fallback.
 */
export async function initializeDeviceId(): Promise<string> {
    if (cachedId) return cachedId;

    if (isRenderer) {
        try {
            const secureAPI = (window as any).electronSecureAPI;
            if (secureAPI?.license?.getDeviceId) {
                const result = await secureAPI.license.getDeviceId();
                if (result) {
                    cachedId = result;
                    return cachedId as string;
                }
            }
    } catch (_error) {
        console.warn('[DeviceId] Bridge call failed, using session fallback');
        }

        // Fallback for Renderer (Browser or Bridge failed)
        cachedId = localStorage.getItem('dhisum_session_device_id');
        if (!cachedId) {
            cachedId = 'browser-' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('dhisum_session_device_id', cachedId);
        }
    } else {
        // Main Process
        cachedId = getDeviceIdSync();
    }

    return cachedId || 'unknown-device';
}

/**
 * Internal synchronous lookup for Main process with persistent fallback.
 */
function getDeviceIdSync(): string {
    try {
        if (machineIdSync) {
            return machineIdSync();
        }
    } catch (error) {
        console.error('[DeviceId] Failed to get machine ID in Main:', error);
    }

    // Persistent fallback for Main process (prevents ID changing on every restart)
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('fs');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require('path');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { app } = require('electron');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const crypto = require('crypto');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getInstallSecret } = require('./installSecret');

        // Use a stable path in userData
        const fallbackPath = path.join(app.getPath('userData'), '.device-id');

        if (fs.existsSync(fallbackPath)) {
            const raw = fs.readFileSync(fallbackPath, 'utf8');
            // Try to decrypt (new encrypted format)
            const decrypted = decryptDeviceId(raw, crypto, getInstallSecret);
            if (decrypted) return decrypted;
            // Fall back to plaintext (old format) — will be auto-migrated to
            // encrypted on the next write.
            return raw;
        } else {
            const fallbackId = 'dhisum-fallback-' + crypto.randomBytes(16).toString('hex');
            const encrypted = encryptDeviceId(fallbackId, crypto, getInstallSecret);
            fs.writeFileSync(fallbackPath, encrypted, 'utf8');
            return fallbackId;
        }
    } catch (fallbackError) {
        console.error('[DeviceId] Critical failure in persistent fallback:', fallbackError);
        return 'unknown-main-device';
    }
}

/**
 * SECURITY FIX: Encrypt the device-id fallback file so it cannot be copied
 * to another machine to clone the device identity. Uses AES-256-GCM with a
 * key derived from the per-install secret (.install-key).
 *
 * Format: `<iv-hex>:<ciphertext-hex>:<authTag-hex>`
 */
function encryptDeviceId(id: string, crypto: any, getInstallSecret: () => Buffer | null): string {
    const secret = getInstallSecret();
    if (!secret) {
        // If no install secret, fall back to plaintext (should not happen
        // in normal operation since initInstallSecret is called at startup).
        return id;
    }
    const key = crypto.createHash('sha256').update(secret).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(id, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
}

/**
 * SECURITY FIX: Decrypt the device-id fallback file. Returns null if the
 * content is not in encrypted format (legacy plaintext) or decryption fails
 * (wrong install secret / corrupted), so the caller can fall back to
 * treating the raw content as plaintext.
 */
function decryptDeviceId(raw: string, crypto: any, getInstallSecret: () => Buffer | null): string | null {
    // Encrypted format: iv-hex:ciphertext-hex:authTag-hex (3 colon-separated hex parts)
    const parts = raw.split(':');
    if (parts.length !== 3) return null; // not encrypted format
    const secret = getInstallSecret();
    if (!secret) return null;
    try {
        const key = crypto.createHash('sha256').update(secret).digest();
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const authTag = Buffer.from(parts[2], 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch {
        return null; // wrong key or corrupted — caller treats as plaintext
    }
}

/**
 * Get the unique device identifier.
 * Returns the cached value or attempts a synchronous lookup (Main only).
 */
export function getDeviceId(): string {
    if (cachedId) return cachedId;
    
    if (isRenderer) {
        // Sync fallback for Renderer
        return localStorage.getItem('dhisum_session_device_id') || 'initializing...';
    } else {
        // Main Process - synchronous lookup
        cachedId = getDeviceIdSync();
        return cachedId;
    }
}
