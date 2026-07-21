/**
 * IntegrityService — Tamper-evident HMAC seals for critical database data.
 *
 * SECURITY: Prevents direct DB tampering (e.g. opening the SQLite file in a
 * text editor and running `UPDATE users SET role='admin' WHERE id=1` or
 * `UPDATE settings SET value='0' WHERE key='gst_rate'`).
 *
 * Each critical value is sealed with an HMAC computed from the per-install
 * secret (.install-key), which is NOT stored in the database. An attacker
 * who edits the DB directly cannot recompute the HMAC without the install
 * secret, so `verifyAll()` detects the tampering on the next startup.
 *
 * Protected data:
 *  - settings: gst_rate, gst_rate_domestic
 *  - users: role column (detects privilege escalation)
 *  - period_locks: existence + is_locked (detects unlocking closed periods)
 */
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { getInstallSecret } from '../utils/installSecret';

/** Settings keys that are security-critical and must be sealed. */
const PROTECTED_SETTINGS = ['gst_rate', 'gst_rate_domestic'];

export interface IntegrityViolation {
  tableName: string;
  recordKey: string;
  type: 'hash_mismatch' | 'missing_seal' | 'missing_record';
  message: string;
}

export class IntegrityService {
  private db: Database.Database;
  private hmacKey: Buffer | null;

  constructor(db: Database.Database) {
    this.db = db;
    const secret = getInstallSecret();
    this.hmacKey = secret ? crypto.createHash('sha256').update(secret).digest() : null;
  }

  /** Compute HMAC-SHA256(key, tableName:recordKey:value) as hex. */
  private computeHmac(tableName: string, recordKey: string, value: string): string {
    if (!this.hmacKey) throw new Error('Install secret not available for integrity sealing');
    return crypto.createHmac('sha256', this.hmacKey)
      .update(`${tableName}:${recordKey}:${value}`)
      .digest('hex');
  }

  /** Store or update the HMAC seal for a record. */
  seal(tableName: string, recordKey: string, value: string): void {
    if (!this.hmacKey) return; // no secret — skip sealing
    const hmac = this.computeHmac(tableName, recordKey, value);
    this.db.prepare(`
      INSERT INTO integrity_hashes (table_name, record_key, value_hash)
      VALUES (?, ?, ?)
      ON CONFLICT(table_name, record_key) DO UPDATE SET value_hash = excluded.value_hash
    `).run(tableName, recordKey, hmac);
  }

  /** Remove the HMAC seal for a record (e.g. when a period lock is legitimately removed). */
  unseal(tableName: string, recordKey: string): void {
    this.db.prepare('DELETE FROM integrity_hashes WHERE table_name = ? AND record_key = ?')
      .run(tableName, recordKey);
  }

  // ============================================
  // Convenience wrappers for specific tables
  // ============================================

  /** Seal a settings key/value pair. */
  sealSetting(key: string, value: string): void {
    this.seal('settings', key, value ?? '');
  }

  /** Seal a user's role. */
  sealUserRole(userId: number, role: string): void {
    this.seal('users', `role:${userId}`, role);
  }

  /** Seal a period lock. */
  sealPeriodLock(year: number, month: number, isLocked: number): void {
    this.seal('period_locks', `${year}-${month}`, isLocked.toString());
  }

  // ============================================
  // Bulk operations
  // ============================================

  /**
   * Seal all current critical values. Called on first boot, after restore,
   * or when the install secret changes. Overwrites all existing seals.
   */
  sealAll(): void {
    if (!this.hmacKey) {
      console.warn('[IntegrityService] No install secret — skipping sealAll');
      return;
    }

    // Seal critical settings
    for (const key of PROTECTED_SETTINGS) {
      const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
      if (row) {
        this.sealSetting(key, row.value ?? '');
      }
    }

    // Seal all user roles
    const users = this.db.prepare('SELECT id, role FROM users').all() as { id: number; role: string }[];
    for (const u of users) {
      this.sealUserRole(u.id, u.role);
    }

    // Seal all period locks
    const locks = this.db.prepare('SELECT year, month, is_locked FROM period_locks').all() as { year: number; month: number; is_locked: number }[];
    for (const l of locks) {
      this.sealPeriodLock(l.year, l.month, l.is_locked);
    }
  }

