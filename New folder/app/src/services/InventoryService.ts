import { DatabaseManager } from '../database/DatabaseManager';
import Database from 'better-sqlite3';
import { format, parseISO, isAfter } from 'date-fns';
import { roundMoney, toCents, fromCents } from '../utils/money';
import type {
  Item,
  CreateItemData,
  AddStockData,
  StockMovement,
  ApiResponse,
  ItemCategory,
  ItemUnit
} from '../types';

import { AutomationService } from './AutomationService';
import { AuditService } from './AuditService';

/**
 * InventoryService - Manages stock, items, and inventory operations
 * Uses Average Cost Method for COGS calculation
 */
export class InventoryService {
  private db: Database.Database;
  private dbManager: DatabaseManager;
  private automation: AutomationService;
  private audit: AuditService;

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
    this.db = dbManager.getDatabase();
    this.automation = new AutomationService(dbManager);
    this.audit = new AuditService(dbManager);
  }

  // ============================================
  // ITEM MANAGEMENT
  // ============================================

  createItem(data: CreateItemData): ApiResponse<Item> {
    return this.dbManager.safeTransaction(() => {
      try {
        if (!data.name) {
          return { success: false, message: 'Item name is required' };
        }

        const code = data.code || this.generateItemCode();
        const existing = this.db.prepare('SELECT 1 FROM items WHERE code = ?').get(code);
        if (existing) {
          return { success: false, message: 'Item code already exists' };
        }

        const openingStock = data.openingStock || 0;
        const openingPrice = data.openingPurchasePrice || data.purchasePrice || 0;

        const result = this.db.prepare(`
          INSERT INTO items 
          (code, name, description, category, unit, purchase_price, selling_price, reorder_level, gst_applicable, gst_rate, quantity_in_stock, average_cost)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          code,
          data.name,
          data.description || null,
          data.category || null,
          data.unit || 'pcs',
          data.purchasePrice || data.openingPurchasePrice || 0,
          data.sellingPrice || 0,
          data.reorderLevel || 10,
          data.gstApplicable !== false ? 1 : 0,
          data.gstRate || 5.0,
          openingStock,
          openingPrice
        );

        const itemId = result.lastInsertRowid as number;

        if (openingStock > 0) {
          const totalCost = openingStock * openingPrice;

          // Validate required GL accounts BEFORE creating any rows so the
          // outer safeTransaction rolls back the entire opening-stock entry
          // (item + stock_movement + journal + lines) if the COA is incomplete,
          // instead of leaving an unbalanced orphan transaction behind.
          const invAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '1400'").get() as any;
          const equityAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '3100'").get() as any;
          if (!invAccount || !equityAccount) {
            throw new Error('Opening Stock requires GL accounts 1400 (Inventory) and 3100 (Opening Balance Equity). Please set up your Chart of Accounts.');
          }

          this.db.prepare(`
            INSERT INTO stock_movements (item_id, type, quantity, unit_cost, total_cost, notes)
            VALUES (?, 'in', ?, ?, ?, 'Opening Stock')
          `).run(itemId, openingStock, openingPrice, totalCost);

          const transactionId = (this.db.prepare(`
            INSERT INTO transactions (transaction_no, type, date, description, total_amount, net_amount, status)
            VALUES (?, 'journal', ?, ?, ?, ?, 'completed')
          `).run(
            this.generateTransactionNo('JV'),
            format(new Date(), 'yyyy-MM-dd'),
            `Opening Stock - ${data.name}`,
            totalCost,
            totalCost
          ).lastInsertRowid) as number;

          this.db.prepare(`
            INSERT INTO transaction_lines (transaction_id, account_id, description, debit_amount, credit_amount)
            VALUES (?, ?, 'Opening Stock', ?, 0)
          `).run(transactionId, invAccount.id, totalCost);

          this.db.prepare(`
            INSERT INTO transaction_lines (transaction_id, account_id, description, debit_amount, credit_amount)
            VALUES (?, ?, 'Opening Stock Counterpart', 0, ?)
          `).run(transactionId, equityAccount.id, totalCost);
        }

        const item = this.getItemById(itemId);

        this.audit.logAction({
          action: 'CREATE_ITEM',
          entityType: 'items',
          entityId: itemId,
          newValues: data
        });

        return { success: true, data: item, message: 'Item created successfully' };
      } catch (error: any) {
        console.error('Create item error:', error);
        throw error; // Rethrow to rollback transaction
      }
    });
  }

  getItemById(id: number): Item | undefined {
    try {
      const item = this.db.prepare('SELECT * FROM items WHERE id = ?').get(id) as any;
      if (!item) return undefined;
      return this.mapItemFromDb(item);
    } catch (error) {
      console.error('Get item error:', error);
      return undefined;
    }
  }

  getAllItems(): Item[] {
    try {
      // Cap at 500 for dropdown/picker usage — use getItemsPaginated for full table views
      const items = this.db.prepare('SELECT * FROM items WHERE is_active = 1 ORDER BY name LIMIT 500').all();
      return items.map((i: any) => this.mapItemFromDb(i));
    } catch (error) {
      console.error('Get all items error:', error);
      return [];
    }
  }

  getItemsPaginated(page: number = 1, limit: number = 50, search: string = ''): { items: Item[]; total: number } {
    try {
      const offset = (page - 1) * limit;
      const safeLimit = Math.min(Math.max(1, limit), 200);

      if (search && search.trim()) {
        const pattern = `%${search.trim()}%`;
        const total = (this.db.prepare(`
          SELECT COUNT(*) AS cnt FROM items
          WHERE is_active = 1 AND (name LIKE ? OR code LIKE ? OR category LIKE ?)
        `).get(pattern, pattern, pattern) as any).cnt;
        const items = this.db.prepare(`
          SELECT * FROM items
          WHERE is_active = 1 AND (name LIKE ? OR code LIKE ? OR category LIKE ?)
          ORDER BY name LIMIT ? OFFSET ?
        `).all(pattern, pattern, pattern, safeLimit, offset);
        return { items: items.map((i: any) => this.mapItemFromDb(i)), total };
      }

      const total = (this.db.prepare(`SELECT COUNT(*) AS cnt FROM items WHERE is_active = 1`).get() as any).cnt;
      const items = this.db.prepare(`
        SELECT * FROM items WHERE is_active = 1 ORDER BY name LIMIT ? OFFSET ?
      `).all(safeLimit, offset);
      return { items: items.map((i: any) => this.mapItemFromDb(i)), total };
    } catch (error) {
      console.error('Get items paginated error:', error);
      return { items: [], total: 0 };
    }
  }

  searchItems(query: string): any[] {
    try {
      if (!query) return [];

      // For 1-char queries, try exact barcode match or exact code match
      if (query.length === 1) {
        const barcodeItem = this.db.prepare(`
          SELECT i.* FROM items i
          JOIN barcode_mappings bm ON i.id = bm.item_id
          WHERE bm.barcode = ? AND i.is_active = 1
          LIMIT 1
        `).get(query) as any;

        if (barcodeItem) {
          return [{ ...this.mapItemFromDb(barcodeItem), _isExactMatch: true }];
        }

        const codeItem = this.db.prepare(`
          SELECT * FROM items WHERE code = ? AND is_active = 1 LIMIT 1
        `).get(query) as any;

        if (codeItem) {
          return [{ ...this.mapItemFromDb(codeItem), _isExactMatch: true }];
        }

        return [];
      }

      const searchTerm = `%${query}%`;

      // Search by name, code, category, OR barcode (LIKE match)
      const items = this.db.prepare(`
        SELECT DISTINCT i.*,
          CASE
            WHEN i.code = ? THEN 1
            WHEN bm.barcode = ? THEN 2
            WHEN i.code LIKE ? THEN 3
            ELSE 4
          END as match_order
        FROM items i
        LEFT JOIN barcode_mappings bm ON i.id = bm.item_id
        WHERE i.is_active = 1
        AND (
          i.name LIKE ?
          OR i.code LIKE ?
          OR i.category LIKE ?
          OR bm.barcode LIKE ?
        )
        ORDER BY match_order, i.name
        LIMIT 20
      `).all(query, query, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);

      return items.map((i: any) => ({
        ...this.mapItemFromDb(i),
        _isExactMatch: i.match_order === 1 || i.match_order === 2
      }));
    } catch (error) {
      console.error('Search items error:', error);
      return [];
    }
  }

  updateItem(id: number, data: Partial<CreateItemData>): ApiResponse {
    return this.dbManager.safeTransaction(() => {
      try {
        const sets: string[] = [];
        const values: any[] = [];

        const mapping: Record<string, string> = {
          name: 'name',
          code: 'code',
          description: 'description',
          category: 'category',
          unit: 'unit',
          purchasePrice: 'purchase_price',
          sellingPrice: 'selling_price',
          reorderLevel: 'reorder_level',
          gstApplicable: 'gst_applicable',
          gstRate: 'gst_rate'
        };

        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && mapping[key]) {
            sets.push(`${mapping[key]} = ?`);
            values.push(key === 'gstApplicable' ? (value ? 1 : 0) : value);
          }
        });

        if (sets.length === 0) {
          return { success: false, message: 'No fields to update' };
        }

        // Capture old values before the change so the audit trail can diff
        const oldItem = this.db.prepare('SELECT * FROM items WHERE id = ?').get(id) as any;

        values.push(id);

        this.db.prepare(`UPDATE items SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);

        this.audit.logAction({
          action: 'UPDATE_ITEM',
          entityType: 'items',
          entityId: id,
          newValues: data,
          oldValues: oldItem || undefined
        });

        return { success: true, message: 'Item updated successfully' };
      } catch (error: any) {
        console.error('Update item error:', error);
        return { success: false, message: 'Failed to update item: ' + error.message };
      }
    });
  }

  deleteItem(id: number): ApiResponse {
    return this.dbManager.safeTransaction(() => {
      try {
        // Prevent deletion if items are used in history
        this.automation.preventInvalidDeletion('item', id);

        // Capture the item row before deletion so the audit trail preserves what was removed
        const oldItem = this.db.prepare('SELECT * FROM items WHERE id = ?').get(id) as any;

        this.db.prepare('DELETE FROM items WHERE id = ?').run(id);

        this.audit.logAction({
          action: 'DELETE_ITEM',
          entityType: 'items',
          entityId: id,
          oldValues: oldItem || undefined
        });

        return { success: true, message: 'Item deleted successfully' };
      } catch (error: any) {
        // If error is about history, it's a known business rule, not a system failure
        if (error.message.includes('history')) {
          console.log('Item deactivation triggered (has related records and history):', id);
          this.db.prepare('UPDATE items SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
          return { success: true, message: 'Item deactivated (has related records and history)' };
        }

        console.error('Delete item error:', error);
        return { success: false, message: 'Failed to delete item: ' + error.message };
      }
    });
  }

  getLowStockItems(): Item[] {
    try {
      const items = this.db.prepare(`
        SELECT * FROM items 
        WHERE is_active = 1 
        AND quantity_in_stock <= reorder_level
        ORDER BY quantity_in_stock ASC
      `).all();

      return items.map((i: any) => this.mapItemFromDb(i));
    } catch (error) {
      console.error('Get low stock error:', error);
      return [];
    }
  }

  // ============================================
  // CATEGORY & UNIT MANAGEMENT
  // ============================================

  getCategories(): ItemCategory[] {
    try {
      return this.db.prepare('SELECT * FROM item_categories ORDER BY name').all() as ItemCategory[];
    } catch (error) {
      console.error('Get categories error:', error);
      return [];
    }
  }

  createCategory(name: string): ApiResponse<ItemCategory> {
    try {
      const result = this.db.prepare('INSERT INTO item_categories (name) VALUES (?)').run(name);
      const newCat = this.db.prepare('SELECT * FROM item_categories WHERE id = ?').get(result.lastInsertRowid) as ItemCategory;
      return { success: true, data: newCat, message: 'Category created successfully' };
    } catch (error: any) {
      console.error('Create category error:', error);
      return { success: false, message: 'Failed to create category: ' + error.message };
    }
  }

  deleteCategory(id: number): ApiResponse {
    try {
      // Check if any items use this category
      const category = this.db.prepare('SELECT name FROM item_categories WHERE id = ?').get(id) as any;
      if (category) {
        const inUse = this.db.prepare('SELECT 1 FROM items WHERE category = ? LIMIT 1').get(category.name);
        if (inUse) {
          return { success: false, message: 'Category is in use and cannot be deleted' };
        }
      }
      this.db.prepare('DELETE FROM item_categories WHERE id = ?').run(id);
      return { success: true, message: 'Category deleted successfully' };
    } catch (error: any) {
      console.error('Delete category error:', error);
      return { success: false, message: 'Failed to delete category: ' + error.message };
    }
  }

  getUnits(): ItemUnit[] {
    try {
      return this.db.prepare('SELECT * FROM item_units ORDER BY name').all() as ItemUnit[];
    } catch (error) {
      console.error('Get units error:', error);
      return [];
    }
  }

  createUnit(name: string): ApiResponse<ItemUnit> {
    try {
      const result = this.db.prepare('INSERT INTO item_units (name) VALUES (?)').run(name);
      const newUnit = this.db.prepare('SELECT * FROM item_units WHERE id = ?').get(result.lastInsertRowid) as ItemUnit;
      return { success: true, data: newUnit, message: 'Unit created successfully' };
    } catch (error: any) {
      console.error('Create unit error:', error);
      return { success: false, message: 'Failed to create unit: ' + error.message };
    }
  }

  deleteUnit(id: number): ApiResponse {
    try {
      // Check if any items use this unit
      const unit = this.db.prepare('SELECT name FROM item_units WHERE id = ?').get(id) as any;
      if (unit) {
        const inUse = this.db.prepare('SELECT 1 FROM items WHERE unit = ? LIMIT 1').get(unit.name);
        if (inUse) {
          return { success: false, message: 'Unit is in use and cannot be deleted' };
        }
      }
      this.db.prepare('DELETE FROM item_units WHERE id = ?').run(id);
      return { success: true, message: 'Unit deleted successfully' };
    } catch (error: any) {
      console.error('Delete unit error:', error);
      return { success: false, message: 'Failed to delete unit: ' + error.message };
    }
  }

  // ============================================
  // STOCK MANAGEMENT
  // ============================================

  addStock(data: AddStockData): ApiResponse {
    return this.dbManager.safeTransaction(() => {
      try {
        if (data.quantity <= 0) {
          return { success: false, message: 'Quantity must be greater than zero' };
        }

        let itemId = data.itemId;

        // Create new item if itemId not provided
        if (!itemId && data.itemName) {
          const existingItem = this.db.prepare('SELECT id FROM items WHERE name = ? AND is_active = 1').get(data.itemName);
          if (existingItem) {
            itemId = (existingItem as any).id;
          } else {
            const newItemResult = this.createItem({
              name: data.itemName,
              purchasePrice: data.purchasePrice,
              sellingPrice: data.sellingPrice,
              gstApplicable: data.gstApplicable,
              gstRate: data.gstRate,
            });

            if (newItemResult.success && newItemResult.data) {
              itemId = newItemResult.data.id;
            } else {
              return { success: false, message: newItemResult.message || 'Failed to create item' };
            }
          }
        }

        if (!itemId) {
          return { success: false, message: 'Item ID or name is required' };
        }

        const item = this.db.prepare('SELECT quantity_in_stock, average_cost, gst_rate FROM items WHERE id = ?').get(itemId) as any;
        if (!item) return { success: false, message: 'Item not found' };

        const currentQty = item.quantity_in_stock;
        const currentAvgCost = item.average_cost;
        const newQty = data.quantity;
        const newCost = data.purchasePrice;

        let newAverageCost = currentAvgCost;
        // BUG-09 FIX: If current quantity is negative, treat it as 0
        // for average cost calculations so it doesn't corrupt calculations.
        const effectiveQty = Math.max(0, currentQty);
        if (effectiveQty + newQty > 0) {
          newAverageCost = ((effectiveQty * currentAvgCost) + (newQty * newCost)) / (effectiveQty + newQty);
        } else {
          newAverageCost = newCost;
        }

        this.db.prepare(`
          UPDATE items 
          SET quantity_in_stock = quantity_in_stock + ?,
              average_cost = ?,
              purchase_price = ?,
              selling_price = CASE WHEN ? > 0 THEN ? ELSE selling_price END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newQty, newAverageCost, newCost, data.sellingPrice || 0, data.sellingPrice || 0, itemId);

        const totalCost = newQty * newCost;
        this.db.prepare(`
          INSERT INTO stock_movements (item_id, type, quantity, unit_cost, total_cost, reference, notes)
          VALUES (?, 'in', ?, ?, ?, ?, ?)
        `).run(itemId, newQty, newCost, totalCost, data.reference || null, data.notes || 'Purchased Stock');

        const gstRate = data.gstRate || item.gst_rate || 5.0;
        const gstAmount = data.gstApplicable ? (totalCost * gstRate / 100) : 0;
        const totalAmount = totalCost + gstAmount;

        if (isNaN(totalAmount)) {
          throw new Error('Invalid stock calculation result (NaN).');
        }

        // Honor an optional supplied posting date (validated, not future, and
        // not in a locked period). GST month/year are derived from THIS date so
        // a backdated purchase files its GST input in the correct period.
        let txDate = format(new Date(), 'yyyy-MM-dd');
        if (data.date) {
          const parsed = parseISO(data.date);
          if (isNaN(parsed.getTime())) {
            throw new Error(`Invalid purchase date: ${data.date}`);
          }
          const endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);
          if (isAfter(parsed, endOfToday)) {
            throw new Error('Purchase date cannot be in the future.');
          }
          const lock = this.db.prepare(
            'SELECT 1 FROM period_locks WHERE year = ? AND month = ? AND is_locked = 1'
          ).get(parsed.getFullYear(), parsed.getMonth() + 1);
          if (lock) {
            throw new Error('Period Lock: Cannot post a purchase into a locked period.');
          }
          txDate = format(parsed, 'yyyy-MM-dd');
        }
        const txDateObj = parseISO(txDate);
        const txMonth = txDateObj.getMonth() + 1;
        const txYear = txDateObj.getFullYear();

        const transactionId = (this.db.prepare(`
          INSERT INTO transactions (transaction_no, type, date, reference, contact_id, description, total_amount, gst_amount, net_amount, payment_mode, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
        `).run(
          this.generateTransactionNo(data.paymentMode === 'credit' ? 'PUR' : 'PV'),
          data.paymentMode === 'credit' ? 'purchase' : 'payment',
          txDate,
          data.reference || null,
          data.supplierId || null,
          `Stock Purchase - ${data.itemName || 'Multiple Items'}`,
          totalAmount,
          gstAmount,
          totalAmount,
          data.paymentMode
        ).lastInsertRowid) as number;

        this.createPurchaseAccountingEntries(transactionId, data, totalAmount, totalCost, gstAmount);

        if (data.paymentMode === 'credit' && data.supplierId) {
          this.db.prepare('UPDATE contacts SET current_balance = current_balance + ? WHERE id = ?').run(totalAmount, data.supplierId);
        }

        if (gstAmount > 0) {
          // Use the transaction date for GST entry month/year, not current system date
          // This ensures GST entries align with the transaction period even if backdated
          this.db.prepare(`
            INSERT INTO gst_entries (transaction_id, type, amount, rate, month, year)
            VALUES (?, 'input', ?, ?, ?, ?)
          `).run(transactionId, gstAmount, gstRate, txMonth, txYear);
        }

        this.audit.logAction({
          action: 'ADD_STOCK',
          entityType: 'items',
          entityId: itemId,
          newValues: { quantity: newQty, cost: newCost, total: totalAmount }
        });

        return { success: true, message: 'Stock added successfully' };
      } catch (error: any) {
        console.error('Add stock error:', error);
        // Re-throwing is INTENTIONAL: it is what makes safeTransaction roll back
        // the partially-written rows (item stock update, transaction row, GST
        // entry) when the accounting validation fails. This guarantees an
        // unbalanced/misconfigured purchase can never be partially committed.
        // Callers that want a clean ApiResponse instead of a throw should use
        // addStockSafe() below.
        throw error;
      }
    });
  }

  /**
   * Public wrapper that converts addStock's thrown validation errors into a
   * clean ApiResponse, while preserving the atomic rollback that the throw
   * provides. Use this from IPC handlers so the renderer gets success:false
   * instead of an unhandled rejection.
   */
  addStockSafe(data: AddStockData): ApiResponse {
    try {
      return this.addStock(data);
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to add stock' };
    }
  }

  adjustStock(itemId: number, quantity: number, reason: string, reference?: string): ApiResponse {
    try {
      // BUG FIX: the whole operation (transaction row + stock movement + item
      // quantity + GL journal) must be atomic. Previously it ran with no
      // transaction, so a mid-way failure left stock and the ledger inconsistent.
      return this.dbManager.safeTransaction(() => {
        const item = this.getItemById(itemId);

        if (!item) {
          return { success: false, message: 'Item not found' };
        }

        const currentQty = item.quantityInStock;
        const newQty = currentQty + quantity;

        if (newQty < 0) {
          return { success: false, message: 'Adjustment would result in negative stock' };
        }

        // Value of the adjustment at the item's current average cost. This is
        // the amount that must be reflected in the Inventory GL so the stock
        // valuation report equals the Inventory account balance (BUG: adjustStock
        // used to post NO journal, so the two always drifted apart).
        const adjustmentValue = Number((quantity * (item.averageCost || 0)).toFixed(2));
        const absValue = Math.abs(adjustmentValue);

        const transactionNo = this.generateTransactionNo('ADJ');
        const date = format(new Date(), 'yyyy-MM-dd');

        const transactionResult = this.db.prepare(`
          INSERT INTO transactions(transaction_no, type, date, description, total_amount, net_amount, reference)
          VALUES(?, ?, ?, ?, ?, ?, ?)
        `).run(
          transactionNo,
          'adjustment',
          date,
          `Stock Adjustment - ${item.name}: ${reason} `,
          absValue,
          absValue,
          reference || null
        );

        const transactionId = transactionResult.lastInsertRowid as number;

        // Record stock movement
        this.db.prepare(`
          INSERT INTO stock_movements(item_id, transaction_id, type, quantity, unit_cost, total_cost, reference, notes)
          VALUES(?, ?, 'adjustment', ?, ?, ?, ?, ?)
        `).run(
          itemId,
          transactionId,
          quantity,
          item.averageCost,
          adjustmentValue,
          reference || `Adjustment #${transactionNo} `,
          reason
        );

        // Post the balancing GL journal (only when there is a non-zero value).
        if (absValue >= 0.005) {
          const inventoryAccount = this.db.prepare("SELECT id FROM accounts WHERE code = '1400' LIMIT 1").get() as any;
          if (!inventoryAccount) {
            throw new Error("Accounting Error: Inventory account (1400) not found. Cannot post stock adjustment journal.");
          }
          // Stock Adjustment expense/income account. Prefer a dedicated 6500 if
          // present, else fall back to Other Expenses (6400).
          const adjAccount =
            (this.db.prepare("SELECT id FROM accounts WHERE code = '6500' LIMIT 1").get() as any) ||
            (this.db.prepare("SELECT id FROM accounts WHERE code = '6400' LIMIT 1").get() as any);
          if (!adjAccount) {
            throw new Error("Accounting Error: no stock-adjustment offset account (6500/6400) found.");
          }

          const insertLine = this.db.prepare(`
            INSERT INTO transaction_lines(transaction_id, account_id, description, debit_amount, credit_amount)
            VALUES(?, ?, ?, ?, ?)
          `);

          if (quantity > 0) {
            // Stock increase: Dr Inventory / Cr adjustment gain
            insertLine.run(transactionId, inventoryAccount.id, `Stock increase - ${item.name}`, absValue, 0);
            insertLine.run(transactionId, adjAccount.id, `Stock adjustment gain - ${item.name}`, 0, absValue);
          } else {
            // Stock decrease (write-down): Dr adjustment loss / Cr Inventory
            insertLine.run(transactionId, adjAccount.id, `Stock adjustment loss - ${item.name}`, absValue, 0);
            insertLine.run(transactionId, inventoryAccount.id, `Stock decrease - ${item.name}`, 0, absValue);
          }
        }

        // Update item quantity
        this.db.prepare('UPDATE items SET quantity_in_stock = ? WHERE id = ?').run(newQty, itemId);

        this.audit.logAction({
          action: 'ADJUST_STOCK',
          entityType: 'items',
          entityId: itemId,
          newValues: { adjustment: quantity, newTotal: newQty, reason }
        });

        return { success: true, message: 'Stock adjusted successfully' };
      });
    } catch (error: any) {
      console.error('Adjust stock error:', error);
      return { success: false, message: 'Failed to adjust stock: ' + error.message };
    }
  }

  getStockMovements(itemId?: number): StockMovement[] {
    try {
      let query = `
        SELECT
        sm.*,
          i.name as item_name,
          i.code as item_code,
          t.transaction_no
        FROM stock_movements sm
        JOIN items i ON sm.item_id = i.id
        LEFT JOIN transactions t ON sm.transaction_id = t.id
        WHERE 1 = 1
          `;
      const params: any[] = [];

      if (itemId) {
        query += ' AND sm.item_id = ?';
        params.push(itemId);
      }

      query += ' ORDER BY sm.created_at DESC';

      const movements = this.db.prepare(query).all(...params);
      return movements.map((m: any) => ({
        id: m.id,
        itemId: m.item_id,
        transactionId: m.transaction_id,
        type: m.type,
        quantity: m.quantity,
        unitCost: m.unit_cost,
        totalCost: m.total_cost,
        reference: m.reference,
        notes: m.notes,
        createdAt: m.created_at,
      }));
    } catch (error) {
      console.error('Get stock movements error:', error);
      return [];
    }
  }

  getStockValuation(): { totalValue: number; totalQuantity: number; itemCount: number } {
    try {
      const result = this.db.prepare(`
        SELECT
        COALESCE(SUM(quantity_in_stock * average_cost), 0) as total_value,
          COALESCE(SUM(quantity_in_stock), 0) as total_quantity,
          COUNT(*) as item_count
        FROM items
        WHERE is_active = 1
          `).get();

      return {
        totalValue: (result as any)?.total_value || 0,
        totalQuantity: (result as any)?.total_quantity || 0,
        itemCount: (result as any)?.item_count || 0,
      };
    } catch (error) {
      console.error('Get stock valuation error:', error);
      return { totalValue: 0, totalQuantity: 0, itemCount: 0 };
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private generateItemCode(): string {
    const items = this.db.prepare("SELECT code FROM items WHERE code LIKE 'ITM-%'").all() as any[];
    
    let maxSequence = 0;
    items.forEach(item => {
      const match = item.code.match(/ITM-(\d+)/);
      if (match) {
        const seq = parseInt(match[1]);
        if (seq > maxSequence) maxSequence = seq;
      }
    });

    return `ITM-${(maxSequence + 1).toString().padStart(4, '0')}`;
  }

  private generateTransactionNo(type: string): string {
    const date = new Date();
    const year = date.getFullYear();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');

    const lastTransaction = this.db.prepare(`
      SELECT transaction_no FROM transactions 
      WHERE transaction_no LIKE ?
      ORDER BY id DESC LIMIT 1
    `).get(`${type}-${year}-%`);

    let sequence = 1;
    if (lastTransaction) {
      const parts = (lastTransaction as any).transaction_no.split('-');
      sequence = parseInt(parts[2]) + 1;
    }

    // Probe for a free slot; on collision fall back to a random suffix so a
    // concurrent insert can't produce a duplicate transaction_no.
    const checkExisting = this.db.prepare('SELECT 1 FROM transactions WHERE transaction_no = ?');
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = `${type}-${year}-${(sequence + attempt).toString().padStart(4, '0')}`;
      if (!checkExisting.get(candidate)) return candidate;
    }
    return `${type}-${year}-${sequence.toString().padStart(4, '0')}-${crypto.randomInt(0, 10000).toString().padStart(4, '0')}`;
  }

  private createPurchaseAccountingEntries(
    transactionId: number,
    data: AddStockData,
    totalAmount: number,
    purchaseCost: number,
    gstAmount: number
  ): void {
    // BUG FIX (double-entry integrity): previously each posting was wrapped in
    // `if (account)`, so a missing account silently shrank one side of the
    // journal while the other posted in full — producing a permanently
    // unbalanced transaction with no error. We now build the lines first,
    // REQUIRE every account to exist (throw otherwise), and validate that
    // debits === credits (compared in integer cents) before writing. Because
    // addStock runs inside safeTransaction, a throw rolls back the whole purchase.
    const requireAccount = (code: string, label: string): number => {
      const acc = this.db.prepare('SELECT id FROM accounts WHERE code = ?').get(code) as any;
      if (!acc) {
        throw new Error(`Accounting Error: ${label} account (${code}) not found. Cannot post a balanced purchase journal.`);
      }
      return acc.id as number;
    };

    interface Line { accountId: number; contactId?: number | null; description: string; debit: number; credit: number; gstAmount?: number; gstType?: 'input' | 'output'; }
    const lines: Line[] = [];

    // 1. Debit: Inventory Account (purchase cost excl. GST)
    lines.push({
      accountId: requireAccount('1400', 'Inventory'),
      description: 'Inventory Purchase',
      debit: purchaseCost,
      credit: 0
    });

    // 2. Debit: GST Input (if applicable)
    if (gstAmount > 0) {
      lines.push({
        accountId: requireAccount('1500', 'GST Input'),
        description: 'GST Input',
        debit: gstAmount,
        credit: 0,
        gstAmount,
        gstType: 'input'
      });
    }

    // 3. Credit: Cash/Bank or Supplier (Accounts Payable) — full total incl. GST
    if (data.paymentMode === 'credit' && data.supplierId) {
      const supplier = this.db.prepare('SELECT account_id FROM contacts WHERE id = ?').get(data.supplierId) as any;
      if (!supplier || !supplier.account_id) {
        throw new Error(`Accounting Error: supplier ${data.supplierId} has no linked payable account. Cannot post credit purchase.`);
      }
      lines.push({
        accountId: supplier.account_id,
        contactId: data.supplierId,
        description: 'Purchase on Credit',
        debit: 0,
        credit: totalAmount
      });
    } else {
      const paymentAccountCode = data.paymentMode === 'bank' ? '1200' : '1100';
      lines.push({
        accountId: requireAccount(paymentAccountCode, 'Payment'),
        description: `Purchase - ${data.paymentMode}`,
        debit: 0,
        credit: totalAmount
      });
    }

    // Validate the journal balances (in integer cents) before writing anything.
    const debitCents = lines.reduce((s, l) => s + toCents(l.debit), 0);
    const creditCents = lines.reduce((s, l) => s + toCents(l.credit), 0);
    if (debitCents !== creditCents) {
      throw new Error(`Double Entry Rule: purchase journal not balanced. Debits: ${fromCents(debitCents).toFixed(2)}, Credits: ${fromCents(creditCents).toFixed(2)}`);
    }

    const insertLine = this.db.prepare(`
      INSERT INTO transaction_lines(transaction_id, account_id, contact_id, description, debit_amount, credit_amount, gst_amount, gst_type)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const l of lines) {
      insertLine.run(
        transactionId,
        l.accountId,
        l.contactId ?? null,
        l.description,
        roundMoney(l.debit),
        roundMoney(l.credit),
        roundMoney(l.gstAmount ?? 0),
        l.gstType ?? null
      );
    }
  }

  private mapItemFromDb(row: any): Item {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      category: row.category,
      unit: row.unit,
      purchasePrice: row.purchase_price,
      sellingPrice: row.selling_price,
      averageCost: row.average_cost,
      quantityInStock: row.quantity_in_stock,
      reorderLevel: row.reorder_level,
      gstApplicable: row.gst_applicable === 1,
      gstRate: row.gst_rate,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
