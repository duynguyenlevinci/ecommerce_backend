/**
 * Money formatting & defaults used across the application.
 */
export const MONEY = {
  /** Decimal places kept when serializing monetary values. */
  DECIMAL_PLACES: 2,
  /** Canonical "no amount" / "free" value, formatted to DECIMAL_PLACES. */
  ZERO_AMOUNT: '0.00',
} as const;
