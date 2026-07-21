/**
 * Per-install secret file utility.
 *
 * BUG FIX C-4: previously the encryption key derivation in `encryption.ts`
 * and `SecureEncryption.ts` used only the OS `node-machine-id`. On hardware
 * where the machine-id is publicly readable (Windows HKLM, Linux /etc/machine-id,
 * macOS IOPlatformUUID) any user on the box — or any process that obtains the
 * same id — could reconstruct the key and decrypt backups/secrets.
 *
 * The fix mixes in a 256-bit random per-install secret stored at
 * `<userData>/.install-key`. The file is created on first boot with mode
 * 0600 (POSIX). Without that file an attacker cannot reproduce the key
 * even if they know the machine-id and the build-time PEPPER.
 *
 * In the renderer process there is no filesystem access — the secret is
 * propagated via `process.env.INSTALL_SECRET` (set once in main process
 * startup). The renderer-side `getInstallSecret()` reads it from there.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const INSTALL_SECRET_ENV = 'DHISUM_INSTALL_SECRET';
let cached: Buffer | null = null;

/**
 * Read the install secret from `process.env`, if it has already been
 * initialised by the main process.
 */
export function getInstallSecret(): Buffer | null {
  if (cached) return cached;
  try {
    const v = (process.env as Record<string, string | undefined>)[INSTALL_SECRET_ENV];
    if (typeof v === 'string' && /^[0-9a-f]{64}$/i.test(v)) {
      cached = Buffer.from(v, 'hex');
      return cached;
    }
  } catch { /* no env access */ }
  return null;
}

/**
 * Lazy initialisation call from the Electron main process.
 * Reads `<userData>/.install-key`, creating it with 256 bits of CSPRNG entropy
 * on first use. Returns the secret as a Buffer or `null` on failure.
 */
export function initInstallSecret(userDataPath: string): Buffer | null {
  try {
    if (!userDataPath) return null;
    if (cached) return cached;

    const keyPath = path.join(userDataPath, '.install-key');
    let raw: string;
    if (fs.existsSync(keyPath)) {
      raw = fs.readFileSync(keyPath, 'utf-8').trim();
    } else {
      raw = crypto.randomBytes(32).toString('hex');
      fs.writeFileSync(keyPath, raw, { mode: 0o600 });
    }
    if (!/^[0-9a-f]{64}$/i.test(raw)) {
      throw new Error('install-key has invalid format');
    }
    cached = Buffer.from(raw, 'hex');
    // Export through env so renderer-side `getInstallSecret()` resolves the
    // *same* value without touching the filesystem.
    (process.env as Record<string, string>)[INSTALL_SECRET_ENV] = raw;
    return cached;
  } catch (err) {
    console.error('[installSecret] failed to initialise', err);
    return null;
  }
}

/**
 * Used by tests / recovery flows — clears the in-memory cache so the next
 * call re-reads from env / file.
 */
export function _resetInstallSecretCache(): void {
  cached = null;
}
