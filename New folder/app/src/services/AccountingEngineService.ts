import { DatabaseManager } from '../database/DatabaseManager';
import Database from 'better-sqlite3';
import { isAfter, parseISO } from 'date-fns';
import type { PaymentMode, TransactionType } from '../types';

export interface EngineTransactionLine {
  accountId: number;
  contactId?: number | null;
  itemId?: number | null;
  description: string;
  debitAmount: number;
  creditAmount: number;
  gstAmount?: number;
  gstRate?: number;
  gstType?: 'input' | 'output';
}

export interface EngineItem {
  itemId: number;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  isStockApplicable: boolean;
  name: string;
}

export interface EngineEvent {
  type: TransactionType;
  date: string; // YYYY-MM-DD
  contactId?: number | null;
  description: string;
  reference?: string | null;
  paymentMode?: PaymentMode;
  items?: EngineItem[];
  subtotal: number;
  gstAmount: number;
  discountAmount: number;
  netAmount: number;
  lines: EngineTransactionLine[];
  createdBy?: number;
  taxType?: 'standard' | 'domestic';
  invoiceDetails?: {
    dueDate?: string | null;
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    notes?: string | null;
    terms?: string | null;
  };
}

/**
 * AccountingEngineService
 * Enforces strict double-entry and pipeline execution rules.
 */
