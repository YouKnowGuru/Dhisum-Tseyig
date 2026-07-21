# Accounting Fixes — Test Suite

Self-contained test harness for the bug fixes applied to the accounting logic
in `New folder/app/src/services/` and `src/database/`. No external test
framework is required; the suite runs directly with Node and the project's own
`better-sqlite3` dependency.

## Running

```
npm test
```

from `New folder/app/`. This executes `scripts/tests/run-tests.mjs`.

The exit code is `0` if every test passes, `1` otherwise — suitable for CI.

## How it works

1. `setup.mjs` opens an in-memory `better-sqlite3` DB per test, recreates the
   schema subset the fixes touch (accounts, transactions, transaction_lines,
   invoices, gst_entries, period_locks, items, stock_movements), and seeds
   the Chart of Accounts.
2. Each test in `run-tests.mjs` exercises one fix by:
   - Seeding relevant rows.
   - Running the **same SQL** the fix introduces in production.
   - Asserting outcomes via `assertEqual` / `assert`.
3. Tests are isolated — each opens its own DB so failures never leak.

## Tests

| ID  | Bug                                                              | Method                                     |
| --- | ---------------------------------------------------------------- | ------------------------------------------ |
| #1  | `validateBalance` rounding-mask imbalance                        | Direct epsilon comparison                  |
| #2  | InventoryService opening stock produces unbalanced orphan journal | Throws when 1400/3100 missing              |
| #6  | `calculateOutstanding` cross-contamination                       | Per-contact balance isolation              |
| #8  | Void leaves orphan `gst_entries`                                 | `DELETE FROM gst_entries` on void          |
| #9  | Mixed GST rates in a sale                                        | Per-rate grouping                          |
| #11 | Atomic stock deduction                                           | `UPDATE … WHERE qty >= ?` race correctness  |
| #14 | Void invoice sets illegal `payment_status='void'` (CHECK fail)   | CHECK constraint enforcement + recovery    |
| #15 | `invoice_no` UNIQUE-collision lacks retry                        | UNIQUE catch path + fresh candidate retry  |
| #17 | `transaction_lines.gst_rate` not persisted                       | INSERT + SELECT round-trip                 |
| #18 | Refund engine items ignore discount factor                       | Discounted-line calc matches accounting    |
| #20 | `createOpeningBalanceEntry` bypasses period lock                 | Locked-period detection                    |
| #28 | Transfer pre-flight and engine balance queries ignore normal side | AP balance reflects credit-normal          |

## Adding a new test

1. Add a function in `run-tests.mjs` that seeds + calls the SQL/fix + asserts.
2. Add a `runTest('description', yourFn);` line in the `=== Run all ===`
   section.
3. Run `npm test` and verify green.

Keep tests deterministic — never depend on wall-clock time, never mutate
the shared DB, and always release prepared statements via per-test DB scope.
