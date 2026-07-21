import Database from 'better-sqlite3';
import { DatabaseManager } from '../database/DatabaseManager';
import type { Refund, CreateRefundData, ApiResponse } from '../types';
import { AccountingEngineService } from './AccountingEngineService';
import type { EngineEvent, EngineTransactionLine, EngineItem } from './AccountingEngineService';
import { AutomationService } from './AutomationService';
import { AuditService } from './AuditService';

export class RefundService {
  private db: Database.Database;
  private dbManager: DatabaseManager;
  private engine: AccountingEngineService;
  private automation: AutomationService;
  private audit: AuditService;

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
    this.db = dbManager.getDatabase();
    this.engine = new AccountingEngineService(dbManager);
    this.automation = new AutomationService(dbManager);
    this.audit = new AuditService(dbManager);
  }

  generateRefundNo(): string {
    // Use MAX of the numeric suffix rather than COUNT+1 so that deletions
    // don't cause the next number to collide with an existing refund_no.
    const maxRow = this.db.prepare(
      "SELECT MAX(CAST(SUBSTR(refund_no, 4) AS INTEGER)) as max_num FROM refunds WHERE refund_no LIKE 'RF-%'"
    ).get() as any;
    const num = (maxRow?.max_num || 0) + 1;
    return `RF-${String(num).padStart(5, '0')}`;
  }

  create(data: CreateRefundData): ApiResponse<{ id: number }> {
    try {
      if (!data.items || data.items.length === 0) {
        return { success: false, message: 'No items in refund' };
      }

      // 1. Calculate totals.
      // Where possible, retrieve the ORIGINAL sale's discount so the refund
      // reverses the exact GST that was collected on the discounted sale (BUG 24).
      // Falls back to undiscounted calculation if the original invoice can't be found.
      let originalDiscountAmount = 0;
      let originalSubtotal = 0;
      try {
        const origInvoice = this.db.prepare(
          'SELECT discount_amount, subtotal FROM invoices WHERE transaction_id = ?'
        ).get(data.originalTransactionId) as any;
        if (origInvoice) {
          originalDiscountAmount = Number(origInvoice.discount_amount) || 0;
          originalSubtotal = Number(origInvoice.subtotal) || 0;
        }
      } catch { /* ignore — fall back to undiscounted GST */ }

      const refundNo = this.generateRefundNo();
      let subtotal = 0;
      let discountedSubtotal = 0;
      let totalGst = 0;

      // Compute the original discount factor so each refund line's GST is
      // computed on the same discounted amount the customer paid originally.
      const originalDiscountFactor = originalSubtotal > 0 ? (originalSubtotal - originalDiscountAmount) / originalSubtotal : 1;

      for (const item of data.items) {
        // Get item details from database to get correct GST rate
        const itemDetails = this.db.prepare('SELECT gst_rate, gst_applicable FROM items WHERE id = ?').get(item.itemId) as any;

        // Use item's GST rate from database, or fallback to provided rate, then to 5.0
        const gstRate = itemDetails?.gst_applicable
          ? (item.gstRate ?? itemDetails?.gst_rate ?? 5.0)
          : 0;

        const lineTotal = item.quantity * item.unitPrice;
        // Apply the original sale's discount proportionally so the reversed
        // GST matches what was actually charged (BUG 24).
        const discountedLineTotal = lineTotal * originalDiscountFactor;
        const lineGst = Number((discountedLineTotal * gstRate / 100).toFixed(2));
        subtotal += lineTotal;
        discountedSubtotal += discountedLineTotal;
        totalGst += lineGst;
      }

      const refundDiscountAmount = Number((subtotal - discountedSubtotal).toFixed(2));
      // Derive netAmount from subtotal + totalGst - refundDiscountAmount (NOT
      // discountedSubtotal + totalGst) so that debit total (subtotal + totalGst)
      // always equals credit total (refundDiscountAmount + netAmount) exactly,
      // avoiding validateBalance epsilon failures from independent rounding.
      const netAmount = subtotal + totalGst - refundDiscountAmount;

      // 2. Prepare Accounting Engine Event
      const mapping = this.automation.mapAccounts('refund', data.refundMode || 'cash');
      const lines: EngineTransactionLine[] = [];

      // Debit Sales Revenue (Reducing it)
      lines.push({
        accountId: mapping.debitAccount,
        description: `Refund - ${data.reason || 'Returns'}`,
        debitAmount: subtotal,
        creditAmount: 0
      });

      // Debit GST Output (Reducing it) — negative gstAmount so saveGstEntries inserts a
      // negative row in gst_entries, correctly reducing the month's GST Output total.
      if (totalGst > 0) {
        lines.push({
          accountId: this.automation.getGstAccount(),
          description: 'GST Output Reversal',
          debitAmount: totalGst,
          creditAmount: 0,
          gstAmount: -totalGst,   // Negative = reversal/reduction
          gstType: 'output'
        });
      }

      // Reversal of COGS (Debit Inventory, Credit COGS).
      // Gate on average_cost presence only — COGS is unrelated to GST, so a
      // non-GST-applicable item that carried COGS on the sale must also have
      // that COGS reversed on refund (BUG 23).
      let totalCogs = 0;
      for (const item of data.items) {
        const itemDetails = this.db.prepare('SELECT average_cost FROM items WHERE id = ?').get(item.itemId) as any;
        const avgCost = itemDetails ? Number(itemDetails.average_cost) : 0;
        if (avgCost > 0) {
          totalCogs += (avgCost * item.quantity);
        }
      }

      if (totalCogs > 0) {
        const cogsAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '5000' OR subtype = 'cogs' LIMIT 1").get() as any;
        const inventoryAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '1400' OR subtype = 'current_asset' AND name LIKE '%Inventory%' LIMIT 1").get() as any;

        if (cogsAccount && inventoryAccount) {
          // Debit Inventory (Increase stock value)
          lines.push({
            accountId: inventoryAccount.id,
            description: `Inventory Restocked: ${refundNo}`,
            debitAmount: totalCogs,
            creditAmount: 0
          });
          // Credit COGS (Decrease expense)
          lines.push({
            accountId: cogsAccount.id,
            description: `COGS Reversal: ${refundNo}`,
            debitAmount: 0,
            creditAmount: totalCogs
          });
        }
      }

      // Reverse the original sale's Discount Allowed so the refund credits
      // back only the cash the customer actually paid (discountedSubtotal +
      // GST), not the full pre-discount subtotal. Without this, a discounted
      // sale + refund over-pays the customer by exactly the discount amount.
      if (refundDiscountAmount > 0) {
        const discountAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '6400' OR subtype = 'other_expense' LIMIT 1").get() as any;
        if (discountAccount) {
          lines.push({
            accountId: discountAccount.id,
            description: `Discount Allowed Reversal: ${refundNo}`,
            debitAmount: 0,
            creditAmount: refundDiscountAmount
          });
        }
      }

      // Credit Cash/Bank/Customer (Paying them back)
      lines.push({
        accountId: mapping.creditAccount,
        contactId: data.refundMode === 'credit' ? data.customerId : null,
        description: `Refund Payout: ${refundNo}`,
        debitAmount: 0,
        creditAmount: netAmount
      });

      // Look up the original invoice (via transaction_id) to get its taxType for consistent GST reporting
      // Note: tax_type lives on the invoices table, not transactions.
      const originalTx = this.db.prepare(
        'SELECT i.tax_type FROM invoices i WHERE i.transaction_id = ?'
      ).get(data.originalTransactionId) as any;
      const originalTaxType = originalTx?.tax_type || 'standard';

      // Engine `items` is used for stock_movements and invoice_items generation.
      // Apply the same per-line discount factor used for the accounting lines
      // so invoice_items.total_amount matches the actual reversed GST-inclusive
      // amount the customer received back. Stock movements keep the discounted
      // unit price to reflect the cost basis of the items actually returned.
      const eventItems: EngineItem[] = data.items.map(i => {
        const lineTotal = i.quantity * i.unitPrice;
        const discountedLineTotal = Number((lineTotal * originalDiscountFactor).toFixed(2));
        const lineGst = Number((discountedLineTotal * (i.gstRate || 0) / 100).toFixed(2));
        return {
          itemId: i.itemId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          gstRate: i.gstRate || 0,
          gstAmount: lineGst,
          totalAmount: discountedLineTotal + lineGst,
          isStockApplicable: true,
          name: 'Refunded Item'
        };
      });

      const event: EngineEvent = {
        type: 'adjustment', // DB CHECK: must be one of sale|purchase|receipt|payment|transfer|adjustment|journal
        date: data.date,
        contactId: data.customerId,
        description: data.reason || `Refund for TXN #${data.originalTransactionId}`,
        paymentMode: data.refundMode as any,
        items: eventItems,
        subtotal,
        gstAmount: totalGst,
        discountAmount: refundDiscountAmount,
        netAmount,
        lines,
        taxType: originalTaxType
      };

      // 3. Execute in Atomic Transaction
      const result = this.engine.executePipeline(event);

      if (!result.success) {
        return { success: false, message: 'Accounting Engine Failed: ' + result.message };
      }

      const transactionId = result.data.transactionId;

      // 3. Execute stock restoration + refund record atomically.
      // The engine pipeline already committed its own transaction, so if this
      // block fails we must void the transaction to avoid orphaned accounting
      // entries. Everything in this block runs inside a single DB transaction.
      let refundId: number;
      try {
        refundId = this.dbManager.safeTransaction(() => {
          // BUG FIX: Restore stock for refunded items.
          // The engine uses type 'adjustment' (required by DB CHECK constraint),
          // which skips stock movements. We restore stock directly here.
          const updateStock = this.db.prepare('UPDATE items SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?');
          const insertMovement = this.db.prepare(
            `INSERT INTO stock_movements (item_id, transaction_id, type, quantity, unit_cost, total_cost, reference)
             VALUES (?, ?, 'in', ?, ?, ?, ?)`
          );
          for (const item of data.items) {
            const itemDetails = this.db.prepare('SELECT average_cost FROM items WHERE id = ?').get(item.itemId) as any;
            const avgCost = itemDetails ? Number(itemDetails.average_cost) || 0 : 0;
            updateStock.run(item.quantity, item.itemId);
            insertMovement.run(item.itemId, transactionId, item.quantity, avgCost, avgCost * item.quantity, `Refund ${refundNo}`);
          }

          const refundResult = this.db.prepare(`
            INSERT INTO refunds (refund_no, original_transaction_id, customer_id, transaction_id, date, reason, refund_mode, subtotal, gst_amount, total_amount, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            refundNo,
            data.originalTransactionId,
            data.customerId || null,
            transactionId,
            data.date,
            data.reason,
            data.refundMode,
            subtotal,
            totalGst,
            netAmount,
            data.notes || null
          );

          const newRefundId = refundResult.lastInsertRowid as number;

          const insertItem = this.db.prepare(`
            INSERT INTO refund_items (refund_id, item_id, quantity, unit_price, gst_rate, total_amount)
            VALUES (?, ?, ?, ?, ?, ?)
          `);

          for (const item of data.items) {
            const gstRate = item.gstRate ?? 5.0;
            const lineTotal = item.quantity * item.unitPrice;
            const discountedTotal = lineTotal * originalDiscountFactor;
            const lineGst = Number((discountedTotal * gstRate / 100).toFixed(2));
            const total = Number((discountedTotal + lineGst).toFixed(2));
            insertItem.run(newRefundId, item.itemId, item.quantity, item.unitPrice, gstRate, total);
          }

          return newRefundId;
        });
      } catch (postEngineError: any) {
        // Post-engine operations failed. Void the committed transaction to
        // prevent orphaned accounting entries with no refund record.
        this.automation.handleVoid(transactionId, 0, 'Refund post-processing failure: ' + (postEngineError?.message || 'unknown'));
        throw postEngineError;
      }

      this.audit.logAction({
        action: 'REFUND_CREATE',
        entityType: 'refunds',
        entityId: refundId,
        newValues: { refundNo, originalTransactionId: data.originalTransactionId, customerId: data.customerId, transactionId, refundMode: data.refundMode, subtotal, gstAmount: totalGst, totalAmount: netAmount, reason: data.reason }
      });

      return { success: true, message: 'Refund completed successfully', data: { id: refundId } };
    } catch (error: any) {
      console.error('Refund creation error:', error);
      return { success: false, message: 'Failed to process refund: ' + error.message };
    }
  }

  getAll(): ApiResponse<Refund[]> {
    try {
      const refunds = this.db.prepare(`
        SELECT r.*, c.name as customer_name
        FROM refunds r
        LEFT JOIN contacts c ON r.customer_id = c.id
        WHERE r.is_void = 0
        ORDER BY r.date DESC
      `).all();

      const result = (refunds as any[]).map(r => {
        const items = this.db.prepare(`
          SELECT ri.*, i.name as item_name FROM refund_items ri JOIN items i ON ri.item_id = i.id WHERE ri.refund_id = ?
        `).all(r.id);

        return {
          id: r.id, refundNo: r.refund_no, originalTransactionId: r.original_transaction_id,
          customerId: r.customer_id, customerName: r.customer_name, date: r.date,
          reason: r.reason, refundMode: r.refund_mode, subtotal: r.subtotal,
          gstAmount: r.gst_amount, totalAmount: r.total_amount, status: r.status,
          notes: r.notes, createdAt: r.created_at,
          items: (items as any[]).map(i => ({
            itemId: i.item_id, itemName: i.item_name, quantity: i.quantity,
            unitPrice: i.unit_price, gstRate: i.gst_rate, totalAmount: i.total_amount,
          })),
        };
      });

      return { success: true, data: result as Refund[] };
    } catch (error: any) {
      return { success: false, message: 'Failed to get refunds: ' + error.message };
    }
  }

  delete(id: number): ApiResponse {
    try {
      const refund = this.db.prepare('SELECT transaction_id, customer_id FROM refunds WHERE id = ?').get(id) as any;
      if (!refund) {
        return { success: false, message: 'Refund not found' };
      }

      const refundTxId = refund.transaction_id;
      const refundCustomerId = refund.customer_id;

      this.dbManager.safeTransaction(() => {
        // Reverse stock movements for this refund's transaction
        const stockMovements = this.db.prepare('SELECT * FROM stock_movements WHERE transaction_id = ?').all(refundTxId) as any[];
        if (stockMovements.length > 0) {
          const insertStock = this.db.prepare(
            `INSERT INTO stock_movements(item_id, transaction_id, type, quantity, unit_cost, total_cost, reference)
             VALUES(?, ?, ?, ?, ?, ?, ?)`
          );
          for (const mov of stockMovements) {
            const revType = mov.type === 'in' ? 'out' : 'in';
            insertStock.run(mov.item_id, refundTxId, revType, mov.quantity, mov.unit_cost, mov.total_cost, `Deletion reversal of refund ${id}`);
            const qtyChange = revType === 'in' ? mov.quantity : -mov.quantity;
            this.db.prepare('UPDATE items SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?').run(qtyChange, mov.item_id);
          }
        }

        // Delete accounting entries for this refund's transaction
        this.db.prepare('DELETE FROM transaction_lines WHERE transaction_id = ?').run(refundTxId);
        this.db.prepare('DELETE FROM gst_entries WHERE transaction_id = ?').run(refundTxId);
        this.db.prepare('DELETE FROM transactions WHERE id = ?').run(refundTxId);

        // Delete refund records
        this.db.prepare('DELETE FROM refund_items WHERE refund_id = ?').run(id);
        this.db.prepare('DELETE FROM refunds WHERE id = ?').run(id);

        // Recalculate the refund customer's cached balance since the
        // transaction_lines that contributed to it are now gone.
        if (refundCustomerId) {
          this.engine.recalculateContactBalance(refundCustomerId);
        }
      });

      this.audit.logAction({
        action: 'REFUND_DELETE',
        entityType: 'refunds',
        entityId: id,
        newValues: { originalTransactionId: refundTxId }
      });

      return { success: true, message: 'Refund deleted and accounting entries reversed' };
    } catch (error: any) {
      console.error('Delete refund error:', error);
      return { success: false, message: 'Failed to delete refund: ' + error.message };
    }
  }
}
