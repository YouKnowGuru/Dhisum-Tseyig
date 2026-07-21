/**
 * Input Validation Schemas using Zod
 * Bank-Level Security Validation
 */

import { z } from 'zod';

// ============================================
// Common Validators
// ============================================

export const IdSchema = z.number().int().positive().max(2147483647);

export const EmailSchema = z.string().email().max(254).toLowerCase().trim();

export const UsernameSchema = z.string()
  .min(3)
  .max(50)
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export const PasswordSchema = z.string()
  .min(8)
  .max(128)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const MoneyAmountSchema = z.number().nonnegative().max(999999999.99);

// ============================================
// Authentication Validators
// ============================================

export const LoginCredentialsSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(256),
});

export const CreateUserSchema = z.object({
  username: UsernameSchema,
  email: EmailSchema.optional().nullable(),
  password: PasswordSchema,
  fullName: z.string().min(1).max(100),
  role: z.enum(['admin', 'staff']).default('staff'),
});

export const ChangePasswordSchema = z.object({
  userId: IdSchema,
  oldPassword: z.string().max(256).optional(),
  newPassword: PasswordSchema,
});

// ============================================
// Inventory Validators
// ============================================

export const CreateItemSchema = z.object({
  code: z.string().max(50).optional().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  unit: z.string().max(50).default('pcs'),
  purchasePrice: MoneyAmountSchema.default(0),
  sellingPrice: MoneyAmountSchema.default(0),
  reorderLevel: z.number().nonnegative().default(10),
  gstApplicable: z.boolean().default(true),
  gstRate: z.number().min(0).max(100).default(5),
  openingStock: z.number().nonnegative().default(0),
  openingPurchasePrice: MoneyAmountSchema.default(0),
});

export const UpdateItemSchema = z.object({
  id: IdSchema,
  data: CreateItemSchema.partial(),
});

export const StockMovementSchema = z.object({
  itemId: IdSchema.optional().nullable(),
  itemName: z.string().max(200).optional().nullable(),
  quantity: z.number().positive().max(1000000),
  purchasePrice: MoneyAmountSchema.default(0),
  sellingPrice: MoneyAmountSchema.optional().nullable(),
  gstApplicable: z.boolean().optional(),
  gstRate: z.number().min(0).max(100).optional().nullable(),
  supplierId: IdSchema.optional().nullable(),
  paymentMode: z.enum(['cash', 'bank', 'credit', 'card', 'upi', 'mBOB', 'BNB', 'TPay', 'DrukPNB', 'BDBL', 'DKBank']).default('cash'),
  type: z.enum(['in', 'out']).default('in'),
  reference: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// ============================================
// Sales / POS Validators
// ============================================

export const SaleItemSchema = z.object({
  itemId: IdSchema,
  quantity: z.number().positive().max(10000),
  unitPrice: MoneyAmountSchema,
  price: MoneyAmountSchema.optional(), // kept for backward compatibility
  discount: z.number().nonnegative().max(100).default(0),
  gstRate: z.number().min(0).max(100).default(5),
  description: z.string().max(1000).optional().nullable(),
});

export const SaleDataSchema = z.object({
  customerId: IdSchema.nullable().optional(),
  items: z.array(SaleItemSchema).min(1).max(100),
  paymentMode: z.enum(['cash', 'bank', 'credit', 'card', 'upi', 'mBOB', 'BNB', 'TPay', 'DrukPNB', 'BDBL', 'DKBank']),
  discountAmount: MoneyAmountSchema.default(0),
  notes: z.string().max(1000).optional().nullable(),
  taxType: z.enum(['standard', 'domestic']).default('standard'),
});

// ============================================
// Contact Validators
// ============================================

export const CreateContactSchema = z.object({
  type: z.enum(['customer', 'supplier']),
  name: z.string().min(1).max(200),
  contactPerson: z.string().max(100).optional().nullable(),
  phone: z.string().min(1, 'Phone number is required').max(20),
  email: z.string().max(254).email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(), // legacy
  addressStructured: z.object({
    street: z.string().max(300).optional().nullable(),
    gewog: z.string().max(100).optional().nullable(),
    dzongkhag: z.string().max(100).optional().nullable(),
  }).optional().nullable(),
  creditLimit: MoneyAmountSchema.default(0),
  creditDays: z.number().int().nonnegative().max(365).default(0),
  openingBalance: MoneyAmountSchema.default(0),
  gstNumber: z.string().max(50).optional().nullable(),
});

export const UpdateContactSchema = z.object({
  id: IdSchema,
  data: CreateContactSchema.partial(),
});

// ============================================
// Transaction Validators
// ============================================

export const ReceiveMoneySchema = z.object({
  contactId: IdSchema.nullable(),
  accountId: IdSchema.nullable().optional(),
  amount: MoneyAmountSchema,
  paymentMode: z.enum(['cash', 'bank', 'card', 'upi', 'mBOB', 'BNB', 'TPay', 'DrukPNB', 'BDBL', 'DKBank']),
  reference: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  date: DateStringSchema,
});

export const PayMoneySchema = z.object({
  contactId: IdSchema.nullable(),
  accountId: IdSchema.nullable().optional(),
  amount: MoneyAmountSchema,
  paymentMode: z.enum(['cash', 'bank', 'card', 'upi', 'mBOB', 'BNB', 'TPay', 'DrukPNB', 'BDBL', 'DKBank']),
  reference: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  date: DateStringSchema,
});

export const VoidTransactionSchema = z.object({
  transactionId: IdSchema,
  reason: z.string().min(1).max(500),
});

// ============================================
// GST Validators
// ============================================

export const GSTPeriodSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

// ============================================
// Settings Validators
// ============================================

export const ClosePeriodSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export const SettingKeySchema = z.string().max(100).regex(/^[a-zA-Z0-9_]+$/);

// ============================================
// Cloud Backup Validators
// ============================================

export const CloudBackupSettingsSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(['30min', 'hourly', 'daily']),
  targets: z.object({
    googleDrive: z.boolean(),
    mega: z.boolean(),
  }),
});

