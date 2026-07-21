// Shared schema/seed builder for accounting-tests.
// Re-creates the minimum subset of tables our fixes touch, in an in-memory
// SQLite (or a path on disk) so each test starts from a clean slate.

import Database from 'better-sqlite3';

export function openDb() {
  // ':memory:' gives a fresh DB per call. better-sqlite3 is fully synchronous.
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = MEMORY');
  return db;
}

/**
 * Apply the schema changes exercised by the fixes. We keep this mirror of
 * DatabaseManager.ts schema. If upstream schema changes here, this mirror must
 * be updated to match.
 */
export function createSchema(db) {
  db.exec(`
    CREATE TABLE accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT,
      type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','income','expense')),
      subtype TEXT,
      parent_id INTEGER,
      is_system INTEGER DEFAULT 0
    );

    CREATE TABLE contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('customer','supplier')),
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      address_street TEXT,
      address_gewog TEXT,
      address_dzongkhag TEXT,
      credit_limit REAL DEFAULT 50000,
      credit_days INTEGER DEFAULT 30,
      opening_balance REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      gst_number TEXT,
      account_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_no TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('sale','purchase','receipt','payment','transfer','adjustment','journal')),
      date DATE NOT NULL,
      reference TEXT,
      contact_id INTEGER,
      description TEXT,
      total_amount REAL NOT NULL DEFAULT 0,
      gst_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      net_amount REAL NOT NULL DEFAULT 0,
      payment_mode TEXT,
      status TEXT DEFAULT 'completed',
      is_void INTEGER DEFAULT 0,
      void_reason TEXT,
      voided_at DATETIME,
      voided_by INTEGER,
      invoice_id INTEGER,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE transaction_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      contact_id INTEGER,
      item_id INTEGER,
      description TEXT,
      debit_amount REAL DEFAULT 0,
      credit_amount REAL DEFAULT 0,
      gst_amount REAL DEFAULT 0,
      gst_rate REAL DEFAULT 0,           -- #17 migration column
      gst_type TEXT CHECK (gst_type IN ('input','output'))
    );

    CREATE TABLE invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT UNIQUE NOT NULL,
      transaction_id INTEGER,
      contact_id INTEGER,
      date DATE NOT NULL,
      due_date DATE,
      subtotal REAL DEFAULT 0,
      gst_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'unpaid'
        CHECK (payment_status IN ('unpaid','partial','paid','overdue')),
      is_printed INTEGER DEFAULT 0,
      print_count INTEGER DEFAULT 0,
      is_void INTEGER DEFAULT 0,
      notes TEXT,
      terms TEXT,
      tax_type TEXT DEFAULT 'standard',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      item_id INTEGER,
      description TEXT,
      quantity REAL DEFAULT 0,
      unit_price REAL DEFAULT 0,
      gst_rate REAL DEFAULT 0,
      gst_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0
    );

    CREATE TABLE items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      unit TEXT DEFAULT 'pcs',
      purchase_price REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      average_cost REAL DEFAULT 0,
      quantity_in_stock REAL DEFAULT 0,
      reorder_level REAL DEFAULT 10,
      gst_applicable INTEGER DEFAULT 1,
      gst_rate REAL DEFAULT 5,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      transaction_id INTEGER,
      type TEXT NOT NULL CHECK (type IN ('in','out','adjustment')),
      quantity REAL NOT NULL,
      unit_cost REAL,
      total_cost REAL,
      reference TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE gst_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER,
      type TEXT NOT NULL CHECK (type IN ('input','output')),
      amount REAL NOT NULL,
      rate REAL,
      month INTEGER,
      year INTEGER,
      is_filed INTEGER DEFAULT 0,
      filed_at DATETIME
    );

    CREATE TABLE period_locks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER,
      month INTEGER,
      is_locked INTEGER DEFAULT 0
    );

    CREATE TABLE audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT,
      entity_type TEXT,
      entity_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Seed the minimum Chart of Accounts used by the fixes:
 *   1100 Cash (asset), 1200 Bank (asset), 1300 AR control (asset),
 *   2100 AP control (liability), 2200 GST liability (liability),
 *   3100 Opening Balance Equity (equity), 4000 Sales Revenue (income),
 *   5000 COGS (expense), 1400 Inventory (asset), 6400 Discount Allowed (expense).
 */
export function seedAccounts(db) {
  const accounts = [
    { code: '1100', name: 'Cash', type: 'asset', subtype: 'current_asset' },
    { code: '1200', name: 'Bank', type: 'asset', subtype: 'current_asset' },
    { code: '1300', name: 'Accounts Receivable', type: 'asset', subtype: 'current_asset' },
    { code: '1400', name: 'Inventory', type: 'asset', subtype: 'current_asset' },
    { code: '2100', name: 'Accounts Payable', type: 'liability', subtype: 'current_liability' },
    { code: '2200', name: 'GST Payable', type: 'liability', subtype: 'current_liability' },
    { code: '3100', name: 'Opening Balance Equity', type: 'equity', subtype: 'equity' },
    { code: '4000', name: 'Sales Revenue', type: 'income', subtype: 'revenue' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense', subtype: 'cogs' },
    { code: '6400', name: 'Discount Allowed', type: 'expense', subtype: 'other_expense' }
  ];
  const insert = db.prepare(`INSERT INTO accounts (code, name, type, subtype) VALUES (?, ?, ?, ?)`);
  for (const a of accounts) {
    insert.run(a.code, a.name, a.type, a.subtype);
  }
}

export function getAccountId(db, code) {
  return db.prepare('SELECT id FROM accounts WHERE code = ?').get(code).id;
}
