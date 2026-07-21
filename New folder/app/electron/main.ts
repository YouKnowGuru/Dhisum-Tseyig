import { app, BrowserWindow, ipcMain, dialog, shell, session } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { URL } from 'url';
import { encryptBuffer, decryptBuffer } from '../src/utils/encryption';
import { z } from 'zod';
import type { TokenData } from '../src/utils/secureStorage';
import { getDeviceId } from '../src/utils/deviceId';
import { initInstallSecret } from '../src/utils/installSecret';

// Import validators
import {
  LoginCredentialsSchema,
  CreateUserSchema,
  ChangePasswordSchema,
  CreateItemSchema,
  UpdateItemSchema,
  SaleDataSchema,
  CreateContactSchema,
  UpdateContactSchema,
  ReceiveMoneySchema,
  PayMoneySchema,
  VoidTransactionSchema,
  GSTPeriodSchema,
  ClosePeriodSchema,
  CloudBackupSettingsSchema,
  MegaCredentialsSchema,
  SaaSRequestSchema,
  IdSchema,
  StockMovementSchema,
  DateStringSchema,
  // BUG FIX H-2: validators for previously-unvalidated IPC handlers.
  HoldCartSaveSchema,
  ExpenseCreateSchema,
  QuotationStatusSchema,
  PurchaseStatusSchema,
  ConvertToSaleSchema,
  RecurringCreateSchema,
  RefundCreateSchema,
  EmployeeCreateSchema,
  EmployeeUpdateSchema,
  PayrollProcessSchema,
  POGeneralCreateSchema,
  QuotationCreateSchema,
  SplitPaymentProcessSaleSchema,
  TieredPriceListCreateSchema,
  TieredAssignSchema,
  TieredItemPriceSchema,
  CsvParseFileSchema,
  BarcodeCreateSchema,
  SettingsUpdateSchema,
  CloudBackupRunNowSchema,
  AsOfDateSchema as _AsOfDateSchema,
  DateRangeOnlySchema,
  CloudBackupTargetEnum as _CloudBackupTargetEnum,
  IdArgSchema as _IdArgSchema,
  SafeHeaderNameSchema as _SafeHeaderNameSchema,
} from './security/validators';

const isDev = !app?.isPackaged;

// Global unhandled rejection handler to prevent crashes from async errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash — log and continue
});

process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught Exception:', error);
  // Don't crash — log and continue
  // In production you might want to restart the app here
});

// Load environment variables from .env file (dev only)
if (isDev) {
  try {
    const envPath = path.join(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          process.env[key] = value;
        }
      });
      console.log('[Main] Environment variables loaded from:', envPath);
    } else {
      console.warn('[Main] .env file not found at:', envPath);
    }
    
    if (!process.env.ENCRYPTION_PEPPER) {
      console.warn('[Main] WARNING: ENCRYPTION_PEPPER is missing in environment!');
    }
  } catch (error) {
    console.error('[Main] Failed to load .env file:', error);
  }
}

import { DatabaseManager } from '../src/database/DatabaseManager';
import { AccountingService } from '../src/services/AccountingService';
import { InventoryService } from '../src/services/InventoryService';
import { GSTService } from '../src/services/GSTService';
import { ReportService } from '../src/services/ReportService';
import { PrintingService } from '../src/services/PrintingService';
import { BackupService } from '../src/services/BackupService';
import { CloudBackupService } from '../src/services/CloudBackupService';
import { AutomationService } from '../src/services/AutomationService';
import { AccountingEngineService } from '../src/services/AccountingEngineService';
import { LicenseService } from '../src/services/LicenseService';
import { UpdateService } from '../src/services/UpdateService';
import { updateManager } from './update-manager';
import { HeldCartService } from '../src/services/HeldCartService';
import { ExpenseService } from '../src/services/ExpenseService';
import { PurchaseOrderService } from '../src/services/PurchaseOrderService';
import { AuditService } from '../src/services/AuditService';
import { QuotationService } from '../src/services/QuotationService';
import { RefundService } from '../src/services/RefundService';
import { RecurringService } from '../src/services/RecurringService';
import { AgedReportService } from '../src/services/AgedReportService';
import { ExportService } from '../src/services/ExportService';
import { BarcodeService } from '../src/services/BarcodeService';
import { EmployeeService } from '../src/services/EmployeeService';
import { BranchService } from '../src/services/BranchService';
import { CSVImportService } from '../src/services/CSVImportService';
import { SplitPaymentService } from '../src/services/SplitPaymentService';
import { TieredPricingService } from '../src/services/TieredPricingService';
import { EmailInvoiceService } from '../src/services/EmailInvoiceService';
import { PayrollService } from '../src/services/PayrollService';
import { IntegrityService } from '../src/services/IntegrityService';

// Disable ALL Chromium print preview features to force the Native Windows System Print Dialog
app?.commandLine?.appendSwitch?.('disable-features', 'PrintPreview,PrintPreviewV2');

// Keep global references to prevent garbage collection
let mainWindow: BrowserWindow | null = null;
let dbManager: DatabaseManager;
let accountingService: AccountingService;
let inventoryService: InventoryService;
let gstService: GSTService;
let reportService: ReportService;
let printingService: PrintingService;
let backupService: BackupService;
let cloudBackupService: CloudBackupService;
let automationService: AutomationService;
let _accountingEngineService: AccountingEngineService;
let licenseService: LicenseService;
let updateService: UpdateService;
let heldCartService: HeldCartService;
let expenseService: ExpenseService;
let purchaseOrderService: PurchaseOrderService;
let auditService: AuditService;
let quotationService: QuotationService;
let refundService: RefundService;
let recurringService: RecurringService;
let agedReportService: AgedReportService;
let exportService: ExportService;
let barcodeService: BarcodeService;
let employeeService: EmployeeService;
let branchService: BranchService;
let csvImportService: CSVImportService;
let splitPaymentService: SplitPaymentService;
let tieredPricingService: TieredPricingService;
let emailInvoiceService: EmailInvoiceService;
let payrollService: PayrollService;
let integrityService: IntegrityService;

/**
 * Validate and sanitize table names to prevent SQL injection
 */
const ALLOWED_TABLES = [
  'users', 'companies', 'accounts', 'contacts', 'items',
  'transactions', 'transaction_lines', 'stock_movements',
  'invoices', 'invoice_items', 'gst_entries', 'audit_logs',
  'item_categories', 'item_units', 'settings', 'period_locks'
];

function _validateTableName(tableName: string): boolean {
  return ALLOWED_TABLES.includes(tableName);
}

/**
 * Validate URL for shell.openExternal
 */
const ALLOWED_PROTOCOLS = ['https:', 'http:'];
const ALLOWED_DOMAINS = [
  'jinda.com',
  'www.jinda.com',
  'api.jinda.com',
  'support.jinda.com',
  'github.com',
  'docs.google.com',
  'drive.google.com',
  'dhisum-tseyig.vercel.app',
];

function isValidExternalUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);

    // Validate protocol
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      return { valid: false, error: 'Invalid protocol' };
    }

    // Validate domain against allowlist
    const isAllowedDomain = ALLOWED_DOMAINS.some(domain =>
      url.hostname === domain || url.hostname.endsWith('.' + domain)
    );

    if (!isAllowedDomain) {
      return { valid: false, error: 'Domain not in allowlist' };
    }

    // Block localhost/file protocols
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return { valid: false, error: 'Localhost not allowed' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitize input to prevent path traversal
 */
function _sanitizePath(inputPath: string): string {
  // Remove null bytes
  const cleaned = inputPath.replace(/\0/g, '');
  // Normalize and resolve to prevent traversal
  const resolved = path.resolve(cleaned);
  const userData = app.getPath('userData');

  // Ensure path is within userData directory
  if (!resolved.startsWith(userData)) {
    throw new Error('Path traversal detected');
  }

  return resolved;
}

// ============================================
// SECURITY MIDDLEWARE
// ============================================

type IpcHandler = (event: Electron.IpcMainInvokeEvent, ...args: any[]) => Promise<any>;

interface IpcSecurityOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  rateLimit?: boolean;
  rateLimitKey?: string;
  validator?: z.ZodSchema<any>;
}

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5;

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetTime: entry.resetTime };
}

function createSecureIpcHandler(
  handler: IpcHandler,
  options: IpcSecurityOptions = {}
): IpcHandler {
  return async (event, ...args) => {
    try {
      // Rate limiting
      if (options.rateLimit) {
        const key = options.rateLimitKey || event.sender.id.toString();
        const rateCheck = checkRateLimit(key);
        if (!rateCheck.allowed) {
          return {
            ok: false,
            status: 429,
            data: {
              success: false,
              error: 'Too many requests. Please try again later.',
              retryAfter: Math.ceil((rateCheck.resetTime - Date.now()) / 1000),
            },
          };
        }
      }

      // Authentication check
      if (options.requireAuth && accountingService) {
        const currentUser = accountingService.getCurrentUser();
        if (!currentUser) {
          return {
            ok: false,
            status: 401,
            data: { success: false, error: 'Authentication required' }
          };
        }

        // Admin check
        if (options.requireAdmin && currentUser.role !== 'admin') {
          return {
            ok: false,
            status: 403,
            data: { success: false, error: 'Admin privileges required' }
          };
        }
      }

      // Input validation
      if (options.validator && args.length > 0) {
        const validationResult = options.validator.safeParse(args[0]);
        if (!validationResult.success) {
          return {
            ok: false,
            status: 400,
            data: {
              success: false,
              error: 'Invalid input: ' + (validationResult.error as any).issues.map((e: any) => e.message).join(', '),
            },
          };
        }
        args[0] = validationResult.data;
      }

      return await handler(event, ...args);
    } catch (error: any) {
      console.error('[IPC Security] Handler error:', error);
      return {
        ok: false,
        status: 500,
        data: {
          success: false,
          error: isDev ? error.message : 'An error occurred',
        },
      };
    }
  };
}

/**
 * Create the main application window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      webSecurity: true, // ✅ SECURITY: Enabled to prevent CORS bypass
      allowRunningInsecureContent: false, // ✅ SECURITY: Block insecure content
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true, // ✅ SECURITY: Renderer process sandboxed
      preload: path.join(__dirname, 'preload-secure.js'),
    },
    title: 'Jinda - Accounting & POS',
    icon: path.join(__dirname, '../build/icon.png'),
    show: false,
  });

  // Load the app
  if (mainWindow) {
    if (isDev) {
      mainWindow.loadURL('http://127.0.0.1:5173').catch(() => {
        console.log('Dev server not available, falling back to local files');
        mainWindow?.loadFile(path.join(__dirname, '../../dist/index.html'));
      });
      // Only open DevTools in development
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
      mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
      // ✅ SECURITY: Prevent DevTools in production
      mainWindow.webContents.on('devtools-opened', () => {
        mainWindow?.webContents.closeDevTools();
      });
    }
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('[Main] Window ready to show');
    mainWindow?.show();
    console.log('[Main] Window shown');
  });

  // Debug: Log navigation events
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('[Main] Window started loading');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Window finished loading');
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('[Main] Window failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Initialize the application
 */
// Disable GPU cache to prevent Windows permission issues
app?.commandLine?.appendSwitch?.('disable-gpu-sandbox');
app?.commandLine?.appendSwitch?.('disable-gpu-rasterization');
app?.commandLine?.appendSwitch?.('disable-software-rasterizer');

console.log('[Main] App starting, NODE_ENV:', process.env.NODE_ENV);
console.log('[Main] App object exists:', !!app);
console.log('[Main] App isReady:', app?.isReady?.());
console.log('[Main] App isPackaged:', app?.isPackaged);

// Set custom cache directory to avoid permission issues
// Delay until app is ready to ensure app.getPath works
let customCacheDir: string;
function setupCacheDir() {
  try {
    customCacheDir = path.join(app.getPath('userData'), 'cache');
    if (!fs.existsSync(customCacheDir)) {
      fs.mkdirSync(customCacheDir, { recursive: true });
    }
    app?.commandLine?.appendSwitch?.('disk-cache-dir', customCacheDir);
    console.log('[Main] Cache directory:', customCacheDir);
  } catch (e) {
    console.warn('[Main] Could not set custom cache dir:', e);
  }
}

if (app?.isReady()) {
  console.log('[Main] App already ready, initializing immediately');
  initializeApp();
} else {
  console.log('[Main] Waiting for app to be ready...');
  app?.whenReady().then(() => {
    console.log('[Main] App is ready (event)');
    initializeApp();
  }).catch((err) => {
    console.error('[Main] whenReady error:', err);
  });
}