export const MegaCredentialsSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(256),
});

// ============================================
// BUG FIX H-2 / M-6 / M-12 / M-7 — extra validators
// ============================================

/** Allowed targets for cloud backup runs. Never accept arbitrary strings. */
export const CloudBackupTargetEnum = z.enum(['googleDrive', 'mega']);
export const CloudBackupTargetsSchema = z.array(CloudBackupTargetEnum).max(4);

/** Reports date inputs. */
export const AsOfDateSchema = z.object({
  asOfDate: DateStringSchema.optional(),
}).passthrough();

export const DateRangeOnlySchema = z.object({
  startDate: DateStringSchema,
  endDate: DateStringSchema,
}).passthrough();

/** Held-carts handler. */
export const HoldCartSaveSchema = z.object({
  cartName: z.string().min(1).max(120),
  customerId: IdSchema.nullable().optional(),
  items: z.array(z.unknown()).max(500),
});

export const IdArgSchema = z.object({ id: IdSchema }).passthrough();

/** Expense / quotation / recurring. */
export const ExpenseCreateSchema = z.object({
  category: z.string().max(80),
  amount: MoneyAmountSchema,
  date: DateStringSchema,
  description: z.string().max(500).optional().nullable(),
}).passthrough();

export const QuotationStatusEnum = z.enum(['draft', 'sent', 'accepted', 'rejected', 'converted']);
export const PurchaseStatusEnum = z.enum(['draft', 'sent', 'received', 'cancelled', 'partial']);
export const PaymentModeStrict = z.enum(['cash', 'bank', 'card', 'credit', 'upi', 'mBOB', 'BNB', 'TPay', 'DrukPNB', 'BDBL', 'DKBank']);

export const QuotationStatusSchema = z.object({ id: IdSchema, status: QuotationStatusEnum }).passthrough();
export const PurchaseStatusSchema = z.object({
  id: IdSchema,
  status: PurchaseStatusEnum,
  paymentMode: PaymentModeStrict.optional(),
}).passthrough();

export const ConvertToSaleSchema = z.object({
  id: IdSchema,
  paymentMode: PaymentModeStrict,
}).passthrough();

export const RecurringCreateSchema = z.object({
  name: z.string().max(120),
  type: z.enum(['payment', 'receipt']),
  amount: MoneyAmountSchema,
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  nextDueDate: DateStringSchema,
  accountId: IdSchema,
  contactId: z.union([IdSchema, z.literal(0)]).optional().nullable(),
  paymentMode: PaymentModeStrict.optional(),
  description: z.string().max(1000).optional().nullable(),
}).passthrough();

/** Refunds. */
export const RefundCreateSchema = z.object({
  originalTransactionId: IdSchema,
  customerId: IdSchema.optional().nullable(),
  date: DateStringSchema,
  reason: z.string().min(1).max(500),
  refundMode: PaymentModeStrict,
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(z.object({
    itemId: IdSchema,
    quantity: z.number().positive().max(10000),
    unitPrice: MoneyAmountSchema,
    gstRate: z.number().min(0).max(100).optional().nullable(),
    gstApplicable: z.boolean().optional().nullable(),
  })).min(1).max(500),
}).passthrough();