export class AccountingEngineService {
  private db: Database.Database;
  private dbManager: DatabaseManager;

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
    this.db = dbManager.getDatabase();
  }

  /**
   * Pipeline Executor
   * Executes the strict transaction pipeline sequence safely within a DB transaction.
   * Rollbacks if any step fails.
   */
  public executePipeline(event: EngineEvent): { success: boolean; data?: any; message?: string } {
    return this._executePipelineInternal(event);
  }

  /**
   * Pipeline Executor with balance check for transfers.
   * Performs an atomic balance check inside the transaction before executing.
   */
  public executePipelineWithBalanceCheck(
    event: EngineEvent,
    fromAccountId: number,
    requiredAmount: number
  ): { success: boolean; data?: any; message?: string } {
    return this._executePipelineInternal(event, fromAccountId, requiredAmount);
  }

  private _executePipelineInternal(
    event: EngineEvent,
    fromAccountId?: number,
    requiredAmount?: number
  ): { success: boolean; data?: any; message?: string } {
    try {
      // Step 1: Validate input basic structure
      this.validateInput(event);

      // Step 2: Check date validity
      this.checkDateValidity(event.date);

      // Step 3: Check period lock
      this.checkPeriodLock(event.date);

      // Step 4: Check stock availability (if sale)
      if (event.type === 'sale' && event.items) {
        this.checkStockAvailability(event.items);
      }

      // Step 5: Check credit limit (if credit sale)
      if (event.type === 'sale' && event.paymentMode === 'credit' && event.contactId) {
        this.checkCreditLimit(event.contactId, event.netAmount);
      }

      // Step 6: Validate balance (Debits === Credits)
      this.validateBalance(event.lines);

      // Steps 7-13: Execute DB operations within a transaction
      const result = this.dbManager.safeTransaction(() => {
        // Atomic balance check for transfers (performed inside the transaction)
        if (fromAccountId !== undefined && requiredAmount !== undefined) {
          // Look up the account's normal side so we compare against the
          // accounting-direction balance (asset/expense = debit-normal,
          // liability/equity/income = credit-normal). We also exclude voided
          // transactions, matching the pre-flight check in AccountingService.
          const accountRow = this.db.prepare('SELECT type FROM accounts WHERE id = ?').get(fromAccountId) as any;
          if (!accountRow) {
            throw new Error(`Source account ${fromAccountId} not found for balance check.`);
          }
          const isDebitNormal = accountRow.type === 'asset' || accountRow.type === 'expense';
          const balanceSql = isDebitNormal
            ? `SELECT COALESCE(SUM(debit_amount - credit_amount), 0) as balance
               FROM transaction_lines tl
               JOIN transactions t ON t.id = tl.transaction_id
               WHERE tl.account_id = ? AND t.is_void = 0 AND t.transaction_no NOT LIKE 'OB-%'`
            : `SELECT COALESCE(SUM(credit_amount - debit_amount), 0) as balance
               FROM transaction_lines tl
               JOIN transactions t ON t.id = tl.transaction_id
               WHERE tl.account_id = ? AND t.is_void = 0 AND t.transaction_no NOT LIKE 'OB-%'`;

          const balanceResult = this.db.prepare(balanceSql).get(fromAccountId) as any;
          const currentBalance = Number(balanceResult?.balance || 0);
          if (currentBalance < requiredAmount) {
            throw new Error(`Insufficient balance. Available: Nu. ${currentBalance.toFixed(2)}, Required: Nu. ${requiredAmount.toFixed(2)}`);
          }
        }
        // Step 7: Generate / Save transaction object
        const transactionNo = this.generateTransactionNo(event.type);
        const transactionResult = this.db.prepare(`
          INSERT INTO transactions
          (transaction_no, type, date, contact_id, description, total_amount, gst_amount, discount_amount, net_amount, payment_mode, reference, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          transactionNo,
          event.type,
          event.date,
          event.contactId || null,
          event.description,
          event.subtotal,
          event.gstAmount,
          event.discountAmount,
          event.netAmount,
          event.paymentMode || null,
          event.reference || null,
          event.createdBy || null
        );

        const transactionId = transactionResult.lastInsertRowid as number;

        // Step 8 & 9: Generate debit and credit entries
        this.saveTransactionLines(transactionId, event.lines);

        // Save GST entries if any
        this.saveGstEntries(transactionId, event.lines, event.date);

        // Step 10: Update stock movements
        if (event.items && ['sale', 'purchase', 'refund'].includes(event.type)) {
          const movementType = (event.type === 'sale') ? 'out' : 'in';
          // For sales, use atomic stock deduction to prevent race conditions
          if (event.type === 'sale') {
            const atomicResult = this.deductStockAtomic(event.items);
            if (!atomicResult.success) {
              throw new Error(`Stock Consistency Rule: Insufficient stock for ${atomicResult.failedItem}`);
            }
            // Record stock movements after successful atomic deduction
            this.saveStockMovements(transactionId, event.items, movementType, true);
          } else {
            // For purchases/refunds, use the original non-atomic flow (stock increases)
            this.saveStockMovements(transactionId, event.items, movementType, false);
          }
        }

        // Step 11: Generate invoice (if sale or purchase)
        let invoiceId = null;
        if (['sale', 'purchase'].includes(event.type) && event.invoiceDetails) {
          invoiceId = this.generateInvoice(transactionId, transactionNo, event);
          // Update transaction with invoice ID
          this.db.prepare('UPDATE transactions SET invoice_id = ? WHERE id = ?').run(invoiceId, transactionId);
        }

        // Step 12: Update contact balance if applicable
        if (event.contactId) {
          this.updateContactBalance(event.contactId);
        }

        // Return core transaction info
        return { transactionId, transactionNo, invoiceId };
      });

      return {
        success: true,
        data: result,
        message: `${event.type} transaction completed successfully`,
      };
    } catch (error: any) {
      console.error('Pipeline execution error:', error);
      return {
        success: false,
        message: error.message || 'Transaction failed',
      };
    }
  }

  // ==========================================
  // PIPELINE VALIDATION STEPS
  // ==========================================

  private validateInput(event: EngineEvent) {
    if (!event.type || !event.date || event.netAmount === undefined || isNaN(event.netAmount) || !event.lines) {
      throw new Error('Invalid event payload: Missing or invalid required fields (NaN detected).');
    }
    if (event.lines.length < 2) {
      throw new Error('Double Entry Rule: Transaction must contain at least 2 transaction_lines.');
    }
  }

  private checkDateValidity(dateStr: string) {
    const txDate = parseISO(dateStr);
    const today = new Date();
    // Allow saving today or past, but not future dates strictly
    today.setHours(23, 59, 59, 999);
    if (isAfter(txDate, today)) {
      throw new Error('Transaction date cannot be in the future.');
    }
  }

  private checkPeriodLock(dateStr: string) {
    const txDate = parseISO(dateStr);
    const year = txDate.getFullYear();
    const month = txDate.getMonth() + 1;

    const isLocked = this.db.prepare(`
      SELECT 1 FROM period_locks WHERE year = ? AND month = ? AND is_locked = 1
    `).get(year, month);

    if (isLocked) {
      throw new Error('Period Lock: Cannot create transaction in a locked period.');
    }
  }

  private checkStockAvailability(items: EngineItem[]) {
    for (const item of items) {
      if (!item.isStockApplicable) continue;

      const stockItem = this.db.prepare('SELECT quantity_in_stock, name FROM items WHERE id = ?').get(item.itemId) as any;
      if (!stockItem) {
        throw new Error(`Item not found: ID ${item.itemId}`);
      }
      if (stockItem.quantity_in_stock < item.quantity) {
        throw new Error(`Stock Consistency Rule: Insufficient stock for ${item.name}. Available: ${stockItem.quantity_in_stock}`);
      }
    }
  }

  /**
   * Atomically deduct stock for sale items.
   * Uses UPDATE with a WHERE clause to ensure stock is available at the moment of update.
   * Returns true if all items were successfully deducted, false if any item had insufficient stock.
   */
  private deductStockAtomic(items: EngineItem[]): { success: boolean; failedItem?: string } {
    for (const item of items) {
      if (!item.isStockApplicable) continue;

      const result = this.db.prepare(
        'UPDATE items SET quantity_in_stock = quantity_in_stock - ? WHERE id = ? AND quantity_in_stock >= ?'
      ).run(item.quantity, item.itemId, item.quantity);

      if (result.changes === 0) {
        // Stock was insufficient at the moment of update — another transaction may have consumed it
        const stockItem = this.db.prepare('SELECT quantity_in_stock, name FROM items WHERE id = ?').get(item.itemId) as any;
        return {
          success: false,
          failedItem: stockItem ? `${stockItem.name} (available: ${stockItem.quantity_in_stock}, needed: ${item.quantity})` : `Item ID ${item.itemId}`
        };
      }
    }
    return { success: true };
  }

  private checkCreditLimit(customerId: number, additionalAmount: number) {
    const contact = this.db.prepare('SELECT credit_limit FROM contacts WHERE id = ?').get(customerId) as any;
    if (!contact) {
      throw new Error('Customer not found for credit check.');
    }

    // Calculate current outstanding dynamically from transaction_lines
    const outstanding = this.calculateOutstanding(customerId);

    if (outstanding + additionalAmount > contact.credit_limit) {
      throw new Error(`Credit Control Rule: Credit limit exceeded. Outstanding: ${outstanding}, Limit: ${contact.credit_limit}, New Sale: ${additionalAmount}`);
    }
  }

  private validateBalance(lines: EngineTransactionLine[]) {
    // Use an epsilon comparison rather than direct equality. Independent
    // .toFixed(2) rounding can produce matching strings that mask a real
    // imbalance when the deltas have opposite signs; an epsilon handles
    // both true equality and float drift within 0.5 of a cent.
    const BALANCE_EPSILON = 0.005;
    const totalDebit = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);

    if (Math.abs(totalDebit - totalCredit) >= BALANCE_EPSILON) {
      throw new Error(`Double Entry Rule: Transaction not balanced. Debits: ${totalDebit.toFixed(2)}, Credits: ${totalCredit.toFixed(2)}`);
    }
  }

  // ==========================================
  // PIPELINE DB OPERATIONS (Inside Transaction)
  // ==========================================

  private saveTransactionLines(transactionId: number, lines: EngineTransactionLine[]) {
    const insertLine = this.db.prepare(`
      INSERT INTO transaction_lines (transaction_id, account_id, contact_id, item_id, description, debit_amount, credit_amount, gst_amount, gst_rate, gst_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const line of lines) {
      insertLine.run(
        transactionId,
        line.accountId,
        line.contactId || null,
        line.itemId || null,
        line.description,
        line.debitAmount,
        line.creditAmount,
        line.gstAmount || 0,
        line.gstRate || 0,
        line.gstType || null
      );
    }
  }

  private saveGstEntries(transactionId: number, lines: EngineTransactionLine[], dateStr: string) {
    const txDate = new Date(dateStr);
    const month = txDate.getMonth() + 1;
    const year = txDate.getFullYear();

    const insertGst = this.db.prepare(`
      INSERT INTO gst_entries (transaction_id, type, amount, rate, month, year)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // BUG-A06 FIX: Group GST entries by rate to avoid overwriting or using wrong rates.
    // Negative gstAmount values are intentional (e.g. refund reversals) and must be preserved.
    const inputsByRate = new Map<number, number>();
    const outputsByRate = new Map<number, number>();

    for (const line of lines) {
      const rate = line.gstRate !== undefined ? line.gstRate : 5.0;
      if (line.gstType === 'input' && line.gstAmount !== undefined && line.gstAmount !== 0) {
        inputsByRate.set(rate, (inputsByRate.get(rate) || 0) + line.gstAmount);
      }
      if (line.gstType === 'output' && line.gstAmount !== undefined && line.gstAmount !== 0) {
        outputsByRate.set(rate, (outputsByRate.get(rate) || 0) + line.gstAmount);
      }
    }

    for (const [rate, amount] of inputsByRate.entries()) {
      if (amount !== 0) insertGst.run(transactionId, 'input', amount, rate, month, year);
    }
    for (const [rate, amount] of outputsByRate.entries()) {
      if (amount !== 0) insertGst.run(transactionId, 'output', amount, rate, month, year);
    }
  }

  private saveStockMovements(transactionId: number, items: EngineItem[], type: 'in' | 'out', stockAlreadyDeducted: boolean = false) {
    const insertMovement = this.db.prepare(`
      INSERT INTO stock_movements (item_id, transaction_id, type, quantity, unit_cost, total_cost, reference)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const updateItemStock = this.db.prepare(`
      UPDATE items SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?
    `);

    const getAvgCost = this.db.prepare('SELECT average_cost FROM items WHERE id = ?');

    for (const item of items) {
      if (!item.isStockApplicable) continue;

      // For 'out' movements (sales), unit_cost must reflect the item's cost
      // basis (average_cost), NOT the selling price. For 'in' movements
      // (purchases), unitPrice IS the purchase cost and is correct as-is.
      let unitCost: number;
      let totalCost: number;
      if (type === 'out') {
        const itemRow = getAvgCost.get(item.itemId) as any;
        unitCost = itemRow ? Number(itemRow.average_cost) || 0 : 0;
        totalCost = unitCost * item.quantity;
      } else {
        unitCost = item.unitPrice;
        totalCost = item.totalAmount;
      }

      insertMovement.run(
        item.itemId,
        transactionId,
        type,
        item.quantity,
        unitCost,
        totalCost,
        `Tx ${transactionId}`
      );

      // Stock Rule 4: Update stock quantity
      // For sales with atomic deduction, stock was already deducted — only record the movement
      if (type === 'out' && stockAlreadyDeducted) {
        // Stock already atomically deducted in deductStockAtomic, skip UPDATE here
        continue;
      }
      const stockChange = type === 'in' ? item.quantity : -item.quantity;
      updateItemStock.run(stockChange, item.itemId);
    }
  }

  private generateInvoice(transactionId: number, transactionNo: string, event: EngineEvent): number {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    const details = event.invoiceDetails!;

    // Build a unique invoice number. Two layers of protection:
    //   (a) probe a candidate and pick one that doesn't exist yet
    //   (b) catch UNIQUE-constraint failures on the actual INSERT in case
    //       something else inserted the same number between our probe and
    //       our INSERT (TOCTOU race), and retry with a fresh number.
    const parts = transactionNo.split('-');
    const baseSuffix = parts.slice(1).join('-') || `${Date.now()}`;
    const checkExisting = this.db.prepare('SELECT 1 FROM invoices WHERE invoice_no = ?');
    const insertInvoice = this.db.prepare(`
      INSERT INTO invoices
      (invoice_no, transaction_id, contact_id, date, due_date, subtotal, gst_amount, discount_amount, total_amount, balance_due, payment_status, notes, terms, tax_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const buildCandidate = (attempt: number) => {
      const randomPart = crypto.randomInt(0, 10000).toString().padStart(4, '0');
      return attempt === 0
        ? `INV-${baseSuffix}`
        : `INV-${baseSuffix}-${attempt}-${randomPart}`;
    };

    let invoiceNo = '';
    let result: any = null;
    const MAX_INVOICE_ATTEMPTS = 12;
    for (let attempt = 0; attempt < MAX_INVOICE_ATTEMPTS; attempt++) {
      invoiceNo = buildCandidate(attempt);
      // Probe ahead so the typical case succeeds on the first INSERT without
      // relying on the UNIQUE-catch path.
      let collision = !!checkExisting.get(invoiceNo);
      while (collision) {
        attempt++;
        if (attempt >= MAX_INVOICE_ATTEMPTS) break;
        invoiceNo = buildCandidate(attempt);
        collision = !!checkExisting.get(invoiceNo);
      }
      if (collision) break;

      try {
        result = insertInvoice.run(
          invoiceNo,
          transactionId,
          event.contactId || null,
          event.date,
          details.dueDate || null,
          event.subtotal,
          event.gstAmount,
          event.discountAmount,
          event.netAmount,
          event.paymentMode === 'credit' ? event.netAmount : 0,
          details.paymentStatus,
          details.notes || null,
          details.terms || null,
          event.taxType || 'standard'
        );
        break;
      } catch (err: any) {
        const msg = String(err?.message || '');
        // UNIQUE constraint failed — try a fresh candidate number.
        if (!/UNIQUE constraint failed/i.test(msg)) {
          throw err;
        }
      }
    }

    if (!result) {
      throw new Error(`Failed to allocate a unique invoice number after ${MAX_INVOICE_ATTEMPTS} attempts.`);
    }

    const invoiceId = result.lastInsertRowid as number;

    const insertInvoiceItem = this.db.prepare(`
      INSERT INTO invoice_items 
      (invoice_id, item_id, description, quantity, unit_price, gst_rate, gst_amount, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    if (event.items) {
      for (const item of event.items) {
        insertInvoiceItem.run(
          invoiceId,
          item.itemId,
          item.name,
          item.quantity,
          item.unitPrice,
          item.gstRate,
          item.gstAmount,
          item.totalAmount
        );
      }
    }

    return invoiceId;
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private generateTransactionNo(type: string): string {
    const prefixMap: Record<string, string> = {
      'sale': 'SAL',
      'purchase': 'PUR',
      'receipt': 'RCP',
      'payment': 'PAY',
      'transfer': 'TRF',
      'adjustment': 'ADJ',
      'journal': 'JNL',
      'refund': 'RFC'
    };

    // Fallback if not mapped
    const prefix = prefixMap[type.toLowerCase()] || 'TXN';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    const checkExisting = this.db.prepare('SELECT 1 FROM transactions WHERE transaction_no = ?');

    // Retry a handful of times: the 4-digit random suffix has a 1-in-10,000
    // collision per millisecond, and bursts of concurrent writes can still
    // land on the same number. The DB enforces UNIQUE so the caller would
    // otherwise see a hard error; instead we probe and pick a free slot.
    for (let attempt = 0; attempt < 8; attempt++) {
      const now = new Date();
      const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const msPart = String(now.getMilliseconds()).padStart(3, '0');
      const randomPart = crypto.randomInt(0, 10000).toString().padStart(4, '0');
      const candidate = `${prefix}-${datePart}-${timePart}-${msPart}-${randomPart}`;
      if (!checkExisting.get(candidate)) {
        return candidate;
      }
    }

    // Last-ditch fallback: append a large random suffix so we always return
    // a string. UNIQUE will still throw if we lose the race, but that is
    // expected — the engine wraps this in a transaction.
    const now = new Date();
    const fallback = `${prefix}-${now.getTime()}-${crypto.randomBytes(4).toString('hex')}`;
    return fallback;
  }

  private calculateOutstanding(contactId: number): number {
    // Outstanding balance for a contact, restricted to its AR/AP scope.
    //
    // Inclusion rule (line must satisfy AT LEAST ONE):
    //   (a) tl.account_id = contact.account_id (the per-contact sub-account, e.g. 1300-001), OR
    //   (b) tl.contact_id = contactId AND tl.account_id is inside the AR/AP tree
    //       (control 1300/2100 or any of their children).
    //
    // Previously this query also matched t.contact_id = contactId, which caused
    // cross-contamination when a transaction had contactId X but one of its
    // lines belonged to a different contact (e.g. split payments, journal
    // adjustments). We now require the line itself to be associated with X.
    const contact = this.db.prepare('SELECT account_id, type, opening_balance FROM contacts WHERE id = ?').get(contactId) as any;
    if (!contact) return 0;

    const result = this.db.prepare(`
      SELECT
        COALESCE(SUM(tl.debit_amount), 0) as total_debit,
        COALESCE(SUM(tl.credit_amount), 0) as total_credit
      FROM transaction_lines tl
      JOIN transactions t ON t.id = tl.transaction_id
      WHERE t.is_void = 0
      AND t.transaction_no NOT LIKE 'OB-%'
      AND (
        tl.account_id = ?
        OR (
          tl.contact_id = ?
          AND tl.account_id IN (
            SELECT id FROM accounts
            WHERE code IN ('1300', '2100')
               OR parent_id IN (SELECT id FROM accounts WHERE code IN ('1300', '2100'))
          )
        )
      )
    `).get(contact.account_id, contactId) as any;

    const debit = Number(result.total_debit);
    const credit = Number(result.total_credit);

    if (contact.type === 'customer') {
      return contact.opening_balance + (debit - credit);
    } else {
      return contact.opening_balance + (credit - debit);
    }
  }

  private updateContactBalance(contactId: number) {
    const balance = this.calculateOutstanding(contactId);
    this.db.prepare(`
      UPDATE contacts 
      SET current_balance = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(balance, contactId);
  }

  /**
   * Public wrapper around updateContactBalance so other services (e.g.
   * RefundService.delete) can recalculate a contact's cached balance after
   * modifying transaction_lines outside the engine pipeline.
   */
  public recalculateContactBalance(contactId: number): void {
    this.updateContactBalance(contactId);
  }
}