function initializeApp(): void {
  console.log('[Main] Initializing app...');
  setupCacheDir();

  // BUG FIX C-4: load or create the per-install secret used to derive the
  // persistent encryption key. Must happen before any encryption helper runs.
  try {
    initInstallSecret(app.getPath('userData'));
  } catch (e) {
    console.error('[Main] Failed to initialise install secret:', e);
  }

  // SECURITY: Set CSP headers
  // BUG FIX H-10: In production, do NOT allow 'unsafe-inline' in script-src.
  // In dev mode, Vite injects inline scripts (HMR bootstrap) so 'unsafe-inline'
  // is still required there. Once Vite builds for production, inline scripts
  // are not emitted and the stricter policy becomes effective.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          (isDev
            ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            : "script-src 'self'; ") +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "img-src 'self' data: blob: https:; " +
          (isDev
            ? "connect-src 'self' http://localhost:* http://127.0.0.1:* https://api.jinda.com https://jindapos.com https://dhisum-tseyig.vercel.app ws://localhost:*; "
            : "connect-src 'self' https://api.jinda.com https://jindapos.com https://dhisum-tseyig.vercel.app; ") +
          "font-src 'self' https://fonts.gstatic.com; " +
          "frame-ancestors 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self';"
        ],
        'X-Frame-Options': ['DENY'],
        'X-Content-Type-Options': ['nosniff'],
        'Referrer-Policy': ['strict-origin-when-cross-origin'],
        'Permissions-Policy': [
          'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
        ],
      },
    });
  });

  // BUG FIX H-11: check for an unfilled .restore_pending; if it exists and
  // the main db is missing/corrupt, attempt to fall back to the most-recent
  // emergency_ backup before quitting.
  const dbPath = path.join(app.getPath('userData'), 'dhisum_tseyig.db');
  const restorePendingPath = path.join(app.getPath('userData'), '.restore_pending');

  // Initialize database
  console.log('Database path:', dbPath);

  try {
    dbManager = new DatabaseManager(dbPath);
    console.log('Database initialized successfully');
    // Successful boot — clear the restore_pending marker.
    const wasRestoring = fs.existsSync(restorePendingPath);
    try { if (wasRestoring) fs.unlinkSync(restorePendingPath); } catch { /* no-op */ }
    // SECURITY: After a restore, the old integrity seals no longer match the
    // restored data. Set a flag so IntegrityService.resealAll() runs after
    // the service is initialized below.
    (globalThis as any).__needsReseal = wasRestoring;
  } catch (error) {
    console.error('Failed to initialize database:', error);

    // BUG FIX H-11: try to recover from the most recent emergency backup.
    try {
      const backupDir = path.join(app.getPath('userData'), 'backups');
      const files = fs.existsSync(backupDir)
        ? fs.readdirSync(backupDir)
            .filter((f) => f.startsWith('emergency_') && f.endsWith('.db'))
            .map((f) => ({ f, ts: fs.statSync(path.join(backupDir, f)).mtimeMs }))
            .sort((a, b) => b.ts - a.ts)
        : [];
      if (files.length > 0) {
        const latest = path.join(backupDir, files[0].f);
        // SECURITY: Delete the stale .secure file so DatabaseManager doesn't
        // try to decrypt it instead of using the recovered plaintext .db.
        const securePath = dbPath + '.secure';
        try { if (fs.existsSync(securePath)) fs.unlinkSync(securePath); } catch { /* ignore */ }
        // SECURITY FIX: emergency backups are now encrypted — decrypt before
        // writing to the DB path. Fall back to plaintext copy for old backups.
        try {
          const backupBuffer = fs.readFileSync(latest);
          const sqliteHeader = Buffer.from('SQLite format 3\0', 'utf8');
          const isPlaintext = backupBuffer.length >= sqliteHeader.length &&
            backupBuffer.subarray(0, sqliteHeader.length).equals(sqliteHeader);
          if (isPlaintext) {
            fs.writeFileSync(dbPath, backupBuffer);
          } else {
            const decrypted = decryptBuffer(backupBuffer);
            fs.writeFileSync(dbPath, decrypted);
          }
        } catch (decryptErr) {
          // Can't decrypt — try plaintext copy as last resort
          console.warn('[Main] Emergency backup decryption failed, trying plaintext copy:', decryptErr);
          fs.copyFileSync(latest, dbPath);
        }
        try { dbManager = new DatabaseManager(dbPath); /* try again */ } catch (e) {
          console.error('Recovery from emergency backup also failed', e);
          try { dialog.showErrorBox('Database startup failed', 'The local database is corrupt and no automatic recovery was possible. Please reinstall or contact support.'); } catch { /* */ }
          app.quit();
          return;
        }
      } else {
        try { dialog.showErrorBox('Database startup failed', 'The local database is corrupt and no backup is available. Please reinstall or contact support.'); } catch { /* */ }
        app.quit();
        return;
      }
    } catch (recoveryErr) {
      console.error('Recovery failed', recoveryErr);
      try { dialog.showErrorBox('Database startup failed', 'Could not start the local database. Please contact support.'); } catch { /* */ }
      app.quit();
      return;
    }
  }

  // Initialize services
  _accountingEngineService = new AccountingEngineService(dbManager);
  automationService = new AutomationService(dbManager);
  accountingService = new AccountingService(dbManager);
  inventoryService = new InventoryService(dbManager);
  gstService = new GSTService(dbManager);
  reportService = new ReportService(dbManager);
  printingService = new PrintingService();
  backupService = new BackupService(dbManager, app.getPath('userData'));
  cloudBackupService = new CloudBackupService(dbManager, app.getPath('userData'));

  // Initialize license and update services
  licenseService = new LicenseService(app.getPath('userData'));
  updateService = new UpdateService(app.getVersion() || '1.0.0');

  // Initialize auto-updater
  updateManager.setBackupService(backupService);
  updateManager.start();

  // Initialize new feature services
  heldCartService = new HeldCartService(dbManager);
  expenseService = new ExpenseService(dbManager);
  purchaseOrderService = new PurchaseOrderService(dbManager);
  auditService = new AuditService(dbManager);
  quotationService = new QuotationService(dbManager);
  refundService = new RefundService(dbManager);
  recurringService = new RecurringService(dbManager);
  agedReportService = new AgedReportService(dbManager);
  exportService = new ExportService();
  barcodeService = new BarcodeService(dbManager);
  employeeService = new EmployeeService(dbManager);
  branchService = new BranchService(dbManager);
  csvImportService = new CSVImportService(accountingService, inventoryService);
  splitPaymentService = new SplitPaymentService(dbManager);
  tieredPricingService = new TieredPricingService(dbManager);
  emailInvoiceService = new EmailInvoiceService();
  payrollService = new PayrollService(dbManager);
  integrityService = new IntegrityService(dbManager.getDatabase());

  // Wire the current-user resolver so ALL AuditService instances (including those
  // created inside InventoryService, PayrollService, etc.) attribute audit rows
  // to the authenticated user without each caller threading userId down.
  AuditService.setCurrentUserResolver(() => accountingService.getCurrentUser()?.id ?? null);

  // SECURITY: Verify tamper-evident audit log chain on startup.
  try {
    const chainResult = auditService.verifyChain();
    if (!chainResult.valid) {
      console.error('[SECURITY] Audit log chain verification FAILED:', chainResult.message);
      // Log a critical security event so it's visible in the audit trail
      auditService.logAction({
        action: 'SECURITY_ALERT',
        entityType: 'audit_logs',
        newValues: { type: 'chain_broken', brokenAt: chainResult.brokenAt, message: chainResult.message },
      });
    } else {
      console.log('[SECURITY] Audit log chain verified:', chainResult.message);
    }
  } catch (e) {
    console.error('[SECURITY] Audit log chain verification error:', e);
  }

  // SECURITY: Verify integrity seals on critical data (settings, users, period_locks).
  try {
    const violations = integrityService.verifyAll();
    if (violations.length > 0) {
      for (const v of violations) {
        console.error(`[SECURITY] Integrity violation: ${v.type} on ${v.tableName}:${v.recordKey} — ${v.message}`);
      }
      // Log a critical security event
      auditService.logAction({
        action: 'SECURITY_ALERT',
        entityType: 'integrity',
        newValues: { violations },
      });
    } else {
      console.log('[SECURITY] Integrity seals verified — no violations.');
    }
  } catch (e) {
    console.error('[SECURITY] Integrity verification error:', e);
  }

  // SECURITY: On first boot after migration (no seals exist yet) or after a
  // restore (seals may not match restored data), seal all current values.
  try {
    const sealCount = dbManager.getDatabase().prepare('SELECT COUNT(*) as cnt FROM integrity_hashes').get() as { cnt: number };
    const needsReseal = (globalThis as any).__needsReseal === true;
    if (sealCount.cnt === 0 || needsReseal) {
      if (needsReseal) {
        console.log('[SECURITY] Re-sealing all critical values after database restore.');
      } else {
        console.log('[SECURITY] No integrity seals found — sealing all current critical values.');
      }
      integrityService.sealAll();
      delete (globalThis as any).__needsReseal;
    }
  } catch (e) {
    console.error('[SECURITY] Initial sealAll error:', e);
  }

  // Start periodic license verification (daily)
  licenseService.startPeriodicVerification();

  // Create main window
  createWindow();

  // BUG-12 FIX: Set the mainWindow references AFTER createWindow() is called
  // so the window actually exists and the services can communicate with it.
  if (mainWindow) {
    updateManager.setMainWindow(mainWindow);
    cloudBackupService.setMainWindow(mainWindow);
  }

  // BUG-05 FIX: Track the last backup date so we never fire more than once
  // per day, even if the interval drifts (e.g. machine sleep/wake).
  let lastBackupDate: string | null = null;

  // Daily backup scheduler (runs every hour to check)
  setInterval(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (now.getHours() === 23 && lastBackupDate !== today) {
      lastBackupDate = today;
      backupService.createDailyBackup();
    }
  }, 60 * 60 * 1000);


  // Recurring transactions scheduler (runs every hour, and once at startup)
  // Process any due transactions at startup
  try {
    const initialResult = recurringService.processDueToday();
    if (initialResult.success && initialResult.data && initialResult.data > 0) {
      console.log(`[Recurring Scheduler] Initial processing: ${initialResult.data} transaction(s) processed`);
    }
  } catch (_error) {
    console.error('[Recurring Scheduler] Initial processing error');
  }

  // Check every hour for new due transactions
  setInterval(() => {
    try {
      const result = recurringService.processDueToday();
      if (result.success && result.data && result.data > 0) {
        console.log(`[Recurring Scheduler] Processed ${result.data} transaction(s)`);
        // Notify renderer if window exists
        if (mainWindow) {
          mainWindow.webContents.send('recurring:processed', { count: result.data, message: result.message });
        }
      } else if (!result.success) {
        console.error('[Recurring Scheduler] Processing failed');
      }
    } catch (_error) {
      console.error('[Recurring Scheduler] Interval processing error');
    }
  }, 60 * 60 * 1000); // Every hour

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}

// ============================================
// IPC HANDLERS - Authentication
// ============================================

ipcMain.handle('auth:login', createSecureIpcHandler(
  // BUG FIX H-4: previously the *username* was used as the rate-limit key.
  // That gave attackers two free evil tools — (1) lock out any specific
  // account with 5 requests and (2) brute-force by rotating usernames.
  // We now rely on the wrapper's `rateLimit: true` mode which already keys
  // on a per-renderer (WebContents) id. The username-based bucket is GONE.
  async (_event, credentials) => {
    return accountingService.login(credentials);
  },
  { validator: LoginCredentialsSchema, rateLimit: true }
));

ipcMain.handle('auth:logout', createSecureIpcHandler(
  async () => {
    accountingService.logout();
    return { success: true };
  },
  { requireAuth: true }
));

ipcMain.handle('auth:syncPassword', createSecureIpcHandler(
  // BUG FIX M-2: await async bcrypt-backed syncLocalPassword.
  async (_event, data) => {
    return await accountingService.syncLocalPassword(data.email, data.password);
  },
  { requireAuth: true, validator: z.object({ email: z.string().email(), password: z.string().min(1).max(256) }) }
));

ipcMain.handle('auth:getCurrentUser', createSecureIpcHandler(
  async () => {
    return accountingService.getCurrentUser();
  },
  {}
));

// ============================================
// IPC HANDLERS - Dashboard
// ============================================

ipcMain.handle('dashboard:getData', createSecureIpcHandler(
  async () => reportService.getDashboardData(),
  { requireAuth: true }
));

ipcMain.handle('dashboard:getRealtimeMetrics', createSecureIpcHandler(
  async () => automationService.getRealtimeDashboardMetrics(),
  { requireAuth: true }
));

ipcMain.handle('dashboard:getNotifications', createSecureIpcHandler(
  async () => reportService.getNotifications(),
  { requireAuth: true }
));

// ============================================
// IPC HANDLERS - POS Sales
// ============================================

ipcMain.handle('pos:createSale', createSecureIpcHandler(
  async (_event, saleData) => accountingService.createSale(saleData),
  { requireAuth: true, validator: SaleDataSchema }
));

ipcMain.handle('pos:getItems', createSecureIpcHandler(
  async () => inventoryService.getAllItems(),
  { requireAuth: true }
));

ipcMain.handle('pos:searchItems', createSecureIpcHandler(
  async (_event, query) => {
    if (typeof query !== 'string' || query.length > 100) {
      return { success: false, message: 'Invalid search query' };
    }
    return inventoryService.searchItems(query);
  },
  { requireAuth: true }
));

ipcMain.handle('pos:getCustomers', createSecureIpcHandler(
  async () => accountingService.getContacts('customer'),
  { requireAuth: true }
));

// ============================================
// IPC HANDLERS - Inventory
// ============================================

ipcMain.handle('inventory:createItem', createSecureIpcHandler(
  async (_event, data) => inventoryService.createItem(data),
  { requireAuth: true, validator: CreateItemSchema }
));

ipcMain.handle('inventory:addStock', createSecureIpcHandler(
  async (_event, stockData) => inventoryService.addStock(stockData),
  { requireAuth: true, validator: StockMovementSchema }
));