/** Employees — payroll-managed list. */
export const EmployeeCreateSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(254).or(z.literal('')).optional().nullable(),
  position: z.string().max(80).optional().nullable(),
  department: z.string().max(80).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  salary: MoneyAmountSchema,
  joinDate: DateStringSchema.or(z.literal('')).optional().nullable(),
  pf_rate: z.number().min(0).max(100).optional().nullable(),
  gis_amount: MoneyAmountSchema.optional().nullable(),
  tds_rate: z.number().min(0).max(100).optional().nullable(),
  hc_rate: z.number().min(0).max(100).optional().nullable(),
}).passthrough();

export const EmployeeUpdateSchema = EmployeeCreateSchema.partial();

export const PayrollProcessSchema = z.object({
  month: z.string().min(1).max(2),
  year: z.string().min(4).max(4),
  paymentMode: PaymentModeStrict.optional(),
  userId: IdSchema.optional(),
  employeeIds: z.array(IdSchema).max(500).optional(),
  dryRun: z.boolean().optional(),
}).passthrough();

/** Purchase-orders / recurring / split-payment. */
export const POGeneralCreateSchema = z.object({
  supplierId: IdSchema,
  items: z.array(z.unknown()).min(1).max(500),
  notes: z.string().max(1000).optional().nullable(),
  date: DateStringSchema.optional(),
}).passthrough();

export const QuotationCreateSchema = z.object({
  customerId: IdSchema.nullable().optional(),
  items: z.array(z.unknown()).min(1).max(500),
  notes: z.string().max(1000).optional().nullable(),
  expiryDate: DateStringSchema.optional(),
}).passthrough();

export const SplitPaymentProcessSaleSchema = z.object({
  customerId: IdSchema.nullable().optional(),
  items: z.array(z.unknown()).min(1).max(100),
  payments: z.array(z.object({
    mode: PaymentModeStrict,
    amount: MoneyAmountSchema,
  })).min(1).max(10),
  discountAmount: MoneyAmountSchema.default(0),
  notes: z.string().max(1000).optional().nullable(),
  taxType: z.enum(['standard', 'domestic']).default('standard'),
}).passthrough();

/** Tiered pricing. */
export const TieredPriceListCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  items: z.array(z.unknown()).max(500).optional(),
}).passthrough();

export const TieredAssignSchema = z.object({
  customerId: IdSchema,
  priceListId: IdSchema.nullable(),
}).passthrough();

export const TieredItemPriceSchema = z.object({
  itemId: IdSchema,
  priceListId: IdSchema,
}).passthrough();

/** CSV import — bound the body size and shape. */
export const CsvParseFileSchema = z.object({
  sheetIndex: z.number().int().min(0).max(50).optional(),
});

/** Barcodes. */
export const BarcodeCreateSchema = z.object({
  barcode: z.string().min(1).max(80),
  itemId: IdSchema,
});

/** Settings:update — cap number of entries and force stringified values. */
export const SettingsUpdateSchema = z.record(
  z.string().regex(/^(?!__proto__|constructor|prototype)[a-zA-Z0-9_]{1,100}$/),
  z.union([z.string().max(10000), z.number().max(1e12), z.boolean(), z.null(), z.undefined()]),
).refine((obj) => Object.keys(obj).length <= 100, { message: 'Too many settings keys' });

/** Cloud-backup runNow — restrict to known targets. */
export const CloudBackupRunNowSchema = CloudBackupTargetsSchema;

// ============================================
// SaaS API Request Validator
// ============================================

/**
 * BUG FIX M-6: header allow-list. Enforces a tight set of safe names so the
 * renderer cannot smuggle `Host`, `Authorization`, `Cookie`, `X-Forwarded-*`
 * etc. into outgoing requests.
 */
export const SafeHeaderNameSchema = z.string().regex(/^[a-zA-Z0-9-]{1,64}$/);
export const SAFE_SAAS_HEADERS = new Set([
  'accept',
  'accept-language',
  'accept-encoding',
  'content-type',
  'authorization',
  'user-agent',
  'x-request-id',
  'x-trace-id',
  'if-match',
  'if-none-match',
]);

export const SaaSRequestSchema = z.object({
  url: z.string().url().max(2000),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  body: z.any().optional(),
  headers: z
    .record(SafeHeaderNameSchema, z.string().max(1000))
    .default({})
    .refine(
      (h) => Object.keys(h).every((k) => SAFE_SAAS_HEADERS.has(k.toLowerCase())),
      { message: 'Header name not allowed' }
    ),
});

// Type exports
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
export type CreateUserData = z.infer<typeof CreateUserSchema>;
export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;
