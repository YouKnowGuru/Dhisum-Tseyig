import { DatabaseManager } from '../database/DatabaseManager';
import { encryptBuffer, decryptBuffer } from '../utils/encryption';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import type { ApiResponse } from '../types';

/**
 * SQLite file header — used to distinguish plaintext backups from encrypted ones.
 */
const SQLITE_HEADER = Buffer.from('SQLite format 3\0', 'utf8');

/**
 * BackupService - Handles database backup and restore operations
 */
export class BackupService {
  private dbPath: string;
  private securePath: string;
  private backupDir: string;
  private dbManager: DatabaseManager;

  constructor(dbManager: DatabaseManager, userDataPath: string) {
    this.dbManager = dbManager;
    this.dbPath = path.join(userDataPath, 'dhisum_tseyig.db');
    this.securePath = this.dbPath + '.secure';
    this.backupDir = path.join(userDataPath, 'backups');

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create a manual backup to a specific path.
   * SECURITY FIX: Backups are now encrypted (AES-256-CBC + HMAC) so they
   * cannot be edited with a SQLite editor to inject changes.
   */
  createBackup(destinationPath: string): ApiResponse<{ path: string }> {
    try {
      this.flushDatabaseToDisk();

      // Read DB into memory, encrypt, and write to destination
      const dbBuffer = fs.readFileSync(this.dbPath);
      const encrypted = encryptBuffer(dbBuffer);
      fs.writeFileSync(destinationPath, encrypted);

      console.log(`Backup created (encrypted): ${destinationPath}`);

      return {
        success: true,
        data: { path: destinationPath },
        message: 'Backup created successfully'
      };
    } catch (error: any) {
      console.error('Create backup error:', error);
      return {
        success: false,
        message: `Backup failed: ${error.message}`
      };
    }
  }

  /**
   * Restore database from a backup file.
   * SECURITY FIX: Decrypts encrypted backups (new format) and falls back to
   * plaintext (old format) for backward compatibility. Emergency backups are
   * also encrypted.
   */
  restoreBackup(backupPath: string): ApiResponse {
    try {
      // Verify backup file exists
      if (!fs.existsSync(backupPath)) {
        return {
          success: false,
          message: 'Backup file not found'
        };
      }

      // Create emergency backup of current database (encrypted)
      const emergencyBackup = path.join(this.backupDir, `emergency_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.db`);
      if (fs.existsSync(this.dbPath)) {
        this.flushDatabaseToDisk();
        const dbBuffer = fs.readFileSync(this.dbPath);
        const encrypted = encryptBuffer(dbBuffer);
        fs.writeFileSync(emergencyBackup, encrypted);
      }

      // Close the database connection before overwriting the file
      // SQLite may have locks or WAL files that need to be flushed/closed
      this.dbManager.close();

      // Remove SQLite sidecar files so stale WAL data does not override the restored backup.
      this.deleteSqliteSidecarFiles(this.dbPath);

      // SECURITY: Delete the encrypted .secure file so the restored plaintext
      // .db is used on next boot instead of a stale encrypted version.
      try { if (fs.existsSync(this.securePath)) fs.unlinkSync(this.securePath); } catch { /* ignore */ }

      // Restore backup (decrypt if encrypted, or copy if plaintext legacy)
      try {
        const backupBuffer = fs.readFileSync(backupPath);

        // Detect encrypted vs plaintext by checking SQLite header
        const isPlaintext = backupBuffer.length >= SQLITE_HEADER.length &&
          backupBuffer.subarray(0, SQLITE_HEADER.length).equals(SQLITE_HEADER);

        if (isPlaintext) {
          // Legacy plaintext backup — write directly
          fs.writeFileSync(this.dbPath, backupBuffer);
        } else {
          // Encrypted backup — decrypt
          const decrypted = decryptBuffer(backupBuffer);
          fs.writeFileSync(this.dbPath, decrypted);
        }
      } catch (copyErr: any) {
        // Restore the emergency backup and reopen the database
        if (fs.existsSync(emergencyBackup)) {
          try {
            const emergencyBuffer = fs.readFileSync(emergencyBackup);
            const decrypted = decryptBuffer(emergencyBuffer);
            fs.writeFileSync(this.dbPath, decrypted);
          } catch {
            // Can't decrypt emergency backup — copy as-is
            fs.copyFileSync(emergencyBackup, this.dbPath);
          }
        }
        this.dbManager.reopen();
        throw copyErr;
      }

      return {
        success: true,
        message: 'Database restored successfully. The application will restart to apply changes.'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Restore failed: ${error.message}`
      };
    }
  }

  /**
   * Create daily automatic backup
   */
  createDailyBackup(): ApiResponse<{ path?: string }> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const backupFileName = `daily_backup_${today}.db`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // Check if today's backup already exists
      if (fs.existsSync(backupPath)) {
        return {
          success: true,
          message: 'Daily backup already exists'
        };
      }

      // Clean up old backups (keep last 30 days)
      this.cleanupOldBackups();

      // Create backup
      return this.createBackup(backupPath);
    } catch (error: any) {
      return {
        success: false,
        message: `Daily backup failed: ${error.message}`
      };
    }
  }

  /**
   * Get automatic backup status
   */
  getAutoBackupStatus(): ApiResponse<{
    enabled: boolean;
    lastBackup?: string;
    nextBackup?: string;
    backupCount: number;
    totalSize: number;
  }> {
    try {
      const backups = this.listBackups();
      const lastBackup = backups.length > 0 ? backups[0].created : undefined;

      // Calculate next backup time (default to 11 PM)
      const next = new Date();
      next.setHours(23, 0, 0, 0);
      if (next < new Date()) {
        next.setDate(next.getDate() + 1);
      }

      // Calculate total size
      const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

      return {
        success: true,
        data: {
          enabled: true,
          lastBackup,
          nextBackup: next.toISOString(),
          backupCount: backups.length,
          totalSize
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to get backup status: ' + error.message
      };
    }
  }

  /**
   * List all available backups
   */
  listBackups(): Array<{
    name: string;
    path: string;
    created: string;
    size: number;
  }> {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter(f => f.endsWith('.db'))
        .map(f => {
          const filePath = path.join(this.backupDir, f);
          const stats = fs.statSync(filePath);
          return {
            name: f,
            path: filePath,
            created: stats.birthtime.toISOString(),
            size: stats.size
          };
        })
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

      return backups;
    } catch (error) {
      console.error('List backups error:', error);
      return [];
    }
  }

  /**
   * Delete a backup file
   */
  deleteBackup(backupPath: string): ApiResponse {
    try {
      if (!fs.existsSync(backupPath)) {
        return {
          success: false,
          message: 'Backup file not found'
        };
      }

      fs.unlinkSync(backupPath);

      return {
        success: true,
        message: 'Backup deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Delete failed: ${error.message}`
      };
    }
  }

  /**
   * Clean up old backups (keep last 30 days)
   */
  private cleanupOldBackups(): void {
    try {
      const backups = this.listBackups();
      const maxBackups = 30;

      if (backups.length > maxBackups) {
        const oldBackups = backups.slice(maxBackups);
        for (const backup of oldBackups) {
          try {
            fs.unlinkSync(backup.path);
            console.log(`Deleted old backup: ${backup.name}`);
          } catch (error) {
            console.warn(`Failed to delete backup ${backup.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Backup cleanup error:', error);
    }
  }

  /**
   * Flush SQLite WAL contents into the main database file before copying.
   */
  private flushDatabaseToDisk(): void {
    const db = this.dbManager.getDatabase();
    db.pragma('wal_checkpoint(TRUNCATE)');
  }

  /**
   * Delete SQLite sidecar files for a database path.
   */
  private deleteSqliteSidecarFiles(databasePath: string): void {
    const sidecarFiles = [`${databasePath}-wal`, `${databasePath}-shm`];

    for (const filePath of sidecarFiles) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn(`Failed to delete SQLite sidecar file: ${filePath}`, error);
      }
    }
  }
}