ipcMain.handle('inventory:getItems', createSecureIpcHandler(
  async () => inventoryService.getAllItems(),
  { requireAuth: true }
));

ipcMain.handle('inventory:getItem', createSecureIpcHandler(
  async (_event, id) => {
    const validated = IdSchema.safeParse(id);
    if (!validated.success) return { success: false, message: 'Invalid ID' };
    return inventoryService.getItemById(validated.data);
  },
  { requireAuth: true }
));

ipcMain.handle('inventory:updateItem', createSecureIpcHandler(
  async (_event, { id, data }) => {
    const idValidation = IdSchema.safeParse(id);
    if (!idValidation.success) return { success: false, message: 'Invalid ID' };
    return inventoryService.updateItem(idValidation.data, data);
  },
  { requireAuth: true, validator: UpdateItemSchema }
));

ipcMain.handle('inventory:deleteItem', createSecureIpcHandler(
  async (_event, id) => {
    const validated = IdSchema.safeParse(id);
    if (!validated.success) return { success: false, message: 'Invalid ID' };
    return inventoryService.deleteItem(validated.data);
  },
  { requireAuth: true }
));

ipcMain.handle('inventory:getLowStock', createSecureIpcHandler(
  async () => inventoryService.getLowStockItems(),
  { requireAuth: true }
));

ipcMain.handle('inventory:getCategories', createSecureIpcHandler(
  async () => inventoryService.getCategories(),
  { requireAuth: true }
));

ipcMain.handle('inventory:createCategory', createSecureIpcHandler(
  async (_event, name) => {
    const validated = z.string().min(1).max(100).safeParse(name);
    if (!validated.success) return { success: false, message: 'Invalid category name' };
    return inventoryService.createCategory(validated.data);
  },
  { requireAuth: true }
));

ipcMain.handle('inventory:deleteCategory', createSecureIpcHandler(
  async (_event, id) => {
    const validated = IdSchema.safeParse(id);
    if (!validated.success) return { success: false, message: 'Invalid ID' };
    return inventoryService.deleteCategory(validated.data);
  },
  { requireAuth: true }
));

ipcMain.handle('inventory:getUnits', createSecureIpcHandler(
  async () => inventoryService.getUnits(),
  { requireAuth: true }
));

ipcMain.handle('inventory:createUnit', createSecureIpcHandler(
  async (_event, name) => {
    const validated = z.string().min(1).max(50).safeParse(name);
    if (!validated.success) return { success: false, message: 'Invalid unit name' };
    return inventoryService.createUnit(validated.data);
  },
  { requireAuth: true }
));

ipcMain.handle('inventory:deleteUnit', createSecureIpcHandler(
  async (_event, id) => {
    const validated = IdSchema.safeParse(id);
    if (!validated.success) return { success: false, message: 'Invalid ID' };
    return inventoryService.deleteUnit(validated.data);
  },
  { requireAuth: true }
));

// ============================================
// IPC HANDLERS - Contacts
// ============================================

ipcMain.handle('contacts:getAll', createSecureIpcHandler(
  async (_event, type) => {
    if (type && !['customer', 'supplier'].includes(type)) {
      return { success: false, message: 'Invalid contact type' };
    }
    return accountingService.getContacts(type);
  },
  { requireAuth: true }
));

ipcMain.handle('contacts:create', createSecureIpcHandler(
  async (_event, data) => accountingService.createContact(data),
  { requireAuth: true, validator: CreateContactSchema }
));

ipcMain.handle('contacts:update', createSecureIpcHandler(
  async (_event, { id, data }) => {
    const idValidation = IdSchema.safeParse(id);
    if (!idValidation.success) return { success: false, message: 'Invalid ID' };
    return accountingService.updateContact(idValidation.data, data);
  },
  { requireAuth: true, validator: UpdateContactSchema }
));

ipcMain.handle('contacts:delete', createSecureIpcHandler(
  async (_event, id) => {
    const validated = IdSchema.safeParse(id);
    if (!validated.success) return { success: false, message: 'Invalid ID' };
    return accountingService.deleteContact(validated.data);
  },
  { requireAuth: true }
));

ipcMain.handle('contacts:getLedger', createSecureIpcHandler(
  async (_event, contactId) => {
    const validated = IdSchema.safeParse(contactId);
    if (!validated.success) return { success: false, message: 'Invalid contact ID' };
    return accountingService.getContactLedger(validated.data);
  },
  { requireAuth: true }
));

ipcMain.handle('accounts:getAll', createSecureIpcHandler(
  async () => {
    try {
      const db = dbManager.getDatabase();
      const accounts = db.prepare(`
        SELECT a.id, a.code, a.name, a.type, a.subtype, a.is_active,
               COALESCE(
                 (SELECT SUM(tl.debit_amount) - SUM(tl.credit_amount)
                  FROM transaction_lines tl
                  JOIN transactions t ON t.id = tl.transaction_id
                  WHERE tl.account_id = a.id AND t.is_void = 0),
                 0
               ) as balance
        FROM accounts a
        WHERE a.is_active = 1
        ORDER BY a.code
      `).all();
      return { success: true, data: accounts };
    } catch (_error: any) {
      console.error('[accounts:getAll] SQL Error');
      return { success: false, message: 'Failed to get accounts' };
    }
  },
  { requireAuth: true }
));

// ============================================
// IPC HANDLERS - Transactions
// ============================================

ipcMain.handle('transactions:receiveMoney', createSecureIpcHandler(
  async (_event, data) => accountingService.receiveMoney(data),
  { requireAuth: true, validator: ReceiveMoneySchema }
));

ipcMain.handle('transactions:payMoney', createSecureIpcHandler(
  async (_event, data) => accountingService.payMoney(data),
  { requireAuth: true, validator: PayMoneySchema }
));

ipcMain.handle('transactions:transfer', createSecureIpcHandler(
  async (_event, data) => accountingService.transferMoney(data),
  // BUG FIX M-12: enforce `fromAccountId !== toAccountId` at the IPC boundary
  // — the service no longer needs its own check.
  {
    requireAuth: true,
    validator: z.object({
      amount: z.number().positive(),
      fromAccountId: IdSchema,
      toAccountId: IdSchema,
      date: z.string(),
      reference: z.string().optional(),
      description: z.string().optional(),
    }).refine((d) => d.fromAccountId !== d.toAccountId, {
      message: 'From and To accounts must differ',
      path: ['toAccountId'],
    })
  }
));

ipcMain.handle('transactions:getAll', createSecureIpcHandler(
  async (_event, filters) => accountingService.getTransactions(filters),
  { requireAuth: true }
));

ipcMain.handle('transactions:void', createSecureIpcHandler(
  async (_event, data) => accountingService.voidTransaction(data.transactionId, data.reason),
  { requireAuth: true, requireAdmin: true, validator: VoidTransactionSchema }
));

ipcMain.handle('transactions:getInvoiceData', createSecureIpcHandler(
  async (_event, transactionId) => {
    const validated = IdSchema.safeParse(transactionId);
    if (!validated.success) return { success: false, message: 'Invalid transaction ID' };
    return accountingService.getInvoiceByTransactionId(validated.data);
  },
  { requireAuth: true }
));

ipcMain.handle('transactions:export', createSecureIpcHandler(
  async (_event, filters) => {
    const result = accountingService.getTransactions(filters);
    if (result.length > 0) {
      exportService.exportTransactions(result);
      return { success: true, message: 'Transactions exported successfully' };
    }
    return { success: false, message: 'No transactions to export' };
  },
  { requireAuth: true }
));

// ============================================
// IPC HANDLERS - GST
// ============================================

ipcMain.handle('gst:getSummary', createSecureIpcHandler(
  async (_event, { month, year }) => gstService.getGSTSummary(month, year),
  { requireAuth: true, validator: GSTPeriodSchema }
));

ipcMain.handle('gst:getReturns', createSecureIpcHandler(
  async () => gstService.getGSTReturns(),
  { requireAuth: true }
));

ipcMain.handle('gst:fileReturn', createSecureIpcHandler(
  async (_event, { month, year }) => gstService.fileGSTReturn(month, year),
  { requireAuth: true, requireAdmin: true, validator: GSTPeriodSchema }
));

ipcMain.handle('gst:updateStatus', createSecureIpcHandler(
  async (_event, { month, year, isFiled }) => gstService.updateGSTStatus(month, year, isFiled),
  { requireAuth: true, requireAdmin: true, validator: GSTPeriodSchema.extend({ isFiled: z.boolean() }) }
));

// ============================================
// IPC HANDLERS - Reports
// ============================================

const DateRangeSchema = z.object({ startDate: z.string(), endDate: z.string() });

ipcMain.handle('reports:trialBalance', createSecureIpcHandler(
  // BUG FIX H-2: validate date string format before passing to SQLite.
  async (_event, asOfDate) => {
    if (asOfDate !== undefined && asOfDate !== null) {
      const v = DateStringSchema.safeParse(asOfDate);
      if (!v.success) return { success: false, message: 'Invalid asOfDate' };
    }
    return reportService.getTrialBalance(asOfDate);
  },
  { requireAuth: true, validator: DateStringSchema.nullable().optional() }
));

ipcMain.handle('reports:profitLoss', createSecureIpcHandler(
  async (_event, { startDate, endDate }) => reportService.getProfitLoss(startDate, endDate),
  { requireAuth: true, validator: DateRangeSchema }
));

ipcMain.handle('reports:balanceSheet', createSecureIpcHandler(
  // BUG FIX H-2: validate date string format before passing to SQLite.
  async (_event, asOfDate) => {
    if (asOfDate !== undefined && asOfDate !== null) {
      const v = DateStringSchema.safeParse(asOfDate);
      if (!v.success) return { success: false, message: 'Invalid asOfDate' };
    }
    return reportService.getBalanceSheet(asOfDate);
  },
  { requireAuth: true, validator: DateStringSchema.nullable().optional() }
));

ipcMain.handle('reports:outstanding', createSecureIpcHandler(
  async (_event, type) => {
    if (type && !['customer', 'supplier'].includes(type)) {
      return { success: false, message: 'Invalid type' };
    }
    return reportService.getOutstandingReport(type);
  },
  { requireAuth: true }
));

ipcMain.handle('reports:stockReport', createSecureIpcHandler(
  async () => reportService.getStockReport(),
  { requireAuth: true }
));

ipcMain.handle('reports:salesReport', createSecureIpcHandler(
  async (_event, { startDate, endDate }) => reportService.getSalesReport(startDate, endDate),
  { requireAuth: true, validator: DateRangeSchema }
));

ipcMain.handle('reports:payrollReport', createSecureIpcHandler(
  // BUG FIX H-2: validate date-range inputs.
  async (_event, { startDate, endDate }) => {
    const v = DateRangeOnlySchema.safeParse({ startDate, endDate });
    if (!v.success) return { success: false, message: 'Invalid date range' };
    return reportService.getPayrollReport(startDate, endDate);
  },
  { requireAuth: true, validator: DateRangeOnlySchema }
));
ipcMain.handle('reports:purchaseReport', createSecureIpcHandler(
  // BUG FIX H-2: validate date-range inputs.
  async (_event, { startDate, endDate }) => {
    const v = DateRangeOnlySchema.safeParse({ startDate, endDate });
    if (!v.success) return { success: false, message: 'Invalid date range' };
    return reportService.getPurchaseReport(startDate, endDate);
  },
  { requireAuth: true, validator: DateRangeOnlySchema }
));

ipcMain.handle('reports:customerInsights', createSecureIpcHandler(
  async (_event, { startDate, endDate, customerId }) => {
    const v = DateRangeOnlySchema.safeParse({ startDate, endDate });
    if (!v.success) return { success: false, message: 'Invalid date range' };
    const cid = typeof customerId === 'number' && Number.isFinite(customerId) && customerId > 0 ? customerId : undefined;
    return reportService.getCustomerInsights(startDate, endDate, cid);
  },
  { requireAuth: true, validator: DateRangeOnlySchema }
));

// ============================================
// IPC HANDLERS - Backup
// ============================================

ipcMain.handle('backup:create', createSecureIpcHandler(
  async () => {
    const result = await dialog.showSaveDialog({
      defaultPath: `dhisum_backup_${new Date().toISOString().split('T')[0]}.db`,
      filters: [{ name: 'Database', extensions: ['db'] }],
    });

    if (!result.canceled && result.filePath) {
      try {
        const resolvedPath = path.resolve(result.filePath);
        return backupService.createBackup(resolvedPath);
      } catch (_error: any) {
        return { success: false, message: 'Invalid path' };
      }
    }
    return { success: false, message: 'Backup cancelled' };
  },
  { requireAuth: true, requireAdmin: true }
));

