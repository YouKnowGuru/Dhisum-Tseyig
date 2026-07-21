import Database from 'better-sqlite3';
import crypto from 'crypto';
import { DatabaseManager } from '../database/DatabaseManager';
import type { ApiResponse } from '../types';

export interface AuditLog {
  id: number;
  user_id: number | null;
  username: string | null;
  full_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  old_values: string | null;
  new_values: string | null;
  ip_address: string | null;
  created_at: string;
}

/**
 * AuditService
 * Centralized service for tracking application activity and security events.
 */
export class AuditService {
  private db: Database.Database;

  // Static resolver shared across ALL AuditService instances so every service
  // (Inventory, Refund, SplitPayment, etc.) that creates its own AuditService
  // resolves the authenticated user without each caller threading userId down.
  private static currentUserResolver: (() => number | null) | null = null;

  static setCurrentUserResolver(resolver: () => number | null): void {
    AuditService.currentUserResolver = resolver;
  }

  constructor(dbManager: DatabaseManager) {
    this.db = dbManager.getDatabase();
  }

  /**
   * Record a new audit log entry with tamper-evident hash chaining.
   *
   * Each row stores `prev_hash` (the `row_hash` of the preceding row, or
   * 'GENESIS' for the first) and `row_hash` = SHA256(prev_hash + canonical
   * content). Deleting or modifying any row breaks the chain, which
   * `verifyChain()` detects on startup.
   *
   * Failures are logged but never thrown — audit is a non-critical
   * side-effect and a thrown error here would roll back the caller's
   * transaction (e.g. a sale).
   */
  logAction(params: {
    userId?: number | null;
    action: string;
    entityType?: string;
    entityId?: number | null;
    newValues?: any;
    oldValues?: any;
    ipAddress?: string;
  }): void {
    try {
      // Fallback to the static resolver if the caller didn't pass a userId,
      // so IPC-driven mutations are attributed to the logged-in user.
      let userId = params.userId;
      if (userId === undefined && AuditService.currentUserResolver) {
        userId = AuditService.currentUserResolver();
      }

      const now = new Date().toISOString();

      // Get the last row's hash for the chain
      const lastRow = this.db.prepare('SELECT row_hash FROM audit_logs ORDER BY id DESC LIMIT 1').get() as { row_hash: string | null } | undefined;
      const prevHash = lastRow?.row_hash || 'GENESIS';

      // Compute the row hash over canonical content
      const oldValuesStr = params.oldValues ? JSON.stringify(params.oldValues) : null;
      const newValuesStr = params.newValues ? JSON.stringify(params.newValues) : null;
      const content = JSON.stringify({
        user_id: userId || null,
        action: params.action,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        old_values: oldValuesStr,
        new_values: newValuesStr,
        ip_address: params.ipAddress || null,
        created_at: now,
      });
      const rowHash = crypto.createHash('sha256').update(prevHash + content).digest('hex');

      this.db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, old_values, ip_address, created_at, prev_hash, row_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId || null,
        params.action,
        params.entityType || null,
        params.entityId || null,
        newValuesStr,
        oldValuesStr,
        params.ipAddress || null,
        now,
        prevHash,
        rowHash
      );
    } catch (error: any) {
      // Always emit a non-trivial error message so missing audit entries are
      // visible in production logs. Include the action and entity so the
      // operator can correlate with the failed mutation.
      console.error(
        `[AuditService] Failed to log audit action '${params.action}' ` +
        `for ${params.entityType || '<no-entity>'}#${params.entityId ?? '?'}: `,
        error?.message || error
      );
    }
  }

  /**
   * Get all audit logs with user details
   */
  getAllLogs(limit: number = 500): ApiResponse<AuditLog[]> {
    try {
      const logs = this.db.prepare(`
        SELECT l.*, u.username, u.full_name
        FROM audit_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
        LIMIT ?
      `).all(limit) as AuditLog[];

      return { success: true, data: logs };
    } catch (error: any) {
      return { success: false, message: 'Failed to fetch audit logs: ' + error.message };
    }
  }

  /**
   * Get logs for a specific entity
   */
  getEntityLogs(entityType: string, entityId: number): ApiResponse<AuditLog[]> {
    try {
      const logs = this.db.prepare(`
        SELECT l.*, u.username, u.full_name
        FROM audit_logs l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.entity_type = ? AND l.entity_id = ?
        ORDER BY l.created_at DESC
      `).all(entityType, entityId) as AuditLog[];

      return { success: true, data: logs };
    } catch (error: any) {
      return { success: false, message: 'Failed to fetch entity logs: ' + error.message };
    }
  }

  /**
   * SECURITY: Verify the tamper-evident hash chain of audit_logs.
   *
   * Iterates through all rows in id order. For each row that has a `row_hash`:
   *   1. Checks that `prev_hash` matches the previous row's `row_hash` (or
   *      'GENESIS' for the first hashed row).
   *   2. Recomputes `row_hash` from the row content and checks it matches.
   *
   * Pre-migration rows (no `row_hash`) are skipped — the chain restarts from
   * 'GENESIS' at the first hashed row.
   *
   * Returns `{ valid: true }` if the chain is intact, or `{ valid: false,
   * brokenAt, message }` describing the first break.
   */
  verifyChain(): { valid: boolean; brokenAt: number | null; totalRows: number; hashedRows: number; message: string } {
    try {
      const rows = this.db.prepare(
        'SELECT id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at, prev_hash, row_hash FROM audit_logs ORDER BY id ASC'
      ).all() as any[];

      if (rows.length === 0) {
        return { valid: true, brokenAt: null, totalRows: 0, hashedRows: 0, message: 'No audit logs to verify.' };
      }

      let prevHash = 'GENESIS';
      let hashedRows = 0;

      for (const row of rows) {
        // Skip pre-migration rows (no row_hash)
        if (!row.row_hash) {
          prevHash = 'GENESIS';
          continue;
        }
        hashedRows++;

        // Verify prev_hash chain
        if (row.prev_hash !== prevHash) {
          return {
            valid: false,
            brokenAt: row.id,
            totalRows: rows.length,
            hashedRows,
            message: `Chain broken at row ${row.id}: prev_hash mismatch (expected ${prevHash?.substring(0, 16)}..., got ${row.prev_hash?.substring(0, 16)}...) — a row may have been deleted or inserted.`
          };
        }

        // Verify row_hash by recomputing from content
        const content = JSON.stringify({
          user_id: row.user_id,
          action: row.action,
          entity_type: row.entity_type,
          entity_id: row.entity_id,
          old_values: row.old_values,
          new_values: row.new_values,
          ip_address: row.ip_address,
          created_at: row.created_at,
        });
        const expectedHash = crypto.createHash('sha256').update(prevHash + content).digest('hex');

        if (row.row_hash !== expectedHash) {
          return {
            valid: false,
            brokenAt: row.id,
            totalRows: rows.length,
            hashedRows,
            message: `Hash mismatch at row ${row.id}: content may have been modified after logging.`
          };
        }

        prevHash = row.row_hash;
      }

      return {
        valid: true,
        brokenAt: null,
        totalRows: rows.length,
        hashedRows,
        message: `Audit log chain verified (${hashedRows} hashed rows).`
      };
    } catch (error: any) {
      return { valid: false, brokenAt: null, totalRows: 0, hashedRows: 0, message: 'Verification error: ' + error.message };
    }
  }
}