  /**
   * Verify all integrity seals against current DB values.
   * Returns an array of violations (empty if everything is intact).
   */
  verifyAll(): IntegrityViolation[] {
    const violations: IntegrityViolation[] = [];
    if (!this.hmacKey) {
      console.warn('[IntegrityService] No install secret — cannot verify integrity');
      return violations;
    }

    // 1. Verify sealed settings
    for (const key of PROTECTED_SETTINGS) {
      const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
      const seal = this.db.prepare('SELECT value_hash FROM integrity_hashes WHERE table_name = ? AND record_key = ?')
        .get('settings', key) as { value_hash: string } | undefined;

      if (!row) {
        // Setting was deleted — if a seal exists, that's tampering
        if (seal) {
          violations.push({ tableName: 'settings', recordKey: key, type: 'missing_record', message: `Setting '${key}' was deleted but has an integrity seal — possible tampering.` });
        }
        continue;
      }

      if (!seal) {
        // Setting exists but no seal — could be a new setting or tampering
        // Only flag if the setting is one we protect AND has been around long enough
        // On first boot after migration, sealAll() will seal these.
        continue;
      }

      const expectedHmac = this.computeHmac('settings', key, row.value ?? '');
      if (seal.value_hash !== expectedHmac) {
        violations.push({ tableName: 'settings', recordKey: key, type: 'hash_mismatch', message: `Setting '${key}' was modified outside the application — possible tampering.` });
      }
    }

    // 2. Verify user roles
    const users = this.db.prepare('SELECT id, role FROM users').all() as { id: number; role: string }[];
    for (const u of users) {
      const recordKey = `role:${u.id}`;
      const seal = this.db.prepare('SELECT value_hash FROM integrity_hashes WHERE table_name = ? AND record_key = ?')
        .get('users', recordKey) as { value_hash: string } | undefined;

      if (!seal) {
        // No seal — could be a new user (not yet sealed) or tampering.
        // Only flag if the user has admin role (high-value target).
        if (u.role === 'admin') {
          violations.push({ tableName: 'users', recordKey, type: 'missing_seal', message: `Admin user id=${u.id} has no integrity seal — possible direct DB insertion or privilege escalation.` });
        }
        continue;
      }

      const expectedHmac = this.computeHmac('users', recordKey, u.role);
      if (seal.value_hash !== expectedHmac) {
        violations.push({ tableName: 'users', recordKey, type: 'hash_mismatch', message: `Role for user id=${u.id} was modified outside the application — possible privilege escalation.` });
      }
    }

    // 3. Verify period locks
    const locks = this.db.prepare('SELECT year, month, is_locked FROM period_locks').all() as { year: number; month: number; is_locked: number }[];
    for (const l of locks) {
      const recordKey = `${l.year}-${l.month}`;
      const seal = this.db.prepare('SELECT value_hash FROM integrity_hashes WHERE table_name = ? AND record_key = ?')
        .get('period_locks', recordKey) as { value_hash: string } | undefined;

      if (!seal) {
        // No seal — could be a new lock (not yet sealed) or tampering
        continue;
      }

      const expectedHmac = this.computeHmac('period_locks', recordKey, l.is_locked.toString());
      if (seal.value_hash !== expectedHmac) {
        violations.push({ tableName: 'period_locks', recordKey, type: 'hash_mismatch', message: `Period lock ${l.month}/${l.year} was modified outside the application — possible period unlocking.` });
      }
    }

    // 4. Check for orphaned seals (records that were deleted from DB but seals remain)
    const allSeals = this.db.prepare('SELECT table_name, record_key FROM integrity_hashes').all() as { table_name: string; record_key: string }[];
    for (const s of allSeals) {
      if (s.table_name === 'settings') {
        const row = this.db.prepare('SELECT 1 FROM settings WHERE key = ?').get(s.record_key);
        if (!row) {
          // Already flagged in step 1 if it's a protected setting
          if (!PROTECTED_SETTINGS.includes(s.record_key)) {
            violations.push({ tableName: s.table_name, recordKey: s.record_key, type: 'missing_record', message: `Sealed setting '${s.record_key}' no longer exists in the database.` });
          }
        }
      } else if (s.table_name === 'users') {
        // record_key is "role:<id>"
        const userId = parseInt(s.record_key.split(':')[1] || '0', 10);
        if (userId) {
          const row = this.db.prepare('SELECT 1 FROM users WHERE id = ?').get(userId);
          if (!row) {
            // User was deleted — this is OK if done through the app (which should unseal)
            // If not unsealed, flag as possible data loss
            violations.push({ tableName: s.table_name, recordKey: s.record_key, type: 'missing_record', message: `Sealed user id=${userId} no longer exists — user was deleted without removing the integrity seal.` });
          }
        }
      } else if (s.table_name === 'period_locks') {
        const [yearStr, monthStr] = s.record_key.split('-');
        const year = parseInt(yearStr || '0', 10);
        const month = parseInt(monthStr || '0', 10);
        if (year && month) {
          const row = this.db.prepare('SELECT 1 FROM period_locks WHERE year = ? AND month = ?').get(year, month);
          if (!row) {
            violations.push({ tableName: s.table_name, recordKey: s.record_key, type: 'missing_record', message: `Sealed period lock ${month}/${year} was deleted from the database — possible period unlocking.` });
          }
        }
      }
    }

    return violations;
  }
}