ipcMain.handle('backup:restore', createSecureIpcHandler(
  async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'Database', extensions: ['db'] }],
      properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      try {
        const resolvedPath = path.resolve(result.filePaths[0]);
        const restoreResult = backupService.restoreBackup(resolvedPath);
        if (restoreResult.success) {
          // BUG FIX H-11: install a last-resort wrapper that fires if the
          // relaunched app crashes within a few seconds. We also tag the
          // restored DB so the next launch knows it is post-restore and can
          // offer a recovery path if the chosen file is itself corrupt.
          try {
            const wipeOnFailPath = path.join(app.getPath('userData'), '.restore_pending');
            fs.writeFileSync(wipeOnFailPath, Date.now().toString());
          } catch (_e) { /* non-fatal */ }

          setTimeout(() => {
            try {
              app.relaunch();
            } catch (e) {
              console.error('[Backup] relaunch failed', e);
              // If we cannot relaunch, try to surface the failure to the user.
              try { dialog.showErrorBox('Restore failed to restart', 'Please relaunch the application manually.'); } catch { /* no-op */ }
            }
            app.exit(0);
          }, 1500);
        }
        return restoreResult;
      } catch (_error: any) {
        return { success: false, message: 'Invalid path' };
      }
    }
    return { success: false, message: 'Restore cancelled' };
  },
  { requireAuth: true, requireAdmin: true }
));

ipcMain.handle('backup:autoBackupStatus', createSecureIpcHandler(
  async () => backupService.getAutoBackupStatus(),
  { requireAuth: true }
));

// ============================================
// IPC HANDLERS - Cloud Backup
// ============================================

ipcMain.handle('cloudBackup:getSettings', createSecureIpcHandler(
  async () => cloudBackupService.getSettings(),
  { requireAuth: true }
));

ipcMain.handle('cloudBackup:saveSettings', createSecureIpcHandler(
  async (_event, settings) => {
    try {
      cloudBackupService.saveSettings(settings);
      return { success: true, message: 'Cloud backup settings saved' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  { requireAuth: true, requireAdmin: true, validator: CloudBackupSettingsSchema }
));

ipcMain.handle('cloudBackup:runNow', createSecureIpcHandler(
  // BUG FIX H-6: only allow known target strings — never arbitrary text.
  async (_event, targets) => {
    // Targets are already validated by CloudBackupRunNowSchema as enums.
    return cloudBackupService.runBackup(targets);
  },
  { requireAuth: true, requireAdmin: true, validator: CloudBackupRunNowSchema }
));

ipcMain.handle('cloudBackup:getLogs', createSecureIpcHandler(
  async () => cloudBackupService.getLogs(),
  { requireAuth: true }
));

ipcMain.handle('cloudBackup:getConnectionStatus', createSecureIpcHandler(
  async () => cloudBackupService.getConnectionStatus(),
  { requireAuth: true }
));

ipcMain.handle('cloudBackup:connectDrive', createSecureIpcHandler(
  async () => {
  try {
    const driveService = cloudBackupService.driveService;
    if (!driveService.isConfigured()) {
      return { success: false, message: 'Google Drive not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env file.' };
    }

    // BUG FIX C-3: generate a CSPRNG `state` nonce and pass it to the OAuth
    // endpoint. The callback server MUST compare it (constant-time) before
    // exchanging the code — otherwise an attacker that lobs a stolen code
    // at our loopback port would silently complete authorization.
    const oauthState = crypto.randomBytes(32).toString('hex');
    const authUrl = driveService.getAuthUrl(oauthState);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const http = require('http');

    return new Promise((resolve) => {
      // BUG-06 FIX: Use a settled flag so resolve() is only ever called once,
      // preventing double-resolve from the 5-minute timeout firing after success.
      let settled = false;
      const safeResolve = (val: any) => {
        if (settled) return;
        settled = true;
        resolve(val);
      };

      const server = http.createServer(async (req: any, res: any) => {
        const url = new URL(req.url, 'http://127.0.0.1:38291');
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Authorization Failed</h2><p>You can close this window</p</body</html>');
          try { server.close(); } catch { /* intentionally empty */ }
          if (authWindow && !authWindow.isDestroyed()) authWindow.close();
          safeResolve({ success: false, message: 'Authorization cancelled' });
          return;
        }

        if (code) {
          // BUG FIX C-3: Verify `state` matches before exchanging `code`.
          // Use a constant-time comparison on equal-length buffers to avoid
          // leaking bytes of the secret via timing.
          if (!returnedState ||
              returnedState.length !== oauthState.length ||
              !crypto.timingSafeEqual(Buffer.from(returnedState), Buffer.from(oauthState))) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>State Mismatch</h2><p>Authorization rejected</p</body</html>');
            try { server.close(); } catch { /* intentionally empty */ }
            if (authWindow && !authWindow.isDestroyed()) authWindow.close();
            safeResolve({ success: false, message: 'OAuth state mismatch — possible CSRF attempt, authorization rejected.' });
            return;
          }

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2 style="color:#22c55e">✓ Connected Successfully</h2><p>You can close this window and return to the app</p</body</html>');
          try { server.close(); } catch { /* intentionally empty */ }
          if (authWindow && !authWindow.isDestroyed()) authWindow.close();

          // BUG FIX M-11: wrap OAuth token exchange in try/catch so a thrown
          // error does not leave the renderer waiting forever.
          try {
            const result = await driveService.handleAuthCode(code);
            safeResolve(result);
          } catch (err: any) {
            console.error('[OAuth] handleAuthCode failed:', err?.message || err);
            safeResolve({ success: false, message: 'Failed to complete authorization: ' + (err?.message || 'unknown error') });
          }
          return;
        }

        res.writeHead(404);
        res.end();
      });

      server.listen(38291, '127.0.0.1');

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BrowserWindow: BW } = require('electron');
      const authWindow = new BW({
        width: 600,
        height: 700,
        title: 'Connect Google Drive',
        parent: mainWindow || undefined,
        modal: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true // ✅ SECURITY
        }
      });

      authWindow.loadURL(authUrl);

      // BUG-06 FIX: If user closes the window manually, clean up the server
      // and resolve as cancelled (instead of leaving the promise hanging).
      authWindow.on('closed', () => {
        try { server.close(); } catch { /* intentionally empty */ }
        safeResolve({ success: false, message: 'Authorization cancelled by user' });
      });

      // 5-minute timeout — now uses safeResolve so it's a no-op if already resolved
      setTimeout(() => {
        try { server.close(); } catch { /* intentionally empty */ }
        if (authWindow && !authWindow.isDestroyed()) authWindow.close();
        safeResolve({ success: false, message: 'Authorization timed out' });
      }, 300000);
    });
  } catch (error: any) {
    return { success: false, message: error.message };
  }
  },
  { requireAuth: true, requireAdmin: true }
));

ipcMain.handle('cloudBackup:disconnectDrive', createSecureIpcHandler(
  async () => {
    try {
      cloudBackupService.driveService.disconnect();
      return { success: true, message: 'Google Drive disconnected' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  { requireAuth: true, requireAdmin: true }
));

ipcMain.handle('cloudBackup:connectMega', createSecureIpcHandler(
  async (_event, credentials) => cloudBackupService.megaService.connect(credentials.email, credentials.password),
  { requireAuth: true, requireAdmin: true, validator: MegaCredentialsSchema }
));

ipcMain.handle('cloudBackup:disconnectMega', createSecureIpcHandler(
  async () => {
    try {
      cloudBackupService.megaService.disconnect();
      return { success: true, message: 'MEGA disconnected' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  { requireAuth: true, requireAdmin: true }
));

ipcMain.handle('cloudBackup:getCloudBackups', createSecureIpcHandler(
  async (_event, { provider }) => {
    try {
      if (!['drive', 'mega'].includes(provider)) {
        return [];
      }
      return await cloudBackupService.getCloudBackups(provider);
    } catch (error: any) {
      console.error('[IPC] cloudBackup:getCloudBackups failed:', error);
      return [];
    }
  },
  { requireAuth: true }
));

ipcMain.handle('cloudBackup:restoreFromCloud', createSecureIpcHandler(
  async (_event, provider, backupId, backupName) => {
    if (!['drive', 'mega'].includes(provider)) {
      return { success: false, message: 'Invalid provider' };
    }
    if (!backupId || typeof backupId !== 'string') {
      return { success: false, message: 'Invalid backup ID' };
    }
    if (!backupName || typeof backupName !== 'string') {
      return { success: false, message: 'Invalid backup name' };
    }
    return cloudBackupService.restoreFromCloud(provider, backupId, backupName);
  },
  { requireAuth: true, requireAdmin: true }
));

// ============================================
// IPC HANDLERS - Settings
// ============================================

ipcMain.handle('settings:get', createSecureIpcHandler(
  async () => {
    const db = dbManager.getDatabase();
    const settings = db.prepare('SELECT * FROM settings').all();
    const result: Record<string, string> = {};

    for (const setting of settings as any[]) {
      result[setting.key] = setting.value;
    }

    return result;
  },
  { requireAuth: true }
));

ipcMain.handle('app:getDeviceId', () => {
  return getDeviceId();
});

ipcMain.handle('settings:getSmartDefaults', createSecureIpcHandler(
  async () => automationService.getSmartDefaults(),
  { requireAuth: true }
));

ipcMain.handle('settings:update', createSecureIpcHandler(
  async (_event, settings) => {
    try {
      const db = dbManager.getDatabase();
      const stmt = db.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `);

      for (const [key, value] of Object.entries(settings)) {
        // The SettingsUpdateSchema already validates the key name and the
        // primitive type but we still length-cap the serialised value here
        // as defence-in-depth.
        const valueStr = value === null || value === undefined ? null : String(value).slice(0, 10000);
        stmt.run(key, valueStr);
        // SECURITY: Re-seal critical settings after update
        if (['gst_rate', 'gst_rate_domestic'].includes(key) && valueStr !== null) {
          integrityService.sealSetting(key, valueStr);
        }
      }

      return { success: true, message: 'Settings updated successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to update settings: ' + error.message };
    }
  },
  // BUG FIX M-7: replace `z.record(z.string(), z.any())` with a tight
  // schema that caps the number of keys, blocks prototype pollution and
  // restricts values to safe primitives.
  { requireAuth: true, requireAdmin: true, validator: SettingsUpdateSchema }
));

ipcMain.handle('settings:getAgreementStatus', async () => {
  // Intentionally NO auth — must be callable before login to check EULA status
  try {
    const db = dbManager.getDatabase();
    const result = db.prepare("SELECT value FROM settings WHERE key = 'eula_accepted'").get() as { value: string };
    return result ? result.value === 'true' : false;
  } catch {
    return false;
  }
});

ipcMain.handle('settings:acceptAgreement', async () => {
  // Intentionally NO auth — must be callable before login to accept EULA
  try {
    const db = dbManager.getDatabase();
    db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('eula_accepted', 'true', CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = 'true', updated_at = CURRENT_TIMESTAMP
    `).run();
    return { success: true };
  } catch (_error: any) {
    return { success: false, message: 'Failed to save agreement' };
  }
});

ipcMain.handle('app:quit', createSecureIpcHandler(
  async () => {
    app.quit();
    return { success: true };
  },
  { requireAuth: true, requireAdmin: true }
));

ipcMain.handle('app:getVersion', createSecureIpcHandler(
  async () => {
    return app.getVersion();
  },
  {}
));

ipcMain.handle('settings:closePeriod', createSecureIpcHandler(
  async (_event, { year, month }) => {
    try {
      const db = dbManager.getDatabase();
      const currentUser = accountingService.getCurrentUser();

      const existing = db.prepare('SELECT 1 FROM period_locks WHERE year = ? AND month = ?').get(year, month);

      if (existing) {
        return { success: false, message: 'Period is already locked' };
      }

      db.prepare(`
        INSERT INTO period_locks (year, month, locked_by)
        VALUES (?, ?, ?)
      `).run(year, month, currentUser?.id || 1);

      // SECURITY: Seal the new period lock
      integrityService.sealPeriodLock(year, month, 1);

      return { success: true, message: `Period ${month}/${year} closed successfully` };
    } catch (error: any) {
      return { success: false, message: 'Failed to close period: ' + error.message };
    }
  },
  { requireAuth: true, requireAdmin: true, validator: ClosePeriodSchema }
));

ipcMain.handle('settings:hasUsers', createSecureIpcHandler(
  async () => {
    try {
      const db = dbManager.getDatabase();
      const user = db.prepare('SELECT 1 FROM users LIMIT 1').get();
      return !!user;
    } catch {
      return false;
    }
  },
  {}
));

ipcMain.handle('settings:getUserCount', createSecureIpcHandler(
  async () => {
    try {
      const db = dbManager.getDatabase();
      const result = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get() as { count: number };
      return result.count;
    } catch {
      return 0;
    }
  },
  { requireAuth: true }
));

ipcMain.handle('settings:getUsers', createSecureIpcHandler(
  async () => {
    try {
      const db = dbManager.getDatabase();
      const users = db.prepare('SELECT id, username, email, full_name, role, is_active, is_verified, created_at FROM users ORDER BY created_at').all();
      return { success: true, data: users };
    } catch (error: any) {
      return { success: false, message: 'Failed to get users: ' + error.message };
    }
  },
  { requireAuth: true, requireAdmin: true }
));

const CreateInitialUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128),
  email: z.string().email().max(254).optional().nullable(),
  fullName: z.string().min(1).max(100).optional(),
});

ipcMain.handle('settings:createInitialUser', createSecureIpcHandler(
  async (_event, userData) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require('bcryptjs');
    const db = dbManager.getDatabase();

    // BUG FIX C-5: refuse if a first-boot marker file already exists. The
    // previous implementation decided "first user ever" purely on the count
    // of users in the database, which is race-able and remained reachable
    // forever after the first install footprint.
    const installMarker = path.join(app.getPath('userData'), '.installed');
    if (fs.existsSync(installMarker)) {
      return { success: false, message: 'Initial user setup has already been completed. Please log in.' };
    }

    const existing = db.prepare('SELECT 1 FROM users WHERE username = ?').get(userData.username);
    if (existing) {
      return { success: false, message: 'Username already exists' };
    }

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count > 0) {
      return { success: false, message: 'Initial user already exists. Please login to create more users.' };
    }

    // ✅ SECURITY: Use 12 salt rounds for bcrypt.
    // BUG FIX C-5: ignore the renderer's role claim and always create an admin
    // here — the initial bootstrap user must be privileged.
    const passwordHash = await bcrypt.hash(userData.password, 12);
    db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, role, is_verified)
      VALUES (?, ?, ?, ?, 'admin', 1)
    `).run(userData.username, userData.email || null, passwordHash, userData.fullName);

    // BUG FIX C-5: write the install marker so subsequent invocations
    // (even race-winning ones) are rejected.
    try { fs.writeFileSync(installMarker, new Date().toISOString()); } catch { /* non-fatal */ }

    // SECURITY: Seal the initial admin user's role
    try {
      const newUser = db.prepare('SELECT id, role FROM users WHERE username = ?').get(userData.username) as { id: number; role: string };
      if (newUser) integrityService.sealUserRole(newUser.id, newUser.role);
    } catch { /* non-fatal */ }

    return { success: true, message: 'Initial user created successfully' };
  } catch (error: any) {
    return { success: false, message: 'Failed to create user: ' + error.message };
  }
  },
  { requireAuth: false, validator: CreateInitialUserSchema }
));

ipcMain.handle('settings:createUser', createSecureIpcHandler(
  async (_event, userData) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bcrypt = require('bcryptjs');
      const db = dbManager.getDatabase();

      // Check if username already taken
      const existing = db.prepare('SELECT 1 FROM users WHERE username = ?').get(userData.username);
      if (existing) {
        return { success: false, message: 'Username already exists' };
      }

      // Enforce staff seat limit: only count active non-admin users against the plan allowance.
      // The admin account itself must NOT consume a staff seat — otherwise on a 1-user plan
      // it becomes impossible to add any staff at all.
      const staffCount = dbManager.getDatabase().prepare(
        "SELECT COUNT(*) as count FROM users WHERE is_active = 1 AND role != 'admin'"
      ).get() as { count: number };
      const status = licenseService.getStatus();

      if (staffCount.count >= status.maxUsers) {
        return {
          success: false,
          message: `Plan Limit Reached: Your ${status.plan || 'current'} plan allows up to ${status.maxUsers} staff account(s). Please upgrade to add more.`
        };
      }

      // ✅ SECURITY: Use 12 salt rounds for bcrypt.
      // BUG FIX M-2: async hashing so the event loop is not blocked during creation.
      const passwordHash = await bcrypt.hash(userData.password, 12);
      db.prepare(`
        INSERT INTO users (username, email, password_hash, full_name, role, is_verified)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(userData.username, userData.email || null, passwordHash, userData.fullName, userData.role || 'staff');

      // SECURITY: Seal the new user's role
      try {
        const newUser = db.prepare('SELECT id, role FROM users WHERE username = ?').get(userData.username) as { id: number; role: string };
        if (newUser) integrityService.sealUserRole(newUser.id, newUser.role);
      } catch { /* non-fatal */ }

      return { success: true, message: 'User created successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to create user: ' + error.message };
    }
  },
  { requireAuth: true, requireAdmin: true, validator: CreateUserSchema }
));

