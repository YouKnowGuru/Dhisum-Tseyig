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
    // Probe for a free slot and, on the rare collision, fall back to a
    // random-suffixed number so a concurrent insert can't produce a
    // duplicate (which would otherwise abort the whole refund via UNIQUE).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    const maxRow = this.db.prepare(
      "SELECT MAX(CAST(SUBSTR(refund_no, 4) AS INTEGER)) as max_num FROM refunds WHERE refund_no LIKE 'RF-%'"
    ).get() as any;
    const base = (maxRow?.max_num || 0) + 1;
    const checkExisting = this.db.prepare('SELECT 1 FROM refunds WHERE refund_no = ?');
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = `RF-${String(base + attempt).padStart(5, '0')}`;
      if (!checkExisting.get(candidate)) return candidate;
    }
    // Last-ditch: random suffix guarantees uniqueness.
    return `RF-${String(base).padStart(5, '0')}-${crypto.randomInt(0, 10000).toString().padStart(4, '0')}`;
  }

  create(data: CreateRefundData): ApiResponse<{ id: number }> {
    try {
      if (!data.items || data.items.length === 0) {
        return { success: false, message: 'No items in refund' };
      }

      // ------------------------------------------------------------------
      // 1. Pull the ORIGINAL sale's per-line data (GST rate + cost) so the
      // refund reverses EXACTLY what was charged — not the item's current
      // (possibly changed) GST rate or average cost.
      // ------------------------------------------------------------------
      const origInvoice = this.db.prepare(
        'SELECT id, discount_amount, subtotal, tax_type FROM invoices WHERE transaction_id = ?'
      ).get(data.originalTransactionId) as any;

      // Original invoice items keyed by item_id: the authoritative GST rate per line.
      const origInvoiceItems = new Map<number, { gst_rate: number; gst_applicable: number; unit_price: number }>();
      if (origInvoice) {
        const rows = this.db.prepare(`
          SELECT ii.item_id, ii.gst_rate, ii.unit_price,
                 COALESCE(i.gst_applicable, 1) as gst_applicable
          FROM invoice_items ii
          LEFT JOIN items i ON i.id = ii.item_id
          WHERE ii.invoice_id = ?
        `).all(origInvoice.id) as any[];
        for (const r of rows) {
          origInvoiceItems.set(r.item_id, { gst_rate: Number(r.gst_rate) || 0, gst_applicable: r.gst_applicable, unit_price: Number(r.unit_price) || 0 });
        }
      }

      // Original COGS per item from the sale's stock_movements (out) unit_cost.
      const origCogsCost = new Map<number, number>();
      const movRows = this.db.prepare(
        "SELECT item_id, unit_cost FROM stock_movements WHERE transaction_id = ? AND type = 'out'"
      ).all(data.originalTransactionId) as any[];
      for (const m of movRows) {
        // Prefer the last recorded cost if multiple movements exist for the item.
        origCogsCost.set(m.item_id, Number(m.unit_cost) || 0);
      }

      const originalDiscountAmount = origInvoice ? Number(origInvoice.discount_amount) || 0 : 0;
      const originalSubtotal = origInvoice ? Number(origInvoice.subtotal) || 0 : 0;
      const originalTaxType = origInvoice?.tax_type || 'standard';

      const refundNo = this.generateRefundNo();
      let subtotal = 0;
      let discountedSubtotal = 0;
      let totalGst = 0;

      // Compute the original discount factor so each refund line's GST is
      // computed on the same discounted amount the customer paid originally.
      const originalDiscountFactor = originalSubtotal > 0 ? (originalSubtotal - originalDiscountAmount) / originalSubtotal : 1;

      // Resolve each refund line's GST rate: prefer the ORIGINAL invoice line
      // rate; fall back to the current item rate only when the original invoice
      // can't be found (legacy sales without invoice_items).
      const resolvedGstRate = new Map<number, number>();
      for (const item of data.items) {
        const orig = origInvoiceItems.get(item.itemId);
        const itemDetails = this.db.prepare('SELECT gst_rate, gst_applicable FROM items WHERE id = ?').get(item.itemId) as any;
        let rate: number;
        if (orig) {
          rate = orig.gst_applicable ? orig.gst_rate : 0;
        } else {
          rate = itemDetails?.gst_applicable ? (item.gstRate ?? itemDetails?.gst_rate ?? 5.0) : 0;
        }
        resolvedGstRate.set(item.itemId, rate);
      }

      for (const item of data.items) {
        const gstRate = resolvedGstRate.get(item.itemId) || 0;
        const lineTotal = item.quantity * item.unitPrice;
        const discountedLineTotal = lineTotal * originalDiscountFactor;
        const lineGst = Number((discountedLineTotal * gstRate / 100).toFixed(2));
        subtotal += lineTotal;
        discountedSubtotal += discountedLineTotal;
        totalGst += lineGst;
      }

      const refundDiscountAmount = Number((subtotal - discountedSubtotal).toFixed(2));
      // Derive netAmount so debit total (subtotal + totalGst) always equals
      // credit total (refundDiscountAmount + netAmount) exactly.
      const netAmount = subtotal + totalGst - refundDiscountAmount;

      // ------------------------------------------------------------------
      // 2. Build the balanced journal lines.
      // ------------------------------------------------------------------
      const mapping = this.automation.mapAccounts('refund', data.refundMode || 'cash');
      const lines: EngineTransactionLine[] = [];

      // Debit Sales Revenue (reduce it) by the pre-discount subtotal
      lines.push({
        accountId: mapping.debitAccount,
        description: `Refund - ${data.reason || 'Returns'}`,
        debitAmount: subtotal,
        creditAmount: 0
      });

      // Debit GST Output (reduce it) — negative gstAmount reduces the month's total.
      if (totalGst > 0) {
        lines.push({
          accountId: this.automation.getGstAccount(),
          description: 'GST Output Reversal',
          debitAmount: totalGst,
          creditAmount: 0,
          gstAmount: -totalGst,
          gstType: 'output'
        });
      }

      // Reverse COGS at the ORIGINAL sale's cost (Dr Inventory / Cr COGS).
      let totalCogs = 0;
      for (const item of data.items) {
        const origCost = origCogsCost.get(item.itemId);
        const itemDetails = this.db.prepare('SELECT average_cost FROM items WHERE id = ?').get(item.itemId) as any;
        // Prefer original sale cost; fall back to current average cost.
        const cost = (origCost !== undefined && origCost > 0)
          ? origCost
          : (itemDetails ? Number(itemDetails.average_cost) || 0 : 0);
        if (cost > 0) totalCogs += cost * item.quantity;
      }
      totalCogs = Number(totalCogs.toFixed(2));

      if (totalCogs > 0) {
        const cogsAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '5000' LIMIT 1").get() as any;
        const inventoryAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '1400' LIMIT 1").get() as any;
        if (cogsAccount && inventoryAccount) {
          lines.push({ accountId: inventoryAccount.id, description: `Inventory Restocked: ${refundNo}`, debitAmount: totalCogs, creditAmount: 0 });
          lines.push({ accountId: cogsAccount.id, description: `COGS Reversal: ${refundNo}`, debitAmount: 0, creditAmount: totalCogs });
        }
      }

      // Credit back the original Discount Allowed so the customer is refunded
      // only what they actually paid (discounted amount + GST).
      if (refundDiscountAmount > 0) {
        const discountAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '6400' LIMIT 1").get() as any;
        if (discountAccount) {
          lines.push({ accountId: discountAccount.id, description: `Discount Allowed Reversal: ${refundNo}`, debitAmount: 0, creditAmount: refundDiscountAmount });
        }
      }

      // Credit Cash/Bank/Customer (pay them back)
      lines.push({
        accountId: mapping.creditAccount,
        contactId: data.refundMode === 'credit' ? data.customerId : null,
        description: `Refund Payout: ${refundNo}`,
        debitAmount: 0,
        creditAmount: netAmount
      });

      // Engine items: used for the stock-restore movements (type 'in'). The
      // refund record itself (refunds/refund_items) is the source of truth for
      // the reversal — the engine does NOT create an invoice for type 'refund'.
      const eventItems: EngineItem[] = data.items.map(i => {
        const rate = resolvedGstRate.get(i.itemId) || 0;
        const lineTotal = i.quantity * i.unitPrice;
        const discountedLineTotal = Number((lineTotal * originalDiscountFactor).toFixed(2));
        const lineGst = Number((discountedLineTotal * rate / 100).toFixed(2));
        return {
          itemId: i.itemId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          gstRate: rate,
          gstAmount: lineGst,
          totalAmount: discountedLineTotal + lineGst,
          isStockApplicable: true,
          name: 'Refunded Item'
        };
      });

      // ------------------------------------------------------------------
      // 3. Execute atomically: journal + GST entries + stock restore + the
      // refunds/refund_items records ALL inside the engine's single transaction
      // (via the extraWrites hook). Any failure rolls the whole thing back —
      // no more committed journal without a refund record, and no userId:0
      // compensation path.
      // ------------------------------------------------------------------
      let refundId = 0;
      const event: EngineEvent = {
        type: 'refund',
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
        taxType: originalTaxType,
        extraWrites: (transactionId) => {
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
          refundId = refundResult.lastInsertRowid as number;

          const insertItem = this.db.prepare(`
            INSERT INTO refund_items (refund_id, item_id, quantity, unit_price, gst_rate, total_amount)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          for (const item of data.items) {
            const rate = resolvedGstRate.get(item.itemId) ?? 0;
            const lineTotal = item.quantity * item.unitPrice;
            const discountedTotal = lineTotal * originalDiscountFactor;
            const lineGst = Number((discountedTotal * rate / 100).toFixed(2));
            const total = Number((discountedTotal + lineGst).toFixed(2));
            insertItem.run(refundId, item.itemId, item.quantity, item.unitPrice, rate, total);
          }
        }
      };

      const result = this.engine.executePipeline(event);

      if (!result.success) {
        return { success: false, message: 'Accounting Engine Failed: ' + result.message };
      }

      this.audit.logAction({
        action: 'REFUND_CREATE',
        entityType: 'refunds',
        entityId: refundId,
        newValues: { refundNo, originalTransactionId: data.originalTransactionId, customerId: data.customerId, transactionId: result.data.transactionId, refundMode: data.refundMode, subtotal, gstAmount: totalGst, totalAmount: netAmount, reason: data.reason }
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
