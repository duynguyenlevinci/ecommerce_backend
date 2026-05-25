/**
 * Product storefront types returned by `GET /products`.
 *
 * - `SIMPLE`        — product has 0 or 1 variant; a single `price` is exposed.
 * - `CONFIGURATION` — product has 2+ variants; `minPrice` & `maxPrice` are
 *   exposed instead.
 */
export const PRODUCT_TYPE = {
  SIMPLE: 'simple',
  CONFIGURATION: 'configuration',
} as const;

export type ProductType = (typeof PRODUCT_TYPE)[keyof typeof PRODUCT_TYPE];

/**
 * A product becomes `CONFIGURATION` when it has strictly more variants than
 * this threshold.
 */
export const PRODUCT_SIMPLE_MAX_VARIANTS = 1;
