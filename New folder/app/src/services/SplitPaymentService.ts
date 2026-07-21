import Database from 'better-sqlite3';
import { DatabaseManager } from '../database/DatabaseManager';
import { format } from 'date-fns';
import type { SplitPayment, ApiResponse } from '../types';
import { AccountingEngineService } from './AccountingEngineService';
import type { EngineEvent, EngineTransactionLine, EngineItem } from './AccountingEngineService';
import { AutomationService } from './AutomationService';
import { AuditService } from './AuditService';

export class SplitPaymentService {
  private db: Database.Database;
  private engine: AccountingEngineService;
  private automation: AutomationService;
  private audit: AuditService;

  constructor(dbManager: DatabaseManager) {
    this.db = dbManager.getDatabase();
    this.engine = new AccountingEngineService(dbManager);
    this.automation = new AutomationService(dbManager);
    this.audit = new AuditService(dbManager);
  }

  /**
   * Process a sale with multiple payment modes using proper accounting pipeline
   */
  processSaleWithSplit(customerId: number | undefined, items: any[], payments: SplitPayment[], discountAmount = 0, notes?: string, taxType: 'standard' | 'domestic' = 'standard'): ApiResponse<{ transactionId: number; invoiceNo: string }> {
    try {
      const dateStr = format(new Date(), 'yyyy-MM-dd');

      // Fetch domestic GST rate from settings when tax type is domestic (BUG 22)
      let domesticGstRate = 0;
      if (taxType === 'domestic') {
        const domesticSetting = this.db.prepare("SELECT value FROM settings WHERE key = 'gst_rate_domestic'").get() as any;
        domesticGstRate = domesticSetting ? parseFloat(domesticSetting.value) || 0 : 0;
      }

      // Calculate totals — pre-discount subtotal first so we can apply the
      // discount proportionally per line (matching AccountingService, BUG 20)
      let subtotal = 0;
      const lineCosts: { lineTotal: number; gstAmount: number }[] = [];

      for (const item of items) {
        const lineTotal = item.quantity * item.unitPrice;
        subtotal += lineTotal;
        lineCosts.push({ lineTotal, gstAmount: 0 }); // filled after discountFactor known
      }

      // Discount factor: proportion of subtotal remaining after discount
      const discountFactor = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;

      let totalGst = 0;
      let totalCogs = 0;

      const engineItems: EngineItem[] = items.map((item, idx) => {
        // Fetch the item's GST-applicability flag from the DB so non-applicable
        // items are not charged GST even if a frontend-supplied gstRate is set (BUG 21)
        const itemDetails = this.db.prepare('SELECT gst_applicable, gst_rate, average_cost FROM items WHERE id = ?').get(item.itemId) as any;

        // Determine the GST rate:
        // - domestic tax type overrides with the settings domestic rate, else
        // - the item's DB rate when gst_applicable, else 0
        let gstRate: number;
        if (itemDetails && !itemDetails.gst_applicable) {
          gstRate = 0;
        } else if (taxType === 'domestic') {
          gstRate = domesticGstRate;
        } else {
          gstRate = item.gstRate ?? itemDetails?.gst_rate ?? 5.0;
        }

        const lineTotal = lineCosts[idx].lineTotal;
        // Apply discount proportionally BEFORE computing GST so split-payment
        // sales record the same GST as regular sales (BUG 20)
        const discountedLineTotal = lineTotal * discountFactor;
        const lineGst = Number((discountedLineTotal * gstRate / 100).toFixed(2));
        lineCosts[idx].gstAmount = lineGst;
        totalGst += lineGst;
        totalCogs += ((itemDetails?.average_cost || item.averageCost || 0) * item.quantity);

        return {
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstRate,
          gstAmount: lineGst,
          totalAmount: Number((discountedLineTotal + lineGst).toFixed(2)),
          name: item.itemName,
          isStockApplicable: true
        };
      });

      totalGst = Number(totalGst.toFixed(2));
      const netAmount = subtotal - discountAmount + totalGst;

      // Validate payments sum equals net amount
      const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(paymentTotal - netAmount) > 0.01) {
        return { success: false, message: `Payment total (Nu. ${paymentTotal.toFixed(2)}) does not match invoice total (Nu. ${netAmount.toFixed(2)})` };
      }

      // Build transaction lines
      const lines: EngineTransactionLine[] = [];

      // Debit each payment account.
      // Resolve the debit account per payment mode via the same Automation
      // account-mapping used by normal sales so credit sales hit AR (1300)
      // instead of Bank (1200) (BUG 19).
      for (const payment of payments) {
        let debitAccountId: number | null = null;
        try {
          const mapping = this.automation.mapAccounts('sale', payment.mode);
          debitAccountId = mapping.debitAccount;
        } catch {
          // Fall back to a code-based lookup for unmapped modes
          const fallbackCode = payment.mode === 'cash' ? '1100' : (payment.mode === 'credit' ? '1300' : '1200');
          const account = this.db.prepare('SELECT id FROM accounts WHERE code = ?').get(fallbackCode) as any;
          debitAccountId = account?.id ?? null;
        }
        if (debitAccountId) {
          lines.push({
            accountId: debitAccountId,
            description: `Payment via ${payment.mode}`,
            debitAmount: payment.amount,
            creditAmount: 0
          });
        }
      }

      // Handle discount
      if (discountAmount > 0) {
        const discountAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '6400'").get() as any;
        if (discountAccount) {
          lines.push({
            accountId: discountAccount.id,
            description: 'Discount Allowed',
            debitAmount: discountAmount,
            creditAmount: 0
          });
        }
      }

      // Credit sales revenue - look up account ID from database by code
      const salesRevenueAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '4000'").get() as any;
      if (salesRevenueAccount) {
        lines.push({
          accountId: salesRevenueAccount.id,
          description: 'Sales Revenue',
          debitAmount: 0,
          creditAmount: subtotal
        });
      }

      // Credit GST Output - look up account ID from database by code
      if (totalGst > 0) {
        const gstOutputAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '2200'").get() as any;
        if (gstOutputAccount) {
          lines.push({
            accountId: gstOutputAccount.id,
            description: 'GST Output',
            debitAmount: 0,
            creditAmount: totalGst
          });
        }
      }

      // COGS entries - look up account IDs from database by code
      if (totalCogs > 0) {
        const cogsAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '5000'").get() as any;
        const inventoryAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '1400'").get() as any;
        if (cogsAccount) {
          lines.push({
            accountId: cogsAccount.id,
            description: 'Cost of Goods Sold',
            debitAmount: totalCogs,
            creditAmount: 0
          });
        }
        if (inventoryAccount) {
          lines.push({
            accountId: inventoryAccount.id,
            description: 'Inventory Reduction',
            debitAmount: 0,
            creditAmount: totalCogs
          });
        }
      }

      // Determine primary payment mode for transaction
      const primaryMode = payments[0].mode;

      // Create engine event
      const event: EngineEvent = {
        type: 'sale',
        date: dateStr,
        contactId: customerId,
        description: notes || `Split payment sale - ${payments.map(p => p.mode).join(', ')}`,
        paymentMode: primaryMode as any,
        subtotal,
        gstAmount: totalGst,
        discountAmount,
        netAmount,
        lines,
        items: engineItems,
        taxType,
        reference: `SPLIT-${Date.now().toString(36).toUpperCase()}`
      };

      // Execute via Accounting Engine
      const engineResult = this.engine.executePipeline(event);

      if (!engineResult.success) {
        return { success: false, message: engineResult.message || 'Accounting pipeline failed' };
      }

      const transactionId = (engineResult.data as any)?.transactionId;

      // Create invoice with unique number (timestamp + random suffix to prevent collisions)
      const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      this.db.prepare(`
        INSERT INTO invoices (invoice_no, transaction_id, contact_id, subtotal, gst_amount, discount_amount, total_amount, payment_status, balance_due, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', 0, ?)
      `).run(invoiceNo, transactionId, customerId || null, subtotal, totalGst, discountAmount, netAmount, dateStr);

      this.audit.logAction({
        action: 'SPLIT_SALE_CREATE',
        entityType: 'invoices',
        entityId: transactionId,
        newValues: { invoiceNo, customerId, transactionId, subtotal, gstAmount: totalGst, discountAmount, netAmount, payments: payments.map(p => ({ mode: p.mode, amount: p.amount })), taxType }
      });

      return { success: true, message: 'Sale with split payment completed', data: { transactionId, invoiceNo } };
    } catch (error: any) {
      console.error('[SplitPaymentService] Error:', error);
      return { success: false, message: 'Failed: ' + error.message };
    }
  }
}
