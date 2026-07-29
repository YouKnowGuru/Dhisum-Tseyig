/**
 * Central money helpers.
 *
 * Money is STORED as a REAL (Nu., 2 decimal places) in SQLite — this module
 * does NOT change storage. What it fixes is PRECISION at the boundary:
 *   - every monetary value written to the ledger is rounded to exactly 2dp, and
 *   - balance comparisons are done in INTEGER CENTS, not floats.
 *
 * That eliminates the classic float drift (0.1 + 0.2 !== 0.3) that could make a
 * legitimate balanced journal fail validation, or a trial-balance "balanced"
 * check be off by a fraction of a Ngultrum after thousands of rows.
 */

/** Round a monetary value to exactly 2 decimal places (half away from zero). */
export function roundMoney(value: number): number {
  if (value === null || value === undefined || isNaN(value)) return 0;
  // Multiply, round, divide in one expression avoids most binary-float noise;
  // adding a tiny epsilon pushes values like 1.005 to round up consistently.
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Convert a monetary value to integer cents (e.g. 12.34 -> 1234). */
export function toCents(value: number): number {
  return Math.round(roundMoney(value) * 100);
}

/** Convert integer cents back to a Nu. value (e.g. 1234 -> 12.34). */
export function fromCents(cents: number): number {
  return (cents || 0) / 100;
}

/**
 * Compare two money totals in integer cents. Returns true when they are equal
 * to the exact cent. Use this instead of `a === b` or a float epsilon for
 * debit-vs-credit balance checks.
 */
export function moneyEquals(a: number, b: number): boolean {
  return toCents(a) === toCents(b);
}

/** Absolute difference between two money totals, expressed in cents. */
export function centsDiff(a: number, b: number): number {
  return Math.abs(toCents(a) - toCents(b));
}