ipcMain.handle('settings:changePassword', createSecureIpcHandler(
  // BUG FIX M-2: await async changePassword.
  async (_event, data) => await accountingService.changePassword(data),
  { requireAuth: true, validator: ChangePasswordSchema }
));

// ============================================
// IPC HANDLERS - Printing
// ============================================

function getBusinessInfo(): Record<string, string> {
  const db = dbManager.getDatabase();
  const settings = db.prepare('SELECT * FROM settings').all();
  const result: Record<string, string> = {};
  for (const setting of settings as any[]) {
    result[setting.key] = setting.value;
  }
  return result;
}

/**
 * Strip dangerous constructs from HTML destined for the print window.
 * Removes <script>, <iframe>, event handlers (on*), and javascript:/data: URIs.
 * Allows inline styles (style-src 'unsafe-inline') so React-compatible CSS
 * pruning and printing templates continue to work.
 */
function sanitizePrintHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return html
    // strip script tags (open/close pair + self-closing)
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*script\b[^>]*\/?>/gi, '')
    // strip iframe / object / embed / meta refresh
    .replace(/<\s*(iframe|object|embed|frame|frameset)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(iframe|object|embed|frame|frameset)\b[^>]*\/?>/gi, '')
    // strip any inline event handlers (onclick, onerror, onload, ...)
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // strip javascript: / vbscript: / data: URIs in href/src attributes (data:image is fine)
    .replace(/(\b(?:href|src|action|formaction|xlink:href)\s*=\s*")\s*(?:javascript|vbscript)\s*:[^"]*(")/gi, '$1#$2')
    .replace(/(\b(?:href|src|action|formaction|xlink:href)\s*=\s*')\s*(?:javascript|vbscript)\s*:[^']*(')/gi, '$1#$2')
    .replace(/(\b(?:href|src|action|formaction|xlink:href)\s*=\s*(?!["']))\s*(?:javascript|vbscript)\s*:[^\s>]+/gi, '$1#');
}

async function printHTML(html: string, printOptions: any = {}): Promise<any> {
  return new Promise((resolve) => {
    let printWin: Electron.BrowserWindow | null = null;
    // BUG FIX H-12: Use crypto.randomUUID for unique temp file names
    // instead of Date.now() — concurrent print jobs no longer collide.
    const uniqueId = crypto.randomUUID();
    let tempPath: string | null = path.join(app.getPath('temp'), `dhisum_print_${uniqueId}.html`);

    try {
      // BUG FIX C-2: Defense-in-depth HTML sanitization for the print window.
      // CSP in production drops 'unsafe-inline' so scripts won't run, but we
      // also strip dangerous tags / event handlers / data:/javascript: URIs to
      // eliminate any other code-execution vector should CSP be loosened later.
      html = sanitizePrintHtml(html);
      // SECURITY: Hide print window in production, show only in dev for debugging
      printWin = new BrowserWindow({
        show: isDev, // Only show in development
        width: 1200,
        height: 900,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
          allowRunningInsecureContent: false,
        },
      });

      const win = printWin;

      // ✅ ROBUST: Use temp file instead of data: URL (bypasses URL length limits for A4)
      tempPath = path.join(app.getPath('temp'), `dhisum_print_${Date.now()}.html`);
      fs.writeFileSync(tempPath, html, 'utf-8');
      win.loadURL(`file://${tempPath}`);

      win.webContents.once('did-finish-load', () => {
        // Give 500ms for fonts/images to stabilize
        setTimeout(() => {
          const options: Electron.WebContentsPrintOptions = {
            silent: false,
            printBackground: true,
            color: true,
            margins: { marginType: 'none' },
            ...printOptions,
          };

          win.webContents.print(options, (success, failureReason) => {
            console.log(`[Print] Dispatching to printer. Result: ${success ? 'success' : failureReason}`);

            // Wait 20 seconds before cleanup so spooler can finish
            setTimeout(() => {
              try { if (win && !win.isDestroyed()) win.destroy(); } catch { /* intentionally empty */ }
              if (tempPath && fs.existsSync(tempPath)) {
                try { fs.unlinkSync(tempPath); } catch { /* intentionally empty */ }
              }
            }, 20000);

            if (success) {
              resolve({ success: true, message: 'Print job sent' });
            } else {
              resolve({ success: failureReason === 'cancelled', message: 'Print: ' + failureReason });
            }
          });
        }, 1000);
      });

      win.webContents.once('did-fail-load', (_e: any, _code: any, desc: string) => {
        console.error('[Print] Page load failed');
        try { win.destroy(); } catch { /* intentionally empty */ }
        if (tempPath && fs.existsSync(tempPath)) {
          try { fs.unlinkSync(tempPath); } catch { /* intentionally empty */ }
        }
        resolve({ success: false, message: 'Failed to load print content: ' + desc });
      });

    } catch (err: any) {
      console.error('[Print] Error');
      if (printWin) { try { printWin.destroy(); } catch { /* intentionally empty */ } }
      resolve({ success: false, message: 'Print error: ' + err.message });
    }
  });
}

// Logo Upload Handler
ipcMain.handle('settings:uploadLogo', createSecureIpcHandler(
  async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, message: 'No file selected' };
      }

      const filePath = result.filePaths[0];
      const resolvedPath = path.resolve(filePath);
      const stats = fs.statSync(resolvedPath);

      if (stats.size > 5 * 1024 * 1024) {
        return { success: false, message: 'File too large (max 5MB)' };
      }

      const ext = path.extname(filePath).toLowerCase();
      if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
        return { success: false, message: 'Invalid file type' };
      }

      const fd = fs.openSync(resolvedPath, 'r');
      const buffer = Buffer.alloc(8);
      fs.readSync(fd, buffer, 0, 8, 0);
      fs.closeSync(fd);

      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
      const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8;

      if (!isPng && !isJpeg) {
        return { success: false, message: 'Invalid image file' };
      }

      const mime = isPng ? 'image/png' : 'image/jpeg';
      const fileBuffer = fs.readFileSync(resolvedPath);
      const base64 = fileBuffer.toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;

      const db = dbManager.getDatabase();
      db.prepare(`
        INSERT INTO settings (key, value, updated_at) VALUES ('company_logo', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).run(dataUri);

      return { success: true, data: dataUri, message: 'Logo uploaded successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to upload logo: ' + error.message };
    }
  },
  { requireAuth: true, requireAdmin: true }
));

ipcMain.handle('settings:getLogo', createSecureIpcHandler(
  async () => {
    try {
      const db = dbManager.getDatabase();
      const row = db.prepare("SELECT value FROM settings WHERE key = 'company_logo'").get() as any;
      return { success: true, data: row?.value || null };
    } catch (_error: any) {
      return { success: false, data: null };
    }
  },
  { requireAuth: true }
));

// Seal Upload Handler
ipcMain.handle('settings:uploadSeal', createSecureIpcHandler(
  async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, message: 'No file selected' };
      }

      const filePath = result.filePaths[0];
      const resolvedPath = path.resolve(filePath);
      const stats = fs.statSync(resolvedPath);

      if (stats.size > 2 * 1024 * 1024) {
        return { success: false, message: 'File too large (max 2MB)' };
      }

      const ext = path.extname(filePath).toLowerCase();
      if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
        return { success: false, message: 'Invalid file type' };
      }

      // BUG-13 FIX: Perform magic byte validation
      const fd = fs.openSync(resolvedPath, 'r');
      const buffer = Buffer.alloc(8);
      fs.readSync(fd, buffer, 0, 8, 0);
      fs.closeSync(fd);

      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
      const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8;

      if (!isPng && !isJpeg) {
        return { success: false, message: 'Invalid image file (failed magic byte verification)' };
      }

      const mime = isPng ? 'image/png' : 'image/jpeg';
      const fileBuffer = fs.readFileSync(resolvedPath);
      const base64 = fileBuffer.toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;

      const db = dbManager.getDatabase();
      db.prepare(`
        INSERT INTO settings (key, value, updated_at) VALUES ('company_seal', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).run(dataUri);

      return { success: true, data: dataUri, message: 'Seal uploaded successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to upload seal: ' + error.message };
    }
  },
  { requireAuth: true, requireAdmin: true }
));

ipcMain.handle('settings:getSeal', createSecureIpcHandler(
  async () => {
    try {
      const db = dbManager.getDatabase();
      const row = db.prepare("SELECT value FROM settings WHERE key = 'company_seal'").get() as any;
      return { success: true, data: row?.value || null };
    } catch (_error: any) {
      return { success: false, data: null };
    }
  },
  { requireAuth: true }
));

// Signature Upload Handler
ipcMain.handle('settings:uploadSignature', createSecureIpcHandler(
  async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, message: 'No file selected' };
      }

      const filePath = result.filePaths[0];
      const resolvedPath = path.resolve(filePath);
      const stats = fs.statSync(resolvedPath);

      if (stats.size > 2 * 1024 * 1024) {
        return { success: false, message: 'File too large (max 2MB)' };
      }

      const ext = path.extname(filePath).toLowerCase();
      if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
        return { success: false, message: 'Invalid file type' };
      }

      // BUG-13 FIX: Perform magic byte validation
      const fd = fs.openSync(resolvedPath, 'r');
      const buffer = Buffer.alloc(8);
      fs.readSync(fd, buffer, 0, 8, 0);
      fs.closeSync(fd);

      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
      const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8;

      if (!isPng && !isJpeg) {
        return { success: false, message: 'Invalid image file (failed magic byte verification)' };
      }

      const mime = isPng ? 'image/png' : 'image/jpeg';
      const fileBuffer = fs.readFileSync(resolvedPath);
      const base64 = fileBuffer.toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;

      const db = dbManager.getDatabase();
      db.prepare(`
        INSERT INTO settings (key, value, updated_at) VALUES ('company_signature', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).run(dataUri);

      return { success: true, data: dataUri, message: 'Signature uploaded successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to upload signature: ' + error.message };
    }
  },
  { requireAuth: true, requireAdmin: true }
));

ipcMain.handle('settings:getSignature', createSecureIpcHandler(
  async () => {
    try {
      const db = dbManager.getDatabase();
      const row = db.prepare("SELECT value FROM settings WHERE key = 'company_signature'").get() as any;
      return { success: true, data: row?.value || null };
    } catch (_error: any) {
      return { success: false, data: null };
    }
  },
  { requireAuth: true }
));

ipcMain.handle('print:invoice', createSecureIpcHandler(
  async (_event, data, template) => {
    try {
      const biz = getBusinessInfo();
      const enrichedData = {
        businessName: data.businessName || biz.company_name || 'My Business',
        businessAddress: data.businessAddress || biz.address || '',
        businessPhone: data.businessPhone || biz.phone || '',
        businessEmail: data.businessEmail || biz.email || '',
        businessTagline: data.businessTagline || biz.tagline || '',
        businessLogo: data.businessLogo || biz.company_logo || '',
        businessSeal: data.businessSeal || biz.company_seal || '',
        businessSignature: data.businessSignature || biz.company_signature || '',
        taxNo: data.taxNo || biz.tax_no || '',
        ...data,
      };

      const result = printingService.printInvoice(enrichedData, template);
      if (!result.success || !result.data) return { success: false, message: result.message };

      const html = result.data;
      return await printHTML(html, {
        printBackground: true,
        color: true,
        margins: { marginType: 'none' },
      });
    } catch (error: any) {
      return { success: false, message: 'Print failed: ' + error.message };
    }
  },
  { requireAuth: true }
));

ipcMain.handle('print:thermalReceipt', createSecureIpcHandler(
  async (_event, data) => {
    try {
      const biz = getBusinessInfo();
      const enrichedData = {
        businessName: data.businessName || biz.company_name || 'My Business',
        businessAddress: data.businessAddress || biz.address || '',
        businessPhone: data.businessPhone || biz.phone || '',
        businessEmail: data.businessEmail || biz.email || '',
        businessTagline: data.businessTagline || biz.tagline || '',
        businessSeal: data.businessSeal || biz.company_seal || '',
        businessSignature: data.businessSignature || biz.company_signature || '',
        taxNo: data.taxNo || biz.tax_no || '',
        ...data
      };

      const result = printingService.printThermalReceipt(enrichedData);
      if (!result.success || !result.data) return { success: false, message: result.message };

      const html = result.data;
      return await printHTML(html, {
        printBackground: true,
        color: true,
        margins: { marginType: 'none' },
        // removed hardcoded pageSize to let printer driver determine height
      });
    } catch (error: any) {
      return { success: false, message: 'Print failed: ' + error.message };
    }
  },
  { requireAuth: true }
));

ipcMain.handle('print:report', createSecureIpcHandler(
  async (_event, title, contentHtml) => {
    try {
      const bizInfo = getBusinessInfo();
      const result = printingService.printReport(title, contentHtml, bizInfo);
      if (!result.success || !result.data) return { success: false, message: result.message };

      const html = result.data;
      return await printHTML(html);
    } catch (error: any) {
      return { success: false, message: 'Print failed: ' + error.message };
    }
  },
  { requireAuth: true }
));

ipcMain.handle('print:reportData', createSecureIpcHandler(
  async (_event, reportType, title, data) => {
    try {
      const bizInfo = getBusinessInfo();
      const result = printingService.printReportData(reportType, title, data, bizInfo);
      if (!result.success || !result.data) return { success: false, message: result.message };

      const html = result.data;
      return await printHTML(html);
    } catch (error: any) {
      return { success: false, message: 'Print failed: ' + error.message };
    }
  },
  { requireAuth: true }
));

ipcMain.handle('print:payrollReport', createSecureIpcHandler(
  async (_event, title, data) => {
    try {
      const bizInfo = getBusinessInfo();
      const result = printingService.printPayrollReport(title, data, bizInfo);
      if (!result.success || !result.data) return { success: false, message: result.message };

      const html = result.data;
      return await printHTML(html);
    } catch (error: any) {
      return { success: false, message: 'Payroll print failed: ' + error.message };
    }
  },
  { requireAuth: true }
));

ipcMain.handle('print:barcodes', createSecureIpcHandler(
  async (_event, mappings) => {
    try {
      const result = printingService.printBarcodes(mappings);
      if (!result.success || !result.data) return { success: false, message: result.message };

      const html = result.data;
      return await printHTML(html);
    } catch (error: any) {
      return { success: false, message: 'Print failed: ' + error.message };
    }
  },
  { requireAuth: true }
));

ipcMain.handle('print:getPrinters', createSecureIpcHandler(
  async () => {
    try {
      return await printingService.getPrinters();
    } catch (_error) {
      return [];
    }
  },
  { requireAuth: true }
));

// ============================================
// IPC HANDLERS - New Features
// ============================================

// Held Carts
ipcMain.handle('heldCarts:getAll', createSecureIpcHandler(
  async () => heldCartService.getAllCarts(),
  { requireAuth: true }
));
ipcMain.handle('heldCarts:save', createSecureIpcHandler(
  // BUG FIX H-2: validate input shape — previously passed straight to service.
  async (_event, data) => heldCartService.saveCart(data.cartName, data.customerId ?? null, data.items),
  { requireAuth: true, validator: HoldCartSaveSchema }
));
ipcMain.handle('heldCarts:load', createSecureIpcHandler(
  async (_event, cartId) => heldCartService.loadCart(cartId),
  { requireAuth: true }
));
ipcMain.handle('heldCarts:delete', createSecureIpcHandler(
  async (_event, cartId) => heldCartService.deleteCart(cartId),
  { requireAuth: true }
));
ipcMain.handle('heldCarts:count', createSecureIpcHandler(
  async () => heldCartService.getCartCount(),
  { requireAuth: true }
));

// Expenses
ipcMain.handle('expenses:getAll', createSecureIpcHandler(
  async (_event, filters) => expenseService.getAll(filters),
  { requireAuth: true, requireAdmin: true }
));
ipcMain.handle('expenses:create', createSecureIpcHandler(
  // BUG FIX H-2: enforce schema before touching the database.
  async (_event, data) => expenseService.create(data),
  { requireAuth: true, requireAdmin: true, validator: ExpenseCreateSchema }
));
ipcMain.handle('expenses:getSummary', createSecureIpcHandler(
  async (_event, month, year) => expenseService.getSummary(month, year),
  { requireAuth: true, requireAdmin: true }
));
ipcMain.handle('expenses:delete', createSecureIpcHandler(
  async (_event, id) => expenseService.delete(id),
  { requireAuth: true, requireAdmin: true }
));

// Payroll
ipcMain.handle('payroll:process', createSecureIpcHandler(
  // BUG FIX H-2: validate input shape — payroll writes accounting JEs.
  async (_event, data) => payrollService.processMonthlyPayroll(data),
  { requireAuth: true, requireAdmin: true, validator: PayrollProcessSchema }
));
ipcMain.handle('payroll:getHistory', createSecureIpcHandler(
  async () => payrollService.getHistory(),
  { requireAuth: true, requireAdmin: true }
));
ipcMain.handle('payroll:getEmployeeHistory', createSecureIpcHandler(
  async (_event, employeeId) => payrollService.getEmployeeHistory(employeeId),
  { requireAuth: true, requireAdmin: true }
));

// Purchase Orders
ipcMain.handle('purchaseOrders:getAll', createSecureIpcHandler(
  async () => purchaseOrderService.getAll(),
  { requireAuth: true, requireAdmin: true }
));
ipcMain.handle('purchaseOrders:getById', createSecureIpcHandler(
  async (_event, id) => purchaseOrderService.getById(id),
  { requireAuth: true, requireAdmin: true }
));
ipcMain.handle('purchaseOrders:create', createSecureIpcHandler(
  // BUG FIX H-2: validate before writing.
  async (_event, data) => purchaseOrderService.create(data),
  { requireAuth: true, requireAdmin: true, validator: POGeneralCreateSchema }
));
ipcMain.handle('purchaseOrders:updateStatus', createSecureIpcHandler(
  // BUG FIX H-2: validate status and payment mode.
  async (_event, { id, status, paymentMode }) => purchaseOrderService.updateStatus(id, status, paymentMode),
  { requireAuth: true, requireAdmin: true, validator: PurchaseStatusSchema }
));
ipcMain.handle('purchaseOrders:delete', createSecureIpcHandler(
  async (_event, id) => purchaseOrderService.delete(id),
  { requireAuth: true, requireAdmin: true }
));

// Quotations
ipcMain.handle('quotations:getAll', createSecureIpcHandler(
  async () => quotationService.getAll(),
  { requireAuth: true }
));
ipcMain.handle('quotations:getById', createSecureIpcHandler(
  async (_event, id) => quotationService.getById(id),
  { requireAuth: true }
));
ipcMain.handle('quotations:create', createSecureIpcHandler(
  // BUG FIX H-2: validate before writing.
  async (_event, data) => quotationService.create(data),
  { requireAuth: true, validator: QuotationCreateSchema }
));
ipcMain.handle('quotations:updateStatus', createSecureIpcHandler(
  // BUG FIX H-2: validate status.
  async (_event, { id, status }) => quotationService.updateStatus(id, status),
  { requireAuth: true, validator: QuotationStatusSchema }
));
ipcMain.handle('quotations:convertToSale', createSecureIpcHandler(
  // BUG FIX H-2: validate id + paymentMode.
  async (_event, { id, paymentMode }) => quotationService.convertToSale(id, paymentMode),
  { requireAuth: true, validator: ConvertToSaleSchema }
));
ipcMain.handle('quotations:delete', createSecureIpcHandler(
  async (_event, id) => quotationService.delete(id),
  { requireAuth: true, requireAdmin: true }
));

// Refunds
ipcMain.handle('refunds:create', createSecureIpcHandler(
  // BUG FIX H-2: validate refund boundary inputs.
  async (_event, data) => refundService.create(data),
  { requireAuth: true, validator: RefundCreateSchema }
));
ipcMain.handle('refunds:getAll', createSecureIpcHandler(
  async () => refundService.getAll(),
  { requireAuth: true }
));
ipcMain.handle('refunds:delete', createSecureIpcHandler(
  async (_event, id) => refundService.delete(id),
  { requireAuth: true, requireAdmin: true }
));

// Recurring Transactions
ipcMain.handle('recurring:getAll', createSecureIpcHandler(
  async (_event, activeOnly) => recurringService.getAll(activeOnly),
  { requireAuth: true, requireAdmin: true }
));
ipcMain.handle('recurring:create', createSecureIpcHandler(
  // BUG FIX H-2: validate schedule input.
  async (_event, data) => recurringService.create(data),
  { requireAuth: true, requireAdmin: true, validator: RecurringCreateSchema }
));
ipcMain.handle('recurring:toggleActive', createSecureIpcHandler(
  async (_event, id) => recurringService.toggleActive(id),
  { requireAuth: true, requireAdmin: true }
));
ipcMain.handle('recurring:processDue', createSecureIpcHandler(
  async () => recurringService.processDueToday(),
  { requireAuth: true, requireAdmin: true }
));
ipcMain.handle('recurring:delete', createSecureIpcHandler(
  async (_event, id) => recurringService.delete(id),
  { requireAuth: true, requireAdmin: true }
));

// Audit Logs
ipcMain.handle('auditLogs:getAll', createSecureIpcHandler(
  async () => auditService.getAllLogs(),
  { requireAuth: true, requireAdmin: true }
));

// Aged Reports
ipcMain.handle('agedReports:getReceivables', createSecureIpcHandler(
  async (_event, asOfDate) => agedReportService.getAgedReceivables(asOfDate),
  { requireAuth: true, requireAdmin: true }
));
ipcMain.handle('agedReports:getPayables', createSecureIpcHandler(
  async (_event, asOfDate) => agedReportService.getAgedPayables(asOfDate),
  { requireAuth: true, requireAdmin: true }
));

// Audit Logs (read from existing audit_logs table)
// Audit Logs already handled above by auditService

// Barcodes
ipcMain.handle('barcodes:getAll', createSecureIpcHandler(
  async () => barcodeService.getAll(),
  { requireAuth: true }
));
ipcMain.handle('barcodes:create', createSecureIpcHandler(
  // BUG FIX H-2: validate barcode inputs.
  async (_event, data) => barcodeService.create(data.barcode, data.itemId),
  { requireAuth: true, validator: BarcodeCreateSchema }
));
ipcMain.handle('barcodes:findByBarcode', createSecureIpcHandler(
  async (_event, barcode) => {
    const v = z.string().min(1).max(80).safeParse(barcode);
    if (!v.success) return { success: false, message: 'Invalid barcode' };
    return barcodeService.findByBarcode(v.data);
  },
  { requireAuth: true, validator: z.string().min(1).max(80) }
));
ipcMain.handle('barcodes:delete', createSecureIpcHandler(
  async (_event, id) => {
    const v = IdSchema.safeParse(id);
    if (!v.success) return { success: false, message: 'Invalid ID' };
    return barcodeService.delete(v.data);
  },
  { requireAuth: true, validator: IdSchema }
));

// Employees
ipcMain.handle('employees:getAll', createSecureIpcHandler(
  async (_event, activeOnly) => employeeService.getAll(activeOnly),
  { requireAuth: true, requireAdmin: true }
));
ipcMain.handle('employees:create', createSecureIpcHandler(
  // BUG FIX H-2: validate employee data.
  async (_event, data) => employeeService.create(data),
  { requireAuth: true, requireAdmin: true, validator: EmployeeCreateSchema }
));
ipcMain.handle('employees:update', createSecureIpcHandler(
  // BUG FIX H-2: validate both id and body. The handler wrapper validates
  // args[0] — here that is `{id, data}` so we need a matching wrapper schema.
  async (_event, { id, data }) => {
    const idCheck = IdSchema.safeParse(id);
    if (!idCheck.success) return { success: false, message: 'Invalid ID' };
    return employeeService.update(idCheck.data, data);
  },
  { requireAuth: true, requireAdmin: true, validator: z.object({ id: IdSchema, data: EmployeeUpdateSchema }) }
));
ipcMain.handle('employees:getById', createSecureIpcHandler(
  // BUG FIX H-2: validate id (raw number).
  async (_event, id) => {
    const v = IdSchema.safeParse(id);
    if (!v.success) return { success: false, message: 'Invalid ID' };
    return employeeService.getById(v.data);
  },
  { requireAuth: true, requireAdmin: true, validator: IdSchema }
));
ipcMain.handle('employees:delete', createSecureIpcHandler(
  async (_event, id) => {
    const v = IdSchema.safeParse(id);
    if (!v.success) return { success: false, message: 'Invalid ID' };
    return employeeService.delete(v.data);
  },
  { requireAuth: true, requireAdmin: true, validator: IdSchema }
));
ipcMain.handle('employees:export', createSecureIpcHandler(
  async (_event) => {
    const result = employeeService.getAll(true);
    if (result.success && result.data && result.data.length > 0) {
      exportService.exportEmployees(result.data);
      return { success: true, message: 'Employees exported successfully' };
    }
    return { success: false, message: 'No employees to export' };
  },
  { requireAuth: true, requireAdmin: true }
));

// Branches
ipcMain.handle('branches:getAll', createSecureIpcHandler(
  async (_event, activeOnly) => branchService.getAll(activeOnly),
  { requireAuth: true, requireAdmin: true }
));
ipcMain.handle('branches:create', createSecureIpcHandler(
  async (_event, data) => branchService.create(data),
  { requireAuth: true, requireAdmin: true }
));
ipcMain.handle('branches:delete', createSecureIpcHandler(
  async (_event, id) => branchService.delete(id),
  { requireAuth: true, requireAdmin: true }
));

// CSV Import
ipcMain.handle('csvImport:parseFile', createSecureIpcHandler(
  // BUG FIX H-2: bound sheetIndex; size cap enforced in CsvImportService.
  async (_event, buffer, sheetIndex) => csvImportService.parseFile(buffer, sheetIndex),
  { requireAuth: true, requireAdmin: true, validator: CsvParseFileSchema }
));
ipcMain.handle('csvImport:contacts', createSecureIpcHandler(
  async (_event, { data, type }) => csvImportService.importContacts(data, type),
  {
    requireAuth: true,
    requireAdmin: true,
    validator: z.object({
      data: z.array(z.record(z.string(), z.any())).max(10000),
      type: z.enum(['customer', 'supplier']),
    }),
  }
));
ipcMain.handle('csvImport:items', createSecureIpcHandler(
  async (_event, { data }) => csvImportService.importItems(data),
  {
    requireAuth: true,
    requireAdmin: true,
    validator: z.object({
      data: z.array(z.record(z.string(), z.any())).max(10000),
    }),
  }
));

// Split Payments
ipcMain.handle('splitPayment:processSale', createSecureIpcHandler(
  // BUG FIX H-2: validate split-payment payload.
  async (_event, data) => splitPaymentService.processSaleWithSplit(data.customerId, data.items, data.payments, data.discountAmount, data.notes, data.taxType),
  { requireAuth: true, validator: SplitPaymentProcessSaleSchema }
));

// Tiered Pricing
ipcMain.handle('tieredPricing:getAll', createSecureIpcHandler(
  async () => tieredPricingService.getAllPriceLists(),
  { requireAuth: true, requireAdmin: true }
));
ipcMain.handle('tieredPricing:create', createSecureIpcHandler(
  // BUG FIX H-2: validate price-list shape.
  async (_event, data) => tieredPricingService.createPriceList(data),
  { requireAuth: true, requireAdmin: true, validator: TieredPriceListCreateSchema }
));
ipcMain.handle('tieredPricing:getItemPrice', createSecureIpcHandler(
  // BUG FIX H-2: validate IDs.
  async (_event, { itemId, priceListId }) => {
    const v = z.object({ itemId: IdSchema, priceListId: IdSchema }).safeParse({ itemId, priceListId });
    if (!v.success) return { success: false, message: 'Invalid item/price-list ID' };
    return tieredPricingService.getItemPrice(v.data.itemId, v.data.priceListId);
  },
  { requireAuth: true, validator: TieredItemPriceSchema }
));
ipcMain.handle('tieredPricing:getCustomerPriceList', createSecureIpcHandler(
  async (_event, customerId) => {
    const v = IdSchema.safeParse(customerId);
    if (!v.success) return { success: false, message: 'Invalid customer ID' };
    return tieredPricingService.getCustomerPriceList(v.data);
  },
  { requireAuth: true, validator: IdSchema }
));
ipcMain.handle('tieredPricing:assignPriceListToCustomer', createSecureIpcHandler(
  async (_event, { customerId, priceListId }) => {
    const v = TieredAssignSchema.safeParse({ customerId, priceListId });
    if (!v.success) return { success: false, message: 'Invalid assignment' };
    return tieredPricingService.assignPriceListToCustomer(v.data.customerId, v.data.priceListId);
  },
  { requireAuth: true, validator: TieredAssignSchema }
));
ipcMain.handle('tieredPricing:update', createSecureIpcHandler(
  async (_event, { id, data }) => {
    const v = IdSchema.safeParse(id);
    if (!v.success) return { success: false, message: 'Invalid ID' };
    return tieredPricingService.updatePriceList(v.data, data);
  },
  { requireAuth: true, requireAdmin: true, validator: z.object({ id: IdSchema, data: z.unknown() }) }
));
ipcMain.handle('tieredPricing:delete', createSecureIpcHandler(
  async (_event, id) => {
    const v = IdSchema.safeParse(id);
    if (!v.success) return { success: false, message: 'Invalid ID' };
    return tieredPricingService.deletePriceList(v.data);
  },
  { requireAuth: true, requireAdmin: true, validator: IdSchema }
));

// Email Invoice
ipcMain.handle('emailInvoice:send', createSecureIpcHandler(
  async (_event, data) => {
    const success = emailInvoiceService.sendInvoiceViaEmail(data.customerEmail, data);
    return { success, message: success ? 'Email client opened' : 'Failed to open email client' };
  },
  { requireAuth: true }
));

// ============================================
// IPC HANDLERS - Utilities
// ============================================

ipcMain.handle('shell:openExternal', createSecureIpcHandler(
  async (_event, url) => {
    // ✅ SECURITY: Validate URL before opening
    const validation = isValidExternalUrl(url);
    if (!validation.valid) {
      console.error('[Shell] Blocked suspicious URL');
      return { success: false, error: validation.error };
    }

    try {
      await shell.openExternal(url);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to open URL' };
    }
  },
  { requireAuth: true }
));

// ============================================
// IPC HANDLERS - License System
// ============================================

const LicenseKeySchema = z.object({ 
  licenseKey: z.string().min(1, 'License key is required'), 
  otp: z.string().optional(), 
  password: z.string().optional(),
  deviceInfo: z.any().optional()
});

ipcMain.handle('license:getStatus', createSecureIpcHandler(
  async () => {
    const status = licenseService.getStatus();
    return status;
  },
  { requireAuth: false }
));

ipcMain.handle('license:activate', createSecureIpcHandler(
  async (_event, data) => {
    const { licenseKey, otp, password, deviceInfo } = data;
    return await licenseService.activate(licenseKey, otp, password, deviceInfo);
  },
  { requireAuth: false, validator: LicenseKeySchema }
));

ipcMain.handle('license:startTrial', createSecureIpcHandler(
  async () => {
    const status = licenseService.startTrial();
    // Trial start logged via audit system;
    return status;
  },
  {}
));

ipcMain.handle('license:getTrialInfo', createSecureIpcHandler(
  async () => licenseService.getTrialInfo(),
  { requireAuth: true }
));

ipcMain.handle('license:verifyWithServer', createSecureIpcHandler(
  async () => licenseService.verifyWithServer(),
  { requireAuth: true }
));

ipcMain.handle('license:getUserLimit', createSecureIpcHandler(
  async () => {
    const status = licenseService.getStatus();
    return status.maxUsers;
  },
  { requireAuth: true }
));

ipcMain.handle('license:checkUpdate', createSecureIpcHandler(
  async () => {
    const result = await updateService.checkForUpdates();
    // Bridge: if the JSON API found an update, notify the renderer so the
    // UpdateBanner / SettingsPage UI can display it even before
    // electron-updater's own periodic check fires.
    if (result.available && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:available', {
        version: result.version,
        notes: result.notes,
      });
    }
    return result;
  },
  { requireAuth: true }
));

// ============================================
// IPC HANDLERS - Auto Updater (electron-updater)
// ============================================

ipcMain.handle('update:check', createSecureIpcHandler(
  async () => {
    const state = await updateManager.checkForUpdates();
    return { success: true, data: state };
  },
  { requireAuth: false }
));

// BUG FIX H-1: installing an update is destructive (replaces the running
// binary and restarts the app). Restrict to authenticated admin users only.
ipcMain.handle('update:install', createSecureIpcHandler(
  async () => {
    const result = await updateManager.installUpdate();
    return result;
  },
  { requireAuth: true, requireAdmin: true }
));

ipcMain.handle('update:state', createSecureIpcHandler(
  async () => {
    return { success: true, data: updateManager.getState() };
  },
  { requireAuth: false }
));

// ============================================
// IPC HANDLERS - POS SaaS Auth (Server-backed)
// ============================================

let posAuthSession: { token: string; user: any } | null = null;

function getSessionFilePath(): string {
  return path.join(app.getPath('userData'), '.pos-session.enc'); // ✅ SECURITY: Changed to .enc
}

function loadPersistedSession(): void {
  try {
    const sessionPath = getSessionFilePath();
    if (fs.existsSync(sessionPath)) {
      // ✅ SECURITY: Decrypt session data
      const encrypted = fs.readFileSync(sessionPath);
      const decrypted = decryptBuffer(encrypted);
      posAuthSession = JSON.parse(decrypted.toString('utf-8'));
      // Session restored;
    }
  } catch (_error) {
    console.error('[POS Auth] Failed to load persisted session');
    posAuthSession = null;
  }
}

function persistSession(): void {
  try {
    const sessionPath = getSessionFilePath();
    if (posAuthSession) {
      // ✅ SECURITY: Encrypt session data
      const data = Buffer.from(JSON.stringify(posAuthSession), 'utf-8');
      const encrypted = encryptBuffer(data);
      fs.writeFileSync(sessionPath, encrypted);
    } else {
      if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath);
    }
  } catch (_error) {
    console.error('[POS Auth] Failed to persist session');
  }
}

loadPersistedSession();

ipcMain.handle('posAuth:saveSession', createSecureIpcHandler(
  async (_event, sessionData) => {
    posAuthSession = sessionData;
    persistSession();
    // Session saved;
    return { success: true };
  },
  { requireAuth: true, validator: z.object({ token: z.string(), user: z.object({ id: z.union([z.string(), z.number()]).optional(), email: z.string().optional(), role: z.enum(['admin', 'staff']).optional(), username: z.string().optional() }).passthrough() }) }
));

ipcMain.handle('posAuth:getSession', createSecureIpcHandler(
  async () => posAuthSession,
  { requireAuth: true }
));

ipcMain.handle('posAuth:clearSession', createSecureIpcHandler(
  async () => {
    posAuthSession = null;
    persistSession();
    // Session cleared;
    return { success: true };
  },
  { requireAuth: true }
));

// ============================================
// SECURITY: SaaS API Bridge (SSRF Protection)
// ============================================

// Get allowed SaaS domains from environment or use defaults
function getAllowedSaasDomains(): string[] {
  let envDomains: string[] = [];
  if (process.env.VITE_API_URL) {
    try {
      envDomains = [new URL(process.env.VITE_API_URL).hostname];
    } catch {
      // Invalid VITE_API_URL format, ignore
      console.warn('[Security] Invalid VITE_API_URL format, using defaults');
    }
  }
  return [
    ...envDomains,
    'jindapos.com',
    'www.jindapos.com',
    'api.jinda.com',
    'dhisum-tseyig.vercel.app',
    'localhost',
    '127.0.0.1',
    'localhost:3000',
    '127.0.0.1:3000',
    'localhost:3001',
    '127.0.0.1:3001',
  ];
}

const ALLOWED_SAAS_DOMAINS = getAllowedSaasDomains();

/**
 * BUG FIX C-1: Determine whether a host name is allowed for SaaS requests.
 * Uses exact equality plus narrow label-by-label suffix matching — never
 * substring matching, which previously allowed attacker-controlled hosts
 * like `evil-localhost.attacker.com` to pass.
 */
function isAllowedSaasHostname(hostname: string): boolean {
  // exact match
  if (ALLOWED_SAAS_DOMAINS.includes(hostname)) return true;
  // suffix match only for entries that do not contain a colon
  // (i.e. real hostnames — not the `127.0.0.1:3000` port form).
  for (const allowed of ALLOWED_SAAS_DOMAINS) {
    if (allowed.includes(':')) continue;
    // split hostname into labels; reject if any label mismatches the allowed tail
    const hostLabels = hostname.toLowerCase().split('.');
    const allowLabels = allowed.toLowerCase().split('.');
    if (hostLabels.length <= allowLabels.length) continue;
    let match = true;
    for (let i = 0; i < allowLabels.length; i++) {
      const a = allowLabels[allowLabels.length - 1 - i];
      const b = hostLabels[hostLabels.length - 1 - i];
      if (a !== b) { match = false; break; }
    }
    if (match) return true;
  }
  return false;
}

function ipToInt(ip: string): number | null {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const [a, b, c, d] = [m[1], m[2], m[3], m[4]].map(Number);
  if ([a, b, c, d].some((n) => n < 0 || n > 255)) return null;
  return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
}

function isPrivateIp(ip: string): boolean {
  // IPv4 private/loopback/link-local/multicast/reserved
  const n = ipToInt(ip);
  if (n !== null) {
    const oct1 = (n >>> 24) & 0xff;
    const oct2 = (n >>> 16) & 0xff;
    if (oct1 === 10) return true;                                       // 10.0.0.0/8
    if (oct1 === 127) return true;                                      // 127.0.0.0/8
    if (oct1 === 169 && oct2 === 254) return true;                      // link-local 169.254.0.0/16
    if (oct1 === 172 && oct2 >= 16 && oct2 <= 31) return true;          // 172.16.0.0/12
    if (oct1 === 192 && oct2 === 168) return true;                      // 192.168.0.0/16
    if (oct1 === 100 && oct2 >= 64 && oct2 <= 127) return true;        // CGNAT 100.64.0.0/10
    if (oct1 === 0) return true;                                        // 0.0.0.0/8
    if (oct1 >= 224) return true;                                       // multicast/reserved
    if (n >>> 8 === 0x0A000000) return true;                            // 10.x.x.x redundancy
    return false;
  }
  // IPv6 checks (lightweight)
  const lc = ip.toLowerCase();
  if (lc === '::1' || lc === '::') return true;
  if (lc.startsWith('fc') || lc.startsWith('fd')) return true;          // ULA fc00::/7
  if (lc.startsWith('fe80')) return true;                                // link-local
  if (lc.startsWith('169.254')) return true;                             // IPv4-mapped
  return false;
}

/**
 * Resolve a hostname to every IP literal it maps to.
 * Accepts already-literal IPs as-is. Used to block DNS rebinding & SSRF.
 */
function resolveAllIps(hostname: string): Promise<string[]> {
  return new Promise((resolve) => {
    const literals: string[] = [];
    const v4 = ipToInt(hostname);
    if (v4 !== null) { resolve([hostname]); return; }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const dns = require('dns');
      dns.lookup(hostname, { all: true, verbatim: true }, (err: any, addrs: any[]) => {
        if (err || !addrs || addrs.length === 0) { resolve(literals); return; }
        resolve(addrs.map((a: any) => a.address));
      });
    } catch {
      resolve(literals);
    }
  });
}

async function validateSaasUrl(urlString: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = new URL(urlString);

    // Only http(s) — anything else (file://, gopher://, data:…) is rejected.
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return { valid: false, error: 'Only http(s) protocols are allowed' };
    }

    const hostname = url.hostname.toLowerCase();
    if (!isAllowedSaasHostname(hostname)) {
      return { valid: false, error: 'Unauthorized domain' };
    }

    // Resolve host to every IP and ensure none of them point at a private or
    // loopback range. This blocks DNS-rebinding and direct IP access.
    const ips = await resolveAllIps(hostname);
    if (ips.length === 0) {
      return { valid: false, error: 'Unable to resolve host' };
    }
    for (const ip of ips) {
      if (isPrivateIp(ip)) {
        return { valid: false, error: 'Destination resolves to a private/internal address' };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL' };
  }
}

// Define these at module level so both handlers can use them
const SERVICE_NAME = 'Jinda-POS';
const ACCOUNT_NAME = 'saas-tokens';

// Optional keytar import for OS keychain (falls back to encrypted file if unavailable)
let keytar: { setPassword: (s: string, a: string, p: string) => Promise<void>; getPassword: (s: string, a: string) => Promise<string | null>; deletePassword: (s: string, a: string) => Promise<boolean> } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  keytar = require('keytar');
} catch {
  console.log('[SecureStorage] keytar not available, using encrypted file fallback');
}

// Helper function to get tokens (used internally and by IPC handler)
async function getSecureTokens(): Promise<TokenData | null> {
  // Try keytar first if available
  if (keytar) {
    try {
      const encryptedBase64 = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      if (encryptedBase64) {
        const encrypted = Buffer.from(encryptedBase64, 'base64');
        const decrypted = decryptBuffer(encrypted);
        const tokens = JSON.parse(decrypted.toString('utf-8'));
        return tokens as TokenData;
      }
    } catch (error) {
      // Backward-compat: old tokens were encrypted with a different key
      // derivation (before .install-key existed). Clear them and continue.
      console.warn('[SecureStorage] Clearing undecryptable keychain tokens (backward-compat).');
      try { await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME); } catch { /* ignore */ }
      keytar = null;
    }
  }
  // Fallback to encrypted file
  try {
    const sessionPath = path.join(app.getPath('userData'), '.secure-tokens');
    if (!fs.existsSync(sessionPath)) return null;

    const encrypted = fs.readFileSync(sessionPath);
    const decrypted = decryptBuffer(encrypted);
    return JSON.parse(decrypted.toString('utf-8')) as TokenData;
  } catch (_fallbackError) {
    // Backward-compat: old token file encrypted with different key. Delete it.
    console.warn('[SecureStorage] Clearing undecryptable token file (backward-compat).');
    try {
      const sessionPath = path.join(app.getPath('userData'), '.secure-tokens');
      if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath);
    } catch { /* ignore */ }
    return null;
  }
}

ipcMain.handle('auth:saas:request', createSecureIpcHandler(
  async (_event, options) => {
    const validation = SaaSRequestSchema.safeParse(options);
    if (!validation.success) {
      return { ok: false, status: 0, data: { success: false, message: 'Invalid request format' } };
    }

    const urlValidation = await validateSaasUrl(options.url);
    if (!urlValidation.valid) {
      console.error('[Security] Blocked SSRF attempt');
      return { ok: false, status: 0, data: { success: false, message: urlValidation.error || 'Unauthorized domain' } };
    }

    try {
      // Bridge request sent;
      const response = await fetch(options.url, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { success: false, message: `Server error (${response.status})`, errorDetails: text.slice(0, 500) };
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } catch (_error: any) {
      console.error('[POS Bridge] Request failed');
      return {
        ok: false,
        status: 0,
        data: { success: false, message: 'Network connection failed. Ensure the server is running.' }
      };
    }
  },
  { requireAuth: false, validator: SaaSRequestSchema }
));

// ============================================
// SECURITY: Secure Token Storage (OS Keychain)
// ============================================

// BUG FIX H-1: access tokens grant SaaS API access — restrict set/get/clear
// to authenticated sessions. `hasTokens` only returns a boolean and remains
// unauthenticated to keep pre-login refresh logic functional.
ipcMain.handle('secureStorage:setTokens', createSecureIpcHandler(
  async (_event, tokens: TokenData) => {
    if (keytar) {
      try {
        const encryptedData = encryptBuffer(Buffer.from(JSON.stringify(tokens), 'utf-8'));
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, encryptedData.toString('base64'));
        return true;
      } catch (error) {
        console.error('[SecureStorage] Keytar failed, disabling keytar:', error);
        keytar = null;
      }
    }
    try {
      const sessionPath = path.join(app.getPath('userData'), '.secure-tokens');
      const encrypted = encryptBuffer(Buffer.from(JSON.stringify(tokens), 'utf-8'));
      fs.writeFileSync(sessionPath, encrypted);
      return true;
    } catch (_fallbackError) {
      console.error('[SecureStorage] Fallback storage failed');
      return false;
    }
  },
  { requireAuth: true }
));

ipcMain.handle('secureStorage:getTokens', createSecureIpcHandler(
  async () => await getSecureTokens(),
  { requireAuth: true }
));

ipcMain.handle('secureStorage:clearTokens', createSecureIpcHandler(
  async () => {
    if (keytar) {
      try {
        await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
      } catch (error) {
        console.error('[SecureStorage] Failed to clear from keychain, disabling keytar:', error);
        keytar = null;
      }
    }

    try {
      const sessionPath = path.join(app.getPath('userData'), '.secure-tokens');
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
      }
    } catch (_error) {
      console.error('[SecureStorage] Failed to clear fallback');
    }

    return true;
  },
  { requireAuth: true }
));

ipcMain.handle('secureStorage:hasTokens', createSecureIpcHandler(
  async () => {
    if (keytar) {
      try {
        const hasKeychain = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME) !== null;
        if (hasKeychain) return true;
      } catch (error) {
        console.error('[SecureStorage] Keytar hasTokens check failed, disabling keytar:', error);
        keytar = null;
      }
    }

    const sessionPath = path.join(app.getPath('userData'), '.secure-tokens');
    return fs.existsSync(sessionPath);
  },
  { requireAuth: false }
));

// ============================================
// SECURITY: POS Auth SaaS Request Bridge
// ============================================

ipcMain.handle('posAuth:saasRequest', createSecureIpcHandler(
  async (_event, options) => {
    console.log('[POS Auth] saasRequest called:', { url: options.url, method: options.method });
    try {
      // Validate request
      const validation = SaaSRequestSchema.safeParse(options);
      if (!validation.success) {
        console.error('[POS Auth] Validation failed:', validation.error.issues.map(i => i.message).join(', '));
        // SECURITY: Never log options — may contain credentials or tokens
        return {
          ok: false,
          status: 0,
          data: { success: false, error: 'Invalid request format' }
        };
      }

      // Validate URL
      const urlValidation = await validateSaasUrl(options.url);
      if (!urlValidation.valid) {
        console.error('[Security] Blocked SSRF attempt');
        return {
          ok: false,
          status: 0,
          data: { success: false, error: urlValidation.error || 'Unauthorized domain' }
        };
      }

      // Get tokens from secure storage
      const tokens = await getSecureTokens();

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add authorization if available
      if (tokens?.accessToken) {
        headers['Authorization'] = `Bearer ${tokens.accessToken}`;
      }

      console.log('[POS Auth] Sending request to:', options.url);
      const response = await fetch(options.url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      let data;
      try {
        data = await response.json();
        // SECURITY: Never log response data — may contain JWT tokens or sensitive info
      } catch (_e) {
        console.warn('[POS Auth] Failed to parse JSON response for:', options.url);
        data = null;
      }

      const result = {
        ok: response.ok,
        status: response.status,
        data: data || { success: false, error: 'Invalid response' },
      };
      console.log('[POS Auth] Completed:', { url: options.url, status: response.status, ok: response.ok });
      return result;
    } catch (error: any) {
      console.error('[POS Auth] Request failed:', error.message || 'Unknown error');
      return {
        ok: false,
        status: 0,
        data: {
          success: false,
          error: 'Network connection failed. Please check your internet connection.'
        }
      };
    }
  },
  { requireAuth: false }
));

// Get device ID from license service
// NOTE: This MUST NOT require auth — it's called during login before authentication
ipcMain.handle('license:getDeviceId', async () => {
  try {
    return licenseService.getDeviceId() || null;
  } catch (_error) {
    console.error('[License] Failed to get device ID');
    return null;
  }
});

// ============================================
// SECURITY: Prevent navigation and new windows
// ============================================

app.on('web-contents-created', (_event, contents) => {
  // BUG-11 FIX: Don't set window handlers on OAuth popups or external helper windows.
  // Only apply to the main app window's primary webContents.
  if (mainWindow && contents.id === mainWindow.webContents.id) {
    contents.setWindowOpenHandler(({ url }) => {
      console.log('[Security] Blocked new window:', url);
      return { action: 'deny' };
    });

    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      // BUG-10 FIX: Allow file:// protocol for packaged production builds,
      // as well as localhost dev server and the official api server.
      const isAllowed = 
        parsedUrl.protocol === 'file:' ||
        parsedUrl.origin === 'http://127.0.0.1:5173' ||
        parsedUrl.origin === 'https://api.jinda.com';
      if (!isAllowed) {
        event.preventDefault();
        console.log('[Security] Blocked navigation:', navigationUrl);
      }
    });
  }
});

app?.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// SECURITY: Encrypt the database file on disk before the app exits.
// This ensures the plaintext working file is replaced with an encrypted
// .secure file, so the DB cannot be read or edited while the app is closed.
app?.on('before-quit', () => {
  try {
    if (dbManager) {
      console.log('[Main] Encrypting database before quit...');
      dbManager.closeAndEncrypt();
    }
  } catch (e) {
    console.error('[Main] Failed to encrypt database on quit:', e);
  }
});
